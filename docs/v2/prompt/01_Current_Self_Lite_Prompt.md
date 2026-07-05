# 01_Current_Self_Lite_Prompt.md

# Current Self Lite Prompt

---

## Purpose

설문 점수로 생성된 **Current Self Profile**을 받아, 짧고 구체적인 자기이해 Lite 리포트를 만든다.

* 사주를 계산하거나 추론하지 않는다.
* 성격 유형 라벨을 붙이지 않는다.
* **지금의 삶 패턴**을 설명한다.

목표:

> "That explains how I've been living lately."

---

## Parent Rule

`docs/prompt/00_Prompt_Architecture.md` 를 따른다.

---

## Input Contract

Input Schema:

See `docs/survey/04_Survey_Output_Schema.md`

Runtime 입력은 최소 아래를 포함한다.

```json
{
  "profile_type": "current_self",
  "primary_axes": {
    "autonomy": 0,
    "connection": 0,
    "stability": 0,
    "growth": 0,
    "control": 0,
    "adaptability": 0
  },
  "personalization": {
    "primary_concern": "career"
  },
  "lite_interpretation_hints": {}
}
```

`secondary_axes`는 참고용. 사용자에게 직접 노출하지 않는다.

---

## Output Contract

```json
{
  "report_type": "current_self_lite",
  "language": "{{OUTPUT_LANGUAGE}}",
  "one_line_summary": "",
  "current_pattern": { "title": "", "body": "" },
  "key_strength": { "title": "", "body": "" },
  "growth_edge": { "title": "", "body": "" },
  "decision_hint": { "title": "", "body": "" },
  "small_action": { "title": "", "body": "" },
  "evidence_notes": {
    "primary_signals_used": [],
    "confidence_level": "low | medium | high"
  }
}
```

---

## Runtime Language Rule

* 시스템 지시는 영어
* 사용자 출력은 `{{OUTPUT_LANGUAGE}}` (기본 English)

---

## Runtime System Prompt

정본 파일:

```text
runtime/prompts/current-self-lite-system.txt
```

---

## Runtime User Prompt

정본 파일:

```text
runtime/prompts/current-self-lite-user.txt
```

`{{INPUT_JSON}}`에 Current Self Profile JSON을 넣는다.

---

## Runtime 실행

```bash
cd runtime
npm install
node run-survey-e2e.mjs --llm
```

---

## Writing Rules (요약)

* primary_axes에서 가장 강한 1~2개 패턴만 사용
* `primary_concern`은 문장 톤 조정에만 사용 (근거로 쓰지 않음)
* Strength → 과사용 시 비용 → Growth Edge 구조
* 각 body 1~3문장

---

## Forbidden

* 운명·미래 단정
* 없는 경험·기억 생성
* 과장 칭찬
* "Weakness" 제목 (Growth Edge 사용)
