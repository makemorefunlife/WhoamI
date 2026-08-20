"use client";

import { FreeMiniIndicator } from "@/components/results/free/FreeMiniIndicator";
import { FreeUpsellCard } from "@/components/results/free/FreeUpsellCard";
import AiAnalysisDisclaimer from "@/components/legal/AiAnalysisDisclaimer";
import type { FreeReportUiStrings } from "@/components/results/free/freeReportUiStrings";
import type { LiteSection } from "@/lib/v2/lite/types";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;
const GOLD = "#c4a482";

export type FreeReportTone = "ink" | "accent" | "highlight" | "gold";

const TONE_TEXT: Record<FreeReportTone, string> = {
  ink: "text-on-surface",
  accent: "text-primary",
  highlight: "text-accent-rose",
  gold: "",
};
const TONE_BORDER: Record<FreeReportTone, string> = {
  ink: "border-on-surface",
  accent: "border-primary",
  highlight: "border-accent-rose",
  gold: "",
};

function FreeSection({
  section,
  tag,
  tone,
  showTag = false,
}: {
  section: LiteSection;
  tag?: string;
  tone: FreeReportTone;
  showTag?: boolean;
}) {
  if (!section?.body?.trim()) return null;
  const title = section.title === "현재의 패턴" ? "요즘의 패턴" : section.title;

  return (
    <section>
      <div
        className={`flex items-baseline justify-between gap-4 border-b pb-3 ${TONE_BORDER[tone]}`}
        style={tone === "gold" ? { borderColor: GOLD } : undefined}
      >
        <h3 className="text-[16px] text-on-surface" style={serifStyle}>
          {title}
        </h3>
        {showTag && tag ? (
          <span
            className={`shrink-0 text-[10px] tracking-[0.2em] uppercase ${TONE_TEXT[tone]}`}
            style={tone === "gold" ? { color: GOLD } : undefined}
          >
            {tag}
          </span>
        ) : null}
      </div>
      <p className="mt-3 max-w-[58ch] text-[14px] leading-[1.7] text-on-surface-variant">
        {section.body}
      </p>
    </section>
  );
}

/**
 * 무료 리포트 본문(미니 인디케이터 + 섹션 + 업셀)
 */
export function FreeReportBody({
  oneLineSummary,
  axesScores,
  sections,
  locale,
  t,
  onUpsellClick,
  showIndicator = true,
  showUpsell = true,
}: {
  oneLineSummary?: string;
  axesScores: PrimaryAxesScores;
  sections: { section: LiteSection; tag: string; tone: FreeReportTone }[];
  locale: Locale;
  t: FreeReportUiStrings;
  onUpsellClick: () => void;
  showIndicator?: boolean;
  showUpsell?: boolean;
}) {
  return (
    <div>
      {oneLineSummary ? (
        <p
          className="text-[15px] leading-relaxed text-on-surface italic"
          style={serifStyle}
        >
          {oneLineSummary}
        </p>
      ) : null}

      {showIndicator ? (
        <div className="mt-6">
          <FreeMiniIndicator scores={axesScores} locale={locale} caption={t.indicatorCaption} />
        </div>
      ) : null}

      <div className="mt-8 space-y-7">
        {sections.map(({ section, tag, tone }, i) => (
          <FreeSection
            key={i}
            section={section}
            tag={tag}
            tone={tone}
            showTag={locale === "en-US"}
          />
        ))}
      </div>

      <div className="mt-10 border-t border-outline-variant/30 pt-6">
        <AiAnalysisDisclaimer />
      </div>

      {showUpsell ? (
        <div className="mt-8">
          <FreeUpsellCard t={t} onClick={onUpsellClick} />
        </div>
      ) : null}
    </div>
  );
}
