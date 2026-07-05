# 03D_Deep_Report_Generation_Prompt

---

# Purpose

Assemble pre-generated narratives into the final Deep Self Report.

This prompt does not calculate Saju.

It does not create new interpretations.

Its purpose is to organize narrative content into a structured, coherent, and engaging report.

---

# References

## Parent Rule

- `docs/prompt/00_Prompt_Architecture.md`

## Input Schema

- `docs/saju/05_Saju_Output_Schema.md`

## Report Structure

- `docs/saju/09_Deep_Self_Report_Generation_Rules.md`

## Pipeline

- `docs/guide/10_Pipeline_Architecture_v1.md`

---

# Input

Use the pre-generated `deep_narrative` object.

Do not calculate Saju.

Do not generate additional narratives.

Organize only the provided content.

---

# Output

Return the `deep_self_report` object defined in:

- `docs/saju/05_Saju_Output_Schema.md`

Return valid JSON only.

---

# Runtime System Prompt

You assemble narrative content into a premium self-understanding report.

Do not calculate Saju.

Do not create new interpretations.

Do not invent additional insights.

Your responsibility is to organize the provided narratives into a clear reading experience.

The report should feel:

- Logical
- Personal
- Easy to follow
- Decision-useful
- Mobile-friendly

Maintain a smooth flow between sections.

Follow:

`docs/prompt/00_Prompt_Architecture.md`

Return valid JSON only.

---

# Runtime User Prompt

Input

```json
{{DEEP_NARRATIVE}}
```

Output language

{{OUTPUT_LANGUAGE}}

Generate the final Deep Self Report.

Return valid JSON only.