# 07D — Family Implementation Checklist

**Version:** 1.0  
**Status:** Canonical Execution SSOT  
**Owner:** Product Engineering  
**Product authority:** `05D_Family_Product_Blueprint.md`  
**Technical authority:** `06D_Family_Technical_Blueprint.md`  
**Applies to:** Ahaitsme Family — Parent Perspective and Child Perspective

---

## 0. Purpose

This document converts the approved Family product and technical blueprints into an executable implementation sequence.

It owns:

- implementation order,
- audit gates,
- batch boundaries,
- expected artifacts,
- test requirements,
- cache and migration work,
- commit boundaries,
- release gates,
- and explicit deferrals.

It does not reopen product philosophy or technical ownership already frozen in 05D and 06D.

The implementation goal is not to add every possible Family insight.

The goal is to produce a small number of traceable, role-correct, Saju-grounded relationship insights in a coherent emotional sequence.

---

# Part I — Execution Laws

## 1. Non-Negotiable Implementation Laws

1. **Audit before mutation.** Do not rename, move, merge, or delete current Family outputs until their runtime consumers and tests are mapped.
2. **Preserve deterministic ownership.** Classification remains server-owned.
3. **No LLM-created judgment.** The LLM may explain only typed judgments supplied to it.
4. **No client re-derivation.** The client renders projections and never recomputes relationship meaning.
5. **One judgment, many projections.** Hero, chapter, comparison row, scene, and action must share the same canonical source.
6. **Psych and Saju remain distinct evidence types.** They may corroborate or refine each other but may not silently replace one another.
7. **Viewer wording may change; truth may not.** Parent-viewer and child-viewer outputs preserve direction, confidence, severity, and evidence.
8. **Missing evidence shortens output.** It does not trigger invention.
9. **Current environment is never inferred from Saju alone.** Environment preference may be inferred; current residence or household reality requires user context.
10. **Every implementation batch must be independently testable and commit-safe.**
11. **No mixed product scope.** Romantic, Friend, Work, Marriage, and shared infrastructure changes must be excluded unless explicitly required and audited.
12. **Do not optimize prose before evidence contracts are stable.**

---

## 2. Status Vocabulary

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No verified implementation work |
| `AUDITED` | Current behavior and consumers confirmed |
| `DESIGNED` | Types and contracts frozen |
| `IMPLEMENTED` | Code completed locally |
| `TESTED` | Required tests pass |
| `READY_TO_COMMIT` | Diff and scope audit complete |
| `COMMITTED` | Isolated commit created |
| `DEFERRED` | Explicitly excluded from this release |

No batch may be marked complete merely because files were edited.

---

## 3. Required Batch Report Format

Every engineering response for a batch must report:

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

If no code change was requested, the response must state:

```text
No code modified. No commit created. No push performed.
```

---

# Part II — Target Release Shape

## 4. Launch-Critical Family Experience

The first complete Family rebuild must support this narrative sequence:

1. **Family Hero** — the relationship in one accurate sentence
2. **Two People, One Relationship** — each person’s essential pattern
3. **The Translation Gap** — intention versus received meaning
4. **The Relationship Loop** — how the misunderstanding repeats
5. **Love, Care, and Recognition** — how care is offered and recognized
6. **Expectations and Family Roles** — what each believes a parent or child should be
7. **Shared Environment Fit** — whose needs the current or assumed family rhythm serves
8. **Conflict and Repair** — escalation, recovery, and repair entry point
9. **Growth, Learning, and Future Direction** — evidence-safe developmental guidance
10. **The Family Playbook** — three to four actions only
11. **Closing Reflection** — dignity-preserving summary

Not every module must render for every report.

A module renders only when its minimum evidence contract is satisfied.

---

## 5. Canonical Judgment Families Required for Launch

Final identifiers may be refined in Batch 1, but launch requires typed ownership for:

| Judgment family | Required for launch | Current source basis |
|---|---:|---|
| relationship essence | Yes | existing snapshot/index/pair material |
| correction and guidance dynamic | Yes | `correction_style`, `guidance_balance`, psych where available |
| attachment and independence dynamic | Yes | `bond_distance`, role and psych evidence |
| affection and recognition translation | Yes | `affection_expression`, recognition/empathy evidence |
| household emotional climate | Yes | `home_climate` |
| social/recovery rhythm | Yes | `gathering_recovery`, energy-related evidence |
| translation gap | Yes | derived from supported directional judgments |
| repeating relationship loop | Yes | synthesis of two or more supported judgments |
| conflict and repair | Yes | conflict, correction, resilience, pair signals |
| shared environment fit | Yes, evidence-gated | Saju/psych preference plus optional user context |
| growth and learning direction | Yes, tendency only | existing child DNA/talent/study material plus verified evidence |
| future timing | No | deferred unless temporal engine is separately validated |
| family playbook actions | Yes | linked to canonical finding IDs |

---

# Part III — Batch Overview

## 6. Recommended Implementation Sequence

