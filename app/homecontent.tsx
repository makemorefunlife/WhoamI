// app/homecontent.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { AnimatePresence, motion } from "framer-motion";
import {
  applyResumeReportIdToStorage,
  fetchHomeResumeClient,
} from "@/lib/home/fetchHomeResumeClient";
import { hydrateReportSessions } from "@/lib/v2/report/hydrateReportSessions";
import { migrateLocalReportSessions } from "@/lib/v2/report/migrateLocalReportSessions";
import { syncBirthFromResumeFields } from "@/lib/v2/onboarding/syncBirthFromResume";
import { supabase } from "@/lib/supabase/client";
import FirstEntryDiagnostics from "@/components/debug/FirstEntryDiagnostics";
import StitchLandingPage from "@/components/landing/stitch/StitchLandingPage";
import StartChoiceModal from "@/components/landing/stitch/StartChoiceModal";
import { hasSurveyV2Session } from "@/lib/v2/survey/session";
import {
  hasResultsDashboardPrerequisites,
  resultsDashboardPath,
} from "@/lib/v2/results/canShowResultsDashboard";
import { setStitchAuthHandler } from "@/lib/stitch/authBridge";

const HomeAuthSignInPanel = dynamic(
  () => import("@/components/home/HomeAuthSignInPanel"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">
        로그인 화면을 불러오는 중…
      </div>
    ),
  },
);

