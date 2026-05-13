"use client";

import {
  House,
  LayoutGrid,
  RotateCcw,
  Search,
  UsersRound,
} from "lucide-react";

type SubtleButtonIconKind =
  | "search"
  | "redo"
  | "home"
  | "dashboard"
  | "relationship";

const ICON_BY_KIND = {
  search: Search,
  redo: RotateCcw,
  home: House,
  dashboard: LayoutGrid,
  relationship: UsersRound,
} as const;

export default function SubtleButtonIcon({ kind }: { kind: SubtleButtonIconKind }) {
  const Icon = ICON_BY_KIND[kind];
  return (
    <span
      aria-hidden
      className="inline-flex h-[1.18rem] w-[1.18rem] shrink-0 items-center justify-center text-current opacity-95"
    >
      <Icon className="h-[0.98rem] w-[0.98rem] drop-shadow-[0_0_6px_rgba(255,255,255,0.14)]" strokeWidth={2.05} />
    </span>
  );
}
