import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { josa, josaIGa, josaEunNeun, josaGwaWa, josaEulReul } from "./romanticLanguage";

export type RomanticRoleType =
  | "emotional_anchor"
  | "initiator"
  | "practical_stabilizer"
  | "affection_initiator"
  | "repair_initiator"
  | "autonomy_keeper"
  | "relationship_regulator";

export type RelationalRoleMatrix = {
  roleA: { type: RomanticRoleType; title: string; description: string };
  roleB: { type: RomanticRoleType; title: string; description: string };
  complement: string;
  collision: string;
  overFunctionRisk: string;
  underFunctionRisk: string;
};

export type BidirectionalGrowth = {
  aLearnsFromB: string;
  bLearnsFromA: string;
};

export type Chapter06RolePowerVulnerability = {
  greatestStrength: string;
  greatestVulnerability: string;
  depletionPattern: string;
  roleMatrix: RelationalRoleMatrix;
  growth: BidirectionalGrowth;
};

export type WantedVsGivenLoveDetail = {
  personName: string;
  partnerName: string;
  wantedLove: string;
  givenLove: string;
  partnerReception: string;
};

export type WantedVsGivenLovePair = {
  loveA: WantedVsGivenLoveDetail;
  loveB: WantedVsGivenLoveDetail;
  matchStatus: "MATCHED" | "PARTIALLY_MATCHED" | "MISALIGNED";
  summary: string;
};

export type WhatNotToExpect = {
  notToExpectAFromB: { title: string; reason: string }[];
  notToExpectBFromA: { title: string; reason: string }[];
};

export type WhenWeNeedEachOtherMost = {
  whenANeedsB: { sceneTitle: string; concreteContext: string }[];
  whenBNeedsA: { sceneTitle: string; concreteContext: string }[];
};

export type RomanticSosScriptDetail = {
  seekerName: string;
  providerName: string;
  trigger: string;
  doNot: string;
  firstLine: string;
  bridgeLine: string;
  reconnectionLine: string;
};

export type EmergencyRomanticSosScripts = {
  sosAtoB: RomanticSosScriptDetail;
  sosBtoA: RomanticSosScriptDetail;
};

export type LongTermRelationshipBondPrescription = {
  keepDoing: string[];
  watchOut: string[];
  relationshipRitual: string[];
};

export type ConflictStateTransition = {
  personName: string;
  normalState: string;
  tensionRising: string;
  overloadState: string;
  recoveryState: string;
  canonicalSummary: string;
};

export type PhysicalIntimacyDetail = {
  desiredClosenessA: string;
  desiredClosenessB: string;
  tempoMatch: "MATCHED" | "PARTIALLY_MATCHED" | "TEMPO_GAP";
  spaceNeed: string;
  summary: string;
};

export type RomanticGapBatchOutput = {
  chapter06: Chapter06RolePowerVulnerability;
  wantedVsGivenLove: WantedVsGivenLovePair;
  whatNotToExpect: WhatNotToExpect;
  whenWeNeedEachOtherMost: WhenWeNeedEachOtherMost;
  emergencySos: EmergencyRomanticSosScripts;
  longTermBond: LongTermRelationshipBondPrescription;
  physicalIntimacy: PhysicalIntimacyDetail;
  conflictTransitions: {
    transitionA: ConflictStateTransition;
    transitionB: ConflictStateTransition;
  };
};

