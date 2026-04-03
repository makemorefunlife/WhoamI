"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function ReportContent() {
  const searchParams = useSearchParams();

  const [report, setReport] = useState<any>(null);
  const [interpretations, setInterpretations] = useState<
    Record<string, string>
  >({});
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const reportId = searchParams.get("id") || "";
  const shareUrl = reportId ? `/report?id=${reportId}` : "";

  // ---------------------------
  // 데이터 불러오기
  // ---------------------------
  useEffect(() => {
    const fetchData = async () => {
      if (!reportId) return;

      const { data: reportData } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .maybeSingle();

      setReport(reportData);

      const { data: responseData } = await supabase
        .from("survey_responses")
        .select("answers")
        .eq("report_id", reportId)
        .maybeSingle();

      if (responseData?.answers) {
        const ans = responseData.answers;

        const result: Record<string, string> = {
          mbti: `${ans.q1}${ans.q2}${ans.q3}`,
          disc: `${ans.q4}${ans.q5}${ans.q6}`,
          enneagram: `${ans.q7}${ans.q8}${ans.q9}`,
          riasec: `${ans.q10}${ans.q11}${ans.q12}`,
          pss: `${ans.q13}${ans.q14}${ans.q15}`,
          tci: `${ans.q16}${ans.q17}${ans.q18}`,
        };

        setInterpretations(result);
      }

      setLoading(false);
    };

    fetchData();
  }, [reportId]);

  // ---------------------------
  // 친구 초대 생성
  // ---------------------------
  const handleCreateInvite = async () => {
    const res = await fetch("/api/invite/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("초대 생성 실패");
      return;
    }

    const token = data.invite?.invite_token;

    if (!token) {
      alert("토큰 없음");
      return;
    }

    const url = `${window.location.origin}/?token=${token}`;
    setInviteUrl(url);
  };

  if (loading) return <div className="p-8">로딩중...</div>;

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <main className="p-8 space-y-6">
      {" "}
      <h1 className="text-2xl font-bold">리포트</h1>
      {/* 결과 */}
      <div className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">분석 결과</h2>
        {Object.entries(interpretations).map(([key, value]) => (
          <p key={key}>
            {key}: {value}
          </p>
        ))}
      </div>
      {/* QR */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold">공유 QR</h2>
        <QRCodeSVG value={shareUrl} size={160} />
      </div>
      {/* 친구 초대 */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold">친구와 궁합 보기</h2>

        <button
          onClick={handleCreateInvite}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          친구 초대하기
        </button>

        {inviteUrl && (
          <div className="mt-3">
            <p className="text-sm break-all">{inviteUrl}</p>

            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                alert("복사 완료");
              }}
              className="bg-black text-white px-3 py-1 rounded mt-2"
            >
              링크 복사
            </button>

            <QRCodeSVG value={inviteUrl} size={160} className="mt-2" />
          </div>
        )}
      </div>
    </main>
  );
}
