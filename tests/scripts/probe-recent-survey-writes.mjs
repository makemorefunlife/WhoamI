/**
 * Read-only: recent reports/survey writes for ownership diagnosis.
 * Masks IDs; no secrets. Run: npx tsx tests/scripts/probe-recent-survey-writes.mjs
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnv() {
  const text = fs.readFileSync(".env.local", "utf8");
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    map[line.slice(0, i).trim()] = v;
  }
  return map;
}
function mask(id) {
  const s = String(id ?? "");
  if (!s) return "(empty)";
  return `…${s.slice(-6)}(len=${s.length})`;
}

const env = readEnv();
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL.trim(),
  env.SUPABASE_SERVICE_ROLE_KEY.trim(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

const { data: reports, error: rerr } = await sb
  .from("reports")
  .select("id, clerk_user_id, report_type, entitlement, created_at")
  .gte("created_at", since)
  .order("created_at", { ascending: false })
  .limit(20);
console.log("REPORTS_SINCE_6H_ERR=" + (rerr?.message ?? "none"));
console.log("REPORTS_SINCE_6H_COUNT=" + (reports?.length ?? 0));
for (const r of reports ?? []) {
  console.log(
    "REPORT created=" +
      r.created_at +
      " type=" +
      r.report_type +
      " ent=" +
      r.entitlement +
      " id=" +
      mask(r.id) +
      " owner=" +
      mask(r.clerk_user_id),
  );
}

const { data: surveys, error: serr } = await sb
  .from("survey_responses")
  .select("id, report_id, created_at, answers")
  .order("id", { ascending: false })
  .limit(20);
console.log("SURVEY_LIST_ERR=" + (serr?.message ?? "none"));
console.log("SURVEY_LIST_COUNT=" + (surveys?.length ?? 0));

// created_at may not exist — probe columns via first row keys
if (surveys?.[0]) {
  console.log("SURVEY_ROW_KEYS=" + Object.keys(surveys[0]).join(","));
}
for (const s of surveys ?? []) {
  const answers = s.answers && typeof s.answers === "object" ? s.answers : {};
  const source = answers.survey_source ?? "unknown";
  const hasProfile = Boolean(answers.v2_profile);
  console.log(
    "SURVEY id=" +
      mask(s.id) +
      " report=" +
      mask(s.report_id) +
      " created=" +
      (s.created_at ?? "n/a") +
      " source=" +
      source +
      " hasV2Profile=" +
      hasProfile,
  );
}

const { data: allSelf } = await sb
  .from("reports")
  .select("id, clerk_user_id, report_type, created_at")
  .eq("report_type", "self")
  .order("created_at", { ascending: false })
  .limit(10);
console.log("SELF_REPORTS=" + (allSelf?.length ?? 0));
for (const r of allSelf ?? []) {
  const { count } = await sb
    .from("survey_responses")
    .select("id", { count: "exact", head: true })
    .eq("report_id", r.id);
  console.log(
    "SELF id=" +
      mask(r.id) +
      " owner=" +
      mask(r.clerk_user_id) +
      " survey_rows=" +
      (count ?? 0) +
      " created=" +
      r.created_at,
  );
}
