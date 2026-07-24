# 023 — Marriage / Cohabitation Context Engine judgment map (Gate 2)

**날짜:** 2026-07-24  
**상태:** 확정 — MUST 슬라이스 구현  
**선행:** Gate 1 READY FOR JUDGMENT-MAP DESIGN  
**엔진:** Marriage/Cohabitation deep = **rule-only** (`runCohabitationDeepAnalysis` → `buildMarriageReport`)  
**경계:** Romantic / Friendship / Work 의미를 상속하지 않음. 인프라만 재사용.

---

## Gate 1 summary

- Entry: `runCohabitationDeepAnalysis` → `buildMarriageReport` (no LLM classification).
- Surfaces: origin_story, household snapshot, psych radar, compare ×6, money_chores (CFO+chores+spending), bedroom matrix, home DNA, parenting, family boundary, weather, privacy, upset, warning/de-esc, prescriptions, killer questions.
- Existing CFO: `pickHouseholdCfo` → `refineHouseholdCfo` → `buildMarriageOperatingCfoCanonical` → `household.section_money_chores` + CO map — **partial CE** (no `canonical_projections`, UI nickname/reason prose only).
- Compare ×6: deterministic shortLabels; no typed bands / projections.
- `resolveMannerArchetype`: **already fixed** (5:5 god buckets including 상관/편관/정인/편인; sweep N=500 ≈50/50). Old narrow-god collapse is not reproducible on current code.
- Distinct authorities already documented: operating CFO ≠ `asset_management` row ≠ `cfo_power_struggle.leader_side`.

---

## Scope classification

| Judgment ID | Class |
|-------------|-------|
| `comparison_table` ×6 | **MUST_CANONICALIZE** |
| `operating_cfo` | **MUST_CANONICALIZE** (complete CE lifecycle) |
| parenting refine / role notes | SHOULD → **DEFER** |
| bedroom stamina/fantasy (non-compare) | KEEP_DETERMINISTIC_PROSE |
| chores_guideline / spending_style_note | KEEP_DETERMINISTIC_PROSE |
| conflict de-escalation / cold war | KEEP_DETERMINISTIC_PROSE |
| origin story / weather / prescriptions | KEEP_DETERMINISTIC_PROSE |
| household “leadership” as generic | **DEFER** (no separate resolver beyond CFO / compare) |
| Romantic-style recovery/affection/reassurance | N/A — do not invent |

**Freeze scope = MUST only.**

---

## Semantic Boundary Table (MUST + locked cross-domain)

### comparison_table.household_stress

| Field | Value |
|-------|-------|
| User question | 가사/루틴 스트레스를 어떻게 드러내는가? |
| Inputs | dominant ten-god category |
| Enum | wealth/officer/food/seal/self |
| Explicitly NOT | marital_conflict; Friend upset_expression |
| Cross-domain | ≠ Friendship communication rhythm |

### comparison_table.marital_conflict

| Field | Value |
|-------|-------|
| User question | 부부싸움 때 소통은 폭발형인가 침묵형인가? |
| Inputs | communicationArchetype explosive vs stonewall |
| Enum | explosive/stonewall/balanced |
| Explicitly NOT | Romantic recovery_speed; Friend conflict |
| Cross-domain | ≠ Romantic residual/recovery |

### comparison_table.bedroom_lead

| Field | Value |
|-------|-------|
| User question | 침실에서 리드/가이드 성향은? |
| Inputs | `resolveMannerArchetype` (same as bedroom card) |
| Enum | sweet_guide/power_leader |
| Explicitly NOT | operating CFO; Romantic balance_of_power |
| Cross-domain | ≠ Romantic affection / balance_of_power |

### comparison_table.family_boundary

| Field | Value |
|-------|-------|
| User question | 원가족과 거리 필요가 있는가? |
| Inputs | needsStrongBoundary |
| Enum | true/false (string bands) |
| Explicitly NOT | parenting_style; Family-domain guidance |

### comparison_table.asset_management

| Field | Value |
|-------|-------|
| User question | 자산관리·재정 주도 기질(밴드)은? |
| Inputs | economic_dominance_band (SSOT) / wealthOfficer fallback |
| Enum | high/medium/low |
| Explicitly NOT | **operating_cfo** (who holds day-to-day CFO role) |
| Cross-domain | ≠ Friendship treasurer; ≠ Work resource ownership |

### comparison_table.parenting_style

| Field | Value |
|-------|-------|
| User question | 육아/교육 가치관은 공감형인가 원칙형인가? |
| Inputs | refined parenting style |
| Enum | empathy/structure |
| Explicitly NOT | family_boundary; Romantic affection |

### operating_cfo

| Field | Value |
|-------|-------|
| User question | 일상 공동 재정(예산·계좌·큰 지출) 운영 CFO는 누구인가? |
| Subject | directional (one designated operator; dual flag possible) |
| Inputs | pickHouseholdCfo → refineHouseholdCfo |
| Output | `{ side: a\|b, align?, confidence?, dual? }` client + section nickname/reason |
| Explicitly NOT | asset_management band; cfo_power_struggle; chores; bedroom_lead; Friend treasurer |
| Cross-domain | ≠ Friendship Treasurer; ≠ Romantic balance_of_power; ≠ Work leadership |

### Locked cross-domain proofs

| Marriage | ≠ | Other domain |
|----------|---|--------------|
| operating_cfo | ≠ | Friendship treasurer |
| household money ops / asset band | ≠ | Romantic balance_of_power |
| marital_conflict | ≠ | Romantic recovery_speed |
| (no Work execution judgment in Marriage) | ≠ | Work execution ownership |
| household_stress / marital_conflict | ≠ | Friendship communication_rhythm |
| bedroom_lead | ≠ | Romantic affection semantics |
| (no travel planner in Marriage) | ≠ | Friendship travel planner |
| (no reassurance CE in Marriage) | ≠ | Romantic reassurance_signal |

---

## Transport

- Add `report.canonical_projections` for MUST keys.
- Section labels derived from typed bands; projection wins over conflicting shortLabel.
- Strip removes `context_output` only.
- Legacy without projections: prose/shortLabel fallback.

---

## Future LLM context

Projections expose judgment ID + typed value + side/confidence for explanation-only digests. No prompt work in this freeze.
