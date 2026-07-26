# 05. Relationship Product Bible
## Relationship Experience, Insight & Story — Product SSOT

> **Status:** Canonical product SSOT for Ahaitsme relationship experience architecture  
> **Purpose:** Define how every relationship product should feel, flow, prioritize information, structure insight, and guide decisions—while elaborating Romantic and Marriage / Cohabitation as the first fully specified pair.  
> **Absorbed & archived:** Shared experience constitution formerly in `04_Relationship_Experience_Blueprint.md` (file deleted; historical content lives only in git history).  
> **Does not own:** Detailed typography, color tokens, component styling, animation implementation, or responsive layout rules → `06_Visual_Design_System.md` (and related visual docs). UX writing laws → `02_Relationship-ux-bible.md`. Company vision → `01_Product_Vision.md`. Domain module catalogs → product-specific blueprints (`05A`, etc.).  
> **Scope:** Product rules for all relationship products. Romantic + Marriage / Cohabitation are fully elaborated here. Friend, Work, and Family (Child / Parent) inherit the same constitution and Insight Bible, with domain Blueprints defining distinct questions, modules, and stakes.

---

# 0. Executive Decision

Ahaitsme should not redesign the Romantic report as a prettier compatibility dashboard.

It should become a **mobile-first, emotionally paced relationship story** that answers:

> **Why do I become this version of myself only with this particular person?**

The report must reveal the relationship as a living system:

- what each person brings,
- what only appears when they are together,
- where energy grows or drains,
- why the same conflicts recur,
- what each person is actually asking for underneath,
- how they repair,
- and what form of closeness, independence, and daily life allows the relationship to remain healthy.

Romantic and Marriage / Cohabitation share one relationship engine, but they do **not** share the same product question.

| Product | Primary Question |
|---|---|
| **Romantic** | Why are we drawn to each other, and why do I change around this person? |
| **Marriage / Cohabitation** | Can we sustainably operate a real life together? |

The frozen product rules remain authoritative:

- no letter grades,
- no fate ranking,
- no dashboard-first experience,
- no false precision,
- no winner/loser framing,
- no hard truth without a path to understanding or repair.

Understanding creates confidence. Confidence supports better decisions. Ahaitsme never replaces the user’s judgment—it strengthens it.

---

# 0A. Document Authority & Product Family

## 0A.1 What this Bible owns

This document is the SSOT for shared relationship **product experience**:

- experience constitution,
- emotional pacing and journey integrity,
- information architecture and progressive disclosure,
- insight / story architecture,
- relationship-type boundaries,
- measurement and evidence product rules,
- narrative ownership boundaries,
- visualization **intent** (what a visual must answer)—not visual implementation.

It does **not** require every product to use the same modules, emphasis, or life questions.

## 0A.2 Inheritance

```text
05 Relationship Product Bible (this document)
↓
Romantic Blueprint (05A / domain docs)
Marriage / Cohabitation Blueprint
Friend Blueprint
Work Blueprint
Family — Child Perspective Blueprint
Family — Parent Perspective Blueprint
```

Domain Blueprints define what **must** differ: life questions, modules, emphasis, stakes, and perspective.

Shared principles below remain common.

## 0A.3 One product family, distinct products

Users should immediately recognize:

> “This was made by Ahaitsme.”

Shared experience principles do **not** mean interchangeable content.

Domain differences are product differences—questions, stakes, modules, and emphasis—not only copy or terminology swaps.

Hard boundaries:

- Romantic must not absorb Marriage / Cohabitation topics (household, money, in-laws, parenting, long-term residence as primary framing).
- Marriage / Cohabitation must not be reduced to Romantic attraction / early-relationship framing.
- Family Child and Family Parent remain separate perspective products.
- Friend and Work answer different life contexts and must not reuse couple-romantic framing as the primary subject.

## 0A.4 What we are designing

This Bible designs **experiences**, not document dumps.

The complete experience includes entering with questions, discovering insights, reflecting, making decisions, sharing, and returning later. The report is one part of that experience.

Premium quality is measured by how naturally users progress through understanding—not by report length or feature count.

## 0A.5 Implementation philosophy

Every principle here should eventually map to deterministic logic, UX structure, information architecture, LLM behavior, and interaction design.

If a principle cannot realistically be implemented, it should not remain as product law.

Refinement over wholesale replacement: existing deterministic calculations, psych matching, narratives, indices, tables, and graphs are foundations to reorganize—not discard.

---

# 1. What Each Workstream Contributes

## 1.1 GPT — Product Architecture

GPT owns:

- product thesis,
- user questions,
- emotional journey,
- story order,
- insight system,
- Romantic versus Marriage boundary,
- evidence-to-story logic,
- final product decisions.

## 1.2 Claude — Visual Language and Module Evaluation

Claude contributed:

- formal retirement of the pre-freeze mockup,
- a visual-language foundation,
- a module-by-module KEEP / REFINE / REPOSITION / REBUILD / REMOVE evaluation,
- accessibility, motion, typography, color, illustration, and responsive guidance,
- identification of existing reusable platform components,
- the principle that radar and quantitative visuals may survive only as subordinate companions—not as the emotional centerpiece.

Claude’s three documents should remain supporting references:

- `08_Romantic_Visual_Language_Foundations.md`
- `09_Romantic_Module_Visual_Evaluations.md`
- `10_Ahaitsme_Visual_Language_Guide.md`

## 1.3 Antigravity — Relationship Information Design Research

Antigravity contributed the strongest cross-domain visualization research:

- relationships should be modeled as systems rather than scores,
- the space between two people is the primary visual subject,
- pacing is an emotional safety mechanism,
- organic metaphors communicate relational nuance better than rigid charts,
- every tense insight must lead toward repair,
- candidate visual languages: Celestial Mechanics, Fluid Dynamics, The Weaver, and Topography,
- reusable patterns: Orbit, Tension Line, Gradient Field, Feedback Loop, Weaver, and Constellation.

The research strongly supports an editorial, progressive, emotionally regulated experience rather than an all-at-once diagnostic display.

## 1.4 Cursor — Current Technical Reality

Cursor established that the current Romantic implementation is not yet structured for the proposed experience:

- premium Romantic content is concentrated in `RomanticSajuDeepReportView`,
- there is no dedicated section renderer,
- there is no Romantic-specific Deep Read UI,
- there is no Romantic Relationship Loop UI,
- there is no Romantic Scenario UI,
- canonical signals appear only as bold text or cell suffixes,
- no dedicated canonical-signal component exists,
- the present view is monolithic and will need decomposition.

Cursor’s verdict summary:

| Verdict | Current Assets |
|---|---|
| **KEEP** | ReportCard / Surface / Layout, Radar, StrengthWeakness, Action Guide, ScoreDefinitions, loading/tabs/basic chrome |
| **REFINE** | Hero, ScoreBoard, Chemistry, Comparison/Dialogue tables, Dynamics/Frames, Nature/Hidden Hearts, Bond, PremiumSection |
| **REPOSITION** | TriScore Snapshot, Deep Read, Relationship Loop, PairPrescription, ConflictScriptTable |
| **REBUILD** | Part headings, Timeline, Canonical signal UI, Scenario UI, monolithic Romantic view |
| **REMOVE** | Hero grade badge, unused ShareSummaryCard, ConflictTriggerBanner |

---

# 2. Product North Star

Ahaitsme Relationship is not a compatibility verdict.

It is a guided discovery experience that gives users three rewards:

## 2.1 Recognition

> “This really sounds like us.”

The report must begin with concrete scenes, not technical abstractions.

## 2.2 Explanation

> “So that is why this keeps happening.”

It must explain the mechanism linking two people—not merely repeat their individual traits.

## 2.3 Possibility

> “Now I can see how we might handle this differently.”

Every serious pattern must end in a practical path toward repair, translation, or healthier structure.

## 2.4 Experience Constitution

Every relationship product must satisfy these principles.

### Understanding before information
Every section transforms facts into meaning. Never expose data without explaining why it matters.

### Relationship before individuals
The primary subject is the relationship itself. Individual traits matter only because they influence the relationship.

