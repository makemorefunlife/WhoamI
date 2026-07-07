"use client";

import { Heart } from "lucide-react";
import {
  RELATIONSHIP_KIND_LABELS,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";

export type AnalysisLogListItem = {
  id: string;
  relationship_kind: RelationshipKind | "unspecified";
  analysis_level: "basic" | "premium";
  result_format: string;
  created_at: string;
  summary_title: string;
  summary_subtitle: string;
  result_snapshot?: Record<string, unknown>;
};

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

export default function RelationshipAnalysisHistory({
  logs,
  loading,
  selectedLogId,
  onSelectLog,
}: {
  logs: AnalysisLogListItem[];
  loading?: boolean;
  selectedLogId?: string | null;
  onSelectLog?: (log: AnalysisLogListItem) => void;
}) {
  if (loading) {
    return (
      <p className="text-center text-xs text-[var(--space-text-muted)]">
        분석 기록 불러오는 중…
      </p>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-center text-xs text-[var(--space-text-muted)]">
        아직 저장된 분석 기록이 없어요. 분석을 만들면 여기에 쌓여요.
      </p>
    );
  }

  return (
    <ul className="space-y-2" role="list">
      {logs.map((log) => {
        const selected = selectedLogId === log.id;
        const clickable = Boolean(onSelectLog);
        return (
          <li key={log.id}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onSelectLog?.(log)}
              className={[
                "w-full rounded-xl border px-3 py-2.5 text-left transition",
                selected
                  ? "border-[#67B7FF]/50 bg-[#67B7FF]/12"
                  : "border-white/10 bg-white/[0.03] hover:border-[#67B7FF]/30 hover:bg-white/[0.05]",
                clickable ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-medium text-[#67B7FF]">
                  {log.relationship_kind === "unspecified"
                    ? "관계"
                    : RELATIONSHIP_KIND_LABELS[log.relationship_kind]}
                </span>
                <span className="text-[10px] text-white/40">
                  {log.analysis_level === "premium" ? "심화" : "기본"}
                </span>
                <span className="ml-auto text-[10px] text-white/35">
                  {formatWhen(log.created_at)}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-[var(--space-text)]">
                {log.summary_title}
              </p>
              {log.summary_subtitle ? (
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--space-text-muted)]">
                  {log.summary_subtitle}
                </p>
              ) : null}
              {clickable ? (
                <p className="mt-1.5 text-[10px] text-[#9ec8ff]/80">
                  {selected ? "지금 이 기록을 보고 있어요" : "탭해서 다시 보기"}
                </p>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function FavoriteHeartButton({
  favorited,
  busy,
  onToggle,
}: {
  favorited: boolean;
  busy?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      aria-label={favorited ? "즐겨찾기 해제" : "즐겨찾기"}
      aria-pressed={favorited}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
        favorited
          ? "border-pink-400/50 bg-pink-500/20 text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.25)]"
          : "border-white/15 bg-white/[0.04] text-white/60 hover:border-pink-400/30 hover:text-pink-200",
      ].join(" ")}
      onClick={onToggle}
    >
      <Heart
        className="h-3.5 w-3.5"
        fill={favorited ? "currentColor" : "none"}
        strokeWidth={favorited ? 0 : 2}
      />
      {favorited ? "즐겨찾기" : "하트"}
    </button>
  );
}
