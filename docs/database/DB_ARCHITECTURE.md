# Ah, It's Me — Database Architecture (SSOT)

> **지위:** Development DB 생성·migration·배포의 단일 기준 문서  
> **범위:** 논리 스키마·관계·정책 (SQL 파일 아님)  
> **작성 기준일:** 2026-07-14  
> **전제:** Clerk 소유권 + Server service-role API. RLS JWT 브리지는 다음 단계.

이 문서는 “지금 코드가 우연히 기대하는 컬럼”이 아니라,  
앞으로 3~5년 제품 파이프라인에 맞춘 **최종 목표 구조**를 정의한다.  
기존 레거시는 Dev DB에 이식하지 않는다. 앱 코드는 이후 이 SSOT에 정렬한다.

---

## 1. Architecture Philosophy

### 1.1 제품 축 = 데이터 축

```text
Report (사람 한 명의 프로필 원장)
  → Survey (현재 나 입력)
  → PersonCore Blueprint (계산·정규화 캐시)
  → Analyses (혼자 보는 AI 결과 캐시)
  → Relationship (두 Report 사이의 산출물)
  → Journal / Decision / Memory (향후, Report에 종속)
```

DB는 이 파이프라인을 **테이블 경계로 그대로 드러낸다.**  
기능이 API·프롬프트 안에만 있으면 경계가 흐려지므로, 영속 단위는 명시적으로 둔다.

### 1.2 선택 원칙

| 원칙 | 적용 |
|------|------|
| 테이블은 적게 | MVP 핵심 **8개**. 결제·저널 등은 **예비 경계만 문서화**하고 즉시 CREATE하지 않음 |
| 컬럼 하나의 의미 | Premium 여부는 `entitlement` 하나로 통일. `payment_status`∩`plan_type` 이중화 폐기 |
| 레거시 배제 | `report_results`, guest/orphan/merge, `ref_*` 런타임 테이블, `saju_charts` 등 Dev에 없음 |
| JOIN 과다 금지 | MVP에서 Report ≈ User Profile. `users` 앱 테이블을 새로 만들지 않음 (Clerk가 IdP) |
| 서버만 쓰기 | 브라우저 → PII 테이블 직접 접근 없음. entitlement·ownership은 서버만 변경 |
| 확장 시 ALTER보다 행·JSON | LLM/Blueprint 버전은 **행 + `schema_version` / `engine_version` / analysis 타입·metadata**로 흡수 |

### 1.3 의도적으로 하지 않는 것 (지금)

- Clerk JWT ↔ Supabase RLS 연동 (다음 단계)
- 정규화된 `people` / `accounts` 분리 (Clerk + Report로 충분할 때까지)
- 만세력 `ref_*`를 DB에 두기 (이미 `lib/hardcoded`·코드 레퍼런스)
- Guest UUID·orphan claim용 null `clerk_user_id` 허용 (정책상 금지)

---

## 2. ERD (텍스트)

### 2.1 MVP 핵심 (8)

```text
                    ┌─────────────┐
                    │   reports   │  ← Clerk user owns 0..n
                    └──────┬──────┘
           ┌───────────────┼───────────────┬────────────────┐
           ▼               ▼               ▼                ▼
   survey_responses  person_core_   report_analyses    invites
                     blueprints                         (from /
                                                        accepted)
           │               ▲
           └───────────────┘ source_survey_response_id (optional)

                    reports ◄────► reports
                         \        /
                          \      /
                     relationship_reports
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     analysis_logs   favorites      invites.relationship_report_id
```

### 2.2 파이프라인 정렬

```text
Report
  ↓ 1:N
Survey
  ↓ builds
PersonCore Blueprint (1:1 report)
  ↓ feeds
Report Analyses (1:N by analysis_type)
  ↓ (pair)
Relationship Report
  ↓
Logs / Favorites
```

### 2.3 향후 (문서상 경계만)

```text
reports
  ├── subscriptions / entitlements_ledger  (다상품·기간제)
  ├── journals
  ├── decisions
  └── memories (또는 journal 하위)
```

MVP CREATE 목록에는 **넣지 않는다.** 넣기 전에 이 문서 §11을 갱신한다.

