# 005 — "한눈에 비교" 표/핵심 스코어링 축의 신호 레이어 감사 (조사 전용, 코드 미수정)

**날짜:** 2026-07-20
**상태:** 조사 완료 — 설계 결정 대기 (코드 변경 없음)

## 배경

부부(marriage/cohabitation) 비교표 6행 중 4행이 실제 테스트 유저 2명에게 동일하게 나오는 문제를 조사하다가, 사용자가 더 근본적인 가설을 제기함:

> "PersonCore SSOT와 각 관계 리포트 사이에 도메인별 결정론적 signal layer가 충분히 없어서, 각 도메인이 로컬 십신 카운트와 threshold를 직접 만들어 쓴 데 있다."

이 문서는 그 가설을 5개 관계유형(friend/work/family/marriage·cohabitation, romantic 제외 — 구조가 다름, `004` 문서 참조) 전체에 대해 검증한 결과다. **코드는 전혀 수정하지 않았고, 카피 문구도 새로 쓰지 않았다.** 목적 구조:

```
Saju Raw Facts → PersonCore SSOT → Domain-specific deterministic signals → Pair comparison → Copy/UI
```

---

## 1. 도메인별 8열 감사표

범례 — SSOT 사용: **Y**=PersonCore `domain_signals`/`pair_domain_signals`를 실제로 읽음 / **N**=도메인 파일에서 raw 십신·오행을 직접 재계산 / **Y(조건부)**=있으면 SSOT 우선, 없으면 로컬 폴백.

### 1-1) 친구 (`lib/relationship/friend/friendSajuCompareTable.ts`, v4)

| 축 | source (file:function) | SSOT | raw직접읽기 | 로컬threshold | 신호재사용 | pair비교 | copy문제 |
|---|---|---|---|---|---|---|---|
| 일상공유&연락템포 | `resolveRhythmBand`(일간 양간/음간, 파일 내부) | N | Y(`chart.dayStemCode`) | 없음(이진 lookup) | work표 행6과 로직 중복(별파일 동일 구현) | bucket 동치 | 낮음 |
| 서운함 표출방식 | `resolveDominantCategory`(십신 argmax, 파일 내부) | N | Y(`profileTenGods`) | 없음(argmax) | marriage `household_stress`와 로직 중복(별파일 동일 구현) | bucket 동치 | 낮음 |
| 애정언어&의리스타일 | `FriendDnaProfile.dominantElement`(사전계산됨) | N | Y(오행 카운트) | 없음(argmax) | 없음 | bucket 동치 | 낮음(2026-07-20 "마음 크기 동일" 문구 삭제 완료) |
| 우정배터리충전 | `resolveFriendStrengthBand`(margin=1, 파일 내부 로컬 재계산) | N | Y(오행 생/극 직접) | **Y** margin=1 (공용 `estimateStrengthBalance`는 margin=2, 의도적으로 분리) | 공용 함수와 원리 중복(다른 margin) | 콤보표(6종) | 낮음 |
| 노는코드&총무기질 | `resolveWealthOfficerBand`(0/1/2+, 파일 내부) | N | Y(`profileTenGods().wealthOfficer`) | **Y** `>=2`/`>=1` 컷 | cohabitation SSOT의 `economic_dominance_band`와 동일 개념을 로컬 재발명 | 3-band 동치 | 낮음 |
| 티키타카대화리듬 | `resolveFoodBand`(0/1/2+, 파일 내부) | N | Y(`profileTenGods().food`) | **Y** `>=2`/`>=1` 컷 | 공용 `resolveTikitaka`(Social DNA 카드)와 원리 중복(다른 세분화) | 3-band 동치 | 낮음 |

### 1-2) 동료/work (`lib/relationship/workColleague/sajuCompareTable.ts`) — subagent 조사

