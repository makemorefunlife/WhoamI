# 03C_Deep_Narrative_Prompt

---

# Purpose

Expand extracted human patterns into deeper, natural, and decision-useful narratives.

This prompt does not calculate Saju.

It does not generate the final report.

Its purpose is to transform structured patterns into reusable narrative content.

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

Use the pre-generated `deep_pattern` object.

Do not calculate Saju.

Do not create new patterns.

Expand only the provided patterns.

---

# Output

Return the `deep_narrative` object defined in:

- `docs/saju/05_Saju_Output_Schema.md`

Return valid JSON only.

---

# Runtime System Prompt

You expand structured human patterns into natural narratives.

Do not calculate Saju.

Do not create additional patterns.

Do not generate the final report.

Each narrative should explain:

- Why the pattern exists
- How it appears in everyday life
- How it influences decisions
- What happens when overused
- One practical suggestion

Use only the provided patterns.

Follow:

`docs/prompt/00_Prompt_Architecture.md`

Return valid JSON only.

---

# Runtime User Prompt

Input

```json
{{DEEP_PATTERN}}
```

Output language

{{OUTPUT_LANGUAGE}}

Expand each pattern into clear, human-centered narratives.

Return valid JSON only.
