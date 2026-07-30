# 06A Romantic Technical Blueprint

**Document type:** Technical Constitution / Technical SSOT  
**Product:** Ahaitsme — Romantic Relationship Experience  
**Status:** Draft v1.0 for technical lock  
**Depends on:** `05A_Romantic_Product_Blueprint.md` · `04_Assessment_Philosophy.md`  
**Audience:** Engineering, Product, Design, Content Systems, QA, Data, Localization  
**Purpose:** Define how the Romantic product constitution is translated into a reliable, explainable, testable, localizable, and implementation-independent technical system.

---

## 0. Technical Manifesto

Ahaitsme Romantic is not an LLM report generator.

It is a relationship interpretation system.

The system must begin with structured evidence, derive relationship meaning through deterministic rules, and use language generation only to translate supported meaning into a human experience.

Constitutional assessment limits are owned by `04_Assessment_Philosophy.md`. This Technical Blueprint implements them for Romantic; it does not redefine them.

The technical system exists to protect four things:

1. **Truthfulness** — the product must not say more than the evidence supports.
2. **Product intent** — the experience must remain a story, not collapse into a dashboard or data dump.
3. **Traceability** — every meaningful user-facing conclusion must be explainable from known inputs and rules.
4. **Stability** — changes in prompts, models, UI, or storage must not silently change the identity of the product.

The canonical direction is:

```text
Raw Inputs
  → Canonical Person Models
  → Canonical Pair Model
  → Evidence Sources
  → Deterministic Relationship Judgments
  → Confidence / Severity / Provenance
  → Section Context Packages
  → Narrative Generation
  → Safe Projection
  → Experience Rendering
```

The LLM does not decide what the relationship is.

The LLM explains what the relationship engine has already established.

Technology serves the product constitution.

Technology does not redefine it.

---

# 1. Authority and Document Hierarchy

## 1.1 Authority order

When documents, code, prompts, or existing behavior conflict, use this order:

1. `05A_Romantic_Product_Blueprint.md`
2. `06A_Romantic_Technical_Blueprint.md`
3. approved Romantic data contracts and decision records
4. canonical deterministic resolvers
5. prompt contracts
6. rendering implementation
7. legacy behavior

The existing implementation is evidence of current behavior, not automatic product authority.

---

## 1.2 Product Blueprint vs Technical Blueprint

The Product Blueprint defines:

- what the experience is,
- what users should understand and feel,
- which questions the product must answer,
- what belongs to Romantic,
- and what the product must never become.

The Technical Blueprint defines:

- how evidence is created and preserved,
- how judgments are made,
- how stories are generated safely,
- how modules receive data,
- how the client renders the experience,
- and how correctness is tested.

If the technical system cannot produce the Product Blueprint faithfully, the technical system must change.

---

## 1.3 Implementation independence

This document does not require a specific:

- framework,
- model vendor,
- database,
- prompt framework,
- UI component library,
- or deployment platform.

The current implementation may use Next.js, TypeScript, server routes, cached JSON, and external language models. Those choices may evolve.

The contracts and laws in this document must remain stable across those changes.

---

# 2. System Definition

## 2.1 What the system does

The Romantic technical system converts two people’s structured inputs into a relationship experience with:

- recognizable relationship scenes,
- supported explanations,
- differentiated perspectives,
- confidence-aware language,
- transparent evidence views,
- practical repair guidance,
- and a coherent narrative journey.

---

## 2.2 What the system must not do

The system must not:

- invent relationship facts,
- infer unsupported life events,
- create compatibility grades,
- determine whether users should stay together,
- diagnose mental health conditions,
- convert uncertainty into certainty,
- allow the LLM to create new canonical classifications,
- expose internal technical labels as the main user experience,
- or allow UI convenience to replace product meaning.

---

## 2.3 Core technical objects

The system is organized around six object families:

### Person Model
Canonical evidence for one person.

### Pair Model
Canonical evidence created by comparing or combining two people.

### Evidence Item
A normalized, provenance-bearing observation that may support a relationship conclusion.

### Relationship Judgment
A deterministic statement about the pair, expressed as a bounded enum, direction, intensity, confidence, severity, and rationale.

### Section Context Package
The complete structured input supplied to one experience module or narrative generator.

### Render Projection
The client-safe representation used to render the final user experience.

---

# 3. End-to-End Architecture

## 3.1 Canonical flow

```text
Birth / Saju Inputs
Survey / Psych Inputs
Locale / Names / Relationship Context
        │
        ▼
Person Normalization
        │
        ▼
Pair Analysis
        │
        ├── Saju Pair Evidence
        ├── Psych Pair Evidence
        ├── Cross-source Signals
        └── Contextual Evidence
        │
        ▼
Canonical Relationship Engine
        │
        ├── axis judgments
        ├── relationship dynamics
        ├── alignment / mismatch
        ├── confidence
        ├── severity
        └── provenance
        │
        ▼
Experience Orchestrator
        │
        ├── section selection
        ├── section ordering
        ├── repetition control
        ├── evidence allocation
        └── narrative package construction
        │
        ▼
Narrative Layer
        │
        ├── deterministic copy where sufficient
        ├── LLM synthesis where useful
        └── fallback copy when generation fails
        │
        ▼
Validation / Guardrails
        │
        ├── schema validation
        ├── evidence trace validation
        ├── banned claim validation
        ├── locale validation
        └── product-law validation
        │
        ▼
Safe Client Projection
        │
        ▼
Story-first Rendering
```

