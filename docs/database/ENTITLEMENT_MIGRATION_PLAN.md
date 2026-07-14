# Entitlement Migration Plan — `payment_status` / `plan_type` → `entitlement`

> **작성일:** 2026-07-14  
> **기준:** [`DB_ARCHITECTURE.md`](./DB_ARCHITECTURE.md) · [`LEGACY_CODE_AUDIT.md`](./LEGACY_CODE_AUDIT.md)  
> **목표 스키마:** `reports.entitlement` = `free` \| `premium` (default `free`)  
> **범위:** 계획만. 이 문서 작성 시점에 코드·DB·env 변경 없음.

---

## 0. 목표 매핑 (SSOT)

| 레거시 (현재 코드) | 목표 |
|--------------------|------|
| `payment_status` (`none` / `paid`) | 컬럼 삭제 |
| `plan_type` (`free` / `paid`) | 컬럼 삭제 |
| Premium 판별: `payment_status === "paid"` **OR** `plan_type === "paid"` | `entitlement === "premium"` |
| 비프리미엄 (그 외) | `entitlement === "free"` |
| Insert 기본: `plan_type: "free"`, `payment_status: "none"` | `entitlement: "free"` (또는 DB default만) |

**중요:** 레거시 코드는 OR로 두 컬럼 중 하나만 `paid`여도 premium으로 본다.  
목표 enum 값 이름은 **`premium`** 이지 `paid`가 아니다.

---

## 1. 파일 전체 목록 (`payment_status` / `plan_type`)

### 1.1 런타임 — 판별·select·insert (필수 정렬)

| # | 파일 | 역할 요약 |
|---|------|-----------|
| A | `lib/report/isReportPremium.ts` | premium 여부 헬퍼 (SSOT 진입점 후보) |
| B | `lib/home/homeResume.ts` | `isReportPremium(report)` → `isPremium` |
| C | `lib/home/resolveCanonicalReport.ts` | resume용 select + 타입에 레거시 컬럼 |
| D | `lib/report/reportsBirthCoordinateColumns.ts` | `REPORT_BASE_FIELDS`에 레거시 컬럼 |
| E | `lib/report/fetchReportWithBirthCoords.ts` | (간접) `REPORT_BASE_FIELDS` 사용 |
| F | `lib/report/llmPaymentGuard.ts` | LLM 심화 전 DB select + paid OR |
| G | `app/api/my/report/route.ts` | GET/POST premium 게이트 |
| H | `app/api/report/create/route.ts` | insert에 `plan_type`/`payment_status` |
| I | `app/api/relationship/manual/route.ts` | partner insert에 동일 |
| J | `app/api/relationship/analyze/premium/route.ts` | `fetchReportWithBirthCoords(..., "payment_status")` |
| K | `lib/security/requestValidation.ts` | `stripClientTrustFields`에 키 이름 포함 |

### 1.2 테스트·스크립트

| # | 파일 | 역할 요약 |
|---|------|-----------|
| T1 | `tests/unit/security-flow.test.mjs` | strip + create 소스에 `payment_status`/`plan_type` assert |
| T2 | `tests/unit/security-ownership.test.mjs` | create가 client payment 무시한다는 코멘트/검증 |
| T3 | `tests/scripts/verify-premium-pipeline.mjs` | select·paid OR 판별 |
| T4 | `tests/scripts/pre-payment-qa-check.mjs` | QA 안내 (DB에 `payment_status=paid` 설정) |
| T5 | `tests/scripts/patch3-4a-security-smoke.mjs` | seed insert에 레거시 컬럼 |

### 1.3 문서·draft SQL (코드 변경과 별도, 추후 갱신)

- `docs/database/LEGACY_CODE_AUDIT.md`, `DEV_DB_SETUP.md`, `DB_ARCHITECTURE.md` (이미 entitlement 목표)
- `docs/dev/02_DATASET_SPECIFICATION.md`, `docs/dev-flow-current.md`, `README.md`, `ARCHITECTURE_MASTER.md`
- `supabase/migrations/20260714120000_reports_rls_fail_closed_draft.sql` (레거시 컬럼 WITH CHECK)

---

## 2. 파일별 조건문 / 로직

### A. `lib/report/isReportPremium.ts`

```text
return report.payment_status === "paid" || report.plan_type === "paid";
```

- **AND가 아님.** 한쪽만 `paid`여도 true.
- `plan_type === "premium"` 은 **검사하지 않음** (테스트 strip 페이로드에만 `"premium"` 등장).

