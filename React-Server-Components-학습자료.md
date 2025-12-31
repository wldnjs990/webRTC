# React Server Components & Next.js 완벽 가이드

## 목차
1. [React 19와 18의 차이점](#react-19와-18의-차이점)
2. [Server Components 동작 원리](#server-components-동작-원리)
3. [보안 이슈와 안전한 사용법](#보안-이슈와-안전한-사용법)
4. [Server Components vs 전통적 API](#server-components-vs-전통적-api)
5. [ORM과 데이터베이스 접근](#orm과-데이터베이스-접근)
6. [빌드타임 vs 런타임](#빌드타임-vs-런타임)
7. [프레임워크의 역할](#프레임워크의-역할)
8. [WebRTC 구현 방법](#webrtc-구현-방법)
9. [팀 협업 전략](#팀-협업-전략)

---

## React 19와 18의 차이점

### React 19의 주요 변경사항

#### 1. React Compiler (자동 최적화)
- `useMemo`, `useCallback`, `memo` 등을 자동으로 처리
- 수동 메모이제이션이 대부분 불필요해짐

#### 2. Actions
- 비동기 상태 전환을 위한 새로운 패턴
- `useTransition`의 확장으로 `useActionState`, `useFormStatus` 등 추가
- 폼 제출과 낙관적 업데이트가 더 간편해짐

#### 3. Server Components 개선
- Server Actions가 안정화됨
- `use()` Hook으로 Promise와 Context를 더 유연하게 처리

#### 4. ref를 prop으로 사용
- `forwardRef` 없이도 `ref`를 일반 prop처럼 전달 가능

#### 5. Hydration 에러 개선
- 에러 메시지가 더 명확해지고 디버깅이 쉬워짐

#### 6. Document Metadata 지원
- `<title>`, `<meta>` 등을 컴포넌트 내에서 직접 사용 가능

---

## Server Components 동작 원리

### 핵심 개념: Server Components는 "서버"에서 실행됩니다

```javascript
// 이 코드는 서버에서만 실행됩니다 (브라우저 X)
async function UserList() {
  // 이 DB 쿼리는 서버에서 실행됨
  const users = await db.users.findMany();

  // HTML만 클라이언트로 전송됨
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### 실행 흐름

```
1. 브라우저가 페이지 요청
   ↓
2. **서버**에서 Server Component 실행
   - DB 연결
   - 쿼리 실행
   - 데이터 가져오기
   ↓
3. 서버가 React 컴포넌트를 렌더링
   ↓
4. 렌더링된 결과(HTML/JSON)만 브라우저로 전송
   ↓
5. 브라우저는 완성된 UI를 표시
```

**중요:** DB 연결 정보나 쿼리 코드는 절대 브라우저로 전송되지 않습니다.

### 기존 아키텍처와 비교

#### 전통적인 방식 (React 18 이하)

```
프론트엔드 (브라우저)          백엔드 서버              DB
     │                           │                    │
     │──── GET /api/users ────→  │                    │
     │                           │──── SELECT * ────→ │
     │                           │←──── 데이터 ──────  │
     │←──── JSON 응답 ──────────  │                    │
     │                           │                    │
   useState에
   데이터 저장
```

#### Server Components 방식 (React 19)

```
서버 (Next.js 등)                                    DB
     │                                                │
  Server Component 실행                                │
     │──────────── SELECT * ─────────────────────────→ │
     │←─────────── 데이터 ───────────────────────────  │
     │                                                │
  컴포넌트 렌더링
     │                                                │
     └──→ 렌더링된 HTML/RSC Payload만 브라우저로 전송
```

---

## 보안 이슈와 안전한 사용법

### 주요 보안 우려사항

#### 1. 데이터 노출 위험
- Server Component에서 민감한 데이터가 클라이언트로 전송될 수 있음
- API 키, 데이터베이스 쿼리 등이 실수로 노출될 수 있음

#### 2. Server Actions의 인증/인가
- Server Actions는 HTTP 엔드포인트처럼 동작
- 적절한 인증/인가 처리가 없으면 취약점이 됨

### 안전하게 사용하는 방법

```javascript
// ❌ 위험한 예시
async function ServerComponent() {
  const data = await db.users.findMany(); // 모든 필드 포함
  return <UserList users={data} />; // 민감한 정보 노출 가능
}

// ✅ 안전한 예시
async function ServerComponent() {
  const data = await db.users.findMany({
    select: { id: true, name: true, email: true } // 필요한 것만
  });
  return <UserList users={data} />;
}

// ❌ 위험한 Server Action
async function deleteUser(userId) {
  await db.users.delete({ where: { id: userId } });
}

// ✅ 안전한 Server Action
async function deleteUser(userId) {
  const session = await getSession();
  if (!session || session.userId !== userId) {
    throw new Error('Unauthorized');
  }
  await db.users.delete({ where: { id: userId } });
}
```

---

## Server Components vs 전통적 API

### 프론트엔드에서 API를 만드는 것인가?

**정확히 맞습니다!** 기존 방식과 비교하면:

#### 전통적인 방식
```javascript
// ===== 백엔드 (서버) =====
// routes/users.js
app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany();
  res.json(users);
});

// ===== 프론트엔드 (브라우저) =====
// components/UserList.jsx
function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')  // 엔드포인트 호출
      .then(res => res.json())
      .then(setUsers);
  }, []);

  return <div>{users.map(...)}</div>;
}
```

#### Server Components 방식
```javascript
// ===== app/users/page.jsx (코드는 프론트 영역에 있지만...) =====
async function UserList() {
  // 이 "함수 자체"가 서버로 전달되어 실행됨
  const users = await db.users.findMany();

  return <div>{users.map(...)}</div>;
}
```

### Server Actions의 자동 RPC 생성

```javascript
// 개발자가 작성한 코드
'use server';
export async function deleteProduct(id) {
  await db.product.delete({ where: { id } });
}

// ===== 실제로 변환되는 구조 =====

// 서버 측: 자동 생성된 엔드포인트
// POST /actions/deleteProduct
app.post('/actions/deleteProduct', async (req, res) => {
  const { id } = req.body;
  await db.product.delete({ where: { id } });
  res.json({ success: true });
});

// 클라이언트 측: 자동 생성된 프록시 함수
async function deleteProduct(id) {
  const response = await fetch('/actions/deleteProduct', {
    method: 'POST',
    body: JSON.stringify({ id })
  });
  return response.json();
}
```

**프레임워크가 자동으로 RPC 레이어를 만들어줍니다!**

---

## ORM과 데이터베이스 접근

### ORM은 "백엔드 도구"입니다

```javascript
// app/users/page.jsx (Next.js App Router)
// 이 파일은 서버에서 실행됩니다!

import { PrismaClient } from '@prisma/client'; // 서버 전용

const prisma = new PrismaClient();

// Server Component (기본값)
export default async function UsersPage() {
  // 이 코드는 서버에서 실행
  const users = await prisma.users.findMany();

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### 브라우저로 전송되는 것

```html
<!-- 실제로 브라우저가 받는 것 -->
<div>
  <div>홍길동</div>
  <div>김철수</div>
  <div>이영희</div>
</div>
```

**DB 연결 정보, Prisma 코드, 쿼리 ���은 전송되지 않습니다.**

### Server vs Client Component 구분

```javascript
// ===== Server Component (기본) =====
// DB 접근 가능, Node.js API 사용 가능
async function ServerComponent() {
  const data = await db.query(); // ✅ 가능
  const file = await fs.readFile(); // ✅ 가능

  return <div>{data}</div>;
}

// ===== Client Component =====
'use client'; // 이 지시문이 있으면 클라이언트 컴포넌트

import { useState } from 'react';

function ClientComponent() {
  const [count, setCount] = useState(0);
  // const data = await db.query(); // ❌ 불가능! 에러 발생

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

## 빌드타임 vs 런타임

### 빌드 타임에 일어나는 일

```javascript
// app/products/page.jsx (개발자가 작성)
export default async function ProductsPage() {
  const products = await db.product.findMany();
  return <div>{products.map(...)}</div>;
}
```

**빌드 시:**
```bash
$ npm run build

# Next.js/프레임워크가 분석:
✓ Server Component 감지
✓ 서버 번들에 포함
✓ 클라이언트 번들에서 제외
✓ 코드 분리 완료
```

생성되는 결과:
```
.next/
├── server/           # 서버 코드 (DB 쿼리 포함)
│   └── app/
│       └── products/
│           └── page.js  # 실제 DB 코드 포함
│
└── static/           # 클라이언트 코드
    └── chunks/
        └── (DB 코드 없음!)
```

### 런타임에 일어나는 일

```
브라우저                        서버
   │                            │
   │─── GET /products ────────→ │
   │                            │
   │                        (서버의 빌드된
   │                         코드 실행)
   │                            │
   │                   await db.product
   │                      .findMany()
   │                            │
   │←─── HTML/RSC payload ──────│
   │                            │
```

**사용자는 빌드된 결과만 받습니다. 원본 코드에 접근 불가능합니다.**

---

## 프레임워크의 역할

### React vs Next.js 관계

#### 타임라인

```
2020년 12월: React 팀이 Server Components RFC 발표 (실험적 기능)
2022년 10월: Next.js 13 출시 - Server Components 최초 프로덕션 구현
2023년 5월:  Next.js 13.4 - App Router 안정화
2024년 4월:  React 19 RC - Server Components 공식 지원
2024년 12월: React 19 정식 출시 - Server Components 안정화
```

**중요한 사실:**
- Server Components는 React 19에서 추가된 게 아닙니다
- React 팀이 2020년부터 설계했습니다
- Next.js가 먼저 구현했습니다 (2022년)
- React 19는 나중에 공식 지원한 것입니다

### React의 역할: "명세(Specification)" 제공

React는 **어떻게 동작해야 하는지**만 정의합니다:

```
React가 정의한 것:
- Server Component는 서버에서만 실행된다
- Client Component는 'use client' 지시문을 사용한다
- Server Component는 async 함수일 수 있다
- props는 직렬화 가능해야 한다
```

**React는 구현을 제공하지 않습니다!**

### 프레임워크의 역할: "구현(Implementation)" 제공

```
React:       "Server Component는 이렇게 동작해야 한다" (명세)
              ↓
Next.js:     "우리가 그걸 구현했다" (구현)
Remix:       "우리도 구현했다" (구현)
Waku:        "우리도 구현했다" (구현)
```

### 바닐라 React로는 불가능합니다

```javascript
// create-react-app 또는 Vite + React

// ❌ 이건 안 됩니다
async function App() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}

// ✅ Client Component만 가능
function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://api.example.com/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{data}</div>;
}
```

**왜 안 되는가?**
- create-react-app/Vite는 클라이언트 전용 번들러
- 서버가 없음
- Server Component를 실행할 런타임이 없음

### Next.js가 추가한 것들

1. **서버 런타임**: Server Component를 실행하는 Node.js 서버
2. **번들러 통합**: 서버/클라이언트 코드 분리
3. **라우팅 시스템**: URL → Server Component 매핑
4. **데이터 페칭 인프라**: 서버 사이드 fetch, 캐싱
5. **RSC Protocol 구현**: 특수 직렬화 포맷

---

## WebRTC 구현 방법

### WebRTC는 Server Components로 만들 수 없습니다

WebRTC는 **실시간 P2P(Peer-to-Peer) 통신**이므로:

```javascript
// ❌ 이건 불가능합니다
// Server Component에서는 할 수 없음
async function VideoCall() {
  // Server Component는 브라우저 API 접근 불가
  const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // ❌ 에러!
  return <video srcObject={stream} />;
}
```

**이유:**
- `navigator`, `window`, `document` 같은 브라우저 API는 클라이언트에서만 존재
- Server Components는 서버에서 실행되므로 브라우저 API 접근 불가
- WebRTC는 실시간 양방향 통신이 필요함

### WebRTC는 Client Component로 만들어야 합니다

```javascript
// ✅ Client Component로 구현
'use client';

import { useEffect, useRef, useState } from 'react';

export default function VideoCall() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    async function setupWebRTC() {
      // 카메라/마이크 접근
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // RTCPeerConnection 생성
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      // 스트림 추가
      mediaStream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, mediaStream);
      });
    }

    setupWebRTC();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
      peerConnection.current?.close();
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
}
```

### WebRTC 전체 아키텍처

```
┌─────────────────┐         ┌─────────────────┐
│   Client A      │         │   Client B      │
│  (브라우저)      │         │  (브라우저)      │
│                 │         │                 │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │  WebRTC   │◄─┼─────────┼─►│  WebRTC   │  │
│  │ (P2P 연결)│  │  직접    │  │ (P2P 연결)│  │
│  └─────┬─────┘  │  연결    │  └─────┬─────┘  │
│        │        │         │        │        │
└────────┼────────┘         └────────┼────────┘
         │                           │
         │     시그널링 정보 교환      │
         │    (SDP, ICE candidates)  │
         │                           │
         └──────────┬─────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   시그널링 서버       │
         │  (Server Actions 또는 │
         │   WebSocket)         │
         │                      │
         │  ┌────────────────┐  │
         │  │  Database      │  │
         │  │  (room info)   │  │
         │  └────────────────┘  │
         └──────────────────────┘
