/**
 * Final Production service_role privilege coverage regression (no remote DB).
 * Proves every active Production DB object is covered by a tracked migration.
 * Run: npx tsx tests/unit/production-runtime-privileges.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`[OK] ${name}`);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

/** Active Production tables used by app/ + lib/ (static audit SSOT). */
const PRODUCTION_TABLES = {
  reports: ["select", "insert", "update", "delete"],
  survey_responses: ["select", "insert", "update", "delete"],
  report_analyses: ["select", "insert", "update", "delete"],
  person_core_blueprints: ["select", "insert", "update", "delete"],
  relationship_reports: ["select", "insert", "update", "delete"],
  relationship_analysis_logs: ["select", "insert", "update", "delete"],
  relationship_favorites: ["select", "insert", "update", "delete"],
  invites: ["select", "insert", "update", "delete"],
};

const PRODUCTION_RPCS = [
  "merge_relationship_premium_by_kind",
  "delete_owned_partner_manual_relationship",
];

const MIGRATIONS = [
  "supabase/migrations/20260805200000_restore_service_role_relationship_privileges.sql",
  "supabase/migrations/20260805213000_restore_service_role_person_core_privileges.sql",
  "supabase/migrations/20260805220000_restore_service_role_production_runtime_privileges.sql",
  "supabase/migrations/20260714220000_merge_relationship_premium_by_kind.sql",
];

function flattenGrants(sqlBundle) {
  // Collapse whitespace so multiline GRANT ... ON TABLE ... matches.
  return sqlBundle.replace(/\s+/g, " ");
}

function assertTableGrant(flat, table, privs) {
  const re = new RegExp(
    `grant\\s+([^;]+?)\\s+on\\s+table\\s+public\\.${table}\\s+to\\s+service_role`,
    "gi",
  );
  const matches = [...flat.matchAll(re)];
  assert.ok(matches.length > 0, `missing GRANT on public.${table}`);
  const granted = new Set();
  for (const m of matches) {
    for (const p of m[1].split(",").map((s) => s.trim().toLowerCase())) {
      if (p) granted.add(p);
    }
  }
  for (const need of privs) {
    assert.ok(
      granted.has(need),
      `public.${table} missing privilege ${need}; have ${[...granted].join(",")}`,
    );
  }
}

async function run() {
  const bundle = MIGRATIONS.map(read).join("\n");
  const flat = flattenGrants(bundle);
  const finalMig = read(
    "supabase/migrations/20260805220000_restore_service_role_production_runtime_privileges.sql",
  );
  const finalFlat = flattenGrants(finalMig);

  // --- Final migration is the complete SSOT reassertion ---
  assert.match(finalMig, /grant usage on schema public to service_role/i);
  for (const [table, privs] of Object.entries(PRODUCTION_TABLES)) {
    assertTableGrant(finalFlat, table, privs);
  }
  ok("final migration grants SIUD on all 8 Production tables");

  for (const rpc of PRODUCTION_RPCS) {
    assert.match(
      finalFlat,
      new RegExp(
        `grant execute on function public\\.${rpc}\\([^)]*\\)\\s+to service_role`,
        "i",
      ),
    );
  }
  ok("final migration re-asserts EXECUTE on both Production RPCs");

  const grantOnly = bundle
    .split(/\r?\n/)
    .filter((l) => /^\s*grant\b/i.test(l))
    .join("\n");

  // --- Safety rails (GRANT lines only; ignore comments) ---
  assert.ok(!/grant\s+all\s+on\s+all\s+tables/i.test(grantOnly));
  assert.ok(!/\bto\s+anon\b/i.test(grantOnly));
  assert.ok(!/\bto\s+authenticated\b/i.test(grantOnly));
  ok("no GRANT ALL / anon / authenticated in privilege migrations");

  // --- Bundle coverage (any tracked migration) ---
  for (const [table, privs] of Object.entries(PRODUCTION_TABLES)) {
    assertTableGrant(flat, table, privs);
  }
  ok("tracked migrations jointly cover every Production table privilege");

  // --- Code evidence for previously missing objects ---
  const analyses = read("lib/report/reportAnalyses.ts");
  assert.match(analyses, /report_analyses/);
  assert.match(analyses, /\.upsert\(/);
  assert.match(analyses, /\.delete\(/);
  ok("report_analyses used by Production persistence helpers");

  const favorites = read("lib/relationship/analysisLog.ts");
  assert.match(favorites, /relationship_favorites[\s\S]*\.upsert\(/);
  ok("relationship_favorites upsert requires UPDATE");

  const invalidate = read(
    "lib/personCore/services/invalidatePersonCoreBlueprint.ts",
  );
  assert.match(invalidate, /\.delete\(/);
  assert.match(invalidate, /return false/);
  ok("invalidatePersonCoreBlueprint DELETEs (soft-fail) — DELETE granted for cascade/runtime");

  const accountDelete = read("app/api/account/delete/route.ts");
  assert.match(accountDelete, /\.from\("reports"\)[\s\S]*\.delete\(\)/);
  assert.match(accountDelete, /\.eq\("clerk_user_id",\s*userId\)/);
  ok("account deletion deletes owned reports only (child CASCADE needs child DELETE)");

  // --- Static inventory: no unexpected production tables in app/lib ---
  const walk = (dir, acc = []) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p, acc);
      else if (/\.(ts|tsx|js|mjs)$/.test(ent.name)) acc.push(p);
    }
    return acc;
  };
  const files = [...walk(path.join(root, "app")), ...walk(path.join(root, "lib"))];
  const fromRe = /\.from\(\s*["']([a-z0-9_]+)["']\s*\)/gi;
  const rpcRe = /\.rpc\(\s*["']([a-z0-9_]+)["']\s*/gi;
  const tables = new Set();
  const rpcs = new Set();
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    for (const m of src.matchAll(fromRe)) tables.add(m[1]);
    for (const m of src.matchAll(rpcRe)) rpcs.add(m[1]);
  }
  for (const t of tables) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(PRODUCTION_TABLES, t),
      `untracked Production table referenced in app/lib: ${t}`,
    );
  }
  for (const r of rpcs) {
    assert.ok(
      PRODUCTION_RPCS.includes(r),
      `untracked Production RPC referenced in app/lib: ${r}`,
    );
  }
  ok(
    `static scan: ${tables.size} tables + ${rpcs.size} RPCs all tracked in privilege SSOT`,
  );

  // No sequences in Production path
  const seqHit = files.some((f) =>
    /nextval\(|currval\(|\.from\(\s*["'][a-z0-9_]+_seq["']/i.test(
      fs.readFileSync(f, "utf8"),
    ),
  );
  assert.equal(seqHit, false);
  ok("no sequence USAGE required (no nextval in app/lib)");

  console.log(`\n${passed} tests passed`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
