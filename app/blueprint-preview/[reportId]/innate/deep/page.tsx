"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlowButton from "@/components/space/GlowButton";
import SlimV1IntegratedView from "@/components/v2/SlimV1IntegratedView";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useSlimV1Integrated } from "@/lib/v1/slim/useSlimV1Integrated";
import { readSurveyV2Session } from "@/lib/v2/survey/session";

function InnateDeepContent() {
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
  const canGenerate = ready && Boolean(bundle?.birth?.birthDate);

  const { data, loading, error, retry, regenerateFresh } = useSlimV1Integrated(
    reportId,
    canGenerate,
    bundle?.birth ?? null,
  );

  useEffect(() => {
    if (!ready || !reportId || bundleLoading) return;
    if (bundle) return;
    if (!readSurveyV2Session(reportId)) {
      router.replace("/survey-v2");
      return;
    }
    router.replace(
      `/onboarding/birth?reportId=${encodeURIComponent(reportId)}`,
    );
  }, [ready, reportId, bundle, bundleLoading, router]);

  if (!ready || bundleLoading) {
    return (
      <SpaceBackground showProbe={false}>
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-[rgba(255,255,255,0.55)]">불러오는 중…</p>
        </div>
      </SpaceBackground>
    );
  }

  if (!bundle) {
    return (
      <SpaceBackground showProbe={false}>
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-[rgba(255,255,255,0.55)]">
            설문·생년월일 확인 중…
          </p>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground showProbe={false}>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-5 py-16">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-white/95">
            본래의 나 (자세히 보기)
          </h1>
        </div>

        <SlimV1IntegratedView
          data={data}
          loading={loading}
          error={error}
          onRetry={() => retry()}
          onRegenerateFresh={() => regenerateFresh()}
        />

        {error ? (
          <GlowButton
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() =>
              router.push(
                `/onboarding/birth?reportId=${encodeURIComponent(reportId)}`,
              )
            }
          >
            출생 정보 입력/수정하기
          </GlowButton>
        ) : null}

        <GlowButton
          type="button"
          variant="primary"
          className="w-full"
          onClick={() => regenerateFresh()}
          disabled={loading}
        >
          {loading ? "생성 중… (1~2분)" : "다시 생성"}
        </GlowButton>

        <GlowButton
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() =>
            router.push(
              `/blueprint-preview/${encodeURIComponent(reportId)}/innate`,
            )
          }
        >
          기질분석(무료)으로 돌아가기
        </GlowButton>
      </main>
    </SpaceBackground>
  );
}

export default function InnateDeepPage() {
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
      <InnateDeepContent />
    </Suspense>
  );
}
