# **WebRTC 완벽 가이드 - 주니어 개발자를 위한 학습 자료**

> 작성일: 2025-12-31 대상: 주니어 개발자 목적: WebRTC의 개념부터 실전 구현까지 완벽 이해
> 

---

## **📚 목차**

1. [WebRTC란 무엇인가?](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/user/Desktop/WebRTC_Learning/WebRTC_%EC%99%84%EB%B2%BD_%EA%B0%80%EC%9D%B4%EB%93%9C.md#1-webrtc%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80)
2. [WebRTC vs 다른 통신 기술](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/user/Desktop/WebRTC_Learning/WebRTC_%EC%99%84%EB%B2%BD_%EA%B0%80%EC%9D%B4%EB%93%9C.md#2-webrtc-vs-%EB%8B%A4%EB%A5%B8-%ED%86%B5%EC%8B%A0-%EA%B8%B0%EC%88%A0)
3. [WebRTC의 핵심 개념](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/user/Desktop/WebRTC_Learning/WebRTC_%EC%99%84%EB%B2%BD_%EA%B0%80%EC%9D%B4%EB%93%9C.md#3-webrtc%EC%9D%98-%ED%95%B5%EC%8B%AC-%EA%B0%9C%EB%85%90)
4. [필요한 서버들](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/user/Desktop/WebRTC_Learning/WebRTC_%EC%99%84%EB%B2%BD_%EA%B0%80%EC%9D%B4%EB%93%9C.md#4-%ED%95%84%EC%9A%94%ED%95%9C-%EC%84%9C%EB%B2%84%EB%93%A4)
5. [바닐라 JavaScript로 구현하기](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/user/Desktop/WebRTC_Learning/WebRTC_%EC%99%84%EB%B2%BD_%EA%B0%80%EC%9D%B4%EB%93%9C.md#5-%EB%B0%94%EB%8B%90%EB%9D%BC-javascript%EB%A1%9C-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0)
6. [라이브러리 사용하기](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/user/Desktop/WebRTC_Learning/WebRTC_%EC%99%84%EB%B2%BD_%EA%B0%80%EC%9D%B4%EB%93%9C.md#6-%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%AC-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0)
7. [실전 예제: 표정 챌린지 게임](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/user/Desktop/WebRTC_Learning/WebRTC_%EC%99%84%EB%B2%BD_%EA%B0%80%EC%9D%B4%EB%93%9C.md#7-%EC%8B%A4%EC%A0%84-%EC%98%88%EC%A0%9C-%ED%91%9C%EC%A0%95-%EC%B1%8C%EB%A6%B0%EC%A7%80-%EA%B2%8C%EC%9E%84)
8. [트러블슈팅](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/user/Desktop/WebRTC_Learning/WebRTC_%EC%99%84%EB%B2%BD_%EA%B0%80%EC%9D%B4%EB%93%9C.md#8-%ED%8A%B8%EB%9F%AC%EB%B8%94%EC%8A%88%ED%8C%85)
9. [체크리스트](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/user/Desktop/WebRTC_Learning/WebRTC_%EC%99%84%EB%B2%BD_%EA%B0%80%EC%9D%B4%EB%93%9C.md#9-%EC%B2%B4%ED%81%AC%EB%A6%AC%EC%8A%A4%ED%8A%B8)

---

## **1. WebRTC란 무엇인가?**

### **1.1 정의**

**WebRTC (Web Real-Time Communication)**

- 웹 브라우저 간 **실시간 통신**을 가능하게 하는 **오픈소스 기술**
- **별도 플러그인 없이** 브라우저만으로 비디오/오디오/데이터 전송 가능
- **P2P (Peer-to-Peer)** 방식으로 직접 연결

### **1.2 특징**

```
✅ 브라우저 내장 API (설치 불필요)
✅ P2P 직접 연결 (서버 부하 적음)
✅ 낮은 지연 시간 (실시간 통신)
✅ 암호화 기본 제공 (보안)
✅ 무료 오픈소스
```

### **1.3 주요 사용처**

```jsx
// 화상 회의
Zoom, Google Meet, Microsoft Teams

// 화면 공유
Discord, Slack 통화

// 온라인 게임
실시간 멀티플레이어

// 파일 공유
P2P 파일 전송

// IoT/스트리밍
보안 카메라, 라이브 방송

```

---

## **2. WebRTC vs 다른 통신 기술**

### **2.1 WebSocket과의 차이**

| 구분 | WebSocket | WebRTC |
| --- | --- | --- |
| **연결 방식** | 클라이언트 ↔ 서버 | 클라이언트 ↔ 클라이언트 (P2P) |
| **데이터 흐름** | 모든 데이터가 서버를 거침 | 직접 전송 (서버 안 거침) |
| **용도** | 채팅, 게임 명령어, 알림 | 비디오, 오디오, 대용량 데이터 |
| **서버 부하** | 높음 (모든 메시지 중계) | 낮음 (연결만 도와줌) |
| **지연 시간** | 중간 (~50-200ms) | 낮음 (~10-50ms) |

### **WebSocket 예시**

```jsx
// 모든 메시지가 서버를 거침
Alice → WebSocket 서버 → Bob
      (서버가 중계)

// 서버 부하 증가
100명 채팅 = 서버가 모든 메시지 중계

```

### **WebRTC 예시**

```jsx
// 직접 연결
Alice ←──────────→ Bob
   (서버 안 거침)

// 서버 부하 낮음
100명 화상 = 서버는 초기 연결만 도와줌

```

### **2.2 HTTP/REST API와의 차이**

```
HTTP/REST API:
- 요청 → 응답 (단방향)
- 실시간 아님
- 서버 중심

WebRTC:
- 양방향 실시간 스트리밍
- P2P 직접 연결
- 클라이언트 중심

```

### **2.3 언제 무엇을 사용해야 하나?**

```jsx
✅ WebSocket 사용:
- 채팅 메시지
- 게임 명령어
- 실시간 알림
- 주식 시세
- 게임 상태 동기화

✅ WebRTC 사용:
- 화상 통화
- 음성 통화
- 화면 공유
- 대용량 파일 전송 (P2P)
- 실시간 게임 (낮은 지연 필요)

✅ 둘 다 사용:
- 화상 회의 앱
  → WebRTC: 비디오/오디오
  → WebSocket: 채팅, 참여자 관리

```

---

## **3. WebRTC의 핵심 개념**

### **3.1 주요 구성 요소**

### **3.1.1 RTCPeerConnection (핵심!)**

```jsx
// 브라우저 내장 API (import 불필요)
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

// 역할: P2P 연결 관리

```

**주요 메서드:**

```jsx
// Offer/Answer 생성
await pc.createOffer()
await pc.createAnswer()

// Local/Remote Description 설정
await pc.setLocalDescription(description)
await pc.setRemoteDescription(description)

// ICE Candidate 추가
await pc.addIceCandidate(candidate)

// 미디어 트랙 추가
pc.addTrack(track, stream)

// 연결 종료
pc.close()

```

**주요 이벤트:**

```jsx
pc.onicecandidate = (event) => {
  // ICE Candidate 발견 시
}

pc.ontrack = (event) => {
  // 상대방 스트림 받을 시
}

pc.onconnectionstatechange = () => {
  // 연결 상태 변경 시
}

pc.oniceconnectionstatechange = () => {
  // ICE 연결 상태 변경 시
}

```

### **3.1.2 MediaStream**

```jsx
// 웹캠/마이크 접근
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

// 화면 공유
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: true
});

// 트랙 관리
stream.getTracks()           // 모든 트랙
stream.getVideoTracks()      // 비디오 트랙만
stream.getAudioTracks()      // 오디오 트랙만
stream.addTrack(track)       // 트랙 추가
stream.removeTrack(track)    // 트랙 제거

```

### **3.1.3 DataChannel**

```jsx
// P2P 데이터 전송 채널
const dataChannel = pc.createDataChannel('chat');

// 데이터 전송
dataChannel.send('Hello!');

// 데이터 수신
dataChannel.onmessage = (event) => {
  console.log('받은 메시지:', event.data);
};

// 용도: 채팅, 게임 명령어, 파일 전송 등

```

### **3.2 연결 과정 (Signaling)**

### **3.2.1 SDP (Session Description Protocol)**

```
SDP란?
- 연결 정보를 담은 텍스트 형식
- 코덱, 해상도, 대역폭 등의 정보 포함

```

**Offer (제안):**

```jsx
// Alice가 생성
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

console.log(offer);
// {
//   type: "offer",
//   sdp: "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
// }

// Bob에게 전송 (시그널링 서버 통해)
socket.emit('offer', offer);

```

**Answer (응답):**

```jsx
// Bob이 생성
await pc.setRemoteDescription(offer);  // Alice의 offer 설정
const answer = await pc.createAnswer();
await pc.setLocalDescription(answer);

console.log(answer);
// {
//   type: "answer",
//   sdp: "v=0\r\no=- 987654321 2 IN IP4 127.0.0.1\r\n..."
// }

// Alice에게 전송
socket.emit('answer', answer);

```

### **3.2.2 ICE (Interactive Connectivity Establishment)**

**ICE가 하는 일:**

```
1. 연결 가능한 모든 경로(Candidate) 찾기
2. 각 경로로 연결 시도
3. 성공한 경로 중 최적의 것 선택

```

**3가지 Candidate 타입:**

### **1) Host Candidate (로컬)**

```jsx
// 같은 네트워크 (같은 WiFi)
{
  type: 'host',
  address: '192.168.0.100',  // 사설 IP
  port: 54321,
  priority: 2130706431  // 가장 높음 (가장 빠름)
}

// 사용 예: 집/회사 내부에서 테스트

```

### **2) Server Reflexive Candidate (STUN)**

```jsx
// STUN 서버가 알려준 공인 IP
{
  type: 'srflx',
  address: '123.45.67.89',  // 공인 IP
  port: 5000,
  relatedAddress: '192.168.0.100',  // 원래 사설 IP
  priority: 1694498815  // 중간
}

// 가장 일반적 (80~90% 여기서 연결)

```

### **3) Relay Candidate (TURN)**

```jsx
// TURN 서버를 통한 중계
{
  type: 'relay',
  address: '1.2.3.4',  // TURN 서버 IP
  port: 3478,
  relatedAddress: '123.45.67.89',
  priority: 16777215  // 가장 낮음 (느림)
}

// 방화벽 우회용 (5~10%)

```

**ICE Candidate 교환:**

```jsx
// Alice
pc.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('ICE Candidate 발견:', event.candidate.type);

    // Bob에게 전송
    socket.emit('ice-candidate', event.candidate);
  } else {
    console.log('모든 ICE Candidate 수집 완료');
  }
};

// Bob
socket.on('ice-candidate', async (candidate) => {
  await pc.addIceCandidate(candidate);
  console.log('Candidate 추가, 연결 시도 중...');
});

```

### **3.3 연결 상태 (표준 값)**

### **Connection State**

```jsx
pc.connectionState

// W3C 표준으로 정해진 값 (백엔드가 정하는 게 아님!)
"new"           // 초기 상태
"connecting"    // 연결 시도 중
"connected"     // 연결 성공 ✅
"disconnected"  // 연결 끊김 ⚠️
"failed"        // 연결 실패 ❌
"closed"        // 연결 닫힘

```

### **ICE Connection State**

```jsx
pc.iceConnectionState

// W3C 표준 값
"new"           // 초기
"checking"      // ICE Candidate 확인 중
"connected"     // ICE 연결 성공 (일부 경로)
"completed"     // ICE 연결 완료 (모든 경로)
"failed"        // ICE 실패
"disconnected"  // ICE 끊김
"closed"        // ICE 닫힘

```

### **Signaling State**

```jsx
pc.signalingState

// W3C 표준 값
"stable"                  // 안정 (Offer/Answer 교환 완료)
"have-local-offer"        // 로컬 Offer 생성됨
"have-remote-offer"       // 상대방 Offer 받음
"have-local-pranswer"     // 임시 로컬 Answer
"have-remote-pranswer"    // 임시 원격 Answer
"closed"                  // 닫힘

```

### **3.4 데이터 흐름 이해하기**

### **시그널링 단계 (초기 한 번)**

```jsx
[시그널링 서버 사용]

Alice                    시그널링 서버                Bob
  │                            │                      │
  ├─── Offer ─────────────────>│                      │
  │                            ├─── Offer ───────────>│
  │                            │                      │
  │                            │<─── Answer ──────────┤
  │<─── Answer ────────────────┤                      │
  │                            │                      │
  ├─── ICE Candidate ─────────>│                      │
  │                            ├─── ICE Candidate ───>│
  │                            │                      │

// 이 과정에서만 서버 사용!

```

### **P2P 통신 단계 (계속)**

```jsx
[서버 없이 직접 통신]

Alice ←──────────────────────────────→ Bob
      (비디오, 오디오, 데이터 직접 전송)

// 실시간으로 계속 통신:
- 비디오 프레임: 초당 30회
- 오디오 샘플: 초당 50회
- RTCP (상태 체크): 2~5초마다

// 서버는 연결 유지에 관여 안 함!
// 단, 재연결 필요 시 다시 시그널링 서버 사용

```

### **연결 끊김 및 재연결**

```jsx
[네트워크 끊김]
Alice X─────────────────X Bob

// WebRTC가 자동 감지 (RTCP로)
pc.connectionState = "disconnected"

[재연결 시도]
// 자동 재시도 (ICE Restart)
const offer = await pc.createOffer({ iceRestart: true });
await pc.setLocalDescription(offer);

// 시그널링 서버로 재협상
socket.emit('renegotiate', offer);

// IP 재확인 + 새 ICE Candidate 수집

```

---

## **4. 필요한 서버들**

### **4.1 시그널링 서버 (필수!)**

### **역할**

```
✅ Offer/Answer 중계
✅ ICE Candidate 교환
✅ 방 관리
✅ 사용자 연결/해제 감지

```

### **구축 방법**

**Node.js + Socket.io (추천!)**

```jsx
// server.js
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('새 사용자 연결:', socket.id);

  // 방 생성
  socket.on('create-room', (roomId) => {
    socket.join(roomId);
    rooms.set(roomId, new Set([socket.id]));
    socket.emit('room-created', roomId);
  });

  // 방 입장
  socket.on('join-room', (roomId) => {
    if (!rooms.has(roomId)) {
      socket.emit('error', 'Room not found');
      return;
    }

    socket.join(roomId);
    rooms.get(roomId).add(socket.id);

    // 기존 참여자들에게 알림
    socket.to(roomId).emit('user-joined', socket.id);
  });

  // Offer 중계
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  // Answer 중계
  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  // ICE Candidate 중계
  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // 연결 해제
  socket.on('disconnect', () => {
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        io.to(roomId).emit('user-left', socket.id);

        if (users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

server.listen(3000, () => {
  console.log('시그널링 서버 실행: 3000번 포트');
});

```

**Django (Django Channels 사용)**

```python
# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SignalingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'webrtc_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)

        # 메시지 타입에 따라 처리
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'webrtc_message',
                'message': data
            }
        )

    async def webrtc_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

```

### **메인 서버와의 관계**

```
옵션 1: 분리 (추천)
┌──────────────┐
│ Django/Spring│  ← 비즈니스 로직
│ (메인 서버)   │     회원가입, DB 등
└──────────────┘
       ↓
┌──────────────┐
│ Node.js      │  ← WebRTC 시그널링만
│ (시그널링)    │     실시간 통신 전담
└──────────────┘

장점: 기술 스택 최적화, 독립적 확장

옵션 2: 통합
┌──────────────┐
│ Django       │  ← 모든 것
│ + Channels   │     REST API + WebSocket
└──────────────┘

장점: 관리 편함, 서버 1개

```

### **4.2 STUN 서버 (거의 필수)**

### **역할**

```
✅ 클라이언트의 공인 IP 주소 확인
✅ NAT 타입 확인

```

### **무료 STUN 서버 사용 (추천!)**

```jsx
const configuration = {
  iceServers: [
    // Google 무료 STUN 서버
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },

    // Mozilla 무료 STUN 서버
    { urls: 'stun:stun.services.mozilla.com' }
  ]
};

const pc = new RTCPeerConnection(configuration);

```

### **직접 구축 (비추천)**

```bash
# coturn 설치 (Ubuntu)
sudo apt-get install coturn

# 설정
sudo nano /etc/turnserver.conf

# 이유: 무료로 충분, 관리 부담, 글로벌 분산 필요

```

### **4.3 TURN 서버 (선택적)**

### **역할**

```
✅ 방화벽/엄격한 NAT 우회
✅ 비디오/오디오 중계
✅ 연결 실패 시 대안 경로

```

### **필요한 경우**

```jsx
// 약 5~20%의 경우:
- 회사/학교 방화벽
- 대칭형 NAT
- VPN 사용자
- 4G/5G (통신사별 다름)

// 나머지 80~95%는 STUN으로 충분!

```

### **유료 서비스**

```
Twilio NAT Traversal: 트래픽 기반 과금
Xirsys: $10/월~
Metered.ca: $30/월~

```

### **직접 구축 (coturn)**

```bash
# Ubuntu에 coturn 설치
sudo apt-get install coturn

# 설정 파일 수정
sudo nano /etc/turnserver.conf

# 내용:
listening-port=3478
external-ip=YOUR_SERVER_IP
realm=yourdomain.com
user=username:password
lt-cred-mech

```

```jsx
// 클라이언트 설정
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ]
};

```

### **MVP 추천**

```
초기: TURN 없이 시작
→ STUN만으로 80~95% 연결 성공
→ 비용 절감

성장기: TURN 추가
→ 연결 성공률 99%+
→ coturn 직접 구축 or 유료 서비스

```

---

## **5. 바닐라 JavaScript로 구현하기**

### **5.1 기본 구조**

### **디렉토리 구조**

```
project/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── main.js
└── backend/
    ├── package.json
    └── server.js

```

### **5.2 프론트엔드 (Vanilla JS)**

### **index.html**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>WebRTC 화상 통화</title>
  <style>
    video {
      width: 400px;
      height: 300px;
      background: #000;
      border: 2px solid #333;
    }
    #controls {
      margin: 20px 0;
    }
    button {
      padding: 10px 20px;
      margin: 5px;
      cursor: pointer;
    }
</style>
</head>
<body>
  <h1>WebRTC 화상 통화</h1>

  <div id="controls">
    <input id="roomId" type="text" placeholder="방 ID 입력">
    <button onclick="createRoom()">방 만들기</button>
    <button onclick="joinRoom()">방 입장</button>
    <button onclick="startCall()">통화 시작</button>
    <button onclick="hangUp()">통화 종료</button>
  </div>

  <div id="videos">
    <div>
      <h3>내 화면</h3>
      <video id="localVideo" autoplay muted></video>
    </div>
    <div>
      <h3>상대방 화면</h3>
      <video id="remoteVideo" autoplay></video>
    </div>
  </div>

  <div id="status"></div>

  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
  <script src="main.js"></script>
</body>
</html>

```

### **main.js (완전한 구현)**

```jsx
// 시그널링 서버 연결
const socket = io('http://localhost:3000');

// WebRTC 설정
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// 전역 변수
let pc = null;
let localStream = null;
let roomId = null;
let remoteUserId = null;

// DOM 요소
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const statusDiv = document.getElementById('status');

// 상태 표시
function updateStatus(message) {
  statusDiv.textContent = message;
  console.log(message);
}

// 방 생성
async function createRoom() {
  roomId = document.getElementById('roomId').value;
  if (!roomId) {
    alert('방 ID를 입력하세요');
    return;
  }

  socket.emit('create-room', roomId);
  updateStatus(`방 생성됨: ${roomId}`);
}

// 방 입장
async function joinRoom() {
  roomId = document.getElementById('roomId').value;
  if (!roomId) {
    alert('방 ID를 입력하세요');
    return;
  }

  socket.emit('join-room', roomId);
  updateStatus(`방 입장: ${roomId}`);
}

// 웹캠 시작
async function startLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideo.srcObject = localStream;
    updateStatus('웹캠 시작됨');

  } catch (error) {
    console.error('웹캠 접근 실패:', error);
    updateStatus('웹캠 접근 실패: ' + error.message);
  }
}

// PeerConnection 생성
function createPeerConnection(userId) {
  pc = new RTCPeerConnection(configuration);

  // 로컬 스트림 추가
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  // ICE Candidate 수집
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('ICE Candidate 발견:', event.candidate.type);

      socket.emit('ice-candidate', {
        target: userId,
        candidate: event.candidate
      });
    }
  };

  // 상대방 스트림 받기
  pc.ontrack = (event) => {
    console.log('상대방 스트림 받음');
    remoteVideo.srcObject = event.streams[0];
    updateStatus('연결됨');
  };

  // 연결 상태 모니터링
  pc.onconnectionstatechange = () => {
    console.log('연결 상태:', pc.connectionState);
    updateStatus('연결 상태: ' + pc.connectionState);

    if (pc.connectionState === 'disconnected') {
      updateStatus('연결 끊김 - 재연결 시도 중...');
      attemptReconnect();
    } else if (pc.connectionState === 'failed') {
      updateStatus('연결 실패');
    }
  };

  // ICE 연결 상태
  pc.oniceconnectionstatechange = () => {
    console.log('ICE 상태:', pc.iceConnectionState);
  };

  return pc;
}

// 통화 시작 (Offer 보내는 쪽)
async function startCall() {
  if (!localStream) {
    await startLocalStream();
  }

  if (!remoteUserId) {
    updateStatus('상대방을 기다리는 중...');
    return;
  }

  createPeerConnection(remoteUserId);

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    console.log('Offer 생성됨');
    socket.emit('offer', {
      target: remoteUserId,
      offer: offer
    });

    updateStatus('통화 연결 중...');

  } catch (error) {
    console.error('Offer 생성 실패:', error);
    updateStatus('통화 시작 실패');
  }
}

// 재연결 시도
async function attemptReconnect() {
  setTimeout(async () => {
    if (pc.connectionState === 'disconnected') {
      console.log('ICE Restart 시도');

      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);

      socket.emit('offer', {
        target: remoteUserId,
        offer: offer
      });
    }
  }, 5000);
}

// 통화 종료
function hangUp() {
  if (pc) {
    pc.close();
    pc = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;

  updateStatus('통화 종료');
}

// 시그널링 이벤트 처리
socket.on('room-created', (room) => {
  console.log('방 생성됨:', room);
  startLocalStream();
});

socket.on('user-joined', async (userId) => {
  console.log('사용자 입장:', userId);
  remoteUserId = userId;
  updateStatus('상대방이 입장했습니다');

  if (!localStream) {
    await startLocalStream();
  }

  // 자동으로 통화 시작
  setTimeout(() => startCall(), 1000);
});

socket.on('offer', async (data) => {
  console.log('Offer 받음:', data.from);
  remoteUserId = data.from;

  if (!localStream) {
    await startLocalStream();
  }

  if (!pc) {
    createPeerConnection(remoteUserId);
  }

  try {
    await pc.setRemoteDescription(data.offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    console.log('Answer 생성됨');
    socket.emit('answer', {
      target: remoteUserId,
      answer: answer
    });

    updateStatus('통화 연결 중...');

  } catch (error) {
    console.error('Answer 생성 실패:', error);
  }
});

socket.on('answer', async (data) => {
  console.log('Answer 받음:', data.from);

  try {
    await pc.setRemoteDescription(data.answer);
    console.log('Answer 설정 완료');

  } catch (error) {
    console.error('Answer 설정 실패:', error);
  }
});

socket.on('ice-candidate', async (data) => {
  console.log('ICE Candidate 받음');

  try {
    if (pc) {
      await pc.addIceCandidate(data.candidate);
      console.log('ICE Candidate 추가됨');
    }
  } catch (error) {
    console.error('ICE Candidate 추가 실패:', error);
  }
});

socket.on('user-left', (userId) => {
  console.log('사용자 퇴장:', userId);
  updateStatus('상대방이 나갔습니다');
  hangUp();
});

socket.on('error', (message) => {
  alert(message);
  updateStatus('에러: ' + message);
});

// 페이지 종료 시 정리
window.addEventListener('beforeunload', () => {
  hangUp();
  socket.disconnect();
});

```

### **5.3 백엔드 (시그널링 서버)**

### **package.json**

```json
{
  "name": "webrtc-signaling-server",
  "version": "1.0.0",
  "description": "WebRTC Signaling Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.5.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}

```

### **server.js (위 4.1 참조)**

### **5.4 실행 방법**

```bash
# 백엔드 실행
cd backend
npm install
npm start

# 프론트엔드 실행 (2개 브라우저)
# 1번 브라우저: 방 생성
# 2번 브라우저: 방 입장

```

### **5.5 바닐라 JS의 장단점**

### **장점**

```
✅ 의존성 없음 (순수 웹 표준)
✅ 학습 목적에 최적
✅ 완전한 제어 가능
✅ 번들 크기 최소
✅ WebRTC 동작 원리 완벽 이해

```

### **단점**

```
❌ 코드량 많음 (보일러플레이트)
❌ 에러 처리 직접 구현
❌ 크로스 브라우저 대응 필요
❌ 다중 연결 관리 복잡
❌ 개발 시간 오래 걸림

```

---

## **6. 라이브러리 사용하기**

### **6.1 Simple-peer (추천!)**

### **특징**

```
✅ WebRTC 래퍼 라이브러리
✅ 코드량 90% 감소
✅ 자동 에러 처리
✅ 크로스 브라우저 지원
✅ 번들 크기: ~50KB

```

### **설치**

```bash
npm install simple-peer

```

### **사용 예시**

```jsx
import SimplePeer from 'simple-peer';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');
let peer = null;

// 웹캠 시작
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  document.getElementById('localVideo').srcObject = stream;

  // SimplePeer 생성 (Offer 보내는 쪽)
  peer = new SimplePeer({
    initiator: true,  // 먼저 시작하는 쪽
    stream: stream,   // 로컬 스트림
    trickle: false    // ICE Candidate 한 번에 전송
  });

  // Signal 데이터 생성 시
  peer.on('signal', (data) => {
    console.log('Signal 생성됨 (Offer/ICE 포함)');

    // 상대방에게 전송
    socket.emit('signal', data);
  });

  // 상대방 스트림 받을 시
  peer.on('stream', (remoteStream) => {
    console.log('상대방 스트림 받음');
    document.getElementById('remoteVideo').srcObject = remoteStream;
  });

  // 연결 완료
  peer.on('connect', () => {
    console.log('연결 성공!');
  });

  // 에러 처리
  peer.on('error', (err) => {
    console.error('에러:', err);
  });
});

// 상대방 Signal 받기
socket.on('signal', (data) => {
  if (peer) {
    peer.signal(data);  // Answer/ICE 설정
  } else {
    // Answer를 보내는 쪽
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      document.getElementById('localVideo').srcObject = stream;

      peer = new SimplePeer({
        initiator: false,  // 응답하는 쪽
        stream: stream
      });

      peer.on('signal', (answerData) => {
        socket.emit('signal', answerData);
      });

      peer.on('stream', (remoteStream) => {
        document.getElementById('remoteVideo').srcObject = remoteStream;
      });

      peer.signal(data);  // Offer 설정
    });
  }
});

```

### **바닐라 vs Simple-peer 비교**

```jsx
// 바닐라 JS (100줄)
const pc = new RTCPeerConnection(config);
pc.onicecandidate = ...
pc.ontrack = ...
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
socket.emit('offer', offer);
// ... 많은 코드

// Simple-peer (10줄)
const peer = new SimplePeer({ initiator: true, stream });
peer.on('signal', data => socket.emit('signal', data));
peer.on('stream', stream => video.srcObject = stream);
socket.on('signal', data => peer.signal(data));

```

### **6.2 PeerJS**

### **특징**

```
✅ 더 높은 수준의 추상화
✅ 자체 시그널링 서버 제공 (무료/유료)
✅ ID 기반 연결 (간편)

```

### **설치**

```bash
npm install peerjs

```

### **사용 예시**

```jsx
import Peer from 'peerjs';

// Peer 생성 (자동으로 ID 부여)
const peer = new Peer({
  host: 'peerjs.com',  // 무료 시그널링 서버
  port: 443,
  secure: true
});

peer.on('open', (id) => {
  console.log('내 ID:', id);
  // 이 ID를 상대방에게 알려주면 됨
});

// 웹캠 시작 후 상대방에게 전화 걸기
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    document.getElementById('localVideo').srcObject = stream;

    // 상대방 ID로 통화 시작
    const call = peer.call('상대방-ID', stream);

    call.on('stream', (remoteStream) => {
      document.getElementById('remoteVideo').srcObject = remoteStream;
    });
  });

