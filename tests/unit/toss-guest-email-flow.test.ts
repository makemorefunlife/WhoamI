/**
 * Guest purchase-guide email (Resend), claim links and public test-payment
 * rules -- against the REAL SQL functions (throwaway local Postgres) with a
 * scripted fake Toss API and a fake mail sender. MOCK test: no real Toss or
 * Resend call is made.
 *
 * Run (needs a local Postgres you can create databases on; never prod):
 *   PGDATABASE=postgres npx tsx tests/unit/toss-guest-email-flow.test.ts
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";

process.env.GUEST_CLAIM_TOKEN_SECRET = "test-secret-for-claim-links-0123456789abcdef";
process.env.APP_BASE_URL = "https://example.test";

import { claimGuestTossOrders, completeTossOrder, type TossDeps } from "../../lib/payment/tossConfirm";
import { processDueGuestEmails, sendGuestPurchaseEmail, buildGuestPurchaseEmail } from "../../lib/email/guestPurchaseEmail";
import type { MailMessage, MailResult } from "../../lib/email/resend";
import { claimTokenFor, verifyClaimToken, newClaimNonce } from "../../lib/payment/guestClaimToken";
import { postPurchaseDestination, resolvePostPurchase } from "../../lib/payment/postPurchaseDestination";
import type { TossPayment, TossResult } from "../../lib/payment/tossServer";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DB = `toss_email_test_${process.pid}`;

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

function fakeSupabase(): SupabaseClient {
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const named = Object.entries(args).map(([k, v]) => `${k} => ${lit(v)}`).join(", ");
    try {
      const out = psql(DB, `select coalesce(json_agg(t), '[]') from (select * from public.${name}(${named})) t`);
      return { data: JSON.parse(out || "[]") as unknown[], error: null };
    } catch (e) {
      return { data: null, error: { message: String((e as { stderr?: string }).stderr ?? e) } };
    }
  };
  const from = (table: string) => {
    const filters: string[] = [];
    let limit = "";
    const run = () => {
      const where = filters.length ? `where ${filters.join(" and ")}` : "";
      return JSON.parse(psql(DB, `select coalesce(json_agg(t), '[]') from (select * from public.${table} ${where} ${limit}) t`)) as unknown[];
    };
    const q = {
      select: () => q,
      eq: (c: string, v: unknown) => (filters.push(`${c} = ${lit(v)}`), q),
      is: (c: string, v: null) => (filters.push(`${c} is ${v === null ? "null" : lit(v)}`), q),
      in: (c: string, vs: unknown[]) => (filters.push(`${c} in (${vs.map(lit).join(",")})`), q),
      limit: (n: number) => ((limit = `limit ${n}`), q),
      then: (res: (v: { data: unknown[]; error: null }) => unknown) => res({ data: run(), error: null }),
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

function payment(orderId: string, paymentKey: string, amount: number): TossPayment {
  return {
    paymentKey,
    orderId,
    status: "DONE",
    totalAmount: amount,
    balanceAmount: amount,
    currency: "KRW",
    method: "카드",
    approvedAt: new Date().toISOString(),
    cancels: [],
    receiptUrl: "https://dashboard.tosspayments.com/receipt/test",
  };
}

/** Fake Toss + fake mailer; records calls. */
function harness(mail: (m: MailMessage) => MailResult | Promise<MailResult> = () => ({ kind: "sent", messageId: "m1" })) {
  const calls = { confirm: 0, cancel: 0, mails: [] as MailMessage[] };
  const deps: TossDeps = {
    confirm: async (p) => {
      calls.confirm++;
      return { kind: "ok", payment: payment(p.orderId, p.paymentKey, p.amount) } as TossResult;
    },
    get: async () => ({ kind: "unknown", reason: "no_get" }),
    cancel: async () => {
      calls.cancel++;
      return { kind: "unknown", reason: "no_cancel" };
    },
    mail: async (m) => {
      calls.mails.push(m);
      return mail(m);
    },
  };
  return { deps, calls };
}

