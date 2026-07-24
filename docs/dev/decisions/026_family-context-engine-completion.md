# 026 — Family Parent–Child Context Engine completion

**날짜:** 2026-07-24  
**상태:** 확정 · 통합 검증 READY · **동결**  
**Gate 2:** `025_family-context-engine-judgment-map.md`  
**엔진:** Family deep = **rule-only** (`runFamilyParentChildDeepAnalysis` → `buildFamilyParentReport`)

---

## 1. Final pipeline

```text
Facts (sajuJson / familySignals / psych / roles)
  → Signals (tenGods, bond, guidance, climate, …)
  → resolveFamilyComparisonTableTyped (band_parent / band_child)
  → section_compare_table (labels from bands; parentRole copy only)
  → canonical_projections.comparison_table
  → context_output (repack; study/wealth_align metadata only)
  → strip context_output only (projections survive)
  → ViewModel (projection wins; UI shows core 4 rows)
  → UI
```

---

## 2. Scoped MUST judgments

| Key | Authority |
|-----|-----------|
| `canonical_projections.comparison_table` | six rows with `band_parent` / `band_child` |

---

## 3. Deferred / metadata / prose

- separation_task standalone — nested in bond_distance (011)
- recognition — Part4 (013)
- study_align / wealth_align — CO metadata only
- prescriptions, SOS, household roles, talent saju prose

---

## 4. Direction & parentRole

- Typed identity is always **parent/child** from `roles`, never report A/B enums.
- `parentRole` mother/father changes **titles/meaning copy only** — never bands.
- Track B (`childIsViewer`) does not flip typed projections.

---

## 5. Server / UI authority

- Projection wins over conflicting shortLabel.
- Malformed projection → null; legacy shortLabel fallback.
- Context Output does not re-resolve compare buckets.

---

## 6. Semantic boundaries (locked)

guidance_balance ≠ Work leadership ≠ Marriage household leadership  
bond_distance ≠ Friendship distance; separation readiness not claimed  
home_climate ≠ Romantic reassurance  
affection_expression ≠ Romantic affection / recognition need  
study_align ≠ study_type; wealth_align ≠ wealth_vessel  

Frozen Romantic / Friendship / Work / Marriage shapes unchanged.

---

## 7. Tests

- `tests/unit/family-context-engine-canonical.test.mjs`
- Existing Part2 A/B/C/E, role-lens, compare-table, context-output, locale

---

## 8. Commits

| Hash | Role |
|------|------|
| `1463be7` | Gate 2 map (`025`) |
| `897cd45` | MUST projections wiring |
| *(this)* | Completion (`026`) |

---

## 9. Verdict

**READY** — Family Parent–Child Context Engine frozen.
