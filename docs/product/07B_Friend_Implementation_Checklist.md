# 07B Friend Implementation Checklist

**Document type:** Implementation Plan / Delivery Checklist  
**Product:** Ahaitsme — Friend Relationship Experience  
**Status:** Canonical Friend Implementation Checklist  
**Audience:** Engineering, Product, QA, Prompt, Design, Reviewers  
**Purpose:** Convert the Friend Product Blueprint and Technical Blueprint into an auditable, testable, commit-safe implementation sequence.  
**Product SSOT:** `05B_Friend_Product_Blueprint.md`  
**Technical SSOT:** `06B_Friend_Technical_Blueprint.md`  
**Inherits:** `05_Relationship_Product_Bible.md` · `05N_Ahaitsme_Narrative_Style_Bible.md`  
**Execution rule:** No implementation batch may silently redefine product meaning, evidence ownership, directionality, confidence, or narrative authority.

---

# 0. Delivery Constitution

Friend implementation is complete only when the system can reliably answer:

1. What Person A brings Person B.
2. What Person B brings Person A.
3. Where this friendship shines.
4. When the same strengths become difficult.
5. Who the pair becomes together.
6. What each person can do to bring out the best in the friendship.

Completion does not mean:

- adding more cards,
- generating longer prose,
- wiring raw axes directly into UI,
- creating attractive but unsupported role labels,
- or shipping prompt-generated interpretations without deterministic ownership.

The delivery order is:

```text
Audit
→ Evidence foundation
→ One deterministic vertical slice
→ Validate
→ Commit
→ Next vertical slice
→ Canonical integration
→ Narrative
→ UI
→ Full regression
→ Release readiness
```

The permanent implementation principle is:

> **Resolve first. Project second. Narrate last.**

---

# 1. Global Rules

## 1.1 Required documents

Before implementation begins, verify that the following exist and are treated as authoritative:

- [ ] `05_Relationship_Product_Bible.md`
- [ ] `05B_Friend_Product_Blueprint.md`
- [ ] `06B_Friend_Technical_Blueprint.md`
- [ ] `05N_Ahaitsme_Narrative_Style_Bible.md`
- [ ] Repository authority map or README references the Friend documents
- [ ] No older Friend document is incorrectly treated as a competing SSOT

---

## 1.2 Non-negotiable technical rules

- [ ] Server owns canonical interpretation
- [ ] Client does not infer roles, gifts, situations, costs, or confidence
- [ ] LLM does not classify relationship truth
- [ ] A→B and B→A remain distinct
- [ ] Shared judgments require genuinely shared evidence
- [ ] Null remains null
- [ ] Missing evidence does not become a negative conclusion
- [ ] Confidence and severity remain separate
- [ ] Situation does not become life-stage prediction
- [ ] Role does not become identity or obligation
- [ ] Transformation does not duplicate the directional gift
- [ ] Every action traces to an approved judgment
- [ ] Unsupported judgments are omitted
- [ ] Free and premium use the same canonical truth
- [ ] Locale is passed explicitly

---

## 1.3 Batch rules

Every implementation batch must:

1. begin with an audit,
2. declare included and excluded files,
3. state the exact product question it answers,
4. identify the deterministic owner,
5. identify all source evidence,
6. preserve directionality,
7. add or update tests,
8. run relevant regressions,
9. provide a pre-commit audit,
10. commit only the intended files,
11. not push unless explicitly requested.

---

## 1.4 Definition of a vertical slice

A vertical slice is complete only when it includes:

```text
Source evidence
→ deterministic resolver
→ canonical types
→ view-model integration
→ client-safe projection
→ tests
→ optional UI consumption
```

Prompt prose alone is not a vertical slice.

UI alone is not a vertical slice.

A resolver without projection and tests is not a complete vertical slice.

---

# 2. Phase 0 — Current-State Audit

## 2.1 Goal

Determine what Friend currently does, where truth is owned, what is missing, and which legacy behavior conflicts with `05B` and `06B`.

No production implementation should begin before this audit is complete.

---

## 2.2 File inventory

Identify all Friend-related files.

- [ ] API routes
- [ ] report builders
- [ ] analysis runners
- [ ] raw Saju inputs
- [ ] pair analysis inputs
- [ ] psych input paths
- [ ] context output builders
- [ ] prompt builders
- [ ] schemas and types
- [ ] UI components
- [ ] paywall or entitlement logic
- [ ] locale resolution
- [ ] tests
- [ ] scripts and fixtures
- [ ] legacy Friend copy tables
- [ ] deprecated files still imported
- [ ] shared Relationship utilities used by Friend

Required output:

```text
Path
Purpose
Current authority
Inputs
Outputs
Directionality
Locale behavior
Test coverage
Keep / migrate / delete
```

---

## 2.3 Current pipeline map

Document the actual current pipeline.

Example format:

```text
Pair birth data
→ chart analysis
→ current Friend resolver or report builder
→ prompt or copy table
→ API response
→ UI
```

For every transition, answer:

- [ ] Is truth being decided here?
- [ ] Is direction preserved?
- [ ] Is confidence represented?
- [ ] Is raw evidence exposed?
- [ ] Is LLM used?
- [ ] Is locale explicit?
- [ ] Is the output client-safe?

---

## 2.4 Existing output inventory

List every current Friend output field.

For each field, record:

- [ ] field name
- [ ] user-facing meaning
- [ ] source
- [ ] deterministic or generated
- [ ] directional or shared
- [ ] confidence availability
- [ ] current UI location
- [ ] future module ownership
- [ ] keep / reshape / remove

