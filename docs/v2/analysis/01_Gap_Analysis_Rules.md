# 01_Gap_Analysis_Rules.md

## Purpose

`Current Self`와 `Innate Self`의 **Human Framework 6축**을 비교해 `GapProfile`을 계산한다.

* **계산·분류만** 한다. 해석 문장·LLM 호출은 하지 않는다.
* 개념 정본: [11_Comparison_Framework.md](../framework/11_Comparison_Framework.md)
* 해석 문장(유료): [03A_Gap_Analysis_Prompt.md](../prompt/03A_Gap_Analysis_Prompt.md)

---

## Product Rule (Free vs Paid)

| 구분 | UX Step | Gap Rules 출력 | LLM (03A) |
|------|---------|----------------|-----------|
| **무료** | Step 9 프리뷰 | `delta`, 축 점수, `severity` | **사용 안 함** |
| **유료** | Integrated Report | 동일 `GapProfile` | **03A 입력** |

무료 사용자에게 Alignment·Suppression 등 **라벨 이름이나 해석 문장을 노출하지 않는다.**  
(데이터는 계산해도 되나, UI는 `09_Visualization_Guide.md` 기준 점수·차이만.)

---

## Input Contract

### Required

| 입력 | Schema | 필드 |
|------|--------|------|
| Current Self | [04_Survey_Output_Schema.md](../survey/04_Survey_Output_Schema.md) | `primary_axes` |
| Innate Self | [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md) | `innate_self_profile.primary_axes` |

### Axis Keys (고정 순서)

```text
autonomy, connection, stability, growth, control, adaptability
```

> `05` 예시에 `freedom`이 보이면 **런타임에서는 `autonomy`로 통일**한다.  
> Human Framework 정본: [10_Human_Framework.md](../framework/10_Human_Framework.md)

### Optional (03A 톤 조정용, 분류에 사용 안 함)

* `current_self.personalization.primary_concern`

### Forbidden Input Use

* `secondary_axes` — Gap v1 분류에 사용하지 않음
* Extended NormalizedSaju — Gap Rules v1에 사용하지 않음 (심화 03B 영역)
* 사주 재계산

---

## Calculation

### Per-axis delta

```text
delta[axis] = current_self.primary_axes[axis] - innate_self.primary_axes[axis]
```

범위: -100 ~ +100 (이론상 -100 ~ +100)

### Absolute gap

```text
abs_delta[axis] = |delta[axis]|
```

---

## Classification (per axis)

개념 정본: [11_Comparison_Framework.md](../framework/11_Comparison_Framework.md)

각 축에 **primary_pattern** 하나를 부여한다. 우선순위는 위에서 아래.

| 순서 | 조건 | primary_pattern |
|------|------|-----------------|
| 1 | `abs_delta` ≤ 10 | `alignment` |
| 2 | `abs_delta` ≥ 25 | `energy_leakage` |
| 3 | `delta` ≤ -11 | `suppression` |
| 4 | `delta` ≥ 11 | `overadaptation` |
| 5 | 그 외 (11 ≤ abs_delta < 25) | `moderate_gap` |

### Growth Opportunity (보조 태그)

다음을 **모두** 만족하면 `growth_opportunity: true` (primary_pattern과 별도):

* `axis` is `growth` or `autonomy`
* `primary_pattern` is `suppression` or `energy_leakage`
* `innate_self.primary_axes[axis]` ≥ 55

---

## Gap Severity (전체)

축별 `abs_delta` 최댓값(`max_abs_delta`)으로 판정.

| max_abs_delta | overall_severity |
|---------------|------------------|
| ≤ 10 | `low` |
| 11 ~ 24 | `moderate` |
| ≥ 25 | `high` |

---

## Aggregated Lists

Rules 엔진은 `GapProfile`에 아래 리스트를 채운다 (유료·내부용).

