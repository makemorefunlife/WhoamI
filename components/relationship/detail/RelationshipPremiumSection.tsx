import { useState, type RefObject } from "react";
import GlowButton from "@/components/space/GlowButton";
import RelationshipPremiumCards from "@/components/relationship/RelationshipPremiumCards";
import RomanticSajuDeepReportView from "@/components/relationship/RomanticSajuDeepReportView";
import RomanticExperienceView from "@/components/relationship/romantic/experience/RomanticExperienceView";
import RomanticV4ReportView from "@/components/relationship/romantic/v4/RomanticV4ReportView";
import WorkColleagueReportView from "@/components/relationship/WorkColleagueReportView";
import MarriageReportView from "@/components/relationship/MarriageReportView";
import FamilyParentReportView from "@/components/relationship/FamilyParentReportView";
import FriendReportView from "@/components/relationship/FriendReportView";
import { ReportSurfaceProvider } from "@/components/relationship/reportLayout";
import type { RelationshipPerspective } from "@/components/relationship/RelationshipBasicCards";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type { RomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/types";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import { shouldRenderRomanticExperienceV2 } from "@/lib/relationship/romantic/experience/romanticExperienceFlag";
import { resolveRomanticRenderMode } from "@/lib/relationship/romantic/prototypeV4/productionAdapter/romanticV4Persistence";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import AiAnalysisDisclaimer from "@/components/legal/AiAnalysisDisclaimer";
import ReportFeedbackSection from "@/components/feedback/ReportFeedbackSection";
import { relationshipDeepFeedbackContext } from "@/lib/feedback/feedbackContext";
import { resolveRelationshipEntryState } from "@/lib/credits/analysisEntryGate";

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
  displayRomanticDeepV4?: RomanticV4PrototypePayload | null;
  /** See app/api/relationship/detail/route.ts's romantic_v4_enabled comment. */
  romanticV4Enabled?: boolean;
  displayWorkDeep: WorkColleagueReportBody | null;
  displayCohabitationDeep: MarriageReportBody | null;
  displayFamilyDeep: FamilyParentReportBody | null;
  displayFriendshipDeep: FriendReportBody | null;
  onRunPremium: (kind: RelationshipKind) => Promise<boolean>;
  onRegeneratePremium: () => void;
  forceVisible?: boolean;
  onReportReadyRef?: RefObject<HTMLDivElement | null>;
  /** True right after a generation attempt failed specifically for lack of a relationship credit (see useRelationshipDetail's premiumCreditExhausted). */
  creditExhausted?: boolean;
  /** Opens the purchase selector (context="relationship") -- the single CTA of the "purchase" state. */
  onOpenPurchase?: () => void;
  /** Canonical Relationship credits remaining (null = unknown). */
  relationshipCreditsRemaining?: number | null;
  /** False only when CREDIT_ENFORCEMENT is off (generation never blocks at 0). */
  creditEnforced?: boolean;
  /** True once this kind's saved report (if any) has been loaded. */
  premiumKindLoaded?: boolean;
  /**
   * True while an explicit-intent autostart attempt (the user just picked
   * this Deep kind -- see ?autostart=1 in useRelationshipDetail.ts) is
   * resolving and there is no ready/cached content to show yet. Suppresses
   * this section's own empty-state placeholder and "Generate analysis" /
   * "buy credit" CTA in favor of a single "Preparing your analysis..."
   * message, so the explicit-selection flow never shows an extra manual
   * step. Left false (default) for every other surface -- direct URL
   * visits, revisits, recovery states -- which keep today's empty-state +
   * CTA fallback unchanged.
   */
  autostartPending?: boolean;
  /** Relationship report id — recorded with feedback. */
  relationshipReportId?: string;
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
  displayRomanticDeepV4 = null,
  romanticV4Enabled = false,
  displayWorkDeep,
  displayCohabitationDeep,
  displayFamilyDeep,
  displayFriendshipDeep,
  onRunPremium,
  onRegeneratePremium,
  forceVisible = false,
  onReportReadyRef,
  creditExhausted = false,
  onOpenPurchase,
  autostartPending = false,
  relationshipReportId,
  relationshipCreditsRemaining = null,
  creditEnforced = true,
  premiumKindLoaded = true,
}: RelationshipPremiumSectionProps) {
  const { messages } = useLocale();
  const [requesting, setRequesting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const submitting = busy || requesting;
  const hideSection = analysisType === "none" && !forceVisible;
  if (hideSection) return null;

  const kindLabel = messages.report.relationshipKindNames[premiumKind];
  /** Romantic-only; other kinds never read this path. Default = legacy. */
  const useRomanticExperienceV2 = shouldRenderRomanticExperienceV2(premiumKind);
  /** Phase 2 current-version lock — see resolveRomanticRenderMode's own doc comment. */
  const romanticRenderMode = resolveRomanticRenderMode({
    hasV4: Boolean(displayRomanticDeepV4),
    v4Enabled: romanticV4Enabled,
    hasLegacyPayload: Boolean(displayRomanticDeep),
  });

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

  const hasDeepContent = Boolean(
    (premiumKind === "romantic" && (displayRomanticDeepV4 || displayRomanticDeep)) ||
      (premiumKind === "work" && displayWorkDeep) ||
      (premiumKind === "cohabitation" && displayCohabitationDeep) ||
      (premiumKind === "family" && displayFamilyDeep) ||
      (premiumKind === "friendship" && displayFriendshipDeep) ||
      displayPremium,
  );

  // An explicit Deep-kind selection with nothing to show yet: replace the
  // per-kind empty-state placeholder and Generate/Buy CTA below with one
  // "Preparing your analysis..." message instead of stacking them
  // underneath RelationshipView's own RelationshipGeneratingPanel.
  const showAutostartPreparing = autostartPending && !hasDeepContent;

  // ONE state, ONE primary CTA (see resolveRelationshipEntryState):
  // saved report -> show it; no report + credit -> Generate; no report +
  // no credit (known balance, or the server already answered 402) -> Buy,
  // which opens the purchase selector directly. Never both at once.
  const entryState = resolveRelationshipEntryState({
    hasSavedReport: premiumReady || hasSnapshotView,
    kindLoaded: premiumKindLoaded,
    creditExhausted,
    remaining: relationshipCreditsRemaining,
    creditEnforced,
  });
  const emptyHint = (defaultHint: string) =>
    entryState === "purchase" ? messages.report.premiumEmptyBuyHint : defaultHint;

  return (
    <ReportSurfaceProvider
      surface={
        premiumKind === "romantic" ||
        premiumKind === "cohabitation" ||
        premiumKind === "friendship" ||
        premiumKind === "family" ||
        premiumKind === "work"
          ? "stitch"
          : "dark"
      }
    >
      <div
        id="relationship-report-anchor"
        ref={onReportReadyRef}
        className="mt-10 scroll-mt-24"
      >
      {showAutostartPreparing ? (
        <div className="mb-4 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-secondary">
            {messages.common.preparing}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {messages.report.generatingSubtitle(partnerName, kindLabel)}
          </p>
        </div>
      ) : submitting ? (
        <div className="mb-4 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-secondary">
            {messages.report.generatingReportTitle}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {messages.report.premiumGeneratingSubtitle}
          </p>
        </div>
      ) : null}
      {localError && !creditExhausted ? (
        <p className="mb-3 rounded-xl border border-red-300/50 bg-red-50/80 px-3 py-2 text-center text-sm text-red-800">
          {localError}
        </p>
      ) : null}
      {!showAutostartPreparing && (
      premiumKind === "romantic" && romanticRenderMode === "v4" && displayRomanticDeepV4 ? (
        <div className="stitch-hero-panel rounded-extra-large border border-outline-variant/30 p-2 sm:p-4">
          <RomanticV4ReportView
            payload={displayRomanticDeepV4}
            myName={viewerName}
            partnerName={partnerName}
            viewerIsReportA={viewerIsReportA}
          />
        </div>
      ) : premiumKind === "romantic" && romanticRenderMode === "legacy" && displayRomanticDeep ? (
        <div className="stitch-hero-panel rounded-extra-large border border-outline-variant/30 p-2 sm:p-4">
          {useRomanticExperienceV2 ? (
            <RomanticExperienceView
              report={displayRomanticDeep}
              nameA={nameA}
              nameB={nameB}
              myName={viewerName}
              partnerName={partnerName}
              viewerIsReportA={viewerIsReportA}
            />
          ) : (
            <RomanticSajuDeepReportView
              report={displayRomanticDeep}
              nameA={nameA}
              nameB={nameB}
              myName={viewerName}
              partnerName={partnerName}
              viewerIsReportA={viewerIsReportA}
            />
          )}
        </div>
      ) : premiumKind === "romantic" ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-4 sm:p-6">
          <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
            {entryState === "loading" ? (
              messages.common.preparing
            ) : (
              <>
                {messages.report.premiumEmptyRomantic}
                <br />
                <span className="text-xs">{emptyHint(messages.report.premiumEmptyGenerateHint)}</span>
              </>
            )}
          </p>
        </div>
      ) : premiumKind === "work" && displayWorkDeep ? (
        <div className="w-full">
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
            {entryState === "loading" ? (
              messages.common.preparing
            ) : (
              <>
                {messages.report.premiumEmptyWork}
                <br />
                <span className="text-xs">{emptyHint(messages.report.premiumEmptyGenerateHint)}</span>
              </>
            )}
          </p>
        </div>
      ) : premiumKind === "cohabitation" && displayCohabitationDeep ? (
        <div className="w-full">
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
            {entryState === "loading" ? (
              messages.common.preparing
            ) : (
              <>
                {messages.report.premiumEmptyCohabitation}
                <br />
                <span className="text-xs">{emptyHint(messages.report.premiumEmptyGenerateHint)}</span>
              </>
            )}
          </p>
        </div>
      ) : premiumKind === "family" && displayFamilyDeep ? (
        <div className="w-full">
          <FamilyParentReportView report={displayFamilyDeep} />
        </div>
      ) : premiumKind === "family" ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-4 sm:p-6">
          <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
            {entryState === "loading" ? (
              messages.common.preparing
            ) : (
              <>
                {messages.report.premiumEmptyFamily}
                <br />
                <span className="text-xs">{emptyHint(messages.report.premiumEmptyFamilyHint)}</span>
              </>
            )}
          </p>
        </div>
      ) : premiumKind === "friendship" && displayFriendshipDeep ? (
        <div className="w-full">
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
            {entryState === "loading" ? (
              messages.common.preparing
            ) : (
              <>
                {messages.report.premiumEmptyFriendship}
                <br />
                <span className="text-xs">{emptyHint(messages.report.premiumEmptyGenerateHint)}</span>
              </>
            )}
          </p>
        </div>
      ) : (
        <RelationshipPremiumCards
          perspective={displayPremium}
          partnerName={partnerName}
          viewerName={viewerName}
        />
      ))}
      {hasDeepContent && (premiumReady || hasSnapshotView) && !submitting ? (
        <>
          <AiAnalysisDisclaimer className="mt-6 px-1" />
          <ReportFeedbackSection
            displayName={viewerName}
            reportContext={relationshipDeepFeedbackContext({
              kind: premiumKind,
              relationshipReportId,
              romanticV4: romanticRenderMode === "v4",
            })}
          />
        </>
      ) : null}
      {!showAutostartPreparing && (
      entryState === "purchase" && onOpenPurchase ? (
        <div className="mt-4 space-y-2 text-center">
          <GlowButton type="button" className="w-full" onClick={onOpenPurchase}>
            {messages.report.premiumBuyCta}
          </GlowButton>
        </div>
      ) : entryState === "generate" ? (
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
      ) : null
      )}
      </div>
    </ReportSurfaceProvider>
  );
}
