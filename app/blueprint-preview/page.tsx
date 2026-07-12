"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import StitchResultsDashboard from "@/components/results/StitchResultsDashboard";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import {
  ensureBirthSession,
  hasMinimalBirth,
} from "@/lib/v2/onboarding/hydrateBirthSession";
import { readSurveyV2Session } from "@/lib/v2/survey/session";
import { hydrateSurveySession } from "@/lib/v2/survey/surveyClient";
import { ROUTES } from "@/constants/routes";

function BlueprintPreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportIdParam = searchParams.get("reportId")?.trim() ?? "";

  const { canonicalReportId, resolving } = useCanonicalReportId({
    urlHint: reportIdParam,
    queryParam: "reportId",
    logContext: "blueprint-preview",
  });

  const { bundle, loading: bundleLoading } = useBlueprintBundle(
    canonicalReportId,
    Boolean(canonicalReportId),
  );

  useEffect(() => {
    if (!canonicalReportId || bundleLoading || bundle) return;

    void (async () => {
      if (!readSurveyV2Session(canonicalReportId)) {
        await hydrateSurveySession(canonicalReportId);
      }
      if (!readSurveyV2Session(canonicalReportId)) {
        router.replace(
          `/survey-v2?reportId=${encodeURIComponent(canonicalReportId)}`,
        );
        return;
      }
      if (!hasMinimalBirth(await ensureBirthSession(canonicalReportId))) {
        router.replace(
          `/survey-v2/complete?reportId=${encodeURIComponent(canonicalReportId)}`,
        );
      }
    })();
  }, [canonicalReportId, bundle, bundleLoading, router]);

  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <main className="px-5 sm:px-6">
        {!canonicalReportId && !resolving ? (
          <div className="mx-auto flex min-h-[40dvh] max-w-2xl flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-sm text-on-surface-variant">
              블루프린트를 보려면 설문을 먼저 완료해 주세요.
            </p>
            <button
              type="button"
              className="stitch-cta-primary !min-w-0 !px-8 !py-3 !text-sm"
              onClick={() => router.push(ROUTES.surveyV2)}
            >
              설문 시작하기
            </button>
          </div>
        ) : bundle ? (
          <StitchResultsDashboard
            reportId={canonicalReportId}
            current={bundle.survey.profile}
            essence={bundle.essence}
            birth={bundle.birth}
            birthTimeUnknown={bundle.birth.birthTimeUnknown}
          />
        ) : (
          <div className="mx-auto flex min-h-[40dvh] max-w-2xl items-center justify-center py-16">
            <p className="text-sm text-on-surface-variant">
              {bundleLoading || resolving
                ? "블루프린트 불러오는 중…"
                : "블루프린트를 준비하고 있어요…"}
            </p>
          </div>
        )}
      </main>
    </StitchSurveyShell>
  );
}

export default function BlueprintPreviewPage() {
  return (
    <Suspense
      fallback={
        <StitchSurveyShell className="stitch-survey stitch-results">
          <div className="flex min-h-dvh items-center justify-center px-6">
            <p className="text-sm text-on-surface-variant">Loading…</p>
          </div>
        </StitchSurveyShell>
      }
    >
      <BlueprintPreviewPageContent />
    </Suspense>
  );
}
