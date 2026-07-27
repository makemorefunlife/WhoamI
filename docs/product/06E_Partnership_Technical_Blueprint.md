# 06E Partnership Technical Blueprint

> **Product scope:** Marriage / Cohabitation / Long-term Committed Partnership  
> **Upstream product SSOT:** `05E_Partnership_Product_Blueprint.md`  
> **Document role:** Engineering SSOT for translating Partnership product intent into deterministic signals, evidence packages, narrative projections, UI view models, and guarded LLM output  
> **Status:** Draft v1 — implementation-ready target architecture, subject to repository audit before code changes  
> **Primary engineering question:** **How do we convert two people’s behavioral and relationship evidence into a safe, explainable, reusable shared-life analysis without exposing source jargon or letting the LLM invent the relationship?**

---

## 0. Document Intent

This document defines how the Partnership product should be implemented.

It does not replace the existing repository. Before implementation, engineers must audit current types, builders, routes, report generators, localization behavior, and shared relationship infrastructure. Where the repository already has a canonical pattern, reuse it unless doing so violates the product contract in `05E`.

This document therefore defines:

- the target data flow
- ownership boundaries
- canonical contracts
- required signal inventory
- evidence and confidence rules
- deterministic vs LLM responsibilities
- report and UI projection rules
- localization and safety constraints
- testing and migration requirements

It does not prescribe exact file paths until the repository audit confirms the current architecture.

### 0.1 Non-goals

This document does not authorize:

- rewriting the shared relationship engine without audit
- replacing existing Romantic, Family, Friend, or Work contracts
- exposing traditional interpretive terminology to users
- generating deterministic compatibility scores
- predicting marriage success, divorce, fertility, children, illness, or future events
- allowing the LLM to classify the relationship independently
- introducing gendered household or parenting assumptions

---

# PART I. Engineering Principles

## 1. Canonical Ownership Model

The Partnership system must separate five kinds of ownership.

```text
Source Ownership
    ↓
Signal Ownership
    ↓
Evidence Ownership
    ↓
Narrative Ownership
    ↓
Presentation Ownership
```

### 1.1 Source ownership

Source adapters own extraction and normalization of available inputs.

Examples:

- behavioral psychology profiles
- pair interaction data
- existing relationship indexes
- underlying tendency signals
- user-declared context, when available

Source adapters do not write user-facing conclusions.

### 1.2 Signal ownership

Deterministic resolvers own classifications such as:

- aligned
- complementary
- asymmetric
- tension
- uncertain
- not applicable

Resolvers must return structured states and evidence references, not polished prose.

### 1.3 Evidence ownership

Evidence builders own:

- which facts support a signal
- source provenance
- directionality
- confidence
- corroboration or contradiction
- null handling

### 1.4 Narrative ownership

Narrative projectors own the bounded semantic meaning supplied to the LLM or deterministic copy layer.

They answer:

- what the signal means in real life
- what each partner may experience
- what strength may cost under stress
- what adjustment is supported

They do not invent unsupported events, motives, history, or diagnoses.

### 1.5 Presentation ownership

View-model builders own:

- card order
- badges
- diagrams
- summaries
- visibility rules
- conditional modules
- mobile-safe content limits

UI components must not recompute relationship logic.

---

## 2. Deterministic Core, Generative Surface

The product must use a deterministic core and a constrained generative surface.

```text
Inputs
↓
Normalized Evidence
↓
Deterministic Signals
↓
Deterministic Projection Package
↓
Guarded LLM Narrative
↓
Validated Output
↓
UI View Model
```

### 2.1 Deterministic core owns

- signal direction
- signal eligibility
- confidence tier
- severity tier
- source references
- partner directionality
- module visibility
- score bands, if any internal scores exist
- fallback copy selection

### 2.2 LLM owns

- natural synthesis
- transitions
- warm explanatory prose
- context-sensitive wording
- non-repetitive examples derived from supplied evidence
- headline and body variations within contract

### 2.3 LLM never owns

- whether a signal exists
- whether A or B is more likely to act a certain way
- compatibility verdicts
- confidence classification
- safety classification
- relationship health diagnosis
- future prediction
- partner blame
- source interpretation beyond supplied projection

---

## 3. Audit-First Rule

Before writing code, produce an implementation audit containing:

1. Current report entry points
2. Current pair-analysis inputs
3. Existing Partnership, Marriage, or Cohabitation modules
4. Existing shared relationship types
5. Existing psych-axis access patterns
6. Existing pair-signal resolver patterns
7. Existing evidence packaging patterns
8. Existing LLM prompt and output validation
9. Existing locale propagation
10. Existing UI section and digest contracts
11. Existing tests and fixtures
12. Exact files proposed for modification

No architecture should be invented where a working canonical pattern already exists.

---

# PART II. System Boundary

## 4. Product Identifier

Canonical internal product identifier:

```ts
relationshipKind: "partnership"
```

Supported user-facing modes may include:

```ts
type PartnershipMode =
  | "married"
  | "cohabiting"
  | "engaged"
  | "long_term_committed"
  | "shared_life_planning";
```

The mode may influence eligibility and wording, but must not create separate analytical engines unless future evidence requires it.

### 4.1 Naming rule

- Internal product name: `partnership`
- User-facing Korean: contextually appropriate equivalent such as `부부·생활 파트너 분석`
- User-facing English: `Committed Partnership`
- Avoid forcing legal-marriage terminology on unmarried committed partners

---

## 5. Input Contract

Target normalized input:

```ts
interface PartnershipAnalysisInput {
  personA: PartnershipPersonInput;
  personB: PartnershipPersonInput;
  relationshipContext?: PartnershipRelationshipContext;
  locale: SupportedLocale;
  productVersion: string;
  requestId?: string;
}

interface PartnershipPersonInput {
  id: string;
  displayName?: string;
  psych?: PsychMasterJson | null;
  tendencyProfile?: UnderlyingTendencyProfile | null;
  chartProfile?: PairSourceProfile | null;
}

interface PartnershipRelationshipContext {
  mode?: PartnershipMode;
  livingTogether?: boolean | null;
  hasChildren?: boolean | null;
  planningChildren?: boolean | null;
  sharesFinances?: boolean | null;
  relationshipStage?: string | null;
  declaredConcerns?: PartnershipConcernKey[];
}
```

### 5.1 Context is optional, never fabricated

When relationship context is absent:

