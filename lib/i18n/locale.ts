/**
 * Locale SSOT — product URLs: `/` = en-US, `/kr` = ko-KR (no `/en` prefix).
 */

export const LOCALES = ["en-US", "ko-KR"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en-US";
export const KO_PATH_PREFIX = "/kr";

export const LOCALE_COOKIE = "aha_locale";
export const LOCALE_HEADER = "x-aha-locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en-US" || value === "ko-KR";
}

/**
 * Normalize arbitrary locale / path / short-code input to Locale.
 * Unknown values fall back to en-US.
 */
export function normalizeLocale(input: unknown): Locale {
  if (input == null) return DEFAULT_LOCALE;

  if (typeof input !== "string") return DEFAULT_LOCALE;
  const raw = input.trim();
  if (!raw) return DEFAULT_LOCALE;

  const lower = raw.toLowerCase().replace(/_/g, "-");

  if (lower === "en-us" || lower === "en" || lower === "/") return "en-US";
  if (
    lower === "ko-kr" ||
    lower === "ko" ||
    lower === "kr" ||
    lower === "/kr" ||
    lower.startsWith("/kr/")
  ) {
    return "ko-KR";
  }

  if (lower.startsWith("en")) return "en-US";
  if (lower.startsWith("ko")) return "ko-KR";

  return DEFAULT_LOCALE;
}

/** HTML lang attribute */
export function localeToHtmlLang(locale: Locale): "en" | "ko" {
  return locale === "ko-KR" ? "ko" : "en";
}

/** Path prefix for links (`""` for EN, `"/kr"` for KO) */
export function localeToPathPrefix(locale: Locale): "" | typeof KO_PATH_PREFIX {
  return locale === "ko-KR" ? KO_PATH_PREFIX : "";
}

/**
 * Infer locale from a pathname.
 * `/kr` and `/kr/...` → ko-KR; everything else (including `/en` remnants) → caller should redirect /en.
 */
export function pathPrefixToLocale(pathname: string): Locale {
  const path = pathname.trim() || "/";
  if (path === "/kr" || path.startsWith("/kr/")) return "ko-KR";
  return "en-US";
}

/** True when pathname is `/en` or `/en/...` (canonicalize away). */
export function isEnPrefixedPath(pathname: string): boolean {
  const path = pathname.trim() || "/";
  return path === "/en" || path.startsWith("/en/");
}

/** Strip `/en` prefix → canonical EN path. */
export function stripEnPrefix(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) {
    const rest = pathname.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname;
}

/** Strip `/kr` prefix for internal rewrite. */
export function stripKrPrefix(pathname: string): string {
  if (pathname === "/kr") return "/";
  if (pathname.startsWith("/kr/")) {
    const rest = pathname.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname;
}

/**
 * Build a locale-aware href from an app-absolute path (must start with `/`, not already localized).
 * Preserves query/hash on `href` if present as a full path string.
 */
export function localizedPath(href: string, locale: Locale): string {
  if (!href || href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  if (href.startsWith("#")) return href;

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  const qIndex = withoutHash.indexOf("?");
  const query = qIndex >= 0 ? withoutHash.slice(qIndex) : "";
  let path = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;

  if (!path.startsWith("/")) path = `/${path}`;

  // Normalize if caller already included /kr or /en
  if (path === "/kr" || path.startsWith("/kr/")) {
    path = stripKrPrefix(path);
  }
  if (path === "/en" || path.startsWith("/en/")) {
    path = stripEnPrefix(path);
  }

  // API and Next internals never get locale prefix
  if (
    path.startsWith("/api/") ||
    path === "/api" ||
    path.startsWith("/_next/")
  ) {
    return `${path}${query}${hash}`;
  }

  const prefix = localeToPathPrefix(locale);
  if (!prefix) return `${path}${query}${hash}`;
  if (path === "/") return `${prefix}${query}${hash}`;
  return `${prefix}${path}${query}${hash}`;
}

/** Short code for LLM / meta (`en` | `ko`) — prefer full Locale at boundaries. */
export function localeToShort(locale: Locale): "en" | "ko" {
  return locale === "ko-KR" ? "ko" : "en";
}

/**
 * Browser pathname may include `/kr` (rewrite keeps URL). Strip for matching app routes.
 */
export function pathnameWithoutLocalePrefix(pathname: string): string {
  if (pathname === "/kr" || pathname.startsWith("/kr/")) {
    return stripKrPrefix(pathname);
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return stripEnPrefix(pathname);
  }
  return pathname || "/";
}
