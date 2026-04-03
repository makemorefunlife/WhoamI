"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SurveyPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("inviteToken", token);
    }
  }, []);

  // 🔥 answers 18개 자동 생성
  const [answers, setAnswers] = useState(
    Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`q${i + 1}`, ""])),
  );

  const [loading, setLoading] = useState(false);

  // 🔥 질문 18개 (Y/N 전용)
  const questions = [
    {
      id: "q1",
      text: "나는 상대가 잘못한 상황에서는 ‘잘못’ 자체가 먼저 보인다.",
    },
    { id: "q2", text: "나는 계획보다 즉흥적으로 행동하는 편이다." },
    { id: "q3", text: "나는 혼자보다 사람들과 함께 있을 때 에너지가 더 난다." },

    { id: "q4", text: "나는 회의에서 먼저 의견을 내고 주도하는 편이다." },
    { id: "q5", text: "나는 갈등 상황에서 분위기를 맞추는 쪽을 선택한다." },
    {
      id: "q6",
      text: "나는 완벽하게 준비하기보다 빠르게 결과를 내는 게 더 편하다.",
    },

    {
      id: "q7",
      text: "나는 다른 사람에게 인정받지 못하면 의욕이 크게 떨어진다.",
    },
    { id: "q8", text: "나는 예상치 못한 상황에서 쉽게 불안해진다." },
    {
      id: "q9",
      text: "나는 다른 사람과 다른 ‘나만의 색깔’을 유지하는 것이 중요하다.",
    },

    {
      id: "q10",
      text: "나는 사람의 고민을 듣고 해결을 함께 고민하는 걸 좋아한다.",
    },
    { id: "q11", text: "나는 복잡한 문제를 논리적으로 분석하는 게 더 편하다." },
    {
      id: "q12",
      text: "나는 아이디어를 글이나 그림으로 새롭게 표현하는 걸 좋아한다.",
    },

    {
      id: "q13",
      text: "최근 한 달간, 내 의지와 상관없이 일이 꼬이는 상황이 자주 있었다.",
    },
    {
      id: "q14",
      text: "최근 한 달간, 특별한 이유 없이도 마음이 편하지 않았다.",
    },
    {
      id: "q15",
      text: "최근 2주간, 아무것도 하기 싫고 마음이 무거운 날이 많았다.",
    },

    {
      id: "q16",
      text: "나는 익숙한 곳보다 새로운 자극이 있는 상황이 더 재미있다.",
    },
    {
      id: "q17",
      text: "나는 상대방의 감정을 쉽게 읽고, 그 영향을 많이 받는다.",
    },
    { id: "q18", text: "나는 한 번 시작한 일은 끝까지 해내는 편이다." },
  ];

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (Object.values(answers).some((v) => !v)) {
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
        answers, // 🔥 전체 answers 저장
      },
    ]);

    if (error) {
      console.error(error);
      alert("설문 저장 실패");
      setLoading(false);
      return;
    }

    if (inviteToken) {
      const { error } = await supabase
        .from("invites")
        .update({
          accepted_report_id: reportId,
          status: "accepted",
        })
        .eq("invite_token", inviteToken);

      if (!error) {
        localStorage.removeItem("inviteToken");
      }
    }

    setLoading(false);
    router.push(`/report?id=${reportId}`);
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">나 알아보기</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        {questions.map((q, index) => (
          <div key={q.id}>
            <label className="block mb-2">
              {index + 1}. {q.text}
            </label>

            <div className="flex gap-2">
              {["Y", "N"].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`px-4 py-2 border rounded ${
                    answers[q.id as keyof typeof answers] === opt
                      ? "bg-blue-500 text-white"
                      : ""
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "저장 중..." : "결과 보기"}
        </button>
      </form>
    </main>
  );
}
