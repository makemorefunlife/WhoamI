# 후속 작업 TODO (디자인·분석 대비)

> 2026-07-08 — 라우팅/가드 뼈대 이후, 입히기 전에 기억해 둘 포인트만 적는다.  
> 일상 NOW는 `00_Status.md`를 본다. 여기는 **나중 전용** 메모.

---

## 1) 유저 경험을 위한 에러 페이지 (Error Boundary) 적용 계획

### 목표
예상치 못한 렌더/청크/API 실패에서도 **흰 화면·전체 프리즈 없이**, 친절한 복구 화면을 보여 준다.

### 제안 구조 (Next App Router)

| 레이어 | 파일 후보 | 역할 |
|--------|-----------|------|
| 전역 | `app/error.tsx` | 루트 세그먼트 런타임 에러 |
| 전역 | `app/global-error.tsx` | root layout 자체 실패 (최소 UI) |
| 허브별 (선택) | `app/relationships/error.tsx`, `app/decision/error.tsx`, `app/blueprint-preview/error.tsx` | 해당 탭만 리셋 |
| 404 | `app/not-found.tsx` | 없는 경로 |

### UX 원칙
- CTA: **다시 시도** (`reset()`), **홈으로** (`/`), (로그인을 경우) **계정/지원**
- 내부 스택은 유저에게 숨기고, 가능하면 짧은 사용자 메시지 + (개발에서만) 디버그 id
- `PremiumGuard` / 라우팅 프리패스와 충돌하지 않게 — **데이터 fetch 실패는 Boundary보다 섹션 인라인 에러를 우선**, Boundary는 “컴포넌트 폭파”용

### 구현 순서 (권장)
1. `app/error.tsx` + Stitch 톤 카피 (KO → 이후 i18n)
2. `app/not-found.tsx` 정렬
3. 관계/결정/Blueprint 세그먼트 `error.tsx` (필요 시)
4. 주요 `fetch` catch와 메시지 톤 통일

---

## 2) 위도/경도 자동화 — Google Maps API 연동 포인트

### 현재 (의도적 단순화)
- 출생지 모름 / 좌표 없음 → **San Francisco, CA** 고정 (`lib/v2/onboarding/birthFallbackPolicy.ts`)
- 서버 좌표 해석: `lib/report/resolveAstrologyCoordinates.ts`
- 저장: `app/api/report/birth/route.ts` (`birth_latitude` / `birth_longitude` / `birth_timezone`)

### 나중에 꽂을 자리

| 단계 | 위치 | 할 일 |
|------|------|--------|
| A. Places Autocomplete (클라) | `BirthInputForm` / `StitchBirthInputForm` 출생지 입력 | place_id·formatted address 선택 |
| B. Geocoding (서버 권장) | birth POST 직전 또는 `resolveAstrologyCoordinates` | address → lat/lng/timezone; **API 키는 서버만** |
| C. 세션/DB | `birth_place` + coords 함께 저장 | UI는 사람이 읽은 주소, 차트는 coords |
| D. Fallback 유지 | `UNKNOWN_BIRTH_FALLBACK` | 모름·지오코드 실패 시 SF 유지 + 결과 배너 |

### 주의
- 클라이언트 직접 Maps 호출 금지(키 노출) — 서버 프록시 API 권장 (`/api/geo/place` 등)
- 미국 타겟: timezone API 또는 좌표→IANA/오프셋 규칙과 `birth_timezone` 정합
- 기존 “Approximate location” / 브라우저 geolocation 경로는 **재도입하지 말 것** (정책 위반)

---

## 3) 다국어(i18n)를 위한 텍스트 중앙화 전략

### 현재 상태
- UI 카피·배너·에러 문자열이 컴포넌트·docs에 **한글(또는 영문) 하드코딩**
- 이미 구조화 후보: `UNKNOWN_BIRTH_NOTICE_KO` (`birthFallbackPolicy.ts`) — “KO 상수 → 키” 패턴의 씨앗

### 목표 디렉터리 (제안)
```text
lib/i18n/
  keys.ts          # 타입 안전 메시지 키
  locales/en.ts
  locales/ko.ts
  t.ts             # t(key, params?) 
```
또는 Next 관례에 맞게 `messages/en.json` + `messages/ko.json` + `next-intl` / 내장 i18n.

### 우선 옮길 문자열 (골든 셋)
1. Landing / StartChoiceModal (시작하기, 나·관계·결정)
2. 출생 폴백 배너 (`UNKNOWN_BIRTH_NOTICE_*`)
3. PremiumGuard / 결제 유도 카피
4. Account 생년월일 잠금 안내
5. Relation Hub / Decision 공통 empty·loading (“불러오는 중…”, “기록이 없어요”)
6. `app/error.tsx` / not-found 카피

### 규칙
- **새 UI 문구는 컴포넌트에 리터럴 금지** — 키만 참조 (점진 마이그레이션 허용하되, 신규부터 강제)
- 기본 locale: **en** (미국 시장), ko는 보조
- 날짜·숫자: `Intl` / locale 태그로 포맷 (이미 `toLocaleDateString` 쓰는 곳 맞춤)
- LLM 프롬프트 언어는 i18n UI와 **분리** (제품 카피 ≠ 모델 출력 언어)

### 마이그레이션 순서
1. 공통 상수부터 키로 치환 (`birthFallbackPolicy`, `ROUTES`와 무관한 카피만)
2. Stitch 허브 셸(header/footer/dock)
3. Blueprint / 관계 / 결정 본문
4. 서버 `error` JSON 메시지 (가능하면 코드 + 클라 매핑)

---

## 완료 기준 (나중에 “했다”고 할 때)

- [ ] 강제 throw 시에도 복구 CTA 있는 Error UI가 뜬다  
- [ ] 출생지 자동완성 → 서버 geocode → coords 저장 경로가 문서/코드에 연결된다  
- [ ] 신규 화면 문구가 locale 파일에만 존재하고, KO/EN 전환이 한 곳에서 된다  
