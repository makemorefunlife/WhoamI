# Marriage / Cohabitation — 05 / 06 / 07 Preparation Inventory

**Document type:** Research inventory only (not a locked Product / Technical / Checklist SSOT)  
**Product:** Ahaitsme — Marriage / Cohabitation / Household Partnership  
**Status:** Source material for future 05 / 06 / 07 after GPT + Gemini integration  
**Code kind key:** `cohabitation` (not `marriage`)  
**Persisted format:** `cohabitation_household_deep_v1` (`COHABITATION_DEEP_FORMAT`)  
**UI labels:** `relationshipDrilldown.cohabitation`; kind labels `동거·결혼` / Household · Life Partnership  
**Registry label:** `동거·결혼 하우스홀드 분석`  
**Overlay naming:** `marriedSajuDeep` / `meta.married_saju_deep` (runtime kind remains `cohabitation`)  
**Depends on (shared):** `01` · `02` · `05_Relationship_Product_Bible.md`
**Romantic boundary (from Product Bible + Romantic 05A):** Romantic ≠ Marriage; Marriage owns household operations.

**Judgement placeholders:** **TBD (GPT)** · **TBD (Gemini)** · **TBD (Design Freeze)**

---

# PART 05 — Product Preparation (facts only)

---

## 0. Product Manifesto

**TBD (GPT)**

**Current framing from code/copy:**

- Part titles (`relationshipDrilldown.cohabitation`):
  1. Why You Became a Household / 우리가 부부가 된 이유
  2. Fully Scored
  3. Bedroom Chemistry & Attachment
  4. Home-Life DNA & Next 3 Years
  5. Fight-Proofing Playbook
- Score labels (`COHABITATION_CONFIG`): 로맨틱 핏 · 라이프 시너지 · 홈 리스크  
  (Internal master scores: `activation` / `benefit` / `risk`.)

---

## 1. Product Definition (as shipped)

### 1.1 What this product currently is

- Premium household deep report for `kind === "cohabitation"`.
- Deterministic `MarriageReportBody` via `buildMarriageReport` + optional `meta.married_saju_deep`.
- Entry: `runCohabitationDeepAnalysis`.
- UI: `MarriageReportView` → `buildMarriageReportViewModel` → `MarriageReportViewModelView`.
- Gate for VM path: `hh.section_dna.person_a/b` present; else legacy JSX.

### 1.2 What this product currently is not

- Not Romantic dating/attraction deep (`romantic`).
- Not Family Child DNA Playbook (`family`) — though parenting section exists here as household ops.
- Not basic perspectives-only.

### 1.3 Product promise

**TBD (GPT)**  
**TBD (Gemini)** — cohabitation vs married-market jobs.

---

## 2. Product Boundaries

### 2.1 Marriage / Cohabitation currently owns (modules present)

- Origin story (why household formed)
- Household snapshot scores + DNA
- Six household compare axes
- Money/chores operating CFO
- Bedroom matrix + sleep fit
- Parenting styles
- Family/in-law boundary
- Weather / multi-year forecast
- Privacy, upset, warning/de-escalation, prescriptions
- Optional Deep Read

### 2.2 Romantic owns (must not collapse — from Product Bible / Romantic 05A)

Attraction, early-relationship framing, romantic misunderstanding loops as dating product — **TBD (GPT)** to restate Marriage-specific exclusion list.

### 2.3 Family overlap

Marriage `section_parenting` vs Family child DNA / filial tracks.  
**TBD (GPT)** — ownership.  
**TBD (Design Freeze)** — distinct UX language.

### 2.4 Hard boundary rule

**TBD (GPT)** / **TBD (Design Freeze)**

---

## 3. Product Laws

**TBD (GPT)** — may inherit shared laws; Marriage-specific ops laws TBD.

---

## 4. Current Report Structure & Experience Model

### 4.1 Current section order

Source: `lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts`.

| # | `id` / `type` | `partNumber` | UI |
|---|---------------|--------------|-----|
| 1 | `origin_story` | 1 | `OriginStoryCard` |
| 2 | `household_snapshot` | 2 | scores + `TriScoreSnapshotPanel` |
| 3 | `compare_table` | 2 | `CompareTableCard` |
| 4 | `psych_radar` | 2 | `PsychRadarCard` |
| 5 | `money_chores` | 2 | `MoneyChoresCard` |
| 6 | `deep_read` | 3 | `DeepReadCard` |
| 7 | `bedroom` | 3 | `BedroomCard` |
| 8 | `home_dna` | 4 | `HomeDnaCard` |
| 9 | `parenting` | 4 | `ParentingCard` |
| 10 | `family_boundary` | 4 | `FamilyBoundaryCard` |
| 11 | `weather_forecast` | 4 | `WeatherForecastCard` |
| 12 | `privacy` | 5 | `PrivacyCard` |
| 13 | `upset` | 5 | `UpsetCard` |
| 14 | `warning` | 5 | `WarningCard` |
| 15 | `prescription` | 5 | `PairPrescriptionSection` |

