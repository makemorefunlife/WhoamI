/**
 * Synthetic, non-sensitive Work pilot fixtures.
 * Birth dates + fabricated work_signals + psych axes — no real user data.
 */
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import type { PilotPairCategory } from "./types";

const SECONDARY_KEYS = [
  "stimulation",
  "self_control",
  "practicality",
  "structure",
  "empathy",
  "conflict_style",
  "resilience",
  "recognition",
  "energy_style",
  "thinking_style",
  "decision_style",
] as const;

export function sajuFromBirth(birthDate: string, birthTime = "12:00") {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  return toV1SajuApiPayload(bundle);
}

export function samplePsych(
  overrides: Partial<Record<(typeof SECONDARY_KEYS)[number], number>> = {},
): PsychMasterJson {
  const secondary_axes = Object.fromEntries(
    SECONDARY_KEYS.map((k) => [k, 50]),
  ) as PsychMasterJson["secondary_axes"];
  Object.assign(secondary_axes, overrides);
  return {
    schema_version: "psych_master_v1",
    secondary_axes,
    survey_source: "v2_10q",
    survey_completed_at: null,
    survey_input_fingerprint: null,
    home_life_dna: {
      lifestyle_title: "synthetic",
      family_identity_category: "balanced",
      family_identity_line: "fixture",
      life_values_line: "fixture",
      private_home_self_line: "fixture",
      energy_battery_line: "fixture",
    },
  };
}

export function fabricateWorkSignals(params: {
  officer: number;
  self: number;
  seal: number;
  wealth: number;
  food?: number;
}): WorkSajuSignals {
  const food = params.food ?? 0;
  return {
    month_geokguk: {
      month_stem_ten_god_ko: null,
      month_stem_category: "officer",
      geokguk_label_ko: "",
      month_branch_element: "earth",
      day_master_element_support: false,
    },
    drive_stubborn: {
      food_count: food,
      self_count: params.self,
      officer_count: params.officer,
      wealth_count: params.wealth,
      seal_count: params.seal,
      food_intensity: food,
      self_intensity: params.self,
      drive_band: params.officer + params.self >= 5 ? "high" : "balanced",
      stubborn_band: params.self >= 3 ? "stubborn" : "balanced",
    },
    literary_noble: {
      has_munchang_guin: false,
      has_jangseong_sal: params.officer >= 3,
      has_cheoneul_guin: false,
      noble_star_hits: [],
      work_support_index: params.officer + params.seal,
    },
    johu_profile: {
      heat_score: 50,
      moisture_score: 50,
      temperature_band: "neutral",
      dominant_element: "earth",
    },
  };
}

export type PilotFixture = {
  pair_id: string;
  category: PilotPairCategory;
  nicknameA: string;
  nicknameB: string;
  birthA: string;
  birthB: string;
  timeA?: string;
  timeB?: string;
  psychA: PsychMasterJson;
  psychB: PsychMasterJson;
  workSignalsA: WorkSajuSignals;
  workSignalsB: WorkSajuSignals;
  locale: Locale;
  description: string;
};

/**
 * Four evaluation categories using synthetic births already used in Work CE tests.
 */
export const PILOT_FIXTURES: PilotFixture[] = [
  {
    pair_id: "similar-01",
    category: "similar",
    nicknameA: "Kim",
    nicknameB: "Lee",
    birthA: "1990-05-15",
    birthB: "1990-06-10",
    timeA: "14:30",
    timeB: "14:00",
    psychA: samplePsych({
      structure: 62,
      practicality: 60,
      recognition: 55,
      thinking_style: 58,
      decision_style: 56,
      energy_style: 54,
    }),
    psychB: samplePsych({
      structure: 58,
      practicality: 57,
      recognition: 52,
      thinking_style: 55,
      decision_style: 54,
      energy_style: 56,
    }),
    workSignalsA: fabricateWorkSignals({
      officer: 2,
      self: 2,
      seal: 2,
      wealth: 2,
    }),
    workSignalsB: fabricateWorkSignals({
      officer: 2,
      self: 1,
      seal: 2,
      wealth: 2,
    }),
    locale: "ko-KR",
    description: "Similar psych bands and balanced work_signals",
  },
  {
    pair_id: "highly-different-01",
    category: "highly_different",
    nicknameA: "Park",
    nicknameB: "Choi",
    birthA: "1988-01-08",
    birthB: "1995-11-22",
    timeA: "09:00",
    timeB: "21:00",
    psychA: samplePsych({
      structure: 88,
      practicality: 85,
      self_control: 80,
      recognition: 30,
      stimulation: 25,
      energy_style: 35,
      thinking_style: 82,
      decision_style: 78,
      empathy: 40,
    }),
    psychB: samplePsych({
      structure: 22,
      practicality: 28,
      self_control: 30,
      recognition: 85,
      stimulation: 80,
      energy_style: 82,
      thinking_style: 25,
      decision_style: 30,
      empathy: 75,
    }),
    workSignalsA: fabricateWorkSignals({
      officer: 4,
      self: 3,
      seal: 0,
      wealth: 1,
    }),
    workSignalsB: fabricateWorkSignals({
      officer: 0,
      self: 0,
      seal: 1,
      wealth: 1,
      food: 4,
    }),
    locale: "ko-KR",
    description: "Large psych gaps + opposite drive/officer vs food profiles",
  },
  {
    pair_id: "complementary-01",
    category: "complementary",
    nicknameA: "Alex",
    nicknameB: "Jordan",
    birthA: "1990-05-15",
    birthB: "1992-08-20",
    timeA: "14:30",
    timeB: "09:00",
    psychA: samplePsych({
      structure: 72,
      practicality: 70,
      recognition: 45,
      thinking_style: 68,
      decision_style: 65,
      empathy: 40,
      energy_style: 55,
    }),
    psychB: samplePsych({
      structure: 40,
      practicality: 38,
      recognition: 72,
      thinking_style: 35,
      decision_style: 42,
      empathy: 75,
      energy_style: 70,
    }),
    workSignalsA: fabricateWorkSignals({
      officer: 4,
      self: 3,
      seal: 0,
      wealth: 0,
    }),
    workSignalsB: fabricateWorkSignals({
      officer: 0,
      self: 0,
      seal: 4,
      wealth: 3,
    }),
    locale: "ko-KR",
    description:
      "External vs internal leadership-shaped signals (CE test pattern)",
  },
  {
    pair_id: "conflict-heavy-01",
    category: "conflict_heavy",
    nicknameA: "River",
    nicknameB: "Sky",
    birthA: "1985-03-03",
    birthB: "1987-09-09",
    timeA: "08:00",
    timeB: "20:30",
    psychA: samplePsych({
      conflict_style: 85,
      recognition: 80,
      self_control: 25,
      structure: 70,
      decision_style: 75,
      empathy: 30,
      resilience: 35,
      energy_style: 78,
    }),
    psychB: samplePsych({
      conflict_style: 80,
      recognition: 78,
      self_control: 28,
      structure: 68,
      decision_style: 72,
      empathy: 32,
      resilience: 30,
      energy_style: 75,
    }),
    workSignalsA: fabricateWorkSignals({
      officer: 4,
      self: 4,
      seal: 0,
      wealth: 0,
    }),
    workSignalsB: fabricateWorkSignals({
      officer: 4,
      self: 3,
      seal: 0,
      wealth: 1,
    }),
    locale: "ko-KR",
    description:
      "Both high drive/officer + tension psych (recognition/conflict/self_control)",
  },
];
