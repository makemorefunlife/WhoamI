# 03A_Gap_Analysis_Prompt.md

# Gap Analysis Prompt (Paid)

---

## Purpose

Rules 엔진이 계산한 **`GapProfile`**을 받아, Current Self와 Innate Self 사이의 차이를 **유료 해석 문장**으로 만든다.

* **유료 전용.** 무료 Step 9에서는 이 Prompt를 호출하지 않는다.
* Gap **계산·분류**는 하지 않는다 → [01_Gap_Analysis_Rules.md](../analysis/01_Gap_Analysis_Rules.md)
* 사주를 재계산하지 않는다.

목표:

> "That explains why I've been living differently from how I'm naturally built."

---

## Parent Rule

`docs/prompt/00_Prompt_Architecture.md`

개념 참조: `docs/framework/11_Comparison_Framework.md`

---

## Input Contract

Input Schema:

See [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md) → `gap_profile`  
Calculation rules: [01_Gap_Analysis_Rules.md](../analysis/01_Gap_Analysis_Rules.md)

Runtime 최소 입력:

```json
{
  "gap_profile": {
    "profile_type": "gap_profile",
    "per_axis": {},
    "overall_severity": "low | moderate | high",
    "aggregated": {
      "alignments": [],
      "suppressions": [],
      "overadaptations": [],
      "energy_leakages": [],
      "growth_opportunities": [],
      "moderate_gaps": []
    }
  },
  "personalization": {
    "primary_concern": "career"
  }
}
```

### 사용 규칙

* `gap_profile.per_axis`와 `aggregated`만 근거로 사용
* `free_preview`는 무시 (무료 UI용)
* `primary_concern`은 문장 톤·예시 강조에만 사용 (새 근거 생성 금지)
* 입력에 없는 축·패턴 추가 금지

---

## Output Contract

Schema 정본: [05_Saju_Output_Schema.md](../saju/05_Saju_Output_Schema.md) → `gap_analysis`

```json
{
  "report_type": "gap_analysis",
  "language": "{{OUTPUT_LANGUAGE}}",
  "one_line_summary": "",
  "why_the_gap": {
    "title": "",
    "body": ""
  },
  "aligned_areas": {
    "title": "",
    "body": ""
  },
  "key_tension": {
    "title": "",
    "body": ""
  },
  "growth_edge": {
    "title": "",
    "body": ""
  },
  "energy_pattern": {
    "title": "",
    "body": ""
  },
  "decision_hint": {
    "title": "",
    "body": ""
  },
  "small_action": {
    "title": "",
    "body": ""
  },
  "evidence_notes": {
    "primary_signals_used": [],
    "confidence_level": "low | medium | high"
  }
}
```

### 섹션 가이드

| 필드 | 언제 채우나 |
|------|------------|
| `aligned_areas` | `aggregated.alignments`가 있을 때 |
| `key_tension` | suppression / overadaptation / energy_leakage 중 **가장 영향 큰 1개** |
| `growth_edge` | growth_opportunity 또는 억눌린 innate 강점 |
| `energy_pattern` | overall_severity `moderate` 이상 또는 energy_leakage 존재 시 |

빈 섹션은 `""` title/body 또는 생략하지 말고 짧게 "해당 신호 약함" 수준으로 처리하지 않음 — **해당 없으면 body 1문장으로 "현재 데이터상 뚜렷하지 않음" 금지**, 대신 다른 섹션에 흡수.

---

## Runtime Language Rule

* System Prompt: 영어
* 사용자 출력: `{{OUTPUT_LANGUAGE}}`

---

## Runtime System Prompt

정본:

```text
runtime/prompts/gap-analysis-system.txt
```

---

## Runtime User Prompt

정본:

```text
runtime/prompts/gap-analysis-user.txt
```

---

## Writing Rules

### 해석 체인

```text
Gap Signal → Life Pattern → Why it feels this way → Decision-useful insight
```

### 톤

* 차트·점수 설명 X → 삶의 패턴 설명 O
* 기술 라벨(suppression 등)을 그대로 노출하지 않고 일상 언어로 번역
* 가능성 언어 ("~할 수 있다")
* 과장·아부·운명 단정 금지

### 우선순위

1. `energy_leakages` + high severity
2. `suppressions` / `overadaptations`
3. `growth_opportunities`
4. `alignments` (짧게, 균형용)
5. `moderate_gaps`만 있으면 가장 큰 delta 축 1개

**전체 1~2개 스토리만** — Lite보다 길어도 섹션 body 각 1~3문장.

### Strength Spectrum (Growth Edge)

```text
Pattern → How it helps → When overused → Real-life cost → Small rebalancing
```

"Weakness" 제목 사용 금지 → `growth_edge` 사용.

---

## Forbidden

* Gap delta·패턴 재계산
* 사주·설문 재해석
* 입력에 없는 인생 사건·기억 생성
* 무료 프리뷰용 짧은 요약만 생성 (유료 깊이 필요)
* Weakness 라벨
* "you must" / "destined" / 운명·질병·결혼 예측

---

## Pipeline

```text
GapProfile (Rules)
    → 03A (this)
    → gap_analysis JSON
    → 03D Deep Report (Gap 섹션 입력)
```

See `docs/guide/10_Pipeline_Architecture_v1.md`

---

## Related

* Rules: [01_Gap_Analysis_Rules.md](../analysis/01_Gap_Analysis_Rules.md)
* Framework: [11_Comparison_Framework.md](../framework/11_Comparison_Framework.md)