// 전화 받기
peer.on('call', (call) => {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      call.answer(stream);  // 응답

      call.on('stream', (remoteStream) => {
        document.getElementById('remoteVideo').srcObject = remoteStream;
      });
    });
});

```

### **6.3 라이브러리 선택 가이드**

```jsx
Simple-peer:
✅ 가볍고 빠름
✅ 커스터마이징 쉬움
✅ 시그널링 서버 직접 구축
→ 추천: 학습 + 실전

PeerJS:
✅ 매우 간편
✅ 시그널링 서버 제공
✅ ID 기반 연결
→ 추천: 프로토타입, 간단한 앱

바닐라 JS:
✅ 완전한 제어
✅ 학습에 최적
✅ 의존성 없음
→ 추천: 학습, 특수한 요구사항

```

---

## **7. 실전 예제: 표정 챌린지 게임**

### **7.1 프로젝트 개요**

**컨셉:** 화상 채팅 + 표정 인식 AI를 활용한 웃참 게임

**기술 스택:**

```
프론트엔드: React + face-api.js + Socket.io-client
시그널링: Node.js + Socket.io
WebRTC: 바닐라 or Simple-peer
표정 인식: face-api.js (브라우저 내장 AI)

```

### **7.2 핵심 기능 구현**

### **7.2.1 표정 인식 통합**

```jsx
// face-api.js 로드
import * as faceapi from 'face-api.js';

