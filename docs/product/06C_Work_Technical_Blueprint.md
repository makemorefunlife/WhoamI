# 06C Work Technical Blueprint

**Document type:** Technical Constitution / Technical SSOT  
**Product:** Ahaitsme — Work & Coworker Experience  
**Status:** Draft v1.0 for technical review  
**Audience:** Product, Engineering, Design, Content Systems, QA, Localization  
**Purpose:** Define the canonical technical architecture, evidence contracts, deterministic judgments, projections, narrative boundaries, rendering ownership, and implementation sequence required to realize `05C_Work_Product_Blueprint.md`.  
**Product authority:** `05C_Work_Product_Blueprint.md`  
**Shared authority:** `05_Relationship_Product_Bible.md` · `06_Visual_Design_System.md`  
**Implementation gate:** `07C_Work_Implementation_Checklist.md`

---

## 0. Technical Constitution

The Work system must turn supported evidence into a practical operating manual without becoming an employee score, hiring system, promotion predictor, or career fortune engine.

Its canonical pipeline is:

```text
Person inputs
+ Pair inputs
+ Saju evidence
+ Psych evidence
+ Explicit work context
        ↓
Normalized evidence
        ↓
Deterministic Work judgments
        ↓
Confidence / severity / contradiction resolution
        ↓
Canonical Work model
        ↓
Product projections
        ↓
Narrative allocation
        ↓
Client-safe rendering
        ↓
Actionable Work Operating Manual
```

The system must preserve five separations:

1. **Saju evidence and Psych evidence remain independent.**
2. **A person tendency and a pair dynamic remain independent.**
3. **Confidence and severity remain independent.**
4. **Canonical judgment and visual projection remain independent.**
5. **Deterministic truth and LLM expression remain independent.**

The server owns classification.

The client owns presentation.

The LLM owns expression, synthesis, examples, and humane explanation within a bounded evidence package.

No client component may infer a new Work truth from raw scores.

No LLM may invent a Work truth that does not exist in the canonical package.

No shared visual component may force shared Work meaning.

---

# 1. Authority and Document Hierarchy

## 1.1 Authority order

When documents or implementation disagree, use this order:

1. `01_Product_Vision.md`
2. `02_Relationship-ux-bible.md`
3. `05_Relationship_Product_Bible.md`
4. `05C_Work_Product_Blueprint.md`
5. `06_Visual_Design_System.md`
6. `06C_Work_Technical_Blueprint.md`
7. `07C_Work_Implementation_Checklist.md`
8. Current implementation
9. Legacy copy, prompts, scripts, and UI behavior

Code is implementation evidence, not product authority.

## 1.2 Product Blueprint vs Technical Blueprint

`05C` owns:

- user questions,
- product promises,
- product boundaries,
- module intent,
- Work-specific meaning,
- visual purpose,
- premium value,
- and forbidden claims.

`06C` owns:

- data contracts,
- evidence provenance,
- deterministic ownership,
- canonical judgments,
- projection contracts,
- resolver boundaries,
- LLM input/output constraints,
- server/client ownership,
- versioning,
- testing,
- migration,
- and implementation sequencing.

`06C` must not silently redesign `05C`.

If the technical design cannot support a product requirement, the issue must be surfaced as an explicit product decision—not solved through hidden implementation behavior.

## 1.3 Implementation independence

This document defines the required target architecture.

It does not require preserving:

- current file names,
- current folders,
- legacy view models,
- current component boundaries,
- current prompt shapes,
- or current table formats.

Existing implementation may be reused only when it satisfies the contracts in this document.

---

# 2. System Goals

The Work system must support three lenses:

```text
ME    → How I Work
US    → How We Work
TEAM  → How We Combine
```

The initial implementation may prioritize ME and US.

TEAM must remain a future-compatible extension and must not require breaking the individual or pair contracts.

The system must answer five technical questions:

1. What Work-relevant evidence exists?
2. What canonical judgments can be supported?
3. Which judgments belong to the person, pair, role, or environment?
4. How should those judgments project into modules and visuals?
5. What action follows without overstating capability or career certainty?

---

# 3. Architectural Layers

## 3.1 Layer overview

### Layer A — Input and normalization

Owns:

- person identity,
- pair identity,
- birth-data normalization,
- Psych master normalization,
- locale,
- optional relationship role,
- optional explicit work context,
- and missing-data handling.

### Layer B — Evidence extraction

Owns:

- Saju person evidence,
- Saju pair evidence,
- Psych person evidence,
- Psych pair evidence,
- explicit work context,
- and deterministic derived evidence.

### Layer C — Work judgment engine

Owns canonical judgments for:

- work signature,
- work shape,
- contribution patterns,
- support needs,
- collaboration type,
- role ownership,
- decision flow,
- pressure pattern,
- conflict and repair,
- feedback and recognition,
- leadership/followership,
- and exploratory environment fit.

### Layer D — Resolver layer

Owns:

- evidence sufficiency,
- confidence,
- severity,
- contradiction,
- deduplication,
- directionality,
- and warning overlays.

### Layer E — Canonical Work model

Owns the stable server-side object from which all Work projections are produced.

### Layer F — Projection layer

Owns:

- individual hero,
- pair hero,
- selective Psych projections,
- Saju comparison table,
- collaboration map,
- role matrix,
- loop/timeline projections,
- narrative context packages,
- free projection,
- and premium projection.

### Layer G — Narrative layer

Owns human expression of already-resolved truths.

### Layer H — Client rendering

Owns visual hierarchy, interaction, expansion, responsive layout, and accessibility.

## 3.2 Permanent authority rule

```text
Raw evidence
  ≠ canonical judgment
  ≠ projection
  ≠ narrative
  ≠ UI component state
```

Each layer may transform only what the previous layer has authorized.

---

# 4. Canonical Pipeline

## 4.1 Full pipeline

```text
WorkAnalysisInput
  ↓ normalize
NormalizedWorkInput
  ↓ extract independently
WorkEvidenceBundle
  ↓ resolve
CanonicalWorkJudgmentSet
  ↓ synthesize
CanonicalWorkModel
  ↓ project
WorkExperienceViewModel
  ↓ narrate/render
Work Report
```

## 4.2 Deterministic-first rule

Any value that affects:

- classification,
- map position,
- role assignment,
- warning state,
- confidence,
- severity,
- row band,
- or module inclusion

must be resolved deterministically before narrative generation.

## 4.3 Fail-closed rule

When required evidence is missing or contradictory:

- omit the judgment,
- lower confidence,
- present an explicitly limited interpretation,
- or fall back to a smaller supported module.

The system must not fill missing evidence with generic personality copy.

## 4.4 Graceful partial success

The report may still render when:

- Psych evidence is absent,
- one optional Work context field is absent,
- one non-critical module fails,
- or LLM narrative fails.

The report must not render a mixed or misleading claim merely to preserve section count.

---

# 5. Input Model

## 5.1 Conceptual input contract

```ts
interface WorkAnalysisInput {
  personA: WorkPersonInput;
  personB?: WorkPersonInput;
  relationshipMode: "individual" | "pair" | "team_preview";
  locale: "ko-KR" | "en-US";
  workContext?: ExplicitWorkContext;
  psychA?: PsychMasterJson;
  psychB?: PsychMasterJson;
  productTier: "free" | "premium";
}
```

## 5.2 Person input

```ts
interface WorkPersonInput {
  personId: string;
  displayName?: string;
  birthData?: NormalizedBirthData;
  roleLabel?: string;
}
```

Role labels are descriptive context only.

They must not alter Saju or Psych truth.

Examples:

- manager,
- direct report,
- peer,
- founder,
- collaborator,
- client-side partner.

## 5.3 Explicit work context

```ts
interface ExplicitWorkContext {
  currentRelationship?: "peer" | "manager_report" | "founder_partner" | "project_collaborator" | "other";
  decisionAuthority?: "A" | "B" | "shared" | "unknown";
  currentFriction?: string;
  currentGoal?: string;
  workStage?: "new" | "established" | "strained" | "transition";
}
```

Explicit context may:

- select examples,
- prioritize modules,
- adjust role-language,
- or tailor action guidance.

It may not:

- overwrite evidence,
- manufacture confidence,
- or convert a tentative judgment into a confirmed one.

## 5.4 Locale

Locale must be resolved before:

- labels,
- deterministic copy,
- narrative generation,
- and view-model projection.

No silent locale switching is allowed.

---

# 6. Evidence Architecture

## 6.1 Evidence families

The Work system recognizes six families.

### A. Saju person evidence

Examples:

- elemental balance,
- ten-god distribution,
- day-stem tendencies,
- structural concentration,
- resource/output/control patterns,
- seasonal or strength context where supported,
- and existing person-level Work signals.

This evidence may describe tendencies.

It may not establish verified competence, career success, or job suitability.

### B. Saju pair evidence

Examples:

- cross-hits,
- complementary or competing structures,
- interaction signals,
- pair-level work patterns,
- role asymmetry,
- and supported relational dynamics.

This evidence belongs to the pair.

It must not be copied back as an individual identity.

### C. Psych person evidence

The Psych source contains the real-world 11-axis model:

- stimulation,
- self_control,
- practicality,
- structure,
- empathy,
- conflict_style,
- resilience,
- recognition,
- energy_style,
- thinking_style,
- decision_style.

These values are survey-backed and remain independent from Saju.

### D. Psych pair evidence

Examples:

- axis difference,
- axis similarity,
- complement pattern,
- tension pattern,
- and directional pair interpretation.

A Psych pair result is not a Saju confirmation unless both sources independently support the same human interpretation.

### E. Explicit work-context evidence

Examples:

- declared authority,
- current project stage,
- stated friction,
- stated goal,
- and relationship role.

### F. Derived deterministic evidence

Examples:

- selected Work-relevant Psych axes,
- comparison row bands,
- collaboration-map coordinates,
- role candidates,
- support needs,
- warning overlays,
- contradiction markers,
- and confidence tier.

Derived evidence must preserve its source lineage.

## 6.2 Canonical evidence item

```ts
interface WorkEvidenceItem {
  evidenceId: string;
  sourceFamily:
    | "saju_person"
    | "saju_pair"
    | "psych_person"
    | "psych_pair"
    | "explicit_context"
    | "derived";
  sourcePath: string;
  subject: "A" | "B" | "PAIR" | "TEAM";
  domain: WorkEvidenceDomain;
  direction?: string;
  strength?: number;
  confidenceInput?: number;
  rawValue?: unknown;
  normalizedValue?: unknown;
  supports: string[];
  contradicts?: string[];
  limitations?: string[];
  version: string;
}
```

## 6.3 Evidence domains

```ts
type WorkEvidenceDomain =
  | "work_energy"
  | "initiation"
  | "execution"
  | "completion"
  | "structure"
  | "practicality"
  | "thinking"
  | "decision"
  | "communication"
  | "feedback"
  | "recognition"
  | "pressure"
  | "conflict"
  | "repair"
  | "leadership"
  | "followership"
  | "role_ownership"
  | "collaboration"
  | "environment";
```

## 6.4 Provenance contract

Every user-visible deterministic judgment must be traceable to:

```text
judgment
  → evidence IDs
  → source family
  → source path
  → resolver version
```

Narrative output does not need to expose raw provenance to the user, but internal inspection must remain possible.

## 6.5 Evidence separation rule

Saju and Psych may appear in the same module.

They must not be merged into one unnamed score.

Allowed:

```text
Psych: both prefer fast decisions.
Saju: the pair also shows a strong initiation pattern.
Together: the same work behavior is supported from two independent sources.
```

Not allowed:

```text
Your Saju means your Psych decision score is high.
```

## 6.6 Null handling

A missing value is not neutral evidence.

The system must distinguish:

- absent,
- unavailable,
- unsupported,
- contradictory,
- and genuinely middle-range.

---

# 7. Work-Relevant Psych Selection

## 7.1 Selective-axis principle

The full 11-axis model is a foundation, not the report navigation.

A Work module may promote an axis only when it:

1. answers the module’s human question,
2. materially changes interpretation or advice,
3. has sufficient evidence,
4. and is not duplicating a stronger judgment elsewhere.

## 7.2 Primary Work axes

The default Work axis pool is:

- structure,
- practicality,
- thinking_style,
- decision_style,
- self_control,
- energy_style,
- recognition,
- conflict_style,
- resilience,
- empathy,
- stimulation.

This is a candidate pool—not a requirement to show all axes.

## 7.3 Axis-to-question ownership

| Human question | Primary axes | Secondary axes |
|---|---|---|
| How do I organize work? | structure, practicality | self_control |
| How do I think and decide? | thinking_style, decision_style | stimulation |
| How do I sustain energy? | energy_style, stimulation | resilience |
| How do I respond under pressure? | self_control, resilience | conflict_style |
| How do I receive feedback? | recognition, conflict_style | empathy |
| How do we coordinate? | structure, decision_style, practicality | empathy |
| How do we repair friction? | conflict_style, resilience, empathy | recognition |

## 7.4 Full radar rule

A full 11-axis radar may exist only as:

- an expandable overview,
- an appendix-like evidence view,
- or an optional comparison surface.

It must not function as the primary Work story.

The primary narrative should generally select 3–5 axes.

## 7.5 No axis ranking

Axis scores must not be labeled as:

