# 2026-10-07 12개월 멤버십 일회성 결제(토스) · 만료 · 운영자 환불

확정 방향(Sera): 한국·미국 모든 상품은 일회성 결제. 미국 회원권은 $280 1회 결제 → 12개월 이용, 자동 갱신 없음.

## 무엇이 바뀌었나 (코드)

| 영역 | 변경 |
|---|---|
| 구매 경로 | `us_annual_membership`은 Toss 결제창으로만 판매 (`lib/payment/tossCatalog.ts`). Paddle 가격 id 제거 → Paddle checkout/webhook이 회원권과 매칭될 수 없음. `process_us_purchase`도 신규 회원권 생성을 거부(`membership_paddle_path_retired`). |
| Toss 흐름 | `POST /api/payments/toss/orders`(서버가 금액·통화·orderId 고정) → Toss 결제창 → `/checkout/toss/success` → `POST /api/payments/toss/confirm`(소유자·금액 검증, 결제 전 회원 여부 재확인, Idempotency-Key `confirm-<orderId>`, 지급은 주문 단위 멱등). |
| 신규 회원권 | `memberships.billing_model = 'one_time_12m'`, 구독 id 없음, 결제액 기록. Personal 크레딧·선물 쿠폰 2매·쿠폰으로 받은 크레딧 모두 **회원권 종료일**에 만료. |
| $9.99 추가 Relationship | 구매일 + 12개월 (기존 영구). |
| 기존 구매자 | 기존 행은 전부 `paddle_recurring`으로 분류되어 **기존 조건 그대로**(갱신, 기간 말 해지, 쿠폰 규칙, Paddle 전액환불 회수). 기존 credit_lots/쿠폰 행은 수정하지 않음. |
| 운영자 환불 | `GET/POST /api/admin/membership-refunds`, `POST /api/admin/membership-refunds/<id>/retry`. 접수일 기준 남은 일수 비례(UTC 달력일, 센트 반올림) 또는 7일 내·미사용 전액. Toss 취소 성공 확인 후에만 혜택 종료(미사용 회원권 크레딧·쿠폰·쿠폰으로 받은 미사용 크레딧). 생성된 보고서·별도 구매 분석권 유지. 실패 시 아무것도 변경되지 않고 같은 Idempotency-Key로 재시도. |
| 계정 결제 화면 | 일회성 회원권: "12개월 멤버십 · $280 1회 결제 · <종료일>까지, 자동 갱신 없음" + 환불 정책 안내, 해지 버튼 없음. 기존 자동 갱신 구매자: 기존 화면(갱신일·해지) 그대로 + 안내 한 줄. |

## 외부 설정 (코드 밖)

| 항목 | 값/작업 |
|---|---|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | Toss **API 개별 연동 키**의 클라이언트 키 (`test_ck_…` / 운영 `live_ck_…`). 결제위젯 키(`gck`) 아님. |
| `TOSS_SECRET_KEY` | 같은 쌍의 시크릿 키 (`test_sk_…` / `live_sk_…`). 서버 전용. |
| `TOSS_US_PAYMENT_METHOD` | `CARD`(기본) 또는 `FOREIGN_EASY_PAY`(PayPal). **USD 카드 결제는 Toss 해외결제(달러) 계약이 필요** — 계약이 없으면 USD는 PayPal(해외간편결제)만 가능. 원화로 받을지(가격 정책 변경)도 함께 결정 필요. |
| `OPERATOR_CLERK_USER_IDS` | 환불 API를 쓸 운영자 Clerk user id (쉼표 구분). |
| `OPERATOR_API_SECRET` | 24자 이상 임의 문자열. 요청 헤더 `x-operator-secret`. |
| Toss 상점 | 결제수단(해외카드/PayPal) 활성화, 부분취소 허용 여부 확인(USD 부분취소 포함), 운영 전환 시 live 키. |
| DB | 아래 순서로 적용. |

## 적용 순서 (운영 반영 시)

1. `supabase/CHECK_PAYMENT_MIGRATIONS_PROD.sql`을 운영 SQL Editor에서 실행(읽기 전용)해 현재 상태 확인.
2. `20260926090000`(단건·Triple 1년 만료)이 미적용이면 먼저 적용 — `20261007120000`은 `process_kr_purchase`를 다시 정의하지 않음.
3. `20261007120000_one_time_membership_toss_and_refunds.sql` 적용 (트랜잭션 안에서, dev → prod).
4. 그다음 코드 배포. **반대 순서면** 결제 화면/선물 목록이 새 컬럼(`billing_model`, `expires_at`)을 못 찾아 오류가 남.

## 검증

- `npm run test:credit-lifecycle-sql` (로컬 Postgres): 기존 + 신규 SQL 단언 48개.
- `npm run test:toss-membership-flow` (로컬 Postgres + 가짜 Toss): 위변조·카드 거절·타임아웃 재시도·이미 회원·경합 자동취소·금액 불일치·환불 실패/재시도/중복 9개 시나리오.
- 실제 Toss 샌드박스 결제창·승인·취소 호출은 미검증(이 환경에서 Toss/Supabase 네트워크 차단).

## 남은 작업

- 비회원(로그인 없이) 결제: 미구현. 모든 구매는 Clerk 로그인 필요(권한을 계정에 붙이는 구조). 필요하면 주문-계정 연결(결제 후 가입/이메일 매칭) 설계가 선행돼야 함.
- 단건·패스·Triple(미국·한국)은 아직 기존 결제 경로. `process_toss_order`는 us_*/kr_* 전부 지원하므로 `TOSS_PLANS`에 추가 + 가격 확정만 하면 전환 가능.
- 비례 환불의 Decision Journal 사용 여부는 자동 감지하지 않음(크레딧 사용·쿠폰 사용만 감지). 7일 내 전액환불 전에 운영자가 확인.
- Toss 웹훅 미연동. 결제창 인증 후 우리 서버가 confirm하지 않은 결제는 청구되지 않으므로 금전 위험은 없음. 다만 confirm 후 지급 전에 이탈한 `paid` 행, 자동취소 실패로 `payment_manual_reviews`에 남은 건은 운영자가 확인(같은 orderId/paymentKey로 confirm API 재호출 시 지급 재시도).
