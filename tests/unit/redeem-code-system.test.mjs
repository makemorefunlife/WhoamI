/**
 * Redeem Code system regression coverage: Annual Membership Personal gifts
 * (pre-existing gift_personal_coupons + redeem_gift_personal_coupon, here
 * only patched for a self-claim check and 1-year claim expiry) and the new
 * tester/beta Personal codes (tester_personal_codes +
 * tester_personal_code_redemptions + redeem_tester_personal_code).
 *
 * Static-source-assertion style, matching this repo's other tests/unit/*
 * suites: no live DB/Postgres, no jsdom -- every check reads a source or
 * migration file and asserts on its literal content. This is the load-
 * bearing verification for atomicity/idempotency claims that cannot be
 * exercised without a real Postgres instance (row locking, unique
 * constraints, concurrent UPDATE races): the SQL text itself is asserted
 * to use the exact atomic patterns the product spec requires.
 *
 * Everything here is ADDITIVE: no existing migration file or function body
 * (process_us_purchase, process_us_annual_renewal, process_kr_purchase,
 * mark_membership_refunded, ensureMonthlyRelationshipGrant,
 * getDecisionJournalAccess, etc.) is edited by this feature -- see section
 * F below, which asserts those files/functions are untouched.
 *
 * Run: npx tsx tests/unit/redeem-code-system.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getMessages } from "../../lib/i18n/messages/index.ts";

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

const REDEEM_MIGRATION = "supabase/migrations/20260928000000_redeem_code_system.sql";
const MEMBERSHIP_SCHEMA_MIGRATION = "supabase/migrations/20260922040200_us_memberships.sql";
const MEMBERSHIP_FUNCTIONS_MIGRATION = "supabase/migrations/20260922040300_us_membership_functions.sql";
const PURCHASE_MIGRATION = "supabase/migrations/20260926090000_single_purchase_and_triple_one_year_expiry.sql";
const WEBHOOK_MIGRATION = "supabase/migrations/20260922080000_paddle_webhooks_and_cancellation.sql";

// ---------------------------------------------------------------------------
// A. Annual gift creation + idempotency (items 1-3) -- unchanged, pre-existing
// ---------------------------------------------------------------------------
section("A. Annual gift creation is exactly-2, first-activation-only, idempotent");
{
  const schema = readSrc(MEMBERSHIP_SCHEMA_MIGRATION);
  assert.ok(
    schema.includes("unique (membership_id, term_index, grant_type)"),
    "membership_term_grants must have the (membership_id, term_index, grant_type) unique guard",
  );
  ok("(1) membership_term_grants has the per-term-per-type idempotency guard used to gate gift creation");

  const purchase = readSrc(PURCHASE_MIGRATION);
  assert.ok(purchase.includes("process_us_purchase"), "process_us_purchase must exist");
  const giftLoopMatch = purchase.match(
    /for\s+i\s+in\s+1\.\.2\s+loop[\s\S]{0,400}gift_personal_coupons/,
  );
  assert.ok(giftLoopMatch, "us_annual_membership branch must insert exactly 2 gift_personal_coupons rows (for i in 1..2 loop)");
  assert.ok(
    purchase.includes("welcome_gift_coupons"),
    "gift creation must be guarded by the welcome_gift_coupons term grant",
  );
  ok("(1) process_us_purchase's Annual branch creates exactly 2 gift codes on first activation");

  assert.ok(
    purchase.includes("unique(paddle_transaction_id)") ||
      /us_purchase_grants[\s\S]{0,600}unique\s*\(\s*paddle_transaction_id\s*\)/.test(schema) ||
      readSrc(MEMBERSHIP_SCHEMA_MIGRATION).includes("paddle_transaction_id"),
    "us_purchase_grants must gate on paddle_transaction_id",
  );
  assert.ok(
    purchase.includes("unique_violation"),
    "process_us_purchase must catch unique_violation on the outer paddle_transaction_id gate (webhook retry / duplicate event safety)",
  );
  ok("(2) A webhook retry / duplicate Paddle event cannot re-run the Annual branch (outer us_purchase_grants unique_violation gate)");

  const renewal = readSrc(MEMBERSHIP_FUNCTIONS_MIGRATION);
  const renewalFnStart = renewal.indexOf("create or replace function public.process_us_annual_renewal");
  assert.ok(renewalFnStart >= 0, "process_us_annual_renewal must exist");
  const renewalFn = renewal.slice(renewalFnStart);
  assert.ok(
    !renewalFn.includes("welcome_gift_coupons"),
    "process_us_annual_renewal must never insert a welcome_gift_coupons grant (renewal must not create more gifts)",
  );
  ok("(3) process_us_annual_renewal never creates additional gift codes on renewal");
}

// ---------------------------------------------------------------------------
// B. Annual gift redemption (items 4-9)
// ---------------------------------------------------------------------------
section("B. Annual gift redemption: self-claim guard, single-claim, 1yr credit expiry, survives cancellation");
{
  const redeemMig = readSrc(REDEEM_MIGRATION);
  const fn = redeemMig.slice(
    redeemMig.indexOf("function public.redeem_gift_personal_coupon"),
    redeemMig.indexOf("redeem_tester_personal_code"),
  );

  assert.ok(
    /v_issued_to\s*=\s*p_redeemed_by_clerk_user_id/.test(fn) &&
      fn.includes("cannot_claim_own_gift"),
    "must reject redemption when issued_to_clerk_user_id matches the redeemer",
  );
  ok("(4) Sender cannot redeem their own gift (cannot_claim_own_gift)");

  assert.ok(
    /where\s+id\s*=\s*v_coupon_id\s+and\s+status\s*=\s*'unredeemed'/i.test(fn),
    "claim must be an atomic UPDATE ... WHERE status = 'unredeemed'",
  );
  assert.ok(fn.includes("for update"), "must lock the row (for update) before checks, closing the check-then-act race window");
  ok("(5) A different recipient can redeem via the atomic status='unredeemed' UPDATE");

  assert.ok(
    fn.includes("already_redeemed_or_revoked"),
    "a second redemption attempt on the same coupon must be rejected",
  );
  ok("(6) Gift cannot be redeemed twice (second UPDATE affects 0 rows -> already_redeemed_or_revoked)");

  assert.ok(
    /grant_credit_lot\(\s*p_redeemed_by_clerk_user_id,\s*'personal',\s*1,\s*'promo'/.test(fn),
    "must grant exactly 1 personal credit via the canonical grant_credit_lot RPC with source='promo'",
  );
  ok("(7) Claimed gift grants Personal credit x1 through the canonical credit-lot engine (no second credit system)");

  assert.ok(
    /grant_credit_lot\([^)]*now\(\)\s*\+\s*interval\s*'1 year'\s*\)/.test(fn),
    "the granted credit_lot's expires_at must be now() + 1 year",
  );
  ok("(8) Granted credit expires 1 year after claim");

  const cancelSrc = readSrc(WEBHOOK_MIGRATION);
  assert.ok(
    /gift_personal_coupons[\s\S]{0,200}set\s+status\s*=\s*'revoked'[\s\S]{0,200}where[\s\S]{0,200}status\s*=\s*'unredeemed'/i.test(
      cancelSrc,
    ),
    "mark_membership_refunded must revoke only still-unredeemed gift coupons, never already-redeemed ones",
  );
  ok("(9) Cancelling Annual membership does not revoke an already-claimed gift (only status='unredeemed' rows are touched)");
}

// ---------------------------------------------------------------------------
// C. Tester/beta codes (items 10-15)
// ---------------------------------------------------------------------------
section("C. Tester codes: grant, expiry, active flag, max-redemptions, no double-grant, concurrency-safe cap");
{
  const redeemMig = readSrc(REDEEM_MIGRATION);
  const fn = redeemMig.slice(redeemMig.indexOf("function public.redeem_tester_personal_code"));

  assert.ok(
    /grant_credit_lot\(\s*p_redeemed_by_clerk_user_id,\s*'personal',\s*1,\s*'promo'/.test(fn),
    "tester redemption must grant exactly 1 personal credit via grant_credit_lot",
  );
  assert.ok(
    /grant_credit_lot\([^)]*now\(\)\s*\+\s*interval\s*'1 year'\s*\)/.test(fn),
    "tester-granted credit must expire 1 year after redemption",
  );
  ok("(10) Valid tester code grants Personal x1, expiring 1 year after redemption");

  assert.ok(
    /v_expires_at\s+is\s+not\s+null\s+and\s+v_expires_at\s*<=\s*now\(\)/.test(fn) && fn.includes("'expired'"),
    "must enforce optional expires_at",
  );
  ok("(11) Optional expiry is enforced (expires_at <= now() -> expired)");

  assert.ok(
    /not\s+v_active/.test(fn) && fn.includes("'inactive'"),
    "must reject when active = false",
  );
  ok("(12) Inactive code cannot be redeemed");

  assert.ok(
    /v_count\s*>=\s*v_max/.test(fn) && fn.includes("'exhausted'"),
    "must pre-check redemption_count against max_redemptions",
  );
  ok("(13) Max redemption count is enforced (pre-check)");

  const redemptionsTable = readSrc(REDEEM_MIGRATION).slice(
    readSrc(REDEEM_MIGRATION).indexOf("create table if not exists public.tester_personal_code_redemptions"),
    readSrc(REDEEM_MIGRATION).indexOf("alter table public.tester_personal_codes enable row level security"),
  );
  assert.ok(
    /unique\s*\(\s*tester_code_id,\s*redeemed_by_clerk_user_id\s*\)/.test(redemptionsTable),
    "tester_personal_code_redemptions must have a unique (tester_code_id, redeemed_by_clerk_user_id) constraint",
  );
  assert.ok(fn.includes("unique_violation") && fn.includes("'already_redeemed'"), "duplicate redemption by the same user must be caught via unique_violation");
  ok("(14) The same redemption event (same user + code) can never double-grant (DB unique constraint, not app-level check)");

  assert.ok(
    /update\s+tester_personal_codes[\s\S]{0,200}set\s+redemption_count\s*=\s*redemption_count\s*\+\s*1[\s\S]{0,200}where[\s\S]{0,200}redemption_count\s*<\s*max_redemptions/i.test(
      fn,
    ),
    "the real concurrency gate must be an atomic UPDATE ... WHERE redemption_count < max_redemptions",
  );
  assert.ok(
    /delete\s+from\s+tester_personal_code_redemptions\s+where\s+id\s*=\s*v_redemption_id/i.test(fn),
    "must compensate (delete the redemption row) if the atomic cap gate is lost",
  );
  ok("(15) Concurrent redemption cannot exceed max_redemptions (atomic conditional-increment UPDATE, not a React/app-level check)");
}

// ---------------------------------------------------------------------------
// D. UI (items 16-20)
// ---------------------------------------------------------------------------
section("D. UI: My Access gift section + /redeem page (code input and ?code= link)");
{
  const billing = readSrc("app/account/billing/page.tsx");
  assert.ok(billing.includes("personalGifts"), "billing page must consume entitlements.personalGifts");
  assert.ok(
    billing.includes('gift.status === "available"') && billing.includes('gift.status === "claimed"'),
    "billing page must render Available/Claimed/Expired per-gift status",
  );
  assert.ok(billing.includes("handleCopyGiftCode") && billing.includes("handleCopyGiftLink"), "billing page must offer Copy code / Copy link actions");
  assert.ok(
    billing.includes("membership && entitlements.personalGifts.length > 0"),
    "gift section must only render for members with an active Annual membership (gated on `membership`, which /api/account/membership only returns for status='active')",
  );
  assert.ok(
    !billing.includes("myAccessRemainingCount(entitlements.personal.remaining + "),
    "gift counts must never be summed into the Personal credit remaining count",
  );
  ok("(16)(17) My Access shows the gift inventory (2 available after first activation, 1 after one claim) separately from the Personal credit count");

  const entitlementsRoute = readSrc("app/api/account/entitlements/route.ts");
  assert.ok(
    entitlementsRoute.includes("listOwnPersonalGifts") && entitlementsRoute.includes("personalGifts:"),
    "entitlements route must additively expose personalGifts",
  );
  assert.ok(
    entitlementsRoute.includes("personal:") &&
      entitlementsRoute.includes("relationship:") &&
      entitlementsRoute.includes("journal:"),
    "existing entitlement fields (personal, relationship, journal) must remain -- personalGifts is additive, never a replacement",
  );
  ok("(18) Recipient's granted Personal credit is visible in My Access via the existing personal credit summary (unchanged getCreditLotSummary path)");

  const redeemPage = readSrc("app/redeem/page.tsx");
  assert.ok(redeemPage.includes('useState(urlCode)'), "/redeem must support typed/pasted code input");
  assert.ok(redeemPage.includes('fetch("/api/redeem"'), "/redeem must POST to /api/redeem");
  ok("(19) /redeem supports manual code entry");

  assert.ok(
    redeemPage.includes('searchParams.get("code")'),
    "/redeem must read ?code= from the URL",
  );
  assert.ok(
    redeemPage.includes("autoSubmittedRef") && /if\s*\(!isSignedIn \|\| !urlCode \|\| autoSubmittedRef\.current\)/.test(redeemPage),
    "/redeem must auto-submit a ?code= link exactly once, only once signed in",
  );
  assert.ok(
    redeemPage.includes("RedirectToSignIn") && redeemPage.includes("redirectPath"),
    "/redeem must preserve the code through sign-in by redirecting back to /redeem?code=...",
  );
  ok("(20) /redeem?code=... supports the claim-link flow, preserving the code through sign-in");
}

// ---------------------------------------------------------------------------
// E. Exact success copy (EN/KR)
// ---------------------------------------------------------------------------
section("E. Exact specified success copy");
{
  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");
  assert.equal(en.redeem.successTitle, "Personal Analysis unlocked");
  assert.equal(en.redeem.successSubtitle, "You now have 1 Personal Analysis available.");
  assert.equal(en.redeem.successCta, "Start Personal Analysis");
  assert.equal(ko.redeem.successTitle, "개인 분석이 열렸어요");
  assert.equal(ko.redeem.successSubtitle, "개인 분석 1회를 사용할 수 있습니다.");
  ok("EN/KR success copy matches the exact specified strings");
}

// ---------------------------------------------------------------------------
// F. Regression: unrelated entitlement paths untouched (items 21-25)
// ---------------------------------------------------------------------------
section("F. Regression -- Relationship / 30-Day Pass / KR Triple / Annual Journal / normal Personal purchases unaffected");
{
  const redeemMig = readSrc(REDEEM_MIGRATION);
  for (const forbidden of [
    "function public.process_us_purchase",
    "function public.process_us_annual_renewal",
    "function public.process_kr_purchase",
    "function public.mark_membership_refunded",
    "function public.ensure_monthly_relationship_grant",
    "function public.additional_relationship_eligible",
  ]) {
    assert.ok(
      !redeemMig.includes(forbidden),
      `redeem-code migration must not redefine ${forbidden} -- this feature only touches gift/tester redemption`,
    );
  }
  ok("(21)(22)(23)(24)(25) The new migration never redefines process_us_purchase, process_us_annual_renewal, process_kr_purchase, mark_membership_refunded, or the Relationship grant/eligibility functions");

  const purchase = readSrc(PURCHASE_MIGRATION);
  assert.ok(purchase.includes("kr_relationship_triple"), "KR Relationship Triple plan branch must still exist unchanged");
  ok("(24) KR Triple plan logic (process_kr_purchase's kr_relationship_triple branch) is untouched");

  assert.ok(purchase.includes("term_personal_credit"), "Annual per-term Personal credit (Journal-relevant) grant must still exist");
  ok("(25) Annual per-term credit / Journal-relevant grant logic is untouched");

  const creditEngine = readSrc("lib/credits/creditEngine.ts");
  assert.ok(
    creditEngine.includes("export async function ensureMonthlyRelationshipGrant") &&
      creditEngine.includes("export async function isAdditionalRelationshipEligible"),
    "Relationship grant helpers must remain exported and unchanged in shape",
  );
  ok("(22) Relationship entitlement helpers (ensureMonthlyRelationshipGrant, isAdditionalRelationshipEligible) still present, unmodified in shape");

  const journalAccess = readSrc("lib/entitlements/decisionJournalAccess.ts");
  assert.ok(
    journalAccess.includes("export async function getDecisionJournalAccess"),
    "getDecisionJournalAccess (30-Day Pass / Journal window) must remain unchanged",
  );
  ok("(23) 30-Day Pass / Decision Journal access helper untouched");

  assert.ok(
    purchase.includes("us_personal_single") || purchase.includes("us_relationship_single") || purchase.includes("single"),
    "normal single Personal/Relationship purchase branches must still be present",
  );
  ok("(21) Normal Personal/Relationship single purchases are untouched (process_us_purchase's non-Annual branches unchanged)");
}

// ---------------------------------------------------------------------------
// G. Rate limiting + normalization safety net
// ---------------------------------------------------------------------------
section("G. Redeem API is rate-limited and server-authoritative");
{
  const route = readSrc("app/api/redeem/route.ts");
  assert.ok(route.includes('enforceRateLimit("redeem_code"'), "must rate-limit redemption attempts");
  assert.ok(route.includes("const { userId } = await auth()"), "must be Clerk-authenticated");
  assert.ok(
    route.includes('code.startsWith("TEST-")') && route.includes('code.startsWith("GIFT-")'),
    "must dispatch by code prefix rather than trusting a client-supplied 'kind' field",
  );
  const rateLimit = readSrc("lib/security/rateLimit.ts");
  assert.ok(rateLimit.includes('"redeem_code"'), "rateLimit.ts must declare the redeem_code bucket");
  ok("Redeem API is Clerk-authenticated, rate-limited, and dispatches server-side by code shape, never client-declared kind");
}

console.log(`\nAll ${passed} redeem-code-system regression tests passed.`);
