"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
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
  const params = useParams();
  const reportId = decodeURIComponent(String(params.reportId ?? ""));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!reportId) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [reportId, router]);

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
    if (!bundle) router.replace("/survey-v2");
  }, [ready, bundle, bundleLoading, router]);

  if (!ready || bundleLoading || !bundle || !essence || !birth) {
    return (
      <SpaceBackground showProbe={false}>
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-[rgba(255,255,255,0.55)]">불러오는 중…</p>
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
            <span>내면의 정수</span>
            <FreeBadge />
          </h1>
          {birth.birthTimeUnknown ? (
            <p className="mt-2 text-xs text-amber-100/80">
              출생 시간 미입력 — 시주 신호는 제외된 Lite 분석이에요.
            </p>
          ) : null}
        </div>

        <GlassCard className="space-y-4 !py-6">
          <AxisRadarChart
            scores={essence.primary_axes}
            stroke={STITCH_ESSENCE_STROKE}
            fill={STITCH_ESSENCE_FILL}
            label="Human Framework 6축"
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
            심화 탐사
          </p>
          <EssenceDeepEntryButton reportId={reportId} />
        </div>

        <GlowButton
          type="button"
          variant="primary"
          className="w-full"
          onClick={() =>
            router.push(
              `/blueprint-preview?reportId=${encodeURIComponent(reportId)}`,
            )
          }
        >
          Blueprint로 돌아가기
        </GlowButton>
        <Link
          href={`/blueprint-preview/${encodeURIComponent(reportId)}/current`}
          className="text-center text-sm text-white/50 underline-offset-2 hover:text-white/75 hover:underline"
        >
          지금의 나 (설문결과) 보기 →
        </Link>
      </main>
    </SpaceBackground>
  );
}

export default function EssenceDetailPage() {
  return (
    <Suspense
      fallback={
        <SpaceBackground showProbe={false}>
          <div className="flex min-h-screen items-center justify-center px-6">
            <p className="text-sm text-[rgba(255,255,255,0.55)]">불러오는 중…</p>
          </div>
        </SpaceBackground>
      }
    >
      <EssenceDetailContent />
    </Suspense>
  );
}
