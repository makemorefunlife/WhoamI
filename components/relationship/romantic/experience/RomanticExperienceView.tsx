"use client";

/**
 * Romantic Experience composition root.
 * B0: flag-gated stub. B1: consumes view-model; lists omit-empty module slots.
 * No ScoreBoard / RelationshipReportLayout / legacy section_* access.
 */
import { useMemo } from "react";
import {
  RelationshipReportBody,
  RelationshipReportCard,
  RelationshipReportParagraph,
} from "@/components/relationship/reportLayout";
import { buildRomanticExperienceViewModel } from "@/lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import {
  ROMANTIC_MODULE_ORDER,
  summarizeRomanticModuleSlots,
  type RomanticExperienceViewModel,
} from "@/lib/relationship/romantic/experience/romanticExperienceTypes";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

export type RomanticExperienceViewProps = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA?: boolean;
  locale?: string;
};

function availableModuleCount(vm: RomanticExperienceViewModel): number {
  return summarizeRomanticModuleSlots(vm).filter((s) => s.available).length;
}

export default function RomanticExperienceView({
  report,
  nameA,
  nameB,
  myName,
  partnerName,
  viewerIsReportA = true,
  locale,
}: RomanticExperienceViewProps) {
  const vm = useMemo(
    () =>
      buildRomanticExperienceViewModel({
        report,
        nameA,
        nameB,
        myName,
        partnerName,
        viewerIsReportA,
        locale,
      }),
    [report, nameA, nameB, myName, partnerName, viewerIsReportA, locale],
  );

  const slots = summarizeRomanticModuleSlots(vm);
  const readyCount = availableModuleCount(vm);

  return (
    <div
      data-romantic-experience="v2"
      data-romantic-build={vm.meta.buildId}
      className="space-y-6 sm:space-y-8"
    >
      <RelationshipReportCard title="Romantic Experience">
        <RelationshipReportBody>
          <RelationshipReportParagraph>
            {vm.meta.myName} · {vm.meta.partnerName}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph muted>
            Experience view-model ready ({vm.meta.buildId}). Modules with
            content: {readyCount}/{ROMANTIC_MODULE_ORDER.length}. Legacy report
            remains default until V2 is enabled; set
            ROMANTIC_EXPERIENCE_LEGACY=1 to force the previous UI.
          </RelationshipReportParagraph>
          <ul className="mt-3 space-y-1 text-sm text-on-surface-variant">
            {slots.map((slot) => (
              <li key={slot.id} data-module={slot.id} data-available={slot.available}>
                {slot.id}
                {slot.available ? " · ready" : " · omitted"}
              </li>
            ))}
          </ul>
        </RelationshipReportBody>
      </RelationshipReportCard>
    </div>
  );
}