---

## 3.2 Layer responsibilities

### Layer A — Input and normalization
Responsible for validating and normalizing user inputs. It must not create relationship narratives.

### Layer B — Analysis sources
Responsible for producing source-specific person and pair evidence.

### Layer C — Canonical relationship engine
Responsible for relationship judgments. This is the authoritative analytical layer.

### Layer D — Experience orchestration
Responsible for deciding which supported judgments belong in which product module and in what order.

### Layer E — Narrative generation
Responsible for language, scenes, transitions, and advice phrasing within strict evidence constraints.

### Layer F — Projection and rendering
Responsible for exposing only client-safe data and presenting it according to the Product Blueprint.

---

## 3.3 Separation of concerns

The following decisions must remain separate:

- **What is true** → relationship engine
- **How certain it is** → confidence system
- **How serious it is** → severity system
- **Where it belongs** → experience orchestrator
- **How it is expressed** → narrative layer
- **How it is visualized** → renderer

A prompt must never determine confidence.

A chart must never determine meaning.

A UI badge must never become the source of truth for a classification.

---

# 4. Canonical Source of Truth

## 4.1 Server authority

Canonical relationship judgments must be resolved on the server or in an equivalently trusted environment.

The client may:

- render,
- order approved projections,
- expand or collapse details,
- animate,
- and preserve navigation state.

The client must not:

- recompute relationship classifications,
- reinterpret thresholds,
- derive new confidence levels,
- combine evidence into new judgments,
- or generate canonical labels.

---

## 4.2 Single judgment, multiple projections

A relationship judgment may appear in several places:

- Hero signature,
- story body,
- evidence panel,
- comparison table,
- dialogue block,
- repair guide,
- or timeline.

These are projections of one canonical judgment, not separate interpretations.

Example:

```text
Canonical judgment: reassurance_signal = A_needs_explicit / B_gives_implicit

Possible projections:
- Hero: “사랑은 충분한데, 확인 방식이 다릅니다.”
- Story: a scene about one person asking and the other assuming
- Evidence: empathy / expression / connection signals
- Dialogue: “괜찮아” vs “나를 안심시켜줘”
- Guide: one explicit reassurance action
```

All projections must remain semantically aligned.

---

## 4.3 No duplicate classifiers

There must not be multiple independent implementations of the same classification in:

- server builders,
- API routes,
- prompts,
- client components,
- test fixtures,
- or localization files.

One canonical resolver owns the classification.

Other layers consume it.

---

## 4.4 Versioning

Every persisted or cached Romantic result must identify enough version information to prevent incompatible reuse.

Recommended minimum:

```ts
interface RomanticArtifactVersion {
  product_blueprint_version: string;
  relationship_engine_version: string;
  narrative_contract_version: string;
  projection_schema_version: string;
  locale: SupportedLocale;
  model_id?: string;
}
```

Cache identity must include locale and all versions that can materially change visible output.

---

# 5. Input Model

## 5.1 Input families

The system may consume:

- canonical Saju person models,
- canonical psych / survey models,
- pair-level Saju analysis,
- pair-level psych comparison,
- explicit user context,
- display names,
- relationship kind,
- language and locale,
- and entitlement / report depth.

Not every source must exist for every report.

Missing inputs must reduce confidence or module availability rather than cause fabricated completion.

---

## 5.2 Identity fields

Names are presentation inputs, not evidence.

They may be used to:

- bind speakers,
- avoid anonymous “A/B” prose,
- personalize transitions,
- and clarify direction.

They must not alter analytical judgments.

---

## 5.3 Locale

Locale must be explicit at the production boundary.

Required behavior:

- `en-US` produces English narrative and labels.
- `ko-KR` produces Korean narrative and labels.
- any legacy omitted-locale behavior must be documented and tested until fully removed.

The system must not silently switch languages inside one artifact.

---

## 5.4 Optional inputs

Optional inputs must be modeled explicitly.

Avoid truthy/falsy shortcuts where zero, neutral, empty, or unavailable have different meanings.

Recommended pattern:

```ts
type Availability<T> =
  | { status: "available"; value: T }
  | { status: "unavailable"; reason: string }
  | { status: "not_applicable" };
```

---

# 6. Evidence Architecture

## 6.1 Evidence principle

Evidence is not prose.

Evidence is a normalized, traceable support object.

Each evidence item must answer:

- What was observed?
- Which source produced it?
- Which person or pair direction does it concern?
- How strongly does it support the judgment?
- Is it independent corroboration or a restatement of the same source?

---

## 6.2 Evidence source families

### Saju person evidence
Examples:

- day-master tendencies,
- element balance,
- structural patterns,
- useful / challenging element interpretation where supported,
- person-level relational expression tendencies.

### Saju pair evidence
Examples:

- cross-pillar hits,
- stem interactions,
- branch interactions,
- pair balance patterns,
- combined-element observations,
- direction-sensitive pair dynamics.

### Psych person evidence
Examples:

- primary six axes,
- secondary eleven axes,
- confidence or completeness metadata,
- person-level response tendencies.

### Psych pair evidence
Examples:

- similarity,
- meaningful gap,
- complementary direction,
- mismatch direction,
- contextual amplification.

### Cross-source evidence
A relationship conclusion supported by independent Saju and psych evidence.

