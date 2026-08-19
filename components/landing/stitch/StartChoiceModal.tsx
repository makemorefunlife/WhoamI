"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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

  const handleBlueprintClick = () => {
    if (signedIn && onGoBlueprint) {
      onGoBlueprint();
    } else {
      onStartFree();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-primary/30 backdrop-blur-sm transition-opacity"
        aria-label={messages.common.close}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-choice-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="relative z-[111] w-full max-w-md rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary uppercase tracking-wider">
            시작하기
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant/60 hover:text-on-surface text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        <h2 id="start-choice-title" className="stitch-headline text-2xl font-bold text-primary">
          어디로 이동할까요?
        </h2>
        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-on-surface-variant/80">
          원하는 분석 및 서비스 메뉴를 선택해 보세요.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {/* 1. 개인분석 (추천) */}
          <button
            type="button"
            className="stitch-cta-primary w-full flex items-center justify-between px-6 py-4 text-left shadow-md group transition-all"
            disabled={busy}
            onClick={handleBlueprintClick}
          >
            <div className="flex flex-col">
              <span className="text-base font-bold text-on-primary">
                개인분석 (추천)
              </span>
              <span className="text-xs text-on-primary/80 font-normal mt-0.5">
                타고난 고유 설계도 & 현재 상태 진단
              </span>
            </div>
            <span className="text-lg group-hover:translate-x-1 transition-transform" aria-hidden>
              →
            </span>
          </button>

          {/* 2. 관계분석 */}
          <button
            type="button"
            className="stitch-cta-secondary w-full flex items-center justify-between px-6 py-4 text-left border border-outline-variant/40 hover:border-secondary transition-all group"
            disabled={busy}
            onClick={onGoRelationships}
          >
            <div className="flex flex-col">
              <span className="text-base font-bold text-primary">
                관계분석
              </span>
              <span className="text-xs text-on-surface-variant/80 font-normal mt-0.5">
                상대와의 차이 & 맞춤 소통 가이드
              </span>
            </div>
            <span className="text-lg group-hover:translate-x-1 transition-transform text-primary" aria-hidden>
              →
            </span>
          </button>

          {/* 3. 결정일기 */}
          <button
            type="button"
            className="stitch-cta-secondary w-full flex items-center justify-between px-6 py-4 text-left border border-outline-variant/40 hover:border-secondary transition-all group"
            disabled={busy}
            onClick={onGoDecision}
          >
            <div className="flex flex-col">
              <span className="text-base font-bold text-primary">
                결정일기
              </span>
              <span className="text-xs text-on-surface-variant/80 font-normal mt-0.5">
                선택과 회고를 통한 나와의 연결
              </span>
            </div>
            <span className="text-lg group-hover:translate-x-1 transition-transform text-primary" aria-hidden>
              →
            </span>
          </button>
        </div>

        {!signedIn ? (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={onLogin}
              className="text-xs text-on-surface-variant/70 underline underline-offset-4 hover:text-primary transition font-medium"
            >
              기존 계정으로 로그인하기
            </button>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