- do not state that the couple shares finances
- do not assume they have children
- do not assume heterosexual roles
- do not assume legal marriage
- do not assume duration
- phrase operational modules conditionally

### 5.2 Current behavior priority

When behavioral psychology exists, it owns present-day behavioral descriptions.

Underlying tendency data may:

- corroborate
- refine
- add a tentative latent explanation

It may not override clear present behavior.

---

# PART III. Canonical Pipeline

## 6. End-to-End Flow

```text
PartnershipAnalysisInput
↓
normalizePartnershipInput
↓
buildPartnershipSourceContext
↓
buildPartnershipEvidenceContext
↓
resolvePartnershipSignals
↓
buildPartnershipSignalRegistry
↓
projectPartnershipExperience
↓
buildPartnershipNarrativePackage
↓
generatePartnershipNarrative
↓
validatePartnershipNarrative
↓
buildPartnershipReportViewModel
↓
API / UI
```

### 6.1 Normalize input

Responsibilities:

- canonicalize names
- resolve locale
- preserve missing values
- validate pair identity
- normalize axis ranges
- reject malformed profiles
- attach product version

### 6.2 Build source context

The source context is a read-only package containing normalized raw evidence.

```ts
interface PartnershipSourceContext {
  personA: NormalizedPersonSource;
  personB: NormalizedPersonSource;
  pair: NormalizedPairSource;
  relationshipContext: NormalizedRelationshipContext;
  locale: SupportedLocale;
}
```

### 6.3 Build evidence context

The evidence context translates source-specific data into product-safe evidence units.

```ts
interface PartnershipEvidenceContext {
  axes: PartnershipAxisEvidenceMap;
  pairDynamics: PartnershipPairEvidenceMap;
  tendencyEvidence: PartnershipTendencyEvidenceMap;
  contextFacts: PartnershipContextEvidenceMap;
}
```

### 6.4 Resolve signals

Each signal resolver must be pure where practical:

```ts
resolveMoneyPhilosophy(ctx): PartnershipSignalResult
resolveMentalLoad(ctx): PartnershipSignalResult
resolveDecisionPower(ctx): PartnershipSignalResult
```

### 6.5 Project experience

Projectors transform technical results into bounded semantic packages.

```ts
projectMoneyPhilosophy(signal, ctx): PartnershipExperienceProjection
```

### 6.6 Build narrative package

The narrative package combines multiple projections while preventing raw source leakage.

### 6.7 Generate and validate

The LLM receives only approved projection fields and must return schema-valid output.

### 6.8 Build view model

The view model decides presentation, not meaning.

---

# PART IV. Evidence Model

## 7. Evidence Unit

Canonical evidence unit:

```ts
type EvidenceSourceKind =
  | "psych_axis"
  | "pair_interaction"
  | "underlying_tendency"
  | "relationship_context"
  | "derived_pattern";

interface PartnershipEvidenceUnit {
  id: string;
  sourceKind: EvidenceSourceKind;
  sourceKey: string;
  subject: "person_a" | "person_b" | "pair";
  direction?: "high" | "mid" | "low" | "mixed" | "unknown";
  normalizedValue?: number | null;
  reliability: "strong" | "moderate" | "limited";
  supports: string[];
  contradicts?: string[];
  userVisible: false;
}
```

### 7.1 Evidence must remain inspectable

Every non-null signal must be traceable to:

- at least one evidence unit
- resolver version
- rule or threshold
- directionality

### 7.2 Derived evidence cannot become self-supporting

A derived pattern may summarize multiple source units, but it cannot be counted as an independent corroborating source when calculating confidence.

### 7.3 Contradiction is first-class

If sources disagree, the system must preserve disagreement.

Do not flatten contradictory evidence into false certainty.

---

## 8. Confidence Model

Canonical tiers:

```ts
type EvidenceConfidence =
  | "corroborated"
  | "refined"
  | "tentative"
  | "insufficient";
```

### 8.1 Corroborated

Use when:

- two or more independent evidence families support the same direction, and
- no strong contradiction exists

Narrative behavior:

- direct but non-deterministic
- no excessive hedging

### 8.2 Refined

Use when:

- primary behavioral evidence is clear
- another source modifies context, intensity, or mechanism

Narrative behavior:

- describe present behavior first
- describe underlying tendency only as nuance

### 8.3 Tentative

Use when:

- only one limited source supports the signal, or
- evidence is mixed but still useful as a hypothesis

Narrative behavior:

- use “may,” “can,” “in some situations,” or equivalent
- avoid categorical claims

### 8.4 Insufficient

Use when:

- evidence is absent
- direction cannot be resolved
- contradictions make the result unusable

Behavior:

- omit the signal or use a neutral fallback
- never ask the LLM to fill the gap

---

## 9. Severity Model

Confidence and severity are separate.

```ts
type PartnershipSeverity =
  | "strength"
  | "difference"
  | "friction"
  | "strain"
  | "structural_risk";
```

### 9.1 Strength

A constructive pair pattern with no material cost identified.

### 9.2 Difference

A meaningful mismatch that is not inherently harmful.

### 9.3 Friction

A recurring source of misunderstanding or operational burden.

### 9.4 Strain

A pattern likely to create resentment, withdrawal, repeated escalation, or unequal burden if unmanaged.

### 9.5 Structural risk

Reserved for high-stakes domain incompatibility or coercive implications supported by strong evidence.

The system must not label ordinary personality differences as structural risk.

---

# PART V. Behavioral Axis Access

## 10. Canonical 11-Axis Map

The Partnership engine may use the existing 11 behavioral axes:

```ts
type PsychAxisKey =
  | "stimulation"
  | "self_control"
  | "practicality"
  | "structure"
  | "empathy"
  | "conflict_style"
  | "resilience"
  | "recognition"
  | "energy_style"
  | "thinking_style"
  | "decision_style";
```

### 10.1 Axis adapter rule

Do not read raw JSON shapes throughout resolvers.

Use one canonical adapter:

```ts
interface PartnershipAxisAccessor {
  getPersonAxis(person: "a" | "b", key: PsychAxisKey): AxisValue | null;
  getPairAxis(key: PsychAxisKey): PairAxisEvidence | null;
}
```

### 10.2 No axis equals a verdict

A single axis must not directly produce a relationship conclusion.

Examples:

- low structure does not mean irresponsible
- high practicality does not mean emotionally cold
- high empathy does not mean healthy boundaries
- high self-control does not mean suppressed emotion

