# REFACTOR SSOT Audit — 개인 원본·파생 데이터 저장 지도

> **목적:** 다음 리팩터링 세션에서 SSOT(단일 진실 공급원) 설계를 논의하기 위한 **기초 자료**  
> **작성:** 2026-07-13 (코드·대화 기반 전수 조사)  
> **상태:** 조사만 수행 — **코드 변경 없음**  
> **관련 문서:** `02_DATASET_SPECIFICATION.md`, `03_RELATIONSHIP_BUSINESS_RULES.md`, `CORE_MAP.md`

---

## Executive Summary

| 영역 | 설계상 SSOT | 실제 |
|------|-------------|------|
| 출생 정보 | `reports.birth_*` | Blueprint 구간 **localStorage 복제** 병행 |
| 설문·11축 psych | `survey_responses.answers` | `v2_profile`은 **JSON 내부 embed** (별도 컬럼 없음) |
| 사주 raw | (없음 — 매번 계산) | `calculateSajuBundle` 재계산; `saju_charts`는 **write-only dead cache** |
| 점성 raw | (없음) | `report_analyses.astrology`에 **텍스트만** |
| 관계 basic | `relationship_reports.result_basic` | perspective 키 = `report_id` (stale 위험) |
| 관계 premium deep | `relationship_reports.result_premium_by_kind` | kind별 JSON 스냅샷; **표시 시 재파생 다수** |

**핵심 리스크:** 같은 원본을 **여러 경로로 읽고**, 파생값을 **저장과 재계산을 혼용**하며, **viewer-first 보정이 도메인마다 제각각**이다.

---

## 1. 원본 데이터 — 저장 위치 전수

### 1.1 생년월일시·출생지

#### Supabase `reports` (서버 SSOT — 의도)

| 컬럼 | 용도 | 마이그레이션/코드 |
|------|------|-------------------|
| `birth_date` | 생년월일 | base schema |
| `birth_time` | 출생 시각 (null → 12:00 계산) | base schema |
| `birth_place` | 출생지 텍스트 | `20260408120000_add_birth_place_to_reports.sql` |
| `birth_latitude` | 점성 위도 | `20260518150000_reports_birth_coordinates.sql` |
| `birth_longitude` | 점성 경도 | 동일 |
| `birth_timezone` | UTC 오프셋 | 동일 |
| `birth_date_correction_used_at` | 생년월일 1회 수정 사용 시각 | `20260712140000_reports_birth_date_correction.sql` |
| `name` | 표시명 (수동 파트너 등) | base |
| `clerk_user_id` | 계정 귀속 | `20260510225000_add_clerk_user_id_to_reports.sql` |

**읽기 진입점 (대표):**

- `lib/report/fetchReportWithBirthCoords.ts` — 좌표 포함 조회
- `app/api/report/birth/route.ts` — GET/POST SSOT 갱신
- `app/api/relationship/analyze/{basic,premium}/route.ts` — 관계 분석
- `lib/saju/loadSajuBundleFromReport.ts` — 사주 계산 입력

#### 브라우저 localStorage (클라이언트 복제)

| 키 패턴 | 파일 | 내용 |
|---------|------|------|
| `ahaitsme_v2_birth_{reportId}` | `lib/v2/onboarding/birthSession.ts` | `birthDate`, `birthTime`, `birthTimeUnknown`, `birthPlace` |

**병합 정책:** `lib/v2/onboarding/resolveReportBirth.ts`, `lib/v2/blueprint/useBlueprintBundle.ts`  
→ DB 우선, 세션 backfill 가능 (`POST /api/report/birth`).

#### 기타 (출생 파생·비영구)

| 위치 | 내용 | 저장? |
|------|------|-------|
| `/api/astrology` 런타임 | Celestine chart | ❌ |
| `fetchBirthAstrologyText` | 점성 LLM 텍스트 | `report_analyses.astrology` (텍스트만) |
| 관계 premium legacy path | `fetchAstroJson` → brief text | 프롬프트용 일회성 |

#### `reports.birth_*`가 진짜 단일 소스인가?

| 소비 도메인 | SSOT 준수 | 비고 |
|-------------|-----------|------|
| 관계 basic/premium API | ✅ `reports` 직접 | `fetchReportWithBirthCoords` / select |
| Blueprint 무료 | ⚠️ **DB + localStorage** | 게스트·진행 중 이중 |
| Slim V1 심화 | ⚠️ 요청 body + DB | 클라이언트가 birth 넘김 |
| 점성 좌표 | ⚠️ `birth_place` 해석 또는 lat/lng 컬럼 | 없으면 SF 폴백 |

