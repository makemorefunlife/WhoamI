import type { JohuClimateSnapshot } from "@/lib/personCore/types/sajuMaster";
import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import {
  clampScore,
  collectBranchPalaceRelations,
} from "./intraPalaceRelations";
import type { FriendshipSajuSignals, IsolationBand } from "./types";

function countTenGods(bundle: SajuBundle): TenGodCounts {
  const counts: TenGodCounts = {};
  for (const t of bundle.tenGods) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function dominantElement(
  el: JohuClimateSnapshot["element_counts"],
): FriendshipSajuSignals["johu_profile"]["dominant_element"] {
  const entries = Object.entries(el) as [
    FriendshipSajuSignals["johu_profile"]["dominant_element"],
    number,
  ][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "earth";
}

function isolationBand(score: number): IsolationBand {
  if (score >= 65) return "lone_wolf";
  if (score >= 35) return "balanced";
  return "bonded";
}

export function extractFriendshipSignals(
  bundle: SajuBundle,
  johu: JohuClimateSnapshot,
): FriendshipSajuSignals {
  const chart = bundle.chart;
  const yearRel = collectBranchPalaceRelations(chart, "년주");
  const monthRel = collectBranchPalaceRelations(chart, "월주");

  const ymHarmony = [...yearRel.harmony, ...monthRel.harmony].filter(
    (h) => h.counterpart_palace === "월주" || h.counterpart_palace === "년주",
  );
  const ymTension = [...yearRel.tension, ...monthRel.tension].filter(
    (h) => h.counterpart_palace === "월주" || h.counterpart_palace === "년주",
  );

  const socialTension = clampScore(ymTension.length * 30 + yearRel.tension.length * 12);

  const counts = countTenGods(bundle);
  const profile = profileTenGods(counts);

  let isolationScore = 30;
  if (profile.self === 0) isolationScore += 35;
  else if (profile.self === 1) isolationScore += 15;
  else if (profile.self >= 4) isolationScore += 40;
  else if (profile.self >= 3) isolationScore += 22;
  const peerCluster = clampScore(100 - isolationScore);

  return {
    year_month_palace: {
      harmony_hits: ymHarmony,
      tension_hits: ymTension,
      social_surface_tension_index: socialTension,
    },
    johu_profile: {
      heat_score: johu.heat_score,
      moisture_score: johu.moisture_score,
      temperature_band: johu.temperature_band,
      dominant_element: dominantElement(johu.element_counts),
    },
    bijie_isolation: {
      self_count: profile.self,
      peer_cluster_score: peerCluster,
      isolation_score: clampScore(isolationScore),
      isolation_band: isolationBand(isolationScore),
    },
  };
}
