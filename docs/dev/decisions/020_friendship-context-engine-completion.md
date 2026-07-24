# 020 — Friendship Context Engine completion

**날짜:** 2026-07-24  
**상태:** 확정 · 통합 검증 READY · **동결**  
**Gate 2:** `019_friendship-context-engine-judgment-map.md` (`8e9f25f`)  
**엔진:** Friendship deep = rule-only (LLM 분류 경로 없음)

---

## 1. Final pipeline

```text
Facts (sajuJson / friendship_signals / psychMaster)
  → Signals (analyzeFriendPairSaju, DNA, tenGods)
  → Friendship resolvers (compare typed / pick→refine treasurer / resolve→refine travel)
  → CanonicalJudgment wrap
  → section fields (labels derived from typed) + canonical_projections
  → context_output (repack only; no re-resolve)
  → persist
  → strip context_output only (projections survive)
  → ViewModel (typed wins over conflicting shortLabel)
  → UI (chips/badges from projections; prose from sections)
```

---

## 2. Scoped canonical judgments (MUST)

| Key | Authority |
|-----|-----------|
| `canonical_projections.comparison_table` | six independent rows with `band_a`/`band_b` |
| `canonical_projections.treasurer` | `{ side, align?, confidence? }` |
| `canonical_projections.travel_planner` | `{ planner_side, align?, confidence? }` |

Section fields remain in sync from the **same** finalized typed values.  
`shortLabel` is a localized projection of `band`, never the judgment source.

---

## 3. Intentionally left as deterministic prose

Soulmate verdict, optimal hangout, breakup/jealousy warnings, de-escalation scripts, guardian/counseling card prose, DNA descriptive paragraphs, prescriptions, grade one-liners.

Deferred typed chips: DNA battery/tikitaka modes, counseling/guardian enums.

---

## 4. Server / UI authority

- Single resolver per judgment; CO must not recompute treasurer/travel/compare.
- UI compare cells: projection bands → format label; legacy without projection → existing shortLabel.
- Treasurer/travel: optional canonical badge; section nickname/reason remain explanatory.
- Malformed projection → null; do not invent from prose.
- Projection present + conflicting section prose → **projection wins**.

---

## 5. Cache / legacy

- Strip/omit remove `context_output` only.
- Legacy caches without `canonical_projections` render section prose safely.
- Regeneration rebuilds typed + sections together.

---

## 6. A/B reversal

- Compare bands swap with person slot swap.
- Treasurer `side` and travel `planner_side` reverse with A/B identity swap.
- Viewer-first UI still flips display columns from report A/B slots.

---

## 7. Semantic boundaries (locked)

Treasurer ≠ hangout_planning ≠ travel_planner  
Compare communication_rhythm ≠ DNA tikitakaMode  
Compare battery_recharge ≠ DNA batteryMode ≠ Romantic recovery/residual  
Upset_expression ≠ breakup_trigger ≠ de_escalation  
Friendship affection_language ≠ Romantic affection  

---

## 8. Non-sharing

Do not lift Friendship enums/resolvers into Romantic, Work, Marriage, or Family.  
Share only `CanonicalJudgment` envelope + strip/cache transport patterns.

---

## 9. Tests / integration

- `friend-comparison-table-canonical.test.mjs`
- `friend-travel-treasurer-canonical-ce.test.mjs`
- Existing: compare-table, treasurer-canonical/composite, travel-composite, context-output, locale

Integration cases covered: real pair, A/B reverse, missing psych, strip, legacy, malformed, conflicting prose, ko/en.

**Verdict: READY**

---

## 10. Freeze

After this record: no Friendship redesign, no optional cleanup into other domains.  
Only verified defects may reopen the domain.
