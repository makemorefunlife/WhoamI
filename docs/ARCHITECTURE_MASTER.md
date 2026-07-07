# WhoamI 아키텍처 마스터 문서 (기획자용)

> 최종 갱신: 2026-07-06  
> 5대 관계 탭(연인·동료·결혼·가족·친구) + 사주 블루프린트 + Auth/DB 통합 구조

---

## 1. 로그인 → DB → 블루프린트 통합 데이터 흐름도

```
[사용자 브라우저]
    │
    ├─ Clerk 로그인/가입
    │     app/sign-in/[[...sign-in]]/page.tsx
    │     app/sign-up/[[...sign-up]]/page.tsx
    │     components/clerk/AppClerkProvider.tsx
    │     proxy.ts  ← clerkMiddleware() 세션 쿠키
    │
    ▼
[Clerk userId] ─────────────────────────────────────────────┐
    │                                                        │
    ▼                                                        │
[온보딩 · 생년월일 입력]                                       │
    app/onboarding/birth/page.tsx                             │
    │                                                        │
    ▼ POST                                                   │
[API] app/api/report/birth/route.ts                         │
    │  auth() → Clerk userId                                │
    │  updateReportPatchSafely()                              │
    ▼                                                        │
[Supabase DB]                                               │
    ┌─────────────────────────────────────────────────────┐ │
    │  reports  테이블                                     │ │
    │  · clerk_user_id  ← 유저 소유권 연결 ────────────────┘ │
    │  · birth_date / birth_time / birth_place              │
    │  · birth_latitude / birth_longitude / birth_timezone  │
    └─────────────────────────────────────────────────────┘
    │
    ├─ sessionStorage (보조 캐시)
    │     lib/v2/onboarding/birthSession.ts
    │     lib/v2/survey/session.ts
    │     lib/v2/lite/session.ts
    │
    ▼
[★ 사주 블루프린트 1회 생성 ★]
    lib/saju/loadSajuBundleFromReport.ts
         └─ lib/v2/saju/calculateSajuBundle.ts
              ├─ buildChartContext()        ← 천간/지지/궁
              ├─ analyzeRelations()         ← 합·충·형·파·해
              ├─ analyzeShinsal()           ← 도화·홍염·원진·귀문 등
              ├─ tenGods (십성) + growthStages (12운성)
              └─ toV1SajuApiPayload() → sajuJson
    │
    ▼ (관계 분석 시 2인 페어)
    lib/saju/sajuBlueprint.ts  ← ★ NEW: 중앙 마스터 ★
         buildPairSajuBlueprint()
              ├─ PersonSajuBlueprint ×2  (chart·십성·신살·검증 1회)
              └─ PairSajuCore             (analyzePairSaju 1회)
    │
    ▼ kind 분기 (rule-only deep pipeline)
    app/api/relationship/analyze/premium/route.ts
    │
    ├── romantic   → lib/prompts/relationshipPremium/romanticSajuDeep/
    ├── work       → lib/prompts/relationshipPremium/workColleague/
    ├── cohabitation → lib/prompts/relationshipPremium/cohabitation/
    ├── family     → lib/prompts/relationshipPremium/familyParentChild/
    └── friendship → lib/prompts/relationshipPremium/friendSocial/
    │
    ▼
[Supabase DB · 결과 캐시]
    relationship_reports.result_premium_by_kind (jsonb, kind별)
    relationship_analysis_logs.result_snapshot   (이력용)
    │
    ▼
[화면]
    app/relationship/[id]/RelationshipView.tsx
    components/relationship/*ReportView.tsx
```

---

## 2. 유저 / 로그인 / 사주 데이터 DB 테이블 매핑

