# Marriage Platform Capability Audit

**Document type:** Platform reverse-engineering audit (product-capability primary)  
**Product lens:** Marriage / long-term couple household experience  
**Runtime identity (evidence):** **Identical engine to Cohabitation.**  
- `RelationshipKind` / `DeepAnalysisKind` value: **`cohabitation` only**  
- No `marriage` kind in `lib/relationship/relationshipKind.ts`  
- Producer: `runCohabitationDeepAnalysis`  
- Body type name: `MarriageReportBody`  
- UI: `MarriageReportView`  
- Overlay brand: `marriedSajuDeep` / `meta.married_saju_deep`  
- User-facing label: `동거·결혼` / “Household · Life Partnership”

**Companion engineering document:** `COHABITATION_PLATFORM_AUDIT.md` (full stage tables, file maps, CO field lists).  
This document does **not** invent a second pipeline. It reverse-engineers **what “Marriage” users actually receive** from that shared system, and what Marriage-relevant capabilities are hidden.

**Constitution (`05_Relationship_Product_Bible.md`):** Romantic and Marriage/Cohabitation are separate products. Marriage modules may center money, labor, in-laws, space, intimacy, parenting, long-term household life.

**Status:** Research knowledge base — no redesign / no decisions

---

# Executive Summary

## Overall implementation maturity

From a Marriage product director’s view, the platform **already ships a household operations report**, not a dating report. Implementation maturity of the underlying CE is high; maturity of **Marriage product identity** is medium (shared with Cohabitation naming); maturity of **exposing Marriage-grade insights** is uneven — intimacy/attachment typed data and killer questions exist but under-surface.

## Major strengths

1. Users receive origin → scored home life → intimacy/bedroom → home DNA / parenting / in-laws / forecast → fight-proofing — a Marriage-shaped journey.  
2. Money ops (operating CFO) and prescriptions are CE-backed.  
3. Bedroom + sleep + attachment leans (in CO) show intimacy is not left only to Romantic.  
4. Weather forecast gives long-horizon language appropriate to Marriage.  
5. Deep Read `role_balance_signal` speaks household role balance, not dating chemistry.

## Major weaknesses

1. Product name “Marriage” does not exist as a runtime kind — analytics, routing, and docs easily desync.  
2. Score chip “로맨틱 핏” (`activation`) teaches Romantic vocabulary inside Marriage.  
3. Killer questions — high Marriage/coaching value — never shown.  
4. Attachment leans classified in CO, never a Marriage UX module.  
5. Parenting confidence hidden while Family product also speaks parenting — boundary confusion risk for users who buy both.  
6. Part3 title centers bedroom while Deep Read shares the part — Marriage story prioritization is implicit.

## Biggest missing chains (Marriage product view)

| Marriage-valuable capability | Break |
|------------------------------|-------|
| Killer questions | Meta → no UI |
| Attachment lean | CO → no module |
| CFO/parenting confidence | SSOT → no trust chrome |
| Rich fight-aid card | SSOT → VM slim |
| Distinct Marriage vs Cohabitation skins | **No code split** — one experience |

---

# Capability Map

*(Pipeline producers identical to Cohabitation audit; “Marriage meaning” column is product observation from labels/placement.)*

| Capability | Marriage user question | Engine/SSOT support | What Marriage user gets | State |
|------------|------------------------|---------------------|-------------------------|-------|
| Origin story | Why are we a household / couple unit? | Origin section | Card in Part1 | Full |
| Romantic fit score | How’s our intimacy/attachment rhythm? | `activation` → 로맨틱 핏 | Score chip + TriScore | Full surface / naming risk |
| Life synergy | Can we run life together? | `benefit` | Score chip | Full |
| Home risk | What’s stressing the home? | `risk` | Score chip | Full |
| Money/chores CFO | Who operates household finance labor? | Money section + operating_cfo | MoneyChoresCard | Partial (confidence hidden) |
| Bedroom | How do we meet intimately? | Bedroom matrix | BedroomCard | Partial |
| Sleep | How do we rest together? | Sleep fit | Subset text | Partial |
| Parenting | How might we raise children? | Parenting section | ParentingCard | Partial |
| In-laws / family boundary | How do we handle origin families? | Boundary section | FamilyBoundaryCard | Full |
| Weather / 3 years | What’s ahead for us? | Forecast | WeatherForecastCard | Full |
| Privacy | How do we keep space? | Privacy | PrivacyCard | Full |
| Upset / warning | How do we fight and repair? | Upset + warning | Cards (warning slim) | Partial |
| Prescriptions | What habits stabilize marriage/cohabitation? | PairCohabitationSignals | Prescriptions | Partial |
| Killer questions | What should we discuss deliberately? | killer_questions pack | **Nothing** | Hidden |
| Attachment lean | What’s our attachment lean? | CO categories | **Nothing** | Hidden |
| Deep Read | What’s the deeper household story? | married overlay | DeepReadCard | Partial |
| Compare axes | Where do we differ at home? | 6 rows | Table | Full |

---

# Full Pipeline Audit

## Identity chain (Marriage-specific)

```text
Product language: "Marriage" / "동거·결혼" / marriedSajuDeep
        ↓
Runtime kind: cohabitation
        ↓
Functions: runCohabitationDeepAnalysis → buildMarriageReport
        ↓
Persist: result_premium_by_kind.cohabitation
        ↓
UI: MarriageReportView + cohabitation i18n keys
        ↓
User experience: one household report
```

