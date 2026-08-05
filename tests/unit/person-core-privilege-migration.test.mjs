/**
 * PersonCore / Romantic premium privilege migration regression (no remote DB).
 * Run: npx tsx tests/unit/person-core-privilege-migration.test.mjs
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

function grantLines(sql) {
  return sql
    .split(/\r?\n/)
    .filter((l) => /^\s*grant\b/i.test(l))
    .join("\n");
}

async function run() {
  const mig = read(
    "supabase/migrations/20260805213000_restore_service_role_person_core_privileges.sql",
  );
  const prior = read(
    "supabase/migrations/20260805200000_restore_service_role_relationship_privileges.sql",
  );

  assert.match(mig, /grant usage on schema public to service_role/i);
  assert.match(
    mig,
    /grant select, insert, update\s+on table public\.person_core_blueprints\s+to service_role/i,
  );
  const grants = grantLines(mig);
  assert.ok(
    !/person_core_blueprints[\s\S]*\bdelete\b|\bdelete\b[\s\S]*person_core_blueprints/i.test(
      grants,
    ),
    "must not GRANT DELETE on person_core_blueprints",
  );
  assert.ok(!/grant\s+all\s+on\s+all\s+tables/i.test(mig));

  assert.ok(!/\bto\s+anon\b/i.test(grants));
  assert.ok(!/\bto\s+authenticated\b/i.test(grants));
  assert.ok(/to service_role/i.test(grants));
  ok("person_core_blueprints SELECT/INSERT/UPDATE for service_role only");

  // Final follow-up adds DELETE (invalidate + account-delete CASCADE)
  const finalMig = read(
    "supabase/migrations/20260805220000_restore_service_role_production_runtime_privileges.sql",
  );
  assert.match(
    finalMig,
    /grant select, insert, update, delete\s+on table public\.person_core_blueprints\s+to service_role/i,
  );
  assert.match(
    finalMig,
    /grant select, insert, update, delete\s+on table public\.report_analyses\s+to service_role/i,
  );
  assert.match(
    finalMig,
    /grant select, insert, update, delete\s+on table public\.relationship_favorites\s+to service_role/i,
  );
  ok("final migration closes person_core DELETE + report_analyses + favorites UPDATE");

  // Romantic premium path tables already covered by prior migration
  for (const table of [
    "reports",
    "survey_responses",
    "relationship_reports",
    "relationship_analysis_logs",
  ]) {
    assert.match(
      prior,
      new RegExp(
        `grant select, insert, update, delete\\s+on table public\\.${table}\\s+to service_role`,
        "i",
      ),
    );
  }
  ok("prior migration covers romantic premium shared tables");

  // Upsert path evidence in source
  const upsert = read("lib/personCore/services/upsertPersonCoreBlueprint.ts");
  assert.match(upsert, /person_core_blueprints/);
  assert.match(upsert, /\.upsert\(/);
  ok("upsertPersonCoreBlueprint uses person_core_blueprints upsert");

  const load = read("lib/personCore/services/loadPerson.ts");
  assert.match(load, /person_core_blueprints/);
  assert.match(load, /\.select\(/);
  ok("loadPerson SELECTs person_core_blueprints");

  // report_analyses / favorites / invites not required by this follow-up
  assert.ok(!/report_analyses/i.test(grantLines(mig)));
  assert.ok(!/relationship_favorites/i.test(grantLines(mig)));
  assert.ok(!/invites/i.test(grantLines(mig)));
  ok("follow-up does not broaden into non-premium tables");

  console.log(`\n${passed} tests passed`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
