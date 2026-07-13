"use client";

import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import {
  RelationshipReportCard,
  RelationshipReportParagraph,
  PsychMatchRadarChart,
} from "@/components/relationship/reportLayout";
import type { DomainPsychLens } from "@/lib/relationship/psychDomainLens/types";
import { swapPsychAxisForViewer } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";

type RelationshipPsychMatchSectionProps = {
  psychMatch: PsychMatchResult;
  psychLens: DomainPsychLens;
  personALabel: string;
  personBLabel: string;
  viewerIsReportA?: boolean;
  accentColor: string;
};

export default function RelationshipPsychMatchSection({
  psychMatch,
  psychLens,
  personALabel,
  personBLabel,
  viewerIsReportA = true,
  accentColor,
}: RelationshipPsychMatchSectionProps) {
  const psychAxisForViewer = swapPsychAxisForViewer(
    psychMatch.axis_results,
    viewerIsReportA,
  );

  if (!psychAxisForViewer.length) return null;

  return (
    <>
      <RelationshipReportCard
        title="🎯 심리 11축 매칭"
        accentColor={accentColor}
      >
        <p className="mb-3 text-xs leading-relaxed text-white/65">
          {psychLens.chart_note}
        </p>
        <div className="rounded-2xl border border-white/10 bg-[#f8f6f3] p-3 sm:p-4">
          <PsychMatchRadarChart
            axisResults={psychAxisForViewer}
            personALabel={personALabel}
            personBLabel={personBLabel}
          />
        </div>
      </RelationshipReportCard>

      {psychLens.highlights.length > 0 ? (
        <RelationshipReportCard
          title={psychLens.lens_title}
          accentColor={accentColor}
        >
          <RelationshipReportParagraph className="text-white/80">
            {psychLens.intro_line}
          </RelationshipReportParagraph>
          <ul className="mt-4 space-y-3">
            {psychLens.highlights.map((item) => (
              <li
                key={item.axis_key}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <p className="text-sm font-semibold leading-snug text-white/92">
                  {item.hook}
                </p>
                <RelationshipReportParagraph className="mt-2 text-white/78">
                  {item.narrative}
                </RelationshipReportParagraph>
                <p className="mt-2 text-[10px] text-white/45">
                  {item.topic}
                  {item.match_type === "tension"
                    ? " · 자주 부딪히기 쉬운 축"
                    : item.match_type === "similarity"
                      ? " · 비슷해서 편한 축"
                      : " · 역할 나누면 좋은 축"}
                </p>
              </li>
            ))}
          </ul>
        </RelationshipReportCard>
      ) : null}
    </>
  );
}
