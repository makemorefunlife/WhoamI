"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { hubSheetClass } from "@/components/relationship/hub/relationHubStyles";
import type { AnalysisSurface } from "@/lib/relationship/analysisSurface";
import type { FamilyPerspective } from "@/lib/relationship/hubNavigation";
import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";
import { useMessages } from "@/lib/i18n/LocaleProvider";

const PREMIUM_PICKER_KINDS: {
  kind: RelationshipKind;
  hasFamily?: boolean;
}[] = [
  { kind: "family", hasFamily: true },
  { kind: "romantic" },
  { kind: "friendship" },
  { kind: "work" },
  { kind: "cohabitation" },
];

type Props = {
  partnerName: string;
  open: boolean;
  onClose: () => void;
  onSelect: (
    surface: AnalysisSurface,
    family?: { perspective: FamilyPerspective; parentType: FamilyParentRole },
  ) => void;
};

function pickerKindLabel(
  kind: RelationshipKind,
  messages: ReturnType<typeof useMessages>,
): string {
  switch (kind) {
    case "family":
      return messages.hub.kindPickerFamily;
    case "romantic":
      return messages.hub.kindPickerRomantic;
    case "friendship":
      return messages.hub.kindPickerFriendship;
    case "work":
      return messages.hub.kindPickerWork;
    case "cohabitation":
      return messages.hub.kindPickerCohabitation;
  }
}

export default function StitchKindPickerSheet({
  partnerName,
  open,
  onClose,
  onSelect,
}: Props) {
  const messages = useMessages();
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

  // Portal straight to <body> — see AddFriendSheet.tsx for why: a fixed
  // full-screen overlay left inside the page's own DOM tree inherits any
  // ancestor's lingering CSS transform as its containing block instead of
  // the real viewport, which can silently push it off-screen.
  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-primary/25 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kind-picker-title"
      onClick={onClose}
    >
      <motion.div
        // initial={false} — see AddFriendSheet.tsx: an enter transition
        // that never fires would otherwise strand this modal at its
        // initial (offset/transparent) transform with no way to reach it,
        // and there's no AnimatePresence here for `exit` to ever run either.
        initial={false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`${hubSheetClass()} flex max-h-[85dvh] flex-col overflow-hidden p-0`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 p-5 pb-4 sm:p-6 sm:pb-4">
          <div>
            <h2
              id="kind-picker-title"
              className="stitch-headline text-xl text-primary"
            >
              {messages.hub.kindPickerTitle(partnerName)}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {messages.hub.kindPickerSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-low"
            aria-label={messages.common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5 pt-0 sm:p-6 sm:pt-0">
          <section>
            <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {messages.hub.kindPickerSectionBasic}
            </p>
            <button
              type="button"
              onClick={() => onSelect("basic")}
              className="flex w-full items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 px-4 py-4 text-sm font-semibold text-primary transition hover:border-secondary/35 active:scale-[0.99]"
            >
              {messages.hub.kindPickerBasicFree}
            </button>
          </section>

          <section>
            <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {messages.hub.kindPickerSectionPremium}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PREMIUM_PICKER_KINDS.map(({ kind, hasFamily }) =>
                hasFamily ? (
                  <div key={kind} className="col-span-2">
                    <button
                      type="button"
                      onClick={() => setFamilyOpen((v) => !v)}
                      className="flex w-full items-center justify-between gap-2 rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 px-4 py-4 text-left transition hover:border-secondary/35 active:scale-[0.99]"
                    >
                      <span className="text-sm font-semibold text-primary">
                        {pickerKindLabel(kind, messages)}
                      </span>
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
                              {messages.hub.perspectiveSelectLabel}
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
                              {messages.hub.parentPerspectiveTitle}
                              <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                                {messages.hub.parentPerspectiveSubtitle}
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
                              {messages.hub.childPerspectiveTitle}
                              <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                                {messages.hub.childPerspectiveSubtitle}
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
                                  {role === "mother"
                                    ? messages.hub.motherLensShort
                                    : messages.hub.fatherLensShort}
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
                    className="flex items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 px-4 py-4 text-sm font-semibold text-primary transition hover:border-secondary/35 active:scale-[0.98]"
                  >
                    {pickerKindLabel(kind, messages)}
                  </button>
                ),
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
