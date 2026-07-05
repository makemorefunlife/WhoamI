"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import BlueprintPreviewContent from "@/components/v2/BlueprintPreviewContent";
import { useBlueprintBundle } from "@/lib/v2/blueprint/useBlueprintBundle";
import { readBirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { hasBirthPlaceForAstrology } from "@/lib/v2/onboarding/resolveBirthChartInput";
import { readSurveyV2Session } from "@/lib/v2/survey/session";

function BlueprintPreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportIdParam = searchParams.get("reportId")?.trim() ?? "";
  const [ready, setReady] = useState(false);
  const [reportId, setReportId] = useState("");

  useEffect(() => {
    const id = reportIdParam || localStorage.getItem("reportId")?.trim() || "";
    if (!id) {
      router.replace("/");
      return;
    }
    setReportId(id);
    setReady(true);
  }, [reportIdParam, router]);

  const { bundle, loading: bundleLoading } = useBlueprintBundle(reportId, ready);

  useEffect(() => {
    if (!ready || !reportId || bundleLoading) return;
    if (bundle) return;
    if (!readSurveyV2Session(reportId)) {
      router.replace("/survey-v2");
      return;
    }
    const birth = readBirthV2Session(reportId);
    if (!birth) {
      router.replace(`/onboarding/birth?reportId=${encodeURIComponent(reportId)}`);
      return;
    }
    if (!hasBirthPlaceForAstrology(birth.birthPlace)) {
      router.replace(`/onboarding/birth?reportId=${encodeURIComponent(reportId)}`);
    }
  }, [ready, reportId, bundle, bundleLoading, router]);

  if (!ready || bundleLoading || !bundle) {
    return (
      <SpaceBackground showProbe={false}>
        <div className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm text-[rgba(255,255,255,0.55)]">분석 준비 중…</p>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground showProbe={false}>
      <main className="flex min-h-screen flex-col items-center px-5 py-16 pt-20">
        <BlueprintPreviewContent
          reportId={reportId}
          current={bundle.survey.profile}
          innate={bundle.innate}
          birthTimeUnknown={bundle.birth.birthTimeUnknown}
        />
      </main>
    </SpaceBackground>
  );
}

export default function BlueprintPreviewPage() {
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
      <BlueprintPreviewPageContent />
    </Suspense>
  );
}
