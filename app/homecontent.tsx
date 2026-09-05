// app/homecontent.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { getPublicDisplayName, hasOAuthAccount } from "@/lib/clerk/displayName";
import {
  seedDisplayNameFromClerkFallback,
  shouldPromptForDisplayName,
} from "@/lib/clerk/displayNameSync";
import DisplayNameSetupModal from "@/components/home/DisplayNameSetupModal";
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
  const { user } = useUser();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [nameSetupOpen, setNameSetupOpen] = useState(false);
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
    const connectToken = searchParams.get("connectToken");
    if (connectToken) localStorage.setItem("connectToken", connectToken);
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

  const inviteAutoRanRef = useRef(false);
  const connectAutoRanRef = useRef(false);

  const goToSurvey = useCallback(
    (reportId: string) => {
      const inviteToken = localStorage.getItem("inviteToken")?.trim() ?? "";
      const connectToken = localStorage.getItem("connectToken")?.trim() ?? "";
      const params = new URLSearchParams();
      if (inviteToken) params.set("token", inviteToken);
      else if (connectToken) params.set("connectToken", connectToken);
      else params.set("reportId", reportId);
      router.push(localize(`${ROUTES.surveyV2}?${params.toString()}`));
    },
    [router, localize],
  );

  /** 초대 링크 수락: 초대자와 내 리포트를 연결. 성공/이미완료 시 로컬 토큰 제거. */
  const completeInvite = useCallback(
    async (reportId: string, inviteToken: string) => {
      try {
        const res = await fetch("/api/invite/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteToken, reportId }),
        });
        if (res.ok || res.status === 404) {
          localStorage.removeItem("inviteToken");
        }
        return res.ok;
      } catch (e) {
        console.error("[home] invite_complete_error");
        return false;
      }
    },
    [],
  );

  /**
   * 개인 연결 링크 수락 — completeInvite와 동일한 모양(별도 시스템, 별도
   * localStorage 키)의 병렬 경로. 성공/이미완료(404) 시 로컬 토큰 제거.
   */
  const completeConnect = useCallback(
    async (reportId: string, connectToken: string) => {
      try {
        const res = await fetch("/api/connect/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: connectToken, reportId }),
        });
        if (res.ok || res.status === 404) {
          localStorage.removeItem("connectToken");
        }
        return res.ok;
      } catch (e) {
        console.error("[home] connect_complete_error");
        return false;
      }
    },
    [],
  );

  /**
   * The actual report-creation body — no display-name concerns here at
   * all. Display name is a separate, account-level attribute (Clerk
   * publicMetadata, see lib/clerk/displayNameSync.ts), fully decoupled
   * from report creation/lifecycle.
   */
  const proceedToReportCreation = useCallback(async () => {
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
    if (inviteToken) {
      localStorage.setItem("inviteToken", inviteToken);
      await completeInvite(data.id, inviteToken);
    }
    const connectToken = localStorage.getItem("connectToken") || "";
    if (connectToken) {
      await completeConnect(data.id, connectToken);
    }

    setCreatingReport(false);
    goToSurvey(data.id);
  }, [goToSurvey, messages, completeInvite, completeConnect]);

  /**
   * Explicit save from DisplayNameSetupModal (email/password signup) —
   * saves the name first, then proceeds. Display-name save and report
   * creation stay two separate calls, never coupled into one request.
   */
  const handleNameSetupSubmit = useCallback(
    async (name: string) => {
      setCreatingReport(true);
      try {
        const res = await fetch("/api/account/display-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: name }),
        });
        if (!res.ok) {
          console.error("[home] display_name_save_failed", res.status);
          alert(messages.errors.generic);
          return;
        }
        await user?.reload?.();
        setNameSetupOpen(false);
        await proceedToReportCreation();
      } catch (e) {
        console.error("[home] display_name_save_error");
        alert(messages.errors.network);
      } finally {
        setCreatingReport(false);
      }
    },
    [user, messages, proceedToReportCreation],
  );

  const createReportAndSurvey = useCallback(async () => {
    if (!userId) {
      setAuthModalOpen(true);
      return;
    }
    // Google/OAuth signup: seed publicMetadata.displayName from the
    // provider's own name, silently, only if nothing is set yet — no
    // extra prompt. Email/password signup has no name to seed from, so
    // DisplayNameSetupModal collects one (see handleNameSetupSubmit)
    // before report creation proceeds. Already has a name -> skip both.
    const existingDisplayName = getPublicDisplayName(user);
    if (shouldPromptForDisplayName(existingDisplayName, hasOAuthAccount(user))) {
      setNameSetupOpen(true);
      return;
    }
    if (!existingDisplayName) {
      await seedDisplayNameFromClerkFallback(user ?? null);
    }
    setNameSetupOpen(false);
    await proceedToReportCreation();
  }, [userId, user, proceedToReportCreation]);

  /**
   * 초대 링크로 진입 시 랜딩 히어로를 보여주지 않고 바로 이어서 진행.
   * - 로그인 안 됨 → 로그인 모달 자동 오픈
   * - 완료된 리포트 있음 → 즉시 연결 후 관계 허브로
   * - 진행 중/미완료 리포트 있음 → 그 리포트로 연결 후 설문 이어하기
   * - 리포트 없음 → 새로 생성 후 설문 (완료 후 자동 연결)
   */
  useEffect(() => {
    if (!isLoaded || resume.loading || inviteAutoRanRef.current) return;
    const inviteToken = localStorage.getItem("inviteToken")?.trim() ?? "";
    if (!inviteToken) return;

    if (!isSignedIn) {
      setAuthModalOpen(true);
      return;
    }

    inviteAutoRanRef.current = true;

    if (resume.surveyCompleted && resume.reportId) {
      void completeInvite(resume.reportId, inviteToken).then(() => {
        router.push(localize(relationHubPath(resume.reportId ?? undefined)));
      });
      return;
    }

    if (resume.hasReport && resume.reportId) {
      void completeInvite(resume.reportId, inviteToken).then(() => {
        goToSurvey(resume.reportId as string);
      });
      return;
    }

    void createReportAndSurvey();
  }, [
    isLoaded,
    isSignedIn,
    resume,
    completeInvite,
    createReportAndSurvey,
    goToSurvey,
    router,
    localize,
  ]);

  /**
   * 개인 연결 링크로 진입 시 이어서 진행 — 위 초대 링크 이펙트와 동일한
   * 구조의 병렬 경로(별도 ref, 별도 localStorage 키). 두 토큰은 서로 다른
   * 시스템이라 동시에 존재할 일이 없지만, 혹시 있어도 서로의 ref/키를
   * 건드리지 않는다.
   */
  useEffect(() => {
    if (!isLoaded || resume.loading || connectAutoRanRef.current) return;
    const connectToken = localStorage.getItem("connectToken")?.trim() ?? "";
    if (!connectToken) return;

    if (!isSignedIn) {
      setAuthModalOpen(true);
      return;
    }

    connectAutoRanRef.current = true;

    // completeConnect resolves `res.ok` — a 404 here means the token itself
    // didn't resolve (invalid/expired/reset), not "already connected" (the
    // link is a persistent, reusable token, never consumed on success). The
    // caller used to ignore this and always navigate on, so a real failure
    // looked identical to success: the user reached the dashboard with
    // nothing actually connected and no indication anything went wrong.
    if (resume.surveyCompleted && resume.reportId) {
      void completeConnect(resume.reportId, connectToken).then((ok) => {
        if (!ok) alert(messages.connect.invalidBody);
        router.push(localize(relationHubPath(resume.reportId ?? undefined)));
      });
      return;
    }

    if (resume.hasReport && resume.reportId) {
      void completeConnect(resume.reportId, connectToken).then((ok) => {
        if (!ok) alert(messages.connect.invalidBody);
        goToSurvey(resume.reportId as string);
      });
      return;
    }

    void createReportAndSurvey();
  }, [
    isLoaded,
    isSignedIn,
    resume,
    completeConnect,
    createReportAndSurvey,
    goToSurvey,
    router,
    localize,
    messages,
  ]);

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

      <DisplayNameSetupModal
        open={nameSetupOpen}
        busy={creatingReport}
        onSubmit={(name) => void handleNameSetupSubmit(name)}
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
