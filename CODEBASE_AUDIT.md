# CODEBASE AUDIT (커플 궁합 분석 확장 사전 조사)

기준 시점: 2026-07-09  
요청 범위: `lib/relationship/romanticproject/relationship_report_mockup.html`, `lib/relationship/romanticproject/커플관계분석_통합설계_v2.md` 참고 + 기존 코드베이스 현황 조사  
주의: 이 문서는 **추가 구현 없이** 현재 저장소 상태만 정리합니다.

---

## 0) 참고 파일 검토 요약

| 파일 | 성격 | 핵심 포인트 |
|---|---|---|
| `lib/relationship/romanticproject/relationship_report_mockup.html` | 연인 리포트 UI 목업 | 3축 게이지(호감/케미/예민), 레이더(11축), 비교표, 갈등 사이클 SVG, 액션 탭, 타임라인, 공유 카드 포함 |
| `lib/relationship/romanticproject/커플관계분석_통합설계_v2.md` | 통합 설계 문서 | 기존 강점 유지 + 신규(강점/약점, 3분리 케미, 공유 카드), 사주 룰/심리 10축 매칭 공식을 명시 |

---

## 1) 사주/만세력 계산 관련 코드 존재 여부

결론: **이미 충분히 존재**합니다.  
`@fullstackfamily/manseryeok` 기반 계산 + 사주 관계/신살/합충 분석 + 관계 kind별 pair 분석이 구축되어 있습니다.

| 파일 경로 | 주요 함수/심볼 | 출력/역할 |
|---|---|---|
| `lib/v2/saju/calculateSajuBundle.ts` | `calculateSajuBundle(input)` | 생년월일시 입력 -> `saju(year/month/day/hour pillar)`, `chart`, `tenGods`, `relations`, `shinsals` 포함 bundle 반환 |
| `lib/saju/loadSajuBundleFromReport.ts` | `loadSajuBundleFromReport(report)` | `reports` 행 입력 -> `SajuDataForIntegrated` + `SajuChartProvenance`(엔진, 시주 보정, 검증 노트) 반환 |
| `lib/saju/pairChartAnalysis.ts` | `analyzePairSaju`, `analyzeCrossChartRelations`, `elementInteraction` | 2인 사주 상호작용(상생/상극, 교차 히트, 궁위 가중치) 분석 결과(`PairSajuAnalysis`) 반환 |
| `lib/saju/workPairAnalysis.ts` | `analyzeWorkPairSaju` | 동료 관계용 사주 페어 분석 |
| `lib/saju/marriageAnalysis.ts` | `analyzeMarriagePairSaju`, `analyzeIntraChartPalaceHits` | 동거/결혼 관계용 사주 페어 분석 |
| `lib/saju/friendAnalysis.ts` | `analyzeFriendPairSaju` | 친구 관계용 사주 페어 분석 |
| `lib/saju/familyAnalysis.ts` | `analyzeFamilyPairSaju`, `analyzeFamilyParentPairSaju` | 가족 관계용 사주 페어 분석 |
| `lib/saju/analyzeRelations.ts` | `analyzeRelations` | 단일 사주 내 합/충/형/해 등 관계 hit 추출 |
| `lib/saju/analyzeShinsal.ts` | `analyzeShinsal` | 신살 hit 추출 |
| `lib/saju/repository.ts` | `calculateTenGod`, `calculateTwelveStage`, 참조 조회 함수들 | 십성/12운성 계산 및 참조 데이터 접근 계층 |
| `app/api/saju/route.ts` | `POST` | API 레벨 사주 계산 엔드포인트(내부에서 `calculateSajuBundle` 사용, 응답은 `toV1SajuApiPayload`) |

추가 확인:
- `lib/v2/saju/innateLite.ts`의 `calculateInnateSelfLite`는 사주를 6축 성향 점수로 투영하는 로직입니다.
- 관계 Premium API(`app/api/relationship/analyze/premium/route.ts`)는 각 kind 분석 전 `loadSajuBundleFromReport`를 호출해 사주 계산을 공통 사용합니다.

---

## 2) 궁합/관계분석 타입 정의 존재 여부 (types 전체)

결론: **전용 `types/` 디렉터리 단일 구조는 없고**, `*types*.ts` 파일로 분산 정의되어 있습니다.  
(`**/types/**/*.ts` 검색 결과 0건, `**/*types*.ts` 검색 결과 다수)

