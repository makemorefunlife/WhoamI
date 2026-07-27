# Cohabitation Platform Capability Audit

**Document type:** Platform reverse-engineering audit (engineering primary)  
**Domain runtime kind:** `cohabitation`  
**Persisted format:** `cohabitation_household_deep_v1`  
**UI entry:** `MarriageReportView` / `relationshipDrilldown.cohabitation`  
**Overlay:** `meta.married_saju_deep` (`married_saju_deep_v1_round1`)  
**Freeze:** `docs/dev/decisions/028_married-saju-deep-narrative-freeze.md`  
**Product labels in code:** `동거·결혼` · Household · Life Partnership · registry “동거·결혼 하우스홀드 분석”  
**Critical identity fact:** There is **no** separate `marriage` value in `RelationshipKind` / `DeepAnalysisKind`. Marriage UI and Cohabitation product copy share **this single pipeline**. See also `MARRIAGE_PLATFORM_AUDIT.md` for product-lens emphasis.  
**Status:** Research knowledge base — no redesign / no decisions

---

# Executive Summary

## Overall implementation maturity

Cohabitation/Household is the **broadest non-Romantic CE surface**: origin, money/CFO, bedroom, sleep, parenting, in-law boundary, weather forecast, privacy, fight-proofing, prescriptions, optional Deep Read. Maturity is high on engine breadth and dual CFO authority discipline; medium on ViewModel fidelity to rich SSOT (warning slimmed; killer questions unused); low on naming coherence (`cohabitation` vs `married*` vs UI “결혼”).

## Major strengths

1. Household ops coverage unmatched by Friend/Work/Family.  
2. Explicit dual CFO authorities (operating CFO ≠ prescription power-struggle leader) — documented in code comments.  
3. Canonical projections: `comparison_table`, `operating_cfo`.  
4. Extremely rich `MarriageContextOutput.dominant_categories` (CFO, parenting, attachment, bedroom archetypes, boundary, psych axes).  
5. Origin story + weather forecast give past/future framing.  
6. Overlay explain-only with kill switch.

## Major weaknesses

1. **`meta.killer_questions` fully built, zero UI consumers** — largest dead product surface in this domain.  
2. VM Warning collapses rich `HomeDeEscalationCard` to `solution_script`.  
3. CFO/parenting confidence & align fields marked UI-unused in code.  
4. Bedroom archetypes / sleep nicknames computed, weakly shown.  
5. Score label “로맨틱 핏” inside household product — naming collision risk with Romantic.  
6. Dual renderer (DNA gate).

## Biggest missing chains

| Chain | Break |
|-------|--------|
| Killer questions pack | Meta → **no component** |
| De-escalation rich fields | SSOT → VM Warning slim |
| CFO confidence/align/dual | SSOT + CO → no badges |
| Parenting confidence/align | SSOT + CO → ParentingCard ignores |
| Bedroom archetypes | Matrix → card shows strings not archetype ids |
| Attachment lean categories | CO only → no attachment UI module |

---

# Capability Map

