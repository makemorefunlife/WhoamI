# 009 — Family Part2 축 A/B (correction_style · bond_distance)

**날짜:** 2026-07-20  
**상태:** 구현 대상 (A/B만). C~F·Part3 금지.  
**원칙:** `parentRole`은 질문·제목·문맥·출력 우선순위만. 원국 점수를 role로 가감하지 않음.

---

## Step 1. Source inventory

### A축 후보

| Source | 파일/함수 | 계산 근거 | person/pair | 현재 소비 위치 | A/B 사용 적합성 | 중복 위험 |
|--------|-----------|-----------|-------------|----------------|-----------------|-----------|
| `profileTenGods` / TenGodCounts | `marriageTenGodAnalysis.profileTenGods` | 십신 5범주 합산; argmax로 우세 카테고리 | person | 비교표①, de-escalation 카드 선택 | **A person 스타일 bucket** (de-escalation과 동일 맵핑 유지) | ①④⑤와 십신 공간 공유 — A는 “스타일”만, intensity는 pair로 분리 |
| `home_punishment.family_conflict_index` | `extractFamilySignals` | 년·월·일 지지 **형**×25 + 년주 긴장×10; `clampScore` | person | PersonCore bake-in; pair `nagging`에 count로 재집계 | **A person 스타일에 섞지 않음** — pair/climate용. 형=구조 압력이지 반응 스타일이 아님 | nagging이 이미 punishment_count 사용 → person에 또 넣으면 이중 집계 |
| `nagging_trigger_index` / `nagging_band` | `pairFamilySignals` | seal_excess·smother·punishment_count·combinedKarma; band=`intensityBand3` (34/67) | **pair** | `buildFamilyPrescriptions` | **A 관계 해석(마찰)** SSOT 재사용 | person style과 입력이 겹치지만 레이어가 다름(스타일 vs 조합 마찰) |
| `origin_family_tension` | `sharedPersonaSignals.resolveOriginFamilyTension` | hyoshin/sealExcess/yearTension; threshold 55 | person | 비교표② | **A 부적합 / B bucket에도 사용 금지** (원가족 거리 ≠ 부모유대) | B와 혼동 위험 높음 → Part4 후보 |
| `conflict_style` / `self_control` | psych 11축 | 설문 | person | Family psych lens 카피 | **enrichment only** — bucket 불변 | 설문으로 사주 bucket 덮어쓰면 안 됨 |
| de-escalation | `buildChildDeEscalationCard` | child 십신 argmax → 5 archetype | person(child) | Part5 | A person bucket과 **동일 카테고리 체계** 유지 | 비교표와 다른 맵핑을 새로 만들면 리포트 내부 충돌 |

### B축 후보

| Source | 파일/함수 | 계산 근거 | person/pair | 현재 소비 위치 | A/B 사용 적합성 | 중복 위험 |
|--------|-----------|-----------|-------------|----------------|-----------------|-----------|
| `seal_parent.parent_bond_band` | `extractFamilySignals.parentBondBand` | sealIsolated(seal==0)→distant; sealExcess(seal≥3)→smothering; seal≥2→balanced; else distant | person | tenGod `lens_summary` 보강 문구만 | **B 좌/우 person 칸 SSOT** | umbilical이 bond_band를 입력으로 씀 — 개념은 다름(개인 유대 vs 쌍 분리 과제) |
| mother/father profile seal | `familyParentTenGodAnalysis` | child.seal / parent.seal 지지 서술 | person+role 카피 | lens_summary | 계산 변경 없음; B bucket 비사용 | — |
| `umbilical_separation_index` / band | `pairFamilySignals` | bond mismatch·smother/distant 조합·seal 차이; band 34/67 | **pair** | prescriptions `umbilical_independence` | **B 관계 해석 칸** | bond와 입력 공유하나 출력 의미가 “분리 과제” |
| `origin_family_tension` | 위와 동일 | 원가족 긴장 | person | 비교표② | B 본체에서 **제거** | 구②와 혼동 |
| empathy / resilience | psych 11축 | 설문 | person | Family lens | **enrichment only** | — |

### 핵심 확인 답

