# Work Colleague — 05 / 06 / 07 Preparation Inventory

**Document type:** Research inventory only (not a locked Product / Technical / Checklist SSOT)  
**Product:** Ahaitsme — Work Colleague / Office Partnership  
**Status:** Source material for future 05 / 06 / 07 after GPT + Gemini integration  
**Code kind key:** `work`  
**Persisted format:** `work_colleague_deep_v1` (`WORK_COLLEAGUE_DEEP_FORMAT`)  
**UI labels (i18n):** `relationshipDrilldown.work` — e.g. eyebrow `Premium · 오피스 파트너십`  
**Registry label:** `동료·비즈니스 파트너 분석` (`lib/relationship/relationshipAnalysisKinds.ts`)  
**Depends on (shared):** `01_Product_Vision.md` · `02_Relationship-ux-bible.md` · `05_Relationship_Product_Bible.md`  
**Romantic / Friend:** Out of scope for this inventory (Romantic complete; Friend research elsewhere)

**Judgement placeholders**

| Need | Marker |
|------|--------|
| Product judgement | **TBD (GPT)** |
| Market research | **TBD (Gemini)** |
| Design decisions | **TBD (Design Freeze)** |

---

# PART 05 — Product Preparation (facts only)

Mirror target later: Romantic `05A` Product Blueprint structure.  
This part records **current shipped behavior**, not the target constitution.

---

## 0. Product Manifesto

**TBD (GPT)** — product manifesto / emotional promise.

**Current framing from code/copy (factual):**

- Experience is presented as premium office partnership deep analysis.
- Part titles (`relationshipDrilldown.work.part1Title`…`part5Title`):
  1. 우리 팀 케미 한눈에 보기 / Your Team Chemistry at a Glance
  2. 두 사람의 업무 스타일 / Work Styles Compared
  3. 역할과 반복되는 협업 흐름 / Roles & The Loop You Fall Into
  4. 협업 안전장치 / Collaboration Safeguards
  5. 실전 운영 가이드 / Playbook for Working Together
- Score labels (`triScoreSnapshot/kinds.ts` `WORK_CONFIG`): 업무적 핏 · 협업 시너지 · 오피스 리스크.

---

## 1. Product Definition (as shipped)

### 1.1 What this product currently is (code)

- Kind-specific premium deep report for `RelationshipKind` / `DeepAnalysisKind` = `"work"`.
- Rule-only Context Engine body (`WorkColleagueReportBody`) plus optional LLM explain overlay (`meta.business_saju_deep`).
- Entry: `runWorkColleagueDeepAnalysis` → persist under `result_premium_by_kind.work`.
- UI: `WorkColleagueReportView` → preferred `buildWorkReportViewModel` → `WorkReportViewModelView`.

### 1.2 What this product currently is not (code)

- Not the shared basic perspectives report (`result_basic` / `/analyze/basic`).
- Not Romantic / Marriage / Friend / Family deep bodies.
- LLM overlay does not reclassify CE judgments (freeze: `docs/dev/decisions/030_business-saju-deep-narrative-freeze.md`).

### 1.3 Product promise

**TBD (GPT)**

Current value surfaces from titles/sections only — no separate promise statement in code.

---

## 2. Product Boundaries

### 2.1 Work currently owns (from modules present)

- Collaboration fit / synergy / office risk scores
- Six collaboration compare axes
- Office DNA / mix-fit / respect / roles / ideal roles / leadership split
- Relationship loop (derived from snapshot narrative + conflict trigger)
- Collaboration safeguards (warning / upset / feedback cushion)
- Work prescriptions
- Optional Deep Read narrative

### 2.2 Out of scope vs other domains (shared constitution hints)

From `05_Relationship_Product_Bible.md`: Work is a distinct product; must not be copy-only substitution of Romantic modules.

**TBD (GPT)** — hard boundary list (e.g. vs Friend social logistics, vs Marriage household CFO).

### 2.3 Hard boundary rule

