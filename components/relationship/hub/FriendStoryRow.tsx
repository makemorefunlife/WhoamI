"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, MoreHorizontal, Pencil, Search, Star } from "lucide-react";
import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import { friendInitials } from "@/lib/relationship/hubDisplayName";

const STORY_VISIBLE = 3;

type Props = {
  friends: RelationshipListItem[];
  waiting: RelationshipListItem[];
  selectedId: string | null;
  displayNames: Record<string, string>;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  onSelect: (item: RelationshipListItem) => void;
  onShowAll: () => void;
  onRename: (item: RelationshipListItem) => void;
  onToggleFavorite: (item: RelationshipListItem) => void;
  onAnalyze: (item: RelationshipListItem) => void;
};

function itemKey(item: RelationshipListItem): string {
  return (
    item.list_key ??
    item.relationship_report_id ??
    item.outbound_invite_id ??
    item.invite_token ??
    item.partner_name
  );
}

function displayNameFor(
  item: RelationshipListItem,
  displayNames: Record<string, string>,
): string {
  const id = item.relationship_report_id;
  if (id && displayNames[id]) return displayNames[id];
  return item.partner_name;
}

export default function FriendStoryRow({
  friends,
  waiting,
  selectedId,
  displayNames,
  favoritesOnly,
  onToggleFavoritesOnly,
  onSelect,
  onShowAll,
  onRename,
  onToggleFavorite,
  onAnalyze,
}: Props) {
  const combined = [...waiting, ...friends];
  const visible = combined.slice(0, STORY_VISIBLE);
  const hasMore = combined.length > STORY_VISIBLE;
  const selected = combined.find(
    (i) => itemKey(i) === selectedId,
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="stitch-headline text-lg text-primary">친구 목록</h2>
        <button
          type="button"
          onClick={onToggleFavoritesOnly}
          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition active:scale-[0.98] ${
            favoritesOnly
              ? "border-secondary bg-secondary/15 text-secondary"
              : "border-outline-variant/45 text-on-surface-variant hover:border-secondary/35"
          }`}
        >
          <Star
            className={`h-3.5 w-3.5 ${favoritesOnly ? "fill-current" : ""}`}
          />
          즐겨찾기만 보기
        </button>
      </div>

      {combined.length === 0 ? (
        <p className="py-8 text-center text-sm text-on-surface-variant">
          {favoritesOnly
            ? "즐겨찾기한 친구가 없어요."
            : "아직 친구가 없어요. 아래에서 추가해 보세요."}
        </p>
      ) : (
        <div className="flex items-start gap-4 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visible.map((item) => {
            const key = itemKey(item);
            const isPending = item.row_kind === "outbound_waiting";
            const isSelected = selectedId === key;
            const name = displayNameFor(item, displayNames);

            return (
              <div key={key} className="relative flex shrink-0 flex-col items-center">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full text-sm font-semibold transition active:scale-95 ${
                    isSelected
                      ? "ring-[3px] ring-secondary ring-offset-2 ring-offset-[#faf7f0]"
                      : "ring-2 ring-outline-variant/40"
                  } bg-gradient-to-br from-accent-emerald-soft to-surface-container-high text-primary`}
                  aria-pressed={isSelected}
                  aria-label={`${name}${isPending ? " — 수락 대기 중" : ""}`}
                >
                  {friendInitials(name)}
                  {isPending ? (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#faf7f0] bg-amber-400 text-primary shadow-sm">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  ) : null}
                  {item.is_favorite ? (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-rose-soft text-[10px]">
                      ★
                    </span>
                  ) : null}
                </button>
                <span className="mt-2 max-w-[76px] truncate text-center text-xs text-on-surface-variant">
                  {name}
                </span>
              </div>
            );
          })}
          {hasMore ? (
            <button
              type="button"
              onClick={onShowAll}
              className="flex shrink-0 flex-col items-center pt-1 active:scale-95"
            >
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-dashed border-outline-variant/55 bg-surface-container-low/60 text-on-surface-variant">
                <MoreHorizontal className="h-6 w-6" />
              </span>
              <span className="mt-2 text-xs font-medium text-on-surface-variant">
                More
              </span>
            </button>
          ) : null}
        </div>
      )}

      <AnimatePresence>
        {selected && selected.row_kind !== "outbound_waiting" ? (
          <motion.div
            key={itemKey(selected)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="flex flex-wrap gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-3"
          >
            <button
              type="button"
              onClick={() => onRename(selected)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-surface px-3 text-sm font-medium text-primary transition hover:bg-surface-container-high active:scale-[0.98]"
            >
              <Pencil className="h-4 w-4" />
              이름 변경하기
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite(selected)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-surface px-3 text-sm font-medium text-primary transition hover:bg-surface-container-high active:scale-[0.98]"
            >
              <Star
                className={`h-4 w-4 ${selected.is_favorite ? "fill-amber-400 text-amber-400" : ""}`}
              />
              {selected.is_favorite ? "즐겨찾기 해제" : "즐겨찾기"}
            </button>
            <button
              type="button"
              onClick={() => onAnalyze(selected)}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-secondary/15 px-3 text-sm font-semibold text-secondary transition hover:bg-secondary/20 active:scale-[0.98]"
            >
              <Search className="h-4 w-4" />
              관계 분석하기
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
