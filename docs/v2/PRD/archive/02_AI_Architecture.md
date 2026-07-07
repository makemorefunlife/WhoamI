# 02_AI_Architecture.md

# AI Architecture

Version: MVP v1

---

# Purpose

Define how AI engines cooperate to transform user data into self-understanding and decision support.

This document defines the logical AI pipeline.

Implementation details belong to:

* survey/
* analysis/
* saju/
* prompts/

---

# High-Level Architecture

```text
                  USER
                    │
      ┌─────────────┴─────────────┐
      ▼                           ▼
 Survey Data                 Birth Data
      │                           │
      ▼                           ▼
 Survey Engine              Saju Engine
      │                           │
      ▼                           ▼
 Current Self              Innate Self
      └─────────────┬─────────────┘
                    ▼
               Gap Engine
                    ▼
            Deep Pattern Engine
                    ▼
           Narrative Engine
                    ▼
             Report Engine
                    ▼
               UI Engine
                    ▼
                  USER
```

---

# AI Engine Responsibilities

## Survey Engine

Purpose

Measure the user's current behavioral tendencies.

Input

Survey Responses

Output

Current Self

Reference

survey/

---

## Saju Engine

Purpose

Calculate innate tendencies from birth information.

Input

Birth Date

Birth Time

Birth Location

Output

Innate Self

Reference

saju/

---

## Gap Engine

Purpose

Compare Current Self and Innate Self.

Output

Gap Analysis

Reference

analysis/

---

## Pattern Engine

Purpose

Extract recurring human patterns from calculated signals.

Output

Pattern JSON

Reference

prompts/03B_Deep_Pattern_Prompt.md

---

## Narrative Engine

Purpose

Translate patterns into natural human narratives.

Output

Narrative JSON

Reference

prompts/03C_Deep_Narrative_Prompt.md

---

## Report Engine

Purpose

Assemble narratives into structured reports.

Output

Deep Self Report

Reference

prompts/03D_Deep_Report_Generation_Prompt.md

---

## UI Engine

Purpose

Convert reports into UI-ready content.

Output

Cards

Sections

Highlights

Dashboard Components

Reference

prompts/03E_UI_Rendering_Prompt.md

---

# Runtime Pipeline

## Free Analysis

```text
Survey
      │
      ▼
Current Self
      │
Birth Data
      │
      ▼
Innate Self
      │
      ▼
Gap Preview
      │
      ▼
Free Result
```

---

## Premium Analysis

```text
Current Self
        │
Innate Self
        │
Gap
        │
Deep Signals
        │
Pattern
        │
Narrative
        │
Deep Report
        │
UI
        │
Premium Result
```

---

## Decision Intelligence

```text
User Decision
       │
Reflection
       │
Decision Journal
       │
Pattern Learning
       │
Personal Decision Database
       │
AI Coaching
```

---

# Prompt Pipeline

```text
Survey
        │
        ▼
01_Current_Self_Lite_Prompt

Birth
        │
        ▼
02_Innate_Self_Lite_Prompt

Current + Innate
        │
        ▼
03A_Gap_Analysis_Prompt

Deep Signals
        │
        ▼
03B_Deep_Pattern_Prompt

Pattern
        │
        ▼
03C_Deep_Narrative_Prompt

Narrative
        │
        ▼
03D_Deep_Report_Generation_Prompt

Report
        │
        ▼
03E_UI_Rendering_Prompt
```

---

# Architecture Principles

Every engine has one responsibility.

Every prompt performs one task.

All calculations occur before prompting.

Prompts never calculate Saju.

Prompts only translate pre-calculated data.

Every layer should be independently replaceable.

---

# Source of Truth

| Responsibility   | Source    |
| ---------------- | --------- |
| Product Logic    | PRD       |
| Survey Logic     | survey/   |
| Saju Calculation | saju/     |
| Gap Analysis     | analysis/ |
| Prompt Runtime   | prompts/  |
| UI Components    | frontend  |

---

# Future Expansion

The architecture is designed to support additional AI engines without changing the core pipeline.

Future engines may include:

* Relationship Engine
* Decision Engine
* Career Engine
* Team Compatibility Engine
* Organization Analysis Engine
* Coaching Engine

All future engines should follow the same architecture:

Measure

↓

Pattern

↓

Narrative

↓

Report

↓

UI
