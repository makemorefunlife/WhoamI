"use client";

import { useRouter } from "next/navigation";
import { useClerkReady } from "@/lib/clerk/useClerkReady";
import { hasSurveyV2Session } from "@/lib/v2/survey/session";
import {
  hasResultsDashboardPrerequisites,
  resultsDashboardPath,
} from "@/lib/v2/results/canShowResultsDashboard";
import { relationHubPath } from "@/lib/stitch/hubPaths";
import type {
  RelCounts,
  ResumeState,
} from "@/components/home/HomeAuthActions";

type Props = {
  resume: ResumeState;
  relCounts: RelCounts;
  creatingReport: boolean;
  onOpenStartChoice: () => void;
  onResetResume: () => void;
};

export default function StitchHomeCta({
  resume,
  relCounts,
  creatingReport,
  onOpenStartChoice,
  onResetResume,
}: Props) {
  const router = useRouter();
  const { isSignedIn } = useClerkReady();

  const awaitingResume =
    resume.loading && (Boolean(resume.reportId) || isSignedIn);

  const goToResults = () => {
    const id = resume.reportId!;
    if (
      hasResultsDashboardPrerequisites(
        id,
        resume.surveyCompleted,
        resume.birthDate,
      )
    ) {
      router.push(resultsDashboardPath(id));
    } else {
      router.push(`/survey-v2/complete?reportId=${encodeURIComponent(id)}`);
    }
  };

  if (awaitingResume) {
    return (
      <p className="text-sm text-on-surface-variant" aria-live="polite">
        잠시만요…
      </p>
    );
  }

  if (
    resume.reportId &&
    resume.hasReport &&
    (resume.surveyCompleted || hasSurveyV2Session(resume.reportId))
  ) {
    const dashboardReady = hasResultsDashboardPrerequisites(
      resume.reportId,
      resume.surveyCompleted,
      resume.birthDate,
    );

    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <button
          type="button"
          className="stitch-cta-primary w-full sm:w-auto"
          onClick={goToResults}
        >
          {dashboardReady ? "Blueprint 보기" : "결과 보기"}
        </button>
        <button
          type="button"
          className="stitch-cta-secondary w-full sm:w-auto"
          onClick={() =>
            router.push(relationHubPath(resume.reportId!))
          }
        >
          관계 허브
          <span className="mt-0.5 block text-xs font-normal opacity-70">
            대기 {relCounts.pending} · 완료 {relCounts.completed}
          </span>
        </button>
        {isSignedIn ? (
          <button
            type="button"
            className="text-sm text-on-surface-variant underline-offset-2 hover:text-accent-emerald"
            onClick={onResetResume}
          >
            새로 시작하기
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-stretch gap-4">
      <button
        type="button"
        className="stitch-cta-primary w-full"
        disabled={creatingReport}
        onClick={onOpenStartChoice}
      >
        {creatingReport ? "준비하는 중…" : "시작하기"}
        {!creatingReport ? (
          <span className="text-base font-normal opacity-90" aria-hidden>
            →
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className="stitch-cta-secondary w-full sm:w-fit"
        onClick={() => router.push("/how-it-works")}
      >
        How it works
      </button>
    </div>
  );
}
