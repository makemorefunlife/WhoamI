"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Logo from "@/components/brand/Logo";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function RelationAnalyzeNavOverlay({
  partnerName,
}: {
  partnerName: string;
}) {
  const { href, messages } = useLocale();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-primary/20 px-6 backdrop-blur-[2px]"
    >
      <div className="stitch-hero-panel max-w-sm rounded-extra-large p-8 text-center shadow-lg">
        <Logo size={40} href={href("/")} onLightBackground className="mx-auto mb-4" />
        <Loader2
          className="mx-auto mb-4 h-8 w-8 animate-spin text-secondary"
          aria-hidden
        />
        <p className="text-sm font-semibold text-primary">
          {messages.hub.navigatingToAnalysis(partnerName)}
        </p>
      </div>
    </motion.div>
  );
}
