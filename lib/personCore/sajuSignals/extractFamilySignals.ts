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
    // 일주(day pillar)는 일간 자기비교라 정의상 항상 비견(self)이 됨 — 제외.
    if (t.pillar === "일주") continue;
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

// 2026-07-21 수정: seal_count는 3개 비일주 기둥에서만 뽑혀 0~3 범위로 매우
// 좁다(합성 스윕 N=400 기준 seal=0 49%, seal=1 37.5%, seal=2 11%, seal=3+ 2.5%).
// 기존 threshold(>=2 balanced)는 seal=1(전체의 37.5%)을 seal=0(고립)과 똑같이
// "distant"로 묶어버려서, 무관한 두 사람이 부모-자녀 비교표에서 "distant"로
// 겹칠 확률이 76%에 달했다(0.865² + 0.11² + 0.025² ≈ 76%) — 이게 "표가 항상
// 똑같이 나온다"는 사용자 리포트의 근본 원인이었다. seal=1은 "완전 고립"과
// 다르므로 balanced 경계를 1로 낮춰 분포를 distant 49% / balanced 48.5% /
// smothering 2.5%로 재배분한다.
function parentBondBand(
  sealCount: number,
  sealExcess: boolean,
  sealIsolated: boolean,
): ParentBondBand {
  if (sealIsolated) return "distant";
  if (sealExcess) return "smothering";
  if (sealCount >= 1) return "balanced";
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

/**
 * PersonCore family_signals가 없을 때 pair 밴드 재구성용 최소 합성.
 * seal/bond는 counts SSOT와 동일. 형·년긴장(home_climate)은 chart 없으므로 0 —
 * 가짜 medium pair fallback 대신 실제 bond/seal 교차로 umbilical·nagging을 계산하게 함.
 */
export function synthesizeFamilySignalsFromCounts(
  counts: TenGodCounts,
): FamilySajuSignals {
  const profile = profileTenGods(counts);
  const sealIsolated = profile.seal === 0;
  return {
    year_karma: {
      year_branch_code: "",
      tension_hits: [],
      karma_tension_index: 0,
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
      punishment_hits: [],
      punishment_count: 0,
      family_conflict_index: 0,
    },
  };
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
