# 서비스 정보 구조도 (IA MAP) & 라우팅 SSOT

> **작성일:** 2026-09-20  
> **기준 버전:** Next.js App Router (Slim V1 + 7-Scene Narrative SSOT)  
> **상태:** 단권화 및 최신화 완료

---

## 1. 4대 핵심 유저 서비스 여정 (IA Tree)

```
WhoamI (/)
│
├── 🏠 1. 메인 랜딩 & 세션 허브
│   └── /                                랜딩 페이지, 게스트 시작 모달, 로그인 스킵
│
├── 📋 2. 무료 온보딩 & 대시보드 여정 (v2 Blueprint)
│   ├── /survey-v2                      v2 심리 설문 10문항
│   ├── /survey-v2/complete             분석 오프닝 애니메이션 & 출생 정보 게이트
│   ├── /onboarding/birth               출생 정보(생년월일·시·장소) 편집
│   ├── /onboarding/legal-consent       법적 동의 수집
│   └── /blueprint-preview              6축 무료 대시보드 (Lite + Gap 비교 표)
│       ├── .../[reportId]/current       Current Self Lite 상세
│       ├── .../[reportId]/essence       Innate Self Lite 상세
│       └── .../[reportId]/essence/deep   본래의 나 심화 (Slim V1 통합 리포트)
│
├── 💞 3. 관계 분석 여정 (7-Scene Relationship Narrative)
│   ├── /relationships                  관계 허브 (내 사람들 지도·목록·초대·직접 입력)
│   ├── /relationship/[id]              관계 7-Scene 서사 리포트
│   │                                   (연인/동료/친구/부모-자녀 4대 도메인 + 부부/동거)
│   └── /relationship/share/[token]     관계 리포트 공유 링크 뷰어
│
├── 📝 4. 결정 저널 여정 (Decision Journal)
│   ├── /decision                       의사결정 작성 저널
│   └── /decision/history               내 결정 기록 목록
│
├── 🔐 계정 / 결제 / 초대
│   ├── /sign-in/[[...sign-in]]         Clerk 로그인
│   └── /sign-up/[[...sign-up]]         Clerk 회원가입
│   ├── /account                        계정 대시보드
│   ├── /account/profile                내 프로필 & 출생 정보 수정
│   ├── /account/billing                결제 및 요금제 관리
│   ├── /connect                        기기 및 다른 리포트 연결
│   ├── /invite                         친구 초대 수신 페이지
│   └── /invite-birth                   초대받은 사람 출생 정보 입력
│
├── 📣 정보 / 법적 공지
│   ├── /about                          서비스 소개
│   ├── /how-it-works                   작동 원리 소개
│   ├── /pricing                        요금제 안내
│   ├── /faq                            자주 묻는 질문
│   ├── /contact                        문의하기
│   ├── /terms                          이용약관
│   ├── /privacy                        개인정보처리방침
│   ├── /refund                         환불 규정
│   └── /do-not-sell                    개인정보 판매 거부
│
└── 🛠️ 개발 & 시각화 스위트 (Dev Only - 프로덕션 비노출)
    ├── /dev/relationship-enrichment-review  7-Scene Narrative 렌더러 리뷰 스위트
    ├── /dev/cohabitation-prescription       동거/부부 처방전 시각화
    ├── /dev/psych-capture                   심리 항목 캡처 디버거
    ├── /dev/romantic-v2-visual              연인 v2 시각화
    ├── /dev/romantic-v4-content-prototype   연인 v4 프로토타입
    └── /dev/work-report-viewmodel           동료 ViewModel 디버거
```

---

## 2. API 엔드포인트 지도 (52개 라우트)

