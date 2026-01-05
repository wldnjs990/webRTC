# WebRTC 화상채팅 서비스 배포 가이드

Railway(백엔드) + Vercel(프론트엔드) 배포 완벽 가이드

---

## 📋 목차

1. [배포 개요](#배포-개요)
2. [사전 준비사항](#사전-준비사항)
3. [Railway 백엔드 배포](#railway-백엔드-배포)
4. [Vercel 프론트엔드 배포](#vercel-프론트엔드-배포)
5. [CORS 최종 설정](#cors-최종-설정)
6. [배포 확인 및 테스트](#배포-확인-및-테스트)
7. [트러블슈팅](#트러블슈팅)

---

## 배포 개요

### 아키텍처

```
사용자 브라우저
    ↓
Vercel (프론트엔드)
    ↓ HTTPS
Railway (백엔드)
    ↓
Railway PostgreSQL (데이터베이스)
```

### 기술 스택

- **프론트엔드**: React 18 + TypeScript + Vite → Vercel
- **백엔드**: Node.js + Express + Socket.IO → Railway
- **데이터베이스**: PostgreSQL + Prisma ORM 7 → Railway
- **WebRTC**: P2P 통신 (STUN: Google Public STUN Server)

---

## 사전 준비사항

### 1. 필요한 계정

- ✅ [Railway](https://railway.app/) 계정 (GitHub 연동 권장)
- ✅ [Vercel](https://vercel.com/) 계정 (GitHub 연동 권장)
- ✅ GitHub 계정 (코드 저장소)

### 2. 로컬 테스트 완료

배포 전에 로컬에서 아래 기능들이 정상 작동하는지 확인:

```bash
# 백엔드 실행
cd backend
pnpm install
pnpm dev

# 프론트엔드 실행 (다른 터미널)
cd frontend
pnpm install
pnpm dev
```

**테스트 체크리스트:**
- [ ] 소켓 연결 성공
- [ ] 방 생성/입장 가능
- [ ] 카메라/마이크 활성화
- [ ] 두 브라우저 간 WebRTC 연결 성공
- [ ] 방 나가기 시 정상 리다이렉션
- [ ] 방장 퇴장 시 참가자 자동 퇴장

---

## Railway 백엔드 배포

### 1단계: GitHub 저장소 준비

```bash
# 백엔드 폴더만 별도 저장소로 분리 (권장)
cd backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/your-username/webrtc-backend.git
git push -u origin main
```

> **Tip**: Railway는 모노레포도 지원하지만, 백엔드만 별도 저장소로 분리하면 배포가 더 간단합니다.

### 2단계: Railway 프로젝트 생성

1. [Railway Dashboard](https://railway.app/dashboard) 접속
2. **New Project** 클릭
3. **Deploy from GitHub repo** 선택
4. 백엔드 저장소 선택

### 3단계: PostgreSQL 데이터베이스 추가

1. Railway 프로젝트 대시보드에서 **New** 클릭
2. **Database** → **Add PostgreSQL** 선택
3. 자동으로 `DATABASE_URL` 환경변수가 생성됨

### 4단계: 환경변수 설정

Railway 프로젝트 → **Variables** 탭에서 추가:

```env
# 백엔드 서버 설정
PORT=3000
NODE_ENV=production

# CORS 설정 (Vercel 배포 후 업데이트 필요)
CLIENT_URL=https://your-app.vercel.app

# DATABASE_URL은 PostgreSQL 추가 시 자동 생성됨
```

> **⚠️ 중요**: `CLIENT_URL`은 Vercel 배포 후 실제 URL로 업데이트해야 합니다!

### 5단계: Build 설정

Railway → **Settings** → **Build** 섹션:

- **Build Command**: `pnpm install && npx prisma generate`
- **Start Command**: `node server.js`

또는 `package.json`에 스크립트 추가:

```json
{
  "scripts": {
    "build": "prisma generate",
    "start": "node server.js"
  }
}
```

### 6단계: Prisma 마이그레이션 실행

Railway 배포 완료 후:

1. Railway 대시보드 → **Deployments** 탭
2. 최신 배포 클릭 → **View Logs**
3. 배포 성공 확인 후, Railway CLI로 마이그레이션 실행:

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# 마이그레이션 실행
railway run npx prisma migrate deploy
```

또는 Railway 대시보드에서 직접 실행:

1. **Variables** 탭에서 `DATABASE_URL` 복사
2. 로컬에서 임시 환경변수 설정 후 실행:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 7단계: 배포 확인

Railway 대시보드에서 배포된 URL 확인 (예: `https://webrtc-backend.up.railway.app`)

API 엔드포인트 테스트:

```bash
curl https://your-backend.railway.app/health
# 응답: {"status":"ok","timestamp":"..."}

curl https://your-backend.railway.app/rooms
# 응답: {"rooms":[]}
```

---

## Vercel 프론트엔드 배포

### 1단계: GitHub 저장소 준비

```bash
# 프론트엔드 폴더만 별도 저장소로 분리 (권장)
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/your-username/webrtc-frontend.git
git push -u origin main
```

### 2단계: Vercel 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. **Add New** → **Project** 클릭
3. GitHub 저장소 선택 (프론트엔드)
4. **Framework Preset**: Vite 자동 감지됨

### 3단계: 환경변수 설정

Vercel 프로젝트 → **Settings** → **Environment Variables**:

```env
VITE_API_URL=https://your-backend.railway.app
```

> **✅ Railway 백엔드 URL을 정확히 입력하세요!**

### 4단계: Build 설정 확인

Vercel이 자동으로 감지하지만, 확인:

- **Build Command**: `pnpm run build` (또는 `vite build`)
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

### 5단계: 배포 실행

**Deploy** 버튼 클릭 → 자동 빌드 및 배포

배포 완료 후 Vercel URL 확인 (예: `https://webrtc-app.vercel.app`)

---

## CORS 최종 설정

### Railway 환경변수 업데이트

Vercel 배포 완료 후, Railway로 돌아가서:

1. Railway 프로젝트 → **Variables** 탭
2. `CLIENT_URL` 변수 수정:

```env
CLIENT_URL=https://your-app.vercel.app
```

3. **Save** 클릭 → 자동 재배포

### 여러 도메인 허용 (옵션)

개발 환경도 함께 허용하려면:

```env
CLIENT_URL=https://your-app.vercel.app,http://localhost:5173
```

---

## 배포 확인 및 테스트

### 1. 프론트엔드 접속

Vercel URL로 접속: `https://your-app.vercel.app`

### 2. 소켓 연결 확인

1. 브라우저 개발자 도구 → **Console** 탭
2. 다음 로그 확인:
   ```
   🔌 새 소켓 인스턴스 생성: https://your-backend.railway.app
   ✅ 서버 연결됨
   ```

### 3. 기능 테스트

**방 생성 및 입장:**
1. 첫 번째 브라우저: 방 ID "test123" 입력 → **방 생성** 클릭
2. 두 번째 브라우저 (시크릿 모드): 방 ID "test123" 입력 → **방 입장** 클릭

**WebRTC 연결:**
1. 각 브라우저에서 **카메라/마이크 시작** 클릭
2. 상대방 화면이 보이는지 확인
3. 비디오/오디오 토글 테스트

**방 종료 시나리오:**
1. 방장(첫 번째 브라우저)이 **방 나가기** 클릭
2. 참가자가 자동으로 홈으로 리다이렉션되는지 확인

### 4. 네트워크 확인

개발자 도구 → **Network** 탭:

- WebSocket 연결: `wss://your-backend.railway.app/socket.io/...`
- API 호출: `https://your-backend.railway.app/rooms`

---

## 트러블슈팅

### 문제 1: CORS 에러

**증상:**
```
Access to XMLHttpRequest at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**해결:**
1. Railway → **Variables** → `CLIENT_URL` 확인
2. Vercel URL과 정확히 일치하는지 확인 (끝에 `/` 없어야 함)
3. Railway 재배포 (환경변수 변경 후 자동 재배포됨)

---

### 문제 2: 소켓 연결 실패

**증상:**
```
WebSocket connection failed
❌ 서버 연결 안됨
```

**해결:**

1. **프론트엔드 환경변수 확인:**
   ```bash
   # Vercel → Settings → Environment Variables
   VITE_API_URL=https://your-backend.railway.app
   ```

2. **Railway 백엔드 로그 확인:**
   ```bash
   railway logs
   ```

3. **Railway 서비스 상태 확인:**
   - Railway 대시보드 → **Deployments** → 최신 배포 상태

---

### 문제 3: Prisma 마이그레이션 에러

**증상:**
```
Error: P1001: Can't reach database server
```

**해결:**

1. **DATABASE_URL 확인:**
   ```bash
   railway run echo $DATABASE_URL
   ```

2. **마이그레이션 재실행:**
   ```bash
   railway run npx prisma migrate deploy
   ```

3. **스키마 확인:**
   ```bash
   railway run npx prisma db push
   ```

---

### 문제 4: WebRTC 연결 안됨 (STUN/TURN)

**증상:**
- 소켓은 연결되지만 상대방 화면이 안 보임
- Console에 "ICE failed" 또는 "connection failed"

**해결:**

1. **STUN 서버 확인:**
   ```typescript
   // frontend/src/features/video-chat/hooks/useWebRTC.ts:20
   const configuration = {
     iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
   }
   ```

2. **TURN 서버 추가 (옵션, 방화벽 환경):**
   ```typescript
   const configuration = {
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       {
         urls: 'turn:your-turn-server.com:3478',
         username: 'user',
         credential: 'pass'
       }
     ]
   }
   ```

3. **무료 TURN 서버:**
   - [Metered TURN](https://www.metered.ca/tools/openrelay/) (무료)
   - [Twilio STUN/TURN](https://www.twilio.com/stun-turn)

---

### 문제 5: Vercel 빌드 실패

**증상:**
```
Error: Command "pnpm run build" exited with 1
```

**해결:**

1. **로컬 빌드 테스트:**
   ```bash
   cd frontend
   pnpm run build
   ```

2. **타입 에러 확인:**
   ```bash
   pnpm run type-check
   ```

3. **Vercel 로그 확인:**
   - Vercel 대시보드 → **Deployments** → 실패한 배포 클릭

---

### 문제 6: 환경변수가 적용 안됨

**증상:**
- 프론트엔드에서 `import.meta.env.VITE_API_URL`이 `undefined`

**해결:**

1. **환경변수 이름 확인:**
   - Vite는 `VITE_` 접두사 필수!
   - `API_URL` (❌) → `VITE_API_URL` (✅)

2. **Vercel 재배포:**
   - 환경변수 추가 후 **Redeploy** 필요

3. **로컬 테스트:**
   ```bash
   # frontend/.env.production
   VITE_API_URL=https://your-backend.railway.app

   pnpm run build
   pnpm run preview
   ```

---

## 배포 후 유지보수

### 로그 모니터링

**Railway 백엔드:**
```bash
railway logs --follow
```

**Vercel 프론트엔드:**
- Vercel Dashboard → **Deployments** → 배포 클릭 → **View Function Logs**

### 데이터베이스 관리

**Prisma Studio (Railway):**
```bash
railway run npx prisma studio
```

**PostgreSQL 직접 접속:**
```bash
railway run psql $DATABASE_URL
```

### 자동 배포 설정

**Railway:**
- GitHub 저장소 연결 시 자동 배포 활성화됨
- `main` 브랜치에 push → 자동 배포

**Vercel:**
- GitHub 저장소 연결 시 자동 배포 활성화됨
- `main` 브랜치에 push → 자동 배포

---

## 보안 권장사항

### 1. 환경변수 보호

- ✅ `.env` 파일을 `.gitignore`에 추가 (이미 설정됨)
- ✅ GitHub에 환경변수 절대 커밋하지 않기
- ✅ Railway/Vercel 대시보드에서만 환경변수 관리

### 2. CORS 제한

```env
# 개발 환경 제외 (프로덕션)
CLIENT_URL=https://your-app.vercel.app
```

### 3. Rate Limiting (추가 권장)

`backend/server.js`에 추가:

```bash
pnpm add express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // IP당 최대 100 요청
});

app.use('/api/', limiter);
```

---

## 비용 안내

### Railway

- **무료 플랜**: 월 $5 크레딧 (약 500시간)
- **PostgreSQL**: 무료 플랜에 포함
- **예상 비용**: 소규모 트래픽 → 무료 범위 내

### Vercel

- **Hobby 플랜**: 완전 무료
- **대역폭**: 월 100GB
- **빌드 시간**: 월 100시간

---

## 성능 최적화 (옵션)

### 1. CDN 캐싱

Vercel은 자동으로 정적 파일을 CDN으로 서빙합니다.

### 2. 데이터베이스 인덱스

이미 `schema.prisma`에 설정되어 있음:
```prisma
@@index([createdAt])
@@index([roomId])
@@index([socketId])
```

### 3. Socket.IO 최적화

`backend/server.js`에 이미 설정됨:
```javascript
pingTimeout: 60000,
pingInterval: 25000,
maxHttpBufferSize: 1e6, // 1MB
```

---

## 추가 기능 확장

### 1. 사용자 인증

- [Clerk](https://clerk.com/) (권장)
- [Auth0](https://auth0.com/)
- [NextAuth.js](https://next-auth.js.org/)

### 2. 화면 녹화

- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

### 3. 채팅 메시지

Socket.IO로 텍스트 채팅 추가 가능

### 4. 방 비밀번호

`Room` 모델에 `password` 필드 추가

---

## 참고 자료

### 공식 문서

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Socket.IO Docs](https://socket.io/docs/v4/)
- [WebRTC MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### 프로젝트 문서

- `BACKEND_DEVELOPMENT.md` - 백엔드 개발 가이드
- `FRONTEND_DEVELOPMENT.md` - 프론트엔드 개발 가이드
- `README.md` - 프로젝트 개요

---

## 지원 및 문의

배포 중 문제가 발생하면:

1. 이 가이드의 [트러블슈팅](#트러블슈팅) 섹션 확인
2. Railway/Vercel 로그 확인
3. GitHub Issues 등록

---

**배포 성공을 기원합니다! 🚀**
