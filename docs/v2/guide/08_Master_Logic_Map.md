# 08_Master_Logic_Map

## Purpose

Ah, It's Me **전체 분석 로직·파일·유저 플로우**를 한 장에서 추적한다.

* 어떤 메뉴에 어떤 문서가 필요한지
* 파일이 이미 있는지 / 만들어야 하는지
* 유저가 어느 Step에서 무엇을 보는지

**이 문서가 파일별 상태 트래커다.**  
파이프라인·책임 분리·수정 가이드 → **[10_Pipeline_Architecture_v1.md](10_Pipeline_Architecture_v1.md)**  
엔진 요약 → [07_Analysis_Engine_Map.md](07_Analysis_Engine_Map.md)

---

## 상태 범례

| 표시 | 의미 |
|------|------|
| ✅ | 파일 있음, 계획과 대체로 일치 |
| 🟡 | 파일 있음, 정리·Runtime 검증 필요 |
| 🔄 | 파일 있으나 이름·역할 정리 필요 |
| ⬜ | 미작성 |

**경로 규칙:** 계획서의 `prompts/` → 실제 repo는 `docs/prompt/`

---

## 유저 플로우 ↔ 로직 연결

기준: [01_Core_User_Flow.md](01_Core_User_Flow.md)

| UX Step | 사용자 경험 | 데이터 레이어 | 주요 로직 Phase |
|---------|------------|--------------|----------------|
| 1 | 랜딩 | — | — |
| 2 | 설문 | Survey Answers | Phase B |
| 3 | 설문 완료 (결과 잠금) | Current Self (미공개) | Phase B |
| 4 | 가입 | User Account | — |
| 5 | Current Self 결과 | CurrentSelfProfile | Phase B |
| 6 | Innate Self 초대 | — | Phase A |
| 7 | 생년월일시 입력 | Birth Data | Phase A |
| 8 | Innate Self (Fast) | NormalizedSaju → InnateSelfProfile | Phase A |
| 9 | 무료 Gap 프리뷰 | 6축 점수 비교 (해석 최소) | Phase C |
| Paid | 통합 리포트·심화 | Extended NormalizedSaju + Gap + Signals | Phase D·E |
| Paid+ | 관계 분석 | 두 사람 Profile | Phase F |

---

## 데이터 생성 흐름 (가입 시 1회)

```text
생년월일시 + 장소 입력
        ↓
만세력 계산
        ↓
Raw Saju 생성
        ↓
NormalizedSaju 생성
        ↓
Extended NormalizedSaju 생성
        ↓
DB 저장
```

이후 무료·유료·관계 분석은 **DB 저장 데이터 재사용** (재계산 X).

---

## NormalizedSaju vs Extended NormalizedSaju

### NormalizedSaju — 무료 6축·Lite 분석

포함:

* day_master, pillars, hidden_stems
* five_elements, ten_gods_count
* season, basic_relations

사용처:

* Fast Saju Analysis (Lite)
* 무료 6축 그래프
* 일간·일지 설명, 한 줄 요약

Schema 정본: [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md)

### Extended NormalizedSaju — 심화·관계·Gap

포함:

* stem_relations, branch_relations
* growth_stages, special_stars
* internal_conflict_signals, relationship_need_signals
* attraction_pattern_signals, decision_pattern_signals
* energy_leak_signals

사용처:

* Deep Self Analysis
* Deep Relationship Analysis
* Gap Analysis (심화)
* 관계 동역학·갈등·회복 패턴

### 무료 6축에서 쓰는 것 / 제외하는 것

**사용:** 8글자, 지장간, 십성·오행 분포, 계절 보정, 일간, 일지

**제외:** 천간합·육합·삼합·충·형·파·해·원진, 12운성, 신살, 끌림·관계욕구·에너지누수·의사결정 패턴, Gap 해석

### 심화 분석에서 추가로 쓰는 것

8글자 전체 구조, 월·시 주, 합·충·형·파·해·원진, 12운성, 일부 신살, 관계·끌림·의사결정·에너지누수 신호, Current vs Innate Gap, 성장 방향

---

# Phase A — Lite Saju 기반 ✅ 완료

**목표:** Innate Self Lite Prompt가 Runtime에서 통과한다.

