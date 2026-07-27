# 07E — Partnership Implementation Checklist

**Version:** 1.0  
**Status:** Canonical Execution SSOT  
**Owner:** Product Engineering  
**Product authority:** `05E_Partnership_Product_Blueprint.md`  
**Technical authority:** `06E_Partnership_Technical_Blueprint.md`  
**Applies to:** Ahaitsme Partnership — Marriage / Cohabitation / Long-term Committed Partnership

---

## 0. Purpose

This document converts the Partnership product and technical blueprints into an executable implementation sequence.

It owns:

- implementation order,
- repository-audit gates,
- batch boundaries,
- canonical artifacts,
- test requirements,
- cache and migration work,
- commit boundaries,
- release gates,
- and explicit deferrals.

It does not reopen product philosophy already frozen in `05E`, or technical ownership already frozen in `06E`.

The implementation goal is not to produce the largest possible couple report.

The goal is to build a traceable shared-life analysis that explains:

- why the partners chose each other,
- what kind of couple they become,
- how their daily life is likely to operate,
- where invisible burden and misunderstanding may accumulate,
- how conflict loops form,
- what repair pathway is most accessible,
- and what helps them continue choosing each other over time.

---

# Part I — Execution Laws

## 1. Non-Negotiable Implementation Laws

1. **Audit before mutation.** Do not rename, move, merge, or delete existing Marriage, Cohabitation, Romantic, or shared relationship outputs before tracing their producers, consumers, tests, cache behavior, and client usage.
2. **Preserve deterministic ownership.** Signal direction, confidence, severity, eligibility, partner binding, and module visibility remain server-owned.
3. **No LLM-created judgment.** The LLM may explain only typed judgments supplied through the narrative package.
4. **No client re-derivation.** The client renders view models and never recomputes relationship meaning.
5. **One judgment, many projections.** Digest, chapter, comparison, loop, action, and closing reflection must share canonical finding IDs.
6. **Current behavior outranks latent tendency for present-tense claims.** Psych evidence owns present behavior when available; underlying tendency may corroborate or refine it.
7. **Context must never be fabricated.** Marriage status, cohabitation, children, finances, careers, caregiving, household structure, and family interference are user context only.
8. **Missing evidence shortens output.** It does not trigger generic filler or invented specificity.
9. **Difference is not automatically dysfunction.** Severity must be resolved independently from evidence confidence and directional difference.
10. **No gender-role assumptions.** Household labor, money, parenting, career sacrifice, care work, and decision authority must be person-bound, never gender-bound.
11. **Kick Point is evidence-based recognition, not sentiment generation.** It must be tied to supported strengths or care patterns.
12. **Relationship safety is outside compatibility inference.** The system must not diagnose abuse, coercion, or clinical conditions from pair signals.
13. **Every batch must be independently testable and commit-safe.**
14. **No mixed-product scope.** Romantic, Friend, Work, Family, or shared-platform modifications must be explicitly justified and audited.
15. **Do not optimize prose before contracts stabilize.** Evidence, resolver, and projection correctness precede copy polish.
16. **Do not create a second Partnership engine when an existing Marriage/Cohabitation runtime can be safely adapted.**
17. **No push unless explicitly requested.**

---

## 2. Status Vocabulary

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No verified implementation work |
| `AUDITED` | Current runtime, contracts, and consumers confirmed |
| `DESIGNED` | Types, resolver ownership, and migration path frozen |
| `IMPLEMENTED` | Code completed locally |
| `TESTED` | Required tests pass |
| `READY_TO_COMMIT` | Diff, tests, and scope audit complete |
| `COMMITTED` | Isolated commit created |
| `DEFERRED` | Explicitly excluded from this release |
| `BLOCKED` | Cannot proceed without a product or architecture decision |

A batch is not complete merely because files were edited.

---

## 3. Required Batch Report Format

Every engineering response must report:

```text
A. Verdict
B. What was audited
C. What changed
D. Files changed
E. Tests run and results
F. Known limitations
G. Git diff scope
H. Commit recommendation
```

For audit-only work, add:

```text
No code modified. No commit created. No push performed.
```

For implementation work, include:

```text
Unrelated working-tree changes excluded.
```

---

# Part II — Target Release Shape

## 4. Launch-Critical Partnership Experience

The first complete Partnership release must support this narrative sequence:

1. **Partnership Hero** — one evidence-safe sentence describing the shared-life relationship
2. **Why You Chose Each Other** — the strongest supported attraction-to-partnership bridge
3. **Who You Become Together** — couple identity and role pattern
4. **How You Run a Life** — reliability, household rhythm, mental load, money, and decisions
5. **Where Love Gets Lost** — love translation gap and strength-to-stress flip
6. **The Loop You Can Get Stuck In** — one primary conflict loop only
7. **How You Return** — repair pathway and concrete entry point
8. **Remember This Person** — evidence-backed Partner Kick Point
9. **The Life You Are Building** — shared direction across values, work, money, family, and future
10. **The Partnership Playbook** — three to five actions linked to canonical findings
11. **Closing Reflection** — dignity-preserving summary without verdict or prediction

Not every module renders for every report.

A module renders only when its minimum evidence contract is satisfied.

---

## 5. Canonical Signal Families Required for Launch

