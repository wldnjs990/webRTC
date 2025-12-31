# TypeScript Path Alias 설정 완벽 가이드

> Vite + React + TypeScript 프로젝트에서 `@/` alias를 설정하는 방법

## 목차
1. [Path Alias란?](#path-alias란)
2. [필요한 패키지 설치](#필요한-패키지-설치)
3. [TypeScript 설정](#typescript-설정)
4. [VSCode 설정](#vscode-설정)
5. [동작 원리](#동작-원리)
6. [트러블슈팅](#트러블슈팅)

---

## Path Alias란?

### 문제 상황
```tsx
// 상대 경로 - 깊이가 깊어질수록 복잡해짐
import HomePage from '../../../../pages/HomePage'
import Button from '../../../components/Button'
```

### 해결책
```tsx
// 절대 경로 (Alias) - 항상 명확하고 간단함
import HomePage from '@/pages/HomePage'
import Button from '@/components/Button'
```

### 장점
- ✅ 파일 위치가 바뀌어도 import 경로 수정이 간단
- ✅ 가독성 향상
- ✅ 오타 및 경로 실수 감소
- ✅ 리팩토링 시 유지보수 용이

---

## 필요한 패키지 설치

### vite-tsconfig-paths 설치

```bash
npm install -D vite-tsconfig-paths
# 또는
pnpm add -D vite-tsconfig-paths
# 또는
yarn add -D vite-tsconfig-paths
```

**역할**: Vite가 TypeScript의 `paths` 설정을 읽어서 빌드 시 경로를 해석

---

## TypeScript 설정

### 1. 프로젝트 구조 이해

Vite + React 프로젝트는 보통 3개의 tsconfig 파일을 사용합니다:

```
프로젝트/
├── tsconfig.json          # 메인 설정 (참조 관리자)
├── tsconfig.app.json      # 브라우저 코드 (React 앱)
└── tsconfig.node.json     # Node.js 코드 (빌드 설정)
```

#### 각 파일의 역할

| 파일 | 역할 | 컴파일 대상 | 환경 |
|------|------|------------|------|
| `tsconfig.json` | 다른 tsconfig를 참조하는 오케스트레이터 | 없음 | - |
| `tsconfig.app.json` | React 앱의 TypeScript 설정 | `src/**` | 브라우저 |
| `tsconfig.node.json` | 빌드 도구의 TypeScript 설정 | `vite.config.ts` 등 | Node.js |

### 2. tsconfig.json 설정

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"],
      "@pages/*": ["./src/pages/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@types/*": ["./src/types/*"]
    }
  }
}
```

**포인트**:
- `baseUrl`: 경로 해석의 기준점
- `paths`: alias 매핑 정의
- VSCode 에디터가 이 설정을 참조하여 자동완성 제공

### 3. tsconfig.app.json 설정

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Path Mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"],
      "@pages/*": ["./src/pages/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@types/*": ["./src/types/*"]
    },

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

**중요**:
- `tsconfig.json`과 `tsconfig.app.json` **둘 다** `paths` 설정 필요
- `tsconfig.app.json`이 실제로 `src/**` 파일들을 컴파일하기 때문

### 4. tsconfig.node.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

**포인트**:
- `vite.config.ts`만 컴파일하므로 `paths` 설정 불필요
- `vite.config.ts`에서는 `src/` 내부를 import하지 않음

### 5. vite.config.ts 설정

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths() // ⭐ 이 플러그인이 tsconfig의 paths를 읽음
  ]
})
```

**역할**:
- `vite-tsconfig-paths`가 `tsconfig.app.json`의 `paths` 읽기
- 빌드 시 `@/` → `./src/`로 경로 변환

---

## VSCode 설정

### 1. .vscode/settings.json 생성

프로젝트 루트에 `.vscode/settings.json` 파일을 생성합니다:

```json
{
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "javascript.preferences.importModuleSpecifier": "non-relative"
}
```

**효과**:
- 자동 import 시 상대 경로(`../../`) 대신 절대 경로(`@/`) 우선 사용
- IntelliSense 자동완성이 alias 경로로 제안

### 2. TypeScript 서버 재시작

설정을 변경한 후 반드시 TypeScript 서버를 재시작해야 합니다:

1. **VSCode 명령 팔레트 열기**
   - Mac: `Cmd + Shift + P`
   - Windows/Linux: `Ctrl + Shift + P`

2. **명령 실행**
   ```
   TypeScript: Restart TS Server
   ```

3. **VSCode 재로드** (선택사항)
   ```
   Developer: Reload Window
   ```

---

## 동작 원리

### 전체 흐름도

```
코드 작성
    ↓
VSCode (에디터)
    ↓
tsconfig.json의 paths 읽기
    ↓
자동완성: @/components/Button 제안
    ↓
────────────────────────────────
    ↓
빌드 (npm run build)
    ↓
TypeScript 컴파일
    ↓
tsconfig.app.json의 paths로 타입 체크
    ↓
Vite 빌드
    ↓
vite-tsconfig-paths 플러그인
    ↓
@/ → ./src/로 경로 변환
    ↓
번들링 완료
```

### 각 단계 설명

#### 1. 개발 중 (VSCode)
```tsx
// 입력: @/com 까지 타이핑
// VSCode가 tsconfig.json의 paths 참조
// 자동완성: @/components/Button 제안
import Button from '@/components/Button'
```

#### 2. 타입 체크 (TypeScript)
```bash
# tsc --noEmit
# tsconfig.app.json의 paths로 타입 해석
@/components/Button → ./src/components/Button.tsx
```

#### 3. 빌드 (Vite)
```bash
# vite build
# vite-tsconfig-paths가 경로 변환
@/components/Button → ./src/components/Button.tsx
# 최종 번들에는 실제 경로로 포함됨
```

---

## 사용 예시

### Before (상대 경로)

```tsx
// src/features/user/components/UserProfile.tsx
import { formatDate } from '../../../utils/dateFormatter'
import { Button } from '../../../components/Button'
import { useAuth } from '../../../hooks/useAuth'
import type { User } from '../../../types/user'
```

### After (절대 경로)

```tsx
// src/features/user/components/UserProfile.tsx
import { formatDate } from '@/utils/dateFormatter'
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types/user'

// 또는 세분화된 alias 사용
import { Button } from '@components/Button'
import { useAuth } from '@hooks/useAuth'
import type { User } from '@types/user'
```

---

## 트러블슈팅

### 1. 자동완성이 여전히 상대 경로로 나옴

**원인**: VSCode가 새 설정을 아직 인식하지 못함

**해결책**:
```
1. Cmd + Shift + P (Mac) 또는 Ctrl + Shift + P (Windows/Linux)
2. "TypeScript: Restart TS Server" 실행
3. 안 되면 "Developer: Reload Window"도 실행
```

### 2. 빌드는 성공하는데 에디터에서 빨간 줄이 표시됨

**원인**: tsconfig.json에만 paths가 있고 tsconfig.app.json에 없음

**해결책**:
```json
// tsconfig.app.json에도 paths 추가
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. 빌드 시 경로를 찾지 못함

**원인**: vite-tsconfig-paths 플러그인 미설치 또는 미적용

**해결책**:
```bash
# 플러그인 설치
pnpm add -D vite-tsconfig-paths

# vite.config.ts에 추가
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()]
})
```

### 4. Jest/Vitest에서 alias 인식 못 함

**원인**: 테스트 환경에서도 경로 매핑 필요

**해결책 (Vitest)**:
```typescript
// vite.config.ts
export default defineConfig({
  test: {
    // vite-tsconfig-paths가 자동으로 처리해줌
  },
  plugins: [react(), tsconfigPaths()]
})
```

**해결책 (Jest)**:
```javascript
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
  }
}
```

### 5. ESLint에서 import 경로 오류

**원인**: ESLint가 TypeScript paths를 해석하지 못함

**해결책**:
```bash
# eslint-import-resolver-typescript 설치
pnpm add -D eslint-import-resolver-typescript
```

```javascript
// eslint.config.js 또는 .eslintrc.js
module.exports = {
  settings: {
    'import/resolver': {
      typescript: {} // tsconfig.json의 paths 자동 로드
    }
  }
}
```

---

## 체크리스트

설정 완료 후 다음을 확인하세요:

- [ ] `vite-tsconfig-paths` 패키지 설치됨
- [ ] `vite.config.ts`에 `tsconfigPaths()` 플러그인 추가됨
- [ ] `tsconfig.json`에 `baseUrl`과 `paths` 설정됨
- [ ] `tsconfig.app.json`에도 `baseUrl`과 `paths` 설정됨
- [ ] `.vscode/settings.json`에 import 설정 추가됨
- [ ] TypeScript 서버 재시작함
- [ ] 새 import 작성 시 `@/`로 자동완성됨
- [ ] `npm run build` 성공함
- [ ] 에디터에서 타입 오류 없음

---

## 추천 Alias 구성

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      // 기본 - 모든 src 하위 접근
      "@/*": ["./src/*"],

      // 세분화 - 자주 쓰는 폴더별 단축키
      "@components/*": ["./src/components/*"],
      "@pages/*": ["./src/pages/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"],
      "@styles/*": ["./src/styles/*"],
      "@assets/*": ["./src/assets/*"],
      "@api/*": ["./src/api/*"],
      "@store/*": ["./src/store/*"],
      "@contexts/*": ["./src/contexts/*"]
    }
  }
}
```

**팁**:
- `@/`만 써도 충분하지만, 자주 쓰는 폴더는 세분화하면 더 짧게 쓸 수 있음
- 너무 많이 만들면 오히려 혼란스러울 수 있으니 필요한 것만 추가

---

## 참고 자료

- [Vite 공식 문서 - vite-tsconfig-paths](https://github.com/aleclarson/vite-tsconfig-paths)
- [TypeScript 공식 문서 - Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [TypeScript 공식 문서 - Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

**작성일**: 2025-12-31
**환경**: Vite 6 + React 19 + TypeScript 5