// 모델 로드 (한 번만)
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');
  console.log('모델 로드 완료');
}

// 실시간 표정 인식
async function detectExpression(videoElement) {
  const detections = await faceapi
    .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (detections) {
    const expressions = detections.expressions;

    return {
      happy: expressions.happy,        // 행복 (0~1)
      sad: expressions.sad,            // 슬픔
      angry: expressions.angry,        // 분노
      surprised: expressions.surprised, // 놀람
      neutral: expressions.neutral     // 무표정
    };
  }

  return null;
}

// 게임 루프
function startGame() {
  const remoteVideo = document.getElementById('remoteVideo');

  setInterval(async () => {
    const emotions = await detectExpression(remoteVideo);

    if (emotions) {
      console.log('상대방 표정:', emotions);

      // 웃음 70% 이상이면
      if (emotions.happy > 0.7) {
        console.log('상대방이 웃었다! 점수 획득!');
        addScore(10);
      }
    }
  }, 1000);  // 1초마다 체크
}

```

### **7.2.2 WebRTC + 표정 인식 통합**

```jsx
// React 컴포넌트 예시
import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import io from 'socket.io-client';
import * as faceapi from 'face-api.js';

function EmotionChallengeGame() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState(null);

  const socketRef = useRef();
  const peerRef = useRef();

  useEffect(() => {
    // 1. 모델 로드
    loadFaceApiModels();

    // 2. 시그널링 서버 연결
    socketRef.current = io('http://localhost:3000');

    // 3. 웹캠 시작
    startWebcam();

    // 4. 시그널링 이벤트 설정
    setupSignaling();

    return () => {
      cleanup();
    };
  }, []);

  async function loadFaceApiModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
  }

  async function startWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideoRef.current.srcObject = stream;

    // SimplePeer 생성
    peerRef.current = new SimplePeer({
      initiator: true,
      stream: stream,
      trickle: false
    });

    peerRef.current.on('signal', (data) => {
      socketRef.current.emit('signal', data);
    });

    peerRef.current.on('stream', (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;

      // 상대방 스트림 받으면 표정 인식 시작
      startEmotionDetection();
    });
  }

  function setupSignaling() {
    socketRef.current.on('signal', (data) => {
      peerRef.current.signal(data);
    });

    socketRef.current.on('score-update', (data) => {
      setOpponentScore(data.score);
    });
  }

  function startEmotionDetection() {
    setInterval(async () => {
      const video = remoteVideoRef.current;

      if (video && video.readyState === 4) {
        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections) {
          const expressions = detections.expressions;
          setCurrentEmotion(expressions);

          // 게임 모드에 따라 점수 계산
          if (gameMode === 'laugh' && expressions.happy > 0.7) {
            const newScore = myScore + 10;
            setMyScore(newScore);

            // 상대방에게 점수 전송
            socketRef.current.emit('score-update', { score: newScore });

            // POTG 캡처
            captureHighlight(expressions.happy);
          }
        }
      }
    }, 500);  // 0.5초마다
  }

  function captureHighlight(emotionLevel) {
    // 캔버스로 현재 프레임 캡처
    const canvas = document.createElement('canvas');
    const video = remoteVideoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // 이미지로 저장
    const imageData = canvas.toDataURL('image/png');

    // POTG 저장
    savePOTG({
      timestamp: Date.now(),
      emotionLevel: emotionLevel,
      image: imageData
    });
  }

  return (
    <div className="game-container">
      <div className="scores">
        <div>내 점수: {myScore}</div>
        <div>상대방 점수: {opponentScore}</div>
      </div>

      <div className="videos">
        <div>
          <h3>내 화면</h3>
          <video ref={localVideoRef} autoPlay muted />
        </div>
        <div>
          <h3>상대방 화면</h3>
          <video ref={remoteVideoRef} autoPlay />

          {currentEmotion && (
            <div className="emotion-overlay">
              <div>😊 {(currentEmotion.happy * 100).toFixed(0)}%</div>
              <div>😢 {(currentEmotion.sad * 100).toFixed(0)}%</div>
              <div>😮 {(currentEmotion.surprised * 100).toFixed(0)}%</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

```

### **7.3 게임 로직 서버 (Node.js)**

```jsx
// server.js
const io = require('socket.io')(3000);

const games = new Map();  // roomId -> game state

io.on('connection', (socket) => {

  socket.on('join-game', (roomId) => {
    socket.join(roomId);

    if (!games.has(roomId)) {
      games.set(roomId, {
        players: [],
        scores: {},
        currentTurn: 0,
        mode: 'laugh',
        startTime: null
      });
    }

    const game = games.get(roomId);
    game.players.push(socket.id);
    game.scores[socket.id] = 0;

    // 2명 모이면 게임 시작
    if (game.players.length === 2) {
      game.startTime = Date.now();

      io.to(roomId).emit('game-start', {
        mode: game.mode,
        players: game.players
      });
    }
  });

  socket.on('score-update', (data) => {
    const roomId = getRoomId(socket);
    const game = games.get(roomId);

    if (game) {
      game.scores[socket.id] = data.score;

      // 모든 플레이어에게 점수 브로드캐스트
      io.to(roomId).emit('scores-updated', game.scores);
    }
  });

  socket.on('potg-capture', (data) => {
    const roomId = getRoomId(socket);

    // POTG 저장 (DB or 메모리)
    savePOTGToGame(roomId, {
      playerId: socket.id,
      ...data
    });
  });

  socket.on('disconnect', () => {
    // 게임 정리
    const roomId = getRoomId(socket);
    if (roomId) {
      io.to(roomId).emit('player-left', socket.id);
      games.delete(roomId);
    }
  });
});

function getRoomId(socket) {
  return Array.from(socket.rooms).find(room => room !== socket.id);
}

```

### **7.4 프로젝트 구조**

```
emotion-challenge/
├── frontend/
│   ├── public/
│   │   └── models/              # face-api.js 모델
│   ├── src/
│   │   ├── components/
│   │   │   ├── Game.jsx
│   │   │   ├── VideoCall.jsx
│   │   │   └── EmotionOverlay.jsx
│   │   ├── hooks/
│   │   │   ├── useWebRTC.js
│   │   │   └── useFaceDetection.js
│   │   ├── utils/
│   │   │   └── emotionDetector.js
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── server.js
│   ├── gameManager.js
│   └── package.json
└── README.md

```

---

## **8. 트러블슈팅**

### **8.1 자주 발생하는 문제**

### **문제 1: 카메라/마이크 권한 거부**

```jsx
// 에러 처리
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .catch(error => {
    if (error.name === 'NotAllowedError') {
      alert('카메라/마이크 권한을 허용해주세요');
    } else if (error.name === 'NotFoundError') {
      alert('카메라/마이크가 연결되어 있지 않습니다');
    } else if (error.name === 'NotReadableError') {
      alert('카메라/마이크가 다른 프로그램에서 사용 중입니다');
    } else {
      alert('미디어 접근 실패: ' + error.message);
    }
  });

```

### **문제 2: ICE 연결 실패**

```jsx
// 디버깅
pc.onicecandidateerror = (event) => {
  console.error('ICE 에러:', event.errorCode, event.errorText);
};

pc.oniceconnectionstatechange = () => {
  if (pc.iceConnectionState === 'failed') {
    console.log('ICE 실패 - TURN 서버 추가 필요');

    // TURN 서버로 재시도
    recreatePeerConnectionWithTURN();
  }
};

```

### **문제 3: Offer/Answer 타이밍 문제**

```jsx
// 잘못된 코드 (Race Condition)
socket.on('offer', async (offer) => {
  await pc.setRemoteDescription(offer);  // 에러 가능!
});

// 올바른 코드
socket.on('offer', async (offer) => {
  // 상태 체크
  if (pc.signalingState !== 'stable') {
    console.warn('아직 준비 안됨, 대기 중...');
    return;
  }

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('answer', answer);
});

```

### **문제 4: 여러 명 연결 관리**

```jsx
// 각 참여자별 PeerConnection 관리
const peerConnections = new Map();

function createPeerConnectionForUser(userId) {
  const pc = new RTCPeerConnection(config);

  // 설정...

  peerConnections.set(userId, pc);
  return pc;
}

function removePeerConnection(userId) {
  const pc = peerConnections.get(userId);
  if (pc) {
    pc.close();
    peerConnections.delete(userId);
  }
}

// 메모리 누수 방지
window.addEventListener('beforeunload', () => {
  peerConnections.forEach(pc => pc.close());
  peerConnections.clear();
});

```

### **8.2 디버깅 도구**

### **Chrome WebRTC Internals**

```
chrome://webrtc-internals/

확인 가능 정보:
- ICE candidates
- 연결 상태
- 통계 그래프
- 패킷 손실률
- 비트레이트

```

### **코드로 통계 확인**

```jsx
setInterval(async () => {
  const stats = await pc.getStats();

  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'video') {
      console.log('받은 패킷:', report.packetsReceived);
      console.log('패킷 손실:', report.packetsLost);
      console.log('지터:', report.jitter);
    }

    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      console.log('RTT (왕복시간):', report.currentRoundTripTime);
    }
  });
}, 5000);

