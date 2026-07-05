# 04_Lite_Relationship_Prompt.md

# Lite Relationship Prompt (Free)

---

## Purpose

Rules 엔진이 계산한 **`compatibility_lite_profile`**을 받아, 두 사람의 **무료 관계 Lite 리포트**를 만든다.

* **궁합 계산·스코어 재산출 금지** → [07_Saju_Compatibility_Rules.md](../relationship/07_Saju_Compatibility_Rules.md)
* 사주·천간·지지·합충 **용어를 사용자 문장에 노출하지 않는다**
* 성격 유형 라벨·운명론·“불가능한 관계” 표현 금지

목표:

> "That explains why we click — and where we might miss each other."

---

## Parent Rule

`docs/prompt/00_Prompt_Architecture.md`

리포트 골격: [04_Lite_Report_Framework.md](../relationship/04_Lite_Report_Framework.md)

---

## Product Rule

| 구분 | Rules | LLM (이 문서) |
|------|-------|---------------|
| **무료 Lite** | `07` §1 Lite + §3 Lite | **이 Prompt** |
| **유료 Deep** | `07` §2 + §3 Deep | `05_Deep_Relationship_Prompt.md` *(미작성)* |

`compatibility_events` raw 배열은 **입력에서 제외**하거나 무시한다.

---

## Input Contract

Calculation: [07_Saju_Compatibility_Rules.md](../relationship/07_Saju_Compatibility_Rules.md)  
Architecture: [06_Saju_Compatibility_Architecture.md](../relationship/06_Saju_Compatibility_Architecture.md)

Runtime 최소 입력:

```json
{
  "compatibility_lite_profile": {
    "profile_type": "compatibility_lite_profile",
    "innate_axis_comparison": {
      "per_axis": {},
      "innate_similarity_band": "high | moderate | low",
      "aggregated": {
        "alignments": [],
        "moderate_differences": [],
        "contrasts": []
      }
    },
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
    "score_band": "strong | moderate | developing",
    "free_preview": {
      "top_harmonizing_signals": [],
      "top_tension_signals": []
    }
  },
  "context": {
    "relationship_type": "romantic | friendship | work | family | unspecified",
    "person_a_label": "You",
    "person_b_label": "Partner"
  }
}
```

### 사용 규칙

* `relationship_signals`, `innate_axis_comparison`, `compatibility_score`, `score_band`만 근거로 사용
* `per_axis` 숫자를 사용자에게 직접 읽어주지 않는다 (패턴→생활 언어)
* `inter_pattern`, `pair_tags`는 내부 라벨 — 출력에 그대로 쓰지 않고 번역
* 입력에 없는 갈등·강점 **추가 금지**
* `relationship_type`은 톤·예시 선택에만 사용 (새 사실 생성 금지)

### Signal → 생활 언어 (내부 번역 가이드)

| signal key | 사용자-facing 테마 |
|------------|-------------------|
| `natural_affinity` | 끌림, 호기심, 자연스러운 연결 |
| `emotional_resonance` | 감정 이해, 편안함, 공감 |
| `communication_alignment` | 말하는 방식, 갈등 처리, 설명 방식 |
| `growth_support` | 함께 성장, 서로 밀어주는 힘 |
| `stability_potential` | 일관성, 신뢰, 예측 가능성 |
| `relationship_tension` | 오해, 기대 차이, 마찰 |
| `challenge_potential` | 차이가 자극이 되는 지점 |
| `long_term_potential` | 장기적으로 맞물리는 느낌 |

---

## Output Contract

[04_Lite_Report_Framework.md](../relationship/04_Lite_Report_Framework.md) 섹션 대응.

```json
{
  "report_type": "relationship_lite",
  "language": "{{OUTPUT_LANGUAGE}}",
  "compatibility_score": 0,
  "score_band": "strong | moderate | developing",
  "why_you_click": {
    "title": "",
    "body": ""
  },
  "potential_friction": {
    "title": "",
    "body": ""
  },
  "communication_tip": {
    "title": "",
    "body": ""
  },
  "one_line_summary": "",
  "premium_teaser": {
    "body": ""
  },
  "evidence_notes": {
    "primary_signals_used": [],
    "confidence_level": "low | medium | high"
  }
}
```

### 섹션 규칙

| 섹션 | 규칙 |
|------|------|
| `why_you_click` | harmonizing signals 1–2개만. 비난·갈등 없음 |
| `potential_friction` | tension 1개만. 행동·기대 차이로 설명, 탓하지 않음 |
| `communication_tip` | 실행 가능 1가지. 최대 2문단 |
| `one_line_summary` | 기억에 남는 한 줄 |
| `premium_teaser` | 호기심 유발. Lite 가치를 깎지 않음 |

`compatibility_score`는 입력값을 **그대로** 복사 (재계산 금지).

---

## Runtime Language Rule

* 시스템 지시: **영어** (`runtime/prompts/lite-relationship-system.txt`)
* 사용자 출력: `{{OUTPUT_LANGUAGE}}` (기본 English)

---

## Runtime System Prompt

```text
runtime/prompts/lite-relationship-system.txt
```

---

## Runtime User Prompt

```text
runtime/prompts/lite-relationship-user.txt
```

`{{INPUT_JSON}}`에 위 Input Contract JSON을 넣는다.

---

## Runtime 실행

*(스크립트 미구현 — `run-relationship-lite.mjs` 예정)*

```bash
cd runtime
# node run-relationship-lite.mjs --llm
```

---

## Writing Rules (요약)

* NA 시장, C-level peer 톤. “항상/절대” 금지 → “often / may / tends to”
* 두 사람 모두 존중. 한쪽만 문제로 framing 금지
* `score_band` == `developing` → “나쁜 궁합”이 아니라 **차이와 성장 여지**
* 전체 300–600 words 목표 ([04](../relationship/04_Lite_Report_Framework.md))
* Hook-first: 첫 문장에 인식 포인트

---

## Forbidden

* 印, 冲, 합, 십신, 오행, 사주, 별자리식 운명
* MBTI·Enneagram 등 고정 유형 라벨
* `compatibility_events` 내용을 추론해 서술
* 입력 signal보다 강한 확정적 호환/불호환 선언

---

## Related

| 문서 | 역할 |
|------|------|
| [07_Saju_Compatibility_Rules.md](../relationship/07_Saju_Compatibility_Rules.md) | 입력 계산 |
| [04_Lite_Report_Framework.md](../relationship/04_Lite_Report_Framework.md) | UX 섹션 |
| [05_Deep_Relationship_Prompt.md](05_Deep_Relationship_Prompt.md) | 유료 *(미작성)* |
