# Family Parent–Child Platform Capability Audit

**Document type:** Platform reverse-engineering audit  
**Domain:** Family (`family`) — Child DNA Playbook  
**Runtime format:** `family_parent_child_deep_v2`  
**Overlay:** `meta.family_saju_deep`  
**Freeze:** `docs/dev/decisions/029_family-saju-deep-narrative-freeze.md`  
**Perspectives in code:** Track A parent viewer (`child_is_viewer=false`) · Track B child viewer (`true`) + `parent_type` mother|father  
**Constitution note (`05_Relationship_Product_Bible.md`):** Family Child and Family Parent are separate *perspective products* — code implements **one schema + gates**, not two formats  
**Status:** Research knowledge base — no redesign / no decisions

---

# Executive Summary

## Overall implementation maturity

Family is a **rich, directional CE product** (parent≠child slots, Track gates, talent/SOS/filial modules). Maturity is high on engine→SSOT for Child DNA Playbook content; medium on UI completeness (hidden compare rows, unused `reward_index`); low on Part numbering coherence and registry accuracy (`triScoreKind: "romantic"`).

## Major strengths

1. Explicit role model: one child + one mother|father; nicknames and saju assignment resolve by role.  
2. Broad module surface: relationship index, DNA, talent, growth tunnel, destiny, SOS, filial reward/frequency, de-escalation, prescriptions.  
3. Psych augments talent/filial/role without flipping saju talent enums (SSOT protected).  
4. Canonical comparison projection + CO categories for study/wealth/archetype.  
5. Track B adds child-facing modules (`filial_frequency`, `boundary_script`) — real perspective differentiation.

## Major weaknesses

1. **Part1 missing in VM** while product copy still speaks in Part2–5; relationship_index carries “입체 진단” job under part 2.  
2. Two compare rows computed but **deliberately not rendered** — capability hidden.  
3. `reward_index` in VM but card ignores it.  
4. Deep Read uses **fixed parent/child order** (no viewer-swap) — correct for some products, confusing if child is viewer without chrome clarity.  
5. Legacy fallback omits major Part2 modules + Deep Read.  
6. Stale README TODOs vs shipped code.

## Biggest missing chains

| Chain | Break |
|-------|--------|
| Compare `affection_expression`, `gathering_recovery` | SSOT rows → filter excludes → UI |
| `reward_index` | SSOT/VM → FilialRewardCard ignores |
| CO study/wealth/align/archetype | Strip → no UI badges |
| Registry triScoreKind | Registry says romantic → panel uses family | Discord |
| Separate persisted Child vs Parent formats | Constitution desire → **not implemented** as two bodies |

---

# Capability Map

| Capability | Inferred user question | Origin | Producer | Confidence | Consumed | State |
|------------|------------------------|--------|----------|------------|----------|-------|
| Bond / Growth synergy / Discipline friction | How bonded / growthful / friction-heavy are we? | Master scores | `computeFamilyMasterScores` | Deterministic (+ parent_type tweaks) | Chips + TriScore `FAMILY_CONFIG` | Full |
| Relationship index | What’s our chemistry / friction index story? | Pair + signals | `buildFamilyRelationshipIndexSection` | Mixed | RelationshipIndexCard | Full |
| Compare 4/6 axes | How do parent & child differ in guidance climate? | Saju compare | `buildFamilySajuCompareTable` | Typed | 4 rows shown | Partial |
| Household roles | Who plays what at home? | Roles builder | `buildFamilyHouseholdRoles` | Deterministic | Card | Full |
| Psych radar | Survey alignment | Psych | `buildFamilyPsychMatchBundle` | Needs psych | Radar | Partial |
| Child DNA | What’s this child’s temperament genius? | Killer + childSignals | `buildFamilyKillerSections` | Template+signals | ChildDnaCard | Full |
| Talent study/wealth | Learning / wealth vessel tendencies | Ten-god buckets + psych notes | `buildFamilyTalentSection` + aux notes | Enum SSOT + note | TalentCard | Full (enums not labeled raw) |
| Growth tunnel | What’s this year’s growth arc? | Killer | Killer sections | Editorial+signals | GrowthTunnelCard | Full |
| Family psych role | Child’s psych role in family? | Psych secondary axes | `buildFamilyRoleSection` | Needs psych | FamilyRoleCard | Partial |
| Filial frequency | How often / how filial contact feels? | Parent ten-god | `buildFamilyFilialFrequencySection` | Track B only | Card | Partial (gated) |
| Destiny + parent lens | Long-view parent–child story | Killer + tenGod lens_summary | Killer + parent profile | Editorial | DestinyCard | Full |
| Filial reward | What’s the future reward of this bond? | Killer + psych enrich | Killer + `appendFilialRecognitionEnrichment` | Mixed | futureReward text; index Hidden | Partial |
| SOS script | What do I say in a crisis? | Signals + counts | `buildFamilySosSection` | Template | SosScriptCard | Full |
| De-escalation | How do we cool down? | Child de-esc prescriptions | `section_de_escalation` | Track-gated boundary | DeEscalationCard | Full |
| Prescriptions | Ongoing practices | `PairFamilySignals` | `buildFamilyPrescriptions` | Needs masters | Prescriptions | Partial |
| Deep Read | Generational story / advice | LLM | `attachFamilySajuDeepOverlay` | Explain-only | DeepReadCard (fixed slots) | Partial |
| Context Output | Typed family categories | Repack | `buildFamilyContextOutput` | Typed | Digest | Hidden |