| Signal family | Launch requirement | Minimum source basis |
|---|---:|---|
| `choice_signature` | Yes | two or more supported attraction/recognition/care signals |
| `couple_identity` | Yes | stable synthesis from at least two canonical findings |
| `reliability_pattern` | Yes | practicality, structure, self-control, action/care evidence |
| `household_rhythm` | Yes | structure, energy, stimulation, adaptability, practical behavior |
| `mental_load_distribution` | Yes when eligible | planning/anticipation/follow-through evidence; no task reality invented |
| `money_philosophy` | Yes | practicality, control, stability, decision style; no wealth prediction |
| `decision_power` | Yes | decision style, control, conflict, structure, pair direction |
| `energy_rest_fit` | Yes | energy style, stimulation, recovery-related evidence |
| `career_sacrifice_pattern` | Conditional | current career context or sufficiently bounded tendency evidence |
| `family_boundary_pattern` | Conditional | empathy, conflict, control, recognition, family-context evidence |
| `parenting_alignment` | Conditional | explicit parenting relevance/context only |
| `love_translation_gap` | Yes | directional mismatch between offered care and received meaning |
| `strength_stress_flip` | Yes | one supported strength with bounded stress-cost projection |
| `primary_conflict_loop` | Yes when eligible | two or more directional findings and conflict/recovery evidence |
| `repair_pathway` | Yes | conflict, resilience, empathy, reassurance/recovery evidence |
| `partner_kick_point` | Yes | supported contribution, care, loyalty, or relational strength |
| `shared_life_direction` | Yes | values/direction synthesis; context-gated where required |

The first release does not need every possible sub-signal. It must deliver the above families with traceable evidence and clear omission behavior.

---

# Part III — Batch Overview

## 6. Recommended Implementation Sequence

| Batch | Name | Primary outcome |
|---:|---|---|
| 0 | Partnership Reality Audit | Verified map of current Marriage/Cohabitation/relationship runtime |
| 1 | Canonical Partnership Contracts | Stable types for evidence, signals, findings, projections, and versions |
| 2 | Existing Source Adapters | Current psych, pair, marriage, cohabitation, and tendency data normalized |
| 3 | Shared-Life Operations I | Reliability, household rhythm, mental load, energy/rest |
| 4 | Shared-Life Operations II | Money philosophy, decision power, career sacrifice, family boundary |
| 5 | Love Translation and Stress Flip | Deterministic translation gap and strength-cost logic |
| 6 | Conflict Loop and Repair | One directional loop and one evidence-based repair pathway |
| 7 | Partner Kick Point and Life Direction | Recognition memory and bounded future-direction synthesis |
| 8 | Report Assembly and Projection | Canonical section order, gating, actions, digest, and view model |
| 9 | LLM Narrative Contract | Typed package, schema validation, bilingual narrative parity |
| 10 | Cache, Persistence, and Migration | Capability-aware versioning and legacy-safe regeneration |
| 11 | Client UI Migration | Render-only UI, responsive visual contracts, accessibility |
| 12 | Full QA, Rollout, and Legacy Retirement | Regression, observability, staged release, rollback, cleanup |

Batches 0–2 establish the evidence spine.

Batches 3–7 create Partnership-specific intelligence.

Batches 8–11 deliver the report experience.

Batch 12 is the production gate.

---

# Part IV — Batch 0: Partnership Reality Audit

## 7. Objective

Confirm the actual repository state before any implementation.

No code changes in this batch.

---

## 8. Required Audit Scope

### 8.1 Runtime entry and route integration

Locate and document the exact definitions and callers of:

- Marriage deep-analysis entry points
- Cohabitation deep-analysis entry points
- Romantic deep-analysis entry points used by Marriage/Cohabitation
- premium relationship route integration
- request relationship-kind normalization
- locale resolution and propagation
- report generation and regeneration
- server-side stripping or client projection
- persisted premium-result storage by relationship kind

Do not assume internal names from the blueprints. Record actual symbols and file paths.

### 8.2 Existing report builders and section models

Trace:

- Marriage report builder
- Cohabitation report builder
- any shared couple-report builder
- existing section identifiers and order
- current digest/card system
- current comparison table
- current deep-read or summary sections
- current household/money/chores sections
- current conflict/recovery sections
- current family or in-law sections
- current future or timing sections
- current action/advice outputs

### 8.3 Existing psych plumbing

Confirm:

- exact 11-axis names and score range,
- how `psychA` and `psychB` reach relationship builders,
- whether they travel through shared context or as sibling parameters,
- existing pair-axis helpers,
- null and partial-profile behavior,
- current psych-derived copy,
- and whether psych survives into LLM or client packages.

### 8.4 Existing pair and tendency evidence

Inventory actual availability of:

- relationship indexes,
- cross-hit or pair interaction data,
- day-stem or equivalent pair signals,
- element-related summaries,
- role-play or relational-role signals,
- useful/unhelpful tendency material,
- expression/reassurance/recovery signals,
- balance-of-power or decision signals,
- residual or corroborative evidence,
- and any current Marriage-specific rules.

### 8.5 Existing shared-life modules

Trace producers and consumers for:

- money,
- chores,
- household roles,
- domestic rhythm,
- cohabitation risks,
- decision making,
- career support,
- in-law/family boundaries,
- parenting,
- communication,
- conflict,
- recovery,
- practical compatibility,
- and future/lifecycle guidance.

### 8.6 LLM runtime

Confirm:

- whether current Marriage/Cohabitation output invokes an LLM,
- exact prompt builders,
- model and response schema,
- retry and fallback behavior,
- source excerpts passed to prompts,
- output validators,
- locale-specific prompt behavior,
- and whether the LLM currently creates classifications.

### 8.7 Persistence and cache

Confirm:

- persisted report shape,
- schema/version fields,
- cache key composition,
- relationship-kind partitioning,
- regeneration conditions,
- partial capability detection,
- old-report compatibility,
- and rollback behavior.

### 8.8 Client runtime

Locate and document:

- Marriage and Cohabitation view components,
- shared relationship view-model builders,
- section registries,
- digest components,
- charts, gauges, comparisons, and cards,
- mobile/desktop divergence,
- locale rendering,
- hidden fields,
- and any client-side business logic.

### 8.9 Existing tests

Inventory all relevant:

- unit tests,
- route tests,
- locale tests,
- cache tests,
- schema tests,
- UI/view-model tests,
- snapshot/golden tests,
- scripts,
- and one-off validation files.

---

## 9. Required Audit Deliverables

The audit must return:

1. **Exact runtime chain** from API request to persisted result to UI
2. **Producer → transformer → consumer map** for every relevant field
3. **Current Marriage/Cohabitation overlap and divergence**
4. **Existing signals that map directly to 06E**
5. **Existing signals that require semantic adaptation**
6. **Computed-but-unused fields**
7. **LLM-owned judgments that must move server-side**
8. **Client-side derivations that must move server-side**
9. **Locale and fallback risks**
10. **Cache/version risks**
11. **Minimal mutation path for Batch 1**
12. **Exact proposed Batch 1 file list**

---

## 10. Audit Classification Matrix

Every `05E` module must be classified as one of:

| Classification | Meaning |
|---|---|
| `SUPPORTED_AS_IS` | Current implementation already satisfies product and technical contract |
| `SUPPORTED_BY_ADAPTER` | Existing data is sufficient but needs canonical mapping |
| `SUPPORTED_BY_RECOMBINATION` | No new source required; deterministic synthesis needed |
| `NEW_RULE_REQUIRED` | New deterministic resolver required |
| `USER_CONTEXT_REQUIRED` | Cannot be responsibly inferred without explicit user input |
| `LLM_ONLY_TODAY` | Currently exists only as generated prose and needs ownership correction |
| `CLIENT_DERIVED_TODAY` | Currently recomputed in UI and needs server ownership |
| `DEFERRED` | Explicitly outside launch scope |

---

## 11. Batch 0 Exit Gate

Batch 0 is complete only when:

- actual runtime names are known,
- current Marriage and Cohabitation architectures are compared,
- all 06E launch signals are mapped to current evidence,
- no proposed file is based on an assumed path,
- and the minimal safe Batch 1 plan is approved.

**Commit:** documentation-only audit commit, if requested.  
**No production behavior change.**

---

# Part V — Batch 1: Canonical Partnership Contracts

## 12. Objective

Create the smallest stable type system that can represent Partnership evidence and judgments without rewriting runtime behavior.

---

## 13. Required Contracts

### 13.1 Product and mode identifiers

Freeze:

```ts
type RelationshipKind = "partnership";

type PartnershipMode =
  | "married"
  | "cohabiting"
  | "engaged"
  | "long_term_committed"
  | "shared_life_planning";
```

Where the repository already uses `marriage` or `cohabitation`, add a compatibility strategy rather than blindly renaming keys.

### 13.2 Evidence contract

Implement or adapt a canonical evidence unit containing at minimum:

- evidence ID,
- source kind,
- source key,
- owner/person direction,
- normalized value or state,
- confidence contribution,
- contradiction marker,
- and visibility policy.

### 13.3 Signal contract

Every canonical signal must include:

- stable signal ID,
- eligibility,
- state,
- directionality,
- confidence,
- severity,
- supporting evidence IDs,
- contradictory evidence IDs,
- dependencies,
- and resolver version.

### 13.4 Projection contract

Every user-facing finding must include:

- stable finding ID,
- source signal ID,
- person binding,
- bounded meaning,
- strength,
- possible cost,
- supported adjustment,
- confidence language key,
- severity language key,
- and source-jargon-free labels.

### 13.5 Version contract

Freeze explicit versions for:

- source normalization,
- signal registry,
- projection schema,
- narrative package,
- report schema,
- and client view model.

---

## 14. Contract Rules

- Preserve existing public contracts until consumers are migrated.
- New canonical fields may coexist with legacy fields temporarily.
- Do not store raw prompt prose as the canonical judgment.
- Do not use localized strings as identifiers.
- Do not encode partner direction in display order alone.
- Do not collapse confidence and severity into one field.
- Do not let `null` silently become neutral.

---

## 15. Required Tests

- type/schema validation
- stable ID uniqueness
- A/B direction preservation
- confidence/severity independence
- null versus neutral distinction
- contradiction retention
- legacy compatibility
- locale-independent identifiers
- serialization round trip

---

## 16. Batch 1 Exit Gate

- contracts compile,
- legacy output remains unchanged,
- tests prove directional and null correctness,
- and no new user-facing prose is introduced.

**Suggested commit:** `Add canonical Partnership evidence and judgment contracts`

---

# Part VI — Batch 2: Existing Source Adapters

## 17. Objective

Normalize current evidence into the canonical Partnership source context without changing report presentation.

---

## 18. Required Adapters

### 18.1 Psych adapter

Map the canonical 11 axes:

- stimulation
- self_control
- practicality
- structure
- empathy
- conflict_style
- resilience
- recognition
- energy_style
- thinking_style
- decision_style

The adapter must preserve:

- person A score,
- person B score,
- difference magnitude,
- direction,
- null behavior,
- and source provenance.

### 18.2 Pair-interaction adapter

Normalize current pair evidence without exposing source terminology to the projection layer.

### 18.3 Marriage/Cohabitation adapter

Map current domain-specific signals into shared Partnership evidence while retaining mode-specific context.

Do not merge two signals merely because their current copy sounds similar.

### 18.4 Existing Romantic canonical adapter

Where approved Romantic canonical signals already exist, consume their server-owned projection or signal package rather than re-deriving them.

Likely reusable evidence includes:

- balance of power,
- recovery speed,
- reassurance signal,
- unconscious role play,
- expression speed,
- and residual corroboration.

The audit must confirm actual availability and version compatibility.

### 18.5 User-context adapter

Normalize optional context such as:

- relationship mode,
- cohabitation status,
- shared finances,
- children or parenting plans,
- career transition,
- caregiving,
- family proximity,
- and current major decisions.

Missing context must remain explicitly unknown.

---

## 19. Source Priority Rules

For present-tense behavior:

```text
Current psych behavior
> explicit user context
> pair interaction evidence
> underlying tendency evidence
```

This is not a universal truth hierarchy. It is an implementation rule for present-behavior claims.

Contradictory evidence must be retained and may lower confidence or refine wording.

---

## 20. Required Tests

