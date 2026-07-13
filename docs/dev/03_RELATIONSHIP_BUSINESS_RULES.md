# 관계 분석(Relationship) 비즈니스 로직 & 정책

> **작성일:** 2026-07-08  
> **코드 기준:** `main` @ `267170e`  
> **핵심 파일:** `app/api/relationship/`, `lib/relationship/`, `lib/prompts/relationship*`

---

## 1. 한 줄 요약

| 단계 | 입력 | 엔진 | LLM | 타임아웃 |
|------|------|------|-----|----------|
| **Basic** | 양쪽 v2 설문 패턴 | gpt-4o-mini JSON | 0~1회 | 서버 120초 |
| **Premium** | 양쪽 생년월일 (+ 시간/장소 미상 시 고정 fallback) | kind별 분기 | 연인만 1~2회 | 서버 300초, 클라이언트 300초 |

Basic은 **출생지 없어도** 동작한다. Premium(심화)은 출생지·시간이 비어 있어도 **고정 fallback(12:00, San Francisco, CA)** 으로 계산한다.

---

## 2. 관계 유형 (5종)

정의: `lib/relationship/relationshipKind.ts`

| kind | 한글 라벨 | 심화 엔진 | LLM 호출 |
|------|-----------|-----------|----------|
| `romantic` | 연인 | `romanticSajuDeep` (OpenAI) | **1~2회** |
| `work` | 동료 | `buildWorkColleagueReport` (규칙) | **0회** |
| `cohabitation` | 동거·결혼 | `buildMarriageReport` (규칙) | **0회** |
| `friendship` | 친구 | `buildFriendReport` (규칙) | **0회** |
| `family` | 가족 | `buildFamilyParentReport` (규칙) | **0회** |

- 기본 fallback: `friendship` (`parseRelationshipKind`)
- **5종 모두 deep 파이프라인** 사용 (`relationshipKindUsesDeepPipeline()` → 항상 true)
- 레거시 LLM 4축 premium 프롬프트는 코드에 남아 있으나 **현재 unreachable**

### 2.1 유형별 추가 규칙

**연인 (`romantic`)**
- 유일하게 OpenAI LLM 심화
- self-refine 기본 **OFF** → `RELATIONSHIP_ROMANTIC_SELF_REFINE=true`일 때만 2차 LLM 호출
- 모델: `RELATIONSHIP_ROMANTIC_MODEL` ?? `gpt-4o-mini`
- max tokens: `RELATIONSHIP_ROMANTIC_MAX_TOKENS` ?? **16384**
- 완료 판정: `section_1_summary` 존재

**동료 (`work`)**
- 월지·천간·십신 규칙 엔진만
- 완료 판정: `snapshot_panel` 존재

**동거·결혼 (`cohabitation`)**
- 일주·시주·가정궁 규칙
- 완료 판정: `snapshot_panel` 존재

**가족 (`family`)**
- 추가 URL/API 파라미터:
  - `parent_type`: `"father"` | `"mother"` (기본 mother)
  - `child_is_viewer`: 시청자가 자녀인지
- 역할 매핑: `lib/relationship/familyParent/resolveFamilyRoles.ts`
- 완료 판정: `family.section_child_dna` 존재

**친구 (`friendship`)**
- dev/preview에서 basic 완료 후 **자동 심화 미리보기** 1회 (`premiumPreview` 플래그)
- 완료 판정: `friend.section_social_dna_a` 존재

---

## 3. Basic vs Premium 정책

### 3.1 Basic (무료 4축)

**API:** `POST /api/relationship/analyze/basic`

| 항목 | 규칙 |
|------|------|
| 입력 | 양쪽 v2 설문 패턴 요약만 |
| 출생 정보 | **불필요** (birth_date, birth_place 없어도 OK) |
| 출력 | 두 시점 × 4축 JSON |
| 축 이름 | `emotional_sensitivity`, `communication_style`, `conflict_response`, `energy_pattern` |
| LLM | gpt-4o-mini, temperature 0.55, max_tokens 4096, JSON mode |
| LLM 호출 | 캐시 미스 시 **1회**, 히트 시 **0회** |
| 서버 타임아웃 | **120초** (`maxDuration = 120`) |
| DB 초기값 | 새 관계 행 `analysis_type: "basic"` |
| 자동 실행 | 상세 페이지 로드 후 basic 없으면 `ensureBasic()` 자동 호출 |
| 캐시 | `result_basic`에 저장, 완전한 perspectives 있으면 재생성 생략 |

