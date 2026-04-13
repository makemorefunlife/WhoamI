"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";

const QUESTIONS = [
  {
    id: "q1",
    text: "나는 상대가 잘못한 상황에서는\n‘잘못’ 자체가 먼저 보인다.",
  },
  { id: "q2", text: "나는 계획보다 즉흥적으로\n행동하는 편이다." },
  {
    id: "q3",
    text: "나는 혼자보다 사람들과 함께 있을 때\n에너지가 더 난다.",
  },

  {
    id: "q4",
    text: "나는 회의에서 먼저 의견을 내고\n주도하는 편이다.",
  },
  {
    id: "q5",
    text: "나는 갈등 상황에서\n분위기를 맞추는 쪽을 선택한다.",
  },
  {
    id: "q6",
    text: "나는 완벽하게 준비하기보다\n빠르게 결과를 내는 게 더 편하다.",
  },

  {
    id: "q7",
    text: "나는 다른 사람에게 인정받지 못하면\n의욕이 크게 떨어진다.",
  },
  {
    id: "q8",
    text: "나는 예상치 못한 상황에서\n쉽게 불안해진다.",
  },
  {
    id: "q9",
    text: "나는 다른 사람과 다른\n‘나만의 색깔’을 유지하는 것이 중요하다.",
  },

  {
    id: "q10",
    text: "나는 사람의 고민을 듣고\n해결을 함께 고민하는 걸 좋아한다.",
  },
  {
    id: "q11",
    text: "나는 복잡한 문제를 논리적으로 분해해서\n분석하는 게 더 편하다.",
  },
  {
    id: "q12",
    text: "나는 아이디어를 글이나 그림으로\n새롭게 표현하는 걸 좋아한다.",
  },

  {
    id: "q13",
    text: "최근 한 달간, 내 의지와 상관없이\n일이 꼬이는 상황이 자주 있었다.",
  },
  {
    id: "q14",
    text: "최근 한 달간, 특별한 이유 없이도\n마음이 편하지 않았다.",
  },
  {
    id: "q15",
    text: "최근 2주간, 아무것도 하기 싫고\n마음이 무거운 날이 많았다.",
  },

  {
    id: "q16",
    text: "나는 익숙한 곳보다\n새로운 자극이 있는 상황이 더 재미있다.",
  },
  {
    id: "q17",
    text: "나는 상대방의 감정을 쉽게 읽고,\n그 영향을 많이 받는다.",
  },
  { id: "q18", text: "나는 한 번 시작한 일은\n끝까지 해내는 편이다." },
] as const;

const STATUS_LINES = [
  "탐사하는 중",
  "특징 분석 중",
  "패턴 분석 중",
  "데이터를 모으고 있어요",
  "신호를 읽는 중이에요",
];

