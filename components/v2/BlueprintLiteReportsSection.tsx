"use client";

import {
  CurrentLiteReportView,
  InnateLiteReportView,
  LiteReportError,
  LiteReportLoading,
} from "@/components/v2/LiteReportView";
import GlassCard from "@/components/space/GlassCard";
import FreeBadge from "@/components/v2/FreeBadge";
import { useCurrentLiteReport, useInnateLiteReport } from "@/lib/v2/lite/useLiteReport";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";

export default function BlueprintLiteReportsSection({
  reportId,
  profile,
  birth,
}: {
  reportId: string;
  profile: CurrentSelfProfile;
  birth: BirthV2Session;
}) {
  const {
    report: currentReport,
    loading: currentLoading,
    error: currentError,
    retry: retryCurrent,
  } = useCurrentLiteReport(reportId, profile, true);

  const {
    report: innateReport,
    loading: innateLoading,
    error: innateError,
    retry: retryInnate,
  } = useInnateLiteReport(reportId, birth, true);

  const innateSections = innateReport
    ? [
        innateReport.core_personality_insight,
        innateReport.relationship_tendency_insight,
        ...(innateReport.environment_fit_hint
          ? [innateReport.environment_fit_hint]
          : []),
      ]
    : [];

  return (
    <div className="space-y-4 border-t border-white/10 pt-5">
      <p className="text-center text-xs font-semibold tracking-wide text-white/55">
        무료 세부 리포트
      </p>

      <GlassCard className="space-y-3 !py-5">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#7B9BFF]">
          지금의 나
          <FreeBadge />
        </h2>
        {currentLoading && !currentReport ? <LiteReportLoading /> : null}
        {currentError && !currentReport ? (
          <LiteReportError message={currentError} onRetry={retryCurrent} />
        ) : null}
        {currentReport ? (
          <CurrentLiteReportView
            oneLineSummary={currentReport.one_line_summary}
            sections={[
              currentReport.current_pattern,
              currentReport.key_strength,
              currentReport.growth_edge,
              currentReport.decision_hint,
              currentReport.small_action,
            ]}
          />
        ) : null}
      </GlassCard>

      <GlassCard className="space-y-3 !py-5">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF9A3C]">
          본래의 나
          <FreeBadge />
        </h2>
        {innateLoading && !innateReport ? <LiteReportLoading /> : null}
        {innateError && !innateReport ? (
          <LiteReportError message={innateError} onRetry={retryInnate} />
        ) : null}
        {innateReport ? (
          <InnateLiteReportView
            oneLineSummary={innateReport.one_line_summary}
            sections={innateSections}
          />
        ) : null}
      </GlassCard>
    </div>
  );
}
