# Ahaitsme Product Documentation

## Purpose

This directory contains the governing product, experience, editorial, market,
and technical specifications for Ahaitsme.

These documents are not informal notes.

They are implementation references and decision-making authorities for:

- product design
- UX architecture
- deterministic analysis
- narrative generation
- visual design
- localization
- testing
- technical implementation
- AI-assisted development

The documents should be read according to ownership and task relevance.

Do not treat every document as equally authoritative for every question.

---

# 1. Documentation Map

## `01_Product_Vision.md`

### Owns

- company mission
- product purpose
- core user value
- long-term product direction
- philosophical boundaries
- what Ahaitsme is and is not

### Use when

- evaluating whether a feature belongs in the product
- resolving product-purpose questions
- assessing strategic alignment
- defining long-term direction

---

## `02_Relationship_UX_Bible.md`

> **Filename note:** the file on disk is `02_Relationship-ux-bible.md` (hyphenated, lowercase). This is the same document; other governing docs cite it under both spellings. Treat them as one file — a rename to match this canonical name is a low-risk cleanup item still open (see `10` §1.2).

### Owns

- universal relationship UX laws
- editorial principles
- narrative behavior
- tone and address rules
- confidence-aware communication
- repetition control
- user-respect boundaries
- shared reading principles

### Use when

- writing or reviewing user-facing language
- defining narrative contracts
- evaluating tone
- resolving UX-writing inconsistencies
- reviewing Korean and English experience quality

---

## `03_Market_Research.md`

### Owns

- market observations
- competitor analysis
- user expectations
- category conventions
- market opportunities
- product differentiation evidence

### Use when

- validating product-market relevance
- comparing feature expectations
- evaluating positioning
- identifying category gaps

### Limitation

Market research informs product decisions.

It does not override Ahaitsme's governing product principles.

---

## `05_Relationship_Product_Bible.md`

### Owns

- shared relationship experience architecture (product SSOT)
- relationship reading journey and emotional pacing
- information hierarchy
- component responsibilities (product intent)
- cards, scores, graphs, and narrative roles
- progressive disclosure
- evidence presentation
- reflection and decision-support structure
- shared cross-product experience laws
- Relationship Insight Bible and Romantic + Marriage elaboration
- **§13D Shared Visualization & Evidence Contract** (selective 11-axis; Psych vs Saju separation; Saju comparison-table law; visual explanation; Visual First → Explanation → Story → Action; one canonical judgment / multiple projections; type not rank; shared visual / product-specific meaning)

### Inherited by

- Romantic
- Marriage / Cohabitation
- Friend
- Work
- Family
- future relationship products

### Use when

- designing or restructuring relationship-report experiences
- deciding what should appear first
- deciding whether information belongs in a card, graph, score, or narrative
- consolidating duplicated output
- defining shared relationship components
- reviewing whether a report feels coherent and premium
- locking cross-product visualization and evidence laws before domain blueprints (e.g. Work `05C`)

---

## `05A_Romantic_Product_Blueprint.md`

### Owns

- Romantic Product SSOT (sole)
- Romantic-specific product questions, jobs, and promise
- Romantic narrative laws and storytelling principles
- Romantic module architecture (ten modules + depth/share surfaces)
- Romantic signal and asset keep/reframe/reposition rules
- Romantic premium strategy and success criteria
- Romantic-specific boundaries vs Marriage

### Inherits

- `01_Product_Vision.md`
- `02_Relationship_UX_Bible.md` / `02_Relationship-ux-bible.md`
- `05_Relationship_Product_Bible.md`

### Use when

- making Romantic product decisions
- defining Romantic report structure
- deciding which shared rules require Romantic-specific interpretation
- evaluating Romantic user value

---

## `06_Visual_Design_System.md` (titled internally "06. Experience Design System")

> **Scope expanded 2026-07-27** (canonicalization refactor, see `10`): this document grew from a visual-tokens-only spec into the full Experience Design System — it now also owns brand identity, IA/navigation principles, and the complete report-grammar/component-verdict ledger that used to be split across this file, `05` §14–§18, and the archived Visual Foundations / Romantic module-evaluation trails (`docs/product/archive/`).

### Owns

- brand identity (mark, color, type) and the relationship Visual Design System (sole expression SSOT)
- typography, color, spacing, motion, and accessibility boundaries
- IA and navigation principles (progressive disclosure, navigation patterns, interaction safety)
- card / section / chart / loop / evidence / empty-state anatomy — the full report grammar
- the complete Romantic Module Visual Evaluation Ledger (§6A) and visualization concept vocabulary (§10A)
- **Shared Visual Asset Library** (stable VA-01…VA-09 geometry IDs)
- Save/Share/Revisit presentation rules
- future app-shell / extensibility considerations
- visualization decision rubric

