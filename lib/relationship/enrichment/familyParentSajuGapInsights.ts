import type { Locale } from "@/lib/i18n/locale";
import type { ChartContext } from "@/lib/saju/chartContext";
import { countElements, ELEMENT_GENERATES } from "@/lib/saju/elements";
import { profileTenGods, type TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { PairFamilySignals } from "@/lib/personCore/sajuSignals/pairTypes";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/familyParent/familyParentCopy";
import { subjectParticle, topicParticle, withParticle } from "@/lib/relationship/koreanParticles";

/**
 * Family "6개 항목" 배치 — 사주 Pair CE 전용 3개(1,2,3).
 * 11축 psychMaster는 이 파일에서 절대 읽지 않는다(사용자 지정 "엄격한 분리
 * 원칙", Work/Friend와 동일). 새 카드를 만들지 않고 기존 필드에 append한다:
 *   1 → family.parent_lens_summary
 *   2 → family.section_growth_tunnel.current_challenge
 *   3 → family.section_destiny.harmony_one_liner
 * 화면 노출 문장에는 십성·오행 등 내부 로직 용어를 쓰지 않는다 — 계산에만
 * 쓰고, 사람이 바로 이해할 수 있는 말로 번역해서 내보낸다.
 */

type Element = "wood" | "fire" | "earth" | "metal" | "water";

function dominantElement(chart: ChartContext): Element {
  const counts = countElements(chart);
  const sorted = (Object.entries(counts) as [Element, number][]).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "earth";
}

function weakestElement(chart: ChartContext): Element {
  const counts = countElements(chart);
  const sorted = (Object.entries(counts) as [Element, number][]).sort((a, b) => a[1] - b[1]);
  return sorted[0]?.[0] ?? "earth";
}

/** 오행을 "이 아이에게 필요한 것"으로 번역 — 절대 오행 이름 자체를 노출하지 않는다. */
const ELEMENT_NEED: Record<Locale, Record<Element, string>> = {
  "en-US": {
    wood: "room to try new things on their own and grow at their own pace",
    fire: "a warm, expressive reaction — being cheered on out loud",
    earth: "a steady, predictable routine they can count on",
    metal: "clear standards and a firm line of what's okay",
    water: "space to be fully understood and to rest without being pushed",
  },
  "ko-KR": {
    wood: "스스로 새로운 걸 시도해보고 자기 속도로 자랄 수 있는 여유",
    fire: "소리 내어 반응해주는 따뜻한 표현과 응원",
    earth: "믿고 기댈 수 있는 안정적이고 예측 가능한 루틴",
    metal: "명확한 기준과 분명한 선",
    water: "온전히 이해받고, 재촉당하지 않고 쉴 수 있는 공간",
  },
};

const ELEMENT_ACTION: Record<Locale, Record<Element, string>> = {
  "en-US": {
    wood: "let them choose and try it their own way, even if it's slower",
    fire: "react out loud — a clear \"wow, really?\" lands better than a quiet nod",
    earth: "keep the daily rhythm the same, even in small ways, before adding anything new",
    metal: "say the rule once, clearly, instead of repeating it softly over and over",
    water: "sit with them without trying to fix it first",
  },
  "ko-KR": {
    wood: "느리더라도 아이가 직접 고르고 시도하게 둬 보세요",
    fire: "고개만 끄덕이기보다 \"진짜?\" 하고 소리 내어 반응해 주세요",
    earth: "새로운 걸 더하기 전에, 있는 루틴부터 흔들리지 않게 지켜 주세요",
    metal: "부드럽게 여러 번 말하기보다, 기준을 한 번 명확하게 말해 주세요",
    water: "해결하려 들기보다, 그냥 옆에 있어 주세요",
  },
};

/**
 * 항목 1 — 부모가 해줘야 할 것 / 아이가 원하는 것.
 * 자녀 사주에서 가장 부족한 오행(간이 용신 추정 — lib/saju/strengthBalance.ts의
 * estimateYongsinGisin과 동일한 "오행 분포 최솟값" 방식, 확정 판정 아님)을
 * "아이에게 필요한 것"으로 번역하고, 부모의 우세 오행이 그 기운을 생(生)해
 * 주는 관계인지로 자연스러운 채움 여부를 판정한다.
 */
export function buildParentGivingLine(params: {
  chartParent: ChartContext;
  chartChild: ChartContext;
  parentNickname: string;
  childNickname: string;
  locale?: Locale;
}): string {
  const { chartParent, chartChild, parentNickname, childNickname } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const needed = weakestElement(chartChild);
  const parentDominant = dominantElement(chartParent);
  const parentNaturallyFills = ELEMENT_GENERATES[parentDominant] === needed;
  const need = ELEMENT_NEED[locale][needed];

  if (parentNaturallyFills) {
    return pick(
      locale,
      `${childNickname} is currently craving ${need}. The good news: ${parentNickname}'s natural instincts already lean this way — a lot of what ${childNickname} needs, ${parentNickname} is already giving without trying too hard.`,
      `${topicParticle(childNickname)} 지금 ${need}이(가) 가장 필요한 시기예요. 다행히 ${parentNickname}의 타고난 기질이 딱 그 방향이라, 애쓰지 않아도 이미 필요한 걸 채워주고 있는 편이에요.`,
    );
  }
  const action = ELEMENT_ACTION[locale][needed];
  return pick(
    locale,
    `${childNickname} is currently craving ${need}. That's a bit different from ${parentNickname}'s natural style, so it may not come automatically — try to ${action} on purpose, and ${childNickname} will feel noticeably more at ease.`,
    `${topicParticle(childNickname)} 지금 ${need}이(가) 가장 필요한 시기예요. ${parentNickname}의 타고난 방식과는 결이 조금 달라서 저절로 채워지긴 어려울 수 있어요 — ${action}. 그러면 ${subjectParticle(childNickname)} 훨씬 편안해할 거예요.`,
  );
}

/**
 * 항목 2 — 통제 vs 자율 & 공부/성취에 대한 기대.
 * 부모 사주의 재성(목표·실리) + 관성(기준·간판) 크기만 사용 — 자녀 쪽 신호는
 * 읽지 않는다(부모 자신의 목표 성향이 압박이 될 수 있는지를 보는 항목이라
 * 부모 원국만으로 판정하는 게 맞다).
 */
export function buildAchievementPressureLine(params: {
  countsParent: TenGodCounts;
  parentNickname: string;
  childNickname: string;
  locale?: Locale;
}): string {
  const { countsParent, parentNickname, childNickname } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const p = profileTenGods(countsParent);
  const goalDrive = p.wealth + p.officer;

  if (goalDrive >= 4) {
    return pick(
      locale,
      `${parentNickname} tends to carry a strong pull toward clear goals and visible results. That's a real strength, but it can quietly turn into "you should be doing better" pressure on ${childNickname} — try naming the effort itself before the outcome, so the bar doesn't always feel like it's moving up.`,
      `${topicParticle(parentNickname)} 목표와 결과를 향한 에너지가 강한 편이에요. 좋은 추진력이지만, 자칫 ${childNickname}에게 "더 잘해야 한다"는 무언의 압박으로 전해지기 쉬워요 — 결과보다 시도 자체를 먼저 인정해 주면 아이가 느끼는 기준선이 훨씬 낮아져요.`,
    );
  }
  if (goalDrive <= 1) {
    return pick(
      locale,
      `${parentNickname} tends not to push goals or achievement onto ${childNickname} — it's a relief for the child, but every now and then a clear, steady direction from ${parentNickname} can feel just as reassuring as freedom does.`,
      `${topicParticle(parentNickname)} 목표나 성취를 강요하기보다 ${childNickname} 스스로 속도를 찾도록 지켜보는 편이에요. 아이 입장에선 편안하지만, 가끔은 ${subjectParticle(parentNickname)} 분명한 방향을 제시해주는 것도 자유만큼이나 든든하게 느껴질 수 있어요.`,
    );
  }
  return pick(
    locale,
    `${parentNickname} keeps a fairly even balance between pushing for goals and giving ${childNickname} room to breathe — the main thing is to keep checking in on whether that balance still feels right to ${childNickname} as they grow.`,
    `${topicParticle(parentNickname)} 목표를 향한 기대와 아이에게 주는 여유 사이에서 비교적 균형을 잘 잡는 편이에요. 다만 아이가 자라면서 그 균형이 여전히 편안한지는 계속 확인해 주는 게 좋아요.`,
  );
}

/**
 * 항목 3 — 성장하면서 관계가 어떻게 바뀌어야 하는가.
 * PairFamilySignals.umbilical_band(이미 계산된 "탯줄 분리" 신호)를 그대로
 * 재사용하고, 비겁(자기 주장·동등함) 총량으로 "수평 관계로의 이행" 방향을
 * 덧붙인다 — 비견/겁재라는 용어는 화면에 노출하지 않는다.
 */
export function buildRelationshipEvolutionLine(params: {
  pairFamily?: PairFamilySignals | null;
  parentNickname: string;
  childNickname: string;
  locale?: Locale;
}): string {
  const { pairFamily, parentNickname, childNickname } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const band = pairFamily?.umbilical_band ?? "medium";

  if (band === "high") {
    return pick(
      locale,
      `Right now ${parentNickname} and ${childNickname} are still closely tied together — almost like the cord hasn't fully been cut yet. That's normal for this stage, but as ${childNickname} grows, the healthy direction is to loosen that tie on purpose: less "parent deciding for child," more two adults who simply see things differently and respect it.`,
      `지금 ${withParticle(parentNickname)} ${topicParticle(childNickname)} 아직 탯줄이 이어진 것처럼 밀착된 관계에 가까워요. 지금 시기엔 자연스러운 모습이지만, ${subjectParticle(childNickname)} 자랄수록 이 밀착을 의식적으로 느슨하게 풀어주는 게 건강한 방향이에요 — 부모가 정해주는 관계에서, 서로 다르게 생각해도 괜찮은 동등한 어른 대 어른의 관계로요.`,
    );
  }
  return pick(
    locale,
    `${parentNickname} and ${childNickname} already keep a fair amount of healthy distance. As ${childNickname} grows, this is likely to naturally settle into something closer to two adults who respect each other's differences — less hierarchy, more mutual footing.`,
    `${withParticle(parentNickname)} ${topicParticle(childNickname)} 지금도 이미 서로의 공간을 어느 정도 존중하는 관계예요. ${subjectParticle(childNickname)} 자랄수록 이 균형은 자연스럽게 위아래보다는, 서로 다름을 인정하는 동등한 어른 대 어른의 관계로 이어질 가능성이 높아요.`,
  );
}
