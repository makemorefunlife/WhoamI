import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { FamilyParentChildReport } from "./familyReportTemplate";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { FamilyPsychProjection } from "./familyPsychDynamicsTypes";
import type {
  FamilyConflictChapterBundle,
  FamilyConflictCardItem,
  FamilyConflictCategoryKey,
  FamilyLoveExpressionAnalysis,
  FamilyConflictLoopV2,
} from "./familyStoryPlanTypes";
import {
  josaIGa,
  josaEunNeun,
  josaGwaWa,
  josaEulReul,
} from "@/lib/relationship/romantic/prototypeV4/romanticLanguage";

export function buildFamilyConflictChapterBundle(params: {
  ctx: FamilyRuleContext;
  report: FamilyParentChildReport;
  psychParent: PsychMasterJson | null;
  psychChild: PsychMasterJson | null;
  psychProjections: FamilyPsychProjection[];
}): FamilyConflictChapterBundle {
  const { ctx, psychParent, psychChild, psychProjections } = params;

  const parentName = ctx.parentNickname;
  const childName = ctx.childNickname;

  const pEunNeun = josaEunNeun(parentName);
  const pIGa = josaIGa(parentName);
  const pGwaWa = josaGwaWa(parentName);

  const cEunNeun = josaEunNeun(childName);
  const cIGa = josaIGa(childName);
  const cEulReul = josaEulReul(childName);
  const cGwaWa = josaGwaWa(childName);

  const parentStructure = psychParent?.secondary_axes?.structure ?? 50;
  const parentConflictStyle = psychParent?.secondary_axes?.conflict_style ?? 50;
  const parentResilience = psychParent?.secondary_axes?.resilience ?? 50;

  const childStructure = psychChild?.secondary_axes?.structure ?? 50;
  const childResilience = psychChild?.secondary_axes?.resilience ?? 50;
  const childRecognition = psychChild?.secondary_axes?.recognition ?? 50;

  const hasClash = ctx.canonicalPairFacts.hasClash;
  const hasWonjin = ctx.canonicalPairFacts.hasWonjinOrGuimun;

  // ---------------------------------------------------------------------------
  // 1. Section 01: 사랑을 주고받는 방식 (Love Expression & Reception Analysis)
  // ---------------------------------------------------------------------------
  let parentExpressType = "structure";
  if (parentStructure >= 60) {
    parentExpressType = "structure";
  } else if (parentResilience >= 60) {
    parentExpressType = "support";
  } else {
    parentExpressType = "warmth";
  }

  let parentExpressTitle = `${parentName}의 사랑은 '챙기고 방향을 잡아주는 것'에 가까워요.`;
  let parentExpressDesc = `${pEunNeun} ${cEulReul} 사랑할 때 묵인하기보다 위험을 미리 방지하고 올바른 생활 습관과 안전한 울타리를 세워주는 행동으로 마음을 표현합니다.`;
  if (parentExpressType === "support") {
    parentExpressTitle = `${parentName}의 사랑은 '도전의 기회를 연결해주는 것'에 가까워요.`;
    parentExpressDesc = `${pEunNeun} ${cIGa} 스스로 시도하고 성장하도록 필요한 자원과 경험의 자리를 만들어주며 버팀목이 되어주는 행동으로 애정을 건넸습니다.`;
  } else if (parentExpressType === "warmth") {
    parentExpressTitle = `${parentName}의 사랑은 '따뜻하게 감싸주고 반응해주는 것'에 가까워요.`;
    parentExpressDesc = `${pEunNeun} ${cNameWithJosa(childName)}의 기분을 살피고 수용해주며 다정하게 안부를 살피는 톤으로 애정을 표현합니다.`;
  }

  let childReceiveType = "autonomy";
  if (childRecognition >= 60) {
    childReceiveType = "recognition";
  } else if (childStructure >= 60) {
    childReceiveType = "stability";
  } else {
    childReceiveType = "autonomy";
  }

  let childReceiveTitle = `${childName}은 '나를 믿고 기다려주는 것'에서 사랑을 크게 느껴요.`;
  let childReceiveDesc = `${cEunNeun} 성급한 개입이나 지시보다는, 자신이 혼자 판단하고 정돈할 수 있도록 조용히 기다려주고 믿어줄 때 "나를 이해해주는구나"라고 느낍니다.`;
  if (childReceiveType === "recognition") {
    childReceiveTitle = `${childName}은 '존재 자체에 대한 세심한 인정과 칭찬'에서 사랑을 느껴요.`;
    childReceiveDesc = `${cEunNeun} 잘했을 때뿐만 아니라 과정에서의 노력을 구체적으로 인정해주고 칭찬해줄 때 사랑받고 있음을 체감합니다.`;
  } else if (childReceiveType === "stability") {
    childReceiveTitle = `${childName}은 '일관된 규칙과 명확한 기준'에서 안도감을 느껴요.`;
    childReceiveDesc = `${cEunNeun} 상황에 따라 톤이 바뀌지 않는 예측 가능한 규칙과 명확한 가이드가 제공될 때 깊은 안도감을 받습니다.`;
  }

  const isMisaligned = parentExpressType === "structure" && childReceiveType === "autonomy";
  const pairSynthesisTitle = isMisaligned
    ? `${parentName}의 챙김과 ${childName}의 자율 욕구가 만드는 소통 시차`
    : `${parentName}와 ${childName}의 애정 수용 언어가 비교적 잘 맞물리는 상태`;

  const pairSynthesisDesc = isMisaligned
    ? `${parentName}가 챙기고 확인하려는 행동은 분명 깊은 애정에서 시작돼요. 하지만 ${childName}에게는 상황에 따라 "나를 아직 믿지 못하나?"라는 간섭이나 압박처럼 다가올 수 있습니다. 반대로 ${childName}의 조용한 침묵이나 거리는 독립적인 정돈 과정일 뿐인데, ${parentName}에게는 서운함이나 방관으로 오해될 수 있습니다.`
    : `${parentName}가 애정을 표현하는 방식과 ${childName}이 마음에 담아두는 방식이 큰 곡해 없이 전달되는 편이에요. 서로가 생각하는 애정 표현의 의도가 잘 통하여 정서적 안정이 유지됩니다.`;

  const loveAnalysis: FamilyLoveExpressionAnalysis = {
    parentExpressionTitle: parentExpressTitle,
    parentExpressionDesc: parentExpressDesc,
    childReceptionTitle: childReceiveTitle,
    childReceptionDesc: childReceiveDesc,
    pairSynthesisTitle,
    pairSynthesisDesc,
    keyInsightLine: "사랑의 크기가 부족한 것이 아니라, 사랑을 보내고 확인하는 방식이 다를 수 있습니다.",
  };

  // ---------------------------------------------------------------------------
  // 2. Section 02: 우리가 실제로 부딪히는 지점 (Conflict Mechanism Cards)
  // ---------------------------------------------------------------------------
  const candidateScores: Record<FamilyConflictCategoryKey, number> = {
    rules_standards: 0,
    autonomy_control: 0,
    emotional_speed: 0,
    expectations_pressure: 0,
    expression_style: 0,
    authority_justification: 0,
  };

  if (parentStructure >= 60) candidateScores.rules_standards += 35;
  if (childStructure < 45 || childResilience < 45) candidateScores.rules_standards += 30;
  if (hasClash) candidateScores.rules_standards += 20;

  if (parentStructure >= 55) candidateScores.autonomy_control += 30;
  if (childResilience < 50) candidateScores.autonomy_control += 35;

  const speedGap = Math.abs(parentConflictStyle - childResilience);
  if (speedGap >= 25) candidateScores.emotional_speed += 40;
  if (hasWonjin) candidateScores.emotional_speed += 30;

  const expGap = Math.abs(parentStructure - childRecognition);
  if (expGap >= 25) candidateScores.expectations_pressure += 35;

  if (hasWonjin || hasClash) candidateScores.expression_style += 25;

  if (parentStructure >= 65) candidateScores.authority_justification += 30;

  const sortedCategories = (Object.keys(candidateScores) as FamilyConflictCategoryKey[])
    .sort((a, b) => candidateScores[b] - candidateScores[a])
    .filter((cat) => candidateScores[cat] >= 20);

  const selectedCategories = sortedCategories.slice(0, 3);
  if (selectedCategories.length === 0) {
    selectedCategories.push("rules_standards", "autonomy_control");
  }

  const cardDefinitions: Record<FamilyConflictCategoryKey, Omit<FamilyConflictCardItem, "id" | "numLabel" | "evidenceScore">> = {
    rules_standards: {
      category: "rules_standards",
      title: "기준과 규칙이 다를 때",
      subhead: "“왜 꼭 그렇게 해야 해?”",
      parentLogic: `${parentName}에게 약속과 정해진 규칙은 가정 내 신뢰와 안전을 지키는 최소한의 울타리예요. 원칙이 지켜져야 마음이 놓입니다.`,
      childLogic: `${childName}에게는 상황에 따른 유연성과 예외가 중요한데, 무조건 정해진 원칙만 고수하면 자신의 입장이나 이유가 무시당한다고 느낍니다.`,
      realSituationScene: "귀가 시간, 스마트폰 사용 규칙, 정해진 집안일이나 약속 변경 건으로 대화할 때.",
      contrastBar: {
        left: "약속과 기준이 중요함",
        right: "납득과 선택권이 중요함",
      },
    },
    autonomy_control: {
      category: "autonomy_control",
      title: "자율성과 확인 템포가 다를 때",
      subhead: "“나 혼자서도 잘할 수 있어요”",
      parentLogic: `${parentName}는 아이의 상태를 미리 확인하고 가이드를 주는 것이 부모의 마땅한 책임이자 챙김이라고 생각합니다.`,
      childLogic: `${childName}은 스스로 시도하고 생각할 여지 없이 부모가 바짝 다가와 확인하면 '나를 못 믿나' 싶어 마음이 닫힙니다.`,
      realSituationScene: "방 정돈, 개인 물건 관리, 스스로 해결하려는 과제나 일상 선택에 부모가 즉각 개입할 때.",
      contrastBar: {
        left: "미리 확인하고 안전을 챙김",
        right: "먼저 스스로 시도해보고 싶음",
      },
    },
    emotional_speed: {
      category: "emotional_speed",
      title: "감정 처리 속도가 다를 때",
      subhead: "“지금 당장 얘기하자 vs 나중에 얘기해요”",
      parentLogic: `${parentName}는 마찰이나 서운함이 생긴 그 자리에서 바로 대화로 털어내야 답답함이 풀리고 안심이 됩니다.`,
      childLogic: `${childName}은 감정이 과열된 순간 바짝 다가오면 부담감이 심해져 방으로 들어가거나 입을 닫아 버립니다.`,
      realSituationScene: "의견 충돌이나 마찰 직후, 당장 풀자는 부모와 혼자 쿨다운하려는 아이의 템포가 부딪힐 때.",
      contrastBar: {
        left: "그 자리에서 즉시 대화로 풀기",
        right: "혼자 마음을 정돈할 쿨다운 필요",
      },
    },
    expectations_pressure: {
      category: "expectations_pressure",
      title: "기대 수준과 성취 중압감이 다를 때",
      subhead: "“더 잘할 수 있는데 왜 안 하니?”",
      parentLogic: `${parentName}는 아이의 더 큰 가능성을 펴길 바라는 마음에서 더 높은 기준과 성장을 자꾸 권하게 됩니다.`,
      childLogic: `${childName}은 부모의 기대에 미치지 못할까 봐 중압감을 느끼며, 잘한 점보다 아쉬운 지적이 먼저 남는다고 느낍니다.`,
      realSituationScene: "시험 성적, 진로 고민, 성취 결과에서 잘한 점보다 아쉬운 부분이 먼저 지적되는 순간.",
      contrastBar: {
        left: "더 큰 성장을 이끌어내고 싶음",
        right: "내 페이스대로 인정받고 싶음",
      },
    },
    expression_style: {
      category: "expression_style",
      title: "애정 표현 언어가 다를 때",
      subhead: "“왜 대답이 없니 vs 다 챙기고 있어요”",
      parentLogic: `${parentName}는 다정하게 대화하고 티 내며 표현하는 다정한 말과 톤으로 마음을 주고받길 원합니다.`,
      childLogic: `${childName}은 긴 말보다 실질적인 행동이나 묵묵히 곁을 지키는 태도로 애정을 건네고 있습니다.`,
      realSituationScene: "소통 톤이나 표현 방식 차이로 '왜 마음을 표현하지 않니' vs '행동으로 다 하고 있어요'로 서운해할 때.",
      contrastBar: {
        left: "말과 톤으로 적극 표현함",
        right: "행동과 묵묵한 태도로 표현함",
      },
    },
    authority_justification: {
      category: "authority_justification",
      title: "부모의 경험과 자녀의 이유 납득이 다를 때",
      subhead: "“부모 말이 맞으니까 따라와”",
      parentLogic: `${parentName}는 인생 경험에서 나온 지침을 믿고 따라오면 아이의 시행착오를 줄일 수 있다고 믿습니다.`,
      childLogic: `${childName}은 이유와 맥락을 스스로 납득해야 움직여지는데, 지시조 톤이면 반발심이 생깁니다.`,
      realSituationScene: "행동 수칙이나 집안 규범의 이유를 두고 부모의 경험적 강조와 아이의 사유 요구가 겨룰 때.",
      contrastBar: {
        left: "부모의 경험과 방향 전달",
        right: "이유를 직접 납득해야 수용함",
      },
    },
  };

  const conflictCards: FamilyConflictCardItem[] = selectedCategories.map((cat, idx) => {
    const def = cardDefinitions[cat];
    return {
      ...def,
      id: `conflict_card_${cat}`,
      numLabel: `0${idx + 1}`,
      evidenceScore: candidateScores[cat],
    };
  });

  // ---------------------------------------------------------------------------
  // 3. Section 03: einmal 부딪히면 이렇게 커질 수 있어요 (Conflict Loop V2)
  // ---------------------------------------------------------------------------
  const topConflict = conflictCards[0]?.category ?? "rules_standards";

  let step1ParentTrigger = `${parentName}가 안타깝거나 답답한 마음에 규칙이나 행동을 그 자리에서 바로 확인하려 합니다.`;
  let step2ChildReaction = `${childName}은 조급함이나 압박감을 느끼고 반응을 아끼거나 방으로 들어가 버립니다.`;
  let step3ParentEscalation = `${parentName}는 침묵을 '무시나 고집'으로 해석하여 목소리 톤이 높아지고 더 단호하게 다가섭니다.`;
  let step4ChildNextReaction = `${childName}은 '내 입장은 안 들어준다'는 거부감에 마음을 닫거나 강하게 방어합니다.`;

  if (topConflict === "emotional_speed") {
    step1ParentTrigger = `${parentName}가 마찰 직후 서운함을 그 자리에서 당장 풀기 위해 바로 대화를 청합니다.`;
    step2ChildReaction = `${childName}은 과열된 상태에서 즉시 말할 쿨다운이 없어 입을 닫아 버립니다.`;
    step3ParentEscalation = `${parentName}는 거리를 두려는 태도에 서운함이 올라와 대화를 계속 촉구합니다.`;
    step4ChildNextReaction = `${childName}은 통제감을 느끼고 차갑게 반응하거나 자리를 피해 버립니다.`;
  }

  const parentResidualFeeling = `“아이를 위해서 챙기고 말해주는데, 바위처럼 입을 닫거나 벽을 치는 것 같아 쓸쓸하고 답답해요.”`;
  const childResidualFeeling = `“내 상황이나 감정은 듣지 않고 당장 부모가 원하는 톤과 기준만 요구하니 답답하고 숨 막혀요.”`;

  const conflictLoop: FamilyConflictLoopV2 = {
    step1ParentTrigger,
    step2ChildReaction,
    step3ParentEscalation,
    step4ChildNextReaction,
    parentResidualFeeling,
    childResidualFeeling,
  };

  // ---------------------------------------------------------------------------
  // 4. Chapter Synthesis (Part 05 Closing)
  // ---------------------------------------------------------------------------
  const conflictSynthesisLine = `둘의 갈등은 사랑이 부족해서 생기기보다, ${parentName}는 확인과 기준으로 관계를 지키려 하고 ${childName}은 선택권과 자기 속도로 관계를 지키려 할 때 커지기 쉬워요.`;

  return {
    loveAnalysis,
    conflictCards,
    conflictLoop,
    conflictSynthesisLine,
  };
}

function cNameWithJosa(name: string): string {
  const lastChar = name.charCodeAt(name.length - 1);
  const hasJongsung = (lastChar - 0xac00) % 28 !== 0;
  return hasJongsung ? `${name}이` : name;
}
