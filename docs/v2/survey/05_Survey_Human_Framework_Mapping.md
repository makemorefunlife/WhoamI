# 05_Survey_Human_Framework_Mapping.md

## Purpose

설문 응답이 Human Framework 6축으로 어떻게 변환되는지 정의한다.

계산 로직의 정본은 `03_Survey_Scoring_Rules.md` 이다.  
이 문서는 **매핑 관계와 출력 구조**를 설명한다.

---

## Flow

```text
Q1~Q9 응답
    ↓
03_Survey_Scoring_Rules (가중치·델타)
    ↓
Primary / Secondary raw 누적
    ↓
0~100 정규화 (baseline 50)
    ↓
04_Survey_Output_Schema (CurrentSelfProfile)
```

---

## Primary Axes (사용자 노출)

정본: `docs/framework/10_Human_Framework.md`

| Key | 한국어 라벨 |
|-----|------------|
| autonomy | 독립성 |
| connection | 정서적 친밀감 |
| stability | 안정 추구 |
| growth | 성장 추구 |
| control | 계획성 |
| adaptability | 적응성 |

---

## Secondary Axes (내부 분석)

설문 점수화에 사용. UI 기본 노출 X.

`stimulation`, `self_control`, `practicality`, `structure`, `empathy`, `conflict_style`, `resilience`, `recognition`, `energy_style`, `thinking_style`, `decision_style`

---

## Scoring Application Rule

* Q1~Q9: 점수 반영
* Q5: Weight = 2
* Q10: 점수 미반영, `personalization.primary_concern` 만 설정

각 선택지는 Primary·Secondary 델타를 동시에 가질 수 있다.  
축 간 강제 상쇄 없음.

---

## Normalization (Runtime)

```text
axis_score = clamp(50 + sum(weighted_deltas), 0, 100)
```

구현: `runtime/lib/survey-scorer.js`  
데이터: `runtime/data/survey-scoring-map.json`

---

## Output

`04_Survey_Output_Schema.md` 구조 준수.

---

## Related

* Questions: `02_Survey_Questions.md`
* Scoring deltas: `03_Survey_Scoring_Rules.md`
* Lite 해석: `06_Survey_Lite_Interpretation.md`
* Lite Prompt: `docs/prompt/01_Current_Self_Lite_Prompt.md`
