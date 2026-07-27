# 05D — Family Product Blueprint

**Version:** 1.0  
**Status:** Canonical Product SSOT  
**Owner:** Product Director  
**Applies to:** Ahaitsme Family — Parent Perspective and Child Perspective  
**Depends on:**

- `01_Product_Vision.md`
- `02_Relationship-ux-bible.md`
- `04_Relationship_Experience_Blueprint.md`
- `05_Relationship_Product_Bible.md`
- `docs/dev/05_NARRATIVE_STYLE_BIBLE.md`

---

## Authority

This document is the product source of truth for Ahaitsme Family.

It defines:

- who the Family product is for,
- which human questions it must answer,
- how the report should unfold emotionally,
- which modules belong in the experience,
- how Saju, the 11 psychological axes, and pair evidence work together,
- what Family must never become,
- and how Family remains consistent with Romantic, Friend, Work, and Marriage while preserving its own domain identity.

This document does **not** define:

- implementation architecture,
- resolver ownership,
- prompt schemas,
- API contracts,
- component names,
- migration batches,
- or release checklists.

Those belong to `06D_Family_Technical_Blueprint.md` and `07D_Family_Implementation_Checklist.md`.

---

# Part I — Product Definition

## 1. Product Thesis

> **Aha! Family is not a parenting guide. It is a relationship translation guide for families.**

Family does not exist to help parents manage children.

Family helps parents and children understand:

- who the other person fundamentally is,
- why the same behavior carries different meanings to each person,
- why certain conflicts repeat,
- how the shared home and life environment affects each member differently,
- how the relationship may change as the child matures,
- and what each person can do to make love easier to recognize.

The product is not trying to change the child.

It is not trying to excuse the parent.

It is trying to change the quality of understanding between them.

---

## 2. The Relationship Is the Protagonist

Family must not become two separate personality reports placed side by side.

The primary subject is:

> **What happens between this parent and this child?**

Individual traits matter only when they help explain:

- attraction or resistance,
- closeness or distance,
- trust or vigilance,
- guidance or control,
- care or pressure,
- dependence or independence,
- and the way each person experiences the same home.

The report should make the reader think:

- “아, 이 사람이 원래 이래서 그랬구나.”
- “나를 싫어해서가 아니었네.”
- “걱정이 사랑이었는데, 상대에게는 통제로 느껴졌구나.”
- “문제는 성격만이 아니라 우리가 사는 방식에도 있었구나.”
- “다음에는 이렇게 말해봐야겠다.”

---

## 3. Family Is Bidirectional

The most common use case may begin with a parent trying to understand a child.

That does not make Family a one-way parent-to-child report.

Family must support two legitimate reading perspectives:

### Parent Perspective

- Who is this child beneath the behavior I see?
- Why does my usual way of guiding them fail?
- What kind of environment helps them grow?
- What should I protect, encourage, or stop pushing?
- How might our relationship change as they mature?

### Child Perspective

- Why does my mother or father act this way?
- What do they believe they are protecting?
- Why does their love sometimes feel like criticism, distance, or control?
- What kind of child do they believe I am?
- How can I communicate without abandoning myself?

The report may vary its emphasis by viewer role, but the underlying relationship truth must remain consistent.

---

# Part II — Product Promise and Boundaries

## 4. Core Product Promise

Family should deliver four outcomes.

### 4.1 Recognition

The reader recognizes both people in ordinary, believable behavior.

### 4.2 Translation

The report explains how one person’s intention becomes a different experience for the other.

### 4.3 Reframing

The report reveals that the conflict may come from temperament, timing, role expectations, or environmental mismatch—not simply bad character or lack of love.

### 4.4 Action

The report leaves a small number of memorable, specific adjustments that can change the relationship.

---

## 5. What Family Is Not

Family is not:

- a baby tracker,
- a sleep or feeding tracker,
- a growth or vaccination tracker,
- a medical or developmental diagnosis,
- a co-parenting logistics tool,
- a behavior surveillance system,
- an academic ranking engine,
- a deterministic career predictor,
- a fate declaration,
- or a tool for deciding whether a parent or child is good or bad.

Operational parenting utilities may be useful products, but they are outside Ahaitsme Family’s identity.

Every proposed feature must pass one test:

> **Does this help family members understand each other better?**

If not, it does not belong.

---

## 6. Product Safety Boundary

Family may discuss tendencies, relational patterns, environments, growth timing, and supported possibilities.

Family must never:

- diagnose autism, ADHD, depression, trauma, attachment disorders, or any medical condition,
- claim inevitable academic, financial, marital, or career outcomes,
- predict harm, abandonment, criminality, or family breakdown as fate,
- tell a user to cut off a family member,
- justify abuse through temperament or Saju,
- instruct a child to conceal danger from a trusted adult,
- or treat spiritual interpretation as scientific certainty.

When the user’s situation suggests immediate safety concerns, the product must prioritize safety-oriented guidance over relationship interpretation.

---

# Part III — The Family Evidence Model

## 7. Three Evidence Layers

Family uses three distinct evidence layers. They must not collapse into one another.

### 7.1 Saju Layer — Origin, Pattern, and Time

Saju provides the deeper interpretive structure for:

- innate temperament,
- elemental balance,
- relationship roles,
- parental and child dynamics,
- growth timing,
- maturation patterns,
- independence and movement tendencies,
- learning and talent tendencies,
- social attraction and relationship patterns,
- environmental fit,
- and long-horizon possibilities.

Saju is not decorative flavor. It is a core source of product differentiation.

### 7.2 11-Axis Layer — Human-Readable Psychological Language

The 11 axes translate behavior into language users can understand and compare:

1. stimulation
2. self_control
3. practicality
4. structure
5. empathy
6. conflict_style
7. resilience
8. recognition
9. energy_style
10. thinking_style
11. decision_style

The axes are not the final report structure.

They are evidence ingredients used to explain scenes, differences, and communication needs.

### 7.3 Pair Layer — What Happens Between Them

Pair evidence explains:

- similarity,
- complementarity,
- directional mismatch,
- trigger patterns,
- role imbalance,
- emotional loops,
- pressure and recovery,
- and how each person changes in the presence of the other.

The product should not narrate Person A and Person B independently and ask the user to infer the relationship.

The product must perform the synthesis.

---

## 8. The Canonical Interpretation Chain

Every major Family insight should follow this chain:

> **Human behavior → supported evidence → relationship meaning → usable adjustment**

Example:

> The child needs time to organize thoughts before answering.  
> The 11-axis profile shows slower internal processing under pressure, while Saju evidence supports inward recovery and delayed expression.  
> The parent’s fast corrective style can therefore feel like interrogation, even when the intention is guidance.  
> Ask one question, give time, and return later instead of demanding an immediate explanation.

The user-facing report should not expose the full technical chain every time. The chain exists to guarantee integrity.

---

## 9. Evidence Confidence and Language

The strength of language must reflect the strength of evidence.

- **Corroborated:** multiple independent signals agree; write clearly but not fatefully.
- **Refined:** one strong signal plus contextual support; write as a likely pattern.
- **Tentative:** partial or ambiguous evidence; write as a possibility worth noticing.
- **Unsupported:** omit the claim.

The report must never manufacture specificity merely to sound insightful.

---

# Part IV — Core Human Questions

## 10. The Questions Family Must Be Able to Answer

Family should be designed around real questions, not around available calculations.

### Identity and Temperament

- What kind of person is my child beneath the behavior I see?
- What kind of person is my parent beneath the role they perform?
- What energizes, overwhelms, motivates, or closes this person?
- How do they understand the world?

### Communication

- How should I speak so this person can actually hear me?
- What kind of tone feels caring, and what kind feels threatening?
- Does this person need warmth, logic, trust, space, repetition, or directness?
- How do they naturally express love?

