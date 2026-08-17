import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/marriage/marriageCopy";
import { objectParticle, subjectParticle, topicParticle } from "@/lib/relationship/koreanParticles";

/**
 * 부부·동거 "8개 항목" 배치 — 11축 psychMaster 전용 4개(5,6,7,8).
 * 항목 4(Mental Load)는 이미 `lib/relationship/enrichment/partnerMentalLoadNote.ts`
 * (structure×0.6 + practicality×0.4 비교, section_money_chores.mental_load_note)로
 * 구현돼 있어 여기서 다시 안 만든다. 사주(Pair CE)는 이 파일에서 절대 읽지
 * 않는다(엄격한 분리 원칙, marriageSajuGapInsights.ts와 대칭). 새 카드 없이
 * 기존 필드에 append:
 *   5 → household.section_privacy.person_a/b_private_line
 *   6 → household.section_upset.person_b.upset_signals
 *   7 → household.section_family_boundary.inlaw_stress_summary
 *   8 → household.section_origin_story.why_us
 * 축 이름 자체는 화면 문장에 노출하지 않는다.
 */

const GAP_GATE = 15;

/**
 * 항목 5 — 개인 공간 vs 함께하는 시간.
 * 외향에너지(energy_style) 격차만 사용. 사람별로 다른 절이라 A/B 각각 반환.
 */
export function buildSpaceVsTogetherClauses(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): { clauseA: string; clauseB: string } | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const energyA = psychA.secondary_axes.energy_style;
  const energyB = psychB.secondary_axes.energy_style;
  if (Math.abs(energyA - energyB) < GAP_GATE) return null;

  const togetherIsA = energyA > energyB;
  const togetherClause = (name: string) =>
    pick(
      locale,
      ` ${name} recharges by being in the same room — even just watching TV together on the couch after work counts as quality time.`,
      ` ${topicParticle(name)} 퇴근 후에 같은 공간에 있는 것만으로 충전이 돼요 — 소파에 앉아 같이 TV만 봐도 함께한 시간으로 느껴요.`,
    );
  const soloClause = (name: string) =>
    pick(
      locale,
      ` ${name} needs a real block of alone time — door closed, fully unplugged — to actually recharge, and that's not a rejection of the relationship.`,
      ` ${topicParticle(name)} 방문을 닫고 완전히 혼자 있는 '단절'의 시간이 있어야 진짜로 충전이 돼요 — 그건 관계를 밀어내는 게 아니라 원래 그런 사람인 거예요.`,
    );

  return {
    clauseA: togetherIsA ? togetherClause(nameA) : soloClause(nameA),
    clauseB: togetherIsA ? soloClause(nameB) : togetherClause(nameB),
  };
}

/**
 * 항목 6 — 일·커리어와 가정의 균형.
 * 인정욕구(recognition) 격차만 사용.
 */
export function buildCareerBalanceLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const recA = psychA.secondary_axes.recognition;
  const recB = psychB.secondary_axes.recognition;
  if (Math.abs(recA - recB) < GAP_GATE) return null;

  const driveIsA = recA > recB;
  const driveName = driveIsA ? nameA : nameB;
  const otherName = driveIsA ? nameB : nameA;

  return pick(
    locale,
    ` ${driveName} tends to be the one who lights up chasing recognition at work. When that season hits hard, it isn't unfair for ${otherName} to temporarily pick up more of the home load; it's just timing. The swap works both ways once the tide turns.`,
    ` ${topicParticle(driveName)} 일에서 인정받는 순간에 유독 크게 반응하는 편이에요. 그 시기가 몰아칠 땐 ${subjectParticle(otherName)} 잠시 집안일을 더 맡아 주는 게 불공평한 게 아니라 타이밍의 문제예요 — 흐름이 바뀌면 반대로 돌아가면 됩니다.`,
  );
}

/**
 * 항목 7 — 누가 계획하고 누가 실행하는가(가정의 PM).
 * 계획구조화(structure) 격차만 사용.
 */
export function buildHouseholdPmLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const structureA = psychA.secondary_axes.structure;
  const structureB = psychB.secondary_axes.structure;
  if (Math.abs(structureA - structureB) < GAP_GATE) return null;

  const pmIsA = structureA > structureB;
  const pmName = pmIsA ? nameA : nameB;
  const otherName = pmIsA ? nameB : nameA;

  return pick(
    locale,
    ` For holidays, trips, and the big household occasions, ${pmName} is the natural project manager — the one who thinks three steps ahead. Officially handing over that title (instead of ${otherName} just going along) means the planning load stops falling on ${pmName} by default.`,
    ` 명절·여행·집안 대소사 같은 큰일 앞에서는 ${topicParticle(pmName)} 세 걸음 앞서 생각하는 자연스러운 총괄 매니저예요. ${subjectParticle(otherName)} 그냥 따라가기만 하지 말고 이 역할을 공식적으로 넘겨받으면, 계획 부담이 ${pmName}에게 당연하게 쏠리지 않게 돼요.`,
  );
}