- good / bad,
- high performer / low performer,
- leadership score,
- productivity score,
- or promotability.

---

# 8. Canonical Judgment Contract

## 8.1 Canonical Work judgment

```ts
interface CanonicalWorkJudgment {
  judgmentId: string;
  key: WorkJudgmentKey;
  subject: "A" | "B" | "PAIR" | "TEAM";
  direction: string;
  type?: string;
  strength?: number;
  confidence: WorkConfidenceTier;
  severity: WorkSeverity;
  evidenceIds: string[];
  sourceFamilies: string[];
  contradiction?: WorkContradiction;
  limitations?: string[];
  actionKeys?: string[];
  resolverVersion: string;
}
```

## 8.2 Judgment keys

```ts
type WorkJudgmentKey =
  | "work_signature"
  | "work_shape"
  | "contribution_pattern"
  | "support_need"
  | "collaboration_type"
  | "collaboration_power"
  | "collaboration_comfort"
  | "continuing_cost"
  | "role_ownership"
  | "decision_flow"
  | "communication_flow"
  | "pressure_pattern"
  | "conflict_pattern"
  | "repair_pattern"
  | "feedback_pattern"
  | "recognition_pattern"
  | "leadership_expression"
  | "followership_expression"
  | "environment_exploration";
```

## 8.3 Single judgment, multiple projections

A judgment must be resolved once and projected many times.

Example:

```text
Canonical judgment:
PAIR collaboration_type = powerful_but_costly

Possible projections:
- Pair Hero badge
- Collaboration Map quadrant
- Role Design note
- Pressure Pattern warning
- Work Manual action
- LLM context package
```

The client must not independently reclassify the pair from map coordinates.

## 8.4 No duplicate classifiers

The following must not each classify the same truth independently:

- resolver,
- projector,
- view-model builder,
- React component,
- prompt,
- and LLM.

Only the canonical resolver classifies.

---

# 9. Confidence, Severity, and Contradiction

## 9.1 Confidence tiers

```ts
type WorkConfidenceTier =
  | "corroborated"
  | "refined"
  | "tentative"
  | "insufficient";
```

### Corroborated

Multiple independent evidence sources support the same human interpretation.

### Refined

One strong source establishes direction and another source adds nuance without materially contradicting it.

### Tentative

A limited source supports a cautious interpretation.

### Insufficient

The system cannot responsibly make the claim.

## 9.2 Severity ladder

```ts
type WorkSeverity = "S0" | "S1" | "S2" | "S3" | "S4";
```

- **S0 — Strength:** useful tendency or contribution.
- **S1 — Difference:** meaningful difference requiring awareness.
- **S2 — Friction:** recurring coordination cost.
- **S3 — Strain:** sustained pattern likely to reduce trust or reliability.
- **S4 — Structural risk:** serious risk requiring independent warning evidence.

## 9.3 Confidence is not severity

A high-confidence strength may be S0.

A tentative concern may be S2 but must remain tentative.

A severe warning must never be visually strengthened merely because a score is extreme.

## 9.4 Contradiction types

```ts
type WorkContradictionType =
  | "saju_vs_psych"
  | "person_vs_pair"
  | "source_internal"
  | "context_vs_tendency"
  | "directional_asymmetry";
```

## 9.5 Contradiction outcomes

A contradiction resolver may:

- preserve both truths,
- reduce confidence,
- narrow the claim,
- select one source for one module and another source for another,
- or omit the judgment.

It must not average unlike evidence into a false middle.

---

# 10. Core Work Engines

The Work system requires a coordinated set of deterministic engines.

Each engine owns one semantic job.

---

## 10.1 Work Signature Engine

### Purpose

Resolve the clearest high-level description of how a person tends to enter and organize work.

### Inputs

- person-level Saju Work signals,
- selected Psych axes,
- optional explicit context.

### Outputs

```ts
interface WorkSignatureJudgment {
  typeKey: string;
  headlineKey: string;
  primaryStrengthKey: string;
  primaryCostKey?: string;
  supportNeedKey?: string;
  confidence: WorkConfidenceTier;
  evidenceIds: string[];
}
```

### Guardrails

The engine must not produce:

- profession recommendations,
- performance labels,
- leadership rank,
- or fixed identity claims.

---

## 10.2 Work Shape Engine

### Purpose

Describe the person’s likely shape across the work cycle.

### Canonical stages

```text
START → STRUCTURE → EXECUTE → ADJUST → FINISH
```

### Output

```ts
interface WorkShapeJudgment {
  stageStates: Array<{
    stage: "start" | "structure" | "execute" | "adjust" | "finish";
    tendency: string;
    supportNeed?: string;
    confidence: WorkConfidenceTier;
  }>;
  dominantShapeKey: string;
}
```

### Rule

The engine describes tendency and support—not verified delivery quality.

---

## 10.3 Contribution Engine

### Purpose

Translate supported tendencies into likely ways a person contributes value.

### Contribution families

- initiation,
- organization,
- execution,
- integration,
- quality control,
- people alignment,
- problem framing,
- decision closure,
- risk awareness,
- continuity.

### Capability boundary

A contribution pattern is not proof of competence.

Language must remain:

- “often contributes by,”
- “may be especially useful when,”
- “is likely to notice,”

not:

- “is excellent at,”
- “will succeed in,”
- “should be promoted to.”

---

## 10.4 Support Need Engine

### Purpose

Resolve the structure, counterpart, timing, feedback, or boundary that helps a person use strengths reliably.

### Support families

- clearer priorities,
- stronger sequencing,
- protected focus,
- faster feedback,
- more autonomy,
- explicit decision authority,
- closure support,
- emotional decompression,
- practical reality check,
- conflict translation.

### Output rule

Every support need should connect to a supported work pattern.

Generic productivity advice is prohibited.

---

## 10.5 Collaboration Map Engine

### Purpose

Resolve the pair’s collaboration type using two independent canonical axes:

- **Collaboration Power**
- **Collaboration Comfort**

### Canonical types

```ts
type CollaborationType =
  | "comfortable_and_powerful"
  | "uncomfortable_but_powerful"
  | "comfortable_but_incomplete"
  | "role_design_required";
```

### Continuing cost overlay

```ts
interface ContinuingCostOverlay {
  present: boolean;
  level?: "low" | "moderate" | "high";
  causeKeys?: string[];
  evidenceIds?: string[];
}
```

Continuing cost is an overlay, not a fifth collaboration type.

### Output

```ts
interface CollaborationMapJudgment {
  power: number;
  comfort: number;
  type: CollaborationType;
  continuingCost?: ContinuingCostOverlay;
  confidence: WorkConfidenceTier;
  evidenceIds: string[];
}
```

### Classification ownership

The server resolver owns the type.

