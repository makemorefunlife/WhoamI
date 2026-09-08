/**
 * 1-week Beta Release Candidate — Personal credit gate + Paddle sandbox
 * transaction verification. Static source checks for the two routes that
 * are impractical to exercise end-to-end without a live Clerk session and
 * a real Paddle sandbox transaction (see the session's own live-proof
 * pattern for how the underlying credit RPCs are validated against real
 * DEV data instead).
 *
 * Run: npx tsx tests/unit/beta-personal-credit-and-checkout-verify.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

section("A. Personal deep-analysis route: cache-first, credit only on a real generation");
{
  const src = readSrc("app/api/v2/deep/essence/route.ts");
  assert.ok(src.includes("reservePersonalCredit"));
  assert.ok(src.includes("consumeCredit(supabase, generationRequestId)"));
  assert.ok(src.includes("releaseCredit(supabase, generationRequestId)"));

  // The credit gate must be textually AFTER the stored-cache return, so a
  // cache hit returns before reservePersonalCredit is ever reached.
  const cacheReturnIdx = src.indexOf("return NextResponse.json({ ok: true, locale, slim_v1: parsed.slim_v1 })");
  const reserveIdx = src.indexOf("reservePersonalCredit(supabase");
  assert.ok(cacheReturnIdx > -1 && reserveIdx > -1 && cacheReturnIdx < reserveIdx);

  // The dev-only null-userId bypass (assertOwnedReportAccess's own
  // documented NODE_ENV !== "development" exception) must not crash this
  // new code — it has to be an explicit branch, not a non-null assertion.
  assert.equal(src.includes("clerkUserId: userId!"), false, "must not force-assert a possibly-null userId into the credit RPC");
  assert.ok(src.includes("if (userId) {"), "credit reservation must be conditioned on userId actually being present");
  ok("essence route: cache hit never touches credit; generation reserves/consumes/releases personal credit; null-userId dev bypass handled without a crash");
}

section("B. Beta checkout-complete route: never trusts the client alone");
{
  const src = readSrc("app/api/beta/checkout/complete/route.ts");
  assert.ok(src.includes("fetchPaddleSandboxTransaction"), "must re-fetch the transaction from Paddle's own API");
  assert.ok(src.includes('txn.status !== "completed"'), "must check the transaction's real status");
  assert.ok(
    src.includes("customData.clerkUserId !== userId") && src.includes("customData.planId !== planId"),
    "must verify the transaction's custom_data matches the current session and claimed plan",
  );
  assert.ok(src.includes("planHasPriceId"), "must verify the transaction's actual price id belongs to the claimed plan");
  assert.ok(src.includes("grantBetaPurchase"), "must route through the idempotent grant, not call grantCredits directly");
  assert.equal(
    src.includes("grantCredits("),
    false,
    "must not call grantCredits directly — grantBetaPurchase is the only path in, so the idempotency claim can never be bypassed",
  );
  ok("checkout/complete: status + identity + price are all re-verified server-side; grants only ever go through the idempotent grantBetaPurchase");
}

section("C. Client checkout hook never grants on its own — only signals the server which transaction to check");
{
  const src = readSrc("lib/payment/useBetaCheckout.ts");
  assert.equal(src.includes("grant_credit"), false, "the client must never call a credit RPC directly");
  assert.equal(src.includes("credit_accounts"), false);
  assert.ok(src.includes('"/api/beta/checkout/complete"'), "must hand off to the server-verified route");
  assert.ok(src.includes("checkout.completed"), "must key off Paddle's own completion event before calling the server at all");
  ok("useBetaCheckout only ever POSTs a transactionId — all trust/granting logic lives server-side");
}

console.log(`\n${passed} passed`);
