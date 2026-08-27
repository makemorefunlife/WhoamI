/**
 * Read-only preflight via Supabase service-role REST (no direct Postgres).
 * Confirms target columns absent / legacy paid probe / row counts.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readEnvLocalRaw() {
  const text = fs.readFileSync(path.join(root, ".env.local"), "utf8");
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    let val = line.slice(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map[line.slice(0, eq).trim()] = val;
  }
  return map;
}

const env = readEnvLocalRaw();
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
console.log("SUPABASE_HOST=" + (url ? new URL(url).host : "(none)"));
console.log("SERVICE_ROLE_PRESENT=" + Boolean(key));
console.log("UPSTASH_URL_PRESENT=" + Boolean(env.UPSTASH_REDIS_REST_URL?.trim()));
console.log("UPSTASH_TOKEN_PRESENT=" + Boolean(env.UPSTASH_REDIS_REST_TOKEN?.trim()));
console.log(
  "NOTE=.env.local Upstash ≠ proof of Vercel Production Upstash",
);

if (!url || !key) {
  console.error("FAIL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const countRes = await sb.from("reports").select("id", { count: "exact", head: true });
if (countRes.error) {
  console.error("FAIL: reports count:", countRes.error.message);
  process.exit(1);
}
console.log("REPORTS_ROW_COUNT=" + (countRes.count ?? 0));

const usersRes = await sb
  .from("reports")
  .select("clerk_user_id")
  .not("clerk_user_id", "is", null)
  .limit(5000);
if (usersRes.error) {
  console.error("FAIL: clerk users:", usersRes.error.message);
  process.exit(1);
}
const distinct = new Set(
  (usersRes.data ?? [])
    .map((r) => String(r.clerk_user_id ?? "").trim())
    .filter(Boolean),
);
console.log("DISTINCT_CLERK_USERS_SAMPLED=" + distinct.size);

async function columnPresent(col) {
  const { error } = await sb.from("reports").select(col).limit(1);
  if (!error) return true;
  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("does not exist") || msg.includes("could not find")) return false;
  console.error("FAIL: unexpected error probing " + col + ":", error.message);
  process.exit(1);
}

const hasEntitlement = await columnPresent("entitlement");
const hasReportType = await columnPresent("report_type");
const hasPayment = await columnPresent("payment_status");
const hasPlan = await columnPresent("plan_type");
console.log("ENTITLEMENT_ABSENT=" + !hasEntitlement);
console.log("REPORT_TYPE_ABSENT=" + !hasReportType);
console.log("PAYMENT_STATUS_PRESENT=" + hasPayment);
console.log("PLAN_TYPE_PRESENT=" + hasPlan);

let legacyPaid = 0;
if (hasPayment) {
  const { count, error } = await sb
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "paid");
  if (error) {
    console.error("FAIL: paid payment_status probe:", error.message);
    process.exit(1);
  }
  legacyPaid += count ?? 0;
}
if (hasPlan) {
  const { count, error } = await sb
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("plan_type", "paid");
  if (error) {
    console.error("FAIL: paid plan_type probe:", error.message);
    process.exit(1);
  }
  legacyPaid += count ?? 0;
}
console.log("LEGACY_PAID_ROWS=" + legacyPaid);

if (hasEntitlement || hasReportType) {
  console.error("STOP: target column(s) already present — abort apply");
  process.exit(2);
}
if (legacyPaid > 0) {
  console.error("STOP: legacy paid rows > 0 — need explicit approval");
  process.exit(3);
}

console.log("PREFLIGHT_OK");
