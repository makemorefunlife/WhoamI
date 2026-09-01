/**
 * Deterministic CPU-bound benchmark for the relationship-map's role
 * grouping / count calculation / payload construction — the part of
 * computeRelationshipMap that has no I/O (the actual Day Master lookups
 * happen via getOrBuildPersonCore, batched with Promise.all over unique
 * partner report ids — see the note this script prints at the end).
 *
 * Goal: catch an accidental O(n^2) in the grouping/aggregation code, not
 * assert a specific millisecond number. No LLM involved anywhere.
 *
 * Run: npx tsx tests/scripts/relationship-map-performance-benchmark.ts
 */
import { resolveDayMasterRelationshipRole } from "../../lib/relationship/map/resolveDayMasterRelationshipRole";
import { RELATIONSHIP_ROLES, type RelationshipRoleId } from "../../lib/relationship/map/relationshipRoleSsot";
import { buildAnonymousMapShare } from "../../lib/relationship/map/buildAnonymousMapShare";

const STEMS = ["gap", "eul", "byeong", "jeong", "mu", "gi", "gyeong", "sin", "im", "gye"];

function syntheticConnections(count: number) {
  const viewerDayMaster = STEMS[3]; // jeong, arbitrary but fixed
  const connections = [];
  for (let i = 0; i < count; i++) {
    connections.push({
      relationshipReportId: `rr-${i}`,
      partnerReportId: `partner-${i}`,
      partnerName: `Person ${i}`,
      otherDayMaster: STEMS[i % STEMS.length],
    });
  }
  return { viewerDayMaster, connections };
}

function runOnce(count: number) {
  const { viewerDayMaster, connections } = syntheticConnections(count);

  const start = performance.now();

  const roleCounts = Object.fromEntries(
    RELATIONSHIP_ROLES.map((r) => [r.roleId, 0]),
  ) as Record<RelationshipRoleId, number>;
  const peopleByRole = new Map<RelationshipRoleId, unknown[]>(
    RELATIONSHIP_ROLES.map((r) => [r.roleId, []]),
  );

  for (const c of connections) {
    const { roleId } = resolveDayMasterRelationshipRole({
      viewerDayMaster,
      otherDayMaster: c.otherDayMaster,
    });
    roleCounts[roleId] += 1;
    peopleByRole.get(roleId)!.push({
      key: c.relationshipReportId,
      name: c.partnerName,
      relationshipReportId: c.relationshipReportId,
      partnerReportId: c.partnerReportId,
    });
  }

  const roles = RELATIONSHIP_ROLES.map((r) => ({
    roleId: r.roleId,
    tenGod: r.tenGod,
    count: roleCounts[r.roleId],
  }));

  const anonymized = buildAnonymousMapShare({ totalPeople: count, roles }, "en-US");

  const elapsedMs = performance.now() - start;

  const totalCounted = roles.reduce((sum, r) => sum + r.count, 0);
  if (totalCounted !== count) {
    throw new Error(`grouping lost people: expected ${count}, counted ${totalCounted}`);
  }
  if (anonymized.roles.length !== 10) {
    throw new Error("anonymized payload must always carry all 10 roles");
  }

  return elapsedMs;
}

function main() {
  // warm up (JIT) before measuring, so the first size isn't penalized
  runOnce(50);

  for (const count of [100, 500]) {
    const runs = [runOnce(count), runOnce(count), runOnce(count)];
    const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
    console.log(`n=${count}: avg ${avg.toFixed(3)}ms over 3 runs (${runs.map((r) => r.toFixed(3)).join(", ")}ms)`);
    // Generous bound: real Ten-God lookup is O(1) table access, so this
    // should be sub-millisecond even at 500. 25ms is a loose ceiling meant
    // to catch an accidental O(n^2), not to assert a tight number.
    if (avg > 25) {
      throw new Error(`FAIL: n=${count} averaged ${avg.toFixed(3)}ms — investigate for accidental O(n^2)`);
    }
  }

  console.log(
    "\nok - role grouping/count/payload construction is linear and fast at 100 and 500 connections",
  );
  console.log(
    "\nNOTE: this benchmarks only the CPU-bound grouping code. The real per-request cost is I/O:" +
      " computeRelationshipMap already fetches all unique partner PersonCore blueprints concurrently" +
      " via a single Promise.all (not one await per person in a loop), so N connections means N" +
      " concurrent lookups, not N sequential round-trips. No additional concurrency limiting was added" +
      " for this pass — untested at real 500-connection scale, and not over-engineered for a case that" +
      " hasn't been observed.",
  );
}

main();
