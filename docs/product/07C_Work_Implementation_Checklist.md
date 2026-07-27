# 07C Work Implementation Checklist

**Document type:** Implementation Gate / Execution SSOT  
**Product:** Ahaitsme — Work & Coworker Experience  
**Status:** Draft v1.0 for implementation review  
**Audience:** Product, Engineering, Design, Content Systems, QA, Localization  
**Product authority:** `05C_Work_Product_Blueprint.md`  
**Technical authority:** `06C_Work_Technical_Blueprint.md`  
**Shared authority:** `05_Relationship_Product_Bible.md` · `06_Visual_Design_System.md`  
**Purpose:** Convert the approved Work product and technical architecture into bounded implementation batches, testable acceptance criteria, regression guards, and commit gates.

---

## 0. Implementation Constitution

This checklist is not permission to redesign the Work product in code.

The implementation must preserve the following pipeline:

```text
Normalized inputs
→ Independent evidence families
→ Deterministic Work judgments
→ Resolver decisions
→ Canonical Work model
→ Client-safe projections
→ Bounded narrative
→ Visual rendering
→ Actionable operating manual
```

Permanent rules:

- [ ] The server owns classification.
- [ ] The client owns presentation only.
- [ ] The LLM owns expression and synthesis only.
- [ ] Saju and Psych evidence remain independently attributable.
- [ ] Person truth, pair truth, role truth, and environment truth remain separate.
- [ ] Confidence and severity remain separate.
- [ ] Canonical judgments are computed once and projected many times.
- [ ] Missing evidence produces omission or a bounded partial state—not invented certainty.
- [ ] No Work output becomes an employee score, hiring recommendation, promotion prediction, capability verdict, or career-fate claim.
- [ ] Existing code may be reused only when it satisfies `05C` and `06C`.

A batch is not complete because the UI appears correct.

A batch is complete only when:

1. its canonical judgment is deterministic,
2. provenance survives,
3. client payload is safe,
4. localization is validated,
5. regression tests pass,
6. and the diff remains within the declared scope.

---

# 1. Authority and Conflict Resolution

## 1.1 Authority order

When implementation choices conflict, use this order:

1. `01_Product_Vision.md`
2. `02_Relationship-ux-bible.md`
3. `05_Relationship_Product_Bible.md`
4. `05C_Work_Product_Blueprint.md`
5. `06_Visual_Design_System.md`
6. `06C_Work_Technical_Blueprint.md`
7. `07C_Work_Implementation_Checklist.md`
8. Current implementation
9. Legacy prompts, copy tables, scripts, and components

- [ ] Code is treated as implementation evidence, not product authority.
- [ ] A conflict with `05C` is escalated as a product decision.
- [ ] A conflict with `06C` is resolved before implementation continues.
- [ ] No hidden compatibility behavior is added merely to preserve a legacy output.

## 1.2 Scope-change rule

Stop the active batch and document the decision when implementation would require:

- changing the meaning of a Work module,
- introducing a new product promise,
- creating a new canonical judgment not defined in `06C`,
- merging Saju and Psych into an unattributable score,
- changing Free/Premium boundaries,
- changing shared relationship contracts,
- or altering Romantic, Friend, or Family behavior.

---

# 2. Definition of Done

## 2.1 Product completeness

- [ ] Every implemented feature answers a user question defined in `05C`.
- [ ] Every visible claim has a supported evidence path.
- [ ] Every warning includes a practical interpretation or action.
- [ ] Every module avoids employability, talent, and career-outcome claims.
- [ ] Pair analysis remains non-hierarchical and does not rank coworkers.

## 2.2 Technical completeness

- [ ] Inputs are normalized.
- [ ] Evidence has provenance.
- [ ] Canonical judgments are deterministic.
- [ ] Confidence is resolved server-side.
- [ ] Severity is resolved server-side.
- [ ] Contradictions are represented explicitly.
- [ ] Projections do not reclassify truth.
- [ ] Client payload contains no unnecessary raw private evidence.
- [ ] Locale behavior is explicit and tested.
- [ ] Schema versions are present where required.

## 2.3 UX completeness

- [ ] Visuals reveal the intended question within seconds.
- [ ] Visuals are not decorative duplicates of prose.
- [ ] Mobile layouts preserve comparison meaning.
- [ ] Directional A/B statements bind to the correct person.
- [ ] Action guidance is visible without reading the entire report.
- [ ] Accessibility labels communicate meaning, not only color.

## 2.4 QA completeness

- [ ] Unit tests pass.
- [ ] Contract tests pass.
- [ ] Projection tests pass.
- [ ] Locale tests pass.
- [ ] Missing-data tests pass.
- [ ] Direction-swap tests pass.
- [ ] Snapshot or visual regression checks pass where appropriate.
- [ ] Existing Romantic, Friend, and Family suites remain green.

---

# 3. Pre-Implementation Audit

No production code is changed during this phase.

## 3.1 Repository inventory

- [ ] Locate current Work entry points.
- [ ] Locate request normalization.
- [ ] Locate Saju person and pair evidence builders.
- [ ] Locate Psych master and pair-axis builders.
- [ ] Locate existing Work section builders.
- [ ] Locate existing Work premium narrative path.
- [ ] Locate route stripping and client-safe projection.
- [ ] Locate Work UI components and module ordering.
- [ ] Locate locale resolution and translation ownership.
- [ ] Locate existing Work tests, fixtures, and smoke scripts.

## 3.2 Current-state classification

For every `05C` module, classify the implementation as:

- [ ] `EXISTS_CANONICAL`
- [ ] `EXISTS_LEGACY_ONLY`
- [ ] `PARTIAL`
- [ ] `UI_ONLY`
- [ ] `NARRATIVE_ONLY`
- [ ] `MISSING`
- [ ] `BLOCKED_BY_PRODUCT_DECISION`

## 3.3 Provenance audit

For every existing output field:

- [ ] Identify its exact source file and builder.
- [ ] Identify whether it is Saju, Psych, explicit context, derived, or LLM-generated.
- [ ] Identify whether the field is person, pair, role, or environment scoped.
- [ ] Identify whether the client currently recomputes meaning.
- [ ] Identify whether the output survives route stripping.
- [ ] Identify whether Korean and English share equivalent meaning.

## 3.4 Audit deliverable

The audit must provide:

- [ ] Current pipeline diagram.
- [ ] Field inventory.
- [ ] Reuse candidates.
- [ ] Legacy liabilities.
- [ ] Proposed batch boundaries.
- [ ] Files expected to change per batch.
- [ ] Explicit non-goals.
- [ ] Recommendation: `READY`, `READY WITH CONDITIONS`, or `NOT READY`.

### Gate A — Audit approval

Do not begin implementation until:

- [ ] Product confirms the audit reflects the repository.
- [ ] Product confirms unresolved meaning questions.
- [ ] Engineering confirms the proposed ownership boundaries.
- [ ] No unrelated working-tree changes are included in the planned batch.

---

# 4. Target Package and Naming

Final paths may follow repository conventions, but conceptual ownership must remain visible.

Recommended architecture:

```text
lib/relationship/work/
  evidence/
  judgments/
  resolvers/
  projections/
  narrative/
  locale/
  types/

components/relationship/work/
  shared/
  modules/
  visuals/

tests/unit/work/
tests/integration/work/
tests/fixtures/work/
```

## 4.1 Naming rules

- [ ] Canonical classifiers use domain names, not UI names.
- [ ] Projection builders include `ViewModel`, `Projection`, or equivalent.
- [ ] LLM outputs do not use names that imply canonical authority.
- [ ] Shared components do not contain hidden Work-specific thresholds.
- [ ] Work-specific interpretation remains in Work-owned files.
- [ ] Temporary migration aliases include a removal note.

## 4.2 Forbidden architecture

- [ ] No mega-builder that computes evidence, classifies truth, writes prose, and shapes UI in one function.
- [ ] No client-side threshold logic.
- [ ] No prompt-only classification.
- [ ] No duplicated classifier per module.
- [ ] No locale branching scattered across arbitrary components.
- [ ] No raw Psych master or full Saju chart sent to the client without an approved need.

---

# 5. Phase 0 — Foundations and Types

## 5.1 Core type contracts

Implement or validate:

- [ ] `WorkInput`
- [ ] `WorkPersonInput`
- [ ] `WorkPairInput`
- [ ] `WorkContextInput`
- [ ] `WorkEvidenceItem`
- [ ] `WorkEvidenceSource`
- [ ] `WorkEvidenceDomain`
- [ ] `WorkCanonicalJudgment`
- [ ] `WorkConfidenceTier`
- [ ] `WorkSeverityTier`
- [ ] `WorkContradiction`
- [ ] `WorkWarning`
- [ ] `CanonicalWorkModel`
- [ ] `WorkClientProjection`
- [ ] `WorkNarrativePackage`

## 5.2 Evidence item requirements

Each evidence item must support:

- [ ] stable key,
- [ ] source family,
- [ ] domain,
- [ ] subject binding,
- [ ] value or direction,
- [ ] optional strength,
- [ ] optional reliability,
- [ ] provenance reference,
- [ ] locale-independent semantic meaning,
- [ ] and null-safe omission.

## 5.3 Versioning

- [ ] Define canonical model version.
- [ ] Define projection version.
- [ ] Define narrative-package version.
- [ ] Define migration behavior for old saved reports if applicable.
- [ ] Unknown versions fail safely.

## 5.4 Foundation tests

- [ ] Type-level compile checks.
- [ ] Schema validation tests.
- [ ] Unknown enum rejection.
- [ ] Optional evidence omission.
- [ ] Invalid subject binding rejection.
- [ ] Version mismatch behavior.

### Gate B — Foundation

- [ ] No Work module implementation begins before shared types compile.
- [ ] No UI types are used as canonical model types.
- [ ] No prose fields are required to construct canonical judgments.

---

# 6. Phase 1 — Input Normalization

## 6.1 Person normalization

- [ ] Normalize stable person IDs.
- [ ] Preserve display names separately from identity keys.
- [ ] Normalize birth inputs through the existing trusted pipeline.
- [ ] Normalize Psych master availability.
- [ ] Record missing or incomplete person inputs explicitly.
- [ ] Never infer job title, seniority, or reporting relationship from names.

## 6.2 Pair normalization

- [ ] Preserve A/B identity consistently.
- [ ] Support directional swap testing.
- [ ] Preserve optional coworker role metadata without making it authoritative evidence.
- [ ] Do not assume manager/direct-report unless explicitly supplied.
- [ ] Do not infer organizational power from age, gender, or chart strength.

## 6.3 Work context normalization

Optional context may include:

- [ ] collaboration type,
- [ ] project stage,
- [ ] decision authority,
- [ ] communication channel,
- [ ] work setting,
- [ ] conflict state,
- [ ] and user-declared role.

Rules:

- [ ] Explicit context is labeled as user-supplied.
- [ ] Context may refine interpretation but cannot rewrite unsupported person truth.
- [ ] Missing context does not trigger invented assumptions.
- [ ] Context values are allowlisted.

## 6.4 Locale normalization

- [ ] Resolve locale once at the boundary.
- [ ] Support `ko-KR`.
- [ ] Support `en-US`.
- [ ] Preserve the approved omitted-locale fallback.
- [ ] No silent language switching.

## 6.5 Input tests

- [ ] Full pair input.
- [ ] One Psych master missing.
- [ ] Both Psych masters missing.
- [ ] Partial Saju input.
- [ ] Explicit context present.
- [ ] Explicit context absent.
- [ ] A/B swap.
- [ ] `ko-KR` explicit.
- [ ] `en-US` explicit.
- [ ] locale omitted.

### Gate C — Input normalization

- [ ] All downstream builders receive normalized inputs only.
- [ ] Legacy routes cannot bypass locale resolution.
- [ ] Missing data state is visible to the evidence layer.

---

# 7. Phase 2 — Evidence Extraction

## 7.1 Saju person evidence

- [ ] Extract only Work-relevant person evidence defined in `06C`.
- [ ] Preserve source references.
- [ ] Preserve direction and strength where available.
- [ ] Do not convert Saju evidence into Psych labels.
- [ ] Do not produce career success or aptitude claims.

## 7.2 Saju pair evidence

- [ ] Extract pair interactions relevant to work rhythm, support, pressure, and coordination.
- [ ] Preserve shared vs directional meaning.
- [ ] Separate supportive interaction from continuing cost.
- [ ] Avoid global compatibility scoring.

## 7.3 Psych person evidence

