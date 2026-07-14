"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import InviteShareButtons from "@/components/relationship/InviteShareButtons";
import ManualRelationshipForm from "@/components/relationship/ManualRelationshipForm";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";

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
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className={`${hubSheetClass()} flex max-h-[min(92dvh,100%)] w-full flex-col overflow-hidden rounded-b-none p-0 sm:max-w-lg sm:rounded-extra-large`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 space-y-5 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between">
            <h2 className="stitch-headline text-xl text-primary">친구 추가</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2 rounded-full bg-surface-container-low/80 p-1">
            {(
              [
                ["invite", "초대 링크"],
                ["manual", "직접 입력"],
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
          {tab === "invite" ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-on-surface-variant">
                링크는 48시간 유효하며, 수락 시 분석권 1회 차감됩니다.
              </p>
              <button
                type="button"
                disabled={inviteBusy}
                onClick={onCreateInvite}
                className="stitch-cta-primary w-full !min-w-0 !py-4 !text-base disabled:opacity-50"
              >
                {inviteBusy ? "만드는 중…" : "초대 링크 생성"}
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
                보낸 요청 보기
              </button>
            </div>
          ) : (
            <div className="stitch-manual-form rounded-2xl border border-outline-variant/25 bg-surface-container-low/30 p-4">
              <ManualRelationshipForm
                myReportId={myReportId}
                busy={manualBusy}
                theme="stitch"
                onCancel={onClose}
                onSubmit={onManualSubmit}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