---

## 3. 테이블 명세

---

### 3.1 `reports`

| 항목 | 내용 |
|------|------|
| **목적** | 한 사람의 제품성·출생·표시명·상품 권한의 **원장**. “서비스 안의 나/상대” |
| **왜 존재하는가** | Clerk는 인증만 한다. 제품 단위의 사람·출생·관계는 Report ID로 묶인다 |
| **주요 컬럼** | `id` (uuid PK), `clerk_user_id` (text NOT NULL), `name`, `birth_date`, `birth_time`, `birth_place`, `birth_latitude`, `birth_longitude`, `birth_timezone`, `birth_date_correction_used_at`, `report_type`, **`entitlement`**, `created_at`, `updated_at` |
| **PII** | name, birth_*, 좌표 — **예**. `clerk_user_id`는 간접 식별자 |
| **Owner** | `clerk_user_id` = Clerk `userId`. `partner_manual`도 생성자(조회자) 소유로 기록 |
| **삭제 정책** | 계정 삭제/말소 시 해당 `clerk_user_id`의 reports CASCADE로 자식 정리 |
| **RLS (예정)** | anon deny all. 이후 JWT 시 `clerk_user_id = jwt.sub`. 지금은 service-role only |
| **참조 API** | `/api/report/create`, birth, my/report, home/resume, ownership helpers, relationship\* |
| **향후 확장** | `locale`, soft-delete `deleted_at`. 구독이 복잡해지면 entitlement는 ledger로 이전하고 여기엔 **캐시 뷰 컬럼**만 남김 |

**폐기 컬럼 (목표 스키마):** `payment_status`, `plan_type` → `entitlement`로 대체.

---

### 3.2 `survey_responses`

| 항목 | 내용 |
|------|------|
| **목적** | 로그인 후 저장된 v2 설문 원본 (`answers` jsonb) |
| **왜** | Blueprint/PersonCore 입력이며, 재설문·감사(audit) 단위 |
| **주요 컬럼** | `id`, `report_id` → reports CASCADE, `answers` jsonb, `created_at` |
| **PII** | **예** (답변·임베디드 profile) |
| **Owner** | 부모 report 소유자 |
| **삭제** | report CASCADE. 재설문 시 이전 행 삭제 또는 append-only(제품 결정) — **MVP는 최신 1건 조회 + redo 시 delete** |
| **RLS 예정** | 부모 소유만. service-role now |
| **API** | `/api/v2/survey`, relationship/manual, PersonCore sources |
| **확장** | `survey_version`, append-only history 테이블로 승격 가능 |

로그인 전 설문은 **DB에 쓰지 않음** (sessionStorage).

---

### 3.3 `person_core_blueprints`

| 항목 | 내용 |
|------|------|
| **목적** | 설문+사주(+메타)를 정규화한 **계산 캐시 / SSOT 스냅샷** |
| **왜** | LLM·관계 심화가 동일 입력을 재사용. 재계산 비용·드리프트 방지 |
| **주요 컬럼** | `id`, `report_id` UNIQUE → reports CASCADE, `schema_version`, `input_fingerprint`, `engine_version`, `built_at`, `user_meta`, `saju_master_json`, `psych_master_json`, `source_survey_response_id` → survey SET NULL, timestamps |
| **PII** | jsonb 내 간접 PII 가능 — **민감 취급** |
| **Owner** | report 소유 |
| **삭제** | report CASCADE. 입력 변경 시 invalidate(delete/rebuild) |
| **API** | personCore load/upsert/invalidate; premium/relationship 입력 |
| **확장** | `saju_master_v3` 등은 CHECK/스키마 버전으로 수용. 테이블 쪼개지 않음 |

---

### 3.4 `report_analyses`

