# Reference Dictionary MVP — Migration Notes

**Sprint:** 1  
**Version:** `reference_dictionary_v1`  
**Module:** `lib/personCore/referenceDictionary/`  
**Date:** 2026-07-29

## Architecture position

```text
Individual SSOT
  → Reference Dictionary   ← this sprint
  → Context Engine         (not implemented)
  → LLM
```

## What shipped

- Production catalog builder: `buildReferenceDictionary()` / `getReferenceDictionary()`
- Lookup: `lookupReference`, `listByCategory`, `requireReference`
- Purity guard: `assertDictionaryPurity` (forbids advice/trait/relationship_* fields on entries)
- Field inventory: `inventory.ts` (A–E classification)
- Stable IDs reused from `lib/personCore/individualSaju/refIds.ts`

## Categories covered

| Category | Key pattern | Source |
|----------|-------------|--------|
| element | `element:{code}` | curated |
| stem | `stem:{code}` | REF_HEAVENLY_STEMS (no advice) |
| branch | `branch:{code}` | REF meaning_* |
| ten_god | `ten_god:{code}` | REF meaning_* + fallbacks |
| twelve_stage | `twelve_stage:{code}` | REF meaning_* |
| hidden_layer | `hidden_layer:{main\|middle\|residual}` | curated |
| hidden_stem | `hidden_stem:{branch}:{stem}:{layer}` | factual composition only |
| relation_type | `relation_type:{type_id}` | curated + RELATION_TYPE_IDS |
| relation_pair | `relation:{id}` | description + type base (not REF meaning_*) |
| shinsal | `shinsal:{id}` | REF meaning_* (purify later) |
| noble | `noble:{noble_id}` | subset of shinsal via NOBLE_NAME_TO_ID |
| special_signal | `special:{id}` | curated |
| strength | `strength:{token}` | curated |
| johu_temp / johu_moist | `johu_temp:*` / `johu_moist:*` | curated |
| pillar_slot | `pillar_slot:{slot}` | curated |
| gongmang | `gongmang:void` | curated |

## Consumer migration (next sprints — not this PR)

1. ~~Personal Context Engine should call `lookupReference` / `lookupReferences` only.~~ → Sprint 2 done (`personal_ce_v1`).
2. Slim: stop feeding `formatEssenceAnalysisForIntegrated` advice/strength blobs; use Dictionary base + CE structure (adapter ready, not wired).
3. Do **not** yet rewrite relationship products to this module.
4. Keep `lib/hardcoded/sajuReferenceData.ts` as upstream calculation + legacy display source until consumers migrate.

## Non-goals (explicit)

- ~~Context Engine~~ (Personal CE MVP shipped Sprint 2)
- Pair SSOT
- Relationship product changes
- UI
- Deleting REF advice columns (cleanup candidate only)