### Misunderstanding and Conflict

- Why do we keep having the same argument?
- What does each person believe is happening?
- What is the hidden intention beneath the behavior?
- What makes the conflict escalate, and what helps it settle?

### Expectations and Roles

- What kind of parent does the child want?
- What kind of child does the parent expect?
- Does the parent see the child as someone to protect, train, trust, rely on, or simply adore?
- Does the child experience the parent as protector, teacher, authority, teammate, refuge, or pressure?

### Growth and Future

- Is this person an early bloomer or a late developer?
- Can current defiance, slowness, or inconsistency change with maturity?
- What kind of learning, major, work, or creative environment may fit?
- Is growth more likely through stability, challenge, people, expertise, movement, or independence?

### Environment

- Does this home’s pace fit each person?
- Who is overstimulated, understimulated, crowded, isolated, or overcontrolled?
- Does the person thrive in a busy city, a quiet environment, or a blended rhythm?
- Would distance, travel, dormitory life, or earlier independence improve growth or the relationship?

### Long-Term Relationship

- Will closeness improve when the child becomes an adult?
- Does this relationship benefit from physical proximity or respectful distance?
- What must change so love remains recognizable across life stages?

---

# Part V — Report Experience Architecture

## 11. The Emotional Arc

Family must not read like an encyclopedia.

The report must create a clear narrative arc.

### Act I — Recognition: “This is who we are.”

The reader meets each person as a human being, not as a score.

The opening should quickly establish:

- the relationship’s central identity,
- what feels naturally easy,
- and the tension that makes the report worth reading.

### Act II — Translation: “This is why we keep missing each other.”

The report shows:

- the parent’s intention,
- the child’s experience,
- the child’s intention,
- the parent’s experience,
- and the loop created between them.

This is the first major “아, 그래서 그랬구나” moment.

### Act III — Reversal: “The problem was not only personality.”

The report reveals deeper context:

- role expectations,
- shared home climate,
- pace and stimulation,
- structure and freedom,
- closeness and independence,
- growth timing,
- and environmental fit.

The user should discover that the relationship is shaped by both people and the life they share.

### Act IV — Movement: “Here is what changes the relationship.”

The report ends with a small number of high-value adjustments:

- one thing to understand,
- one way to speak,
- one conflict repair move,
- one environmental adjustment,
- and, when supported, one long-term growth perspective.

The ending should create relief, agency, and hope.

---

## 12. Report Density Law

Family is not improved by adding every available insight.

The report should prioritize:

- high-recognition insights,
- relationship-changing insights,
- non-obvious synthesis,
- and advice specific enough to use.

The report should remove:

- repeated personality descriptions,
- low-value trivia,
- generic parenting advice,
- multiple sections that make the same claim,
- raw technical evidence without interpretation,
- and future predictions that do not change a present decision.

A shorter report with a strong emotional arc is better than a comprehensive report that feels assembled.

---

# Part VI — Canonical Family Modules

## 13. Module 1 — Family Hero

### Human Question

> What is the defining pattern of this relationship?

### Product Job

Create immediate recognition and curiosity without grading the relationship.

### Required Content

- one-line relationship identity,
- a concise explanation of the natural bond,
- the central difference or tension,
- and a reason to continue.

### Prohibited

- compatibility grade,
- rank,
- “good parent / bad parent,”
- “good child / difficult child,”
- deterministic fate language.

---

## 14. Module 2 — Two People, One Relationship

### Human Question

> Who are we beneath our family roles?

### Product Job

Introduce each person’s core temperament only as it affects the relationship.

### Evidence

- Saju temperament,
- selected 11-axis patterns,
- relevant pair contrast or similarity.

### Narrative Rule

Do not provide two complete standalone profiles. Select only traits needed to understand the story that follows.

---

## 15. Module 3 — The Translation Gap

### Human Question

