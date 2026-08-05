/**
 * Life Partner / Marriage Domain 7-Scene Narrative Composer
 *
 * Deterministically translates a Partner DomainStoryPlan into practical,
 * deeply compassionate, and bilingual (KO/EN) 4-beat narrative scenes conforming
 * to the Partnership Product Blueprint and Ahaitsme Narrative Style Bible.
 */

import type { DomainStoryPlan, DomainStoryScene } from "../storyPlannerTypes";
import type {
  DomainNarrativePlan,
  DomainNarrativeScene,
  NarrativeScriptItem,
} from "../narrativeTypes";

function composePartnerScene(
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
      headline_ko: `${scene.title_ko}: 평온한 동반자 기본 상호작용`,
      headline_en: `${scene.title_en}: Balanced life partnership baseline`,
      recognition_ko: `${nameA}님과 ${nameB}님의 구체적인 부부/파트너십 데이터가 확인될 때까지 이 영역은 상호 배려와 유연한 협력의 기준선으로 유지됩니다.`,
      recognition_en: `Until detailed marital dynamics evidence converges, this area maintains a respectful, collaborative baseline between ${nameA} and ${nameB}.`,
      translation_ko: "시주 미상 또는 심리 척도 중립 상태로 인해, 단정적 해석 대신 안전하고 실용적인 부부 생활 규칙을 적용합니다.",
      translation_en: "Due to unknown birth hour or neutral psych scores, safe and practical co-living guidelines are applied.",
      reframing_ko: "역할을 고정하지 않고 일상 상황에 맞춰 유연하게 상의하고 조율할 수 있는 상태입니다.",
      reframing_en: "Represents an adaptable partnership capable of dynamic consensus without rigid role restrictions.",
      action_guidance_ko: "일상 속 작은 대화를 통해 서로의 감정과 컨디션을 수시로 확인하세요.",
      action_guidance_en: "Regularly check in on each other's emotional wellbeing and physical energy through daily conversations.",
      scripts: [
        {
          category: "partner_baseline",
          title_ko: "일상 컨디션 챙기기",
          title_en: "Daily Wellbeing Check-in",
          speaker: "BOTH",
          dialogue_ko: `"오늘 하루 피곤했을 텐데 컨디션은 어때? 오늘 저녁은 편하게 쉬자."`,
          dialogue_en: `"You had a long day—how are you feeling? Let's take it easy tonight."`,
        },
      ],
      role_rules_ko: ["상대방의 휴식 시간을 침범하지 않고 따뜻한 정서적 지지 보내기"],
      role_rules_en: ["Respect rest times while offering steady, unconditional emotional support."],
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
    case "partner_scene_1_foundational_bond":
      headlineKo = "두 사람을 하나로 묶는 근원적 결합력과 일상 생활 리듬의 조화";
      headlineEn = "Foundational marital bond and synchronized co-living tempo";
      recKo = `${nameA}님과 ${nameB}님 사이에는 서로의 존재가 삶의 중심을 잡아주는 깊은 결합력과, 함께 생활할 때 안정감을 주는 생활 리듬이 형성되어 있습니다.`;
      recEn = `Between ${nameA} and ${nameB}, a profound foundational bond anchors daily life, creating a synchronized co-living rhythm that offers mutual security.`;
      trKo = directionality.impact_on_a_ko
        ? `${nameA}님에게는 ${directionality.impact_on_a_ko}, ${nameB}님에게는 ${directionality.impact_on_b_ko}의 기운이 맞물리며 단단한 동반자적 안식처를 이룹니다.`
        : "생명력 있는 지지와 차분한 정착의 에너지가 결합하여 가정을 지탱하는 든든한 주춧돌이 됩니다.";
      trEn = `The interplay of dynamic initiative and grounded stability forms an unshakeable cornerstone for the home.`;
      refKo = "생활 속도의 미세한 차이는 서로를 둔하게 만들거나 재촉하기 위함이 아니라, 가정이 지나치게 과열되거나 침체되지 않도록 조율하는 안전 밸브입니다.";
      refEn = "Minor pacing variations act as a stabilizing thermostat, preventing the household from either burning out or stagnating.";
      actKo = "아침 출근 전과 저녁 취침 전 5분씩 손을 잡고 일상을 공유하는 짧은 체크인 리추얼을 만드세요.";
      actEn = "Establish a 5-minute morning and evening connection ritual to sync emotional presence.";
      scripts = [
        {
          category: "morning_sync",
          title_ko: "아침 온기 나누기",
          title_en: "Morning Connection Ritual",
          speaker: "BOTH",
          dialogue_ko: `"오늘 하루도 우리 힘내자. 이따 저녁에 맛있는 거 먹으면서 얘기 나눠."`,
          dialogue_en: `"Let's have a great day today. Looking forward to our cozy dinner together tonight."`,
        },
      ];
      roleRulesKo = ["서로의 일상 템포를 인정하고 하루의 시작과 끝을 다정한 인사로 채우기"];
      roleRulesEn = ["Honor individual pacing and frame every morning and evening with genuine affection."];
      break;

    case "partner_scene_2_cfo_finances":
      headlineKo = `${lead}님의 체계적 관리와 ${partner}님의 안목이 만드는 가계 CFO 시스템`;
      headlineEn = `Household CFO governance: ${lead}'s systematic budgeting paired with ${partner}'s strategic foresight`;
      recKo = `가계 경제와 자산 운용에 있어 ${lead}님이 꼼꼼한 예산 집행과 지출 통제를 주도하고, ${partner}님이 장기적인 투자와 가치 소비의 균형을 맞출 때 가계가 번영합니다.`;
      recEn = `In household financial management, ${lead}'s disciplined budgeting harmonizes with ${partner}'s strategic long-term vision, ensuring family prosperity.`;
      trKo = "금전에 대한 명확한 규칙과 투명한 자산 공개가 부부 사이의 불필요한 의심과 불안을 원천 차단합니다.";
      trEn = "Transparent asset tracking and explicit financial ground rules eliminate underlying economic anxiety.";
      refKo = "예산을 꼼꼼히 따지는 것은 인색함이 아니라 가족의 미래를 지키려는 가장 헌신적인 사랑의 표현입니다.";
      refEn = "Meticulous accounting is not frugality—it is a proactive demonstration of deep familial protection.";
      actKo = "매월 1회 정기 '가계 CFO 결산 데이'를 열어 수입·지출을 투명하게 점검하고 50만 원 이상의 비정기 지출은 사전 상의 규칙을 세우세요.";
      actEn = "Host a monthly household CFO sync and agree on a clear monetary threshold requiring mutual pre-consultation.";
      scripts = [
        {
          category: "financial_sync",
          title_ko: "월간 가계 결산 대화",
          title_en: "Monthly Financial Review",
          speaker: "A",
          dialogue_ko: `"이번 달 생활비 결산해 봤는데 예산 안에서 잘 운영됐어! 고생 많았어, 다음 달 저축 목표도 같이 볼까?"`,
          dialogue_en: `"Finished this month's budget review—we stayed right on track! Great teamwork; let's check our savings target for next month."`,
        },
      ];
      roleRulesKo = ["일정 금액 이상의 지출은 반드시 사전 상의하고 금전 내역 투명하게 공개하기"];
      roleRulesEn = ["Consult mutually on major discretionary expenses and maintain complete financial transparency."];
      break;

    case "partner_scene_3_home_living":
      headlineKo = "가사 분담의 공평함과 각자의 사적인 동굴 공간의 평화로운 공존";
      headlineEn = "Domestic chore synergy and autonomous sanctuary preservation";
      recKo = `청소, 빨래, 식사 등 반복되는 가사 노동을 구역별로 명확히 책임지고, 지친 날에는 방해받지 않는 각자만의 '동굴 시간'을 보장해 주는 배려가 집을 진정한 휴식처로 만듭니다.`;
      recEn = `Dividing recurring domestic chores by clear zones while guaranteeing uninterrupted 'recharge caves' transforms the home into a true sanctuary.`;
      trKo = "외부 스트레스로 소진된 에너지를 충전할 수 있는 사적인 공간과 시간이 보장될 때, 다시 배우자에게 다정함을 건넬 여유가 생깁니다.";
      trEn = "Guaranteed personal decompression space replenishes cognitive and emotional capacity to show up warmly as a partner.";
      refKo = "배우자가 조용히 혼자 있고 싶어 하는 것은 사랑이 식어서가 아니라, 에너지를 채워 다시 연결되기 위한 필수적인 재충전 과정입니다.";
      refEn = "A partner's retreat into quiet solitude is not withdrawal; it is the necessary refueling process that protects marital warmth.";
      actKo = "서로의 청소/정리 기준을 존중하는 가사 영역을 지정하고, '지금은 혼자 충전할게'라는 신호가 있을 때 1시간의 온전한 자유를 선물하세요.";
      actEn = "Establish designated household chore zones and honor an explicit 1-hour quiet signal without taking it personally.";
      scripts = [
        {
          category: "sanctuary_request",
          title_ko: "동굴 시간 존중 요청",
          title_en: "Sanctuary Time Request",
          speaker: "BOTH",
          dialogue_ko: `"오늘 회사에서 에너지를 다 썼어. 1시간만 방에서 조용히 쉬고 나와서 저녁 같이 준비할게!"`,
          dialogue_en: `"I'm pretty drained from work. I'll take a 1-hour quiet recharge and come out to help with dinner!"`,
        },
      ];
      roleRulesKo = ["가사는 미루지 않고 내 구역을 책임지며 상대의 혼자 있는 시간 방해하지 않기"];
      roleRulesEn = ["Own your assigned domestic chore zone and respect uninterrupted solitude periods."];
      break;

    case "partner_scene_4_intimate_resonance":
      headlineKo = "침실의 정서적 교감과 친밀한 온도의 섬세한 조율";
      headlineEn = "Intimate resonance: Emotional vulnerability and physical pacing harmony";
      recKo = `${nameA}님과 ${nameB}님 사이의 육체적 친밀감은 단순한 신체적 접촉을 넘어, 낮 동안 나누었던 정서적 안정감과 대화의 온도가 침실로 이어질 때 가장 깊게 피어납니다.`;
      recEn = `Physical intimacy between ${nameA} and ${nameB} deepens profoundly when daytime emotional safety and tender communication seamlessly extend into the bedroom.`;
      trKo = "마음이 열려야 몸이 반응하는 자연스러운 온도의 법칙을 이해하고, 서두르지 않는 배려와 비언어적 교감이 친밀도의 핵심으로 작용합니다.";
      trEn = "Understanding that physical connection flows from emotional reassurance prevents performance pressure and nurtures affection.";
      refKo = "친밀감의 주도권이나 빈도에 대한 차이는 거절이 아니라 정서적 준비 속도의 차이일 뿐입니다.";
      refEn = "Divergence in intimate pacing is not personal rejection; it simply reflects different speeds of emotional deceleration.";
      actKo = "잠들기 전 스마트폰을 내려놓고 침대에서 10분간 손을 잡거나 포옹하며 가벼운 온기를 나누세요.";
      actEn = "Put away screens 10 minutes before sleep and cultivate gentle non-demanding physical closeness.";
      scripts = [
        {
          category: "intimate_warmth",
          title_ko: "침실 온기 나누기",
          title_en: "Bedtime Emotional Warmth",
          speaker: "BOTH",
          dialogue_ko: `"오늘 하루도 정말 고생 많았어. 곁에 있어 줘서 따뜻하고 좋아."`,
          dialogue_en: `"You worked so hard today. Having you right beside me brings such deep peace to my heart."`,
        },
      ];
      roleRulesKo = ["신체적 친밀감을 의무로 만들지 않고 정서적 대화와 스킨십 먼저 챙기기"];
      roleRulesEn = ["Never turn intimacy into an obligation; nurture daytime emotional tenderness first."];
      break;

    case "partner_scene_5_conflict_protocol":
      headlineKo = "갈등 상황에서 폭발을 막는 20분 타임아웃과 안전한 복원 규칙";
      headlineEn = "Constructive conflict de-escalation: 20-minute cooling timeout and repair protocol";
      recKo = `부부 싸움 중 감정의 수위가 임계점을 넘을 때, 극단적인 말로 상처를 주기 전에 대화를 잠시 멈추고 감정을 가라앉히는 '냉각 프로토콜'이 가정을 지킵니다.`;
      recEn = `When arguments approach high emotional heat, an agreed 20-minute cooling timeout prevents hurtful words and protects marital safety.`;
      trKo = "즉각 매듭지으려는 조급함과 회피하려는 침묵이 충돌할 때 관계가 손상되므로, '언제 다시 이야기하자'는 명확한 복귀 시간이 불안을 잠재웁니다.";
      trEn = "Clashing needs between immediate resolution and reflective silence are harmonized by defining a concrete return time.";
      refKo = "싸움을 멈추고 자리를 비우는 것은 도망치는 것이 아니라 배우자를 지키기 위해 내 입술을 다스리는 용기입니다.";
      refEn = "Calling a pause is not avoidance; it is the courageous decision to guard your spouse from destructive speech.";
      actKo = "심박수가 올라가면 '타임아웃' 신호를 외치고 20분간 각자 방에서 물을 마시며 진정한 후 대화를 재개하세요.";
      actEn = "Invoke a formal 'timeout' sign when emotions flare, take 20 minutes to breathe, and return at the promised time.";
      scripts = [
        {
          category: "conflict_timeout",
          title_ko: "20분 타임아웃 선언",
          title_en: "20-Minute De-escalation Timeout",
          speaker: "BOTH",
          dialogue_ko: `"지금 우리 둘 다 감정이 격해졌으니, 20분만 각자 쉬고 8시에 거실에서 차 한잔하면서 다시 얘기하자."`,
          dialogue_en: `"We're both overwhelmed right now. Let's take a 20-minute pause and meet in the living room at 8:00 to talk calmly."`,
        },
      ];
      roleRulesKo = ["타임아웃 시 상대방을 비난하지 않고 정해진 복귀 시간에 반드시 대화 재개하기"];
      roleRulesEn = ["Never use timeouts to punish; honor the exact agreed time to resume conversation."];
      break;

    case "partner_scene_6_crisis_shield":
      headlineKo = "삶의 시련과 외부 위기 앞에서 등을 맞대는 원팀(One-Team) 방패";
      headlineEn = "Crisis resilience: United one-team shielding against external adversity";
      recKo = `건강, 재정, 가족 문제 등 외부의 거센 풍파가 닥쳤을 때, 서로를 탓하지 않고 '우리 둘이 힘을 합쳐 문제를 해결한다'는 절대적 신뢰가 발휘됩니다.`;
      recEn = `When adversity strikes—health scares, financial shocks, or family crises—a united 'us against the problem' posture anchors resilience.`;
      trKo = "위기 상황에서 서로의 등을 지켜주는 든든한 보호 본능과 헌신이 발현되어, 고난을 거칠수록 부부의 결속력이 더욱 단단해집니다.";
      trEn = "Mutual crisis stewardship transforms external storms into profound demonstrations of lifelong loyalty.";
      refKo = "위기는 부부를 흔들기 위해 오는 것이 아니라 우리가 얼마나 강력한 원팀인지를 증명하기 위한 시험대입니다.";
      refEn = "Adversity is not a sign of marital failure; it is the crucible that proves the strength of your united partnership.";
      actKo = "위기가 닥쳤을 때 '누구 탓인가'를 묻지 말고 '지금 당장 우리가 취할 수 있는 최선의 선택' 3가지를 함께 적어보세요.";
      actEn = "When facing crises, eliminate blame questions and collaboratively list the top 3 actionable steps forward.";
      scripts = [
        {
          category: "crisis_solidarity",
          title_ko: "원팀 연대감 확인",
          title_en: "One-Team Solidarity Declaration",
          speaker: "BOTH",
          dialogue_ko: `"어떤 일이 있어도 난 항상 네 편이야. 우리 둘이 함께라면 이 문제도 반드시 이겨낼 수 있어."`,
          dialogue_en: `"No matter what happens, I am unconditionally on your side. Together, there is nothing we cannot overcome."`,
        },
      ];
      roleRulesKo = ["외부 위기 앞에서 배우자를 탓하지 않고 단일한 팀으로 뭉쳐 대응하기"];
      roleRulesEn = ["Refrain from spousal blame during external crises; face every challenge as a unified front."];
      break;

    case "partner_scene_7_future_horizons":
      headlineKo = "10년 후의 삶의 비전과 자녀 양육 철학의 아름다운 일치";
      headlineEn = "Long-term horizons: Unified retirement vision and harmonized parenting philosophy";
      recKo = `노후의 삶의 모습, 은퇴 계획, 자녀를 어떤 가치관으로 길러낼지에 대한 장기적인 비전이 조화롭게 정렬되어 흔들리지 않는 북극성이 됩니다.`;
      recEn = `Long-term life horizons, retirement dreams, and core parenting values align harmoniously to provide a steady relational North Star.`;
      trKo = "단기적 일상에 매몰되지 않고 5년, 10년 후의 미래를 함께 설계하며, 서로의 꿈을 응원하는 든든한 조력자로 동행합니다.";
      trEn = "Stepping back from daily logistics to co-create 5- and 10-year milestones fuels shared purpose and joy.";
      refKo = "서로 다른 꿈과 취향은 충돌하는 것이 아니라, 두 사람의 가정을 더욱 풍성하고 다채롭게 만드는 자산입니다.";
      refEn = "Divergent aspirations are not conflicting paths; they weave a richer, multifaceted family tapestry.";
      actKo = "매년 연말 '부부 비전 워크숍'을 열어 올해의 감사를 나누고 내년의 버킷리스트와 10년 뒤의 그림을 업데이트하세요.";
      actEn = "Hold an annual year-end vision retreat to celebrate gratitude and update your 10-year life bucket list.";
      scripts = [
        {
          category: "future_vision",
          title_ko: "미래 비전 나누기",
          title_en: "Future Horizons Dialogue",
          speaker: "BOTH",
          dialogue_ko: `"우리가 10년 뒤에 어떤 집에서 어떤 모습으로 살아가고 있을지 함께 상상해 볼까? 난 당신과 함께할 그 미래가 너무 기대돼."`,
          dialogue_en: `"Let's imagine where we'll be and how we'll live 10 years from now. I'm endlessly excited for the future we're building together."`,
        },
      ];
      roleRulesKo = ["배우자의 개인적 꿈을 적극적으로 응원하고 공동의 미래 로드맵 업데이트하기"];
      roleRulesEn = ["Actively champion your spouse's personal dreams and co-author a vibrant shared roadmap."];
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

export function composePartnerNarrative(plan: DomainStoryPlan): DomainNarrativePlan {
  const nameA = plan.parties.a_name || "A";
  const nameB = plan.parties.b_name || "B";

  const scenes = plan.scenes.map((s) =>
    composePartnerScene(s, nameA, nameB)
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
    domain: "partner",
    parties: plan.parties,
    overall_confidence: plan.overall_confidence,
    overview: {
      headline_ko: `${nameA}님과 ${nameB}님의 부부/파트너십 스토리: 평생의 안식처를 가꾸는 7가지 동행의 지혜`,
      headline_en: `Life Partnership Playbook for ${nameA} & ${nameB}: 7 Pillars of Lifelong Sanctuary`,
      summary_ko: "근원적 유대, 가계 CFO 시스템, 가사·동굴 조화, 침실 온기, 갈등 타임아웃, 위기 방패, 10년 비전까지 흔들리지 않는 가정을 완성하는 종합 동반자 가이드입니다.",
      summary_en: "A comprehensive marital roadmap spanning foundational bond, household CFO governance, sanctuary balance, bedroom intimacy, conflict timeouts, crisis shielding, and future horizons.",
      core_vibe_badge_ko: "견고한 신뢰와 평생의 안식처 파트너십",
      core_vibe_badge_en: "Lifelong Trust & Sacred Sanctuary",
    },
    scenes,
    action_playbook: {
      summary_ko: "가계 재정과 가사 역할을 투명하게 분담하고, 갈등 시 20분 냉각 타임아웃을 지켜 부부의 안전망을 굳건히 유지하세요.",
      summary_en: "Anchor domestic life in transparent financial and chore governance, and practice the 20-minute de-escalation rule during conflicts.",
      golden_rules_ko: [
        "가계 CFO 결산 데이를 정례화하고 주요 지출은 사전 상의한다.",
        "싸움 중 감정이 격해지면 20분 타임아웃 후 약속된 시간에 재개한다.",
        "외부 위기 앞에서는 배우자를 탓하지 않고 원팀으로 대응한다.",
      ],
      golden_rules_en: [
        "Regularize household CFO syncs and consult mutually on major expenses.",
        "Invoke a 20-minute de-escalation timeout during conflicts and honor return commitments.",
        "Face external adversity as an unconditional one-team alliance without internal blame.",
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