---

### 1.2 설문 응답 (6 primary + 11 secondary psych)

#### Supabase `survey_responses` (서버 SSOT — 유일)

| 컬럼 | 용도 |
|------|------|
| `report_id` | FK → `reports.id` |
| `answers` | JSONB — **원본+점수 embed** |

#### `answers` JSON 내부 구조

| 필드 | 설명 |
|------|------|
| `q1`…`q9` | A–D 응답 |
| `q10` | 1–5 척도 |
| `survey_source` | `"v2_10q"` |
| **`v2_profile`** | `CurrentSelfProfile` 전체 (`primary_axes` 6 + **`secondary_axes` 11**) |
| `survey_skipped` | 수동 파트너 중립 프로필 (`manual/route.ts`) |

**타입 SSOT:** `lib/v2/survey/types.ts` (`SECONDARY_AXIS_KEYS` = 11축 psych)

#### `reports.v2_profile` 컬럼?

**없음.** 코드·마이그레이션에 `reports.v2_profile` 컬럼 정의 없음.  
설문 프로필은 **오직** `survey_responses.answers.v2_profile`.

#### 브라우저 localStorage (클라이언트 복제)

| 키 패턴 | 파일 | 내용 |
|---------|------|------|
| `ahaitsme_v2_survey_{reportId}` | `lib/v2/survey/session.ts` | `answers` + `profile` + `savedAt` |

#### 설문 읽기 SSOT 헬퍼 (서버)

| 함수 | 파일 | 역할 |
|------|------|------|
| `getSurveyAnswersForReport` | `lib/relationship/surveyPatterns.ts` | raw `answers` |
| `getCurrentSelfProfileForReport` | 동일 | `CurrentSelfProfile` |
| `getPatternSummaryForReport` | 동일 | 관계 LLM용 6축 텍스트 요약 |
| `profileFromRow` | `app/api/v2/survey/route.ts` | GET `/api/v2/survey` |

#### 레거시·미사용 설문 저장

| 위치 | 상태 |
|------|------|
| `report_analyses.detailed_survey` | 구 18문항 — API에서 종료 안내 |
| `report_results` | 구 테이블 — `report_analyses`로 이관만 언급 |

#### psych 11축의 “제2 저장소”

| 저장소 | 내용 |
|--------|------|
| `survey_responses.answers.v2_profile.secondary_axes` | **원본** |
| `result_premium_by_kind.romantic.report.meta.psych_match` | romantic premium 생성 시 **파생 스냅샷** (axis_results + conflict_triggers) |

→ 11축 원본은 설문 1곳; romantic JSON은 **복제본**.

---

### 1.3 사주(만세력) 계산 결과

#### 계산 엔진 (매 요청 재실행)

| 함수 | 파일 | 입력 |
|------|------|------|
| `calculateSajuBundle` | `lib/v2/saju/calculateSajuBundle.ts` | `birth_date`, `birth_time`, `birth_time_unknown` |
| `loadSajuBundleFromReport` | `lib/saju/loadSajuBundleFromReport.ts` | `reports` 행 → bundle → **`sajuJson` subset** |
| `buildPairSajuBlueprint` | `lib/saju/sajuBlueprint.ts` | 2인 `sajuJson` → pair core + 십성·합충 1회 |
| `calculateEssenceSelfLite` | `lib/v2/saju/essenceLite.ts` | Blueprint용 **경량** 재계산 (`calculateSaju` 직접) |

#### in-memory bundle (저장 안 함) — `calculateSajuBundle` 출력

포함: 4주, `chart`, 일간/일지/4주 stem·branch data, 지장간, 십성, 12운성, `growthStages`, 합충 `relations`, 신살 `shinsals`, `meta.birth_time_unknown`

#### `sajuJson` (리포트 파이프라인용 subset)

포함: `saju` 4주, `dayStemData`, `dayBranchData`, `hiddenStemsData`, `tenGods`, `twelveStageData`, `relations`, `shinsals`  
**미포함:** `chart`, 년·월·시 stem/branch 상세, `growthStages`, bundle `relations.name`

#### DB 캐시

| 테이블 | 컬럼 | 실제 사용 |
|--------|------|-----------|
| `saju_charts` | `year_pillar`, `month_pillar`, `day_pillar`, `hour_pillar` | `app/api/saju/route.ts`에서 **insert만** — **read 경로 없음** |

