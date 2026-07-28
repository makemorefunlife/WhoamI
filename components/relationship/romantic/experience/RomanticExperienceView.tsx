"use client";

/**
 * Romantic Experience V2 — production UI behind feature flag.
 * Renders M1..M10 + Horizon + Reflection/SaveShare from VM only.
 * No ScoreBoard / legacy section_* access.
 */
import { Fragment, useMemo, type ReactNode } from "react";
import { buildRomanticExperienceViewModel } from "@/lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  RomanticActionAdviceSection,
  RomanticAxisComparisonSection,
  RomanticConflictSection,
  RomanticDifferenceMapSection,
  RomanticDoDontSection,
  RomanticEssenceSection,
  RomanticFlowSection,
  RomanticHeroSection,
  RomanticHiddenHeartSection,
  RomanticHorizonSection,
  RomanticPremiumOverviewSection,
  RomanticReflectionSection,
  RomanticRepairSection,
  RomanticSaveShareSection,
  RomanticSpecialSection,
  hasSpecialContent,
} from "./RomanticExperienceModules";

/**
 * Sprint 1/2: deterministic, content-agnostic chapter-transition bridges
 * between visible sections. Snapshot/NextStep stay in the ViewModel and
 * projector layer unchanged (see romanticExperienceTypes.ts) — only their
 * cards are retired; Flow/Do-Don't remain the sole owners of that data.
 * Sprint 2: upgraded from a plain text line to a large-spaced chapter break
 * with a subtle serif numeral.
 */
const FLOW_BRIDGES = [
  "여기서 조금 더 들어가 볼게요.",
  "이 지점에서 다른 결이 보여요.",
  "그리고 이런 장면도 있어요.",
  "이제 조금 더 가까이에서 볼게요.",
];

function ModuleBridge({ index }: { index: number }) {
  return (
    <div role="separator" className="flex flex-col items-center gap-3 py-3 sm:py-6">
      <div className="flex items-center justify-center gap-4">
        <span aria-hidden className="h-px w-10 bg-outline-variant/25 sm:w-16" />
        <span className="font-serif text-sm text-outline-variant/70 sm:text-base">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span aria-hidden className="h-px w-10 bg-outline-variant/25 sm:w-16" />
      </div>
      <p className="px-4 text-center text-xs font-medium tracking-wide text-on-surface-variant/60">
        {FLOW_BRIDGES[index % FLOW_BRIDGES.length]}
      </p>
    </div>
  );
}

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

  /**
   * Sprint 4 — module order preserved exactly; each slot's `visible` mirrors
   * the same condition its own component already gates on internally, so a
   * bridge is only ever placed between two sections that actually render.
   */
  const premiumOverviewVisible =
    vm.premiumOverview.available && Boolean(vm.premiumOverview.eventScores);

  const slots: Array<{ key: string; visible: boolean; render: () => ReactNode }> = [
    { key: "hero", visible: vm.opening.available, render: () => <RomanticHeroSection vm={vm} /> },
    {
      key: "premiumOverview",
      visible: premiumOverviewVisible,
      render: () => <RomanticPremiumOverviewSection vm={vm} />,
    },
    {
      key: "axisComparison",
      visible: vm.axisComparison.available,
      render: () => <RomanticAxisComparisonSection vm={vm} />,
    },
    { key: "essence", visible: vm.essence.available, render: () => <RomanticEssenceSection vm={vm} /> },
    { key: "differenceMap", visible: vm.differenceMap.available, render: () => <RomanticDifferenceMapSection vm={vm} /> },
    { key: "flow", visible: vm.flow.available, render: () => <RomanticFlowSection vm={vm} /> },
    { key: "special", visible: hasSpecialContent(vm), render: () => <RomanticSpecialSection vm={vm} /> },
    {
      key: "hiddenHeart",
      visible: vm.hiddenHeart.available,
      render: () => <RomanticHiddenHeartSection vm={vm} />,
    },
    { key: "conflict", visible: vm.conflictTranslation.available, render: () => <RomanticConflictSection vm={vm} /> },
    { key: "repair", visible: vm.repairGuide.available, render: () => <RomanticRepairSection vm={vm} /> },
    { key: "doDont", visible: vm.doDont.available && Boolean(vm.doDont.pack), render: () => <RomanticDoDontSection vm={vm} /> },
    { key: "actionAdvice", visible: vm.actionAdvice.available, render: () => <RomanticActionAdviceSection vm={vm} /> },
    { key: "horizon", visible: vm.horizon.available, render: () => <RomanticHorizonSection vm={vm} /> },
    {
      key: "reflection",
      visible: vm.reflection.available && Boolean(vm.reflection.realization),
      render: () => <RomanticReflectionSection vm={vm} />,
    },
    { key: "saveShare", visible: vm.saveShare.available && Boolean(vm.saveShare.signatureLine), render: () => <RomanticSaveShareSection vm={vm} /> },
  ];
  const visibleSlots = slots.filter((slot) => slot.visible);

  return (
    <div
      data-romantic-experience="v2"
      data-romantic-build={vm.meta.buildId}
      data-test-romantic="VISIBLE-V2"
      className="space-y-8 sm:space-y-10"
    >
      {visibleSlots.map((slot, idx) => (
        <Fragment key={slot.key}>
          {slot.render()}
          {idx < visibleSlots.length - 1 ? <ModuleBridge index={idx} /> : null}
        </Fragment>
      ))}
    </div>
  );
}