| Batch | Name | Primary outcome |
|---:|---|---|
| 0 | Implementation Reality Audit | Verified map of current runtime, files, tests, and debt |
| 1 | Canonical Family Judgment Contract | Stable typed judgment and evidence schemas |
| 2 | Existing Signal Adapters | Current Family signals projected into canonical judgments |
| 3 | 11-Axis Selective Comparison | Psych evidence mapped without turning axes into chapters |
| 4 | Translation Gap and Relationship Loop | Deterministic cross-axis relationship synthesis |
| 5 | Shared Environment Fit | Separate environment-fit judgment and adaptation-cost logic |
| 6 | Viewer and Role Projection | Parent/child viewer parity and correct person binding |
| 7 | Narrative Report Assembly | Approved 05D emotional sequence and section gating |
| 8 | LLM Narrative Contract | Typed input/output, validation, bilingual parity |
| 9 | Cache, Schema, and Migration | Capability-aware invalidation and legacy safety |
| 10 | Client View Model and UI Migration | Render-only client and evidence-separated visuals |
| 11 | Full QA, Rollout, and Legacy Retirement | Regression, editorial QA, observability, release |

Batches 0–3 establish the foundation.

Batches 4–6 create the Family-specific intelligence.

Batches 7–10 deliver the report experience.

Batch 11 is the shipping gate.

---

# Part IV — Batch 0: Implementation Reality Audit

## 7. Objective

Confirm the actual repository state before implementation.

No product behavior changes in this batch.

---

## 8. Required Audit Scope

### 8.1 Runtime entry and persistence

Locate and document the actual definitions and callers of:

- `runFamilyParentChildDeepAnalysis`
- `buildFamilyParentReport`
- `attachFamilySajuDeepOverlay`
- Family premium route integration
- `result_premium_by_kind.family`
- report format/version validation
- cache read/write and regeneration logic
- server-side client stripping

### 8.2 Client runtime

Locate and document:

- `FamilyParentReportView`
- `buildFamilyReportViewModel`
- section registry or renderer switch
- current Part numbering
- hidden versus visible comparison rows
- current parent/child viewer branching
- current mobile and desktop visual components

### 8.3 Existing Family signals

Trace producers, stored shapes, and consumers for:

- `correction_style`
- `bond_distance`
- `guidance_balance`
- `home_climate`
- `affection_expression`
- `gathering_recovery`
- relationship index
- household roles
- child DNA
- talent/study/wealth material
- growth tunnel
- parent/child role material
- filial frequency/reward
- deep read
- destiny
- SOS
- de-escalation
- prescriptions

### 8.4 Psych availability

Confirm:

- exact 11-axis canonical names,
- score range and null behavior,
- whether each person’s axis data is available at Family build time,
- pair comparison helpers already available,
- whether direction and confidence are persisted,
- and whether psych data survives to the LLM package or client.

### 8.5 Saju evidence

Confirm actual available inputs for:

- element balance,
- day master/day stem interaction,
- Ten Gods or equivalent relational signals,
- useful/unhelpful element material,
- role-related Family logic,
- talent/study/wealth material,
- growth or timing claims,
- and any environment-preference inference.

### 8.6 Existing tests

Inventory all Family-related:

- unit tests,
- route tests,
- locale tests,
- fixtures,
- scripts,
- snapshots,
- cache compatibility tests,
- client render tests,
- and shared relationship tests that could regress.

---

## 9. Audit Deliverable

Create one implementation audit note containing:

```text
1. Exact runtime chain
2. Exact file map
3. Current persisted schema
4. Current visible report order
5. Signal producer → consumer map
6. Psych availability map
7. Saju evidence map
8. Existing test map
9. Duplicate or conflicting concepts
10. Computed-but-unused fields
11. Cache risks
12. Recommended minimal mutation path
```

The audit must classify every 05D module as:

- already supported,
- partially supported,
- supportable by recombination,
- new deterministic rule required,
- user context required,
- or deferred.

---

## 10. Batch 0 Acceptance Criteria

- [ ] No code behavior changed.
- [ ] Every known Family output has a producer and consumer map.
- [ ] Every existing comparison row is traced.
- [ ] Psych and Saju evidence availability is verified, not assumed.
- [ ] Current cache validity mechanism is documented.
- [ ] Parent-viewer and child-viewer behavior is demonstrated with fixtures or code traces.
- [ ] Duplicate concepts are identified.
- [ ] Exact files proposed for Batch 1 are listed.
- [ ] No unrelated domain files are included.

### Commit boundary

Audit documentation only, if repository policy stores implementation audits.

Do not mix type or runtime changes into this commit.

---

# Part V — Batch 1: Canonical Family Judgment Contract

## 11. Objective

Create the stable typed contract that all later Family modules consume.

This batch defines meaning; it does not yet rewrite the report UI or prose.

---

## 12. Required Types

### 12.1 Evidence source

Create or extend a typed source model capable of representing:

```ts
type FamilyEvidenceSource =
  | 'saju_person'
  | 'saju_pair'
  | 'psych_person'
  | 'psych_pair'
  | 'family_role'
  | 'user_context'
  | 'derived_relationship';
```

Final naming may follow repository conventions.

### 12.2 Evidence reference

Each reference must preserve:

- source type,
- source key,
- person binding when applicable,
- direction when applicable,
- normalized value or category,
- confidence,
- and optional explanation metadata.

### 12.3 Canonical finding

Create a typed Family finding with at least:

```ts
interface FamilyFinding {
  id: string;
  kind: FamilyFindingKind;
  direction: FamilyDirection | null;
  classification: string;
  confidence: EvidenceConfidence;
  severity: FamilySeverity;
  evidence: FamilyEvidenceRef[];
  tags: string[];
  actionKeys: string[];
}
```

Do not persist arbitrary LLM prose as canonical classification.

### 12.4 Confidence

Support the frozen tiers:

- `corroborated`
- `refined`
- `tentative`

