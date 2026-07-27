# 06B Friend Technical Blueprint

**Document type:** Technical Architecture / Technical SSOT  
**Product:** Ahaitsme — Friend Relationship Experience  
**Status:** Canonical Friend Technical Blueprint  
**Audience:** Engineering, Product, Data, Prompt, QA, Design  
**Purpose:** Define how Friend relationship evidence is transformed into deterministic judgments, projections, and bounded narrative outputs.  
**Product companion:** `05B_Friend_Product_Blueprint.md`  
**Implementation companion:** `07B_Friend_Implementation_Checklist.md`  
**Inherits:** `05_Relationship_Product_Bible.md` · `docs/dev/05_NARRATIVE_STYLE_BIBLE.md`  
**Supersedes:** Any ad hoc Friend-specific inference, prompt-only classification, or UI-owned relationship judgment that conflicts with this document.

---

# 0. Technical Constitution

The Friend product must not ask an LLM to decide what the friendship means.

The system must first determine, through approved evidence and deterministic logic:

- what each person brings,
- which roles are supported,
- which situations are supported,
- what costs may emerge,
- what the pair becomes together,
- how confident each claim is,
- and what may be exposed to the client.

Only after those truths are resolved may an LLM translate them into human language.

The permanent architecture is:

```text
Raw Saju Evidence
        +
Psychological 11-Axis Evidence
        +
Relationship Context
        +
Pair Comparison
        ↓
Evidence Normalization
        ↓
Deterministic Interpretation Engines
        ↓
Canonical Friend View Model
        ↓
Client-Safe Projection
        ↓
Bounded Narrative Generation
        ↓
Rendered Product Experience
```

The system must preserve this direction of authority:

```text
Evidence determines judgment.
Judgment constrains narrative.
Narrative does not create truth.
UI does not infer truth.
```

---

# 1. System Goals

The Friend technical system must support six product truths:

1. What Person A brings Person B.
2. What Person B brings Person A.
3. Where the friendship is most useful or alive.
4. Where strengths become costs.
5. What the pair becomes together.
6. What practical actions follow from the evidence.

The system must also guarantee:

- directionality,
- evidence provenance,
- confidence-aware language,
- separation of confidence and severity,
- no unsupported time prediction,
- no role-as-identity behavior,
- no LLM-owned classification,
- and no client exposure of unstable or sensitive internal evidence.

---

# 2. Architectural Layers

## 2.1 Layer overview

| Layer | Responsibility | May decide truth? |
|---|---|---:|
| Raw evidence | Store source facts and derived chart data | No |
| Normalization | Convert heterogeneous evidence into common forms | No |
| Evidence package | Group evidence by direction, domain, and strength | No |
| Deterministic engines | Resolve roles, gifts, situations, costs, and pair dynamics | Yes |
| Canonical view model | Store approved resolved judgments | Yes, by carrying resolved truth |
| Projection layer | Strip and reshape for client use | No |
| Narrative layer | Express approved truth in natural language | No |
| UI layer | Render hierarchy and interaction | No |

---

## 2.2 Permanent authority rule

A layer may only reduce, reshape, or express truth owned by an earlier authoritative layer.

A downstream layer must never increase certainty.

Examples:

- Narrative may soften a `refined` judgment.
- Narrative may not upgrade it to `corroborated`.
- UI may hide a weak role.
- UI may not invent a replacement role.
- Projection may remove internal evidence.
- Projection may not reinterpret evidence.

---

# 3. Canonical Pipeline

## 3.1 Full pipeline

```text
1. Collect raw Saju and psych sources
2. Normalize evidence
3. Build directional pair evidence
4. Build shared pair evidence
5. Resolve candidate gifts
6. Resolve candidate roles
7. Resolve candidate situations
8. Resolve gift-to-cost conversions
9. Resolve shared pair identity
10. Assign confidence and severity independently
11. Deduplicate overlapping judgments
12. Build canonical Friend view model
13. Project client-safe fields
14. Generate bounded narrative
15. Validate narrative against canonical truth
16. Render modules
```

---

## 3.2 Fail-closed rule

If a judgment cannot be supported at the required evidence level:

- omit it,
- downgrade it,
- or show uncertainty explicitly.

Do not ask the LLM to fill the gap.

---

# 4. Evidence Model

## 4.1 Evidence source families

The Friend engine may consume approved evidence from these families.

### A. Saju pair evidence

Examples:

- day-stem interaction,
- element production/control relationships,
- combinations,
- clashes,
- harms,
- punishments,
- directional support or pressure,
- pair-specific relationship hits,
- combined element patterns,
- cross-pillar interaction summaries,
- existing deterministic relationship signals.

Saju evidence contributes:

- relational direction,
- symbolic role tendency,
- support-pressure pattern,
- activation or inhibition,
- and pair-specific contextual nuance.

Saju evidence must not directly own user-facing behavioral claims unless translated and refined by approved interpretation logic.

---

### B. Psychological 11-axis evidence

Canonical axes:

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

Psych evidence contributes:

- behavioral manifestation,
- support form,
- timing preference,
- energy cost,
- decision behavior,
- communication needs,
- social pace,
- and conflict expression.

---

### C. Pair comparison evidence

Derived forms:

