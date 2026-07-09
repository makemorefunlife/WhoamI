import { PRIMARY_AXIS_DEFINITIONS } from "@/lib/v2/framework/primaryAxisDefinitions";
import type { PrimaryAxisKey } from "@/lib/v2/survey/types";

type ScoreBand = "high" | "mid" | "low";

function scoreBand(score: number): ScoreBand {
  if (score >= 65) return "high";
  if (score <= 40) return "low";
  return "mid";
}

const SHORT_INTERPRETATIONS: Record<
  PrimaryAxisKey,
  Record<ScoreBand, string>
> = {
  autonomy: {
    high: "You tend to trust your own judgment and prefer steering your path from the inside out.",
    mid: "You balance self-direction with input from others depending on the situation.",
    low: "You may feel more comfortable when plans and expectations are shared or clarified with others.",
  },
  connection: {
    high: "Emotional closeness and meaningful relationships are likely a strong motivator in how you live and decide.",
    mid: "You value connection, but you also leave room for independence and personal space.",
    low: "You may prioritize clarity, goals, or inner direction over emotional closeness in daily choices.",
  },
  stability: {
    high: "Security, consistency, and predictability probably help you feel grounded and effective.",
    mid: "You appreciate stability without needing everything to stay fixed.",
    low: "You may tolerate — or even welcome — more change and open-ended situations than most.",
  },
  growth: {
    high: "You are naturally drawn to learning, improvement, and new possibilities.",
    mid: "You seek growth in focused seasons rather than pushing for change all the time.",
    low: "You may prefer deepening what already works over constantly expanding into the new.",
  },
  structure: {
    high: "Clear plans, routines, and order likely help you feel more grounded and in control.",
    mid: "You use structure when it helps, without needing every detail locked in advance.",
    low: "Rigid plans may feel constraining; you may work better with flexible frameworks.",
  },
  adaptability: {
    high: "You adjust your thinking and behavior relatively easily when situations shift.",
    mid: "You can adapt when needed, though you still prefer some continuity.",
    low: "Sudden changes may cost you more energy; you may need time to recalibrate.",
  },
};

export function buildAxisShortInterpretation(
  key: PrimaryAxisKey,
  score: number,
): string {
  const band = scoreBand(score);
  const label = PRIMARY_AXIS_DEFINITIONS[key].label;
  const body = SHORT_INTERPRETATIONS[key][band];
  return `Your ${label} score is ${score}. ${body}`;
}

export function buildOverallAxisSummary(
  axes: Record<PrimaryAxisKey, number>,
  order: readonly PrimaryAxisKey[],
): string {
  const ranked = order
    .map((key) => ({ key, score: axes[key] }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0];
  const second = ranked[1];
  const edge = ranked[ranked.length - 1];

  if (!top) return "";

  const topLabel = PRIMARY_AXIS_DEFINITIONS[top.key].label;
  const secondLabel = second
    ? PRIMARY_AXIS_DEFINITIONS[second.key].label
    : null;
  const edgeLabel = edge
    ? PRIMARY_AXIS_DEFINITIONS[edge.key].label
    : null;

  const lead = secondLabel
    ? `Your profile leans toward ${topLabel} and ${secondLabel}.`
    : `Your profile leans toward ${topLabel}.`;

  const edgeNote = edgeLabel
    ? ` Paying attention to ${edgeLabel} may help you feel more balanced over time.`
    : "";

  return `${lead}${edgeNote}`;
}
