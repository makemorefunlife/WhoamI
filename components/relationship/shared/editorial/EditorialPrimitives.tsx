"use client";

/**
 * Shared "editorial" report primitives — the light cream/serif visual
 * language ported from the Lovable "Inner Compass Reports" concept, used by
 * both the Friend report (formerly components/relationship/friend/editorial/
 * FriendEditorialUI.tsx) and the Romantic V4 report (formerly
 * components/relationship/romantic/v4/primitives.tsx). Consolidated here so
 * the Overview / 11-axis / Why-You-Me-Us sections shared across all 5
 * relationship domains render from one source instead of two near-identical
 * copies.
 *
 * Uses the `rel-*`/`v4-*` design tokens already defined in app/globals.css.
 * Framework-agnostic Tailwind/React — no domain content or scoring logic
 * lives here.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
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

/** Pill name badge with a dark-panel (`invert`) variant — for Why-You-Me-Us. */
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

/**
 * Generic labelled disclosure — like Evidence, but wraps children in a <div>
 * instead of <p> so it can hold multiple blocks (labels, paragraphs, even a
 * nested Evidence/Disclosure) rather than a single run of text.
 */
export function Disclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 font-rel-sans text-[12px] font-medium tracking-[0.04em] text-rel-deep transition-colors hover:text-rel-ink"
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
          <div className="mt-3 space-y-3 border-l border-rel-line pl-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Section shell — editorial, no card. Used by non-collapsible sections (Overview, 11-axis). */
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
      {/* Visual Contract §2 Layout — canonical content width max-w-[880px];
          this container previously drifted to 820px against ChapterSection's
          880px, the exact 820/880 drift the contract's Approved Normalization
          #2 calls out. No chart/functional constraint requires 820px here. */}
      <div className="mx-auto w-full max-w-[880px] px-5 py-14 sm:px-8 sm:py-20">
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

/**
 * Collapsible chapter shell — a double-rule divider that toggles the chapter
 * body open with a smooth slide-down. Used by Why-You-Me-Us and any chapter
 * that needs a "Chapter N" badge (matches Romantic V4's chapter chrome).
 */
export function ChapterSection({
  id,
  n,
  label,
  title,
  lead,
  tint = "plain",
  defaultOpen = true,
  /**
   * Body vertical-rhythm scale. "cozy" (default) is the value Work/Marriage/
   * Family/Friend already render with. "spacious" matches Romantic V4's
   * generous chapter rhythm (Visual Contract §4 Spacing — "preserve the
   * generous existing Romantic chapter rhythm... do not mechanically convert
   * every margin to a single value"). Kept as an explicit opt-in rather than
   * changing the shared default, so consolidating this primitive doesn't
   * silently change any other vertical's spacing.
   */
  spacing = "cozy",
  children,
}: {
  id: string;
  /** Omit for chapters that sit outside the core numbered sequence — renders without a "Chapter N" badge. */
  n?: string;
  label?: string;
  title: string;
  lead?: string;
  tint?: "plain" | "cream" | "deep";
  defaultOpen?: boolean;
  spacing?: "cozy" | "spacious";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bg = tint === "deep" ? "bg-rel-deep" : "bg-rel-bg";
  const bodyPadding =
    spacing === "spacious" ? "pb-16 pt-10 sm:pb-24 sm:pt-12" : "pb-16 pt-8 sm:pb-20 sm:pt-10";
  const leadMargin = spacing === "spacious" ? "mb-10" : "mb-8";

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
                      CHAPTER {n}
                    </span>
                    <span className="h-px w-6 bg-rel-deep/40" />
                  </>
                )}
                {label && (
                  <span className="min-w-0 truncate font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-ink-mute">
                    {label}
                  </span>
                )}
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
            <div className={bodyPadding}>
              {lead && (
                <p className={`${leadMargin} max-w-[62ch] font-rel-sans text-[15px] leading-[1.85] text-rel-ink-soft`}>
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

/** Small-caps eyebrow + serif heading, optional dark-panel (`invert`) variant and trailing tag. */
export function SubHeading({
  title,
  tone = "deep",
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
      className={`border-b pb-3 ${
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
    </div>
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

/** Centered serif pull-quote — a "peak moment" callout (Why-You-Me-Us scene). */
export function Pull({ children }: { children: ReactNode }) {
  return (
    <Reveal>
      <p className="mx-auto max-w-[46ch] text-center font-rel-serif text-[21px] leading-[1.6] tracking-[-0.01em] text-rel-ink sm:text-[26px]">
        {children}
      </p>
    </Reveal>
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

const GAUGE_TONE_COLOR: Record<"good" | "neutral" | "warn", string> = {
  good: "#2f6b4f", // var(--v4-good)
  neutral: "#c9a227", // warm gold — no dedicated design token for a mid/amber tone yet
  warn: "#c1443a", // var(--v4-bad)
};

/** Circular progress ring with the score printed in the center — Overview card score display. */
export function CircularGauge({
  value,
  tone,
  size = 92,
}: {
  value: number;
  tone: "good" | "neutral" | "warn";
  size?: number;
}) {
  const stroke = Math.round(size * 0.083);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - pct / 100);
  const color = GAUGE_TONE_COLOR[tone];
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`${value}/100`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--rel-line)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 700ms ease-out" }}
      />
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-rel-serif"
        fontSize={size * 0.27}
        fill="var(--rel-ink)"
      >
        {value}
      </text>
      <text
        x="50%"
        y="68%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-rel-sans"
        fontSize={size * 0.11}
        fill="var(--rel-ink-mute)"
      >
        /100
      </text>
    </svg>
  );
}

/** Locale-aware static chrome text shared across the editorial sections. */
export function ec(locale: Locale, en: string, ko: string): string {
  return pick(locale, en, ko);
}

export { ArrowRight };