### Explicit context evidence
User-provided relationship context may personalize a story but must not be treated as inferred truth.

---

## 6.3 Evidence item contract

```ts
type EvidenceSourceKind =
  | "saju_person"
  | "saju_pair"
  | "psych_person"
  | "psych_pair"
  | "cross_source"
  | "user_context";

type EvidenceDirection =
  | "A"
  | "B"
  | "A_to_B"
  | "B_to_A"
  | "pair"
  | "symmetric";

interface RelationshipEvidenceItem {
  id: string;
  source_kind: EvidenceSourceKind;
  source_path: string;
  direction: EvidenceDirection;
  claim_key: string;
  polarity?: "supports" | "qualifies" | "contradicts";
  strength?: number;
  independence_group?: string;
  explanation_key?: string;
  debug_value?: unknown;
}
```

`debug_value` must not be projected to the client unless explicitly approved.

---

## 6.4 Independence rule

Two fields derived from the same upstream calculation do not automatically count as two independent sources.

Corroboration requires meaningful independence.

Example:

- `axis_results.empathy` and a sentence mechanically generated from that same empathy value are one source.
- Saju pair reassurance evidence plus psych empathy / expression evidence may be independent corroboration.

---

## 6.5 Contradictory evidence

The engine must preserve contradiction.

It must not discard inconvenient evidence merely to produce a clean story.

Possible outcomes:

- lower confidence,
- refined or conditional judgment,
- context-sensitive interpretation,
- two-mode explanation,
- or no user-facing claim.

The LLM must receive contradiction explicitly when it affects wording.

---

# 7. Canonical Relationship Judgments

## 7.1 Judgment contract

```ts
type EvidenceTier =
  | "corroborated"
  | "refined"
  | "tentative"
  | "unsupported";

type Severity = "S0" | "S1" | "S2" | "S3" | "S4";

type JudgmentStatus = "resolved" | "partial" | "unavailable";

interface RelationshipJudgment<TDirection extends string = string> {
  key: string;
  status: JudgmentStatus;
  direction: TDirection | null;
  confidence: number | null;
  evidence_tier: EvidenceTier;
  severity: Severity;
  evidence_ids: string[];
  qualifiers?: string[];
  contradiction_ids?: string[];
  rationale_key?: string;
  resolver_version: string;
}
```

A judgment with `direction: null` must not be projected as a directional claim.

---

## 7.2 Confidence and severity are separate

Confidence answers:

> How well supported is this conclusion?

Severity answers:

> How much strain or consequence can this pattern create?

A high-severity judgment may be tentative.

A high-confidence judgment may describe a strength.

Never infer one from the other.

---

## 7.3 Evidence tiers

### Corroborated
Independent sources support the same relationship meaning.

Narrative may be direct but still tendency-based.

### Refined
Multiple signals support the judgment, but one source meaningfully qualifies its form, direction, or context.

Narrative should include nuance.

### Tentative
Evidence suggests a useful possibility, but support is limited, incomplete, or direction-only.

Narrative must hedge and avoid major claims.

### Unsupported
The claim must not enter the final narrative.

Unsupported is a valid and expected system state.

---

## 7.4 Severity ladder

### S0 — Strength
A supportive, attractive, stabilizing, or connective dynamic.

### S1 — Difference
A noticeable contrast with low inherent friction.

### S2 — Friction
A repeated mismatch that can create misunderstandings.

### S3 — Strain
A pattern that can damage closeness if repeated without repair.

### S4 — Structural risk
A persistent, compounding pattern requiring unusually explicit management.

Severity must not become a hidden compatibility score.

It is used to calibrate:

- prominence,
- care in wording,
- need for guidance,
- and escalation of repair support.

---

## 7.5 Current canonical vertical slices

The following relationship judgments already represent the preferred architectural pattern and should be treated as canonical examples:

- `balance_of_power`
- `recovery_speed`
- `reassurance_signal`
- `unconscious_role_play`
- `residual`
- `expression_speed`

Current principles attached to these slices:

- server-owned canonical judgment,
- safe client projection,
- evidence tier preserved,
- direction may be psych-owned where appropriate,
- optional alignment and confidence enrichment,
- LLM supplies narrative expression rather than classification,
- and null direction suppresses directional projection.

`residual` is evidence-only and should not receive its own user-facing badge by default.

---

## 7.6 Canonical injection order

Where these judgments are composed into a shared Romantic context, preserve semantic dependency order:

```text
balance_of_power
  → recovery_speed
  → reassurance_signal
  → unconscious_role_play
  → residual
  → expression_speed
  → section summary / context / metadata
```

This order is not a visual order requirement.

It is a context construction rule designed to keep dependent synthesis stable.

---

# 8. Deterministic Engine Responsibilities

## 8.1 The deterministic engine owns

The deterministic system must own:

- classification enums,
- threshold logic,
- direction,
- polarity,
- pair symmetry rules,
- evidence selection,
- evidence independence,
- confidence tier,
- severity,
- module eligibility,
- fallback state,
- client projection eligibility,
- and trace metadata.

---

## 8.2 It must not own unnecessarily

The deterministic engine does not need to own every final sentence.

It may provide:

- copy keys,
- structured meaning,
- scene ingredients,
- directional roles,
- and required advice goals.

Language that benefits from synthesis may be delegated, provided the meaning is locked.

