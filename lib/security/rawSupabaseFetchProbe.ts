/**
 * Raw fetch()-level Supabase REST probe, bypassing supabase-js entirely.
 * Added because the supabase-js connection probe fails with the same
 * empty-code fallback shape as the report/create incident even with a
 * proven-correct URL/key pair — supabase-js's error wrapper discards the
 * underlying fetch error's `.cause` (DNS/TCP/TLS/timeout details), so a
 * direct fetch is the only way to recover that structural information.
 * Never logs the URL, key, headers, response body, or any row/personal
 * data — only bounded structural facts about how the request failed (or
 * succeeded).
 */
import type { SupabaseConnectionProbeResult } from "@/lib/security/supabaseConnectionProbe";
import {
  detectSupabaseKeyFormat,
  type SupabaseKeyFormat,
} from "@/lib/security/supabaseEnvAudit";
import {
  diagnoseHttpJsonBody,
  type HttpJsonBodyDiagnostic,
} from "@/lib/security/supabaseHttpBodyDiagnostics";

export type RawFetchProbeResult = {
  fetchStarted: boolean;
  fetchCompleted: boolean;
  httpStatus: number | null;
  responseContentType: string | null;
  responseBodyLength: number | null;
  bodyDiagnostic: HttpJsonBodyDiagnostic | null;
  keyFormat: SupabaseKeyFormat;
  sentAuthorizationHeader: boolean;
  errorName: string | null;
  errorCauseName: string | null;
  errorCauseCode: string | null;
  errorCauseErrno: string | null;
  timeout: boolean;
};

const SAFE_TOKEN = /^[a-zA-Z0-9_.:-]{1,64}$/;
const SAFE_MIME = /^[a-zA-Z0-9/;=. _-]{1,128}$/;

