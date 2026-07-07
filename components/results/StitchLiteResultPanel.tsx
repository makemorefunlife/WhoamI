"use client";

import {
  LiteReportError,
} from "@/components/v2/LiteReportView";
import { useCurrentLiteReport, useInnateLiteReport } from "@/lib/v2/lite/useLiteReport";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import StitchFreeSticker from "@/components/results/StitchFreeSticker";
import {
  STITCH_CURRENT_STROKE,
  STITCH_INNATE_STROKE,
} from "@/components/v2/DualAxisRadarChart";

type LiteTab = "current" | "innate";

function StitchSectionBlock({
  title,
  body,
}: {
  title?: string;
  body: string;
}) {
  if (!body?.trim()) return null;
  return (
    <div className="space-y-1.5 rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 px-4 py-3.5">
      {title ? (
        <h4 className="text-sm font-semibold text-primary">{title}</h4>
      ) : null}
      <p className="text-sm leading-relaxed text-on-surface">{body}</p>
    </div>
  );
}

function StitchCurrentLiteReport({
  oneLineSummary,
  sections,
}: {
  oneLineSummary: string;
  sections: { title?: string; body: string }[];
}) {
  return (
    <div className="space-y-4">
      {oneLineSummary ? (
        <p
          className="text-center text-[15px] font-medium leading-snug"
          style={{ color: STITCH_CURRENT_STROKE }}
        >
          {oneLineSummary}
        </p>
      ) : null}
      <div className="space-y-2.5">
        {sections.map((s, i) => (
          <StitchSectionBlock key={`${s.title}-${i}`} title={s.title} body={s.body} />
        ))}
      </div>
    </div>
  );
}

function StitchInnateLiteReport({
  oneLineSummary,
  sections,
}: {
  oneLineSummary: string;
  sections: { title?: string; body: string }[];
}) {
  return (
    <div className="space-y-4">
      {oneLineSummary ? (
        <p
          className="text-center text-[15px] font-medium leading-snug"
          style={{ color: STITCH_INNATE_STROKE }}
        >
          {oneLineSummary}
        </p>
      ) : null}
      <div className="space-y-2.5">
        {sections.map((s, i) => (
          <StitchSectionBlock key={`${s.title}-${i}`} title={s.title} body={s.body} />
        ))}
      </div>
    </div>
  );
}

export default function StitchLiteResultPanel({
  reportId,
  profile,
  birth,
  active,
}: {
  reportId: string;
  profile: CurrentSelfProfile;
  birth: BirthV2Session;
  active: LiteTab | null;
}) {
  const {
    report: currentReport,
    loading: currentLoading,
    error: currentError,
    retry: retryCurrent,
  } = useCurrentLiteReport(reportId, profile, active === "current");

  const {
    report: innateReport,
    loading: innateLoading,
    error: innateError,
    retry: retryInnate,
  } = useInnateLiteReport(reportId, birth, active === "innate");

  if (!active) return null;

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
    <div className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
      {active === "current" ? (
        <>
          <h3 className="mb-4 inline-flex flex-wrap items-center gap-2 text-base font-semibold text-primary">
            Current state
            <StitchFreeSticker />
          </h3>
          {currentLoading && !currentReport ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              Analyzing your survey patterns…
            </p>
          ) : null}
          {currentError && !currentReport ? (
            <LiteReportError message={currentError} onRetry={retryCurrent} />
          ) : null}
          {currentReport ? (
            <StitchCurrentLiteReport
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
          <h3 className="mb-4 inline-flex flex-wrap items-center gap-2 text-base font-semibold text-primary">
            Innate blueprint
            <StitchFreeSticker />
          </h3>
          {innateLoading && !innateReport ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              Reading your birth chart patterns…
            </p>
          ) : null}
          {innateError && !innateReport ? (
            <LiteReportError message={innateError} onRetry={retryInnate} />
          ) : null}
          {innateReport ? (
            <StitchInnateLiteReport
              oneLineSummary={innateReport.one_line_summary}
              sections={innateSections}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
