/**
 * Deep Read — shared normalized view-model for surfacing the existing
 * LLM narrative overlays (meta.friend_saju_deep / business_saju_deep /
 * married_saju_deep / family_saju_deep) in the premium report UI.
 *
 * These overlays share one shape across all four domains
 * (section_2_nature.{a_nature,b_nature}, section_4_*_frames.<signal>,
 * section_5_action) — see lib/prompts/relationshipPremium/*SajuDeep/outputSchema.ts.
 * Family additionally carries parent_nature/child_nature and
 * advice_for_parent/advice_for_child, with no viewer-swap (fixed order).
 *
 * This file owns zero domain vocabulary — callers pass in the already-picked
 * raw fields, and `swap` decides display order. Fail-closed: returns null
 * when the overlay has no usable content, so the section builder omits the
 * card entirely rather than rendering an empty shell.
 */

export type DeepReadAdviceTip = {
  actionTitle: string;
  reason: string;
  speechTip: string;
};

export type DeepReadPersonVoice = {
  voice?: string;
  description?: string;
};

export type DeepReadGapSignal = {
  meBody?: string;
  partnerBody?: string;
  matchNote?: string;
};

export type DeepReadViewModel = {
  meNature?: DeepReadPersonVoice;
  partnerNature?: DeepReadPersonVoice;
  gapSignal?: DeepReadGapSignal;
  adviceForMe: DeepReadAdviceTip[];
  adviceForPartner: DeepReadAdviceTip[];
  together?: string;
  togetherStarter?: string;
};

type RawNature = { first_person_voice?: string; description?: string } | null | undefined;
type RawAdviceTip =
  | { action_title?: string; saju_reason?: string; real_speech_tip?: string }
  | null
  | undefined;
type RawGapSignal =
  | { a_body?: string; b_body?: string; match_note?: string }
  | null
  | undefined;

function toVoice(raw: RawNature): DeepReadPersonVoice | undefined {
  const voice = raw?.first_person_voice?.trim();
  const description = raw?.description?.trim();
  if (!voice && !description) return undefined;
  return { voice: voice || undefined, description: description || undefined };
}

function toAdviceList(raw: RawAdviceTip[] | null | undefined): DeepReadAdviceTip[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((tip) => ({
      actionTitle: tip?.action_title?.trim() ?? "",
      reason: tip?.saju_reason?.trim() ?? "",
      speechTip: tip?.real_speech_tip?.trim() ?? "",
    }))
    .filter((tip) => tip.actionTitle || tip.reason);
}

export function buildDeepReadViewModel(params: {
  natureA?: RawNature;
  natureB?: RawNature;
  gapSignal?: RawGapSignal;
  adviceA?: RawAdviceTip[] | null;
  adviceB?: RawAdviceTip[] | null;
  together?: string | null;
  togetherStarter?: string | null;
  /** true → B renders in the "me" slot (viewer is B); false/omitted → A is "me". */
  swap?: boolean;
}): DeepReadViewModel | null {
  const swap = params.swap === true;

  const meNature = toVoice(swap ? params.natureB : params.natureA);
  const partnerNature = toVoice(swap ? params.natureA : params.natureB);

  const gapRaw = params.gapSignal;
  const meBody = (swap ? gapRaw?.b_body : gapRaw?.a_body)?.trim();
  const partnerBody = (swap ? gapRaw?.a_body : gapRaw?.b_body)?.trim();
  const matchNote = gapRaw?.match_note?.trim();
  const gapSignal =
    meBody || partnerBody || matchNote
      ? {
          meBody: meBody || undefined,
          partnerBody: partnerBody || undefined,
          matchNote: matchNote || undefined,
        }
      : undefined;

  const adviceForMe = toAdviceList(swap ? params.adviceB : params.adviceA);
  const adviceForPartner = toAdviceList(swap ? params.adviceA : params.adviceB);

  const together = params.together?.trim() || undefined;
  const togetherStarter = params.togetherStarter?.trim() || undefined;

  const hasContent =
    Boolean(meNature) ||
    Boolean(partnerNature) ||
    Boolean(gapSignal) ||
    adviceForMe.length > 0 ||
    adviceForPartner.length > 0 ||
    Boolean(together);

  if (!hasContent) return null;

  return {
    meNature,
    partnerNature,
    gapSignal,
    adviceForMe,
    adviceForPartner,
    together,
    togetherStarter,
  };
}