Signals should generally use at least two related inputs or one direct pair-interaction source.

---

# PART VI. Signal Registry

## 11. Canonical Signal Contract

```ts
interface PartnershipSignalDefinition {
  key: PartnershipSignalKey;
  version: string;
  purpose: string;
  eligibility: PartnershipEligibilityRule;
  inputs: PartnershipInputDependency[];
  resolver: string;
  confidencePolicy: string;
  severityPolicy: string;
  projector: string;
  uiTargets: PartnershipUiTarget[];
  fallbackPolicy: PartnershipFallbackPolicy;
}

interface PartnershipSignalResult<TState = string> {
  key: PartnershipSignalKey;
  state: TState | null;
  direction?: PartnershipDirection | null;
  confidence: EvidenceConfidence;
  severity: PartnershipSeverity | null;
  evidenceIds: string[];
  contradictionIds?: string[];
  subject?: "person_a" | "person_b" | "pair";
  metadata?: Record<string, unknown>;
}
```

### 11.1 Required fields for every signal

Every signal definition must document:

1. Purpose
2. User question answered
3. Eligibility
4. Inputs
5. Resolver logic
6. State enum
7. Confidence rules
8. Severity rules
9. Evidence output
10. Projection rules
11. UI use
12. Fallback
13. Safety notes
14. Tests

---

## 12. Launch Signal Inventory

### Core emotional bridge

- `choice_signature`
- `couple_identity`
- `love_translation_gap`
- `partner_kick_point_a`
- `partner_kick_point_b`
- `couple_kick_point`

### Shared-life operations

- `reliability_pattern`
- `household_rhythm`
- `mental_load_distribution`
- `money_philosophy`
- `decision_power`
- `energy_rest_fit`
- `career_sacrifice_pattern`
- `shared_leisure_fit`

### Relationship stress

- `strength_stress_flip_a`
- `strength_stress_flip_b`
- `primary_conflict_loop`
- `repair_pathway`

### Long-term direction

- `shared_life_direction`
- `family_boundary_pattern`
- `parenting_alignment`
- `daily_ritual_fit`
- `long_term_growth_path`

### 12.1 Launch priority

P0 — required for first viable premium report:

- choice signature
- couple identity
- love translation gap
- reliability
- household rhythm
- mental load
- money philosophy
- decision power
- primary conflict loop
- repair pathway
- partner kick points
- shared life direction

P1 — recommended for complete launch:

- energy and rest
- career and sacrifice
- family boundaries
- daily rituals
- couple kick point
- long-term growth

P2 — conditional or later:

- parenting alignment
- shared leisure
- advanced crisis management
- aging and caregiving
- relationship timeline

---

# PART VII. Signal Specifications

## 13. Choice Signature

### Purpose

Explain the credible qualities that may have made each partner meaningful to the other.

### Inputs

- empathy
- recognition
- energy style
- decision style
- practicality
- pair complementarity evidence
- Romantic-derived evidence, if canonical and available

### State model

```ts
type ChoiceSignatureState =
  | "mutual_recognition"
  | "stability_and_vitality"
  | "shared_momentum"
  | "safe_difference"
  | "practical_trust"
  | "mixed";
```

### Rules

- Must contain reciprocal value, not one-sided admiration only
- Must not claim exact historical reasons unless user-provided
- Must not say “you fell in love because” as fact
- Prefer “one reason this bond may have felt meaningful”

### UI

- opening summary
- narrative chapter 1
- no score badge

---

## 14. Couple Identity

### Purpose

Describe who the pair tends to become together.

### Inputs

- pair axis interactions
- complementary or amplifying patterns
- energy, structure, practicality, empathy, decision style

### State model

```ts
type CoupleIdentityState =
  | "builders"
  | "stabilizers"
  | "explorers"
  | "protectors"
  | "adaptive_team"
  | "high_intensity_pair"
  | "mixed_identity";
```

### Rules

- State is an internal narrative family, not a public permanent label
- Public copy should describe behavior rather than naming an archetype unless UX explicitly supports it
- Include both contribution and cost

---

## 15. Reliability Pattern

### Purpose

Explain how promises, responsibilities, and follow-through are distributed and experienced.

### Inputs

- structure
- practicality
- self-control
- decision style
- pair evidence about execution and consistency

### State model

```ts
type ReliabilityState =
  | "mutually_consistent"
  | "different_methods_same_followthrough"
  | "planner_and_responder"
  | "asymmetric_followthrough"
  | "shared_inconsistency"
  | "unclear";
```

### Resolver requirements

- distinguish visible execution from planning labor
- distinguish flexibility from unreliability
- distinguish intention from completion
- preserve A/B direction when asymmetric

### UI

- shared-life card
- ownership matrix input
- action recommendation

---

## 16. Household Rhythm

### Purpose

Explain how the pair may coordinate routine, order, timing, and standards.

### Inputs

- structure
- practicality
- energy style
- self-control
- context: living together

### State model

```ts
type HouseholdRhythmState =
  | "aligned_structured"
  | "aligned_flexible"
  | "different_standards"
  | "different_timing"
  | "manager_helper_risk"
  | "chaotic_load_risk"
  | "not_applicable";
```

### Rules

- Do not infer gendered chore ownership
- Do not call the more structured partner controlling by default
- Do not call the less structured partner lazy
- If not living together, phrase as future shared-life tendency

---

## 17. Mental Load Distribution

### Purpose

Surface invisible planning, remembering, anticipating, and emotional coordination.

### Inputs

- structure
- empathy
- recognition
- practicality
- self-control
- decision style
- reliability pattern

### State model

```ts
type MentalLoadState =
  | "shared_visible_load"
  | "split_by_domain"
  | "planner_executor_split"
  | "invisible_manager_a"
  | "invisible_manager_b"
  | "mutual_underrecognition"
  | "unclear";
```

### Resolver rules

- Mental load cannot be resolved from structure alone
- Recognition must affect burden visibility
- Execution without anticipation is not equivalent to shared ownership
- Anticipation without delegation may still create control pressure

### Required projection

```text
What is carried
→ Who notices it
→ Who completes it
→ Who feels responsible if it fails
→ Whether that labor is recognized
```

---

## 18. Money Philosophy

### Purpose

Explain the emotional and operational meaning of money for the pair.

### Inputs

- practicality
- self-control
- structure
- stimulation
- decision style
- recognition
- relationship context: shared finances

