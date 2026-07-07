"use client";

import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import RelationshipBasicCards from "@/components/relationship/RelationshipBasicCards";
import RelationshipAnalysisHistory, {
  FavoriteHeartButton,
} from "@/components/relationship/RelationshipAnalysisHistory";
import RelationshipKindTabs from "@/components/relationship/RelationshipKindTabs";
import RelationshipFamilyRolePanel from "@/components/relationship/detail/RelationshipFamilyRolePanel";
import RelationshipPremiumSection from "@/components/relationship/detail/RelationshipPremiumSection";
import { RELATIONSHIP_KIND_LABELS } from "@/lib/relationship/relationshipKind";
import { useRelationshipDetail } from "./useRelationshipDetail";

export default function RelationshipView({
  relationshipReportId,
}: {
  relationshipReportId: string;
}) {
  const detail = useRelationshipDetail({ relationshipReportId });
  const {
    router,
    viewerReportId,
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

  if (!viewerReportId) {
    return (
      <SpaceBackground>
        <div className="relative z-10 mx-auto max-w-lg px-4 py-16">
          <GlassCard>
            <p className="text-center text-sm text-[var(--space-text-muted)]">
              주소에 내 리포트 id가 필요해요. 예:{" "}
              <code className="text-[var(--space-text)]">?viewer=리포트UUID</code>
            </p>
            <GlowButton
              type="button"
              className="mt-6 w-full"
              onClick={() => router.push("/")}
            >
              홈으로
            </GlowButton>
          </GlassCard>
        </div>
      </SpaceBackground>
    );
  }

  if (!resolvedRelationshipId) {
    return (
      <SpaceBackground>
        <div className="relative z-10 mx-auto max-w-lg px-4 py-16">
          <GlassCard>
            <p className="text-center text-sm text-[var(--space-text-muted)]">
              관계 분석 id를 찾을 수 없어요.
            </p>
            <GlowButton
              type="button"
              className="mt-6 w-full"
              onClick={() => router.back()}
            >
              돌아가기
            </GlowButton>
          </GlassCard>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground>
      <div className="relative z-10 mx-auto max-w-lg px-4 py-10 pb-24 sm:max-w-xl">
        <header className="mb-8 space-y-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--space-text-muted)]">
            Relationship
          </p>
          <h1 className="text-2xl font-semibold text-[var(--space-text)]">
            {RELATIONSHIP_KIND_LABELS[premiumKind]} 관계 분석
          </h1>
          <p className="text-sm text-[var(--space-text-muted)]">
            {viewerName ? (
              <>
                <span className="text-[var(--space-text)]">{viewerName}</span>
                님이 보는 ·{" "}
                <span className="text-[var(--space-text)]">{partnerName}</span>
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

        {err && (
          <div className="mb-4 space-y-3">
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200">
              {err}
            </p>
            <GlowButton
              type="button"
              className="w-full border border-[var(--space-border)] bg-white/[0.04] !shadow-none"
              disabled={busy}
              onClick={() => retryAnalysis()}
            >
              {busy ? "처리 중…" : "다시 시도"}
            </GlowButton>
          </div>
        )}

        {loading ? (
          <p className="text-center text-sm text-[var(--space-text-muted)]">
            불러오는 중…
          </p>
        ) : (
          <>
            {snapshotView ? (
              <div className="mb-4 flex flex-col gap-2 rounded-xl border border-[#67B7FF]/35 bg-[#67B7FF]/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-xs text-[#9ec8ff] sm:text-left">
                  저장된 분석 기록을 보고 있어요
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-[#67B7FF] underline-offset-2 hover:underline"
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
              disabled={busy}
            />

            {premiumKind === "family" ? (
              <RelationshipFamilyRolePanel
                familyParentType={familyParentType}
                onFamilyParentTypeChange={setFamilyParentType}
                familyChildIsViewer={familyChildIsViewer}
                onFamilyChildIsViewerChange={setFamilyChildIsViewer}
                busy={busy}
                viewerName={viewerName}
                partnerName={partnerName}
                reportIdA={reportIdA}
                reportIdB={reportIdB}
              />
            ) : null}

            <RelationshipBasicCards
              perspective={displayBasic}
              partnerName={partnerName}
              viewerName={viewerName}
            />

            {(!displayBasic || Object.keys(displayBasic).length === 0) &&
            !err &&
            !snapshotView ? (
              <div className="mt-4">
                <GlowButton
                  type="button"
                  className="w-full"
                  disabled={busy}
                  onClick={() => retryAnalysis()}
                >
                  {busy ? "만드는 중…" : "기본 분석 만들기"}
                </GlowButton>
              </div>
            ) : null}

            <RelationshipPremiumSection
              busy={busy}
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
              onEnsurePremiumPreview={() => void ensurePremiumPreview()}
              onRunPremium={(kind) => void runPremium(kind)}
              onRegeneratePremium={regeneratePremium}
            />

            {analysisType === "basic" && !premiumPreview && (
              <p className="mt-8 text-center text-xs text-[var(--space-text-muted)]">
                심화 관계 분석은 업그레이드 후에 열려요.
              </p>
            )}

            <GlassCard className="mt-10 space-y-3">
              <h2 className="text-sm font-semibold text-[#67B7FF]">
                분석 기록
              </h2>
              <RelationshipAnalysisHistory
                logs={logs}
                loading={logsLoading}
                selectedLogId={snapshotView?.logId ?? null}
                onSelectLog={viewAnalysisLog}
              />
            </GlassCard>

            <GlowButton
              type="button"
              className="mt-8 w-full border border-[var(--space-border)] bg-white/[0.04] !shadow-none"
              onClick={() => router.back()}
            >
              돌아가기
            </GlowButton>
          </>
        )}
      </div>
    </SpaceBackground>
  );
}
