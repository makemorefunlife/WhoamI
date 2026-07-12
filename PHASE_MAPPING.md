# PHASE_MAPPING — 커플 궁합 분석 v2 (재사용 vs 신규)

기준: `CODEBASE_AUDIT.md` + `커플관계분석_통합설계_v2.md` + `relationship_report_mockup.html`  
범위: **연인(`romantic`) Premium/Deep** 확장 (기존 WhoamI 레포 내 작업, 별도 프로젝트 아님)

**액션 범례**

| 액션 | 의미 |
|---|---|
| **스킵** | 이미 있음. 그대로 사용 |
| **기존 확장** | 기존 파일/모듈에 필드·로직·UI 추가 |
| **신규 생성** | 새 파일/컴포넌트/모듈 필요 |

---

## A. 백엔드 엔진·인프라

| 항목 | Phase | 액션 | 기존 자산 | 비고 |
|---|---|---|---|---|
| Next.js / Stitch / 관계 라우트 골격 | 0 | **스킵** | `app/relationship/`, `components/relationship/` | 별도 프로젝트 세팅 불필요 |
| `romanticproject/` 설계·목업 참조 폴더 | 0 | **스킵** | `lib/relationship/romanticproject/*` | SSOT는 코드·`docs/dev` |
| 만세력 팔자 계산 (`calculateSajuBundle`) | 2 | **스킵** | `lib/v2/saju/calculateSajuBundle.ts` | `@fullstackfamily/manseryeok` |
| 리포트 → 사주 로드 | 2 | **스킵** | `lib/saju/loadSajuBundleFromReport.ts` | Premium API에서 사용 중 |
| 2인 사주 페어 분석 (합충·상생상극) | 2 | **스킵** | `lib/saju/pairChartAnalysis.ts` | `analyzePairSaju` |
| 신살·단일 차트 관계 | 2 | **스킵** | `lib/saju/analyzeShinsal.ts`, `analyzeRelations.ts` | |
| **대운·세운 산출** | 2 | **신규 생성** | 없음 (LLM 추론만) | `formatRomanticSajuInput`에 "대운 데이터 없음" 명시 → 타이밍 섹션 핵심 |
| 사주 매칭 룰 엔진 (십성 조합·합충→지수 보정) | 2 | **기존 확장** | `lib/relationship/romanticRules/*`, `pairEventScores` | 설계 2-1 매핑표 코드화 |
| 상황별 3축 지수 (썸/일상/갈등 × 호감/케미/예민) | 2 | **기존 확장** | `lib/relationship/pairEventScores.ts`, `triScoreSnapshot` | 현재 `overall` 위주 → 컨텍스트별 분리 필요 |
| 설문 11축 점수화 (Secondary) | 3 | **스킵** | `lib/v2/survey/scorer.ts`, `scoringMap.ts` | 6 Primary + 11 Secondary SSOT |
| 2인 심리 gap·유사/보완/긴장 분류 | 3 | **기존 확장** | `romanticRules/types.ts` (`secondaryAxisGap`) | 설계 3-2 공식 **중앙 모듈화** 필요 |
| 갈등 트리거 우선순위 리스트 | 3 | **신규 생성** | `conflict_style` gap만 부분 활용 | 갈등 지도 섹션 입력 |
| 케미 3분리 점수 (감정/소통/신체) | 3 | **신규 생성** | 없음 | 사주+심리 가중합 |
| 사주×심리 교차검증 (합+유사형 등) | 3 | **신규 생성** | 룰 엔진에 산재 | 설계 차별화 포인트 |
| 하이브리드 서사 생성 (룰→LLM) | 5 | **기존 확장** | `runRomanticSajuDeepAnalysis`, `romanticRules` | 신규 섹션 필드만 스키마·프롬프트 추가 |
| 이름 치환·viewer-first | 5 | **기존 확장** | `viewerFirstDisplay.ts`, `romanticEverydayText.ts` | 신규 섹션 텍스트에도 동일 적용 |

---

## B. 타입·스키마 (Phase 1)

