"use client";

import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/** Batch 7 Part 07 (Personal Operating Playbook: DO / DON'T / Decision Rules / Practice / Closing) */
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
  const doItems = future.do_items && future.do_items.length > 0 ? future.do_items : null;
  const dontItems = future.dont_items && future.dont_items.length > 0 ? future.dont_items : null;
  const decisionRules = future.decision_rules && future.decision_rules.length > 0 ? future.decision_rules : null;
  const rememberLabels = [t.part5.keepLabel, t.part5.loosenLabel, t.part5.recoverLabel];
  const oneNextMove = checklist && checklist.length > 0 ? checklist[0] : null;

  return (
    <div className="space-y-10">
      {/* SECTION A: DO */}
      <div>
        <div className="text-[13px] font-medium tracking-wide text-primary">
          {t.part5.doTitle}
        </div>
        <div className="mt-4 space-y-4">
          {doItems
            ? doItems.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-5"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                      ✓ DO 0{i + 1}
                    </span>
                    <h4 className="text-[15px] font-semibold text-on-surface">
                      {item.title}
                    </h4>
                  </div>
                  <p
                    className="mt-2 text-[14.5px] leading-[1.65] text-on-surface-variant"
                    style={serifStyle}
                  >
                    {item.body}
                  </p>
                </div>
              ))
            : future.remember.slice(0, 1).map((line, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-5"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-primary">
                    {rememberLabels[i] ?? `0${i + 1}`}
                  </div>
                  <div
                    className="mt-2 text-[15.5px] leading-[1.65] text-on-surface"
                    style={serifStyle}
                  >
                    {line}
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* SECTION B: DON'T */}
      <div>
        <div className="text-[13px] font-medium tracking-wide text-accent-rose">
          {t.part5.dontTitle}
        </div>
        <div className="mt-4 space-y-4">
          {dontItems
            ? dontItems.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-accent-rose/20 bg-accent-rose/5 p-5"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-accent-rose/10 px-2 py-0.5 text-[11px] font-bold text-accent-rose">
                      ✕ DON'T 0{i + 1}
                    </span>
                    <h4 className="text-[15px] font-semibold text-on-surface">
                      {item.title}
                    </h4>
                  </div>
                  <p
                    className="mt-2 text-[14.5px] leading-[1.65] text-on-surface-variant"
                    style={serifStyle}
                  >
                    {item.body}
                  </p>
                </div>
              ))
            : future.remember.slice(1, 3).map((line, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-accent-rose/20 bg-accent-rose/5 p-5"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-accent-rose">
                    {rememberLabels[i + 1] ?? `0${i + 2}`}
                  </div>
                  <div
                    className="mt-2 text-[15.5px] leading-[1.65] text-on-surface"
                    style={serifStyle}
                  >
                    {line}
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* SECTION C: DECISION RULES */}
      <div>
        <div className="text-[13px] font-medium tracking-wide text-primary">
          {t.part5.decisionRulesTitle}
        </div>
        <div className="mt-4 space-y-3">
          {decisionRules
            ? decisionRules.map((rule, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-outline-variant bg-surface/50 p-5 flex items-start gap-3"
                >
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-bold text-primary flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p
                    className="text-[15px] leading-[1.65] text-on-surface"
                    style={serifStyle}
                  >
                    {rule}
                  </p>
                </div>
              ))
            : (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-primary">
                    {t.part5.decisionCompassTitle}
                  </div>
                  <p
                    className="mt-3 text-[15.5px] leading-[1.7] text-on-surface"
                    style={serifStyle}
                  >
                    {future.leap}
                  </p>
                </div>
              )}
        </div>
      </div>

      {/* OPTIONAL PRACTICE: One Next Move */}
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

      {/* RECOGNITION STATEMENT */}
      <blockquote className="border-l-2 border-primary py-2 pl-6">
        <p
          className="text-[18px] italic leading-[1.6] text-on-surface"
          style={serifStyle}
        >
          {closing}
        </p>
      </blockquote>
    </div>
  );
}