| 메뉴 / 로직 | 파일 (실제 경로) | 상태 |
|-------------|-----------------|------|
| Prompt 공통 헌법 | [docs/prompt/00_Prompt_Architecture.md](../prompt/00_Prompt_Architecture.md) | ✅ |
| 만세력·사주 시스템 | [docs/saju/01_Saju_System.md](../saju/01_Saju_System.md) | 🔄 |
| Raw / Input Schema | [docs/saju/02_Saju_Input_Schema.md](../saju/02_Saju_Input_Schema.md) | 🔄 |
| 8글자·십성·오행 계산 | [docs/saju/03_Saju_Calculation_Rules.md](../saju/03_Saju_Calculation_Rules.md) | ✅ |
| Human Framework 6축 매핑 | [docs/saju/04_Saju_Human_Framework_Mapping.md](../saju/04_Saju_Human_Framework_Mapping.md) | ✅ |
| 계산 결과 Schema | [docs/saju/05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md) | ✅ |
| Lite 해석 사전 | [docs/saju/06_Saju_Lite_Interpretation_Dictionary.md](../saju/06_Saju_Lite_Interpretation_Dictionary.md) | ✅ |
| Innate Self Lite Prompt | [docs/prompt/02_Innate_Self_Lite_Prompt.md](../prompt/02_Innate_Self_Lite_Prompt.md) | ✅ |
| 샘플 Lite 입력 JSON | [samples/innate_profile_lite_input.json](../../samples/innate_profile_lite_input.json) | ✅ |
| Lite Runtime | [runtime/run-innate-lite.mjs](../../runtime/run-innate-lite.mjs) | ✅ |
| LLM 테스트 출력 | [samples/outputs/innate_self_lite_result.json](../../samples/outputs/innate_self_lite_result.json) | ✅ |

**UX:** Step 6~8

---

# Phase B — 무료 개인 분석 MVP ✅ 완료

**목표:** 설문 → Current Self 6축 → 무료 Lite 해석까지 연결.

| 메뉴 / 로직 | 파일 (실제 경로) | 상태 |
|-------------|-----------------|------|
| 설문 문항 | [docs/survey/02_Survey_Questions.md](../survey/02_Survey_Questions.md) | ✅ |
| 설문 시스템 개요 | [docs/survey/01_Survey_System.md](../survey/01_Survey_System.md) | ✅ |
| 설문 점수화 | [docs/survey/03_Survey_Scoring_Rules.md](../survey/03_Survey_Scoring_Rules.md) | ✅ |
| Survey → 6축 매핑 | [docs/survey/05_Survey_Human_Framework_Mapping.md](../survey/05_Survey_Human_Framework_Mapping.md) | ✅ |
| 설문 출력 Schema | [docs/survey/04_Survey_Output_Schema.md](../survey/04_Survey_Output_Schema.md) | ✅ |
| 6축 그래프 시각화 | [docs/guide/09_Visualization_Guide.md](09_Visualization_Guide.md) | ✅ |
| Survey Lite 해석 | [docs/survey/06_Survey_Lite_Interpretation.md](../survey/06_Survey_Lite_Interpretation.md) | ✅ |
| Current Self Lite Prompt | [docs/prompt/01_Current_Self_Lite_Prompt.md](../prompt/01_Current_Self_Lite_Prompt.md) | ✅ |
| Survey E2E Runtime | [runtime/run-survey-e2e.mjs](../../runtime/run-survey-e2e.mjs) | ✅ |
| 샘플 프로필 / LLM 출력 | `samples/current_self_profile.json`, `samples/analysis_bundle.json` | ✅ |

**UX:** Step 2~5

---

# Phase C — Gap ✅

**목표:** 설문 6축 vs 사주 6축 차이. Step 9 무료 프리뷰는 점수 위주, 해석은 규칙·Prompt로 분리.

| 메뉴 / 로직 | 파일 (실제 경로) | 상태 |
|-------------|-----------------|------|
| Gap 분석 규칙 | [docs/analysis/01_Gap_Analysis_Rules.md](../analysis/01_Gap_Analysis_Rules.md) | ✅ |
| Gap 분석 Prompt | [docs/prompt/03A_Gap_Analysis_Prompt.md](../prompt/03A_Gap_Analysis_Prompt.md) | ✅ |
| Gap Runtime | [runtime/lib/gap-analyzer.js](../../runtime/lib/gap-analyzer.js) | ✅ |
| 계산 허브 | [runtime/lib/analysis-context.js](../../runtime/lib/analysis-context.js) | ✅ |
| 샘플 경로 정본 | `runtime/lib/env.js` → `sampleFiles` | ✅ |

**UX:** Step 9 (Current vs Innate 레이더·축 점수 비교)

---

# Phase D — 심화 사주 (Deep Self)