### `FamilyCompareRowId` (all computed)

`correction_style` · `bond_distance` · `guidance_balance` · `home_climate` · **`affection_expression`** · **`gathering_recovery`**  
(Display filter keeps first four only.)

### Track gates

| Feature | Track A (parent view) | Track B (child view) |
|---------|----------------------|----------------------|
| `section_filial_frequency` | null | built |
| `boundary_script` | null | filled |
| Tone | parent-facing | child-facing |

### Supporting files

```
lib/saju/familyAnalysis.ts
lib/relationship/familyParent/buildFamilyParentReport.ts
lib/relationship/familyParent/buildFamilyRuleContext.ts
lib/relationship/familyParent/familyKillerSections.ts
lib/relationship/familyParent/familySajuCompareTable.ts
lib/relationship/familyParent/familyContextOutput.ts
lib/relationship/familyParent/familyPsychRoles.ts
lib/relationship/familyParent/childDeEscalationPrescriptions.ts
lib/relationship/familyParent/viewModel/*
lib/prompts/relationshipPremium/familyParentChild/*
lib/prompts/relationshipPremium/familySajuDeep/*
lib/relationship/familySajuPromptDigest.ts
components/relationship/FamilyParentReportView.tsx
components/relationship/familyParent/sections/SectionRenderer.tsx
```

---

# Full Pipeline Audit

```text
resolveFamilyRolesFromViewer(parent_type, child_is_viewer)
  → pairFamily + per-person family/friendship signals
  → buildFamilyParentReport → FamilyParentReportBody
  → attachFamilySajuDeepOverlay?
  → family_parent_child_deep_v2
  → stripFamilyContextOutputForClient
  → FamilyParentReportView → VM (or legacy)
```

| Stage | Status |
|-------|--------|
| Engine | Strong directional CE |
| SSOT | FamilyParentReportBody |
| Canonical | comparison_table |
| Context | Rich categories → stripped |
| Meta | psych, prescriptions, family_saju_deep |
| ViewModel | Parts 2–5 only |
| UI | Fixed child/parent column semantics |
| Narrative | Deep Read; generation_gap_signal |
| User | Child DNA Playbook |

### Chain: Hidden compare rows

```text
Engine builds 6 rows including affection_expression, gathering_recovery
  → SSOT section_compare_table keeps them (cache validity tests depend on meanings)
  → ViewModel PART2_COMPARE_TABLE_DISPLAY_IDS filters to 4
  → UI never shows 2
BREAK: deliberate UI hide — capability exists for future surfaces
```

### Chain: reward_index

```text
SSOT section_filial_reward.reward_index
  → VM FilialRewardSection.rewardIndex
  → FilialRewardCard renders futureReward only
BREAK: index dead at UI
```

