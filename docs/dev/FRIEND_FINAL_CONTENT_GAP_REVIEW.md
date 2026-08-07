# Friend Final Content Gap Review & Product Composition Audit

**문서 유형:** Product Content & Architecture Gap Audit SSOT  
**기준 문서:** `docs/product/05B_Friend_Product_Blueprint.md` (Friend Product SSOT)  
**대상 리포트:** Ahaitsme Friend Relationship Experience (`current` vs `current_enriched`)  
**작성일:** 2026-08-07  
**작성 목적:** Friend 렌더링 리포트의 제품 구성 변경(보존/복원/제거)을 확정하고, 05B Product Blueprint의 핵심 질문/정보 요구사항 대비 실제 렌더링된 리포트의 결손(Gap)을 전수 분석하여 제품 디렉터(PD)가 구현 결정을 내릴 수 있도록 지원함.

---

## 1. 리포트 제품 구성 확정 (Composition Decisions)

### 1.1 Preserve (유지)
* **우정의 숨겨진 흐름 (Hidden Flow - Travel & Counseling):** 여행 스타일(기획형 vs 힐링형 분업) 및 고민 상담 스타일(공감 우선 vs 현실 해결) 유지.
* **노는 코드 (Soulmate / Play Code):** 둘만의 고유한 티키타카 호흡 및 놀이 코드 서사 유지.

