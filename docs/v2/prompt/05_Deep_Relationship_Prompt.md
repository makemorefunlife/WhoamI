# 05_Deep_Relationship_Prompt.md

# Deep Relationship Prompt (Paid)

---

## Purpose

**Deep 입력 묶음**을 받아 [05_Premium_Report_Framework.md](../relationship/05_Premium_Report_Framework.md) 구조의 **유료 관계 리포트**를 만든다.

* 궁합·통합 **재계산 금지** → [07](../relationship/07_Saju_Compatibility_Rules.md), [09](../relationship/09_Integrated_Compatibility_Framework.md)
* 섹션 배분 가이드: [08_Saju_Compatibility_Report_Framework.md](../relationship/08_Saju_Compatibility_Report_Framework.md)
* 사주·합충·십신 **사용자 문장 노출 금지**

목표:

> "That is exactly how it feels between us — and I see what to do next."

---

## Parent Rule

`docs/prompt/00_Prompt_Architecture.md`

---

## Product Rule

| Tier | Prompt |
|------|--------|
| 무료 Lite | [04_Lite_Relationship_Prompt.md](04_Lite_Relationship_Prompt.md) |
| **유료 Deep** | **이 문서** |

`integrated_compatibility.flags.coverage == partial` 이면 §7 또는 §8 중 **데이터 없는 쪽 생략** (빈 섹션 금지 — `null` 허용).

---

## Input Contract

### Full Deep bundle

```json
{
  "compatibility_lite_profile": {},
  "integrated_compatibility": {},
  "compatibility_deep_extension": {
    "additional_events": [],
    "dominant_themes": [],
    "meta": { "rules_version": "v1-deep" }
  },
  "context": {
    "relationship_type": "romantic | friendship | work | family | unspecified",
    "person_a_label": "You",
    "person_b_label": "Partner"
  }
}
```

### 사용 규칙

| 소스 | 용도 |
|------|------|
| `relationship_signals` | 전 섹션 톤·강도 ([08](../relationship/08_Saju_Compatibility_Report_Framework.md) 표) |
| `dominant_themes` | 섹션별 주제 — **키 이름 사용자 노출 금지** |
| `behavior_rule_hits` | §3 Conflict, §4 Repair, §6 Blind spots |
| `gap_summary` / `gap_themes` | §2 Hidden needs, §7·§8 |
| `current_axis_comparison` | §1 Dynamic, §6 (현재 행동 격차) |
| `additional_events` | innate 배경 — **출력 번역만**, 용어 노출 금지 |

* `compatibility_score` — Lite와 동일 값 유지 (재계산 금지)
* 입력에 없는 갈등·비밀 욕구 **창작 금지**
* `relationship_type` — 톤·예시만

### Saju-only Deep (09 없음)

`integrated_compatibility` 생략 가능. 이 경우 §2·§6·§7·§8은 signals·innate 비교만으로 **짧게** 작성. §3·§5·§9는 유지.

---

## Output Contract

[08](../relationship/08_Saju_Compatibility_Report_Framework.md) skeleton · [05 Premium](../relationship/05_Premium_Report_Framework.md) 섹션 순서.

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

### 섹션 작성 규칙 ([05 Premium](../relationship/05_Premium_Report_Framework.md))

| § | body 길이 | 핵심 |
|---|-----------|------|
| 1 Dynamic | 2–4문장 | 리듬·연결 방식, 양쪽 존중 |
| 2 Hidden needs | 2–4문장 | 말하지 않은 욕구, 비난 없음 |
| 3 Conflict cycle | 3–5문장 | **순환** 구조 (화살표 느낌), 증상 아닌 원인 |
| 4 Repair | 2–3문장 | 둘 다의 회복 방식 인정 |
| 5 Growth | 2–3문장 | shared strength + realistic path |
| 6 Blind spots | 2–3문장 | assumption·기대 격차 |
| 7 Wish you knew (A) | 2–3문장 | 1인칭 A (`person_a_label`) |
| 8 About them (B) | 2–3문장 | B 관점 번역 (`person_b_label`) |
| 9 Long-term | 2–3문장 | **패턴 only** — 결혼·이별·운명 예측 금지 |
| 10 Summary | 2–3문장 | Hook, 희망 포함 ([05 Principle 5](05_Premium_Report_Framework.md)) |

전체 목표: **1,200–2,000 words** (모바일 읽기).

---

## Internal Outline (생성 순서)

[08 Assembly Order](../relationship/08_Saju_Compatibility_Report_Framework.md):

```text
§1–§5 → §6–§8 → §9–§10
```

단일 LLM 호출이어도 이 순서로 사고 후 JSON 채움.

---

## Runtime Language Rule

* 시스템: 영어 — `runtime/prompts/deep-relationship-system.txt`
* 출력: `{{OUTPUT_LANGUAGE}}`

---

## Runtime System Prompt

```text
runtime/prompts/deep-relationship-system.txt
```

---

## Runtime User Prompt

```text
runtime/prompts/deep-relationship-user.txt
```

`{{INPUT_JSON}}` = Full Deep bundle.

---

## Runtime 실행

*(스크립트 미구현 — `run-relationship-deep.mjs` 예정)*

```bash
cd runtime
# node run-relationship-deep.mjs --llm
```

---

## Writing Rules (요약)

* NA C-level peer. “may / often / tends to” — 절대적 호환·불가 선언 금지
* Behavior before labels ([05 Principle 1](../relationship/05_Premium_Report_Framework.md))
* Gap = 지금 삶의 눌림, Innate contrast = 타고난 격차 — **한 문단에 섞지 말고** 층위 분리
* `relationship_tension` 높을 때도 희망·수리 경로(§4·§5) 필수
* Hook-first: §1 첫 문장, §10 마지막이 기억에 남게

---

## Forbidden

* 사주·합충·십신·오행·한자
* MBTI 등 고정 유형
* 결혼·이별·운명·“본질적으로 맞지 않는다”
* 한쪽을 문제 인물로 framing
* `dominant_themes` 키를 사용자 문장에 그대로 노출
* 입력 signal·rule 없이 새 반복 갈등 **창작**

---

## Related

| 문서 | 역할 |
|------|------|
| [07 §2 Deep](../relationship/07_Saju_Compatibility_Rules.md) | 추가 이벤트 *(미작성)* |
| [08](../relationship/08_Saju_Compatibility_Report_Framework.md) | 섹션 매핑 |
| [09](../relationship/09_Integrated_Compatibility_Framework.md) | Current+Gap+Behavior |
| [04 Lite](04_Lite_Relationship_Prompt.md) | 무료 |