```

### **8.3 성능 최적화**

### **비디오 품질 조절**

```jsx
// 낮은 해상도로 시작 (대역폭 절약)
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 15, max: 30 }
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true
  }
});

// 런타임에 비트레이트 조정
const sender = pc.getSenders().find(s => s.track.kind === 'video');
const parameters = sender.getParameters();

if (!parameters.encodings) {
  parameters.encodings = [{}];
}

parameters.encodings[0].maxBitrate = 500000;  // 500kbps
await sender.setParameters(parameters);

```

---

## **9. 체크리스트**

### **9.1 개발 전 체크리스트**

```
□ WebRTC 기본 개념 이해
  □ P2P 연결 방식
  □ 시그널링 프로세스
  □ ICE 작동 원리

□ 필요한 서버 준비
  □ 시그널링 서버 (필수)
  □ STUN 서버 (무료 사용)
  □ TURN 서버 (선택, 나중에 추가)

□ 기술 스택 선택
  □ 바닐라 JS or 라이브러리
  □ 프론트엔드 프레임워크
  □ 백엔드 언어/프레임워크

□ 개발 환경 설정
  □ HTTPS (localhost는 HTTP 가능)
  □ 브라우저 권한 (카메라/마이크)

```

### **9.2 구현 체크리스트**

```
□ 시그널링 서버 구현
  □ WebSocket/Socket.io 서버
  □ 방 관리 로직
  □ Offer/Answer 중계
  □ ICE Candidate 중계

