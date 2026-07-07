# 07_Saju_Compatibility_Rules.md

## Purpose

두 사람의 **Innate Self**를 비교해 `CompatibilityProfile`을 **계산**한다.

* **계산·분류·스코어만** 한다. 해석 문장·LLM 호출은 하지 않는다.
* 아키텍처 정본: [06_Saju_Compatibility_Architecture.md](06_Saju_Compatibility_Architecture.md)
* Lite 리포트 골격: [04_Lite_Report_Framework.md](04_Lite_Report_Framework.md)
* Lite 해석(무료): [04_Lite_Relationship_Prompt.md](../prompt/04_Lite_Relationship_Prompt.md)
* Deep 해석(유료): [05_Deep_Relationship_Prompt.md](../prompt/05_Deep_Relationship_Prompt.md)

---

## Product Rule (Lite vs Deep)

| 구분 | Rules 출력 | LLM |
|------|------------|-----|
| **Lite (무료)** | §1 + §3 Lite — 6축 비교, 제한 이벤트, 8 signals, `compatibility_score` | `04` Lite Relationship Prompt |
| **Deep (유료)** | §1 + §2 + §3 Deep — 전체 사주 상호작용 | `05` Deep Relationship Prompt |

무료 UI에는 **사주 용어·이벤트 이름·raw events**를 노출하지 않는다.  
(데이터는 계산해도 되나, UI는 signals·score·LLM 문장만.)

---

## Input Contract

### Required (Lite & Deep)

| 입력 | Schema | 필드 |
|------|--------|------|
| Person A | [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md) | `innate_self_profile.primary_axes`, `extended_saju` |
| Person B | 동일 | 동일 |

### Axis Keys (고정 순서)

```text
autonomy, connection, stability, growth, control, adaptability
```

> `freedom`이 보이면 **`autonomy`로 통일** ([01_Gap_Analysis_Rules.md](../analysis/01_Gap_Analysis_Rules.md)와 동일).

### Extended Saju fields used in Lite

```text
extended_saju.pillars.{year,month,day,hour}.{stem,branch}
extended_saju.stem_relations   (within-chart, 참고용 — Lite 교차 비교는 §1.2에서 재계산)
extended_saju.branch_relations (동일)
```

### Forbidden Input Use

* `current_self_profile` — Rules v1에 사용 안 함 (통합은 `09`)
* `gap_profile` — Rules v1에 사용 안 함
* `secondary_axes`
* 사주·6축 **재계산** (입력 JSON만 사용)

---

## Pipeline Position

```text
InnateSelfProfile A + InnateSelfProfile B
        │
        ▼
07_Saju_Compatibility_Rules  (이 문서 — 코드)
        │
        ├─► Lite: compatibility_lite_profile → 04 LLM → Lite Report
        │
        └─► Deep: compatibility_deep_profile → 05 LLM → Deep Report
```

아키텍처 레이어 대응 ([06](06_Saju_Compatibility_Architecture.md)):

| Layer | Lite | Deep |
|-------|------|------|
| 1 Innate 6축 비교 | §1.1 | §1.1 |
| 2 Saju 상호작용 | §1.2 (제한) | §2 (전체) |
| 3 Raw Events | §1.2 | §2 |
| 4 Signals | §3 Lite | §3 Deep |

---

# §1 Lite Rules

Lite는 **빠른 궁합 프리뷰**용. 이벤트 종류·교차 비교 깊이를 제한한다.

---

## §1.1 Innate 6-Axis Comparison (Layer 1)

두 사람의 `innate_self_profile.primary_axes`를 축별로 비교한다.

### Per-axis inter-person delta

```text
inter_delta[axis] = axes_A[axis] - axes_B[axis]
abs_inter_delta[axis] = |inter_delta[axis]|
```

범위: -100 ~ +100

### Per-axis pattern (우선순위 위→아래)

| 순서 | 조건 | `inter_pattern` |
|------|------|-----------------|
| 1 | `abs_inter_delta` ≤ 12 | `innate_alignment` |
| 2 | `abs_inter_delta` ≥ 30 | `innate_contrast` |
| 3 | 그 외 | `moderate_difference` |

> Gap Rules의 `alignment/suppression`과 **다른 축**이다.  
> Gap = 한 사람의 Current vs Innate.  
> Inter = **두 사람 Innate vs Innate**.

### Axis pair tags (보조, signal 가중용)