export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, userId } = useClerkReady();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [startChoiceOpen, setStartChoiceOpen] = useState(false);
  const [creatingReport, setCreatingReport] = useState(false);
  /** 로컬 reportId 기준 서버 설문 완료 여부 (null: 아직 조회 전) */
  const [resume, setResume] = useState<{
    loading: boolean;
    reportId: string | null;
    hasReport: boolean;
    surveyCompleted: boolean;
    birthDate: string | null;
  }>({
    loading: false,
    reportId: null,
    hasReport: false,
    surveyCompleted: false,
    birthDate: null,
  });
  /** 홈 재방문 — 관계 허브 요약 카운트 */
  const [relCounts, setRelCounts] = useState({ pending: 0, completed: 0 });

  useEffect(() => {
    setStitchAuthHandler(() => () => setAuthModalOpen(true));
    return () => setStitchAuthHandler(null);
  }, []);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) localStorage.setItem("inviteToken", token);
  }, [searchParams]);

  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [authModalOpen]);

  useEffect(() => {
    if (isSignedIn && authModalOpen) {
      queueMicrotask(() => setAuthModalOpen(false));
    }
  }, [isSignedIn, authModalOpen]);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    const hint =
      typeof window !== "undefined"
        ? localStorage.getItem("reportId")?.trim() ?? ""
        : "";

    if (!isSignedIn && !hint) {
      setResume({
        loading: false,
        reportId: null,
        hasReport: false,
        surveyCompleted: false,
        birthDate: null,
      });
      setRelCounts({ pending: 0, completed: 0 });
      return;
    }

    if (hint) {
      setResume({
        loading: true,
        reportId: hint,
        hasReport: true,
        surveyCompleted: false,
        birthDate: null,
      });
    } else {
      setResume((s) => ({ ...s, loading: true }));
    }

    void (async () => {
      try {
        const result = await fetchHomeResumeClient(hint || undefined);
        if (cancelled) return;

        if (!result.ok) {
          if (result.status === 401) {
            setResume({
              loading: false,
              reportId: isSignedIn ? null : hint || null,
              hasReport: Boolean(hint),
              surveyCompleted: false,
              birthDate: null,
            });
            setRelCounts({ pending: 0, completed: 0 });
            return;
          }
          console.error("home/resume:", result.error);
          setResume({
            loading: false,
            reportId: null,
            hasReport: false,
            surveyCompleted: false,
            birthDate: null,
          });
          setRelCounts({ pending: 0, completed: 0 });
          return;
        }

        const data = result.data;
        const storedBefore =
          typeof window !== "undefined"
            ? localStorage.getItem("reportId")?.trim() ?? ""
            : "";
        const reportId = applyResumeReportIdToStorage(data);
        if (reportId) {
          for (const oldId of [hint, storedBefore].filter(
            (id) => id && id !== reportId,
          )) {
            migrateLocalReportSessions(oldId, reportId);
          }
          syncBirthFromResumeFields(reportId, {
            birthDate: data.birthDate,
            birthTime: data.birthTime,
            birthPlace: data.birthPlace,
          });
          await hydrateReportSessions(reportId, {
            surveyCompleted: data.surveyCompleted === true,
          });
        }
        const summary = data.relationshipSummary ?? {
          pending: 0,
          completed: 0,
        };

        setResume({
          loading: false,
          reportId,
          hasReport: data.hasReport === true,
          surveyCompleted: data.surveyCompleted === true,
          birthDate: data.birthDate?.trim() || null,
        });
        setRelCounts({
          pending: summary.pending ?? 0,
          completed: summary.completed ?? 0,
        });
      } catch (e) {
        console.error("home/resume fetch:", e);
        if (!cancelled) {
          setResume({
            loading: false,
            reportId: null,
            hasReport: false,
            surveyCompleted: false,
            birthDate: null,
          });
          setRelCounts({ pending: 0, completed: 0 });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const goToSurvey = useCallback(
    (reportId: string) => {
      const inviteToken = localStorage.getItem("inviteToken")?.trim() ?? "";
      const params = new URLSearchParams();
      if (inviteToken) params.set("token", inviteToken);
      else params.set("reportId", reportId);
      router.push(`/survey-v2?${params.toString()}`);
    },
    [router],
  );

  const createReportAndSurvey = useCallback(async () => {
    const inviteToken = localStorage.getItem("inviteToken") || "";
    setCreatingReport(true);
    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          name: null,
          clerk_user_id: userId ?? null,
          birth_date: null,
          birth_time: null,
          birth_place: null,
          report_type: inviteToken ? "relationship" : "self",
          plan_type: inviteToken ? "paid" : "free",
          payment_status: inviteToken ? "paid" : "none",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("리포트를 만드는 데 실패했어요. 잠시 후 다시 시도해 주세요.");
      setCreatingReport(false);
      return;
    }

    localStorage.setItem("reportId", data.id);
    setResume({
      loading: false,
      reportId: data.id,
      hasReport: true,
      surveyCompleted: false,
      birthDate: null,
    });
    if (inviteToken) localStorage.setItem("inviteToken", inviteToken);

    setCreatingReport(false);
    goToSurvey(data.id);
  }, [goToSurvey, userId]);

  const startFreeSurvey = useCallback(async () => {
    if (creatingReport) return;

    const existing =
      resume.reportId?.trim() ||
      localStorage.getItem("reportId")?.trim() ||
      "";

    if (existing && hasSurveyV2Session(existing)) {
      setStartChoiceOpen(false);
      if (
        hasResultsDashboardPrerequisites(
          existing,
          resume.surveyCompleted,
          resume.birthDate,
        )
      ) {
        router.push(resultsDashboardPath(existing));
      } else {
        router.push(
          `/survey-v2/complete?reportId=${encodeURIComponent(existing)}`,
        );
      }
      return;
    }

    if (existing && resume.hasReport && !resume.surveyCompleted) {
      setStartChoiceOpen(false);
      goToSurvey(existing);
      return;
    }

    setStartChoiceOpen(false);
    await createReportAndSurvey();
  }, [
    creatingReport,
    createReportAndSurvey,
    goToSurvey,
    resume.hasReport,
    resume.reportId,
    resume.surveyCompleted,
    resume.birthDate,
    router,
  ]);

  const openStartChoice = useCallback(() => {
    if (creatingReport) return;
    setStartChoiceOpen(true);
  }, [creatingReport]);

  const openLoginFromStart = useCallback(() => {
    setStartChoiceOpen(false);
    setAuthModalOpen(true);
  }, []);

  const resetResume = useCallback(() => {
    localStorage.removeItem("reportId");
    setRelCounts({ pending: 0, completed: 0 });
    setResume({
      loading: false,
      reportId: null,
      hasReport: false,
      surveyCompleted: false,
      birthDate: null,
    });
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || resume.loading || !resume.reportId) return;
    const surveyDone =
      resume.surveyCompleted || hasSurveyV2Session(resume.reportId);
    if (!surveyDone) return;
    if (
      !hasResultsDashboardPrerequisites(
        resume.reportId,
        resume.surveyCompleted,
        resume.birthDate,
      )
    ) {
      return;
    }
    router.replace(resultsDashboardPath(resume.reportId));
  }, [
    isLoaded,
    isSignedIn,
    resume.loading,
    resume.reportId,
    resume.surveyCompleted,
    resume.birthDate,
    router,
  ]);

  const diagExtra = useMemo(
    () => ({
      landingShell: "stitch-organic",
      resume,
      relCounts,
    }),
    [resume, relCounts],
  );

  return (
    <>
      <FirstEntryDiagnostics scope="HomeContent" extra={diagExtra} />
      <StitchLandingPage
        resume={resume}
        relCounts={relCounts}
        creatingReport={creatingReport}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenStartChoice={openStartChoice}
        onResetResume={resetResume}
      />

      <StartChoiceModal
        open={startChoiceOpen}
        busy={creatingReport}
        onClose={() => setStartChoiceOpen(false)}
        onStartFree={() => void startFreeSurvey()}
        onLogin={openLoginFromStart}
      />

      <AnimatePresence>
        {authModalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-white/88 backdrop-blur-xl"
              aria-label="로그인 창 닫기"
              onClick={() => setAuthModalOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.99 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[101] w-full max-w-[420px] rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-[0_24px_64px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="text-left">
                  <h2
                    id="auth-modal-title"
                    className="text-lg font-semibold tracking-tight text-slate-800"
                  >
                    탐사를 이어가려면
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Google 계정으로 빠르게 시작하거나, 이메일로 로그인할 수
                    있어요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="닫기"
                >
                  <span className="block text-xl leading-none">×</span>
                </button>
              </div>
              <HomeAuthSignInPanel />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}