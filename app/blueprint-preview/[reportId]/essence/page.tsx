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
  STITCH_ESSENCE_FILL,
  STITCH_ESSENCE_STROKE,
} from "@/components/v2/DualAxisRadarChart";
import {
  EssenceLiteReportView,
  LiteReportError,
  LiteReportLoading,
} from "@/components/v2/LiteReportView";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useEssenceLiteReport } from "@/lib/v2/lite/useLiteReport";
import FreeBadge from "@/components/v2/FreeBadge";
import EssenceDeepEntryButton from "@/components/v2/EssenceDeepEntryButton";

function EssenceDetailContent() {
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
  const birth = bundle?.birth ?? null;
  const essence = bundle?.essence ?? null;
  const { report, loading, error, retry } = useEssenceLiteReport(
    reportId,
    birth,
    Boolean(bundle),
  );

  useEffect(() => {
    if (!ready || bundleLoading) return;
    if (!bundle) router.replace(localize("/survey-v2"));
  }, [ready, bundle, bundleLoading, router, localize]);

  if (!ready || bundleLoading || !bundle || !essence || !birth) {
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

  const sections = report
    ? [
        report.core_personality_insight,
        report.relationship_tendency_insight,
        ...(report.environment_fit_hint ? [report.environment_fit_hint] : []),
      ]
    : [];

  return (
    <SpaceBackground showProbe={false}>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-5 py-16">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
            Essence Profile
          </p>
          <h1 className="stitch-headline mt-2 inline-flex items-center justify-center gap-2 text-lg font-semibold text-on-surface">
            <span>{messages.blueprint.essenceTitle}</span>
            <FreeBadge />
          </h1>
          {birth.birthTimeUnknown ? (
            <p className="mt-2 text-xs text-amber-100/80">
              {messages.blueprint.essenceBirthTimeUnknownNotice}
            </p>
          ) : null}
        </div>

        <GlassCard className="space-y-4 !py-6">
          <AxisRadarChart
            scores={essence.primary_axes}
            stroke={STITCH_ESSENCE_STROKE}
            fill={STITCH_ESSENCE_FILL}
            label={messages.blueprint.axisChartLabel}
          />
        </GlassCard>

        {loading && !report ? <LiteReportLoading /> : null}
        {error && !report ? (
          <LiteReportError message={error} onRetry={retry} />
        ) : null}
        {report ? (
          <GlassCard className="!py-6">
            <EssenceLiteReportView
              oneLineSummary={report.one_line_summary}
              sections={sections}
            />
          </GlassCard>
        ) : null}

        <div className="space-y-2 border-t border-white/10 pt-5">
          <p className="text-center text-xs font-semibold tracking-wide text-white/55">
            {messages.blueprint.deepExploration}
          </p>
          <EssenceDeepEntryButton reportId={reportId} />
        </div>

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
          href={`/blueprint-preview/${encodeURIComponent(reportId)}/current`}
          className="text-center text-sm text-white/50 underline-offset-2 hover:text-white/75 hover:underline"
        >
          {messages.blueprint.viewCurrentProfile}
        </LocaleLink>
      </main>
    </SpaceBackground>
  );
}

function EssenceDetailFallback() {
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

export default function EssenceDetailPage() {
  return (
    <Suspense fallback={<EssenceDetailFallback />}>
      <EssenceDetailContent />
    </Suspense>
  );
}