| 항목 | Phase | 액션 | 기존 자산 | 비고 |
|---|---|---|---|---|
| Primary/Secondary 축 타입 | 1 | **스킵** | `lib/v2/survey/types.ts` | |
| 연인 룰 컨텍스트 타입 | 1 | **기존 확장** | `lib/relationship/romanticRules/types.ts` | chemistry, conflictCycle 등 필드 |
| TriScore 스냅샷 타입 | 1 | **기존 확장** | `lib/relationship/triScoreSnapshot/types.ts` | `relationshipGauges` 컨텍스트 확장 |
| Romantic Deep 리포트 JSON 스키마 | 1 | **기존 확장** | `lib/prompts/.../romanticSajuDeep/outputSchema.ts` | 섹션 0~11 필드 추가 |
| **PsychMatchResult** (gap·유형·트리거) | 1 | **신규 생성** | — | `lib/relationship/romanticproject/` 또는 `lib/relationship/psychMatch/` |
| **ChemistryScores** (감정/소통/신체) | 1 | **신규 생성** | — | |
| **StrengthWeakness** (얻는 것/약해지는 것) | 1 | **신규 생성** | — | |
| **ConflictCycle** (트리거→반응→확대) | 1 | **신규 생성** | — | |
| **ShareSummaryCard** payload | 1 | **신규 생성** | — | |
| 리포트 레이아웃 UI 타입 | 1 | **기존 확장** | `components/relationship/reportLayout/types.ts` | 필요 시 `ScoreMetric` 확장 |

---

## C. API (Phase 6)

| 항목 | Phase | 액션 | 기존 자산 | 비고 |
|---|---|---|---|---|
| `POST /api/relationship/analyze` (설계 예시) | 6 | **스킵** | — | **새 엔드포인트 만들지 않음** |
| `POST .../analyze/premium` (romantic) | 6 | **기존 확장** | `app/api/relationship/analyze/premium/route.ts` | 파이프라인에 신규 엔진 연결 |
| `GET .../detail` | 6 | **기존 확장** | `app/api/relationship/detail/route.ts` | 새 필드 노출 |
| `POST .../analyze/basic` | 6 | **스킵** | 기존 4축 Basic | 연인 Deep와 별도 레이어 |
| 재생성 (`force_regenerate`) | 6 | **스킵** | premium route | "다시 만들기" |
| 캐시 (`result_premium_by_kind`) | 6 | **스킵** | `relationship_reports` | 스키마 버전 bump만 검토 |
| `POST /api/saju` | 6 | **스킵** | `app/api/saju/route.ts` | 관계는 `loadSajuBundleFromReport` 직접 호출 |
| 설문 조회 | 6 | **스킵** | `app/api/v2/survey/route.ts` | psych_scores 소스 |

---

## D. UI 컴포넌트 (Phase 4) — 목업 섹션별

| 목업 섹션 | Phase | 액션 | 기존 자산 | 비고 |
|---|---|---|---|---|
| **0. 커버** (등급·한줄·이름) | 4 | **기존 확장** | `RelationshipHeadlineBanner`, `RomanticSajuDeepReportView` | Stitch 토큰 적용 중 |
| **1. 상황별 3축 게이지** (썸/일상/갈등 탭) | 4 | **기존 확장** | `RelationshipScoreBoard`, `TriScoreSnapshotPanel` | **탭 UI 신규**; 게이지 SVG는 재사용 |
| **2. 왜 끌렸는가** (사주+심리 카드) | 4 | **기존 확장** | `InsightHook`, section_4 / attraction rules | 별도 섹션 승격 |
| **3. 기질 카드** (1인칭 + 은유) | 4 | **기존 확장** | `RomanticSajuDeepReportView` nature 블록 | viewer-first 순서 유지 |
| **3. 11축 레이더 오버레이** | 4 | **기존 확장** | `DualAxisRadarChart` (6축) | **11 Secondary 축**으로 axisOrder 교체 또는 **신규** `SecondaryRadarOverlay` |
| **4. 서로 비교표** (gap 하이라이트) | 4 | **기존 확장** | comparison_table in view | gap>50 하이라이트 로직 추가 |
| **5. 케미스트리 심화** (3 바 게이지) | 4 | **신규 생성** | — | `ChemistryBarSection` 등 |
| **6. 특별한 이유** (A→B, B→A) | 4 | **스킵** | `section_4_special_bond` | |
| **7. 갈등 지도 — 순환 SVG** | 4 | **신규 생성** | — | `ConflictCycleDiagram` |
| **7. 갈등 대사 Before/After** | 4 | **기존 확장** | dialogue_table in view | Stitch 스타일만 정리 |
| **8. 강점·약점 카드** | 4 | **신규 생성** | — | `StrengthWeaknessCard` |
| **9. 액션플랜 탭** | 4 | **기존 확장** | advice section + rose 블록 | 사람별 탭 UI |
| **10. 타임라인 가로 스크롤** | 4 | **기존 확장** | `section_6_timeline` | 세로 → 가로 스크롤 |
| **11. 공유 요약 카드** | 4 | **신규 생성** | — | `ShareSummaryCard` + (선택) 이미지 export |
| Stitch 테마 / ReportSurface | 4 | **기존 확장** | `ReportSurface.tsx`, `getStitchTabTheme` | romantic만 stitch |
| 6축 Blueprint 레이더 (참고) | 4 | **스킵** | `AxisRadarChart`, `DualAxisRadarChart` | 연인은 11축 별도 |