| 축 | source | SSOT | raw직접읽기 | 로컬threshold | 신호재사용 | pair비교 | copy문제 |
|---|---|---|---|---|---|---|---|
| 공사 구분선(boundary) | `resolveWorkCategory` → officeLanguage.ts | Y(조건부, `WorkSajuSignals.month_geokguk`) | 폴백 경로에서 Y | 없음 | **feedback행과 완전 동일 신호, 라벨만 다름** | 동치 | 있음 |
| 피드백 수용스타일(feedback) | boundary와 동일 호출 | boundary와 동일 | 동일 | 없음 | **boundary와 100% 동일 함수 재사용(파일 docblock이 자인)** | 동치 | 있음 |
| 협업시너지포지션 | `dominantElement(chart)` | N | Y | 없음(argmax) | 없음, 고유 | 동치 | 있음 |
| 오피스번아웃대처 | `chart.dayBranchCode`→lookup | N | Y | 없음(12지지 lookup) | officeLanguage.ts 내 다른 카피(`BRANCH_CRISIS_STYLE` 등)와 같은 소스 병행 사용 | 정확일치만 same(인접지지도 전부 diff) | 있음 |
| 딜메이킹&추진기질 | `resolveRiskBand(strengthA.label)` — **romantic 도메인 파일**(`estimateStrengthBalance`) 재사용 | N | Y | Y margin=2, work파일에서 라벨을 문자열 `.includes("신강")`로 재파싱(취약) | 원래 경계문구용 값을 표로 전용(轉用) | 동치 | 있음 |
| 보고&협업리듬 | `resolveRhythmBand(dayStemCode)` — 파일 내부 신규 | N | Y | 없음(이진) | 없음, 고유 | 동치 | 있음 |

추가 발견: `pairWorkSignals()`(PersonCore SSOT, `micromanaging_poison_index`/`leadership_conflict_index`)는 실존하지만 처방(prescription) 레이어만 소비하고 비교표는 전혀 안 씀 — **같은 개념(주도권 다툼)을 비교표와 처방전이 서로 다른 두 시스템으로 각자 계산**.

### 1-3) 가족/family — subagent 조사

**중요:** family에는 marriage/friend/work식 "6행 비교표" 자체가 없다. 3-게이지 스냅샷(`buildFamilySnapshotPanel.ts`)과 처방 2건이 핵심 스코어링 항목.

| 축 | source | SSOT | raw직접읽기 | 로컬threshold | 신호재사용 | pair비교 | copy문제 |
|---|---|---|---|---|---|---|---|
| 정서적유대(bond) | `computeFamilyEventScores` | N | Y(`analyzeFamilyPairSaju` boolean 신호 직접 가산) | Y(하드코딩 가중치 ±20~±30) | overall 등급에도 재사용 | 부모→자녀 단방향 합산, **A/B pair 비교 자체가 없음** | 있음(관계라 하지만 실제론 부모 단독 신호) |
| 성장시너지(synergy) | 동일 함수 | N | Y | Y(`officer>=3&&food>=2` 등) | — | 없음(단일점수) | — |
| 훈육마찰리스크(risk) | 동일 함수, `risk=synergy*0.5` | N | Y | Y | **synergy 파생값 재라벨링, 독립축 아님** | 없음 | 있음("훈육 마찰"인데 실제 입력은 온도차/형충뿐) |
| 탯줄분리지수(처방) | `pairFamilySignals` → `buildFamilyPrescriptions` | **Y** | N | Y(band+index) | `seal_parent.parent_bond_band` 재사용 | band+index 조합 | 낮음 |
| 잔소리트리거(처방) | 동일 SSOT 경로 | **Y** | N | Y | — | band+index 조합 | 낮음 |

핵심 이슈: `FamilySajuSignals`(SSOT)는 존재하지만 3대 게이지(핵심 스코어)는 이를 전혀 안 쓰고 `lib/saju/familyAnalysis.ts` raw 신호를 직접 재계산. SSOT의 `year_karma`/`home_punishment`는 처방 레이어에서만 부분 소비되는 **사실상 사장된(orphaned) 신호**.

### 1-4) 부부·동거/marriage-cohabitation (`lib/relationship/marriage/marriageSajuCompareTable.ts`)

같은 구현(marriage 폴더)이 marriage/cohabitation 두 relationshipKind를 모두 처리하므로 표를 하나로 합침.