- full psych profiles
- one missing psych profile
- both psych profiles missing
- partial axis data
- reversed A/B order
- contradictory psych and tendency evidence
- absent user context
- Marriage legacy input
- Cohabitation legacy input
- Romantic-signal presence and absence
- no source-jargon leakage in normalized labels

---

## 21. Batch 2 Exit Gate

- all current usable inputs enter one canonical source context,
- no report copy changes yet,
- provenance survives serialization,
- and unsupported fields remain null rather than fabricated.

**Suggested commit:** `Normalize existing couple evidence for Partnership analysis`

---

# Part VII — Batch 3: Shared-Life Operations I

## 22. Objective

Implement the first group of deterministic shared-life signals:

- reliability pattern,
- household rhythm,
- mental load distribution,
- and energy/rest fit.

---

## 23. Reliability Pattern

### Required behavior

Resolve how each partner tends to make care dependable through:

- follow-through,
- planning,
- consistency,
- practical action,
- self-control,
- and response to changing conditions.

### Required states

At minimum support:

- `mutually_reliable`
- `different_reliability_languages`
- `planner_executor_split`
- `one_sided_follow_through_risk`
- `flexibility_structure_tension`
- `insufficient`

### Prohibitions

- Do not call one partner irresponsible from a single low axis.
- Do not infer actual missed obligations.
- Do not equate spontaneity with unreliability.

---

## 24. Household Rhythm

Resolve preferred daily operating rhythm:

- structured versus fluid,
- active versus quiet,
- social versus private,
- immediate versus deferred task handling,
- and adaptation to interruption.

The resolver describes rhythm fit, not actual chore division.

---

## 25. Mental Load Distribution

### Required distinction

Separate:

1. noticing,
2. anticipating,
3. planning,
4. assigning,
5. executing,
6. checking,
7. and emotional remembering.

### Safety boundary

Without user context, describe likely **load-taking tendencies**, not current household facts.

### Required directional output

The projection must state:

- what A may naturally carry,
- what B may naturally carry,
- what can become invisible,
- and what should be made explicit.

---

## 26. Energy and Rest Fit

Resolve:

- stimulation needs,
- social recovery,
- shared versus separate rest,
- pace mismatch,
- and whether one partner may experience the other’s recovery as distance.

Do not diagnose introversion or extroversion from one signal.

---

## 27. Batch 3 Tests

For every resolver:

- high/high alignment
- low/low alignment
- A-high/B-low
- A-low/B-high
- medium band
- missing A
- missing B
- contradictory supporting source
- reversed person order
- confidence tier changes
- same direction with different severity
- no unsupported current-life claims

---

## 28. Batch 3 Exit Gate

- all four signals are deterministic,
- person direction is stable,
- current household reality is not fabricated,
- and each signal produces a bounded projection and fallback.

**Suggested commit sequence:**

1. `Add Partnership reliability and household-rhythm signals`
2. `Add Partnership mental-load and energy-rest signals`

---

# Part VIII — Batch 4: Shared-Life Operations II

## 29. Objective

Implement:

- money philosophy,
- decision power,
- career and sacrifice pattern,
- and family boundary pattern.

---

## 30. Money Philosophy

### Required dimensions

- security versus experience,
- saving versus flexibility,
- control versus shared trust,
- detail versus big-picture planning,
- risk tolerance,
- and decision transparency.

### Absolute prohibitions

Do not infer:

- income,
- wealth,
- debt,
- spending history,
- financial abuse,
- investment success,
- or future prosperity.

### Required output

The projection must distinguish:

- value difference,
- process difference,
- control difference,
- and actual financial context, which remains unknown unless supplied.

---

## 31. Decision Power

Resolve:

- who initiates,
- who evaluates,
- who needs closure,
- who keeps options open,
- how disagreement affects authority,
- and whether visible leadership differs from hidden veto power.

Do not reduce the result to “dominant” and “submissive.”

---

## 32. Career and Sacrifice Pattern

### Eligibility

This signal is fully enabled only when career or shared-life context exists.

Without context, output may describe bounded tendencies around:

- ambition,
- stability,
- recognition,
- adaptability,
- and willingness to reorganize.

### Prohibitions

Do not infer actual sacrifice, resentment, unemployment, or career outcome.

---

## 33. Family Boundary Pattern

Resolve likely approaches to:

- loyalty to family of origin,
- privacy,
- disclosure,
- obligation,
- emotional mediation,
- and couple-unit protection.

### Context boundary

Do not claim current in-law interference without explicit context.

### Required projection

Explain where one partner may perceive care and the other may perceive intrusion or abandonment.

---

## 34. Parenting Alignment

Parenting is not a standalone launch batch, but Batch 4 must establish its eligibility gate.

Render parenting analysis only when:

- users indicate children,
- parenting plans are relevant,
- or the product mode explicitly requests parenting preparation.

No fertility, child personality, child outcome, or pregnancy prediction is allowed.

---

## 35. Batch 4 Exit Gate

- money and decision signals are launch-ready,
- career and family-boundary outputs are correctly context-gated,
- parenting eligibility is explicit,
- and no gendered or predictive assumptions appear.

**Suggested commit sequence:**

1. `Add Partnership money and decision-power signals`
2. `Add Partnership career and family-boundary signals`

---

# Part IX — Batch 5: Love Translation and Strength–Stress Flip

## 36. Objective

Explain where love becomes misread inside daily responsibility.

---

## 37. Love Translation Gap

### Required structure

Every eligible translation-gap finding must contain:

```text
A intends or offers
↓
B is likely to receive
↓
Why the meaning changes
↓
What translation helps
```

### Supported sources

May combine:

- recognition,
- empathy,
- reassurance,
- practicality,
- structure,
- expression speed,
- decision style,
- conflict style,
- and supported pair evidence.

### Rules

- Require directional evidence.
- Prefer two-source synthesis.
- Do not invent quotations.
- Do not claim private motives.
- Generate at most two translation gaps for launch.

