# Development DB Setup — ahaitsme-dev

> **기준 SSOT:** [`DB_ARCHITECTURE.md`](./DB_ARCHITECTURE.md)  
> **Baseline SQL:** `supabase/migrations/20260714140000_dev_baseline_ssot.sql`  
> **대상:** 빈 Development 프로젝트만 (`ahaitsme-dev`)  
> **금지:** Production / 기존 고객 DB에 이 baseline 적용

---

## 1. 전제

- Development Supabase 프로젝트는 **이미 생성**되어 있다고 가정한다.
- DB는 **테이블이 거의 없는 빈 상태**여야 한다 (baseline은 `CREATE`만 포함).
- 이 문서는 **적용 가이드**다. CI/에이전트가 임의로 실행하지 않는다.
- `.env.local` / Vercel env / 배포는 **별도 승인 단계**에서만 변경한다.

---

## 2. 적용 순서 (사람 손)

1. Supabase Dashboard → 프로젝트 **`ahaitsme-dev`** 선택  
2. SQL Editor 열기  
3. `supabase/migrations/20260714140000_dev_baseline_ssot.sql` 전체 내용 붙여넣기  
4. 실행 (트랜잭션 `BEGIN`…`COMMIT` 포함)  
5. 아래 **확인 방법**으로 8테이블·RLS 확인  
6. (이후 단계) 앱이 Dev를 가리키도록 env를 **수동** 교체 — 이번 문서 범위 밖

CLI로 적용할 경우에도 **프로젝트 ref가 Dev인지** 두 번 확인한 뒤에만 실행한다.

Dev 환경은 baseline migration만 적용합니다.
`20260713180000_relationship_logs_favorites_rls.sql` 등
그 이전 개별 migration들은 레거시(기존) DB를 순차적으로
업데이트할 때만 사용하며, Dev 신규 생성 시에는 적용하지
않습니다.

---

## 3. Production 적용 금지

```text
이 baseline을 Production 또는 기존 고객 데이터가 있는 DB에 실행하지 마세요.
레거시 컬럼(payment_status, plan_type, result_premium, report_results 등)과
충돌·데이터 유실을 일으킬 수 있습니다.
```

Production 정렬은 별도 마이그레이션·컷오버 계획으로만 진행한다.

---

## 4. 확인 방법

SQL Editor에서:

```sql
-- 8 core tables
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'reports',
    'survey_responses',
    'report_analyses',
    'relationship_reports',
    'invites',
    'relationship_analysis_logs',
    'relationship_favorites',
    'person_core_blueprints'
  )
order by tablename;
-- expect: 8 rows

-- Must NOT exist
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'report_results',
    'saju_charts',
    'pattern_base',
    'generated_images',
    'launch_settings'
  );
-- expect: 0 rows

-- RLS enabled, zero policies (fail-closed for anon/auth role)
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'reports',
    'survey_responses',
    'report_analyses',
    'relationship_reports',
    'invites',
    'relationship_analysis_logs',
    'relationship_favorites',
    'person_core_blueprints'
  )
order by 1;
-- expect: rls_enabled = true for all 8

select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in (
    'reports',
    'survey_responses',
    'report_analyses',
    'relationship_reports',
    'invites',
    'relationship_analysis_logs',
    'relationship_favorites',
    'person_core_blueprints'
  );
-- expect: 0 rows

-- entitlement column present; payment_status / plan_type absent
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reports'
  and column_name in ('entitlement', 'payment_status', 'plan_type');
-- expect: entitlement only

-- result_premium_by_kind present; result_premium absent
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'relationship_reports'
  and column_name in ('result_premium', 'result_premium_by_kind', 'analysis_version');
-- expect: result_premium_by_kind, analysis_version
```

**RLS policy는 이후 단계에서 추가 예정이며, 그 전까지 anon key로 조회 시 빈 결과가 나오는 것은 정상입니다.**

서버 API는 **service_role**로 RLS를 우회한다. 앱을 Dev에 연결한 뒤에는 API 경유 읽기/쓰기만 검증한다.

---

## 5. Rollback 방법

Baseline은 빈 Dev용 **한 방 CREATE**다.

권장 롤백:

1. Supabase에서 **Development 프로젝트 재생성**, 또는  
2. Dashboard에서 public 테이블 전부 삭제 후 baseline 재실행  

부분 `DROP` 순서는 FK 때문에 안전하지 않을, **프로젝트 재생성**을 기본 Rollback으로 둔다.

Seed·고객 데이터 복사는 하지 않는다.

---

## 6. 이 baseline 이후 앱 코드 정렬 (참고)

DB는 SSOT이고, **현재 앱은 아직 구 컬럼명을 읽을 수 있다.**  
Dev 연결 전·후에 필요한 코드 작업(별도 단계):

- `payment_status` / `plan_type` → `entitlement`
- `result_premium` fallback → `result_premium_by_kind`만
- `report_results` legacy read 제거
- `report_type: 'relationship'` insert 제거 (`self` | `partner_manual`)

이 문서만으로 env를 바꾸거나 배포하지 말 것.

---

## 7. Checklist before apply

- [ ] Dashboard 프로젝트가 `ahaitsme-dev`인가  
- [ ] Production ref가 아닌가  
- [ ] DB에 기존 고객 테이블/데이터가 없는가  
- [ ] `DB_ARCHITECTURE.md`와 SQL이 일치하는지 훑었는가  
- [ ] 적용 후 §4 확인 쿼리를 실행할 것인가  
