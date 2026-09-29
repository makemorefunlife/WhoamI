/**
 * Paddle retirement -- regression suite.
 * Run: npx tsx tests/unit/paddle-retirement.test.ts
 *
 * Paddle's merchant application was rejected, so until the next provider is
 * approved there is NO active checkout provider
 * (lib/payment/checkoutAvailability.ts). This suite proves:
 *   1. No production purchase path opens Paddle.
 *   2. No user-facing page displays Paddle branding/copy.
 *   3. Existing Personal credits still work.
 *   4. Existing Relationship credits still work.
 *   5. Existing reports remain accessible (report/credit paths are not gated).
 *   6. Zero-credit users get the purchase-unavailable state, not Paddle checkout.
 *   7. EN and KR purchase-unavailable messages are localized correctly.
 *   8. Historical payment/credit records are unaffected.
 *
 * Mix of runtime checks (pure modules, i18n catalogs, legal documents, and
 * the checkout API route handlers themselves) and static source checks
 * (client import graph, guard ordering) -- no jsdom/live DB here, matching
 * the rest of tests/unit.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACTIVE_CHECKOUT_PROVIDER,
  PURCHASE_UNAVAILABLE_CODE,
  isPurchasingAvailable,
  unavailableCheckoutOutcome,
} from "../../lib/payment/checkoutAvailability";
import { getMessages } from "../../lib/i18n/messages";
import { privacyPolicy } from "../../lib/legal/privacyPolicy";
import { refundPolicy } from "../../lib/legal/refundPolicy";
import { termsOfService } from "../../lib/legal/termsOfService";
import {
  resolveAnalysisEntry,
  resolveRelationshipEntryState,
} from "../../lib/credits/analysisEntryGate";
import {
  reservePersonalCredit,
  reserveRelationshipCredit,
  consumeCredit,
  releaseCredit,
} from "../../lib/credits/creditEngine";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title: string) {
  console.log(`\n=== ${title} ===`);
}
function rel(p: string) {
  return relative(root, p).split(sep).join("/");
}
function readSrc(relPath: string) {
  return readFileSync(join(root, relPath), "utf8");
}
/** Strip JS/TS comments (block + line; "https://" inside strings is kept). */
function stripComments(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Client/page import graph: every module reachable from any page/layout
// under app/ (excluding app/api route handlers).
// ---------------------------------------------------------------------------
const EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
function resolveImport(fromFile: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(root, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null; // bare package
  const candidates = [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => join(base, "index" + e))];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}
const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;
function reachableFrom(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const stack = [...entries];
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    if (!/\.(tsx?|jsx?|mjs)$/.test(f)) continue;
    const src = stripComments(readFileSync(f, "utf8"));
    for (const m of src.matchAll(IMPORT_RE)) {
      // Type-only imports are erased at build time -- they ship nothing.
      if (/^(import|export)\s+type\s/.test(m[0])) continue;
      const spec = m[1] ?? m[2] ?? m[3];
      const target = resolveImport(f, spec);
      if (target && !seen.has(target)) stack.push(target);
    }
  }
  return seen;
}
const appDir = join(root, "app");
const pageEntries = walk(appDir).filter((p) => {
  const r = rel(p);
  return !r.startsWith("app/api/") && /\.(tsx?|jsx?)$/.test(r);
});
const reachable = reachableFrom(pageEntries);
const reachableRel = new Set([...reachable].map(rel));

const PADDLE_CLIENT_MODULES = [
  "lib/payment/useRegionalCheckout.ts",
  "lib/payment/useBetaCheckout.ts",
  "lib/payment/paddleSandboxClient.ts",
  "lib/payment/betaPaddlePricing.ts",
  "components/payment/CheckoutWithRefundConsent.tsx",
  "components/pricing/PricingCards.tsx",
  "components/pricing/RegionalPricingCards.tsx",
];

