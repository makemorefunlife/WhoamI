# Paddle retirement (2026-09-29)

Paddle's merchant application was rejected. Until the replacement provider
(Lemon Squeezy) is approved and integrated, **there is no active checkout
provider** — `ACTIVE_CHECKOUT_PROVIDER = null` in
`lib/payment/checkoutAvailability.ts` (a code constant, not an env flag).

Regression suite: `npm run test:paddle-retirement`
(`tests/unit/paddle-retirement.test.ts`).

## What users see now

- `/pricing`, and every Purchase Selector modal (Personal deep analysis,
  Relationship deep analysis, Account → Billing, Decision Journal): the
  catalog and prices are still shown, a localized
  "Purchasing is temporarily unavailable" / "현재 구매가 일시적으로 중단되었어요"
  banner is shown, and every buy button is disabled
  ("Temporarily unavailable" / "일시적으로 구매 불가"). No checkout opens.
- Gift/tester redeem codes (`/api/redeem`) still work.
- Existing credits, memberships and saved reports are unchanged.
- FAQ, Privacy, Refund and Terms pages no longer name Paddle (provider-neutral
  "third-party payment processor / Merchant of Record" wording; `lastUpdated`
  bumped to 2026-09-29). **Have legal review this wording, and name Lemon
  Squeezy in Privacy §3/§5/§6, Refund §3/§4 and Terms §5 once it is live.**

## Classification of every Paddle reference

### 1. USER-FACING / ACTIVE (was live → now disabled or neutralized)

| Item | Status |
|---|---|
| `components/payment/PurchaseSelectorContent.tsx` (used by `PurchaseSelectorModal`/`PurchaseSelectorPage` → `/pricing`, essence/deep, `StitchPremiumCard`, `RelationshipView`, account billing, Decision Journal) | Switched from `useRegionalCheckout` (Paddle.js) to provider-agnostic `usePurchaseCheckout`; unavailable banner + disabled CTAs; Paddle MoR footer removed |
| `app/pricing/page.tsx` "Paddle Sandbox test mode" notice | Replaced with purchase-unavailable notice |
| i18n `paymentRefund.paddleNotice`, `pricing.regionalSandboxNotice` (EN/KR) | Removed |
| i18n FAQ "charged during Beta?" / "data collected… Paddle" (EN/KR) | Rewritten provider-neutral |
| i18n `betaSandboxSuccess/Error` values ("Sandbox checkout…") | Neutral wording (keys kept) |
| `lib/legal/privacyPolicy.ts`, `refundPolicy.ts`, `termsOfService.ts` (EN/KR) | Paddle names, `PADDLE.NET*` descriptor and Paddle vendor/transfer rows removed |
| `next.config.ts` CSP (report-only) allowlisting `js/cdn.paddle.com`, `(sandbox-)buy/checkout.paddle.com` | Removed |
| `app/api/pricing/checkout/prepare` | Returns 503 `purchase_unavailable` (localized) before any work |

### 2. PADDLE-SPECIFIC BACKEND (kept dormant)