### B. `lib/home/homeResume.ts` (~107)

```text
isPremium: isReportPremium(report)
```

- resume JSON의 `isPremium` 플래그. 판별 로직은 A에 위임.

### C. `lib/home/resolveCanonicalReport.ts`

- 타입: `payment_status: string | null`, `plan_type: string | null`
- select: `..., payment_status, plan_type`
- 조건문 없음 → homeResume이 소비.

### D–E. `reportsBirthCoordinateColumns.ts` / `fetchReportWithBirthCoords.ts`

- `REPORT_BASE_FIELDS = "id, name, payment_status, plan_type, birth_date, ..."`
- select 목록만. 판별은 호출부 (`my/report` GET 등).

### F. `lib/report/llmPaymentGuard.ts` (`assertPremiumLlmAccess`)

```text
.select("payment_status, plan_type")
hasPremium = report.payment_status === "paid" || report.plan_type === "paid"
```

- false → 403 `"심화 리포트는 결제 후 이용할 수 있습니다."`
- `premiumAccessCache`에 결과 캐시.

### G. `app/api/my/report/route.ts`

**GET (~125–127):**

```text
has_premium = report.payment_status === "paid" || report.plan_type === "paid"
```

- `fetchReportWithBirthCoords` 결과 사용 (BASE_FIELDS에 컬럼 포함).
- true일 때만 analyses batch 등 premium 페이로드 로드.

**POST (~357–374):**

```text
.select("id, payment_status, plan_type")
has_premium = payment_status === "paid" || plan_type === "paid"
```

- false → 403 저장 거부.

### H. `app/api/report/create/route.ts` (~74–75)

```text
plan_type: "free",
payment_status: "none",
```

- insert 하드코드. 클라이언트 body의 동명 필드는 strip됨.

### I. `app/api/relationship/manual/route.ts` (~92–93)

```text
plan_type: "free",
payment_status: "none",
```

- `partner_manual` 생성 시 동일. (소유자는 이미 `clerk_user_id: userId`로 정렬됨.)

### J. `app/api/relationship/analyze/premium/route.ts` (~203–204)

```text
fetchReportWithBirthCoords(supabase, rr.report_id_a, "payment_status")
fetchReportWithBirthCoords(supabase, rr.report_id_b, "payment_status")
```

- **extra select로 `payment_status`만 추가 로드.**
- 이 파일 내에서 `repA.payment_status` / paid 판별로 **게이트하는 코드는 없음** (출생·차트용으로 report 행만 사용).
- 관계 premium 잠금은 주로 `relationship_reports.analysis_type` (+ 별도 guard).  
  → 컬럼 rename 시 `"entitlement"`로 바꾸거나, **extra 인자를 아예 제거**해도 동작상 동일할 가능성이 큼 (확인 후 제거 권장).

### K. `lib/security/requestValidation.ts` (`stripClientTrustFields`)

- 삭제 키 목록: `"payment_status"`, `"plan_type"`, 그리고 이미 `"entitlement"` 포함.
- **판별 로직 아님.** 클라이언트가 entitlement를 조작하지 못하게 하는 보안 strip.
- 마이그레이션 후에도 **레거시 키 이름은 strip 목록에 남겨 두는 것**이 안전.

### T3. `tests/scripts/verify-premium-pipeline.mjs`

```text
select: payment_status, plan_type
premium = payment_status === "paid" || plan_type === "paid"
```

### T5. `tests/scripts/patch3-4a-security-smoke.mjs`

- insert: `(none, free)` / `(paid, paid)` 조합 seed.

### T1. `tests/unit/security-flow.test.mjs`

- strip 입력에 `payment_status: "paid"`, `plan_type: "premium"` (후자는 **DB 실제 값과 불일치**하는 클라이언트 조작 시뮬레이션).
- create 소스가 아직 `payment_status: "none"` / `plan_type: "free"` 문자열을 포함하는지 regex 검사.

---

## 3. 1:1 대응 vs 추가 판단 필요

### 3.1 1:1로 깨끗한 곳 (기계적 치환 가능)

전제: **앱이 바라보는 DB에 이미 `entitlement`만 있고**,  
판별은 `entitlement === "premium"`, 기본 쓰기는 `entitlement: "free"` (또는 default).