### State model

```ts
type MoneyPhilosophyState =
  | "shared_security"
  | "shared_flexibility"
  | "security_vs_experience"
  | "control_vs_autonomy"
  | "planner_vs_spontaneous"
  | "unequal_visibility"
  | "unclear";
```

### Required distinctions

- spending vs saving
- security vs enjoyment
- transparency vs privacy
- planning vs spontaneity
- equal contribution vs equitable contribution
- control vs stewardship

### Safety rule

The system must not normalize financial coercion, surveillance, or deprivation as a personality difference.

### UI

- paired continuum
- tension/strength card
- discussion prompt

---

## 19. Decision Power

### Purpose

Explain how the pair reaches decisions and how influence is distributed.

### Inputs

- decision style
- thinking style
- self-control
- recognition
- conflict style
- practicality

### State model

```ts
type DecisionPowerState =
  | "shared_consensus"
  | "domain_leadership"
  | "fast_slow_pair"
  | "one_leads_one_defers"
  | "mutual_deadlock"
  | "covert_power_imbalance"
  | "unclear";
```

### Rules

- Different speed is not automatically unequal power
- Deference is not automatically consent
- Repeated unilateral control must be separated from efficient role division
- Public prose must avoid diagnosing coercion without sufficient evidence

---

## 20. Energy and Rest Fit

### Purpose

Explain how the pair handles activity, social energy, downtime, and recovery.

### Inputs

- energy style
- stimulation
- resilience
- self-control

### State model

```ts
type EnergyRestState =
  | "matched_high_energy"
  | "matched_low_stimulation"
  | "complementary_pacing"
  | "social_energy_gap"
  | "rest_mismatch"
  | "overextension_risk"
  | "unclear";
```

### Rules

- Introversion is not emotional unavailability
- Extraversion is not irresponsibility
- Rest needs must not be framed as lack of love

---

## 21. Career and Sacrifice Pattern

### Purpose

Explain how ambition, opportunity, mobility, and sacrifice may be negotiated.

### Inputs

- growth-related primary axes if available
- practicality
- decision style
- recognition
- resilience
- structure
- energy style

### State model

```ts
type CareerSacrificeState =
  | "mutual_advancement"
  | "alternating_priority"
  | "stable_anchor_and_risk_taker"
  | "unspoken_sacrifice_a"
  | "unspoken_sacrifice_b"
  | "competing_ambitions"
  | "unclear";
```

### Rules

- Do not assume one career should dominate
- Do not convert income into relational value
- Recognition of sacrifice is a required analytic dimension

---

## 22. Family Boundary Pattern

### Purpose

Explain how the pair protects the partnership while relating to parents, relatives, and cultural obligations.

### Inputs

- empathy
- recognition
- conflict style
- self-control
- decision style
- structure
- family-related pair signals if available

### State model

```ts
type FamilyBoundaryState =
  | "united_flexible_boundary"
  | "strong_unit_boundary"
  | "different_obligation_levels"
  | "avoidance_vs_involvement"
  | "loyalty_conflict_risk"
  | "unclear";
```

### Rules

- Cultural obligation must not be labeled dysfunction
- Strong family connection must not be labeled enmeshment without evidence
- The key question is whether the pair can negotiate and protect mutual consent

---

## 23. Parenting Alignment

### Eligibility

Run only when:

- the user states they have children, or
- they state they are planning children, or
- the product explicitly presents a future hypothetical module

### Inputs

- empathy
- structure
- self-control
- conflict style
- recognition
- decision style
- energy style

### State model

```ts
type ParentingAlignmentState =
  | "aligned_guidance"
  | "protection_vs_autonomy"
  | "structure_vs_flexibility"
  | "different_discipline_thresholds"
  | "parenting_role_imbalance_risk"
  | "unclear"
  | "not_applicable";
```

### Absolute prohibitions

- fertility prediction
- number or gender of children
- child personality prediction
- child success prediction
- claims that children will save or damage the relationship

---

## 24. Love Translation Gap

### Purpose

Explain how care is offered, how it is interpreted, and where love becomes invisible.

### Inputs

- empathy
- recognition
- practicality
- expression-related Romantic signals if canonical
- reliability
- energy style

### State model

```ts
type LoveTranslationState =
  | "action_to_words_gap"
  | "words_to_reliability_gap"
  | "presence_to_space_gap"
  | "problem_solving_to_empathy_gap"
  | "recognition_mismatch"
  | "well_translated"
  | "mixed";
```

### Canonical projection

```text
A tends to offer care through X
B is most likely to recognize care through Y
When stress rises, X may fail to register as Y
The repair is not “love more,” but “make care legible”
```

---

## 25. Strength–Stress Flip

### Purpose

Show how a valued trait may become costly under pressure.

### Contract

```ts
interface StrengthStressFlip {
  subject: "person_a" | "person_b";
  strength: string;
  stressCondition: string;
  flip: string;
  partnerExperience: string;
  adjustment: string;
  confidence: EvidenceConfidence;
}
```

### Rules

- Strength and cost must be causally related
- Do not invent trauma explanations
- Adjustment must preserve the strength rather than demand personality erasure

---

## 26. Primary Conflict Loop

### Purpose

Identify the recurring interaction cycle rather than the “difficult person.”

### Supported loop families

```ts
type ConflictLoopFamily =
  | "pursue_withdraw"
  | "control_resistance"
  | "overfunction_underfunction"
  | "logic_emotion_mismatch"
  | "escalate_freeze"
  | "mutual_avoidance"
  | "unclear";
```

### Required directional contract

```ts
interface ConflictLoopProjection {
  trigger: string;
  moveA: string;
  interpretationB: string;
  moveB: string;
  interpretationA: string;
  escalation: string;
  interruptionPoint: string;
}
```

### Rules

- Must preserve who does what first only when evidence supports direction
- Otherwise describe a symmetric loop
- Never imply one partner causes the entire loop

---

## 27. Repair Pathway

### Purpose

Explain the pair’s most plausible route back to connection.

### Inputs

- conflict style
- empathy
- resilience
- self-control
- recognition
- decision style
- existing recovery-speed signals if canonical

### State model

```ts
type RepairPathwayState =
  | "talk_then_settle"
  | "settle_then_talk"
  | "action_based_repair"
  | "verbal_reassurance_repair"
  | "structured_repair"
  | "slow_reentry"
  | "repair_mismatch"
  | "unclear";
```

