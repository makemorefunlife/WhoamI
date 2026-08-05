/**
 * Bounded diagnostic extraction for an HTTP JSON error body returned by
 * Supabase's Data API gateway (e.g. a 403 rejection that never reaches
 * PostgREST's own error format). Only `code`/`error`/`message` fields are
 * ever read, and only their EXACT value is returned when it matches a
 * pre-declared allowlist of Supabase's own standard short phrases —
 * anything else degrades to a length + bounded category, never the raw
 * text. Arbitrary/unexpected body content is never echoed.
 */

export type BodyFieldDiagnostic = {
  present: boolean;
  exactValue: string | null;
  length: number | null;
  category: string | null;
};

export type HttpJsonBodyDiagnostic = {
  httpStatus: number;
  contentType: string | null;
  isJson: boolean;
  jsonKeys: string[];
  code: BodyFieldDiagnostic;
  error: BodyFieldDiagnostic;
  message: BodyFieldDiagnostic;
};

// Supabase's own documented/observed standard short error phrases — safe
// to echo exactly because they carry no project- or user-specific data.
const SAFE_ALLOWLIST_VALUES = new Set([
  "Invalid API key",
  "JWT expired",
  "JWT invalid",
  "Project paused",
  "Project restoring",
  "Forbidden",
  "Unauthorized",
]);

const CATEGORY_PATTERNS: Array<[string, RegExp]> = [
  ["api_key", /api key/i],
  ["jwt", /\bjwt\b/i],
  ["paused", /paused/i],
  ["restoring", /restoring/i],
  ["forbidden", /forbidden/i],
  ["unauthorized", /unauthorized/i],
];

const SAFE_KEY_TOKEN = /^[a-zA-Z0-9_]{1,64}$/;
const MAX_KEYS = 20;

function categorize(value: string): string | null {
  for (const [name, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(value)) return name;
  }
  return null;
}

function diagnoseField(value: unknown): BodyFieldDiagnostic {
  if (typeof value !== "string") {
    return {
      present: value !== undefined,
      exactValue: null,
      length: null,
      category: null,
    };
  }
  const exactValue = SAFE_ALLOWLIST_VALUES.has(value) ? value : null;
  return {
    present: true,
    exactValue,
    length: value.length,
    category: exactValue ? null : categorize(value),
  };
}

/**
 * @param bodyText Raw response body text. Parsed only to extract bounded
 * facts (key names, and code/error/message fields per the rules above) —
 * the raw text itself is never stored on or returned from the result.
 */
export function diagnoseHttpJsonBody(
  httpStatus: number,
  contentType: string | null,
  bodyText: string,
): HttpJsonBodyDiagnostic {
  let parsed: unknown = null;
  let isJson = false;
  try {
    parsed = JSON.parse(bodyText);
    isJson = true;
  } catch {
    isJson = false;
  }

  const obj =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;

  const jsonKeys = obj
    ? Object.keys(obj)
        .filter((k) => SAFE_KEY_TOKEN.test(k))
        .slice(0, MAX_KEYS)
    : [];

  return {
    httpStatus,
    contentType,
    isJson,
    jsonKeys,
    code: diagnoseField(obj?.code),
    error: diagnoseField(obj?.error),
    message: diagnoseField(obj?.message),
  };
}

/** One bounded log line for a HttpJsonBodyDiagnostic — stable field order. */
export function formatHttpJsonBodyDiagnostic(
  d: HttpJsonBodyDiagnostic,
): string[] {
  const field = (name: string, f: BodyFieldDiagnostic) => [
    `${name}Present=${f.present}`,
    `${name}Exact=${f.exactValue ?? "none"}`,
    `${name}Length=${f.length ?? "none"}`,
    `${name}Category=${f.category ?? "none"}`,
  ];
  return [
    `httpStatus=${d.httpStatus}`,
    `contentType=${d.contentType ?? "none"}`,
    `isJson=${d.isJson}`,
    `jsonKeys=${d.jsonKeys.length ? d.jsonKeys.join(",") : "none"}`,
    ...field("code", d.code),
    ...field("error", d.error),
    ...field("message", d.message),
  ];
}
