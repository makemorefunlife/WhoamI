"use client";



import { useState, useEffect, useMemo, useCallback } from "react";

import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";

import StitchSurveyShell from "@/components/survey/StitchSurveyShell";

import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";

import {

  SURVEY_V2_QUESTION_COUNT_EN,

  SURVEY_V2_QUESTIONS_EN,

} from "@/lib/v2/survey/questionsEn";

import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";

import {

  clearSurveyV2Session,

  hasSurveyV2Session,

  writeSurveyV2Session,

} from "@/lib/v2/survey/session";

import {

  clearSurveyOnServer,

  persistSurveyToServer,

} from "@/lib/v2/survey/surveyClient";

import { resolveCanonicalReportIdClient } from "@/lib/home/resolveCanonicalReportIdClient";



const STATUS_LINES = [

  "Exploring",

  "Reading patterns",

  "Mapping traits",

  "Gathering signals",

  "Almost there",

];



const EMPTY_ANSWERS = Object.fromEntries(

  SURVEY_V2_QUESTIONS_EN.map((q) => [q.id, ""]),

);



export default function SurveyV2Page() {

  const router = useRouter();

  const [sessionReady, setSessionReady] = useState(false);

  const [answers, setAnswers] = useState<Record<string, string>>(EMPTY_ANSWERS);

  const [finishing, setFinishing] = useState(false);

  const [advancing, setAdvancing] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);



  const busy = finishing;



  useEffect(() => {

    let cancelled = false;



    async function boot() {

      const params = new URLSearchParams(window.location.search);

      const token = params.get("token");

      const wantRedo = params.get("redo") === "1";

      const urlReportId = params.get("reportId")?.trim() ?? "";

      if (token) localStorage.setItem("inviteToken", token);



      const inviteToken = localStorage.getItem("inviteToken");

      const resolved = await resolveCanonicalReportIdClient(

        urlReportId,

        "survey-v2",

      );

      const reportId = resolved.canonicalReportId;



      if (!reportId) {

        if (inviteToken) {

          router.replace(`/?token=${encodeURIComponent(inviteToken)}`);

        } else {

          router.replace("/");

        }

        return;

      }



      if (wantRedo) {

        clearSurveyV2Session(reportId);

        await clearSurveyOnServer(reportId);

        if (!cancelled) setSessionReady(true);

        return;

      }



      if (hasSurveyV2Session(reportId)) {

        router.replace(

          `/survey-v2/complete?reportId=${encodeURIComponent(reportId)}`,

        );

        return;

      }



      if (!cancelled) setSessionReady(true);

    }



    void boot();

    return () => {

      cancelled = true;

    };

  }, [router]);



  const currentQuestion = useMemo(

    () => SURVEY_V2_QUESTIONS_EN[currentIndex],

    [currentIndex],

  );



  const statusLine = STATUS_LINES[currentIndex % STATUS_LINES.length];

  const progressPct = Math.round(

    ((currentIndex + 1) / SURVEY_V2_QUESTION_COUNT_EN) * 100,

  );



  const finishSurvey = async (payload: Record<string, string>) => {

    if (!isSurveyV2AnswersComplete(payload)) {

      alert("Please answer every question.");

      return;

    }



    const reportId = localStorage.getItem("reportId")?.trim();

    if (!reportId) {

      router.replace("/");

      return;

    }



    setFinishing(true);

    const profile = scoreSurveyAnswers(payload);

    writeSurveyV2Session(reportId, { answers: payload, profile });



    const saved = await persistSurveyToServer(reportId, payload, profile);

    if (!saved.ok) {

      alert(

        saved.error ??

          "Could not save your answers. Check your connection and try again.",

      );

      setFinishing(false);

      return;

    }



    router.push(

      `/survey-v2/complete?reportId=${encodeURIComponent(reportId)}`,

    );

  };



  const pickAnswer = (value: string) => {

    if (busy || advancing) return;



    const next = { ...answers, [currentQuestion.id]: value };

    setAnswers(next);



    const isLast = currentIndex >= SURVEY_V2_QUESTION_COUNT_EN - 1;

    if (!isLast) {

      setAdvancing(true);

      window.setTimeout(() => {

        setCurrentIndex((i) => i + 1);

        setAdvancing(false);

      }, 160);

    } else {

      finishSurvey(next);

    }

  };



  const goPrev = useCallback(() => {

    if (busy || advancing || currentIndex <= 0) return;

    setCurrentIndex((i) => i - 1);

  }, [advancing, busy, currentIndex]);



  if (!sessionReady) {

    return (

      <StitchSurveyShell>

        <div className="flex min-h-dvh flex-col items-center justify-center px-6">

          <p className="text-sm text-on-surface-variant">

            Preparing your survey…

          </p>

        </div>

      </StitchSurveyShell>

    );

  }



  return (

    <StitchSurveyShell>

      <div className="fixed left-0 right-0 top-16 z-[190] border-b border-outline-variant/40 bg-[#faf7f0]/92 backdrop-blur-md">

        <div className="mx-auto w-full max-w-[420px] px-5 py-4">

          <div className="mb-2 flex justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">

            <span className="text-secondary">Free survey</span>

            <span className="tabular-nums text-primary">

              {currentIndex + 1} / {SURVEY_V2_QUESTION_COUNT_EN}

            </span>

          </div>

          <div className="mb-2 flex justify-center gap-1.5">

            {SURVEY_V2_QUESTIONS_EN.map((q, i) => (

              <span

                key={q.id}

                className={`h-1.5 w-1.5 rounded-full transition-colors ${

                  i === currentIndex

                    ? "bg-primary"

                    : answers[q.id]

                      ? "bg-primary/40"

                      : "bg-outline-variant/50"

                }`}

                aria-hidden

              />

            ))}

          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-outline-variant/35">

            <motion.div

              className="h-full rounded-full bg-primary"

              initial={false}

              animate={{ width: `${progressPct}%` }}

              transition={{ duration: 0.35 }}

            />

          </div>

          <p className="mt-2 text-center text-[11px] text-on-surface-variant">

            {statusLine}

          </p>

        </div>

      </div>



      <main className="relative flex min-h-dvh flex-col items-center px-5 pb-32 pt-44 sm:pt-48">

        <p className="mb-8 max-w-[420px] text-center text-sm leading-relaxed text-on-surface-variant">

          Pick the option that feels closest to you — there are no wrong answers.

        </p>



        <div className="flex w-full max-w-[420px] flex-1 flex-col justify-center">

          <div className="stitch-hero-panel rounded-extra-large p-6 sm:p-8">

            <AnimatePresence mode="wait">

              <motion.div

                key={currentQuestion.id}

                initial={{ opacity: 0, y: 8 }}

                animate={{ opacity: 1, y: 0 }}

                exit={{ opacity: 0, y: -6 }}

                transition={{ duration: 0.2 }}

                className="mb-8 text-center"

              >

                <h2 className="stitch-headline whitespace-pre-line text-balance text-lg leading-[1.55] sm:text-xl">

                  {currentQuestion.prompt}

                </h2>

              </motion.div>

            </AnimatePresence>



            <div className="flex flex-col gap-3">

              {currentQuestion.options.map((opt) => {

                const selected = answers[currentQuestion.id] === opt.value;

                return (

                  <button

                    key={opt.value}

                    type="button"

                    onClick={() => pickAnswer(opt.value)}

                    disabled={busy || advancing}

                    className={`min-h-[52px] rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] font-medium leading-snug transition-all disabled:opacity-50 ${

                      selected

                        ? "border-primary bg-primary/10 text-primary shadow-sm"

                        : "border-outline-variant/55 bg-surface text-on-surface hover:border-primary/35"

                    }`}

                  >

                    {opt.label}

                  </button>

                );

              })}

            </div>

          </div>

        </div>

      </main>



      {currentIndex > 0 && (

        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#faf7f0] via-[#faf7f0]/96 to-transparent px-5 pb-8 pt-16">

          <div className="pointer-events-auto mx-auto max-w-[420px]">

            <button

              type="button"

              onClick={goPrev}

              disabled={busy || advancing}

              className="rounded-2xl border border-outline-variant/60 bg-surface px-5 py-3.5 text-sm font-medium text-on-surface-variant transition hover:border-primary/35 hover:text-primary disabled:opacity-40"

            >

              ← Back

            </button>

          </div>

        </div>

      )}

    </StitchSurveyShell>

  );

}

