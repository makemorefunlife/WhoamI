# 016 — Family Part4 pair / future / recognition boundary

**날짜:** 2026-07-20  
**상태:** 결정 확정 (구현 반영)  
**선행:** Part3 static-time 015 · F→Part4 enrichment 013 · Part4 audit

---

## 1. Part4의 고유 역할

Part4는 비교표 축(Part2)도, 아이 innate/올해 tunnel(Part3)도 아니다.

| 블록 | 역할 |
|------|------|
| Destiny | 부모↔자녀 **pair** 관계 패턴 서사 |
| Parent lens | 부모 **역할**로 읽는 보조 해석 |
| Filial reward | 지금 관계에서 이어질 수 있는 **미래 가능성** 서사 |
| Recognition | 11축이 있을 때만 filial에 **optional 서사 enrichment** |

UI 카드는 기존 2개 유지 (`DestinyCard`, `FilialRewardCard`). 전면 재구성·신규 카드 없음.

---

## 2. Destiny = pair narrative

- `section_destiny.harmony_one_liner` / `favoritism_warning`
- 입력: `scoringSignals` Combine/Clash/DayMonthTension + `masterScores.bond ≥ 70`
- **올해 연도 framing 없음** (Part3 Growth Tunnel과 분리)
- 미래 확정 예언 아님

레이어 카피: `destinyLayerLabel` / `destinyLayerHint` (locale)

---

## 3. Parent lens = role interpretation

- `parent_lens_summary` ← `tenGod.parentProfile.lens_summary`
- Destiny 카드 **하단**에 별도 label/hint로 표시 (같은 카드, 다른 레이어)
- pair 점수 분기와 분리된 **역할 읽기 보조**
- `care_style` / `authority_style`은 계속 **미노출**

---

## 4. Filial = future-oriented possibility

- `section_filial_reward.future_reward` (+ `reward_index` 저장만, **UI 미노출**)
- 확정 예언·효심 단정·Part3 Child DNA와 혼동되는 “DNA” 표현 제거
- 레이어 카피: `filialLayerLabel` / `filialLayerHint`

---

## 5. time / current-year layer 없음

Part4에는 `analysisYear`·연지 충 해석을 **넣지 않는다**.  
시간 레이어는 Part3 Growth Tunnel 전용 (015).

---

## 6–7. Recognition = optional narrative enrichment only

- **SSOT:** 기존 11축 `psych_match.axis_results`의 `recognition` row (`match_type`)
- **삽입 위치:** FilialRewardCard 본문 말미 1문장만 (Destiny favoritism과 이중 주입 금지)
- **금지:** 새 signal / bucket / threshold, Part2 비교표 row, master score 반영, destiny·filial **핵심 분기** 변경
- psych 없음 · survey incomplete · guest · legacy → **enrichment 없음**, 기존 filial 본문 유지
- mother/father에 따라 enrichment 문장이 달라지지 않음 (psych만)

헬퍼: `familyRecognitionEnrichment.ts`  
배선: `buildFamilyParentReport` (psychBundle 생성 후 `future_reward`에 append)

---

## 8. mother / father가 실제 계산에 들어가는 지점

| 경로 | 계산? | 카피? |
|------|-------|-------|
| `parentSupportsChildSeal` / `Wealth` | chart 기반 (role 무관 불리언) | |
| mother: seal 경로 → master bond/synergy **±5** | **예** | |
| father: wealth 경로 → master **±5** | **예** | |
| `support_strength` (seal vs wealth 공식) | **예** → filial high | |
| `hasParentBoostsChildTalent` role 폴백 | **예** (synergy) | |
| destiny `bond ≥ 70` | master 간접 | |
| `lens_summary` Mom/Dad | | **카피** |
| recognition enrichment | | psych만 (role 무관) |

이번 작업에서 role 공식을 제거·통합하지 않았다.

---

## 9. child stem 버그 — 원인과 수정

**원인:** `parentSupportsSeal` / `parentSupportsWealth`가 `childEl = getStemEl(parent.dayStemCode)`로 자녀 일간 대신 부모 일간을 사용.

**수정:** `childEl = getStemEl(child.dayStemCode)`. 함수에 `child: ChartContext` 인자 추가. 호출부 `analyzeFamilyPairSaju`에서 `chartChild` 전달.

새 signal/threshold 없음 — 잘못된 입력 참조만 교정.

영향 경로: `parentSupportsChild*` → master ±5, talent 폴백, `support_strength` → filial high.

테스트: `tests/unit/family-part4-support.test.mjs`

---

## 10. Orphan fields — 이번 미노출

유지 (계산 가능, UI 비연결):

- `reward_index`
- `attachment_need` / `autonomy_need`
- `care_style` / `authority_style`

Part2 `bond_distance`와의 충돌 위험 때문에 attachment UI는 별도 결정 전 보류 (013·015와 동일 기조).

---

## 11. Part2 / Part3 / Part5 경계

| 영역 | Part4 |
|------|-------|
| Part2 6축·compare table | **미변경** |
| Part3 Child DNA / Growth Tunnel | **미변경** |
| Part5 de-escalation / prescription | **미변경** |
| home_climate vs destiny | 합산 없음 (012 유지) |
| recognition Part2 row | 금지 (013 유지) |

---

## 구현 파일 (요약)

- `lib/saju/familyAnalysis.ts` — child stem fix
- `lib/relationship/familyParent/familyRecognitionEnrichment.ts` — enrichment
- `buildFamilyParentReport.ts` — append
- `familyKillerSections.ts` — filial DNA 혼동 카피 제거
- locale + `SectionRenderer` — layer labels
- `tests/unit/family-part4*.test.mjs`