#### romantic report 내 사주 스냅샷

| 필드 | 위치 |
|------|------|
| `meta.saju_provenance` | `result_premium_by_kind.romantic` JSON |
| `meta.saju_engine` | `"calculateSajuBundle_v2"` |

#### `buildPairSajuBlueprint` 캐싱?

**없음.** premium 생성·rule context 빌드마다 `loadSajuBundleFromReport` → `calculateSajuBundle` 재호출.

#### 대운

- Blueprint / 공통 bundle: **미포함**
- 연인 심화: `buildRomanticFortuneFlow` (`lib/relationship/romanticRules/fortuneFlow.ts`) — **근사 계산** 후 `meta.romantic_fortune_flow`에 저장

---

## 2. 소비처 × 데이터 읽기 매트릭스

범례: **R**=읽음, **C**=계산(재계산), **S**=저장된 스냅샷 사용, **—**=미사용

### 2.1 원본 데이터 매트릭스

| 데이터 소스 | Romantic Premium | Romantic Basic | Work / Family / Friend / Cohab Premium | Blueprint (Lite / Essence) |
|-------------|------------------|----------------|----------------------------------------|----------------------------|
| `reports.birth_*` | **R** `premium/route` → `loadSajuBundleFromReport` | **R** 이름용 select | **R** 동일 premium route | **R** `/api/report/birth` + **R** localStorage 병합 |
| `reports.birth_lat/lng/tz` | — (romantic deep) | — | — (deep는 date+place) | **R** Slim 심화 점성만 |
| `survey_responses` | **R** `getCurrentSelfProfileForReport` ×2 | **R** `getPatternSummaryForReport` ×2 | romantic만 psych용 **R**; 나머지 deep **—** | **R** localStorage → API hydrate |
| `survey_responses.v2_profile.secondary_axes` (11축) | **R** → `buildPsychMatchResult` | — | — | — |
| `survey_responses.v2_profile.primary_axes` (6축) | — (romantic rules는 사주 중심) | **R** (요약 텍스트) | — | **R** Current Lite |
| `calculateSajuBundle` / `sajuJson` | **C** ×2 | — | **C** `buildPairSajuBlueprint` | **C** `calculateEssenceSelfLite` (별 경로) |
| `buildPairSajuBlueprint` | **C** (rules ctx) | — | **C** 각 `build*RuleContext` | — |
| 점성 raw | — | — | — (5종 deep) | — (무료); Slim **C** |
| `report_analyses.astrology` | — | — | — | **S** Slim (텍스트) |

### 2.2 진입 파일 (오케스트레이션)

| 소비처 | API | 빌드 / 표시 |
|--------|-----|-------------|
| Romantic premium | `app/api/relationship/analyze/premium/route.ts` (kind=romantic) | `lib/prompts/relationshipPremium/romanticSajuDeep/index.ts` → `RomanticSajuDeepReportView.tsx` |
| Romantic basic | `app/api/relationship/analyze/basic/route.ts` | `RelationshipBasicCards.tsx` |
| Work premium | 동일 premium (kind=work) | `buildWorkColleagueReport` → `WorkColleagueReportView.tsx` |
| Family premium | kind=family | `buildFamilyParentReport` → `FamilyParentReportView.tsx` |
| Friend premium | kind=friendship | `buildFriendReport` → `FriendReportView.tsx` |
| Cohabitation premium | kind=cohabitation | `buildMarriageReport` → `MarriageReportView.tsx` |
| Blueprint Current Lite | `app/api/v2/lite/current/route.ts` | `lib/v2/lite/useLiteReport.ts` |
| Blueprint Essence Lite | `app/api/v2/lite/essence/route.ts` | `essenceLiteInput.ts` + `useLiteReport.ts` |
| Blueprint Gap UI | (클라이언트) | `BlueprintPreviewContent.tsx` + `useBlueprintBundle.ts` |
| Slim V1 심화 | `app/api/v2/deep/essence/route.ts` | `lib/v1/slim/runSlimIntegratedReport.ts` |

### 2.3 결과 JSON 읽기 (관계)

| 소비처 | 읽는 컬럼 / 경로 |
|--------|------------------|
| Romantic premium (표시) | `relationship_reports.result_premium_by_kind.romantic` (+ legacy `result_premium` 폴백) |
| Romantic basic | `relationship_reports.result_basic.perspectives[viewerReportId]` |
| Other premium | `result_premium_by_kind.{work\|family\|friendship\|cohabitation}` |
| 분석 기록 | `relationship_analysis_logs.result_snapshot` |

