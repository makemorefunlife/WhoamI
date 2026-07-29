# Personal Context Engine MVP

**Sprint:** 2  
**Version:** `personal_ce_v1`  
**Lens:** `personal_innate_v1`  
**Module:** `lib/personCore/personalContextEngine/`

## Canonical policy (selection / tiers / relations)

**SSOT for interpretation tiers, inclusion/exclusion, 합·충 handling, modifiers, `selection_priority`, confidence, and future SSOT gaps:**

→ [`docs/dev/personCore/PERSONAL_CONTEXT_ENGINE_POLICY.md`](./personCore/PERSONAL_CONTEXT_ENGINE_POLICY.md)

This MVP note owns **I/O contract and Slim wiring only**. Selection / tier / relation policy lives in the policy SSOT above (implementation status: policy §14).

**Not in scope here:** Relationship Product Bible (`docs/product/05_*`) — product experience only; no engine packet rules.

## Pipeline

```text
IndividualSajuChart (SSOT facts)
  → selectPersonalInnateCandidates (deterministic; must follow POLICY)
  → Reference Dictionary lookup (base_meaning only)
  → PersonalContextEngineOutput (structured packets)
  → adaptPersonalContextForSlim (adapter only; Slim not migrated)
  → LLM (future)
```

## Contract

### Input

```ts
{
  chart: IndividualSajuChart
  lens?: "personal_innate_v1"
  dictionary_version?: string  // must match catalog when set
  options?: {
    max_packets_per_group?: number  // default 8; policy requires tier reservation
    include_low_confidence?: boolean  // policy: default should omit low-conf 용희신
    include_unpossessed_specials?: boolean
  }
}
```

### Output

- `groups`: convenience index of `packets` by group (not a second fact store)
- `packets[]`: packet_id, fact_path, codes, reference_ids, base_meanings, unresolved_reference_ids, tier, selection_priority, confidence, evidence, group, role_in_lens
  - `selection_priority` = deterministic ordering only (never a score, confidence, %, or user-visible metric)
  - `tier` = admission band only; `confidence` = epistemic from SSOT; `evidence` = SSOT refs
- `aggregates`: ten_god_stem_counts, dominant/weakest element, strength_token, birth_time_unknown, ssot_gaps
- `exclusions[]`: birth_time_unknown | not_possessed | low_priority_cap | empty_fact | deduped | low_confidence_omitted
- `unresolved_references[]`: dictionary_miss (explicit)
- `provenance`: ce/lens/dictionary/chart fingerprints + chart `report_id` (session/chart id — not report IA)

No narrative, advice, relationship interpretation, or Saju recalculation.

## Unknown birth time

- Hour pillar candidates are **excluded** (`reason: birth_time_unknown`)
- Hour stem ten-gods omitted from `aggregates.ten_god_stem_counts`

## Slim insertion points (not wired)

See `SLIM_INSERTION_POINTS` in `adaptPersonalContextForSlim.ts`:

1. `runSlimIntegratedReport` after saju facts  
2. `formatEssenceAnalysisForIntegrated` replacement  
3. `runDeepEssenceStructuredLlm` essence input  
4. `runIntegratedPremiumLlm` sajuSummary input  

`wired_into_slim: false` until a later sprint.

## Tests

```bash
npx tsx tests/unit/personal-context-engine.test.mjs
```
