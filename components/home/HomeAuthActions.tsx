"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import GlowButton from "@/components/space/GlowButton";
import SubtleButtonIcon from "@/components/ui/SubtleButtonIcon";

export type ResumeState = {
  loading: boolean;
  reportId: string | null;
  hasReport: boolean;
  surveyCompleted: boolean;
  birthDate: string | null;
};

export type RelCounts = { pending: number; completed: number };

function loggingEnabled() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEBUG_FIRST_ENTRY === "1"
  );
}

function resolveCtaBranch(
  isLoaded: boolean,
  isSignedIn: boolean,
  resume: ResumeState,
): string {
  if (!isLoaded) return "clerk-loading";
  if (!isSignedIn) return "guest-start";
  if (resume.loading) return "resume-loading";
  if (resume.reportId && resume.hasReport && resume.surveyCompleted) {
    return "hub-completed";
  }
  if (resume.reportId && resume.hasReport && !resume.surveyCompleted) {
    return "resume-survey";
  }
  return "start-new";
}

/** Clerk 로드·로그인·resume 복구가 필요한 CTA 영역만 분리 */
export default function HomeAuthActions({
  resume,
  relCounts,
  creatingReport,
  rocketPlaying,
  onOpenAuth,
  onStartExploration,
  onResetResume,
}: {
  resume: ResumeState;
  relCounts: RelCounts;
  creatingReport: boolean;
  rocketPlaying: boolean;
  onOpenAuth: () => void;
  onStartExploration: () => void;
  onResetResume: () => void;
}) {
  const router = useRouter();
  const { isLoaded, isSignedIn, clerkUnavailable } = useClerkReady();

  useEffect(() => {
    if (!loggingEnabled()) return;
    console.info("[WhoamI:first-entry:cta]", {
      ctaBranch: resolveCtaBranch(isLoaded, isSignedIn, resume),
      isLoaded,
      isSignedIn,
      resume,
    });
  }, [isLoaded, isSignedIn, resume]);

  if (!isSignedIn) {
    if (resume.loading) {
      return (
        <div className="mt-8 text-sm text-white/55 sm:mt-10" aria-live="polite">
          탐사 기록 확인 중…
        </div>
      );
    }

    if (resume.reportId && resume.hasReport && resume.surveyCompleted) {
      return (
        <div className="mx-auto mt-8 w-full max-w-md animate-fade-in-up delay-200 space-y-6 px-1 sm:mt-10 sm:space-y-7">
          <h2 className="text-center text-[1.2rem] font-medium tracking-[-0.02em] text-white/90 sm:text-[1.45rem]">
            탐사실
          </h2>
          <div className="flex flex-col gap-3 sm:gap-3.5">
            <GlowButton
              type="button"
              variant="primary"
              className="w-full text-[0.9375rem] font-semibold sm:text-[15px]"
              onClick={() =>
                router.push(
                  `/blueprint-preview?reportId=${encodeURIComponent(resume.reportId!)}`,
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <SubtleButtonIcon kind="dashboard" />
                Blueprint 보기
              </span>
            </GlowButton>
            <GlowButton
              type="button"
              variant="secondary"
              className="w-full text-[0.9375rem] font-medium sm:text-[15px]"
              onClick={() =>
                router.push(
                  `/relationships?myReportId=${encodeURIComponent(resume.reportId!)}`,
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <SubtleButtonIcon kind="relationship" />
                관계 분석
              </span>
            </GlowButton>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="mx-auto block text-sm text-white/55 underline-offset-2 hover:text-white/75 hover:underline"
          >
            계정에 저장하려면 로그인
          </button>
        </div>
      );
    }

    if (resume.reportId && resume.hasReport && !resume.surveyCompleted) {
      return (
        <div className="mt-8 w-full max-w-sm animate-fade-in-up delay-200 space-y-4 sm:mt-10">
          <p className="text-left text-sm leading-relaxed text-white/75">
            설문을 아직 마치지 않았어요. 이어서 진행할 수 있어요.
          </p>
          <GlowButton
            type="button"
            variant="primary"
            className="w-full text-[0.9375rem] font-semibold sm:text-[15px]"
            onClick={() => {
              const tok = localStorage.getItem("inviteToken")?.trim();
              router.push(
                tok ? `/survey-v2?token=${encodeURIComponent(tok)}` : "/survey-v2",
              );
            }}
          >
            설문 이어하기
          </GlowButton>
        </div>
      );
    }

    return (
      <div className="mt-12 animate-fade-in-up delay-200 space-y-3 sm:mt-16">
        {clerkUnavailable ? (
          <p className="mx-auto max-w-sm text-center text-xs leading-relaxed text-amber-200/85">
            로그인 서비스(Clerk)에 연결하지 못했어요. 광고·추적 차단을 잠시 끄거나,
            새로고침 후 다시 시도해 주세요.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onStartExploration}
          disabled={creatingReport || rocketPlaying}
          className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#6bb5ff] to-[#4a90e2] px-10 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[#6bb5ff]/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          <span>{creatingReport || rocketPlaying ? "준비 중…" : "시작하기"}</span>
          <span
            className="animate-float-rocket text-2xl leading-none md:text-[1.75rem]"
            aria-hidden
          >
            🚀
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenAuth}
          className="text-sm text-white/55 underline-offset-2 hover:text-white/75 hover:underline"
        >
          이미 계정이 있어요
        </button>
      </div>
    );
  }

  if (resume.loading) {
    return (
      <div className="mt-8 text-sm text-white/55 sm:mt-10" aria-live="polite">
        {resume.reportId
          ? "설문 응답 여부 확인 중…"
          : "탐사 기록 확인 중…"}
      </div>
    );
  }

  if (resume.reportId && resume.hasReport && resume.surveyCompleted) {
    return (
      <div className="mx-auto mt-8 w-full max-w-md animate-fade-in-up delay-200 space-y-6 px-1 sm:mt-10 sm:space-y-7">
        <h2 className="text-center text-[1.2rem] font-medium tracking-[-0.02em] text-white/90 sm:text-[1.45rem]">
          탐사실
          {resume.loading ? (
            <span className="mt-1 block text-xs font-normal text-white/45">
              갱신 중…
            </span>
          ) : null}
        </h2>
        <div className="flex flex-col gap-3 sm:gap-3.5">
          <GlowButton
            type="button"
            variant="primary"
            className="w-full text-[0.9375rem] font-semibold sm:text-[15px]"
            onClick={() =>
              router.push(
                `/blueprint-preview?reportId=${encodeURIComponent(resume.reportId!)}`,
              )
            }
          >
            <span className="inline-flex items-center gap-2">
              <SubtleButtonIcon kind="dashboard" />
              나 분석 (Blueprint)
            </span>
          </GlowButton>
          <div className="space-y-1.5">
            <GlowButton
              type="button"
              variant="secondary"
              className="w-full text-[0.9375rem] font-medium sm:text-[15px]"
              onClick={() =>
                router.push(
                  `/relationships?myReportId=${encodeURIComponent(resume.reportId!)}`,
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <SubtleButtonIcon kind="relationship" />
                관계 탐사실
              </span>
            </GlowButton>
            <p className="text-center text-[0.8125rem] tabular-nums leading-snug text-white/45 sm:text-sm">
              • 대기 {relCounts.pending} · 완료 {relCounts.completed}
            </p>
          </div>
        </div>
        <GlowButton
          type="button"
          variant="secondary"
          className="w-full text-[0.9375rem] font-medium"
          onClick={onResetResume}
        >
          <span className="inline-flex items-center gap-2">
            <SubtleButtonIcon kind="redo" />
            + 새 탐사
          </span>
        </GlowButton>
      </div>
    );
  }

  if (resume.reportId && resume.hasReport && !resume.surveyCompleted) {
    return (
      <div className="mt-8 w-full max-w-sm animate-fade-in-up delay-200 space-y-4 sm:mt-10">
        <p className="text-left text-sm leading-relaxed text-white/75">
          설문을 아직 마치지 않았어요. 이어서 하거나, 새 탐사를 시작할 수 있어요.
        </p>
        <GlowButton
          type="button"
          variant="primary"
          className="w-full text-[0.9375rem] font-semibold sm:text-[15px]"
          onClick={() => {
            const tok = localStorage.getItem("inviteToken")?.trim();
            router.push(
              tok ? `/survey-v2?token=${encodeURIComponent(tok)}` : "/survey-v2",
            );
          }}
        >
          <span className="inline-flex items-center gap-2">
            <SubtleButtonIcon kind="dashboard" />
            설문 이어하기
          </span>
        </GlowButton>
        <GlowButton
          type="button"
          variant="ghost"
          className="w-full text-sm font-medium"
          onClick={onResetResume}
        >
          <span className="inline-flex items-center gap-2">
            <SubtleButtonIcon kind="redo" />
            이어가지 않고 새로 시작하기
          </span>
        </GlowButton>
      </div>
    );
  }

  return (
    <div className="mt-12 animate-fade-in-up delay-200 sm:mt-16">
      <button
        type="button"
        onClick={onStartExploration}
        disabled={creatingReport || rocketPlaying}
        className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#6bb5ff] to-[#4a90e2] px-10 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[#6bb5ff]/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        <span>{creatingReport || rocketPlaying ? "준비 중…" : "시작하기"}</span>
        <span
          className="animate-float-rocket text-2xl leading-none md:text-[1.75rem]"
          aria-hidden
        >
          🚀
        </span>
      </button>
    </div>
  );
}
