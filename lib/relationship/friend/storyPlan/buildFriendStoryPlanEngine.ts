import type { Locale } from "@/lib/i18n/locale";
import type { FriendCanonicalBundle } from "@/lib/relationship/friend/canonical/friendCanonicalTypes";
import type {
  CanonicalFriendStoryPlan,
  FriendStoryPlanChapter,
  FriendChapterKey,
} from "./friendStoryPlanTypes";

export function buildFriendStoryPlanEngine(params: {
  bundle: FriendCanonicalBundle;
  locale?: Locale;
}): CanonicalFriendStoryPlan {
  const { bundle } = params;
  const locale = params.locale ?? bundle.meta.locale ?? "ko-KR";
  const isKo = locale !== "en-US";
  const nameA = bundle.meta.nicknameA;
  const nameB = bundle.meta.nicknameB;

  const meanings = bundle.meanings;
  const syntheses = bundle.syntheses;
  const coverage = bundle.coverage;

  const meaningOwnershipMap: Record<string, FriendChapterKey> = {
    connectionSpark: "ch01_why_us",
    why_us: "ch01_why_us",
    guardianRoleA: "ch02_who_we_are",
    guardianRoleB: "ch02_who_we_are",
    what_i_give: "ch02_who_we_are",
    what_i_receive: "ch02_who_we_are",
    social_dna: "ch03_social_dna_tempo",
    contactClosenessFit: "ch03_social_dna_tempo",
    contactInitiator: "ch03_social_dna_tempo",
    travelPlay: "ch04_play_travel",
    travelPlayRole: "ch04_play_travel",
    planningLead: "ch04_play_travel",
    emotionalSafetyFit: "ch05_communication_third_person",
    counselingTrust: "ch05_communication_third_person",
    thirdPersonDynamic: "ch05_communication_third_person",
    thirdPersonExclusion: "ch05_communication_third_person",
    repairReset: "ch06_conflict_repair",
    upset_expression: "ch06_conflict_repair",
    deEscalationScript: "ch06_conflict_repair",
    reconnectionLead: "ch06_conflict_repair",
    what_not_to_expect: "ch07_expectation_boundaries",
    boundary_prescriptions: "ch07_expectation_boundaries",
    distanceProfile: "ch08_distance_durability",
    contactDistanceSync: "ch08_distance_durability",
    distanceResilience: "ch08_distance_durability",
    friendPrescriptions: "ch09_action_playbook",
    action_playbook: "ch09_action_playbook",
  };

  // Contradiction / Discrepancy Detection
  const discrepancyNotes: string[] = [];
  if (syntheses?.contactClosenessFit?.status === "DISCREPANT") {
    discrepancyNotes.push(
      isKo
        ? `${nameA}와(과) ${nameB}은(는) 선타고난 배터리 기질과 현재 에너지 스타일에 유의미한 차이가 있습니다 — 사람을 좋아하지만 회복 시간을 확보해야 오래가는 템포입니다.`
        : `Notable contrast between innate battery traits and current energy styles for ${nameA} and ${nameB}.`
    );
  }

  const chapters: FriendStoryPlanChapter[] = [
    {
      chapterKey: "ch01_why_us",
      chapterNumber: 1,
      title: isKo ? "01 왜 우리는 친구인가" : "01 Why We Are Friends",
      userQuestion: isKo ? "왜 우리는 친해졌고 만날수록 무엇이 맞물리는가?" : "Why did we become friends and what keeps us connected?",
      primaryMeanings: ["connectionSpark", "why_us"],
      supportingMeanings: ["gradeReason"],
      synthesisCandidates: syntheses?.contactClosenessFit ? ["contactClosenessFit"] : [],
      coverageModels: [],
      actionCandidates: [],
      prohibitedMeanings: ["counselingTrust", "repairReset", "distanceProfile"],
      narrativeGoal: isKo ? "우정의 시작과 첫인상에서 느껴지는 강력한 끌림과 맞물림 입증" : "Highlight the core attraction and initial friendship spark.",
      narrativePriority: "HIGH",
    },
    {
      chapterKey: "ch02_who_we_are",
      chapterNumber: 2,
      title: isKo ? "02 서로에게 어떤 친구인가" : "02 What We Mean to Each Other",
      userQuestion: isKo ? "나는 이 친구에게 어떤 지원군이고, 이 친구는 나에게 무엇을 주나?" : "What role do I play for this friend, and what do they bring to me?",
      primaryMeanings: ["guardianRoleA", "guardianRoleB", "what_i_give", "what_i_receive"],
      supportingMeanings: [],
      synthesisCandidates: [],
      coverageModels: [],
      actionCandidates: [],
      prohibitedMeanings: ["thirdPersonExclusion", "what_not_to_expect"],
      narrativeGoal: isKo ? "서로의 수호자 아키타입과 주고받는 심리적 지원 보완관계 조명" : "Define mutual guardian roles and complementary support.",
      narrativePriority: "HIGH",
    },
    {
      chapterKey: "ch03_social_dna_tempo",
      chapterNumber: 3,
      title: isKo ? "03 일상 템포와 소통 케미" : "03 Daily Tempo & Social DNA",
      userQuestion: isKo ? "같이 있으면 어떤 모습이 살아나고, 연락과 답장 템포는 어떻게 맞는가?" : "How do our contact rhythms and daily energies align?",
      primaryMeanings: ["social_dna", "contactClosenessFit"],
      supportingMeanings: [coverage?.initiativeRole?.contactInitiator ?? "symmetrical"],
      synthesisCandidates: syntheses?.contactClosenessFit ? ["contactClosenessFit"] : [],
      coverageModels: coverage?.initiativeRole ? ["initiativeRole.contactInitiator"] : [],
      actionCandidates: [],
      prohibitedMeanings: ["repairReset", "travelPlay"],
      narrativeGoal: isKo ? "일상적인 안부와 티키타카 소통의 온도차와 착붙 템포 설명" : "Explain daily communication flow and contact tempo fit.",
      narrativePriority: "HIGH",
    },
    {
      chapterKey: "ch04_play_travel",
      chapterNumber: 4,
      title: isKo ? "04 같이 놀고 여행할 때의 팀워크" : "04 Play & Travel Teamwork",
      userQuestion: isKo ? "함께 놀거나 여행하고 일정을 잡을 때 우리는 어떤 조화를 이루는가?" : "How do we function as a team during trips and outings?",
      primaryMeanings: ["travelPlay", "travelPlayRole"],
      supportingMeanings: [coverage?.initiativeRole?.planningLead ?? "symmetrical"],
      synthesisCandidates: [],
      coverageModels: coverage?.travelPlayRole ? ["travelPlayRole"] : [],
      actionCandidates: [],
      prohibitedMeanings: ["thirdPersonExclusion", "counselingTrust"],
      narrativeGoal: isKo ? "일정 계획자, 실행자, 분위기 아이디어 제공자의 역할 분담 명확화" : "Clarify trip planning, execution, and flexibility roles.",
      narrativePriority: "MEDIUM",
    },
    {
      chapterKey: "ch05_communication_third_person",
      chapterNumber: 5,
      title: isKo ? "05 고민 상담과 제3자 관계 다이내믹" : "05 Counseling & Group Dynamics",
      userQuestion: isKo ? "고민 상담 방식과 다자간 모임 시 어디서 미묘한 온도차가 생기는가?" : "How do we handle deep counseling and third-party group settings?",
      primaryMeanings: ["emotionalSafetyFit", "counselingTrust", "thirdPersonDynamic", "thirdPersonExclusion"],
      supportingMeanings: [],
      synthesisCandidates: syntheses?.emotionalSafetyFit ? ["emotionalSafetyFit"] : [],
      coverageModels: coverage?.thirdPersonExclusion ? ["thirdPersonExclusion"] : [],
      actionCandidates: [],
      prohibitedMeanings: ["why_us", "repairReset"],
      narrativeGoal: isKo ? "공감형 vs 솔루션형 경청 차이와 모임 시 사전 공유 선호도 조명" : "Detail counseling empathy fit and group inclusion dynamics.",
      narrativePriority: "HIGH",
    },
    {
      chapterKey: "ch06_conflict_repair",
      chapterNumber: 6,
      title: isKo ? "06 서운함과 관계 회복의 기술" : "06 Rupture & Reconnection",
      userQuestion: isKo ? "서운함은 어디서 시작되고, 서운하거나 멀어질 때 어떻게 풀고 회복하는가?" : "Where does friction begin, and how do we repair and reconnect?",
      primaryMeanings: ["repairReset", "upset_expression", "deEscalationScript"],
      supportingMeanings: [coverage?.initiativeRole?.reconnectionLead ?? "symmetrical"],
      synthesisCandidates: syntheses?.maintenanceDynamic ? ["maintenanceDynamic"] : [],
      coverageModels: [],
      actionCandidates: [],
      prohibitedMeanings: ["travelPlay", "social_dna"],
      narrativeGoal: isKo ? "냉각기 후 저자극 장소/가벼운 주제를 통한 자연스러운 회복 프로세스 제시" : "Provide a clear rupture-to-reconnection manual.",
      narrativePriority: "HIGH",
    },
    {
      chapterKey: "ch07_expectation_boundaries",
      chapterNumber: 7,
      title: isKo ? "07 이 우정에서 기대하지 말아야 할 것" : "07 Expectation Boundaries",
      userQuestion: isKo ? "이 친구에게 무엇은 잘 주고받고, 무엇까지 기대하면 관계가 피로해지는가?" : "What can we give each other, and what expectations should we avoid?",
      primaryMeanings: ["what_not_to_expect", "boundary_prescriptions"],
      supportingMeanings: [],
      synthesisCandidates: [],
      coverageModels: [],
      actionCandidates: [],
      prohibitedMeanings: ["why_us", "travelPlay"],
      narrativeGoal: isKo ? "우정이 장기화될 때 피로감을 줄이는 세심한 기대선 경계선 제시" : "Set healthy boundaries to prevent mutual fatigue.",
      narrativePriority: "MEDIUM",
    },
    {
      chapterKey: "ch08_distance_durability",
      chapterNumber: 8,
      title: isKo ? "08 오래가는 우정의 자산과 거리감" : "08 Distance Resilience & Long-Term Trust",
      userQuestion: isKo ? "자주 보지 않아도 유지되는가, 이 우정을 오래 지켜주는 핵심 자산은 무엇인가?" : "Does this friendship survive distance, and what keeps it durable?",
      primaryMeanings: ["distanceProfile", "contactDistanceSync", "distanceResilience"],
      supportingMeanings: [],
      synthesisCandidates: [],
      coverageModels: coverage?.distanceProfile ? ["distanceProfile"] : [],
      actionCandidates: [],
      prohibitedMeanings: ["thirdPersonExclusion", "counselingTrust"],
      narrativeGoal: isKo ? "오랫동안 연락이 뜸해도 일회성 만남으로 회복되는 저빈도 고신뢰 우정 체질 증명" : "Prove long-term resilience and distance durability.",
      narrativePriority: "HIGH",
    },
    {
      chapterKey: "ch09_action_playbook",
      chapterNumber: 9,
      title: isKo ? "09 우리를 위한 실전 플레이북" : "09 Practical Action Playbook",
      userQuestion: isKo ? "실제로 이 우정을 더 가치 있게 유지하기 위해 우리는 무엇을 하면 좋은가?" : "What specific actions keep our friendship thriving long-term?",
      primaryMeanings: ["friendPrescriptions", "action_playbook"],
      supportingMeanings: [],
      synthesisCandidates: [],
      coverageModels: [],
      actionCandidates: ["quaterly_hangout", "heads_up_communication", "low_pressure_reset"],
      prohibitedMeanings: ["why_us", "thirdPersonExclusion"],
      narrativeGoal: isKo ? "두 사람의 관계에 즉시 적용 가능한 명확하고 구체적인 실천 행동 지침 제시" : "Deliver clean, actionable prescriptions for mutual growth.",
      narrativePriority: "HIGH",
    },
  ];

  return {
    schemaVersion: "2.0.0",
    meta: {
      nicknameA: nameA,
      nicknameB: nameB,
      locale,
      storyPlanId: `sp_friend_${Date.now()}`,
      generatedAt: new Date().toISOString(),
    },
    chapters,
    meaningOwnershipMap,
    llmHandoffPayload: {
      organizedMeanings: {
        connectionSpark: meanings?.connectionSpark,
        guardianRoles: { A: meanings?.guardianRoleA, B: meanings?.guardianRoleB },
        syntheses,
        coverage,
      },
      discrepancyNotes,
      chapterHandoffs: chapters.map((ch) => ({
        chapterKey: ch.chapterKey,
        title: ch.title,
        allowedThemes: ch.primaryMeanings,
        forbiddenThemes: ch.prohibitedMeanings,
      })),
    },
  };
}
