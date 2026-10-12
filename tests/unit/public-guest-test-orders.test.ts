/**
 * Public site, Toss TEST key (2026-10-12): an allowlisted purchase email can
 * run the guest flow; using it needs the email proven (link / code); at most
 * TOSS_TEST_GRANT_LIMIT open test orders per email; everyone else unchanged.
 * Run: npx tsx tests/unit/public-guest-test-orders.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { guestEmailAllowlisted, testOrderRestricted } from "../../lib/payment/tossTestMode";

const env = { ...process.env };
process.env.VERCEL_ENV = "production";
process.env.TOSS_TEST_ALLOWLIST = "tester@example.com";
assert.equal(testOrderRestricted(true), true);
assert.equal(testOrderRestricted(false), false, "real orders never restricted");
assert.equal(guestEmailAllowlisted("Tester@Example.com "), true);
assert.equal(guestEmailAllowlisted("visitor@example.com"), false);
process.env = env;
console.log("ok - allowlist decides only for test orders on the public site");

const confirm = readFileSync("lib/payment/tossConfirm.ts", "utf8");
assert.match(confirm, /countGuestTestOrders\(supabase, meta\.guest_email as string, input\.orderId\)/);
assert.match(confirm, /used >= testGrantLimit\(\)/);
console.log("ok - per-email limit for guest test orders");

const route = readFileSync("app/api/payments/toss/confirm/route.ts", "utf8");
assert.match(route, /const proveEmailFirst = testOrderRestricted\(isTest\);/);
assert.match(route, /guestUse && !proveEmailFirst/);
console.log("ok - no same-browser shortcut for public test orders (email link / code first)");

const success = readFileSync("app/checkout/toss/success/TossSuccessClient.tsx", "utf8");
assert.match(success, /view\.emailSent \? t\.guestUse\.mailStatusSent : t\.guestUse\.mailStatusPending/);
assert.match(success, /t\.guestUse\.useLaterCta/);
console.log("ok - success page: use now / later, mail status only 'sent' when accepted");
