# 06D — Family Technical Blueprint

**Version:** 1.0  
**Status:** Canonical Technical SSOT  
**Owner:** Product Engineering  
**Applies to:** Ahaitsme Family — Parent Perspective and Child Perspective  
**Product authority:** `05D_Family_Product_Blueprint.md`  
**Implementation companion:** `07D_Family_Implementation_Checklist.md`

---

## 0. Authority and Reading Rules

This document defines how the Family product is produced technically.

It owns:

- deterministic ownership,
- source provenance,
- role and viewer binding,
- canonical classifications,
- comparison architecture,
- projection contracts,
- report assembly,
- LLM boundaries,
- client/server responsibility,
- cache and migration requirements,
- and technical release gates.

It does not redefine:

- the Family product thesis,
- the report’s human questions,
- the shared narrator,
- visual design language,
- or implementation batch order.

Those remain owned by the relevant Product Blueprint, Narrative Style Bible, Visual Design System, and Implementation Checklist.

### 0.1 Status vocabulary

Every statement in this document is one of three kinds.

| Status | Meaning |
|---|---|
| **CONFIRMED** | Verified in the current implementation audit or existing runtime path |
| **TARGET** | Required architecture for the approved Family product, not necessarily implemented yet |
| **DEFERRED** | Valuable future capability that must not be implied as available today |

A TARGET contract may guide implementation, but must not be presented as shipped behavior until verified in code and tests.

---

# Part I — Technical Thesis

## 1. Core Architecture Principle

Family must convert multiple evidence sources into one coherent relationship explanation without allowing any layer to invent another layer’s facts.

```text
Person A Saju + Person B Saju
        ↓
Person-level deterministic signals
        ↓
Family pair signals and role-aware comparisons
        +
11-axis psych evidence, when available
        ↓
Canonical Family judgments
        ↓
Typed projections for report modules
        ↓
Narrative explanation and UI presentation
```

The relationship judgment belongs to deterministic server code.

The LLM may explain a judgment. It may not create, reverse, strengthen, or classify it.

The client may render a projection. It may not recompute the judgment.

---

## 2. One Judgment, Multiple Projections

A single supported Family judgment may feed several surfaces.

Example:

```text
Canonical judgment
  shared_environment_fit = recovery_space_mismatch

Projections
  → hero insight
  → environment chapter
  → comparison row
  → daily-life example
  → one practical adjustment
```

The projections may vary in length and format, but must preserve:

- direction,
- person binding,
- evidence source,
- confidence,
- severity,
- and recommendation logic.

No downstream surface may independently reinterpret the same raw data.

---

## 3. Relationship First, Not Two Profiles

Family is not produced by placing two personal analyses side by side.

The system must explicitly compute or resolve:

- what each person needs,
- what each person tends to provide,
- how one person’s behavior is likely to be received,
- where similarity supports ease,
- where difference creates complementarity,
- where direction matters,
- and where the shared environment imposes unequal adaptation cost.

A person-level fact is not a Family insight until its relationship meaning is resolved.

---

# Part II — Current As-Is Architecture

## 4. Confirmed Runtime Chain

**CONFIRMED**

```text
runFamilyParentChildDeepAnalysis
  → buildFamilyParentReport
  → optional attachFamilySajuDeepOverlay
  → result_premium_by_kind.family
  → client-safe stripping
  → FamilyParentReportView
  → buildFamilyReportViewModel
  → family section renderer
```

Current format:

```text
family_parent_child_deep_v2
```

Current Family roles include:

- parent slot,
- child slot,
- parent type,
- and whether the child is the current viewer.

The product already supports role-aware delivery in parts of the pipeline, but not every output is viewer-swapped or role-aware today.

---

## 5. Confirmed Current Section Inventory

**CONFIRMED AS-IS**

The current report includes or can include:

1. snapshot
2. relationship index
3. Saju comparison table
4. household roles
5. 11-axis psych radar
6. child DNA
7. talent / study / wealth material
8. growth tunnel
9. parent or child role material
10. filial frequency for the child-viewer track
11. deep read
12. destiny
13. filial reward
14. SOS
15. de-escalation
16. prescriptions

Current ordering and part numbering are not yet the approved 05D narrative order. The current UI begins at Part 2 and has no true opening chapter.

---

## 6. Confirmed Current Comparison Table