---

## 2.5 Evidence audit

Confirm current availability of:

### Saju evidence

- [ ] day-stem interaction
- [ ] pair chart interactions
- [ ] combinations
- [ ] clashes
- [ ] harms or punishments
- [ ] element production/control direction
- [ ] combined element note
- [ ] all cross-hits
- [ ] existing friend-specific Saju judgments
- [ ] confidence or source quality metadata

### Psychological evidence

- [ ] all 11 axes for Person A
- [ ] all 11 axes for Person B
- [ ] explicit missingness behavior
- [ ] current normalized scale
- [ ] axis result source
- [ ] axis confidence if available
- [ ] pair differences
- [ ] similarity
- [ ] complementarity
- [ ] directional gap behavior

### Relationship context

- [ ] Friend context is explicitly passed
- [ ] Friend does not reuse Work, Romantic, or Family meaning without translation
- [ ] current context output contract
- [ ] current relationship-kind routing

---

## 2.6 Authority audit

For each current judgment, mark its owner:

| Judgment | Current owner | Correct owner | Migration needed |
|---|---|---|---|
| Gift |  | Deterministic Gift Engine |  |
| Role |  | Deterministic Role Engine |  |
| Situation |  | Deterministic Situation Engine |  |
| Cost |  | Deterministic Cost Engine |  |
| Pair identity |  | Deterministic Pair Identity Engine |  |
| Confidence |  | Confidence Engine |  |
| Severity |  | Severity Resolver |  |
| Advice |  | Action Resolver |  |
| Copy |  | Bounded narrative layer |  |

---

## 2.7 Audit deliverable

The Phase 0 deliverable must include:

- [ ] current architecture diagram
- [ ] field inventory
- [ ] evidence inventory
- [ ] ownership conflicts
- [ ] directionality risks
- [ ] locale risks
- [ ] test gaps
- [ ] legacy deletion candidates
- [ ] migration sequence
- [ ] recommended first vertical slice
- [ ] explicit list of unresolved questions

---

## 2.8 Phase 0 exit gate

Phase 0 passes only when:

- [ ] the current pipeline is fully mapped,
- [ ] no major Friend output field remains unexplained,
- [ ] current LLM authority is known,
- [ ] psych availability is verified,
- [ ] directionality is verified,
- [ ] first slice can be implemented without guessing,
- [ ] and no code changes were mixed into the audit unless separately approved.

---

# 3. Phase 1 — Canonical Types and Evidence Foundation

## 3.1 Goal

Create the smallest stable type and evidence foundation required for all Friend vertical slices.

---

## 3.2 Canonical type files

Create or confirm canonical types for:

- [ ] evidence item
- [ ] provenance
- [ ] direction
- [ ] confidence tier
- [ ] severity
- [ ] gift key
- [ ] role key
- [ ] situation key
- [ ] cost key
- [ ] action key
- [ ] pair identity key
- [ ] Friend experience view model
- [ ] client projection
- [ ] narrative input
- [ ] narrative output

---

## 3.3 Direction type

Required canonical direction:

```ts
type FriendDirection =
  | "A_TO_B"
  | "B_TO_A"
  | "SHARED"
  | "SELF_A"
  | "SELF_B";
```

Checklist:

- [ ] no ambiguous boolean direction
- [ ] no direction inferred from array index
- [ ] no client reversal
- [ ] no anonymous direction in narrative
- [ ] shared is explicitly justified

---

## 3.4 Evidence normalization

Implement or confirm:

- [ ] source family
- [ ] source key
- [ ] direction
- [ ] domain
- [ ] polarity
- [ ] strength
- [ ] confidence
- [ ] severity
- [ ] tags
- [ ] provenance

---

## 3.5 Null and missingness

Tests must prove:

- [ ] missing psych is not treated as zero
- [ ] missing Saju evidence does not create a negative
- [ ] one missing person does not create false symmetry
- [ ] incomplete pair comparison downgrades confidence
- [ ] unsupported candidate is omitted
- [ ] absent confidence remains absent or explicitly derived

---

## 3.6 Evidence package

Build a directional evidence package.

Conceptual output:

```ts
type FriendEvidencePackage = {
  aToB: FriendEvidenceItem[];
  bToA: FriendEvidenceItem[];
  shared: FriendEvidenceItem[];
  selfA: FriendEvidenceItem[];
  selfB: FriendEvidenceItem[];
  missingSources: string[];
  contradictions: FriendEvidenceContradiction[];
};
```

Checklist:

- [ ] deterministic
- [ ] no user-facing prose
- [ ] source provenance preserved
- [ ] stable order
- [ ] versioned
- [ ] unit tested

---

## 3.7 Phase 1 tests

- [ ] direction partitioning
- [ ] shared evidence qualification
- [ ] null handling
- [ ] missing source tracking
- [ ] provenance survival
- [ ] stable serialization
- [ ] no locale-dependent logic
- [ ] no narrative logic

---

## 3.8 Phase 1 exit gate

- [ ] canonical types compile
- [ ] evidence package is deterministic
- [ ] tests pass
- [ ] no role/gift/situation inference is hidden in normalization
- [ ] no client contract exposes raw internal evidence
- [ ] pre-commit audit confirms only foundation files are included

---

# 4. Phase 2 — Gift Engine Vertical Slice

## 4.1 Product question

