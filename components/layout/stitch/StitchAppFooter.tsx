"use client";

import { usePathname } from "next/navigation";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pathnameWithoutLocalePrefix } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";

export default function StitchAppFooter() {
  const pathname = usePathname();
  const { locale, messages } = useLocale();
  const path = pathnameWithoutLocalePrefix(pathname ?? "/");
  const biz = messages.footer.business;

  if (path === ROUTES.home) return null;

  const legalLinks = [
    { href: ROUTES.terms, label: messages.footer.terms },
    { href: ROUTES.privacy, label: messages.footer.privacy },
    { href: ROUTES.refund, label: messages.footer.refund },
    ...(locale === "en-US"
      ? [{ href: ROUTES.doNotSell, label: messages.cookieBanner.doNotSell }]
      : []),
  ];

  const footerGroups = [
    {
      id: "account",
      label: messages.account.title,
      links: [
        { href: ROUTES.accountProfile, label: messages.account.profile },
        { href: ROUTES.accountBilling, label: messages.account.billing },
      ],
    },
    {
      id: "support",
      label: messages.footer.support,
      links: [
        { href: ROUTES.about, label: messages.nav.about },
        { href: ROUTES.pricing, label: messages.nav.pricing },
        { href: ROUTES.faq, label: messages.nav.faq },
        { href: ROUTES.contact, label: messages.nav.contact },
      ],
    },
    {
      id: "legal",
      label: messages.footer.legal,
      links: legalLinks,
    },
  ];

  return (
    <footer className="mt-auto border-t border-outline-variant/30 bg-surface-container-low/35 px-5 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <p className="text-sm font-semibold text-primary">
          <LocaleLink href="/" className="transition hover:opacity-80">
            Aha It&apos;s me!
          </LocaleLink>
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/60">
                {group.label}
              </p>
              <ul className="space-y-1.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <LocaleLink
                      href={link.href}
                      className="text-[12px] font-normal text-on-surface-variant transition hover:text-primary"
                    >
                      {link.label}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {locale === "ko-KR" ? (
          <div className="border-t border-outline-variant/25 pt-5 text-[11px] leading-relaxed text-on-surface-variant">
            <p>
              {biz.companyLabel}: {biz.companyName}
            </p>
            <p>
              {biz.ceoLabel}: {biz.ceoName}
            </p>
            <p>
              {biz.bizNumberLabel}: {biz.bizNumber}
            </p>
            <p>
              {biz.mailOrderLabel}: {biz.mailOrderNumber}
            </p>
            <p>
              {biz.addressLabel}: {biz.address}
            </p>
            <p>
              {biz.phoneLabel}: {biz.phone}
            </p>
            <p>
              {biz.emailLabel}:{" "}
              <a href={`mailto:${biz.email}`} className="underline underline-offset-2">
                {biz.email}
              </a>
            </p>
          </div>
        ) : null}

        <p className="border-t border-outline-variant/25 pt-5 text-[11px] text-on-surface-variant">
          © {new Date().getFullYear()} Aha It&apos;s me!
        </p>
      </div>
    </footer>
  );
}
