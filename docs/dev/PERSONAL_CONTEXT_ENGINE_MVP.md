# Personal Context Engine MVP

**Sprint:** 2  
**Version:** `personal_ce_v1`  
**Lens:** `personal_innate_v1`  
**Module:** `lib/personCore/personalContextEngine/`

## Pipeline

```text
IndividualSajuChart (SSOT facts)
  → selectPersonalInnateCandidates (deterministic)
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
    max_packets_per_group?: number  // default 8
    include_low_confidence?: boolean
    include_unpossessed_specials?: boolean
  }
}
```

### Output

- `groups`: identity | energy | strengths | cautions | growth
- `packets[]`: packet_id, fact_path, codes, reference_ids, base_meanings, unresolved_reference_ids, weight, confidence, evidence
- `aggregates`: ten_god_stem_counts, dominant/weakest element, strength_token, birth_time_unknown
- `exclusions[]`: birth_time_unknown | not_possessed | low_priority_cap | empty_fact
- `unresolved_references[]`: dictionary_miss (explicit)
- `provenance`: ce/lens/dictionary/chart fingerprints

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
