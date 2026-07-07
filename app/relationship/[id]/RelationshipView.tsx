"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import RelationshipBasicCards from "@/components/relationship/RelationshipBasicCards";
import RelationshipAnalysisHistory, {
  FavoriteHeartButton,
} from "@/components/relationship/RelationshipAnalysisHistory";
import RelationshipKindTabs from "@/components/relationship/RelationshipKindTabs";
import RelationshipFamilyRolePanel from "@/components/relationship/detail/RelationshipFamilyRolePanel";
import RelationshipPremiumSection from "@/components/relationship/detail/RelationshipPremiumSection";
import RelationshipGeneratingPanel from "@/components/relationship/detail/RelationshipGeneratingPanel";
import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";
import { RELATIONSHIP_KIND_LABELS } from "@/lib/relationship/relationshipKind";
import { useRelationshipDetail } from "./useRelationshipDetail";

export default function RelationshipView({
  relationshipReportId,
}: {
  relationshipReportId: string;
}) {
  const searchParams = useSearchParams();
  const urlAutostart = searchParams.get("autostart") === "1";
  const reportAnchorRef = useRef<HTMLDivElement>(null);

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
    analysisType,
    premiumKind,
    premiumPreview,
    favorited,
    favoriteBusy,
    snapshotView,
    logs,
    logsLoading,
    familyParentType,
    familyChildIsViewer,
    reportIdA,
    reportIdB,
    nameA,
    nameB,
    displayBasic,
    displayPremium,
    displayRomanticDeep,
    displayWorkDeep,
    displayCohabitationDeep,
    displayFamilyDeep,
    displayFriendshipDeep,
    premiumReady,
    toggleFavorite,
    retryAnalysis,
    onPremiumKindChange,
    viewAnalysisLog,
    clearSnapshotView,
    reloadDetail,
    setFamilyParentType,
    setFamilyChildIsViewer,
    runPremium,
    regeneratePremium,
    ensurePremiumPreview,
  } = detail;

  const generating = busy || autostartActive;
  const showGeneratingPanel =
    generating || (urlAutostart && !premiumReady && !err && !loading);
  const showLoadingPanel =
    loading || (canonicalResolving && !viewerReportId);

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
            주소에 내 리포트 id가 필요해요. 예:{" "}
            <code className="text-primary">?viewer=리포트UUID</code>
          </p>
          <button
            type="button"
            className="stitch-cta-primary mt-6 w-full !min-w-0 !text-sm"
            onClick={() => router.push("/relationships")}
          >
            관계 허브로
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
            관계 분석 id를 찾을 수 없어요.
          </p>
          <button
            type="button"
            className="stitch-cta-primary mt-6 w-full !min-w-0 !text-sm"
            onClick={() => router.back()}
          >
            돌아가기
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
          {RELATIONSHIP_KIND_LABELS[premiumKind]} 관계 분석
        </h1>
        <p className="text-sm text-on-surface-variant">
          {viewerName ? (
            <>
              <span className="font-medium text-primary">{viewerName}</span>
              님이 보는 ·{" "}
              <span className="font-medium text-primary">{partnerName}</span>
              님
            </>
          ) : (
            <>{partnerName}님</>
          )}
        </p>
        <div className="flex justify-center pt-1">
          <FavoriteHeartButton
            favorited={favorited}
            busy={favoriteBusy}
            onToggle={() => void toggleFavorite()}
          />
        </div>
      </header>

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
            {generating ? "처리 중…" : "다시 시도"}
          </button>
        </div>
      ) : null}

      {showLoadingPanel ? (
        <RelationshipGeneratingPanel
          partnerName={partnerName}
          kindLabel={RELATIONSHIP_KIND_LABELS[premiumKind]}
          phase="loading"
        />
      ) : null}

      {showGeneratingPanel && !showLoadingPanel ? (
        <RelationshipGeneratingPanel
          partnerName={partnerName}
          kindLabel={RELATIONSHIP_KIND_LABELS[premiumKind]}
          phase="generating"
        />
      ) : null}

      {!showLoadingPanel ? (
        <>
          {snapshotView ? (
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-secondary/30 bg-secondary/8 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-xs text-on-surface-variant sm:text-left">
                저장된 분석 기록을 보고 있어요
              </p>
              <button
                type="button"
                className="text-xs font-medium text-secondary underline-offset-2 hover:underline"
                onClick={() => {
                  clearSnapshotView();
                  reloadDetail();
                }}
              >
                최신 결과로
              </button>
            </div>
          ) : null}

          <RelationshipKindTabs
            value={premiumKind}
            onChange={onPremiumKindChange}
            disabled={generating}
          />

          {premiumKind === "family" ? (
            <RelationshipFamilyRolePanel
              familyParentType={familyParentType}
              onFamilyParentTypeChange={setFamilyParentType}
              familyChildIsViewer={familyChildIsViewer}
              onFamilyChildIsViewerChange={setFamilyChildIsViewer}
              busy={generating}
              viewerName={viewerName}
              partnerName={partnerName}
              reportIdA={reportIdA}
              reportIdB={reportIdB}
            />
          ) : null}

          {!urlAutostart ? (
            <RelationshipBasicCards
              perspective={displayBasic}
              partnerName={partnerName}
              viewerName={viewerName}
            />
          ) : null}

          {(!displayBasic || Object.keys(displayBasic).length === 0) &&
          !err &&
          !snapshotView &&
          !urlAutostart ? (
            <div className="mt-4">
              <button
                type="button"
                className="stitch-cta-primary w-full !min-w-0 disabled:opacity-50"
                disabled={generating}
                onClick={() => retryAnalysis()}
              >
                {generating ? "만드는 중…" : "기본 분석 만들기"}
              </button>
            </div>
          ) : null}

          <RelationshipPremiumSection
            busy={generating}
            premiumKind={premiumKind}
            analysisType={analysisType}
            premiumPreview={premiumPreview}
            premiumReady={premiumReady}
            hasSnapshotView={Boolean(snapshotView)}
            partnerName={partnerName}
            viewerName={viewerName}
            nameA={nameA}
            nameB={nameB}
            displayPremium={displayPremium}
            displayRomanticDeep={displayRomanticDeep}
            displayWorkDeep={displayWorkDeep}
            displayCohabitationDeep={displayCohabitationDeep}
            displayFamilyDeep={displayFamilyDeep}
            displayFriendshipDeep={displayFriendshipDeep}
            onEnsurePremiumPreview={ensurePremiumPreview}
            onRunPremium={runPremium}
            onRegeneratePremium={regeneratePremium}
            forceVisible={urlAutostart || generating}
            onReportReadyRef={reportAnchorRef}
          />

          {premiumReady && urlAutostart ? (
            <p className="mt-4 text-center text-sm font-medium text-secondary">
              리포트가 준비됐어요. 아래에서 바로 확인하세요.
            </p>
          ) : null}

          {analysisType === "basic" && !urlAutostart ? (
            <p className="mt-8 text-center text-xs text-on-surface-variant">
              관계 종류를 고른 뒤 심화 분석을 바로 생성할 수 있어요.
            </p>
          ) : null}

          <div className={`${hubPanelClass()} mt-10 space-y-3 p-5`}>
            <h2 className="text-sm font-semibold text-secondary">분석 기록</h2>
            <RelationshipAnalysisHistory
              logs={logs}
              loading={logsLoading}
              selectedLogId={snapshotView?.logId ?? null}
              onSelectLog={viewAnalysisLog}
            />
          </div>

          <button
            type="button"
            className="stitch-cta-secondary mt-8 w-full"
            onClick={() => router.push("/relationships")}
          >
            관계 허브로
          </button>
        </>
      ) : null}
    </div>,
  );
}
