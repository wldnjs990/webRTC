# WebRTC 학습 중 궁금했던 것들 정리

이 문서는 WebRTC 학습 과정에서 궁금했던 내용들을 Q&A 형식으로 정리한 문서입니다.

---

## Q1: P2P 연결 후 영상 데이터는 누가 관리하나요?

**A: 각 브라우저의 RTCPeerConnection이 관리합니다!**

```javascript
// [사용자 A 브라우저]
const pcA = new RTCPeerConnection(config);
// ← A의 CPU/GPU가 인코딩
// ← A의 네트워크로 직접 전송

// [사용자 B 브라우저]
const pcB = new RTCPeerConnection(config);
// ← B의 CPU/GPU가 디코딩
// ← B의 네트워크로 직접 수신

// ✅ 서버는 전혀 관여하지 않음!
```

### 핵심 포인트

- P2P 연결이 완료되면 서버는 더 이상 데이터 전송에 관여하지 않음
- 각 브라우저의 `RTCPeerConnection` 인스턴스가 모든 미디어 처리 담당
- 인코딩/디코딩은 각 클라이언트의 하드웨어(CPU/GPU)가 처리

---

## Q2: 서버는 부담이 없는 게 맞나요?

**A: 네, 거의 없습니다!**

### 서버 부담 분석

```
[연결 전 - 시그널링 단계]
서버: Offer/Answer/ICE 전달 (~15KB, 한 번만)
      ↓
      데이터 중계만 함

[연결 후 - P2P 단계]
서버: 아무것도 안 함 (0 bytes!)
      ↓
      A ←────────────→ B (직접 통신)
```

### 비용 비교

| 방식 | 월 비용 | 대역폭 사용 |
|------|---------|------------|
| **서버 중계 방식** | 수천 달러 | 모든 영상 데이터가 서버 경유 |
| **WebRTC P2P** | 수십 달러 | 시그널링 데이터만 서버 경유 (~15KB) |

### 예시 계산

```
10명 동시 접속, 1시간 화상 회의

[서버 중계]
- 서버 대역폭: 10명 × 2.5Mbps × 2(송수신) = 50Mbps
- 월 비용: 약 $3,000~5,000

[WebRTC P2P]
- 서버 대역폭: 시그널링만 (~150KB)
- 월 비용: 약 $50~100
```

---

## Q3: 클라이언트에 부담이 가는 게 맞나요?

**A: 네, 맞습니다!**

### CPU 사용량

```javascript
// 각 클라이언트의 CPU 부담
{
  "비디오 인코딩": "10-30% (하드웨어 가속 사용 시 5-10%)",
  "비디오 디코딩": "5-15% × 참여자 수",
  "오디오 인코딩": "1-3%",
  "오디오 디코딩": "1-2% × 참여자 수"
}

// 예시: 4명 화상 회의
// - 내 영상 인코딩: 10%
// - 3명 영상 디코딩: 15% × 3 = 45%
// - 총 CPU: 약 55%
```

### 네트워크 대역폭

```javascript
// 해상도별 대역폭 요구사항
{
  "720p (HD)": "1.2Mbps",
  "1080p (Full HD)": "2.5Mbps",
  "4K": "15-25Mbps"
}

// 4명 1080p 화상 회의
{
  "송신": "2.5Mbps (내 영상)",
  "수신": "2.5Mbps × 3명 = 7.5Mbps",
  "총 필요 대역폭": "10Mbps"
}
```

### ⚠️ Mesh 방식의 한계

```
참여자 수에 따른 네트워크 부담:

2명: 2.5Mbps (송신) + 2.5Mbps (수신) = 5Mbps ✅
3명: 2.5Mbps + 5Mbps = 7.5Mbps ✅
4명: 2.5Mbps + 7.5Mbps = 10Mbps ✅
5명: 2.5Mbps + 10Mbps = 12.5Mbps ⚠️
6명: 2.5Mbps + 12.5Mbps = 15Mbps ❌ (일반 가정용 인터넷 한계)

→ 4-6명 이상은 Mesh 방식 한계
→ 대규모는 SFU 서버 필요!
```

---

## Q4: WebRTC가 대용량 데이터를 견디는 원리는?

**A: 4가지 핵심 기술로 최적화합니다!**

### 1. 하드웨어 가속 (GPU 인코딩)

```javascript
// RTCPeerConnection이 자동으로 GPU 사용
const pc = new RTCPeerConnection(config);

// 브라우저 내부 동작:
// - Intel Quick Sync
// - NVIDIA NVENC
// - AMD VCE
// 등 하드웨어 인코더 자동 활용

// 효과:
// CPU 사용: 30% → 5-10%
// 배터리 절약: 2배 이상
```