const ROLE_TITLES: Record<RomanticRoleType, { title: string; desc: string }> = {
  emotional_anchor: {
    title: "정서적 안식처 (Emotional Anchor)",
    desc: "관계가 흔들릴 때 변함없는 체온과 포용으로 상대를 감싸안는 따뜻한 버팀목",
  },
  initiator: {
    title: "관계의 추동자 (Initiator)",
    desc: "데이트 계획과 미래 비전을 제시하고 새로운 경험과 자극으로 관계를 이끄는 나침반",
  },
  practical_stabilizer: {
    title: "현실적 밸런서 (Practical Stabilizer)",
    desc: "감정에 치우치지 않고 현실적인 조언과 안정적인 체계로 연애의 울타리를 다지는 조정자",
  },
  affection_initiator: {
    title: "애정 표현기 (Affection Initiator)",
    desc: "다정한 표현과 먼저 다가가는 솔직함으로 관계의 온도를 올리는 표현의 리더",
  },
  repair_initiator: {
    title: "화해와 해소의 가교 (Repair Initiator)",
    desc: "마찰 발생 시 자존심보다 관계를 아끼며 먼저 손을 내밀고 대화를 여는 평화 유지자",
  },
  autonomy_keeper: {
    title: "자율의 수호자 (Autonomy Keeper)",
    desc: "서로의 건강한 경계와 개인 공간을 지키며 과밀착을 방지하는 독립성의 기둥",
  },
  relationship_regulator: {
    title: "관계 리듬 조율자 (Relationship Regulator)",
    desc: "소통의 주파수와 갈등의 템포를 조절하며 서두르지 않고 깊이 있는 동반을 유지하는 조율사",
  },
};