let seq = 0;
function guestOrder(email: string, opts: { isTest?: boolean; locale?: string; plan?: string; amount?: number } = {}) {
  seq++;
  const orderId = `aha_${String(seq).padStart(32, "e")}`;
  psql(
    DB,
    `insert into toss_payment_orders (order_id, guest_email, plan_id, amount, currency, order_name, claim_token_nonce, claim_token_expires_at, locale, is_test)
     values (${lit(orderId)}, ${lit(email)}, ${lit(opts.plan ?? "kr_personal_premium")}, ${opts.amount ?? 7900}, 'KRW', 'Personal',
             ${lit(newClaimNonce())}, now() + interval '30 days', ${lit(opts.locale ?? "ko-KR")}, ${opts.isTest ?? true})`,
  );
  return orderId;
}
function memberOrder(user: string, isTest = true) {
  seq++;
  const orderId = `aha_${String(seq).padStart(32, "d")}`;
  psql(DB, `insert into toss_payment_orders (order_id, clerk_user_id, plan_id, amount, currency, order_name, locale, is_test)
            values (${lit(orderId)}, ${lit(user)}, 'kr_personal_premium', 7900, 'KRW', 'Personal', 'ko-KR', ${isTest})`);
  return orderId;
}
const col = (id: string, c: string) => psql(DB, `select ${c} from toss_payment_orders where order_id = ${lit(id)}`);
const credits = (user: string) =>
  Number(psql(DB, `select coalesce(sum(remaining),0) from credit_lots where clerk_user_id = ${lit(user)}`));