---

## 38. Strength–Stress Flip

### Required structure

```text
Strength
→ when useful
→ under stress
→ possible cost
→ protective adjustment
```

Examples of valid semantic transformations include:

- responsibility → over-control,
- empathy → emotional over-carrying,
- flexibility → inconsistency,
- decisiveness → unilateral closure,
- practicality → emotional compression,
- recognition need → sensitivity to being overlooked.

These are resolver families, not automatic axis labels.

### Rules

- The strength must be supported first.
- The stress cost must be conditional.
- Never turn a tentative source into a severe flaw.
- Select one primary flip and optionally one secondary flip.

---

## 39. Batch 5 Tests

- A-to-B and B-to-A directional symmetry
- different evidence producing different translation gaps
- no output when direction is missing
- contradiction lowering confidence
- strength retained in stress projection
- no pathology language
- one-source tentative output bounded correctly
- duplicate-finding suppression

---

## 40. Batch 5 Exit Gate

- translation gaps are deterministic,
- the report can explain misunderstanding without blame,
- and stress costs remain anchored to supported strengths.

**Suggested commit:** `Add Partnership love-translation and strength-stress findings`

---

# Part X — Batch 6: Primary Conflict Loop and Repair

## 41. Objective

Build one understandable repeating loop and one actionable repair pathway.

---

## 42. Primary Conflict Loop

### Required directional contract

```ts
interface PartnershipConflictLoop {
  trigger: BoundedTriggerFamily;
  stepA: PersonBoundStep;
  stepB: PersonBoundStep;
  escalation: BoundedEscalation;
  hiddenNeedA?: string;
  hiddenNeedB?: string;
  loopCost: string;
  evidenceIds: string[];
  confidence: EvidenceConfidence;
  severity: RelationshipSeverity;
}
```

### Supported loop families

At minimum consider:

- pursue ↔ withdraw
- explain ↔ shut down
- organize ↔ resist
- decide ↔ delay
- fix ↔ seek validation
- criticize ↔ defend
- overfunction ↔ underfunction
- absorb ↔ erupt
- reassure ↔ distrust

The resolver may only select a family supported by current evidence.

### Selection rules

- Select one primary loop for launch.
- Require at least two directional findings.
- Do not infer specific historical incidents.
- Do not label either partner as the cause.
- Preserve uncertainty where loop family competition exists.

---

## 43. Repair Pathway

### Required stages

1. **Stop signal** — how to interrupt escalation
2. **Regulation need** — what each person needs before discussion
3. **Re-entry timing** — immediate, delayed, or staged
4. **Repair language** — bounded, non-scripted guidance
5. **Operational follow-through** — what proves repair in daily life

### Required sources

- conflict style,
- resilience,
- empathy,
- reassurance,
- recovery speed,
- decision style,
- and primary loop evidence.

### Rules

- Repair must fit the selected loop.
- Do not prescribe instant discussion to a partner who needs supported decompression.
- Do not endorse indefinite withdrawal.
- Do not create exact dialogue unless the evidence package supports speaker binding.
- Actions must be feasible and non-clinical.

---

## 44. Batch 6 Exit Gate

- one loop is selected deterministically,
- repair follows the same canonical evidence,
- A/B reversal tests pass,
- and no LLM classification is required.

**Suggested commit:** `Add Partnership conflict-loop and repair-pathway signals`

---

# Part XI — Batch 7: Partner Kick Point and Shared Life Direction

## 45. Objective

Restore emotional memory after operational and conflict analysis, then synthesize future direction without prediction.

---

## 46. Partner Kick Point

### Product role

The Kick Point answers:

> When stress makes this person difficult to recognize, what evidence-backed truth about them should their partner remember?

### Required contract

- partner-bound subject,
- supported contribution or care pattern,
- why it may become invisible,
- one concise recognition line,
- evidence IDs,
- confidence,
- and no invented history.

### Selection rules

Prefer evidence of:

- loyalty,
- practical care,
- emotional steadiness,
- courage,
- persistence,
- repair effort,
- protection,
- humor or lightness when genuinely supported,
- or long-term orientation.

### Prohibitions

- generic romantic compliments,
- fabricated memories,
- “they have always…” claims without evidence,
- destiny language,
- or emotional manipulation.

---

## 47. Shared Life Direction

### Required dimensions

- values,
- home rhythm,
- work and ambition,
- money orientation,
- family and community,
- growth and change,
- and long-term partnership style.

### State model

At minimum:

- `strongly_aligned`
- `aligned_with_method_difference`
- `complementary_with_tradeoffs`
- `requires_explicit_choice`
- `context_needed`
- `insufficient`

### Rules

- Direction is not prediction.
- Important value conflicts must not be softened into “complementary.”
- Current goals require user context.
- The report may identify conversation domains, not decide outcomes.

---

## 48. Partnership Playbook Action Contract

Every action must include:

- action ID,
- linked finding IDs,
- who initiates or whether it is mutual,
- when to use it,
- observable behavior,
- and what problem it addresses.

Launch limit: three to five actions.

Avoid generic advice such as “communicate more.”

---

## 49. Batch 7 Exit Gate

- Kick Point is evidence-backed,
- shared direction is bounded and context-aware,
- actions trace to findings,
- and the report can end with recognition rather than judgment.

**Suggested commit:** `Add Partnership kick-point and shared-life direction synthesis`

---

# Part XII — Batch 8: Report Assembly and Projection

## 50. Objective

Assemble canonical findings into the approved Partnership narrative journey.

---

## 51. Canonical Section Order

Recommended stable section keys:

```text
partnership_hero
choice_signature
couple_identity
shared_life_operations
love_translation
conflict_loop
repair_pathway
partner_kick_point
shared_life_direction
partnership_playbook
closing_reflection
```

Section keys must be stable and locale-independent.

---

## 52. Section Gating

### Always required where evidence exists

