import type { Metadata } from "next";
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
    title: messages.pricing.regionalMetaTitle,
    description: messages.pricing.regionalMetaDescription,
  });
}

export default async function PricingPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const copy = messages.pricing;

  return (
    <div className="stitch-landing relative min-h-screen w-full bg-[#FAF7F0]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_85%_12%,rgba(58,143,110,0.08)_0%,transparent_45%),radial-gradient(circle_at_8%_88%,rgba(196,154,156,0.14)_0%,transparent_40%)]"
      />
      <main id="main" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1A3328] sm:text-4xl">
            {copy.regionalHeroTitleLine1}
            <br />
            {copy.regionalHeroTitleLine2}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#4A5C52]">{copy.regionalHeroBody}</p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#D4CFC4] bg-[#FFFDF8] px-5 py-3 text-center text-[13px] font-medium leading-relaxed text-[#4A5C52]">
          {copy.regionalSandboxNotice}
        </div>

        <div className="mt-10 sm:mt-12">
          <RegionalPricingCards />
        </div>
      </main>
    </div>
  );
}
