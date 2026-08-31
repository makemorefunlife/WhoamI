import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { FriendRuleContext } from "@/lib/relationship/friend/buildFriendRuleContext";
import type {
  FriendContactClosenessFitSynthesis,
  FriendEmotionalSafetyFitSynthesis,
  FriendThirdPersonDynamicSynthesis,
  FriendMaintenanceDynamicSynthesis,
  FriendDiscrepancyStatus,
  FriendConfidenceLevel,
  FriendSyntheses,
} from "./friendCanonicalTypes";

function deriveEvidenceStatusAndConfidence(params: {
  hasPsychA: boolean;
  hasPsychB: boolean;
  sajuSignal: string;
  psychSignal?: string;
  isContradictory?: boolean;
}): { status: FriendDiscrepancyStatus; level: FriendConfidenceLevel; score: number } {
  const { hasPsychA, hasPsychB, isContradictory } = params;

  if (!hasPsychA || !hasPsychB) {
    return { status: "INSUFFICIENT", level: "LOW", score: 55 };
  }
  if (isContradictory) {
    return { status: "DISCREPANT", level: "MEDIUM", score: 70 };
  }
  return { status: "CONFIRMED", level: "HIGH", score: 90 };
}

// ----------------------------------------------------------------------------
// 1. CONTACT / CLOSENESS FIT SYNTHESIS
// ----------------------------------------------------------------------------
export function buildContactClosenessFitSynthesis(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale: Locale;
}): FriendContactClosenessFitSynthesis {
  const { ctx, psychA, psychB, locale } = params;
  const isKo = locale !== "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const energyA = psychA?.secondary_axes?.energy_style ?? 50;
  const energyB = psychB?.secondary_axes?.energy_style ?? 50;
  const hasYeokma = ctx.canonicalPairFacts?.hasYeokma ?? false;
  const diff = energyA - energyB;

  let category: "tempo_mismatch" | "tempo_sync" | "low_frequency_durable" = "tempo_sync";
  let direction: "symmetrical" | "A_initiates" | "B_initiates" = "symmetrical";
  let title: string;
  let summary: string;
  let dynamicDescription: string;
  let practicalImplication: string;

  const isContradictory =
    (ctx.strengthA === "strong" && energyA < 35) || (ctx.strengthB === "strong" && energyB < 35);
  const { status, level, score } = deriveEvidenceStatusAndConfidence({
    hasPsychA: !!psychA,
    hasPsychB: !!psychB,
    sajuSignal: ctx.strengthA,
    isContradictory,
  });

  if (Math.abs(diff) >= 25) {
    category = "tempo_mismatch";
    direction = diff > 0 ? "A_initiates" : "B_initiates";
    const initiator = diff > 0 ? nameA : nameB;
    const receiver = diff > 0 ? nameB : nameA;

    title = isKo ? "연락과 만남 템포의 온도차" : "Contact & Meeting Tempo Mismatch";
    summary = isKo
      ? `${initiator}은(는) 자주 소식을 나누는 리듬이 편한 반면, ${receiver}은(는) 혼자만의 충전 시간이 꼭 필요합니다.`
      : `${initiator} prefers frequent check-ins, while ${receiver} requires dedicated downtime.`;
    dynamicDescription = isKo
      ? `${receiver}의 짧은 침묵은 거절이 아닌 에너지를 모으는 냉각기입니다. ${initiator}이(가) 이를 서운함으로 해석하지 않는 것이 핵심입니다.`
      : `Short silences from ${receiver} represent recovery time, not rejection. ${initiator} acknowledging this prevents unnecessary distance.`;
    practicalImplication = isKo
      ? "매일 연락하기보다 주 1~2회 임팩트 있는 안부나 약속으로 조율하세요."
      : "Aim for meaningful check-ins 1-2 times a week rather than pushing for daily contact.";
  } else if (hasYeokma || (energyA < 45 && energyB < 45)) {
    category = "low_frequency_durable";
    title = isKo ? "저빈도 고신뢰 우정 체질" : "Low-Frequency High-Trust Friendship";
    summary = isKo
      ? "자주 만나지 않아도 다시 만났을 때 어제 본 것처럼 편안한 관계 회복력을 가집니다."
      : "Even without frequent meetings, reuniting instantly feels like no time has passed.";
    dynamicDescription = isKo
      ? "각자의 삶을 바쁘게 살아가다가 생각날 때 툭 연락해도 부담이 없는 관계입니다."
      : "You both maintain strong relationship resilience without needing constant daily upkeep.";
    practicalImplication = isKo
      ? "서로 연락이 뜸해도 오해하지 않고 반갑게 안부를 나누세요."
      : "Trust that quiet stretches do not mean fading interest.";
  } else {
    category = "tempo_sync";
    title = isKo ? "착붙 연락 템포 시너지" : "Synchronized Daily Tempo";
    summary = isKo
      ? "일상 공유와 만남 리듬이 비슷하여 서로의 템포에 맞추기 편한 조합입니다."
      : "Your natural contact rhythms align easily, creating smooth communication.";
    dynamicDescription = isKo
      ? "서로의 안부나 소식에 자연스럽게 반응하며 티키타카 대화가 잘 이어집니다."
      : "Communication flows easily back and forth without either side feeling rushed or ignored.";
    practicalImplication = isKo
      ? "지금처럼 자유롭게 생각나는 맛집이나 소식을 편하게 나누세요."
      : "Keep sharing spontaneous updates and plans naturally as you do now.";
  }

  return {
    key: "contact_closeness_fit",
    category,
    direction,
    status,
    confidenceLevel: level,
    confidenceScore: score,
    title,
    summary,
    dynamicDescription,
    practicalImplication,
  };
}

