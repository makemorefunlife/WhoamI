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
      className="inline-flex h-[1.05rem] w-[1.05rem] shrink-0 items-center justify-center text-[rgba(21,21,21,0.42)]"
    >
      <Icon className="h-[0.82rem] w-[0.82rem]" strokeWidth={1.85} />
    </span>
  );
}