다음은 `inter_pattern`과 별도 태그. Lite signal §3.2에서 가중치에 사용.

| 조건 | `pair_tag` |
|------|------------|
| `innate_alignment` on `connection` | `shared_connection_style` |
| `innate_contrast` on `autonomy` or `control` | `independence_control_gap` |
| `innate_contrast` on `stability` | `pace_security_gap` |
| `innate_alignment` on `growth` | `shared_growth_drive` |
| `innate_contrast` on `adaptability` | `flexibility_gap` |

한 축에 복수 태그 가능.

### Aggregated axis summary

| 필드 | 포함 조건 |
|------|-----------|
| `alignments` | inter_pattern == `innate_alignment` |
| `moderate_differences` | inter_pattern == `moderate_difference` |
| `contrasts` | inter_pattern == `innate_contrast` |

### Overall innate similarity

```text
mean_abs_inter_delta = average(abs_inter_delta over 6 axes)
```

| mean_abs_inter_delta | `innate_similarity_band` |
|----------------------|----------------------------|
| ≤ 14 | `high` |
| 15 ~ 26 | `moderate` |
| ≥ 27 | `low` |

---

## §1.2 Cross-Chart Saju Events (Layer 2–3, Lite subset)

Person A의 **8글자(4 stem + 4 branch)** 와 Person B의 8글자를 **쌍방 전수 비교**한다.  
같은 사람 내 pillar 관계(`stem_relations` within-chart)는 Lite 교차 점수에 **포함하지 않는다**.

### Lite에서 탐지하는 이벤트 (5종만)

| `event_type` | 탐지 규칙 | `event_name` 예 |
|--------------|-----------|-----------------|
| `stem_combination` | 천간 5합 ([03](../saju/03_Saju_Calculation_Rules.md) Stem Combinations) | `ding_ren_combination` |
| `branch_clash` | 지지 6충 | `zi_wu_clash` |
| `branch_six_combination` | 지지 6합 | `zi_chou_combination` |
| `branch_three_harmony` | 지지 삼합 **완성**(양쪽 합쳐 3지지 전부 존재) | `shen_zi_chen_harmony` |
| `branch_directional_harmony` | 방합 **완성**(양쪽 합쳐 3지지 전부 존재) | `yin_mao_chen_directional` |

Lite **미포함** (Deep §2): 원진, 형, 파, 해, 십신 교차, 오행 상생상극 점수, 12운성, 신살.

### Pillar weight (교차 이벤트 강도)

이벤트에 관여한 pillar 위치마다 가중치를 합산한 뒤 평균한다.

| Pillar | weight |
|--------|--------|
| `day` | 1.0 |
| `month` | 0.75 |
| `year` | 0.5 |
| `hour` | 0.5 |

### Event strength (0–1)

```text
base_strength[event_type]:
  stem_combination:        0.75
  branch_six_combination:  0.70
  branch_three_harmony:    0.85
  branch_directional_harmony: 0.65
  branch_clash:            0.80

event.strength = min(1.0, base_strength × avg_pillar_weight)
```

### Event polarity

| event_type | `polarity` |
|------------|------------|
| `stem_combination` | `harmonizing` |
| `branch_six_combination` | `harmonizing` |
| `branch_three_harmony` | `harmonizing` |
| `branch_directional_harmony` | `harmonizing` |
| `branch_clash` | `tension` |

### Lite event cap

무료 계산 안정성·노이즈 방지:

* `harmonizing` 이벤트 최대 **6건** (strength 내림차순)
* `tension` 이벤트 최대 **4건** (strength 내림차순)

초과분은 `meta.truncated_events`에 개수만 기록.

---

# §2 Deep Rules

Deep은 **§1.2 Lite 이벤트 전부** + 아래 추가 이벤트를 탐지한다.  
교차 비교 방식·pillar weight는 §1.2와 **동일**. `birth_time_unknown`이면 hour pillar **제외** ([03](../saju/03_Saju_Calculation_Rules.md)).

---

## §2.1 Deep Event Catalog

