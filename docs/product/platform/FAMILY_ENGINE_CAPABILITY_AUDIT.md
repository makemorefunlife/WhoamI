# Family Engine Capability Audit

**Type:** Implementation / codebase capability inventory  
**Scope:** Current Family (`family` / Child DNA Playbook) engine only  
**Out of scope:** Implementation, redesign, product decisions, LLM prompt suggestions  
**Kind / format:** `family` · `family_parent_child_deep_v2`  
**Date context:** Audit of code as present in repo

---

# A. Current Family Architecture

## Pipeline (deterministic CE core)

```text
PersonCore pair
  sajuJsonA/B + optional sajuMasterA/B + optional psychMasterA/B
  + roles (mother|father + child) + child_is_viewer + parent_type
        │
        ▼
resolveFamilyRolesFromViewer / resolveParentChildNicknames
        │
        ▼
buildPairDomainSignalsFromMasters → PairFamilySignals
  (+ person FamilySajuSignals / FriendshipSajuSignals when masters exist)
        │
        ▼
runFamilyParentChildDeepAnalysis
        │
        ├─► buildFamilyParentReport          ← classifications SSOT
        │     ├─ buildFamilyRuleContext
        │     │    ├─ buildPairSajuBlueprint
        │     │    ├─ analyzeFamilyPairSaju      (FamilyScoringSignals + ChildInnerSignals)
        │     │    ├─ analyzeFamilyParentTenGod  (ParentCareProfile + ChildInnerProfile)
        │     │    ├─ computeFamilyCompatibilityGrade / computeFamilyMasterScores
        │     │    └─ buildFamilyKillerSections
        │     ├─ buildFamilySajuCompareTable (+ typed resolver)
        │     ├─ buildFamilyHouseholdRoles
        │     ├─ buildFamilyRoleSection          (psych; null if no psych)
        │     ├─ buildFamilyRelationshipIndexSection
        │     ├─ buildFamilyTalentSection + applyFamilyTalentPsychAuxNotes
        │     ├─ buildFamilySosSection
        │     ├─ buildFamilyFilialFrequencySection  (Track B only)
        │     ├─ buildFamilyParentSnapshotPanel (+ optional psych hydrate)
        │     ├─ buildFamilyPsychMatchBundle
        │     ├─ buildFamilyPrescriptions        (needs PairFamilySignals)
        │     ├─ buildFamilyContextOutput        (stripped for client)
        │     └─ injectFamilyComparisonTableClientProjection
        │
        └─► attachFamilySajuDeepOverlay?       ← optional; NOT inventoried as engine capability below
              (excluded from “what engine knows” claims in sections B–H)
        │
        ▼
persist { format: family_parent_child_deep_v2, report: FamilyParentReportBody }
        │
        ▼
stripFamilyContextOutputForClient
        │
        ▼
FamilyParentReportView → buildFamilyReportViewModel → SectionRenderer
```

## Major builders / resolvers

| Role | Symbol | File |
|------|--------|------|
| Entry | `runFamilyParentChildDeepAnalysis` | `lib/prompts/relationshipPremium/familyParentChild/index.ts` |
| Report SSOT | `buildFamilyParentReport` | `lib/relationship/familyParent/buildFamilyParentReport.ts` |
| Rule context | `buildFamilyRuleContext` | `buildFamilyRuleContext.ts` |
| Pair saju engine | `analyzeFamilyPairSaju` | `lib/saju/familyAnalysis.ts` |
| Master scores | `computeFamilyMasterScores` | `familyEventScores.ts` |
| Ten-god profiles | `analyzeFamilyParentTenGod` | `familyParentTenGodAnalysis.ts` |
| Killer sections | `buildFamilyKillerSections` | `familyKillerSections.ts` |
| Compare | `buildFamilySajuCompareTable`, `resolveFamilyComparisonTableTyped` | `familySajuCompareTable.ts` |
| Canonical compare | `buildFamilyComparisonTableCanonical`, `injectFamilyComparisonTableClientProjection` | `familyComparisonTableCanonical.ts` |
| Person family signals | `extractFamilySignals` | `lib/personCore/sajuSignals/extractFamilySignals.ts` |
| Pair family signals | `buildPairFamilySignals` | `lib/personCore/sajuSignals/pairFamilySignals.ts` |
| Guidance | `resolveGuidanceProfile`, `resolveGuidanceFit` | `lib/personCore/sajuSignals/guidanceProfile.ts` |
| Roles | `resolveFamilyRolesFromViewer` | `resolveFamilyRoles.ts` |
| ViewModel | `buildFamilyReportViewModel` | `viewModel/buildFamilyReportViewModel.ts` |

