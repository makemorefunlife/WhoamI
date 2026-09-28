"use client";

import { useState } from "react";
import GlowButton from "@/components/space/GlowButton";
import type { FamilyParentRole } from "@/lib/relationship/familyParent/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Family setup step shown before a NEW Family analysis. Collects exactly the
 * canonical Family context the generation route already consumes -- nothing
 * new:
 *   - familyChildIsViewer  (child_is_viewer): am I the parent or the child?
 *   - familyParentType     (parent_type):     is the parent the mom or dad?
 * Copy is the hub kind picker's own (messages.hub.*), so the in-page setup
 * and the hub ask the same questions. Values live in useRelationshipDetail,
 * so they survive a purchase round-trip and are sent with the generation
 * request; the "chosen" flags here are UI-only (explicit answer required
 * before Start), reset whenever this panel mounts for a new analysis.
 */
export default function FamilySetupPanel({
  familyParentType,
  onFamilyParentTypeChange,
  familyChildIsViewer,
  onFamilyChildIsViewerChange,
  partnerName,
  initiallyComplete,
  busy,
  hint,
  onStart,
}: {
  familyParentType: FamilyParentRole;
  onFamilyParentTypeChange: (role: FamilyParentRole) => void;
  familyChildIsViewer: boolean;
  onFamilyChildIsViewerChange: (childIsViewer: boolean) => void;
  partnerName: string;
  /** Context already known (URL from the hub picker, or re-running an existing report). */
  initiallyComplete: boolean;
  busy: boolean;
  /** Optional line under the CTA (e.g. "no Relationship analyses left"). */
  hint?: string | null;
  onStart: () => void;
}) {
  const { messages } = useLocale();
  const [perspectiveChosen, setPerspectiveChosen] = useState(initiallyComplete);
  const [parentChosen, setParentChosen] = useState(initiallyComplete);
  const complete = perspectiveChosen && parentChosen;

  const choiceClass = (selected: boolean) =>
    `w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition active:scale-[0.99] disabled:opacity-50 ${
      selected
        ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-400"
        : "border-emerald-200 bg-white/90 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-50/60"
    }`;

  return (
    <div
      className="space-y-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 sm:p-6"
      data-testid="family-setup-panel"
    >
      <div>
        <p className="text-sm font-semibold text-emerald-950">{messages.report.familySetupTitle}</p>
        <p className="mt-1 text-xs text-emerald-900/80">{messages.report.familySetupSubtitle}</p>
      </div>

      <div className="space-y-2">
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-emerald-900">
          {messages.hub.perspectiveSelectLabel}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {([false, true] as const).map((childIsViewer) => (
            <button
              key={String(childIsViewer)}
              type="button"
              disabled={busy}
              aria-pressed={perspectiveChosen && familyChildIsViewer === childIsViewer}
              className={choiceClass(perspectiveChosen && familyChildIsViewer === childIsViewer)}
              onClick={() => {
                onFamilyChildIsViewerChange(childIsViewer);
                setPerspectiveChosen(true);
              }}
            >
              {childIsViewer ? messages.hub.childPerspectiveTitle : messages.hub.parentPerspectiveTitle}
              <span className="mt-0.5 block text-xs font-normal text-emerald-800/80">
                {childIsViewer
                  ? messages.hub.childPerspectiveSubtitle
                  : messages.hub.parentPerspectiveSubtitle}
              </span>
            </button>
          ))}
        </div>
      </div>

      {perspectiveChosen ? (
        <div className="space-y-2">
          <p className="px-1 text-xs font-semibold text-emerald-900">
            {familyChildIsViewer
              ? messages.report.familySetupParentQuestionPartner(partnerName)
              : messages.report.familySetupParentQuestionSelf}
          </p>
          <div className="flex gap-2">
            {(["mother", "father"] as const).map((role) => {
              const selected = parentChosen && familyParentType === role;
              return (
                <button
                  key={role}
                  type="button"
                  disabled={busy}
                  aria-pressed={selected}
                  onClick={() => {
                    onFamilyParentTypeChange(role);
                    setParentChosen(true);
                  }}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold transition disabled:opacity-50 ${
                    selected
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "border border-emerald-200/60 bg-white/80 text-emerald-800 hover:bg-white"
                  }`}
                >
                  {role === "mother" ? messages.hub.motherLensShort : messages.hub.fatherLensShort}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2 pt-1 text-center">
        <GlowButton type="button" className="w-full" disabled={!complete || busy} onClick={onStart}>
          {messages.report.familyStartAnalysisCta}
        </GlowButton>
        {hint ? <p className="text-xs text-emerald-900/80">{hint}</p> : null}
      </div>
    </div>
  );
}