| `event_type` | polarity | base_strength | 비고 |
|--------------|----------|---------------|------|
| *(§1.2 5종)* | *(동일)* | *(동일)* | Lite와 동일 규칙 |
| `stem_clash` | `tension` | 0.70 | 천간 4충 |
| `branch_harm` | `tension` | 0.65 | 지지 6해 |
| `branch_punishment` | `tension` | 0.75 | 지지 형 |
| `branch_break` | `tension` | 0.60 | 지지 6파 |
| `yuan_zhen` | `tension` | 0.72 | 원진 6쌍 |
| `branch_partial_harmony` | `harmonizing` | 0.55 | 삼합 2/3 (교차) |
| `ten_god_cross_dynamic` | `mixed` | 0.50–0.80 | §2.4 |
| `five_element_complement` | `harmonizing` | 0.40–0.75 | §2.5 |
| `five_element_friction` | `tension` | 0.40–0.70 | §2.5 |
| `growth_stage_dynamic` | `mixed` | 0.45–0.70 | §2.6 |
| `special_star_overlap` | `harmonizing` | 0.50 | §2.7, v1 선택 |

`event.strength` 공식: §1.2와 동일 — `min(1.0, base_strength × avg_pillar_weight)`.  
`ten_god_cross_dynamic`·오행·운성은 pillar weight 대신 §2.4–2.6 **자체 strength** 사용.

---

## §2.2 Cross-Chart Branch & Stem Pairs

표는 [03_Saju_Calculation_Rules.md](../saju/03_Saju_Calculation_Rules.md) 계산 결과 형식과 **동일 쌍**을 사용한다.  
코드는 이 표를 `03`과 **단일 모듈**로 공유한다.

### Stem clash (천간 4충)

```text
甲庚  乙辛  丙壬  丁癸
```

`event_name` 예: `jia_geng_clash`

### Branch harm (지지 6해)

```text
子未  丑午  寅巳  卯辰  申亥  酉戌
```

### Branch punishment (지지 형)

**양형삼형** (교차 시 3지지 중 2개만 있어도 `partial: true`):

```text
寅巳申  丑戌未  子卯
```

**자형** (같은 지지가 A·B에 각각 존재):

```text
辰  午  酉  亥
```

### Branch break (지지 6파)

```text
子酉  卯午  辰丑  未戌  寅亥  巳申
```

### Yuan zhen (원진)

```text
子未  丑午  寅酉  卯申  辰亥  巳戌
```

> 원진 쌍은 harm·break와 글자가 겹치는 항목이 있다. **별도 event_type**으로 각각 1회 기록 (중복 병합 금지).

### Branch partial harmony (삼합 2/3)

삼합 군:

```text
申子辰 (water)   亥卯未 (wood)   寅午戌 (fire)   巳酉丑 (metal)
```

양쪽 차트 합쳐 **정확히 2지지**만 존재 → `branch_partial_harmony`, `partial: true`.  
3지지 전부 → §1.2 `branch_three_harmony` (더 높은 base_strength 유지, 중복 기록 금지).

---

## §2.3 Deep Event Caps & Storage

Lite cap **미적용**. 대신 저장 상한:

| polarity | max stored |
|----------|------------|
| `harmonizing` | 12 |
| `tension` | 10 |
| `mixed` | 6 |

초과분 → `meta.truncated_events`. strength 내림차순 유지.

---

## §2.4 Ten God Cross Dynamic

입력: `extended_saju.dominant_ten_gods[]` (각 사람 상위 4개까지).

### Pairing rule

Person A의 각 dominant god와 Person B의 각 dominant god를 교차 매칭.  
미리 정의된 **dynamic_id** hit 시 이벤트 1건.

| dynamic_id | trigger (A god + B god, 순서 무관) | polarity | base_strength |
|------------|-------------------------------------|----------|---------------|
| `resource_support` | `direct_resource` + `seven_killings` | harmonizing | 0.70 |
| `resource_support` | `indirect_resource` + `hurting_officer` | harmonizing | 0.65 |
| `peer_resonance` | `peer` + `peer` | harmonizing | 0.60 |
| `expression_spark` | `eating_god` + `hurting_officer` | harmonizing | 0.55 |
| `structure_meets_flex` | `direct_officer` + `eating_god` | harmonizing | 0.65 |
| `control_tension` | `seven_killings` + `direct_officer` | tension | 0.75 |
| `wealth_focus_clash` | `direct_wealth` + `rob_wealth` | tension | 0.70 |
| `pressure_vs_expression` | `seven_killings` + `hurting_officer` | tension | 0.72 |
| `nurturing_gap` | `direct_resource` + `peer` | mixed | 0.55 |

동일 `dynamic_id`는 **1회만** (가장 높은 base_strength 쌍 유지).

`event_name` = `dynamic_id`. `pillars` = `["dominant_ten_gods"]`.

