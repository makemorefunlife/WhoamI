"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";
import { useMessages } from "@/lib/i18n/LocaleProvider";

type Props = {
  open: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void;
};

export default function RenameFriendDialog({
  open,
  initialName,
  onClose,
  onSave,
}: Props) {
  const messages = useMessages();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const trimmed = name.trim();
  const canSave = trimmed.length >= 1 && trimmed.length <= 10;

  return (
    <div
      className="fixed inset-0 z-[260] flex items-end justify-center bg-primary/25 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`${hubSheetClass()} p-5 sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="stitch-headline text-xl text-primary">{messages.hub.renameTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-low"
            aria-label={messages.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <input
          value={name}
          maxLength={10}
          onChange={(e) => setName(e.target.value)}
          placeholder={messages.hub.renamePlaceholder}
          className="w-full rounded-xl border-0 bg-surface-container-low/80 px-4 py-3.5 text-base text-on-surface outline-none ring-1 ring-outline-variant/35 focus:ring-2 focus:ring-primary/15"
        />
        <p className="mt-2 text-xs text-on-surface-variant">
          {messages.hub.renameCharCountHint(trimmed.length)}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-outline-variant/50 py-3.5 text-sm font-semibold text-on-surface-variant"
          >
            {messages.cta.cancel}
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              onSave(trimmed);
              onClose();
            }}
            className="stitch-cta-primary flex-1 !min-w-0 !px-4 !py-3.5 !text-sm disabled:opacity-45"
          >
            {messages.cta.save}
          </button>
        </div>
      </div>
    </div>
  );
}
