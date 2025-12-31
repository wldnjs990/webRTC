# React Router 학습 가이드

주니어 개발자를 위한 React Router v6.4+ 완벽 가이드

---

## 목차

1. [라우팅 방식 비교](#1-라우팅-방식-비교)
2. [컴포넌트 계층 vs 객체 배열 방식](#2-컴포넌트-계층-vs-객체-배열-방식)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [네비게이션 가드 (Vue Router와 비교)](#4-네비게이션-가드-vue-router와-비교)
5. [Loader 함수 (공식 권장 방식)](#5-loader-함수-공식-권장-방식)
6. [실전 패턴과 베스트 프랙티스](#6-실전-패턴과-베스트-프랙티스)
7. [타입 안정성](#7-타입-안정성)
8. [공통 질문과 답변](#8-공통-질문과-답변)

---

## 1. 라우팅 방식 비교

React Router에서 라우트를 정의하는 두 가지 주요 방식이 있습니다.

### 컴포넌트 계층 방식 (JSX)

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />}>
          <Route path="team" element={<Team />} />
          <Route path="company" element={<Company />} />
        </Route>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**특징:**
- JSX 문법으로 선언적 작성
- 중첩 라우트가 시각적으로 명확
- 컴포넌트 내부에서 직접 정의
- React 컴포넌트의 props와 children 활용

### 객체 배열 방식 (Object-based)

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/about',
    element: <About />,
    children: [
      { path: 'team', element: <Team /> },
      { path: 'company', element: <Company /> }
    ]
  },
  {
    path: '/dashboard',
    element: <Dashboard />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}
```

**특징:**
- JavaScript 객체로 라우트 설정 정의
- 라우트 설정과 컴포넌트 로직 분리 가능
- 동적으로 라우트 생성/조작 용이
- 별도 파일로 분리하여 관리하기 좋음
- **v6.4+의 Data API (loader, action) 사용 가능**

---

## 2. 컴포넌트 계층 vs 객체 배열 방식

### 주요 차이점

| 특성 | 컴포넌트 방식 | 객체 방식 |
|------|-------------|----------|
| 구조 | JSX 컴포넌트 트리 | JavaScript 객체 배열 |
| 동적 처리 | JSX 조건부 렌더링 | 프로그래밍적 조작 (filter, map) |
| 타입 안정성 | JSX 자동완성 | 객체 타입 정의 필요 |
| Data API | ❌ 미지원 | ✅ loader, action 지원 |
| 권한 기반 라우팅 | 복잡 | 용이 |

### 언제 어떤 방식을 사용할까?

**컴포넌트 방식 사용:**
- 간단한 라우팅
- 레이아웃 컴포넌트와 함께 사용
- loader/action이 필요 없는 경우

**객체 방식 사용 (권장):**
- 권한 기반 라우팅
- 동적 라우트 생성
- 라우트 설정 중앙화
- **loader/action으로 데이터 로딩**
- 중대규모 프로젝트

---

## 3. 프로젝트 구조

### 관심사의 분리 (Separation of Concerns)

React Router 프로젝트는 역할에 따라 파일을 분리합니다.

```
src/
├── main.tsx              # DOM 마운팅만 담당
├── App.tsx               # 전역 Provider, 앱 설정
├── router/               # 라우팅 설정
│   ├── index.tsx         # router export
│   ├── routes/
│   │   ├── publicRoutes.tsx
│   │   └── privateRoutes.tsx
│   ├── loaders/
│   │   ├── shared/       # 공용 loader
│   │   │   ├── authLoader.ts
│   │   │   └── index.ts
│   │   └── compose.ts
│   └── guards/
│       └── ProtectedRoute.tsx
├── pages/                # 페이지 컴포넌트
└── components/           # 재사용 컴포넌트
```

### 각 파일의 역할

| 파일 | 책임 | 변경 이유 |
|------|------|----------|
| `main.tsx` | DOM 진입점, 루트 렌더링 | 거의 변경 안 함 |
| `App.tsx` | 전역 Provider, Context, 앱 설정 | 새로운 전역 상태/라이브러리 추가 시 |
| `router/index.tsx` | 라우팅 설정, 페이지 매핑 | 새 페이지 추가/수정 시 |

### 기본 예시

```tsx
// src/main.tsx - 최소한으로 유지
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```tsx
// src/App.tsx - 전역 설정
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

```tsx
// src/router/index.tsx - 라우트 조합
import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './routes/publicRoutes';
import { privateRoutes } from './routes/privateRoutes';

export const router = createBrowserRouter([
  ...publicRoutes,
  ...privateRoutes,
  { path: '*', element: <NotFound /> }
]);
```

**핵심:** `RouterProvider`는 하나의 `router` 객체만 받지만, 라우트 배열은 여러 파일로 나누어 관리할 수 있습니다.

---

## 4. 네비게이션 가드 (Vue Router와 비교)

### Vue Router 방식

```javascript
// Vue - meta 기반 가드
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  }
]

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
  } else {
    next()
  }
})
```

### React Router - 방식 1: 컴포넌트로 감싸기

```tsx
// src/router/guards/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