| 파일 | 타입 범위 | 비고 |
|---|---|---|
| `lib/relationship/romanticRules/types.ts` | 연인 룰 엔진 컨텍스트/스크린 결과 타입 | 사주+설문+관계축 결합 컨텍스트 타입 매우 상세 |
| `lib/relationship/triScoreSnapshot/types.ts` | 공통 TriScore 스냅샷 타입 | `relationshipGauges`, `personA/B`, narrative 포함 |
| `lib/relationship/familyParent/types.ts` | 가족(parent-child) 도메인 타입 | family kind 전용 |
| `lib/relationship/romanticHeadline/types.ts` | 연인 오프닝/인사이트 후보 타입 | romantic 전용 |
| `lib/prompts/relationshipPremium/types.ts` | Premium 프롬프트 파라미터 타입 | kind, patterns, saju/astrology block |
| `components/relationship/reportLayout/types.ts` | 리포트 레이아웃/스코어 UI 타입 | `ScoreMetric`, `HeadlineProps` |
| `lib/v2/survey/types.ts` | 심리축(Primary/Secondary), 설문 입력/프로필 타입 | 6 Primary + 11 Secondary SSOT |

판단:
- 궁합 확장 시 새로운 타입은 `lib/relationship/.../types.ts` 또는 기능 인접 파일에 분산 추가하는 현재 패턴을 따르는 것이 자연스럽습니다.

---

## 3) 게이지/차트/레이더 등 시각화 컴포넌트 존재 여부

결론: **이미 존재**합니다. 특히 레이더와 원형 게이지는 재사용 가능한 수준입니다.

| 컴포넌트 | 파일 경로 | 현재 역할 |
|---|---|---|
| `AxisRadarChart` | `components/v2/AxisRadarChart.tsx` | 단일 시리즈 6축 레이더 SVG |
| `DualAxisRadarChart` | `components/v2/DualAxisRadarChart.tsx` | 2시리즈 오버레이 레이더(축 라벨 인터랙션 포함) |
| `RelationshipScoreBoard` (`ScoreGauge` 내부) | `components/relationship/reportLayout/RelationshipScoreBoard.tsx` | 관계 리포트용 원형 게이지 + 바 |
| `TriScoreSnapshotPanel` 계열 | `components/relationship/*SnapshotPanel*.tsx` | 관계 kind별 스냅샷/게이지 패널 렌더 |

보조 관찰:
- `relationship_report_mockup.html`의 11축 레이더/갈등 사이클 SVG는 현재 컴포넌트화되어 있지 않지만, 기존 SVG 렌더 패턴(레이더/게이지)은 재사용 가능합니다.

---

## 4) API 라우트 중 관계분석/사주 관련 기존 엔드포인트

결론: **관계분석 API는 이미 풀셋**입니다. 사주 API도 별도 존재합니다.

### 4-1. 관계분석 API (`app/api/relationship/**/route.ts`)

| 엔드포인트 | 파일 | 용도 |
|---|---|---|
| `POST /api/relationship/analyze/basic` | `app/api/relationship/analyze/basic/route.ts` | v2 설문 패턴 기반 Basic 4축 분석 |
| `POST /api/relationship/analyze/premium` | `app/api/relationship/analyze/premium/route.ts` | kind별 Premium/Deep 분석 (romantic/work/cohabitation/family/friendship) |
| `GET /api/relationship/detail` | `app/api/relationship/detail/route.ts` | 상세 조회(이름, kind, 결과, favorite 상태 등) |
| `GET /api/relationship/list` | `app/api/relationship/list/route.ts` | 관계 허브 목록 |
| `POST /api/relationship/create` | `app/api/relationship/create/route.ts` | 관계 보고서 생성 |
| `POST /api/relationship/generate` | `app/api/relationship/generate/route.ts` | 생성 트리거/흐름 지원 |
| `POST /api/relationship/upgrade` | `app/api/relationship/upgrade/route.ts` | premium 전환 |
| `POST /api/relationship/favorite` | `app/api/relationship/favorite/route.ts` | 즐겨찾기 |
| `GET /api/relationship/logs` | `app/api/relationship/logs/route.ts` | 분석 이력 조회 |
| `POST /api/relationship/manual` | `app/api/relationship/manual/route.ts` | 직접 입력 파트너 생성 |
| `PATCH /api/relationship/partner-name` | `app/api/relationship/partner-name/route.ts` | 파트너 이름 수정 |
| `GET /api/relationship/status` | `app/api/relationship/status/route.ts` | 상태 확인 |
| `POST /api/relationship/remove` | `app/api/relationship/remove/route.ts` | 관계 제거 |

### 4-2. 사주/관련 API

| 엔드포인트 | 파일 | 용도 |
|---|---|---|
| `POST /api/saju` | `app/api/saju/route.ts` | 만세력/사주 계산 API |
| `POST /api/astrology` | `app/api/astrology/route.ts` | 점성 데이터 (Premium 프롬프트 보조) |
| `POST /api/v2/lite/innate` | `app/api/v2/lite/innate/route.ts` | 사주 기반 Lite innate 리포트 |
| `POST /api/v2/lite/current` | `app/api/v2/lite/current/route.ts` | 설문 기반 Lite current 리포트 |
| `GET/POST/DELETE /api/v2/survey` | `app/api/v2/survey/route.ts` | 심리 설문 저장/조회/초기화 |

