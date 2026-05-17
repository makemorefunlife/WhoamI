"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { resolveClerkDisplayName } from "@/lib/clerk/displayName";
import { supabase } from "@/lib/supabase/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import SurveyAnalyzingJourney from "@/components/space/SurveyAnalyzingJourney";
import FreeResultAccordions from "@/components/report/FreeResultAccordions";
import DeepReportIntroPanel from "@/components/report/DeepReportIntroPanel";
import ReportBirthCaptureForm from "@/components/report/ReportBirthCaptureForm";
import ReportViewTabSwitcher from "@/components/report/ReportViewTabSwitcher";
import ReportSectionLoading from "@/components/report/ReportSectionLoading";
import SubtleButtonIcon from "@/components/ui/SubtleButtonIcon";
import { fetchBasicAnalysisClient } from "@/lib/report/fetchBasicAnalysisClient";
import { fetchIntegratedAnalysisClient } from "@/lib/report/fetchIntegratedAnalysisClient";
import { logPremiumContentSource } from "@/lib/report/premiumContentSourceLog";
import {
  clearPremiumPipelineLock,
  runPremiumReportPipelineOnce,
} from "@/lib/report/premiumPipelineLock";
import {
  clearUnifiedReportCache,
  readUnifiedReportCache,
  writeUnifiedReportCache,
} from "@/lib/report/unifiedReportCache";
import {
  buildISODateFromParts,
  formatTimeInput,
  hasCompleteBirthInfo,
  parseBirthDateParts,
} from "@/lib/report/reportBirthUtils";
import { getPattern } from "@/lib/report/surveyPatternUtils";
import { useCanonicalReportId } from "@/lib/home/useCanonicalReportId";