- [ ] Use only approved Work-relevant axes.
- [ ] Preserve person-specific scores or bands server-side.
- [ ] Do not expose all 11 axes by default.
- [ ] Do not rank one person above another.
- [ ] Treat axes as tendencies, not competencies.

## 7.4 Psych pair evidence

- [ ] Produce directional and shared differences where technically supported.
- [ ] Preserve exact A/B binding.
- [ ] Distinguish similarity, complementarity, and friction potential.
- [ ] Do not classify similarity as inherently good.
- [ ] Do not classify difference as inherently bad.

## 7.5 Explicit context evidence

- [ ] Tag user-supplied context separately.
- [ ] Do not present context as inferred truth.
- [ ] Allow context to select relevant projections.
- [ ] Do not allow context to inflate confidence in unrelated judgments.

## 7.6 Derived deterministic evidence

- [ ] Derived evidence names its dependencies.
- [ ] Derived evidence cannot conceal mixed-source fusion.
- [ ] The same derived value is not recomputed in multiple modules.
- [ ] Derived values remain testable without an LLM.

## 7.7 Evidence separation tests

- [ ] Saju-only fixture.
- [ ] Psych-only fixture.
- [ ] Both sources aligned.
- [ ] Both sources divergent.
- [ ] Context-only refinement.
- [ ] Unsupported evidence omitted.
- [ ] Provenance survives canonical-model construction.

### Gate D — Evidence

- [ ] Every evidence item is attributable.
- [ ] No mixed-source black-box score exists.
- [ ] No narrative text is required to interpret evidence.

---

# 8. Phase 3 — Resolver Infrastructure

## 8.1 Sufficiency resolver

- [ ] Determine whether a judgment has enough evidence.
- [ ] Return `insufficient` rather than forcing a classification.
- [ ] Preserve partial evidence for bounded explanations.
- [ ] Define minimum source and strength requirements per judgment.

## 8.2 Confidence resolver

Supported tiers:

- [ ] `corroborated`
- [ ] `refined`
- [ ] `tentative`
- [ ] `insufficient`

Rules:

- [ ] Confidence depends on evidence quality and agreement.
- [ ] Confidence does not depend on how positive the output sounds.
- [ ] One strong source may support direction without supporting detailed causality.
- [ ] LLM wording receives the resolved tier, not raw evidence ambiguity.

## 8.3 Severity resolver

Supported ladder:

- [ ] S0 — strength or ease
- [ ] S1 — difference
- [ ] S2 — recurring friction
- [ ] S3 — sustained strain
- [ ] S4 — structural risk requiring explicit intervention

Rules:

- [ ] Severity is not confidence.
- [ ] Difference alone does not imply risk.
- [ ] High confidence can describe a low-severity strength.
- [ ] Low confidence cannot justify severe language.

## 8.4 Contradiction resolver

- [ ] Detect same-domain source disagreement.
- [ ] Detect person-vs-pair tension.
- [ ] Detect context-vs-tendency tension.
- [ ] Preserve contradiction as a meaningful result where appropriate.
- [ ] Avoid averaging contradictory truths into bland neutrality.

## 8.5 Deduplication resolver

- [ ] Assign one semantic owner per canonical judgment.
- [ ] Remove repeated insights from adjacent modules.
- [ ] Allow a judgment to project differently without being recomputed.
- [ ] Prevent the same warning from appearing in every module.

## 8.6 Resolver tests

- [ ] aligned evidence → corroborated.
- [ ] one source only → bounded confidence.
- [ ] divergent evidence → refined or contradiction state.
- [ ] weak evidence → tentative.
- [ ] insufficient evidence → omitted judgment.
- [ ] high confidence + low severity.
- [ ] low confidence + potentially severe signal uses restrained wording.
- [ ] duplicate warning is owned once.

### Gate E — Resolvers

- [ ] Resolver output is deterministic.
- [ ] Resolver output is locale-independent.
- [ ] No prompt logic replaces resolver decisions.

---

# 9. Phase 4 — Canonical Person Engines

Implement as separate vertical slices. Each slice must complete judgment → projection → test before the next slice begins.

## 9.1 Work Signature

### Implementation

- [ ] Define stable judgment keys.
- [ ] Build from approved person evidence.
- [ ] Separate natural work tendency from demonstrated skill.
- [ ] Produce concise canonical headline tokens, not final prose.
- [ ] Attach confidence and provenance.

### Projection

- [ ] Summary projection.
- [ ] Person card projection.
- [ ] Optional radar/highlight projection.
- [ ] Work manual projection.

### Tests

- [ ] High/low direction fixtures differ meaningfully.
- [ ] Midrange or ambiguous evidence does not force extremes.
- [ ] Missing Psych still permits bounded Saju projection where supported.
- [ ] No career-title recommendation appears.

## 9.2 Work Shape

- [ ] Implement start, structure, execution, refinement, and completion tendencies as approved.
- [ ] Avoid linear maturity ranking.
- [ ] Preserve multi-stage strengths.
- [ ] Represent stage cost separately from stage strength.
- [ ] Add module projection and action guidance.

Tests:

- [ ] Strong-start does not imply weak-finish unless supported.
- [ ] Structure preference does not imply rigidity by default.
- [ ] Completion support recommendations follow the actual judgment.

## 9.3 Contribution Pattern

- [ ] Implement approved contribution families.
- [ ] Phrase as where value tends to appear—not ability certification.
- [ ] Support multiple contribution families.
- [ ] Separate visible contribution from hidden contribution.
- [ ] Preserve confidence.

Tests:

- [ ] No employability score.
- [ ] No “best job” claim.
- [ ] No unsupported leadership inference.
- [ ] Multiple contributions can coexist.

## 9.4 Support Needs

- [ ] Implement clarity, autonomy, feedback, pacing, recognition, and recovery needs where supported.
- [ ] Distinguish preference from dependency.
- [ ] Distinguish support need from weakness.
- [ ] Produce practical manager/coworker guidance.
- [ ] Avoid diagnosing workplace dysfunction.

Tests:

- [ ] High autonomy need is not rendered as resistance to authority.
- [ ] High structure need is not rendered as incompetence.
- [ ] Missing evidence omits the need rather than filling generic advice.

### Gate F — Person vertical slices

- [ ] Each person engine has independent unit tests.
- [ ] Each judgment appears once in the canonical model.
- [ ] Person projections render without pair data.
- [ ] Person modules do not leak pair conclusions.

