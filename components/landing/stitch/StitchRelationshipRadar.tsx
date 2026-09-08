"use client";

import Image from "next/image";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = {
  sampleBadgeText?: string;
};

export default function StitchRelationshipRadar({
  sampleBadgeText,
}: Props) {
  const { messages } = useLocale();
  const badge = sampleBadgeText || messages.landing.relBridgeSampleBadge;
  const note = messages.landing.relBridgeSampleNote;

  return (
    <div className="relative w-full max-w-[460px] text-left rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald">
          11-Axis Relationship Radar
        </span>
        <span className="rounded-full bg-secondary-container/80 px-2.5 py-0.5 text-[10px] font-medium text-primary">
          {badge}
        </span>
      </div>

      <div className="relative mx-auto w-full overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low/20">
        <Image
          src="/landing/relationship-radar.png"
          alt="11-Axis Relationship Comparison Radar"
          width={600}
          height={600}
          className="h-auto w-full object-contain"
          priority
        />
      </div>

      <p className="mt-4 text-[11px] text-on-surface-variant/70 leading-relaxed border-t border-outline-variant/20 pt-3">
        {note}
      </p>
    </div>
  );
}
