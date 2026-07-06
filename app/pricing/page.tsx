import type { Metadata } from "next";
import SpaceBackground from "@/components/space/SpaceBackground";
import PricingCards, { PricingHero } from "@/components/pricing/PricingCards";

export const metadata: Metadata = {
  title: "요금 안내 | Ahaitsme",
  description: "나 · 관계 · 결정 — Human Framework 요금제",
};

export default function PricingPage() {
  return (
    <SpaceBackground showProbe={false}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,156,255,0.12),transparent_50%)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-6 sm:pt-20">
        <PricingHero />
        <div className="mt-10 sm:mt-12">
          <PricingCards />
        </div>
      </div>
    </SpaceBackground>
  );
}
