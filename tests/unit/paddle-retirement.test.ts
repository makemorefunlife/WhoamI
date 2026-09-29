/**
 * Pre-launch payments -- sandbox checkout for everyone + provider-neutral
 * public copy.
 * Run: npx tsx tests/unit/paddle-retirement.test.ts
 *
 * Until the final live payment provider is selected, the site runs the
 * existing SANDBOX checkout for every user exactly as before (buy CTA ->
 * sandbox checkout -> /api/pricing/checkout/complete (+ webhook backstop) ->
 * credit grant -> analysis -> credit consumed at generation). Public EN/KR
 * copy never names the provider. This suite proves:
 *   1. No tester/QA gating or "purchasing unavailable" state remains.
 *   2. The sandbox purchase -> complete -> webhook -> grant path is intact.
 *   3. No public EN/KR surface shows "Paddle", "PADDLE.NET", "Sandbox" or 패들.
 *   4. Legal copy is provider-neutral (no company named as Merchant of Record).
 *   5. Existing Personal / Relationship credits still work.
 *   6. Existing reports remain accessible; zero-credit users reach checkout.
 *   7. Historical payment/credit records are unaffected.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

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
  const selector = readSrc("components/payment/PurchaseSelectorContent.tsx");
  const webhook = readSrc("app/api/webhooks/paddle/route.ts");
  const complete = readSrc("app/api/pricing/checkout/complete/route.ts");
  const prepare = readSrc("app/api/pricing/checkout/prepare/route.ts");
  const betaComplete = readSrc("app/api/beta/checkout/complete/route.ts");
  const regional = readSrc("lib/payment/useRegionalCheckout.ts");

  // ---- 1. No gating ---------------------------------------------------------
  section("1. No QA gating / purchasing-unavailable state remains");

  for (const gone of ["lib/payment/checkoutAvailability.ts", "lib/payment/usePurchaseCheckout.ts", "app/api/pricing/checkout/availability/route.ts"]) {
    assert.ok(!existsSync(join(root, gone)), `${gone} removed`);
  }
  const sourceFiles = [...walk(join(root, "app")), ...walk(join(root, "components")), ...walk(join(root, "lib"))].filter((p) => /\.(tsx?|jsx?|mjs)$/.test(p));
  for (const f of sourceFiles) {
    const src = readFileSync(f, "utf8");
    for (const needle of ["CHECKOUT_QA_USER_IDS", "isCheckoutAllowedForUser", "isPurchasingAvailable", "purchaseUnavailable", "checkoutAvailability"]) {
      assert.ok(!src.includes(needle), `${rel(f)} must not contain ${needle}`);
    }
  }
  ok("allowlist env, availability route/hook and unavailable copy are gone from app/components/lib");

  assert.ok(selector.includes('import { useRegionalCheckout } from "@/lib/payment/useRegionalCheckout";'));
  assert.ok((selector.match(/disabled=\{busy \|\| !authLoaded\}/g) ?? []).length >= 2, "buy buttons only wait for auth/busy");
  assert.ok(selector.includes("{plan.cta}") && selector.includes("{copy.us_additional_relationship.cta}"));
  for (const [name, src] of [["prepare", prepare], ["complete", complete], ["beta complete", betaComplete]] as const) {
    assert.ok(!/status: 503/.test(src), `${name}: no 503 purchase-unavailable branch`);
  }
  ok("every purchase CTA renders its normal label and opens checkout for any signed-in user");

  // ---- 2. Sandbox flow ------------------------------------------------------
  section("2. Sandbox purchase -> completion/webhook -> credit grant is intact");

  assert.ok(regional.indexOf('fetch("/api/pricing/checkout/prepare"') < regional.indexOf("await loadAndInitPaddle(clientToken)"));
  assert.ok(regional.includes('window.Paddle.Environment.set("sandbox")'), "sandbox environment only");
  assert.ok(regional.includes('fetch("/api/pricing/checkout/complete"'));
  assert.ok(/outcome === "success" \|\| outcome === "already_processed"[\s\S]{0,120}onSuccess\?\.\(planId\)/.test(selector), "success -> onSuccess (unlock / resume analysis)");
  assert.ok(complete.includes("fetchPaddleSandboxTransaction(") && complete.includes("grantUsPurchase(") && complete.includes("grantKrPurchase("));
  assert.ok(complete.indexOf("paddleQuantityRequiresReview(txn.items)") < complete.indexOf("const result = await grantUsPurchase("));
  assert.ok(webhook.includes("const result = await grantUsPurchase(") && webhook.includes("const result = await grantKrPurchase(") && webhook.includes("grantUsAnnualRenewal("));
  assert.ok(/js\.paddle\.com/.test(readSrc("next.config.ts")), "CSP allows the sandbox checkout script (response header, not rendered)");
  ok("sandbox checkout -> server-side transaction re-verification -> grantUs/KrPurchase (webhook backstop) unchanged");

  // ---- 3. Public copy -------------------------------------------------------
  section("3. No public EN/KR surface shows provider branding or 'Sandbox'");

  for (const locale of ["en-US", "ko-KR"] as const) {
    assertNoProviderBranding(stringValues(getMessages(locale)).join("\n"), `${locale} message catalog`);
    for (const [name, doc] of [["privacy", privacyPolicy], ["refund", refundPolicy], ["terms", termsOfService]] as const) {
      assertNoProviderBranding(stringValues(doc[locale]).join("\n"), `${name} (${locale})`);
    }
  }
  ok("EN + KR message catalogs and Privacy/Refund/Terms: no Paddle / PADDLE.NET / Sandbox / 패들 / placeholder name");

  let tsxCount = 0;
  for (const f of reachable) {
    if (!f.endsWith(".tsx")) continue;
    tsxCount += 1;
    assertNoProviderBranding(renderedTextOf(readFileSync(f, "utf8")), rel(f));
  }
  assert.ok(tsxCount > 50);
  assert.ok(!readSrc("app/pricing/page.tsx").includes("regionalSandboxNotice"), "no public sandbox banner");
  ok(`no page-reachable component (${tsxCount} .tsx files) renders provider branding; no sandbox banner`);

  // ---- 4. Legal copy -------------------------------------------------------
  section("4. Legal copy is provider-neutral and truthful");

  for (const locale of ["en-US", "ko-KR"] as const) {
    const all = [privacyPolicy, refundPolicy, termsOfService].map((d) => stringValues(d[locale]).join(" ")).join(" ");
    assert.match(all, locale === "en-US" ? /third-party payment service provider/ : /제3자 결제 서비스 제공업체/);
    assert.ok(stringValues(refundPolicy[locale]).join(" ").includes("support@ahaitsme.com"));
    assert.ok(!/(is|acts as) the Merchant of Record for (all )?our/i.test(all), "no company asserted as our permanent Merchant of Record");
  }
  ok("payments described as 'may be handled by third-party payment service providers'; contact support@ahaitsme.com");

  // ---- 5. Credits ---------------------------------------------------------------
  section("5. Existing Personal and Relationship credits still work");

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
  ok("credit holders go straight to analysis; credit reserved/consumed at generation");

  // ---- 6. Reports + zero-credit ------------------------------------------------
  section("6. Reports accessible; zero-credit users reach checkout");

  for (const reportPath of [
    "app/api/v2/deep/essence/route.ts",
    "app/api/relationship/analyze/premium/route.ts",
    "app/relationship/[id]/RelationshipView.tsx",
    "app/relationship/[id]/useRelationshipDetail.ts",
    "lib/v1/slim/useSlimV1Integrated.ts",
  ]) {
    assert.ok(existsSync(join(root, reportPath)), `${reportPath} still exists`);
  }
  assert.equal(resolveAnalysisEntry({ personal: { remaining: 0 } }, "personal"), "open_checkout");
  assert.equal(resolveAnalysisEntry({ relationship: { remaining: 0 } }, "relationship"), "open_checkout");
  assert.equal(
    resolveRelationshipEntryState({ hasSavedReport: false, kindLoaded: true, creditExhausted: true, remaining: 0, creditEnforced: true }),
    "purchase",
  );
  assert.equal(
    resolveRelationshipEntryState({ hasSavedReport: true, kindLoaded: true, creditExhausted: true, remaining: 0, creditEnforced: true }),
    "saved_report",
    "a saved report is shown even with zero credits",
  );
  ok("saved reports open without a credit; zero-credit users are routed to the (working) purchase selector");

  // ---- 7. History ------------------------------------------------------------------
  section("7. Historical payment/credit records are unaffected");

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
  for (const needle of ['"mark_membership_canceled"', '"set_membership_cancel_schedule"', '"mark_membership_refunded"']) {
    assert.ok(webhook.includes(needle));
  }
  ok("migrations kept, nothing drops history; webhook membership lifecycle intact");

  console.log(`\npaddle-retirement: ${passed} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
