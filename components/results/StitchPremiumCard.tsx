"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

export default function StitchPremiumCard({
  reportId,
  onGuestClick,
}: {
  reportId: string;
  onGuestClick?: () => void;
}) {
  const router = useRouter();
  const href = `/blueprint-preview/${encodeURIComponent(reportId)}/innate/deep`;

  const handleClick = () => {
    if (onGuestClick) {
      onGuestClick();
      return;
    }
    router.push(href);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative w-full overflow-hidden rounded-extra-large border border-outline-variant/35 bg-gradient-to-r from-[#fff8ee] via-[#f5f0e4] to-[#eef4e8] p-6 text-left shadow-[0_16px_40px_rgba(26,51,40,0.07)] transition hover:shadow-[0_20px_48px_rgba(26,51,40,0.1)] sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-rose/30 bg-accent-rose-soft/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          Premium
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <Lock className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
      </div>

      <h3 className="stitch-headline mt-5 text-balance text-2xl leading-snug sm:text-[1.65rem]">
        Deep integration analysis
      </h3>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
        A 30-page report weaving your innate blueprint into daily patterns,
        relationships, and decisions — written like a letter to yourself.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-baseline gap-2">
          <span className="stitch-headline text-3xl font-semibold text-primary">
            $12.99
          </span>
          <span className="text-sm text-on-surface-variant">
            one-time · lifetime access
          </span>
        </div>
        <span className="stitch-cta-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto sm:min-w-[11rem]">
          Unlock report
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
