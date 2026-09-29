/**
 * Payment provider transition -- QA-only sandbox checkout + no provider
 * branding on public pages.
 * Run: npx tsx tests/unit/paddle-retirement.test.ts
 *
 * The previous payment provider's merchant application was rejected. Its
 * SANDBOX checkout stays wired end-to-end for internal QA (allowlisted via
 * CHECKOUT_QA_USER_IDS, lib/payment/checkoutAvailability.ts); everyone
 * else sees the localized "Purchasing is temporarily unavailable" state,
 * and no public page names the provider. This suite proves:
 *   1. Non-QA users cannot start or complete a checkout; QA users can.
 *   2. The sandbox purchase -> complete -> webhook -> grant path is intact.
 *   3. No public EN/KR surface shows "Paddle", "PADDLE.NET" or "Sandbox".
 *   4. Existing Personal / Relationship credits still work.
 *   5. Existing reports remain accessible (not gated).
 *   6. Zero-credit non-QA users get the purchase-unavailable state.
 *   7. EN and KR messages are localized correctly.
 *   8. Historical payment/credit records are unaffected.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PURCHASE_UNAVAILABLE_CODE,
  isCheckoutAllowedForUser,
  parseCheckoutQaUserIds,
} from "../../lib/payment/checkoutAvailability";
import { getMessages } from "../../lib/i18n/messages";
import { privacyPolicy } from "../../lib/legal/privacyPolicy";
import { refundPolicy } from "../../lib/legal/refundPolicy";
import { termsOfService } from "../../lib/legal/termsOfService";
import { resolveAnalysisEntry, resolveRelationshipEntryState } from "../../lib/credits/analysisEntryGate";
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

/** Every string VALUE in a nested object (keys like betaSandboxSuccess are not rendered). */
function stringValues(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => stringValues(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => stringValues(x, out));
  return out;
}
const PUBLIC_FORBIDDEN = [/paddle/i, /PADDLE\.NET/, /sandbox/i, /AAAAA/, /패들/];
function assertNoProviderBranding(text: string, where: string) {
  for (const re of PUBLIC_FORBIDDEN) assert.ok(!re.test(text), `${where} must not show ${re}`);
}
/** String literals + JSX text of a .tsx file, comments and import lines removed. */
function renderedTextOf(src: string) {
  return stripComments(src)
    .split("\n")
    .filter((l) => !/^\s*(import|export \{)/.test(l))
    .join("\n")
    // property accesses such as messages.paymentRefund.betaSandboxSuccess are
    // message KEYS, not rendered text (their values are checked above)
    .replace(/\.\s*[A-Za-z_$][\w$]*/g, "");
}

async function main() {
  // ---- 1. QA gate -----------------------------------------------------------
  section("1. Checkout is QA-only (server-enforced)");

  assert.deepEqual([...parseCheckoutQaUserIds(" user_a, user_b ,,").ids], ["user_a", "user_b"]);
  assert.equal(isCheckoutAllowedForUser("user_a", "user_a,user_b"), true);
  assert.equal(isCheckoutAllowedForUser("user_c", "user_a,user_b"), false);
  assert.equal(isCheckoutAllowedForUser("user_c", "*"), true, "* = every signed-in user (pre-transition public beta)");
  assert.equal(isCheckoutAllowedForUser(null, "*"), false, "signed-out never");
  assert.equal(isCheckoutAllowedForUser("user_a", ""), false, "unset = nobody (safe default)");
  assert.equal(isCheckoutAllowedForUser("user_a", undefined), false);
  ok("allowlist parsing: ids, '*', empty = nobody, signed-out = never");

  for (const path of [
    "app/api/pricing/checkout/prepare/route.ts",
    "app/api/pricing/checkout/complete/route.ts",
    "app/api/beta/checkout/complete/route.ts",
  ]) {
    const src = readSrc(path);
    const gate = src.indexOf("if (!isCheckoutAllowedForUser(userId))");
    assert.ok(gate > -1, `${path}: QA gate present`);
    assert.ok(gate > src.indexOf("await auth()"), `${path}: gate uses the authenticated user`);
    assert.match(src.slice(gate, gate + 300), /status: 503/);
    assert.ok(src.slice(gate, gate + 300).includes("PURCHASE_UNAVAILABLE_CODE"));
    for (const later of ["readJsonBodyLimited(req)", "fetchPaddleSandboxTransaction(", "createRouteSupabaseClient()", "grantUsPurchase(", "grantKrPurchase(", "grantBetaPurchase("]) {
      const idx = src.indexOf(later);
      if (idx > -1) assert.ok(gate < idx, `${path}: gate must precede ${later}`);
    }
  }
  ok("prepare + both complete routes refuse non-QA users (503) before any provider API / DB / grant work");

  const availability = readSrc("app/api/pricing/checkout/availability/route.ts");
  assert.ok(availability.includes("isCheckoutAllowedForUser(userId)"));
  ok("/api/pricing/checkout/availability mirrors the same gate for the UI");

  const webhook = readSrc("app/api/webhooks/paddle/route.ts");
  const whGate = webhook.indexOf("if (!isCheckoutAllowedForUser(clerkUserId))");
  assert.ok(whGate > -1);
  assert.ok(whGate < webhook.indexOf("const result = await grantUsPurchase("));
  assert.ok(whGate < webhook.indexOf("const result = await grantKrPurchase("));
  assert.ok(whGate > webhook.indexOf("const result = await grantUsAnnualRenewal("), "existing members' renewals are not gated");
  ok("webhook grants a NEW purchase only for QA users (checkouts opened outside the app mint nothing)");

  // ---- 2. Sandbox QA flow restored ------------------------------------------
  section("2. Sandbox purchase -> complete -> webhook -> grant flow is intact");

  const regional = readSrc("lib/payment/useRegionalCheckout.ts");
  assert.ok(!regional.includes("isPurchasingAvailable"), "no hard client-side kill switch left");
  assert.ok(regional.includes('fetch("/api/pricing/checkout/prepare"'));
  assert.ok(regional.indexOf('fetch("/api/pricing/checkout/prepare"') < regional.indexOf("await loadAndInitPaddle(clientToken)"), "prepare (QA gate) runs before the checkout script loads");
  assert.match(regional, /if \(prepareRes\.status === 503\) return "unavailable";/);
  assert.ok(regional.includes('fetch("/api/pricing/checkout/complete"'));
  assert.ok(regional.includes('window.Paddle.Environment.set("sandbox")'), "still the sandbox environment");
  const beta = readSrc("lib/payment/useBetaCheckout.ts");
  assert.ok(!beta.includes("isPurchasingAvailable"));
  ok("checkout hooks are the pre-transition sandbox hooks (plus 503 -> 'unavailable')");

  const hook = readSrc("lib/payment/usePurchaseCheckout.ts");
  assert.ok(hook.includes("useRegionalCheckout()") && hook.includes("openCheckout: regional.openCheckout"));
  assert.ok(hook.includes('fetch("/api/pricing/checkout/availability")'));
  const selector = readSrc("components/payment/PurchaseSelectorContent.tsx");
  assert.ok(selector.includes('import { usePurchaseCheckout } from "@/lib/payment/usePurchaseCheckout";'));
  assert.ok(/outcome === "success" \|\| outcome === "already_processed"[\s\S]{0,120}onSuccess\?\.\(planId\)/.test(selector));
  ok("purchase selector -> sandbox checkout -> onSuccess (unlock/resume analysis) wiring unchanged");

  for (const f of ["app/api/pricing/checkout/complete/route.ts", "app/api/webhooks/paddle/route.ts"]) {
    const src = readSrc(f);
    assert.ok(src.includes("grantUsPurchase(") && src.includes("grantKrPurchase("), `${f} still grants`);
    assert.ok(!src.includes("isPurchasingAvailable"), `${f}: no hard kill switch`);
  }
  assert.ok(/js\.paddle\.com/.test(readSrc("next.config.ts")), "CSP allows the sandbox checkout script again (header only, not rendered)");
  ok("complete route + webhook grant paths and CSP restored");

  // ---- 3. No public provider branding -------------------------------------
  section("3. No public EN/KR surface shows Paddle / PADDLE.NET / Sandbox");

  for (const locale of ["en-US", "ko-KR"] as const) {
    assertNoProviderBranding(stringValues(getMessages(locale)).join("\n"), `${locale} message catalog`);
    for (const [name, doc] of [["privacy", privacyPolicy], ["refund", refundPolicy], ["terms", termsOfService]] as const) {
      assertNoProviderBranding(stringValues(doc[locale]).join("\n"), `${name} (${locale})`);
    }
  }
  ok("EN + KR message catalogs and Privacy/Refund/Terms contain no provider name, descriptor, 'Sandbox' or placeholder name");

  assert.match(stringValues(refundPolicy["en-US"]).join(" "), /third-party payment service provider/);
  assert.match(stringValues(refundPolicy["ko-KR"]).join(" "), /제3자 결제 서비스 제공업체/);
  for (const locale of ["en-US", "ko-KR"] as const) {
    const refund = stringValues(refundPolicy[locale]).join(" ");
    assert.ok(refund.includes("support@ahaitsme.com"));
    assert.ok(/payment receipt|결제 영수증/.test(refund), "refund steps point to the receipt's support info");
  }
  ok("legal copy uses neutral 'third-party payment service provider' wording; refunds -> support@ahaitsme.com / receipt");

  let tsxCount = 0;
  for (const f of reachable) {
    if (!f.endsWith(".tsx")) continue;
    tsxCount += 1;
    assertNoProviderBranding(renderedTextOf(readFileSync(f, "utf8")), rel(f));
  }
  assert.ok(tsxCount > 50);
  ok(`no page-reachable component (${tsxCount} .tsx files) renders provider branding or 'Sandbox'`);

  // ---- 4. Existing credits still work ---------------------------------------
  section("4. Existing Personal and Relationship credits still work");

  assert.equal(resolveAnalysisEntry({ personal: { remaining: 1 }, relationship: { remaining: 0 } }, "personal"), "open_analysis");
  assert.equal(resolveAnalysisEntry({ personal: { remaining: 0 }, relationship: { remaining: 2 } }, "relationship"), "open_analysis");
  assert.equal(
    resolveRelationshipEntryState({ hasSavedReport: false, kindLoaded: true, creditExhausted: false, remaining: 1, creditEnforced: true }),
    "generate",
  );
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
  assert.equal((await reservePersonalCredit(db, { clerkUserId: "u1", reportId: "r1", locale: "en-US", generationRequestId: "g1" })).ok, true);
  assert.equal(
    (await reserveRelationshipCredit(db, { clerkUserId: "u1", relationshipReportId: "rr1", kind: "work", locale: "ko-KR", generationLockId: "l1", generationRequestId: "g2" })).ok,
    true,
  );
  await consumeCredit(db, "g1");
  await releaseCredit(db, "g2");
  assert.deepEqual(calls.map((c) => c.fn), ["reserve_credit", "reserve_credit", "consume_credit", "release_credit"]);
  assert.deepEqual(calls.slice(0, 2).map((c) => c.args.p_credit_type), ["personal", "relationship"]);
  if (prevEnforcement === undefined) delete process.env.CREDIT_ENFORCEMENT;
  else process.env.CREDIT_ENFORCEMENT = prevEnforcement;
  ok("credit holders go straight to analysis; reserve/consume/release unchanged");

  // ---- 5. Reports not gated ---------------------------------------------------
  section("5. Existing reports remain accessible");

  const ALLOWED_IMPORTERS = new Set([
    "lib/payment/usePurchaseCheckout.ts",
    "components/payment/PurchaseSelectorContent.tsx",
    "app/api/pricing/checkout/availability/route.ts",
    "app/api/pricing/checkout/prepare/route.ts",
    "app/api/pricing/checkout/complete/route.ts",
    "app/api/beta/checkout/complete/route.ts",
    "app/api/webhooks/paddle/route.ts",
  ]);
  const sourceFiles = [...walk(join(root, "app")), ...walk(join(root, "components")), ...walk(join(root, "lib"))].filter((p) => /\.(tsx?|jsx?|mjs)$/.test(p));
  const importers = sourceFiles
    .filter((p) => /from\s*["'](?:@\/lib\/payment|\.)\/(?:checkoutAvailability|usePurchaseCheckout)["']/.test(readFileSync(p, "utf8")))
    .map(rel);
  for (const r of importers) assert.ok(ALLOWED_IMPORTERS.has(r), `${r} must not gate on checkout availability`);
  for (const reportPath of [
    "app/api/v2/deep/essence/route.ts",
    "app/api/relationship/analyze/premium/route.ts",
    "app/relationship/[id]/RelationshipView.tsx",
    "app/relationship/[id]/useRelationshipDetail.ts",
    "lib/v1/slim/useSlimV1Integrated.ts",
    "lib/credits/creditEngine.ts",
  ]) {
    assert.ok(existsSync(join(root, reportPath)));
    assert.ok(!importers.includes(reportPath), `${reportPath} is not gated`);
  }
  ok("report generation/viewing and credit routes are untouched by the checkout gate");

  // ---- 6. Zero-credit, non-QA users ------------------------------------------
  section("6. Zero-credit non-QA users get the purchase-unavailable state");

  assert.equal(resolveAnalysisEntry({ personal: { remaining: 0 } }, "personal"), "open_checkout");
  assert.equal(resolveAnalysisEntry({ relationship: { remaining: 0 } }, "relationship"), "open_checkout");
  assert.ok(selector.includes("const showUnavailable = availabilityLoaded && !purchasingAvailable;"));
  assert.ok((selector.match(/disabled=\{busy \|\| !authLoaded \|\| !purchasingAvailable\}/g) ?? []).length >= 2, "buy buttons disabled unless allowlisted");
  const handleIdx = selector.indexOf("async function handleCheckout(planId: string) {");
  const guardIdx = selector.indexOf("if (!purchasingAvailable) {", handleIdx);
  assert.ok(guardIdx > handleIdx && guardIdx < selector.indexOf("await openCheckout(", handleIdx));
  assert.ok(selector.includes('data-testid="purchase-unavailable"') && selector.includes("{showUnavailable ? ("));
  assert.ok(selector.includes('fetch("/api/redeem"'), "redeem codes still available");
  assert.ok(!readSrc("app/pricing/page.tsx").includes("regionalSandboxNotice"), "no public sandbox banner on /pricing");
  ok("non-QA users see the localized unavailable banner + disabled CTAs and never reach a checkout");

  // ---- 7. Localization ---------------------------------------------------------
  section("7. EN and KR copy is localized");

  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");
  assert.equal(en.paymentRefund.purchaseUnavailableTitle, "Purchasing is temporarily unavailable");
  assert.equal(ko.paymentRefund.purchaseUnavailableTitle, "현재 구매가 일시적으로 중단되었어요");
  const HANGUL = /[\uAC00-\uD7A3]/;
  for (const key of ["purchaseUnavailableTitle", "purchaseUnavailableBody", "purchaseUnavailableCta"] as const) {
    assert.notEqual(en.paymentRefund[key], ko.paymentRefund[key]);
    assert.ok(!HANGUL.test(en.paymentRefund[key]) && HANGUL.test(ko.paymentRefund[key]), key);
  }
  assert.ok(HANGUL.test(ko.errors.purchaseUnavailable) && !HANGUL.test(en.errors.purchaseUnavailable));
  assert.equal(PURCHASE_UNAVAILABLE_CODE, "purchase_unavailable");
  ok("unavailable title/body/CTA + API error localized in both locales");

  // ---- 8. History untouched ------------------------------------------------------
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
    assert.ok(!destructive.test(readFileSync(join(migrationsDir, m), "utf8")), `${m} must not drop/truncate history`);
  }
  for (const needle of ['"mark_membership_canceled"', '"set_membership_cancel_schedule"', '"mark_membership_refunded"', "grantUsAnnualRenewal("]) {
    assert.ok(webhook.includes(needle), `webhook still handles ${needle}`);
  }
  ok("migrations kept, nothing drops history; membership renewal/cancel/refund handling intact");

  console.log(`\npaddle-retirement: ${passed} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
