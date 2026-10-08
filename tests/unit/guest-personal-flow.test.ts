/**
 * Guest (no-account) Personal use + guest membership linking -- against the
 * REAL SQL functions (throwaway local Postgres) with a fake generator, fake
 * Toss and fake mail. MOCK test: no real Toss / Resend / OpenAI call.
 *
 * Run: PGDATABASE=postgres npx tsx tests/unit/guest-personal-flow.test.ts
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";

process.env.GUEST_CLAIM_TOKEN_SECRET = "test-secret-for-claim-links-0123456789abcdef";
process.env.APP_BASE_URL = "https://example.test";

import {
  generateGuestPersonal,
  loadGuestPersonalState,
  saveGuestPersonalInput,
  saveGuestPersonalToAccount,
} from "../../lib/payment/guestPersonal";
import { buyerCookieValue, hashVerificationCode, isBuyerCookieFor, openGuestSession, resolveGuestSession } from "../../lib/payment/guestAccess";
import { claimGuestTossOrders, completeTossOrder, type TossDeps } from "../../lib/payment/tossConfirm";
import { buildGuestPurchaseEmail } from "../../lib/email/guestPurchaseEmail";
import { buildGuestCodeEmail } from "../../lib/email/guestCodeEmail";
import type { SlimV1ReportResult } from "../../lib/v1/slim/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DB = `guest_personal_test_${process.pid}`;

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
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
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

const fakeReport = (tag: string) => ({ llm_source: "llm", tag, structured: { part01: tag } }) as unknown as SlimV1ReportResult;

let seq = 0;
function paidGuestOrder(email: string, opts: { plan?: string; amount?: number; currency?: string; locale?: string; approvedDaysAgo?: number } = {}) {
  seq++;
  const id = `aha_${String(seq).padStart(32, "a")}`;
  psql(
    DB,
    `insert into toss_payment_orders (order_id, guest_email, plan_id, amount, currency, order_name, status, payment_key, approved_at, locale, claim_token_nonce, claim_token_expires_at)
     values (${lit(id)}, ${lit(email)}, ${lit(opts.plan ?? "kr_personal_premium")}, ${opts.amount ?? 7900}, ${lit(opts.currency ?? "KRW")}, 'P', 'paid', ${lit(`pk_${id}`)},
             now() - interval '${opts.approvedDaysAgo ?? 0} days', ${lit(opts.locale ?? "ko-KR")}, 'nonce${seq}', now() + interval '30 days')`,
  );
  return id;
}
const q1 = (sql: string) => psql(DB, sql);
const col = (id: string, c: string) => q1(`select ${c} from toss_payment_orders where order_id = ${lit(id)}`);
const issue = (id: string, code: string) =>
  q1(`select issue_guest_purchase_code(${lit(id)}, ${lit(hashVerificationCode(id, code))}, 600, 5)`);
const verify = (id: string, code: string) =>
  q1(`select verify_guest_purchase_code(${lit(id)}, ${lit(hashVerificationCode(id, code))}, 5)`);
const input = { birthDate: "1990-05-17", birthTime: "08:30", birthPlace: "서울" };

let passed = 0;
const ok = (name: string) => {
  passed++;
  console.log(`ok - ${name}`);
};

function tossDeps(): TossDeps & { calls: { cancel: number } } {
  const calls = { cancel: 0 };
  return {
    calls,
    confirm: async (p) => ({
      kind: "ok",
      payment: {
        paymentKey: p.paymentKey,
        orderId: p.orderId,
        status: "DONE",
        totalAmount: p.amount,
        balanceAmount: p.amount,
        currency: "USD",
        method: "카드",
        approvedAt: new Date().toISOString(),
        cancels: [],
      },
    }),
    get: async () => ({ kind: "unknown", reason: "x" }),
    cancel: async () => {
      calls.cancel++;
      return { kind: "ok", payment: {} as never };
    },
    mail: async () => ({ kind: "sent", messageId: "m" }),
  };
}

async function main() {
  psql("postgres", `create database ${DB}`);
  try {
    q1("do $$ begin create role service_role; exception when duplicate_object then null; end $$;");
    q1("do $$ begin create role anon; exception when duplicate_object then null; end $$;");
    q1("do $$ begin create role authenticated; exception when duplicate_object then null; end $$;");
    q1(`create extension if not exists pgcrypto;
        create table public.relationship_reports(id uuid primary key default gen_random_uuid());
        create table public.reports(id uuid primary key default gen_random_uuid(), clerk_user_id text not null, name text,
          birth_date date, birth_time text, birth_place text, report_type text not null default 'self',
          entitlement text not null default 'free', created_at timestamptz default now(), updated_at timestamptz default now());
        create table public.survey_responses(id uuid primary key default gen_random_uuid(), report_id uuid not null references reports(id) on delete cascade, answers jsonb not null);
        create table public.report_analyses(id uuid primary key default gen_random_uuid(), report_id uuid not null references reports(id) on delete cascade,
          analysis_type text, content text not null, metadata jsonb, unique(report_id, analysis_type));`);
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
      "20261009090000_guest_personal_access.sql",
    ]) psqlFile(DB, resolve(root, "supabase/migrations", m));
    const sb = fakeSupabase();

    // 1. temp store is not reachable for ordinary roles
    {
      for (const t of ["guest_personal_profiles", "guest_access_sessions", "guest_purchase_codes"]) {
        for (const role of ["anon", "authenticated"]) {
          assert.equal(q1(`select has_table_privilege('${role}', 'public.${t}', 'select')`), "f", `${role} ${t}`);
        }
        assert.equal(q1(`select relrowsecurity from pg_class where relname = '${t}'`), "t");
        assert.equal(q1(`select has_table_privilege('service_role', 'public.${t}', 'select')`), "t");
      }
      ok("temporary store: RLS on, no privileges for anon/authenticated, service role only");
    }

    // 2. purchase verification code: limits, attempts, binding, expiry
    {
      const o = paidGuestOrder("code@example.com");
      const unpaid = `aha_${"f".repeat(32)}`;
      q1(`insert into toss_payment_orders (order_id, guest_email, plan_id, amount, currency, order_name) values ('${unpaid}', 'x@example.com', 'kr_personal_premium', 7900, 'KRW', 'P')`);
      assert.equal(issue(unpaid, "111111"), "not_eligible");
      assert.equal(issue(o, "123456"), "issued");
      assert.equal(verify(o, "000000"), "mismatch");
      assert.equal(issue(o, "654321"), "issued", "new code replaces the old one");
      assert.equal(verify(o, "123456"), "mismatch", "old code no longer works");
      // a code is bound to its order: the same digits hashed for another order never match
      const other = paidGuestOrder("other@example.com");
      assert.equal(issue(other, "654321"), "issued");
      assert.notEqual(hashVerificationCode(o, "654321"), hashVerificationCode(other, "654321"));
      for (let i = 0; i < 3; i++) assert.equal(verify(o, "999999"), "mismatch");
      assert.equal(verify(o, "999999"), "locked", "5th wrong try locks the code");
      assert.equal(verify(o, "654321"), "locked", "even the right code after lock");
      assert.equal(issue(o, "222222"), "issued");
      assert.equal(issue(o, "333333"), "issued");
      assert.equal(issue(o, "444444"), "issued");
      assert.equal(issue(o, "555555"), "too_many", "max 5 codes per order per hour");
      assert.equal(verify(o, "444444"), "ok");
      assert.equal(verify(o, "444444"), "expired", "a code works once");
      const e = paidGuestOrder("exp@example.com");
      assert.equal(issue(e, "121212"), "issued");
      q1(`update guest_purchase_codes set expires_at = now() - interval '1 second' where order_id = ${lit(e)}`);
      assert.equal(verify(e, "121212"), "expired");
      ok("code: only to paid guest orders, bound to the order, single use, 10-min expiry, 5 tries lock, 5/hour per order");
    }

    // 3. sessions: 7 days, resolve, expired
    {
      const o = paidGuestOrder("sess@example.com");
      const token = await openGuestSession(sb, o, "code");
      assert.ok(token);
      assert.equal(await resolveGuestSession(sb, token), o);
      assert.equal(await resolveGuestSession(sb, `${token}x`), null);
      const days = Number(q1(`select round(extract(epoch from (expires_at - created_at)) / 86400) from guest_access_sessions where order_id = ${lit(o)}`));
      assert.equal(days, 7);
      q1(`update guest_access_sessions set expires_at = now() - interval '1 second' where order_id = ${lit(o)}`);
      assert.equal(await resolveGuestSession(sb, token), null, "expired session -> must verify again");
      assert.equal(q1(`select count(*) from guest_access_sessions where session_hash = ${lit(token)}`), "0", "only the hash is stored");
      ok("guest session: 7 days, token never stored, expired -> re-verify");
    }

    // 4a. optional survey after birth: complete answers stored, partial rejected, "keep" keeps stored answers
    {
      const o = paidGuestOrder("survey@example.com");
      const full = { q1: "A", q2: "B", q3: "C", q4: "D", q5: "A", q6: "B", q7: "C", q8: "D", q9: "A", q10: "3" };
      assert.deepEqual(await saveGuestPersonalInput(sb, o, "ko-KR", { ...input, surveyAnswers: { q1: "A" } }), { ok: false, code: "invalid_input" }, "partial survey rejected");
      assert.deepEqual(await saveGuestPersonalInput(sb, o, "ko-KR", { ...input, surveyAnswers: full }), { ok: true });
      assert.equal(JSON.parse(q1(`select survey_answers from guest_personal_profiles where order_id = ${lit(o)}`)).q10, "3");
      assert.deepEqual(await saveGuestPersonalInput(sb, o, "ko-KR", { ...input, birthTime: "09:15", keepSurvey: true }), { ok: true });
      assert.equal(JSON.parse(q1(`select survey_answers from guest_personal_profiles where order_id = ${lit(o)}`)).q1, "A", "edit keeps answers");
      assert.deepEqual(await saveGuestPersonalInput(sb, o, "ko-KR", input), { ok: true });
      assert.equal(q1(`select coalesce(survey_answers::text, 'null') from guest_personal_profiles where order_id = ${lit(o)}`), "null", "skip clears answers");
      const u = paidGuestOrder("survey-us@example.com", { locale: "en-US" });
      assert.deepEqual(await saveGuestPersonalInput(sb, u, "en-US", { ...input, surveyAnswers: full }), { ok: true }, "en-US with survey");
      ok("survey after birth: optional in KR (complete answers only), kept on edit, cleared on skip; required in en-US");
    }

    // 4. input rules (KR survey optional, en-US survey required) + generation once from stored input
    {
      const o = paidGuestOrder("gen@example.com");
      assert.deepEqual(await saveGuestPersonalInput(sb, o, "ko-KR", { birthDate: "1990-13-40" }), { ok: false, code: "invalid_input" });
      assert.deepEqual(await saveGuestPersonalInput(sb, o, "ko-KR", { birthDate: "1990-05-17", birthTime: "08:30" }), { ok: false, code: "invalid_input" }, "place or 'unknown' required");
      assert.deepEqual(await saveGuestPersonalInput(sb, o, "en-US", input), { ok: false, code: "survey_required" });
      assert.deepEqual(await saveGuestPersonalInput(sb, o, "ko-KR", input), { ok: true });

      let calls = 0;
      let seen: unknown = null;
      const slowGen = async (i: unknown) => {
        calls++;
        seen = i;
        await new Promise((r) => setTimeout(r, 60));
        return fakeReport("g1");
      };
      const [a, b] = await Promise.all([
        generateGuestPersonal(sb, o, { generate: slowGen }),
        generateGuestPersonal(sb, o, { generate: slowGen }),
      ]);
      assert.equal(calls, 1, "concurrent requests: one generation");
      assert.deepEqual([a.kind, b.kind].sort(), ["in_progress", "ok"]);
      assert.deepEqual(seen, { birthDate: "1990-05-17", birthTime: "08:30", birthTimeUnknown: false, birthPlace: "서울", surveyAnswers: null, locale: "ko-KR" }, "stored input only");
      assert.equal(col(o, "guest_use_status"), "used");
      const again = await generateGuestPersonal(sb, o, { generate: slowGen });
      assert.equal(again.kind, "already_used");
      assert.equal(calls, 1);
      assert.deepEqual(await saveGuestPersonalInput(sb, o, "ko-KR", { ...input, birthPlace: "부산" }), { ok: false, code: "locked" });
      const st = await loadGuestPersonalState(sb, o);
      assert.equal(st?.status, "generated");
      const retentionDays = Number(q1(`select round(extract(epoch from (retention_expires_at - generated_at)) / 86400) from guest_personal_profiles where order_id = ${lit(o)}`));
      assert.ok(retentionDays >= 365 && retentionDays <= 366, "kept 12 months from generation");
      ok("guest Personal: KR survey optional / en-US required, place required, generated once from stored input, concurrent-safe, locked after");
    }

    // 5. failed generation releases the use; expired pass; email-scanner style GET never uses
    {
      const o = paidGuestOrder("fail@example.com");
      await saveGuestPersonalInput(sb, o, "ko-KR", { ...input, birthPlaceUnknown: true, birthPlace: "" });
      const fb = await generateGuestPersonal(sb, o, { generate: async () => ({ llm_source: "fallback" }) as unknown as SlimV1ReportResult });
      assert.equal(fb.kind, "failed");
      assert.equal(col(o, "guest_use_status"), "", "released -> can retry");
      const r = await generateGuestPersonal(sb, o, { generate: async (i) => (assert.equal(i.birthPlace !== null && i.birthPlace !== "", true), fakeReport("ok")) });
      assert.equal(r.kind, "ok");

      const old = paidGuestOrder("old@example.com", { approvedDaysAgo: 400 });
      await saveGuestPersonalInput(sb, old, "ko-KR", input);
      const ex = await generateGuestPersonal(sb, old, { generate: async () => fakeReport("x") });
      assert.deepEqual(ex, { kind: "rejected", code: "expired" });

      const viewOnly = paidGuestOrder("scan@example.com");
      await loadGuestPersonalState(sb, viewOnly); // reading state (what a page / scanner load does)
      assert.equal(col(viewOnly, "guest_use_status"), "", "reading never uses the pass");
      ok("failure releases the pass; pass expires 12 months after purchase; reads never use it; unknown place uses the locale fallback");
    }

    // 5b. buyer's own browser right after paying: 'purchase' session; cookie bound to the order
    {
      const o = paidGuestOrder("buyer-browser@example.com");
      const other = paidGuestOrder("someone@example.com");
      const cookie = buyerCookieValue(o);
      assert.ok(cookie);
      assert.ok(isBuyerCookieFor(cookie, o));
      assert.ok(!isBuyerCookieFor(cookie, other), "cookie for one order does not open another");
      assert.ok(!isBuyerCookieFor(`${o}.forged`, o));
      assert.ok(!isBuyerCookieFor(null, o));
      const token = await openGuestSession(sb, o, "purchase");
      assert.ok(token);
      assert.equal(await resolveGuestSession(sb, token), o);
      assert.equal(q1(`select via from guest_access_sessions where order_id = ${lit(o)}`), "purchase");
      ok("buyer browser: purchase session opens only for the order its cookie is bound to");
    }

    // 6. save to account: verified matching email only, no re-entry, no extra credit, idempotent
    {
      const o = paidGuestOrder("Owner@Example.com".toLowerCase());
      await saveGuestPersonalInput(sb, o, "ko-KR", input);
      await generateGuestPersonal(sb, o, { generate: async () => fakeReport("saved") });
      const token = await openGuestSession(sb, o, "link");
      const wrong = await saveGuestPersonalToAccount(sb, { orderId: o, clerkUserId: "u_x", verifiedEmails: ["other@example.com"] });
      assert.equal(wrong.result, "email_mismatch");
      const good = await saveGuestPersonalToAccount(sb, { orderId: o, clerkUserId: "u_owner", verifiedEmails: ["OWNER@example.com "] });
      assert.equal(good.result, "saved");
      assert.ok(good.reportId);
      assert.equal(q1(`select clerk_user_id || '|' || birth_date || '|' || birth_time || '|' || birth_place from reports where id = ${lit(good.reportId)}`), "u_owner|1990-05-17|08:30|서울");
      const content = JSON.parse(q1(`select content from report_analyses where report_id = ${lit(good.reportId)} and analysis_type = 'deep_essence_structured'`));
      assert.equal(content.locale, "ko-KR");
      assert.equal(content.slim_v1.tag, "saved");
      const again = await saveGuestPersonalToAccount(sb, { orderId: o, clerkUserId: "u_owner", verifiedEmails: ["owner@example.com"] });
      assert.deepEqual(again, { result: "already_saved", reportId: good.reportId });
      assert.equal(q1(`select count(*) from reports where clerk_user_id = 'u_owner'`), "1");
      assert.equal(q1(`select count(*) from credit_lots where clerk_user_id = 'u_owner'`), "0", "no credit for a used pass");
      assert.equal(q1(`select coalesce(birth_date,'') || coalesce(report::text,'') from guest_personal_profiles where order_id = ${lit(o)}`), "", "guest copy cleared");
      assert.equal(await resolveGuestSession(sb, token), null, "guest sessions revoked");
      const other = await saveGuestPersonalToAccount(sb, { orderId: o, clerkUserId: "u_thief", verifiedEmails: ["owner@example.com"] });
      assert.equal(other.result, "claimed_by_other");
      ok("save to account: matching verified email only, birth+report copied (no regeneration), no credit, idempotent, guest copy cleared");
    }

    // 7. account claim path: used guest Personal -> report, unused -> credit; exclusivity
    {
      const used = paidGuestOrder("both@example.com");
      await saveGuestPersonalInput(sb, used, "ko-KR", input);
      await generateGuestPersonal(sb, used, { generate: async () => fakeReport("c") });
      const unused = paidGuestOrder("both@example.com");
      const r = await claimGuestTossOrders(sb, { clerkUserId: "u_both", verifiedEmails: ["both@example.com"] });
      const byId = Object.fromEntries(r.map((x) => [x.orderId, x]));
      assert.equal(byId[used].result, "claimed");
      assert.ok(byId[used].reportId, "used order -> report saved into the account");
      assert.equal(byId[unused].result, "claimed");
      assert.equal(q1(`select coalesce(sum(remaining),0) from credit_lots where clerk_user_id = 'u_both'`), "1", "only the unused order became a credit");
      const after = await generateGuestPersonal(sb, unused, { generate: async () => fakeReport("no") });
      assert.deepEqual(after, { kind: "rejected", code: "claimed" }, "a linked order cannot also be used as a guest");
      ok("claim: used guest Personal saved as report (no credit), unused becomes 1 credit, linked order cannot be guest-used");
    }

    // 8. retention sweep
    {
      const inputOnlyExpired = paidGuestOrder("p1@example.com");
      await saveGuestPersonalInput(sb, inputOnlyExpired, "ko-KR", input);
      q1(`update guest_personal_profiles set input_expires_at = now() - interval '1 second' where order_id = ${lit(inputOnlyExpired)}`);
      const inputOnlyActive = paidGuestOrder("p2@example.com");
      await saveGuestPersonalInput(sb, inputOnlyActive, "ko-KR", input);
      const genOld = paidGuestOrder("p3@example.com");
      await saveGuestPersonalInput(sb, genOld, "ko-KR", input);
      await generateGuestPersonal(sb, genOld, { generate: async () => fakeReport("old") });
      q1(`update guest_personal_profiles set retention_expires_at = now() - interval '1 second' where order_id = ${lit(genOld)}`);
      const refunded = paidGuestOrder("p4@example.com");
      await saveGuestPersonalInput(sb, refunded, "ko-KR", input);
      q1(`update toss_payment_orders set status = 'refunded' where order_id = ${lit(refunded)}`);
      q1("select purge_guest_personal_data()");
      const left = (id: string) => q1(`select count(*) from guest_personal_profiles where order_id = ${lit(id)}`);
      assert.deepEqual([left(inputOnlyExpired), left(inputOnlyActive), left(genOld), left(refunded)], ["0", "1", "0", "0"]);
      assert.equal(col(genOld, "status"), "paid", "order record itself is kept");
      ok("retention: input-only deleted at pass expiry, generated 12 months after generation, refunded at once; orders kept");
    }

    // 9. guest membership: duplicate member refused + refunded; windows anchored to purchase
    {
      const deps = tossDeps();
      q1(`insert into toss_payment_orders (order_id, clerk_user_id, plan_id, amount, currency, order_name, locale) values ('aha_${"b".repeat(32)}', 'u_member', 'us_annual_membership', 280, 'USD', 'M', 'en-US')`);
      const first = await completeTossOrder(sb, { clerkUserId: "u_member", orderId: `aha_${"b".repeat(32)}`, paymentKey: "pk_m1", amount: 280 }, deps);
      assert.equal(first.status, "granted");
      const g = paidGuestOrder("member@example.com", { plan: "us_annual_membership", amount: 280, currency: "USD", locale: "en-US" });
      const dup = await claimGuestTossOrders(sb, { clerkUserId: "u_member", verifiedEmails: ["member@example.com"], orderIds: [g] }, deps);
      assert.equal(dup[0].result, "already_member_refunded");
      assert.equal(deps.calls.cancel, 1);
      assert.equal(col(g, "status"), "canceled");
      assert.equal(q1(`select count(*) from memberships where clerk_user_id = 'u_member'`), "1");

      const g2 = paidGuestOrder("newm@example.com", { plan: "us_annual_membership", amount: 280, currency: "USD", locale: "en-US", approvedDaysAgo: 10 });
      const c = await claimGuestTossOrders(sb, { clerkUserId: "u_newm", verifiedEmails: ["newm@example.com"], orderIds: [g2] }, deps);
      assert.equal(c[0].result, "claimed");
      const drift = Number(q1(`select abs(extract(epoch from (m.current_term_end - (o.approved_at + interval '12 months')))) from memberships m join toss_payment_orders o on o.order_id = m.payment_order_id where m.payment_order_id = ${lit(g2)}`));
      assert.ok(drift < 86400 * 2, "membership ends ~12 months after the purchase, not the claim");
      ok("guest membership: account with an active membership is refused and refunded; new member's term anchored to purchase date");
    }

    // 10. emails: Personal vs account-required copy
    {
      const base = { amount: 7900, currency: "KRW", approvedAt: "2026-10-08T00:00:00Z", isTest: false, claimUrl: "https://x/l", refundUrl: "https://x/r", receiptUrl: null };
      const pe = buildGuestPurchaseEmail({ ...base, locale: "ko-KR", planId: "kr_personal_premium" });
      assert.match(pe.text, /회원가입 없이 바로 사용할 수 있어요/);
      assert.match(pe.text, /이용권 사용하기: https:\/\/x\/l/);
      assert.match(pe.text, /어느 기기에서든 구매 확인이 필요하고, 확인은 7일간 유지돼요/);
      assert.doesNotMatch(pe.text, /다른 기기에서/);
      assert.match(pe.text, /분석 생성일로부터 12개월간/);
      assert.match(pe.text, /이용권 기한이 끝날 때 삭제돼요/);
      const pass = buildGuestPurchaseEmail({ ...base, amount: 20000, locale: "ko-KR", planId: "kr_insight_pass_30d", maskedEmail: "ab***@x.com" });
      // Account products: same wording as the claim page (lib/payment/accountLinkCopy.ts).
      assert.match(pass.text, /가입하고 이용권 연결하기: https:\/\/x\/l/);
      assert.match(pass.text, /한 달의 인사이트, 한곳에서/);
      assert.match(pass.text, /Decision Journal을 이어서 이용하고 기록하려면 로그인이 필요해요/);
      assert.match(pass.text, /이용 기간: 2026년 11월 7일까지 \(구매일부터 30일, 계정 연결일과 관계없어요\)/, "actual end date from purchase");
      assert.match(pass.text, /구매 이메일 ab\*\*\*@x\.com로 가입하거나 로그인해 주세요/);
      assert.match(pass.text, /추가 결제 없이 연결돼요/);
      assert.match(pass.text, /가입하면 무료 개인·관계 분석도 이용할 수 있어요/);
      assert.doesNotMatch(pass.text, /회원가입 없이/);
      const rel = buildGuestPurchaseEmail({ ...base, locale: "ko-KR", planId: "kr_relationship_premium" });
      assert.match(rel.text, /두 사람의 이야기를 이어가세요/);
      assert.match(rel.text, /친구 초대와 보고서 보관도 할 수 있도록 로그인이 필요해요/);
      assert.doesNotMatch(rel.text, /1회씩 사용돼요/, "usage line is Triple-only");
      const tri = buildGuestPurchaseEmail({ ...base, locale: "ko-KR", planId: "kr_relationship_triple" });
      assert.match(tri.text, /두 사람의 이야기를 이어가세요/);
      assert.match(tri.text, /분석할 때마다 1회씩 사용돼요\. 남은 횟수도 계정에서 확인하세요/);
      assert.match(pe.text, /결과를 계정에 저장하고 싶을 때만 선택해서 가입/, "Personal: sign-up is optional, only for saving");
      assert.doesNotMatch(pe.text, /로그인이 필요해요/);
      assert.match(pass.text, /계정 연결일이 아니라 구매일로부터 30일/);
      assert.match(pass.text, /계정 연결 후 이용권을 받을 수 있습니다/);
      const en = buildGuestPurchaseEmail({ ...base, amount: 280, currency: "USD", locale: "en-US", planId: "us_annual_membership" });
      assert.match(en.text, /prorated refund/);
      assert.match(en.text, /Sign up and link my pass: https:\/\/x\/l/);
      const enPass = buildGuestPurchaseEmail({ ...base, amount: 20, currency: "USD", locale: "en-US", planId: "us_insight_pass_30d" });
      assert.match(enPass.text, /A month of insights, in one place/);
      assert.match(enPass.text, /Valid until November 7, 2026 \(UTC\)/);
      const enRel = buildGuestPurchaseEmail({ ...base, amount: 12, currency: "USD", locale: "en-US", planId: "us_relationship_premium" });
      assert.match(enRel.text, /Continue your story together/);
      const code = buildGuestCodeEmail({ locale: "ko-KR", code: "123456", isTest: true });
      assert.match(code.subject, /^\[테스트\] \[Aha! It's me\] 구매 확인 인증코드$/);
      assert.match(code.text, /인증코드: 123456/);
      ok("emails: Personal = use without account (verification on any device, retention), account products = link first; per-product refunds; code mail");
    }

    console.log(`\nguest-personal-flow: ${passed} passed`);
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