### 1.2 Restore (기존 프로덕션 실전 행동 처방전 복원)
* **`실전 행동 처방전` (Practical Prescription):**
  * 신규 7-Scene / 3대 골든 룰 단순 나열 대신, 기존 프로덕션의 정통 카드 구조 및 체크리스트 UI를 완전 복원.
  * 필수 카테고리 구성:
    1. **우정 유지 기본 루틴 (공통)** (`friendship_baseline`)
    2. **지금 당장 해볼 것 (Do List)** — 즉각 실천 가능한 구체적 행동 가이드
    3. **절대 하지 말 것 (Don't List)** — 관계 피로 및 서운함을 유발하는 금기 행동
  * 시각 디자인: `PairPrescriptionSection`의 Do(녹색 체크) / Don't(적색 엑스) 2열 체크리스트 카드 레이아웃 보존 + 내부 콘텐츠에 CE/Lens 심층 분석 반영.

### 1.3 Remove (사용자 화면에서 제거)
* **우정 주파수 매칭 (Psych Match Radar Chart & Highlights):** 사용자 화면 렌더링 카드에서 제거 (내부 엔진 계산은 보존).
* **돈 계산 (Play Money / Treasurer Split):** 사용자 화면 렌더링 카드에서 제거 (내부 엔진 계산은 보존).

---

## 2. 12대 핵심 우정 테마 — 05B Blueprint 요건 검증

사용자가 검토 요청한 12개 우정 테마가 `05B_Friend_Product_Blueprint.md`에 실제로 정의되어 있는지 전수 대조한 결과입니다.

| 우정 테마 | 05B Blueprint 내 명시 근거 | 05B 요건 분류 |
|:---|:---|:---:|
| **1. 내가 이 친구에게 어떤 친구인지** | §1.1 Q2, §4.1 Territory B, §4A.1 Q5, §7 Module 3 | **explicitly required by 05B** |
| **2. 이 친구가 나에게 어떤 친구인지** | §1.1 Q1, §4.1 Territory A, §4A.1 Q4, §7 Module 2 | **explicitly required by 05B** |
| **3. 둘이 있을 때 만들어지는 고유한 분위기** | §1.1 Q6, §4.1 Territory F, §4A.1 Q16-Q17, §6.3, §7 Module 6 | **explicitly required by 05B** |
| **4. 어떤 상황에서 가장 잘 맞는지** | §1.1 Q3, §4.1 Territory C, §4A.1 Q18, §7 Module 4, §8 | **explicitly required by 05B** |
| **5. 서로에게 서운해지는 방식** | §1.1 Q4, §4.1 Territory D, §4A.1 Q20·Q22, §7 Module 5 | **explicitly required by 05B** |
| **6. 갈등 후 누가 어떻게 풀어야 하는지** | §4.1 Territory E, §4A.1 Friction & Care, §7 Module 7·8, §10 Law 10 | **explicitly required by 05B** |
| **7. 연락 빈도 / 거리감 / 오래 안 봐도 괜찮은지** | §4.1 Territory D, §4A.1 Q21·Q28, §6.3, §7 Module 9 | **explicitly required by 05B** |
| **8. 함께 여행하거나 오래 붙어 있을 때의 패턴** | §4.1 Territory C·D, §7 Module 4, §8.3 (여행/에너지 조후) | **explicitly required by 05B** |
| **9. 다른 친구들이 섞였을 때의 사회적 에너지** | §4A.1 Q19, §7.1 Deep Read, §17.1 Open Decision 6 | **explicitly required by 05B** |
| **10. 서로의 자존감·자신감을 올려주는 방식** | §4.1 Territory A/B, §4.1 Territory C, §8.3, §9.2 | **explicitly required by 05B** |
| **11. 이 우정이 오래가기 위해 필요한 것** | §1.1 Q5, §4.1 Territory E/F, §4A.1 Q24·Q26, §7 Module 8·9 | **explicitly required by 05B** |
| **12. 이 관계에서 서로가 성장시키는 부분** | §0 Manifesto, §4.1 Territory B, §7 Module 3, §9.2 | **explicitly required by 05B** |

> **검증 결론:** 12개 테마 모두 `05B_Friend_Product_Blueprint.md`에 **명시적으로 요구(explicitly required)**되어 있습니다.

---

## 3. 05B Canonical Questions vs 렌더링 리포트 전수 Gap 분석 매트릭스

05B §4A.1 및 §1.1, §4.1에 명시된 28개 표준 사용자 질문/정보 요구사항을 기준으로 현재 리포트가 실제로 의미 있는 답을 제공하는지 평가했습니다.

* **Quality 기준:**
  * **STRONG:** 렌더링된 화면을 보고 사용자가 명확하고 구체적인 해답을 즉시 얻을 수 있음.
  * **PARTIAL:** 언급은 되지만 정적이거나 단편적이라 구체적인 상황/상호작용 맥락이 부족함.
  * **WEAK:** 한 줄 수준의 피상적 언급이거나 양측 대칭형 문구로 채워져 깊이가 부족함.
  * **ABSENT:** 렌더링된 리포트에서 해당 질문에 대한 답을 전혀 찾을 수 없음.

| # | 05B Blueprint Question / Need | Current | Current Enriched | 렌더링 위치 | Quality | Missing? | CE 신호 가용성 | Pair CE 가용성 | Friend Lens | 추천 해결 방안 (Treatment) |
|:---:|:---|:---:|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Q1** | **Why is this friend important to me?**<br>(이 친구가 왜 내게 중요한가?) | YES | YES | Hero Subtitle & Snapshot | **STRONG** | No | Personal CE | Day-stem / Combine | `friend_core_vibe` | 현재 서사 유지 |
| **Q2** | **What does this person bring that other friends do not?**<br>(이 친구만의 고유한 기여는?) | PARTIAL | PARTIAL | Social DNA (Guardian Character) | **PARTIAL** | No | Personal CE | Ten-god Direction | `friend_counseling_support` | Social DNA Guardian에 A→B 고유 역할 심화 |
| **Q3** | **Why do I reach for this friend in certain moments?**<br>(왜 특정 순간 이 친구를 찾는가?) | WEAK | PARTIAL | Snapshot (`shine_when_best`) | **PARTIAL** | No | Personal CE | Element Flow | `friend_comfort_distance` | Snapshot 상황을 2~3대 구체적 위기/회복 상황으로 정밀화 |
| **Q4** | **What role does this friend play in my life?**<br>(이 친구는 내 삶에서 어떤 역할인가?) | PARTIAL | PARTIAL | Social DNA (Friend Position) | **PARTIAL** | No | Personal CE | Relational Profile | `friend_counseling_support` | 05B §9 역할군(Safe Harbor/Reality Anchor 등) 명시 |
| **Q5** | **What role do I play in theirs?**<br>(나는 이 친구 삶에서 어떤 역할인가?) | PARTIAL | PARTIAL | Social DNA (Guardian B) | **PARTIAL** | No | Personal CE | Directionality B→A | `friend_longterm_synergy` | B→A 방향성 차별화 (A와 동일 복사 방지) |
| **Q6** | **Is this the friend I can lean on when things are hard?**<br>(힘들 때 기댈 수 있는 친구인가?) | PARTIAL | STRONG | Hidden Flow (Counseling Style) | **STRONG** | No | Personal CE | Support Profile | `friend_counseling_support` | Hidden Flow 상담 스타일 유지 |
| **Q7** | **Will they listen, solve, distract, encourage, or stay beside me?**<br>(어떤 방식으로 곁을 지키는가?) | PARTIAL | STRONG | Hidden Flow (Counseling Style) | **STRONG** | No | Personal CE | Empathy/Practicality | `friend_counseling_support` | 경청/해결/분위기 메이커 분업 유지 |
| **Q8** | **What kind of support do they naturally give?**<br>(이 친구의 자연스러운 지지 형태는?) | PARTIAL | STRONG | Hidden Flow & Social DNA | **STRONG** | No | Personal CE | Johu / Empathy | `friend_counseling_support` | 현재 Enriched 상담 서사 유지 |
| **Q9** | **What kind of support do I naturally give them?**<br>(내가 친구에게 건네는 자연스러운 지지는?) | PARTIAL | STRONG | Hidden Flow & Social DNA | **STRONG** | No | Personal CE | Johu / Empathy | `friend_counseling_support` | 양방향 상담 스타일 유지 |
| **Q10** | **Why do we sometimes offer the wrong kind of help?**<br>(왜 가끔 엇박자 도움을 주게 되는가?) | WEAK | PARTIAL | Breakup Guide (Jealousy/Shadow) | **PARTIAL** | No | Personal CE | Practical vs Empathy | `friend_counseling_support` | Breakup Guide에 "조언 vs 공감 타이밍 엇갈림" 메커니즘 통합 |
| **Q11** | **Why does one want to talk while the other wants space?**<br>(대화 vs 혼자만의 공간 차이) | WEAK | PARTIAL | Compare Table (Row 4) & Prescription | **PARTIAL** | No | Personal CE | Conflict / Johu | `friend_comfort_distance` | 실전 처방전 (Do/Don't)에 24시간 쿨다운/공간 존중 명시 |
| **Q12** | **Why is one spontaneous while the other needs a plan?**<br>(즉흥 vs 계획의 차이) | PARTIAL | STRONG | Hidden Flow (Travel Style) | **STRONG** | No | Personal CE | Structure / Spontaneity | `friend_travel_planner` | Hidden Flow 여행 기획/유연 분업 유지 |
| **Q13** | **Why does one bring feelings and the other solutions?**<br>(감정 vs 해결책 차이) | PARTIAL | STRONG | Hidden Flow (Counseling Style) | **STRONG** | No | Personal CE | Thinking / Empathy | `friend_counseling_support` | Hidden Flow에 감정-현실 조화 유지 |
| **Q14** | **Which differences help us?**<br>(어떤 차이가 우리에게 도움이 되는가?) | PARTIAL | STRONG | Hidden Flow & Soulmate | **STRONG** | No | Personal CE | Complementarity | `friend_travel_planner` | 상호보완 분업 서사 유지 |
| **Q15** | **Which differences become tiring?**<br>(어떤 차이가 우리를 지치게 만드는가?) | PARTIAL | PARTIAL | Prescription (Energy Drain) | **PARTIAL** | No | Personal CE | Johu Heat/Moisture Gap | `friend_comfort_distance` | 복원될 실전 처방전의 '기 빨림 방지' 카드에 명확히 배치 |
| **Q16** | **Why am I more playful/brave/calm with this friend?**<br>(왜 이 친구와 있으면 고유한 모습이 나오는가?) | PARTIAL | STRONG | Soulmate (노는 코드) | **STRONG** | No | Personal CE | Combine / Banter | `friend_core_vibe` | Soulmate 노는 코드 유지 |
| **Q17** | **What do we bring out in each other?**<br>(서로에게서 무엇을 끌어내는가?) | WEAK | PARTIAL | Social DNA & Snapshot | **PARTIAL** | No | Personal CE | Mutual Activation | `friend_longterm_synergy` | Social DNA에 서로를 성장/용기 주는 포인트 반영 |
| **Q18** | **What activities/situations fit us naturally?**<br>(어떤 활동/상황이 자연스럽게 맞는가?) | PARTIAL | STRONG | Hidden Flow (Travel & Hangout) | **STRONG** | No | Personal CE | Energy / Stimulation | `friend_travel_planner` | Hidden Flow 여행 및 맛집 탐방 유지 |
| **Q19** | **Why does friendship feel different in private vs group?**<br>(단둘 vs 다수 모임에서의 차이) | ABSENT | WEAK | Social DNA (Battery / Private) | **WEAK** | **YES** | Personal CE | Social DNA Battery | `friend_comfort_distance` | Social DNA 배터리/이면 서사에 "모임 vs 단둘" 에너지 역학 추가 |
| **Q20** | **Why do I sometimes feel unseen or taken for granted?**<br>(왜 가끔 서운하거나 당연시된다 느끼는가?) | WEAK | PARTIAL | Breakup Guide (Trigger Warning) | **PARTIAL** | No | Personal CE | Recognition / Boundary | `friend_jealousy_guard` | Breakup Guide에 무시/방치 방지 및 인정 욕구 반영 |
| **Q21** | **Why does one person always initiate?**<br>(왜 한 사람만 연락/약속을 주도하는가?) | ABSENT | WEAK | Compare Table (Row 1) | **WEAK** | **YES** | Personal CE | Initiative Pace | `friend_comfort_distance` | 실전 처방전 (대화 소통 맞춤 규칙) Do/Don't에 주도 불균형 해소법 수록 |
| **Q22** | **Why can practical advice feel emotionally wrong?**<br>(현실 조언이 왜 차갑게 느껴지는가?) | WEAK | STRONG | Breakup Guide & Hidden Flow | **STRONG** | No | Personal CE | Practical vs Empathy | `friend_counseling_support` | Breakup Guide 섀도우 통찰에 이미 반영됨 |
| **Q23** | **What should we stop expecting from each other?**<br>(서로에게 무엇을 기대하지 말아야 하는가?) | WEAK | WEAK | Breakup Guide / Prescription | **WEAK** | **YES** | Personal CE | Boundary / Expectation | `friend_de_escalation` | 복원될 실전 처방전의 `Don't List (절대 하지 말 것)`에 정밀 배치 |
| **Q24** | **How can we protect friendship as life changes?**<br>(환경 변화 속 우정 보호법) | WEAK | PARTIAL | De-escalation & Prescription | **PARTIAL** | No | Personal CE | Longterm Resilience | `friend_longterm_synergy` | 실전 처방전 `우정 유지 기본 루틴 (공통)`에 장기 적응 규칙 강화 |
| **Q25** | **Can friendship stay meaningful through change?**<br>(변화 속에서도 의미 있게 지속 가능한가?) | PARTIAL | STRONG | Hero Subtitle & Grade Reason | **STRONG** | No | Personal CE | Longterm Tenacity | `friend_longterm_synergy` | 오프닝 총평 및 장기 우정 톤 유지 |
| **Q26** | **What will help it adapt?**<br>(우정의 적응을 돕는 것은?) | WEAK | PARTIAL | De-escalation (Reconciliation) | **PARTIAL** | No | Personal CE | Conflict Decompression | `friend_de_escalation` | De-escalation 화해 스크립트 및 쿨다운 리셋 유지 |
| **Q27** | **What pressure points should we watch?**<br>(주의해야 할 압박/스트레스 지점은?) | PARTIAL | STRONG | Breakup Guide (Trigger Warning) | **STRONG** | No | Personal CE | Clash / Wonjin / Boundary | `friend_jealousy_guard` | Breakup Guide 트리거 워닝 유지 |
| **Q28** | **How to preserve closeness without constant contact?**<br>(늘 연락하지 않아도 친밀함을 지키는 법) | WEAK | PARTIAL | Prescription (Communication) | **PARTIAL** | No | Personal CE | Distance Comfort | `friend_comfort_distance` | 실전 처방전 소통 규칙 (연락 빈도보다 신뢰 중심)에 수록 |

---

## 4. PARTIAL / WEAK / ABSENT 질문별 심층 엔진 분석 설계 (Analysis Design)

05B Blueprint 요건에 따라, 실제 렌더링 리포트에서 보강이 필요한 항목들을 기존 섹션에 자연스럽게 녹여내는 엔진-서사 파이프라인 설계입니다.

### 4.1 [Q19] 다수 모임 vs 단둘이 있을 때의 사회적 에너지 역학 (WEAK → STRONG)
* **User Question:** 단둘이 있을 때는 편한데, 다른 친구들이 섞인 모임에서는 왜 관계의 텐션이나 에너지가 달라지는가?
* **Personal CE signals:** `profA/B.expression_style`, `profA/B.energy_style`, `home_life_dna.energy_battery_line`
* **Pair CE interaction:** `pair.energy_drain_band`, `johu_gap.heat_gap`, 내향/외향 페어링
* **Friend Domain Lens:** `friend_comfort_distance` (모임 내 에너지 소모 및 거리감 조절)
* **Canonical Meaning:** 한쪽은 1:1 깊은 대화에서 에너지를 얻고, 다수 모임에서는 빠르게 배터리가 방전되는 반면, 다른 쪽은 모임의 분위기 메이커 역할을 할 때 생기는 미세한 피로.
* **Recommended User-Facing Answer:** "단둘이 만날 때는 편안한 힐링 충전이 일어나지만, 단체 모임에서는 서로의 소셜 배터리 소모 속도가 다릅니다. 모임 후에는 억지로 2차를 강요하지 않고 각자의 충전 시간을 존중해 주는 것이 관계를 지킵니다."
* **Best Existing Section to Place:** `Social DNA` (Part 2)의 `Battery Description` 및 `Private Side` 필드 내부.

---

### 4.2 [Q21] 연락 및 만남의 주도권 불균형 (WEAK → STRONG)
* **User Question:** 왜 항상 한 사람만 먼저 연락하고 약속을 잡는 것처럼 느껴지는가?
* **Personal CE signals:** `profA/B.decision_pace` (`swift_initiative` vs `deliberate_evaluator`), `profA/B.structure_spontaneity`
* **Pair CE interaction:** `pair.initiator_tendency`, 십신 편관/식신 주도성 차이
* **Friend Domain Lens:** `friend_comfort_distance`
* **Canonical Meaning:** 연락을 덜 하는 쪽이 애정이 식은 것이 아니라, 생각과 일상을 정리하는 사이클이 길 뿐임. 주도권 차이를 '애정의 크기'로 오해하지 않는 것이 핵심.
* **Recommended User-Facing Answer:** "먼저 연락하는 쪽이 관계를 더 아끼는 것이 아니라, 각자의 일상 리듬과 반응 속도가 다를 뿐입니다. '언제든 생각날 때 편하게 답장해'라는 무언의 신뢰를 공유하면 주도권 스트레스가 사라집니다."
* **Best Existing Section to Place:** 복원된 `실전 행동 처방전` (Part 5)의 `대화 소통 맞춤 규칙` → `지금 당장 해볼 것 (Do List)` & `Compare Table` (Row 1).

---

### 4.3 [Q23] 서로에게 기대하지 말아야 할 것 / 내려놓을 것 (WEAK → STRONG)
* **User Question:** 오랜 우정을 지키기 위해 이 친구에게 과도하게 요구하거나 기대하지 말아야 할 부분은 무엇인가?
* **Personal CE signals:** `profA/B.support_giving_style`, `profA/B.boundary_defense_strength`
* **Pair CE interaction:** `pair.gift_cost_matrix`, 오행 과다/결핍 불균형
* **Friend Domain Lens:** `friend_de_escalation` & `friend_jealousy_guard`
* **Canonical Meaning:** 현실 해결형 친구에게 무조건적인 감정 동조만 요구하거나, 감성 공감형 친구에게 냉철한 비즈니스 분석을 요구하는 기대의 엇갈림 차단.
* **Recommended User-Facing Answer:** "친구가 내 모든 감정의 쓰레기통이 되어주거나, 즉각 완벽한 해결책을 내놓기를 기대하지 마세요. 친구의 타고난 지지 방식을 있는 그대로 인정할 때 실망이 없습니다."
* **Best Existing Section to Place:** 복원된 `실전 행동 처방전` (Part 5)의 `절대 하지 말 것 (Don't List)` & `Breakup Guide` (Part 4).

---

### 4.4 [Q2 & Q5] A→B 및 B→A 상호 기여 방향성의 완전한 차별화 (PARTIAL → STRONG)
* **User Question:** 이 친구가 내게 주는 고유한 선물과, 내가 이 친구에게 열어주는 새로운 가능성은 각각 구체적으로 무엇인가?
* **Personal CE signals:** `personalCeA.ten_god_stem_counts`, `personalCeB.ten_god_stem_counts`, 일간 십신 방향성
* **Pair CE interaction:** `facts.element_flow` (`a_to_b` vs `b_to_a`), 상생 방향
* **Friend Domain Lens:** `friend_counseling_support` & `friend_longterm_synergy`
* **Canonical Meaning:** A는 B에게 실행력과 현실적 안전망을 제공하고, B는 A에게 유연한 쉼과 새로운 시각을 불어넣어 주는 비대칭적 상호 보완(Law 6: Gift & Transformation flow).
* **Recommended User-Facing Answer:** A→B와 B→A의 가디언 캐릭터 및 기여 서사를 완전히 개별화하여, 한 사람이 다른 사람에게 미치는 고유한 영향력을 분리 렌더링.
* **Best Existing Section to Place:** `Social DNA` (Part 2)의 `guardian_character` A와 B 각각.

---

### 4.5 [Q3] 상황별 최고의 순간 (When this friendship shines) 정밀화 (PARTIAL → STRONG)
* **User Question:** 인생의 어떤 구체적인 위기나 순간에 이 친구가 가장 빛을 발하는가?
* **Personal CE signals:** `profA/B.resilience`, `profA/B.empathy`, `profA/B.practicality`
* **Pair CE interaction:** 05B §8.3 상황 매핑 (Emotional Storm vs Reality Check vs Play & Release)
* **Friend Domain Lens:** `friend_core_vibe` & `friend_travel_planner`
* **Canonical Meaning:** 1줄짜리 요약을 넘어, 복합 위기(멘탈 붕괴 시의 묵묵한 곁지킴)와 일상 회복(저자극 맛집 탐방) 등 05B 공인 상황 패밀리 2~3개 도출.
* **Recommended User-Facing Answer:** "모든 일이 꼬여 멘탈이 흔들릴 때(현실 중심 잡기), 그리고 일상의 번아웃에서 벗어나 아무 생각 없이 쉴 때(무압박 힐링) 이 우정의 가치가 가장 빛납니다."
* **Best Existing Section to Place:** `Snapshot` (Part 1)의 `shine_when_best` 및 `Soulmate` (Part 3) 서사.

---

## 5. 결손 해소 후 최종 Friend 리포트 섹션 배치 맵

신규 섹션을 무분별하게 추가하지 않고, 사용자가 지정한 **기존 프로덕션 레이아웃(5개 Part)** 내부에 모든 Gap을 100% 흡수합니다.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Header: 이름 + Friendship Signature + Vibe Badge + One-line Truth       │
├──────────────────────────────────────────────────────────────────────────┤
│ Part 1. 우정의 핵심 케미스트리 (Snapshot & Compare)                      │
│  ├─ Snapshot: 케미/티키타카/리스크 3대 지표 + When this friendship shines│
│  │   (Q1, Q3 상황별 최고 순간 정밀화)                                   │
│  ├─ Compare Table: 성향 비교표 4개 행 (Q11 공간/속도 차이, Q21 주도권)   │
│  └─ [우정 주파수 매칭 레이더 차트 제거 — 05B Constitution §12.2 준수]   │
├──────────────────────────────────────────────────────────────────────────┤
│ Part 2. 소셜 DNA와 역할 (Social DNA — Directional Gifts)                  │
│  ├─ Me / Partner 개별 가디언 캐릭터 (Q2, Q4, Q5 A→B / B→A 비대칭 선물)  │
│  ├─ 포지션 & 티키타카 호흡                                                │
│  └─ 배터리 & 이면의 모습 (Q19 다수 모임 vs 단둘이 있을 때의 에너지 역학)│
├──────────────────────────────────────────────────────────────────────────┤
│ Part 3. 우정의 숨겨진 흐름과 시너지 (Hidden Flow & Soulmate) [KEEP]      │
│  ├─ 노는 코드 / Soulmate 판정 (Q14 상호보완, Q16 둘만의 고유 분위기)    │
│  ├─ 여행 스타일: 기획형 플래너 vs 힐링형 유연 분업 (Q12 즉흥 vs 계획)   │
│  ├─ 고민 상담: 공감 우선 vs 현실 해결 분업 (Q6, Q7, Q8, Q9, Q13)        │
│  └─ [돈 계산(총무) 카드 제거 — 05B Constitution §2.7 준수]              │
├──────────────────────────────────────────────────────────────────────────┤
│ Part 4. 관계 방어벽과 오해 예방 (Breakup Guide)                          │
│  ├─ 트리거 워닝: 무시/방치 금지 (Q20 당연시/서운함 방지, Q27 스트레스점)│
│  └─ 질투 가드 & 섀도우 통찰 (Q10 엇박자 도움, Q22 현실 조언 차가움 완화)│
├──────────────────────────────────────────────────────────────────────────┤
│ Part 5. 실전 행동 처방전과 갈등 회복 (Prescription & De-Escalation)      │
│  ├─ 갈등 완화 치트키 & 24시간 쿨다운 리셋 (Q26 화해 스크립트)            │
│  └─ [RESTORED] 실전 행동 처방전 (PairPrescriptionSection 원형 복원)      │
│      ├─ 1. 우정 유지 기본 루틴 (공통) (Q24 환경 변화 적응, Q28 신뢰 중심)│
│      ├─ 2. 기 빨림 방지 / 소통 맞춤 처방 (Q15 피로 원인, Q21 주도 불균형)│
│      │   ├─ ✓ 지금 당장 해볼 것 (Do List: 구체적 실천 행동)             │
│      │   └─ ✕ 절대 하지 말 것 (Don't List: Q23 서로에게 내려놓을 기대) │
│      └─ 3. 절친 싸움 해독제 & 회복 프로토콜                             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 요약 및 PD 승인 대기 항목 (Summary for Product Director)

1. **05B 정통 질문군 대조:** 05B Blueprint에 정의된 28개 질문 중 현재 렌더링 화면에서 상대적으로 약했던 Q2/Q5(방향성 기여 차별화), Q19(모임 vs 단둘 에너지), Q21(주도권 불균형), Q23(서로 내려놓을 기대/Don't list)의 4개 핵심 갭을 식별함.
2. **별도 신규 섹션 추가 없음:** 05B 원칙에 따라 새로운 카드를 신설하지 않고, 기존 5개 Part의 정해진 위치(Social DNA, 실전 처방전 Do/Don't, Hidden Flow) 내부에 엔진 증거와 카피를 정밀 통합함.
3. **요청된 섹션 구성 변경 확약:**
   * ✅ **우정의 숨겨진 흐름 (여행 & 상담 분업) KEEP**
   * ✅ **노는 코드 (Soulmate) KEEP**
   * ✅ **실전 행동 처방전 RESTORE (우정 유지 기본 루틴 + 지금 당장 해볼 것 Do + 절대 하지 말 것 Don't 체크리스트 복원)**
   * ✅ **우정 주파수 매칭 (심리 레이더 차트) REMOVE**
   * ✅ **돈 계산 (총무 정산) REMOVE**

*(본 문서는 제품 디렉터의 검토 및 승인 후 실제 코드 반영을 진행하기 위해 대기 상태로 보존됩니다.)*

---

## 7. 구현 완료 보고 — 11축 현실 해석 문장 & 3대 스코어 카드 감사 (2026-08-07)

§1~6 승인 항목 중 마지막까지 대기 상태였던 두 항목을 `current_enriched`에서만 구현 완료. `current`(production, `lib/relationship/friend/*` 계산 로직)는 무수정.

### 7.1 3대 스코어 카드 — 실제 계산 근거 추적 + 최종 정의

`computeFriendMasterScores`(`lib/relationship/friendEventScores.ts`)를 실제로 추적한 결과:

| 카드 | 라벨 | 시작값 | 상승 신호 | 하락 신호 | 방향 |
|---|---|---:|---|---|---|
| 🔥 우정 케미 | `connection` | 50 | +30 일지합(`hasDayBranchCombine`) · +20 비겁 상호공명(`hasBijiepMutualResonance`) | −20 일지 충형(`hasDayBranchChungHyung`) | 높을수록 좋음 |
| 🧩 티키타카 | `banter` | 50 | +25 식상-인성 조화(`hasFoodSealHarmony`) · +25 조후 보완(`hasJohuComplement`) | −20 식상 충돌(`hasFoodClashFriction`) | 높을수록 좋음 |
| ⚡ 소셜 리스크 | `risk` | 10 | +35 일지 충형해파(`hasDayBranchFullTension`) · +25 원진/귀문(`hasWonjinOrGuimun`) · +15 재관 충돌(`hasWealthOfficerClash`) | (없음) | **낮을수록 좋음** — 다른 두 점수와 반대 |

**라벨 판정:** 세 라벨(우정 케미/티키타카/소셜 리스크) 모두 실제 계산과 의미가 정확히 일치해 **이름 변경 불필요**. 대신 각 카드에 `measures`(무엇을 측정하는지) / `why`(이 커플이 왜 이 점수인지 — 실제로 어떤 신호가 발동했는지 동적으로 나열) / `level_meaning`(높음·중간·낮음 구간별 의미, 소셜 리스크는 "낮을수록 좋음" 방향을 문장에 명시) 3개 필드를 신설. 세 카드가 서로 다른 의미를 갖도록 measures 문구를 계산 근거(일지합/비겁공명 vs 식상-인성조화/조후보완 vs 충형해파/원진귀문/재관충돌)로 명확히 분리.

- 구현: `lib/relationship/enrichment/friendScoreCardAudit.ts` (신규)
- 타입: `FriendScoreCardAudit`/`FriendScoreCardAuditItem` (`lib/relationship/friend/friendKillerSections.ts`, optional 필드라 `current`엔 영향 없음)
- 배치: `section_snapshot.score_card_audit` — 기존 3점수 카드 UI(디자인 불변) 바로 아래 `scoreFooter`에 카드별 3줄 설명으로 렌더 (`components/relationship/friend/sections/SectionRenderer.tsx`). 참고: 소셜 리스크의 색상/방향 혼동은 `resolveScoreBarAppearance`(polarity `higher_worse`)가 이미 자동 처리 중이었음 — 이번 작업은 그 위에 텍스트 설명을 추가한 것.

### 7.2 11축 현실 해석 문장 — before/after

**Before:** 11축(`psychMaster.secondary_axes`) 차이는 "우정 주파수 매칭" 레이더 차트(`buildFriendPsychMatchBundle`)로만 노출됐고, 이 화면은 05B 결정에 따라 §1.3에서 이미 제거됨. 축 차이를 현실 장면으로 풀어주는 문장은 화면에 하나도 남지 않은 상태였음(계산은 살아있지만 사용자에게 안 보임).

**After:** `lib/relationship/enrichment/friendAxisRealityInsights.ts`(신규)에서 8개 실생활 주제를 11축 중 가장 가까운 축에 매핑하고, 실제 두 사람의 psychMaster 점수 격차(`buildPsychMatchResult`의 gap 기반 `match_type`)에 따라 `축 차이 → 현실 상황/기대 차이 → 생길 오해·서운함 → 짧은 조정법` 4단 구조 문장을 매번 새로 생성. 고정 문구가 아니라 `score_a`/`score_b` 중 누가 높은지에 따라 이름까지 동적으로 삽입됨(`reversed_ab` 케이스로 A/B 반전 검증 완료).

| 실생활 주제 | 매핑 축 | 배치 위치(기존 섹션) |
|---|---|---|
| 연락·만남 빈도 | `energy_style` | 비교표 `daily_share_tempo`.psych_note |
| 답장 속도 | `decision_style` | 비교표 `communication_rhythm`.psych_note |
| 공감 vs 해결 | `empathy` | Hidden Flow `counseling_gap_note`(신규 필드) |
| 계획 vs 즉흥 | `structure` | 비교표 `hangout_planning`.psych_note |
| 단둘 vs 모임 | `stimulation` | 비교표 `battery_recharge`.psych_note |
| 바로 말함 vs 삭임 | `conflict_style` | 비교표 `upset_expression`.psych_note |
| 관계확인 필요 vs 오래 안 봐도 신뢰 | `recognition` | 비교표 `affection_language`.psych_note |
| 화해 속도 | `resilience` | De-escalation `recovery_pace_note`(신규 필드) |

새 UI 섹션은 추가하지 않음 — 기존 6행 비교표(`section_compare_table`)와 Hidden Flow/De-escalation 카드에 문구만 얹었다(비교표 렌더러는 이미 `row.psych_note`를 렌더링하고 있어 변경 불필요). 격차가 작아 `similarity`로 판정되면 "비슷해서 잘 맞다"는 긍정 문구로 자동 전환되고, `psychMaster` 설문이 미완료(`sparse_psych` 케이스)면 전부 `null`로 남아 가짜 데이터를 채우지 않음.

### 7.3 테스트 결과

- **Typecheck:** `npx tsc --noEmit` — 신규/수정 파일(`friendAxisRealityInsights.ts`, `friendScoreCardAudit.ts`, `friendKillerSections.ts`, `friendDeEscalationPrescriptions.ts`, `friendReportSectionTypes.ts`, `buildFriendReportViewModel.ts`, `buildFriendReportEnriched.ts`, `SectionRenderer.tsx`) 관련 신규 에러 0건. (참고: `buildFriendReport.ts`의 `section_play_money` optional 관련 pre-existing 에러 2건은 이번 세션 이전부터 있던 것으로 이번 작업 범위 밖.)
- **8 fixtures × KO/EN (16 케이스), A/B reversal, unknown hour, sparse psych:**
  - `tests/scripts/verify-friend-11axis-and-score-audit.ts`(신규) — score_card_audit 3항목 완전성 + risk 방향 명시 + 6개 비교표 행 psych_note + hidden_flow/de_escalation 신규 필드 + viewModel 배선까지 전수 검증 → **16 passed, 0 failed**. `sparse_psych`만 신호 없음(`psych=absent`)으로 정상 null 처리 확인.
  - `tests/scripts/verify-friend-product-director-review.ts`(기존, §1~6 확정 구성 회귀 검증) → **여전히 100% 통과** (돈 계산/우정 주파수 매칭 제거, 실전 처방전 복원 등 기존 승인 구성 무손상 확인).
  - `reversed_ab` 케이스로 A/B 방향 반전 시 8개 문장의 이름·방향이 정확히 뒤집히는 것 확인.
- **Build:** `npm run build` 성공(컴파일 에러 0).
- **Baseline artifacts:** `DOMAIN=friend npx tsx tests/scripts/generate-relationship-enrichment-corpus.mjs`로 friend 도메인 8케이스×KO/EN 재생성(work/family/partner 도메인은 건드리지 않음).

### 7.4 구현 완료 — 항목 2·3·4·5·18 (2026-08-07 후속)

11축(psychMaster)과 사주 오행 생극/역마 신호를 결합해 나머지 5개 항목을 기존 섹션에 배치했다. 새 모듈: `lib/relationship/enrichment/friendGiftAndBondInsights.ts`.

| 항목 | 신호 근거 | 배치 위치 |
|---|---|---|
| 2. 이 친구는 나에게 무엇을 주는가 | 오행 생(生) 방향(상대 dominantElement → 나 dominantElement) 확인 문장 — 기존 십성 기반 `deriveDirectionalGift` 뒤에 추가 | Social DNA `guardian_character.description` |
| 4. 서로 성장시키는 부분 | 심리 11축 `의사결정방식`(신중형/즉각형) × `자극추구` 대각 비교. 두 축 모두 gap≥10이고 신중한 쪽≠자극추구 쪽일 때만 발동, 아니면 기존 일반 emergence 문구로 폴백 | Social DNA `guardian_character.description` (동일 필드, item 2 뒤에 이어짐) |
| 3. 같이 있으면 어떤 모습이 살아나는가 | 오행 생(生) 방향(상대→나) 또는 동일 오행 + `자극추구` 격차(≥15) | Snapshot `shine_when_best` |
| 5. 힘들 때 왜 이 친구를 찾는가 | 상대방의 `사고방식` vs `관계공감` 중 우세 축(이미 F/T 판정에 쓰이는 것과 동일 원리) + `회복탄력성`≥65 보너스절 | Hidden Flow `counseling_style_a/b.description` |
| 18. 멀리 떨어져도 유지되는가 | 사주 역마살 보유 수(`yeomaCount`, 0~4) + `인정욕구`/`회복탄력성` 평균 | Soulmate `soulmate_verdict` |

**부수적으로 발견·수정한 버그 2건** (기존 코드, 이번 작업 범위 안에서 직접 마주쳐 함께 고침):
1. `shine_when_best` 중복 문장 — `buildFriendReportEnriched.ts`가 이미 완성된 `base.friend.section_snapshot.shine_when_best`(자기 자신을 포함한 문자열)를 다시 `hangoutHint`로 넣어 핵심 문장이 2번 반복되던 버그. `base.friend.section_play_money.optimal_hangout`(원래 소스)로 교정.
2. 항목5 회복탄력성 보너스절에 남아있던 1인칭 "저" — 3인칭 설명 문체와 안 맞아서 제거.

**테스트:** typecheck(신규 에러 0), `verify-friend-11axis-and-score-audit.ts`·`verify-friend-product-director-review.ts` 16/16 통과, `npm run build` 성공, `DOMAIN=friend` baseline 재생성 완료. `reversed_ab`로 항목 2/3/4/5/18 전부 이름·방향 반전 확인, `sparse_psych`(psych 없음)에서 오행/역마 기반 항목(2 일부, 3, 18)은 정상 노출되고 심리축 전용 부분(항목4 다이내믹, 항목5 회복탄력성절)만 자연스럽게 생략됨을 확인.

### 7.5 범위

Work/Family/Partner/main 도메인 코드 및 production `current`(`buildFriendReport.ts`) 계산 로직은 무수정. 신규 로직은 전부 `lib/relationship/enrichment/`(current_enriched 전용) 및 friend 도메인 타입에 추가된 optional 필드로, `current`에서는 `undefined`로 남아 기존 프로덕션 출력에 영향 없음. 커밋은 진행하지 않음(사용자 요청).