---

# 10. Phase 5 — Canonical Pair Engines

## 10.1 Collaboration Map

### Canonical classification

- [ ] Implement approved map dimensions.
- [ ] Classify collaboration type server-side.
- [ ] Preserve directional support where relevant.
- [ ] Separate immediate ease from long-term sustainability.
- [ ] Add continuing-cost overlay independently.

### Projection

- [ ] Map coordinate or category.
- [ ] Human label.
- [ ] “What works” explanation.
- [ ] “What costs energy” explanation.
- [ ] One practical operating rule.

### Tests

- [ ] Same canonical type projects consistently across summary and detail.
- [ ] Continuing cost does not change the base classification silently.
- [ ] A/B swap preserves shared classification and swaps directional text.
- [ ] No global coworker compatibility score appears.

## 10.2 Saju Comparison Table

For every row:

- [ ] row key is stable,
- [ ] A and B values are independently sourced,
- [ ] pair meaning is deterministic,
- [ ] practical action is attached,
- [ ] provenance remains available,
- [ ] no good/bad ranking is used.

Candidate row families must follow `06C`.

Tests:

- [ ] A/B values swap correctly.
- [ ] Pair meaning remains semantically valid after swap.
- [ ] Missing one side produces a bounded row or omission.
- [ ] Table rows do not duplicate the Collaboration Map verbatim.

## 10.3 Role Design

- [ ] Implement ownership states.
- [ ] Implement approved role families.
- [ ] Distinguish natural ownership from formal authority.
- [ ] Support shared, rotating, split, and escalation ownership.
- [ ] Produce explicit “who leads when” guidance.
- [ ] Avoid assigning superiority.

Tests:

- [ ] Strong ownership tendency does not automatically assign manager role.
- [ ] Shared ownership does not produce vague “communicate more” advice.
- [ ] Directional statements bind to correct names.

## 10.4 Decision and Communication Flow

- [ ] Implement decision stages.
- [ ] Identify likely initiator, challenger, integrator, closer, or confirmer only when supported.
- [ ] Separate decision speed from decision quality.
- [ ] Separate directness from aggression.
- [ ] Produce channel, timing, and handoff recommendations.

Tests:

- [ ] Fast decision style is not rendered as careless.
- [ ] Deliberative style is not rendered as indecisive.
- [ ] A/B direction reverses correctly.
- [ ] Similar styles still produce a meaningful operating rule.

### Gate G — Core pair engines

- [ ] Shared truths remain shared.
- [ ] Directional truths swap correctly.
- [ ] Pair modules do not overwrite person judgments.
- [ ] The pair system remains usable without LLM output.

---

# 11. Phase 6 — Pressure, Conflict, and Repair

## 11.1 Pressure Pattern

- [ ] Implement approved pressure states.
- [ ] Distinguish first reaction from sustained stress pattern.
- [ ] Distinguish self-regulation from interpersonal impact.
- [ ] Attach severity separately.
- [ ] Provide an early-warning cue.
- [ ] Provide a de-escalation action.

Tests:

- [ ] Stress language remains tendency-based.
- [ ] No mental-health diagnosis.
- [ ] No unsupported claim of toxicity or abuse.
- [ ] Low-confidence evidence cannot produce S4 language.

## 11.2 Conflict Pattern

- [ ] Implement trigger, escalation, expression, and shutdown dimensions where supported.
- [ ] Preserve bidirectional dynamics.
- [ ] Avoid assigning sole blame unless explicit evidence supports direction.
- [ ] Distinguish content conflict from process conflict.
- [ ] Expose recurring loop rather than isolated fault.

Tests:

- [ ] A/B swap changes directional ownership only.
- [ ] Conflict severity does not equal relationship failure.
- [ ] Similar conflict styles are not automatically labeled compatible.

## 11.3 Repair Engine

- [ ] Implement repair entry conditions.
- [ ] Implement timing needs.
- [ ] Implement acknowledgment needs.
- [ ] Implement concrete repair sequence.
- [ ] Implement restart conditions.
- [ ] Keep residual strain separate from initial recovery.

Required projections:

- [ ] repair sequence,
- [ ] do/don’t guidance,
- [ ] short script,
- [ ] residual-risk note where supported.

Tests:

- [ ] Recovery speed and residual impact remain separate.
- [ ] Script uses correct speaker binding.
- [ ] Script does not claim guaranteed resolution.
- [ ] Missing repair evidence falls back to bounded general process only if product-approved.

### Gate H — Pressure and repair

- [ ] Warning language follows severity and confidence.
- [ ] Every warning has an action.
- [ ] No repetitive conflict warning appears across modules.

---

# 12. Phase 7 — Feedback, Recognition, Leadership, Environment

## 12.1 Feedback Engine

- [ ] Implement preferred timing.
- [ ] Implement directness/detail balance.
- [ ] Implement private/public boundary where supported.
- [ ] Implement evidence/example needs.
- [ ] Separate receiving feedback from giving feedback.
- [ ] Produce a concrete feedback script.

Tests:

- [ ] Directness is not equated with harshness.
- [ ] Sensitivity is not equated with fragility.
- [ ] Giving and receiving directions bind correctly.

## 12.2 Recognition Engine

- [ ] Implement visible vs private recognition preference.
- [ ] Implement outcome vs effort vs trust recognition.
- [ ] Identify under-recognition risk where supported.
- [ ] Produce practical recognition examples.
- [ ] Avoid claiming compensation or promotion needs.

Tests:

- [ ] Recognition preference does not become ego judgment.
- [ ] LOUD recognition evidence, when present and supported, affects output meaningfully.
- [ ] Generic praise is not repeated when a specific recognition mode exists.

## 12.3 Leadership / Followership

- [ ] Implement situational leadership tendencies.
- [ ] Implement followership/support tendencies.
- [ ] Preserve role flexibility.
- [ ] Avoid fixed leader/follower identity claims.
- [ ] Avoid promotion and management-potential predictions.
- [ ] Produce conditions under which each person should lead.

Tests:

- [ ] Formal title is not inferred.
- [ ] Strong control axis alone does not equal leadership.
- [ ] Supportive behavior is not rendered as lower status.

## 12.4 Environment Fit Explorer

