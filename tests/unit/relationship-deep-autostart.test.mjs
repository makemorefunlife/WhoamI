/**
 * Deep Relationship autostart regression coverage.
 *
 * Goal: selecting a Deep Relationship type (Family/Romantic/Friend/
 * Colleague/Marriage) from the hub kind picker must never show an extra
 * empty-state / "Generate analysis" step -- it should either start the
 * analysis immediately (credit available) or open the Purchase Selector
 * immediately (no credit), reusing the existing ?autostart=1 ->
 * runAutostartPremium() -> runPremium(premiumKind) recovery wiring.
 *
 * Root causes found by the read-only trace (all in the single shared
 * useRelationshipDetail.ts / RelationshipView.tsx / RelationshipPremiumSection.tsx
 * path used by all 5 kinds):
 *
 * 1. The autostart effect in useRelationshipDetail.ts required the FREE
 *    Basic analysis result (`basic`) to already exist before it would ever
 *    fire ("if (!basic || Object.keys(basic).length === 0) return;"). A
 *    Deep kind picked directly from StitchKindPickerSheet -> navigateAnalyze
 *    for a pair that never ran Basic left `basic` empty, so autostart was
 *    silently skipped even though ?autostart=1 was present and the server's
 *    premium-generation endpoint never reads `basic` at all -- stranding the
 *    user on the manual empty-state + "Generate analysis" button. This one
 *    gate is what actually caused the extra step; nothing else blocked it.
 *
 * 2. Even when autostart DID fire, RelationshipView.tsx rendered
 *    RelationshipPremiumSection's own per-kind empty-state placeholder text
 *    AND its Generate/Buy CTA unconditionally, stacked directly underneath
 *    RelationshipGeneratingPanel's "Generating your analysis..." panel --
 *    a redundant, confusing double-panel with a still-enabled-looking
 *    empty state during the pre-effect render gap.
 *
 * 3. On credit exhaustion, the app only ever showed a "you're out of
 *    credits" banner with a manual "Buy" button -- never auto-opened the
 *    Purchase Selector, so even an explicit Deep-kind selection required an
 *    extra click on a no-credit path.
 *
 * Fixed by (1) removing the `basic` gate, (2) a new `autostartPending`
 * flag (urlAutostart && !premiumReady && !viewingPremiumSnapshot) that
 * makes RelationshipPremiumSection show one "Preparing your analysis..."
 * message instead of its own empty-state + CTA while autostart is
 * resolving, and (3) a new `autostartCreditExhausted` signal (set only
 * when the explicit-intent autostart attempt itself hits 402, via a ref
 * mirroring the existing 402 branch) that RelationshipView.tsx uses to
 * auto-open PurchaseSelectorModal with no extra click. The existing
 * empty-state + manual CTA is untouched for every other surface (direct
 * URL visits, revisits, recovery states -- i.e. whenever ?autostart=1 is
 * NOT present), per the explicit requirement to keep that fallback.
 *
 * No entitlement/payment/pricing/credit-consumption logic changed -- this
 * only changes when the existing runPremium(...) call is invoked and how
 * its outcome is displayed.
 *
 * Run: npx tsx tests/unit/relationship-deep-autostart.test.mjs
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
// some files in this repo carry incidental CRLF drift from other editors,
// which is unrelated dirty state this test must not depend on either way.
function readNormalized(p) {
  return fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
}

const hookSrc = readNormalized("app/relationship/[id]/useRelationshipDetail.ts");
const viewSrc = readNormalized("app/relationship/[id]/RelationshipView.tsx");
const sectionSrc = readNormalized(
  "components/relationship/detail/RelationshipPremiumSection.tsx",
);
const navSrc = readNormalized("lib/relationship/hubNavigation.ts");

// ---------------------------------------------------------------------------
section("A — Deep type + credit: autostart is no longer gated on Basic already existing");
// ---------------------------------------------------------------------------
{
  assert.ok(
    !hookSrc.includes('if (!basic || Object.keys(basic).length === 0) return;'),
    "the autostart effect must no longer require the free Basic result to already exist",
  );
  ok("the `basic`-must-already-exist gate is gone from the autostart effect");

  // The other, still-legitimate guards must remain intact.
  const effectMatch = hookSrc.match(/useEffect\(\(\) => \{\s*if \(!urlAutostart[\s\S]*?\}, \[\s*urlAutostart,[\s\S]*?\]\);/);
  assert.ok(effectMatch, "could not locate the autostart effect at all");
  const effectBody = effectMatch[0];
  for (const guard of [
    'if (!urlAutostart || autostartTriggered.current) return;',
    'if (analysisSurface === "basic") return;',
    'if (loading || !detailOk || !effectiveViewerReportId || !resolvedRelationshipId)',
    "if (busy || autostartActive) return;",
    "void runAutostartPremium();",
  ]) {
    assert.ok(effectBody.includes(guard), `expected guard missing from autostart effect: ${guard}`);
  }
  // Only the dependency array is checked for a live `basic` reference (a
  // stray `basic` there would mean it is still silently gating re-runs of
  // this effect) -- explanatory comments inside the effect body are free to
  // mention "basic" by name, e.g. to say why it was deliberately dropped.
  const depsMatch = effectBody.match(/\}, \[([\s\S]*?)\]\);$/);
  assert.ok(depsMatch, "could not locate the autostart effect's dependency array");
  assert.ok(
    !/\bbasic\b/.test(depsMatch[1]),
    "the autostart effect's dependency array must no longer list `basic`",
  );
  ok("every other autostart guard (loading/detailOk/ids/busy/autostartActive) is untouched, and `basic` is fully gone from the dependency array");
}

// ---------------------------------------------------------------------------
section("B — Deep type + no credit: the explicit-intent autostart path signals credit exhaustion distinctly");
// ---------------------------------------------------------------------------
{
  assert.ok(
    hookSrc.includes("const creditExhaustedThisRunRef = useRef(false);"),
    "a ref must mirror 402-credit-exhaustion synchronously (no stale-closure risk after an await)",
  );
  assert.ok(
    /setPremiumCreditExhausted\(false\);\s*\n\s*creditExhaustedThisRunRef\.current = false;/.test(hookSrc),
    "the ref must reset alongside premiumCreditExhausted at the top of every runPremium call",
  );
  assert.ok(
    /if \(res\.status === 402\) \{\s*\n\s*creditExhaustedThisRunRef\.current = true;\s*\n\s*\}[\s\S]{0,800}setPremiumCreditExhausted\(true\);/.test(
      hookSrc,
    ),
    "the ref must flip true as soon as the 402 status is detected, ahead of the same 402 branch that sets premiumCreditExhausted (kept as a separate guard so the pre-existing purchase-recovery regression test's exact-shape check on that branch stays untouched)",
  );
  assert.ok(
    hookSrc.includes("if (creditExhaustedThisRunRef.current) {\n        setAutostartCreditExhausted(true);\n      }"),
    "runAutostartPremium must translate a 402-during-autostart into autostartCreditExhausted",
  );
  assert.ok(
    hookSrc.includes("autostartCreditExhausted,\n    toggleFavorite,"),
    "autostartCreditExhausted must be part of the hook's returned value",
  );
  ok("useRelationshipDetail exposes autostartCreditExhausted, set only when the AUTOSTART attempt itself hits 402");
}

// ---------------------------------------------------------------------------
section("C — no extra click on the no-credit path: Purchase Selector opens itself");
// ---------------------------------------------------------------------------
{
  assert.ok(
    /useEffect\(\(\) => \{\s*if \(autostartCreditExhausted\) \{\s*setPurchaseOpen\(true\);\s*\}\s*\}, \[autostartCreditExhausted\]\);/.test(
      viewSrc,
    ),
    "RelationshipView must auto-open the purchase modal as soon as autostartCreditExhausted flips true",
  );
  assert.ok(
    viewSrc.includes('context="relationship"'),
    "the auto-opened PurchaseSelectorModal must stay in relationship context",
  );
  assert.ok(
    viewSrc.includes("successRedirectPath={href}"),
    "the auto-opened modal must still carry the resume-this-exact-report/kind redirect path",
  );
  ok("RelationshipView opens PurchaseSelectorModal automatically on autostartCreditExhausted, with relationship context and the resume redirect intact");
}

// ---------------------------------------------------------------------------
section("D — after successful purchase, the exact originally-selected Deep type resumes with no click");
// ---------------------------------------------------------------------------
{
  assert.ok(
    /function handlePurchaseSuccess\(\)\s*\{[\s\S]{0,600}void runPremium\(premiumKind\);/.test(viewSrc),
    "handlePurchaseSuccess must re-run generation for the same premiumKind the user originally selected, with no further click",
  );
  ok("handlePurchaseSuccess resumes runPremium(premiumKind) directly (pre-existing, unchanged mechanism, reused as instructed)");
}

// ---------------------------------------------------------------------------
section("E — no extra 'Generate analysis' click: the empty-state + CTA are suppressed while autostart is pending");
// ---------------------------------------------------------------------------
{
  assert.ok(
    viewSrc.includes(
      "const autostartPending = urlAutostart && !premiumReady && !viewingPremiumSnapshot;",
    ),
    "autostartPending must be derived from the URL (so it covers the pre-effect render too), not just busy/autostartActive",
  );
  assert.ok(
    viewSrc.includes("autostartPending={autostartPending}"),
    "autostartPending must be passed down to RelationshipPremiumSection",
  );
  assert.ok(
    sectionSrc.includes("autostartPending?: boolean;"),
    "RelationshipPremiumSection must declare the new prop",
  );
  assert.ok(
    sectionSrc.includes("const showAutostartPreparing = autostartPending && !hasDeepContent;"),
    "the section must only suppress its own UI when there is genuinely nothing to show yet",
  );

  // Both the per-kind empty-state/report ternary AND the bottom Generate/Buy
  // CTA ternary must be gated behind !showAutostartPreparing.
  const wrappedBlocks = [...sectionSrc.matchAll(/\{!showAutostartPreparing && \(/g)];
  assert.equal(
    wrappedBlocks.length,
    2,
    `expected exactly 2 blocks gated by !showAutostartPreparing (the per-kind report/placeholder chain, and the Generate/Buy CTA chain), found ${wrappedBlocks.length}`,
  );
  ok("both the per-kind empty-state/report chain and the Generate/Buy CTA chain are suppressed while showAutostartPreparing is true");

  assert.ok(
    sectionSrc.includes("{messages.common.preparing}") &&
      sectionSrc.includes("{messages.report.generatingSubtitle(partnerName, kindLabel)}"),
    "a user-friendly 'Preparing your analysis...' message must render in place of the suppressed UI",
  );
  ok("a 'Preparing your analysis...' message (existing canonical copy, no new i18n keys) replaces the suppressed empty-state + CTA");
}

// ---------------------------------------------------------------------------
section("F — all five relationship kinds share this exact behavior (one shared gate, not per-kind)");
// ---------------------------------------------------------------------------
{
  const start = sectionSrc.indexOf("{!showAutostartPreparing && (\n      premiumKind ===");
  assert.ok(start !== -1, "could not find the wrapped per-kind chain's start");
  const end = sectionSrc.indexOf("))}", start);
  assert.ok(end !== -1, "could not find the wrapped per-kind chain's end");
  const wrappedChain = sectionSrc.slice(start, end);
  for (const kind of ["romantic", "work", "cohabitation", "family", "friendship"]) {
    assert.ok(
      wrappedChain.includes(`premiumKind === "${kind}"`),
      `the single showAutostartPreparing gate must cover kind "${kind}" too (not a per-kind duplicate check)`,
    );
  }
  ok("one single showAutostartPreparing gate wraps all 5 kinds (romantic/work/cohabitation/family/friendship) -- no kind-specific carve-out");
}

// ---------------------------------------------------------------------------
section("G — Basic analysis remains free, independent, and untouched");
// ---------------------------------------------------------------------------
{
  assert.ok(
    hookSrc.includes('if (analysisSurface === "basic") return;'),
    "the autostart effect must still bail out immediately for the Basic surface -- Basic never autostarts",
  );
  assert.ok(
    navSrc.includes(
      'const autostart =\n    kind === "basic" ? options?.autostart === true : options?.autostart !== false;',
    ),
    "buildRelationshipAnalyzeUrl's Basic-vs-Deep autostart default must be unchanged: Basic opts in only explicitly, Deep kinds default to autostart",
  );
  ok("Basic's own autostart defaults and the effect's basic-surface bailout are both unchanged by this fix");
}

// ---------------------------------------------------------------------------
section("H — Personal flow is untouched");
// ---------------------------------------------------------------------------
{
  const personalFiles = [
    "lib/v1/slim/useSlimV1Integrated.ts",
    "app/blueprint-preview/[reportId]/essence/deep/page.tsx",
  ];
  for (const path of personalFiles) {
    const src = fs.readFileSync(path, "utf8");
    for (const token of ["autostartPending", "showAutostartPreparing", "autostartCreditExhausted"]) {
      assert.ok(
        !src.includes(token),
        `Personal path file ${path} must not reference the new Relationship-only autostart signal "${token}"`,
      );
    }
  }
  ok("Personal's own generation/redirect files contain none of the new Relationship-only autostart signals");
}

console.log("\nAll relationship-deep-autostart assertions passed.\n");