### Required stages

```text
De-escalation
→ Re-entry
→ Recognition
→ Responsibility
→ Practical repair
→ Prevention
```

### Rules

- Apology alone is not repair
- Time alone is not repair
- Problem-solving before emotional re-entry may fail for some pairs
- Emotional validation without practical follow-through may fail for others

---

## 28. Partner Kick Point

### Purpose

Provide an evidence-grounded reminder of what makes the partner deeply valuable during stress.

### Contract

```ts
interface PartnerKickPointSignal {
  subject: "person_a" | "person_b";
  gift: string;
  livedExpression: string;
  easyToForgetWhen: string;
  reminder: string;
  evidenceIds: string[];
  confidence: EvidenceConfidence;
}
```

### Rules

- Must be specific to evidence
- Must not be generic praise
- Must not excuse harmful behavior
- Must not use fate, soulmate, or permanent-loyalty claims
- Must be emotionally resonant but technically traceable

### Bad implementation

```text
They are your destiny and will always protect you.
```

### Good implementation direction

```text
When plans become uncertain, this partner often helps turn anxiety into the next practical step. During conflict, that steadiness can look emotionally quiet—but it is also one of the ways they keep the shared life from falling apart.
```

---

## 29. Shared Life Direction

### Purpose

Classify how the pair’s major life priorities relate.

### Dimensions

- stability
- freedom
- growth
- family involvement
- money use
- career ambition
- place and mobility
- children
- lifestyle intensity
- retirement or long-term pace

### State model

```ts
type SharedLifeDirectionState =
  | "shared_direction"
  | "same_goal_different_route"
  | "negotiable_difference"
  | "structural_tension"
  | "insufficient_context";
```

### Rules

- Structural tension requires a real life-domain conflict, not an axis difference alone
- Context-free inference must remain tentative
- Do not predict the outcome of unresolved differences

---

# PART VIII. Signal Resolution Architecture

## 30. Resolver Shape

Preferred resolver contract:

```ts
interface PartnershipSignalResolver<TState> {
  key: PartnershipSignalKey;
  resolve(
    ctx: PartnershipEvidenceContext,
    deps: PartnershipResolvedSignalMap
  ): PartnershipSignalResult<TState>;
}
```

### 30.1 Resolver dependency rules

- Dependencies must be explicit
- Circular signal dependencies are forbidden
- A synthesis signal may depend on lower-level signals
- Lower-level signals may not depend on narrative output

### 30.2 Recommended dependency layers

```text
Layer 0 — source evidence
Layer 1 — person-level tendencies
Layer 2 — pair operational signals
Layer 3 — interaction loops
Layer 4 — synthesis signals
Layer 5 — narrative chapters
```

---

## 31. Registry Execution Order

Recommended order:

```text
1. source normalization
2. axis evidence
3. pair difference/complement evidence
4. reliability
5. household rhythm
6. mental load
7. money philosophy
8. decision power
9. energy/rest
10. career/sacrifice
11. family boundaries
12. parenting, when eligible
13. love translation
14. strength-stress flips
15. conflict loop
16. repair pathway
17. choice signature
18. couple identity
19. partner kick points
20. shared life direction
21. final synthesis
```

This order may be adapted to existing repository conventions, but dependency direction must remain acyclic.

---

## 32. Threshold Policy

Exact thresholds must be audited against existing psych-axis semantics.

General rules:

- no threshold should be introduced without fixture review
- use bands rather than false precision
- preserve neutral middle zones
- distinguish absolute level from pair gap
- distinguish gap magnitude from gap direction

Example pattern only:

```ts
function classifyAxis(value: number | null): "low" | "mid" | "high" | null {
  if (value == null) return null;
  if (value <= LOW_MAX) return "low";
  if (value >= HIGH_MIN) return "high";
  return "mid";
}
```

Pair gap example:

```ts
interface PairGap {
  magnitude: "small" | "moderate" | "large";
  direction: "a_higher" | "b_higher" | "none";
}
```

Do not publish raw axis numbers unless a separate product decision explicitly approves them.

---

# PART IX. Projection Layer

## 33. Experience Projection Contract

```ts
interface PartnershipExperienceProjection {
  signalKey: PartnershipSignalKey;
  headlineSeed: string;
  coreMeaning: string;
  personAExperience?: string;
  personBExperience?: string;
  sharedStrength?: string;
  stressCost?: string;
  misunderstanding?: string;
  adjustment?: string;
  discussionPrompt?: string;
  confidence: EvidenceConfidence;
  severity: PartnershipSeverity | null;
  prohibitedClaims?: string[];
}
```

### 33.1 Projection must be source-jargon free

No raw internal terminology should enter the narrative package.

### 33.2 Projection must be bounded

Each field should express one semantic role.

Avoid passing a large unstructured paragraph that lets the LLM reinterpret the relationship.

### 33.3 Directional symmetry

When A/B are reversed in fixtures, direction-sensitive projections must reverse consistently.

When the relationship meaning is symmetric, copy should remain semantically equivalent.

---

## 34. Narrative Package

```ts
interface PartnershipNarrativePackage {
  product: "partnership";
  locale: SupportedLocale;
  names: {
    personA: string;
    personB: string;
  };
  context: NormalizedRelationshipContext;
  opening: PartnershipOpeningProjection;
  chapters: PartnershipChapterProjection[];
  modules: PartnershipExperienceProjection[];
  safety: PartnershipSafetyContext;
  style: PartnershipNarrativeStyleContract;
  version: string;
}
```

### 34.1 Raw evidence exclusion

The LLM package should not contain:

- raw birth data
- source-specific technical labels
- raw psych JSON
- unused axes
- hidden thresholds
- internal resolver comments

---

# PART X. Narrative Generation Contract

## 35. LLM Input Rules

The LLM prompt must state:

- all classifications are already decided
- do not add new classifications
- do not infer relationship history
- do not predict the future
- do not diagnose
- do not use source jargon
- do not assign blame
- do not turn differences into incompatibility
- do not promise relationship success
- do not excuse coercion or abuse
- preserve directionality
- use confidence-aware language
- keep advice proportional to evidence

---

## 36. LLM Output Schema