---

## 3. 파생 데이터 — 저장 vs 매번 재계산

| 파생 데이터 | 최초 계산 | 영구 저장? | 재표시 시 |
|-------------|-----------|------------|-----------|
| **Gap (6축)** | `buildGapRows(current, essence)` | ❌ | **매 렌더 재계산** (`BlueprintPreviewContent.tsx`) |
| **Essence 6축 점수** | `calculateEssenceSelfLite` | ❌ | **매 Blueprint 로드 재계산** (`useBlueprintBundle.ts`) |
| **psych_match (11축 쌍)** | `buildPsychMatchResult` | ✅ romantic `meta.psych_match` | DB 스냅샷 읽기 → detail API |
| **chemistryApprox (3축)** | `buildChemistryApproxScores(axis_results)` | ❌ | **매 UI 마운트 재계산** (`RomanticSajuDeepReportView.tsx`) |
| **strength/weakness lists** | `buildStrengthWeaknessLists` | ❌ | **매 UI 재계산** (동일) |
| **romantic snapshot_panel** | `buildRomanticSnapshotPanel` | ✅ `meta.snapshot_panel` | **S** `resolveSnapshotPanelFromReport` (hydrate만) |
| **work/friend/cohab snapshot_panel** | 각 `build*SnapshotPanel` | ✅ deep report JSON 내 | **S** hydrate |
| **romantic screen_plan / ranked_insights** | rule engine | ✅ `meta.*` | **S** |
| **romantic_fortune_flow (대운 근사)** | `buildRomanticFortuneFlow` | ✅ `meta.romantic_fortune_flow` | **S** |
| **result_basic 4축** | LLM | ✅ `result_basic` | **S** (키 stale 시 slice 오류) |
| **friend/work headline one-liner** | rule templates | ✅ deep JSON `headline` / `one_line_*` | **S** + 표시 보정 레이어 |
| **Current Lite LLM 본문** | `/api/v2/lite/current` | ⚠️ **localStorage만** | 세션 캐시 |
| **Essence Lite LLM 본문** | `/api/v2/lite/essence` | ⚠️ **localStorage만** | 세션 캐시 |
| **Slim integrated 본문** | `runSlimIntegratedReport` | ✅ `report_analyses.integrated` | **S** |
| **점성 해석 텍스트** | astrology API/LLM | ✅ `report_analyses.astrology` | **S** (fingerprint 캐시) |

**패턴 요약**

- **관계 deep JSON:** rule 산출물·psych_match·snapshot은 **생성 시 bake-in**
- **Blueprint:** Essence 점수·Gap은 **저장 없이 매번 재계산**
- **Romantic UI:** psych_match는 저장했지만 chemistry/strength는 **표시마다 재파생**
- **Lite LLM:** DB 없이 **브라우저만** 캐시

---

## 4. 알려진 문제 — 매트릭스 오버레이

대화(2026-07-12~13) 및 코드 리뷰에서 확인된 이슈를 **데이터 흐름 지점**에 매핑.

### 4.1 이슈 목록

| ID | 이슈 | 심각도 | 상태 (조사 시점) |
|----|------|--------|------------------|
| **P1** | `perspective` slice 키 stale (merge/repoint 후 `report_id` 키 불일치) | 높음 | basic 라벨 보정 일부 적용 (`pickViewerSliceByPartnerName`) |
| **P2** | Basic 카드 `my_nickname`/`partner_nickname` 제네릭 플레이스홀더 | 높음 | 표시 레이어 보정 (`resolveAxis*Nickname`) — **DB 원본은 그대로** |
| **P3** | Friend premium 헤드라인 `창창이 & 두 번째 사람` (저장 시 잘못된 nicknameA/B) | 중간 | 표시 레이어 (`rewriteViewerFirstNamePairLine`) — **미커밋** |
| **P4** | 이름 치환 로직 분산 (`buildRomanticNameReplacements`, axis resolver, pair rewrite) | 중간 | 도메인별 중복 |
| **P5** | 출생 이중 SSOT (DB vs `birthSession` localStorage) | 중간 | Blueprint만 |
| **P6** | `saju_charts` write-only dead cache | 낮음 | 혼동 유발 |
| **P7** | psych_match 저장 vs chemistry/strength 매 렌더 재계산 | 낮음 | 비용·일관성 |
| **P8** | 분석 기록 `result_snapshot` — 과거 viewer/이름 그대로 | 낮음 | 의도적 이력 |
| **P9** | `v2_profile` embed 단일 경로 — 스코어/축 키 마이그레이션 시 JSON 일괄 UPDATE 필요 | 중간 | `20260709100000` control→structure 예시 |
| **P10** | Friend premium 생성 시 label이 slot-fixed (viewer-first 미반영) → 잘못된 headline bake-in | 중간 | 재생성 전까지 DB 스냅샷 |

