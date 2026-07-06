"use client";

import { useRouter } from "next/navigation";
import GlowButton from "@/components/space/GlowButton";

/** 유료 개인 통합 심화 — mobile-report-v2 UnifiedReportMarkdown UX */
export default function PremiumDeepEntryButton({
  reportId,
  className = "w-full",
}: {
  reportId: string;
  className?: string;
}) {
  const router = useRouter();
  const href = `/blueprint-preview/${encodeURIComponent(reportId)}/premium`;

  return (
    <GlowButton
      type="button"
      variant="secondary"
      className={className}
      onClick={() => router.push(href)}
    >
      <span className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-[15px] font-semibold leading-tight text-[#F0D797]">
          개인 심화 분석
        </span>
        <span className="text-[11px] font-normal text-[#D6B46A]/85">
          통합 핵심 리포트 (유료)
        </span>
      </span>
    </GlowButton>
  );
}
