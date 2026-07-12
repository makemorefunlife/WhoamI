/**
 * Supabase DDL 적용 (프로덕션/스테이징)
 *
 * .env.local 에 아래 중 하나:
 *   SUPABASE_DB_PASSWORD=...   (Dashboard → Settings → Database)
 *   DATABASE_URL=postgresql://...
 *
 * 사용:
 *   node tests/scripts/apply-supabase-migration.mjs supabase/migrations/20260712140000_reports_birth_date_correction.sql
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env.local") });

const migrationArg = process.argv[2];
if (!migrationArg) {
  console.error("Usage: node tests/scripts/apply-supabase-migration.mjs <sql-file>");
  process.exit(1);
}

const sqlPath = path.resolve(root, migrationArg);
if (!fs.existsSync(sqlPath)) {
  console.error(`SQL file not found: ${sqlPath}`);
  process.exit(1);
}

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
  console.error(
    "Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local (save file after editing).",
  );
  process.exit(1);
}

console.log(`Applying: ${path.basename(sqlPath)}`);

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

const verifySql =
  "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'reports' and column_name = 'birth_date_correction_used_at';";

const verify = spawnSync(
  "npx",
  ["supabase", "db", "query", "--db-url", dbUrl, verifySql],
  { cwd: root, encoding: "utf8", shell: true },
);

if (verify.stdout?.includes("birth_date_correction_used_at")) {
  console.log("VERIFY OK: reports.birth_date_correction_used_at exists");
  process.exit(0);
}

console.error("VERIFY FAILED: column not found");
if (verify.stdout?.trim()) console.log(verify.stdout.trim());
if (verify.stderr?.trim()) console.error(verify.stderr.trim());
process.exit(1);
