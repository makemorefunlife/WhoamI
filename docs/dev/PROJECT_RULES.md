# PROJECT_RULES — WhoamI 개발 규정

> 사람과 AI가 같이 지키는 규칙. 바꿀 때는 `decisions/`에 이유를 남긴다.

---

## 1. 말하기 & 기록

- 사용자 대화·devlog: **한국어**
- 커밋 메시지·코드 주석: 팀 컨벤션 따름 (영문 OK)
- **하루 1 devlog**: `docs/dev/daily/YYYY-MM-DD.md` (15~30줄 목표)
- 큰 결정은 **같은 날** `docs/dev/decisions/NNN-제목.md` 추가

---

## 2. Status (Todo) 규칙

- `00_Status.md`가 **유일한 진행 SSOT**
- **NOW는 항상 1개** (여러 개면 하나만 남기고 NEXT로)
- 완료 시 `[x]`, 막힘은 🚧 한 줄
- 로드맵 체크박스는 **실제로 끝났을 때만** 체크

---

## 3. 코드 구역 (코어 / 실험 / 삭제 후보)

| 구역 | 경로 | 규칙 |
|------|------|------|
| **코어** | `app/`, `components/`, `lib/saju`, `lib/report`, `lib/prompts`, `lib/v1/slim`, `lib/v2/survey`, `lib/v2/onboarding`, `lib/v2/lite`, `lib/v2/blueprint`, `lib/v2/saju/calculateSajuBundle.ts` | 프로덕션. 리뷰·빌드 통과 필수 |
| **실험** | `sandbox/`, `tests/` | 언제든 지우거나 뜯어고쳐도 됨 |
| **삭제 후보** | `docs/v2`의 03B~03E deep 스펙, 레거시 18문항 경로 일부 | 새 기능 넣지 말 것. 참고만 |
| **문서** | `docs/dev/` | 트래킹 SSOT |

자세한 파일 맵: **`CORE_MAP.md`**

---

## 4. 테스트

- 자동화 프레임워크 없음 (당분간) → **`tests/`에 수동·스크립트**로 모음
- 프로덕션에 one-off 스크립트 넣지 않음
- API 스모크: `tests/scripts/*.mjs`
- curl/PowerShell: `tests/manual/*`
- 회귀 가이드: `tests/regression/`

---

## 5. 출생 정보 (기질·점성)

- **사주:** 시간 없음/모름 → `12:00`, `birth_time_unknown = true` / 있으면 `HH:MM`
- **점성:** 출생 **지역 필수** (없으면 차트 계산 안 함)
- 공통 헬퍼: `lib/v2/onboarding/resolveBirthChartInput.ts`

---

## 6. Slim V1 (본래의 나 심화)

- Blueprint `/innate/deep` = **Slim V1 통합 리포트**
- 입력: v2 설문 10문항 + 기질(신살) + 점성(지역·시간)
- **제외:** v2 deep 03B/C/D, 관계 맥락, 18문항 Y/N
- UI에 디버그 메타 노출 금지 (리포트 본문만)

---

## 7. Git

- 커밋은 **사용자가 요청할 때만**
- force push / amend는 사용자 규칙 따름
- devlog에 커밋 해시 적을 때만 `daily/`에 기록

## 7b. 프로덕션 배포

- 배포 전 **`docs/dev/DEPLOY_CHECKLIST.md`** — 특히 PersonCore `saju_master_v2` 마이그레이션 확인 (`verify-person-core-saju-schema-v2.mjs`)

---

## 8. AI 작업 원칙

1. 작업 전 `00_Status.md`·`CORE_MAP.md` 확인
2. 코어 수정은 **최소 diff**
3. 실험은 `sandbox/` 또는 `tests/` 먼저
4. 세션 끝에 "오늘 로그 남겨줘" 요청 시 `daily/` + `Status` 갱신
5. `docs/dev/` 밖 임의 마크다운 대량 생성 금지 (사용자 요청 시만)
