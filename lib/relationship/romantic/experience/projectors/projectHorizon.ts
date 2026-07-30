/**
 * M10 Horizon projector — timeline from section_6 only when LLM text exists.
 * Does not invent default horizon copy or promote fortune notes to waypoints.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type {
  ConfidenceLevel,
  EvidenceRef,
  HorizonVM,
  HorizonWaypointVM,
} from "../romanticExperienceTypes";
import { emptyHorizon } from "./_empty";

export type ProjectHorizonInput = {
  report: RomanticSajuDeepReport["report"];
};

const HORIZONS = [
  { offset: 0, llmKeys: ["current"] as const },
  { offset: 1, llmKeys: ["in_1_year", "in_1_years"] as const },
  { offset: 3, llmKeys: ["in_3_years"] as const },
  { offset: 5, llmKeys: ["in_5_years", "turning_point"] as const },
  { offset: 10, llmKeys: ["in_10_years"] as const },
] as const;

function pickBlockText(block?: Record<string, string>): string {
  if (!block) return "";
  return [
    block.description,
    block.change,
    block.growth,
    block.vision,
    block.advice,
  ]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
}

function pickBlockSub(block?: Record<string, string>): string {
  if (!block) return "";
  return (
    [block.focus, block.prepare, block.goal, block.memory, block.message]
      .map((s) => s?.trim())
      .find(Boolean) ?? ""
  );
}

function extractBaseYear(
  llm: Record<string, Record<string, string>>,
  metaYear?: number,
): number {
  if (metaYear && Number.isFinite(metaYear)) return metaYear;
  for (const block of Object.values(llm)) {
    const hit = block?.period?.match(/(20\d{2})/);
    if (hit) return Number.parseInt(hit[1]!, 10);
  }
  return new Date().getFullYear();
}

function periodLabel(offset: number, year: number): string {
  if (offset === 0) return `지금 (${year}년)`;
  return `${offset}년 뒤 (${year}년)`;
}

/**
 * Availability: ≥1 waypoint with existing section_6 LLM text only.
 * Fortune notes are not promoted to waypoints (avoid generic advice chrome).
 */
export function projectHorizon(input: ProjectHorizonInput): HorizonVM {
  const base = emptyHorizon();
  const s6 = (input.report.section_6_timeline ?? {}) as Record<
    string,
    Record<string, string>
  >;
  const meta = input.report.meta as
    | {
        timeline_base_year?: number;
      }
    | undefined;

  const baseYear = extractBaseYear(s6, meta?.timeline_base_year);
  const waypoints: HorizonWaypointVM[] = [];

  for (const { offset, llmKeys } of HORIZONS) {
    let block: Record<string, string> | undefined;
    for (const key of llmKeys) {
      if (s6[key]) {
        block = s6[key];
        break;
      }
    }
    const body = pickBlockText(block);
    if (!body) continue;
    // Narrative ceiling: omit fortune-like / deterministic fate language (04 Law 6).
    if (containsFateLanguage(body)) continue;
    const period =
      trimPeriod(block?.period) || periodLabel(offset, baseYear + offset);
    const subRaw = pickBlockSub(block);
    if (subRaw && containsFateLanguage(subRaw)) {
      waypoints.push({ period, body, sub: null });
      continue;
    }
    waypoints.push({
      period,
      body,
      sub: subRaw && subRaw !== body ? subRaw : null,
    });
  }

  if (waypoints.length === 0) return base;

  const evidence: EvidenceRef[] = [
    {
      path: "section_6_timeline",
      summary: "timeline horizons",
    },
  ];

  const confidence: ConfidenceLevel =
    waypoints.length >= 3 ? "high" : "medium";

  return {
    ...base,
    title: "Relationship Horizon",
    available: true,
    confidence,
    evidence,
    waypoints,
  };
}

function trimPeriod(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function containsFateLanguage(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /운명|반드시|틀림없이|헤어질|결혼할 것|보장|정해져|will (definitely|certainly) break|destined|fated/.test(
      t,
    ) || /깨질 운명|파국이 확정/.test(text)
  );
}
