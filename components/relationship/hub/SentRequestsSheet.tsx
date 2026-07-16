"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { RelationshipListItem } from "@/components/relationship/RelationshipCard";
import InviteShareButtons from "@/components/relationship/InviteShareButtons";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type Props = {
  open: boolean;
  items: RelationshipListItem[];
  busyId: string | null;
  onClose: () => void;
  onResend: (item: RelationshipListItem) => void;
  onCancel: (item: RelationshipListItem) => void;
};

export default function SentRequestsSheet({
  open,
  items,
  busyId,
  onClose,
  onResend,
  onCancel,
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
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className={`${hubSheetClass()} max-h-[85dvh] w-full overflow-y-auto rounded-b-none p-5 sm:max-w-lg sm:rounded-extra-large`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="stitch-headline text-xl text-primary">{messages.hub.sentRequestsTitle}</h2>
          <button type="button" onClick={onClose} aria-label={messages.common.close} className="rounded-full p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-on-surface-variant">
            {messages.hub.noSentRequests}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const busy = busyId === item.outbound_invite_id;
              const token = item.invite_token;
              return (
                <li
                  key={item.list_key ?? item.outbound_invite_id ?? item.partner_name}
                  className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-on-surface">{messages.hub.inviteWaitingTitle}</p>
                      <p className="text-xs text-on-surface-variant">
                        {item.status_hint ?? messages.hub.inviteWaitingHintDefault}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={busy || !token}
                      onClick={() => onResend(item)}
                      className="min-h-[44px] flex-1 rounded-full border border-secondary/40 py-2.5 text-sm font-semibold text-secondary disabled:opacity-50"
                    >
                      {messages.hub.resendInvite}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onCancel(item)}
                      className="min-h-[44px] flex-1 rounded-full border border-outline-variant/45 py-2.5 text-sm font-semibold text-on-surface-variant disabled:opacity-50"
                    >
                      {messages.hub.cancelInvite}
                    </button>
                  </div>
                  {token ? (
                    <div className="mt-3 border-t border-outline-variant/20 pt-3">
                      <InviteShareButtons inviteToken={token} compact />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
