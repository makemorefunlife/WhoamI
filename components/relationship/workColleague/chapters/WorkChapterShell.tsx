"use client";

/**
 * Work Colleague report chapter shell — groups the existing WorkReportSection
 * cards (unchanged, same data, same RelationshipReportCard components) into a
 * numbered 8-chapter structure. Same shape as
 * components/relationship/familyParent/chapters/FamilyChapterShell.tsx
 * (duplicated rather than shared across domain folders — pure presentation,
 * no family-specific logic either way) — renders on the shared cream/dark-
 * green editorial system (rel- and v4- design tokens), same as Marriage/Friend.
 */
import type { ReactNode } from "react";
import { ChapterSection } from "@/components/relationship/shared/editorial/EditorialPrimitives";

export type WorkChapterNavItem = { id: string; number: string | null; title: string };

export function WorkChapterNav({ items }: { items: WorkChapterNavItem[] }) {
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

export function WorkChapterSection({
  id,
  number,
  title,
  accent: _accent,
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
    <ChapterSection id={id} n={number ?? undefined} title={title}>
      <div className="space-y-5 sm:space-y-6">{children}</div>
    </ChapterSection>
  );
}