| File | State | Delete after Lemon Squeezy is live? |
|---|---|---|
| `lib/payment/useRegionalCheckout.ts` | Dormant; not imported by any page; guard returns `"unavailable"` before loading Paddle.js | Yes |
| `lib/payment/useBetaCheckout.ts` | Dormant; same guard | Yes |
| `components/payment/CheckoutWithRefundConsent.tsx`, `components/pricing/PricingCards.tsx`, `components/pricing/RegionalPricingCards.tsx` | Dormant (unreferenced UI) | Yes |
| `lib/payment/betaPaddlePricing.ts` | Beta Paddle price ids; used by dormant Beta flow + `grantBetaPurchase` | Yes (keep `grantBetaPurchase` history semantics in mind) |
| `app/api/beta/checkout/complete/route.ts` | Returns 503 before auth/Paddle API/grant | Yes |
| `app/api/pricing/checkout/complete/route.ts` | Returns 503 before auth/Paddle API/grant | Yes (replace with LS order verification) |
| `app/api/webhooks/paddle/route.ts` | Signature-verified; **new-purchase grants blocked**; renewal / cancel / refund events for existing memberships still processed | Only after every existing `paddle_subscription_id` membership has ended or been migrated |
| `lib/payment/paddleSandboxClient.ts` | Still used server-side by membership cancel + account deletion for existing Paddle-sandbox subscriptions | Same as webhook |
| `lib/payment/paddleWebhookVerify.ts`, `paddleWebhookState.ts`, `paddleAdjustmentClaim.ts` | Used by the webhook | Same as webhook |
| `lib/payment/paddleQuantityGuard.ts` | Paddle `items[].quantity` parsing (+ provider-agnostic `flagPaymentForManualReview`) | Keep `flagPaymentForManualReview`; drop Paddle parsing |
| `app/api/account/membership/cancel/route.ts`, `app/api/account/delete/route.ts` | Unchanged: cancel existing Paddle-sandbox subscriptions | Rework to be provider-aware when LS memberships exist |
| `usPricing.ts` / `krPricing.ts` `priceId` + `paddleNickname` | Catalog kept (names, prices, grant quantities are reused) | Replace price ids with LS variant ids; drop `paddleNickname` |
| Env: `NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN` | No longer read by any live page | Can be removed from Vercel now |
| Env: `PADDLE_SANDBOX_API_SECRET_KEY`, `PADDLE_SANDBOX_WEBHOOK_SECRET` | **Keep for now** — account deletion refuses (502) for a member with an active Paddle subscription if the cancel call fails | Remove after existing memberships are handled |
| Tests: `paddle-webhook-idempotency`, `paddle-adjustment-idempotency`, `relationship-entry-and-paddle-quantity`, `checkout-success-redirect`, `beta-pricing-catalog`, `grant-beta-purchase`, `tests/scripts/verify-regional-purchase-e2e.mjs` | Kept (still describe dormant code) | Delete/replace with the Paddle code |
| Docs: `Legal/*.md` drafts, `docs/legal/AHA_LEGAL_REVIEW_PACKET_DRAFT.md`, `docs/payments/paddle-quantity-manual-review.md`, `docs/v2/PRD/*` | Not served to users; kept as history | Update when LS legal text is final |

### 3. PROVIDER-AGNOSTIC PAYMENT/CREDIT INFRASTRUCTURE (untouched, reuse for Lemon Squeezy)

- Credit engine: `lib/credits/creditEngine.ts` (`reserve/consume/release/grant_credit`, `credit_lots`, `credit_ledger`, `credit_accounts`, `credit_reservations`), `lib/credits/analysisEntryGate.ts`.
- Entitlements: `/api/account/entitlements`, memberships + `membership_term_grants` / `membership_monthly_grants`, `additional_relationship_eligible`.
- Grant functions: `process_us_purchase`, `process_kr_purchase` (already provider-agnostic: `payment_provider` + `provider_transaction_id`, see `20260922060000_kr_purchase_grants_provider_agnostic.sql`), `process_us_annual_renewal`, `revoke_remaining_credit_for_grant`; TS wrappers `grantUsPurchase`, `grantKrPurchase`.
- `payment_manual_reviews` + `flagPaymentForManualReview` (keyed on `provider, provider_transaction_id`).
- `resolveRegionalPlan` and the US/KR plan catalogs (plan ids, prices, grant quantities, eligibility).
- Purchase Selector UI + `usePurchaseCheckout` outcome contract; `/thank-you`; redeem codes.
- History tables (all kept, nothing dropped or rewritten): `beta_purchase_grants`, `us_purchase_grants`, `kr_purchase_grants`, `memberships`, `paddle_webhook_events`, `processed_paddle_adjustments`, `payment_manual_reviews`. Columns such as `paddle_transaction_id` / `paddle_subscription_id` / `paddle_price_id` stay as historical metadata.

## What Lemon Squeezy should replace

1. Set `ACTIVE_CHECKOUT_PROVIDER = "lemonsqueezy"` and implement its checkout inside `usePurchaseCheckout` (same outcome contract).
2. New `/api/pricing/checkout/*` completion that verifies the LS order server-side, then calls the existing `grantUsPurchase` / `grantKrPurchase`. For US tables that only have `paddle_*` columns, add a provider-agnostic migration (mirroring the KR one) instead of reusing `paddle_*` columns.
3. New signature-verified LS webhook (can reuse the `claim_*_webhook_event` idempotency pattern).
4. LS variant ids in `usPricing.ts` / `krPricing.ts`; CSP entries for LS checkout hosts.
5. Provider-aware membership cancel + account deletion.
6. Legal pages: name Lemon Squeezy as Merchant of Record.