## Canonical outputs

- `canonical_projections.comparison_table` — typed compare bands/labels; **survives** client strip.

## Context outputs

- `context_output: FamilyContextOutput` — grade, scores, `dominant_categories`, full `FamilyScoringSignals`, `axis_notes.decision_style`, empty `section_summaries`.
- **Removed** from client via `stripFamilyContextOutputForClient` / `omitFamilyContextOutputFromReport`.

## Report generation flow (UI)

1. Premium analyze `kind=family` → CE body (+ optional overlay).  
2. Detail load → `getFamilyParentDeepReport`.  
3. `FamilyParentReportView`: if VM `sections.length > 0` → `FamilyReportViewModelView`; else legacy cards.  
4. Track A/B and mother/father change copy and gated sections; **one** report schema.

---

# B. Complete Signal Inventory (deterministic)

Confidence column: engine does **not** attach a numeric confidence to most Family booleans. Where a band exists, it is listed. “UI” = reaches current Family premium ViewModel path.

## B1. `FamilyScoringSignals` (`analyzeFamilyPairSaju`)

Source: parent/child pillars + ten-god counts + cross hits.  
Stored: analysis object → `context_output.signals` → drives scores/killer/SOS; **no dedicated signal-board UI**.

| Signal | Deterministic inputs | Output | Threshold / rule | Used in | UI? |
|--------|----------------------|--------|------------------|---------|-----|
| `hasDayBranchCombine` | Day branches six-combine / direction-combine / same trio | boolean | rule tables / trio groups | bond +30; DNA/killer paths | Indirect (scores/copy) |
| `hasJohuElementSupport` | Day-branch element 상생 + temperature cold/hot/neutral | boolean | 상생 + temp pairing | bond +20; filial reward high path | Indirect |
| `hasDayMonthTensionBond` | Day/month palace 충·형 or month wonjin | boolean | palace filter | bond −20 | Indirect |
| `hasParentBoostsChildTalent` | Element scarcity complement OR mother seal / father wealth support override | boolean | talent boost helpers | synergy +30 | Indirect |
| `hasTemperamentComplement` | Parent/child element counts (≤1 vs ≥2 swap) | boolean | per element | synergy +20 | Indirect |
| `hasParentOvercontrol` | Parent officer≥3 AND child food≥2 | boolean | ten-god profiles | synergy −20 | Indirect |
| `hasDayMonthPalaceChungHyung` | Day/month cross 충·형 | boolean | palace hits | risk +35 | Indirect |
| `hasWonjinOrGuimun` | Cross wonjin/guimun | boolean | detect helpers | risk +25 | Indirect |
| `hasParentTemperatureExtreme` | Parent chart temp ≠ neutral | boolean | cold/hot if water+metal vs fire+wood margin ≥2 | risk +15 | Indirect |
| `hasStrongParentChildCombine` | Cross combine on day/month pillars | boolean | COMBINE_TYPES + pillar prefix | filial reward high | Indirect |
| `hasStrongParentChildClash` | Cross 충/형 on day/month | boolean | clash detect | filial reward developing | Indirect |
| `childSealStrong` | Child seal profile ≥2 | boolean | `profileTenGods` | mother lens boosts; support seal | Indirect |
| `parentSupportsChildSeal` | Parent day stem generates/equals child’s seal element | boolean | only if childSealStrong | mother bond/synergy +5 each; talent boost override | Indirect |
| `childWealthStrong` | Child wealth ≥2 | boolean | | father lens | Indirect |
| `parentSupportsChildWealth` | Parent stem supports child’s wealth element | boolean | only if childWealthStrong | father +5; talent override | Indirect |

**Master score formula** (`computeFamilyMasterScores`): bond base 50; synergy base 50; risk base 10; clamp 0–100. Grade via `triScoreToGrade(overall)` where overall maps bond/synergy/risk.