| 필드 | 포함 조건 |
|------|-----------|
| `alignments` | primary_pattern == `alignment` |
| `suppressions` | primary_pattern == `suppression` |
| `overadaptations` | primary_pattern == `overadaptation` |
| `energy_leakages` | primary_pattern == `energy_leakage` |
| `growth_opportunities` | growth_opportunity == true |
| `moderate_gaps` | primary_pattern == `moderate_gap` |

---

## Output Contract — GapProfile

Schema 정본: [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md) → `gap_profile`  
v1 계산 결과는 아래 구조를 따른다.

```json
{
  "profile_type": "gap_profile",
  "version": "v1",
  "inputs": {
    "current_self_axes": {},
    "innate_self_axes": {}
  },
  "per_axis": {
    "autonomy": {
      "current": 0,
      "innate": 0,
      "delta": 0,
      "abs_delta": 0,
      "primary_pattern": "alignment",
      "growth_opportunity": false
    }
  },
  "overall_severity": "low",
  "max_abs_delta": 0,
  "summary_counts": {
    "alignment": 0,
    "suppression": 0,
    "overadaptation": 0,
    "energy_leakage": 0,
    "moderate_gap": 0,
    "growth_opportunity": 0
  },
  "aggregated": {
    "alignments": [],
    "suppressions": [],
    "overadaptations": [],
    "energy_leakages": [],
    "growth_opportunities": [],
    "moderate_gaps": []
  },
  "free_preview": {
    "radar_current": {},
    "radar_innate": {},
    "delta_by_axis": {}
  },
  "meta": {
    "rules_version": "v1",
    "calculated_at": ""
  }
}
```

### free_preview

무료 Step 9 UI 전용. **패턴 라벨·해석 없음.**

* `radar_current` / `radar_innate` — 6축 점수
* `delta_by_axis` — 축별 delta 숫자만

### aggregated / per_axis.primary_pattern

유료 03A·03D 입력. 무료 UI에 기본 노출하지 않음.

---

## Pipeline Position

```text
CurrentSelfProfile + InnateSelfProfile
        │
        ▼
01_Gap_Analysis_Rules  (이 문서 — 코드)
        │
        ├─► Free Step 9: free_preview only
        │
        └─► Paid: full GapProfile → 03A_Gap_Analysis_Prompt → gap_analysis JSON
                                      │
                                      └─► 03D Report (Gap 섹션)
```

상세: [10_Pipeline_Architecture_v1.md](../guide/10_Pipeline_Architecture_v1.md)

---

## v1 Thresholds (조정 가능)

| 상수 | 값 | 설명 |
|------|-----|------|
| `ALIGN_MAX` | 10 | alignment 상한 |
| `DIRECTION_MIN` | 11 | suppression / overadaptation 하한 |
| `LEAK_MIN` | 25 | energy_leakage 하한 |
| `GROWTH_INNATE_MIN` | 55 | growth_opportunity innate 하한 |

임계값 변경 시 이 문서만 수정. Prompt·Schema 필드명은 유지.

---

## Implementation Notes

* 구현: `runtime/lib/gap-analyzer.js`
* 실행: `runtime/run-gap-analysis.mjs`
* 샘플: `samples/survey_answers.json` + `samples/innate_profile.json` → `npm run pipeline`
* LLM 금지 — 본 Rules는 deterministic

---

## Forbidden

* 사주·설문 재계산
* LLM으로 패턴 라벨 생성
* 입력에 없는 원인·경험 추가
* 무료 UI에 suppression 등 라벨 직접 노출
* Weakness 라벨 (Growth Edge 톤은 03A에서)

---

## Related

| 문서 | 역할 |
|------|------|
| [11_Comparison_Framework.md](../framework/11_Comparison_Framework.md) | 개념 정본 |
| [09_Visualization_Guide.md](../guide/09_Visualization_Guide.md) | 무료 차트 |
| [03A_Gap_Analysis_Prompt.md](../prompt/03A_Gap_Analysis_Prompt.md) | 유료 해석 (다음 작업) |

---

## Versioning

* `v1` — 6축 primary only, threshold 기반 분류
* 변경 시 `gap_profile.version` bump + `decisions/` 기록
