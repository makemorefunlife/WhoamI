"use client";

import { Plus } from "lucide-react";
import { friendInitials } from "@/lib/relationship/hubDisplayName";

/** 링·즐겨찾기 배지가 잘리지 않도록 바깥 래퍼에 여유 공간 */
const AVATAR_OUTER_CLASS =
  "relative inline-flex h-[4.75rem] w-[4.75rem] shrink-0 flex-none items-center justify-center";

const AVATAR_INNER_CLASS =
  "inline-flex aspect-square h-16 w-16 items-center justify-center rounded-full text-sm font-semibold";

type FriendAvatarCircleProps = {
  name: string;
  selected?: boolean;
  isFavorite?: boolean;
};

export function FriendAvatarCircle({
  name,
  selected = false,
  isFavorite = false,
}: FriendAvatarCircleProps) {
  return (
    <span className={AVATAR_OUTER_CLASS}>
      <span
        className={[
          AVATAR_INNER_CLASS,
          selected
            ? "bg-gradient-to-br from-accent-emerald-soft to-surface-container-high text-primary ring-[3px] ring-secondary ring-offset-2 ring-offset-[#faf7f0]"
            : "bg-gradient-to-br from-accent-emerald-soft to-surface-container-high text-primary ring-2 ring-outline-variant/40",
        ].join(" ")}
      >
        <span className="leading-none">{friendInitials(name)}</span>
      </span>
      {isFavorite ? (
        <span
          className="pointer-events-none absolute right-0.5 top-0.5 z-10 flex aspect-square h-5 w-5 items-center justify-center rounded-full border border-outline-variant/25 bg-accent-rose-soft text-[10px] leading-none shadow-sm"
          aria-hidden
        >
          ★
        </span>
      ) : null}
    </span>
  );
}

type FriendAddCircleProps = {
  className?: string;
};

export function FriendAddCircle({ className = "" }: FriendAddCircleProps) {
  return (
    <span className={[AVATAR_OUTER_CLASS, className].join(" ")}>
      <span
        className={[
          AVATAR_INNER_CLASS,
          "border-2 border-dashed border-secondary/45 bg-secondary/10 text-secondary",
        ].join(" ")}
      >
        <Plus className="h-6 w-6 shrink-0" aria-hidden />
      </span>
    </span>
  );
}

export function FriendMoreCircle() {
  return (
    <span className={AVATAR_OUTER_CLASS}>
      <span
        className={[
          AVATAR_INNER_CLASS,
          "border-2 border-dashed border-outline-variant/55 bg-surface-container-low/60 text-lg font-bold text-on-surface-variant",
        ].join(" ")}
      >
        ···
      </span>
    </span>
  );
}
