"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Logo from "@/components/brand/Logo";
import type { RomanticPremiumStreamPrelude } from "@/lib/relationship/premiumStream";

type Props = {
  partnerName: string;
  kindLabel: string;
  phase?: "loading" | "generating";
  streamPreview?: string | null;
  prelude?: Pick<
    RomanticPremiumStreamPrelude,
    "relationship_name" | "one_line_summary" | "grade"
  > | null;
};

export default function RelationshipGeneratingPanel({
  partnerName,
  kindLabel,
  phase = "generating",
  streamPreview,
  prelude,
}: Props) {
  const title =
    phase === "loading" ? "리포트를 불러오는 중이에요" : "리포트를 생성중입니다";
  const subtitle =
    phase === "loading"
      ? "잠시만 기다려 주세요."
      : prelude?.one_line_summary ??
        `${partnerName}님과의 ${kindLabel} 분석을 준비하고 있어요. 1~2분 걸릴 수 있어요.`;

  const showStream = Boolean(streamPreview?.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="stitch-hero-panel mb-6 rounded-extra-large border border-secondary/25 p-8 text-center"
    >
      <div className="mx-auto mb-4 flex flex-col items-center gap-3">
        <Logo size={36} href="/" onLightBackground />
        <Loader2 className="h-7 w-7 animate-spin text-secondary" aria-hidden />
      </div>
      <h2 className="stitch-headline text-xl text-primary">{title}</h2>
      {prelude?.relationship_name ? (
        <p className="mt-2 text-base font-medium text-primary">
          {prelude.relationship_name}
          {prelude.grade ? (
            <span className="ml-2 text-sm font-normal text-secondary">
              {prelude.grade}
            </span>
          ) : null}
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        {subtitle}
      </p>

      {showStream ? (
        <div
          className="mx-auto mt-6 max-h-48 overflow-y-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest/80 px-4 py-3 text-left"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-on-surface">
            {streamPreview}
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-secondary align-middle" />
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}
