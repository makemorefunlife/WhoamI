# Result Premium Migration Plan — `result_premium` → `result_premium_by_kind`

> **작성일:** 2026-07-14  
> **기준:** [`DB_ARCHITECTURE.md`](./DB_ARCHITECTURE.md) · [`LEGACY_CODE_AUDIT.md`](./LEGACY_CODE_AUDIT.md)  
> **목표 스키마:** `relationship_reports.result_premium_by_kind` jsonb만 유지 (`{}` default). **`result_premium` 컬럼 없음** (Dev baseline).  
> **범위:** 계획만. 코드·DB·env 변경 없음.

---

## 0. 목표 모델 (SSOT)

| 항목 | 내용 |
|------|------|
| 저장 | `result_premium_by_kind[kind] = payload` |
| kind | `romantic` \| `work` \| `family` \| `friendship` \| `cohabitation` |
| 행 메타 | `relationship_kind` = **마지막(또는 현재 활성) kind** (이미 컬럼 존재) |
| 조회 | 요청/활성 kind → `by_kind[kind]`만 |
| 완료 판정 | 해당 kind 슬롯에 유효 캐시가 있는지 (필요 시 “아무 kind나” 정책을 사람 결정) |

레거시 `result_premium` = **종류를 모르는 단일 jsonb 슬롯**  
(마지막 심화 한 건만 덮어씀 → kind별 공존 불가).

---

## 1. 파일 전체 목록

### 1.1 DB select / normalize / update 폴백

| # | 파일 | 요약 |
|---|------|------|
| A | `lib/relationship/relationshipReportQuery.ts` | `RR_SELECT_LEGACY`에 `result_premium`; FULL은 legacy+`by_kind`; `normalizeRow`; `updateRelationshipReportSafe` legacy 재시도 |
| B | `lib/relationship/fetchReportsWhereParticipant.ts` | `RelationshipReportRow.result_premium` 타입 |
| C | `lib/relationship/persistRomanticPremiumResult.ts` | romantic 저장: by_kind + legacy patch |
| D | `lib/relationship/invalidateRelationshipPremiums.ts` | 양쪽 컬럼 null |

### 1.2 폴백 헬퍼 / 완료 판정

| # | 파일 | 요약 |
|---|------|------|
| E | `lib/relationship/premiumByKind.ts` | `legacyPremiumPayload`, `hasPremiumCacheForKind(..., legacy)`, getters `byKind ?? legacy` |
| F | `lib/relationship/isRelationshipPremiumComplete.ts` | byKind + legacy + perspectives 폴백 |
| G | `lib/relationship/hubRelationshipSummary.ts` | list와 동일 판정에 `r.result_premium` 전달 |

### 1.3 API

| # | 파일 | 요약 |
|---|------|------|
| H | `app/api/relationship/analyze/premium/route.ts` | 캐시: `byKind[kind] ?? rr.result_premium`; 저장: by_kind + legacy; **응답 JSON 키 `result_premium`** |
| I | `app/api/relationship/detail/route.ts` | getters에 legacy 전달; `raw_premium` |
| J | `app/api/relationship/list/route.ts` | `isRelationshipPremiumComplete(..., result_premium, by_kind, kind)` |
| K | `app/api/relationship/status/route.ts` | **by_kind 무시**, `result_premium.perspectives`만 |
| L | `app/api/relationship/generate/route.ts` | select 문자열에 `result_premium` (legacy shape) |

### 1.4 스트림 · UI (응답 키 이름 = `result_premium`)

| # | 파일 | 요약 |
|---|------|------|
| M | `lib/relationship/premiumStream.ts` | `RomanticPremiumStreamComplete.result_premium` |
| N | `lib/relationship/romanticPremiumStreamHandler.ts` | complete 이벤트에 payload |
| O | `app/relationship/[id]/useRelationshipDetail.ts` | 스트림·JSON 응답의 `data.result_premium` 소비 |

> API/스트림 키 `result_premium`은 **DB 컬럼과 동명이지만 의미는 “이번 요청 kind의 payload”** 일 수 있음. 컬럼 삭제와 키 개명을 **별도 결정**(§6).

---

## 2. 파일별 사용 방식

### A. `relationshipReportQuery.ts`

| 동작 | 내용 |
|------|------|
| **읽기** | LEGACY select = 단일 `result_premium`만. FULL = + `result_premium_by_kind`, `relationship_kind`. 누락 컬럼 시 process-local `preferLegacySelect` |
| **쓰기** | `updateRelationshipReportSafe(fullPatch, legacyPatch)` — full 실패(컬럼 없음) 시 **`{ result_premium: payload }`만** update |
| **kind** | fullPatch에 보통 `relationship_kind: kind` 포함. legacy 경로에서는 kind 컬럼도 없을 수 있음 |

