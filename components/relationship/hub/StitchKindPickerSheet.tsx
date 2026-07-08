"use client";

import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";
import type { FamilyPerspective } from "@/lib/relationship/hubNavigation";
import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";

const HUB_KINDS: {
  kind: RelationshipKind;
  label: string;
  hasFamily?: boolean;
}[] = [
  { kind: "romantic", label: "연인" },
  { kind: "work", label: "동료" },
  { kind: "cohabitation", label: "동거·부부" },
  { kind: "friendship", label: "친구" },
  { kind: "family", label: "가족", hasFamily: true },
];

type Props = {
  partnerName: string;
  open: boolean;
  onClose: () => void;
  onSelect: (
    kind: RelationshipKind,
    family?: { perspective: FamilyPerspective; parentType: FamilyParentRole },
  ) => void;
};

export default function StitchKindPickerSheet({
  partnerName,
  open,
  onClose,
  onSelect,
}: Props) {
  const [familyOpen, setFamilyOpen] = useState(false);
  const [parentType, setParentType] = useState<FamilyParentRole>("mother");

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
      className="fixed inset-0 z-[260] flex items-end justify-center bg-primary/25 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kind-picker-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className={`${hubSheetClass()} max-h-[85dvh] overflow-y-auto p-5 sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="kind-picker-title"
              className="stitch-headline text-xl text-primary"
            >
              {partnerName}님과 어떤 관계로 볼까요?
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              선택한 관계에 맞게 분석이 달라져요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-low"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {HUB_KINDS.map(({ kind, label, hasFamily }) =>
            hasFamily ? (
              <div key={kind} className="col-span-2">
                <button
                  type="button"
                  onClick={() => setFamilyOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 px-4 py-4 text-left text-base font-semibold text-primary transition hover:border-secondary/35 active:scale-[0.99]"
                >
                  {label}
                  <ChevronDown
                    className={`h-5 w-5 transition ${familyOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {familyOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2 rounded-2xl border border-outline-variant/25 bg-surface-container-low/40 p-3">
                        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                          관점 선택
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            onSelect(kind, {
                              perspective: "parent",
                              parentType,
                            })
                          }
                          className="w-full rounded-xl border border-outline-variant/35 bg-surface px-4 py-3.5 text-left text-sm font-medium text-primary transition hover:border-secondary/30 active:scale-[0.99]"
                        >
                          부모 입장
                          <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                            자녀를 바라보는 관점
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onSelect(kind, {
                              perspective: "child",
                              parentType,
                            })
                          }
                          className="w-full rounded-xl border border-outline-variant/35 bg-surface px-4 py-3.5 text-left text-sm font-medium text-primary transition hover:border-secondary/30 active:scale-[0.99]"
                        >
                          자녀 입장
                          <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                            부모를 바라보는 관점
                          </span>
                        </button>
                        <div className="flex gap-2 pt-1">
                          {(["mother", "father"] as const).map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => setParentType(role)}
                              className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
                                parentType === role
                                  ? "bg-secondary text-on-primary"
                                  : "bg-surface text-on-surface-variant"
                              }`}
                            >
                              {role === "mother" ? "엄마 렌즈" : "아빠 렌즈"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <button
                key={kind}
                type="button"
                onClick={() => onSelect(kind)}
                className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 py-4 text-base font-semibold text-primary transition hover:border-secondary/35 active:scale-[0.98]"
              >
                {label}
              </button>
            ),
          )}
        </div>
      </motion.div>
    </div>
  );
}
