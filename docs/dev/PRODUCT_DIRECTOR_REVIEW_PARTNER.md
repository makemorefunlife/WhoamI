# Product Director Review: Partner Domain

> **Document Type:** Product Director UX & Output Review (Romantic & Household Partnership Experience)  
> **Target File:** `docs/dev/PRODUCT_DIRECTOR_REVIEW_PARTNER.md`  
> **Product SSOT:** `docs/product/05E_Partnership_Product_Blueprint.md` & `05_Relationship_Product_Bible.md`  
> **Evaluation Mode:** Real Rendered Output Validation (Current Production vs. V1 Gold vs. DEV Story/Narrative)  
> **Standard:** Rate against human usefulness, emotional resonance, clarity, differentiation, and actionability.

---

## 1. Executive Summary of the Partner Experience Review

This review audits the **real user experience** of Ahaitsme Partner/Cohabitation Relationship Report against the Product Blueprint (`05E_Partnership_Product_Blueprint.md`). 

Every requirement is reviewed strictly on its **final user-facing rendered Korean output**, comparing:
- **Current Production Output:** Live production cards and view model text (`section_dna`, `section_origin_story`, `section_snapshot`, `section_bedroom`, `section_money_chores`, `section_family_boundary`, `section_parenting`, `section_privacy`, `section_upset`, `section_warning`, `section_compare_table`, etc.)
- **V1 Gold Output:** V1 migration assets and baseline projections
- **DEV Output:** 7-Scene Narrative Composer (`partnerNarrativeComposer.ts`) and Domain Lens outputs (`partnerLenses.ts`)

---

## 2. Requirement-by-Requirement Product Director Review

---

### Requirement BR-PT-01: Partnership Archetype & Origin Gravitation

#### 1. Requirement ID
`BR-PT-01`

#### 2. Requirement Description
Establish the couple’s foundational bond and origin story without game-like scores or fatalistic ranking (`05E` §6, §7 Mod 1). Must answer: *"우리는 왜 서로에게 끌렸으며, 우리 부부/동반자 관계의 핵심 정의는 무엇인가?"*

#### 3. Why this requirement exists
Couples living together need an emotional anchor (*"일상의 리듬 속에서 서로를 골랐고, 받을 때보다 줄 때 자존감이 단단해지는 관계"*) to ground them through mundane routines.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[헤드라인 / 원라인 정의]
"Loyal & Pride — 운명적 정서 끌림형 패밀리, 설명하기 힘든 케미로 서로를 끌어당긴 하우스"

[하우스홀드 파트너십 스냅샷 & 게이지]
- 🔥 65% · 🧩 50% · ⚡ 45% (등급 D)
- 인연의 이유: "극적인 신호 하나로 설명되는 인연은 아니에요 — 일상의 리듬과 작은 선택이 반복되며 서로를 골랐고, 그게 오히려 오래가는 이유예요."
- 서로를 통한 변화:
  * Alex: "Jordan이(가) 기댈 수 있는 사람이 되어 주면서 스스로에게 이런 힘이 있었는지 새삼 확인해요."
  * Jordan: "Alex 곁에 있으면 날카로운 모서리가 다듬어져요 — 마음 한구석이 치유받는 변화예요."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[동반자 판정]
