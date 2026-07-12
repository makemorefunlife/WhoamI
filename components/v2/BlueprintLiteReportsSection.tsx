"use client";

import { useState } from "react";
import {
  CurrentLiteReportView,
  EssenceLiteReportView,
  LiteReportError,
  LiteReportLoading,
} from "@/components/v2/LiteReportView";
import GlassCard from "@/components/space/GlassCard";
import FreeBadge from "@/components/v2/FreeBadge";
import EssenceDeepEntryButton from "@/components/v2/EssenceDeepEntryButton";
import { STITCH_ESSENCE_STROKE } from "@/components/v2/DualAxisRadarChart";
import { useCurrentLiteReport, useEssenceLiteReport } from "@/lib/v2/lite/useLiteReport";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";

type LiteTab = "current" | "essence";

export default function BlueprintLiteReportsSection({
  reportId,
  profile,
  birth,
}: {
  reportId: string;
  profile: CurrentSelfProfile;
  birth: BirthV2Session;
}) {
  const [active, setActive] = useState<LiteTab | null>(null);

  const {
    report: currentReport,
    loading: currentLoading,
    error: currentError,
    retry: retryCurrent,
  } = useCurrentLiteReport(reportId, profile, active === "current");

  const {
    report: essenceReport,
    loading: essenceLoading,
    error: essenceError,
    retry: retryEssence,
  } = useEssenceLiteReport(reportId, birth, active === "essence");

  const essenceSections = essenceReport
    ? [
        essenceReport.core_personality_insight,
        essenceReport.relationship_tendency_insight,
        ...(essenceReport.environment_fit_hint
          ? [essenceReport.environment_fit_hint]
          : []),
      ]
    : [];

  const tabBtn = (tab: LiteTab, label: string, color: string, sub: string) => {
    const selected = active === tab;
    return (
      <button
        type="button"
        onClick={() => setActive(tab)}
        className={[
          "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3.5 text-center transition-all",
          selected
            ? "shadow-[0_0_28px_rgba(103,183,255,0.18)]"
            : "border-white/10 bg-white/[0.04] hover:border-white/20",
        ].join(" ")}
        style={
          selected
            ? {
                borderColor: `${color}99`,
                backgroundColor: `${color}22`,
              }
            : undefined
        }
      >
        <span className="inline-flex items-center gap-1.5">
          <span
            className="text-[15px] font-semibold leading-tight"
            style={{ color: selected ? color : "rgba(255,255,255,0.88)" }}
          >
            {label}
          </span>
          <FreeBadge />
        </span>
        <span className="text-[12px] font-normal leading-snug text-white/45">
          {sub}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-4 border-t border-white/10 pt-5">
      <p className="text-center text-xs font-semibold tracking-wide text-white/55">
        무료 세부 리포트
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {tabBtn("current", "지금의 나", "#7B9BFF", "(설문결과)")}
        {tabBtn("essence", "Essence", STITCH_ESSENCE_STROKE, "(Essence 분석)")}
      </div>

      {active ? (
        <GlassCard className="space-y-3 !py-5">
          {active === "current" ? (
            <>
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
            </>
          ) : (
            <>
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Essence Profile
                <FreeBadge />
              </h2>
              {essenceLoading && !essenceReport ? <LiteReportLoading /> : null}
              {essenceError && !essenceReport ? (
                <LiteReportError message={essenceError} onRetry={retryEssence} />
              ) : null}
              {essenceReport ? (
                <EssenceLiteReportView
                  oneLineSummary={essenceReport.one_line_summary}
                  sections={essenceSections}
                />
              ) : null}
            </>
          )}
        </GlassCard>
      ) : (
        <p className="text-center text-xs text-white/40">
          버튼을 누르면 세부 리포트가 열려요.
        </p>
      )}

      <EssenceDeepEntryButton reportId={reportId} featured />
    </div>
  );
}
