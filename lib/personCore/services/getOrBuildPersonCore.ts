import { buildPersonCoreBlueprint } from "./buildPersonCoreBlueprint";
import { loadPerson } from "./loadPerson";
import { upsertPersonCoreBlueprint } from "./upsertPersonCoreBlueprint";
import type { PersonCoreBlueprint } from "../types/personCoreBlueprint";

/**
 * PersonCore SSOT — 스냅샷 있으면 즉시 반환, 없으면 1회 빌드 후 upsert.
 */
export async function getOrBuildPersonCore(
  reportId: string,
): Promise<PersonCoreBlueprint> {
  const existing = await loadPerson(reportId);
  if (existing) return existing;

  const built = await buildPersonCoreBlueprint(reportId);
  await upsertPersonCoreBlueprint(built);
  return built;
}

export type PersonCorePair = {
  personA: PersonCoreBlueprint;
  personB: PersonCoreBlueprint;
};

export async function getOrBuildPersonCorePair(
  reportIdA: string,
  reportIdB: string,
): Promise<PersonCorePair> {
  const [personA, personB] = await Promise.all([
    getOrBuildPersonCore(reportIdA),
    getOrBuildPersonCore(reportIdB),
  ]);
  return { personA, personB };
}
