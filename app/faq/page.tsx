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
    robots: { index: false, follow: true },
  });
}

export default async function FaqPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return (
    <SpaceBackground>
      <main id="main" className="relative z-10 mx-auto max-w-lg px-4 py-24">
        <GlassCard className="text-center">
          <h1 className="text-lg font-semibold text-[var(--space-text)]">
            {messages.faq.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--space-text-muted)]">
            {messages.faq.body}
          </p>
        </GlassCard>
      </main>
    </SpaceBackground>
  );
}
