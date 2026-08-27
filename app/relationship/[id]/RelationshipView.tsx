"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import RelationshipBasicCards from "@/components/relationship/RelationshipBasicCards";
import RelationshipAnalysisHistory from "@/components/relationship/RelationshipAnalysisHistory";
import RelationshipKindTabs from "@/components/relationship/RelationshipKindTabs";
import RelationshipPremiumSection from "@/components/relationship/detail/RelationshipPremiumSection";
import RelationshipGeneratingPanel from "@/components/relationship/detail/RelationshipGeneratingPanel";
import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";
import { ROUTES } from "@/constants/routes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useRelationshipDetail } from "./useRelationshipDetail";

export default function RelationshipView({
  relationshipReportId,
}: {
  relationshipReportId: string;
}) {
  const searchParams = useSearchParams();
  const urlAutostart = searchParams.get("autostart") === "1";
  const reportAnchorRef = useRef<HTMLDivElement>(null);
  const { messages, href: localize } = useLocale();

  const detail = useRelationshipDetail({ relationshipReportId });
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
    retryAnalysis,
    onAnalysisSurfaceChange,
    viewAnalysisLog,
    clearSnapshotView,
    reloadDetail,
    setFamilyParentType,
    setFamilyChildIsViewer,
    runPremium,
    regeneratePremium,
  } = detail;

  const viewingBasicSurface = analysisSurface === "basic";
  const generating = busy || autostartActive;
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
          {messages.report.relationshipKindNames[premiumKind]}{" "}
          {messages.report.relationshipAnalysisTitleSuffix}
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



          {viewingBasicSurface && !showGeneratingPanel ? (
            <RelationshipBasicCards
              perspective={displayBasic}
              partnerName={partnerName}
              viewerName={viewerName}
            />
          ) : null}

          {viewingBasicSurface &&
          (!displayBasic || Object.keys(displayBasic).length === 0) &&
          !err &&
          !snapshotView &&
          !showGeneratingPanel ? (
            <div className="mt-4">
              <button
                type="button"
                className="stitch-cta-primary w-full !min-w-0 disabled:opacity-50"
                disabled={generating}
                onClick={() => retryAnalysis()}
              >
                {generating ? messages.common.creating : messages.report.createBasicAnalysis}
              </button>
            </div>
          ) : null}

          {!viewingBasicSurface ? (
            <RelationshipPremiumSection
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
            />
          ) : null}

          {!viewingBasicSurface && premiumReady && !showGeneratingPanel ? (
            <p className="mt-4 text-center text-sm font-medium text-secondary">
              {messages.report.reportReadyNotice}
            </p>
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

          <button
            type="button"
            className="stitch-cta-secondary mt-8 w-full"
            onClick={() => router.push(localize(ROUTES.relationships))}
          >
            {messages.report.goToRelationHub}
          </button>
        </>
      ) : null}
    </div>,
  );
}