| 항목 | 내용 |
|------|------|
| **목적** | Report 단위 AI/차트 **결과 캐시** (혼자 보는 분석) |
| **왜** | 재호출 비용 절감, 위치 fingerprint로 astrology 무효화 |
| **주요 컬럼** | `id`, `report_id` CASCADE, `analysis_type`, `content`, `metadata` jsonb, timestamps; UNIQUE `(report_id, analysis_type)` |
| **PII** | content에 분석 서술 — **민감** |
| **Owner** | report |
| **삭제** | report CASCADE; 타입별 명시 delete |
| **API** | my/report, birth, LLM persist helpers |
| **확장** | type enum에 새 파이프라인 추가. `metadata.model`, `metadata.prompt_version` |

**목표 analysis_type:** `basic` \| `integrated` \| `detailed_survey` \| `astrology`  
(구 CHECK의 `premium`/`relationship` 문자열은 Report 단위 캐시에 쓰지 않음 — 관계는 `relationship_reports`.)

---

### 3.5 `relationship_reports`

| 항목 | 내용 |
|------|------|
| **목적** | 두 Report 사이의 관계 분석 원장 |
| **왜** | 초대·허브·심화의 중심 엔티티. pair는 순서 무관 unique |
| **주요 컬럼** | `id`, `report_id_a`, `report_id_b`, `analysis_type` (`basic`\|`premium`), `relationship_kind`, `result_basic` jsonb, **`result_premium_by_kind` jsonb**, timestamps |
| **PII** | 결과 jsonb — **민감** |
| **Owner** | 참여자 중 한 명이 조회; **결제 플래그는 행의 analysis_type + 각 report entitlement**로 서버 판정 |
| **삭제** | 참여자 report CASCADE |
| **API** | relationship analyze/upgrade/detail/list/favorite/logs… |
| **확장** | kind 추가; by_kind 키만 증가 |

**목표에서 제외:** `result_premium` 단일 컬럼 (아래 §검토).

---

### 3.6 `invites`

| 항목 | 내용 |
|------|------|
| **목적** | 관계 연결을 위한 초대 토큰 상태기계 |
| **왜** | 비밀번호 없는 링크 수락; race는 `status=open` 조건부 갱신 |
| **주요 컬럼** | `id`, `from_report_id` → reports, `invite_token` UNIQUE, `invite_type`, `status` (`open`\|`complete`), `accepted_report_id` → reports NULL, `relationship_report_id` → RR SET NULL, `created_at`, (선택) `expires_at` |
| **PII** | token은 **비밀에 준함**. 상대 PII는 status API에 넣지 않음 |
| **Owner** | from_report 소유자만 생성/취소; 수락은 accepted report 소유자 |
| **삭제** | from CASCADE 권장; 취소용 hard delete 또는 status=cancelled (제품 선택) |
| **API** | invite create/complete/cancel/status, list/generate |
| **확장** | expiry, rate bucket, gift invite type |

---

### 3.7 `relationship_analysis_logs`

| 항목 | 내용 |
|------|------|
| **목적** | 분석 실행 스냅샷·감사용 append-only에 가까운 로그 |
| **왜** | 재생성·디버그·허브 “최근 분석” |
| **주요 컬럼** | `id`, `relationship_report_id`, `viewer_report_id`, `relationship_kind`, `analysis_level`, `result_format`, `result_snapshot`, `created_at` |
| **PII** | snapshot — **민감** |
| **Owner** | viewer report |
| **삭제** | RR/viewer CASCADE |
| **API** | analyze persist, logs, list summary |
| **확장** | retention job; `model_version` 컬럼 |

---

### 3.8 `relationship_favorites`

| 항목 | 내용 |
|------|------|
| **목적** | viewer 기준 관계 즐겨찾기 |
| **왜** | 허브 UX. jsonb에 넣지 않는 이유: viewer별·쿼리·삭제 명확 |
| **주요 컬럼** | PK `(viewer_report_id, relationship_report_id)`, `created_at` |
| **PII** | 없음 (ID만) |
| **Owner** | viewer |
| **삭제** | CASCADE |
| **API** | favorite, list |
| **확장** | pin order |

---

## 4. 유지 · 통합 · 삭제 요약

