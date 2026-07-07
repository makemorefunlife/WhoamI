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

    Boolean(canonicalReportId) && !resolving,

  );



  useEffect(() => {

    if (resolving || !canonicalReportId || bundleLoading) return;

    if (bundle) return;



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

  }, [resolving, canonicalReportId, bundle, bundleLoading, router]);



  useEffect(() => {

    if (resolving) return;

    if (!canonicalReportId) {

      router.replace("/");

    }

  }, [resolving, canonicalReportId, router]);



  if (resolving || !canonicalReportId || bundleLoading || !bundle) {

    return (

      <StitchSurveyShell className="stitch-survey stitch-results">

        <div className="flex min-h-dvh items-center justify-center px-6">

          <p className="text-sm text-on-surface-variant">Preparing your blueprint…</p>

        </div>

      </StitchSurveyShell>

    );

  }



  return (

    <StitchSurveyShell className="stitch-survey stitch-results">

      <main className="px-5 sm:px-6">

        <StitchResultsDashboard

          reportId={canonicalReportId}

          current={bundle.survey.profile}

          innate={bundle.innate}

          birth={bundle.birth}

          birthTimeUnknown={bundle.birth.birthTimeUnknown}

        />

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

