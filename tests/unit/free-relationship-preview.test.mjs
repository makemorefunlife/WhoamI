/**
 * Free (birth-data-only) relationship preview composer -- verifies the
 * 6-item spec is fully populated, that role copy is read verbatim from the
 * existing 10-role SSOT (never redefined), and that the composer itself
 * stays viewer-centered (guards the same A/B-swap risk one layer up, at the
 * function the API route actually calls).
 *
 * Run: npx tsx tests/unit/free-relationship-preview.test.mjs
 */
import assert from "node:assert/strict";

async function loadModules() {
  const composeMod = await import("../../lib/relationship/map/composeFreeRelationshipPreview.ts");
  const ssotMod = await import("../../lib/relationship/map/relationshipRoleSsot.ts");
  return { ...composeMod, ...ssotMod };
}

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`[OK] ${name}`);
}

async function run() {
  const { composeFreeRelationshipPreview, getRelationshipRoleByTenGod } = await loadModules();

  const result = composeFreeRelationshipPreview({
    viewerDayMaster: "byeong",
    otherDayMaster: "gap",
    viewerName: "지수",
    otherName: "민호",
  });

  // 1 & 2: both directions present, matching the ground-truth pair used in
  // relationship-map-direction.test.mjs.
  {
    assert.equal(result.otherRoleForViewer.roleId, "muse");
    assert.equal(result.viewerRoleForOther.roleId, "couch");
    ok("both directional roles are present and correct");
  }

  // Role copy must be read verbatim from the SSOT, never redefined here.
  {
    const ssotMuse = getRelationshipRoleByTenGod("pyeonin");
    const ssotCouch = getRelationshipRoleByTenGod("siksin");
    assert.equal(result.otherRoleForViewer.labelKo, ssotMuse.labelKo);
    assert.equal(result.otherRoleForViewer.labelEn, ssotMuse.labelEn);
    assert.equal(result.otherRoleForViewer.descriptionKo, ssotMuse.descriptionKo);
    assert.equal(result.otherRoleForViewer.icon, ssotMuse.icon);
    assert.equal(result.viewerRoleForOther.labelKo, ssotCouch.labelKo);
    assert.equal(result.viewerRoleForOther.icon, ssotCouch.icon);
    ok("role label/description/icon match the SSOT verbatim (not redefined)");
  }

  // 3-6: every remaining item in the 6-item spec is populated.
  {
    assert.ok(result.summaryKo.length > 0 && result.summaryEn.length > 0);
    assert.equal(result.fitPointsKo.length, 2);
    assert.equal(result.fitPointsEn.length, 2);
    assert.ok(result.fitPointsKo.every((s) => s.length > 0));
    assert.ok(result.frictionPointsKo.length >= 1 && result.frictionPointsKo.length <= 2);
    assert.ok(result.frictionPointsEn.length >= 1 && result.frictionPointsEn.length <= 2);
    assert.ok(result.tipKo.length > 0 && result.tipEn.length > 0);
    ok("summary / 2 fit points / 1-2 friction points / 1 tip are all populated");
  }

  // Composer-level direction guard: swapping viewer/other must swap the
  // two roles, not leave them unchanged or collapse to the same value.
  {
    const swapped = composeFreeRelationshipPreview({
      viewerDayMaster: "gap",
      otherDayMaster: "byeong",
      viewerName: "민호",
      otherName: "지수",
    });
    assert.equal(swapped.otherRoleForViewer.roleId, result.viewerRoleForOther.roleId);
    assert.equal(swapped.viewerRoleForOther.roleId, result.otherRoleForViewer.roleId);
    ok("swapping viewer/other swaps the two roles correspondingly (composer-level A/B guard)");
  }

  // Same-role (symmetric) branch must not throw and must still return 1-2
  // friction points and a non-empty summary.
  {
    const same = composeFreeRelationshipPreview({
      viewerDayMaster: "byeong",
      otherDayMaster: "byeong",
      viewerName: "A",
      otherName: "B",
    });
    assert.equal(same.otherRoleForViewer.roleId, same.viewerRoleForOther.roleId);
    assert.ok(same.summaryKo.length > 0);
    assert.ok(same.frictionPointsKo.length >= 1);
    ok("symmetric (same-role) pair composes without error");
  }

  console.log(`\n${passed} free-relationship-preview test(s) passed.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