- [ ] Implement approved environment dimensions.
- [ ] Phrase as conditions that may help or drain.
- [ ] Support mixed environments and tradeoffs.
- [ ] Avoid company, profession, or industry recommendations unless separately product-approved.
- [ ] Clearly mark exploratory confidence.

Tests:

- [ ] No “you belong in X career” claim.
- [ ] Environment preference is not competence judgment.
- [ ] Contradictory needs can coexist with explanation.

### Gate I — Advanced Work modules

- [ ] All advanced modules remain optional projections of supported evidence.
- [ ] No advanced module changes the canonical collaboration type.
- [ ] No workplace authority is invented.

---

# 13. Phase 8 — Canonical Work Model Assembly

## 13.1 Model assembly

- [ ] Assemble person A.
- [ ] Assemble person B where present.
- [ ] Assemble pair judgments.
- [ ] Assemble warnings.
- [ ] Assemble contradictions.
- [ ] Assemble evidence references.
- [ ] Assemble model version.
- [ ] Preserve deterministic ordering.

## 13.2 Model invariants

- [ ] Every judgment key is unique.
- [ ] Every judgment has subject scope.
- [ ] Every judgment has confidence.
- [ ] Severity is present only where relevant.
- [ ] Every direction references stable person IDs.
- [ ] No display copy is required for canonical validity.
- [ ] Model serialization is stable.

## 13.3 Canonical model tests

- [ ] Full pair fixture snapshot.
- [ ] Person-only fixture snapshot.
- [ ] Partial evidence fixture.
- [ ] Contradiction fixture.
- [ ] A/B swap fixture.
- [ ] Deterministic repeated-run equality.
- [ ] Version field validation.

### Gate J — Canonical model

- [ ] All Work truth can be inspected without rendering UI.
- [ ] All client projections derive from this model.
- [ ] No module bypasses canonical assembly.

---

# 14. Phase 9 — Projection Layer

## 14.1 Projection principles

- [ ] Projection selects and reshapes existing truth.
- [ ] Projection does not recalculate thresholds.
- [ ] Projection does not infer new categories.
- [ ] Projection does not merge contradictory evidence silently.
- [ ] Projection strips server-only provenance details as approved.

## 14.2 Required projections

- [ ] Free summary projection.
- [ ] Premium module projection.
- [ ] Person operating-manual projection.
- [ ] Pair collaboration projection.
- [ ] Visual asset projections.
- [ ] Narrative input projection.
- [ ] Share/export projection if in scope.

## 14.3 Visual projection contracts

### Radar / selective axes

- [ ] Uses approved axes only.
- [ ] Does not imply an overall score.
- [ ] Supports accessible text equivalent.
- [ ] Does not expose unsupported precision.

### Comparison table

- [ ] Preserves row contract.
- [ ] Preserves A/B identity.
- [ ] Contains pair meaning and action.
- [ ] Supports mobile stacking without losing comparison.

### Collaboration map

- [ ] Receives canonical type or coordinates.
- [ ] Receives continuing-cost overlay separately.
- [ ] Does not calculate placement client-side.
- [ ] Has non-color labels.

### Loop / sequence / script

- [ ] Uses ordered canonical steps.
- [ ] Shows trigger → response → effect → repair where supported.
- [ ] Correctly binds speakers.
- [ ] Avoids decorative animation that obscures meaning.

## 14.4 Route stripping

- [ ] Strip raw Psych master data unless explicitly required.
- [ ] Strip full Saju chart internals unless explicitly required.
- [ ] Preserve client-safe explanation fields.
- [ ] Preserve stable judgment IDs where useful for QA.
- [ ] Preserve locale-neutral enums.
- [ ] Confirm premium fields survive authorized routes only.

## 14.5 Projection tests

- [ ] Projection contains no server-only fields.
- [ ] Projection contains no hidden classifier logic.
- [ ] Free projection omits Premium-only details.
- [ ] Premium projection includes required modules.
- [ ] A/B swap output is correct.
- [ ] Empty optional modules disappear cleanly.
- [ ] Unknown enum fails closed.

### Gate K — Projections

- [ ] Client can render without raw scoring logic.
- [ ] Free/Premium boundary is enforced server-side.
- [ ] Projection fixtures are approved before UI implementation.

---

# 15. Phase 10 — Narrative Layer

## 15.1 Deterministic narrative package

The LLM receives only approved, structured inputs.

- [ ] Canonical judgments.
- [ ] Confidence tiers.
- [ ] Severity tiers.
- [ ] Directional bindings.
- [ ] Selected evidence summaries.
- [ ] Contradictions.
- [ ] Required module intent.
- [ ] Locale.
- [ ] Tone and length budget.
- [ ] Prohibited claims.

## 15.2 LLM responsibilities

The LLM may:

- [ ] synthesize multiple approved judgments,
- [ ] explain tradeoffs,
- [ ] create bounded examples,
- [ ] write scripts,
- [ ] improve warmth and readability,
- [ ] adapt phrasing to confidence,
- [ ] and reduce repetition.

The LLM may not:

- [ ] classify collaboration type,
- [ ] assign confidence,
- [ ] assign severity,
- [ ] invent evidence,
- [ ] infer job performance,
- [ ] predict promotion or firing,
- [ ] diagnose a person or workplace,
- [ ] change A/B ownership,
- [ ] create unsupported causal stories,
- [ ] or override deterministic warnings.

## 15.3 Narrative output contract

- [ ] Structured JSON or equivalent.
- [ ] Required keys are versioned.
- [ ] Missing optional sections are allowed.
- [ ] Unknown keys are ignored or rejected consistently.
- [ ] Output is validated before rendering.
- [ ] Invalid output falls back safely.

## 15.4 Voice rules

- [ ] Warm, intelligent, concise.
- [ ] Tendency, not verdict.
- [ ] Direct, but not clinical.
- [ ] Helpful without false certainty.
- [ ] Names preferred where available.
- [ ] No anonymous A/B leakage in user-facing prose.
- [ ] No demeaning labels.
- [ ] No generic corporate filler.
- [ ] Advice remains consistent with the snapshot.

## 15.5 Narrative tests

- [ ] No new classifier appears in output.
- [ ] Confidence wording matches tier.
- [ ] Severity wording matches tier.
- [ ] A/B names are correct.
- [ ] Korean honorific behavior is correct.
- [ ] English contains no Korean prose leakage.
- [ ] Korean contains no unintended English system labels.
- [ ] Scripts are usable and non-hostile.
- [ ] Advice does not contradict the canonical judgment.
- [ ] Repeated runs remain semantically bounded.

