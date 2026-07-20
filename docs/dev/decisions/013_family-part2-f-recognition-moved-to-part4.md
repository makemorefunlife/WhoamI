# 013 — Family Part2: F `recognition_fit` 제외 · Part4 enrichment만 허용

**날짜:** 2026-07-20  
**상태:** 결정 확정 (코드·비교표 미수정)  
**선행:** F축 감사(사용자 승인) · E 커밋 `95fdf1e` 이후

---

## 결정

- **`recognition_fit`을 Part2 비교표 축으로 구현하지 않는다.**
- 사주 SSOT만으로 recognition **need** / **expression**을 안정 계산할 수 없다.
- **11축 `recognition`을 Part2 bucket 본체로 쓰지 않는다.**
- **seal / food / officer**를 recognition용으로 재해석하지 않는다 (C `guidance_balance` 보호).
- **`affection_expression` · `gathering_recovery`는 이번 결정으로 교체하지 않는다.**
- recognition 관련 정보는 **Part4** psych enrichment / `filial_reward` / Child DNA `attachment_need` **서사 레이어에만** 둔다.
- 향후 recognition **전용** person/pair primitive가 생기고 umbilical·C·affection과 중복 감사가 끝나기 전에는 **Part2 축으로 복구하지 않는다.**

---

## 1. F의 원래 질문

「나는 어떤 방식의 인정과 확인을 **받을 때** 관계가 안정되는가?」  
→ 핵심은 **recognition need / receiving preference** (수신).

---

## 2. 개념 차이 (혼동 금지)

| 개념 | 의미 | Part2/제품에서의 위치 |
|------|------|------------------------|
| **recognition need** | 인정·확인을 얼마나·어떤 형태로 필요로 하는가 | F 이상향 — **사주 SSOT 없음** |
| **recognition expression** | 상대를 어떻게 인정·칭찬하는가 | need와 **다른** 신호 — 미구현 |
| **feedback preference** | 어떤 피드백에 반응하는가 | A `correction_style`과 인접 |
| **affection expression** | 애정·마음을 **표현하는 채널** | 비교표 `affection_expression`(오행) |
| **filial_reward** | 부모-자녀 **미래 보답·리워드** 서사 | Part4 `section_filial_reward` |
| **guidance** | 돌봄·지도 시 수용/설명/기준 | C `guidance_balance` |

F를 affection·guidance·filial의 이름만 바꾼 축으로 만들지 않는다.

---

## 3. 사주 전용 SSOT가 없는 이유

- `FamilySajuSignals` / `PairFamilySignals`에 recognition 전용 필드가 **없다**.
- Child DNA `attachment_need`는 self/seal 임계 **서술 카피**일 뿐, 비교표용 band/SSOT가 아니다.
- seal/food/officer·wealth를 “인정 니즈/성과 인정”으로 단정할 **기존 엔진 규칙이 없다**.

---

## 4. 11축 recognition을 Part2 bucket에 쓰지 않는 이유

- `recognition`은 v2 설문 **secondary axis**이다 (사주 bake-in이 아님).
- Part2 비교표는 사주/pair SSOT로 **결정론적 bucket**을 유지하는 것이 A~E 원칙이다.
- 설문으로 사주 bucket을 조용히 덮어쓰면 A/B/C/E와 정책이 충돌한다.

---

## 5. 무설문 premium 경로 문제

- Family premium은 `psychMaster`가 **optional**이다.
- F bucket이 11축 본체이면 설문 없는 사용자는 빈 칸·가짜 폴백·사주 위장 중 하나를 강요받는다.
- 따라서 Part2 F는 **무설문에서도 성립하는 사주 SSOT**가 생기기 전에는 불가하다.

---

## 6. seal / food / officer 재사용 금지

- 동일 primitive는 이미 **C `guidance_balance`**(수용·설명·기준)의 person 점수이다.
- 같은 카운트를 “인정 니즈”로 다시 자르면 **C와 F가 이름만 다른 중복 축**이 된다.
- mother/father role로 wealth·seal을 가감하는 경로도 F에 넣지 않는다 (Part2 role 원칙).

---

## 7. affection_expression ≠ F

- `affection_expression` = 오행 argmax → **마음을 표현하는 방식**.
- F = **인정을 받는 방식·니즈**.
- 둘을 같은 행으로 합치거나, affection을 recognition으로 리네임하지 않는다.  
  (이번 결정으로 affection 행을 **교체하지 않음** — 유지/교체는 별도 Part2 잔여 축 감사.)

---

## 8. filial_reward와 F

| | filial_reward | F (이상) |
|--|---------------|----------|
| 장면 | 미래 보답·패밀리 리워드, 칭찬·인정 **서사**와 인접 | 현재 관계의 인정 **핏** |
| 계산 | pair combine / johu support / support_strength 등 | (없음) |
| 중복 | **카피 장면**에서 “인정·칭찬” 말이 겹칠 수 있음 | 계산 SSOT는 공유하지 않음 |

장면 중복은 Part4에서 카피 스코프로 관리하고, Part2에 F 행을 열어 해소하지 않는다.

---

## 9. Part4 enrichment만 허용

허용:
- 11축 `recognition`이 있을 때 psych lens / highlights로 **설명 보강**
- 기존 `filial_reward` · `attachment_need` 서사와의 **문맥 정렬** (공식·threshold 변경은 별도 승인)

금지:
- Part2 `section_compare_table`에 `recognition_fit` row 추가
- PairFamilySignals에 recognition 점수 신설(근거 없는 합산)
- C primitive를 F로 재라벨

---

## 10. Part2 복구 금지

recognition **전용** person/pair primitive가 PersonCore에 생기고,  
C·affection·filial·A와의 중복 감사가 문서화되기 전에는  
Part2 비교표 축으로 F를 **복구하지 않는다.**

---

## Part2 축 상태 (이 결정 시점)

| 축 | 상태 |
|----|------|
| A correction_style | 완료 |
| B bond_distance (+ separation task) | 완료 |
| C guidance_balance | 완료 |
| D separation_readiness | 제외 → B + Part5 (011) |
| E home_climate | 완료 |
| F recognition_fit | **제외 → Part4 enrichment (본 문서)** |
| affection_expression / gathering_recovery | 구형 잔여 — 별도 감사 |
