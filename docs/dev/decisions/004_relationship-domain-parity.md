# 004 — 관계유형 5종(동료/친구/가족/연인/부부(동거)) SSOT·신호 정합성 맞추기

**날짜:** 2026-07-19
**상태:** 확정 — 진행 중

**5개 관계유형** (`lib/relationship/relationshipKind.ts`): 동료(work) / 친구(friendship) / 가족(family) / **연인(romantic)** / **부부·동거(cohabitation)** — 연인과 부부(동거)는 서로 다른 별도 섹션.

---

## 배경

오늘 동료(work) 리포트를 감사하다가 3가지 문제를 발견·수정함:

1. PersonCore가 인당 1회 계산해 저장하는 도메인 신호(`WorkSajuSignals` — 문창귀인/장성살/천을귀인 등)가 계산만 되고 리포트 빌더 어디서도 안 읽힘(orphaned).
2. 리포트 빌더(`buildWorkColleagueReport` 등)가 여전히 레거시 파생 뷰(`SajuDataForIntegrated`)만 받고, PersonCore SSOT(`SajuMasterJson`)는 안 쓰고 있었음. (API 라우트 단은 이미 `sajuMasterA/B`를 넘기고 있었음 — 빌더 안쪽만 안 이어짐)
3. 11축(심리 설문) 중 `thinking_style`(사고방식: 분석적 vs 직관적) 축이 **4개 관계유형 전부에서 한 번도 안 뽑힘** — 유일하게 보편적으로 빠진 축.

동료는 (1)(2)(3) 다 고쳤고, `thinking_style`을 7번째 축으로 추가 확정(사용자 결정). 사주 기반 "한눈에 비교" 표(6행, 팀 회의 항목)도 추가함.

친구/가족/결혼(동거) 감사 결과 **동일한 (1)(2) 패턴이 그대로 존재**. (3)은 도메인마다 원래 "메인이 되는 축만" 고르기로 한 제품 방향이 있어서, thinking_style만 보편 공백으로 보고 추가하고 나머지는 굳이 안 채운다.

---

## 결정

**범위:** 친구 → 가족 → 결혼 순서로, 도메인 하나씩 통째로(1)(2)(3) 다 끝내고 다음 도메인으로.

**축 재분류(3) 범위 제한:** 각 도메인에 `thinking_style`만 추가한다. 나머지 빠진 축(예: 친구의 self_control/structure/decision_style/resilience, 가족의 stimulation/practicality/energy_style, 결혼의 stimulation/recognition/resilience/decision_style)은 이번 스프린트에서 안 건드림 — "메인만 먼저"라는 기존 방향 유지, 전부 채우려 들지 않음.

**이유:** thinking_style은 감사에서 "보편적으로 빠짐"이라 명시적으로 지적된 유일한 축. 나머지는 도메인별 판단이 필요해서 시간 압박 있는 오늘 범위에서 제외.

---

## 도메인별 체크리스트

### 0) 동료 (`lib/relationship/workColleague/`) — ✅ 완료

- [x] (1) `WorkSajuSignals` 관통 (`officeLanguage.ts` 등 helper들이 `workSignals?` 옵션 인자로 받음)
- [x] (2) `buildWorkColleagueReport`가 `sajuMasterA/B.domain_signals.work_signals` 사용
- [x] (3) `thinking_style` 축 추가 (`WORK_AXIS_COPY`/`WORK_DOMAIN_AXES`, ko/en)
- [x] 보너스: 사주 기반 "한눈에 비교" 표(6행, `sajuCompareTable.ts`) 신규 추가, UI(레거시 JSX + 신규 Part 렌더러) 양쪽 다 반영

### 1) 친구 (`lib/relationship/friend/`) — ✅ 완료

- [x] (1) `FriendshipSajuSignals.bijie_isolation.isolation_band`(bonded/balanced/lone_wolf)를 `buildFriendKillerSections`의 `buildPersonDna`에 반영 — `friend_position`에 보너스 문장 추가(`ISOLATION_BONUS`, balanced는 문장 없음)
- [x] (2) `buildFriendRuleContext`가 `friendSignalsA/B?: FriendshipSajuSignals` 받아 `isolationBandA/B`로 관통. `runFriendSocialDeepAnalysis`에서 `sajuMasterA/B?.domain_signals.friendship_signals` 계산해 전달
- [x] (3) `thinking_style` 축 추가 (`FRIEND_AXIS_COPY`/`FRIEND_DOMAIN_AXES`, ko/en)

### 2) 가족 (`lib/relationship/familyParent/`) — ✅ 완료

