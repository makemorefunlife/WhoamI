"use client";

import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/** Batch 5 Part 07 (Going Forward + Decision Compass + One Next Move + Closing) */
export function DeepEssencePartFive({
  future,
  closing,
  checklist,
  t,
}: {
  future: DeepEssenceStructuredReport["future"];
  closing: string;
  checklist?: string[];
  t: DeepEssenceUiStrings;
}) {
  const rememberLabels = [t.part5.keepLabel, t.part5.loosenLabel, t.part5.recoverLabel];
  const oneNextMove = checklist && checklist.length > 0 ? checklist[0] : null;

  return (
    <div className="space-y-10">
      <div>
        <div className="text-[13px] font-medium text-primary tracking-wide">{t.part5.remember}</div>
        <div className="mt-6 space-y-6">
          {future.remember.map((line, i) => (
            <div key={i} className="rounded-xl border border-outline-variant bg-surface/50 p-5">
              <div className="text-[12px] font-semibold tracking-wider text-primary uppercase">
                {rememberLabels[i] ?? `0${i + 1}`}
              </div>
              <div className="mt-2 text-[15.5px] leading-[1.65] text-on-surface" style={serifStyle}>
                {line}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <div className="text-[12px] font-semibold tracking-wider text-primary uppercase">
          {t.part5.decisionCompassTitle}
        </div>
        <p className="mt-3 text-[15.5px] leading-[1.7] text-on-surface" style={serifStyle}>
          {future.leap}
        </p>
      </div>

      {oneNextMove && (
        <div className="rounded-xl border border-accent-rose/20 bg-accent-rose/5 p-6">
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent-rose/10 px-2 py-0.5 text-[11px] font-semibold text-accent-rose">
              {t.part5.oneNextMoveTag}
            </span>
            <span className="text-[13px] font-medium text-on-surface">
              {t.part5.oneNextMoveTitle}
            </span>
          </div>
          <p className="mt-3 text-[15px] leading-[1.65] text-on-surface">
            {oneNextMove}
          </p>
        </div>
      )}

      <blockquote className="border-primary border-l-2 py-2 pl-6">
        <p className="text-[18px] leading-[1.6] text-on-surface italic" style={serifStyle}>
          {closing}
        </p>
      </blockquote>
    </div>
  );
}