| 항목 | 레거시 | entitlement |
|------|--------|-------------|
| A `isReportPremium` | paid OR paid | `report.entitlement === "premium"` |
| B homeResume | (A 경유) | A만 바꾸면 자동 |
| C resolveCanonicalReport | select/타입 두 컬럼 | `entitlement` 하나 |
| D REPORT_BASE_FIELDS | 두 컬럼 | `entitlement` |
| F llmPaymentGuard | select + OR | select `entitlement` + `=== "premium"` |
| G my/report GET/POST | 동일 OR | 동일 |
| H create insert | free + none | `entitlement: "free"` |
| I manual insert | free + none | `entitlement: "free"` |
| T3/T5 스크립트 | 동일 | 동일 매핑 |

**권장 단일 헬퍼 (정렬 시):**

```text
isReportPremium(report) ↔ entitlement === "premium"
```

모든 게이트가 이 헬퍼(또는 동일 한 줄)만 쓰게 맞추면 drift 감소.

### 3.2 애매하거나 추가 판단이 필요한 곳

| ID | 이슈 | 왜 애매한가 |
|----|------|-------------|
| **H1** | Prod/기존 DB 행 백필 | 현재 행이 `(payment_status, plan_type)` 네 조합일 수 있음. 코드 OR와 동일한 규칙으로 SQL UPDATE할지 **사람이 확정**해야 함. |
| **H2** | 이중 스키마 기간 | Dev는 `entitlement`만, Prod는 아직 레거시일 수 있음. 코드가 한동안 **둘 다 읽기**가 필요한지, Dev-only 컷오버인지 결정. |
| **H3** | 값 이름 `paid` → `premium` | UI/문서/QA 습관이 `payment_status=paid`. 운영 runbook·수동 SQL 문구 전부 바꿔야 함. |
| **H4** | J premium analyze extra select | 필드가 **미사용**으로 보임. `entitlement`로 rename vs orphan select 삭제 — 동작 검증 후 결정. |
| **H5** | K strip 목록 | `entitlement`는 이미 strip됨. 레거시 키를 **언제 목록에서 빼도 되는지**(클라이언트 구버전 잔존 기간). |
| **H6** | T1 create 소스 assert | create를 `entitlement`로 바꾸면 regex `payment_status:\s*"none"` 등이 **깨짐** → 테스트 동시 수정 필수. |
| **H7** | `plan_type: "premium"` (테스트만) | 실제 DB/판별은 `plan_type === "paid"`. 문서·머릿속 enum과 혼동 금지. |
| **H8** | 관계 premium vs report entitlement | `relationship_reports.analysis_type === "premium"`은 **별 축**. 이번 작업에서 합치지 말 것. report entitlement만 교체. |
| **H9** | QA “DB에서 paid로 올리기” | `pre-payment-qa-check.mjs` 등. Dev에서는 `UPDATE reports SET entitlement = 'premium'`. 누가/어디서 올리기 허용할지. |

---

## 4. 수정 순서 제안 (안전 순)

원칙: **판별 SSOT 헬퍼 → select 문자열 → API 게이트 → insert → 죽은 extra → 테스트**.

| Step | 대상 | 이유 |
|------|------|------|
| **0** | 사람 결정 (아래 §5) + Dev에 baseline 적용·앱이 Dev를 가리키는지 확인 | 레거시 컬럼 없는 DB에 insert하면 create가 깨짐 |
| **1** | `isReportPremium.ts` | 단일 판별 진입점. homeResume이 즉시 따라감 |
| **2** | `reportsBirthCoordinateColumns.ts` (`REPORT_BASE_FIELDS`) | my/report GET·birth 조회 select가 한곳에서 바뀜 |
| **3** | `resolveCanonicalReport.ts` | resume select/타입 |
| **4** | `llmPaymentGuard.ts` | LLM 경로. 캐시 키는 reportId라 컬럼 변경과 무관; entitlement 변경 시 캐시 invalidate 정책은 기존과 동일 |
| **5** | `app/api/my/report/route.ts` (GET + POST) | 중복 OR를 헬퍼 호출로 통일 권장 |
| **6** | `app/api/report/create/route.ts` + `relationship/manual/route.ts` | insert 실패가 전 플로우를 막으므로 Dev entitlement 컬럼 존재 후 |
| **7** | `relationship/analyze/premium/route.ts` | extra `"payment_status"` → 제거 또는 `"entitlement"` (미사용이면 제거 우선) |
| **8** | `stripClientTrustFields` | 레거시 키 **유지** + entitlement 유지. 삭제하지 말 것(§3 H5) |
| **9** | unit tests (`security-flow` create regex 등) | 소스 문자열 변경과 **같은 PR** |
| **10** | manual scripts (`verify-premium-pipeline`, smoke, QA 안내) | 런타임 후순위 |
| **11** | 문서 / LEGACY_CODE_AUDIT 해당 섹션 “done” | 추적성 |

