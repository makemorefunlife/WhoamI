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
    path: "/faq",
    title: messages.faq.metaTitle,
    description: messages.faq.metaDescription,
  });
}

/** Styled to match the stitch-legal (Terms/Privacy/Refund) look, not the dark space theme. */
export default async function FaqPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const items = messages.faq.items;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="stitch-legal relative min-h-dvh text-on-surface">
      <main id="main" className="relative z-[1] mx-auto w-full max-w-3xl px-5 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
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
            {messages.faq.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-on-surface-variant sm:text-base">
            {messages.faq.body}
          </p>
        </header>

        <dl className="mt-10 space-y-8">
          {items.map((item) => (
            <div key={item.question} className="border-b border-outline-variant/25 pb-8 last:border-b-0 last:pb-0">
              <dt className="text-base font-semibold tracking-[-0.01em] text-primary sm:text-[1.05rem]">
                {item.question}
              </dt>
              <dd className="mt-3 text-[15px] leading-[1.8] text-on-surface-variant [word-break:keep-all] sm:text-[15.5px] sm:leading-[1.85]">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
