# 008. Family 비교표 — 관계유형(Role) 미반영 문제 조사

상태: **조사/설계안만 — 코드 미수정**
관련: 006 로드맵 Step3(family 6행 비교표 구현) 사후 발견 이슈

## 배경

라이브 테스트에서 엄마-자녀/아빠-자녀 리포트의 6개 비교축 결과가 동일하게 나오는 현상 보고("또 똑같아"). 원인 조사 및 "Family Role Lens" 설계안 요청. **이번 문서는 조사·설계만 다루며 `familySajuCompareTable.ts` 등 기존 코드는 전혀 수정하지 않았다.**

---

## Q1. 현재 Family는 관계유형(엄마-자녀/아빠-자녀/형제)을 구분하는가?

**부분적으로 구분한다 — 그런데 비교표만 구분하지 않는다.**

- `FamilyRuleContext.parentRole: FamilyParentRole`("mother"|"father")는 `buildFamilyRuleContext.ts`에서 이미 계산·보관되고 있고, `familyParentTenGodAnalysis.ts`의 `buildMotherProfile`/`buildFatherProfile`이 실제로 이 값을 써서 서로 다른 로직으로 분기한다(`child.seal>=2` vs `child.wealth>=2` 트리거, `parent.seal` vs `parent.wealth` 지지력 판단).
- 그런데 `familySajuCompareTable.ts`의 6개 `resolve*Bucket` 함수는 **`parentRole`을 파라미터로 받지 않는다.** `buildFamilySajuCompareTable()` 호출부(`buildFamilyParentReport.ts`)도 `parentRole`을 넘기지 않는다. 그래서 엄마-자녀 쌍과 아빠-자녀 쌍이 같은 `countsParent`/`countsChild` 패턴을 가지면 6행 모두 동일하게 나온다 — 이번 버그의 정확한 원인.
- **형제(sibling)는 타입 시스템 자체가 지원하지 않는다.** `lib/relationship/familyParent/types.ts`의 `isValidParentChildPair()`는 두 역할 집합에 반드시 `"child"` 하나 + `"mother"`|`"father"` 하나가 있어야 `true`를 반환한다. `FamilyPairRole = "mother" | "father" | "child"` 세 값 뿐이라 형제-형제 조합은 애초에 유효한 페어로 검증되지 않는다. 형제 관계는 role 모델링(타입 추가)부터 별도 결정이 필요한 **구조적 갭**이며, 이번 설계안에서는 "가정 시 이런 축이 가능하다"는 수준까지만 제시한다.

---

## Q2/Q4. 역할별로 어떤 원시신호가 어떤 테마를 대변할 수 있는가 — 축 구성안

원칙 재확인: "엄마=인성, 아빠=관성" 같은 고정 매핑 금지. 아래 안은 **primitive를 역할에 귀속시키지 않는다** — 모든 역할이 같은 primitive pool을 쓰되, ①어떤 축을 포함할지(구성), ②같은 축을 어떤 질문/장면으로 프레이밍할지만 역할별로 달라진다.

**공통 축(3개 관계유형 모두 동일하게 유지) — 이미 role-agnostic한 "일반 성향" 축이라 재해석 없이도 자연스러움:**

- ① 잔소리·지적 반응 (`ten_god_dominant_category` argmax)
- ③ 마음 표현 방식 (`dominant_element` argmax)
- ⑤ 가족행사 후 에너지 회복 (day_master_strength_band 로컬 재계산)
- ⑥ 가족모임 대화 온도 (`johu_profile.temperature_band`)

**역할별 교체/재해석 축(2개 슬롯):**

| 슬롯 | mother-child | father-child | sibling(가정) |
|---|---|---|---|
| 슬롯A (현재 ②원가족거리) | `origin_family_tension` 유지 — "보호-독립 편안함" 프레이밍(밀착 vs 독립 어느 쪽이 편한지) | **축 자체 교체 제안**: `wealth_officer_power`(재+관 합산, cohabitation 도메인 기존 SSOT) — "책임/주도 성향" 프레이밍. 원가족긴장도를 "자녀에게 자율성을 얼마나 주는가"로 재해석하는 건 원신호 의미(본인-원가족 관계)에서 너무 멀어져 과잉해석 위험이 큼 | `origin_family_tension` — "부모 자원을 두고 느끼는 위치 감각"(원가족 내 긴장도를 형제 서열 맥락으로) — 과잉해석 위험 높음, 검증 전 보류 권장 |
| 슬롯B (현재 ④돌봄공감기준) | `parenting_style_lean` 유지 — "정서 수용 vs 원칙" 프레이밍(공감형=정서 먼저 살핌) | `parenting_style_lean` 유지, 동일 계산 — "성장 피드백 스타일" 프레이밍(공감형=격려 중심, 원칙형=기준 중심). *같은 2극 구조가 양쪽 테마에 자연히 대응되는 사례* | `parenting_style_lean` — "형제간 챙김 vs 각자도생" 프레이밍(계산 동일, 장면만 형제 맥락으로) |