**목표:** Pattern → Narrative → Report. 상세 파이프라인 → [10 § 심화](10_Pipeline_Architecture_v1.md#심화-분석-파이프라인-유료-deep)

| 메뉴 / 로직 | 파일 (실제 경로) | 상태 |
|-------------|-----------------|------|
| 심화 계산 (합·충·신살 등) | [docs/saju/03_Saju_Calculation_Rules.md](../saju/03_Saju_Calculation_Rules.md) | ✅ |
| Extended Schema + deep_* 객체 | [docs/saju/05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md) | 🟡 gap_* ✅, deep_* 정의 필요 |
| 심화 해석 신호 규칙 | [docs/saju/07_Saju_Deep_Interpretation_Rules.md](../saju/07_Saju_Deep_Interpretation_Rules.md) | ✅ |
| Human Signal 매핑 (규칙서) | [docs/saju/08_Self_Analysis_Signal_Mapping.md](../saju/08_Self_Analysis_Signal_Mapping.md) | ✅ |
| Pattern Prompt | [docs/prompt/03B_Deep_Pattern_Prompt.md](../prompt/03B_Deep_Pattern_Prompt.md) | 🟡 |
| Narrative Prompt | [docs/prompt/03C_Deep_Narrative_Prompt.md](../prompt/03C_Deep_Narrative_Prompt.md) | 🟡 |
| Deep 리포트 생성 규칙 | [docs/saju/09_Deep_Self_Report_Generation_Rules.md](../saju/09_Deep_Self_Report_Generation_Rules.md) | ✅ |
| Report Prompt | [docs/prompt/03D_Deep_Report_Generation_Prompt.md](../prompt/03D_Deep_Report_Generation_Prompt.md) | 🟡 |

**UX:** Paid — Integrated Report

---

# Phase E — UI 리포트 렌더링

**목표:** Report JSON → UI JSON.

| 메뉴 / 로직 | 파일 (실제 경로) | 상태 |
|-------------|-----------------|------|
| UI 패턴 규칙 | [docs/saju/10_Deep_Self_Report_UI_Patterns.md](../saju/10_Deep_Self_Report_UI_Patterns.md) | ✅ |
| UI Rendering Prompt | [docs/prompt/03E_UI_Rendering_Prompt.md](../prompt/03E_UI_Rendering_Prompt.md) | 🟡 |

**UX:** Paid — 리포트 화면 (03D 출력 → 03E UI JSON)

---

# Phase F — 관계 분석

**목표:** Lite 궁합 프리뷰 → Deep 관계 리포트.

| 메뉴 / 로직 | 파일 (실제 경로) | 상태 |
|-------------|-----------------|------|
| 관계 아키텍처 | [docs/relationship/01_Relationship_Architecture.md](../relationship/01_Relationship_Architecture.md) | ✅ |
| Behavior Framework | [docs/relationship/02_Behavior_Framework.md](../relationship/02_Behavior_Framework.md) | ✅ |
| Lite 리포트 골격 | [docs/relationship/04_Lite_Report_Framework.md](../relationship/04_Lite_Report_Framework.md) | ✅ |
| Premium 리포트 골격 | [docs/relationship/05_Premium_Report_Framework.md](../relationship/05_Premium_Report_Framework.md) | ✅ |
| Lite 궁합 아키텍처 | [docs/relationship/06_Saju_Compatibility_Architecture.md](../relationship/06_Saju_Compatibility_Architecture.md) | ✅ |
| Lite+Deep 궁합 규칙 | [docs/relationship/07_Saju_Compatibility_Rules.md](../relationship/07_Saju_Compatibility_Rules.md) | ✅ |
| Deep 관계 리포트 구조 | [docs/relationship/08_Saju_Compatibility_Report_Framework.md](../relationship/08_Saju_Compatibility_Report_Framework.md) | ✅ |
| 통합 관계 분석 | [docs/relationship/09_Integrated_Compatibility_Framework.md](../relationship/09_Integrated_Compatibility_Framework.md) | ✅ |
| Lite Relationship Prompt | [docs/prompt/04_Lite_Relationship_Prompt.md](../prompt/04_Lite_Relationship_Prompt.md) | 🟡 설계 + runtime txt |
| Deep Relationship Prompt | [docs/prompt/05_Deep_Relationship_Prompt.md](../prompt/05_Deep_Relationship_Prompt.md) | 🟡 설계 + runtime txt |

---

## Phase별 진행 요약

| Phase | 주제 | 완료 | 작업중 | 정리필요 | 미작성 |
|-------|------|------|--------|----------|--------|
| A | Lite Saju | 10 | 0 | 2 | 0 |
| B | Survey MVP | 9 | 0 | 1 | 0 |
| C | Gap | 4 | 0 | 0 | 0 |
| D | Deep Self | 5 | 4 | 1 | 0 |
| E | UI Report | 1 | 1 | 0 | 0 |
| F | Relationship | 11 | 0 | 2 | 0 |

---

## 개발 우선순위 (현재)

```text
[x] Phase A · B · C
[ ] Phase D — 03B 품질 + 07 Rules 엔진
[ ] Phase E · F
```

**지금:** Phase D (심화). 일상 참조: [10 SSOT](10_Pipeline_Architecture_v1.md) + `00_Status.md`

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| [10_Pipeline_Architecture_v1.md](10_Pipeline_Architecture_v1.md) | **v1 파이프라인·Prompt 체인·수정 가이드** |
| [01_Core_User_Flow.md](01_Core_User_Flow.md) | UX Step 정본 |
| [02_System_Architecture.md](02_System_Architecture.md) | 시스템 구조 |
| [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md) | 출력 Schema 정본 |
| [00_Prompt_Architecture.md](../prompt/00_Prompt_Architecture.md) | Prompt 헌법 |
| [07_Analysis_Engine_Map.md](07_Analysis_Engine_Map.md) | 엔진별 요약 |
| [docs/dev/00_Status.md](../dev/00_Status.md) | 살아있는 Todo (NOW/NEXT) |

---

## 갱신 규칙

* 새 파일 완성 시 해당 행 상태를 ✅로 변경
* 파일명 변경·분리 시 🔄 → ✅ 로 갱신
* Phase 완료 시 `docs/dev/00_Status.md` Phase 체크리스트도 함께 갱신
