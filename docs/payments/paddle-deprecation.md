# Pre-launch payments: sandbox checkout, provider-neutral public copy (2026-09-29)

Paddle's live merchant application was rejected. Until the final live payment
provider is selected and integrated:

- **Checkout works for every user, exactly as before** — on the Paddle
  **Sandbox** (test) environment only, so no real commercial payment is
  taken. Flow: buy CTA → `/api/pricing/checkout/prepare` → Paddle Sandbox
  checkout → `/api/pricing/checkout/complete` (server re-verifies the sandbox
  transaction) → `grantUsPurchase` / `grantKrPurchase` (webhook
  `transaction.completed` is an idempotent backstop) → analysis resumes →
  credit reserved/consumed at generation. Personal, Relationship, passes,
  memberships and the credit engine are unchanged.
- **Public copy never names the provider.** No "Paddle", "Paddle.com",
  "PADDLE.NET", "Sandbox" or 패들 in EN/KR UI copy, FAQ or Privacy / Refund /
  Terms. Legal copy says payment/refund processing *may be handled by
  third-party payment service providers* and names no company as Merchant
  of Record; contact is support@ahaitsme.com. No public sandbox banner.
- The external sandbox checkout overlay itself shows Paddle's own branding;
  that is intentionally left untouched.

History (a500cda disabled checkout, ee8fcd2 made it QA-only) is superseded:
there is no QA allowlist and no "purchasing unavailable" state.

Regression suite: `npm run test:paddle-retirement`.

## Required Vercel env (unchanged from before)

`NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN`, `PADDLE_SANDBOX_API_SECRET_KEY`,
`PADDLE_SANDBOX_WEBHOOK_SECRET`.

## When the live provider is chosen

- Paddle-specific (replace): `lib/payment/useRegionalCheckout.ts`,
  `useBetaCheckout.ts`, `paddleSandboxClient.ts`, `paddleWebhookVerify.ts`,
  `paddleWebhookState.ts`, `paddleAdjustmentClaim.ts`, `paddleQuantityGuard.ts`
  (keep `flagPaymentForManualReview`), `betaPaddlePricing.ts`, price ids /
  `paddleNickname` in `usPricing.ts` / `krPricing.ts`,
  `app/api/pricing/checkout/complete`, `app/api/beta/checkout/complete`,
  `app/api/webhooks/paddle`, CSP `*.paddle.com` entries; unreferenced legacy
  UI `CheckoutWithRefundConsent.tsx`, `PricingCards.tsx`,
  `RegionalPricingCards.tsx`.
- Provider-agnostic (reuse): credit engine, entitlements, `analysisEntryGate`,
  `process_us_purchase` / `process_kr_purchase` / renewal functions + TS
  wrappers, `payment_manual_reviews`, `resolveRegionalPlan` + catalogs,
  Purchase Selector UI, `/thank-you`, redeem codes. All history tables and
  migrations are kept.
- Legal: name the live provider (and its countries) in Privacy §5/§6,
  Refund §3/§4 and Terms §5 if desired.