export function computeRomanticV4GapBatchEngine(params: {
  nameA: string;
  nameB: string;
  psychA: PsychMasterJson | null;
  psychB: PsychMasterJson | null;
}): RomanticGapBatchOutput {
  const { nameA, nameB, psychA, psychB } = params;

  const empA = psychA?.secondary_axes?.empathy ?? 50;
  const structA = psychA?.secondary_axes?.structure ?? 50;
  const stimA = psychA?.secondary_axes?.stimulation ?? 50;
  const recA = psychA?.secondary_axes?.recognition ?? 50;

  const empB = psychB?.secondary_axes?.empathy ?? 50;
  const structB = psychB?.secondary_axes?.structure ?? 50;
  const stimB = psychB?.secondary_axes?.stimulation ?? 50;
  const recB = psychB?.secondary_axes?.recognition ?? 50;

  // 1. Role Matrix Determination
  let roleAType: RomanticRoleType = "emotional_anchor";
  if (empA >= 65 && structA < 60) roleAType = "emotional_anchor";
  else if (stimA >= 65) roleAType = "initiator";
  else if (structA >= 65) roleAType = "practical_stabilizer";
  else if (recA >= 65) roleAType = "affection_initiator";
  else roleAType = "autonomy_keeper";

  let roleBType: RomanticRoleType = "practical_stabilizer";
  if (structB >= 65) roleBType = "practical_stabilizer";
  else if (empB >= 65) roleBType = "repair_initiator";
  else if (stimB >= 65) roleBType = "initiator";
  else roleBType = "relationship_regulator";

  const chapter06: Chapter06RolePowerVulnerability = {
    greatestStrength: `${nameA}님의 ${ROLE_TITLES[roleAType].title} 역할과 ${nameB}님의 ${ROLE_TITLES[roleBType].title} 역할이 맞물려 만들어내는 수용과 체계의 시너지`,
    greatestVulnerability: `갈등 상황에서 ${nameA}님의 감정 처리 속도와 ${nameB}님의 논리적 납득 욕구가 충돌할 때 발생하는 서운함의 누적`,
    depletionPattern: `한쪽이 지속적으로 감정을 정돈하거나 규칙을 강요할 때 일어나는 조용한 에너지 소진`,
    roleMatrix: {
      roleA: { type: roleAType, title: ROLE_TITLES[roleAType].title, description: ROLE_TITLES[roleAType].desc },
      roleB: { type: roleBType, title: ROLE_TITLES[roleBType].title, description: ROLE_TITLES[roleBType].desc },
      complement: `${nameA}님이 관계의 정서적 온도를 지피면 ${nameB}님이 현실적인 리듬으로 안정시키는 시너지`,
      collision: `${nameA}님의 직관적 기대와 ${nameB}님의 구체적 설명 요구가 부딪히는 지점`,
      overFunctionRisk: `${nameA}님이 상대의 기분을 지나치게 살펴 혼자 지치거나, ${nameB}님이 과도한 조언으로 부담을 줄 위험`,
      underFunctionRisk: `마찰 발생 시 서로 상대가 먼저 손 내밀기를 바라며 침묵이 길어질 수 있음`,
    },
    growth: {
      aLearnsFromB: `${nameB}님을 만나면서 감정에 휘둘리지 않고 현실적인 경계와 체계적인 안정감을 배우게 됩니다.`,
      bLearnsFromA: `${nameA}님을 만나면서 자신의 내면 감정을 솔직히 표현하고 따뜻하게 품어주는 부드러움을 배우게 됩니다.`,
    },
  };

  // 2. Wanted vs Given Love
  const wantedVsGivenLove: WantedVsGivenLovePair = {
    loveA: {
      personName: nameA,
      partnerName: nameB,
      wantedLove: "무조건적인 수용과 다정한 말 한마디로 전달되는 확실한 서포트",
      givenLove: "상대의 일상을 구체적으로 챙기고 함께하는 모든 순간에 온전히 몰입하기",
      partnerReception: structB >= 60 ? `${josaEunNeun(nameB)} 이를 든든함으로 받지만 가끔 압박으로 느낄 수 있음` : `${josaIGa(nameB)} 무조건적인 따뜻함으로 긍정 수용함`,
    },
    loveB: {
      personName: nameB,
      partnerName: nameA,
      wantedLove: "서로의 자율성을 존중하면서 필요할 때 명확한 헌신을 보여주는 신뢰",
      givenLove: "문제 해결책을 함께 고민해주고 실질적인 도움을 제공하는 헌신",
      partnerReception: empA >= 60 ? `${josaEunNeun(nameA)} 해결책보다 먼저 공감해주길 바랄 수 있음` : `${josaIGa(nameA)} 실질적 도움으로 잘 받아들임`,
    },
    matchStatus: Math.abs(empA - structB) > 25 ? "PARTIALLY_MATCHED" : "MATCHED",
    summary: `${josaIGa(nameA)} 정서적 수용과 다정한 확답 위주의 사랑을, ${josaIGa(nameB)} 신뢰와 구체적 헌신 위주의 사랑을 주고받는 커플입니다.`,
  };

  // 3. What Not to Expect From Each Other
  const whatNotToExpect: WhatNotToExpect = {
    notToExpectAFromB: [
      {
        title: "즉각적인 감정 공감과 무조건적인 맞장구",
        reason: `${nameB}님은 감정을 흡수하기 전 사건의 맥락과 이유를 먼저 정리해야 납득하는 타입입니다.`,
      },
      {
        title: "말하지 않아도 내 기분을 알아서 알아차려 주기",
        reason: `${nameB}님은 모호한 신호보다 구체적인 대사로 요청할 때 훨씬 잘 반응합니다.`,
      },
    ],
    notToExpectBFromA: [
      {
        title: "갈등 직후 칼같이 냉정하게 잘잘못을 가려내기",
        reason: `${nameA}님은 서운함이 가라앉기 전 훈계나 논리적 지적을 받으면 마음을 닫기 쉽습니다.`,
      },
      {
        title: "항상 흐트러짐 없이 완벽한 규칙을 지켜주기",
        reason: `${nameA}님은 규율보다 그 순간의 친밀한 감정선이 훨씬 더 중요한 사람입니다.`,
      },
    ],
  };

  // 4. When We Need Each Other Most
  const whenWeNeedEachOtherMost: WhenWeNeedEachOtherMost = {
    whenANeedsB: [
      {
        sceneTitle: "외부 일로 마음이 복잡해져 혼자 중심 잡기 힘들 때",
        concreteContext: `${nameB}님이 옆에서 흔들리지 않고 차분한 해결책과 기준을 제시해 줄 때 가장 든든함을 느낍니다.`,
      },
    ],
    whenBNeedsA: [
      {
        sceneTitle: "지친 하루 끝에 묵묵히 내 편이 되어주는 안식처가 필요할 때",
        concreteContext: `${nameA}님이 잘잘못을 묻지 않고 따뜻한 체온으로 다독여 줄 때 비로소 긴장이 풀어집니다.`,
      },
    ],
  };

  // 5. Emergency Romantic SOS Scripts
  const emergencySos: EmergencyRomanticSosScripts = {
    sosAtoB: {
      seekerName: nameA,
      providerName: nameB,
      trigger: `${nameB}님이 지적하거나 차갑게 침묵할 때`,
      doNot: "누가 옳은지 옳고 그름을 따지며 서둘러 해명하려 재촉하기",
      firstLine: `"아까 당신 말이 서운해서 당황했어. 나랑 대화할 준비되면 알려줘."`,
      bridgeLine: `"잘잘못을 가리자는 게 아니라, 내 마음을 좀 이해받고 싶었어."`,
      reconnectionLine: `"우리 손잡고 맛있는 거 먹으면서 천천히 다시 얘기하자."`,
    },
    sosBtoA: {
      seekerName: nameB,
      providerName: nameA,
      trigger: `${nameA}님의 감정이 격해져서 대화의 결이 엇갈릴 때`,
      doNot: `${nameA}님의 감정을 '예민하다'며 무시하거나 자리를 확 떠나버리기`,
      firstLine: `"내가 표현이 딱딱해서 당신 마음을 아프게 한 것 같아 미안해."`,
      bridgeLine: `"내 의도는 당신을 지적하려던 게 아니라 우리 관계를 잘 지키고 싶어서였어."`,
      reconnectionLine: `"잠깐 30분만 쿨링다운하고 당신 이야기 다 들어줄게."`,
    },
  };

  // 6. Long-Term Relationship Bond Prescription
  const longTermBond: LongTermRelationshipBondPrescription = {
    keepDoing: [
      "서로의 다른 표현 방식을 '틀림'이 아닌 '다름'으로 존중하는 태도 유지",
      "고마운 순간을 미루지 않고 즉시 구체적인 대사로 칭찬하기",
    ],
    watchOut: [
      "서운함이 생겼을 때 제때 말하지 않고 침묵으로 쌓아두는 습관",
      "상대의 선의를 '지적'이나 '통제'로 오해하는 조급함",
    ],
    relationshipRitual: [
      "주말 한 번은 아무 일도 하지 않고 오롯이 둘만의 다정한 시간 보내기",
      "갈등 후 30분간의 쿨링다운 포즈 루틴 지키기",
    ],
  };

function extractAxis(psych: any, key: string): number {
  if (!psych) return 50;
  if (psych.secondary_axes && typeof psych.secondary_axes[key] === "number") {
    return psych.secondary_axes[key];
  }
  if (typeof psych[key] === "number") {
    return psych[key];
  }
  return 50;
}

function computeConflictStateTransition(
  name: string,
  psych: PsychMasterJson | null,
  isPersonA: boolean = true,
): ConflictStateTransition {
  const emp = extractAxis(psych, "empathy");
  const struct = extractAxis(psych, "structure");
  const selfControl = extractAxis(psych, "self_control");
  const conflictStyle = extractAxis(psych, "conflict_style");
  const rec = extractAxis(psych, "recognition");
  const stim = extractAxis(psych, "stimulation");

  const hasPsych = Boolean(psych && psych.secondary_axes);

  // Pattern 1: Expressive Anxious (Sera type: High self-control/empathy + high recognition need)
  if (hasPsych && (rec >= 60 || emp >= 60) && struct < 70) {
    return {
      personName: name,
      normalState: `평소에는 다정하고 상대의 기분을 세심하게 살피며 수용적인 태도`,
      tensionRising: `서운함이나 갈등 조짐이 생기면 즉시 드러내지 않고 감정을 억누르며 상대를 침묵 속에서 관찰함`,
      overloadState: `감정적 억제가 임계점을 넘어서면 순간적으로 서운함과 불안이 한꺼번에 터져 나오며 즉각적인 사과와 확실한 감정 표현을 강력히 요구함`,
      recoveryState: `상대의 따뜻하고 명확한 인정과 다정한 확답을 듣고 나면 안도감을 느끼며 마음이 눈 녹듯 풀어짐`,
      canonicalSummary: `${josaIGa(name)} 초기에는 서운함을 억누르며 참다가, 불안 임계점을 넘으면 즉시 명확한 감정 확인과 해결을 바라는 억제-후-즉시해결형 흐름을 보입니다.`,
    };
  }

  // Pattern 2: Logical Withdrawing (Donggle type: High structure / self-control -> Logical analysis then silence/withdrawal)
  if (hasPsych && (struct >= 60 || (selfControl >= 60 && emp < 60))) {
    return {
      personName: name,
      normalState: `평소에는 든든하고 이성적이며 관계의 객관적인 밸런스를 지키는 안정적인 태도`,
      tensionRising: `갈등 분위기가 형성되면 감정적 조급함보다는 인과관계를 논리적으로 파악하고 이유를 분석하려 함`,
      overloadState: `상대의 일방적인 감정 재촉이나 시급한 해명 요구가 고조되면 감정 과부하를 느끼며 서둘러 입을 닫고 차갑게 침묵으로 자신을 방어함`,
      recoveryState: `충분한 혼자만의 쿨링다운 시간을 가진 후 이성적인 대화 구도가 준비되면 차분하게 소통에 재접속함`,
      canonicalSummary: `${josaIGa(name)} 초기에는 논리적인 상황 분석을 시도하다가, 감정 과부하 시 침묵과 거리두기로 자신을 방어하는 흐름을 보입니다.`,
    };
  }

  // Pattern 3: Active Confronter (High conflict style / stimulation -> Direct immediate confrontation)
  if (conflictStyle >= 65 || stim >= 65) {
    return {
      personName: name,
      normalState: `솔직하고 명확하며 문제 조짐이 보이면 돌려 말하지 않는 화끈한 태도`,
      tensionRising: `불합리함이나 서운함을 느끼면 그 자리에서 바로 문제를 짚고 직면하려 함`,
      overloadState: `상대가 회피하거나 미루려 하면 언성이 높아지며 빠른 행동 변화와 직설적인 답변을 강력히 주도함`,
      recoveryState: `문제가 명확히 정리되고 확실한 약속이 세워지면 뒤끝 없이 쿨하게 회복함`,
      canonicalSummary: `${josaIGa(name)} 문제 조짐이 나타나면 피하지 않고 즉시 직면하여 확실한 결론을 도출하려는 주도형 흐름을 보입니다.`,
    };
  }

  // Pattern 4: Harmony Adapter (Default / Balanced)
  return {
    personName: name,
    normalState: `상대의 의견을 적극 경청하며 조화롭고 평화로운 관계 분위기를 최우선함`,
    tensionRising: `대립이 심해지는 것을 막기 위해 자신의 주장보다 상대의 톤과 기분에 맞춰줌`,
    overloadState: `갈등이 잦아지고 압박이 지속되면 자책하거나 깊은 무력감을 느끼며 마음의 문을 닫음`,
    recoveryState: `상대가 먼저 다정하게 다가와 감정을 부드럽게 쓰다듬어 주면 안정감을 찾음`,
    canonicalSummary: `${josaIGa(name)} 평화 유지를 위해 조용히 수용하며 조율하다가, 따뜻한 다가옴에 빠르게 안정을 찾는 수용형 흐름을 보입니다.`,
  };
}

  // 7. Conflict State Transitions (Narrative Canonicalization)
  const conflictTransitions = {
    transitionA: computeConflictStateTransition(nameA, psychA, true),
    transitionB: computeConflictStateTransition(nameB, psychB, false),
  };
  const physicalIntimacy: PhysicalIntimacyDetail = {
    desiredClosenessA: empA >= 60 ? "정서적 신뢰와 다정한 대화가 선행된 후의 자연스러운 스킨십" : "적당한 거리감과 서로의 개인 공간을 존중하는 다정한 스킨십",
    desiredClosenessB: empB >= 60 ? "마음이 완전히 열렸을 때 표현하는 순수한 온기의 친밀감" : "서두르지 않고 템포를 맞춰가는 은은한 스킨십",
    tempoMatch: Math.abs(empA - empB) <= 20 ? "MATCHED" : "TEMPO_GAP",
    spaceNeed: structA >= 65 || structB >= 65 ? "개인적인 침해 없는 선명한 경계 유지" : "자연스러운 공유와 유연한 경계",
    summary: `${nameA}님과 ${nameB}님은 서로의 정서적 안정 조건과 스킨십 템포를 존중할 때 가장 깊은 피지컬 케미스트리를 형성합니다.`,
  };

  return {
    chapter06,
    wantedVsGivenLove,
    whatNotToExpect,
    whenWeNeedEachOtherMost,
    emergencySos,
    longTermBond,
    physicalIntimacy,
    conflictTransitions,
  };
}
