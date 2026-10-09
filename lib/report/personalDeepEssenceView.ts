import type { SlimV1ReportResult } from "@/lib/v1/slim/types";
import { isDeepEssenceStructuredReport } from "@/lib/report/deepEssenceStructuredSchema";

/**
 * Personal deep report -- what the reader sees for ONE language, decided from
 * the saved rows only (no generation, no credit). Pure, so the rules are
 * unit-testable (tests/unit/personal-locale-view.test.ts).
 *
 * Storage (supabase/migrations/20261009120000):
 *   - per-language row: deep_essence_structured_ko / _en  (written from now on)
 *   - legacy row:       deep_essence_structured            (never written again)
 *
 * Rules (IA v2 D-1):
 *   1. The row for the requested language wins.
 *   2. A legacy row whose recorded language equals the request is that
 *      language's report.
 *   3. A legacy row with NO recorded language is shown as the "previous
 *      report" (language not confirmed). It is never regenerated or replaced
 *      automatically; generating for this language creates a new row and the
 *      legacy one stays.
 *   4. A legacy row in the other language is not this language's report.
 *   5. Nothing usable -> not_generated (the page offers the explicit
 *      "generate" button; opening the page never generates or charges).
 */

export type ParsedDeepEssence =
  | {
      ok: true;
      slim_v1: SlimV1ReportResult;
      /** Recorded language, or null when the row never recorded one. */
      locale: "ko-KR" | "en-US" | null;
      structuredDropped: boolean;
    }
  | { ok: false; reason: "none" | "invalid_json" | "no_report" | "placeholder_fallback" };

export function parseStoredDeepEssence(stored: string | null | undefined): ParsedDeepEssence {
  if (!stored) return { ok: false, reason: "none" };
  let parsed: { locale?: unknown; slim_v1?: SlimV1ReportResult | null };
  try {
    parsed = JSON.parse(stored);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  const slim = parsed?.slim_v1;
  if (!slim || typeof slim.report !== "string" || !slim.report.trim()) {
    return { ok: false, reason: "no_report" };
  }
  if (slim.llm_source === "fallback") return { ok: false, reason: "placeholder_fallback" };
  const locale = parsed.locale === "ko-KR" || parsed.locale === "en-US" ? parsed.locale : null;
  const structured = slim.structured;
  if (structured == null || isDeepEssenceStructuredReport(structured)) {
    return { ok: true, slim_v1: slim, locale, structuredDropped: false };
  }
  return { ok: true, slim_v1: { ...slim, structured: null }, locale, structuredDropped: true };
}

export type PersonalDeepView =
  | {
      state: "ready";
      slim_v1: SlimV1ReportResult;
      /** "locale" = per-language row; "legacy" = old single row recorded in this language. */
      source: "locale" | "legacy";
      otherLocales: Array<"ko-KR" | "en-US">;
    }
  | {
      state: "legacy_unknown";
      slim_v1: SlimV1ReportResult;
      otherLocales: Array<"ko-KR" | "en-US">;
    }
  | {
      state: "not_generated";
      otherLocales: Array<"ko-KR" | "en-US">;
    };

export function decidePersonalDeepView(input: {
  locale: "ko-KR" | "en-US";
  /** Content of the per-language rows, keyed by language. */
  localeRows: Partial<Record<"ko-KR" | "en-US", string | null>>;
  legacyRow: string | null;
}): PersonalDeepView {
  const { locale } = input;
  const other: "ko-KR" | "en-US" = locale === "ko-KR" ? "en-US" : "ko-KR";
  const own = parseStoredDeepEssence(input.localeRows[locale] ?? null);
  const otherRow = parseStoredDeepEssence(input.localeRows[other] ?? null);
  const legacy = parseStoredDeepEssence(input.legacyRow);

  const otherLocales: Array<"ko-KR" | "en-US"> = [];
  if (otherRow.ok || (legacy.ok && legacy.locale === other)) otherLocales.push(other);

  if (own.ok) return { state: "ready", slim_v1: own.slim_v1, source: "locale", otherLocales };
  if (legacy.ok && legacy.locale === locale) {
    return { state: "ready", slim_v1: legacy.slim_v1, source: "legacy", otherLocales };
  }
  if (legacy.ok && legacy.locale === null) {
    return { state: "legacy_unknown", slim_v1: legacy.slim_v1, otherLocales };
  }
  return { state: "not_generated", otherLocales };
}

/**
 * POST decision: does this request need a new generation (and a credit)?
 *   - ready + no explicit regenerate  -> return the saved report, charge 0
 *     (covers re-open, refresh, double click after the first one finished).
 *   - regenerate requires an existing report for THIS language (a confirmed
 *     user action); the previous copy is archived by save_personal_deep_analysis.
 *   - legacy_unknown / not_generated -> generate a new per-language row.
 */
export function decidePersonalDeepPost(
  view: PersonalDeepView,
  opts: { regenerate: boolean },
): { generate: false; slim_v1: SlimV1ReportResult } | { generate: true; reason: "first_generation" | "user_regenerate" } {
  if (view.state === "ready" && !opts.regenerate) return { generate: false, slim_v1: view.slim_v1 };
  if (view.state === "ready") return { generate: true, reason: "user_regenerate" };
  return { generate: true, reason: "first_generation" };
}