| Capability | Inferred user question | Origin | Producer | Confidence | Consumed | State |
|------------|------------------------|--------|----------|------------|----------|-------|
| Romantic fit / Life synergy / Home risk | How intimate / life-synced / stressed is our home? | Master scores | `computeMarriageMasterScores` | Deterministic | Chips + `COHABITATION_CONFIG` TriScore | Full |
| Origin story | Why did we become a household? | Pair/story builder | Origin section builders | Editorial+signals | OriginStoryCard | Full |
| Household snapshot / DNA | Who are we at home? | Household pack | `buildHouseholdPartnershipReport` | Template | Snapshot + HomeDna (title key reuse) | Full |
| Compare 6 axes | Where do we differ in home life? | Saju table | `buildMarriageSajuCompareTable` | Typed | Compare card | Full |
| Psych radar | Survey home alignment | Psych | `buildMarriagePsychMatchBundle` | Needs psych | Radar | Partial |
| Money / chores / operating CFO | Who runs household money ops? | Ten-god + refine | `refineHouseholdCfo` + canonical operating_cfo | Dual authority vs Rx | MoneyChoresCard | Partial (confidence Hidden) |
| Bedroom matrix | How do intimacy styles meet? | Bedroom builders | `buildBedroomMatrixSection` | Archetypes in SSOT | BedroomCard (partial fields) | Partial |
| Sleep fit | How do we sleep together? | Sleep section | Sleep builders | Nicknames Hidden | Narrative + prescription subset | Partial |
| Parenting styles | How would we parent? | Ten-god + refine | `refineParentingStyle` | Confidence Hidden | ParentingCard | Partial |
| Family / in-law boundary | How do we handle origin family? | Boundary analysis | Ten-god boundary | Deterministic | FamilyBoundaryCard | Full |
| Weather forecast | What’s the next ~3 years feel? | Forecast builders | Rule context forecast | Editorial+signals | WeatherForecastCard | Full |
| Privacy | How do we need space? | Privacy section | Household pack | Template | PrivacyCard | Full |
| Upset | What upsets each of us? | Upset section | Household pack | Template | UpsetCard | Full |
| Warning / de-escalation | How do we fight-proof? | De-esc cards | Warning section | Rich SSOT | VM shows script only | Partial |
| Prescriptions | Operating habits | `PairCohabitationSignals` | `buildCohabitationPrescriptions` | Needs masters | Prescriptions | Partial |
| Killer questions | Drilldown prompts for reflection? | Builder | `buildCohabitationKillerQuestions` | Pack exists | **Nowhere in UI** | Hidden / dead UI |
| Deep Read | Household story / role balance | LLM | `attachMarriedSajuDeepOverlay` | Explain-only | DeepReadCard | Partial |
| Attachment lean | Secure/anxious/avoidant lean | Stem intimacy | Rule context → CO | Typed in CO | **No card** | Hidden |
| Context Output | Full household typed pack | Repack | `buildMarriageContextOutput` | Richest CO in platform | Digest | Hidden |

### `MarriageCompareRowId`

`household_stress` · `marital_conflict` · `bedroom_lead` · `family_boundary` · `asset_management` · `parenting_style`

### Supporting files

```
lib/relationship/marriage/buildMarriageReport.ts
lib/relationship/marriage/buildMarriageRuleContext.ts
lib/saju/marriageAnalysis.ts
lib/relationship/marriage/* (CFO, bedroom, sleep, cold-war, origin, compare, snapshot, prescriptions, context, canonical)
lib/relationship/marriage/viewModel/*
lib/prompts/relationshipPremium/cohabitation/*
lib/prompts/relationshipPremium/marriedSajuDeep/*
lib/relationship/marriageSajuPromptDigest.ts
components/relationship/MarriageReportView.tsx
components/relationship/marriage/sections/SectionRenderer.tsx
```

---

# Full Pipeline Audit

```text
kind=cohabitation premium
  → pairCohabitation + cohabitationSignals
  → buildMarriageReport → MarriageReportBody
       (+ killer_questions, prescriptions, CO, canonical)
  → attachMarriedSajuDeepOverlay?
  → cohabitation_household_deep_v1
  → stripMarriageContextOutputForClient
  → MarriageReportView (DNA gate) → VM Parts 1–5
```

| Stage | Status |
|-------|--------|
| Engine | Broadest household CE |
| SSOT | MarriageReportBody (name ≠ kind) |
| Canonical | comparison_table, operating_cfo |
| Context | Richest dominant_categories → stripped |
| Meta | psych, prescriptions, killer_questions, married_saju_deep |
| ViewModel | 15 optional sections |
| UI | Marriage* components; kind cohabitation |
| Narrative | Deep Read + many editorial templates |
| User | Household partnership report |

### Chain: Killer questions — Dead UI

```text
buildCohabitationKillerQuestions
  → meta.killer_questions on SSOT/meta
  → grep under components/relationship: no consumers
BREAK: complete product capability with zero UX
```

### Chain: Operating CFO vs Rx CFO — Dual authority (healthy)

```text
Operating: section_money_chores + canonical operating_cfo → MoneyChoresCard
Rx: PairCohabitationSignals.cfo_power_struggle.leader_side → prescription pack
Code explicitly warns they are not the same
USER RISK: if copy conflates them, trust breaks — evidence for Freeze naming
```

### Chain: De-escalation — Partial

