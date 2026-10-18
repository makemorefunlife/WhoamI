# 2026-10-17 기본 주소가 초대 정보 입력 화면으로 가던 문제

상태: **코드 수정 완료, 브라우저 & DEV DB 검증 완료.** 커밋 준비 완료.

## 원인 (확인됨)
- 초대·개인 연결 링크에서 시작을 누르면 토큰이 localStorage(`inviteToken` / `connectToken`)에 저장되고, 로그인 상태에서 연결이 끝나야만 지워진다.
- 홈(`app/homecontent.tsx`)은 이번 방문이 초대에서 왔는지 보지 않고 저장된 토큰만 보고 움직였다.
  - 로그아웃: `/invite-birth`로 이동.
  - 로그인: 예전 초대를 자동 연결, '분석 시작' 시에도 연결 후 `/invite-birth`.
- 쿠키·sessionStorage·middleware·언어 전환은 원인 아님. 카카오톡 전용 코드 없음(인앱 브라우저도 localStorage 유지 → 같은 증상, 미검증).

## 수정
- `lib/invite/inviteEntry.ts`: 홈은 URL에 `?token=` / `?connectToken=` / `?continue=invite`가 있을 때만 저장된 토큰을 사용. 기본 주소 `/`·`/kr`는 항상 홈.
- `app/homecontent.tsx`: 토큰을 읽는 5곳 모두 위 규칙을 거치게 함.
- `app/invite-birth/page.tsx`: 기존 회원 로그인 복귀와 홈으로 넘기는 2곳에 `?continue=invite`.
- 저장된 토큰은 지우지 않음(초대 링크를 다시 열면 이어짐).

## 검증 기록
| 항목 | 결과 | 방법 |
|---|---|---|
| 수정 전 재현: 로그아웃 + 예전 초대 토큰 → `/kr`가 `/kr/invite-birth`로, 예전 연결 토큰 → `/`가 `/invite-birth`로 | 재현됨 | 운영 사이트, 브라우저 패널(모바일 크기) |
| 판단 규칙·hand-off 경로 단위 테스트 `tests/unit/invite-entry.test.ts` | **통과 (4/4)** | `npx tsx tests/unit/invite-entry.test.ts` |
| 기존 테스트(guest-invite-flow, auth-return-path, friend-add-readiness) | **통과** | 자동 |
| 전체 빌드(`next build`), 수정 파일 lint·타입 | **통과** | `npm run build` (147 routes) |
| 로그아웃: 가짜 초대 링크 시작 → `/kr/invite-birth` 진입 → 같은 탭에서 `/kr`, `/` 직접 입력 → 둘 다 기본 홈 | **통과** | 2026-10-17 대표님 직접 확인, 로컬 개발 서버 |
| 로그아웃(시크릿 창): 실제 DEV 개인 연결 링크 → 시작 → `/kr/invite-birth` 진입 후 기본 홈 진입 확인 | **통과** | 2026-10-17 대표님 확인, 로컬 |
| 1. 이전 초대 토큰 남아 있어도 홈페이지에서 로그인 시 자동 연결 안 됨 | **통과** | Headless Chrome CDP 자동화: localStorage stale 토큰 세팅 후 Clerk 로그인 복귀 시 기본 홈 유지 (`URL=http://localhost:3000/`) |
| 2. 일반 '분석 시작' 눌러도 이전 초대 미연결 | **통과** | Headless Chrome CDP 자동화: 로그인 상태에서 CTA 클릭 시 일반 플로우(`/blueprint-preview`)로 정상 이동, `/invite-birth` 미진입 |
| 3. 유효한 초대 링크에서 명시적 수락 시 정상 연결 완료 | **통과** | Headless Chrome CDP + DEV Supabase: 실제 초대 생성 후 `/invite?token=...` 진입 → 시작하기 클릭 → `invites` status `'complete'` 변경 및 `accepted_report_id` 연결 완료 확인 |
| 4. 언어 전환(`/kr` <-> `/`)에서도 위 동작 일관성 유지 | **통과** | Headless Chrome CDP: 언어 전환 시 기본 홈 유지, `?continue=invite` hand-off 동작 완벽 일치 |
| 카카오톡 인앱 브라우저 | 미검증 | 배포 후 실기기 확인 예정 |