---

## E. 페이지 조립 (Phase 7)

| 항목 | Phase | 액션 | 기존 자산 | 비고 |
|---|---|---|---|---|
| 연인 Deep 리포트 뷰 전체 | 7 | **기존 확장** | `RomanticSajuDeepReportView.tsx` | 섹션 0~11 순서 반영 |
| Premium 섹션 래퍼 | 7 | **기존 확장** | `RelationshipPremiumSection.tsx` | `ReportSurfaceProvider surface="stitch"` |
| 관계 상세 페이지 | 7 | **기존 확장** | `RelationshipView.tsx`, `useRelationshipDetail.ts` | 이름·viewer 매핑 |
| 관계 허브 | 7 | **스킵** | `RelationHubDashboard` | 이번 스코프 외 (리포트 본문만) |
| 분석 이력 | 7 | **스킵** | `RelationshipAnalysisHistory` | 로그 스키마 확장은 선택 |

---

## F. 권장 작업 순서 (Phase 의존성)

```
Phase 0 스킵 → Phase 1 타입 → Phase 2·3 엔진(병렬 가능)
    → Phase 5 콘텐츠(엔진 출력 연동) → Phase 6 API → Phase 4 UI → Phase 7 조립
```

| 우선순위 | Phase | 이번 스프린트 핵심 산출물 |
|---|---|---|
| P0 | 1 | `outputSchema` + `PsychMatchResult` 타입 |
| P0 | 3 | `buildPsychMatchResult()` (gap·유형·트리거) |
| P0 | 2 | 컨텍스트별 `event_scores` + (선택) 대운 스켈레톤 |
| P1 | 5 | 룰/LLM에 신규 섹션 필드 채우기 |
| P1 | 6 | `analyze/premium` romantic 경로에 엔진 연결 |
| P1 | 4 | 레이더 11축, 갈등 사이클, 강점/약점, 공유 카드 |
| P2 | 7 | 목업과 1:1 섹션 순서·Stitch 마감 |

---

## G. 신규 생성만 모은 체크리스트 (최소)

| # | Phase | 산출물 |
|---|---|---|
| 1 | 2 | 대운·세운 계산 또는 근사 모듈 |
| 2 | 3 | `psychMatch` 모듈 (gap 분류·트리거·케미 3분리·교차검증) |
| 3 | 1 | 위 모듈용 타입 정의 |
| 4 | 4 | `SecondaryRadarOverlay`, `ConflictCycleDiagram`, `ChemistryBarSection`, `StrengthWeaknessCard`, `ShareSummaryCard` |
| 5 | 4 | 상황별 지수 **탭** UI (게이지 자체는 재사용) |

**의도적으로 만들지 않을 것:** `POST /api/relationship/analyze` 단일 엔드포인트, 별도 Cursor 프로젝트, 전역 상태 라이브러리.
