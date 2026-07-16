"use client";

import type { EssenceActionGuideline } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { isGenericRomanticActionPhrase } from "@/lib/relationship/romanticEverydayText";
import { useReportTone } from "./ReportSurface";
import { useMessages } from "@/lib/i18n/LocaleProvider";

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function ActionSpeechTip({ text }: { text: string }) {
  const t = useMessages().relationshipDrilldown.layout;
  const body = text.trim();
  if (!body || isGenericRomanticActionPhrase(body)) return null;
  return (
    <p className="text-sm leading-relaxed text-on-surface-variant">
      <span className="font-medium text-on-surface">{t.actionSpeechTipLabel}</span>
      <span aria-hidden className="text-on-surface-variant/70">
        “
      </span>
      {body}
      <span aria-hidden className="text-on-surface-variant/70">
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
              <p className={tone.bodyMedium}>
                {title}
                {reason ? (
                  <>
                    <span className="text-on-surface-variant">: </span>
                    <span className="font-normal text-on-surface-variant">
                      {reason}
                    </span>
                  </>
                ) : null}
              </p>
              {speech ? <ActionSpeechTip text={speech} /> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
