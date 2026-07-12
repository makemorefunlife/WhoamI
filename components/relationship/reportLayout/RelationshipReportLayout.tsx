"use client";

import RelationshipHeadlineBanner from "./RelationshipHeadlineBanner";
import RelationshipScoreBoard from "./RelationshipScoreBoard";
import { useReportTone } from "./ReportSurface";
import { getTabTheme } from "./theme";
import type { RelationshipReportLayoutProps } from "./types";

/** 5대 탭 공통 — 헤드라인 → 스코어 보드 → 리포트 카드(children) */
export default function RelationshipReportLayout({
  kind,
  kindLabel,
  headline,
  scores,
  scoreFooter,
  scoreSourceNote,
  showTriScoreInsight = kind === "romantic",
  conflictInsightAnchor,
  children,
}: RelationshipReportLayoutProps) {
  const theme = getTabTheme(kind);
  const tone = useReportTone();

  return (
    <div className="space-y-6 sm:space-y-8">
      <RelationshipHeadlineBanner
        headline={headline}
        theme={theme}
        kindLabel={kindLabel}
      />

      <RelationshipScoreBoard
        scores={scores}
        theme={theme}
        footer={scoreFooter}
        sourceNote={scoreSourceNote}
        showTriScoreInsight={showTriScoreInsight}
        conflictInsightAnchor={conflictInsightAnchor}
      />

      <div
        className={
          tone.surface === "stitch"
            ? "space-y-8 sm:space-y-10"
            : "space-y-5 sm:space-y-6"
        }
      >
        {children}
      </div>
    </div>
  );
}