```

### 시그널링 서버 구현 (Server Actions 사용)

#### DB 스키마 (Prisma)

```prisma
// prisma/schema.prisma
model Room {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  offers    Offer[]
  answers   Answer[]
  candidates IceCandidate[]
}

model Offer {
  id       String @id @default(cuid())
  roomId   String
  room     Room   @relation(fields: [roomId], references: [id])
  sdp      String @db.Text
  createdAt DateTime @default(now())
}

model Answer {
  id       String @id @default(cuid())
  roomId   String
  room     Room   @relation(fields: [roomId], references: [id])
  sdp      String @db.Text
  createdAt DateTime @default(now())
}

model IceCandidate {
  id         String @id @default(cuid())
  roomId     String
  room       Room   @relation(fields: [roomId], references: [id])
  candidate  String @db.Text
  createdAt  DateTime @default(now())
}
```

#### Server Actions (시그널링)

```javascript
// app/webrtc/actions.ts
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// 방 생성
export async function createRoom(name: string) {
  const room = await prisma.room.create({
    data: { name }
  });
  return room;
}

// Offer 저장
export async function saveOffer(roomId: string, sdp: string) {
  await prisma.offer.create({
    data: { roomId, sdp }
  });
  revalidatePath(`/room/${roomId}`);
}