**TBD (GPT)** / **TBD (Design Freeze)**

---

## 3. Product Laws

**TBD (GPT)** — domain laws. Shared narrative laws remain in Style Bible / `05_Relationship_Product_Bible.md` until domain constitution locks.

---

## 4. Current Report Structure & Core Experience Model

### 4.1 Current section order (ViewModel SSOT for UI)

Source: `lib/relationship/workColleague/viewModel/buildWorkReportViewModel.ts` builders array.

| # | `id` / `type` | `partNumber` | Title source | Renderer |
|---|---------------|--------------|--------------|----------|
| 1 | `snapshot` | 1 | Partnership at a Glance / 파트너십 한눈에 보기 | Layout scores + `TriScoreSnapshotPanel` |
| 2 | `compare_table` | 1 | Side-by-Side — 6 Collaboration Axes | `CompareTableCard` |
| 3 | `psych_radar` | 1 | 11-Axis Compatibility Radar | `PsychRadarCard` |
| 4 | `comparison` | 2 | Work Styles Compared | `ComparisonCard` (DNA, mix, respect, reporting/break summaries) |
| 5 | `role_matrix` | 3 | Roles & How You Each Contribute | `RoleMatrixCard` |
| 6 | `relationship_loop` | 3 | The Loop You Fall Into at Work | `RelationshipLoopCard` |
| 7 | `deep_read` | 3 | Deep Read | `DeepReadCard` (if overlay present) |
| 8 | `warning` | 4 | Collaboration Safeguards | `WarningCard` |
| 9 | `prescription` | 5 | Playbook for Working Together | `PrescriptionCard` → `PairPrescriptionSection` |

Sections omit when builder returns null (e.g. no psych → no radar; no overlay → no deep_read; no pairWork → no prescription).

### 4.2 Current cards / UI modules

| Module | Path / component |
|--------|------------------|
| Shell | `RelationshipReportLayout`, `WorkColleagueReportView` |
| New path | `components/relationship/workColleague/sections/SectionRenderer.tsx` |
| Legacy path | Inline JSX in `WorkColleagueReportView` when structural gate fails |
| Legacy cards | `officeCards.tsx` — `DnaCard`, `RoleCard`, `IdealRoleCard`, `UpsetGuideCard`, `DeEscalationBlock`, `WorkCompareTableCard` |
| Shared | `DeepReadCard`, `PairPrescriptionSection`, `TriScoreSnapshotPanel`, `PsychMatchRadarChart` |

### 4.3 Current UX flow (factual)

```text
Hub / relationship detail (analysisSurface kind=work or upgrade)
  → Premium empty CTA until displayWorkDeep
  → POST /api/relationship/analyze/premium { kind: "work" }
  → Cache hit via premiumByKind (requires snapshot_panel.relationshipGauges)
  → RelationshipPremiumSection mounts WorkColleagueReportView
  → Structural gate: office.section_roles + section_mix_fit styles
       → pass: ViewModel Parts 1–5
       → fail: legacy card stack (no deep_read, no part headings, no relationship_loop)
```

Free/basic: shared perspectives only — **no** truncated Work deep body in UI.

### 4.4 Content territories (target)

**TBD (GPT)** — map current sections → future territories.

### 4.5 Narrative order (target)

**TBD (GPT)** / **TBD (Design Freeze)**

---

## 5. Emotional Journey

**TBD (GPT)** — intended curve.

**Current order implication (factual only):** glance scores → compare/radar → styles → roles/loop → deep read → safeguards → playbook.

---

## 6. Hero Experience

**Current:** Opening uses `headline`, grade badge, three score chips (fit/synergy/risk), optional snapshot panel narrative.  
**TBD (GPT)** — hero constitution.  
**TBD (Design Freeze)** — hero visual identity.

---

## 7. Existing Strengths (factual / engineering)

