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
| `TOSS_USD_PAYMENT_METHOD` | **기본값 없음 = 미국 회원권(USD) 결제 닫힘.** 계약으로 확인된 방식만 `CARD` 또는 `FOREIGN_EASY_PAY`로 설정. USD 카드 결제는 Toss 해외결제(달러) 계약 필요. 원화 전환이나 다른 결제수단으로의 자동 대체는 하지 않음. |
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
- 위 테스트는 모두 **모의(가짜 Toss) 테스트**. 실제 Toss 테스트 API(결제창·승인·취소) 호출은 미검증 — 작업 환경과 사용자 PC 셸 모두 api.tosspayments.com 접속이 차단됨.

## 남은 작업

- 미국 단건·30일 패스는 아직 기존 결제 경로(USD 계약 확인 후 `TOSS_PLANS`에 추가하면 전환).
- 비회원이 결제 후 끝내 계정 연결을 하지 않은 주문(`paid` + `clerk_user_id` 없음)의 처리 기준(보관 기간, 환불 안내)은 미정. 운영자가 `toss_payment_orders`에서 확인 후 Toss 취소로 처리.
- 비례 환불의 Decision Journal 사용 여부는 자동 감지하지 않음(크레딧 사용·쿠폰 사용만 감지). 7일 내 전액환불 전에 운영자가 확인.
- Toss 웹훅 미연동. 결제창 인증 후 우리 서버가 confirm하지 않은 결제는 청구되지 않으므로 금전 위험은 없음. 다만 confirm 후 지급 전에 이탈한 `paid` 행, 자동취소 실패로 `payment_manual_reviews`에 남은 건은 운영자가 확인(같은 orderId/paymentKey로 confirm API 재호출 시 지급 재시도).

## 추가 (같은 날, 토스 심사 보완)

### 한국 상품 → 토스 결제창 (KRW, 카드)
Personal 7,900원 · Relationship 14,900원 · 30일 패스 20,000원 · Relationship Triple 33,000원. 금액은 `KR_PLANS`에서 그대로 가져옴(`lib/payment/tossCatalog.ts`). 지급은 기존 `process_kr_purchase`(단건·Triple 12개월, 패스 30일), `kr_purchase_grants.payment_provider = 'toss'`. 기존 결제사 가격은 더 이상 매칭되지 않음(`krPlanHasPriceId` → false).

### 비회원 결제 (migration `20261007130000_toss_guest_checkout.sql`)
1. 로그인하지 않은 구매자: 이메일 + 필수 동의(약관·이메일 수집·청약철회 제한 고지) → `POST /api/payments/toss/orders`(IP 기준 시간당 20회 제한) → 토스 결제창(`customerKey = ANONYMOUS`).
2. `/checkout/toss/success?guest=1` → confirm: 결제 확정, 이용권은 아직 지급하지 않음(`awaiting_claim`), 마스킹된 이메일 안내.
3. `/checkout/toss/claim` → 로그인/가입(Clerk가 이메일 인증) → `POST /api/payments/toss/claim`: 계정의 **인증된 이메일**이 주문 이메일과 같을 때만 연결·지급. 다른 계정은 가져갈 수 없고, 중복 지급 없음. 계정 결제 화면에 들어올 때도 자동으로 연결 시도.
4. 이용 기한은 결제 시각 기준으로 다시 맞춤(나중에 연결해도 "구매일부터 12개월/30일" 유지).
5. 미국 회원권은 비회원 구매 불가(구매 전 기존 회원 여부를 확인해야 하므로).

### 테스트 (모의)
`npm run test:toss-membership-flow` 14개 시나리오 통과: 위 9개 + 가격표/USD 차단, 한국 Triple 회원 구매, 비회원 결제·탈취 방지·결제 시각 기준 기한·중복 방지, 비회원 카드 거절.
