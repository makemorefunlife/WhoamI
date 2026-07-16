"use client";

import { useRouter } from "next/navigation";
import GlowButton from "@/components/space/GlowButton";
import { STITCH_ESSENCE_STROKE } from "@/components/v2/DualAxisRadarChart";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** Essence 심화 — 결제 게이트는 추후 `/essence/deep` API·페이지에 연결 */
export default function EssenceDeepEntryButton({
  reportId,
  className = "w-full",
  featured = false,
}: {
  reportId: string;
  className?: string;
  /** Blueprint 등 — 무료 버튼 바로 아래 강조 CTA */
  featured?: boolean;
}) {
  const router = useRouter();
  const { messages, href: localize } = useLocale();
  const href = `/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep`;

  const label = (
    <span className="flex flex-col items-center gap-1 text-center">
      <span
        className={
          featured
            ? "text-[16px] font-semibold leading-tight text-primary"
            : "text-[15px] font-semibold leading-tight text-primary"
        }
      >
        Essence Profile
      </span>
      <span
        className={
          featured
            ? "text-[12px] font-medium leading-snug text-accent-rose"
            : "text-[12px] font-normal text-on-surface-variant"
        }
      >
        ({messages.blueprint.deepExploration})
      </span>
    </span>
  );

  if (featured) {
    return (
      <button
        type="button"
        onClick={() => router.push(localize(href))}
        className={`group relative overflow-hidden rounded-2xl border-2 border-primary/25 bg-gradient-to-b from-accent-emerald-soft via-surface-container-low to-surface px-4 py-4 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md active:scale-[0.99] ${className}`}
      >
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(196,154,108,0.14)_0%,transparent_65%)]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: STITCH_ESSENCE_STROKE }}
          aria-hidden
        />
        <span className="relative">{label}</span>
      </button>
    );
  }

  return (
    <GlowButton
      type="button"
      variant="primary"
      className={className}
      onClick={() => router.push(localize(href))}
    >
      {label}
    </GlowButton>
  );
}
