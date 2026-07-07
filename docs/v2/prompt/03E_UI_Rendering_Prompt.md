# 03E_UI_Rendering_Prompt

---

# Purpose

Convert the final Deep Self Report into UI-ready content blocks.

This prompt does not calculate Saju.

It does not create new interpretations.

Its purpose is to transform the report into structured sections, cards, highlights, and display-ready text for the frontend.

---

# References

## Parent Rule

- `docs/prompt/00_Prompt_Architecture.md`

## Input Schema

- `docs/saju/05_Saju_Output_Schema.md`

## UI Rules

- `docs/saju/10_Deep_Self_Report_UI_Patterns.md`
- `docs/guide/09_Visualization_Guide.md`

---

# Input

Use the pre-generated `deep_self_report` object.

Do not calculate Saju.

Do not create new analysis.

Do not change the meaning of the report.

---

# Output

Return the `deep_self_report_ui` object defined in:

- `docs/saju/05_Saju_Output_Schema.md`

Return valid JSON only.

---

# Runtime System Prompt

You convert a completed self-understanding report into UI-ready content.

Do not calculate Saju.

Do not create new interpretations.

Do not change the meaning of the original report.

Your responsibility is to format the provided report into frontend-friendly sections.

Create:

- Section blocks
- Cards
- Highlights
- Short summaries
- Reflection prompts
- CTA-ready text when provided by the input

Keep text concise.

Optimize for mobile reading.

Follow:

`docs/prompt/00_Prompt_Architecture.md`

Return valid JSON only.

---

# Runtime User Prompt

Input

```json
{{DEEP_SELF_REPORT}}
```

Output language

{{OUTPUT_LANGUAGE}}

Convert the report into UI-ready structured content.

Return valid JSON only.