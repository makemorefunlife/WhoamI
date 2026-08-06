/**
 * Work / Coworker Domain 7-Scene Narrative Composer
 *
 * Deterministically translates a Work DomainStoryPlan into professional,
 * actionable, and bilingual (KO/EN) 4-beat narrative scenes conforming to the
 * Work Product Blueprint and Ahaitsme Narrative Style Bible.
 */

import type { DomainStoryPlan, DomainStoryScene } from "../storyPlannerTypes";
import type {
  DomainNarrativePlan,
  DomainNarrativeScene,
  NarrativeScriptItem,
} from "../narrativeTypes";

function composeWorkScene(
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
      headline_ko: `${scene.title_ko}: 표준 업무 협업 기준선`,
      headline_en: `${scene.title_en}: Standard collaborative baseline`,
      recognition_ko: `${nameA}님과 ${nameB}님의 구체적인 업무 성향 데이터가 수렴될 때까지 이 영역은 표준 협업 프로토콜을 준수합니다. 명확한 문서화와 주간 싱크를 권장합니다.`,
      recognition_en: `Until specific work dynamic evidence is confirmed, a standard collaborative baseline applies between ${nameA} and ${nameB}. Clear documentation and weekly syncs are recommended.`,
      translation_ko: "시주 미상 또는 심리 척도 중립 상태로 인해, 편향 없는 직무 표준 가이드를 적용합니다.",
      translation_en: "Due to unknown birth hour or neutral psych scores, standard professional guidelines are applied.",
      reframing_ko: "역할이 고정되지 않고 유연하게 프로젝트 요구사항에 맞추어 적응할 수 있는 상태입니다.",
      reframing_en: "Indicates an adaptable dynamic where roles can be assigned based on project requirements.",
      action_guidance_ko: "정기적인 업무 리뷰와 역할 정의 회의를 통해 상호 기대치를 일치시키세요.",
      action_guidance_en: "Align expectations through regular reviews and clear task assignment meetings.",
      scripts: [
        {
          category: "work_sync",
          title_ko: "업무 싱크 확인",
          title_en: "Task Alignment Sync",
          speaker: "BOTH",
          dialogue_ko: `"이번 스프린트 목표와 우선순위 공유드립니다. 확인 후 피드백 부탁드립니다."`,
          dialogue_en: `"Sharing the sprint goals and priorities. Please review and let me know your thoughts."`,
        },
      ],
      role_rules_ko: ["모든 핵심 결정사항은 서면(티켓/슬랙)으로 기록하고 공유하기"],
      role_rules_en: ["Document and share all critical decisions in writing."],
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
    case "work_scene_1_leadership":
      headlineKo = `${lead}님의 방향 제시와 ${partner}님의 체계적 실행이 이끄는 리더십 분담`;
      headlineEn = `Strategic leadership alignment: ${lead}'s directional drive complemented by ${partner}'s structural execution`;
      recKo = `프로젝트의 큰 그림을 그리고 전략을 수립할 때 ${lead}님이 방향키를 쥐면, ${partner}님이 리스크를 점검하고 실행 로드맵을 체계화하는 최적의 리더십 밸런스를 보여줍니다.`;
      recEn = `When setting strategic direction, ${lead} provides high-level vision while ${partner} stress-tests risks and operationalizes the roadmap.`;
      trKo = directionality.impact_on_a_ko
        ? `${nameA}님에게는 ${directionality.impact_on_a_ko}, ${nameB}님에게는 ${directionality.impact_on_b_ko}의 업무 에너지가 교차하며 건강한 공동 설계를 이룹니다.`
        : "기획력과 실행 검증의 교차 조합으로 프로젝트의 사각지대를 없애는 상호 보완적 의사결정 체계가 작동합니다.";
      trEn = `The complementary skill sets eliminate blind spots, creating a robust dual-lead governance structure.`;
      refKo = "두 사람 모두 책임감이 강할 때 영역 침범으로 인한 주도권 갈등이 생길 수 있으므로, 프로젝트별 최종 의사결정자(DRI)를 사전에 정의해야 합니다.";
      refEn = "High mutual ownership can lead to overlapping jurisdiction; defining a Single Directly Responsible Individual (DRI) per domain ensures frictionless momentum.";
      actKo = "기획 단계에서 최종 승인권자와 실행 주관자의 역할을 명문화하고 영역별 권한을 전적으로 위임하세요.";
      actEn = "Explicitly codify the approval owner versus execution lead at kickoff and delegate full autonomy within domains.";
      scripts = [
        {
          category: "leadership_raci",
          title_ko: "권한 위임 및 DRI 설정",
          title_en: "Authority Delegation & DRI Agreement",
          speaker: "A",
          dialogue_ko: `"이번 건은 ${partner}님의 전문성이 중요한 영역이니, 최종 의사결정권을 위임하고 저는 리소스 지원에 집중하겠습니다."`,
          dialogue_en: `"This feature requires your domain expertise, so I'm delegating final call authority to you while I focus on unblocking resources."`,
        },
      ];
      roleRulesKo = ["프로젝트 착수 시 RACI 매트릭스를 정의하고 상대방 영역의 결정 존중하기"];
      roleRulesEn = ["Define a clear RACI matrix at project kickoff and respect domain ownership."];
      break;

    case "work_scene_2_execution":
      headlineKo = "빠른 프로토타이핑과 정밀한 완성도의 조화로운 실행 템포";
      headlineEn = "Optimized execution cadence: Fast-paced prototyping balanced with precision delivery";
      recKo = `업무를 추진할 때 속도감 있게 핵심 가설을 검증하는 동력과 결과물의 완성도를 끌어올리는 꼼꼼함이 만나 높은 생산성을 만듭니다.`;
      recEn = `Rapid hypothesis validation meets meticulous quality control, driving high-velocity yet stable project delivery.`;
      trKo = "초기 발산 속도와 후반 수렴 안정성이 조화를 이루어, 납기 준수와 품질 유지라는 두 마리 토끼를 잡을 수 있습니다.";
      trEn = "Balancing agile early sprints with structured closing phases ensures both deadline adherence and production quality.";
      refKo = "속도 지향적 태도가 꼼꼼함을 답답해하거나 반대로 세밀한 검증이 속도를 불안해하지 않도록, 개발/기획 단계별 마일스톤을 명확히 구분하세요.";
      refEn = "Preventing speed-versus-perfection friction requires explicit phase separation: rapid draft mode followed by polish mode.";
      actKo = "초기 '러프한 가설 검증' 단계와 후반 '안정화 및 QA' 단계를 분리하여 일정표에 반영하세요.";
      actEn = "Explicitly separate the rapid exploratory phase from the rigorous QA phase on sprint timelines.";
      scripts = [
        {
          category: "sprint_pacing",
          title_ko: "단계별 완성도 합의",
          title_en: "Phase-based Quality Sync",
          speaker: "BOTH",
          dialogue_ko: `"지금은 v1 초안 검증 단계이니 80% 완성도로 빠르게 공유하고, 다음 주에 디테일을 함께 보완하시죠."`,
          dialogue_en: `"Since this is the v1 draft validation phase, let's ship at 80% fidelity and polish the fine details next week."`,
        },
      ];
      roleRulesKo = ["초안 단계에서는 속도에, 배포 전 단계에서는 안정성에 우선순위 두기"];
      roleRulesEn = ["Prioritize velocity during drafts and uncompromising stability prior to launch."];
      break;

    case "work_scene_3_decision":
      headlineKo = "불확실한 상황에서 신속한 결단과 데이터 검증의 의사결정 균형";
      headlineEn = "Balanced decision heuristics: Fast-track pivoting paired with analytical rigor";
      recKo = `새로운 기능 런칭이나 방향 전환이 필요할 때, 직관적인 빠른 가설 수립과 냉철한 지표 분석이 상호 보완되어 실패 확률을 최소화합니다.`;
      recEn = `When pivoting or launching features, fast intuitive hypothesis formulation and rigorous metrics analysis combine to derisk execution.`;
      trKo = "되돌릴 수 있는 결정(Type 2)은 신속하게 실행하고, 되돌릴 수 없는 결정(Type 1)은 다각도로 검토하는 지혜로운 기준을 공유합니다.";
      trEn = "Distinguishing between reversible decisions (Type 2) and irreversible architecture (Type 1) prevents organizational bottlenecks.";
      refKo = "의견 대립은 불협화음이 아니라 비즈니스 리스크를 사전에 걸러내는 가장 저렴한 품질 보증 과정입니다.";
      refEn = "Debate on strategy is not friction; it is the most cost-effective pre-mortem process for the business.";
      actKo = "결정 지연이 발생할 경우 '실패했을 때 감당 가능한 비용'을 기준으로 의사결정 타임라인을 설정하세요.";
      actEn = "When deliberations stall, establish a timeboxed decision framework based on the reversibility of the outcome.";
      scripts = [
        {
          category: "decision_framework",
          title_ko: "가역적 결정 신속 추진",
          title_en: "Reversible Decision Fast-Track",
          speaker: "BOTH",
          dialogue_ko: `"이 사안은 수정이 용이한 가역적 결정이니, 우선 2주간 A안으로 테스트하고 데이터를 확인하죠."`,
          dialogue_en: `"Since this is easily reversible, let's ship Option A for a two-week test and let user data decide."`,
        },
      ];
      roleRulesKo = ["데이터가 부족할 때는 작은 실험으로 가설을 먼저 검증하기"];
      roleRulesEn = ["When data is scarce, run micro-experiments rather than engaging in prolonged theoretical debates."];
      break;

    case "work_scene_4_synergy":
      headlineKo = "서로 다른 무기가 결합될 때 발생하는 독보적인 직무 시너지";
      headlineEn = "Cross-functional synergy: Unlocking unmatched collective superpowers";
      recKo = `${nameA}님의 전문 영역과 ${nameB}님의 핵심 역량이 융합될 때, 단독으로는 해결하기 어려운 복합적인 비즈니스 과제를 탁월하게 돌파합니다.`;
      recEn = `When ${nameA}'s domain mastery combines with ${nameB}'s analytical strengths, complex cross-functional challenges are resolved effortlessly.`;
      trKo = "서로의 강점을 정확히 인정하고 상대방의 영역을 믿고 맡길 때 1+1 이상의 폭발적인 시너지가 발현됩니다.";
      trEn = "Uncompromising mutual respect for distinct competencies unlocks compounding organizational velocity.";
      refKo = "서로의 업무 방식 차이는 비효율이 아니라 문제를 다각도에서 바라볼 수 있게 해주는 가장 강력한 경쟁력입니다.";
      refEn = "Divergent operational habits are not friction—they represent multifaceted problem-solving capability.";
      actKo = "분기별로 상호 기여도를 축하하고, 두 사람의 협업 성공 모델을 팀 전체의 베스트 프랙티스로 전파하세요.";
      actEn = "Celebrate shared milestone wins quarterly and codify your collaboration patterns as company-wide best practices.";
      scripts = [
        {
          category: "synergy_recognition",
          title_ko: "협업 시너지 감사",
          title_en: "Collaborative Synergy Validation",
          speaker: "BOTH",
          dialogue_ko: `"이번 프로젝트는 두 사람의 강점이 완벽하게 맞아떨어져서 가능했습니다. 다음 목표도 함께하시죠!"`,
          dialogue_en: `"This delivery succeeded because our respective strengths locked together seamlessly. Excited for our next milestone!"`,
        },
      ];
      roleRulesKo = ["동료의 전문성을 공개적으로 인정하고 상호 보완적 팀워크 구축하기"];
      roleRulesEn = ["Publicly champion your coworker's domain expertise and foster an empowering partnership."];
      break;

    case "work_scene_5_autonomy":
      headlineKo = "과도한 확인을 없애고 자율성을 극대화하는 비동기 업무 계약";
      headlineEn = "Anti-micromanagement guardrails: Asynchronous autonomy contracts that foster high trust";
      recKo = `잦은 구두 확인이나 실시간 독촉 없이도 정해진 이슈 트래커와 슬랙 스레드를 통해 진행 상황을 자율적으로 투명하게 공유할 때 최고의 몰입이 가능합니다.`;
      recEn = `High-trust collaboration flourishes when continuous verbal check-ins are replaced with transparent, asynchronous progress dashboards.`;
      trKo = "깊은 업무 몰입(Deep Work)을 방해받지 않는 독립적 실행 시간 보장이 번아웃을 막고 산출물의 밀도를 높입니다.";
      trEn = "Guaranteed uninterrupted deep-work blocks protect against context-switching fatigue and maximize cognitive output.";
      refKo = "진행 상황을 묻는 것은 불신이 아니라 전체 일정 관리를 위한 불안감 때문입니다. 선제적인 현황 공유가 자율성을 확보해 줍니다.";
      refEn = "Status inquiries reflect project timeline accountability, not personal distrust; proactive updates guarantee continuous autonomy.";
      actKo = "오전 10~12시는 '무음 집중 블록'으로 지정하고, 일일 스탠드업 대신 비동기 슬랙 봇을 활용하여 회의 피로를 최소화하세요.";
      actEn = "Designate morning blocks as silent focus hours and replace sync standups with asynchronous status bots to avoid meeting fatigue.";
      scripts = [
        {
          category: "async_status",
          title_ko: "선제적 비동기 현황 공유",
          title_en: "Proactive Async Status Update",
          speaker: "BOTH",
          dialogue_ko: `"현재 태스크 70% 완료되었고 내일 오후 3시까지 PR 올리겠습니다. 특이 블로커는 없습니다."`,
          dialogue_en: `"Task is currently at 70%; PR will be ready tomorrow by 3 PM. No blockers currently."`,
        },
      ];
      roleRulesKo = ["정해진 마일스톤 전에는 불필요한 중간 개입을 자제하고 자율성 보장하기"];
      roleRulesEn = ["Refrain from ad-hoc mid-sprint interruptions and respect assigned ownership."];
      break;

    case "work_scene_6_stress":
      headlineKo = "프로젝트 마감 압박 속 무비난 원칙과 지속 가능한 페이스 유지";
      headlineEn = "High-pressure resilience: Blameless post-mortem culture and sustainable pacing";
      recKo = `릴리즈 직전의 긴급 장애나 고부하 상황에서도 누구의 탓을 하기보다 시스템 개선에 집중하는 무비난(Blameless) 문화가 조직의 회복 탄력성을 지켜줍니다.`;
      recEn = `Under release crunch or incident triage, a blameless culture focused on systemic fixes preserves team cohesion and velocity.`;
      trKo = "스트레스 상황에서 감정의 온도가 높아지는 것을 감지하고, 인시던트 종료 후 즉각적인 심리적 안도감을 제공합니다.";
      trEn = "Recognizing heightened emotional temperature during crunches allows the team to decompress swiftly once stabilized.";
      refKo = "장애나 실수는 개인의 무능이 아니라 프로세스 결함의 신호입니다. 이를 함께 고쳐나갈 때 시스템이 견고해집니다.";
      refEn = "Incidents are signals of process gaps, not personal failures; addressing root causes builds an antifragile workflow.";
      actKo = "고강도 스프린트 직후에는 반드시 팀 회고와 리프레시 시간을 배정하여 번아웃을 선제적으로 차단하세요.";
      actEn = "Schedule mandatory retrospectives and recovery buffers immediately following high-intensity product releases.";
      scripts = [
        {
          category: "blameless_postmortem",
          title_ko: "무비난 원인 분석 회고",
          title_en: "Blameless Root-Cause Retrospective",
          speaker: "BOTH",
          dialogue_ko: `"장애 대응 정말 고생 많으셨습니다. 이번 이슈를 계기로 재발 방지 모니터링 룰을 추가하시죠."`,
          dialogue_en: `"Incredible effort during incident triage. Let's use this learning to implement automated regression safeguards."`,
        },
      ];
      roleRulesKo = ["인시던트 발생 시 원인 분석에 집중하고 개인에 대한 책임 전가 금지"];
      roleRulesEn = ["Focus entirely on root cause analysis and prohibit personal blame during incident reviews."];
      break;

    case "work_scene_7_feedback_recovery":
      headlineKo = "인격적 비판을 배제하고 과업 성과에 집중하는 객관적 피드백과 회복";
      headlineEn = "Constructive feedback safety & sustainable burnout recovery";
      recKo = `결과물에 대한 리뷰나 개선점 전달 시, 감정적 소모 없이 데이터와 구체적 행동(SBI)에 기반한 피드백이 오갈 때 심리적 안전감이 단단해집니다.`;
      recEn = `Critiques delivered through objective data and behavioral observation (Situation-Behavior-Impact) build deep professional psychological safety.`;
      trKo = "직설적 화법이 의도치 않게 상대의 전문성을 부정하는 느낌을 주지 않도록, 해결책 중심의 제안형 화법이 관계를 보호합니다.";
      trEn = "Constructive phrasing focused on outcomes prevents direct feedback from being misconstrued as personal competence doubt.";
      refKo = "날카로운 피드백은 상대방의 성장을 바라는 높은 기대치에서 나옵니다. 맥락(Why)을 먼저 공유하면 오해 없이 수용됩니다.";
      refEn = "Direct feedback stems from high shared standards; framing the broader context ('Why') first ensures seamless receptivity.";
      actKo = "피드백을 줄 때는 '상황(Situation) - 관찰된 현상(Behavior) - 비즈니스 영향(Impact)' 순서로 전달하고, 갈등 발생 시 24시간 내에 '비즈니스 목표 정렬 대화'로 복원하세요.";
      actEn = "Structure feedback using Situation-Behavior-Impact, and initiate a business-alignment dialogue within 24 hours if conflict occurs.";
      scripts = [
        {
          category: "sbi_feedback",
          title_ko: "객관적 개선 피드백",
          title_en: "Objective Improvement Feedback",
          speaker: "BOTH",
          dialogue_ko: `"이 부분은 유저 이탈률을 낮추기 위해 이런 방식으로 대안을 테스트해 보면 어떨까요?"`,
          dialogue_en: `"To mitigate user drop-off here, what do you think about A/B testing this alternative approach?"`,
        },
      ];
      roleRulesKo = ["피드백은 산출물에 한정하고 칭찬과 개선점을 샌드위치 구조로 전달하기"];
      roleRulesEn = ["Direct all critique solely at deliverables and balance improvements with recognized wins."];
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

export function composeWorkNarrative(plan: DomainStoryPlan): DomainNarrativePlan {
  const nameA = plan.parties.a_name || "A";
  const nameB = plan.parties.b_name || "B";

  const scenes = plan.scenes.map((s) =>
    composeWorkScene(s, nameA, nameB)
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
    domain: "work",
    parties: plan.parties,
    overall_confidence: plan.overall_confidence,
    overview: {
      headline_ko: `${nameA}님과 ${nameB}님의 직무 협업 스토리: 역할 분담과 상호 보완의 7가지 원칙`,
      headline_en: `Professional Collaboration Playbook for ${nameA} & ${nameB}: 7 Core Principles of Synergy`,
      summary_ko: "리더십 분담, 실행 템포, 비동기 자율성, 피드백 안전성, 무비난 스트레스 관리까지 비즈니스 임팩트를 극대화하는 고성과 협업 가이드입니다.",
      summary_en: "A high-performance workplace playbook covering leadership alignment, sprint velocity, async autonomy, feedback safety, and blameless resilience.",
      core_vibe_badge_ko: "상호 신뢰와 고성과 전문성 파트너십",
      core_vibe_badge_en: "High-Trust Professional Excellence",
    },
    scenes,
    action_playbook: {
      summary_ko: "권한의 경계를 사전에 명확히 합의하고, 객관적이고 비동기적인 업무 방식을 정착시킬 때 최고의 성과가 창출됩니다.",
      summary_en: "Establish explicit domain ownership early and anchor communication in objective, asynchronous workflows.",
      golden_rules_ko: [
        "영역별 최종 의사결정자(DRI)를 명문화하고 권한을 전적으로 위임한다.",
        "피드백은 산출물과 구체적 행동에 한정하여 감정 소모를 차단한다.",
        "인시던트 발생 시 개인을 탓하지 않고 프로세스 개선에 집중한다.",
      ],
      golden_rules_en: [
        "Codify the DRI per domain and empower full autonomous execution.",
        "Anchor all critiques strictly in deliverables using SBI principles.",
        "Maintain a blameless post-mortem posture focused on process refinement.",
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
