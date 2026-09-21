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
    <footer className="mt-auto border-t border-outline-variant/30 bg-primary px-5 py-8 text-on-primary sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <p className="text-sm font-semibold text-on-primary">
          <LocaleLink href="/" className="transition hover:opacity-80">
            Aha It&apos;s me!
          </LocaleLink>
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-emerald-soft/90">
                {group.label}
              </p>
              <ul className="space-y-1.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <LocaleLink
                      href={link.href}
                      className="text-[12px] font-normal text-on-primary/80 transition hover:text-accent-rose-soft"
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
          <div className="border-t border-on-primary/15 pt-5 text-[11px] leading-relaxed text-on-primary/60">
            <p>
              {biz.companyLabel}: {biz.companyName}
            </p>
            <p>
              {biz.ceoLabel}: {biz.ceoName}
            </p>
            <p>
              {biz.bizNumberLabel}: {biz.bizNumber}
            </p>
            {/* 확정 전에는 값이 비어 있어 렌더링 자체를 건너뜀 — placeholder 문자열이
                production에 그대로 노출되는 것을 막기 위함(lib/i18n/messages/ko-KR.ts 참고). */}
            {biz.mailOrderNumber ? (
              <p>
                {biz.mailOrderLabel}: {biz.mailOrderNumber}
              </p>
            ) : null}
            <p>
              {biz.addressLabel}: {biz.address}
            </p>
            <p>
              {biz.phoneLabel}: {biz.phone}
            </p>
            <p className="text-on-primary/45">{biz.phoneNote}</p>
            <p>
              {biz.emailLabel}:{" "}
              <a href={`mailto:${biz.email}`} className="underline underline-offset-2 hover:text-on-primary">
                {biz.email}
              </a>
            </p>
            <p>
              <a
                href={`https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${biz.bizNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-on-primary"
              >
                {biz.bizVerifyLabel}
              </a>
            </p>
          </div>
        ) : (
          // en-US: KR 사업자정보(등록번호/통신판매업/주소/전화)는 의도적으로 생략하고,
          // 실제 운영 contact 이메일만 KR과 동일한 스타일로 노출.
          <div className="border-t border-on-primary/15 pt-5 text-[11px] leading-relaxed text-on-primary/60">
            <p>
              {biz.emailLabel}:{" "}
              <a href={`mailto:${biz.email}`} className="underline underline-offset-2 hover:text-on-primary">
                {biz.email}
              </a>
            </p>
          </div>
        )}

        <p className="border-t border-on-primary/15 pt-5 text-[11px] text-on-primary/60">
          © {new Date().getFullYear()} Aha It&apos;s me!
        </p>
      </div>
    </footer>
  );
}
