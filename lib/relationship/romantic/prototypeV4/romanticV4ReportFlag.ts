/**
 * Romantic V4 report review flag.
 *
 * Default: OFF everywhere, including production. When off, the v4 dev
 * prototype route stays gated to NODE_ENV==="development" exactly as before.
 * Enable in a deployed environment (e.g. Vercel Preview/Production env vars)
 * to review the fixture-driven v4 UI at its existing dev URL without opening
 * it up to real users or touching the production analyze pipeline.
 *
 * Server-only by design: consumers are page.tsx (async Server Component)
 * and app/api/relationship/analyze/premium/route.ts (the production analyze
 * route), so this deliberately does NOT read a NEXT_PUBLIC_* variant.
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time regardless of
 * server/client context, so a NEXT_PUBLIC_ flag here would silently require
 * a rebuild to take effect and could look "stuck" if toggled post-deploy.
 * ROMANTIC_V4_REPORT (plain) is read live at request time — no rebuild needed.
 * The client never reads this flag directly: the detail route includes
 * `romantic_deep_report_v4` in its response only when the flag is on and a
 * persisted V4 block exists, and the client renders V4 iff that field is
 * present — response-presence is the single source of truth (see
 * productionAdapter/romanticV4Persistence.ts).
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
  return isEnvFlagTruthy(readEnv(env, "ROMANTIC_V4_REPORT"));
}
