import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { FriendRuleContext } from "@/lib/relationship/friend/buildFriendRuleContext";
import type {
  FriendInitiativeRoleProfile,
  FriendThirdPersonExclusionProfile,
  FriendTravelPlayRoleProfile,
  FriendshipDistanceProfile,
  FriendCoverageProfiles,
} from "./friendCanonicalTypes";

import { resolveRhythmBand } from "@/lib/relationship/friend/friendSajuCompareTable";

// ----------------------------------------------------------------------------
// A. FRIENDSHIP INITIATIVE / ROLE
// ----------------------------------------------------------------------------
export function buildFriendInitiativeRoleProfile(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale: Locale;
}): FriendInitiativeRoleProfile {
  const { ctx, psychA, psychB, locale } = params;
  const isKo = locale !== "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const energyA = psychA?.secondary_axes?.energy_style ?? 50;
  const energyB = psychB?.secondary_axes?.energy_style ?? 50;
  const structA = psychA?.secondary_axes?.structure ?? 50;
  const structB = psychB?.secondary_axes?.structure ?? 50;
  const resA = psychA?.secondary_axes?.resilience ?? 50;
  const resB = psychB?.secondary_axes?.resilience ?? 50;

  const rhythmA = resolveRhythmBand(ctx.friendPairAnalysis.chartA.dayStemCode);
  const rhythmB = resolveRhythmBand(ctx.friendPairAnalysis.chartB.dayStemCode);

  // 1. Contact Initiation (Saju Stem Rhythm + Psych Energy Style)
  let contactInitiator: "symmetrical" | "A_initiates" | "B_initiates" = "symmetrical";
  if (energyA - energyB >= 20 || (rhythmA === "active" && rhythmB === "steady" && energyA - energyB >= 10)) {
    contactInitiator = "A_initiates";
  } else if (energyB - energyA >= 20 || (rhythmB === "active" && rhythmA === "steady" && energyB - energyA >= 10)) {
    contactInitiator = "B_initiates";
  }

  // 2. Planning Lead (Structure + Decision style)
  let planningLead: "symmetrical" | "A_leads" | "B_leads" = "symmetrical";
  if (structA - structB >= 20) planningLead = "A_leads";
  else if (structB - structA >= 20) planningLead = "B_leads";

  // 3. Emotional Reconnection Lead (Resilience + Confrontation)
  let reconnectionLead: "symmetrical" | "A_reconnects" | "B_reconnects" = "symmetrical";
  if (resA - resB >= 20) reconnectionLead = "A_reconnects";
  else if (resB - resA >= 20) reconnectionLead = "B_reconnects";

  let summaryNote: string;
  if (planningLead === "A_leads") {
    summaryNote = isKo
      ? `${nameA}이(가) 모임 장소와 일정을 제안하고, ${nameB}이(가) 유연하게 반응하여 일정이 성사됩니다.`
      : `${nameA} proposes locations and dates, while ${nameB} adapts flexibly to confirm plans.`;
  } else if (planningLead === "B_leads") {
    summaryNote = isKo
      ? `${nameB}이(가) 모임 장소와 일정을 추진하고, ${nameA}이(가) 이를 따라오는 구도입니다.`
      : `${nameB} leads hangout planning and logistics, while ${nameA} follows comfortably.`;
  } else {
    summaryNote = isKo
      ? "두 사람 모두 필요할 때 자연스럽게 번갈아 안부를 묻고 모임을 제안하는 균형된 역할입니다."
      : "Both of you mutually take turns sharing check-ins and proposing hangouts.";
  }

  return {
    contactInitiator,
    planningLead,
    reconnectionLead,
    summaryNote,
  };
}

// ----------------------------------------------------------------------------
// B. THIRD-PERSON / COMPARISON / EXCLUSION PROFILE
// ----------------------------------------------------------------------------
export function buildFriendThirdPersonExclusionProfile(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale: Locale;
}): FriendThirdPersonExclusionProfile {
  const { ctx, psychA, psychB, locale } = params;
  const isKo = locale !== "en-US";

  const recA = psychA?.secondary_axes?.recognition ?? 50;
  const recB = psychB?.secondary_axes?.recognition ?? 50;
  const maxRec = Math.max(recA, recB);

  const isoA = ctx.isolationBandA === "isolated";
  const isoB = ctx.isolationBandB === "isolated";

  const comparisonSensitivity: "low" | "moderate" | "high" = maxRec >= 75 ? "high" : maxRec >= 60 ? "moderate" : "low";
  const exclusionSensitivity: "low" | "moderate" | "high" = (maxRec >= 70 && (isoA || isoB)) ? "high" : maxRec >= 60 ? "moderate" : "low";
  const replacementSensitivity: "low" | "moderate" | "high" = (maxRec >= 75 && (ctx.canonicalPairFacts?.hasClash ?? false)) ? "high" : "low";

  const allowedClaim = isKo
    ? "다자간 모임 시 약속 변경이나 제3자 참석에 대한 미리 알림 선호"
    : "Prefers friendly advance heads-up when introducing new group plans.";
  const forbiddenOverreach = isKo
    ? "독점욕구, 비이성적 질투, 상대의 인간관계 통제 시도라는 자의적 단정 금지"
    : "Strictly forbids claiming possessive jealousy or social control overreach.";

  return {
    comparisonSensitivity,
    exclusionSensitivity,
    replacementSensitivity,
    allowedClaim,
    forbiddenOverreach,
  };
}

