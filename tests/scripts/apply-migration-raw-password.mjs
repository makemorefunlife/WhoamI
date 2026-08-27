/**
 * Apply a migration using raw SUPABASE_DB_PASSWORD from .env.local
 * (dotenv truncates at unquoted # — read the line manually).
 *
 * Usage:
 *   node tests/scripts/apply-migration-raw-password.mjs supabase/migrations/FILE.sql
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const migrationArg = process.argv[2];
if (!migrationArg) {
  console.error("Usage: node tests/scripts/apply-migration-raw-password.mjs <sql-file>");
  process.exit(1);
}
const sqlPath = path.resolve(root, migrationArg);
if (!fs.existsSync(sqlPath)) {
  console.error(`SQL file not found: ${sqlPath}`);
  process.exit(1);
}

function readEnvLocalRaw() {
  const text = fs.readFileSync(path.join(root, ".env.local"), "utf8");
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map[key] = val;
  }
  return map;
}

const env = readEnvLocalRaw();
const password = env.SUPABASE_DB_PASSWORD?.trim();
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
if (!password || !match) {
  console.error("Missing SUPABASE_DB_PASSWORD or NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

const projectRef = match[1];
const dbUrl = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

console.log(`Applying: ${path.basename(sqlPath)} (DEV project ${projectRef})`);
console.log("Migration is additive: ADD COLUMN IF NOT EXISTS + CHECK (nullable allowed)");

const apply = spawnSync(
  "npx",
  ["supabase", "db", "query", "--db-url", dbUrl, "-f", sqlPath],
  { cwd: root, encoding: "utf8", shell: true },
);
if (apply.stdout?.trim()) console.log(apply.stdout.trim());
if (apply.stderr?.trim()) console.error(apply.stderr.trim());
if (apply.status !== 0) {
  console.error("MIGRATION FAILED");
  process.exit(apply.status ?? 1);
}
console.log("OK: migration applied");

const verifySql = `
select column_name from information_schema.columns
where table_schema='public' and table_name='person_core_blueprints'
  and column_name='individual_saju_json';
select conname from pg_constraint c
join pg_class t on t.oid=c.conrelid
join pg_namespace n on n.oid=t.relnamespace
where n.nspname='public' and t.relname='person_core_blueprints'
  and c.conname='person_core_blueprints_individual_saju_schema';
`.trim();

const verify = spawnSync(
  "npx",
  ["supabase", "db", "query", "--db-url", dbUrl, verifySql],
  { cwd: root, encoding: "utf8", shell: true },
);
if (verify.stdout?.trim()) console.log(verify.stdout.trim());
if (verify.stderr?.trim()) console.error(verify.stderr.trim());
const ok =
  (verify.stdout ?? "").includes("individual_saju_json") &&
  (verify.stdout ?? "").includes("person_core_blueprints_individual_saju_schema");
if (!ok) {
  console.error("VERIFY FAILED");
  process.exit(1);
}
console.log("VERIFY OK: column + constraint present");
