/**
 * Check whether individual_saju_json column exists on DEV.
 * Usage: node tests/scripts/verify-individual-saju-json-column.mjs
 */
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env.local") });

function buildDbUrl() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!password || !match) return null;
  const projectRef = match[1];
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
}

const dbUrl = buildDbUrl();
if (!dbUrl) {
  console.error("Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local");
  process.exit(1);
}

const sql = `
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'person_core_blueprints'
  and column_name = 'individual_saju_json';

select
  c.conname as constraint_name,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'person_core_blueprints'
  and c.conname = 'person_core_blueprints_individual_saju_schema';
`.trim();

const result = spawnSync(
  "npx",
  ["supabase", "db", "query", "--db-url", dbUrl, sql],
  { cwd: root, encoding: "utf8", shell: true },
);

if (result.stdout?.trim()) console.log(result.stdout.trim());
if (result.stderr?.trim()) console.error(result.stderr.trim());

const hasColumn = (result.stdout ?? "").includes("individual_saju_json");
console.log(hasColumn ? "COLUMN_PRESENT" : "COLUMN_MISSING");
process.exit(result.status === 0 && hasColumn ? 0 : 2);
