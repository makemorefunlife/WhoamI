"use client";

import { useRouter } from "next/navigation";
import GlowButton from "@/components/space/GlowButton";

/** 본래의 나 심화 — 결제 게이트는 추후 `/innate/deep` API·페이지에 연결 */
export default function InnateDeepEntryButton({
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
  const href = `/blueprint-preview/${encodeURIComponent(reportId)}/innate/deep`;

  const label = (
    <span className="flex flex-col items-center gap-1 text-center">
      <span
        className={
          featured
            ? "text-[16px] font-semibold leading-tight text-[#FFD4A8] [text-shadow:0_0_14px_rgba(255,154,60,0.75),0_0_28px_rgba(255,154,60,0.35)]"
            : "text-[15px] font-semibold leading-tight"
        }
      >
        본래의 나
      </span>
      <span
        className={
          featured
            ? "text-[12px] font-medium leading-snug text-[#FF9A3C]/90 [text-shadow:0_0_8px_rgba(255,154,60,0.4)]"
            : "text-[12px] font-normal opacity-90"
        }
      >
        (심화)
      </span>
    </span>
  );

  if (featured) {
    return (
      <button
        type="button"
        onClick={() => router.push(href)}
        className={`group relative overflow-hidden rounded-2xl border-2 border-[#FF9A3C]/50 bg-gradient-to-b from-[#FF9A3C]/16 via-[#FF9A3C]/9 to-[rgba(12,18,32,0.4)] px-4 py-4 shadow-[0_0_32px_rgba(255,154,60,0.24),inset_0_1px_0_rgba(255,220,180,0.14)] transition-all duration-300 hover:border-[#FF9A3C]/70 hover:shadow-[0_0_44px_rgba(255,154,60,0.38),inset_0_1px_0_rgba(255,220,180,0.2)] active:scale-[0.99] ${className}`}
      >
        <span
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,154,60,0.12)_0%,transparent_65%)]"
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
      onClick={() => router.push(href)}
    >
      {label}
    </GlowButton>
  );
}
