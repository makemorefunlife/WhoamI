# 개발 트래킹 (함께 쓰는 devlog)

> **목적:** 맥락을 잃지 않고, 매일 무엇을 했는지·어디까지 왔는지 함께 기록한다.

---

## 폴더 구조

```text
docs/dev/
  README.md           ← 이 파일 (시작점)
  PROJECT_RULES.md    ← 우리가 지키는 규정
  00_Status.md        ← 살아있는 Todo / NOW·NEXT
  TODO.md             ← 나중용 메모 (Error Boundary / Maps / i18n)
  CORE_MAP.md         ← 코어 vs 나중에 지울 코드 구분
  personCore/         ← PersonCore engine policy (Personal CE selection SSOT)
  daily/              ← 하루 devlog
  decisions/          ← 중요한 결정 기록 (회의록)

tests/                ← 수동·스크립트 테스트 (프로덕션 코드 아님)
.cursor/rules/        ← AI가 매 세션 참고하는 규칙
```

---

## 하루 루틴

### 아침 (2분)

1. `00_Status.md` 열기
2. **NOW 1개**만 확인 — "오늘 이것만 끝내면 된다"

### 작업 중

- NOW에 집중. NEXT는 건드리지 않음
- 막히면 Status의 🚧에 한 줄
- **실험·임시 코드**는 `sandbox/` 또는 `tests/`에만 (코어 `lib/` 직접 오염 X)

### 저녁 (10분)

1. AI에게 **「오늘 로그 남겨줘」** 요청
2. `daily/YYYY-MM-DD.md` 작성·갱신
3. 완료한 항목 `00_Status.md` 체크
4. 중요한 선택은 `decisions/`에 1페이지 추가

---

## AI에게 이렇게 말하기

| 하고 싶은 일 | 말하기 |
|-------------|--------|
| 진행 확인 | "지금 어디까지 했지?" / "Status 알려줘" |
| Todo 반영 | "Step X 완료했어, Status 업데이트해줘" |
| 오늘 마무리 | "오늘 로그 남겨줘" |
| 작업 시작 | "오늘 뭘 하면 돼?" |
| 테스트만 | "tests/에 수동 검증 스크립트 추가해줘" |
| 코어 vs 실험 | "이거 코어에 넣어도 돼?" → `CORE_MAP.md` 기준 |

AI는 **`00_Status.md` → `PROJECT_RULES.md` → 최근 `daily/`** 순으로 읽는다.

---

## 관련 문서 (참고용, 트래킹 SSOT 아님)

| 문서 | 용도 |
|------|------|
| `docs/dev-flow-current.md` | 유료/무료 리포트 **실제 데이터 흐름** 맵 |
| `docs/v2/` | 초기 v2 설계 스펙 (많은 deep 파이프라인은 **폐기·삭제 후보**) |
| `tests/regression/` | API 회귀 수동 검증 가이드 |

---

## archive

`daily/`가 쌓이면 월말에 `daily/archive/YYYY-MM/`로 옮길 수 있다.  
`00_Status.md`와 `decisions/`는 개발하는 동안 계속 유지한다.
