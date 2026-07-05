# 02_System_Architecture.md

## Purpose

Define all major systems of Ahaitsme.

This document describes how data flows through the platform and how each intelligence layer interacts.

---

# Core Architecture Philosophy

Ahaitsme is not a Saju platform.

Ahaitsme is a Self Understanding Platform.

Saju is one input source.

The ultimate goal is:

```text
Birth Data

↓

Meaning

↓

Patterns

↓

Self Understanding

↓

Better Decisions

↓

Personal Growth
```

Therefore every system should move closer to human understanding rather than metaphysical explanation.

---

# Core Data Flow

User Input

↓

Survey Engine

↓

Current Self Profile

↓

Human Framework

↓

Current Self

---

Birth Data

↓

Saju Engine

↓

Extended NormalizedSaju

↓

Innate Self Profile

↓

Human Framework

↓

Innate Self

---

Current Self

*

Innate Self

↓

Gap Engine

↓

Gap Analysis

↓

Self Understanding

---

# Current Self Engine

Purpose:

Understand who the user is today.

Inputs:

* Survey Responses
* Behavioral Questions
* Reflection Data

Outputs:

* CurrentSelfProfile
* Human Framework Scores

---

# Innate Self Engine

Purpose:

Understand natural tendencies and innate behavioral patterns.

Inputs:

* Birth Data

Outputs:

* Raw Saju
* Extended NormalizedSaju
* InnateSelfProfile

---

# Human Meaning Engine

Purpose:

Translate symbolic signals into human experiences.

Inputs:

* Extended NormalizedSaju
* InnateSelfProfile

Outputs:

* Identity
* Core Needs
* Core Fears
* Core Wounds
* Behavioral Patterns
* Repeating Life Patterns
* Shadow Patterns
* Common Triggers
* Emotional Themes
* Growth Directions

Defined By:

```text
08_Self_Analysis_Signal_Mapping.md
```

---

# Life Pattern Engine

Purpose:

Transform human signals into meaningful life narratives.

Inputs:

* Deep Interpretation Results
* Human Meaning Profile
* Current Self Profile

Outputs:

* Deep Self Report Content
* Relationship Narratives
* Decision Narratives
* Growth Narratives

Defined By:

```text
09_Deep_Self_Report_Generation_Rules.md
```

---

# Presentation Engine

Purpose:

Transform report content into user-facing experiences.

Inputs:

* Deep Self Report Content

Outputs:

* Cards
* Dashboards
* Rankings
* Loops
* Comparisons
* Visual Reports

Defined By:

```text
10_Deep_Self_Report_UI_Patterns.md
```

---

# Saju Engine Architecture

Birth Data

↓

Birth Time Normalization

↓

Four Pillars Calculation

↓

Extended NormalizedSaju

---

Extended NormalizedSaju Stores

* Four Pillars
* Hidden Stems
* Five Elements
* Ten Gods
* Seasonal Influence
* Stem Relations
* Branch Relations
* Growth Stages
* Special Stars
* Internal Dynamics

---

This layer contains:

Calculation only.

No interpretation.

No narrative.

No user-facing language.

Defined By:

```text
03_Saju_Calculation_Rules.md
```

---

# Fast Analysis Pipeline

Purpose:

Provide free-level insight.

Flow:

```text
Extended NormalizedSaju

↓

04_Saju_Fast_Human_Framework_Mapping

↓

InnateSelfProfile

↓

06_Saju_Lite_Interpretation_Dictionary

↓

Fast Analysis Result
```

Outputs:

* Six Axis Radar
* Day Master Summary
* Day Branch Relationship Style
* Innate Self Preview

---

# Deep Analysis Pipeline

Purpose:

Generate premium self-understanding reports.

Flow:

```text
Extended NormalizedSaju

↓

07_Saju_Deep_Interpretation_Rules

↓

08_Self_Analysis_Signal_Mapping

↓

HumanMeaningProfile

↓

09_Deep_Self_Report_Generation_Rules

↓

Deep Self Report Content

↓

10_Deep_Self_Report_UI_Patterns

↓

Final Deep Self Report
```

---

# Gap Analysis Pipeline

Purpose:

Compare Current Self and Innate Self.

Flow:

```text
CurrentSelfProfile

+

InnateSelfProfile

↓

Gap Engine

↓

Alignment

↓

Misalignment

↓

Adaptation Patterns

↓

Growth Opportunities
```

Outputs:

* Gap Analysis
* Adaptation Analysis
* Alignment Analysis
* Growth Recommendations

---

# Phase 1

Self Understanding

Components:

* Survey Engine
* Saju Engine
* Human Meaning Engine
* Gap Engine
* Life Pattern Engine

Outputs:

* Current Self
* Innate Self
* Gap Analysis
* Deep Self Analysis

---

# Phase 2

Decision Intelligence

Flow:

```text
Gap Analysis

↓

Decision Journal

↓

Decision Reflection

↓

Decision Pattern Learning

↓

Decision Intelligence
```

Outputs:

* Decision Style
* Decision Delays
* Regret Patterns
* Decision Growth Insights

---

# Phase 3

Relationship Intelligence

Inputs:

* User A Profile
* User B Profile

↓

Relationship Engine

↓

Compatibility Signals

↓

Relationship Meaning Engine

↓

Relationship Report

Outputs:

* Attraction Patterns
* Conflict Patterns
* Communication Patterns
* Repair Patterns
* Long-Term Compatibility

---

# Phase 4

Personal Intelligence Engine

Purpose:

Continuously learn from the user.

Inputs:

* Decision Patterns
* Relationship Patterns
* Reflection Data
* Behavioral Data

Outputs:

* Personalized Insights
* Growth Recommendations
* Adaptive Coaching

↓

Personal Intelligence

---

# Core Architecture Rule

Every major system should translate results into human meaning before presenting them to users.

The user should never need to understand:

* Saju
* Ten Gods
* Five Elements
* Combinations
* Clashes

The user should understand:

* Identity
* Emotions
* Behaviors
* Patterns
* Growth

---

# Universal Translation Layer

Human Framework remains the universal comparison layer across:

* Survey
* Saju
* Gap Analysis
* Relationship Analysis
* Decision Intelligence

All future systems should integrate through the Human Framework whenever possible.