// ----------------------------------------------------------------------------
// 2. EMOTIONAL SAFETY / COUNSELING FIT SYNTHESIS
// ----------------------------------------------------------------------------
export function buildEmotionalSafetyFitSynthesis(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale: Locale;
}): FriendEmotionalSafetyFitSynthesis {
  const { ctx, psychA, psychB, locale } = params;
  const isKo = locale !== "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const empA = psychA?.secondary_axes?.empathy ?? 50;
  const empB = psychB?.secondary_axes?.empathy ?? 50;
  const solA = psychA?.secondary_axes?.practicality ?? 50;
  const solB = psychB?.secondary_axes?.practicality ?? 50;

  const { status, level, score } = deriveEvidenceStatusAndConfidence({
    hasPsychA: !!psychA,
    hasPsychB: !!psychB,
    sajuSignal: "tenGods",
  });

  let category: "mutual_deep_safety" | "solution_vs_empathy_mismatch" | "asymmetrical_trust" = "mutual_deep_safety";
  let direction: "symmetrical" | "A_trusts_B_more" | "B_trusts_A_more" = "symmetrical";
  let title: string;
  let summary: string;
  let detailAtoB: string;
  let detailBtoA: string;
  let practicalImplication: string;

  if (empA >= 50 && empB >= 50) {
    category = "mutual_deep_safety";
    title = isKo ? "쌍방향 감정 경청 편안함" : "Mutual Comfortable Emotional Listening";
    summary = isKo
      ? "두 사람 모두 솔직한 감정을 털어놓았을 때 편안하게 따뜻이 경청받는 관계입니다."
      : "Both of you offer a highly supportive, comfortable space to vent personal thoughts.";
    detailAtoB = isKo
      ? `${nameA}은(는) ${nameB}에게 고민을 말할 때 따뜻하게 경청받는다고 느낍니다.`
      : `${nameA} feels warmly listened to when sharing concerns with ${nameB}.`;
    detailBtoA = isKo
      ? `${nameB} 역시 ${nameA}에게 속마음을 털어놓을 때 경청의 편안함을 느낍니다.`
      : `${nameB} also feels comfortable confiding in ${nameA}.`;
    practicalImplication = isKo
      ? "서로의 고민에 성급한 조언보다 경청과 공감을 먼저 건네는 우정을 유지하세요."
      : "Continue prioritizing empathy and listening over immediate advice when one vents.";
  } else if ((empB < 45 && solB >= 60) || (empA < 45 && solA >= 60)) {
    category = "solution_vs_empathy_mismatch";
    direction = empA > empB ? "A_trusts_B_more" : "B_trusts_A_more";
    const empName = empA > empB ? nameA : nameB;
    const solName = empA > empB ? nameB : nameA;

    title = isKo ? "공감형 vs 솔루션형 경청 다이내믹" : "Empathy vs Solution Counseling Dynamic";
    summary = isKo
      ? `${empName}은(는) 감정적 공감을 바라는 반면 ${solName}은(는) 문제 해결책을 제시하는 경향이 있습니다.`
      : `${empName} seeks emotional empathy, whereas ${solName} leans toward practical solutions.`;
    detailAtoB = isKo
      ? `${nameA}이(가) 힘든 일을 털어놓으면 ${nameB}은(는) 객관적인 해결책을 떠올립니다.`
      : `When ${nameA} vents, ${nameB} quickly considers objective solutions.`;
    detailBtoA = isKo
      ? `${nameB}은(는) 현실적인 조언이 도움이 되기를 바라며 의견을 전달합니다.`
      : `${nameB} offers advice out of a desire to genuinely assist.`;
    practicalImplication = isKo
      ? `${empName}이(가) 얘기할 땐 '그냥 들어줘'라고 먼저 요청하면 오해가 예방됩니다.`
      : `${empName} clarifying "I just need to vent" beforehand keeps the interaction supportive.`;
  } else {
    category = "asymmetrical_trust";
    title = isKo ? "담백하고 실용적인 소통 관계" : "Practical & Straightforward Communication";
    summary = isKo
      ? "무거운 감정 공유보다 현실적인 판단과 객관적 조언을 나누기 편한 대화 스타일입니다."
      : "Conversations tend to be practical and straightforward rather than overly intense.";
    detailAtoB = isKo
      ? `${nameA}은(는) ${nameB}의 객관적인 시각을 신뢰합니다.`
      : `${nameA} trusts ${nameB}'s objective perspective.`;
    detailBtoA = isKo
      ? `${nameB}은(는) ${nameA}과의 대화에서 군더더기 없는 담백함을 느낍니다.`
      : `${nameB} appreciates the low-drama, practical communication with ${nameA}.`;
    practicalImplication = isKo
      ? "무거운 감정 토로보다 일상적인 조언과 즐거운 모임에 집중하세요."
      : "Focus on practical check-ins and enjoyable outings together.";
  }

  return {
    key: "emotional_safety_fit",
    category,
    direction,
    status,
    confidenceLevel: level,
    confidenceScore: score,
    title,
    summary,
    directionalDetailAtoB: detailAtoB,
    directionalDetailBtoA: detailBtoA,
    practicalImplication,
  };
}

