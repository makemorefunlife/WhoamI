# Family Parent–Child — 05 / 06 / 07 Preparation Inventory

**Document type:** Research inventory only (not a locked Product / Technical / Checklist SSOT)  
**Product:** Ahaitsme — Family Parent–Child / Child DNA Playbook  
**Status:** Source material for future 05 / 06 / 07 after GPT + Gemini integration  
**Code kind key:** `family`  
**Persisted format:** `family_parent_child_deep_v2` (`FAMILY_PARENT_CHILD_DEEP_FORMAT`)  
**UI labels:** `relationshipDrilldown.family`; default kind label `Premium · Child DNA Playbook`  
**Registry label:** `가족 Child DNA Playbook`  
**Depends on (shared):** `01` · `02` · `05_Relationship_Product_Bible.md`  
**Romantic / Friend:** Out of scope here

**Judgement placeholders:** **TBD (GPT)** · **TBD (Gemini)** · **TBD (Design Freeze)**

**Constitution note from `05_Relationship_Product_Bible.md` (factual citation):** Family preserves **two user perspectives** (Child and Parent), not one undifferentiated Family product.  
**Code reality:** One report schema (`FamilyParentReportBody`) with Track A/B gates (`child_is_viewer`, `parent_type`) — not two separate formats.

---

# PART 05 — Product Preparation (facts only)

---

## 0. Product Manifesto

**TBD (GPT)**

**Current framing from code/copy:**

- Hub / premium product name: Child DNA Playbook.
- Part headings (`relationshipDrilldown.family`):
  - Part2: 낱낱이 스코어링
  - Part3: 타고난 DNA와 올해의 성장
  - Part4: 관계 케미와 미래의 가능성
  - Part5: 안전장치 & 실전 처방
- **No Part1 section emitted** by ViewModel (header comment in `buildFamilyReportViewModel`).
- Score labels (`FAMILY_CONFIG`): 정서적 유대 · 성장 시너지 · 훈육 마찰.

---

## 1. Product Definition (as shipped)

### 1.1 What this product currently is

- Premium deep analysis for `kind === "family"`.
- Rule CE body via `buildFamilyParentReport` + optional `meta.family_saju_deep`.
- Entry: `runFamilyParentChildDeepAnalysis`.
- UI: `FamilyParentReportView` → `buildFamilyReportViewModel` → `FamilyReportViewModelView`.
- Role resolution: exactly one child + one mother|father (`FamilyParentPairRoles`); `resolveFamilyRolesFromViewer`.

### 1.2 What this product currently is not

- Not basic perspectives-only product.
- Not Marriage parenting card set (different kind/`cohabitation`).
- Not two persisted report formats for parent vs child (perspective is flags + gated sections).

### 1.3 Product promise

**TBD (GPT)**  
**TBD (Gemini)** — parent vs child jobs-to-be-done evidence.

---

## 2. Product Boundaries

### 2.1 Family currently owns (modules present)

- Bond / growth synergy / discipline friction scores
- Relationship index
- Parent–child compare axes (6 computed; 4 displayed)
- Household roles, child DNA, talent, growth tunnel, family psych role
- Filial frequency (Track B), destiny, filial reward, SOS scripts
- De-escalation + prescriptions
- Optional Deep Read (fixed parent/child slots — no viewer-swap)

### 2.2 Marriage vs Family (factual overlap risk)

Marriage `cohabitation` also has `section_parenting`, family_boundary, household ops.  
Family centers child DNA / parent–child chemistry / filial scripts.

**TBD (GPT)** — hard ownership split.  
**TBD (Design Freeze)** — shared vs distinct parenting visuals.

### 2.3 Child vs Parent perspective

| Track | `child_is_viewer` | Notable gates |
|-------|-------------------|---------------|
| A Parent view | `false` (default) | No `section_filial_frequency`; parent-facing tone |
| B Child view | `true` | Filial frequency built; `boundary_script` on de-escalation |

Mother vs father: `parent_type` / `parent_role` adjusts copy and score tweaks (`computeFamilyMasterScores`) — not separate formats.

**TBD (GPT)** — whether future Family product SSOT is one Family blueprint with perspectives, or two blueprints as `05_Relationship_Product_Bible.md` outlines.

---

## 3. Product Laws

**TBD (GPT)**

---

## 4. Current Report Structure & Experience Model

### 4.1 Current section order

Source: `lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts`.

