"use client";

import type { EssenceActionGuideline } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { isGenericRomanticActionPhrase } from "@/lib/relationship/romanticEverydayText";
import { useReportTone } from "./ReportSurface";

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function ActionSpeech({ text }: { text: string }) {
  const body = text.trim();
  if (!body || isGenericRomanticActionPhrase(body)) return null;
  return (
    <p className="rounded-xl bg-accent-rose-soft px-4 py-3 text-sm leading-relaxed text-on-surface-variant">
      <span aria-hidden className="mr-1 text-on-surface-variant/70">
        “
      </span>
      {body}
      <span aria-hidden className="ml-0.5 text-on-surface-variant/70">
        ”
      </span>
    </p>
  );
}

export default function EssenceActionGuidelineList({
  items,
  polish,
}: {
  items: EssenceActionGuideline[];
  polish: (text: string) => string;
}) {
  const tone = useReportTone();

  if (!items.length) return null;

  return (
    <div className="space-y-5">
      {items.map((item, index) => {
        const title = polish(item.action_title);
        const reason = item.saju_reason ? polish(item.saju_reason) : "";
        const example = item.real_life_example
          ? polish(item.real_life_example)
          : "";
        const speech = item.real_speech_tip
          ? polish(item.real_speech_tip)
          : "";

        return (
          <article
            key={`${item.action_title}-${index}`}
            className={[
              "flex gap-3 border-b pb-5 last:border-0 last:pb-0",
              tone.tableBorder,
            ].join(" ")}
          >
            <span
              className="shrink-0 pt-0.5 font-mono text-[11px] font-medium tabular-nums text-on-surface-variant/70"
              aria-hidden
            >
              {formatIndex(index)}
            </span>
            <div className="min-w-0 flex-1 space-y-2.5">
              <p className={tone.bodyMedium}>{title}</p>
              {reason ? (
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {reason}
                </p>
              ) : null}
              {example ? (
                <p className="text-xs leading-relaxed text-on-surface-variant/90">
                  <span className="font-medium text-on-surface-variant">
                    이런 순간에
                  </span>
                  {" — "}
                  {example}
                </p>
              ) : null}
              {speech ? <ActionSpeech text={speech} /> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