### 2. 적응형 비트레이트 (Adaptive Bitrate)

```javascript
// 브라우저가 자동으로 네트워크 상태 감지
setInterval(() => {
  const stats = await pc.getStats();

  // 패킷 손실 많으면 → 화질 낮춤
  if (packetsLost > threshold) {
    adjustBitrate('lower'); // 1080p → 720p → 480p
  }

  // 네트워크 좋으면 → 화질 올림
  if (networkGood) {
    adjustBitrate('higher'); // 480p → 720p → 1080p
  }
}, 1000);

// 사용자는 신경 쓸 필요 없음 - 자동!
```

### 3. UDP 프로토콜 사용

```
TCP (일반 웹):
송신 → 패킷 손실 → 재전송 대기 → 지연 발생 ❌
→ 실시간 통신에 부적합

UDP (WebRTC):
송신 → 패킷 손실 → 그냥 진행 ✅
→ 조금 깨져도 OK
→ 실시간성 보장

예시:
- TCP: "안녕하세요" 중 "하" 손실 → 재전송 대기 → 2초 지연
- UDP: "안녕_세요" (약간 깨짐) → 그대로 진행 → 지연 없음
```

### 4. 효율적 코덱

```javascript
// WebRTC 지원 코덱
{
  "VP8": "오픈소스, 중간 효율",
  "VP9": "고효율, Chrome 최적화",
  "H.264": "하드웨어 지원 광범위",
  "H.265": "초고효율, 라이센스 이슈",
  "AV1": "차세대, 최고 효율"
}

// 브라우저가 자동으로 최적 코덱 선택
// 하드웨어 지원 → H.264 선택
// 소프트웨어만 → VP8/VP9 선택
```

---

## Q5: 연결이 끊기면 재연결 가능한가요?

**A: 가능합니다! 하지만 시그널링 서버가 계속 살아있어야 합니다.**

### 재연결 플로우

```javascript
// 1️⃣ 연결 끊김 감지
pc.onconnectionstatechange = async () => {
  switch (pc.connectionState) {
    case 'disconnected':
      console.log('⚠️ 연결 끊김!');
      // 브라우저가 자동으로 30초간 재연결 시도
      // - ICE 재수집
      // - 다른 경로 시도
      // - STUN 재요청
      break;

    case 'failed':
      console.log('❌ 자동 재연결 실패!');
      // 2️⃣ 수동 ICE Restart
      await reconnectWithIceRestart();
      break;

    case 'closed':
      console.log('🔌 완전히 종료됨');
      // 3️⃣ 완전 재연결
      await fullReconnect();
      break;
  }
};

// 2️⃣ ICE Restart 재연결
async function reconnectWithIceRestart() {
  // ⭐ 시그널링 서버 필요!
  const offer = await pc.createOffer({ iceRestart: true });
  await pc.setLocalDescription(offer);

  // 서버로 새 Offer 전송
  socket.emit('offer', { target: remotePeerId, offer });

  // 상대방이 Answer 응답하면 재연결 성공
}

// 3️⃣ 완전 재연결
async function fullReconnect() {
  // 기존 연결 정리
  pc.close();

  // 새 RTCPeerConnection 생성
  pc = new RTCPeerConnection(config);

  // ⭐ 시그널링 서버로 처음부터 다시
  const offer = await pc.createOffer();
  socket.emit('offer', { target: remotePeerId, offer });
}
```

### 재연결 타임라인

```
[0초] WiFi 끊김 발생
      ↓
[5초] pc.connectionState = 'disconnected'
      브라우저: "자동 재연결 시작"
      ↓
[5-35초] 브라우저 자동 시도
      - ICE 재수집
      - STUN 재요청
      - 다른 네트워크 경로 탐색
      ↓
[35초] 실패 → pc.connectionState = 'failed'
      우리 코드: reconnectWithIceRestart() 실행
      서버로 새 Offer 전송 ⭐
      ↓
[40초] 재연결 성공 or 실패
      성공 → pc.connectionState = 'connected'
      실패 → fullReconnect() 시도
      ↓
[60초] 계속 실패 → 사용자에게 새로고침 권장
```

### ✅ 핵심: 시그널링 서버는 계속 살아있어야 재연결 가능!

```
[잘못된 생각 ❌]
"P2P 연결 후엔 서버 꺼도 되겠네?"

[올바른 이해 ✅]
"P2P 연결 후에도 서버는 재연결을 위해 계속 필요!"
```