### B. `fetchReportsWhereParticipant.ts`

- 타입 필드만. 실제 select는 A 경유.

### C. `persistRomanticPremiumResult.ts`

| | |
|--|--|
| 저장 kind | **고정 `romantic`** |
| full | `result_premium_by_kind: { ...byKind, romantic: payload }`, `relationship_kind: "romantic"` |
| legacy | `{ result_premium: romanticPayload }` — 맵이 아니라 **단일 덮어쓰기** |

### D. `invalidateRelationshipPremiums.ts`

```text
update { result_premium: null, result_premium_by_kind: null }
```

- kind 무관 전체 클리어. 목표: `result_premium_by_kind: {}` (또는 null 정책 결정)만.

### E. `premiumByKind.ts`

| 함수 | legacy 역할 |
|------|-------------|
| `legacyPremiumPayload` | format으로 romantic/work/cohabitation 추론, 또는 bare `perspectives` |
| `hasPremiumCacheForKind(byKind, legacy, kind)` | `byKind[kind]` 없으면 **전체 legacy blob을 그 kind용으로** 검증 |
| getters | `byKind?.[kind] ?? legacyPremiumPayload(legacy)` |

→ DB에 단일 컬럼만 있을 때 “마지막에 쓴 kind”의 blob이 **다른 kind 조회에도 폴백**될 수 있음 (형식 맞으면 Hit).

### F. `isRelationshipPremiumComplete.ts`

1. `analysis_type !== "premium"` → false  
2. primary = `parseRelationshipKind(relationship_kind)` (**없으면 default `friendship`**)  
3. `hasPremiumCacheForKind(byKind, legacy, primary)`  
4. 다른 모든 RELATIONSHIP_KINDS도 legacy와 함께 스캔  
5. 마지막으로 **kind 없이** `legacy.perspectives` 존재하면 true  

→ “한 덩어리만 있으면 완료” 가정이 남아 있음.

### G / J. hub summary · list

- F와 동일 시그니처. 행의 `relationship_kind` + 두 컬럼 전달.

### H. `analyze/premium/route.ts`

| 단계 | 동작 |
|------|------|
| 요청 | body에서 kind 파싱 (명시적) |
| 캐시 hit | `hasPremiumCacheForKind(byKind, rr.result_premium, kind)` → `cached = byKind[kind] ?? rr.result_premium` |
| 저장 | `nextByKind[kind] = payload` + legacy `{ result_premium: payload }` |
| 응답 | `{ relationship_kind: kind, result_premium: payload }` ← **응답 키는 단일 payload** |

romantic는 stream 또는 `persistRomanticPremiumResult`; work/family/friendship/cohabitation은 동 패턴.

### I. `detail/route.ts`

- 활성 kind = query kind 또는 행 `relationship_kind`  
- deep/perspective: `getX(byKind, rr.result_premium)`  
- non-romantic: `raw_premium` = 단일 컬럼, `raw_premium_by_kind` = 맵  

### K. `status/route.ts` ⚠️

```text
has_premium =
  analysis_type === "premium"
  && result_premium?.perspectives   // by_kind·relationship_kind 미사용
```

- deep format(`report`만 있는 romantic 등)은 **false**가 될 수 있음.  
- kind 맵에만 있는 결과도 **무시**.

### L. `generate/route.ts`

- select에 `result_premium` 포함. (통합 텍스트 경로 — premium 맵 전환 시 select만 by_kind/제거 정리.)

### M–O. 스트림 · UI

- 요청 kind별로 `data.result_premium` 하나 파싱 (format/report 또는 perspectives).  
- UI는 **한 화면·한 kind**를 다루므로 “응답에 맵 전체”는 필수는 아님.  
- 다만 키 이름 `result_premium`이 DB 잔재와 혼동됨.

---

## 3. 1:1 대응 vs 애매

### 3.1 1:1로 기계적 전환 가능 (kind가 이미 있음)

| 위치 | 레거시 | 목표 |
|------|--------|------|
| persist / analyze **쓰기** | `by_kind[kind]=p` + `result_premium=p` | **`by_kind[kind]=p`만** (`relationship_kind` 갱신 유지) |
| 캐시 조회 (analyze) | `byKind[kind] ?? result_premium` | **`byKind[kind]`만** |
| detail getters | `(byKind, legacy)` | **`byKind`만** (legacy 인자 삭제) |
| invalidate | 두 컬럼 null | `result_premium_by_kind: {}` (또는 null) |
| Row 타입 / SELECT | 두 필드 | `result_premium` 제거, FULL만 |
| `updateRelationshipReportSafe` | full+legacy 이중 | **단일 update** (missing-column 폴백 삭제 — Dev hard cut) |

