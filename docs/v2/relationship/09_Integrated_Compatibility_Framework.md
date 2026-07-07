# 09_Integrated_Compatibility_Framework.md

## Purpose

**두 사람**의 Current Self · Gap · Behavior를 사주 궁합(`07`)과 **합성**해 Deep 관계 분석 입력을 만든다.

* **계산·매칭만** 한다. 해석 문장은 LLM (`05` Deep Prompt).
* 사주 궁합 정본: [07_Saju_Compatibility_Rules.md](07_Saju_Compatibility_Rules.md)
* Deep 섹션 배분: [08_Saju_Compatibility_Report_Framework.md](08_Saju_Compatibility_Report_Framework.md)
* Behavior 태그: [02_Behavior_Framework.md](02_Behavior_Framework.md)
* Behavior 규칙: [03_Relationship_Behavior_Rules.md](03_Relationship_Behavior_Rules.md)

---

## Product Rule

| Tier | `07` 사주 | `09` 통합 |
|------|-----------|-----------|
| **Lite** | 필수 | **사용 안 함** |
| **Deep** | 필수 | **권장** — 양쪽 Current+Gap 있으면 필수 |

한쪽만 설문 완료 시: Deep는 `07` + 있는 쪽 Gap/Current만 사용, `meta.coverage = partial`.

---

## Input Contract

### Required (Deep full)

| Person | Schema | 필드 |
|--------|--------|------|
| A, B | `05` innate | `innate_self_profile` (이미 `07` 입력) |
| A, B | `survey/04` | `current_self_profile.primary_axes` |
| A, B | `05` gap | `gap_profile` ([01_Gap_Analysis_Rules](../analysis/01_Gap_Analysis_Rules.md)) |
| — | `07` output | `compatibility_lite_profile` |

### Optional

```json
{
  "context": {
    "relationship_type": "romantic | friendship | work | family | unspecified"
  }
}
```

### Forbidden

* 설문·Gap·사주 **재계산**
* `secondary_axes` — v1 통합에 미사용
* Lite tier에서 `09` 호출

---

## Pipeline Position

```text
Person A: CurrentSelf + GapProfile
Person B: CurrentSelf + GapProfile
        +
compatibility_lite_profile (07)
        │
        ▼
09 Integrated Compatibility  (이 문서)
        │
        ├─► compatibility_deep_extension.dominant_themes
        │
        └─► 05 Deep Relationship Prompt + 08 section map
```

---

# Layer 1 — Behavior Tags (per person)

각 사람의 `current_self_profile.primary_axes`에서 [02](02_Behavior_Framework.md) 태그를 **결정론적으로** 추출한다.

### Score level

```text
very_low: 0–20 | low: 21–40 | medium: 41–60 | high: 61–80 | very_high: 81–100
```

### v1 tag derivation (primary_axes → tags)

축 점수 `high`/`very_high` → high 태그, `low`/`very_low` → low 태그. `medium`은 해당 축 태그 **생략**.

| axis | high tag(s) | low tag(s) |
|------|-------------|------------|
| `autonomy` | `independence`, `self_direction` | `shared_decision`, `togetherness_preference` |
| `connection` | `emotional_connection`, `closeness_seeking` | `emotional_distance`, `space_preference` |
| `stability` | `planning`, `structure_preference` | `spontaneity`, `flexibility_preference` |
| `growth` | `growth_drive` | `present_comfort` |
| `control` | `direct_discussion`, `clarity_seeking` | `conflict_avoidance`, `indirect_communication` |
| `adaptability` | `flexibility`, `openness_to_change` | `routine_preference`, `change_resistance` |

출력: `person_x.behavior_tags[]` (문자열 배열, 중복 제거)

---

# Layer 2 — Cross-Person Behavior Rules

[03](03_Relationship_Behavior_Rules.md)의 `rule_id`를 A/B 태그로 매칭한다.

### Trigger evaluation

규칙 YAML의 `trigger.user_a` / `user_b`는 **역할 슬롯**이다.

* Person A 태그가 `user_a` 조건 충족 **且** Person B 태그가 `user_b` 조건 충족 → hit
* **역방향** (A↔B swap)도 동일 rule_id로 한 번 더 검사 — hit 시 `direction: reversed` 기록

`high` in trigger = 해당 태그가 person의 `behavior_tags`에 존재.

### v1 rule catalog (03에 정의된 5건)

| rule_id | feeds theme (08) |
|---------|------------------|
| `planning_vs_spontaneity` | `planning_flexibility_gap` |
| `emotional_connection_vs_distance` | `emotional_processing_gap` |
| `direct_vs_avoidant_conflict` | `recurring_tension_loop`, `repair_style_contrast` |
| `growth_vs_comfort` | `growth_drive_alignment` (inverse tension) |
| `independence_vs_togetherness` | `connection_rhythm_gap`, `control_autonomy_gap` |

### Rule hit output

```json
{
  "rule_id": "planning_vs_spontaneity",
  "direction": "forward | reversed",
  "relationship_effects": [],
  "strengths": [],
  "growth_tip": "",
  "priority": 0
}
```

`priority` = 70 기본 + effect 수×5, cap 95. Deep LLM은 상위 **3건**만 본문에 사용.

---

# Layer 3 — Current Self 6-Axis Comparison (A vs B)

[07](07_Saju_Compatibility_Rules.md) §1.1과 **동일 공식**, 입력만 Current axes.

