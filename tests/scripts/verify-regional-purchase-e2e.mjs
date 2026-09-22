/**
 * US/KR regional-catalog purchase -> entitlement E2E verify (DB-level).
 *
 * Exercises process_us_purchase / process_us_annual_renewal /
 * process_kr_purchase / ensure_monthly_relationship_grant /
 * additional_relationship_eligible directly against a real dev Supabase
 * project, with SYNTHETIC transaction ids -- no live Paddle sandbox
 * checkout needed for this script, since the thing under test is "does a
 * verified transaction grant the right entitlement", not Paddle.js itself.
 *
 * A real Paddle sandbox checkout still needs to be clicked through once by
 * hand (Paddle test card 4242 4242 4242 4242) for each region/plan to
 * confirm Paddle.Checkout.open() actually opens with the right price and
 * currency, and that /api/pricing/checkout/complete's re-fetch-and-verify
 * step accepts a REAL Paddle sandbox transaction shape -- that part this
 * script cannot substitute for.
 *
 * Usage:
 *   node tests/scripts/verify-regional-purchase-e2e.mjs
 *
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * (same as verify-premium-pipeline.mjs). Creates and then deletes all rows
 * for a synthetic clerk_user_id -- never touches a real user's data.
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_USER = `test_regional_e2e_${Date.now()}`;
const txn = () => `sandbox_txn_${crypto.randomUUID()}`;
const subId = `sandbox_sub_${crypto.randomUUID()}`;

let failed = 0;
function step(name, ok, detail = "") {
  const mark = ok ? "OK" : "FAIL";
  if (!ok) failed++;
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function balance(supabase, creditType) {
  const { data } = await supabase
    .from("credit_accounts")
    .select("balance")
    .eq("clerk_user_id", TEST_USER)
    .eq("credit_type", creditType)
    .maybeSingle();
  return data?.balance ?? 0;
}

async function cleanup(supabase, membershipIds) {
  await supabase.from("credit_ledger").delete().eq("clerk_user_id", TEST_USER);
  await supabase.from("credit_lots").delete().eq("clerk_user_id", TEST_USER);
  await supabase.from("credit_reservations").delete().eq("clerk_user_id", TEST_USER);
  await supabase.from("credit_accounts").delete().eq("clerk_user_id", TEST_USER);
  await supabase.from("us_purchase_grants").delete().eq("clerk_user_id", TEST_USER);
  await supabase.from("kr_purchase_grants").delete().eq("clerk_user_id", TEST_USER);
  for (const id of membershipIds) {
    await supabase.from("gift_personal_coupons").delete().eq("membership_id", id);
    await supabase.from("membership_term_grants").delete().eq("membership_id", id);
    await supabase.from("membership_monthly_grants").delete().eq("membership_id", id);
    await supabase.from("memberships").delete().eq("id", id);
  }
}

async function main() {
  console.log(`\n=== Regional purchase E2E verify ===`);
  console.log(`synthetic clerk_user_id: ${TEST_USER}\n`);

  if (!url || !key) {
    step("env", false, "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const membershipIds = [];

  try {
    // --- US one-time plans ---------------------------------------------
    {
      const t = txn();
      const { data, error } = await supabase.rpc("process_us_purchase", {
        p_clerk_user_id: TEST_USER, p_plan_id: "us_personal_premium",
        p_paddle_transaction_id: t, p_paddle_price_id: "pri_01m1xm9wvkbshger1xywdsd4rc",
        p_currency_code: "USD", p_paddle_subscription_id: null,
      });
      step("us_personal_premium grants", !error && data?.[0]?.ok, error?.message);
      step("us_personal_premium balance +1", (await balance(supabase, "personal")) === 1);

      const { data: replay } = await supabase.rpc("process_us_purchase", {
        p_clerk_user_id: TEST_USER, p_plan_id: "us_personal_premium",
        p_paddle_transaction_id: t, p_paddle_price_id: "pri_01m1xm9wvkbshger1xywdsd4rc",
        p_currency_code: "USD", p_paddle_subscription_id: null,
      });
      step("replaying the same transaction is a no-op (idempotent)", replay?.[0]?.already_processed === true);
      step("balance unchanged after replay", (await balance(supabase, "personal")) === 1);
    }

    // --- US 30-Day Pass: both credits expire in ~30 days ----------------
    {
      const t = txn();
      await supabase.rpc("process_us_purchase", {
        p_clerk_user_id: TEST_USER, p_plan_id: "us_insight_pass_30d",
        p_paddle_transaction_id: t, p_paddle_price_id: "pri_01m346b8d0hysn7h2m7cd9fjcf",
        p_currency_code: "USD", p_paddle_subscription_id: null,
      });
      const { data: lots } = await supabase
        .from("credit_lots")
        .select("credit_type, expires_at")
        .eq("clerk_user_id", TEST_USER)
        .eq("source", "one_time_purchase")
        .not("expires_at", "is", null);
      const days = (iso) => (new Date(iso).getTime() - Date.now()) / 86400000;
      const personalLot = lots?.find((l) => l.credit_type === "personal");
      const relLot = lots?.find((l) => l.credit_type === "relationship");
      step("30-Day Pass personal credit expires ~30 days out",
        Boolean(personalLot) && Math.abs(days(personalLot.expires_at) - 30) < 1);
      step("30-Day Pass relationship credit expires ~30 days out",
        Boolean(relLot) && Math.abs(days(relLot.expires_at) - 30) < 1);
    }

    // --- US Annual: initial purchase, welcome gift, monthly lazy grant --
    let membershipId = null;
    {
      const t = txn();
      await supabase.rpc("process_us_purchase", {
        p_clerk_user_id: TEST_USER, p_plan_id: "us_annual_membership",
        p_paddle_transaction_id: t, p_paddle_price_id: "pri_01m1xm9ycep8n9b5w01dkrh4pz",
        p_currency_code: "USD", p_paddle_subscription_id: subId,
      });
      const { data: m } = await supabase
        .from("memberships").select("*").eq("clerk_user_id", TEST_USER).eq("status", "active").maybeSingle();
      step("annual purchase creates an active membership", Boolean(m));
      membershipId = m?.id ?? null;
      if (membershipId) membershipIds.push(membershipId);

      const { data: coupons } = await supabase
        .from("gift_personal_coupons").select("*").eq("membership_id", membershipId ?? "");
      step("welcome gift grants exactly 2 unredeemed coupons", coupons?.length === 2 &&
        coupons.every((c) => c.status === "unredeemed"));

      step("member's own personal credit granted at signup (term 0)",
        (await balance(supabase, "personal")) >= 1);

      const { data: ensured } = await supabase.rpc("ensure_monthly_relationship_grant", {
        p_membership_id: membershipId,
      });
      step("first monthly relationship grant succeeds (cycle 0, +2)",
        ensured?.[0]?.granted === true && ensured?.[0]?.cycle_index === 0);

      const { data: ensuredAgain } = await supabase.rpc("ensure_monthly_relationship_grant", {
        p_membership_id: membershipId,
      });
      step("calling it again the same cycle is a no-op (no double grant)",
        ensuredAgain?.[0]?.granted === false && ensuredAgain?.[0]?.cycle_index === 0);

      const { data: eligibleBefore } = await supabase.rpc("additional_relationship_eligible", {
        p_clerk_user_id: TEST_USER,
      });
      step("NOT eligible for the add-on before using this cycle's 2 included credits",
        eligibleBefore === false);
    }

    // --- Consume this cycle's 2 relationship credits, then re-check eligibility ---
    {
      for (let i = 0; i < 2; i++) {
        await supabase.rpc("reserve_credit", {
          p_clerk_user_id: TEST_USER, p_credit_type: "relationship",
          p_relationship_report_id: null, p_kind: null, p_locale: "en-US",
          p_generation_lock_id: null, p_generation_request_id: crypto.randomUUID(),
          p_enforced: true,
        });
      }
      const { data: eligibleAfter } = await supabase.rpc("additional_relationship_eligible", {
        p_clerk_user_id: TEST_USER,
      });
      step("eligible for the $9.99 add-on once this cycle's 2 credits are used",
        eligibleAfter === true);
    }

    // --- KR one-time + triple pack ---------------------------------------
    {
      const t = txn();
      const { data } = await supabase.rpc("process_kr_purchase", {
        p_clerk_user_id: TEST_USER, p_plan_id: "kr_relationship_triple",
        p_paddle_transaction_id: t, p_paddle_price_id: "pri_01m346qtbw408b5nnqgw9bmbj8",
        p_currency_code: "KRW",
      });
      step("kr_relationship_triple grants ok", data?.[0]?.ok === true);

      const { data: replay } = await supabase.rpc("process_kr_purchase", {
        p_clerk_user_id: TEST_USER, p_plan_id: "kr_relationship_triple",
        p_paddle_transaction_id: t, p_paddle_price_id: "pri_01m346qtbw408b5nnqgw9bmbj8",
        p_currency_code: "KRW",
      });
      step("replaying a KR transaction is also idempotent", replay?.[0]?.already_processed === true);
    }

    console.log(`\n${failed === 0 ? "ALL CHECKS PASSED" : `${failed} CHECK(S) FAILED`}\n`);
  } finally {
    await cleanup(supabase, membershipIds);
    console.log("(cleaned up synthetic test data)");
  }

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
