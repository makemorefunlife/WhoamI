/**
 * Family Parent-Child Domain 7-Scene Narrative Composer
 *
 * Deterministically translates a Family DomainStoryPlan into gentle,
 * emotionally literate, and bilingual (KO/EN) 4-beat narrative scenes conforming
 * to the Family Product Blueprint and Ahaitsme Narrative Style Bible.
 */

import type { DomainStoryPlan, DomainStoryScene } from "../storyPlannerTypes";
import type {
  DomainNarrativePlan,
  DomainNarrativeScene,
  NarrativeScriptItem,
} from "../narrativeTypes";

function composeFamilyScene(
  scene: DomainStoryScene,
  nameA: string,
  nameB: string,
  roleA?: string,
  roleB?: string
): DomainNarrativeScene {
  const { beats, directionality, confidence, is_abstaining, abstain_reason } = scene;
  const tensionLevel = beats.translation.tension_level ?? "low";
  const labelA = roleA ? `${nameA}(${roleA})` : `${nameA}님`;
  const labelB = roleB ? `${nameB}(${roleB})` : `${nameB}님`;

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
      headline_ko: `${scene.title_ko}: 평온한 가족 기본 상호작용`,
      headline_en: `${scene.title_en}: Balanced family baseline interaction`,
      recognition_ko: `${labelA}과 ${labelB} 사이의 구체적인 가족 역학 데이터가 확인될 때까지 이 영역은 존중과 지지의 기본 기준선으로 유지됩니다.`,
      recognition_en: `Until detailed familial evidence converges, this area maintains a supportive, respectful baseline between ${labelA} and ${labelB}.`,
      translation_ko: "시주 미상 또는 심리 척도 중립 상태로 인해, 단정적 해석 대신 안전하고 따뜻한 기본 가족 규칙을 적용합니다.",
      translation_en: "Due to unknown birth hour or neutral psych indicators, a safe familial guideline is applied.",
      reframing_ko: "서로의 성장과 일상을 묵묵히 응원하는 안정적인 유대감을 의미합니다.",
      reframing_en: "Represents a steady bond that quietly supports each other's growth and personal milestones.",
      action_guidance_ko: "식사나 일상 대화에서 따뜻한 안부를 전하며 온기를 나누세요.",
      action_guidance_en: "Share everyday warmth through shared meals and gentle check-ins.",
      scripts: [
        {
          category: "family_baseline",
          title_ko: "따뜻한 안부 묻기",
          title_en: "Warm Family Check-in",
          speaker: "BOTH",
          dialogue_ko: `"오늘 하루도 고생 많았어. 밥 든든하게 챙겨 먹고 푹 쉬자."`,
          dialogue_en: `"You worked so hard today. Make sure to eat well and get plenty of rest."`,
        },
      ],
      role_rules_ko: ["가족 구성원의 사생활을 존중하며 따뜻한 지지 유지하기"],
      role_rules_en: ["Respect family members' personal privacy while offering unconditional support."],
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
    case "family_scene_1_core_dynamic":
      headlineKo = "부모와 자녀 사이를 잇는 따뜻한 보살핌과 애정의 기운";
      headlineEn = "Foundational nurturing warmth and emotional attachment bond";
      recKo = `${labelA}과 ${labelB} 사이에는 말로 다 표현하지 않아도 서로의 존재만으로 큰 안정감을 주는 깊은 가족의 유대감이 자리 잡고 있습니다.`;
      recEn = `Between ${labelA} and ${labelB}, a profound foundational bond provides deep security, transcending the need for constant verbal validation.`;
      trKo = directionality.impact_on_a_ko
        ? `${labelA}에게는 ${directionality.impact_on_a_ko}, ${labelB}에게는 ${directionality.impact_on_b_ko}의 온기가 전달되며 세대 간 정서적 안식처를 형성합니다.`
        : "생명을 보살피는 헌신과 성장을 지켜보는 든든한 신뢰가 결합하여 건강한 가족 울타리를 만듭니다.";
      trEn = `Nurturing dedication paired with empowering trust creates a healthy, secure home environment.`;
      refKo = "가족이라는 익숙함 때문에 고마움을 표현하는 데 인색해지지 않도록, 사소한 배려에도 감사한 마음을 표현하는 것이 온도를 유지하는 비결입니다.";
      refEn = "Familiarity can sometimes dilute explicit gratitude; openly expressing appreciation keeps the home atmosphere bright.";
      actKo = "하루에 한 번 눈을 마주치고 '오늘도 고생했어'라는 다정한 한마디를 건네보세요.";
      actEn = "Make intentional eye contact daily and share an affectionate word of appreciation.";
      scripts = [
        {
          category: "family_warmth",
          title_ko: "다정한 애정 표현",
          title_en: "Affectionate Validation Script",
          speaker: "BOTH",
          dialogue_ko: `"네가 우리 가족이라서 참 고맙고 든든해."`,
          dialogue_en: `"Having you in our family brings so much warmth and pride to my heart."`,
        },
      ];
      roleRulesKo = ["가족 간의 사랑을 당연하게 여기지 않고 매일 작은 감사를 표현하기"];
      roleRulesEn = ["Never take family love for granted; voice small appreciations every single day."];
      break;

    case "family_scene_2_distance":
      headlineKo = "성장에 따른 건강한 심리적 거리두기와 독립 공간의 존중";
      headlineEn = "Healthy individuation: Respecting the transition from protection to autonomy";
      recKo = `자녀가 성장함에 따라 모든 것을 공유하던 시절을 지나, 각자의 독립적인 생각과 사생활을 보장해 주는 '건강한 심리적 안식처'가 필요해집니다.`;
      recEn = `As children mature, moving from all-encompassing protection toward respectful psychological autonomy sustains long-term closeness.`;
      trKo = "품 안의 자식에서 하나의 온전한 인격체로 인정받는 과정에서, 지나친 간섭은 방어적 침묵을 부르고 적절한 거리는 자발적 소통을 이끕니다.";
      trEn = "Over-involvement can trigger defensive withdrawal; granting dignified space naturally invites open, authentic conversation.";
      refKo = "문을 닫고 혼자만의 시간을 갖는 것은 가족을 밀어내는 것이 아니라 건강한 어른으로 자라나는 성장의 징표입니다.";
      refEn = "Needing personal space is not rejection—it is an essential developmental milestone of healthy maturation.";
      actKo = "방에 들어갈 때는 반드시 노크를 하고, 묻고 싶은 것이 있어도 상대방이 준비될 때까지 기다려주는 배려를 실천하세요.";
      actEn = "Always knock before entering personal rooms and patiently allow family members to share thoughts when they feel ready.";
      scripts = [
        {
          category: "boundary_respect",
          title_ko: "거리 존중과 열린 대화",
          title_en: "Respectful Boundary Script",
          speaker: "BOTH",
          dialogue_ko: `"혼자 생각 정리할 시간 필요하면 편하게 있어. 얘기하고 싶을 때 언제든 찾아와."`,
          dialogue_en: `"Take all the quiet time you need. Whenever you feel like talking, I'm always here."`,
        },
      ];
      roleRulesKo = ["사적인 영역을 캐묻지 않고 자율적으로 털어놓을 때까지 경청하기"];
      roleRulesEn = ["Respect private boundaries and listen attentively when thoughts are voluntarily shared."];
      break;

    case "family_scene_3_hidden_needs":
      headlineKo = "마음속 깊이 바랐던 '조건 없는 인정과 내 편이 되어주기'";
      headlineEn = "Unspoken emotional needs: Unconditional validation over behavioral correction";
      recKo = `${labelA}과 ${labelB} 모두 겉으로는 완벽하고 의연해 보여도, 속으로는 '내 수고와 힘듦을 있는 그대로 알아주었으면' 하는 인정에 대한 갈망이 있습니다.`;
      recEn = `Beneath strong exteriors, both ${labelA} and ${labelB} carry a deep yearning for their unseen efforts and vulnerabilities to be fully acknowledged.`;
      trKo = "부모의 훈계나 자녀의 침묵 뒤에는 '나를 있는 그대로 사랑해 줄까?'라는 원초적인 인정 욕구가 숨어 있습니다.";
      trEn = "Behind parental concern or filial quietude lies an instinctive longing for unconditional acceptance without strings attached.";
      refKo = "결과에 대한 평가보다 '그동안 애썼다'는 과정의 인정이 굳어있던 마음의 빗장을 여는 가장 강력한 열쇠입니다.";
      refEn = "Validating the exhausting process rather than grading the final outcome melts defensiveness instantly.";
      actKo = "잘잘못을 따지기 전에 '그동안 혼자 마음고생 많았지'라며 감정을 먼저 안아주세요.";
      actEn = "Before diagnosing what went wrong, hug the emotion first: acknowledge the heavy emotional burden carried alone.";
      scripts = [
        {
          category: "hidden_validation",
          title_ko: "진심 어린 수고 인정",
          title_en: "Heartfelt Effort Validation",
          speaker: "BOTH",
          dialogue_ko: `"결과가 어찌 됐든 네가 얼마나 치열하게 노력했는지 다 알아. 정말 자랑스러워."`,
          dialogue_en: `"Regardless of the outcome, I saw how fiercely you tried. I'm endlessly proud of you."`,
        },
      ];
      roleRulesKo = ["조언하기 전에 상대방의 감정적 수고를 먼저 100% 인정하기"];
      roleRulesEn = ["Validate emotional effort completely before offering any life guidance."];
      break;

    case "family_scene_4_praise":
      headlineKo = "자존감을 채워주는 맞춤형 칭찬과 성취 인정의 기술";
      headlineEn = "Tailored praise triggers: Celebrating intrinsic character and persistence";
      recKo = `막연한 '잘했다'는 말보다, 어떤 어려움을 어떻게 견뎌냈는지 구체적인 노력의 과정을 짚어줄 때 진정한 자존감이 살아납니다.`;
      recEn = `Generic compliments feel hollow; acknowledging specific perseverance and resilience anchors deep self-esteem.`;
      trKo = "결과 중심의 칭찬은 '다음에도 잘해야 한다'는 압박감을 주지만, 태도와 성장에 대한 칭찬은 실패를 두려워하지 않는 용기를 줍니다.";
      trEn = "Outcome praise creates performance anxiety, whereas recognizing inner tenacity builds courageous character.";
      refKo = "칭찬은 단순히 기분을 좋게 만드는 수단이 아니라, '너의 존재 가치'를 확인해 주는 사랑의 언어입니다.";
      refEn = "Thoughtful praise is an explicit affirmation of intrinsic human worth, not a behavioral reward.";
      actKo = "결과물 대신 상대방이 보여준 성실함, 배려심, 포기하지 않은 끈기를 구체적인 언어로 칭찬하세요.";
      actEn = "Praise specific virtues—kindness, consistency, and resilience—rather than mere external accolades.";
      scripts = [
        {
          category: "process_praise",
          title_ko: "과정 중심 칭찬",
          title_en: "Process-Centric Praise Script",
          speaker: "BOTH",
          dialogue_ko: `"힘든 상황에서도 포기하지 않고 끝까지 해낸 네 끈기가 정말 대단해."`,
          dialogue_en: `"Your resilience in pushing through despite such difficult obstacles is truly inspiring."`,
        },
      ];
      roleRulesKo = ["남과의 비교 칭찬을 금지하고 오직 어제보다 성장한 모습만 칭찬하기"];
      roleRulesEn = ["Never compare against peers; praise personal growth relative to the past."];
      break;

    case "family_scene_5_household_roles":
      headlineKo = "가사 루틴과 일상 돌봄에서의 공평하고 유연한 협력";
      headlineEn = "Domestic routine harmony: Collaborative living and chore balance";
      recKo = `집안 정리, 식사 준비, 일상 생활 습관에서 한 사람만 일방적으로 희생하지 않고 각자의 몫을 명확히 나누어 협력할 때 가정의 평화가 유지됩니다.`;
      recEn = `Peace at home thrives when domestic responsibilities and daily routines are shared equitably without single-party burnout.`;
      trKo = "반복되는 잔소리는 피로감을 부르고, 명확하게 고정된 역할 분담은 불필요한 마찰을 줄이고 협력의 보람을 줍니다.";
      trEn = "Repeated nagging drains domestic joy; clearly defined individual responsibilities eliminate daily friction.";
      refKo = "집안일은 '도와주는 것'이 아니라 '함께 가꾸는 삶의 터전'을 위한 공동의 기여입니다.";
      refEn = "Household care is not 'helping out'—it is an equal co-ownership of shared family living.";
      actKo = "가족회의를 통해 각자 맡을 가사 영역을 명확히 정하고, 완료된 일에 대해서는 아낌없는 감사를 표현하세요.";
      actEn = "Establish clear, visible chore ownership through a gentle family discussion and voice appreciation upon completion.";
      scripts = [
        {
          category: "chore_agreement",
          title_ko: "가사 분담 대화",
          title_en: "Household Chore Collaboration",
          speaker: "BOTH",
          dialogue_ko: `"분리수거랑 설거지는 내가 맡을 테니, 넌 빨래 개는 것만 부탁할게! 같이 하니까 훨씬 빠르네."`,
          dialogue_en: `"I'll handle the recycling and dishes if you can fold the laundry—working together makes it so much faster."`,
        },
      ];
      roleRulesKo = ["담당한 가사는 미루지 않고 스스로 챙기며 서로의 수고를 칭찬하기"];
      roleRulesEn = ["Take proactive ownership of assigned chores and acknowledge domestic labor."];
      break;

    case "family_scene_6_discipline_boundary":
      headlineKo = "훈육과 조언 과정에서 상처를 막는 안전한 경계선 설정";
      headlineEn = "Constructive guidance boundaries: Eliminating emotional punishment";
      recKo = `삶의 방향이나 생활 습관에 대해 조언할 때, 감정적 분노나 인신공격 없이 핵심 메시지만 차분하게 전달하는 경계선이 필요합니다.`;
      recEn = `When providing parental guidance or discussing difficult habits, separating constructive advice from emotional frustration protects mutual dignity.`;
      trKo = "화가 난 상태에서의 훈계는 교훈 대신 방어 기제와 반발심만 키우므로, 감정이 가라앉은 후 대화하는 지혜가 필수적입니다.";
      trEn = "Guidance delivered in anger fosters defiance rather than understanding; a calm, timeboxed discussion ensures guidance is heard.";
      refKo = "행동을 지적하는 것이지 인격을 부정하는 것이 아님을 분명히 밝힐 때 자녀는 상처받지 않고 배웁니다.";
      refEn = "Distinguishing the specific action from the child's inherent character prevents deep emotional scarring.";
      actKo = "감정이 격해질 때는 '10분 뒤에 다시 이야기하자'고 멈추고, 조언할 때는 '행동의 영향'에만 초점을 맞추세요.";
      actEn = "Pause heated moments with a 10-minute timeout and focus solely on the observable behavior rather than character labels.";
      scripts = [
        {
          category: "calm_guidance",
          title_ko: "차분한 경계 설정",
          title_en: "Calm Boundary Setting Script",
          speaker: "A",
          dialogue_ko: `"너를 비난하려는 게 아니라, 이 습관이 네 건강에 안 좋은 영향을 줄까 봐 걱정돼서 그래."`,
          dialogue_en: `"I'm not trying to criticize you; I'm genuinely concerned about the impact this habit is having on your wellbeing."`,
        },
      ];
      roleRulesKo = ["과거의 잘못을 들추지 않고 현재의 사안에만 집중하여 대화하기"];
      roleRulesEn = ["Never bring up past resolved errors; address only the present topic."];
      break;

    case "family_scene_7_crisis_recovery":
      headlineKo = "갈등 후 먼저 손 내밀어 서먹함을 녹이는 회복의 지혜";
      headlineEn = "Post-conflict reconciliation: Modeling emotional maturity and unconditional return";
      recKo = `크게 다투고 난 뒤 냉전 상태가 길어지지 않도록, 따뜻한 밥 한 끼나 작은 호의로 먼저 손을 내미는 화해의 공식이 필요합니다.`;
      recEn = `Following severe arguments, preventing prolonged cold wars requires a warm gesture—such as sharing a meal—to restore safe connection.`;
      trKo = "가족 간의 사과는 자존심의 굴복이 아니라 '우리의 관계가 이 갈등보다 훨씬 소중하다'는 성숙함의 선언입니다.";
      trEn = "A familial apology is not defeat; it is an empowering affirmation that the relationship outlasts any disagreement.";
      refKo = "다툼은 가족이 끝나는 신호가 아니라 서로의 속마음을 더 깊이 이해하기 위한 성장통입니다.";
      refEn = "Ruptures are not fractures; they are profound opportunities to learn each other's deeper emotional sensitivities.";
      actKo = "어색한 침묵을 깰 때 '밥 먹었어?'라는 소박한 질문이나 간식을 건네며 화해의 물꼬를 트세요.";
      actEn = "Break lingering tension with a simple, caring question—'Have you eaten?'—to bridge the silence with warmth.";
      scripts = [
        {
          category: "family_reconciliation",
          title_ko: "화해와 관계 회복",
          title_en: "Family Reconciliation Script",
          speaker: "BOTH",
          dialogue_ko: `"아까는 내가 말이 너무 심했어, 미안해. 좋아하는 반찬 해뒀으니 나와서 같이 밥 먹자."`,
          dialogue_en: `"My words were too harsh earlier—I'm truly sorry. I made your favorite dish, let's eat together."`,
        },
      ];
      roleRulesKo = ["갈등 후 24시간 이상 냉전을 지속하지 않고 먼저 손 내밀기"];
      roleRulesEn = ["Never allow silent treatments to exceed 24 hours; take the courageous first step toward connection."];
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

export function composeFamilyNarrative(plan: DomainStoryPlan): DomainNarrativePlan {
  const nameA = plan.parties.a_name || "A";
  const nameB = plan.parties.b_name || "B";
  const roleA = plan.parties.a_role_label;
  const roleB = plan.parties.b_role_label;

  const scenes = plan.scenes.map((s) =>
    composeFamilyScene(s, nameA, nameB, roleA, roleB)
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
    domain: "family",
    parties: plan.parties,
    overall_confidence: plan.overall_confidence,
    overview: {
      headline_ko: `${nameA}님과 ${nameB}님의 가족 스토리: 사랑을 확인하고 상처 없이 성장하는 7가지 지혜`,
      headline_en: `Parent-Child Family Playbook for ${nameA} & ${nameB}: 7 Pillars of Nurturing Connection`,
      summary_ko: "정서적 온기, 건강한 거리두기, 숨겨진 인정 욕구, 맞춤형 칭찬, 가사 협력, 비폭력 훈육, 갈등 회복까지 대를 잇는 든든한 가족 안식처 가이드입니다.",
      summary_en: "A compassionate parent-child guide spanning emotional warmth, healthy autonomy, validation, praise triggers, domestic teamwork, and peaceful reconciliation.",
      core_vibe_badge_ko: "무조건적 사랑과 자율적 존중의 가족",
      core_vibe_badge_en: "Unconditional Love & Respectful Autonomy",
    },
    scenes,
    action_playbook: {
      summary_ko: "지나친 간섭을 멈추고 자율성을 인정하며, 결과보다 과정의 수고를 먼저 안아줄 때 가족의 유대감은 가장 단단해집니다.",
      summary_en: "Replace control with empowering autonomy and validate effort before diagnosing outcomes to cultivate resilient family trust.",
      golden_rules_ko: [
        "성장에 따른 독립 공간과 개인 시간을 온전히 존중한다.",
        "조언하기 전에 상대방의 감정적 수고를 먼저 100% 인정한다.",
        "갈등 후에는 밥 한 끼나 따뜻한 안부로 먼저 손을 내민다.",
      ],
      golden_rules_en: [
        "Fully respect personal privacy and autonomous developmental timing.",
        "Validate unseen emotional effort before providing any life advice.",
        "Bridge post-argument silence swiftly through shared meals and care.",
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
