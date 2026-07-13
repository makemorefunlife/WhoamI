# 배포 체크리스트 (프로덕션)

코드 배포 전·후에 **반드시** 확인합니다. 릴리즈 문서 톤은 `docs/v2/dev/RELEASE_CHECKLIST.md`를 따릅니다.

---

## 1. DB 마이그레이션 (필수)

PersonCore가 `saju_master_v2`(+ `domain_signals`)를 upsert하므로, 아래 CHECK 완화 마이그레이션이 **프로덕션에 적용되어 있어야** 합니다.

| 항목 | 값 |
|------|-----|
| 파일 | `supabase/migrations/20260713140000_person_core_saju_schema_v2.sql` |
| 변경 | `person_core_blueprints_saju_schema` → `saju_master_v1` **또는** `saju_master_v2` 허용 |
| 미적용 시 | PersonCore upsert CHECK 위반 → 관계 Premium·처방전 파이프라인 전체 실패 |

### 1-1. 적용 여부 확인

`.env.local`에 `DATABASE_URL` 또는 `SUPABASE_DB_PASSWORD` + `NEXT_PUBLIC_SUPABASE_URL` 설정 후:

```bash
node tests/scripts/verify-person-core-saju-schema-v2.mjs
```

- **exit 0** + `OK: ... allows saju_master_v1 and saju_master_v2` → 통과
- **exit 1** → 아래 적용 단계 진행

JSON 출력:

```bash
node tests/scripts/verify-person-core-saju-schema-v2.mjs --json
```

### 1-2. 미적용 시 적용

```bash
node tests/scripts/apply-supabase-migration.mjs supabase/migrations/20260713140000_person_core_saju_schema_v2.sql
```

또는 Supabase Dashboard → SQL Editor에 동일 DDL 붙여넣기 (`supabase/APPLY_PENDING_MIGRATIONS.sql` §6 참고).

적용 후 **반드시** 1-1 검증을 다시 실행합니다.

---

## 2. 코드·빌드 (필수)

- [ ] `npx tsc --noEmit` — exit 0
- [ ] `git status` — 의도하지 않은 변경·`.env` 미포함
- [ ] Vercel(또는 호스트) 환경변수 — `SUPABASE_SERVICE_ROLE_KEY`, Clerk, OpenAI 등

---

## 3. 배포 후 스모크 (권장)

- [ ] 관계 Premium 1건 — PersonCore 빌드·저장 성공 (500/CHECK 에러 없음)
- [ ] `person_core_blueprints`에 `schema_version = saju_master_v2` 행 insert/upsert 확인

---

## 관련 스크립트

| 스크립트 | 용도 |
|----------|------|
| `tests/scripts/verify-person-core-saju-schema-v2.mjs` | v2 CHECK 적용 여부만 조회 |
| `tests/scripts/apply-supabase-migration.mjs` | 단일 migration SQL 적용 + 내장 verify |
