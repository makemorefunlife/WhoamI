/**
 * Relationship-map connection integration checks (gap-closure section 13):
 * duplicate connections to the same partner must never double-count, and
 * an existing connected user must always resolve to exactly one person.
 *
 * The invite subsystem itself (token creation, accept, expiry) is
 * pre-existing and untouched by this feature — this file does not
 * duplicate that coverage, it only tests the map-specific dedup layer that
 * sits on top of whatever connections that subsystem produces.
 *
 * Run: npx tsx tests/unit/relationship-map-connections.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { dedupeConnectionsByPartner } = await import(
  "../../lib/relationship/map/dedupeConnectionsByPartner.ts"
);

section("a single connection passes through unchanged");
{
  const out = dedupeConnectionsByPartner([
    { partnerReportId: "P1", status: "completed", addedAt: "2026-01-01T00:00:00Z", isManual: false },
  ]);
  assert.equal(out.length, 1);
  ok("one connection in -> one connection out");
}

section("duplicate relationship_report rows for the same partner do not double-count");
{
  const out = dedupeConnectionsByPartner([
    { partnerReportId: "P1", status: "pending", addedAt: "2026-01-01T00:00:00Z", isManual: false, tag: "stale-pending" },
    { partnerReportId: "P1", status: "completed", addedAt: "2026-01-02T00:00:00Z", isManual: false, tag: "newer-completed" },
    { partnerReportId: "P2", status: "completed", addedAt: "2026-01-01T00:00:00Z", isManual: false, tag: "unrelated" },
  ]);
  assert.equal(out.length, 2, "two distinct partners must yield exactly two rows, never three");
  const p1 = out.find((r) => r.partnerReportId === "P1");
  assert.equal(p1.tag, "newer-completed", "completed status wins over a stale pending duplicate");
  ok("2 rows for the same partner P1 collapse to 1; a distinct partner P2 is untouched — no double-counting");
}

section("existing connected user remains exactly one person across many duplicate rows");
{
  const rows = Array.from({ length: 12 }, (_, i) => ({
    partnerReportId: "SAME_PARTNER",
    status: i % 3 === 0 ? "completed" : "pending",
    addedAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    isManual: false,
  }));
  const out = dedupeConnectionsByPartner(rows);
  assert.equal(out.length, 1, "12 duplicate rows for one partner must still resolve to exactly 1 person");
  ok("12 duplicate rows for the same partner collapse to exactly 1 — the map can never inflate one person into many");
}

section("tie-break prefers most recently added when status/manual are equal");
{
  const out = dedupeConnectionsByPartner([
    { partnerReportId: "P1", status: "pending", addedAt: "2026-01-01T00:00:00Z", isManual: false, tag: "older" },
    { partnerReportId: "P1", status: "pending", addedAt: "2026-01-05T00:00:00Z", isManual: false, tag: "newer" },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].tag, "newer");
  ok("equal status/manual -> most recently added wins");
}

console.log("\nAll relationship-map connection dedup tests passed.");