function safeScalar(v: unknown): string | null {
  if (typeof v === "string" && SAFE_TOKEN.test(v)) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function safeMime(v: unknown): string | null {
  return typeof v === "string" && SAFE_MIME.test(v) ? v : null;
}

/**
 * @param supabaseUrl NEXT_PUBLIC_SUPABASE_URL. Never logged or returned.
 * @param serviceRoleKey SUPABASE_SERVICE_ROLE_KEY. Never logged or
 * returned — used only in request headers.
 */
export async function probeRawSupabaseFetch(
  supabaseUrl: string,
  serviceRoleKey: string,
  timeoutMs = 8000,
): Promise<RawFetchProbeResult> {
  const endpoint = `${supabaseUrl}/rest/v1/reports?select=id&limit=0`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // The newer sb_secret_-prefixed key format is not a JWT and must only be
  // sent via `apikey` — sending it as `Authorization: Bearer` as well can
  // itself cause the gateway to reject the request. The legacy service-role
  // JWT format accepts both headers.
  const keyFormat = detectSupabaseKeyFormat(serviceRoleKey);
  const sentAuthorizationHeader = keyFormat !== "sb_secret";
  const headers: Record<string, string> = { apikey: serviceRoleKey };
  if (sentAuthorizationHeader) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }

  const result: RawFetchProbeResult = {
    fetchStarted: false,
    fetchCompleted: false,
    httpStatus: null,
    responseContentType: null,
    responseBodyLength: null,
    bodyDiagnostic: null,
    keyFormat,
    sentAuthorizationHeader,
    errorName: null,
    errorCauseName: null,
    errorCauseCode: null,
    errorCauseErrno: null,
    timeout: false,
  };

  try {
    result.fetchStarted = true;
    const res = await fetch(endpoint, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    result.fetchCompleted = true;
    result.httpStatus = res.status;
    result.responseContentType = safeMime(res.headers.get("content-type"));
    const text = await res.text();
    result.responseBodyLength = text.length;
    result.bodyDiagnostic = diagnoseHttpJsonBody(
      res.status,
      result.responseContentType,
      text,
    );
  } catch (err) {
    if (controller.signal.aborted) result.timeout = true;
    const e = err as { name?: unknown; cause?: unknown } | undefined;
    result.errorName = safeScalar(e?.name);
    const cause =
      e && typeof e === "object" && e.cause && typeof e.cause === "object"
        ? (e.cause as Record<string, unknown>)
        : null;
    if (cause) {
      result.errorCauseName = safeScalar(cause.name);
      result.errorCauseCode = safeScalar(cause.code);
      result.errorCauseErrno = safeScalar(cause.errno);
    }
  } finally {
    clearTimeout(timer);
  }

  return result;
}

/** One bounded log line for a RawFetchProbeResult — stable field order. */
export function formatRawFetchProbeResult(r: RawFetchProbeResult): string[] {
  return [
    `fetchStarted=${r.fetchStarted}`,
    `fetchCompleted=${r.fetchCompleted}`,
    `httpStatus=${r.httpStatus ?? "none"}`,
    `responseContentType=${r.responseContentType ?? "none"}`,
    `responseBodyLength=${r.responseBodyLength ?? "none"}`,
    `keyFormat=${r.keyFormat}`,
    `sentAuthorizationHeader=${r.sentAuthorizationHeader}`,
    ...(r.bodyDiagnostic
      ? [
          `bodyIsJson=${r.bodyDiagnostic.isJson}`,
          `bodyKeys=${r.bodyDiagnostic.jsonKeys.length ? r.bodyDiagnostic.jsonKeys.join(",") : "none"}`,
          `bodyCodeExact=${r.bodyDiagnostic.code.exactValue ?? "none"}`,
          `bodyCodeCategory=${r.bodyDiagnostic.code.category ?? "none"}`,
          `bodyErrorExact=${r.bodyDiagnostic.error.exactValue ?? "none"}`,
          `bodyErrorCategory=${r.bodyDiagnostic.error.category ?? "none"}`,
          `bodyMessageExact=${r.bodyDiagnostic.message.exactValue ?? "none"}`,
          `bodyMessageLength=${r.bodyDiagnostic.message.length ?? "none"}`,
          `bodyMessageCategory=${r.bodyDiagnostic.message.category ?? "none"}`,
        ]
      : []),
    `errorName=${r.errorName ?? "none"}`,
    `errorCauseName=${r.errorCauseName ?? "none"}`,
    `errorCauseCode=${r.errorCauseCode ?? "none"}`,
    `errorCauseErrno=${r.errorCauseErrno ?? "none"}`,
    `timeout=${r.timeout}`,
  ];
}

export type ConnectionVerdict =
  | "DNS_FAILURE"
  | "CONNECTION_REFUSED"
  | "TLS_FAILURE"
  | "TIMEOUT"
  | "HTTP_AUTH_REJECTION"
  | "HTTP_OTHER_FAILURE"
  | "RAW_FETCH_OK_SUPABASE_JS_FAILS"
  | "BOTH_OK";

const DNS_CODES = new Set(["ENOTFOUND", "EAI_AGAIN"]);
const CONNECTION_REFUSED_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

function looksLikeTlsFailure(r: RawFetchProbeResult): boolean {
  const code = r.errorCauseCode ?? "";
  const name = (r.errorCauseName ?? "").toLowerCase();
  return (
    code.startsWith("ERR_TLS") ||
    code === "CERT_HAS_EXPIRED" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "DEPTH_ZERO_SELF_SIGNED_CERT" ||
    name.includes("tls") ||
    name.includes("cert")
  );
}

/**
 * Classifies the combined raw-fetch + supabase-js probe evidence into one
 * of the 8 defined verdicts. Any raw-fetch failure that doesn't match a
 * known DNS/connection-refused/TLS cause code falls back to
 * HTTP_OTHER_FAILURE — the closest defined bucket for "the connection
 * itself failed for an unrecognized reason," rather than fabricating
 * confidence about which layer failed.
 */
export function classifyConnectionVerdict(
  raw: RawFetchProbeResult,
  supabaseJsOk: boolean,
): ConnectionVerdict {
  if (raw.timeout) return "TIMEOUT";

  if (!raw.fetchCompleted) {
    const code = raw.errorCauseCode ?? "";
    if (DNS_CODES.has(code)) return "DNS_FAILURE";
    if (CONNECTION_REFUSED_CODES.has(code)) return "CONNECTION_REFUSED";
    if (looksLikeTlsFailure(raw)) return "TLS_FAILURE";
    return "HTTP_OTHER_FAILURE";
  }

  if (raw.httpStatus === 401 || raw.httpStatus === 403) {
    return "HTTP_AUTH_REJECTION";
  }

  if (
    raw.httpStatus !== null &&
    raw.httpStatus >= 200 &&
    raw.httpStatus < 300
  ) {
    return supabaseJsOk ? "BOTH_OK" : "RAW_FETCH_OK_SUPABASE_JS_FAILS";
  }

  return "HTTP_OTHER_FAILURE";
}

export type ConnectionComparisonResult = {
  rawFetch: RawFetchProbeResult;
  supabaseJsProbe: SupabaseConnectionProbeResult;
  verdict: ConnectionVerdict;
};

/**
 * Runs the raw-fetch probe and compares it against an already-computed
 * supabase-js probe outcome (from probeSupabaseConnection), producing the
 * final classified verdict.
 */
export async function compareRawFetchAndSupabaseJs(
  supabaseUrl: string,
  serviceRoleKey: string,
  supabaseJsProbe: SupabaseConnectionProbeResult,
  timeoutMs?: number,
): Promise<ConnectionComparisonResult> {
  const rawFetch = await probeRawSupabaseFetch(
    supabaseUrl,
    serviceRoleKey,
    timeoutMs,
  );
  const verdict = classifyConnectionVerdict(rawFetch, supabaseJsProbe.ok);

  return { rawFetch, supabaseJsProbe, verdict };
}
