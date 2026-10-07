/**
 * Toss one-time membership purchase + operator refund -- end-to-end against
 * the REAL SQL functions (throwaway local Postgres) with a scripted fake
 * Toss API. Covers: tamper/ownership checks, declined cards, timeouts and
 * retries, idempotency, already-member races, refund failure/retry and
 * duplicate protection.
 *
 * Run (needs a local Postgres you can create databases on; never prod):
 *   PGHOST=/tmp PGPORT=5432 PGUSER=postgres npx tsx tests/unit/toss-membership-flow.test.ts
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";

import { claimGuestTossOrders, completeTossOrder, type TossDeps } from "../../lib/payment/tossConfirm";
import { TOSS_PLANS, resolveTossPaymentMethod } from "../../lib/payment/tossCatalog";
import { executeMembershipRefundAttempt, refundTag, type RefundDeps } from "../../lib/payment/membershipRefund";
import type { TossPayment, TossResult } from "../../lib/payment/tossServer";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DB = `toss_flow_test_${process.pid}`;

function psql(db: string, sql: string): string {
  return execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-d", db, "-c", sql], { encoding: "utf8" }).trim();
}
function psqlFile(db: string, file: string) {
  execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-d", db, "-f", file], { encoding: "utf8", stdio: ["ignore", "ignore", "pipe"] });
}
function lit(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return `array[${v.map(lit).join(",")}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

// Minimal Supabase stand-in: rpc() runs the real function; the two table
// reads/writes the payment code uses are translated to SQL.
function fakeSupabase(): SupabaseClient {
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const named = Object.entries(args).map(([k, v]) => `${k} => ${lit(v)}`).join(", ");
    try {
      const out = psql(DB, `select coalesce(json_agg(t), '[]') from (select * from public.${name}(${named})) t`);
      const rows = JSON.parse(out || "[]") as unknown[];
      return { data: rows, error: null };
    } catch (e) {
      const msg = String((e as { stderr?: string }).stderr ?? e);
      return { data: null, error: { message: msg } };
    }
  };
  const from = (table: string) => {
    const filters: string[] = [];
    let limit = "";
    const run = () => {
      const where = filters.length ? `where ${filters.join(" and ")}` : "";
      const out = psql(DB, `select coalesce(json_agg(t), '[]') from (select * from public.${table} ${where} ${limit}) t`);
      return JSON.parse(out) as unknown[];
    };
    const q = {
      select: () => q,
      eq: (col: string, val: unknown) => {
        filters.push(`${col} = ${lit(val)}`);
        return q;
      },
      is: (col: string, val: null) => {
        filters.push(`${col} is ${val === null ? "null" : lit(val)}`);
        return q;
      },
      in: (col: string, vals: unknown[]) => {
        filters.push(`${col} in (${vals.map(lit).join(",")})`);
        return q;
      },
      limit: (n: number) => {
        limit = `limit ${n}`;
        return q;
      },
      then: (resolve: (v: { data: unknown[]; error: null }) => unknown) => resolve({ data: run(), error: null }),
      maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
      upsert: async (obj: Record<string, unknown>) => {
        const cols = Object.keys(obj);
        psql(DB, `insert into public.${table} (${cols.join(",")}) values (${cols.map((c) => lit(obj[c])).join(",")}) on conflict do nothing`);
        return { error: null };
      },
    };
    return q;
  };
  return { rpc, from } as unknown as SupabaseClient;
}

// ---------------------------------------------------------------- fake Toss
type Call = { op: "confirm" | "get" | "cancel"; key?: string; amount?: number };
function payment(orderId: string, paymentKey: string, over: Partial<TossPayment> = {}): TossPayment {
  return {
    paymentKey,
    orderId,
    status: "DONE",
    totalAmount: 280,
    balanceAmount: 280,
    currency: "USD",
    method: "카드",
    approvedAt: new Date().toISOString(),
    cancels: [],
    ...over,
  };
}
function tossFake(script: {
  confirm?: (p: { paymentKey: string; orderId: string; amount: number }) => TossResult;
  get?: (key: string) => TossResult;
  cancel?: (p: { paymentKey: string; cancelReason: string; cancelAmount?: number; idempotencyKey: string }) => TossResult;
}) {
  const calls: Call[] = [];
  const deps: TossDeps & RefundDeps = {
    confirm: async (p) => {
      calls.push({ op: "confirm", key: `confirm-${p.orderId}` });
      return script.confirm ? script.confirm(p) : { kind: "ok", payment: payment(p.orderId, p.paymentKey) };
    },
    get: async (key) => {
      calls.push({ op: "get" });
      return script.get ? script.get(key) : { kind: "unknown", reason: "no_get" };
    },
    cancel: async (p) => {
      calls.push({ op: "cancel", key: p.idempotencyKey, amount: p.cancelAmount });
      return script.cancel ? script.cancel(p) : { kind: "unknown", reason: "no_cancel" };
    },
  };
  return { deps, calls };
}

let passed = 0;
// Claim results also carry planId (for the "start analysis" destination); compare on the core fields.
const strip = (rs: { orderId: string; result: string }[]) => rs.map(({ orderId, result }) => ({ orderId, result }));
function ok(name: string) {
  passed++;
  console.log(`ok - ${name}`);
}

function newOrder(user: string, n: number): string {
  const orderId = `aha_${String(n).padStart(32, "0")}`;
  psql(DB, `insert into toss_payment_orders (order_id, clerk_user_id, plan_id, amount, currency, order_name)
            values (${lit(orderId)}, ${lit(user)}, 'us_annual_membership', 280, 'USD', '12-Month Membership')`);
  return orderId;
}
const orderStatus = (id: string) => psql(DB, `select status from toss_payment_orders where order_id = ${lit(id)}`);

async function main() {
  psql("postgres", `create database ${DB}`);
  try {
    psql(DB, "do $$ begin create role service_role; exception when duplicate_object then null; end $$;");
    psql(DB, "create extension if not exists pgcrypto; create table public.relationship_reports(id uuid primary key default gen_random_uuid());");
    for (const m of [
      "20260907020100_credit_engine_tables.sql",
      "20260907020200_credit_engine_functions.sql",
      "20260907030000_beta_purchase_grants.sql",
      "20260922040000_credit_lots.sql",
      "20260922040100_credit_engine_lot_functions.sql",
      "20260922040200_us_memberships.sql",
      "20260922040300_us_membership_functions.sql",
      "20260922050000_kr_purchase_grants.sql",
      "20260922060000_kr_purchase_grants_provider_agnostic.sql",
      "20260922070000_account_deletion_entitlement_cleanup.sql",
      "20260922080000_paddle_webhooks_and_cancellation.sql",
      "20260923000000_paddle_webhook_idempotency_and_ordering.sql",
      "20260926080000_fix_grant_credit_lot_ambiguous_balance.sql",
      "20260926090000_single_purchase_and_triple_one_year_expiry.sql",
      "20260928000000_redeem_code_system.sql",
      "20260928120000_payment_manual_reviews.sql",
      "20261007120000_one_time_membership_toss_and_refunds.sql",
      "20261007130000_toss_guest_checkout.sql",
      "20261008090000_toss_guest_email_and_test_mode.sql",
    ]) {
      psqlFile(DB, resolve(root, "supabase/migrations", m));
    }
    const sb = fakeSupabase();

    // 1. happy path + idempotent repeat
    {
      const o = newOrder("u_happy", 1);
      const t = tossFake({});
      const r1 = await completeTossOrder(sb, { clerkUserId: "u_happy", orderId: o, paymentKey: "pk_happy", amount: 280 }, t.deps);
      assert.equal(r1.status, "granted");
      const r2 = await completeTossOrder(sb, { clerkUserId: "u_happy", orderId: o, paymentKey: "pk_happy", amount: 280 }, t.deps);
      assert.deepEqual(r2, { status: "granted", alreadyProcessed: true, planId: "us_annual_membership" });
      assert.equal(t.calls.filter((c) => c.op === "confirm").length, 1);
      assert.equal(psql(DB, "select billing_model from memberships where clerk_user_id = 'u_happy'"), "one_time_12m");
      ok("purchase: confirm once, grant once, repeat request is a no-op");
    }

    // 2. tampering
    {
      const o = newOrder("u_tamper", 2);
      const t = tossFake({});
      const a = await completeTossOrder(sb, { clerkUserId: "u_tamper", orderId: o, paymentKey: "pk_t", amount: 1 }, t.deps);
      const b = await completeTossOrder(sb, { clerkUserId: "u_other", orderId: o, paymentKey: "pk_t", amount: 280 }, t.deps);
      assert.deepEqual([a.status, b.status], ["rejected", "rejected"]);
      assert.equal(t.calls.length, 0);
      ok("tampered amount / other user's order rejected before Toss is called");
    }

    // 3. declined card
    {
      const o = newOrder("u_decline", 3);
      const t = tossFake({ confirm: () => ({ kind: "rejected", httpStatus: 400, code: "REJECT_CARD_PAYMENT", message: "declined" }) });
      const r = await completeTossOrder(sb, { clerkUserId: "u_decline", orderId: o, paymentKey: "pk_d", amount: 280 }, t.deps);
      assert.deepEqual(r, { status: "payment_failed", code: "REJECT_CARD_PAYMENT" });
      assert.equal(orderStatus(o), "failed");
      assert.equal(psql(DB, "select count(*) from memberships where clerk_user_id = 'u_decline'"), "0");
      const again = await completeTossOrder(sb, { clerkUserId: "u_decline", orderId: o, paymentKey: "pk_d", amount: 280 }, t.deps);
      assert.equal(again.status, "rejected");
      ok("declined card: order failed, nothing granted, closed order not reopened");
    }

    // 4. timeout -> retry with the same idempotency key
    {
      const o = newOrder("u_timeout", 4);
      let n = 0;
      const t = tossFake({
        confirm: (p) => (++n === 1 ? { kind: "unknown", reason: "timeout" } : { kind: "ok", payment: payment(p.orderId, p.paymentKey) }),
        get: () => ({ kind: "unknown", reason: "timeout" }),
      });
      const r1 = await completeTossOrder(sb, { clerkUserId: "u_timeout", orderId: o, paymentKey: "pk_to", amount: 280 }, t.deps);
      assert.equal(r1.status, "pending_retry");
      assert.equal(orderStatus(o), "confirming");
      const r2 = await completeTossOrder(sb, { clerkUserId: "u_timeout", orderId: o, paymentKey: "pk_to", amount: 280 }, t.deps);
      assert.deepEqual(r2, { status: "rejected", reason: "in_progress" });
      psql(DB, `update toss_payment_orders set updated_at = now() - interval '3 minutes' where order_id = ${lit(o)}`);
      const r3 = await completeTossOrder(sb, { clerkUserId: "u_timeout", orderId: o, paymentKey: "pk_to", amount: 280 }, t.deps);
      assert.equal(r3.status, "granted");
      const keys = new Set(t.calls.filter((c) => c.op === "confirm").map((c) => c.key));
      assert.equal(keys.size, 1);
      ok("confirm timeout: no grant, concurrent retry blocked, later retry reuses the same Idempotency-Key");
    }

    // 5. already a member -> never charged
    {
      const o = newOrder("u_happy", 5);
      const t = tossFake({});
      const r = await completeTossOrder(sb, { clerkUserId: "u_happy", orderId: o, paymentKey: "pk_dup", amount: 280 }, t.deps);
      assert.deepEqual(r, { status: "payment_failed", code: "ALREADY_MEMBER" });
      assert.equal(t.calls.length, 0);
      ok("active member: refused before confirm (no charge)");
    }

    // 6. race: membership appears between check and grant -> full auto-cancel
    {
      const o = newOrder("u_race", 6);
      const t = tossFake({
        confirm: (p) => {
          psql(DB, `insert into memberships (clerk_user_id, plan_id, status, started_at, current_term_start, current_term_end, billing_model)
                    values ('u_race', 'us_annual_membership', 'active', now(), now(), now() + interval '1 year', 'one_time_12m')`);
          return { kind: "ok", payment: payment(p.orderId, p.paymentKey) };
        },
        cancel: (p) => ({ kind: "ok", payment: payment(o, p.paymentKey, { status: "CANCELED", balanceAmount: 0 }) }),
      });
      const r = await completeTossOrder(sb, { clerkUserId: "u_race", orderId: o, paymentKey: "pk_race", amount: 280 }, t.deps);
      assert.deepEqual(r, { status: "refunded_automatically", reason: "already_member" });
      assert.equal(orderStatus(o), "canceled");
      assert.equal(t.calls.filter((c) => c.op === "cancel")[0].amount, undefined); // full cancel
      ok("second membership race: payment cancelled in full, order canceled");
    }

    // 7. Toss approved a different amount -> cancel, never grant
    {
      const o = newOrder("u_mismatch", 7);
      const t = tossFake({
        confirm: (p) => ({ kind: "ok", payment: payment(p.orderId, p.paymentKey, { totalAmount: 28 }) }),
        cancel: (p) => ({ kind: "ok", payment: payment(o, p.paymentKey, { status: "CANCELED" }) }),
      });
      const r = await completeTossOrder(sb, { clerkUserId: "u_mismatch", orderId: o, paymentKey: "pk_mm", amount: 280 }, t.deps);
      assert.equal(r.status, "refunded_automatically");
      assert.equal(psql(DB, "select count(*) from memberships where clerk_user_id = 'u_mismatch'"), "0");
      ok("approved amount mismatch: cancelled, nothing granted");
    }

    // 8. refund: failure leaves benefits, retry succeeds once
    {
      const m = psql(DB, "select id from memberships where clerk_user_id = 'u_happy'");
      const opened = JSON.parse(
        psql(DB, `select row_to_json(t) from open_membership_refund(${lit(m)}, (current_date + 30), 'prorated', 'op_1', 'test') t`),
      ) as { request_id: string; refund_amount: number };
      const tag = refundTag(opened.request_id);
      let cancelCalls = 0;
      const t = tossFake({
        cancel: (p) => {
          cancelCalls++;
          if (cancelCalls === 1) return { kind: "unknown", reason: "timeout" };
          return {
            kind: "ok",
            payment: payment("x", "pk_happy", {
              status: "PARTIAL_CANCELED",
              cancels: [{ cancelAmount: p.cancelAmount ?? 0, cancelReason: p.cancelReason, canceledAt: "", transactionKey: "tx_c1" }],
            }),
          };
        },
        get: () => ({ kind: "ok", payment: payment("x", "pk_happy") }), // no cancel recorded yet
      });
      const a1 = await executeMembershipRefundAttempt(sb, opened.request_id, t.deps);
      assert.equal(a1.status, "failed");
      assert.equal(psql(DB, `select status from memberships where id = ${lit(m)}`), "active");
      const a2 = await executeMembershipRefundAttempt(sb, opened.request_id, t.deps);
      assert.equal(a2.status, "succeeded");
      const a3 = await executeMembershipRefundAttempt(sb, opened.request_id, t.deps);
      assert.deepEqual(a3, { status: "succeeded", alreadySucceeded: true, providerReference: null });
      const keys = t.calls.filter((c) => c.op === "cancel");
      assert.equal(keys.length, 2);
      assert.equal(new Set(keys.map((c) => c.key)).size, 1);
      assert.equal(keys[0].amount, Number(opened.refund_amount));
      assert.equal(psql(DB, `select status from memberships where id = ${lit(m)}`), "refunded");
      assert.ok(tag.length > 0);
      ok("refund: failed attempt changes nothing; retry uses same Idempotency-Key; no third provider call");
    }

    // 9. refund: ambiguous error but cancel visible on lookup -> success without a second cancel
    {
      const o = newOrder("u_ref2", 9);
      await completeTossOrder(sb, { clerkUserId: "u_ref2", orderId: o, paymentKey: "pk_ref2", amount: 280 }, tossFake({}).deps);
      const m = psql(DB, "select id from memberships where clerk_user_id = 'u_ref2'");
      const opened = JSON.parse(
        psql(DB, `select row_to_json(t) from open_membership_refund(${lit(m)}, current_date, 'full_within_7_days', 'op_1', null) t`),
      ) as { request_id: string; refund_amount: number };
      assert.equal(Number(opened.refund_amount), 280);
      const t = tossFake({
        cancel: () => ({ kind: "rejected", httpStatus: 400, code: "ALREADY_CANCELED_PAYMENT", message: "" }),
        get: () => ({
          kind: "ok",
          payment: payment(o, "pk_ref2", {
            status: "CANCELED",
            cancels: [{ cancelAmount: 280, cancelReason: `${refundTag(opened.request_id)} x`, canceledAt: "", transactionKey: "tx_c2" }],
          }),
        }),
      });
      const a = await executeMembershipRefundAttempt(sb, opened.request_id, t.deps);
      assert.deepEqual(a, { status: "succeeded", alreadySucceeded: false, providerReference: "tx_c2" });
      assert.equal(t.calls.filter((c) => c.op === "cancel").length, 1);
      ok("refund: ambiguous provider answer reconciled from payment history (full refund within 7 days)");
    }

    // 10. catalog: KR prices on the Toss window, USD closed until configured
    {
      assert.deepEqual(
        ["kr_personal_premium", "kr_relationship_premium", "kr_insight_pass_30d", "kr_relationship_triple"].map((id) => [
          TOSS_PLANS[id]?.amount,
          TOSS_PLANS[id]?.currency,
          TOSS_PLANS[id]?.guestCheckout,
        ]),
        [[7900, "KRW", true], [14900, "KRW", true], [20000, "KRW", true], [33000, "KRW", true]],
      );
      assert.equal(TOSS_PLANS.us_annual_membership?.currency, "USD");
      assert.equal(TOSS_PLANS.us_annual_membership?.guestCheckout, false);
      assert.equal(resolveTossPaymentMethod("KRW", undefined), "CARD");
      assert.equal(resolveTossPaymentMethod("USD", undefined), null);
      assert.equal(resolveTossPaymentMethod("USD", "KRW"), null);
      assert.equal(resolveTossPaymentMethod("USD", "FOREIGN_EASY_PAY"), "FOREIGN_EASY_PAY");
      ok("catalog: KR 7,900 / 14,900 / 20,000 / 33,000 KRW via card; USD has no default and never falls back");
    }

    // 11. KR member purchase on Toss: Triple grants 3 credits, 12 months
    {
      const orderId = `aha_${"b".repeat(31)}1`;
      psql(DB, `insert into toss_payment_orders (order_id, clerk_user_id, plan_id, amount, currency, order_name)
                values (${lit(orderId)}, 'u_kr', 'kr_relationship_triple', 33000, 'KRW', 'Relationship Triple')`);
      const t = tossFake({ confirm: (p) => ({ kind: "ok", payment: payment(p.orderId, p.paymentKey, { totalAmount: 33000, currency: "KRW" }) }) });
      const r = await completeTossOrder(sb, { clerkUserId: "u_kr", orderId, paymentKey: "pk_kr1", amount: 33000 }, t.deps);
      assert.equal(r.status, "granted");
      assert.equal(psql(DB, "select remaining from credit_lots where clerk_user_id = 'u_kr'"), "3");
      assert.equal(psql(DB, "select (expires_at - created_at) between interval '364 days' and interval '366 days' from credit_lots where clerk_user_id = 'u_kr'"), "t");
      assert.equal(psql(DB, "select payment_provider from kr_purchase_grants where clerk_user_id = 'u_kr'"), "toss");
      ok("KR member purchase (Triple 33,000 KRW): 3 Relationship credits valid 12 months, provider toss");
    }

    // 12. guest checkout: pay -> awaiting claim -> email-verified claim
    {
      const orderId = `aha_${"c".repeat(31)}1`;
      psql(DB, `insert into toss_payment_orders (order_id, clerk_user_id, guest_email, plan_id, amount, currency, order_name)
                values (${lit(orderId)}, null, 'buyer@example.com', 'kr_insight_pass_30d', 20000, 'KRW', '30-Day Pass')`);
      const t = tossFake({ confirm: (p) => ({ kind: "ok", payment: payment(p.orderId, p.paymentKey, { totalAmount: 20000, currency: "KRW" }) }) });

      // a signed-in member cannot confirm someone's guest order as their own
      const asMember = await completeTossOrder(sb, { clerkUserId: "u_thief", orderId, paymentKey: "pk_g1", amount: 20000 }, t.deps);
      assert.deepEqual(asMember, { status: "rejected", reason: "mismatch" });

      const r1 = await completeTossOrder(sb, { clerkUserId: null, orderId, paymentKey: "pk_g1", amount: 20000 }, t.deps);
      // Mail is not configured in this test -> queued for retry, payment unaffected.
      assert.deepEqual(r1, { status: "awaiting_claim", planId: "kr_insight_pass_30d", emailStatus: "pending" });
      assert.equal(psql(DB, `select count(*) from credit_lots where reference_id in (select id from kr_purchase_grants where provider_transaction_id = 'toss:pk_g1')`), "0");
      const r2 = await completeTossOrder(sb, { clerkUserId: null, orderId, paymentKey: "pk_g1", amount: 20000 }, t.deps);
      assert.equal(r2.status, "awaiting_claim");
      assert.equal(t.calls.filter((c) => c.op === "confirm").length, 1);
      ok("guest: paid once, nothing granted before claim, member cannot hijack, repeat confirm idempotent");

      // pretend the buyer pays now but claims 2 days later
      psql(DB, `update toss_payment_orders set approved_at = now() - interval '2 days' where order_id = ${lit(orderId)}`);

      const wrong = strip(await claimGuestTossOrders(sb, { clerkUserId: "u_other", verifiedEmails: ["someone@example.com"], orderIds: [orderId] }));
      assert.equal(wrong[0].result, "email_mismatch");
      const none = strip(await claimGuestTossOrders(sb, { clerkUserId: "u_other", verifiedEmails: [] }));
      assert.equal(none.length, 0);

      const good = strip(await claimGuestTossOrders(sb, { clerkUserId: "u_buyer", verifiedEmails: ["Buyer@Example.com "] }));
      assert.deepEqual(good, [{ orderId, result: "claimed" }]);
      assert.equal(psql(DB, "select count(*) from credit_lots where clerk_user_id = 'u_buyer'"), "2");
      assert.equal(
        psql(DB, `select bool_and(abs(extract(epoch from (cl.expires_at - (o.approved_at + interval '30 days')))) < 5)
                  from credit_lots cl, toss_payment_orders o where cl.clerk_user_id = 'u_buyer' and o.order_id = ${lit(orderId)}`),
        "t",
      );
      assert.equal(
        psql(DB, `select abs(extract(epoch from (g.created_at - o.approved_at))) < 1 from kr_purchase_grants g, toss_payment_orders o
                  where g.provider_transaction_id = 'toss:pk_g1' and o.order_id = ${lit(orderId)}`),
        "t",
      );
      const again = strip(await claimGuestTossOrders(sb, { clerkUserId: "u_buyer", verifiedEmails: ["buyer@example.com"], orderIds: [orderId] }));
      assert.equal(again[0].result, "already_claimed");
      const stolen = strip(await claimGuestTossOrders(sb, { clerkUserId: "u_other", verifiedEmails: ["buyer@example.com"], orderIds: [orderId] }));
      assert.equal(stolen[0].result, "claimed_by_other");
      assert.equal(psql(DB, "select count(*) from credit_lots where clerk_user_id = 'u_buyer'"), "2");
      ok("guest claim: verified-email match only, windows anchored to payment time (30 days from purchase), no double grant or takeover");
    }

    // 13. guest + declined card: nothing to claim
    {
      const orderId = `aha_${"d".repeat(31)}1`;
      psql(DB, `insert into toss_payment_orders (order_id, guest_email, plan_id, amount, currency, order_name)
                values (${lit(orderId)}, 'late@example.com', 'kr_personal_premium', 7900, 'KRW', 'Personal')`);
      const t = tossFake({ confirm: () => ({ kind: "rejected", httpStatus: 400, code: "REJECT_CARD_PAYMENT", message: "" }) });
      const r = await completeTossOrder(sb, { clerkUserId: null, orderId, paymentKey: "pk_g2", amount: 7900 }, t.deps);
      assert.equal(r.status, "payment_failed");
      const c = strip(await claimGuestTossOrders(sb, { clerkUserId: "u_late", verifiedEmails: ["late@example.com"], orderIds: [orderId] }));
      assert.equal(c[0].result, "not_paid");
      ok("guest declined card: order failed, nothing claimable");
    }

    console.log(`\ntoss-membership-flow: ${passed} passed`);
  } finally {
    psql("postgres", `drop database if exists ${DB}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