| 축 | source | SSOT | raw직접읽기 | 로컬threshold | 신호재사용 | pair비교 | copy문제 |
|---|---|---|---|---|---|---|---|
| 가사/루틴스트레스 | `resolveDominantCategory`(십신 argmax, 파일 내부) | N | Y | 없음(argmax) | **friend `upset_expression`과 로직 100% 중복(별파일)** | 동치 | 낮음 |
| 부부싸움소통 | `communicationArchetype`(explosive/stonewall, marriageConflictCommunication.ts) | N | Y | **Y** `food*2+(food>=2?+2)` / `(seal+officer)+(>=3?+2)`, band컷 `explosive>=stonewall+2` | 침실카드 서사(`buildConflictCommunicationSection`)와 원본 함수 공유(일관성 위해 의도된 재사용) | 콤보표(6종) | 낮음 |
| 밤의리드스타일 | `resolveMannerArchetype`(bedroomProfile.ts) | N | Y | **Y, 구조적 결함 확인** — 주 판정은 `식신`/`정관`/`편재`(좁은 개별 십신)만 보고, 둘 다 미달이면 tie-break가 `self*2` vs `pyeoja*2`로 축소돼 **상관/편관/겁재 위주 프로필은 거의 항상 `self` 우세 → power_leader로 수렴** (실측: A/B 두 사람 모두 상관·편관만 있고 식신·정관·편재가 0이라 이 함수에서 완전히 같은 값 산출) | 침실카드와 신호 공유(의도됨) | 동치 | 낮음 |
| 원가족바운더리 | `analyzeFamilyBoundary`(marriageTenGodAnalysis.ts) | N | Y | **Y** `base20 + hasHyoshin?25 + sealExcess?20 + yearTension?30`, 컷 `>=55` | family의 `seal_parent`/`year_karma`/`home_punishment`(SSOT)와 **개념이 겹치지만 완전히 다른 별도 로직**(원가족 스트레스를 두 도메인이 따로 발명) | boolean 콤보(3종) | 낮음 |
| 자산관리(CFO)기질 | `resolveEconomicBand` | **Y(조건부)** — `cohabitation_signals.wealth_officer_power.economic_dominance_band` 우선, 없으면 로컬 `wealthOfficer` 컷(`>=2 high`/`>=1 medium`) | 폴백시 Y | 폴백 컷 있음 | friend `hangout_planning`이 같은 `wealthOfficer` 원시값을 SSOT 없이 로컬 재발명(중복) | 콤보표(6종) | 낮음 |
| 육아/교육가치관 | `resolveParentingStyle`(marriageTenGodAnalysis.ts) | N | Y | **Y** `food>=2 or food>seal+officer` / `seal+officer>=2 or >food` | family 도메인(부모-자녀 관계 전문 도메인)과 개념 중첩이지만 완전 별도 로직 | 콤보표(3종) | 낮음 |

---

## 2. A/B/C 분류

**A = PersonCore 공통 신호로 승격해야 함** (여러 도메인에서 재사용 가능한 기본 성향) · **B = 도메인별 signal로 유지** (특정 관계 장면에서만 의미) · **C = 현재 구조 그대로 사용 가능**

| 축/개념 | 현재 위치(들) | 분류 | 근거 |
|---|---|---|---|
| 십신 우세 카테고리(5분류 argmax) | friend `resolveDominantCategory`, marriage `resolveDominantCategory`(**동일 함수 2벌 중복**), work `resolveWorkCategory`(변형) | **A** | 이미 3개 도메인이 같은 개념을 각자 파일에 따로 구현. 공용화하면 중복 제거 + 향후 도메인이 재발명 안 해도 됨 |
| 오행 우세 원소(dominant element) | friend `dominantElement`, work `dominantElement` | **A** | 2개 도메인 중복 구현, 순수 raw saju 파생값이라 인당 1회 계산해 캐싱할 성격 |
| 일간 양간/음간 | friend `resolveRhythmBand`, work `resolveRhythmBand`(**동일 로직 2벌**) | **A** | 완전 동일 로직 중복. 단, 단순 lookup이라 우선순위는 낮음 |
| 신강/신약/중화(일간 강약) | romantic `estimateStrengthBalance`(margin=2, 공용), friend 로컬 재계산(margin=1), work가 romantic 함수를 전용(轉用) | **A (긴급)** | 이미 3곳에서 서로 다른 margin으로 따로 구현 중 — 가장 시급한 통합 대상. 하나의 SSOT margin으로 통일하고 필요시 도메인별로 밴드 경계만 다르게 노출 |
| 재관 합산(wealth+officer, economic dominance) | cohabitation SSOT(`economic_dominance_band`, 이미 존재), friend가 SSOT 없이 로컬 재발명 | **A** | SSOT 필드가 이미 있는데 friend가 그걸 안 쓰고 raw로 재계산 — "승격"이 아니라 "기존 SSOT를 friend가 안 쓰고 있음"에 가까움. 우선 friend를 기존 SSOT에 연결하는 게 먼저 |
| 식상(food) 원점수 밴드 | friend `resolveFoodBand`, 공용 `resolveTikitaka` | **B** | 친밀도/텐션 해석이 도메인마다 다르게 쓰일 여지가 있어 원점수 자체는 공용화하되 밴드 경계는 도메인별 유지 여지 있음 — 판단 필요 |
| 원가족 스트레스/바운더리 | marriage `analyzeFamilyBoundary`, family `seal_parent`/`year_karma`/`home_punishment`(SSOT) | **A (긴급)** | 두 도메인이 "원가족과의 관계 스트레스"라는 사실상 같은 개념을 완전히 다른 계산식으로 각자 발명 — 통합하지 않으면 marriage 리포트와 family 리포트가 같은 사람에 대해 모순된 결론을 낼 수 있음 |
| 부부싸움 소통(explosive/stonewall) | marriage `communicationArchetype` | **B** | 침실/갈등이라는 부부 특유 장면 해석이라 도메인 로컬이 맞아 보이나, "갈등 시 반응 스타일"은 friend/work도 유사 개념(서운함 표출방식, 피드백 수용)을 따로 갖고 있어 원점수 레벨(food/seal+officer)은 A로 볼 여지도 있음 |
| 밤의 리드 스타일(manner archetype) | marriage `resolveMannerArchetype` | **B, 단 로직 결함 별도 수정 필요** | 침실 특유 장면이라 도메인 로컬이 맞음. 다만 위에서 발견한 "좁은 십신만 보는 tie-break 결함"은 A/B 분류와 무관하게 그 자체로 고쳐야 함 |
| 육아/교육 가치관(empathy/structure) | marriage `resolveParentingStyle` | **A** | family가 "부모-자녀" 전문 도메인인데 정작 육아 스타일 신호는 marriage에만 있고 family는 안 씀 — family가 이 신호를 필요로 할 가능성이 높아 공통화 후보 |
| 조후(johu, 냉온/건습) | friendship_signals SSOT(이미 존재), work가 이미 재사용 중 | **C** | 이미 SSOT로 존재하고 2개 도메인이 정상적으로 공유 중인 **유일한 모범 사례** |
| CFO 파워 다툼(pair 레벨) | cohabitation `pair_cohabitation_signals.cfo_power_struggle`(SSOT) | **C** | 이미 정식 SSOT pair 신호, 처방 레이어가 정상 소비 중 |
| work 마이크로매니징/리더십충돌(pair) | `pairWorkSignals`(SSOT) | **C(신호 자체는)**, 단 비교표 미연결은 별도 이슈 | 신호 자체는 정상 SSOT이나 비교표가 이걸 안 쓰고 별도 로컬 계산을 쓰는 게 문제(연결 누락) |

