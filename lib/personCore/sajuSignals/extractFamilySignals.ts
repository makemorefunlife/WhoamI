import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import {
  clampScore,
  collectBranchPalaceRelations,
  intensityBand3,
} from "./intraPalaceRelations";
import type { FamilySajuSignals, ParentBondBand } from "./types";
import type { PairIntensityBand } from "./pairTypes";

export type HomeClimateBand = PairIntensityBand;

/**
 * E home_climate — 기존 family_conflict_index에 intensityBand3(≥67 high, ≥34 medium) 적용.
 * 신규 threshold 없음. year_karma / nagging / umbilical과 무관한 person 노출.
 */
export function resolveHomeClimateBandFromIndex(
  familyConflictIndex: number,
): HomeClimateBand {
  return intensityBand3(familyConflictIndex);
}

/** PersonCore FamilySajuSignals.home_punishment SSOT 소비. 신호 없으면 low(0). */
export function resolveHomeClimateBand(
  familySignals?: FamilySajuSignals,
): {
  sourceValue: {
    family_conflict_index: number;
    punishment_count: number;
  };
  bucket: HomeClimateBand;
} {
  const family_conflict_index =
    familySignals?.home_punishment.family_conflict_index ?? 0;
  const punishment_count =
    familySignals?.home_punishment.punishment_count ?? 0;
  return {
    sourceValue: { family_conflict_index, punishment_count },
    bucket: resolveHomeClimateBandFromIndex(family_conflict_index),
  };
}

function countTenGods(bundle: SajuBundle): TenGodCounts {
  const counts: TenGodCounts = {};
  for (const t of bundle.tenGods) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

function parentBondBand(
  sealCount: number,
  sealExcess: boolean,
  sealIsolated: boolean,
): ParentBondBand {
  if (sealIsolated) return "distant";
  if (sealExcess) return "smothering";
  if (sealCount >= 2) return "balanced";
  return "distant";
}

/** 비교표 B 등 — FamilySajuSignals 없이 counts만 있을 때 동일 threshold로 band 재현. */
export function resolveParentBondBandFromCounts(
  counts: TenGodCounts,
): ParentBondBand {
  const profile = profileTenGods(counts);
  const sealIsolated = profile.seal === 0;
  return parentBondBand(profile.seal, profile.sealExcess, sealIsolated);
}

export function extractFamilySignals(bundle: SajuBundle): FamilySajuSignals {
  const chart = bundle.chart;
  const yearRel = collectBranchPalaceRelations(chart, "년주");

  const karmaTension = clampScore(
    yearRel.tension.length * 28 +
      yearRel.tension.filter((h) => h.counterpart_palace === "일주").length * 20,
  );

  const counts = countTenGods(bundle);
  const profile = profileTenGods(counts);
  const sealIsolated = profile.seal === 0;

  const punishmentHits = [
    ...collectBranchPalaceRelations(chart, "년주").tension.filter(
      (h) => h.type === "형",
    ),
    ...collectBranchPalaceRelations(chart, "월주").tension.filter(
      (h) => h.type === "형",
    ),
    ...collectBranchPalaceRelations(chart, "일주").tension.filter(
      (h) => h.type === "형",
    ),
  ];

  const familyConflict = clampScore(
    punishmentHits.length * 25 + yearRel.tension.length * 10,
  );

  return {
    year_karma: {
      year_branch_code: chart.yearBranchCode,
      tension_hits: yearRel.tension,
      karma_tension_index: karmaTension,
    },
    seal_parent: {
      seal_count: profile.seal,
      seal_excess: profile.sealExcess,
      seal_isolated: sealIsolated,
      parent_bond_band: parentBondBand(
        profile.seal,
        profile.sealExcess,
        sealIsolated,
      ),
    },
    home_punishment: {
      punishment_hits: punishmentHits,
      punishment_count: punishmentHits.length,
      family_conflict_index: familyConflict,
    },
  };
}