The visual component receives the already-resolved type and coordinates.

---

## 10.6 Saju Comparison Table Engine

### Purpose

Translate Saju-primary comparison evidence into human Work tendencies.

### Required row contract

```ts
interface WorkSajuComparisonRow {
  rowKey: string;
  labelKey: string;
  personA: WorkComparisonCell;
  personB: WorkComparisonCell;
  between: WorkBetweenMeaning;
  evidenceIds: string[];
  confidence: WorkConfidenceTier;
}
```

```ts
interface WorkComparisonCell {
  bandKey: string;
  humanMeaningKey: string;
}

interface WorkBetweenMeaning {
  relationType: "similarity" | "complement" | "translation" | "friction";
  meaningKey: string;
  actionKey?: string;
}
```

### Candidate Work rows

- big-picture vs detail,
- initiation vs completion,
- speed vs caution,
- autonomy vs coordination,
- directness vs diplomacy,
- stability vs adaptation,
- visibility vs behind-the-scenes contribution,
- risk appetite vs risk control.

The final row catalog belongs to Work product and resolver review.

### Prohibitions

The table must not:

- name a winner,
- use grade colors,
- present decorative elemental mysticism,
- or imply that one style is professionally superior.

---

## 10.7 Role Design Engine

### Purpose

Resolve how responsibility should be divided between two people.

### Ownership states

```ts
type RoleOwnershipState =
  | "A_natural"
  | "B_natural"
  | "shared"
  | "support_required"
  | "dangerous_ambiguity";
```

### Role families

- initiation,
- planning,
- decision,
- execution,
- review,
- stakeholder communication,
- conflict repair,
- follow-through,
- quality control,
- risk monitoring.

### Output

```ts
interface RoleDesignJudgment {
  roleKey: string;
  ownership: RoleOwnershipState;
  primaryOwner?: "A" | "B" | "shared";
  supportOwner?: "A" | "B";
  handoffRuleKey?: string;
  warningKey?: string;
  evidenceIds: string[];
}
```

### Anti-overreach

Role Design suggests coordination structure.

It does not determine organizational title or authority.

---

## 10.8 Decision and Communication Engine

### Purpose

Resolve how information becomes a decision and how decisions should be communicated.

### Stages

```text
INPUT → INTERPRET → DISCUSS → DECIDE → CONFIRM → EXECUTE
```

### Outputs

- preferred input density,
- discussion speed,
- decision ownership,
- closure signal,
- escalation condition,
- and confirmation script key.

### Directionality

A→B communication and B→A communication may differ.

One shared pair label is insufficient when the asymmetry materially changes advice.

---

## 10.9 Pressure Pattern Engine

### Purpose

Resolve how a person or pair changes under pressure.

### Candidate states

- accelerates,
- narrows,
- over-controls,
- avoids,
- diffuses,
- becomes blunt,
- over-explains,
- disengages,
- perseveres past useful limits,
- seeks reassurance,
- seeks immediate closure.

### Output rule

Pressure patterns must include:

- trigger context,
- observable behavior,
- likely cost,
- and recovery support.

---

## 10.10 Conflict and Repair Engine

### Purpose

Separate disagreement style from repair style.

### Canonical judgments

```ts
interface WorkConflictRepairJudgment {
  conflictEntryKey: string;
  escalationKey?: string;
  residualKey?: string;
  repairNeedKey: string;
  repairSequenceKeys: string[];
  directionality?: {
    AtoB?: string[];
    BtoA?: string[];
  };
  confidence: WorkConfidenceTier;
}
```

### Repair sequence

A supported repair sequence may include:

1. pause or timing reset,
2. factual alignment,
3. intent clarification,
4. responsibility acknowledgment,
5. revised operating rule,
6. closure confirmation.

### Rule

“Move on” is not a repair strategy unless evidence supports rapid closure for both people.

---

## 10.11 Feedback and Recognition Engine

### Purpose

Resolve how feedback is best delivered and what makes contribution feel seen.

### Feedback dimensions

- directness,
- timing,
- public vs private,
- specificity,
- emotional framing,
- solution orientation,
- and closure.

### Recognition dimensions

- visible praise,
- trust and autonomy,
- practical reward,
- responsibility,
- private acknowledgment,
- evidence of impact.

### Rule

Recognition need is not immaturity.

Low recognition need is not emotional superiority.

---

## 10.12 Leadership / Followership Engine

### Purpose

Describe how authority tends to be expressed and received.

### Output families

- direction setting,
- decision ownership,
- delegation,
- monitoring,
- challenge behavior,
- autonomy need,
- escalation,
- and trust-building.

### Boundary

This engine does not rank leadership potential.

It describes operating style and counterpart needs.

---

## 10.13 Environment Fit Explorer

### Purpose

Generate cautious, exploratory environment hypotheses.

### Environment dimensions

- pace,
- structure,
- autonomy,
- collaboration density,
- ambiguity,
- feedback frequency,
- public visibility,
- change rate,
- and decision centralization.

### Output language

Allowed:

- “worth exploring,”
- “may feel easier when,”
- “could become draining if,”
- “likely to need.”

Prohibited:

- “your ideal career is,”
- “you will succeed in,”
- “avoid this profession,”
- “you are destined for.”

---

# 11. Directionality Contract

## 11.1 Directional primitives

The pair model must support:

```ts
interface DirectionalWorkView<T> {
  shared?: T;
  AtoB?: T;
  BtoA?: T;
}
```

## 11.2 Shared truth

Use a shared pair truth when:

- direction does not change interpretation,
- advice is genuinely symmetric,
- and no speaker binding is required.

## 11.3 Directional truth

Use A→B and B→A when:

- feedback lands differently,
- authority is asymmetric,
- conflict entry differs,
- recognition differs,
- or repair responsibility differs.

## 11.4 Name binding

When display names exist, user-facing scripts should prefer names.

Anonymous “A/B” language is internal only.

---

# 12. Deduplication and Semantic Ownership

## 12.1 Purpose

Prevent the report from saying the same insight in every section.

## 12.2 Ownership matrix

| Semantic truth | Primary owner | Allowed secondary use |
|---|---|---|
| High-level individual identity | Work Signature | Hero, Work Manual |
| Work-cycle pattern | Work Shape | Pressure, Support Need |
| Pair quadrant | Collaboration Map | Hero, Work Manual |
| Saju person-to-person tendency | Saju Comparison Table | Role Design, Decision Flow |
| Psych axis difference | Selective Psych Comparison | Feedback, Repair |
| Responsibility allocation | Role Design | Work Manual |
| Escalation loop | Pressure Pattern | Conflict Repair |
| Repair sequence | Conflict & Repair | Work Manual |
| Environment hypothesis | Environment Explorer | Final summary only |

