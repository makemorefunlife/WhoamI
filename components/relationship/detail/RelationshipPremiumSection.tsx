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
import {
  RELATIONSHIP_KIND_LABELS,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";

type RelationshipPremiumSectionProps = {
  busy: boolean;
  premiumKind: RelationshipKind;
  analysisType: string;
  premiumPreview: boolean;
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
  onEnsurePremiumPreview: () => Promise<boolean>;
  onRunPremium: (kind: RelationshipKind) => Promise<boolean>;
  onRegeneratePremium: () => void;
  forceVisible?: boolean;
  onReportReadyRef?: RefObject<HTMLDivElement | null>;
};

export default function RelationshipPremiumSection({
  busy,
  premiumKind,
  analysisType,
  premiumPreview,
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
  onEnsurePremiumPreview,
  onRunPremium,
  onRegeneratePremium,
  forceVisible = false,
  onReportReadyRef,
}: RelationshipPremiumSectionProps) {
  const [requesting, setRequesting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const submitting = busy || requesting;
  const hideSection = analysisType === "none" && !premiumPreview && !forceVisible;
  if (hideSection) return null;

  async function handleGenerateClick() {
    if (submitting) return;
    setRequesting(true);
    setLocalError(null);
    try {
      let ok = false;
      if (premiumPreview) {
        ok = await onEnsurePremiumPreview();
      } else {
        ok = await onRunPremium(premiumKind);
      }
      if (!ok) {
        setLocalError("생성 요청이 완료되지 않았어요. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setRequesting(false);
    }
  }

  return (
    <ReportSurfaceProvider surface="dark">
      <div
        id="relationship-report-anchor"
        ref={onReportReadyRef}
        className="mt-10 scroll-mt-24"
      >
      {submitting ? (
        <div className="mb-4 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-secondary">
            리포트를 생성중입니다
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            잠시만 기다려 주세요. 보통 1~2분 걸려요.
          </p>
        </div>
      ) : null}
      {localError ? (
        <p className="mb-3 rounded-xl border border-red-300/50 bg-red-50/80 px-3 py-2 text-center text-sm text-red-800">
          {localError}
        </p>
      ) : null}
      {premiumKind === "romantic" && displayRomanticDeep ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-2 sm:p-3">
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
            아직 연인 사주 심화 분석이 없어요.
            <br />
            <span className="text-xs">아래 버튼으로 생성할 수 있어요.</span>
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
            아직 동료 심화 분석이 없어요.
            <br />
            <span className="text-xs">아래 버튼으로 생성할 수 있어요.</span>
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
            아직 동거·결혼 심화 분석이 없어요.
            <br />
            <span className="text-xs">아래 버튼으로 생성할 수 있어요.</span>
          </p>
        </div>
      ) : premiumKind === "family" && displayFamilyDeep ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-2 sm:p-3">
          <FamilyParentReportView report={displayFamilyDeep} />
        </div>
      ) : premiumKind === "family" ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-4 sm:p-6">
          <p className="py-6 text-center text-sm text-[var(--space-text-muted)]">
            아직 가족 Child DNA 분석이 없어요.
            <br />
            <span className="text-xs">
              위에서 엄마/아빠 렌즈를 고른 뒤 생성하세요.
            </span>
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
            아직 친구 Social DNA 분석이 없어요.
            <br />
            <span className="text-xs">아래 버튼으로 생성할 수 있어요.</span>
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
          {premiumPreview ? (
            <p className="text-[11px] text-[var(--space-text-muted)]">
              출생 정보가 부족하면 심화 분석이 제한될 수 있어요.
            </p>
          ) : null}
          <GlowButton
            type="button"
            className="w-full"
            disabled={submitting}
            onClick={() => void handleGenerateClick()}
          >
            {submitting
              ? "심화 분석 생성 중…"
              : `${RELATIONSHIP_KIND_LABELS[premiumKind]} 관계 심화 분석 생성하기`}
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
              ? "심화 분석 다시 생성 중…"
              : `${RELATIONSHIP_KIND_LABELS[premiumKind]} 심화 분석 다시 만들기`}
          </button>
          <p className="text-[10px] text-[var(--space-text-muted)]">
            새 프롬프트로 다시 생성해요. 이전 결과는 아래 분석 기록에서 볼 수
            있어요.
          </p>
        </div>
      ) : null}
      </div>
    </ReportSurfaceProvider>
  );
}
