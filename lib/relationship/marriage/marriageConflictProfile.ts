import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { TenGodCounts } from "./marriageTenGodAnalysis";
import { profileTenGods } from "./marriageTenGodAnalysis";

/**
 * Single, shared per-person conflict evidence profile — the SSOT that both
 * marriageChapter07Intelligence.ts (the conflict-journey narrative) and
 * marriageConflict4Stage.ts (the 4-stage escalation model, "CH02" in
 * product numbering) must build their conflict persona from.
 *
 * Before this file existed, the two modules independently computed
 * "is this person direct or avoidant" from different evidence and different
 * methodologies — CH07 compared each person's weighted score AGAINST THE
 * PARTNER's (a relative, pair-specific role), while conflict4Stage checked
 * each person's own conflict_style against a fixed absolute cutoff (<45).
 * For a pair where both people's absolute conflict_style sits in the
 * 45-60 middle band (common — psych axis scores cluster near the median),
 * conflict4Stage would render BOTH people with the identical "direct"
 * template while CH07 correctly identified one of them as relatively more
 * avoidant than the other — two modules asserting incompatible personas for
 * the same person, not a real staged behavior model.
 */

export type PersonConflictProfile = {
  name: string;
  conflictStyle: number; // Psych conflict_style (0-100)
  selfControl: number; // Psych self_control (0-100)
  resilience: number; // Psych resilience (0-100)
  thinkingStyle: number; // Psych thinking_style (0-100)
  empathy: number; // Psych empathy (0-100)
  tenGods: {
    self: number; // 비겁
    food: number; // 식상
    wealth: number; // 재성
    officer: number; // 관성
    seal: number; // 인성
  };
  // Absolute (self-referential) tendency — this person's OWN conflict_style
  // against a fixed band, independent of who their partner is. Kept
  // distinct from the relative/pair role below per the "person's base
  // conflict tendency" vs "pair relative role" split.
  isDirectExpressed: boolean;
  isAvoidantExpressed: boolean;
  hasInnateExpressionDrive: boolean; // 식상 >= 2
  hasInnateInwardDrive: boolean; // 인성 >= 2
  hasInnateStructureDrive: boolean; // 관성 >= 2
  hasInnatePrideDrive: boolean; // 비겁 >= 2
};

export function buildPersonConflictProfile(
  name: string,
  psych: PsychMasterJson | null | undefined,
  counts: TenGodCounts,
): PersonConflictProfile {
  const axes = psych?.secondary_axes ?? {};
  const conflictStyle = axes.conflict_style ?? 50;
  const selfControl = axes.self_control ?? 50;
  const resilience = axes.resilience ?? 50;
  const thinkingStyle = axes.thinking_style ?? 50;
  const empathy = axes.empathy ?? 50;

  const p = profileTenGods(counts);
  const tenGods = {
    self: p.self,
    food: p.food,
    wealth: p.wealth,
    officer: p.officer,
    seal: p.seal,
  };

  return {
    name,
    conflictStyle,
    selfControl,
    resilience,
    thinkingStyle,
    empathy,
    tenGods,
    isDirectExpressed: conflictStyle >= 55,
    isAvoidantExpressed: conflictStyle < 45,
    hasInnateExpressionDrive: p.food >= 2,
    hasInnateInwardDrive: p.seal >= 2,
    hasInnateStructureDrive: p.officer >= 2,
    hasInnatePrideDrive: p.self >= 2,
  };
}

/** This pair's PAIR-RELATIVE conflict-directness score for one person. */
export function conflictDirectnessScore(profile: PersonConflictProfile): number {
  return profile.conflictStyle * 0.4 + profile.thinkingStyle * 0.3 + profile.tenGods.officer * 15 + profile.tenGods.food * 10;
}

export type ConflictDirectnessResolution = {
  scoreA: number;
  scoreB: number;
  /** Relative to THIS partner specifically — not this person's absolute tendency. */
  isADirect: boolean;
  isBDirect: boolean;
};

/**
 * Resolves each person's role RELATIVE TO THEIR PARTNER — the more
 * comparatively direct/confrontational one is "direct" here, the other is
 * relatively more avoidant, regardless of where either sits in absolute
 * terms. On an exact tie, break by name string (not by which argument
 * position/slot a person occupies) so the result is a property of the two
 * people, not of which slot either happens to be passed in.
 */
export function resolveConflictDirectness(
  profA: PersonConflictProfile,
  profB: PersonConflictProfile,
): ConflictDirectnessResolution {
  const scoreA = conflictDirectnessScore(profA);
  const scoreB = conflictDirectnessScore(profB);

  if (scoreA === scoreB) {
    const aIsDirectOnTie = profA.name <= profB.name;
    return { scoreA, scoreB, isADirect: aIsDirectOnTie, isBDirect: !aIsDirectOnTie };
  }

  const isADirect = scoreA > scoreB;
  return { scoreA, scoreB, isADirect, isBDirect: !isADirect };
}
