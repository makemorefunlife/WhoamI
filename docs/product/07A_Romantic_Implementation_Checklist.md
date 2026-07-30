# 07A — Romantic Implementation Checklist

**Version:** 1.1  
**Status:** Canonical  
**Owner:** Product Director  
**Applies to:** Ahaitsme Romantic  
**Depends on:**

- `05N_Ahaitsme_Narrative_Style_Bible.md`
- `docs/dev/decisions/027_romantic-saju-deep-narrative-freeze.md`
- `05A_Romantic_Product_Blueprint.md`
- `06A_Romantic_Technical_Blueprint.md`

---

## Authority

This document is the implementation and release checklist for Ahaitsme Romantic.

It does not redefine product philosophy, technical architecture, or narrative voice. It validates compliance with the governing documents below.

Authority hierarchy:

1. `01_Product_Vision.md`
2. `02_Relationship-ux-bible.md`
3. `05_Relationship_Product_Bible.md`
4. `05N_Ahaitsme_Narrative_Style_Bible.md` — shared narrative and voice SSOT
5. `05A_Romantic_Product_Blueprint.md`
6. `06A_Romantic_Technical_Blueprint.md`
7. `07A_Romantic_Implementation_Checklist.md`

Romantic-specific prompt freezes, section contracts, and validation rules remain governed by:

- `docs/dev/decisions/027_romantic-saju-deep-narrative-freeze.md`
- the current Romantic prompt pack and its `postValidate` layer
- shared Korean and English tone guards

When this checklist restates a narrative principle, the Narrative Style Bible remains the source of truth.

---

## 0. Purpose

This document is the final implementation and release gate for Ahaitsme Romantic.

It does not define the product or the architecture. It verifies that the implementation faithfully follows the Product Blueprint and Technical Blueprint.

A feature is not complete because it renders, passes typecheck, or produces valid JSON. It is complete only when it preserves the intended Romantic experience.

> The implementation must help users recognize, understand, and act on their relationship—not merely display analysis.

---

## 1. Release Verdict

Use one final verdict only:

- **READY TO COMMIT** — scope is correct and all required checks pass.
- **READY TO RELEASE** — commit is verified and all release checks pass.
- **NEEDS REVISION** — product, narrative, evidence, UX, or technical requirements remain unresolved.
- **BLOCKED** — required evidence, contract, dependency, or ownership is missing.

A release cannot be approved while any Critical item is incomplete.

---

# Part I — Product Constitution Gate

## 2. Relationship Experience

### Critical

- [ ] The result feels like a relationship experience, not a diagnostic report.
- [ ] The relationship—not either individual, the score, the chart, or the model—is the protagonist.
- [ ] The experience explains the couple before advising them.
- [ ] The report does not judge whether the relationship is good, bad, superior, or doomed.
- [ ] The user can understand the central relationship pattern without reading raw evidence.

### Quality

- [ ] The reading flow creates curiosity and continued momentum.
- [ ] The user is likely to recognize at least one familiar scene or recurring pattern.
- [ ] The ending leaves understanding, agency, and hope rather than anxiety.
- [ ] At least one module has meaningful re-read value after a conflict or important conversation.

---

## 3. Human Question Contract

Every major section must answer one human relationship question.

- [ ] The section question can be written in one natural sentence.
- [ ] The question reflects something a real couple would want to understand.
- [ ] The section is organized around the question—not around the available data source.
- [ ] The section does not combine unrelated questions merely because they share evidence.
- [ ] The answer is clear before secondary details appear.

Examples of valid questions:

- Why do we feel so different here?
- Why does the same misunderstanding keep repeating?
- What makes this relationship feel unusually important?
- What happens between us when conflict begins?
- How do we get close again after tension?

---

## 4. Emotional Journey

The full report should move through the following emotional sequence:

- [ ] **Curiosity** — the Hero creates a reason to continue.
- [ ] **Recognition** — the user sees the couple in the description.
- [ ] **Surprise** — the report reveals a non-obvious but supported pattern.
- [ ] **Understanding** — the report explains why the pattern occurs.
- [ ] **Relief** — differences are translated without blame.
- [ ] **Action** — the couple receives a usable next step.
- [ ] **Hope** — the report ends with possibility, not fear.