### 3.2 Premium (심화)

**API:** `POST /api/relationship/analyze/premium`

| 항목 | 규칙 |
|------|------|
| 업그레이드 게이트 | `analysis_type !== "premium"` → **403** |
| 403 메시지 | `"심화 분석은 결제·업그레이드 후에 실행할 수 있습니다."` |
| 업그레이드 API | `POST /api/relationship/upgrade` → `analysis_type → "premium"` |
| Preview 모드 | `body.preview === true` + `relationshipPremiumPreviewEnabled()` |
| Preview 활성 조건 | `NEXT_PUBLIC_RELATIONSHIP_PREMIUM_PREVIEW=true` 또는 **dev 환경 기본 true** |
| 캐시 | `result_premium_by_kind[kind]` — kind별 저장 |
| 강제 재생성 | `force_regenerate: true` 시 캐시 무시 |
| 서버 타임아웃 | **300초** |
| 클라이언트 타임아웃 | **300,000ms (5분)** — premium·upgrade fetch |
| Abort 시 UI | `"요청 시간이 길어져 중단됐어요. 다시 시도해 주세요."` |

---

## 4. 출생 정보 요건 (핵심 정책)

### 4.1 단계별 비교

| 단계 | birth_date | birth_time | birth_place |
|------|:----------:|:----------:|:-----------:|
| Blueprint (개인) | ✅ 최소 | ❌ (모름 → 12:00) | ❌ (모름 → 근사값) |
| 관계 **Basic** | ❌ | ❌ | ❌ |
| 관계 **Premium** (5종) | ✅ 양쪽 | ❌ (모름 → 12:00 fallback) | ❌ (모름 → San Francisco, CA fallback) |

### 4.2 Premium 출생 검증

검증 함수: `app/api/relationship/analyze/premium/route.ts`

- `birthOkRomantic`: `birth_date`만 확인 (시간·장소는 fallback 처리)
- 시간 모름: `birth_time` null 허용 → 사주 계산 시 **12:00** 사용
- 장소 모름: `birth_place` 비었으면 **San Francisco, CA**를 기본값으로 사용

**kind별 400 에러 메시지 (공통 패턴):**
> 「양쪽 모두 생년월일이 있어야 {kind 라벨} 심화 분석을 할 수 있습니다.」

### 4.3 수동 친구 입력과의 괴리 (자주 겪는 이슈)

| 단계 | 출생지 정책 |
|------|------------|
| `POST /api/relationship/manual` | 출생지 입력 **또는** `birthPlaceUnknown: true` 허용 |
| 이후 Premium | unknown이면 `San Francisco, CA` fallback으로 계산 (더 이상 400 거절 아님) |

→ UI 힌트: `"출생 정보가 부족하면 심화 분석이 제한될 수 있어요."` (preview 모드)

### 4.4 사주 계산 실패

kind별 400:
> `사주 계산에 실패해 {kind} 심화 분석을 할 수 없습니다.`

---

## 5. LLM 호출 수 상세

| 경로 | LLM | 비고 |
|------|-----|------|
| Basic (캐시 미스) | 1회 | gpt-4o-mini |
| Basic (캐시 히트) | 0회 | DB 반환 |
| Premium romantic | 1~2회 | self-refine ON 시 2회 |
| Premium work/cohabitation/family/friendship | 0회 | deterministic 규칙 |
| Upgrade / detail / logs | 0회 | DB only |

**연인 심화 프롬프트:** `lib/prompts/relationshipPremium/romanticSajuDeep/*`

---

## 6. Autostart 정책

### 6.1 URL 규칙

허브에서 분석 시작 시 기본 URL (`lib/relationship/hubNavigation.ts`):

```
/relationship/{rrId}?viewer={myReportId}&kind={kind}&autostart=1
```

가족 추가: `childIsViewer`, `parentType`

### 6.2 실행 순서 (`useRelationshipDetail.ts`)

```
1. detail 로드
2. basic 없음 → ensureBasic() 자동
3. autostart=1 이고 premiumReady 아님 → runAutostartPremium()
   ├─ analysis_type === "premium" → runPremium(kind)
   ├─ premiumPreview → ensurePremiumPreview() (upgrade preview + runPremium)
   └─ 그 외 → runPremium (비-premium이면 403)
4. UI: autostart 중 기본 카드 숨김, 생성 패널 표시
5. 완료 후 리포트 앵커로 스크롤
```

