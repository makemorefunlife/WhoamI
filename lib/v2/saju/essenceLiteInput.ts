import { calculateSaju } from "@fullstackfamily/manseryeok";
import { buildChartContext } from "@/lib/saju/chartContext";
import {
  getEarthlyBranchData,
  getHeavenlyStemData,
} from "@/lib/saju/repository";
import { PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import {
  calculateEssenceSelfLite,
  type EssenceLiteInput,
} from "@/lib/v2/saju/essenceLite";

export type EssenceSelfLiteInputPayload = {
  essence_self_profile: {
    profile_type: "essence_self_lite";
    primary_axes: Record<string, number>;
    axis_labels_ko: Record<string, string>;
  };
  day_master_signals: {
    metaphor_ko: string | null;
    strength_ko: string | null;
    weakness_ko: string | null;
    advice_ko: string | null;
  };
  day_branch_signals: {
    meaning_ko: string | null;
    strength_ko: string | null;
    weakness_ko: string | null;
    advice_ko: string | null;
  };
  meta: {
    birth_time_unknown: boolean;
    interpretation_dictionary: "docs/v2/saju/06_Saju_Lite_Interpretation_Dictionary.md";
  };
};

/** LLM 입력 — docs/v2/prompt/02, saju/05 Fast Analysis Inputs */
export function buildEssenceSelfLiteInput(
  input: EssenceLiteInput,
): EssenceSelfLiteInputPayload {
  const unknown = input.birthTimeUnknown === true || !input.birthTime?.trim();
  const [y, mo, d] = input.birthDate.split("-").map(Number);
  const time = unknown ? "12:00" : input.birthTime!.trim();
  const [hour, minute] = time.split(":").map(Number);

  const saju = calculateSaju(y, mo, d, hour, minute) as {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
  };
  const chart = buildChartContext(saju);
  const essence = calculateEssenceSelfLite(input);

  const stem = getHeavenlyStemData(chart.dayStemCode);
  const branch = getEarthlyBranchData(chart.dayBranchCode);

  const axis_labels_ko = Object.fromEntries(
    PRIMARY_AXIS_KEYS.map((k) => [k, PRIMARY_AXIS_LABELS[k]]),
  );

  return {
    essence_self_profile: {
      profile_type: "essence_self_lite",
      primary_axes: essence.primary_axes,
      axis_labels_ko,
    },
    day_master_signals: {
      metaphor_ko: stem?.metaphor_ko ?? null,
      strength_ko: stem?.strength_ko ?? null,
      weakness_ko: stem?.weakness_ko ?? null,
      advice_ko: stem?.advice_ko ?? null,
    },
    day_branch_signals: {
      meaning_ko: branch?.meaning_ko ?? null,
      strength_ko: branch?.strength_ko ?? null,
      weakness_ko: branch?.weakness_ko ?? null,
      advice_ko: branch?.advice_ko ?? null,
    },
    meta: {
      birth_time_unknown: unknown,
      interpretation_dictionary:
        "docs/v2/saju/06_Saju_Lite_Interpretation_Dictionary.md",
    },
  };
}
