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

export const LANGUAGE_OPTIONS: { locale: Locale; label: string; short: string; lang: string }[] = [
  { locale: "en-US", label: "English (US)", short: "EN", lang: "en" },
  { locale: "ko-KR", label: "한국어 (KR)", short: "KR", lang: "ko" },
];

/**
 * Explicit `English (US) | 한국어 (KR)` selector. Plain links only -- no
 * auto-detection or redirect. Uses <a> (full navigation) on purpose: the
 * active locale is resolved server-side from the URL in the root layout, so
 * a client-side transition would keep the previous language's copy.
 *
 * variant "header": full labels from `sm` up, compact EN | KR below `sm`
 *   (the full labels don't fit next to the centered logo on phones).
 * variant "menu":   full labels, for the mobile side menu.
 */
export default function LanguageSwitcher({
  variant = "header",
  className = "",
}: {
  variant?: "header" | "menu";
  className?: string;
}) {
  const pathname = usePathname() ?? "/";
  const { locale } = useLocale();

  // href (SSR-safe) keeps the path; on click also carry the live ?query#hash.
  function handleClick(e: MouseEvent<HTMLAnchorElement>, target: Locale) {
    const extra = `${window.location.search}${window.location.hash}`;
    if (!extra || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.location.assign(languageSwitchHref(pathname, target, extra));
  }

  const isMenu = variant === "menu";

  return (
    <nav
      aria-label="Language / 언어"
      className={[
        "inline-flex items-center rounded-full border border-outline-variant/60 bg-surface-container-low/70 p-0.5 leading-none shadow-sm",
        isMenu ? "text-[13px]" : "text-[11px] sm:text-[13px]",
        className,
      ].join(" ")}
    >
      {LANGUAGE_OPTIONS.map((opt, i) => {
        const active = opt.locale === locale;
        const label = isMenu ? (
          opt.label
        ) : (
          <>
            <span className="sm:hidden">{opt.short}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </>
        );
        const pill = isMenu ? "px-3 py-1.5" : "px-2 py-1.5 sm:px-3";
        return (
          <span key={opt.locale} className="flex items-center">
            {i > 0 ? (
              <span aria-hidden className="px-0.5 text-outline-variant">
                |
              </span>
            ) : null}
            {active ? (
              <span
                aria-current="true"
                lang={opt.lang}
                title={opt.label}
                className={`rounded-full bg-primary font-semibold text-white ${pill}`}
              >
                {label}
              </span>
            ) : (
              <a
                href={languageSwitchHref(pathname, opt.locale)}
                onClick={(e) => handleClick(e, opt.locale)}
                hrefLang={opt.lang}
                lang={opt.lang}
                title={opt.label}
                className={`rounded-full font-medium text-primary/80 transition hover:bg-surface-container hover:text-primary ${pill}`}
              >
                {label}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}
