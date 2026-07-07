import type { RefObject } from "react";
import GlowButton from "@/components/space/GlowButton";
import RelationshipPremiumCards from "@/components/relationship/RelationshipPremiumCards";
import RomanticSajuDeepReportView from "@/components/relationship/RomanticSajuDeepReportView";
import WorkColleagueReportView from "@/components/relationship/WorkColleagueReportView";
import MarriageReportView from "@/components/relationship/MarriageReportView";
import FamilyParentReportView from "@/components/relationship/FamilyParentReportView";
import FriendReportView from "@/components/relationship/FriendReportView";
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
  displayPremium: RelationshipPerspective | null;
  displayRomanticDeep: RomanticSajuDeepReport["report"] | null;
  displayWorkDeep: WorkColleagueReportBody | null;
  displayCohabitationDeep: MarriageReportBody | null;
  displayFamilyDeep: FamilyParentReportBody | null;
  displayFriendshipDeep: FriendReportBody | null;
  onEnsurePremiumPreview: () => void;
  onRunPremium: (kind: RelationshipKind) => void;
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
  if (analysisType !== "premium" && !premiumPreview && !forceVisible) {
    return null;
  }

  return (
    <div id="relationship-report-anchor" ref={onReportReadyRef} className="mt-10 scroll-mt-24">
      {busy ? (
        <p className="mb-4 text-center text-xs text-[#ffd6a5]/80">
          심화 관계 분석을 생성하고 있어요… (1~2분 걸릴 수 있어요)
        </p>
      ) : null}
      {premiumKind === "romantic" && displayRomanticDeep ? (
        <div className="rounded-2xl border border-white/8 bg-[#0a0f1a]/50 p-2 sm:p-3">
          <RomanticSajuDeepReportView
            report={displayRomanticDeep}
            nameA={nameA}
            nameB={nameB}
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
          <WorkColleagueReportView report={displayWorkDeep} />
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
          <MarriageReportView report={displayCohabitationDeep} />
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
          <FriendReportView report={displayFriendshipDeep} />
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
            disabled={busy}
            onClick={() =>
              void (premiumPreview
                ? onEnsurePremiumPreview()
                : onRunPremium(premiumKind))
            }
          >
            {busy
              ? "심화 분석 생성 중…"
              : `${RELATIONSHIP_KIND_LABELS[premiumKind]} 관계 심화 분석 생성하기`}
          </GlowButton>
        </div>
      ) : premiumReady && !hasSnapshotView ? (
        <div className="mt-4 space-y-2 text-center">
          <button
            type="button"
            disabled={busy}
            className="w-full rounded-xl border border-[#ffd6a5]/35 bg-[#ffd6a5]/8 py-2.5 text-sm font-medium text-[#ffd6a5] transition hover:bg-[#ffd6a5]/12 disabled:opacity-50"
            onClick={onRegeneratePremium}
          >
            {busy
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
  );
}
