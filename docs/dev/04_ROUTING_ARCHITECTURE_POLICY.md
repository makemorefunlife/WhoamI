# 라우팅 아키텍처 정책 (2026-07-08)

## 1) 설계 원칙

- URL 상수는 `constants/routes.ts`에서 중앙 관리한다.
- 진입 라우팅 판정은 `resolveEntryDestination()` 한 곳에서 수행한다.
- 데이터 로딩 중(`isLoading`)에는 리다이렉트하지 않고 `RouteGuard` 로딩 UI를 노출한다.
- 전역 미들웨어는 인증 여부만 가볍게 처리하고, DB 조회는 페이지/API 레벨에서 처리한다.

## 2) 핵심 컴포넌트/유틸

- 경로 상수: `constants/routes.ts`
- 진입 판정: `lib/routing/resolveEntryDestination.ts`
- 로딩 가드: `components/routing/RouteGuard.tsx`
- 허브 경로 빌더: `lib/stitch/hubPaths.ts`
- 전역 인증 미들웨어(Next16 proxy): `proxy.ts`

## 3) 리다이렉트 안전 규칙

- `reportId`/`viewer` 누락 시 안전한 이전 단계로 복구 이동:
  - Blueprint 계열 → `/` 또는 `/survey-v2?reportId=...`
  - 관계 상세 → `/relationships`
- 내부 이동은 `router.push/replace`를 우선 사용한다.
- `window.location.href`는 외부 스킴(`sms:` 등)에서만 허용한다.

## 4) Account IA 정책

- `/account`는 진입 alias이며 `/account/profile`로 즉시 이동한다.
- `/account/profile`: 내 정보 편집
- `/account/billing`: 결제 내역 Placeholder
- 생년월일은 최초 저장 후 잠금, 시간/장소만 수정 가능

