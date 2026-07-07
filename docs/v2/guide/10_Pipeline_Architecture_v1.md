# 10_Pipeline_Architecture_v1

## Purpose

Ah, It's Me **v1 분석 파이프라인 아키텍처** 정본.

* 왜 파일이 이렇게 나뉘는지 (책임 분리)
* 데이터·Prompt가 어떤 순서로 흐르는지
* 수정할 때 **어느 파일만** 보면 되는지

> **원칙:** 중복이 없는가? 보다 **책임이 하나인가?** (Single Responsibility)

**버전:** v1 (2026-06-25 확정)  
**변경 시:** `docs/dev/decisions/`에 이유 1페이지 남기고 이 문서 갱신.

---

# SSOT — Single Source of Truth (필수)

> 느려짐 · 로직 꼬임 · 중복 계산 방지. **새 파일 늘리기 전에 이 표부터.**

## 계산은 한 번

```text
입력 (설문 / 사주 JSON)
    → runtime/lib/analysis-context.js   ← 모든 계산 1회
    → samples/analysis_bundle.json      ← 캐시 (입력 파일 안 바뀌면 재계산 X)
    → LLM 단계는 bundle.layers 만 읽음
```

| Layer | 규칙 정본 (docs) | 코드 (runtime/lib) | LLM 프롬프트 |
|-------|------------------|-------------------|--------------|
| Current Self 6축 | survey/03_Scoring | survey-scorer.js | 01 + current-self-lite-*.txt |
| Innate 6축 | saju/04_Mapping | saju-framework-mapper.js | 02 + innate-self-lite-*.txt |
| GapProfile | analysis/01_Gap | gap-analyzer.js | 03A gap-analysis-*.txt |
| Chart digest (03B) | saju/07 (신호) | saju-framework-mapper.js | 03B deep-pattern-*.txt |
| Deep narrative | saju/08 (참조) | — | 03C |
| Deep report | saju/09 | — | 03D |

**실행 정본:** `npm run pipeline` → `run-pipeline.mjs`  
**개별 스크립트** (`gap`, `deep-self`)도 `analysis-context.js` 경유 — Gap·digest 재계산 없음.

## 문서 vs 코드 vs 프롬프트

| 종류 | 정본 | 비고 |
|------|------|------|
| 규칙·철학 | `docs/**` | 사람이 읽고 수정 |
| 계산 | `runtime/lib/*.js` | docs 규칙의 **유일한** 구현 (중복 구현 금지) |
| LLM 지시문 | `runtime/prompts/*.txt` | **실행 시 읽는 정본** |
| Prompt 설계서 | `docs/prompt/*.md` | 설명용 — txt와 어긋나면 **txt 우선** 후 md 동기화 |
| 설문 점수표 | `runtime/data/survey-scoring-map.json` | 03_Scoring의 기계 readable 버전 (한 곳만) |

## 지금 안 보는 폴더 (나중)

`docs/archive/legacy/*`, `docs/relationship/*` — 참고·미사용. 파이프라인 **연결 없음**.

`docs/PRD/00`–`03` — **제품** 정본 (범위·로드맵·스택). 파이프라인 **구현** SSOT는 이 문서 + `docs/survey|saju|analysis|prompt`.

## 금지

* 같은 6축/Gap을 스크립트마다 다시 계산
* docs와 lib 규칙 불일치 방치
* 프롬프트 조각 파일 무한 추가 (`_*` 헌법 파일 금지 — 규칙은 00 + 각 `*-system.txt` 상단)
* LLM이 사주·설문 재계산 (프롬프트에 명시 금지)

---

## 문서 역할 분담 (AI·개발자 참조 순서)

| 순서 | 문서 | 책임 |
|------|------|------|
| 1 | [01_Core_User_Flow.md](01_Core_User_Flow.md) | UX Step — 사용자가 무엇을 하는지 |
| 2 | **이 문서 (10)** | 파이프라인·Prompt 체인·수정 가이드 |
| 3 | [08_Master_Logic_Map.md](08_Master_Logic_Map.md) | 파일별 존재·상태(✅🟡⬜) 트래킹 |
| 4 | [docs/dev/00_Status.md](../dev/00_Status.md) | 지금 하는 일 (NOW/NEXT) |

---

# Prompt 책임 분리 (v1)