---

## §2.5 Five Element Balance Interaction

입력: `extended_saju.five_elements` (wood, fire, earth, metal, water counts).

### Complement score (0–1)

각 오행에 대해 두 사람 count 차이 `diff = |A_e - B_e|`.  
`element_balance_score = 1 - (average of diff over 5 elements / max_count_pool)`  
`max_count_pool` = max(8, A_total + B_total) / 2

| element_balance_score | event |
|-----------------------|-------|
| ≥ 0.65 | `five_element_complement` (harmonizing), strength = score × 0.75 |
| ≤ 0.35 | `five_element_friction` (tension), strength = (1 - score) × 0.70 |

### Dominant element clash

양쪽 `dominant_elements[0]` (최다 오행)이 **상극** 관계일 때 추가 tension 이벤트:

```text
wood ↔ earth   fire ↔ metal   water ↔ fire
```

`event_type`: `five_element_friction`, `event_name`: `{a}_{b}_dominant_clash`, base_strength 0.55.

상극 표는 [03](../saju/03_Saju_Calculation_Rules.md) Five Elements 섹션과 동기화.

---

## §2.6 Growth Stage Interaction

입력: `extended_saju.growth_stages.day` (일주 12운성). 없으면 skip.

### Stage energy band

| band | stages (한글 저장값 예) |
|------|-------------------------|
| `rising` | 장생, 목욕, 관대, 임관, 제왕 |
| `declining` | 쇠, 병, 사, 묘, 절 |
| `transitional` | 태, 양 |

영문 enum(`ChangSheng` 등) 입력 시 위 band로 **정규화** 후 비교.

| A band | B band | dynamic_id | polarity | base_strength |
|--------|--------|------------|----------|---------------|
| `rising` | `rising` | `mutual_momentum` | harmonizing | 0.65 |
| `declining` | `declining` | `mutual_fatigue_risk` | tension | 0.60 |
| `rising` | `declining` | `pace_mismatch` | mixed | 0.70 |
| any | `transitional` | `adjustment_phase` | mixed | 0.45 |

`pillars` = `["day"]` only.

---

## §2.7 Special Star Overlap (v1 optional)

입력: `extended_saju.special_stars` — 키가 있을 때만.

양쪽 **동일 star**가 **동일 pillar**에 존재하면:

`event_type`: `special_star_overlap`  
`event_name`: `{star_key}_overlap`  
base_strength: 0.50

v1 권장 star: `heavenly_nobleman`, `peach_blossom` 만. 나머지는 Deep v2.

---

## §2.8 Deep-Only Theme Seeds

Rules가 `compatibility_deep_extension.dominant_themes` 초안을 채울 때 §2 이벤트에서 파생:

| event / dynamic | theme_key ([08](08_Saju_Compatibility_Report_Framework.md)) |
|-----------------|-------------------------------------------------------------|
| `control_tension`, `pressure_vs_expression` | `recurring_tension_loop` |
| `structure_meets_flex`, `five_element_complement` | `growth_drive_alignment` |
| `pace_mismatch`, `mutual_fatigue_risk` | `stability_pace_gap` |
| `nurturing_gap` | `emotional_processing_gap` |
| `yuan_zhen` ≥2건 | `recurring_tension_loop` (+priority) |

`09` 통합 후 priority 재정렬 — [09](09_Integrated_Compatibility_Framework.md).

---

# §3 Scoring

## §3.1 Relationship Signals (0–100)

[06](06_Saju_Compatibility_Architecture.md)의 8 signals. 각 signal은 **0–100 정수** (반올림).

초기값: 모든 signal = 50 (중립).

### Signal keys

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

## §3.2 Lite Signal Adjustments

각 조정은 누적 합산 후 signal별 **clamp 0–100**.

### From §1.1 axis patterns

| 조건 | signal | adjustment |
|------|--------|------------|
| `shared_connection_style` | `emotional_resonance` | +12 |
| `shared_connection_style` | `natural_affinity` | +8 |
| `shared_growth_drive` | `growth_support` | +10 |
| `shared_growth_drive` | `long_term_potential` | +6 |
| `innate_similarity_band` == `high` | `natural_affinity` | +8 |
| `innate_similarity_band` == `low` | `challenge_potential` | +10 |
| `independence_control_gap` | `relationship_tension` | +10 |
| `independence_control_gap` | `communication_alignment` | -6 |
| `pace_security_gap` | `stability_potential` | -8 |
| `pace_security_gap` | `relationship_tension` | +8 |
| `flexibility_gap` | `communication_alignment` | -5 |
| per `innate_alignment` axis (max 3 counted) | `stability_potential` | +3 each |
| per `innate_contrast` axis (max 3 counted) | `challenge_potential` | +4 each |