---

## 8.3 Threshold discipline

Every threshold must have:

- a named constant,
- a documented semantic reason,
- boundary tests,
- neutral-zone behavior,
- and migration notes when changed.

Avoid invisible numbers inside render components or prompt preparation code.

---

## 8.4 Symmetry discipline

Pair judgments must explicitly declare whether they are:

- symmetric,
- directional,
- role-reversible,
- or identity-bound.

A/B order must not change a symmetric conclusion.

Directional conclusions must reverse correctly when A and B are swapped.

---

# 9. LLM Responsibilities and Contract

## 9.1 The LLM may

The LLM may:

- synthesize multiple approved evidence items,
- translate system meaning into natural relationship language,
- create a recognizable hypothetical scene,
- explain both perspectives fairly,
- write transitions,
- produce headline and body variants,
- turn an approved repair goal into conversational guidance,
- localize tone naturally,
- and reduce repetition across modules.

---

## 9.2 The LLM must not

The LLM must not:

- create a new relationship classification,
- override a canonical direction,
- upgrade confidence,
- invent childhood history,
- invent past arguments,
- diagnose attachment style or mental illness unless explicitly provided and product-approved,
- claim a relationship outcome,
- introduce Marriage-owned operational analysis,
- assign grades,
- or create unsupported contrast merely to make the prose interesting.

---

## 9.3 No excerpt rewriting

The model must not simply paraphrase input snippets one after another.

A valid generated insight should synthesize at least two meaningful evidence inputs when the section contract calls for synthesis.

If only one source exists, the output must be narrower and visibly less certain.

---

## 9.4 Narrative output contract

Generated output should be structured, not free-form HTML or uncontrolled Markdown.

Recommended shape:

```ts
interface NarrativeBlock {
  headline: string;
  body: string;
  scene?: string;
  perspective_a?: string;
  perspective_b?: string;
  reframe?: string;
  action?: string;
  evidence_refs: string[];
}
```

The exact fields may vary by module, but evidence references are mandatory for generated claims.

---

## 9.5 Prompt package requirements

Every prompt package must contain:

- module purpose,
- user question,
- canonical judgments,
- approved evidence,
- confidence and severity,
- directional binding,
- banned claims,
- required output schema,
- locale,
- address rules,
- length budget,
- repetition exclusions,
- and fallback expectations.

Do not send the entire raw report state when the module only needs a bounded package.

---

## 9.6 Thin-guardrail principle

The prompt should not be forced to rediscover the product logic through hundreds of prose rules.

The system should provide a well-formed context package so that the prompt mainly performs:

- synthesis,
- phrasing,
- scene construction,
- and tone control.

If a prompt needs extensive instructions to prevent wrong classification, the deterministic contract is too weak.

---

## 9.7 Model independence

The narrative contract must not depend on one model’s quirks.

Any approved model should be evaluated against:

- schema compliance,
- evidence fidelity,
- tone,
- repetition,
- localization,
- and unsupported-claim rate.

A model change is a product-affecting change and requires regression review.

---

# 10. Experience Orchestration

## 10.1 Orchestrator role

The orchestrator converts available judgments into the narrative journey defined by 05A.

It decides:

- which modules are eligible,
- which insight leads,
- which evidence is visible or expandable,
- where each judgment is first introduced,
- which modules may reuse it,
- and how the report avoids repeating the same realization.

---

## 10.2 Story allocation

Each major judgment should have one primary narrative home.

Other modules may reference it only to:

- deepen,
- apply,
- contrast,
- or repair.

They must not repeat the same explanation in different wording.

Recommended metadata:

```ts
interface InsightAllocation {
  judgment_key: string;
  primary_module: RomanticModuleKey;
  allowed_secondary_modules: RomanticModuleKey[];
  prohibited_modules?: RomanticModuleKey[];
}
```

---

## 10.3 Fresh-realization budget

Every major module should contain one primary new realization.

The orchestrator should track:

- concepts already introduced,
- scenes already used,
- advice already given,
- and phrases or labels already repeated.

This protects the Product Blueprint’s surprise-density requirement.

---

## 10.4 Graceful omission

A module may be:

- fully rendered,
- rendered in reduced form,
- merged into another module,
- or omitted.

The system must not fabricate content merely to preserve a fixed number of sections.

A shorter truthful experience is better than a complete-looking invented one.

---

# 11. Module Architecture

The module contracts below implement the product architecture in 05A.

## 11.1 Module 1 — Opening Scene

**User question:** “What kind of relationship is this?”

### Required technical outputs

- relationship signature,
- one central dynamic,
- person-aware identity line,
- why the connection matters,
- and a clear continuation hook.

### Allowed evidence

- strongest corroborated pair judgment,
- one differentiating person-to-pair interaction,
- Day-Master-informed relational behavior,
- and one confidence-safe supporting signal.

### Prohibited behavior

- grade,
- raw score lead,
- generic praise,
- unsupported destiny claim,
- or more than one major tension.

### Rendering rule

Hero receives narrative projection only. Detailed evidence remains below or expandable.

---

## 11.2 Module 2 — Difference Map

**User question:** “Where are we naturally different?”

### Required technical outputs

- two to four meaningful contrasts,
- direction where supported,
- what each contrast feels like in daily interaction,
- and whether it is complement, neutral difference, or friction.

### Primary evidence

