"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteTokenFromUrl = searchParams.get("token") || "";

  const [inviteToken, setInviteToken] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 URL에서 token 가져와서 저장
  useEffect(() => {
    if (inviteTokenFromUrl) {
      localStorage.setItem("inviteToken", inviteTokenFromUrl);
      setInviteToken(inviteTokenFromUrl);
    }
  }, [inviteTokenFromUrl]);

  const title = useMemo(() => {
    return inviteToken ? "관계 리포트 시작하기" : "ahaitsme";
  }, [inviteToken]);

  const subtitle = useMemo(() => {
    return inviteToken
      ? "친구 초대를 통해 들어왔어. 네 정보를 입력하면 다음 단계로 이어질 거야."
      : "생년월일시를 입력하고 나를 먼저 알아보자.";
  }, [inviteToken]);

  const handleSubmit = async () => {
    if (!name || !birthDate || !birthTime) {
      alert("모두 입력해주세요");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          name,
          birth_date: birthDate,
          birth_time: birthTime,
          report_type: inviteToken ? "relationship" : "self",
          plan_type: "free",
          payment_status: "none",
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error(error);
      alert("report 생성 실패");
      return;
    }

    localStorage.setItem("reportId", data.id);
    localStorage.setItem("birthDate", birthDate);
    localStorage.setItem("birthTime", birthTime);

    if (inviteToken) {
      localStorage.setItem("inviteToken", inviteToken);
    }

    // 🔥 token 유지해서 survey로 이동
    if (inviteToken) {
      router.push(`/survey?token=${inviteToken}`);
    } else {
      router.push("/survey");
    }
  };

  return (
    <main className="min-h-screen p-8 space-y-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-gray-600">{subtitle}</p>

      <input
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <input
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <input
        type="time"
        value={birthTime}
        onChange={(e) => setBirthTime(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded w-full"
      >
        {loading ? "생성 중..." : "다음"}
      </button>
    </main>
  );
}
