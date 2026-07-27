# Work Colleague Platform Capability Audit

**Document type:** Platform reverse-engineering audit  
**Domain:** Work / Office Partnership (`work`)  
**Runtime format:** `work_colleague_deep_v1`  
**Overlay:** `meta.business_saju_deep` (`business_saju_deep_v1_round1`)  
**Freeze:** `docs/dev/decisions/030_business-saju-deep-narrative-freeze.md`  
**Status:** Research knowledge base — no redesign / no decisions

---

# Executive Summary

## Overall implementation maturity

Work is a **strong CE product** with office DNA, roles, leadership split, compare axes, and prescriptions. Maturity is high on deterministic collaboration classification; medium on ViewModel coherence (`relationship_loop` is a **remix**, not new evidence); low on consuming Context Output and person-level psych styles in UI.

## Major strengths

1. Clear collaboration score triad: fit / synergy / office risk (`WORK_CONFIG`).  
2. Typed canonical projections: `comparison_table`, `leadership_split`.  
3. Role matrix + ideal roles + leadership split form a coherent “how we work” spine.  
4. Psych refinements (reporting, break boundary, contribution) are optional and null-safe.  
5. Narrative pilot tooling exists (`tests/scripts/work-narrative-pilot/`) for offline quality work.  
6. Overlay is explain-only with env kill switch.

## Major weaknesses

1. **`relationship_loop` invents no new engine truth** — remaps snapshot narrative topics + warning conflict trigger → user may feel “I already read this.”  
2. Dual renderer gate (`workReportSupportsNewRenderer`) drops Deep Read / loop / part chrome on legacy path.  
3. `feedback_cushion` ignores viewer-swap (A/B fixed) while other cards swap.  
4. Gauge topic keys still `intimacy|stability|conflict` under work labels — taxonomy leak from Romantic.  
5. CO categories (reporting/break/contribution/leadership confidence) never reach UI.

## Biggest missing chains

| Chain | Break |
|-------|--------|
| CO dominant_categories | Strip → nowhere in UI |
| Reporting/Break person `.style` | Computed → VM keeps → UI shows `.summary` only |
| Leadership internals | Canonical → label+summary only |
| Overlay extras | Schema → Deep Read drops examples/table |
| Dedicated project-timeline module | Absent |

---

# Capability Map

| Capability | Inferred user question | Origin | Producer | Confidence | Consumed by | State |
|------------|------------------------|--------|----------|------------|-------------|-------|
| Fit / Synergy / Risk % | Are we a good work pair? What’s the friction? | Pair saju grade | `computeWorkCompatibilityGrade` / master scores | Deterministic | Chips + snapshot | Full |
| TriScore panel | Same with topic narratives | Remap | `buildWorkSnapshotPanel` + `buildWorkSnapshotNarrative` | Deterministic templates | Panel | Full |
| Compare 6 axes | How do we differ as collaborators? | Saju bands | `buildWorkSajuCompareTable` | Typed bands | Compare card + canonical labels | Full |
| Psych radar | Survey alignment at work? | Psych | `buildWorkPsychMatchBundle` | Needs psych | Radar | Partial |
| Office DNA / weapons / handoff | What’s my office character? | DNA builders | Office report template + copy | Template | Comparison card | Full |
| Mix-fit / respect | How do styles mix / respect boundaries? | CE sections | Office pack | Template | Comparison | Full |
| Reporting style fit | How should we report to each other? | Saju+psych | `resolveReportingStyleFit` | Needs psych for full | Summary only in UI | Partial |
| Break boundary fit | How do we take breaks / disconnect? | Saju+psych | `resolveBreakBoundaryFit` | Needs psych | Summary only | Partial |
| Contribution style | How do I contribute? | Saju+psych | `resolveContributionStyle` | Enum+label | Label shown; enum Hidden | Partial |
| Role matrix / ideal roles | What roles should we take? | Ten-god complement + psych | Roles builders | Mixed | RoleMatrixCard | Full |
| Leadership split | Who leads external vs review? | Canonical leadership | `workLeadershipCanonical` | Typed | Label + summary | Partial (internals hidden) |
| Relationship loop | What loop do we fall into? | **Remix** of snapshot topics + conflict trigger | ViewModel only | No new calc | Loop card | Partial / duplicated |
| Warning / upset / cushion | What are the safeguards? | CE warning + psych cushion | Office sections | Mixed | WarningCard | Partial (cushion swap) |
| Prescriptions | What operating habits help? | `PairWorkSignals` | `buildWorkPrescriptions` | Needs masters | Prescription UI | Partial |
| Deep Read | Story behind roles/gap | LLM | `attachBusinessSajuDeepOverlay` | Explain-only | DeepReadCard | Partial |
| Context Output | Internal categories | Repack | `buildWorkContextOutput` | Typed | Digest only | Hidden |