**감사 중 발견한 정정 사항 (2단계):**
1차: 애초 가정("`resolveParentType`에 `seal_parent.parent_bond_band` 반영")이 틀림 — `resolveParentType()`은 순수 역할판정(엄마/아빠 중 누가 부모인지) 로직.
2차(더 큰 정정): 진짜 자리라고 봤던 `familyParentLanguage.ts`의 `buildMotherParentLens()`/`buildFatherParentLens()`/`buildChildInnerWorld()`는 **완전히 죽은 코드(dead code)** — `index.ts`에서 export만 되고 있을 뿐, 리포트 조립 경로(`familyReportTemplate.ts` → `buildFamilyParentChildReport`) 어디에서도 호출되지 않음. `emotional_climate`/`care_pattern` 등 5개 필드는 전부 `TODO:` 텍스트, 로케일 분기도 없음 — 콘텐츠를 채워도 화면에 안 나옴.

**실제 렌더링 경로는 `familyParentTenGodAnalysis.ts`의 `buildMotherProfile()`/`buildFatherProfile()`** — 여기서 만든 `parentProfile.lens_summary`가 `buildFamilyParentChildReport`의 `parent_lens_summary`로 나가고, `FamilyParentReportView.tsx:176`에서 실제로 렌더링됨. 사용자가 "지금 실제 콘텐츠로 작성"을 선택했으므로, 콘텐츠는 **이 실제 경로에** 작성함(죽은 스켈레톤 파일이 아니라).

- [x] (1) `FamilySajuSignals.seal_parent.parent_bond_band`(distant/balanced/smothering)를 `analyzeFamilyParentTenGod` → `buildMotherProfile`/`buildFatherProfile`에 관통, `lens_summary`에 보너스 문장 추가(`PARENT_BOND_BONUS`, balanced는 문장 없음 — work/friend와 동일 원칙)
- [x] (2) `buildFamilyRuleContext`에 `familySignalsA/B?: FamilySajuSignals` 추가, `runFamilyParentChildDeepAnalysis`에서 `sajuMasterA/B?.domain_signals.family_signals` 계산해 관통
- [x] (3) `FAMILY_AXIS_COPY`/`FAMILY_DOMAIN_AXES`(ko+en)에 `thinking_style` 추가
- **후속 정리 항목(이번 스프린트 범위 아님):** `familyParentLanguage.ts`의 dead code(`buildMotherParentLens`/`buildFatherParentLens`/`buildChildInnerWorld`) — 삭제하거나, 별도로 실제 섹션으로 승격할지 나중에 결정 필요.

### 3) 부부/동거 (`lib/relationship/marriage/`) — ✅ 완료

- [x] (1) `CohabitationSajuSignals.wealth_officer_power`를 `buildMarriageReport` → `buildMarriageRuleContext` → `analyzeMarriageTenGod` → `pickHouseholdCfo()`에 관통 — **중복 제거 케이스(사용자 우선순위 지정).** `pickHouseholdCfo()`가 PersonCore `cfo_affinity_score`/`economic_dominance_band`를 있으면 우선 사용하고, 없으면(레거시 캐시 호환) 기존 십신 카운트 계산으로 폴백하도록 수정.
- [x] (2) `runCohabitationDeepAnalysis`에서 `sajuMasterA/B?.domain_signals.cohabitation_signals` 계산해 `buildMarriageReport` 시그니처에 관통.
- [x] (3) `COHABITATION_DOMAIN_AXES`/`COHABITATION_AXIS_COPY`(`cohabitationCopyTables.ts`, ko+en)에 `thinking_style` 추가.

### 4) 연인 (`lib/relationship/romanticRules/` 등) — 감사 완료, **구조가 다름**

**핵심 차이: 연인은 LLM 생성 기반 리포트임** (`gpt-4o-mini`, `runRomanticSajuDeepAnalysis`), 나머지 4개 도메인은 전부 결정론적(규칙엔진)/LLM 미사용. 그래서 "고치는 방법" 자체가 다른 4개 도메인과 다름:

- **PersonCore 도메인 신호 팩 자체가 없음.** `DomainSajuSignalsPack`은 `work_signals`/`friendship_signals`/`family_signals`/`cohabitation_signals` 4종뿐, `romantic_signals`는 애초에 정의된 적이 없음.
- **`sajuMasterA/B`는 이미 관통되어 있고, orphaned가 아님.** `buildRomanticPersonSignalsDigest`(`lib/relationship/romanticSajuPromptDigest.ts`)가 `sajuMasterA/B.domain_signals`(4개 도메인 신호 전부), `johu_climate`, `special_signals`, `relation_dynamics`, `pillars`, `stem_focus`를 텍스트로 요약해 LLM 프롬프트에 실제로 박아넣음(`personBlockA`/`personBlockB`). 다른 도메인들과 달리 이미 "안 orphaned" 상태 — 다만 규칙엔진(`buildRomanticRulesBundle`, headline/snapshot/attraction/compare/story/action 화면 전부 담당)은 여전히 레거시 `SajuDataForIntegrated`만 쓰고 `sajuMasterA/B`를 안 씀.
- **11축은 이미 전부 사용 중.** `thinking_style` 포함 전체 축이 `buildPsychMatchResult`(`lib/relationship/psychMatch/index.ts`) → `report.meta.psych_match` → `buildRomanticPsychDerivations`(`romanticReportViewModel.ts`)로 이어지는, work/friend/family/cohabitation과는 다른 "chemistry/strength-weakness" 패턴으로 이미 반영됨. 축 공백 없음.

**결론: 연인 도메인은 (3)은 이미 해결된 상태, (1)(2)도 "orphaned 신호"는 없음(애초에 신호 팩이 없어서).** 남는 선택지는:
1. 이대로 유지 — LLM이 이미 4개 도메인 신호 전부를 프롬프트로 받고 있으니 충분하다고 볼 여지 있음
2. 규칙엔진(`buildRomanticRulesBundle`) 쪽에도 `sajuMasterA/B`를 관통시켜, 결정론적 섹션(headline/snapshot 등)에 PersonCore 신호를 반영 — 다만 이건 4개 도메인과 달리 "새 로맨틱 전용 신호 타입 설계"까지 필요할 수 있어 스코프가 더 큼

- [ ] 사용자 결정 필요: 위 1안(유지) vs 2안(신규 설계 착수) — 오늘 밤 범위에 넣을지 여부

---

## 영향

- 바뀌는 것: 친구/가족/부부 리포트의 캐릭터 타입·DNA 문구가 PersonCore SSOT 신호를 반영해 더 정확해짐(가족은 사용자 결정 대기). 부부의 CFO 로직은 계산 중복 제거 예정. 동료/친구는 thinking_style 축 완료, 가족/부부는 예정.
- 안 바뀌는 것: DB 스키마, 캐시 정책. 동료/친구/가족/부부 4개는 결정론적(LLM 미사용) — 안 건드림. 연인은 원래부터 LLM 기반이라 이 구조 자체는 안 바뀜. 11축 중 thinking_style 외 나머지 공백(동료/친구/가족/부부)은 이번 스프린트 범위 아님(연인은 이미 전체 축 사용 중이라 해당 없음).

## 진행 로그

- 2026-07-19: work 도메인 (1)(2)(3) + 사주 비교표(6행, `sajuCompareTable.ts`) 완료.
- 2026-07-19: friend 도메인 (1)(2)(3) 완료.
- 2026-07-19: family 감사 중 애초 가정 정정 2단계(`resolveParentType`도 아니고, `familyParentLanguage.ts`도 dead code) — 사용자가 "지금 실제 콘텐츠로" 결정, 실제 렌더링 경로(`familyParentTenGodAnalysis.ts`)에 (1)(2)(3) 완료.
- 2026-07-19: marriage(cohabitation) (1)(2)(3) 완료 — CFO 로직 PersonCore SSOT 우선 사용으로 교체.
- 2026-07-19: romantic 감사 완료 — 구조가 나머지 4개와 다름(LLM 기반, 전용 신호팩 없음, 11축 이미 전체 반영). 사용자 결정: 지금은 유지, 4개 도메인 완료 후 별도 작업(TODO #7로 등록).
- 2026-07-19: **5개 도메인 중 4개(동료/친구/가족/부부·동거) 전부 (1)(2)(3) 완료.** 연인은 구조가 달라 별도 트랙.

## 관련

- 오늘 work 세션 변경 파일: `lib/relationship/workColleague/officeLanguage.ts`, `buildWorkColleagueContext.ts`, `officeReportTemplate.ts`, `buildWorkColleagueReport.ts`, `sajuCompareTable.ts`, `lib/prompts/relationshipPremium/workColleague/index.ts`, `lib/relationship/psychDomainLens/domainCopyTables.ts`, i18n 메시지 카탈로그
- 오늘 friend 세션 변경 파일: `lib/prompts/relationshipPremium/friendSocial/index.ts`, `lib/relationship/friend/buildFriendReport.ts`, `buildFriendRuleContext.ts`, `friendKillerSections.ts`, `lib/relationship/psychDomainLens/domainCopyTables.ts`