## 12.3 Deduplication priority

When multiple modules claim the same insight:

1. preserve the canonical owner,
2. let secondary modules reference consequences,
3. do not restate the same explanation,
4. and do not let the LLM rewrite excerpts into apparent novelty.

---

# 13. Canonical Work Model

## 13.1 Conceptual structure

```ts
interface CanonicalWorkModel {
  schemaVersion: string;
  productVersion: string;
  resolverVersions: Record<string, string>;
  mode: "individual" | "pair" | "team_preview";
  locale: "ko-KR" | "en-US";

  persons: {
    A: CanonicalWorkPerson;
    B?: CanonicalWorkPerson;
  };

  evidence: WorkEvidenceBundle;
  judgments: CanonicalWorkJudgment[];

  individual?: {
    signature?: WorkSignatureJudgment;
    shape?: WorkShapeJudgment;
    contributions?: CanonicalWorkJudgment[];
    supportNeeds?: CanonicalWorkJudgment[];
    pressure?: CanonicalWorkJudgment[];
    feedback?: CanonicalWorkJudgment[];
    leadership?: CanonicalWorkJudgment[];
    environment?: CanonicalWorkJudgment[];
  };

  pair?: {
    collaborationMap?: CollaborationMapJudgment;
    sajuComparison?: WorkSajuComparisonRow[];
    psychSelection?: WorkPsychProjection;
    roles?: RoleDesignJudgment[];
    decisionFlow?: CanonicalWorkJudgment[];
    pressureLoop?: CanonicalWorkJudgment[];
    conflictRepair?: WorkConflictRepairJudgment;
    feedbackRecognition?: CanonicalWorkJudgment[];
  };

  warnings?: WorkWarning[];
  limitations?: string[];
}
```

## 13.2 Canonical person

```ts
interface CanonicalWorkPerson {
  personId: string;
  displayName?: string;
  roleLabel?: string;
}
```

No raw birth data or unnecessary Psych payload should be sent to the client.

## 13.3 Warning contract

```ts
interface WorkWarning {
  warningKey: string;
  severity: "S2" | "S3" | "S4";
  confidence: WorkConfidenceTier;
  evidenceIds: string[];
  independentOfType: boolean;
}
```

Warnings are independent overlays.

They must not be inferred from color, quadrant, or axis extremity alone.

---

# 14. Projection Architecture

## 14.1 Projection principle

The canonical model is not sent directly to the client.

Projectors produce purpose-specific, client-safe shapes.

## 14.2 Projection families

```text
canonical_work_model
  ├─ individual_hero
  ├─ pair_hero
  ├─ work_signature
  ├─ work_shape
  ├─ strengths_support
  ├─ psych_selective
  ├─ saju_comparison_table
  ├─ collaboration_map
  ├─ role_matrix
  ├─ decision_flow
  ├─ pressure_loop
  ├─ conflict_repair
  ├─ feedback_manual
  ├─ environment_explorer
  ├─ final_work_manual
  └─ narrative_context_packages
```

## 14.3 Projection rules

A projector may:

- rename fields for presentation,
- order items,
- select supported judgments,
- attach localized deterministic labels,
- and combine already-resolved display metadata.

A projector may not:

- reclassify,
- calculate a new quadrant,
- change confidence,
- strengthen severity,
- infer missing meaning,
- or mix Psych and Saju provenance.

## 14.4 Client-safe projection

The client receives only what it needs to render.

Exclude:

- raw birth data,
- hidden Psych master payloads,
- internal score math,
- prompt instructions,
- unsupported candidate judgments,
- and private provenance details not needed for display.

---

# 15. Shared Visual Asset Contracts

This section defines Work’s use of shared visual geometry.

It does not create a new shared-design authority above `06_Visual_Design_System.md`.

The final shared asset registry may later be moved into the shared design system.

## 15.1 VA-01 — Selective Psych Radar

### Purpose

Show a small set of Work-relevant Psych differences or similarities.

### Input

```ts
interface WorkPsychProjection {
  selectedAxes: Array<{
    axisKey: string;
    scoreA: number;
    scoreB?: number;
    relationType?: "similarity" | "difference" | "complement" | "tension";
    meaningKey: string;
  }>;
  sourceLabel: "psych";
}
```

### Rules

- default 3–5 axes,
- full 11 only on expansion,
- no danger color for ordinary difference,
- no performance interpretation,
- explanation accompanies the visual.

## 15.2 VA-02 — Saju Comparison Table

### Purpose

Show person A, person B, and between-person meaning.

### Columns

```text
Work tendency | Person A | Person B | Between us | Practical implication
```

### Rules

- source label must remain Saju,
- row meaning must be human language,
- no winner,
- no raw symbol dump,
- every important row should connect to action later.

## 15.3 VA-03 — Collaboration Map

### Purpose

Show the already-resolved pair type across Collaboration Power and Collaboration Comfort.

### Rules

- axes are not grades,
- quadrants are types,
- warning overlay is independent,
- coordinates are not recalculated client-side,
- map must include a one-sentence interpretation.

## 15.4 VA-04 — Role Matrix

### Purpose

Show natural owner, shared owner, support owner, and dangerous ambiguity.

### Rules

- no organizational rank implication,
- role rows must be supported,
- handoff guidance should be visible,
- ownership can be directional.

## 15.5 VA-05 — Work Shape Timeline

### Purpose

Show Start → Structure → Execute → Adjust → Finish.

### Rules

- show tendency and support,
- do not imply measured productivity,
- allow partial stages when evidence is insufficient.

## 15.6 VA-06 — Pressure Loop

### Purpose

Show a recurring escalation or coordination loop.

### Rules

- must be derived from canonical judgments,
- not a decorative summary,
- must include an interruption point,
- must not invent causality.

## 15.7 VA-07 — Decision Flow

### Purpose

Show how information becomes action and where handoffs fail.

### Rules

- decision authority must be explicit when known,
- unknown authority remains unknown,
- confirmation and closure are separate stages.

## 15.8 VA-08 — Repair Sequence

### Purpose

Show the correct sequence for restoring work coordination after friction.

### Rules

- preserve directionality,
- do not reduce repair to apology alone,
- end with an operating-rule change when supported.

## 15.9 Visual explanation contract

Every major visual must answer:

1. What does this represent?
2. Which axes or categories are being used?
3. Why is this visual here?
4. What should the user do with it?

A visual without explanation is incomplete.

---

# 16. Module-to-Technical Contract

## 16.1 Module 1 — Work Signature

Required outputs:

- `work_signature` judgment,
- strength–cost pair,
- support need,
- confidence.

Primary visual:

- individual hero or signature card.

Narrative job:

- recognition, not evaluation.

## 16.2 Module 2 — Work Shape