### Inherits

- `05_Relationship_Product_Bible.md` (metaphor, measurement intent, §13D visualization/evidence contract)
- `05A_Romantic_Product_Blueprint.md` (Romantic module catalog and anti-dashboard laws)

### Does not own

- product meaning, classifications, confidence/severity, or narrative voice
- product-specific axes, row vocabularies, thresholds, warnings, or actions
- current-implementation status (→ `08`) or design-exploration rationale/product-owner decisions (→ `09`)

### Superseded (archived, historical only — do not cite as authority)

- `docs/product/archive/ARCHIVE_Visual_Foundations.md` (ex-`06A_Visual_Foundations`) — archived; content in `06` §1, §6A, §10A
- `docs/product/archive/ARCHIVE_Romantic_Module_Visual_Evaluation.md` (ex-`06D_Module_Evaluation`) — archived; full ledger in `06` §6A
- `11_relationship_product_visual_blueprint_integrated.md` — reduced to a pointer; content already fully present in `05`

### Use when

- designing or reviewing any relationship report UI
- choosing or rejecting a visualization
- citing a shared VA-ID instead of inventing parallel geometry
- defining tokens, brand values, IA/navigation patterns, empty states, or share surfaces
- migrating legacy chrome (gauges, grade dials, traffic-light score colors)

---

## `05N_Ahaitsme_Narrative_Style_Bible.md`

### Owns

- narrator identity, tone, and emotional posture
- evidence-aware and confidence-aware interpretation language
- advice/action writing rules, repetition control, humor budget
- address, naming, dignity, and bilingual meaning-parity rules
- genre bans (fortune-telling, diagnosis, horoscope copy, personality-test copy, corporate-assessment copy, generic self-help)

### Does not own

- product meaning, classifications, or visual expression
- domain-specific module catalogs (owned by `05A`–`05E`)

### Known open issue

- A second, structurally different document, `docs/dev/05_NARRATIVE_STYLE_BIBLE.md` (an "Invariant Core" with register dials, domain bands, and a frozen lexicon system), is still cited by `01`, `05B`, `06B`, and `07A`. The two have not been reconciled — treat `05N` as primary since it is the version under `docs/product/` and the one required by name in design-brief work, but resolving this fully requires a product-owner decision (tracked in `09` §6.3 and `10` §10.3).

### Use when

- writing or reviewing any user-facing narrative copy
- defining or auditing a domain's narrative supplement

---

## `08_Current_Product_Implementation_Design_Extraction.md`

### Owns

- **current implementation reality only** — repository-backed sitemap, user journey, IA, data contracts, UI/visualization inventory, and documentation-vs-code gaps
- the factual Stitch/Lovable vs. legacy Space brand-baseline classification (Appendix A)

### Does not own

- product philosophy (→ `05`), visual/brand rule authority (→ `06`), or design intent/rationale/open decisions (→ `09`)

### Use when

- determining what is actually shipping today, as opposed to what a blueprint targets
- briefing a design tool on current UI/IA reality before proposing a new one
- auditing documentation-vs-code drift

---

## `09_Product_and_Design_Intent_Package.md`

### Owns

- product-owner decisions and the rationale that binds a design brief
- brand-preservation rationale (token values live in `06`; as-built inventory in `08`)
- preserve / reinterpret / do-not-invent constraints for exploration
- unresolved decisions and inputs needed for a final brief
- UX exploration composition models (Editorial / Exploration / Guided Discovery) and the evaluation rubric

### Does not own

- product philosophy or journey law (→ `05` / `05A`–`05E` / `05N`)
- brand/visual token values or report grammar (→ `06`)
- current-implementation fact (→ `08`)
- cleanup / migration roadmap (→ `10`)

### Use when

- briefing a design tool for a new UX/UI exploration round
- resolving a disputed design rule (see its conflict table, §2.3)
- checking whether a given design direction is already ruled in/out by product-owner decision

---

## `10_Design_IA_Canonicalization_Refactor_Plan.md`

### Owns

- the documentation, visual-system, IA, copy, and code-path **cleanup roadmap**
- the phased **migration roadmap** (Phase 0–9) and its sequencing/dependencies
- **regression protection** recommendations (CI checks, forbidden-pattern tests)
- the **archive plan** for superseded documents and dead code

### Does not own

- product philosophy, visual rules, current-implementation fact, or design intent/decisions — those are recorded in `05`/`06`/`08`/`09` respectively and only referenced here
- any decision this plan doesn't have standing to make — see its own §10.3 pointer to `09` §6

### Use when

- planning or sequencing a documentation, visual-system, or code cleanup pass
- deciding what to archive vs. preserve vs. delete
- defining a CI regression check against a known-forbidden pattern (grades, traffic-light colors, dark+gold chrome, etc.)

