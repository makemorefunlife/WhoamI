/**
 * Read-only functional privilege audit via service-role REST client.
 * No persistent writes:
 * - INSERT probe intentionally violates FK (random report_id) => zero rows written.
 * - UPDATE probe targets impossible id and only checks privilege surface.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readEnvLocalRaw() {
  const text = fs.readFileSync(path.join(root, ".env.local"), "utf8");
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    let val = line.slice(eq + 1).trim();
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

function classifySqlState(code) {
  if (!code) return "unknown";
  if (code.startsWith("23")) return "integrity_constraint_violation";
  if (code.startsWith("42")) return "syntax_or_access_rule_violation";
  if (code.startsWith("28")) return "invalid_authorization_specification";
  if (code.startsWith("08")) return "connection_exception";
  return "other";
}

const env = readEnvLocalRaw();
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
if (!url || !key) {
  console.error("FAIL: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("TARGET_TABLE=public.survey_responses");
console.log("ROUTE_OPERATION=INSERT");

// schema usage + SELECT can be inferred if this works
const s = await sb.from("survey_responses").select("id", { count: "exact", head: true });
console.log("SELECT_OK=" + !s.error);
if (s.error) {
  console.log("SELECT_CODE=" + (s.error.code ?? "none"));
  console.log("SELECT_CATEGORY=" + classifySqlState(s.error.code ?? ""));
}

// INSERT probe (FK violation by design, therefore no persistent row)
const fakeReportId = crypto.randomUUID();
const insertRes = await sb.from("survey_responses").insert({
  report_id: fakeReportId,
  answers: { probe: true, source: "priv_audit" },
});
console.log("INSERT_OK=" + !insertRes.error);
if (insertRes.error) {
  const code = insertRes.error.code ?? "none";
  const details = String(insertRes.error.details ?? "");
  const msg = String(insertRes.error.message ?? "");
  const hint = String(insertRes.error.hint ?? "");
  const text = [details, msg, hint].join(" ");
  const constraint = text.match(/constraint "?([a-zA-Z0-9_]+)"?/i)?.[1] ?? "none";
  const column = text.match(/column "?([a-zA-Z0-9_]+)"?/i)?.[1] ?? "none";
  console.log("INSERT_CODE=" + code);
  console.log("INSERT_CATEGORY=" + classifySqlState(code));
  console.log("INSERT_CONSTRAINT=" + constraint);
  console.log("INSERT_COLUMN=" + column);
}

// UPDATE privilege probe (route does not use UPDATE, but requested)
const updateRes = await sb
  .from("survey_responses")
  .update({ updated_at: new Date().toISOString() })
  .eq("id", "00000000-0000-0000-0000-000000000000");
console.log("UPDATE_OK=" + !updateRes.error);
if (updateRes.error) {
  const code = updateRes.error.code ?? "none";
  console.log("UPDATE_CODE=" + code);
  console.log("UPDATE_CATEGORY=" + classifySqlState(code));
}

console.log("NOTE_SEQUENCE_REQUIRED=false (id defaults to gen_random_uuid(), no serial sequence)");
