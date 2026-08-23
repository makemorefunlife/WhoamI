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

export function WorkChapterNav({ items: _items }: { items: WorkChapterNavItem[] }) {
  return null;
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
