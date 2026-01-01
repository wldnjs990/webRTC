# WebRTC 연결 과정 완벽 이해

> 작성일: 2025-12-31
> 대상: 주니어 개발자
> 목적: Offer, Answer, ICE Candidate의 역할과 동작 원리 완벽 이해

---

## 목차

1. [WebRTC가 해결하는 문제](#1-webrtc가-해결하는-문제)
2. [SDP란? (Offer & Answer)](#2-sdp란-offer--answer)
3. [ICE Candidate란?](#3-ice-candidate란)
4. [전체 연결 과정](#4-전체-연결-과정)
5. [실제 코드로 보는 플로우](#5-실제-코드로-보는-플로우)
6. [시그널링 서버의 역할](#6-시그널링-서버의-역할)

---

## 1. WebRTC가 해결하는 문제

### 1.1 문제: 브라우저끼리 직접 통신 불가능

```
❌ 불가능한 시나리오

[사용자 A 브라우저]  ──╳──→  [사용자 B 브라우저]
     집 WiFi                    회사 WiFi
  사설 IP: 192.168.0.5       사설 IP: 10.0.0.3

- A는 B의 진짜 주소를 모름
- NAT, 방화벽이 막고 있음
- 서로 연결할 방법이 없음
```

### 1.2 해결: WebRTC P2P 연결

```
✅ WebRTC 해결 방법

1. 시그널링 서버 - Offer/Answer 교환 (연결 정보)
2. STUN 서버 - 공인 IP 찾기
3. TURN 서버 - 직접 연결 실패 시 중계

[A 브라우저] ←→ [시그널링 서버] ←→ [B 브라우저]
      ↓           (Offer/Answer)          ↓
      └────────→ [STUN 서버] ←──────────┘
                  (ICE 수집)
      ↓                                  ↓
      └──────→ 직접 P2P 연결! ←─────────┘
```

---

## 2. SDP란? (Offer & Answer)

### 2.1 SDP = Session Description Protocol

**"나는 이런 미디어를 보낼 수 있어!"라는 명세서**

```javascript
// Offer SDP 예시 (사용자 A가 생성)
{
  type: "offer",
  sdp: `
    v=0
    o=- 123456789 2 IN IP4 127.0.0.1
    s=-
    t=0 0

    // 오디오 정보
    m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104
    c=IN IP4 203.0.113.1
    a=rtpmap:111 opus/48000/2
    a=fmtp:111 minptime=10;useinbandfec=1

    // 비디오 정보
    m=video 9 UDP/TLS/RTP/SAVPF 96 97 98
    c=IN IP4 203.0.113.1
    a=rtpmap:96 VP8/90000
    a=rtpmap:97 VP9/90000

    // ICE 후보들 (네트워크 경로)
    a=candidate:1 1 UDP 2130706431 192.168.0.5 54321 typ host
    a=candidate:2 1 UDP 1694498815 203.0.113.1 54321 typ srflx
  `
}
```

### 2.2 SDP에 담긴 정보

| 항목 | 설명 | 예시 |
|------|------|------|
| **미디어 타입** | 오디오, 비디오 | audio, video |
| **코덱** | 인코딩 방식 | VP8, VP9, H.264, Opus |
| **해상도** | 비디오 크기 | 1920x1080, 640x480 |
| **비트레이트** | 전송 속도 | 1Mbps, 500Kbps |
| **ICE 후보** | 네트워크 경로 | 192.168.0.5:54321 |
| **DTLS 핑거프린트** | 암호화 키 | SHA-256 지문 |

### 2.3 Offer와 Answer의 차이

```javascript
// ===== Offer (제안) =====
// 사용자 A: "나는 VP8 비디오, Opus 오디오 보낼 수 있어!"

const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// Offer 내용
{
  type: "offer",
  sdp: "v=0\no=- ...\nm=audio 9 UDP/TLS/RTP/SAVPF 111 103\n..."
}

// ===== Answer (응답) =====
// 사용자 B: "좋아! 나도 VP8 지원해. 이렇게 연결하자!"

const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);

// Answer 내용
{
  type: "answer",
  sdp: "v=0\no=- ...\nm=audio 9 UDP/TLS/RTP/SAVPF 111\n..."
}
```

**비유:**
```
Offer = 레스토랑 메뉴판
"저희는 피자, 파스타, 스테이크 있습니다"

Answer = 주문서
"그럼 저는 피자로 주세요"
```

---

## 3. ICE Candidate란?

### 3.1 ICE = Interactive Connectivity Establishment

**"나한테 연결하려면 이 경로를 써!"라는 네트워크 주소**

```javascript
// ICE Candidate 예시
{
  candidate: "candidate:1 1 UDP 2130706431 192.168.0.5 54321 typ host",
  sdpMid: "0",
  sdpMLineIndex: 0
}
```

### 3.2 ICE Candidate의 종류

```javascript
// ===== 1. Host Candidate (로컬 네트워크) =====
{
  candidate: "candidate:1 1 UDP 2130706431 192.168.0.5 54321 typ host",
  // 의미: 내 컴퓨터의 사설 IP
  // 우선순위: ⭐⭐⭐ (가장 높음 - 가장 빠름)
  // 사용처: 같은 WiFi 내 연결
}

// ===== 2. Server Reflexive (STUN으로 찾은 공인 IP) =====
{
  candidate: "candidate:2 1 UDP 1694498815 203.0.113.1 54321 typ srflx raddr 192.168.0.5 rport 54321",
  // 의미: STUN 서버가 알려준 내 공인 IP
  // 우선순위: ⭐⭐ (중간)
  // 사용처: 인터넷을 통한 직접 연결
}

// ===== 3. Relay (TURN 서버 중계) =====
{
  candidate: "candidate:3 1 UDP 16777215 198.51.100.1 3478 typ relay raddr 203.0.113.1 rport 54321",
  // 의미: TURN 서버를 통한 중계 경로
  // 우선순위: ⭐ (가장 낮음 - 느림)
  // 사용처: 직접 연결 실패 시 최후의 수단
}
```

### 3.3 ICE Gathering 과정

```
[브라우저가 ICE 후보를 수집하는 과정]

1. Host Candidate 수집
   → 내 컴퓨터의 모든 네트워크 인터페이스 확인
   → WiFi: 192.168.0.5
   → 이더넷: 192.168.1.10
   → 가상 어댑터: ...

2. STUN 서버에 요청
   브라우저: "내 공인 IP 뭐야?"
   STUN 서버: "너의 공인 IP는 203.0.113.1:54321이야"
   → Server Reflexive Candidate 생성

3. TURN 서버에 요청 (옵션)
   브라우저: "중계 경로 줘"
   TURN 서버: "198.51.100.1:3478로 보내"
   → Relay Candidate 생성

4. 각 후보마다 'icecandidate' 이벤트 발생
   → 즉시 상대방에게 전달 (시그널링 서버 통해)
```

### 3.4 STUN 서버의 역할

```javascript
// ===== STUN 서버 =====
// Session Traversal Utilities for NAT

// 문제 상황
[내 컴퓨터]          [공유기 NAT]         [인터넷]
192.168.0.5    →    203.0.113.1    →    ???

// 내 컴퓨터는 "192.168.0.5"만 알고 있음
// 상대방은 "203.0.113.1"로 접속해야 함
// → 어떻게 알 수 있을까?

// ✅ STUN 서버 사용
const config = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'  // 구글 STUN 서버
    }
  ]
};

const pc = new RTCPeerConnection(config);

// 내부 동작:
// 1. 브라우저가 STUN 서버에 UDP 패킷 전송
// 2. STUN 서버가 패킷 받은 IP 주소를 응답
// 3. 브라우저가 공인 IP 획득: 203.0.113.1
```

**STUN 서버 공급자:**
- Google: `stun:stun.l.google.com:19302` (무료)
- Twilio: `stun:global.stun.twilio.com:3478`
- Cloudflare: `stun:stun.cloudflare.com:3478`

### 3.5 TURN 서버의 역할

```javascript
// ===== TURN 서버 =====
// Traversal Using Relays around NAT

// 문제 상황: 직접 연결 실패
[사용자 A]  ──╳──→  [사용자 B]
 기업 방화벽         대칭형 NAT

// ✅ TURN 서버로 중계
[사용자 A]  ──→  [TURN 서버]  ←──  [사용자 B]
                (중계 역할)

const config = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'user',
      credential: 'password'
    }
  ]
};
```

**TURN 서버 특징:**
- 💰 **비용**: 유료 (대역폭 사용)
- 🐢 **속도**: 느림 (중계 거침)
- 🔒 **보안**: 인증 필요
- 🎯 **사용률**: 5-10% (대부분 STUN으로 해결)

---

## 4. 전체 연결 과정

### 4.1 시간 순서대로 보는 전체 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebRTC 연결 전체 과정                         │
└─────────────────────────────────────────────────────────────────┘

사용자 A (Offer 쪽)                시그널링 서버              사용자 B (Answer 쪽)

1️⃣ PeerConnection 생성
────────────────────
pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

2️⃣ 미디어 스트림 추가
────────────────────
stream = await navigator
  .mediaDevices
  .getUserMedia({ video: true, audio: true });

stream.getTracks().forEach(track => {
  pc.addTrack(track, stream);
});

3️⃣ ICE 이벤트 리스너 등록
────────────────────
pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', {
      target: 'userB',
      candidate: event.candidate
    });
  }
};

4️⃣ Offer 생성
────────────────────
offer = await pc.createOffer();
await pc.setLocalDescription(offer);

                        ─────→ [전달]
                           socket.emit('offer', {
                             target: 'userB',
                             offer
                           })

                                                    5️⃣ Offer 수신
                                                    ────────────────────
                                    [수신] ←─────   socket.on('offer', async (data) => {
                                                      await pc.setRemoteDescription(data.offer);
                                                    })

                                                    6️⃣ PeerConnection 생성 (B도)
                                                    ────────────────────
                                                    pc = new RTCPeerConnection({
                                                      iceServers: [...]
                                                    });

                                                    7️⃣ 미디어 스트림 추가 (B도)
                                                    ────────────────────
                                                    stream = await navigator
                                                      .mediaDevices
                                                      .getUserMedia({ video: true });

                                                    stream.getTracks().forEach(track => {
                                                      pc.addTrack(track, stream);
                                                    });

                                                    8️⃣ Answer 생성
                                                    ────────────────────
                                                    answer = await pc.createAnswer();
                                                    await pc.setLocalDescription(answer);

                                    [전달] ←─────   socket.emit('answer', {
                                                      target: 'userA',
                                                      answer
                                                    })

9️⃣ Answer 수신
────────────────────
socket.on('answer', async (data) => {
  await pc.setRemoteDescription(data.answer);
});

🔟 ICE 후보 교환 (양방향)
────────────────────────────────────────────────────────────────
A: pc.onicecandidate 발생    ──→  [시그널링]  ──→  B: pc.addIceCandidate()
B: pc.onicecandidate 발생    ──→  [시그널링]  ──→  A: pc.addIceCandidate()
A: pc.onicecandidate 발생    ──→  [시그널링]  ──→  B: pc.addIceCandidate()
B: pc.onicecandidate 발생    ──→  [시그널링]  ──→  A: pc.addIceCandidate()
...

1️⃣1️⃣ 연결 성공!
────────────────────────────────────────────────────────────────
pc.onconnectionstatechange = () => {
  if (pc.connectionState === 'connected') {
    console.log('✅ P2P 연결 성공!');
  }
};

1️⃣2️⃣ 미디어 수신
────────────────────────────────────────────────────────────────
pc.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

1️⃣3️⃣ 이제 시그널링 서버 없이 직접 통신!
────────────────────────────────────────────────────────────────
[A 브라우저] ←──────── P2P 직접 연결 ────────→ [B 브라우저]
  비디오/오디오                                  비디오/오디오
```

### 4.2 각 단계별 상세 설명

#### 1️⃣ PeerConnection 생성

```javascript
// RTCPeerConnection = WebRTC 연결을 담당하는 객체

const config = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'  // Google STUN 서버
    }
  ]
};

