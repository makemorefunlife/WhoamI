/**
 * Romantic Experience V2 feature flag (Batch B0).
 *
 * Default: legacy `RomanticSajuDeepReportView`.
 * Enable stub/composition: ROMANTIC_EXPERIENCE_V2=1 (or NEXT_PUBLIC_*).
 * Force legacy rollback: ROMANTIC_EXPERIENCE_LEGACY=1 (or NEXT_PUBLIC_*) — wins over V2.
 *
 * Client components must use NEXT_PUBLIC_* variants so the browser bundle sees them.
 * Server/tests may use either prefix.
 */

export type RomanticPremiumRenderMode = "legacy" | "experience";

type EnvLike = Record<string, string | undefined>;

function readEnv(env: EnvLike, key: string): string | undefined {
  const value = env[key];
  return typeof value === "string" ? value : undefined;
}

/** True for 1 / true / yes / on (case-insensitive). */
export function isEnvFlagTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

function flagFromEnv(env: EnvLike, bareKey: string): boolean {
  return (
    isEnvFlagTruthy(readEnv(env, bareKey)) ||
    isEnvFlagTruthy(readEnv(env, `NEXT_PUBLIC_${bareKey}`))
  );
}

/** Explicit rollback: always prefer legacy Romantic UI when set. */
export function isRomanticExperienceLegacyForced(
  env: EnvLike = process.env,
): boolean {
  return flagFromEnv(env, "ROMANTIC_EXPERIENCE_LEGACY");
}

/**
 * Whether Romantic Experience V2 may render.
 * LEGACY forced → false. Otherwise V2 flag. Default false.
 */
export function isRomanticExperienceV2Enabled(
  env: EnvLike = process.env,
): boolean {
  if (isRomanticExperienceLegacyForced(env)) return false;
  return flagFromEnv(env, "ROMANTIC_EXPERIENCE_V2");
}

/**
 * Romantic-only gate. Non-romantic kinds never enter the experience path,
 * even if V2 env is enabled.
 */
export function resolveRomanticPremiumRenderMode(
  premiumKind: string,
  env: EnvLike = process.env,
): RomanticPremiumRenderMode {
  if (premiumKind !== "romantic") return "legacy";
  return isRomanticExperienceV2Enabled(env) ? "experience" : "legacy";
}

export function shouldRenderRomanticExperienceV2(
  premiumKind: string,
  env: EnvLike = process.env,
): boolean {
  return resolveRomanticPremiumRenderMode(premiumKind, env) === "experience";
}