- Full CE body + optional explain-only LLM overlay with kill switch (`RELATIONSHIP_BUSINESS_NARRATIVE`).
- Typed canonical projections for `comparison_table` and `leadership_split`.
- Psych refinement path when `psychMaster` present; safe omit when absent.
- Shared Deep Read / prescription / tri-score infrastructure reused.
- Substantial unit coverage (`work-*.test.mjs`, `business-saju-deep-*.test.mjs`).
- Non-prod narrative pilot tooling: `tests/scripts/work-narrative-pilot/`.

---

## 8. Existing Weaknesses (factual / as-shipped gaps)

- Dual renderer (ViewModel vs legacy) → inconsistent module set for same payload.
- `relationship_loop` remaps snapshot topics + warning conflict trigger → thematic duplication with Part 1 panel and Part 4 warning.
- Gauge topic keys remain `intimacy` / `stability` / `conflict` with work labels remapped (`kinds.ts` / snapshot) — taxonomy shared with romantic naming.
- `feedback_cushion.to_a` / `to_b` printed without viewer-swap in WarningCard.
- Opening `gradeReason` / `meta.uncertain_items` / `context_output` not shown in UI.
- Reporting/break person-level `.style` computed but ComparisonCard shows `.summary` only.
- LLM `real_life_example`, overlay `comparison_table` not wired to Deep Read UI.
- Section titles partly hardcoded in ViewModel `SECTION_TITLES` vs i18n part titles.

---

## 9. Hidden capabilities already available (computed / stored)

| Capability | Where |
|------------|--------|
| `WorkContextOutput` (signals, dominant_categories, section_summaries) | `buildWorkContextOutput` — stripped for client |
| Leadership canonical internals | `canonical_projections.leadership_split` — UI uses label + summary |
| Typed compare bands | canonical comparison table — UI prefers shortLabel + meaning |
| Prescription topic `office_baseline` | Also extracted as weekly check-in surface inside prescription UI |
| Business overlay full schema | Beyond Deep Read subset |

---

## 10. Existing data not surfaced in UI

| Field / structure | Location |
|-------------------|----------|
| `context_output` | report root (stripped) |
| `opening.gradeReason` / `meta.grade_reason` | opening / meta |
| `meta.uncertain_items` | meta |
| `ReportingStyleFit.person_*.style` | office psych fit |
| `BreakBoundaryFit.person_*.style` | office psych fit |
| `contribution_style` enum | DNA (label shown) |
| `BusinessSajuDeepAdviceTip.real_life_example`, `target_user` | overlay |
| `section_2_nature.comparison_table` | overlay |
| Compare row typed `band` alone | canonical |

---

## 11. Success Criteria / Open Decisions

**TBD (GPT)** — user / experience / business success criteria.  
**TBD (Gemini)** — market evidence for office-partnership product jobs.  
**TBD (Design Freeze)** — visual system for work vs romantic chrome.

---

## 12. Handoff to Technical Blueprint

Later 06 must implement locked 05. Until then, technical inventory is PART 06 below (as-built).

---

# PART 06 — Technical Preparation (architecture inventory)

Mirror target later: Romantic `06A` Technical Blueprint.  
No redesign — as-built map only.

---

## 0. Technical Manifesto (as-built principle)

Current code already separates:

1. Deterministic CE classifications (SSOT)
2. Optional LLM explain overlay
3. Client ViewModel / render projection

**TBD (GPT)** — whether to adopt Romantic-style technical manifesto wording for Work.

Canonical direction **as implemented**:

```text
PersonCore (sajuJson, sajuMaster, psychMaster)
  → buildWorkColleagueContext
  → buildOfficePartnershipReport + officePsychFit merges
  → buildWorkColleagueReport → WorkColleagueReportBody
  → [optional] attachBusinessSajuDeepOverlay → meta.business_saju_deep
  → format work_colleague_deep_v1
  → stripWorkContextOutputForClient
  → buildWorkReportViewModel → SectionRenderer
```

---

## 1. Authority and Document Hierarchy

