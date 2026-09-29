# Payment provider transition (2026-09-29)

Paddle's merchant application was rejected. Until the replacement provider
(Lemon Squeezy) is approved:

- **Public website:** no page names the provider. "Paddle", "Paddle.com",
  "PADDLE.NET" and "Sandbox" do not appear in any EN/KR UI copy or in
  Privacy / Refund / Terms, which use neutral "third-party payment service
  provider" wording. Refund steps point to support@ahaitsme.com and the
  support information in the payment receipt.
- **Checkout is QA-only.** The existing Paddle **Sandbox** checkout is wired
  end-to-end exactly as before (purchase selector -> Paddle Sandbox checkout ->
  `/api/pricing/checkout/complete` -> webhook backstop -> credit grant ->
  analysis), but only for users listed in the server env var
  `CHECKOUT_QA_USER_IDS` (`lib/payment/checkoutAvailability.ts`):
  - comma-separated Clerk user ids -> only those users
  - `*` -> every signed-in user (the pre-transition public sandbox beta)
  - unset / empty -> nobody (safe default)
- Everyone else sees the localized "Purchasing is temporarily unavailable"
  banner and disabled buy buttons. Redeem codes still work. Existing
  credits, memberships, reports and history are untouched.

Regression suite: `npm run test:paddle-retirement`.

## Where the QA gate is enforced

| Place | Behavior for a non-QA user |
|---|---|
| `GET /api/pricing/checkout/availability` | `{ available: false }` (UI hint only) |
| `PurchaseSelectorContent` (via `usePurchaseCheckout`) | banner + disabled CTAs |
| `POST /api/pricing/checkout/prepare` | 503 `purchase_unavailable` -> the hook returns `"unavailable"` before Paddle.js loads |
| `POST /api/pricing/checkout/complete`, `/api/beta/checkout/complete` | 503 before any Paddle API / DB / grant |
| Paddle webhook `transaction.completed` (new purchase) | logged and skipped, no grant |
| Paddle webhook renewals / cancel / refund | **not gated** (existing memberships) |

## Required Vercel env (Production)

- `CHECKOUT_QA_USER_IDS` — QA Clerk user ids (new).
- `NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN`, `PADDLE_SANDBOX_API_SECRET_KEY`,
  `PADDLE_SANDBOX_WEBHOOK_SECRET` — keep; the sandbox flow, membership cancel
  and account deletion depend on them.

## Paddle-specific code (keep until Lemon Squeezy is live, then delete/replace)

- `lib/payment/useRegionalCheckout.ts`, `useBetaCheckout.ts` (Paddle.js sandbox)
- `app/api/pricing/checkout/complete`, `app/api/beta/checkout/complete`
- `app/api/webhooks/paddle/route.ts`, `lib/payment/paddleSandboxClient.ts`,
  `paddleWebhookVerify.ts`, `paddleWebhookState.ts`, `paddleAdjustmentClaim.ts`,
  `paddleQuantityGuard.ts` (keep `flagPaymentForManualReview`)
- `lib/payment/betaPaddlePricing.ts`; price ids / `paddleNickname` in
  `usPricing.ts` / `krPricing.ts`
- Unreferenced legacy UI: `components/payment/CheckoutWithRefundConsent.tsx`,
  `components/pricing/PricingCards.tsx`, `components/pricing/RegionalPricingCards.tsx`
- CSP entries for `*.paddle.com` in `next.config.ts` (response header only)

## Provider-agnostic (reuse for Lemon Squeezy)

Credit engine (`credit_lots` / ledger / reservations), entitlements,
`analysisEntryGate`, `process_us_purchase` / `process_kr_purchase` /
renewal functions and their TS wrappers, `payment_manual_reviews`,
`resolveRegionalPlan` + plan catalogs, Purchase Selector UI,
`usePurchaseCheckout` + `checkoutAvailability`, `/thank-you`, redeem codes.
History tables and all migrations are kept.

## When Lemon Squeezy is approved

1. Implement its checkout behind `usePurchaseCheckout` (same outcome contract).
2. New verified completion route + webhook calling the existing grant functions.
3. LS variant ids in the catalogs; CSP for LS hosts.
4. Provider-aware membership cancel / account deletion.
5. Name the provider in Privacy §5/§6, Refund §3/§4, Terms §5 if desired.
6. Open checkout to everyone (`CHECKOUT_QA_USER_IDS=*` or remove the gate).
