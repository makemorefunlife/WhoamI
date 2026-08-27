/**
 * Read-only prod diagnosis — masks clerk IDs (suffix only).
 * Does not mutate DB.
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
function maskId(id) {
  const s = String(id ?? "");
  if (!s) return "(empty)";
  return `…${s.slice(-6)}(len=${s.length})`;
}

const env = readEnvLocalRaw();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL.trim(), env.SUPABASE_SERVICE_ROLE_KEY.trim(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: rows, error } = await sb
  .from("reports")
  .select("id, clerk_user_id, report_type, entitlement, birth_date, name, created_at")
  .order("created_at", { ascending: false });
if (error) {
  console.error("LIST_ERROR=" + error.message);
  process.exit(1);
}

const byClerk = new Map();
for (const r of rows ?? []) {
  const k = r.clerk_user_id ?? "(null)";
  if (!byClerk.has(k)) byClerk.set(k, []);
  byClerk.get(k).push(r);
}

console.log("TOTAL_ROWS=" + (rows?.length ?? 0));
console.log("DISTINCT_CLERK_KEYS=" + byClerk.size);
for (const [clerk, list] of byClerk) {
  const types = {};
  for (const r of list) types[r.report_type ?? "null"] = (types[r.report_type ?? "null"] ?? 0) + 1;
  console.log(
    "OWNER=" +
      maskId(clerk === "(null)" ? "" : clerk) +
      " nullOwner=" +
      (clerk === "(null)") +
      " types=" +
      JSON.stringify(types),
  );
}

// Simulate resolveCanonicalReport fetchOwnedReports filter for each owner
for (const [clerk, list] of byClerk) {
  if (clerk === "(null)") continue;
  const { data: owned, error: oerr } = await sb
    .from("reports")
    .select("id, report_type, entitlement, clerk_user_id")
    .eq("clerk_user_id", clerk)
    .neq("report_type", "partner_manual");
  if (oerr) {
    console.log("OWNED_FILTER_ERROR owner=" + maskId(clerk) + " err=" + oerr.message);
    continue;
  }
  console.log(
    "OWNED_AFTER_NEQ_PARTNER_MANUAL owner=" +
      maskId(clerk) +
      " count=" +
      (owned?.length ?? 0) +
      " types=" +
      JSON.stringify(
        Object.fromEntries(
          Object.entries(
            (owned ?? []).reduce((a, r) => {
              const t = r.report_type ?? "null";
              a[t] = (a[t] ?? 0) + 1;
              return a;
            }, {}),
          ),
        ),
      ),
  );
}

// Also: owned WITHOUT neq (what e53eed2 would see if selecting available cols)
for (const [clerk] of byClerk) {
  if (clerk === "(null)") continue;
  const { data: allOwned } = await sb
    .from("reports")
    .select("id, report_type")
    .eq("clerk_user_id", clerk);
  console.log(
    "OWNED_NO_TYPE_FILTER owner=" + maskId(clerk) + " count=" + (allOwned?.length ?? 0),
  );
}

console.log(
  "UPSTASH_LOCAL=" +
    Boolean(env.UPSTASH_REDIS_REST_URL?.trim() && env.UPSTASH_REDIS_REST_TOKEN?.trim()),
);