| # | `id` / `type` | `partNumber` | UI card |
|---|---------------|--------------|---------|
| 1 | `snapshot` | 2 | Layout scores + `TriScoreSnapshotPanel` |
| 2 | `relationship_index` | 2 | `RelationshipIndexCard` |
| 3 | `compare_table` | 2 | `CompareTableCard` (4 rows) |
| 4 | `household_roles` | 2 | `HouseholdRolesCard` |
| 5 | `psych_radar` | 2 | `PsychRadarCard` |
| 6 | `child_dna` | 3 | `ChildDnaCard` |
| 7 | `talent` | 3 | `TalentCard` |
| 8 | `growth_tunnel` | 3 | `GrowthTunnelCard` |
| 9 | `family_role` | 3 | `FamilyRoleCard` |
| 10 | `filial_frequency` | 3 | `FilialFrequencyCard` (Track B only) |
| 11 | `deep_read` | 4 | `DeepReadCard` |
| 12 | `destiny` | 4 | `DestinyCard` |
| 13 | `filial_reward` | 4 | `FilialRewardCard` |
| 14 | `sos_script` | 4 | `SosScriptCard` |
| 15 | `de_escalation` | 5 | `DeEscalationCard` |
| 16 | `prescription` | 5 | `PairPrescriptionSection` |

Opening: `headline`, `one_line_family`, `grade`, `names: [child_nickname, parent_nickname]` — fixed child-first naming; columns parent=`names[1]`, child=`names[0]`.

### 4.2 Compare display filter

Displayed (`PART2_COMPARE_TABLE_DISPLAY_IDS`):  
`correction_style`, `bond_distance`, `guidance_balance`, `home_climate`.

Stored but not rendered: `affection_expression`, `gathering_recovery`.

Full row id type: `FamilyCompareRowId` in `familySajuCompareTable.ts`.

### 4.3 Current UX flow

```text
Hub surface family / premium generate
  → POST premium { kind: "family" }
  → family_parent_child_deep_v2
  → FamilyParentReportView
  → VM sections.length > 0 → FamilyReportViewModelView
  → else legacy inline cards (omits several Part2 modules + Deep Read)
```

Free/basic: shared perspectives only.

### 4.4 Territories / narrative order (target)

**TBD (GPT)** / **TBD (Design Freeze)**

---

## 5. Emotional Journey

**TBD (GPT)**

Current factual flow: scoring/index/compare → DNA/growth → chemistry/future/SOS → safety scripts/prescriptions.

---

## 6. Hero Experience

**Current:** grade + three scores + snapshot panel; no separate Part1 hero module.  
Product “Part1 입체 진단” content approximately lives in `relationship_index` under partNumber 2.

**TBD (GPT)** / **TBD (Design Freeze)**

---

## 7. Existing Strengths (factual)

- Explicit parent/child role model and Track B gating.
- Rich CE section set (DNA, talent, growth, SOS, filial).
- Psych-aware role/talent/filial enrichment without flipping saju talent enums.
- Canonical comparison projection + CO strip pattern.
- Overlay freeze `029_family-saju-deep-narrative-freeze.md`.
- Broad `tests/unit/family-*.test.mjs` coverage.

---

## 8. Existing Weaknesses (factual)

- Part numbering drift (UI Part2–5; no Part1 section).
- Two compare rows computed but hidden — body kept for cache validity.
- `reward_index` in VM type but `FilialRewardCard` shows `futureReward` only.
- Registry `triScoreKind: "romantic"` for family while panel uses `kind="family"` (`relationshipAnalysisKinds.ts` vs `FAMILY_CONFIG`).
- Legacy fallback omits major modules when VM empty.
- `lib/relationship/familyParent/README.md` lists stale TODOs vs shipped code.
- Deep Read does not viewer-swap (fixed parent/child) — intentional for family; may confuse if viewer is child without copy clarity (**TBD (Design Freeze)**).

---

## 9. Hidden capabilities already available

| Capability | Where |
|------------|--------|
| Full 6-row compare table | `section_compare_table` |
| `reward_index` | `section_filial_reward` |
| `FamilyContextOutput` dominant_categories (family_role, study_type, wealth_vessel, aligns, child_archetype, …) | stripped CO |
| `meta.uncertain_items`, `gradeReason` | meta / opening |
| Overlay `comparison_table`, `real_life_example`, `target_user` | `family_saju_deep` |
| Track B filial frequency + boundary scripts | gated sections |

