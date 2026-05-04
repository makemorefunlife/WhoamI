"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import SurveyAnalyzingJourney from "@/components/space/SurveyAnalyzingJourney";
import UnifiedReportMarkdown from "@/components/report/UnifiedReportMarkdown";
import FreeResultAccordions from "@/components/report/FreeResultAccordions";
import DeepReportIntroPanel from "@/components/report/DeepReportIntroPanel";
import ReportBirthCaptureForm from "@/components/report/ReportBirthCaptureForm";
import SubtleButtonIcon from "@/components/ui/SubtleButtonIcon";
import {
  buildISODateFromParts,
  formatTimeInput,
  hasCompleteBirthInfo,
  parseBirthDateParts,
} from "@/lib/report/reportBirthUtils";
import {
  buildAstrologyContextForLlm,
  buildIntegratedPrompt,
  buildSurveyOnlyPrompt,
} from "@/lib/report/reportPromptBuilders";
import { getPattern, normalizeYN } from "@/lib/report/surveyPatternUtils";

function deepReportIntroStorageKey(reportId: string) {
  return `ahaitsme_deep_report_pre_form_intro_v1_${reportId}`;
}

function readDeepReportIntroSeen(reportId: string): boolean {
  if (!reportId || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(deepReportIntroStorageKey(reportId)) === "1";
  } catch {
    return false;
  }
}

function markDeepReportIntroSeen(reportId: string) {
  if (!reportId) return;
  try {
    localStorage.setItem(deepReportIntroStorageKey(reportId), "1");
  } catch {
    /* ignore */
  }
}

