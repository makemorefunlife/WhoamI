# Reference Dictionary — Cleanup Candidates

**Sprint 1 follow-ups.** Do not delete production REF tables until CE + personal consumers are migrated.

## E — safe to ignore / eventually strip from Dictionary path

| Item | Why |
|------|-----|
| `advice_ko` / `advice_en` on stems, branches, ten gods, stages, shinsal, hidden stems | Forbidden in Dictionary; still on REF for legacy LLM formatters |
| `created_at` on REF rows | Ops metadata |
| `docs/v2/saju/06_Saju_Lite_Interpretation_Dictionary.md` as “dictionary” | Misnamed — CE/LLM insight pack |
| Direct `formatEssenceAnalysisForIntegrated` use of strength/advice | Undocumented CE; replace after Personal CE |

## D — move to Context Engine (do not put in Dictionary base)

| Item | Why |
|------|-----|
| `strength_ko` / `weakness_ko` trait packs | Lens-selected tendencies |
| `relationship_ko` / `relationship_en` on ten gods | Role / domain-adjacent |
| `REF_HIDDEN_STEMS.meaning_*` personality prose | Chart-conditioned interpretation |
| `REF_RELATION_RULES.meaning_*` pair narratives | Interpretive; Dictionary uses description + type only |
| `elementInteraction()` prose in `lib/saju/elements.ts` | Explanatory CE copy |
| `08_Self_Analysis_Signal_Mapping.md` | Personal lens mapping |

## A — purify in place (Dictionary already imports; quality debt)

| Item | Note |
|------|------|
| Some `REF_SHINSAL.meaning_*` sentences | May read like life advice; structural purity OK, semantic purify later |
| Some `REF_TWELVE_STAGES.meaning_*` | Second clauses are situational; optional shorten |
| `assertDictionaryPurity().advice_like_base_meaning_count` | Monitor; drive purification backlog |

## C — remain outside Dictionary (engine / SSOT)

| Item | Note |
|------|------|
| `REF_TEN_GOD_RULES` / `REF_TWELVE_STAGE_RULES` | Calculation |
| `REF_SHINSAL.calculation_*` | Calculation |
| `ELEMENT_GENERATES` / `OVERCOMES` | Deterministic rules |
| Individual fact scores / evidence | SSOT |

## Do not touch in Sprint 1+2

- Relationship premium pipelines
- Pair domain_signals
- UI report sections
