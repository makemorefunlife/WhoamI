/**
 * M5 Hidden Heart projector (section_4_hidden_hearts).
 * Does not pull reassurance frames / special_bond (owned by M3 / deferred M5).
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type {
  ConfidenceLevel,
  EvidenceRef,
  HiddenHeartPersonVM,
  HiddenHeartVM,
} from "../romanticExperienceTypes";
import { emptyHiddenHeart } from "./_empty";

export type ProjectHiddenDynamicInput = {
  report: RomanticSajuDeepReport["report"];
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
};

type HiddenBlock = {
  need?: string;
  reason?: string;
  voice?: string;
};

function trimOrNull(value: string | undefined | null): string | null {
  const t = typeof value === "string" ? value.trim() : "";
  return t ? t : null;
}

function asHiddenBlock(raw: unknown): HiddenBlock {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    need: typeof o.need === "string" ? o.need : undefined,
    reason: typeof o.reason === "string" ? o.reason : undefined,
    voice: typeof o.voice === "string" ? o.voice : undefined,
  };
}

function personFromBlock(
  name: string,
  block: HiddenBlock,
): HiddenHeartPersonVM | null {
  const need = trimOrNull(block.need);
  const reason = trimOrNull(block.reason);
  const voice = trimOrNull(block.voice);
  if (!need && !reason && !voice) return null;
  return { name, need, reason, voice };
}

/**
 * Availability: at least one person block or mutual_gift with content.
 */
export function projectHiddenDynamic(
  input: ProjectHiddenDynamicInput,
): HiddenHeartVM {
  const base = emptyHiddenHeart();
  const raw = (input.report.section_4_hidden_hearts ?? {}) as Record<
    string,
    unknown
  >;
  const a = asHiddenBlock(raw.a_hidden);
  const b = asHiddenBlock(raw.b_hidden);
  const mutualGift = trimOrNull(
    typeof raw.mutual_gift === "string" ? raw.mutual_gift : null,
  );

  const me = personFromBlock(
    input.myName,
    input.viewerIsReportA ? a : b,
  );
  const partner = personFromBlock(
    input.partnerName,
    input.viewerIsReportA ? b : a,
  );

  if (!me && !partner && !mutualGift) return base;

  const evidence: EvidenceRef[] = [];
  if (me) {
    evidence.push({
      path: input.viewerIsReportA
        ? "section_4_hidden_hearts.a_hidden"
        : "section_4_hidden_hearts.b_hidden",
      summary: "viewer hidden heart",
    });
  }
  if (partner) {
    evidence.push({
      path: input.viewerIsReportA
        ? "section_4_hidden_hearts.b_hidden"
        : "section_4_hidden_hearts.a_hidden",
      summary: "partner hidden heart",
    });
  }
  if (mutualGift) {
    evidence.push({
      path: "section_4_hidden_hearts.mutual_gift",
      summary: "mutual gift",
    });
  }

  let confidence: ConfidenceLevel = "low";
  if (me && partner) confidence = "high";
  else if (me || partner) confidence = "medium";
  else confidence = "tentative";

  return {
    ...base,
    title: "Hidden Heart",
    available: true,
    confidence,
    evidence,
    me,
    partner,
    mutualGift,
  };
}