### Surprise Density

- [ ] Surprise is not limited to the Hero.
- [ ] Each major section contains at least one meaningful recognition or discovery moment.
- [ ] Surprise comes from synthesis, contrast, hidden motive, pattern, or timing—not exaggeration.
- [ ] No unsupported dramatic claim is used to manufacture surprise.

---

# Part II — Hero Gate

## 5. Hero Identity

### Critical

- [ ] No letter grade is displayed.
- [ ] No rank is displayed.
- [ ] No compatibility score leads the experience.
- [ ] No “good couple / bad couple” classification is implied.
- [ ] The Hero defines the relationship in human language.
- [ ] The Hero is traceable to deterministic evidence.

### Required Hero Components

- [ ] Couple names or a natural couple reference.
- [ ] One-line relationship identity.
- [ ] A concise explanation of what makes the relationship distinctive.
- [ ] A reason to continue reading.
- [ ] Optional signature or supporting cue that does not behave like a grade.

### Day Master Use

- [ ] Day Master or Day Pillar characteristics are translated into relationship behavior.
- [ ] Simplistic elemental mascot labels are not used as the final interpretation.
- [ ] The copy explains how each tendency appears between these two people.
- [ ] The Hero does not reduce either person to one symbolic archetype.

---

# Part III — Story and Evidence Gate

## 6. Story-First Order

### Critical

- [ ] Story or relationship meaning appears before detailed evidence.
- [ ] Evidence supports the story rather than replacing it.
- [ ] Advice does not appear before recognition and explanation.
- [ ] The user is not required to interpret a chart to understand the conclusion.

Canonical order:

```text
Human question
  → Relationship story
  → Recognition or scene
  → Supporting evidence
  → Interpretation
  → Action or reflection
```

---

## 7. Evidence Integrity

### Critical

- [ ] Every narrative claim is supported by available evidence.
- [ ] Every important claim can be traced to its source.
- [ ] No evidence is silently invented, inferred beyond contract, or upgraded in confidence.
- [ ] Conflicting evidence is handled explicitly.
- [ ] Missing evidence produces omission, fallback, or cautious language—not fabrication.

### Evidence Sources

Check all sources used in the implementation:

- [ ] Saju-derived evidence is mapped correctly.
- [ ] Psych-axis evidence is mapped correctly.
- [ ] Pair interaction evidence is mapped correctly.
- [ ] Canonical Romantic signals are mapped correctly.
- [ ] Contextual evidence is used only within its approved scope.
- [ ] Legacy evidence is not treated as canonical without an explicit adapter or migration rule.

### Visualization Contract

- [ ] Every radar chart has a clear narrative purpose.
- [ ] Every comparison table has an interpretation.
- [ ] Every numeric value has human meaning.
- [ ] No visualization duplicates the surrounding prose without adding clarity.
- [ ] No visualization is included merely because data exists.

---

## 8. Confidence and Severity

### Critical

- [ ] Evidence confidence and relationship severity are separate fields.
- [ ] Low confidence does not automatically mean low importance.
- [ ] High severity does not automatically mean high certainty.
- [ ] Tone reflects the actual confidence tier.
- [ ] Unsupported direction is omitted rather than presented as tentative fact.

### Confidence

- [ ] Corroborated evidence uses clear but non-deterministic language.
- [ ] Refined evidence uses appropriately qualified language.
- [ ] Tentative evidence is framed as a possibility or pattern to notice.
- [ ] Unknown or unsupported evidence is not narrated as a conclusion.

### Severity

- [ ] Strength is not written like a hidden risk.
- [ ] Difference is not automatically written as conflict.
- [ ] Friction is not escalated into structural danger.
- [ ] Structural-risk language is used only when the evidence contract supports it.
- [ ] Every difficult pattern includes a usable path toward understanding or repair.

---

# Part IV — Deterministic and LLM Boundary Gate

## 9. Deterministic Engine Responsibilities

- [ ] Classification is produced deterministically.
- [ ] Direction is produced deterministically where required.
- [ ] Confidence is assigned outside the LLM.
- [ ] Severity is assigned outside the LLM.
- [ ] Canonical evidence references are generated outside the LLM.
- [ ] Badge eligibility is determined outside the LLM.
- [ ] Section inclusion or exclusion is determined outside the LLM.
- [ ] Fallback behavior is deterministic.

