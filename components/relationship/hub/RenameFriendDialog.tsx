"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";

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
          <h2 className="stitch-headline text-xl text-primary">이름 변경</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-low"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <input
          value={name}
          maxLength={10}
          onChange={(e) => setName(e.target.value)}
          placeholder="별명 (최대 10자)"
          className="w-full rounded-xl border-0 bg-surface-container-low/80 px-4 py-3.5 text-base text-on-surface outline-none ring-1 ring-outline-variant/35 focus:ring-2 focus:ring-primary/15"
        />
        <p className="mt-2 text-xs text-on-surface-variant">
          {trimmed.length}/10 · 기기에만 저장돼요 (DB 연동 예정)
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-outline-variant/50 py-3.5 text-sm font-semibold text-on-surface-variant"
          >
            취소
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
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
