import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { calculateTwelveStage, getHiddenStemsData } from "@/lib/saju/repository";
import {
  clampScore,
  collectBranchPalaceRelations,
  findStemCombine,
  indexFromHits,
  intensityBand3,
} from "./intraPalaceRelations";
import type { CohabitationSajuSignals } from "./types";

const STRONG_DAY_STAGES = new Set([
  "jangsaeng",
  "geollok",
  "jewang",
  "gwandae",
]);

function countTenGods(bundle: SajuBundle): TenGodCounts {
  const counts: TenGodCounts = {};
  for (const t of bundle.tenGods) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function hasDayStemRootInDayBranch(bundle: SajuBundle): boolean {
  const chart = bundle.chart;
  const hidden = getHiddenStemsData(chart.dayBranchCode);
  if (hidden.some((h) => h.stem_code === chart.dayStemCode)) return true;
  const stage = calculateTwelveStage(chart.dayStemCode, chart.dayBranchCode);
  return STRONG_DAY_STAGES.has(stage);
}

function hiddenStemCombineLinks(
  bundle: SajuBundle,
): CohabitationSajuSignals["hidden_stem_intimacy"]["stem_combine_links"] {
  const chart = bundle.chart;
  const hidden = getHiddenStemsData(chart.dayBranchCode);
  const links: CohabitationSajuSignals["hidden_stem_intimacy"]["stem_combine_links"] =
    [];

  for (const h of hidden) {
    for (const palace of chart.pillars) {
      if (palace.name === "일주") continue;
      if (!findStemCombine(h.stem_code, palace.stemCode)) continue;
      links.push({
        hidden_stem_code: h.stem_code,
        target_palace: palace.name as "년주" | "월주" | "시주",
        combine_type: "천간합",
      });
    }
  }
  return links;
}

export function extractCohabitationSignals(
  bundle: SajuBundle,
): CohabitationSajuSignals {
  const chart = bundle.chart;
  const dayRel = collectBranchPalaceRelations(chart, "일주");
  const dayIdx = indexFromHits(dayRel.harmony.length, dayRel.tension.length);

  const rooted = hasDayStemRootInDayBranch(bundle);
  const combineLinks = hiddenStemCombineLinks(bundle);
  let intimacyScore = 35;
  if (rooted) intimacyScore += 30;
  intimacyScore += Math.min(35, combineLinks.length * 18);

  const counts = countTenGods(bundle);
  const profile = profileTenGods(counts);
  const cfoScore = clampScore(
    profile.wealth * 18 +
      profile.officer * 22 +
      profile.wealthOfficer * 8,
  );
  const dualPower = profile.wealthOfficer >= 3;

  return {
    day_palace: {
      branch_code: chart.dayBranchCode,
      harmony_hits: dayRel.harmony,
      tension_hits: dayRel.tension,
      harmony_index: dayIdx.harmony_index,
      tension_index: dayIdx.tension_index,
    },
    hidden_stem_intimacy: {
      day_stem_rooted_in_spouse_palace: rooted,
      stem_combine_links: combineLinks,
      intimacy_index: clampScore(intimacyScore),
    },
    wealth_officer_power: {
      wealth_count: profile.wealth,
      officer_count: profile.officer,
      wealth_officer_total: profile.wealthOfficer,
      cfo_affinity_score: cfoScore,
      dual_power_risk: dualPower,
      economic_dominance_band: intensityBand3(cfoScore),
    },
  };
}
