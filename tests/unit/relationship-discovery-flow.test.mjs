// Relationship Discovery Flow V1 — static source-pattern regression tests,
// same style as tests/unit/security-flow.test.mjs's invite/complete
// checks: this repo's existing unit tests for these connect/invite routes
// assert structural invariants against the route source rather than
// standing up a mocked Supabase client, so this file follows that same
// convention instead of introducing a new one.
import assert from "node:assert/strict";
import fs from "node:fs";

let passed = 0;
function ok(label) {
  passed += 1;
  console.log(`[OK] ${label}`);
}

async function run() {
  {
    const src = fs.readFileSync("lib/relationship/createRelationshipReport.ts", "utf8");
    // The old code did `if (error) throw error;` unconditionally — a
    // concurrent insert race (two requests for the same pair) surfaced as
    // a bare 500 for the losing request instead of resolving to the
    // winner's row.
    assert.ok(!/if \(error\) throw error;/.test(src), "race-loser must no longer just throw");
    assert.match(src, /error\.code === "23505"/);
    assert.match(src, /report_id_a", report_id_a\)/);
    assert.match(src, /report_id_b", report_id_b\)/);
    ok("ensureRelationshipReport: 23505 unique-violation race resolves to the winner's row, not a thrown error");
  }

  {
    const src = fs.readFileSync("app/api/connect/complete/route.ts", "utf8");
    // Joiner (present at call time) is marked seen immediately.
    const joinerBlockMatch = src.match(
      /viewer_report_id: joinerReportId,[\s\S]*?discovered_seen_at: nowIso,[\s\S]*?onConflict: "relationship_report_id,viewer_report_id" \},\s*\);/,
    );
    assert.ok(joinerBlockMatch, "joiner membership upsert must set discovered_seen_at");

    // Owner (may be offline) row must default to NULL on first insert and
    // never be touched again — ignoreDuplicates is what makes that safe,
    // and discovered_seen_at must not appear in this specific payload.
    const ownerBlockMatch = src.match(
      /viewer_report_id: ownerReportId,[\s\S]*?status: ownerSeesJoiner,\s*\},\s*\{ onConflict: "relationship_report_id,viewer_report_id", ignoreDuplicates: true \},/,
    );
    assert.ok(ownerBlockMatch, "owner membership upsert must keep ignoreDuplicates and omit discovered_seen_at");
    assert.ok(
      !ownerBlockMatch[0].includes("discovered_seen_at"),
      "owner membership payload must not set discovered_seen_at (must default to NULL / stay untouched on repeat)",
    );
    ok("connect/complete: joiner row seen-on-insert, owner row stays NULL-until-discovered and repeat-safe");
  }

  {
    const src = fs.readFileSync("app/api/invite/complete/route.ts", "utf8");
    const inviteeBlockMatch = src.match(
      /viewer_report_id: idCheck\.value,[\s\S]*?discovered_seen_at: nowIso,[\s\S]*?onConflict: "relationship_report_id,viewer_report_id" \},\s*\);/,
    );
    assert.ok(inviteeBlockMatch, "invitee (joiner-analog) membership upsert must set discovered_seen_at");

    const inviterBlockMatch = src.match(
      /viewer_report_id: data\.from_report_id,[\s\S]*?status: inviterSeesInvitee,\s*responded_at: nowIso,\s*\},\s*\{ onConflict: "relationship_report_id,viewer_report_id" \},/,
    );
    assert.ok(inviterBlockMatch, "inviter (owner-analog) membership upsert must be found");
    assert.ok(
      !inviterBlockMatch[0].includes("discovered_seen_at"),
      "inviter membership payload must not set discovered_seen_at (must default to NULL)",
    );

    // The one-time-use guarantee this discovery logic leans on for
    // "never re-runs for the same invite" must still be intact.
    assert.match(src, /\.eq\("status",\s*"open"\)/);
    ok("invite/complete: invitee row seen-on-insert, inviter row stays NULL; single-use (open->complete) guarantee unchanged");
  }

  {
    const src = fs.readFileSync("app/api/connect/discoveries/route.ts", "utf8");
    assert.match(src, /assertOwnedReportAccess/);
    assert.match(src, /\.eq\("status",\s*"accepted"\)/);
    assert.match(src, /\.is\("discovered_seen_at",\s*null\)/);
    ok("connect/discoveries GET: ownership-checked, only status=accepted AND discovered_seen_at IS NULL");
  }

  {
    const src = fs.readFileSync("app/api/connect/discoveries/seen/route.ts", "utf8");
    assert.match(src, /assertOwnedReportAccess/);
    assert.match(src, /discovered_seen_at: new Date\(\)\.toISOString\(\)/);
    // Must never be able to write discovered_seen_at back to null from
    // this endpoint — a seen discovery must never un-see itself.
    assert.ok(!/discovered_seen_at:\s*null/.test(src));
    ok("connect/discoveries/seen POST: ownership-checked, only ever sets discovered_seen_at forward, never clears it");
  }

  {
    const migrationFiles = fs
      .readdirSync("supabase/migrations")
      .filter((f) => f.includes("relationship_discovery_seen_at"));
    assert.equal(migrationFiles.length, 1, "expected exactly one discovery migration file");
    const src = fs.readFileSync(`supabase/migrations/${migrationFiles[0]}`, "utf8");
    assert.match(src, /alter table public\.relationship_map_memberships/);
    assert.match(src, /add column if not exists discovered_seen_at timestamptz/);
    // No new table — the spec is explicit that the existing directional
    // membership table (already one row per viewer) is reused as-is.
    assert.ok(!/create table/.test(src));
    ok("migration: adds discovered_seen_at to relationship_map_memberships only, no new table");
  }

  console.log(`\n${passed} relationship-discovery-flow test(s) passed.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