Required outputs:

- stage states,
- dominant shape,
- one support intervention.

Primary visual:

- VA-05 Work Shape Timeline.

## 16.3 Module 3 — Strengths in Use

Required outputs:

- 2–4 contribution patterns,
- contexts where each becomes useful,
- capability disclaimer where needed.

## 16.4 Module 4 — Friction and Support Needs

Required outputs:

- supported friction pattern,
- likely cost,
- support need,
- warning only when independent evidence exists.

## 16.5 Module 5 — Work Mode Comparison

Required outputs:

- selected Psych axes,
- optional full overview,
- human meaning,
- source label.

Primary visual:

- VA-01 Selective Psych Radar.

## 16.6 Module 6 — Collaboration Map

Required outputs:

- power,
- comfort,
- canonical type,
- continuing-cost overlay,
- confidence.

Primary visual:

- VA-03 Collaboration Map.

## 16.7 Module 7 — Two-Person Comparison

Required outputs:

- Saju comparison rows,
- Psych comparison clearly separated,
- between-person meaning,
- practical consequence.

Primary visuals:

- VA-01 and VA-02 as separate evidence surfaces.

## 16.8 Module 8 — Role Design

Required outputs:

- role rows,
- owner states,
- handoff rules,
- ambiguity warnings.

Primary visual:

- VA-04 Role Matrix.

## 16.9 Module 9 — Decision and Communication Flow

Required outputs:

- directional flow,
- authority,
- closure signal,
- escalation condition.

Primary visual:

- VA-07 Decision Flow.

## 16.10 Module 10 — Pressure Pattern

Required outputs:

- trigger,
- observable response,
- pair loop when relevant,
- interruption point.

Primary visual:

- VA-06 Pressure Loop.

## 16.11 Module 11 — Conflict and Awkwardness Repair

Required outputs:

- conflict entry,
- residual risk,
- repair sequence,
- directional scripts.

Primary visual:

- VA-08 Repair Sequence.

## 16.12 Module 12 — Feedback and Recognition Manual

Required outputs:

- delivery style,
- timing,
- privacy/publicity preference,
- recognition signal,
- do/don’t.

## 16.13 Module 13 — Leadership and Followership

Required outputs:

- authority expression,
- delegation/monitoring pattern,
- challenge behavior,
- counterpart needs.

## 16.14 Module 14 — Environment Fit Explorer

Required outputs:

- 2–4 environment hypotheses,
- enabling conditions,
- draining conditions,
- uncertainty language.

## 16.15 Module 15 — Work Manual

Required outputs:

```text
Use me here
Give me this
Watch me here
Pair me with
Do not assume
When conflict happens
This week
```

Every line must trace to an existing judgment or action key.

The final manual is a projection, not a new reasoning stage.

---

# 17. LLM Contract

## 17.1 LLM role

The LLM may:

- synthesize multiple supported judgments,
- produce human scenes,
- explain why a pattern matters,
- generate directional scripts,
- vary examples by work context,
- and express actions naturally.

## 17.2 LLM prohibitions

The LLM must not:

- classify collaboration type,
- choose map coordinates,
- infer Psych scores from Saju,
- infer Saju meaning from Psych,
- assign role ownership,
- create warnings,
- change confidence,
- change severity,
- recommend hiring/firing/promotion,
- guarantee career success,
- diagnose psychological conditions,
- or invent unsupported workplace history.

## 17.3 Narrative context package

```ts
interface WorkNarrativeContextPackage {
  moduleKey: string;
  locale: "ko-KR" | "en-US";
  subjects: WorkNarrativeSubject[];
  judgments: NarrativeJudgmentView[];
  evidenceSummaries: NarrativeEvidenceSummary[];
  actions?: NarrativeActionView[];
  confidenceLanguage: string;
  limitations?: string[];
  forbiddenClaims: string[];
}
```

The package should contain resolved meaning, not raw engine internals.

## 17.4 No excerpt rewriting

The LLM must not create apparent novelty by paraphrasing earlier copy.

A new module must either:

- add a new supported judgment,
- add a consequence,
- add a directional view,
- add a situation,
- or add an action.

## 17.5 Evidence synthesis minimum

A “fresh realization” should generally use at least two meaningful inputs when the module claims synthesis.

Single-source observations are allowed when clearly labeled and appropriately cautious.

## 17.6 Confidence language map

| Confidence | Language behavior |
|---|---|
| Corroborated | direct but non-deterministic |
| Refined | clear direction with nuance |
| Tentative | possibility / worth watching |
| Insufficient | omit or explicitly state limitation |

## 17.7 Narrative output contract

```ts
interface WorkNarrativeOutput {
  headline?: string;
  body?: string;
  bullets?: string[];
  scripts?: Array<{ speaker?: string; text: string }>;
  action?: string;
}
```

Narrative output must pass validation before attachment.

## 17.8 Narrative validation

Validation should check:

- unsupported claims,
- source confusion,
- confidence overstatement,
- HR-evaluation language,
- career certainty,
- identity absolutism,
- locale leakage,
- prohibited “winner” framing,
- and duplicate insights.

---

# 18. Server / Client Ownership

## 18.1 Server owns

- evidence extraction,
- normalization,
- all classifications,
- confidence,
- severity,
- contradiction resolution,
- map type,
- map coordinates,
- selected axes,
- table bands,
- role ownership,
- warning overlays,
- action keys,
- narrative package construction,
- and safe projection.

## 18.2 Client owns

- layout,
- responsive presentation,
- expansion/collapse,
- tabs,
- visual animation,
- accessible labels,
- source-chip display,
- and user interaction that does not alter truth.

## 18.3 Client must not

- recompute relationship type,
- infer meaning from color,
- derive warnings,
- merge source families,
- substitute generic copy when data is absent,
- or expose stripped internal fields.

## 18.4 Server wrap-only principle

Where legacy outputs already exist, canonical additions should prefer server-side wrapping and projection over risky client recomputation.

---

# 19. Free / Premium Boundary

## 19.1 Free projection

The free experience may include:

- one Work Signature,
- one Work Shape insight,
- one contribution strength,
- one support need,
- a limited pair snapshot,
- and a restrained preview of deeper modules.

## 19.2 Premium projection

Premium may include:

- full selective Psych comparison,
- Saju comparison table,
- Collaboration Map,
- Role Design,
- Decision Flow,
- Pressure Loop,
- Conflict Repair,
- Feedback Manual,
- Leadership/Followership,
- Environment Explorer,
- and final Work Manual.

## 19.3 Boundary rule

Premium depth must come from:

- more supported synthesis,
- more directionality,
- more situations,
- and more actionable coordination.

It must not come from hiding basic truth behind a paywall or manufacturing certainty.