| 기능/도메인 | 관련 파일 경로 (Auth/API) | 연결된 DB 테이블명 | 주요 저장 데이터 항목 |
| :--- | :--- | :--- | :--- |
| **로그인/인증 (Auth)** | `proxy.ts`, `components/clerk/AppClerkProvider.tsx`, `app/api/report/birth/route.ts` (`auth()`) | *(Clerk 클라우드 — DB 테이블 아님)* | Clerk `userId`, 세션 쿠키. 앱 소유권은 `reports.clerk_user_id`로 매핑 |
| **유저 리포트 마스터** | `app/api/report/birth/route.ts`, `app/api/survey/submit/route.ts`, `lib/report/fetchReportWithBirthCoords.ts` | **`reports`** | `id`, `name`, `clerk_user_id`, `birth_date`, `birth_time`, `birth_place`, `birth_latitude/longitude/timezone`, `payment_status`, `plan_type` |
| **설문 응답** | `app/api/survey/submit/route.ts` | **`survey_responses`** | `report_id`, `answers` (JSON) |
| **개인 LLM 리포트 캐시** | `lib/report/reportAnalyses.ts`, `app/api/my/report/route.ts` | **`report_analyses`** | `report_id`, `analysis_type` (`basic`/`integrated`/`astrology` 등), `content`, `metadata` |
| **관계 분석 (기본)** | `app/api/relationship/analyze/basic/route.ts` | **`relationship_reports`** | `result_basic` (jsonb), `report_id_a/b`, `relationship_kind` |
| **관계 분석 (심화·5탭)** | `app/api/relationship/analyze/premium/route.ts` | **`relationship_reports`** | `result_premium_by_kind` (jsonb) — kind별 deep report. 레거시 `result_premium` 폴백 |
| **관계 분석 이력** | `lib/relationship/analysisLog.ts` | **`relationship_analysis_logs`** | `result_format`, `result_snapshot`, `relationship_kind`, `analysis_level` |
| **즐겨찾기** | `app/api/relationship/favorite/route.ts` | **`relationship_favorites`** | `viewer_report_id`, `relationship_report_id` |
| **초대** | `app/api/invite/*/route.ts` | **`invites`** | `invite_token`, `from_report_id`, `accepted_report_id`, `relationship_report_id` |
| **사주 기둥 (레거시 insert)** | `app/api/saju/route.ts` | **`saju_charts`** | 4기둥 문자열만 insert — **읽기 캐시로는 미사용** |
| **사주 블루프린트 (런타임)** | `lib/saju/sajuBlueprint.ts`, `lib/v2/saju/calculateSajuBundle.ts` | **DB 캐시 없음** | 매 요청 런타임 계산. sessionStorage에 lite/unified 보조 캐시만 |

> **출생시간 미상**: DB 컬럼 없음. `birth_time`이 null/빈값이면 코드에서 `birthTimeUnknown=true`로 파생 → 시주 12:00 계산.

---

## 3. 5대 핵심 탭별 파일 및 프롬프트 규칙 매핑

| 서비스 탭 | 십신/조후 백엔드 핵심 연산 | 텍스트 빌더 및 프롬프트 | 핵심 규칙 요약 |
| :--- | :--- | :--- | :--- |
| **1. 연인 (Romance)** | `lib/saju/sajuBlueprint.ts` → `lib/saju/pairChartAnalysis.ts` · `lib/saju/tenGodActivation.ts` · `lib/relationship/romanticHeadline/` | `lib/relationship/romanticRules/index.ts` · `lib/prompts/relationshipPremium/romanticSajuDeep/` · `RomanticSajuDeepReportView.tsx` | 정신/신체 정합성, 일간·교차합충 헤드라인, 3점수 스냅샷, rule 기반 opening |
| **2. 동료 (Business)** | `lib/saju/workPairAnalysis.ts` · `lib/relationship/workPairEventScores.ts` · `lib/relationship/workColleague/tenGodComplement.ts` | `lib/relationship/workColleague/buildWorkColleagueContext.ts` · `lib/prompts/relationshipPremium/workColleague/` · `WorkColleagueReportView.tsx` | 오피스 DNA·롤 매칭, 빌런 탐지, 워크 스타일 핏, 십신 상호보완 |
| **3. 결혼/동거 (Deep)** | `lib/saju/marriageAnalysis.ts` · `lib/relationship/marriage/marriageTenGodAnalysis.ts` · `lib/relationship/marriageEventScores.ts` | `lib/relationship/marriage/buildMarriageRuleContext.ts` · `marriageKillerSections.ts` · `lib/prompts/relationshipPremium/cohabitation/` · `MarriageReportView.tsx` | 3대 매트릭스(스태미나/판타지/배려), CFO 지정, 매운맛 화풀림, 수면 핏, 3년 기상도 |
| **4. 가족 (Family)** | `lib/saju/familyAnalysis.ts` · `lib/relationship/familyParent/familyParentTenGodAnalysis.ts` · `familyEventScores.ts` | `lib/relationship/familyParent/buildFamilyRuleContext.ts` · `familyKillerSections.ts` · `lib/prompts/relationshipPremium/familyParentChild/` · `FamilyParentReportView.tsx` | 엄마(인성)/아빠(재성) 렌즈, Child DNA, ADHD·편애·효도 지수, 해독제 카드 |
| **5. 친구 (Social)** | `lib/saju/friendAnalysis.ts` · `lib/relationship/friendEventScores.ts` | `lib/relationship/friend/buildFriendRuleContext.ts` · `friendKillerSections.ts` · `lib/prompts/relationshipPremium/friendSocial/` · `FriendReportView.tsx` | 팝콘 vs 침묵, 소셜 배터리, 더치페이 총무, 손절 트리거, #우쭈쭈 해독제 |