export default function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [report, setReport] = useState<any>(null);
  const [interpretations, setInterpretations] = useState<
    Record<string, string>
  >({});
  const [relationship, setRelationship] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [freeSummary, setFreeSummary] = useState<string | null>(null);
  const [paidSummary, setPaidSummary] = useState<string | null>(null);
  const [unifiedReport, setUnifiedReport] = useState<string | null>(null);
  const [reportStreaming, setReportStreaming] = useState(false);
  const [sajuStatus, setSajuStatus] = useState<{
    attempted: boolean;
    ok: boolean;
  }>({ attempted: false, ok: false });

  /** 심화: 페이지 안 단계(모달 없음) — intro → form(출생) → 결제 */
  const [deepFlow, setDeepFlow] = useState<null | "intro" | "form">(null);
  const viewParam = searchParams.get("view");
  const [resultViewTab, setResultViewTab] = useState<"basic" | "premium">(
    viewParam === "premium" ? "premium" : "basic",
  );
  const [sheetYear, setSheetYear] = useState("");
  const [sheetMonth, setSheetMonth] = useState("");
  const [sheetDay, setSheetDay] = useState("");
  const [sheetTime, setSheetTime] = useState("");
  const [sheetPlace, setSheetPlace] = useState("");
  const [sheetGender, setSheetGender] = useState("");
  const [sheetBusy, setSheetBusy] = useState(false);
  const [inviteUsed, setInviteUsed] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const afterPaymentHandled = useRef(false);
  const inviteUsedRef = useRef(false);
  inviteUsedRef.current = inviteUsed;

  const pathname = usePathname();
  const reportId = searchParams.get("id") || "";
  const afterPaymentFlag = searchParams.get("afterPayment") === "1";

  useEffect(() => {
    if (viewParam === "premium") setResultViewTab("premium");
    else if (viewParam === "basic") setResultViewTab("basic");
  }, [viewParam]);
  const displayName = report?.name?.trim() || "당신";

  const freeParagraphs = useMemo(() => {
    if (!freeSummary) return [];
    const blocks = freeSummary
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (blocks.length >= 2) return blocks;
    const lines = freeSummary
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.length ? lines : [freeSummary.trim()];
  }, [freeSummary]);

  const freeAccordionBodies = useMemo((): [
    string,
    string,
    string,
    string,
  ] => {
    const p = freeParagraphs.map((x) => x.trim()).filter(Boolean);
    const out = [...p];
    while (out.length < 4) out.push("");
    return out.slice(0, 4) as [string, string, string, string];
  }, [freeParagraphs]);

  const isDbPaid = report?.payment_status === "paid";
  const showPaidUnified = useMemo(() => {
    if (!isDbPaid || !sajuStatus.ok) return false;
    return (
      reportStreaming ||
      (unifiedReport !== null && unifiedReport.length > 0)
    );
  }, [isDbPaid, sajuStatus.ok, reportStreaming, unifiedReport]);

  const birthInfoComplete = useMemo(
    () => hasCompleteBirthInfo(report),
    [report],
  );

  const sheetDate = useMemo(
    () => buildISODateFromParts(sheetYear, sheetMonth, sheetDay),
    [sheetYear, sheetMonth, sheetDay],
  );

  useEffect(() => {
    afterPaymentHandled.current = false;
  }, [reportId]);

  useEffect(() => {
    if (!report) return;
    const p = parseBirthDateParts(report.birth_date);
    setSheetYear(p.y);
    setSheetMonth(p.mo);
    setSheetDay(p.d);
    setSheetTime(formatTimeInput(report.birth_time));
    setSheetPlace(report.birth_place ?? "");
  }, [report]);

  /** 결제 완료 후: 출생 정보 입력 단계(페이지 안) */
  useEffect(() => {
    if (loading || afterPaymentHandled.current) return;
    if (!afterPaymentFlag || !reportId) return;
    if (!report || report.payment_status !== "paid") return;
    afterPaymentHandled.current = true;
    if (hasCompleteBirthInfo(report)) {
      router.replace(`/result?id=${encodeURIComponent(reportId)}`, {
        scroll: false,
      });
      return;
    }
    setDeepFlow("form");
    router.replace(`/result?id=${encodeURIComponent(reportId)}`, {
      scroll: false,
    });
  }, [loading, afterPaymentFlag, reportId, report, router]);

  /** 초대 링크 사용 여부 — 마운트·탭 포커스 시에만 조회(콜백 의존성 루프 방지) */
  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    let lastFetch = 0;

    async function fetchInviteUsedOnce() {
      if (inviteUsedRef.current) return;
      try {
        const res = await fetch(
          `/api/invite/status?reportId=${encodeURIComponent(reportId)}`,
        );
        const data = await res.json();
        if (cancelled) return;
        if (data?.used === true) setInviteUsed(true);
      } catch {
        /* ignore */
      }
    }

    void fetchInviteUsedOnce();

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (inviteUsedRef.current) return;
      const now = Date.now();
      if (now - lastFetch < 45_000) return;
      lastFetch = now;
      void fetchInviteUsedOnce();
    };
    const onFocus = () => {
      if (inviteUsedRef.current) return;
      const now = Date.now();
      if (now - lastFetch < 45_000) return;
      lastFetch = now;
      void fetchInviteUsedOnce();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [reportId]);

  /** 생년월일·장소 저장 후 유료(결제) 페이지로 이동 — 결제 완료 뒤 통합 리포트 생성 */
  const saveBirthAndGoPayment = useCallback(async () => {
    if (!reportId) return;
    setSheetBusy(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          birth_date: sheetDate || null,
          birth_time: sheetTime || null,
          birth_place: sheetPlace.trim() ? sheetPlace.trim() : null,
        })
        .eq("id", reportId);
      if (error) {
        console.error(error);
        alert("좌표 저장에 실패했어요.");
        return;
      }
      if (sheetGender.trim()) {
        localStorage.setItem(`gender_${reportId}`, sheetGender.trim());
      }
      setDeepFlow(null);
      router.push(`/payment?reportId=${encodeURIComponent(reportId)}`);
    } finally {
      setSheetBusy(false);
    }
  }, [reportId, sheetDate, sheetTime, sheetPlace, sheetGender, router]);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${displayName}님의 작은 우주`,
          text: "나의 소우주 결과를 살펴봐요.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("링크를 복사했어요.");
      }
    } catch {
      /* 사용자 취소 등 */
    }
  }

  async function handleInviteFriend() {
    if (!reportId || inviteUsed || inviteBusy) return;
    setInviteBusy(true);
    try {
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "초대 링크를 만들지 못했어요.");
        return;
      }
      const token = data?.invite?.invite_token as string | undefined;
      if (!token) {
        alert("초대 정보를 확인할 수 없어요.");
        return;
      }
      const url = `${window.location.origin}/invite?token=${encodeURIComponent(token)}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: "친구 초대", text: "함께 관계 분석을 받아보자.", url });
        } else {
          await navigator.clipboard.writeText(url);
          alert("초대 링크를 복사했어요. 친구에게 보내 주세요.");
        }
      } catch {
        await navigator.clipboard.writeText(url);
        alert("초대 링크를 복사했어요.");
      }
      setInviteUsed(true);
    } finally {
      setInviteBusy(false);
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (!reportId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setUnifiedReport(null);
      setReportStreaming(false);
      try {

        const { data: reportData } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .maybeSingle();

      setReport(reportData);

      if (typeof window !== "undefined" && reportId) {
        localStorage.setItem("reportId", reportId);
      }

      const paid = reportData?.payment_status === "paid";

      const { data: responseData } = await supabase
        .from("survey_responses")
        .select("answers")
        .eq("report_id", reportId)
        .maybeSingle();

      let localInterpretations: Record<string, string> = {};
      let localPatterns: any = null; 

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

        localPatterns = patterns;

        for (const key of Object.keys(patterns)) {
          const pattern = patterns[key];
      
          const { data } = await supabase
            .from("pattern_base")
            .select("interpretation")
            .eq("domain", key)
            .eq("pattern", pattern.trim())
            .maybeSingle();
      
          localInterpretations[key] = data?.interpretation ?? "해석 없음";
        }
      
        setInterpretations(localInterpretations);
      }

      // 🔥 사주 구조 데이터
      let localSajuData: any = null;
      let sajuOk = false;

      if (!paid) {
        setSajuStatus({ attempted: false, ok: false });
      } else if (!hasCompleteBirthInfo(reportData)) {
        setSajuStatus({ attempted: false, ok: false });
      } else {
        setSajuStatus({ attempted: true, ok: false });
        const sr = await fetch("/api/saju", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            birthDate: reportData.birth_date,
            birthTime: reportData.birth_time,
            birthPlace: reportData.birth_place ?? undefined,
            reportId,
          }),
        });

        if (sr.ok) {
          const j = await sr.json();
          localSajuData = j;
          sajuOk = true;
          setSajuStatus({ attempted: true, ok: true });
        } else {
          setSajuStatus({ attempted: true, ok: false });
        }
      }

      // 🔥 점성학 API 호출 (추가!)
      let localAstrologyText: string | null = null;
      if (paid && hasCompleteBirthInfo(reportData)) {
        try {
          const birthDateObj = new Date(reportData.birth_date);
          const ar = await fetch("/api/astrology", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              year: birthDateObj.getFullYear(),
              month: birthDateObj.getMonth() + 1,
              day: birthDateObj.getDate(),
              hour: reportData.birth_time
                ? parseInt(reportData.birth_time.split(":")[0])
                : 12,
              minute: reportData.birth_time
                ? parseInt(reportData.birth_time.split(":")[1])
                : 0,
              latitude: 37.5665, // TODO: 실제 위도로 대체
              longitude: 126.978, // TODO: 실제 경도로 대체
              timezone: 9,
            }),
          });
          if (ar.ok) {
            const astroData = await ar.json();
            const interp =
              typeof astroData.interpretation === "string"
                ? astroData.interpretation.trim()
                : "";
            if (interp) {
              localAstrologyText = interp;
            } else {
              const raw = astroData.raw as
                | { sun?: string; moon?: string; rising?: string }
                | undefined;
              const sun = raw?.sun ?? astroData.sun;
              const moon = raw?.moon ?? astroData.moon;
              const rising = raw?.rising ?? astroData.rising;
              if (sun && moon && rising) {
                localAstrologyText = buildAstrologyContextForLlm({
                  sun,
                  moon,
                  rising,
                });
              }
            }
          }
        } catch (e) {
          console.error("점성학 API 실패:", e);
        }
      }

        // 🔥 관계/보조 텍스트
        let localRelationship: string | null = null;
        if (paid) {
          try {
            const res = await fetch("/api/relationship/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reportId }),
            });
            if (res.ok) {
              const data = await res.json();
              localRelationship = data.relationship ?? data.astrology ?? null;
              setRelationship(localRelationship);
            }
          } catch (relationshipErr) {
            console.error("관계 맥락 생성 API 실패:", relationshipErr);
          }
        }

        // 🔥 LLM 호출
        try {
          if (!paid) {
          const promptData = buildSurveyOnlyPrompt(localInterpretations);
          const res = await fetch("/api/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "free",
              userInput: promptData,
            }),
          });
          const data = await res.json();
          setFreeSummary(data.free ?? null);
          setPaidSummary(data.paid ?? null);
          setUnifiedReport(null);
          } else {
          try {
            const freePromptData = buildSurveyOnlyPrompt(localInterpretations);
            const freeRes = await fetch("/api/llm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mode: "free",
                userInput: freePromptData,
              }),
            });
            const freeData = await freeRes.json();
            setFreeSummary(freeData.free ?? null);
          } catch {
            setFreeSummary(null);
          }

          const detailedRes = await fetch("/api/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "detailed_survey",
              patterns: localPatterns,
            }),
          });
          const detailedData = await detailedRes.json();

          const combinedAstrology = [localAstrologyText, localRelationship]
            .filter(Boolean)
            .join("\n\n");

          if (hasCompleteBirthInfo(reportData) && sajuOk) {
            setLoading(false);
            setReportStreaming(true);
            setUnifiedReport("");
            try {
              const integratedRes = await fetch("/api/llm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  mode: "integrated",
                  detailedSurvey: detailedData.report,
                  sajuData: localSajuData ?? null,
                  astrologyText: combinedAstrology || null,
                  stream: true,
                }),
              });

              if (!integratedRes.ok) {
                const errJson = await integratedRes.json().catch(() => ({}));
                setUnifiedReport(
                  `통합 리포트를 만들지 못했어요. ${String((errJson as { error?: string }).error ?? "잠시 후 다시 열어보세요.")}`,
                );
              } else {
                const ct = integratedRes.headers.get("content-type") ?? "";
                if (ct.includes("text/plain") && integratedRes.body) {
                  const reader = integratedRes.body.getReader();
                  const decoder = new TextDecoder();
                  let acc = "";
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    acc += decoder.decode(value, { stream: true });
                    setUnifiedReport(acc);
                  }
                  setUnifiedReport(acc);
                } else {
                  const integratedData = await integratedRes.json();
                  setUnifiedReport(integratedData.report ?? "");
                }
              }
            } catch (streamErr) {
              console.error(streamErr);
              setUnifiedReport(
                "통합 리포트를 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
              );
            } finally {
              setReportStreaming(false);
            }
          } else {
            setUnifiedReport(null);
          }
            setPaidSummary(null);
          }
        } catch (e) {
          console.error("GPT 실패", e);
        }
      } catch (e) {
        console.error("리포트 데이터 로드 실패:", e);
        setUnifiedReport(null);
        setFreeSummary(null);
        setPaidSummary(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [reportId]);

  if (loading) {
    return (
      <SpaceBackground>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
          <SurveyAnalyzingJourney
            active
            mode={
              report?.payment_status === "paid" ? "landing" : "flight"
            }
          />
        </div>
      </SpaceBackground>
    );
  }

  if (!reportId) {
    return (
      <SpaceBackground>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
          <GlassCard className="w-full max-w-md space-y-5 text-center">
            <p className="space-text-muted text-sm leading-relaxed">
              리포트 id가 없어요. 홈에서 탐사를 다시 시작해 주세요.
            </p>
            <GlowButton type="button" onClick={() => router.push("/")}>
              처음으로
            </GlowButton>
          </GlassCard>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground>
      <div className="relative z-10 min-h-screen px-4 py-10 pb-28 sm:px-6">
        <div className="mx-auto max-w-md space-y-8 sm:max-w-2xl">
          <header className="space-y-3 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--space-sub)]">
              Exploration log
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-[var(--space-text)] sm:text-3xl">
              {displayName}님의 관측기록
            </h1>
            <p className="text-sm text-[var(--space-text-muted)]">
              {isDbPaid && sajuStatus.ok
                ? "심층 통합 리포트가 준비되었습니다."
                : "분석 일부가 도출되었습니다."}
            </p>
          </header>

          {(freeSummary ||
            paidSummary ||
            showPaidUnified ||
            inviteUsed ||
            (isDbPaid && !(birthInfoComplete && sajuStatus.ok)) ||
            deepFlow) && (
            <GlassCard className="space-y-6">
              {deepFlow === "intro" ? (
                <DeepReportIntroPanel
                  onContinue={() => {
                    markDeepReportIntroSeen(reportId);
                    setDeepFlow("form");
                  }}
                  onBackToResult={() => setDeepFlow(null)}
                />
              ) : deepFlow === "form" ? (
                <div className="space-y-4">
                  <ReportBirthCaptureForm
                    title="심화 분석을 위한 정보"
                    description="입력을 마치면 결제 페이지로 이동해요."
                    sheetYear={sheetYear}
                    setSheetYear={setSheetYear}
                    sheetMonth={sheetMonth}
                    setSheetMonth={setSheetMonth}
                    sheetDay={sheetDay}
                    setSheetDay={setSheetDay}
                    sheetTime={sheetTime}
                    setSheetTime={setSheetTime}
                    sheetPlace={sheetPlace}
                    setSheetPlace={setSheetPlace}
                    sheetGender={sheetGender}
                    setSheetGender={setSheetGender}
                    sheetBusy={sheetBusy}
                    onSubmit={() => void saveBirthAndGoPayment()}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <GlowButton
                      type="button"
                      variant="ghost"
                      disabled={sheetBusy}
                      onClick={() => {
                        if (sheetBusy) return;
                        if (readDeepReportIntroSeen(reportId)) {
                          setDeepFlow(null);
                        } else {
                          setDeepFlow("intro");
                        }
                      }}
                      className="w-full !min-h-[46px] text-sm font-medium sm:w-auto sm:min-w-[7.5rem]"
                    >
                      이전
                    </GlowButton>
                    <GlowButton
                      type="button"
                      variant="ghost"
                      disabled={sheetBusy}
                      onClick={() => setDeepFlow(null)}
                      className="w-full !min-h-[46px] text-sm font-medium sm:w-auto sm:min-w-[7.5rem]"
                    >
                      닫기
                    </GlowButton>
                  </div>
                </div>
              ) : (
                <>
                  {isDbPaid && showPaidUnified && (
                    <div
                      className="mx-auto inline-flex w-full max-w-md rounded-full border border-white/15 bg-[#0d121f] p-0.5"
                      role="tablist"
                      aria-label="분석 보기"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resultViewTab === "basic"}
                        onClick={() => {
                          setResultViewTab("basic");
                          void router.replace(
                            `/result?id=${encodeURIComponent(reportId)}&view=basic`,
                            { scroll: false },
                          );
                        }}
                        className={[
                          "min-h-[40px] flex-1 rounded-full px-4 py-2 text-xs font-semibold transition",
                          resultViewTab === "basic"
                            ? "bg-gradient-to-r from-[#F0D797] via-[#E3C47B] to-[#D6B46A] text-[#1b2230] ring-1 ring-[#F0D797]/35 shadow-[0_10px_24px_rgba(214,180,106,0.34)]"
                            : "text-[var(--space-text-muted)] hover:text-[var(--space-text)]",
                        ].join(" ")}
                      >
                        기본 분석
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resultViewTab === "premium"}
                        onClick={() => {
                          setResultViewTab("premium");
                          void router.replace(
                            `/result?id=${encodeURIComponent(reportId)}&view=premium`,
                            { scroll: false },
                          );
                        }}
                        className={[
                          "min-h-[40px] flex-1 rounded-full px-4 py-2 text-xs font-semibold transition",
                          resultViewTab === "premium"
                            ? "bg-gradient-to-r from-[#F3DB9E] via-[#E7C984] to-[#D6B46A] text-[#1b2230] ring-1 ring-[#F3DB9E]/35 shadow-[0_10px_24px_rgba(214,180,106,0.38)]"
                            : "text-[var(--space-text-muted)] hover:text-[var(--space-text)]",
                        ].join(" ")}
                      >
                        심화 분석
                      </button>
                    </div>
                  )}

                  {isDbPaid &&
                    !(birthInfoComplete && sajuStatus.ok) &&
                    resultViewTab === "basic" && (
                      <div className="space-y-2 rounded-xl border border-[var(--space-border)] bg-[var(--space-card)]/40 p-4">
                        <p className="text-center text-sm font-semibold text-[#F0D797]">
                          기질·행동 패턴 분석
                        </p>
                        {!birthInfoComplete && (
                          <p className="text-center text-sm leading-relaxed text-[var(--space-text-muted)]">
                            생년월일, 시간, 장소를 입력하면 심화 리포트를 만들 수
                            있어요. 아래 &apos;심화 분석하기&apos;에서 입력할 수
                            있어요.
                          </p>
                        )}
                        {birthInfoComplete &&
                          sajuStatus.attempted &&
                          !sajuStatus.ok && (
                            <p className="text-center text-sm leading-relaxed text-[var(--space-text-muted)]">
                              데이터를 불러오지 못했어요. 잠시 후 다시
                              열어보세요.
                            </p>
                          )}
                      </div>
                    )}

                  {freeSummary &&
                    (!isDbPaid ||
                      resultViewTab === "basic" ||
                      !showPaidUnified) && (
                      <>
                        <FreeResultAccordions
                          bodies={freeAccordionBodies}
                          displayName={displayName}
                        />

                        {resultViewTab === "basic" && (
                          <div className="flex flex-col gap-3 pt-2 sm:gap-3.5">
                            {!showPaidUnified && (
                              <GlowButton
                                type="button"
                                variant="primary"
                                className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                                onClick={() => {
                                  if (readDeepReportIntroSeen(reportId)) {
                                    setDeepFlow("form");
                                  } else {
                                    setDeepFlow("intro");
                                  }
                                }}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <SubtleButtonIcon kind="search" />
                                  심화 분석하기
                                </span>
                              </GlowButton>
                            )}
                            {showPaidUnified && (
                              <p className="rounded-xl border border-[#D6B46A]/25 bg-[#D6B46A]/[0.08] px-3 py-2 text-center text-xs leading-relaxed text-[#F0D797]">
                                심화 분석은 상단의 ‘심화 분석’ 탭에서 이어서 볼 수 있어요.
                              </p>
                            )}
                            <GlowButton
                              type="button"
                              variant="secondary"
                              className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                              onClick={() => {
                                if (
                                  typeof window !== "undefined" &&
                                  reportId
                                ) {
                                  localStorage.setItem("reportId", reportId);
                                }
                                router.push("/survey?redo=1");
                              }}
                            >
                              <span className="inline-flex items-center gap-2">
                                <SubtleButtonIcon kind="redo" />
                                다시 하기
                              </span>
                            </GlowButton>
                            <GlowButton
                              type="button"
                              variant="ghost"
                              className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                              onClick={() => router.push("/")}
                            >
                              <span className="inline-flex items-center gap-2">
                                <SubtleButtonIcon kind="home" />
                                홈으로 가기
                              </span>
                            </GlowButton>
                            <p className="text-center text-xs leading-relaxed text-[var(--space-text-muted)]">
                              <button
                                type="button"
                                className="underline decoration-white/30 underline-offset-2 hover:text-[var(--space-text)]"
                                onClick={() =>
                                  router.push(
                                    `/relationships?myReportId=${encodeURIComponent(reportId)}`,
                                  )
                                }
                              >
                                관계 탐사실
                              </button>
                              {" · "}
                              <button
                                type="button"
                                className="underline decoration-white/30 underline-offset-2 hover:text-[var(--space-text)]"
                                onClick={() => void handleShare()}
                              >
                                공유하기
                              </button>
                            </p>
                          </div>
                        )}
                      </>
                    )}

                  {isDbPaid &&
                    showPaidUnified &&
                    resultViewTab === "premium" && (
                      <>
                        <div className="space-y-5">
                          <div className="text-center">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#8eb8ff]/90">
                              Premium
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[#F0D797] sm:text-xl">
                              통합 분석 리포트
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--space-text-muted)]">
                              설문과 추가 데이터 분석을 한 흐름으로 정리했습니다.
                            </p>
                          </div>

                          <div
                            className={[
                              "rounded-2xl border border-[var(--space-border)]/80 bg-gradient-to-b from-[var(--space-card)]/55 to-[#0a0f1a]/35 p-4 shadow-[0_0_60px_rgba(103,183,255,0.06)] sm:p-6 md:p-8",
                              reportStreaming ? "ring-1 ring-[#67B7FF]/25" : "",
                            ].join(" ")}
                          >
                            {reportStreaming && (
                              <p className="mb-4 flex items-center gap-2 text-xs text-[#8eb8ff]/90">
                                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#67B7FF]" />
                                리포트를 이어서 작성하는 중이에요…
                              </p>
                            )}
                            {unifiedReport !== null &&
                            unifiedReport.length > 0 ? (
                              <UnifiedReportMarkdown content={unifiedReport} />
                            ) : reportStreaming ? (
                              <p className="text-sm text-[var(--space-text-muted)]">
                                곧 본문이 나타납니다.
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-[var(--space-border)] pt-6">
                          <GlowButton
                            type="button"
                            variant="secondary"
                            className="w-full !min-h-[48px] py-3 text-sm"
                            onClick={() => void handleShare()}
                          >
                            리포트 공유
                          </GlowButton>
                          <GlowButton
                            type="button"
                            variant="secondary"
                            className="w-full !min-h-[48px] py-3 text-sm"
                            onClick={() =>
                              router.push(
                                `/relationships?myReportId=${encodeURIComponent(reportId)}`,
                              )
                            }
                          >
                            관계 탐사실
                          </GlowButton>
                          <GlowButton
                            type="button"
                            variant={inviteUsed || inviteBusy ? "disabled" : "secondary"}
                            className="w-full !min-h-[48px] py-3 text-sm"
                            disabled={inviteUsed || inviteBusy}
                            onClick={() => void handleInviteFriend()}
                          >
                            {inviteUsed
                              ? "초대 링크 (사용됨)"
                              : inviteBusy
                                ? "준비 중…"
                                : "친구 초대 링크"}
                          </GlowButton>
                          <GlowButton
                            type="button"
                            variant="ghost"
                            onClick={() => router.push("/")}
                            className="w-full !min-h-[42px] text-sm font-medium"
                          >
                            나가기
                          </GlowButton>
                        </div>
                      </>
                    )}
                </>
              )}
            </GlassCard>
          )}

          {!freeSummary &&
            !paidSummary &&
            !showPaidUnified &&
            !deepFlow &&
            !(isDbPaid && !(birthInfoComplete && sajuStatus.ok)) && (
              <GlassCard>
                <p className="text-center text-sm text-[var(--space-text-muted)]">
                  아직 보여줄 관측 데이터가 준비되지 않았어요. 잠시 후 다시
                  열어보세요.
                </p>
              </GlassCard>
            )}

          {pathname !== "/result" ? (
            <div className="mx-auto w-full max-w-md sm:max-w-lg">
              <GlowButton
                type="button"
                variant="ghost"
                className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                onClick={() => router.push("/")}
              >
                <span className="inline-flex items-center gap-2">
                  <SubtleButtonIcon kind="home" />
                  홈으로 가기
                </span>
              </GlowButton>
            </div>
          ) : null}
        </div>
      </div>
    </SpaceBackground>
  );
}