**Break (product architecture):** Constitution groups “Marriage / Cohabitation” as one product family; code has one kind. There is no second pipeline to audit. Any future split would be new work — out of scope here.

## Engineering stages

Refer to `COHABITATION_PLATFORM_AUDIT.md` Full Pipeline Audit for Engine→SSOT→Canonical→Context→Meta→Projection→ViewModel→UI→Narrative stage health.

Marriage-relevant breaks restated:

1. Killer questions dead at UI.  
2. Attachment lean dead at UI.  
3. De-escalation rich→slim.  
4. Confidence fields unused.  
5. Overlay extras unused.  
6. Naming desync across layers.

---

# Report Usage Audit

## What Marriage users actually receive

A **household partnership deep report** behind premium kind `cohabitation`:

- Recognition of why the household formed  
- Three home scores (including “로맨틱 핏”)  
- Side-by-side home-life axes  
- Optional psych radar  
- Money/chores operating narrative  
- Optional LLM Deep Read (role balance + advice)  
- Bedroom chemistry presentation  
- Home DNA, parenting, in-law boundary, multi-year weather  
- Privacy + upset + slim warning + prescriptions  

They do **not** receive a separate “married legal status” classifier, a Romantic dating report, or Family Child DNA Playbook.

## Calculated for Marriage but never shown

Same dead set as Cohabitation engineering audit — highest Marriage product weight:

- Killer questions  
- Attachment leans  
- CFO/parenting confidence  
- Full de-escalation fight-aid fields  
- Bedroom archetype ids / sleep nicknames  

## Narrative-only

Deep Read household frames; much editorial section prose.

## SSOT-driven vs editorial vs LLM (Marriage reading)

| Experience beat | Character |
|-----------------|-----------|
| Scores, CFO, compare, parenting keys | SSOT |
| Origin, weather, DNA, privacy | Editorial on CE |
| Bedroom presentation | Mixed (SSOT under-exposed) |
| Deep Read | LLM explain |
| Killer questions | SSOT pack unused |

## Free vs premium

Basic perspectives ≠ this household body. Marriage deep content is premium-kind-only.

---

# Hidden Opportunities

| Opportunity | Why it matters for Marriage | Evidence |
|-------------|----------------------------|----------|
| Killer questions | Marriage counseling UX often starts from good questions; pack already exists | `meta.killer_questions` |
| Attachment lean badges | High lay recognition; already classified | CO `attachment_lean_*` |
| Confidence on CFO/parenting | Marriage decisions are high-stakes; uncertainty chrome builds trust | SSOT + CO confidence fields |
| Restore rich de-escalation | Couples need scannable fight protocols | HomeDeEscalationCard fields |
| Archetype-structured bedroom | Clearer intimacy map without new calc | Matrix archetypes in CO |
| Horizon (weather) as Marriage signature | Differentiates from Romantic “now” chemistry | WeatherForecastCard exists |
| Resolve “로맨틱 핏” naming | Prevents Marriage users thinking they’re in Romantic product | `COHABITATION_CONFIG` labels |

---

# Structural Problems

1. **Marriage is a label without a kind** — platform knowledge debt.  
2. Romantic vocabulary inside Marriage scores.  
3. Parenting appears in Marriage and Family with different engines.  
4. Dead killer_questions undermines “premium depth” perception.  
5. VM fidelity regressions vs legacy on fight-aid.  
6. Overlay named married while kind is cohabitation — onboarding/docs drift.

---

# Reuse Opportunities

| Asset | Reuse note |
|-------|------------|
| Shared platform spine | Deep Read, TriScore, Prescriptions, Radar, CO strip pattern — same as other domains |
| Weather/horizon | Candidate shared visualization for long-bond products |
| Killer question pack pattern | Reusable if any domain wires a consumer |
| Operating CFO canonical | Pattern shared with Work leadership authority |
| Attachment categories | Boundary-sensitive reuse with Romantic intimacy — do not merge products |
| Marriage vs Cohabitation | **Not two reusable components today** — one component set |

---

# Important Findings

**Product**  
- Evidence supports treating current code as **one Marriage/Cohabitation household product**, matching Product Bible grouping — not two engines.  
- The largest Marriage-specific waste is **killer_questions + attachment lean**.  
- Score naming is the sharpest Romantic-boundary leak in UI chrome.

**UX / Visual**  
- Fight-proofing Part5 is thinner on VM than SSOT allows.  
- Bedroom could be more structured using existing archetypes.

**Component Library**  
- `MarriageReportView` naming vs `cohabitation` keys will confuse component ownership maps.  
- Horizon + killer-question + confidence-badge patterns are library candidates once product chooses to surface them.

**Shared Architecture**  
- Type prefix `Marriage*` on kind `cohabitation` should be called out in any future 06.  
- Dual CFO law must survive any Marriage product rewrite.

**Future 05 / 06 / 07**  
- 05: confirm single household product vs two skins; Marriage question canon; Romantic naming purge list.  
- 06: kind/type/overlay naming SSOT; which CO categories become client projections.  
- 07: killer_questions UI gate; attachment module gate; de-esc VM parity; parenting boundary tests vs Family.

**Cross-reference**  
For exhaustive Engine→User tables, file lists, and CO field inventories, use `COHABITATION_PLATFORM_AUDIT.md`. This Marriage audit exists so Design Freeze can reason about **Marriage meaning** without pretending a second codebase exists.

---

*End of Marriage Platform Capability Audit*
