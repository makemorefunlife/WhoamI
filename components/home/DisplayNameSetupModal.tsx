"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Props = {
  open: boolean;
  busy?: boolean;
  onSubmit: (name: string) => void;
};

/**
 * Shown once, only for email/password signups (no Google/OAuth name to
 * seed from) — spec: "이메일 가입 시 표시 이름을 입력하도록". No close/skip
 * action: a display name is required before report creation can proceed,
 * same as birth info is required before survey submission elsewhere.
 */
export default function DisplayNameSetupModal({ open, busy, onSubmit }: Props) {
  const { messages } = useLocale();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(messages.signupName.required);
      return;
    }
    setError(null);
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-name-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-[10000] w-full max-w-md rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-2xl sm:p-8"
      >
        <h2 id="signup-name-title" className="stitch-headline text-2xl font-bold text-primary">
          {messages.signupName.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {messages.signupName.body}
        </p>

        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder={messages.signupName.placeholder}
          maxLength={60}
          disabled={busy}
          className="mt-5 min-h-[48px] w-full rounded-xl border border-outline-variant/45 bg-surface px-4 text-base text-on-surface outline-none focus:border-primary/60 disabled:opacity-50"
        />
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

        <button
          type="button"
          disabled={busy}
          onClick={handleSubmit}
          className="stitch-cta-primary mt-5 w-full disabled:opacity-50"
        >
          {messages.signupName.submitCta}
        </button>
      </motion.div>
    </div>
  );
}