**Note:** `detectGongmangCrossHit(...)` is called then **voided** — not stored as a scoring signal.

## B2. `ChildInnerSignals` (child chart only)

| Signal | Inputs | Output | Threshold | Used in | UI? |
|--------|--------|--------|-----------|---------|-----|
| `hasWonjinGuimunIntra` | Child branch pairs | boolean | any wonjin/guimun pair | DNA hidden_genius branch | Indirect (prose) |
| `hasExcessSeal` | seal≥3 OR 편인≥2 | boolean | | DNA | Indirect |
| `hasExcessFoodOrOfficer` | food≥3 OR officer≥3 | boolean | | DNA | Indirect |
| `hasStrongFocusStyle` | seal≥2 AND officer≥1 AND food&lt;2 | boolean | | DNA | Indirect |
| `hasLateBloomerPotential` | 편관≥1 OR self≥2 OR child temp cold | boolean | | DNA / growth prose | Indirect |
| `dominantArchetype` | Dominant element | wood\|fire\|earth\|metal\|water | `resolveDominantElement` | DNA genius; CO `child_archetype`; affection row | Genius **shown**; raw enum via DNA title |
| `communicationStyle` | Mapped from dominant element | expressive\|analytical\|sensitive\|steady\|playful | fire/wood→expressive; metal→analytical; water→sensitive; earth→steady; else playful | CO `child_communication`; DNA copy paths | Indirect / CO only as category |

## B3. PersonCore `FamilySajuSignals` (`extractFamilySignals`)

| Field | Inputs | Output | Threshold | Used in | UI? |
|-------|--------|--------|-----------|---------|-----|
| `year_karma.karma_tension_index` | Year-palace tension hits | 0–100 | ×28 + day counterpart ×20 | pair `combined_karma_tension` | Indirect (Rx evidence) |
| `year_karma.tension_hits` / `year_branch_code` | Chart | hits / code | | pair rebuild | No direct UI |
| `seal_parent.seal_count` | Non-day-pillar ten gods | number | | bond band; umbilical | Indirect |
| `seal_parent.seal_excess` | profile | boolean | | parent_bond smothering; nagging +25 | Indirect |
| `seal_parent.seal_isolated` | seal===0 | boolean | | distant band; umbilical +15 | Indirect |
| `seal_parent.parent_bond_band` | seal_isolated / seal_excess / seal≥1 | distant\|balanced\|smothering | isolated→distant; excess→smothering; seal≥1→balanced; else distant | compare `bond_distance`; lens bonus; pair umbilical | **Yes** (compare row) |
| `home_punishment.punishment_count` | Punishment hits | number | | nagging +8×count | Indirect |
| `home_punishment.family_conflict_index` | Punishment-derived | 0–100 | | compare `home_climate` via `intensityBand3` | **Yes** (climate band) |
| `home_punishment.punishment_hits` | Chart | hits | | CO/path | No direct |

## B4. `PairFamilySignals` (`buildPairFamilySignals`)

Intensity bands: **high ≥67 · medium ≥34 · low &lt;34** (`intensityBand3`).

| Signal | Inputs | Output | Threshold | Used in | UI? |
|--------|--------|--------|-----------|---------|-----|
| `umbilical_separation_index` | bond bands + seal isolation + \|Δseal\|×6; base 22 | 0–100 | smother↔distant +35; both smother +18; both distant +12; isolated +15 | relationship_index safe_distance; prescriptions; household roles | **Partial** (band→copy; index in Rx evidence not a gauge card) |
| `umbilical_band` | index | low\|medium\|high | intensityBand3 | same | **Yes** (index notes / Rx gating) |
| `nagging_trigger_index` | seal_excess, smother, punishment, karma | 0–100 | base 18; excess +25; smother +20; punish×8; karma×0.2 | friction_index (or fallback risk); compare pair meaning; Rx | **Yes** as friction_index number |
| `nagging_band` | index | band | intensityBand3 | compare correction pair; Rx | Indirect in compare meaning |
| `combined_karma_tension` | 0.55×(karmaA+karmaB) clamped | 0–100 | | Rx nagging topic evidence / skip rules | Rx text only |
| `guidance_fit` | optional modes A/B else null; table may recompute from counts | aligned\|partial\|mismatch | `resolveGuidanceFit` | compare guidance row; household roles; Rx tone | **Yes** (compare / roles) |

