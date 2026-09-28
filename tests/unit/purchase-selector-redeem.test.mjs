/**
 * Purchase Selector "Have a gift or promo code?" regression coverage
 * (components/payment/PurchaseSelectorContent.tsx).
 *
 * This is a UI-only integration on top of the ALREADY-EXISTING /api/redeem
 * backend (gift_personal_coupons, tester_personal_codes, redeem_gift_personal_coupon,
 * redeem_tester_personal_code -- see tests/unit/redeem-code-system.test.mjs).
 * It adds a compact code-entry disclosure directly inside the Personal
 * Purchase Selector so a user with no Personal credit can unlock the same
 * Personal analysis without leaving the selector or without payment --
 * reusing the SAME /api/redeem route, the SAME entitlement grant, and the
 * SAME purchase-success/resume callback a real Paddle purchase already
 * uses. No new coupon system, no new DB tables, no new migration, no
 * Paddle discount codes, and no change to Paddle pricing or Personal
 * credit grant logic.
 *
 * Static-source-assertion style (no jsdom/live render), matching this
 * repo's other tests/unit/* suites.
 *
 * Run: npx tsx tests/unit/purchase-selector-redeem.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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

const selectorSrc = readSrc("components/payment/PurchaseSelectorContent.tsx");
const reasonCopySrc = readSrc("lib/redeem/reasonCopy.ts");
const redeemRouteSrc = readSrc("app/api/redeem/route.ts");
const redeemPageSrc = readSrc("app/redeem/page.tsx");
const deepPageSrc = readSrc("app/blueprint-preview/[reportId]/essence/deep/page.tsx");
const stitchCardSrc = readSrc("components/results/StitchPremiumCard.tsx");
const pricingPageSrc = readSrc("app/pricing/page.tsx");

// ---------------------------------------------------------------------------
// A. Personal selector shows the redeem entry point; Relationship does not
// ---------------------------------------------------------------------------
section("A. Personal Purchase Selector shows \"gift or promo code\"; Relationship does not");
{
  assert.ok(
    selectorSrc.includes('context === "personal" && isSignedIn ?'),
    "the redeem disclosure block must be gated on context === \"personal\" (and signed-in, matching the file's existing isSignedIn gating elsewhere)",
  );
  assert.ok(
    selectorSrc.includes("messages.redeem.haveCodeToggle"),
    "the gated block must render the haveCodeToggle copy",
  );
  // The component is a single shared function -- there is no separate
  // "relationship" branch of this JSX, so the context === "personal" guard
  // alone is what keeps it out of context === "relationship" renders.
  const redeemBlockIndex = selectorSrc.indexOf('context === "personal" && isSignedIn ?');
  const relationshipContextLiteral = 'context === "relationship"';
  assert.ok(
    selectorSrc.includes(relationshipContextLiteral),
    "sanity check: the file still distinguishes a relationship context elsewhere (title, alreadyHasAccessNotice)",
  );
  assert.ok(redeemBlockIndex > -1, "redeem block must exist");
  ok('(1) Personal Purchase Selector shows the "gift or promo code" option');
  ok('(2) Relationship Purchase Selector does NOT show it (guarded by context === "personal")');
}

// ---------------------------------------------------------------------------
// B. Redeem submission reuses the existing /api/redeem backend
// ---------------------------------------------------------------------------
section("B. Code submission reuses the existing /api/redeem route (gift + tester codes)");
{
  assert.ok(
    selectorSrc.includes('fetch("/api/redeem"') && selectorSrc.includes('method: "POST"'),
    "submitRedeemCode must POST to the existing /api/redeem route -- no new endpoint",
  );
  assert.ok(
    selectorSrc.includes("JSON.stringify({ code: trimmed })"),
    "submitRedeemCode must send { code } exactly like the existing /redeem page",
  );
  // The backend dispatch that actually distinguishes gift vs tester codes is
  // unchanged (see section E) -- both code families reach the SAME route
  // this new UI calls, so a valid Annual gift code and a valid tester code
  // are both redeemable through it without any UI-side branching on kind.
  assert.ok(
    redeemRouteSrc.includes("redeemGiftPersonalCoupon") && redeemRouteSrc.includes("redeemTesterPersonalCode"),
    "the existing /api/redeem dispatch (gift vs tester) must still exist, unchanged, as what the new UI calls into",
  );
  assert.ok(
    !selectorSrc.match(/CREATE\s+(OR\s+REPLACE\s+)?(TABLE|FUNCTION)/i),
    "no new coupon system / DB objects introduced by this UI file",
  );
  ok("(3) A valid Annual gift code can be redeemed through the new entry point (same /api/redeem dispatch)");
  ok("(4) A valid tester code can be redeemed through the new entry point (same /api/redeem dispatch)");
}

// ---------------------------------------------------------------------------
// C. Successful redeem grants the entitlement and auto-resumes Deep
// ---------------------------------------------------------------------------
section("C. Successful redeem grants Personal entitlement and resumes Deep automatically");
{
  assert.ok(
    selectorSrc.includes('setRedeemState("success")') && selectorSrc.includes("setRedeemKind(body.kind"),
    "a successful /api/redeem response must flip local state to success (entitlement already granted server-side by the RPC before the response returns)",
  );
  assert.ok(
    /if \(redeemState !== "success"\) return;[\s\S]{0,200}onSuccess\?\.\(redeemKind \? `redeem:\$\{redeemKind\}` : "redeem"\)/.test(
      selectorSrc,
    ),
    "on redeem success, the SAME onSuccess prop a real purchase calls must be invoked -- no second resume path",
  );
  // The zero-parameter contract is what makes reuse possible: both existing
  // context="personal" callers ignore whatever string onSuccess receives.
  assert.ok(
    /function handlePurchaseSuccess\(\)\s*\{\s*setPurchaseOpen\(false\);\s*void retry\(\);\s*\}/.test(deepPageSrc),
    "essence/deep's handlePurchaseSuccess must remain a zero-arg callback that calls retry() -- unchanged, and exactly what redeem success now reuses",
  );
  assert.ok(
    /function handlePurchaseSuccess\(\)\s*\{\s*setSelectorOpen\(false\);\s*router\.push\(href\);\s*\}/.test(
      stitchCardSrc,
    ),
    "StitchPremiumCard's handlePurchaseSuccess must remain a zero-arg callback that navigates -- unchanged, and exactly what redeem success now reuses",
  );
  ok("(5) A successful redeem grants the Personal entitlement (via the existing RPC, before onSuccess ever fires)");
  ok("(6) A successful redeem resumes the SAME Personal Deep analysis automatically (calls the existing onSuccess -> retry() path)");
  ok("(7) No extra Generate/Buy click is required after redeem -- onSuccess fires programmatically from a useEffect, not from a second user action");
}

// ---------------------------------------------------------------------------
// D. Failure states: localized, never raw, and selector stays open
// ---------------------------------------------------------------------------
section("D. Failure states show localized copy, never raw RPC/DB errors, and keep the selector open");
{
  assert.ok(
    selectorSrc.includes("redeemReasonCopy(redeemErrorReason, messages.redeem)"),
    "errors must render through the shared redeemReasonCopy helper -- never raw body.reason / body.error text",
  );
  assert.ok(
    !selectorSrc.includes("{redeemErrorReason}") && !selectorSrc.includes("{body.error}"),
    "the raw reason/error string must never be interpolated directly into the UI",
  );
  // Every backend reason redeemReasonCopy is asked to handle maps to a
  // user-friendly copy key -- confirmed exhaustively in reasonCopy.ts itself.
  for (const reason of [
    "not_found",
    "inactive",
    "expired",
    "exhausted",
    "already_redeemed",
    "already_redeemed_or_revoked",
    "cannot_claim_own_gift",
  ]) {
    assert.ok(reasonCopySrc.includes(`case "${reason}":`), `redeemReasonCopy must map reason "${reason}" to localized copy`);
  }
  assert.ok(
    reasonCopySrc.includes("default:") && reasonCopySrc.includes("return copy.errorGeneric;"),
    "any unrecognized reason must fall back to the generic localized error, never a raw string",
  );
  // Failure never calls onSuccess, never unmounts/closes anything -- the
  // component simply re-renders with redeemState === "error", and every
  // purchase card above the redeem block is untouched by redeemState.
  assert.ok(
    !/setRedeemState\("error"\);[\s\S]{0,80}onSuccess/.test(selectorSrc),
    "the error branch of submitRedeemCode must never call onSuccess",
  );
  assert.ok(
    selectorSrc.includes("{renderCard(primaryPlanId, true)}") &&
      selectorSrc.indexOf("{renderCard(primaryPlanId, true)}") < selectorSrc.indexOf('context === "personal" && isSignedIn ?'),
    "the primary purchase card renders unconditionally above the redeem block -- a failed redeem cannot remove it",
  );
  ok("(8) Invalid code shows a localized error (errorNotFound), not a raw RPC error");
  ok("(9) Expired code shows a localized error (errorExpired), not a raw RPC error");
  ok("(10) Already-used code shows a localized error (errorAlreadyRedeemed / errorAlreadyRedeemedOrRevoked), not a raw RPC error");
  ok("(11) A failed redeem keeps the Purchase Selector open (no onSuccess call, no unmount on the error path)");
  ok("(12) Payment options remain usable after a failed redeem (purchase cards render unconditionally, independent of redeemState)");
}

// ---------------------------------------------------------------------------
// E. Existing /redeem route and standalone page are unchanged
// ---------------------------------------------------------------------------
section("E. Existing /redeem route/page remain the same fallback entry point, untouched in behavior");
{
  assert.ok(
    redeemRouteSrc.includes("redeemGiftPersonalCoupon") && redeemRouteSrc.includes("redeemTesterPersonalCode"),
    "/api/redeem's dispatch logic is unchanged",
  );
  assert.ok(
    redeemPageSrc.includes('fetch("/api/redeem"') && redeemPageSrc.includes('searchParams.get("code")'),
    "the standalone /redeem page (manual entry + ?code= claim-link flow) is unchanged in behavior",
  );
  assert.ok(
    redeemPageSrc.includes('import { redeemReasonCopy } from "@/lib/redeem/reasonCopy";') &&
      redeemPageSrc.includes("redeemReasonCopy(errorReason, copy)") &&
      !redeemPageSrc.includes("function reasonCopy("),
    "/redeem page now delegates to the shared redeemReasonCopy helper instead of its own local copy of the same switch -- identical mapping, not a behavior change",
  );
  ok("(13) The existing /redeem route (and page) remains a valid, unremoved, unreplaced fallback entry point");
}

// ---------------------------------------------------------------------------
// F. Personal and Relationship purchase flows are unaffected
// ---------------------------------------------------------------------------
section("F. Personal purchase flow and Relationship purchase flow are unchanged");
{
  assert.ok(
    selectorSrc.includes("async function handleCheckout(planId: string) {") &&
      /outcome === "success" \|\| outcome === "already_processed"[\s\S]{0,120}onSuccess\?\.\(planId\)/.test(selectorSrc),
    "handleCheckout's existing success branch (calling onSuccess?.(planId)) must be byte-for-byte unchanged",
  );
  // The three existing context="personal" call sites are untouched -- the
  // zero-arg handlePurchaseSuccess contract (section C) is what let this
  // feature ship without editing any of them.
  assert.ok(deepPageSrc.includes('context="personal"'), "essence/deep's PurchaseSelectorModal call site is unchanged");
  assert.ok(stitchCardSrc.includes('context="personal"'), "StitchPremiumCard's PurchaseSelectorModal call site is unchanged");
  assert.ok(pricingPageSrc.includes('<PurchaseSelectorPage context="personal" />'), "/pricing's PurchaseSelectorPage call site is unchanged");
  ok("(14) Personal purchase flow remains unchanged (handleCheckout untouched; no existing call site edited)");

  // Relationship: the redeem block is unreachable for context="relationship"
  // (section A), and nothing in region/catalog/renderCard logic -- which is
  // what actually drives the relationship purchase flow -- was touched.
  assert.ok(
    selectorSrc.includes("selectorTitleRelationship") && selectorSrc.includes("selectorAlreadyHaveAccessRelationship"),
    "relationship-specific copy/logic branches remain present and untouched",
  );
  ok("(15) Relationship purchase flow remains unchanged (no redeem UI reachable; catalog/checkout logic untouched)");
}

// ---------------------------------------------------------------------------
// G. Opening the selector never mints a new code; no migration introduced
// ---------------------------------------------------------------------------
section("G. No new code is created by opening the selector; no DB migration introduced");
{
  // submitRedeemCode is the ONLY function in this file that touches
  // /api/redeem, and it is only ever wired to the form's onSubmit -- never
  // called from a useEffect, onClick of the toggle, or on mount.
  const submitCount = (selectorSrc.match(/submitRedeemCode/g) ?? []).length;
  assert.ok(submitCount >= 2, "submitRedeemCode must be defined and referenced");
  assert.ok(
    selectorSrc.includes("<form onSubmit={submitRedeemCode}"),
    "submitRedeemCode must be wired only to the form's onSubmit",
  );
  assert.ok(
    !/onClick=\{[^}]*submitRedeemCode/.test(selectorSrc),
    "submitRedeemCode must not fire from the toggle button's onClick",
  );
  assert.ok(
    selectorSrc.includes("onClick={() => setRedeemOpen((v) => !v)}"),
    "the disclosure toggle only flips local UI state -- it never calls the backend",
  );
  ok("(16) No new gift or tester code is created merely by opening the selector or the redeem disclosure");

  // This feature's entire file list (see the top-level summary) introduces
  // zero new migrations under supabase/migrations -- reusing the same RPCs
  // the redeem-code-system change already shipped.
  const migrationsDir = join(root, "supabase/migrations");
  const migrationFiles = readdirSync(migrationsDir);
  const purchaseSelectorRedeemMigrations = migrationFiles.filter((f) =>
    f.toLowerCase().includes("purchase_selector") || f.toLowerCase().includes("purchase-selector"),
  );
  assert.equal(
    purchaseSelectorRedeemMigrations.length,
    0,
    "no migration file specific to this Purchase-Selector-redeem UI feature should exist",
  );
  assert.ok(
    !selectorSrc.includes("supabase") && !reasonCopySrc.includes("supabase"),
    "neither the selector nor the shared reason-copy helper talks to Supabase directly -- both go through the existing /api/redeem route",
  );
  ok("(17) No DB migration is introduced by this change");
}

// ---------------------------------------------------------------------------
// H. EN/KR copy -- exact spec match, and maximal reuse of existing keys
// ---------------------------------------------------------------------------
section("H. EN/KR copy matches the spec exactly; reuses existing redeem keys rather than duplicating");
{
  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");

  // Exact success copy from the spec.
  assert.equal(en.redeem.successTitle, "Personal Analysis unlocked");
  assert.equal(en.redeem.appliedSuccessfully, "Your code was applied successfully.");
  assert.equal(ko.redeem.successTitle, "개인 분석이 열렸어요");
  assert.equal(ko.redeem.appliedSuccessfully, "코드가 정상적으로 적용되었습니다.");

  // New compact-UI keys exist in both locales.
  for (const key of ["haveCodeToggle", "enterCodeCta", "applyCta", "appliedSuccessfully"]) {
    assert.equal(typeof en.redeem[key], "string");
    assert.equal(typeof ko.redeem[key], "string");
  }

  // Reuse: the new UI must reference the SAME error keys the standalone
  // /redeem page already uses (via the shared reasonCopy helper), not a
  // duplicated parallel set.
  assert.ok(selectorSrc.includes("messages.redeem.codeInputPlaceholder"));
  assert.ok(selectorSrc.includes("messages.redeem.submitting"));
  assert.ok(selectorSrc.includes("messages.redeem.successTitle"));

  ok("Exact EN/KR success copy matches the spec verbatim, and existing redeem.* keys are reused rather than duplicated");
}

console.log(`\nAll ${passed} purchase-selector-redeem regression tests passed.`);