// ----------------------------------------------------------------------------
// C. PLAY / TRAVEL ROLE PROFILE
// ----------------------------------------------------------------------------
export function buildFriendTravelPlayRoleProfile(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale: Locale;
}): FriendTravelPlayRoleProfile {
  const { ctx, psychA, psychB, locale } = params;
  const isKo = locale !== "en-US";
  const nameA = ctx.nicknameA;
  const nameB = ctx.nicknameB;

  const stimA = psychA?.secondary_axes?.stimulation ?? 50;
  const stimB = psychB?.secondary_axes?.stimulation ?? 50;
  const structA = psychA?.secondary_axes?.structure ?? 50;
  const structB = psychB?.secondary_axes?.structure ?? 50;
  const pracA = psychA?.secondary_axes?.practicality ?? 50;
  const pracB = psychB?.secondary_axes?.practicality ?? 50;

  const ideaCreator = stimA >= stimB ? nameA : nameB;
  const planLogisticsLead = structA >= structB ? nameA : nameB;
  const practicalExecutor = pracA >= pracB ? nameA : nameB;
  const adaptabilityLead = structA < structB ? nameA : nameB;

  const avgStim = (stimA + stimB) / 2;
  const energyPace: "dense_itinerary" | "balanced_exploration" | "low_stimulation_relax" =
    avgStim >= 70 ? "dense_itinerary" : avgStim <= 40 ? "low_stimulation_relax" : "balanced_exploration";

  return {
    ideaCreator,
    planLogisticsLead,
    practicalExecutor,
    adaptabilityLead,
    energyPace,
  };
}

// ----------------------------------------------------------------------------
// D. RELATIONSHIP DISTANCE PROFILE
// ----------------------------------------------------------------------------
export function buildFriendshipDistanceProfile(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale: Locale;
}): FriendshipDistanceProfile {
  const { ctx, psychA, psychB, locale } = params;
  const isKo = locale !== "en-US";

  const energyA = psychA?.secondary_axes?.energy_style ?? 50;
  const energyB = psychB?.secondary_axes?.energy_style ?? 50;
  const hasYeokma = ctx.canonicalPairFacts?.hasYeokma ?? false;
  const diff = Math.abs(energyA - energyB);

  let category: "frequent_contact_bond" | "low_frequency_durable" | "asymmetric_distance_need" | "spontaneous_high_trust" = "spontaneous_high_trust";
  let replyTempoLabel: string;
  let inPersonMeetingNeed: string;
  let distanceResilienceSummary: string;

  if (diff >= 25) {
    category = "asymmetric_distance_need";
    replyTempoLabel = isKo ? "한쪽은 즉시 답장, 한쪽은 모아서 답장" : "One replies immediately; the other in batches.";
    inPersonMeetingNeed = isKo ? "주 1회 이상 모임 vs 월 1~2회 편한 만남" : "Frequent weekly meetings vs monthly casual hangouts.";
    distanceResilienceSummary = isKo
      ? "연락 빈도가 달라도 에너지를 충전하는 냉각기로 이해하면 신뢰가 흔들리지 않습니다."
      : "Respecting different reply paces keeps mutual trust stable.";
  } else if (hasYeokma || (energyA < 45 && energyB < 45)) {
    category = "low_frequency_durable";
    replyTempoLabel = isKo ? "서로 생각날 때 툭 전하는 쿨한 안부" : "Cool check-ins whenever thoughts arise.";
    inPersonMeetingNeed = isKo ? "자주 안 만나도 오래가는 저빈도 신뢰" : "Low meeting frequency with high long-term trust.";
    distanceResilienceSummary = isKo
      ? "각자의 일상을 바쁘게 살아가다 만나도 어제 본 것처럼 자연스럽습니다."
      : "Reuniting after long stretches feels completely natural and effortless.";
  } else if (energyA >= 65 && energyB >= 65) {
    category = "frequent_contact_bond";
    replyTempoLabel = isKo ? "매일 일상을 나누는 빠른 티키타카" : "Fast daily check-ins and frequent banter.";
    inPersonMeetingNeed = isKo ? "자주 만나 같이 에너지를 발산하는 스타일" : "Loves frequent in-person hangouts to share energy.";
    distanceResilienceSummary = isKo
      ? "일상 공유와 만남 리듬이 정교하게 맞아떨어지는 착붙 우정입니다."
      : "Highly synchronized contact rhythm keeps friendship active.";
  } else {
    category = "spontaneous_high_trust";
    replyTempoLabel = isKo ? "부담 없이 편하게 나누는 조화로운 답장" : "Relaxed, low-pressure communication.";
    inPersonMeetingNeed = isKo ? "필요할 때 언제든 만날 수 있는 유연함" : "Flexible, spontaneous meeting availability.";
    distanceResilienceSummary = isKo
      ? "서로의 페이스를 존중하며 편안하게 이어지는 자연스러운 거리감입니다."
      : "Natural, comfortable boundaries respecting each other's pace.";
  }

  return {
    category,
    replyTempoLabel,
    inPersonMeetingNeed,
    distanceResilienceSummary,
  };
}

export function buildFriendCoverageProfiles(params: {
  ctx: FriendRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): FriendCoverageProfiles {
  const locale = params.locale ?? params.ctx.locale ?? "ko-KR";
  return {
    initiativeRole: buildFriendInitiativeRoleProfile({ ...params, locale }),
    thirdPersonExclusion: buildFriendThirdPersonExclusionProfile({ ...params, locale }),
    travelPlayRole: buildFriendTravelPlayRoleProfile({ ...params, locale }),
    distanceProfile: buildFriendshipDistanceProfile({ ...params, locale }),
  };
}