---

## 10. LLM Responsibilities

The LLM may:

- [ ] Translate evidence into natural language.
- [ ] Connect multiple approved sources into one supported insight.
- [ ] Write scenes, explanations, transitions, and practical guidance.
- [ ] Adapt tone and phrasing to locale.
- [ ] Reduce repetition while preserving meaning.

The LLM must not:

- [ ] Create new evidence.
- [ ] Change deterministic direction or classification.
- [ ] Invent a personality trait.
- [ ] Invent a conflict history or relationship event.
- [ ] Assign a grade, rank, diagnosis, fate, or prognosis.
- [ ] Turn a tentative signal into a certain statement.
- [ ] introduce marriage-only content into Romantic.
- [ ] contradict the canonical relationship signals.

---

## 11. Narrative Traceability

- [ ] Each generated module receives only approved evidence.
- [ ] Evidence identifiers remain available for audit.
- [ ] The final output can be traced from UI copy to narrative field to evidence source.
- [ ] Prompt instructions cannot override deterministic values.
- [ ] Narrative generation failure does not corrupt the deterministic result.
- [ ] Debug or provenance data is server-only unless explicitly approved for the client.


### Shared Narrative Style Bible Compliance

Every Romantic narrative must comply with the shared Narrative Style Bible. This checklist does not redefine those laws.

- [ ] Recognition appears before advice.
- [ ] Tendencies are written as tendencies, not fixed truths.
- [ ] Evidence precedes interpretation.
- [ ] No evidence, event, motive, or contrast is fabricated.
- [ ] Advice is shaped by the finding rather than attached generically.
- [ ] Narrative length is proportional to evidence strength and importance.
- [ ] Both readers retain dignity.
- [ ] Warmth does not become artificial intimacy.
- [ ] Everyday language is preferred over encyclopedia or fortune-telling language.
- [ ] Epistemic wording matches the evidence tier.

### Romantic Freeze Compliance

Every narrative release must satisfy the current Romantic freeze decision and its Master Check.

- [ ] Prompt contracts remain within the approved freeze boundary.
- [ ] Section responsibilities are preserved.
- [ ] Output schema remains compatible.
- [ ] Current `postValidate` checks pass.
- [ ] The Romantic Narrative Freeze Master Check passes.
- [ ] No prompt expansion bypasses the freeze amendment process.
- [ ] Production-disabled self-refine paths remain disabled unless separately approved.

---

# Part V — Canonical Signal Gate

## 12. Romantic Canonical Vertical Slices

Verify applicable slices:

- [ ] `balance_of_power`
- [ ] `recovery_speed`
- [ ] `reassurance_signal`
- [ ] `unconscious_role_play`
- [ ] `residual`
- [ ] `expression_speed`

For every implemented slice:

- [ ] Server is the source of truth.
- [ ] Resolver output is canonical.
- [ ] Client receives only the approved projection.
- [ ] Direction is not reconstructed on the client.
- [ ] Confidence is preserved correctly.
- [ ] Null direction removes unsupported projection.
- [ ] Badge rules match the approved product contract.
- [ ] LLM provides prose only where permitted.

### Special Rules

- [ ] `residual` remains evidence-only unless the Product Blueprint is formally changed.
- [ ] `residual` does not receive a standalone badge.
- [ ] `expression_speed` direction remains psych-owned.
- [ ] `recovery_speed` does not absorb residual meaning.
- [ ] Slice injection order remains canonical or is intentionally versioned.

Canonical injection order:

```text
balance_of_power
  → recovery_speed
  → reassurance_signal
  → unconscious_role_play
  → residual
  → expression_speed
  → section summary / context / meta
```

---

# Part VI — Experience Module Gate

## 13. Required Product Assets

Confirm the product preserves and correctly places applicable assets:

- [ ] Hero
- [ ] Scenario UX
- [ ] Difference Map
- [ ] 11-axis radar
- [ ] Comparison tables
- [ ] Hidden Heart
- [ ] Relationship Flow
- [ ] Before/After dialogue
- [ ] Timeline
- [ ] Guide or Repair Guide
- [ ] Deep Read
- [ ] Final reflection or closing