**공통 진입점**: `lib/relationship/relationshipAnalysisKinds.ts` (탭 레지스트리)  
**공통 premium API**: `app/api/relationship/analyze/premium/route.ts`  
**공통 캐시 조회**: `lib/relationship/premiumByKind.ts`

---

## 4. 사주 블루프린트 아키텍처 (Mission 1)

### 1인 Blueprint (`PersonSajuBlueprint`)

| 필드 | 출처 | 설명 |
|------|------|------|
| `chart` | `buildChartContext` 1회 | 천간·지지·궁위 |
| `tenGodCounts` | `sajuJson.tenGods` | 십성 카운트 |
| `tenGodProfile` | `profileTenGods()` | 재성/관성/식상/인성/비겁 프로파일 |
| `relations` | `sajuJson.relations` | 원국 합·충·형·파·해 |
| `shinsals` | `sajuJson.shinsals` | 도화·홍염·원진·귀문·괴강 등 |
| `validation` | `validateSajuPillars` | 출생시간 미상 등 불확실성 |

### 페어 Blueprint (`PairSajuBlueprint`)

| 필드 | 설명 |
|------|------|
| `personA`, `personB` | 1인 Blueprint |
| `core.pairAnalysis` | `analyzePairSaju` 1회 (교차 합충) |
| `core.chartA/B` | 탭 analyzer에 주입 → **이중 buildChartContext 차단** |
| `uncertainItems` | 출생지·검증 노트 통합 |

### 핵심 파일

- **생성**: `lib/saju/sajuBlueprint.ts`
- **만세력 원천**: `lib/v2/saju/calculateSajuBundle.ts`
- **로드**: `lib/saju/loadSajuBundleFromReport.ts`

---

## 5. 리팩토링 수행 결과 (2026-07-06)

### 삭제된 미사용/레거시 파일

| 파일 | 사유 |
|------|------|
| `lib/saju/familyParentAnalysis.ts` | `familyAnalysis.ts`로 통합된 deprecated re-export, import 0건 |
| `lib/report/basicAnalysisPersistence.ts` | `reportAnalyses.ts`로 대체된 deprecated shim, import 0건 |
| `lib/relationship/familyParent/buildFamilyParentRuleContext.ts` | `buildFamilyRuleContext.ts`에 alias 존재 |
| `lib/relationship/familyParent/familyParentEventScores.ts` | `familyEventScores.ts` re-export만, import 0건 |

### Blueprint 주입 완료 (5탭 build*Context)

- `buildFriendRuleContext.ts`
- `buildWorkColleagueContext.ts`
- `buildMarriageRuleContext.ts`
- `buildFamilyRuleContext.ts`
- `analyzePairSaju` + 4개 `analyze*PairSaju` prebuilt charts 지원

### 원진/귀문 SSOT 통합 (2026-07-06)

**단일 모듈:** `lib/saju/workPairRiskSignals.ts`

| export | 용도 |
|--------|------|
| `isWonjin` / `isGuimun` | 지지 코드 쌍 판별 |
| `detectFriendWonjinGuimun` | 친구 탭 교차 탐지 |
| `detectMarriageWonjinGuimun` | 결혼/동거 탭 교차 탐지 |
| `detectFamilyWonjinGuimunBranches` | 가족 탭 부모·자녀 교차 탐지 |
| `hasGuimunOnDayHourPalaces` | 침실·수면 예민도 |

**중복 제거 파일:** `friendAnalysis.ts`, `marriageAnalysis.ts`, `familyAnalysis.ts`, `marriageKillerSections.ts`, `bedroomProfile.ts`

### 빌드 결과

```
npm run build → ✓ Compiled successfully (2026-07-06)
```

---

## 6. 기획자 Quick Reference

| 하고 싶은 일 | 수정할 파일 |
|-------------|------------|
| 친구 탭 점수 공식 변경 | `lib/relationship/friendEventScores.ts` |
| 친구 탭 화면 문구 | `lib/relationship/friend/friendKillerSections.ts` |
| 새 관계 탭 추가 | `relationshipAnalysisKinds.ts` + `premium/route.ts` + ReportView |
| 출생 데이터 필드 추가 | `reports` 마이그레이션 + `app/api/report/birth/route.ts` |
| 십성 카운트 로직 | `lib/relationship/marriage/marriageTenGodAnalysis.ts` (SSOT) |
| 사주 연산 중복 제거 | `lib/saju/sajuBlueprint.ts` |
