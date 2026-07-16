"use client";

import { Heart } from "lucide-react";
import { RelationshipAnalysisBadgeGroup } from "@/components/relationship/RelationshipKindBadge";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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

type HistoryVariant = "dark" | "stitch";

function formatWhen(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

function historyStyles(variant: HistoryVariant) {
  if (variant === "stitch") {
    return {
      loading: "text-center text-xs text-on-surface-variant",
      empty: "text-center text-xs text-on-surface-variant",
      itemSelected:
        "border-secondary/40 bg-secondary/10",
      itemDefault:
        "border-outline-variant/30 bg-surface-container-low/60 hover:border-secondary/30 hover:bg-secondary/5",
      time: "text-[10px] text-on-surface-variant/70",
      title: "text-sm font-medium text-slate-900",
      subtitle: "text-xs leading-relaxed text-on-surface-variant",
      hint: "text-[10px] text-secondary/90",
    };
  }
  return {
    loading: "text-center text-xs text-[var(--space-text-muted)]",
    empty: "text-center text-xs text-[var(--space-text-muted)]",
    itemSelected: "border-[#67B7FF]/50 bg-[#67B7FF]/12",
    itemDefault:
      "border-white/10 bg-white/[0.03] hover:border-[#67B7FF]/30 hover:bg-white/[0.05]",
    time: "text-[10px] text-white/35",
    title: "text-sm font-medium text-[var(--space-text)]",
    subtitle: "text-xs leading-relaxed text-[var(--space-text-muted)]",
    hint: "text-[10px] text-[#9ec8ff]/80",
  };
}

export default function RelationshipAnalysisHistory({
  logs,
  loading,
  selectedLogId,
  onSelectLog,
  variant = "dark",
}: {
  logs: AnalysisLogListItem[];
  loading?: boolean;
  selectedLogId?: string | null;
  onSelectLog?: (log: AnalysisLogListItem) => void;
  variant?: HistoryVariant;
}) {
  const { messages, locale } = useLocale();
  const styles = historyStyles(variant);

  if (loading) {
    return <p className={styles.loading}>{messages.report.historyLoading}</p>;
  }

  if (logs.length === 0) {
    return <p className={styles.empty}>{messages.report.historyEmpty}</p>;
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
                selected ? styles.itemSelected : styles.itemDefault,
                clickable ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <RelationshipAnalysisBadgeGroup
                  kind={log.relationship_kind}
                  level={log.analysis_level}
                />
                <span className={`ml-auto ${styles.time}`}>
                  {formatWhen(log.created_at, locale)}
                </span>
              </div>
              <p className={`mt-1 ${styles.title}`}>{log.summary_title}</p>
              {log.summary_subtitle ? (
                <p className={`mt-0.5 ${styles.subtitle}`}>
                  {log.summary_subtitle}
                </p>
              ) : null}
              {clickable ? (
                <p className={`mt-1.5 ${styles.hint}`}>
                  {selected
                    ? messages.report.historyViewingNow
                    : messages.report.historyTapToView}
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
  variant = "dark",
}: {
  favorited: boolean;
  busy?: boolean;
  onToggle: () => void;
  variant?: HistoryVariant;
}) {
  const { messages } = useLocale();
  const stitch = variant === "stitch";
  return (
    <button
      type="button"
      disabled={busy}
      aria-label={favorited ? messages.report.favoriteRemove : messages.report.favoriteLabel}
      aria-pressed={favorited}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
        stitch
          ? favorited
            ? "border-pink-300 bg-pink-50 text-pink-700 shadow-sm"
            : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:border-pink-300/60 hover:text-pink-600"
          : favorited
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
      {favorited ? messages.report.favoriteLabel : messages.report.heartLabel}
    </button>
  );
}
