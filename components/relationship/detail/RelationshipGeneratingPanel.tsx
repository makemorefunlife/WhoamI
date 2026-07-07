"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Logo from "@/components/brand/Logo";

type Props = {
  partnerName: string;
  kindLabel: string;
  phase?: "loading" | "generating";
};

export default function RelationshipGeneratingPanel({
  partnerName,
  kindLabel,
  phase = "generating",
}: Props) {
  const title =
    phase === "loading" ? "리포트를 불러오는 중이에요" : "리포트를 생성중입니다";
  const subtitle =
    phase === "loading"
      ? "잠시만 기다려 주세요."
      : `${partnerName}님과의 ${kindLabel} 분석을 준비하고 있어요. 1~2분 걸릴 수 있어요.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="stitch-hero-panel mb-6 rounded-extra-large border border-secondary/25 p-8 text-center"
    >
      <div className="mx-auto mb-4 flex flex-col items-center gap-3">
        <Logo size={36} href={null} onLightBackground />
        <Loader2 className="h-7 w-7 animate-spin text-secondary" aria-hidden />
      </div>
      <h2 className="stitch-headline text-xl text-primary">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        {subtitle}
      </p>
    </motion.div>
  );
}
