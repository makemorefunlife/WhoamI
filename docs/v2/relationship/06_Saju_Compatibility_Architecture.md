# 06_Saju_Compatibility_Architecture.md

## Purpose

Define the architecture of the Innate Compatibility Engine.

This engine evaluates relationship dynamics between two Innate Self Profiles derived from Saju data.

The engine translates traditional Saju interactions into human-centered relationship signals.

The output must remain understandable to non-Saju users.

---

# Compatibility Levels

## Level 1

Human Framework Comparison

Compare:

```text
Freedom
Connection
Stability
Growth
Control
Adaptability
```

Purpose:

```text
How similar are two innate personalities?
```

---

## Level 2

Structural Compatibility

Analyze:

```text
Heavenly Stems
Earthly Branches
Five Elements
Ten Gods
12 Growth Stages
```

Purpose:

```text
How naturally do two innate systems interact?
```

---

## Level 3

Relationship Dynamics

Convert structural findings into:

```text
Relationship Signals
```

Purpose:

```text
Translate Saju logic into relationship language.
```

---

# Engine Flow

```text
Person A Saju
      +
Person B Saju

↓

Compatibility Engine

↓

Raw Compatibility Events

↓

Relationship Signals

↓

Report Generator

↓

Compatibility Report
```

---

# Compatibility Engine Layers

## Layer 1

Innate Profile Comparison

Input:

```text
InnateSelfProfile A

InnateSelfProfile B
```

Compare:

```text
Freedom
Connection
Stability
Growth
Control
Adaptability
```

Output:

```text
Profile Compatibility
```

---

## Layer 2

Saju Interaction Analysis

Input:

```text
Four Pillars A

Four Pillars B
```

Analyze:

```text
Stem Interactions

Branch Interactions

Five Element Dynamics

Ten God Dynamics

Growth Stage Dynamics
```

Output:

```text
Raw Compatibility Events
```

---

## Layer 3

Raw Compatibility Events

Purpose:

```text
Store all detected compatibility interactions
before signal translation.
```

Examples:

```json
{
  "event_type": "stem_combination",
  "event_name": "ding_ren_combination",
  "strength": 0.8
}
```

```json
{
  "event_type": "branch_clash",
  "event_name": "zi_wu_clash",
  "strength": 0.9
}
```

```json
{
  "event_type": "yuan_zhen",
  "event_name": "yin_you_yuan_zhen",
  "strength": 0.7
}
```

Output:

```text
Structured Compatibility Events
```

---

## Layer 4

Signal Translation

Convert compatibility events into:

```text
natural_affinity

emotional_resonance

communication_alignment

growth_support

stability_potential

relationship_tension

challenge_potential

long_term_potential
```

---

# Relationship Signals

The engine must never expose raw Saju terminology to users.

Avoid:

```text
갑기합

정임합

자오충

인신충

편재

정인
```

Use:

```text
natural_affinity

growth_support

value_alignment

supportive_dynamic

communication_gap

emotional_balance

shared_growth

relationship_tension
```

---

# Signal Categories

## Attraction

Measures:

```text
Natural pull

Interest

Curiosity
```

Signal:

```text
natural_affinity
```

---

## Emotional

Measures:

```text
Emotional understanding

Comfort

Empathy
```

Signal:

```text
emotional_resonance
```

---

## Communication

Measures:

```text
Expression style

Conflict style

Understanding style
```

Signal:

```text
communication_alignment
```

---

## Growth

Measures:

```text
Mutual development

Challenge

Learning
```

Signal:

```text
growth_support
```

---

## Stability

Measures:

```text
Consistency

Trust

Reliability
```

Signal:

```text
stability_potential
```

---

## Friction

Measures:

```text
Conflict risk

Misunderstanding

Value clashes
```

Signal:

```text
relationship_tension
```

---

## Challenge

Measures:

```text
Constructive pressure

Growth through differences

Transformational influence
```

Signal:

```text
challenge_potential
```

---

## Long Term

Measures:

```text
Relationship durability

Long-term alignment

Shared future potential
```

Signal:

```text
long_term_potential
```

---

# Output Object

```json
{
  "natural_affinity": 0,
  "emotional_resonance": 0,
  "communication_alignment": 0,
  "growth_support": 0,
  "stability_potential": 0,
  "relationship_tension": 0,
  "challenge_potential": 0,
  "long_term_potential": 0
}
```

---

# Separation of Responsibilities

This document defines:

```text
Architecture

Engine Flow

Layer Structure

Relationship Signals

Output Schema
```

This document does NOT define:

```text
Compatibility Rules

Stem Combination Rules

Branch Interaction Rules

Five Element Rules

Ten God Rules

12 Growth Stage Rules

Scoring Logic
```

Those belong in:

```text
07_Saju_Compatibility_Rules.md
```

---

# Design Principles

## Principle 1

```text
Separate calculation from interpretation.
```

---

## Principle 2

```text
Store compatibility events before generating signals.
```

---

## Principle 3

```text
Translate Saju concepts into human relationship language.
```

---

## Principle 4

```text
Allow future expansion without changing architecture.
```

Examples:

```text
Yuan Zhen

Secret Combination

Secret Clash

Gui Men

Additional Compatibility Systems
```

can be added later through Compatibility Rules
without modifying this architecture.

```
```
