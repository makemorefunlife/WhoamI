/**
 * Part4 recognition enrichment — 11축 recognition이 있을 때만
 * filial 서사에 1문장 보조. score/branch/threshold 불변 (013).
 */
import type { PsychMatchResult, PsychMatchType } from "@/lib/relationship/psychMatch";
import type { Locale } from "@/lib/i18n/locale";
import { pick } from "./familyParentCopy";

const ENRICHMENT: Record<PsychMatchType, { en: string; ko: string }> = {
  tension: {
    en: "Survey note: you and your child may want different amounts of praise — naming effort and presence (not only results) tends to stabilize this bond over time.",
    ko: "설문 참고: 부모와 자녀가 원하는 인정·칭찬의 양이 다를 수 있어요. 결과만이 아니라 존재와 노력을 말로 짚어 주면, 시간이 지나며 관계가 더 안정되기 쉽습니다.",
  },
  complementary: {
    en: "Survey note: one of you may lean on spoken praise while the other shows care through trust and action — matching those styles can deepen the long-term give-and-take.",
    ko: "설문 참고: 한쪽은 말로 된 칭찬을, 다른 쪽은 신뢰·행동으로 돌봄을 전하는 편일 수 있어요. 인정 방식만 맞춰도 장기적인 주고받음이 부드러워질 수 있습니다.",
  },
  similarity: {
    en: "Survey note: you tend to respond similarly to recognition — small, steady acknowledgments can reinforce the positive loop this relationship already has.",
    ko: "설문 참고: 인정·칭찬에 비슷하게 반응하는 편이에요. 짧고 꾸준한 알아줌이 이미 있는 긍정적 흐름을 더 단단히 할 수 있습니다.",
  },
};

/** recognition 축이 있으면 match_type에 맞는 1문장, 없으면 null. */
export function buildFilialRecognitionEnrichment(
  psychMatch: PsychMatchResult | null | undefined,
  locale: Locale,
): string | null {
  if (!psychMatch?.axis_results?.length) return null;
  const row = psychMatch.axis_results.find((r) => r.axis_key === "recognition");
  if (!row) return null;
  const copy = ENRICHMENT[row.match_type];
  if (!copy) return null;
  return pick(locale, copy.en, copy.ko);
}

/** 기존 filial 본문에 enrichment를 붙인다. 본문·reward_index는 분기하지 않음. */
export function appendFilialRecognitionEnrichment(
  futureReward: string,
  psychMatch: PsychMatchResult | null | undefined,
  locale: Locale,
): string {
  const extra = buildFilialRecognitionEnrichment(psychMatch, locale);
  if (!extra) return futureReward;
  const base = futureReward.trimEnd();
  if (base.includes(extra)) return base;
  return `${base} ${extra}`;
}
