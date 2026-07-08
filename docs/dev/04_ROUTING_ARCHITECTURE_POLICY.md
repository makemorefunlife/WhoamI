# 라우팅 아키텍처 정책 (2026-07-08)

## 1) 설계 원칙

- URL 상수는 `constants/routes.ts`에서 중앙 관리한다.
- **인증**: `proxy.ts`(Clerk) + 계정 라우트에서만 수행. 페이지별 중복 인증 가드 금지.
- **허브 진입**: `resolveEntryDestination()` / `hubRouteForIntent()` — 로그인 사용자는 decision/relationships/blueprint **프리패스**(선행조건 대기 없음).
- **세션 SSOT**: `loadReportSession()` — 홈 초기 로드 및 백그라운드 갱신. `isPremium` 포함.
- **프리미엄 인가**: `PremiumGuard` 컴포넌트로 프리미엄 페이지만 감싼다 (결제 연동 후).
- 전역 미들웨어는 인증 여부만 가볍게 처리하고, DB 조회는 페이지/API 레벨에서 처리한다.

## 2) 핵심 컴포넌트/유틸

- 경로 상수: `constants/routes.ts`
- 진입 판정: `lib/routing/resolveEntryDestination.ts`, `lib/routing/hubRoutes.ts`
- 앱 세션 훅: `lib/routing/useAppSession.ts`
- 프리미엄 가드: `components/routing/PremiumGuard.tsx`
- 세션 캐시: `lib/home/reportSession.ts` (`getCachedSession`, `isPremium`)
- 허브 경로 빌더: `lib/stitch/hubPaths.ts`
- 전역 인증 미들웨어(Next16 proxy): `proxy.ts`

## 3) 리다이렉트 안전 규칙

- 허브 탭은 **페이지 전체를 막지 않는다**. 데이터는 섹션별 로딩 UI.
- 설문/출생 미완료 시에도 허브 UI는 즉시 표시하고, 필요한 액션만 인라인 안내.
- 내부 이동은 `router.push/replace`를 우선 사용한다.

## 4) Account IA 정책

- `/account`는 진입 alias이며 `/account/profile`로 즉시 이동한다.
- `/account/profile`: 내 정보 편집
- `/account/billing`: 결제 내역 Placeholder
- 생년월일은 최초 저장 후 잠금, 시간/장소만 수정 가능
