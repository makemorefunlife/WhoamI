/**
 * Apply individual_saju_json migration via Supabase connection pooler
 * (db.*.supabase.co may not resolve on some networks).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sqlPath = path.join(
  root,
  "supabase/migrations/20260729100000_individual_saju_json.sql",
);

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
const password = env.SUPABASE_DB_PASSWORD?.trim();
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!password || !match) {
  console.error("Missing password or project URL");
  process.exit(1);
}
const ref = match[1];
const encoded = encodeURIComponent(password);

const candidates = [
  `postgresql://postgres.${ref}:${encoded}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require`,
  `postgresql://postgres.${ref}:${encoded}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require`,
  `postgresql://postgres.${ref}:${encoded}@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require`,
  `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres?sslmode=require`,
];

for (const dbUrl of candidates) {
  const safe = dbUrl.replace(/:([^:@/]+)@/, ":***@");
  console.log("TRY", safe);
  const apply = spawnSync(
    "npx",
    ["supabase", "db", "query", "--db-url", dbUrl, "-f", sqlPath],
    { cwd: root, encoding: "utf8", shell: true },
  );
  if (apply.stdout?.trim()) console.log(apply.stdout.trim().slice(0, 400));
  if (apply.stderr?.trim()) console.error(apply.stderr.trim().slice(0, 400));
  if (apply.status === 0) {
    console.log("OK: migration applied via pooler");
    process.exit(0);
  }
}

console.error("All connection candidates failed");
process.exit(1);