// Answer 저장
export async function saveAnswer(roomId: string, sdp: string) {
  await prisma.answer.create({
    data: { roomId, sdp }
  });
  revalidatePath(`/room/${roomId}`);
}

// ICE Candidate 저장
export async function saveIceCandidate(roomId: string, candidate: string) {
  await prisma.iceCandidate.create({
    data: { roomId, candidate }
  });
  revalidatePath(`/room/${roomId}`);
}
```

### 더 나은 방법: WebSocket 사용

실제 프로덕션에서는 폴링 방식보다 WebSocket을 사용하는 것이 효율적입니다:

```javascript
// lib/websocket-server.ts
import { Server } from 'socket.io';

export function setupWebSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', socket.id);
    });

    socket.on('offer', (roomId, offer) => {
      socket.to(roomId).emit('offer', offer);
    });

    socket.on('answer', (roomId, answer) => {
      socket.to(roomId).emit('answer', answer);
    });

    socket.on('ice-candidate', (roomId, candidate) => {
      socket.to(roomId).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
```

---

## 팀 협업 전략

### DB 모델 제작

#### 소규모 팀 / 스타트업
```
프론트엔드 개발자가 DB 모델 직접 관리 ✅
  ↓
Prisma schema 작성
  ↓
Server Actions로 CRUD 구현
```

#### 중대형 팀
```
백엔드 팀: DB 스키마 설계 및 관리
  ↓
프론트엔드 팀:
  - Option 1: Prisma Client 공유받아 사용
  - Option 2: API 통해 데이터 접근
```

### 시그널링 서버 협업 전략

#### 시나리오 1: 프론트가 Next.js로 구현

**장점:**
- 프론트의 자율성
- 백엔드 대기 없이 빠르게 개발
- 명확한 책임 분리

**단점:**
- 인증/인가 로직 중복
- DB 분리 문제
- 배포 복잡도 증가

#### 시나리오 2: 백엔드가 모두 구현

**장점:**
- 통합된 인증
- 단일 DB
- 통합 모니터링
- 간단한 배포

**단점:**
- 백엔드 부담 증가
- 프론트의 대기 시간
- WebRTC 이해 필요

#### 시나리오 3: 하이브리드 (추천) ⭐

```
프론트엔드 (Next.js)
├── WebRTC Client Component
└── 간단한 WebSocket 클라이언트

백엔드 서버
├── REST API (비즈니스 로직)
├── WebSocket 서버 (시그널링만)
│   └── 메시지 릴레이만 담당
└── DB (필요한 것만 저장)
```

**백엔드: 최소한의 시그널링 서버**

```javascript
// backend/src/signaling/signaling.gateway.ts (NestJS)
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL }
})
export class SignalingGateway {

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId }: { roomId: string }
  ) {
    client.join(roomId);
    client.to(roomId).emit('user-joined', client.id);
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId, offer }: any
  ) {
    // 그냥 릴레이만
    client.to(roomId).emit('offer', offer);
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId, answer }: any
  ) {
    client.to(roomId).emit('answer', answer);
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() { roomId, candidate }: any
  ) {
    client.to(roomId).emit('ice-candidate', candidate);
  }
}
```

**하이브리드의 장점:**

✅ **역할 분담 명확**
```
백엔드:
  - 인증/인가 (한 곳에서만)
  - DB 관리 (단일 DB)
  - WebSocket 릴레이 (간단, 상태 없음)
  - 비즈니스 로직