const peerConnection = new RTCPeerConnection(config);

// 생성 시점에 ICE Gathering 시작
// → STUN 서버에 자동으로 요청 보냄
// → 공인 IP 조회
```

#### 2️⃣ 미디어 스트림 추가

```javascript
// 카메라/마이크 권한 요청
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

// PeerConnection에 트랙 추가
stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream);
});

// 이 트랙들이 Offer SDP에 포함됨
// → 상대방이 "어떤 미디어를 받을지" 알 수 있음
```

#### 3️⃣ ICE Candidate 이벤트

```javascript
// ICE 후보가 발견될 때마다 발생
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('ICE 후보 발견:', event.candidate);

    // 즉시 시그널링 서버로 전송
    socket.emit('ice-candidate', {
      target: 'otherUserId',
      candidate: event.candidate
    });
  } else {
    console.log('ICE 수집 완료');
  }
};

// 발생 시점:
// - Host candidate: 즉시
// - Server Reflexive: STUN 응답 받은 후 (~100ms)
// - Relay: TURN 연결 후 (~500ms)
```

#### 4️⃣ Offer 생성

```javascript
const offer = await peerConnection.createOffer();

console.log(offer);
// {
//   type: "offer",
//   sdp: "v=0\no=- 123...\nm=audio 9 UDP/TLS/RTP/SAVPF 111..."
// }

