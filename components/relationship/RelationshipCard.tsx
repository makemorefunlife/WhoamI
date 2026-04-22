"use client";

import { useRouter } from "next/navigation";
import GlowButton from "@/components/space/GlowButton";

export type HubRowKind =
  | "outbound_waiting"
  | "relationship_outbound"
  | "relationship_inbound"
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
};

type Props = {
  item: RelationshipListItem;
  myReportId: string;
};

export default function RelationshipCard({ item, myReportId }: Props) {
  const router = useRouter();
  const kind = (item.row_kind ?? "relationship_other") as HubRowKind;
  const badge = KIND_BADGE[kind] ?? KIND_BADGE.relationship_other;
  const isDone = item.status === "completed";
  const isPremium = item.analysis_type === "premium";
  const hasRr = Boolean(item.relationship_report_id);

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

  function openRelationship() {
    if (!item.relationship_report_id) return;
    router.push(
      `/relationship/${item.relationship_report_id}?viewer=${encodeURIComponent(myReportId)}`,
    );
  }

  const outlineBtn =
    "w-full rounded-xl border border-white/28 py-2.5 text-sm font-medium text-[var(--space-text)] transition hover:border-white/45 hover:bg-white/[0.06]";

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
      </div>

      <h3 className="text-sm font-semibold leading-snug text-[var(--space-text)]">
        {title}
      </h3>
      {kind !== "outbound_waiting" && (
        <p className="mt-1 text-xs text-[var(--space-text-muted)]">
          상대: {item.partner_name}
        </p>
      )}

      <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
        {isDone ? (
          <>
            분석 완료
            {item.last_viewed ? ` · ${item.last_viewed}` : ""}
          </>
        ) : kind === "outbound_waiting" ? (
          <>
            요청 전송됨 · 친구 설문 대기 중
            {item.last_viewed ? ` · ${item.last_viewed}` : ""}
          </>
        ) : (
          <>분석 준비 중 · 잠시 후 다시 열어보세요</>
        )}
      </p>
      {item.status_hint ? (
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--space-text-muted)]">
          {item.status_hint}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {hasRr && (
          <GlowButton
            type="button"
            className="!min-h-[42px] w-full py-2 text-sm"
            onClick={openRelationship}
          >
            {isDone ? "관계 분석 보기" : "관계 분석 열기"}
          </GlowButton>
        )}
        {!hasRr && item.invite_token && (
          <button
            type="button"
            className={outlineBtn}
            onClick={() => void shareInvite(item.invite_token!)}
          >
            초대 링크 다시 보내기
          </button>
        )}
      </div>
    </div>
  );
}
