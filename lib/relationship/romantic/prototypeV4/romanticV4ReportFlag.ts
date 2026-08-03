/**
 * Romantic V4 report review flag.
 *
 * Default: OFF everywhere, including production. When off, the v4 dev
 * prototype route stays gated to NODE_ENV==="development" exactly as before.
 * Enable in a deployed environment (e.g. Vercel Preview/Production env vars)
 * to review the fixture-driven v4 UI at its existing dev URL without opening
 * it up to real users or touching the production analyze pipeline.
 *
 * Client components must use NEXT_PUBLIC_* so the browser bundle sees it.
 */

type EnvLike = Record<string, string | undefined>;

function readEnv(env: EnvLike, key: string): string | undefined {
  const value = env[key];
  return typeof value === "string" ? value : undefined;
}

/** True for 1 / true / yes / on (case-insensitive). */
function isEnvFlagTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

export function isRomanticV4ReportEnabled(env: EnvLike = process.env): boolean {
  return (
    isEnvFlagTruthy(readEnv(env, "ROMANTIC_V4_REPORT")) ||
    isEnvFlagTruthy(readEnv(env, "NEXT_PUBLIC_ROMANTIC_V4_REPORT")) ||
    isEnvFlagTruthy(process.env.NEXT_PUBLIC_ROMANTIC_V4_REPORT)
  );
}