---

## Q3. "Family Role Lens" 레이어 구조 — 구현 가능성

가능하다. 기존 SSOT/primitive 계산을 전혀 바꾸지 않고 아래처럼 **계산과 축-구성 사이에 순수 함수 하나**를 추가하는 형태로 표현 가능:

```
Raw Saju
  → Shared Signals / PersonCore (ten_god_dominant_category, origin_family_tension,
     dominant_element, parenting_style_lean, day_master_strength_band, johu_profile,
     wealth_officer_power ...)  ← 계산 로직 무변경
  → Family Role Lens: resolveFamilyRoleLens(role: "mother"|"father"|"sibling")
       → { axisComposition: FamilyCompareRowId[], sceneFraming: Record<RowId, SceneKey> }
  → Role-specific 6축 비교 (동일 resolve*Bucket 함수 재사용, sceneFraming만 카피 조회 키로 사용)
  → Copy (locale × sceneFraming 키로 라벨/의미 조회)
```

핵심은 Lens가 "누가 어떤 god을 쓰는지"를 결정하지 않고, "이미 계산된 같은 bucket을 어떤 질문으로 보여줄지"만 결정한다는 것 — 그래서 스테레오타입 고정 매핑을 구조적으로 피할 수 있다. 슬롯A의 father-child 케이스처럼 축 자체를 교체하는 경우도, "father라서 wealth_officer_power를 쓴다"가 아니라 "이 role lens가 이 테마(책임/리더십)를 원가족긴장도보다 더 잘 대변하는 신호로 판단했다"는 편이 원칙에 더 부합 — 다만 이 부분은 실제로는 role과 1:1 대응이라 사실상 스테레오타입과 경계가 모호하다는 점은 솔직히 인정해야 함(아래 위험 참고).

---

## 요청하신 비교표

| 관계 유형 | 추천 6축 | 사용 primitive | 기존 축 재사용 여부 | 과잉해석 위험 |
|---|---|---|---|---|
| **mother-child** | ①잔소리반응 / ③마음표현 / ⑤회복방식 / ⑥대화온도 / ②원가족거리→"보호-독립" / ④돌봄공감기준→"정서수용" | `ten_god_dominant_category`, `dominant_element`, day_master_strength_band, `johu_profile`, `origin_family_tension`, `parenting_style_lean` | 6/6 전량 재사용(신규 primitive 없음) | 낮음 — ②는 "본인-원가족 관계"를 "본인의 밀착/독립 성향 일반"으로 일반화하는 정도의 해석이라 무리가 적음 |
| **father-child** | ①③⑤⑥ 공통 유지 / ④돌봄공감기준→"성장피드백" / **②를 wealth_officer_power→"책임/주도"로 교체** | 위 4개 공통 + `parenting_style_lean` + `wealth_officer_power`(cohabitation 도메인 기존 SSOT, family는 미사용 중) | 5/6 재사용 + 1개는 **타 도메인에서 이미 검증된 SSOT를 family로 최초 도입**(신규 계산식 발명 아님) | 중간 — wealth_officer_power를 "아빠다움"이 아니라 "이 role lens가 선택한 테마"로 문서화해도, 실제로는 father 역할에서만 등장하므로 독자가 "아빠=재관"으로 읽을 여지가 있음. 카피에서 "이 사람의 책임 성향"이라고만 쓰고 "아빠라서"라는 인과를 절대 명시하지 않는 가드가 필요 |
| **sibling**(가정, 미구현) | 타입 시스템 미지원 — `isValidParentChildPair`가 형제 조합을 거부. 설계상 가정: ①③⑤⑥ 공통 + ②원가족거리→"서열 위치 감각" + ④돌봄공감기준→"챙김 vs 각자도생" | 동일 6개 primitive (신규 없음) — 단, "형제" role 자체가 `FamilyPairRole`에 없어 파이프라인 진입 불가 | 개념상 6/6 재사용 가능 | **구현 전 단계이므로 판단 보류.** 원가족긴장도를 "형제 서열 갈등"으로 재해석하는 건 원신호와 거리가 있어 실제 데이터 검증 없이는 과잉해석 위험 높음으로 평가 |