> What does Person A bring Person B, and what does Person B bring Person A?

---

## 4.2 Scope

Implement:

- [ ] A→B gift candidates
- [ ] B→A gift candidates
- [ ] recipient experience
- [ ] enabled change
- [ ] limitations
- [ ] confidence
- [ ] provenance
- [ ] canonical projection

Do not implement yet:

- [ ] final role ranking
- [ ] full situation ranking
- [ ] pair identity
- [ ] LLM prose
- [ ] UI redesign

---

## 4.3 Candidate gifts

Approve a limited initial enum.

Suggested starting set:

- [ ] emotional presence
- [ ] practical grounding
- [ ] courage
- [ ] stimulation
- [ ] perspective
- [ ] recognition
- [ ] continuity
- [ ] protection
- [ ] social expansion
- [ ] structure
- [ ] recovery support
- [ ] decision clarity
- [ ] play
- [ ] honesty
- [ ] adaptability

Do not implement all candidates merely because they are listed.

Start with evidence-supported candidates confirmed by audit.

---

## 4.4 Resolver requirements

A gift requires:

- [ ] source capacity
- [ ] recipient relevance
- [ ] pair relationship condition
- [ ] direction
- [ ] confidence
- [ ] contradiction handling

A high personal axis alone must not automatically create a gift.

---

## 4.5 Enabled-change rule

For each displayed gift:

```text
Gift
→ what the recipient receives
→ what may become easier in the recipient
```

Checklist:

- [ ] change is directional
- [ ] change does not claim permanent personality transformation
- [ ] change is not a duplicate standalone judgment
- [ ] tentative change uses tentative language metadata
- [ ] no unsupported psychological backstory

---

## 4.6 Gift tests

Required fixtures:

- [ ] A high empathy → B receives emotional validation
- [ ] B high practicality → A receives reality grounding
- [ ] equal gap reversed produces directionally different output
- [ ] one high axis without pair relevance does not surface
- [ ] conflicting evidence downgrades or suppresses
- [ ] missing psych suppresses unsupported gift
- [ ] shared gift is not created from one directional path
- [ ] enabled change does not duplicate gift key
- [ ] output order is stable

---

## 4.7 Gift integration

- [ ] build directional profiles
- [ ] select primary gift
- [ ] preserve secondary candidates internally
- [ ] add canonical IDs
- [ ] add client-safe projection
- [ ] no raw evidence sent to UI
- [ ] no prompt call required

---

## 4.8 Phase 2 exit gate

- [ ] both directions work
- [ ] direction reversal fixture passes
- [ ] confidence survives projection
- [ ] unsupported gifts disappear
- [ ] no role logic is hidden inside gift labels
- [ ] tests pass
- [ ] pre-commit audit complete
- [ ] slice committed alone

---

# 5. Phase 3 — Role Engine Vertical Slice

## 5.1 Product question

> What flexible role does each friend tend to play in the other person’s life?

---

## 5.2 Scope

Implement:

- [ ] role candidate derivation
- [ ] primary role
- [ ] secondary role
- [ ] optional situational role
- [ ] confidence
- [ ] overlap suppression
- [ ] projection

---

## 5.3 Initial role review

Review and approve:

- [ ] `SAFE_HARBOR`
- [ ] `REALITY_ANCHOR`
- [ ] `GROWTH_CATALYST`
- [ ] `JOY_COMPANION`
- [ ] `PERSPECTIVE_GIVER`
- [ ] `STEADY_WITNESS`
- [ ] `QUIET_PROTECTOR`
- [ ] `CONNECTOR`
- [ ] `CONFIDENCE_BUILDER`
- [ ] `CO_CREATOR`

For each role define:

- [ ] owned meaning
- [ ] required gift families
- [ ] supporting axes
- [ ] possible Saju corroboration
- [ ] contraindications
- [ ] overlapping roles
- [ ] minimum confidence
- [ ] user-facing label in KO/EN

---

## 5.4 Role resolver

Checklist:

- [ ] role derives from gifts, not raw label matching
- [ ] evidence diversity affects ranking
- [ ] situation coverage may refine ranking
- [ ] contradiction reduces rank
- [ ] duplicate roles collapse
- [ ] no forced primary role when weak
- [ ] one person may have a different role in each direction
- [ ] role does not imply obligation

---

## 5.5 Role tests

- [ ] emotional presence + resilience → Safe Harbor candidate
- [ ] practicality + decision clarity → Reality Anchor candidate
- [ ] stimulation + adaptability → Growth Catalyst candidate
- [ ] recognition + empathy → Confidence Builder candidate
- [ ] overlapping Safe Harbor / Quiet Protector resolves correctly
- [ ] insufficient evidence returns null
- [ ] reversed pair changes directional role
- [ ] role ranking is stable
- [ ] role labels are locale-independent internally

---

## 5.6 Phase 3 exit gate

- [ ] role enum approved
- [ ] role definitions documented
- [ ] primary and secondary ranking tested
- [ ] duplicate suppression tested
- [ ] weak roles omitted
- [ ] no LLM classification
- [ ] pre-commit audit complete
- [ ] slice committed alone

---

# 6. Phase 4 — Situation Engine Vertical Slice

## 6.1 Product question

> When does this friendship shine?

---

## 6.2 Scope

Implement:

- [ ] canonical situation enum
- [ ] candidate scoring or rule resolution
- [ ] directional contributions
- [ ] shared situations
- [ ] confidence
- [ ] limitations
- [ ] ranking
- [ ] projection

