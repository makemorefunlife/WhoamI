import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/constants/routes";
import {
  DEFAULT_LOCALE,
  isEnPrefixedPath,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  pathPrefixToLocale,
  stripEnPrefix,
  stripKrPrefix,
  type Locale,
} from "@/lib/i18n/locale";

const isAccountRoute = createRouteMatcher([
  `${ROUTES.account}(.*)`,
  `/kr${ROUTES.account}(.*)`,
]);

function applyLocaleHeaders(
  res: NextResponse,
  locale: Locale,
): NextResponse {
  res.headers.set(LOCALE_HEADER, locale);
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

/**
 * Locale URL policy:
 * - `/` and unprefixed paths → en-US
 * - `/kr` and `/kr/...` → rewrite to unprefixed + ko-KR
 * - `/en` and `/en/...` → redirect to unprefixed EN canonical
 * API paths are never rewritten under /kr.
 *
 * Next 16+ uses proxy.ts instead of middleware.ts.
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

  // Canonicalize /en → /
  if (isEnPrefixedPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = stripEnPrefix(pathname);
    return applyLocaleHeaders(
      NextResponse.redirect(url, 308),
      DEFAULT_LOCALE,
    );
  }

  const locale = pathPrefixToLocale(pathname);

  if (locale === "ko-KR") {
    const url = req.nextUrl.clone();
    url.pathname = stripKrPrefix(pathname);
    const res = NextResponse.rewrite(url);
    applyLocaleHeaders(res, "ko-KR");
    if (isAccountRoute(req)) {
      await auth.protect();
    }
    return res;
  }

  const res = NextResponse.next();
  applyLocaleHeaders(res, "en-US");
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