---

## 남는 결정 사항 (구현 착수 전 확인 필요)

1. father-child 슬롯A 교체안(`wealth_officer_power` 도입)은 가장 "설계상 그럴듯하지만 스테레오타입 경계가 가장 얇은" 항목 — 채택 여부 별도 확인 요청.
2. sibling은 `FamilyPairRole`에 새 값 추가부터 필요 — 이번 로드맵(006) 범위 밖의 별도 타입 확장 작업. 우선순위 판단 필요.
3. `resolveFamilyRoleLens` 도입 시 `buildFamilySajuCompareTable()` 시그니처에 `parentRole` 파라미터 추가가 불가피 — Step3에서 이미 만든 6개 `resolve*Bucket`/`*_LABEL`/`*_MEANING` 구조 자체는 유지되고, 그 위에 lens 매핑 테이블만 얹는 구조로 최소 변경 가능해 보임(실제 diff 크기는 구현 단계에서 재확인).

이 설계안에 대한 승인/조정 후 구현 단계로 넘어가면 됩니다.

---

## 추가 확정 (사용자 최소변경 지침 반영, 여전히 코드 미수정)

사용자 결정: parentRole 신규 타입 확장 금지(기존 `FamilyParentRole` 재사용) / sibling 이번 단계 제외 /
father-child ②에 wealth_officer_power 도입 보류 / ①③⑤⑥ 공통 유지, ②④만 역할별 재해석.

### 축별 역할 재해석안

| 축 | 현재 primitive | mother-child 질문/라벨 | father-child 질문/라벨 | 계산 변경 여부 | 과잉해석 위험 |
|---|---|---|---|---|---|
| ①잔소리반응 | `ten_god_dominant_category` | (공통 유지, 미변경) | (공통 유지, 미변경) | 없음 | — |
| ②원가족거리 | `origin_family_tension`(needsStrongBoundary) | **"보호와 독립의 거리"** — needs_distance: "보호받기보다 스스로 해내고 싶어하는 타입" / comfortable: "필요할 때 보호받는 게 편안한 타입" | **"자율성과 관여의 거리"** — needs_distance: "관여보다 스스로 판단할 여지를 원하는 타입" / comfortable: "적당한 관여와 지도가 편안한 타입" | **없음** — bucket/relation 계산 100% 동일, LABEL·MEANING·축 제목 카피만 분기 | 중간 — origin_family_tension은 원래 "본인-원가족" 관계 신호를 "부모-자녀 보호/자율 감각"으로 옮기는 해석적 도약이 이미 있음(007 문서에서도 인지). mother/father 두 프레임이 동일한 정도로 이 도약을 안고 있어 역할 간 위험 격차는 없음 |
| ③마음표현 | `dominant_element` | (공통 유지, 미변경) | (공통 유지, 미변경) | 없음 | — |
| ④돌봄균형 | `parenting_style_lean`(empathy/structure) | **"감정 수용과 기준의 균형"** — empathy: "감정부터 알아주는 게 편한 타입" / structure: "기준이 분명한 게 편한 타입" | **"설명·지도와 기준의 균형"** — empathy: "이유와 맥락을 먼저 설명해주는 타입" / structure: "명확한 기준부터 세우는 타입" | **없음** — 동일하게 bucket/relation 불변, 카피만 분기 | 낮음 — parenting_style_lean은 원래 돌봄 상황의 공감/원칙 성향을 직접 측정하므로 두 프레임 모두 원신호에서 크게 벗어나지 않음 |
| ⑤회복방식 | day_master_strength_band(margin=1) | (공통 유지, 미변경) | (공통 유지, 미변경) | 없음 | — |
| ⑥대화온도 | `johu_profile` | (공통 유지, 미변경) | (공통 유지, 미변경) | 없음 | — |

### 1. 최소 파일 변경 범위