### Meaning before measurement
Graphs, scores, and numbers exist only to support understanding. When showing another metric conflicts with improving understanding, understanding wins.

### Recognition before improvement
Advice has no value until recognition has occurred. Create “That’s exactly us” before telling people what to do.

### Honest confidence
Never pretend certainty where it does not exist. Unknown is better than fabricated precision. Confidence changes tone; it never changes facts.

### Human understanding
The experience should feel like reading an exceptional editor—not software, not a textbook, not fortune telling.

### One product family, distinct products
Shared feel and shared laws; different life questions and module sets per product (see §0A and §19).

---

# 3. Core Product Thesis

The central object is neither Person A nor Person B.

It is the **relationship that emerges between them**.

```text
Person A baseline
+
Person B baseline
+
Directed mutual activation
+
Couple-level patterns
=
The relationship as a third system
```

This is Ahaitsme’s deepest differentiation.

A standard compatibility product asks:

> How similar are these two people?

Ahaitsme asks:

> What becomes possible, difficult, comforting, intense, or unsustainable only when these two people meet?

---

# 4. Relationship Experience Architecture

## 4.1 Final Journey (chapter sequence)

```text
0. Threshold
1. Relationship Trailer
2. Relationship Identity
3. Composition
4. Relational Alchemy
5. Friction Loop
6. Hidden Heart
7. Repair & Resilience
8. Becoming
9. Translation into Life
10. Reflection
```

This is not a list of interchangeable report modules. It is the **locked emotional chapter sequence** for Romantic (and the shared spine Marriage extends through Translation into Life).

## 4.2 Emotional pacing stages (shared constitution)

Underneath the chapter sequence, every relationship product inherits the same **emotional pacing vocabulary**. Domain Blueprints may compress or de-emphasize a stage, but must not invent a contradictory journey that abandons recognition before advice, progressive disclosure, or honest confidence.

```text
Curiosity
→ Orientation
→ Recognition
→ Understanding
→ Discovery
→ Reflection
→ Decision Support
→ Confidence
→ Action
(+ Return when the product supports re-entry)
```

| Stage | User need | Product job |
|---|---|---|
| **Curiosity** | Uncertainty; looking for answers, not data | Reduce uncertainty; promise understanding—not conclusions. Never open with raw scores, long methodology, or technical jargon. |
| **Orientation** | “What am I looking at?” | Establish who the report is about, which questions it answers, and how to read it. |
| **Recognition** | “That’s exactly us.” | Build trust through repeated recognizable scenes before deeper interpretation. |
| **Understanding** | “Now I understand why.” | Connect facts → patterns → meaning → relationship impact into one mental model. |
| **Discovery** | “I never realized…” | Surprising but inevitable insights grounded in prior evidence—never random. |
| **Reflection** | Pause and personalize | Slow the experience so users reconnect the report to lived moments. |
| **Decision Support** | Organize implications | Support judgment without replacing it. Never “you should break up / marry.” |
| **Confidence** | Clarity, not certainty | Users feel they understand the relationship better—not that AI predicted the future. |
| **Action** | “What do we do next?” | Proportionate next steps; inspire healthier behavior, not product dependence. |
| **Return** | Re-entry later | Optional product surface; same hierarchy when users come back. |

### Mapping to the Final Journey

| Emotional stage | Primary chapter homes |
|---|---|
| Curiosity / Orientation | Threshold, Relationship Trailer |
| Recognition | Trailer, Identity, Composition openings |
| Understanding / Discovery | Relational Alchemy, Why This Person |
| Tension → Empathy | Friction Loop, Hidden Heart |
| Relief / Hope | Repair & Resilience, Becoming |
| Action | Translation into Life |
| Reflection / Confidence | Reflection (+ closing confidence tone throughout) |

Skipping a stage without a documented product reason weakens trust. The journey should feel invisible—users should feel that the report “flows naturally.”

## 4.3 Emotional Reward Curve

```text
Curiosity
→ Recognition
→ Discovery
→ Surprise
→ Tension
→ Empathy
→ Relief
→ Hope
→ Action
→ Reflection
```

This curve describes **felt reward**, not chapter titles. Antigravity’s research reinforces the same pacing: begin with curiosity, confirm the user’s own experience, reveal the partner and the relational gap gradually, then move from understanding to empathy and action.

## 4.4 Aha Loop

Every major chapter should follow:

```text
Question
→ Familiar scene
→ Visual discovery
→ Meaning reversal
→ Practical translation
→ Next question
```

The user should never receive a dense wall of interpretation without a reason to continue.

## 4.5 Shared reading hierarchy

Across products and surfaces, preserve:

```text
Result → Evidence → Meaning → Action
```

Domain Blueprints must **not** replace this hierarchy, treat domain differences as copy-only substitutions under one identical module set, merge Romantic with Marriage / Cohabitation, or collapse Family Child and Family Parent into one undifferentiated report.

---

# 5. Chapter Blueprint

## 5.1 Threshold

### User question
“Is this going to be another generic compatibility report?”

### Product job
Establish that the report will examine lived dynamics, not fate or rank.

### Visual behavior
- quiet entry,
- one strong relationship sentence,
- minimal interface chrome,
- no score panel.

---

## 5.2 Relationship Trailer

The opening is a trailer, not a summary.

### Required content

1. **Relationship Identity** — one memorable line
2. **Instant Recognition** — one concrete pattern
3. **Relational Paradox** — one strength/conflict reversal
4. **Why This Person Teaser** — one unexplained personal transformation
5. **Unresolved Promise** — one question that later chapters will answer

### Example shape

> You create both comfort and momentum for each other. A usually moves the relationship forward, but when conflict deepens, B quietly determines whether closeness returns. The same difference that creates attraction can also produce your most repetitive misunderstanding. Later, we will show why A becomes more direct with B than with almost anyone else.

### UI implication
The current Hero may be retained only after removing the grade badge and rebuilding it as an editorial opening.

---

## 5.3 Relationship Identity

### Core question
“What kind of relationship are we?”

### Output
- a memorable identity phrase,
- a brief explanation,
- two or more supporting relational signals.

### Visual pattern
A restrained relationship emblem or dynamic pair mark—not a gauge.

---

## 5.4 Composition

### Core question
“What is similar, what is different, and why does the difference matter?”

### Required content
- strongest common ground,
- most meaningful difference,
- complementarity,
- overlap or competition,
- condition under which difference becomes friction.

### Visual pattern
Interlocking geometry or a controlled gradient field.

Antigravity’s research recommends avoiding opposing arrows for difference because they imply conflict. Interlocking form or complementary space better communicates fit without winner/loser framing.

---

# 6. Relational Alchemy
## The relationship’s signature chapter

This chapter answers:

> What appears only when these two people are together?

It contains six insight systems.

---

## 6.1 Emotional Climate

### User question
“What does it feel like to be together?”

### Possible outputs
- calm and safe,
- exciting but tense,
- peaceful but under-stimulating,
- magnetic but draining,
- playful,
- emotionally activating,
- initially anxious but increasingly stable,
- enjoyable but tiring afterward.

### Visual pattern
**Gradient Field / Ambient Emotional Field**

### Design rule
This should show blended states rather than one categorical label.

### Example
> This relationship does not feel simply safe or simply intense. B’s steadiness helps A relax, but that same steadiness can make A seek clearer emotional proof, producing both comfort and sensitivity.

---

## 6.2 Mutual Activation

### User question
“What do we awaken in each other?”

### Structure

| Direction | Output |
|---|---|
| A → B | What A activates, amplifies, or softens in B |
| B → A | What B activates, amplifies, or softens in A |

### Possible activation themes
- courage,
- expression,
- responsibility,
- ambition,
- protectiveness,
- competitiveness,
- vulnerability,
- stability,
- freedom,
- anxiety,
- independence,
- dependence.

### Visual pattern
**Dual Flow / Directed Influence**

### Design rule
The relationship does not need to be symmetrical. Directional differences are often the insight.

---

## 6.3 Social Energy Ecology

### User question
“Where do we recharge, and what happens to our energy when we are together?”

### Do not reduce this to extrovert versus introvert.

Analyze separately:

1. source of stimulation,
2. method of recovery,
3. preferred form of closeness,
4. couple-level energy effect.

### Individual patterns
- gains energy from groups and activity,
- gains energy from a small number of deep relationships,
- enjoys stimulation but recovers in solitude,
- feels trapped by too much quiet,
- becomes depleted by too many plans,
- experiences shared rest as intimacy,
- experiences shared activity as intimacy.

### Couple outcomes
- more active together,
- more inward and restful together,
- more verbally generative,
- enjoyable but draining,
- tense at first and calmer with time,
- comfortable together but less externally expansive.

### Visual pattern
**Three-Zone Energy Ecology**

```text
Outside world
↔
Shared space
↔
Individual space
```

Each person’s recharge and depletion path should be shown separately, then combined.

### Romantic translation
How the pair keeps attraction and emotional liveliness alive.

### Marriage translation
How the pair structures evenings, weekends, guests, social plans, and alone time.

---

## 6.4 Synergy & Drain

### User question
“What grows when we are together, and what weakens?”

### Synergy candidates
- execution,
- creativity,
- confidence,
- emotional stability,
- financial cooperation,
- resilience,
- problem-solving,
- ambition,
- social expansion.

### Drain candidates
- rest,
- objectivity,
- independence,
- emotional regulation,
- personal rhythm,
- external relationships,
- caution,
- self-confidence.

### Visual pattern
**Flow Merge + Resource Trade-off**

### Design rule
Show that strength and cost often arise from the same mechanism.

> Together, they make decisions faster and act with greater confidence. The same momentum can cause fatigue, dissent, or emotional nuance to be missed.

---

## 6.5 Why This Person

### User question
“Why do I become this way only with this person?”

### Required logic

```text
My baseline tendency
+
What this partner activates or absorbs
+
Directed relational evidence
=
The version of me that appears in this relationship
```

### Required narrative order

1. lived scene,
2. relational mechanism,
3. saju / psych support,
4. strength,
5. blind spot.

### Example

```text
A has a naturally sharp expressive tendency
+
B responds slowly and appears emotionally tolerant
↓
A unconsciously experiences B as someone who can absorb directness
↓
A becomes more blunt than in other relationships
↓
Strength: unusual honesty and intimacy
Risk: A may mistake delayed reaction for lack of hurt
```

### Visual pattern
**Constellation Reveal** or **Layered Cause Chain**

This section should function as a Deep Read, not a short card.

---

## 6.6 Optimal Distance

### User question
“At what distance does this relationship thrive?”

### Candidate patterns

- **Shared Everyday** — closeness and daily sharing create stability
- **Balanced Independence** — closeness needs protected individual time
- **Rhythmic Distance** — separation and reunion restore affection
- **High Intensity / Recovery Needed** — strong closeness is rewarding but requires recovery

### Visual pattern
**Binary Orbit / Optimal Band**

### Important safeguard
Do not state that people “should stay apart.”

Say:

> The relationship remains closer for longer when each person’s rhythm is protected.

### Marriage applications
- separate routines,
- personal workspace,
- nights out separately,
- long-distance or travel periods,
- weekend rhythm,
- conflict cooling-off time.

---

# 7. Friction Loop

### Core question
“Why do we keep having the same fight?”

### Required structure

```text
Trigger
→ A’s automatic response
→ B’s interpretation
→ B’s defensive response
→ A’s fear is confirmed
→ loop intensifies
```

### Visual pattern
**Feedback Loop / Tension Line**

### Interaction rule
The user must be shown where the loop can be interrupted.

Antigravity warns that feedback-loop visuals may feel fatalistic unless the interaction explicitly demonstrates how the loop can be broken.

### UI implication
Build a dedicated Relationship Loop component rather than embedding the pattern in prose or tables.

---

# 8. Hidden Heart

### Core question
“What is each behavior actually asking for?”

### Possible hidden needs
- safety,
- recognition,
- certainty,
- respect,
- connection,
- space,
- control,
- autonomy,
- protection,
- time to recover.

### Visual pattern
**Surface / Inner Layer** or **Constellation**

### Example
> B’s silence may not mean lack of care. It may be an attempt to prevent greater damage while emotions are still unprocessed. That intention can still leave A feeling abandoned, so the report must explain both the motive and the impact.

### Guardrail
Never romanticize harmful behavior merely because its underlying need is understandable.

---

# 9. Repair & Resilience

### Core question
“How do we return to closeness?”

### Analyze
- recovery speed,
- first repair move,
- reassurance signal,
- words versus action,
- need for space,
- residual emotion,
- expression timing,
- failed repair attempts,
- repeated repair strengths.

### Visual pattern
**Recovery Curves + Visible Mending**

### Kintsugi usage
Kintsugi may be used as a secondary metaphor for repair, but not as decorative emotional manipulation. The research recommends showing break, pause, and slow repair rather than an instant transformation.

### Existing reusable components
- `PairPrescriptionSection`
- `ConflictScriptTable`
- Deep Read patterns from other relationship products

These should be repositioned and adapted rather than reinvented inside one monolithic Romantic view.

---

# 10. Becoming

### Core question
“What can this relationship help us become?”

### Content
- strengths reinforced over time,
- roles that may become rigid,
- growth made possible by the relationship,
- patterns that could harden if ignored,
- healthier next form of the same dynamic.

### Visual pattern
**Topographic Path / Two Future Routes**

### Guardrail
This is not prediction. It is a conditional developmental direction based on current relational patterns.

---

# 11. Translation into Life

Analysis becomes valuable only when it reaches real situations.

## 11.1 Romantic Lens

- attraction and chemistry,
- date rhythm,
- emotional expression,
- affection and reassurance,
- jealousy and uncertainty,
- closeness and independence,
- recurring conflict,
- reconnection,
- how to keep the relationship alive rather than merely stable.

## 11.2 Marriage / Cohabitation Lens

Marriage / Cohabitation should not be a more serious Romantic report. It is a **shared-life operating system**.

### A. Home Energy
- home as recovery versus activity space,
- after-work rhythm,
- talking immediately versus decompressing,
- hosting and social plans,
- noise, stimulation, and quiet.

### B. Money
- earning,
- spending,
- saving,
- risk,
- financial visibility,
- shared versus individual accounts,
- who plans and who executes,
- how money becomes emotional security or control.

### C. Household
- cleanliness standards,
- invisible labor,
- responsibility ownership,
- prompting and resentment,
- autonomy versus instruction.

### D. Decision and Power
- who initiates,
- who has final influence,
- how disagreement is handled,
- whether responsibility and control are balanced,
- whether one person carries the entire relationship operation.

### E. Family Boundary
- parents and relatives,
- holidays,
- sharing private information,
- loyalty and mediation,
- couple boundary versus family duty.

### F. Parenting Potential
- protection versus autonomy,
- structure versus flexibility,
- emotional response,
- discipline,
- education,
- labor division,
- conflict in front of children.

### G. Sustainable Distance
- separate routines,
- individual rooms or workspaces,
- social circles,
- travel and long-distance rhythm,
- togetherness versus recovery.

### H. Daily Recovery
- cooling-off period,
- coexistence after conflict,
- return to routine,
- unresolved emotional residue,
- practical repair.

---

# 12. Relationship Insight Bible
## The core intellectual property

The report should be powered by a reusable library of relational insights.

Each insight must contain:

1. insight key,
2. user question,
3. emotional value,
4. qualifying evidence,
5. directional logic,
6. real-life manifestation,
7. visual pattern,
8. UI module,
9. narrative rules,
10. guardrails,
11. Romantic translation,
12. Marriage translation.

## 12.1 Canonical Insight Set — Phase 1

