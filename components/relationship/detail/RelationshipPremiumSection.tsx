import { useState, type RefObject } from "react";
import GlowButton from "@/components/space/GlowButton";
import RelationshipPremiumCards from "@/components/relationship/RelationshipPremiumCards";
import RomanticSajuDeepReportView from "@/components/relationship/RomanticSajuDeepReportView";
import WorkColleagueReportView from "@/components/relationship/WorkColleagueReportView";
import MarriageReportView from "@/components/relationship/MarriageReportView";
import FamilyParentReportView from "@/components/relationship/FamilyParentReportView";
import FriendReportView from "@/components/relationship/FriendReportView";
import { ReportSurfaceProvider } from "@/components/relationship/reportLayout";
import type { RelationshipPerspective } from "@/components/relationship/RelationshipBasicCards";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type RelationshipPremiumSectionProps = {
  busy: boolean;
  premiumKind: RelationshipKind;
  analysisType: string;
  premiumReady: boolean;
  hasSnapshotView: boolean;
  partnerName: string;
  viewerName: string;
  nameA: string;
  nameB: string;
  viewerIsReportA?: boolean;
  displayPremium: RelationshipPerspective | null;
  displayRomanticDeep: RomanticSajuDeepReport["report"] | null;
  displayWorkDeep: WorkColleagueReportBody | null;
  displayCohabitationDeep: MarriageReportBody | null;
  displayFamilyDeep: FamilyParentReportBody | null;
  displayFriendshipDeep: FriendReportBody | null;
  onRunPremium: (kind: RelationshipKind) => Promise<boolean>;
  onRegeneratePremium: () => void;
  forceVisible?: boolean;
  onReportReadyRef?: RefObject<HTMLDivElement | null>;
};

export default function RelationshipPremiumSection({
  busy,
  premiumKind,
  analysisType,
  premiumReady,
  hasSnapshotView,
  partnerName,
  viewerName,
  nameA,
  nameB,
  viewerIsReportA = true,
  displayPremium,
  displayRomanticDeep,
  displayWorkDeep,
  displayCohabitationDeep,
  displayFamilyDeep,
  displayFriendshipDeep,
  onRunPremium,
  onRegeneratePremium,
  forceVisible = false,
  onReportReadyRef,
}: RelationshipPremiumSectionProps) {
  const { messages } = useLocale();
  const [requesting, setRequesting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const submitting = busy || requesting;
  const hideSection = analysisType === "none" && !forceVisible;
  if (hideSection) return null;

  const kindLabel = messages.report.relationshipKindNames[premiumKind];

  async function handleGenerateClick() {
    if (submitting) return;
    setRequesting(true);
    setLocalError(null);
    try {
      let ok = false;
      ok = await onRunPremium(premiumKind);
      if (!ok) {
        setLocalError(messages.report.premiumGenerateFailed);
      }
    } finally {
      setRequesting(false);
    }
  }

  return (
    <ReportSurfaceProvider
      surface={premiumKind === "romantic" ? "stitch" : "dark"}
    >
      <div
        id="relationship-report-anchor"
        ref={onReportReadyRef}
        className="mt-10 scroll-mt-24"
      >
      {submitting ? (
        <div className="mb-4 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-secondary">
            {messages.report.generatingReportTitle}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {messages.report.premiumGeneratingSubtitle}
          </p>
        </div>
      ) : null}
      {localError ? (
        <p className="mb-3 rounded-xl border border-red-300/50 bg-red-50/80 px-3 py-2 text-center text-sm text-red-800">
          {localError}
        </p>
      ) : null}
      {premiumKind === "romantic" && displayRomanticDeep ? (
        <div className="stitch-hero-panel rounded-extra-large border border-outline-variant/30 p-2 sm:p-4">
          <RomanticSajuDeepReportView
            report={displayRomanticDeep}
            nameA={nameA}
            nameB={nameB}
            myName={viewerName}
            partnerName={partnerName}
            viewerIsReportA={viewerIsReportA}
          />
        </div>
      ) : premiumKind === "romantic" ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-4 sm:p-6">
          <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
            {messages.report.premiumEmptyRomantic}
            <br />
            <span className="text-xs">{messages.report.premiumEmptyGenerateHint}</span>
          </p>
        </div>
      ) : premiumKind === "work" && displayWorkDeep ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-2 sm:p-3">
          <WorkColleagueReportView
            report={displayWorkDeep}
            myName={viewerName}
            partnerName={partnerName}
            viewerIsReportA={viewerIsReportA}
          />
        </div>
      ) : premiumKind === "work" ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-4 sm:p-6">
          <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
            {messages.report.premiumEmptyWork}
            <br />
            <span className="text-xs">{messages.report.premiumEmptyGenerateHint}</span>
          </p>
        </div>
      ) : premiumKind === "cohabitation" && displayCohabitationDeep ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-2 sm:p-3">
          <MarriageReportView
            report={displayCohabitationDeep}
            myName={viewerName}
            partnerName={partnerName}
            viewerIsReportA={viewerIsReportA}
          />
        </div>
      ) : premiumKind === "cohabitation" ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-4 sm:p-6">
          <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
            {messages.report.premiumEmptyCohabitation}
            <br />
            <span className="text-xs">{messages.report.premiumEmptyGenerateHint}</span>
          </p>
        </div>
      ) : premiumKind === "family" && displayFamilyDeep ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-2 sm:p-3">
          <FamilyParentReportView report={displayFamilyDeep} />
        </div>
      ) : premiumKind === "family" ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-4 sm:p-6">
          <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
            {messages.report.premiumEmptyFamily}
            <br />
            <span className="text-xs">{messages.report.premiumEmptyFamilyHint}</span>
          </p>
        </div>
      ) : premiumKind === "friendship" && displayFriendshipDeep ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-2 sm:p-3">
          <FriendReportView
            report={displayFriendshipDeep}
            myName={viewerName}
            partnerName={partnerName}
            viewerIsReportA={viewerIsReportA}
          />
        </div>
      ) : premiumKind === "friendship" ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-4 sm:p-6">
          <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
            {messages.report.premiumEmptyFriendship}
            <br />
            <span className="text-xs">{messages.report.premiumEmptyGenerateHint}</span>
          </p>
        </div>
      ) : (
        <RelationshipPremiumCards
          perspective={displayPremium}
          partnerName={partnerName}
          viewerName={viewerName}
        />
      )}
      {!premiumReady && !hasSnapshotView ? (
        <div className="mt-4 space-y-2 text-center">
          <GlowButton
            type="button"
            className="w-full"
            disabled={submitting}
            onClick={() => void handleGenerateClick()}
          >
            {submitting
              ? messages.report.premiumGenerating
              : messages.report.premiumGenerateCta(kindLabel)}
          </GlowButton>
        </div>
      ) : premiumReady && !hasSnapshotView ? (
        <div className="mt-4 space-y-2 text-center">
          <button
            type="button"
            disabled={submitting}
            className="w-full rounded-xl border border-[#ffd6a5]/35 bg-[#ffd6a5]/8 py-2.5 text-sm font-medium text-[#ffd6a5] transition hover:bg-[#ffd6a5]/12 disabled:opacity-50"
            onClick={onRegeneratePremium}
          >
            {submitting
              ? messages.report.premiumRegenerating
              : messages.report.premiumRegenerateCta(kindLabel)}
          </button>
          <p className="text-[10px] text-[var(--space-text-muted)]">
            {messages.report.premiumRegenerateHint}
          </p>
        </div>
      ) : null}
      </div>
    </ReportSurfaceProvider>
  );
}