```tsx
// src/router/routes/privateRoutes.tsx
import { ProtectedRoute } from '../guards/ProtectedRoute';

export const privateRoutes = [
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  }
];
```

### React Router - 방식 2: Layout Route 패턴

```tsx
// src/layouts/ProtectedLayout.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <Header />
      <Sidebar />
      <main>
        <Outlet /> {/* 자식 라우트 렌더링 */}
      </main>
    </div>
  );
}
```

```tsx
// src/router/index.tsx
export const router = createBrowserRouter([
  {
    path: '/app',
    element: <ProtectedLayout />, // 레이아웃에서 인증 체크
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> }
    ]
  }
]);
```

**장점:** 여러 라우트에 공통 로직 적용, 레이아웃 + 인증을 함께 관리

---

## 5. Loader 함수 (공식 권장 방식)

### Loader란?

`loader`는 **컴포넌트 렌더링 전에 실행되는 함수**로, 데이터를 미리 로드하거나 인증 체크를 수행합니다.

### createBrowserRouter의 역할

```tsx
// createBrowserRouter는 "거대한 패턴 매칭 엔진"
const router = createBrowserRouter([
  {
    path: '/user/:userId',
    element: <UserProfile />
  }
]);
```

**내부 동작:**
1. URL 파싱 - 현재 경로 분석
2. 패턴 매칭 - 정의된 라우트와 비교
3. 파라미터 추출 - `:userId` 같은 동적 값 추출
4. **Loader 실행** - 컴포넌트 렌더링 전 데이터 로드
5. 컴포넌트 렌더링 - 매칭된 `element` 렌더링

### Loader 기본 사용법

```tsx
// src/router/loaders/userLoader.ts
import { LoaderFunctionArgs, redirect } from 'react-router-dom';

export async function userLoader({ params, request }: LoaderFunctionArgs) {
  // URL 파라미터 접근
  const userId = params.userId;

  // 쿼리 스트링 접근
  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'profile';

  // 데이터 로딩
  const user = await fetchUser(userId);

  // 인증 체크
  if (!user) {
    throw redirect('/login'); // Vue의 next('/login')과 동일
  }

  // 데이터 반환
  return { user, tab };
}

export type UserLoaderData = Awaited<ReturnType<typeof userLoader>>;
```

```tsx
// src/pages/UserProfile.tsx
import { useLoaderData } from 'react-router-dom';
import { UserLoaderData } from '@/router/loaders/userLoader';

export default function UserProfile() {
  const { user, tab } = useLoaderData() as UserLoaderData;

  // useEffect 불필요! 데이터가 이미 로드됨
  return <div>{user.name}의 프로필</div>;
}
```

```tsx
// src/router/index.tsx
import { userLoader } from './loaders/userLoader';

export const router = createBrowserRouter([
  {
    path: '/user/:userId',
    loader: userLoader,
    element: <UserProfile />
  }
]);
```

### Loader의 장점

**Before (loader 없이):**
```tsx
function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;

  return <div>{user.name}</div>;
}
```

**After (loader 사용):**
```tsx
// loader
export async function loader({ params }) {
  return { user: await fetchUser(params.userId) };
}

// component
function UserProfile() {
  const { user } = useLoaderData();
  return <div>{user.name}</div>; // 간결!
}
```

**개선점:**
- ✅ useEffect 제거
- ✅ 로딩/에러 상태 자동 관리
- ✅ 렌더링 전 데이터 로드 (더 빠름)
- ✅ 데이터 로딩 로직 분리

---

## 6. 실전 패턴과 베스트 프랙티스

### 공용 Loader 패턴 (재사용)

