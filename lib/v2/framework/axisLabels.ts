import type { PrimaryAxisKey } from "@/lib/v2/survey/types";

export const PRIMARY_AXIS_LABELS: Record<PrimaryAxisKey, string> = {
  autonomy: "독립성",
  connection: "정서적 친밀감",
  stability: "안정 추구",
  growth: "성장 추구",
  control: "계획성",
  adaptability: "적응성",
};

export const PRIMARY_AXIS_ORDER: PrimaryAxisKey[] = [
  "autonomy",
  "connection",
  "stability",
  "growth",
  "control",
  "adaptability",
];

/** Stitch dashboard — mockup axis labels (top → clockwise) */
export const STITCH_DASHBOARD_AXIS_ORDER: PrimaryAxisKey[] = [
  "control",
  "connection",
  "stability",
  "growth",
  "adaptability",
  "autonomy",
];

export const STITCH_DASHBOARD_AXIS_LABELS: Record<PrimaryAxisKey, string> = {
  control: "Focus",
  connection: "Warmth",
  stability: "Resilience",
  growth: "Curiosity",
  adaptability: "Stillness",
  autonomy: "Expression",
};
