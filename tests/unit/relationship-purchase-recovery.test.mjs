/**
 * Relationship purchase recovery + localization -- regression tests.
 *
 * Background: live QA after the Phase 1/2 work found Personal purchase
 * recovery working correctly, but Relationship broken in three ways:
 *
 *   A. Romantic (and every other kind): a real 402 (insufficient
 *      Relationship credit) set BOTH premiumCreditExhausted=true AND the
 *      generic `err` state. RelationshipView's top-level `{err ? ...}`
 *      banner (wired to retryAnalysis -> ensureBasic, the free/basic
 *      flow -- not a purchase action) rendered on top of / instead of
 *      RelationshipPremiumSection's own creditExhausted -> Purchase
 *      Selector CTA, producing a dead-end "out of credits, try again"
 *      with no way to actually buy. Personal's useSlimV1Integrated.ts
 *      already gets this right: its 402 branch clears `error` in the
 *      same breath it sets `creditExhausted`.
 *
 *   B. Family (and every kind): successRedirectPath was missing
 *      entirely (fixed in a prior commit) and, once added, still didn't
 *      carry autostart=1 -- so if Paddle's own successUrl redirect wins
 *      the race against the in-page onSuccess callback, the user lands
 *      back on the exact report/kind but generation never resumes on
 *      its own, requiring a second manual click. Personal doesn't need
 *      this flag (its own canGenerate effect auto-fetches once
 *      entitled); Relationship's equivalent is the existing
 *      ?autostart=1 -> runAutostartPremium() -> runPremium(premiumKind)
 *      wiring, previously only reachable from the survey handoff.
 *
 *   C. English UI still showed Korean kind-tab labels (가족/연인/친구/
 *      동료/부부) because RelationshipKindTabs.tsx called
 *      relationshipKindBadgeLabel(resolved) without its optional
 *      `messages` argument, silently falling back to the function's
 *      hardcoded-Korean default. RelationshipKindBadge.tsx (a sibling
 *      component) already passed `messages` correctly -- this was the
 *      only call site missing it.
 *
 * This suite is a static source/catalog check in the same style as
 * checkout-success-redirect.test.mjs (no DOM/window/Paddle/Clerk --
 * this repo's test suite has no jsdom/React-rendering infra).
 *
 * Run: npx tsx tests/unit/relationship-purchase-recovery.test.mjs
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

section("A. No Relationship credit -> purchase recovery, not a dead-end error");
{
  const hookSrc = readSrc("app/relationship/[id]/useRelationshipDetail.ts");

  const status402Block =
    /if\s*\(res\.status === 402\)\s*\{\s*(?:\/\/[^\n]*\n\s*)*setPremiumCreditExhausted\(true\);\s*setErr\(null\);\s*return false;\s*\}/;
  assert.ok(
    status402Block.test(hookSrc),
    "runPremium's 402 branch must set premiumCreditExhausted and clear err in the same branch (mirrors Personal's useSlimV1Integrated.ts), so the top-level error banner never masks the Purchase Selector CTA",
  );
  ok("runPremium clears err on 402 -- the credit-exhausted CTA path is no longer masked");

  const personalSrc = readSrc("lib/v1/slim/useSlimV1Integrated.ts");
  assert.ok(
    /res\.status === 402[\s\S]{0,80}setCreditExhausted\(true\);\s*setError\(null\);/.test(personalSrc),
    "Personal's own 402 handling (the canonical reference) must still clear error alongside creditExhausted",
  );
  ok("Personal's 402 handling (the pattern Relationship now mirrors) is unchanged");

  const sectionSrc = readSrc("components/relationship/detail/RelationshipPremiumSection.tsx");
  assert.ok(
    /!premiumReady && !hasSnapshotView && creditExhausted && onOpenPurchase/.test(sectionSrc),
    "RelationshipPremiumSection must still gate the Purchase Selector CTA on creditExhausted + onOpenPurchase",
  );
  assert.ok(
    /onClick=\{onOpenPurchase\}/.test(sectionSrc),
    "the creditExhausted CTA button must call onOpenPurchase (opens the Purchase Selector)",
  );
  ok("RelationshipPremiumSection's creditExhausted branch opens the Purchase Selector via onOpenPurchase");
}

section("B. Successful Relationship purchase -> original premium kind resumes automatically");
{
  const viewSrc = readSrc("app/relationship/[id]/RelationshipView.tsx");
  assert.ok(
    /function handlePurchaseSuccess\(\)\s*\{\s*setPurchaseOpen\(false\);[\s\S]{0,400}void runPremium\(premiumKind\);/.test(viewSrc),
    "handlePurchaseSuccess must close the modal and immediately retry runPremium(premiumKind) -- no second manual click",
  );
  ok("handlePurchaseSuccess resumes the exact premium kind that was being purchased");

  assert.ok(
    /onSuccess=\{handlePurchaseSuccess\}/.test(viewSrc),
    "PurchaseSelectorModal must be wired to handlePurchaseSuccess",
  );
  ok("PurchaseSelectorModal's onSuccess is wired to the auto-resume handler");
}

section("C. Redirect recovery -- exact relationship report + kind preserved, and resumable");
{
  const viewSrc = readSrc("app/relationship/[id]/RelationshipView.tsx");
  const routesSrc = readSrc("constants/routes.ts");

  assert.ok(
    /import \{ ROUTES, relationshipDetailRoute \} from "@\/constants\/routes";/.test(viewSrc),
    "RelationshipView must import relationshipDetailRoute to build a report-specific redirect href",
  );
  const hrefBlock =
    /const href = localize\(\s*relationshipDetailRoute\(\{\s*relationshipReportId,\s*viewerReportId,\s*kind: premiumKind,\s*autostart: true,\s*\}\),\s*\);/;
  assert.ok(
    hrefBlock.test(viewSrc),
    "href must be built from relationshipReportId + viewerReportId + kind (this exact report/kind) AND autostart: true (so a redirect-race landing resumes generation on its own, not just the right page)",
  );
  ok("RelationshipView builds a report+kind-specific, autostart-enabled redirect href");

  assert.ok(
    /successRedirectPath=\{href\}/.test(viewSrc),
    "PurchaseSelectorModal must receive this href as successRedirectPath",
  );
  ok("successRedirectPath is wired to the report+kind-specific href");

  assert.ok(
    /autostart\?: boolean;/.test(routesSrc),
    "relationshipDetailRoute must accept an autostart flag",
  );
  ok("relationshipDetailRoute supports the autostart flag this fix relies on");

  const hookSrc = readSrc("app/relationship/[id]/useRelationshipDetail.ts");
  assert.ok(
    /if \(!urlAutostart \|\| autostartTriggered\.current\) return;[\s\S]{0,400}void runAutostartPremium\(\);/.test(hookSrc),
    "the existing ?autostart=1 effect must still drive runAutostartPremium() -> runPremium(premiumKind) on landing",
  );
  ok("landing with ?autostart=1 still auto-resumes runPremium(premiumKind) -- reused, not reimplemented");
}

section("D. All five Relationship kinds share one entitlement gate -- no per-kind bypass");
{
  const routeSrc = readSrc("app/api/relationship/analyze/premium/route.ts");

  const reserveCount = (routeSrc.match(/reserveRelationshipCredit\(/g) ?? []).length;
  const releaseCount = (routeSrc.match(/releaseRelationshipCredit\(/g) ?? []).length;
  assert.equal(reserveCount, 1, "reserveRelationshipCredit must be called exactly once -- one shared gate, not a per-kind copy");
  assert.equal(releaseCount, 2, "releaseRelationshipCredit must be called from exactly the two shared paths (402 path, and the shared not-generationSucceeded cleanup) -- not duplicated per kind");
  ok("credit reservation/release is a single shared gate, not five separate implementations");

  const reserveIdx = routeSrc.indexOf("reserveRelationshipCredit(");
  for (const kind of ["romantic", "work", "cohabitation", "family", "friendship"]) {
    const dispatchIdx = routeSrc.indexOf(`if (kind === "${kind}")`);
    assert.ok(dispatchIdx > reserveIdx, `${kind}: its generation branch must come AFTER the shared credit reservation, so it cannot bypass the entitlement check`);
    ok(`${kind}: generation only proceeds after the shared entitlement gate`);
  }

  const generationSucceededSets = (routeSrc.match(/generationSucceeded = true;/g) ?? []).length;
  assert.equal(generationSucceededSets, 5, "all five kinds must set the same generationSucceeded flag that the shared release-on-failure cleanup reads");
  ok("all five kinds report success through the same generationSucceeded flag the shared cleanup relies on");
}

section("E. English locale renders English relationship-kind labels");
{
  const enSrc = readSrc("lib/i18n/messages/en-US.ts");
  const expectedEn = {
    kindBadgeFamily: "Family",
    kindBadgeRomantic: "Romantic",
    kindBadgeFriendship: "Friend",
    kindBadgeWork: "Colleague",
    kindBadgeCohabitation: "Marriage",
  };
  for (const [key, value] of Object.entries(expectedEn)) {
    assert.ok(
      enSrc.includes(`${key}: "${value}"`),
      `en-US.ts must define ${key} as "${value}"`,
    );
    ok(`en-US: ${key} = "${value}"`);
  }

  const tabsSrc = readSrc("components/relationship/RelationshipKindTabs.tsx");
  assert.ok(
    /relationshipKindBadgeLabel\(resolved, messages\)/.test(tabsSrc),
    "RelationshipKindTabs must pass messages into relationshipKindBadgeLabel -- omitting it silently falls back to the hardcoded-Korean default",
  );
  ok("RelationshipKindTabs passes the locale's messages into relationshipKindBadgeLabel");

  const badgeSrc = readSrc("lib/relationship/relationshipKindBadge.ts");
  assert.ok(
    /if \(messages\) \{[\s\S]{0,400}return map\[kind\];\s*\}/.test(badgeSrc),
    "relationshipKindBadgeLabel must resolve through the message catalog whenever messages is supplied",
  );
  ok("relationshipKindBadgeLabel resolves via the message catalog when given messages");
}

section("F. Korean locale renders Korean relationship-kind labels");
{
  const koSrc = readSrc("lib/i18n/messages/ko-KR.ts");
  const expectedKo = {
    kindBadgeFamily: "가족",
    kindBadgeRomantic: "연인",
    kindBadgeFriendship: "친구",
    kindBadgeWork: "동료",
    kindBadgeCohabitation: "부부",
  };
  for (const [key, value] of Object.entries(expectedKo)) {
    assert.ok(
      koSrc.includes(`${key}: "${value}"`),
      `ko-KR.ts must define ${key} as "${value}"`,
    );
    ok(`ko-KR: ${key} = "${value}"`);
  }
}

section("G. Personal checkout/navigation untouched by this fix");
{
  for (const [label, relPath] of [
    ["StitchPremiumCard", "components/results/StitchPremiumCard.tsx"],
    ["essence/deep page", "app/blueprint-preview/[reportId]/essence/deep/page.tsx"],
    ["PurchaseSelectorModal", "components/payment/PurchaseSelectorModal.tsx"],
    ["PurchaseSelectorContent", "components/payment/PurchaseSelectorContent.tsx"],
    ["useRegionalCheckout", "lib/payment/useRegionalCheckout.ts"],
  ]) {
    // Presence checks only (not diffed against a prior snapshot) -- this
    // suite runs standalone. checkout-success-redirect.test.mjs is the
    // one that actually pins StitchPremiumCard/PurchaseSelectorModal/
    // PurchaseSelectorContent/useRegionalCheckout wiring byte-for-byte;
    // this is a lightweight sanity check that this fix's edits stayed
    // out of the Personal path entirely.
    const src = readSrc(relPath);
    assert.ok(
      !src.includes("relationshipDetailRoute"),
      `${label}: must not reference relationshipDetailRoute -- that's Relationship-only`,
    );
    ok(`${label}: no Relationship-specific redirect logic leaked into the Personal path`);
  }
}
