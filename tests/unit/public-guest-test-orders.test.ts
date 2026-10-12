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
assert.match(success, /view\.emailSent \? t\.guestUse\.mailStatusSent : t\.guestUse\.mailStatusPending/);
assert.match(success, /t\.guestUse\.useLaterCta/);
console.log("ok - success page: use now / later, mail status only 'sent' when accepted");