### `WorkCompareRowId`

`boundary` · `feedback` · `synergy_position` · `burnout` · `risk_taking` · `reporting_rhythm`

### Prescription topics (examples)

`micromanaging_coordination` · `leadership_conflict` · `office_baseline` (also surfaced as weekly check-in extraction)

### Supporting files

```
lib/relationship/workColleague/buildWorkColleagueReport.ts
lib/relationship/workColleague/buildWorkColleagueContext.ts
lib/relationship/workColleague/officeReportTemplate.ts
lib/relationship/workColleague/officeLanguage.ts
lib/relationship/workColleague/officePsychFit.ts
lib/relationship/workColleague/sajuCompareTable.ts
lib/relationship/workColleague/workContextOutput.ts
lib/relationship/workColleague/workComparisonTableCanonical.ts
lib/relationship/workColleague/workLeadershipCanonical.ts
lib/relationship/workColleague/tenGodComplement.ts
lib/relationship/workColleague/buildWorkSnapshotPanel.ts
lib/relationship/workColleague/buildWorkSnapshotNarrative.ts
lib/relationship/workColleague/buildWorkPrescriptions.ts
lib/relationship/workColleague/viewModel/*
lib/prompts/relationshipPremium/workColleague/*
lib/prompts/relationshipPremium/businessSajuDeep/*
lib/relationship/businessSajuPromptDigest.ts
components/relationship/WorkColleagueReportView.tsx
components/relationship/workColleague/sections/SectionRenderer.tsx
components/relationship/workColleague/officeCards.tsx
```

---

# Full Pipeline Audit

```text
PersonCore
  → buildWorkColleagueContext
  → buildOfficePartnershipReport + officePsychFit
  → buildWorkColleagueReport → WorkColleagueReportBody
  → attachBusinessSajuDeepOverlay?
  → work_colleague_deep_v1
  → stripWorkContextOutputForClient
  → WorkColleagueReportView
       gate: section_roles + mix_fit styles
       → VM Parts 1–5 OR legacy officeCards stack
```

| Stage | Status |
|-------|--------|
| Engine | Full for office CE |
| SSOT | `WorkColleagueReportBody` / `office.*` |
| Canonical | comparison_table, leadership_split |
| Context | Built → stripped |
| Meta | psych, prescriptions, business_saju_deep, uncertain_items |
| ViewModel | Full when gate passes |
| UI | Dual |
| Narrative | Deep Read optional |
| User | Collaboration playbook experience |

### Chain: Leadership split — Partial

```text
Engine ten-god / complement
  → Canonical leadership_split
  → CO leadership_confidence / align
  → VM role_matrix leadershipCanonicalLabel + summary
  → UI summary
BREAK: confidence/align categories & rich internals not badged
```

### Chain: Relationship loop — Duplicated / weak new value

```text
Snapshot narrative topics + section_warning.conflict_trigger
  → ViewModel relationship_loop fields
  → UI Loop card
BREAK: no dedicated engine loop object; duplicates Part1/Part4
```

