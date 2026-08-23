"use client";

/**
 * Marriage/Cohabitation report chapter shell — groups the existing
 * MarriageReportSection cards (unchanged, same data, same
 * RelationshipReportCard components) into a numbered chapter structure.
 * Editorial visual skin — same rel-* / v4-* tokens and ChapterSection chrome
 * as Romantic V4 / Friend (components/relationship/shared/editorial/
 * EditorialPrimitives.tsx), scoped to Marriage only. `accent` is accepted
 * for call-site compatibility but unused — the editorial palette is shared
 * (rel-deep), not per-domain.
 */
import type { ReactNode } from "react";
import { ChapterSection } from "@/components/relationship/shared/editorial/EditorialPrimitives";

export type MarriageChapterNavItem = { id: string; number: string | null; title: string };

export function MarriageChapterNav({ items: _items }: { items: MarriageChapterNavItem[] }) {
  return null;
}

export function MarriageChapterSection({
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
