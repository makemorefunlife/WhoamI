"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import AxisRadarChart from "@/components/v2/AxisRadarChart";
import {
  InnateLiteReportView,
  LiteReportError,
  LiteReportLoading,
} from "@/components/v2/LiteReportView";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useInnateLiteReport } from "@/lib/v2/lite/useLiteReport";
import FreeBadge from "@/components/v2/FreeBadge";
import InnateDeepEntryButton from "@/components/v2/InnateDeepEntryButton";

function InnateDetailContent() {
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
  const innate = bundle?.innate ?? null;
  const { report, loading, error, retry } = useInnateLiteReport(
    reportId,
    birth,
    Boolean(bundle),
  );

  useEffect(() => {
    if (!ready || bundleLoading) return;
    if (!bundle) router.replace("/survey-v2");
  }, [ready, bundle, bundleLoading, router]);

  if (!ready || bundleLoading || !bundle || !innate || !birth) {
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
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#FF9A3C]">
            본래의 나
          </p>
          <h1 className="mt-2 inline-flex items-center justify-center gap-2 text-lg font-semibold text-white/95">
            <span>(기질분석)</span>
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
            scores={innate.primary_axes}
            stroke="#FF9A3C"
            fill="rgba(255, 154, 60, 0.2)"
            label="Human Framework 6축"
          />
        </GlassCard>

        {loading && !report ? <LiteReportLoading /> : null}
        {error && !report ? (
          <LiteReportError message={error} onRetry={retry} />
        ) : null}
        {report ? (
          <GlassCard className="!py-6">
            <InnateLiteReportView
              oneLineSummary={report.one_line_summary}
              sections={sections}
            />
          </GlassCard>
        ) : null}

        <div className="space-y-2 border-t border-white/10 pt-5">
          <p className="text-center text-xs font-semibold tracking-wide text-white/55">
            심화 탐사
          </p>
          <InnateDeepEntryButton reportId={reportId} />
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

export default function InnateDetailPage() {
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
      <InnateDetailContent />
    </Suspense>
  );
}