---

## Q6: 시그널링 서버의 역할은 정확히 무엇인가요?

### 🔑 시그널링 서버의 3가지 역할

```
┌─────────────────────────────────────┐
│ 1️⃣ 초기 연결 (필수)                │
├─────────────────────────────────────┤
│ - Offer/Answer/ICE 중계            │
│ - 방 관리 (create/join)            │
│ - 사용자 입장/퇴장 알림             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 2️⃣ 연결 후 (아무것도 안 함)        │
├─────────────────────────────────────┤
│ - P2P 직접 통신                     │
│ - 서버 부담 0 bytes                 │
│ - 하지만 WebSocket 연결은 유지!    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 3️⃣ 재연결 시 (다시 필요!)          │
├─────────────────────────────────────┤
│ - ICE Restart Offer 중계           │
│ - 새 연결 요청 중계                 │
│ - 상대방 연결 상태 확인             │
└─────────────────────────────────────┘
```

### 서버가 죽으면?

```javascript
// 시나리오 1: P2P 연결 중 서버 다운
// 현재 통화: ✅ 계속 가능 (P2P이므로)
// 재연결: ❌ 불가능 (시그널링 서버 없음)

// 시나리오 2: 서버 재시작
// 기존 연결: ✅ 유지됨
// 새 연결: ❌ 잠시 불가 (서버 재시작 중)
// WebSocket: ❌ 끊김 → 재연결 필요

// 해결책: WebSocket 재연결 로직
socket.on('disconnect', () => {
  console.log('서버 연결 끊김');

  // 자동 재연결 시도
  setTimeout(() => {
    socket.connect();
  }, 1000);
});
```

---

## Q7: Mesh vs SFU 어떤 차이가 있나요?

### 📊 두 방식 비교

| 구분 | Mesh (P2P) | SFU (서버 중계) |
|------|-----------|----------------|
| **서버 부담** | 거의 없음 (시그널링만) | 중간 (영상 중계) |
| **클라이언트 부담** | 높음 (참여자 수만큼 송신) | 낮음 (1개만 송신) |
| **최대 인원** | 4-6명 | 100명+ |
| **지연 시간** | 최소 (직접 연결) | 약간 있음 (서버 경유) |
| **비용** | 최소 | 중간 |
| **용도** | 소규모 회의, 1:1 | 대규모 회의, 웨비나 |

### Mesh 방식 (우리가 만드는 것)

```javascript
// 4명 화상 회의 - Mesh 방식

[A] ←→ [B]
 ↓ ↘   ↗ ↓
[C] ←→ [D]

// A의 네트워크 부담:
// - B에게 송신: 2.5Mbps
// - C에게 송신: 2.5Mbps
// - D에게 송신: 2.5Mbps
// - B로부터 수신: 2.5Mbps
// - C로부터 수신: 2.5Mbps
// - D로부터 수신: 2.5Mbps
// 총: 15Mbps (업로드 7.5Mbps + 다운로드 7.5Mbps)
```

### SFU 방식 (Zoom, Google Meet)

```javascript
// 4명 화상 회의 - SFU 방식

[A] ──┐
[B] ──┤
[C] ──├─ [SFU 서버]
[D] ──┘

// A의 네트워크 부담:
// - SFU에 송신: 2.5Mbps (1개만!)
// - SFU로부터 수신: 7.5Mbps (B,C,D)
// 총: 10Mbps (업로드 2.5Mbps + 다운로드 7.5Mbps)

// ✅ 업로드 부담 1/3 감소!
// ✅ 100명이어도 업로드는 2.5Mbps만!
```

### 선택 가이드

```
참여자 수에 따른 권장 방식:

1-4명:  Mesh ✅ (서버 비용 최소)
5-10명: Mesh or SFU (네트워크 상태에 따라)
10명+:  SFU ✅ (필수)
50명+:  SFU + Simulcast ✅
100명+: MCU or 웨비나 모드 ✅
```

---

## Q8: `onconnectionstatechange`는 어떻게 자동으로 실행되나요?

**A: RTCPeerConnection이 복잡한 네트워크 감지 로직을 추상화해서 제공합니다!**

