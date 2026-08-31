import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/familyParent/familyParentCopy";
import { objectParticle, subjectParticle, topicParticle } from "@/lib/relationship/koreanParticles";

/**
 * Family "6개 항목" 배치 — 11축 psychMaster 전용 3개(4,5,6).
 * 사주(Pair CE)는 이 파일에서 절대 읽지 않는다(엄격한 분리 원칙,
 * familyParentSajuGapInsights.ts와 대칭). 새 카드 없이 기존 필드에 append:
 *   4 → family.section_relationship_index.safe_distance_note
 *   5 → family.section_sos_script.sos_line
 *   6 → family.section_household_roles.complement
 * 축 이름(계획성·자극추구 등) 자체는 화면 문장에 노출하지 않는다.
 */

const GAP_GATE = 15;

/**
 * 항목 4 — 간섭으로 느껴지는 지점.
 * 부모의 계획성(structure) vs 자녀의 자극추구(stimulation, "새로운 걸
 * 스스로 해보고 싶은 마음"으로 번역)만 비교한다.
 */
export function buildInterferenceTriggerLine(params: {
  psychParent: PsychMasterJson | null | undefined;
  psychChild: PsychMasterJson | null | undefined;
  parentNickname: string;
  childNickname: string;
  locale?: Locale;
}): string | null {
  const { psychParent, psychChild, parentNickname, childNickname } = params;
  if (!psychParent || !psychChild) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const structure = psychParent.secondary_axes.structure;
  const stimulation = psychChild.secondary_axes.stimulation;
  if (structure < 60 || stimulation < 60) return null;

  return pick(
    locale,
    ` ${parentNickname} tends to plan ahead and put safety nets in place, while ${childNickname} has a strong pull toward trying new things on their own terms. What feels like "protection" to ${parentNickname} can easily land as "interference" for ${childNickname} — when it isn't actually dangerous, letting ${childNickname} bump into it themselves matters more than getting it right the first time.`,
    ` ${topicParticle(parentNickname)} 미리 계획하고 안전장치를 마련해두는 편이고, ${topicParticle(childNickname)} 스스로 새로운 걸 시도해보고 싶은 마음이 큰 편이에요. ${parentNickname} 입장에서는 '보호'인 것이, ${childNickname} 입장에서는 '간섭'으로 느껴지기 쉬운 조합이에요 — 정말 위험한 게 아니라면, 한 번에 잘하는 것보다 아이가 직접 부딪혀보게 두는 게 더 중요할 때가 많아요.`,
  );
}

/**
 * 항목 5 — 누가 보호하고 누가 기대는가(역할 역전).
 * 관계 회복력(resilience) + 관계공감(empathy)만 비교한다. 물리적으로는
 * 부모가 보호자이지만, 정서적으로는 공감 능력이 높은 자녀에게 부모가
 * 기대고 있을 수 있다는 가능성만 짚는다 — 단정하지 않는다.
 */
export function buildRoleReversalLine(params: {
  psychParent: PsychMasterJson | null | undefined;
  psychChild: PsychMasterJson | null | undefined;
  parentNickname: string;
  childNickname: string;
  locale?: Locale;
}): string | null {
  const { psychParent, psychChild, parentNickname, childNickname } = params;
  if (!psychParent || !psychChild) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const resilienceGap = psychChild.secondary_axes.resilience - psychParent.secondary_axes.resilience;
  const empathyGap = psychChild.secondary_axes.empathy - psychParent.secondary_axes.empathy;
  if (resilienceGap < GAP_GATE || empathyGap < GAP_GATE) return null;

  return pick(
    locale,
    ` On the surface, ${parentNickname} is the one looking after ${childNickname} — but emotionally, ${childNickname} may be the steadier, more attuned one of the two. It's worth noticing when ${parentNickname} is quietly leaning on ${childNickname} for comfort, and making sure that weight doesn't fall on ${childNickname} alone.`,
    ` 겉으로는 ${subjectParticle(parentNickname)} ${objectParticle(childNickname)} 보호하는 모습이지만, 마음을 다독이고 공감하는 역할은 오히려 ${childNickname} 쪽이 더 잘 해내고 있을 수 있어요. ${subjectParticle(parentNickname)} 은연중에 ${childNickname}에게 기대어 위로받고 있는 순간이 없는지 알아차리고, 그 무게가 아이 혼자 감당하는 몫이 되지 않게 해주세요.`,
  );
}

/**
 * 항목 6 — 사랑과 관심을 어떻게 표현하는가.
 * 외향/내향 에너지(energy_style)만 비교해 "사랑의 언어" 차이를 번역한다.
 */
export function buildLoveLanguageLine(params: {
  psychParent: PsychMasterJson | null | undefined;
  psychChild: PsychMasterJson | null | undefined;
  parentNickname: string;
  childNickname: string;
  locale?: Locale;
}): string | null {
  const { psychParent, psychChild, parentNickname, childNickname } = params;
  if (!psychParent || !psychChild) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const parentEnergy = psychParent.secondary_axes.energy_style;
  const childEnergy = psychChild.secondary_axes.energy_style;
  const gap = Math.abs(parentEnergy - childEnergy);
  if (gap < GAP_GATE) return null;

  const expressiveIsParent = parentEnergy > childEnergy;
  const expressiveName = expressiveIsParent ? parentNickname : childNickname;
  const quietName = expressiveIsParent ? childNickname : parentNickname;

  return pick(
    locale,
    ` ${expressiveName} tends to show love out loud — hugs, words, an obvious fuss — while ${quietName} shows it through quiet action instead, like remembering small things or just showing up. Neither is loving more than the other; they're speaking different love languages, and naming that difference out loud clears up a lot of misunderstanding.`,
    ` ${topicParticle(expressiveName)} 스킨십이나 말로 애정을 확 드러내는 편이고, ${topicParticle(quietName)} 말없이 챙겨주는 행동으로 마음을 표현하는 편이에요. 표현 방식이 다를 뿐 사랑의 크기가 다른 게 아니에요 — 서로 다른 사랑의 언어를 쓰고 있다는 걸 알아채는 것만으로 오해가 많이 줄어들어요.`,
  );
}
