"use client";

import { MessageCircle, Sparkles } from "lucide-react";
import { useMessages } from "@/lib/i18n/LocaleProvider";

/** Decide with AI chatbot — future integration */
export default function DecideWithAiComingSoon() {
  const messages = useMessages();
  return (
    <section
      className="relative overflow-hidden rounded-extra-large border border-accent-rose/30 bg-gradient-to-br from-accent-rose-soft/50 via-surface-container-lowest to-surface-container-low/80 p-5 shadow-[0_4px_24px_rgba(196,154,156,0.12)] sm:p-6"
      aria-label={messages.decision.decideWithAiAria}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-rose/10 blur-2xl"
        aria-hidden
      />
      <div className="relative flex gap-4 sm:gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-rose-soft to-surface-container-low ring-1 ring-accent-rose/25">
          <MessageCircle
            className="h-6 w-6 text-accent-rose"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="stitch-headline text-xl leading-snug text-primary">
              {messages.decision.decideWithAiTitle}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-accent-rose/35 bg-accent-rose-soft/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              <Sparkles className="h-3 w-3 text-accent-rose" aria-hidden />
              {messages.decision.decideWithAiBadge}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            {messages.decision.decideWithAiBody}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-rose">
            <span aria-hidden>✦</span>
            {messages.decision.decideWithAiTagline}
          </p>
        </div>
      </div>
    </section>
  );
}