- absolute strength,
- absolute weakness,
- similarity,
- directional gap,
- complementarity,
- amplification,
- mutual low zone,
- tension,
- asymmetry,
- and context-sensitive interaction.

Pair comparison must preserve direction.

Example:

```text
A empathy high / B empathy low
```

is not equivalent to:

```text
B empathy high / A empathy low
```

even when the absolute gap is equal.

---

### D. Relationship context evidence

Friend context determines:

- which source meanings are relevant,
- which outputs are allowed,
- which risks are out of scope,
- and which user questions the system must answer.

Friend context does not convert romantic, family, or work evidence into Friend evidence automatically.

---

### E. Derived deterministic evidence

Approved deterministic builders may create:

- support-style findings,
- role candidates,
- situation candidates,
- gift candidates,
- cost candidates,
- pair-identity candidates,
- confidence summaries,
- and action affordances.

Derived evidence must retain provenance links to its source evidence.

---

# 5. Evidence Normalization Contract

## 5.1 Canonical evidence item

Every normalized evidence item should conform conceptually to:

```ts
type FriendEvidenceItem = {
  id: string;
  sourceType:
    | "saju"
    | "psych"
    | "pair_comparison"
    | "relationship_context"
    | "derived";
  sourceKey: string;
  direction: "A_TO_B" | "B_TO_A" | "SHARED" | "SELF_A" | "SELF_B";
  domain:
    | "support"
    | "stability"
    | "stimulation"
    | "recognition"
    | "perspective"
    | "decision"
    | "conflict"
    | "energy"
    | "adaptability"
    | "trust"
    | "social"
    | "care";
  polarity: "supportive" | "cost" | "mixed" | "neutral";
  strength: number | null;
  confidence: number | null;
  severity: "S0" | "S1" | "S2" | "S3" | "S4" | null;
  tags: string[];
  provenance: FriendEvidenceProvenance[];
};
```

Exact implementation types may differ, but the semantic contract must remain.

---

## 5.2 Provenance contract

Each meaningful judgment must be traceable to one or more evidence items.

Conceptual type:

```ts
type FriendEvidenceProvenance = {
  sourceKey: string;
  sourceLabel?: string;
  rawValue?: unknown;
  normalizedValue?: unknown;
  owner: "saju" | "psych" | "pair" | "resolver";
};
```

Provenance is internal.

Client exposure must be controlled by projection rules.

---

## 5.3 Null handling

Null is meaningful.

A missing axis, weak source, or absent pair signal must not be converted to zero.

Rules:

- `null` means unavailable or unsupported.
- `0` means a valid measured minimum only if the source contract defines it.
- missing evidence reduces confidence.
- missing evidence must not create negative claims.
- the system must not manufacture symmetry when one direction lacks evidence.

---

# 6. Evidence Ownership Matrix

## 6.1 Core ownership

| Product decision | Primary owner | Secondary input | LLM authority |
|---|---|---|---|
| Directional gift A→B | Deterministic Gift Engine | Saju + psych + pair comparison | Wording only |
| Directional gift B→A | Deterministic Gift Engine | Saju + psych + pair comparison | Wording only |
| Primary friendship role | Deterministic Role Engine | Gift evidence + Saju + psych | Wording only |
| Secondary role | Deterministic Role Engine | Gift evidence + situation evidence | Wording only |
| Situation fit | Deterministic Situation Engine | Psych + pair + Saju corroboration | Wording only |
| Gift-to-cost conversion | Deterministic Cost Engine | Role + axis gap + context | Wording only |
| Who you become together | Deterministic Pair Identity Engine | Both directional gifts + shared evidence | Wording only |
| Confidence | Evidence Confidence Engine | Source count + agreement + quality | None |
| Severity | Severity Resolver | Cost evidence + product boundary | None |
| Advice affordance | Deterministic Action Resolver | Judgment + context | Surface phrasing only |
| Headline/body copy | Narrative layer | Canonical view model | Yes, bounded |
| Truth | Deterministic engine | Approved evidence | None |

---

## 6.2 Ownership prohibitions

The following are prohibited:

- prompt-owned role selection,
- UI-owned situation ranking,
- client-side gift inference,
- LLM-owned confidence,
- LLM-owned severity,
- LLM-created evidence,
- LLM-created directionality,
- narrative upgrading a weak judgment,
- and component code assigning product meaning from raw scores.

---

# 7. Directionality Contract

## 7.1 Directional primitives

Friend must distinguish:

```text
A gives B
B receives from A
B may change around A
```

from:

```text
B gives A
A receives from B
A may change around B
```

These are separate truths.

---

## 7.2 Shared truth

A judgment may be marked `SHARED` only when:

- the evidence is genuinely symmetric,
- both directional paths converge,
- or the output describes an emergent pair property.

Shared must not be used merely to simplify UI.

---

## 7.3 Directional view model

Conceptual structure:

```ts
type DirectionalFriendGift = {
  from: "A" | "B";
  to: "A" | "B";
  giftKey: FriendGiftKey;
  roleCandidates: FriendRoleKey[];
  receivedAs: string[];
  enabledChangeKeys: FriendChangeKey[];
  supportedSituations: FriendSituationKey[];
  limitations: FriendCostKey[];
  confidenceTier: FriendConfidenceTier;
  evidenceRefs: string[];
};
```

---

# 8. Gift Engine

## 8.1 Purpose