| 대상 | 결정 | 사유 |
|------|------|------|
| reports | **유지** | 제품 원장. MVP에서 User Profile 역할 유지가 JOIN·Clerk 단순성에 유리 |
| survey_responses | **유지** | 입력 SSOT |
| person_core_blueprints | **유지** | 계산 캐시·버전 앵커 |
| report_analyses | **유지** | 개인 AI 캐시 |
| relationship_reports | **유지** | 관계 원장 |
| invites | **유지** | 초대 상태기계 |
| relationship_analysis_logs | **유지** | 감사·히스토리 |
| relationship_favorites | **유지** | 작은 테이블로 충분한 UX |
| payment_status + plan_type | **통합 → `entitlement`** | 동일 의미 중복; 서버 단일 필드 |
| result_premium + result_premium_by_kind | **by_kind만 유지** | romantic 포함 모든 kind가 맵 키로 충분; legacy 컬럼 제거로 fallback 코드 삭제 |
| report_results | **삭제 (목표)** | analyses로 이관 완료 가정; fallback 코드 제거 후 Dev에 미생성 |
| saju_charts, ref_*, pattern_base, users, generated_images, launch_settings | **삭제 (목표)** | 프로덕션 `.from` 없음; 코드·하드코드로 대체 |
| guest/merge/claim | **삭제** | 제품 정책; null clerk_user_id 불허 |
| browser Supabase PII | **삭제** | client 유틸은 dead; 유지해도 `.from` 금지 |

**8개가 최적인가?**  
MVP에 필요충분한 최소치에 가깝다. 더 줄이면:

- favorites → RR jsonb: 권장하지 않음 (viewer 다중·쿼리)
- survey → reports.answers: PersonCore fingerprint·재설문·삭제 단위가 흐려짐  
→ **8 유지가 최적.**

---

## 5. Enum 설계

논리 enum (DB는 text + CHECK 또는 앱 enum 검증).

### `ReportType`
`self` \| `partner_manual`  
(초대 유입도 본인 report는 `self`. `relationship` report_type은 **폐기** — 관계는 `relationship_reports`가 담당.)

### `Entitlement` (reports)
`free` \| `premium`  
- 서버만 변경  
- 결제·어드민·쿠폰·선물 모두 이 필드로 **환원된 결과**를 씀  
- 상세 이력은 향후 `subscriptions` / ledger

### `RelationshipKind`
`romantic` \| `family` \| `work` \| `friendship` \| `cohabitation` \| `unspecified` (logs only)

### `RelationshipAnalysisLevel` / row `analysis_type`
`basic` \| `premium`  
(행 단위 “심화 잠금 해제” — report entitlement와 별개로 RR에 기록)

### `ReportAnalysisType`
`basic` \| `integrated` \| `detailed_survey` \| `astrology`

### `InviteStatus`
`open` \| `complete`  
(취소는 delete 또는 향후 `cancelled`)

### `InviteType`
`relationship` (향후 `gift` 등)

### `SubscriptionStatus` (향후 테이블)
`active` \| `canceled` \| `past_due` \| `trialing` \| `expired`

앱 검증: `lib/security/requestValidation` · 기존 kind parsers와 정렬.

---

## 6. Index 전략

| Index | 이유 |
|-------|------|
| `reports (clerk_user_id, created_at desc)` | resume·목록·idempotent create |
| `survey_responses (report_id, created_at desc)` 또는 `(report_id, id desc)` | 최신 설문 |
| `report_analyses UNIQUE (report_id, analysis_type)` | upsert 충돌·조회 |
| `relationship_reports UNIQUE (least(a,b), greatest(a,b))` | pair 중복 방지 |
| `relationship_reports (report_id_a)`, `(report_id_b)` | 참여자 허브 |
| `invites UNIQUE (invite_token)` | 수락 조회 |
| `invites (from_report_id, status)` | 발신·정리 |
| `relationship_analysis_logs (relationship_report_id, viewer_report_id, created_at desc)` | 로그 API |
| `person_core_blueprints UNIQUE (report_id)`, `(input_fingerprint)` | 로드·재사용 |
| favorites PK | 자연 인덱스 |

과도한 GIN은 PersonCore psych axes 정도만 MVP에서 허용(이미 패턴 존재).

---

## 7. Foreign Key 전략