- hero
- couple identity
- shared-life operations summary
- repair pathway
- Kick Point
- playbook
- closing reflection

### Conditional

- mental load
- career sacrifice
- family boundaries
- parenting
- conflict loop
- detailed money module
- detailed life-direction module

### Gating rule

A missing conditional section must not create an empty shell or generic filler paragraph.

---

## 53. Hero Contract

The hero must include:

- one relationship essence line,
- one shared strength,
- one bounded tension or growth edge,
- and no score-based verdict.

Hero classification must be deterministic even when headline prose is LLM-generated.

---

## 54. Digest Contract

Launch digest should contain only the most decision-useful findings.

Recommended cards:

1. couple identity
2. shared-life operating pattern
3. primary friction or translation gap
4. repair pathway
5. Kick Point

Do not expose every signal as a badge.

---

## 55. Projection Validation

Every section must verify:

- finding IDs exist,
- person binding is valid,
- confidence language matches tier,
- severity language matches tier,
- no raw source jargon appears,
- no unsupported context appears,
- actions reference rendered or valid hidden findings,
- and duplicate insights are suppressed.

---

## 56. Batch 8 Exit Gate

- the complete deterministic report package assembles,
- section order matches 05E,
- conditional omission works,
- and a deterministic fallback report can render without an LLM.

**Suggested commit:** `Assemble canonical Partnership report projections`

---

# Part XIII — Batch 9: LLM Narrative Contract

## 57. Objective

Add natural synthesis without transferring analytical ownership to the model.

---

## 58. LLM Input Package

The LLM receives only:

- locale,
- safe display names or neutral partner labels,
- section purpose,
- bounded canonical projections,
- confidence/severity language constraints,
- action candidates,
- prohibited claims,
- and output schema.

Do not pass raw chart objects or unexplained source jargon unless a separately validated prompt contract requires them.

---

## 59. LLM Output Requirements

Each generated section must return typed fields such as:

- headline,
- body,
- optional partner-specific observations,
- optional transition,
- and linked finding IDs.

The LLM must not return new signal IDs, scores, classifications, diagnoses, or future events.

---

## 60. Prompt Laws

1. No compatibility verdict.
2. No destiny or fortune-telling language.
3. No blame.
4. No diagnosis.
5. No invented history, dialogue, finances, children, careers, or family events.
6. No excerpt-by-excerpt rewriting.
7. Prefer synthesis across at least two supplied findings where available.
8. Preserve confidence wording.
9. Preserve person direction.
10. Keep strength visible when discussing cost.
11. Avoid repetitive “A is X, B is Y” prose.
12. Korean and English must preserve equivalent meaning, not literal sentence structure.
13. Korean must avoid casual `너` except in explicitly requested dialogue.
14. Use names when available and safe; otherwise stable partner labels.

---

## 61. Validation and Fallback

Reject or regenerate output when:

- required fields are missing,
- finding IDs are unknown,
- person direction changes,
- prohibited language appears,
- unsupported context is introduced,
- locale leaks occur,
- or length limits are violated.

Fallback order:

1. retry with repair prompt,
2. deterministic template,
3. shortened section,
4. omit optional section,
5. fail report only if a required safe fallback is unavailable.

---

## 62. Golden Narrative Fixtures

At minimum include:

- highly aligned practical couple
- emotionally warm but operationally mismatched couple
- structured planner plus flexible adapter
- high-conflict but high-recovery couple
- low-conflict but emotionally distant couple
- money-process mismatch
- family-boundary mismatch
- one missing psych profile
- no user context
- married mode
- cohabiting mode
- Korean locale
- English locale

Golden tests evaluate:

- truth preservation,
- direction,
- confidence,
- warmth,
- repetition,
- unsupported invention,
- safety,
- and locale parity.

---

## 63. Batch 9 Exit Gate

- LLM output is schema-validated,
- deterministic fallback exists for every required section,
- bilingual fixtures pass,
- and the model cannot create relationship truth.

**Suggested commit:** `Constrain Partnership narrative generation`

---

# Part XIV — Batch 10: Cache, Persistence, and Migration

## 64. Objective

Persist the new report safely without invalidating unrelated products or trapping users on stale partial output.

---

## 65. Required Version Fields

Persist or derive:

- Partnership product version,
- source-normalization version,
- signal-registry version,
- projection version,
- narrative schema version,
- locale,
- capability flags,
- and generation timestamp where already supported.

---

## 66. Capability-Aware Cache Validity

A cached report is valid only when:

- relationship kind/mode matches,
- required schema versions are supported,
- required launch modules are present or correctly omitted,
- locale matches,
- and no known incompatible legacy format is detected.

Do not invalidate Romantic, Friend, Work, or Family caches because Partnership changed.

---

## 67. Legacy Migration Strategy

Support one of the following, based on audit findings:

- read-old/write-new adapter,
- regenerate-on-access,
- dual-read during migration,
- or explicit version cutoff.

The chosen strategy must document:

- user impact,
- cost,
- rollback,
- and retirement conditions.

---

## 68. Migration Tests

- new report write/read
- old Marriage report read
- old Cohabitation report read
- stale version regeneration
- locale mismatch regeneration
- partially generated report
- missing optional modules
- failed LLM with deterministic fallback
- rollback to legacy renderer
- unrelated relationship-kind cache preservation

---

## 69. Batch 10 Exit Gate

- persisted output is versioned,
- stale reports are handled intentionally,
- rollback is documented,
- and unrelated products are unaffected.

**Suggested commit:** `Version and migrate Partnership report persistence`

---

# Part XV — Batch 11: Client UI Migration

## 70. Objective

Render the canonical Partnership view model without client-owned analysis.

---

## 71. UI Ownership Rules

The client may own:

- layout,
- interaction,
- expansion state,
- responsive behavior,
- accessibility,
- and visual emphasis.

The client may not own:

- signal classification,
- confidence,
- severity,
- A/B direction,
- module eligibility,
- or fallback logic beyond rendering supplied states.

