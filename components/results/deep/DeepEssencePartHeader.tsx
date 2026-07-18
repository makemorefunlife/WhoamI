"use client";

import { ChevronDown } from "lucide-react";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;
const GOLD = "#c4a482";

type Tone = "highlight" | "accent" | "gold";

type Props = {
  number: string;
  label: string;
  title: string;
  subtitle?: string;
  meta?: string;
  metaTone?: Tone;
  open?: boolean;
  onToggle?: () => void;
};

const TONE_COLOR: Record<Tone, string> = {
  accent: "var(--color-primary)",
  highlight: "var(--color-accent-rose)",
  gold: GOLD,
};

/**
 * 로버블 PartHeader 이식 — 챕터 구분용 헤더. 위아래 얇은 라인 사이에
 * 파트 번호·라벨·세리프 타이틀·이탤릭 서브타이틀·메타 배지·펼침 화살표.
 */
export function DeepEssencePartHeader({
  number,
  label,
  title,
  subtitle,
  meta,
  metaTone = "highlight",
  open,
  onToggle,
}: Props) {
  const collapsible = typeof onToggle === "function";
  const metaColor = TONE_COLOR[metaTone];

  const inner = (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-primary text-[10px] font-semibold tracking-[0.24em] uppercase">
            {number}
          </span>
          <span className="bg-primary/50 h-px w-6" />
          <span className="truncate text-[10px] tracking-[0.2em] text-on-surface-variant uppercase">
            {label}
          </span>
        </div>
        <h2
          className="mt-3 text-[26px] leading-[1.05] font-light tracking-[-0.01em] text-on-surface sm:text-[30px]"
          style={serifStyle}
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            className="mt-2 text-[13px] tracking-[-0.005em] italic"
            style={{ color: GOLD }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3 pt-1">
        {meta ? (
          <span
            className="bg-surface hidden rounded-full border px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.16em] uppercase sm:inline-block"
            style={{ borderColor: metaColor, color: metaColor }}
          >
            {meta}
          </span>
        ) : null}
        {collapsible ? (
          <span
            className="border-primary/50 text-primary flex h-9 w-9 items-center justify-center rounded-full border transition-transform duration-300"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            <ChevronDown strokeWidth={1.5} className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </div>
  );

  const surfaceClass =
    "group border-primary relative w-full border-y py-5 text-left sm:py-6 before:pointer-events-none before:absolute before:inset-x-0 before:top-[3px] before:h-px before:bg-primary/50 before:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-[3px] after:h-px after:bg-primary/50 after:content-['']";

  if (collapsible) {
    return (
      <button type="button" onClick={onToggle} aria-expanded={open} className={surfaceClass}>
        {inner}
      </button>
    );
  }
  return <div className={surfaceClass}>{inner}</div>;
}
