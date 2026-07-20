# 014 — Family Part2 최종 축 구성

**날짜:** 2026-07-20  
**상태:** 결정 확정 (코드·비교표 미수정)  
**선행:** 잔여 축(affection/recovery) 감사 승인 · F 결정 013 · D 결정 011

---

## 결정 요약

- **현재 비교표 6행을 유지**한다.
- **`affection_expression` · `gathering_recovery` 유지** — A/B/C/E보다 Family 고유성이 낮은 **보조 축**으로 분류한다.
- 향후 축 축소·교체가 필요하면 **`gathering_recovery`를 우선 재검토**한다.
- affection을 `recognition_fit`으로 바꾸지 않는다 (013).
- recovery를 억지 Family 전용 축으로 재해석하지 않는다.
- **대체 SSOT 없이 새 Family 축을 만들지 않는다.**

---

## 1. 최종 6행 순서

| # | row id | 분류 |
|---|--------|------|
| 1 | `correction_style` | **핵심** A |
| 2 | `bond_distance` | **핵심** B |
| 3 | `affection_expression` | **보조** |
| 4 | `guidance_balance` | **핵심** C |
| 5 | `gathering_recovery` | **보조** |
| 6 | `home_climate` | **핵심** E |

---

## 2–3. 핵심 vs 보조

| 핵심 Family 축 | 역할 |
|----------------|------|
| A correction_style | 교정 장면 반응 + pair nagging 마찰 |
| B bond_distance | person 결속 선호 + pair 분리 **과제** |
| C guidance_balance | 수용·설명·기준 + pair fit |
| E home_climate | 집 안 구조적 긴장 band + 조합 해석 |

| 보조 축 | 역할 |
|---------|------|
| affection_expression | 마음 **표현 채널**(오행) — Friend 애정언어와 동계 |
| gathering_recovery | 모임 후 **회복 리듬**(신강신약) — Friend 배터리와 동계 |

보조 축은 사용자 가독성·표현/리듬 비교용이며, Part2 엔진 강화의 본체가 아니다.

---

## 4. 각 축 primitive · person/pair

| 축 | person | pair |
|----|--------|------|
| A | 십신 5범주 argmax | `nagging_band` (기존 PairFamilySignals) |
| B | `parent_bond_band` (seal threshold) | `umbilical_band` |
| affection | 오행 `countElements` argmax | same / different |
| C | seal/food/officer → guidance mode | `guidance_fit` (또는 동일 함수 폴백) |
| recovery | 일간 support/drain, margin=1 → weak/balanced/strong | 6종 combo |
| E | `family_conflict_index` → `intensityBand3` | band combo (수치 pair 필드 없음) |

`parentRole`은 전 축에서 **제목·장면 문맥만**. 원국 점수 가감 없음.

---

## 5. affection — 근거와 한계

- **근거:** 오행 카운트는 사주 원시량; “표현 방식 차이”만 말할 수 있음(크기·진심·효심 금지).
- **한계:** Family **전용** SSOT가 아님(Friend `affection_language`와 같은 매핑 철학). 의미 강도는 앱 가설(007).

---

## 6. recovery — 근거와 한계

- **근거:** 신강신약 support/drain은 재현 가능한 공식; “발산 vs 혼자 회복”으로 한정 서술.
- **한계:** Family 고유성 **더 낮음**(Friend battery 이식). “가족행사”는 프레이밍일 뿐. 우열 해석 금지.  
  → **추후 교체·축소 시 1순위 후보.**

---

## 7. D 제외 · B 통합 (011)

- `separation_readiness` 별도 행 **없음**.
- person = bond preference, pair = separation **task** (`umbilical_*`).
- Part5 = 경계 조율 **루틴** (준비도 판정 아님).
- `readiness` 표현 사용 금지.

---

## 8. F Part4 이동 (013)

- `recognition_fit` 비교표 행 **없음**.
- 11축 recognition = Part2 bucket 금지; Part4 psych / filial / attachment_need enrichment만.
- seal/food/officer를 recognition으로 재해석 금지.

---

## 9. 6행 유지 이유

- **제품:** A~E 핵심 + 표현/회복 보조로 한눈에 비교 UX 유지.
- **UI:** ViewModel·6행 표 레이아웃 변경 없음.
- **캐시:** deep 판정은 compare table 존재 여부가 핵심; row id를 지금 줄이면 불필요한 재생성·테스트 churn만 증가.
- 스키마가 “정확히 6”을 강제하지는 않으나, **현재 출하 형태를 유지**하는 것이 비용 대비 이득.

---

## 10. 추후 교체 우선순위

1. **`gathering_recovery`** (Family 고유성 최저)  
2. (그다음) affection — 단 recognition으로 리네임·교체 **금지**  
3. 핵심 A/B/C/E는 축 축소 대상이 아님

---

## 11. 새 축 금지 원칙

PersonCore / PairFamily에 **대체 SSOT가 생기고** 중복 감사가 끝나기 전에는  
빈칸을 메우기 위한 **새 Family 비교표 축을 만들지 않는다.**

---

## 12. Part2 완료 조건 · 현재 상태

| 조건 | 상태 |
|------|------|
| A/B/C/E 핵심 축 구현·테스트·커밋 | ✅ |
| D 별도 축 제외·문서화 | ✅ 011 |
| F 비교표 제외·Part4만·문서화 | ✅ 013 |
| 최종 6행·보조 축 분류 문서화 | ✅ **본 문서** |
| affection/recovery 계산식 재작성 | 불필요(유지) |
| Part3/4/5가 Part2 SSOT만 소비하도록 전면 재배선 | **Part2 범위 밖** (후속) |

**Part2(비교표 엔진 강화)는 본 문서 기준으로 완료로 본다.**  
Part3 이하는 별도 감사·구현 트랙이다.