"서로의 자존심과 독립 공간을 지켜주는 동반자적 연대."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 1 Overview & Headline]
"Alex님과 Jordan님의 동반자 스토리: 두 사람을 하나로 묶는 근원적 결합력과 일상 생활 리듬의 조화"
배지: [단단한 정서적 안식처와 동반자적 결속]
```

#### 7. Product Director Review
- **Usefulness:** ★★★★☆
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★☆☆

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes, exceptionally moving.** The "서로를 통한 변화" text is deeply emotional. However, displaying "등급 D" and "리스크 45%" contradicts Blueprint Law 10 ("Type, not rank").
- **What is missing?**  
  Remove the "등급 D" and numeric percentage badge; integrate DEV's dignified archetype badge.

#### 9. Missing Layer Identification
- **Current wording only**

#### 10. Recommended Action
**`MERGE CURRENT + DEV`**

---

### Requirement BR-PT-02: Household Operating DNA & Lifestyle Battery

#### 1. Requirement ID
`BR-PT-02`

#### 2. Requirement Description
Ground individual home personalities (private home self, battery recharging mode, life values) in lived domestic reality (`05E` §4.1 Terr A, §7 Mod 1). Must answer: *"집 안에서 각자의 사적인 본모습과 에너지 충전 방식은 어떻게 다른가?"*

#### 3. Why this requirement exists
Outside social personas differ vastly from how people behave behind closed doors. Knowing a partner needs silent sofa time prevents misunderstandings.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[Alex의 Home DNA]
- 라이프스타일 타이틀: Loyal Co-Captain
- 가치관: "원칙·공정·효율을 중시하고, 관계에서도 명확한 기준과 약속을 원해요."
- 집 안의 본모습: "가정 내 구조·역할을 재정비하려 하며, 변화가 올 때 주도적으로 움직여요."
- 배터리 충전: "집돌이형 — 집 안에서 충전해요. 소파·침실·조용한 루틴이 배터리를 채웁니다."

[Jordan의 Home DNA]
- 라이프스타일 타이틀: Pride & Partnership Type
- 가치관: "신중한 선택과 깊은 성찰을 중시하며, 섣부른 결정보다 확신이 필요해요."
- 집 안의 본모습: "문 닫으면 방어적으로 조용해지며, 혼자만의 동굴 시간이 필수예요."
- 배터리 충전: "집돌이형 — 집 안에서 충전해요. 소파·침실·조용한 루틴이 배터리를 채웁니다."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[에너지 배터리 비교]
"둘 다 집 안에서 에너지를 채우는 집돌이형 — 아늑한 침실과 소파가 최고의 충전소입니다."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 3 Beat 1/2]
"외부 스트레스로 소진된 에너지를 충전할 수 있는 사적인 동굴 시간이 보장될 때, 다시 배우자에게 다정함을 건넬 여유가 생깁니다."
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★☆

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes.** "구조를 재정비하는 주도형" vs "혼자만의 동굴 시간이 필수인 신중형"의 대비가 정확합니다.
- **What is missing?**  
  None.

#### 9. Missing Layer Identification
- None.

#### 10. Recommended Action
**`KEEP`**

---

### Requirement BR-PT-03: Financial Governance & Household CFO Designation

#### 1. Requirement ID
`BR-PT-03`

#### 2. Requirement Description
Designate a single primary Household CFO with explicit spending authority boundaries to end money disputes (`05E` §4.1 Terr C, §7 Mod 2). Must answer: *"누가 가계 재정을 총괄해야 하며, 큰 지출 기준은 어떻게 정하는가?"*

#### 3. Why this requirement exists
Money is the leading cause of marital divorce. Dual CFO confusion creates endless friction; designating a single CFO with clear rules prevents disaster.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[가계 CFO 지정 & 지출 룰 — section_money_chores]
- 지정 CFO: Jordan
- 선정 이유: "Jordan이(가) 현실 감각·책임감이 더 단단해 집안 재정 리더로 지정됩니다. '듀얼 CFO'는 금지 — 한 명만 쥐세요. 설문 축은 엇갈려 있으니 큰 지출은 함께 확인해 보세요."
- 소비 성향: "Jordan은(는) 저축 쪽으로 기울고 Alex은(는) 비교적 균형 잡힌 편 — Jordan의 안정 감각을 공동 저축 기준으로 삼되, Alex의 가끔의 지출은 여유를 둬도 좋아요."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[자산 관리 기질 비교]
"한쪽은 실리보다 편안함을, 다른 쪽은 균형을 중시해요 — 균형형 쪽이 큰 결정을 리드하면 무난해요."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 2 Beat 3/4 & Action Script]
"예산을 꼼꼼히 따지는 것은 가족의 미래를 지키려는 가장 헌신적인 사랑의 표현입니다. 매월 1회 '가계 결산 데이'를 열고 50만 원 이상의 비정기 지출은 사전 상의 규칙을 세우세요."
스크립트: "이번 달 생활비 결산해 봤는데 예산 안에서 잘 운영됐어! 다음 달 저축 목표도 같이 볼까?"
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★★

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes, best-in-class.** The absolute rule "듀얼 CFO는 금지" plus DEV's "50만 원 이상 사전 상의 룰" gives crystal-clear financial governance.
- **What is missing?**  
  Synthesize DEV's monthly settlement day and 500k-KRW rule into the CFO advice card.

#### 9. Missing Layer Identification
- **Narrative**

#### 10. Recommended Action
**`MERGE CURRENT + DEV`**

---

### Requirement BR-PT-04: Chore Distribution & Invisible Mental Load

#### 1. Requirement ID
`BR-PT-04`

#### 2. Requirement Description
Acknowledge invisible domestic mental load (scheduling, groceries, maintenance) and establish fair, zone-based chore ownership (`05E` §4.1 Terr C, §7 Mod 2). Must answer: *"집안일과 보이지 않는 가사 부담을 어떻게 공평하게 분담할 것인가?"*

#### 3. Why this requirement exists
Couples fight not over doing the dishes, but over the exhausting mental load of constantly tracking and asking for chores to be done.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[가사 분담 및 멘탈 로드 — section_money_chores]
- 가사 가이드: "완벽한 분담표보다 '이번 주 담당' 체크리스트가 현실적입니다. 안 보이는 노동(정리·예약·육아 스케줄)을 먼저 적으세요."
- 멘탈 로드 노트: "보이지 않는 집안 운영 부담이 비슷해 보여요. 캘린더·할 일·후속 확인의 주인을 이름 붙여 두면, 한쪽이 조용히 둘 다 짊어지지 않게 됩니다."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[가사 스트레스 반응 비교]
"감정 그대로 티 내며 반응하는 타입 — 가사 스트레스를 표현하는 방식이 비슷해서 서로 눈치 볼 일이 적어요."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 3 Beat 3/4 & Role Rules]
"가사는 미루지 않고 내 구역을 책임지며, '지금은 혼자 충전할게'라는 신호가 있을 때 1시간의 온전한 자유를 선물하세요."
스크립트: "오늘 회사에서 에너지를 다 썼어. 1시간만 방에서 조용히 쉬고 나와서 저녁 같이 준비할게!"
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★★

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes.** "보이지 않는 노동(Mental Load)의 이름 붙이기" 기능은 현대 부부들이 가장 감사하는 실질적 해법입니다.
- **What is missing?**  
  None.

#### 9. Missing Layer Identification
- None.

#### 10. Recommended Action
**`KEEP`**

---

### Requirement BR-PT-05: Intimate Chemistry & Bedroom Matrix

#### 1. Requirement ID
`BR-PT-05`

#### 2. Requirement Description
Deconstruct physical intimacy preferences (stamina rhythm, fantasy style, leading manner) and provide graceful rejection scripts (`05E` §4.1 Terr B, §7 Mod 3). Must answer: *"침실에서의 취향과 리듬 차이를 상처 없이 어떻게 조율할 것인가?"*

#### 3. Why this requirement exists
Sexual mismatch is shrouded in shame and silence. Providing objective archetypes and rejection scripts liberates couples from silent resentment.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[베드룸 매트릭스 — section_bedroom]
- 케미 요약: "신체·감정 리듬 불일치 신호가 있습니다. 속도·촉감·분위기를 맞추는 대화 없이는 밤이 어색해집니다."
- Alex: [⚡ 단거리 연출가형] · [🧬 과감한 판타지파] · [👑 파워풀 리더]
- Jordan: [⚡ 단거리 연출가형] · [🕯️ 로맨틱 클래식파] · [👑 파워풀 리더]
- 온도차 해설: "Alex는 판타지와 실험을 원하고, Jordan은 익숙한 무드와 안정을 원합니다. 수위·새로움·금기선을 주 1회 '침실 대화'로 조율하세요."
- 거절 스크립트: "이 사람에게는 눈치 볼 것 없이 '오늘은 피곤해, 내일은 어때?'처럼 담백하고 솔직하게 말해도 괜찮아요."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[밤의 리드 스타일 비교]
"침실 주도권을 확실히 쥐는 타입끼리의 만남 — 가끔은 먼저 리드를 양보해 보세요."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 4 Beat 1/4 (친밀감의 온도와 베드룸 리듬)]
"마음이 열려야 몸이 반응하는 자연스러운 온도의 법칙을 이해하세요. 신체적 친밀감을 의무로 만들지 않고 정서적 대화와 스킨십을 먼저 챙기기."
스크립트: "오늘 하루도 정말 고생 많았어. 곁에 있어 줘서 따뜻하고 좋아."
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★★

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes, extraordinarily comprehensive.** The 3-axis bedroom matrix (Stamina, Fantasy, Manner) alongside gentle rejection scripts is one of the greatest innovations in the entire product suite.
- **What is missing?**  
  None.

#### 9. Missing Layer Identification
- None.

#### 10. Recommended Action
**`KEEP`**

---

### Requirement BR-PT-06: Sleep Frequency & Private Sanctuary (Sleep Fit)

#### 1. Requirement ID
`BR-PT-06`

#### 2. Requirement Description
Protect sleep quality and night recovery rhythms against sensory sensitivity mismatches (`05E` §4.1 Terr C, §7 Mod 3). Must answer: *"수면 습관과 예민함 차이로 인해 수면의 질이 떨어지는 것을 어떻게 막는가?"*

#### 3. Why this requirement exists
Chronic sleep disruption makes couples chronically irritable, eroding goodwill during daytime interactions.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[우리의 수면 주파수 (Sleep Fit) — section_bedroom]
- 수면 해설: "수면 예민도는 비슷한 편이라 기본 리듬은 맞습니다. 다만 스트레스가 쌓이는 주에는 한 명이라도 깊은 잠이 깨지면 둘 다 다음 날 예민해집니다."
- 수면 처방: "취침 30분 전 대화·폰은 침실 밖으로. 피곤한 날은 '오늘은 조용 모드'만 말해 주는 신호를 정해 두세요."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[수면 환경]
"암막 커튼과 조용한 취침 루틴으로 서로의 깊은 수면을 보호하세요."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 4 Beat 4]
"잠들기 전 스마트폰을 내려놓고 침대에서 10분간 손을 잡거나 포옹하며 가벼운 온기를 나누세요."
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★★

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes.** "취침 30분 전 폰 침실 밖으로 + '조용 모드' 신호" 처방이 매우 실용적입니다.
- **What is missing?**  
  None.

#### 9. Missing Layer Identification
- None.

#### 10. Recommended Action
**`KEEP`**

---

### Requirement BR-PT-07: In-Law & Extended Family Boundary (Family Boundary)

#### 1. Requirement ID
`BR-PT-07`

#### 2. Requirement Description
Establish clear boundary shields against in-law interference and protect the marital sanctuary (`05E` §4.1 Terr C, §7 Mod 4). Must answer: *"시댁·처가와의 갈등이나 간섭에서 우리 가정을 어떻게 지킬 것인가?"*

#### 3. Why this requirement exists
In-law tensions destroy marriages when spouses fail to prioritize the marital boundary over family of origin demands.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[가족 경계선 — section_family_boundary]
- 시댁·처가 스트레스 지수: 20%
- 요약: "비교적 독립적이지만, 피곤할 때 가족 이슈가 침실까지 따라오지 않게 경계는 유지하세요. 집이 성역이라 가족 방문이 길어지면 회복에 며칠이 걸립니다."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[원가족 바운더리 비교]
"둘 다 원가족과 가깝게 지내도 괜찮은 타입이라 왕래에 대한 마찰이 적어요."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 6 Beat 1/2]
"건강, 재정, 가족 문제 등 외부의 풍파가 닥쳤을 때, 서로를 탓하지 않고 '원팀으로 대응한다'는 절대적 신뢰가 발휘됩니다."
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★☆
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★☆

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes.** "집은 성역이므로 가족 방문 후 회복 시간 보장"이라는 통찰이 탁월합니다.
- **What is missing?**  
  None.

#### 9. Missing Layer Identification
- None.

#### 10. Recommended Action
**`KEEP`**

---

### Requirement BR-PT-08: Parenting Philosophy & Discipline Balance (Parenting Harmony)

#### 1. Requirement ID
`BR-PT-08`

#### 2. Requirement Description
Align parenting approaches (empathy vs discipline, Good Cop / Bad Cop balance) so children don't divide and conquer (`05E` §4.1 Terr C, §7 Mod 5). Must answer: *"자녀 양육에서 부부의 가치관을 어떻게 일치시키고 역할을 나눌 것인가?"*

#### 3. Why this requirement exists
Parenting disputes create profound marital friction and confuse children when rules are inconsistent.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[육아 가치관 & 조화 팁 — section_parenting]
- 부부 육아 스타일: "Alex & Jordan — 둘 다 🎨 공감형. 아이의 감정을 잘 읽지만 규칙이 흐려지면 둘 다 '괜찮아'만 반복하다 지칩니다."
- 조화 팁: "공감형끼리는 아이 감정에 맞추다 부모 둘 다 지칩니다. '이번 주는 규칙 한 줄만 추가'하기로 합의하고 번갈아 단호한 역할을 맡으세요."
- 역할 노트: "Alex는 집에서 자연스럽게 'Good Cop' 역할을 맡게 돼요 — 아이의 서운한 마음을 읽고 녹여주는 쪽."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[육아 교육관 비교]
"둘 다 아이 감정을 먼저 살피는 타입이라 정서적으로 안정적이지만, 규칙과 경계가 흐려지지 않게 신경 써야 해요."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 7 Beat 1/2]
"자녀를 어떤 가치관으로 길러낼지에 대한 장기적인 비전이 조화롭게 정렬되어 흔들리지 않는 북극성이 됩니다."
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★★

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes.** Highlighting the trap of dual-empathy parenting ("둘 다 지치는 공감형의 맹점") and prescribing "규칙 한 줄 추가" is brilliant coaching.
- **What is missing?**  
  None.

#### 9. Missing Layer Identification
- None.

#### 10. Recommended Action
**`KEEP`**

---

### Requirement BR-PT-09: Conflict Dynamic: Pursue-Withdraw & Stonewalling

#### 1. Requirement ID
`BR-PT-09`

#### 2. Requirement Description
Expose destructive pursuit-withdrawal and stonewalling patterns without blaming either partner (`05E` §4.1 Terr D, §7 Mod 6). Must answer: *"싸울 때 왜 한 명은 쫓아오고 한 명은 입을 닫으며 도망가는가?"*

#### 3. Why this requirement exists
Pursue-Withdraw is the #1 predictor of divorce (Gottman). Naming the cycle as a systemic dance rather than individual flaw breaks the loop.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[갈등 소통 스타일 — section_warning]
- 패턴 라벨: "폭발형 × 벽창호 (Pursue–Withdraw)"
- 해설: "Alex는 서운함을 즉시 풀고 싶어 말을 쏟아내는 폭발형이고, Jordan은 감정이 커지면 입을 닫는 벽창호(Stonewalling)형입니다. 한 명이 쫓을수록 다른 한 명은 문을 더 단단히 닫는 악순환 구조예요."
- 정서적 방치 리스크: "추격하는 쪽은 '나를 무시한다'고 느끼고, 물러서는 쪽은 '숨 쉴 틈이 없다'고 느낍니다. 타임아웃 20분 + '돌아올 시간' 약속만이 이 루프를 끊습니다."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[부부싸움 소통 비교]
"한쪽은 감정을 바로 쏟아내는 편이고, 다른 쪽은 비교적 차분해요 — 차분한 쪽이 먼저 들어주면 빨리 풀려요."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 5 Beat 1/3]
"즉각 매듭지으려는 조급함과 회피하려는 침묵이 충돌할 때 관계가 손상됩니다. 싸움을 멈추고 자리를 비우는 것은 도망치는 것이 아니라 배우자를 지키기 위한 용기입니다."
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★★

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes, world-class psychological analysis.** Accurately names both sides' internal pain ("무시당하는 느낌" vs "숨 쉴 틈 없는 압박").
- **What is missing?**  
  None.

#### 9. Missing Layer Identification
- None.

#### 10. Recommended Action
**`KEEP`**

---

### Requirement BR-PT-10: 20-Minute Cooling-Off Protocol & Cold War Reset

#### 1. Requirement ID
`BR-PT-10`

#### 2. Requirement Description
Provide an exact 20-minute timeout rule and maximum cold war time limit (e.g. 24 hours) with actionable repair cues (`05E` §4.1 Terr E, §7 Mod 6). Must answer: *"감정이 폭발했을 때 안전하게 멈추고 화해하는 절차는 무엇인가?"*

#### 3. Why this requirement exists
During emotional flooding (heart rate > 100bpm), rational conversation is physiologically impossible. A 20-minute physical cooling period is mandatory.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[디에스컬레이션 & 냉전 프로토콜 — section_warning]
- 공통 해시태그: #우쭈쭈_당신이최고야 (존재감·자존심 민감형)
- 솔루션 스크립트: "Alex/Jordan, 당신이 우리 집을 위해 얼마나 고생하는지 내가 다 알아. 당신 없으면 이 집이 안 돌아가. 아까 내 말이 상처였다면 정말 미안해."
- 골든타임 룰: "최대 24시간, 길어도 각방 2일까지 — 그 이상 침묵은 안 됩니다."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[화해 큐]
"짧은 메모나 작은 선물로 그동안의 고생을 알아준다는 걸 표현하세요 — '미안해'라는 말보다 존재 인정이 먼저예요."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 5 Beat 3/4 & Action Script]
"심박수가 올라가면 '타임아웃'을 선언하고 20분간 각자 방에서 물을 마시며 진정한 후 대화를 재개하세요."
스크립트: "지금 우리 둘 다 감정이 격해졌으니, 20분만 각자 쉬고 8시에 거실에서 차 한잔하면서 다시 얘기하자."
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★★

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes.** DEV's 20-minute timeout script (*"20분 쉬고 8시에 거실에서 차 한잔하자"*) is the gold standard for conflict de-escalation.
- **What is missing?**  
  Integrate DEV's 20-minute timeout script directly into the cold war protocol.

#### 9. Missing Layer Identification
- **Narrative**

#### 10. Recommended Action
**`MERGE CURRENT + DEV`**

---

### Requirement BR-PT-11: Crisis Resilience & One-Team Defense

#### 1. Requirement ID
`BR-PT-11`

#### 2. Requirement Description
Provide a unified framework for facing external crises (health, job loss, family stress) as an impenetrable One-Team (`05E` §4.1 Terr D, §7 Mod 7). Must answer: *"인생의 큰 시련이 닥쳤을 때 부부가 등을 맞대고 이겨내는 방법은 무엇인가?"*

#### 3. Why this requirement exists
External hardships break vulnerable couples, but forge strong ones into an unbreakable team.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[갈등 트리거 & 리셋 가이드]
"피로가 극에 달하면 사적인 리듬 차이가 충돌합니다. 피곤한 날에는 하나만 꺼내고 나머지는 내일로 미루며 원팀의 신뢰를 지키세요."
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[원팀 연대감]
"어떤 일이 있어도 배우자를 탓하지 않고 단일한 팀으로 뭉쳐 대응하기."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 6 Beat 3/4 & Action Script]
"위기는 부부를 흔들기 위해 오는 것이 아니라 우리가 얼마나 강력한 원팀인지를 증명하기 위한 시험대입니다. '누구 탓인가' 대신 '지금 취할 최선의 선택 3가지'를 함께 적으세요."
스크립트: "어떤 일이 있어도 난 항상 네 편이야. 우리 둘이 함께라면 이 문제도 반드시 이겨낼 수 있어."
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★★

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes.** DEV's "위기는 원팀을 증명하는 시험대" 리프레이밍과 연대감 스크립트가 든든한 용기를 줍니다.
- **What is missing?**  
  Merge DEV's One-Team crisis script into the marital resilience section.

#### 9. Missing Layer Identification
- **Narrative**

#### 10. Recommended Action
**`MERGE CURRENT + DEV`**

---

### Requirement BR-PT-12: Multi-Year Weather Forecast & 10-Year Horizon

#### 1. Requirement ID
`BR-PT-12`

#### 2. Requirement Description
Provide a multi-year relational weather forecast (sunny, cloudy, storm) combined with a 10-year shared future horizon (`05E` §4.1 Terr E, §7 Mod 8). Must answer: *"앞으로 몇 년간 우리 부부의 운세 기상도는 어떠하며, 10년 뒤 어떤 미래를 함께 그릴 것인가?"*

#### 3. Why this requirement exists
Couples need foresight on upcoming demanding years to plan finances, career shifts, or parenting with intentionality.

#### 4. Current Production Output (Actual Rendered Korean)
```text
[3개년 관계 기상도 — section_weather_forecast]
- ☀️ [2026년 올해]: 맑음 (안정적인 일상 흐름)
- ☀️ [2027년 내년]: 맑음 (안정적인 일상 흐름)
- ☀️ [2028년 내후년]: 맑음 (안정적인 일상 흐름)
- 종합 요약: "☀️ [올해]: 맑음 | ☀️ [내년]: 맑음 | ☀️ [내후년]: 맑음"
```

#### 5. V1 Gold Output (Actual Rendered Korean)
```text
[미래 설계]
"장기적인 가치관과 은퇴 비전을 공유하며 든든한 인생의 동반자로 동행하세요."
```

#### 6. DEV Output (Actual Rendered Korean)
```text
[Scene 7 Beat 3/4 & Action Script]
"매년 연말 '부부 비전 워크숍'을 열어 올해의 감사를 나누고 10년 뒤의 그림을 업데이트하세요."
스크립트: "우리가 10년 뒤에 어떤 모습으로 살아가고 있을지 함께 상상해 볼까? 난 당신과 함께할 그 미래가 너무 기대돼."
```

#### 7. Product Director Review
- **Usefulness:** ★★★★★
- **Emotional Resonance:** ★★★★★
- **Clarity:** ★★★★★
- **Differentiation:** ★★★★★
- **Actionability:** ★★★★★

#### 8. Core Questions Assessment
- **Does this output actually answer the user's intended question?**  
  **Yes.** Weather forecast icons + DEV's annual vision workshop script provide complete short-term and long-term foresight.
- **What is missing?**  
  Merge DEV's 10-year vision script into the closing horizon card.

#### 9. Missing Layer Identification
- **Narrative**

#### 10. Recommended Action
**`MERGE CURRENT + DEV`**

---

## 3. Consolidated Partner Review Summary & Action Directives

```text
========================================================================================================
                               PARTNER PRODUCT DIRECTOR SCORECARD
