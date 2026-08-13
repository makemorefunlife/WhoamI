import type { HomeDeEscalationPair } from "./homeDeEscalationPrescriptions";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 Combined Directional Emergency SOS Engine
 */

export type SosDirectionalScript = {
  speakerName: string;
  listenerName: string;
  trigger: string;
  doNot: string;
  firstLine: string;
  bridge: string;
  reconnection: string;
};

export type MarriageEmergencySosBundle = {
  scriptAtoB: SosDirectionalScript;
  scriptBtoA: SosDirectionalScript;
  legacyPrescription: HomeDeEscalationPair;
};

export function buildMarriageEmergencySosCombined(
  legacyDeEscalation: HomeDeEscalationPair,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
): MarriageEmergencySosBundle {
  const isEn = locale === "en-US";

  const scriptAtoB: SosDirectionalScript = {
    speakerName: nameA,
    listenerName: nameB,
    trigger: isEn
      ? "When disagreement over budget or household routines escalates into silence"
      : "재정 지출이나 가사 루틴으로 의견이 엇갈려 서운함이 싸늘한 침묵으로 이어질 때",
    doNot: isEn
      ? `Do NOT follow ${nameB} into their room demanding an instant apology or answer.`
      : `${nameB}님의 방으로 당장 따라 들어가 즉각적인 답이나 사과를 재촉하지 마세요.`,
    firstLine: legacyDeEscalation?.personA?.triggerAnalysis
      ? `${nameB}님, ${legacyDeEscalation.personA.triggerAnalysis}`
      : (isEn ? `"${nameB}, I see we are both emotionally heated. Let's take 20 minutes to cool off."` : `"${nameB}님, 지금 우리 둘 다 감정이 많이 과열된 것 같아요. 20분만 쿨링다운 시간을 가져요."`),
    bridge: isEn
      ? `"I value our peace and security more than winning this argument."`
      : `"내가 이 자존심 싸움에서 이기는 것보다 우리 집의 평화와 당신 마음이 훨씬 더 중요해요."`,
    reconnection: isEn
      ? "Offer a warm beverage or a gentle touch on the shoulder once the cooling period ends."
      : "20분 쿨링다운 시간이 지난 후 따뜻한 물이나 음료를 건네며 가볍게 어깨를 토닥여주세요.",
  };

  const scriptBtoA: SosDirectionalScript = {
    speakerName: nameB,
    listenerName: nameA,
    trigger: isEn
      ? "When feelings of accumulated mental load or fatigue burst out"
      : "보이지 않는 집안일 책임감이나 피로가 쌓여 억울함이 갑자기 터져 나올 때",
    doNot: isEn
      ? `Do NOT invalidate ${nameA}'s feelings or argue about administrative details right away.`
      : `${nameA}님의 억울함을 단순 불평으로 치부하거나 즉시 가사 세부 항목을 가지고 따지지 마세요.`,
    firstLine: legacyDeEscalation?.personB?.triggerAnalysis
      ? `${nameA}님, ${legacyDeEscalation.personB.triggerAnalysis}`
      : (isEn ? `"${nameA}, thank you for carrying this load. I am listening."` : `"${nameA}님, 그동안 혼자 집안 운영 챙기느라 고생 많았어요. 당신 이야기를 들을게요."`),
    bridge: isEn
      ? `"Let's look at how we can divide this routine better starting tomorrow."`
      : `"내일부터 집안일 고정 루틴을 어떻게 다시 정돈할지 차근차근 함께 이야기해요."`,
    reconnection: isEn
      ? "Sit together on the couch and acknowledge each other's hard work."
      : "소파에 함께 앉아 서로의 노고와 수고를 조용히 다독여주세요.",
  };

  return {
    scriptAtoB,
    scriptBtoA,
    legacyPrescription: legacyDeEscalation,
  };
}