async function main() {
  // ---- 1. No production purchase path opens Paddle ------------------------
  section("1. No production purchase path opens Paddle");

  assert.equal(ACTIVE_CHECKOUT_PROVIDER, null);
  assert.equal(isPurchasingAvailable(), false);
  assert.equal(unavailableCheckoutOutcome(), "unavailable");
  assert.ok(
    !stripComments(readSrc("lib/payment/checkoutAvailability.ts")).includes("process.env"),
    "purchase availability must be a code constant, not an env flag that could re-enable checkout",
  );
  ok("no active checkout provider; availability cannot be flipped by env");

  assert.ok(reachableRel.has("components/payment/PurchaseSelectorContent.tsx"), "sanity: purchase selector is reachable from pages");
  assert.ok(reachableRel.has("app/pricing/page.tsx"), "sanity: /pricing is a page entry");
  assert.ok(reachableRel.size > 50, "sanity: import graph walked");
  for (const m of PADDLE_CLIENT_MODULES) {
    assert.ok(!reachableRel.has(m), `${m} must not be reachable from any page/layout`);
  }
  ok(`none of the ${PADDLE_CLIENT_MODULES.length} Paddle client/UI modules is reachable from ${pageEntries.length} app entry files`);

  const PADDLE_RUNTIME_MARKERS = [/paddle\.com/i, /window\.Paddle/, /Paddle\.(Checkout|Initialize|Environment)/, /NEXT_PUBLIC_PADDLE/];
  for (const f of reachable) {
    if (!/\.(tsx?|jsx?|mjs)$/.test(f)) continue;
    const src = stripComments(readFileSync(f, "utf8"));
    for (const re of PADDLE_RUNTIME_MARKERS) {
      assert.ok(!re.test(src), `${rel(f)} must not load/open Paddle (${re})`);
    }
  }
  ok("no page-reachable module loads Paddle.js, opens Paddle.Checkout or reads a Paddle token");

  const selector = readSrc("components/payment/PurchaseSelectorContent.tsx");
  assert.ok(selector.includes('import { usePurchaseCheckout } from "@/lib/payment/usePurchaseCheckout";'));
  assert.ok(!selector.includes("useRegionalCheckout"));
  const hook = stripComments(readSrc("lib/payment/usePurchaseCheckout.ts"));
  assert.ok(!/paddle/i.test(hook), "provider-agnostic hook must not reference Paddle");
  assert.match(hook, /if \(!purchasingAvailable\) return "unavailable";/);
  ok("live purchase UI uses the provider-agnostic hook, which resolves to 'unavailable'");

  for (const [path, label] of [
    ["../../app/api/pricing/checkout/prepare/route", "prepare"],
    ["../../app/api/pricing/checkout/complete/route", "regional complete"],
    ["../../app/api/beta/checkout/complete/route", "beta complete"],
  ] as const) {
    const mod = await import(path);
    const res: Response = await mod.POST(
      new Request("http://localhost/api/x", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-aha-locale": "en-US" },
        body: JSON.stringify({ planId: "us_personal_premium", transactionId: "txn_forged" }),
      }),
    );
    assert.equal(res.status, 503, `${label} must refuse with 503`);
    const body = (await res.json()) as { code?: string; error?: string };
    assert.equal(body.code, PURCHASE_UNAVAILABLE_CODE);
    assert.ok(!/paddle/i.test(JSON.stringify(body)));
  }
  ok("checkout prepare + both completion routes refuse (503 purchase_unavailable) before auth/Paddle/grant work");

  for (const path of [
    "app/api/pricing/checkout/prepare/route.ts",
    "app/api/pricing/checkout/complete/route.ts",
    "app/api/beta/checkout/complete/route.ts",
  ]) {
    const src = readSrc(path);
    const guard = src.indexOf("if (!isPurchasingAvailable())");
    assert.ok(guard > -1, `${path}: guard present`);
    for (const later of ["await auth()", "fetchPaddleSandboxTransaction(", "createRouteSupabaseClient()", "grantUsPurchase(", "grantKrPurchase(", "grantBetaPurchase("]) {
      const idx = src.indexOf(later);
      if (idx > -1) assert.ok(guard < idx, `${path}: guard must precede ${later}`);
    }
  }
  ok("route guards precede every auth, Paddle API, DB and grant call (static)");

  const webhook = readSrc("app/api/webhooks/paddle/route.ts");
  const whGuard = webhook.indexOf("if (!isPurchasingAvailable())");
  assert.ok(whGuard > -1);
  assert.ok(whGuard < webhook.indexOf("const result = await grantUsPurchase("));
  assert.ok(whGuard < webhook.indexOf("const result = await grantKrPurchase("));
  assert.ok(whGuard > webhook.indexOf("const result = await grantUsAnnualRenewal("), "existing members' renewals stay before the guard");
  ok("Paddle webhook can no longer grant a NEW purchase (a checkout opened outside the app mints nothing)");

  const csp = readSrc("next.config.ts");
  assert.ok(!/paddle/i.test(csp));
  ok("CSP no longer allowlists Paddle script/frame hosts");

  // ---- 2. No user-facing Paddle branding/copy ----------------------------
  section("2. No user-facing page displays Paddle branding/copy");

  for (const locale of ["en-US", "ko-KR"] as const) {
    const json = JSON.stringify(getMessages(locale));
    assert.ok(!/paddle/i.test(json), `${locale} message catalog must not mention Paddle`);
    const m = getMessages(locale) as unknown as { paymentRefund: Record<string, unknown>; pricing: Record<string, unknown> };
    assert.ok(!("paddleNotice" in m.paymentRefund));
    assert.ok(!("regionalSandboxNotice" in m.pricing));
  }
  ok("EN + KR message catalogs contain no Paddle copy (paddleNotice / regionalSandboxNotice removed)");

  for (const [name, doc] of [["privacy", privacyPolicy], ["refund", refundPolicy], ["terms", termsOfService]] as const) {
    for (const locale of ["en-US", "ko-KR"] as const) {
      const json = JSON.stringify(doc[locale]);
      assert.ok(!/paddle/i.test(json), `${name} (${locale}) must not mention Paddle`);
    }
  }
  ok("Privacy / Refund / Terms pages (EN + KR) contain no Paddle names, descriptors or links");

  for (const f of reachable) {
    if (!/\.(tsx?|jsx?|mjs)$/.test(f)) continue;
    const src = stripComments(readFileSync(f, "utf8"));
    assert.ok(!/paddle/i.test(src), `${rel(f)} must not contain Paddle in rendered code/strings`);
  }
  ok(`no page-reachable module (${reachable.size} files) contains Paddle outside comments`);

  // ---- 3/4. Existing credits still work ----------------------------------
  section("3/4. Existing Personal and Relationship credits still work");

  assert.equal(resolveAnalysisEntry({ personal: { remaining: 1 }, relationship: { remaining: 0 } }, "personal"), "open_analysis");
  assert.equal(resolveAnalysisEntry({ personal: { remaining: 0 }, relationship: { remaining: 2 } }, "relationship"), "open_analysis");
  assert.equal(
    resolveRelationshipEntryState({ hasSavedReport: false, kindLoaded: true, creditExhausted: false, remaining: 1, creditEnforced: true }),
    "generate",
  );
  ok("users holding credits go straight to analysis (no purchase screen)");

  const prevEnforcement = process.env.CREDIT_ENFORCEMENT;
  process.env.CREDIT_ENFORCEMENT = "true";
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  const db = {
    rpc(fn: string, args: Record<string, unknown>) {
      calls.push({ fn, args });
      if (fn === "reserve_credit") return Promise.resolve({ data: [{ reservation_id: "res-1", ok: true, balance_after: 0 }], error: null });
      return Promise.resolve({ data: [{ ok: true }], error: null });
    },
  } as never;
  const personal = await reservePersonalCredit(db, { clerkUserId: "u1", reportId: "r1", locale: "en-US", generationRequestId: "g1" });
  assert.equal(personal.ok, true);
  assert.equal(calls[0].args.p_credit_type, "personal");
  const relationship = await reserveRelationshipCredit(db, {
    clerkUserId: "u1", relationshipReportId: "rr1", kind: "work", locale: "ko-KR", generationLockId: "l1", generationRequestId: "g2",
  });
  assert.equal(relationship.ok, true);
  assert.equal(calls[1].args.p_credit_type, "relationship");
  await consumeCredit(db, "g1");
  await releaseCredit(db, "g2");
  assert.deepEqual(calls.map((c) => c.fn), ["reserve_credit", "reserve_credit", "consume_credit", "release_credit"]);
  if (prevEnforcement === undefined) delete process.env.CREDIT_ENFORCEMENT;
  else process.env.CREDIT_ENFORCEMENT = prevEnforcement;
  ok("reserve/consume/release for Personal and Relationship credits run unchanged");

  // ---- 5. Existing reports remain accessible -----------------------------
  section("5. Existing reports remain accessible");

  const ALLOWED_IMPORTERS = new Set([
    "lib/payment/usePurchaseCheckout.ts",
    "lib/payment/useRegionalCheckout.ts",
    "lib/payment/useBetaCheckout.ts",
    "components/payment/PurchaseSelectorContent.tsx",
    "app/pricing/page.tsx",
    "app/api/pricing/checkout/prepare/route.ts",
    "app/api/pricing/checkout/complete/route.ts",
    "app/api/beta/checkout/complete/route.ts",
    "app/api/webhooks/paddle/route.ts",
  ]);
  const sourceFiles = [...walk(join(root, "app")), ...walk(join(root, "components")), ...walk(join(root, "lib"))].filter((p) => /\.(tsx?|jsx?|mjs)$/.test(p));
  const importers = sourceFiles
    .filter((p) => /from\s*["'](?:@\/lib\/payment|\.)\/(?:checkoutAvailability|usePurchaseCheckout)["']/.test(readFileSync(p, "utf8")))
    .map(rel)
    .filter((r) => r !== "lib/payment/checkoutAvailability.ts");
  for (const r of importers) {
    assert.ok(ALLOWED_IMPORTERS.has(r), `${r} must not gate on purchase availability (only purchase/checkout surfaces may)`);
  }
  for (const reportPath of [
    "app/api/v2/deep/essence/route.ts",
    "app/api/relationship/analyze/premium/route.ts",
    "app/relationship/[id]/RelationshipView.tsx",
    "app/relationship/[id]/useRelationshipDetail.ts",
    "lib/v1/slim/useSlimV1Integrated.ts",
    "lib/credits/creditEngine.ts",
    "lib/credits/analysisEntryGate.ts",
  ]) {
    assert.ok(existsSync(join(root, reportPath)), `${reportPath} still exists`);
    assert.ok(!importers.includes(reportPath), `${reportPath} is not gated by purchase availability`);
  }
  ok("report generation/viewing and credit routes are untouched by the purchase gate");

  // ---- 6. Zero-credit users -> purchase-unavailable state ----------------
  section("6. Zero-credit users get the purchase-unavailable state");

  assert.equal(resolveAnalysisEntry({ personal: { remaining: 0 } }, "personal"), "open_checkout");
  assert.equal(resolveAnalysisEntry({ relationship: { remaining: 0 } }, "relationship"), "open_checkout");
  assert.equal(
    resolveRelationshipEntryState({ hasSavedReport: false, kindLoaded: true, creditExhausted: true, remaining: 0, creditEnforced: true }),
    "purchase",
  );
  ok("zero-credit Personal/Relationship entry still routes to the purchase selector");

  const handleIdx = selector.indexOf("async function handleCheckout(planId: string) {");
  const guardIdx = selector.indexOf("if (!purchasingAvailable) {", handleIdx);
  const openIdx = selector.indexOf("await openCheckout(", handleIdx);
  assert.ok(handleIdx > -1 && guardIdx > handleIdx && guardIdx < openIdx, "unavailable guard runs before openCheckout");
  assert.match(selector.slice(guardIdx, openIdx), /\[planId\]: "unavailable"/);
  assert.ok((selector.match(/disabled=\{busy \|\| !authLoaded \|\| !purchasingAvailable\}/g) ?? []).length >= 2, "every buy button is disabled");
  assert.ok(selector.includes("messages.paymentRefund.purchaseUnavailableTitle") && selector.includes("messages.paymentRefund.purchaseUnavailableBody"));
  assert.ok(selector.includes("messages.paymentRefund.purchaseUnavailableCta"));
  assert.ok(selector.includes('data-testid="purchase-unavailable"'));
  assert.ok(selector.includes('fetch("/api/redeem"'), "redeem codes (provider-agnostic) still available");
  ok("purchase selector shows the localized unavailable banner, disabled CTAs, and never calls a checkout");

  const pricingPage = readSrc("app/pricing/page.tsx");
  assert.ok(pricingPage.includes("isPurchasingAvailable()") && pricingPage.includes("purchaseUnavailableTitle"));
  assert.ok(pricingPage.includes('<PurchaseSelectorPage context="personal" />'));
  ok("/pricing shows the unavailable notice above the (disabled) catalog");

  // ---- 7. EN / KR localization ------------------------------------------
  section("7. EN and KR purchase-unavailable copy is localized");

  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");
  assert.equal(en.paymentRefund.purchaseUnavailableTitle, "Purchasing is temporarily unavailable");
  assert.equal(ko.paymentRefund.purchaseUnavailableTitle, "현재 구매가 일시적으로 중단되었어요");
  const HANGUL = /[가-힣]/;
  for (const key of ["purchaseUnavailableTitle", "purchaseUnavailableBody", "purchaseUnavailableCta"] as const) {
    assert.ok(en.paymentRefund[key].trim().length > 0 && ko.paymentRefund[key].trim().length > 0, key);
    assert.notEqual(en.paymentRefund[key], ko.paymentRefund[key], `${key} must be translated`);
    assert.ok(!HANGUL.test(en.paymentRefund[key]), `EN ${key} has no Korean`);
    assert.ok(HANGUL.test(ko.paymentRefund[key]), `KR ${key} is Korean`);
  }
  assert.ok(HANGUL.test(ko.errors.purchaseUnavailable) && !HANGUL.test(en.errors.purchaseUnavailable));
  ok("title/body/CTA + API error exist and are properly localized in both locales");

  const koRoute = await import("../../app/api/pricing/checkout/prepare/route");
  const koRes: Response = await koRoute.POST(
    new Request("http://localhost/api/pricing/checkout/prepare", { method: "POST", headers: { "x-aha-locale": "ko-KR" }, body: "{}" }),
  );
  assert.equal(((await koRes.json()) as { error: string }).error, ko.errors.purchaseUnavailable);
  ok("API refusal message follows the request locale (KR)");

  // ---- 8. Historical payment/credit records unaffected -------------------
  section("8. Historical payment/credit records are unaffected");

  const migrationsDir = join(root, "supabase/migrations");
  const migrations = readdirSync(migrationsDir);
  for (const m of [
    "20260907030000_beta_purchase_grants.sql",
    "20260922040200_us_memberships.sql",
    "20260922050000_kr_purchase_grants.sql",
    "20260922060000_kr_purchase_grants_provider_agnostic.sql",
    "20260922080000_paddle_webhooks_and_cancellation.sql",
    "20260923000000_paddle_webhook_idempotency_and_ordering.sql",
    "20260923010000_paddle_adjustment_idempotency.sql",
    "20260928120000_payment_manual_reviews.sql",
  ]) {
    assert.ok(migrations.includes(m), `${m} kept`);
  }
  const HISTORY_TABLES = "beta_purchase_grants|us_purchase_grants|kr_purchase_grants|memberships|membership_term_grants|paddle_webhook_events|processed_paddle_adjustments|payment_manual_reviews|credit_lots|credit_ledger|credit_accounts";
  const destructive = new RegExp(`(drop\\s+table|truncate)[^;]*\\b(public\\.)?(${HISTORY_TABLES})\\b`, "i");
  for (const m of migrations.filter((f) => f.endsWith(".sql"))) {
    assert.ok(!destructive.test(readFileSync(join(migrationsDir, m), "utf8")), `${m} must not drop/truncate payment or credit history`);
  }
  ok("all Paddle-era migrations kept; no migration drops or truncates purchase/credit history tables");

  for (const needle of ['"mark_membership_canceled"', '"set_membership_cancel_schedule"', '"mark_membership_refunded"', "grantUsAnnualRenewal("]) {
    assert.ok(webhook.includes(needle), `webhook still handles ${needle} for existing memberships`);
  }
  for (const r of ["app/api/account/membership/cancel/route.ts", "app/api/account/delete/route.ts", "app/api/account/entitlements/route.ts"]) {
    if (existsSync(join(root, r))) assert.ok(!importers.includes(r), `${r} unaffected by the purchase gate`);
  }
  ok("existing memberships keep renewal/cancel/refund handling; account entitlement + cancel routes unchanged");

  console.log(`\npaddle-retirement: ${passed} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
