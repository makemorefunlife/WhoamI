"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchSlimV1IntegratedView from "@/components/results/StitchSlimV1IntegratedView";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useSlimV1Integrated } from "@/lib/v1/slim/useSlimV1Integrated";
import {
  ensureBirthSession,
  hasMinimalBirth,
} from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";
import { resultsDashboardPath } from "@/lib/v2/results/canShowResultsDashboard";

function InnateDeepContent() {
  const router = useRouter();
  const params = useParams();
  const reportId = decodeURIComponent(String(params.reportId ?? ""));
  const [ready, setReady] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!reportId) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [reportId, router]);

  useEffect(() => {
    if (!ready || !reportId) return;

    void (async () => {
      if (!readSurveyV2Session(reportId)) {
        await hydrateSurveySession(reportId);
      }
      await ensureBirthSession(reportId);
      setBooting(false);
    })();
  }, [ready, reportId]);

  const { bundle, loading: bundleLoading } = useBlueprintBundle(
    reportId,
    ready && !booting,
  );
  const canGenerate =
    ready && !booting && Boolean(bundle?.birth && hasMinimalBirth(bundle.birth));

  const { data, loading, error, retry, regenerateFresh } = useSlimV1Integrated(
    reportId,
    canGenerate,
    bundle?.birth ?? null,
  );

  useEffect(() => {
    if (!ready || booting || bundleLoading) return;
    if (bundle) return;

    void (async () => {
      if (!readSurveyV2Session(reportId)) {
        await hydrateSurveySession(reportId);
      }
      if (!readSurveyV2Session(reportId)) {
        router.replace("/survey-v2");
        return;
      }
      const birth = await ensureBirthSession(reportId);
      if (!hasMinimalBirth(birth)) {
        router.replace(
          `/survey-v2/complete?reportId=${encodeURIComponent(reportId)}`,
        );
      }
    })();
  }, [ready, booting, reportId, bundle, bundleLoading, router]);

  if (!ready || booting || bundleLoading) {
    return (
      <StitchSurveyShell className="stitch-survey stitch-results">
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-on-surface-variant">불러오는 중…</p>
        </div>
      </StitchSurveyShell>
    );
  }

  if (!bundle) {
    return (
      <StitchSurveyShell className="stitch-survey stitch-results">
        <div className="flex min-h-[50vh] items-center justify-center px-6">
          <p className="text-sm text-on-surface-variant">
            설문·출생 정보 확인 중…
          </p>
        </div>
      </StitchSurveyShell>
    );
  }

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-6 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-rose/30 bg-accent-rose-soft/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            Premium
          </span>
          <h1 className="stitch-headline mt-4 text-balance text-2xl leading-snug sm:text-3xl">
            Deep integration analysis
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            설문 · 출생 에너지를 통합한 심화 리포트예요.
          </p>
        </div>

        <StitchSlimV1IntegratedView
          data={data}
          loading={loading}
          error={error}
          onRetry={() => retry()}
          onRegenerateFresh={() => regenerateFresh()}
        />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="stitch-cta-primary w-full disabled:opacity-60"
            onClick={() => regenerateFresh()}
            disabled={loading}
          >
            {loading ? "생성 중… (1~2분)" : "다시 생성"}
          </button>
          <button
            type="button"
            className="stitch-cta-secondary w-full"
            onClick={() => router.push(resultsDashboardPath(reportId))}
          >
            대시보드로 돌아가기
          </button>
          {error ? (
            <button
              type="button"
              className="text-sm text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"
              onClick={() => router.push("/account#birth")}
            >
              출생 정보 수정하기 (계정)
            </button>
          ) : null}
        </div>
      </main>
    </StitchSurveyShell>
  );
}

export default function InnateDeepPage() {
  return (
    <Suspense
      fallback={
        <StitchSurveyShell className="stitch-survey stitch-results">
          <div className="flex min-h-[50vh] items-center justify-center px-6">
            <p className="text-sm text-on-surface-variant">불러오는 중…</p>
          </div>
        </StitchSurveyShell>
      }
    >
      <InnateDeepContent />
    </Suspense>
  );
}
