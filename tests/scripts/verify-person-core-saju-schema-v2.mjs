/**
 * person_core_blueprints_saju_schema CHECK가 v1+v2를 허용하는지 확인
 *
 * .env.local: DATABASE_URL 또는 SUPABASE_DB_PASSWORD + NEXT_PUBLIC_SUPABASE_URL
 *
 * 사용:
 *   node tests/scripts/verify-person-core-saju-schema-v2.mjs
 *   node tests/scripts/verify-person-core-saju-schema-v2.mjs --json
 */

import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env.local") });

const jsonOut = process.argv.includes("--json");

function buildDbUrl() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!password || !match) return null;

  const projectRef = match[1];
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
}

const dbUrl = buildDbUrl();
if (!dbUrl) {
  const msg =
    "Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local";
  if (jsonOut) {
    console.log(JSON.stringify({ ok: false, error: msg }));
  } else {
    console.error(msg);
  }
  process.exit(1);
}

const verifySql = `
select
  c.conname as constraint_name,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'person_core_blueprints'
  and c.conname = 'person_core_blueprints_saju_schema';
`.trim();

const result = spawnSync(
  "npx",
  ["supabase", "db", "query", "--db-url", dbUrl, verifySql],
  { cwd: root, encoding: "utf8", shell: true },
);

const stdout = result.stdout?.trim() ?? "";
const stderr = result.stderr?.trim() ?? "";

if (result.status !== 0) {
  if (jsonOut) {
    console.log(
      JSON.stringify({
        ok: false,
        error: "query_failed",
        stderr,
        stdout,
      }),
    );
  } else {
    console.error("QUERY FAILED");
    if (stderr) console.error(stderr);
    if (stdout) console.log(stdout);
  }
  process.exit(result.status ?? 1);
}

const allowsV2 =
  stdout.includes("saju_master_v2") &&
  (stdout.includes("saju_master_v1") || stdout.includes("'saju_master_v1'"));

const tableExists = !stdout.toLowerCase().includes("0 rows");

const payload = {
  ok: allowsV2,
  table_exists: tableExists,
  constraint_found: stdout.includes("person_core_blueprints_saju_schema"),
  definition_snippet: stdout.replace(/\s+/g, " ").slice(0, 280),
  migration_file: "supabase/migrations/20260713140000_person_core_saju_schema_v2.sql",
  apply_command:
    "node tests/scripts/apply-supabase-migration.mjs supabase/migrations/20260713140000_person_core_saju_schema_v2.sql",
};

if (jsonOut) {
  console.log(JSON.stringify(payload, null, 2));
} else if (allowsV2) {
  console.log("OK: person_core_blueprints_saju_schema allows saju_master_v1 and saju_master_v2");
  console.log(stdout);
} else if (!payload.constraint_found) {
  console.error(
    "FAIL: person_core_blueprints_saju_schema constraint not found — apply person_core_blueprints migration first",
  );
  console.log(stdout || "(no output)");
} else {
  console.error(
    "FAIL: constraint exists but does NOT allow saju_master_v2 — apply migration:",
  );
  console.error(payload.apply_command);
  console.log(stdout);
}

process.exit(allowsV2 ? 0 : 1);