The Gift Engine resolves what one person brings into the other person’s life.

It must output meaning, not praise.

---

## 8.2 Gift families

Candidate gift families may include:

- emotional presence,
- practical grounding,
- courage,
- stimulation,
- perspective,
- recognition,
- continuity,
- protection,
- social expansion,
- structure,
- recovery support,
- decision clarity,
- play,
- honesty,
- adaptability.

Final enums must be versioned and canonical.

---

## 8.3 Gift resolution inputs

A candidate gift may use:

- source person’s absolute psych strengths,
- recipient person’s likely need or contrasting style,
- pair complementarity,
- Saju support direction,
- pair-specific relationship signals,
- corroboration count,
- and Friend context.

---

## 8.4 Gift resolution principle

A gift is not simply:

```text
Person A is high on axis X.
```

It is:

```text
Person A has a supported capacity
+
Person B is likely to experience that capacity in a specific way
+
The pair evidence supports that directional effect
=
A→B gift candidate
```

---

## 8.5 Illustrative mappings

These are interpretive examples, not final scoring formulas.

| Source capacity | Pair condition | Possible gift |
|---|---|---|
| High empathy | Recipient needs validation or has lower empathy expression | Emotional understanding |
| High practicality | Recipient has lower practicality or decision friction | Reality grounding |
| High stimulation | Recipient is lower stimulation but adaptable | New possibilities |
| High structure | Recipient is less structured | Continuity and organization |
| High recognition | Recipient has lower self-recognition or visible recognition need | Confidence building |
| High resilience | Pair shows support direction | Recovery steadiness |
| Reflective thinking style | Recipient acts quickly | Perspective and reframing |

---

## 8.6 Gift threshold

A gift should normally require:

- at least one strong primary source,
- at least one pair-relevant support condition,
- no major contradiction,
- and confidence above the display threshold.

A single high axis alone should not automatically create a full gift card.

---

## 8.7 Gift transformation

Each displayed gift may include an enabled change:

```text
Gift
→ recipient experience
→ possible change
```

Example:

```text
A brings stimulation
→ B experiences more possibility
→ B may become more willing to try before certainty
```

This transformation belongs inside the gift output.

It must not become a duplicate standalone section unless the Pair Identity Engine creates a genuinely new shared synthesis.

---

# 9. Role Engine

## 9.1 Purpose

The Role Engine summarizes repeated directional functions into memorable role labels.

Roles are compressed interpretations of supported gifts.

Roles are not primitive truths.

---

## 9.2 Candidate role keys

Initial candidate set:

```ts
type FriendRoleKey =
  | "SAFE_HARBOR"
  | "REALITY_ANCHOR"
  | "GROWTH_CATALYST"
  | "JOY_COMPANION"
  | "PERSPECTIVE_GIVER"
  | "STEADY_WITNESS"
  | "QUIET_PROTECTOR"
  | "CONNECTOR"
  | "CONFIDENCE_BUILDER"
  | "CO_CREATOR";
```

This enum is provisional until implementation audit confirms fit with existing code and data.

---

## 9.3 Role derivation

A role candidate should be derived from:

- one or more directional gifts,
- repeated evidence across relevant domains,
- situation coverage,
- role-specific contraindications,
- and confidence.

Example:

```text
emotional presence
+
resilience
+
supportive Saju direction
+
emotional-storm situation
=
SAFE_HARBOR candidate
```

---

## 9.4 Role ranking

The Role Engine may produce:

- primary role,
- secondary role,
- optional situational role.

Ranking should consider:

1. evidence strength,
2. evidence diversity,
3. directional relevance,
4. situation coverage,
5. uniqueness,
6. contradiction,
7. duplication with other roles.

---

## 9.5 Role anti-duplication

Roles with overlapping evidence should not both surface unless they add distinct meaning.

Example:

- `SAFE_HARBOR`
- `QUIET_PROTECTOR`
- `STEADY_WITNESS`

may overlap.

The resolver must choose the smallest set that explains the relationship clearly.

---

## 9.6 Role visibility

A role should be omitted when:

- confidence is insufficient,
- its meaning duplicates a stronger role,
- it relies on one weak source,
- or it risks overclaiming obligation.

---

# 10. Situation Engine

## 10.1 Purpose

The Situation Engine resolves when a friendship’s strengths are most useful.

It answers:

> “When does this friendship shine?”

It must not answer:

> “Which life decade owns this friendship?”

---

## 10.2 Candidate situation keys

Initial canonical candidates:

```ts
type FriendSituationKey =
  | "EMOTIONAL_STORM"
  | "REALITY_CHECK"
  | "NEW_BEGINNING"
  | "LONG_ROAD"
  | "QUIET_RECOVERY"
  | "RECOGNITION_MOMENT"
  | "SOCIAL_EXPANSION"
  | "DEEP_CONVERSATION"
  | "PLAY_AND_RELEASE"
  | "SUDDEN_CHANGE";
```

Final list must remain limited.

Do not create dozens of micro-situations.

---

## 10.3 Situation ownership

A situation is owned primarily by:

- psych behavioral evidence,
- pair complementarity,
- directional gift evidence,
- and deterministic situation rules.

Saju may support or refine the interpretation.

Saju alone should not normally create a full situation.

---

## 10.4 Situation scoring concept

Conceptual model:

```text
Situation Support
=
Relevant Source Capacity
+
Recipient Fit
+
Pair Complementarity
+
Saju Corroboration
+
Role Alignment
-
Contradiction
-
Missingness Penalty
```

Exact weights belong in implementation and tests.

---

## 10.5 Situation evidence examples

| Situation | Likely evidence families |
|---|---|
| Emotional Storm | empathy, resilience, calm energy, support direction |
| Reality Check | practicality, decision style, structure |
| New Beginning | stimulation, adaptability, courage-like activation |
| Long Road | self_control, structure, resilience |
| Quiet Recovery | low stimulation, empathy, calm energy |
| Recognition Moment | recognition, empathy, confidence-building gift |
| Social Expansion | stimulation, social energy, connector role |
| Deep Conversation | thinking style, empathy, conflict style |
| Play and Release | stimulation, joy role, energy compatibility |
| Sudden Change | adaptability, resilience, flexible decision style |

---

## 10.6 Situation selection

Default output:

- top 2 or 3 supported situations,
- one conditional or cost-sensitive situation if useful,
- no pseudo-precision star ratings unless future evidence supports them.

The system should prefer semantic clarity over exhaustive coverage.

---

## 10.7 Situation display contract

Each situation output should contain:

```ts
type FriendSituationJudgment = {
  key: FriendSituationKey;
  rank: number;
  direction: "A_TO_B" | "B_TO_A" | "SHARED";
  contributionAKeys: string[];
  contributionBKeys: string[];
  strengthTier: "primary" | "secondary" | "conditional";
  confidenceTier: FriendConfidenceTier;
  limitationKeys: FriendCostKey[];
  evidenceRefs: string[];
};
```

---

## 10.8 Situation prohibition

The engine must not derive:

- age,
- decade,
- friendship duration,
- date of separation,
- “season of life,”
- or future contact frequency

from situation evidence.

---

# 11. Cost Engine

## 11.1 Purpose

The Cost Engine explains when a genuine strength becomes difficult.

It should preserve the strength while naming the condition that changes its impact.

---

## 11.2 Cost formula

Conceptually:

```text
Strength
+
Wrong timing, excess, mismatch, or expectation
=
Cost
```

Examples:

```text
Practical help
+
recipient needs validation first
=
feels emotionally cold
```

```text
Stimulation
+
recipient is depleted
=
feels like pressure
```

---

## 11.3 Cost families

Candidate cost keys:

```ts
type FriendCostKey =
  | "ADVICE_BEFORE_VALIDATION"
  | "CALM_READ_AS_DISTANCE"
  | "STIMULATION_AS_PRESSURE"
  | "STRUCTURE_AS_RIGIDITY"
  | "SPACE_READ_AS_REJECTION"
  | "CLOSENESS_AS_DEMAND"
  | "HONESTY_AS_HARSHNESS"
  | "SLOWNESS_AS_DISENGAGEMENT"
  | "SPEED_AS_DISREGARD"
  | "ROLE_OVERUSE"
  | "INITIATION_IMBALANCE"
  | "RECOGNITION_MISMATCH";
```

---

## 11.4 Cost ownership

Cost judgments may use:

- a supported strength or role,
- pair difference,
- recipient need,
- conflict-style evidence,
- energy mismatch,
- expectation mismatch,
- and context.

The Cost Engine must not create character condemnation.

---

## 11.5 Cost output contract

A cost judgment should explain:

1. underlying strength,
2. triggering condition,
3. likely felt impact,
4. better interpretation,
5. practical adjustment.

---

# 12. Pair Identity Engine

## 12.1 Purpose

The Pair Identity Engine resolves:

> “Who do we become together?”

This must describe an emergent pair property.

---

## 12.2 Minimum evidence requirement

A Pair Identity judgment should normally require:

- at least one supported A→B gift,
- at least one supported B→A gift,
- one shared or convergent pair signal,
- and no unresolved contradiction that destroys the synthesis.

---

## 12.3 Valid pair identity types

Examples:

- more adventurous together,
- calmer together,
- more honest together,
- more disciplined together,
- more playful together,
- more socially expansive together,
- better at turning ideas into action,
- more able to recover after difficulty.

---

## 12.4 Invalid pair identity

Invalid outputs include:

- “soulmate friends,”
- “destined forever,”
- “the perfect duo,”
- unsupported personality claims,
- or restating one person’s gift twice.

---

## 12.5 Pair identity structure

```ts
type FriendPairIdentity = {
  key: FriendPairIdentityKey;
  sharedEffectKeys: string[];
  contributionAKeys: string[];
  contributionBKeys: string[];
  confidenceTier: FriendConfidenceTier;
  evidenceRefs: string[];
};
```

---

# 13. Action Resolver

## 13.1 Purpose

The Action Resolver converts approved judgments into practical affordances.

It does not write final prose.

---

## 13.2 Action families

```ts
type FriendActionKey =
  | "ASK_FOR_LISTENING"
  | "ASK_FOR_SOLUTIONS"
  | "GIVE_ADVANCE_NOTICE"
  | "INVITE_LOW_PRESSURE_CONTACT"
  | "NAME_APPRECIATION"
  | "ALLOW_RECOVERY_SPACE"
  | "SET_EXPECTATION_BOUNDARY"
  | "SHARE_DECISION_CONTEXT"
  | "REPAIR_AFTER_MISREAD"
  | "CREATE_SHARED_RITUAL"
  | "REDUCE_ROLE_DEPENDENCE"
  | "MATCH_SOCIAL_ENERGY";
```