- psych pair gaps,
- expression and decision differences,
- Saju pair contrasts,
- 11-axis evidence,
- and context-sensitive pair signals.

### Visualization

Use comparison tables, compact bars, or selective radar support only after the narrative framing.

### Guardrail

Do not treat the largest numeric gap as automatically the most important relationship difference.

Importance is determined by relationship consequence, evidence quality, and narrative relevance.

---

## 11.3 Module 3 — Relationship Flow

**User question:** “What loop do we keep entering?”

### Required technical outputs

- trigger,
- A response,
- B interpretation,
- B response,
- A interpretation,
- escalation or distancing loop,
- and interruption point.

### Primary judgments

- recovery speed,
- expression speed,
- reassurance signal,
- conflict style,
- resilience,
- and balance of power where relevant.

### Recommended data shape

```ts
interface RelationshipLoop {
  trigger: string;
  a_action: string;
  b_interpretation: string;
  b_action: string;
  a_interpretation: string;
  loop_result: string;
  interruption: string;
  evidence_refs: string[];
}
```

### Guardrail

The loop is a shared pattern, not a blame chain.

---

## 11.4 Module 4 — Hidden Heart

**User question:** “What is each person really trying to receive?”

### Required technical outputs

- visible behavior,
- hidden need,
- likely misreading,
- and a safe translation for each person.

### Primary evidence

- reassurance signal,
- recognition,
- empathy,
- connection,
- self-control,
- expression tendencies,
- and person-level relational meaning.

### Guardrail

Hidden need must be phrased as a supported relational tendency, not mind-reading.

---

## 11.5 Module 5 — Why This Relationship Is Special

**User question:** “What exists between us that does not exist in quite the same way elsewhere?”

### Required technical outputs

- emergent pair quality,
- mutual gift,
- A→B contribution,
- B→A contribution,
- and relationship-specific growth potential.

### Primary evidence

- cross-source corroboration,
- pair-only Saju interactions,
- complementary psych axes,
- balance dynamics,
- and stable strengths.

### Guardrail

Do not create symmetrical praise for visual balance. Contributions may differ in type and prominence.

---

## 11.6 Module 6 — Conflict Translation

**User question:** “What do we say, and what does the other person hear?”

### Required technical outputs

- original line or behavior,
- intended meaning,
- received meaning,
- why the translation breaks,
- and a better line.

### Primary judgments

- expression speed,
- reassurance signal,
- conflict style,
- thinking style,
- decision style,
- and recovery pattern.

### Speaker binding

Speaker identity must be resolved before narrative generation whenever direction is known.

Do not leave direction binding entirely to the LLM.

### Guardrail

Dialogue is illustrative, not a claim that the couple literally said those words.

---

## 11.7 Module 7 — Do / Don’t

**User question:** “What protects this relationship, and what repeatedly harms it?”

### Required technical outputs

- paired do / don’t guidance,
- relationship-specific reason,
- role or direction where relevant,
- and one observable behavior.

### Guidance quality rule

Advice must be derivable from a prior judgment and must not introduce a new diagnosis or problem.

---

## 11.8 Module 8 — Repair Guide

**User question:** “What should we do after the moment goes wrong?”

### Required technical outputs

- first move,
- timing rule,
- what not to force,
- reassurance or space requirement,
- reconnection phrase,
- and repair completion signal.

### Primary judgments

- recovery speed,
- residual evidence,
- reassurance signal,
- expression speed,
- resilience,
- and conflict style.

### Residual rule

Residual may qualify repair advice but does not need a standalone label or badge.

---

## 11.9 Module 9 — Next Step

**User question:** “What can we try in real life?”

### Required outputs

- one small experiment,
- when to use it,
- who initiates or how either person can initiate,
- and what success looks like.

### Guardrail

The action must be realistic, observable, and proportionate to confidence and severity.

---

## 11.10 Module 10 — Relationship Horizon

**User question:** “What can this relationship become if we understand the pattern?”

### Required outputs

- grounded future possibility,
- strength to preserve,
- pattern to mature,
- and hopeful closing sentence.

### Guardrail

This is not prediction.

Use possibility language, not destiny language.

---

# 12. Hero Technical Contract

## 12.1 Grade replacement

The Hero must not rely on:

- score,
- grade,
- rank,
- symbolic archetype,
- or generic compatibility label.

It must be built from:

1. canonical relationship signature,
2. names,
3. one defining dynamic,
4. one reason the relationship is distinctive,
5. and a narrative hook.

---

## 12.2 Day-Master-informed identity

Day Master evidence must be transformed through relationship behavior.

Canonical path:

```text
Day Master characteristic
  → person-level relational tendency
  → pair interaction
  → supported identity line
```

Prohibited path:

```text
Day Master
  → decorative symbol
  → generic metaphor
```

A symbolic phrase may be used only when it clarifies an already-supported relational behavior.

---

## 12.3 Hero selection priority

Recommended priority:

1. strongest relationship-specific corroborated insight,
2. pair interaction that differentiates this couple,
3. emotionally recognizable strength-tension combination,
4. high-confidence refined insight,
5. safe strength-only fallback.

Never lead the Hero with a tentative high-severity claim.

---

# 13. Projection Architecture

## 13.1 Safe projection principle

The client receives the minimum approved data required to render the experience.

Do not expose:

