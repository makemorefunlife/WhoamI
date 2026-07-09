import type { PrimaryAxisKey } from "@/lib/v2/survey/types";

type AxisDelta = Partial<Record<PrimaryAxisKey, number>>;

/** docs/v2/saju/04_Saju_Human_Framework_Mapping.md — Ten God Mapping */
export const TEN_GOD_AXIS_DELTAS: Record<string, AxisDelta> = {
  bigyeon: { autonomy: 8, connection: -2, growth: 3, structure: 4 },
  geopjae: { autonomy: 6, connection: -4, growth: 6, structure: 2, adaptability: -2 },
  siksin: { autonomy: 5, connection: 2, growth: 3, adaptability: 3 },
  sanggwan: { autonomy: 8, stability: -2, growth: 8, structure: -4, adaptability: 4 },
  jeongjae: { connection: 3, stability: 8, growth: -2, structure: 4 },
  pyeonjae: { autonomy: 1, connection: 5, stability: 2, growth: 5, adaptability: 3 },
  jeonggwan: { autonomy: -2, connection: 4, stability: 10, structure: 10, adaptability: -6 },
  pyeongwan: { autonomy: 2, stability: 5, growth: 6, structure: 7, adaptability: -3 },
  jeongin: { autonomy: 2, stability: 5, structure: 5 },
  pyeonin: { autonomy: 4, connection: -2, growth: 1, structure: 3, adaptability: 2 },
};