Omit-if-null pattern throughout.

### 4.2 Compare axes

`MarriageCompareRowId` (`marriageSajuCompareTable.ts`):  
`household_stress` | `marital_conflict` | `bedroom_lead` | `family_boundary` | `asset_management` | `parenting_style`

### 4.3 Current cards / modules

| Module | Component |
|--------|-----------|
| Entry | `MarriageReportView.tsx` |
| VM render | `marriage/sections/SectionRenderer.tsx` |
| Shared | `DeepReadCard`, `PairPrescriptionSection`, `TriScoreSnapshotPanel`, reportLayout |
| Domain cards | Origin, MoneyChores, Bedroom, HomeDna, Parenting, FamilyBoundary, Weather, Privacy, Upset, Warning, Compare, Psych |

### 4.4 Current UX flow

```text
Premium kind=cohabitation
  → runCohabitationDeepAnalysis
  → cohabitation_household_deep_v1
  → displayCohabitationDeep (ready gate: snapshot_panel)
  → MarriageReportView
       → DNA present: ViewModel Parts 1–5
       → else: legacy MarriageReportView JSX
```

Free/basic: shared perspectives only.

### 4.5 Title reuse (factual)

`household_snapshot` and `home_dna` both use i18n `dnaCardTitle`.

Part 3 title centers bedroom/attachment while `deep_read` also sits in Part 3.

### 4.6 Territories / narrative order (target)

**TBD (GPT)** / **TBD (Design Freeze)**

---

## 5. Emotional Journey

**TBD (GPT)**

Current factual arc: origin → scored household → deep read + bedroom → home DNA / parenting / in-laws / forecast → privacy + fight-proofing.

---

## 6. Hero Experience

**Current:** Part1 `origin_story` + opening headline/`one_line_household` + grade + three score chips.  
**TBD (GPT)** / **TBD (Design Freeze)**

---

## 7. Existing Strengths (factual)

- Broadest household module set of the four non-romantic domains.
- Explicit dual CFO authorities documented in code: operating CFO (`section_money_chores` + `canonical_projections.operating_cfo`) ≠ prescription `cfo_power_struggle.leader_side`.
- Origin story + weather forecast + bedroom matrix give time/intimacy/ops coverage.
- Overlay freeze `028_married-saju-deep-narrative-freeze.md`.
- Large unit test surface (`marriage-*.test.mjs`, `married-saju-deep-*.mjs`, `cohabitation-premium-locale`).

---

## 8. Existing Weaknesses (factual)

- `meta.killer_questions` fully built (`buildCohabitationKillerQuestions`) but **never rendered** under `components/relationship`.
- VM Warning shows `solution_script` only; legacy de-escalation card fields (`hashtag`, `color`, `archetype_label`, `psych_state`, `avoid_actions`, `shared_trigger*`) not mapped.
- CFO confidence/align/dual and parenting confidence/align stored as “UI 미소비” (code comments).
- Sleep fit nicknames/title unused; bedroom archetypes unused in card.
- Naming split: API `cohabitation` vs overlay “married” vs UI “동거·결혼”.
- Score label “로맨틱 핏” inside Marriage product — risk of Romantic/Marriage confusion (**TBD (GPT)** / **TBD (Design Freeze)**).
- Dual renderer legacy path.

---

## 9. Hidden capabilities already available

| Capability | Where |
|------------|--------|
| Killer question pack | `meta.killer_questions` |
| Full HomeDeEscalationCard fields | `section_warning.de_escalation` |
| CFO confidence / align / dual | `section_money_chores` |
| Parenting confidence / align / style keys | `section_parenting` |
| Bedroom archetypes | bedroom person profiles |
| Sleep sensor / easy-sleeper nicknames | `sleep_fit` |
| `MarriageContextOutput` | stripped CO |
| Overlay comparison_table + real_life_example | `married_saju_deep` |
| Canonical operating_cfo | projections |

---

## 10. Existing data not surfaced in UI

