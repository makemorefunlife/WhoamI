# 015 — Family Part3 static / time-layer separation

**날짜:** 2026-07-20  
**상태:** 결정 확정 (구현 반영)  
**선행:** Part2 최종 축 014 · Part3 감사(Child DNA / Growth Tunnel)

---

## 1. 기존 Part3 구조

Family Premium Part3는 두 블록이다.

| 블록 | report field | ViewModel | UI |
|------|--------------|-----------|-----|
| Child DNA | `section_child_dna` | `child_dna` | `ChildDnaCard` |
| Growth Tunnel | `section_growth_tunnel` | `growth_tunnel` | `GrowthTunnelCard` |

생성 경로:

```text
buildFamilyRuleContext
→ buildFamilyKillerSections
→ family report fields
→ buildFamilyReportViewModel
→ SectionRenderer
```

전면 재구성·Part4 이동·필드 삭제는 하지 않는다.

---

## 2. Child DNA = innate / static

**결정:** Child DNA는 아이 **단독**의 타고난 관계·학습 패턴이다.

- `childSignals` / chart 기반
- 11축·premium 설문 미사용
- mother/father role에 따라 **계산이 달라지지 않음**
- 올해·운세·시간 신호 금지

레이어 카피(UI locale):

- ko: `타고난 기질` / 관계와 학습에서 반복되는 기본 패턴
- en: `Innate pattern` / How this child naturally learns, relates, and focuses

---

## 3. Growth Tunnel = current-year time signal

**결정:** Growth Tunnel은 **분석 연도**의 일시적 성장 과제다.

- 달력 연도 지지 vs 자녀 일지·월지 충 여부
- structural personality로 읽히면 안 됨
- 본문에 분석 연도(`YYYY년` / `In YYYY`)와 “올해/시기적” 프레이밍 명시
- `analysisYear?: number` — 생략 시 `new Date().getFullYear()` (기존 동작)

레이어 카피(UI locale):

- ko: `올해의 성장 터널` / 현재 연도에만 적용되는 시기적 해석
- en: `This year's growth tunnel` / A time-specific challenge or transition for the current year

---

## 4. Part2 vs Part3 역할

| | Part2 | Part3 |
|--|-------|-------|
| 질문 | 부모↔자녀 비교 축 | 아이 단독 innate + 올해 tunnel |
| 축 | A/B/C/E + affection/recovery | 축 아님 (카드 2개) |
| 비교표 | 있음 | 없음 |

Part2 축 set·scoring·row order는 이번 범위에서 **미변경**.

---

## 5. `home_climate` ≠ Growth Tunnel

| | `home_climate` (Part2 E) | Growth Tunnel (Part3) |
|--|--------------------------|------------------------|
| 대상 | 집 안 구조적 긴장 band + 부모·자녀 조합 | 자녀 개인 × **올해** 지지 |
| 레이어 | 관계 구조 | 시간(연도) |
| 지속성 | 구조적 성향 신호 | 연도가 바뀌면 바뀜 |

합치지 않는다. 카피에서도 동일 개념으로 쓰지 않는다.

---

## 6. Dominant element SSOT

**문제:** Part2 `affection_expression`과 Part3 genius(`dominantArchetype`)가 각각 `countElements` → max를 돌릴 수 있음.

**처리:** `lib/saju/pairChartAnalysis.ts`의 `resolveDominantElement(chart)`를 공유한다.

- raw count + dominant 결정만 SSOT
- tie-break 신규 규칙 없음 (wood→water 고정 순서 후 count 내림차순 — 기존 affection과 동일)
- affection narrative와 genius narrative는 **분리 유지**
- Part2 affection **해석 의미**는 바꾸지 않음

---

## 7. attachment / autonomy 제외

`attachment_need` / `autonomy_need`는 계산되어 있어도 Part3 UI에 **노출하지 않는다**.

Part2 `bond_distance`와 개념 충돌 위험이 있어 별도 결정 전까지 보류.

---

## 8. mother / father 계산 불변

Part3 Child DNA · Growth Tunnel **primitive/본문 계산**은 parentRole에 무관하게 동일해야 한다.

역할명이 문장에 필요할 수 있는 다른 Part(예: Part4 destiny / de-escalation)는 이번 범위에서 건드리지 않는다.

---

## 9. cache / report field 유지

유지:

- `section_child_dna` / `section_growth_tunnel` 필드명·shape
- ViewModel `child_dna` / `growth_tunnel` type
- 기존 premium cache contract (새 persisted field 없음)

레이어 라벨은 **locale + UI**에서만 표시 (DB/schema migration 없음).

선택적 입력: `analysisYear` (context / report builder) — 저장 스키마 필드가 아님.

---

## 10. 향후 변경 경계

하지 않음 (별도 결정 필요):

- Part2 축 추가·삭제·threshold 통합
- attachment/autonomy UI
- Growth Tunnel을 `home_climate`와 병합
- Part3 → Part4 이동
- 새 scoring axis / psych / 11축 의존
- genius·affection narrative 강제 통합

허용되는 후속:

- Growth Tunnel 카피 미세 조정 (시간 레이어 유지 전제)
- analysisYear를 호출부에서 명시 전달 (테스트·배치)

---

## 구현 메모

- Killer: `familyKillerSections.ts` (`analysisYear`)
- Context: `buildFamilyRuleContext` / `buildFamilyParentReport` optional `analysisYear`
- SSOT: `resolveDominantElement` ← `familyAnalysis.buildChildInnerSignals`, `resolveAffectionExpressionBucket`
- Locale: `ko-KR` / `en-US` family Part3 titles + layer labels
- UI: `SectionRenderer` ChildDnaCard / GrowthTunnelCard layer hint
- Test: `tests/unit/family-part3.test.mjs`