- `lib/relationship/familyParent/familySajuCompareTable.ts` — `buildFamilySajuCompareTable()` params에 `parentRole?: FamilyParentRole` 추가(타입은 `./types`에서 import, 신규 타입 없음). row②·row④ 생성부만 `parentRole`로 LABEL/MEANING/축 제목 딕셔너리를 선택하도록 분기. `resolve*Bucket`/`nominalRelation`/pair relation 로직은 전혀 건드리지 않음.
- `lib/relationship/familyParent/buildFamilyParentReport.ts` — `buildFamilySajuCompareTable({...})` 호출부에 `parentRole: ctx.parentRole` 한 줄 추가. `ctx.parentRole`은 `buildFamilyRuleContext.ts`가 이미 계산해 두던 값이라 **신규 계산 없음**.
- `buildFamilyRuleContext.ts`, i18n 카탈로그(`en-US.ts`/`ko-KR.ts`) — **미변경**. 이 축들의 카피는 원래부터 메시지 카탈로그가 아니라 `familySajuCompareTable.ts` 내부 로컬 상수라 카탈로그 파일을 건드릴 필요가 없음.

총 2개 파일, 신규 파일 0개.

### 2. parentRole 없을 때 fallback

`parentRole`이 `undefined`이거나 `"mother"`/`"father"`가 아닌 경우, **현재 배포된 기존 LABEL/MEANING/제목 문구를 그대로 "neutral" 기본값**으로 사용한다(신규 문구 발명 없음 — 지금 라이브에 나가는 문구를 그대로 기본값 자리로 재배치). 즉 `parentRole` 미전달 호출은 오늘과 100% 동일한 출력을 내야 하며, 이는 그대로 회귀 테스트 기준선이 된다.

### 3. locale별 필요 copy key

메시지 카탈로그 변경 없음. `familySajuCompareTable.ts` 내부의 4개 상수만 role 레이어를 한 단계 추가:

- `ORIGIN_FAMILY_DISTANCE_LABEL`: `Record<Locale, Record<"neutral"|"mother"|"father", Record<"needs_distance"|"comfortable", string>>>`
- `ORIGIN_FAMILY_DISTANCE_MEANING`: 위와 동일 구조, `{same, diff}`
- `CARE_BALANCE_LABEL` / `CARE_BALANCE_MEANING`: 동일 패턴
- row②·④의 축 제목(`label` 인자, 현재 `pick(locale, "...", "...")` 단일 호출) → `parentRole`에 따라 pick 호출 자체를 분기(neutral/mother/father 3벌)

기존 `"needs_distance"|"comfortable"`, `"empathy"|"structure"` bucket 키, `same|diff` 관계 키는 그대로 재사용 — 새 키는 오직 role 계층(neutral/mother/father) 하나뿐.

### 4. 테스트 케이스

1. **fallback 회귀**: `parentRole` 미전달 호출 → 기존 `family-compare-table.test.mjs` 스냅샷/deepEqual과 100% 일치.
2. **role 분기 동작**: 동일 counts/chart 입력, `parentRole: "mother"` vs `"father"` 두 번 호출 → row②·④의 `label`/`personParent.shortLabel`/`personChild.shortLabel`/`meaning`이 서로 달라야 함.
3. **불변 축 검증**: 같은 두 호출에서 row①③⑤⑥은 byte-identical이어야 함(“일부 축만 달라야 한다”는 제약을 테스트로 고정).
4. **계산 불변 검증**: `resolveOriginFamilyDistanceBucket`/`resolveCareBalanceBucket`의 리턴값(bucket)이 role 인자와 무관하게 동일 — 즉 role은 카피 레이어에서만 소비되고 계산 함수 시그니처 자체는 변경되지 않았음을 직접 호출로 재확인.
5. **콤보키 누락 검증**: mother/father × 가능한 모든 bucket 조합에 대해 LABEL/MEANING 조회가 `undefined`가 되는 케이스가 없는지 전수 확인(이전 세션에서 실제로 발생했던 alphabetical sort 콤보키 누락 버그 재발 방지).
6. **locale parity**: en-US/ko-KR 두 로케일 모두 동일한 role×bucket 키 구조를 갖는지 확인.
7. **결정성**: 동일 입력+동일 role → 반복 호출 결과 동일.

승인해주시면 이 범위로만 구현하겠습니다.