### Gate L — Narrative

- [ ] The report remains valid when narrative generation fails.
- [ ] The LLM cannot create a new product truth.
- [ ] Prompt changes are tested separately from classifier changes.

---

# 16. Phase 11 — UI and Rendering

## 16.1 Report composition

- [ ] Module order follows `05C`.
- [ ] Free and Premium experiences are visually distinct without manipulation.
- [ ] Summary does not overexpose every detail.
- [ ] Navigation supports long-report scanning.
- [ ] Empty modules collapse without broken spacing.
- [ ] Warnings appear near the relevant action.

## 16.2 Person modules

- [ ] Work Signature.
- [ ] Work Shape.
- [ ] Contribution.
- [ ] Support Needs.
- [ ] Feedback/Recognition.
- [ ] Environment Explorer where in scope.

## 16.3 Pair modules

- [ ] Collaboration Map.
- [ ] Comparison Table.
- [ ] Role Design.
- [ ] Decision Flow.
- [ ] Pressure Pattern.
- [ ] Conflict Loop.
- [ ] Repair Sequence.
- [ ] Work Manual.

## 16.4 Shared visual component rules

- [ ] Shared geometry is reused where appropriate.
- [ ] Work interpretation remains Work-owned.
- [ ] Shared components receive labels and data; they do not own thresholds.
- [ ] Visual components do not reconstruct canonical meaning.
- [ ] Every visual has a text alternative.
- [ ] Color is not the only carrier of meaning.

## 16.5 Responsive behavior

- [ ] Desktop comparison remains legible.
- [ ] Tablet preserves module hierarchy.
- [ ] Mobile table becomes stacked comparison without losing A/B relation.
- [ ] Radar labels do not overlap.
- [ ] Map labels remain visible at small widths.
- [ ] Scripts and action cards are readable without horizontal scrolling.

## 16.6 Accessibility

- [ ] Semantic headings.
- [ ] Keyboard navigation.
- [ ] Focus order follows reading order.
- [ ] Accessible labels for charts and maps.
- [ ] Sufficient contrast.
- [ ] Reduced-motion behavior.
- [ ] Screen-reader summary for non-text visuals.

## 16.7 UI tests

- [ ] Component tests for each projection state.
- [ ] Missing-data state.
- [ ] Long Korean names.
- [ ] Long English copy.
- [ ] A/B swap.
- [ ] Premium locked state if applicable.
- [ ] Mobile viewport snapshots.
- [ ] Accessibility audit.

### Gate M — UI

- [ ] UI contains no threshold logic.
- [ ] UI is correct with narrative absent.
- [ ] Visual meaning matches approved projection fixtures.

---

# 17. Phase 12 — Localization

## 17.1 Locale ownership

- [ ] Locale is resolved before builders run.
- [ ] Canonical enums remain locale-neutral.
- [ ] Deterministic labels use centralized locale maps.
- [ ] LLM receives explicit locale.
- [ ] UI uses the same resolved locale.

## 17.2 Korean requirements

- [ ] Natural Korean, not literal English syntax.
- [ ] Respectful address.
- [ ] No accidental “너” except approved quoted scripts.
- [ ] Names and roles remain unambiguous.
- [ ] Workplace guidance is culturally natural without stereotyping.

## 17.3 English requirements

- [ ] Natural US English.
- [ ] No Korean prose leakage.
- [ ] No translated Saju jargon without explanation.
- [ ] Avoid HR/legal-sounding verdicts.
- [ ] Maintain warm but direct tone.

## 17.4 Locale tests

Each main module must test:

- [ ] explicit `en-US`,
- [ ] explicit `ko-KR`,
- [ ] omitted locale fallback,
- [ ] no cross-language leakage,
- [ ] stable judgment identity across locales,
- [ ] equivalent action meaning across locales.

### Gate N — Localization

- [ ] Locale changes expression, not classification.
- [ ] Korean and English projections share the same canonical judgment IDs.
- [ ] No locale has materially stronger unsupported claims.

---

# 18. Phase 13 — Free / Premium Boundary

## 18.1 Free experience

Validate the approved `05C` free scope.

- [ ] Free offers a meaningful result.
- [ ] Free does not expose Premium internals accidentally.
- [ ] Free summary derives from the canonical model.
- [ ] Free is not intentionally vague or misleading.
- [ ] Upgrade language describes added depth, not fear.

## 18.2 Premium experience

- [ ] Premium includes approved deeper modules.
- [ ] Premium value comes from richer synthesis, comparison, scripts, and actions.
- [ ] Premium does not claim higher truth merely because it is paid.
- [ ] Premium narrative failure does not remove deterministic paid content.
- [ ] Authorization is enforced server-side.

## 18.3 Boundary tests

- [ ] Unauthorized request strips Premium fields.
- [ ] Authorized request includes required Premium fields.
- [ ] Client cannot unlock hidden data locally.
- [ ] Share/export respects entitlement.
- [ ] Saved-report retrieval respects current access rules.

### Gate O — Monetization boundary

- [ ] Free/Premium behavior matches product authority.
- [ ] No dark-pattern copy.
- [ ] No duplicate computation solely for gating.

---

# 19. Phase 14 — Integration and Regression

## 19.1 End-to-end flow

- [ ] Request accepted.
- [ ] Inputs normalized.
- [ ] Evidence extracted.
- [ ] Canonical model built.
- [ ] Projection produced.
- [ ] Narrative validated.
- [ ] Route stripping applied.
- [ ] UI rendered.
- [ ] Locale preserved.
- [ ] Entitlement preserved.

## 19.2 Cross-product regression

- [ ] Romantic output unchanged unless explicitly in scope.
- [ ] Friend output unchanged unless explicitly in scope.
- [ ] Family output unchanged unless explicitly in scope.
- [ ] Shared Psych helpers remain backward compatible or are migrated deliberately.
- [ ] Shared Saju helpers remain backward compatible or are migrated deliberately.
- [ ] Shared visual changes are visually reviewed in all affected products.

## 19.3 Data-security regression

- [ ] No raw birth data added to client payload unnecessarily.
- [ ] No raw Psych master added to client payload unnecessarily.
- [ ] Logs avoid sensitive payloads.
- [ ] LLM package contains only required data.
- [ ] Analytics events contain no sensitive narrative text unless approved.

