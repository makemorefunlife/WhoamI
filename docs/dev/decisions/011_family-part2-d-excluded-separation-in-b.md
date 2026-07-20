# 011 — Family Part2: D축 제외 · separation task는 B에 통합

**날짜:** 2026-07-20  
**상태:** 결정 확정 (코드 계산식 변경 없음)  
**선행:** D축 감사(사용자 승인) · 커밋 `54847df`(C) 이후

---

## 결정

- **`separation_readiness`를 별도 비교표 축(D)으로 구현하지 않는다.**
- 유효한 separation 개념은 **B `bond_distance`의 pair layer**에 이미 있다.
  - **person** = bond preference (`parent_bond_band`)
  - **pair** = separation **task** (`umbilical_separation_index` / `umbilical_band`)
  - **Part5** = boundary / action **routine** (`umbilical_independence` 처방)
- **`readiness` / 준비도 / “독립할 준비”** 표현은 제품 카피·설계에서 사용하지 않는다.

---

## 1. D를 제외한 이유

1. 제안 D의 pair 입력이 B 의미 칸과 **동일하게 umbilical**이면, 행만 늘리고 같은 숫자를 반복한다.
2. person 단위 **separation readiness**를 안정적으로 계산할 Family SSOT primitive가 **없다**  
   (`FamilySajuSignals` = year_karma / seal_parent / home_punishment뿐).
3. Child DNA `autonomy_need`·Growth Tunnel(년충)은 **서술/시기 서사**이지 readiness bucket이 아니다.
4. 11축에 autonomy readiness 축이 없고, 설문으로 사주 공백을 메우면 안 된다.

---

## 2. 세 개념의 차이

| 개념 | 의미 | person/pair |
|------|------|-------------|
| **bond preference** | 가까움 vs 거리 중 어디가 편안한가 | person (`parent_bond_band`) |
| **separation task** | 이 둘 사이에서 분리·경계 조율 **과제가 얼마나 큰가** | pair (`umbilical_*`) |
| **separation readiness** | 각자가 독립 전환을 **감당할 준비가 되었는가** | (주장만) — **현재 미계산** |

---

## 3. 현재 계산 가능한 것

- 계산 가능: **bond preference**, **separation task**
- 계산 불가(근거 부족): **separation readiness**

readiness를 말하려면 새 원국/생애 단계 SSOT가 필요하며, 그때도 아래 6항을 따른다.

---

## 4. umbilical = pair task (readiness 아님)

`umbilical_separation_index`는 양측 `parent_bond_band`·seal 차이·seal_isolated 조합으로 만든  
**관계 과제 강도**이다.  
개인의 “준비됨/안 됨” 판정이 아니다.

---

## 5. Part5 처방 = 경계 조율 루틴 (준비도 판정 아님)

`buildUmbilicalPrescription`은 umbilical band/index가 일정 이상일 때  
경계·연락 간격·침범 금지 등 **행동 루틴**을 준다.  
“독립할 준비가 되었다/안 되었다”를 판정하지 않는다.

---

## 6. 향후 복구 금지

나중에 autonomy 관련 person signal이 생겨도:

- 기존 **umbilical(pair task)** 과 중복 검토 **없이** D 행을 복구하지 말 것.
- 새 신호가  genuinely **readiness(또는 다른 person 독립 성향)** 이고 umbilical과 입력이 다르다는 감사가 끝나기 전에는 비교표 D를 열지 말 것.
- 기본 원칙: separation **task**는 B(+Part5), readiness급 주장은 근거 없으면 **침묵**.

---

## Part2 축 구성 (이 결정 후)

| 축 | 상태 |
|----|------|
| A correction_style | 완료 (v1 ten-god style) |
| B bond_distance | 완료 (person bond + pair separation task) |
| C guidance_balance | 완료 |
| **D** | **제외 (본 문서)** |
| E home_climate | 미착수(감사 대기) |
| F recognition_fit | 미착수 |

표의 affection / gathering_* 행은 구형 슬롯이며, E/F 감사 후 교체 여부를 별도 결정한다.
