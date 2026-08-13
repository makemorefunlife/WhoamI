import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 Wanted Love vs Given Love Delivery Match Engine
 */

export type LoveDeliveryChannel =
  | "verbal_affection"
  | "emotional_support"
  | "physical_affection"
  | "practical_support"
  | "financial_security"
  | "household_labor"
  | "planning_remembering"
  | "personal_space"
  | "loyalty_consistency";

export type DeliveryMatchStatus = "MATCHED" | "PARTIALLY_MATCHED" | "MISALIGNED";

export type LoveDirectionalMatch = {
  giverName: string;
  receiverName: string;
  wantedChannel: LoveDeliveryChannel;
  wantedChannelLabel: string;
  givenChannel: LoveDeliveryChannel;
  givenChannelLabel: string;
  matchStatus: DeliveryMatchStatus;
  narrative: string;
};

export type MarriageLoveDeliveryBundle = {
  matchAtoB: LoveDirectionalMatch;
  matchBtoA: LoveDirectionalMatch;
  overallSummary: string;
};

export function buildMarriageLoveDeliveryMatch(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
): MarriageLoveDeliveryBundle {
  const isEn = locale === "en-US";
  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  const getChannelLabel = (ch: LoveDeliveryChannel): string => {
    switch (ch) {
      case "verbal_affection": return isEn ? "Verbal Affection" : "따뜻한 다정한 말 한마디";
      case "emotional_support": return isEn ? "Emotional Support" : "정서적 경청과 깊은 공감";
      case "physical_affection": return isEn ? "Physical Affection" : "자연스러운 신체적 스킨십";
      case "practical_support": return isEn ? "Practical Support" : "실질적인 문제 해결과 챙김";
      case "financial_security": return isEn ? "Financial Security" : "안정적인 재정 보장과 지출 케어";
      case "household_labor": return isEn ? "Household Labor" : "묵묵한 가사 노동과 행동";
      case "planning_remembering": return isEn ? "Planning & Remembering" : "일정 기획과 꼼꼼한 세심함";
      case "personal_space": return isEn ? "Personal Space" : "혼자만의 시간을 보장하는 배려";
      case "loyalty_consistency": return isEn ? "Loyalty & Consistency" : "변함없는 든든함과 우직함";
    }
  };

  // Resolve Wanted & Given channels from Psych & Household OS signals
  const resolveChannels = (axes: any): { wanted: LoveDeliveryChannel; given: LoveDeliveryChannel } => {
    const emp = axes.empathy ?? 50;
    const str = axes.structure ?? 50;
    const prac = axes.practicality ?? 50;

    let wanted: LoveDeliveryChannel = "emotional_support";
    if (emp > 65) wanted = "verbal_affection";
    else if (str > 65) wanted = "planning_remembering";
    else if (prac > 65) wanted = "practical_support";

    let given: LoveDeliveryChannel = "household_labor";
    if (prac > 60) given = "practical_support";
    else if (str > 60) given = "planning_remembering";
    else if (emp > 60) given = "emotional_support";

    return { wanted, given };
  };

  const pA = resolveChannels(axesA);
  const pB = resolveChannels(axesB);

  // A -> B (A wants, B gives)
  const statusAtoB: DeliveryMatchStatus = pA.wanted === pB.given ? "MATCHED" : (pA.wanted === "practical_support" && pB.given === "planning_remembering") ? "PARTIALLY_MATCHED" : "MISALIGNED";
  const narrativeAtoB = statusAtoB === "MATCHED"
    ? (isEn ? `${nameB} gives love exactly in the way ${nameA} desires.` : `${nameB}님이 제공하는 사랑의 표현 방식이 ${nameA}님이 원하는 사랑의 형태와 정확히 일치합니다.`)
    : (isEn ? `${nameA} desires ${getChannelLabel(pA.wanted)}, while ${nameB} expresses love through ${getChannelLabel(pB.given)}.` : `${nameA}님은 [${getChannelLabel(pA.wanted)}]을 원하지만, ${nameB}님은 [${getChannelLabel(pB.given)}]의 방식으로 사랑을 표현합니다.`);

  // B -> A (B wants, A gives)
  const statusBtoA: DeliveryMatchStatus = pB.wanted === pA.given ? "MATCHED" : (pB.wanted === "practical_support" && pA.given === "planning_remembering") ? "PARTIALLY_MATCHED" : "MISALIGNED";
  const narrativeBtoA = statusBtoA === "MATCHED"
    ? (isEn ? `${nameA} gives love exactly in the way ${nameB} desires.` : `${nameA}님이 제공하는 사랑의 표현 방식이 ${nameB}님이 원하는 사랑의 형태와 정확히 일치합니다.`)
    : (isEn ? `${nameB} desires ${getChannelLabel(pB.wanted)}, while ${nameA} expresses love through ${getChannelLabel(pA.given)}.` : `${nameB}님은 [${getChannelLabel(pB.wanted)}]을 원하지만, ${nameA}님은 [${getChannelLabel(pA.given)}]의 방식으로 사랑을 표현합니다.`);

  const matchAtoB: LoveDirectionalMatch = {
    giverName: nameB,
    receiverName: nameA,
    wantedChannel: pA.wanted,
    wantedChannelLabel: getChannelLabel(pA.wanted),
    givenChannel: pB.given,
    givenChannelLabel: getChannelLabel(pB.given),
    matchStatus: statusAtoB,
    narrative: narrativeAtoB,
  };

  const matchBtoA: LoveDirectionalMatch = {
    giverName: nameA,
    receiverName: nameB,
    wantedChannel: pB.wanted,
    wantedChannelLabel: getChannelLabel(pB.wanted),
    givenChannel: pA.given,
    givenChannelLabel: getChannelLabel(pA.given),
    matchStatus: statusBtoA,
    narrative: narrativeBtoA,
  };

  const overallSummary = isEn
    ? "Understanding the difference between wanted love and given love bridges emotional misunderstandings."
    : "서로가 원하는 사랑의 채널과 실제 제공하는 채널의 차이를 인지하면 오해 없이 표현이 온전히 전달됩니다.";

  return {
    matchAtoB,
    matchBtoA,
    overallSummary,
  };
}
