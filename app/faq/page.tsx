import type { Metadata } from "next";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

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
    <SpaceBackground>
      <main id="main" className="relative z-10 mx-auto max-w-2xl px-4 py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <GlassCard className="text-left">
          <h1 className="text-center text-lg font-semibold text-[var(--space-text)]">
            {messages.faq.title}
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-[var(--space-text-muted)]">
            {messages.faq.body}
          </p>
          <dl className="mt-8 space-y-6">
            {items.map((item) => (
              <div key={item.question} className="border-t border-white/10 pt-6 first:border-t-0 first:pt-0">
                <dt className="text-sm font-semibold text-[var(--space-text)]">
                  {item.question}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--space-text-muted)]">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </GlassCard>
      </main>
    </SpaceBackground>
  );
}
