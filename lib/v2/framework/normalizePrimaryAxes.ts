import {
  PRIMARY_AXIS_KEYS,
  type CurrentSelfProfile,
  type PrimaryAxesScores,
} from "@/lib/v2/survey/types";

const LEGACY_CONTROL_KEY = "control";

/** Rename legacy primary axis key `control` → `structure` */
export function normalizePrimaryAxes(
  raw: Record<string, number> | null | undefined,
): PrimaryAxesScores {
  const merged = { ...(raw ?? {}) } as Record<string, number>;

  if (LEGACY_CONTROL_KEY in merged && !("structure" in merged)) {
    merged.structure = merged[LEGACY_CONTROL_KEY]!;
    delete merged[LEGACY_CONTROL_KEY];
  } else if (LEGACY_CONTROL_KEY in merged) {
    delete merged[LEGACY_CONTROL_KEY];
  }

  return Object.fromEntries(
    PRIMARY_AXIS_KEYS.map((key) => [key, merged[key] ?? 50]),
  ) as PrimaryAxesScores;
}

export function normalizeCurrentSelfProfile(
  profile: CurrentSelfProfile,
): CurrentSelfProfile {
  return {
    ...profile,
    primary_axes: normalizePrimaryAxes(profile.primary_axes),
  };
}
