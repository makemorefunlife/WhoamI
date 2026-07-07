# 01_AI_Architecture.md

# AI Architecture & Project Structure

Version: MVP v1

---

## Purpose

How AI engines, documentation folders, and runtime code connect.  
Implementation rules live in `docs/guide/`, `docs/survey/`, `docs/saju/`, `docs/analysis/`, `docs/prompt/`, and `runtime/`.

---

## High-Level AI Architecture

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

## AI Engine Responsibilities

| Engine | Input | Output | Rules doc |
|--------|-------|--------|-----------|
| Survey | Answers | Current Self profile | `docs/survey/` |
| Saju | Birth spacetime | Innate Self, Extended Saju | `docs/saju/` |
| Gap | Current + Innate axes | GapProfile | `docs/analysis/01_Gap_Analysis_Rules.md` |
| Pattern | Chart signals digest | `deep_pattern` | `docs/prompt/03B_*` |
| Narrative | deep_pattern | `deep_narrative` | `docs/prompt/03C_*` |
| Report | deep_narrative | `deep_self_report` | `docs/prompt/03D_*` |
| UI | deep_self_report | UI JSON | `docs/prompt/03E_*` |

Prompts **never** recalculate survey or saju. They translate pre-computed data only.

---

## Runtime Pipeline (dev)

**Hub:** `runtime/lib/analysis-context.js` — computes each layer once, caches `samples/analysis_bundle.json`.

```text
survey_answers.json + innate_profile.json
        │
        ▼
analysis-context (survey-scorer, gap-analyzer, saju-framework-mapper)
        │
        ├─► current_self_profile, gap_profile, chart_signal_summary
        └─► optional LLM: 03A → 03B → 03C → 03D
```

Entry: `npm run pipeline` — see `runtime/README.md`.  
Full chain: [10_Pipeline_Architecture_v1.md](../guide/10_Pipeline_Architecture_v1.md).

### Free path

```text
Survey → Current Self → Birth → Innate Self → Gap preview (rules only)
```

### Premium path

```text
GapProfile + deep signals → Pattern → Narrative → Report → UI
```

### Decision intelligence (future)

```text
Decision → Reflection → Journal → Pattern learning → Coaching
```

---

## Prompt Pipeline

```text
00 Prompt Architecture (constitution)
 │
 ├─ 01 Current Self Lite
 ├─ 02 Innate Self Lite
 ├─ 03A Gap (paid)
 └─ 03B → 03C → 03D → 03E (deep)
```

| Step | Design doc | Execution |
|------|------------|-----------|
| 01 | `docs/prompt/01_*` | `runtime/prompts/current-self-lite-*.txt` |
| 02 | `docs/prompt/02_*` | `runtime/prompts/innate-self-lite-*.txt` |
| 03A | `docs/prompt/03A_*` | `runtime/prompts/gap-analysis-*.txt` |
| 03B–E | `docs/prompt/03B–03E_*` | `runtime/prompts/deep-*-*.txt` |

---

## Project Structure

```text
docs/
├── PRD/              Product (this folder)
├── guide/            UX, pipeline, visualization
├── framework/        Human Framework, comparison
├── survey/           Current Self rules
├── saju/             Innate Self rules
├── analysis/         Gap rules
├── prompt/           Prompt design
├── relationship/     Phase 2 (planned)
├── dev/              Status, decisions, logs
└── archive/          Retired docs

runtime/              Dev lab: lib + prompts + run scripts
samples/              Test JSON + analysis_bundle cache

app/                  (future) Next.js routes
components/           (future) UI
```

---

## Folder Responsibilities

| Folder | Responsibility | Must not |
|--------|----------------|----------|
| `docs/PRD` | Product what/why/roadmap | Implementation detail |
| `docs/guide` | Cross-cutting architecture & UX | Per-engine scoring rules |
| `docs/survey` | Survey → Current Self | Saju math |
| `docs/saju` | Saju → Innate / deep signals | Survey scoring |
| `docs/analysis` | Gap rules | LLM prose |
| `docs/prompt` | Prompt contracts | Runtime execution text (duplicate ok as spec) |
| `runtime/lib` | Deterministic engines | LLM calls (except `llm.js`) |
| `runtime/prompts` | LLM system/user **execution** copies | Business rules |

---

## Dependency Rules

**Allowed**

```text
guide → survey / saju / analysis → runtime/lib → runtime/prompts → (future) app
```

**Not allowed**

- Frontend → direct survey/saju calculation
- Prompts → recalculate axes, gap, or birth chart
- Duplicate scoring logic outside `runtime/lib` + documented rules

---

## Single Source of Truth

| Topic | Owner |
|-------|--------|
| Product scope | `docs/PRD/` |
| Pipeline order & SSOT | `docs/guide/10_Pipeline_Architecture_v1.md` |
| Survey scoring | `docs/survey/03_Survey_Scoring_Rules.md` + `runtime/data/survey-scoring-map.json` |
| Saju calculation | `docs/saju/03_*` (engine TBD) |
| Human Framework mapping | `docs/saju/04_*`, `docs/survey/05_*` |
| Gap classification | `docs/analysis/01_*` + `runtime/lib/gap-analyzer.js` |
| Prompt philosophy | `docs/prompt/00_*` |
| Prompt **runtime** text | `runtime/prompts/*.txt` |
| Sample paths | `runtime/lib/env.js` → `sampleFiles` |
| Living todo | `docs/dev/00_Status.md` |

One owner per topic. No parallel implementations.

---

## Architecture Principles

1. One responsibility per engine, prompt, and lib module.
2. Calculate first, interpret second (LLM last).
3. Modules replaceable without breaking birth data storage.
4. Evidence-based, non-absolute user-facing language.

---

## Future AI Engine Expansion

Same pattern for new capabilities:

```text
Measure → Pattern → Narrative → Report → UI
```

Planned engines: Relationship · Decision · Career · Team · Organization · Coaching.

Add new **rules doc + lib + prompt txt** — do not fork pipeline philosophy.
