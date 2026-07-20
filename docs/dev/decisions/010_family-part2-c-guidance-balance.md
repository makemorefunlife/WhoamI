# 010 — Family Part2 축 C (guidance_balance)

**날짜:** 2026-07-20  
**상태:** 구현 (C만). A/B 불변. D~F·Part3 금지.  
**원칙:** `parentRole`은 질문·제목·문맥만. 원국 점수를 role로 가감하지 않음.  
**A 상태 고정:** `correction_style`은 ten-god style bucket **v1** 재사용. `correction_reactivity` 신규 엔진은 아님(Part5에서 부족 시 v2 검토).

---

## Step 1. Source inventory

| Source | 파일/함수 | primitive | 현재 의미 | 현재 소비 위치 | C축 재사용 적합성 | 중복/충돌 위험 |
|--------|-----------|-----------|-----------|----------------|-------------------|----------------|
| `resolveParentingStyleLean` | `sharedPersonaSignals` → marriage `resolveParentingStyle` | food vs seal+officer | Marriage **양육 가치** 2분류(empathy/structure) | marriage 비교표·homeReport; family 구 `care_balance` | **이름만 바꿔 쓰지 않음** — 개념이 “부부 육아관”에 가깝고 수용/설명/기준 3채널을 구분 못 함 | Family C와 병행 시 같은 십신을 다른 bucket으로 읽음 → Family는 lean 미사용 |
| `resolveParentingStyle` | `marriageTenGodAnalysis` | food≥2 또는 food>seal+officer 등 | 공감형 vs 규칙형 라벨 | marriage only | Marriage 회귀 유지. Family C 입력 아님 | Family가 lean을 계속 쓰면 “지도 방식”을 과소 표현 |
| mother/father profile | `familyParentTenGodAnalysis` | child.seal / parent.seal vs wealth/officer **role 분기** | parent_lens_summary·care_style 카피 | Part4 lens_summary | **계산 재사용 금지**(role이 점수 경로에 들어감). C와 별개 카피 레이어 | C와 다른 공식 → 문서상 “후속 SSOT 연결”만 |
| `parent_lens_summary` | 위 → `familyReportTemplate` | role 카피 + bond 보강 | 부모 렌즈 한 줄 | Family UI Part4 | C와 **다른 계산** — 이번 단계 재작성 안 함 | 독자가 C와 lens를 동일시할 수 있음 → 한계로 명시 |
| seal / food / officer | `profileTenGods` | 印·식상·관 카운트 | 보호·표현·규율 원시량 | A style argmax, B seal_bond, lean | **C person scores** (세 채널만) | A는 5범주 argmax; C는 3채널 — 공간 공유하나 질문 다름 |
| wealth | `profileTenGods` | 재성 | 현실·자원 | father lens 카피 | **C 미사용**(지도 채널 아님; father 가중 금지) | father=wealth 고정관념 |
| 11축 Empathy/Structure 등 | psych | 설문 | 표현 보조 | psych radar | **미사용** (bucket 불변) | 설문으로 사주 덮어쓰기 금지 |
| Part3 growth | `familyKillerSections` | pair/archetype 카피 | 성장 터널 | growth_tunnel | 이번 단계 코드 연결 없음 | 후속: guidance mode를 challenge 문장에 주입 가능 |
| Part4 parent lens | `parent_lens_summary` | 위 | 역할 렌즈 | UI | 후속 연결 후보 | 지금 연결하면 role 가중 경로와 충돌 |

### 감사 답

1. **parenting_style_lean bucket:** `empathy` | `structure` 만. tie는 food≥seal+officer면 empathy. **mixed 없음.**  
2. **Family “지도 방식” ≠ Marriage “육아 스타일”:** 후자는 부부 맥락의 감정vs원칙; 전자는 수용·설명·기준 **채널**. lean만 리네임하면 설명 채널이 사라짐.  
3. **parent_lens_summary vs C:** lens는 mother→seal / father→wealth·officer **role 분기 카피**. C는 role 없는 seal/food/officer. **충돌 가능** — 이번 단계 lens 미수정, 후속 SSOT 계획만 문서화.  
4. **3채널 구분 가능 여부:** seal·food·officer 상대 우세로 **가능**. 단 “강도 밴드”나 “잘함/못함”은 말할 수 없음.  
5. **말할 수 없는 것:** 좋은 부모, 사랑 크기, mother=정서/father=규율 단정, wealth 기반 아빠다움.

---

## Step 2–3. 개념·신호 설계

```
Raw Saju (십신)
  → profileTenGods.seal / .food / .officer
  → resolveGuidanceProfile → person mode (receptive|explanatory|standards|mixed)
  → resolveGuidanceFit(modeA, modeB) → pair fit (aligned|partial|mismatch)
  → 비교표 C: 좌우=person mode / 의미=fit (parentRole 문맥 카피만)
```

| 레이어 | 신호 | 위치 |
|--------|------|------|
| person | `resolveGuidanceProfile` | `lib/personCore/sajuSignals/guidanceProfile.ts` |
| pair | `guidance_fit` | `PairFamilySignals` (+ `buildPairFamilySignals` optional modes) |
| UI | `guidance_balance` row | compare table **소비만** |

**bucket 규칙 (신규 수치 threshold 없음):**  
세 점수 중 유일한 최댓값 → 해당 mode. 최댓값 동점(0 포함 전원 동점) → `mixed`.

**fit:** same→aligned; 한쪽 mixed→partial; 서로 다른 순수 mode→mismatch.

**2분류만 쓰자는 대안을 기각한 이유:** lean은 설명을 seal+officer에 흡수해 사용자 질문(수용·설명·기준)을 충족 못 함. 3채널은 기존 primitive만 쓰며 cut-off 발명 없음.

---

## Step 4. 11축

| 역할 | 결정 |
|------|------|
| C | **미사용** — bucket·fit 불변. enrichment도 이번 커밋에 없음 |

사주 vs 설문 충돌 시: **bucket을 바꾸지 않음.** “겉으로 보이는 방식” 별도 표시도 이번 단계 없음.

---

## Step 5. parentRole

- mother 제목/의미: 돌봄·걱정·일상 개입 장면  
- father 제목/의미: 지도·기대·책임 대화 장면  
- person mode·pair fit **동일**

---

## Step 6. 기존 섹션 통합 계획 (이번 단계 코드 최소)

| 섹션 | 이번 단계 | 후속 |
|------|-----------|------|
| compare table C | `guidance_balance`로 교체, lean 제거 | — |
| `parent_lens_summary` | **미수정** | guidance mode를 렌즈 요약에 주입( role 가중 제거와 함께) |
| Part3 growth | **미수정** | growth challenge에 fit/mismatch 힌트 |
| Part4 destiny/lens | **미수정** | 위와 동일 SSOT |
| Marriage lean | **불변** | Family와 공유 금지 유지 |
| Part5 prescriptions | pair `guidance_fit` 필드만 준비, 소비 안 함 | fit 기반 처방전 가능 |

---

## 한계

- mode는 **상대 우세**일 뿐 절대 강도 아님(전부 0이면 mixed).  
- A의 correction style(5범주)과 C의 guidance(3채널)는 같은 십신을 다른 질문으로 자름 — 의도적.  
- lens_summary는 아직 role 고정 카피라 C와 어긋날 수 있음.