| Insight Key | User Question | Primary Visual |
|---|---|---|
| relationship_identity | What kind of relationship are we? | Emblem / paired form |
| emotional_climate | What does it feel like to be together? | Gradient field |
| mutual_activation | What do we awaken in each other? | Directed dual flow |
| why_this_person | Why am I different with this person? | Constellation / cause chain |
| social_energy | Where do we recharge and drain? | Three-zone ecology |
| synergy | What grows when we are together? | Flow merge |
| drain | What weakens when we are together? | Resource leak / trade-off |
| optimal_distance | How close should we be? | Binary orbit / optimal band |
| role_formation | What roles do we naturally assume? | Dynamic role field |
| balance_of_power | Who moves the relationship, and when? | Situational influence map |
| friction_loop | Why does the same fight repeat? | Feedback loop |
| hidden_need | What is the behavior really asking for? | Outer/inner layer |
| reassurance_signal | What makes each person feel safe and loved? | Signal pair |
| recovery_speed | How quickly does each person recover? | Dual recovery curve |
| residual_emotion | What remains after the issue is “over”? | Emotional tail |
| expression_speed | When and how is emotion expressed? | Timing sequence |
| repair_path | How do we return to closeness? | Mending sequence |
| becoming | What can the relationship grow into? | Future path |
| real_life_translation | What changes in actual life? | Scenario modules |

## 12.2 New Insight Additions Recommended

The following should be added because the combined work exposed important gaps:

### A. Relational Permission
“What does this person make me feel allowed to do or be?”

Examples:
- be more direct,
- be dependent,
- be playful,
- be ambitious,
- rest,
- show vulnerability.

### B. Emotional Carrying Load
“Who absorbs, regulates, or carries the relationship’s emotional weight?”

This improves balance-of-power analysis by distinguishing visible leadership from invisible emotional labor.

### C. Public Couple / Private Couple
“How does this relationship change between social settings and private space?”

This is critical for social energy, image, recognition, and marriage life.

### D. Misread Signal
“What does one person offer as love that the other does not naturally recognize?”

This directly links reassurance, expression, hidden need, and repair.

### E. Stress Transformation
“How does the relationship change under pressure?”

A relationship may be playful in ordinary life but rigid under money, family, work, or health stress.

### F. Shared Reality Style
“How do they decide what is true, important, or urgent?”

This supports thinking style, decision style, conflict, and cohabitation decisions.

### G. Closeness Cost
“What does each person fear losing when intimacy increases?”

Examples:
- autonomy,
- control,
- emotional safety,
- identity,
- predictability.

### H. Relationship Recovery Capacity
“Can the relationship adapt, or does it merely return to the same baseline?”

This distinguishes true repair from temporary calm.

---

# 13. Evidence-to-Story Framework

## 13.1 Evidence Layers

### Layer 1 — Individual Baseline
- elements and balance,
- day-stem structure,
- ten-god distribution,
- combinations and clashes,
- supportive and challenging elements,
- shinsal as supporting evidence only,
- primary and secondary psych axes,
- energy and social orientation.

### Layer 2 — Directed Interaction
- how B functions within A’s structure,
- how A functions within B’s structure,
- directed generation and control,
- activation, amplification, suppression, and buffering,
- asymmetrical role formation,
- directional canonical signals.

### Layer 3 — Couple-Level Emergence
- shared emotional climate,
- synergy and drain,
- recurring roles,
- conflict loop,
- repair rhythm,
- optimal distance,
- real-life operation.

## 13.2 Narrative Order

Always translate in this order:

```text
Recognizable experience
→ Relational mechanism
→ Evidence
→ Strength or gift
→ Risk or blind spot
→ Practical translation
```

Never begin with technical saju terminology and expect the user to infer relevance.

## 13.3 Confidence Rules

- one weak signal → tentative language,
- two independent supporting signals → clear pattern language,
- contradictory signals → contextual or dual expression,
- unknown direction → do not assign A/B ownership,
- shinsal alone → never sufficient for a major conclusion,
- canonical signal with null direction → omit directional UI,
- LLM may narrate but must not invent classifications.

## 13.4 Confidence and severity are separate

**Confidence** answers: How strongly can we support this interpretation?

**Severity** answers: How consequential may this pattern be?

A high-confidence minor difference is not a major risk. A potentially serious issue with weak evidence must not be overstated. Preserve both dimensions independently.

### Severity ladder (deterministic)

| Level | Name | Meaning |
|---|---|---|
| **S0** | Strength | A resource the relationship can rely on |
| **S1** | Difference | Meaningful variation; not inherently harmful |
| **S2** | Friction | Recurring mismatch that requires coordination |
| **S3** | Strain | Likely ongoing emotional or practical cost |
| **S4** | Structural Risk | May meaningfully threaten stability or safety when strongly evidenced |

Severity is assigned deterministically. Narrative may adjust tone but must not escalate or reduce severity.

**S4 restrictions:** rare; requires a defined risk construct, strong/convergent evidence, contextual safeguards, carefully limited language. Do not imply abuse, danger, diagnosis, or inevitable failure from personality or Saju alone. Safety concerns from direct user disclosure require a separate safety-aware experience outside ordinary relationship scoring.

## 13.5 Evidence tiers

Every promoted insight should carry an internal evidence tier:

- **Corroborated** — multiple meaningful sources support the same direction
- **Refined** — a primary signal is strengthened or clarified by another source
- **Tentative** — useful but incomplete or weakly supported

Tier affects prominence, wording, certainty, card eligibility, and recommendation strength—not whether an insight is “positive” or “negative.”

Evidence levels in the reading experience:

1. **Plain-language support** — visible in the main narrative
2. **Signal summary** — expandable evidence list
3. **Technical reference** — calculations/thresholds for audit; not part of the standard flow

Evidence exists for trust, not curiosity. It must never dominate the experience.

## 13.6 Narrative ownership & contracts

### Deterministic ownership
Facts, values, direction, classification, thresholds, eligibility, evidence source, evidence tier, confidence, severity, suppression rules.

### Narrative ownership
Phrasing, synthesis, transitions, examples grounded in approved findings, emotional accessibility, concise explanation, relationship-centered framing, locale adaptation.

### Input contract (where applicable)
relationship type, participant labels, eligible findings, source evidence, direction, confidence, severity, allowed interpretation range, prohibited claims, adjacent findings, required length, locale, address/pronoun rules.

The LLM should not reconstruct analysis from raw data when a deterministic interpretation already exists.

### Output contract
Limited to defined fields (headline, concise body, recognition example, transition, reflection prompt, practical implication). Must not return new scores/categories, unsupported advice, clinical claims, predictions, hidden classifications, contradictory direction, or fabricated user history.

### Synthesis requirement
Premium narrative synthesizes—usually connecting at least two findings into relationship meaning—rather than rewriting evidence lines.

### Repetition control
Before render, compare Trailer/Hero, key cards, graph captions, module openings, and closing summary. Repeated conclusions must be merged, shortened, reassigned function, or removed. The report should feel cumulative, not circular.

---

# 13A. Information Architecture

## 13A.1 Why order is product law

A relationship report is a structured conversation. Order matters as much as content. Every section should answer the next natural question in the reader’s mind. Ahaitsme organizes the report so users never have to.

## 13A.2 Information hierarchy

```text
Big Picture
→ Key Relationship Signals
→ Core Dynamics
→ Evidence
→ Detailed Exploration
→ Reflection
→ Decision Support
```

Information volume may increase while cognitive effort decreases.

## 13A.3 Layered curiosity model

```text
Layer 1 — Can I understand this relationship quickly?
Layer 2 — Why is it like this?
Layer 3 — What evidence supports that?
Layer 4 — What does this mean over time / in depth?
Layer 5 — How should I think / act on this?
```

| Layer | Job | Must not |
|---|---|---|
| Instant understanding | Orientation: overall feeling, strengths, challenges, where to look next | Methodology-first |
| Core dynamics | Interaction model (rhythm, conflict, communication, influence, energy) | Isolated personality lectures |
| Supporting evidence | Credibility without interrupting flow | Dominating the page |
| Deep exploration | Reward curiosity for those who continue | Punish or overwhelm the default path |
| Reflection / decision | Slow interpretation and organize implications | Binary verdicts |

## 13A.4 Priority tiers

| Priority | Placement | Examples |
|---|---|---|
| **Critical** | Immediate | Defining characteristic, strongest strength, greatest recurring challenge |
| **Important** | Deepens the story | Emotional tendencies, communication rhythm, conflict style |
| **Supporting** | Never interrupts main narrative | Secondary dynamics, nuance |
| **Reference** | Available on demand | Methodology, terminology, detailed calculations |