/** 축 이름을 화면에 노출하지 않고 "함께할수록 커지는 강점"으로 번역한다. */
const AXIS_SYNERGY_QUALITY: Record<
  Locale,
  Record<SecondaryAxisKey, { high: string; low: string }>
> = {
  "en-US": {
    stimulation: { high: "the push to try new things", low: "the pull that makes new things stick" },
    self_control: { high: "a steady hand on impulse", low: "permission to loosen up and enjoy the moment" },
    practicality: { high: "a sharp sense for what actually works", low: "a reminder that not everything has to be efficient" },
    structure: { high: "a system that holds the household together", low: "room to breathe when plans go sideways" },
    empathy: { high: "a fine read on how the other is really feeling", low: "a steadiness that doesn't get swept up in every mood" },
    conflict_style: { high: "the courage to name a problem before it festers", low: "the patience to let a hot moment cool first" },
    resilience: { high: "the ability to bounce back fast", low: "the patience to actually sit with a hard feeling" },
    recognition: { high: "the effort to notice and say it out loud", low: "a quiet steadiness that doesn't need applause" },
    energy_style: { high: "the energy that fills the house", low: "the calm that settles it back down" },
    thinking_style: { high: "the patience to think things through", low: "the instinct to just move" },
    decision_style: { high: "a careful check before deciding", low: "the nerve to decide without overthinking" },
  },
  "ko-KR": {
    stimulation: { high: "새로운 걸 먼저 저지르는 추진력", low: "그 새로운 걸 실제로 뿌리내리게 하는 힘" },
    self_control: { high: "충동을 다스리는 침착함", low: "가끔은 풀어져도 된다고 알려주는 여유" },
    practicality: { high: "실질적으로 살림을 굴리는 감각", low: "효율보다 의미를 먼저 보는 마음" },
    structure: { high: "집안을 지탱하는 시스템", low: "계획이 어긋나도 숨 쉴 수 있는 여유" },
    empathy: { high: "상대 마음을 정확히 읽어내는 섬세함", low: "감정에 휩쓸리지 않는 균형감" },
    conflict_style: { high: "문제를 곪기 전에 짚는 용기", low: "감정이 격할 때 한 박자 쉬어가는 지혜" },
    resilience: { high: "넘어져도 금방 털고 일어나는 회복력", low: "충분히 아파하고 다독이는 섬세함" },
    recognition: { high: "서로를 알아채고 말해주는 노력", low: "박수 없이도 묵묵히 곁을 지키는 안정감" },
    energy_style: { high: "집 안에 활기를 불어넣는 에너지", low: "그 에너지를 차분히 가라앉혀주는 안정감" },
    thinking_style: { high: "꼼꼼히 따져보는 판단력", low: "일단 움직이고 보는 결단력" },
    decision_style: { high: "신중하게 한 번 더 확인하는 안전판", low: "망설이지 않고 밀어붙이는 추진력" },
  },
};

const AXIS_KEYS: SecondaryAxisKey[] = [
  "stimulation",
  "self_control",
  "practicality",
  "structure",
  "empathy",
  "conflict_style",
  "resilience",
  "recognition",
  "energy_style",
  "thinking_style",
  "decision_style",
];

/**
 * 항목 8 — 함께 살수록 좋아지는 부분.
 * 11축 중 격차가 가장 큰 '보완 축' 하나를 찾아 장기 시너지로 번역한다.
 */
export function buildLongTermSynergyLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  let bestKey: SecondaryAxisKey | null = null;
  let bestGap = 0;
  for (const key of AXIS_KEYS) {
    const gap = Math.abs(psychA.secondary_axes[key] - psychB.secondary_axes[key]);
    if (gap > bestGap) {
      bestGap = gap;
      bestKey = key;
    }
  }
  if (!bestKey || bestGap < GAP_GATE) return null;

  const highIsA = psychA.secondary_axes[bestKey] > psychB.secondary_axes[bestKey];
  const highName = highIsA ? nameA : nameB;
  const lowName = highIsA ? nameB : nameA;
  const quality = AXIS_SYNERGY_QUALITY[locale][bestKey];

  return pick(
    locale,
    ` The longer you live together, the more this pairing compounds: ${highName} brings ${quality.high}, and ${lowName} brings ${quality.low}. Neither on its own is the full picture — together, over time, it becomes one of this household's real strengths.`,
    ` 같이 사는 시간이 쌓일수록 이 조합은 더 힘을 발휘해요 — ${topicParticle(highName)} ${objectParticle(quality.high)}, ${topicParticle(lowName)} ${objectParticle(quality.low)} 가져와요. 둘 중 하나만으로는 부족했을 부분이, 시간이 지날수록 이 집만의 진짜 강점이 됩니다.`,
  );
}