| 파일 | 책임 | 중복 |
|------|------|------|
| [00_Prompt_Architecture.md](../prompt/00_Prompt_Architecture.md) | 공통 철학·헌법 | — |
| [01_Current_Self_Lite_Prompt.md](../prompt/01_Current_Self_Lite_Prompt.md) | 현재의 나 Lite 해석 | — |
| [02_Innate_Self_Lite_Prompt.md](../prompt/02_Innate_Self_Lite_Prompt.md) | 본래의 나 Lite 해석 | — |
| [03A_Gap_Analysis_Prompt.md](../prompt/03A_Gap_Analysis_Prompt.md) | Current vs Innate Gap (유료) | ✅ |
| [03B_Deep_Pattern_Prompt.md](../prompt/03B_Deep_Pattern_Prompt.md) | Pattern 추출 | 🟡 초안 |
| [03C_Deep_Narrative_Prompt.md](../prompt/03C_Deep_Narrative_Prompt.md) | Narrative 확장 | 🟡 초안 |
| [03D_Deep_Report_Generation_Prompt.md](../prompt/03D_Deep_Report_Generation_Prompt.md) | Report 조립 | 🟡 초안 |
| [03E_UI_Rendering_Prompt.md](../prompt/03E_UI_Rendering_Prompt.md) | UI JSON 변환 | 🟡 초안 |

---

# 전체 시스템 구조

```text
                USER
                  │
                  ▼
      ┌──────────────────────┐
      │ Survey + Birth Data │
      └──────────────────────┘
                  │
     ┌────────────┴────────────┐
     ▼                         ▼
Survey Engine             Saju Engine
     │                         │
     ▼                         ▼
Current Self             Innate Self
     │                         │
     └────────────┬────────────┘
                  ▼
          Human Framework (6 Axes)
                  │
                  ▼
          Gap Analysis (03A)
```

---

# 사주 분석 파이프라인 (무료 Lite)

```text
Birth Data
      │
      ▼
01 Saju System          (🔄 Calendar Conversion 분리 검토)
      │
      ▼
02 Saju Input Schema    (🔄 Raw Data Schema 정리 검토)
      │
      ▼
03 Saju Calculation Rules
      │
      ▼
04 Saju Human Framework Mapping
      │
      ▼
05 Saju Output Schema
      │
      ▼
06 Saju Lite Interpretation Dictionary
      │
      ▼
02_Innate_Self_Lite_Prompt  (+ runtime)
      │
      ▼
Innate Self Lite Report JSON
```

**무료 6축:** NormalizedSaju 수준. 합·충·신살·Gap 해석 제외.

---

# 심화 분석 파이프라인 (유료 Deep)

```text
Extended NormalizedSaju + Deep signals
        │
        ├─ 07 Deep Interpretation Rules  (계산·신호 규칙)
        └─ 08 Self Analysis Signal Mapping  (사람 언어 매핑 규칙, 참조용)
        │
        ▼
03B Deep Pattern Prompt
        │
        ▼
deep_pattern JSON
        │
        ▼
03C Deep Narrative Prompt
        │
        ▼
deep_narrative JSON
        │
        ├─ 09 Deep Self Report Generation Rules  (리포트 구조·순서)
        ▼
03D Deep Report Generation Prompt
        │
        ▼
deep_self_report JSON
        │
        ├─ 10 Deep Self Report UI Patterns
        ▼
03E UI Rendering Prompt
        │
        ▼
deep_self_report_ui JSON → Frontend
```

**08 위치 주의:** `08`은 Runtime **중간 실행 단계**가 아니라 **03B·03C가 참조하는 규칙 문서**다.  
Pattern → Narrative 사이에 별도 LLM 단계를 두지 않는다.

---

# Survey 파이프라인 (무료 Lite)

```text
Survey Answers (Q1~Q9)
      │
      ▼
03 Survey Scoring Rules + 05 Survey Human Framework Mapping
      │
      ▼
04 Survey Output Schema  →  CurrentSelfProfile
      │
      ▼
06 Survey Lite Interpretation  (신호 압축 규칙)
      │
      ▼
01_Current_Self_Lite_Prompt  (+ runtime)
      │
      ▼
Current Self Lite Report JSON
```

---

# Prompt 체인 (실행 순서)

```text
00  공통 헌법 (모든 Prompt 참조)
 │
 ├─ 01  현재의 나 Lite      ← Survey Result
 ├─ 02  본래의 나 Lite      ← Innate Lite 입력
 ├─ 03A Gap                ← Current + Innate 6축
 │
 └─ Deep (유료)
      03B  Pattern Extraction
        → 03C  Narrative Expansion
          → 03D  Report Assembly
            → 03E  UI Rendering
```

---

# Prompt Input / Output (v1)