---

# 20. Localization Contract

## 20.1 Canonical key stability

Canonical keys remain language-independent.

Localized strings must not change classification.

## 20.2 Korean requirements

Korean copy should:

- use natural honorific tone,
- avoid excessive corporate jargon,
- preserve directness without humiliation,
- and avoid anonymous “너.”

## 20.3 English requirements

English copy should:

- avoid HR-report stiffness,
- avoid pseudo-clinical personality language,
- preserve confidence hedges,
- and distinguish “tendency” from “ability.”

## 20.4 Locale leakage

No Korean prose may appear in `en-US` output except proper nouns intentionally supplied by users.

No English prose may silently replace Korean deterministic copy.

---

# 21. Versioning

## 21.1 Required versions

The following require explicit versions:

- schema,
- evidence extractors,
- judgment resolvers,
- confidence resolver,
- contradiction resolver,
- projection builders,
- narrative package,
- prompts,
- and localized deterministic copy catalogs.

## 21.2 Version contract

```ts
interface WorkVersionBundle {
  schemaVersion: string;
  evidenceVersion: string;
  resolverVersion: string;
  projectionVersion: string;
  narrativePackageVersion: string;
  promptVersion?: string;
}
```

## 21.3 Migration principle

A migration must identify:

- changed truth,
- changed presentation,
- changed copy only,
- and backward-compatibility impact.

Changing a threshold is a truth change, not a copy edit.

---

# 22. Testing Strategy

## 22.1 Unit tests

Required for:

- evidence normalization,
- axis selection,
- comparison row bands,
- collaboration-map classification,
- continuing-cost overlay,
- role ownership,
- confidence,
- severity,
- contradiction outcomes,
- directionality,
- and null handling.

## 22.2 Symmetry tests

Where a pair judgment is symmetric:

```text
resolve(A, B) == resolve(B, A) with swapped identity fields
```

Where direction matters, tests must verify correct inversion rather than forced equality.

## 22.3 Provenance tests

Every canonical judgment must contain valid evidence IDs.

No evidence ID may point to a stripped or nonexistent source.

## 22.4 Separation tests

Tests must verify:

- Psych values do not arise from Saju,
- Saju table rows do not consume Psych unless an explicitly separate note contract exists,
- and dual-evidence modules preserve labels.

## 22.5 Projection tests

Verify:

- no projector reclassifies,
- client projection contains no raw sensitive payload,
- source labels survive,
- confidence survives,
- and omitted judgments remain omitted.

## 22.6 Fixture tests

Maintain fixtures for:

- similar pair,
- complementary pair,
- powerful but uncomfortable pair,
- comfortable but incomplete pair,
- role ambiguity,
- high continuing cost,
- missing Psych,
- contradictory Psych/Saju,
- and asymmetric manager/report context.

## 22.7 Narrative tests

Narrative tests should assert:

- no unsupported capability claims,
- no hiring/promotion language,
- no profession certainty,
- no source confusion,
- no Korean leakage in English,
- confidence-appropriate wording,
- and advice consistency with the snapshot.

## 22.8 Visual contract tests

Verify:

- radar defaults to selected axes,
- map receives canonical type,
- comparison table includes A/B/between meaning,
- warning overlay is independent,
- and danger styling is not used for ordinary difference.

## 22.9 Regression tests

Existing Work behavior that is intentionally preserved must receive regression coverage before refactoring.

Legacy behavior is not protected merely because it exists.

---

# 23. Observability

## 23.1 Internal metrics

Recommended metrics:

- evidence availability by source family,
- judgment omission rate,
- confidence distribution,
- contradiction frequency,
- module inclusion rate,
- narrative validation failure rate,
- fallback rate,
- and locale leakage rate.

## 23.2 Quality warning signals

Investigate when:

- most users receive the same Work Signature,
- one collaboration quadrant dominates implausibly,
- continuing-cost warnings become common,
- all 11 Psych axes are routinely promoted,
- LLM sections repeat deterministic copy,
- or environment suggestions become profession recommendations.

---

# 24. Privacy and Safety

## 24.1 Data minimization

Retain only the data required for the requested analysis and product operation.

Client projections must not expose raw birth data or hidden survey masters.

## 24.2 Employment-use boundary

The Work system is not designed for:

- hiring,
- promotion,
- termination,
- compensation,
- disciplinary action,
- or employee surveillance.

User-facing and internal documentation should preserve this boundary.

## 24.3 Sensitive inference

The system must not infer:

- medical conditions,
- mental-health diagnoses,
- protected characteristics,
- or legal employability.

## 24.4 Third-party use

Future team features must include clear safeguards against ranking employees or making automated employment decisions.

---

# 25. Performance and Reliability

## 25.1 Deterministic-first efficiency

Deterministic judgments should be cacheable when inputs and resolver versions are unchanged.

## 25.2 Cache boundaries

Potential cache layers:

- normalized person Saju,
- normalized Psych bundle,
- person Work evidence,
- pair Work evidence,
- canonical model,
- and narrative by package/prompt version.

## 25.3 Partial failure

If narrative generation fails:

- deterministic visuals and actions may still render,
- the system must not expose an empty broken module,
- and a deterministic fallback may be used only when authored for that module.

## 25.4 No silent recomputation

Version mismatch should trigger explicit rebuild or migration—not silent mixing of old judgments and new projections.

---

# 26. Suggested File Architecture

This is a target concept, not a mandatory folder structure.

```text
lib/relationship/work/
  evidence/
    workEvidenceTypes.ts
    buildWorkEvidenceBundle.ts
    extractWorkSajuPersonEvidence.ts
    extractWorkSajuPairEvidence.ts
    extractWorkPsychEvidence.ts
    normalizeExplicitWorkContext.ts

  judgments/
    workJudgmentTypes.ts
    resolveWorkSignature.ts
    resolveWorkShape.ts
    resolveContributions.ts
    resolveSupportNeeds.ts
    resolveCollaborationMap.ts
    resolveWorkSajuComparison.ts
    resolveRoleDesign.ts
    resolveDecisionFlow.ts
    resolvePressurePattern.ts
    resolveConflictRepair.ts
    resolveFeedbackRecognition.ts
    resolveLeadershipFollowership.ts
    resolveEnvironmentExploration.ts

  resolvers/
    resolveWorkConfidence.ts
    resolveWorkSeverity.ts
    resolveWorkContradictions.ts
    dedupeWorkJudgments.ts
    selectWorkPsychAxes.ts

  canonical/
    canonicalWorkTypes.ts
    buildCanonicalWorkModel.ts

  projections/
    buildWorkIndividualHero.ts
    buildWorkPairHero.ts
    projectWorkSignature.ts
    projectWorkShape.ts
    projectWorkPsych.ts
    projectWorkSajuComparison.ts
    projectCollaborationMap.ts
    projectRoleMatrix.ts
    projectDecisionFlow.ts
    projectPressureLoop.ts
    projectConflictRepair.ts
    projectFeedbackManual.ts
    projectEnvironmentExplorer.ts
    projectFinalWorkManual.ts

  narrative/
    buildWorkNarrativeContext.ts
    workNarrativeSchemas.ts
    validateWorkNarrative.ts

  localization/
    workCopyKeys.ts
    workDeterministicCopy.ko.ts
    workDeterministicCopy.en.ts

  versioning/
    workVersions.ts
```