**한 PR에 넣기 좋은 묶음:** Steps 1–6 + 9 (헬퍼·select·게이트·insert·단위테스트).  
**분리 가능:** Step 7(미사용 select), Step 10(스크립트), Step 11(문서).

---

## 5. 사람이 먼저 결정해야 하는 항목 (강조)

아래가 합의되기 **전**에는 자동 치환·Prod 적용을 하지 말 것.

### 5.1 기존 행 → `entitlement` 백필 규칙 (Prod/공유 DB가 있을 때)

코드 판별과 맞추려면:

```text
entitlement = 'premium'
  WHERE payment_status = 'paid' OR plan_type = 'paid';

entitlement = 'free'
  WHERE 그 외 (NULL 포함 시 정책 명시)
```

**확인 필요:**

- 운영에 `(paid, free)` / `(none, paid)` 비대칭 행이 얼마나 있는지  
- `payment_status`/`plan_type`이 NULL인 행 처리 (`free`로 둘지)  
- 백필 후 레거시 컬럼 DROP 시점 (앱 배포와 순서: **앱 entitlement 읽기 배포 → 백필 → DROP** vs Dev 빈 DB는 DROP 불필요)

> Dev baseline만 쓰는 경로면 백필 SQL은 **불필요**. 그래도 “나중에 Prod 컷오버할 때 같은 규칙”을 미리 적어두길 권장.

### 5.2 런타임 이중 읽기 여부

| 옵션 | 의미 | 비고 |
|------|------|------|
| **A. Dev-only hard cut** | 코드는 `entitlement`만. Prod는 별도 컷오버 PR | 단순. **지금 단계와 잘 맞음** |
| **B. 호환 레이어** | `entitlement === 'premium' \|\| payment_status === 'paid' \|\| plan_type === 'paid'` 일시 유지 | Prod 공존 시만. 수명 짧아야 함 |

**결정 필요:** A vs B. 문서/SSOT는 A를 전제로 함.

### 5.3 QA·수동 권한 부여 절차

레거시: `UPDATE ... SET payment_status = 'paid'`.  
목표: `UPDATE ... SET entitlement = 'premium'`.

누가(어드민 SQL only?) / 캐시(`premiumAccessCache`) invalidate를 어떻게 할지도 한 줄로 정할 것.

### 5.4 관계 premium 과 report entitlement를 섞지 않는다

“관계가 premium으로 열림” ≠ “개인 report entitlement가 premium”.  
이번 마이그레이션은 **reports 컬럼만**. `relationship_reports.analysis_type` / `result_premium_by_kind`는 범위 밖 (`LEGACY_CODE_AUDIT`의 result_premium 작업과 분리).

### 5.5 `paid` vs `premium` 용어

| 레이어 | 값 |
|--------|-----|
| DB `entitlement` | `free` \| `premium` |
| 레거시 DB | `paid` (payment/plan) |
| 사용자 카피 | “결제 후” 등 — 제품 카피는 유지 가능 |

코드·SQL·QA 문서에서 `paid`를 entitlement 값으로 쓰지 말 것.

---

## 6. 완료 정의 (이 플랜 이후 구현 PR)

- [ ] `isReportPremium` / LLM guard / my/report가 `entitlement === "premium"`만 사용  
- [ ] create·manual insert가 `entitlement`만 기록 (`payment_status`/`plan_type` 없음)  
- [ ] select 문자열에 레거시 컬럼 없음 (Dev에서 컬럼 미존재 오류 없음)  
- [ ] unit test·검증 스크립트 갱신  
- [ ] `stripClientTrustFields`에 `entitlement` + (당분간) 레거시 키 유지  
- [ ] LEGACY_CODE_AUDIT §payment_status 목록을 done으로 옮김  

**비범위:** result_premium 제거, RLS policy, `.env` / Vercel / Prod migration 실행.

---

## 7. 참조

- `docs/database/DB_ARCHITECTURE.md` §3.1, §5 Entitlement, §검토 1  
- `docs/database/LEGACY_CODE_AUDIT.md` §1  
- `supabase/migrations/20260714140000_dev_baseline_ssot.sql` — `reports.entitlement` CHECK (`free`\|`premium`)
