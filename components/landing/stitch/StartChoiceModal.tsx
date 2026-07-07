"use client";

import { motion } from "framer-motion";

const primaryBtn = "stitch-cta-primary w-full";
const secondaryBtn = "stitch-cta-secondary w-full";

type Props = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onStartFree: () => void;
  onLogin: () => void;
};

export default function StartChoiceModal({
  open,
  busy,
  onClose,
  onStartFree,
  onLogin,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-primary/25 backdrop-blur-sm"
        aria-label="닫기"
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
          어떻게 시작할까요?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          무료 설문 10문항으로 바로 시작하거나, 계정에 로그인해 이어갈 수
          있어요.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            className={primaryBtn}
            disabled={busy}
            onClick={onStartFree}
          >
            {busy ? "준비하는 중…" : "시작하기 (무료 설문)"}
          </button>
          <button type="button" className={secondaryBtn} onClick={onLogin}>
            로그인
          </button>
        </div>
        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-on-surface-variant hover:text-primary"
          onClick={onClose}
        >
          나중에
        </button>
      </motion.div>
    </div>
  );
}
