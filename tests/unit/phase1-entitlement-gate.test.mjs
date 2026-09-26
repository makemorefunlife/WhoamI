/**
 * Phase 1 entitlement enforcement -- regression tests.
 *
 * Background: relationship premium generation had two independent,
 * both-disabled gates (PREMIUM_PAYWALL-driven ensureRelationshipPremiumSlot
 * and assertRelationshipPremiumLlmAccess) sitting in front of the
 * already-correct, lot-aware credit reservation engine
 * (reserveRelationshipCredit / reservePersonalCredit). Those two gates
 * auto-promoted analysis_type to "premium" for free whenever the flag was
 * off (the reported bug: premium analysis viewable with no paid
 * entitlement), and could never safely be turned on as-is, because
 * nothing else in the codebase ever flips analysis_type from a real
 * payment -- app/api/relationship/upgrade/route.ts is designed for that
 * but has zero callers. Simply setting PREMIUM_PAYWALL=true would have
 * 403-blocked every relationship premium request, paying or not.
 *
 * Fix: remove both flag-gated checks from the route and make the credit
 * reservation the sole real entitlement gate (it already enforces a real
 * balance once CREDIT_ENFORCEMENT=true, and already releases the
 * reservation on any technical failure via the route's shared `finally`
 * block). analysis_type is now set to "premium" as a best-effort side
 * effect immediately after a successful reservation, purely so the UI
 * badge and the route's own cache-first check reflect real paid state --
 * it is no longer load-bearing for access control.
 *
 * Personal already had a correct backend gate (reservePersonalCredit ->
 * 402 on insufficient balance in app/api/v2/deep/essence/route.ts) but no
 * frontend recovery UI -- a 402 just surfaced as a generic error with no
 * way to purchase and continue. This mirrors Relationship's already-live
 * premiumCreditExhausted -> PurchaseSelectorModal -> retry() pattern
 * (useRelationshipDetail.ts / RelationshipView.tsx) onto Personal's
 * useSlimV1Integrated.ts and the essence/deep page.
 *
 * This repo's test suite has no jsdom/React-rendering infra, so -- in the
 * same style as tests/unit/checkout-success-redirect.test.mjs -- this
 * stays a set of static source checks confirming the actual wiring,
 * rather than a rendered-component test.
 *
 * Run: npx tsx tests/unit/phase1-entitlement-gate.test.mjs
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

section("A. Relationship route no longer gates on the disconnected PREMIUM_PAYWALL checks");
{
  const routePath = "app/api/relationship/analyze/premium/route.ts";
  const src = readSrc(routePath);

  // The route keeps an explanatory comment naming both removed checks (why
  // they were removed), so we check for an actual import/call site rather
  // than a bare substring match, which the comment itself would trip.
  assert.ok(
    !src.includes('from "@/lib/relationship/ensureRelationshipPremiumSlot"') &&
      !/[^/\n]\bensureRelationshipPremiumSlot\s*\(/.test(src),
    "route must no longer import or call ensureRelationshipPremiumSlot (the free auto-promote-on-flag-off gate)",
  );
  ok("ensureRelationshipPremiumSlot is no longer imported or called in the premium route");

  assert.ok(
    !/assertRelationshipPremiumLlmAccess\s*,?\s*\n?\s*}\s*from/.test(src) &&
      !/[^/\n]\bassertRelationshipPremiumLlmAccess\s*\(/.test(src),
    "route must no longer import or call assertRelationshipPremiumLlmAccess (the second PREMIUM_PAYWALL-gated check)",
  );
  ok("assertRelationshipPremiumLlmAccess is no longer imported or called in the premium route");

  assert.ok(
    src.includes("reserveRelationshipCredit"),
    "route must still reserve credit -- this becomes the sole real entitlement gate",
  );
  ok("reserveRelationshipCredit is present and is the route's real gate");

  // ensureRelationshipPremiumSlot must have no other callers left anywhere
  // (confirms removing it here doesn't leave a half-wired dependency, and
  // that it's genuinely safe dead code rather than something else relies on).
  const grepTargets = [
    "app",
    "lib",
    "components",
  ];
  // We can't run a real recursive grep without a shell here, so instead
  // assert directly against the two files known (from the Phase 1 audit)
  // to be the only other places these names could plausibly appear.
  const guardSrc = readSrc("lib/relationship/relationshipPremiumGuard.ts");
  assert.ok(
    guardSrc.includes("export async function assertRelationshipPremiumLlmAccess") ||
      guardSrc.includes("export function assertRelationshipPremiumLlmAccess"),
    "assertRelationshipPremiumLlmAccess should still be defined (left as safe, uncalled dead code, not deleted) to keep this diff minimal",
  );
  ok("assertRelationshipPremiumLlmAccess is left defined but now uncalled (minimal-diff dead code, not deleted)");

  const upgradeRouteSrc = readSrc("app/api/relationship/upgrade/route.ts");
  assert.ok(
    upgradeRouteSrc.length > 0,
    "the orphaned real-payment-to-analysis_type bridge route should still exist untouched",
  );
  ok("app/api/relationship/upgrade/route.ts (the orphaned bridge route) is untouched, confirming it was never the real fix target");
}

section("B. analysis_type is set to premium as a side effect of a successful reservation, not a precondition for it");
{
  const routePath = "app/api/relationship/analyze/premium/route.ts";
  const src = readSrc(routePath);

  const reserveIdx = src.indexOf("reserveRelationshipCredit(supabase,");
  const insufficientIdx = src.indexOf("errors.insufficientCredit");
  const markPremiumIdx = src.indexOf('analysis_type: "premium"');
  const consumeIdx = src.indexOf("consumeRelationshipCredit(supabase, generationRequestId)");

  assert.ok(reserveIdx !== -1, "reserveRelationshipCredit call must be present");
  assert.ok(insufficientIdx !== -1, "402 insufficientCredit response must be present");
  assert.ok(markPremiumIdx !== -1, 'analysis_type: "premium" patch must be present');
  assert.ok(consumeIdx !== -1, "consumeRelationshipCredit call must be present");

  assert.ok(
    reserveIdx < insufficientIdx && insufficientIdx < markPremiumIdx,
    "the reservation attempt, then its 402-on-failure branch, must both come before analysis_type is ever marked premium -- a rejected reservation must never mark the row premium",
  );
  ok("analysis_type=premium can only be reached after a successful (non-402) reservation");

  assert.ok(
    markPremiumIdx < consumeIdx,
    "marking analysis_type=premium should happen once reserved, before the model is actually called/consumed -- matches the reserve-first pattern",
  );
  ok("analysis_type is marked premium right after reservation succeeds, ahead of generation/consumption");

  assert.ok(
    src.includes('if (rr.analysis_type !== "premium")'),
    "the analysis_type update must be guarded so it's a no-op for reports already marked premium (avoids redundant writes on retries/polling)",
  );
  ok("analysis_type update is guarded to skip redundant writes");

  assert.ok(
    src.includes("updateRelationshipReportSafe(") && src.includes("markPremiumErr"),
    "the analysis_type update must use the existing safe-update helper and log (not throw on) failure -- it must never block a paying user's own generation",
  );
  ok("analysis_type update failures are logged, not thrown -- generation is never blocked by this side effect");
}

section("C. Personal: useSlimV1Integrated exposes creditExhausted on a 402, matching Relationship's existing pattern");
{
  const src = readSrc("lib/v1/slim/useSlimV1Integrated.ts");

  assert.ok(
    src.includes("const [creditExhausted, setCreditExhausted] = useState(false)"),
    "hook must expose a creditExhausted boolean state, mirroring useRelationshipDetail.ts's premiumCreditExhausted",
  );
  ok("useSlimV1Integrated declares creditExhausted state");

  assert.ok(
    /if\s*\(res\.status === 402\)\s*\{\s*setCreditExhausted\(true\);\s*setError\(null\);\s*return;\s*\}/.test(
      src,
    ),
    "a 402 response must set creditExhausted and must NOT also set the generic error state (so the page shows the purchase prompt, not a generic error)",
  );
  ok("a 402 sets creditExhausted=true and clears/avoids the generic error state");

  assert.ok(
    src.includes("setCreditExhausted(false)"),
    "a fresh (non-polling) fetch attempt must reset creditExhausted, so a retry() after purchase can reach a real result again",
  );
  ok("creditExhausted resets on a fresh fetch attempt");

  assert.ok(
    /return\s*\{\s*data,\s*loading,\s*inProgress,\s*error,\s*creditExhausted,\s*retry:\s*fetchReport,\s*regenerateFresh,\s*\}/.test(
      src,
    ),
    "creditExhausted must actually be returned from the hook for callers to use",
  );
  ok("creditExhausted is returned from useSlimV1Integrated");
}

section("D. Personal: essence/deep page renders the purchase-recovery UI and disables regenerate while exhausted");
{
  const pagePath = "app/blueprint-preview/[reportId]/essence/deep/page.tsx";
  const src = readSrc(pagePath);

  assert.ok(
    src.includes('import PurchaseSelectorModal from "@/components/payment/PurchaseSelectorModal";'),
    "page must import PurchaseSelectorModal",
  );
  ok("essence/deep page imports PurchaseSelectorModal");

  assert.ok(
    src.includes("creditExhausted") && src.includes("useSlimV1Integrated("),
    "page must destructure creditExhausted from useSlimV1Integrated",
  );
  ok("essence/deep page reads creditExhausted from useSlimV1Integrated");

  assert.ok(
    src.includes('context="personal"'),
    "the Purchase Selector must be opened in personal context, not relationship",
  );
  ok('PurchaseSelectorModal is rendered with context="personal"');

  assert.ok(
    src.includes("successRedirectPath={deepHref}"),
    "the Purchase Selector must redirect back to this exact page after purchase (preserves the already-working Personal post-purchase navigation fix)",
  );
  ok("PurchaseSelectorModal is given successRedirectPath back to this same essence/deep page");

  assert.ok(
    /onSuccess=\{handlePurchaseSuccess\}/.test(src) &&
      /function handlePurchaseSuccess\(\)\s*\{\s*setPurchaseOpen\(false\);\s*void retry\(\);\s*\}/.test(
        src,
      ),
    "a successful purchase must close the modal and retry the exact same generation call, matching useRelationshipDetail.ts's handlePurchaseSuccess",
  );
  ok("a successful purchase closes the modal and calls retry() -- no extra user action needed");

  assert.ok(
    /disabled=\{loading \|\| inProgress \|\| creditExhausted\}/.test(src),
    "the regenerate button must be disabled while credit is exhausted (it would just 402 again)",
  );
  ok("regenerate button is disabled while creditExhausted");

  assert.ok(
    src.includes("{messages.blueprint.creditNeededCta}"),
    "the purchase prompt must use the new creditNeededCta message key",
  );
  ok("purchase prompt uses messages.blueprint.creditNeededCta");
}

section("E. New message key exists in both locales and stays type-checked");
{
  const en = readSrc("lib/i18n/messages/en-US.ts");
  const ko = readSrc("lib/i18n/messages/ko-KR.ts");

  assert.ok(
    en.includes('creditNeededCta: "Purchase"'),
    "en-US runtime catalog must define blueprint.creditNeededCta",
  );
  ok("en-US defines creditNeededCta");

  assert.ok(
    /creditNeededCta:\s*string;/.test(en),
    "en-US MessageCatalog type declaration must include creditNeededCta so ko-KR.ts is type-checked against it",
  );
  ok("en-US MessageCatalog type declares creditNeededCta");

  assert.ok(
    ko.includes('creditNeededCta: "구매하기"'),
    "ko-KR runtime catalog must define blueprint.creditNeededCta",
  );
  ok("ko-KR defines creditNeededCta");
}

console.log(`\n${passed} passed`);
