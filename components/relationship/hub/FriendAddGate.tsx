"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { FriendAddReadiness } from "@/lib/relationship/friendAddReadiness";

type Props = {
  readiness: FriendAddReadiness;
  surveyRequired: boolean;
  busy?: boolean;
  onSignIn: () => void;
  onBuyRelationship: () => void;
  onFillProfile: () => void;
};

/**
 * Replaces the old browser alert ("my report not found…") with a guide for
 * what the viewer has to do before adding a friend. Purchases are never a
 * precondition; buying a relationship pass stays available regardless.
 */
export function FriendAddGateContent({ readiness, surveyRequired, busy, onSignIn, onBuyRelationship, onFillProfile }: Props) {
  const { messages } = useLocale();
  const t = messages.hub;

  if (readiness.status === "signed_out") {
    return (
      <div className="space-y-4 text-left">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">{t.friendGateEyebrow}</p>
          <h2 className="stitch-headline mt-2 text-xl leading-snug text-primary">{t.friendGateSignedOutTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t.friendGateSignedOutBody}</p>
        </div>
        <button type="button" className="stitch-cta-primary w-full" onClick={onSignIn} disabled={busy}>
          {t.friendGateSignIn}
        </button>
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-4">
          <p className="text-sm font-semibold text-on-surface">{t.friendGateBuyTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{t.friendGateBuyNote}</p>
          <button type="button" className="stitch-cta-secondary mt-3 w-full" onClick={onBuyRelationship} disabled={busy}>
            {t.friendGateBuyCta}
          </button>
        </div>
      </div>
    );
  }

  if (readiness.status === "no_profile" || readiness.status === "needs_birth" || readiness.status === "needs_survey") {
    const cta =
      readiness.status === "no_profile"
        ? t.friendGateStartCta
        : readiness.status === "needs_survey"
          ? t.friendGateSurveyCta
          : t.friendGateBirthCta;
    return (
      <div className="space-y-4 text-left">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">{t.friendGateEyebrow}</p>
          <h2 className="stitch-headline mt-2 text-xl leading-snug text-primary">{t.friendGateProfileTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            {surveyRequired ? t.friendGateProfileBodySurvey : t.friendGateProfileBody}
          </p>
        </div>
        <ul className="space-y-1.5 rounded-2xl bg-surface-container-low/60 px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
          <li>· {t.friendGateFree}</li>
          {!surveyRequired ? <li>· {t.friendGateSurveyOptional}</li> : null}
          <li>· {t.friendGateReturnNote}</li>
        </ul>
        <button type="button" className="stitch-cta-primary w-full" onClick={onFillProfile} disabled={busy}>
          {cta}
        </button>
      </div>
    );
  }

  return null;
}

export default function FriendAddGateDialog({ open, onClose, ...props }: Props & { open: boolean; onClose: () => void }) {
  const { messages } = useLocale();
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
      className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-sm font-semibold text-on-surface-variant/60 hover:text-on-surface"
          aria-label={messages.common.close}
        >
          ✕
        </button>
        <FriendAddGateContent {...props} />
      </div>
    </div>
  );
}