| 관계 | ON DELETE | 이유 |
|------|-----------|------|
| survey → reports | **CASCADE** | 사람 삭제 = 입력 삭제. 고아 설문 금지 |
| analyses → reports | **CASCADE** | 동일 |
| person_core → reports | **CASCADE** | 동일 |
| person_core → survey | **SET NULL** | 설문 redo 후에도 blueprint 잠시 잔존 가능; fingerprint로 재구축 |
| RR → reports a/b | **CASCADE** | 한쪽 프로필 삭제 시 관계 무효 |
| logs/favorites → RR / viewer | **CASCADE** | 종속 UX 데이터 |
| invites.from → reports | **CASCADE** | 발신자 없으면 초대 무의미 |
| invites.accepted → reports | **SET NULL** | 수락자 삭제 후에도 “완료된 초대” 감사 가능(선택). 단순화 원하면 CASCADE |
| invites.rr → RR | **SET NULL** | RR 재생성 여지 |

**RESTRICT**는 MVP에서 거의 쓰지 않음 — 삭제 UX가 “말소” 중심이라 CASCADE가 단순.

---

## 8. PII 관리

### 8.1 PII / 민감 컬럼

| 테이블 | 컬럼 | 등급 |
|--------|------|------|
| reports | name, birth_*, coords | PII |
| reports | clerk_user_id | 간접식별 |
| survey_responses | answers | PII |
| person_core_* json | 내용 | 민감 |
| report_analyses.content | | 민감 |
| relationship_* results/snapshots | | 민감 |
| invites.invite_token | | 비밀 |

### 8.2 암호화

- **MVP:** Postgres + service-role + 전송 HTTPS. 컬럼 암호화는 필수 아님  
- **이후:** 토큰·백업 접근 분리, 필요 시 `name`/birth application-level encrypt  
- 로그에는 **maskId / 코드만** (현 보안 패치와 동일)

### 8.3 삭제 요청 (Right to erasure)

1. Clerk 사용자에 속한 모든 `reports` 식별  
2. reports 삭제 → FK CASCADE로 자식 제거  
3. `partner_manual`이 타인 관계에만 묶인 경우: 해당 report도 생성자 소유이므로 함께 삭제 또는 anonymize 정책 명시  
4. invite token·분석 스냅샷 백업이 있다면 동일 job에서 purge  
5. 외부 LLM 로그는 보관하지 않는 것이 전제

---

## 9. Caching 전략

| 캐시 | 저장소 | 키 / 무효화 |
|------|--------|-------------|
| PersonCore | `person_core_blueprints` | `report_id`, `input_fingerprint`. 출생·설문 변경 시 invalidate |
| 개인 AI | `report_analyses` | `(report_id, analysis_type)`. astrology는 location fingerprint metadata |
| 관계 basic/premium | `relationship_reports` jsonb | kind별 by_kind; 설문/코어 변경 시 premium null |
| 메모리 rate limit | 앱 (Upstash 예정) | DB 아님 |
| Premium access 짧은 TTL | 프로세스 메모리 | entitlement 변경 시 invalidate |

**원칙:** 캐시는 재현 가능해야 한다. 원본은 survey + birth + entitlement.

---

## 10. Versioning (DB 변경 최소화)

| 진화 | 전략 |
|------|------|
| LLM v2/v3 | `report_analyses.metadata` (`model`, `prompt_version`); 필요 시 content 재생성 |
| Blueprint 스키마 | `person_core_blueprints.schema_version` / json 내부 `schema_version`; CHECK 완화 |
| 사주 엔진 | `engine_version` |
| 관계 심화 포맷 | `result_premium_by_kind[kind].format` |
| API 계약 | 테이블 추가보다 jsonb 필드 추가 우선 |

새 기능이 **새로운 생명주기**(구독 기간, 저널 엔트리)를 가지면 그때 테이블을 추가하고 §2·§11을 갱신한다.

---

## 11. 향후 확장

### 11.1 Subscription / Gift / Coupon / Admin Grant

**권고:** MVP는 `reports.entitlement`만.  
다상품·기간·환불이 생기면:

```text
subscriptions
  id, clerk_user_id, report_id nullable,
  sku, status, current_period_end, source (stripe|admin|gift|coupon),
  created_at
```