## 19.4 Performance

- [ ] Deterministic builders avoid duplicate expensive computation.
- [ ] Canonical model is built once per request.
- [ ] Projections reuse canonical output.
- [ ] LLM calls are bounded and observable.
- [ ] Failure/retry behavior does not duplicate billing unexpectedly.
- [ ] Large reports remain responsive on mobile.

## 19.5 Observability

- [ ] Record model/projection version.
- [ ] Record narrative schema version.
- [ ] Record locale.
- [ ] Record deterministic failure category.
- [ ] Record narrative validation failure without sensitive content.
- [ ] Distinguish data insufficiency from system failure.

### Gate P — Integration

- [ ] End-to-end fixtures pass.
- [ ] Cross-product suites pass.
- [ ] No sensitive-data regression.
- [ ] Performance remains within agreed thresholds.

---

# 20. Required Fixture Matrix

Minimum fixtures:

## 20.1 Person fixtures

- [ ] Highly structured / low structure.
- [ ] High autonomy / high guidance need.
- [ ] Fast decision / deliberative decision.
- [ ] Direct feedback / contextual feedback.
- [ ] Visible recognition / private recognition.
- [ ] High social stimulation / low social stimulation.
- [ ] Strong start / strong finish.
- [ ] Mixed or contradictory person evidence.
- [ ] Saju-only.
- [ ] Psych-only.

## 20.2 Pair fixtures

- [ ] Similar and easy.
- [ ] Similar with shared blind spot.
- [ ] Complementary and sustainable.
- [ ] Complementary with continuing cost.
- [ ] High friction but repairable.
- [ ] Directional support imbalance.
- [ ] Decision ownership ambiguity.
- [ ] Feedback mismatch.
- [ ] Recognition mismatch.
- [ ] Pressure escalation loop.
- [ ] Fast recovery with residual strain.
- [ ] Slow recovery with low residual strain.
- [ ] Missing Psych for A.
- [ ] Missing Psych for B.
- [ ] Missing pair evidence.
- [ ] A/B swapped version of every directional fixture.

## 20.3 Locale fixtures

- [ ] Korean names in Korean locale.
- [ ] English names in English locale.
- [ ] Mixed-script names.
- [ ] Long names.
- [ ] Missing names with safe role labels.

---

# 21. Acceptance Criteria by Module

## 21.1 Work Signature

- [ ] User can understand the primary work tendency quickly.
- [ ] The output does not imply skill level.
- [ ] Evidence provenance exists.
- [ ] Confidence controls wording.

## 21.2 Work Shape

- [ ] Stages are understandable and non-hierarchical.
- [ ] Strength and cost are distinguishable.
- [ ] Advice follows the actual stage pattern.

## 21.3 Contribution

- [ ] Contribution is framed as likely value expression.
- [ ] Multiple contributions can coexist.
- [ ] No job recommendation is made.

## 21.4 Support Needs

- [ ] Needs are practical and non-shaming.
- [ ] Preference and dependency are separated.
- [ ] Coworker/manager action is specific.

## 21.5 Collaboration Map

- [ ] Base dynamic and continuing cost are both visible.
- [ ] No global score.
- [ ] Shared and directional statements remain correct.

## 21.6 Comparison Table

- [ ] Every row compares the same domain.
- [ ] Every row contains meaning and action.
- [ ] A/B swap remains correct.

## 21.7 Role Design

- [ ] Ownership is explicit enough to act on.
- [ ] Formal hierarchy is not inferred.
- [ ] Shared ownership is operationalized.

## 21.8 Decision Flow

- [ ] The flow identifies handoffs and bottlenecks.
- [ ] Speed is not mistaken for quality.
- [ ] Directionality is correct.

## 21.9 Pressure / Conflict / Repair

- [ ] Trigger and loop are distinguishable.
- [ ] Warning language is proportionate.
- [ ] Repair steps are concrete.
- [ ] Residual strain remains separate.

## 21.10 Feedback / Recognition

- [ ] Giving and receiving are separated.
- [ ] Recognition mode is practical.
- [ ] Scripts are respectful and usable.

## 21.11 Leadership / Environment

- [ ] Outputs remain situational and exploratory.
- [ ] No promotion or career-fit prediction.
- [ ] Tradeoffs are visible.

---

# 22. Implementation Batch Template

Every implementation batch must begin with this declaration:

```text
Batch:
Purpose:
Product requirement:
Canonical judgment(s):
Expected files:
Files explicitly excluded:
Tests to add or update:
Migration impact:
Cross-product risk:
Commit allowed: NO until audit passes
Push allowed: NO unless explicitly requested
```

Every batch must end with:

```text
Result:
Changed files:
Unexpected files:
Tests run:
Tests passed:
Known limitations:
Product decisions required:
Ready to commit: YES / NO
```

## 22.1 Batch size rule

Prefer one canonical vertical slice at a time:

```text
Evidence
→ Judgment
→ Resolver
→ Canonical model
→ Projection
→ Narrative package
→ UI
→ Tests
```

Do not batch unrelated modules merely because they share a screen.

## 22.2 Allowed batching

Batch together only when:

- [ ] the judgments share one semantic owner,
- [ ] they use the same evidence contract,
- [ ] they require the same migration,
- [ ] and they can be tested independently from unrelated modules.

## 22.3 Forbidden batching

- [ ] Work + Romantic behavior changes.
- [ ] Work + Friend behavior changes.
- [ ] Classifier changes + broad copy tuning.
- [ ] Shared component refactor + product meaning change.
- [ ] Route migration + unrelated UI redesign.
- [ ] Multiple unresolved product decisions in one batch.

---

# 23. Recommended Implementation Order

The following order minimizes rework.

## Batch W0 — Audit and contracts

- [ ] Repository audit.
- [ ] Final type contracts.
- [ ] Batch map.
- [ ] No production behavior change.

## Batch W1 — Input and evidence normalization

- [ ] Inputs.
- [ ] Locale.
- [ ] Saju evidence.
- [ ] Psych evidence.
- [ ] Provenance.

## Batch W2 — Resolver foundation

- [ ] Sufficiency.
- [ ] Confidence.
- [ ] Severity.
- [ ] Contradiction.
- [ ] Deduplication.

## Batch W3 — Person core