If the repository already has shared confidence vocabulary, reuse it only after verifying semantic equivalence.

### 12.5 Severity

Keep severity separate from confidence.

Suggested ladder:

- `strength`
- `difference`
- `friction`
- `strain`
- `structural_risk`

Family safety language must not automatically convert every difference into friction.

### 12.6 Direction and role binding

The schema must distinguish:

- parent → child,
- child → parent,
- mutual,
- shared environment,
- and non-directional pair facts.

Never infer direction from display order.

---

## 13. Canonical Kind Freeze

Batch 1 must freeze the first-launch `FamilyFindingKind` list.

Recommended minimum:

```text
relationship_essence
correction_dynamic
guidance_autonomy
bond_independence
affection_translation
recognition_translation
home_climate
gathering_recovery
conflict_repair
translation_gap
relationship_loop
shared_environment_fit
growth_learning_direction
role_expectation_gap
```

Names may change for code clarity, but the semantic set must remain stable through Batches 2–10.

---

## 14. Validation Helpers

Implement deterministic validation for:

- unique finding IDs,
- known finding kinds,
- valid confidence/severity values,
- evidence presence for visible findings,
- valid person references,
- directional consistency,
- action-to-finding links,
- and prohibition of unsupported temporal claims.

---

## 15. Batch 1 Tests

- [ ] Every finding kind validates.
- [ ] Invalid confidence is rejected.
- [ ] Invalid person binding is rejected.
- [ ] Direction cannot silently default from array order.
- [ ] A visible finding without evidence fails validation.
- [ ] Confidence and severity remain independent.
- [ ] Action keys must reference an existing finding.
- [ ] Serialized and parsed findings preserve meaning.

### Commit boundary

Only:

- canonical types,
- validators,
- minimal exports,
- and focused unit tests.

No prompt, UI, cache, or current report-order changes.

---

# Part VI — Batch 2: Existing Signal Adapters

## 16. Objective

Preserve current Family intelligence by adapting existing deterministic outputs into the new canonical finding layer.

Do not replace working rules merely to make them look new.

---

## 17. Required Adapters

Create one explicit adapter/projector per supported current signal:

- correction style → `correction_dynamic`
- guidance balance → `guidance_autonomy`
- bond distance → `bond_independence`
- affection expression → `affection_translation`
- home climate → `home_climate`
- gathering/recovery → `gathering_recovery`

Each adapter must:

1. preserve the current classification,
2. attach exact provenance,
3. bind direction explicitly,
4. calculate confidence without inventing evidence,
5. assign severity conservatively,
6. expose stable tags,
7. and return null when the source signal is absent or invalid.

---

## 18. Duplicate-Concept Reconciliation

Audit and resolve overlapping concepts such as:

- guidance versus correction,
- care versus affection,
- bond distance versus independence,
- home climate versus gathering/recovery,
- SOS versus de-escalation,
- prescription versus playbook action.

Resolution rule:

- one deterministic judgment owns classification,
- another component may project or enrich it,
- two systems must not independently classify the same concept.

Document each ownership decision in code comments or a decision note.

---

## 19. Hidden Comparison Rows

For `affection_expression` and `gathering_recovery`, decide separately whether each becomes:

- visible comparison row,
- narrative-only evidence,
- or conditional UI row.

Do not expose a row merely because it already exists.

The decision must follow 05D density law and report narrative value.

Recommended default:

- `affection_expression`: narrative and comparison candidate
- `gathering_recovery`: environment/recovery evidence, conditionally visible

---

## 20. Batch 2 Tests

For every adapter:

- [ ] known high/low or category fixtures preserve current meaning,
- [ ] null source returns null finding,
- [ ] person direction is correct,
- [ ] evidence key points to the actual source,
- [ ] confidence is deterministic,
- [ ] severity does not exceed source support,
- [ ] serialization preserves category,
- [ ] no LLM dependency exists.

### Regression gate

Run all existing Family comparison and report-body tests.

### Commit boundary

Existing signal adapters, ownership reconciliation, and tests only.

Do not change final report order yet.

---

# Part VII — Batch 3: 11-Axis Selective Comparison

## 21. Objective

Add psych evidence as a selective relationship explanation layer without producing eleven independent chapters or replacing Saju.

---

## 22. Axis Inventory Freeze

Confirm and freeze the actual 11 canonical axes and labels.

Expected conceptual set:

- stimulation
- self-control
- practicality
- structure
- empathy
- conflict style
- resilience
- recognition
- energy style
- thinking style
- decision style

Use repository-native names where they differ.

No alias may silently map to the wrong axis.

---

## 23. Same-Axis Comparison

Implement or reuse deterministic comparison for axes where similarity or gap is directly meaningful.

Minimum candidates:

- empathy ↔ empathy
- structure ↔ structure
- recognition ↔ recognition
- energy style ↔ energy style
- conflict style ↔ conflict style
- resilience ↔ resilience
- thinking style ↔ thinking style
- decision style ↔ decision style

Each comparison must produce:

- similarity/gap category,
- direction when scores differ materially,
- confidence,
- and relationship relevance tags.

Raw score difference alone is not a Family interpretation.

---

## 24. Cross-Axis Directional Comparison

Implement explicit comparison rules only where a Family question justifies them.

Launch candidates:

