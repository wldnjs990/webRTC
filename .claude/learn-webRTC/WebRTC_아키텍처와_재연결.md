# WebRTC 아키텍처와 재연결 메커니즘

> 작성일: 2025-12-31
> 대상: 주니어 개발자
> 목적: P2P 연결 후 데이터 흐름, 서버 부담, 재연결 메커니즘 완벽 이해

---

## 목차

1. [P2P 연결 후 데이터 흐름](#1-p2p-연결-후-데이터-흐름)
2. [서버 vs 클라이언트 부담](#2-서버-vs-클라이언트-부담)
3. [WebRTC가 데이터를 견디는 원리](#3-webrtc가-데이터를-견디는-원리)
4. [연결 끊김과 재연결](#4-연결-끊김과-재연결)
5. [실전 재연결 구현](#5-실전-재연결-구현)
6. [TURN 서버 필요성](#6-turn-서버-필요성)

---

## 1. P2P 연결 후 데이터 흐름

### 1.1 연결 전 vs 연결 후

```
┌──────────────────────────────────────────────────────────────┐
│               연결 전 (시그널링 단계)                          │
└──────────────────────────────────────────────────────────────┘

사용자 A                 시그널링 서버                 사용자 B
(브라우저)              (Node.js)                   (브라우저)
   │                        │                          │
   ├──── Offer ────────────→│                          │
   │                        ├──── Offer ──────────────→│
   │                        │                          │
   │                        │←──── Answer ─────────────┤
   │←──── Answer ───────────┤                          │
   │                        │                          │
   ├──── ICE ──────────────→│                          │
   │                        ├──── ICE ────────────────→│
   │                        │←──── ICE ────────────────┤
   │←──── ICE ──────────────┤                          │

[시그널링 서버 역할]
- Offer/Answer/ICE 전달만
- 실제 데이터는 전달하지 않음
- 연결 설정 정보만 중계


┌──────────────────────────────────────────────────────────────┐
│               연결 후 (P2P 통신)                              │
└──────────────────────────────────────────────────────────────┘

사용자 A                                              사용자 B
(브라우저)                                           (브라우저)
   │                                                     │
   │◄─────────── P2P 직접 연결 (UDP) ────────────────►│
   │                                                     │
   │  비디오 스트림 ────────────────────────────────►  │
   │  오디오 스트림 ────────────────────────────────►  │
   │  데이터 채널   ────────────────────────────────►  │
   │                                                     │
   │  ◄─────────── 상대방 미디어 ──────────────────  │

[시그널링 서버 역할]
❌ 없음! 서버를 거치지 않음!
✅ 브라우저끼리 직접 통신
```

### 1.2 누가 데이터를 관리하나?

```javascript
// ===== 오해하기 쉬운 부분 =====

// ❌ 오해: 서버가 pc 인스턴스를 관리한다?
// 아니요!

// ✅ 정답: 각 브라우저가 자신의 pc 인스턴스를 관리

// [사용자 A 브라우저]
const pcA = new RTCPeerConnection(config);
// ← A의 브라우저 메모리에 존재
// ← A의 CPU/GPU가 인코딩/디코딩
// ← A의 네트워크로 전송

// [사용자 B 브라우저]
const pcB = new RTCPeerConnection(config);
// ← B의 브라우저 메모리에 존재
// ← B의 CPU/GPU가 인코딩/디코딩
// ← B의 네트워크로 수신
```

### 1.3 실제 데이터 흐름 상세

```
┌─────────────────────────────────────────────────────────────┐
│         사용자 A (송신)                                      │
└─────────────────────────────────────────────────────────────┘

1. 카메라/마이크 ─→ MediaStream
   └→ getUserMedia()

2. MediaStream ─→ RTCPeerConnection
   └→ addTrack()

3. RTCPeerConnection 내부 처리:
   ┌──────────────────────────────┐
   │ ① 비디오 인코딩 (VP8/H.264) │ ← CPU/GPU 사용
   │ ② 오디오 인코딩 (Opus)      │
   │ ③ RTP 패킷으로 분할         │
   │ ④ SRTP 암호화              │
   │ ⑤ UDP로 전송               │
   └──────────────────────────────┘
                ↓
           인터넷 (P2P)
                ↓
┌─────────────────────────────────────────────────────────────┐
│         사용자 B (수신)                                      │
└─────────────────────────────────────────────────────────────┘

4. RTCPeerConnection 수신:
   ┌──────────────────────────────┐
   │ ① UDP 패킷 수신             │
   │ ② SRTP 복호화              │
   │ ③ RTP 패킷 조합             │
   │ ④ 비디오/오디오 디코딩      │ ← CPU/GPU 사용
   └──────────────────────────────┘
                ↓
5. MediaStream ─→ <video> 요소
   └→ videoElement.srcObject
```

---

## 2. 서버 vs 클라이언트 부담

### 2.1 서버 부담 비교

```javascript
// ===== 패턴 1: 서버 중계 방식 (WebRTC 없이) =====

사용자 A ─────→ [서버] ←───── 사용자 B
      비디오      ↓↓      비디오
                [중계]
                  ↓
            엄청난 부담!

// 10명이 화상 회의 시:
// - 서버가 모든 영상을 받아서 다시 전송
// - 대역폭: 10명 × 1Mbps 업로드 + 10명 × 1Mbps 다운로드 = 20Mbps
// - CPU: 인코딩/디코딩/믹싱
// - 비용: 서버 스펙 ↑, 대역폭 요금 ↑↑↑


// ===== 패턴 2: WebRTC P2P 방식 =====

사용자 A ←──────────────→ 사용자 B
      비디오 직접 전송

// 10명이 화상 회의 시:
// - 서버: Offer/Answer/ICE만 전달 (1KB 이하)
// - 연결 후 서버 부담: 0
// - 비용: 서버 스펙 최소, 대역폭 최소

// ✅ 서버 부담: 거의 없음!
```

### 2.2 실제 서버 부담 측정

```javascript
// ===== 시그널링 서버 부담 =====

// 1. 초기 연결 시 (한 번만)
{
  "Offer 전송": "~5KB",        // SDP 텍스트
  "Answer 전송": "~5KB",
  "ICE Candidate 전송": "~0.5KB × 3-5번",  // 평균 3-5개
  "총 데이터": "~15KB"
}

// 2. 연결 후 (지속적)
{
  "비디오 스트림": "서버 거치지 않음",
  "오디오 스트림": "서버 거치지 않음",
  "서버 CPU": "0%",
  "서버 대역폭": "0"
}

// ===== 비교: 서버 중계 방식 =====
{
  "1080p 비디오": "~2.5Mbps",
  "오디오": "~128Kbps",
  "총 대역폭 (10명)": "~25Mbps × 2 (업로드+다운로드) = 50Mbps",
  "월 비용 (AWS)": "$수천 달러"
}

// ===== 비교: WebRTC P2P =====
{
  "시그널링": "~15KB (한 번만)",
  "총 대역폭": "거의 0",
  "월 비용": "$수십 달러"
}
```

### 2.3 클라이언트 부담

```javascript
// ===== 클라이언트 (브라우저) 부담 =====

// ✅ 맞습니다! 클라이언트에 부담이 갑니다!

{
  "CPU 사용":
    - "비디오 인코딩": "10-30%",
    - "오디오 인코딩": "1-5%",
    - "비디오 디코딩": "5-15% (상대방 수만큼)",
    - "오디오 디코딩": "1-3% (상대방 수만큼)",

  "메모리 사용":
    - "비디오 버퍼": "~50MB",
    - "네트워크 버퍼": "~10MB",

  "네트워크 대역폭":
    - "1080p 송신": "~2.5Mbps",
    - "1080p 수신": "~2.5Mbps × 상대방 수",
    - "4명 회의": "업로드 2.5Mbps + 다운로드 7.5Mbps = 10Mbps"
}

// ⚠️ 문제점: Mesh 방식의 한계
// - 참여자 수가 늘어나면 지수적으로 증가
// - 보통 4-6명이 한계
```

### 2.4 Mesh vs SFU vs MCU

```
┌──────────────────────────────────────────────────────────┐
│     Mesh (P2P) - 우리가 만드는 방식                      │
└──────────────────────────────────────────────────────────┘

A ←→ B
↕    ↕
C ←→ D

장점: 서버 부담 0, 지연 시간 최소
단점: 4-6명 이상 힘듦
사용: Zoom 소규모, Discord 1:1


┌──────────────────────────────────────────────────────────┐
│     SFU (Selective Forwarding Unit)                      │
└──────────────────────────────────────────────────────────┘

A ───┐
     ├──→ [SFU 서버] ───→ 각 클라이언트
B ───┤      (라우팅만)
C ───┘

장점: 100명 이상 가능, 서버 부담 중간
단점: SFU 서버 필요, 대역폭 비용
사용: Zoom 대규모, Google Meet


┌──────────────────────────────────────────────────────────┐
│     MCU (Multipoint Control Unit)                        │
└──────────────────────────────────────────────────────────┘

A ───┐
     ├──→ [MCU 서버] ───→ 혼합된 스트림
B ───┤    (믹싱/합성)
C ───┘

장점: 클라이언트 부담 최소
단점: 서버 부담 최대, 비용 높음, 품질 저하
사용: 구형 화상 회의 시스템
```

---

## 3. WebRTC가 데이터를 견디는 원리

### 3.1 WebRTC의 기술 스택

```
┌──────────────────────────────────────────────────────────┐
│           WebRTC 기술 스택 (왜 빠른가?)                   │
└──────────────────────────────────────────────────────────┘

[응용 계층]
├─ MediaStream API        ← JavaScript로 쉽게 사용
├─ RTCPeerConnection      ← P2P 연결 관리
└─ RTCDataChannel         ← 데이터 전송

[미디어 처리]
├─ VP8/VP9/H.264 코덱     ← 하드웨어 가속 (GPU)
├─ Opus 오디오 코덱       ← 저대역폭 고음질
├─ 적응형 비트레이트       ← 네트워크 상태 자동 조절
└─ Jitter Buffer         ← 패킷 순서 보정

[네트워크 계층]
├─ SRTP (암호화)          ← 보안
├─ RTP (실시간 전송)      ← 낮은 지연
├─ RTCP (품질 제어)       ← 피드백
└─ UDP (빠른 전송)        ← TCP보다 빠름

[연결 계층]
├─ ICE (NAT 통과)         ← 네트워크 경로 찾기
├─ STUN (공인 IP)         ← 주소 확인
└─ TURN (중계)            ← 최후의 수단
```

### 3.2 하드웨어 가속

```javascript
// ===== 왜 WebRTC는 빠른가? =====

// 1. GPU 가속 (하드웨어 인코딩/디코딩)

// CPU만 사용 (소프트웨어)
비디오 인코딩 CPU 사용률: 60-80%
인코딩 시간: 33ms (30fps 기준)
배터리 소모: 높음

// GPU 사용 (하드웨어 가속)
비디오 인코딩 CPU 사용률: 5-10%  // ← 대부분 GPU가 처리
인코딩 시간: 10ms
배터리 소모: 낮음

// ✅ 브라우저가 자동으로 하드웨어 가속 사용
// - Chrome: Intel Quick Sync, NVIDIA NVENC, AMD VCE
// - Safari: Apple VideoToolbox
// - Firefox: VA-API (Linux), VideoToolbox (Mac)
```

### 3.3 적응형 비트레이트

```javascript
// ===== 네트워크 상태에 따라 자동 조절 =====

// 좋은 네트워크 (WiFi)
{
  "해상도": "1920×1080",
  "프레임레이트": "30fps",
  "비트레이트": "2.5Mbps",
  "품질": "높음"
}

// 나쁜 네트워크 (느린 LTE)
{
  "해상도": "640×480",      // ← 자동 감소
  "프레임레이트": "15fps",   // ← 자동 감소
  "비트레이트": "500Kbps",  // ← 자동 감소
  "품질": "낮음"
}

// ✅ RTCPeerConnection이 자동으로 조절
// - RTCP 피드백으로 네트워크 상태 파악
// - 패킷 손실, RTT, 대역폭 측정
// - 실시간으로 비트레이트 조절
```

### 3.4 UDP vs TCP

```javascript
// ===== 왜 UDP를 사용하나? =====

// TCP (신뢰성 O, 느림)
┌─────────────────────────────────────┐
│ 패킷 #1 → 도착 ✅                    │
│ 패킷 #2 → 손실 ❌                    │
│ 패킷 #3 → 대기... (재전송 기다림)   │ ← 지연 발생!
│ 패킷 #2 재전송 → 도착 ✅             │
│ 패킷 #3 → 도착 ✅                    │
└─────────────────────────────────────┘
// 결과: 순서 보장, 하지만 느림 (재전송 대기)

// UDP (신뢰성 X, 빠름)
┌─────────────────────────────────────┐
│ 패킷 #1 → 도착 ✅                    │
│ 패킷 #2 → 손실 ❌                    │
│ 패킷 #3 → 도착 ✅ (바로 처리)        │ ← 지연 없음!
└─────────────────────────────────────┘
// 결과: 일부 손실 OK, 실시간성 유지

// ✅ 실시간 비디오/오디오는 UDP가 적합
// - 조금 깨져도 OK (사람 눈/귀는 보정 가능)
// - 지연은 절대 안 됨 (1초 지연 = 대화 불가능)
```

---

## 4. 연결 끊김과 재연결

### 4.1 연결이 끊어지는 경우

```javascript
// ===== 연결 끊김 시나리오 =====

// 1. 네트워크 변경
사용자가 WiFi → LTE 전환
→ IP 주소 변경
→ 기존 UDP 연결 끊김

// 2. 네트워크 불안정
패킷 손실 > 50%
→ 통신 불가능
→ ICE 연결 실패

// 3. 방화벽/NAT 타임아웃
60초 동안 통신 없음
→ NAT 매핑 삭제
→ 패킷 차단

// 4. 브라우저 탭 비활성화
백그라운드 탭으로 전환
→ 브라우저가 리소스 제한
→ 미디어 전송 중단
```

### 4.2 RTCPeerConnection 상태 변화

```javascript
// ===== 연결 끊김 감지 =====

pc.onconnectionstatechange = () => {
  console.log('연결 상태:', pc.connectionState);

  switch (pc.connectionState) {
    case 'connected':
      console.log('✅ 정상 연결');
      break;

    case 'disconnected':
      console.log('⚠️ 일시적 끊김 (재연결 시도 중...)');
      // 자동으로 ICE Restart 시도
      // 약 30초 동안 재연결 시도
      break;

    case 'failed':
      console.log('❌ 연결 실패 (재연결 필요)');
      // 자동 재연결 안 됨!
      // 수동으로 재연결 로직 필요
      handleReconnect();
      break;

    case 'closed':
      console.log('⚫ 연결 종료');
      break;
  }
};
```

### 4.3 자동 재연결 vs 수동 재연결

```javascript
// ===== 자동 재연결 (ICE Restart) =====

pc.oniceconnectionstatechange = () => {
  console.log('ICE 상태:', pc.iceConnectionState);

  if (pc.iceConnectionState === 'disconnected') {
    console.log('⚠️ ICE 끊김 - 자동 재연결 시도 중...');

    // ✅ 브라우저가 자동으로 재연결 시도
    // - 약 30초 동안 시도
    // - 새로운 ICE 후보 수집
    // - 다른 경로로 연결 시도
  }

  if (pc.iceConnectionState === 'failed') {
    console.log('❌ ICE 실패 - 수동 재연결 필요');

    // ❌ 자동 재연결 실패
    // → 수동으로 ICE Restart 필요
  }
};


// ===== 수동 재연결 (ICE Restart) =====

async function restartIce() {
  try {
    console.log('🔄 ICE 재시작 중...');

    // 1. ICE Restart 옵션으로 새 Offer 생성
    const offer = await pc.createOffer({ iceRestart: true });

    // 2. Local Description 설정
    await pc.setLocalDescription(offer);

    // 3. 시그널링 서버로 전송
    socket.emit('offer', {
      target: remoteUserId,
      offer: pc.localDescription
    });

    console.log('✅ ICE Restart Offer 전송 완료');

  } catch (error) {
    console.error('❌ ICE Restart 실패:', error);
  }
}
```

---

## 5. 실전 재연결 구현

### 5.1 완전한 재연결 로직

```javascript
class WebRTCReconnectionManager {
  constructor(pc, socket, remoteUserId) {
    this.pc = pc;
    this.socket = socket;
    this.remoteUserId = remoteUserId;

    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 2000;  // 2초

    this.setupListeners();
  }

  setupListeners() {
    // ===== 연결 상태 모니터링 =====
    this.pc.onconnectionstatechange = () => {
      const state = this.pc.connectionState;
      console.log(`[${this.remoteUserId}] 연결 상태: ${state}`);

      if (state === 'disconnected') {
        console.log('⚠️ 연결 끊김 - 대기 중...');
        // 브라우저 자동 재연결 대기 (30초)
        this.waitForAutoReconnect();

      } else if (state === 'failed') {
        console.log('❌ 연결 실패 - 재연결 시작');
        this.handleConnectionFailed();

      } else if (state === 'connected') {
        console.log('✅ 연결 복구됨');
        this.reconnectAttempts = 0;
      }
    };

    // ===== ICE 상태 모니터링 =====
    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc.iceConnectionState;
      console.log(`[${this.remoteUserId}] ICE 상태: ${state}`);

      if (state === 'failed') {
        console.log('❌ ICE 실패 - ICE Restart 시도');
        this.restartIce();
      }
    };
  }

  // ===== 자동 재연결 대기 =====
  waitForAutoReconnect() {
    console.log('⏳ 자동 재연결 대기 중... (30초)');

    // 30초 후에도 연결 안 되면 수동 재연결
    setTimeout(() => {
      if (this.pc.connectionState !== 'connected') {
        console.log('⚠️ 자동 재연결 실패 - 수동 재연결 시도');
        this.handleConnectionFailed();
      }
    }, 30000);
  }

  // ===== 연결 실패 처리 =====
  async handleConnectionFailed() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ 최대 재연결 시도 초과 - 연결 종료');
      this.giveUp();
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    // 지연 후 재연결
    await this.delay(this.reconnectDelay);

    // ICE Restart
    await this.restartIce();
  }

  // ===== ICE Restart =====
  async restartIce() {
    try {
      console.log('🔄 ICE 재시작...');

      // 1. ICE Restart Offer 생성
      const offer = await this.pc.createOffer({ iceRestart: true });

      // 2. Local Description 설정
      await this.pc.setLocalDescription(offer);

      // 3. 시그널링 서버로 전송
      this.socket.emit('offer', {
        target: this.remoteUserId,
        offer: this.pc.localDescription
      });

      console.log('✅ ICE Restart Offer 전송 완료');

    } catch (error) {
      console.error('❌ ICE Restart 실패:', error);

      // 재시도
      setTimeout(() => {
        this.handleConnectionFailed();
      }, this.reconnectDelay);
    }
  }

  // ===== 완전 재연결 (새 PeerConnection) =====
  async fullReconnect() {
    console.log('🔄 완전 재연결 (새 PeerConnection 생성)');

    try {
      // 1. 기존 연결 종료
      this.pc.close();

      // 2. 새 PeerConnection 생성 (외부에서)
      this.socket.emit('request-new-connection', {
        target: this.remoteUserId
      });

      console.log('✅ 새 연결 요청 완료');

    } catch (error) {
      console.error('❌ 완전 재연결 실패:', error);
    }
  }

  // ===== 포기 =====
  giveUp() {
    console.log('❌ 재연결 포기 - 사용자에게 알림');

    // UI에 에러 표시
    showError(`${this.remoteUserId}와의 연결에 실패했습니다. 새로고침이 필요합니다.`);

    // 연결 종료
    this.pc.close();
  }

  // ===== 유틸리티 =====
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===== 사용 예시 =====
const pc = new RTCPeerConnection(config);
const reconnectionManager = new WebRTCReconnectionManager(
  pc,
  socket,
  'remote-user-123'
);
```

### 5.2 시그널링 서버 지원

```javascript
// ===== backend/server.js =====

// ICE Restart Offer 수신
socket.on('offer', (data) => {
  console.log(`[Offer] ${socket.id} → ${data.target}`);

  // 상대방에게 전달
  socket.to(data.target).emit('offer', {
    offer: data.offer,
    from: socket.id,
    isRestart: data.offer.sdp.includes('a=ice-options:ice2')  // ICE Restart 감지
  });
});

// 새 연결 요청
socket.on('request-new-connection', (data) => {
  console.log(`[새 연결 요청] ${socket.id} → ${data.target}`);

  // 상대방에게 알림
  socket.to(data.target).emit('connection-request', {
    from: socket.id
  });
});

// ===== frontend =====

// ICE Restart Offer 수신
socket.on('offer', async (data) => {
  console.log('Offer 수신:', data.isRestart ? 'ICE Restart' : '일반');

  const pc = peerConnections.get(data.from);

  if (pc) {
    // 기존 연결에 Offer 적용
    await pc.setRemoteDescription(data.offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer', {
      target: data.from,
      answer: pc.localDescription
    });
  }
});

// 새 연결 요청 수신
socket.on('connection-request', async (data) => {
  console.log('새 연결 요청 받음:', data.from);

  // 기존 연결 종료
  const oldPc = peerConnections.get(data.from);
  if (oldPc) {
    oldPc.close();
  }

  // 새 PeerConnection 생성
  const newPc = createPeerConnection(data.from);

  // Offer 전송
  const offer = await newPc.createOffer();
  await newPc.setLocalDescription(offer);

  socket.emit('offer', {
    target: data.from,
    offer: newPc.localDescription
  });
});
```

### 5.3 UI 피드백

```javascript
// ===== 사용자에게 상태 알림 =====

class ConnectionStatusUI {
  constructor() {
    this.statusElement = document.getElementById('connectionStatus');
  }

  showConnecting() {
    this.statusElement.innerHTML = `
      <div class="status connecting">
        🔄 연결 중...
      </div>
    `;
  }

  showConnected() {
    this.statusElement.innerHTML = `
      <div class="status connected">
        ✅ 연결됨
      </div>
    `;

    // 3초 후 숨김
    setTimeout(() => {
      this.statusElement.innerHTML = '';
    }, 3000);
  }

  showReconnecting(attempt, max) {
    this.statusElement.innerHTML = `
      <div class="status reconnecting">
        🔄 재연결 중... (${attempt}/${max})
      </div>
    `;
  }

  showDisconnected() {
    this.statusElement.innerHTML = `
      <div class="status disconnected">
        ⚠️ 연결 끊김 - 재연결 시도 중...
      </div>
    `;
  }

  showFailed() {
    this.statusElement.innerHTML = `
      <div class="status failed">
        ❌ 연결 실패
        <button onclick="location.reload()">새로고침</button>
      </div>
    `;
  }
}

// 사용
const statusUI = new ConnectionStatusUI();

pc.onconnectionstatechange = () => {
  switch (pc.connectionState) {
    case 'connecting':
      statusUI.showConnecting();
      break;
    case 'connected':
      statusUI.showConnected();
      break;
    case 'disconnected':
      statusUI.showDisconnected();
      break;
    case 'failed':
      statusUI.showFailed();
      break;
  }
};
```

---

## 6. TURN 서버 필요성

### 6.1 왜 TURN 서버가 필요한가?

```javascript
// ===== STUN만으로 연결 실패하는 경우 =====

// 1. 대칭형 NAT (Symmetric NAT)
클라이언트 → 서버A (포트 1234 할당)
클라이언트 → 서버B (포트 5678 할당)  ← 다른 포트!
→ P2P 연결 불가능 (포트 예측 불가능)

// 2. 기업 방화벽
회사 네트워크 → UDP 차단
→ WebRTC 연결 불가능

// 3. 제한적인 NAT
NAT가 너무 엄격 → 외부 연결 차단
→ ICE 후보 도달 불가능

// ✅ 해결: TURN 서버로 중계
// - TURN 서버가 중간에서 릴레이
// - 약간 느리지만 확실히 연결
// - 연결 성공률: 95% → 99%
```

### 6.2 TURN 서버 설정

```javascript
const config = {
  iceServers: [
    // STUN (무료)
    {
      urls: 'stun:stun.l.google.com:19302'
    },

    // TURN (유료, 필수!)
    {
      urls: [
        'turn:turn.example.com:3478',
        'turn:turn.example.com:3478?transport=tcp'  // TCP도 지원
      ],
      username: 'myuser',
      credential: 'mypassword'
    }
  ],

  // TURN 서버 우선순위 (옵션)
  iceTransportPolicy: 'all'  // 'all' | 'relay'
  // 'all': STUN 먼저, 실패 시 TURN (기본값, 권장)
  // 'relay': 무조건 TURN 사용 (느림, 보안 강화)
};

const pc = new RTCPeerConnection(config);
```

### 6.3 TURN 서버 비용

```javascript
// ===== TURN 서버 비용 계산 =====

// 시나리오: 10명 화상 회의, 1시간
{
  "STUN으로 성공": "90%",  // 9명
  "TURN 필요": "10%",      // 1명

  "TURN 사용 데이터":
    - "1080p 비디오": "2.5Mbps × 3600초 = 1.125GB",
    - "송수신": "1.125GB × 2 = 2.25GB",

  "비용 (Twilio TURN)":
    - "$0.0004/GB",
    - "총 비용": "$0.0009 (1원 미만!)"
}

// ✅ TURN 서버 비용은 생각보다 저렴
// - 전체의 5-10%만 TURN 사용
// - 나머지는 무료 P2P
```

---

## 7. 핵심 정리

### Q1: P2P 연결 후 데이터는 누가 관리하나요?

```
✅ 각 브라우저가 자신의 RTCPeerConnection 인스턴스로 관리
- 서버는 관여하지 않음
- 브라우저 ↔ 브라우저 직접 통신
- CPU/GPU가 인코딩/디코딩
```

### Q2: 서버 부담은?

```
✅ 거의 없음!
- 초기 연결: ~15KB (Offer/Answer/ICE)
- 연결 후: 0 (P2P 직접 통신)
- 비용: 최소
```

### Q3: 클라이언트 부담은?

```
⚠️ 있음!
- CPU: 10-30% (인코딩/디코딩)
- 네트워크: 참여자 수만큼 증가
- 4-6명 이상: Mesh 방식 한계
- 해결: SFU 서버 사용 (대규모)
```

### Q4: WebRTC가 데이터를 견디는 원리

```
✅ 하드웨어 가속
✅ 적응형 비트레이트
✅ UDP (빠른 전송)
✅ 효율적인 코덱
```

### Q5: 연결 끊김 시 재연결?

```
✅ 자동 재연결 (30초)
- ICE 자동 재시도
- 다른 경로 탐색

❌ 자동 실패 시
- 수동 ICE Restart 필요
- 또는 완전 재연결 (새 PC)

✅ 시그널링 서버 필요
- ICE Restart Offer 전달
- 서버는 살아있어야 함
```

### 재연결 플로우

```
1. disconnected
   ↓
2. 브라우저 자동 재연결 (30초 대기)
   ↓
3. failed → 수동 ICE Restart
   ↓
4. 여전히 실패 → 완전 재연결 (새 PC)
   ↓
5. 계속 실패 → 포기 (새로고침 권장)
```

---

## 다음 학습

- [프론트엔드 WebRTC 완전 구현](./프론트엔드_WebRTC_완전_구현.md)
- [SFU 서버 구축 (대규모 확장)](./SFU_서버_구축.md)
- [WebRTC 성능 최적화](./WebRTC_성능_최적화.md)