### Chain: Reporting style — Disconnected depth

```text
officePsychFit → ReportingStyleFit { person_a/b.style, summary }
  → VM may hold person slots
  → ComparisonCard renders summary only
BREAK: person styles never become comparison cells
```

---

# Report Usage Audit

## Users see

Part1: scores, TriScore, compare, radar  
Part2: DNA / mix / respect / reporting & break summaries  
Part3: roles, loop, Deep Read  
Part4: safeguards  
Part5: prescriptions  

## Never see

CO categories; gradeReason; uncertain_items; contribution enum; reporting/break person styles; leadership confidence; overlay examples/table; timeline.

## LLM uses

Household/office digest from CE → business overlay. Classifications remain CE.

## UI ignores

Person-level psych style detail; CO; many meta fields.

## Deterministic vs LLM vs editorial

| Area | Character |
|------|-----------|
| Scores, compare, roles, leadership, prescriptions | Deterministic CE |
| Snapshot narrative topics | Deterministic **editorial** templates |
| Loop | Editorial remix |
| DNA/weapons copy | Locale templates |
| Deep Read | LLM |

---

# Hidden Opportunities

| Item | Why valuable | UX observation |
|------|--------------|----------------|
| Reporting/Break person styles | Already resolved per person — natural compare cells | Could densify Part2 without new engine |
| Leadership confidence/align | Distinguishes clear vs contested leadership | Badge on role matrix |
| CO person_a/b_strong / lacking | Strength/lack categories ready | “Complement map” chips |
| Contribution enum | Stable id behind label | Analytics / i18n stability / filters |
| Conflict trigger single SSOT | Today duplicated across loop+warning | One surface reduces fatigue |
| Work narrative pilot artifacts | Offline rubric already exists | Quality gate for future 07 |
| Gauge key rename opportunity | intimacy→work-fit semantics | Visual system clarity vs Romantic |

---

# Structural Problems

1. Loop as ViewModel fanfic of existing fields.  
2. Legacy `officeCards` vs SectionRenderer divergence.  
3. Romantic taxonomy keys on work gauges.  
4. Cushion viewer asymmetry.  
5. Prescription `office_baseline` double surface (extracted + list).  
6. Hardcoded `SECTION_TITLES` vs i18n part titles split brain.

---

# Reuse Opportunities

| Asset | Platform reuse | Why |
|-------|----------------|-----|
| Deep Read / Prescriptions / TriScore / Radar | All domains | Already shared |
| Leadership canonical pattern | Marriage CFO-like “role authority” projections | Same “typed authority + client label” pattern |
| officePsychFit style+summary shape | Friend counseling / Marriage rejection | Optional psych refine pattern |
| Compare table + bands | All | Platform table |
| Narrative pilot harness | Other domains | Quality infrastructure |
| Relationship loop **pattern** | Caution | Reusing *remix* without engine object would copy debt |

Work-specific (do not blindly share): office weapons, burnout axis, micromanaging prescription topics.

---

# Important Findings

**Product**  
- Work already owns collaboration ops language; must not absorb Friend hangout money or Marriage household CFO.  
- Loop section risks perceived padding unless product decides it is the intentional “pattern recognition” beat.

**UX / Visual**  
- Viewer-swap consistency is incomplete (cushion).  
- Score key taxonomy leaks Romantic metaphors into office chrome.

**Architecture**  
- Strong canonical leadership + compare; weak CO→UI.  
- Remix sections should be flagged in 06 as “derived presentation,” not “new judgments.”

**05 / 06 / 07**  
- 05: decide whether loop is a first-class question or a presentation of snapshot.  
- 06: separate DerivedProjection vs CanonicalJudgment.  
- 07: legacy gate + cushion swap + unused style fields policy.

---

*End of Work Platform Capability Audit*