```tsx
// src/router/loaders/shared/authLoader.ts
import { redirect, LoaderFunctionArgs } from 'react-router-dom';
import { getCurrentUser } from '@/api/auth';

export async function requireAuth(args?: LoaderFunctionArgs) {
  const user = await getCurrentUser();
  if (!user) throw redirect('/login');
  return { user };
}

export async function requireAdmin(args?: LoaderFunctionArgs) {
  const user = await getCurrentUser();
  if (!user) throw redirect('/login');
  if (user.role !== 'admin') throw redirect('/unauthorized');
  return { user };
}

export async function guestOnly(args?: LoaderFunctionArgs) {
  const user = await getCurrentUser();
  if (user) throw redirect('/dashboard');
  return null;
}
```

### Loader 조합 패턴

```tsx
// src/router/loaders/compose.ts
import { LoaderFunctionArgs } from 'react-router-dom';

type LoaderFunction = (args: LoaderFunctionArgs) => Promise<any>;

export function composeLoaders(...loaders: LoaderFunction[]) {
  return async (args: LoaderFunctionArgs) => {
    const results = await Promise.all(loaders.map(loader => loader(args)));
    return Object.assign({}, ...results);
  };
}
```

### 공용 + 로컬 Loader 조합

```tsx
// src/pages/UserProfile.tsx
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { requireAuth } from '@/router/loaders/shared';

// 로컬 loader (이 페이지만의 로직)
async function loadUserData({ params }: LoaderFunctionArgs) {
  const [profile, posts] = await Promise.all([
    fetchUser(params.userId!),
    fetchPosts(params.userId!)
  ]);
  return { profile, posts };
}

// export: 공용 + 로컬 조합
export async function loader(args: LoaderFunctionArgs) {
  const auth = await requireAuth(args);    // 공용 (재사용)
  const data = await loadUserData(args);   // 로컬 (페이지 전용)
  return { ...auth, ...data };
}

export type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function UserProfile() {
  const { user, profile, posts } = useLoaderData() as LoaderData;
  return <div>{profile.name}</div>;
}
```

### 프로젝트 구조 권장안

**소규모 (라우트 < 10개):**
```
src/router.tsx  # 단일 파일
```

**중규모 (라우트 10~30개) - 추천:**
```
src/router/
├── index.tsx              # router export
├── routes/
│   ├── publicRoutes.tsx
│   └── privateRoutes.tsx
├── loaders/
│   ├── shared/
│   │   └── authLoader.ts
│   └── compose.ts
└── guards/
    └── ProtectedRoute.tsx
```

**대규모 (라우트 30개+):**
```
src/router/
├── index.tsx
├── routes/
│   ├── index.tsx
│   ├── auth.routes.tsx
│   ├── dashboard.routes.tsx
│   └── admin.routes.tsx
├── loaders/
│   ├── shared/
│   └── ...
└── guards/
    └── ...
```

### 베스트 프랙티스 우선순위

**🥇 1순위: loader + Layout Route (공식 권장)**
```tsx
{
  path: '/dashboard',
  loader: requireAuth,  // 인증 체크
  element: <Dashboard />
}
```

**🥈 2순위: Layout Route만 (간단한 경우)**
```tsx
{
  element: <ProtectedLayout />,  // 레이아웃에서 체크
  children: [...]
}
```

**🥉 3순위: ProtectedRoute 컴포넌트 (레거시)**
```tsx
{
  path: '/dashboard',
  element: <ProtectedRoute><Dashboard /></ProtectedRoute>
}
```

---

## 7. 타입 안정성

### 문제: useLoaderData는 기본적으로 unknown 타입

```tsx
function UserProfile() {
  const data = useLoaderData(); // 타입: unknown
  // data.user // 에러!
}
```

### 해결책 1: 타입 단언

```tsx
import { userLoader, UserLoaderData } from '@/router/loaders/userLoader';

function UserProfile() {
  const { user, posts } = useLoaderData() as UserLoaderData;
  // ✅ 타입 안전, 자동완성 동작
}
```

### 해결책 2: 커스텀 훅

```tsx
// src/hooks/useTypedLoaderData.ts
import { useLoaderData } from 'react-router-dom';

export function useTypedLoaderData<T>() {
  return useLoaderData() as T;
}

// 사용
function UserProfile() {
  const { user } = useTypedLoaderData<UserLoaderData>();
}
```

### Loader와 타입 정의 패턴

```tsx
// loader 함수와 타입을 함께 export
export async function userLoader({ params }: LoaderFunctionArgs) {
  const user = await fetchUser(params.userId!);
  return { user };
}

export type UserLoaderData = Awaited<ReturnType<typeof userLoader>>;
```

