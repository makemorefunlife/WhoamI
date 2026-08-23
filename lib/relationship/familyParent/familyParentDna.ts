import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { ParentDnaSection, ParentChildBridgeSection } from "./familyKillerSections";
import {
  josaIGa,
  josaEunNeun,
  josaGwaWa,
  josaEulReul,
} from "@/lib/relationship/romantic/prototypeV4/romanticLanguage";
import { pick } from "./familyParentCopy";

export type BuildParentDnaOutput = {
  parentDna: ParentDnaSection;
  parentChildBridge: ParentChildBridgeSection;
};

export function buildFamilyParentDna(
  ctx: FamilyRuleContext,
  personCorePsych?: {
    psychA?: PsychMasterJson | null;
    psychB?: PsychMasterJson | null;
  },
): BuildParentDnaOutput {
  const locale = ctx.locale;
  const parentName = ctx.parentNickname || pick(locale, "Parent", "부모");
  const childName = ctx.childNickname || pick(locale, "Child", "자녀");

  const pIGa = josaIGa(parentName);
  const pEunNeun = josaEunNeun(parentName);
  const pGwaWa = josaGwaWa(parentName);
  const pEulReul = josaEulReul(parentName);

  const cIGa = josaIGa(childName);
  const cEunNeun = josaEunNeun(childName);
  const cGwaWa = josaGwaWa(childName);
  const cEulReul = josaEulReul(childName);

  // Evidence extraction: TenGods balance, Master Scores, Pair Lens
  const { tenGod, masterScores } = ctx;
  const pDominant = tenGod?.parentDominantGod ?? "bigeob";
  const bondScore = masterScores.bond;
  const synergyScore = masterScores.synergy;
  const riskScore = masterScores.risk;

  // Psych master axes if available
  const psychParent = personCorePsych?.psychB ?? personCorePsych?.psychA ?? null;
  const psychSecondary = psychParent?.secondary_axes;
  const structureVal = psychSecondary?.structure ?? 50;
  const connectionVal = psychSecondary?.connection ?? 50;

  // 1. 보호할 때 (Protection Style)
  let protectionStyle = "";
  if (pDominant === "insoeng" || connectionVal >= 65) {
    protectionStyle = pick(
      locale,
      `When ${childName} is shaken or hurt, ${parentName} first embraces their emotions warmly and listens deeply before offering any solutions.`,
      `${cIGa} 밖에서 억울하거나 마음이 흔들려 집으로 들어올 때, ${pEunNeun} 해결책을 다그치기보다 아이의 지친 마음을 먼저 안아주고 이야기를 끝까지 들어주는 정서적 안식처 역할을 해줍니다.`,
    );
  } else if (pDominant === "gwanseong" || structureVal >= 65) {
    protectionStyle = pick(
      locale,
      `When ${childName} encounters trouble, ${parentName} immediately organizes the situation, establishes clear safety rails, and restores order calmly.`,
      `${cIGa} 어려움에 처하면 ${pEunNeun} 감정에 휩싸이기보다 문제를 객관적으로 정리하고 다음 행동의 안전한 기준과 경계를 즉시 잡아주는 방식으로 보호합니다.`,
    );
  } else if (pDominant === "siksang") {
    protectionStyle = pick(
      locale,
      `When ${childName} needs help, ${parentName} steps forward directly to take care of practical details and clear obstacles for the child.`,
      `${cIGa} 힘들어할 때 ${pEunNeun} 즉시 세심한 챙김과 세부적인 도움에 나섭니다. 아이가 겪는 불편함을 직접 해결해주어 실질적인 안도감을 선사하는 보호 방식을 지닙니다.`,
    );
  } else {
    protectionStyle = pick(
      locale,
      `When ${childName} faces stress, ${parentName} maintains a calm presence, giving the child space while remaining steadily available nearby.`,
      `${cIGa} 고민에 빠지면 ${pEunNeun} 성급히 개입하지 않고 한 박자 떨어져 조용히 지켜봐 줍니다. 아이가 스스로 마음을 정돈할 때까지 변함없이 곁을 지키며 든든한 버팀목이 되어줍니다.`,
    );
  }

  // 2. 걱정될 때 (Anxiety Trigger Behavior)
  let anxietyTriggerBehavior = "";
  if (riskScore >= 60 || structureVal >= 60) {
    anxietyTriggerBehavior = pick(
      locale,
      `When anxiety rises, ${parentName} tends to ask rapid checking questions, tighten scheduling, and desire immediate status updates from ${childName}.`,
      `아이 걱정이 커지면 ${pEunNeun} 확인하고 싶은 마음이 조급해져 안부 질문이나 확인 요청이 늘어나고, 아이의 일정을 세밀하게 챙기며 상황을 정돈하려는 본능이 강해집니다.`,
    );
  } else if (bondScore < 55) {
    anxietyTriggerBehavior = pick(
      locale,
      `When worried, ${parentName} feels a surge of internal concern, approaching quickly to check emotional state, which may inadvertently feel abrupt to ${childName}.`,
      `불안이 오르면 ${pEunNeun} 괜찮은지 즉시 확인하고 싶어 다가가지만, 아이의 정리 템포와 엇갈려 서운함이나 조급함이 겉으로 표출되는 양상을 보입니다.`,
    );
  } else {
    anxietyTriggerBehavior = pick(
      locale,
      `When anxiety spikes, ${parentName} overexplains guidelines and repeats core warnings to ensure ${childName} avoids preventable mistakes.`,
      `불안이 커지면 ${pEunNeun} 같은 당부와 가이드를 반복해서 조언하며, 아이가 당할 시행착오를 미리 차단하기 위해 주의사항을 꼼꼼하게 일깨워주는 경향을 보입니다.`,
    );
  }

  // 3. 아이를 믿는 방식 (Trust & Autonomy Style)
  let trustAutonomyStyle = "";
  if (synergyScore >= 70) {
    trustAutonomyStyle = pick(
      locale,
      `${parentName} sets clear foundational boundaries, then grants ${childName} broad freedom to choose execution details within those safety rails.`,
      `${pEunNeun} 큰 틀의 안전선과 원칙만 분명히 잡아준 뒤, 그 울타리 안에서의 세부 시도와 선택은 아이의 자율에 완전히 믿고 맡기는 탁월한 자율 부여 방식을 보여줍니다.`,
    );
  } else if (structureVal >= 65) {
    trustAutonomyStyle = pick(
      locale,
      `${parentName} provides structured steps first, gradually expanding autonomy as ${childName} demonstrates steady responsibility.`,
      `${pEunNeun} 아이에게 단계별 과제와 역할을 경험하게 한 뒤, 아이가 약속을 잘 지키는 모습을 확인하면서 점진적으로 자율의 범위를 넓혀주는 안정적 신뢰 방식을 취합니다.`,
    );
  } else {
    trustAutonomyStyle = pick(
      locale,
      `${parentName} deeply respects ${childName}'s personal pace and choices, stepping back to allow independent exploration until asked for help.`,
      `${pEunNeun} 아이의 개성과 판단을 기본적으로 존중하여 먼저 나서서 통제하기보다, 아이가 도움을 요청할 때까지 스스로 깨닫고 시도해볼 여백을 넉넉히 허용합니다.`,
    );
  }

  // 4. 기준을 세울 때 (Discipline Style)
  let disciplineStyle = "";
  if (pDominant === "gwanseong" || structureVal >= 60) {
    disciplineStyle = pick(
      locale,
      `When correcting rule issues, ${parentName} emphasizes clear expectations, explicit agreements, and consistent follow-through without emotional tirades.`,
      `규칙이나 약속 미준수가 발생하면 ${pEunNeun} 감정을 크게 터뜨리기보다 원칙의 이유와 약속된 결과를 명확히 짚어주며 단호하고 원칙적인 선을 정돈합니다.`,
    );
  } else if (pDominant === "insoeng") {
    disciplineStyle = pick(
      locale,
      `When disciplining, ${parentName} uses warm persuasion, explaining why the behavior matters morally and helping ${childName} understand the impact on others.`,
      `잘못을 바로잡을 때 ${pEunNeun} 아이의 자존심을 건드리지 않고, 왜 이 규칙이 필요한지 정서적으로 설득하고 마음을 일깨워 스스로 깨닫게 돕습니다.`,
    );
  } else {
    disciplineStyle = pick(
      locale,
      `When setting boundaries, ${parentName} talks through the practical consequences calmly, agreeing together on realistic next steps.`,
      `기준을 바로잡을 때 ${pEunNeun} 대화를 통해 현실적인 이유를 충분히 설명하고, 부모와 아이가 납득할 수 있는 합리적인 타협안을 조율하여 정돈합니다.`,
    );
  }

  // 5. 성장을 밀어주는 방식 (Growth Support Style)
  let growthSupportStyle = "";
  if (pDominant === "재성" || synergyScore >= 65) {
    growthSupportStyle = pick(
      locale,
      `${parentName} encourages ${childName} by opening doors to new opportunities, offering resources, and celebrating trial without fearing failure.`,
      `아이의 성장을 도울 때 ${pEunNeun} 다양한 경험의 기회와 필요 자원을 적극적으로 연결해주며, 아이가 실패를 두려워하지 않고 새로운 도전을 마음껏 즐기도록 원동력을 실어줍니다.`,
    );
  } else if (pDominant === "gwanseong") {
    growthSupportStyle = pick(
      locale,
      `${parentName} supports growth by fostering self-discipline, routine consistency, and a strong sense of responsibility in ${childName}.`,
      `아이의 성장을 북돋울 때 ${pEunNeun} 일상의 성실한 루틴과 스스로 책임을 다하는 주도성을 키워주며, 단단한 성취의 발판을 체계적으로 다져줍니다.`,
    );
  } else {
    growthSupportStyle = pick(
      locale,
      `${parentName} fuels growth through constant belief, praising small efforts, and providing a reliable emotional foundation for ${childName}.`,
      `아이의 성장을 밀어줄 때 ${pEunNeun} 결과보다 과정에서의 자발적 시도 자체를 정서적으로 깊이 인정해주며, 언제든 돌아와 쉴 수 있는 안전한 울타리가 되어줍니다.`,
    );
  }

  // 6. 조심할 점 (Shadow Side of Parent Strength)
  let shadowSideWarning = "";
  if (pDominant === "gwanseong" || riskScore >= 60) {
    shadowSideWarning = pick(
      locale,
      `Under parenting stress, ${parentName}'s strength of setting structure can manifest as rigid overchecking, making ${childName} feel controlled.`,
      `원칙과 가이드를 잡아주는 부모의 든든한 강점이 양육 스트레스나 불안과 만나면 '세밀한 확인과 지적'으로 과해져, 아이에게는 자율을 침해받는 중압감으로 다가올 수 있습니다.`,
    );
  } else if (pDominant === "insoeng" || bondScore < 60) {
    shadowSideWarning = pick(
      locale,
      `When worried, ${parentName}'s deep protective warmth can become overattention, making it difficult to step back when ${childName} needs internal processing space.`,
      `따뜻하게 감싸주려는 깊은 애정 본능이 불안할 때 '성급한 확인과 조급함'으로 이어지면, 혼자 마음을 정돈하고 싶은 아이가 입을 닫아버리는 역효과를 낼 수 있습니다.`,
    );
  } else {
    shadowSideWarning = pick(
      locale,
      `When tired, ${parentName}'s supportive intent may shift into solving problems for ${childName} too quickly, short-circuiting the child's independent trial.`,
      `시행착오를 아껴주려는 헌신적 마음이 과해지면 아이가 스스로 깨닫기도 전에 답을 대신 내려주어, 아이의 주도적 시도 기회가 줄어들 위험이 있습니다.`,
    );
  }

  const parentDna: ParentDnaSection = {
    protection_style: protectionStyle,
    anxiety_trigger_behavior: anxietyTriggerBehavior,
    trust_autonomy_style: trustAutonomyStyle,
    discipline_style: disciplineStyle,
    growth_support_style: growthSupportStyle,
    shadow_side_warning: shadowSideWarning,
  };

  // ◤ 이 부모와 이 아이가 만났을 때 (Pair Bridge)
  let bestHarmonyPoint = "";
  if (synergyScore >= 70) {
    bestHarmonyPoint = pick(
      locale,
      `${parentName}'s steady boundary setting and ${childName}'s energetic trial complement each other like puzzle pieces, sparking strong growth momentum.`,
      `${pEunNeun} 방향의 든든한 기준을 잡아주고 ${cEunNeun} 자기 방식으로 주도적으로 시도할 때 최고의 성장 시너지가 만들어집니다.`,
    );
  } else if (bondScore >= 70) {
    bestHarmonyPoint = pick(
      locale,
      `${parentName}'s warm protective care matches ${childName}'s need for emotional safety, creating deep mutual trust.`,
      `${pEunNeun}의 따뜻한 정서적 안식처와 ${cEunNeun}의 깊은 안도감이 어우러져 "언제나 내 편"이라는 단단한 신뢰가 일상에 흐릅니다.`,
    );
  } else {
    bestHarmonyPoint = pick(
      locale,
      `${parentName}'s structural guidance offers a reliable safety rail as ${childName} navigates new challenges.`,
      `${pEunNeun}가 안전펜스 역할을 든든히 해주어 ${cIGa} 실수에 대한 부담 없이 자신의 가능성을 탐색할 수 있는 기초가 마련됩니다.`,
    );
  }

  let frictionRiskMoment = "";
  if (riskScore >= 60) {
    frictionRiskMoment = pick(
      locale,
      `When rules are broken, ${parentName}'s rapid demand for answers collides with ${childName}'s defensive silence.`,
      `약속 미준수나 규칙 지적 시 ${pEunNeun}의 즉각적인 확인 요구와 ${cEunNeun}의 방어적 입닫힘이 부딪혀 대화 톤이 과열되기 쉬운 지점입니다.`,
    );
  } else if (bondScore < 60) {
    frictionRiskMoment = pick(
      locale,
      `When stress arises, ${parentName}'s desire to check in immediately clashes with ${childName}'s need for private processing space.`,
      `${cIGa} 힘든 일 후 혼자 마음을 정돈하려 할 때, ${pEunNeun} 괜찮은지 빨리 확인하려고 바짝 다가설 때 소통 템포의 시차가 발생합니다.`,
    );
  } else {
    frictionRiskMoment = pick(
      locale,
      `When guiding tasks, ${parentName}'s eagerness to offer solutions can be misread by ${childName} as premature interference.`,
      `${pEunNeun} 시행착오를 아껴주려 미리 답을 줄 때, ${cEunNeun} 이를 자신의 자율성을 안 믿어주는 것으로 오해하는 순간입니다.`,
    );
  }

  let optimalParentPosition = "";
  if (synergyScore >= 70) {
    optimalParentPosition = pick(
      locale,
      `"Keep boundaries clear, but leave the execution choices entirely to ${childName}."`,
      `“방향과 울타리는 부모가 분명하게 잡아주되, 그 안에서의 실행 방법은 아이에게 믿고 맡기기”`,
    );
  } else if (riskScore >= 60) {
    optimalParentPosition = pick(
      locale,
      `"Establish a 5-minute cool-down buffer before discussing discipline rules with ${childName}."`,
      `“규칙 지적이 필요한 순간에는 즉시 답을 요구하기보다 감정이 식을 한 박자 쉼표를 확보하기”`,
    );
  } else {
    optimalParentPosition = pick(
      locale,
      `"Listen first without immediate judgment, then guide step-by-step together with ${childName}."`,
      `“성급한 대안 제시 대신 먼저 따뜻하게 들어주고, 가이드는 아이의 요청 후에 조용히 더해주기”`,
    );
  }

  const parentChildBridge: ParentChildBridgeSection = {
    best_harmony_point: bestHarmonyPoint,
    friction_risk_moment: frictionRiskMoment,
    optimal_parent_position: optimalParentPosition,
  };

  return { parentDna, parentChildBridge };
}