---

## 3. 설계 제안 (신규 signal — 이름/의미/입력/계산식/범위/재사용 도메인만. 카피 문구·코드 없음)

### 3-1) PersonCore 공통 primitive (신규 승격 대상)

| 이름 | 의미 | 입력 | 결정론적 계산 | 범위/bucket | 재사용 도메인 |
|---|---|---|---|---|---|
| `ten_god_dominant_category` | 5대 십신 카테고리(재성/관성/식상/인성/비겁) 중 최댓값 | 인당 `TenGodCounts`(`profileTenGods` 출력) | `[food,self,seal,officer,wealth]`에서 argmax, 동률시 고정 우선순위 | enum(5) | friend(서운함 표출), marriage(가사스트레스), work(boundary/feedback 계열) |
| `day_master_strength_band` | 일간 신강/신약/중화 | 인당 오행 카운트 + 일간 오행 | 받치는기운(비겁+인성) vs 소모기운(식상+관성) 비교, margin 고정값 하나로 통일 | 3-band(strong/weak/balanced) | romantic, friend(현재 로컬), work(현재 romantic 함수 전용), 향후 marriage 등 |
| `dominant_element` | 오행 5색 중 최댓값 | 인당 오행 카운트 | argmax | enum(5) | friend(애정언어), work(협업시너지) |
| `day_stem_polarity` | 일간 양간/음간 | 일간 stem code | lookup(5양간 set) | binary | friend(연락템포), work(보고리듬) |
| `wealth_officer_power`(기존 cohabitation SSOT를 공통 레벨로 재노출) | 재성+관성 합산 세력 | 인당 `TenGodCounts` | 이미 정의된 `economic_dominance_band` 그대로, consumer 범위만 cohabitation→전체로 확대 | 3-band(low/medium/high) | cohabitation(기존), friend(노는코드/총무), 향후 work(예산권 등) |
| `origin_family_tension` | 원가족(부모/시가·처가)과의 정서적 긴장도 — marriage `analyzeFamilyBoundary`와 family `seal_parent`+`year_karma`+`home_punishment`를 하나의 공통 계산으로 통합 | 인당 십신(효신/인성과다) + intraHits(연주-일주 교차) | 두 기존 로직 중 실측 검증된 쪽을 기준으로 단일 index+band 산출 | index(0-100) + 3-band | marriage(원가족 바운더리), family(전체 3대 게이지의 실질 입력) |
| `parenting_style_lean` | 공감형(식상 우세) vs 원칙형(인성+관성 우세) | 인당 `TenGodCounts` | `food` vs `seal+officer` 상대비교 | binary(또는 3-band로 tie 구간 명시) | marriage(육아가치관), family(부모 성향 축) |

