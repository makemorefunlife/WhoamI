"use client";

import { FreeMiniIndicator } from "@/components/results/free/FreeMiniIndicator";
import { FreeUpsellCard } from "@/components/results/free/FreeUpsellCard";
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
}: {
  section: LiteSection;
  tag: string;
  tone: FreeReportTone;
}) {
  if (!section?.body?.trim()) return null;
  return (
    <section>
      <div
        className={`flex items-baseline justify-between gap-4 border-b pb-3 ${TONE_BORDER[tone]}`}
        style={tone === "gold" ? { borderColor: GOLD } : undefined}
      >
        <h3 className="text-[16px] text-on-surface" style={serifStyle}>
          {section.title}
        </h3>
        <span
          className={`shrink-0 text-[10px] tracking-[0.2em] uppercase ${TONE_TEXT[tone]}`}
          style={tone === "gold" ? { color: GOLD } : undefined}
        >
          {tag}
        </span>
      </div>
      <p className="mt-3 max-w-[58ch] text-[14px] leading-[1.7] text-on-surface-variant">
        {section.body}
      </p>
    </section>
  );
}

/**
 * 무료 리포트 본문(미니 인디케이터 + 태그 섹션 + 업셀) — 헤더/패널 래퍼는
 * 없다. 페이지 전체 버전(StitchFreeReportView)과 대시보드 인라인 패널
 * (StitchLiteResultPanel) 둘 다 이 컴포넌트로 몸통을 공유한다.
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
          <FreeSection key={`${section?.title ?? "section"}-${i}`} section={section} tag={tag} tone={tone} />
        ))}
      </div>

      {showUpsell ? <FreeUpsellCard t={t.upsell} onClick={onUpsellClick} /> : null}
    </div>
  );
}