// Local Description으로 설정
await peerConnection.setLocalDescription(offer);

// 시그널링 서버로 전송
socket.emit('offer', {
  target: 'userB',
  offer: peerConnection.localDescription
});
```

#### 5️⃣ Offer 수신 (B 쪽)

```javascript
socket.on('offer', async (data) => {
  console.log('Offer 받음:', data.offer);

  // Remote Description으로 설정
  await peerConnection.setRemoteDescription(data.offer);

  // 이제 B는 A의 미디어 정보를 알게 됨
  // → Answer 생성 가능
});
```

#### 8️⃣ Answer 생성 (B 쪽)

```javascript
const answer = await peerConnection.createAnswer();

console.log(answer);
// {
//   type: "answer",
//   sdp: "v=0\no=- 456...\nm=audio 9 UDP/TLS/RTP/SAVPF 111..."
// }

await peerConnection.setLocalDescription(answer);

socket.emit('answer', {
  target: 'userA',
  answer: peerConnection.localDescription
});
```

#### 9️⃣ Answer 수신 (A 쪽)

```javascript
socket.on('answer', async (data) => {
  console.log('Answer 받음:', data.answer);

  await peerConnection.setRemoteDescription(data.answer);

  // 이제 A와 B 모두 상대방의 정보를 알게 됨
  // → ICE 연결 시작
});
```

#### 🔟 ICE Candidate 교환

```javascript
// A → B로 ICE 후보 전송
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', {
      target: 'userB',
      candidate: event.candidate
    });
  }
};

