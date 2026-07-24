# 021 — Work Colleague Context Engine judgment map (Gate 2)

**날짜:** 2026-07-24  
**상태:** 확정 — MUST 슬라이스 구현  
**선행:** Gate 1 READY FOR JUDGMENT-MAP DESIGN  
**엔진:** Work deep = **rule-only** (LLM 분류 금지; 추후 LLM은 설명만)

---

## Gate 1 summary (baseline)

- Entry: `runWorkColleagueDeepAnalysis` → `buildWorkColleagueReport` (no LLM).
- Existing Leadership: `resolveLeadershipRoleSplit` → `refineLeadershipRoleSplit` → `buildWorkLeadershipCanonical` → `office.section_roles.leadership_split` — **partial CE** (no `canonical_projections`, UI shows `summary` prose only).
- Compare table: 6 deterministic shortLabel rows; no typed bands / projections.
- Relationship lens in product: peer / business-partner collaboration on one `work` kind — **no manager/direct-report lens** → hierarchy-fit deferred.
- Leadership answers only: who fits **external present/report** vs **internal QA/review** — must not absorb initiative, decision authority, execution, planning, or extroversion.

---

## Scope classification

| Judgment ID | Class |
|-------------|-------|
| `comparison_table` ×6 | **MUST_CANONICALIZE** |
| `leadership_split` | **MUST_CANONICALIZE** (complete CE lifecycle) |
| `reporting_style_fit` | SHOULD → **DEFER** |
| `contribution_style` | SHOULD → **DEFER** |
| `break_boundary_fit` | SHOULD → **DEFER** |
| `feedback_cushion` | KEEP_DETERMINISTIC_PROSE |
| DNA / ideal roles / de-esc / prescriptions | KEEP_DETERMINISTIC_PROSE |
| Manager/report hierarchy fit | **DEFER** (lens undefined) |
| Business-partner-only climate | METADATA / DEFER (same engine as coworker) |

**Freeze scope = MUST only.**

---

## Semantic Boundary Table (MUST)

### comparison_table.boundary

| Field | Value |
|-------|-------|
| User question | 공사(일/사) 구분선은 어디에 긋는가? |
| Lens | Peer / partner (lens-neutral in current product) |
| Subject | Person A/B |
| Inputs | `resolveWorkCategory` (ten-god category + workSignals) |
| Enum | `재성` \| `관성` \| `식상` \| `인성` \| `비겁` |
| Explicitly NOT | feedback row (same category input, different question); leadership |
| Cross-domain | Not Family guidance; not Marriage boundary |

### comparison_table.feedback

| Field | Value |
|-------|-------|
| User question | 피드백을 어떻게 받아들이는가? |
| Inputs | same category resolver as boundary |
| Enum | same TenGodCategory codes |
| Explicitly NOT | boundary; conflict de-escalation; Friend upset_expression |

### comparison_table.synergy_position

| Field | Value |
|-------|-------|
| User question | 협업 시 어떤 포지션(오행 결)인가? |
| Inputs | `dominantElement(chart)` |
| Enum | wood/fire/earth/metal/water (via ELEMENT_OFFICE keys) |
| Explicitly NOT | leadership; Romantic elemental prose |

### comparison_table.burnout

| Field | Value |
|-------|-------|
| User question | 오피스 번아웃을 어떻게 푸는가? |
| Inputs | day branch code |
| Enum | branch codes (ja…hae) |
| Explicitly NOT | Friend battery_recharge; Romantic residual |

### comparison_table.risk_taking

| Field | Value |
|-------|-------|
| User question | 딜·추진 리스크 성향은? |
| Inputs | strength label → `resolveRiskBand` |
| Enum | `strong` \| `weak` \| `balanced` |
| Explicitly NOT | leadership external; Friend hangout |

### comparison_table.reporting_rhythm

| Field | Value |
|-------|-------|
| User question | 협업 전달·추진 리듬은? |
| Inputs | day stem yang/yin |
| Enum | `yang` \| `yin` |
| Explicitly NOT | `reporting_style_fit` (report format); Friend contact tempo / DNA tikitaka |

### leadership_split

| Field | Value |
|-------|-------|
| User question | 대외 발표 vs 실무 검수 역할은 누구에게 맡길까? |
| Subject | Directional pair (`a`/`b`/`balanced` per facet) |
| Inputs | workSignals officer+self vs seal+wealth; psych refine |
| Existing | resolve → refine → wrap |
| Output | `{ external_lead, internal_qa_lead, align?, confidence? }` |
| Null | no workSignals → null split |
| Explicitly NOT | initiative; decision authority; execution ownership; planning; management hierarchy; Friend travel; Marriage CFO; Family control |
| Canonical | `canonical_projections.leadership_split` + keep section field |

---

## Transport

- Add `report.canonical_projections` for MUST keys.
- Section labels derived from typed bands; projection wins over conflicting shortLabel.
- Strip continues to remove `context_output` only.
- Legacy without projections: prose/shortLabel fallback; no invent from strings.

---

## Future LLM context

Projections must expose judgment ID + typed value + direction/confidence for explanation-only digests. No prompt work in this freeze.
