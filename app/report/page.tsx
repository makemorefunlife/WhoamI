"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { generateCombinedReport } from "@/lib/combined/generate";

export default function ReportPage() {
  const searchParams = useSearchParams();

  const [report, setReport] = useState<any>(null);
  const [survey, setSurvey] = useState<any>(null);
  const [saju, setSaju] = useState<any>(null);
  const [combined, setCombined] = useState<any>(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingInvite, setCreatingInvite] = useState(false);

  const reportId = searchParams.get("id") || "";

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !reportId) return "";
    return `${window.location.origin}/report?id=${reportId}`;
  }, [reportId]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (!reportId) {
          alert("report id 없음");
          setLoading(false);
          return;
        }

        // report 가져오기
        const { data: reportData, error: reportError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .single();

        if (reportError) {
          console.error(reportError);
          setLoading(false);
          return;
        }

        setReport(reportData);

        // 설문 가져오기
        const { data: surveyData } = await supabase
          .from("survey_responses")
          .select("*")
          .eq("report_id", reportId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        setSurvey(surveyData);

        // 만세력
        if (reportData?.birth_date && reportData?.birth_time) {
          const res = await fetch("/api/saju", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              birthDate: reportData.birth_date,
              birthTime: reportData.birth_time,
              reportId,
            }),
          });

          const sajuData = await res.json();

          if (res.ok) {
            setSaju(sajuData.saju);

            const combinedResult = generateCombinedReport(
              surveyData,
              sajuData.sajuInterpretation,
            );

            setCombined(combinedResult);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [reportId]);

  const interpretationsList = survey?.interpretations
    ? (Object.values(survey.interpretations) as string[])
    : [];

  // 🔹 리포트 링크 복사
  const handleCopy = async () => {
    if (!shareUrl) {
      alert("링크 생성 중입니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("리포트 링크 복사 완료");
    } catch (err) {
      alert("복사 실패");
    }
  };

  // 🔹 초대 생성
  const handleCreateInvite = async () => {
    if (!reportId) return;

    setCreatingInvite(true);

    try {
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "초대 생성 실패");
        return;
      }

      const token = data.invite?.invite_token;

      const fullUrl = `${window.location.origin}/invite?token=${token}`;
      setInviteUrl(fullUrl);
    } catch (err) {
      console.error(err);
      alert("초대 생성 오류");
    } finally {
      setCreatingInvite(false);
    }
  };

  // 🔹 초대 링크 복사
  const handleCopyInvite = async () => {
    if (!inviteUrl) {
      alert("초대 링크 없음");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert("초대 링크 복사 완료");
    } catch (err) {
      alert("복사 실패");
    }
  };

  if (loading) {
    return (
      <main className="p-8">
        <p>로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">리포트</h1>

      {/* 핵심 결과 */}
      {combined && (
        <div className="bg-yellow-50 p-4 rounded">
          <p>{combined.now}</p>
          <p>{combined.sajuView}</p>
          <p>{combined.suggestion}</p>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="bg-gray-100 p-4 rounded">
        <p>{report?.birth_date}</p>
        <p>{report?.birth_time}</p>
      </div>

      {/* 설문 */}
      {survey && (
        <div className="bg-gray-100 p-4 rounded">
          <p>{survey.q1}</p>
          <p>{survey.q2}</p>
          <p>{survey.q3}</p>
          <p>{survey.q4}</p>
          <p>{survey.q5}</p>
          <p>{survey.q6}</p>
        </div>
      )}

      {/* 해석 */}
      {interpretationsList.length > 0 && (
        <div className="bg-blue-50 p-4 rounded">
          {interpretationsList.map((text, idx) => (
            <p key={idx}>{text}</p>
          ))}
        </div>
      )}

      {/* 만세력 */}
      {saju && (
        <div className="bg-purple-50 p-4 rounded">
          <p>{saju.yearPillar}</p>
          <p>{saju.monthPillar}</p>
          <p>{saju.dayPillar}</p>
          <p>{saju.hourPillar}</p>
        </div>
      )}

      {/* 🔥 리포트 공유 */}
      <div className="border p-4 rounded">
        <p className="text-sm break-all">{shareUrl}</p>

        <QRCodeSVG value={shareUrl} size={160} />

        <button
          onClick={handleCopy}
          className="bg-black text-white px-4 py-2 mt-2 rounded"
        >
          리포트 링크 복사
        </button>
      </div>

      {/* 🔥 친구 초대 (자기 리포트만 가능) */}
      {report?.report_type === "self" && (
        <div className="border p-4 rounded">
          {!inviteUrl && (
            <button
              onClick={handleCreateInvite}
              disabled={creatingInvite}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              {creatingInvite ? "생성 중..." : "친구 초대 만들기"}
            </button>
          )}

          {report?.report_type === "self" && !inviteUrl && (
            <>
              <p className="text-sm break-all">{inviteUrl}</p>

              <QRCodeSVG value={inviteUrl} size={160} />

              <button
                onClick={handleCopyInvite}
                className="bg-black text-white px-4 py-2 mt-2 rounded"
              >
                초대 링크 복사
              </button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
