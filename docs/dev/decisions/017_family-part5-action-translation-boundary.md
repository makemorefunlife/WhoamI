# 017 — Family Part5 action-translation boundary

**날짜:** 2026-07-20  
**상태:** 결정 확정 (구현 반영)  
**선행:** Part5 audit · Part2 A/B 009 · Part4 016

---

## 1. Part5의 고유 가치

Part5는 분석 반복이 아니라 **행동 번역**이다.

| 블록 | 가치 |
|------|------|
| De-escalation | 갈등 직후 즉시 쓸 말·피할 행동 (스크립트) |
| Prescription | 관계에서 반복되는 패턴을 줄이는 do/dont 루틴 |

---

## 2. De-escalation = immediate conflict response

- report: `family.section_de_escalation`
- child person only
- Part3 Child DNA **아님**, 영구 성격 단정 **아님**
- UI layer: `deEscalationLayerLabel` / Hint

---

## 3. Prescription = relationship routine

- report: `meta.prescription_family`
- pair signal-aware 또는 baseline-only
- future prediction / Part4 destiny·filial 반복 **아님**
- UI layer: `prescriptionLayerLabel` / Hint

---

## 4. Part2 A child bucket = Part5 de-escalation SSOT

```text
child TenGodCounts
→ resolveCorrectionStyleBucket
→ bucket (food|self|seal|officer|wealth)
→ Part2 correction_style child row
→ same bucket → Part5 prescription card
```

- `pickDeEscalationByCorrectionStyle` / `buildChildDeEscalationCard`
- 별도 `categoryScores` · `dominantArchetype` bias **제거**
- 카드에 `category` 필드 저장 (캐시 shape 확장: 기존 필드 + 선택적 호환; 구버전 카드에 category 없어도 UI는 기존 필드만 사용)

**결과 변경:** 이전 archetype bias로 고르던 카드가 Part2 A와 달랐던 fixture는 A bucket으로 정렬됨. 의도된 SSOT 교정.

---

## 5. Part3 dominant element

de-escalation **category 선택에 미개입**. DNA genius와 갈등 대응은 레이어 분리.

---

## 6–7. pairFamily fallback

| 입력 | 동작 |
|------|------|
| `pairFamily` 있음 | 기존 umbilical / nagging gate + baseline 보강 |
| `pairFamily` 없음 / null | **baseline-only** (`family_baseline`) — 새 signal 추측 금지 |
| legacy `prescription_family` 없음 | ViewModel이 prescription 섹션 생략, crash 없음 |

`buildFamilyParentReport`는 항상 `prescription_family`를 넣는다 (최소 baseline).

---

## 8. mother / father

- category · prescription topics **동일**
- solution_script 호칭(Mom/Dad·엄마/아빠)만 차이
- stereotype 분기 **없음**

---

## 9–10. psych / current-year

Part5 builder는 11축·`analysisYear` **미사용**.

---

## 11. Part3 / Part4 경계

| | Part5 |
|--|-------|
| Child DNA / Growth Tunnel | 미변경 · 미소비 |
| Destiny / Filial / recognition enrichment | 미변경 · 미소비 |

---

## 12. 사용자 카피 정화

내부 primitive 이름(`umbilical_*`, `combined_karma_tension`, topic id)은 유지.

사용자 노출에서 제거·치환:

- 카르마 / Karma → 반복 마찰·반복되는 가족 긴장
- 탯줄 / Umbilical → 가까움·경계 / Closeness & Independence
- pair.family 전문 은어 완화

「사주」 사용자 카피 미노출.

---

## 13. 미구현 유지

- `guidance_fit` 소비
- Part2 C / E / affection / recovery 신규 처방 topic
- recognition Part5 배선
- attachment/autonomy UI
- role별 처방 분기

---

## 14. report / cache schema

- 기존 field 유지: `section_de_escalation`, `prescription_family`
- `section_de_escalation.category` 추가 (렌더 비필수, 테스트·SSOT 추적용)
- DB/API migration 없음
- topic id (`umbilical_independence`, `nagging_karma_avoidance`) 내부 키 유지

---

## 구현 파일

- `childDeEscalationPrescriptions.ts`
- `familyKillerSections.ts` (dominantArchetype 인자 제거)
- `buildFamilyPrescriptions.ts` / `buildFamilyParentReport.ts`
- `pairPrescriptionUiTypes.ts` (family labels/footnote)
- locale + `SectionRenderer` + `PairPrescriptionSection` titleOverride
- `tests/unit/family-part5.test.mjs`
