"use client";

/**
 * Shared 11-axis comparison block — golden reference: Family's PsychRadarCard
 * (components/relationship/familyParent/sections/SectionRenderer.tsx),
 * reproduced format-for-format: a muted chart-note line, the radar chart in
 * a bordered light box (the shared `PsychMatchRadarChart`, unchanged), then
 * the highlighted axes as solid dark cards below it (hook + narrative).
 *
 * The highlight hooks are name-explicit (via
 * lib/relationship/psychDomainLens/shared.ts's `nameExplicitHighlights`)
 * instead of Family's original abstract "one of you / the other" copy —
 * that's the one deliberate content change; the visual format is unchanged.
 *
 * Renders only the chart + highlights (not its own Section shell), so a
 * caller can embed it inside an existing chapter alongside other content.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { PsychMatchAxisResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychHighlight } from "@/lib/relationship/psychDomainLens/types";
import { Reveal, SubHeading } from "@/components/relationship/shared/editorial/EditorialPrimitives";
import PsychMatchRadarChart from "@/components/relationship/reportLayout/PsychMatchRadarChart";

export type PsychAxisComparisonSectionProps = {
  axisResults: PsychMatchAxisResult[];
  highlights: DomainPsychHighlight[];
  chartNote: string;
  names: [string, string];
  locale: Locale;
};

export function PsychAxisComparisonSection({
  axisResults,
  highlights,
  chartNote,
  names,
  locale,
}: PsychAxisComparisonSectionProps) {
  if (!axisResults.length) return null;
  const isEn = locale === "en-US";

  return (
    <>
      {chartNote ? (
        <p className="mb-3 font-rel-sans text-[13px] leading-[1.7] text-rel-ink-mute">{chartNote}</p>
      ) : null}
      <Reveal>
        <div className="rounded-2xl border border-rel-line bg-rel-surface p-3 sm:p-4">
          <PsychMatchRadarChart axisResults={axisResults} personALabel={names[0]} personBLabel={names[1]} />
        </div>
      </Reveal>

      {highlights.length > 0 ? (
        <div className="mt-10 space-y-5">
          <SubHeading title={isEn ? "Key 11-Axis Psych Insights" : "11축 심리 차이 핵심 인사이트"} tag="Psych Dynamics" tone="coral" />
          <ul className="space-y-4">
            {highlights.map((h, i) => {
              const isMatch = h.match_type === "resonance";
              const tagLabel = isEn
                ? (isMatch ? "✨ Resonance" : h.match_type === "complement" ? "🌿 Complement" : "⚡ Tension")
                : (isMatch ? "✨ 공감 유대 (Resonance)" : h.match_type === "complement" ? "🌿 상보 보완 (Complement)" : "⚡ 성향 차이 (Tension)");
              return (
                <li key={h.axis_key}>
                  <Reveal delay={i * 60}>
                    <div className="rounded-2xl border border-rel-line bg-rel-surface p-5 sm:p-6 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-rel-serif text-[17px] font-semibold text-rel-ink">🎯 {h.axis_label}</span>
                      </div>
                      <p className="font-rel-sans text-[13.5px] font-medium leading-relaxed text-rel-deep bg-rel-taupe-soft/60 p-3 rounded-xl border border-rel-line">
                        {h.hook}
                      </p>
                      <p className="font-rel-sans text-[13.5px] leading-[1.8] text-rel-ink-soft">
                        {h.narrative}
                      </p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}
