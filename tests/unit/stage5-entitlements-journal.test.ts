/**
 * Stage 5 (2026-10-11): what can be used on this screen, Triple / pass,
 * Journal on the server (moved from the device without duplicates),
 * refund-aware pass, Journal cap -> the real Journal product, no US
 * membership wording on the KR screen.
 * Run: npx tsx tests/unit/stage5-entitlements-journal.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { summarizeCreditLots } from "../../lib/entitlements/creditBreakdown";
import { importDeviceEntries, sanitizeDeviceEntry } from "../../lib/decision/serverJournal";
import { isRefundedTossTransaction } from "../../lib/entitlements/decisionJournalAccess";
import { messagesKoKR as ko } from "../../lib/i18n/messages/ko-KR";

let n = 0;
const ok = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  n++;
  console.log(`ok - ${name}`);
};

const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";

function fake(rows: Record<string, unknown[] | unknown>, rpcResult: unknown = 0) {
  const calls: { name: string; args: unknown }[] = [];
  const from = (table: string) => {
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "in", "order", "limit", "or"]) q[m] = () => q;
    q.maybeSingle = () => Promise.resolve({ data: rows[table] ?? null, error: null });
    q.then = (res: (v: unknown) => void) => res({ data: rows[table] ?? [], error: null });
    return q;
  };
  const rpc = (name: string, args: unknown) => {
    calls.push({ name, args });
    return Promise.resolve({ data: rpcResult, error: null });
  };
  return { client: { from, rpc } as never, calls };
}

async function main() {
  await ok("credits: usable here = this language + any-language lots; other language shown apart", () => {
    const plans = new Map([["g-triple", "kr_relationship_triple"], ["g-pass", "kr_insight_pass_30d"]]);
    const b = summarizeCreditLots(
      [
        { remaining: 2, amount: 3, expires_at: "2027-01-01T00:00:00Z", locale: "ko-KR", reference_id: "g-triple" },
        { remaining: 1, amount: 1, expires_at: null, locale: null, reference_id: null },
        { remaining: 1, amount: 1, expires_at: "2026-11-01T00:00:00Z", locale: "ko-KR", reference_id: "g-pass" },
        { remaining: 1, amount: 1, expires_at: null, locale: "en-US", reference_id: null },
      ],
      "ko-KR",
      plans,
    );
    assert.deepEqual(b.usableHere, { remaining: 4, soonestExpiresAt: "2026-11-01T00:00:00Z" });
    assert.equal(b.thisLanguage, 3);
    assert.equal(b.shared, 1);
    assert.equal(b.otherLanguage, 1);
    assert.deepEqual(b.triple, { remaining: 2, total: 3, expiresAt: "2027-01-01T00:00:00Z" });
    assert.deepEqual(b.pass, { remaining: 1, expiresAt: "2026-11-01T00:00:00Z" });
  });

  await ok("journal: device entries are validated, never invented", () => {
    assert.equal(sanitizeDeviceEntry({ id: "not-a-uuid", context: "x" }), null);
    assert.equal(sanitizeDeviceEntry({ id: U1, context: "  " }), null);
    const e = sanitizeDeviceEntry({ id: U1, context: "c", status: "reviewed", rating: null });
    assert.equal(e?.status, "pending", "reviewed without rating stays pending (same rule as the device)");
  });

  await ok("journal: own profile's records move automatically; unknown owner needs a yes; another account's never", async () => {
    const f = fake({ reports: [{ id: U1, clerk_user_id: "user_me" }, { id: U2, clerk_user_id: "user_other" }] }, 1);
    const entry = (id: string) => ({ id, context: "c", category: "work" });
    const out = await importDeviceEntries(f.client, "user_me", [
      { key: "ahaitsme_decisions_" + U1, reportId: U1, entries: [entry("33333333-3333-4333-8333-333333333333")] },
      { key: "ahaitsme_decisions_local", reportId: "local", entries: [entry("44444444-4444-4444-8444-444444444444")] },
      { key: "ahaitsme_decisions_" + U2, reportId: U2, entries: [entry("55555555-5555-4555-8555-555555555555")] },
    ], []);
    assert.deepEqual(out?.movedKeys, ["ahaitsme_decisions_" + U1]);
    assert.deepEqual(out?.needsConfirm, [{ key: "ahaitsme_decisions_local", count: 1 }]);
    assert.deepEqual(out?.otherAccountKeys, ["ahaitsme_decisions_" + U2]);
    const confirmed = await importDeviceEntries(f.client, "user_me", [
      { key: "ahaitsme_decisions_" + U2, reportId: U2, entries: [entry("55555555-5555-4555-8555-555555555555")] },
    ], ["ahaitsme_decisions_" + U2]);
    assert.deepEqual(confirmed?.movedKeys, [], "confirmation never moves another account's records");
  });

  await ok("pass: a refunded / cancelled Toss order gives no Journal access", async () => {
    assert.equal(await isRefundedTossTransaction(fake({ toss_payment_orders: { status: "refunded" } }).client, "toss:pk"), true);
    assert.equal(await isRefundedTossTransaction(fake({ toss_payment_orders: { status: "granted" } }).client, "toss:pk"), false);
    assert.equal(await isRefundedTossTransaction(fake({}).client, "paddle:x"), false);
    assert.match(readFileSync("lib/entitlements/decisionJournalAccess.ts", "utf8"), /isRefundedTossTransaction\(supabase, krPass\.provider_transaction_id\)/);
  });

  await ok("Journal cap points to the product that unlocks it; no US membership on the KR screen", () => {
    assert.match(readFileSync("components/decision/DecisionJournalContent.tsx", "utf8"), /context="journal"/);
    const sel = readFileSync("components/payment/PurchaseSelectorContent.tsx", "utf8");
    assert.match(sel, /region === "kr" \? "kr_insight_pass_30d" : "us_insight_pass_30d"/);
    assert.doesNotMatch(ko.decision.journalCapReachedNotice(20), /멤버십/);
    const billing = readFileSync("app/account/billing/page.tsx", "utf8");
    assert.match(billing, /locale === "ko-KR" \? copy\.billingNoPlanKr : copy\.billingNoActiveMembership/);
  });

  await ok("Journal pages read the account (server) when signed in; device stays as fallback", () => {
    for (const f of ["components/decision/DecisionJournalContent.tsx", "components/decision/DecisionHistoryContent.tsx"]) {
      const src = readFileSync(f, "utf8");
      assert.match(src, /useDecisionJournal\(\)/, f);
      assert.doesNotMatch(src, /readDecisionJournal\(/, f);
    }
  });

  console.log(`\n${n} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