Current technical authority in code:

1. `WorkColleagueReportBody` from `buildWorkColleagueReport` (persisted SSOT)
2. `canonical_projections.*` typed CE
3. `meta.business_saju_deep` explain-only
4. ViewModel (non-persisted)
5. Legacy renderer (fallback)

Future locked hierarchy: **TBD (GPT)** after 05 lock.  
Freeze reference: `docs/dev/decisions/030_business-saju-deep-narrative-freeze.md`.

---

## 2. System Definition

### 2.1 What the system does (as-built)

- Builds office partnership CE sections and scores
- Optionally attaches business saju deep narrative
- Projects client-safe report without `context_output`
- Renders Parts 1–5 when structural gate passes

### 2.2 What the system must not do (as-built / freeze)

- LLM must not reclassify CE judgments
- Client must not invent new classifications from stripped CO

### 2.3 Core technical objects

| Object | Type / location |
|--------|-----------------|
| Deep wrapper | `WorkColleagueDeepReport` — `workColleague/outputSchema.ts` |
| Body SSOT | `WorkColleagueReportBody` — `buildWorkColleagueReport.ts` |
| Office sections | `officeReportTemplate` / household-like office sections |
| Context | `buildWorkColleagueContext` → work rule context |
| Overlay | `BusinessSajuDeepReport` — `businessSajuDeep/outputSchema.ts` |
| ViewModel | `WorkReportViewModel` / `WorkReportSection` — `workReportSectionTypes.ts` |
| Context output | `WorkContextOutput` — `workContextOutput.ts` |

---

## 3. End-to-End Architecture

### 3.1 Canonical flow

See §0 pipeline. API: `app/api/relationship/analyze/premium/route.ts` when `kind === "work"`.

### 3.2 Layer responsibilities (as-built)

| Layer | Functions |
|-------|-----------|
| A Input | PersonCore pair load; locale |
| B Analysis | Pair saju / ten-god complement / psych masters |
| C CE | `buildWorkColleagueReport`, compare table, snapshot panel, prescriptions |
| D Orchestration | `runWorkColleagueDeepAnalysis` |
| E Narrative | `attachBusinessSajuDeepOverlay` + digest + postValidate |
| F Projection | strip CO; ViewModel; SectionRenderer |

---

## 4. Canonical Source of Truth

- **Persisted:** `{ format: work_colleague_deep_v1, report: WorkColleagueReportBody }`
- **Survives strip:** `canonical_projections.comparison_table`, `canonical_projections.leadership_split`
- **Removed for client:** `context_output`
- **Attach-only:** `meta.business_saju_deep`

---

## 5. Input Model (SSOT inputs)

| Input | Role |
|-------|------|
| `sajuJsonA/B` | Pair pillars / charts |
| `sajuMasterA/B` | `domain_signals.work_signals`; `PairWorkSignals` via `buildPairDomainSignalsFromMasters` |
| `psychMasterA/B` | Psych match + officePsychFit refinements (optional) |
| Locale | Copy pick / i18n |
| Viewer A/B | Deep Read `swap: !viewerIsReportA` |

Birth requirement (registry): `date_place`.

---

## 6. Evidence Architecture

### Saju person / pair

- Work compatibility grade / master scores (`activation`→fit, `benefit`→synergy, `risk`→office risk)
- Office DNA, weapons, handoff, roles, ideal roles
- `buildWorkSajuCompareTable` — `WorkCompareRowId`: `boundary`, `feedback`, `synergy_position`, `burnout`, `risk_taking`, `reporting_rhythm`
- Ten-god complement / leadership split

### Psych

- `buildWorkPsychMatchBundle` → `meta.psych_match`, `meta.psych_lens`
- `resolveReportingStyleFit`, `resolveBreakBoundaryFit`, `resolveContributionStyle`, feedback cushion

### Cross-source

- Snapshot narrative templates + psych person axes in panel
- Prescriptions from `PairWorkSignals` only when masters present