### Chain: Deep Read slots

```text
Overlay parent_nature/child_nature, advice_for_parent/child
  → buildDeepReadSection maps without swap
  → DeepReadCard me/partner labels depend on how caller names slots
BREAK risk: child viewer still sees fixed order — product chrome must clarify
```

---

# Report Usage Audit

## Users see

Scores, relationship index, 4-axis compare, household roles, radar (if psych), child DNA, talent, growth, family role (if psych), filial frequency (Track B), Deep Read, destiny, filial reward text, SOS, de-escalation, prescriptions.

## Never see

2 compare rows; reward_index; CO categories; gradeReason; uncertain_items; overlay extras; raw talent enums as ids; Part1 chrome.

## LLM uses

Family household digest → overlay. CE remains classification SSOT.

## Deterministic vs editorial vs LLM

| Area | Character |
|------|-----------|
| Scores, compare bands, talent enums, roles, prescriptions | Deterministic |
| Killer DNA/destiny/growth/SOS copy | Editorial templates |
| Psych role / aux notes | Survey-driven |
| Deep Read | LLM |

## Marriage overlap (usage observation)

Marriage also shows parenting as household ops. Family shows child DNA / filial / SOS as parent–child chemistry. Users can encounter “parenting” in both products with different engines — important for Freeze clarity (evidence only).

---

# Hidden Opportunities

| Item | Why valuable | UX observation |
|------|--------------|----------------|
| Affection / gathering compare rows | Already computed; affection ties to DNA element SSOT in tests | Completes 6-axis “full diagnosis” without new engine |
| reward_index | Numeric companion to future_reward prose | Gauge / badge beside reward card |
| CO study_type / wealth_vessel / aligns | Stable educational/finance talent taxonomy | Talent card badges; progress filters |
| child_archetype / communication / parent_support_strength | Digest categories | Hero chips for Child DNA |
| decision_style axis note | Only extremes today | Relationship index footnote already pattern |
| Track B modules as product differentiator | Real perspective split exists | Supports Product Bible two-perspective story — if chrome names the track |
| Mother vs father score tweaks | Lens already in master scores | Explicit “viewing as mother/father” badge |

---

# Structural Problems

1. Part numbering drift.  
2. Hidden rows + unused reward_index = incomplete presentation of existing SSOT.  
3. Registry triScoreKind mismatch.  
4. One-schema vs two-product constitution tension.  
5. Legacy fallback module loss.  
6. Friendship signals used inside family compare paths — cross-domain coupling to inspect in 06.  
7. Stale familyParent README.

---

# Reuse Opportunities

| Asset | Reuse | Why |
|-------|-------|-----|
| Deep Read / Prescriptions / TriScore / Radar | Platform | Shared |
| Role resolver + Track gates | Unique but pattern reusable | Perspective products (e.g. future mentor/mentee) |
| Compare display filter pattern | Caution | Hiding SSOT rows is a product footgun unless documented |
| Talent enum + psych aux-without-flip | Marriage parenting refine analogue | Protects CE enums |
| SOS / de-escalation script cards | Friend/Work script sections | Script UX pattern |
| CO category pack | Platform | Same unused-UI problem as other domains |

Do not reuse Family child DNA vocabulary into Marriage parenting without boundary analysis.

---

# Important Findings

**Product**  
- Code already implements perspective *variants*, not two blueprints — Design Freeze must reconcile with `05_Relationship_Product_Bible.md`.  
- Hidden compare rows and reward_index are “free” product surface area.  
- Boundary with Marriage parenting is a Freeze-critical evidence item.

**UX / Visual**  
- Fixed Deep Read order needs explicit parent/child labeling when viewer is child.  
- Part1 absence may feel like a missing hero vs Romantic.

**Architecture**  
- Strong directional CE; weak registry metadata; CO unused in UI.  
- Cache validity depending on hidden rows means deletion is not free.

**05 / 06 / 07**  
- 05: one Family doc with perspectives vs two docs.  
- 06: document display filters as first-class projection rules.  
- 07: Track A/B fixtures mandatory; registry triScoreKind fix checklist.

---

*End of Family Platform Capability Audit*
