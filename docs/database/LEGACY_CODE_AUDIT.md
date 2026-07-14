# Legacy Code Audit — SSOT 미정렬 사용처

> **작성일:** 2026-07-14  
> **기준:** [`DB_ARCHITECTURE.md`](./DB_ARCHITECTURE.md) / Dev baseline  
> **범위:** 런타임 코드(`app/`, `lib/`, `tests/`) 중심. 문서·구 마이그레이션은 참고만.  
> **방법:** 정적 grep (코드 수정·DB 접속·env 변경 없음)

이 문서는 Dev baseline(`entitlement`, `result_premium_by_kind` only 등)에 맞추기 전,  
**예전 DB 컬럼/구조를 아직 참조하는 위치 목록**이다.

---

## 1. `payment_status` / `plan_type`

목표: `reports.entitlement` (`free` \| `premium`)로 통합.

| 파일 | 줄 | 심볼 / 역할 |
|------|-----|-------------|
| `lib/report/isReportPremium.ts` | 2–6 | `isReportPremium` — `payment_status === "paid"` \|\| `plan_type === "paid"` |
| `lib/report/reportsBirthCoordinateColumns.ts` | 5–6 | `REPORT_BASE_FIELDS` — select 문자열에 `payment_status, plan_type` 포함 |
| `lib/report/fetchReportWithBirthCoords.ts` | (via REPORT_BASE) | `fetchReportWithBirthCoords` — 위 select로 reports 조회 |
| `lib/report/llmPaymentGuard.ts` | 59, 69 | `assertPremiumLlmAccess` — `.select("payment_status, plan_type")` 후 paid 판별 |
| `lib/home/resolveCanonicalReport.ts` | 14–15, 18–19 | `CanonicalReportRow` 타입 + `REPORT_SELECT` 문자열 |
| `lib/home/homeResume.ts` | 3, 107 | `buildHomeResume` — `isReportPremium(report)`로 프리미엄 플래그 |
| `lib/security/requestValidation.ts` | 301–302 | `stripClientTrustFields` — 클라이언트 body에서 필드명 strip (보안; 서버는 여전히 레거시 컬럼 사용) |
| `app/api/report/create/route.ts` | 78–79 | `POST` insert — `plan_type: "free"`, `payment_status: "none"` |
| `app/api/relationship/manual/route.ts` | 92–93 | partner report insert — 동일 하드코드 |
| `app/api/my/report/route.ts` | 126 | GET 경로 — `payment_status`/`plan_type`로 isPaid |
| `app/api/my/report/route.ts` | 357, 369 | POST(유료 LLM 등) — `.select("id, payment_status, plan_type")` + paid 판별 |
| `app/api/relationship/analyze/premium/route.ts` | 203–204 | `POST` — `fetchReportWithBirthCoords(..., "payment_status")`로 참여자 리포트 로드 |
| `app/api/llm/route.ts` | 12 | `assertPremiumLlmAccess` import (guard가 레거시 컬럼 조회) |
| `tests/scripts/verify-premium-pipeline.mjs` | 42, 52, 56 | 수동 검증 스크립트 — select/판별에 레거시 컬럼 |
| `tests/scripts/pre-payment-qa-check.mjs` | 71–72, 78 | QA 안내 문구 |
| `tests/scripts/patch3-4a-security-smoke.mjs` | 50–51, 61–62, 93–94, 105 | smoke insert에 `payment_status`/`plan_type` |
| `tests/unit/security-flow.test.mjs` | 92–99, 347–348, 374 | strip/create 소스에 레거시 필드 존재 assert |
| `tests/unit/security-ownership.test.mjs` | 141, 148 | create가 client `payment_status` 무시하는지 코멘트/검증 |

**참고(문서만, 런타임 아님):** `README.md`, `docs/dev-flow-current.md`, `docs/ARCHITECTURE_MASTER.md`, `docs/dev/02_DATASET_SPECIFICATION.md`, draft RLS `supabase/migrations/20260714120000_reports_rls_fail_closed_draft.sql` 등.

---

## 2. `result_premium` (`result_premium_by_kind`가 아닌 것)

목표: `relationship_reports.result_premium_by_kind`만 유지. legacy 컬럼·폴백 삭제.

### 2.1 DB select / update / 타입