```ts
interface PartnershipNarrativeOutput {
  opening: {
    headline: string;
    body: string;
  };
  chapters: Array<{
    key: PartnershipChapterKey;
    headline: string;
    body: string;
    callout?: string;
  }>;
  modules: Array<{
    signalKey: PartnershipSignalKey;
    headline: string;
    body: string;
    action?: string;
  }>;
  closing: {
    headline: string;
    body: string;
  };
}
```

### 36.1 Schema validation

Reject or repair output when:

- required sections are missing
- unknown signal keys appear
- partner direction is reversed
- prohibited language appears
- unsupported predictions appear
- output exceeds length budget
- Korean or English language leaks occur against locale

---

## 37. Prompt Composition

Recommended prompt layers:

```text
System law
↓
Product law
↓
Locale and voice law
↓
Safety law
↓
Narrative package
↓
Strict output schema
```

### 37.1 No prompt-owned business logic

Do not encode core resolver thresholds only inside prompts.

Business logic must live in deterministic code and tests.

### 37.2 No excerpt rewriting

The LLM should synthesize structured projections, not rewrite raw evidence excerpts.

### 37.3 Multi-source synthesis

For major chapter insights, require at least two supplied projections where possible.

If only one tentative projection supports a statement, the language must remain narrow.

---

# PART XI. Report Architecture

## 38. Canonical Report Sections

```ts
type PartnershipChapterKey =
  | "opening_summary"
  | "why_you_chose_each_other"
  | "who_you_become_together"
  | "how_you_run_real_life"
  | "where_love_gets_lost"
  | "remember_this_person"
  | "life_direction"
  | "how_you_repair"
  | "growing_together"
  | "why_this_is_still_your_person";
```

### 38.1 Required launch structure

1. Opening summary
2. Why you chose each other
3. Who you become together
4. How you run a real life
5. Where love gets lost
6. Remember this person
7. Life direction
8. How you repair
9. Growing together
10. Closing reminder

### 38.2 Conditional sections

- parenting alignment
- family boundaries
- cohabitation-specific planning
- shared-finance language

### 38.3 Omission is preferable to fabrication

If a conditional section lacks eligibility or evidence, omit it cleanly.

---

# PART XII. View Model and UI

## 39. View Model Contract

```ts
interface PartnershipReportViewModel {
  hero: PartnershipHeroViewModel;
  digest: PartnershipDigestViewModel;
  chapters: PartnershipChapterViewModel[];
  modules: PartnershipModuleViewModel[];
  visualizations: PartnershipVisualizationViewModel[];
  actions: PartnershipActionViewModel[];
  metadata: PartnershipReportMetadata;
}
```

### 39.1 UI must not consume raw signals directly

UI receives presentation-safe values only.

### 39.2 Stable keys

All cards and sections require stable semantic keys for:

- localization
- analytics
- regression tests
- future migrations

---

## 40. Digest Architecture

Recommended digest items:

- couple strength
- shared-life operating pattern
- main love translation gap
- primary conflict loop
- strongest repair pathway
- partner kick point
- shared life direction

Digest rules:

- maximum 5–7 primary items
- no duplicate insight across cards
- no false total score
- badges reflect deterministic signal state only
- no badge for emotionally nuanced prose that has no safe classification

---

## 41. Visualization Contracts

### 41.1 Ownership matrix

Use for:

- planning
- execution
- remembering
- emotional coordination
- decision ownership

Do not imply actual household assignment unless context exists. When context is inferred, label as a tendency, not fact.

### 41.2 Paired continua

Use for:

- security ↔ flexibility
- fast decision ↔ deliberation
- social activity ↔ quiet recovery
- structure ↔ spontaneity

Do not reduce complex modules to one axis when multiple inputs matter.

### 41.3 Couple loop diagram

Required nodes:

```text
Trigger
→ A move
→ B interpretation
→ B move
→ A interpretation
→ escalation
→ interruption point
```

### 41.4 Strength-to-cost flip

```text
Strength
→ Stress condition
→ Cost
→ Partner experience
→ Adjustment
```

### 41.5 Life direction map

Display only categories supported by context and signal confidence.

---

# PART XIII. Localization

## 42. Locale Contract

Supported launch locales should follow the repository’s canonical locale list.

At minimum, if current product policy remains unchanged:

```ts
type SupportedLocale = "ko-KR" | "en-US";
```

### 42.1 Locale must be explicit

The production route must resolve and pass locale explicitly.

Omitted-locale behavior in internal tests must preserve the repository’s documented legacy fallback.

### 42.2 No language leaks

Validation must catch:

- Korean prose in English output
- English headings in Korean output unless approved branding
- untranslated enum values
- source jargon in either language

### 42.3 Equivalent meaning, not literal translation

Korean and English copy should preserve:

- confidence
- warmth
- directionality
- severity
- blame neutrality

Exact sentence structure may differ.

---

# PART XIV. Safety

## 43. Safety Boundary

The Partnership product is not an abuse detector, but it must not romanticize harmful control.

Potential safety-sensitive signals include:

- financial coercion
- isolation from family or support
- intimidation
- unilateral control
- chronic fear
- retaliation

### 43.1 Safety handling

When explicit user-provided context indicates danger:

- do not frame it as a compatibility issue
- do not recommend better communication as the sole solution
- route to the platform’s safety response policy

### 43.2 Inferred patterns remain bounded

Axis differences alone cannot establish abuse, coercion, or clinical pathology.

---

## 44. Prohibited User-Facing Language

The validator should detect or block variants of:

- destined
- soulmate
- guaranteed
- will divorce
- will stay together forever
- toxic person
- narcissist
- psychopath
- bad wife / bad husband
- natural household role by gender
- fertility prediction
- child success prediction
- exact future timing
- traditional technical fortune-telling terms

Korean equivalents must be included in the locale-specific prohibited lexicon.

---

# PART XV. Fallback Architecture

## 45. Deterministic Fallbacks

Every core signal must have a fallback policy.

```ts
type PartnershipFallbackPolicy =
  | "omit"
  | "neutral_copy"
  | "deterministic_template"
  | "chapter_degrade"
  | "report_fail";
```

### 45.1 Omit

Use for optional modules with insufficient evidence.

### 45.2 Neutral copy

Use when a module must remain visible but direction is unresolved.

### 45.3 Deterministic template

Use when LLM output fails validation but signal meaning is available.

### 45.4 Chapter degrade

Use when one or more modules fail but the chapter can be built from remaining projections.

### 45.5 Report fail

Use only when core input integrity or locale safety fails.

---

# PART XVI. Validation

## 46. Signal Validation