A module may be intentionally omitted only when:

- evidence is unavailable,
- the module would be redundant,
- the product contract makes it optional, or
- an approved migration stage has not reached it.

The omission reason must be explicit.

---

## 14. Module-Level Review

For every major module:

- [ ] It answers one human question.
- [ ] It has a defined emotional purpose.
- [ ] It has a defined evidence contract.
- [ ] It has a defined narrative responsibility.
- [ ] It has a defined UI responsibility.
- [ ] It avoids duplicating another module.
- [ ] It has an empty-state or fallback rule.
- [ ] It preserves locale and address rules.
- [ ] It ends with understanding, movement, or reflection.

---

## 15. Dialogue and Scenario UX

- [ ] Dialogue represents approved relationship patterns rather than invented history.
- [ ] Speaker identity is clear.
- [ ] Korean dialogue avoids ambiguous anonymous speakers when names or roles are available.
- [ ] “너” is not used except in intentional quoted dialogue.
- [ ] Before/After dialogue demonstrates a real translation or repair improvement.
- [ ] The improved dialogue does not sound therapeutic, robotic, or implausibly perfect.
- [ ] Scenario copy reflects the same deterministic pattern as the surrounding explanation.

---

## 16. Timeline and Relationship Flow

- [ ] Timeline stages reflect approved evidence and product meaning.
- [ ] The flow explains pattern development rather than predicting fixed destiny.
- [ ] No unsupported future event is stated as certain.
- [ ] The timeline adds understanding that static sections cannot provide.
- [ ] The current relationship phase is not inferred beyond available evidence.

---

## 17. Repair Guide and Action

- [ ] Guidance follows recognition and explanation.
- [ ] Guidance is specific enough to use.
- [ ] Guidance is realistic for the described couple.
- [ ] Guidance does not promise guaranteed outcomes.
- [ ] Guidance does not require either person to erase their personality.
- [ ] Advice is consistent with the evidence and earlier story.
- [ ] Difficult sections end with agency and hope.

---

# Part VII — Copy and Localization Gate

## 18. Voice

The shared Narrative Style Bible owns invariant voice rules. Romantic owns only its domain register, section jobs, and approved terminology.

- [ ] Warm, intelligent, and concise.
- [ ] Friendly without becoming casual or careless.
- [ ] Clear without sounding clinical.
- [ ] Insightful without claiming omniscience.
- [ ] Gentle without avoiding difficult truths.
- [ ] The same Ahaitsme voice is recognizable across modules.
- [ ] Romantic language permits intimacy and emotion without fake closeness.
- [ ] The prose sounds like an insightful interpreter, not a judge or fortune-teller.

### Humor and Playfulness Budget

Humor is optional. It must support recognition and warmth, never replace empathy.

- [ ] No more than one or two light moments appear in a report unless explicitly approved.
- [ ] Humor is never sarcastic.
- [ ] Neither partner is mocked or reduced to a punchline.
- [ ] Humor does not trivialize conflict, vulnerability, or pain.
- [ ] Playfulness does not weaken evidence accuracy or confidence language.

---

## 19. Prohibited Copy Patterns

- [ ] No ranking language.
- [ ] No “perfect match” or “bad match” conclusion.
- [ ] No deterministic fate language.
- [ ] No medical or psychological diagnosis.
- [ ] No blame assignment disguised as analysis.
- [ ] No direct restatement of raw evidence as if it were insight.
- [ ] No stock advice disconnected from the specific couple.
- [ ] No excessive hedging that makes supported findings meaningless.
- [ ] No confidence inflation.
- [ ] No unsupported A-versus-B contrast.
- [ ] No generic “one is fast, one is detailed” contrast unless evidence explicitly supports it.

### Unsupported Contrast Gate

A comparison may appear only when deterministic evidence supports the distinction.

Forbidden example pattern:

```text
A is emotional while B is logical.
```

unless approved evidence explicitly supports both sides of that contrast.

