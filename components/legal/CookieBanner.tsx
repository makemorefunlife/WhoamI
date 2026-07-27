"use client";

import { useEffect, useState } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";

const COOKIE_PREF_KEY = "aha_cookie_consent";

type CookiePref = "accepted" | "rejected";

/**
 * 글로벌(.com, en-US) 전용 CCPA 쿠키 배너.
 * 한국(/kr)에서는 렌더하지 않습니다.
 */
export default function CookieBanner() {
  const { locale, messages } = useLocale();
  const [visible, setVisible] = useState(false);
  const copy = messages.cookieBanner;

  useEffect(() => {
    if (locale !== "en-US") {
      setVisible(false);
      return;
    }
    try {
      const existing = localStorage.getItem(COOKIE_PREF_KEY);
      setVisible(existing !== "accepted" && existing !== "rejected");
    } catch {
      setVisible(true);
    }
  }, [locale]);

  if (!visible || locale !== "en-US") return null;

  function save(pref: CookiePref) {
    try {
      localStorage.setItem(COOKIE_PREF_KEY, pref);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label={copy.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/15 bg-[#12141f]/95 px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-white/90">{copy.message}</p>
          <p className="mt-1.5">
            <LocaleLink
              href={ROUTES.doNotSell}
              className="text-xs font-medium text-[#a5b4fc] underline underline-offset-2 hover:text-white"
            >
              {copy.doNotSell}
            </LocaleLink>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => save("rejected")}
            className="rounded-lg border border-white/25 px-3.5 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10"
          >
            {copy.reject}
          </button>
          <button
            type="button"
            onClick={() => save("accepted")}
            className="rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            {copy.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
