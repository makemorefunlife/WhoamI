/** Safe logging helpers — never log PII, tokens, secrets, or full IDs. */

const SECRET_KEY =
  /Authorization|cookie|api[_-]?key|token|secret|prompt|password|Bearer/i;

export function maskId(id: string | null | undefined): string {
  const s = typeof id === "string" ? id.trim() : "";
  if (!s) return "(none)";
  if (s.length <= 8) return `${s.slice(0, 2)}…`;
  return `${s.slice(0, 4)}…${s.slice(-2)}`;
}

export function redactLogValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 80) return `[string:${value.length}]`;
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 3).map(redactLogValue);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY.test(k)) {
      out[k] = "[redacted]";
      continue;
    }
    if (
      /name|birth|coord|lat|lng|answer|survey|result|analysis|prompt|body|header/i.test(
        k,
      )
    ) {
      out[k] = "[redacted]";
      continue;
    }
    if (
      /report_?id|invite|user_?id|clerk|relationship/i.test(k) &&
      typeof v === "string"
    ) {
      out[k] = maskId(v);
      continue;
    }
    // Never echo raw exception messages into structured logs
    if (k === "message" || k === "details" || k === "hint" || k === "stack") {
      out[k] = "[redacted]";
      continue;
    }
    out[k] = redactLogValue(v);
  }
  return out;
}

/**
 * Server log — context + internal error code only.
 * Never logs error.message, Supabase objects, stacks, or IDs.
 */
export function logServerError(
  context: string,
  _err?: unknown,
  code = "internal_error",
): void {
  const safeCode =
    typeof code === "string" && code.trim()
      ? code.trim().slice(0, 64)
      : "internal_error";
  console.error(`[${context}]`, safeCode);
}

/** Non-error operational log with optional masked meta. */
export function logServerEvent(
  context: string,
  code: string,
  meta?: Record<string, unknown>,
): void {
  if (meta) {
    console.info(`[${context}]`, code, redactLogValue(meta));
  } else {
    console.info(`[${context}]`, code);
  }
}

export function clientSafeErrorMessage(
  _err: unknown,
  fallback = "request failed",
): string {
  return fallback;
}

/** Generic JSON error for API routes — never leak internals. */
export function jsonSafeError(
  status: number,
  fallback: string,
): Response {
  return Response.json({ error: fallback }, { status });
}
