/**
 * ⚠️ READ BEFORE TOUCHING ANYTHING UNDER lib/relationship/romantic/prototypeV4/ ⚠️
 *
 * Despite the folder name, prototypeV4 is CURRENT PRODUCTION Romantic
 * analysis code, not a prototype or an abandoned experiment. It is imported
 * directly by app/api/relationship/analyze/premium/route.ts and runs on
 * every romantic premium report generated today, because the flag below
 * defaults to ON in every environment including production.
 *
 * "prototypeV4"/"content-prototype" are historical names left over from
 * this feature's design-review phase (pre 2026-08-07) — they describe how
 * the code was named when it was built, not its current status. Do NOT
 * treat this directory as legacy, dead, or safe to delete/archive in a
 * future cleanup pass just because of its name. A future rename is fine;
 * a future deletion based on the name alone is not.
 *
 * Romantic V4 report review flag.
 *
 * Default: ON everywhere, including production — the review gate has been
 * lifted (2026-08-07, user decision) so this ships to real users without
 * requiring a per-environment env var. Set ROMANTIC_V4_REPORT to an explicit
 * falsy value (0 / false / no / off) in a specific environment to opt that
 * environment back out, e.g. to disable temporarily on one Vercel preview
 * without touching the default.
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

/** True for 0 / false / no / off (case-insensitive) — explicit opt-out only. */
function isEnvFlagExplicitlyFalse(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "0" ||
    normalized === "false" ||
    normalized === "no" ||
    normalized === "off"
  );
}

export function isRomanticV4ReportEnabled(env: EnvLike = process.env): boolean {
  return !isEnvFlagExplicitlyFalse(readEnv(env, "ROMANTIC_V4_REPORT"));
}