---

## 6.3 Initial situation review

Review and approve:

- [ ] `EMOTIONAL_STORM`
- [ ] `REALITY_CHECK`
- [ ] `NEW_BEGINNING`
- [ ] `LONG_ROAD`
- [ ] `QUIET_RECOVERY`
- [ ] `RECOGNITION_MOMENT`
- [ ] `SOCIAL_EXPANSION`
- [ ] `DEEP_CONVERSATION`
- [ ] `PLAY_AND_RELEASE`
- [ ] `SUDDEN_CHANGE`

For each situation define:

- [ ] human question
- [ ] primary axes
- [ ] pair conditions
- [ ] gift dependencies
- [ ] role dependencies
- [ ] possible Saju refinement
- [ ] contradiction rules
- [ ] cost conditions
- [ ] minimum evidence
- [ ] KO/EN labels

---

## 6.4 Situation resolver requirements

- [ ] psych behavior owns primary situation evidence
- [ ] pair evidence determines relationship relevance
- [ ] Saju corroborates or refines
- [ ] one axis does not create a complete situation
- [ ] top 2–3 are selected
- [ ] false numerical precision is avoided
- [ ] conditional situations are marked
- [ ] contribution of each person is preserved

---

## 6.5 Hard temporal prohibition

Tests and code review must prove that situation logic does not output:

- [ ] age
- [ ] decade
- [ ] life stage
- [ ] duration
- [ ] future separation
- [ ] future contact frequency
- [ ] “friendship season”

---

## 6.6 Situation tests

- [ ] empathy + resilience supports Emotional Storm
- [ ] practicality + decision style supports Reality Check
- [ ] structure + self-control supports Long Road
- [ ] low stimulation + empathy supports Quiet Recovery
- [ ] stimulation + energy supports Social Expansion
- [ ] recognition + empathy supports Recognition Moment
- [ ] top situations rank consistently
- [ ] unsupported situations are omitted
- [ ] reversed pair preserves contribution direction
- [ ] no temporal fields exist in output

---

## 6.7 Phase 4 exit gate

- [ ] situation enum approved
- [ ] top situation selection tested
- [ ] temporal prohibition tested
- [ ] client projection contains no raw weights
- [ ] role and situation meaning do not duplicate
- [ ] pre-commit audit complete
- [ ] slice committed alone

---

# 7. Phase 5 — Cost Engine Vertical Slice

## 7.1 Product question

> When does a real friendship strength become difficult?

---

## 7.2 Scope

Implement:

- [ ] strength source
- [ ] triggering condition
- [ ] felt impact
- [ ] better interpretation
- [ ] adjustment affordance
- [ ] confidence
- [ ] severity
- [ ] projection

---

## 7.3 Initial cost review

Review and approve:

- [ ] `ADVICE_BEFORE_VALIDATION`
- [ ] `CALM_READ_AS_DISTANCE`
- [ ] `STIMULATION_AS_PRESSURE`
- [ ] `STRUCTURE_AS_RIGIDITY`
- [ ] `SPACE_READ_AS_REJECTION`
- [ ] `CLOSENESS_AS_DEMAND`
- [ ] `HONESTY_AS_HARSHNESS`
- [ ] `SLOWNESS_AS_DISENGAGEMENT`
- [ ] `SPEED_AS_DISREGARD`
- [ ] `ROLE_OVERUSE`
- [ ] `INITIATION_IMBALANCE`
- [ ] `RECOGNITION_MISMATCH`

---

## 7.4 Cost resolver rules

- [ ] every cost references a real strength or role
- [ ] every cost includes a condition
- [ ] no person is condemned
- [ ] cost does not erase gift
- [ ] confidence and severity are independent
- [ ] serious harm is not normalized as compatibility
- [ ] ordinary mismatch does not become safety diagnosis
- [ ] action affordance is attached

---

## 7.5 Cost tests

- [ ] practicality + emotional need → Advice Before Validation
- [ ] calm energy + visible reassurance need → Calm Read as Distance
- [ ] stimulation + depleted recipient → Stimulation as Pressure
- [ ] structure + rapid change → Structure as Rigidity
- [ ] strong role repeatedly relied on → Role Overuse
- [ ] confidence remains high while severity remains S2
- [ ] weak evidence cannot produce S3 or S4
- [ ] no moralized copy key
- [ ] no unsupported cut-off advice

---

## 7.6 Phase 5 exit gate

- [ ] gift-to-cost link is explicit
- [ ] better interpretation exists
- [ ] action affordance exists
- [ ] severity is tested separately
- [ ] safety boundary documented
- [ ] pre-commit audit complete
- [ ] slice committed alone

---

# 8. Phase 6 — Pair Identity Vertical Slice

## 8.1 Product question

> Who do these two people become together?

---

## 8.2 Scope

Implement:

- [ ] shared-effect candidates
- [ ] contribution from Person A
- [ ] contribution from Person B
- [ ] confidence
- [ ] contradiction handling
- [ ] anti-duplication
- [ ] projection

---

## 8.3 Minimum requirement

Pair identity must require:

- [ ] supported A→B contribution
- [ ] supported B→A contribution
- [ ] shared or convergent pair evidence
- [ ] no unresolved contradiction
- [ ] new joint meaning beyond the two gifts

---

## 8.4 Pair identity candidates

Possible initial candidates:

- [ ] more adventurous together
- [ ] calmer together
- [ ] more honest together
- [ ] more disciplined together
- [ ] more playful together
- [ ] more socially expansive together
- [ ] better at turning ideas into action
- [ ] more able to recover together
- [ ] more reflective together
- [ ] more willing to try together

Final keys require approval.

---

## 8.5 Pair identity tests

- [ ] one directional gift alone does not create pair identity
- [ ] both contributions are visible
- [ ] pair identity differs from primary gift
- [ ] shared evidence is required
- [ ] contradiction downgrades or suppresses
- [ ] no soulmate or destiny language
- [ ] no implication that the quality is impossible alone
- [ ] stable canonical key output

---

## 8.6 Phase 6 exit gate

- [ ] pair identity has unique meaning
- [ ] both contributions are traceable
- [ ] duplication test passes
- [ ] weak evidence returns null
- [ ] pre-commit audit complete
- [ ] slice committed alone

---

# 9. Phase 7 — Action Resolver Vertical Slice

## 9.1 Product question

> What can each person actually do with this insight?

---

## 9.2 Scope

Implement:

- [ ] action enum
- [ ] action selection
- [ ] speaker binding
- [ ] receiver binding
- [ ] required meaning
- [ ] prohibited meaning
- [ ] evidence trace
- [ ] projection

---

## 9.3 Initial action keys

Review and approve:

- [ ] `ASK_FOR_LISTENING`
- [ ] `ASK_FOR_SOLUTIONS`
- [ ] `GIVE_ADVANCE_NOTICE`
- [ ] `INVITE_LOW_PRESSURE_CONTACT`
- [ ] `NAME_APPRECIATION`
- [ ] `ALLOW_RECOVERY_SPACE`
- [ ] `SET_EXPECTATION_BOUNDARY`
- [ ] `SHARE_DECISION_CONTEXT`
- [ ] `REPAIR_AFTER_MISREAD`
- [ ] `CREATE_SHARED_RITUAL`
- [ ] `REDUCE_ROLE_DEPENDENCE`
- [ ] `MATCH_SOCIAL_ENERGY`

---

## 9.4 Action rules

- [ ] action traces to gift, role, situation, or cost
- [ ] action is directional
- [ ] action does not force availability
- [ ] action does not prescribe permanent personality change
- [ ] action does not diagnose
- [ ] action does not demand one friend fulfill every need
- [ ] action set remains small
- [ ] script contract preserves intended meaning

---

## 9.5 Action tests

- [ ] Advice Before Validation → Ask for Listening
- [ ] practical decision situation → Ask for Solutions
- [ ] energy mismatch → Match Social Energy
- [ ] role overuse → Reduce Role Dependence
- [ ] recognition mismatch → Name Appreciation
- [ ] speaker/receiver reversal changes output
- [ ] no action without source judgment
- [ ] prohibited meaning survives narrative input

---

## 9.6 Phase 7 exit gate

- [ ] actions are deterministic
- [ ] direction binding tested
- [ ] required/prohibited meaning tested
- [ ] no generic advice without evidence
- [ ] pre-commit audit complete
- [ ] slice committed alone

---

# 10. Phase 8 — Confidence, Severity, Contradiction, and Dedupe

## 10.1 Confidence

Implement and test:

- [ ] source-count logic
- [ ] source-family diversity
- [ ] directional consistency
- [ ] contradiction penalty
- [ ] missingness penalty
- [ ] rule maturity or source quality
- [ ] tier thresholds
- [ ] no LLM ownership

---

## 10.2 Severity

Implement and test:

- [ ] S0 Strength
- [ ] S1 Difference
- [ ] S2 Friction
- [ ] S3 Strain
- [ ] S4 Boundary/Safety

Rules:

- [ ] high confidence does not imply high severity
- [ ] low confidence cannot justify high severity
- [ ] S4 is not inferred from ordinary compatibility evidence
- [ ] explicit safety context follows separate policy

---

## 10.3 Contradiction

Implement:

- [ ] contradiction detection
- [ ] refine
- [ ] split by context
- [ ] downgrade
- [ ] prefer specific over generic
- [ ] omit

Tests:

- [ ] Saju direction versus psych manifestation
- [ ] high gift capacity with recipient mismatch
- [ ] role versus situation conflict
- [ ] shared versus directional conflict
- [ ] unresolved contradiction omits output

---

## 10.4 Deduplication

Implement semantic dedupe across:

- [ ] gifts
- [ ] roles
- [ ] situations
- [ ] costs
- [ ] pair identity
- [ ] actions

Priority:

1. specificity,
2. confidence,
3. unique user value,
4. correct module ownership.

Tests:

- [ ] Safe Harbor / Quiet Protector overlap
- [ ] gift and pair identity overlap
- [ ] transformation and gift overlap
- [ ] situation and role overlap
- [ ] repeated action suppression

---

## 10.5 Phase 8 exit gate

- [ ] confidence, severity, contradiction, and dedupe are independent modules
- [ ] no prompt logic substitutes for them
- [ ] edge fixtures pass
- [ ] pre-commit audit complete
- [ ] batch committed alone

---

# 11. Phase 9 — Canonical Friend Experience View Model

## 11.1 Goal

Assemble all deterministic judgments into one versioned server-owned product contract.

---

## 11.2 Required fields

- [ ] version
- [ ] person references
- [ ] friendship signature judgment
- [ ] A→B profile
- [ ] B→A profile
- [ ] A-for-B roles
- [ ] B-for-A roles
- [ ] situations
- [ ] costs
- [ ] pair identity
- [ ] actions
- [ ] horizon
- [ ] confidence metadata
- [ ] missing sources
- [ ] contradictions
- [ ] narrative input