프론트:
  - WebRTC 로직 (전문성)
  - UI/UX
  - 백엔드 API/WebSocket 사용
```

✅ **독립적 개발 가능**
✅ **최소한의 DB 사용**
✅ **단일 인증**

### 팀 상황별 추천

#### 소규모 팀 (1-2명 풀스택)
**→ Next.js로 모두 구현**
- 한 사람이 다 관리
- 배포 간단
- 개발 속도 빠름

#### 프론트/백 분리 팀 (각 2-3명)
**→ 하이브리드 방식 (추천)**
- 백엔드: 간단한 WebSocket 릴레이 + REST API
- 프론트: WebRTC 로직 + UI
- 역할 명확, 독립적 개발 가능

#### 대규모 팀 (각 5명 이상)
**→ 백엔드가 모두 관리**
- 백엔드: WebSocket + REST API + DB
- 프론트: Client만
- 통합 모니터링, 높은 품질 요구

### 의사결정 체크리스트

```
1. 백엔드 팀이 WebSocket 경험이 있나?
   Yes → 백엔드에 맡기기
   No  → 하이브리드 또는 프론트 주도

2. 시그널링 외 WebRTC 관련 로직이 복잡한가?
   Yes → 프론트가 주도적으로
   No  → 백엔드 가능

3. 실시간 기능이 서비스의 핵심인가?
   Yes → 전담 팀/백엔드가 관리
   No  → 프론트가 빠르게 구현