## B5. Compare-table buckets (deterministic person/pair)

| Row id | Person bucket source | Pair / meaning source | UI shown? |
|--------|----------------------|----------------------|-----------|
| `correction_style` | `resolveCorrectionStyleBucket` → wealth\|officer\|food\|seal\|self (max ten-god category) | `nagging_band` | **Yes** |
| `bond_distance` | `parent_bond_band` | umbilical semantics | **Yes** |
| `guidance_balance` | `GuidanceMode` receptive\|explanatory\|standards\|mixed | `guidance_fit` | **Yes** |
| `home_climate` | `family_conflict_index` → intensityBand3 | pair climate meaning | **Yes** |
| `affection_expression` | `dominantArchetype` element | pair affection meaning | **No** (body kept; VM filter) |
| `gathering_recovery` | strength-band from stem/element generate (friend-identical formula, margin 1) | pair recovery meaning | **No** (body kept; VM filter) |

Legacy resolvers still in file (not Part2 display): `resolveOriginFamilyDistanceBucket`, `resolveCareBalanceBucket`, `resolveNaggingReactionBucket` (alias), `resolveGatheringTemperatureBucket`.

## B6. Talent / study / wealth (deterministic from ten-god category)

| Signal | Rule | Output | UI? |
|--------|------|--------|-----|
| `study_type` | food→creative; seal→understanding; else diligent | enum + labels/notes | **Yes** (TalentCard) |
| `wealth_vessel` | wealth→practical_finance; officer→career_honor; else developing | enum + labels/notes | **Yes** |
| `study_align` / `wealth_align` | psych axis avg ≥60 confirms; ≤40 caution; else omit | confirms\|caution | Aux **notes** on talent if psych; also CO only |

## B7. Ten-god care profiles (`analyzeFamilyParentTenGod`)

| Output | Rule highlights | UI? |
|--------|-----------------|-----|
| `parentProfile.support_strength` | strong / moderate / developing (seal/wealth support + counts) | lens_summary / destiny; CO category |
| `parentProfile.care_style` / `authority_style` / `lens_summary` | Template from counts + optional `parent_bond_band` bonus | Destiny uses lens; styles mostly in lens prose |
| `childProfile.attachment_need` / `autonomy_need` / `energy_style` | Template strings from child ten-god | Killer/DNA paths — **not** separate cards |

## B8. Psych-derived (deterministic from survey scores; optional)

| Signal | Inputs | Threshold | UI? |
|--------|--------|-----------|-----|
| `FamilyPsychRole` (6 roles) | child secondary axes weighted formula | argmax of 6 scores | **Yes** if psych (`family_role`) |
| `decision_axis_note` | child or parent `decision_style` | ≥70 or ≤30 only; else null | **Yes** on relationship_index |
| Psych radar / lens | `buildFamilyPsychMatchBundle` | match math | **Yes** if psych |
| Snapshot hydrate axes | psych A/B | | TriScore panel internals |

## B9. Filial frequency (Track B only)

| Signal | Inputs | Output | UI? |
|--------|--------|--------|-----|
| `FilialFrequencyType` | parent ten-god → cash_gift \| quality_time \| emotional_recognition | section | **Yes** Track B only |

## B10. De-escalation / SOS / prescriptions

| Output | Inputs | UI? |
|--------|--------|-----|
| `ChildDeEscalationCard` | child/parent counts, roles, Track B `boundary_script` | **Yes** |
| `FamilySosSection` | scoringSignals + parent counts | **Yes** |
| `FamilyPrescriptionPack` topics `umbilical_independence` \| `nagging_karma_avoidance` \| `family_baseline` | PairFamilySignals thresholds in builder | **Yes** if pairFamily |

## B11. Derived score remaps (not new evidence)

| Name | Mapping | UI? |
|------|---------|-----|
| `FamilyMasterScores` bond/synergy/risk | From FamilyScoringSignals weights | Chips + meta `*_pct` |
| `RelationshipEventScores` intimacy/stability/conflict | Remap of master | TriScore gauges |
| `reward_index` high\|moderate\|developing | Combine/johu/support_strength vs clash | In VM field; **FilialRewardCard does not render it** |

