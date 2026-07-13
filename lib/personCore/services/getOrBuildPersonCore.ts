import { buildPersonCoreBlueprint } from "./buildPersonCoreBlueprint";
import { computeCurrentInputFingerprint } from "./computeCurrentInputFingerprint";
import { loadPerson } from "./loadPerson";
import { upsertPersonCoreBlueprint } from "./upsertPersonCoreBlueprint";
import type { PersonCoreBlueprint } from "../types/personCoreBlueprint";

export type GetOrBuildPersonCoreOptions = {
  /** true면 지문 일치 여부와 무관하게 재빌드 */
  force?: boolean;
};

/**
 * PersonCore SSOT — 스냅샷이 있고 지문이 일치하면 반환, stale·force 시 재빌드 후 upsert.
 */
export async function getOrBuildPersonCore(
  reportId: string,
  options?: GetOrBuildPersonCoreOptions,
): Promise<PersonCoreBlueprint> {
  const force = options?.force === true;
  const existing = await loadPerson(reportId);

  if (existing && !force) {
    const currentFingerprint = await computeCurrentInputFingerprint(reportId);
    if (existing.input_fingerprint === currentFingerprint) {
      return existing;
    }
  }

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
  options?: GetOrBuildPersonCoreOptions,
): Promise<PersonCorePair> {
  const [personA, personB] = await Promise.all([
    getOrBuildPersonCore(reportIdA, options),
    getOrBuildPersonCore(reportIdB, options),
  ]);
  return { personA, personB };
}
