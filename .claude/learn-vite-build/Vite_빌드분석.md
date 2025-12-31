# Vite 빌드 전후 폴더 구조 변화 가이드

## 핵심 개념

**빌드는 개발 중 폴더 구조를 완전히 파괴하고 새로운 구조를 만듭니다!**

---

## 폴더 구조 비교

### 📁 빌드 전 (개발 중)

```
webRTC/
├── public/                          ← 정적 파일 (빌드 시 그대로 복사)
│   └── vite.svg
│
├── src/                             ← 소스 코드
│   ├── main.tsx                     ← 엔트리 포인트
│   ├── App.tsx
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   └── PrivatePage.tsx
│   │
│   ├── router/
│   │   ├── router.tsx
│   │   ├── publicRoutes.tsx
│   │   └── privateRoutes.tsx
│   │
│   ├── features/
│   │   ├── home/
│   │   │   └── HomeHeader.tsx
│   │   └── private/
│   │
│   ├── components/
│   │   └── Button.tsx
│   │
│   ├── styles/
│   │   └── global.css
│   │
│   └── assets/                      ← 이미지, 폰트 등
│       ├── logo.png
│       └── background.jpg
│
├── index.html
├── package.json
└── vite.config.ts
```

### 📦 빌드 후 (dist/)

```
dist/
├── index.html                       ← HTML (수정됨)
├── vite.svg                         ← public에서 복사됨
│
└── assets/                          ← 모든 번들 파일이 여기로!
    ├── index-a1b2c3d4.js           ← 모든 TS/TSX 파일이 하나로 합쳐짐
    ├── index-e5f6g7h8.css          ← 모든 CSS 파일이 하나로 합쳐짐
    ├── logo-i9j0k1l2.png           ← src/assets에서 이동 (해시 추가)
    └── background-m3n4o5p6.jpg     ← src/assets에서 이동 (해시 추가)
```

---

## 주요 변화점

### 1️⃣ **모든 폴더 구조 사라짐**

#### Before (20개 파일)
```
src/
├── pages/HomePage.tsx
├── pages/PrivatePage.tsx
├── router/router.tsx
├── router/publicRoutes.tsx
├── router/privateRoutes.tsx
├── features/home/HomeHeader.tsx
├── components/Button.tsx
└── ... (나머지 파일들)
```

#### After (1개 파일)
```
dist/assets/index-abc123.js  ← 모든 파일이 하나로!
```

**이유**: 번들러가 모든 import를 추적해서 하나의 파일로 합침 (Tree-shaking도 적용)

---

### 2️⃣ **파일명에 해시 추가**

#### Before
```
src/assets/logo.png
```

#### After
```
dist/assets/logo-a1b2c3d4.png
```

**이유**:
- **캐시 무효화**: 파일이 변경되면 해시도 바뀌어서 브라우저가 새 파일 다운로드
- **캐시 최적화**: 변경 안 된 파일은 캐시된 것 사용

---

### 3️⃣ **HTML 파일 자동 수정**

#### 개발 중 (index.html)
```html
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### 빌드 후 (dist/index.html)
```html
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <link rel="stylesheet" href="/assets/index-e5f6g7h8.css">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index-a1b2c3d4.js"></script>
  </body>
</html>
```

**변화**:
- `/src/main.tsx` → `/assets/index-abc123.js`
- CSS 링크 자동 추가
- 해시가 포함된 파일명으로 자동 업데이트

---

## 왜 상대 경로가 문제인가?

### 시나리오 1: 정적 자산을 상대 경로로 참조

#### ❌ 문제가 되는 코드

```tsx
// src/features/home/HomeHeader.tsx
function HomeHeader() {
  return (
    <div>
      {/* 상대 경로 사용 */}
      <img src="../../assets/logo.png" alt="Logo" />
    </div>
  )
}
```

#### 개발 중 (정상 작동)
```
현재 파일: src/features/home/HomeHeader.tsx
상대 경로: ../../assets/logo.png
계산:      src/features/home/ → src/features/ → src/ → assets/logo.png
결과:      src/assets/logo.png ✅
```

#### 빌드 후 (404 에러!)
```
HTML 위치: dist/index.html
img src:   ../../assets/logo.png
계산:      dist/ → ../ → ../../assets/logo.png
결과:      /assets/logo.png ❌ (존재하지 않음!)
실제 위치: dist/assets/logo-abc123.png
```

**문제**:
1. 폴더 구조가 완전히 바뀜
2. 파일명에 해시가 추가됨
3. 상대 경로가 더 이상 유효하지 않음

---

### 시나리오 2: Import 사용 (권장)

#### ✅ 올바른 코드

```tsx
// src/features/home/HomeHeader.tsx
import logo from '@/assets/logo.png'