| 파일 | 줄 | 심볼 / 역할 |
|------|-----|-------------|
| `lib/relationship/relationshipReportQuery.ts` | 4–5 | `RR_SELECT_LEGACY` — select에 `result_premium` |
| `lib/relationship/relationshipReportQuery.ts` | 7 | `RR_SELECT_FULL` — legacy 문자열에 `result_premium` 포함 후 by_kind 추가 |
| `lib/relationship/relationshipReportQuery.ts` | 43 | `normalizeRow` — `result_premium: row.result_premium` |
| `lib/relationship/relationshipReportQuery.ts` | 158–180 | `updateRelationshipReportSafe` — 신규 컬럼 실패 시 `legacyPatch`(`result_premium` 등)로 재시도 |
| `lib/relationship/fetchReportsWhereParticipant.ts` | 15 | `RelationshipReportRow.result_premium` 타입 필드 |
| `lib/relationship/persistRomanticPremiumResult.ts` | 16–37 | `persistRomanticPremiumResult` — full patch + legacy `{ result_premium: ... }` |
| `lib/relationship/invalidateRelationshipPremiums.ts` | 8–33 | `invalidateRelationshipPremiumsForReport` — update에 `result_premium: null` |
| `app/api/relationship/generate/route.ts` | 80 | select 문자열에 `result_premium` (by_kind 없음) |
| `app/api/relationship/analyze/premium/route.ts` | 180, 193–198 | `POST` — byKind + `rr.result_premium` 캐시 폴백; 응답 `result_premium` |
| `app/api/relationship/analyze/premium/route.ts` | 357 | romantic 응답 payload 필드명 `result_premium` |
| `app/api/relationship/analyze/premium/route.ts` | 414–417, 438 | work — DB update legacy patch + 응답 `result_premium` |
| `app/api/relationship/analyze/premium/route.ts` | 495–498, 519 | cohabitation — 동일 |
| `app/api/relationship/analyze/premium/route.ts` | 595–598, 619 | family — 동일 |
| `app/api/relationship/analyze/premium/route.ts` | 676–679, 700 | friendship — 동일 |

### 2.2 폴백 헬퍼 (legacy 인자 = DB `result_premium`)

| 파일 | 줄 | 심볼 / 역할 |
|------|-----|-------------|
| `lib/relationship/premiumByKind.ts` | 63–67 | `legacyPremiumPayload` |
| `lib/relationship/premiumByKind.ts` | 205–210 | `hasPremiumCacheForKind(..., legacyPremium)` |
| `lib/relationship/premiumByKind.ts` | 213–265 | `getPremiumPerspectiveForKind` — legacy perspectives 폴백 |
| `lib/relationship/premiumByKind.ts` | 268–345 | `getRomanticSajuDeepReport` / `getWorkColleagueDeepReport` / `getCohabitationDeepReport` / `getFamilyParentDeepReport` / `getFriendSocialDeepReport` — `byKind ?? legacy` |
| `lib/relationship/isRelationshipPremiumComplete.ts` | 9–35 | `isRelationshipPremiumComplete` — byKind + `resultPremium` 인자로 완료 판정 |
| `lib/relationship/hubRelationshipSummary.ts` | 58–62 | `countHubRelationshipSummary` — list와 동일 SSOT로 `r.result_premium` 전달 |
| `app/api/relationship/list/route.ts` | 213–216 | hub list — `isRelationshipPremiumComplete(..., r.result_premium, ...)` |
| `app/api/relationship/detail/route.ts` | 110–144 | detail — perspective/deep getters에 `rr.result_premium` |
| `app/api/relationship/detail/route.ts` | 201 | `raw_premium = rr.result_premium` 응답 필드 |
| `app/api/relationship/status/route.ts` | 57–62 | status list — **by_kind 없이** `r.result_premium.perspectives`만으로 has_premium |

### 2.3 API/스트림 응답 필드명 `result_premium` (클라이언트가 소비)

| 파일 | 줄 | 심볼 / 역할 |
|------|-----|-------------|
| `lib/relationship/premiumStream.ts` | 16–19 | `RomanticPremiumStreamComplete.result_premium` 타입 |
| `lib/relationship/romanticPremiumStreamHandler.ts` | 114–117 | stream `complete` 이벤트에 `result_premium: payload` |
| `app/relationship/[id]/useRelationshipDetail.ts` | 518–522 | NDJSON complete에서 `complete.result_premium` 파싱 |
| `app/relationship/[id]/useRelationshipDetail.ts` | 536–537, 559, 569, 579, 589, 598–600 | JSON API `data.result_premium` 소비 (kind별 뷰모델) |