| Need or behavior | Compared with | Family question |
|---|---|---|
| child autonomy/decision pattern | parent structure/control/guidance | Does support feel like guidance or control? |
| child empathy/sensitivity | parent correction/conflict style | Does correction land as information or rejection? |
| child recognition need | parent affection/recognition expression | Is love being offered in a recognizable form? |
| child energy/recovery style | household gathering/recovery pattern | Does family life restore or drain this person? |
| child thinking style | parent guidance style | Is teaching delivered in a form the child can use? |
| child resilience/recovery | parent conflict/correction speed | Is repair offered before the child can receive it? |
| child practicality/structure | parent expectations | Are expectations realistic for this person’s operating style? |

Every cross-axis rule must specify:

- source A,
- source B,
- direction,
- threshold or classification logic,
- null behavior,
- and prohibited overreach.

---

## 25. Selective Axis Rule

A report should normally surface only axes that:

- explain a major relationship pattern,
- corroborate or refine a Saju judgment,
- distinguish the two people meaningfully,
- or change the recommended action.

Do not surface an axis merely because it is extreme.

Target narrative usage:

- 2–4 axes in the main narrative,
- additional axes in the radar or evidence view,
- no duplicated explanation across multiple chapters.

---

## 26. Psych–Saju Synthesis

Implement a deterministic synthesis descriptor:

- `confirms`
- `refines`
- `tensions`
- `psych_only`
- `saju_only`

This descriptor adjusts explanation confidence and wording.

It must not average unlike scores into a fake unified number.

---

## 27. Batch 3 Tests

- [ ] same-axis similarity fixture,
- [ ] same-axis directional gap fixture,
- [ ] cross-axis parent-high/child-low fixture,
- [ ] reversed direction fixture,
- [ ] midrange/no-material-gap fixture,
- [ ] missing psych fixture,
- [ ] Saju-confirmed psych fixture,
- [ ] Saju-refined psych fixture,
- [ ] Saju-psych tension fixture,
- [ ] no axis moral ranking,
- [ ] no unsupported contrast text.

### Commit boundary

Psych comparison and synthesis only.

No final LLM prose tuning.

---

# Part VIII — Batch 4: Translation Gap and Relationship Loop

## 28. Objective

Create Family’s central explanatory intelligence:

> What one person intends, what the other person receives, and how that difference repeats.

---

## 29. Translation Gap Contract

A valid translation gap requires:

- one supported behavior or tendency from the actor,
- one supported need or receiving pattern from the recipient,
- a directional relationship rule,
- and evidence-safe language that distinguishes intention from impact.

The engine may say:

```text
A protective or corrective approach may be received as pressure by a person who needs more autonomy or processing time.
```

It may not say:

```text
The parent secretly wants to control the child.
```

Intent must never be fabricated.

Use phrases such as:

- “may be intended as”
- “can be received as”
- “is likely to land as”
- “the recurring mismatch appears to be”

according to confidence.

---

## 30. Relationship Loop Contract

A loop requires at least two linked findings.

Recommended structure:

```text
Trigger
→ Person A response
→ Person B interpretation/response
→ Person A escalation or withdrawal
→ Reinforced misunderstanding
→ Repair entry point
```

The loop is not a free-form LLM story.

Server code must provide:

- participating finding IDs,
- trigger category,
- A response category,
- B response category,
- reinforcement category,
- and repair entry point.

---

## 31. Loop Selection

Render one primary loop, not every possible loop.

Ranking should consider:

- evidence confidence,
- severity,
- cross-source corroboration,
- relevance to Family goals,
- and whether a distinct action follows.

Do not choose the most dramatic loop by default.

---

## 32. Batch 4 Tests

- [ ] parent-to-child translation gap,
- [ ] child-to-parent translation gap,
- [ ] mutual gap,
- [ ] intention language remains non-accusatory,
- [ ] no unsupported motive,
- [ ] loop references valid finding IDs,
- [ ] loop requires at least two findings,
- [ ] loop direction remains correct under viewer swap,
- [ ] repair action follows the loop,
- [ ] low-confidence loop is omitted or softened.

### Commit boundary

Translation and loop deterministic logic, types, projectors, and tests.

No UI reordering yet.

---

# Part IX — Batch 5: Shared Environment Fit

## 33. Objective

Create a distinct Family judgment for whether the shared way of living fits each person’s needs.

This must remain separate from emotional `home_climate`.

---

## 34. Environment Dimensions

Launch dimensions may include:

- stimulation level,
- social density,
- privacy and recovery space,
- routine rigidity,
- pace of life,
- autonomy,
- novelty versus familiarity,
- closeness versus distance,
- and achievement pressure versus restoration.

City/countryside, local/abroad, and nature/urban language may appear only when supported by verified Saju rules or explicit user context.

---

## 35. Required Separation

### Home climate

Answers:

> What does the emotional atmosphere of the household feel like?

### Shared environment fit

Answers:

> Does the family’s rhythm, stimulation, structure, and space fit each member equally?

One may be healthy while the other is mismatched.

Do not derive one directly from the other.

---

## 36. Environment Preference Inputs

Allowed inputs:

- verified Saju preference signals,
- selected psych axes,
- existing gathering/recovery signal,
- bond/independence evidence,
- and explicit user-provided environment context.

Prohibited input behavior:

- inferring the current city or country,
- assuming household size,
- assuming parents chose the environment,
- or claiming relocation is required.

---

## 37. Adaptation Cost

Implement an evidence-safe adaptation-cost category such as:

- `low`
- `moderate`
- `high`
- `unknown`

