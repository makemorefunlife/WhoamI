"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import { friendInitials } from "@/lib/relationship/hubDisplayName";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";

type Props = {
  open: boolean;
  friends: RelationshipListItem[];
  waiting: RelationshipListItem[];
  displayNames: Record<string, string>;
  selectedId: string | null;
  onClose: () => void;
  onSelect: (item: RelationshipListItem) => void;
};

function itemKey(item: RelationshipListItem): string {
  return (
    item.list_key ??
    item.relationship_report_id ??
    item.outbound_invite_id ??
    item.partner_name
  );
}

export default function FriendsListSheet({
  open,
  friends,
  waiting,
  displayNames,
  selectedId,
  onClose,
  onSelect,
}: Props) {
  const combined = [...waiting, ...friends];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[105] flex items-end justify-center bg-primary/25 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className={`${hubSheetClass()} max-h-[85dvh] w-full overflow-y-auto rounded-b-none p-5 sm:max-w-lg sm:rounded-extra-large`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="stitch-headline text-xl text-primary">전체 친구</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded-full p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="space-y-2">
          {combined.map((item) => {
            const key = itemKey(item);
            const isPending = item.row_kind === "outbound_waiting";
            const id = item.relationship_report_id;
            const name =
              (id && displayNames[id]) || item.partner_name;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={`flex w-full min-h-[56px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition active:scale-[0.99] ${
                    selectedId === key
                      ? "bg-secondary/15 ring-2 ring-secondary/40"
                      : "bg-surface-container-low/50 hover:bg-surface-container-low"
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-emerald-soft text-sm font-semibold text-primary">
                    {friendInitials(name)}
                  </span>
                  <span className="min-w-0 flex-1 font-medium text-on-surface">
                    {name}
                  </span>
                  {isPending ? (
                    <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