- raw prompt packages,
- internal debug rationale,
- private model traces,
- hidden thresholds,
- unrestricted source objects,
- or server-only identifiers.

---

## 13.2 Projection contract

```ts
interface RomanticJudgmentProjection {
  key: string;
  direction: string | null;
  confidence_band?: "high" | "medium" | "low";
  evidence_tier: Exclude<EvidenceTier, "unsupported">;
  severity: Severity;
  badge?: {
    label: string;
    tone: "strength" | "difference" | "friction" | "strain";
  };
  summary?: string;
  evidence_preview?: Array<{
    label: string;
    source_group: string;
  }>;
}
```

Do not project a badge merely because a judgment exists.

Badge eligibility is a product decision.

---

## 13.3 Current badge policy

Badge-eligible canonical slices:

- balance of power,
- recovery speed,
- reassurance signal,
- unconscious role play,
- expression speed.

Evidence-only by default:

- residual.

LLM-generated text may provide headline or body, but must not generate the badge classification.

---

## 13.4 Null and partial states

- `direction = null` → suppress directional label.
- `unsupported` → suppress claim entirely.
- `partial` → render only fields that remain valid.
- missing narrative → use deterministic fallback or omit module.
- missing evidence preview → preserve story without fake evidence chips.

---

# 14. Rendering Rules

## 14.1 Story-first order

Within a module, preferred order is:

```text
Human question or scene
  → relationship meaning
  → two-person interpretation
  → supporting evidence
  → visualization or comparison
  → action / bridge
```

The exact layout may vary, but evidence must not become the opening burden.

---

## 14.2 UI component responsibilities

### Narrative card
Carries one primary realization.

### Comparison table
Clarifies a bounded contrast. It does not discover the contrast.

### Radar
Shows multi-axis shape only when users can understand why it matters.

### Loop diagram
Shows sequence and escalation.

### Timeline
Shows relational progression, repair timing, or repeated phases—not unsupported future prediction.

### Dialogue block
Translates intent and reception with clear speaker binding.

### Expandable deep read
Provides evidence detail, nuance, or source explanation without interrupting the primary story.

---

## 14.3 No dashboard-first layout

The first viewport must not resemble analytics software.

Do not lead with:

- grids of metrics,
- many badges,
- a full 11-axis radar,
- score summaries,
- or technical labels.

---

## 14.4 Density control

Rendering should alternate:

- emotionally rich narrative,
- concise evidence,
- visual explanation,
- dialogue or scene,
- and practical action.

Avoid long runs of the same component type.

---

# 15. Copy and Localization System

## 15.1 One semantic model, localized expression

Korean and English outputs should express the same canonical meaning.

They do not need to be literal translations.

Locale-specific phrasing may differ in:

- sentence rhythm,
- politeness,
- directness,
- humor,
- and natural relational language.

They must not differ in classification, confidence, severity, or advice intent.

---

## 15.2 Address rules

Preferred:

- names,
- “두 사람,”
- role-specific language,
- or clearly bound relational roles.

Avoid:

- anonymous A/B in user-facing prose,
- casual “너” except inside clearly illustrative quoted dialogue,
- and inconsistent pronoun binding.

Marriage-style scripts may use functional roles such as “화난 쪽” and “상대,” but Romantic should prefer names when clarity permits.

---

## 15.3 Copy key ownership

Deterministic copy keys should own:

- badge labels,
- evidence labels,
- confidence-safe fallback text,
- unavailable states,
- UI chrome,
- and required legal or caution language.

LLM generation may own:

- narrative headlines,
- story bodies,
- transitions,
- illustrative dialogue,
- and tailored action phrasing.

---

## 15.4 Language leak testing

Every locale path must test for unintended language leakage.

Examples:

- English artifact contains no Korean narrative fragments.
- Korean artifact contains Korean narrative rather than silent English fallback.
- omitted-locale legacy behavior remains explicit until removed.

---

# 16. Failure and Fallback Architecture

## 16.1 Failure categories

The system must distinguish:

- missing input,
- unresolved judgment,
- narrative generation failure,
- schema validation failure,
- locale failure,
- cache incompatibility,
- and render failure.

Do not collapse them into one generic error.

---

## 16.2 Fallback hierarchy

Recommended order:

1. approved generated narrative,
2. deterministic narrative template from canonical judgment,
3. reduced evidence-led module,
4. graceful module omission,
5. safe experience-level error.

Never replace a failed supported claim with a different unsupported claim.

---

## 16.3 Partial report principle

A partial truthful report is valid.

The experience must remain coherent even when:

- psych data is missing,
- one source is unavailable,
- one module has insufficient evidence,
- or narrative generation fails.

The orchestrator should rebalance the journey rather than leave broken placeholders.

---

# 17. Observability and Traceability

## 17.1 Trace object

Every generated module should be traceable in non-user-facing metadata.

```ts
interface RomanticModuleTrace {
  module_key: RomanticModuleKey;
  judgment_keys: string[];
  evidence_ids: string[];
  prompt_contract_version?: string;
  model_id?: string;
  generation_id?: string;
  validation_results: string[];
  fallback_used: boolean;
}
```

---

## 17.2 Logging rules

Logs may record:

- resolver versions,
- judgment availability,
- evidence count,
- generation latency,
- schema errors,
- fallback usage,
- and cache status.

Logs must avoid exposing unnecessary personal content or full generated reports.

---

## 17.3 Product metrics