### 3.2 애매 · 추가 판단 필요

| ID | 이슈 | 설명 |
|----|------|------|
| **R1** | status `has_premium` | by_kind·kind·deep format 미반영. 재정의 필요 |
| **R2** | complete 판정 “아무 kind나 / perspectives만” | F의 step 4–5. 허브 “완료” 의미가 바뀜 |
| **R3** | API 응답 키 `result_premium` | DB 컬럼 폐기 후 키를 유지할지, `payload`/`premium`/`result`로 바꿀지 |
| **R4** | `raw_premium` (detail) | 단일 raw 노출을 제거할지, `raw_premium_by_kind`만 남길지 |
| **R5** | legacy blob → by_kind **백필** (Prod) | 단일 값을 어느 kind로 put할지 (보통 행의 `relationship_kind`) — Dev-only면 스킵 |
| **R6** | `preferLegacySelect` / missing-column 재시도 | Dev baseline에 `result_premium` 없음 → hard cut 시 분기 전부 |

---

## 4. 특별 표시

### 4.1 `relationship_kind`가 없거나 알 수 없는 저장/조회

| 코드 | 상황 | 현재 동작 | 사람 결정 포인트 |
|------|------|-----------|------------------|
| `parseRelationshipKind(null)` | 행 kind null/이상 | **fallback `friendship`** | fallback을 유지할지, “미완”으로 둘지 |
| `isRelationshipPremiumComplete` step 5 | kind 불명 blob에 perspectives만 | 아무 kind로도 “완료” | **폐지 권장** vs 유지 |
| `status` | kind·by_kind 무시 | perspectives만 | by_kind[행.kind] 또는 “임의 kind 하나라도” |
| `getPremiumPerspectiveForKind` legacy 가지 | kind ∉ 5종일 때만 legacy perspectives | 실질 dead | 삭제 |
| `updateRelationshipReportSafe` kind CHECK 실패 폴백 | kind 없이 jsonb만 update | kind 미기록 가능 | Dev CHECK 있으면 거의 불필요; 남기면 정책 명시 |
| analyze/persist **쓰기** | 요청/고정 kind 있음 | 문제 적음 | — |
| invalidate | kind 무관 전부 삭제 | OK | — |

**결론:** “kind 없이 쓰려는” 주 경로는 없고, **kind 없이 읽어서 완료/상태 판단**하는 곳이 위험 (F step 5, K).

### 4.2 “결과 하나” 가정 → “여러 kind”로 스펙이 바뀌는 곳

| 위치 | 단일 결과 가정 | 다 kind 이후 |
|------|----------------|--------------|
| **DB `result_premium`** | 마지막 심화 1건만 유지; 다른 kind 덮어씀 | 맵에 공존 → **컬럼 제거가 목적** |
| **legacy update patch** | 새 kind 저장 시 단일 슬롯 교체 | patch 자체 삭제 |
| **analyze 캐시 `?? result_premium`** | 다른 kind의 옛 blob을 현재 kind 캐시로 오인 가능 | by_kind[kind]만 |
| **status has_premium** | “perspectives 달린 그 한 blob” | 행 kind 또는 맵 임의 슬롯 / deep format |
| **complete step 5** | perspectives 한 덩이면 완료 | kind별 슬롯 검사만 |
| **detail `raw_premium`** | 단일 raw | 제거 또는 by_kind만 (**응답 shape 변경**) |
| **list/hub “premium 완료”** | 한 blob 또는 임의 kind hit | “활성 kind만” vs “하나라도” **제품 결정** |

**응답 shape를 굳이 안 바꿔도 되는 곳 (권장 해석):**

| 위치 | 이유 |
|------|------|
| analyze/premium JSON `{ relationship_kind, result_premium: payload }` | 이미 **이번 요청 kind의 슬라이스** |
| NDJSON stream `result_premium` | romantic 한 payload |
| UI `data.result_premium` | 요청한 kind만 파싱 |

→ 여기의 키 이름은 **호환용 별칭**으로 남겨도 됨. 다만 **DB 컬럼명과 분리**했다고 문서화하거나, 키 rename은 §6.

**응답 shape를 바꾸는 것이 맞는 곳:**

| 위치 | 방향 |
|------|------|
| detail `raw_premium` | 제거 또는 `raw_premium_by_kind`만 |
| status `has_premium` 계산 근거 | by_kind 기반 (클라이언트 필드는 bool 유지 가능) |

---

## 5. 수정 순서 제안

원칙: **타입·select hard cut → 헬퍼에서 legacy 인자 제거 → 쓰기 경로 → 읽기 API → UI/스트림 키(선택) → 테스트**.

