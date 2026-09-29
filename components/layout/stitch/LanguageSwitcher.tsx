"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedPath, pathnameWithoutLocalePrefix, type Locale } from "@/lib/i18n/locale";

/**
 * Same page in the other locale, built only from the existing locale helpers
 * (`/` = en-US, `/kr` = ko-KR). Query/hash are carried over when given.
 * Exported for tests (tests/unit/language-switcher.test.ts).
 */
export function languageSwitchHref(pathname: string, target: Locale, searchAndHash = ""): string {
  return localizedPath(`${pathnameWithoutLocalePrefix(pathname || "/")}${searchAndHash}`, target);
}

const OPTIONS: { locale: Locale; label: string; lang: string }[] = [
  { locale: "en-US", label: "EN", lang: "en" },
  { locale: "ko-KR", label: "한국어", lang: "ko" },
];

/**
 * Compact `EN | 한국어` switch for the site header (desktop + mobile).
 * Uses a plain <a> (full navigation) on purpose: the active locale is resolved
 * server-side in the root layout from the URL, so a client-side transition
 * would keep the previous language's copy.
 */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const { locale } = useLocale();

  // href (SSR-safe) keeps the path; on click also carry the live ?query#hash.
  function handleClick(e: MouseEvent<HTMLAnchorElement>, target: Locale) {
    const extra = `${window.location.search}${window.location.hash}`;
    if (!extra || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.location.assign(languageSwitchHref(pathname, target, extra));
  }

  return (
    <nav
      aria-label="Language"
      className={["flex items-center text-[12px] leading-none sm:text-[13px]", className].join(" ")}
    >
      {OPTIONS.map((opt, i) => {
        const active = opt.locale === locale;
        return (
          <span key={opt.locale} className="flex items-center">
            {i > 0 ? (
              <span aria-hidden className="px-1 text-outline-variant sm:px-1.5">
                |
              </span>
            ) : null}
            {active ? (
              <span
                aria-current="true"
                lang={opt.lang}
                className="rounded-md px-0.5 py-1 font-semibold text-primary sm:px-1"
              >
                {opt.label}
              </span>
            ) : (
              <a
                href={languageSwitchHref(pathname, opt.locale)}
                onClick={(e) => handleClick(e, opt.locale)}
                hrefLang={opt.lang}
                lang={opt.lang}
                className="rounded-md px-0.5 py-1 font-medium text-on-surface-variant sm:px-1 transition hover:text-primary hover:underline underline-offset-4"
              >
                {opt.label}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}