### 6.3 Friendship 자동 미리보기 (autostart와 별개)

조건: `premiumPreview` + basic 완료 + kind=friendship + 심화 없음  
→ `ensurePremiumPreview()` 1회 자동 실행

---

## 7. 친구 추가 플로우

### 7.1 초대 링크

| 단계 | API / 동작 |
|------|-----------|
| 생성 | `POST /api/invite/create` — `invite_type: "relationship"`, `status: "open"` |
| 공유 URL | `{origin}/invite?token=...` |
| 수락자 | `/invite` → `localStorage.inviteToken` → `/?token=` |
| 수락자 온보딩 | `report_type: "relationship"`, `plan_type: "paid"` |
| 완료 | `POST /api/invite/complete` → `relationship_reports` 생성·연결 |
| 대기 UI | `status: "open"` → 허브 `outbound_waiting`, **22초 폴링** |
| 분석 불가 | `relationship_report_id` 없으면 `"수락 대기 중인 친구는 분석을 시작할 수 없어요."` |

**제품 카피:** 초대 링크 48시간 유효, 수락 시 분석권 1회 차감 (`AddFriendSheet.tsx`)

### 7.2 직접 입력 (Manual)

**API:** `POST /api/relationship/manual`

| 항목 | 규칙 |
|------|------|
| 로그인 | **필수** — 401: `"친구 추가는 로그인(회원가입) 후 이용할 수 있어요."` |
| 필수 필드 | `reportIdA`, `partnerName`, `birthDate` |
| 출생지 | 입력 또는 `birthPlaceUnknown` |
| 설문 | 10문항 전체 **또는** `surveySkipped: true` (중립 프로필) |
| 상대 리포트 | `report_type: "partner_manual"`, `plan_type: "free"` |
| 삭제 | `partner_manual`만 — `"직접 입력한 친구만 여기서 삭제할 수 있어요."` |

---

## 8. 권한·접근 제어

| 조건 | 결과 |
|------|------|
| `viewerReportId`가 A/B 참여자가 아님 | 403 `"권한 없음"` |
| 상세 페이지 `viewer` 쿼리 없음 | `"viewer 쿼리(내 리포트 id)가 필요합니다."` |
| 관계 허브 401 | Clerk `openSignIn` → `/relationships?myReportId=` 복귀 |

---

## 9. 에러 메시지 카탈로그

### 9.1 Basic API

| HTTP | 메시지 |
|------|--------|
| 400 | `relationship_report_id가 필요합니다.` |
| 404 | `관계 분석을 찾을 수 없습니다.` |
| 400 | `{이름} 쪽/양쪽 설문 데이터를 찾지 못했어요...` |
| 502 | `LLM 응답 형식이 올바르지 않습니다.` |
| 502 | `LLM이 두 사람 시점 데이터를 만들지 못했습니다.` |
| 500 | `관계 기본 분석 실패` |

### 9.2 Premium API

| HTTP | 메시지 |
|------|--------|
| 403 | `심화 분석은 결제·업그레이드 후에 실행할 수 있습니다.` |
| 400 | kind별 「양쪽 모두 생년월일…」 |
| 400 | kind별 `사주 계산에 실패해 … 심화 분석을 할 수 없습니다.` |
| 502 | Basic과 동일 LLM 형식 오류 |
| 500 | `관계 심화 분석 실패` |

### 9.3 클라이언트 UI

| 상황 | 메시지 |
|------|--------|
| Basic 실패 | `기본 분석 실패` |
| Premium 실패 | `심화 분석 실패` |
| 네트워크 | `네트워크 문제로 심화 분석에 실패했어요.` |
| 타임아웃 | `요청 시간이 길어져 중단됐어요. 다시 시도해 주세요.` |
| 미완료 응답 | `생성 요청이 완료되지 않았어요. 잠시 후 다시 시도해 주세요.` |
| 출생 부족 (preview) | `출생 정보가 부족하면 심화 분석이 제한될 수 있어요.` |
| 재생성 confirm | `기존 {라벨} 심화 분석을 새 프롬프트로 다시 만들까요? (1~2분...)` |
| 생성 중 안내 | `"보통 1~2분 걸려요"` (`RelationshipPremiumSection.tsx`) |