| Step | 대상 | 이유 |
|------|------|------|
| **0** | Dev DB에 `result_premium` 없음 / hard cut 합의 | 컬럼 select 시 PostgREST 오류 |
| **1** | `RelationshipReportRow` + `RR_SELECT_*` | LEGACY/`result_premium` 제거. select는 FULL만 (`…, result_premium_by_kind, relationship_kind`) |
| **2** | `updateRelationshipReportSafe` | legacyPatch 매개변수·missing-column→legacy update 제거 (또는 no-op 단일 patch) |
| **3** | `premiumByKind.ts` | `legacyPremium` 인자·`legacyPremiumPayload` 삭제. 시그니처를 byKind+kind만 |
| **4** | `isRelationshipPremiumComplete` | legacy/`perspectives` 만으로 true 경로 삭제. 판정 규칙 §6 확정 후 |
| **5** | persist + analyze/premium **쓰기·캐시** | by_kind만; 응답 키는 당분간 유지 가능 |
| **6** | invalidate | by_kind만 clear |
| **7** | detail / list / hub | getters·complete 새 시그니처 |
| **8** | **status** | by_kind 기반으로 `has_premium` 재구현 (회귀 주의) |
| **9** | generate select 문자열 | `result_premium` 제거 |
| **10** | (선택) 스트림·UI·analyze JSON 키 rename | 제품/호환 결정 후 |
| **11** | detail `raw_premium` 정리 | 스펙 결정 후 |
| **12** | 단위/수동 검증 + LEGACY_CODE_AUDIT §2 done | |

**한 묶음 권장:** Steps 1–7 (+9).  
**분리:** Step 8(status), 10–11(응답 스펙), Prod 백필(이번 Dev 범위 밖).

---

## 6. 사람이 먼저 결정해야 하는 항목 (강조)

아래 합의 전 hard cut 구현·Prod 적용 금지에 가깝다. (Dev-only면 백필은 생략 가능.)

### 6.1 허브/리스트 “premium 완료” 의미

| 옵션 | 의미 |
|------|------|
| **A. 활성 kind만** | `by_kind[relationship_kind]`에 유효 캐시 |
| **B. 아무 kind나** | 맵에 하나라도 있으면 완료 (현재 step 4와 유사) |

권장: 제품 UX상 **A**. B는 “다른 탭만 돌려도 완료” 착시.

### 6.2 status `has_premium`

- deep(`format`+`report`) vs perspectives  
- 어느 kind 기준인지 (행 `relationship_kind` vs any)

### 6.3 API/스트림 응답 키 `result_premium`

| 옵션 | 장단 |
|------|------|
| **유지** | UI 미수정. DB 컬럼과 동명 혼동 |
| **개명** (`premium` / `payload`) | 깔끔. UI·클라이언트 동시 변경 |

Dev hard cut이어도 **1차 PR은 DB+서버 읽기/쓰기만, 키 유지를 기본 권장**.

### 6.4 detail `raw_premium`

디버그/비-romantic용. 제거 vs `raw_premium_by_kind`만.

### 6.5 Prod 백필 (이번 단계 비범위로 명시)

```text
result_premium_by_kind[relationship_kind] = result_premium
  WHERE result_premium IS NOT NULL
```

- `relationship_kind` null/잘못된 행  
- romantic deep vs perspectives 혼재  
은 **별도 컷오버**에서.

### 6.6 Dev-only hard cut

- `preferLegacySelect` / `result_premium` 이중 쓰기·읽기 **금지** (entitlement와 동일 정책).  
- 구 Prod 스키마에 이 코드 배포하지 말 것.

---

## 7. 완료 정의 (이후 구현 PR)

- [ ] SELECT/타입/update에 `result_premium` 컬럼 참조 없음  
- [ ] 저장·캐시·detail은 `result_premium_by_kind[kind]`만  
- [ ] `legacyPremium*` / `updateRelationshipReportSafe` legacy 경로 삭제  
- [ ] status·complete 판정이 §6 결정과 일치  
- [ ] (선택) 응답 키·`raw_premium` 정리  
- [ ] LEGACY_CODE_AUDIT §2 done  

**비범위:** entitlement, report_results(완료됨), RLS, `.env`, Prod 백필 실행.

---

## 8. 참조

- `docs/database/DB_ARCHITECTURE.md` — by_kind only, `result_premium` 제외  
- `docs/database/LEGACY_CODE_AUDIT.md` §2  
- `supabase/migrations/20260714140000_dev_baseline_ssot.sql` — `result_premium_by_kind`, `analysis_version`, pair unique index  
- `docs/database/ENTITLEMENT_MIGRATION_PLAN.md` — hard cut 진행 방식 참고
