/**
 * Bounded, non-sensitive audit of the Supabase server client's configured
 * URL + service-role key. Never returns or logs the raw key — only a
 * decoded JWT's non-secret claims (ref/role/iss/exp, which are not secret;
 * the key's power comes from its signature, never extracted here), and
 * structural facts (lengths, segment counts, whitespace/quote detection)
 * needed to diagnose a project-ref mismatch, an anon key used where
 * service-role is expected, a truncated/corrupted key, or embedded
 * whitespace/quote corruption from a copy-paste into an env var UI.
 */

export type SupabaseUrlAudit = {
  present: boolean;
  length: number;
  hasWhitespaceOrQuotes: boolean;
  projectRef: string | null;
  matchesExpectedRef: boolean | null;
};

export type SupabaseServiceKeyAudit = {
  present: boolean;
  length: number;
  hasWhitespaceOrQuotes: boolean;
  jwtSegmentCount: number;
  jwtDecodable: boolean;
  claimRef: string | null;
  claimRole: string | null;
  claimIss: string | null;
  claimExpiresAt: number | null;
  looksLikeServiceRole: boolean;
  looksLikeAnonKey: boolean;
};

export type SupabaseEnvAudit = {
  url: SupabaseUrlAudit;
  key: SupabaseServiceKeyAudit;
  refsMatch: boolean | null;
};

const SUPABASE_HOST_PATTERN = /^([a-z0-9]+)\.supabase\.co$/i;
const WHITESPACE_OR_QUOTE = /["'\s]/;
const SAFE_CLAIM = /^[a-zA-Z0-9_.:-]{1,64}$/;

function safeClaimString(v: unknown): string | null {
  return typeof v === "string" && SAFE_CLAIM.test(v) ? v : null;
}

function auditUrl(
  rawUrl: string | undefined,
  expectedRef?: string,
): SupabaseUrlAudit {
  const present = typeof rawUrl === "string" && rawUrl.length > 0;
  const length = typeof rawUrl === "string" ? rawUrl.length : 0;
  const hasWhitespaceOrQuotes =
    typeof rawUrl === "string" && WHITESPACE_OR_QUOTE.test(rawUrl);

  let projectRef: string | null = null;
  if (present) {
    try {
      const host = new URL(rawUrl as string).host;
      const m = host.match(SUPABASE_HOST_PATTERN);
      if (m) projectRef = m[1] as string;
    } catch {
      projectRef = null;
    }
  }

  return {
    present,
    length,
    hasWhitespaceOrQuotes,
    projectRef,
    matchesExpectedRef: expectedRef ? projectRef === expectedRef : null,
  };
}

function base64UrlDecode(segment: string): string | null {
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLength);
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function auditServiceKey(rawKey: string | undefined): SupabaseServiceKeyAudit {
  const present = typeof rawKey === "string" && rawKey.length > 0;
  const length = typeof rawKey === "string" ? rawKey.length : 0;
  const hasWhitespaceOrQuotes =
    typeof rawKey === "string" && WHITESPACE_OR_QUOTE.test(rawKey);

  const segments = present ? (rawKey as string).split(".") : [];
  const jwtSegmentCount = segments.length;

  let claimRef: string | null = null;
  let claimRole: string | null = null;
  let claimIss: string | null = null;
  let claimExpiresAt: number | null = null;
  let jwtDecodable = false;

  if (jwtSegmentCount === 3 && segments[1]) {
    const payloadRaw = base64UrlDecode(segments[1]);
    if (payloadRaw) {
      try {
        const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
        jwtDecodable = true;
        claimRef = safeClaimString(payload.ref);
        claimRole = safeClaimString(payload.role);
        claimIss = safeClaimString(payload.iss);
        claimExpiresAt =
          typeof payload.exp === "number" && Number.isFinite(payload.exp)
            ? payload.exp
            : null;
      } catch {
        jwtDecodable = false;
      }
    }
  }

  return {
    present,
    length,
    hasWhitespaceOrQuotes,
    jwtSegmentCount,
    jwtDecodable,
    claimRef,
    claimRole,
    claimIss,
    claimExpiresAt,
    looksLikeServiceRole: claimRole === "service_role",
    looksLikeAnonKey: claimRole === "anon",
  };
}

/**
 * @param rawUrl NEXT_PUBLIC_SUPABASE_URL value.
 * @param rawKey SUPABASE_SERVICE_ROLE_KEY value. Only its dot-segment
 * count and decoded payload claims (ref/role/iss/exp — none of which are
 * secret) are ever read; the signature segment is never inspected or
 * returned, and the raw key string never appears anywhere in the result.
 * @param expectedProjectRef Optional known-good project ref to compare
 * the URL's subdomain against.
 */
export function auditSupabaseEnvConfig(
  rawUrl: string | undefined,
  rawKey: string | undefined,
  expectedProjectRef?: string,
): SupabaseEnvAudit {
  const url = auditUrl(rawUrl, expectedProjectRef);
  const key = auditServiceKey(rawKey);
  const refsMatch =
    url.projectRef && key.claimRef ? url.projectRef === key.claimRef : null;
  return { url, key, refsMatch };
}

/** One bounded log line for a SupabaseEnvAudit — stable field order. */
export function formatSupabaseEnvAudit(audit: SupabaseEnvAudit): string[] {
  return [
    `urlPresent=${audit.url.present}`,
    `urlLength=${audit.url.length}`,
    `urlHasWhitespaceOrQuotes=${audit.url.hasWhitespaceOrQuotes}`,
    `urlProjectRef=${audit.url.projectRef ?? "none"}`,
    `urlMatchesExpectedRef=${audit.url.matchesExpectedRef ?? "n/a"}`,
    `keyPresent=${audit.key.present}`,
    `keyLength=${audit.key.length}`,
    `keyHasWhitespaceOrQuotes=${audit.key.hasWhitespaceOrQuotes}`,
    `keyJwtSegmentCount=${audit.key.jwtSegmentCount}`,
    `keyJwtDecodable=${audit.key.jwtDecodable}`,
    `keyClaimRef=${audit.key.claimRef ?? "none"}`,
    `keyClaimRole=${audit.key.claimRole ?? "none"}`,
    `keyClaimIss=${audit.key.claimIss ?? "none"}`,
    `keyClaimExpiresAt=${audit.key.claimExpiresAt ?? "none"}`,
    `keyLooksLikeServiceRole=${audit.key.looksLikeServiceRole}`,
    `keyLooksLikeAnonKey=${audit.key.looksLikeAnonKey}`,
    `refsMatch=${audit.refsMatch ?? "n/a"}`,
  ];
}
