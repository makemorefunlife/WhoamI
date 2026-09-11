"use client";

import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";

/** CCPA — Do Not Sell My Personal Information 요청 안내 (글로벌). Styled to match the stitch-legal (Terms/Privacy/Refund) look, not the dark space theme. */
export default function DoNotSellContent() {
  const { messages } = useLocale();
  const copy = messages.doNotSellPage;

  return (
    <div className="stitch-legal relative min-h-dvh text-on-surface">
      <main id="main" className="relative z-[1] mx-auto w-full max-w-3xl px-5 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
        <p className="mb-6">
          <LocaleLink
            href={ROUTES.home}
            className="text-sm text-on-surface-variant transition hover:text-primary"
          >
            {messages.legal.backHome}
          </LocaleLink>
        </p>

        <header className="border-b border-outline-variant/40 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
            {messages.legal.eyebrow}
          </p>
          <h1 className="stitch-headline mt-3 text-balance text-2xl leading-snug text-primary sm:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-on-surface-variant sm:text-base">
            {copy.body}
          </p>
        </header>

        <article className="mt-10 space-y-3.5 sm:space-y-4">
          <p className="text-[15px] leading-[1.8] text-on-surface-variant sm:text-[15.5px] sm:leading-[1.85]">
            {copy.emailLabel}:{" "}
            <a
              href="mailto:contact@ahaitsme.com"
              className="font-medium text-secondary underline decoration-secondary/35 underline-offset-2 transition hover:text-accent-emerald hover:decoration-accent-emerald/50"
            >
              contact@ahaitsme.com
            </a>
          </p>
          <p className="text-[15px] leading-[1.8] text-on-surface-variant sm:text-[15.5px] sm:leading-[1.85]">
            <LocaleLink
              href={ROUTES.privacy}
              className="font-medium text-secondary underline decoration-secondary/35 underline-offset-2 transition hover:text-accent-emerald hover:decoration-accent-emerald/50"
            >
              {messages.footer.privacy}
            </LocaleLink>
          </p>
        </article>
      </main>
    </div>
  );
}