| Prompt | Input | Output |
|--------|-------|--------|
| 01 Current Self Lite | `CurrentSelfProfile` (Survey) | `current_self_lite` JSON |
| 02 Innate Self Lite | `innate_profile` + lite dictionary | `innate_self_lite` JSON |
| 03A Gap | `GapProfile` (+ optional personalization) | `gap_analysis` JSON |
| 03B Pattern | Extended Saju + Deep signals (07 출력) | `deep_pattern` JSON |
| 03C Narrative | `deep_pattern` | `deep_narrative` JSON |
| 03D Report | `deep_narrative` | `deep_self_report` JSON |
| 03E UI | `deep_self_report` | `deep_self_report_ui` JSON |

Schema 정본: [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md)  
**TODO (Phase D):** `deep_pattern`, `deep_narrative`, `deep_self_report`, `deep_self_report_ui` 객체를 05에 정의.  
`gap_profile`, `gap_analysis` — ✅ 정의 완료.

---

# 수정할 때 어디를 고치나?

| 바꾸고 싶은 것 | 수정 파일 | 끝 |
|----------------|-----------|-----|
| 사주 계산 | `docs/saju/03_Saju_Calculation_Rules.md` | ✓ |
| 6축 점수화 (사주) | `docs/saju/04_Saju_Human_Framework_Mapping.md` | ✓ |
| 6축 점수화 (설문) | `docs/survey/03_Survey_Scoring_Rules.md` | ✓ |
| Lite 문장 사전 (사주) | `docs/saju/06_Saju_Lite_Interpretation_Dictionary.md` | ✓ |
| Lite 해석 (설문) | `docs/survey/06_Survey_Lite_Interpretation.md` | ✓ |
| Prompt 철학·톤 공통 | `docs/prompt/00_Prompt_Architecture.md` | ✓ |
| Gap 로직 | `docs/analysis/01_Gap_Analysis_Rules.md` | ✅ |
| Gap 문장 | `docs/prompt/03A_Gap_Analysis_Prompt.md` | ✅ |
| Pattern 추출 | `docs/prompt/03B_Deep_Pattern_Prompt.md` | ✓ |
| Narrative 톤·확장 | `docs/prompt/03C_Deep_Narrative_Prompt.md` | ✓ |
| 리포트 **섹션 순서·구조** | `docs/saju/09_Deep_Self_Report_Generation_Rules.md` | ✓ |
| 리포트 **문장·연결** | `docs/prompt/03D_Deep_Report_Generation_Prompt.md` | ✓ |
| UI 레이아웃·카드 규칙 | `docs/saju/10_Deep_Self_Report_UI_Patterns.md` | ✓ |
| UI 문장·블록 변환 | `docs/prompt/03E_UI_Rendering_Prompt.md` | ✓ |
| 6축 차트 표시 | `docs/guide/09_Visualization_Guide.md` | ✓ |
| 출력 JSON 구조 | `docs/saju/05_Saju_Output_Schema.md` | ✓ |

**다른 파일을 건드릴 필요 없어야 한다** — 그게 v1 설계 의도.

---

# 왜 이 구조인가

* **계산은 코드·규칙 문서**, **해석은 LLM Prompt** — PROJECT_RULES와 일치
* 문체 변경 → 03C만, 카드 UI 변경 → 03E만
* 관계 분석·결정일기도 동일 Prompt 체인 패턴 재사용 가능

---

# v1 확정 범위 / 아직 아닌 것

| 항목 | 상태 |
|------|------|
| Prompt 00~02 Runtime 테스트 | ✅ |
| Prompt 03A Gap | ✅ 문서·Runtime prompt (LLM 테스트 대기) |
| Prompt 03B~03E 초안 | 🟡 Schema·Runtime 미연결 |
| 05 Schema deep_* 객체 | ⬜ 다음 Schema 작업 |
| 사주 실제 계산 엔진 코드 | ⬜ |
| 웹 UI 연동 | ⬜ |

---

# 갱신 규칙

1. 파이프라인 **구조**가 바뀌면 → 이 문서 + `decisions/NNN_*.md`
2. 파일 **추가·완료**만 → `08_Master_Logic_Map.md` 상태 갱신
3. **오늘 뭘 할지** → `00_Status.md`만

---

## Related

* [002_prompt_pipeline_v1.md](../dev/decisions/002_prompt_pipeline_v1.md) — v1 확정 결정 기록
* [07_Analysis_Engine_Map.md](07_Analysis_Engine_Map.md) — 엔진 요약
* [PROJECT_RULES.md](../../PROJECT_RULES.md)
