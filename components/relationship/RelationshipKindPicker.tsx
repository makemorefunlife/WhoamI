"use client";

import { useEffect, useRef } from "react";
import GlowButton from "@/components/space/GlowButton";
import { RelationshipKindBadge } from "@/components/relationship/RelationshipKindBadge";
import {
  RELATIONSHIP_KINDS,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";

export default function RelationshipKindPicker({
  partnerName,
  open,
  onClose,
  onSelect,
}: {
  partnerName: string;
  open: boolean;
  onClose: () => void;
  onSelect: (kind: RelationshipKind) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kind-picker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#0a0f1a]/95 p-5 shadow-xl backdrop-blur-md"
      >
        <h2
          id="kind-picker-title"
          className="text-center text-base font-semibold text-[var(--space-text)]"
        >
          {partnerName}님과 어떤 관계로 볼까요?
        </h2>
        <p className="mt-2 text-center text-xs text-[var(--space-text-muted)]">
          선택한 관계에 맞게 심화 분석이 달라져요.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {RELATIONSHIP_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className="flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] py-3 transition hover:border-[#67B7FF]/40 hover:bg-[#67B7FF]/10"
              onClick={() => onSelect(kind)}
            >
              <RelationshipKindBadge kind={kind} />
            </button>
          ))}
        </div>
        <GlowButton
          type="button"
          className="mt-4 w-full border border-white/15 bg-transparent !shadow-none"
          onClick={onClose}
        >
          취소
        </GlowButton>
      </div>
    </div>
  );
}
