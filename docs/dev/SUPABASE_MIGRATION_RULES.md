# Supabase 마이그레이션 작업 지침

> 2026-10-21 · Supabase 공지(2026-10-30부터 새 `public` 테이블에 Data API 권한 자동 부여 중단) 반영.
> 새 테이블·함수를 만드는 모든 마이그레이션에 적용한다.

## 1. 원칙

- **권한은 마이그레이션에 모두 적는다.** 플랫폼 기본값(default privileges)에 기대지 않는다.
  - 기존 운영 DB: 예전 기본값이 남아 있어 새 테이블·함수에 `anon`·`authenticated`·`service_role` 권한이 자동으로 붙을 수 있다.
  - 새 프로젝트·Preview 브랜치·`supabase db reset`: 10/30 이후 자동 부여가 없다.
  - 두 환경 모두에서 **같은 결과**가 나오도록, 필요한 권한은 GRANT로 주고 필요 없는 권한은 REVOKE로 명시적으로 뺀다.
- **공지의 `anon`/`authenticated` GRANT 예시를 모든 테이블에 일괄 적용하지 않는다.**
  - 이 앱은 Supabase를 **서버에서 `service_role`로만** 쓴다. 브라우저 Supabase 클라이언트는 없다.
  - 따라서 기본은 `anon`/`authenticated` 권한 없음이다.
  - 클라이언트 직접 접근이 정말 필요한 테이블만, 필요한 동작만, RLS 정책과 함께 따로 결정해서 준다.

## 2. 새 테이블 (public)

```sql
create table if not exists public.example (...);

alter table public.example enable row level security;      -- 항상 켠다 (정책 없음 = 클라이언트 차단)
revoke all on table public.example from public, anon, authenticated, service_role;
grant select, insert on table public.example to service_role;   -- 서버 코드가 실제로 하는 동작만
```

- RLS는 항상 켠다. `service_role`은 RLS를 우회하지만, 실수로 클라이언트 권한이 생겨도 막히게 하려는 것이다.
- `service_role`도 `revoke all` 후 **필요한 동작만** 준다. update·delete·truncate는 코드가 쓸 때만 준다.
- 시퀀스(`serial`/`identity`)가 있으면 같은 방식으로 시퀀스 권한도 적는다. uuid 기본값이면 필요 없다.
- 외래키 `on delete cascade`는 테이블 소유자 권한으로 실행되므로, 그것 때문에 delete 권한을 줄 필요는 없다.

## 3. 새 함수

```sql
create or replace function public.example_rpc(...) ... security definer set search_path = public ...;

revoke all on function public.example_rpc(...) from public, anon, authenticated;
grant execute on function public.example_rpc(...) to service_role;   -- 서버가 rpc()로 부르는 것만
```

- PostgreSQL은 새 함수의 실행 권한을 기본적으로 모두(`PUBLIC`)에게 준다. 예전 Supabase 기본값은 `anon`·`authenticated`에게도 직접 준다.
  - 그래서 `revoke ... from public`만으로는 부족하다. **`anon, authenticated`를 함께 적는다.**
- 트리거 함수와, security definer 함수 안에서만 쓰는 보조 함수는 호출자 권한이 필요 없다. 이런 함수는 `public, anon, authenticated, service_role` 모두에게서 회수한다.
  - 트리거는 실행 권한과 관계없이 동작한다.
- `security definer` 함수에는 항상 `set search_path = public`을 붙인다.

## 4. 검증 (마이그레이션 PR·배포 전 필수)

- [ ] 새 테이블마다 RLS on, GRANT/REVOKE가 마이그레이션 안에 있다.
- [ ] 새 함수마다 REVOKE(`public, anon, authenticated`)와 필요한 GRANT가 있다.
- [ ] **기본값이 달라도 같은 권한이 재현되는지** 로컬에서 확인한다.
  - 예전 기본값(자동 부여)과 새 기본값(부여 없음) 두 DB를 처음부터 만들어 비교한다.
  - 새 DB, Preview, `db reset`이 같은 경로(빈 DB → `supabase/migrations` 순서대로 적용)이므로 이 비교로 함께 확인된다.
  - 예시: `PGHOST=/tmp PGPORT=54329 PGUSER=postgres bash tests/db/privilege-regimes.sh` (계정 통합 객체 대상, 새 객체를 만들면 목록에 추가)
- [ ] 운영 DB에 적용한 뒤 읽기 전용으로 실제 권한을 확인한다.
  - `has_table_privilege` / `has_function_privilege`를 역할별(`anon`, `authenticated`, `service_role`)로 조회한다.
  - 로컬 결과와 일치해야 한다.
- [ ] 운영 적용은 단일 트랜잭션 사본(`begin; set local lock_timeout = '5s'; … commit;`)과 되돌리기 SQL을 함께 준비한다.
