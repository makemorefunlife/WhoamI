"use client";

/**
 * Friend Premium — editorial report primitives.
 *
 * Ported from the Lovable "Inner Compass Reports" concept project
 * (/friend-concept route, src/components/report/friend/FriendUI.tsx +
 * src/components/report/v4/primitives.tsx) at the user's request to give the
 * Friend report the same cream/serif editorial look already used for the
 * Romantic V4 dev prototype (app/dev/romantic-v4-content-prototype).
 *
 * Uses the `rel-*`/`v4-*` design tokens already defined in app/globals.css.
 * Framework-agnostic Tailwind/React — no TanStack-specific code carried over.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";
import { pick } from "@/lib/relationship/friend/friendCopy";

/**
 * Fades a block in once as it enters the viewport. Subtle, one-shot.
 * Dependency-free (plain IntersectionObserver + inline transition) — this
 * project has neither `tailwindcss-animate` nor `tw-animate-css` installed,
 * so `animate-in`/`fade-in` utility classes would silently no-op here.
 */
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

export function NameChip({
  name,
  side,
  icon,
}: {
  name: string;
  side: "a" | "b";
  icon?: string;
}) {
  const cls =
    side === "a"
      ? "border-v4-a/35 bg-v4-a-soft text-v4-a"
      : "border-v4-b/40 bg-v4-b-soft text-v4-b";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-rel-sans text-[11px] font-semibold tracking-[0.06em] ${cls}`}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {name}
    </span>
  );
}

/** Layer 3 evidence: "왜 이렇게 나왔나요?" — collapsible reasoning line. */
export function Evidence({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 font-rel-sans text-[11.5px] tracking-[0.04em] text-rel-ink-mute transition-colors hover:text-rel-deep"
      >
        {label}
        <ChevronDown
          strokeWidth={1.6}
          className="h-3.5 w-3.5 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-400 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <p className="mt-2.5 border-l border-rel-line pl-3 font-rel-sans text-[13px] leading-[1.8] text-rel-ink-soft">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Section shell — editorial, no card. */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  tint = "plain",
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  tint?: "plain" | "cream" | "deep";
  children: ReactNode;
}) {
  const bg = tint === "cream" ? "bg-rel-taupe-soft/35" : tint === "deep" ? "bg-rel-deep" : "";
  const invert = tint === "deep";
  return (
    <section id={id} className={`scroll-mt-24 ${bg}`}>
      <div className="mx-auto w-full max-w-[820px] px-5 py-14 sm:px-8 sm:py-20">
        <Reveal>
          <header className="mb-9">
            <div className="flex items-center gap-3">
              <span
                className={`font-rel-sans text-[10px] font-semibold uppercase tracking-[0.26em] ${
                  invert ? "text-white/70" : "text-rel-deep"
                }`}
              >
                {eyebrow}
              </span>
              <span className={`h-px flex-1 ${invert ? "bg-white/20" : "bg-rel-deep/20"}`} />
            </div>
            <h2
              className={`mt-4 font-rel-serif text-[25px] leading-[1.25] tracking-[-0.015em] sm:text-[33px] ${
                invert ? "text-white" : "text-rel-ink"
              }`}
            >
              {title}
            </h2>
            {lead && (
              <p
                className={`mt-4 max-w-[58ch] font-rel-sans text-[14.5px] leading-[1.85] ${
                  invert ? "text-white/75" : "text-rel-ink-soft"
                }`}
              >
                {lead}
              </p>
            )}
          </header>
        </Reveal>
        {children}
      </div>
    </section>
  );
}

/** Thin labelled divider used instead of yet another card. */
export function Rule({ label }: { label?: string }) {
  if (!label) return <div className="my-10 h-px w-full bg-rel-line" />;
  return (
    <div className="my-10 flex items-center gap-4">
      <span className="shrink-0 font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-ink-mute">
        {label}
      </span>
      <span className="h-px flex-1 bg-rel-line" />
    </div>
  );
}

/** A ↔ B comparison strip. Mobile-first: stacks, never scrolls sideways. */
export function VersusStrip({
  icon,
  label,
  aName,
  bName,
  a,
  b,
}: {
  icon?: string;
  label: string;
  aName: string;
  bName: string;
  a: string;
  b: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon && (
          <span aria-hidden className="text-[15px]">
            {icon}
          </span>
        )}
        <span className="font-rel-sans text-[12px] font-semibold tracking-[0.06em] text-rel-ink">
          {label}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0">
          <span className="block font-rel-sans text-[10.5px] font-semibold tracking-[0.08em] text-v4-a">
            {aName}
          </span>
          <p className="mt-1 font-rel-sans text-[13.5px] leading-[1.6] text-rel-ink">{a}</p>
        </div>
        <span aria-hidden className="font-rel-sans text-[13px] text-rel-ink-mute">
          ↔
        </span>
        <div className="min-w-0 text-right">
          <span className="block font-rel-sans text-[10.5px] font-semibold tracking-[0.08em] text-v4-b">
            {bName}
          </span>
          <p className="mt-1 font-rel-sans text-[13.5px] leading-[1.6] text-rel-ink">{b}</p>
        </div>
      </div>
    </div>
  );
}

export function Quote({ children }: { children: ReactNode }) {
  return (
    <Reveal>
      <p className="mx-auto max-w-[42ch] text-center font-rel-serif text-[20px] leading-[1.6] tracking-[-0.01em] text-rel-ink sm:text-[24px]">
        {children}
      </p>
    </Reveal>
  );
}

/** Horizontal scale used for the three relationship signals. */
export function Scale({
  value,
  tone,
}: {
  value: number;
  tone: "good" | "neutral" | "warn";
}) {
  const color = tone === "good" ? "bg-v4-good" : tone === "warn" ? "bg-v4-bad" : "bg-rel-deep";
  return (
    <div className="h-[3px] w-full rounded-full bg-rel-line">
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${color}`}
        style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/** Locale-aware static chrome text shared across the editorial sections. */
export function ec(locale: Locale, en: string, ko: string): string {
  return pick(locale, en, ko);
}