---

## 13.3 Action selection

Actions must connect to:

- a gift,
- a cost,
- a situation,
- or a role.

No generic action should appear without a traceable judgment.

---

## 13.4 Script generation

The deterministic layer may provide:

- speech act,
- intent,
- required meaning,
- prohibited meaning,
- and directional speaker/receiver binding.

The LLM may realize the final natural sentence.

Example contract:

```ts
{
  actionKey: "ASK_FOR_LISTENING",
  speaker: "A",
  receiver: "B",
  requiredMeaning: [
    "I need listening before solutions",
    "I am not rejecting your practical help"
  ],
  prohibitedMeaning: [
    "You never understand me",
    "Stop giving advice forever"
  ]
}
```

---

# 14. Confidence Engine

## 14.1 Confidence tiers

```ts
type FriendConfidenceTier =
  | "CORROBORATED"
  | "REFINED"
  | "TENTATIVE"
  | "INSUFFICIENT";
```

---

## 14.2 Confidence dimensions

Confidence should consider:

- number of independent sources,
- source reliability,
- directional consistency,
- agreement across source families,
- contradiction,
- missingness,
- pair relevance,
- and rule maturity.

---

## 14.3 Tier meaning

### CORROBORATED

Requirements:

- multiple independent sources,
- agreement across at least two evidence families where applicable,
- low contradiction,
- clear direction.

Allowed language:

- direct tendency statements,
- clear role or situation naming.

---

### REFINED

Requirements:

- meaningful support,
- one important condition or nuance,
- moderate evidence diversity.

Allowed language:

- specific but conditional statements.

---

### TENTATIVE

Requirements:

- limited, mixed, or single-family support,
- useful but uncertain interpretation.

Allowed language:

- “may,” “can,” “in some situations.”

---

### INSUFFICIENT

Requirements:

- missing evidence,
- high contradiction,
- unsupported extrapolation.

Action:

- omit from user-facing output,
- or expose only as unavailable if product design requires it.

---

## 14.4 Confidence is not severity

A strongly supported friction may still be low severity.

A weakly supported risk-like pattern must not be presented as severe.

These dimensions must remain separate in types, logic, prompt, and UI.

---

# 15. Severity Resolver

## 15.1 Severity ladder

```ts
type FriendSeverity =
  | "S0_STRENGTH"
  | "S1_DIFFERENCE"
  | "S2_FRICTION"
  | "S3_STRAIN"
  | "S4_BOUNDARY_OR_SAFETY";
```

---

## 15.2 Severity rules

- S0: useful strength or positive difference.
- S1: neutral or manageable difference.
- S2: recurring friction with an actionable adjustment.
- S3: persistent strain, role imbalance, or repeated disappointment.
- S4: potential boundary or safety concern requiring non-normalization.

Friend compatibility logic must not diagnose S4.

If S4-like content is detected through explicit user input, a separate safety contract should govern response.

---

# 16. Contradiction Resolver

## 16.1 Purpose

Evidence may disagree.

The system must not hide contradiction by averaging everything into vague prose.

---

## 16.2 Contradiction types

- Saju direction conflicts with psych manifestation.
- One axis supports a gift while another limits it.
- A→B and B→A imply different relationship experiences.
- Strong role evidence conflicts with situation evidence.
- Shared interpretation conflicts with directional evidence.

---

## 16.3 Resolution options

1. **Refine**  
   Keep the judgment but add a condition.

2. **Split by context**  
   Show that the trait appears differently in different situations.

3. **Downgrade confidence**  
   Move from corroborated to refined or tentative.

4. **Prefer specific over generic**  
   A context-specific rule may override a broad symbolic direction.

5. **Omit**  
   If contradiction remains unresolved.

---

# 17. Deduplication Engine

## 17.1 Purpose

Friend outputs are naturally repetitive.

The engine must prevent:

- gift duplication,
- role duplication,
- situation duplication,
- cost duplication,
- and pair-identity restatement.

---

## 17.2 Semantic ownership

Each content type owns a different question.

| Content type | Owns |
|---|---|
| Gift | What one person brings to the other |
| Role | The memorable summary of repeated gifts |
| Situation | When the relationship is most useful |
| Cost | When the strength becomes difficult |
| Pair identity | What emerges jointly |
| Action | What to do next |

If two outputs answer the same question with the same evidence, one should be removed or subordinated.

---

## 17.3 Deduplication priority

When overlap occurs, preserve:

1. the most specific judgment,
2. the highest-confidence judgment,
3. the judgment with unique user value,
4. the judgment that best fits its module.

---

# 18. Canonical Friend View Model

## 18.1 Purpose

The canonical view model is the server-owned truth package for the Friend experience.

It must be stable enough for:

- UI rendering,
- narrative generation,
- tests,
- localization,
- and future versioning.

---

## 18.2 Conceptual structure