**CONFIRMED AS-IS**

The Family Saju comparison table stores six rows.

| Row | Current visibility |
|---|---:|
| `correction_style` | shown |
| `bond_distance` | shown |
| `guidance_balance` | shown |
| `home_climate` | shown |
| `affection_expression` | stored, hidden |
| `gathering_recovery` | stored, hidden |

The current table is Saju-derived. It is not the same artifact as the 11-axis psych radar.

The table also includes a limited Family Role Lens on selected rows. Mother/father wording can differ while the underlying classification remains unchanged.

---

## 7. Confirmed Current Data Sources

**CONFIRMED AS-IS**

| Evidence family | Current role |
|---|---|
| Pair Saju analysis | relationship fit, friction, roles, comparison material |
| Parent Ten-God analysis | parent lens and selected role interpretation |
| PersonCore Family signals | Family-specific person-level tendencies |
| PairFamilySignals | prescription and separation/nagging/tension behavior |
| 11-axis psych bundle | radar and selected supporting notes |
| Family killer sections | deterministic narrative sections |
| Family Saju deep overlay | optional LLM explanation layer |

Important current limitation:

> The comparison-table path, person Family-signal path, and prescription path are not yet one unified canonical pipeline.

They are separate evidence routes that converge only at report assembly.

This document defines the TARGET contract that will make their relationship explicit without falsely claiming that they are already unified.

---

## 8. Known Current Technical Risks

**CONFIRMED AS-IS**

### 8.1 Old-cache validity

The current cache validity check may accept an older Family report even when newer sections such as the comparison table are absent.

Therefore, new Family architecture cannot be considered deployed merely because new code exists.

A schema or capability version must participate in cache validation.

### 8.2 Viewer binding is incomplete

Current Deep Read uses fixed parent/child slots rather than a universal viewer-aware projection.

### 8.3 Duplicate concepts may disagree

`parent_lens_summary` and comparison-table care/guidance material can discuss similar concepts while using different resolvers or thresholds.

They must either:

- remain explicitly separate with different jobs, or
- be reconciled under one canonical judgment.

Silent disagreement is prohibited.

### 8.4 Psych and Saju visuals may be confused

The 11-axis radar and Saju comparison table are different evidence surfaces. Their labels and supporting copy must not imply that one was calculated from the other.

### 8.5 Current report is inventory-led, not narrative-led

The current section chain contains useful material but does not yet enforce the approved recognition → misunderstanding → environment → action progression.

---

# Part III — Canonical Evidence Architecture

## 9. Evidence Source Types

The Family engine must preserve source identity at field level.

```ts
type FamilyEvidenceSource =
  | "saju_person"
  | "saju_pair"
  | "psych_person"
  | "psych_pair"
  | "family_role"
  | "family_environment"
  | "user_context"
  | "derived_canonical";
```

A claim may combine sources, but each contributing fact must remain traceable.

### 9.1 Source rules

- Saju evidence may explain tendencies, role patterns, timing, and elemental fit.
- Psych evidence may describe measured behavioral preferences and gaps.
- Pair evidence may describe the interaction between two people.
- Role evidence may change wording or relevance, not raw person traits.
- User context may refine application, but cannot alter deterministic calculations.
- LLM output is never an evidence source.

---

## 10. Canonical Evidence Object

**TARGET**

Every major judgment should be supported by a typed evidence package.

```ts
type FamilyEvidenceRef = {
  id: string;
  source: FamilyEvidenceSource;
  owner: "parent" | "child" | "pair" | "environment";
  field: string;
  direction?: "low" | "mid" | "high" | "mixed";
  strength?: number;
  note?: string;
};

type FamilyCanonicalJudgment<TType extends string = string> = {
  id: string;
  type: TType;
  direction: string;
  subject: "parent" | "child" | "pair" | "environment";
  counterpart?: "parent" | "child";
  confidence: "corroborated" | "refined" | "tentative";
  severity: "S0" | "S1" | "S2" | "S3" | "S4";
  evidence: FamilyEvidenceRef[];
  caveats?: string[];
};
```

The exact TypeScript placement may differ, but equivalent provenance, confidence, severity, and binding are required.

---

## 11. Confidence Contract

Confidence and severity are independent.

### 11.1 Corroborated

Use when multiple relevant sources support the same direction.

Examples:

- Saju pair signal + compatible psych gap
- person Saju tendency + pair outcome signal
- two independent deterministic Family resolvers

### 11.2 Refined

Use when the core direction is supported but another source changes how it is expressed.

Example:

- Saju suggests emotional reserve,
- psych evidence shows strong empathy,
- therefore the person may care deeply but express it indirectly.

### 11.3 Tentative

Use when evidence is single-source, weak, mixed, or only directionally suggestive.

Tentative judgments must not drive:

- strong warning copy,
- major future claims,
- deterministic labels,
- or long narrative sections.

---

## 12. Evidence Combination Laws

### 12.1 Confirmation

```text
Saju direction ≈ Psych direction
→ stronger confidence
→ concise, direct explanation allowed
```

### 12.2 Refinement

```text
Saju direction + Psych context
→ same core tendency, different lived expression
```

### 12.3 Tension

```text
Saju direction conflicts with Psych direction
→ do not average silently
→ explain context dependence or mark mixed
```

### 12.4 Missing psych

```text
No psych data
→ Saju-only report remains valid
→ no fabricated psych note
→ confidence cannot be upgraded using absent data
```

### 12.5 Missing Saju evidence

A psych difference must not be described as Saju-derived.

The product may still use psych evidence, but provenance must remain explicit internally and honest in the explanation.

---

# Part IV — 11-Axis Architecture

## 13. The 11 Axes Are Evidence, Not Chapters

The Family report must not create eleven consecutive trait sections.

The axes are selectively used to answer relationship questions.

| Axis | Family questions it may support |
|---|---|
| `stimulation` | How much novelty, activity, and external input feels energizing? |
| `self_control` | How quickly can impulse or emotion be contained under pressure? |
| `practicality` | Does care become concrete help, planning, or realism? |
| `structure` | How much routine, clarity, and predictability feels safe? |
| `empathy` | Is emotional recognition needed before explanation or correction? |
| `conflict_style` | Does tension lead toward discussion, avoidance, escalation, or delay? |
| `resilience` | How quickly does the person recover after stress or disappointment? |
| `recognition` | How important is praise, acknowledgment, or visible approval? |
| `energy_style` | Is energy restored through people, activity, privacy, or quiet? |
| `thinking_style` | Is understanding built through abstraction, detail, experience, or reflection? |
| `decision_style` | Is a decision made through speed, certainty, options, discussion, or internal processing? |

### 13.1 Selective axis rule

A section should normally use:

- one primary axis,
- zero to two supporting axes,
- and only when they materially change the interpretation.

The full radar may remain available as an evidence view, but narrative emphasis must be selective.

### 13.2 No axis moral ranking

High and low values are not good and bad.

Examples:

- high structure may support consistency but feel rigid under stress,
- low structure may support flexibility but create uncertainty,
- high recognition need is not weakness,
- low conflict expression is not emotional maturity by default.

---

## 14. Psych Pair Comparisons

**TARGET**

Psych comparison must distinguish at least four states.

```ts
type FamilyPsychRelation =
  | "similar"
  | "complementary"
  | "directional_gap"
  | "context_dependent";
```

A numerical difference alone is insufficient.

The resolver must answer:

1. Is the difference large enough to matter?
2. Does similarity create ease or mutual blind spots?
3. Does difference create complementarity or friction?
4. Is one person’s need dependent on what the other person provides?
5. Does the parent/child role make the direction asymmetric?

---

# Part V — Saju and Cross-Axis Comparison Architecture

## 15. Saju Comparison Is Not a Second Psych Test

The Saju comparison table must preserve its own purpose.

It should answer relational questions that arise from:

- elemental flow,
- Ten-God structure,
- strength and balance,
- role-sensitive interpretation,
- and verified Family pair calculations.

It must not mimic the 11-axis vocabulary merely for visual consistency.

Shared UI geometry does not imply shared evidence or shared meaning.

---

## 16. Family Comparison Matrix

The Family engine must support three comparison types.

### 16.1 Same-axis comparison

```text
Parent empathy ↔ Child empathy
Parent structure ↔ Child structure
Parent energy_style ↔ Child energy_style
```

Useful for:

- similarity,
- rhythm,
- mutual recognition,
- and direct preference gaps.

### 16.2 Cross-axis directional comparison

```text
Child need ↔ Parent response tendency
```

Examples:

| Child-side need or tendency | Parent-side tendency | Family meaning |
|---|---|---|
| emotional recognition | correction or problem-solving speed | Does guidance arrive before the child feels understood? |
| processing time | decision speed | Does urgency become pressure? |
| autonomy | protection / bond distance | Does care become control? |
| stimulation need | household activity level | Is the environment under- or over-stimulating? |
| private recovery | family gathering expectation | Is solitude misread as rejection? |
| recognition need | affection expression style | Is love present but hard to detect? |
| flexible thinking | structural guidance | Does routine support growth or suppress initiative? |
| practical learning | abstract instruction | Does teaching match the child’s way of understanding? |

### 16.3 Saju-to-psych synthesis

```text
Saju pattern ↔ Psych expression
```

This is not a score comparison.

It determines whether psych evidence:

- confirms,
- refines,
- complicates,
- or does not materially affect

the Saju-derived interpretation.

---

## 17. Canonical Family Comparison Domains

**TARGET PRODUCT DOMAINS**

The engine should resolve a small set of relationship domains rather than expose every possible input.

| Domain | Core question | Primary evidence candidates |
|---|---|---|
| `understanding_sequence` | What must happen first for each person to feel heard? | empathy, thinking, decision, pair communication |
| `guidance_reception` | When does guidance feel supportive, and when does it feel controlling? | structure, recognition, correction style, parent role |
| `bond_and_independence` | How do closeness and autonomy coexist? | bond distance, energy, independence signals |
| `affection_translation` | How is love offered, and how is it recognized? | empathy, recognition, affection expression |
| `conflict_and_recovery` | How does tension begin, escalate, and settle? | conflict style, resilience, recovery signals |
| `learning_and_growth` | How does the child understand, practice, and develop? | thinking, structure, decision, talent signals |
| `shared_environment_fit` | Does the family’s actual life rhythm suit both people? | stimulation, energy, structure, home climate, environment signals |
| `future_distance` | How might maturity and independence reshape the bond? | bond distance, growth timing, verified temporal signals |

Not all domains require a standalone visible module. Several may be synthesized into one chapter.

---

# Part VI — Shared Environment Fit

## 18. Environment Must Be Modeled Separately from Emotional Climate

`home_climate` and `shared_environment_fit` are not synonyms.

### 18.1 Home climate

Concerns the emotional atmosphere of the household.

Examples:

- warm vs restrained,
- expressive vs quiet,
- tense vs easygoing,
- correction-heavy vs reassurance-heavy.

### 18.2 Shared environment fit

Concerns whether the actual way of living fits each member’s temperament.

Examples:

- busy city vs quiet environment,
- high social activity vs privacy,
- fixed routine vs flexible rhythm,
- constant togetherness vs independent space,
- external stimulation vs low-stimulation recovery,
- settled life vs movement and exploration.

The two can interact but must retain separate classifications.

---

## 19. Environment Fit Model

**TARGET**

```ts
type FamilyEnvironmentDimension =
  | "stimulation_level"
  | "social_density"
  | "pace"
  | "routine_strength"
  | "privacy"
  | "togetherness"
  | "mobility"
  | "urban_nature_balance";

type FamilyEnvironmentFit = {
  dimension: FamilyEnvironmentDimension;
  parentNeed?: string;
  childNeed?: string;
  currentEnvironment?: string;
  fit: "supportive" | "mixed" | "costly" | "unknown";
  adaptationCostOwner?: "parent" | "child" | "both" | "unknown";
  confidence: "corroborated" | "refined" | "tentative";
  evidence: FamilyEvidenceRef[];
};
```

### 19.1 No invented current environment

Saju and psych evidence may infer an ideal or likely preferred environment.

They cannot prove where or how the family currently lives.

Without user-provided context, the report must say:

> “A high-stimulation environment may suit one person more than the other.”

It must not say:

> “Your current city is exhausting the child.”

### 19.2 Adjustment before relocation

The default output is a small environmental adjustment, not a life directive.

Examples:

- protected quiet time,
- fewer back-to-back activities,
- predictable transition windows,
- one private space,
- additional external activity,
- planned novelty,
- clearer together/apart rhythms.

Major choices such as moving, changing schools, or separating households must remain user decisions.

---

# Part VII — Growth, Talent, and Time

## 20. Growth Claims Require Separate Ownership

The Family product may discuss:

- growth style,
- likely maturation rhythm,
- learning conditions,
- talent tendencies,
- independence needs,
- and possible environment fit.

It must not imply exact outcomes that the current engine cannot support.

### 20.1 Static tendency

Can be produced from current person and pair signals.

Examples:

- prefers experiential learning,
- develops confidence through autonomy,
- needs repetition before visible mastery,
- grows under stable expectations.

### 20.2 Temporal claim

Requires verified temporal calculation.

Examples:

- a specific age window,
- a Luck Pillar transition,
- a forecasted period of independence,
- a future maturation phase.

No static signal may be rewritten as a timed forecast.

### 20.3 Current technical stance

**DEFERRED unless verified in the active code path:**

- exact Da Yun windows,
- age-specific behavioral predictions,
- precise timing of academic or career success,
- guaranteed future closeness or separation.

The current product may discuss likely direction and conditions, not fixed destiny.

---

# Part VIII — Perspective and Role Architecture

## 21. Canonical Roles

**TARGET**

```ts
type FamilyMemberRole = "parent" | "child";
type FamilyParentType = "mother" | "father" | "parent";
type FamilyViewerRole = "parent_viewer" | "child_viewer";
```

Raw evidence is person-bound.

Canonical relationship judgments are role-bound.

Visible narrative is viewer-bound.

These are different stages.

---

## 22. Viewer Projection Law

The same relationship judgment may be explained differently to each viewer, but its truth must not change.

Example canonical judgment:

```text
Parent tends to protect through structure.
Child experiences safety through choice and processing time.
```

Parent-viewer projection:

> Your structure may be intended as protection, but it can land before the child has had enough room to choose.

Child-viewer projection:

> Your parent may use structure as a form of protection. That does not erase the pressure you feel, but it helps explain why concern often arrives as direction.

The following must remain identical:

- direction,
- evidence,
- severity,
- confidence,
- and responsibility for harmful behavior.

Viewer adaptation must never become excuse-making.

---

## 23. Mother/Father Lens Boundary

A mother/father lens may affect:

- role vocabulary,
- culturally or structurally relevant explanation,
- and which relationship question is foregrounded.

It must not:

- change a raw score merely because of gender,
- introduce stereotypes,
- assume caregiving behavior,
- or create different classifications from identical evidence unless a verified role-specific resolver owns that difference.

Neutral fallback is mandatory when parent type is unknown or unsuitable.

---

# Part IX — Canonical Judgments and Projections

## 24. Required Canonical Judgment Families

**TARGET**

A complete Family architecture should expose typed judgments for:

1. relationship overview
2. translation gap
3. guidance and correction
4. bond and independence
5. affection translation
6. conflict and recovery
7. shared environment fit
8. learning and growth
9. future relationship direction, only within evidence limits
10. prioritized actions

These do not have to map one-to-one to UI sections.

---

## 25. Translation Gap Contract

The Family product’s signature mechanic is the intention-to-experience translation.

```ts
type FamilyTranslationGap = {
  actor: "parent" | "child";
  receiver: "parent" | "child";
  actorIntent: string;
  actorBehavior: string;
  receiverExperience: string;
  condition: string;
  repairPrinciple?: string;
  confidence: "corroborated" | "refined" | "tentative";
  evidence: FamilyEvidenceRef[];
};
```

A translation gap requires evidence for both sides.

The narrator may not invent the actor’s motive merely to create a compelling contrast.

When motive evidence is weak, use safer language:

> “This behavior may function as protection…”

not:

> “You do this because you are afraid…”

---

## 26. Action Contract

Every visible recommendation must point back to a canonical finding.

```ts
type FamilyAction = {
  id: string;
  findingId: string;
  actor: "parent" | "child" | "both";
  trigger: string;
  behavior: string;
  reason: string;
  desiredEffect: string;
  scope: "conversation" | "routine" | "environment" | "boundary";
};
```

The final report should normally prioritize no more than four actions.

More available actions may remain in progressive disclosure, but the narrative ending must stay memorable.

---

# Part X — Target Report Assembly

## 27. Narrative Assembly Order

The approved Family report should be assembled as a progressive explanation.