---

# C. Existing Output Inventory

## Report sections (`FamilyParentChildReport` + meta)

| Output | Owning / builder file | Notes |
|--------|----------------------|-------|
| `section_roles` | `familyReportTemplate.ts` | nicknames + parent_role |
| `section_snapshot` | `familyKillerSections.ts` | one_line + pcts |
| `section_child_dna` | killer | genius, temperament, hidden_genius |
| `section_destiny` | killer | destiny copy |
| `section_growth_tunnel` | killer | year tunnel |
| `section_filial_reward` | killer | future_reward + reward_index |
| `section_de_escalation` | `childDeEscalationPrescriptions.ts` | |
| `parent_lens_summary` | tenGod parentProfile | |
| `section_compare_table` | `familySajuCompareTable.ts` | 6 rows |
| `section_household_roles` | `buildFamilyHouseholdRoles.ts` | |
| `section_family_role` | `familyPsychRoles.ts` | psych optional |
| `section_relationship_index` | `familyRelationshipIndexSection.ts` | |
| `section_talent` | `familyTalentProfile.ts` | |
| `section_sos_script` | `familySosScript.ts` | |
| `section_filial_frequency` | `familyFilialFrequency.ts` | Track B / null |

## Body top-level / meta / panels

| Output | File |
|--------|------|
| `headline`, `summary_line`, `one_line_family` | `buildFamilyParentReport.ts` |
| `snapshot_panel` | `buildFamilySnapshotPanel.ts` |
| `meta.grade`, `grade_reason`, `uncertain_items`, `bond/synergy/risk_pct`, roles, nicknames | build report |
| `meta.psych_match`, `psych_lens` | `buildFamilyPsychMatchBundle` |
| `meta.prescription_family` | `buildFamilyPrescriptions.ts` |
| `meta.person_core` | `buildPersonCoreRelationMeta` |
| `meta.family_saju_deep` | overlay attach (optional; not CE) |

## Canonical

| Output | File |
|--------|------|
| `canonical_projections.comparison_table` | `familyComparisonTableCanonical.ts` |

## Context output

| Output | File |
|--------|------|
| `FamilyContextOutput` (scores, signals, dominant_categories, axis_notes, empty section_summaries) | `familyContextOutput.ts` |

### CO `dominant_categories` keys (when present)

`family_role`, `study_type`, `wealth_vessel`, `study_align`, `wealth_align`, `child_archetype`, `child_communication`, `parent_support_strength`

## Evidence embedded in prescriptions

`FamilyPrescriptionEvidence` with `signal_paths` + snapshot of umbilical/nagging/karma — `familyPrescriptionTypes.ts` / `buildFamilyPrescriptions.ts`.

## ViewModel section ids (UI contract)

`snapshot`, `relationship_index`, `compare_table`, `household_roles`, `psych_radar`, `child_dna`, `talent`, `growth_tunnel`, `family_role`, `filial_frequency`, `deep_read`, `destiny`, `filial_reward`, `sos_script`, `de_escalation`, `prescription` — `familyReportSectionTypes.ts`.

---

# D. Hidden Capability (highest priority)

