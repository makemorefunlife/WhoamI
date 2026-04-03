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
  const [patternsForView, setPatternsForView] = useState<
    Record<string, string>
  >({});
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

      const { data: responseData } = await supabase
        .from("survey_responses")
        .select("answers")
        .eq("report_id", reportId)
        .maybeSingle();

      if (responseData?.answers) {
        const ans = responseData.answers;

        const patterns: Record<string, string> = {
          mbti: getPattern(ans.q1, ans.q2, ans.q3),
          disc: getPattern(ans.q4, ans.q5, ans.q6),
          enneagram: getPattern(ans.q7, ans.q8, ans.q9),
          riasec: getPattern(ans.q10, ans.q11, ans.q12),
          pss: getPattern(ans.q13, ans.q14, ans.q15),
          tci: getPattern(ans.q16, ans.q17, ans.q18),
        };

        setPatternsForView(patterns);

        const result: Record<string, string> = {};

        for (const [domain, pattern] of Object.entries(patterns)) {
          const { data } = await supabase
            .from("pattern_base")
            .select("interpretation")
            .eq("domain", domain)
            .eq("pattern", pattern.trim())
            .maybeSingle();

          result[domain] = data?.interpretation || "해석 없음";
        }

        setInterpretations(result);
      }

      setLoading(false);
    };

    fetchData();
  }, [reportId]);

  if (loading) {
    return <div className="p-8">로딩중...</div>;
  }

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
      ```
      <div className="border p-4 rounded space-y-3">
        {Object.entries(labelMap).map(([key]) => (
          <div key={key}>
            <p>{interpretations[key] || "해석 없음"}</p>
          </div>
        ))}
      </div>
      <QRCodeSVG value={shareUrl} size={160} />
      ```
    </main>
  );
}
