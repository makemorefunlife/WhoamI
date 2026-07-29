# CORE_MAP — 코어 vs 실험 vs 삭제 후보

> 새 파일 넣기 전에 **어느 구역인지** 먼저 정한다.

---

## 코어 (지우면 서비스가 깨짐)

### 앱·UI

```text
app/                    # Next.js 라우트
components/             # UI (space/, v2/ Blueprint·Lite 등)
```

### 사주·리포트 엔진

```text
lib/saju/               # 만세력, 십성, 신살, 합충, chartContext
lib/personCore/individualSaju/       # Individual SSOT chart
lib/personCore/referenceDictionary/  # Reference Dictionary MVP (base meanings)
lib/personCore/personalContextEngine/ # Personal CE MVP (personal_innate_v1)
lib/report/             # 유료 파이프라인, 통합 LLM, 점성 좌표
lib/prompts/            # integratedPremiumReport 등 프로덕션 프롬프트
lib/hardcoded/          # REF_* upstream tables (calc + legacy display)
```

### Slim V1 (본래의 나 심화)

```text
lib/v1/slim/            # runSlimIntegratedReport, surveyAnalysis, fetchBirthAstrology
app/api/v2/deep/innate/ # Slim V1 API (이름은 v2 경로지만 구현은 v1/slim)
app/blueprint-preview/[reportId]/innate/deep/
components/v2/SlimV1IntegratedView.tsx
```

### Blueprint 무료 플로우

```text
lib/v2/survey/          # 10문항, scorer, session
lib/v2/onboarding/      # birthSession, resolveBirthChartInput
lib/v2/lite/            # innate/current lite LLM
lib/v2/blueprint/       # bundle, hook copy
lib/v2/saju/
  calculateSajuBundle.ts  # 사주 팔자 (v1 /api/saju 동일)
  innateLite.ts           # 6축 무료 점수
lib/v2/analysis/gap.ts  # Blueprint gap 표
app/survey-v2/
app/onboarding/birth/
app/blueprint-preview/
app/api/v2/lite/
```

### 유료·관계 (레거시 포함, 당분간 코어)

```text
app/report/
app/api/my/report/
app/api/llm/
app/api/relationship/
lib/relationship/
```

---

## 실험·테스트 (자유롭게 추가/삭제)

```text
tests/                  # 수동 검증, 스크립트, 회귀 가이드
sandbox/                # (비어 있음) 다음 실험용 — 코어 import 최소화
scripts/                # → tests/scripts/ 로 이전 중 (레거시 경로는 README만)
```

**규칙**

- `tests/`·`sandbox/` 코드는 프로덕션 `app/`에서 import 하지 않음
- 실험이 성숙하면 `lib/v1/` 또는 `lib/v2/`로 **이사** (한 번에)

---

## 삭제 후보 (참고만, 새 코드 금지)

```text
docs/v2/prompt/03B_* 03C_* 03D_* 03E_*   # (삭제됨) 폐기된 deep self 파이프라인 스펙
docs/v2/saju/07~10                       # deep 전용 규칙 (Slim V1 미사용)
lib/v2/deep/                             # (삭제됨)
lib/v2/saju/extractDeepSignals.ts        # (삭제됨)
lib/v2/saju/buildExtendedNormalizedSaju.ts # (삭제됨)
```

레거시 **18문항 Y/N** (`app/survey/`, `detailed_survey` 일부) — `/report` 유료에만 남음. Slim V1·Blueprint는 **미사용**.

---

## 데이터·캐시 (알아둘 것)

| 키 / 저장소 | 용도 |
|-------------|------|
| sessionStorage `ahaitsme_v2_survey_*` | v2 설문 |
| sessionStorage `ahaitsme_v2_birth_*` | 생년월일·시간·**지역** |
| sessionStorage `ahaitsme_v2_lite_*` | 무료 lite 캐시 |
| Slim V1 deep | **DB 저장 없음**, 요청마다 LLM |

---

## 의사결정 이력

- `decisions/003_slim-v1-over-v2-deep.md`
