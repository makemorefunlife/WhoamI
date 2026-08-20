# 033 — 부부(Marriage) 리포트 섹션 재구성

**날짜:** 2026-08-20
**상태:** 확정 — 구현 완료(2026-08-21, CHAPTER_GROUPS 재구성 포함)

---

## 배경

관계 리포트(부부/연인/친구/동료/부모-자녀) 5개 타입의 "감정 낙차(공감→현실직면→데이터증명→실전→오해번역→처방)"를 강화하는 방향으로 보고서 블록 순서를 재구성하는 논의를 시작. 부부를 파일럿으로 먼저 확정.

논의 중 확인된 사실:
- 연인(romantic)과 결혼(marriage)은 이미 완전히 분리된 별도 파이프라인(`lib/relationship/romantic/`, `lib/relationship/marriage/`) — DEV 단계인 `domainLenses/partner`(친구/동료/가족과 함께 만들어지는 중인 7-Scene 실험 시스템)의 `marriage`/`dating` 임시 폴백과는 무관.
- 부부 리포트의 실제 라이브 렌더 경로는 `components/relationship/MarriageReportView.tsx` 안의 레거시 카드 JSX가 아니라, `buildMarriageReportViewModel.ts`가 만드는 Part1-5 뷰모델(`MarriageReportViewModelView`)임. 레거시 JSX는 `section_dna` 필드가 없는 예외 상황에서만 쓰이는 폴백.

---

## 선택지

### A. 완전 재설계
분석 엔진(사주/심리 계산)부터 새로 짜서 감정 아크에 맞춘 새 구조를 만든다.

### B. 기존 블록 재사용 + 순서 재배치
이미 계산되어 있는 섹션/데이터를 그대로 쓰고, 순서만 바꾸고 필요한 신규 섹션만 최소로 추가한다.

---

## 결정

**선택:** B

**이유:** 부부 리포트는 이미 5-Part 뷰모델 구조로 잘 조립되어 있고, 개별 섹션(DNA/침실/돈/시댁/양육/프라이버시/갈등/처방)의 계산 로직은 이미 검증된 상태. 순서 재배치와 소수의 신규 콘텐츠만으로 원하는 감정 낙차를 만들 수 있어, 엔진을 다시 짜는 것보다 훨씬 적은 리스크와 공수로 목표를 달성할 수 있음.

---

## 새 섹션 순서 (`buildMarriageReportViewModel.ts`의 `builders` 배열 순서)

```
헤드라인 + 트라이스코어 (household_snapshot)
  ↓
origin_story — "우리가 부부가 된 이유" (기존 위치 유지)
  ↓
일상 모습 (신규, daily_life_mirror) — 일간 매력(10) / 일지 배우자특징(12) / 일지 주도권(12) 표를
  각자의 일간·일지로 조회해 보여주는 결정론적 섹션
  ↓
deep_read — 기존 married_saju_deep LLM 오버레이 (자리 유지, 일상모습 바로 뒤로 재배치)
  ↓
DNA — psych_radar(11축) 먼저, compare_table(사주) → home_dna(개인 기질) 순
  ↓
테마 무기화 — 프라이버시 → 침실 → 돈/가사 → 양육 → 시댁·처가 (감정 무게순)
  ↓
오해의 번역기 — upset(서운함) → warning(갈등 트리거+소통패턴)
  ↓
처방 — prescription(디에스컬레이션 + 동거 처방)
  ↓
웨더포캐스트 — 장기 비전 (기존 위치 유지, 클로징 역할)
```

---

## 영향

- **바뀌는 것:**
  - `buildMarriageReportViewModel.ts`의 `builders` 배열 순서 — 위 순서대로 재배치
  - DNA 내부 순서: psych_radar(11축)를 compare_table(사주)보다 먼저
  - "일상 모습" 신규 섹션 추가 — 일간 매력/일지 배우자특징/일지 주도권 3개 표(34개 항목, KO+EN) + `buildMarriageDailyLifeMirrorSection()` (결정론적 조립, LLM 없음)
  - `HouseholdPartnershipReport`에 `section_daily_life_mirror` 필드 추가, `buildMarriageReport.ts`에서 `ctx.marriagePairAnalysis.chartA/B.dayStemCode`/`.dayBranchCode`로 계산해 채움
  - `MarriageReportSection` 유니온에 `DailyLifeMirrorSection` 타입 추가, `SectionRenderer.tsx`에 `DailyLifeMirrorCard` 렌더러 추가
  - `en-US.ts`/`ko-KR.ts`에 `dailyLifeMirrorCardTitle`/`CharmLabel`/`SpouseTraitLabel`/`AuthorityLabel` 4개 키 추가