function HomeHeader() {
  return (
    <div>
      {/* Import한 변수 사용 */}
      <img src={logo} alt="Logo" />
    </div>
  )
}
```

#### Vite가 빌드 시 처리

**1단계: 파일 복사 및 해시 추가**
```
src/assets/logo.png
  → dist/assets/logo-a1b2c3d4.png
```

**2단계: 코드에서 경로 자동 변환**
```tsx
// 빌드 전
import logo from '@/assets/logo.png'
<img src={logo} />

// 빌드 후 (자동 변환)
<img src="/assets/logo-a1b2c3d4.png" />
```

**결과**: 어떤 폴더 깊이에서든 항상 올바른 경로! ✅

---

## 코드 Import는 왜 괜찮은가?

### TypeScript/JavaScript Import

```tsx
// src/router/publicRoutes.tsx
import HomePage from '@/pages/HomePage'
import Button from '@/components/Button'
```

#### 빌드 과정

**1단계: 번들러가 모든 import 추적**
```
main.tsx
  → App.tsx
    → router.tsx
      → publicRoutes.tsx
        → HomePage.tsx
          → Button.tsx
```

**2단계: 하나의 파일로 합침 (번들링)**
```javascript
// dist/assets/index-abc123.js
// HomePage의 코드
function HomePage() { /* ... */ }

// Button의 코드
function Button() { /* ... */ }

// publicRoutes의 코드
const publicRoutes = [
  { path: '/', element: HomePage() }
]

// ... 나머지 코드
```

**결과**:
- import 문이 사라짐
- 모든 코드가 한 파일에 있음
- 경로 개념 자체가 없어짐
- **상대 경로든 절대 경로든 무관함!**

---

## public 폴더의 특별한 역할

### public 폴더 동작

```
public/
├── vite.svg
├── robots.txt
└── favicon.ico
```

**빌드 시**:
```
dist/
├── vite.svg      ← 그대로 복사
├── robots.txt    ← 그대로 복사
└── favicon.ico   ← 그대로 복사
```

### 사용 방법

```html
<!-- ✅ public 폴더의 파일 -->
<link rel="icon" href="/favicon.ico">
<img src="/vite.svg">

<!-- ❌ src/assets의 파일 (이렇게 하면 안 됨) -->
<img src="/src/assets/logo.png">

<!-- ✅ src/assets의 파일 (올바른 방법) -->
import logo from '@/assets/logo.png'
<img src={logo}>
```

**규칙**:
- `public/`: 절대 경로 `/파일명` 사용 (해시 없음)
- `src/assets/`: Import 사용 (빌드 시 해시 추가됨)

---

## 실전 비교표

| 방식 | 개발 중 | 빌드 후 | 배포 | 추천도 |
|------|--------|--------|------|--------|
| **코드 Import - 상대 경로** | ✅ | ✅ | ✅ | ⭐⭐⭐ |
| **코드 Import - Alias** | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **정적 자산 - 상대 경로 (src)** | ⚠️ | ❌ | ❌ | ❌ |
| **정적 자산 - Import (src)** | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **정적 자산 - 절대 경로 (public)** | ✅ | ✅ | ⚠️ | ⭐⭐⭐ |

---

## 권장 패턴

### ✅ 올바른 사용법

```tsx
// 1. 코드 Import - Alias 사용 (가독성 최고)
import HomePage from '@/pages/HomePage'
import Button from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'

// 2. 정적 자산 - Import 사용
import logo from '@/assets/logo.png'
import '@/styles/global.css'

// 3. public 폴더 - 절대 경로
function App() {
  return (
    <div>
      <img src={logo} alt="Logo" />
      <link rel="icon" href="/favicon.ico" />
    </div>
  )
}
```

### ❌ 피해야 할 패턴

```tsx
// 1. 정적 자산을 상대 경로로
<img src="../../assets/logo.png" />  // ❌ 빌드 후 깨짐

// 2. src 폴더를 절대 경로로
<img src="/src/assets/logo.png" />   // ❌ 404 에러

// 3. public 폴더를 import로
import favicon from '/favicon.ico'   // ❌ 작동 안 함
```

---

## 빌드 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 빌드 결과 확인
ls -la dist/
```

---

## 핵심 정리

1. **빌드는 폴더 구조를 완전히 바꿉니다**
   - `src/` 의 모든 폴더가 사라짐
   - 모든 코드가 `dist/assets/index-해시.js` 하나로 합쳐짐

2. **정적 자산의 파일명이 바뀝니다**
   - `logo.png` → `logo-a1b2c3d4.png` (해시 추가)
   - 상대 경로로는 찾을 수 없음

3. **코드 Import는 안전합니다**
   - 상대 경로든 alias든 번들링 시 모두 해석됨
   - 최종 파일에는 import가 존재하지 않음

4. **정적 자산은 반드시 Import 하세요**
   - Vite가 경로를 자동으로 처리해줌
   - 빌드 후에도 정상 작동 보장

---

**작성일**: 2025-12-31
**환경**: Vite 6 + React 19 + TypeScript 5
