"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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
  const { messages, href: localize } = useLocale();
  const title =
    phase === "loading"
      ? messages.report.loadingReportTitle
      : messages.report.generatingReportTitle;
  const subtitle =
    phase === "loading"
      ? messages.report.analyzingHint
      : messages.report.generatingSubtitle(partnerName, kindLabel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="stitch-hero-panel mb-6 rounded-extra-large border border-secondary/25 p-8 text-center"
    >
      <div className="mx-auto mb-4 flex flex-col items-center gap-3">
        <Logo size={36} href={localize("/")} onLightBackground />
        <Loader2 className="h-7 w-7 animate-spin text-secondary" aria-hidden />
      </div>
      <h2 className="stitch-headline text-xl text-primary">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        {subtitle}
      </p>
    </motion.div>
  );
}
