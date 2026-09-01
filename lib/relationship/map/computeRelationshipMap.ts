import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrBuildPersonCore } from "@/lib/personCore/services/getOrBuildPersonCore";
import { loadPersonsBatch } from "@/lib/personCore/services/loadPerson";
import { logServerError } from "@/lib/security/safeLog";
import { fetchFavoriteRelationshipIds } from "@/lib/relationship/analysisLog";
import { fetchRelationshipMapConnections } from "./fetchRelationshipMapConnections";
import { resolveDayMasterRelationshipRole } from "./resolveDayMasterRelationshipRole";
import {
  RELATIONSHIP_ROLES,
  type RelationshipRoleId,
  type TenGodCode,
} from "./relationshipRoleSsot";

export type RelationshipMapPerson = {
  key: string;
  name: string;
  relationshipReportId: string;
  partnerReportId: string;
  roleId: RelationshipRoleId;
  tenGod: TenGodCode;
  isFavorite: boolean;
  addedAt: string | null;
};

export type RelationshipMapResult = {
  totalPeople: number;
  roleCounts: Record<RelationshipRoleId, number>;
  peopleByRole: Map<RelationshipRoleId, RelationshipMapPerson[]>;
};

function emptyRoleCounts(): Record<RelationshipRoleId, number> {
  return Object.fromEntries(RELATIONSHIP_ROLES.map((r) => [r.roleId, 0])) as Record<
    RelationshipRoleId,
    number
  >;
}

function emptyPeopleByRole(): Map<RelationshipRoleId, RelationshipMapPerson[]> {
  return new Map(RELATIONSHIP_ROLES.map((r) => [r.roleId, []]));
}

/**
 * Free-tier map: viewer Day Master x each connected person's Day Master ->
 * role, aggregated into counts. No LLM call — Day Masters come from the
 * existing PersonCore Saju snapshot.
 *
 * Every partner's Day Master snapshot is fetched in ONE batched query
 * (loadPersonsBatch), not one query per connection — this runs on every
 * summary load AND every role click, so an N-query fan-out here directly
 * showed up as felt latency once someone had more than a couple of
 * connections. Deliberately skips getOrBuildPersonCore's input-fingerprint
 * staleness check for people found in the batch: Day Master is a coarse,
 * effectively-permanent value derived from birth date/time, so trading a
 * rare, brief staleness window for O(1) queries instead of O(n) is the
 * right tradeoff for this free/visualization layer specifically — it is
 * NOT the right tradeoff for the premium report engine, which still uses
 * getOrBuildPersonCore's full staleness guard untouched.
 *
 * A connection whose partner has no computable Day Master yet (birth info
 * incomplete) is silently excluded from the map — it still exists in the
 * ordinary friend list, it just can't be placed on a role planet yet.
 */
async function computeRelationshipMapUncached(
  supabase: SupabaseClient,
  viewerReportId: string,
): Promise<RelationshipMapResult> {
  const connections = await fetchRelationshipMapConnections(supabase, viewerReportId);

  const roleCounts = emptyRoleCounts();
  const peopleByRole = emptyPeopleByRole();

  if (connections.length === 0) {
    return { totalPeople: 0, roleCounts, peopleByRole };
  }

  const uniquePartnerIds = [...new Set(connections.map((c) => c.partnerReportId))];

  const [viewerCore, favoriteIds, batchedPartnerCores] = await Promise.all([
    getOrBuildPersonCore(viewerReportId),
    fetchFavoriteRelationshipIds(supabase, viewerReportId),
    loadPersonsBatch(uniquePartnerIds),
  ]);
  const viewerDayMaster = viewerCore.saju_master_json.stem_focus.day_stem_code;

  // Batch covers everyone who already has a PersonCore snapshot (one query
  // total, not one per person). Only build individually for the rare
  // partner with no snapshot at all yet.
  const missingIds = uniquePartnerIds.filter((id) => !batchedPartnerCores.has(id));
  if (missingIds.length > 0) {
    const built = await Promise.all(
      missingIds.map(async (id) => {
        try {
          return [id, await getOrBuildPersonCore(id)] as const;
        } catch (e) {
          logServerError("relationshipMap.partnerCore", e, "person_core_build_failed");
          return [id, null] as const;
        }
      }),
    );
    for (const [id, core] of built) {
      if (core) batchedPartnerCores.set(id, core);
    }
  }

  let totalPeople = 0;
  connections.forEach((c) => {
    const otherDayMaster = batchedPartnerCores.get(c.partnerReportId)?.saju_master_json.stem_focus
      .day_stem_code;
    if (!otherDayMaster) return;

    const { tenGod, roleId } = resolveDayMasterRelationshipRole({
      viewerDayMaster,
      otherDayMaster,
    });

    roleCounts[roleId] += 1;
    totalPeople += 1;
    peopleByRole.get(roleId)!.push({
      key: c.relationshipReportId,
      name: c.partnerName,
      relationshipReportId: c.relationshipReportId,
      partnerReportId: c.partnerReportId,
      roleId,
      tenGod,
      isFavorite: favoriteIds.has(c.relationshipReportId),
      addedAt: c.addedAt,
    });
  });

  return { totalPeople, roleCounts, peopleByRole };
}

const RESULT_CACHE_TTL_MS = 20_000;
const resultCache = new Map<string, { expiresAt: number; promise: Promise<RelationshipMapResult> }>();

/**
 * The map's own summary load and every subsequent role click each call
 * this — without a cache, clicking through 3-4 planets in a row redid the
 * full connections + Day Master fetch that many times. This is a
 * short-lived (20s), process-local memo keyed by viewer: a warm click
 * within that window reuses the in-flight/just-finished computation
 * instead of repeating every query. On a cold serverless instance this
 * simply always misses — same behavior as before, never worse.
 */
export function computeRelationshipMap(
  supabase: SupabaseClient,
  viewerReportId: string,
): Promise<RelationshipMapResult> {
  const now = Date.now();
  const cached = resultCache.get(viewerReportId);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = computeRelationshipMapUncached(supabase, viewerReportId);
  resultCache.set(viewerReportId, { expiresAt: now + RESULT_CACHE_TTL_MS, promise });
  promise.catch(() => resultCache.delete(viewerReportId));
  return promise;
}
