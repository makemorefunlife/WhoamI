"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import GlowButton from "@/components/space/GlowButton";
import RelationshipKindPicker from "@/components/relationship/RelationshipKindPicker";
import type { AnalysisSurface } from "@/lib/relationship/analysisSurface";
import { buildRelationshipAnalyzeUrl } from "@/lib/relationship/hubNavigation";
import {
  parseRelationshipKind,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";
import {
  buildInviteUrl,
  copyInviteLink,
} from "@/lib/relationship/inviteShare";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type { MessageCatalog } from "@/lib/i18n/messages";

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
  /** 관계(친구) 추가 시각 ISO — 최신 추가가 목록 앞에 */
  added_at?: string | null;
};

function kindBadgeMap(
  messages: MessageCatalog,
): Record<HubRowKind, { label: string; className: string }> {
  return {
    outbound_waiting: {
      label: messages.hub.badgeOutboundWaiting,
      className: "bg-[#FFD6A5]/15 text-[#FFD6A5]",
    },
    relationship_outbound: {
      label: messages.hub.badgeOutboundRelationship,
      className: "bg-[#67B7FF]/18 text-[#9ec8ff]",
    },
    relationship_inbound: {
      label: messages.hub.badgeInboundRelationship,
      className: "bg-[#c4a5ff]/15 text-[#d4c4ff]",
    },
    relationship_other: {
      label: messages.hub.badgeOtherRelationship,
      className: "bg-white/10 text-[var(--space-text-muted)]",
    },
    relationship_manual: {
      label: messages.hub.badgeManualRelationship,
      className: "bg-[#7BFFB5]/12 text-[#9dffc8]",
    },
  };
}

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
  const messages = useMessages();
  const [pickerOpen, setPickerOpen] = useState(false);
  const kind = (item.row_kind ?? "relationship_other") as HubRowKind;
  const kindBadge = kindBadgeMap(messages);
  const badge = kindBadge[kind] ?? kindBadge.relationship_other;
  const isDone = item.status === "completed";
  const isPremium = item.analysis_type === "premium";
  const hasRr = Boolean(item.relationship_report_id);
  const defaultKind = parseRelationshipKind(item.relationship_kind);

  const title =
    item.pipeline_title?.trim() ||
    messages.hub.defaultTitle(item.partner_name);

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
          title: messages.hub.shareInviteTitle,
          text: messages.hub.shareInviteText,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert(messages.hub.shareCopiedNotice);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        alert(messages.hub.shareCopiedNotice);
      } catch {
        alert(messages.hub.shareFailedNotice);
      }
    }
  }

  const isWaiting = !isDone && kind === "outbound_waiting";
  const isManual = kind === "relationship_manual";

  function navigateToRelationship(surface: AnalysisSurface) {
    if (!item.relationship_report_id) return;
    setPickerOpen(false);
    router.push(
      buildRelationshipAnalyzeUrl(
        item.relationship_report_id,
        myReportId,
        surface,
      ),
    );
  }

  function viewCompletedReport() {
    if (item.analysis_type === "basic" || !item.relationship_kind) {
      navigateToRelationship("basic");
      return;
    }
    navigateToRelationship(defaultKind);
  }

  function openForFirstAnalysis() {
    navigateToRelationship("basic");
  }

  const outlineBtn =
    "w-full rounded-xl border border-white/28 py-2.5 text-sm font-medium text-[var(--space-text)] transition hover:border-white/45 hover:bg-white/[0.06]";

  const halfBtn =
    "flex-1 rounded-xl border border-white/18 bg-white/[0.05] py-2.5 text-xs font-medium text-[var(--space-text)] transition hover:border-white/30 hover:bg-white/[0.08]";

  async function copyInvite(token: string) {
    const url = buildInviteUrl(token);
    const ok = await copyInviteLink(url);
    alert(ok ? messages.hub.inviteLinkCopied : messages.hub.inviteLinkCopyFailed);
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
            {item.analysis_type === "premium" ? messages.hub.premiumBadge : messages.hub.basicBadge}
          </span>
        ) : null}
        {hasRr && onFavoriteToggle ? (
          <button
            type="button"
            disabled={favoriteBusy}
            aria-label={item.is_favorite ? messages.hub.unfavorite : messages.hub.favorite}
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
          {messages.hub.partnerPrefix(item.partner_name)}
        </p>
      )}

      {!isWaiting ? (
        <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
          {isDone ? (
            <>
              {isPremium ? messages.hub.premiumDoneStatus : messages.hub.basicDoneStatus}
              {item.last_viewed ? ` · ${item.last_viewed}` : ""}
            </>
          ) : (
            <>
              {item.analysis_type === "basic" || item.analysis_type === "premium"
                ? messages.hub.premiumIncompleteStatus
                : messages.hub.preparingStatus}
            </>
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
                  {messages.hub.viewCompletedReport}
                </GlowButton>
                <button
                  type="button"
                  className={outlineBtn}
                  onClick={() => setPickerOpen(true)}
                >
                  {messages.hub.viewOtherKinds}
                </button>
              </div>
            ) : (
              <GlowButton
                type="button"
                className="!min-h-[42px] flex-1 py-2 text-sm"
                onClick={openForFirstAnalysis}
              >
                {messages.hub.analyzeWithName(item.partner_name)}
              </GlowButton>
            )}
            <button
              type="button"
              disabled={deleteBusy}
              className="shrink-0 rounded-xl border border-red-400/25 px-3 py-2 text-xs font-medium text-red-300/90 hover:bg-red-500/10 disabled:opacity-50"
              onClick={() => onDeleteManual(item)}
            >
              {deleteBusy ? "…" : messages.hub.delete}
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
                {messages.hub.viewCompletedReport}
              </GlowButton>
              <button
                type="button"
                className={outlineBtn}
                onClick={() => setPickerOpen(true)}
              >
                {messages.hub.viewOtherKindsFull}
              </button>
            </>
          ) : (
            <GlowButton
              type="button"
              className="!min-h-[42px] w-full py-2 text-sm"
              onClick={openForFirstAnalysis}
            >
              {messages.hub.analyzeWithName(item.partner_name)}
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
              {messages.hub.copyLink}
            </button>
            {onDeleteRequest ? (
              <button
                type="button"
                disabled={deleteBusy}
                className="flex-1 rounded-xl border border-red-400/25 py-2.5 text-xs font-medium text-red-300/90 hover:bg-red-500/10 disabled:opacity-50"
                onClick={() => onDeleteRequest(item)}
              >
                {deleteBusy ? messages.hub.deleting : messages.hub.deleteRequestCta}
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
            {messages.hub.resendInviteLink}
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