// ----------------------------------------------------------------------------
// 3. THIRD-PERSON / TRIANGLE DYNAMIC SYNTHESIS
// ----------------------------------------------------------------------------
export function buildThirdPersonDynamicSynthesis(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale: Locale;
}): FriendThirdPersonDynamicSynthesis {
  const { ctx, psychA, psychB, locale } = params;
  const isKo = locale !== "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const recA = psychA?.secondary_axes?.recognition ?? 50;
  const recB = psychB?.secondary_axes?.recognition ?? 50;
  const energyA = psychA?.secondary_axes?.energy_style ?? 50;
  const energyB = psychB?.secondary_axes?.energy_style ?? 50;

  const isoA = ctx.isolationBandA === "isolated";
  const isoB = ctx.isolationBandB === "isolated";

  const { status, level, score } = deriveEvidenceStatusAndConfidence({
    hasPsychA: !!psychA,
    hasPsychB: !!psychB,
    sajuSignal: `${ctx.isolationBandA}_${ctx.isolationBandB}`,
  });

  let category: "group_stable" | "one_on_one_preferred" | "exclusion_sensitive" = "group_stable";
  let direction: "symmetrical" | "A_sensitive" | "B_sensitive" = "symmetrical";
  let title: string;
  let summary: string;
  let groupVsOneOnOnePattern: string;
  let riskNote: string | null = null;
  let practicalImplication: string;

  // STRICT RULE: Exclusion sensitivity requires COMBINED evidence (Psych Recognition >= 70 AND Saju Bi-Geob isolation signal)
  if ((recA >= 70 && isoA) || (recB >= 70 && isoB)) {
    category = "exclusion_sensitive";
    direction = recA > recB ? "A_sensitive" : "B_sensitive";
    const sensitiveName = recA > recB ? nameA : nameB;
    const partnerName = recA > recB ? nameB : nameA;

    title = isKo ? "다자간 모임 시 소외감 민감도" : "Group Setting & Inclusion Dynamics";
    summary = isKo
      ? `${sensitiveName}은(는) 둘이 가기로 했던 장소나 약속에 사전 소통 없이 제3자가 끼었을 때 서운함을 크게 느낄 수 있습니다.`
      : `${sensitiveName} is sensitive to feeling left out if plans involving ${partnerName} include third parties without clear communication.`;
    groupVsOneOnOnePattern = isKo
      ? "1:1 만남에서는 매우 끈끈하나, 다자간 모임에서는 사전 소통이 필요합니다."
      : "Strongest in 1-on-1 settings; group gatherings require thoughtful coordination.";
    riskNote = isKo
      ? `${partnerName}이(가) 다른 친구와 먼저 핫플을 가거나 사전 공유 없이 약속을 변경할 때 서운함이 발생할 수 있습니다.`
      : `Spontaneous plan shifts involving other friends may cause subtle friction for ${sensitiveName}.`;
    practicalImplication = isKo
      ? "새로운 사람과 함께 만날 땐 사전에 가볍게 알려주면 관계의 서운함이 생기지 않습니다."
      : "Giving a friendly heads-up before introducing group plans keeps everything smooth.";
  } else if (energyA >= 65 && energyB >= 65) {
    category = "group_stable";
    title = isKo ? "그룹 유연형 우정 케미" : "Versatile Group & Pair Dynamics";
    summary = isKo
      ? "둘이 만나도 좋고, 다른 친구들이 끼는 그룹 모임에서도 매끄럽게 잘 어울리는 조합입니다."
      : "Your friendship functions smoothly both 1-on-1 and within larger social groups.";
    groupVsOneOnOnePattern = isKo
      ? "어떤 모임 환경에서도 소외감 없이 자연스럽게 화합합니다."
      : "Adapts easily without possessiveness or awkward group friction.";
    practicalImplication = isKo
      ? "둘만의 만남과 친구들과의 단체 모임을 모두 자유롭게 즐기세요."
      : "Enjoy both 1-on-1 hangouts and group activities freely.";
  } else if (recA < 50 && recB < 50 && energyA < 50 && energyB < 50) {
    category = "one_on_one_preferred";
    title = isKo ? "1:1 밀도 높은 코지형 우정" : "Cozy 1-on-1 Friendship Preferred";
    summary = isKo
      ? "시끄러운 그룹 모임보다 둘만의 호젓하고 깊은 대화를 훨씬 선호하는 타입입니다."
      : "You both naturally thrive in focused 1-on-1 conversations rather than noisy group events.";
    groupVsOneOnOnePattern = isKo
      ? "여럿이 모인 자리에선 에너지가 소모되지만 둘이 만날 때 케미가 좋습니다."
      : "Group events drain energy, but 1-on-1 hangouts bring out your best dynamic.";
    practicalImplication = isKo
      ? "단체 모임보다 맛집 탐방이나 조용한 카페 1:1 약속을 자주 잡으세요."
      : "Plan quiet, quality 1-on-1 hangouts for maximum mutual comfort.";
  } else {
    category = "group_stable";
    title = isKo ? "그룹 유연형 우정 케미" : "Versatile Group & Pair Dynamics";
    summary = isKo
      ? "둘이 만나도 좋고, 다른 친구들이 끼는 그룹 모임에서도 매끄럽게 잘 어울립니다."
      : "Your friendship functions smoothly both 1-on-1 and within larger social groups.";
    groupVsOneOnOnePattern = isKo
      ? "어떤 모임 환경에서도 군더더기 없이 자연스럽게 화합합니다."
      : "Adapts easily without possessiveness or awkward group friction.";
    practicalImplication = isKo
      ? "둘만의 만남과 친구들과의 단체 모임을 모두 자유롭게 즐기세요."
      : "Enjoy both 1-on-1 hangouts and group activities freely.";
  }

  return {
    key: "third_person_dynamic",
    category,
    direction,
    status,
    confidenceLevel: level,
    confidenceScore: score,
    title,
    summary,
    groupVsOneOnOnePattern,
    riskNote,
    practicalImplication,
  };
}

