"use client";



import { Suspense, useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";

import StitchSurveyShell from "@/components/survey/StitchSurveyShell";

import StitchBirthInputForm, {

  isStitchBirthFormReady,

  type StitchBirthFormState,

} from "@/components/onboarding/StitchBirthInputForm";

import { resolveApproximateBirthPlaceClient } from "@/lib/v2/onboarding/resolveApproximateBirthPlaceClient";

import {

  readBirthV2Session,

  writeBirthV2Session,

} from "@/lib/v2/onboarding/birthSession";

import { ensureBirthSession, hasMinimalBirth } from "@/lib/v2/onboarding/hydrateBirthSession";
import { resultsDashboardPath } from "@/lib/v2/results/canShowResultsDashboard";

import { hasSurveyV2Session } from "@/lib/v2/survey/session";

import { resolveCanonicalReportIdClient } from "@/lib/home/resolveCanonicalReportIdClient";

import { clearLiteReports } from "@/lib/v2/lite/session";

import { clearSlimIntegratedCache } from "@/lib/v1/slim/slimIntegratedCache";



type Phase = "boot" | "analyzing" | "birth";



const ANALYZING_MS = 2800;



function SurveyCompleteContent() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("boot");

  const [reportId, setReportId] = useState("");

  const [busy, setBusy] = useState(false);

  const [birthForm, setBirthForm] = useState<StitchBirthFormState | null>(null);



  useEffect(() => {

    let cancelled = false;



    void (async () => {

      const param = searchParams.get("reportId")?.trim() ?? "";

      const resolved = await resolveCanonicalReportIdClient(

        param,

        "survey-complete",

      );

      const id = resolved.canonicalReportId;



      if (!id || !hasSurveyV2Session(id)) {

        router.replace("/");

        return;

      }



      await ensureBirthSession(id);
      const existing = readBirthV2Session(id);

      if (hasMinimalBirth(existing)) {
        router.replace(resultsDashboardPath(id));
        return;
      }

      if (!cancelled) {

        setReportId(id);

        if (existing) {

          setBirthForm({

            birthDate: existing.birthDate,

            birthTime: existing.birthTime,

            birthTimeUnknown: existing.birthTimeUnknown,

            birthPlace: existing.birthPlace,

            birthPlaceUnknown: existing.birthPlaceUnknown === true,

          });

        }

        setPhase("analyzing");

      }

    })();



    return () => {

      cancelled = true;

    };

  }, [router, searchParams]);



  useEffect(() => {

    if (phase !== "analyzing") return;

    const t = window.setTimeout(() => setPhase("birth"), ANALYZING_MS);

    return () => window.clearTimeout(t);

  }, [phase]);



  const canViewResults = birthForm ? isStitchBirthFormReady(birthForm) : false;



  const handleViewResults = useCallback(async () => {

    if (!reportId || !birthForm || !canViewResults || busy) return;



    setBusy(true);



    let birthPlace = birthForm.birthPlace;

    let birthLatitude: number | undefined;

    let birthLongitude: number | undefined;



    if (birthForm.birthPlaceUnknown) {

      const approx = await resolveApproximateBirthPlaceClient();

      if (approx) {

        birthPlace = approx.birthPlace;

        birthLatitude = approx.birthLatitude;

        birthLongitude = approx.birthLongitude;

      } else {

        birthPlace = "Approximate location";

      }

    }



    writeBirthV2Session(reportId, {

      birthDate: birthForm.birthDate,

      birthTime: birthForm.birthTime,

      birthTimeUnknown: birthForm.birthTimeUnknown,

      birthPlace,

      birthPlaceUnknown: birthForm.birthPlaceUnknown,

    });



    try {

      const res = await fetch("/api/report/birth", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          reportId,

          birthDate: birthForm.birthDate,

          birthTime: birthForm.birthTimeUnknown ? null : birthForm.birthTime,

          birthTimeUnknown: birthForm.birthTimeUnknown,

          birthPlace,

          birthPlaceUnknown: birthForm.birthPlaceUnknown,

          birthLatitude,

          birthLongitude,

        }),

      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {

        alert(

          data.error ??

            "출생 정보 저장에 실패했어요. 잠시 후 다시 시도해 주세요.",

        );

        setBusy(false);

        return;

      }

      clearLiteReports(reportId);

      clearSlimIntegratedCache(reportId);

    } catch (e) {

      console.error("report/birth save:", e);

      alert("출생 정보 저장에 실패했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.");

      setBusy(false);

      return;

    }



    router.push(`/blueprint-preview?reportId=${encodeURIComponent(reportId)}`);

  }, [birthForm, busy, canViewResults, reportId, router]);



  if (phase === "boot") {

    return (

      <StitchSurveyShell>

        <div className="flex min-h-dvh items-center justify-center px-6">

          <p className="text-sm text-on-surface-variant">불러오는 중…</p>

        </div>

      </StitchSurveyShell>

    );

  }



  return (

    <StitchSurveyShell>

      <AnimatePresence mode="wait">

        {phase === "analyzing" ? (

          <motion.div

            key="analyzing"

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0, y: -8 }}

            className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"

          >

            <div className="relative mb-8 h-16 w-16">

              <motion.span

                className="absolute inset-0 rounded-full border-2 border-primary/25"

                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}

                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}

              />

              <motion.span

                className="absolute inset-2 rounded-full border-2 border-t-primary border-r-primary/30 border-b-primary/15 border-l-primary/30"

                animate={{ rotate: 360 }}

                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}

              />

            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">

              Organizing patterns

            </p>

            <h1 className="stitch-headline mt-3 max-w-sm text-balance text-2xl leading-snug sm:text-3xl">

              답변을 바탕으로 패턴을 정리중입니다

            </h1>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-surface-variant">

              잠시만 기다려 주세요. 곧 출생 정보를 입력할 수 있어요.

            </p>

          </motion.div>

        ) : (

          <motion.div

            key="birth"

            initial={{ opacity: 0, y: 12 }}

            animate={{ opacity: 1, y: 0 }}

            className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-12"

          >

            <StitchBirthInputForm

              initialBirthDate={birthForm?.birthDate}

              initialBirthTime={birthForm?.birthTime}

              initialBirthTimeUnknown={birthForm?.birthTimeUnknown}

              initialBirthPlace={birthForm?.birthPlace}

              initialBirthPlaceUnknown={birthForm?.birthPlaceUnknown}

              busy={busy}

              onChange={setBirthForm}

            />

            <div className="mt-6 w-full max-w-[420px] self-center">
              <button
                type="button"
                disabled={!canViewResults || busy}
                onClick={() => void handleViewResults()}
                className="stitch-cta-primary w-full disabled:cursor-not-allowed"
              >
                {busy ? "저장 중…" : "결과 보기"}
              </button>
              {!canViewResults ? (
                <p className="mt-2 text-center text-[11px] text-on-surface-variant">
                  생년월일을 입력하고, 시간·장소는 입력하거나 건너뛰기를 선택해
                  주세요.
                </p>
              ) : null}
            </div>

            <Link

              href="/"

              className="mt-6 text-center text-sm text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"

            >

              홈으로

            </Link>

          </motion.div>

        )}

      </AnimatePresence>

    </StitchSurveyShell>

  );

}



export default function SurveyCompletePage() {

  return (

    <Suspense

      fallback={

        <StitchSurveyShell>

          <div className="flex min-h-dvh items-center justify-center px-6">

            <p className="text-sm text-on-surface-variant">불러오는 중…</p>

          </div>

        </StitchSurveyShell>

      }

    >

      <SurveyCompleteContent />

    </Suspense>

  );

}