### 추상화 계층 구조

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[우리가 작성하는 코드 - 간단!]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pc.onconnectionstatechange = () => {
  console.log(pc.connectionState);
};

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[추상화 경계 - 브라우저 내부]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[브라우저 내부 - C++로 구현된 복잡한 로직]
- STUN Binding Request/Response
- ICE Connectivity Checks
- DTLS Handshake
- SRTP Key Exchange
- Packet Loss Detection
- Network Interface Monitoring
- Timeout Management
... 수십 가지 네트워크 프로토콜
```

### 내부 동작 원리 (의사 코드)

```javascript
// RTCPeerConnection 브라우저 내부 구현 (간소화)
class RTCPeerConnection {
  constructor() {
    this.connectionState = 'new';
    this.onconnectionstatechange = null; // ⭐ 초기값 null

    // 백그라운드 모니터링 시작
    this.startMonitoring();
  }

  // 브라우저가 백그라운드에서 계속 실행
  startMonitoring() {
    setInterval(() => {
      // STUN 패킷 전송, ICE 체크, 네트워크 상태 확인
      const newState = this.checkConnection();

      // 상태 변화 감지!
      if (newState !== this.connectionState) {
        this.connectionState = newState;

        // ⭐ 사용자가 등록한 함수가 있는지 확인
        if (this.onconnectionstatechange !== null) {
          // ⭐ 등록된 함수 실행!
          this.onconnectionstatechange();
        }
      }
    }, 1000); // 약 1초마다 체크
  }

  checkConnection() {
    // 실제 네트워크 상태 확인 (C++로 구현)
    // - STUN 패킷 응답 체크
    // - ICE 연결 상태 확인
    // - 패킷 손실률 체크
    return '새로운_상태';
  }
}

// 우리가 하는 일: 함수를 속성에 할당만 하면 됨!
const pc = new RTCPeerConnection();
pc.onconnectionstatechange = () => {
  console.log('상태 변경됨!');
};
```

### Django ORM과 비교

```python
# Django ORM - 추상화된 인터페이스
user = User.objects.create(username='홍길동')

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━
#      [추상화 경계]
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Django 내부에서 실제 SQL 실행 (우리는 몰라도 됨)
# BEGIN;
# INSERT INTO auth_user (username, ...) VALUES ('홍길동', ...);
# COMMIT;
```

```javascript
// RTCPeerConnection - 추상화된 인터페이스
pc.onconnectionstatechange = () => {
  console.log(pc.connectionState);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━
//      [추상화 경계]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 브라우저 내부 (C++로 구현, 우리는 몰라도 됨)
// - STUN 서버로 UDP 패킷 전송
// - 네트워크 인터페이스 이벤트 구독
// - 5초마다 Connectivity Check
// - 패킷 응답 없으면 connectionState 변경
// - onconnectionstatechange() 호출
```

### `onconnectionstatechange`는 속성입니다!

```javascript
// ❌ 메서드 오버라이딩이 아님! (Django 매직 메서드와 다름)
class MyModel(models.Model):
    def save(self):  # 메서드 오버라이딩
        super().save()

// ✅ 속성에 함수 할당! (이벤트 리스너 등록)
pc.onconnectionstatechange = () => {  // 속성 = 함수
  console.log('연결 상태:', pc.connectionState);
};

// 확인해보기
console.log(pc.onconnectionstatechange); // null → [Function]
```

### 왜 이렇게 설계했나?

```javascript
// ❌ 만약 추상화 없이 직접 구현한다면:
// - 2000줄 이상의 네트워크 코드 작성
// - STUN, TURN, ICE 프로토콜 직접 구현
// - 크로스 브라우저 호환성 직접 처리
// - 버그 디버깅 지옥

// ✅ 추상화 덕분에:
pc.onconnectionstatechange = () => {
  console.log(pc.connectionState);
};
// 끝! 단 3줄로 완성!
```

---

## 핵심 정리

### ✅ WebRTC의 3대 핵심

1. **P2P 직접 연결** → 서버 부담 최소화
2. **RTCPeerConnection** → 복잡한 로직 추상화
3. **시그널링 서버** → 연결/재연결 중계

### ✅ 기억할 점

- P2P 연결 후에도 **시그널링 서버는 재연결을 위해 계속 필요**
- 클라이언트는 **참여자 수만큼 부담 증가** (Mesh 방식)
- **4-6명 이상**은 SFU 서버 고려
- `onconnectionstatechange`는 **속성이지 메서드가 아님**
- 브라우저가 **모든 복잡한 로직을 추상화**해서 제공

### ✅ 다음 학습 방향

- [ ] 실제 클라이언트 코드 작성
- [ ] PeerConnection 관리 클래스 구현
- [ ] 재연결 로직 구현
- [ ] 에러 처리 및 로깅
- [ ] UI/UX 개선
