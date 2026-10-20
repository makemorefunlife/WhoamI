"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Shown next to "you need a credit" on the English site: if the account has
 * unused credits bought for the Korean site, say so and link there. Nothing
 * is spent or moved; those credits stay usable only on the Korean site.
 * Renders nothing on the Korean site (its screens are unchanged) or when
 * there is nothing to mention.
 */
export default function OtherSiteCreditNote({ creditType }: { creditType: "personal" | "relationship" }) {
  const { locale, messages } = useLocale();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (locale !== "en-US") return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/account/entitlements?locale=en-US", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as Record<string, { breakdown?: { otherLanguage?: number } } | undefined>;
        const n = body[creditType]?.breakdown?.otherLanguage ?? 0;
        if (!cancelled && Number.isFinite(n) && n > 0) setCount(n);
      } catch {
        // nothing to show
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, creditType]);

  if (locale !== "en-US" || count <= 0) return null;
  return (
    <p className="text-xs leading-relaxed text-on-surface-variant">
      {messages.account.otherSiteCreditNote(count)}{" "}
      <a href="/kr/account/billing" className="underline underline-offset-2 hover:text-primary">
        {messages.account.otherSiteCreditLink}
      </a>
    </p>
  );
}
