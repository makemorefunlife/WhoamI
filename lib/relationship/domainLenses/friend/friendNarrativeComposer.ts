/**
 * Friend Domain 7-Scene Narrative Composer
 *
 * Deterministically translates a Friend DomainStoryPlan into polished,
 * bilingual (KO/EN) 4-beat narrative scenes conforming to the Friend Product Blueprint
 * and Ahaitsme Narrative Style Bible.
 */

import type { DomainStoryPlan, DomainStoryScene } from "../storyPlannerTypes";
import type {
  DomainNarrativePlan,
  DomainNarrativeScene,
  NarrativeScriptItem,
} from "../narrativeTypes";

function composeFriendScene(
  scene: DomainStoryScene,
  nameA: string,
  nameB: string
): DomainNarrativeScene {
  const { beats, directionality, confidence, is_abstaining, abstain_reason } = scene;
  const tensionLevel = beats.translation.tension_level ?? "low";
  const lead = directionality.lead_party === "B" ? nameB : nameA;
  const partner = directionality.lead_party === "B" ? nameA : nameB;

  if (is_abstaining) {
    return {
      scene_number: scene.scene_number,
      scene_id: scene.scene_id,
      title_ko: scene.title_ko,
      title_en: scene.title_en,
      primary_lens_id: scene.primary_lens_id,
      contributing_lens_ids: scene.contributing_lens_ids,
      confidence: "insufficient",
      is_abstaining: true,
      abstain_reason: abstain_reason ?? "insufficient_evidence",
      tension_level: "low",
      directionality: scene.directionality,
      headline_ko: `${scene.title_ko}: 균형 잡힌 기본 상호작용`,
      headline_en: `${scene.title_en}: Balanced baseline interaction`,
      recognition_ko: `${nameA}님과 ${nameB}님의 구체적인 데이터가 충분히 수렴될 때까지 이 영역은 중립적 기준선으로 유지됩니다. 특정 편향 없이 서로를 존중하는 일상적 우정을 유지하는 것이 좋습니다.`,
      recognition_en: `Until detailed evidence converges, this area maintains a balanced baseline between ${nameA} and ${nameB}. Everyday mutual respect and flexible cadence are recommended.`,
      translation_ko: "사주 시주 미상 또는 심리 척도 중립 상태로 인해, 단정적 해석 대신 안전한 관계 기본형을 적용합니다.",
      translation_en: "Due to unknown birth hour or neutral psychological indicators, a safe baseline is applied rather than speculative claims.",
      reframing_ko: "특정 역할에 얽매이지 않고 유연하게 상황에 맞추어 조율할 수 있는 개방성을 의미합니다.",
      reframing_en: "Represents an open dynamic where neither party is locked into a fixed pattern, allowing natural adaptation.",
      action_guidance_ko: "서로에게 부담을 주지 않는 편안한 템포로 대화를 이어가세요.",
      action_guidance_en: "Maintain an unhurried, comfortable pace of conversation without pressure.",
      scripts: [
        {
          category: "baseline_checkin",
          title_ko: "편안한 안부 확인",
          title_en: "Casual Check-in",
          speaker: "BOTH",
          dialogue_ko: `"요즘 어떻게 지내? 시간 편할 때 편하게 커피 한잔하자."`,
          dialogue_en: `"How have you been? Whenever you're free, let's catch up over coffee."`,
        },
      ],
      role_rules_ko: ["상대방의 개인적인 템포를 존중하며 자연스러운 만남을 유지합니다."],
      role_rules_en: ["Respect each other's individual timing and keep interactions natural."],
      safety_guardrails: {
        prohibited_claims: beats.reframing.prohibited_generic_interpretations,
        allowed_themes: beats.reframing.allowed_themes,
      },
    };
  }

  let headlineKo = "";
  let headlineEn = "";
  let recKo = "";
  let recEn = "";
  let trKo = "";
  let trEn = "";
  let refKo = "";
  let refEn = "";
  let actKo = "";
  let actEn = "";
  let scripts: NarrativeScriptItem[] = [];
  let roleRulesKo: string[] = [];
  let roleRulesEn: string[] = [];

  switch (scene.scene_id) {
    case "friend_scene_1_vibe":
      headlineKo = "첫 만남부터 편안하게 결이 통하는 대화의 리듬";
      headlineEn = "Effortless conversational flow and natural energy resonance";
      recKo = `${nameA}님과 ${nameB}님은 처음 만났을 때부터 어색한 침묵을 견디기 위해 억지로 애쓰지 않아도 자연스럽게 대화의 물꼬가 트이는 편안한 파동을 지니고 있습니다.`;
      recEn = `Between ${nameA} and ${nameB}, conversation flows naturally without forced effort to fill silences, grounded in an intuitive mutual ease.`;
      trKo = directionality.impact_on_a_ko
        ? `${nameA}님에게는 ${directionality.impact_on_a_ko}, ${nameB}님에게는 ${directionality.impact_on_b_ko}의 기운이 교차하며 상호 자극을 형성합니다.`
        : "서로의 기운 흐름이 상호 보완적으로 작용하여 곁에 있는 것만으로도 긴장이 완화되는 케미스트리를 보입니다.";
      trEn = `The relational dynamics create mutual ease, allowing both ${nameA} and ${nameB} to feel recharged in each other's company.`;
      refKo = "첫 만남의 편안함은 커다란 축복이지만, '말하지 않아도 다 알겠지'라는 방심으로 이어질 수 있으므로 사소한 감정도 명확히 표현해 주는 것이 좋습니다.";
      refEn = "Natural rapport is a strength, but assuming total understanding without speaking can lead to minor oversights; explicit appreciation keeps the bond fresh.";
      actKo = "함께 있을 때의 편안함을 당연하게 여기지 말고, 주기적으로 즐거운 자극을 나눌 수 있는 새로운 대화 주제를 탐색해 보세요.";
      actEn = "Acknowledge the comfort of your bond and periodically introduce new topics and shared experiences to keep conversations vibrant.";
      scripts = [
        {
          category: "rapport_appreciation",
          title_ko: "편안함에 대한 고마움 표현",
          title_en: "Expressing Rapport Gratitude",
          speaker: "BOTH",
          dialogue_ko: `"너랑 얘기하면 굳이 잘 보이려고 애쓰지 않아도 돼서 마음이 진짜 편해."`,
          dialogue_en: `"Talking with you is so grounding because I never feel the need to pretend."`,
        },
      ];
      roleRulesKo = ["말하지 않아도 알 것이라 단정하지 말고 고마움을 언어로 표현하기"];
      roleRulesEn = ["Never assume unspoken thoughts; express genuine appreciation explicitly."];
      break;

    case "friend_scene_2_taste":
      headlineKo = `${lead}님의 취향 탐색과 ${partner}님의 호응이 만드는 즐거운 놀이 코드`;
      headlineEn = `Shared taste synergy: ${lead}'s curious exploration meets ${partner}'s enthusiastic resonance`;
      recKo = `새로운 맛집, 취미, 문화생활을 즐길 때 ${lead}님이 흥미로운 제안을 던지면 ${partner}님이 흔쾌히 호응하며 두 사람만의 즐거운 아지트와 추억을 쌓아갑니다.`;
      recEn = `When discovering new cafes, hobbies, or cultural spots, ${lead}'s initiative pairs smoothly with ${partner}'s open engagement, creating rich shared experiences.`;
      trKo = "취향에 대한 개방성과 공유의 즐거움이 맞물려, 지루할 틈 없이 일상에 신선한 활력을 불어넣습니다.";
      trEn = "Openness to novel leisure activities fuels ongoing vitality, turning everyday hangouts into meaningful shared milestones.";
      refKo = "한 사람의 취향에만 치우치지 않도록, 다음 모임에서는 상대방이 가고 싶었던 장소를 우선적으로 선택하는 배려가 관계의 균형을 지켜줍니다.";
      refEn = "Alternating who picks the destination ensures both friends feel equally catered to and valued.";
      actKo = "가고 싶은 플레이리스트나 맛집 지도를 공유하고 번갈아 가며 모임 장소를 결정해 보세요.";
      actEn = "Share saved map lists and alternate who chooses the destination for upcoming hangouts.";
      scripts = [
        {
          category: "taste_sharing",
          title_ko: "취향 제안 및 교환",
          title_en: "Taste Recommendation Dialogue",
          speaker: "A",
          dialogue_ko: `"이번 주말에 내가 새로 찾은 분위기 좋은 곳 있는데 같이 가볼래?"`,
          dialogue_en: `"Found a cozy new spot with great vibes—would you like to check it out together this weekend?"`,
        },
      ];
      roleRulesKo = ["서로의 취향을 존중하고 장소 선택권을 번갈아 가며 행사하기"];
      roleRulesEn = ["Respect diverse tastes and take turns selecting meeting spots."];
      break;

    case "friend_scene_3_treasurer":
      headlineKo = "뒤끝 없는 깔끔한 정산이 지켜주는 오랜 우정의 신뢰";
      headlineEn = "Transparent Dutch-pay protocols that protect long-term financial trust";
      recKo = `${nameA}님과 ${nameB}님 사이에서 비용 정산은 애매한 눈치 싸움 없이 즉시 투명하게 나누는 것이 서로의 존중을 확인하는 가장 안전한 길입니다.`;
      recEn = `For ${nameA} and ${nameB}, immediate and transparent cost-sharing prevents awkward ambiguity and reinforces mutual trust.`;
      trKo = "금전에 대한 기준선이 명확할 때 감정적 잔여물이 남지 않으며, 소소한 지출에서도 공정함이 관계의 안전망으로 작동합니다.";
      trEn = "When expense boundaries are clear and immediate, no emotional friction lingers, making gatherings stress-free.";
      refKo = "'친하니까 대충 넘어가자'는 태도보다 100원 단위까지 투명하게 정산하는 배려가 오히려 서로의 자존감을 지켜줍니다.";
      refEn = "Transparent accounting is not pettiness—it is a proactive demonstration of relational care and dignity.";
      actKo = "모임 직후 영수증 공유와 100원 단위 송금을 습관화하고, 선결제한 친구에게 즉시 정산 링크를 전달하세요.";
      actEn = "Establish an immediate habit of receipt sharing and precise digital transfers down to the last cent after shared outings.";
      scripts = [
        {
          category: "money_split",
          title_ko: "깔끔한 즉시 정산",
          title_en: "Immediate Clear Split",
          speaker: "BOTH",
          dialogue_ko: `"오늘 계산 영수증이야! 100원 단위까지 딱 나눠서 편할 때 바로 보내주면 돼, 오늘 너무 즐거웠어."`,
          dialogue_en: `"Here's the receipt from today! Settle up whenever you have a second—had an amazing time."`,
        },
      ];
      roleRulesKo = ["정산은 모임 당일 내로 마무리하고 금전 부탁은 원천적으로 삼가기"];
      roleRulesEn = ["Complete splits on the same day and avoid mixing casual friendship with personal loans."];
      break;

    case "friend_scene_4_travel":
      headlineKo = `${lead}님의 일정 주도와 ${partner}님의 유연한 조율이 만드는 여행의 호흡`;
      headlineEn = `Travel coordination: ${lead}'s navigational planning balanced by ${partner}'s adaptive pace`;
      recKo = `함께 여행을 떠날 때 ${lead}님이 전체적인 동선과 예약을 앞장서서 챙기면, ${partner}님이 현장에서 여유로운 분위기를 조성하며 완벽한 여행 팀워크를 이룹니다.`;
      recEn = `On trips, ${lead} takes initiative in mapping itineraries and bookings while ${partner} introduces relaxing flexibility, creating ideal travel synergy.`;
      trKo = `${lead}님의 실행력과 ${partner}님의 유연함이 결합하여, 여행 중 발생할 수 있는 피로도와 일정 차질을 현명하게 극복합니다.`;
      trEn = `${lead}'s proactive drive paired with ${partner}'s adaptability navigates unexpected travel delays smoothly.`;
      refKo = "총대 멘 사람에게만 모든 짐이 쏠리지 않도록, 일정 중 발생하는 돌발 상황에 대해서는 불평 대신 적극적인 도움을 건네야 합니다.";
      refEn = "Never leave the planner carrying the entire logistical weight alone; offer proactive help during unexpected hiccups.";
      actKo = "여행 전 '동선 계획'과 '현장 서포트' 역할을 나누고, 전체 일정의 30%는 무계획 충전 시간으로 비워두세요.";
      actEn = "Clarify planning versus on-site support roles in advance and leave 30% of the itinerary unbooked for flexible rest.";
      scripts = [
        {
          category: "travel_cooperation",
          title_ko: "여행 중 고마움과 서포트",
          title_en: "Travel Support & Gratitude",
          speaker: "B",
          dialogue_ko: `"일정 짜느라 진짜 고생 많았어! 이동하는 동안 짐은 내가 들고 다음 카페는 내가 쏠게."`,
          dialogue_en: `"Thank you for putting this amazing itinerary together! I'll carry the bags and coffee is on me."`,
        },
      ];
      roleRulesKo = ["여행 계획자의 노고를 인정하고 현장 변수에 대해 절대 불평하지 않기"];
      roleRulesEn = ["Appreciate the trip planner's labor and refrain from complaining during itinerary adjustments."];
      break;

    case "friend_scene_5_emotional_vent":
      headlineKo = "고민을 털어놓을 때 필요한 '공감 먼저, 조언은 나중에'의 호흡";
      headlineEn = "Emotional venting safety: Empathy first, solutions only when invited";
      recKo = `힘든 일이 생겨 이야기를 털어놓을 때, ${nameA}님과 ${nameB}님은 성급한 해결책보다 '내 편이 되어주는 공감'을 가장 먼저 필요로 합니다.`;
      recEn = `When either ${nameA} or ${nameB} vents about personal challenges, genuine emotional validation matters far more than premature advice.`;
      trKo = "감정이 고조되었을 때의 즉각적인 논리적 분석은 자칫 비판이나 훈계로 들릴 수 있으므로, 감정의 온도를 맞춰주는 완충 구간이 필수적입니다.";
      trEn = "Rapid logical critiques during high emotion can sound like dismissal; an intentional empathy cushion restores emotional safety.";
      refKo = "해결책을 제시하고 싶은 마음은 애정에서 비롯되지만, 상대방이 지금 원하는 것은 정답이 아니라 내 감정이 타당하다는 인정입니다.";
      refEn = "The urge to solve comes from care, but the true emotional need in the moment is reassurance and validation.";
      actKo = "고민을 들을 때 '지금 조언이 필요한지, 아니면 그냥 들어주는 게 필요한지'를 먼저 물어보세요.";
      actEn = "Before offering solutions, ask whether your friend needs proactive brainstorming or simply a compassionate listener.";
      scripts = [
        {
          category: "venting_cushion",
          title_ko: "공감형 리스닝 스크립트",
          title_en: "Empathetic Listening Script",
          speaker: "BOTH",
          dialogue_ko: `"진짜 속상했겠다. 지금은 그냥 편하게 다 털어놔, 내가 네 편에서 들어줄게."`,
          dialogue_en: `"That sounds really exhausting. Vent as much as you need—I'm entirely on your side."`,
        },
      ];
      roleRulesKo = ["고민을 들을 때 상대의 감정을 섣불리 평가하거나 해결사 역할을 자처하지 않기"];
      roleRulesEn = ["Refrain from immediately fixing problems; prioritize unconditional presence and listening."];
      break;

    case "friend_scene_6_distance_jealousy":
      headlineKo = "서로의 다른 성장 계절을 축하하며 안심 거리를 지키는 지혜";
      headlineEn = "Honoring individual seasons: Protecting safe distance and celebrating milestones without comparison";
      recKo = `연락이 뜸해지거나 각자의 커리어·연애 등 삶의 변화가 생겼을 때, 서운함이나 질투 없이 서로의 반짝이는 순간을 온전히 축하해 주는 성숙함이 필요합니다.`;
      recEn = `When life stages shift or contact frequency fluctuates, mature friends maintain secure distance without jealousy, celebrating each other's shining moments.`;
      trKo = "답장이 늦거나 만남이 뜸한 것은 우정의 식음이 아니라 삶의 전환기에 몰입하고 있는 건강한 자율성의 신호입니다.";
      trEn = "Fluctuating contact cadence reflects seasonal immersion in life milestones rather than diminished friendship warmth.";
      refKo = "친구의 성취는 내 기회의 상실이 아니며, 오랜 친구일수록 서로의 다른 속도를 묵묵히 지켜봐 주는 버팀목이 되어야 합니다.";
      refEn = "A friend's milestone does not eclipse your timeline; long-term friendship thrives on cheering each other across different seasons.";
      actKo = "답장을 재촉하지 않는 안심 규칙을 공유하고, 친구의 기쁜 소식에는 아낌없는 축하를 건네세요.";
      actEn = "Maintain low-pressure contact boundaries and celebrate your friend's successes wholeheartedly.";
      scripts = [
        {
          category: "genuine_celebration",
          title_ko: "성취 축하 및 안심 안부",
          title_en: "Milestone Celebration Script",
          speaker: "BOTH",
          dialogue_ko: `"네 소식 듣고 내 일처럼 기뻤어! 바쁠 텐데 답장 신경 쓰지 말고 나중에 여유 생길 때 편하게 보자!"`,
          dialogue_en: `"Heard your incredible news and couldn't be happier for you! No need to reply—let's celebrate when your schedule clears!"`,
        },
      ];
      roleRulesKo = ["연락 빈도로 애정을 시험하지 않고 서로의 독립된 삶을 온전히 응원하기"];
      roleRulesEn = ["Never test friendship loyalty by response time; champion each other's independent journeys."];
      break;

    case "friend_scene_7_repair":
      headlineKo = "서운함이 생겼을 때 냉각기를 거쳐 깨끗하게 푸는 리셋 공식";
      headlineEn = "Constructive rupture repair: Cooling-off space and clean conversational reset";
      recKo = `사소한 오해나 서운함이 생겼을 때, 감정이 격해진 상태에서 맞서기보다 잠시 감정을 식히고 이성적으로 대화를 복원하는 지혜가 필요합니다.`;
      recEn = `When misunderstandings occur, allowing emotions to cool before initiating a calm conversation prevents permanent relational cracks.`;
      trKo = "갈등 처리 속도의 차이로 인해 한쪽이 서둘러 매듭지으려 하면 압박으로 느껴질 수 있으므로, '언제 다시 이야기하자'는 약속이 핵심입니다.";
      trEn = "A timing mismatch in conflict processing means rapid confrontation feels like pressure; defining a specific reconnection time restores equilibrium.";
      refKo = "잠깐의 침묵은 관계의 단절이 아니라 상대방에게 상처 주지 않기 위한 배려의 시간입니다.";
      refEn = "A short pause is not avoidance; it is an intentional boundary to protect mutual dignity.";
      actKo = "서운한 점이 있을 때는 '24시간 쿨다운 골든타임'을 거친 후 '내 느낌'을 중심으로 전달하고, 대화 후에는 묵은 감정을 남기지 마세요.";
      actEn = "Observe a 24-hour golden cooling-off window before expressing hurt using 'I' statements, committing to a complete emotional reset once resolved.";
      scripts = [
        {
          category: "reconciliation_reset",
          title_ko: "감정 정리 후 대화 제안",
          title_en: "Post-Cooling Reconciliation Proposal",
          speaker: "BOTH",
          dialogue_ko: `"아까는 나도 감정이 좀 격했는데, 24시간만 감정 좀 가라앉히고 내일 저녁에 편하게 얘기하자."`,
          dialogue_en: `"I was a bit overwhelmed earlier—let's take 24 hours to breathe and talk it through calmly tomorrow evening."`,
        },
      ];
      roleRulesKo = ["감정적 흥분 상태에서는 결론을 내리지 않고 차분한 재대화 약속 지키기"];
      roleRulesEn = ["Avoid final decisions in high emotional heat; uphold commitments to reconnect calmly."];
      break;
  }

  return {
    scene_number: scene.scene_number,
    scene_id: scene.scene_id,
    title_ko: scene.title_ko,
    title_en: scene.title_en,
    primary_lens_id: scene.primary_lens_id,
    contributing_lens_ids: scene.contributing_lens_ids,
    confidence,
    is_abstaining: false,
    tension_level: tensionLevel,
    directionality,
    headline_ko: headlineKo,
    headline_en: headlineEn,
    recognition_ko: recKo,
    recognition_en: recEn,
    translation_ko: trKo,
    translation_en: trEn,
    reframing_ko: refKo,
    reframing_en: refEn,
    action_guidance_ko: actKo,
    action_guidance_en: actEn,
    scripts,
    role_rules_ko: roleRulesKo,
    role_rules_en: roleRulesEn,
    safety_guardrails: {
      prohibited_claims: beats.reframing.prohibited_generic_interpretations,
      allowed_themes: beats.reframing.allowed_themes,
    },
  };
}