---

## 5) 심리검사/심리점수 데이터 로직 존재 여부

결론: **이미 존재**하며, 관계 분석에도 연결되어 있습니다.

| 파일 | 핵심 함수 | 역할 |
|---|---|---|
| `lib/v2/survey/scoringMap.ts` | `SURVEY_SCORING_MAP`, `QUESTION_WEIGHT` | 문항 선택지 -> 축 델타 맵(Primary/Secondary) |
| `lib/v2/survey/scorer.ts` | `scoreSurveyAnswers`, `buildLiteInterpretationHints` | Q1~Q9 점수화, baseline 50 정규화, 힌트 생성 |
| `lib/v2/survey/types.ts` | `PRIMARY_AXIS_KEYS`, `SECONDARY_AXIS_KEYS`, `CurrentSelfProfile` | 심리축/프로필 타입 SSOT |
| `app/api/v2/survey/route.ts` | `GET/POST/DELETE` | 설문 응답 + v2_profile 저장/조회 |
| `lib/relationship/surveyPatterns.ts` | `getPatternSummaryForReport` | 설문 profile/answers를 관계분석용 패턴 텍스트로 변환 |
| `lib/relationship/romanticRules/types.ts` | `secondaryAxis`, `secondaryAxisGap` 등 | 연인 룰 엔진에서 심리축 gap/우위 계산 활용 |
| `lib/v2/analysis/gap.ts` | gap 계산 타입/로직 | Blueprint 축 차이 분석 |

핵심 해석:
- 설문(심리) 점수는 관계 Basic 분석 입력으로 직접 사용되고,
- 연인 심화(romantic rules)에서도 secondary 축 gap 분석 근거로 재활용됩니다.

---

## 6) 네이밍 컨벤션/폴더 구조/상태관리 방식

### 6-1. 폴더 구조 (현재 관찰)

| 레이어 | 경로 | 패턴 |
|---|---|---|
| 라우팅/API | `app/` | Next.js App Router, `app/api/**/route.ts` |
| UI 컴포넌트 | `components/` | 도메인 폴더(`relationship`, `v2`, `results` 등) |
| 도메인 로직 | `lib/` | `lib/saju`, `lib/relationship`, `lib/v2/*` 중심 |
| 문서/정책 | `docs/dev`, `docs/v2` | 운영 정책 + 아키텍처 문서 분리 |

(`docs/dev/CORE_MAP.md`와 일치)

### 6-2. 파일/심볼 네이밍 패턴

| 항목 | 패턴 |
|---|---|
| 컴포넌트 파일 | PascalCase (`RelationshipScoreBoard.tsx`, `DualAxisRadarChart.tsx`) |
| 훅 파일 | `useXxx` camelCase (`useRelationshipDetail.ts`) |
| 라이브러리 파일 | camelCase 또는 도메인명 조합 (`pairChartAnalysis.ts`, `surveyPatterns.ts`) |
| API 파일 | 고정 `route.ts` (폴더 기반 엔드포인트 명시) |
| 타입 파일 | 단일 `types/` 디렉터리보다 `*types*.ts` 분산 배치 |
| path alias | `@/` 절대 경로 import 사용 |

### 6-3. 상태관리 방식

| 범주 | 현재 방식 |
|---|---|
| 클라이언트 상태 | React Hook (`useState`, `useEffect`, `useCallback`, `useRef`) 중심 |
| 서버 상태/데이터 | API fetch + Supabase 조회/저장 |
| 전역 상태 라이브러리 | **미사용** (zustand/redux/recoil/jotai 검색 결과 없음) |
| 세션성 캐시 | `sessionStorage`/`localStorage` 일부 사용 (`docs/dev/CORE_MAP.md`에 키 정책 명시) |

---

## 추가 메모 (확장 전 체크포인트)

1. 관계 Premium 엔진은 이미 kind별 분기와 캐시(`result_premium_by_kind`)가 있어, 신규 커플 궁합 확장은 기존 파이프라인과 정합성 맞추는 것이 중요합니다.  
2. mockup의 11축 레이더/갈등 다이어그램은 현재 관계 컴포넌트에 그대로는 없지만, `DualAxisRadarChart`/SVG 패턴 재사용이 가능합니다.  
3. 이름/시점 매핑(`viewer/partner`) 로직은 최근 수정 중인 영역이므로, 신규 섹션 추가 시 `viewerFirst` 컨텍스트를 우선 확인해야 합니다.

