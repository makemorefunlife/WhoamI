import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/constants/routes";
import {
  DEFAULT_LOCALE,
  isEnPrefixedPath,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  pathPrefixToLocale,
  prefersKoreanFromAcceptLanguage,
  stripEnPrefix,
  stripKrPrefix,
  type Locale,
} from "@/lib/i18n/locale";

const isAccountRoute = createRouteMatcher([
  `${ROUTES.account}(.*)`,
  `/kr${ROUTES.account}(.*)`,
]);

/**
 * Forwards the resolved locale to the SSR render for THIS request (via the
 * request-header form of NextResponse.rewrite/next — see
 * node_modules/next/dist/docs/.../file-conventions/proxy.md "Setting
 * Headers") and persists it for the next request via a cookie. The old
 * implementation only did `res.headers.set(...)`, which exposes a header to
 * the CLIENT but never reaches this same request's own Server Component
 * render — so getRequestLocale() fell back to the cookie, and on a fresh,
 * cookie-less request (exactly what a chat-app link-preview crawler sends
 * on its first and only hit to e.g. /kr/invite) it fell all the way back to
 * DEFAULT_LOCALE (en-US), silently serving English metadata for a Korean
 * URL. This must build the request headers BEFORE constructing the
 * rewrite/next response, since NextResponse.rewrite(url) with no init has
 * no way to retrofit forwarded request headers afterward.
 */
function withLocaleRequestHeaders(req: NextRequest, locale: Locale): Headers {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  return requestHeaders;
}

function applyLocaleCookie(res: NextResponse, locale: Locale): NextResponse {
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

/**
 * Locale URL policy:
 * - `/` and unprefixed paths → en-US (unless ko-browser auto-redirect below fires)
 * - `/kr` and `/kr/...` → rewrite to unprefixed + ko-KR
 * - `/en` and `/en/...` → redirect to unprefixed EN canonical
 * API paths are never rewritten under /kr.
 *
 * Next 16+ uses proxy.ts instead of middleware.ts.
 *
 * KO-BROWSER AUTO-REDIRECT (temporary, one-directional):
 * The global (en-US) site has no PG integration yet, so a Korean-language
 * browser landing on the unprefixed domain can't pay. Until the global PG
 * integration ships and the header's language toggle (components/layout/
 * stitch/LanguageSwitcher.tsx, currently commented out in StitchFixedHeader)
 * is turned back on, visitors whose browser's top Accept-Language is Korean
 * are auto-redirected from unprefixed paths to the matching `/kr` path. This
 * is intentionally one-way (no en-browser → `/` redirect) -- when the toggle
 * comes back, wire up the mutual redirect here instead of just removing this.
 */
export const proxy = clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Redirect /kr/api/... or /en/api/... requests to canonical /api/...
  if (pathname.startsWith("/kr/api/") || pathname.startsWith("/en/api/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/(kr|en)\/api\//, "/api/");
    return NextResponse.redirect(url, 308);
  }

  // Never locale-rewrite API / static internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/trpc")
  ) {
    if (isAccountRoute(req)) {
      await auth.protect();
    }
    return;
  }

  // Canonicalize /en → /. This is a 308 redirect, not a render — the
  // browser makes a fresh request to the unprefixed URL, which then hits
  // the default en-US branch below and gets its request header forwarded
  // there instead. Only the cookie (for the *next* request) is useful here.
  if (isEnPrefixedPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = stripEnPrefix(pathname);
    return applyLocaleCookie(NextResponse.redirect(url, 308), DEFAULT_LOCALE);
  }

  const locale = pathPrefixToLocale(pathname);

  if (locale === "en-US" && prefersKoreanFromAcceptLanguage(req.headers.get("accept-language"))) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/kr" : `/kr${pathname}`;
    return applyLocaleCookie(NextResponse.redirect(url, 307), "ko-KR");
  }

  if (locale === "ko-KR") {
    const url = req.nextUrl.clone();
    url.pathname = stripKrPrefix(pathname);
    const res = NextResponse.rewrite(url, {
      request: { headers: withLocaleRequestHeaders(req, "ko-KR") },
    });
    applyLocaleCookie(res, "ko-KR");
    if (isAccountRoute(req)) {
      await auth.protect();
    }
    return res;
  }

  const res = NextResponse.next({
    request: { headers: withLocaleRequestHeaders(req, "en-US") },
  });
  applyLocaleCookie(res, "en-US");
  if (isAccountRoute(req)) {
    await auth.protect();
  }
  return res;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
