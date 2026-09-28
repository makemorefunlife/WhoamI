"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import RelationshipBasicCards from "@/components/relationship/RelationshipBasicCards";
import FreeRelationshipPreviewCard from "@/components/relationship/map/FreeRelationshipPreviewCard";
import RelationshipAnalysisHistory from "@/components/relationship/RelationshipAnalysisHistory";
import RelationshipKindTabs from "@/components/relationship/RelationshipKindTabs";
import RelationshipPremiumSection from "@/components/relationship/detail/RelationshipPremiumSection";
import PurchaseSelectorModal from "@/components/payment/PurchaseSelectorModal";
import RegenerateConfirmDialog from "@/components/relationship/detail/RegenerateConfirmDialog";
import RelationshipGeneratingPanel from "@/components/relationship/detail/RelationshipGeneratingPanel";
import ReportShareSection from "@/components/relationship/detail/ReportShareSection";
import ReportContinuationCtas from "@/components/relationship/detail/ReportContinuationCtas";
import ReportFeedbackSection from "@/components/feedback/ReportFeedbackSection";
import { relationshipBasicFeedbackContext } from "@/lib/feedback/feedbackContext";
import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";
import { ROUTES, relationshipDetailRoute } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useDockOverlayLock } from "@/lib/hooks/useDockOverlayLock";
import { useRelationshipDetail } from "./useRelationshipDetail";
import { PwaReportActionCard } from "@/components/account/InstallAppButton";