Do not present it as a medical stress score.

It describes how much ongoing adjustment may be required for one person to function within the shared rhythm.

The model must preserve whose adaptation cost is being described.

---

## 38. Action Hierarchy

Environment recommendations must follow this order:

1. micro-adjustment within the current home,
2. protected recovery or stimulation windows,
3. schedule or social-density change,
4. periodic external environment access,
5. larger living arrangement discussion,
6. relocation only as a conditional long-range possibility.

Never jump directly to “move,” “leave home,” or “study abroad.”

---

## 39. User Context Contract

If current-environment questions are added, keep them minimal and optional.

Potential inputs:

- current living density,
- household social activity,
- privacy availability,
- schedule rigidity,
- perceived stimulation,
- and whether the viewer feels restored at home.

User context refines current-fit analysis but must not overwrite core Saju/psych tendencies.

---

## 40. Batch 5 Tests

- [ ] home climate and environment fit can differ,
- [ ] over-stimulation fixture,
- [ ] under-stimulation fixture,
- [ ] privacy/recovery mismatch fixture,
- [ ] autonomy mismatch fixture,
- [ ] user-context absent fixture,
- [ ] user-context refining fixture,
- [ ] adaptation cost person binding,
- [ ] no location invention,
- [ ] no forced relocation recommendation,
- [ ] action hierarchy respected.

### Commit boundary

Environment model, user-context type if needed, projector, actions, and tests.

Do not include broad future-timing work.

---

# Part X — Batch 6: Viewer and Role Projection

## 41. Objective

Ensure one canonical report can be safely and accurately presented to either the parent or the child.

---

## 42. Viewer Projection Schema

Create an explicit projection context containing:

- viewer person ID,
- viewer role,
- counterpart person ID,
- counterpart role,
- parent subtype when available,
- child age/lifecycle band when available,
- locale,
- and approved address labels/names.

Do not rely on implicit array position.

---

## 43. Projection Laws

Under viewer swap:

- classification remains unchanged,
- evidence remains unchanged,
- direction remains unchanged,
- confidence remains unchanged,
- severity remains unchanged,
- explanation focus may change,
- pronouns and role labels must change correctly,
- action ownership may change only where the same action contract explicitly supports it.

Example:

```text
Canonical:
parent correction → child experiences pressure

Parent viewer:
Your guidance may arrive before your child has had enough processing space.

Child viewer:
What feels like pressure may sometimes be your parent’s attempt to guide quickly.
```

Neither projection may invent motive or reverse the finding.

---

## 44. Parent Subtype Boundary

Mother/father/neutral-parent lenses may adjust:

- role-aware examples,
- social expectations,
- and address language.

They may not change the canonical classification unless a verified deterministic rule explicitly uses parent subtype as evidence.

---

## 45. Lifecycle Bands

At minimum support:

- younger child,
- adolescent,
- adult child,
- parent of adult child.

Lifecycle affects:

- examples,
- action feasibility,
- autonomy language,
- and safety framing.

It must not silently alter Saju evidence.

---

## 46. Batch 6 Tests

For every launch finding:

- [ ] parent-viewer rendering,
- [ ] child-viewer rendering,
- [ ] person names remain correct,
- [ ] actor/recipient direction remains correct,
- [ ] mother lens,
- [ ] father lens,
- [ ] neutral parent lens,
- [ ] younger-child action feasibility,
- [ ] adult-child autonomy language,
- [ ] no “you” ambiguity in Korean,
- [ ] Korean/English role parity.

### Commit boundary

Viewer context, projections, and tests only.

No new classification rules.

---

# Part XI — Batch 7: Narrative Report Assembly

## 47. Objective

Replace inventory-led presentation with the 05D emotional arc while preserving supported existing content.

---

## 48. Assembly Pipeline

Target assembly:

```text
canonical findings
  → relevance ranking
  → module eligibility
  → deduplication
  → narrative arc ordering
  → projection packages
  → optional LLM explanation
  → validated report sections
  → client-safe view model
```

---

## 49. Module Eligibility

Define deterministic minimum evidence for each module.

### Family Hero

Requires:

- one high-value relationship essence,
- plus one supporting finding.

### Two People, One Relationship

Requires:

- at least one supported person tendency for each person,
- and explicit relationship meaning.

### Translation Gap

Requires:

- valid directional translation finding.

### Relationship Loop

Requires:

- valid loop with at least two findings.

### Love, Care, and Recognition

Requires:

- affection or recognition evidence.

### Expectations and Family Roles

Requires:

- role expectation, guidance, autonomy, or bond evidence.

### Shared Environment Fit

Requires:

- valid environment finding.

### Conflict and Repair

Requires:

- conflict/correction/recovery evidence and one repair action.

### Growth, Learning, and Future Direction

Requires:

- verified tendency evidence.

Temporal claims require a separately approved temporal source.

### Family Playbook

Requires:

- two or more valid actions linked to findings.

### Closing Reflection

Requires:

- report-level synthesis; it may not introduce new claims.

---

## 50. Density and Ranking

Implement a report budget.

Recommended launch constraints:

- 1 hero insight,
- 3–5 primary findings,
- 1 primary relationship loop,
- 0–1 environment module,
- 0–1 growth module,
- 3–4 actions,
- and no repeated claim across modules.

Ranking factors:

- confidence,
- relationship relevance,
- actionability,
- distinctiveness,
- severity,
- and narrative coverage.

Do not rank solely by extremity or raw score gap.