> What do I mean, and what does the other person hear?

### Product Job

Reveal the relationship’s central misinterpretation.

### Canonical Pattern

- Parent intention → Child experience
- Child intention → Parent experience

### Example

> The parent is trying to prevent a mistake.  
> The child experiences repeated correction as a lack of trust.

This module should produce one of the report’s strongest recognition moments.

---

## 16. Module 4 — The Relationship Loop

### Human Question

> How does one reaction trigger the next?

### Product Job

Show the recurring interaction cycle without blaming either person.

### Structure

1. Trigger
2. Person A reaction
3. Person B interpretation
4. Person B reaction
5. Person A confirmation
6. Escalation or withdrawal
7. Interrupt point

### Required Outcome

The reader can identify where the loop can be changed.

---

## 17. Module 5 — Love, Care, and Recognition

### Human Question

> How does each person give love, and how do they recognize it?

### Product Job

Translate love that may be present but poorly received.

Possible patterns include:

- words vs actions,
- protection vs trust,
- closeness vs space,
- practical support vs emotional warmth,
- praise vs quiet confidence,
- frequent reassurance vs non-intrusive loyalty.

The report must not force a generic love-language framework when evidence does not support it.

---

## 18. Module 6 — Expectations and Family Roles

### Human Question

> What kind of parent and child do we expect each other to be?

### Product Job

Make invisible role expectations visible.

### Required Perspectives

- the parent’s ideal child,
- the child’s ideal parent,
- how the parent appears in the child’s eyes,
- how the child appears in the parent’s eyes.

Possible relational roles may include:

- protector,
- teacher,
- authority,
- teammate,
- refuge,
- responsibility,
- source of pride,
- source of worry,
- mood-maker,
- trusted adult,
- or beloved dependent.

These are narrative roles, not permanent archetype labels.

---

## 19. Module 7 — Shared Environment Fit

### Human Question

> Does the life this family has built fit both people?

### Product Job

Explain how the same environment affects each person differently.

### Environment Dimensions

- stimulation: busy vs quiet,
- pace: fast vs unhurried,
- social density: open household vs private household,
- structure: fixed routine vs flexibility,
- autonomy: togetherness vs personal space,
- emotional climate: expressive vs restrained,
- achievement climate: performance vs security,
- location: city, nature, or blended access,
- movement: rootedness vs travel and change,
- independence: prolonged proximity vs earlier separation.

### Critical Distinction

`home_climate` describes the emotional atmosphere of the household.

`shared_environment_fit` describes whether the household’s pace, stimulation, structure, space, and mobility fit each person’s temperament.

They are related but not interchangeable.

### Adaptation Cost

The module should identify, when supported:

- who adapts most,
- what that adaptation costs,
- and which small environmental change provides the greatest relief.

The first recommendation should not be a major life change. Prefer small, realistic adjustments before relocation, school change, or early separation.

---

## 20. Module 8 — Conflict and Repair

### Human Question

> What helps us stop hurting each other when tension begins?

### Product Job

Provide a specific repair sequence derived from the relationship pattern.

### Required Content

- likely trigger,
- escalation signal,
- what not to do,
- pause or recovery need,
- re-entry language,
- and a realistic repair action.

### Tone Rule

The improved script should sound like a real family, not a therapist’s demonstration.

---

## 21. Module 9 — Growth, Learning, and Future Direction

### Human Question

> How does this person grow, and what kind of future environment may fit?

### Product Job

Help the family make better developmental choices without claiming fate.

### Permitted Areas

- early vs late maturation,
- learning style,
- focus conditions,
- response to competition,
- creativity vs structure,
- practical vs conceptual orientation,
- people-centered vs independent work,
- specialist vs entrepreneurial tendency,
- stability vs movement,
- local roots vs travel or overseas exposure,
- proximity vs independence,
- social network patterns,
- and supported relationship timing themes.

### Career and Major Guidance

The product may recommend environments and families of work, such as:

