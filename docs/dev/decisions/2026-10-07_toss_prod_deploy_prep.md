# 2026-10-07 토스 심사용 운영 배포 준비 (확인·준비만)

이 문서는 **준비 단계** 기록이다. 운영 DB 변경, main 병합, 배포, 라이브 키 전환은 하지 않았다.
진행 순서: ① 운영 DB 점검 → ② 운영 DB 적용 → ③ main 병합 → ④ 배포 → ⑤ 공개 사이트 검증.

## 1. 브랜치 상태 (pay/toss-kr-test)

- 기준: `main` = `origin/main` = `6f1a385`. 이 브랜치는 그 위에 커밋 7개라 main에 **충돌 없이 fast-forward** 가능.

| 커밋 | 내용 |
|---|---|
| baa9b60 | 요금·환불 문구, 유효기간, 12개월 멤버십 표기, KR 주소 |
| 81b35a9 | 12개월 멤버십 1회 결제(Toss), 만료 연동, 운영자 환불 |
| 858be23 | KR 4개 상품 토스 결제창 + 비회원 결제(인증 이메일로 수령) |
| 4c5910d | 이용약관 5조: 일회성 결제·자동 갱신 없음 |
| 8d024c4 | 결제 UI 토스 단일화, Paddle 결제 연결 해제, 미국 구매 비활성 |
| 405563f | (대표 커밋) 사업장 주소 한/영 표준화 |
| 15ff4f6 | 비회원/로그인 결제 선택, 비회원 결제 팝업·안내문 |

- 포함 파일 59개는 모두 결제·법무 문구·i18n·migration·테스트·문서, 그리고 `next.config.ts`(CSP Report-Only에 토스 도메인 추가)와 `package.json`(테스트 스크립트 1줄)이다.
- 작업 폴더의 **관계없는 로컬 수정 63건**(홈/관계 화면, 스크린샷 삭제 등)은 커밋에 들어가지 않았다.
- `origin/pay/toss-kr-test`는 아직 `405563f`이다. `15ff4f6`과 이번 준비 커밋은 대표가 직접 push해야 한다(이 세션에는 GitHub 인증이 없다).

## 2. 환경

- 로컬 `.env.local`은 **DEV 유지**: Supabase ref `alcknxpemdjytwvnschq`, 토스 `test_ck_`/`test_sk_`, Clerk `pk_test_`/`sk_test_`. 변경하지 않았다.
- PROD Supabase ref: **`gncjslondpvysjaytagd`** (`app/api/diag/supabase-connection/route.ts`의 기대값, 2026-09-26 PROD 적용 스크립트 머리말과 일치).

## 3. 운영 DB 점검 (읽기 전용)

파일: `supabase/PROD_CHECK_PAYMENT_STATE_SAFE.sql`

- 쓰기 문장이 없고 테이블을 직접 참조하지 않는다. 없는 테이블은 `not present`/`missing`으로 보고되고 오류가 나지 않는다.
- 로컬 Postgres 16에서 3가지 상태로 `begin read only` 트랜잭션 안에서 실행해 확인했다: 빈 DB, 9월 초 기본 엔진만 있는 DB(기존 잔액 2건), 전체 적용 DB.
- 결과 구역:
  - `1 migration`: 파일별 applied / PARTIAL / missing
  - `2 data`: 테이블별 행 수
  - `3 risk`: lot 없는 잔액
  - `4 balance`: 기존 이용권 잔액
  - `5 purchases`: 기존 구매·멤버십·주문
  - `9 env`: DB 정보
- 실행 위치: Supabase 대시보드 → URL에 `gncjslondpvysjaytagd`가 있는 **운영 프로젝트** → SQL Editor. 결과를 CSV로 내려받아 공유한다.

## 4. PROD migration 계획 (DEV 스크립트 재사용 금지)

DEV 번들(`_backup/dev-db/DEV_APPLY_FULL_PAYMENT_MIGRATIONS.sql`)은 DEV 상태를 전제한 가드가 있어 **운영에 그대로 쓰지 않는다**.
운영용 스크립트는 점검 결과를 받은 뒤 **실제로 빠진 파일만** 골라 만든다.

후보 (파일명 순서 그대로):

1. 20260922040000_credit_lots
2. 20260922040100_credit_engine_lot_functions
   - 이어서 **기존 잔액 이관**: lot이 없는 `credit_accounts.balance`만큼 lot을 1개 만든다(`source='admin'`, `expires_at=NULL`). 기존 구매자에게 소급 만료가 생기지 않고, 잔액 숫자와 원장은 바뀌지 않으며, 다시 실행해도 중복이 생기지 않는다.
3. 20260922040200_us_memberships
4. 20260922040300_us_membership_functions
5. 20260922050000_kr_purchase_grants
6. 20260922060000_kr_purchase_grants_provider_agnostic
7. 20260922070000_account_deletion_entitlement_cleanup
8. 20260922080000_paddle_webhooks_and_cancellation
9. 20260923000000_paddle_webhook_idempotency_and_ordering
10. 20260923010000_paddle_adjustment_idempotency
11. 20260926080000_fix_grant_credit_lot_ambiguous_balance
12. 20260926090000_single_purchase_and_triple_one_year_expiry (새 구매부터 1년, 기존 lot 불변)
13. 20260928000000_redeem_code_system
14. 20260928120000_payment_manual_reviews
15. 20261007120000_one_time_membership_toss_and_refunds (기존 멤버십은 `billing_model='paddle_recurring'`로 그대로 유지)
16. 20261007130000_toss_guest_checkout
17. (승인 시) 테스트 결제 구분 migration — 아래 5-3 참고

