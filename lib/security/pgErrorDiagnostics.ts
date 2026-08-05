/**
 * Bounded, non-sensitive diagnostic extraction for Postgres/PostgREST
 * insert errors. Never returns or logs raw error.message/details/hint —
 * only a short whitelisted category, and, if present, a constraint/column
 * identifier extracted via a strict regex (alnum/underscore only, capped
 * length), so no value data can leak even if an error message's wording
 * changes or contains embedded row values (e.g. unique-violation details).
 */

export type ReportCreateErrorCategory =
  | "missing_column"
  | "not_null_violation"
  | "check_violation"
  | "unique_violation"
  | "rls_or_permission"
  | "schema_cache"
  | "unknown_db_error";

export type ReportCreateErrorDiagnostic = {
  pgCode: string;
  category: ReportCreateErrorCategory;
  responseCode: string;
  constraint: string | null;
  column: string | null;
};

const SAFE_IDENTIFIER = /^[a-zA-Z0-9_]{1,64}$/;

const CATEGORY_TO_RESPONSE_CODE: Record<ReportCreateErrorCategory, string> = {
  missing_column: "report_create_missing_column",
  not_null_violation: "report_create_not_null_violation",
  check_violation: "report_create_check_violation",
  unique_violation: "report_create_unique_violation",
  rls_or_permission: "report_create_rls_or_permission",
  schema_cache: "report_create_schema_cache",
  unknown_db_error: "report_create_unknown_db_error",
};

function extractIdentifier(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const candidate = match?.[1];
    if (candidate && SAFE_IDENTIFIER.test(candidate)) return candidate;
  }
  return null;
}

/**
 * @param error Raw Supabase/PostgREST error object (or anything — callers
 * pass the value straight from `{ error } = await supabase....`). Only
 * `.code`, `.message`, `.details` are ever read, and only to extract a
 * bounded identifier or pick a category — the strings themselves are never
 * copied into the returned diagnostic, logged, or sent to a client.
 */
export function diagnoseReportCreateError(
  error: unknown,
): ReportCreateErrorDiagnostic {
  const err = (error && typeof error === "object" ? error : {}) as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  const pgCode = typeof err.code === "string" ? err.code.slice(0, 16) : "none";
  const message = typeof err.message === "string" ? err.message : "";
  const details = typeof err.details === "string" ? err.details : "";
  const haystack = `${message}\n${details}`;
  const haystackLower = haystack.toLowerCase();

  const constraint = extractIdentifier(haystack, [/constraint\s+"([^"]+)"/i]);
  const column = extractIdentifier(haystack, [
    /column\s+"([^"]+)"/i,
    /'([^']+)'\s+column/i, // PostgREST PGRST204 phrasing: "Could not find the 'x' column..."
  ]);

  let category: ReportCreateErrorCategory;
  if (pgCode === "42703") category = "missing_column";
  else if (pgCode === "PGRST204") category = "schema_cache";
  else if (pgCode === "23502") category = "not_null_violation";
  else if (pgCode === "23514") category = "check_violation";
  else if (pgCode === "23505") category = "unique_violation";
  else if (pgCode === "42501") category = "rls_or_permission";
  else if (haystackLower.includes("schema cache")) category = "schema_cache";
  else if (
    haystackLower.includes("row-level security") ||
    haystackLower.includes("permission denied")
  )
    category = "rls_or_permission";
  else category = "unknown_db_error";

  return {
    pgCode,
    category,
    responseCode: CATEGORY_TO_RESPONSE_CODE[category],
    constraint,
    column,
  };
}
