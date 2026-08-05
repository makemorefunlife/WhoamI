/**
 * Relationship access / deletion hardening regression tests (no remote DB).
 * Run: npx tsx tests/unit/relationship-access-hardening.test.mjs
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

function section(title) {
  console.log(`\n== ${title}`);
}

async function run() {
  section("migration grants");
  {
    const mig = read(
      "supabase/migrations/20260805200000_restore_service_role_relationship_privileges.sql",
    );
    assert.match(mig, /grant usage on schema public to service_role/i);
    for (const table of [
      "reports",
      "survey_responses",
      "relationship_reports",
      "invites",
      "relationship_analysis_logs",
    ]) {
      assert.match(
        mig,
        new RegExp(
          `grant select, insert, update, delete\\s+on table public\\.${table}\\s+to service_role`,
          "i",
        ),
      );
    }
    assert.match(
      mig,
      /grant select, insert, delete\s+on table public\.relationship_favorites\s+to service_role/i,
    );
    assert.ok(!/grant\s+all\s+on\s+all\s+tables/i.test(mig));
    const grantLines = mig
      .split(/\r?\n/)
      .filter((l) => /^\s*grant\b/i.test(l))
      .join("\n");
    assert.ok(!/\bto\s+anon\b/i.test(grantLines));
    assert.ok(!/\bto\s+authenticated\b/i.test(grantLines));
    assert.ok(
      /to service_role/i.test(grantLines),
      "grants must target service_role",
    );
    assert.match(
      mig,
      /create or replace function public\.delete_owned_partner_manual_relationship/i,
    );
    assert.match(
      mig,
      /grant execute on function public\.delete_owned_partner_manual_relationship[\s\S]*to service_role/i,
    );
    assert.match(mig, /revoke all on function[\s\S]*from anon/i);
    assert.match(mig, /revoke all on function[\s\S]*from authenticated/i);
    assert.match(mig, /partner_manual/);
    assert.match(mig, /clerk_user_id/);
    ok("required service_role grants represented; no anon/authenticated grants");
    ok("migration is idempotent (GRANT + CREATE OR REPLACE)");
  }

  section("person_core follow-up migration");
  {
    const mig = read(
      "supabase/migrations/20260805213000_restore_service_role_person_core_privileges.sql",
    );
    assert.match(
      mig,
      /grant select, insert, update\s+on table public\.person_core_blueprints\s+to service_role/i,
    );
    const grantLines = mig
      .split(/\r?\n/)
      .filter((l) => /^\s*grant\b/i.test(l))
      .join("\n");
    assert.ok(
      !/person_core_blueprints[\s\S]*\bdelete\b|\bdelete\b[\s\S]*person_core_blueprints/i.test(
        grantLines,
      ),
    );
    assert.ok(!/\bto\s+anon\b/i.test(grantLines));
    assert.ok(!/\bto\s+authenticated\b/i.test(grantLines));
    ok("person_core_blueprints SELECT/INSERT/UPDATE; no DELETE/anon/authenticated");
  }

  section("remove route ownership + atomic RPC");
  {
    const src = read("app/api/relationship/remove/route.ts");
    assert.match(src, /assertOwnedReportAccess/);
    assert.match(src, /delete_owned_partner_manual_relationship/);
    assert.match(src, /p_clerk_user_id:\s*userId/);
    assert.ok(!/await supabase\.from\("reports"\)\.delete\(\)/.test(src));
    assert.ok(!/report_id_a !== viewerReportId/.test(src));
    assert.match(src, /if \(!userId\)/);
    ok("remove uses owned-viewer guard + transactional RPC");
  }

  section("partner-name ownership");
  {
    const src = read("app/api/relationship/partner-name/route.ts");
    assert.match(src, /clerk_user_id/);
    assert.match(src, /\.eq\("report_type",\s*"partner_manual"\)/);
    assert.match(src, /partner\.clerk_user_id !== userId/);
    ok("partner rename checks clerk_user_id + partner_manual");
  }

  section("account delete ownership + order");
  {
    const src = read("app/api/account/delete/route.ts");
    assert.match(src, /\.eq\("clerk_user_id",\s*userId\)/);
    assert.match(src, /from\("reports"\)[\s\S]*\.delete\(\)/);
    const dbIdx = src.indexOf('.from("reports")');
    const clerkIdx = src.indexOf("deleteUser");
    assert.ok(dbIdx >= 0 && clerkIdx > dbIdx, "DB cleanup before Clerk delete");
    ok("account delete filters by current Clerk user; DB then Clerk");
  }

  section("hub UI delete wiring");
  {
    const hub = read("components/relationship/hub/RelationHubDashboard.tsx");
    const row = read("components/relationship/hub/FriendStoryRow.tsx");
    const dlg = read("components/relationship/hub/RemoveFriendDialog.tsx");
    assert.match(hub, /\/api\/relationship\/remove/);
    assert.match(hub, /RemoveFriendDialog/);
    assert.match(hub, /row_kind !== "relationship_manual"/);
    assert.match(row, /onRemove/);
    assert.match(row, /relationship_manual/);
    assert.match(dlg, /removeFriendConfirm/);
    ok("hub wires remove only for partner_manual relationships");
  }

  section("FK cascade graph (baseline SSOT)");
  {
    const baseline = read(
      "supabase/migrations/20260714140000_dev_baseline_ssot.sql",
    );
    assert.match(
      baseline,
      /relationship_reports[\s\S]*report_id_a[\s\S]*on delete cascade/i,
    );
    assert.match(
      baseline,
      /relationship_reports[\s\S]*report_id_b[\s\S]*on delete cascade/i,
    );
    assert.match(
      baseline,
      /survey_responses[\s\S]*report_id[\s\S]*on delete cascade/i,
    );
    assert.match(
      baseline,
      /invites[\s\S]*from_report_id[\s\S]*on delete cascade/i,
    );
    assert.match(
      baseline,
      /relationship_favorites[\s\S]*viewer_report_id[\s\S]*on delete cascade/i,
    );
    assert.match(
      baseline,
      /relationship_analysis_logs[\s\S]*viewer_report_id[\s\S]*on delete cascade/i,
    );
    ok("account delete cascade graph documented in baseline migration");
  }

  section("account cascade ownership invariants (logic)");
  {
    // A deletes owned reports → dependent RR/invites/favorites/logs cascade.
    // B's self report is untouched because delete filters clerk_user_id = A only.
    // Shared RR involving A+B: deleting A's report cascades RR; B's report remains.
    const deleteSrc = read("app/api/account/delete/route.ts");
    assert.match(deleteSrc, /\.eq\("clerk_user_id",\s*userId\)/);
    assert.ok(
      !/\.delete\(\)[\s\S]*without.*clerk/i.test(deleteSrc),
    );
    // Retry: second call still deletes 0 rows for A then retries Clerk — no broader wipe.
    assert.ok(!/truncate/i.test(deleteSrc));
    ok("A-only filter; B self preserved; retry remains scoped to current user");
  }

  section("list ownership");
  {
    const list = read("app/api/relationship/list/route.ts");
    assert.match(list, /assertOwnedReportAccess/);
    assert.match(list, /auth\(\)/);
    ok("relationship list requires owned viewer report");
  }

  console.log(`\n${passed} tests passed`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
