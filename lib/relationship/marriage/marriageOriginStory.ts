/**
 * 사양서 Part1 "우리가 부부가 된 이유" — 천간합/조후보완(왜 서로였을까)과
 * 일간 오행 상생 방향(네가 곁에 있어 받는 긍정적 변화)을 서사로 가공한다.
 * 로맨틱 도메인과 달리 LLM이 없는 순수 규칙 엔진이라, 여기서 만든 문자열이
 * 최종 리포트 본문 그대로 나간다(digest가 아니라 완성 문장).
 */
import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import { resolveHealingDirection } from "@/lib/saju/marriageAnalysis";
import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import { pick } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";
import { subjectParticle, topicParticle } from "@/lib/relationship/koreanParticles";

export type OriginStorySection = {
  why_us: string;
  positive_change_a: string;
  positive_change_b: string;
};

function buildWhyUs(ctx: MarriageRuleContext): string {
  const { hasHeavenlyStemCombine, hasDayBranchJohuComplement } =
    ctx.marriagePairAnalysis.scoringSignals;
  const { nicknameA: nameA, nicknameB: nameB, locale } = ctx;

  if (hasHeavenlyStemCombine) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `There's a pull between ${nameA} and ${nameB} that doesn't come with a clean explanation. You were drawn to each other before either of you could put it into words — the kind of fit some couples spend years searching for.`,
        `설명하기도 전에 저절로 끌렸던 사이예요 — 이유를 딱히 대기도 전에 편안했다면, 몸이 먼저 알아본 궁합이라는 뜻이에요. 많은 커플이 오래 찾아 헤매는 그런 자연스러운 끌림이죠.`,
      ),
    );
  }
  if (hasDayBranchJohuComplement) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `One of you runs warm, the other runs cooler — and that temperature gap is exactly what makes you fit. The warmer one's heat melts the other's anxiety like snow, turning a difference into an anchor instead of friction.`,
        `한쪽은 따뜻하고 한쪽은 차분한, 온도 차이가 오히려 잘 맞는 조합이에요. 따뜻한 쪽의 온기가 다른 쪽의 불안을 눈 녹듯 녹여주는, 차이가 마찰이 아니라 닻이 되는 궁합이에요.`,
      ),
    );
  }
  return sanitizeHomeLifeText(
    pick(
      locale,
      `No single dramatic signal explains it — you were pulled together through everyday rhythm and small, repeated choices, and that's exactly what makes the bond durable.`,
      `극적인 신호 하나로 설명되는 인연은 아니에요 — 일상의 리듬과 작은 선택이 반복되며 서로를 골랐고, 그게 오히려 오래가는 이유예요.`,
    ),
  );
}

function healedLine(byName: string, locale: Locale): string {
  return pick(
    locale,
    `Being next to ${byName} smooths your rough edges — you feel steadier and more at ease than you expected, like a corner of you got healed.`,
    `${byName} 곁에 있으면 날카로운 모서리가 다듬어져요 — 예상보다 훨씬 편안하고 단단해지는, 마음 한구석이 치유받는 변화예요.`,
  );
}

function nurturerLine(towardName: string, locale: Locale): string {
  return pick(
    locale,
    `Being the one ${towardName} leans on shows you how much strength you actually have — your self-worth grows sturdier through giving, not just receiving.`,
    `${subjectParticle(towardName)} 기댈 수 있는 사람이 되어 주면서, 스스로에게 이런 힘이 있었는지 새삼 확인해요 — 받을 때보다 줄 때 오히려 자존감이 단단해지는 변화예요.`,
  );
}

function mutualStimulationLine(partnerName: string, locale: Locale): string {
  return pick(
    locale,
    `${partnerName} doesn't smooth you out quietly — you push and pull each other, and that friction is exactly what keeps you both growing instead of settling.`,
    `${topicParticle(partnerName)} 조용히 다듬어주는 쪽은 아니에요 — 서로를 밀고 당기며 자극하고, 그 마찰 덕분에 안주하지 않고 계속 성장하는 관계예요.`,
  );
}

function buildPositiveChange(
  ctx: MarriageRuleContext,
): { forA: string; forB: string } {
  const direction = resolveHealingDirection(
    ctx.marriagePairAnalysis.chartA,
    ctx.marriagePairAnalysis.chartB,
  );
  const { nicknameA: nameA, nicknameB: nameB, locale } = ctx;

  if (direction === "a_healed_by_b") {
    return {
      forA: healedLine(nameB, locale),
      forB: nurturerLine(nameA, locale),
    };
  }
  if (direction === "b_healed_by_a") {
    return {
      forA: nurturerLine(nameB, locale),
      forB: healedLine(nameA, locale),
    };
  }
  return {
    forA: mutualStimulationLine(nameB, locale),
    forB: mutualStimulationLine(nameA, locale),
  };
}

export function buildOriginStorySection(
  ctx: MarriageRuleContext,
): OriginStorySection {
  const { forA, forB } = buildPositiveChange(ctx);
  return {
    why_us: buildWhyUs(ctx),
    positive_change_a: sanitizeHomeLifeText(forA),
    positive_change_b: sanitizeHomeLifeText(forB),
  };
}
