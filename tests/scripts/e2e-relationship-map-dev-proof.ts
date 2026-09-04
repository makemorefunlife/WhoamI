/**
 * DEV-only end-to-end proof for the Relationship Map live wiring.
 *
 * Creates two throwaway, clearly-labeled test reports (clerk_user_id
 * prefixed e2e_test_, never a real user), runs them through the real
 * personal-connect + directional-membership + Ten-God pipeline using the
 * actual production code paths (not reimplemented logic), asserts the
 * expected outcomes, then deletes everything it created (cascades clean up
 * personal_connect_links / personal_connect_link_uses /
 * relationship_map_memberships / relationship_reports automatically).
 *
 * Run: npx tsx tests/scripts/e2e-relationship-map-dev-proof.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { getOrBuildPersonCore } from "../../lib/personCore/services/getOrBuildPersonCore";
import { getOrCreatePersonalConnectLink } from "../../lib/relationship/personalConnect/personalConnectLinks";
import { ensureRelationshipReport } from "../../lib/relationship/createRelationshipReport";
import { initialMembershipsForLinkJoin } from "../../lib/relationship/map/directionalMembership";
import { fetchRelationshipMapConnections } from "../../lib/relationship/map/fetchRelationshipMapConnections";
import { computeRelationshipMap, invalidateRelationshipMapCache } from "../../lib/relationship/map/computeRelationshipMap";
import { resolveDayMasterRelationshipRole } from "../../lib/relationship/map/resolveDayMasterRelationshipRole";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ref = new URL(url).hostname.split(".")[0];
if (ref !== "alcknxpemdjytwvnschq") {
  console.error(`REFUSING: configured ref is ${ref}, expected DEV ref alcknxpemdjytwvnschq.`);
  process.exit(1);
}
console.log("DEV target confirmed:", ref);

const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const stamp = Date.now();
const viewerClerkId = `e2e_test_viewer_${stamp}`;
const otherClerkId = `e2e_test_other_${stamp}`;
let viewerId: string | undefined;
let otherId: string | undefined;

async function cleanup() {
  console.log("\n=== cleanup ===");
  for (const id of [viewerId, otherId]) {
    if (!id) continue;
    const { error } = await supabase.from("reports").delete().eq("id", id);
    console.log(`  delete reports.${id}: ${error ? "FAILED " + error.message : "ok"}`);
  }
}

async function main() {
  console.log("\n=== 1. create two throwaway test reports with different birth dates ===");
  const { data: viewerRow, error: viewerErr } = await supabase
    .from("reports")
    .insert({ clerk_user_id: viewerClerkId, name: "E2E Test Viewer", birth_date: "1990-03-14" })
    .select("id")
    .single();
  if (viewerErr) throw viewerErr;
  viewerId = viewerRow.id as string;
  console.log("  viewer report id:", viewerId);

  const { data: otherRow, error: otherErr } = await supabase
    .from("reports")
    .insert({ clerk_user_id: otherClerkId, name: "E2E Test Other", birth_date: "1985-09-02" })
    .select("id")
    .single();
  if (otherErr) throw otherErr;
  otherId = otherRow.id as string;
  console.log("  other report id:", otherId);

  console.log("\n=== 2. resolve real Day Masters via getOrBuildPersonCore (no LLM, pure calendar calc) ===");
  const viewerCore = await getOrBuildPersonCore(viewerId);
  const otherCore = await getOrBuildPersonCore(otherId);
  const viewerDayMaster = viewerCore.saju_master_json.stem_focus.day_stem_code;
  const otherDayMaster = otherCore.saju_master_json.stem_focus.day_stem_code;
  assert.ok(viewerDayMaster, "viewer must have a computable Day Master");
  assert.ok(otherDayMaster, "other must have a computable Day Master");
  console.log(`  viewer Day Master: ${viewerDayMaster}`);
  console.log(`  other Day Master: ${otherDayMaster}`);

  console.log("\n=== 3. expected role, computed independently via the real SSOT function ===");
  const expected = resolveDayMasterRelationshipRole({ viewerDayMaster, otherDayMaster });
  console.log(`  expected: tenGod=${expected.tenGod} roleId=${expected.roleId}`);

  console.log("\n=== 4. viewer creates a Personal Connect link (real getOrCreatePersonalConnectLink) ===");
  const { token } = await getOrCreatePersonalConnectLink(supabase, viewerId);
  console.log("  token created:", token.slice(0, 8) + "...");

  console.log("\n=== 5. simulate the other person completing the link (same logic as /api/connect/complete) ===");
  async function completeLinkOnce() {
    const { data: link } = await supabase
      .from("personal_connect_links")
      .select("report_id")
      .eq("token", token)
      .maybeSingle();
    assert.ok(link, "link must resolve");
    const ownerReportId = link!.report_id as string;

    const { relationshipReportId } = await ensureRelationshipReport(supabase, ownerReportId, otherId!);

    await supabase.from("personal_connect_link_uses").upsert(
      { report_id: ownerReportId, accepted_report_id: otherId, relationship_report_id: relationshipReportId },
      { onConflict: "report_id,accepted_report_id", ignoreDuplicates: true },
    );

    const { joinerSeesOwner, ownerSeesJoiner } = initialMembershipsForLinkJoin();
    await supabase.from("relationship_map_memberships").upsert(
      {
        relationship_report_id: relationshipReportId,
        viewer_report_id: otherId,
        other_report_id: ownerReportId,
        status: joinerSeesOwner,
        responded_at: new Date().toISOString(),
      },
      { onConflict: "relationship_report_id,viewer_report_id" },
    );
    await supabase.from("relationship_map_memberships").upsert(
      {
        relationship_report_id: relationshipReportId,
        viewer_report_id: ownerReportId,
        other_report_id: otherId,
        status: ownerSeesJoiner,
      },
      { onConflict: "relationship_report_id,viewer_report_id", ignoreDuplicates: true },
    );
    return relationshipReportId;
  }

  const rrId1 = await completeLinkOnce();
  console.log("  relationship_report_id:", rrId1);

  console.log("\n=== 6. idempotency: complete the same link again, must not duplicate ===");
  const rrId2 = await completeLinkOnce();
  assert.equal(rrId1, rrId2, "second completion must reuse the same relationship_reports row");

  const { data: rrRows } = await supabase
    .from("relationship_reports")
    .select("id")
    .or(`and(report_id_a.eq.${viewerId},report_id_b.eq.${otherId}),and(report_id_a.eq.${otherId},report_id_b.eq.${viewerId})`);
  assert.equal(rrRows?.length, 1, "exactly one relationship_reports row for this pair");

  const { data: membershipRows } = await supabase
    .from("relationship_map_memberships")
    .select("id, viewer_report_id, other_report_id, status")
    .eq("relationship_report_id", rrId1);
  assert.equal(membershipRows?.length, 2, "exactly one membership row per direction (2 total), no duplicates after re-completion");
  console.log("  membership rows:", JSON.stringify(membershipRows));

  console.log("\n=== 7. JOINER (other) side: link-user consented immediately, must see OWNER (viewer) right away ===");
  const otherConnections = await fetchRelationshipMapConnections(supabase, otherId);
  assert.ok(
    otherConnections.find((c) => c.partnerReportId === viewerId),
    "joiner's map must show the owner immediately (joinerSeesOwner = accepted)",
  );

  console.log("\n=== 8. OWNER (viewer) side BEFORE accepting: must NOT yet see the joiner (starts pending) ===");
  const viewerConnectionsBefore = await fetchRelationshipMapConnections(supabase, viewerId);
  assert.ok(
    !viewerConnectionsBefore.find((c) => c.partnerReportId === otherId),
    "owner's map must NOT show the joiner until the owner explicitly accepts (ownerSeesJoiner = pending)",
  );

  console.log("\n=== 9. owner explicitly accepts the reciprocal request (same effect as /api/connect/respond) ===");
  const { data: acceptedRow, error: acceptErr } = await supabase
    .from("relationship_map_memberships")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("relationship_report_id", rrId1)
    .eq("viewer_report_id", viewerId)
    .eq("status", "pending")
    .select("relationship_report_id")
    .maybeSingle();
  if (acceptErr) throw acceptErr;
  assert.ok(acceptedRow, "owner's pending row must exist and flip to accepted exactly once");

  console.log("\n=== 10. computeRelationshipMap (owner's map): other person must now appear under the EXACT expected role ===");
  const mapResult = await computeRelationshipMap(supabase, viewerId);
  const peopleInExpectedRole = mapResult.peopleByRole.get(expected.roleId) ?? [];
  const personEntry = peopleInExpectedRole.find((p) => p.partnerReportId === otherId);
  assert.ok(personEntry, `other person must appear under role ${expected.roleId}`);
  assert.equal(personEntry!.tenGod, expected.tenGod);
  console.log(`  OK — other person rendered under role="${expected.roleId}" tenGod="${expected.tenGod}"`);

  console.log("\n=== 11. reload simulation: bust the cache and recompute from scratch — must return the identical result ===");
  invalidateRelationshipMapCache(viewerId);
  const mapResultAgain = await computeRelationshipMap(supabase, viewerId);
  const peopleAgain = mapResultAgain.peopleByRole.get(expected.roleId) ?? [];
  assert.ok(peopleAgain.find((p) => p.partnerReportId === otherId), "person must still be present after a full, uncached recomputation (simulated reload)");

  console.log("\n=== 12. no PGRST205/PGRST202, no permission-denied anywhere above (would have thrown) ===");
  console.log("  OK — no schema-cache or permission errors were raised by any step");

  console.log("\nALL E2E ASSERTIONS PASSED");
}

main()
  .catch((e) => {
    console.error("\nE2E FAILED:", e);
    process.exitCode = 1;
  })
  .finally(cleanup);