---

## 8. 공통 질문과 답변

### Q1: params와 query를 컴포넌트에서 사용하지 않나요?

**A:** Loader를 사용하면 **loader에서 중앙 관리**합니다.

```tsx
// ✅ 권장: loader에서 처리
export async function loader({ params, request }: LoaderFunctionArgs) {
  const userId = params.userId;
  const url = new URL(request.url);
  const tab = url.searchParams.get('tab');

  return { userId, tab, data: await fetchData(userId, tab) };
}

// ❌ 비권장: 컴포넌트에서 직접 처리
function Component() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  // ...
}
```

하지만 **필요하면 여전히 컴포넌트에서 사용 가능**합니다.

### Q2: loader 사용 시 복잡도가 증가하지 않나요?

**A:** 초기에는 학습 곡선이 있지만, **장기적으로는 복잡도가 감소**합니다.

**Before (복잡):**
```
Component = UI + 데이터 로딩 + params 처리 + query 처리 + 상태 관리
```

**After (단순):**
```
Loader = 데이터 로딩 + params 처리 + query 처리
Component = UI만
```

### Q3: router 파일 확장자는 `.ts`인가요 `.tsx`인가요?

**A:** **`.tsx`입니다.** 라우트 설정에서 JSX를 사용하기 때문입니다.

```tsx
// router.tsx - JSX 사용으로 .tsx 필요
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />  // ← JSX 사용!
  }
]);
```

### Q4: RouterProvider는 여러 개 사용할 수 있나요?

**A:** 아니요, **하나만 사용**합니다.

```tsx
// ✅ 올바름
const router = createBrowserRouter([
  ...publicRoutes,
  ...privateRoutes
]);

<RouterProvider router={router} />

// ❌ 잘못됨
<RouterProvider router={router1} />
<RouterProvider router={router2} />
```

### Q5: loader를 컴포넌트 파일에 두는 게 맞나요?

**A:** 의견이 나뉩니다.

**Remix 팀 권장 (같은 파일):**
```tsx
// pages/UserProfile.tsx
export async function loader() { ... }
export default function UserProfile() { ... }
```

**실무 추천 (하이브리드):**
```
- 공용 loader: router/loaders/shared/
- 페이지별 loader: 컴포넌트 파일 또는 같은 폴더
```

### Q6: loader와 React Query를 함께 사용할 수 있나요?

**A:** 네, **조합 가능**합니다.

```tsx
// loader에서 React Query 캐시 프리로드
export async function loader({ params }: LoaderFunctionArgs) {
  await queryClient.prefetchQuery({
    queryKey: ['user', params.userId],
    queryFn: () => fetchUser(params.userId)
  });
  return null;
}

// 컴포넌트에서 React Query 사용
function UserProfile() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id)
  });
  // 캐시에 이미 있어서 즉시 표시
}
```

### Q7: loader에서 undefined 타입이 포함되어 불편합니다.

**A:** **런타임 검증**으로 해결합니다.

```tsx
export async function loader({ params }: LoaderFunctionArgs) {
  // 타입: string | undefined
  if (!params.userId) {
    throw new Response('User ID required', { status: 400 });
  }

  // 이제 타입 안전
  const user = await fetchUser(params.userId); // string
  return { user };
}
```

---

## 요약: React Router 학습 로드맵

### 1단계: 기본 라우팅
```tsx
// 컴포넌트 방식으로 시작
<Routes>
  <Route path="/" element={<Home />} />
</Routes>
```

### 2단계: 객체 방식 전환
```tsx
// createBrowserRouter 사용
const router = createBrowserRouter([
  { path: '/', element: <Home /> }
]);
```

### 3단계: Loader 도입
```tsx
{
  path: '/user/:id',
  loader: async ({ params }) => {
    return { user: await fetchUser(params.id) };
  },
  element: <UserProfile />
}
```

### 4단계: 인증 가드
```tsx
// 공용 loader 생성
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw redirect('/login');
  return { user };
}
```

### 5단계: 프로젝트 구조화
```
router/
├── index.tsx
├── routes/
├── loaders/shared/
└── guards/
```

---

## 참고 자료

- [React Router 공식 문서](https://reactrouter.com)
- [Remix 튜토리얼](https://remix.run/docs)
- [React Router Data APIs](https://reactrouter.com/en/main/route/loader)

---

**작성일:** 2025-12-31
**대상:** 주니어 개발자
**React Router 버전:** v6.4+
