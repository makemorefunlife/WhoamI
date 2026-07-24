# 024 — Marriage / Cohabitation Context Engine completion

**날짜:** 2026-07-24  
**상태:** 확정 · 통합 검증 READY · **동결**  
**Gate 2:** `023_marriage-context-engine-judgment-map.md`  
**엔진:** Marriage/Cohabitation deep = **rule-only** (`runCohabitationDeepAnalysis` → `buildMarriageReport`)

---

## 1. Final pipeline

```text
Facts (sajuJson / cohabitationSignals / psychMaster)
  → Signals (tenGods, boundaries, wealth_officer, bedroom manner, …)
  → Marriage resolvers
       · resolveMarriageComparisonTableTyped (×6)
       · pickHouseholdCfo → refineHouseholdCfo
  → CanonicalJudgment wrap
  → section fields (labels from typed) + canonical_projections
  → context_output (repack only; CFO from section — no re-resolve)
  → persist
  → strip context_output only (projections survive)
  → ViewModel (typed wins over conflicting shortLabel)
  → UI (compare cells + CFO typed badge)
```

---

## 2. Scoped canonical judgments (MUST)

| Key | Authority |
|-----|-----------|
| `canonical_projections.comparison_table` | six independent rows with `band_a`/`band_b` |
| `canonical_projections.operating_cfo` | `{ side, align?, confidence?, dual? }` |

Section `household.section_compare_table` and `section_money_chores` stay in sync from the same finalized typed values.  
`shortLabel` / `cfo_reason` are localized/explanatory — never judgment source.

---

## 3. Intentionally left as deterministic prose / deferred

chores_guideline, spending_style_note, bedroom matrix prose (stamina/fantasy), origin story, weather, de-escalation, prescriptions, parenting role notes (SHOULD deferred), killer questions.

---

## 4. Server / UI authority

- One resolver path per judgment; CO must not recompute CFO or compare bands.
- UI compare: projection → format label; legacy → shortLabel.
- CFO: typed badge from projection; nickname/reason remain explanatory.
- Malformed projection → null; projection wins over conflicting prose.

---

## 5. Cache / legacy

- Strip/omit remove `context_output` only.
- Legacy without projections render section prose safely.

---

## 6. A/B reversal

- Compare bands swap with person slot swap.
- Operating CFO `side` reverses with A/B identity swap.

---

## 7. Semantic boundaries (locked)

operating_cfo ≠ Friendship treasurer ≠ asset_management row ≠ cfo_power_struggle  
bedroom_lead ≠ Romantic balance_of_power / affection  
marital_conflict ≠ Romantic recovery_speed  
household_stress ≠ Friendship communication_rhythm  

`resolveMannerArchetype`: fixed (5:5 buckets; 상관→sweet, 편관→power, 정인/편인→sweet). Old collapse not reproducible.

Frozen Romantic / Friendship / Work resolvers unchanged.

---

## 8. Tests

- `tests/unit/marriage-context-engine-canonical.test.mjs`
- Existing: operating-cfo-canonical, compare-table, context-output

---

## 9. Future LLM context

Digest may expose judgment ID + typed value + side/confidence. LLM explains only.

---

## 10. Commits

| Hash | Role |
|------|------|
| `54cd30e` | Gate 2 judgment map (`023`) |
| `356fa49` | MUST projections wiring |
| *(this)* | Completion + freeze (`024`) |

---

## 11. Verdict

**READY** — Marriage / Cohabitation Context Engine frozen after Gate 1–6.
