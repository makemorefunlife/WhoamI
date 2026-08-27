// app/homecontent.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { AnimatePresence, motion } from "framer-motion";
import type { RelCounts, ResumeState } from "@/lib/home/homeEntryTypes";
import {
  invalidateReportSession,
  loadReportSession,
  getCachedReportId,
} from "@/lib/home/reportSession";
import { invalidateHomeResumeCache } from "@/lib/home/fetchHomeResumeClient";
import FirstEntryDiagnostics from "@/components/debug/FirstEntryDiagnostics";
import StitchLandingPage from "@/components/landing/stitch/StitchLandingPage";
import StartChoiceModal from "@/components/landing/stitch/StartChoiceModal";
import { hasSurveyV2Session } from "@/lib/v2/survey/session";
import { setStitchAuthHandler } from "@/lib/stitch/authBridge";
import { resolveEntryDestination } from "@/lib/routing/resolveEntryDestination";
import type { EntryIntent } from "@/lib/routing/resolveEntryDestination";
import {
  resolveHubHrefForIntent,
  blueprintPath,
  relationHubPath,
} from "@/lib/stitch/hubPaths";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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

const emptyResume = (): ResumeState => ({
  loading: false,
  reportId: null,
  hasReport: false,
  surveyCompleted: false,
  birthDate: null,
});

/**
 * Stitch 단일 진입 플로우:
 * 랜딩 [시작하기] → 모달(설문/로그인) → 설문 10문항 → 출생 → Blueprint
 * SSOT: loadReportSession (/api/home/resume). localStorage.reportId는 힌트만.
 */
export default function HomeContent() {
  const router = useRouter();
  const { messages, href: localize } = useLocale();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, userId } = useClerkReady();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [startChoiceOpen, setStartChoiceOpen] = useState(false);
  const [creatingReport, setCreatingReport] = useState(false);
  const [resume, setResume] = useState<ResumeState>({
    ...emptyResume(),
    loading: true,
  });
  const [relCounts, setRelCounts] = useState<RelCounts>({
    pending: 0,
    completed: 0,
  });

  useEffect(() => {
    setStitchAuthHandler(() => setAuthModalOpen(true));
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
      setResume(emptyResume());
      setRelCounts({ pending: 0, completed: 0 });
      return;
    }

    setResume((s) => ({
      ...s,
      loading: true,
      reportId: hint || s.reportId,
      hasReport: Boolean(hint || s.reportId),
    }));

    void (async () => {
      try {
        const session = await loadReportSession({
          context: "home",
          hydrate: true,
        });
        if (cancelled) return;

        setResume({
          loading: false,
          reportId: session.reportId || null,
          hasReport: session.hasReport,
          surveyCompleted: session.surveyCompleted,
          birthDate: session.birthDate,
        });
        setRelCounts(session.relationshipSummary);
      } catch (e) {
        console.error("[home] session_error");
        if (!cancelled) {
          setResume(emptyResume());
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
      router.push(localize(`${ROUTES.surveyV2}?${params.toString()}`));
    },
    [router, localize],
  );

  const createReportAndSurvey = useCallback(async () => {
    if (!userId) {
      setAuthModalOpen(true);
      return;
    }
    const inviteToken = localStorage.getItem("inviteToken") || "";
    setCreatingReport(true);
    invalidateReportSession();
    invalidateHomeResumeCache();

    let data: { id: string };
    try {
      const res = await fetch("/api/report/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: "self",
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };
      if (!res.ok || !body.id) {
        console.error("[home] report_create_failed", res.status);
        alert(messages.errors.generic);
        setCreatingReport(false);
        return;
      }
      data = { id: body.id };
    } catch (e) {
      console.error("[home] report_create_error");
      alert(messages.errors.network);
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
  }, [goToSurvey, userId, messages]);

  const startFreeSurvey = useCallback(async () => {
    if (creatingReport) return;
    setStartChoiceOpen(false);
    await createReportAndSurvey();
  }, [creatingReport, createReportAndSurvey]);

  const openStartChoice = useCallback(() => {
    if (creatingReport) return;
    setStartChoiceOpen(true);
  }, [creatingReport]);

  const openLoginFromStart = useCallback(() => {
    setStartChoiceOpen(false);
    setAuthModalOpen(true);
  }, []);

  const safeNavigate = useCallback(
    async (intent: EntryIntent) => {
      setStartChoiceOpen(false);

      const reportIdHint =
        resume.reportId?.trim() || getCachedReportId() || undefined;

      if (intent === "blueprint") {
        if (isSignedIn) {
          const href = await resolveHubHrefForIntent("blueprint", {
            urlHint: reportIdHint,
            isSignedIn: true,
          });
          router.push(localize(href));
        } else if (reportIdHint) {
          router.push(localize(blueprintPath(reportIdHint)));
        } else {
          await createReportAndSurvey();
        }
        return;
      }

      if (intent === "relationships") {
        if (isSignedIn) {
          const href = await resolveHubHrefForIntent("relationships", {
            urlHint: reportIdHint,
            isSignedIn: true,
          });
          router.push(localize(href));
        } else {
          router.push(localize(relationHubPath(reportIdHint || "")));
        }
        return;
      }

      if (intent === "decision") {
        router.push(localize(ROUTES.decision));
        return;
      }

      const hubDestination = resolveEntryDestination({
        intent,
        session: null,
        isSignedIn: isSignedIn ?? false,
        reportIdHint,
      });
      if (hubDestination) {
        router.push(localize(hubDestination));
        return;
      }

      const destination = resolveEntryDestination({
        intent,
        session:
          resume.reportId != null
            ? {
                reportId: resume.reportId,
                source: "resume" as const,
                invalidHint: false,
                surveyCompleted:
                  resume.surveyCompleted ||
                  (resume.reportId ? hasSurveyV2Session(resume.reportId) : false),
                hasReport: resume.hasReport,
                birthDate: resume.birthDate,
                birthTime: null,
                birthPlace: null,
                isPremium: false,
                relationshipSummary: relCounts,
              }
            : null,
        isSignedIn: isSignedIn ?? false,
        reportIdHint,
      });
      if (destination) router.push(localize(destination));
    },
    [
      createReportAndSurvey,
      isSignedIn,
      relCounts,
      resume.birthDate,
      resume.hasReport,
      resume.reportId,
      resume.surveyCompleted,
      router,
      localize,
    ],
  );

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
        resumeLoading={(isSignedIn ?? false) && resume.loading}
        creatingReport={creatingReport}
        onOpenStartChoice={openStartChoice}
      />

      <StartChoiceModal
        open={startChoiceOpen}
        signedIn={isSignedIn ?? false}
        busy={creatingReport}
        onClose={() => setStartChoiceOpen(false)}
        onStartFree={() => void startFreeSurvey()}
        onLogin={openLoginFromStart}
        onGoBlueprint={() => void safeNavigate("blueprint")}
        onGoRelationships={() => void safeNavigate("relationships")}
        onGoDecision={() => void safeNavigate("decision")}
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
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
              aria-label={messages.common.close}
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
              className="relative z-[101] w-full max-w-[420px] rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-2xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="text-left">
                  <h2
                    id="auth-modal-title"
                    className="stitch-headline text-lg font-bold tracking-tight text-primary"
                  >
                    {messages.landing.authModalTitle}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-on-surface-variant/80">
                    {messages.landing.authModalBody}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="shrink-0 rounded-full p-2 text-on-surface-variant/60 transition hover:bg-secondary/10 hover:text-on-surface"
                  aria-label={messages.common.close}
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
