# 09_Visualization_Guide.md

## Purpose

Current Self·Innate Self **6축 레이더 차트** 시각화 규칙을 정의한다.

데이터 계산은 하지 않는다. Schema와 점수화 결과를 **어떻게 보여줄지**만 다룬다.

---

## Chart Type

6-Axis Radar Chart (Human Framework primary axes)

---

## Axes (고정 순서)

1. autonomy — 독립성
2. connection — 정서적 친밀감
3. stability — 안정 추구
4. growth — 성장 추구
5. control — 계획성
6. adaptability — 적응성

시계 방향, 1번 축을 12시 방향에 배치.

---

## Scale

* 0 ~ 100
* 그리드: 20 단위 (0, 20, 40, 60, 80, 100)
* 기본 baseline 참고선: 50 (옵션, 무료 비교 UI에서만)

---

## Data Sources

| 화면 | 데이터 |
|------|--------|
| Current Self (Step 5) | `current_self.primary_axes` |
| Innate Self (Step 8) | `innate_self_profile.primary_axes` |
| Gap Preview (Step 9) | 두 프로필 overlay 또는 나란히 2개 |

Schema:

* Survey: `docs/survey/04_Survey_Output_Schema.md`
* Saju: `docs/saju/05_Saju_Output_Schema.md`

---

## Free vs Paid Display

### Free (Step 5, 8, 9)

* 레이더 + 축 점수 숫자
* Lite 한 줄 요약 (Prompt 출력)
* **Gap 해석 문장 없음** (점수 차이만)

### Paid

* 동일 차트 + 심화 해석·Gap Narrative

---

## Gap Preview (Step 9)

각 축에 대해:

```text
{axis_label}
Current: {current_score}
Innate: {innate_score}
Delta: {innate - current}
```

Delta 색상 (접근성 고려):

* |delta| <= 10: neutral
* delta > 10: innate higher emphasis
* delta < -10: current higher emphasis

해석 문장은 Phase C (`03A_Gap_Analysis_Prompt`) 이후.

---

## Mobile First

* 단일 차트 최소 280px
* Step 9 비교: 세로 스택 (Current 위, Innate 아래) 또는 탭 전환
* 축 라벨 2줄 허용 (한국어)

---

## Accessibility

* 색만으로 의미 전달 금지 (숫자·라벨 병기)
* 대비 WCAG AA 목표

---

## Related

* User Flow Step 5/8/9: `01_Core_User_Flow.md`
* Master Map: `08_Master_Logic_Map.md`
