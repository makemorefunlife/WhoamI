# Work Narrative Pilot (A/B/C)

Non-production evaluation harness for Work Colleague narrative quality.

**Does not** change production premium routing, persistence, ViewModel, renderer, caching, or stripping.

## Variants

| Variant | Source |
|---------|--------|
| A | Current deterministic `buildWorkColleagueReport` (no LLM) |
| B | Broad-context LLM — evidence only; `binding_truth = null` |
| C | Thin-guardrail hybrid — same evidence + frozen CE binding |

## Context package (Batch IV)

Schema: `work_narrative_pilot_context_v2`

- Primary evidence: structured facts (`communication_signals`, `dna_signals`, `structured_evidence`, `pair_patterns`, `evidence_relationships`)
- Finished deterministic prose: `reference_copy` (`allowed_as_narrative_source: false`)
- LLM prompt withholds `reference_copy` item text (`[withheld]`) to prevent paraphrase pull
- `communication_signals.contrast_supported` gates invented fast-vs-detail contrasts
- Absolute psych patterns reuse existing psych `match_type` + officePsychFit 60/40 bands + meaningful gap floor (15)

## Bilingual voice (Batch V)

Voice policy version: `work_narrative_voice_v1`

Same context package + canonical for both locales; delivery only differs (`ko-KR` / `en-US`).

```bash
npx tsx tests/scripts/work-narrative-pilot/bilingual-contract.test.mjs
npx tsx tests/scripts/work-narrative-pilot/run.ts --c-bilingual
```

Writes (without overwriting Batch IV files):

- `context_C_bilingual_shared.json`
- `variant_C_package_refined_ko-KR.json`
- `variant_C_package_refined_en-US.json`

Each narrative artifact records `locale`, `model`, `prompt_batch`, `package_schema`, `voice_policy_version`, `canonical_hash`, `context_hash`.

## Run

```bash
# Smoke (no LLM)
npx tsx tests/scripts/work-narrative-pilot/smoke.test.mjs

# Package / prompt / bilingual contracts
npx tsx tests/scripts/work-narrative-pilot/package-contract.test.mjs
npx tsx tests/scripts/work-narrative-pilot/prompt-contract.test.mjs
npx tsx tests/scripts/work-narrative-pilot/bilingual-contract.test.mjs

# Variant A + context packages only
npx tsx tests/scripts/work-narrative-pilot/run.ts --a-only

# Variant C only (backs up prior C to *.pre_batch3.json when applicable)
npx tsx tests/scripts/work-narrative-pilot/run.ts --c-only

# Batch III prompt-refined C (preserves variant_C_narrative.json)
npx tsx tests/scripts/work-narrative-pilot/run.ts --c-refined

# Batch IV package-refined C (writes context_C_package_refined.json + variant_C_package_refined_narrative.json)
npx tsx tests/scripts/work-narrative-pilot/run.ts --c-package-refined

# Batch V bilingual voice (ko-KR + en-US, same package hashes)
npx tsx tests/scripts/work-narrative-pilot/run.ts --c-bilingual

# Full A/B/C (needs OPENAI_API_KEY in .env.local)
npx tsx tests/scripts/work-narrative-pilot/run.ts

# Single pair
npx tsx tests/scripts/work-narrative-pilot/run.ts --pair complementary-01
```

Artifacts write to `tests/scripts/work-narrative-pilot/artifacts/` (gitignored).

## Architecture

```text
SSOT fixtures
→ buildWorkColleagueReport (existing Work CE)
→ context package v2 (binding_truth | structured evidence | pair_patterns | reference_copy)
→ locale voice adapter (ko-KR | en-US) — same truth, different delivery
→ Variant B/C LLM holistic sections
→ review package (checklists + blank rubric)
```