---

## 10. 캐시·재생성·스테일 데이터

| 규칙 | 설명 |
|------|------|
| kind별 저장 | `result_premium_by_kind[kind]` — romantic/work 등 독립 캐시 |
| 구형 포맷 감지 | 클라이언트가 legacy perspectives 감지 시 `forceRegenerate: true` 자동 재시도 |
| 수동 재생성 | `regeneratePremium()` — confirm 후 `forceRegenerate: true` |
| 이력 보존 | 재생성 전 결과는 `relationship_analysis_logs`에 스냅샷 저장 |

---

## 11. 관계 허브 성능 정책

| 항목 | 규칙 |
|------|------|
| 세션 hydrate | `loadReportSession({ hydrate: false })` — resume 중복 방지 |
| resume 캐시 | 60초 TTL (`reportSession.ts`) |
| 폴링 | `outbound_waiting` 초대가 있을 때만 **22초** 간격 |
| 목록 API | `relationship/list` 병렬·batch 쿼리 |

---

## 12. 개발·디버깅 시 자주 틀리는 점

| 증상 | 원인 | 확인 위치 |
|------|------|-----------|
| 심화가 바로 403 | `analysis_type`이 아직 `basic` | `/api/relationship/upgrade` 또는 preview |
| 동료 심화 400 | 상대 `birth_place` null | `reports` 테이블, manual 입력 시 unknown |
| 연인 심화 타임아웃 | LLM 2회 + 긴 토큰 | 클라이언트 300초, 서버 300초 |
| basic은 되는데 premium만 실패 | 보통 생년월일 누락 | §4.1 표 참고 |
| autostart 후 아무 일 없음 | basic 미완료 또는 이미 premiumReady | Network: basic → premium 순서 |
| 수락 대기 친구 분석 불가 | `relationship_report_id` 미연결 | invite complete API |

---

## 13. 핵심 파일 맵

| 역할 | 경로 |
|------|------|
| Basic API | `app/api/relationship/analyze/basic/route.ts` |
| Premium API | `app/api/relationship/analyze/premium/route.ts` |
| Upgrade | `app/api/relationship/upgrade/route.ts` |
| Manual 친구 | `app/api/relationship/manual/route.ts` |
| Basic 프롬프트 | `lib/prompts/relationshipAnalysis.ts` |
| 연인 LLM | `lib/prompts/relationshipPremium/romanticSajuDeep/` |
| 규칙 심화 (4종) | `workColleague/`, `cohabitation/`, `familyParentChild/`, `friendSocial/` |
| 상세 훅 | `app/relationship/[id]/useRelationshipDetail.ts` |
| 상세 UI | `app/relationship/[id]/RelationshipView.tsx` |
| kind SSOT | `lib/relationship/relationshipKind.ts` |
| kind별 캐시 | `lib/relationship/premiumByKind.ts` |
| 허브 네비 | `lib/relationship/hubNavigation.ts` |
| 허브 UI | `components/relationship/hub/RelationHubDashboard.tsx` |
| Preview 플래그 | `lib/relationship/premiumPreview.ts` |

---

*갱신 시: API 게이트·타임아웃·kind 추가 시 §3~§5를 우선 업데이트할 것.*

---

## 14. 미국 타겟 Unknown Fallback 정책 (2026-07-08)

관계 분석은 출생 정보가 일부 비어 있더라도 아래 고정값으로 계산을 계속 진행한다.

- 시간 모름(`birth_time` null / unknown): `12:00`
- 장소 모름(`birth_place` null / unknown): `San Francisco, CA`
- 기본 좌표/시간대: `37.7749`, `-122.4194`, `UTC-8`

### 14.1 적용 범위

- 개인 Blueprint 계산
- 관계 Premium 심화(romantic/work/cohabitation/family/friendship)

### 14.2 사용자 안내 배너

Blueprint / 관계 결과 상단 공통 배너:

> 💡 정확한 출생 시간과 장소가 입력되지 않아, 임의로 낮 12시 및 샌프란시스코(CA)를 기준으로 계산했습니다. 실제 결과와 약간의 오차가 있을 수 있습니다.

문구 상수: `UNKNOWN_BIRTH_NOTICE_KO` (`lib/v2/onboarding/birthFallbackPolicy.ts`)
