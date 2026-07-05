# 04_Project_Structure.md

# Project Structure

Version: MVP v1

---

# Purpose

Define the folder structure, responsibilities, and dependencies of the Ah, It's Me project.

Each folder has a single responsibility.

Every file should belong to only one layer of the architecture.

---

# Project Overview

```text
docs/
├── PRD/
├── guide/
├── survey/
├── analysis/
├── saju/
└── prompts/

app/
components/
lib/
types/
public/
```

---

# Documentation Layer

## PRD/

Purpose

Product definition.

Defines:

* Product
* User Flows
* AI Architecture
* Technology Stack
* Folder Structure
* Development Roadmap

Does NOT contain implementation details.

---

## guide/

Purpose

Global product rules.

Defines:

* Product Vision
* System Architecture
* Visualization Rules

Referenced by every module.

---

# Analysis Layer

## survey/

Purpose

Current Self Engine.

Contains:

* Questions
* Scoring
* Human Framework Mapping
* Lite Interpretation

Output

Current Self

---

## saju/

Purpose

Innate Self Engine.

Contains:

* Calendar Conversion
* Saju Calculation
* Human Mapping
* Output Schema
* Deep Interpretation
* Report Rules
* UI Rules

Output

Innate Self

Deep Signals

Reports

---

## analysis/

Purpose

Compare Current Self and Innate Self.

Contains:

Gap Analysis.

Output

Gap Result.

---

# Prompt Layer

## prompts/

Purpose

Runtime AI execution.

Prompts never calculate.

Prompts only translate.

Prompt Pipeline

```text
Current Self
      │
      ▼
01_Current_Self_Lite

Innate Self
      │
      ▼
02_Innate_Self_Lite

Gap
      │
      ▼
03A_Gap

Deep Signals
      │
      ▼
03B_Pattern

Pattern
      │
      ▼
03C_Narrative

Narrative
      │
      ▼
03D_Report

Report
      │
      ▼
03E_UI
```

---

# Frontend Layer

## app/

Application routes.

Pages.

API routes.

---

## components/

Reusable UI components.

Examples

* Cards
* Charts
* Buttons
* Reports
* Dashboard

---

## lib/

Shared utilities.

Examples

* API clients
* AI helpers
* Authentication
* Database helpers

---

## types/

Shared TypeScript types.

Generated interfaces.

Shared schemas.

---

## public/

Images.

Icons.

Static assets.

---

# Runtime Dependency

```text
guide/
        │
        ▼
survey/
        │
        ▼
analysis/
        ▲
        │
saju/
        │
        ▼
prompts/
        │
        ▼
frontend
```

---

# Layer Responsibilities

| Layer    | Responsibility           |
| -------- | ------------------------ |
| PRD      | Product definition       |
| guide    | Global rules             |
| survey   | Current Self calculation |
| saju     | Innate Self calculation  |
| analysis | Gap analysis             |
| prompts  | AI runtime translation   |
| frontend | User interface           |

---

# Dependency Rules

Allowed

guide

↓

survey

↓

analysis

↓

prompts

↓

frontend

---

Not Allowed

frontend

→ survey

frontend

→ saju calculation

prompts

→ calculate Saju

prompts

→ calculate Survey

Prompt Layer should only consume pre-calculated data.

---

# Single Source of Truth

| Topic         | Source   |
| ------------- | -------- |
| Product       | PRD      |
| Product Rules | guide    |
| Survey Logic  | survey   |
| Saju Logic    | saju     |
| Gap Logic     | analysis |
| AI Runtime    | prompts  |
| UI            | frontend |

Only one source should own each responsibility.

Avoid duplicated logic across folders.

---

# Design Principles

Every folder has one responsibility.

Every prompt has one responsibility.

Every engine has one responsibility.

Every calculation happens before prompting.

Every report is generated from structured data.

Keep the architecture modular, replaceable, and easy to extend.