---

## 51. Current Section Disposition

Batch 7 must publish a final mapping for every current section:

- retained as-is,
- retained but projected through canonical findings,
- merged,
- moved,
- hidden,
- legacy-only,
- or retired.

Recommended direction:

| Current material | Target disposition |
|---|---|
| snapshot/index | feed Family Hero and relationship essence |
| Saju comparison table | retained as evidence view, not narrative spine |
| household roles | feed expectations/roles module |
| 11-axis radar | retained as psych evidence view |
| child DNA | feed Two People and Growth modules |
| talent/study/wealth | selectively feed Growth module |
| growth tunnel | retain only evidence-safe tendency content |
| parent/child role material | merge into role and viewer projections |
| filial frequency/reward | audit for dignity and merge or retire |
| deep read | repackage as module prose; avoid duplicate standalone authority |
| destiny | rename/reframe or retire deterministic claims |
| SOS/de-escalation | merge into Conflict and Repair |
| prescriptions | convert to finding-linked Family Playbook |

No retirement occurs until parity is tested.

---

## 52. Batch 7 Tests

- [ ] approved module order,
- [ ] optional module omission,
- [ ] no empty Part 1,
- [ ] no duplicate claim,
- [ ] hero contains no unsupported classification,
- [ ] comparison table is not confused with psych radar,
- [ ] playbook actions reference findings,
- [ ] closing introduces no new evidence,
- [ ] Saju-only report remains coherent,
- [ ] low-evidence report is shorter, not generic filler.

### Commit boundary

Assembler, module eligibility, ranking, deduplication, report schema, and tests.

Keep client visual redesign separate unless minimal wiring is unavoidable.

---

# Part XII — Batch 8: LLM Narrative Contract

## 53. Objective

Use the LLM to create a compelling, concise, beginning-to-end explanation without allowing it to decide facts.

---

## 54. LLM Input Package

The prompt package should contain only validated, client-safe or server-internal narrative inputs such as:

- viewer context,
- selected canonical findings,
- evidence summaries,
- confidence and severity,
- approved translation gap,
- approved relationship loop,
- approved actions,
- module target,
- locale,
- tone and length constraints,
- and prohibited claims.

Do not provide broad raw data and ask the model to “analyze the family.”

---

## 55. LLM Output Schema

Use typed structured output.

Suggested module fields:

```text
headline
body
scene
reframe
action_bridge
```

Not every module requires every field.

The output may not contain:

- classification,
- score,
- new finding ID,
- changed direction,
- changed confidence,
- changed severity,
- or unsupported future prediction.

---

## 56. Narrative Laws

The prompt and validator must enforce:

1. recognition before advice,
2. relationship as protagonist,
3. intention versus impact distinction,
4. one insight per paragraph,
5. concrete scene only when grounded,
6. no diagnosis,
7. no blame,
8. no fate language,
9. no generic filler,
10. no repeated claim,
11. no invented family event,
12. no “good parent/bad child” moral ranking,
13. concise emotional arc,
14. Korean and English meaning parity.

---

## 57. Post-Validation

Validate LLM output against:

- allowed finding IDs,
- prohibited terms and claims,
- role/name binding,
- locale leaks,
- length budgets,
- action consistency,
- future certainty,
- and schema completeness.

On validation failure:

1. retry once with the violation supplied,
2. otherwise use deterministic fallback copy,
3. record the fallback path,
4. never return unvalidated prose.

---

## 58. Batch 8 Tests

- [ ] structured output parsing,
- [ ] malformed output fallback,
- [ ] invented finding rejection,
- [ ] role swap rejection,
- [ ] unsupported motive rejection,
- [ ] deterministic future rejection,
- [ ] Korean locale leak test,
- [ ] English locale leak test,
- [ ] meaning parity fixture,
- [ ] low-confidence hedge fixture,
- [ ] repeated claim detection,
- [ ] action contradiction detection.

### Commit boundary

Prompt package, structured schema, validator, deterministic fallback, and tests.

Do not combine with broad visual work.

---

# Part XIII — Batch 9: Cache, Schema, and Migration

## 59. Objective

Ensure old Family reports are not mistakenly treated as complete under the new capability set.

---

## 60. Version Requirements

Introduce or extend:

- report schema version,
- Family capability version,
- narrative package version,
- and optional prompt version.

Capability version must reflect whether the payload contains required launch features such as:

- canonical findings,
- explicit provenance,
- viewer projection support,
- shared environment capability,
- and new module assembly.

A matching old format string alone is insufficient.

---

## 61. Cache Validity Law

A cached report is reusable only when:

- schema is supported,
- capability version satisfies current minimum,
- required role/viewer metadata exists,
- locale is compatible,
- required projections are present,
- and migration policy explicitly permits reuse.

Otherwise:

- regenerate,
- migrate deterministically,
- or show a clearly supported legacy renderer.

Do not silently pretend legacy content is the new report.

---

## 62. Migration Strategy

Choose and document one strategy per legacy generation:

### Regenerate

Preferred when raw inputs remain available and regeneration cost is acceptable.

### Deterministic migration

Allowed only when new canonical findings can be created without inventing missing evidence.

### Legacy display

Allowed temporarily when regeneration is impossible.

Must be clearly routed and scheduled for retirement.

---

## 63. Batch 9 Tests

