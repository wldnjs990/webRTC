# WebRTC 시그널링 서버

WebRTC P2P 연결을 위한 시그널링 서버입니다.

## 주요 기능

- ✅ **방 생성/입장**: 여러 사용자가 방을 통해 연결
- ✅ **Offer/Answer 중계**: SDP 교환 지원
- ✅ **ICE Candidate 교환**: 최적 경로 찾기
- ✅ **연결 상태 관리**: 입장/퇴장 이벤트 처리
- ✅ **에러 처리**: 입력 검증 및 예외 처리
- ✅ **헬스 체크**: 서버 상태 모니터링

## 설치 및 실행

### 1. 의존성 설치

```bash
cd backend
npm install
```

### 2. 환경 변수 설정 (선택사항)

```bash
# .env.example을 복사해서 .env 파일 생성
cp .env.example .env

# .env 파일 수정 (필요시)
# PORT=3000
# CLIENT_URL=http://localhost:5173
```

### 3. 서버 실행

**개발 모드 (자동 재시작)**
```bash
npm run dev
```

**프로덕션 모드**
```bash
npm start
```

서버가 정상적으로 실행되면 다음과 같은 메시지가 출력됩니다:

```
========================================
  WebRTC 시그널링 서버 실행 중
========================================
  포트: 3000
  클라이언트 URL: http://localhost:5173
  시작 시간: 2025-12-31T...
========================================
```

## API 엔드포인트

### HTTP 엔드포인트

#### 헬스 체크
```
GET /health
```

**응답 예시:**
```json
{
  "status": "ok",
  "activeConnections": 5,
  "activeRooms": 2,
  "uptime": 123.456,
  "timestamp": "2025-12-31T12:00:00.000Z"
}
```

#### 활성 방 목록 조회
```
GET /rooms
```

**응답 예시:**
```json
{
  "rooms": [
    {
      "id": "room-123",
      "userCount": 2,
      "createdAt": "2025-12-31T12:00:00.000Z"
    }
  ]
}
```

### Socket.io 이벤트

#### 클라이언트 → 서버

**1. 방 생성**
```javascript
socket.emit('create-room', roomId, (response) => {
  if (response.success) {
    console.log('방 생성 성공:', response.roomId);
  }
});
```

**2. 방 입장**
```javascript
socket.emit('join-room', roomId, (response) => {
  if (response.success) {
    console.log('기존 참여자:', response.existingUsers);
  }
});
```

**3. Offer 전송**
```javascript
socket.emit('offer', {
  target: targetSocketId,
  offer: sdpOffer
});
```

**4. Answer 전송**
```javascript
socket.emit('answer', {
  target: targetSocketId,
  answer: sdpAnswer
});
```

**5. ICE Candidate 전송**
```javascript
socket.emit('ice-candidate', {
  target: targetSocketId,
  candidate: iceCandidate
});
```

**6. 방 나가기**
```javascript
socket.emit('leave-room');
```

#### 서버 → 클라이언트

**1. 방 생성 성공**
```javascript
socket.on('room-created', (data) => {
  console.log('방이 생성됨:', data.roomId);
});
```

**2. 방 입장 성공**
```javascript
socket.on('room-joined', (data) => {
  console.log('방에 입장함:', data.roomId);
  console.log('기존 참여자:', data.existingUsers);
});
```

**3. 새 사용자 입장**
```javascript
socket.on('user-joined', (data) => {
  console.log('새 사용자 입장:', data.userId);
  // 새 사용자에게 Offer 보내기
});
```

**4. 사용자 퇴장**
```javascript
socket.on('user-left', (data) => {
  console.log('사용자 퇴장:', data.userId);
  // PeerConnection 정리
});
```

**5. Offer 수신**
```javascript
socket.on('offer', async (data) => {
  console.log('Offer 받음:', data.from);
  // Answer 생성 및 전송
});
```

**6. Answer 수신**
```javascript
socket.on('answer', async (data) => {
  console.log('Answer 받음:', data.from);
  // RemoteDescription 설정
});
```

**7. ICE Candidate 수신**
```javascript
socket.on('ice-candidate', async (data) => {
  console.log('ICE Candidate 받음:', data.from);
  // Candidate 추가
});
```

**8. 에러 발생**
```javascript
socket.on('error', (data) => {
  console.error('에러:', data.message);
});
```

**9. 서버 종료 알림**
```javascript
socket.on('server-shutdown', (data) => {
  console.log('서버 종료:', data.message);
});
```

## 프론트엔드 연결 예시

### 설치
```bash
npm install socket.io-client
```

### 기본 사용법
```javascript
import io from 'socket.io-client';

// 서버 연결
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('서버에 연결됨:', socket.id);

  // 방 생성
  socket.emit('create-room', 'my-room', (response) => {
    if (response.success) {
      console.log('방 생성 성공!');
    }
  });
});

// 새 사용자 입장 시
socket.on('user-joined', async (data) => {
  console.log('새 사용자:', data.userId);

  // WebRTC Offer 생성 및 전송
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('offer', {
    target: data.userId,
    offer: offer
  });
});

// Offer 수신 시
socket.on('offer', async (data) => {
  await peerConnection.setRemoteDescription(data.offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('answer', {
    target: data.from,
    answer: answer
  });
});
```

## 보안 고려사항

현재 구현은 **학습/프로토타입용**입니다. 실전 배포 시 다음을 추가하세요:

### 필수 보안 조치

1. **인증 추가**
   - JWT 토큰 검증
   - Socket.io 인증 미들웨어

2. **Rate Limiting**
   - 연결 횟수 제한
   - 메시지 전송 속도 제한

3. **입력 검증 강화**
   - XSS 방지
   - SQL Injection 방지

4. **HTTPS 사용**
   - SSL/TLS 인증서 적용
   - WSS(Secure WebSocket) 사용

5. **환경 변수 관리**
   - `.env` 파일 사용
   - 민감 정보 암호화

## 배포

### Docker 사용 (권장)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# 빌드
docker build -t webrtc-signaling .

# 실행
docker run -p 3000:3000 -e CLIENT_URL=https://yourdomain.com webrtc-signaling
```

### PM2 사용

```bash
# PM2 설치
npm install -g pm2

# 서버 실행
pm2 start server.js --name webrtc-signaling

# 로그 확인
pm2 logs webrtc-signaling

# 재시작
pm2 restart webrtc-signaling
```

## 트러블슈팅

### 문제 1: CORS 에러
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**해결:**
- `.env` 파일에서 `CLIENT_URL` 확인
- 프론트엔드 URL이 정확한지 확인

### 문제 2: 연결 안 됨
```
socket.io-client 연결 실패
```

**해결:**
- 서버가 실행 중인지 확인 (`npm start`)
- 포트 충돌 확인 (3000번 포트)
- 방화벽 설정 확인

### 문제 3: WebRTC 연결 실패
```
ICE connection failed
```

**해결:**
- STUN 서버 설정 확인 (프론트엔드)
- 방화벽/NAT 설정 확인
- 필요시 TURN 서버 추가

## 라이센스

MIT License

## 참고 자료

- [Socket.io 공식 문서](https://socket.io/docs/)
- [WebRTC MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC 학습 자료](./.claude/learn-webRTC/webRTC_학습.md)