- **안 바뀌는 것:**
  - `origin_story`, `weather_forecast`의 상대적 위치(첫머리/클로징 직전)는 원래도 적절했으므로 유지
  - "배우자 직업" 표는 관계적 톤과 결이 달라 이번 스코프에서 제외 (추후 DNA/개인특성 쪽에 별도로 붙이는 안은 열어둠)
  - 기존 계산 엔진(ten God 분석, psych 매칭, CFO 판정 등)은 전부 그대로 재사용 — 새 판정 로직 없음
  - 기존 `marriageSajuGapInsights.ts`의 항목1·2·3(decisionMakingLine/crisisRoleLine/drainPatternLine) 승격은 **이번 1차 구현에 포함하지 않음** — "일상 모습"은 일간/일지 표 3종만으로 구성. 항목1·2·3은 여전히 원래 자리(money_chores/upset/warning)에 있음.

- **1차 구현에서 확인된 추가 발견 (2026-08-21):**
  - `components/relationship/marriage/sections/SectionRenderer.tsx`에 `CHAPTER_GROUPS`라는 **고정 9-챕터 그룹핑 레이어**가 별도로 존재함. `builders` 배열 순서는 "같은 챕터 안에서의 순서"에만 영향을 주고, 챕터 자체의 순서는 이 배열과 무관하게 고정돼 있음.
  - 실제로는 두 개의 병렬 챕터 구조가 있었음: 실제 리포트가 쓰는 `vm.canonicalStoryPlan` 있음 경로는 `CANONICAL_CHAPTER_DEFINITIONS`(9개 챕터, 일부는 `cDef.id === "..."`로 하드코딩된 전용 카드와 결합)를 쓰고, `canonicalStoryPlan`이 없는 옛 캐시 리포트만 `CHAPTER_GROUPS`(느슨한 폴백)를 씀.

- **2차 구현 완료 (2026-08-21, 같은 날 이어서):**
  - `CANONICAL_CHAPTER_DEFINITIONS`: id·types·하드코딩 특수 블록 매칭은 그대로 두고 배열 순서 + `number` 표시값만 재배치. `c6_family_parenting_career`에서 `weather_forecast`만 분리해 새 `c10_weather_forecast`(맨 끝)로 뺌 — c6엔 전용 하드코딩 블록이 없어 안전한 분리. 새 순서: c1(우리는 어떤 부부인가) → c2(DNA: 11축→사주비교→개인기질) → c7(프라이버시) → c4(침실) → c3(돈) → c6(양육+시댁) → c5(갈등/오해번역) → c8(최종 판정) → c9(처방) → c10(웨더포캐스트, 신규 클로징).
  - `CHAPTER_GROUPS`(폴백): 하드코딩 결합이 없어 자유롭게 6개 챕터로 재구성 — 온도(origin_story+일상모습) → 라이프싱크(DNA) → 테마 무기화(privacy+bedroom+money+parenting+family_boundary, 5개 통합 챕터) → 오해의 번역기(upset+warning) → 처방 → 웨더포캐스트(클로징).
  - 부수적으로 `MarriageSectionType`이 어디서도 선언되지 않은 채 3곳에서 쓰이던 기존 타입 버그를 발견해 `type MarriageSectionType = MarriageReportSection["type"];`로 수정 (`npx tsc --noEmit` 에러 341→338줄, 내 변경분 관련 에러는 0건).
  - `c10_weather_forecast`는 `buildCanonicalMarriageStoryPlan.ts`가 모르는 새 id라서 💡 요약 인셋(챕터 상단 요약 카드)은 안 뜨지만, 웨더포캐스트 본문 카드 자체는 정상 렌더됨 — 완벽한 트레이드오프는 아니지만 허용 가능한 수준으로 판단.
  - **아직 안 한 것:** 실제 브라우저에서 시각 확인(사주 데이터 있는 실제 리포트 필요), "일상 모습" EN 번역 사용자 검수.

---

## 관련

- Daily: `docs/dev/daily/2026-08-20.md`, `docs/dev/daily/2026-08-21.md`
- 참고 아키텍처: `lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts`, `lib/relationship/marriage/marriageDailyLifeMirror.ts`(신규), `components/relationship/marriage/sections/SectionRenderer.tsx`
- Part04 선별 패턴 참고 사례: `lib/report/buildPersonalPart04StoryPlan.ts`