```text
HomeDeEscalationCard rich fields on SSOT
  → Legacy MarriageReportView may show more
  → VM WarningCard: solution_script only
BREAK: VM path loses hashtag/color/archetype/psych_state/avoid_actions/shared_trigger*
```

### Chain: Attachment lean — Hidden

```text
stemIntimacy.attachmentLeanA/B
  → CO attachment_lean_a/b
  → no ViewModel section
BREAK: attachment psychology classified, never surfaced as module
```

---

# Report Usage Audit

## Users see (VM)

Origin → scores/compare/radar/money → Deep Read + bedroom → home DNA/parenting/boundary/weather → privacy/upset/warning/prescriptions.

## Never see

Killer questions; CO categories; attachment leans as modules; CFO/parenting confidence; many de-esc fields; sleep nicknames; bedroom archetype ids; gradeReason/uncertain_items; overlay extras.

## LLM uses

Married household digest → overlay. CE classifications unchanged.

## Deterministic vs editorial vs LLM

| Area | Character |
|------|-----------|
| Scores, compare, CFO refine, parenting keys, prescriptions | Deterministic |
| Origin, weather, privacy, upset, DNA prose | Editorial templates |
| Axis notes / psych radar | Survey |
| Deep Read | LLM |
| Killer questions | Deterministic pack — **unused** |

---

# Hidden Opportunities

| Item | Why valuable | UX observation |
|------|--------------|----------------|
| Killer questions | Ready-made reflection prompts tied to household CE | Q&A surface / shareable prompts / premium drilldown |
| Attachment lean categories | Attachment language is high recognition for couples | Badge or bedroom companion without new model |
| Bedroom archetypes (stamina/fantasy/manner) | Already typed in CO | Stronger bedroom card structure |
| CFO confidence/align/dual | Separates “who operates money” from conflict risk | Money card trust layer |
| Parenting confidence/align | Same for parenting | Parenting card trust layer |
| Rich de-escalation card | Hashtag/color/archetype = scannable fight aid | Restore VM parity with legacy |
| Sleep nicknames | Memorable sleep personas | Sleep subsection chrome |
| Weather forecast as horizon pattern | Exists here; Friend/Work lack | Cross-domain horizon component candidate |

---

# Structural Problems

1. Naming trinity: kind `cohabitation` · types `Marriage*` · overlay `married*` · label 동거·결혼.  
2. Dead killer_questions.  
3. VM vs legacy fidelity gap on de-escalation.  
4. Title reuse dnaCardTitle across snapshot & home_dna.  
5. “로맨틱 핏” label inside household scores.  
6. Thematic overlap: compare rows vs later cards (bedroom_lead vs bedroom card, etc.) — not always bad, but dense.  
7. Family parenting overlap across products.

---

# Reuse Opportunities

| Asset | Platform reuse | Why |
|-------|----------------|-----|
| Operating authority canonical (CFO) | Pattern twin to Work leadership | Typed role authority |
| Weather / forecast card | Horizon component | Friend/Work lack future module |
| Killer question pack pattern | Other domains | Reflection UX — only if wired |
| Bedroom/attachment typed categories | Romantic intimacy (carefully) | Shared intimacy vocabulary — boundary-sensitive |
| Cold-war / de-esc rich card | Fight-proofing library | Script UX |
| Deep Read / TriScore / Prescriptions / Radar | Platform | Shared |
| CO richness | Proof CO can be product-grade | Argument to consume CO in UI or stop building unused fields |

---

# Important Findings

**Product**  
- Runtime is one household engine serving “동거·결혼” label — Freeze must decide if Cohabitation and Marriage are one product or two skins.  
- Killer questions are the clearest unused premium capability.  
- Romantic boundary is constitutionally required; score naming currently blurs it.

**UX / Visual**  
- VM slim of de-escalation reduces fight-aid scannability vs legacy.  
- Attachment lean is a silent asset.

**Architecture**  
- Richest CO on platform; still stripped.  
- Dual CFO is a correctness feature — document in 06 as law.

**05 / 06 / 07**  
- 05: cohabitation vs marriage product identity; killer questions role; Romantic score naming.  
- 06: Marriage* type names vs kind keys; CO field→UI policy; dual CFO contract.  
- 07: killer_questions consumer gate; VM de-esc parity; confidence badge policy.

---

*End of Cohabitation Platform Capability Audit*