- research and deep specialization,
- building and making,
- leadership and enterprise,
- service and care,
- communication and persuasion,
- creative production,
- systems and operations,
- or mobile and cross-cultural work.

It must not declare a single guaranteed occupation or financial outcome.

### Time Horizon Rule

Future interpretation must answer a present decision.

Good:

> This person may mature through responsibility later than peers. Pressure alone is unlikely to accelerate that process; meaningful ownership may.

Bad:

> They will become successful at age 32.

---

## 22. Module 10 — The Family Playbook

### Human Question

> What should we remember and do differently?

### Product Job

Compress the report into memorable action.

### Recommended Output

- **Understand:** one core truth about the other person.
- **Say:** one communication adjustment.
- **Repair:** one conflict recovery move.
- **Change:** one environmental or routine adjustment.
- **Protect:** one strength that should not be corrected out of the person.

The playbook should contain no more than five primary actions.

---

## 23. Module 11 — Closing Reflection

### Human Question

> What becomes possible when we understand this relationship differently?

### Product Job

End with dignity and hope, not prediction.

The closing should affirm:

- neither person is reducible to the conflict,
- love can be present even when it is poorly translated,
- understanding does not remove boundaries,
- and small changes can alter the relationship’s future.

---

# Part VII — 11-Axis Product Use

## 24. The 11 Axes Are Evidence, Not Chapters

The report must not automatically create eleven sections.

Each axis should be used only when it changes understanding.

| Axis | Family Meaning | Typical Relationship Question |
|---|---|---|
| stimulation | need for novelty, intensity, and activity | Is the home too quiet, too busy, or too repetitive? |
| self_control | impulse regulation and internal restraint | Does pressure improve behavior or increase shutdown? |
| practicality | concrete utility and real-world orientation | Does advice need examples, purpose, or visible outcomes? |
| structure | preference for rules, order, and predictability | Does routine create safety or resistance? |
| empathy | sensitivity to emotional states | Must emotion be acknowledged before problem-solving? |
| conflict_style | directness, avoidance, and confrontation pattern | Should the family address tension immediately or after space? |
| resilience | recovery after stress or disappointment | How long does hurt remain active, and what supports return? |
| recognition | need to feel seen, valued, or affirmed | Is correction overwhelming the person’s sense of being trusted? |
| energy_style | social and internal energy rhythm | Does the person recover through company, activity, or solitude? |
| thinking_style | intuitive, analytical, broad, or detailed processing | How should explanations be framed and paced? |
| decision_style | speed, certainty, consultation, and risk | How much choice, time, or guidance helps decisions? |

### Axis Selection Rule

A module should use the smallest set of axes needed to explain the relationship pattern.

### Unsupported Contrast Rule

Do not write “one is emotional and the other is logical” unless both directions are supported.

Similarity must not be rewritten as contrast for drama.

---

# Part VIII — Saju-Specific Product Differentiation

## 25. What Saju Adds Beyond Personality

Saju should provide insight in areas that static personality tools often cannot address well:

- why the trait may exist,
- how different tendencies coexist in one person,
- how the relationship changes the expression of those tendencies,
- how maturation may alter behavior,
- which environments activate or suppress strengths,
- whether stability, movement, independence, people, or responsibility support growth,
- and how long-term family roles may evolve.

---

## 26. Approved Saju Interpretation Domains

Family may interpret supported signals related to:

- elemental balance and environmental nourishment,
- Day Master temperament,
- Ten Gods role dynamics,
- parent–child generating and controlling flows,
- natal chart structure,
- Day, Month, Year, and Hour Pillar relevance,
- combinations, clashes, punishments, and voids,
- favorable and unfavorable elemental conditions,
- and Luck Pillar timing where the underlying engine supports it.

These technical sources should normally be translated into human meaning rather than displayed as jargon.

---

## 27. Saju Narrative Law

Saju must explain; it must not intimidate.

