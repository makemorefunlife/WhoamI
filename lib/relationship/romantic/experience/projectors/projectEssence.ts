/**
 * Sprint 2 — Essence projector (legacy section_2_nature, Part 2).
 * Restores the richest legacy per-person narrative (image metaphor + best
 * single paragraph synthesized from description, first_person_voice,
 * meeting hint, and together_change) into the V2 contract. Mirrors legacy's
 * pickBestNatureParagraph selection logic exactly; adds no new analysis.
 * No RomanticModuleId — additive slot, not part of the frozen M1-M10 order.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { polishRomanticDisplayText } from "@/lib/relationship/romanticEverydayText";
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import type {
  ConfidenceLevel,
  EssencePersonVM,
  EssenceVM,
  EvidenceRef,
} from "../romanticExperienceTypes";
import { emptyEssence } from "./_empty";

export type ProjectEssenceInput = {
  report: RomanticSajuDeepReport["report"];
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
};

type NatureBlock = {
  image_metaphor?: string;
  first_person_voice?: string;
  description?: string;
  meeting_a?: string;
  meeting_b?: string;
  together_change?: string;
};

function trimOrNull(value: string | undefined | null): string | null {
  const t = typeof value === "string" ? value.trim() : "";
  return t ? t : null;
}

/** Same selection as legacy pickBestNatureParagraph: longest unique candidate. */
function pickBestParagraph(nature: NatureBlock, meetingHint?: string): string | null {
  const candidates = [nature.description, nature.first_person_voice, meetingHint, nature.together_change]
    .map((c) => (c ? polishRomanticDisplayText(String(c)) : ""))
    .filter((c) => c.length >= 12);
  if (candidates.length === 0) return null;

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const c of candidates) {
    const key = c.slice(0, 48);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }
  return unique.sort((a, b) => b.length - a.length)[0] ?? null;
}

function personFromBlock(name: string, nature: NatureBlock, meetingHint?: string): EssencePersonVM | null {
  const narrative = pickBestParagraph(nature, meetingHint);
  const imageMetaphor = trimOrNull(nature.image_metaphor);
  if (!narrative && !imageMetaphor) return null;
  return { name, imageMetaphor, narrative };
}

/** Availability: at least one person has a metaphor or synthesized narrative. */
export function projectEssence(input: ProjectEssenceInput): EssenceVM {
  const base = emptyEssence();
  const s2 = input.report.section_2_nature;
  if (!s2) return base;

  const { me: myBlockRaw, partner: partnerBlockRaw } = pickViewerFirstPair(
    (s2.a_nature ?? {}) as NatureBlock,
    (s2.b_nature ?? {}) as NatureBlock,
    input.viewerIsReportA,
  );
  // Skip ASCII-only fixture stubs (e.g. "meets B") so they never surface as Korean narrative.
  const usableHint = (hint?: string): string | undefined => {
    const t = typeof hint === "string" ? hint.trim() : "";
    if (!t || t.length < 12) return undefined;
    if (/^[\x00-\x7F]+$/.test(t)) return undefined;
    return t;
  };
  const myMeetingHint = usableHint(
    input.viewerIsReportA ? myBlockRaw.meeting_b : myBlockRaw.meeting_a,
  );
  const partnerMeetingHint = usableHint(
    input.viewerIsReportA ? partnerBlockRaw.meeting_a : partnerBlockRaw.meeting_b,
  );

  const me = personFromBlock(input.myName, myBlockRaw, myMeetingHint);
  const partner = personFromBlock(input.partnerName, partnerBlockRaw, partnerMeetingHint);
  if (!me && !partner) return base;

  const evidence: EvidenceRef[] = [];
  if (me) evidence.push({ path: "section_2_nature (viewer)", summary: "essence narrative" });
  if (partner) evidence.push({ path: "section_2_nature (partner)", summary: "essence narrative" });

  let confidence: ConfidenceLevel = "low";
  if (me && partner) confidence = "high";
  else if (me || partner) confidence = "medium";

  return {
    available: true,
    confidence,
    evidence,
    me,
    partner,
  };
}