| Field / structure | Location |
|-------------------|----------|
| `meta.killer_questions` | meta |
| `context_output` | stripped |
| `meta.uncertain_items`, `meta.person_core` | meta |
| `summary_line` | body (opening uses headline / one_line_household) |
| `cfo_confidence`, `cfo_align`, `cfo_dual` | money_chores |
| Parenting confidence/align/style_key_* | parenting |
| Bedroom `archetypes` | bedroom |
| Sleep `title`, `sensor_nickname`, `easy_sleeper_nickname` | sleep_fit |
| De-escalation rich fields | warning.de_escalation |
| LLM extras | married overlay |

---

## 11. Success Criteria / Open Decisions

**TBD (GPT)** — success criteria; cohabitation vs married naming productization.  
**TBD (Gemini)** — household / marriage market evidence.  
**TBD (Design Freeze)** — “로맨틱 핏” labeling; killer-questions surface; Part3 composition.

---

# PART 06 — Technical Preparation

---

## 0. Technical flow (as-built)

```text
POST premium kind=cohabitation
  → buildPairDomainSignalsFromMasters → pairCohabitation + cohabitationSignalsA/B
  → buildMarriageReport
       → buildMarriageRuleContext
       → buildMarriagePsychMatchBundle
       → buildHouseholdPartnershipReport
       → refineHouseholdCfo / refineParentingStyle
       → buildMarriageSajuCompareTable
       → buildMarriageSnapshotPanel (+ narrative)
       → buildCohabitationKillerQuestions
       → buildCohabitationPrescriptions? (needs pairCohabitation)
       → buildMarriageContextOutput
       → inject canonical_projections (comparison_table, operating_cfo)
  → attachMarriedSajuDeepOverlay (unless RELATIONSHIP_MARRIED_NARRATIVE=0)
       → buildMarriedHouseholdDigest → LLM → postValidateMarriedNarrative
  → stripMarriageContextOutputForClient
  → buildMarriageReportViewModel → MarriageReportViewModelView
```

---

## 1. Authority (as-built)

1. `MarriageReportBody` persisted SSOT (`buildMarriageReport.ts` comments)  
2. `canonical_projections.comparison_table`, `operating_cfo`  
3. `meta.married_saju_deep` explain-only (`028`)  
4. ViewModel non-persisted  
5. Legacy JSX fallback  

---

## 2. Core technical objects

| Object | Location |
|--------|----------|
| Deep wrapper | `CohabitationDeepReport` / format in `cohabitation/outputSchema.ts` |
| Body | `MarriageReportBody` — `buildMarriageReport.ts` |
| Household pack | `buildHouseholdPartnershipReport` / household template |
| Rule context | `buildMarriageRuleContext` → `MarriageRuleContext` |
| Overlay | `MarriedSajuDeepReport` — `marriedSajuDeep/outputSchema.ts` |
| VM | `MarriageReportViewModel` / `MarriageReportSection` |
| CO | `MarriageContextOutput` |
| Killer pack | `CohabitationKillerQuestionPack` |

---

## 3. SSOT inputs

| Input | Role |
|-------|------|
| `sajuJsonA/B` | Pillars/charts |
| `sajuMasterA/B` | `cohabitation_signals`; `PairCohabitationSignals` |
| `psychMasterA/B` | Psych match, axis notes, CFO/energy/rejection/parenting notes |
| Locale | Copy |
| Viewer A/B | Deep Read swap via `pickViewerFirstPair` / `!viewerIsReportA` |

Birth requirement: `date_place`.

---

## 4. Evidence / engines

| Engine | Role |
|--------|------|
| `analyzeMarriagePairSaju` | Scoring signals (`lib/saju/marriageAnalysis`) |
| `analyzeMarriageTenGod` | Boundary / parenting styles |
| `computeMarriageMasterScores` | activation/benefit/risk |
| Bedroom / sleep / conflict / cold war / origin | Section builders in marriage lib |
| `buildMarriageSajuCompareTable` | 6 rows |
| `buildMarriageSnapshotPanel` + `buildMarriageSnapshotNarrative` | Tri-score |
| `buildBedroomMatrixSection` | Bedroom |
| CFO refine | `refineHouseholdCfo` + operating CFO canonical |
| Parenting refine | `refineParentingStyle` |
| Prescriptions | `buildCohabitationPrescriptions` |
| Digest | `marriageSajuPromptDigest.ts` |

Psych helpers (examples): `resolveCfoAxisNote`, `resolveEnergyStyleAxisNote`, `resolveRejectionAxisNote`, `resolveParentingRoleNote`.

---

## 5. Canonical / Context / Meta outputs

### Canonical

