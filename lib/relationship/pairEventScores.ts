import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import {
  crossHitPalaceWeight,
  weightedCrossPriority,
} from "@/lib/saju/palaceWeight";

const POSITIVE_CROSS = new Set(["육합", "천간합", "삼합", "방합"]);
const TENSION_CROSS = new Set(["충", "형", "해", "파"]);

export type TopicTriScore = {
  activation: number;
  benefit: number;
  risk: number;
};

export type RelationshipEventScores = {
  intimacy: TopicTriScore;
  conflict: TopicTriScore;
  stability: TopicTriScore;
  overall: TopicTriScore;
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function avgTri(...scores: TopicTriScore[]): TopicTriScore {
  const n = scores.length || 1;
  return {
    activation: clamp(
      scores.reduce((s, t) => s + t.activation, 0) / n,
    ),
    benefit: clamp(scores.reduce((s, t) => s + t.benefit, 0) / n),
    risk: clamp(scores.reduce((s, t) => s + t.risk, 0) / n),
  };
}

/**
 * 명리 규칙 기반 3점수 — activation / benefit / risk (연인 주제별)
 */
export function computeRelationshipEventScores(
  pair: PairSajuAnalysis,
  opts?: { hasStrengthComplement?: boolean },
): RelationshipEventScores {
  let posWeight = 0;
  let tensionWeight = 0;
  let dayTension = 0;

  for (const hit of pair.allCrossHits) {
    const w = weightedCrossPriority(hit) / 100;
    if (POSITIVE_CROSS.has(hit.type)) posWeight += w;
    if (TENSION_CROSS.has(hit.type)) {
      tensionWeight += w;
      if (
        hit.personA_pillar.startsWith("일주") ||
        hit.personB_pillar.startsWith("일주")
      ) {
        dayTension += w * crossHitPalaceWeight(hit);
      }
    }
  }

  const stemSupport = pair.dayStemInteraction.includes("상생");
  const stemClash = pair.dayStemInteraction.includes("상극");
  const elementWeak = pair.combinedElementNote.includes("약한 기운");

  const intimacy: TopicTriScore = {
    activation: clamp(
      42 + posWeight * 12 + (stemSupport ? 18 : 0) + (opts?.hasStrengthComplement ? 8 : 0),
    ),
    benefit: clamp(
      38 + posWeight * 14 + (stemSupport ? 22 : 5) + (opts?.hasStrengthComplement ? 10 : 0),
    ),
    risk: clamp(28 + tensionWeight * 8 + dayTension * 10 + (stemClash ? 12 : 0)),
  };

  const conflict: TopicTriScore = {
    activation: clamp(35 + tensionWeight * 16 + dayTension * 14 + (stemClash ? 15 : 0)),
    benefit: clamp(25 + (stemClash ? 12 : 0) + tensionWeight * 4),
    risk: clamp(40 + tensionWeight * 18 + dayTension * 16 + (stemClash ? 14 : 0)),
  };

  const stability: TopicTriScore = {
    activation: clamp(45 + posWeight * 8 + (stemSupport ? 10 : 0)),
    benefit: clamp(
      40 + posWeight * 12 + (stemSupport ? 20 : 0) - tensionWeight * 6,
    ),
    risk: clamp(
      32 + tensionWeight * 14 + dayTension * 12 + (elementWeak ? 10 : 0),
    ),
  };

  const overall = avgTri(intimacy, conflict, stability);

  return { intimacy, conflict, stability, overall };
}

export function triScoreToGrade(overall: TopicTriScore): "A" | "B" | "C" | "D" {
  const score =
    overall.benefit * 0.45 +
    overall.activation * 0.25 -
    overall.risk * 0.3;
  if (score >= 62) return "A";
  if (score >= 48) return "B";
  if (score >= 34) return "C";
  return "D";
}

export function formatEventScoresReason(
  scores: RelationshipEventScores,
  grade: string,
): string {
  const { overall, intimacy, conflict } = scores;
  return (
    `궁합 등급 ${grade} — 끌림 ${overall.activation} · 시너지 ${overall.benefit} · 긴장 ${overall.risk} ` +
    `(친밀 ${intimacy.activation}/${intimacy.risk} · 갈등 ${conflict.activation}/${conflict.risk})`
  );
}