Existing paths such as `workColleague/sajuCompareTable.ts`, domain Psych lenses, context output, and current Work view models should be audited against these ownership boundaries before reuse.

---

# 27. Implementation Phases

## Phase 0 — Authority and provenance audit

- confirm current Work entry points,
- inventory existing Work outputs,
- map Saju and Psych provenance,
- identify client-side reclassification,
- identify legacy duplicate logic,
- identify current tests,
- and produce include/exclude plan.

## Phase 1 — Evidence foundation

- define evidence contracts,
- preserve source lineage,
- normalize missing values,
- and create separation tests.

## Phase 2 — Canonical Work model skeleton

- define canonical types,
- wrap current stable outputs,
- establish versioning,
- and produce client-safe projection boundary.

## Phase 3 — Individual vertical slices

Recommended order:

1. Work Signature
2. Work Shape
3. Contributions
4. Support Needs

Each slice must include resolver, projection, tests, and UI attachment.

## Phase 4 — Pair comparison foundation

- selective Psych projection,
- Saju comparison table,
- source labeling,
- and no-mixing tests.

## Phase 5 — Collaboration Map

- power resolver,
- comfort resolver,
- four-type classification,
- continuing-cost overlay,
- projection,
- and visual contract tests.

## Phase 6 — Role and decision architecture

- Role Design,
- Decision Flow,
- communication directionality,
- and authority-context support.

## Phase 7 — Pressure and repair

- Pressure Pattern,
- Loop projection,
- Conflict/Repair,
- directional scripts,
- and residual-state handling.

## Phase 8 — Feedback, leadership, and environment

- Feedback/Recognition,
- Leadership/Followership,
- Environment Explorer,
- and overclaim validation.

## Phase 9 — Final Work Manual

- aggregate action keys,
- dedupe,
- project the operating manual,
- and verify every line has canonical support.

## Phase 10 — Narrative and premium polish

- finalize module context packages,
- bilingual validation,
- narrative consistency,
- and free/premium boundaries.

## Phase 11 — Legacy migration and cleanup

- remove duplicate classifiers,
- retire dead tables/components,
- preserve intended regression behavior,
- and update authority map.

---

# 28. Technical Product Laws

1. The server owns Work truth.
2. The client never re-derives Work truth.
3. Saju and Psych remain independent evidence families.
4. Pair evidence never becomes an individual trait by projection.
5. Confidence never substitutes for severity.
6. Severity never substitutes for confidence.
7. A visual type is not a rank.
8. Collaboration cost is an overlay, not a compatibility grade.
9. Full 11-axis output is optional evidence, not the primary Work story.
10. Every promoted Psych axis must change interpretation or action.
11. Saju comparison rows must become human Work meaning.
12. Shared geometry does not create shared product meaning.
13. Every major visual requires explanation and action relevance.
14. Canonical judgments are resolved once and projected many times.
15. The LLM expresses and synthesizes; it does not classify.
16. Missing evidence fails closed.
17. Contradictory evidence is preserved or narrowed, never averaged blindly.
18. Role Design coordinates work; it does not assign title or status.
19. Environment Fit remains exploratory.
20. No output may become an employee evaluation or employment decision.
21. Every final Work Manual line must trace to canonical evidence.
22. Code is evidence of current behavior, not authority over this document.

---

# 29. Open Technical Decisions

The following require implementation audit or product review before freezing:

1. Exact formulas for Collaboration Power and Collaboration Comfort.
2. Whether coordinates should be 0–100 or normalized internal values.
3. Final Saju comparison row catalog.
4. Exact selective-axis thresholds.
5. Whether full 11-axis radar remains visible by default behind expansion.
6. Exact continuing-cost warning thresholds.
7. Which Work judgments require cross-source corroboration.
8. How current TriScore assets should be retired, renamed, or reused.
9. Whether current Work loop output can be canonicalized or should be rebuilt.
10. Whether team-preview contracts ship in the first implementation.
11. Which deterministic fallback copy is required when LLM output fails.
12. Exact data-retention policy for optional explicit work context.

Open decisions must not be silently settled in UI code.

---

# 30. Technical Review Checklist

Before approving this blueprint, confirm:

- [ ] `05C` remains product authority.
- [ ] Psych and Saju provenance remain separate.
- [ ] The 11-axis model is selectively promoted.
- [ ] The Saju comparison table contains A/B/between meaning.
- [ ] Collaboration Map uses two independent axes.
- [ ] Continuing cost remains an overlay.
- [ ] Role Design does not imply title or rank.
- [ ] Capability and career claims remain bounded.
- [ ] Canonical judgments are server-owned.
- [ ] Projectors cannot reclassify.
- [ ] Client components cannot reclassify.
- [ ] LLM output cannot reclassify.
- [ ] Directionality is supported.
- [ ] Confidence and severity are separate.
- [ ] Contradictions have explicit outcomes.
- [ ] Every major visual has an explanation contract.
- [ ] Free/premium depth is based on synthesis, not false certainty.
- [ ] Bilingual output preserves the same canonical keys.
- [ ] Testing covers symmetry, provenance, nulls, separation, and overclaiming.
- [ ] Final Work Manual actions are traceable.
- [ ] Employment-decision use is explicitly prohibited.

---

# 31. Handoff to 07C

`07C_Work_Implementation_Checklist.md` must translate this blueprint into:

- auditable file-level tasks,
- vertical-slice implementation batches,
- required tests,
- pass/fail gates,
- commit boundaries,
- migration checks,
- and READY TO COMMIT criteria.

`07C` must not redefine the architecture.

It must verify implementation against this document.

---

# 32. Closing Principle

The Work system succeeds when it can explain:

> how a person tends to work,
> how two people change each other’s work,
> where collaboration becomes stronger or more costly,
> and what operating structure makes the relationship more useful.

It fails when it becomes:

- a career fortune report,
- a personality dashboard,
- a compatibility score,
- an employee ranking,
- or an LLM-written collection of plausible workplace advice.

The final technical standard is simple:

> **Resolve the truth once. Preserve the evidence. Project it clearly. Explain it humanly. Turn it into action.**