```ts
type FriendExperienceViewModel = {
  version: "friend_experience_v1";
  people: {
    a: FriendPersonRef;
    b: FriendPersonRef;
  };

  signature: FriendSignatureJudgment | null;

  directional: {
    aToB: DirectionalFriendProfile;
    bToA: DirectionalFriendProfile;
  };

  roles: {
    aForB: FriendRoleSet;
    bForA: FriendRoleSet;
  };

  situations: FriendSituationJudgment[];

  costs: FriendCostJudgment[];

  pairIdentity: FriendPairIdentity | null;

  actions: FriendActionJudgment[];

  horizon: FriendHorizonJudgment | null;

  evidenceMeta: FriendEvidenceMeta;

  narrativeInput: FriendNarrativeInput;
};
```

---

## 18.3 Directional profile

```ts
type DirectionalFriendProfile = {
  gifts: DirectionalFriendGift[];
  primaryGift: DirectionalFriendGift | null;
  enabledChanges: FriendEnabledChange[];
  limitations: FriendCostKey[];
  confidenceTier: FriendConfidenceTier;
};
```

---

## 18.4 Role set

```ts
type FriendRoleSet = {
  primary: FriendRoleJudgment | null;
  secondary: FriendRoleJudgment | null;
  situational: FriendRoleJudgment[];
};
```

---

## 18.5 Evidence metadata

```ts
type FriendEvidenceMeta = {
  overallConfidence: FriendConfidenceTier;
  missingSources: string[];
  contradictions: FriendContradictionSummary[];
  version: string;
  generatedAt?: string;
};
```

---

# 19. Client-Safe Projection

## 19.1 Purpose

The client should receive only what is needed to render the product.

Do not expose:

- raw chart internals,
- unstable evidence,
- model prompts,
- internal weights,
- private provenance,
- unsupported candidate judgments,
- or server-only safety metadata.

---

## 19.2 Projection principles

- server resolves truth,
- client renders truth,
- projection strips internal detail,
- projection preserves directionality,
- projection preserves confidence only where product-approved,
- projection preserves stable canonical keys,
- client does not recalculate roles or situations.

---

## 19.3 Projection concept

```ts
type FriendClientProjection = {
  version: "friend_client_v1";
  hero: FriendHeroProjection;
  gifts: FriendGiftProjection[];
  roles: FriendRoleProjection[];
  situations: FriendSituationProjection[];
  costs: FriendCostProjection[];
  pairIdentity: FriendPairIdentityProjection | null;
  actions: FriendActionProjection[];
  deepRead?: FriendDeepReadProjection;
};
```

---

# 20. Narrative Layer Contract

## 20.1 Narrative role

The LLM may:

- choose natural phrasing,
- create smooth transitions,
- compress evidence,
- adapt tone by locale,
- produce scene-based explanation,
- and realize approved scripts.

The LLM may not:

- choose roles,
- choose situations,
- create gifts,
- create costs,
- assign confidence,
- assign severity,
- infer unsupported childhood or trauma,
- predict friendship lifespan,
- or change directionality.

---

## 20.2 Narrative input

The LLM should receive structured judgments, not raw evidence dumps.

Preferred input:

```ts
type FriendNarrativeInput = {
  locale: string;
  names: { a: string; b: string };
  signature: ApprovedJudgment | null;
  gifts: ApprovedDirectionalJudgment[];
  roles: ApprovedRoleJudgment[];
  situations: ApprovedSituationJudgment[];
  costs: ApprovedCostJudgment[];
  pairIdentity: ApprovedJudgment | null;
  actions: ApprovedActionJudgment[];
  confidenceMap: Record<string, FriendConfidenceTier>;
  forbiddenClaims: string[];
};
```

---

## 20.3 Narrative output

The narrative layer should return content bound to canonical IDs.

```ts
type FriendNarrativeOutput = {
  signature?: NarrativeBlock;
  gifts: Record<string, NarrativeBlock>;
  situations: Record<string, NarrativeBlock>;
  costs: Record<string, NarrativeBlock>;
  pairIdentity?: NarrativeBlock;
  actions: Record<string, NarrativeBlock>;
};
```

Narrative blocks must not exist without a canonical judgment ID.

---

## 20.4 Required narrative behavior

- use names,
- preserve direction,
- attach strength to situation,
- preserve confidence tone,
- explain gift-to-cost conversion,
- avoid generic praise,
- avoid technical jargon,
- avoid deterministic fate language,
- avoid unsupported time claims,
- and keep advice evidence-linked.

---

## 20.5 Prohibited narrative behavior

The LLM must not produce:

- “평생 친구,”
- “절대 배신하지 않는다,”
- “운명적인 우정,”
- “이 친구는 30대에 멀어진다,”
- “한 사람이 더 좋은 친구다,”
- “이 축이 높아서 무조건 이렇다,”
- clinical diagnosis,
- trauma inference,
- moral condemnation,
- or unsupported certainty.

---

## 20.6 Confidence language map

| Tier | Language style |
|---|---|
| Corroborated | direct tendency language |
| Refined | specific conditional language |
| Tentative | possibility language |
| Insufficient | omit |

---

## 20.7 Narrative validation

After generation, validate:

- all canonical IDs are preserved,
- no unknown role/situation keys appear,
- no confidence upgrade,
- no direction reversal,
- no prohibited claim,
- no unsupported time prediction,
- no duplicate module text,
- and no raw technical leakage.

Invalid output must be rejected or regenerated.

---

# 21. Localization Contract

## 21.1 Locale ownership