□ WebRTC 클라이언트 구현
  □ RTCPeerConnection 생성
  □ getUserMedia로 미디어 스트림
  □ ICE Candidate 수집
  □ Offer/Answer 생성
  □ 원격 스트림 표시

□ 에러 처리
  □ 권한 거부 처리
  □ 연결 실패 처리
  □ 재연결 로직
  □ 타임아웃 처리

□ 리소스 관리
  □ PeerConnection.close()
  □ MediaStreamTrack.stop()
  □ 이벤트 리스너 제거
  □ 메모리 누수 방지

```

### **9.3 배포 체크리스트**

```
□ HTTPS 필수
  □ Let's Encrypt 인증서
  □ 또는 클라우드 제공 SSL

□ STUN/TURN 서버 설정
  □ 공개 STUN 서버 (무료)
  □ TURN 서버 (필요시)

□ 방화벽 설정
  □ WebSocket 포트 오픈
  □ UDP 포트 오픈 (WebRTC)

□ 성능 모니터링
  □ 연결 성공률
  □ 패킷 손실률
  □ 지연 시간

□ 브라우저 호환성
  □ Chrome/Edge 테스트
  □ Firefox 테스트
  □ Safari 테스트
  □ 모바일 브라우저 테스트

```

---

## **10. 학습 로드맵**

### **10.1 초급 (1주)**

```
Day 1-2: 개념 이해
- WebRTC가 뭔지
- P2P vs 서버 중계
- 필요한 서버들

