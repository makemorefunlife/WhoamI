"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlowButton from "@/components/space/GlowButton";
import SlimV1IntegratedView from "@/components/v2/SlimV1IntegratedView";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { useSlimV1Integrated } from "@/lib/v1/slim/useSlimV1Integrated";
import {
  ensureBirthSession,
  hasMinimalBirth,
} from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";

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
        router.replace(`/onboarding/birth?reportId=${encodeURIComponent(reportId)}`);
      }
    })();
  }, [ready, booting, reportId, bundle, bundleLoading, router]);

  if (!ready || booting || bundleLoading) {
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
            설문·출생 정보 확인 중…
          </p>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground showProbe={false}>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 px-5 py-16 pt-20">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#FF9A3C]">
            Slim V1 · 심화
          </p>
          <h1 className="mt-2 text-lg font-semibold text-white/95">
            본래의 나 (심화)
          </h1>
          <p className="mt-2 text-sm text-white/50">
            설문 6축 · 기질(신살) · 출생 에너지를 통합한 심화 리포트예요.
          </p>
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
            onClick={() => router.push("/account#birth")}
          >
            출생 정보 수정하기 (계정)
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
              `/blueprint-preview?reportId=${encodeURIComponent(reportId)}`,
            )
          }
        >
          Blueprint 미리보기로 돌아가기
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