- [ ] Every contrast is traceable to deterministic evidence.
- [ ] Directional ownership is correct.
- [ ] Missing support causes omission, not invention.
- [ ] Similarity is not rewritten as contrast merely to create drama.

---

## 20. Claim Deduplication

The same insight must not be repeated across sections under different wording.

- [ ] Every section contributes new understanding.
- [ ] Identical observations do not recur.
- [ ] Explanations are not paraphrased repeatedly.
- [ ] Advice is not duplicated across multiple modules.
- [ ] Headlines and bodies do not restate the same claim without adding meaning.
- [ ] Claim-level duplication is reviewed across the entire report, not only within sections.

---

## 21. Address and Pronouns

- [ ] Names are preferred when available.
- [ ] Roles are used when they improve clarity.
- [ ] Anonymous “A/B” phrasing is avoided in final narrative unless necessary.
- [ ] Korean honorific level is consistent.
- [ ] Korean does not unexpectedly switch to 반말.
- [ ] English does not assign gendered pronouns without data.
- [ ] Quotes and dialogue preserve clear speaker ownership.
- [ ] First-person lines remain bound to the correct speaker.

---

## 22. Locale and Meaning Parity

- [ ] Explicit `en-US` produces English narrative and labels.
- [ ] Explicit `ko-KR` produces Korean narrative and labels.
- [ ] Omitted locale follows the approved legacy fallback.
- [ ] No silent language switching occurs.
- [ ] UI labels, generated prose, badges, and fallbacks use the same locale.
- [ ] Cache keys include locale where narrative or labels are locale-sensitive.
- [ ] Korean and English are equivalent in meaning, not mechanically translated.

### Bilingual Meaning Parity

Allowed:

- Different sentence structure
- Different idioms
- Different natural phrasing
- Locale-appropriate rhythm and emphasis

Not allowed:

- Different judgments
- Different evidence
- Different conclusions
- Different confidence
- Different severity
- Different assignment of responsibility or speaker ownership

### Tone Guard Dependency

Before release verify:

- [ ] Shared Korean tone guards pass.
- [ ] Shared English tone guards pass.
- [ ] Locale routing is correct.
- [ ] Korean and English preserve the same relationship meaning.
- [ ] Tone differences are linguistic only.
- [ ] Tone guards do not alter canonical judgment or evidence.

---

# Part VIII — Romantic Boundary Gate

## 23. Romantic Ownership

The Romantic product may cover:

- [ ] Attraction
- [ ] Affection
- [ ] Emotional compatibility
- [ ] Difference and misunderstanding
- [ ] Conflict dynamics
- [ ] Reassurance and expression
- [ ] Repair and reconnection
- [ ] Emotional growth
- [ ] Relationship evolution

---

## 24. Marriage Boundary

The Romantic product must not become the owner of:

- [ ] Financial planning or asset management
- [ ] Household labor systems
- [ ] Parenting strategy
- [ ] Long-term family operations
- [ ] Legal or institutional marriage planning
- [ ] Detailed cohabitation logistics owned by another product

Incidental references are permitted only when they explain an emotional Romantic pattern and do not replace the Marriage or Cohabitation product.

---

# Part IX — Technical Gate

## 25. Server and SSOT

### Critical

- [ ] Canonical relationship logic lives on the server.
- [ ] Client code does not recreate classifications or direction.
- [ ] Resolver ownership is unambiguous.
- [ ] Shared contracts are versioned where necessary.
- [ ] Legacy paths cannot silently override canonical output.
- [ ] Server strips non-client-safe fields before response.

---

## 26. Client Projection

- [ ] Client receives only fields needed for approved UX.
- [ ] Projection fields match the canonical type contract.
- [ ] Unsupported or null signals do not render misleading UI.
- [ ] Badge rendering follows server eligibility.
- [ ] UI ordering follows the Product Blueprint.
- [ ] Client fallbacks do not invent business meaning.
- [ ] Debug evidence is not exposed to users.

---

## 27. Data Contracts

- [ ] Required fields are explicitly typed.
- [ ] Optional fields have defined semantics.
- [ ] `null`, omitted, and unsupported are not treated interchangeably without intent.
- [ ] Enum values are documented and stable.
- [ ] Confidence values are documented and stable.
- [ ] Evidence references are machine-auditable.
- [ ] Schema changes include migration and compatibility consideration.
- [ ] Cached outputs are invalidated when the relevant contract changes.

