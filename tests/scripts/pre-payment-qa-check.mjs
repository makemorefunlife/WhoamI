/**
 * 배포 전 QA — 환경변수·API 스모크 (로컬/Preview URL)
 *
 * Usage:
 *   node scripts/pre-payment-qa-check.mjs
 *   VERIFY_BASE_URL=https://your-preview.vercel.app node scripts/pre-payment-qa-check.mjs [reportId]
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const reportId =
  process.argv[2]?.trim() || "f5f8eb50-5f7f-4140-8ba5-83e1636c1408";

const REQUIRED_SERVER = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
];

const OPTIONAL = ["NEXT_PUBLIC_PREMIUM_QUALITY_LOG"];

function ok(label, pass, detail = "") {
  console.log(
    `${pass ? "[OK]" : "[FAIL]"} ${label}${detail ? ` — ${detail}` : ""}`,
  );
  return pass;
}

async function main() {
  console.log("\n=== Pre-deploy QA check ===\n");
  console.log(`BASE: ${BASE}`);
  console.log(`reportId: ${reportId}\n`);

  console.log("--- Env (local .env.local) ---");
  let envOk = true;
  for (const k of REQUIRED_SERVER) {
    if (!ok(k, Boolean(process.env[k]?.trim()))) envOk = false;
  }
  for (const k of OPTIONAL) {
    const v = process.env[k];
    if (v) console.log(`[INFO] ${k}=${v}`);
  }

  console.log("\n--- API smoke ---");
  try {
    const home = await fetch(`${BASE}/`);
    ok("GET /", home.ok, `status=${home.status}`);
  } catch (e) {
    ok("GET /", false, String(e));
  }

  try {
    const meta = await fetch(
      `${BASE}/api/my/report?reportId=${encodeURIComponent(reportId)}&quick=1`,
    );
    const body = await meta.json().catch(() => ({}));
    ok(
      "GET /api/my/report?quick=1",
      meta.ok,
      `status=${meta.status} has_premium=${body.has_premium} premium_chars=${body.premium_result?.length ?? 0}`,
    );
  } catch (e) {
    ok("GET /api/my/report", false, String(e));
  }

  console.log("\n--- Access control notes ---");
  console.log("• UI premium: reports.payment_status === 'paid' (reportcontent isDbPaid)");
  console.log("• API premium read/write: payment_status OR plan_type === 'paid'");
  console.log("• GET /api/my/report: reportId만 알면 조회 가능 (Clerk 없음) — UUID 노출 주의");
  console.log("• POST /api/llm integrated/detailed_survey: reportId+paid 검증 (llmPaymentGuard)");

  console.log("\n--- Payment ---");
  console.log("• Toss sandbox / dev-mock removed (v2). New PG TBD.");
  console.log("• Until new payment ships: set payment_status=paid in DB for QA only.");

  console.log(envOk ? "\nEnv OK for local dev.\n" : "\nFix missing env before deploy.\n");
}

main().catch(console.error);
