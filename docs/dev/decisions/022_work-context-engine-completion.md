# 022 — Work Colleague Context Engine completion

**날짜:** 2026-07-24  
**상태:** 확정 · 통합 검증 READY · **동결**  
**Gate 2:** `021_work-context-engine-judgment-map.md` (`f097688`)  
**엔진:** Work deep = **rule-only** (LLM 분류 경로 없음; 추후 LLM은 설명만)

---

## 1. Final pipeline

```text
Facts (sajuJson / workSignals / psychMaster)
  → Signals (workPairAnalysis, tenGods, strength, workSignals)
  → Work resolvers
       · resolveWorkComparisonTableTyped (×6 independent rows)
       · resolveLeadershipRoleSplit → refineLeadershipRoleSplit
  → CanonicalJudgment wrap (compare + leadership)
  → section fields (labels from typed bands) + canonical_projections
  → context_output (repack only; leadership from section — no re-resolve)
  → persist
  → strip context_output only (projections survive)
  → ViewModel (typed wins over conflicting shortLabel / summary is prose only)
  → UI (compare cells + leadership typed badge)
```

---

## 2. Scoped canonical judgments (MUST)

| Key | Authority |
|-----|-----------|
| `canonical_projections.comparison_table` | six independent rows: `boundary`, `feedback`, `synergy_position`, `burnout`, `risk_taking`, `reporting_rhythm` with `band_a`/`band_b` |
| `canonical_projections.leadership_split` | `{ external_lead, internal_qa_lead, align?, confidence? }` |

Section `office.section_compare_table` and `office.section_roles.leadership_split` stay in sync from the **same** finalized typed values.  
`shortLabel` / leadership `summary` are localized/explanatory — never judgment source.

---

## 3. Intentionally left as deterministic prose / deferred

**KEEP_DETERMINISTIC_PROSE:** DNA cards, ideal roles, de-escalation, feedback cushion scripts, prescriptions, grade/snapshot narratives, contribution style labels, reporting_style_fit / break_boundary_fit section prose.

**DEFER:** manager/direct-report hierarchy fit (lens undefined in product), business-partner-only climate as a separate judgment, reporting_style_fit / contribution_style as CE bags.

---

## 4. Server / UI authority

- One resolver path per judgment; Context Output must not recompute leadership or compare bands.
- UI compare cells: projection bands → `formatWorkCompareCanonicalLabel`; legacy without projection → existing shortLabel.
- Leadership: typed badge from projection; section `summary` remains explanatory prose.
- Malformed projection → null; do not invent from prose.
- Projection present + conflicting section shortLabel → **projection wins**.

---

## 5. Cache / legacy

- Strip/omit remove `context_output` only; `canonical_projections` survive.
- Legacy caches without projections render section prose safely.
- Regeneration rebuilds typed + sections together.

---

## 6. A/B reversal

- Compare bands swap with person slot swap.
- Leadership `external_lead` / `internal_qa_lead` reverse with A/B identity swap (`balanced` invariant).
- Viewer-first UI flips compare display columns; leadership badge uses report A/B nicknames (absolute sides).

---

## 7. Semantic boundaries (locked)

Leadership ≠ initiative ≠ decision authority ≠ execution ownership ≠ planning style  
Leadership ≠ compare risk_taking / reporting_rhythm / boundary / feedback  
Work reporting_rhythm ≠ Friendship communication_rhythm / DNA tikitaka  
Work burnout ≠ Friendship battery_recharge  
Work resource/boundary category ≠ Friendship treasurer  
Work leadership ≠ Marriage household CFO/leadership  
Work hierarchy fit deferred ≠ Family guidance/control  
boundary row ≠ feedback row (same TenGodCategory input, different user questions)

Frozen Romantic / Friendship projection keys and resolvers were not modified.

---

## 8. Tests

- `tests/unit/work-context-engine-canonical.test.mjs` — compare ×6, leadership projection, A/B, locale, strip, malformed, server-wins, Friend shape guard
- Existing: `work-leadership-canonical`, `work-compare-reporting-contract`, `work-context-output`, `work-premium-locale`, `work-report-viewmodel`

---

## 9. Baseline errors (unrelated)

Pre-existing marriage/family `tsc` noise and dirty hub/list/i18n working tree files are **out of scope** for this freeze.

---

## 10. Future LLM context boundary

Digest may expose: judgment ID, typed value, direction/confidence, supporting neutral facts/signals, explicit semantic boundary.  
LLM explains only — never classifies or overrides server enums.

---

## 11. Non-shared Work rules

No shared cross-domain Context Engine. Reuse only Facts / neutral Signals / `CanonicalJudgment` / transport / strip / locale / server-wins patterns.

---

## 12. Commits

| Hash | Role |
|------|------|
| `f097688` | Gate 2 judgment map (`021`) |
| `f853912` | MUST projections wiring |
| *(this)* | Completion + freeze (`022`) |

---

## 13. Verdict

**READY** — Work Colleague Context Engine frozen after Gate 1–6.
