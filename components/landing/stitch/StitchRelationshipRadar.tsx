"use client";

import Image from "next/image";

type Props = {
  sampleBadgeText?: string;
};

export default function StitchRelationshipRadar({
  sampleBadgeText = "예시 샘플 데이터",
}: Props) {
  return (
    <div className="relative w-full max-w-[460px] text-left rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald">
          11-Axis Relationship Radar
        </span>
        <span className="rounded-full bg-secondary-container/80 px-2.5 py-0.5 text-[10px] font-medium text-primary">
          {sampleBadgeText}
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
        * 행동 기반 설문으로 측정한 참고 자료입니다. 편안한 마음으로 확인해 보세요.
      </p>
    </div>
  );
}