---

## 7. Engine Pipeline & Context Builders

| Builder | Output |
|---------|--------|
| `buildWorkColleagueContext` | Rule context |
| `buildOfficePartnershipReport` | Office section pack |
| `officePsychFit` merges | Reporting / break / contribution / cushion |
| `buildWorkSajuCompareTable` | Compare rows |
| `buildWorkSnapshotPanel` + `buildWorkSnapshotNarrative` | Tri-score panel |
| `buildWorkPrescriptions` | `meta.prescription_work` |
| `buildWorkContextOutput` | Server CO |
| `workComparisonTableCanonical` / `workLeadershipCanonical` | Typed projections |
| `buildWorkReportViewModel` | UI sections |

---

## 8. Canonical / Context / Meta outputs

### Canonical (`canonical_projections`)

- `comparison_table`
- `leadership_split`

### Context output (`WorkContextOutput`) — hidden from client UI

- grade, scores, dominant_categories, signals, axis_notes, section_summaries (as implemented)

### Meta outputs

| Key | Purpose |
|-----|---------|
| `meta.grade`, `*_pct` | Scores / grade |
| `meta.psych_match`, `psych_lens` | Radar |
| `meta.prescription_work` | Prescriptions |
| `meta.business_saju_deep` | Deep Read |
| `meta.uncertain_items` | Stored, not rendered |
| `snapshot_panel` | Tri-score UI |

---

## 9. Hidden fields (technical)

See PART 05 §10. Additionally: empty/partial CO `section_summaries` patterns; overlay fields unused by `buildDeepReadViewModel`.

---

## 10. ViewModels & Projection Layer

| Piece | Path |
|-------|------|
| VM builder | `viewModel/buildWorkReportViewModel.ts` |
| Types | `viewModel/workReportSectionTypes.ts` |
| Deep normalize | `lib/relationship/shared/deepReadViewModel.ts` |
| Client strip | `stripWorkContextOutputForClient.ts` / `omitWorkContextOutputFromReport` |
| Structural gate | `workReportSupportsNewRenderer` in `WorkColleagueReportView.tsx` |

Deep Read mapping:

| Overlay | VM |
|---------|-----|
| `section_2_nature.a_nature/b_nature` | me/partner nature |
| `section_4_business_frames.role_gap_signal` | gapSignal |
| `section_5_action.advice_*` / together | advice + together |

---

## 11. Existing reusable components

| Component | Shared? |
|-----------|---------|
| `DeepReadCard` | Yes |
| `PairPrescriptionSection` | Yes |
| `TriScoreSnapshotPanel` + `WORK_CONFIG` | Yes infra / kind config |
| `PsychMatchRadarChart` / reportLayout | Yes |
| `officeCards.tsx` | Work-specific (legacy) |
| SectionRenderer cards | Work-specific |

---

## 12. Existing reusable calculations

| Calc | Location |
|------|----------|
| Pair domain work signals | `pairDomainSignals` |
| Master scores / grade | work compatibility path in context |
| Compare table builder | `sajuCompareTable.ts` |
| Leadership / ten-god complement | `tenGodComplement.ts`, leadership canonical |
| Psych domain lens | `buildWorkPsychMatch` / psychDomainLens |
| Snapshot event-score remap | work snapshot panel helpers |
| Digest for LLM | `businessSajuPromptDigest.ts` |
| postValidate | `businessSajuDeep/postValidateNarrative` |

---

## 13. Tests (inventory)

- `tests/unit/work-report-viewmodel.test.mjs`
- `work-context-*.mjs`, `work-leadership-*.mjs`, `work-compare-reporting-contract.test.mjs`
- `work-premium-locale.test.mjs`
- `business-saju-deep-*.mjs`
- `deep-read-viewmodel.test.mjs`, `deep-read-section-wiring.test.mjs`
- `premium-by-kind-cache.test.mjs`
- Pilot: `tests/scripts/work-narrative-pilot/*`

