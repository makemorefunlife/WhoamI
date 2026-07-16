"use client";

import { Suspense, useEffect, useState } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useParams, useRouter } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import AxisRadarChart from "@/components/v2/AxisRadarChart";
import {
  CurrentLiteReportView,
  LiteReportError,
  LiteReportLoading,
} from "@/components/v2/LiteReportView";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useCurrentLiteReport } from "@/lib/v2/lite/useLiteReport";
import FreeBadge from "@/components/v2/FreeBadge";

function CurrentDetailContent() {
  const router = useRouter();
  const { messages, href: localize } = useLocale();
  const params = useParams();
  const reportId = decodeURIComponent(String(params.reportId ?? ""));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!reportId) {
      router.replace(localize("/"));
      return;
    }
    setReady(true);
  }, [reportId, router, localize]);

  const { bundle, loading: bundleLoading } = useBlueprintBundle(reportId, ready);
  const profile = bundle?.survey.profile ?? null;
  const { report, loading, error, retry } = useCurrentLiteReport(
    reportId,
    profile,
    Boolean(bundle),
  );

  useEffect(() => {
    if (!ready || bundleLoading) return;
    if (!bundle) router.replace(localize("/survey-v2"));
  }, [ready, bundle, bundleLoading, router, localize]);

  if (!ready || bundleLoading || !bundle || !profile) {
    return (
      <SpaceBackground showProbe={false}>
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-[rgba(255,255,255,0.55)]">
            {messages.report.chrome.loading}
          </p>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground showProbe={false}>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-5 py-16">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7B9BFF]">
            {messages.blueprint.currentTitle}
          </p>
          <h1 className="mt-2 inline-flex items-center justify-center gap-2 text-lg font-semibold text-white/95">
            <span>{messages.blueprint.surveyResultLabel}</span>
            <FreeBadge />
          </h1>
        </div>

        <GlassCard className="space-y-4 !py-6">
          <AxisRadarChart
            scores={profile.primary_axes}
            stroke="#7B9BFF"
            fill="rgba(123, 155, 255, 0.22)"
            label={messages.blueprint.axisChartLabel}
          />
        </GlassCard>

        {loading && !report ? <LiteReportLoading /> : null}
        {error && !report ? (
          <LiteReportError message={error} onRetry={retry} />
        ) : null}
        {report ? (
          <GlassCard className="!py-6">
            <CurrentLiteReportView
              oneLineSummary={report.one_line_summary}
              sections={[
                report.current_pattern,
                report.key_strength,
                report.growth_edge,
                report.decision_hint,
                report.small_action,
              ]}
            />
          </GlassCard>
        ) : null}

        <GlowButton
          type="button"
          variant="primary"
          className="w-full"
          onClick={() =>
            router.push(
              localize(`/blueprint-preview?reportId=${encodeURIComponent(reportId)}`),
            )
          }
        >
          {messages.blueprint.backToBlueprint}
        </GlowButton>
        <LocaleLink
          href={`/blueprint-preview/${encodeURIComponent(reportId)}/essence`}
          className="text-center text-sm text-white/50 underline-offset-2 hover:text-white/75 hover:underline"
        >
          {messages.blueprint.viewEssenceProfile}
        </LocaleLink>
      </main>
    </SpaceBackground>
  );
}

function CurrentDetailFallback() {
  const { messages } = useLocale();
  return (
    <SpaceBackground showProbe={false}>
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-[rgba(255,255,255,0.55)]">
          {messages.report.chrome.loading}
        </p>
      </div>
    </SpaceBackground>
  );
}

export default function CurrentDetailPage() {
  return (
    <Suspense fallback={<CurrentDetailFallback />}>
      <CurrentDetailContent />
    </Suspense>
  );
}
