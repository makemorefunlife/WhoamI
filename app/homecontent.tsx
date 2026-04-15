// app/homecontent.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn, useAuth, UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Gloria_Hallelujah } from "next/font/google";
import { supabase } from "@/lib/supabase/client";
import SpaceLoading from "@/components/space/SpaceLoading";

const heroTitleFont = Gloria_Hallelujah({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [creatingReport, setCreatingReport] = useState(false);
  const [rocketPlaying, setRocketPlaying] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) localStorage.setItem("inviteToken", token);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("surveyNickname");
    if (saved) setNickname(saved);
  }, []);

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
    if (isSignedIn && authModalOpen) setAuthModalOpen(false);
  }, [isSignedIn, authModalOpen]);

  const launchSurvey = useCallback(
    async (nameTrimmed: string) => {
      const inviteToken = localStorage.getItem("inviteToken") || "";
      setCreatingReport(true);
      const { data, error } = await supabase
        .from("reports")
        .insert([
          {
            name: nameTrimmed,
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
      localStorage.setItem("surveyNickname", nameTrimmed);
      if (inviteToken) localStorage.setItem("inviteToken", inviteToken);

      setCreatingReport(false);
      setRocketPlaying(true);

      const trimmed = nameTrimmed;
      void (async () => {
        try {
          const llmRes = await fetch("/api/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userInput: `이름: ${trimmed}\n(생년월일·출생 시각은 설문 이후 심화 분석 단계에서 수집 예정입니다.)`,
            }),
          });
          const llmData = await llmRes.json();
          const fullText =
            typeof llmData.full === "string" ? llmData.full : "";
          if (fullText) localStorage.setItem("llmResult", fullText);
        } catch (e) {
          console.error("LLM 호출 실패", e);
        }
      })();

      window.setTimeout(() => {
        if (inviteToken) {
          router.push(`/survey?token=${encodeURIComponent(inviteToken)}`);
        } else {
          router.push("/survey");
        }
      }, 1400);
    },
    [router],
  );

  const onNicknameSubmit = useCallback(() => {
    const t = nickname.trim();
    if (!t) {
      alert("사용할 닉네임을 입력해 주세요.");
      return;
    }
    void launchSurvey(t);
  }, [nickname, launchSurvey]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a2a]">
        <SpaceLoading
          rotateMainOnly
          rotatingStatuses={["탐사하는 중", "특징 분석 중", "패턴 분석 중"]}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0a2a] via-[#12123a] to-[#1a1a4a] overflow-hidden">
      {/* 반짝이는 별들 */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 + 0.3,
              animationDelay: Math.random() * 5 + "s",
              animationDuration: Math.random() * 3 + 2 + "s",
            }}
          />
        ))}
      </div>

      {/* 행성 1 (왼쪽 위) */}
      <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-gradient-to-br from-[#ff9a9e] to-[#fecfef] opacity-70 blur-[2px] animate-float-slow">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
      </div>

      {/* 행성 2 (오른쪽 아래) */}
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb] opacity-60 blur-[3px] animate-float-slower">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
        {/* 행성 고리 */}
        <div className="absolute -inset-4 rounded-full border-4 border-[#fbc2eb]/40 rotate-12"></div>
      </div>

      {/* 행성 3 (오른쪽 위 작게) */}
      <div className="absolute top-32 right-20 w-12 h-12 rounded-full bg-gradient-to-br from-[#ffecd2] to-[#fcb69f] opacity-70 animate-float">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
      </div>

      {/* 상단 고정: 햄버거 · 로그인/프로필 */}
      <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/[0.07] bg-[#0a0a2a]/80 px-4 py-3 backdrop-blur-md sm:px-5">
        <button
          type="button"
          className="flex flex-col gap-1.5 rounded-lg p-2 transition-colors hover:bg-white/10"
          aria-label="메뉴"
        >
          <span className="h-0.5 w-6 rounded-full bg-white/80" />
          <span className="h-0.5 w-6 rounded-full bg-white/80" />
          <span className="h-0.5 w-6 rounded-full bg-white/80" />
        </button>
        {isSignedIn ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox:
                  "h-9 w-9 ring-2 ring-white/25 shadow-md shadow-black/20",
                userButtonPopoverCard: "border border-slate-200/80",
              },
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/15"
          >
            로그인
          </button>
        )}
      </header>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 pb-12 pt-[4.5rem] text-center sm:pt-20">
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

        {/* 로그인 전: 시작하기 · 로그인 후: 닉네임 + 입력 */}
        {!isSignedIn ? (
          <div className="mt-12 animate-fade-in-up delay-200 sm:mt-16">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#6bb5ff] to-[#4a90e2] px-10 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[#6bb5ff]/40"
            >
              <span>시작하기</span>
              <span
                className="animate-float-rocket text-2xl leading-none md:text-[1.75rem]"
                aria-hidden
              >
                🚀
              </span>
            </button>
          </div>
        ) : (
          <div className="mt-10 w-full max-w-sm animate-fade-in-up delay-200 sm:mt-14">
            <p className="mb-3 text-left text-sm leading-relaxed text-white/70">
              사용할 닉네임을 입력해 주세요.
            </p>
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onNicknameSubmit();
                  }
                }}
                placeholder="닉네임"
                maxLength={40}
                className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3.5 text-left text-base text-white placeholder:text-white/35 focus:border-[#6bb5ff]/50 focus:outline-none focus:ring-2 focus:ring-[#6bb5ff]/25"
                autoComplete="nickname"
                disabled={creatingReport || rocketPlaying}
              />
              <button
                type="button"
                onClick={onNicknameSubmit}
                disabled={creatingReport || rocketPlaying}
                aria-label={
                  creatingReport || rocketPlaying ? "준비 중" : "다음으로"
                }
                className="inline-flex min-w-[3.25rem] shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-[#6bb5ff]/35 bg-gradient-to-b from-[#6bb5ff]/25 to-[#4a90e2]/20 px-4 py-3.5 text-lg font-medium text-white shadow-md transition-all duration-200 ease-out enabled:hover:border-[#a8d4ff]/85 enabled:hover:from-[#6bb5ff]/48 enabled:hover:to-[#4a90e2]/42 enabled:hover:shadow-[0_0_18px_rgba(107,181,255,0.55),0_0_36px_rgba(107,181,255,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] enabled:hover:brightness-110 enabled:active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6bb5ff]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a2a] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
              >
                {creatingReport || rocketPlaying ? "…" : "↲"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 로켓 발사 (닉네임 제출 후) */}
      <AnimatePresence>
        {rocketPlaying && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[150] overflow-hidden bg-[#0a0a2a]/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
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
            </motion.div>
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
              <div className="[&_.cl-card]:shadow-none [&_.cl-card]:border-0 [&_.cl-card]:bg-transparent">
                <SignIn
                  routing="hash"
                  signUpUrl="/sign-up"
                  fallbackRedirectUrl="/"
                  appearance={{
                    variables: {
                      colorPrimary: "#4a90e2",
                      colorText: "#0f172a",
                      colorTextSecondary: "#64748b",
                      borderRadius: "0.75rem",
                      fontSize: "0.9375rem",
                    },
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border-0 bg-transparent p-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
                      formButtonPrimary:
                        "bg-gradient-to-r from-[#6bb5ff] to-[#4a90e2] hover:opacity-95",
                      footerAction: "text-[#4a90e2]",
                      identityPreviewText: "text-slate-700",
                      formFieldInput:
                        "border-slate-200 bg-white text-slate-900",
                    },
                  }}
                />
              </div>
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(10px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(15px) translateX(-10px); }
        }
        @keyframes float-rocket {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
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
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 8s ease-in-out infinite;
        }
        .animate-float-rocket {
          animation: float-rocket 2.5s ease-in-out infinite;
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
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
  );
}