`reports.entitlement`는 **유도된 캐시**(주기적/웹훅 갱신)로 남기거나, 읽기 시 join.

Gift/Coupon은 `grants` 또는 subscription `source`로 흡수.

### 11.2 Journal / Decision / Memory

```text
journals (report_id, …)
journal_entries (journal_id, body, …)
decisions (report_id, prompt, outcome, …)
memories (report_id, kind, payload, …)  -- 또는 entry 파생
```

모두 `report_id` CASCADE. Relation은 optional FK later.

### 11.3 Admin

별도 `admin_audit_log` (who granted entitlement). 앱 `users` 테이블 불필요.

---

## 12. 특별 검토 결론 (질문에 대한 결정)

### 1) `payment_status` + `plan_type` → `entitlement`?

**예. 목표 스키마는 `entitlement` 단일 필드.**  
의미 중복을 제거하고 서버 하드코딩·가드가 한 경로만 본다.  
레거시 코드 정렬 시 `paid`/`free` 매핑 레이어를 짧게 둔 뒤 제거.

### 2) `result_premium` vs `result_premium_by_kind`?

**`result_premium_by_kind`만 유지.**  
romantic도 `by_kind.romantic`에 둔다. `result_premium` 및 legacy select fallback은 목표에서 삭제.

### 3) `report_results` 삭제?

**예.** Dev에 생성하지 않음. `readLegacyBasicFromReportResults` 제거가 선행/동시 조건.

### 4) reports가 역할이 많은가?

**MVP에서는 유지가 맞다.**  
“사람 프로필 + 출생 + entitlement 캐시”는 한 원장이 조인을 줄인다.  
Clerk Identity와 제품 Profile을 억지로 나누면 초기 복잡도만 오른다.  
구독·저널이 커지면 entitlement·저널만 외부화.

### 5) Subscription을 reports 안 vs 테이블?

**MVP: reports.`entitlement`.**  
**성장기: `subscriptions`(또는 entitlements ledger) + reports 캐시.**  
처음부터 테이블을 두면 결제 없이도 스키마·코드 경로가 비대해진다.

### 6) 8개가 최적인가 / 더 줄일 수 있나?

**8 = MVP 최적.**  
6으로 줄이면 favorites/logs/survey 중 하나를 jsonb로 녹이게 되고, 삭제·권한·버저닝이 어려워진다.  
10+는 Journal/Subscription 도입 시점.

---

## 13. MVP CREATE 대상 체크리스트 (아직 SQL 작성 금지)

1. `reports` (baseline + `entitlement`, `clerk_user_id NOT NULL`)  
2. `survey_responses` (+ FK CASCADE)  
3. `person_core_blueprints`  
4. `report_analyses` (좁힌 type CHECK)  
5. `relationship_reports` (`result_premium_by_kind` only)  
6. `invites` (baseline FKs)  
7. `relationship_analysis_logs`  
8. `relationship_favorites`  
9. indexes §6  
10. RLS enable + **policies none** (service-role)  

**금지:** report_results, ref_*, saju_charts, guest null owner, JWT draft policies without Clerk bridge.

---

## 14. 코드 정렬 부채 (문서만; 구현은 후속)

목표 스키마 적용 전후 앱에서 손볼 항목:

- `isReportPremium` / create route → `entitlement`
- `relationshipReportQuery` legacy `result_premium` path 삭제
- `reportAnalyses` legacy `report_results` 삭제
- `ReportType`에서 `relationship` 정리
- invite `expires_at` (선택)
- dead `lib/supabase/client` PII 사용 금지 유지

---

## 15. 문서 운영

| 이벤트 | 행동 |
|--------|------|
| 새 테이블/컬럼 제안 | 이 문서 §2–3·§11 먼저 수정 → 그다음 migration |
| Dev DB 생성 | 이 문서 §13만 구현 |
| 보안 RLS JWT | 별도 decision + 이 문서 §3 RLS 절 갱신 |

**SSOT 선언:** migration·Development DB·스키마 리뷰는 `docs/database/DB_ARCHITECTURE.md`와 모순되면 무효로 본다.
