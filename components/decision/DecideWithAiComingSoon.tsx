"use client";

import { MessageCircle } from "lucide-react";

/** 함께 결정하기(AI 챗봇) — 추후 연동 */
export default function DecideWithAiComingSoon() {
  return (
    <section
      className="rounded-extra-large border border-dashed border-outline-variant/55 bg-surface-container-low/35 p-5 sm:p-6"
      aria-label="Decide with AI — coming soon"
    >
      <div className="flex gap-4 sm:gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-emerald-soft">
          <MessageCircle
            className="h-6 w-6 text-secondary"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="stitch-headline text-xl leading-snug text-primary">
              Decide with AI
            </h3>
            <span className="rounded-full bg-accent-rose-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
              Coming soon
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            A conversation partner grounded in your blueprint — for when the
            choice in front of you feels bigger than a pros/cons list.
          </p>
          <p className="mt-2 text-xs text-on-surface-variant/80">
            함께 결정하기(AI)는 곧 연결될 예정이에요.
          </p>
        </div>
      </div>
    </section>
  );
}
