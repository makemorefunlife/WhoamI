# 06_Survey_Lite_Interpretation.md

## Purpose

Current Self Profile 점수를 **무료 Lite 해석**에 쓸 수 있는 신호로 압축한다.

LLM은 이 규칙을 참고하되, 점수를 다시 계산하지 않는다.

---

## Input

`04_Survey_Output_Schema.md` 의 `primary_axes` + `personalization`

---

## Interpretation Steps

### 1. Dominant axes (상위 2개)

primary_axes 중 점수가 가장 높은 2개 축을 dominant pattern으로 사용.

### 2. Lower axis (하위 1개)

가장 낮은 1개 축은 growth edge 후보 (단정하지 않음).

### 3. Concern weighting

`primary_concern` 값에 따라 문장 예시 톤만 조정:

| concern | 강조 축 |
|---------|--------|
| money | stability, practicality |
| relationship | connection, empathy |
| health | energy_style, resilience |
| career | growth, control |
| other | dominant axes only |

concern은 **근거 신호가 아님**.

---

## Lite Output Themes

| 섹션 | 내용 |
|------|------|
| current_pattern | 지금의 생활·결정 패턴 |
| key_strength | 도움이 되는 방식 + 과사용 비용 |
| growth_edge | 부담이 커지는 조건 |
| decision_hint | 결정 시 유의점 |
| small_action | 이번 주 작은 행동 |

---

## Tone

* 차트 설명 X, 사람 패턴 설명 O
* 가능성 언어 ("~할 수 있다")
* 과장·아부 금지

---

## Runtime

점수화 후 `lite_interpretation_hints` 생성: `runtime/lib/survey-scorer.js`  
문장 생성: `docs/prompt/01_Current_Self_Lite_Prompt.md`

---

## Related

* Mapping: `05_Survey_Human_Framework_Mapping.md`
* Saju Lite 사전(참고 톤): `docs/saju/06_Saju_Lite_Interpretation_Dictionary.md`