Preferred:

> This person tends to grow when given real ownership rather than repeated supervision.

Optional supporting reveal:

> In the chart, independence and output become stronger when responsibility is tangible.

Avoid:

> Because the Seven Killings star dominates the chart, the child will reject authority.

The product may offer expandable evidence for users who want depth, but the primary story remains human.

---

# Part IX — Perspective, Age, and Lifecycle

## 28. Age-Aware Interpretation

Family must adapt to life stage.

### Younger Child

Emphasize:

- temperament,
- soothing and regulation,
- communication,
- routine and environment,
- play and learning conditions,
- and protection of emerging strengths.

### Adolescent

Emphasize:

- autonomy,
- trust,
- privacy,
- rebellion and control,
- peer influence,
- academic pressure,
- identity formation,
- and conflict repair.

### Adult Child

Emphasize:

- understanding the parent as a person,
- boundaries,
- duty and expectation,
- closeness vs distance,
- unresolved role patterns,
- independence,
- caregiving reversal,
- and maintaining connection without regression into childhood roles.

### Parent of Adult Child

Emphasize:

- releasing control,
- respecting adult autonomy,
- changing the form of care,
- managing worry without intrusion,
- and building a relationship that can survive distance.

---

## 29. Survey Availability

If both people can complete the 11-axis survey, the report may use full bidirectional psych evidence.

If the child is too young or one party does not participate:

- do not fabricate their psych profile,
- rely on approved Saju and pair evidence,
- clearly reduce confidence where appropriate,
- and avoid pretending that observed behavior is self-reported truth.

The product must distinguish:

- what the person reported,
- what Saju suggests,
- what the pair engine infers,
- and what remains unknown.

---

# Part X — Cross-Product Consistency

## 30. Shared Relationship Grammar

Family inherits the same core Ahaitsme experience grammar as Romantic, Friend, Work, and Marriage:

1. relationship identity,
2. individual tendencies only as relevant,
3. pair dynamic,
4. misunderstanding or friction,
5. translation and repair,
6. practical movement,
7. hopeful closing.

Shared laws include:

- relationship before individuals,
- meaning before measurement,
- recognition before advice,
- story before evidence detail,
- deterministic truth before LLM prose,
- confidence-aware language,
- no grade or fate,
- and no unsupported contrast.

---

## 31. Family-Specific Ownership

Family uniquely owns:

- generational and role asymmetry,
- the parent’s influence over the child’s environment,
- development and maturation,
- parental expectation and child expectation,
- household emotional climate,
- shared environment fit,
- dependence and independence,
- adult-child reinterpretation of the parent,
- and long-term transformation of family roles.

Romantic intimacy, workplace execution, friendship reciprocity, and marriage operations remain owned by their respective products.

---

# Part XI — Narrative and Editorial Laws

## 32. Voice

Family should sound:

- warm,
- intelligent,
- concise,
- emotionally perceptive,
- respectful across generations,
- and clear enough to use in real life.

It should not sound:

- clinical,
- preachy,
- superstitious,
- childish,
- accusatory,
- or artificially therapeutic.

---

## 33. Dignity Law

Both people must retain dignity.

The parent may be controlling without being reduced to a villain.

The child may be defiant without being reduced to a problem.

Understanding motive does not excuse harmful behavior.

Naming harm does not require denying love.

---

## 34. Recognition Before Advice

Every difficult section should follow this order:

1. recognize the lived experience,
2. explain the pattern,
3. translate both sides,
4. identify the interrupt point,
5. offer one usable action.

Advice that appears before the reader feels understood will feel generic or judgmental.

---

## 35. Scene Rule

Use short, believable family scenes to make patterns recognizable.

Good scenes include:

- homework or school decisions,
- morning routines,
- phone and privacy disputes,
- correction after a mistake,
- family gatherings,
- plans changing suddenly,
- choosing a major or job,
- requests for independence,
- and post-conflict silence.

