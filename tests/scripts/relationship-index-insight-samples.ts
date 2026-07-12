import {
  detectRelationshipIndexPattern,
  pickRelationshipIndexInsight,
} from "../../lib/relationship/relationshipIndexInsight";

const SAMPLES: Array<[string, number, number, number]> = [
  ["75/63/65", 75, 63, 65],
  ["90/88/20", 90, 88, 20],
  ["50/50/50", 50, 50, 50],
  ["85/55/60", 85, 55, 60],
  ["60/85/55", 60, 85, 55],
  ["70/65/95", 70, 65, 95],
  ["92/90/88", 92, 90, 88],
  ["40/38/82", 40, 38, 82],
];

for (const [label, affection, chemistry, sensitivity] of SAMPLES) {
  const scores = { affection, chemistry, sensitivity };
  const pattern = detectRelationshipIndexPattern(scores);
  const insight = pickRelationshipIndexInsight(scores);
  console.log(`\n[${label}] pattern=${pattern} spread=${insight.spread}`);
  console.log(`→ ${insight.line}`);
}
