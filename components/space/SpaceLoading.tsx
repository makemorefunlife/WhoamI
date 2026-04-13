"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const DEFAULT_SIGNAL_STATUSES = [
  "신호를 수신하는 중",
  "패턴을 정리하는 중",
  "응답을 준비하는 중",
];

export default function SpaceLoading({
  title = "신호를 해석하고 있습니다",
  subtitle,
  rotatingStatuses,
  rotateMs = 1200,
  showSignalBar = true,
  /** true면 메인 문구만 순환 (기존 로딩 화면 호환) */
  rotateMainOnly = false,
}: {
  title?: string;
  subtitle?: string;
  rotatingStatuses?: string[];
  rotateMs?: number;
  showSignalBar?: boolean;
  rotateMainOnly?: boolean;
}) {
  const lines =
    rotatingStatuses && rotatingStatuses.length > 0
      ? rotatingStatuses
      : DEFAULT_SIGNAL_STATUSES;

  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((n) => (n + 1) % lines.length);
    }, rotateMs);
    return () => window.clearInterval(id);
  }, [lines, rotateMs]);

  const rotatingMain = lines[lineIndex % lines.length];

  return (
    <div className="flex min-h-[40vh] w-full max-w-[420px] flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.div
        className="h-11 w-11 rounded-full border-2 border-[rgba(255,255,255,0.12)] border-t-[#67B7FF]"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.05, repeat: Infinity, ease: "linear" }}
      />

      {rotateMainOnly ? (
        <p className="text-base font-medium text-[rgba(255,255,255,0.95)]">
          {rotatingMain}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-base font-medium text-[rgba(255,255,255,0.95)]">
            {title}
          </p>
          <p className="text-sm text-[rgba(255,255,255,0.7)]">{rotatingMain}</p>
          {subtitle ? (
            <p className="text-xs text-[rgba(255,255,255,0.55)]">{subtitle}</p>
          ) : null}
        </div>
      )}

      {showSignalBar ? <div className="space-signal-bar mx-auto" /> : null}
    </div>
  );
}