---

## 11.3 Assembly rules

- [ ] stable canonical IDs
- [ ] stable ordering
- [ ] no user-facing prose required
- [ ] no duplicate judgment
- [ ] unsupported output absent
- [ ] direction survives
- [ ] confidence survives
- [ ] severity remains separate
- [ ] schema version explicit

---

## 11.4 View-model tests

- [ ] complete strong-evidence fixture
- [ ] partial psych fixture
- [ ] contradictory fixture
- [ ] no-role fixture
- [ ] one-direction-only fixture
- [ ] bilingual independence
- [ ] stable snapshot
- [ ] no timestamp instability unless intentionally excluded
- [ ] no raw sensitive evidence

---

## 11.5 Phase 9 exit gate

- [ ] view model accepted as canonical server contract
- [ ] tests pass
- [ ] no UI dependency inside builder
- [ ] no prompt dependency inside builder
- [ ] pre-commit audit complete
- [ ] batch committed alone

---

# 12. Phase 10 — Client-Safe Projection and Entitlement

## 12.1 Client projection

Implement projections for:

- [ ] hero
- [ ] directional gifts
- [ ] roles
- [ ] situations
- [ ] costs
- [ ] pair identity
- [ ] actions
- [ ] deep read
- [ ] evidence labels if approved

---

## 12.2 Strip rules

Remove:

- [ ] raw birth data
- [ ] raw chart internals
- [ ] internal weights
- [ ] unselected candidates
- [ ] private provenance
- [ ] model prompt inputs
- [ ] safety metadata not intended for UI
- [ ] server-only contradiction details
- [ ] unstable debug fields

---

## 12.3 Entitlement rules

Free and premium must derive from the same canonical view model.

Free:

- [ ] signature
- [ ] one role
- [ ] one directional gift
- [ ] one top situation
- [ ] teaser

Premium:

- [ ] full directional gifts
- [ ] role sets
- [ ] multiple situations
- [ ] costs
- [ ] pair identity
- [ ] actions
- [ ] deep read
- [ ] horizon

Tests:

- [ ] no conflicting truth between tiers
- [ ] premium is additive
- [ ] hidden fields do not leak
- [ ] direct route access respects entitlement
- [ ] locale remains stable

---

## 12.4 Phase 10 exit gate

- [ ] client receives no raw resolver inputs
- [ ] client cannot infer missing outputs
- [ ] entitlement tests pass
- [ ] projection snapshots pass
- [ ] pre-commit audit complete
- [ ] batch committed alone

---

# 13. Phase 11 — Narrative Layer

## 13.1 Goal

Translate approved judgments into warm, specific, confidence-aware human language without creating new truth.

---

## 13.2 Narrative input

Pass only:

- [ ] names or safe display names
- [ ] locale
- [ ] canonical judgment IDs
- [ ] approved meanings
- [ ] direction
- [ ] confidence
- [ ] limitation
- [ ] required action meaning
- [ ] prohibited claims

Do not pass unnecessary raw evidence.

---

## 13.3 Prompt laws

The prompt must explicitly prohibit:

- [ ] new roles
- [ ] new situations
- [ ] new gifts
- [ ] new costs
- [ ] direction reversal
- [ ] confidence upgrade
- [ ] severity upgrade
- [ ] friendship lifespan prediction
- [ ] life-stage prediction
- [ ] betrayal prediction
- [ ] destiny claims
- [ ] diagnosis
- [ ] trauma inference
- [ ] generic praise symmetry
- [ ] raw Saju jargon
- [ ] unsupported advice

---

## 13.4 Output binding

Every narrative block must bind to a canonical ID.

- [ ] signature ID
- [ ] gift ID
- [ ] situation ID
- [ ] cost ID
- [ ] pair identity ID
- [ ] action ID

Unknown IDs cause rejection.

---

## 13.5 Narrative validation

Validate:

- [ ] all requested IDs returned
- [ ] no unknown IDs
- [ ] no direction reversal
- [ ] no role invention
- [ ] no situation invention
- [ ] no confidence upgrade
- [ ] no unsupported time language
- [ ] no prohibited phrases
- [ ] no raw technical leakage
- [ ] no duplicated module content
- [ ] locale is correct

---

## 13.6 Fallback

If generation or validation fails:

- [ ] deterministic fallback copy exists
- [ ] no generic filler
- [ ] no raw evidence leaks
- [ ] report remains usable
- [ ] error is observable
- [ ] retry behavior is bounded

---

## 13.7 Bilingual tests

Korean:

- [ ] natural honorific tone
- [ ] names used where possible
- [ ] “너” avoided outside approved quotes
- [ ] no English prose leakage
- [ ] no technical enum leakage

English:

- [ ] no Korean prose leakage
- [ ] no literal Korean syntax
- [ ] no therapy cliché
- [ ] no mystical language
- [ ] no deterministic verdict

---

## 13.8 Phase 11 exit gate

- [ ] prompt contract approved
- [ ] validator rejects invented truth
- [ ] fallback works
- [ ] KO/EN tests pass
- [ ] deterministic truth remains unchanged without LLM
- [ ] pre-commit audit complete
- [ ] batch committed alone

---

# 14. Phase 12 — UI Integration

## 14.1 Hero

