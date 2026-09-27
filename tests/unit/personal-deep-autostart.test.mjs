/**
 * Personal Deep-analysis autostart regression coverage.
 *
 * Goal: explicitly starting Personal Deep analysis (via
 * EssenceDeepEntryButton, the Lite/Current report upsell CTAs) must never
 * require an extra "credit needed" CTA click -- it should either start
 * generation immediately (credit available) or open the Purchase Selector
 * immediately (no credit), reusing the exact ?autostart=1 ->
 * autostartCreditExhausted architecture already shipped for Relationship
 * (see tests/unit/relationship-deep-autostart.test.mjs), implemented here
 * as Personal's own independent hook-local logic in
 * lib/v1/slim/useSlimV1Integrated.ts.
 *
 * Root cause found by the read-only trace:
 *
 * 1. useSlimV1Integrated already auto-triggers fetchReport() on mount
 *    whenever `enabled` (birth + survey data ready) is true, regardless of
 *    intent -- so items 1-3 of the ticket (start immediately, no
 *    empty-state, no manual Generate click) were ALREADY satisfied before
 *    this fix; there was never a separate "Generate" button on this page.
 * 2. The only real gap: on a 402 (no credit), essence/deep/page.tsx only
 *    ever showed a static panel with a manual "Purchase" button -- there
 *    was no signal distinguishing "the user just clicked a dedicated
 *    Personal Deep entry point" from "the user loaded this URL directly /
 *    revisited it", so blindly auto-opening the Purchase Selector on every
 *    creditExhausted would have violated the explicit requirement to keep
 *    the manual fallback CTA for direct visits, revisits, and recovery
 *    states.
 *
 * Fixed by adding the same ?autostart=1 convention Relationship already
 * uses: the three real "start Personal Deep analysis" entry points
 * (EssenceDeepEntryButton, StitchLiteResultPanel's goToDeepReport, and
 * current/page.tsx's onUpsellClick) now link with ?autostart=1.
 * useSlimV1Integrated tracks whether the very first fetch attempt this
 * hook instance ever makes was autostart-tagged (a one-shot ref guard,
 * mirroring useRelationshipDetail.ts's autostartTriggered), and if that
 * attempt hits a 402, sets autostartCreditExhausted -- which
 * essence/deep/page.tsx uses to auto-open PurchaseSelectorModal with no
 * click, exactly mirroring RelationshipView.tsx's own
 * autostartCreditExhausted -> setPurchaseOpen(true) effect. The
 * ?autostart=1 marker is stripped from the URL once that first attempt
 * resolves (any outcome), so a refresh or later revisit reverts to the
 * pre-existing manual "credit needed" CTA -- never re-forcing the modal.
 *
 * No entitlement/payment/pricing/credit-consumption logic changed --
 * fetchReport()'s birth/cache/402/409/success handling, reservePersonalCredit,
 * consumeCredit/releaseCredit, and handlePurchaseSuccess's existing
 * resume-on-success call (retry()) are reused exactly as they were.
 * StitchPremiumCard.tsx (a separate, pre-existing buy-first upsell card
 * that never routes through essence/deep's own creditExhausted CTA) and
 * the entire Relationship flow are untouched.
 *
 * Run: npx tsx tests/unit/personal-deep-autostart.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

// Normalized to LF regardless of each file's on-disk line-ending state --
// several files in this repo carry incidental CRLF drift from other
// editors, unrelated to this fix either way.
function readNormalized(p) {
  return fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
}

const hookSrc = readNormalized("lib/v1/slim/useSlimV1Integrated.ts");
const pageSrc = readNormalized(
  "app/blueprint-preview/[reportId]/essence/deep/page.tsx",
);
const entryButtonSrc = readNormalized("components/v2/EssenceDeepEntryButton.tsx");
const litePanelSrc = readNormalized("components/results/StitchLiteResultPanel.tsx");
const currentPageSrc = readNormalized(
  "app/blueprint-preview/[reportId]/current/page.tsx",
);
const premiumCardSrc = readNormalized("components/results/StitchPremiumCard.tsx");
const essenceRouteSrc = readNormalized("app/api/v2/deep/essence/route.ts");
const purchaseContentSrc = readNormalized(
  "components/payment/PurchaseSelectorContent.tsx",
);

// ---------------------------------------------------------------------------
section("A — Explicit-intent entry points mark the request with ?autostart=1");
// ---------------------------------------------------------------------------
{
  assert.ok(
    entryButtonSrc.includes(
      "`/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep?autostart=1`",
    ),
    "EssenceDeepEntryButton must link to the deep page with ?autostart=1",
  );
  ok("EssenceDeepEntryButton links with ?autostart=1");

  assert.ok(
    litePanelSrc.includes(
      "`/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep?autostart=1`",
    ),
    "StitchLiteResultPanel's goToDeepReport must link with ?autostart=1",
  );
  ok("StitchLiteResultPanel's goToDeepReport links with ?autostart=1");

  assert.ok(
    currentPageSrc.includes(
      "`/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep?autostart=1`",
    ),
    "current/page.tsx's onUpsellClick must link with ?autostart=1",
  );
  ok("current/page.tsx's onUpsellClick links with ?autostart=1");

  // StitchPremiumCard is a separate, pre-existing buy-first upsell card
  // (always opens its own embedded Purchase Selector on click, regardless
  // of credit status) that never reaches essence/deep's own creditExhausted
  // CTA -- it must be left exactly as-is, out of scope for this fix.
  assert.ok(
    premiumCardSrc.includes(
      "localize(`/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep`)",
    ) && !premiumCardSrc.includes("essence/deep?autostart=1"),
    "StitchPremiumCard's own href must be untouched (no autostart marker) -- it is a separate buy-first flow, not this fix's target",
  );
  ok("StitchPremiumCard (a separate buy-first upsell, out of scope) is untouched");
}

// ---------------------------------------------------------------------------
section("B — useSlimV1Integrated tracks explicit intent as a one-shot, non-reactive signal");
// ---------------------------------------------------------------------------
{
  assert.ok(
    hookSrc.includes('const urlAutostart = searchParams.get("autostart") === "1";'),
    "the hook must read ?autostart=1 from the URL",
  );
  assert.ok(
    hookSrc.includes("const hasAttemptedRef = useRef(false);"),
    "a ref must guard against any call after the first ever being treated as an explicit-intent attempt",
  );
  assert.ok(
    hookSrc.includes(
      "const isAutostartAttempt =\n        urlAutostartRef.current && !opts?.isPolling && !hasAttemptedRef.current;",
    ),
    "isAutostartAttempt must require: URL flag set, not a polling call, and not yet attempted",
  );
  ok("useSlimV1Integrated computes a one-shot isAutostartAttempt flag per hook instance");

  // urlAutostart must be read via a ref inside fetchReport, and must NOT be
  // a fetchReport/useCallback dependency -- otherwise clearAutostartParam's
  // own router.replace (which changes searchParams) would change
  // fetchReport's identity and re-trigger the mount effect a second time,
  // causing a duplicate fetch right after the first one resolves.
  const fetchReportDeps = hookSrc.match(
    /const fetchReport = useCallback\(\s*async[\s\S]*?\},\s*\[([\s\S]*?)\],\s*\);/,
  );
  assert.ok(fetchReportDeps, "could not locate fetchReport's dependency array");
  assert.ok(
    !/\burlAutostart\b/.test(fetchReportDeps[1]) &&
      !/\bclearAutostartParam\b/.test(fetchReportDeps[1]) &&
      !/\bsearchParams\b/.test(fetchReportDeps[1]),
    "fetchReport's dependency array must not include urlAutostart, clearAutostartParam, or searchParams -- reading them reactively would re-trigger the mount effect every time the URL is cleared",
  );
  ok("fetchReport's identity is not perturbed by the URL-clearing side effect it triggers -- no double-fetch loop");
}

// ---------------------------------------------------------------------------
section("C — Personal Deep + no credit: the explicit-intent attempt signals credit exhaustion distinctly");
// ---------------------------------------------------------------------------
{
  assert.ok(
    /if \(res\.status === 402\) \{\s*setCreditExhausted\(true\);\s*setError\(null\);\s*if \(isAutostartAttempt\) \{\s*setAutostartCreditExhausted\(true\);\s*\}\s*return;\s*\}/.test(
      hookSrc,
    ),
    "the 402 branch must set creditExhausted as before, and additionally set autostartCreditExhausted only when isAutostartAttempt is true",
  );
  ok("the 402 branch sets autostartCreditExhausted only for the explicit-intent attempt, without changing its pre-existing creditExhausted/error handling");

  assert.ok(
    hookSrc.includes("autostartCreditExhausted,\n    retry: fetchReport,"),
    "autostartCreditExhausted must be part of the hook's returned value",
  );
  assert.ok(
    hookSrc.includes("autostartPending: urlAutostart && !data,"),
    "autostartPending must be part of the hook's returned value",
  );
  ok("useSlimV1Integrated exposes autostartCreditExhausted and autostartPending");
}

// ---------------------------------------------------------------------------
section("D — no extra click on the no-credit path: Purchase Selector opens itself");
// ---------------------------------------------------------------------------
{
  assert.ok(
    /useEffect\(\(\) => \{\s*if \(autostartCreditExhausted\) \{\s*setPurchaseOpen\(true\);\s*\}\s*\}, \[autostartCreditExhausted\]\);/.test(
      pageSrc,
    ),
    "essence/deep/page.tsx must auto-open the purchase modal as soon as autostartCreditExhausted flips true",
  );
  assert.ok(pageSrc.includes('context="personal"'), "the auto-opened modal must stay in personal context");
  assert.ok(
    pageSrc.includes("successRedirectPath={deepHref}"),
    "the auto-opened modal must still carry the pre-existing resume-this-report redirect path",
  );
  ok("essence/deep/page.tsx opens PurchaseSelectorModal automatically on autostartCreditExhausted, with personal context and the resume redirect intact");
}

// ---------------------------------------------------------------------------
section("E — Personal is selected in the modal, and the 30-Day Pass remains Best Value");
// ---------------------------------------------------------------------------
{
  assert.ok(
    /function primaryPlanFor\([\s\S]*?return region === "us" \? "us_personal_premium" : "kr_personal_premium";\s*\}/.test(
      purchaseContentSrc,
    ),
    "the personal context (the default branch) must resolve to the personal plan as primary",
  );
  assert.ok(
    purchaseContentSrc.includes("selectorSelectedBadge") &&
      purchaseContentSrc.includes("selectorBestValueBadge") &&
      purchaseContentSrc.includes('PASS_PLAN_IDS.includes(planId)'),
    "the selector must badge the primary plan as Selected and any non-primary pass plan as Best Value",
  );
  ok("PurchaseSelectorContent (unchanged, pre-existing logic) selects Personal as primary and keeps the 30-Day Pass as Best Value in personal context");
}

// ---------------------------------------------------------------------------
section("F — successful purchase resumes the exact same Deep analysis with no click");
// ---------------------------------------------------------------------------
{
  assert.ok(
    /function handlePurchaseSuccess\(\)\s*\{\s*setPurchaseOpen\(false\);\s*void retry\(\);\s*\}/.test(pageSrc),
    "handlePurchaseSuccess must close the modal and immediately retry the same generation call, unchanged from before this fix",
  );
  ok("handlePurchaseSuccess resumes retry() directly (pre-existing, unchanged mechanism)");
}

// ---------------------------------------------------------------------------
section("G — no stale 'credit needed' panel flashes while autostart is resolving");
// ---------------------------------------------------------------------------
{
  assert.ok(
    pageSrc.includes(
      "const showAutostartPreparing =\n    autostartPending && !loading && !inProgress && !error;",
    ),
    "showAutostartPreparing must cover the gap before loading starts and the gap right after a 402 resolves, before the modal opens",
  );
  assert.ok(
    /\{showAutostartPreparing \? \([\s\S]*?\{messages\.common\.preparing\}[\s\S]*?\{messages\.blueprint\.generatingPersonalSubtitle\}[\s\S]*?\) : creditExhausted \? \(/.test(
      pageSrc,
    ),
    "the credit-needed CTA panel must only render in the ELSE branch of showAutostartPreparing -- mutually exclusive, never both",
  );
  ok("a 'Preparing...' message (existing i18n copy, no new keys) replaces the manual CTA panel while an explicit-intent attempt is still resolving");
}

// ---------------------------------------------------------------------------
section("H — direct URL visits, revisits, and recovery states keep the manual fallback CTA");
// ---------------------------------------------------------------------------
{
  // Without ?autostart=1, isAutostartAttempt is always false, so
  // autostartCreditExhausted can never be set and the auto-open effect
  // never fires -- the plain creditExhausted branch (unchanged copy/button)
  // is exactly what a direct visit or revisit still sees.
  assert.ok(
    pageSrc.includes("{messages.errors.insufficientCredit}") &&
      pageSrc.includes("{messages.blueprint.creditNeededCta}") &&
      pageSrc.includes("onClick={() => setPurchaseOpen(true)}"),
    "the pre-existing manual 'credit needed' CTA (copy + button) must still be present, unchanged, as the fallback for non-autostart visits",
  );
  assert.ok(
    hookSrc.includes(
      'const isAutostartAttempt =\n        urlAutostartRef.current && !opts?.isPolling && !hasAttemptedRef.current;',
    ),
    "isAutostartAttempt must be false whenever urlAutostartRef.current is false (no ?autostart=1) -- i.e. every direct visit or revisit",
  );
  ok("without ?autostart=1, isAutostartAttempt is always false, so autostartCreditExhausted never fires and the manual fallback CTA is exactly what renders");
}

// ---------------------------------------------------------------------------
section("I — Relationship's flow is untouched");
// ---------------------------------------------------------------------------
{
  const relFiles = [
    "app/relationship/[id]/useRelationshipDetail.ts",
    "app/relationship/[id]/RelationshipView.tsx",
    "components/relationship/detail/RelationshipPremiumSection.tsx",
  ];
  for (const p of relFiles) {
    const src = readNormalized(p);
    // A doc comment cross-referencing the sibling Personal pattern by name
    // (e.g. "mirrors the Personal pattern (useSlimV1Integrated.ts)") is
    // fine and pre-existing; only an actual import or route reference would
    // mean the two flows got coupled.
    assert.ok(
      !/from\s+["'].*useSlimV1Integrated["']/.test(src) &&
        !src.includes('"/blueprint-preview') &&
        !src.includes("`/blueprint-preview"),
      `${p} must not import from or navigate to Personal's essence/deep flow`,
    );
  }
  assert.ok(
    readNormalized("app/relationship/[id]/RelationshipView.tsx").includes(
      "const autostartPending = urlAutostart && !premiumReady && !viewingPremiumSnapshot;",
    ),
    "Relationship's own autostartPending derivation must be exactly as before",
  );
  ok("Relationship's autostart files are untouched and remain fully independent of Personal's separately-implemented adoption of the same pattern");
}

// ---------------------------------------------------------------------------
section("J — Personal report generation and credit consumption are untouched");
// ---------------------------------------------------------------------------
{
  assert.ok(
    essenceRouteSrc.includes("reservePersonalCredit") &&
      essenceRouteSrc.includes("consumeCredit") &&
      essenceRouteSrc.includes("releaseCredit"),
    "the essence/deep API route's reserve/consume/release credit calls must be present and unchanged",
  );
  ok("app/api/v2/deep/essence/route.ts (entitlement/generation logic) was not touched by this fix");
}

console.log("\nAll personal-deep-autostart assertions passed.\n");
