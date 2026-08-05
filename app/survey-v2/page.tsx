"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";
import { getSurveyQuestions } from "@/lib/v2/survey/getSurveyQuestions";
import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";
import {
  clearSurveyV2Session,
  readSurveyV2Session,
  writeSurveyV2Session,
} from "@/lib/v2/survey/session";
import {
  clearPendingSurveyDraft,
  readPendingSurveyDraft,
  writePendingSurveyDraft,
} from "@/lib/v2/survey/pendingDraft";
import {
  clearSurveyOnServer,
  persistSurveyToServer,
} from "@/lib/v2/survey/surveyClient";
import { createOwnedReportIdempotent } from "@/lib/v2/survey/createOwnedReportIdempotent";
import { finalizeSurveySubmit } from "@/lib/v2/survey/finalizeSurveySubmit";
import { resolveCanonicalReportIdClient } from "@/lib/home/resolveCanonicalReportIdClient";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { SCORED_QUESTION_IDS } from "@/lib/v2/survey/types";

const HomeAuthSignInPanel = dynamic(
  () => import("@/components/survey/SurveyAuthSignInPanel"),
  { ssr: false },
);

const STATUS_LINES = [
  "Exploring",
  "Reading patterns",
  "Mapping traits",
  "Gathering signals",
  "Almost there",
];

const EMPTY_ANSWERS = Object.fromEntries(
  [...SCORED_QUESTION_IDS, "q10"].map((id) => [id, ""]),
);

/** Set only when user deliberately awaits sign-in; never on submit failure. */
const PENDING_COMPLETE_KEY = "ahaitsme_v2_survey_pending_complete";

