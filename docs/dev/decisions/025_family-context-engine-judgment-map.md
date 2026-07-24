# 025 — Family Parent–Child Context Engine judgment map (Gate 2)

**날짜:** 2026-07-24  
**상태:** 확정 — MUST 슬라이스 구현  
**선행:** Gate 1 READY FOR JUDGMENT-MAP DESIGN  
**엔진:** Family deep = **rule-only** (`runFamilyParentChildDeepAnalysis` → `buildFamilyParentReport`)  
**방향성:** parent / child slots (not symmetric A/B). `parentRole` = **copy-only** (009).

---

## Gate 1 summary

- Entry: `runFamilyParentChildDeepAnalysis` → `buildFamilyParentReport`.
- Parent/child identity: `roles` → `resolveParentChildNicknames` → `ctx.parentNickname` / `childNickname` / `parentRole` (reliable).
- Compare ×6: deterministic personParent/personChild shortLabels; existing `resolve*Bucket` resolvers; **no** `canonical_projections`.
- Partial CE wrap bags: **none** (unlike Marriage CFO / Work leadership).
- `study_align` / `wealth_align`: child psych absolute bands in CO only (not saju match) — **METADATA_ONLY**.
- Separation: **not** a separate row (011) — pair layer inside `bond_distance` meaning + Part5 routine.
- Recognition: Part4 enrichment only (013) — **DEFER** from MUST.
- Decision 007 early axis design **superseded** by 009–014; code matches **014**.

### Decision-record reconciliation

| Record | Status |
|--------|--------|
| 007 compare design | Superseded by 009–014 |
| 008 role lens | Valid — copy-only |
| 009 A/B correction/bond | Implemented |
| 010 guidance_balance | Implemented |
| 011 separation in B | Implemented (no D row) |
| 012 home_climate | Implemented |
| 013 recognition → Part4 | Valid — DEFER CE |
| 014 final 6-row set | Implemented |
| 015–017 Part3–5 | Out of MUST CE scope |

### `resolveMannerArchetype`-style defect

N/A for Family. No equivalent collapse found in Family buckets.

---

## Scope classification

| Judgment ID | Class |
|-------------|-------|
| `comparison_table` ×6 | **MUST_CANONICALIZE** |
| correction_style / bond_distance / guidance_balance / home_climate as separate bags | N/A — rows inside comparison_table |
| affection_expression / gathering_recovery | MUST as table rows (014 keep); UI may hide (VM filters to core 4) |
| separation_task standalone | **DEFER** (nested in bond_distance; 011) |
| recognition | **DEFER** (013 Part4) |
| study_align / wealth_align | **METADATA_ONLY** (CO; keep) |
| household roles / prescriptions / SOS | KEEP_DETERMINISTIC_PROSE |

**Freeze scope = MUST `comparison_table` only.**

---

## Semantic Boundary Table (MUST)

Typed shape uses **`band_parent` / `band_child`** (not band_a/b) to encode direction.

### comparison_table.correction_style

| Field | Value |
|-------|-------|
| User question | 잔소리·지적 받을 때 반응 유형은? |
| Subject | Parent person + child person |
| ParentRole | Title/meaning copy only |
| Enum | wealth/officer/food/seal/self |
| Explicitly NOT | guidance_balance; generic conflict; Romantic residual |
| Cross-domain | ≠ Friendship upset_expression meaning |

### comparison_table.bond_distance

| Field | Value |
|-------|-------|
| User question | 편안한 정서적 거리 선호는? (+ pair separation **task** in meaning) |
| Enum | distant/balanced/smothering (`ParentBondBand`) |
| Explicitly NOT | separation readiness; Friendship closeness |
| Cross-domain | ≠ Friendship distance management |

### comparison_table.affection_expression

| Field | Value |
|-------|-------|
| User question | 가족에게 마음을 표현하는 채널(오행)은? |
| Enum | wood/fire/earth/metal/water |
| Explicitly NOT | recognition need (013); Romantic affection |
| Cross-domain | ≠ Romantic affection semantics |

### comparison_table.guidance_balance

| Field | Value |
|-------|-------|
| User question | 돌봄·지도 시 수용/설명/기준 균형은? |
| Enum | receptive/explanatory/standards/mixed |
| Explicitly NOT | Work leadership; Marriage household CFO/control; correction_style |
| Cross-domain | ≠ Work leadership; ≠ Marriage household leadership |

### comparison_table.gathering_recovery

| Field | Value |
|-------|-------|
| User question | 가족행사 후 에너지 회복 리듬은? |
| Enum | weak/balanced/strong |
| Explicitly NOT | Romantic recovery_speed |
| Cross-domain | ≠ Friendship battery (same formula family, different question) |

### comparison_table.home_climate

| Field | Value |
|-------|-------|
| User question | 집 안 구조적 긴장(기후) 밴드는? |
| Enum | low/medium/high |
| Direction | Person-level climate band each side; pair combo in meaning |
| Explicitly NOT | Romantic reassurance; parent-created vs child-experienced conflation as one enum |
| Cross-domain | ≠ Romantic reassurance_signal |

### study_align / wealth_align (METADATA)

| Field | Value |
|-------|-------|
| Meaning | Child psych absolute strength (≥60 confirms, ≤40 caution, else null) |
| Explicitly NOT | study_type / wealth_vessel match |
| Canonical | Stay in `context_output.dominant_categories` only this freeze |

---

## Transport

- `report.canonical_projections.comparison_table`
- Labels from typed bands; projection wins over shortLabel
- Strip removes `context_output` only (align metadata strip-bound; compare projections survive)
- parentRole never mutates typed bands
- Orientation: always parent/child from `roles`; viewer Track B does not flip typed identity

---

## Future LLM context

Digest: judgment ID, band_parent/band_child, parentRole for copy only, semantic exclusions. LLM explains; does not classify.
