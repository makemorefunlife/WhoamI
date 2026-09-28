/**
 * Paid-analysis entry gate + account balance summary (QA/QC #2).
 * Run: npx tsx tests/unit/analysis-entry-gate.test.ts
 *
 * The SQL side (US single purchases summing, one generation = one credit,
 * reserve refusing at 0) runs against the real migrations in
 * tests/sql/credit-lifecycle.test.sql (tests/scripts/run-credit-lifecycle-sql.sh).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveAnalysisEntry, remainingCreditsFor } from "../../lib/credits/analysisEntryGate";
import { getCreditLotSummary } from "../../lib/credits/creditEngine";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`ok - ${name}`);
}

async function main() {
  // ---- Personal entry (StitchPremiumCard) ---------------------------------
  assert.equal(resolveAnalysisEntry({ personal: { remaining: 1 }, relationship: { remaining: 0 } }, "personal"), "open_analysis");
  ok("Personal remaining > 0 -> no checkout");

  assert.equal(resolveAnalysisEntry({ personal: { remaining: 0 }, relationship: { remaining: 2 } }, "personal"), "open_checkout");
  ok("Personal remaining = 0 -> checkout (Relationship credits do not count)");

  assert.equal(resolveAnalysisEntry(null, "personal"), "open_checkout");
  assert.equal(resolveAnalysisEntry({ personal: { remaining: Number.NaN } }, "personal"), "open_checkout");
  ok("failed/unknown entitlements read -> checkout (never free access)");

  const card = readFileSync("components/results/StitchPremiumCard.tsx", "utf8");
  assert.match(card, /\/api\/account\/entitlements/);
  assert.match(card, /resolveAnalysisEntry\(summary, "personal"\) === "open_analysis"/);
  assert.match(card, /router\.push\(`\$\{href\}\?autostart=1`\)/);
  ok("StitchPremiumCard checks the Personal balance before opening checkout");

  // ---- Relationship entry -------------------------------------------------
  // Relationship has no up-front checkout: generation calls reserve_credit
  // and the Purchase Selector opens only on its 402 (no usable credit).
  assert.equal(resolveAnalysisEntry({ personal: { remaining: 0 }, relationship: { remaining: 1 } }, "relationship"), "open_analysis");
  ok("Relationship remaining > 0 -> no checkout");
  assert.equal(resolveAnalysisEntry({ personal: { remaining: 3 }, relationship: { remaining: 0 } }, "relationship"), "open_checkout");
  ok("Relationship remaining = 0 -> checkout (Personal credits do not count)");

  const view = readFileSync("app/relationship/[id]/RelationshipView.tsx", "utf8");
  const purchaseOpeners = view.match(/setPurchaseOpen\(true\)/g) ?? [];
  assert.equal(purchaseOpeners.length, 2, "RelationshipView opens checkout in exactly two places");
  assert.match(view, /if \(autostartCreditExhausted\) \{\s*setPurchaseOpen\(true\);/);
  assert.match(view, /onOpenPurchase=\{\(\) => setPurchaseOpen\(true\)\}/);
  const section = readFileSync("components/relationship/detail/RelationshipPremiumSection.tsx", "utf8");
  assert.match(section, /creditExhausted && onOpenPurchase \?/);
  const detail = readFileSync("app/relationship/[id]/useRelationshipDetail.ts", "utf8");
  assert.match(detail, /res\.status === 402[\s\S]{0,600}setPremiumCreditExhausted\(true\)/);
  const premiumRoute = readFileSync("app/api/relationship/analyze/premium/route.ts", "utf8");
  assert.match(premiumRoute, /if \(!creditReserve\.ok\)[\s\S]{0,400}status: 402/);
  ok("Relationship checkout opens only after a 402 from reserve_credit (credit present -> generates directly)");

  assert.equal(remainingCreditsFor({ relationship: { remaining: 3 } }, "relationship"), 3);
  ok("remainingCreditsFor reads the per-type remaining count");

  // ---- Account balance = sum of valid credit_lots.remaining ---------------
  type Lot = { clerk_user_id: string; credit_type: string; remaining: number; expires_at: string | null };

  function mockSupabase(lots: Lot[]) {
    return {
      from(table: string) {
        assert.equal(table, "credit_lots");
        const filters: Record<string, string> = {};
        const q = {
          select: () => q,
          eq: (col: string, val: string) => {
            filters[col] = val;
            return q;
          },
          gt: () => q,
          or: () => q,
          order: () =>
            Promise.resolve({
              data: lots
                .filter(
                  (l) =>
                    l.clerk_user_id === filters.clerk_user_id &&
                    l.credit_type === filters.credit_type &&
                    l.remaining > 0 &&
                    (l.expires_at === null || new Date(l.expires_at) > new Date()),
                )
                .map(({ remaining, expires_at }) => ({ remaining, expires_at })),
            }),
        };
        return q;
      },
    } as never;
  }

  const inAYear = new Date(Date.now() + 365 * 86400_000).toISOString();
  // Three separate us_relationship_premium purchases = three lots of amount 1.
  const lots: Lot[] = [
    { clerk_user_id: "u1", credit_type: "relationship", remaining: 1, expires_at: inAYear },
    { clerk_user_id: "u1", credit_type: "relationship", remaining: 1, expires_at: inAYear },
    { clerk_user_id: "u1", credit_type: "relationship", remaining: 1, expires_at: inAYear },
    { clerk_user_id: "u1", credit_type: "personal", remaining: 1, expires_at: inAYear },
    { clerk_user_id: "u2", credit_type: "relationship", remaining: 1, expires_at: inAYear },
  ];

  assert.equal((await getCreditLotSummary(mockSupabase(lots), "u1", "relationship")).totalRemaining, 3);
  ok("multiple single Relationship purchases sum in the account balance (1+1+1 = 3)");

  lots[0].remaining = 0; // one generation drew the soonest lot down by 1
  assert.equal((await getCreditLotSummary(mockSupabase(lots), "u1", "relationship")).totalRemaining, 2);
  ok("after one generation the account shows 2");

  assert.equal((await getCreditLotSummary(mockSupabase(lots), "u1", "personal")).totalRemaining, 1);
  ok("Personal balance is shown separately and unaffected");

  const expired: Lot[] = [
    { clerk_user_id: "u3", credit_type: "relationship", remaining: 1, expires_at: new Date(Date.now() - 1000).toISOString() },
  ];
  assert.equal((await getCreditLotSummary(mockSupabase(expired), "u3", "relationship")).totalRemaining, 0);
  ok("expired lots are not counted");

  console.log(`\nanalysis-entry-gate: ${passed} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
