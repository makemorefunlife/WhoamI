import Link from "next/link";
import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { localizedPath } from "@/lib/i18n/locale";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { ROUTES } from "@/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return buildPageMetadata({
    locale,
    path: "/contact",
    title: messages.contact.metaTitle,
    description: messages.contact.metaDescription,
  });
}

/** Styled to match the stitch-legal (Terms/Privacy/Refund) look, not the dark space theme. */
export default async function ContactPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = messages.contact;

  return (
    <div className="stitch-legal relative min-h-dvh text-on-surface">
      <main id="main" className="relative z-[1] mx-auto w-full max-w-3xl px-5 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
        <p className="mb-6">
          <Link
            href={localizedPath(ROUTES.home, locale)}
            className="text-sm text-on-surface-variant transition hover:text-primary"
          >
            {messages.legal.backHome}
          </Link>
        </p>

        <header className="border-b border-outline-variant/40 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
            {messages.legal.eyebrow}
          </p>
          <h1 className="stitch-headline mt-3 text-balance text-2xl leading-snug text-primary sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-on-surface-variant sm:text-base">
            {t.body}
          </p>
        </header>

        <dl className="mt-10 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant/25 pb-5">
            <dt className="text-xs font-medium uppercase tracking-wide text-on-surface-variant/70">
              {t.emailLabel}
            </dt>
            <dd>
              <a
                href="mailto:contact@ahaitsme.com"
                className="text-[15px] font-medium text-secondary underline decoration-secondary/35 underline-offset-2 transition hover:text-accent-emerald hover:decoration-accent-emerald/50"
              >
                contact@ahaitsme.com
              </a>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant/25 pb-5">
            <dt className="text-xs font-medium uppercase tracking-wide text-on-surface-variant/70">
              {t.instagramLabel}
            </dt>
            <dd>
              <a
                href="https://www.instagram.com/aha_itsme_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[15px] font-medium text-secondary underline decoration-secondary/35 underline-offset-2 transition hover:text-accent-emerald hover:decoration-accent-emerald/50"
              >
                @aha_itsme_
              </a>
            </dd>
          </div>
        </dl>

        <p className="mt-8 text-[15px] leading-relaxed text-on-surface-variant">
          {t.faqPrompt}{" "}
          <Link
            href={localizedPath(ROUTES.faq, locale)}
            className="font-medium text-secondary underline decoration-secondary/35 underline-offset-2 transition hover:text-accent-emerald hover:decoration-accent-emerald/50"
          >
            {t.faqLinkLabel}
          </Link>
        </p>
      </main>
    </div>
  );
}