Locale must be resolved before narrative generation and passed explicitly.

No silent locale switching.

---

## 21.2 Korean

Korean output should be:

- natural,
- warm,
- respectful,
- concise,
- non-clinical,
- and free from excessive technical nouns.

Avoid “너” except in quoted script examples where explicitly approved.

---

## 21.3 English

English output should avoid:

- therapy clichés,
- generic compatibility language,
- overconfident personality verdicts,
- and awkward literal translations from Korean.

---

## 21.4 Canonical key stability

Role, situation, gift, cost, and action keys remain locale-independent.

Only display labels and narrative text are localized.

---

# 22. Free / Premium Technical Boundary

## 22.1 Free projection

Free may expose:

- friendship signature,
- one high-confidence role,
- one directional gift,
- one top situation,
- and one teaser.

---

## 22.2 Premium projection

Premium may expose:

- both directional gift profiles,
- primary and secondary roles,
- multiple situations,
- gift-to-cost conversions,
- pair identity,
- actions,
- deep read,
- and horizon.

---

## 22.3 Boundary rule

The deterministic engine may resolve the full experience once.

Entitlement projection controls visibility.

Do not create different truths for free and premium.

---

# 23. Versioning

## 23.1 Required versioned contracts

Version:

- normalized evidence schema,
- role enum,
- situation enum,
- gift enum,
- cost enum,
- action enum,
- view model,
- client projection,
- prompt input,
- prompt output.

---

## 23.2 Migration principle

New versions may:

- add optional fields,
- refine confidence,
- improve role selection,
- or add new supported situations.

They must not silently reinterpret existing canonical keys.

Breaking semantic changes require new versions.

---

# 24. Testing Strategy

## 24.1 Unit tests

Required deterministic unit tests:

- direction preservation,
- gift selection,
- role ranking,
- situation ranking,
- cost conversion,
- confidence assignment,
- contradiction handling,
- deduplication,
- null handling,
- unsupported omission,
- and projection stripping.

---

## 24.2 Fixture tests

Fixture families should include:

1. high-empathy / low-empathy pair,
2. high-structure / high-stimulation complement,
3. similar low-energy pair,
4. strong practical support but low emotional validation,
5. asymmetric recognition,
6. mixed Saju and psych evidence,
7. missing psych data,
8. contradictory pair signals,
9. weak evidence with no role,
10. high-confidence shared pair identity.

---

## 24.3 Narrative tests

Validate:

- no Korean leaks in English,
- no English leaks in Korean,
- no role invention,
- no situation invention,
- no direction reversal,
- no unsupported certainty,
- no lifespan prediction,
- no duplicate gift/transformation language,
- and correct confidence tone.

---

## 24.4 Snapshot tests

Snapshot stable projections, not raw generated prose.

Generated prose should use rubric-based or contract-based testing.

---

## 24.5 Regression tests

Every canonical enum and resolver branch requires regression coverage before release.

---

# 25. Observability

## 25.1 Recommended internal metrics

Track:

- percentage of reports with primary role,
- percentage with secondary role,
- situation coverage,
- unsupported omission rate,
- contradiction rate,
- narrative validation failure rate,
- fallback rate,
- duplicate suppression rate,
- and locale failure rate.

---

## 25.2 Quality warning signals

Investigate when:

- one role dominates most reports,
- one situation appears excessively,
- most reports receive corroborated confidence,
- pair identity repeats the primary gift,
- LLM regeneration rate rises,
- or missing psych data still produces precise outputs.

---

# 26. Security and Privacy

## 26.1 Data minimization

Narrative generation should receive only:

- required names or safe display names,
- approved judgments,
- approved evidence summaries,
- and locale.

Do not send unnecessary raw birth data or unrelated profile data to the narrative model.

---

## 26.2 Sensitive inference

The system must not infer:

- diagnosis,
- trauma,
- abuse history,
- attachment disorder,
- sexuality,
- criminal behavior,
- or protected traits

from Saju or psych axes.

---

# 27. Performance Principles

## 27.1 Deterministic-first efficiency

Resolve stable judgments before model calls.

Avoid asking the LLM to repeatedly interpret the same raw evidence.

---

## 27.2 Cacheable layers

Potentially cache:

- normalized pair evidence,
- deterministic view model,
- client projection,
- and locale-specific narrative where inputs are unchanged.

---

## 27.3 Partial failure

If narrative generation fails:

- deterministic projections should remain valid,
- the UI may show approved deterministic fallback copy,
- no raw evidence should leak,
- and no unsupported generic filler should be inserted.

---

# 28. Technical Product Laws

These laws are permanent.

```text
Situation ≠ Prediction
Role ≠ Identity
Difference ≠ Problem
Similarity ≠ Compatibility
Confidence ≠ Severity
Gift ≠ Praise
Transformation ≠ Duplicate Gift
Saju Direction ≠ Final Behavior
LLM Copy ≠ Truth
Client Projection ≠ Resolver
```

Additional laws:

1. No single signal owns a report claim.
2. Directionality must survive every layer.
3. Null must not become zero.
4. Unsupported must be omitted.
5. Narrative may reduce certainty but never increase it.
6. A situation must remain a situation.
7. A role must remain flexible.
8. An action must trace to evidence.
9. Free and premium must not create conflicting truths.
10. Server owns canonical interpretation.