```text
inter_delta[axis] = current_A[axis] - current_B[axis]
```

동일 threshold → `inter_pattern`: `innate_alignment` | `moderate_difference` | `innate_contrast`  
(키 이름은 07과 통일 — **의미는 “현재 행동” 비교**.)

### Current-only pair tags

| 조건 | tag |
|------|-----|
| contrast on `stability` | `current_pace_gap` |
| contrast on `connection` | `current_intimacy_gap` |
| contrast on `control` | `current_conflict_style_gap` |
| alignment on `growth` | `current_shared_ambition` |

---

# Layer 4 — Per-Person Gap Summary

각 `gap_profile`에서 Deep용 요약만 추출 (문장 생성 없음).

### Person gap slots

| 필드 | 소스 |
|------|------|
| `overall_severity` | `gap_profile.overall_severity` |
| `top_suppressions` | `aggregated.suppressions` 최대 2축 |
| `top_overadaptations` | `aggregated.overadaptations` 최대 2축 |
| `top_energy_leakages` | `aggregated.energy_leakages` 최대 2축 |
| `growth_opportunities` | `aggregated.growth_opportunities` |

### Gap → integrated theme

| 조건 | theme_key |
|------|-----------|
| any `top_suppressions` | `hidden_validation_need` (해당 person) |
| `overall_severity` == `high` | `assumption_blind_spot` |
| growth_opportunity on autonomy/connection | `hidden_validation_need` |

Person A/B 각각 `person_x.gap_themes[]`에 기록.

---

# Layer 5 — Theme Merge (→ 08 Deep)

`07` `relationship_signals` + `pair_tags` + Layer 2–4 출력을 **통합 `dominant_themes`** 로 병합.

### Merge rules

1. Behavior rule hit → 해당 theme **+15 priority**
2. Current `inter_contrast` ≥2 axes → `assumption_blind_spot` **+10**
3. `07` `relationship_tension` ≥ 60 → `recurring_tension_loop` **+12**
4. `07` `growth_support` ≥ 65 + `current_shared_ambition` → `growth_drive_alignment` **+14**
5. Person A/B `hidden_validation_need` 둘 다 → §2·§7·§8 **강화** 플래그 `dual_hidden_needs: true`

정렬 후 상위 **6개** theme → `dominant_themes[]`  
형식: `{ "theme_key": "", "priority": 0, "sources": [] }`

### Conflict resolution ([08](08_Saju_Compatibility_Report_Framework.md))

| 상황 | 우선 |
|------|------|
| Behavior rule vs 사주 signal | **행동·Current 서술** (rule, current contrast) |
| Gap suppression vs innate contrast | Gap = “지금 삶에서 눌린 것”, Innate = “타고난 격차” — **둘 다 유지**, LLM이 층위 분리 |
| 동일 theme 중복 | priority 합산, sources 병합 |

---

## Output Contract — `integrated_compatibility`

```json
{
  "profile_type": "integrated_compatibility",
  "version": "v1",
  "person_a": {
    "behavior_tags": [],
    "gap_summary": {
      "overall_severity": "low",
      "top_suppressions": [],
      "top_overadaptations": [],
      "top_energy_leakages": [],
      "growth_opportunities": []
    },
    "gap_themes": []
  },
  "person_b": { },
  "current_axis_comparison": {
    "per_axis": {},
    "aggregated": {
      "alignments": [],
      "moderate_differences": [],
      "contrasts": []
    },
    "current_pair_tags": []
  },
  "behavior_rule_hits": [],
  "dominant_themes": [],
  "flags": {
    "dual_hidden_needs": false,
    "coverage": "full | partial"
  },
  "meta": {
    "rules_version": "v1",
    "calculated_at": ""
  }
}
```

### `coverage`

| 값 | 조건 |
|----|------|
| `full` | A/B Current + Gap 모두 존재 |
| `partial` | 한쪽 이상 누락 — Deep는 §7·§8 중 누락 쪽 **생략** |

---

## Deep Bundle Assembly

`05` Deep Prompt 입력 권장 구조:

```json
{
  "compatibility_lite_profile": {},
  "integrated_compatibility": {},
  "compatibility_deep_extension": {
    "dominant_themes": [],
    "meta": { "rules_version": "v1-deep" }
  },
  "context": {}
}
```

`compatibility_deep_extension.dominant_themes` = `07` Deep themes ∪ `09` `dominant_themes` (priority 재정렬, cap 6).

---

## Implementation Notes

* 코드 (예정): `runtime/lib/integrated-compat-analyzer.js`
* Behavior tag 표는 v1 하드코드 — 확장 시 `02`와 동기화
* Rule catalog v1 = `03`의 5 rules — 추가 시 `03` + 이 문서 동시 갱신

---

## Related

| 문서 | 역할 |
|------|------|
| [07_Saju_Compatibility_Rules.md](07_Saju_Compatibility_Rules.md) | 사주 궁합 |
| [08_Saju_Compatibility_Report_Framework.md](08_Saju_Compatibility_Report_Framework.md) | 섹션 매핑 |
| [05_Premium_Report_Framework.md](05_Premium_Report_Framework.md) | UX 섹션 |
| [05_Deep_Relationship_Prompt.md](../prompt/05_Deep_Relationship_Prompt.md) | LLM *(미작성)* |
