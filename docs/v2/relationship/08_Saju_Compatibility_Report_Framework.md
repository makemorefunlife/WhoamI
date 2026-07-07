# 08_Saju_Compatibility_Report_Framework.md

## Purpose

**Deep 관계 리포트**에서 사주·궁합 Rules 출력이 [05_Premium_Report_Framework.md](05_Premium_Report_Framework.md)의 **어느 섹션에 들어가는지** 매핑한다.

* UX 문장·톤·예시는 `05`가 정본이다.
* 계산 규칙은 [07_Saju_Compatibility_Rules.md](07_Saju_Compatibility_Rules.md)가 정본이다.
* 이 문서는 **매핑·우선순위·입력 묶음**만 정의한다. LLM 지시는 [05_Deep_Relationship_Prompt.md](../prompt/05_Deep_Relationship_Prompt.md) *(미작성)*.

---

## Document Stack (Deep)

```text
05 Premium Report Framework     ← 섹션 정의·톤·UX
08 This document                ← signal/event → 섹션 매핑
07 §2 Deep Rules + §3 Deep      ← 계산
09 Integrated Framework         ← Current + Gap + Behavior (미작성)
05 Deep Relationship Prompt     ← 해석 LLM (미작성)
```

Lite 리포트는 `04` + `07` Lite + `04` Prompt — **이 문서 범위 밖**.

---

## Deep Report Input Bundle

Deep LLM에 넘기는 **계산 완료** 묶음 (재계산 금지):

| 필드 | 출처 | Deep에서 사용 |
|------|------|---------------|
| `compatibility_lite_profile` | `07` §1–§3 Lite | 기본 signals·score·6축 비교 |
| `compatibility_deep_extension` | `07` §2–§3 Deep | 추가 events·signal 조정 *(§2 작성 후)* |
| `integrated_compatibility` | `09` *(미작성)* | A/B Current·Gap·Behavior |
| `context` | UI | relationship_type, labels |

### `compatibility_deep_extension` (예정 구조)

```json
{
  "additional_events": [],
  "deep_signal_adjustments": {},
  "dominant_themes": [],
  "meta": { "rules_version": "v1-deep" }
}
```

`dominant_themes` — Rules가 signal·event에서 뽑은 **내부 테마 키** (사주 용어 아님). LLM은 테마→섹션 매핑표로 배분.

---

## Internal Theme Keys

Deep 매핑의 중간 레이어. 사용자 문장에 **키 이름 그대로 노출 금지**.

| theme_key | 의미 |
|-----------|------|
| `connection_rhythm_gap` | 친밀 vs 자유 리듬 차이 |
| `emotional_processing_gap` | 감정 처리 속도·방식 차이 |
| `planning_flexibility_gap` | 계획 vs 유연성 |
| `control_autonomy_gap` | 통제·자율 기대 차이 |
| `stability_pace_gap` | 안정·속도 감각 차이 |
| `growth_drive_alignment` | 성장·학습 동기 공유 |
| `natural_pull` | 자연스러운 끌림 |
| `recurring_tension_loop` | 반복 마찰 구조 |
| `repair_style_contrast` | 화해·재연결 방식 차이 |
| `long_horizon_fit` | 장기 리듬·지속 요인 |
| `hidden_validation_need` | 인정·안전 욕구 (09 Behavior와 합성) |
| `assumption_blind_spot` | 의도 vs 기대 불일치 (09) |

Rules(`07` Deep) 또는 `09`가 `dominant_themes` 최대 **6개**를 strength 순으로 채운다.

---

# Section Mapping — 05 Premium ↔ Data Sources

| § | 05 섹션 | Primary inputs | Secondary inputs |
|---|---------|----------------|------------------|
| 1 | Relationship Dynamic | `natural_affinity`, `emotional_resonance`, inter `alignments`/`contrasts` | `connection_rhythm_gap`, harmonizing events |
| 2 | Hidden Needs | `emotional_resonance`, `stability_potential`, `hidden_validation_need` | per-person Gap `suppressions` (09) |
| 3 | Conflict Cycle | `relationship_tension`, `challenge_potential`, `recurring_tension_loop` | tension events, `control_autonomy_gap` |
| 4 | Repair Pattern | `communication_alignment`, `repair_style_contrast` | `emotional_processing_gap` |
| 5 | Growth Opportunity | `growth_support`, `growth_drive_alignment` | harmonizing events, inter `alignments` on growth/autonomy |
| 6 | Relationship Blind Spots | `assumption_blind_spot`, `communication_alignment` (low) | `moderate_differences`, Behavior rules (09) |
| 7 | What I Wish You Knew (A) | Person A: Gap + inter contrast on autonomy/control/stability | `hidden_validation_need` (A-side) |
| 8 | What You May Not Realize (B) | Person B: 동일 | Person B perspective tags |
| 9 | Long-Term Dynamic | `long_term_potential`, `stability_potential`, `long_horizon_fit` | `developing` vs `strong` band — **예측 금지** |
| 10 | Premium Summary | top 2 harmonizing + top 1 tension theme | 전 섹션 요약용 |

---

## Relationship Signals → Sections

각 signal은 **primary** 섹션 1–2개, **secondary** 0–2개.