| Item | Where calculated | Why unused today (code evidence) | Deterministic? | Could support future UX? (capability fact only) |
|------|------------------|-----------------------------------|----------------|--------------------------------------------------|
| Full `FamilyScoringSignals` board | `analyzeFamilyPairSaju` → CO `signals` | No UI lists booleans; only score/copy consequences | Yes | Evidence chips / “why this grade” without new engine |
| `ChildInnerSignals` as structured fields | `buildChildInnerSignals` | Folded into DNA prose; CO only exposes archetype + communication | Yes | Child trait badges (focus, late bloomer, excess seal/food) |
| Compare rows `affection_expression`, `gathering_recovery` | `buildFamilySajuCompareTable` | Explicit VM filter `PART2_COMPARE_TABLE_DISPLAY_IDS` (comment: body kept, render excluded) | Yes | Complete 6-axis table; affection already shares DNA element SSOT |
| `reward_index` | `familyKillerSections` | VM maps `rewardIndex` but `FilialRewardCard` renders `futureReward` only | Yes | Badge high/moderate/developing beside reward |
| Entire `context_output` | `buildFamilyContextOutput` | Stripped for client; comment: unused by existing consumers | Yes | Client projections / badges from dominant_categories |
| CO `study_align` / `wealth_align` | `resolveStudyAlign` / `resolveWealthAlign` | Aux notes may show; category itself not a badge | Yes (psych bands) | Talent card confidence/caution chrome |
| CO `child_communication` | childSignals | Not a dedicated UI field | Yes | Communication chip next to DNA |
| CO `parent_support_strength` | tenGod profile | Only via lens/destiny prose | Yes | Support strength meter |
| `combined_karma_tension` numeric | pair builder | Only inside Rx evidence text / skip rules | Yes | Karma tension gauge |
| `umbilical_separation_index` numeric | pair builder | Band drives copy; raw index not a card | Yes | Distance index visualization |
| `nagging_band` as first-class chip | pair | Used in compare meaning / Rx, not labeled chip | Yes | Friction band badge |
| `grade_reason` | compatibility grade | Opening/VM uses grade badge; reason text not shown | Yes | Subtitle under grade |
| `meta.uncertain_items` | blueprint | Not in Family VM cards | Yes | Uncertainty callout |
| `summary_line` | report body | Opening prefers headline / one_line | Yes | Alternate summary surface |
| `ChildInnerProfile` attachment/autonomy/energy | tenGod analysis | Embedded in templates, not cards | Yes | Need/energy triad cards |
| Legacy origin-family / care-balance buckets | compare file | Marked deprecated / not Part2 body rows | Yes | Only if product reuses existing resolvers |
| `detectGongmangCrossHit` | called in analyzeFamilyPairSaju | Result discarded (`void`) | Computed then dropped | Not available as stored signal today |
| Friendship signals on masters | used in some compare paths | Not Family product surface | Yes (other domain) | Cross-domain only if intentionally surfaced |
| Track A absence of filial_frequency | builder returns null | By design gate | N/A | Track B already has the module |

---

# E. Shared Relationship Assets

| Asset | Status for Family | Evidence |
|-------|-------------------|----------|
| Psych 11-axis / secondary axes | **Already used** | radar, family_role, decision note, talent align, snapshot hydrate |
| Recognition (psych axis) | **Already used** | inputs to `FamilyPsychRole` (martyr/puppy/emotional_dump) |
| Decision (psych) | **Already used** | `decision_axis_note` extremes |
| Thinking | **Not applicable / not wired** as Family-named module | no Family-specific thinking signal module found |
| Resilience | **Already used** | psych role formula |
| Energy (psych `energy_style`) | **Already used** | psych role; also childProfile.energy_style templates |
| Expression | **Reusable / partially** | `affection_expression` compare uses element dominance (not Romantic expression_band); Romantic `RomanticSajuSignals.expression_style` **not** consumed by Family CE |
| Recovery | **Reusable / hidden** | `gathering_recovery` row computed, not shown |
| Comparison table framework | **Already used** | Family compare + canonical inject |
| Canonical projection framework | **Already used** | `comparison_table` only (no Family travel/CFO-style second projection) |
| PairPrescription | **Already used** | `meta.prescription_family` + `PairPrescriptionSection` |
| TriScore snapshot | **Already used** | `FAMILY_CONFIG` labels |
| Deep Read shared VM/UI | **Already used** (overlay path) | not CE |
| Evidence system (prescription evidence objects) | **Already used** | `FamilyPrescriptionEvidence` |
| Guidance profile / fit | **Already used** | compare + roles + Rx tone |
| Umbilical / nagging pair indices | **Already used** | index + Rx + compare |
| PersonCore domain pack pattern | **Already used** | `family_signals` |
| Romantic attachment / marriage CFO / work leadership | **Not applicable** to Family CE | different domain packs |

---

# F. Current Limitations (grounded)

Family CE **does not** currently determine or store:

| Claim type | Evidence of absence |
|------------|---------------------|
| Household money / CFO / chores ops | No Family money section; CFO lives in cohabitation/marriage pack |
| Clinical attachment style (secure/anxious/avoidant) | No attachment_lean in Family CO (Marriage CO has it; Family has prose `attachment_need` templates only) |
| ADHD / autism / IQ / learning disability / mental illness / trauma diagnoses | No such types, thresholds, or fields in Family builders |
| Guaranteed future success / fixed destiny outcome | `reward_index` and destiny copy are heuristic templates; not predictive clinical success |
| Separate persisted “Parent report” vs “Child report” formats | One `FamilyParentReportBody`; Track flags only |
| Gongmang as persisted Family scoring signal | Computed call discarded |
| Numeric confidence on most boolean FamilyScoringSignals | No confidence field on those booleans |
| Free/basic truncated Family deep body | Basic = perspectives; Family deep = premium kind only |

---

# G. Candidate UX Opportunities (no new engine work)

Reuse **only** existing deterministic outputs / already-built sections:

1. **Show full 6-row compare table** — enable `affection_expression` + `gathering_recovery` already on `section_compare_table`.  
2. **Render `reward_index`** — VM already has `rewardIndex`; card can display high/moderate/developing.  
3. **Signal / evidence strip** — surface subset of `FamilyScoringSignals` or CO `signals` as chips explaining bond/synergy/risk.  
4. **Child trait badges** — `hasStrongFocusStyle`, `hasLateBloomerPotential`, `hasExcessSeal`, `hasExcessFoodOrOfficer`, `communicationStyle`, `dominantArchetype` (already influence DNA).  
5. **Numeric index cards** — `umbilical_separation_index`, `nagging_trigger_index` / friction_index (already shown as friction), `combined_karma_tension`.  
6. **Band badges** — `umbilical_band`, `nagging_band`, `parent_bond_band`, `home_climate` band, `guidance_fit`, `support_strength`.  
7. **Talent caution/confirm chrome** — `study_align` / `wealth_align` as badges (notes may already append).  
8. **Grade reason subtitle** — `meta.grade_reason` / opening gradeReason.  
9. **Parent care triad cards** — expose `care_style`, `authority_style`, `attachment_need`, `autonomy_need`, `energy_style` as structured fields already produced in profiles.  
10. **Reorganization only** — Part numbering / order of existing VM sections (snapshot, index, compare, DNA, talent, growth, destiny, SOS, de-esc, Rx) without new signals.  
11. **Track chrome** — label Track A vs B using existing `child_is_viewer` / filial_frequency presence.  
12. **Canonical label emphasis** — prefer typed `canonical_projections.comparison_table` shortLabels already injected.

No new deterministic computation required for the above.

---

# H. Future Signal Gaps (would need additional deterministic computation)

These are **not** available as Family CE outputs today; listed only as gaps vs conceivable UX (not proposals to build):

| Gap | Why it’s a gap in current code |
|-----|--------------------------------|
| Stored gongmang Family signal | Currently voided after detect |
| Family-specific money / allowance / allowance conflict indices | No Family money signal pack |
| Clinical attachment typology | Not in Family types |
| ADHD/autism/IQ/trauma/disability classifiers | Not present |
| Longitudinal timeline engine (multi-year trajectory object) | Only growth_tunnel year heuristics in killer prose + analysis year clash flags — not a general timeline SSOT |
| Separate Child vs Parent report schemas | Only perspective flags |
| Per-signal confidence scores on FamilyScoringSignals | Not modeled |
| Romantic expression/conflict/affection_band pack reused as Family SSOT | Family uses different primitives; Romantic pack not wired |
| Filled `context_output.section_summaries` | Explicitly empty `Record<string, never>` / `{}` |
| Second canonical projection family (beyond comparison_table) | Only compare canonical exists |

---

## File map (quick)

```
lib/saju/familyAnalysis.ts
lib/personCore/sajuSignals/extractFamilySignals.ts
lib/personCore/sajuSignals/pairFamilySignals.ts
lib/personCore/sajuSignals/guidanceProfile.ts
lib/relationship/familyParent/*   (report, rule context, killer, compare, canonical,
                                   household roles, talent, psych roles, index, sos,
                                   filial, prescriptions, snapshot, context, viewModel)
lib/prompts/relationshipPremium/familyParentChild/index.ts
components/relationship/FamilyParentReportView.tsx
components/relationship/familyParent/sections/SectionRenderer.tsx
```

---

*End of Family Engine Capability Audit — inventory only; no implementation.*