| 영역 | 라우트 | 역할 |
|------|--------|------|
| **세션·홈** | `GET /api/home/resume` | 로그인 유저 리포트 세션 복원 & 랜딩 스킵 판별 |
| **설문·출생** | `GET/POST/DELETE /api/v2/survey` | v2 설문 응답 CRUD |
| | `POST /api/report/birth` | 생년월일·시간·출생지 저장 & 만세력 계산 |
| **개인 리포트** | `GET /api/v2/lite/current` | Current Self Lite LLM 리포트 |
| | `GET /api/v2/lite/essence` | Innate Self Lite LLM 리포트 |
| | `POST /api/v2/deep/essence` | Slim V1 심화 통합 리포트 (설문+사주+점성) |
| | `GET/POST /api/my/report` | 내 개인 리포트 조회/생성 |
| | `GET /api/saju` | 개인 사주 팔자 계산 데이터 |
| | `GET /api/astrology` | 출생지 기반 행성 점성 좌표 |
| **관계 7-Scene**| `GET/POST /api/relationship/list` | 관계 대상자 목록 및 요약 |
| | `POST /api/relationship/create` | 관계 생성 |
| | `POST /api/relationship/manual` | 상대방 직접 입력 생성 |
| | `GET /api/relationship/detail` | 관계 7-Scene 상세 조회 |
| | `POST /api/relationship/analyze/basic` | 관계 Basic 분석 |
| | `POST /api/relationship/analyze/premium` | 관계 7-Scene Premium 분석 (4대 도메인) |
| | `POST /api/relationship/upgrade` | 관계 리포트 업그레이드 |
| | `GET/POST /api/relationship/map` | 관계 지도 데이터 |
| | `GET /api/relationship/map/free-preview` | 관계 지도 프리뷰 |
| | `POST /api/relationship/share/create` | 공유 토큰 생성 |
| | `GET /api/relationship/share/view` | 공유 링크 결과 조회 |
| | `POST /api/relationship/share/revoke` | 공유 링크 취소 |
| | `GET /api/relationship/share/status` | 공유 상태 확인 |
| | `GET /api/relationship/share/inbox` | 받은 공유 함 |
| | `POST /api/relationship/favorite` | 즐겨찾기 |
| | `DELETE /api/relationship/remove` | 관계 삭제 |
| | `PATCH /api/relationship/partner-name` | 상대방 이름 수정 |
| | `POST /api/relationship/logs` | 관계 이벤트 로그 |
| | `POST /api/relationship/logs/batch` | 이벤트 로그 배치 |
| | `GET /api/relationship/status` | 관계 상태 |
| **초대** | `POST /api/invite/create` | 관계 초대 링크 생성 |
| | `GET /api/invite/info` | 초대 정보 확인 |
| | `POST /api/invite/accept` | 초대 수락 |
| | `POST /api/invite/complete` | 초대 완료 |
| | `POST /api/invite/cancel` | 초대 취소 |
| | `GET /api/invite/status` | 초대 상태 조회 |
| | `GET /api/invites/pending` | 대기 중 초대 목록 |
| **연결** | `POST /api/connect/link` | 리포트 연결 링크 |
| | `POST /api/connect/pending` | 연결 대기 |
| | `POST /api/connect/respond` | 연결 응답 |
| | `POST /api/connect/complete` | 연결 완료 |
| | `POST /api/connect/resolve` | 연결 해제 |
| | `POST /api/connect/reset` | 연결 리셋 |
| **계정·결제** | `PATCH /api/account/display-name` | 이름 변경 |
| | `DELETE /api/account/delete` | 회원 탈퇴 |
| | `POST /api/account/merge` | 게스트-계정 병합 |
| | `POST /api/beta/checkout/complete` | 결제 완료 처리 |
| | `POST /api/report/session-status` | 결제 세션 상태 |
| **진단·관리**| `GET /api/diag/supabase-connection` | DB 연결 진단 |
| | `POST /api/admin/rate-limit-reset` | 어드민 레이트리밋 리셋 |
| | `POST /api/llm` | 원시 LLM 호출 테스트 라우트 |

---

## 3. 데이터 저장소 및 세션 처리 SSOT

| 저장소 | 키 패턴 | 데이터 설명 |
|--------|---------|-------------|
| `sessionStorage` | `ahaitsme_v2_survey_*` | v2 10문항 설문 일시 응답 |
| `sessionStorage` | `ahaitsme_v2_birth_*` | 출생일시 및 출생지역 정보 |
| `sessionStorage` | `ahaitsme_v2_lite_*` | Lite 리포트 클라이언트 캐시 |
| `localStorage` | `reportId` | 최근 활성 리포트 ID (클라이언트 힌트용) |
| `localStorage` | `ahaitsme_decision_entries` | 의사결정 저널 (서버 미저장) |
| Supabase DB | `reports` 테이블 | 유저 온보딩/출생/사주 팔자 핵심 행 |
| Supabase DB | `relationship_reports` 테이블 | 관계 세션 및 7-Scene 분석 저장 |

---

## 4. 정리 및 폐기 (Cleaned Up & Deprecated)

1. **레거시 18문항 라우트 (`app/survey`)**: `app/` 라우트에서 완전 삭제됨.
2. **구버전 v2 deep (`lib/v2/deep`)**: 폐기 완료 (`decisions/003`에 따라 `lib/v1/slim`으로 전면 통합).
3. **일회성 디버그 스크립트**: `scratch/` 디렉토리는 일회성 검증 전용이며 프로덕션 번들에 절대 포함되지 않음.
