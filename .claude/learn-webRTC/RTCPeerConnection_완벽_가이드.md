# RTCPeerConnection 완벽 가이드

> 작성일: 2025-12-31
> 대상: 주니어 개발자
> 목적: RTCPeerConnection (pc)의 모든 것을 이해하기

---

## 목차

1. [RTCPeerConnection이란?](#1-rtcpeerconnection이란)
2. [생성 및 설정](#2-생성-및-설정)
3. [주요 메서드](#3-주요-메서드)
4. [주요 이벤트](#4-주요-이벤트)
5. [상태 관리](#5-상태-관리)
6. [미디어 관리](#6-미디어-관리)
7. [데이터 채널](#7-데이터-채널)
8. [실전 패턴](#8-실전-패턴)
9. [디버깅 및 모니터링](#9-디버깅-및-모니터링)

---

## 1. RTCPeerConnection이란?

### 1.1 정의

**RTCPeerConnection = 두 브라우저 간의 P2P 연결을 관리하는 핵심 객체**

```javascript
// pc = PeerConnection의 약자
const pc = new RTCPeerConnection(config);

// 역할:
// 1. Offer/Answer 생성 및 교환
// 2. ICE 후보 수집 및 관리
// 3. 미디어 스트림 송수신
// 4. 연결 상태 관리
// 5. 데이터 채널 생성
// 6. 암호화 (DTLS, SRTP)
```

### 1.2 비유로 이해하기

```
RTCPeerConnection = 전화기

- 전화 걸기/받기 (Offer/Answer)
- 전화선 연결 (ICE)
- 음성 전송 (Audio Track)
- 영상 전송 (Video Track)
- 연결 상태 확인 (connectionState)
- 전화 끊기 (close)
```

### 1.3 Django와 비교

| Django       | RTCPeerConnection |
| ------------ | ----------------- |
| HttpRequest  | 요청 관리         |
| HttpResponse | 응답 관리         |
| WSGI Server  | 연결 관리         |
| Middleware   | 이벤트 핸들러     |
| ORM          | 미디어 트랙 관리  |

---

## 2. 생성 및 설정

### 2.1 기본 생성

```javascript
// ===== 최소 설정 =====
const pc = new RTCPeerConnection();

// ⚠️ 문제점: STUN 서버 없음
// → 공인 IP를 찾을 수 없음
// → NAT 뒤에서 연결 실패 가능
```

### 2.2 STUN 서버 설정 (권장)

```javascript
const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302", // Google 무료 STUN
    },
  ],
};

const pc = new RTCPeerConnection(config);

// ✅ 장점:
// - 공인 IP 자동 조회
// - NAT 통과 가능
// - 무료 사용
```

### 2.3 다중 STUN 서버

```javascript
const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const pc = new RTCPeerConnection(config);

// ✅ 장점:
// - 하나 실패해도 다른 서버 사용
// - 안정성 향상
```

### 2.4 STUN + TURN 서버 (실전)

```javascript
const config = {
  iceServers: [
    // STUN 서버 (무료)
    {
      urls: "stun:stun.l.google.com:19302",
    },
    // TURN 서버 (유료, 중계용)
    {
      urls: "turn:turn.example.com:3478",
      username: "myuser",
      credential: "mypassword",
    },
  ],
};

const pc = new RTCPeerConnection(config);

// ✅ 장점:
// - 직접 연결 실패 시 TURN 서버로 중계
// - 기업 방화벽, 대칭형 NAT 통과 가능
// - 연결 성공률 95% 이상
```

### 2.5 추가 설정 옵션

```javascript
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],

  // ICE 전송 정책
  iceTransportPolicy: "all", // 'all' | 'relay'
  // 'all': 모든 후보 사용 (기본값)
  // 'relay': TURN만 사용 (보안 강화, 느림)

  // Bundle 정책
  bundlePolicy: "balanced", // 'balanced' | 'max-compat' | 'max-bundle'

  // RTCP Mux 정책
  rtcpMuxPolicy: "require", // 'negotiate' | 'require'

  // 인증서
  certificates: [], // RTCCertificate[]
};

const pc = new RTCPeerConnection(config);
```

---

## 3. 주요 메서드

### 3.1 Offer/Answer 관련

#### createOffer()

```javascript
// ===== Offer 생성 (방 생성자가 호출) =====
const offer = await pc.createOffer();

console.log(offer);
// {
//   type: "offer",
//   sdp: "v=0\no=- 123456789 2 IN IP4 127.0.0.1\n..."
// }

// 옵션 사용
const offer = await pc.createOffer({
  offerToReceiveAudio: true, // 오디오 수신 원함
  offerToReceiveVideo: true, // 비디오 수신 원함
  iceRestart: false, // ICE 재시작 여부
});
```

#### createAnswer()

```javascript
// ===== Answer 생성 (방 입장자가 호출) =====
// ⚠️ 주의: setRemoteDescription(offer) 먼저 호출 필요!

await pc.setRemoteDescription(receivedOffer);

const answer = await pc.createAnswer();

console.log(answer);
// {
//   type: "answer",
//   sdp: "v=0\no=- 987654321 2 IN IP4 127.0.0.1\n..."
// }
```

#### setLocalDescription()

```javascript
// ===== 내 SDP 설정 =====

// Offer 쪽
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

// Answer 쪽
const answer = await pc.createAnswer();
await pc.setLocalDescription(answer);

// 확인
console.log(pc.localDescription);
// {
//   type: "offer" | "answer",
//   sdp: "..."
// }
```

#### setRemoteDescription()

```javascript
// ===== 상대방 SDP 설정 =====

// Offer 받은 쪽 (Answer 생성 전)
await pc.setRemoteDescription(receivedOffer);

// Answer 받은 쪽
await pc.setRemoteDescription(receivedAnswer);

// 확인
console.log(pc.remoteDescription);
// {
//   type: "offer" | "answer",
//   sdp: "..."
// }
```

### 3.2 ICE 관련

#### addIceCandidate()

```javascript
// ===== ICE 후보 추가 =====

socket.on("ice-candidate", async (data) => {
  try {
    await pc.addIceCandidate(data.candidate);
    console.log("✅ ICE 후보 추가 완료");
  } catch (error) {
    console.error("❌ ICE 후보 추가 실패:", error);
  }
});

// ⚠️ 주의:
// setRemoteDescription() 호출 후에만 추가 가능
// 순서: setRemoteDescription → addIceCandidate
```

### 3.3 미디어 트랙 관리

#### addTrack()

```javascript
// ===== 트랙 추가 (송신) =====

const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});

// 모든 트랙 추가
stream.getTracks().forEach((track) => {
  pc.addTrack(track, stream);
});

// 또는 개별 추가
const videoTrack = stream.getVideoTracks()[0];
pc.addTrack(videoTrack, stream);

// 반환값: RTCRtpSender
const sender = pc.addTrack(track, stream);
console.log(sender);
// RTCRtpSender {
//   track: MediaStreamTrack,
//   transport: RTCDtlsTransport,
//   ...
// }
```

#### removeTrack()

```javascript
// ===== 트랙 제거 =====

const senders = pc.getSenders();

// 모든 트랙 제거
senders.forEach((sender) => {
  pc.removeTrack(sender);
});

// 비디오만 제거
senders.forEach((sender) => {
  if (sender.track?.kind === "video") {
    pc.removeTrack(sender);
  }
});
```

#### getSenders()

```javascript
// ===== 송신 중인 트랙 조회 =====

const senders = pc.getSenders();

console.log(senders);
// [
//   RTCRtpSender { track: VideoTrack },
//   RTCRtpSender { track: AudioTrack }
// ]

// 트랙 정보 확인
senders.forEach((sender) => {
  const track = sender.track;
  if (track) {
    console.log(`${track.kind}: ${track.label}`);
    // video: Front Camera
    // audio: Built-in Microphone
  }
});
```

#### getReceivers()

```javascript
// ===== 수신 중인 트랙 조회 =====

const receivers = pc.getReceivers();

console.log(receivers);
// [
//   RTCRtpReceiver { track: VideoTrack },
//   RTCRtpReceiver { track: AudioTrack }
// ]
```

#### getTransceivers()

```javascript
// ===== 송수신기 조회 =====
// Transceiver = Sender + Receiver

const transceivers = pc.getTransceivers();

console.log(transceivers);
// [
//   RTCRtpTransceiver {
//     sender: RTCRtpSender,
//     receiver: RTCRtpReceiver,
//     direction: "sendrecv",  // sendrecv, sendonly, recvonly, inactive
//     currentDirection: "sendrecv"
//   }
// ]
```

### 3.4 통계 및 관리

#### getStats()

```javascript
// ===== 연결 통계 조회 =====

const stats = await pc.getStats();

stats.forEach((report) => {
  console.log(report.type, report);
});

// 출력 예시:
// inbound-rtp { bytesReceived: 1234567, packetsLost: 0, ... }
// outbound-rtp { bytesSent: 7654321, packetsSent: 5000, ... }
// candidate-pair { state: "succeeded", bytesReceived: ..., ... }
// local-candidate { ip: "192.168.0.5", port: 54321, ... }
// remote-candidate { ip: "203.0.113.1", port: 12345, ... }

// 특정 트랙 통계
const sender = pc.getSenders()[0];
const senderStats = await sender.getStats();
```

#### close()

```javascript
// ===== 연결 종료 =====

pc.close();

console.log(pc.connectionState); // 'closed'
console.log(pc.signalingState); // 'closed'

// ⚠️ 주의: close() 후에는 재사용 불가능
// 새 연결 필요 시 새로운 RTCPeerConnection 생성
```

#### restartIce()

```javascript
// ===== ICE 재시작 =====
// 네트워크 변경 시 (WiFi → LTE 등)

// 1. ICE 재시작 요청
const offer = await pc.createOffer({ iceRestart: true });
await pc.setLocalDescription(offer);

// 2. 시그널링 서버로 전송
socket.emit("offer", { target: remoteUserId, offer });

// 3. 상대방도 Answer 재생성
```

---

## 4. 주요 이벤트

### 4.1 onicecandidate

```javascript
// ===== ICE 후보 발견 시 =====

pc.onicecandidate = (event) => {
  if (event.candidate) {
    console.log("ICE 후보 발견:", event.candidate);
    console.log("타입:", event.candidate.type); // host, srflx, relay
    console.log("주소:", event.candidate.candidate);

    // 시그널링 서버로 전송
    socket.emit("ice-candidate", {
      target: remoteUserId,
      candidate: event.candidate,
    });
  } else {
    console.log("ICE 수집 완료");
  }
};

// 발생 시점:
// - Host candidate: 즉시
// - Server Reflexive: STUN 응답 후 (~100ms)
// - Relay: TURN 연결 후 (~500ms)
```

### 4.2 ontrack

```javascript
// ===== 원격 스트림 수신 시 =====

pc.ontrack = (event) => {
  console.log("트랙 수신:", event.track);
  console.log("스트림:", event.streams[0]);

  const track = event.track;
  const stream = event.streams[0];

  // 트랙 정보
  console.log("종류:", track.kind); // 'video' | 'audio'
  console.log("라벨:", track.label); // 'Front Camera'
  console.log("활성:", track.enabled); // true | false
  console.log("준비:", track.readyState); // 'live' | 'ended'

  // 비디오 요소에 연결
  const videoElement = document.getElementById("remoteVideo");
  videoElement.srcObject = stream;

  // 트랙 이벤트 리스너
  track.onended = () => {
    console.log("트랙 종료됨");
  };

  track.onmute = () => {
    console.log("트랙 음소거됨");
  };

  track.onunmute = () => {
    console.log("트랙 음소거 해제됨");
  };
};
```

### 4.3 onconnectionstatechange

```javascript
// ===== 연결 상태 변경 시 =====

pc.onconnectionstatechange = () => {
  console.log("연결 상태:", pc.connectionState);

  switch (pc.connectionState) {
    case "new":
      console.log("🔵 연결 준비 중...");
      break;

    case "connecting":
      console.log("🟡 연결 시도 중...");
      showLoadingSpinner();
      break;

    case "connected":
      console.log("✅ 연결 성공!");
      hideLoadingSpinner();
      showVideoChat();
      break;

    case "disconnected":
      console.log("⚠️ 연결 끊김 (재연결 시도 중...)");
      showReconnectingMessage();
      break;

    case "failed":
      console.log("❌ 연결 실패");
      showErrorMessage("연결에 실패했습니다");
      pc.close();
      break;

    case "closed":
      console.log("⚫ 연결 종료");
      cleanupUI();
      break;
  }
};
```

### 4.4 oniceconnectionstatechange

```javascript
// ===== ICE 연결 상태 변경 시 =====

pc.oniceconnectionstatechange = () => {
  console.log("ICE 상태:", pc.iceConnectionState);

  switch (pc.iceConnectionState) {
    case "new":
      console.log("ICE 시작");
      break;

    case "checking":
      console.log("ICE 체크 중...");
      break;

    case "connected":
      console.log("ICE 연결됨");
      break;

    case "completed":
      console.log("ICE 완료");
      break;

    case "failed":
      console.log("ICE 실패");
      // TURN 서버 추가 고려
      break;

    case "disconnected":
      console.log("ICE 끊김");
      // 재연결 시도
      break;

    case "closed":
      console.log("ICE 종료");
      break;
  }
};
```

### 4.5 onicegatheringstatechange

```javascript
// ===== ICE 수집 상태 변경 시 =====

pc.onicegatheringstatechange = () => {
  console.log("ICE Gathering 상태:", pc.iceGatheringState);

  switch (pc.iceGatheringState) {
    case "new":
      console.log("ICE 수집 시작 전");
      break;

    case "gathering":
      console.log("ICE 후보 수집 중...");
      showProgressBar();
      break;

    case "complete":
      console.log("ICE 수집 완료");
      hideProgressBar();
      break;
  }
};
```

### 4.6 onsignalingstatechange

```javascript
// ===== 시그널링 상태 변경 시 =====

pc.onsignalingstatechange = () => {
  console.log("시그널링 상태:", pc.signalingState);

  switch (pc.signalingState) {
    case "stable":
      console.log("안정 상태 (Offer/Answer 교환 완료)");
      break;

    case "have-local-offer":
      console.log("Local Offer 설정 완료");
      break;

    case "have-remote-offer":
      console.log("Remote Offer 수신 완료");
      break;

    case "have-local-pranswer":
      console.log("Local Provisional Answer 설정");
      break;

    case "have-remote-pranswer":
      console.log("Remote Provisional Answer 수신");
      break;

    case "closed":
      console.log("PeerConnection 종료됨");
      break;
  }
};
```

### 4.7 onnegotiationneeded

```javascript
// ===== 재협상 필요 시 =====
// 트랙 추가/제거 시 자동 발생

pc.onnegotiationneeded = async () => {
  console.log("재협상 필요");

  try {
    // 새로운 Offer 생성
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // 시그널링 서버로 전송
    socket.emit("offer", {
      target: remoteUserId,
      offer: pc.localDescription,
    });
  } catch (error) {
    console.error("재협상 실패:", error);
  }
};

// 발생 조건:
// - addTrack() 호출
// - removeTrack() 호출
// - addTransceiver() 호출
```

### 4.8 ondatachannel

```javascript
// ===== 데이터 채널 수신 시 =====

pc.ondatachannel = (event) => {
  const channel = event.channel;

  console.log("데이터 채널 받음:", channel.label);

  channel.onopen = () => {
    console.log("데이터 채널 열림");
  };

  channel.onmessage = (event) => {
    console.log("메시지 받음:", event.data);
  };

  channel.onclose = () => {
    console.log("데이터 채널 닫힘");
  };
};
```

---

## 5. 상태 관리

### 5.1 연결 상태 다이어그램

```
new
 ↓
connecting ←─────┐
 ↓               │
connected        │ (네트워크 변경)
 ↓               │
disconnected ────┘
 ↓
failed
 ↓
closed
```

### 5.2 시그널링 상태 다이어그램

```
[Offer 쪽]
stable
 ↓ createOffer()
have-local-offer
 ↓ setRemoteDescription(answer)
stable

[Answer 쪽]
stable
 ↓ setRemoteDescription(offer)
have-remote-offer
 ↓ createAnswer()
stable
```

### 5.3 ICE 연결 상태 다이어그램

```
new
 ↓
checking
 ↓
connected
 ↓
completed
 ↓ (네트워크 변경)
disconnected
 ↓ (복구 실패)
failed
 ↓
closed
```

---

## 6. 미디어 관리

### 6.1 트랙 추가/제거

```javascript
// ===== 비디오 토글 =====
let videoEnabled = true;

function toggleVideo() {
  const senders = pc.getSenders();
  const videoSender = senders.find((s) => s.track?.kind === "video");

  if (videoSender && videoSender.track) {
    videoSender.track.enabled = !videoSender.track.enabled;
    videoEnabled = videoSender.track.enabled;

    console.log(`비디오: ${videoEnabled ? "ON" : "OFF"}`);
  }
}

// ===== 오디오 음소거 =====
let audioMuted = false;

function toggleAudio() {
  const senders = pc.getSenders();
  const audioSender = senders.find((s) => s.track?.kind === "audio");

  if (audioSender && audioSender.track) {
    audioSender.track.enabled = !audioSender.track.enabled;
    audioMuted = !audioSender.track.enabled;

    console.log(`오디오: ${audioMuted ? "MUTED" : "UNMUTED"}`);
  }
}
```

### 6.2 화면 공유

```javascript
// ===== 화면 공유 시작 =====
async function startScreenShare() {
  try {
    // 화면 스트림 가져오기
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
      },
      audio: false,
    });

    const screenTrack = screenStream.getVideoTracks()[0];

    // 기존 비디오 트랙 찾기
    const senders = pc.getSenders();
    const videoSender = senders.find((s) => s.track?.kind === "video");

    if (videoSender) {
      // 비디오 트랙 교체
      await videoSender.replaceTrack(screenTrack);
      console.log("✅ 화면 공유 시작");

      // 화면 공유 종료 시 원래 카메라로 복귀
      screenTrack.onended = () => {
        stopScreenShare();
      };
    }
  } catch (error) {
    console.error("❌ 화면 공유 실패:", error);
  }
}

// ===== 화면 공유 종료 =====
async function stopScreenShare() {
  try {
    // 카메라 스트림 가져오기
    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    const cameraTrack = cameraStream.getVideoTracks()[0];

    // 비디오 트랙 교체
    const senders = pc.getSenders();
    const videoSender = senders.find((s) => s.track?.kind === "video");

    if (videoSender) {
      await videoSender.replaceTrack(cameraTrack);
      console.log("✅ 카메라로 복귀");
    }
  } catch (error) {
    console.error("❌ 카메라 복귀 실패:", error);
  }
}
```

### 6.3 코덱 제어

```javascript
// ===== 선호 코덱 설정 =====
async function setPreferredCodec(pc, codecName) {
  const transceivers = pc.getTransceivers();

  transceivers.forEach((transceiver) => {
    if (transceiver.sender.track?.kind === "video") {
      const capabilities = RTCRtpSender.getCapabilities("video");
      const codecs = capabilities.codecs;

      // 원하는 코덱 찾기
      const preferredCodecs = codecs.filter((codec) =>
        codec.mimeType.toLowerCase().includes(codecName.toLowerCase())
      );

      // 나머지 코덱
      const otherCodecs = codecs.filter(
        (codec) =>
          !codec.mimeType.toLowerCase().includes(codecName.toLowerCase())
      );

      // 선호 코덱을 맨 앞에 배치
      transceiver.setCodecPreferences([...preferredCodecs, ...otherCodecs]);

      console.log(`✅ ${codecName} 코덱 우선 설정`);
    }
  });
}

// 사용 예시
await setPreferredCodec(pc, "VP9"); // VP9 우선
await setPreferredCodec(pc, "H264"); // H.264 우선
```

---

## 7. 데이터 채널

### 7.1 데이터 채널 생성

```javascript
// ===== 데이터 채널 생성 (Offer 쪽) =====
const dataChannel = pc.createDataChannel("chat", {
  ordered: true, // 순서 보장
  maxRetransmits: 3, // 재전송 횟수
  // maxPacketLifeTime: 3000, // 재전송 시간 (ms)
});

console.log("데이터 채널 생성:", dataChannel.label);

// 이벤트 리스너
dataChannel.onopen = () => {
  console.log("✅ 데이터 채널 열림");
  dataChannel.send("Hello!");
};

dataChannel.onmessage = (event) => {
  console.log("메시지 받음:", event.data);
};

dataChannel.onclose = () => {
  console.log("데이터 채널 닫힘");
};

dataChannel.onerror = (error) => {
  console.error("데이터 채널 에러:", error);
};

// ===== 데이터 채널 수신 (Answer 쪽) =====
pc.ondatachannel = (event) => {
  const channel = event.channel;

  channel.onmessage = (event) => {
    console.log("메시지 받음:", event.data);

    // 응답 전송
    channel.send("Received!");
  };
};
```

### 7.2 데이터 전송

```javascript
// ===== 텍스트 전송 =====
dataChannel.send("Hello, World!");

// ===== JSON 전송 =====
const message = {
  type: "chat",
  text: "Hello!",
  timestamp: Date.now(),
};
dataChannel.send(JSON.stringify(message));

// ===== 바이너리 전송 =====
const buffer = new Uint8Array([1, 2, 3, 4, 5]);
dataChannel.send(buffer);

// ===== 파일 전송 =====
async function sendFile(file) {
  const chunkSize = 16384; // 16KB
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    const arrayBuffer = await chunk.arrayBuffer();

    dataChannel.send(arrayBuffer);

    offset += chunkSize;

    // 진행률 표시
    const progress = (offset / file.size) * 100;
    console.log(`전송 중: ${progress.toFixed(2)}%`);
  }

  console.log("✅ 파일 전송 완료");
}
```

---

## 8. 실전 패턴

### 8.1 PeerConnection 관리자 클래스

```javascript
class PeerConnectionManager {
  constructor(socket, localStream) {
    this.socket = socket;
    this.localStream = localStream;
    this.peerConnections = new Map();

    this.config = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };
  }

  create(userId) {
    if (this.peerConnections.has(userId)) {
      console.warn(`이미 연결 존재: ${userId}`);
      return this.peerConnections.get(userId);
    }

    const pc = new RTCPeerConnection(this.config);

    // 트랙 추가
    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream);
    });

    // 이벤트 등록
    this.setupEventListeners(pc, userId);

    this.peerConnections.set(userId, pc);
    return pc;
  }

  setupEventListeners(pc, userId) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("ice-candidate", {
          target: userId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      this.handleRemoteTrack(userId, event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        this.close(userId);
      }
    };
  }

  handleRemoteTrack(userId, stream) {
    // 비디오 요소 생성 및 연결
    let video = document.getElementById(`video-${userId}`);

    if (!video) {
      video = document.createElement("video");
      video.id = `video-${userId}`;
      video.autoplay = true;
      video.playsinline = true;
      document.getElementById("remoteVideos").appendChild(video);
    }

    video.srcObject = stream;
  }

  get(userId) {
    return this.peerConnections.get(userId);
  }

  close(userId) {
    const pc = this.peerConnections.get(userId);

    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);

      const video = document.getElementById(`video-${userId}`);
      if (video) video.remove();
    }
  }

  closeAll() {
    this.peerConnections.forEach((pc, userId) => {
      this.close(userId);
    });
  }
}
```

---

## 9. 디버깅 및 모니터링

### 9.1 chrome://webrtc-internals

```
Chrome 브라우저에서:
chrome://webrtc-internals 접속

확인 가능한 정보:
- PeerConnection 목록
- ICE 후보 목록
- 통계 그래프 (비트레이트, 패킷 손실 등)
- SDP 내용
- 이벤트 타임라인
```

### 9.2 통계 수집

```javascript
// ===== 1초마다 통계 수집 =====
setInterval(async () => {
  const stats = await pc.getStats();

  stats.forEach((report) => {
    if (report.type === "inbound-rtp" && report.kind === "video") {
      console.log("수신 비디오:", {
        bytesReceived: report.bytesReceived,
        packetsLost: report.packetsLost,
        framesDecoded: report.framesDecoded,
        fps: report.framesPerSecond,
      });
    }

    if (report.type === "outbound-rtp" && report.kind === "video") {
      console.log("송신 비디오:", {
        bytesSent: report.bytesSent,
        packetsSent: report.packetsSent,
        framesEncoded: report.framesEncoded,
      });
    }
  });
}, 1000);
```

### 9.3 연결 품질 모니터링

```javascript
class ConnectionQualityMonitor {
  constructor(pc) {
    this.pc = pc;
    this.previousStats = null;
  }

  async getQuality() {
    const stats = await this.pc.getStats();
    let quality = {
      video: { bitrate: 0, packetsLost: 0, fps: 0 },
      audio: { bitrate: 0, packetsLost: 0 },
    };

    stats.forEach((report) => {
      if (report.type === "inbound-rtp") {
        if (report.kind === "video") {
          quality.video.packetsLost = report.packetsLost;
          quality.video.fps = report.framesPerSecond;

          if (this.previousStats) {
            const prevReport = this.previousStats.get(report.id);
            if (prevReport) {
              const bytesDiff = report.bytesReceived - prevReport.bytesReceived;
              const timeDiff = report.timestamp - prevReport.timestamp;
              quality.video.bitrate = (
                ((bytesDiff * 8) / timeDiff) *
                1000
              ).toFixed(0);
            }
          }
        }

        if (report.kind === "audio") {
          quality.audio.packetsLost = report.packetsLost;
        }
      }
    });

    this.previousStats = stats;
    return quality;
  }

  getQualityLevel(quality) {
    if (quality.video.packetsLost > 100) return "poor";
    if (quality.video.bitrate < 500000) return "fair";
    if (quality.video.fps < 20) return "fair";
    return "good";
  }
}

// 사용
const monitor = new ConnectionQualityMonitor(pc);

setInterval(async () => {
  const quality = await monitor.getQuality();
  const level = monitor.getQualityLevel(quality);

  console.log("연결 품질:", level, quality);

  updateQualityIndicator(level); // UI 업데이트
}, 2000);
```

---

## 10. 핵심 정리

### RTCPeerConnection 생명주기

```javascript
// 1. 생성
const pc = new RTCPeerConnection(config);

// 2. 트랙 추가
stream.getTracks().forEach((track) => pc.addTrack(track, stream));

// 3. Offer/Answer 교환
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
// → 시그널링 서버 전송
// → Answer 받기
await pc.setRemoteDescription(answer);

// 4. ICE 교환
pc.onicecandidate = (event) => {
  /* 전송 */
};
// → ICE 후보 받기
await pc.addIceCandidate(candidate);

// 5. 연결 성공
pc.onconnectionstatechange = () => {
  if (pc.connectionState === "connected") {
    // ✅ P2P 연결 완료
  }
};

// 6. 미디어 수신
pc.ontrack = (event) => {
  videoElement.srcObject = event.streams[0];
};

// 7. 종료
pc.close();
```

### 필수 이벤트

```javascript
pc.onicecandidate; // ICE 후보 전송
pc.ontrack; // 원격 스트림 수신
pc.onconnectionstatechange; // 연결 상태 확인
```

### 주의사항

1. **순서 중요**: setRemoteDescription → addIceCandidate
2. **사용자별 PC**: 각 사용자마다 별도의 RTCPeerConnection 필요
3. **close 후 재사용 불가**: 새 연결 시 새로운 인스턴스 생성
4. **STUN 서버 필수**: NAT 통과를 위해 필수 설정

---

## 다음 학습

- [프론트엔드 WebRTC 완전 구현](./프론트엔드_WebRTC_완전_구현.md)
- [WebRTC 에러 처리](./WebRTC_에러_처리.md)
- [성능 최적화](./WebRTC_성능_최적화.md)
