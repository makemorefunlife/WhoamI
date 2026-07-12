import type { ReactNode } from "react";

export type ScoreMetric = {
  emoji: string;
  label: string;
  value: number;
  /** @deprecated 색은 polarity+value로 결정 */
  tone?: "warm" | "cool" | "alert";
  polarity?: import("@/lib/relationship/scoreBarAppearance").ScorePolarity;
  hint?: string;
};

export type HeadlineProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  names?: [string, string];
  meta?: string;
};

export type RelationshipReportLayoutProps = {
  kind: import("./theme").RelationshipTabKind;
  kindLabel?: string;
  headline: HeadlineProps;
  scores: ScoreMetric[];
  scoreFooter?: ReactNode;
  scoreSourceNote?: string;
  showTriScoreInsight?: boolean;
  conflictInsightAnchor?: string;
  children: ReactNode;
};