// B가 A의 ICE 후보 수신
socket.on('ice-candidate', async (data) => {
  try {
    await peerConnection.addIceCandidate(data.candidate);
    console.log('ICE 후보 추가 완료');
  } catch (error) {
    console.error('ICE 후보 추가 실패:', error);
  }
});

// 양방향으로 계속 교환
// → 최적의 경로 찾기
```

#### 1️⃣1️⃣ 연결 성공

```javascript
peerConnection.onconnectionstatechange = () => {
  console.log('연결 상태:', peerConnection.connectionState);

  switch (peerConnection.connectionState) {
    case 'new':
      console.log('연결 준비 중...');
      break;
    case 'connecting':
      console.log('연결 시도 중...');
      break;
    case 'connected':
      console.log('✅ P2P 연결 성공!');
      break;
    case 'disconnected':
      console.log('연결 끊김 (재연결 시도 중)');
      break;
    case 'failed':
      console.log('❌ 연결 실패');
      break;
    case 'closed':
      console.log('연결 종료');
      break;
  }
};
```

---

## 5. 실제 코드로 보는 플로우

### 5.1 프론트엔드 전체 코드 (사용자 A - Offer 쪽)

```javascript
// ===== WebRTC.js - 사용자 A (방 생성자) =====

import { io } from 'socket.io-client';

// 시그널링 서버 연결
const socket = io('http://localhost:3000');

