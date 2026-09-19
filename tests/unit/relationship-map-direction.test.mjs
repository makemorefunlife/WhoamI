/**
 * Relationship Map directionality guard -- resolveDayMasterRelationshipRole
 * must stay strictly viewer-centered. A->B and B->A must NOT be silently
 * swapped or coincide by construction; this test pins a concrete,
 * data-verified asymmetric pair (byeong vs gap) so any future refactor that
 * accidentally flips the argument order fails loudly here instead of only
 * showing up as a subtly wrong role label in production.
 *
 * Run: npx tsx tests/unit/relationship-map-direction.test.mjs
 */
import assert from "node:assert/strict";

async function loadModules() {
  const roleMod = await import("../../lib/relationship/map/resolveDayMasterRelationshipRole.ts");
  const ssotMod = await import("../../lib/relationship/map/relationshipRoleSsot.ts");
  return { ...roleMod, ...ssotMod };
}

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`[OK] ${name}`);
}

async function run() {
  const { resolveDayMasterRelationshipRole, getRelationshipRoleByTenGod } = await loadModules();

  // Ground truth from lib/hardcoded/sajuReferenceData.ts's REF_TEN_GOD_RULES:
  //   byeong -> gap  => pyeonin  (role: muse)
  //   gap    -> byeong => siksin  (role: couch)
  //   byeong -> byeong => bigyeon (role: twin)
  {
    const viewerToOther = resolveDayMasterRelationshipRole({
      viewerDayMaster: "byeong",
      otherDayMaster: "gap",
    });
    assert.equal(viewerToOther.tenGod, "pyeonin");
    assert.equal(viewerToOther.roleId, "muse");
    ok("byeong-viewer sees gap-other as muse (pyeonin)");
  }

  {
    const reversed = resolveDayMasterRelationshipRole({
      viewerDayMaster: "gap",
      otherDayMaster: "byeong",
    });
    assert.equal(reversed.tenGod, "siksin");
    assert.equal(reversed.roleId, "couch");
    ok("gap-viewer sees byeong-other as couch (siksin) -- different from the reverse");
  }

  // The core regression guard: A->B must not equal B->A for this pair.
  {
    const aToB = resolveDayMasterRelationshipRole({
      viewerDayMaster: "byeong",
      otherDayMaster: "gap",
    });
    const bToA = resolveDayMasterRelationshipRole({
      viewerDayMaster: "gap",
      otherDayMaster: "byeong",
    });
    assert.notEqual(
      aToB.roleId,
      bToA.roleId,
      "viewer/other must not be interchangeable -- A->B and B->A resolved to the same role, which means the direction argument was dropped or swapped somewhere",
    );
    ok("A->B and B->A resolve to different roles for an asymmetric Ten God pair");
  }

  // Same day master both ways is the one case where symmetry is EXPECTED
  // (bigyeon is its own mirror) -- confirms the guard above is about
  // direction-swap bugs, not "roles must always differ".
  {
    const selfPair = resolveDayMasterRelationshipRole({
      viewerDayMaster: "byeong",
      otherDayMaster: "byeong",
    });
    assert.equal(selfPair.tenGod, "bigyeon");
    assert.equal(selfPair.roleId, "twin");
    ok("same Day Master both ways resolves to the symmetric twin/bigyeon role");
  }

  // Determinism -- pure function, no hidden state/caching bugs.
  {
    const first = resolveDayMasterRelationshipRole({
      viewerDayMaster: "byeong",
      otherDayMaster: "gap",
    });
    const second = resolveDayMasterRelationshipRole({
      viewerDayMaster: "byeong",
      otherDayMaster: "gap",
    });
    assert.deepEqual(first, second);
    ok("resolveDayMasterRelationshipRole is deterministic/pure");
  }

  // Every Ten God code the resolver can produce must map to a role in the
  // SSOT -- guards against the SSOT and the resolver drifting apart.
  {
    const allTenGods = [
      "jeongin", "pyeonin", "jeonggwan", "pyeongwan", "siksin",
      "sanggwan", "jeongjae", "pyeonjae", "bigyeon", "geopjae",
    ];
    for (const tg of allTenGods) {
      const role = getRelationshipRoleByTenGod(tg);
      assert.ok(role && role.roleId, `missing role for ten god ${tg}`);
    }
    ok("every canonical Ten God code maps to a role in the SSOT");
  }

  console.log(`\n${passed} relationship-map-direction test(s) passed.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
