/**
 * M6 Special Dynamics projector (section_4_special_bond).
 * Drops relationship_formula. Uses romanticBondDisplay gates for generics.
 * Does not copy hidden mutual_gift (M2) or conflict tips into this module.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  isGenericBondParagraph,
  shouldShowWhySpecial,
} from "@/lib/relationship/romanticBondDisplay";
import { polishRomanticDisplayText } from "@/lib/relationship/romanticEverydayText";
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import {
  formatRomanticSajuFrameDirectionCanonicalLabel,
  readRomanticSajuFrameDirectionCanonicalProjection,
} from "@/lib/relationship/romantic/romanticSajuFrameDirectionCanonical";
import type {
  ConfidenceLevel,
  EvidenceRef,
  SpecialFramesNarrativeVM,
  WhySpecialGiftVM,
  WhySpecialVM,
} from "../romanticExperienceTypes";
import { emptyWhySpecial } from "./_empty";

function polishOrNull(value: string | undefined | null): string | null {
  const t = typeof value === "string" ? polishRomanticDisplayText(value).trim() : "";
  return t ? t : null;
}

/** Sprint 2 — legacy section_4_relationship_frames narrative (additive). */
function readFramesNarrative(
  report: RomanticSajuDeepReport["report"],
  myName: string,
  partnerName: string,
  viewerIsReportA: boolean,
): { narrative: SpecialFramesNarrativeVM | null; hasContent: boolean } {
  const frames = (
    report as { section_4_relationship_frames?: Record<string, unknown> }
  ).section_4_relationship_frames;
  const reassuranceRaw = frames?.reassurance_signal as
    | { a_body?: string; b_body?: string; match_note?: string }
    | undefined;
  const rolePlayRaw = frames?.unconscious_role_play as { body?: string } | undefined;

  const { me: myReassurance, partner: partnerReassurance } = pickViewerFirstPair(
    polishOrNull(reassuranceRaw?.a_body),
    polishOrNull(reassuranceRaw?.b_body),
    viewerIsReportA,
  );
  const matchNote = polishOrNull(reassuranceRaw?.match_note);

  const reassuranceLines = [
    myReassurance ? `${myName}: ${myReassurance}` : null,
    partnerReassurance ? `${partnerName}: ${partnerReassurance}` : null,
    matchNote,
  ].filter((line): line is string => Boolean(line));
  const reassurance = reassuranceLines.length ? reassuranceLines.join(" ") : null;

  const rolePlay = polishOrNull(rolePlayRaw?.body);

  if (!reassurance && !rolePlay) return { narrative: null, hasContent: false };
  return { narrative: { reassurance, rolePlay }, hasContent: true };
}

export type ProjectWhatsSpecialInput = {
  report: RomanticSajuDeepReport["report"];
  myName: string;
  partnerName: string;
  nameA: string;
  nameB: string;
  viewerIsReportA: boolean;
  locale?: string;
};

function trimOrNull(value: string | undefined | null): string | null {
  const t = typeof value === "string" ? value.trim() : "";
  return t ? t : null;
}

function giftOrNull(
  from: string,
  to: string,
  headline: string | undefined | null,
  body: string | undefined | null,
): WhySpecialGiftVM | null {
  const b = trimOrNull(body);
  if (!b || isGenericBondParagraph(b)) return null;
  return {
    from,
    to,
    headline: trimOrNull(headline),
    body: b,
  };
}

/**
 * Availability: at least one gift, only_together, or gated why_special.
 * Formula never contributes.
 */
export function projectWhatsSpecial(
  input: ProjectWhatsSpecialInput,
): WhySpecialVM {
  const base = emptyWhySpecial();
  const special = input.report.section_4_special_bond;
  if (!special) return base;

  // Explicitly ignore formula (do not project).
  void special.relationship_formula;

  const aGives = giftOrNull(
    input.nameA,
    input.nameB,
    special.a_gives_b_headline,
    special.a_gives_b,
  );
  const bGives = giftOrNull(
    input.nameB,
    input.nameA,
    special.b_gives_a_headline,
    special.b_gives_a,
  );

  const gifts: WhySpecialGiftVM[] = [];
  if (input.viewerIsReportA) {
    if (aGives) {
      gifts.push({
        ...aGives,
        from: input.myName,
        to: input.partnerName,
      });
    }
    if (bGives) {
      gifts.push({
        ...bGives,
        from: input.partnerName,
        to: input.myName,
      });
    }
  } else {
    if (bGives) {
      gifts.push({
        ...bGives,
        from: input.myName,
        to: input.partnerName,
      });
    }
    if (aGives) {
      gifts.push({
        ...aGives,
        from: input.partnerName,
        to: input.myName,
      });
    }
  }

  let onlyTogether = trimOrNull(special.only_together);
  if (onlyTogether && isGenericBondParagraph(onlyTogether)) {
    onlyTogether = null;
  }

  const whyOk = shouldShowWhySpecial(special.why_special, {
    onlyTogether: special.only_together,
    aGivesB: special.a_gives_b,
    bGivesA: special.b_gives_a,
  });
  const whySpecial = whyOk ? trimOrNull(special.why_special) : null;

  const frame = readRomanticSajuFrameDirectionCanonicalProjection(input.report);
  const frameDirectionLabel = frame
    ? formatRomanticSajuFrameDirectionCanonicalLabel(frame, {
        nameA: input.nameA,
        nameB: input.nameB,
        locale: input.locale,
      })
    : null;

  const frames = readFramesNarrative(
    input.report,
    input.myName,
    input.partnerName,
    input.viewerIsReportA,
  );

  if (
    gifts.length === 0 &&
    !onlyTogether &&
    !whySpecial &&
    !frameDirectionLabel &&
    !frames.hasContent
  ) {
    return base;
  }

  const evidence: EvidenceRef[] = [];
  if (frames.hasContent) {
    evidence.push({
      path: "section_4_relationship_frames",
      summary: "reassurance/role-play narrative",
    });
  }
  if (gifts.length) {
    evidence.push({
      path: "section_4_special_bond.a_gives_b|b_gives_a",
      summary: "activation gifts",
    });
  }
  if (onlyTogether) {
    evidence.push({
      path: "section_4_special_bond.only_together",
      summary: "only together",
    });
  }
  if (whySpecial) {
    evidence.push({
      path: "section_4_special_bond.why_special",
      summary: "why special",
    });
  }
  if (frameDirectionLabel) {
    evidence.push({
      path: "canonical_projections.saju_frame_direction",
      summary: "frame direction",
    });
  }

  let confidence: ConfidenceLevel = "low";
  if (gifts.length >= 2 && (onlyTogether || whySpecial)) confidence = "high";
  else if (gifts.length || onlyTogether || whySpecial) confidence = "medium";
  else confidence = "tentative";

  return {
    ...base,
    title: "Special Dynamics",
    available: true,
    confidence,
    evidence,
    gifts,
    onlyTogether,
    whySpecial,
    frameDirectionLabel,
    framesNarrative: frames.narrative,
  };
}
