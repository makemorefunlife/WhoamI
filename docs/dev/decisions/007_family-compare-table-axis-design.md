# 007 — family "한눈에 비교" 6행 축 설계 (006 로드맵 Step2, 코드 미수정)

**날짜:** 2026-07-20
**상태:** 축 확정 — 계산식/bucket 설계 완료, 구현(Step3) 대기

`006_master-migration-roadmap.md` Step2 산출물. 6개 축과 각 계산식·bucket 후보를 설계했다. **아직 코드/카피는 작성하지 않았다.** Step5에서 실제 표본으로 독립성·강도 검증 후 최종 threshold를 확정한다.

## 확정 축 6개

| 축 | 공통 primitive | Family 파생 방식 | bucket 후보 | 같은 bucket 내 강도차 표현 | 예상 중복 축 | 위험한 과잉 해석 |
|---|---|---|---|---|---|---|
| ① 잔소리·지적을 받을 때의 반응 | `ten_god_dominant_category`(005 문서 B후보, argmax) | 5개 카테고리(재/관/식/인/비겁)를 "지적받을 때 반응"으로 재해석 매핑. **주의: 코드 재사용은 marriage/friend에서 검증됐지만, "이 카테고리가 잔소리 반응을 잘 설명한다"는 의미 매핑 자체는 이 앱이 새로 만든 가설이라 미검증 — 계산 강도(코드)와 의미 강도(해석)를 구분해서 표시할 것** | 5-way(food/self/seal/officer/wealth) | 불가 — argmax는 우세 정도(마진) 무관하게 1위만 봄 | ④(food vs seal+officer 상대비교), ⑤(support/drain 상대비교) — 셋 다 같은 5-bucket 공간의 다른 조합, Step5 실측 필요 | "잔소리 반응"이 성격 전체로 확대 해석되지 않도록 스코프 한정. 십신 이론의 전통적 해석이 아니라 이 앱의 매핑 가설임을 인지 |
| ② 가족과 편안한 정서적 거리 | `origin_family_tension`(Step1 신규) | `needsStrongBoundary`(boolean)를 그대로 bucket화. **person 단위 성향만 — 상대방과 무관하게 이 사람 혼자 원가족과 얼마나 거리를 두고 싶어하는지로 한정, pair 처방의 탯줄분리지수와 레이어를 분리** | 2-way(true/false) 우선. 3-way(tensionIndex를 low/medium/high로 세분)는 새 컷오프 발명이 필요해 이번엔 보류, Step5 분포 확인 후 재검토 | 가능 — 내부 `tensionIndex`(0-100 연속값)를 콤보 문구 세기 조절용으로 활용 가능(marriage처럼 boolean 유지하되 문구 톤만 조절) | 없음(person-level bucket vs pair-level 단일지수라 계산 레이어가 다름) — 다만 리포트 안에서 "원가족 얘기"가 두 번 나오는 것처럼 보이지 않게 문구 단계에서 구분 필요 | needsStrongBoundary=true를 "가족을 안 좋아한다"는 감정적 결론으로 확대 해석 금지 — 순수 물리적/정서적 거리감으로 한정 |
| ③ 가족에게 마음을 표현하는 방식 | `dominant_element`(005 문서 B후보, 오행 argmax) | 오행 5색 → 가족 맥락 표현 방식 라벨(friend의 애정언어와 같은 매핑 철학, 다른 도메인이라 재사용 허용 범위) | 5-way(목화토금수) | 불가 — argmax 방식 | 없음 — 6축 중 원천 데이터가 십신이 아닌 오행이라 가장 독립적 | 애정의 크기·효심·진심은 판단 금지, 표현 스타일 차이로만 서술(friend 축③에서 이미 학습한 원칙 재적용) |
| ④ 가족을 돌볼 때 공감과 기준의 균형 | `parenting_style_lean`(Step1, marriage 재노출) | "부모가 자녀를" 이 아니라 "이 사람이 누군가를 돌볼 때"로 역할 무관 일반화. marriage의 tie-break(`food>=seal+officer`→empathy) 그대로 재사용 | 2-way(empathy/structure) | 불가(discrete) — 단 food/seal+officer 원점수 차이는 내부에 있어 확장 여지 있음 | ①(argmax), ⑤(support/drain) — 같은 5-bucket 공간, Step5 실측 필요 | "실제 부모로서의 양육 방식"으로 단정 금지 — 자녀 쪽 응답자에게도 성립하는 "돌봄 상황에서 감정 vs 원칙" 일반 성향으로 스코프 유지 |
| ⑤ 가족행사 후 에너지 회복 방식 | `day_master_strength_band`(신강신약, margin=1) | strong/weak/balanced 3-way. **margin=1은 friend에서 검증된 값을 잠정 채택한 것 — Step5에서 margin=1 vs margin=2 분포를 실제 비교해 재확정** | 3-way(strong/weak/balanced) | 가능 — support-drain 원점수 차이로 friend 배터리축처럼 콤보 문구(6종) 설계 가능 | ①·④와 같은 5-bucket 공간이지만 결합 공식(support=self+seal vs drain=food+officer×1.2)이 명백히 다름 — Step5 실측 필요 | "신강=강한 사람/신약=약한 사람" 우열 구도 금지, 순수 회복 방식 차이로 한정(friend 축④ 원칙 재적용) |
| ⑥ 가족모임의 대화 온도 | `johu_profile`(조후 — 005 문서 모범사례, 기존 SSOT) | `temperature_band`(cold/neutral/hot)를 가족모임 분위기로 재해석 | 3-way(cold/neutral/hot) | 제한적 — `temperature_band`는 이미 heat/moisture 2차원을 1차원으로 압축한 결과라 완전한 세기 표현엔 한계, 필요시 `moisture_score` 별도 활용 여지(이번 범위 아님) | 없음 — 조후는 월지/계절 기반이라 나머지 5축(십신·오행)과 원천 데이터가 다름 | "hot=친밀함/소통 능력 좋음"으로 확대 해석 금지, "cold=관계가 나쁨"이라는 부정적 함의도 배제 — 순수 분위기 온도·반응 리듬으로만 한정 |

## 구조적 관찰

- 6축 중 ①④⑤는 전부 십신 5범주(profileTenGods)의 다른 조합이라 입력 공간이 겹친다. ③⑥은 오행/조후로 원천 데이터가 달라 가장 독립적이다. ②는 십신 + 형충 관계라는 별도 축이 섞여 있어 중간 정도로 독립적이다.
- Step5 진단 스크립트에서 반드시 확인할 것: ①④⑤ 세 축이 실제 표본에서 서로 다른 bucket으로 갈리는지(friend/marriage 때처럼 실측 없이는 "설계상 다른 공식"이라는 것만으로 독립성을 보장할 수 없음).
- ①번 축은 "계산 재사용 검증됨"과 "의미 매핑 검증됨"을 문서·문구 단계에서 명확히 분리 표기해야 한다(사용자 지적 반영) — 계산 강도는 높지만 해석 강도는 미검증으로 별도 표시.

## 다음 단계

Step3(family 비교표 구현)에서 위 계산식·bucket 그대로 코드화하고, Step5에서 실측 독립성·강도를 검증한다. 카피 문구는 이번 문서에서 확정하지 않았다 — bucket 후보까지만.
