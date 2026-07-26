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

### Use when

- planning implementation
- modifying code
- defining schemas
- changing server projections
- integrating narrative generation
- building tests
- migrating existing Romantic output

### Limitation

Technical architecture implements product meaning.

It must not redefine product meaning.

---

# 2. Governing Order

When multiple documents apply, use the following order:

```text
01 Product Vision
↓
02 Relationship UX Bible
↓
05 Relationship Product Bible
↓
05A Romantic Product Blueprint (Romantic domain SSOT)
↓
Relationship-Specific Technical Blueprint
↓
Implementation
```

`03_Market_Research.md` provides supporting evidence and context.

It is not above the governing product documents.

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

## Romantic implementation conflict

Use:

```text
06_Romantic_Technical_Blueprint.md
```

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
06_Romantic_Technical_Blueprint.md
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