---

## 14. Versioning / Env

| Item | Value |
|------|-------|
| Body format | `work_colleague_deep_v1` |
| Overlay format | `business_saju_deep_v1_round1` |
| Kill switch | `RELATIONSHIP_BUSINESS_NARRATIVE` |
| Model | `RELATIONSHIP_BUSINESS_MODEL` → fallbacks → `gpt-4o-mini` |

---

# PART 07 — Implementation Preparation (section inventory)

Mirror target later: Romantic `07A` checklist.  
Statuses: **Existing** | **Partial** | **Missing**  
No implementation order recommendations.

Product/quality gates beyond as-built: **TBD (GPT)** / **TBD (Design Freeze)**.  
Market acceptance gates: **TBD (Gemini)**.

---

## 0. Purpose

Inventory only: what already ships vs partial vs absent relative to a future locked 05/06 (not yet written).

---

## 1. Release Verdict

**Not applicable** — research prep. Future checklist will use READY TO COMMIT / RELEASE / etc.

---

## 2–4. Product Constitution / Journey / Questions

**TBD (GPT)** — checklist items after 05 lock.

---

## 5. Section-by-section status (as-built vs complete product asset)

| Section / asset | Status | Notes |
|-----------------|--------|-------|
| Opening headline + grade | Existing | gradeReason Partial (stored, not shown) |
| Tri-score snapshot panel | Existing | topic key taxonomy shared with romantic |
| Compare table (6 axes) | Existing | band display Partial |
| Psych radar | Existing | omits without psych |
| Comparison / DNA / mix / respect | Existing | person styles Partial |
| Role matrix + leadership | Existing | |
| Relationship loop | Existing | content Partial (reuse/duplication) |
| Deep Read | Existing | schema extras Missing in UI |
| Warning / upset / cushion | Existing | viewer-swap on cushion Missing |
| Prescriptions | Existing | requires pairWork |
| Part chrome (1–5 headings) | Existing on VM path; Missing on legacy path |
| Free mid-tier Work body | Missing | basic ≠ work deep |
| Dedicated timeline module | Missing | not in Work VM |
| Target Product Laws compliance | Missing | no locked 05 yet |

---

## 6. Reusable logic (do not reimplement blindly)

- `buildDeepReadViewModel`
- Pair prescription builders pattern
- Tri-score kinds registry pattern
- `strip*ContextOutputForClient` pattern
- Canonical comparison table injection pattern
- `run*DeepAnalysis` + attach overlay pattern
- Psych match bundle pattern

---

## 7. Reusable UI

- `DeepReadCard`
- `PairPrescriptionSection`
- `TriScoreSnapshotPanel`
- `RelationshipReportLayout` / psych radar
- `RelationshipPremiumSection` mount pattern

---

## 8. Reusable server projections

- `canonical_projections.comparison_table`
- `canonical_projections.leadership_split`
- Premium-by-kind cache (`premiumByKind.ts`)
- Client omit of `context_output`

---

## 9. Deterministic / LLM boundary gate (as-built)

| Concern | Status |
|---------|--------|
| CE SSOT body | Existing |
| Overlay explain-only freeze | Existing (030) |
| postValidate narrative | Existing |
| Fail-soft overlay attach | Existing |

---

## 10. Testing gate (as-built coverage)

| Area | Status |
|------|--------|
| ViewModel | Existing tests |
| Locale | Existing |
| Overlay digest/round1 | Existing |
| Deep Read wiring | Existing (shared) |
| Product editorial checklist | Missing (needs 07 lock) |
| Gemini market fixtures | Missing — **TBD (Gemini)** |

---

## 11. Marriage / Romantic boundary gate for Work

**TBD (GPT)** — explicit Work-vs-Marriage / Work-vs-Friend ownership checklist.

---

## Final note

This file is **source material**, not authority.  
Do not treat it as replacing `05_Relationship_Product_Bible.md` or a future Work 05/06/07.