export default function SurveyV2Page() {
  const router = useRouter();
  const { locale, messages, href: localize } = useLocale();
  const questions = useMemo(() => getSurveyQuestions(locale), [locale]);
  const questionCount = questions.length;
  const { isLoaded, isSignedIn } = useClerkReady();
  const [sessionReady, setSessionReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(EMPTY_ANSWERS);
  const [finishing, setFinishing] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const ownedReportIdRef = useRef<string>("");
  const submitStartedRef = useRef(false);
  const postLoginResumeConsumedRef = useRef(false);
  const errorShownRef = useRef(false);

  const busy = finishing;

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const wantRedo = params.get("redo") === "1";
      const urlReportId = params.get("reportId")?.trim() ?? "";
      if (token) localStorage.setItem("inviteToken", token);

      const pending = readPendingSurveyDraft();
      let reportId = "";

      if (isSignedIn) {
        const resolved = await resolveCanonicalReportIdClient(
          urlReportId,
          "survey-v2",
        );
        reportId = resolved.canonicalReportId;
        ownedReportIdRef.current = reportId;
      } else if (urlReportId) {
        reportId = "";
      }

      if (wantRedo && reportId && isSignedIn) {
        clearSurveyV2Session(reportId);
        clearPendingSurveyDraft();
        await clearSurveyOnServer(reportId);
        if (!cancelled) {
          setAnswers(EMPTY_ANSWERS);
          setCurrentIndex(0);
          setSessionReady(true);
        }
        return;
      }

      if (reportId) {
        const prior = readSurveyV2Session(reportId);
        if (prior && isSurveyV2AnswersComplete(prior.answers)) {
          router.replace(
            localize(`/survey-v2/complete?reportId=${encodeURIComponent(reportId)}`),
          );
          return;
        }
        if (!cancelled) {
          if (prior?.answers) {
            setAnswers({ ...EMPTY_ANSWERS, ...prior.answers });
          } else if (pending?.answers) {
            setAnswers({ ...EMPTY_ANSWERS, ...pending.answers });
            if (typeof pending.currentIndex === "number") {
              setCurrentIndex(pending.currentIndex);
            }
          }
          setSessionReady(true);
        }
        return;
      }

      if (!cancelled) {
        if (pending?.answers) {
          setAnswers({ ...EMPTY_ANSWERS, ...pending.answers });
          if (typeof pending.currentIndex === "number") {
            setCurrentIndex(
              Math.min(
                Math.max(0, pending.currentIndex),
                questionCount - 1,
              ),
            );
          }
        }
        setSessionReady(true);
      }
    }

    if (!isLoaded) return;
    void boot();
    return () => {
      cancelled = true;
    };
  }, [router, isLoaded, isSignedIn, localize, questionCount]);

  useEffect(() => {
    if (!sessionReady) return;
    writePendingSurveyDraft({ answers, currentIndex });
  }, [answers, currentIndex, sessionReady]);

  const showSubmitErrorOnce = useCallback((message: string) => {
    if (errorShownRef.current) return;
    errorShownRef.current = true;
    alert(message);
  }, []);

  const completeAfterLogin = useCallback(
    async (payload: Record<string, string>) => {
      if (submitStartedRef.current) return;
      submitStartedRef.current = true;
      setFinishing(true);
      errorShownRef.current = false;
      // Never leave pending armed across a failed submit (prevents effect retry storm).
      sessionStorage.removeItem(PENDING_COMPLETE_KEY);

      const result = await finalizeSurveySubmit(payload, {
        createOwnedReport: createOwnedReportIdempotent,
        persistSurvey: persistSurveyToServer,
        scoreAnswers: scoreSurveyAnswers,
        writeLocalSession: writeSurveyV2Session,
        clearPendingDraft: clearPendingSurveyDraft,
      });

      if (!result.ok) {
        showSubmitErrorOnce(result.error);
        setFinishing(false);
        submitStartedRef.current = false;
        return;
      }

      ownedReportIdRef.current = result.reportId;
      router.push(
        localize(
          `/survey-v2/complete?reportId=${encodeURIComponent(result.reportId)}`,
        ),
      );
    },
    [router, localize, showSubmitErrorOnce],
  );

  // Post-sign-in resume only: consume PENDING_COMPLETE once. Failures must not re-arm it.
  useEffect(() => {
    if (!isSignedIn || !sessionReady || finishing) return;
    if (postLoginResumeConsumedRef.current) return;
    if (sessionStorage.getItem(PENDING_COMPLETE_KEY) !== "1") return;
    const draft = readPendingSurveyDraft();
    const payload = draft?.answers ?? answers;
    if (!isSurveyV2AnswersComplete(payload)) return;
    postLoginResumeConsumedRef.current = true;
    sessionStorage.removeItem(PENDING_COMPLETE_KEY);
    void completeAfterLogin(payload);
  }, [isSignedIn, sessionReady, finishing, answers, completeAfterLogin]);

  const finishSurvey = async (payload: Record<string, string>) => {
    if (submitStartedRef.current || finishing) return;
    if (!isSurveyV2AnswersComplete(payload)) {
      alert("Please answer every question.");
      return;
    }

    writePendingSurveyDraft({ answers: payload, currentIndex });

    if (!isSignedIn) {
      postLoginResumeConsumedRef.current = false;
      sessionStorage.setItem(PENDING_COMPLETE_KEY, "1");
      setAuthModalOpen(true);
      return;
    }

    await completeAfterLogin(payload);
  };

  const cancelAuth = () => {
    setAuthModalOpen(false);
    sessionStorage.removeItem(PENDING_COMPLETE_KEY);
    postLoginResumeConsumedRef.current = false;
    setFinishing(false);
    submitStartedRef.current = false;
  };

  const pickAnswer = (value: string) => {
    if (busy || advancing || submitStartedRef.current) return;

    const next = { ...answers, [currentQuestion.id]: value };
    setAnswers(next);

    const isLast = currentIndex >= questionCount - 1;
    if (!isLast) {
      setAdvancing(true);
      window.setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setAdvancing(false);
      }, 160);
    } else {
      void finishSurvey(next);
    }
  };

  const goPrev = useCallback(() => {
    if (busy || advancing || currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
  }, [advancing, busy, currentIndex]);

  const currentQuestion = useMemo(
    () => questions[currentIndex],
    [currentIndex, questions],
  );

  const statusLine = STATUS_LINES[currentIndex % STATUS_LINES.length];
  const progressPct = Math.round(
    ((currentIndex + 1) / questionCount) * 100,
  );

  if (!sessionReady || !isLoaded) {
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
            <span className="text-secondary">{messages.survey.title}</span>
            <span className="tabular-nums text-primary">
              {currentIndex + 1} / {questionCount}
            </span>
          </div>
          <div className="mb-2 flex justify-center gap-1.5">
            {questions.map((q, i) => (
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
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-on-surface-variant">
            {statusLine}
          </p>
        </div>
      </div>

      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-5 pb-28 pt-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 flex-col"
          >
            <h1 className="mb-8 text-balance text-[1.35rem] font-semibold leading-snug text-on-surface">
              {currentQuestion.prompt}
            </h1>
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((opt: { value: string; label: string }) => {
                const selected = answers[currentQuestion.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={busy || advancing}
                    onClick={() => pickAnswer(opt.value)}
                    className={`rounded-2xl border px-4 py-3.5 text-left text-[0.95rem] transition ${
                      selected
                        ? "border-primary bg-primary/10 text-on-surface"
                        : "border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={busy || advancing || currentIndex <= 0}
            className="text-sm text-on-surface-variant disabled:opacity-40"
          >
            Back
          </button>
          {finishing ? (
            <span className="text-sm text-on-surface-variant">Saving…</span>
          ) : null}
        </div>
      </div>

      {authModalOpen ? (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={cancelAuth}
          />
          <div className="relative z-[1] w-full max-w-md rounded-2xl bg-[#faf7f0] p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-on-surface">
                  Sign in to save
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Your answers stay on this device until you sign in. Canceling
                  keeps you on the survey.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelAuth}
                className="text-sm text-on-surface-variant"
              >
                Cancel
              </button>
            </div>
            <HomeAuthSignInPanel />
          </div>
        </div>
      ) : null}
    </StitchSurveyShell>
  );
}
