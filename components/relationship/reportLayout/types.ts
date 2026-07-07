import type { ReactNode } from "react";

export type ScoreMetric = {
  emoji: string;
  label: string;
  value: number;
  /** warm = activation, cool = benefit, alert = risk */
  tone?: "warm" | "cool" | "alert";
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
  children: ReactNode;
};
