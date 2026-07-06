"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import { isSurveyV2AnswersComplete } from "@/lib/v2/survey/completion";
import {
  SURVEY_V2_QUESTION_COUNT,
  SURVEY_V2_QUESTIONS,
} from "@/lib/v2/survey/questions";
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
import { hasBirthV2Session, readBirthV2Session } from "@/lib/v2/onboarding/birthSession";
import { hasMinimalBirth } from "@/lib/v2/onboarding/hydrateBirthSession";

const STATUS_LINES = [
  "탐사하는 중",
  "특징 분석 중",
  "패턴 분석 중",
  "데이터를 모으고 있어요",
  "신호를 읽는 중이에요",
];

const EMPTY_ANSWERS = Object.fromEntries(
  SURVEY_V2_QUESTIONS.map((q) => [q.id, ""]),
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
        const hasBirth =
          hasBirthV2Session(reportId) ||
          hasMinimalBirth(readBirthV2Session(reportId));
        router.replace(
          hasBirth
            ? `/blueprint-preview?reportId=${encodeURIComponent(reportId)}`
            : `/onboarding/birth?reportId=${encodeURIComponent(reportId)}`,
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
    () => SURVEY_V2_QUESTIONS[currentIndex],
    [currentIndex],
  );

  const statusLine = STATUS_LINES[currentIndex % STATUS_LINES.length];
  const progressPct = Math.round(
    ((currentIndex + 1) / SURVEY_V2_QUESTION_COUNT) * 100,
  );

  const finishSurvey = async (payload: Record<string, string>) => {
    if (!isSurveyV2AnswersComplete(payload)) {
      alert("모든 문항에 답해 주세요.");
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
          "설문 저장에 실패했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.",
      );
      setFinishing(false);
      return;
    }

    router.push(`/onboarding/birth?reportId=${encodeURIComponent(reportId)}`);
  };

  const pickAnswer = (value: string) => {
    if (busy || advancing) return;

    const next = { ...answers, [currentQuestion.id]: value };
    setAnswers(next);

    const isLast = currentIndex >= SURVEY_V2_QUESTION_COUNT - 1;
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

  const goPrev = () => {
    if (busy || advancing || currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
  };

  if (!sessionReady) {
    return (
      <SpaceBackground showProbe={false}>
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
          <p className="text-sm text-[rgba(255,255,255,0.55)]">
            궤도에 올리는 중…
          </p>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground showProbe={false}>
      <div className="fixed left-0 right-0 top-14 z-[190] border-b border-[rgba(255,255,255,0.08)] bg-[#070B14]/82 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[420px] px-5 py-4">
          <div className="mb-2 flex justify-between text-[11px] font-medium uppercase tracking-[0.12em] text-[rgba(255,255,255,0.65)]">
            <span className="text-[#67B7FF]">Survey</span>
            <span className="tabular-nums text-[rgba(255,255,255,0.75)]">
              {currentIndex + 1} / {SURVEY_V2_QUESTION_COUNT} · {progressPct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#67B7FF] to-[#8B7CFF] shadow-[0_0_12px_rgba(103,183,255,0.35)]"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-[rgba(255,255,255,0.55)]">
            {statusLine}
          </p>
        </div>
      </div>

      <main className="relative flex min-h-screen flex-col items-center px-5 pb-32 pt-44 text-[rgba(255,255,255,0.95)] sm:pt-48">
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.15)_0%,rgba(7,11,20,0.55)_55%,rgba(7,11,20,0.92)_100%)]"
          aria-hidden
        />

        <p className="relative z-[1] mb-8 max-w-[420px] text-center text-sm leading-relaxed text-[rgba(255,255,255,0.55)]">
          편하게, 가장 가까운 선택을 눌러 주세요.
        </p>

        <div className="relative z-[2] flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <GlassCard className="!border-white/[0.12] !py-9 !shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(103,183,255,0.12)] ring-1 ring-[#67B7FF]/15 sm:!py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mb-8 text-center"
              >
                <h2 className="whitespace-pre-line text-balance text-lg font-medium leading-[1.55] text-[rgba(255,255,255,0.95)] sm:text-[1.125rem]">
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
                        ? "border-[#67B7FF]/70 bg-[#67B7FF]/18 text-white shadow-[0_0_28px_rgba(103,183,255,0.28)]"
                        : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.92)] hover:border-[#67B7FF]/35"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </main>

      {currentIndex > 0 && (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#070B14] via-[#070B14]/96 to-transparent px-5 pb-8 pt-16">
          <div className="pointer-events-auto mx-auto max-w-[420px]">
            <button
              type="button"
              onClick={goPrev}
              disabled={busy || advancing}
              className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-5 py-3.5 text-sm font-medium text-[rgba(255,255,255,0.75)] backdrop-blur-sm transition-all hover:border-[rgba(255,255,255,0.2)] hover:text-white disabled:opacity-40"
            >
              ← 이전
            </button>
          </div>
        </div>
      )}
    </SpaceBackground>
  );
}