---

## `06_Romantic_Technical_Blueprint.md` / `06A_Romantic_Technical_Blueprint.md`

### Owns

- Romantic technical architecture
- canonical data contracts
- server and client responsibilities
- deterministic ownership
- LLM input and output contracts
- cache and locale behavior
- migration sequence
- tests and validation
- implementation boundaries

### Inherits

- `05_Relationship_Product_Bible.md`
- `05A_Romantic_Product_Blueprint.md`
- `06_Visual_Design_System.md` (for expression constraints during implementation)

### Use when

- planning implementation
- modifying code
- defining schemas
- changing server projections
- integrating narrative generation
- building tests
- migrating existing Romantic output

### Limitation

Technical architecture implements product meaning and visual rules.

It must not redefine product meaning or silently invent a conflicting visual language.

---

# 2. Governing Order

When multiple documents apply, use the following order:

```text
01 Product Vision
↓
02 Relationship UX Bible
↓
05 Relationship Product Bible  ·  05N Narrative Style Bible (parallel authority, voice/tone)
↓
05A–05E Domain Product Blueprints (domain SSOT)
↓
06 Experience Design System (expression SSOT — brand, visual, IA/navigation, report grammar)
↓
06A–06E Relationship-Specific Technical Blueprints
↓
07A–07E Implementation Checklists (tracking only, not authority)
↓
Implementation
```

`03_Market_Research.md` provides supporting evidence and context. It is not above the governing product documents.

`08_Current_Product_Implementation_Design_Extraction.md` sits alongside this order as the **as-built reality reference** — not a governing layer, but the required cross-check before treating any target IA above as already shipped.

`09_Product_and_Design_Intent_Package.md` sits above **implementation** but below the governing product/visual layers — it synthesizes them into a design brief and records product-owner decisions; it does not itself define product meaning or visual rule.

`10_Design_IA_Canonicalization_Refactor_Plan.md` is process, not authority — it plans how to converge documentation and code on the order above; it does not change what the order means.

---

# 3. Conflict Resolution

When documents appear to conflict, resolve the conflict by ownership.

## Mission conflict

Use:

```text
01_Product_Vision.md
```

## UX, tone, or narrative conflict

Use:

```text
02_Relationship_UX_Bible.md
```

For narrator voice, tone register, or genre-ban specifics rather than UX architecture, use `05N_Ahaitsme_Narrative_Style_Bible.md` (see its "Known open issue" entry above for its unreconciled relationship to `docs/dev/05_NARRATIVE_STYLE_BIBLE.md`).

## Current-implementation vs. target-spec conflict

Use `08_Current_Product_Implementation_Design_Extraction.md` to determine what is actually shipping; use the owning `05*`/`06*` document to determine what the target should be. `08` never overrides product meaning — it only prevents mistaking a target spec for shipped reality, or vice versa.

## Shared relationship-experience conflict

Use:

```text
05_Relationship_Product_Bible.md
```

## Romantic-specific product conflict

Use:

```text
05A_Romantic_Product_Blueprint.md
```

## Visual expression / UI presentation conflict

Use:

```text
06_Visual_Design_System.md
```

Including Shared Visual Asset Library geometry (VA-IDs).

## Shared visualization / evidence-contract conflict

Use:

```text
05_Relationship_Product_Bible.md (§13D)
```

## Romantic implementation conflict

Use:

```text
06_Romantic_Technical_Blueprint.md
```
(or `06A_Romantic_Technical_Blueprint.md` when that is the active technical SSOT)
A lower-level document may provide additional specificity.

It may not silently override a higher-level principle.

Required exceptions must be:

- explicit
- limited in scope
- justified
- documented in the owning document

---

# 4. Source of Truth Rules

## Product meaning

Product meaning belongs to product specifications.

It must not be independently invented in:

- UI components
- prompts
- client utilities
- copy tables
- tests
- one-off scripts

## Canonical relationship interpretation

Canonical interpretation should be owned by deterministic server-side logic when possible.

The client should render approved meaning rather than reconstruct it.

## Narrative

Narrative may explain approved findings.

Narrative may not:

- invent classifications
- change direction
- create unsupported scores
- escalate severity
- suppress required uncertainty
- fabricate user history

## Visual components

Visual components communicate meaning.

They do not independently define meaning.

Shared Visual Asset IDs (**VA-01…VA-09**) live in `06_Visual_Design_System.md`.  
Cross-product visualization and evidence laws live in `05_Relationship_Product_Bible.md` §13D.  
Domain blueprints own axes, labels, thresholds, warnings, and actions.

---

# 5. AI-Assisted Development Reading Protocol

Cursor, Claude, and other coding agents should not load every document equally for every task.

