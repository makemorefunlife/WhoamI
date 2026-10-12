"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Signed-out personal-analysis choice, same Stitch buttons as the start
 * chooser: free trial (login is asked only when this is chosen) or guest
 * purchase (no login; the existing guest checkout + email link flow).
 */
export default function PersonalChoiceOptions({
  busy,
  onStartFree,
  onBuyAsGuest,
}: {
  busy?: boolean;
  onStartFree: () => void;
  onBuyAsGuest: () => void;
}) {
  const { messages } = useLocale();
  const t = messages.startChoiceModal;
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="stitch-cta-primary w-full flex items-center justify-between px-6 py-4 text-left shadow-md group transition-all"
        disabled={busy}
        onClick={onStartFree}
      >
        <div className="flex flex-col">
          <span className="text-base font-bold text-on-primary">{t.personalChoiceFreeTitle}</span>
          <span className="text-xs text-on-primary/80 font-normal mt-0.5">{t.personalChoiceFreeDesc}</span>
          <span className="text-[11px] text-on-primary/70 font-normal mt-0.5">{t.freeNeedsLogin}</span>
        </div>
        <span className="text-lg group-hover:translate-x-1 transition-transform" aria-hidden>
          →
        </span>
      </button>
      <button
        type="button"
        className="w-full flex items-center justify-between rounded-2xl border border-secondary/40 bg-secondary/5 px-6 py-4 text-left hover:border-secondary transition-all group"
        disabled={busy}
        onClick={onBuyAsGuest}
      >
        <div className="flex flex-col">
          <span className="text-base font-bold text-primary">{t.personalChoiceBuyTitle}</span>
          <span className="text-xs text-on-surface-variant/80 font-normal mt-0.5">{t.personalChoiceBuyDesc}</span>
        </div>
        <span className="text-lg group-hover:translate-x-1 transition-transform text-primary" aria-hidden>
          →
        </span>
      </button>
    </div>
  );
}