export function composeFriendNarrative(plan: DomainStoryPlan): DomainNarrativePlan {
  const nameA = plan.parties.a_name || "A";
  const nameB = plan.parties.b_name || "B";

  const scenes = plan.scenes.map((s) =>
    composeFriendScene(s, nameA, nameB)
  ) as [
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene,
    DomainNarrativeScene
  ];

  const activeCount = scenes.filter((s) => !s.is_abstaining).length;
  const abstainedCount = scenes.filter((s) => s.is_abstaining).length;

  return {
    schema_version: "domain_7_scene_narrative_v1",
    domain: "friend",
    parties: plan.parties,
    overall_confidence: plan.overall_confidence,
    overview: {
      headline_ko: `${nameA}님과 ${nameB}님의 우정 스토리: 서로의 다름이 시너지가 되는 7가지 순간`,
      headline_en: `Friendship Story for ${nameA} & ${nameB}: 7 Pivotal Moments Where Differences Turn into Synergy`,
      summary_ko: "자연스러운 케미스트리에서 출발해 정산, 공감, 거리 조절, 갈등 리셋까지 두 사람이 오랜 시간 건강하게 동행할 수 있는 실천적 우정 가이드입니다.",
      summary_en: "A practical friendship playbook spanning organic chemistry, financial clarity, empathy, comfortable distance, and conflict reset.",
      core_vibe_badge_ko: "상호 존중과 자유로운 공존의 우정",
      core_vibe_badge_en: "Mutual Respect & Autonomous Synergy",
    },
    scenes,
    action_playbook: {
      summary_ko: "서로에게 바라는 기대치를 투명하게 조율하고, 각자의 속도를 침범하지 않는 것이 이 우정을 지키는 핵심입니다.",
      summary_en: "Align expectations transparently and honor each other's pace to sustain a resilient, joyful friendship.",
      golden_rules_ko: [
        "정산과 금전 경계는 당일 즉시 투명하게 마무리한다.",
        "고민을 들을 때는 조언보다 공감을 먼저 건넨다.",
        "연락 빈도로 친밀도를 시험하지 않고 각자의 공간을 존중한다.",
      ],
      golden_rules_en: [
        "Settle shared expenses immediately and transparently.",
        "Offer genuine validation before jumping into problem-solving.",
        "Respect autonomous breathing room without measuring loyalty by text speed.",
      ],
    },
    metadata: {
      total_scenes: 7,
      active_scenes_count: activeCount,
      abstained_scenes_count: abstainedCount,
      prohibited_claims_count: plan.evidence_boundary.strict_prohibitions.length,
    },
  };
}
