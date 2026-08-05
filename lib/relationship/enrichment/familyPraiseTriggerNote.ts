/**
 * Family research gap: praise / recognition trigger.
 * Folds into child_dna — does not add a new section.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

export function buildFamilyPraiseTriggerNote(params: {
  childNickname: string;
  parentNickname: string;
  psychChild?: PsychMasterJson | null;
  locale?: Locale;
}): string | null {
  const locale = params.locale ?? "ko-KR";
  const en = locale === "en-US" || locale?.startsWith("en");
  const recognition = params.psychChild?.secondary_axes?.recognition;
  const empathy = params.psychChild?.secondary_axes?.empathy;
  if (typeof recognition !== "number") {
    return en
      ? `Praise lands best when ${params.parentNickname} names one concrete effort — not a global label — right after ${params.childNickname} tried something hard.`
      : `${params.parentNickname}이(가) ${params.childNickname}이(가) 애쓴 직후, 총평 대신 구체적 노력 한 가지를 짚어줄 때 칭찬이 가장 잘 닿아요.`;
  }

  if (recognition >= 65) {
    return en
      ? `${params.childNickname} runs hot on recognition. Public credit and specific skill praise energize; vague “good job” cools them down.`
      : `${params.childNickname}은(는) 인정 욕구가 높은 편이에요. 공개적 인정·구체적 실력 칭찬은 에너지를 올리고, 막연한 “잘했어”는 식혀요.`;
  }
  if (recognition <= 35) {
    return en
      ? `${params.childNickname} prefers private, low-volume praise. A quiet one-to-one note beats a big audience moment.`
      : `${params.childNickname}은(는) 조용하고 부담 낮은 칭찬을 더 잘 받아요. 큰 자리보다 단둘이 짧게 짚어주는 편이 좋아요.`;
  }
  if (typeof empathy === "number" && empathy >= 65) {
    return en
      ? `Warm process praise (“I saw how carefully you…”) lands better for ${params.childNickname} than scoreboard praise.`
      : `${params.childNickname}에겐 점수판형 칭찬보다 “네가 얼마나 조심히 했는지 봤어” 같은 과정 칭찬이 더 잘 닿아요.`;
  }
  return en
    ? `Keep praise specific and timely for ${params.childNickname} — one observed behavior beats three generic compliments.`
    : `${params.childNickname}에게는 구체적이고 타이밍 맞는 칭찬이 중요해요. 막연한 칭찬 세 번보다 관찰된 행동 한 번이 낫습니다.`;
}
