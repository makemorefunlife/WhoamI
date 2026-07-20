# 012 — Family Part2 E `home_climate` 감사 (구현 금지)

**날짜:** 2026-07-20  
**상태:** 감사만. 코드·threshold·비교표 미수정.  
**질문 후보:** “이 가족 관계에서는 갈등이 어떤 방식으로 쌓이고, 집 안 분위기가 얼마나 쉽게 긴장되는가?”

---

## 다섯 개념 분리 (섞지 말 것)

| 개념 | person/pair/time | primitive | 현재 signal | 현재 소비 위치 | E 사용 적합성 | 중복 위험 |
|------|------------------|-----------|-------------|----------------|---------------|-----------|
| 1. 개인 갈등 반응 | person | 십신 argmax | A `correction_style` / de-escalation 5 archetype | 비교표 A, Part5 de-escalation | **E에 넣지 말 것** — A 전용 | A와 완전 중복 |
| 2. 둘 사이 마찰 | pair | seal_excess·smother + punishment_count + karma | `nagging_*` | A 의미, Part5 nagging 처방 | **E에 넣지 말 것** — A pair | A와 중복 |
| 3. 집 안 구조적 긴장 | person(차트 내 형) → pair 집계 가능 | 년·월·일 지지 **형** + 년주 tension | `home_punishment` / `family_conflict_index` | PersonCore bake-in; nagging에 count만 재사용 | **E 후보 핵심** | nagging이 count를 쓰지만 질문은 “잔소리 마찰”≠“집 분위기 긴장” |
| 4. 시기 운의 압력 | time / pair cross | 궁위 충형·원진·귀문 등 | destiny `risk` (`FamilyScoringSignals`) | Part4 destiny / snapshot risk% | **정적 Part2 축에 넣지 말 것** | E에 넣으면 운·성향 혼동 |
| 5. 회복 능력 | person / psych | 신강신약; 11축 resilience | gathering_recovery; psych resilience | 비교표⑤; psych→destiny hint | **E에 넣지 말 것** | 분위기≠회복 |

---

## 핵심 확인 답

### home_punishment = person signal
- `extractFamilySignals`: 해당 원국의 년·월·일 지지 **형** hits + count + `family_conflict_index`.
- **pair가 아님.** pair는 `nagging`이 양측 `punishment_count`를 합산해 쓸 뿐.

### family_conflict_index가 재는 것
- `punishmentHits.length * 25 + yearRel.tension.length * 10` (clamp 0–100).
- **가내 형살·년주 긴장량**이지, 둘의 대화 스타일·잔소리 빈도가 아님.

### origin_family_tension vs home_punishment
- tension: hyoshin / sealExcess / yearPalace 충·형(월·일) → `needsStrongBoundary` (marriage 원가족 경계).
- punishment: 형 중심 + year tension 참고 점수.
- **겹치는 재료(년주 긴장) 있으나 공식·목적 다름.** B에서 tension 제외 유지. E에 tension을 본체로 쓰면 원가족 거리 축 부활.

### year_karma를 정적 성향 축에?
- 년주 긴장 지수 — 원국 구조이지만 “올해 운” 서사와 혼동되기 쉬움.
- **E 본체 비권장.** pair `combined_karma_tension`은 이미 nagging에 섞임 → A와 더 겹침.

### johu (`gathering_temperature`) Family 핵심 축에서 제거?
- 조후 = 모임 **대화 온도**(계절/월지), 갈등 축적·집 긴장과 **다른 질문**.
- E로 **교체 후보로 타당**(슬롯 재활용). 단 johu 정보를 완전히 버리기보다 Part2 비핵심·보조로 강등 가능.

### A correction friction vs E
- A pair = nagging (seal/smother + punishment_count + karma) → **교정 장면 마찰**.
- E = 구조적 형·집 분위기 긴장 → punishment **강도/분위기**를 person 비교(+필요 시 pair 집계)로.
- **질문·레이어 분리 가능.** E가 nagging_band를 다시 쓰면 실패.

### Part4 destiny risk / Part5 de-escalation SSOT
- destiny risk: pair palace 충형·원진·온도극단 — **E home_punishment와 다른 그래프**.
- de-escalation: child 십신 반응 — **A와 공유**, E와 무관.
- 공유: E person `family_conflict_index`를 Part5 “집 분위기 높을 때” 톤 조절에 **후속 연결 가능**(이번 감사 범위 밖 구현).

---

## E 후보 판단

| 옵션 | 판정 |
|------|------|
| **A. 독립 축 유지** | **조건부 채택** — person `home_punishment.family_conflict_index`(또는 punishment_count band) 좌/우 + pair는 **신규 단순 집계**(예: max/avg)만, **nagging 재사용 금지** |
| B. Part4 destiny로 이동 | 기각(본체) — destiny는 cross palace/신살 리스크, 형살 집 분위기와 다름. 교차 참조만 |
| C. Part5 only | 보조 — 표 없이 처방만 하면 사용자 질문(비교) 미충족 |
| D. 제외 | 기각 — 고유 primitive(형/family_conflict) 존재 |

**권장:** **A — 독립 축**, 단:
- person 좌/우 비교 **가능** (각자 conflict index / band)
- pair meaning = 양측 구조 긴장 조합(신규 얇은 함수, umbilical/nagging과 입력 공유 최소화; punishment만)
- **year_karma 본체 제외**
- **johu 행(⑥)을 E로 교체**하는 방향이 슬롯상 자연스러움(구현 시 별도 확인)
- 11축 conflict/self_control/resilience = **미사용 또는 enrichment only** (bucket 불변)

---

## 구현 시 예상 변경 범위 (아직 금지)

- `PairFamilySignals`에 climate band 추가 여부 검토
- `familySajuCompareTable` ⑥ 또는 다른 구형 행 → `home_climate`
- 테스트·locale·cache id
- A/B/C·umbilical·nagging 공식 **불변**
