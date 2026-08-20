import type { Metadata } from "next";
import SpaceBackground from "@/components/space/SpaceBackground";
import PricingCards, { PricingHero } from "@/components/pricing/PricingCards";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return buildPageMetadata({
    locale,
    path: "/pricing",
    title: messages.pricing.metaTitle,
    description: messages.pricing.metaDescription,
  });
}

export default function PricingPage() {
  return (
    <SpaceBackground showProbe={false}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,156,255,0.12),transparent_50%)]"
      />
      <main id="main" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-6 sm:pt-20">
        <PricingHero />
        <div className="mt-10 sm:mt-12">
          <PricingCards />
        </div>
      </main>
    </SpaceBackground>
  );
}
