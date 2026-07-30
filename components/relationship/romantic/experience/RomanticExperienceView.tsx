"use client";

/**
 * Romantic Experience V2 — production UI behind feature flag.
 * Same surface for /dev/romantic-v2-visual and RelationshipPremiumSection.
 */
import { useMemo } from "react";
import { buildRomanticExperienceViewModel } from "@/lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  RomanticHeroSection,
  RomanticEssenceSection,
  RomanticSnapshotSection,
  RomanticDifferenceMapSection,
  RomanticAxisComparisonSection,
  RomanticFlowSection,
  RomanticConflictSection,
  RomanticHiddenHeartSection,
  RomanticSpecialSection,
  RomanticRepairSection,
  RomanticDoDontSection,
  RomanticActionAdviceSection,
  RomanticHorizonSection,
  RomanticReflectionSection,
  RomanticSaveShareSection,
  hasSpecialContent,
  isHorizonSafeToShow,
} from "./RomanticExperienceModules";

/** Semantic chapter order for V2 — shared by production and dev fixture path. */
export const ROMANTIC_V2_CHAPTER_ORDER = [
  "hero",
  "essence",
  "snapshot",
  "differenceMap",
  "axisComparison",
  "flow",
  "conflict",
  "hiddenHeart",
  "special",
  "repair",
  "doDont",
  "actionAdvice",
  "horizon",
  "reflection",
  "saveShare",
] as const;

export type RomanticExperienceViewProps = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA?: boolean;
  locale?: string;
};

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

  const showHorizon = isHorizonSafeToShow(vm);

  return (
    <div
      data-romantic-experience="v2"
      data-romantic-build={vm.meta.buildId}
      data-test-romantic="VISIBLE-V2"
      data-romantic-chapter-order={ROMANTIC_V2_CHAPTER_ORDER.join(",")}
      className="flex flex-col bg-[#FAF9F6] min-h-screen pb-20"
    >
      <RomanticHeroSection vm={vm} />

      <div className="mt-10 space-y-16 sm:mt-16 sm:space-y-24">
        {vm.essence.available ? <RomanticEssenceSection vm={vm} /> : null}

        {vm.snapshot.available ? <RomanticSnapshotSection vm={vm} /> : null}

        {vm.differenceMap.available ? (
          <RomanticDifferenceMapSection vm={vm} />
        ) : null}

        {vm.axisComparison.available ? (
          <RomanticAxisComparisonSection vm={vm} />
        ) : null}

        {vm.flow.available ? <RomanticFlowSection vm={vm} /> : null}

        {vm.conflictTranslation.available ? (
          <RomanticConflictSection vm={vm} />
        ) : null}

        {vm.hiddenHeart.available ? (
          <RomanticHiddenHeartSection vm={vm} />
        ) : null}

        {hasSpecialContent(vm) ? <RomanticSpecialSection vm={vm} /> : null}

        {vm.repairGuide.available ? <RomanticRepairSection vm={vm} /> : null}

        {vm.doDont.available ? <RomanticDoDontSection vm={vm} /> : null}

        {vm.actionAdvice.available ? (
          <RomanticActionAdviceSection vm={vm} />
        ) : null}

        {showHorizon ? <RomanticHorizonSection vm={vm} /> : null}

        {vm.reflection.available ? <RomanticReflectionSection vm={vm} /> : null}

        <RomanticSaveShareSection vm={vm} />
      </div>
    </div>
  );
}