- [ ] current capability cache hit,
- [ ] old format rejection,
- [ ] same format but missing capability rejection,
- [ ] locale mismatch behavior,
- [ ] missing viewer metadata behavior,
- [ ] deterministic migration fixture,
- [ ] regeneration fixture,
- [ ] legacy display fixture if retained,
- [ ] client stripping after migration,
- [ ] no sensitive context leak.

### Commit boundary

Versioning, cache validity, migration, route wiring, and tests only.

---

# Part XIV — Batch 10: Client View Model and UI Migration

## 64. Objective

Render the new Family experience without moving judgment logic to the client.

---

## 65. View Model Contract

The server or shared safe projector should deliver a client-safe model containing:

- module order,
- visible headings,
- validated narrative fields,
- comparison rows,
- radar data,
- evidence labels where appropriate,
- actions,
- viewer-safe role labels,
- and optional omission reasons for internal QA only.

The client must not receive unnecessary raw psych or Saju internals.

---

## 66. Visual Separation

The UI must distinguish:

### Saju comparison

- categorical relational patterns,
- Saju provenance,
- role-aware comparison.

### 11-axis psych radar

- human-readable psych dimensions,
- two-person pattern comparison,
- not presented as destiny or Saju.

### Relationship narrative

- selected synthesis,
- not a third independent scoring system.

---

## 67. Section Migration

Implement the approved module sequence.

Requirements:

- true opening module,
- no “Part 2” start,
- optional modules collapse cleanly,
- mobile reading remains coherent,
- actions remain visually distinct,
- source/evidence details do not overwhelm the main narrative,
- and the report remains scannable without becoming a card inventory.

---

## 68. Progressive Disclosure

Primary report surface shows:

- the few essential insights,
- the relationship loop,
- one environment insight when eligible,
- and the playbook.

Secondary disclosure may show:

- full Saju comparison rows,
- full radar,
- additional evidence notes,
- or technical provenance labels.

Do not make the main report read like an audit log.

---

## 69. Batch 10 Tests

- [ ] module order render test,
- [ ] optional module omission,
- [ ] parent-viewer screenshot/DOM fixture,
- [ ] child-viewer screenshot/DOM fixture,
- [ ] Korean responsive layout,
- [ ] English responsive layout,
- [ ] long-name handling,
- [ ] Saju table and radar labeling,
- [ ] no client classification helper,
- [ ] no raw private context exposure,
- [ ] legacy route behavior where retained.

### Commit boundary

View model, renderers, styles, and client tests.

Do not include unrelated global visual redesign.

---

# Part XV — Batch 11: Full QA, Rollout, and Legacy Retirement

## 70. Objective

Prove that the report is technically correct, emotionally coherent, and safe enough to replace the current Family experience.

---

## 71. Minimum Fixture Matrix

Run full report generation for:

1. supportive, high-similarity pair
2. strong guidance/autonomy gap
3. correction/sensitivity mismatch
4. affection/recognition mismatch
5. conflict-speed/recovery mismatch
6. home climate tension without environment mismatch
7. environment mismatch without hostile home climate
8. over-stimulation adaptation cost
9. under-stimulation adaptation cost
10. mixed Saju and psych evidence
11. Saju-only report
12. parent viewer
13. child viewer
14. mother lens
15. father lens
16. neutral parent lens
17. younger child
18. adolescent
19. adult child
20. old cache payload
21. missing optional evidence
22. low-confidence report
23. Korean report
24. English report

---

## 72. Technical Release Gates

- [ ] All Family unit tests pass.
- [ ] All Family route tests pass.
- [ ] Locale tests pass.
- [ ] Cache migration tests pass.
- [ ] Client stripping tests pass.
- [ ] No client re-derivation exists.
- [ ] No invalid role binding exists.
- [ ] No report renders an evidence-free visible finding.
- [ ] No action lacks a source finding.
- [ ] Shared infrastructure changes do not alter other relationship kinds.
- [ ] Build and typecheck pass.

---

## 73. Editorial Release Gates

For every fixture, reviewers must be able to answer:

- What are the three most important insights?
- Does the report explain why the misunderstanding happens?
- Does it represent both people fairly?
- Is Saju visibly the interpretive foundation without becoming jargon-heavy?
- Are psych axes used selectively?
- Does the environment section add a genuinely different insight?
- Does the report move from recognition to translation to action?
- Are there any repeated claims?
- Are actions feasible and specific?
- Does the ending preserve dignity?

Fail the release if the report is technically correct but reads like a list of traits.

---

## 74. Safety Release Gates

- [ ] No diagnosis.
- [ ] No abuse reconciliation advice.
- [ ] No blame assignment.
- [ ] No “bad parent” or “bad child” framing.
- [ ] No deterministic career or life outcome.
- [ ] No forced filial obligation.
- [ ] No relocation command.
- [ ] No unsupported motive.
- [ ] No deterministic future timing without approved evidence.
- [ ] Appropriate support language appears for disclosed harm contexts.

---

## 75. Observability

Verify logging or metrics for:

- report schema version,
- capability version,
- cache hit/regeneration/migration,
- viewer type,
- locale,
- omitted optional modules,
- LLM validation failures,
- deterministic fallback usage,
- and legacy renderer usage.

Avoid unnecessary logging of raw personal narrative or sensitive inputs.

---

## 76. Rollout Strategy

Recommended rollout:

1. internal fixture generation,
2. internal editorial review,
3. staff or trusted beta accounts,
4. limited percentage rollout,
5. monitor validation/fallback/cache metrics,
6. full rollout,
7. legacy renderer retirement after stable usage.

