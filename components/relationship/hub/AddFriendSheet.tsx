"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import InviteShareButtons from "@/components/relationship/InviteShareButtons";
import {
  ManualRelationshipFormFields,
  ManualRelationshipFormFooter,
  useManualRelationshipFormState,
} from "@/components/relationship/ManualRelationshipForm";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Tab = "invite" | "manual";

type ManualPayload = {
  partnerName: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  birthPlace: string | null;
  birthPlaceUnknown: boolean;
  surveySkipped: boolean;
  surveyAnswers: Record<string, string> | null;
};

type Props = {
  open: boolean;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onClose: () => void;
  inviteToken: string | null;
  inviteBusy: boolean;
  onCreateInvite: () => void;
  onShowSentRequests: () => void;
  manualBusy: boolean;
  myReportId: string;
  onManualSubmit: (payload: ManualPayload) => Promise<void>;
};

export default function AddFriendSheet({
  open,
  tab,
  onTabChange,
  onClose,
  inviteToken,
  inviteBusy,
  onCreateInvite,
  onShowSentRequests,
  manualBusy,
  myReportId,
  onManualSubmit,
}: Props) {
  const { messages } = useLocale();
  const manualForm = useManualRelationshipFormState({
    busy: manualBusy,
    onSubmit: onManualSubmit,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Rendered via a portal straight to <body> — this is a fixed-position
  // full-screen overlay, and staying inside the page's own DOM tree means
  // any ancestor with even a tiny lingering CSS transform (framer-motion
  // page/card animations routinely leave one, e.g. a settled `y: 6`) would
  // silently become this overlay's containing block instead of the real
  // viewport, pushing it (and its footer) off-screen. Confirmed live on
  // production: the sheet rendered ~150px below the actual viewport bottom
  // because of exactly this.
  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-end justify-center bg-primary/25 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <motion.div
        // initial={false}: on production this enter transition was
        // observed getting stuck at its `initial` transform (translateY
        // 100%) and never animating to `animate` — pushing the entire
        // sheet, footer included, off-screen with no way to reach it.
        // There's no AnimatePresence/exit-on-unmount here (the component
        // just returns null when closed), so skipping the enter animation
        // costs only a slide-up flourish, never correctness.
        initial={false}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className={`${hubSheetClass()} flex max-h-[min(92dvh,100%)] w-full flex-col overflow-hidden rounded-b-none p-0 sm:max-w-lg sm:rounded-extra-large`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 space-y-5 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between">
            <h2 className="stitch-headline text-xl text-primary">
              {messages.addFriend.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
              aria-label={messages.common.close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2 rounded-full bg-surface-container-low/80 p-1">
            {(
              [
                ["invite", messages.addFriend.tabInvite],
                ["manual", messages.addFriend.tabManual],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`min-h-[44px] flex-1 rounded-full text-sm font-semibold transition ${
                  tab === id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-5 sm:px-6">
          {tab === "invite" ? (
            <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {messages.addFriend.inviteHint}
              </p>
              <button
                type="button"
                disabled={inviteBusy}
                onClick={onCreateInvite}
                className="stitch-cta-primary w-full !min-w-0 !py-4 !text-base disabled:opacity-50"
              >
                {inviteBusy ? messages.common.creating : messages.addFriend.createInvite}
              </button>
              {inviteToken ? (
                <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4">
                  <InviteShareButtons inviteToken={inviteToken} compact />
                </div>
              ) : null}
              <button
                type="button"
                onClick={onShowSentRequests}
                className="w-full min-h-[48px] rounded-full border border-outline-variant/45 py-3 text-sm font-semibold text-secondary transition hover:bg-secondary/10"
              >
                {messages.addFriend.viewSentRequests}
              </button>
            </div>
          ) : (
            <div className="stitch-manual-form rounded-2xl border border-outline-variant/25 bg-surface-container-low/30 p-4">
              <ManualRelationshipFormFields form={manualForm} busy={manualBusy} theme="stitch" />
            </div>
          )}
        </div>

        {/* Fixed footer — outside the scrolling area, so it never overlaps
            or reflows scrolled content the way a sticky-in-scroll-container
            footer with a mismatched reserved-height guess can. */}
        {tab === "manual" ? (
          <div className="shrink-0 border-t border-outline-variant/25 bg-surface-container-low/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:px-6">
            <ManualRelationshipFormFooter form={manualForm} busy={manualBusy} onCancel={onClose} theme="stitch" />
          </div>
        ) : null}
      </motion.div>
    </div>,
    document.body,
  );
}