| signal | primary § | secondary § |
|--------|-------------|-------------|
| `natural_affinity` | 1 | 5, 10 |
| `emotional_resonance` | 1, 2 | 7, 8 |
| `communication_alignment` | 4, 6 | 3 |
| `growth_support` | 5 | 1, 9 |
| `stability_potential` | 2, 9 | 1 |
| `relationship_tension` | 3 | 6, 10 |
| `challenge_potential` | 3, 5 | 1 |
| `long_term_potential` | 9 | 5, 10 |

### Signal strength → 섹션 깊이

| signal 값 | LLM 깊이 |
|-----------|----------|
| ≥ 70 (harmonizing 계열) | 해당 primary § **풀 단락** |
| 55–69 | **짧은 단락** |
| < 55 (tension 계열은 반대: 높을수록 깊게) | tension signal ≥ 65 → §3·§6 **풀 단락** |

숫자는 사용자에게 노출하지 않는다.

---

## Inter-Axis Patterns → Theme Keys

[07](07_Saju_Compatibility_Rules.md) §1.1 `pair_tags` / `inter_pattern` → `dominant_themes`:

| 조건 | theme_key |
|------|-----------|
| `shared_connection_style` | `connection_rhythm_gap` *(낮은 tension 시 growth_drive_alignment로 승격 가능)* |
| `independence_control_gap` | `control_autonomy_gap` |
| `pace_security_gap` | `stability_pace_gap` |
| `flexibility_gap` | `planning_flexibility_gap` |
| `shared_growth_drive` | `growth_drive_alignment` |
| `innate_contrast` on connection + high `relationship_tension` | `emotional_processing_gap` |
| ≥2 `innate_contrast` axes + tension events ≥2 | `recurring_tension_loop` |

---

## Event Polarity → Sections (Deep only)

`07` §2 이벤트가 채워지면:

| polarity | event count (Deep) | sections fed |
|----------|-------------------|--------------|
| `harmonizing` | top 3 by strength | 1, 5 (+ §10 요약) |
| `tension` | top 3 by strength | 3, 6 (+ §4 repair 힌트) |
| mixed (both ≥2) | — | §1에 dynamic, §3에 cycle **분리** (05 Principle 2) |

이벤트 이름·한자는 LLM 입력에 포함 가능하나 **출력 금지** ([06](06_Saju_Compatibility_Architecture.md)).

---

## Integrated Layer (09) — Reserved Slots

`09` 작성 후 아래가 §2·§6·§7·§8을 **우선 보강**:

| 09 출력 | sections |
|---------|----------|
| Behavior rule hits (e.g. `planning_vs_spontaneity`) | 3, 4, 6 |
| Person A/B Gap `suppressions` | 2, 7 |
| Person A/B Gap `overadaptations` | 6, 8 |
| Cross Current axis contrast | 3, 6 |

사주-only Deep과 **충돌 시**: 09 Behavior·Current가 **행동 서술** 우선, 사주 signal은 **innate 배경**으로 한 단계 뒤.

---

## Assembly Order (Deep LLM)

한 번에 장문 생성하지 않고, **섹션 블록 순서** 권장 ([05](05_Premium_Report_Framework.md) 구조 유지):

```text
1. Build dominant_themes (Rules 07+09)
2. Map themes → sections (this doc)
3. LLM pass: §1–§5 (dynamic → growth)
4. LLM pass: §6–§8 (blind spots + dual perspective)
5. LLM pass: §9–§10 (long-term + summary, no prediction)
```

단일 Prompt로도 가능 — `05` Prompt 작성 시 이 순서를 **내부 outline**으로 명시.

---

## Deep Output JSON Skeleton

Schema 정본은 추후 `05_Saju_Output_Schema.md`에 `relationship_deep_report` 추가.

```json
{
  "report_type": "relationship_deep",
  "language": "{{OUTPUT_LANGUAGE}}",
  "compatibility_score": 0,
  "sections": {
    "relationship_dynamic": { "title": "", "body": "" },
    "hidden_needs": { "title": "", "body": "" },
    "conflict_cycle": { "title": "", "body": "" },
    "repair_pattern": { "title": "", "body": "" },
    "growth_opportunity": { "title": "", "body": "" },
    "blind_spots": { "title": "", "body": "" },
    "wish_you_knew_about_me": { "title": "", "body": "" },
    "what_you_may_not_realize": { "title": "", "body": "" },
    "long_term_dynamic": { "title": "", "body": "" },
    "premium_summary": { "title": "", "body": "" }
  },
  "evidence_notes": {
    "primary_signals_used": [],
    "dominant_themes_used": [],
    "confidence_level": "low | medium | high"
  }
}
```

---

## Forbidden (Deep Report)

[05](05_Premium_Report_Framework.md) §9 + [06](06_Saju_Compatibility_Architecture.md) 공통:

* 결혼·이별·운명 예측
* 사주·합충·십신 사용자 노출
* 입력에 없는 갈등·욕구 **창작**
* 한쪽을 “문제”로 규정

---

## Related

| 문서 | 역할 |
|------|------|
| [05_Premium_Report_Framework.md](05_Premium_Report_Framework.md) | 섹션 UX 정본 |
| [07_Saju_Compatibility_Rules.md](07_Saju_Compatibility_Rules.md) | Lite ✅ / Deep §2 미작성 |
| [09_Integrated_Compatibility_Framework.md](09_Integrated_Compatibility_Framework.md) | 통합 *(미작성)* |
| [05_Deep_Relationship_Prompt.md](../prompt/05_Deep_Relationship_Prompt.md) | LLM *(미작성)* |
