/**
 * Read-only self-report + survey completion probe.
 * Run: npx tsx tests/scripts/probe-self-survey-state.mjs
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
  return s ? `…${s.slice(-6)}(len=${s.length})` : "(empty)";
}

const env = readEnv();
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL.trim(),
  env.SUPABASE_SERVICE_ROLE_KEY.trim(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: self, error } = await sb
  .from("reports")
  .select("id, entitlement, report_type, clerk_user_id, created_at")
  .eq("report_type", "self")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

console.log("SELF_ERR=" + (error?.message ?? "none"));
if (!self) {
  console.log("SELF=none");
  process.exit(0);
}
console.log(
  "SELF id=" +
    mask(self.id) +
    " ent=" +
    self.entitlement +
    " owner=" +
    mask(self.clerk_user_id) +
    " created=" +
    self.created_at,
);

const { data: rows, error: se } = await sb
  .from("survey_responses")
  .select("id, created_at, answers")
  .eq("report_id", self.id)
  .order("id", { ascending: false })
  .limit(3);
console.log("SURVEY_ERR=" + (se?.message ?? "none"));
console.log("SURVEY_COUNT=" + (rows?.length ?? 0));
for (const r of rows ?? []) {
  const a = r.answers && typeof r.answers === "object" ? r.answers : {};
  const qKeys = Object.keys(a).filter((k) => /^q\d+$/.test(k));
  console.log(
    "SURVEY id=" +
      mask(r.id) +
      " created=" +
      r.created_at +
      " source=" +
      (a.survey_source ?? "none") +
      " qAnswered=" +
      qKeys.length +
      " hasProfile=" +
      Boolean(a.v2_profile),
  );
}

// Validate insert shape without writing: invoke a no-op RPC if any; else check constraints via failed dry-run in a rolled-back way is not available — skip write.
console.log("NOTE=no_writes_performed");
