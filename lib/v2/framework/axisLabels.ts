import type { PrimaryAxisKey } from "@/lib/v2/survey/types";
import { PRIMARY_AXIS_DEFINITIONS } from "@/lib/v2/framework/primaryAxisDefinitions";

export { PRIMARY_AXIS_DEFINITIONS, PRIMARY_AXIS_LLM_GUIDE } from "@/lib/v2/framework/primaryAxisDefinitions";

/** Korean labels for internal reference and legacy KO copy */
export const PRIMARY_AXIS_LABELS: Record<PrimaryAxisKey, string> = {
  autonomy: PRIMARY_AXIS_DEFINITIONS.autonomy.koLabel,
  connection: PRIMARY_AXIS_DEFINITIONS.connection.koLabel,
  stability: PRIMARY_AXIS_DEFINITIONS.stability.koLabel,
  growth: PRIMARY_AXIS_DEFINITIONS.growth.koLabel,
  structure: PRIMARY_AXIS_DEFINITIONS.structure.koLabel,
  adaptability: PRIMARY_AXIS_DEFINITIONS.adaptability.koLabel,
};

/** English user-facing labels */
export const PRIMARY_AXIS_EN_LABELS: Record<PrimaryAxisKey, string> = {
  autonomy: PRIMARY_AXIS_DEFINITIONS.autonomy.label,
  connection: PRIMARY_AXIS_DEFINITIONS.connection.label,
  stability: PRIMARY_AXIS_DEFINITIONS.stability.label,
  growth: PRIMARY_AXIS_DEFINITIONS.growth.label,
  structure: PRIMARY_AXIS_DEFINITIONS.structure.label,
  adaptability: PRIMARY_AXIS_DEFINITIONS.adaptability.label,
};

/** Default axis order (top → clockwise on radar) */
export const PRIMARY_AXIS_ORDER: PrimaryAxisKey[] = [
  "structure",
  "connection",
  "stability",
  "growth",
  "adaptability",
  "autonomy",
];

/** @deprecated Use PRIMARY_AXIS_ORDER + PRIMARY_AXIS_EN_LABELS */
export const STITCH_DASHBOARD_AXIS_ORDER = PRIMARY_AXIS_ORDER;

/** @deprecated Use PRIMARY_AXIS_EN_LABELS */
export const STITCH_DASHBOARD_AXIS_LABELS = PRIMARY_AXIS_EN_LABELS;

export function primaryAxisEnLabel(key: PrimaryAxisKey): string {
  return PRIMARY_AXIS_DEFINITIONS[key].label;
}

export function primaryAxisKoLabel(key: PrimaryAxisKey): string {
  return PRIMARY_AXIS_DEFINITIONS[key].koLabel;
}

export function primaryAxisDescription(key: PrimaryAxisKey): string {
  return PRIMARY_AXIS_DEFINITIONS[key].description;
}
