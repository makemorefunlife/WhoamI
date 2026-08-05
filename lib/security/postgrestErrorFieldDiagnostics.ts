/**
 * Deeper, still-bounded diagnostics for a single PostgREST-shaped error
 * object ({ message, details, hint, code }), added after a production
 * error showed keys=message,details,hint,code but extractSafeErrorShape's
 * `code` came through as "none" — meaning the own `code` property exists
 * but its VALUE didn't pass the general-purpose safe-token filter (e.g. it
 * may be an empty string, null, or some other non-identifier shape). This
 * explains *why* without ever logging error.message/.details/.hint
 * content — only their typeof/length and matches against a fixed,
 * pre-declared set of bounded substring categories.
 */

const SAFE_PG_CODE = /^(?:[0-9]{5}|PGRST[0-9]{3})$/;

const MESSAGE_CATEGORIES = [
  "duplicate",
  "null",
  "constraint",
  "column",
  "schema cache",
  "permission",
  "row-level security",
] as const;

export type PostgrestErrorFieldDiagnostic = {
  codeTypeof: string;
  codeIsNull: boolean;
  codeIsUndefined: boolean;
  codeStringLength: number;
  codeSafe: string | null;
  messageTypeof: string;
  messageStringLength: number;
  messageCategories: string[];
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/**
 * @param error Any unknown value observed as a caught/returned error.
 * `.code` and `.message` are only ever read to compute typeof/length/a
 * fixed-category match — the strings themselves are never copied into the
 * returned diagnostic, logged, or sent to a client.
 */
export function diagnosePostgrestErrorFields(
  error: unknown,
): PostgrestErrorFieldDiagnostic {
  const obj = asRecord(error);
  const code = obj ? obj.code : undefined;
  const message = obj ? obj.message : undefined;

  const codeSafe =
    typeof code === "string" && SAFE_PG_CODE.test(code) ? code : null;

  const messageCategories =
    typeof message === "string"
      ? MESSAGE_CATEGORIES.filter((cat) => message.toLowerCase().includes(cat))
      : [];

  return {
    codeTypeof: typeof code,
    codeIsNull: code === null,
    codeIsUndefined: code === undefined,
    codeStringLength: String(code).length,
    codeSafe,
    messageTypeof: typeof message,
    messageStringLength: String(message).length,
    messageCategories,
  };
}

/** One bounded log line for a PostgrestErrorFieldDiagnostic — stable field order. */
export function formatPostgrestErrorFieldDiagnostic(
  d: PostgrestErrorFieldDiagnostic,
): string[] {
  return [
    `codeTypeof=${d.codeTypeof}`,
    `codeIsNull=${d.codeIsNull}`,
    `codeIsUndefined=${d.codeIsUndefined}`,
    `codeStringLength=${d.codeStringLength}`,
    `codeSafe=${d.codeSafe ?? "none"}`,
    `messageTypeof=${d.messageTypeof}`,
    `messageStringLength=${d.messageStringLength}`,
    `messageCategories=${
      d.messageCategories.length ? d.messageCategories.join(",") : "none"
    }`,
  ];
}