---

## 72. Required Visual Components

### 72.1 Hero

- concise essence
- shared strength
- bounded growth edge

### 72.2 Paired continua

Use only when both people’s positions are meaningful and not misleading.

Suitable candidates:

- structure ↔ flexibility
- social stimulation ↔ quiet recovery
- fast closure ↔ extended consideration
- security ↔ experience orientation

Do not show false precision.

### 72.3 Shared-life operating map

Group operations into a readable system rather than many disconnected cards.

### 72.4 Conflict-loop diagram

Must preserve direction and avoid visually assigning blame.

### 72.5 Strength-to-cost flip

Show the same trait across supportive and stressed states.

### 72.6 Life-direction map

Show alignment, method difference, and conversation-required areas without a global score.

### 72.7 Partnership Playbook

Three to five actions, each linked to a reason.

---

## 73. Accessibility and Responsive Requirements

- semantic heading order
- keyboard-accessible interactions
- readable without color
- screen-reader labels for diagrams
- mobile-safe card lengths
- no hover-only meaning
- no tiny axis labels
- Korean and English line-break testing
- reduced-motion support where applicable

---

## 74. Client Tests

- stable section order
- conditional section omission
- A/B direction rendering
- long Korean name handling
- English wrapping
- missing optional body fields
- deterministic fallback rendering
- unknown schema rejection
- mobile and desktop snapshots
- accessibility checks
- no raw evidence or source jargon exposed

---

## 75. Batch 11 Exit Gate

- client consumes only the view model,
- all launch sections render accessibly,
- no analytical logic remains in components,
- and the legacy renderer can still be restored during rollout.

**Suggested commit:** `Migrate Partnership report to canonical client view model`

---

# Part XVI — Batch 12: Full QA, Rollout, and Legacy Retirement

## 76. Objective

Prove product correctness, technical safety, editorial quality, and operational reversibility before full release.

---

## 77. Full Regression Matrix

Test combinations across:

### Relationship mode

- married
- cohabiting
- engaged
- long-term committed
- shared-life planning

### Evidence availability

- complete psych A/B
- psych A only
- psych B only
- no psych
- strong corroboration
- contradiction
- sparse pair evidence
- no user context
- rich user context

### Relationship patterns

- high alignment
- high difference, low severity
- high difference, high strain
- strong operations, weak emotional translation
- strong emotion, weak operations
- asymmetric mental-load tendency
- decision-power tension
- money-process difference
- family-boundary tension
- rapid repair
- slow repair
- insufficient loop evidence

### Locale

- `ko-KR`
- `en-US`
- omitted locale legacy behavior, if still supported

### Device

- mobile
- tablet
- desktop

---

## 78. Editorial QA Checklist

Every fixture must be reviewed for:

- does it feel like this couple rather than generic advice?
- does it preserve both people’s dignity?
- is the strength visible before the cost?
- are current facts distinguished from tendencies?
- does the report avoid fatalism?
- does it avoid forced optimism?
- are meaningful differences named clearly?
- is the conflict loop easy to understand?
- is the repair pathway realistic?
- is the Kick Point earned by evidence?
- are actions specific and limited?
- does the ending help the couple remember the relationship, not judge it?

---

## 79. Safety QA Checklist

Reject reports containing:

- divorce or breakup prediction,
- abuse diagnosis,
- mental-health diagnosis,
- fertility or child prediction,
- wealth or debt claims,
- gender-role prescriptions,
- deterministic family interference claims,
- legal or financial advice presented as professional guidance,
- unsupported quotations or memories,
- or “meant to be” / “not meant to be” language.

---

## 80. Observability Requirements

Track at minimum:

- generation success/failure,
- resolver eligibility counts,
- confidence distribution,
- omitted module rates,
- LLM validation failures,
- deterministic fallback rate,
- locale leak failures,
- cache regeneration rate,
- schema incompatibility,
- and client render errors.

Do not log raw sensitive profile content unnecessarily.

---

## 81. Rollout Plan

Recommended stages:

1. local fixtures
2. internal development flag
3. team review
4. limited staging accounts
5. small production percentage
6. monitored expansion
7. default Partnership experience
8. legacy retirement after acceptance criteria are met

---

## 82. Rollback Requirements

Before production rollout, confirm:

- feature flag or equivalent switch,
- legacy report availability,
- schema backward compatibility or safe regeneration,
- no destructive migration,
- and documented rollback owner.

---

## 83. Legacy Retirement Gate

Retire old Marriage/Cohabitation presentation only when:

- new report access is stable,
- critical legacy insights are mapped or explicitly deprecated,
- fallback rates are acceptable,
- locale parity is approved,
- production errors are within threshold,
- and rollback has remained available through the observation period.

Legacy retirement should be a separate commit.

---

# Part XVII — Commit Strategy

## 84. Recommended Commit Boundaries

Suggested isolated sequence:

1. `Document Partnership implementation reality audit`
2. `Add canonical Partnership evidence and judgment contracts`
3. `Normalize existing couple evidence for Partnership analysis`
4. `Add Partnership reliability and household-rhythm signals`
5. `Add Partnership mental-load and energy-rest signals`
6. `Add Partnership money and decision-power signals`
7. `Add Partnership career and family-boundary signals`
8. `Add Partnership love-translation and strength-stress findings`
9. `Add Partnership conflict-loop and repair-pathway signals`
10. `Add Partnership kick-point and shared-life direction synthesis`
11. `Assemble canonical Partnership report projections`
12. `Constrain Partnership narrative generation`
13. `Version and migrate Partnership report persistence`
14. `Migrate Partnership report to canonical client view model`
15. `Add Partnership release regression suite`
16. `Retire legacy Marriage and Cohabitation presentation`

Actual commits may be combined only when the resulting diff remains coherent, reviewable, and rollback-safe.

---

## 85. Pre-Commit Checklist

Before every commit:

- confirm batch scope,
- list included files,
- list excluded unrelated files,
- inspect staged diff,
- run batch-specific tests,
- run relevant product regressions,
- confirm no prompt tuning leaked into deterministic batches,
- confirm no locale leaks,
- confirm no push,
- and state whether the commit is safe.

Required verdict:

```text
READY TO COMMIT
```

or

```text
NOT READY TO COMMIT
```

with explicit blockers.

---

# Part XVIII — Explicit Deferrals

## 86. Deferred from Initial Partnership Release

The following are not authorized by this checklist:

- marriage success probability,
- divorce probability,
- future event timing,
- fertility or pregnancy prediction,
- child personality or outcome prediction,
- exact income or wealth trajectory,
- investment recommendations,
- legal marriage advice,
- tax advice,
- clinical couples diagnosis,
- abuse detection from compatibility signals,
- automatic mediation,
- live conflict monitoring,
- relationship surveillance,
- private-message analysis,
- shared bank-account analysis,
- long-term memory coaching,
- weekly relationship scoring,
- multi-partner household analysis,
- polyamorous relationship architecture,
- family-of-origin multi-person graphing,
- exact city/home recommendations,
- and score-based “best partner” ranking.

Each requires separate product, safety, privacy, and technical approval.

---

## 87. Conditional Follow-Up Candidates

After launch evidence is stable, consider:

- optional shared-life questionnaire,
- saved Partnership Playbook,
- couple check-ins,
- lifecycle-change re-analysis,
- structured money-conversation prompts,
- household load reflection,
- conflict replay based on user-entered events,
- relationship timeline,
- parenting-preparation module,
- and longitudinal growth review.

These are future candidates, not commitments.

---

# Part XIX — Cross-Product Refactor Notes

## 88. Extract Later, Not Now

After Romantic, Friend, Work, Family, and Partnership are all implemented and reviewed, identify duplicated rules for possible extraction into a platform-wide Relationship Intelligence Bible and shared technical contracts.

Likely candidates:

- evidence provenance,
- confidence tiers,
- severity tiers,
- direction symmetry,
- LLM ownership boundaries,
- safety language,
- locale rules,
- fallback hierarchy,
- stable finding IDs,
- action traceability,
- and view-model separation.

Do not perform this extraction during Partnership implementation unless a current shared contract blocks correctness.

Product-specific meaning must remain local.

---

# Part XX — Definition of Done

## 89. Foundation Done

Foundation is complete when:

- actual runtime is audited,
- canonical contracts exist,
- current evidence is normalized,
- provenance is inspectable,
- A/B direction is stable,
- and confidence and severity are independently tested.

---

## 90. Shared-Life Intelligence Done

Partnership-specific intelligence is complete when:

- reliability is distinct from affection,
- household rhythm is distinct from actual chore allocation,
- mental-load tendency is person-bound and non-fabricated,
- money philosophy avoids financial prediction,
- decision power avoids dominance labels,
- family and career modules are context-gated,
- love translation is directional,
- one conflict loop is deterministic,
- repair follows that loop,
- Kick Point is evidence-backed,
- and life direction names choices without predicting outcomes.

---

## 91. Report Experience Done

The experience is complete when:

- the report opens with recognition,
- moves from love into daily life,
- makes invisible labor and misunderstanding understandable,
- shows one clear loop,
- offers one believable path back,
- reminds the partners what is worth protecting,
- limits actions to a useful few,
- and closes without verdict, blame, or fatalism.

---

## 92. Production Done

Production readiness requires:

- versioned persistence,
- safe cache migration,
- deterministic fallbacks,
- validated bilingual narrative,
- render-only client behavior,
- complete fixture coverage,
- observability,
- staged rollout,
- rollback support,
- and approved legacy retirement.

---

# Part XXI — Immediate Next Action

## 93. Start with Batch 0 Only

The next engineering request should be a confirm-only repository audit.

It must not begin implementing money, mental load, conflict loops, prompts, or UI before verifying current code.

Recommended instruction:

```text
Perform 07E Partnership Batch 0 only: Partnership Reality Audit.

Use the following as authority:
- docs/product/05E_Partnership_Product_Blueprint.md
- docs/product/06E_Partnership_Technical_Blueprint.md
- docs/product/07E_Partnership_Implementation_Checklist.md

Do not modify code, commit, or push.

Trace the exact current Marriage, Cohabitation, Romantic, and shared relationship runtime that could support Partnership. Confirm actual entry points, report builders, persisted schema, cache validity, locale propagation, client sections, digest/view-model paths, LLM prompts and validators, psychA/psychB plumbing, existing 11-axis helpers, pair/tendency evidence, and all relevant tests.

For every 05E launch module and every 06E launch signal, classify it as:
SUPPORTED_AS_IS, SUPPORTED_BY_ADAPTER, SUPPORTED_BY_RECOMBINATION, NEW_RULE_REQUIRED, USER_CONTEXT_REQUIRED, LLM_ONLY_TODAY, CLIENT_DERIVED_TODAY, or DEFERRED.

Return:
A. exact file and symbol map
B. end-to-end request → analysis → persistence → client chain
C. Marriage/Cohabitation overlap and divergence
D. producer → consumer map for existing shared-life signals
E. computed-but-unused fields
F. LLM-owned or client-owned judgments that violate 06E
G. cache, locale, schema, and migration risks
H. minimal safe mutation path for Batch 1
I. proposed Batch 1 file list
J. explicit confirmation that no code, commit, or push occurred.
```

---

# Final Execution Standard

The Partnership implementation succeeds only when the system can explain a shared life without pretending to have lived it.

It must distinguish:

- tendency from fact,
- difference from danger,
- strength from stress cost,
- love from logistics,
- and future direction from prediction.

The evidence spine comes first. The narrative follows it. The UI renders it. The LLM never becomes the relationship judge.

> **Build the shared-life truth carefully, then help the couple recognize each other inside it.**
