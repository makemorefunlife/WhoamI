import type { RelationshipEventScores, TopicTriScore } from "@/lib/relationship/pairEventScores";
import { triScoreToGrade } from "@/lib/relationship/pairEventScores";
import type { TenGodComplementResult } from "@/lib/relationship/workColleague/tenGodComplement";
import type { WorkPairSajuAnalysis } from "@/lib/saju/workPairAnalysis";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export type WorkMasterScores = {
  activation: number;
  benefit: number;
  risk: number;
};

/**
 * 끝판왕 기획안 정량 가중치 — workPairAnalysis.scoringSignals + tenGodComplement
 */
export function computeWorkMasterScores(
  work: WorkPairSajuAnalysis,
  complement: TenGodComplementResult,
): WorkMasterScores {
  const sig = work.scoringSignals;

  let activation = 50;
  if (sig.hasStemCombine) activation += 25;
  if (sig.hasElementMutualComplement) activation += 20;
  if (sig.hasStemClashOrOvercome) activation -= 15;

  let benefit = 50;
  if (sig.hasMonthDirectCombine) benefit += 25;
  if (complement.items.length > 0) benefit += 20;
  if (sig.hasMonthElementFlow) benefit += 15;
  if (sig.hasMonthClashOrPunish) benefit -= 20;

  let risk = 10;
  if (sig.hasMonthDirectChung) risk += 35;
  if (sig.hasWonjinOrGuimun) risk += 25;
  if (sig.hasHaPaHae) risk += 15;
  if (sig.hasGongmangHit) risk += 10;

  return {
    activation: clamp(activation),
    benefit: clamp(benefit),
    risk: clamp(risk),
  };
}

function topicFromMaster(
  master: WorkMasterScores,
  topic: "fit" | "synergy" | "risk",
): TopicTriScore {
  if (topic === "fit") {
    return {
      activation: master.activation,
      benefit: clamp(master.benefit * 0.4 + master.activation * 0.3),
      risk: clamp(master.risk * 0.5),
    };
  }
  if (topic === "synergy") {
    return {
      activation: clamp(master.activation * 0.5 + master.benefit * 0.3),
      benefit: master.benefit,
      risk: clamp(master.risk * 0.6),
    };
  }
  return {
    activation: clamp(master.activation * 0.4),
    benefit: clamp(master.benefit * 0.35),
    risk: master.risk,
  };
}

export function computeWorkEventScores(
  work: WorkPairSajuAnalysis,
  complement: TenGodComplementResult,
): RelationshipEventScores {
  const master = computeWorkMasterScores(work, complement);
  const overall: TopicTriScore = {
    activation: master.activation,
    benefit: master.benefit,
    risk: master.risk,
  };

  return {
    intimacy: topicFromMaster(master, "fit"),
    stability: topicFromMaster(master, "synergy"),
    conflict: topicFromMaster(master, "risk"),
    overall,
  };
}

export function computeWorkCompatibilityGrade(
  work: WorkPairSajuAnalysis,
  complement: TenGodComplementResult,
): {
  grade: "A" | "B" | "C" | "D";
  reason: string;
  eventScores: RelationshipEventScores;
  masterScores: WorkMasterScores;
} {
  const eventScores = computeWorkEventScores(work, complement);
  const masterScores = computeWorkMasterScores(work, complement);
  const grade = triScoreToGrade(eventScores.overall);

  const reason =
    `파트너십 등급 ${grade} — 업무적 핏 ${masterScores.activation}% · 협업 시너지 ${masterScores.benefit}% · 오피스 리스크 ${masterScores.risk}%`;

  return { grade, reason, eventScores, masterScores };
}

export { triScoreToGrade };