Validate:

- key exists in registry
- state belongs to enum
- evidence IDs exist
- confidence matches evidence policy
- severity is allowed for state
- direction matches evidence
- conditional eligibility is respected

## 47. Projection Validation

Validate:

- no raw source jargon
- no unsupported certainty
- no missing partner direction
- no blame assignment
- adjustment exists for friction or worse
- kick points are specific
- conflict loop has an interruption point

## 48. Narrative Validation

Validate:

- schema
- locale
- prohibited terms
- section length
- duplicate sentences
- signal-key coverage
- direction consistency
- confidence language
- no new unsupported facts

---

# PART XVII. Testing Strategy

## 49. Unit Tests

Required unit-test classes:

### 49.1 Axis adapter tests

- missing psych
- partial psych
- exact boundary values
- locale-independent extraction

### 49.2 Resolver tests

For every signal:

- high/high
- low/low
- high/low
- low/high
- middle/null
- contradictory evidence
- missing context
- reversed A/B symmetry

### 49.3 Confidence tests

- corroborated requires independent evidence
- derived evidence does not double-count
- contradiction downgrades confidence
- insufficient evidence yields null or fallback

### 49.4 Eligibility tests

- parenting hidden when not eligible
- cohabitation language conditional
- shared-finance wording conditional

---

## 50. Integration Tests

Required flows:

1. Complete psych + pair evidence
2. Psych only
3. Underlying tendency only
4. Mixed evidence with contradiction
5. Missing one partner psych
6. Korean locale
7. English locale
8. LLM timeout
9. LLM invalid schema
10. Prohibited phrase injection
11. A/B reversal fixture
12. Safety-sensitive context

---

## 51. Golden Narrative Tests

Golden tests should assert contracts, not freeze every sentence.

Assert:

- required sections exist
- no forbidden terms
- correct partner binding
- correct state meaning
- confidence-aware language
- kick point specificity
- no unsupported predictions
- no cross-locale leaks

Avoid asserting exact full prose unless the output is deterministic fallback copy.

---

## 52. Regression Fixtures

Create a compact canonical fixture set:

- aligned practical pair
- action-vs-empathy love gap
- pursue-withdraw pair
- control-resistance pair
- invisible mental-load imbalance
- security-vs-experience money difference
- strong family-boundary difference
- different decision speeds but equal power
- limited evidence pair
- contradictory psych vs tendency pair

Each fixture must document expected signal states and non-goals.

---

# PART XVIII. Observability

## 53. Structured Logging

Log without exposing sensitive raw source data:

- request ID
- product version
- locale
- input availability flags
- resolver versions
- emitted signal keys
- confidence counts
- omitted module keys
- LLM validation failures
- fallback usage
- latency by stage

### 53.1 Do not log

- raw birth data
- full psych profiles
- generated intimate narrative unless explicitly approved and protected
- partner names in analytics payloads

---

## 54. Quality Metrics

Recommended metrics:

- signal null rate
- signal contradiction rate
- fallback rate
- LLM schema failure rate
- prohibited-term block rate
- locale leak rate
- module completion rate
- duplicate-insight rate
- user expansion/click rate by module
- user correction or disagreement feedback

No metric should be interpreted as proof of relationship truth.

---

# PART XIX. Versioning

## 55. Version Domains

Track separately:

```ts
interface PartnershipVersionSet {
  productBlueprintVersion: string;
  technicalBlueprintVersion: string;
  resolverVersion: string;
  projectionVersion: string;
  promptVersion: string;
  schemaVersion: string;
  uiVersion: string;
}
```

### 55.1 Why separate versions

A copy change should not silently change resolver meaning.

A threshold change should be auditable independently from a UI change.

---

# PART XX. Repository Integration

## 56. Target Module Boundaries

Exact paths must follow audit findings, but the conceptual structure should resemble:

```text
lib/relationship/partnership/
  types/
  source/
  evidence/
  resolvers/
  projectors/
  narrative/
  validation/
  view-model/
  fixtures/
```

Possible conceptual files:

```text
partnershipTypes.ts
buildPartnershipSourceContext.ts
buildPartnershipEvidenceContext.ts
resolvePartnershipSignals.ts
partnershipSignalRegistry.ts
projectPartnershipExperience.ts
buildPartnershipNarrativePackage.ts
generatePartnershipNarrative.ts
validatePartnershipNarrative.ts
buildPartnershipReportViewModel.ts
```

These are target responsibilities, not mandatory filenames.

---

## 57. Reuse Policy

Reuse existing shared infrastructure for:

- psych-axis extraction
- pair comparison
- evidence source typing
- confidence typing
- locale resolution
- LLM invocation
- JSON schema validation
- report transport
- client-safe projection

Do not duplicate a shared helper merely to create a Partnership-prefixed version.

### 57.1 Product-specific ownership

Partnership should own:

- shared-life signal definitions
- shared-life resolver logic
- Partnership narrative chapter assembly
- Partnership-specific projection copy seeds
- Partnership-specific UI mappings

---

# PART XXI. API Contract

## 58. API Response Shape

Target response:

```ts
interface PartnershipAnalysisResponse {
  kind: "partnership";
  version: PartnershipVersionSet;
  report: PartnershipReportViewModel;
  metadata: {
    locale: SupportedLocale;
    generatedAt: string;
    fallbackUsed: boolean;
    omittedModules: PartnershipSignalKey[];
  };
}
```

### 58.1 Client-safe rule

Never return:

- raw source context
- hidden thresholds
- internal evidence IDs unless specifically needed for debug tooling
- prompt text
- model chain-of-thought
- traditional source terminology

---

# PART XXII. Performance and Reliability

## 59. Performance Budget

Recommended stage budgets should be set after profiling.

Design targets:

- deterministic resolution should be fast and cacheable
- LLM should receive a compact package
- optional modules should not force separate LLM calls unless quality requires it
- fallback report must remain available when generation fails

### 59.1 Caching

Potential cache keys:

- normalized pair fingerprint
- product version
- resolver version
- locale
- context eligibility hash

Do not cache across materially different relationship context.

---

# PART XXIII. Implementation Batches

## 60. Batch A — Audit and Contracts

Deliverables:

- repository audit
- exact input path
- exact existing shared helpers
- canonical type additions
- signal registry skeleton
- no narrative tuning

Exit criteria:

- architecture confirmed against repository
- no duplicate engine introduced
- file plan approved