4. 인증 시스템이 복잡한가?
   Yes → 백엔드 통합 필요
   No  → 프론트 독립 가능

5. 모니터링/로깅이 중요한가?
   Yes → 백엔드 통합
   No  → 분리 가능

6. 팀 간 소통이 원활한가?
   Yes → 어떤 방식이든 OK
   No  → 명확한 인터페이스 정의 (하이브리드)
```

---

## 프로덕션 사용 가능 여부 (2025년 기준)

### 이미 프로덕션에서 널리 사용 중

- Vercel
- Netflix (일부 서비스)
- Twitch
- Hulu
- Nike
- 수많은 스타트업들

### 프로젝트 타입별 권장사항

#### 1. 간단한 프로젝트 → ✅ 바로 사용 가능
- 블로그, 포트폴리오, 랜딩 페이지
- 간단한 CRUD 앱
- 사내 툴, MVP/프로토타입

#### 2. 중간 규모 프로젝트 → ⚠️ 신중하게 사용
- SaaS 제품 (중소 규모)
- 이커머스 (중소 규모)
- 대시보드/관리 툴

**주의사항:**
- 미들웨어 패턴을 직접 구축해야 함
- 에러 핸들링 전략 필요
- 보안 검토 프로세스 필수

#### 3. 대규모/복잡한 프로젝트 → ❌ 현재는 비추천
- 대규모 이커머스
- 금융 서비스
- 의료 시스템
- 엔터프라이즈 SaaS

### 프레임워크 생태계 성숙도

```
현재 (2025):          ████░░░░░░ 40% 성숙도
예상 (2026):          ███████░░░ 70% 성숙도
예상 (2027):          █████████░ 90% 성숙도
```

### 실무 권장사항

**지금 바로 사용해도 되는 경우:**
- ✅ 새 프로젝트 (레거시 없음)
- ✅ 작은 팀 (5명 이하, 빠른 의사결정)
- ✅ 단순한 도메인
- ✅ 빠른 출시가 중요
- ✅ Next.js 생태계에 올인할 의향

**기다리는 게 나은 경우:**
- ⏸️ 대규모 팀
- ⏸️ 레거시 통합 필요
- ⏸️ 높은 보안 요구사항
- ⏸️ 마이크로서비스 아키텍처
- ⏸️ 검증된 패턴 선호하는 조직

**절충안: 하이브리드 접근**
```javascript
// 간단한 것: Server Actions
'use server';
export async function updateUserProfile(data) {
  const session = await auth();
  return await prisma.user.update({
    where: { id: session.userId },
    data
  });
}

