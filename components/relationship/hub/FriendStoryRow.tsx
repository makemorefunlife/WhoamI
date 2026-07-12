"use client";

import { motion } from "framer-motion";
import { Pencil, Star } from "lucide-react";
import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import {
  FriendAddCircle,
  FriendAvatarCircle,
  FriendMoreCircle,
} from "@/components/relationship/hub/FriendAvatarCircle";

const STORY_VISIBLE = 3;

type Props = {
  friends: RelationshipListItem[];
  loading?: boolean;
  isSignedIn: boolean;
  selectedId: string | null;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  onSelect: (item: RelationshipListItem) => void;
  onAddFriend: () => void;
  onShowAll: () => void;
  onRename: (item: RelationshipListItem) => void;
  onToggleFavorite: (item: RelationshipListItem) => void;
};

function itemKey(item: RelationshipListItem): string {
  return (
    item.list_key ??
    item.relationship_report_id ??
    item.partner_report_id ??
    item.partner_name
  );
}

function AddFriendButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-16 shrink-0 flex-col items-center gap-2 active:scale-95"
      aria-label="친구 추가하기"
    >
      <FriendAddCircle />
      <span className="max-w-[4.5rem] truncate text-center text-xs font-medium text-secondary">
        친구 추가
      </span>
    </button>
  );
}

export default function FriendStoryRow({
  friends,
  loading = false,
  isSignedIn,
  selectedId,
  favoritesOnly,
  onToggleFavoritesOnly,
  onSelect,
  onAddFriend,
  onShowAll,
  onRename,
  onToggleFavorite,
}: Props) {
  const maxVisible = isSignedIn ? STORY_VISIBLE : 1;
  const visible = friends.slice(0, maxVisible);
  const hasMore = friends.length > maxVisible;
  const selected = friends.find((i) => itemKey(i) === selectedId);
  const isEmpty = friends.length === 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="stitch-headline text-lg text-primary">친구 목록</h2>
        <button
          type="button"
          onClick={onToggleFavoritesOnly}
          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition active:scale-[0.98] ${
            favoritesOnly
              ? "border-primary bg-primary text-on-primary"
              : "border-outline-variant/45 text-on-surface-variant hover:border-outline-variant"
          }`}
        >
          <Star
            className={`h-3.5 w-3.5 ${favoritesOnly ? "fill-current" : ""}`}
          />
          즐겨찾기만 보기
        </button>
      </div>

      {loading && isEmpty ? (
        <p className="py-6 text-center text-sm text-on-surface-variant">
          친구 목록 불러오는 중…
        </p>
      ) : isEmpty && favoritesOnly ? (
        <p className="py-6 text-center text-sm text-on-surface-variant">
          즐겨찾기한 친구가 없어요.
        </p>
      ) : isEmpty ? (
        <div className="flex items-start pb-1 pt-1">
          <AddFriendButton onClick={onAddFriend} />
        </div>
      ) : (
        <div className="flex items-start gap-4 overflow-x-auto px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visible.map((item) => {
            const key = itemKey(item);
            const isSelected = selectedId === key;
            const name = item.partner_name;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-[4.75rem] shrink-0 flex-col items-center gap-2"
                aria-pressed={isSelected}
                aria-label={name}
              >
                <FriendAvatarCircle
                  name={name}
                  selected={isSelected}
                  isFavorite={item.is_favorite}
                />
                <span className="max-w-[4.5rem] truncate text-center text-xs text-on-surface-variant">
                  {name}
                </span>
              </button>
            );
          })}
          {hasMore ? (
            <button
              type="button"
              onClick={onShowAll}
              className="flex w-16 shrink-0 flex-col items-center gap-2 active:scale-95"
              aria-label="전체 친구 보기"
            >
              <FriendMoreCircle />
              <span className="max-w-[4.5rem] truncate text-center text-xs font-medium text-on-surface-variant">
                More
              </span>
            </button>
          ) : null}
          <AddFriendButton onClick={onAddFriend} />
        </div>
      )}

      {selected ? (
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
            disabled={selected.row_kind !== "relationship_manual"}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-surface px-3 text-sm font-medium text-primary transition hover:bg-surface-container-high active:scale-[0.98] disabled:opacity-40"
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
        </motion.div>
      ) : null}
    </section>
  );
}