- [ ] two names
- [ ] friendship signature
- [ ] central gift or paradox
- [ ] primary role if supported
- [ ] no score-first design
- [ ] no unsupported badge
- [ ] first mobile scroll communicates meaning

---

## 14.2 What This Friend Brings You

- [ ] directional gift
- [ ] how it feels
- [ ] when it matters
- [ ] limitation
- [ ] confidence tone
- [ ] recipient is clear

---

## 14.3 What You Bring Them

- [ ] reverse directional gift
- [ ] recipient effect
- [ ] enabled change
- [ ] no duplicate transformation module
- [ ] user receives specific meaning, not generic praise

---

## 14.4 Where This Friendship Shines

- [ ] top 2–3 situations
- [ ] contribution of both people
- [ ] recognizable scene
- [ ] limitation if conditional
- [ ] no numerical theater
- [ ] no life-stage language

---

## 14.5 When the Gift Becomes a Cost

- [ ] strength remains visible
- [ ] triggering condition
- [ ] felt impact
- [ ] reframe
- [ ] action
- [ ] severity is not dramatized

---

## 14.6 Who You Become Together

- [ ] pair-only meaning
- [ ] both contributions
- [ ] no gift restatement
- [ ] no dependency implication
- [ ] no destiny framing

---

## 14.7 How to Bring Out the Best

- [ ] small action set
- [ ] speaker and receiver clear
- [ ] request language usable
- [ ] no forced availability
- [ ] no generic relationship advice

---

## 14.8 Deep Read

- [ ] adds depth
- [ ] does not repeat cards as paragraphs
- [ ] evidence detail is readable
- [ ] raw internals remain hidden
- [ ] progressive disclosure works

---

## 14.9 Responsive and accessibility

- [ ] mobile-first layout
- [ ] keyboard access
- [ ] screen-reader labels
- [ ] contrast
- [ ] reduced-motion behavior
- [ ] no meaning communicated by color alone
- [ ] Korean text wrapping
- [ ] English long-name handling
- [ ] loading and error states
- [ ] premium lock states

---

## 14.10 Phase 12 exit gate

- [ ] UI renders projection only
- [ ] no resolver logic in components
- [ ] all modules match product questions
- [ ] mobile review passes
- [ ] accessibility review passes
- [ ] design-system compliance passes
- [ ] pre-commit audit complete
- [ ] batch committed alone

---

# 15. Phase 13 — Full Regression and Product QA

## 15.1 Deterministic regression

- [ ] all evidence tests
- [ ] all gift tests
- [ ] all role tests
- [ ] all situation tests
- [ ] all cost tests
- [ ] all pair identity tests
- [ ] all action tests
- [ ] confidence tests
- [ ] severity tests
- [ ] contradiction tests
- [ ] dedupe tests
- [ ] projection tests
- [ ] entitlement tests

---

## 15.2 Narrative regression

- [ ] Korean locale
- [ ] English locale
- [ ] omitted locale follows canonical fallback
- [ ] no cross-language leaks
- [ ] no invented roles
- [ ] no invented situations
- [ ] no time prediction
- [ ] no betrayal or destiny language
- [ ] no direction reversal
- [ ] no duplicated insight
- [ ] no raw evidence leakage

---

## 15.3 Product rubric

For each representative report, reviewers score:

### Recognition

- [ ] recognizable friendship scene
- [ ] friend-specific rather than generic

### Mutuality

- [ ] A→B meaningful
- [ ] B→A meaningful
- [ ] no forced symmetry

### Situational value

- [ ] strongest moments are clear
- [ ] strength is tied to context

### Friction clarity

- [ ] gift-to-cost mechanism is understandable
- [ ] no blame

### Actionability

- [ ] at least one useful action
- [ ] action fits the evidence

### Boundaries

- [ ] no ranking
- [ ] no lifespan prediction
- [ ] no role obligation
- [ ] no diagnosis
- [ ] no product leakage

### Narrative quality

- [ ] warm
- [ ] concise
- [ ] specific
- [ ] non-repetitive
- [ ] confidence-aware

---

## 15.4 Cross-product regression

Confirm Friend changes do not break:

- [ ] Romantic
- [ ] Cohabitation or Marriage
- [ ] Work
- [ ] Family
- [ ] shared relationship routes
- [ ] shared psych builders
- [ ] shared locale resolution
- [ ] shared schemas
- [ ] entitlement
- [ ] client stripping
- [ ] build and typecheck

---

## 15.5 Performance and observability

- [ ] deterministic build time acceptable
- [ ] model calls bounded
- [ ] caching safe
- [ ] fallback measurable
- [ ] narrative validation failures logged
- [ ] role distribution monitored
- [ ] situation distribution monitored
- [ ] unsupported omission rate monitored
- [ ] no sensitive content logged unnecessarily

---

# 16. Required Fixture Matrix

Create stable fixtures covering:

| Fixture | Required behavior |
|---|---|
| High empathy A / low empathy B | Directional emotional gift without moral ranking |
| High practicality B / indecisive A | Reality grounding B→A |
| High stimulation A / low energy B | New possibility plus pressure limitation |
| High structure A / adaptable B | Long-road strength and rigidity condition |
| Similar calm pair | Quiet recovery without forced complementarity |
| High recognition mismatch | Confidence-building or recognition mismatch |
| Strong Saju support / weak psych | Refined or tentative, not overconfident |
| Weak Saju / strong psych | Behavior-specific output with limited symbolic claim |
| Missing psych | Safe omission or Saju-limited output |
| Contradictory evidence | Split, downgrade, or omit |
| One-direction-only evidence | No false mutuality |
| Strong both directions | Valid pair identity |
| Weak both directions | No pair identity |
| Locale KO | Natural Korean |
| Locale EN | Natural English |