---

## 28. Failure and Fallback

- [ ] Deterministic analysis survives LLM failure.
- [ ] A failed narrative field does not blank the full report.
- [ ] Unsupported sections fail closed.
- [ ] Fallback prose does not contradict deterministic output.
- [ ] Retry behavior is bounded.
- [ ] Error logging excludes unnecessary personal data.
- [ ] The user sees a coherent experience even when enrichment is unavailable.

---

## 29. Security and Privacy

- [ ] Sensitive source data remains server-side unless required by the product.
- [ ] Prompts include only the minimum necessary evidence.
- [ ] Logs do not expose full private narrative inputs without approved handling.
- [ ] Cache scope prevents cross-user or cross-couple leakage.
- [ ] Locale and relationship identifiers cannot collide across cached responses.
- [ ] Client-safe projection has been explicitly reviewed.

---

## 30. Performance

- [ ] Report generation time is measured.
- [ ] Deterministic analysis is not duplicated unnecessarily.
- [ ] LLM calls are bounded by module and purpose.
- [ ] Repeated evidence is packaged once where possible.
- [ ] Cache behavior preserves correctness before speed.
- [ ] Progressive rendering does not break the intended story order.
- [ ] Failure in a late module does not block already valid earlier modules without reason.

---

# Part X — Testing Gate

## 31. Deterministic Tests

- [ ] Resolver unit tests cover each direction.
- [ ] Boundary thresholds are tested.
- [ ] Null and missing-input behavior is tested.
- [ ] Confidence mapping is tested.
- [ ] Severity mapping is tested.
- [ ] Symmetric couple inputs remain symmetric where required.
- [ ] Directional couple inputs preserve speaker or partner ownership.
- [ ] Locale-independent deterministic output remains stable.

---

## 32. Projection Tests

- [ ] Server-to-client projection is tested.
- [ ] Non-client-safe fields are stripped.
- [ ] Unsupported direction removes badges and dependent UI.
- [ ] Evidence-only signals remain non-badged.
- [ ] Rendering contracts survive omitted optional fields.
- [ ] No client business logic is required to reconstruct meaning.

---

## 33. Narrative Contract Tests

- [ ] Generated text does not contradict canonical direction.
- [ ] Low-confidence inputs produce qualified language.
- [ ] Unsupported evidence does not appear in prose.
- [ ] Advice matches the described relationship pattern.
- [ ] Headline and body are consistent.
- [ ] Section outputs do not repeat one another excessively.
- [ ] Korean and English satisfy the same product contract.
- [ ] Address and speaker rules are tested.

---

## 34. Product Regression Tests

- [ ] Hero does not regress to grade-first presentation.
- [ ] Story remains before evidence.
- [ ] Advice remains after understanding.
- [ ] Each section continues to answer one human question.
- [ ] Marriage-owned topics do not leak into Romantic.
- [ ] Existing successful assets remain present or intentionally migrated.
- [ ] The emotional journey remains intact after layout changes.
- [ ] Re-read modules remain easy to find.

---

## 35. Manual Editorial Review

Review at least:

- [ ] One highly aligned couple fixture.
- [ ] One high-difference couple fixture.
- [ ] One conflict-heavy but repair-capable fixture.
- [ ] One low-confidence fixture.
- [ ] One sparse-evidence fixture.
- [ ] One Korean report.
- [ ] One English report.

For each fixture, confirm:

- [ ] The couple feels specific rather than generic.
- [ ] The prose is supported.
- [ ] The story feels natural rather than assembled.
- [ ] Reading rhythm flows across sections.
- [ ] The emotional arc works.
- [ ] Story precedes explanation.
- [ ] No section overstates certainty.
- [ ] No unsupported contrast appears.
- [ ] Important claims are traceable.
- [ ] Claim-level repetition is acceptably low.
- [ ] Advice follows naturally from the story.
- [ ] Korean and English preserve meaning parity.
- [ ] Humor, if present, stays within the approved budget.
- [ ] The final impression is understanding rather than judgment.

---

# Part XI — Migration and Scope Gate

