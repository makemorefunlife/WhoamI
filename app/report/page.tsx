"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function ReportPage() {
  const searchParams = useSearchParams();

  const [report, setReport] = useState<any>(null);
  const [interpretations, setInterpretations] = useState<
    Record<string, string>
  >({});
  const [patternsForView, setPatternsForView] = useState<
    Record<string, string>
  >({});
  const [inviteUrl, setInviteUrl] = useState("");
  const [relationship, setRelationship] = useState("");
  const [hasRelationship, setHasRelationship] = useState(false);
  const [loading, setLoading] = useState(true);

  const reportId = searchParams.get("id") || "";
  const shareUrl = reportId ? `/report?id=${reportId}` : "";

  const normalizeYN = (value: any): string => {
    const v = String(value ?? "")
      .trim()
      .toUpperCase();
    if (v === "Y" || v === "YES") return "Y";
    if (v === "N" || v === "NO") return "N";
    return "";
  };

  const getPattern = (a: any, b: any, c: any) => {
    return `${normalizeYN(a)}${normalizeYN(b)}${normalizeYN(c)}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!reportId) return;

      const { data: reportData } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .maybeSingle();

      setReport(reportData);

      const { data: responseData, error: responseError } = await supabase
        .from("survey_responses")
        .select("answers")
        .eq("report_id", reportId)
        .maybeSingle();

      if (responseError) {
        console.error("answers 가져오기 실패:", responseError);
      }

      if (responseData?.answers) {
        const ans = responseData.answers;

        console.log("raw answers:", ans);

        const patterns: Record<string, string> = {
          mbti: getPattern(ans.q1, ans.q2, ans.q3),
          disc: getPattern(ans.q4, ans.q5, ans.q6),
          enneagram: getPattern(ans.q7, ans.q8, ans.q9),
          riasec: getPattern(ans.q10, ans.q11, ans.q12),
          pss: getPattern(ans.q13, ans.q14, ans.q15),
          tci: getPattern(ans.q16, ans.q17, ans.q18),
        };

        console.log("computed patterns:", patterns);

        setPatternsForView(patterns);

        const result: Record<string, string> = {};

        for (const [domain, pattern] of Object.entries(patterns)) {
          if (
            !pattern ||
            pattern.length !== 3 ||
            pattern.includes("undefined")
          ) {
            result[domain] = "패턴 계산 실패";
            continue;
          }

          const { data, error } = await supabase
            .from("pattern_base")
            .select("interpretation")
            .eq("domain", domain)
            .eq("pattern", pattern.trim())
            .maybeSingle();

          console.log("lookup:", { domain, pattern, data, error });

          result[domain] = data?.interpretation || "해석 없음";
        }

        setInterpretations(result);
      } else {
        console.log("answers 없음");
      }

      const { data: invites } = await supabase
        .from("invites")
        .select("*")
        .or(`accepted_report_id.eq.${reportId},from_report_id.eq.${reportId}`);

      if (invites && invites.length > 0) {
        setHasRelationship(true);

        if (invites[0].relationship_result) {
          setRelationship(invites[0].relationship_result);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [reportId]);

  const handleCopy = async () => {
    if (!shareUrl) return alert("링크 없음");
    await navigator.clipboard.writeText(shareUrl);
    alert("복사 완료");
  };

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
      alert(data.error);
      return;
    }

    const token = data.invite.invite_token;

    let origin = "";
    if (typeof window !== "undefined") {
      origin = window.location.origin;
    }

    const url = `${origin}/?token=${token}`;
    setInviteUrl(url);
  };

  const handleRelationship = async () => {
    const { data: invites } = await supabase
      .from("invites")
      .select("*")
      .or(`accepted_report_id.eq.${reportId},from_report_id.eq.${reportId}`);

    if (!invites || invites.length === 0) {
      alert("관계 없음");
      return;
    }

    const invite = invites[0];
    const inviteToken = invite.invite_token;

    const res = await fetch("/api/relationship/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inviteToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    setRelationship(data.relationship);
  };

  if (loading) return <div className="p-8">로딩중...</div>;

  const labelMap: Record<string, string> = {
    mbti: "MBTI",
    disc: "DISC",
    enneagram: "ENNEAGRAM",
    riasec: "RIASEC",
    pss: "PSS",
    tci: "TCI",
  };

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">리포트</h1>

      <div className="border p-4 rounded space-y-3">
        <h2 className="font-semibold">분석 결과</h2>

        {Object.entries(labelMap).map(([key]) => (
          <div key={key}>
            <p>{interpretations[key] || "해석 없음"}</p>
          </div>
        ))}
      </div>

      <div className="border p-4 rounded">
        <QRCodeSVG value={shareUrl} size={160} />

        <button
          onClick={handleCopy}
          className="bg-black text-white px-4 py-2 mt-2 rounded"
        >
          링크 복사
        </button>
      </div>

      {report?.report_type === "self" && (
        <div className="border p-4 rounded">
          <button
            onClick={handleCreateInvite}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            친구 초대 만들기
          </button>

          {inviteUrl && (
            <>
              <p className="mt-2 text-sm break-all">{inviteUrl}</p>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl);
                  alert("초대 링크 복사됨");
                }}
                className="bg-black text-white px-3 py-1 rounded mt-2"
              >
                초대 링크 복사
              </button>

              <QRCodeSVG value={inviteUrl} size={160} />
            </>
          )}
        </div>
      )}

      {hasRelationship && (
        <div className="border p-4 rounded">
          <button
            onClick={handleRelationship}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            관계 분석 보기
          </button>

          {relationship && <p className="mt-3">{relationship}</p>}
        </div>
      )}
    </main>
  );
}