### From §1.2 cross-chart events

| polarity | per event | signal | adjustment |
|----------|-----------|--------|------------|
| `harmonizing` | `strength × 14` | `natural_affinity` | + |
| `harmonizing` | `strength × 10` | `emotional_resonance` | + |
| `harmonizing` | `strength × 8` | `growth_support` | + |
| `tension` | `strength × 16` | `relationship_tension` | + |
| `tension` | `strength × 6` | `communication_alignment` | − |

### Derived balance (Lite)

```text
harmony_index = mean(natural_affinity, emotional_resonance, growth_support, stability_potential)
tension_index = relationship_tension

communication_alignment = clamp(50 + (harmony_index - tension_index) × 0.25, adjusted per above)
long_term_potential = clamp(50 + (stability_potential + growth_support) / 2 - 50, adjusted per above)
challenge_potential — contrast·tension 기반만; harmony가 높으면 상한 70 (Lite)
```

---

## §3.3 Lite compatibility_score

[04_Lite_Report_Framework.md](04_Lite_Report_Framework.md) §1 입력.

```text
positive_avg = mean(natural_affinity, emotional_resonance, growth_support, stability_potential, long_term_potential)
compatibility_score = round(0.7 × positive_avg + 0.3 × (100 - relationship_tension))
```

범위: 0–100

### Display band

| compatibility_score | `score_band` |
|---------------------|--------------|
| ≥ 75 | `strong` |
| 55 – 74 | `moderate` |
| < 55 | `developing` |

`developing` = “나쁨”이 아니라 **차이·성장 여지** 톤 ([04](04_Lite_Report_Framework.md) 톤 가이드).

---

## §3.4 Deep Scoring

Deep은 **§3.2 Lite 조정을 전부 적용**한 뒤, §2 추가 이벤트로 **추가 조정**한다.  
`challenge_potential` **상한 없음** (Lite 70 cap 해제).

### From §2 deep-only events

| polarity | per event | signal | adjustment |
|----------|-----------|--------|------------|
| `harmonizing` (§2 only) | `strength × 10` | `natural_affinity` | + |
| `harmonizing` (§2 only) | `strength × 8` | `long_term_potential` | + |
| `tension` (§2 only) | `strength × 14` | `relationship_tension` | + |
| `tension` (§2 only) | `strength × 8` | `challenge_potential` | + |
| `mixed` | `strength × 6` | `communication_alignment` | − |
| `mixed` | `strength × 5` | `growth_support` | ± (dynamic_id가 harmonizing 계열이면 +, tension 계열이면 −) |

§1.2에서 이미 카운트한 이벤트는 **§2 only 행에 중복 적용 금지** — Deep adjustment는 `event_type`이 §2.1 전용인 것만.

### Ten god & element & growth (요약 boost)

| 조건 | signal | adjustment |
|------|--------|------------|
| `ten_god` harmonizing ≥2건 | `emotional_resonance` | +8 |
| `ten_god` tension ≥2건 | `relationship_tension` | +10 |
| `five_element_complement` 존재 | `stability_potential` | +6 |
| `five_element_friction` 존재 | `relationship_tension` | +7 |
| `mutual_momentum` | `growth_support` | +9 |
| `pace_mismatch` | `challenge_potential` | +8 |

### Deep derived balance

Lite §3.2 derived 공식 **동일** 적용.  
추가: `long_term_potential`에 `stability_potential × 0.3 + growth_support × 0.3` 보정 1회.

### Deep compatibility_score

Lite §3.3 **동일 공식** — Deep에서도 `compatibility_score`·`score_band` 유지 (UI 연속성).

```text
positive_avg = mean(natural_affinity, emotional_resonance, growth_support, stability_potential, long_term_potential)
compatibility_score = round(0.7 × positive_avg + 0.3 × (100 - relationship_tension))
```

### Deep `dominant_themes` (for 08 / 05)

§2.8 theme seeds + signal 상위·하위:

1. `relationship_signals` 최고·최저 2개씩 → theme 후보
2. §2.8 매핑 병합
3. priority 내림차순 **6개** → `compatibility_deep_extension.dominant_themes`

