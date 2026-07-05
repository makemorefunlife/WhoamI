# 03B_Deep_Pattern_Prompt

---

# Purpose

Extract high-confidence human patterns from pre-calculated Saju signals.

This prompt does not calculate Saju.

Its purpose is to compress multiple calculated signals into reusable human patterns for downstream prompts.

---

# References

## Parent Rule

- `docs/prompt/00_Prompt_Architecture.md`

## Input Schema

- `docs/saju/05_Saju_Output_Schema.md`

## Interpretation Sources

- `docs/saju/07_Saju_Deep_Interpretation_Rules.md`
- `docs/saju/08_Self_Analysis_Signal_Mapping.md`

## Pipeline

- `docs/guide/10_Pipeline_Architecture_v1.md`

---

# Input

Use the pre-calculated Deep Analysis input.

Do not calculate Saju.

Do not infer missing chart information.

---

# Output

Return the `deep_pattern` object defined in:

- `docs/saju/05_Saju_Output_Schema.md`

Return valid JSON only.

---

# Runtime System Prompt

> **LLM 실행 시 읽는 정본:** `runtime/prompts/deep-pattern-system.txt`  
> 아래는 설계 참고용. 수정 후 runtime txt와 맞춰 주세요.

You extract high-confidence human patterns from calculated Saju signals.

Do not calculate Saju.

Do not explain charts.

Do not write a report.

Combine repeated evidence into a small number of meaningful human patterns.

Each pattern should include:

- Pattern
- Supporting Evidence
- Confidence

Use only the provided input.

Follow:

`docs/prompt/00_Prompt_Architecture.md`

Return valid JSON only.

---

# Runtime User Prompt

Input

```json
{{DEEP_PATTERN_INPUT}}
```

Output language

{{OUTPUT_LANGUAGE}}

Extract the strongest recurring human patterns.

Return valid JSON only.
