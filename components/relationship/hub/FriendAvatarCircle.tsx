"use client";

import { Plus } from "lucide-react";
import { friendInitials } from "@/lib/relationship/hubDisplayName";

const AVATAR_CLASS =
  "relative inline-flex aspect-square h-16 w-16 shrink-0 flex-none items-center justify-center overflow-hidden rounded-full text-sm font-semibold";

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
    <span
      className={[
        AVATAR_CLASS,
        selected
          ? "bg-gradient-to-br from-accent-emerald-soft to-surface-container-high text-primary ring-[3px] ring-secondary ring-offset-2 ring-offset-[#faf7f0]"
          : "bg-gradient-to-br from-accent-emerald-soft to-surface-container-high text-primary ring-2 ring-outline-variant/40",
      ].join(" ")}
    >
      <span className="leading-none">{friendInitials(name)}</span>
      {isFavorite ? (
        <span className="absolute -right-0.5 -top-0.5 flex aspect-square h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-rose-soft text-[10px] leading-none">
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
    <span
      className={[
        AVATAR_CLASS,
        "border-2 border-dashed border-secondary/45 bg-secondary/10 text-secondary",
        className,
      ].join(" ")}
    >
      <Plus className="h-6 w-6 shrink-0" aria-hidden />
    </span>
  );
}

export function FriendMoreCircle() {
  return (
    <span
      className={[
        AVATAR_CLASS,
        "border-2 border-dashed border-outline-variant/55 bg-surface-container-low/60 text-lg font-bold text-on-surface-variant",
      ].join(" ")}
    >
      ···
    </span>
  );
}