Do not invent personal history. Scenes must be framed as likely patterns or examples derived from evidence.

---

## 36. Claim Deduplication

Each module must contribute new understanding.

The same trait should not be repeated as:

- a Hero line,
- an axis explanation,
- a conflict explanation,
- an environment explanation,
- and a playbook recommendation

unless each appearance adds a distinct layer of meaning.

---

# Part XII — Product Prioritization

## 37. Launch-Critical Experience

The first complete Family experience should prioritize:

1. Family Hero
2. Two People, One Relationship
3. Translation Gap
4. Relationship Loop
5. Love, Care, and Recognition
6. Expectations and Roles
7. Shared Environment Fit
8. Conflict and Repair
9. Growth, Learning, and Future Direction
10. Family Playbook
11. Closing Reflection

This is the intended narrative order, not a technical implementation order.

---

## 38. High-Value Re-Read Assets

The modules most likely to earn repeated use are:

- Translation Gap,
- Relationship Loop,
- Shared Environment Fit,
- Conflict and Repair,
- Family Playbook,
- and age-specific Growth Direction.

These modules should be easy to revisit after conflict or before an important family decision.

---

## 39. Deferred or Conditional Ideas

The following may be considered later but are not required for the canonical launch experience:

- interactive scenario questions,
- conversation rehearsal,
- family-wide multi-person maps,
- sibling dynamics,
- repeated check-ins over life stages,
- environmental planning tools,
- and longitudinal relationship updates.

They should not delay completion of the core dyadic report.

---

# Part XIII — Product Acceptance Criteria

## 40. The Report Succeeds When

After reading, the user is likely to think:

- “이 사람이 왜 그랬는지 조금 알겠다.”
- “나도 상대에게 이렇게 보였겠구나.”
- “사랑이 없었던 게 아니라 전달 방식이 달랐구나.”
- “우리 집의 속도가 모두에게 맞는 건 아니었구나.”
- “지금 모습만 보고 이 사람의 가능성을 단정하면 안 되겠다.”
- “다음 갈등에서는 이 한 가지를 바꿔봐야겠다.”

---

## 41. The Report Fails When

The dominant user reaction is:

- “그래서 좋은 부모야, 나쁜 부모야?”
- “이 아이는 성공해, 실패해?”
- “점수가 몇 점이지?”
- “내용은 많은데 뭘 기억해야 하지?”
- “결국 일반적인 육아 조언이네.”
- “사주 단어는 많은데 우리 관계는 설명되지 않았네.”

---

# 42. Non-Negotiable Product Laws

1. **Family is relationship intelligence, not parenting management.**
2. **The relationship is the protagonist.**
3. **Parent and child are both full people, not fixed roles.**
4. **Family supports both parent and child perspectives.**
5. **Recognition comes before advice.**
6. **The report must have a narrative arc, not a catalog structure.**
7. **The 11 axes are evidence ingredients, not eleven chapters.**
8. **Saju is a core explanatory and temporal layer, not decorative language.**
9. **Every meaningful claim must be supported and confidence-aware.**
10. **The same behavior may carry different intentions and meanings. Translate both.**
11. **Shared environment fit is a first-class Family concept.**
12. **Home climate and environment fit are related but distinct.**
13. **Future insight must improve a present decision.**
14. **Career and growth guidance describes fitting environments, not guaranteed outcomes.**
15. **No grade, rank, diagnosis, or fate may replace understanding.**
16. **No difficult truth may erase dignity.**
17. **No insight is included merely because data exists.**
18. **The final playbook must be short enough to remember.**
19. **Family remains recognizably Ahaitsme while owning generational, developmental, and environmental dynamics.**
20. **The product should leave the family with more agency, not more fear.**

---

# Final Principle

The user should not leave thinking about axes, elements, stars, scores, or algorithms.

They should leave thinking:

> **“Someone finally explained why we keep missing each other—and what might help us meet differently.”**