// ----------------------------------------------------------------------------
// 4. FRIENDSHIP MAINTENANCE & HANGOUT PLANNING SYNTHESIS
// ----------------------------------------------------------------------------
export function buildMaintenanceDynamicSynthesis(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale: Locale;
}): FriendMaintenanceDynamicSynthesis {
  const { ctx, psychA, psychB, locale } = params;
  const isKo = locale !== "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const structA = psychA?.secondary_axes?.structure ?? 50;
  const structB = psychB?.secondary_axes?.structure ?? 50;
  const diff = structA - structB;

  const { status, level, score } = deriveEvidenceStatusAndConfidence({
    hasPsychA: !!psychA,
    hasPsychB: !!psychB,
    sajuSignal: "wealth_officer",
  });

  let category: "shared_initiation" | "anchor_initiator" | "low_maintenance_resilient" = "shared_initiation";
  let direction: "symmetrical" | "A_maintains" | "B_maintains" = "symmetrical";
  let title: string;
  let summary: string;
  let maintenanceRoleDescription: string;
  let practicalImplication: string;

  if (Math.abs(diff) >= 20) {
    category = "anchor_initiator";
    direction = diff > 0 ? "A_maintains" : "B_maintains";
    const initiator = diff > 0 ? nameA : nameB;
    const responder = diff > 0 ? nameB : nameA;

    title = isKo ? "모임 일정 제안자 & 호응자의 역할 조화" : "Hangout Planning Initiator & Responsive Partner";
    summary = isKo
      ? `${initiator}이(가) 먼저 맛집이나 일정을 추진하면, ${responder}은(는) 유연하게 호응하며 약속이 성사되는 구도입니다.`
      : `${initiator} takes the lead on proposing plans, and ${responder} responds positively with flexibility.`;
    maintenanceRoleDescription = isKo
      ? `${initiator}의 일관된 약속 추진력과 ${responder}의 수용성이 조화를 이루어 모임이 원활히 이어집니다.`
      : `${initiator}'s planning initiative paired with ${responder}'s adaptability makes hangouts effortless.`;
    practicalImplication = isKo
      ? `${initiator}이(가) 주도하되, ${responder}의 컨디션을 고려해 장소를 정하면 이상적입니다.`
      : `${initiator} leading with consideration for ${responder}'s schedule keeps things effortless.`;
  } else if (structA < 45 && structB < 45) {
    category = "low_maintenance_resilient";
    title = isKo ? "즉흥 약속 유연형 우정" : "Spontaneous Hangout Friendship";
    summary = isKo
      ? "미리 거창하게 계획하기보다 번개나 즉흥적인 연락으로 편하게 만나는 스타일입니다."
      : "Prefers spontaneous hangouts rather than rigid advance scheduling.";
    maintenanceRoleDescription = isKo
      ? "서로 정기적인 모임을 강요하지 않아도 관계의 부담이나 피로감이 없습니다."
      : "Neither feels pressured to maintain strict schedules to keep the friendship strong.";
    practicalImplication = isKo
      ? "미리 계획을 강요하지 말고 생각날 때 '오늘 어때?' 하고 즉흥으로 만나세요."
      : "Embrace casual, spontaneous check-ins when mood and time allow.";
  } else {
    category = "shared_initiation";
    title = isKo ? "쌍방향 균형 제안형 우정" : "Balanced Mutual Plan Proposals";
    summary = isKo
      ? "어느 한쪽에 치우치지 않고 서로 번갈아 맛집을 제안하고 일정을 잡는 건강한 구조입니다."
      : "Both of you take turns proposing hangouts and planning outings equitably.";
    maintenanceRoleDescription = isKo
      ? "서로 일정을 챙기는 노력이 비슷하여 장기적으로 관계에 피로감이 쌓이지 않습니다."
      : "Equal investment prevents resentment or exhaustion over long stretches.";
    practicalImplication = isKo
      ? "지금처럼 번갈아 맛집이나 모임을 편하게 제안하세요."
      : "Keep sharing plan proposals and check-ins mutually as you currently do.";
  }

  return {
    key: "friendship_maintenance_dynamic",
    category,
    direction,
    status,
    confidenceLevel: level,
    confidenceScore: score,
    title,
    summary,
    maintenanceRoleDescription,
    practicalImplication,
  };
}

export function buildFriendSyntheses(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): FriendSyntheses {
  const locale = params.locale ?? params.ctx.locale ?? "ko-KR";
  return {
    contactClosenessFit: buildContactClosenessFitSynthesis({ ...params, locale }),
    emotionalSafetyFit: buildEmotionalSafetyFitSynthesis({ ...params, locale }),
    thirdPersonDynamic: buildThirdPersonDynamicSynthesis({ ...params, locale }),
    maintenanceDynamic: buildMaintenanceDynamicSynthesis({ ...params, locale }),
  };
}
