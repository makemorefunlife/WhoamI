"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SurveyPage() {
  const router = useRouter();

  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
    q6: "",
  });

  const [loading, setLoading] = useState(false);

  const questions = [
    {
      id: "q1",
      text: "하루 끝나고, 뭐가 더 좋아?",
      options: ["사람 만나서 수다 떨고 놀기", "혼자 조용히 충전하기"],
    },
    {
      id: "q2",
      text: "팀플할 때, 너는 보통 뭐 하는 사람이야?",
      options: [
        "앞장서는 타입",
        "분위기 띄우는 타입",
        "시키는 일 묵묵히 하는 타입",
        "규칙대로 체계적으로 하는 타입",
      ],
    },
    {
      id: "q3",
      text: "인생에서 네가 제일 중요하게 여기는 게 뭐야?",
      options: [
        "옳고 그름",
        "사랑받는 것",
        "성과 인정",
        "나다움",
        "이해 후 판단",
        "안전한 관계",
        "자유로운 경험",
        "내 영향력",
        "편안한 조화",
      ],
    },
    {
      id: "q4",
      text: "일할 때, 이 순간이 제일 재밌어. 언제야?",
      options: [
        "손으로 만들 때",
        "문제 해결할 때",
        "아이디어 낼 때",
        "사람 도울 때",
        "이끌어서 목표 달성할 때",
        "정리하고 체계화할 때",
      ],
    },
    {
      id: "q5",
      text: "사람들이 너한테 제일 많이 하는 말이 뭐야?",
      options: [
        "독특하다",
        "믿음직스럽다",
        "따뜻하다",
        "책임감 있다",
        "긍정적이다",
      ],
    },
    {
      id: "q6",
      text: "요즘 2주 동안, 속마음이 어땠어?",
      options: [
        "괜찮았어",
        "가끔 피곤하고 짜증",
        "자주 우울하고 무기력",
        "매일 힘들었어",
      ],
    },
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

    const interpretations = {
      q1:
        answers.q1 === "사람 만나서 수다 떨고 놀기"
          ? "사람과 연결될 때 에너지가 살아나는 편일 수 있어."
          : "혼자만의 시간에서 회복하는 힘이 큰 편일 수 있어.",
      q2:
        answers.q2 === "앞장서는 타입"
          ? "필요할 때 흐름을 이끄는 역할을 자연스럽게 맡는 편일 수 있어."
          : answers.q2 === "분위기 띄우는 타입"
            ? "관계의 공기를 부드럽게 만드는 감각이 있는 편일 수 있어."
            : answers.q2 === "시키는 일 묵묵히 하는 타입"
              ? "과하게 드러내지 않아도 자기 몫을 안정적으로 해내는 편일 수 있어."
              : "체계와 기준을 세워 안정감을 만드는 편일 수 있어.",
      q3:
        answers.q3 === "나다움"
          ? "무엇보다도 내 방식과 진짜 마음을 중요하게 여기는 편일 수 있어."
          : "삶에서 중요하게 생각하는 기준이 꽤 분명한 편일 수 있어.",
      q4:
        answers.q4 === "문제 해결할 때"
          ? "복잡한 상황을 풀어내는 과정에서 몰입이 생기는 편일 수 있어."
          : answers.q4 === "사람 도울 때"
            ? "누군가에게 실질적으로 도움이 되는 순간 보람을 느끼는 편일 수 있어."
            : "재미를 느끼는 순간이 비교적 선명한 편일 수 있어.",
      q5:
        answers.q5 === "믿음직스럽다"
          ? "주변에서 안정감 있는 사람으로 느끼는 경우가 많을 수 있어."
          : answers.q5 === "독특하다"
            ? "너만의 결이나 시선을 가진 사람으로 보일 수 있어."
            : "타인이 느끼는 강점이 비교적 분명한 편일 수 있어.",
      q6:
        answers.q6 === "매일 힘들었어"
          ? "최근에는 마음과 에너지가 많이 소모된 시기일 수 있어."
          : answers.q6 === "자주 우울하고 무기력"
            ? "지금은 잠깐 멈춰서 나를 챙겨야 하는 흐름일 수 있어."
            : answers.q6 === "가끔 피곤하고 짜증"
              ? "겉으로는 버티고 있어도 안쪽 피로가 조금 쌓여 있을 수 있어."
              : "비교적 괜찮은 흐름을 유지하고 있는 편일 수 있어.",
    };

    const { error } = await supabase.from("survey_responses").insert([
      {
        report_id: reportId,
        q1: answers.q1,
        q2: answers.q2,
        q3: answers.q3,
        q4: answers.q4,
        q5: answers.q5,
        q6: answers.q6,
        interpretations,
      },
    ]);

    if (error) {
      console.error(error);
      alert("설문 저장 실패");
      setLoading(false);
      return;
    }

    if (inviteToken) {
      console.log("inviteToken:", inviteToken);

      const acceptRes = await fetch("/api/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteToken,
          reportId,
        }),
      });

      const acceptData = await acceptRes.json();

      if (!acceptRes.ok) {
        console.error("초대 수락 실패:", acceptData.error);
      } else {
        console.log("초대 연결 성공:", acceptData);
        localStorage.removeItem("inviteToken");
      }
    }

    setLoading(false);
    router.push(`/report?id=${reportId}`);
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">나 알아보기</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        {questions.map((q) => (
          <div key={q.id}>
            <label className="block mb-2">{q.text}</label>

            <select
              value={answers[q.id as keyof typeof answers]}
              onChange={(e) =>
                setAnswers({ ...answers, [q.id]: e.target.value })
              }
              className="w-full border p-2 rounded"
              required
            >
              <option value="">선택</option>
              {q.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
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