형식:

```json
{ "theme_key": "recurring_tension_loop", "priority": 82, "sources": ["yuan_zhen", "control_tension"] }
```

---

## Output Contract — CompatibilityProfile (Deep)

`profile_type`: `compatibility_deep_profile`  
Lite 필드 **전부 포함** + 아래 확장.

```json
{
  "profile_type": "compatibility_deep_profile",
  "version": "v1",
  "tier": "deep",
  "innate_axis_comparison": {},
  "compatibility_events": [],
  "relationship_signals": {},
  "compatibility_score": 0,
  "score_band": "moderate",
  "compatibility_deep_extension": {
    "additional_events": [],
    "dominant_themes": [],
    "meta": { "rules_version": "v1-deep" }
  },
  "meta": {
    "rules_version": "v1-deep",
    "truncated_events": { "harmonizing": 0, "tension": 0, "mixed": 0 },
    "calculated_at": ""
  }
}
```

* `compatibility_events` — Lite+Deep 전체 (상한 적용 후)
* `compatibility_deep_extension.additional_events` — §2.1 전용 타입만 (디버그·08 매핑용)
* Schema 정본: 추후 [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md)에 추가

---

## Output Contract — CompatibilityProfile (Lite)

Schema 정본은 추후 [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md)에 `compatibility_lite_profile` 추가.  
v1 Lite 계산 결과 구조:

```json
{
  "profile_type": "compatibility_lite_profile",
  "version": "v1",
  "tier": "lite",
  "inputs": {
    "person_a_id": "",
    "person_b_id": ""
  },
  "innate_axis_comparison": {
    "per_axis": {
      "autonomy": {
        "a": 0,
        "b": 0,
        "inter_delta": 0,
        "abs_inter_delta": 0,
        "inter_pattern": "innate_alignment",
        "pair_tags": []
      }
    },
    "innate_similarity_band": "moderate",
    "mean_abs_inter_delta": 0,
    "aggregated": {
      "alignments": [],
      "moderate_differences": [],
      "contrasts": []
    }
  },
  "compatibility_events": [],
  "relationship_signals": {
    "natural_affinity": 0,
    "emotional_resonance": 0,
    "communication_alignment": 0,
    "growth_support": 0,
    "stability_potential": 0,
    "relationship_tension": 0,
    "challenge_potential": 0,
    "long_term_potential": 0
  },
  "compatibility_score": 0,
  "score_band": "moderate",
  "free_preview": {
    "compatibility_score": 0,
    "score_band": "moderate",
    "top_harmonizing_signals": [],
    "top_tension_signals": []
  },
  "meta": {
    "rules_version": "v1-lite",
    "truncated_events": { "harmonizing": 0, "tension": 0 },
    "calculated_at": ""
  }
}
```

### `free_preview`

무료 UI·Lite LLM 공통 입력.

* `compatibility_score`, `score_band`
* `top_harmonizing_signals` — 값 상위 2 signal key (이름만, 사주 용어 없음)
* `top_tension_signals` — `relationship_tension` 및 상위 tension 기여 signal 1–2개

### `compatibility_events`

내부·유료 디버그용. **무료 UI 기본 비노출.**  
Lite LLM에는 events 전체가 아닌 `relationship_signals` + `innate_axis_comparison.aggregated` + `pair_tags` 요약만 전달.

---

## Implementation Notes

* 코드 위치 (예정): `runtime/lib/relationship-compat-analyzer.js`
* `analysis-context.js` 확장 시 Person A/B bundle을 **한 번** 읽고 Lite/Deep tier 분기
* 천간 5합·지지 충/합 표는 [03_Saju_Calculation_Rules.md](../saju/03_Saju_Calculation_Rules.md)와 **단일 구현** (중복 테이블 금지)

---

## Related Documents

| 문서 | 역할 |
|------|------|
| [06_Saju_Compatibility_Architecture.md](06_Saju_Compatibility_Architecture.md) | 레이어·시그널 정의 |
| [04_Lite_Report_Framework.md](04_Lite_Report_Framework.md) | Lite 리포트 섹션 |
| [08_Saju_Compatibility_Report_Framework.md](08_Saju_Compatibility_Report_Framework.md) | Deep 리포트 매핑 |
| [09_Integrated_Compatibility_Framework.md](09_Integrated_Compatibility_Framework.md) | Current+Gap 통합 |
