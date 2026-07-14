/**
 * Patch 3 / 4A security smoke — test data only, cleaned up on exit.
 * Usage: node tests/scripts/patch3-4a-security-smoke.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const base = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

async function postBasic(body) {
  const r = await fetch(`${base}/api/relationship/analyze/basic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, err: d.error, hasResult: Boolean(d.result_basic) };
}

async function postLlm(body) {
  const r = await fetch(`${base}/api/llm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, err: d.error };
}

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const sr = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const fake = "00000000-0000-0000-0000-000000000099";
const cleanup = { reports: [], rr: null };

try {
  const a = (
    await anon
      .from("reports")
      .insert({
        name: "p3-test-a",
        payment_status: "none",
        plan_type: "free",
      })
      .select("id")
      .single()
  ).data.id;
  const b = (
    await anon
      .from("reports")
      .insert({
        name: "p3-test-b",
        payment_status: "none",
        plan_type: "free",
      })
      .select("id")
      .single()
  ).data.id;
  cleanup.reports.push(a, b);

  const rrId = (
    await sr
      .from("relationship_reports")
      .insert({
        report_id_a: a,
        report_id_b: b,
        analysis_type: "basic",
        result_basic: {
          perspectives: {
            [a]: { emotional_sensitivity: "x" },
            [b]: { emotional_sensitivity: "y" },
          },
        },
      })
      .select("id")
      .single()
  ).data.id;
  cleanup.rr = rrId;

  const clerkOwned = (
    await sr
      .from("reports")
      .insert({
        name: "p3-clerk-owned",
        payment_status: "paid",
        plan_type: "paid",
        clerk_user_id: "user_test_other",
      })
      .select("id")
      .single()
  ).data.id;
  cleanup.reports.push(clerkOwned);

  const guestPaid = (
    await anon
      .from("reports")
      .insert({ payment_status: "paid", plan_type: "paid" })
      .select("id")
      .single()
  ).data.id;
  cleanup.reports.push(guestPaid);

  const results = {
    basic_missingViewer: await postBasic({ relationship_report_id: rrId }),
    basic_missingRr: await postBasic({ viewer_report_id: a }),
    basic_nonParticipant: await postBasic({
      relationship_report_id: rrId,
      viewer_report_id: fake,
    }),
    basic_notFoundRr: await postBasic({
      relationship_report_id: fake,
      viewer_report_id: a,
    }),
    basic_cacheLeakNonParticipant: await postBasic({
      relationship_report_id: rrId,
      viewer_report_id: fake,
    }),
    basic_guestParticipant: await postBasic({
      relationship_report_id: rrId,
      viewer_report_id: a,
    }),
    llm_clerkOwnedNoAuth: await postLlm({
      mode: "integrated",
      reportId: clerkOwned,
      detailedSurvey: "x",
      sajuData: {},
    }),
    llm_guestPaid: await postLlm({
      mode: "integrated",
      reportId: guestPaid,
      detailedSurvey: "x",
      sajuData: {},
    }),
    llm_noReportId: await postLlm({ mode: "integrated", detailedSurvey: "x" }),
    home: await fetch(`${base}/`).then((r) => ({ status: r.status })),
  };

  console.log(JSON.stringify(results, null, 2));
} finally {
  if (cleanup.rr) {
    await sr.from("relationship_reports").delete().eq("id", cleanup.rr);
  }
  if (cleanup.reports.length) {
    await sr.from("reports").delete().in("id", cleanup.reports);
  }
}
