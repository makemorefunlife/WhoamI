/**
 * Romantic V4 Final Narrative Architecture (Narrative Editor + Expert Saju
 * Discovery, 2 LLM calls/report) production flag.
 *
 * Default: OFF everywhere, including production. Unlike
 * romanticV4ReportFlag.ts's deterministic V4 report (reviewed and shipped
 * 2026-08-07), this gates real LLM-rewritten prose reaching real users —
 * an explicit opt-in until Human QA signs off, not an opt-out default. Set
 * ROMANTIC_V4_NARRATIVE_LLM to an explicit truthy value (1 / true / yes / on)
 * to enable in a specific environment.
 *
 * Server-only by design, same reasoning as romanticV4ReportFlag.ts: read
 * live at request time in app/api/relationship/analyze/premium/route.ts,
 * no NEXT_PUBLIC_* variant, no client-side read.
 */

type EnvLike = Record<string, string | undefined>;

function readEnv(env: EnvLike, key: string): string | undefined {
  const value = env[key];
  return typeof value === "string" ? value : undefined;
}

/** True for 1 / true / yes / on (case-insensitive) — explicit opt-in only. */
function isEnvFlagExplicitlyTrue(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

export function isRomanticV4NarrativeLlmEnabled(env: EnvLike = process.env): boolean {
  return isEnvFlagExplicitlyTrue(readEnv(env, "ROMANTIC_V4_NARRATIVE_LLM"));
}
