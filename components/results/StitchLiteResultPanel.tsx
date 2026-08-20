"use client";

import { StitchReportError } from "@/components/results/deep/StitchReportStatus";
import { FreeReportBody } from "@/components/results/free/FreeReportBody";
import { getFreeReportUiStrings } from "@/components/results/free/freeReportUiStrings";
import { useCurrentLiteReport, useEssenceLiteReport } from "@/lib/v2/lite/useLiteReport";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { BirthV2Session } from "@/lib/v2/onboarding/birthSession";
import type { EssenceSelfLiteProfile } from "@/lib/v2/saju/essenceLite";
import StitchFreeSticker from "@/components/results/StitchFreeSticker";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useRouter } from "next/navigation";

type LiteTab = "current" | "essence";

/**
 * 대시보드에 인라인으로 펼쳐지는 무료 분석 패널 — 로버블 "Inner Compass Free"
 * 디자인의 본문(FreeReportBody: 미니 인디케이터·태그 섹션·업셀)을 그대로 쓴다.
 * /blueprint-preview/[reportId]/current 전체 페이지 버전(StitchFreeReportView)과
 * 같은 컴포넌트를 공유해서 두 곳이 다른 디자인으로 어긋나지 않게 했다.
 */
export default function StitchLiteResultPanel({
  reportId,
  profile,
  essence,
  birth,
  active,
}: {
  reportId: string;
  profile: CurrentSelfProfile;
  essence: EssenceSelfLiteProfile;
  birth: BirthV2Session;
  active: LiteTab | null;
}) {
  const router = useRouter();
  const { locale, messages, href: localize } = useLocale();
  const t = getFreeReportUiStrings(locale);

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

  if (!active) return null;

  const goToDeepReport = () =>
    router.push(localize(`/blueprint-preview/${encodeURIComponent(reportId)}/essence/deep`));

  const essenceSections = essenceReport
    ? [
        {
          section: essenceReport.core_personality_insight,
          tag: t.essenceSectionTags.personality,
          tone: "ink" as const,
        },
        {
          section: essenceReport.relationship_tendency_insight,
          tag: t.essenceSectionTags.relationship,
          tone: "accent" as const,
        },
        ...(essenceReport.environment_fit_hint
          ? [
              {
                section: essenceReport.environment_fit_hint,
                tag: t.essenceSectionTags.environment,
                tone: "highlight" as const,
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">
      {active === "current" ? (
        <>
          <h3 className="mb-4 inline-flex flex-wrap items-center gap-2 text-base font-semibold text-primary">
            {messages.report.currentStateLabel}
            <StitchFreeSticker />
          </h3>
          {currentLoading && !currentReport ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              {messages.report.analyzing}
            </p>
          ) : null}
          {currentError && !currentReport ? (
            <StitchReportError
              message={currentError}
              onRetry={retryCurrent}
              retryLabel={messages.report.chrome.retry}
            />
          ) : null}
          {currentReport ? (
            <FreeReportBody
              oneLineSummary={currentReport.one_line_summary}
              axesScores={profile.primary_axes}
              sections={[
                {
                  section: currentReport.current_pattern,
                  tag: t.currentSectionTags.pattern,
                  tone: "ink",
                },
                {
                  section: currentReport.key_strength,
                  tag: t.currentSectionTags.strength,
                  tone: "accent",
                },
                {
                  section: currentReport.growth_edge,
                  tag: t.currentSectionTags.growth,
                  tone: "highlight",
                },
                {
                  section: currentReport.decision_hint,
                  tag: t.currentSectionTags.hint,
                  tone: "gold",
                },
                {
                  section: currentReport.small_action,
                  tag: t.currentSectionTags.action,
                  tone: "accent",
                },
              ]}
              locale={locale}
              t={t}
              showUpsell={false}
            />
          ) : null}
        </>
      ) : (
        <>
          <h3 className="mb-4 inline-flex flex-wrap items-center gap-2 text-base font-semibold text-primary">
            {messages.report.essenceBlueprintTitle}
            <StitchFreeSticker />
          </h3>
          {essenceLoading && !essenceReport ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              {messages.report.analyzing}
            </p>
          ) : null}
          {essenceError && !essenceReport ? (
            <StitchReportError
              message={essenceError}
              onRetry={retryEssence}
              retryLabel={messages.report.chrome.retry}
            />
          ) : null}
          {essenceReport ? (
            <FreeReportBody
              oneLineSummary={essenceReport.one_line_summary}
              axesScores={essence.primary_axes}
              sections={essenceSections}
              locale={locale}
              t={t}
              showUpsell={false}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
