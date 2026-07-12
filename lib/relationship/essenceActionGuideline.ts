import type {
  AdviceItem,
  EssenceActionGuideline,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

function stripSpeechPrefix(text: string): string {
  return text
    .replace(/^📱\s*/, "")
    .replace(/^이렇게\s*말해보세요[:：]?\s*/i, "")
    .replace(/^\*\s*실전\s*대사\s*꿀팁[:：]?\s*/i, "")
    .replace(/^["「]|["」]$/g, "")
    .trim();
}

/** 기획 메모식 "이런 순간에 —" 접두 제거 */
export function stripEssencePlanningMemoText(text: string): string {
  return text
    .replace(/^이런\s*순간에\s*[—\-:：]\s*/i, "")
    .replace(/이런\s*순간에\s*[—\-:：]\s*/gi, "")
    .replace(/^이런\s*상황에서\s*[—\-:：]\s*/i, "")
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
    const title = stripEssencePlanningMemoText(item.trim());
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
    const actionTitle = stripEssencePlanningMemoText(
      item.action_title?.trim() ?? "",
    );
    const sajuReason = stripEssencePlanningMemoText(
      item.saju_reason?.trim() ?? "",
    );
    const speech = stripSpeechPrefix(
      stripEssencePlanningMemoText(item.real_speech_tip?.trim() ?? ""),
    );
    if (!actionTitle && !sajuReason && !speech) return null;
    return {
      relationship_kind:
        item.relationship_kind?.trim() || defaults.relationship_kind || "연인",
      target_user: item.target_user?.trim() || defaults.target_user,
      action_title: actionTitle || "실천 팁",
      saju_reason: sajuReason,
      real_speech_tip: speech,
      real_life_example: "",
    };
  }

  const title = stripEssencePlanningMemoText(item.title?.trim() ?? "");
  const detail = stripEssencePlanningMemoText(item.detail?.trim() ?? "");
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
      normalized.saju_reason,
      normalized.real_speech_tip,
    ].join("|");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }

  return out;
}
