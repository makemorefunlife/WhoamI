import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  josaIGa,
  josaEunNeun,
  josaGwaWa,
  josaEulReul,
} from "@/lib/relationship/romantic/prototypeV4/romanticLanguage";
import { pick } from "./familyParentCopy";

export type RoleDimensions = {
  stabilizing: number;
  careTaking: number;
  mediating: number;
  directing: number;
  depending: number;
  emotionalMonitoring: number;
  problemSolving: number;
  tensionReleasing: number;
  adapting: number;
  distancing: number;
  responsibilityCarrying: number;
  protecting: number;
  boundarySetting: number;
  followingSensitivity: number;
  emotionalCarrying: number;
  practicalOrganizing: number;
};

export type FamilyMemberRoleProfile = {
  normalRoleLabel: string;
  normalRoleDesc: string;
  stressRoleLabel: string;
  stressRoleDesc: string;
  behavioralMeaning: string;
  dimensions: RoleDimensions;
};

export type UnexpectedRoleResult = {
  roleLabel: string;
  roleTitle: string;
  roleDescription: string;
  evidenceReason: string;
} | null;

export type RoleReversalResult = {
  isReversed: boolean;
  reversalType: "emotional" | "practical" | "social" | "conflict" | "none";
  reversalNature: "playful_healthy" | "situational" | "potentially_burdensome";
  description: string;
} | null;

export type RoleBurdenResult = {
  targetPerson: "parent" | "child" | "both" | "none";
  burdenType: "peacekeeping" | "decision" | "emotional_container" | "parentification" | "none";
  burdenTitle: string;
  burdenDescription: string;
  guidanceImplication: string;
};

export type FamilyRoleIntelligenceOutput = {
  pairStructureOverview: string;
  parentRoleProfile: FamilyMemberRoleProfile;
  childRoleProfile: FamilyMemberRoleProfile;
  unexpectedRole: UnexpectedRoleResult;
  roleReversal: RoleReversalResult;
  pairCausalMechanism: string;
  pairSynergyWhenSmooth: string;
  roleBurden: RoleBurdenResult;
};

export function evaluateRoleDimensions(
  personType: "parent" | "child",
  ctx: FamilyRuleContext,
  psych?: PsychMasterJson | null,
): RoleDimensions {
  const tenGod = ctx.tenGod;
  const counts = personType === "parent" ? tenGod.countsParent : tenGod.countsChild;

  const bigeob = counts?.bigeob ?? 0;
  const siksang = counts?.siksang ?? 0;
  const jaeseong = counts?.재성 ?? 0;
  const gwanseong = counts?.gwanseong ?? 0;
  const insoeng = counts?.insoeng ?? 0;

  const sec = psych?.secondary_axes;
  const conn = sec?.connection ?? 50;
  const struct = sec?.structure ?? 50;
  const flex = sec?.flexibility ?? 50;
  const express = sec?.expressiveness ?? 50;

  return {
    stabilizing: Math.min(100, gwanseong * 25 + struct * 0.4 + (personType === "parent" ? 15 : 0)),
    careTaking: Math.min(100, insoeng * 20 + siksang * 15 + conn * 0.3),
    mediating: Math.min(100, flex * 0.5 + conn * 0.3 + (bigeob > 1 ? 15 : 0)),
    directing: Math.min(100, gwanseong * 30 + struct * 0.3),
    depending: Math.min(100, (personType === "child" ? 30 : 10) + (100 - struct) * 0.3 + insoeng * 10),
    emotionalMonitoring: Math.min(100, conn * 0.5 + express * 0.3 + insoeng * 15),
    problemSolving: Math.min(100, jaeseong * 30 + struct * 0.3),
    tensionReleasing: Math.min(100, express * 0.5 + siksang * 25),
    adapting: Math.min(100, flex * 0.6 + conn * 0.2),
    distancing: Math.min(100, bigeob * 25 + (100 - conn) * 0.3),
    responsibilityCarrying: Math.min(100, gwanseong * 25 + insoeng * 20 + (personType === "child" ? 10 : 20)),
    protecting: Math.min(100, (personType === "parent" ? 30 : 10) + gwanseong * 20 + insoeng * 20),
    boundarySetting: Math.min(100, gwanseong * 30 + (100 - flex) * 0.3),
    followingSensitivity: Math.min(100, express * 0.4 + flex * 0.4),
    emotionalCarrying: Math.min(100, insoeng * 30 + conn * 0.3),
    practicalOrganizing: Math.min(100, jaeseong * 25 + struct * 0.4),
  };
}

