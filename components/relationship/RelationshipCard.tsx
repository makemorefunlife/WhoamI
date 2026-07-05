"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import GlowButton from "@/components/space/GlowButton";
import RelationshipKindPicker from "@/components/relationship/RelationshipKindPicker";
import {
  parseRelationshipKind,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";
import {
  buildInviteUrl,
  copyInviteLink,
} from "@/lib/relationship/inviteShare";

export type HubRowKind =
  | "outbound_waiting"
  | "relationship_outbound"
  | "relationship_inbound"
  | "relationship_manual"
  | "relationship_other";

export type RelationshipListItem = {
  list_key?: string;
  row_kind?: HubRowKind;
  pipeline_title?: string | null;
  outbound_invite_id?: string | null;
  relationship_report_id: string | null;
  partner_name: string;
  partner_report_id: string | null;
  analysis_type: "basic" | "premium" | null;
  status: "completed" | "pending";
  last_viewed: string | null;
  invite_token: string | null;
  status_hint?: string | null;
  is_favorite?: boolean;
  relationship_kind?: string;
};

const KIND_BADGE: Record<HubRowKind, { label: string; className: string }> = {
  outbound_waiting: {
    label: "보낸 요청",
    className: "bg-[#FFD6A5]/15 text-[#FFD6A5]",
  },
  relationship_outbound: {
    label: "내가 초대한 관계",
    className: "bg-[#67B7FF]/18 text-[#9ec8ff]",
  },
  relationship_inbound: {
    label: "받은 초대",
    className: "bg-[#c4a5ff]/15 text-[#d4c4ff]",
  },
  relationship_other: {
    label: "관계",
    className: "bg-white/10 text-[var(--space-text-muted)]",
  },
  relationship_manual: {
    label: "직접 입력",
    className: "bg-[#7BFFB5]/12 text-[#9dffc8]",
  },
};

type Props = {
  item: RelationshipListItem;
  myReportId: string;
  onDeleteRequest?: (item: RelationshipListItem) => void;
  onDeleteManual?: (item: RelationshipListItem) => void;
  onFavoriteToggle?: (item: RelationshipListItem, favorited: boolean) => void;
  deleteBusy?: boolean;
  favoriteBusy?: boolean;
};

export default function RelationshipCard({
  item,
  myReportId,
  onDeleteRequest,
  onDeleteManual,
  onFavoriteToggle,
  deleteBusy,
  favoriteBusy,
}: Props) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const kind = (item.row_kind ?? "relationship_other") as HubRowKind;
  const badge = KIND_BADGE[kind] ?? KIND_BADGE.relationship_other;
  const isDone = item.status === "completed";
  const isPremium = item.analysis_type === "premium";
  const hasRr = Boolean(item.relationship_report_id);
  const defaultKind = parseRelationshipKind(item.relationship_kind);

  const title =
    item.pipeline_title?.trim() ||
    `${item.partner_name}님과의 관계`;

  const shell = [
    "flex flex-col rounded-xl border p-4 backdrop-blur-sm transition",
  ];

  if (!isDone && kind === "outbound_waiting") {
    shell.push(
      "border-[#FFD6A5]/25 bg-gradient-to-br from-[#FFD6A5]/8 to-transparent",
    );
  } else if (!isDone) {
    shell.push("border-white/12 bg-white/[0.04]");
  } else if (isPremium) {
    shell.push(
      "border-[#FFD6A5]/35 bg-gradient-to-br from-[#FFD6A5]/10 to-transparent shadow-[0_0_20px_rgba(255,214,165,0.1)]",
    );
  } else {
    shell.push(
      "border-[#67B7FF]/28 bg-gradient-to-br from-[#67B7FF]/10 to-transparent shadow-[0_0_20px_rgba(103,183,255,0.12)]",
    );
  }

  async function shareInvite(token: string) {
    const url = `${window.location.origin}/invite?token=${encodeURIComponent(token)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "친구 초대",
          text: "함께 관계 분석을 받아보자.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("복사했어요.");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        alert("복사했어요.");
      } catch {
        alert("공유에 실패했어요.");
      }
    }
  }

  const isWaiting = !isDone && kind === "outbound_waiting";
  const isManual = kind === "relationship_manual";

  function navigateToRelationship(relationshipKind: RelationshipKind) {
    if (!item.relationship_report_id) return;
    setPickerOpen(false);
    router.push(
      `/relationship/${item.relationship_report_id}?viewer=${encodeURIComponent(myReportId)}&kind=${encodeURIComponent(relationshipKind)}`,
    );
  }

  function viewCompletedReport() {
    navigateToRelationship(defaultKind);
  }

  function openForFirstAnalysis() {
    navigateToRelationship("friendship");
  }

  const outlineBtn =
    "w-full rounded-xl border border-white/28 py-2.5 text-sm font-medium text-[var(--space-text)] transition hover:border-white/45 hover:bg-white/[0.06]";

  const halfBtn =
    "flex-1 rounded-xl border border-white/18 bg-white/[0.05] py-2.5 text-xs font-medium text-[var(--space-text)] transition hover:border-white/30 hover:bg-white/[0.08]";

  async function copyInvite(token: string) {
    const url = buildInviteUrl(token);
    const ok = await copyInviteLink(url);
    alert(ok ? "링크를 복사했어요." : "복사에 실패했어요.");
  }

  return (
    <div className={shell.join(" ")}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
        >
          {badge.label}
        </span>
        {item.analysis_type ? (
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              item.analysis_type === "premium"
                ? "bg-[#FFD6A5]/15 text-[#FFD6A5]"
                : "bg-[#67B7FF]/12 text-[#9ec8ff]",
            ].join(" ")}
          >
            {item.analysis_type === "premium" ? "Premium" : "Basic"}
          </span>
        ) : null}
        {hasRr && onFavoriteToggle ? (
          <button
            type="button"
            disabled={favoriteBusy}
            aria-label={item.is_favorite ? "즐겨찾기 해제" : "즐겨찾기"}
            aria-pressed={Boolean(item.is_favorite)}
            className={[
              "ml-auto rounded-full p-1.5 transition disabled:opacity-50",
              item.is_favorite
                ? "text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.45)]"
                : "text-white/35 hover:text-pink-200",
            ].join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(item, !item.is_favorite);
            }}
          >
            <Heart
              className="h-4 w-4"
              fill={item.is_favorite ? "currentColor" : "none"}
              strokeWidth={item.is_favorite ? 0 : 2}
            />
          </button>
        ) : null}
      </div>

      <h3 className="text-sm font-semibold leading-snug text-[var(--space-text)]">
        {title}
      </h3>
      {kind !== "outbound_waiting" && (
        <p className="mt-1 text-xs text-[var(--space-text-muted)]">
          상대: {item.partner_name}
        </p>
      )}

      {!isWaiting ? (
        <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
          {isDone ? (
            <>
              분석 완료
              {item.last_viewed ? ` · ${item.last_viewed}` : ""}
            </>
          ) : (
            <>분석 준비 중 · 잠시 후 다시 열어보세요</>
          )}
        </p>
      ) : null}
      {item.status_hint ? (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--space-text-muted)]">
          {item.status_hint}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {hasRr && isManual && onDeleteManual ? (
          <div className="flex gap-2">
            {isDone ? (
              <div className="flex w-full flex-col gap-2">
                <GlowButton
                  type="button"
                  className="!min-h-[42px] w-full py-2 text-sm"
                  onClick={viewCompletedReport}
                >
                  완성된 리포트 보기
                </GlowButton>
                <button
                  type="button"
                  className={outlineBtn}
                  onClick={() => setPickerOpen(true)}
                >
                  다른 관계로 더 보기
                </button>
              </div>
            ) : (
              <GlowButton
                type="button"
                className="!min-h-[42px] flex-1 py-2 text-sm"
                onClick={openForFirstAnalysis}
              >
                {`${item.partner_name}님 분석하기`}
              </GlowButton>
            )}
            <button
              type="button"
              disabled={deleteBusy}
              className="shrink-0 rounded-xl border border-red-400/25 px-3 py-2 text-xs font-medium text-red-300/90 hover:bg-red-500/10 disabled:opacity-50"
              onClick={() => onDeleteManual(item)}
            >
              {deleteBusy ? "…" : "삭제"}
            </button>
          </div>
        ) : hasRr ? (
          isDone ? (
            <>
              <GlowButton
                type="button"
                className="!min-h-[42px] w-full py-2 text-sm"
                onClick={viewCompletedReport}
              >
                완성된 리포트 보기
              </GlowButton>
              <button
                type="button"
                className={outlineBtn}
                onClick={() => setPickerOpen(true)}
              >
                다른 관계로 더 보기 (연인·가족·동료·친구)
              </button>
            </>
          ) : (
            <GlowButton
              type="button"
              className="!min-h-[42px] w-full py-2 text-sm"
              onClick={openForFirstAnalysis}
            >
              {`${item.partner_name}님 분석하기`}
            </GlowButton>
          )
        ) : null}
        {isWaiting && item.invite_token ? (
          <div className="flex gap-2">
            <button
              type="button"
              className={halfBtn}
              onClick={() => void copyInvite(item.invite_token!)}
            >
              링크 복사
            </button>
            {onDeleteRequest ? (
              <button
                type="button"
                disabled={deleteBusy}
                className="flex-1 rounded-xl border border-red-400/25 py-2.5 text-xs font-medium text-red-300/90 hover:bg-red-500/10 disabled:opacity-50"
                onClick={() => onDeleteRequest(item)}
              >
                {deleteBusy ? "삭제 중…" : "요청 삭제"}
              </button>
            ) : null}
          </div>
        ) : null}
        {!hasRr && item.invite_token && !isWaiting ? (
          <button
            type="button"
            className={outlineBtn}
            onClick={() => void shareInvite(item.invite_token!)}
          >
            초대 링크 다시 보내기
          </button>
        ) : null}
      </div>

      <RelationshipKindPicker
        partnerName={item.partner_name}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={navigateToRelationship}
      />
    </div>
  );
}
