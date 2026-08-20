"use client";

import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";

/** CCPA — Do Not Sell My Personal Information 요청 안내 (글로벌) */
export default function DoNotSellContent() {
  const { messages } = useLocale();
  const copy = messages.doNotSellPage;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-5 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
        {copy.title}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
        {copy.body}
      </p>
      <p className="mt-4 text-sm text-on-surface-variant">
        {copy.emailLabel}:{" "}
        <a
          href="mailto:hong@ahaitsme.com"
          className="font-medium text-primary underline underline-offset-2"
        >
          hong@ahaitsme.com
        </a>
      </p>
      <p className="mt-8 text-sm">
        <LocaleLink
          href={ROUTES.privacy}
          className="text-primary underline underline-offset-2"
        >
          {messages.footer.privacy}
        </LocaleLink>
      </p>
    </main>
  );
}