export function buildFamilyRoleIntelligence(
  ctx: FamilyRuleContext,
  personCorePsych?: {
    psychA?: PsychMasterJson | null;
    psychB?: PsychMasterJson | null;
  },
): FamilyRoleIntelligenceOutput {
  const locale = ctx.locale;
  const parentName = ctx.parentNickname || pick(locale, "Parent", "부모");
  const childName = ctx.childNickname || pick(locale, "Child", "자녀");

  const pIGa = josaIGa(parentName);
  const pEunNeun = josaEunNeun(parentName);
  const pGwaWa = josaGwaWa(parentName);

  const cIGa = josaIGa(childName);
  const cEunNeun = josaEunNeun(childName);
  const cGwaWa = josaGwaWa(childName);
  const cEulReul = josaEulReul(childName);

  const psychParent = ctx.roles.roleA !== "child" ? (personCorePsych?.psychA ?? null) : (personCorePsych?.psychB ?? null);
  const psychChild = ctx.roles.roleA !== "child" ? (personCorePsych?.psychB ?? null) : (personCorePsych?.psychA ?? null);

  const pDims = evaluateRoleDimensions("parent", ctx, psychParent);
  const cDims = evaluateRoleDimensions("child", ctx, psychChild);

  const bondScore = ctx.masterScores.bond;
  const synergyScore = ctx.masterScores.synergy;
  const riskScore = ctx.masterScores.risk;

  // 1. 우리 가족의 기본 구도
  let pairStructureOverview = "";
  if (synergyScore >= 75) {
    pairStructureOverview = pick(
      locale,
      `In this family, ${parentName} sets clear safety rails while ${childName} actively explores, creating a complementary growth partnership.`,
      `우리 가족 안에서 ${pEunNeun} 큰 틀의 안전선과 원칙을 다져주고, ${cEunNeun} 그 안에서 주도적으로 시도하며 서로의 자리를 든든하게 채워주는 상호보완적 구도를 이룹니다.`,
    );
  } else if (bondScore >= 70) {
    pairStructureOverview = pick(
      locale,
      `${parentName} serves as a warm emotional sanctuary for ${childName}, maintaining deep mutual trust and frequent emotional exchange.`,
      `${pEunNeun} ${cGwaWa} 깊은 정서적 교감을 나누며, 서로의 감정을 따뜻하게 수용하고 안도감을 주고받는 유대 중심의 구도를 형성하고 있습니다.`,
    );
  } else {
    pairStructureOverview = pick(
      locale,
      `${parentName} and ${childName} respect each other's processing pace, balancing closeness with independent boundary space.`,
      `${pEunNeun} ${cGwaWa} 각자의 정리 템포와 개인 공간을 존중하며, 너무 바짝 붙기보다 적절한 신뢰 거리를 유지할 때 가장 편안하게 작동하는 구조입니다.`,
    );
  }

  // 2. 부모의 역할 프로필
  let pNormalLabel = "";
  let pNormalDesc = "";
  let pStressLabel = "";
  let pStressDesc = "";
  let pMeaning = "";

  if (pDims.directing >= 65) {
    pNormalLabel = pick(locale, "Structure & Boundary Holder", "든든한 방향 제시자");
    pNormalDesc = pick(locale, "Establishes clear rules and grounds the family's stability.", "가족의 원칙과 울타리를 명확히 잡고 안정감을 다집니다.");
  } else if (pDims.careTaking >= 65) {
    pNormalLabel = pick(locale, "Warm Emotional Haven", "정서적 안식처");
    pNormalDesc = pick(locale, "Listens warmly and supports emotional wellbeing.", "아이의 지친 마음을 먼저 안아주고 이야기를 들어줍니다.");
  } else if (pDims.tensionReleasing >= 65) {
    pNormalLabel = pick(locale, "Atmosphere Lifter", "분위기 이완 담당");
    pNormalDesc = pick(locale, "Brings light humor and positive energy into daily life.", "밝은 에너지를 발산하며 집안 분위기를 유쾌하게 만듭니다.");
  } else {
    pNormalLabel = pick(locale, "Steady Observer", "잔잔한 조망자");
    pNormalDesc = pick(locale, "Gives space while remaining reliably nearby.", "한발 떨어져 조용히 지켜보며 필요할 때 버팀목이 됩니다.");
  }

  if (riskScore >= 60 || pDims.boundarySetting >= 65) {
    pStressLabel = pick(locale, "Rapid Checker & Frame Setter", "세밀한 가이드 점검자");
    pStressDesc = pick(locale, "Becomes eager to confirm details and re-establish control.", "불안이 오르면 상태를 빠르게 확인하고 가이드를 조급하게 정돈하려 합니다.");
  } else if (pDims.careTaking >= 60) {
    pStressLabel = pick(locale, "Anxious Approacher", "조급한 정서 확인자");
    pStressDesc = pick(locale, "Approaches rapidly to check feelings, seeking immediate reassurance.", "아이의 기분을 즉시 확인하고 싶어 마음이 다급해질 수 있습니다.");
  } else {
    pStressLabel = pick(locale, "Quiet Re-organizer", "침착한 원칙 정리자");
    pStressDesc = pick(locale, "Steps back to evaluate consequences objectively.", "상황을 객관적으로 분석하여 다음 대안을 정돈합니다.");
  }

  pMeaning = pick(
    locale,
    `${parentName} provides the structural anchor, ensuring ${childName} feels protected even during emotional waves.`,
    `${pEunNeun} 일상에서는 ${cIGa} 안전하게 자랄 수 있는 기둥 역할을 맡으며, 긴장 순간에는 상황을 수습하고 선을 잡아주려 움직이는 위치에 서게 됩니다.`,
  );

  const parentRoleProfile: FamilyMemberRoleProfile = {
    normalRoleLabel: pNormalLabel,
    normalRoleDesc: pNormalDesc,
    stressRoleLabel: pStressLabel,
    stressRoleDesc: pStressDesc,
    behavioralMeaning: pMeaning,
    dimensions: pDims,
  };

  // 3. 자녀의 역할 프로필
  let cNormalLabel = "";
  let cNormalDesc = "";
  let cStressLabel = "";
  let cStressDesc = "";
  let cMeaning = "";

  if (cDims.responsibilityCarrying >= 65 || cDims.stabilizing >= 60) {
    cNormalLabel = pick(locale, "Self-Reliant Center", "주도적 신뢰 기둥");
    cNormalDesc = pick(locale, "Takes responsibility independently and grounds own decisions.", "자신의 일과 행동에 주도성을 발휘하며 스스로 중심을 잡습니다.");
  } else if (cDims.tensionReleasing >= 65) {
    cNormalLabel = pick(locale, "Joyful Spark", "활력과 표현의 유발자");
    cNormalDesc = pick(locale, "Expresses feelings freely and brings active energy to the home.", "자기감정을 있는 그대로 표현하며 일상에 활력을 불어넣습니다.");
  } else if (cDims.emotionalMonitoring >= 65) {
    cNormalLabel = pick(locale, "Atmosphere Radar", "감정 템포 감지자");
    cNormalDesc = pick(locale, "Senses changes in household atmosphere quickly.", "부모의 기분과 집안 분위기 변화를 가장 먼저 알아차립니다.");
  } else {
    cNormalLabel = pick(locale, "Autonomous Explorer", "독립적 탐색자");
    cNormalDesc = pick(locale, "Explores at personal pace, valuing own private space.", "자기만의 페이스로 생각을 정돈하며 자율성을 소중히 여깁니다.");
  }

  if (cDims.distancing >= 60 || riskScore >= 60) {
    cStressLabel = pick(locale, "Defensive Processing Cave", "혼자만의 내면 정리자");
    cStressDesc = pick(locale, "Withdraws into private space to process emotions before talking.", "감정이 격해지면 입을 닫고 자기 공간으로 들어가 마음을 삭입니다.");
  } else if (cDims.emotionalMonitoring >= 60) {
    cStressLabel = pick(locale, "Atmosphere Peacekeeper", "분위기 눈치 중재자");
    cStressDesc = pick(locale, "Monitors parent reactions closely to avoid causing friction.", "부모의 표정을 살피며 마찰을 피하기 위해 스스로 조심하려 합니다.");
  } else {
    cStressLabel = pick(locale, "Direct Expresser", "즉각적 의사 표현자");
    cStressDesc = pick(locale, "States feelings directly when boundaries feel challenged.", "자율성이 침해받는다고 느끼면 아쉬움을 솔직히 개진합니다.");
  }

  cMeaning = pick(
    locale,
    `${childName} builds personal independence, naturally testing boundaries while relying on ${parentName}'s support.`,
    `${cEunNeun} ${pGwaWa}의 관계 속에서 자기 지분을 넓혀가는 위치에 있으며, 평소에는 자율적으로 행동하다가 힘든 순간에는 부모의 울타리를 재확인합니다.`,
  );

  const childRoleProfile: FamilyMemberRoleProfile = {
    normalRoleLabel: cNormalLabel,
    normalRoleDesc: cNormalDesc,
    stressRoleLabel: cStressLabel,
    stressRoleDesc: cStressDesc,
    behavioralMeaning: cMeaning,
    dimensions: cDims,
  };

  // 4. 의외로 드러나는 역할 (Unexpected Role Detection with Multi-Signal Thresholding)
  let unexpectedRole: UnexpectedRoleResult = null;

  // Pattern A: 자녀가 오히여 중심을 잡음 ("작은 어른")
  if (cDims.responsibilityCarrying >= 60 && cDims.stabilizing >= 55 && pDims.careTaking < 55) {
    unexpectedRole = {
      roleLabel: pick(locale, "Little Adult", "작은 어른"),
      roleTitle: pick(locale, "Child grounding the atmosphere", "가족 분위기가 흔들릴 때 먼저 중심을 잡는 자리"),
      roleDescription: pick(
        locale,
        `${childName} displays strong internal responsibility, often maintaining emotional composure before ${parentName} even intervenes.`,
        `${cEunNeun} 나이와 상관없이 조용히 자기 자리를 지키며, 가족 안에서 감정적으로 흔들리지 않고 먼저 중심을 정돈하는 든든한 면모를 보여줍니다.`,
      ),
      evidenceReason: pick(
        locale,
        "High child responsibility-carrying & low parent over-intervention",
        "자녀의 높은 주도적 책임감 지표와 부모의 지켜보는 양육 톤 결합",
      ),
    };
  }
  // Pattern B: 부모가 집안 분위기를 띄움 ("집안 막내 같은 부모")
  else if (pDims.tensionReleasing >= 70 && cDims.stabilizing >= 60) {
    unexpectedRole = {
      roleLabel: pick(locale, "Playful Energy Lifter", "집안의 분위기 메이커"),
      roleTitle: pick(locale, "Parent bringing playful warmth", "편안한 순간엔 오히려 가장 장난스럽게 분위기를 푸는 부모"),
      roleDescription: pick(
        locale,
        `In relaxed moments, ${parentName} expresses playful humor and affection, letting ${childName} take a steady receptive position.`,
        `권위적인 부모의 모습에 그치지 않고, 일상이 편안해지면 ${pEunNeun} 오히려 장난과 애정 표현을 아끼지 않으며 집안의 웃음과 활력을 주도합니다.`,
      ),
      evidenceReason: pick(
        locale,
        "High parent tension-releasing & stable child receptivity",
        "부모의 높은 분위기 이완 지표와 자녀의 안정적 수용 톤 결합",
      ),
    };
  }
  // Pattern C: 감정 레이더 / 갈등 중재자
  else if (cDims.emotionalMonitoring >= 70 && cDims.mediating >= 60) {
    unexpectedRole = {
      roleLabel: pick(locale, "Emotional Radar & Mediator", "가족 감정 레이더"),
      roleTitle: pick(locale, "Sensing and smoothing household tension", "가족의 미세한 공기 변화를 가장 먼저 감지하는 자리"),
      roleDescription: pick(
        locale,
        `${childName} quickly picks up subtle emotional shifts in ${parentName}, acting as an intuitive peacekeeper in the home.`,
        `${cEunNeun} ${pGwaWa}의 작은 표정이나 톤 변화도 예민하게 읽어내며, 부모의 마음 상태에 맞춰 자발적으로 말과 행동을 조율하는 깊은 감수성을 보여줍니다.`,
      ),
      evidenceReason: pick(
        locale,
        "High child emotional monitoring & relational mediation score",
        "자녀의 높은 정서 모니터링 지표 및 관계 조율 신호",
      ),
    };
  }
  // Pattern D: 위기 시 해결사 (Crisis Stabilizer)
  else if (pDims.problemSolving >= 70 && riskScore >= 60) {
    unexpectedRole = {
      roleLabel: pick(locale, "Crisis Problem Solver", "위기 순간의 해결사"),
      roleTitle: pick(locale, "Stepping up quickly when trouble occurs", "평소엔 조용하다가 위기 시 가장 먼저 정신 차리는 부모"),
      roleDescription: pick(
        locale,
        `When unexpected difficulties arise, ${parentName} quickly shifts from calm observer to decisive problem solver for ${childName}.`,
        `평소에는 자율에 맡기며 관망하다가도, ${cIGa} 진짜 난관에 부딪히거나 위기가 발생하면 ${pEunNeun} 누구보다 신속하고 객관적으로 수습에 나섭니다.`,
      ),
      evidenceReason: pick(
        locale,
        "High parent problem-solving under risk activation",
        "부모의 높은 현실 해결 능력 지표와 리스크 상황 시 활성화 조건",
      ),
    };
  }

  // 5. 역할 역전 (Role Reversal Detection)
  let roleReversal: RoleReversalResult = null;
  if (cDims.responsibilityCarrying >= 65 && pDims.careTaking < 50) {
    roleReversal = {
      isReversed: true,
      reversalType: "emotional",
      reversalNature: "situational",
      description: pick(
        locale,
        `During stressful moments, ${childName} sometimes demonstrates calmer emotional regulation than ${parentName}, temporarily reversing the supportive role.`,
        `감정적 긴장이 커지는 순간에는 오히려 ${cIGa} 한 발 물러서서 상황을 객관적으로 바라보며, 부모인 ${pGwaWa}의 대화에서 정서적 버팀목이 되는 역전 양상이 일시적으로 나타날 수 있습니다.`,
      ),
    };
  }

  // 6. 둘이 있을 때 역할이 맞물리는 방식 (Causal Pair Interaction Mechanism)
  let pairCausalMechanism = "";
  if (pDims.directing >= 60 && cDims.distancing >= 60) {
    pairCausalMechanism = pick(
      locale,
      `When ${parentName} moves in quickly to guide or correct, ${childName} automatically steps back to secure processing space, creating a checking-versus-withdrawing dynamic.`,
      `${pEunNeun} 불안할 때 상황을 빨리 정돈하려 가이드를 내밀고, ${cEunNeun} 그 순간 자기 공간을 지키기 위해 방어적으로 입을 닫는 '확인과 물러섬'의 톱니바퀴가 맞물립니다.`,
    );
  } else if (pDims.careTaking >= 60 && cDims.emotionalMonitoring >= 60) {
    pairCausalMechanism = pick(
      locale,
      `When ${parentName} offers warm check-ins, ${childName} quickly registers the tone, fostering deep mutual emotional responsiveness.`,
      `${pEunNeun} 따뜻한 정서적 안부를 먼저 건네고 ${cEunNeun} 부모의 반응에 즉각 마음을 열어 대화 톤을 맞추는 선순환적 정서 교감이 이루어집니다.`,
    );
  } else {
    pairCausalMechanism = pick(
      locale,
      `${parentName}'s steady boundary setting gives ${childName} clear parameters, allowing the child to take independent initiative confidently.`,
      `${pEunNeun} 큰 틀의 안전펜스를 세워주고 ${cEunNeun} 그 안에서 주도적 시도를 거듭하며, 부모의 원칙 위에 아이의 실천이 얹어지는 포지션 조화가 나타납니다.`,
    );
  }

  // 7. 둘이 자연스럽게 잘 굴러갈 때 (Synergy When Smooth)
  let pairSynergyWhenSmooth = "";
  if (synergyScore >= 70) {
    pairSynergyWhenSmooth = pick(
      locale,
      `When aligned, ${parentName}'s experience-based grounding and ${childName}'s creative energy spark rapid growth and deep mutual respect.`,
      `서로의 페이스가 맞을 때 ${pEunNeun} 아이의 자율성을 최대로 응원하고 ${cEunNeun} 부모의 조언을 든든한 등대로 삼아, 실패를 두려워하지 않는 강력한 성장 동력이 발휘됩니다.`,
    );
  } else {
    pairSynergyWhenSmooth = pick(
      locale,
      `When operating comfortably, ${parentName} provides quiet reassurance while ${childName} feels secure in exploring personal goals.`,
      `일상 템포가 안정적일 때 ${pEunNeun} 변함없는 안정감을 굳건히 지켜주고 ${cEunNeun} 마음 놓고 자기 일에 집중할 수 있는 든든한 일상의 평화가 유지됩니다.`,
    );
  }

  // 8. 부담이 몰리는 순간 (Role Burden Identification)
  let roleBurden: RoleBurdenResult;
  if (cDims.emotionalMonitoring >= 70 && cDims.responsibilityCarrying >= 60) {
    roleBurden = {
      targetPerson: "child",
      burdenType: "parentification",
      burdenTitle: pick(locale, "Atmosphere Peacekeeping Burden", "가족 분위기 수습 부담"),
      burdenDescription: pick(
        locale,
        `${childName} can easily feel responsible for keeping the family atmosphere peaceful, absorbing tension quietly.`,
        `${cEunNeun} 집안의 서운함이나 갈등 기류를 자기 책임처럼 느끼고 먼저 분위기를 눈치 보며 수습하려는 무거운 정서적 부담을 느낄 위험이 있습니다.`,
      ),
      guidanceImplication: pick(
        locale,
        `Reassure ${childName}: "You don't need to fix the room's mood; it's okay to just focus on yourself."`,
        `“동글이가 이 분위기를 다 해결하지 않아도 돼, 네 마음부터 편안히 챙겨도 돼”라는 명확한 안도 신호를 정기적으로 건네주는 것이 중요합니다.`,
      ),
    };
  } else if (pDims.directing >= 70 && riskScore >= 65) {
    roleBurden = {
      targetPerson: "parent",
      burdenType: "decision",
      burdenTitle: pick(locale, "Sole Problem Solver Burden", "외로운 해결사 부담"),
      burdenDescription: pick(
        locale,
        `${parentName} may feel that all rule enforcement and practical crisis handling rest solely on their shoulders.`,
        `${pEunNeun} 가족 내 모든 약속과 원칙을 홀로 지키고 악역을 떠맡아야 한다는 외로운 책임감 중압감에 노출되기 쉽습니다.`,
      ),
      guidanceImplication: pick(
        locale,
        `Remind ${parentName} that perfection is not required; sharing small responsibilities with ${childName} builds mutual trust.`,
        `모든 완벽한 수습을 혼자 짊어지기보다, 아이에게도 작은 선택권을 나누어주고 한 박자 내려놓는 쉼표가 필요합니다.`,
      ),
    };
  } else {
    roleBurden = {
      targetPerson: "both",
      burdenType: "none",
      burdenTitle: pick(locale, "Balanced Shared Responsibility", "조화로운 역할 분담"),
      burdenDescription: pick(
        locale,
        `Neither person is heavily overloaded with invisible labor, keeping emotional energy balanced.`,
        `어느 한쪽에게 비정상적인 정서적 수습이나 전적인 중압감이 몰리지 않고, 상황에 따라 서로 역할을 주고받는 건강한 균형을 유지하고 있습니다.`,
      ),
      guidanceImplication: pick(
        locale,
        `Maintain open communication so small mismatched expectations are addressed early.`,
        `지금처럼 서로의 영역을 존중하며 일상의 소소한 감사 표현을 자주 주고받는 것이 좋습니다.`,
      ),
    };
  }

  return {
    pairStructureOverview,
    parentRoleProfile,
    childRoleProfile,
    unexpectedRole,
    roleReversal,
    pairCausalMechanism,
    pairSynergyWhenSmooth,
    roleBurden,
  };
}
