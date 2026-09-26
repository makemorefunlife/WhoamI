/**
 * Phase 2 -- regression tests for the entitlement/UI work that builds on
 * top of Phase 1's credit-reservation gate (see phase1-entitlement-gate.test.mjs).
 *
 * Covers, per the Phase 2 scope:
 *  A. 1-year expiry for new Personal/Relationship single-purchase credits
 *     and the KR Relationship Triple, via the additive migration, while the
 *     30-Day Pass branches and the two deliberately-out-of-scope permanent
 *     grants (us_additional_relationship, Annual's term_personal_credit)
 *     stay untouched.
 *  B. getCreditLotSummary (My Access / overlap-notice data source).
 *  C. getDecisionJournalAccess now also recognizes a KR 30-Day Pass.
 *  D. /api/account/entitlements read-only summary route.
 *  E. countAllDecisionEntries (whole-account Decision Journal count).
 *  F. Decision Journal 20-entry cap + unlimited override wiring.
 *  G. Purchase Selector context-aware badges, Pass "Best value" badge,
 *     already-have-access notice, savingsNote rendering.
 *  H. RegionalPricingCards savingsNote rendering.
 *  I. Message catalog additions in both locales (+ type parity), including
 *     the exact required savings copy and the Annual early-access removal.
 *  J. Account billing page's new "My Access" section.
 *
 * Same style as tests/unit/phase1-entitlement-gate.test.mjs: static source
 * checks (no jsdom/React-rendering infra in this repo), confirming actual
 * wiring rather than rendered output.
 *
 * Run: npx tsx tests/unit/phase2-entitlement-lifecycle.test.mjs
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

section("A. Migration: 1-year expiry for Personal/Relationship singles and KR Triple, everything else untouched");
{
  const src = readSrc(
    "supabase/migrations/20260926090000_single_purchase_and_triple_one_year_expiry.sql",
  );

  assert.ok(
    /create or replace function public\.process_us_purchase/i.test(src),
    "migration must replace process_us_purchase in place (no signature change / no DROP needed)",
  );
  ok("migration replaces process_us_purchase in place");

  assert.ok(
    /create or replace function public\.process_kr_purchase/i.test(src),
    "migration must replace process_kr_purchase in place (no signature change / no DROP needed)",
  );
  ok("migration replaces process_kr_purchase in place");

  // Each single-purchase / triple grant line must now carry the 1-year
  // expiry. We check for the specific grant_credit_lot call shape rather
  // than a bare "1 year" substring, since the doc comments also mention it.
  const oneYearGrants = [
    { label: "us_personal_premium -> personal x1 / 1 year", pattern: /'personal',\s*1,\s*'one_time_purchase',\s*v_grant_id,\s*v_now \+ interval '1 year'\)/ },
    { label: "us_relationship_premium -> relationship x1 / 1 year", pattern: /'relationship',\s*1,\s*'one_time_purchase',\s*v_grant_id,\s*v_now \+ interval '1 year'\)/ },
    { label: "kr_relationship_triple -> relationship x3 / 1 year", pattern: /'relationship',\s*3,\s*'one_time_purchase',\s*v_grant_id,\s*v_now \+ interval '1 year'\)/ },
  ];
  for (const { label, pattern } of oneYearGrants) {
    assert.ok(pattern.test(src), `migration must grant ${label}`);
    ok(`migration grants ${label}`);
  }

  // Both regions' single-purchase/triple branches appear -- count the 1-year
  // occurrences: us_personal, kr_personal (personal x1 pattern matches
  // twice), us_relationship, kr_relationship (relationship x1 pattern
  // matches twice), plus the KR triple (relationship x3, matches once).
  const personalOneYearCount = (src.match(/'personal',\s*1,\s*'one_time_purchase',\s*v_grant_id,\s*v_now \+ interval '1 year'\)/g) || []).length;
  const relationshipOneYearCount = (src.match(/'relationship',\s*1,\s*'one_time_purchase',\s*v_grant_id,\s*v_now \+ interval '1 year'\)/g) || []).length;
  assert.equal(personalOneYearCount, 2, "both us_personal_premium and kr_personal_premium must grant 1-year personal credit");
  ok("both US and KR Personal singles grant 1-year credit");
  assert.equal(relationshipOneYearCount, 2, "both us_relationship_premium and kr_relationship_premium must grant 1-year relationship credit");
  ok("both US and KR Relationship singles grant 1-year credit");

  // 30-Day Pass branches must be untouched (still 30 days, not 1 year).
  const passThirtyDayCount = (src.match(/v_now \+ interval '30 days'/g) || []).length;
  assert.ok(passThirtyDayCount >= 2, "the US and KR 30-Day Pass grants must still expire in 30 days, unchanged");
  ok("30-Day Pass grants (US and KR) remain unchanged at 30 days");

  // Deliberately out-of-scope permanent grants must remain permanent (null
  // expiry) -- named explicitly in the Phase 2 rules only for Personal/
  // Relationship singles and the KR Triple, not the additional-relationship
  // top-up or Annual's own welcome-gift term credit.
  assert.ok(
    src.includes("us_additional_relationship"),
    "migration must still carry the us_additional_relationship branch (copied verbatim, left permanent)",
  );
  ok("us_additional_relationship branch is present, left out of the 1-year change (deliberately out of Phase 2 scope)");

  assert.ok(
    src.includes("term_personal_credit") || src.includes("us_annual_membership"),
    "migration must still carry the Annual Membership welcome-gift/term-credit logic, left untouched",
  );
  ok("Annual Membership's own credit-grant logic is present and untouched");

  assert.ok(
    /-- .*(not applied to prod|production|Sera|supabase db push)/i.test(src) ||
      /not.*(apply|applied).*production/i.test(src),
    "migration file must document that it is not applied to Production by itself",
  );
  ok("migration documents that it is not applied to Production automatically");
}

section("B. getCreditLotSummary: sums valid lots, soonest non-null expiry first");
{
  const src = readSrc("lib/credits/creditEngine.ts");

  assert.ok(
    /export async function getCreditLotSummary/.test(src),
    "creditEngine.ts must export getCreditLotSummary",
  );
  ok("getCreditLotSummary is exported");

  assert.ok(
    src.includes('.gt("remaining", 0)'),
    "getCreditLotSummary must only consider lots with remaining > 0",
  );
  ok("getCreditLotSummary filters to remaining > 0");

  assert.ok(
    /\.or\(`expires_at\.is\.null,expires_at\.gt\.\$\{nowIso\}`\)/.test(src),
    "getCreditLotSummary must only consider lots that are permanent or not yet expired",
  );
  ok("getCreditLotSummary filters out expired lots");

  assert.ok(
    /nullsFirst:\s*false/.test(src),
    "getCreditLotSummary must sort with nulls last, so a permanent lot is never mistaken for the soonest-expiring one",
  );
  ok("getCreditLotSummary never treats a permanent lot as the soonest expiry");

  assert.ok(
    src.includes("totalRemaining") && src.includes("soonestExpiresAt"),
    "getCreditLotSummary must return both totalRemaining and soonestExpiresAt",
  );
  ok("getCreditLotSummary returns { totalRemaining, soonestExpiresAt }");
}

section("C. getDecisionJournalAccess also recognizes a KR 30-Day Pass");
{
  const src = readSrc("lib/entitlements/decisionJournalAccess.ts");

  assert.ok(
    src.includes('.from("kr_purchase_grants")'),
    "getDecisionJournalAccess must now also query kr_purchase_grants (previously only checked us_purchase_grants)",
  );
  ok("getDecisionJournalAccess queries kr_purchase_grants");

  assert.ok(
    /\.eq\("plan_id",\s*"kr_insight_pass_30d"\)/.test(src),
    "the KR check must filter on the kr_insight_pass_30d plan id",
  );
  ok("KR check filters on kr_insight_pass_30d");

  const usIdx = src.indexOf('.from("us_purchase_grants")');
  const krIdx = src.indexOf('.from("kr_purchase_grants")');
  assert.ok(usIdx !== -1 && krIdx !== -1 && usIdx < krIdx, "the US check must still run, and the KR check must be an addition alongside it, not a replacement");
  ok("both the US and KR pass checks are present (KR added alongside, not replacing, US)");

  assert.ok(
    (src.match(/INSIGHT_PASS_WINDOW_DAYS/g) || []).length >= 2,
    "the KR branch must reuse the same INSIGHT_PASS_WINDOW_DAYS window as the US branch",
  );
  ok("KR branch reuses the same 30-day window constant as the US branch");
}

section("D. /api/account/entitlements: auth-gated read-only summary");
{
  const src = readSrc("app/api/account/entitlements/route.ts");

  assert.ok(src.includes("export async function GET()"), "route must export a GET handler");
  ok("route exports GET");

  assert.ok(
    /if\s*\(!userId\)\s*\{\s*return NextResponse\.json\(\{ error: "unauthorized" \}, \{ status: 401 \}\);/.test(src),
    "route must 401 when there is no authenticated user",
  );
  ok("route 401s when unauthenticated");

  assert.ok(
    src.includes("getCreditLotSummary(supabase, userId, \"personal\")") &&
      src.includes("getCreditLotSummary(supabase, userId, \"relationship\")") &&
      src.includes("getDecisionJournalAccess(supabase, userId)"),
    "route must fetch personal credit, relationship credit, and Decision Journal access for the caller",
  );
  ok("route fetches personal + relationship credit summaries and Decision Journal access");

  assert.ok(
    src.includes("personal:") && src.includes("relationship:") && src.includes("journal:"),
    "route response must have personal, relationship, and journal keys",
  );
  ok("route response shape includes personal, relationship, journal");
}

section("E. countAllDecisionEntries: whole-account total across every reportId");
{
  const src = readSrc("lib/decision/session.ts");

  assert.ok(
    /export function countAllDecisionEntries\(\): number/.test(src),
    "session.ts must export countAllDecisionEntries",
  );
  ok("countAllDecisionEntries is exported");

  assert.ok(
    src.includes("key.startsWith(PREFIX)"),
    "countAllDecisionEntries must scan every ahaitsme_decisions_* key, not just the current report's",
  );
  ok("countAllDecisionEntries scans every Decision Journal key, not just the current report");

  assert.ok(
    /typeof window === "undefined"\) return 0;/.test(src),
    "countAllDecisionEntries must be SSR-safe (return 0 with no window)",
  );
  ok("countAllDecisionEntries is SSR-safe");
}

section("F. Decision Journal: 20-entry cap blocks saving unless unlimited override is active");
{
  const src = readSrc("components/decision/DecisionJournalContent.tsx");

  assert.ok(
    src.includes("const DECISION_JOURNAL_FREE_CAP = 20;"),
    "the free cap constant must be exactly 20, per the product rule",
  );
  ok("DECISION_JOURNAL_FREE_CAP is 20");

  assert.ok(
    /const capReached = !journalUnlimited && totalEntryCount >= DECISION_JOURNAL_FREE_CAP;/.test(src),
    "capReached must require both: no active unlimited override, and the total at/above the cap",
  );
  ok("capReached correctly combines journalUnlimited and totalEntryCount");

  assert.ok(
    /const canSave =\s*\n\s*situation\.trim\(\)\.length > 0 && decisionText\.trim\(\)\.length > 0 && !capReached;/.test(src),
    "canSave must also require !capReached, on top of the existing required-field checks",
  );
  ok("canSave is gated by !capReached in addition to the existing field checks");

  assert.ok(
    src.includes('fetch("/api/account/entitlements")') && src.includes("journalUnlimited"),
    "the component must fetch the entitlements summary to derive the unlimited override",
  );
  ok("journalUnlimited is derived from /api/account/entitlements");

  assert.ok(
    src.includes("messages.decision.journalCapReachedNotice(DECISION_JOURNAL_FREE_CAP)") &&
      src.includes("messages.decision.journalCapUpgradeCta"),
    "a capped user must see the cap-reached notice and an upgrade CTA",
  );
  ok("capped state renders the journalCapReachedNotice and journalCapUpgradeCta copy");

  assert.ok(
    /entries remain visible\/editable|readDecisionJournal\(id\)/.test(src),
    "existing entries must remain readable regardless of cap state (no filtering of readDecisionJournal's result based on capReached)",
  );
  ok("reading existing entries is unaffected by the cap (only new saves are blocked)");
}

section("G. Purchase Selector: context-aware badges, Best-value Pass badge, overlap notice, savingsNote");
{
  const src = readSrc("components/payment/PurchaseSelectorContent.tsx");

  assert.ok(
    /const PASS_PLAN_IDS: readonly RegionalPlanId\[\] = \["us_insight_pass_30d", "kr_insight_pass_30d"\];/.test(src),
    "PASS_PLAN_IDS must list both regions' 30-Day Pass ids",
  );
  ok("PASS_PLAN_IDS lists both Pass plan ids");

  assert.ok(
    /context === "personal" \|\| context === "relationship"\s*\n\s*\? messages\.pricing\.selectorSelectedBadge\s*\n\s*: messages\.pricing\.selectorPrimaryBadge/.test(src),
    "the primary card's badge must read as 'selected' (not 'recommended') when the context is personal or relationship, matching the rule that Personal/Relationship = the selected analysis there",
  );
  ok("primary card badge swaps to selectorSelectedBadge for personal/relationship context");

  assert.ok(
    /PASS_PLAN_IDS\.includes\(planId\)\s*\?\s*\(/.test(src) && src.includes("selectorBestValueBadge"),
    "the Pass card must get a distinct Best-value badge when it appears among the alternatives",
  );
  ok("Pass card gets the Best-value badge among the alternatives");

  assert.ok(
    src.includes("alreadyHasAccessNotice") && src.includes("selectorAlreadyHaveAccessPersonal") && src.includes("selectorAlreadyHaveAccessRelationship"),
    "an overlapping valid entitlement must produce a lightweight, non-blocking notice",
  );
  ok("overlapping-entitlement notice is wired for both personal and relationship contexts");

  assert.ok(
    src.includes('if (context === "account" || !isSignedIn) {') && src.includes("setEntitlements(null)"),
    "the overlap check must be skipped for account context (no single matching analysis type there) and for signed-out visitors",
  );
  ok("overlap check is skipped for account context and signed-out visitors (never a hard block, just skipped when not applicable)");

  assert.ok(
    /\(plan as \{ savingsNote\?: string \}\)\.savingsNote/.test(src),
    "renderCard must read and display a plan's savingsNote when present",
  );
  ok("renderCard renders a plan's savingsNote when present");
}

section("H. RegionalPricingCards renders savingsNote under the tagline");
{
  const src = readSrc("components/pricing/RegionalPricingCards.tsx");

  assert.ok(
    /\(plan as \{ savingsNote\?: string \}\)\.savingsNote/.test(src),
    "the standalone pricing cards must also render savingsNote when the plan has one",
  );
  ok("RegionalPricingCards renders savingsNote when present");
}

section("I. Message catalogs: new keys, exact required savings copy, Annual early-access line removed");
{
  const en = readSrc("lib/i18n/messages/en-US.ts");
  const ko = readSrc("lib/i18n/messages/ko-KR.ts");

  for (const key of [
    "selectorSelectedBadge",
    "selectorBestValueBadge",
    "selectorAlreadyHaveAccessPersonal",
    "selectorAlreadyHaveAccessRelationship",
  ]) {
    assert.ok(en.includes(`${key}:`), `en-US.ts must define pricing.${key}`);
    assert.ok(new RegExp(`${key}:\\s*string;`).test(en), `en-US MessageCatalog type must declare pricing.${key}`);
    ok(`en-US defines and types pricing.${key}`);
  }

  for (const key of [
    "myAccessTitle",
    "myAccessSubtitle",
    "myAccessPersonalLabel",
    "myAccessRelationshipLabel",
    "myAccessRemainingCount",
    "myAccessNoneRemaining",
    "myAccessExpiresOn",
    "myAccessExpiringSoon",
    "myAccessNoExpiry",
    "myAccessJournalLabel",
    "myAccessJournalUnlimitedUntil",
    "myAccessJournalNormalAllowance",
    "myAccessLoadError",
  ]) {
    assert.ok(en.includes(`${key}:`), `en-US.ts must define account.${key}`);
    assert.ok(new RegExp(`${key}:`).test(en.match(/account: \{[\s\S]*?\n {2}\};/)?.[0] ?? ""), `account.${key} should live inside the account value block`);
    ok(`en-US defines account.${key}`);
  }

  assert.ok(en.includes("journalCapReachedNotice: (cap: number) =>"), "en-US.ts must define decision.journalCapReachedNotice");
  assert.ok(en.includes('journalCapUpgradeCta: "See upgrade options"'), "en-US.ts must define decision.journalCapUpgradeCta");
  ok("en-US defines decision.journalCapReachedNotice and journalCapUpgradeCta");

  // Exact required savings copy (verbatim from the product rules).
  assert.ok(en.includes('savingsNote: "Save $2.98 vs. buying separately"'), "US Pass savingsNote must read exactly 'Save $2.98 vs. buying separately'");
  ok("US Pass savingsNote matches the required copy exactly");

  assert.ok(ko.includes('savingsNote: "각각 따로 구매하는 것보다 2,800원 절약"'), "KR Pass savingsNote must read exactly '각각 따로 구매하는 것보다 2,800원 절약'");
  ok("KR Pass savingsNote matches the required copy exactly");

  // No percentage-discount display anywhere in either locale's pricing block.
  const enPricingBlock = en.match(/pricing: \{[\s\S]*?\n {2}\};/)?.[0] ?? en;
  const koPricingBlock = ko.match(/pricing: \{[\s\S]*?\n {2}\},\n {2}faq:/)?.[0] ?? ko;
  assert.ok(!/%\s*(off|discount|save|saving)/i.test(enPricingBlock), "en-US pricing copy must not display a percentage discount");
  assert.ok(!/%\s*(할인|절약)/.test(koPricingBlock), "ko-KR pricing copy must not display a percentage discount");
  ok("neither locale's pricing copy shows a percentage discount");

  // Annual "early access" feature line removed from both locales' normal
  // (non-Founders) copy; Founders-specific copy lives entirely outside
  // these message catalogs and is untouched.
  assert.ok(!en.includes('"Early access to new features"'), "en-US.ts must no longer list the Annual Membership 'Early access to new features' feature line");
  ok("en-US Annual Membership no longer lists the early-access feature line");
  assert.ok(!ko.includes('"신규 기능 우선 체험"'), "ko-KR.ts must no longer list the Annual Membership early-access feature line");
  ok("ko-KR Annual Membership no longer lists the early-access feature line");

  // Pass contents remain explicit (Personal x1 + Relationship x1 + Journal
  // 30 days unlimited) -- unchanged from before Phase 2, just re-verified.
  assert.ok(
    en.includes('"1 Personal deep analysis"') && en.includes('"1 Relationship deep analysis"') && en.includes('"Unlimited Decision Journal for 30 days"'),
    "US Pass feature list must spell out Personal x1 + Relationship x1 + Decision Journal 30 days unlimited",
  );
  ok("US Pass feature list is explicit about its contents");
}

section("J. Account billing page: My Access section reads and renders the entitlements summary");
{
  const src = readSrc("app/account/billing/page.tsx");

  assert.ok(
    src.includes('fetch("/api/account/entitlements")'),
    "billing page must fetch /api/account/entitlements",
  );
  ok("billing page fetches /api/account/entitlements");

  assert.ok(
    /function isExpiringSoon\(iso: string \| null\): boolean/.test(src) &&
      src.includes("SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000"),
    "billing page must compute an 'expiring soon' flag using a 7-day threshold",
  );
  ok("isExpiringSoon uses a 7-day threshold");

  assert.ok(
    src.includes("copy.myAccessExpiringSoon") && src.includes("isExpiringSoon(credit.soonestExpiresAt)"),
    "the My Access section must show the Expiring-soon label only when isExpiringSoon is true for that credit",
  );
  ok("My Access shows Expiring-soon based on isExpiringSoon");

  assert.ok(
    src.includes("copy.myAccessJournalUnlimitedUntil") && src.includes("copy.myAccessJournalNormalAllowance"),
    "the My Access section must render Journal's unlimited-until state or its normal 20-entry allowance",
  );
  ok("My Access renders Journal unlimited-until or normal-allowance copy");

  assert.ok(
    /entitlements\.personal/.test(src) && /entitlements\.relationship/.test(src),
    "the My Access section must render both personal and relationship credit summaries",
  );
  ok("My Access renders both Personal and Relationship credit summaries");

  // A purchase made from this page (context="account") can grant Personal/
  // Relationship credit or Journal-unlimited, not only an Annual
  // membership -- handlePurchaseSuccess must refresh entitlements too.
  const successIdx = src.indexOf("async function handlePurchaseSuccess()");
  const successEndIdx = src.indexOf("\n  }\n\n  return (", successIdx);
  const successBlock = src.slice(successIdx, successEndIdx);
  assert.ok(
    successBlock.includes('fetch("/api/account/membership")') && successBlock.includes('fetch("/api/account/entitlements")'),
    "handlePurchaseSuccess must refresh both membership and entitlements after a purchase",
  );
  ok("handlePurchaseSuccess refreshes both membership and entitlements");
}

console.log(`\n${passed} passed`);