Technical observability should support product metrics such as:

- report completion,
- module expansion,
- re-read behavior,
- share behavior,
- repair-guide revisit,
- and generation failure rate.

These metrics must not become evidence for individual relationship judgments.

---

# 18. Security, Privacy, and Data Minimization

## 18.1 Minimum necessary data

Only send the narrative model the fields required for the target module.

Do not send:

- full birth records when derived evidence is sufficient,
- unrelated report sections,
- account metadata,
- payment data,
- or hidden internal notes.

---

## 18.2 Server-only data

Keep server-only:

- raw source calculations,
- prompt instructions,
- internal evidence paths,
- model credentials,
- hidden confidence calculations,
- and detailed debug metadata.

---

## 18.3 Sensitive inference restriction

The system must not infer or state sensitive personal attributes unrelated to the product evidence.

Relationship interpretation must remain within the approved Romantic scope.

---

# 19. Testing Constitution

## 19.1 Test pyramid

### Unit tests
Cover:

- resolvers,
- thresholds,
- symmetry,
- direction reversal,
- evidence tiers,
- severity,
- null handling,
- and projection eligibility.

### Contract tests
Cover:

- context package schemas,
- narrative output schemas,
- API response schemas,
- and version compatibility.

### Integration tests
Cover:

- input → judgment → projection,
- locale plumbing,
- cache identity,
- fallback behavior,
- and module orchestration.

### Narrative regression tests
Cover:

- unsupported claims,
- repetition,
- confidence language,
- speaker binding,
- evidence trace,
- and bilingual quality.

### Experience tests
Cover whether the final result follows the Product Blueprint.

---

## 19.2 Required resolver tests

For every directional resolver:

- A-high / B-low,
- A-low / B-high,
- similar-high,
- similar-low,
- neutral middle,
- missing A,
- missing B,
- missing both,
- contradictory supporting evidence,
- and A/B swap.

---

## 19.3 Product-law tests

Automated or rubric-based tests must verify:

- no grades or rankings,
- no unsupported soulmate or destiny language,
- no advice before recognition,
- no new LLM classification,
- no Marriage-owned operational drift,
- no anonymous speaker ambiguity where direction exists,
- no evidence-only residual badge,
- and no raw dashboard-first Hero.

---

## 19.4 Narrative rubric

Each generated module should be evaluated for:

1. **Evidence fidelity** — every claim is supported.
2. **Recognition** — the scene is specific enough to feel familiar.
3. **Fairness** — neither person becomes the villain.
4. **Synthesis** — the output adds relationship meaning rather than paraphrasing inputs.
5. **Confidence calibration** — certainty matches support.
6. **Freshness** — it does not repeat earlier modules.
7. **Action continuity** — advice follows from the explained pattern.
8. **Locale quality** — phrasing is natural and consistent.
9. **Product tone** — warm, intelligent, concise, and non-clinical.
10. **Boundary compliance** — the content remains Romantic.

---

## 19.5 Snapshot tests are insufficient

Snapshot tests may protect structure, but cannot prove product correctness.

A passing snapshot does not show that:

- the story is supported,
- the relationship meaning is fair,
- the advice follows,
- the surprise is real,
- or the module answers a human question.

Use snapshots only as one layer.

---

# 20. Migration Strategy

## 20.1 Migration principle

Do not rewrite the entire Romantic report in one undifferentiated change.

Migrate by canonical vertical slice or experience module while preserving product coherence.

---

## 20.2 Recommended phases

### Phase 0 — Inventory and provenance

Document:

- all current visible fields,
- source of each field,
- deterministic vs generated ownership,
- client vs server calculation,
- locale behavior,
- and duplication.

### Phase 1 — Canonical judgment lock

Create or confirm:

- enums,
- resolver ownership,
- evidence tier,
- severity,
- direction,
- provenance,
- and unit tests.

### Phase 2 — Safe projection

Expose only approved fields to the client.

Remove client-side reclassification.

### Phase 3 — Context package

Build bounded section packages.

Do not tune prose before the package is stable.

### Phase 4 — Narrative integration

Add generated headline / body / scene under schema and evidence constraints.

### Phase 5 — Product rendering

Reposition existing assets into the Product Blueprint’s story-first order.

### Phase 6 — Regression and removal

Remove:

- grades,
- duplicate logic,
- obsolete prompts,
- legacy badges,
- decorative archetypes,
- and dead report fields.

---

## 20.3 Current implementation preservation rule

The following existing assets should be migrated, not casually replaced:

- Hero,
- Scenario UX,
- 11-axis radar,
- comparison tables,
- Before / After dialogue,
- Timeline,
- Hidden Heart,
- Guide,
- Deep Read,
- and Difference Map.

Migration should change their narrative role and placement before redesigning their interaction pattern.

---

## 20.4 Commit discipline

Each technical batch should declare:

- judgment or module scope,
- files expected to change,
- tests expected to pass,
- prompt changes included or excluded,
- unrelated work excluded,
- and whether the batch is ready to commit.

Prompt tuning, resolver changes, UI changes, and migration cleanup should be separated when doing so improves traceability.

---

# 21. Change Management

## 21.1 Changes requiring product review

Product review is required for changes to:

- module order,
- Hero meaning,
- Romantic vs Marriage boundary,
- grade removal,
- evidence visibility,
- severity framing,
- advice philosophy,
- or final emotional journey.