### 3-2) 도메인별 유지 signal (B — 이미 있거나 신규로 도메인 로컬 유지)

**FriendSignals** (기존 `FriendshipSajuSignals` 확장)
- `food_intensity_band`: 식상 원점수 0/1/2+ — 인당 `TenGodCounts` → 컷 `>=2/>=1` — 재사용: friend만(티키타카 해석은 우정 특유 맥락)

**WorkSignals** (기존 `WorkSajuSignals` 확장)
- `office_burnout_lean`: 일지 12지지 기반 번아웃 대처 성향 — 인당 `dayBranchCode` → lookup — 재사용: work만(오피스 맥락 특유)
- `feedback_vs_boundary_split`(현재 중복 문제 해결용): boundary/feedback 두 축이 지금처럼 완전 동일 신호를 쓸 거면 하나로 합치거나, 둘을 구분하려면 서로 다른 원시 신호(예: boundary=`ten_god_dominant_category`, feedback=`day_master_strength_band`)를 배정 — 재사용: work만

**FamilySignals** (기존 `FamilySajuSignals` 확장)
- 위 공통 `origin_family_tension`을 3대 게이지(정서적유대/성장시너지/훈육마찰)의 실제 입력으로 교체 — 현재 raw 재계산을 대체
- `discipline_friction_index`(훈육마찰 독립화용): 현재 synergy의 파생값(*0.5)이라 독립성이 없음 — food/officer 계열의 별도 raw 조합으로 재정의해야 진짜 독립축이 됨(신규 신호 필요, 근거 없는 값 금지 원칙상 지금은 제안만)

**MarriageSignals / CohabitationSignals** (신규 signals pack — 현재 존재하지 않음, `004` 문서에서도 이미 지적된 공백)
- `conflict_reaction_band`: explosive/stonewall/balanced — 인당 `TenGodCounts` → `communicationArchetype` 그대로 승격 — 재사용: marriage(부부싸움), 잠재적으로 friend/work의 "갈등 반응" 축에도 원점수 재사용 가능
- `bedroom_lead_lean`: sweet_guide/power_leader — **단, 위에서 발견한 tie-break 결함(좁은 십신만 보는 문제)을 먼저 고친 뒤 승격해야 함** — 재사용: marriage만

---

## 4. 결론 요약

1. 사용자 가설(SSOT가 너무 세분화/부족해서 로컬 threshold를 각자 만든다)은 **정확함**. 5개 축 중 SSOT를 실제로 우선 사용하는 축은 marriage `asset_management`(조건부)와 family 처방 2건뿐 — 나머지는 전부 도메인 파일이 raw 십신을 직접 재계산.
2. 최소 3건의 **완전 중복 구현**을 확인함: (a) friend/marriage의 `resolveDominantCategory`, (b) friend/work의 `resolveRhythmBand`(일간 양간/음간), (c) romantic/friend/work가 각각 다른 margin으로 구현한 신강/신약 판정.
3. **개념은 같은데 완전히 다른 계산식**인 케이스 2건을 확인함: (a) marriage의 원가족 바운더리 vs family의 원가족 신호 3종, (b) marriage의 육아가치관 vs family가 안 쓰는 상태.
4. 부부 비교표 ③(밤의 리드 스타일)에서 실측으로 확인된 **진짜 로직 결함**: `resolveMannerArchetype`이 좁은 십신 집합(식신/정관/편재)만 주 판정에 쓰고, 상관/편관 위주 프로필은 전부 tie-break(`self` vs `편재`)로 수렴 — 이번 사용자 리포트에서 A/B 둘 다 여기 걸려 같은 값이 나온 것으로 보이며, 이건 "우연"이 아니라 "설계상 좁은 커버리지"에 가까움.
5. 조후(johu) 신호는 SSOT→2개 도메인 공유가 이미 정상 작동하는 **유일한 모범 사례**라, 새 신호를 설계할 때 이 패턴을 참고하면 됨.

**다음 결정이 필요한 지점:** 위 표의 "A" 항목들을 실제로 PersonCore 레이어로 승격할지(범위가 5개 도메인 전부에 영향 — 큰 변경), 아니면 당장 급한 것(신강/신약 margin 통일, 원가족 긴장도 통합, `resolveMannerArchetype` 결함)만 먼저 고치고 나머지는 각 도메인 로컬로 남길지.