Use the smallest sufficient reading scope while preserving governing context.

---

## 5.1 New feature or major redesign

Read:

1. the owning product document
2. its governing parent documents
3. the relevant technical document
4. the current implementation

Example:

```text
Task:
Redesign Romantic key relationship cards.

Read:
- 05_Relationship_Product_Bible.md
  - Information Architecture
  - Story & Module Architecture / Measurement intent
- 05A_Romantic_Product_Blueprint.md
  - Romantic card and signal sections
- 06_Romantic_Technical_Blueprint.md
  - canonical signal and projection sections
- current card-selection and rendering code
```

---

## 5.2 Small implementation change

Read:

1. the directly relevant specification sections
2. the governing parent section only when needed
3. the affected code and tests

Do not reread every document unless the task changes product meaning.

---

## 5.3 Audit task

Before modifying code:

```text
1. Read the relevant specification.
2. Trace the current production flow.
3. Identify the canonical owner of the behavior.
4. Compare current reality with target behavior.
5. List gaps and conflicts.
6. Propose the smallest coherent implementation slice.
7. Do not implement until the audit is accepted.
```

---

## 5.4 Implementation task

For approved implementation:

```text
1. Preserve valid deterministic logic.
2. Do not broaden scope without approval.
3. Implement one vertical slice end to end.
4. Update or add regression tests.
5. Validate Korean and English behavior.
6. Inspect the actual local product output.
7. Report changed files and unresolved issues.
8. Do not push unless explicitly instructed.
```

---

# 6. Vertical Slice Rule

Implementation should proceed through user-visible vertical slices.

Preferred:

```text
Canonical truth
↓
Classification
↓
Evidence and confidence
↓
Safe server projection
↓
Narrative
↓
Visual component
↓
Localization
↓
Tests
↓
Local product review
```

Avoid implementing by isolated technical layer.

Weak sequence:

```text
Build every backend field
↓
Build every prompt
↓
Build every UI component
↓
Review the product at the end
```

This delays feedback and allows product inconsistencies to spread.

---

# 7. Performance Principles

Keep implementations efficient without reducing product quality.

## Principles

- Prefer deterministic logic over LLM whenever possible.
- Reuse canonical outputs instead of recomputing them.
- Prefer one bounded narrative generation over many small LLM calls.
- Cache deterministic work whenever safe.
- Preserve graceful fallback when narrative generation fails.
- Keep deterministic logic responsible for truth and the LLM responsible for explanation.

---

# 8. Documentation Maintenance

When product meaning changes:

1. update the owning product specification
2. update the technical specification if implementation contracts change
3. update code
4. update tests
5. validate the real product

Do not allow source code to become the only record of a major product decision.

---

## Decision records

Use a separate decision record when a choice:

- changes an established boundary
- moves ownership between systems
- intentionally postpones a feature
- introduces a documented exception
- affects multiple product areas

Decision records should reference the governing Blueprint section.

---

# 9. File Naming Rules

Use stable numbered names for governing documents.

```text
01_Product_Vision.md
02_Relationship_UX_Bible.md
03_Market_Research.md
05_Relationship_Product_Bible.md
05A_Romantic_Product_Blueprint.md
05N_Ahaitsme_Narrative_Style_Bible.md
06_Visual_Design_System.md (internally titled "Experience Design System")
06_Romantic_Technical_Blueprint.md
08_Current_Product_Implementation_Design_Extraction.md
09_Product_and_Design_Intent_Package.md
10_Design_IA_Canonicalization_Refactor_Plan.md
```

Avoid:

- `final`
- `final-v2`
- `latest`
- `new`
- date-only names for governing documents

Version history belongs in Git.

---

# 10. Required Agent Instruction

The following instruction may be included at the start of Cursor or Claude tasks:

```text
Treat the documents under docs/product as governing specifications.

First read docs/product/README.md to determine document ownership.

Then read only:
1. the document that owns this task,
2. its governing parent sections,
3. the relevant technical specification,
4. the affected current code.

Do not reinterpret product meaning from existing implementation when the
implementation conflicts with the approved specification.

Do not implement before tracing the current production flow and identifying
the canonical owner of the behavior.

Prefer one user-visible vertical slice over broad layer-by-layer changes.

Preserve performance:
- avoid unnecessary LLM calls,
- avoid duplicate computation,
- use deterministic logic for canonical truth,
- use bounded narrative generation for explanation,
- preserve graceful fallback behavior.
```

---

# 11. Definition of Done

A documentation-guided implementation is complete when:

1. the owning specification is identified
2. the current production path is traced
3. canonical ownership is preserved
4. implementation matches the approved specification
5. tests are updated
6. Korean and English behavior remain aligned
7. the local product output is reviewed
8. changed files and remaining risks are reported
