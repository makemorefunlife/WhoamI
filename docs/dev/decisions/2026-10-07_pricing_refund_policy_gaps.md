# 2026-10-07 요금제·환불 정책 문구 개정 — 코드 불일치 목록

요금제(/pricing, /kr/pricing)와 환불 정책(/refund, /kr/refund) 문구를 2026-10-07 개정안으로 교체했다.
아래는 **새 문구와 현재 결제·크레딧 코드가 다르게 동작하는 부분**이다. 이 항목들이 해결되기 전까지는
"정책 반영 완료"로 보지 않는다. 모든 수정은 forward-only — 기존 구매자의 lot/쿠폰/멤버십은 소급 변경하지 않는다.

## 일치 확인됨

| 항목 | 근거 |
|---|---|
| KR·US Personal / Relationship 단건: 구매일 +1년 만료 | `20260926090000_single_purchase_and_triple_one_year_expiry.sql` (단, **Production 적용 여부 확인 필요** — 파일 주석상 수동 apply 대상) |
| KR Relationship Triple: 구매일 +1년, 3회 | 같은 migration |
| 30-Day Pass: 크레딧 2개 + Journal 모두 구매 시점 +30일 | `process_*_purchase` pass 분기, `lib/entitlements/decisionJournalAccess.ts` |
| 멤버십 월 2회 Relationship, 이월 없음 | `ensure_monthly_relationship_grant` (lot 만료 = 해당 월 cycle 끝) |
| 멤버십 기간 12개월 | `add_calendar_months_clamped(now, 12)` |

## 불일치 (코드 변경 필요)

1. **12-Month Membership이 실제로는 자동 갱신 구독**
   - `US_PLANS.us_annual_membership.billingType = "recurring_annual"`, Paddle recurring price 사용, `process_us_annual_renewal`이 갱신 처리.
   - 필요: 결제사에 일회성 $280 가격 생성 → `priceId`/`billingType` 교체, 신규 구매 시 `paddle_subscription_id` 없이 멤버십 생성, 갱신 경로는 기존 구독자 전용으로 유지.
   - 영향: 신규 구매만. 기존 구독자는 기존 조건(자동 갱신)을 유지하고 별도 안내 필요. 결제사 전환(Lemon Squeezy) 시점과 함께 처리하는 것이 효율적.
2. **멤버십 조기 해지 = 일할 환불 + 즉시 종료**로 바뀌었지만 코드는 "기간 말 해지, 부분 환불 없음"
   - `app/api/account/membership/cancel/route.ts` (effective_from next_billing_period), `/account/billing` 화면 문구(`billingCancelConfirmBody`, `billingRenewsOnNotice` 등).
   - 정책상 해지는 이메일 요청 → 운영자가 처리. 필요: 운영자용 즉시 해지 함수(멤버십 status 종료 + 남은 멤버십 lot 회수 + 미사용 쿠폰 revoke + 쿠폰으로 받은 미사용 크레딧 회수), 일할 환불액 계산(달력일 기준, 센트 반올림), 부분 환불 webhook 처리(현재 partial refund는 `partial_refund_needs_manual_review` 로그만 남김).
   - 계정 결제 화면 문구는 실제 동작(자동 갱신)과 맞추기 위해 **이번에 바꾸지 않음** — 1번 해결 시 함께 교체.
3. **멤버십 Personal 1회 크레딧이 만료 없음** (`term_personal_credit`, expires_at null)
   - 정책: "멤버십 혜택은 12개월". 필요: 신규 멤버십부터 `expires_at = current_term_end`.
4. **선물 쿠폰**
   - 쿠폰 자체에 만료 없음, 멤버십 상태와 무관하게 redeem 가능, redeem 시 받는 Personal 크레딧도 만료 없음 (`redeem_gift_personal_coupon`).
   - 정책: 멤버십 만료 전에 redeem **및 생성까지** 완료해야 함, 해지 시 미사용 쿠폰·redeem 후 미사용 크레딧 취소.
   - 필요: redeem 시 연결 멤버십의 `current_term_end`(및 status)를 확인, 생성되는 lot의 `expires_at`을 그 날짜로, 해지 함수에서 해당 lot 회수 (`gift_personal_coupons.redeemed_lot_id`로 추적 가능).
5. **Additional Relationship($9.99)이 만료 없음** (`grant_credit_lot(..., null)`)
   - 정책: 구매일 +12개월. 필요: 신규 구매부터 `v_now + interval '1 year'`.

## 문구만 정리한 항목

- 고객 문의 이메일: 환불 정책은 지시받은 대로 support@ahaitsme.com. 사이트 전반에 contact@ / support@가 섞여 있음 — 통일 여부 결정 필요.
- 한글 상호(푸터 "Aha Its me" vs 개인정보처리방침 "아하잇츠미 (Aha It's me)")와 푸터 전화번호(+1 626-381-8420)는 사업자등록증과 대조하지 못해 수정하지 않음.
