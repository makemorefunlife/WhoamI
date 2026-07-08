"use client";

import Link from "next/link";

type Props = {
  resumeLoading: boolean;
  creatingReport: boolean;
  onOpenStartChoice: () => void;
};

function HowItWorksLink() {
  return (
    <Link
      href="/how-it-works"
      className="w-fit text-sm text-on-surface-variant underline-offset-4 transition hover:text-primary hover:underline"
    >
      how it works
    </Link>
  );
}

/** Stitch 랜딩 단일 CTA — 시작하기 + how it works */
export default function StitchHomeCta({
  resumeLoading,
  creatingReport,
  onOpenStartChoice,
}: Props) {
  if (resumeLoading) {
    return (
      <p className="text-sm text-on-surface-variant" aria-live="polite">
        잠시만요…
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-stretch gap-4">
      <button
        type="button"
        className="stitch-cta-primary w-full !py-5 !text-lg shadow-[0_12px_28px_rgba(39,86,68,0.25)]"
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
      <HowItWorksLink />
    </div>
  );
}
