/**
 * Verify entitlement/report_type shape when columns already exist.
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
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL.trim(),
  env.SUPABASE_SERVICE_ROLE_KEY.trim(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data, error } = await sb
  .from("reports")
  .select("id, entitlement, report_type, clerk_user_id")
  .limit(20);
if (error) {
  console.error("SELECT_ERROR=" + error.message);
  process.exit(1);
}
const rows = data ?? [];
console.log("SAMPLE_ROWS=" + rows.length);
const ents = {};
const types = {};
let nullEnt = 0;
let nullType = 0;
for (const r of rows) {
  if (r.entitlement == null) nullEnt += 1;
  else ents[r.entitlement] = (ents[r.entitlement] ?? 0) + 1;
  if (r.report_type == null) nullType += 1;
  else types[r.report_type] = (types[r.report_type] ?? 0) + 1;
}
console.log("ENTITLEMENT_DIST=" + JSON.stringify(ents));
console.log("REPORT_TYPE_DIST=" + JSON.stringify(types));
console.log("NULL_ENTITLEMENT=" + nullEnt);
console.log("NULL_REPORT_TYPE=" + nullType);

// default insert probe — rolled back via delete of returned row only if tagged
const tag = "preflight_default_probe_" + Date.now();
const ins = await sb
  .from("reports")
  .insert({ name: tag, clerk_user_id: "preflight_probe_do_not_use" })
  .select("id, entitlement, report_type")
  .single();
if (ins.error) {
  console.log("DEFAULT_INSERT_ERROR=" + ins.error.message);
} else {
  console.log(
    "DEFAULT_INSERT=" +
      JSON.stringify({
        entitlement: ins.data.entitlement,
        report_type: ins.data.report_type,
      }),
  );
  await sb.from("reports").delete().eq("id", ins.data.id);
  console.log("PROBE_ROW_DELETED=true");
}