## 13A.5 Progressive disclosure

```text
Question → Answer → Evidence → Meaning → Reflection
```

Never reveal everything at once. Each answer creates the next question.

## 13A.6 Component purpose hierarchy (product intent)

| Component type | Answers | Product rule |
|---|---|---|
| Numbers | “How much?” | Measurement only—never the story |
| Graphs | “What shape / pattern?” | Pattern recognition; remove if they do not improve comprehension |
| Cards | “What matters most right now?” | One idea; relationship-centered |
| Narrative | “What does this mean between us?” | Synthesis of eligible truths |
| Tables | “How do we compare side by side?” | Scan-friendly; not paragraph dumps |

Detailed typography, color, motion, and layout → Visual Design System.

## 13A.7 Digest / summary vs deep report

**Summary / digest** should include only: identity/context, Trailer/Hero interpretation, 2–3 key signals, limited measurement, one high-value visual, clear path into deeper modules. Target: “I understand the basic shape of this relationship.”

**Deep report** adds: complete core dynamic modules, meaningful comparisons, supporting graphs, layered evidence, reflection, decision support, tailored actions, methodology access. Target: “I understand why this works this way and what deserves attention.”

Deep means causal, contextual, and useful—not repetitive.

## 13A.8 Information density & suppression

Absence is preferable to filler. Suppress a component when evidence is insufficient, the finding duplicates a higher-priority insight, the difference is too small to matter, the user question is unrelated, the interpretation is unstable, the visual cannot be explained, the content would create false precision, or the component exists only to fill layout.

A shorter accurate report is more premium than a longer generic one.

---

# 13B. Story & Module Architecture

## 13B.1 Module anatomy

Core Dynamic Modules are organized around life experience, not engine structure. Shared content logic:

```text
1. Question
2. Relationship finding
3. Recognizable pattern
4. Why it happens
5. Supporting evidence
6. Situational variation
7. Reflection
8. Practical implication
```

Not every module expands all eight visibly. Modules begin with the conclusion—users must not read several paragraphs before learning the point.

Module length follows insight complexity. Do not force equal word counts or pad for visual symmetry.

## 13B.2 Illustrative module families (not mandatory per product)

Emotional Connection · Communication Rhythm · Conflict and Recovery · Decision-Making · Social Energy · Practical Coordination · Recognition and Reassurance · Autonomy and Closeness · Adaptation Under Stress

Domain Blueprints choose which families apply. Romantic centers attraction, affection, misunderstanding, conflict/repair, development—not household operation. Marriage / Cohabitation may center money, labor, responsibility, boundaries, space, intimacy, parenting, values, long-term household life.

## 13B.3 Key signal cards (summary surfaces)

On digest / opening signal surfaces, prefer a **three-card default** portfolio when evidence supports it:

```text
Card 1 — Defining relationship dynamic
Card 2 — Strongest stabilizing resource
Card 3 — Most meaningful tension or growth edge
```

This is balance, not forced optimism. Never display empty, generic, or redundant cards to preserve layout symmetry. If a third card is not earned, omit it.

**Selection filters:** relationship relevance · user value · evidence strength · distinctiveness.

**Card anatomy:** short label, insight headline, concise explanation, confidence-aware tone, optional directional cue, optional deep-link. Roughly one idea (≈40–90 words). Longer content belongs in a module.

Cards must describe the relationship (not one person alone), include meaning, use plain language, avoid repeating the Trailer, and must not use a score as headline or expose internal enums.

Candidate signal families (domain Blueprints select availability): connection/accessibility, communication rhythm, expression speed, reassurance, conflict activation, recovery speed, residual tension, balance of influence, decision alignment, practical coordination, social energy, autonomy/closeness, recognition, unconscious roles, adaptability, stability/maintenance.

## 13B.4 Comparison product rules

Every comparison communicates: what each person tends to do · meaningful difference · relationship effect · when it helps · when it creates friction.

Describe directional differences symmetrically. Do not implicitly assign rational/emotional, strong/weak, mature/immature, active/passive, correct/incorrect unless an independent behavioral standard supports it.

Use tables for repeated side-by-side scanning (e.g. Situation | A | B | Relationship effect). When cells become narrative-heavy, use paired cards or modules instead.

Prefer names when available. Role language may describe the current pattern (“the person still processing”), not permanent identity.

## 13B.5 Reflection product rules

Reflection formats may include one-question pauses, private notes, shared conversation prompts, example recall, agree/partly/not-really, save for later, compare perspectives.

Prompts must be specific, emotionally safe, connected to the preceding insight, answerable from experience, and non-accusatory.

If reflection responses are saved, treat them as a new evidence source. Do not silently alter deterministic results. Distinguish calculated interpretation, user-confirmed experience, user-disagreed experience, and future personalization.

## 13B.6 Decision support & action

Decision support organizes implications without replacing judgment. Useful structure:

```text
What is working
What requires coordination
What may worsen under stress
What can be tested in real life
What remains uncertain
```

Actions must be grounded, small enough to try, behaviorally clear, non-prescriptive, proportionate to severity and confidence, and context-sensitive.

Prefer: one primary action · one optional experiment · one conversation prompt. Do not end with generic encouragement or a long improvement checklist.

Action types may include conversation prompts, expectation-setting, role clarification, schedule coordination, reassurance preferences, conflict pause agreements, recovery rituals, social-boundary planning, decision protocols, appreciation practices, observation experiments.

## 13B.7 Progressive component depth

Example chain (functions must not duplicate):

```text
Trailer/Hero → Key Card → Graph → Module → Evidence → Reflection → Action
```

Each surface adds a distinct function for the same insight when reused.

---

# 13C. Measurement, Axes & Visualization Intent

## 13C.1 Measurement categories

Visible measurements belong to one of:

- **Directly calculated** — explicit deterministic inputs/rules
- **Composite index** — documented formula combining defined inputs
- **Categorical classification** — type/range/state (aligned, complementary, mixed, strained, insufficient evidence)
- **Confidence indicator** — strength of support; never confused with relationship quality

## 13C.2 Relationship Index policy

An index may appear only when the construct is defined, inputs documented, weighting stable, output explainable, the number adds value beyond a category, and the UI avoids destiny framing.

A single total compatibility percentage is **not** the product center. Multidimensional relationships hide important distinctions behind one number. If a total index is retained, present it as orientation with meaningful subdimensions.

Preferred overview shape (domains may rename):

```text
Relationship Overview
├── Connection
├── Coordination
├── Tension Management
└── Sustainability
```

Five to seven top-level indices is an upper bound for a summary view.

## 13C.3 Score display & false precision

Every displayed score needs: clear label, understandable construct, visible range/reference, short interpretation, access to methodology/evidence, consistent directionality (higher = strength vs similarity vs intensity vs risk vs confidence—never mixed).

Avoid undefensible precision (arbitrary decimals, rankings without a valid population, exact predictions, high-resolution gauges on sparse inputs). Prefer rounded values, ranges, categorical bands, directional indicators, uncertainty states.

**Low-confidence:** show insufficient evidence / tentative / mixed indicators. Do not silently convert missing evidence into an average-looking score.

## 13C.4 Eleven psychological axes

The 11-axis system is an **analysis foundation**, not automatic user navigation.

Axes: stimulation, self_control, practicality, structure, empathy, conflict_style, resilience, recognition, energy_style, thinking_style, decision_style.

Users arrive with relationship questions, not “What is our self_control score?” Translate axes into relationship questions.

**Usage roles:** evidence · comparison · explanation · deep reference. Do not create 11 equal report sections.

**Promotion rules:** promote an axis only when materially different, unusually strong/weak for both, directly relevant to a major pattern, supported by context, and useful to a current user question.

**Cross-axis synthesis preferred** (e.g. energy_style + stimulation → social rhythm; empathy + conflict_style + resilience → repair pattern).

Deterministic systems own axis values, differences, thresholds, classifications, confidence, eligible interpretations. Narrative may explain meaning but must not invent values, reverse direction, create unsupported classifications, promote ineligible axes, or imply clinical diagnosis.

