"use client";

/**
 * Marriage/Cohabitation report chapter shell — groups the existing
 * MarriageReportSection cards (unchanged, same data, same
 * RelationshipReportCard components) into a numbered 8-chapter structure.
 * Same shape as FamilyChapterShell.tsx / WorkChapterShell.tsx (duplicated
 * rather than shared across domain folders — pure presentation, no
 * domain-specific logic either way) — reuses this domain's own dark-card
 * visual language, no new theme.
 */
import type { ReactNode } from "react";

export type MarriageChapterNavItem = { id: string; number: string | null; title: string };

export function MarriageChapterNav({ items }: { items: MarriageChapterNavItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav
      className="-mx-4 mb-2 overflow-x-auto border-b border-white/10 px-4 py-3 no-scrollbar sm:-mx-6 sm:px-6"
      aria-label="Chapters"
    >
      <div className="flex items-center gap-4">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.08em] text-white/55 transition-colors hover:text-white/90"
          >
            {item.number ? `${item.number}. ` : ""}
            {item.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function MarriageChapterSection({
  id,
  number,
  title,
  accent,
  children,
}: {
  id: string;
  /** Omit for chapters outside the core numbered sequence — renders without a "Chapter N" badge. */
  number: string | null;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-5 sm:space-y-6">
      <div className="flex items-center gap-3 pt-2">
        {number ? (
          <span
            className="inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-[0.08em]"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            Chapter {number}
          </span>
        ) : null}
        <h2 className="text-base font-bold tracking-tight text-white/90 sm:text-lg">{title}</h2>
        <div className="h-px flex-1" style={{ backgroundColor: `${accent}33` }} />
      </div>
      <div className="space-y-5 sm:space-y-6">{children}</div>
    </section>
  );
}