기존 데이터 보존 원칙:

- 테이블 DROP·TRUNCATE·데이터 DELETE가 없다. 컬럼 추가는 기본값으로 기존 행을 보존한다.
- 적용 직전에 Supabase 백업 시점을 확인하고, 잔액·구매 테이블 스냅샷 사본을 만든다(적용 스크립트 첫 부분에 포함).
- 한 트랜잭션으로 실행한다. 진행 중인 예약(`credit_reservations`)이 있으면 멈춘다. 점검 결과와 다른 상태면 멈춘다(가드).
- 적용 직후 같은 점검 SQL을 다시 실행해, `3 risk`가 0이고 `4 balance` 합계가 적용 전과 같은지 확인한다.

## 5. Vercel 운영 환경

### 5-1. 필요한 값 (키 값은 문서에 쓰지 않음)

| 변수 | 운영 값 | 비고 |
|---|---|---|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 **테스트** 클라이언트 키 (`test_ck_`로 시작) | 빌드 시 박히므로 배포 전에 설정 |
| `TOSS_SECRET_KEY` | 토스 **테스트** 시크릿 키 (`test_sk_`로 시작) | 서버 전용, Sensitive로 등록 |
| `NEXT_PUBLIC_US_CHECKOUT_ENABLED` | 설정하지 않음 (또는 `false`) | 미국 구매 비활성 유지 |
| `TOSS_USD_PAYMENT_METHOD` | 설정하지 않음 | USD 계약 전에는 없어야 함 |
| `PADDLE_CHECKOUT_ENABLED` | 설정하지 않음 | Paddle 결제 경로 410 유지 (webhook은 이력용으로 유지) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` (또는 `KV_REST_API_*`) | 있어야 함 | 없으면 운영에서 비회원 주문이 503 |
| `OPERATOR_CLERK_USER_IDS`, `OPERATOR_API_SECRET` | 운영자 환불 API용 | 환불 처리 시 필요 |
| `RATE_LIMIT_ALLOW_MEMORY`, `RATE_LIMIT_DEV_UNLIMITED` | 운영에 넣지 않음 | 운영에서는 코드가 무시하지만 혼동 방지 |
| Supabase / Clerk | 운영 ref `gncjslondpvysjaytagd`, Clerk live 키 | 기존 그대로 |

### 5-2. 미국 구매

`NEXT_PUBLIC_US_CHECKOUT_ENABLED`가 없으면 화면은 "결제 준비 중"을 보여 준다. 서버도 USD 주문을 503(`currency_not_enabled`)으로 거부한다. 이중으로 막혀 있다.

### 5-3. 테스트 결제 안전성 — **현재 막혀 있지 않음 (배포 전 해결 필요)**

1. **테스트 결제와 실구매를 DB에서 구분할 수 없다.**
   - 문제: `toss_payment_orders`나 지급 기록에 테스트 여부를 담는 칸이 없다.
   - 지금 가능한 구분: 토스 대시보드(테스트/라이브 분리)와 라이브 전환 시각뿐이다.
2. **공개 사이트에서 테스트 결제로 유료 분석을 무제한 받을 수 있다.**
   - 문제: 토스 테스트 결제는 실제 청구 없이 승인된다. 그런데 승인되면 실제 생성권이 지급된다.
   - 범위: 로그인 사용자는 주문 횟수 제한도 없다. 비회원은 IP당 시간당 20회 제한이 있다.
   - 영향: 누구나 반복해서 무료로 유료 분석(OpenAI 비용 발생)을 받을 수 있다.

권장 해결 (승인 후 구현):

- 주문 생성 시 시크릿 키가 `test_sk_`이면 주문에 `is_test=true`를 기록한다. migration 1개로 컬럼을 추가한다.
- 테스트 주문이 승인되면, 운영자 허용 목록(`TOSS_TEST_GRANT_ALLOWLIST`, Clerk user ID)에 없는 구매자에게는 이용권을 지급하지 않는다.
  - 결제는 즉시 자동 취소한다. 이미 있는 "이미 멤버면 자동 취소" 경로와 같은 방식이다.
  - 완료 화면에는 "테스트 결제가 정상 처리됐어요. 테스트 결제에는 이용권이 지급되지 않아요"라고 안내한다.
- 토스 심사 담당자는 상품 → 결제창 → 승인 → 완료 화면까지 전 과정을 확인할 수 있다. 무료 분석은 생기지 않는다.
- 라이브 키로 바꾸면 `is_test=false`가 되어 자동으로 정상 지급된다. 테스트 시기 기록은 `is_test`로 구분된다.

## 6. 심사 전 대표 확인 필요 (추정 금지 항목)

- 통신판매업 신고번호가 비어 있다. 그래서 푸터에 그 줄이 표시되지 않는다. 신고번호(또는 면제 사유)를 확인해야 한다.
- 전화번호가 미국 번호이고 "전화 상담 미제공"이다. 토스 심사 기준에 맞는지 확인해야 한다.
- 비회원 이메일 수집 항목을 개인정보처리방침에 반영해야 한다. 미수령 비회원 주문의 처리 정책도 정해야 한다(이전 보고의 미결 항목).