Whether the 11-axis **radar chart** remains as an optional evidence companion is still a UI validation item (§25); the product rule that axes are subordinate evidence is locked.

## 13C.5 Chart selection by question (intent)

| User question | Preferred visual intent |
|---|---|
| Where are the two people different? | Paired comparison |
| Overall relationship profile? | Limited-dimension profile |
| Strongest / weakest areas? | Ranked bars |
| How balanced is an interaction? | Diverging / balance scale |
| How does a pattern unfold? | Sequence or cycle |
| What contributes to one outcome? | Contribution view |
| What evidence supports a conclusion? | Signal stack / source map |
| How confident is the interpretation? | Confidence band / label |

**Radar policy:** use only when dimensions are limited, scales match, the set forms a meaningful profile, and holistic shape—not precise pairwise comparison—is the goal. Do not default to comparing two people across all 11 axes on radar; prefer paired bars/dot plots when precise gaps matter.

**Comparison graphs** show both values, gap size/direction, and relationship meaning of the gap—without labeling the gap good/bad by itself.

**Graph annotation (product):** plain-language title, one sentence on what to notice, clear labels, accessible scale direction, optional expandable interpretation.

**Density:** 3–7 dimensions for immediate comprehension; up to 11 only in a dedicated detailed view. Summary must not expose all axes merely because they exist.

## 13C.6 Social energy as relationship dynamic

Social behavior is not a minor personality footnote. Distinguish social energy, sociability, stimulation tolerance, recovery need, group vs one-to-one preference, openness to outside people, participation pressure, and cultural expectations.

Do not reduce to extrovert/introvert, active/passive, or social/antisocial. When evidence is strong, social rhythm may become a key card, graph dimension, dedicated module, or coordination insight. Describe practical relationship impact; do not impose one culturally preferred lifestyle.

---

# 14. Visual Language Decision

The product should not choose one metaphor for every chapter.

A single global metaphor would either become repetitive or distort certain insights.

**Implementation detail** (type, color tokens, animation curves, breakpoints) belongs in `06_Visual_Design_System.md`. This section locks **product metaphor intent** only.

## 14.1 Recommended System: Organic Editorial Hybrid

### Primary atmosphere
**Fluid Dynamics**

Use for:
- emotional climate,
- mutual influence,
- blended states,
- chemistry,
- subtle overlap.

### Structural relationship metaphor
**Celestial / Binary Orbit**

Use for:
- autonomy and connection,
- optimal distance,
- mutual gravity,
- closeness rhythms.

### Conflict and repair metaphor
**Threads / Tension / Mending**

Use for:
- friction loop,
- emotional carrying load,
- repair,
- shared history.

### Journey metaphor
**Topography**

Use sparingly for:
- becoming,
- long-term development,
- transition from current pattern to healthier pattern.

## 14.2 Why Not One Direction

- Fluid systems communicate feeling but not chronology or structure well.
- Orbits communicate distance but can feel cold and imply a center.
- Threads communicate history and repair but can clutter mobile layouts.
- Topography communicates journey but risks gamification.

Therefore, these should function as a **coherent visual vocabulary**, not competing themes.

## 14.3 Shared style intent (product rules)

- soft but not vague,
- premium but not mystical kitsch,
- emotionally warm but not childish,
- organic motion with reduced-motion alternatives,
- no red/green judgment coding,
- no one person visually dominating as the “main” person,
- no ornamental animation that does not clarify meaning,
- every visual answers one explicit question.

Visual hierarchy of emphasis (product):

```text
Interpretation → Key pattern → Meaningful measurement → Supporting evidence → Methodology
```

Visual intensity should decrease as technical detail increases.

The experience should communicate calm authority, warmth, clarity, editorial quality, and emotional intelligence—not a medical dashboard, astrology generator, enterprise analytics tool, game result screen, compatibility quiz, or social-media personality test.

Token-level color, type, spacing, motion curves, and responsive layout → `06_Visual_Design_System.md`.

---

# 15. Insight-to-Visual Pattern Map

| Insight | Recommended Pattern | Interaction |
|---|---|---|
| Relationship Identity | Paired emblem / dynamic mark | subtle reveal |
| Emotional Climate | Gradient field | scroll blend / focus labels |
| Mutual Activation | Dual flow | directional tap |
| Social Energy | Three-zone ecology | toggle A / B / Together |
| Synergy & Drain | Resource trade-off | reveal same-root mechanism |
| Why This Person | Constellation cause chain | progressive disclosure |
| Optimal Distance | Binary orbit / optimal band | adjust closeness carefully |
| Role Formation | Dynamic role field | scenario toggle |
| Balance of Power | Situational influence map | context tabs |
| Friction Loop | Feedback loop | pause / interrupt point |
| Hidden Need | Outer/inner layer | tap to reveal meaning |
| Reassurance Signal | Signal pair | compare offered vs received |
| Recovery Speed | Dual curves | time progression |
| Residual Emotion | Emotional tail | fade duration |
| Repair Path | Mending sequence | slow guided reveal |
| Becoming | Topographic routes | current / possible toggle |
| Daily Life | Scenario system | situation cards |

---

# 16. Module and Component Blueprint

## 16.1 New Romantic Page Architecture

The current monolithic `RomanticSajuDeepReportView` should be decomposed.

Recommended structure:

```text
RomanticReportShell
├─ RelationshipTrailerSection
├─ RelationshipIdentitySection
├─ CompositionSection
├─ RelationalAlchemySection
│  ├─ EmotionalClimateModule
│  ├─ MutualActivationModule
│  ├─ SocialEnergyModule
│  ├─ SynergyDrainModule
│  ├─ WhyThisPersonDeepRead
│  └─ OptimalDistanceModule
├─ FrictionLoopSection
├─ HiddenHeartSection
├─ RepairResilienceSection
├─ BecomingSection
├─ RealLifeTranslationSection
└─ ReflectionSection
```

## 16.2 Existing Asset Decisions

### KEEP
- shared card/surface/layout primitives,
- accessible responsive infrastructure,
- StrengthWeakness where it supports a story,
- Action Guide,
- ScoreDefinitions only where technically necessary and not product-facing,
- base loading and navigation chrome.

### REFINE
- Hero → Relationship Trailer,
- Chemistry → Emotional Climate / Mutual Activation,
- Comparison tables → selective Composition support,
- Hidden Hearts → Hidden Heart insight layer,
- Dialogue tables → context-specific script support,
- Bond / Dynamics / Frames → remap to insight architecture.

### REPOSITION
- TriScore Snapshot → optional secondary evidence, not opening,
- Deep Read → Why This Person,
- Loop → Friction Loop,
- PairPrescription → Repair & Translation,
- ConflictScriptTable → repair scenario support.

### REBUILD
- part headings,
- canonical signal presentation,
- timeline,
- scenario system,
- monolithic report view.

### REMOVE
- letter-grade badge,
- dashboard-first score framing,
- unused ShareSummaryCard,
- ConflictTriggerBanner if it duplicates the loop insight.

---

# 17. Canonical Signal Presentation

Current canonical signals should stop appearing as bold suffixes inside unrelated prose.

## 17.1 Signal Families

- Balance of Power
- Recovery Speed
- Reassurance Signal
- Unconscious Role Play
- Residual Emotion
- Expression Speed
- Compare Lean
- Saju Frame Direction

## 17.2 Display Rule

Canonical signals are **evidence-backed micro-insights**, not badges or rankings.

Recommended UI:

- small contextual signal line,
- directional A→B/B→A when supported,
- expandable “Why we see this” evidence layer,
- no score,
- no universal signal dashboard.

## 17.3 Placement

Signals should appear where they answer a relevant story question:

| Signal | Placement |
|---|---|
| Balance of Power | Role Formation / Marriage Decision & Power |
| Recovery Speed | Repair & Resilience |
| Reassurance Signal | Hidden Heart / Repair |
| Role Play | Mutual Activation / Role Formation |
| Residual Emotion | Repair |
| Expression Speed | Friction Loop / Repair |
| Compare Lean | Composition |
| Saju Frame Direction | Deep Read evidence layer |

---

# 18. Progressive Disclosure & Interaction Safety

