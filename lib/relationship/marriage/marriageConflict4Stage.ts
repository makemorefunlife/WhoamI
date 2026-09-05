import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import type { TenGodCounts } from "./marriageTenGodAnalysis";
import {
  type PersonConflictProfile,
  buildPersonConflictProfile,
  resolveConflictDirectness,
} from "./marriageConflictProfile";

/**
 * Marriage V2 Conflict 4-Stage State Transition Engine
 *
 * Each person's per-stage persona is driven by the SAME PAIR-RELATIVE
 * directness resolution marriageChapter07Intelligence.ts uses (see
 * marriageConflictProfile.ts) — not an independent absolute threshold on
 * this person's own conflict_style. Before this shared resolution existed,
 * this file used `conflictStyle < 45` as an absolute cutoff, so any pair
 * where both people's conflict_style sat in the (very common) 45-60 middle
 * band rendered BOTH people with the identical "direct" template, while
 * CH07's relative comparison correctly identified one of them as the more
 * avoidant of the two — two disagreeing personas for the same person.
 */

export type ConflictStageId = "NORMAL" | "TENSION_RISING" | "OVERLOAD" | "RECOVERY";

export type PersonConflictState = {
  personName: string;
  stage: ConflictStageId;
  triggerContext: string; // money, chores, bedroom, family, schedule, career, parenting, mental_load
  internalState: string;
  externalBehavior: string;
  recoveryRequirement: string;
};

export type MarriageConflict4StageBundle = {
  stageA: PersonConflictState[];
  stageB: PersonConflictState[];
  pairSummary: string;
};

export function buildMarriageConflict4Stage(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nameA: string,
  nameB: string,
  locale: Locale = "ko-KR",
  countsA: TenGodCounts = {},
  countsB: TenGodCounts = {},
): MarriageConflict4StageBundle {
  const isEn = locale === "en-US";

  const profA = buildPersonConflictProfile(nameA, psychA, countsA);
  const profB = buildPersonConflictProfile(nameB, psychB, countsB);
  const { isADirect, isBDirect } = resolveConflictDirectness(profA, profB);

  const buildStagesForPerson = (
    prof: PersonConflictProfile,
    isDirect: boolean,
  ): PersonConflictState[] => {
    const { name, resilience } = prof;
    // Recovery style is a THIRD axis (distinct from base tendency and pair
    // role): how someone re-stabilizes after overload, independent of
    // whether they escalate loud or quiet. `resilience` was previously
    // accepted as a parameter here but never actually read.
    const recoversFast = resilience >= 60;

    return [
      {
        personName: name,
        stage: "NORMAL",
        triggerContext: isEn ? "Daily life, money, and chores" : "일상 평상시 및 집안 운영",
        internalState: isEn ? "Relaxed and open to communication" : "평온하며 대화와 협의에 개방적인 상태",
        externalBehavior: isEn ? "Shares daily updates and cooperates naturally" : "일상 이야기를 나누고 집안일에도 자연스럽게 협조함",
        recoveryRequirement: isEn ? "Maintain current daily appreciation" : "평소의 소소한 고마움 표현 유지",
      },
      {
        personName: name,
        stage: "TENSION_RISING",
        triggerContext: isEn ? "Unresolved chores or money friction" : "반복되는 집안일 서운함이나 재정 지출 시각차",
        internalState: isDirect
          ? (isEn ? "Feels urgent need to settle the issue immediately" : "문제를 즉시 짚고 넘어가야 직성이 풀리는 조급함")
          : (isEn ? "Feels overwhelmed and internally defensive" : "감정이 과부하되기 시작하며 내면의 답답함을 느낌"),
        externalBehavior: isDirect
          ? (isEn ? "Tone hardens and demands quick answers" : "말조가 날카로워지며 즉각적인 답을 요구함")
          : (isEn ? "Words become brief and eye contact decreases" : "말수가 급격히 줄어들고 자리나 방을 피함"),
        recoveryRequirement: isEn ? "Acknowledge the emotional temperature" : "서로 감정이 과열되었음을 인정하는 타임아웃",
      },
      {
        personName: name,
        stage: "OVERLOAD",
        triggerContext: isEn ? "Accumulated mental load or in-law stress" : "누적된 가사 PM 서운함이나 시가/처가 경계 침범",
        internalState: isEn ? "Emotional circuit protection triggered" : "감정적 방어 회로가 완전히 작동하여 지친 상태",
        externalBehavior: isDirect
          ? (isEn ? "Vents built-up frustration at once" : "쌓여있던 억울함과 서운함을 한꺼번에 터뜨림")
          : (isEn ? "Enters complete silence / cold war mode" : "방 문을 닫고 침묵(Cold War) 모드로 진입"),
        recoveryRequirement: isEn ? "Cooling period without forcing discussion" : "억지로 대화를 강요하지 않는 고정 쿨링 타임",
      },
      {
        personName: name,
        stage: "RECOVERY",
        triggerContext: isEn ? "Sincere acknowledgment and practical ritual" : "진심 어린 감정 인정과 실용적인 사과 메시지",
        internalState: recoversFast
          ? (isEn ? "Bounces back quickly once the acknowledgment lands" : "인정만 받으면 비교적 빠르게 평정심을 되찾음")
          : (isEn ? "Gradually re-opens trust and safety, taking real time to feel settled" : "다시 정서적 안전감을 느끼기까지 다소 시간이 걸리며 서서히 마음을 엶"),
        externalBehavior: isEn ? "Resumes light daily conversation and offers coffee/tea" : "가벼운 일상 질문이나 따뜻한 음료를 건네며 관계 회복",
        recoveryRequirement: recoversFast
          ? (isEn ? "A brief, sincere acknowledgment is usually enough" : "짧고 진심 어린 인정 한마디로도 충분히 회복됨")
          : (isEn ? "A concrete promise to prevent the same cause, given time to actually settle" : "동일한 원인의 재발 방지를 위한 구체적 약속과, 마음이 실제로 가라앉을 시간"),
      },
    ];
  };

  const stageA = buildStagesForPerson(profA, isADirect);
  const stageB = buildStagesForPerson(profB, isBDirect);

  // Only claim "each has their own distinct pattern" when the evidence
  // actually diverges — isADirect !== isBDirect (real content differs in
  // TENSION_RISING/OVERLOAD) — otherwise this pair genuinely resembles each
  // other on this axis and the summary should say so instead of asserting
  // uniqueness the stage content doesn't back up.
  const stagesActuallyDiffer = isADirect !== isBDirect;
  const pairSummary = stagesActuallyDiffer
    ? (isEn
        ? `When tension rises, ${nameA} and ${nameB} follow distinct 4-stage conflict escalations, requiring tailored de-escalation scripts.`
        : `갈등 시 ${nameA}님과 ${nameB}님은 서로 다른 4단계 상태 전이 패턴을 보이며, 상대방의 타임아웃 신호를 존중하는 것이 가장 중요합니다.`)
    : (isEn
        ? `${nameA} and ${nameB} tend to escalate and cool down in a similar way, so the same de-escalation approach works for both of you.`
        : `${nameA}님과 ${nameB}님은 갈등이 고조되고 가라앉는 방식이 비슷한 편이라, 같은 방식의 진정 대응이 두 사람 모두에게 통합니다.`);

  return {
    stageA,
    stageB,
    pairSummary,
  };
}
