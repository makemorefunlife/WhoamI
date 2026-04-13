"use client";

import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase/client";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import SpaceLoading from "@/components/space/SpaceLoading";

const INTRO_STORAGE_KEY = "aha-home-intro-v1"; // [추가] 첫 방문 인트로 1회

export default function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();

  const inviteTokenFromUrl = searchParams.get("token") || "";
  const showIntakeForm = isSignedIn || !!inviteTokenFromUrl;

  const [uiReady, setUiReady] = useState(false); // [추가] localStorage 읽은 뒤에만 본 UI 표시 (플래시 방지)

  const [inviteToken, setInviteToken] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // [추가] 필드 피드백
  const [toast, setToast] = useState<{ kind: "error" | "ok"; text: string } | null>(
    null,
  );

  // [추가] 인트로
  const [playShootingStar, setPlayShootingStar] = useState(false);
  const [rippleOn, setRippleOn] = useState(false);
  const [introSequenceDone, setIntroSequenceDone] = useState(false);

  const { ref: formInViewRef, inView: formInView } = useInView({
    threshold: 0.12,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inviteTokenFromUrl) {
      localStorage.setItem("inviteToken", inviteTokenFromUrl);
      setInviteToken(inviteTokenFromUrl);
    }
  }, [inviteTokenFromUrl]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(INTRO_STORAGE_KEY);
    if (seen) {
      setIntroSequenceDone(true);
      setPlayShootingStar(false);
    } else {
      setPlayShootingStar(true);
    }
    setUiReady(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const headline = "내 행성을 이해하는 탐사를 시작합니다";

  const subtitle = useMemo(() => {
    return inviteToken
      ? "초대로 연결된 탐사예요. 18개 문항을 마치면 결과로 이어져요."
      : "YES/NO 18문항으로 성향을 탐사해요. 생년월일·시간은 무료 결과 이후 심화 분석 단계에서 입력하면 돼요.";
  }, [inviteToken]);

  const handleSubmit = useCallback(async () => {
    if (!name?.trim()) {
      alert("이름을 입력해주세요");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          name: name.trim(),
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
      alert("report 생성 실패");
      setLoading(false);
      return;
    }

    localStorage.setItem("reportId", data.id);

    if (inviteToken) {
      localStorage.setItem("inviteToken", inviteToken);
    }

    setLoading(false);

    if (inviteToken) {
      router.push(`/survey?token=${inviteToken}`);
    } else {
      router.push("/survey");
    }

    const trimmed = name.trim();
    void (async () => {
      try {
        const llmRes = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userInput: `
이름: ${trimmed}
(생년월일·출생 시각은 설문 이후 심화 분석 단계에서 수집 예정입니다.)
          `,
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
  }, [name, inviteToken, router]);

  const onStartClick = useCallback(async () => {
    if (!name?.trim()) {
      setToast({ kind: "error", text: "이름을 입력해주세요." });
      return;
    }
    setToast({ kind: "ok", text: "탐사를 시작합니다." });
    await handleSubmit();
  }, [name, handleSubmit]);

  const inputClass = (hasError: boolean, okFlash: boolean) =>
    [
      "w-full px-5 py-4 rounded-2xl border text-base transition-colors duration-300",
      "bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.96)] placeholder:text-[rgba(255,255,255,0.4)]",
      "focus:outline-none focus:ring-2 focus:ring-[#67B7FF]/35",
      hasError
        ? "border-red-400/70"
        : okFlash
          ? "border-emerald-400/70"
          : "border-[rgba(255,255,255,0.12)] focus:border-[#67B7FF]/50",
    ].join(" ");

  const starLandX = "42%";

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <SpaceLoading
          rotateMainOnly
          rotatingStatuses={["탐사하는 중", "특징 분석 중", "패턴 분석 중"]}
        />
      </main>
    );
  }

  if (!showIntakeForm) {
    return (
      <main className="w-full px-5 pb-24 pt-16 sm:pt-20">
        <GlassCard className="text-center fade-up">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#67B7FF]/90">
            Exploration
          </p>
          <h1 className="mt-4 text-balance text-[1.4rem] font-semibold leading-snug tracking-tight text-[rgba(255,255,255,0.95)] sm:text-2xl">
            {headline}
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-[rgba(255,255,255,0.7)]">
            로그인 후 18문항 탐사로 이어집니다.
          </p>
          <div className="mt-10">
            <GlowButton href="/sign-in">탐사 시작하기</GlowButton>
          </div>
        </GlassCard>
      </main>
    );
  }

  if (!uiReady) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden px-5 py-10 pb-16" />
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden px-5 py-10 pb-20 text-[rgba(255,255,255,0.95)] sm:py-12">
      {/* [추가] 별똥별 + ripple (첫 방문) */}
      <AnimatePresence>
        {playShootingStar && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-30"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-[#67B7FF] shadow-[0_0_14px_rgba(103,183,255,0.85)]"
              initial={{ top: "6%", left: starLandX, opacity: 1, scale: 1 }}
              animate={{
                top: "38%",
                left: "58%",
                opacity: [1, 1, 0.85, 0],
                scale: [1, 1.2, 0.6, 0.3],
              }}
              transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => {
                setRippleOn(true);
                localStorage.setItem(INTRO_STORAGE_KEY, "1");
                window.setTimeout(() => {
                  setRippleOn(false);
                  setPlayShootingStar(false);
                  setIntroSequenceDone(true);
                }, 900);
              }}
            />
            {rippleOn && (
              <motion.div
                className="absolute rounded-full border border-[#67B7FF]/35 bg-[#67B7FF]/10"
                style={{
                  top: "38%",
                  left: "58%",
                  width: 12,
                  height: 12,
                  marginLeft: -6,
                  marginTop: -6,
                }}
                initial={{ scale: 0.2, opacity: 0.6 }}
                animate={{ scale: 28, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* [추가] 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`fixed bottom-24 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-2xl border px-5 py-3 text-sm shadow-lg backdrop-blur-md ${
              toast.kind === "error"
                ? "border-red-400/35 bg-red-950/85 text-red-100"
                : "border-[rgba(103,183,255,0.35)] bg-[#0B1220]/92 text-[rgba(255,255,255,0.96)]"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        ref={formInViewRef}
        initial={false}
        animate={
          introSequenceDone
            ? formInView
              ? { opacity: 1, y: 0 }
              : { opacity: 0.96, y: 6 }
            : { opacity: 0, y: 24 }
        }
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6 pt-4"
      >
        <GlassCard className="!px-5 !py-8 sm:!px-7">
          <header className="space-y-3 text-center">
            {inviteToken ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B7CFF]/90">
                초대 탐사
              </p>
            ) : (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#67B7FF]/90">
                시작하기
              </p>
            )}
            <h1 className="text-balance text-xl font-semibold leading-snug tracking-tight text-[rgba(255,255,255,0.95)] sm:text-2xl">
              {headline}
            </h1>
            <p className="text-sm leading-relaxed text-[rgba(255,255,255,0.7)]">
              {subtitle}
            </p>
          </header>

          <div className="mt-6 space-y-5">
            <div className="relative">
              <label htmlFor="name" className="sr-only">
                이름
              </label>
              <input
                id="name"
                name="name"
                placeholder="닉네임 · 호칭"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass(false, false)}
                autoComplete="nickname"
              />
            </div>

            <div className="rounded-2xl border border-[rgba(103,183,255,0.28)] bg-[rgba(103,183,255,0.06)] px-4 py-4 text-left">
              <p className="text-sm font-medium text-[rgba(255,255,255,0.96)]">
                다음 단계: 18문항 탐사
              </p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-[rgba(255,255,255,0.78)]">
                <li>· 짧은 문장에 YES / NO로 답해요.</li>
                <li>· 약 3~5분 정도 걸려요.</li>
                <li>
                  · 생년월일·출생 시각·태어난 곳은{" "}
                  <span className="text-[#FFD6A5]/95">무료 결과 확인 후</span> 심화
                  분석에서 입력하면 돼요.
                </li>
              </ul>
            </div>
          </div>
        </GlassCard>

        <GlowButton onClick={onStartClick} disabled={loading}>
          {loading ? "준비 중…" : "탐사 시작하기"}
        </GlowButton>
      </motion.div>
    </main>
  );
}