---

# 29. Suggested File Architecture

The exact repository may differ, but implementation should preserve separation of concerns.

```text
lib/relationship/friend/
  evidence/
    friendEvidenceTypes.ts
    normalizeFriendEvidence.ts
    buildFriendEvidencePackage.ts

  gifts/
    friendGiftTypes.ts
    resolveFriendGifts.ts

  roles/
    friendRoleTypes.ts
    resolveFriendRoles.ts

  situations/
    friendSituationTypes.ts
    resolveFriendSituations.ts

  costs/
    friendCostTypes.ts
    resolveFriendCosts.ts

  pairIdentity/
    friendPairIdentityTypes.ts
    resolveFriendPairIdentity.ts

  actions/
    friendActionTypes.ts
    resolveFriendActions.ts

  confidence/
    resolveFriendConfidence.ts

  contradictions/
    resolveFriendContradictions.ts

  dedupe/
    dedupeFriendJudgments.ts

  experience/
    friendExperienceTypes.ts
    buildFriendExperienceViewModel.ts

  projectors/
    projectFriendClientView.ts
    projectFriendNarrativeInput.ts

  narrative/
    friendNarrativeTypes.ts
    buildFriendNarrativePrompt.ts
    validateFriendNarrativeOutput.ts
```

---

# 30. Implementation Phases

## Phase 0 — Audit

- inventory current Friend sources,
- inventory existing output fields,
- identify raw versus derived evidence,
- identify prompt-owned judgments,
- identify UI-owned judgments,
- identify locale behavior,
- identify current tests,
- and map gaps against this Blueprint.

No implementation before audit.

---

## Phase 1 — Evidence foundation

- define normalized evidence types,
- preserve directionality,
- add provenance,
- implement missingness,
- build evidence package,
- add unit tests.

---

## Phase 2 — Gift vertical slice

- resolve A→B and B→A gifts,
- attach recipient effect,
- attach enabled change,
- add confidence,
- add projection,
- test independently.

---

## Phase 3 — Role vertical slice

- derive roles from gifts,
- rank primary and secondary,
- suppress duplicates,
- test role visibility.

---

## Phase 4 — Situation vertical slice

- define situation candidates,
- resolve top situations,
- prohibit time inference,
- add situation projections,
- test missing and mixed evidence.

---

## Phase 5 — Cost vertical slice

- connect strength to wrong-context cost,
- preserve underlying gift,
- add reframe and adjustment affordance,
- test severity separation.

---

## Phase 6 — Pair identity

- require both directional contributions,
- synthesize shared result,
- suppress restatement,
- test contradiction handling.

---

## Phase 7 — Action resolver

- map judgments to action keys,
- bind speaker and receiver,
- create script constraints,
- validate direction.

---

## Phase 8 — Canonical view model

- assemble all judgments,
- add evidence metadata,
- version contract,
- snapshot deterministic output.

---

## Phase 9 — Narrative

- build structured prompt input,
- generate bounded copy,
- validate output,
- add bilingual regression tests,
- add fallback behavior.

---

## Phase 10 — UI integration

- render hero,
- gifts,
- roles,
- situations,
- costs,
- pair identity,
- actions,
- deep read,
- and entitlement projection.

UI must not add interpretation logic.

---

# 31. Open Technical Decisions

The following require audit or implementation experiments:

1. Exact score normalization for 11-axis inputs.
2. Exact evidence weighting.
3. Minimum source count for corroborated claims.
4. Final role enum.
5. Final situation enum.
6. Whether role ranking is score-based, rule-based, or hybrid.
7. How Saju support and pressure signals refine gift direction.
8. How missing psych data affects each engine.
9. How contradiction penalties are calculated.
10. How many roles may coexist.
11. Whether pair identity requires a shared Saju signal.
12. Whether action keys are fully deterministic or partly template-driven.
13. Exact client exposure of confidence.
14. Exact fallback copy strategy.
15. Compatibility with current Friend output contracts.
16. Migration path from existing Friend modules.
17. Whether common relationship engine primitives should be extracted after Friend proves stable.

These decisions must not be silently embedded in prompts.

---

# 32. Non-Goals

This Blueprint does not define:

- final UI visual design,
- exact numerical weights,
- final copy,
- database schema,
- pricing,
- marketing language,
- friendship lifespan prediction,
- betrayal detection,
- or safety diagnosis.

Those belong to other approved documents or future specifications.

---

# 33. Definition of Technical Readiness

Friend is technically ready for implementation when:

- current-state audit is complete,
- evidence sources are inventoried,
- directionality is verified,
- role/situation/gift enums are approved,
- canonical view model is accepted,
- confidence rules are testable,
- narrative ownership is bounded,
- unsupported claims are explicitly prohibited,
- client projection is defined,
- and the implementation checklist is created.

---

# 34. Final Technical Principle

The Friend system succeeds when the same underlying evidence produces:

- stable deterministic judgments,
- traceable provenance,
- directionally correct outputs,
- confidence-appropriate language,
- no unsupported predictions,
- and a human narrative that feels personal without inventing truth.

The permanent rule is:

> **Resolve first. Project second. Narrate last.**

And the product-level outcome must remain:

> **Evidence becomes relationship meaning only through a governed, directional, confidence-aware interpretation system.**
