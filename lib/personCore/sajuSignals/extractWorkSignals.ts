import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
} from "@/lib/hardcoded/sajuReferenceData";
import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { elementInteraction } from "@/lib/saju/pairChartAnalysis";
import { clampScore } from "./intraPalaceRelations";
import type { TenGodCategory, WorkSajuSignals } from "./types";

const GEOKGUK_LABEL: Record<TenGodCategory, string> = {
  officer: "관성격 — 조직·책임·규범 중심",
  wealth: "재성격 — 실리·성과·자원 운용 중심",
  food: "식상격 — 표현·추진·창의 중심",
  seal: "인성격 — 학습·보호·안정 중심",
  self: "비겁격 — 자립·주도·고집 중심",
};

function countTenGods(bundle: SajuBundle): TenGodCounts {
  const counts: TenGodCounts = {};
  for (const t of bundle.tenGods) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function monthStemCategory(godKo: string | null): TenGodCategory {
  if (!godKo) return "self";
  if (godKo.includes("관")) return "officer";
  if (godKo.includes("재")) return "wealth";
  if (godKo.includes("식") || godKo.includes("상관")) return "food";
  if (godKo.includes("인")) return "seal";
  return "self";
}

function driveBand(score: number): WorkSajuSignals["drive_stubborn"]["drive_band"] {
  if (score >= 60) return "high";
  if (score >= 35) return "balanced";
  return "low";
}

function stubbornBand(
  score: number,
): WorkSajuSignals["drive_stubborn"]["stubborn_band"] {
  if (score >= 60) return "stubborn";
  if (score >= 35) return "balanced";
  return "flexible";
}

const NOBLE_STAR_NAMES = ["문창귀인", "장성살", "천을귀인", "학당귀인"] as const;

export function extractWorkSignals(bundle: SajuBundle): WorkSajuSignals {
  const chart = bundle.chart;
  const counts = countTenGods(bundle);
  const profile = profileTenGods(counts);

  const monthGod = bundle.tenGods.find((t) => t.pillar === "월주");
  const monthGodKo = monthGod?.godData?.kor_name ?? null;
  const category = monthStemCategory(monthGodKo);

  const dayEl =
    REF_HEAVENLY_STEMS.find((r) => r.code === chart.dayStemCode)?.element ??
    "earth";
  const monthBrEl =
    REF_EARTHLY_BRANCHES.find((r) => r.code === chart.monthBranchCode)?.element ??
    "earth";
  const monthSupport = elementInteraction(dayEl, monthBrEl).includes("상생");

  const foodIntensity = clampScore(profile.food * 22 + (counts["상관"] ?? 0) * 8);
  const selfIntensity = clampScore(profile.self * 22 + (counts["겁재"] ?? 0) * 8);

  const shinsalNames = new Set(bundle.shinsals.map((s) => s.name_ko));
  const nobleHits = NOBLE_STAR_NAMES.filter((n) => shinsalNames.has(n));
  const workSupport = clampScore(
    20 +
      (shinsalNames.has("문창귀인") ? 28 : 0) +
      (shinsalNames.has("장성살") ? 18 : 0) +
      (shinsalNames.has("천을귀인") ? 22 : 0) +
      (shinsalNames.has("학당귀인") ? 12 : 0),
  );

  return {
    month_geokguk: {
      month_stem_ten_god_ko: monthGodKo,
      month_stem_category: category,
      geokguk_label_ko: GEOKGUK_LABEL[category],
      month_branch_element: monthBrEl,
      day_master_element_support: monthSupport,
    },
    drive_stubborn: {
      food_count: profile.food,
      self_count: profile.self,
      food_intensity: foodIntensity,
      self_intensity: selfIntensity,
      drive_band: driveBand(foodIntensity),
      stubborn_band: stubbornBand(selfIntensity),
    },
    literary_noble: {
      has_munchang_guin: shinsalNames.has("문창귀인"),
      has_jangseong_sal: shinsalNames.has("장성살"),
      has_cheoneul_guin: shinsalNames.has("천을귀인"),
      noble_star_hits: [...nobleHits],
      work_support_index: workSupport,
    },
  };
}
