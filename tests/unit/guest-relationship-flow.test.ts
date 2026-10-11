/**
 * Guest single Relationship (stage 4, 2026-10-11) -- mock / source checks.
 * The SQL side is covered by tests/sql/guest-relationship.test.sql.
 * Run: npx tsx tests/unit/guest-relationship-flow.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isGuestPersonalPlan, isGuestUseOrderRow, isGuestUsePlan } from "../../lib/payment/tossCatalog";
import {
  buildGuestPremiumRequest,
  guestOrderOwnerKey,
  guestPremiumRequester,
  saveGuestRelationshipInput,
} from "../../lib/payment/guestRelationship";

let n = 0;
const ok = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  n++;
  console.log(`ok - ${name}`);
};

function fakeSupabase(opts: { rpc?: Record<string, unknown>; rows?: Record<string, unknown> }) {
  const calls: string[] = [];
  const from = (table: string) => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.in = () => q;
    q.maybeSingle = () => Promise.resolve({ data: opts.rows?.[table] ?? null, error: null });
    return q;
  };
  const rpc = (name: string) => {
    calls.push(name);
    return Promise.resolve({ data: opts.rpc?.[name] ?? null, error: null });
  };
  return { client: { from, rpc } as never, calls };
}

const ORDER = "aha_" + "a".repeat(32);
const g = { self_report_id: "me", relationship_report_id: "rr" };

async function main() {
  await ok("plans: single Relationship is guest-usable for NEW orders; older orders keep the account flow", () => {
    assert.equal(isGuestUsePlan("kr_relationship_premium"), true);
    assert.equal(isGuestPersonalPlan("kr_relationship_premium"), false);
    assert.equal(isGuestUsePlan("kr_relationship_triple"), false);
    assert.equal(isGuestUsePlan("us_relationship_premium"), false, "US stays as it is");
    assert.equal(isGuestUseOrderRow({ plan_id: "kr_personal_premium" }), true);
    assert.equal(isGuestUseOrderRow({ plan_id: "kr_relationship_premium", guest_use_enabled: null }), false);
    assert.equal(isGuestUseOrderRow({ plan_id: "kr_relationship_premium", guest_use_enabled: true }), true);
  });

  await ok("requester: only this order's own 'me' in this order's relationship", async () => {
    const owned = fakeSupabase({ rows: { relationship_reports: { id: "rr" } } });
    const r = guestPremiumRequester(ORDER, g);
    assert.equal(r.ownerKey, guestOrderOwnerKey(ORDER));
    assert.equal(r.ownerKey.startsWith("user_"), false, "never a Clerk id");
    assert.equal(await r.assertViewer(owned.client, "me", "me", "you", "ko-KR"), null);
    const wrong = await r.assertViewer(owned.client, "you", "me", "you", "ko-KR");
    assert.equal(wrong?.status, 403, "the other person cannot generate");
    const other = fakeSupabase({ rows: { relationship_reports: null } });
    assert.equal((await r.assertViewer(other.client, "me", "me", "x", "ko-KR"))?.status, 403, "another relationship");
    assert.equal(await r.loadClerkUser(), null);
  });

  await ok("requester: the purchase is used once (reserve result decides)", async () => {
    const p = { relationshipReportId: "rr", kind: "romantic" as const, locale: "ko-KR" as const, generationLockId: "l", generationRequestId: "q" };
    for (const [res, want] of [["reserved", true], ["already_used", false], ["in_progress", false], ["expired", false], ["claimed", false]] as const) {
      const s = fakeSupabase({ rpc: { reserve_guest_relationship_use: res } });
      assert.equal((await guestPremiumRequester(ORDER, g).reserve(s.client, p)).ok, want, res);
    }
    const s = fakeSupabase({ rpc: { reserve_guest_relationship_use: "reserved" } });
    assert.equal((await guestPremiumRequester(ORDER, g).reserve(s.client, { ...p, relationshipReportId: "other" })).ok, false);
    assert.deepEqual(s.calls, [], "no reserve for another relationship");
  });

  await ok("generation input comes only from the stored order (no regenerate / create_own)", async () => {
    const s = fakeSupabase({
      rows: {
        guest_relationship_orders: {
          order_id: ORDER, locale: "ko-KR", self_report_id: "me", partner_report_id: "you", relationship_report_id: "rr",
          kind: "family", partner_consent: { third_party_info: true }, family_options: { parent_type: "father", child_is_viewer: true },
        },
      },
    });
    const built = await buildGuestPremiumRequest(s.client, ORDER);
    assert.ok(built.ok);
    if (built.ok) {
      assert.deepEqual(Object.keys(built.body).sort(), ["child_is_viewer", "locale", "parent_type", "relationship_kind", "relationship_report_id", "viewer_report_id"]);
      assert.equal(built.body.viewer_report_id, "me");
    }
    const none = fakeSupabase({ rows: { guest_relationship_orders: { order_id: ORDER, kind: "romantic", partner_consent: null } } });
    assert.deepEqual(await buildGuestPremiumRequest(none.client, ORDER), { ok: false, code: "no_input" });
    const route = readFileSync("app/api/guest/relationship/generate/route.ts", "utf8");
    assert.match(route, /export async function POST\(\)/, "request body is never read");
    assert.match(route, /guestSessionOrderId\(supabase\)/);
  });

  await ok("input: the other person's info needs the notice / consent; checked before anything is stored", async () => {
    const s = fakeSupabase({});
    const me = { birthDate: "1990-01-01", birthTimeUnknown: true, birthPlaceUnknown: true };
    const partner = { name: "B", birthDate: "1991-02-02", birthTimeUnknown: true, birthPlaceUnknown: true };
    assert.deepEqual(await saveGuestRelationshipInput(s.client, ORDER, "ko-KR", { me, partner, kind: "romantic" }), { ok: false, code: "consent_required" });
    assert.deepEqual(await saveGuestRelationshipInput(s.client, ORDER, "ko-KR", { me, partner: { ...partner, name: "" }, kind: "romantic", partnerConsent: true }), { ok: false, code: "invalid_input" });
    assert.deepEqual(await saveGuestRelationshipInput(s.client, ORDER, "ko-KR", { me, partner, kind: "enemy", partnerConsent: true }), { ok: false, code: "invalid_input" });
    assert.deepEqual(s.calls, [], "nothing reserved / stored");
  });

  await ok("wiring: per-order flag at checkout, success page, email link and email text", () => {
    const orders = readFileSync("app/api/payments/toss/orders/route.ts", "utf8");
    assert.match(orders, /guest_use_enabled: true/);
    assert.match(orders, /isGuestRelationshipPlan\(plan\.planId\)/);
    for (const f of ["app/api/payments/toss/confirm/route.ts", "app/api/payments/toss/claim-link/route.ts", "lib/email/guestPurchaseEmail.ts"]) {
      assert.match(readFileSync(f, "utf8"), /isGuestUseOrder\(/, f);
    }
    assert.match(readFileSync("lib/payment/guestPersonal.ts", "utf8"), /isGuestPersonalPlan\(order\.plan_id\)/, "Personal state unchanged");
    assert.match(readFileSync("app/api/cron/guest-emails/route.ts", "utf8"), /purge_guest_relationship_data/);
    assert.match(readFileSync("app/checkout/toss/use/GuestUseClient.tsx", "utf8"), /isGuestRelationshipPlan\(state\.planId\)/);
  });

  await ok("member route is a thin wrapper over the shared handler", () => {
    const route = readFileSync("app/api/relationship/analyze/premium/route.ts", "utf8");
    assert.match(route, /handleRelationshipPremium\(req, memberPremiumRequester\(userId\)\)/);
  });

  console.log(`\n${n} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