> 스트림/API JSON 키 이름은 DB 컬럼과 별개이나, 레거시 컬럼명과 동일한 계약이라 정렬 시 함께 검토 필요.

---

## 3. `report_results` 테이블

목표: Dev에 미생성. `report_analyses`만 사용.

| 파일 | 줄 | 심볼 / 역할 |
|------|-----|-------------|
| `lib/report/reportAnalyses.ts` | 190–208 | `readLegacyBasicFromReportResults` — `.from("report_results").select("analysis_result")` |
| `lib/report/reportAnalyses.ts` | 151 | `readPersistedAnalysesBatch` — analyses 오류 시 legacy 폴백 |
| `lib/report/reportAnalyses.ts` | 165–167 | 동일 — basic 없으면 legacy 폴백 |
| `lib/report/reportAnalyses.ts` | 211–217 | `readPersistedBasicAnalysis` — analyses → 없으면 `readLegacyBasicFromReportResults` |

**런타임 외:** 구 마이그레이션 `20260516130000_report_analyses.sql`(이관), `20260519120000_enable_rls_remediation.sql`, draft RLS, 문서들.

---

## 4. `saju_charts` 테이블

| 결과 | 내용 |
|------|------|
| **앱/lib TS·JS** | `.from("saju_charts")` **현재 없음** |
| `app/api/saju/route.ts` | 전 구간 — `calculateSajuBundle`만; DB insert 없음 (과거 docs가 말한 write-only는 제거된 상태로 보임) |

**문서·구 마이그레이션만 언급:** `docs/ARCHITECTURE_MASTER.md`, `docs/dev-flow-current.md`, `docs/dev/DEVELOPER_HANDBOOK_2026-07-08.md`, `20260519120000_enable_rls_remediation.sql` 등.

→ **정렬 작업 대상 코드는 사실상 0.** Dev에 테이블 안 만들어도 앱 동작과 무관.

---

## 5. `report_type: "relationship"`

목표 enum: `self` \| `partner_manual` only (`relationship` 폐기).

| 파일 | 줄 | 심볼 / 역할 |
|------|-----|-------------|
| `app/homecontent.tsx` | 176 | report create body — `inviteToken ? "relationship" : "self"` |
| `app/api/report/create/route.ts` | 63–65, 77 | `POST` — body `"relationship"` \|\| `"self"`를 허용하고 DB `report_type`에 그대로 insert |

**의도적 비포함 (다른 도메인 문자열 `relationship`):**

- `invite_type: "relationship"` (`app/api/invite/create/route.ts`) — invites enum, reports와 무관
- 설문/저널 category `"relationship"` (`lib/v2/survey/*`, decision UI)
- `REPORT_ANALYSIS_TYPES`의 `"relationship"` (`lib/report/reportAnalyses.ts` L8) — **report_analyses.analysis_type** 레거시 값 (별도 정리 후보; SSOT analysis_type에도 없음)

---

## 6. Guest 관련 로직 (merge / orphan claim / null owner)

제품 정책: guest UUID claim·merge 금지, `clerk_user_id NOT NULL`.

### 6.1 Merge / claim API·헬퍼 (대부분 fail-closed stub)

| 파일 | 줄 | 심볼 / 역할 |
|------|-----|-------------|
| `app/api/account/merge/route.ts` | 7–17 | `POST` — 항상 403 `"guest claim is temporarily disabled"` |
| `lib/home/mergeGuestAccount.ts` | 18–23, 27–32 | `mergeGuestAccountData` / `mergeGuestAccountWithReport` — throw |
| `lib/home/mergeGuestAccountClient.ts` | 11–14 | `ensureGuestAccountMerged` — no-op `null` |
| `lib/home/reportSession.ts` | 36–37, 140–142 | `mergeGuestAccount` 옵션; true일 때만 client merge 호출 (기본 비활성) |
| `lib/home/homeResume.ts` | 47–51 | `buildGuestHomeResume` — no-op `null` |
| `lib/report/assertGuestOrOwnerReportAccess.ts` | 14–22 | `assertClaimAllowed` — 항상 403 (호출처 현재 없음) |
| `lib/report/assertOwnedReportAccess.ts` | 103–115 | `assertGuestOrOwnerReportAccess` — **deprecated 별칭**, 실제로는 owned-only |
| `lib/home/resolveCanonicalReport.ts` | 64 | 주석 — orphan/guest claim 없음 |

