import type {
  AdviceItem,
  EssenceActionGuideline,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

function stripSpeechPrefix(text: string): string {
  return text
    .replace(/^📱\s*/, "")
    .replace(/^이렇게\s*말해보세요[:：]?\s*/i, "")
    .replace(/^["「]|["」]$/g, "")
    .trim();
}

export function isEssenceActionGuideline(
  item: unknown,
): item is EssenceActionGuideline {
  return (
    typeof item === "object" &&
    item !== null &&
    ("action_title" in item || "saju_reason" in item || "real_speech_tip" in item)
  );
}

export function normalizeActionGuideline(
  item: AdviceItem,
  defaults: { target_user: string; relationship_kind?: string },
): EssenceActionGuideline | null {
  if (typeof item === "string") {
    const title = item.trim();
    if (!title) return null;
    return {
      relationship_kind: defaults.relationship_kind ?? "연인",
      target_user: defaults.target_user,
      action_title: title,
      saju_reason: "",
      real_speech_tip: "",
      real_life_example: "",
    };
  }

  if (isEssenceActionGuideline(item)) {
    const actionTitle = item.action_title?.trim() ?? "";
    const sajuReason = item.saju_reason?.trim() ?? "";
    const speech = stripSpeechPrefix(item.real_speech_tip?.trim() ?? "");
    const example = item.real_life_example?.trim() ?? "";
    if (!actionTitle && !sajuReason && !speech && !example) return null;
    return {
      relationship_kind:
        item.relationship_kind?.trim() || defaults.relationship_kind || "연인",
      target_user: item.target_user?.trim() || defaults.target_user,
      action_title: actionTitle || "실천 팁",
      saju_reason: sajuReason,
      real_speech_tip: speech,
      real_life_example: example,
    };
  }

  const title = item.title?.trim() ?? "";
  const detail = item.detail?.trim() ?? "";
  const phrase = stripSpeechPrefix(item.phrase_example?.trim() ?? "");
  if (!title && !detail && !phrase) return null;

  return {
    relationship_kind: defaults.relationship_kind ?? "연인",
    target_user: defaults.target_user,
    action_title: title || "실천 팁",
    saju_reason: detail,
    real_speech_tip: phrase,
    real_life_example: "",
  };
}

export function dedupeActionGuidelines(
  items: AdviceItem[],
  defaults: { target_user: string; relationship_kind?: string },
): EssenceActionGuideline[] {
  const seen = new Set<string>();
  const out: EssenceActionGuideline[] = [];

  for (const item of items) {
    const normalized = normalizeActionGuideline(item, defaults);
    if (!normalized) continue;
    const key = [
      normalized.action_title,
      normalized.real_speech_tip,
      normalized.real_life_example,
    ].join("|");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }

  return out;
}