- [ ] Work Signature.
- [ ] Work Shape.
- [ ] Contribution.
- [ ] Support Needs.

## Batch W4 — Pair core

- [ ] Collaboration Map.
- [ ] Saju Comparison Table.
- [ ] Role Design.
- [ ] Decision Flow.

## Batch W5 — Pressure and repair

- [ ] Pressure Pattern.
- [ ] Conflict Loop.
- [ ] Repair Sequence.
- [ ] Residual strain.

## Batch W6 — Feedback and recognition

- [ ] Feedback.
- [ ] Recognition.
- [ ] Scripts.

## Batch W7 — Leadership and environment

- [ ] Leadership/followership.
- [ ] Environment Explorer.

## Batch W8 — Canonical assembly and projections

- [ ] Canonical model.
- [ ] Free projection.
- [ ] Premium projection.
- [ ] Client stripping.

## Batch W9 — Narrative package

- [ ] Prompt/package contract.
- [ ] Output schema.
- [ ] Validation.
- [ ] Fallback.
- [ ] Bilingual tests.

## Batch W10 — UI and visuals

- [ ] Modules.
- [ ] Visuals.
- [ ] Mobile.
- [ ] Accessibility.

## Batch W11 — Integration and migration

- [ ] Route integration.
- [ ] Entitlement.
- [ ] Saved-report compatibility.
- [ ] Analytics.
- [ ] Full regression.

## Batch W12 — Release hardening

- [ ] Acceptance audit.
- [ ] Copy QA.
- [ ] Visual QA.
- [ ] Performance.
- [ ] Security.
- [ ] Final commit sequence.

---

# 24. Ready-to-Commit Gate

Before every commit:

## 24.1 Scope

- [ ] Only declared files are staged.
- [ ] No unrelated working-tree changes are staged.
- [ ] Generated files are expected and reviewed.
- [ ] No debug files, screenshots, or temporary scripts are included.

## 24.2 Architecture

- [ ] Server owns classification.
- [ ] Client owns presentation.
- [ ] LLM owns expression only.
- [ ] No duplicate classifier.
- [ ] No cross-product behavior change unless declared.
- [ ] No hidden fallback changes product meaning.

## 24.3 Evidence

- [ ] Provenance survives.
- [ ] Saju and Psych remain separable.
- [ ] Missing evidence fails closed.
- [ ] Directionality is tested.
- [ ] Confidence and severity are tested independently.

## 24.4 UX and copy

- [ ] No capability verdict.
- [ ] No hiring/promotion/firing prediction.
- [ ] No global coworker score.
- [ ] No demeaning or deterministic wording.
- [ ] Advice follows the judgment.
- [ ] Korean and English meaning align.

## 24.5 Tests

- [ ] New unit tests pass.
- [ ] Updated tests pass.
- [ ] Work integration tests pass.
- [ ] Cross-product regression passes.
- [ ] Build/typecheck passes.
- [ ] Lint passes or known baseline is documented.

## 24.6 Commit report

Provide:

- [ ] exact commit purpose,
- [ ] exact staged files,
- [ ] test commands and results,
- [ ] known limitations,
- [ ] explicitly excluded work,
- [ ] and `READY TO COMMIT` or `NOT READY`.

No push occurs unless explicitly requested.

---

# 25. Release Acceptance Gate

The Work experience is release-ready only when all conditions below are true.

## 25.1 Product

- [ ] `05C` modules are implemented or explicitly deferred.
- [ ] Deferred modules are not implied in marketing or UI.
- [ ] Product boundaries are visible in copy.
- [ ] Free/Premium value is coherent.

## 25.2 Technical

- [ ] `06C` contracts are implemented.
- [ ] Canonical model is stable and versioned.
- [ ] Projections are client-safe.
- [ ] Narrative is bounded.
- [ ] Failure modes are graceful.

## 25.3 Quality

- [ ] Fixture matrix passes.
- [ ] Locale matrix passes.
- [ ] Accessibility passes.
- [ ] Visual QA passes.
- [ ] Performance passes.
- [ ] Security review passes.

## 25.4 Trust

- [ ] Users can distinguish tendency from fact.
- [ ] Users can distinguish person truth from pair truth.
- [ ] Users can understand why an insight appears at the approved explanation level.
- [ ] No output could reasonably be mistaken for an employment decision tool.
- [ ] High-risk warnings remain proportionate and actionable.

## 25.5 Final verdict

Release verdict must be one of:

- [ ] `READY TO RELEASE`
- [ ] `READY WITH DOCUMENTED LIMITATIONS`
- [ ] `NOT READY`

A vague “mostly done” verdict is not allowed.

---

# 26. Explicit Non-Goals for Initial Implementation

Unless `05C` is amended, the initial Work implementation does not include:

- [ ] employee performance scoring,
- [ ] hiring or candidate screening,
- [ ] promotion likelihood,
- [ ] compensation recommendations,
- [ ] termination risk,
- [ ] legal or HR compliance judgment,
- [ ] workplace harassment diagnosis,
- [ ] fixed profession recommendations,
- [ ] company culture certification,
- [ ] team-wide optimization from only two people,
- [ ] organizational power inference,
- [ ] or guaranteed conflict resolution.

---

# 27. Handoff to Engineering

Engineering begins with a **confirm-only audit**, not implementation.

The first engineering response must include:

1. current Work pipeline,
2. existing file inventory,
3. field provenance,
4. reusable vs legacy classification,
5. missing canonical judgments,
6. proposed W0–W12 batch mapping,
7. exact first-batch file scope,
8. risks to Romantic, Friend, and Family,
9. tests that currently exist,
10. and a recommendation: `READY`, `READY WITH CONDITIONS`, or `NOT READY`.

Until that audit is approved:

- no production code changes,
- no document patching,
- no commits,
- and no pushes.

---

# 28. Final Implementation Principle

The Work product succeeds when it helps people answer:

```text
How do I naturally work?
What value do I tend to add?
What support helps me operate well?
How do we divide ownership?
Where do we create friction?
How do we decide, communicate, and repair?
What should we actually do differently next time?
```

The implementation must not answer a different question:

```text
Who is better?
Who is more talented?
Who should be hired?
Who will succeed?
Who is the problem?
```

Every evidence contract, judgment, projection, visual, narrative, test, and commit gate in this document exists to preserve that boundary.
