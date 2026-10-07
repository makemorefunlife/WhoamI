import type { SlimV1ReportResult } from "@/lib/v1/slim/types";
import { isDeepEssenceStructuredReport } from "@/lib/report/deepEssenceStructuredSchema";

/**
 * Read-before-generate decision for the Personal Deep Report
 * (app/api/v2/deep/essence/route.ts).
 *
 * PRODUCT RULE: a report the user already generated (and paid a credit for) is
 * theirs. Internal generation versions (PERSONAL_V2_STRUCTURED_GENERATION_VERSION)
 * and client cache versions exist only so NEW generations use the newest
 * pipeline -- they must never decide whether the user keeps access to a saved
 * report. So this decision deliberately does NOT look at
 * `personal_v2_generation_version`, and a structured payload that no longer
 * satisfies the current schema is served as the saved prose report instead of
 * being regenerated (a regeneration costs a credit).
 *
 * A saved row is only skipped when it is not a completed report at all:
 *   - unparseable / no report text,
 *   - a placeholder fallback (no LLM output; never a delivered report),
 *   - a different locale (report_analyses stores one row per report; unchanged
 *     behavior -- see the route comment).
 * Regeneration of a newer version is a separate, explicit user action
 * (`forceRegenerate`), handled before this function is called.
 */
export type StoredDeepEssenceDecision =
  | {
      reuse: true;
      slim_v1: SlimV1ReportResult;
      /** True when the saved structured payload failed the current schema and was dropped (prose is served). */
      structuredDropped: boolean;
    }
  | {
      reuse: false;
      reason: "none" | "invalid_json" | "no_report" | "placeholder_fallback" | "locale_mismatch";
    };

export function decideStoredDeepEssenceReuse(
  stored: string | null | undefined,
  locale: string,
): StoredDeepEssenceDecision {
  if (!stored) return { reuse: false, reason: "none" };

  let parsed: { locale?: unknown; slim_v1?: SlimV1ReportResult | null };
  try {
    parsed = JSON.parse(stored);
  } catch {
    return { reuse: false, reason: "invalid_json" };
  }

  const slim = parsed?.slim_v1;
  if (!slim || typeof slim.report !== "string" || !slim.report.trim()) {
    return { reuse: false, reason: "no_report" };
  }
  if (slim.llm_source === "fallback") {
    return { reuse: false, reason: "placeholder_fallback" };
  }
  if (parsed.locale !== locale) {
    return { reuse: false, reason: "locale_mismatch" };
  }

  const structured = slim.structured;
  if (structured == null || isDeepEssenceStructuredReport(structured)) {
    return { reuse: true, slim_v1: slim, structuredDropped: false };
  }
  return { reuse: true, slim_v1: { ...slim, structured: null }, structuredDropped: true };
}
