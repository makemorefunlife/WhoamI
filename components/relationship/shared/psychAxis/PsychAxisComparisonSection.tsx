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
import { Reveal } from "@/components/relationship/shared/editorial/EditorialPrimitives";
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
}: PsychAxisComparisonSectionProps) {
  if (!axisResults.length) return null;

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
        <ul className="mt-6 space-y-3">
          {highlights.map((h, i) => (
            <li key={h.axis_key}>
              <Reveal delay={i * 60}>
                <div className="rounded-xl bg-[#8a8a8a] px-4 py-3">
                  <p className="font-rel-sans text-[13px] font-semibold leading-snug text-white/92">{h.hook}</p>
                  <p className="mt-2 font-rel-sans text-[13px] leading-[1.75] text-white/78">{h.narrative}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
