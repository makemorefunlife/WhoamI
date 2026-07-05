# 01_Relationship_Architecture.md

## Purpose

Define the overall architecture of the Relationship Analysis Engine.

This document describes:

* Inputs
* Processing Layers
* Outputs
* Premium Extensions

It does NOT contain:

* behavior definitions
* relationship rules
* report content
* prompt instructions

These belong in separate documents.

---

# Core Philosophy

Relationship analysis should explain:

* why people connect
* why people misunderstand each other
* where friction comes from
* how communication can improve

The goal is not personality labeling.

The goal is behavioral understanding.

---

# Architecture Overview

```text
Survey Results
↓
Human Framework Scores
↓
Behavior Framework
↓
Behavior Tags
↓
Relationship Rules Engine
↓
Relationship Insights
↓
LLM Narrative
↓
User Report
```

---

# Layer 1

Survey Results

Input:

* Primary Axes
* Secondary Axes

Source:

survey/

---

# Layer 2

Behavior Framework

Reference:

relationship/02_Behavior_Framework.md

Purpose:

Convert scores into standardized behavior tags.

Example:

control high

↓

planning
predictability
responsibility_standard

---

# Layer 3

Behavior Tags

Purpose:

Create a lightweight behavioral profile.

Example:

```json
{
  "planning": "high",
  "independence": "high",
  "growth_drive": "high",
  "conflict_avoidance": "low"
}
```

---

# Layer 4

Relationship Rules Engine

Reference:

relationship/03_Relationship_Behavior_Rules.md

Purpose:

Identify:

* strengths
* friction
* communication patterns
* misunderstandings
* growth opportunities

Example:

planning

vs

spontaneity

↓

schedule_conflict

---

# Layer 5

Relationship Insights

Generated Output:

* strengths
* challenges
* communication style
* growth opportunities

This layer is structured data only.

No user-facing text.

---

# Layer 6

LLM Narrative Layer

Purpose:

Convert relationship insights into natural language.

The LLM should explain:

* observable behavior
* emotional reactions
* common misunderstandings
* practical advice

Avoid:

* personality labels
* deterministic predictions

---

# Layer 7

Report Layer

Reference:

04_Lite_Report_Framework.md

05_Premium_Report_Framework.md

Purpose:

Present relationship insights to users.

---

# Premium Extensions

Future Premium Layers:

* Saju Compatibility
* Current Self vs Innate Self
* Long-Term Relationship Dynamics
* Team Compatibility
* Business Compatibility

Premium analysis should NOT replace the behavior engine.

Premium analysis should enhance the behavior engine.

---

# Design Principles

1. Behavior First

Use behavior patterns rather than personality labels.

2. Lightweight Engine

Avoid large rule matrices.

Use behavior tags.

3. Reusable Architecture

The same behavior framework should be usable for:

* Relationship Analysis
* Decision Coaching
* Personal Reports
* AI Coaching

4. LLM as Interpreter

The LLM should explain.

The engine should decide.

```
```
