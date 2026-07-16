"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const primaryBtn = "stitch-cta-primary w-full";
const secondaryBtn = "stitch-cta-secondary w-full";

type Props = {
  open: boolean;
  signedIn?: boolean;
  busy?: boolean;
  onClose: () => void;
  onStartFree: () => void;
  onLogin: () => void;
  onGoBlueprint?: () => void;
  onGoRelationships?: () => void;
  onGoDecision?: () => void;
};

export default function StartChoiceModal({
  open,
  signedIn,
  busy,
  onClose,
  onStartFree,
  onLogin,
  onGoBlueprint,
  onGoRelationships,
  onGoDecision,
}: Props) {
  const { messages } = useLocale();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-primary/25 backdrop-blur-sm"
        aria-label={messages.common.close}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-choice-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-[111] w-full max-w-md rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-xl sm:p-8"
      >
        <h2
          id="start-choice-title"
          className="stitch-headline text-xl sm:text-2xl"
        >
          {signedIn
            ? messages.startChoice.titleSignedIn
            : messages.startChoice.titleGuest}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {signedIn
            ? messages.startChoice.bodySignedIn
            : messages.startChoice.bodyGuest}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {signedIn ? (
            <>
              <button
                type="button"
                className={primaryBtn}
                disabled={busy}
                onClick={onGoBlueprint}
              >
                {messages.startChoice.goBlueprint}
              </button>
              <button
                type="button"
                className={secondaryBtn}
                disabled={busy}
                onClick={onGoRelationships}
              >
                {messages.startChoice.goRelationships}
              </button>
              <button
                type="button"
                className={secondaryBtn}
                onClick={onGoDecision}
              >
                {messages.startChoice.goDecision}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={primaryBtn}
                disabled={busy}
                onClick={onStartFree}
              >
                {busy ? messages.common.preparing : messages.startChoice.startFree}
              </button>
              <button type="button" className={secondaryBtn} onClick={onLogin}>
                {messages.nav.signIn}
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-on-surface-variant hover:text-primary"
          onClick={onClose}
        >
          {messages.startChoice.later}
        </button>
      </motion.div>
    </div>
  );
}