Day 3-4: 간단한 예제
- 바닐라 JS로 1:1 화상 통화
- 시그널링 서버 구축

Day 5-7: 라이브러리 사용
- Simple-peer 사용
- 코드 리팩토링

```

### **10.2 중급 (2주)**

```
Week 1: 고급 기능
- DataChannel 사용
- 화면 공유
- 다중 연결 (3명 이상)

Week 2: 에러 처리
- 재연결 로직
- TURN 서버 추가
- 성능 최적화

```

### **10.3 고급 (1개월)**

```
Week 1-2: 실전 프로젝트
- 화상 회의 앱
- 게임 통합 (표정 챌린지 등)

Week 3-4: 배포 및 운영
- 프로덕션 배포
- 모니터링
- 스케일링

```

---

## **11. 참고 자료**

### **11.1 공식 문서**

```
WebRTC 공식:
https://webrtc.org/

MDN WebRTC API:
https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

W3C 표준:
https://www.w3.org/TR/webrtc/

```

### **11.2 라이브러리**

```
Simple-peer:
https://github.com/feross/simple-peer

PeerJS:
https://peerjs.com/

Socket.io:
https://socket.io/

```

### **11.3 무료 STUN/TURN**

```
Google STUN:
stun:stun.l.google.com:19302

Mozilla STUN:
stun:stun.services.mozilla.com

무료 TURN (제한적):
https://www.metered.ca/tools/openrelay/

```

---

## **마치며**

WebRTC는 처음엔 복잡해 보이지만, 핵심 개념을 이해하면 강력한 실시간 통신 앱을 만들 수 있습니다.

**핵심 포인트:**

1. P2P 직접 연결 (서버 부하 낮음)
2. 시그널링은 초기에만 필요
3. ICE가 자동으로 최적 경로 찾음
4. 표준 API (브라우저 내장)
5. 라이브러리로 간편하게 시작 가능

**학습 순서:**

1. 바닐라 JS로 개념 이해
2. Simple-peer로 빠른 개발
3. 실전 프로젝트로 경험 축적

화이팅! 🚀