1. **`parent_bond_band` threshold (기존):**  
   - `seal === 0` → `distant`  
   - `seal >= 3` (`sealExcess`) → `smothering`  
   - `seal >= 2` → `balanced`  
   - else → `distant`  
   신규 컷오프 없음.

2. **`umbilical_separation_index` (기존):** base 22 + smother↔distant 불일치 +35, 둘 smother +18, 둘 distant +12, 어느 한쪽 seal_isolated +15, `|seal_count 차|×6`; `intensityBand3`: ≥67 high, ≥34 medium, else low.

3. **다른 개념인가?**  
   - bond = **한 사람**의 인성(印) 기반 밀착/거리 경향  
   - umbilical = **두 bond 패턴의 조합**으로 본 분리·독립 **과제 강도**  
   → 같음 ≠ 동일. balanced+balanced여도 seal_count 차로 umbilical이 올라갈 수 있음.

4. **home_punishment vs nagging:**  
   - punishment는 person 차트 형살  
   - nagging은 양측 seal_excess/smother + **양측 punishment_count 합** + karma  
   → 같은 입력을 pair가 집계. person correction **스타일**에 punishment를 다시 넣지 않음.

5. **11축:** 계산 본체 아님. A/B 모두 **copy/detail enrichment only** (이번 구현에서는 enrichment 필드도 최소 — bucket 불변 테스트로 고정).

---

## Step 2. 의미 사슬

### A. correction_style

```
Raw Saju (십신 배치)
  → profileTenGods / argmax category
  → person correction_style_bucket (food|self|seal|officer|wealth)
  → “지적·교정이 들어올 때 방어·표출·침묵·반박·실리 반응 유형”
  → pair nagging_band (기존 PairFamilySignals)
  → “둘이 만날 때 잔소리·교정 마찰 강도”
  → 비교표 좌우=person style / 의미칸=pair friction
  → Part5 de-escalation은 동일 child category 유지
```

- **고전/내부 근거:** 십신 반응 유형(비겁·식상·인성·관성·재성)을 “교정 상황 반응”으로 앱 내부 매핑(기존①·de-escalation과 동일).  
- **말할 수 있는 범위:** 반응 **유형** 차이, 쌍의 **마찰 밴드**.  
- **추론 금지:** 누가 옳다, 사랑 없음, 학대.  
- **threshold:** 신규 없음. pair band는 기존 34/67.

### B. bond_distance

```
Raw Saju (印 개수·과다)
  → seal_parent.parent_bond_band
  → person bond_distance bucket (distant|balanced|smothering)
  → “부모 관계에서 밀착 vs 거리 편안함”
  → pair umbilical_band
  → “이 쌍의 분리·독립 과제”
  → 비교표 좌우=person bond / 의미칸=umbilical
  → origin_family_tension은 B에서 제외
```

- **근거:** 印=양육·의존·보호 신호(기존 FamilySajuSignals).  
- **금지:** “원가족을 싫어한다”, bond=umbilical 동일시.  
- **threshold:** 전부 기존.

### parentRole

- mother 문맥 제목 예: 보호와 독립의 전환 / 교정 순간의 반응  
- father 문맥 제목 예: 관여와 자율의 조율 / 지적·교정에 대한 반응  
- **동일 primitive·동일 bucket**

---

## Step 3. SSOT

| 레이어 | 신호 | 결정 |
|--------|------|------|
| person | `correction_style_bucket` | 신규 저장 필드 불필요 — `profileTenGods` argmax 재사용 (de-escalation과 공유 함수) |
| person | `parent_bond_band` | **기존** `FamilySajuSignals.seal_parent` |
| pair | `nagging_*` | **기존** 재사용 = A 마찰 |
| pair | `umbilical_*` | **기존** 재사용 = B 관계 해석 |
| UI | compare table | 계산 금지, 결과 소비만 |

`home_punishment` → A person에 미투입.  
`origin_family_tension` → B bucket 미사용 (행 제거·교체).

---

## Step 6. 11축

| 축 | 분류 |
|----|------|
| A | **사용하지 않음** (bucket·의미 밴드 모두 사주/pair만). 향후 enrichment 여지는 남기되 이번 커밋에 psych 입력 없음 |
| B | **사용하지 않음** (동일) |

테스트: psych 유무와 무관하게 A/B bucket·pair band 동일.
