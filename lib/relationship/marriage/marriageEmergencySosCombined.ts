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
  /** Whether `trigger`/`firstLine` trace to this person's own real triggerAnalysis, or are generic (no evidence for which specific dispute type applies to which person). */
  confidence: "HIGH" | "LOW";
};

export type MarriageEmergencySosBundle = {
  scriptAtoB: SosDirectionalScript;
  scriptBtoA: SosDirectionalScript;
  legacyPrescription: HomeDeEscalationPair;
};

/**
 * Builds one directional de-escalation script. When `triggerAnalysis` for
 * this specific person exists (real evidence), it's used for both `trigger`
 * and `firstLine`. When it doesn't, EVERY field here — not just firstLine —
 * falls back to a generic, symmetric script, rather than assigning one
 * unverified dispute archetype (e.g. "budget dispute") to whichever slot
 * this person happens to occupy and a different one to the other.
 */
function buildDirectionalScript(params: {
  speakerName: string;
  listenerName: string;
  triggerAnalysis: string | undefined;
  isEn: boolean;
}): SosDirectionalScript {
  const { speakerName, listenerName, triggerAnalysis, isEn } = params;

  if (triggerAnalysis) {
    return {
      speakerName,
      listenerName,
      trigger: isEn
        ? "When a recurring, specific source of friction escalates into silence or a sudden outburst"
        : "반복되는 특정 마찰이 싸늘한 침묵이나 갑작스러운 감정 표출로 이어질 때",
      doNot: isEn
        ? `Do NOT follow ${listenerName} demanding an instant apology or answer.`
        : `${listenerName}님에게 즉각적인 답이나 사과를 재촉하지 마세요.`,
      firstLine: `${listenerName}님, ${triggerAnalysis}`,
      bridge: isEn
        ? `"I value our peace and security more than winning this argument."`
        : `"내가 이 자존심 싸움에서 이기는 것보다 우리 집의 평화와 당신 마음이 훨씬 더 중요해요."`,
      reconnection: isEn
        ? "Offer a warm beverage or a gentle touch on the shoulder once the cooling period ends."
        : "쿨링다운 시간이 지난 후 따뜻한 물이나 음료를 건네며 가볍게 어깨를 토닥여주세요.",
      confidence: "HIGH",
    };
  }

  return {
    speakerName,
    listenerName,
    trigger: isEn
      ? "When any recurring source of friction escalates into silence or a sudden outburst — the specific trigger isn't established for this pair yet"
      : "어떤 반복되는 마찰이든 싸늘한 침묵이나 갑작스러운 감정 표출로 이어질 때 — 이 부부의 구체적인 촉발 요인은 아직 확인되지 않았습니다",
    doNot: isEn
      ? `Do NOT follow ${listenerName} demanding an instant apology or answer.`
      : `${listenerName}님에게 즉각적인 답이나 사과를 재촉하지 마세요.`,
    firstLine: isEn
      ? `"${listenerName}, I see we are both emotionally heated. Let's take 20 minutes to cool off."`
      : `"${listenerName}님, 지금 우리 둘 다 감정이 많이 과열된 것 같아요. 20분만 쿨링다운 시간을 가져요."`,
    bridge: isEn
      ? `"I value our peace and security more than winning this argument."`
      : `"내가 이 자존심 싸움에서 이기는 것보다 우리 집의 평화와 당신 마음이 훨씬 더 중요해요."`,
    reconnection: isEn
      ? "Offer a warm beverage or a gentle touch on the shoulder once the cooling period ends."
      : "20분 쿨링다운 시간이 지난 후 따뜻한 물이나 음료를 건네며 가볍게 어깨를 토닥여주세요.",
    confidence: "LOW",
  };
}

export function buildMarriageEmergencySosCombined(
  legacyDeEscalation: HomeDeEscalationPair,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
): MarriageEmergencySosBundle {
  const isEn = locale === "en-US";

  // HomeDeEscalationCard has no "triggerAnalysis" field — the real,
  // person-specific evidence here is `solution_script` (already derived
  // from this exact person's Ten-God/psych upset profile in
  // homeDeEscalationPrescriptions.ts). The previous version of this file
  // read `.personA?.triggerAnalysis` (camelCase, and a field that never
  // existed at all) against the real `.person_a`/`.person_b` snake_case
  // shape — that condition could never be true, so the "real evidence"
  // branch was silently dead code even before this pass.
  const scriptAtoB = buildDirectionalScript({
    speakerName: nameA,
    listenerName: nameB,
    triggerAnalysis: legacyDeEscalation?.person_a?.solution_script,
    isEn,
  });

  const scriptBtoA = buildDirectionalScript({
    speakerName: nameB,
    listenerName: nameA,
    triggerAnalysis: legacyDeEscalation?.person_b?.solution_script,
    isEn,
  });

  return {
    scriptAtoB,
    scriptBtoA,
    legacyPrescription: legacyDeEscalation,
  };
}
