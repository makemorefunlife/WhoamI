// app/homecontent.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { resolveClerkDisplayName } from "@/lib/clerk/displayName";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { AnimatePresence, motion } from "framer-motion";
import { Gloria_Hallelujah } from "next/font/google";
import { supabase } from "@/lib/supabase/client";
import FirstEntryDiagnostics from "@/components/debug/FirstEntryDiagnostics";
import HomeAuthActions from "@/components/home/HomeAuthActions";
import HomeClerkGate from "@/components/home/HomeClerkGate";
import HomeLandingDecor from "@/components/home/HomeLandingDecor";

const heroTitleFont = Gloria_Hallelujah({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

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
  const { user } = useUser();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [creatingReport, setCreatingReport] = useState(false);
  const [rocketPlaying, setRocketPlaying] = useState(false);
  /** 로컬 reportId 기준 서버 설문 완료 여부 (null: 아직 조회 전) */
  const [resume, setResume] = useState<{
    loading: boolean;
    reportId: string | null;
    hasReport: boolean;
    surveyCompleted: boolean;
    name: string | null;
  }>({ loading: false, reportId: null, hasReport: false, surveyCompleted: false, name: null });
  /** 홈 재방문 — 관계 허브 요약 카운트 */
  const [relCounts, setRelCounts] = useState({ pending: 0, completed: 0 });

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
    if (!isSignedIn) {
      setResume({
        loading: false,
        reportId: null,
        hasReport: false,
        surveyCompleted: false,
        name: null,
      });
      setRelCounts({ pending: 0, completed: 0 });
      return;
    }

    let cancelled = false;

    const hint =
      typeof window !== "undefined"
        ? localStorage.getItem("reportId")?.trim() ?? ""
        : "";

    if (hint) {
      setResume({
        loading: true,
        reportId: hint,
        hasReport: true,
        surveyCompleted: false,
        name: resolveClerkDisplayName(user),
      });
    } else {
      setResume((s) => ({ ...s, loading: true }));
    }

    void (async () => {
      const url = hint
        ? `/api/home/resume?reportId=${encodeURIComponent(hint)}`
        : "/api/home/resume";

      try {
        const res = await fetch(url);
        const data = (await res.json()) as {
          error?: string;
          reportId?: string | null;
          hasReport?: boolean;
          surveyCompleted?: boolean;
          name?: string | null;
          invalidHint?: boolean;
          relationshipSummary?: { pending: number; completed: number };
        };

        if (cancelled) return;

        if (res.status === 401) {
          setResume({
            loading: false,
            reportId: null,
            hasReport: false,
            surveyCompleted: false,
            name: null,
          });
          setRelCounts({ pending: 0, completed: 0 });
          return;
        }

        if (!res.ok) {
          console.error("home/resume:", data.error ?? res.status);
          setResume({
            loading: false,
            reportId: null,
            hasReport: false,
            surveyCompleted: false,
            name: null,
          });
          setRelCounts({ pending: 0, completed: 0 });
          return;
        }

        if (data.invalidHint) {
          localStorage.removeItem("reportId");
        }

        const reportId =
          typeof data.reportId === "string" && data.reportId.trim()
            ? data.reportId.trim()
            : null;

        if (reportId) {
          localStorage.setItem("reportId", reportId);
        } else {
          localStorage.removeItem("reportId");
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
          name: typeof data.name === "string" ? data.name : null,
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
            name: null,
          });
          setRelCounts({ pending: 0, completed: 0 });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user]);

  const launchSurvey = useCallback(
    async (nameTrimmed: string) => {
      const inviteToken = localStorage.getItem("inviteToken") || "";
      setCreatingReport(true);
      const { data, error } = await supabase
        .from("reports")
        .insert([
          {
            name: nameTrimmed,
            clerk_user_id: userId,
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
        name: nameTrimmed,
      });
      if (inviteToken) localStorage.setItem("inviteToken", inviteToken);

      setCreatingReport(false);
      setRocketPlaying(true);

      window.setTimeout(() => {
        if (inviteToken) {
          router.push(`/survey?token=${encodeURIComponent(inviteToken)}`);
        } else {
          router.push("/survey");
        }
      }, 1400);
    },
    [router, userId],
  );

  const onStartExploration = useCallback(() => {
    if (!userId || creatingReport || rocketPlaying) return;
    const displayName = resolveClerkDisplayName(user);
    void launchSurvey(displayName);
  }, [userId, user, creatingReport, rocketPlaying, launchSurvey]);

  const resetResume = useCallback(() => {
    localStorage.removeItem("reportId");
    localStorage.removeItem("surveyNickname");
    setRelCounts({ pending: 0, completed: 0 });
    setResume({
      loading: false,
      reportId: null,
      hasReport: false,
      surveyCompleted: false,
      name: null,
    });
  }, []);

  const diagExtra = useMemo(
    () => ({
      landingShell: "hero-always",
      resume,
      relCounts,
    }),
    [resume, relCounts],
  );

  return (
    <>
      <FirstEntryDiagnostics scope="HomeContent" extra={diagExtra} />
      <div className="relative min-h-screen bg-gradient-to-br from-[#0a0a2a] via-[#12123a] to-[#1a1a4a] overflow-hidden">
      <HomeLandingDecor />

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 pb-12 pt-10 text-center sm:pt-16">
        {/* 제목 — 손글씨 + 네온 글로우 + 금색 궤도 장식 */}
        <div className="relative mx-auto mb-6 w-full max-w-[min(100%,26rem)] animate-fade-in px-2 sm:max-w-md">
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[118%] max-w-none -translate-x-1/2 -translate-y-[46%] select-none sm:w-[115%]"
            viewBox="0 0 400 260"
            aria-hidden
          >
            <defs>
              <filter
                id="orbitGlow"
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <ellipse
              cx="200"
              cy="130"
              rx="178"
              ry="72"
              fill="none"
              stroke="#f0b429"
              strokeWidth="1.6"
              opacity={0.92}
              transform="rotate(-10 200 130)"
              filter="url(#orbitGlow)"
            />
            <ellipse
              cx="200"
              cy="138"
              rx="158"
              ry="92"
              fill="none"
              stroke="#e8a838"
              strokeWidth="1.15"
              opacity={0.78}
              transform="rotate(16 200 138)"
            />
            <ellipse
              cx="200"
              cy="125"
              rx="132"
              ry="58"
              fill="none"
              stroke="#ffd578"
              strokeWidth="0.85"
              opacity={0.5}
              transform="rotate(-24 200 125)"
            />
          </svg>

          <h1
            className={`${heroTitleFont.className} hero-neon-title relative z-[1] text-balance`}
          >
            <span className="block text-[clamp(2.65rem,11vw,4.75rem)] leading-[0.98] tracking-tight">
              Aha!
            </span>
            <span className="mt-1 block text-[clamp(1.65rem,6.5vw,2.85rem)] leading-tight opacity-[0.98]">
              It&apos;s me!
            </span>
          </h1>
        </div>

        <HomeClerkGate
          failedFallback={
            <div className="mt-12 space-y-3 px-4 sm:mt-16">
              <p className="mx-auto max-w-md text-center text-sm leading-relaxed text-amber-200/90">
                로그인(Clerk) 스크립트를 불러오지 못했어요.
                <br />
                광고·추적 차단을 끄고 새로고침하거나, 시크릿 창에서 다시
                시도해 주세요.
              </p>
              <p className="text-center text-xs text-white/45">
                개발 모드에서는 <code className="text-white/60">/__clerk</code>{" "}
                프록시가 켜져 있어야 합니다.
              </p>
            </div>
          }
        >
          <HomeAuthActions
            resume={resume}
            relCounts={relCounts}
            creatingReport={creatingReport}
            rocketPlaying={rocketPlaying}
            onOpenAuth={() => setAuthModalOpen(true)}
            onStartExploration={onStartExploration}
            onResetResume={resetResume}
          />
        </HomeClerkGate>
      </div>

      {/* 로켓 발사 (탐사 시작 후) */}
      <AnimatePresence>
        {rocketPlaying && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[150] overflow-hidden bg-[#0a0a2a]/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute left-0 right-0 top-[38%] h-0 sm:top-[40%]"
              aria-hidden
            >
              <motion.div
                className="absolute flex flex-row items-center"
                initial={{ left: "33%", x: "-50%", opacity: 1 }}
                animate={{
                  left: "66%",
                  x: "-50%",
                  opacity: [1, 1, 0.45, 0],
                }}
                transition={{ duration: 1.35, ease: [0.18, 0.75, 0.12, 1] }}
              >
                {/* 진행 방향 뒤(왼쪽)로 불꽃 */}
                <motion.div
                  className="order-first mr-1 h-7 w-16 shrink-0 rounded-full bg-gradient-to-l from-transparent via-[#6bb5ff]/50 to-[#a8d8ff]/90 blur-[2px]"
                  initial={{ scaleX: 0.45 }}
                  animate={{ scaleX: 1.45 }}
                  transition={{ duration: 1.15 }}
                />
                <span className="order-last block text-7xl leading-none sm:text-8xl [transform:rotate(52deg)]">
                  🚀
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float-rocket {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        .animate-fade-in {
          animation: fade-in 1.2s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .animate-float-rocket {
          animation: float-rocket 2.5s ease-in-out infinite;
        }
        .hero-neon-title {
          color: #c8f2ff;
          text-shadow:
            0 0 8px rgba(160, 240, 255, 0.95),
            0 0 18px rgba(100, 210, 255, 0.85),
            0 0 32px rgba(60, 190, 255, 0.55),
            0 0 52px rgba(30, 160, 255, 0.35);
        }
      `}</style>
    </div>
    </>
  );
}