- `comparison_table`
- `operating_cfo`

### Context output (stripped)

Built by `buildMarriageContextOutput` — server/LLM digest use; not client UI.

### Meta

| Key | Purpose |
|-----|---------|
| `psych_match`, `psych_lens`, `home_psych_lens` (legacy) | Radar via `resolveReportPsychDisplay` |
| `prescription_cohabitation` | Prescriptions |
| `killer_questions` | **Unused in UI** |
| `married_saju_deep` | Deep Read |
| `uncertain_items`, `person_core` | hydrate / unused cards |
| `snapshot_panel` | Tri-score |

---

## 6. Hidden fields

See PART 05 §10.

---

## 7. ViewModels & projection

| Piece | Path |
|-------|------|
| VM | `viewModel/buildMarriageReportViewModel.ts`, `marriageReportSectionTypes.ts` |
| Deep Read | `buildDeepReadViewModel` from nature + `role_balance_signal` + action |
| Strip | `stripMarriageContextOutputForClient.ts` |
| Renderer | `marriage/sections/SectionRenderer.tsx` |
| Viewer helpers | `lib/relationship/viewerFirstDisplay` |

---

## 8. Reusable components & calculations

**UI shared:** DeepReadCard, PairPrescriptionSection, TriScoreSnapshotPanel (`COHABITATION_CONFIG`), reportLayout.

**Logic shared patterns:** CO strip, canonical inject, overlay attach, psych bundles.

**Marriage-specific:** origin/bedroom/sleep/CFO/parenting/weather/cold-war/killer builders; `marriageEventScores.ts`; operating CFO canonical.

---

## 9. Env / formats

| Item | Value |
|------|-------|
| Body | `cohabitation_household_deep_v1` |
| Overlay | `married_saju_deep_v1_round1` |
| Kill switch | `RELATIONSHIP_MARRIED_NARRATIVE` |
| Model | `RELATIONSHIP_MARRIED_MODEL` |
| Tokens | `RELATIONSHIP_MARRIED_MAX_TOKENS` |

---

## 10. Tests

`marriage-cfo-*`, `marriage-compare-table`, `marriage-context-*`, `marriage-origin-story`, `marriage-parenting-*`, `marriage-cold-war-protocol`, `marriage-rejection-script`, `married-saju-deep-*`, `cohabitation-premium-locale`, shared `deep-read-*`.

---

# PART 07 — Implementation Preparation

No implementation order.

---

## Section / asset status

| Section / asset | Status | Notes |
|-----------------|--------|-------|
| Origin story | Existing | |
| Household snapshot + tri-score | Existing | label confusion risk vs Romantic |
| Compare table | Existing | overlaps thematically with later cards |
| Psych radar | Existing | needs psych |
| Money / chores / operating CFO | Existing | confidence fields Partial (stored) |
| Deep Read | Existing | extras Missing in UI |
| Bedroom | Partial | archetypes unused |
| Sleep fit (within bedroom path) | Partial | nicknames/title unused |
| Home DNA | Existing | title key reuse with snapshot |
| Parenting | Partial | confidence/align unused |
| Family boundary | Existing | |
| Weather forecast | Existing | |
| Privacy | Existing | |
| Upset | Existing | |
| Warning / de-escalation | Partial | VM slim vs legacy rich card |
| Prescriptions | Existing | needs pairCohabitation |
| Killer questions | Missing in UI | data Existing |
| Free mid-tier household body | Missing | |
| Locked Marriage 05 laws | Missing | |
| Naming SSOT (cohabitation/married/동거·결혼) | Partial | |

---

## Reusable logic / UI / projections

- Shared: Deep Read, prescriptions UI, tri-score, CO strip, comparison canonical, premium-by-kind, overlay freeze pattern.
- Marriage projections: `operating_cfo` + `comparison_table`.
- Do not conflate with Family parenting builders or Romantic attraction modules.

---

## Gates deferred

| Gate | Marker |
|------|--------|
| Romantic ownership checklist | TBD (GPT) — align with Romantic 05A §2 |
| Family parenting ownership | TBD (GPT) |
| Killer questions product role | TBD (GPT) + TBD (Design Freeze) |
| Market: cohab vs married positioning | TBD (Gemini) |
| Score naming (“로맨틱 핏”) | TBD (Design Freeze) |
| Editorial / journey checklist | TBD (GPT) after 05 lock |

---

## Final note

Research inventory only — not Marriage product authority.  
Runtime kind remains **`cohabitation`** until a deliberate rename decision (**TBD (GPT)**).
