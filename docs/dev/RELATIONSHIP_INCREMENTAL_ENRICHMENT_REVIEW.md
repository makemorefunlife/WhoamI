# Relationship Incremental Enrichment — Product Director Review

**Branch:** `sprint/relationship-incremental-enrichment`  
**Production:** untouched (no merge, no deploy)  
**DEV Preview:** `/dev/relationship-enrichment-review`

---

## How to review (start here)

```text
npm run dev
open /dev/relationship-enrichment-review?domain=friend&case=strong&locale=ko-KR&mode=current
```

Switches: **Friend / Work / Family / Partner** · **KO / EN** · **Current / V1 / DEV** · 8 cases each.

| Mode | What you see |
|------|----------------|
| **Current** | Live CE report UI (with enrichment fields highlighted when present) |
| **V1** | V1 gold inventory + `canonical_projections` |
| **DEV** | Pair CE evidence → Domain Lenses → Story Planner → 7-scene Narrative |

Artifacts:
- Baseline (pre-enrichment CE+lens dump): `tests/artifacts/relationship-enrichment/baseline/` (64 JSON)
- After (with enrichments): `tests/artifacts/relationship-enrichment/after/` (64 JSON)

Regenerate:
```bash
npx tsx tests/scripts/generate-relationship-enrichment-corpus.mjs
CORPUS_BUCKET=after npx tsx tests/scripts/generate-relationship-enrichment-corpus.mjs
```

---

## Architecture (1 screen)

```text
Production UI today:
  V1 CE builders → ViewModel → SectionRenderer

Ideal chain (implemented, Not Rendered in prod UI):
  SSOT → Pair CE → Domain Lenses → Story Planner → Narrative Composer
```

Personal CE / `pairLens` consumption in Friend/Work/Family/Partner prod: **Missing Evidence**.  
Full Domain Lens FE replacement: **DEFER** (not this sprint).

---

## Implemented improvements (evidence-backed)

| Domain | Action | Change |
|--------|--------|--------|
| Friend | ADD_TO_EXISTING_SECTION | `shine_when_best` on snapshot — research Q3 “when friendship shines” |
| Partner | ADD_TO_EXISTING_SECTION | `mental_load_note` on money_chores — invisible household load |
| Family | ADD_TO_EXISTING_SECTION | `praise_trigger_note` on child_dna — praise/recognition trigger |
| All 4 | RESTORE_V1_GOLD | KO/EN 7-scene Narrative Composers (`a6ebead`) |
| Friend | RESTORE_V1_GOLD | `resolveFriendTreasurerCanonical` for lens path |
| Work | KEEP_CURRENT | No CE field add this batch; review via DEV lenses |

Scene order / tone preserved. No sections deleted.

---

## Deferred

- Full Domain Lens → production FE wire
- Friend timeline/horizon module
- Partner career-sacrifice / leisure modules
- Work environment-fit explorer

---

## Tests / Commits

- `tests/unit/relationship-enrichment-fields.test.mjs`
- `tests/unit/domain-narrative-composers-7scenes.test.mjs` (restored)

See `git log sprint/relationship-incremental-enrichment --oneline`.

---

## Confirmation

**Production was not merged, not deployed, caches not invalidated.** Review only on this DEV branch / worktree.