// 복잡한 것: API Routes (기존 방식)
// app/api/orders/route.ts
export async function POST(request: Request) {
  // 복잡한 주문 처리 로직
  // 기존 검증된 패턴 사용
}
```

---

## 요약

### 핵심 포인트

1. **Server Components는 서버에서 실행됩니다**
   - 브라우저가 아닙니다
   - DB 연결 정보는 브라우저로 절대 전송 안 됨

2. **프레임워크가 필수입니다**
   - React는 명세만 제공
   - Next.js, Remix 등이 실제 구현
   - 바닐라 React로는 불가능

3. **WebRTC는 Client Component로**
   - Server Components는 브라우저 API 접근 불가
   - 시그널링 서버는 Server Actions 또는 WebSocket으로

4. **보안이 중요합니다**
   - 모든 Server Action에 인증/인가 필수
   - 필요한 데이터만 선택적으로 전송
   - 민감한 정보 필터링 철저히

5. **프로덕션 사용 가능하지만**
   - 간단한 프로젝트는 OK
   - 복잡한 프로젝트는 신중히
   - 생태계는 빠르게 발전 중

6. **팀 협업**
   - 소규모: Next.js로 풀스택
   - 중규모: 하이브리드 (추천)
   - 대규모: 백엔드 중심

### 비유로 이해하기

```
React = 자동차 엔진 설계도
Next.js = 완성된 자동차 (엔진 + 차체 + 바퀴 + ...)
바닐라 React = 엔진만 있는 상태 (달릴 수 없음)

Server Components = 2015년의 React
  - 프로덕션에서 사용 가능하지만 모범 사례 정립 중
  - 2-3년 후 업계 표준이 될 가능성 높음
```

---

## 참고 자료

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [WebRTC Documentation](https://webrtc.org/)

---

**작성일:** 2025-01-31
**마지막 업데이트:** 2025-01-31
