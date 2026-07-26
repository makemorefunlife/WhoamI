/**
 * M9 Repair Guide projector — thin wrapper around composeRepairGuide.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { composeRepairGuide } from "../composers/composeRepairGuide";
import type { RepairGuideVM } from "../romanticExperienceTypes";

export type ProjectRepairGuideInput = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
  locale?: string;
  preventiveTexts?: string[];
};

export function projectRepairGuide(
  input: ProjectRepairGuideInput,
): RepairGuideVM {
  return composeRepairGuide(input);
}