// PeerConnection 저장소 (여러 사용자와 연결)
const peerConnections = new Map();

// 내 비디오 스트림
let localStream = null;

// STUN 서버 설정
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },  // Google STUN
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// ===== 1. 카메라/마이크 시작 =====
async function startMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    // 내 비디오 화면에 표시
    document.getElementById('localVideo').srcObject = localStream;

    console.log('✅ 미디어 스트림 시작');

  } catch (error) {
    console.error('❌ 미디어 접근 실패:', error);
  }
}

// ===== 2. PeerConnection 생성 함수 =====
function createPeerConnection(remoteUserId) {
  const pc = new RTCPeerConnection(config);

  // 로컬 스트림의 트랙 추가
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  // ICE 후보 이벤트
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('ICE 후보 발견:', event.candidate.candidate);

      // 시그널링 서버로 전송
      socket.emit('ice-candidate', {
        target: remoteUserId,
        candidate: event.candidate
      });
    }
  };

  // 원격 스트림 수신
  pc.ontrack = (event) => {
    console.log('원격 스트림 수신:', event.streams[0]);

    // 상대방 비디오 화면에 표시
    const remoteVideo = document.getElementById(`remoteVideo-${remoteUserId}`);
    if (remoteVideo) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  // 연결 상태 변경
  pc.onconnectionstatechange = () => {
    console.log(`[${remoteUserId}] 연결 상태:`, pc.connectionState);

    if (pc.connectionState === 'connected') {
      console.log(`✅ ${remoteUserId}와 P2P 연결 성공!`);
    }
  };

  // ICE 연결 상태 변경
  pc.oniceconnectionstatechange = () => {
    console.log(`[${remoteUserId}] ICE 상태:`, pc.iceConnectionState);
  };

  peerConnections.set(remoteUserId, pc);
  return pc;
}

// ===== 3. Offer 전송 (방 생성자가 먼저) =====
async function sendOffer(remoteUserId) {
  const pc = createPeerConnection(remoteUserId);

  try {
    // Offer 생성
    const offer = await pc.createOffer();

    console.log('Offer 생성:', offer);

    // Local Description 설정
    await pc.setLocalDescription(offer);

    console.log('Local Description 설정 완료');

    // 시그널링 서버로 전송
    socket.emit('offer', {
      target: remoteUserId,
      offer: pc.localDescription
    });

    console.log(`✅ Offer 전송 완료 → ${remoteUserId}`);

  } catch (error) {
    console.error('❌ Offer 생성 실패:', error);
  }
}

// ===== 4. Answer 수신 =====
socket.on('answer', async (data) => {
  console.log(`Answer 수신 ← ${data.from}`, data.answer);

  const pc = peerConnections.get(data.from);

  if (pc) {
    try {
      // Remote Description 설정
      await pc.setRemoteDescription(data.answer);

      console.log('Remote Description 설정 완료');

    } catch (error) {
      console.error('❌ Answer 처리 실패:', error);
    }
  }
});

// ===== 5. ICE Candidate 수신 =====
socket.on('ice-candidate', async (data) => {
  console.log(`ICE 후보 수신 ← ${data.from}`, data.candidate.candidate);

  const pc = peerConnections.get(data.from);

  if (pc) {
    try {
      await pc.addIceCandidate(data.candidate);

      console.log('ICE 후보 추가 완료');

    } catch (error) {
      console.error('❌ ICE 후보 추가 실패:', error);
    }
  }
});

// ===== 6. 방 생성 =====
async function createRoom(roomId) {
  await startMedia();

  socket.emit('create-room', roomId, (response) => {
    if (response.success) {
      console.log('✅ 방 생성 완료:', response.roomId);
    }
  });
}

// ===== 7. 새 사용자 입장 시 Offer 전송 =====
socket.on('user-joined', (data) => {
  console.log(`새 사용자 입장: ${data.userId}`);

  // 새 사용자에게 Offer 전송
  setTimeout(() => {
    sendOffer(data.userId);
  }, 1000);
});
```

### 5.2 프론트엔드 전체 코드 (사용자 B - Answer 쪽)

```javascript
// ===== WebRTC.js - 사용자 B (방 입장자) =====

