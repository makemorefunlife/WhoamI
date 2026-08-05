/**
 * Read-only Supabase connection probe. Runs one harmless head-count query
 * (no rows returned) against `reports` to prove the configured URL+key
 * pair can actually authenticate and query Production, independent of the
 * report/create insert path. Never logs rows, IDs, or secrets — only the
 * same bounded diagnostics used elsewhere (pg code/category, structural
 * error-field facts) on failure, and a bounded row count on success.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  diagnoseReportCreateError,
  type ReportCreateErrorDiagnostic,
} from "@/lib/security/pgErrorDiagnostics";
import {
  diagnosePostgrestErrorFields,
  type PostgrestErrorFieldDiagnostic,
} from "@/lib/security/postgrestErrorFieldDiagnostics";

export type SupabaseConnectionProbeResult =
  | { ok: true; count: number | null }
  | {
      ok: false;
      diagnostic: ReportCreateErrorDiagnostic;
      fields: PostgrestErrorFieldDiagnostic;
    };

export async function probeSupabaseConnection(
  supabase: SupabaseClient,
): Promise<SupabaseConnectionProbeResult> {
  const { error, count } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true });

  if (error) {
    return {
      ok: false,
      diagnostic: diagnoseReportCreateError(error),
      fields: diagnosePostgrestErrorFields(error),
    };
  }

  return { ok: true, count: count ?? null };
}

/** One bounded log line for a SupabaseConnectionProbeResult — stable field order. */
export function formatSupabaseConnectionProbeResult(
  result: SupabaseConnectionProbeResult,
): string[] {
  if (result.ok) {
    return ["ok=true", `count=${result.count ?? "none"}`];
  }
  return [
    "ok=false",
    `code=${result.diagnostic.responseCode}`,
    `pg=${result.diagnostic.pgCode}`,
    `category=${result.diagnostic.category}`,
    `codeTypeof=${result.fields.codeTypeof}`,
    `codeStringLength=${result.fields.codeStringLength}`,
    `messageTypeof=${result.fields.messageTypeof}`,
    `messageStringLength=${result.fields.messageStringLength}`,
    `messageCategories=${
      result.fields.messageCategories.length
        ? result.fields.messageCategories.join(",")
        : "none"
    }`,
  ];
}
