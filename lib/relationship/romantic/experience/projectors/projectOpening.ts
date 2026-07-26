/**
 * M1 Opening Scene projector.
 * Passes through existing opening headline/body only — never grade or scores.
 */
import {
  buildRomanticScreenPlanFromStored,
  getScreen1Opening,
  type RomanticScreenSlot,
  type StoredRankedInsight,
} from "@/lib/relationship/romanticHeadline";
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type {
  ConfidenceLevel,
  EvidenceRef,
  OpeningSceneVM,
} from "../romanticExperienceTypes";
import { emptyOpeningScene } from "./_empty";

export type ProjectOpeningInput = {
  report: RomanticSajuDeepReport["report"];
  myName: string;
  partnerName: string;
};

function resolveScreenPlan(
  report: RomanticSajuDeepReport["report"],
): RomanticScreenSlot[] | null {
  const meta = report.meta as
    | {
        screen_plan?: RomanticScreenSlot[];
        ranked_insights?: StoredRankedInsight[];
      }
    | undefined;
  if (meta?.screen_plan?.length) return meta.screen_plan;
  return buildRomanticScreenPlanFromStored({
    ranked_insights: meta?.ranked_insights,
    section1: report.section_1_summary,
  });
}

function trimOrNull(value: string | undefined | null): string | null {
  const t = typeof value === "string" ? value.trim() : "";
  return t ? t : null;
}

/**
 * Availability: signature (headline) or paradox (body) non-empty.
 * Grade is read only to discard — never copied onto VM.
 */
export function projectOpening(input: ProjectOpeningInput): OpeningSceneVM {
  const base = emptyOpeningScene({
    myName: input.myName,
    partnerName: input.partnerName,
  });
  const s1 = input.report.section_1_summary ?? {
    relationship_name: "",
    one_line_summary: "",
    grade: "",
  };
  const plan = resolveScreenPlan(input.report);
  const opening = getScreen1Opening(plan, s1);
  // Discard grade intentionally (do not assign).
  void opening.grade;

  const signature = trimOrNull(opening.headline);
  const paradox = trimOrNull(opening.body);
  if (!signature && !paradox) return base;

  const evidence: EvidenceRef[] = [];
  if (signature) {
    evidence.push({
      path: plan?.length
        ? "meta.screen_plan[opening].headline"
        : "section_1_summary.relationship_name",
      summary: "opening signature",
    });
  }
  if (paradox) {
    evidence.push({
      path: plan?.length
        ? "meta.screen_plan[opening].body"
        : "section_1_summary.one_line_summary",
      summary: "opening paradox / one-line",
    });
  }

  const confidence: ConfidenceLevel = plan?.length ? "high" : "medium";

  return {
    ...base,
    title: "Opening Scene",
    available: true,
    confidence,
    evidence,
    signature,
    paradox,
    invitation: null,
    dayStemLine: null,
  };
}
