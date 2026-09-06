/**
 * Auto-share inbox — "Option A" (spec follow-up: clicking Share should make
 * the analysis appear on the recipient's own side automatically, with no
 * link to copy/paste). Tests the pure shaping function directly (no
 * database, no Clerk session), same pattern as relationship-report-share.test.mjs.
 *
 * Run: npx tsx tests/unit/relationship-share-auto-inbox.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { buildSharedInboxItem } = await import(
  "../../lib/relationship/reportShare/buildSharedInboxItem.ts"
);

const copy = {
  partnerFallbackLabel: "상대",
  kindLabel: (kind) =>
    ({
      romantic: "연인",
      work: "동료",
      cohabitation: "동거·결혼",
      friendship: "친구",
      family: "가족",
    })[kind],
  sharedAnalysisTitle: (kindLabel) => `${kindLabel} 심화 분석`,
  sharedAnalysisSubtitle: (partnerName) => `${partnerName}님이 공유했어요`,
};

const baseRow = {
  id: "share-row-1",
  relationship_report_id: "rr-1",
  kind: "work",
  owner_report_id: "report-owner-1",
  created_at: "2026-09-01T00:00:00.000Z",
};

section("A. a real owner name flows through as the partner name shown to the recipient");
{
  const item = buildSharedInboxItem(baseRow, "세라", copy);
  assert.equal(item.partner_name, "세라");
  assert.equal(item.relationship_kind, "work");
  assert.equal(item.summary_title, "동료 심화 분석");
  assert.equal(item.summary_subtitle, "세라님이 공유했어요");
  assert.equal(item.analysis_level, "premium");
  assert.equal(item.result_format, "shared");
  assert.equal(item.relationship_report_id, "rr-1");
  ok("real name + real kind -> correct title/subtitle, and identifiers pass through untouched");
}

section("B. a generic/empty owner name falls back to the neutral label, never a blank");
{
  const emptyName = buildSharedInboxItem(baseRow, null, copy);
  assert.equal(emptyName.partner_name, "상대");
  assert.equal(emptyName.summary_subtitle, "상대님이 공유했어요");

  const genericName = buildSharedInboxItem(baseRow, "탐사자", copy);
  assert.equal(
    genericName.partner_name,
    "상대",
    "the generic placeholder name 탐사자 must not leak into the shared-with-me feed either",
  );
  ok("null/generic owner names resolve to the same fallback used everywhere else (resolvePartnerDisplayName)");
}

section("C. an unrecognized/corrupt kind value never crashes the feed — falls back to a valid kind");
{
  const item = buildSharedInboxItem({ ...baseRow, kind: "not-a-real-kind" }, "세라", copy);
  assert.ok(
    ["romantic", "work", "cohabitation", "friendship", "family"].includes(item.relationship_kind),
    "parseRelationshipKind's own fallback must produce one of the 5 canonical kinds, not throw or pass through garbage",
  );
  ok("garbage kind value is normalized, not surfaced raw to the client");
}

section("D. every kind produces a distinct, correctly-labeled title (no A/work-only bias)");
{
  for (const kind of ["romantic", "work", "cohabitation", "friendship", "family"]) {
    const item = buildSharedInboxItem({ ...baseRow, kind }, "세라", copy);
    assert.equal(item.summary_title, `${copy.kindLabel(kind)} 심화 분석`);
  }
  ok("all 5 relationship kinds map to their own correct label, not a hardcoded one");
}

console.log("\nAll auto-share inbox shaping tests passed.");
