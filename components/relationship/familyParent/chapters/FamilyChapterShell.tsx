"use client";

/**
 * Family report chapter shell — groups the existing FamilyReportSection cards
 * (unchanged, same data, same RelationshipReportCard components) into a
 * numbered 8-chapter structure, mirroring the Romantic V4 report's chapter
 * nav/numbering pattern (components/relationship/romantic/v4/CanonicalReportView.tsx)
 * but reusing Family's own dark-card visual language — no new theme.
 */
import type { ReactNode } from "react";
import { ChapterSection } from "@/components/relationship/shared/editorial/EditorialPrimitives";

export type FamilyChapterNavItem = { id: string; number: string | null; title: string };

export function FamilyChapterNav({ items }: { items: FamilyChapterNavItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav
      className="sticky top-0 z-30 -mx-4 mb-2 overflow-x-auto border-b border-rel-line bg-rel-bg/90 px-4 py-3 no-scrollbar backdrop-blur sm:-mx-6 sm:px-6"
      aria-label="Chapters"
    >
      <div className="flex items-center gap-4">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="shrink-0 whitespace-nowrap font-rel-sans text-[11px] tracking-[0.08em] text-rel-ink-mute transition-colors hover:text-rel-deep"
          >
            {item.number ? `${item.number}. ` : ""}
            {item.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function FamilyChapterSection({
  id,
  number,
  title,
  accent: _accent,
  children,
}: {
  id: string;
  /** Omit for chapters outside the core numbered sequence (e.g. an optional Saju-deep bonus chapter) — renders without a "Chapter N" badge. */
  number: string | null;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <ChapterSection id={id} n={number ?? undefined} title={title}>
      <div className="space-y-5 sm:space-y-6">{children}</div>
    </ChapterSection>
  );
}