const UnifiedReportMarkdown = dynamic(
  () => import("@/components/report/UnifiedReportMarkdown"),
  {
    ssr: false,
    loading: () => (
      <ReportSectionLoading label="심화 리포트 화면을 불러오는 중…" />
    ),
  },
);

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
  const { user } = useUser();

  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [interpretations, setInterpretations] = useState<
    Record<string, string>
  >({});
  const [relationship, setRelationship] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  const [freeSummary, setFreeSummary] = useState<string | null>(null);
  const [paidSummary, setPaidSummary] = useState<string | null>(null);
  const [surveyIncomplete, setSurveyIncomplete] = useState(false);
  const [basicLoading, setBasicLoading] = useState(false);
  const [basicError, setBasicError] = useState<string | null>(null);
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
  const [premiumLoading, setPremiumLoading] = useState(false);
  const surveyContextRef = useRef<{
    interpretations: Record<string, string>;
    patterns: Record<string, string> | null;
  }>({ interpretations: {}, patterns: null });
  const premiumPipelineStartedRef = useRef(false);
  const premiumLoadInFlightRef = useRef(false);
  const afterPaymentHandled = useRef(false);
  const inviteUsedRef = useRef(false);
  inviteUsedRef.current = inviteUsed;

  const pathname = usePathname();
  const urlReportIdHint = searchParams.get("id")?.trim() ?? "";
  const {
    canonicalReportId: reportId,
    resolving: canonicalResolving,
  } = useCanonicalReportId({
    urlHint: urlReportIdHint,
    queryParam: "id",
    logContext: pathname === "/report" ? "report-page" : "result-page",
  });
  const loading = canonicalResolving || dataLoading;
  const afterPaymentFlag = searchParams.get("afterPayment") === "1";
  const regenerateIntegratedFlag =
    searchParams.get("regenerateIntegrated") === "1";

  useEffect(() => {
    if (viewParam === "premium") setResultViewTab("premium");
    else if (viewParam === "basic") setResultViewTab("basic");
  }, [viewParam]);
  const displayName =
    report?.name?.trim() || resolveClerkDisplayName(user) || "당신";

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

  const freeAccordionBodies = useMemo((): [string, string, string, string] => {
    const p = freeParagraphs.map((x) => x.trim()).filter(Boolean);
    const out = [...p];
    while (out.length < 4) out.push("");
    return out.slice(0, 4) as [string, string, string, string];
  }, [freeParagraphs]);

  const isDbPaid = report?.payment_status === "paid";
  const showPaidUnified = useMemo(() => {
    if (!isDbPaid || !sajuStatus.ok) return false;
    return (
      reportStreaming || (unifiedReport !== null && unifiedReport.length > 0)
    );
  }, [isDbPaid, sajuStatus.ok, reportStreaming, unifiedReport]);
  const isPremiumHeroActive =
    isDbPaid && showPaidUnified && resultViewTab === "premium" && !deepFlow;

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
      const birthRes = await fetch("/api/report/birth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          birthDate: sheetDate || null,
          birthTime: sheetTime || null,
          birthPlace: sheetPlace.trim() ? sheetPlace.trim() : null,
        }),
      });
      if (!birthRes.ok) {
        let message = "좌표 저장에 실패했어요.";
        try {
          const j = (await birthRes.json()) as { error?: string };
          if (j.error) message = j.error;
        } catch {
          /* ignore */
        }
        console.error("report/birth:", message);
        alert(message);
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

  const openPersonalDeepAnalysis = useCallback(() => {
    if (readDeepReportIntroSeen(reportId)) {
      setDeepFlow("form");
    } else {
      setDeepFlow("intro");
    }
  }, [reportId]);

  const loadPremiumReport = useCallback(async () => {
    if (!reportId || !report) return;
    if (report.payment_status !== "paid") return;
    if (!hasCompleteBirthInfo(report)) return;

    const regenerate = regenerateIntegratedFlag;

    if (
      !regenerate &&
      unifiedReport &&
      unifiedReport.trim().length > 0 &&
      premiumPipelineStartedRef.current
    ) {
      return;
    }

    if (premiumLoadInFlightRef.current) {
      return;
    }
    premiumLoadInFlightRef.current = true;

    try {
      if (regenerate) {
        clearUnifiedReportCache(reportId);
        clearPremiumPipelineLock(reportId);
        premiumPipelineStartedRef.current = false;
        setUnifiedReport(null);
        logPremiumContentSource(reportId, "regeneration", "ui-requested");
        try {
          await fetchIntegratedAnalysisClient(reportId, { regenerate: true });
        } catch {
          /* DB 삭제 실패 시에도 파이프라인 재시도 */
        }
      } else {
        const sessionPreview = readUnifiedReportCache(reportId);
        if (sessionPreview && !unifiedReport?.trim()) {
          setUnifiedReport(sessionPreview);
          logPremiumContentSource(reportId, "session", "load-preview");
        }

        try {
          const persisted = await fetchIntegratedAnalysisClient(reportId);
          if (persisted.ok) {
            setUnifiedReport(persisted.text);
            setSajuStatus({ attempted: true, ok: true });
            premiumPipelineStartedRef.current = true;
            return;
          }
        } catch (e) {
          console.warn("저장된 integrated 조회 실패:", e);
        }
      }

      if (
        premiumPipelineStartedRef.current ||
        premiumLoading ||
        reportStreaming
      ) {
        return;
      }
      premiumPipelineStartedRef.current = true;
      setPremiumLoading(true);

      const result = await runPremiumReportPipelineOnce(
        reportId,
        report,
        surveyContextRef.current.interpretations,
        surveyContextRef.current.patterns,
        {
          onStreamChunk: (acc) => setUnifiedReport(acc),
          onStreamingChange: setReportStreaming,
        },
        { regenerate },
      );

      setSajuStatus(result.sajuStatus);
      if (result.relationship) setRelationship(result.relationship);
      if (result.freeSummary && !freeSummary) {
        setFreeSummary(result.freeSummary);
      }
      if (result.unifiedReport?.trim()) {
        setUnifiedReport(result.unifiedReport);
        writeUnifiedReportCache(reportId, result.unifiedReport);
        if (regenerate) {
          logPremiumContentSource(reportId, "regeneration", "ui-complete");
        }
      }
    } catch (e) {
      console.error("심화 리포트 생성 실패:", e);
      premiumPipelineStartedRef.current = false;
    } finally {
      setPremiumLoading(false);
      premiumLoadInFlightRef.current = false;
    }
  }, [
    reportId,
    report,
    unifiedReport,
    premiumLoading,
    reportStreaming,
    freeSummary,
    regenerateIntegratedFlag,
  ]);

  const goPremiumResultTab = useCallback(() => {
    setResultViewTab("premium");
    void router.replace(
      `/result?id=${encodeURIComponent(reportId)}&view=premium`,
      { scroll: false },
    );
    void loadPremiumReport();
  }, [reportId, router, loadPremiumReport]);

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
          await navigator.share({
            title: "친구 초대",
            text: "함께 관계 분석을 받아보자.",
            url,
          });
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
    premiumPipelineStartedRef.current = false;
    premiumLoadInFlightRef.current = false;
    clearPremiumPipelineLock(reportId);
  }, [reportId]);

  const loadBasicAnalysisForResult = useCallback(
    async (rid: string, opts?: { regenerate?: boolean }) => {
      setBasicLoading(true);
      setBasicError(null);
      setSurveyIncomplete(false);
      try {
        const result = await fetchBasicAnalysisClient(rid, {
          regenerate: opts?.regenerate,
        });
        if (result.ok) {
          setFreeSummary(result.text);
          setPaidSummary(null);
          return;
        }
        if (result.reason === "no_survey") {
          setSurveyIncomplete(true);
          setFreeSummary(null);
          setPaidSummary(null);
          return;
        }
        if (result.reason === "no_key") {
          setBasicError(
            "분석 서버 설정이 필요해요. 잠시 후 다시 시도해 주세요.",
          );
        } else {
          setBasicError(
            "기본 분석을 만드는 데 시간이 걸리거나 실패했어요. 다시 시도해 주세요.",
          );
        }
      } catch (e) {
        console.error("기본 분석 로드 실패", e);
        setBasicError("기본 분석을 불러오지 못했어요.");
      } finally {
        setBasicLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    async function loadSurveyPatterns(rid: string) {
      const { data: responseData } = await supabase
        .from("survey_responses")
        .select("answers")
        .eq("report_id", rid)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      const localInterpretations: Record<string, string> = {};
      let localPatterns: Record<string, string> | null = null;

      if (responseData?.answers) {
        const ans = responseData.answers as Record<string, string>;
        const patterns: Record<string, string> = {
          mbti: getPattern(ans.q1, ans.q2, ans.q3),
          disc: getPattern(ans.q4, ans.q5, ans.q6),
          enneagram: getPattern(ans.q7, ans.q8, ans.q9),
          riasec: getPattern(ans.q10, ans.q11, ans.q12),
          pss: getPattern(ans.q13, ans.q14, ans.q15),
          tci: getPattern(ans.q16, ans.q17, ans.q18),
        };
        localPatterns = patterns;

        await Promise.all(
          Object.keys(patterns).map(async (key) => {
            const pattern = patterns[key];
            const { data } = await supabase
              .from("pattern_base")
              .select("interpretation")
              .eq("domain", key)
              .eq("pattern", pattern.trim())
              .maybeSingle();
            localInterpretations[key] = data?.interpretation ?? "해석 없음";
          }),
        );
        setInterpretations(localInterpretations);
      }

      surveyContextRef.current = {
        interpretations: localInterpretations,
        patterns: localPatterns,
      };
    }

    async function fetchCore() {
      if (canonicalResolving) return;

      if (!reportId) {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setPremiumLoading(false);
      setReportStreaming(false);
      setBasicError(null);

      let hadDbPremium = false;
      setUnifiedReport(null);
      setSajuStatus({ attempted: false, ok: false });
      premiumPipelineStartedRef.current = false;

      const sessionPreview = readUnifiedReportCache(reportId);
      if (sessionPreview) {
        setUnifiedReport(sessionPreview);
        logPremiumContentSource(reportId, "session", "fetchCore-preview");
      }

      try {
        const { data: reportData } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .maybeSingle();

        setReport(reportData);

        if (
          reportData?.payment_status === "paid" &&
          hasCompleteBirthInfo(reportData)
        ) {
          try {
            const persisted = await fetchIntegratedAnalysisClient(reportId, {
              regenerate: regenerateIntegratedFlag,
            });
            if (persisted.ok) {
              hadDbPremium = true;
              setUnifiedReport(persisted.text);
              setSajuStatus({ attempted: true, ok: true });
              premiumPipelineStartedRef.current = true;
            } else if (!sessionPreview) {
              setUnifiedReport(null);
            }
          } catch {
            if (!sessionPreview) {
              setUnifiedReport(null);
            }
          }
        } else if (!sessionPreview) {
          setUnifiedReport(null);
        }

        setDataLoading(false);

        void loadSurveyPatterns(reportId);
        if (viewParam !== "premium") {
          void loadBasicAnalysisForResult(reportId);
        }

        if (!hadDbPremium && !sessionPreview) {
          setUnifiedReport(null);
        }
      } catch (e) {
        console.error("리포트 데이터 로드 실패:", e);
        if (!hadDbPremium && !sessionPreview) {
          setUnifiedReport(null);
        }
        setFreeSummary(null);
        setPaidSummary(null);
        setDataLoading(false);
      }
    }

    void fetchCore();
  }, [
    reportId,
    canonicalResolving,
    viewParam,
    loadBasicAnalysisForResult,
    regenerateIntegratedFlag,
  ]);

  useEffect(() => {
    if (loading || !report) return;
    if (report.payment_status !== "paid") return;
    if (resultViewTab !== "premium") return;
    if (!hasCompleteBirthInfo(report)) return;
    void loadPremiumReport();
  }, [loading, report, resultViewTab, loadPremiumReport]);

  if (loading) {
    return (
      <SpaceBackground>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5">
          <SurveyAnalyzingJourney active mode="landing" />
        </div>
      </SpaceBackground>
    );
  }

  if (!canonicalResolving && !reportId) {
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
          {!isPremiumHeroActive && (
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
          )}

          {(freeSummary ||
            paidSummary ||
            showPaidUnified ||
            inviteUsed ||
            (isDbPaid && !(birthInfoComplete && sajuStatus.ok)) ||
            deepFlow) &&
            isPremiumHeroActive && (
              <div className="space-y-6">
                <header className="space-y-2 text-center">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--space-sub)]">
                    Deep report
                  </p>
                  <h1 className="text-2xl font-semibold leading-tight text-[var(--space-text)] sm:text-3xl">
                    {displayName}님의 심화 탐사 리포트
                  </h1>
                </header>
                {unifiedReport?.trim() ? (
                  <GlassCard className="p-4 sm:p-6">
                    <UnifiedReportMarkdown content={unifiedReport} />
                  </GlassCard>
                ) : premiumLoading || reportStreaming ? (
                  <ReportSectionLoading label="심화 리포트를 준비하는 중…" />
                ) : (
                  <GlassCard className="space-y-4 p-5 text-center">
                    <p className="text-sm leading-relaxed text-[var(--space-text-muted)]">
                      심화 리포트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
                    </p>
                    <GlowButton
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        premiumPipelineStartedRef.current = false;
                        premiumLoadInFlightRef.current = false;
                        clearPremiumPipelineLock(reportId);
                        void loadPremiumReport();
                      }}
                    >
                      다시 시도
                    </GlowButton>
                  </GlassCard>
                )}
              </div>
            )}

          {report &&
            !loading &&
            !isPremiumHeroActive &&
            (freeSummary ||
              paidSummary ||
              showPaidUnified ||
              inviteUsed ||
              basicLoading ||
              surveyIncomplete ||
              basicError ||
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
                  {basicLoading &&
                    !freeSummary &&
                    (!isDbPaid || resultViewTab === "basic") && (
                    <ReportSectionLoading label="18문항 설문을 바탕으로 기본 분석을 만드는 중… (최대 1~2분)" />
                  )}

                  {surveyIncomplete && !basicLoading && (
                    <div className="space-y-4 text-center">
                      <p className="text-sm leading-relaxed text-[var(--space-text-muted)]">
                        18문항 설문을 마치면 기본 분석을 볼 수 있어요.
                      </p>
                      <GlowButton
                        type="button"
                        className="w-full"
                        onClick={() => router.push("/survey")}
                      >
                        설문 이어하기
                      </GlowButton>
                    </div>
                  )}

                  {basicError &&
                    !basicLoading &&
                    !freeSummary &&
                    !surveyIncomplete && (
                      <div className="space-y-3 text-center">
                        <p className="text-sm text-[var(--space-text-muted)]">
                          {basicError}
                        </p>
                        <GlowButton
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            void loadBasicAnalysisForResult(reportId, {
                              regenerate: true,
                            });
                          }}
                        >
                          다시 시도
                        </GlowButton>
                      </div>
                    )}

                  {isDbPaid && (birthInfoComplete || showPaidUnified) && (
                    <ReportViewTabSwitcher
                      resultViewTab={resultViewTab}
                      onSelectBasic={() => {
                        setResultViewTab("basic");
                        void router.replace(
                          `/result?id=${encodeURIComponent(reportId)}&view=basic`,
                          { scroll: false },
                        );
                        if (!freeSummary?.trim()) {
                          void loadBasicAnalysisForResult(reportId);
                        }
                      }}
                      onSelectPremium={() => {
                        void goPremiumResultTab();
                      }}
                    />
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
                            생년월일, 시간, 장소를 입력하면 심화 리포트를 만들
                            수 있어요. 아래 &apos;심화 분석하기&apos;에서 입력할
                            수 있어요.
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
                    (!isDbPaid || resultViewTab === "basic") && (
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
                                onClick={openPersonalDeepAnalysis}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <SubtleButtonIcon kind="search" />
                                  심화 분석하기
                                </span>
                              </GlowButton>
                            )}
                            {showPaidUnified && (
                              <p className="rounded-xl border border-[#D6B46A]/25 bg-[#D6B46A]/[0.08] px-3 py-2 text-center text-xs leading-relaxed text-[#F0D797]">
                                심화 분석은 상단의 ‘심화 분석’ 탭에서 이어서 볼
                                수 있어요.
                              </p>
                            )}
                            <GlowButton
                              type="button"
                              variant="secondary"
                              className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                              onClick={() => {
                                if (typeof window !== "undefined" && reportId) {
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
                            {!showPaidUnified ? (
                              <GlowButton
                                type="button"
                                variant="secondary"
                                className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                                onClick={openPersonalDeepAnalysis}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <SubtleButtonIcon kind="search" />
                                  개인 심화 분석하기
                                </span>
                              </GlowButton>
                            ) : (
                              <GlowButton
                                type="button"
                                variant="secondary"
                                className="w-full !min-h-[48px] text-[0.9375rem] font-medium"
                                onClick={goPremiumResultTab}
                              >
                                <span className="inline-flex items-center gap-2">
                                  <SubtleButtonIcon kind="search" />
                                  개인 심화 분석하기
                                </span>
                              </GlowButton>
                            )}
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
                    resultViewTab === "premium" &&
                    (premiumLoading || reportStreaming) &&
                    !showPaidUnified && (
                      <ReportSectionLoading label="심화 리포트를 준비하는 중…" />
                    )}
                </>
              )}
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