## 18.1 Progressive disclosure

Do not place the whole relational system on one screen.

- reveal one question at a time,
- use sticky visuals only when they improve understanding,
- use pauses after emotionally dense material,
- do not use aggressive scroll-jacking,
- provide clear textual meaning independent of motion.

Device-specific layout patterns and accessibility implementation → Visual Design System / engineering standards. Product law: the **information hierarchy remains consistent** across mobile and desktop; desktop must not become a dense dashboard merely because space is available.

## 18.2 Motion (product intent)

Motion should communicate approach/distance, activation, escalation, recovery, blending, interruption. Motion should never exist solely to feel “premium,” dramatize scores, simulate certainty, gamify serious findings, or delay access to content.

## 18.3 Reduced motion

All motion-based meaning must have a static alternative (labeled states, directional indicators, sequential cards, accessible descriptions). Implementation details → Visual Design System.

## 18.4 Interaction safety

Avoid interactions that imply users can physically “fix” a relationship with one gesture.

The proposed hold-to-mend Kintsugi experiment is emotionally compelling, but it should be treated as a prototype, not an immediate production requirement. Repair must remain practical and relational, not magical.

## 18.5 Localization & cultural adaptation

Localization is not direct translation. Shared structure remains stable; examples and assumptions may adapt. Areas requiring cultural care include independence, family involvement, social obligations, gender expectations, household roles, marriage expectations, workplace hierarchy, emotional directness, public vs private affection, and financial coordination.

Do not assume one cultural pattern is universally healthy. Distinguish difference, preference, cultural norm, coordination burden, and harmful behavior—without erasing genuine strain.

---

# 19. Romantic vs. Marriage / Cohabitation (and the wider family)

## 19.1 Shared Core

Both products can share:

- Relationship Identity,
- Emotional Climate,
- Mutual Activation,
- Social Energy,
- Synergy & Drain,
- Friction Loop,
- Hidden Need,
- Repair,
- Becoming.

## 19.2 Romantic-Specific Emphasis

- attraction,
- chemistry,
- emotional activation,
- desire for closeness,
- relationship uniqueness,
- vulnerability,
- jealousy or uncertainty,
- romance maintenance.

## 19.3 Marriage / Cohabitation-Specific Emphasis

- daily operating rhythm,
- money,
- household labor,
- decision rights,
- family boundary,
- parenting,
- home energy,
- social life,
- sustainable distance,
- long-term responsibility.

## 19.4 Product Decision

Treat Marriage and Cohabitation as one **Reality Partnership** product family for now.

The analysis should focus on shared-life operation, regardless of legal marital status. Product copy can adapt terminology based on the selected relationship status.

This avoids duplicating nearly identical engines while preserving inclusive real-life relevance.

## 19.5 Friend, Work, Family (inherited constitution)

Friend, Work, and Family (Child / Parent) inherit:

- experience constitution (§2.4),
- emotional pacing stages (§4.2),
- reading hierarchy Result → Evidence → Meaning → Action,
- evidence / confidence / severity / narrative boundaries,
- measurement and chart-intent rules,
- Insight Bible as common IP,
- progressive disclosure and content suppression.

They must **not** be implemented as Romantic with swapped nouns.

| Product | Distinct product job (high level) |
|---|---|
| **Friend** | How this friendship works as a bond of trust, reciprocity, and shared life energy—not couple romance |
| **Work** | How collaboration, influence, and professional friction operate between colleagues |
| **Family — Child** | Child-perspective dynamics with a parent/caregiver |
| **Family — Parent** | Parent-perspective dynamics with a child |

Domain Blueprints own module catalogs, perspective rules, and in-scope life domains. This Bible owns the shared laws they may not redefine (facts as LLM-owned, unsupported scores, confidence-as-quality, severity-as-confidence, cards as long-form narrative, graphs as decoration, a single score as destiny, individual traits as primary subject).

## 19.6 Cross-product consistency checklist

Across Romantic, Marriage / Cohabitation, Friend, Work, and Family perspectives, share:

- component responsibilities,
- evidence hierarchy,
- confidence language,
- severity logic,
- measurement rules,
- graph selection principles,
- card selection discipline,
- narrative boundaries,
- progressive disclosure,
- Result → Evidence → Meaning → Action.

A user moving between relationship products should learn the system once—while still recognizing that each product answers a different life context.

---

# 20. Prioritized Experience Modules

Not every idea should be implemented simultaneously.

## Phase 1 — Signature Experience

Build the minimum set that proves Ahaitsme’s differentiation:

1. Relationship Trailer
2. Relationship Identity
3. Emotional Climate
4. Mutual Activation
5. Why This Person
6. Friction Loop
7. Hidden Heart
8. Repair Path
9. Reflection

## Phase 2 — Distinctive Depth

1. Social Energy Ecology
2. Synergy & Drain
3. Optimal Distance
4. Role Formation
5. Reassurance Signal
6. Recovery Speed / Residual Emotion
7. Becoming

## Phase 3 — Reality Partnership

1. Home Energy
2. Money
3. Household Labor
4. Decision & Power
5. Family Boundary
6. Parenting Potential
7. Sustainable Distance
8. Daily Recovery

---

# 21. Required Prototypes

The following prototypes should be tested before full implementation.

## 21.1 Emotional Climate Gradient

Test whether users understand a blended emotional state without interpreting it as a score.

## 21.2 Mutual Activation Dual Flow

Test whether directional activation is understandable on mobile.

## 21.3 Why This Person Deep Read

Test whether progressive evidence produces a stronger Aha than a short interpretation card.

## 21.4 Friction Loop

Test whether users recognize the cycle without feeling blamed.

## 21.5 Optimal Distance Orbit

Test whether the visual communicates rhythm and autonomy without implying emotional coldness or one person as the center.

## 21.6 Social Energy Ecology

Test whether users can distinguish:

- stimulation,
- recovery,
- intimacy preference,
- couple-level energy effect.

## 21.7 Repair Sequence

Test whether a slower repair interaction feels meaningful or manipulative.

---

# 22. Technical Work Required Before UI Build

## 22.1 Data Contract Audit

For every Phase 1 and Phase 2 insight, confirm:

- available deterministic data,
- directional support,
- confidence,
- missing fields,
- whether LLM narration is allowed,
- whether classification must remain server-owned.

## 22.2 Section Contracts

Create typed output contracts for each section instead of one large ad hoc report payload.

Recommended pattern:

```text
section_key
headline
body
supporting_evidence[]
visual_model
confidence
canonical_signals[]
action_or_reflection
```

## 22.3 Renderer Architecture

Introduce a Romantic section registry or dedicated section renderer.

The renderer should support:

- section order,
- visual model type,
- data availability fallback,
- locale,
- reduced motion,
- premium/free variants.

## 22.4 LLM Boundary

LLM may provide:

- headline,
- explanatory narrative,
- emotionally intelligent translation,
- scenario wording.

LLM may not invent:

- direction,
- classification,
- score,
- severity,
- evidence,
- canonical signal.

---

# 23. Visual and Editorial Guardrails

## 23.1 Never Use

- grade badges,
- compatibility percentages as conclusions,
- “destined” or “doomed” language,
- red/green moral coding,
- one person as the problem,
- technical saju first,
- unsupported certainty,
- visual intensity without an exit path,
- repair advice that ignores the actual loop.

## 23.2 Use Carefully

- radar charts,
- exact scores,
- shinsal,
- orbit metaphors,
- Kintsugi,
- timeline predictions,
- severe imbalance language,
- interaction requiring emotional performance.

## 23.3 Always Include

- user-recognizable scene,
- relationship mechanism,
- mutual context,
- confidence-aware language,
- strength and cost,
- actionable or reflective next step,
- accessible text equivalent.

---

# 24. Success Criteria

The redesign succeeds when users say:

- “This feels like our relationship, not a generic personality comparison.”
- “I understand why I act differently with this person.”
- “I can see why the same argument repeats.”
- “It explained my partner without taking sides.”
- “It gave us something useful to talk about.”
- “The visuals helped me understand rather than merely decorate the report.”

It fails when users primarily remember:

- a score,
- a grade,
- a pretty chart,
- a list of traits,
- a vague mystical statement,
- or a judgment about whether the relationship is good or bad.

---

# 25. Final Decisions

## Locked

1. The pre-freeze grade/dashboard mockup is retired.
2. Romantic becomes an editorial relationship journey, not a dashboard.
3. Marriage / Cohabitation becomes a shared-life operating analysis.
4. The relationship itself—not two isolated profiles—is the visual and narrative subject.
5. Relational Alchemy is the signature differentiator.
6. Why This Person must be a major Deep Read.
7. Social Energy must distinguish stimulation, recovery, and intimacy (not introvert/extrovert).
8. Every conflict insight must connect to a repair path.
9. Canonical signals become contextual evidence modules, not badges.
10. The current monolithic Romantic view must be decomposed.
11. The visual metaphor system will be hybrid: fluid, orbit, thread, and topographic patterns used by meaning; implementation lives in the Visual Design System.
12. The Relationship Insight Bible becomes the common IP layer for all relationship products.
13. This document (`05_Relationship_Product_Bible.md`) is the shared experience SSOT; former `04_Relationship_Experience_Blueprint.md` is absorbed and deleted.
14. Emotional pacing stages (Curiosity → … → Action) underlie the Final Journey chapters; recognition must precede advice.
15. Meaning before measurement; unknown states must remain visible; confidence ≠ severity ≠ relationship quality.
16. The 11 axes are analysis evidence, not automatic navigation or 11 equal sections.
17. Digest/summary and deep report serve different jobs; do not fabricate filler cards or components.
18. Deterministic layer owns classification/direction/confidence/severity; LLM narrates eligible truths only.
19. Romantic, Marriage / Cohabitation, Friend, Work, and Family (Child/Parent) are distinct products under one family constitution.
20. S4 Structural Risk is rare and heavily gated; safety disclosures use a separate pathway.

## Still to Validate

1. exact mobile behavior of each signature visualization,
2. whether Relationship Identity uses generated names or sentence identities only,
3. confidence thresholds for Optimal Distance and Social Energy,
4. exact deterministic/LLM boundary per insight,
5. which Phase 1 insights are already fully supportable by current data,
6. whether the 11-axis radar remains in the final product as an optional evidence companion,
7. premium report length and chapter budgets,
8. accessibility behavior for gradients and motion (implementation),
9. free versus premium reveal strategy.

---

# 26. Immediate Next Work

The next work should not be another broad research round.

It should be a **Product-to-Implementation Mapping Pass**.

For each Phase 1 insight:

1. define the final user question,
2. define the required deterministic evidence,
3. identify current fields and gaps,
4. select one visual model,
5. identify reusable UI assets,
6. define the section contract,
7. define LLM narrative boundaries,
8. mark KEEP / REFINE / REPOSITION / REBUILD,
9. estimate implementation complexity,
10. place it in the phased roadmap.

The first mapping batch should cover:

```text
Relationship Trailer
Relationship Identity
Emotional Climate
Mutual Activation
Why This Person
Friction Loop
Hidden Heart
Repair Path
```

This batch is large enough to create the signature report and narrow enough to implement coherently.

---

# 27. Final Product Statement

> Ahaitsme does not tell two people whether they are compatible.  
> It reveals the relationship that only exists when they are together.

It explains:

- why the relationship feels the way it does,
- why each person becomes different inside it,
- why its greatest strength and greatest conflict may share the same root,
- what kind of closeness protects rather than exhausts it,
- and how two people can translate understanding into a more workable life.

Users should move naturally from:

```text
What is happening between us?
→ Why does it happen?
→ Where does it show up?
→ How much does it matter?
→ What can we do with this understanding?
```

That is the product.

---

# 28. Definition of Done (shared experience)

The shared experience system is successfully implemented when:

1. every visible component has one documented responsibility,
2. every major insight has a canonical deterministic owner,
3. key cards are selected by evidence and user value (no fabricated third card),
4. summary and deep reports serve different purposes,
5. visible scores have defined constructs and methodology,
6. unknown states are not converted into neutral-looking values,
7. the 11 axes support relationship questions rather than dictate navigation,
8. graphs are selected by task rather than visual preference,
9. LLM narrative cannot create or change classifications,
10. repeated insights are consolidated,
11. social rhythm/energy differences are treated as relationship dynamics when relevant,
12. confidence and severity remain separate,
13. Korean and English outputs preserve the same canonical findings,
14. mobile and desktop maintain the same information hierarchy,
15. real local reports pass structured editorial/product review (similar, complementary, high-friction, mixed-confidence, limited-data; KO+EN),
16. the output is credible as an intentional product, not a feature pile.

---

# 29. Consolidation from 04 — Coverage Map

Source (deleted): formerly `04_Relationship_Experience_Blueprint.md`  
Target: this document  
Policy: merge unique valid product decisions; exclude visual-implementation detail; prefer newer locked decisions in 05 when conflicted.

| 04 Part | Disposition in 05 |
|---|---|
| Part 1 Constitution / goals / inheritance | Represented in §0, §0A, §2.4 |
| Part 2 Journey stages & integrity | Represented in §4.2–4.5 (mapped to Final Journey) |
| Part 3 Information Architecture | Represented in §13A |
| Part 4 Component constitution & stack | Represented in §13B, §16 (architecture), §13C |
| Measurement / false precision / indices | Represented in §13C |
| 11-axis policy | Represented in §13C.4 |
| Narrative ownership / contracts | Represented in §13.6 (+ §22.4) |
| Comparison / reflection / decision / action | Represented in §13B.4–13B.6 |
| Severity ladder | Represented in §13.4 |
| Digest vs deep | Represented in §13A.7 |
| Suppression / cross-product consistency | Represented in §13A.8, §19.5–19.6 |
| Social energy as dynamic | Represented in §6.3, §13C.6 |
| Implementation mapping / canonical insight fields | Partially in §12, §17, §22; field schema intent in §12 + §22.2 |
| Mobile/desktop/a11y/color/motion implementation | **Excluded** → `06_Visual_Design_System.md` (product intent kept in §14, §18) |
| Local validation checklist | Represented in §28 |
| Domain-specific module catalogs | **Not merged as catalogs** → domain Blueprints (`05A`, etc.) |
| LLM prompts / rule-engine code rules | **Excluded** → technical / prompt SSOTs |

Former `04` has been **deleted** after consolidation. Use this document as the only active shared experience authority.

---

# 30. Conflict Log (04 ↔ 05)

| Conflict | Resolution |
|---|---|
| **SSOT claim:** 04 claimed shared-experience SSOT for all products; 05 was Romantic+Marriage master | **Prefer 05 as single product Bible**, expanded to own shared constitution for all products while elaborating Romantic+Marriage. 04 pending archive. |
| **Journey model:** 04’s 9 pacing stages vs 05’s Final Journey chapters + reward curve | **Prefer 05 chapters as locked sequence**; **retain 04 stages as emotional pacing constitution** with explicit mapping (§4.2). Neither discarded. |
| **Opening pattern:** 04 Hero + three-card stack vs 05 Relationship Trailer (5 required beats) | **Prefer 05 Trailer** as deep-report opening; **retain three-card portfolio** for digest/summary signal surfaces (§13B.3). |
| **Scope of Friend/Work/Family:** 04 fully in-scope constitutionally; 05 treated as future applications | **Merge:** full constitutional inheritance now (§0A, §19.5); module catalogs remain domain Blueprints. |
| **Radar / 11 axes:** 04 detailed radar policy; 05 “still validate radar” | **Lock product rule** (axes = evidence, not navigation; radar not default for 11-way compare). **Keep UI validation** for whether radar remains as optional companion. |
| **Visual language ownership:** 04 included color/motion/a11y implementation; 05 included metaphor system + some motion rules | **Product metaphor/intent stays in 05**; **implementation detail deferred to Visual Design System**—04 implementation subsections intentionally not copied. |
| **Measurement center:** 04 allowed explained indices; 05 forbids dashboard-first / grade | **Compatible:** indices allowed only as subordinate orientation (§13C); dashboard-first and grades remain forbidden. |