### 6.2 이름에 Guest가 남은 접근 가드 (동작은 owned)

호출만 레거시 이름 — 구현은 `assertOwnedReportAccess`:

| 파일 | 줄 | 역할 |
|------|-----|------|
| `app/api/my/report/route.ts` | 105, 348 | access 가드 |
| `app/api/report/birth/route.ts` | 48, 107, 308 | access 가드 |
| `app/api/relationship/manual/route.ts` | 68 | access 가드 |
| `app/api/relationship/partner-name/route.ts` | 34 | access 가드 |
| `app/api/relationship/remove/route.ts` | 29 | access 가드 |
| `app/api/v2/deep/essence/route.ts` | 47 | access 가드 |

### 6.3 아직 null owner를 쓰는 write (SSOT 충돌)

| 파일 | 줄 | 심볼 / 역할 |
|------|-----|-------------|
| `app/api/relationship/manual/route.ts` | 94 | partner `reports` insert에 **`clerk_user_id: null`** — Dev baseline `NOT NULL`과 충돌 |

타입상 null 허용 (쓰기와 분리):

| 파일 | 줄 | 역할 |
|------|-----|------|
| `lib/personCore/types/userMeta.ts` | 12 | `clerk_user_id: string \| null` |
| `lib/personCore/data/fetchPersonCoreSources.ts` | 8 | 동일 |
| `lib/personCore/services/buildPersonCoreBlueprint.ts` | 90 | `report.clerk_user_id ?? null` 전달 |

### 6.4 테스트

| 파일 | 줄 | 역할 |
|------|-----|------|
| `tests/unit/security-flow.test.mjs` | 311–323 | merge throw + guest resume no-op |
| `tests/unit/security-ownership.test.mjs` | 79–87 | `clerk_user_id: null` → 403 |
| `tests/scripts/patch3-4a-security-smoke.mjs` | 102+ | guestPaid 시나리오 (레거시 paid 컬럼 + guest 경로 스모크) |

### 6.5 의도적 비포함: UI “비로그인(게스트)” UX

Clerk 미로그인 UI (`isGuest`, `GuestDashboardAuthNotice` 등)는 **DB guest 컬럼/merge가 아님**. 별도 제품이 없으면 DB 정렬 범위 밖.

---

## 7. 우선순위 요약 (코드 정렬 시)

1. **Hard fail on Dev apply 직후:** `payment_status`/`plan_type` insert·select (`create`, `manual`, `isReportPremium`, `llmPaymentGuard`, `resolveCanonicalReport`, `my/report`)  
2. **Hard fail:** `result_premium` select/update (`relationshipReportQuery`, premium analyze/persist/invalidate, `generate` select)  
3. **Hard fail:** `report_type: "relationship"` create + `homecontent`  
4. **Hard fail:** `manual`의 `clerk_user_id: null`  
5. **Soft / 폴백 제거:** `report_results` legacy read, `premiumByKind` legacy 인자, `status` has_premium, 스트림 JSON 키명  
6. **정리만:** guest merge stub·rename `assertGuestOrOwner*`, 문서·draft SQL  
7. **작업 불필요:** `saju_charts` 런타임 참조 없음

---

## 8. 감사 메모

- 동일 파일에 `result_premium_by_kind`와 `result_premium`이 공존하는 경우가 많음 → “by_kind만 쓰는 줄”은 이 목록에서 제외하거나, legacy 인자와 함께 쓰일 때만 기재함.  
- `stripClientTrustFields`의 `payment_status`/`plan_type`/`entitlement` 삭제는 **보안 strip**이므로, entitlement 전환 후에도 키 이름은 유지하는 편이 안전.  
- 이 문서는 시점 스냅샷이다. 정렬 PR마다 해당 섹션을 지우거나 “done”으로 옮기면 된다.
