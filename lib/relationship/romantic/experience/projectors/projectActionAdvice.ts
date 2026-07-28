/**
 * Sprint 2 — Action Advice projector (legacy section_5_action, Part 5).
 * LLM-sourced per-person actionable guidance, kept as its own module so its
 * provenance is never collapsed into the deterministic Do/Don't pack
 * (mirrors the provenance-separation rule already applied in projectDoDont.ts).
 * No RomanticModuleId — additive slot, not part of the frozen M1-M10 order.
 */
import type {
  AdviceItem,
  RomanticSajuDeepReport,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { dedupeActionGuidelines } from "@/lib/relationship/essenceActionGuideline";
import { isGenericRomanticActionPhrase } from "@/lib/relationship/romanticEverydayText";
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import type {
  ActionAdviceItemVM,
  ActionAdviceVM,
  ConfidenceLevel,
  EvidenceRef,
} from "../romanticExperienceTypes";
import { emptyActionAdvice } from "./_empty";

export type ProjectActionAdviceInput = {
  report: RomanticSajuDeepReport["report"];
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
};

type ActionSection = {
  advice_for_a?: AdviceItem[];
  advice_for_b?: AdviceItem[];
  together?: string;
  together_starter?: string;
};

function trimOrNull(value: string | undefined | null): string | null {
  const t = typeof value === "string" ? value.trim() : "";
  return t ? t : null;
}

function toItems(list: AdviceItem[], targetUser: string): ActionAdviceItemVM[] {
  return dedupeActionGuidelines(list, { target_user: targetUser })
    .map((g) => ({
      title: g.action_title,
      reason: g.saju_reason,
      speechTip: g.real_speech_tip,
    }))
    .filter((item) => item.title || item.reason || item.speechTip);
}

/** Availability: ≥1 real advice item for either person, or a non-generic diary line. */
export function projectActionAdvice(input: ProjectActionAdviceInput): ActionAdviceVM {
  const base = emptyActionAdvice();
  const s5 = (input.report.section_5_action ?? {}) as ActionSection;

  const { me: myRaw, partner: partnerRaw } = pickViewerFirstPair(
    s5.advice_for_a ?? [],
    s5.advice_for_b ?? [],
    input.viewerIsReportA,
  );
  const me = toItems(myRaw, input.myName);
  const partner = toItems(partnerRaw, input.partnerName);

  let together = trimOrNull(s5.together);
  if (together && isGenericRomanticActionPhrase(together)) together = null;
  let togetherStarter = trimOrNull(s5.together_starter);
  if (togetherStarter && isGenericRomanticActionPhrase(togetherStarter)) {
    togetherStarter = null;
  }

  if (me.length === 0 && partner.length === 0 && !together) return base;

  const evidence: EvidenceRef[] = [];
  if (me.length) evidence.push({ path: "section_5_action.advice_for_a|b (viewer)", summary: "action advice" });
  if (partner.length) evidence.push({ path: "section_5_action.advice_for_a|b (partner)", summary: "action advice" });
  if (together) evidence.push({ path: "section_5_action.together", summary: "shared action" });

  let confidence: ConfidenceLevel = "low";
  if (me.length && partner.length) confidence = "high";
  else if (me.length || partner.length) confidence = "medium";

  return {
    available: true,
    confidence,
    evidence,
    me,
    partner,
    together,
    togetherStarter: together ? togetherStarter : null,
  };
}