---

## 61. Batch B — Evidence and Core Operations

Implement:

- source context
- evidence context
- reliability
- household rhythm
- mental load
- money philosophy
- decision power

Exit criteria:

- deterministic tests pass
- A/B reversal tests pass
- null handling passes

---

## 62. Batch C — Emotional Bridge and Conflict

Implement:

- love translation gap
- strength-stress flips
- primary conflict loop
- repair pathway
- choice signature
- couple identity

Exit criteria:

- no LLM classification
- direction binding verified
- conflict loop does not blame one partner

---

## 63. Batch D — Kick Point and Long-Term Direction

Implement:

- partner kick points
- couple kick point
- shared life direction
- family boundaries
- conditional parenting
- daily ritual and growth projections

Exit criteria:

- kick points are evidence-grounded
- future language remains non-predictive
- eligibility tests pass

---

## 64. Batch E — Narrative and UI

Implement:

- narrative package
- prompt contract
- output schema
- validation
- fallback copy
- report view model
- digest
- visualizations

Exit criteria:

- bilingual tests pass
- LLM failure degrades safely
- UI receives no raw analytical objects

---

## 65. Batch F — Product Readiness

Complete:

- end-to-end fixtures
- golden contract tests
- analytics hooks
- accessibility review
- copy review
- safety review
- performance review
- migration notes

Exit criteria:

- product matches `05E`
- no visible source jargon
- no unsupported deterministic verdict
- report remains useful under partial data

---

# PART XXIV. Implementation Readiness Checklist

## 66. READY TO IMPLEMENT only when

- [ ] `05E` is approved as product SSOT
- [ ] repository audit is complete
- [ ] product identifier and modes are confirmed
- [ ] input contract is mapped to actual existing types
- [ ] psych-axis access pattern is confirmed
- [ ] underlying tendency adapter is confirmed
- [ ] locale propagation is confirmed
- [ ] signal registry states are approved
- [ ] parenting eligibility is approved
- [ ] conflict and repair ownership are confirmed against Romantic reuse
- [ ] LLM schema and fallback behavior are approved
- [ ] exact file list is documented
- [ ] regression fixture plan is accepted

---

# PART XXV. Acceptance Criteria

## 67. Technical Acceptance

The implementation is acceptable when:

1. Every visible conclusion traces to deterministic evidence.
2. Current behavior overrides conflicting latent tendency.
3. The LLM cannot reverse partner direction or create signal states.
4. Missing evidence results in omission or neutral fallback.
5. No user-facing source jargon appears.
6. No compatibility score or fate verdict appears.
7. Money, labor, and power are not reduced to personality clichés.
8. Gender roles are never assumed.
9. Parenting is conditional and non-predictive.
10. Conflict is represented as a loop, not a villain.
11. Kick points are specific, emotionally useful, and evidence-grounded.
12. Korean and English output preserve equivalent meaning.
13. LLM failure still produces a safe usable report.
14. UI consumes a stable client-safe view model.
15. Resolver, projection, prompt, and UI versions remain auditable.

---

# PART XXVI. Failure Modes

## 68. Architecture Failure Modes

- duplicating shared relationship infrastructure
- embedding thresholds in prompts
- allowing UI components to recompute signals
- passing raw profiles to the LLM
- coupling report generation directly to source-specific jargon
- circular signal dependencies

## 69. Product Failure Modes

- treating Partnership as household management only
- copying Romantic prose without shared-life reinterpretation
- generic praise in Kick Point
- calling differences incompatibility
- hiding invisible labor
- normalizing unequal power
- making parenting or fertility predictions
- treating cultural family obligations as pathology

## 70. Narrative Failure Modes

- saying “always” or “never” without basis
- assigning motives
- using one axis as a complete explanation
- over-hedging strong evidence
- overclaiming tentative evidence
- repeating the same insight across chapters
- giving generic communication advice unrelated to the signal

---

# PART XXVII. Final Engineering Thesis

The Partnership product is not a compatibility calculator and not an LLM essay generator.

It is a structured translation system.

```text
Behavioral Evidence
+
Pair Interaction
+
Underlying Tendency, when useful
+
Declared Shared-Life Context
↓
Deterministic Relationship Signals
↓
Evidence-Grounded Experience Projections
↓
Guarded Narrative Synthesis
↓
Client-Safe Shared-Life Report
```

The engineering goal is not to make the system sound certain.

The goal is to make it:

- traceable
- behaviorally credible
- emotionally recognizable
- operationally useful
- safe under uncertainty
- reusable across future shared-life features

> **The deterministic system decides what is supported. The narrative system explains why it matters. The UI helps the couple see what to do with it.**

---

# Appendix A. Canonical Signal Key Draft

```ts
type PartnershipSignalKey =
  | "choice_signature"
  | "couple_identity"
  | "reliability_pattern"
  | "household_rhythm"
  | "mental_load_distribution"
  | "money_philosophy"
  | "decision_power"
  | "energy_rest_fit"
  | "career_sacrifice_pattern"
  | "shared_leisure_fit"
  | "family_boundary_pattern"
  | "parenting_alignment"
  | "love_translation_gap"
  | "strength_stress_flip_a"
  | "strength_stress_flip_b"
  | "primary_conflict_loop"
  | "repair_pathway"
  | "partner_kick_point_a"
  | "partner_kick_point_b"
  | "couple_kick_point"
  | "shared_life_direction"
  | "daily_ritual_fit"
  | "long_term_growth_path";
```

---

# Appendix B. Canonical UI Target Draft

```ts
type PartnershipUiTarget =
  | "hero"
  | "digest_badge"
  | "chapter"
  | "module_card"
  | "paired_continuum"
  | "ownership_matrix"
  | "loop_diagram"
  | "strength_flip"
  | "life_direction_map"
  | "discussion_prompt"
  | "closing";
```

---

# Appendix C. Cross-Product Refactor Note

After Romantic, Friend, Work, Family, and Partnership technical blueprints are complete, review them together and extract genuinely shared rules into a platform-level Relationship Intelligence technical document.

Likely future shared candidates:

- evidence unit contract
- confidence policy
- severity ladder
- name and address law
- source-jargon stripping
- LLM ownership boundaries
- localization validation
- narrative schema validation
- client-safe projection
- safety escalation
- versioning and observability

Until that cross-product review is complete, this document remains locally complete enough to implement Partnership without depending on a future refactor.
