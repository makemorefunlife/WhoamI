/**
 * Bounded, non-sensitive structural inspection of an unknown thrown/returned
 * error value. Used when a prior classifier (e.g. pgErrorDiagnostics) can't
 * place the error and we need to know what shape it actually has — without
 * ever touching `.message`/`.details`/`.hint`, which may embed row values,
 * URLs, or other sensitive text. Only property NAMES and short whitelisted
 * scalar values (code/status/name, capped length, alnum/underscore or plain
 * finite numbers) are ever extracted.
 */

export type SafeErrorShape = {
  typeofError: string;
  isErrorInstance: boolean;
  keys: string[];
  name: string | null;
  code: string | null;
  status: string | null;
  statusCode: string | null;
  nestedErrorCode: string | null;
  nestedCauseCode: string | null;
};

const SAFE_TOKEN = /^[a-zA-Z0-9_]{1,64}$/;
const MAX_KEYS = 20;

function safeScalar(v: unknown): string | null {
  if (typeof v === "string" && SAFE_TOKEN.test(v)) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function safeKeys(obj: object): string[] {
  return Object.keys(obj)
    .filter((k) => SAFE_TOKEN.test(k))
    .slice(0, MAX_KEYS);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/**
 * @param error Any unknown value observed as a caught/returned error. Only
 * structural facts about it are extracted — never copied into logs or
 * responses is `.message`, `.details`, `.hint`, or any other free-text field.
 */
export function extractSafeErrorShape(error: unknown): SafeErrorShape {
  const obj = asRecord(error);

  const nestedError = obj ? asRecord(obj.error) : null;
  const nestedCause = obj ? asRecord(obj.cause) : null;

  return {
    typeofError: typeof error,
    isErrorInstance: error instanceof Error,
    keys: obj ? safeKeys(obj) : [],
    name: obj ? safeScalar(obj.name) : null,
    code: obj ? safeScalar(obj.code) : null,
    status: obj ? safeScalar(obj.status) : null,
    statusCode: obj ? safeScalar(obj.statusCode) : null,
    nestedErrorCode: nestedError ? safeScalar(nestedError.code) : null,
    nestedCauseCode: nestedCause ? safeScalar(nestedCause.code) : null,
  };
}

/** One bounded log line for a SafeErrorShape — same field order every call site uses. */
export function formatSafeErrorShape(shape: SafeErrorShape): string[] {
  return [
    `typeofError=${shape.typeofError}`,
    `isErrorInstance=${shape.isErrorInstance}`,
    `keys=${shape.keys.length ? shape.keys.join(",") : "none"}`,
    `name=${shape.name ?? "none"}`,
    `code=${shape.code ?? "none"}`,
    `status=${shape.status ?? "none"}`,
    `statusCode=${shape.statusCode ?? "none"}`,
    `nestedErrorCode=${shape.nestedErrorCode ?? "none"}`,
    `nestedCauseCode=${shape.nestedCauseCode ?? "none"}`,
  ];
}