let passed = 0;
const ok = (name: string) => {
  passed++;
  console.log(`ok - ${name}`);
};

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
    ]) psqlFile(DB, resolve(root, "supabase/migrations", m));
    const sb = fakeSupabase();
    delete process.env.TOSS_TEST_RESTRICT;
    delete process.env.VERCEL_ENV;

    // 1. DEV guest test purchase: approved -> email queued + sent once, test-labelled
    {
      const o = guestOrder("buyer1@example.com");
      const h = harness();
      const r1 = await completeTossOrder(sb, { clerkUserId: null, orderId: o, paymentKey: "pk_e1", amount: 7900 }, h.deps);
      assert.deepEqual(r1, { status: "awaiting_claim", planId: "kr_personal_premium", emailStatus: "sent" });
      const r2 = await completeTossOrder(sb, { clerkUserId: null, orderId: o, paymentKey: "pk_e1", amount: 7900 }, h.deps);
      assert.equal(r2.status, "awaiting_claim");
      assert.equal(h.calls.confirm, 1);
      assert.equal(h.calls.mails.length, 1, "retry of confirm does not resend");
      const m = h.calls.mails[0];
      assert.equal(m.to, "buyer1@example.com");
      assert.match(m.subject, /^\[테스트 구매·실제 청구 없음\] \[Aha! It's me\] 구매하신 분석 이용권 안내$/);
      assert.match(m.text, /테스트 구매입니다\. 실제 청구는 발생하지 않았습니다/);
      assert.match(m.text, /7,900원/);
      assert.match(m.text, /구매일로부터 12개월 이내 생성권 사용/);
      assert.match(m.text, /회원가입 없이 바로 사용할 수 있어요/, "single Personal: usable without an account");
      assert.match(m.text, /이용권 사용하기: https:\/\/example\.test\/api\/payments\/toss\/claim-link/);
      assert.match(m.text, /https:\/\/example\.test\/kr\/refund/);
      assert.match(m.text, /https:\/\/example\.test\/api\/payments\/toss\/claim-link\?orderId=aha_[a-f0-9e]{32}&t=[A-Za-z0-9_-]{43}/);
      assert.match(m.text, /결제 영수증 보기\(토스페이먼츠 제공\)/);
      assert.equal(m.idempotencyKey, `guest-guide-${o}-0`);
      assert.doesNotMatch(m.text, /buyer1@example\.com/, "the email address itself is not repeated in the link/body");
      assert.equal(col(o, "guest_email_status"), "sent");
      assert.equal(col(o, "receipt_url"), "https://dashboard.tosspayments.com/receipt/test");
      ok("DEV guest test purchase: email queued and sent once, test label, product/amount/validity/link/refund, Toss receipt link");
    }

    // 2. transient 429 -> retry with backoff, picked up by the background sender
    {
      const o = guestOrder("buyer2@example.com", { isTest: false });
      let fail = true;
      const h = harness(() => (fail ? { kind: "retryable", reason: "resend_429_rate_limit_exceeded", retryAfterSeconds: 30 } : { kind: "sent", messageId: "m2" }));
      const r = await completeTossOrder(sb, { clerkUserId: null, orderId: o, paymentKey: "pk_e2", amount: 7900 }, h.deps);
      assert.deepEqual(r, { status: "awaiting_claim", planId: "kr_personal_premium", emailStatus: "pending" });
      assert.equal(col(o, "guest_email_status"), "retry");
      assert.equal(col(o, "status"), "paid", "mail failure does not touch the payment");
      fail = false;
      let run = await processDueGuestEmails(sb, { send: h.deps.mail });
      assert.equal(run.sent, 0, "not before the backoff");
      psql(DB, `update toss_payment_orders set guest_email_next_attempt_at = now() - interval '1 second' where order_id = ${lit(o)}`);
      run = await processDueGuestEmails(sb, { send: h.deps.mail });
      assert.equal(run.sent, 1);
      assert.equal(col(o, "guest_email_status"), "sent");
      assert.equal(h.calls.mails.length, 2);
      assert.equal(h.calls.mails[0].idempotencyKey, h.calls.mails[1].idempotencyKey, "same generation, same Idempotency-Key");
      assert.doesNotMatch(h.calls.mails[1].subject, /테스트/, "real purchase has no test label");
      run = await processDueGuestEmails(sb, { send: h.deps.mail });
      assert.equal(run.processed, 0);
      ok("429: queued for retry with backoff, background sender delivers once with the same Idempotency-Key; payment untouched");
    }

    // 3. concurrent senders: one lease, one email; expired lease is retaken
    {
      const o = guestOrder("buyer3@example.com", { isTest: false });
      psql(DB, `update toss_payment_orders set status = 'paid', approved_at = now(), payment_key = 'pk_e3' where order_id = ${lit(o)}`);
      psql(DB, `select queue_guest_purchase_email(${lit(o)})`);
      let n = 0;
      const slow = async (): Promise<MailResult> => {
        n++;
        await new Promise((r) => setTimeout(r, 50));
        return { kind: "sent", messageId: "m3" };
      };
      const [a, b] = await Promise.all([sendGuestPurchaseEmail(sb, o, { send: slow }), sendGuestPurchaseEmail(sb, o, { send: slow })]);
      assert.equal(n, 1);
      assert.deepEqual([a, b].sort(), ["pending", "sent"]);
      ok("concurrent sends: one wins the lease, exactly one email");
    }

    // 4. permanent failure -> failed; operator re-send = new generation
    {
      const o = guestOrder("bounce@example.com", { isTest: false });
      const h = harness(() => ({ kind: "failed", reason: "resend_422_validation_error" }));
      const r = await completeTossOrder(sb, { clerkUserId: null, orderId: o, paymentKey: "pk_e4", amount: 7900 }, h.deps);
      assert.equal(r.status === "awaiting_claim" && r.emailStatus, "failed");
      assert.equal((await processDueGuestEmails(sb, { send: h.deps.mail })).processed, 0, "permanent failure is not auto-retried");
      assert.equal(psql(DB, `select reissue_guest_purchase_email(${lit(o)})`), "reissued");
      const ok2 = await sendGuestPurchaseEmail(sb, o, { send: async () => ({ kind: "sent", messageId: "m4" }) });
      assert.equal(ok2, "sent");
      assert.equal(col(o, "guest_email_generation"), "1");
      ok("permanent failure recorded (not retried blindly); operator re-send uses a new generation");
    }

    // 5. claim: email mismatch, verified match grants once, repeat / other account
    {
      const o = guestOrder("owner@example.com", { isTest: false });
      const h = harness();
      await completeTossOrder(sb, { clerkUserId: null, orderId: o, paymentKey: "pk_e5", amount: 7900 }, h.deps);
      const mismatch = await claimGuestTossOrders(sb, { clerkUserId: "u_x", verifiedEmails: ["other@example.com"], orderIds: [o] });
      assert.equal(mismatch[0].result, "email_mismatch");
      const good = await claimGuestTossOrders(sb, { clerkUserId: "u_owner", verifiedEmails: ["OWNER@example.com"], orderIds: [o] });
      assert.deepEqual(good, [{ orderId: o, result: "claimed", planId: "kr_personal_premium" }]);
      const again = await claimGuestTossOrders(sb, { clerkUserId: "u_owner", verifiedEmails: ["owner@example.com"], orderIds: [o] });
      assert.equal(again[0].result, "already_claimed");
      const other = await claimGuestTossOrders(sb, { clerkUserId: "u_thief", verifiedEmails: ["owner@example.com"], orderIds: [o] });
      assert.equal(other[0].result, "claimed_by_other");
      assert.equal(credits("u_owner"), 1);
      assert.equal(credits("u_thief"), 0);
      assert.equal(await sendGuestPurchaseEmail(sb, o, { send: h.deps.mail! }), "not_applicable", "no email after it is claimed");
      ok("claim: unverified/other email refused, verified match grants exactly once, no takeover, no mail after claim");
    }

    // 6. public deployment: ordinary test payments record test_completed, nothing granted, no cancel, no mail
    {
      process.env.TOSS_TEST_RESTRICT = "true";
      process.env.TOSS_TEST_ALLOWLIST = "u_tester,qa@example.com";
      process.env.TOSS_TEST_GRANT_LIMIT = "1";
      const g = guestOrder("visitor@example.com");
      const h = harness();
      const rg = await completeTossOrder(sb, { clerkUserId: null, orderId: g, paymentKey: "pk_p1", amount: 7900 }, h.deps);
      assert.deepEqual(rg, { status: "test_no_grant", reason: "not_allowlisted" });
      assert.equal(col(g, "status"), "test_completed");
      assert.equal(col(g, "guest_email_status"), "skipped");
      const again = await completeTossOrder(sb, { clerkUserId: null, orderId: g, paymentKey: "pk_p1", amount: 7900 }, h.deps);
      assert.equal(again.status, "test_no_grant");

      const m = memberOrder("u_visitor");
      const rm = await completeTossOrder(
        sb,
        { clerkUserId: "u_visitor", orderId: m, paymentKey: "pk_p2", amount: 7900, testAccess: async () => ({ allowed: false, reason: "not_allowlisted" }) },
        h.deps,
      );
      assert.equal(rm.status, "test_no_grant");
      assert.equal(credits("u_visitor"), 0);
      assert.equal(h.calls.cancel, 0, "no automatic cancel");
      assert.equal(h.calls.mails.length, 0);
      ok("public test payments by ordinary visitors: status test_completed, no pass, no auto-cancel, no email, repeat stays closed");
    }

    // 7. public deployment: allowlisted tester (server-side decision) within the limit
    {
      const { decideTestGrant } = await import("../../lib/payment/tossTestMode");
      const h = harness();
      const m1 = memberOrder("u_tester");
      const access = () => decideTestGrant(sb, { clerkUserId: "u_tester", verifiedEmails: [] });
      const r1 = await completeTossOrder(sb, { clerkUserId: "u_tester", orderId: m1, paymentKey: "pk_t1", amount: 7900, testAccess: access }, h.deps);
      assert.equal(r1.status, "granted");
      const m2 = memberOrder("u_tester");
      const r2 = await completeTossOrder(sb, { clerkUserId: "u_tester", orderId: m2, paymentKey: "pk_t2", amount: 7900, testAccess: access }, h.deps);
      assert.deepEqual(r2, { status: "test_no_grant", reason: "limit_reached" });
      assert.equal(credits("u_tester"), 1);

      // guest flow for an allowlisted email: email goes out, grant decided on the verified account
      const g = guestOrder("qa@example.com");
      const rg = await completeTossOrder(sb, { clerkUserId: null, orderId: g, paymentKey: "pk_t3", amount: 7900 }, h.deps);
      assert.equal(rg.status === "awaiting_claim" && rg.emailStatus, "sent");
      const c = await claimGuestTossOrders(sb, { clerkUserId: "u_qa", verifiedEmails: ["qa@example.com"], orderIds: [g] });
      assert.equal(c[0].result, "claimed");
      const g2 = guestOrder("qa@example.com");
      await completeTossOrder(sb, { clerkUserId: null, orderId: g2, paymentKey: "pk_t4", amount: 7900 }, h.deps);
      const c2 = await claimGuestTossOrders(sb, { clerkUserId: "u_qa", verifiedEmails: ["qa@example.com"], orderIds: [g2] });
      assert.equal(c2[0].result, "test_not_allowed", "over the per-account test limit");
      assert.equal(col(g2, "status"), "test_completed");
      assert.equal(credits("u_qa"), 1);
      delete process.env.TOSS_TEST_RESTRICT;
      delete process.env.TOSS_TEST_ALLOWLIST;
      delete process.env.TOSS_TEST_GRANT_LIMIT;
      ok("public: allowlisted tester (Clerk id / verified email, server-side) gets a pass up to the limit, then test_completed");
    }

    // 8. claim-link token: valid / wrong / expired / rotated by a new-link request
    {
      const o = guestOrder("link@example.com", { isTest: false });
      await completeTossOrder(sb, { clerkUserId: null, orderId: o, paymentKey: "pk_l1", amount: 7900 }, harness().deps);
      const nonce = col(o, "claim_token_nonce");
      const exp = col(o, "claim_token_expires_at");
      const token = claimTokenFor(o, nonce)!;
      assert.equal(verifyClaimToken({ orderId: o, nonce, expiresAt: exp, token }), true);
      assert.equal(verifyClaimToken({ orderId: o, nonce, expiresAt: exp, token: token.slice(0, -1) + "A" }), false);
      assert.equal(verifyClaimToken({ orderId: `aha_${"0".repeat(32)}`, nonce, expiresAt: exp, token }), false);
      assert.equal(verifyClaimToken({ orderId: o, nonce, expiresAt: new Date(Date.now() - 1000).toISOString(), token }), false);
      // expired link: order + pass untouched; a new link (new nonce) is emailed to the ORDER email
      psql(DB, `update toss_payment_orders set claim_token_expires_at = now() - interval '1 day', guest_email_sent_at = now() - interval '1 hour' where order_id = ${lit(o)}`);
      const newNonce = newClaimNonce();
      assert.equal(
        psql(DB, `select reissue_guest_purchase_email(${lit(o)}, ${lit(newNonce)}, now() + interval '30 days', 300)`),
        "reissued",
      );
      assert.equal(psql(DB, `select reissue_guest_purchase_email(${lit(o)}, ${lit(newClaimNonce())}, now() + interval '30 days', 300)`), "reissued", "not yet re-sent -> still allowed");
      const sent: MailMessage[] = [];
      await sendGuestPurchaseEmail(sb, o, { send: async (m) => (sent.push(m), { kind: "sent", messageId: "m8" }) });
      assert.equal(sent[0].to, "link@example.com");
      assert.equal(psql(DB, `select reissue_guest_purchase_email(${lit(o)}, ${lit(newClaimNonce())}, now() + interval '30 days', 300)`), "too_soon");
      const n2 = col(o, "claim_token_nonce");
      assert.equal(verifyClaimToken({ orderId: o, nonce: n2, expiresAt: col(o, "claim_token_expires_at"), token }), false, "old link replaced");
      assert.equal(col(o, "status"), "paid");
      ok("claim link: HMAC token verified, wrong/expired/replaced rejected; new link only to the order email, throttled; order untouched");
    }

    // 9. English email + destinations
    {
      const en = buildGuestPurchaseEmail({
        locale: "en-US",
        planId: "kr_relationship_triple",
        amount: 33000,
        currency: "KRW",
        approvedAt: "2026-10-08T00:00:00Z",
        isTest: false,
        claimUrl: "https://example.test/api/payments/toss/claim-link?orderId=x&t=y",
        refundUrl: "https://example.test/refund",
        receiptUrl: null,
      });
      assert.equal(en.subject, "[Aha! It's me] Your analysis pass purchase");
      assert.match(en.text, /Use all 3 report credits within 12 months of purchase/);
      assert.match(en.text, /You'll receive your pass after linking an account/);
      assert.match(en.text, /Sign up and link my pass: /);
      assert.doesNotMatch(en.text, /receipt/i, "no receipt line when Toss gave no receipt URL");
      const s = { reportId: "r1", surveyCompleted: true, birthDate: "1990-01-01" };
      assert.equal(postPurchaseDestination({ planId: "kr_personal_premium", locale: "ko-KR", session: s }), "/blueprint-preview/r1/essence/deep?autostart=1");
      assert.equal(postPurchaseDestination({ planId: "kr_relationship_triple", locale: "ko-KR", session: s }), "/relationships?myReportId=r1");
      assert.equal(postPurchaseDestination({ planId: "kr_personal_premium", locale: "ko-KR", session: { ...s, birthDate: null } }), "/onboarding/birth?reportId=r1");
      assert.equal(postPurchaseDestination({ planId: "us_personal_premium", locale: "en-US", session: { ...s, surveyCompleted: false } }), "/survey-v2?reportId=r1");
      assert.equal(postPurchaseDestination({ planId: "kr_personal_premium", locale: "ko-KR", session: { ...s, surveyCompleted: false } }), "/blueprint-preview/r1/essence/deep?autostart=1", "KR survey optional");
      assert.equal(postPurchaseDestination({ planId: "kr_personal_premium", locale: "ko-KR", session: null }), "/");
      assert.equal(postPurchaseDestination({ planId: "x", locale: "ko-KR", session: s, explicitReturnPath: "/kr/blueprint-preview/r1/essence/deep" }), "/kr/blueprint-preview/r1/essence/deep");
      // Relationship products: own details first (friend-add rules), then back to adding a friend.
      const rel = resolvePostPurchase({ planId: "kr_relationship_premium", locale: "ko-KR", session: { ...s, birthDate: null } });
      assert.deepEqual(rel, { path: "/onboarding/birth?reportId=r1", selfProfileReturn: "/relationships?section=add&myReportId=r1" });
      assert.deepEqual(resolvePostPurchase({ planId: "kr_relationship_triple", locale: "ko-KR", session: null }), { path: "/?start=self", selfProfileReturn: "/relationships?section=add" });
      assert.deepEqual(resolvePostPurchase({ planId: "us_relationship_premium", locale: "en-US", session: { ...s, surveyCompleted: false } }), { path: "/survey-v2?reportId=r1", selfProfileReturn: "/relationships?section=add&myReportId=r1" }, "US survey required first");
      assert.equal(postPurchaseDestination({ planId: "kr_relationship_premium", locale: "ko-KR", session: { ...s, surveyCompleted: false } }), "/relationships?myReportId=r1", "KR survey optional for relationships");
      // 30-day pass: the existing chooser (personal / relationship / Decision Journal).
      assert.equal(postPurchaseDestination({ planId: "kr_insight_pass_30d", locale: "ko-KR", session: s }), "/?start=choice");
      assert.equal(postPurchaseDestination({ planId: "kr_insight_pass_30d", locale: "ko-KR", session: null }), "/?start=choice");
      ok("English email copy; post-purchase destination follows plan / locale / survey / birth state");
    }

    console.log(`\ntoss-guest-email-flow: ${passed} passed`);
  } finally {
    try {
      psql("postgres", `drop database if exists ${DB}`);
    } catch {
      /* ignore */
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