export default function SurveyPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("inviteToken", token);
    }
  }, []);

  const [answers, setAnswers] = useState(
    Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`q${i + 1}`, ""])),
  );

  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = useMemo(
    () => QUESTIONS[currentIndex],
    [currentIndex],
  );

  const statusLine = STATUS_LINES[currentIndex % STATUS_LINES.length];

  const submitSurveyWithAnswers = async (
    payload: Record<string, string>,
    e?: { preventDefault?: () => void },
  ) => {
    e?.preventDefault?.();

    if (Object.values(payload).some((v) => !v)) {
      alert("모두 선택해주세요");
      return;
    }

    setLoading(true);

    const reportId = localStorage.getItem("reportId");
    const inviteToken = localStorage.getItem("inviteToken");

    if (!reportId) {
      alert("reportId 없음. 처음부터 다시 시작해주세요.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("survey_responses").insert([
      {
        report_id: reportId,
        answers: payload,
      },
    ]);

    if (error) {
      console.error(error);
      alert("설문 저장 실패");
      setLoading(false);
      return;
    }

    if (inviteToken) {
      const res = await fetch("/api/invite/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken: inviteToken.trim(),
          reportId,
        }),
      });

      if (!res.ok) {
        let message = "초대 연결 처리 실패";
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) message = j.error;
        } catch {
          /* ignore */
        }
        console.error("invite complete:", message);
        alert(message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push(`/result?id=${reportId}`);
  };

  const pickAnswer = (opt: "Y" | "N") => {
    if (loading || advancing) return;
    const next = { ...answers, [currentQuestion.id]: opt };
    setAnswers(next);
    if (currentIndex < 17) {
      setAdvancing(true);
      window.setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setAdvancing(false);
      }, 160);
    } else {
      void submitSurveyWithAnswers(next);
    }
  };

  const goPrev = () => {
    if (loading || advancing || currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
  };

  return (
    <SpaceBackground showProbe={false}>
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[#070B14]/82 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[420px] px-5 py-4">
          <div className="mb-2 flex justify-between text-[11px] font-medium uppercase tracking-[0.12em] text-[rgba(255,255,255,0.65)]">
            <span className="text-[#67B7FF]">Survey</span>
            <span className="tabular-nums text-[rgba(255,255,255,0.75)]">
              {currentIndex + 1} / 18 ·{" "}
              {Math.round(((currentIndex + 1) / 18) * 100)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#67B7FF] to-[#8B7CFF] shadow-[0_0_12px_rgba(103,183,255,0.35)]"
              initial={false}
              animate={{ width: `${((currentIndex + 1) / 18) * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-[rgba(255,255,255,0.55)]">
            {statusLine}
          </p>
        </div>
      </div>

      <main className="flex min-h-screen flex-col items-center px-5 pb-32 pt-32 text-[rgba(255,255,255,0.95)]">
        <p className="mb-8 max-w-[420px] text-center text-sm leading-relaxed text-[rgba(255,255,255,0.7)]">
          짧은 질문에 답하면 탐사 경로가 완성됩니다.
        </p>

        <div className="flex w-full max-w-[420px] flex-1 flex-col justify-center">
          <GlassCard className="!py-9 sm:!py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mb-10 text-center"
              >
                <h2 className="whitespace-pre-line text-balance text-lg font-medium leading-[1.55] text-[rgba(255,255,255,0.95)] sm:text-[1.125rem]">
                  {currentQuestion.text}
                </h2>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={() => pickAnswer("Y")}
                disabled={loading || advancing}
                className={`min-h-[56px] flex-1 rounded-2xl border-2 py-4 text-base font-semibold tracking-wide transition-all disabled:opacity-50 ${
                  answers[currentQuestion.id as keyof typeof answers] === "Y"
                    ? "border-[#67B7FF]/70 bg-[#67B7FF]/18 text-white shadow-[0_0_28px_rgba(103,183,255,0.28)]"
                    : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.92)] hover:border-[#67B7FF]/35"
                }`}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => pickAnswer("N")}
                disabled={loading || advancing}
                className={`min-h-[56px] flex-1 rounded-2xl border-2 py-4 text-base font-semibold tracking-wide transition-all disabled:opacity-50 ${
                  answers[currentQuestion.id as keyof typeof answers] === "N"
                    ? "border-[#8B7CFF]/65 bg-[#8B7CFF]/16 text-white shadow-[0_0_26px_rgba(139,124,255,0.28)]"
                    : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.92)] hover:border-[#8B7CFF]/35"
                }`}
              >
                NO
              </button>
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
              disabled={loading || advancing}
              className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-5 py-3.5 text-sm font-medium text-[rgba(255,255,255,0.75)] backdrop-blur-sm transition-all hover:border-[rgba(255,255,255,0.2)] hover:text-white disabled:opacity-40"
            >
              ← 이전
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#070B14]/78 backdrop-blur-sm">
          <div className="glass-card mx-6 max-w-sm rounded-[24px] px-8 py-10 text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.12)] border-t-[#67B7FF]" />
            <p className="text-sm font-medium text-[rgba(255,255,255,0.95)]">
              신호를 해석하고 있습니다
            </p>
            <p className="mt-2 text-xs text-[rgba(255,255,255,0.6)]">
              데이터를 전송하는 중이에요.
            </p>
            <div className="mt-6 space-signal-bar" />
          </div>
        </div>
      )}
    </SpaceBackground>
  );
}
