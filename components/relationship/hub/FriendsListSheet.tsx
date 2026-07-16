"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import { FriendAvatarCircle } from "@/components/relationship/hub/FriendAvatarCircle";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type Props = {
  open: boolean;
  friends: RelationshipListItem[];
  selectedId: string | null;
  onClose: () => void;
  onSelect: (item: RelationshipListItem) => void;
};

function itemKey(item: RelationshipListItem): string {
  return (
    item.list_key ??
    item.relationship_report_id ??
    item.partner_report_id ??
    item.partner_name
  );
}

export default function FriendsListSheet({
  open,
  friends,
  selectedId,
  onClose,
  onSelect,
}: Props) {
  const messages = useMessages();
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
      className="fixed inset-0 z-[260] flex items-end justify-center bg-primary/25 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className={`${hubSheetClass()} max-h-[85dvh] w-full overflow-y-auto rounded-b-none p-5 sm:max-w-lg sm:rounded-extra-large`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="stitch-headline text-xl text-primary">{messages.hub.allFriendsTitle}</h2>
          <button type="button" onClick={onClose} aria-label={messages.common.close} className="rounded-full p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        {friends.length === 0 ? (
          <p className="py-10 text-center text-sm text-on-surface-variant">
            {messages.hub.noFriendsRegistered}
          </p>
        ) : (
          <ul className="space-y-2">
            {friends.map((item) => {
              const key = itemKey(item);
              const name = item.partner_name;
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
                    <FriendAvatarCircle name={name} />
                    <span className="min-w-0 flex-1 font-medium text-on-surface">
                      {name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