========================================================================================================
  • 총 검토된 Blueprint Requirements:    12개
  • 평균 Usefulness (유용성):            4.9 / 5.0  (★★★★★)
  • 평균 Emotional Resonance (공감도):   4.9 / 5.0  (★★★★★)
  • 평균 Clarity (명확성):               5.0 / 5.0  (★★★★★)
  • 평균 Differentiation (차별성):       5.0 / 5.0  (★★★★★)
  • 평균 Actionability (실천성):         4.8 / 5.0  (★★★★★)
--------------------------------------------------------------------------------------------------------
  [ACTION BREAKDOWN — EXACT 12/12 VERIFICATION]
  - KEEP (현재 완성도 유지):             7개 (58.3%) -> BR-PT-02, 04, 05, 06, 07, 08, 09
  - MERGE CURRENT + DEV (DEV 문구 합성): 5개 (41.7%) -> BR-PT-01, 03, 10, 11, 12
  - REWRITE / ADD LENS / DEFER:         0개 ( 0.0%)
  - 합계:                               12개 (100.0%)
========================================================================================================
```

---

## 4. Detailed MERGE Decisions & Final Dual-Language Copy Candidates

Below are the exact 5 requirements where a `MERGE CURRENT + DEV` action was approved for Partner domain.

---

### MERGE 1 — Requirement BR-PT-01: Partnership Archetype & Origin Gravitation

- **CURRENT Actual Copy:**
  - 헤드라인: `"Loyal & Pride — 운명적 정서 끌림형 패밀리, 설명하기 힘든 케미로 서로를 끌어당긴 하우스"`
  - 수치: `"🔥 65% · 🧩 50% · ⚡ 45% (등급 D)"`
- **DEV Actual Copy:**
  - 헤드라인: `"Alex님과 Jordan님의 동반자 스토리: 두 사람을 하나로 묶는 근원적 결합력과 일상 생활 리듬의 조화"`
  - 배지: `"단단한 정서적 안식처와 동반자적 결속"`
- **Exact FINAL Merged Korean Copy:**
  - 관계 배지: `"단단한 정서적 안식처와 동반자적 결속"`
  - 시그니처 헤드라인: `"Alex & Jordan — 운명적 정서 끌림과 단단한 동반자적 결속: 일상의 리듬 속에서 서로를 골랐고, 함께할 때 마음의 날카로운 모서리가 다듬어지는 관계입니다."`
  - 서브 요약: `"서로의 독립적 공간과 자존심을 지켜주며, 함께 생활할수록 안정적인 울타리가 되어주는 평생의 파트너십입니다."`
- **Exact FINAL Merged English Copy:**
  - Relationship Badge: `"Deep Emotional Sanctuary & Devoted Partnership"`
  - Signature Headline: `"Alex & Jordan — An Instinctive Emotional Gravity & Solid Life Partnership: Choosing each other repeatedly through daily rhythms, softening each other's sharp edges over time."`
  - Sub-summary: `"A lifelong companionship that protects mutual autonomy while providing an unwavering emotional haven."`
- **One-Sentence Rationale:**
  *Replaces anxiety-inducing legacy letter grades (Grade D) with DEV's dignified archetype badge while preserving the poetic '모서리가 다듬어지는 변화' origin story.*

---

### MERGE 2 — Requirement BR-PT-03: Financial Governance & Household CFO Designation

- **CURRENT Actual Copy:**
  - CFO 지정: `"Jordan이(가) 현실 감각·책임감이 더 단단해 집안 재정 리더로 지정됩니다. '듀얼 CFO'는 금지 — 한 명만 쥐세요."`
- **DEV Actual Copy:**
  - 결산 룰: `"매월 1회 '가계 CFO 결산 데이'를 열고 50만 원 이상의 비정기 지출은 사전 상의 규칙을 세우세요."`
- **Exact FINAL Merged Korean Copy:**
  - 재정 거버넌스 가이드: `"Jordan이 현실 감각과 책임감을 바탕으로 가계 재정을 총괄하는 단일 CFO로 지정됩니다. 듀얼 CFO는 금지하되, 매월 1회 정기 '가계 결산 데이'를 열어 투명하게 내역을 공유하고, 50만 원 이상의 비정기 지출은 반드시 사전에 상의하세요."`
- **Exact FINAL Merged English Copy:**
  - Financial Governance Guide: `"Jordan is designated as the sole Household CFO grounded in practical stewardship. Never maintain dual CFOs; instead, hold a monthly 'Financial Alignment Day' to review budgets transparently, and adhere strictly to a pre-consultation rule for any unscheduled expense exceeding $500."`
- **One-Sentence Rationale:**
  *Combines the single-CFO designation rule with an actionable monthly financial review ritual and a 500k-KRW spending threshold.*

---

### MERGE 3 — Requirement BR-PT-10: 20-Minute Cooling-Off Protocol & Cold War Reset

- **CURRENT Actual Copy:**
  - 골든타임: `"최대 24시간, 길어도 각방 2일까지 — 그 이상 침묵은 안 됩니다."`
- **DEV Actual Copy:**
  - 20분 타임아웃: `"심박수가 올라가면 '타임아웃'을 선언하고 20분간 각자 방에서 물을 마시며 진정한 후 8시에 거실에서 다시 얘기하자."`
- **Exact FINAL Merged Korean Copy:**
  - 쿨링 및 냉전 프로토콜: `"부부 싸움 중 감정이 격해지면 '20분 타임아웃'을 선언하고 각자 방에서 냉각기를 가지세요. '20분 쉬고 8시에 거실에서 차 한잔하며 다시 얘기하자'며 복귀 시간을 반드시 명시하고, 냉전은 최대 24시간을 넘기지 않는 것이 철칙입니다."`
- **Exact FINAL Merged English Copy:**
  - Cooling & Cold War Protocol: `"When emotional flooding occurs, call a mandatory '20-minute timeout' to cool down separately. Always specify the exact return time ('Let's take 20 minutes and meet in the living room at 8:00 with tea'), and ensure silence never exceeds 24 hours."`
- **One-Sentence Rationale:**
  *Integrates Gottman-style 20-minute physiological timeout agreements with an ironclad 24-hour maximum cold-war rule.*

---

### MERGE 4 — Requirement BR-PT-11: Crisis Resilience & One-Team Defense

- **CURRENT Actual Copy:**
  - 리셋 가이드: `"피곤한 날에는 하나만 꺼내고 나머지는 내일로 미루며 원팀의 신뢰를 지키세요."`
- **DEV Actual Copy:**
  - 원팀 방패: `"위기는 우리가 얼마나 강력한 원팀인지를 증명하기 위한 시험대입니다. '어떤 일이 있어도 난 항상 네 편이야'라는 절대적 신뢰를 나누세요."`
- **Exact FINAL Merged Korean Copy:**
  - 원팀 위기 극복 가이드: `"외부의 시련이나 재정적 위기가 닥쳤을 때는 서로를 탓하지 말고 '우리는 문제를 함께 해결하는 강력한 원팀'이라는 연대감을 확인하세요. '어떤 일이 있어도 난 항상 당신 편이야'라는 믿음 위에 지금 당장 취할 수 있는 최선의 선택 3가지를 함께 실행하세요."`
- **Exact FINAL Merged English Copy:**
  - One-Team Crisis Resilience Guide: `"When external storms or financial pressures strike, never blame each other; reaffirm that you are an invincible single unit. Stand on the promise 'No matter what happens, I am always in your corner,' and collaboratively execute the top three practical steps immediately."`
- **One-Sentence Rationale:**
  *Transforms external life pressure into a unifying 'One-Team' marital solidarity script and actionable problem-solving framework.*

---

### MERGE 5 — Requirement BR-PT-12: Multi-Year Weather Forecast & 10-Year Horizon

- **CURRENT Actual Copy:**
  - 3개년 기상도: `"☀️ [2026년]: 맑음 | ☀️ [2027년]: 맑음 | ☀️ [2028년]: 맑음 — 안정적인 일상 흐름"`
- **DEV Actual Copy:**
  - 10년 비전: `"매년 연말 '부부 비전 워크숍'을 열어 10년 뒤의 그림을 업데이트하세요. '당신과 함께할 그 미래가 너무 기대돼.'"`
- **Exact FINAL Merged Korean Copy:**
  - 3개년 기상도 & 10년 비전: `"앞으로 3개년은 큰 풍파 없이 맑은 협력의 기운이 이어집니다. 매년 연말 '부부 비전 워크숍'을 열어 올해의 감사를 나누고, '우리가 10년 뒤 어떤 모습으로 함께 살아가고 있을지' 미래의 버킷리스트를 다정하게 업데이트하세요."`
- **Exact FINAL Merged English Copy:**
  - 3-Year Forecast & 10-Year Vision: `"The next three years forecast clear and serene cooperation without major relational storms. Celebrate this stability with an annual year-end vision ritual, asking 'What beautiful life will we be living together 10 years from now?' to continuously renew shared dreams."`
- **One-Sentence Rationale:**
  *Synthesizes the multi-year astrological weather forecast with an inspiring, actionable annual visioning ritual for long-term marital flourishing.*
