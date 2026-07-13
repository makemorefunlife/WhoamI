# 릴리즈 체크리스트

Ah, It's Me는 문서·프롬프트 중심 단계이므로, 릴리즈 = **의미 있는 마일스톤을 Git 태그로 표시**하는 것부터 시작한다.

---

## 릴리즈 전 (AI에게 "릴리즈 하고 싶어"라고 하면 이 순서로 진행)

### 1. 상태 확인

- [ ] `docs/dev/00_Status.md` 우선순위가 이번 릴리즈 범위와 맞는가
- [ ] 미완료 작업이 있다면 릴리즈 노트에 명시할 것인가

### 2. 문서·프롬프트

- [ ] 정본 문서 경로가 실제 파일과 일치하는가
- [ ] Prompt가 Schema를 참조만 하는가 (전체 복사 없음)
- [ ] LLM 테스트 체크리스트 통과 (해당 Prompt가 있을 때)

### 3. Git

- [ ] `git status` — 커밋되지 않은 변경 없음
- [ ] 커밋 메시지가 마일스톤을 설명하는가
- [ ] `.env` 등 비밀 파일이 포함되지 않았는가

### 4. 태그·노트

- [ ] 버전 번호 결정 (예: `v0.1.0-docs-foundation`)
- [ ] 태그 메시지에 이번 마일스톤 3줄 요약
- [ ] `docs/dev/daily/`에 릴리즈 기록

### 5. DB 마이그레이션 (코드 배포 시 필수)

- [ ] **`docs/dev/DEPLOY_CHECKLIST.md` §1** — `verify-person-core-saju-schema-v2.mjs` exit 0
- [ ] 미적용 시 `apply-supabase-migration.mjs`로 `20260713140000_person_core_saju_schema_v2.sql` 적용 후 재검증

---

## 버전 네이밍 (초기 단계)

```text
v0.x.0-docs-<주제>     문서·프롬프트 마일스톤
v0.x.0-lite-prompt    Lite Prompt Runtime 통과
v0.x.0-mvp            MVP 기능 단위
```

---

## 릴리즈 후

1. `00_Status.md` 우선순위 체크리스트 업데이트
2. daily에 릴리즈 버전·태그 기록
3. 다음 마일스톤 1개만 `00_Status.md`에 적기

---

## 아직 Git이 없을 때

"커밋하고 싶어"라고 하면 AI가 `git init` → `.gitignore` 확인 → 첫 커밋 순으로 안내한다.