```text
1. Recognition
   Who are these two people together?

2. Translation
   What does each person intend, and what does the other experience?

3. Repeating Pattern
   Where do guidance, closeness, affection, or conflict repeatedly miss?

4. Shared Environment
   Who is supported by the family’s current rhythm, and who pays the adaptation cost?

5. Growth and Future
   What conditions help the child mature and the relationship evolve?

6. Action
   What should each person remember and try next?
```

### 27.1 Section budget

The final visible report should prefer:

- fewer, stronger chapters,
- one primary insight per chapter,
- progressive disclosure for detailed evidence,
- and deliberate omission of weak or redundant material.

Current components may be reused, merged, reordered, or hidden. Existing section count is not product authority.

---

## 28. Proposed Projection Map

**TARGET — final names may be set in 07D**

| Narrative job | Canonical inputs | Possible current assets |
|---|---|---|
| Opening recognition | overview, strongest pair pattern | snapshot, relationship index, deep read |
| Two-person portrait | selective person traits + pair meaning | child DNA, household roles, psych evidence |
| Translation gap | translation judgments | generation gap / deep read material |
| Guidance and bond | correction, guidance, bond judgments | compare table rows, parent lens |
| Affection and recovery | affection, conflict, recovery judgments | hidden rows, SOS, de-escalation |
| Shared environment | home climate + environment fit | home climate, psych energy/stimulation/structure |
| Growth and future | growth conditions + supported timing | talent, growth tunnel, destiny |
| Closing playbook | top actions | prescriptions, de-escalation |

No current asset is automatically retained. Each must prove that it adds a distinct job in the final narrative.

---

# Part XI — Server, LLM, and Client Boundaries

## 29. Server Ownership

The server owns:

- raw Saju calculations,
- person and pair signals,
- 11-axis psych bundle construction,
- role resolution,
- thresholds and buckets,
- comparison relation type,
- canonical judgments,
- confidence and severity,
- action selection,
- viewer-safe projections,
- schema validation,
- and client stripping.

The server must reject or drop invalid projections rather than ask the client to infer missing meaning.

---

## 30. LLM Ownership

The LLM may:

- synthesize multiple approved facts,
- explain a translation gap,
- create narrative continuity,
- improve natural Korean and English,
- produce a supported ordinary-life implication,
- and phrase approved actions clearly.

The LLM may not:

- classify a person or pair,
- calculate scores,
- choose a direction from raw signals,
- create unsupported A-vs-B contrast,
- invent motives or incidents,
- infer a current environment not supplied,
- create future timing,
- diagnose,
- or override deterministic actions.

### 30.1 Preferred LLM input

The prompt package should receive:

- typed canonical judgments,
- explicit person binding,
- evidence summaries,
- confidence,
- severity,
- section job,
- length budget,
- locale,
- and prohibited claims.

It should not receive an unstructured dump of the full Saju and psych payload when a canonical projection already exists.

### 30.2 Preferred LLM output

LLM output should be narrative-only.

Typed classifications must remain server-provided.

Post-validation must confirm:

- no direction reversal,
- no unsupported certainty,
- no new facts,
- no person-binding error,
- no locale leakage,
- and no contradiction with the action pack.

---

## 31. Client Ownership

The client owns:

- layout,
- progressive disclosure,
- chart and table rendering,
- source explanation labels,
- accessibility,
- responsive behavior,
- and safe omission of unavailable optional sections.

The client must not:

- recompute fit,
- derive gaps from raw axis values,
- choose warning severity,
- select actions,
- or rewrite parent/child binding.

---

# Part XII — Visual and Evidence Contracts

## 32. 11-Axis Radar

The radar is an evidence surface, not the report’s conclusion.

Required behavior:

- identify it as psych/survey evidence,
- avoid rank or grade framing,
- use narrative to explain only selected axes,
- avoid default red-as-bad semantics for ordinary difference,
- and provide accessible non-chart text.

The report may choose not to foreground the full radar if it interrupts the narrative.

---

## 33. Saju Comparison Table

Each visible row must include:

- a human question,
- parent tendency,
- child tendency,
- relation type,
- lived meaning,
- and optional action link.

The table must not declare a winner.

A row should be removed or hidden when it does not materially change understanding.

---

## 34. Evidence Separation in UI

Users do not need to see internal field names, but they should be able to understand whether an insight comes primarily from:

- Saju,
- the 11-axis survey,
- or a combined interpretation.

Allowed UI patterns include:

- compact source chips,
- an “왜 이렇게 해석했나요?” disclosure,
- a source legend,
- or section-level evidence notes.

The UI must not imply scientific validation for Saju or mystical certainty for psych measurements.

---

# Part XIII — Persistence, Versioning, and Cache

## 35. Persisted Authority

The persisted domain report body remains the authoritative premium artifact unless a future migration explicitly changes ownership.

ViewModels are delivery projections and should remain reproducible from the persisted report.

Raw server-only context must not be exposed merely to make client rendering easier.

---

## 36. Capability Version

**TARGET**

Family reports require a capability or schema version beyond the broad format tag.

Example:

```ts
type FamilyCapabilityVersion = {
  format: "family_parent_child_deep_v2";
  capabilities: {
    canonicalJudgments: 1;
    viewerProjection: 1;
    environmentFit: 1;
    selectivePsych: 1;
  };
};
```

Exact syntax is implementation-owned.

Cache validity must verify required capabilities, not only one legacy field.

---

## 37. Cache Migration Law

When a newly required canonical section or projection is introduced, one of the following is mandatory:

1. invalidate old cache,
2. migrate old payloads deterministically,
3. regenerate on next access,
4. or visibly retain the old experience under an explicit legacy version.

Silent reuse of incomplete old payloads is prohibited.

---

# Part XIV — Error, Missing Data, and Fallbacks

## 38. Missing Psych Data

The report must remain functional with Saju-only evidence.

It should:

- omit psych-only visuals,
- avoid psych-derived claims,
- retain Saju and pair interpretation,
- and lower confidence where psych corroboration was required.

---

## 39. Missing Parent Type

Use neutral parent wording.

Do not guess mother or father from name, gender, or family role context.

---

## 40. Missing Current Environment Context

Present environment preference or possible mismatch, not current-condition certainty.

Environment advice should remain conditional and small-scale.

---

## 41. Weak or Contradictory Evidence

When evidence is weak or contradictory:

- shorten the section,
- use tentative language,
- avoid warning styling,
- avoid major recommendations,
- and consider omission.

A premium report is improved by removing unsupported content.

---

# Part XV — Safety Architecture

## 42. Prohibited Technical Outputs

No resolver, prompt, template, or UI may output:

- medical or developmental diagnosis,
- inevitable academic failure or success,
- exact career destiny,
- guaranteed wealth,
- inevitable estrangement,
- future child count or gender,
- abuse justification,
- or instructions that place a child at risk.

---

## 43. Harm and Abuse Boundary

The translation mechanic must not convert harmful behavior into a benign personality difference.

The system must distinguish:

```text
understandable intention
≠ acceptable impact
```

Where user-provided context indicates coercion, violence, severe threats, neglect, or immediate danger, safety guidance overrides compatibility interpretation.

Saju must never be used to excuse harm.

---

# Part XVI — Testing Contract

## 44. Unit Tests

Required resolver-level coverage includes:

- each canonical classification branch,
- threshold boundaries,
- parent/child direction reversal,
- mother/father/neutral fallback,
- missing psych behavior,
- conflicting evidence behavior,
- environment-fit unknown state,
- and confidence/severity independence.

---

## 45. Projection Tests

For every canonical judgment:

- parent-viewer and child-viewer projections preserve direction,
- names and roles remain correctly bound,
- no projection changes confidence or severity,
- omitted fields fail safely,
- and actions point to valid finding IDs.

---

## 46. Narrative Contract Tests

Both Korean and English must verify:

- no unsupported certainty,
- no invented event or motive,
- no person-binding swap,
- no diagnosis,
- no deterministic future claim,
- no source contradiction,
- no action contradiction,
- and meaning parity across locales.

---

## 47. Report-Level Fixtures

Minimum QA fixture set:

1. high similarity, supportive relationship
2. strong guidance/autonomy gap
3. affection translation mismatch
4. conflict-speed and recovery mismatch
5. environment under-stimulation mismatch
6. environment over-stimulation mismatch
7. mixed Saju and psych evidence
8. Saju-only report
9. parent viewer
10. child viewer
11. mother lens
12. father lens
13. neutral parent lens
14. old cached payload
15. low-confidence report with intentional omissions

---

## 48. Regression Gates

Release must confirm:

