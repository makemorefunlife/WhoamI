/**
 * Public site, Toss TEST key (2026-10-12): an allowlisted purchase email can
 * run the guest flow; using it needs the email proven (link / code); at most
 * TOSS_TEST_GRANT_LIMIT open test orders per email; everyone else unchanged.
 * Run: npx tsx tests/unit/public-guest-test-orders.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { guestEmailAllowlisted, guestTestBuyerAllowed, testOrderRestricted } from "../../lib/payment/tossTestMode";

const env = { ...process.env };
process.env.VERCEL_ENV = "production";
process.env.TOSS_TEST_ALLOWLIST = "tester@example.com";
assert.equal(testOrderRestricted(true), true);
assert.equal(testOrderRestricted(false), false, "real orders never restricted");
assert.equal(guestEmailAllowlisted("Tester@Example.com "), true);
assert.equal(guestEmailAllowlisted("visitor@example.com"), false);
// 2026-10-12: allowlist no longer required -- anyone may continue (limit + email proof still apply)
assert.equal(guestTestBuyerAllowed("visitor@example.com"), true);
process.env.TOSS_TEST_ALLOWLIST_REQUIRED = "true";
assert.equal(guestTestBuyerAllowed("visitor@example.com"), false, "optional old mode");
delete process.env.TOSS_TEST_ALLOWLIST_REQUIRED;
process.env = env;
console.log("ok - test buyers open by default; allowlist only in the optional old mode");

const confirm = readFileSync("lib/payment/tossConfirm.ts", "utf8");
assert.match(confirm, /countGuestTestOrders\(supabase, meta\.guest_email as string, input\.orderId\)/);
assert.match(confirm, /used >= testGrantLimit\(\)/);
console.log("ok - per-email limit for guest test orders");

const route = readFileSync("app/api/payments/toss/confirm/route.ts", "utf8");
// Same browser: signed buyer cookie (purchase proof) opens the session, test or not.
assert.doesNotMatch(route, /proveEmailFirst/);
assert.match(route, /isBuyerCookieFor\(buyerRaw, orderId\)/);
assert.match(route, /openGuestSession\(supabase, orderId, "purchase"\)/);
// Other browsers: emailed link (signed token) or a code to the purchase email.
assert.match(readFileSync("app/api/guest/access/link/route.ts", "utf8"), /openGuestSession\(supabase, orderId, "link"\)/);
assert.match(readFileSync("app/api/guest/access/verify/route.ts", "utf8"), /openGuestSession\(supabase, orderId, "code"\)/);
console.log("ok - paying browser continues via the buyer-cookie proof; other browsers need the email link / code");

const success = readFileSync("app/checkout/toss/success/TossSuccessClient.tsx", "utf8");
// Mail state comes from the queue row; failed / not queued are never shown as sent or "sending".
assert.match(success, /view\.emailState === "sent"\s*\? t\.guestUse\.mailStatusSent/);
assert.match(success, /: t\.guestUse\.mailStatusFailed/);
assert.match(success, /t\.guestUse\.successBodyThanks/);
assert.match(success, /t\.guestUse\.useLaterNote/);
assert.match(route, /const mail = await readGuestEmailState\(supabase, orderId\);/);
assert.match(route, /emailReason: isTest && mail\.status !== "sent" \? mail\.reason : undefined/);
assert.match(success, /t\.guestUse\.useLaterCta/);
console.log("ok - success page: use now / later, mail status only 'sent' when accepted");

// readGuestEmailState: real queue state, reason codes only (no address / token)
import("../../lib/email/guestPurchaseEmail").then(async ({ readGuestEmailState }) => {
  const fake = (row: unknown) =>
    ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }) }) }) as never;
  assert.deepEqual(await readGuestEmailState(fake({ guest_email_status: "sent", guest_email_last_error: null }), "o"), { status: "sent", reason: null });
  assert.deepEqual(await readGuestEmailState(fake({ guest_email_status: "retry", guest_email_last_error: "app_base_url_missing" }), "o"), {
    status: "retry",
    reason: "app_base_url_missing",
  });
  assert.deepEqual(await readGuestEmailState(fake({ guest_email_status: null, guest_email_last_error: null }), "o"), {
    status: "not_queued",
    reason: "queue_missing",
  });
  console.log("ok - mail state read from the queue row with a non-secret reason code");
});

// Setup-missing retries are reported as "not sent", never "sending"
{
  const r = readFileSync("app/api/payments/toss/confirm/route.ts", "utf8");
  assert.match(r, /MAIL_SETUP_MISSING = new Set\(\["app_base_url_missing", "claim_token_secret_missing", "mail_not_configured"\]\)/);
  assert.match(r, /!MAIL_SETUP_MISSING\.has\(mail\.reason \?\? ""\)/);
  console.log("ok - missing mail setup is shown as not sent");
}