export default function RelationshipView({
  relationshipReportId,
}: {
  relationshipReportId: string;
}) {
  const searchParams = useSearchParams();
  const urlAutostart = searchParams.get("autostart") === "1";
  const viaShare = searchParams.get("via") === "share";
  const reportAnchorRef = useRef<HTMLDivElement>(null);
  const { messages, href: localize } = useLocale();

  // Declared before the detail hook so its 402 callback can open the
  // purchase selector on the same click that tried to generate.
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const openPurchaseOnCreditExhausted = useCallback(() => setPurchaseOpen(true), []);
  const detail = useRelationshipDetail({
    relationshipReportId,
    onCreditExhausted: openPurchaseOnCreditExhausted,
  });
  const {
    router,
    viewerReportId,
    canonicalResolving,
    autostartActive,
    resolvedRelationshipId,
    loading,
    busy,
    err,
    partnerName,
    viewerName,
    viewerBirthTimeUnknown,
    partnerBirthTimeUnknown,
    viewerBirthPlaceUnknown,
    partnerBirthPlaceUnknown,
    analysisType,
    analysisSurface,
    premiumKind,
    snapshotView,
    logs,
    logsLoading,
    familyParentType,
    familyChildIsViewer,
    reportIdA,
    reportIdB,
    nameA,
    nameB,
    viewerIsReportA,
    displayBasic,
    displayPremium,
    displayRomanticDeep,
    displayRomanticDeepV4,
    romanticV4Enabled,
    displayWorkDeep,
    displayCohabitationDeep,
    displayFamilyDeep,
    displayFriendshipDeep,
    premiumReady,
    premiumInProgress,
    premiumCreditExhausted,
    autostartCreditExhausted,
    relationshipCreditsRemaining,
    creditEnforced,
    premiumKindLoaded,
    refreshRelationshipCredits,
    retryAnalysis,
    onAnalysisSurfaceChange,
    viewAnalysisLog,
    clearSnapshotView,
    reloadDetail,
    setFamilyParentType,
    setFamilyChildIsViewer,
    runPremium,
    regeneratePremium,
    showRegenerateConfirm,
    cancelRegeneratePremium,
    confirmRegeneratePremium,
  } = detail;

  useDockOverlayLock(showRegenerateConfirm);

  // Mirrors the Personal pattern (StitchPremiumCard.tsx / essence/deep/page.tsx):
  // a local href pointing at this exact report is passed as
  // successRedirectPath below so that if Paddle's own successUrl redirect
  // wins the race against onSuccess, the user still lands back on this
  // same relationship report + kind tab instead of a generic fallback.
  // autostart: true is the extra piece Personal doesn't need (its own
  // canGenerate effect auto-fetches once entitled) -- Relationship has no
  // equivalent, so without this flag a redirect-race landing would show
  // the right report/kind but require a second manual click to actually
  // resume generation. This reuses the existing ?autostart=1 -> 
  // runAutostartPremium() -> runPremium(premiumKind) wiring already used
  // by the survey-to-report handoff (see useRelationshipDetail.ts).
  const href = localize(
    relationshipDetailRoute({
      relationshipReportId,
      viewerReportId,
      kind: premiumKind,
      autostart: true,
    }),
  );

  function handlePurchaseSuccess() {
    setPurchaseOpen(false);
    // Entitlement is granted server-side by the checkout complete route
    // before this fires -- re-running the same generation call the
    // credit-exhausted CTA replaced now succeeds against the fresh credit,
    // so the report appears immediately with no second click.
    void refreshRelationshipCredits();
    void runPremium(premiumKind);
  }

  const viewingBasicSurface = analysisSurface === "basic";
  const generating = busy || autostartActive || premiumInProgress;
  const usedBirthFallback =
    viewerBirthTimeUnknown || partnerBirthTimeUnknown;
  /** 실제로 생성 요청 중일 때만 — autostart 쿼리만으로 영원히 잠기지 않음 */
  const showGeneratingPanel = generating;
  const showLoadingPanel = loading && !err;
  const viewingPremiumSnapshot = Boolean(
    snapshotView &&
      (snapshotView.romanticDeep ||
        snapshotView.workDeep ||
        snapshotView.cohabitationDeep ||
        snapshotView.familyDeep ||
        snapshotView.friendshipDeep ||
        snapshotView.premium),
  );
  // True from the very first render through the whole autostart attempt
  // (URL-derived, so it covers the brief pre-effect window too, not just
  // the busy/autostartActive window) -- lets RelationshipPremiumSection
  // show one "Preparing your analysis..." state instead of its own
  // empty-state placeholder + "Generate analysis" button while an
  // explicit Deep-kind selection is resolving. Clears itself once the
  // attempt concludes and ?autostart=1 is stripped from the URL (see
  // clearAutostartParam in useRelationshipDetail.ts), at which point the
  // normal recovery UI (error+retry, or credit-exhausted+Buy) takes over
  // for revisits/fallback cases -- exactly as before this change.
  const autostartPending = urlAutostart && !premiumReady && !viewingPremiumSnapshot;

  useEffect(() => {
    if (!premiumReady || !urlAutostart) return;
    const t = window.setTimeout(() => {
      reportAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
    return () => window.clearTimeout(t);
  }, [premiumReady, urlAutostart]);

  useEffect(() => {
    if (autostartCreditExhausted) {
      setPurchaseOpen(true);
    }
  }, [autostartCreditExhausted]);

  const shell = (children: ReactNode) => (
    <StitchSurveyShell className="stitch-survey stitch-results">
      {children}
    </StitchSurveyShell>
  );

  if (!viewerReportId && !canonicalResolving) {
    return shell(
      <div className="mx-auto max-w-lg px-5 py-16 sm:px-6">
        <div className={`${hubPanelClass()} p-6 text-center`}>
          <p className="text-sm text-on-surface-variant">
            {messages.report.viewerReportIdRequired}{" "}
            <code className="text-primary">
              {messages.report.viewerQueryPlaceholder}
            </code>
          </p>
          <button
            type="button"
            className="stitch-cta-primary mt-6 w-full !min-w-0 !text-sm"
            onClick={() => router.push(localize(ROUTES.relationships))}
          >
            {messages.report.goToRelationHub}
          </button>
        </div>
      </div>,
    );
  }

  if (!resolvedRelationshipId) {
    return shell(
      <div className="mx-auto max-w-lg px-5 py-16 sm:px-6">
        <div className={`${hubPanelClass()} p-6 text-center`}>
          <p className="text-sm text-on-surface-variant">
            {messages.report.relationshipIdNotFound}
          </p>
          <button
            type="button"
            className="stitch-cta-primary mt-6 w-full !min-w-0 !text-sm"
            onClick={() => router.back()}
          >
            {messages.cta.back}
          </button>
        </div>
      </div>,
    );
  }

  return shell(
    <div className="mx-auto w-full max-w-lg px-5 py-6 pb-24 sm:max-w-xl sm:px-6 sm:py-8">
      <header className="mb-8 space-y-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
          Relationship
        </p>
        <h1 className="stitch-headline text-2xl text-primary sm:text-3xl">
          {viewingBasicSurface
            ? messages.hub.kindPickerBasicFree
            : `${messages.report.relationshipKindNames[premiumKind]} ${messages.report.relationshipAnalysisTitleSuffix}`}
        </h1>
        <p className="text-sm text-on-surface-variant">
          {viewerName ? (
            <>
              <span className="font-medium text-primary">{viewerName}</span>
              {messages.report.viewerPartnerSeparator}
              <span className="font-medium text-primary">{partnerName}</span>
              {messages.report.partnerNameSuffix}
            </>
          ) : (
            <>
              {partnerName}
              {messages.report.partnerNameSuffix}
            </>
          )}
        </p>
      </header>

      {usedBirthFallback ? (
        <p className="mb-4 rounded-xl border border-secondary/25 bg-secondary/10 px-3 py-2.5 text-xs leading-relaxed text-on-surface-variant">
          💡 {messages.report.unknownBirthNotice}
        </p>
      ) : null}

      {err ? (
        <div className="mb-4 space-y-3">
          <p className="rounded-xl border border-red-300/50 bg-red-50/80 px-3 py-2 text-center text-sm text-red-800">
            {err}
          </p>
          <button
            type="button"
            className="stitch-cta-secondary w-full disabled:opacity-50"
            disabled={generating}
            onClick={() => retryAnalysis()}
          >
            {generating ? messages.report.processing : messages.report.chrome.retry}
          </button>
        </div>
      ) : null}

      {showLoadingPanel ? (
        <RelationshipGeneratingPanel
          partnerName={partnerName}
          kindLabel={messages.report.relationshipKindNames[premiumKind]}
          phase="loading"
        />
      ) : null}

      {showGeneratingPanel && !showLoadingPanel ? (
        <RelationshipGeneratingPanel
          partnerName={partnerName}
          kindLabel={messages.report.relationshipKindNames[premiumKind]}
          phase="generating"
          inProgress={premiumInProgress}
        />
      ) : null}

      {!showLoadingPanel ? (
        <>
          {snapshotView ? (
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-secondary/30 bg-secondary/8 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-xs text-on-surface-variant sm:text-left">
                {messages.report.viewingSavedSnapshot}
              </p>
              <button
                type="button"
                className="text-xs font-medium text-secondary underline-offset-2 hover:underline"
                onClick={() => {
                  clearSnapshotView();
                  reloadDetail();
                }}
              >
                {messages.report.viewLatestResult}
              </button>
            </div>
          ) : null}

          <RelationshipKindTabs
            value={analysisSurface}
            onChange={onAnalysisSurfaceChange}
            disabled={generating}
          />



          {viewingBasicSurface &&
          displayBasic &&
          Object.keys(displayBasic).length > 0 &&
          !showGeneratingPanel &&
          !showLoadingPanel &&
          !err ? (
            <>
              <RelationshipBasicCards
                perspective={displayBasic}
                partnerName={partnerName}
                viewerName={viewerName}
              />
              <ReportFeedbackSection
                displayName={viewerName}
                reportContext={relationshipBasicFeedbackContext({
                  relationshipReportId: resolvedRelationshipId,
                })}
              />
            </>
          ) : null}

          {viewingBasicSurface &&
          (!displayBasic || Object.keys(displayBasic).length === 0) &&
          !err &&
          !snapshotView &&
          !showGeneratingPanel ? (
            <div className="mt-4 space-y-4">
              {/*
                Birth-data-only free result (separate surface from
                RelationshipBasicCards, which is untouched and reserved for
                the survey-calibrated 4-axis view). Replaces the old
                survey-required dead end: a viewer with no completed survey
                yet still gets a real, deterministic result here instead of
                a blocked retry button.
              */}
              {resolvedRelationshipId && viewerReportId ? (
                <FreeRelationshipPreviewCard
                  relationshipReportId={resolvedRelationshipId}
                  viewerReportId={viewerReportId}
                />
              ) : null}
            </div>
          ) : null}

          {viewingBasicSurface && !showGeneratingPanel && !showLoadingPanel && !err ? (
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="stitch-cta-primary w-full disabled:opacity-50"
                disabled={generating}
                onClick={() => {
                  onAnalysisSurfaceChange(premiumKind);
                  void runPremium(premiumKind);
                }}
              >
                {generating ? messages.report.processing : messages.report.unlockDeepInsight}
              </button>
              <button
                type="button"
                className="stitch-cta-secondary w-full disabled:opacity-50"
                disabled={generating}
                onClick={() => router.push(localize(ROUTES.relationships))}
              >
                {messages.report.analyzeWithAnotherFriend}
              </button>
            </div>
          ) : null}

          {!viewingBasicSurface ? (
            <RelationshipPremiumSection
              relationshipReportId={resolvedRelationshipId}
              busy={generating}
              premiumKind={premiumKind}
              analysisType={analysisType}
              premiumReady={premiumReady}
              hasSnapshotView={viewingPremiumSnapshot}
              partnerName={partnerName}
              viewerName={viewerName}
              nameA={nameA}
              nameB={nameB}
              viewerIsReportA={viewerIsReportA}
              displayPremium={displayPremium}
              displayRomanticDeep={displayRomanticDeep}
              displayRomanticDeepV4={displayRomanticDeepV4}
              romanticV4Enabled={romanticV4Enabled}
              displayWorkDeep={displayWorkDeep}
              displayCohabitationDeep={displayCohabitationDeep}
              displayFamilyDeep={displayFamilyDeep}
              displayFriendshipDeep={displayFriendshipDeep}
              onRunPremium={runPremium}
              onRegeneratePremium={regeneratePremium}
              forceVisible={urlAutostart || generating}
              onReportReadyRef={reportAnchorRef}
              creditExhausted={premiumCreditExhausted}
              onOpenPurchase={() => setPurchaseOpen(true)}
              relationshipCreditsRemaining={relationshipCreditsRemaining}
              creditEnforced={creditEnforced}
              premiumKindLoaded={premiumKindLoaded}
              autostartPending={autostartPending}
            />
          ) : null}

          <RegenerateConfirmDialog
            open={showRegenerateConfirm}
            onViewSaved={cancelRegeneratePremium}
            onCreateNew={confirmRegeneratePremium}
          />

          <PurchaseSelectorModal
            open={purchaseOpen}
            context="relationship"
            onClose={() => setPurchaseOpen(false)}
            onSuccess={handlePurchaseSuccess}
            successRedirectPath={href}
          />

          {!viewingBasicSurface && premiumReady && !showGeneratingPanel ? (
            <>
              <p className="mt-4 text-center text-sm font-medium text-secondary">
                {messages.report.reportReadyNotice}
              </p>
              {resolvedRelationshipId && viewerReportId && !viaShare ? (
                <ReportShareSection
                  relationshipReportId={resolvedRelationshipId}
                  viewerReportId={viewerReportId}
                  kind={premiumKind}
                  recipientName={partnerName}
                />
              ) : null}
              {resolvedRelationshipId && viewerReportId ? (
                <ReportContinuationCtas
                  relationshipReportId={resolvedRelationshipId}
                  viewerReportId={viewerReportId}
                  currentKind={premiumKind}
                  variant={viaShare ? "recipient" : "owner"}
                />
              ) : null}
            </>
          ) : null}

          {viewingBasicSurface && analysisType === "basic" && !urlAutostart ? (
            <p className="mt-8 text-center text-xs text-on-surface-variant">
              {messages.report.chooseKindHint}
            </p>
          ) : null}

          <div className={`${hubPanelClass()} mt-10 space-y-3 p-5`}>
            <h2 className="text-sm font-semibold text-secondary">
              {messages.report.analysisHistoryTitle}
            </h2>
            <RelationshipAnalysisHistory
              logs={logs}
              loading={logsLoading}
              selectedLogId={snapshotView?.logId ?? null}
              onSelectLog={viewAnalysisLog}
              variant="stitch"
            />
          </div>

          <PwaReportActionCard />

          <button
            type="button"
            className="stitch-cta-secondary mt-8 w-full"
            onClick={() => router.push(localize(ROUTES.relationships))}
          >
            {messages.report.analyzeWithAnotherFriend}
          </button>
        </>
      ) : null}
    </div>,
  );
}
