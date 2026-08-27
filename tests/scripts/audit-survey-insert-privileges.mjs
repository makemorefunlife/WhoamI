/**
 * Read-only DB audit for POST /api/v2/survey insert path.
 *
 * - Proves target operation/table
 * - Audits service_role privileges on public.survey_responses
 * - Executes transactional dry-run insert with ROLLBACK to capture SQLSTATE
 *
 * Usage:
 *   npx tsx tests/scripts/audit-survey-insert-privileges.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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

function buildDbUrl(env) {
  const direct = env.DATABASE_URL?.trim();
  if (direct) return direct;

  const password = env.SUPABASE_DB_PASSWORD?.trim();
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!password || !match) return null;
  const projectRef = match[1];
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
}

function runSql(dbUrl, sql) {
  return spawnSync(
    "npx",
    ["supabase", "db", "query", "--db-url", dbUrl, sql],
    { cwd: root, encoding: "utf8", shell: true },
  );
}

const env = readEnvLocalRaw();
const dbUrl = buildDbUrl(env);
if (!dbUrl) {
  console.error("FAIL: missing DATABASE_URL or SUPABASE_DB_PASSWORD");
  process.exit(1);
}

// 1) prove target operation/table from route source
const routeSrc = fs.readFileSync(
  path.join(root, "app/api/v2/survey/route.ts"),
  "utf8",
);
const op =
  routeSrc.includes('.from("survey_responses").insert({') ? "INSERT" : "UNKNOWN";
console.log("ROUTE_TARGET=public.survey_responses");
console.log("ROUTE_OPERATION=" + op);
console.log("ROUTE_USES_UPSERT=" + routeSrc.includes(".upsert("));
console.log("ROUTE_USES_UPDATE=" + routeSrc.includes(".update("));

const privilegeSql = `
select
  has_schema_privilege('service_role', 'public', 'USAGE') as schema_usage,
  has_table_privilege('service_role', 'public.survey_responses', 'SELECT') as can_select,
  has_table_privilege('service_role', 'public.survey_responses', 'INSERT') as can_insert,
  has_table_privilege('service_role', 'public.survey_responses', 'UPDATE') as can_update;

select
  grantee, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and table_name='survey_responses'
  and grantee in ('service_role', 'postgres', 'authenticated', 'anon')
order by grantee, privilege_type;

select
  c.relname as sequence_name,
  has_sequence_privilege('service_role', format('%I.%I', n.nspname, c.relname), 'USAGE') as can_usage,
  has_sequence_privilege('service_role', format('%I.%I', n.nspname, c.relname), 'SELECT') as can_select,
  has_sequence_privilege('service_role', format('%I.%I', n.nspname, c.relname), 'UPDATE') as can_update
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind='S'
  and n.nspname='public'
  and c.relname like 'survey_responses%';
`.trim();

const priv = runSql(dbUrl, privilegeSql);
if (priv.stdout?.trim()) console.log(priv.stdout.trim());
if (priv.stderr?.trim()) console.error(priv.stderr.trim());

// 2) transactional dry-run insert as service_role to capture SQLSTATE safely
const dryRunSql = `
begin;
set local role service_role;
with target as (
  select id
  from public.reports
  where report_type='self'
  order by created_at desc
  limit 1
)
insert into public.survey_responses (report_id, answers)
select id, '{"q1":"a","q2":"a","q3":"a","q4":"a","q5":"a","q6":"a","q7":"a","q8":"a","q9":"a","q10":"a","survey_source":"diag","v2_profile":{"yinyangBalance":0,"fiveElementBalance":{"wood":0,"fire":0,"earth":0,"metal":0,"water":0},"dayMasterStrength":"balanced","supportingElements":[],"challengingElements":[]}}'::jsonb
from target
returning id;
rollback;
`.trim();

const dry = runSql(dbUrl, dryRunSql);
console.log("DRYRUN_EXIT=" + (dry.status ?? 1));
if (dry.stdout?.trim()) console.log(dry.stdout.trim());
if (dry.stderr?.trim()) console.error(dry.stderr.trim());

// 3) classify bounded error (if any) from stderr text
const err = (dry.stderr ?? "") + "\n" + (dry.stdout ?? "");
const codeMatch = err.match(/\b([0-9A-Z]{5})\b/);
const pgCode = codeMatch?.[1] ?? "none";
let category = "none";
if (pgCode.startsWith("23")) category = "integrity_constraint_violation";
else if (pgCode.startsWith("28")) category = "invalid_authorization_specification";
else if (pgCode.startsWith("42")) category = "syntax_or_access_rule_violation";
else if (pgCode.startsWith("08")) category = "connection_exception";

const constraintMatch = err.match(/constraint\s+"([^"]+)"/i);
const columnMatch = err.match(/column\s+"([^"]+)"/i);
const postgrestCodeMatch = err.match(/\bPGRST\d+\b/i);
console.log("BOUNDED_SQLSTATE=" + pgCode);
console.log("BOUNDED_CATEGORY=" + category);
console.log(
  "BOUNDED_CONSTRAINT=" + (constraintMatch?.[1] ? constraintMatch[1] : "none"),
);
console.log("BOUNDED_COLUMN=" + (columnMatch?.[1] ? columnMatch[1] : "none"));
console.log(
  "BOUNDED_POSTGREST_CODE=" +
    (postgrestCodeMatch?.[0] ? postgrestCodeMatch[0] : "none"),
);