---

## 10. Existing data not surfaced in UI

| Field | Location |
|-------|----------|
| Compare rows `affection_expression`, `gathering_recovery` | section_compare_table |
| `reward_index` | section_filial_reward / FilialRewardSection |
| `context_output` | stripped |
| `meta.uncertain_items` | meta |
| Opening `gradeReason` | OpeningBlock (badge uses grade only) |
| Overlay extras | family_saju_deep |
| Talent raw enums | UI shows labels + notes |

---

## 11. Success Criteria / Open Decisions

**TBD (GPT)** — success criteria; one vs two Family blueprints.  
**TBD (Gemini)** — parent-market vs child-market research.  
**TBD (Design Freeze)** — perspective UX, Part1 restoration, hidden row policy.

---

# PART 06 — Technical Preparation

---

## 0. Technical flow (as-built)

```text
PersonCore + resolveFamilyRolesFromViewer(parent_type, child_is_viewer)
  → buildPairDomainSignalsFromMasters → pairFamily + family/friendship signals
  → buildFamilyParentReport
       → buildFamilyRuleContext
            → buildPairSajuBlueprint
            → analyzeFamilyPairSaju
            → analyzeFamilyParentTenGod
            → computeFamilyCompatibilityGrade / masterScores
            → buildFamilyKillerSections
       → compare / household / role / index / talent+psych / sos / filial freq
       → buildFamilyParentSnapshotPanel
       → buildFamilyPsychMatchBundle
       → buildFamilyPrescriptions
       → buildFamilyContextOutput
       → injectFamilyComparisonTableClientProjection
  → attachFamilySajuDeepOverlay (unless skip / RELATIONSHIP_FAMILY_NARRATIVE=0)
  → stripFamilyContextOutputForClient
  → buildFamilyReportViewModel → FamilyReportViewModelView
```

---

## 1. Authority (as-built)

1. `FamilyParentReportBody` persisted SSOT  
2. `canonical_projections.comparison_table`  
3. `meta.family_saju_deep` explain-only (`029`)  
4. Non-persisted ViewModel  
5. Legacy UI fallback  

Future hierarchy: **TBD (GPT)** after 05 lock.

---

## 2. Core technical objects

| Object | Location |
|--------|----------|
| Deep wrapper | `FamilyParentChildDeepReport` — `familyParentChild/outputSchema.ts` |
| Body | `FamilyParentReportBody` — `buildFamilyParentReport.ts` |
| Template sections | `familyReportTemplate.ts` / `FamilyParentChildReport` |
| Rule context | `buildFamilyRuleContext` |
| Overlay | `FamilySajuDeepReport` — `familySajuDeep/outputSchema.ts` |
| VM | `FamilyReportViewModel` / `FamilyReportSection` |
| CO | `FamilyContextOutput` — `familyContextOutput.ts` |
| Roles | `FamilyParentPairRoles`, `resolveFamilyRolesFromViewer` |

---

## 3. SSOT inputs

| Input | Role |
|-------|------|
| `sajuJsonA/B` | Pair charts |
| `sajuMasterA/B` | `family_signals`, friendship signals for compare paths; `PairFamilySignals` |
| `psychMasterA/B` | Radar, family role, aux notes (optional) |
| `parent_type` | mother/father lens |
| `child_is_viewer` | Track A/B |
| Locale | Copy |

Registry birthRequirement: `date_place`.

---

## 4. Evidence / engines

| Engine | Function |
|--------|----------|
| Pair analysis | `analyzeFamilyPairSaju` (`lib/saju/familyAnalysis.ts`) |
| Ten-god parent lens | `analyzeFamilyParentTenGod` |
| Master scores | `computeFamilyMasterScores` → bond/synergy/risk |
| Killer prose | `buildFamilyKillerSections` |
| Compare | `buildFamilySajuCompareTable` |
| Household roles | `buildFamilyHouseholdRoles` |
| Talent | `buildFamilyTalentSection` + `applyFamilyTalentPsychAuxNotes` |
| Filial frequency | `buildFamilyFilialFrequencySection` (Track B) |
| SOS | `buildFamilySosSection` |
| Index | `buildFamilyRelationshipIndexSection` |
| Prescriptions | `buildFamilyPrescriptions` |
| Snapshot | `buildFamilyParentSnapshotPanel` |
| Psych bundle | `buildFamilyPsychMatchBundle` |
| Digest | `familySajuPromptDigest.ts` / `buildFamilyHouseholdDigest` |