### 4.2 소비처 매트릭스 + 이슈 오버레이

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │              원본 읽기 / 계산 지점                           │
                    └─────────────────────────────────────────────────────────────┘
   reports.birth_* ─┬─► [Romantic Prem] loadSajuBundleFromReport ──► C bundle
                    ├─► [Other Prem]    buildPairSajuBlueprint ──────► C bundle
                    ├─► [Romantic Basic] (사주 미사용)
                    └─► [Blueprint]     DB + localStorage ───────────► P5 ⚠️
                                              └─► calculateEssenceSelfLite ─► C (별 엔진 경로)

 survey_responses ─┬─► [Romantic Prem] getCurrentSelfProfileForReport ─► psych_match ─► S in JSON
                    │                                                      └─► UI: chemistry C ─► P7
                    ├─► [Romantic Basic] getPatternSummaryForReport (6축 텍스트만)
                    ├─► [Other Prem]     (설문 미사용, friend/work rule-only)
                    └─► [Blueprint]      session + DB ─────────────────────► P9 (축 마이그레이션)

 result_basic ───────► [Romantic Basic] perspectives[viewerId] ─────────────► P1,P2 ⚠️
                       └─► normalizeRelationshipPerspectives (패치 on read)

 result_premium_by_kind ► [All Prem] kind JSON ─────────────────────────────► P3,P10 (friend headline)
                       └─► meta.psych_match S / chemistry C on read ───────► P7

 relationship_analysis_logs ► 과거 snapshot (이름·perspective 동결) ────────► P8
```

### 4.3 “같은 데이터를 각자 다시 읽거나 계산” 핫스팟

| 핫스팟 | 중복 내용 | 관련 이슈 |
|--------|-----------|-----------|
| **사주 3경로** | `calculateSajuBundle` vs `calculateEssenceSelfLite` vs `buildPairSajuBlueprint` 내부 재호출 | SSOT 없음, 결과 subset 상이 |
| **설문 프로필 2경로** | `getCurrentSelfProfileForReport` vs localStorage `readSurveyV2Session` | Blueprint vs API 불일치 가능 |
| **이름 4경로** | DB `reports.name`, basic `my_nickname`, deep JSON nickname, Clerk | P2,P3,P4 |
| **viewer 시점 3경로** | `perspectives` 키, `pickViewerFirstPair`, 표시 보정 레이어 | P1,P4 |
| **psych 파생 2단** | 저장 `psych_match` + UI에서 `chemistry`/`strength` 재계산 | P7 |
| **premium 이중 컬럼** | `result_premium` + `result_premium_by_kind` + logs snapshot | 캐시 무효화 복잡 (`invalidateRelationshipPremiums`) |

---

## 5. SSOT 리팩터링 시사점 (다음 세션 안건)

1. **PersonCore SSOT 객체** — `reportId` → `{ birth, surveyProfile, displayName }` 단일 로더
2. **SajuSnapshot** — `calculateSajuBundle` 1회 → versioned cache (DB or object store); `saju_charts` 정리 또는 read 연결
3. **Survey** — `survey_responses` only; localStorage는 draft로 격하; `v2_profile` 스키마 버전 필드
4. **Relationship perspectives** — 키를 `report_id` → canonical slot + viewer remap 레이어
5. **DisplayNamePolicy** — viewer-first 이름 단일 모듈 (basic / friend / romantic 공통)
6. **DerivedDataPolicy** — bake-in vs recompute 명시 (psych_match ↔ chemistry 일관성)
7. **점성** — structured raw 저장 여부 (라우팅 확장 전제)

---

## 6. 조사 범위·미포함

- `tests/`, `sandbox/` 내부 스크립트 (수동 검증용 재계산)
- Vercel env / Clerk 메타데이터
- `report_results` 레거시 테이블 실데이터 여부 (운영 DB 확인 필요)
- `reports` CREATE TABLE 마이그레이션 (repo에 없음 — `02_DATASET_SPECIFICATION.md` 역추론)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-13 | 초안 — REFACTOR SSOT 전수 조사 (대화 + 코드 기반) |