---

## 21.2 Changes requiring technical review

Technical review is required for changes to:

- resolver thresholds,
- evidence independence,
- confidence tiers,
- projection schemas,
- model providers,
- prompt contracts,
- cache keys,
- or fallback hierarchy.

---

## 21.3 Backward compatibility

Persisted reports must not be silently reinterpreted under new enum meanings.

Choose one:

- preserve the old artifact with its version,
- migrate explicitly,
- or regenerate under the new version with user-visible handling where necessary.

---

# 22. Definition of Done

A Romantic technical implementation is complete only when:

- canonical judgments are server-owned,
- every user-facing insight is traceable,
- evidence tier and severity are distinct,
- the LLM cannot create classifications,
- unsupported claims are suppressed,
- direction is correctly bound,
- A/B swap behavior is tested,
- locale behavior is explicit,
- safe client projection is enforced,
- fallback behavior is coherent,
- existing product assets are correctly repositioned,
- no grades or ranks remain,
- and the rendered experience satisfies 05A.

Passing typecheck alone is not completion.

Passing unit tests alone is not completion.

A technically valid response that violates the product journey is not complete.

---

# 23. Technical Laws

These laws are permanent unless both the Product and Technical Blueprints are formally revised.

## Law 1 — Product defines technology

Technical convenience cannot redefine the experience.

---

## Law 2 — The LLM never owns truth

The LLM may express, synthesize, and translate.

It does not establish canonical relationship facts.

---

## Law 3 — Every claim is traceable

A meaningful user-facing conclusion must map to canonical judgment and evidence.

---

## Law 4 — Evidence precedes narrative internally

The user sees story first.

The system must build evidence first.

---

## Law 5 — Confidence is not severity

Never collapse support strength and relationship consequence.

---

## Law 6 — Null is a valid result

Insufficient evidence must produce omission, reduction, or uncertainty—not invention.

---

## Law 7 — One classifier, many projections

Canonical meaning is resolved once and rendered many ways.

---

## Law 8 — Direction is data

Speaker and role direction must not be left to prose guesswork.

---

## Law 9 — The client renders; it does not reinterpret

No client-side shadow relationship engine.

---

## Law 10 — A section owns one new realization

The orchestrator must protect narrative freshness and prevent repetition.

---

## Law 11 — Fallbacks preserve truth

Failure may reduce richness.

It must never reduce factual integrity.

---

## Law 12 — Localization preserves meaning

Languages may differ in expression, never in canonical judgment.

---

## Law 13 — Existing UX assets are not disposable

Preserve successful interaction patterns unless evidence shows they fail the new Product Blueprint.

---

## Law 14 — Tests protect product laws

Test the relationship meaning and experience—not only code shape.

---

## Law 15 — Relationship first, technology second

The system is successful when users understand their relationship more clearly and can respond more wisely.

Model cleverness, architecture elegance, and visual complexity are secondary.

---

# 24. Technical Review Checklist

Before approving a Romantic batch, verify:

## Authority

- [ ] The change follows `05A_Romantic_Product_Blueprint.md`.
- [ ] No legacy behavior was treated as authority without review.

## Judgment

- [ ] Canonical classification is deterministic.
- [ ] Direction is explicit or intentionally null.
- [ ] Confidence and severity are separate.
- [ ] Evidence provenance is preserved.
- [ ] A/B swap behavior is correct.

## LLM

- [ ] The model receives bounded context.
- [ ] The model cannot invent classification.
- [ ] Output follows a schema.
- [ ] Claims reference evidence.
- [ ] Repetition and unsupported contrast are checked.

## Projection

- [ ] Client data is safe and minimal.
- [ ] Badge eligibility is product-approved.
- [ ] Unsupported and null states are suppressed correctly.

## Experience

- [ ] Story appears before evidence in the user journey.
- [ ] The module answers one human question.
- [ ] The module adds one fresh realization.
- [ ] Advice follows recognition and explanation.
- [ ] The relationship remains the protagonist.

## Boundary

- [ ] No grade, rank, or verdict was introduced.
- [ ] No decorative mysticism replaced relational meaning.
- [ ] No Marriage-owned operations entered Romantic.

## Quality

- [ ] Unit, contract, integration, locale, and narrative tests pass.
- [ ] Fallback behavior was tested.
- [ ] Cache and version implications were reviewed.
- [ ] Unrelated files and prompt tuning were excluded or declared.

---

# 25. Handoff to Implementation Checklist

This Technical Blueprint defines how the system must work.

The next companion document should be:

`07A_Romantic_Implementation_Checklist.md`

That document should convert the Product and Technical Constitutions into a concise execution and audit checklist for:

- planning,
- implementation,
- pull-request review,
- READY TO COMMIT review,
- release validation,
- and future regression audits.

It must not introduce new product or technical policy.

Its only authority should come from 05A and 06A.

---

# 26. Closing Principle

The Romantic system should be sophisticated internally and simple emotionally.

Internally, it may contain:

- multiple evidence sources,
- directional resolvers,
- confidence models,
- severity ladders,
- structured context packages,
- language generation,
- and validation layers.

The user should experience none of that as machinery.

They should experience:

> “우리 관계를 제대로 봤다.”

The technical system has succeeded when the evidence is disciplined, the narrative is honest, the experience is coherent, and the user leaves understanding the relationship—not admiring the technology.
