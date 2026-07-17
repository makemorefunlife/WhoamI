import type { RelationshipEventScores, TopicTriScore } from "@/lib/relationship/pairEventScores";
import { triScoreToGrade } from "@/lib/relationship/pairEventScores";
import type { FamilyPairSajuAnalysis } from "@/lib/saju/familyAnalysis";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import type { FamilyParentRole } from "./types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** 🔥 정서적 유대 · 🧩 성장 시너지 · ⚡ 훈육 마찰 리스크 */
export type FamilyMasterScores = {
  bond: number;
  synergy: number;
  risk: number;
};

/**
 * 기획 정량 가중치 — FamilyScoringSignals 불리언 누적 (0~100)
 * 1. 정서적 유대 — 기본 50
 * 2. 성장 시너지 — 기본 50
 * 3. 훈육 마찰 — 기본 10 (누적형)
 */
export function computeFamilyMasterScores(
  family: FamilyPairSajuAnalysis,
): FamilyMasterScores {
  const sig = family.scoringSignals;

  let bond = 50;
  if (sig.hasDayBranchCombine) bond += 30;
  if (sig.hasJohuElementSupport) bond += 20;
  if (sig.hasDayMonthTensionBond) bond -= 20;

  let synergy = 50;
  if (sig.hasParentBoostsChildTalent) synergy += 30;
  if (sig.hasTemperamentComplement) synergy += 20;
  if (sig.hasParentOvercontrol) synergy -= 20;

  let risk = 10;
  if (sig.hasDayMonthPalaceChungHyung) risk += 35;
  if (sig.hasWonjinOrGuimun) risk += 25;
  if (sig.hasParentTemperatureExtreme) risk += 15;

  if (family.parentRole === "mother") {
    if (sig.childSealStrong && sig.parentSupportsChildSeal) bond += 5;
    if (sig.childSealStrong && sig.parentSupportsChildSeal) synergy += 5;
  } else {
    if (sig.childWealthStrong && sig.parentSupportsChildWealth) bond += 5;
    if (sig.childWealthStrong && sig.parentSupportsChildWealth) synergy += 5;
  }

  return {
    bond: clamp(bond),
    synergy: clamp(synergy),
    risk: clamp(risk),
  };
}

export function computeFamilyEventScores(
  family: FamilyPairSajuAnalysis,
): RelationshipEventScores {
  const master = computeFamilyMasterScores(family);

  const intimacy: TopicTriScore = {
    activation: master.bond,
    benefit: master.bond,
    risk: clamp(100 - master.bond),
  };
  const stability: TopicTriScore = {
    activation: master.synergy,
    benefit: master.synergy,
    risk: clamp(master.risk * 0.5),
  };
  const conflict: TopicTriScore = {
    activation: clamp(100 - master.risk),
    benefit: clamp(100 - master.risk),
    risk: master.risk,
  };
  const overall: TopicTriScore = {
    activation: master.bond,
    benefit: master.synergy,
    risk: master.risk,
  };

  return { intimacy, stability, conflict, overall };
}

export function computeFamilyCompatibilityGrade(
  family: FamilyPairSajuAnalysis,
  parentRole: FamilyParentRole,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): {
  grade: "A" | "B" | "C" | "D";
  reason: string;
  eventScores: RelationshipEventScores;
  masterScores: FamilyMasterScores;
} {
  const masterScores = computeFamilyMasterScores(family);
  const eventScores = computeFamilyEventScores(family);
  const grade = triScoreToGrade(eventScores.overall);
  const roleLabel = pick(
    locale,
    parentRole === "mother" ? "Mom" : "Dad",
    parentRole === "mother" ? "엄마" : "아빠",
  );

  return {
    grade,
    reason: pick(
      locale,
      `Family (child–${roleLabel}) grade ${grade} — Emotional bond ${masterScores.bond}% · Growth synergy ${masterScores.synergy}% · Discipline friction ${masterScores.risk}%`,
      `가족(자녀-${roleLabel}) 등급 ${grade} — 정서적 유대 ${masterScores.bond}% · 성장 시너지 ${masterScores.synergy}% · 훈육 마찰 ${masterScores.risk}%`,
    ),
    eventScores,
    masterScores,
  };
}

/** @deprecated — computeFamilyMasterScores */
export type FamilyParentMasterScores = FamilyMasterScores & {
  support: number;
};

export function computeFamilyParentMasterScores(
  family: FamilyPairSajuAnalysis,
  _parentRole: FamilyParentRole,
): FamilyParentMasterScores {
  const m = computeFamilyMasterScores(family);
  return { ...m, support: m.synergy };
}

export function computeFamilyParentEventScores(
  family: FamilyPairSajuAnalysis,
  _parentRole: FamilyParentRole,
): RelationshipEventScores {
  return computeFamilyEventScores(family);
}

export function computeFamilyParentCompatibilityGrade(
  family: FamilyPairSajuAnalysis,
  parentRole: FamilyParentRole,
) {
  const result = computeFamilyCompatibilityGrade(family, parentRole);
  return {
    ...result,
    masterScores: {
      bond: result.masterScores.bond,
      support: result.masterScores.synergy,
      risk: result.masterScores.risk,
    },
  };
}

export { triScoreToGrade };
