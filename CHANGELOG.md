# Changelog

## 0.3.1 (2026-07-12)

연인 심화 리포트 프롬프트·psych_match UI 품질 패치.

- 🌱 **서로에게 도움이 되는 행동들**: `essenceActionWritingRules` Few-Shot 전면 교체, 「이런 순간에」 UI 제거, 💌 에센스 다이어리 섹션명 적용.
- 💬 **갈등 상황**: `conflictSituationWritingRules` — 50:50 쌍방 고충·2행 대화표·모범답안 금지 (v2.17).
- 💪 **강점·약점**: `buildStrengthWeaknessLists` 최소 3개 보장 (tension 1개만 있어도 gap 상위 축으로 보충).
- Essence 행동 가이드 UI: `01. 제목: 본문` + `* 실전 대사 꿀팁` 형식.
- Supabase 마이그레이션 적용 스크립트 `tests/scripts/apply-supabase-migration.mjs` 추가.

## 0.3.0 (2026-07-12)

연인 심화 리포트 psych_match·Essence 저널·관계 Hub 대규모 개선.

- `PsychMatchRadarChart` 축 스케일을 0~100 고정 대신 `gapPercentiles`의 축별 실제 점수 범위(scoreMin~scoreMax)로 확대 매핑했습니다.
- 차트 상단에 「확대 표시」 안내를 추가해 숫자는 그대로·그림만 시각 강조임을 명시했습니다.
- `gapPercentiles.ts`에 축별 scoreMin/scoreMax와 `scoreToAxisRatio` 헬퍼를 추가했습니다.
- `relationshipIndexInsight` INSIGHT_LINES 7문장을 점수명 의인화 없이 끌림·편안함·마찰 경험 톤으로 교체했습니다 (나머지 7문장 베리에이션은 유지).
- `affection_over_chemistry`·`sensitivity_low`·`balanced` 등 패턴별 대표 문장에서 호감/케미/예민 주어 표현을 제거했습니다.
- 관계 지수 한 줄 인사이트가 사용자-facing 리포트 톤과 맞도록 문구만 갱신했습니다 (로직 변경 없음).
- `psych_match` 분류를 고정 gap 임계값(20/50)에서 축별 퍼센타일(p60/p90) 기반으로 전환했습니다 (`gapPercentiles.ts`).
- `classifyPsychMatchType(axisKey, gap)` 시그니처로 바꿨고, `chemistryApprox`는 `100-gap` 대신 축 분포 백분위 역환산 점수를 씁니다.
- 10문항 설문 특성상 절대 gap이 19 이하라 고정 20/50은 100% 유사·케미 95~99 몰림이었기 때문에, 축마다 다른 상대 기준이 필요했습니다.
- 개발 용어(psych_match·gap·11축)는 본문에서 제거하고 `chemistryInsights` 템플릿으로 대체했습니다.
- 연인 리포트 카드 제목을 `🍀 케미스트리 심화`로 통일하고 `IBM_Plex_Mono` 폰트를 layout에 추가했습니다.
- 관계 지수 하단 `점수가 의미하는 것`에서 색상 범례 줄을 삭제하고, 🔥🧩⚡ 정의는 `이 점수들이 뭔가요?` 접이형 토글(`RelationshipScoreDefinitions`)로 옮겼습니다.
- `RelationshipScoreBoard` 상단의 중복 색상 범례 안내도 제거했습니다.
- 지표 설명 영역은 본문보다 작은 muted 톤(`text-[10px]`)으로 부가 정보처럼 보이게 조정했습니다.
- 관계 지수 한 줄 인사이트를 `relationshipIndexInsight`로 재작성했습니다: 호감·케미·예민 격차·패턴 기준, 패턴별 2문장 베리에이션, 예민 높을 때 갈등 패턴 앵커 링크.
- 연인 리포트에 `showTriScoreInsight`·`relationship-conflict-map` 앵커를 연결해 예민 주의 문장에서 갈등 섹션으로 스크롤할 수 있게 했습니다.
- `/dev/psych-capture`에 대시보드 캡처 섹션과 점수 조합별 인사이트 샘플 목록을 추가했습니다.
- `parseLlmJson`에 `fetchLlmJsonWithParseRetry`를 추가해 LLM 응답 `JSON.parse` 실패 시 동일 요청을 최대 2회(총 3회) 자동 재시도하고, 재시도 간 750ms 지연을 둡니다.
- `runRomanticSajuDeepAnalysis` 1차·self-refine LLM 호출에 재시도 래퍼를 적용해 malformed JSON 일시 오류 시 수동 재클릭 없이 서버에서 복구를 시도합니다.
- 재시도 소진 시 `LlmJsonParseRetryError`를 던지고 premium API가 `N회 재시도 후 실패` 문구를 포함한 500 응답·서버 로그를 남깁니다.
- `conflict_style` 축은 scoringMap 연결 문항이 q2·q6 두 개뿐이라 신호가 얕아, 소통 케미 평균·강점/약점 카피·`conflict_triggers` 우선순위에서만 예외 제외했습니다(레이더 11축 시각화는 유지, 라벨에 `*` 참고 표시).
- 소통 케미(`chemistryApprox`)는 thinking_style·decision_style·structure 3축 평균으로 재계산합니다.
- `buildStrengthWeaknessLists`와 `buildPsychMatchResult`의 `conflict_triggers`는 `conflict_style`을 스킵해 확언형 문장에 얕은 축이 대표로 오르지 않게 했습니다.
- 연인 premium `psych_match` 입력을 존재하지 않는 `reports.v2_profile` 대신 `survey_responses.answers.v2_profile` SSOT(`getCurrentSelfProfileForReport`)에서 읽도록 수정했습니다.
- `surveyPatterns`에 `currentSelfProfileFromSurveyAnswers`·`getCurrentSelfProfileForReport`를 추가해 `/api/v2/survey` GET과 동일한 프로필 복원 규칙을 재사용합니다.
- 양쪽 설문 프로필이 모두 있을 때만 `psych_match`·`romantic_fortune_flow`가 계산되고, 한쪽이라도 없으면 기존처럼 `psych_match: null`로 안전 처리됩니다.
- 상대 폴리곤을 테라코타(`#c49a6c`)에서 웜 골든 앰버(`#B6C133`)로 교체해 긴장 축 빨강과 hue 60.4° 이상 확보했습니다(긴장 축 경고색은 유지).
- 보완 축을 `#AD89C2`로 소폭 이동해 유사↔보완 hue 간격(60.6°)을 맞추고, 5색 10쌍 전부 hue 차이 60° 이상을 수치 검증했습니다.
- `PsychMatchRadarChart` 유사·보완 축 색을 person teal/terracotta 계열에서 분리해 차분한 블루(`#6789C1`)·라벤더(`#A78BC4`)로 교체했습니다.
- HSL hue 기준 person 2색·축 3색 간 최소 차이가 60° 이상(유사↔나 60.3°) 나도록 수치 검증했습니다.
- 긴장 축 빨강·나/상대 폴리곤 색상은 기존 그대로 유지했습니다.
- `PsychMatchRadarChart` 색상을 3단계 위계로 정리했습니다: 그리드는 거의 보이지 않는 옅은 회색, 축 스포크·라벨은 긴장(진한 빨강)·유사(옅은 청록)·보완(옅은 골드)로 구분합니다.
- 나/상대 폴리곤 색상(`#3a8f6e`·`#c49a6c`)은 사람 구분 전용으로 유지하고, 축 색과 명도·채도로 겹치지 않게 분리했습니다.
- 하단 범례에 나·상대와 함께 긴장/유사/보완 축 색상 설명을 추가했습니다.
- romanticRules에 대운/세운 계산(`romantic_fortune_flow`)을 추가해 연인 심화 결과의 시간축 근거를 구조화했습니다.
- `lib/relationship/psychMatch` 신규 모듈에서 11축 gap·유형(유사/보완/긴장)·갈등 트리거 우선순위를 계산하도록 구현했습니다.
- `analyze/premium` romantic 응답에 두 결과가 포함되도록 `runRomanticSajuDeepAnalysis`와 API 입력(`v2_profile`) 연동을 확장했습니다.
- `detail` API에서 연인 심화 보고서를 `parseRomanticDeepViewModel`로 안전 파싱해 `meta.psych_match`, `meta.romantic_fortune_flow`를 정제해 반환하도록 맞췄습니다.
- `useRelationshipDetail`의 romantic 뷰 모델 타입을 `RomanticDeepViewModel`로 고정하고, 캐스팅 대신 안전 파싱 결과만 상태에 저장하도록 변경했습니다.
- UI 연결 준비용으로 `displayRomanticMeta`(psych_match + romantic_fortune_flow) 반환 필드를 추가해 컴포넌트에서 바로 소비 가능한 형태를 제공했습니다.
- `psychMatch/strengthWeaknessTemplates`에서 11축 `match_type` 기반 강점·약점 문장 매핑과 리스트 생성 함수를 추가했습니다.
- 목업 `sw-grid` 토큰을 참고한 `StrengthWeaknessCard` 컴포넌트를 `reportLayout`에 추가했습니다.
- `ConflictScriptTable`·`ConflictTriggerBanner`로 연인 심화 `conflict_situation` 대화 패턴 UI를 분리 구현했습니다.
- `psychMatch/chemistryApprox`에서 11축 gap 기반 감정·소통 케미 근사 점수(4+4축 평균)를 계산하도록 추가했습니다.
- 목업 `chem-list` 토큰을 참고한 `ChemistryBreakdown` 컴포넌트(감정·소통 2게이지)를 `reportLayout`에 추가했습니다.
- 신체 케미는 3분리 설문 도입 전까지 본 근사 모듈 범위에서 제외했습니다.
- `ChemistryBreakdown`에서 점수 null 시 0% 바 대신 부족 데이터 안내 문구를 표시하도록 수정했습니다.
- `RomanticSajuDeepReportView`에 `psych_match`가 있을 때만 케미스트리 심화 섹션을 스코어 보드 직후에 연결했습니다.
- 구버전 리포트(`psych_match` 없음)에서는 케미스트리 심화 섹션이 렌더링되지 않도록 가드했습니다.
- `RomanticSajuDeepReportView`에 `PsychMatchRadarChart`·`StrengthWeaknessCard`·`ShareSummaryCard`를 설계 목차 순서에 맞춰 연결했습니다.
- `runRomanticSajuDeepAnalysis`·`getRomanticSajuDeepSystemPrompt`·`buildRomanticSajuDeepUserPrompt`에 `locale: 'ko' | 'en'`(기본 `ko`) 파라미터 배선을 추가했습니다.
- `en` locale은 아직 한국어 프롬프트를 그대로 반환하는 placeholder이며, API route 연동은 다음 단계로 미룹니다.
- 다른 relationship premium 파이프라인(work/cohabitation/family/friend)에는 이번 locale 변경이 영향을 주지 않습니다.
- `psych_match` 기반 섹션(레이더·강점/약점·케미스트리)은 구버전 데이터에서 숨기고, 공유 카드는 타임라인 다음 최하단에 배치했습니다.
- `POST /api/relationship/analyze/premium` 요청 body에 Lite와 동일한 `language?: 'ko' | 'en'`(기본 `ko`) 필드를 추가했습니다.
- romantic 분기에서 `language`를 `runRomanticSajuDeepAnalysis({ locale })`로 전달하고, 저장 payload의 `report.meta.language`에 생성 locale을 기록합니다.
- `language` 생략 시 기존과 동일하게 한국어(`ko`) 프롬프트로 동작하며, en 콘텐츠는 아직 placeholder입니다.
- `ROMANTIC_HEADLINE_EN.md`를 프로젝트 루트에 추가하고 Headline Engine에 `locale` 배선을 연결했습니다.
- `DAY_STEM_ROMANTIC_PROFILES_KO/_EN`, `HEADLINE_RULES` 고정 headline, `crossHeadline()`, 결합 함수에 `en` 분기를 반영했습니다.
- `buildRomanticRulesBundle`·`buildRomanticHeadlineContext`·`runRomanticSajuDeepAnalysis` locale이 headline까지 전달되며, `language` 생략 시 KO 결과 회귀를 `tests/scripts/romantic-headline-locale-regression.ts`로 확인했습니다.
