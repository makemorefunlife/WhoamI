import type { Metadata } from "next";
import PricingCards, { PricingHero } from "@/components/pricing/PricingCards";
import RegionalPricingCards from "@/components/pricing/RegionalPricingCards";
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
    <div className="stitch-landing relative min-h-screen w-full bg-[#FAF7F0]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_85%_12%,rgba(58,143,110,0.08)_0%,transparent_45%),radial-gradient(circle_at_8%_88%,rgba(196,154,156,0.14)_0%,transparent_40%)]"
      />
      <main id="main" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-6 sm:pt-20">
        <PricingHero />
        <div className="mt-10 sm:mt-12">
          <PricingCards />
        </div>
        <div className="mt-16 sm:mt-20">
          <RegionalPricingCards />
        </div>
      </main>
    </div>
  );
}