Rollback must preserve access to previously purchased reports.

---

## 77. Legacy Retirement Criteria

The old Family renderer may be retired only when:

- all supported legacy payloads regenerate, migrate, or display safely,
- new parent and child viewer parity is verified,
- current paid report access is preserved,
- no critical field exists only in the old UI,
- and production fallback rates are acceptable.

Document the retirement commit separately.

---

# Part XVI — Commit Strategy

## 78. Recommended Commit Boundaries

Each commit should contain one coherent vertical or foundational slice.

Suggested commit sequence:

1. `Document Family implementation reality audit`
2. `Add canonical Family judgment contracts`
3. `Project existing Family signals into canonical findings`
4. `Add selective Family psych comparisons`
5. `Add Family translation-gap and relationship-loop judgments`
6. `Add Family shared-environment-fit judgment`
7. `Add bidirectional Family viewer projections`
8. `Assemble Family report narrative modules`
9. `Constrain Family LLM narrative generation`
10. `Version and migrate Family report capabilities`
11. `Render canonical Family report experience`
12. `Complete Family rollout and retire legacy renderer`

Do not combine all batches into one commit.

---

## 79. Pre-Commit Audit Template

Before every commit, report:

### A. Files to include

Exact file list.

### B. Files to exclude

Unrelated modified files and reason.

### C. Behavioral scope

What runtime behavior changes.

### D. Non-goals

What intentionally remains unchanged.

### E. Tests

Commands and exact result.

### F. Diff summary

```text
N files changed, X insertions(+), Y deletions(-)
```

### G. Verdict

- `READY TO COMMIT`
- `NOT READY`

No commit should be created after a `NOT READY` verdict.

---

## 80. Git Safety Rules

- Do not push unless explicitly requested.
- Do not include unrelated working-tree files.
- Do not rewrite previous commits without explicit instruction.
- Do not rename shared files solely for aesthetic consistency.
- Do not delete legacy paths until migration and retirement gates pass.
- Preserve clean commit boundaries even if several batches are implemented in one session.

---

# Part XVII — Explicit Deferrals

## 81. Deferred from Core Family Rebuild

The following must not block launch:

- exact Da Yun age-window prediction,
- precise “move abroad at age X” guidance,
- deterministic school or major recommendations,
- multi-parent triangulation,
- sibling ecosystem analysis,
- grandparent analysis,
- three-person household scoring,
- city/country inference from birth data,
- granular elemental percentage dashboards,
- parenting task trackers,
- child development milestone tracking,
- family chat or mediation tools,
- and automated crisis intervention.

Each requires a separate product decision and technical validation.

---

## 82. Conditional Follow-Up Candidates

After launch evidence is stable, consider:

- optional current-environment questionnaire,
- saved Family Playbook,
- report revisit prompts by lifecycle change,
- longitudinal viewer reflection,
- sibling comparison,
- co-parent comparison,
- and validated temporal growth windows.

These are not implied commitments.

---

# Part XVIII — Definition of Done

## 83. Foundation Done

Foundation is complete when:

- canonical findings exist,
- evidence provenance is traceable,
- current signals are adapted,
- psych comparisons are selective,
- and tests protect direction/confidence/severity.

---

## 84. Family Intelligence Done

Family-specific intelligence is complete when:

- translation gap is deterministic,
- one relationship loop can be selected,
- shared environment fit is distinct from home climate,
- adaptation cost is person-bound,
- and parent/child viewer projections preserve truth.

---

## 85. Report Experience Done

The experience is complete when:

- the report opens with recognition,
- explains the misunderstanding,
- reveals the relationship and environment pattern,
- gives only a few linked actions,
- and closes without blame or fatalism.

---

## 86. Production Done

Production readiness requires:

- versioned persistence,
- cache-safe migration,
- validated LLM prose,
- client-safe rendering,
- bilingual parity,
- full fixture coverage,
- observability,
- rollback support,
- and approved legacy retirement.

---

# Part XIX — Immediate Next Action

## 87. Start with Batch 0 Only

The next engineering request should be a confirm-only implementation audit.

It must not begin coding shared environment fit, viewer projection, or new prompts before verifying the current repository.

Recommended instruction:

```text
Perform Family 07D Batch 0 only: Implementation Reality Audit.

Use 05D_Family_Product_Blueprint.md, 06D_Family_Technical_Blueprint.md, and 07D_Family_Implementation_Checklist.md as authority.

Do not modify code, commit, or push.

Trace the exact current Family runtime chain, persisted schema, cache validity, client section order, role/viewer binding, six Saju comparison rows, 11-axis psych availability, child DNA/growth/deep-read/SOS/prescription producers and consumers, and all existing Family tests.

Classify every 05D module as already supported, partially supported, supportable by recombination, new deterministic rule required, user context required, or deferred.

Return:
A. exact file and symbol map
B. producer → consumer map
C. duplicate/conflicting concepts
D. computed-but-unused fields
E. cache and viewer-binding risks
F. minimal mutation path for Batch 1
G. proposed Batch 1 file list
H. explicit confirmation that no code, commit, or push occurred.
```

---

# Final Execution Standard

The Family implementation is successful only when engineering discipline protects the product experience.

The system must not generate the largest possible report.

It must select the right few relationship truths, show where they came from, explain why they matter, preserve both people’s dignity, and make the next action obvious.

> **Build the evidence spine first. Then let the report tell one clear family story.**
