/**
 * Masked Clerk users vs reports.clerk_user_id ownership compare.
 * Never prints full IDs.
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createClerkClient } from "@clerk/backend";

function readEnvLocalRaw() {
  const text = fs.readFileSync(".env.local", "utf8");
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
function mask(id) {
  const s = String(id ?? "");
  if (!s) return "(empty)";
  return `…${s.slice(-6)}(len=${s.length})`;
}

const env = readEnvLocalRaw();
const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY.trim() });
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL.trim(),
  env.SUPABASE_SERVICE_ROLE_KEY.trim(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: reports, error } = await sb
  .from("reports")
  .select("clerk_user_id, report_type");
if (error) {
  console.error("REPORTS_ERROR");
  process.exit(1);
}
const ownerSuffixes = new Set();
const ownerFull = new Set();
for (const r of reports ?? []) {
  const id = String(r.clerk_user_id ?? "").trim();
  if (!id) continue;
  ownerFull.add(id);
  ownerSuffixes.add(id.slice(-6));
}
console.log("REPORT_OWNER_COUNT=" + ownerFull.size);
console.log(
  "REPORT_OWNERS_MASKED=" +
    [...ownerFull].map(mask).join(","),
);

const list = await clerk.users.getUserList({ limit: 50, orderBy: "-created_at" });
const users = list.data ?? [];
console.log("CLERK_USERS_FETCHED=" + users.length);

let match = 0;
let noMatch = 0;
for (const u of users) {
  const id = u.id;
  const hit = ownerFull.has(id);
  if (hit) match += 1;
  else noMatch += 1;
  console.log(
    "CLERK_USER=" +
      mask(id) +
      " created=" +
      (u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "?") +
      " MATCH_REPORT_OWNER=" +
      hit,
  );
}
console.log("MATCH_COUNT=" + match);
console.log("NO_MATCH_COUNT=" + noMatch);
if (match === 0) {
  console.log("VERDICT_HINT=CLERK_ID_MISMATCH_POSSIBLE_no_clerk_user_owns_reports");
} else if (match >= 1) {
  console.log("VERDICT_HINT=AT_LEAST_ONE_CLERK_USER_OWNS_REPORTS");
}
