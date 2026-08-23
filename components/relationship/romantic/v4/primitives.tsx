"use client";

/**
 * Presentation primitives ported from Lovable "Inner Compass Reports" →
 * romantic-v4-concept (src/components/report/v4/primitives.tsx).
 * Framework-agnostic; only dependency is lucide-react (already used elsewhere
 * in this route). No content or engine logic lives here.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Fades a block in once as it enters the viewport. Subtle, one-shot. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

export function ChapterHeader({
  n,
  label,
  title,
  lead,
  invert = false,
}: {
  n: string;
  label: string;
  title: string;
  lead?: string;
  invert?: boolean;
}) {
  return (
    <Reveal>
      <header>
        <div className="flex items-center gap-3">
          <span
            className={`font-rel-sans text-[10px] font-semibold uppercase tracking-[0.28em] ${
              invert ? "text-rel-taupe" : "text-rel-deep"
            }`}
          >
            Chapter {n}
          </span>
          <span className={`h-px w-8 ${invert ? "bg-white/30" : "bg-rel-deep/30"}`} />
          <span
            className={`min-w-0 truncate font-rel-sans text-[10px] uppercase tracking-[0.22em] ${
              invert ? "text-white/60" : "text-rel-ink-mute"
            }`}
          >
            {label}
          </span>
        </div>
        <h2
          className={`mt-4 font-rel-serif text-[27px] leading-[1.18] tracking-[-0.015em] sm:text-[36px] ${
            invert ? "text-white" : "text-rel-ink"
          }`}
        >
          {title}
        </h2>
        {lead && (
          <p
            className={`mt-5 max-w-[62ch] font-rel-sans text-[15px] leading-[1.85] ${
              invert ? "text-white/75" : "text-rel-ink-soft"
            }`}
          >
            {lead}
          </p>
        )}
      </header>
    </Reveal>
  );
}

export function SubHeading({
  title,
  tone = "deep",
  tag,
  invert = false,
}: {
  title: string;
  tone?: "deep" | "coral" | "taupe";
  tag?: string;
  invert?: boolean;
}) {
  const toneClass =
    tone === "coral" ? "text-rel-taupe" : tone === "taupe" ? "text-rel-taupe" : "text-rel-deep";
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b pb-3 ${
        invert ? "border-white/15" : "border-rel-line"
      }`}
    >
      <h3
        className={`flex min-w-0 items-baseline gap-3 font-rel-serif text-[19px] tracking-[-0.01em] sm:text-[21px] ${
          invert ? "text-white" : "text-rel-ink"
        }`}
      >
        <span className={`text-[13px] leading-none ${invert ? "text-rel-taupe" : toneClass}`} aria-hidden>
          ◤
        </span>
        <span className="min-w-0">{title}</span>
      </h3>
      {tag && (
        <span
          className={`shrink-0 font-rel-sans text-[10px] uppercase tracking-[0.2em] ${
            invert ? "text-white/50" : "text-rel-ink-mute"
          }`}
        >
          {tag}
        </span>
      )}
    </div>
  );
}

export function Pull({ children }: { children: ReactNode }) {
  return (
    <Reveal>
      <p className="mx-auto max-w-[46ch] text-center font-rel-serif text-[21px] leading-[1.6] tracking-[-0.01em] text-rel-ink sm:text-[26px]">
        {children}
      </p>
    </Reveal>
  );
}

/**
 * Collapsible chapter: a double green rule divider that toggles the chapter
 * body open with a smooth slide-down.
 */
export function ChapterSection({
  id,
  n,
  label,
  title,
  lead,
  tint = "plain",
  defaultOpen = false,
  children,
}: {
  id: string;
  /** Omit for chapters that sit outside the core numbered sequence (e.g. an optional bonus chapter) — renders without a "Chapter N" badge. */
  n?: string;
  label: string;
  title: string;
  lead?: string;
  tint?: "plain" | "cream" | "deep";
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bg = tint === "deep" ? "bg-rel-deep" : "bg-rel-bg";

  return (
    <section id={id} className={`scroll-mt-20 ${bg}`}>
      <div className="mx-auto w-full max-w-[880px] px-5 sm:px-8">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="group relative w-full border-y border-rel-deep py-6 text-left before:pointer-events-none before:absolute before:inset-x-0 before:top-[3px] before:h-px before:bg-rel-deep/40 before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-[3px] after:h-px after:bg-rel-deep/40 after:content-[''] sm:py-7"
        >
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-3">
                {n && (
                  <>
                    <span className="font-rel-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-rel-deep">
                      Chapter {n}
                    </span>
                    <span className="h-px w-6 bg-rel-deep/40" />
                  </>
                )}
                <span className="min-w-0 truncate font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-ink-mute">
                  {label}
                </span>
              </div>
              <h2 className="mt-3 font-rel-serif text-[24px] leading-[1.2] tracking-[-0.015em] text-rel-ink sm:text-[32px]">
                {title}
              </h2>
            </div>
            <span
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rel-deep/40 text-rel-deep transition-transform duration-300 group-hover:bg-rel-deep-soft"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              aria-hidden
            >
              <ChevronDown strokeWidth={1.5} className="h-4 w-4" />
            </span>
          </div>
        </button>

        <div
          className="grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none"
          style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
        >
          <div className="overflow-hidden">
            <div className="pb-16 pt-10 sm:pb-24 sm:pt-12">
              {lead && (
                <p className="mb-10 max-w-[62ch] font-rel-sans text-[15px] leading-[1.85] text-rel-ink-soft">
                  {lead}
                </p>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Small end-of-chapter handoff line. */
export function Bridge({ text, label = "Next" }: { text: string; label?: string }) {
  return (
    <Reveal>
      <div className="mt-12 flex items-start gap-4 border-t border-rel-line pt-6">
        <span className="mt-1 shrink-0 font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-taupe">
          {label}
        </span>
        <p className="min-w-0 font-rel-serif text-[16px] leading-[1.7] text-rel-ink sm:text-[17px]">
          {text}
        </p>
      </div>
    </Reveal>
  );
}

export function PersonTag({
  name,
  side,
  invert = false,
}: {
  name: string;
  side: "a" | "b";
  invert?: boolean;
}) {
  const cls =
    side === "a"
      ? "border-v4-a/40 text-v4-a bg-v4-a-soft"
      : "border-v4-b/50 text-v4-b bg-v4-b-soft";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-rel-sans text-[10.5px] font-semibold tracking-[0.14em] ${
        invert ? "border-white/25 bg-white/10 text-white" : cls
      }`}
    >
      {name}
    </span>
  );
}