## 36. Change Scope

Before commit:

- [ ] The exact intended files are listed.
- [ ] Unrelated product areas are excluded.
- [ ] Prompt tuning is not mixed into deterministic logic changes unless explicitly approved.
- [ ] UI redesign is not mixed into resolver changes unless explicitly approved.
- [ ] Legacy cleanup is separated when it increases review risk.
- [ ] Product behavior changes are documented.
- [ ] Contract changes identify affected callers, caches, tests, and renderers.

---

## 37. Legacy Preservation and Removal

- [ ] Successful UX assets are preserved unless the Product Blueprint explicitly replaces them.
- [ ] Deprecated grades and archetype labels are fully removed from active paths.
- [ ] Old and new render paths cannot appear simultaneously by accident.
- [ ] Legacy data is adapted explicitly or rejected safely.
- [ ] Dead code removal happens only after replacement coverage is verified.
- [ ] Migration does not silently alter unrelated relationship products.

---

## 38. Commit Gate

A change is **READY TO COMMIT** only when:

- [ ] The declared scope matches the actual diff.
- [ ] Typecheck passes.
- [ ] Required unit and regression tests pass.
- [ ] No unrelated files are staged.
- [ ] Product Blueprint compliance is reviewed.
- [ ] Technical Blueprint compliance is reviewed.
- [ ] Narrative and evidence contracts are reviewed.
- [ ] Locale behavior is verified.
- [ ] The commit message describes the actual canonical change.
- [ ] Push status is explicitly stated.

Recommended audit summary:

```text
Verdict:
Scope:
Files changed:
Tests:
Product risks:
Technical risks:
Narrative risks:
Locale status:
Commit status:
Push status:
```

---

# Part XII — Final Release Gate

## 39. Final Experience Questions

After reading the report, is the user likely to think at least some of the following?

- [ ] “이거 우리 이야기인데?”
- [ ] “그래서 계속 엇갈렸던 거구나.”
- [ ] “상대가 왜 그랬는지 조금 알겠다.”
- [ ] “이 부분은 같이 보여주고 싶다.”
- [ ] “다음에는 이렇게 말해봐야겠다.”
- [ ] “싸운 뒤에 다시 읽어보고 싶다.”

If the dominant reaction is only “점수가 몇 점이지?” or “그래서 좋은 궁합이야, 나쁜 궁합이야?”, the implementation has failed the product intent.

---

## 40. READY TO RELEASE

A Romantic release is **READY TO RELEASE** only when:

### Product

- [ ] 05A Product Blueprint passes.
- [ ] The relationship remains the protagonist.
- [ ] Emotional journey and story-first order pass.
- [ ] Grade, rank, and judgment are absent.

### Technical

- [ ] 06A Technical Blueprint passes.
- [ ] Deterministic and LLM ownership is preserved.
- [ ] Evidence is traceable.
- [ ] Server SSOT and client-safe projection pass.
- [ ] Fallback, cache, privacy, and locale behavior pass.

### Quality

- [ ] Automated tests pass.
- [ ] Manual UX review passes.
- [ ] Editorial review passes.
- [ ] Evidence review passes.
- [ ] Localization review passes.
- [ ] Final Product Director review passes.

---

# 41. Non-Negotiable Technical Laws

1. **Product defines technology. Technology never defines the product.**
2. **The relationship is the protagonist.**
3. **Story comes before detailed evidence.**
4. **Recognition comes before advice.**
5. **The LLM never creates canonical truth.**
6. **Every important narrative claim must be traceable.**
7. **Confidence and severity must remain separate.**
8. **Unsupported direction must fail closed.**
9. **The client never reconstructs server-owned meaning.**
10. **No grade, rank, or fate may replace understanding.**
11. **Every section answers one human question.**
12. **Every difficult truth must preserve agency and hope.**
13. **Successful UX assets are reorganized before they are redesigned.**
14. **Romantic does not absorb Marriage-owned operations.**
15. **Technology should disappear behind the experience.**

---

# Final Principle

The user should not leave thinking about algorithms, scores, prompts, evidence tiers, or architecture.

They should leave thinking:

> Someone finally explained what happens between us—and now we know what to try next.