- existing Family premium routing still works,
- legacy reports are migrated or invalidated intentionally,
- `context_output` remains stripped,
- shared components do not import Family semantics into other domains,
- no client re-derivation is introduced,
- and current Family tests remain green or are consciously replaced.

---

# Part XVII — Observability and Editorial QA

## 49. Technical Observability

The system should record non-sensitive operational metrics for:

- report schema version,
- capability version,
- cache hit vs regeneration,
- optional section omission,
- LLM validation failure,
- locale,
- and fallback path used.

Do not log raw sensitive user narratives unnecessarily.

---

## 50. Narrative Diagnostics

Internal QA should be able to answer:

- Which evidence supports this paragraph?
- Which canonical judgment owns this claim?
- Why was this section included?
- Why was another section omitted?
- Which action follows from which finding?
- Did psych confirm, refine, or conflict with Saju?

If these questions cannot be answered, the narrative is not production-ready.

---

# Part XVIII — Implementation Boundaries

## 51. Keep

The following existing foundations are valuable and should normally be retained unless an audit proves otherwise:

- Family premium route and format,
- deterministic report-body ownership,
- Family role resolution,
- Saju comparison infrastructure,
- 11-axis psych bundle,
- pair prescription infrastructure,
- shared Deep Read and report chrome,
- locale routing,
- and server-side client stripping.

---

## 52. Refactor or Reconcile

The following require deliberate review:

- current section order,
- empty Part 1,
- fixed parent/child Deep Read binding,
- hidden comparison rows,
- duplicate care/guidance concepts,
- separation between comparison, narrative, and prescription paths,
- registry or kind mismatches,
- old cache validity,
- and computed-but-unrendered fields.

---

## 53. Add

The approved target product requires:

- typed canonical Family judgments,
- explicit evidence provenance,
- selective 11-axis use,
- cross-axis directional comparisons,
- bidirectional viewer projections,
- shared environment fit,
- translation-gap projections,
- capability-aware cache validation,
- and report-level narrative orchestration.

---

## 54. Defer

Do not block the core Family rebuild on:

- multi-parent or grandparent triangulation,
- exact Da Yun age windows,
- three-person family ecosystem scoring,
- granular elemental percentage displays,
- current-location inference,
- or deterministic school/career recommendations.

These require separate product and engine validation.

---

# Part XIX — Decisions Frozen by This Blueprint

## 55. Frozen Technical Decisions

1. Family remains one product with parent-viewer and child-viewer projections.
2. The relationship, not either person, is the primary report subject.
3. Saju, psych, pair, role, and user context retain distinct provenance.
4. The 11 axes are selective evidence, not eleven chapters.
5. Saju comparison remains distinct from psych comparison.
6. Cross-axis directional comparison is required for Family.
7. Home climate and shared environment fit are separate judgments.
8. Deterministic server code owns classification.
9. LLM owns explanation only.
10. Client rendering must not re-derive meaning.
11. Confidence and severity remain separate.
12. Viewer adaptation may change wording, not truth.
13. Future timing requires verified temporal evidence.
14. Missing evidence leads to softer or shorter output, not invention.
15. Old cache must be capability-aware.
16. The final report is narrative-led, not inventory-led.

---

# Part XX — Open Items for 07D

## 56. Implementation Decisions Still Required

The Implementation Checklist must convert this blueprint into batches and exact file work.

It must decide:

- the final canonical judgment type names,
- the final visible chapter names,
- which current sections are retained, merged, or removed,
- whether hidden comparison rows become visible or feed narrative only,
- how existing comparison and prescription paths are reconciled,
- the exact viewer-projection schema,
- the cache invalidation mechanism,
- legacy renderer retirement criteria,
- prompt and post-validation schemas,
- and commit boundaries.

These are implementation decisions, not unresolved product philosophy.

---

# Final Technical Standard

The Family engine succeeds when it can produce a report in which:

- every important statement has a traceable basis,
- Saju remains the differentiating interpretive engine,
- psych evidence makes behavior legible without replacing Saju,
- parent and child are both represented fairly,
- intention and experience are translated without inventing motives,
- the shared environment is treated as part of the relationship,
- future language remains evidence-safe,
- the LLM explains rather than decides,
- the client presents rather than recalculates,
- and the reader receives a small number of coherent insights instead of a large inventory of traits.

> **The technical goal is not to generate more analysis. It is to preserve enough evidence discipline that the right few insights can feel unmistakably true.**