---

# 17. Commit Protocol

## 17.1 Before every commit

Provide:

### A. Files to include

- exact file list,
- reason each file belongs.

### B. Files to exclude

- unrelated modified files,
- reason excluded.

### C. Behavior changed

- exact product question,
- old behavior,
- new behavior.

### D. Tests run

- command,
- result,
- known baseline failures.

### E. Risks

- remaining uncertainty,
- migration concern,
- follow-up.

---

## 17.2 Commit discipline

- [ ] one vertical slice per commit where practical
- [ ] no unrelated docs
- [ ] no hidden prompt tuning
- [ ] no broad formatting churn
- [ ] no unrequested push
- [ ] no deleted legacy file without import audit
- [ ] no generated artifact committed accidentally
- [ ] commit message names canonical behavior

Example:

```text
Establish Friend directional gift vertical slice
```

---

## 17.3 Post-commit report

Provide:

- [ ] commit hash
- [ ] commit title
- [ ] committed files
- [ ] test result
- [ ] uncommitted related work
- [ ] next recommended slice
- [ ] confirmation that no push occurred unless requested

---

# 18. Release Readiness Gate

Friend is release-ready only when all are true.

## Product

- [ ] matches `05B`
- [ ] answers six core questions
- [ ] no unsupported Friendship Season
- [ ] no score-first experience
- [ ] roles remain flexible
- [ ] situations remain situational
- [ ] costs preserve strengths
- [ ] actions are usable

## Technical

- [ ] matches `06B`
- [ ] deterministic ownership complete
- [ ] directionality preserved
- [ ] confidence implemented
- [ ] severity separate
- [ ] contradiction handled
- [ ] dedupe handled
- [ ] view model versioned
- [ ] projection strips internals
- [ ] narrative bounded

## QA

- [ ] unit tests pass
- [ ] fixture tests pass
- [ ] locale tests pass
- [ ] cross-product regression passes
- [ ] mobile QA passes
- [ ] accessibility passes
- [ ] no critical narrative violation
- [ ] fallback verified

## Operations

- [ ] observability available
- [ ] distribution anomalies reviewed
- [ ] rollback path known
- [ ] feature flag or staged release available if needed
- [ ] documentation updated
- [ ] authority map updated

---

# 19. Suggested Delivery Sequence

The recommended sequence is:

```text
B0  Current-state audit
B1  Evidence foundation
B2  Directional gifts
B3  Roles
B4  Situations
B5  Gift-to-cost
B6  Pair identity
B7  Actions
B8  Confidence / severity / contradiction / dedupe
B9  Canonical view model
B10 Client projection and entitlement
B11 Narrative contract
B12 UI integration
B13 Full regression and release readiness
```

Each batch should be independently reviewable.

Do not start multiple unresolved engines simultaneously unless the shared foundation is already stable.

---

# 20. Recommended First Implementation Batch

After Phase 0 audit, the default first implementation slice should be:

> **Directional Gift Engine: one evidence-supported A→B / B→A vertical slice**

Why:

- it establishes directionality,
- it answers the Friend product’s central question,
- roles derive from it,
- situations can reference it,
- transformation can remain attached to it,
- and it exposes evidence ownership problems early.

The first slice should use the most reliable currently available evidence family confirmed by audit.

It must not invent a broad enum system before proving one real path end to end.

---

# 21. Stop Conditions

Stop and re-audit when:

- [ ] a resolver requires evidence that does not exist,
- [ ] direction cannot be determined,
- [ ] current code contradicts document assumptions,
- [ ] one field is owned by multiple layers,
- [ ] LLM is required to classify truth,
- [ ] raw psych or Saju data cannot be safely projected,
- [ ] a new enum meaning has not been approved,
- [ ] confidence cannot be justified,
- [ ] UI needs to infer missing meaning,
- [ ] cross-product shared logic may regress,
- [ ] locale behavior is ambiguous,
- [ ] or tests reveal the product question is not actually answered.

A stop condition does not mean abandon the work.

It means document the mismatch, update the plan, and continue from verified facts.

---

# 22. Deferred Work

Do not include in Friend v1 unless separately approved:

- [ ] friendship lifespan prediction
- [ ] age or decade predictions
- [ ] Friendship Seasons
- [ ] betrayal prediction
- [ ] “true friend” classification
- [ ] best-friend ranking
- [ ] popularity analysis
- [ ] financial trustworthiness
- [ ] group friendship network analysis
- [ ] contact-frequency prediction
- [ ] attachment diagnosis
- [ ] abuse detection from Saju or psych
- [ ] dynamic longitudinal relationship forecasting

---

# 23. Final Completion Definition

The Friend implementation is complete when:

- the user sees a coherent friendship story,
- both directions are accurate,
- every major claim is traceable,
- strengths are tied to situations,
- costs are tied to conditions,
- pair identity adds new meaning,
- actions are specific,
- confidence controls language,
- the LLM cannot invent product truth,
- the client cannot infer product truth,
- and tests protect every canonical boundary.

The final engineering rule remains:

> **No unowned judgment. No unsupported certainty. No lost direction.**

The final product rule remains:

> **Show what this friendship gives, when it matters, what it costs, and how both people can use it well.**