// ===== 1. Offer 수신 =====
socket.on('offer', async (data) => {
  console.log(`Offer 수신 ← ${data.from}`, data.offer);

  // PeerConnection 생성
  const pc = createPeerConnection(data.from);

  try {
    // Remote Description 설정 (상대방 정보)
    await pc.setRemoteDescription(data.offer);

    console.log('Remote Description 설정 완료');

    // Answer 생성
    const answer = await pc.createAnswer();

    console.log('Answer 생성:', answer);

    // Local Description 설정
    await pc.setLocalDescription(answer);

    console.log('Local Description 설정 완료');

    // 시그널링 서버로 전송
    socket.emit('answer', {
      target: data.from,
      answer: pc.localDescription
    });

    console.log(`✅ Answer 전송 완료 → ${data.from}`);

  } catch (error) {
    console.error('❌ Answer 생성 실패:', error);
  }
});

// ===== 2. 방 입장 =====
async function joinRoom(roomId) {
  await startMedia();

  socket.emit('join-room', roomId, (response) => {
    if (response.success) {
      console.log('✅ 방 입장 완료:', response.roomId);
      console.log('기존 참여자:', response.existingUsers);

      // 기존 참여자들에게 Offer 전송
      // (실제로는 기존 참여자가 먼저 Offer 보냄)
    }
  });
}
```

---

## 6. 시그널링 서버의 역할

### 6.1 시그널링 서버는 "우체부"

```javascript
// 시그널링 서버 = Offer/Answer/ICE를 전달하는 우체부
// WebRTC 연결 자체에는 관여하지 않음!

// ===== backend/server.js =====

// Offer 중계
socket.on('offer', (data) => {
  console.log(`Offer 중계: ${socket.id} → ${data.target}`);

  // 그냥 전달만 함 (내용 몰라도 됨)
  socket.to(data.target).emit('offer', {
    offer: data.offer,
    from: socket.id
  });
});

// Answer 중계
socket.on('answer', (data) => {
  console.log(`Answer 중계: ${socket.id} → ${data.target}`);

  socket.to(data.target).emit('answer', {
    answer: data.answer,
    from: socket.id
  });
});

// ICE Candidate 중계
socket.on('ice-candidate', (data) => {
  console.log(`ICE 중계: ${socket.id} → ${data.target}`);

  socket.to(data.target).emit('ice-candidate', {
    candidate: data.candidate,
    from: socket.id
  });
});
```

### 6.2 연결 후에는?

```
[연결 전]
A ←→ 시그널링 서버 ←→ B
    (Offer/Answer/ICE 교환)

[연결 후]
A ←──────────────────→ B
    P2P 직접 연결!
    (시그널링 서버 불필요)
```

---

## 7. 핵심 정리

### Offer
- **역할**: "나는 이런 미디어를 보낼 수 있어!" (제안서)
- **생성**: `pc.createOffer()`
- **포함 정보**: 코덱, 해상도, ICE 후보, 암호화 키
- **보내는 쪽**: 먼저 연결 시작하는 쪽 (방 생성자)

### Answer
- **역할**: "좋아, 나도 이걸 지원해!" (응답서)
- **생성**: `pc.createAnswer()`
- **포함 정보**: Offer와 동일 (단, 합의된 내용만)
- **보내는 쪽**: Offer 받은 쪽 (방 입장자)

### ICE Candidate
- **역할**: "나한테 연결하려면 이 주소로 와!" (네트워크 경로)
- **생성**: 자동 (STUN/TURN 서버 조회)
- **종류**: Host, Server Reflexive, Relay
- **교환**: 발견 즉시 전송 (계속 추가됨)

### 시그널링 서버
- **역할**: Offer/Answer/ICE를 전달하는 우체부
- **사용 시점**: WebRTC 연결 전
- **연결 후**: 불필요 (P2P 직접 통신)

---

## 8. 다음 학습

- [프론트엔드 WebRTC 구현](./프론트엔드_WebRTC_구현.md)
- [STUN/TURN 서버 설정](./STUN_TURN_서버_설정.md)
- [WebRTC 디버깅 방법](./WebRTC_디버깅.md)
