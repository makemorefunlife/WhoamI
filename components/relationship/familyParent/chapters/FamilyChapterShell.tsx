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

export function FamilyChapterNav({ items: _items }: { items: FamilyChapterNavItem[] }) {
  return null;
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