---

## 5. Canonical / Context / Meta outputs

### Canonical

- `canonical_projections.comparison_table`

### Context output (stripped)

- grade, scores, dominant_categories (family_role, study_type, wealth_vessel, study_align, wealth_align, child_archetype, …), signals, `axis_notes.decision_style`, section_summaries

### Meta

| Key | Purpose |
|-----|---------|
| `psych_match`, `psych_lens` | Radar |
| `prescription_family` | Prescriptions |
| `family_saju_deep` | Deep Read |
| `uncertain_items`, `person_core` | hydrate / unused in cards |
| `snapshot_panel` | Tri-score |

---

## 6. Hidden fields

See PART 05 §10. Plus CO category inventory unused by UI.

---

## 7. ViewModels & projection

| Piece | Path |
|-------|------|
| VM | `viewModel/buildFamilyReportViewModel.ts`, `familyReportSectionTypes.ts` |
| Deep Read | `buildDeepReadViewModel` — family uses parent/child fixed order (no swap) |
| Strip | `stripFamilyContextOutputForClient.ts` |
| Renderer | `familyParent/sections/SectionRenderer.tsx` |
| Entry | `FamilyParentReportView.tsx` |

Deep Read overlay mapping (subset): nature (parent/child variants in schema) / `generation_gap_signal` / advice_for_parent|child / together.

---

## 8. Reusable components & calculations

**UI:** `DeepReadCard`, `PairPrescriptionSection`, `TriScoreSnapshotPanel` (`FAMILY_CONFIG`), reportLayout, family-specific cards in SectionRenderer.

**Logic:** pairDomainSignals family, psychDomainLens `buildFamilyPsychMatch`, family psych roles (`familyPsychRoles.ts`), de-escalation prescriptions (`childDeEscalationPrescriptions.ts`), shared deep-read normalize.

---

## 9. Env / formats

| Item | Value |
|------|-------|
| Body | `family_parent_child_deep_v2` |
| Overlay | `family_saju_deep_v1_round1` |
| Kill switch | `RELATIONSHIP_FAMILY_NARRATIVE` |
| Model | `RELATIONSHIP_FAMILY_MODEL` → married → romantic → `gpt-4o-mini` |

---

## 10. Tests

`tests/unit/family-*.test.mjs`, `family-saju-deep-*.test.mjs`, `family-context-engine-canonical.test.mjs`, shared `deep-read-*.test.mjs`.

---

# PART 07 — Implementation Preparation

No implementation order.

---

## Section / asset status

| Section / asset | Status | Notes |
|-----------------|--------|-------|
| Snapshot + tri-score | Existing | registry triScoreKind mismatch Partial |
| Relationship index | Existing | |
| Compare table | Partial | 4/6 rows shown |
| Household roles | Existing | |
| Psych radar | Existing | needs psych |
| Child DNA | Existing | |
| Talent | Existing | |
| Growth tunnel | Existing | |
| Family psych role | Existing | needs psych |
| Filial frequency | Existing Track B; Missing Track A (by design gate) | |
| Deep Read | Existing | extras Missing in UI |
| Destiny | Existing | |
| Filial reward | Partial | reward_index not shown |
| SOS script | Existing | |
| De-escalation | Existing | boundary_script Track B |
| Prescriptions | Existing | needs pairFamily |
| Part1 hero module | Missing | numbering drift |
| Separate Child product format | Missing | perspective flags only |
| Separate Parent product format | Missing | same |
| Locked 05 laws/checklist | Missing | |
| Legacy-parity VM | Partial | fallback omits modules |

---

## Reusable logic / UI / projections

Same shared stack as Work/Marriage: Deep Read VM/UI, prescriptions UI, tri-score infra, CO strip, comparison canonical injection, premium-by-kind, overlay attach+postValidate.

Family-specific reusable: role resolver, Track gates, talent/SOS/filial builders, family compare table.

---

## Gates deferred

| Gate | Marker |
|------|--------|
| Human question contract per section | TBD (GPT) |
| Emotional journey checklist | TBD (GPT) |
| Perspective product split | TBD (GPT) + TBD (Design Freeze) |
| Market jobs parent/child | TBD (Gemini) |
| Marriage parenting boundary | TBD (GPT) |

---

## Final note

Research inventory only — not Family product authority.
