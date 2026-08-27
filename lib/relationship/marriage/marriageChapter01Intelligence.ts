import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import { resolveSpousePalaceProfile } from "@/lib/relationship/romantic/prototypeV4/spousePalaceMatcher";
import { calculateTenGod, getHiddenStemsData } from "@/lib/saju/repository";

export type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW";

export type AttractionCategory =
  | "comfortable_familiar"
  | "stimulating_magnetic"
  | "respect_trust"
  | "emotional_openness"
  | "practical_reliance"
  | "peer_camaraderie"
  | "tense_curious";

export type AttractionDriver = {
  category: AttractionCategory;
  categoryLabel: string;
  headline: string;
  whatDrawsA: string;
  whatDrawsB: string;
  description: string;
  confidence: ConfidenceLevel;
};

export type DirectionalNeed = {
  seekerName: string;
  partnerName: string;
  innateNeedLabel: string;
  partnerExpectationLabel: string;
  whySeekerHasNeed: string;
  partnerTraitMeetingIt: string;
  howItFeelsInMarriage: string;
  whyPartnerIsNeeded: string;
  deliveryStatusNarrative: string;
  semanticDimension: string;
  confidence: ConfidenceLevel;
};

export type DirectionalMeaning = {
  giverName: string;
  receiverName: string;
  roleTitle: string;
  partnerOriginalState: string;
  giverStateChangeEffect: string;
  description: string;
  semanticDimension: string;
  confidence: ConfidenceLevel;
};

export type DirectionalTransformation = {
  targetName: string;
  partnerName: string;
  beforeState: string;
  partnerInfluence: string;
  emergingSelf: string;
  primaryTransformation: string;
  shadowTransformation?: string;
  confidence: ConfidenceLevel;
};

export type CoupleIdentitySynthesis = {
  title: string;
  synthesisNarrative: string;
  confidence: ConfidenceLevel;
};

export type Chapter01Provenance = {
  sourceInsightIds: string[];
  semanticDimensions: {
    needAtoB: string;
    needBtoA: string;
    meaningAtoB: string;
    meaningBtoA: string;
    coupleIdentity: string;
  };
  confidence: ConfidenceLevel;
  fallbackUsed: boolean;
};

export type MarriageChapter01Bundle = {
  heroSynthesis?: string;
  provenance?: Chapter01Provenance;
  attraction: {
    drivers: AttractionDriver[];
    pairSynthesis: string;
    confidence: ConfidenceLevel;
  };
  mutualNeed: {
    needAtoB: DirectionalNeed;
    needBtoA: DirectionalNeed;
    confidence: ConfidenceLevel;
  };
  directionalMeaning: {
    meaningAtoB: DirectionalMeaning;
    meaningBtoA: DirectionalMeaning;
    confidence: ConfidenceLevel;
  };
  mutualTransformation: {
    transformationA: DirectionalTransformation;
    transformationB: DirectionalTransformation;
    confidence: ConfidenceLevel;
  };
  coupleIdentity: CoupleIdentitySynthesis;
};

// ----------------------------------------------------------------------------
// Korean Particle Helpers
// ----------------------------------------------------------------------------
export function josa(name: string, type: "이/가" | "은/는" | "을/를" | "과/와"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lastChar = trimmed.charCodeAt(trimmed.length - 1);
  const isHangul = lastChar >= 0xac00 && lastChar <= 0xd7a3;
  if (!isHangul) {
    if (type === "이/가") return `${trimmed}가`;
    if (type === "은/는") return `${trimmed}는`;
    if (type === "을/를") return `${trimmed}를`;
    if (type === "과/와") return `${trimmed}와`;
    return trimmed;
  }
  const hasJongsung = (lastChar - 0xac00) % 28 !== 0;
  if (type === "이/가") return hasJongsung ? `${trimmed}이` : `${trimmed}가`;
  if (type === "은/는") return hasJongsung ? `${trimmed}은` : `${trimmed}는`;
  if (type === "을/를") return hasJongsung ? `${trimmed}을` : `${trimmed}를`;
  if (type === "과/와") return hasJongsung ? `${trimmed}과` : `${trimmed}와`;
  return trimmed;
}

export function josaEunNeun(name: string): string { return josa(name, "은/는"); }
export function josaIGa(name: string): string { return josa(name, "이/가"); }
export function josaEulReul(name: string): string { return josa(name, "을/를"); }
export function josaGwaWa(name: string): string { return josa(name, "과/와"); }

// ----------------------------------------------------------------------------
// Sanitize Copy (Banned Jargon & Abstract AI-like Korean Filter)
// ----------------------------------------------------------------------------
function sanitizeCopy(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/관성\s*\([^)]*\)|식상\s*\([^)]*\)|재성\s*\([^)]*\)|인성\s*\([^)]*\)|비겁\s*\([^)]*\)/g, "");
  cleaned = cleaned.replace(/관성|식상|재성|인성|비겁|일간|일지|월지|천간|지지|지장간/g, "");
  cleaned = cleaned.replace(/책임과 판단의 기류를 부담하느라|책임의 기류를 혼자 쥐하느라/g, "스스로 결정하고 책임지려는 성향이 강하여");
  cleaned = cleaned.replace(/무거운 통제력을 내려놓고|통제력을 내려놓고/g, "내가 다 결정하지 않아도 되는");
  cleaned = cleaned.replace(/심리적 여백|귀중한 여백|내면적 공간/g, "마음 편히 쉴 여유");
  cleaned = cleaned.replace(/삶의 방향을 추진하도록|삶의 방향을 추진하게/g, "방향을 잡고 안심하며 나아가도록");
  cleaned = cleaned.replace(/일상의 통제력을 매번 가동하지 않고도|일상의 통제력을 가동하느라/g, "모든 걸 혼자 챙기려 애쓰지 않고도");
  cleaned = cleaned.replace(/부부 동력을|부부 동력/g, "함께 살아가는 힘을");
  cleaned = cleaned.replace(/치유받는다|상처를 치료한다|상처를 씻어준다/g, "마음의 부담을 내려놓고 안식을 얻습니다");
  cleaned = cleaned.replace(/자존감이 높아진다|자존감이 단단해진다/g, "스스로에 대한 확신과 안정감을 갖추게 됩니다");
  cleaned = cleaned.replace(/모서리가 다듬어진다/g, "생활의 유연함과 정서적 여유가 생깁니다");
  cleaned = cleaned.replace(/완성된다/g, "더 깊은 라이프 시너지를 만들어냅니다");
  cleaned = cleaned.replace(/부족함을 채운다/g, "필요한 자리를 서로 든든하게 받쳐줍니다");
  cleaned = cleaned.replace(/Balanced & Harmony-First — /g, "");
  cleaned = cleaned.replace(/운명적 정서 끌림형 패밀리/g, "서로의 공간을 깊이 존중하는 부부");
  cleaned = cleaned.replace(/보완형 안정 커플/g, "서로의 강점이 조화를 이루는 커플");
  cleaned = cleaned.replace(/서로의 다름이 보완으로 작동합니다/g, "한 사람이 중심을 잡으면 다른 한 사람이 포용력으로 함께 일상을 구축합니다");
  cleaned = cleaned.replace(/이상적인 부부로 거듭납니다|완벽한 시너지를 이룹니다|운명적인 결합을 완성합니다/g, "서로의 강점이 결합하여 단단한 생활 동력을 갖추게 됩니다");
  cleaned = cleaned.replace(/깊은 시너지/g, "구체적인 생활 시너지");
  cleaned = cleaned.replace(/특별한 끌림/g, "자연스러운 이끌림");
  cleaned = cleaned.replace(/든든한 버팀목/g, "실질적인 조력자");
  cleaned = cleaned.replace(/부부적 다정함/g, "다정한 포용력");
  cleaned = cleaned.replace(/가사의 책임을 짊어지하느라|가사의 책임을 짊어지려|가사의 부담|가사나 의사결정|가사 파트너십/g, "책임과 판단을 부담하느라");
  return cleaned;
}

function getAttractionCategoryLabel(cat: AttractionCategory, isEn: boolean): string {
  switch (cat) {
    case "comfortable_familiar": return isEn ? "Comfortable & Familiar Pull" : "편안하고 말 없이 통하는 끌림";
    case "stimulating_magnetic": return isEn ? "Passionate & Magnetic Attraction" : "선명하고 강렬하게 이끄는 자극";
    case "respect_trust": return isEn ? "Respect & Trust Chemistry" : "존경과 신뢰 기반의 깊은 안정감";
    case "emotional_openness": return isEn ? "Warm Emotional Resonance" : "자연스럽게 마음이 열리는 정서적 온기";
    case "practical_reliance": return isEn ? "Grounded Practical Support" : "현실적으로 의지하고 싶은 든든함";
    case "peer_camaraderie": return isEn ? "Equal Partner Camaraderie" : "동료처럼 대등한 눈높이의 친밀감";
    case "tense_curious": return isEn ? "Spark of Tension & Curiosity" : "강한 호기심과 긴장감이 섞인 자극";
  }
}

const STEM_ELEMENT_MAP: Record<string, string> = {
  gap: "wood", eul: "wood", byeong: "fire", jeong: "fire", mu: "earth", gi: "earth", gyeong: "metal", sin: "metal", im: "water", gye: "water",
};

const BRANCH_ELEMENT_MAP: Record<string, string> = {
  in: "wood", myo: "wood", sa: "fire", o: "fire", oh: "fire", jin: "earth", chuk: "earth", chook: "earth", mi: "earth", sul: "earth", sin: "metal", yu: "metal", hae: "water", ja: "water",
};

function chartToIndividualSajuAdapter(chart: any): any {
  const dayStemCode = chart.dayStemCode ?? "gap";
  const dayBranchCode = chart.dayBranchCode ?? "ja";
  const hidden = getHiddenStemsData(dayBranchCode);
  const mainStem = hidden?.find(h => h.layer_type === "정기" || h.layer_type === "본기")?.stem_code ?? hidden?.[hidden.length - 1]?.stem_code ?? "gap";
  const tenGodCode = calculateTenGod(dayStemCode, mainStem);

  return {
    day_master: {
      stem: { code: dayStemCode, element: STEM_ELEMENT_MAP[dayStemCode] ?? "wood" },
      day_branch: { code: dayBranchCode, element: BRANCH_ELEMENT_MAP[dayBranchCode] ?? "water" },
    },
    five_elements: {
      dominant: STEM_ELEMENT_MAP[dayStemCode] ?? "wood",
      weakest: "metal",
    },
    pillars: [
      {
        slot: "year",
        stem: { code: chart.yearStemCode ?? "gap", element: STEM_ELEMENT_MAP[chart.yearStemCode] ?? "wood" },
        branch: { code: chart.yearBranchCode ?? "ja", element: BRANCH_ELEMENT_MAP[chart.yearBranchCode] ?? "water" },
        branch_ten_god: { code: "bigyeon" },
      },
      {
        slot: "month",
        stem: { code: chart.monthStemCode ?? "gap", element: STEM_ELEMENT_MAP[chart.monthStemCode] ?? "wood" },
        branch: { code: chart.monthBranchCode ?? "ja", element: BRANCH_ELEMENT_MAP[chart.monthBranchCode] ?? "water" },
        branch_ten_god: { code: "bigyeon" },
      },
      {
        slot: "day",
        stem: { code: dayStemCode, element: STEM_ELEMENT_MAP[dayStemCode] ?? "wood" },
        branch: { code: dayBranchCode, element: BRANCH_ELEMENT_MAP[dayBranchCode] ?? "water" },
        branch_ten_god: { code: tenGodCode },
      },
    ],
  };
}

export function buildMarriageChapter01Intelligence(params: {
  ctx: MarriageRuleContext;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): MarriageChapter01Bundle {
  const locale = params.locale ?? "ko-KR";
  const isEn = locale === "en-US";
  const { ctx, psychA, psychB } = params;
  const a = ctx.nicknameA;
  const b = ctx.nicknameB;

  const aEunNeun = josaEunNeun(a);
  const bEunNeun = josaEunNeun(b);
  const aIGa = josaIGa(a);
  const bIGa = josaIGa(b);
  const aEulReul = josaEulReul(a);
  const bEulReul = josaEulReul(b);
  const aGwaWa = josaGwaWa(a);
  const bGwaWa = josaGwaWa(b);

  const chartA = ctx.marriagePairAnalysis.chartA;
  const chartB = ctx.marriagePairAnalysis.chartB;
  const sig = ctx.marriagePairAnalysis.scoringSignals;

  const indA = chartToIndividualSajuAdapter(chartA);
  const indB = chartToIndividualSajuAdapter(chartB);

  const spousePalaceA = resolveSpousePalaceProfile(indA, "a", a, isEn ? "en-US" : "ko-KR");
  const spousePalaceB = resolveSpousePalaceProfile(indB, "b", b, isEn ? "en-US" : "ko-KR");

  const axesA = psychA?.secondary_axes ?? {};
  const axesB = psychB?.secondary_axes ?? {};

  const sourceInsightIds: string[] = ["chartA", "chartB", "spousePalaceA", "spousePalaceB"];
  if (psychA) sourceInsightIds.push("psychA");
  if (psychB) sourceInsightIds.push("psychB");

  // --------------------------------------------------------------------------
  // 1. ATTRACTION ( 왜 처음 서로에게 끌렸을까 )
  // --------------------------------------------------------------------------
  const drivers: AttractionDriver[] = [];

  if (sig.hasHeavenlyStemCombine) {
    drivers.push({
      category: "stimulating_magnetic",
      categoryLabel: getAttractionCategoryLabel("stimulating_magnetic", isEn),
      headline: isEn ? "Attraction that feels natural from the start" : "처음 대화를 시작할 때부터 느껴진 특별한 기류",
      whatDrawsA: `${aEunNeun} ${b}님의 차분하고 다정한 태도가 마음의 긴장을 풀어줄 것이라는 안도감에 자연스럽게 이끌렸습니다.`,
      whatDrawsB: `${bEunNeun} ${a}님이 보여주는 분명한 소신과 결단력이 세상을 함께 헤쳐갈 든든함으로 다가와 끌렸습니다.`,
      description: isEn
        ? `When ${a} and ${b} first met, there was an unspoken magnetic ease — a feeling that you didn't need to explain yourselves at length to understand each other.`
        : `${aEunNeun} ${bGwaWa} 처음 만났을 때, 긴 설명 없이도 서로의 분위기가 마음 편하게 통하는 느낌을 받았습니다.`,
      confidence: "HIGH",
    });
  }

  if (sig.hasDayBranchCombine) {
    drivers.push({
      category: "comfortable_familiar",
      categoryLabel: getAttractionCategoryLabel("comfortable_familiar", isEn),
      headline: isEn ? "Deep comfort like being in your own home" : "오래 알고 지낸 것 같은 안식처 같은 편안함",
      whatDrawsA: `${aEunNeun} ${b}님과 함께 있을 때 무언가를 억지로 잘 보이려 애쓰지 않아도 되는 편안함에 끌렸습니다.`,
      whatDrawsB: `${bEunNeun} ${a}님이 세워주는 안정된 기준과 흔들림 없는 모습에서 안도감을 느꼈습니다.`,
      description: isEn
        ? `Shared domestic energy creates an immediate sense of safety — being together feels as relaxed as resting in a familiar sanctuary.`
        : `${aEunNeun} ${b}님과 한 공간에 있을 때 마음이 안돈되며 낯선 긴장보다는 익숙함이 두 사람을 이어주었습니다.`,
      confidence: "HIGH",
    });
  }

  if (sig.hasDayBranchClash || sig.hasDayBranchWonjin) {
    drivers.push({
      category: "tense_curious",
      categoryLabel: getAttractionCategoryLabel("tense_curious", isEn),
      headline: isEn ? "A spark of curiosity born from different rhythms" : "서로의 다름에서 오는 선명한 호기심과 긴장감",
      whatDrawsA: `${aEunNeun} ${b}님의 예상치 못한 반응과 나와는 다른 생활 템포에 신선한 흥미를 느꼈습니다.`,
      whatDrawsB: `${bEunNeun} ${a}님이 보여주는 거침없는 추진력과 강렬한 속도감에서 신선한 자극을 받았습니다.`,
      description: isEn
        ? `Discrepancies in living tempo and inner expression create a sharp, fascinating spark — making each other impossible to ignore.`
        : `${aEunNeun} ${bGwaWa} 생활 템포나 반응 방식이 달라 쉽게 예측할 수 없는 신선함이 서로를 호기심 있게 바라보게 만들었습니다.`,
      confidence: "HIGH",
    });
  }

  if (chartA.dayStemCode === chartB.dayStemCode) {
    drivers.push({
      category: "peer_camaraderie",
      categoryLabel: getAttractionCategoryLabel("peer_camaraderie", isEn),
      headline: isEn ? "Equal partnership walking at eye level" : "대등한 눈높이에서 나란히 걷는 동료적 친밀감",
      whatDrawsA: `${aEunNeun} ${b}님이 삶을 주도해 나가는 자율적이고 독립적인 태도에서 깊은 동질감을 느꼈습니다.`,
      whatDrawsB: `${bEunNeun} ${a}님이 나란한 눈높이에서 서로의 영역을 존중해주는 대등함에 마음이 끌렸습니다.`,
      description: isEn
        ? `${a} and ${b} view life from a similar horizon, forming an equal partnership where mutual independence is respected.`
        : `${aEunNeun} ${bGwaWa} 세상을 바라보는 눈높이가 닮아 있어 대등한 동료 파트너로서 친밀감을 느꼈습니다.`,
      confidence: "MODERATE",
    });
  } else {
    drivers.push({
      category: "respect_trust",
      categoryLabel: getAttractionCategoryLabel("respect_trust", isEn),
      headline: isEn ? "Mutual respect grounded in contrasting strengths" : "서로 다른 장점이 주는 존경과 든든함",
      whatDrawsA: `${aEunNeun} ${b}님이 지닌 차분함과 다정한 수용력이 자신에게 없는 편안함을 더해줄 것이라는 신뢰에 끌렸습니다.`,
      whatDrawsB: `${bEunNeun} ${a}님이 지닌 분명한 소신과 결단력이 삶의 든든한 기준이 되어줄 것이라는 존경을 느꼈습니다.`,
      description: isEn
        ? `Each partner holds clear strengths the other values, building an attraction rooted in genuine respect and practical security.`
        : `${aEunNeun} ${b}님이 가진 장점이 본인과 달라, 서로를 실질적으로 받쳐줄 수 있다는 깊은 신뢰가 끌림의 바탕이 되었습니다.`,
      confidence: "MODERATE",
    });
  }

  const finalDrivers = drivers.slice(0, 3);
  const heroDriver = finalDrivers[0];
  const pairAttractionSynthesis = sanitizeCopy(
    heroDriver?.whatDrawsA && heroDriver?.whatDrawsB
      ? `${heroDriver.whatDrawsA} ${heroDriver.whatDrawsB}`
      : isEn
        ? `For ${a}, ${b}'s gentle acceptance offers relaxed comfort; for ${b}, ${a}'s clear direction builds dependable trust.`
        : `${a}님에게는 ${b}님의 다정한 포용력이 긴장을 덜어주는 매력으로, ${b}님에게는 ${a}님의 명확한 주도성이 믿고 함께 움직일 수 있는 이끌림으로 다가오는 조합입니다.`
  );

  // --------------------------------------------------------------------------
  // 2. MUTUAL NEED ( 좋아하는 것을 넘어, 왜 서로가 필요했을까 )
  //    Plain Korean synthesis without abstract AI jargon
  // --------------------------------------------------------------------------
  const buildDeepNeedChain = (
    seeker: string,
    partner: string,
    spouseProfile: ReturnType<typeof resolveSpousePalaceProfile>,
    seekerAxes: Record<string, number>,
    partnerAxes: Record<string, number>
  ) => {
    const sEunNeun = josaEunNeun(seeker);
    const sIGa = josaIGa(seeker);
    const pEunNeun = josaEunNeun(partner);
    const pIGa = josaIGa(partner);
    const pEulReul = josaEulReul(partner);

    const family = spouseProfile.tenGodFamily;
    let innateNeedLabel = "";
    let whySeekerHasNeed = "";
    let partnerTraitMeetingIt = "";
    let howItFeelsInMarriage = "";
    let semanticDimension = "";

    if (family.includes("비겁") || (seekerAxes.structure ?? 50) >= 60) {
      semanticDimension = "AUTONOMY_AND_SANCTUARY";
      innateNeedLabel = "독립된 자율성과 안식";
      whySeekerHasNeed = `${sEunNeun} 내가 다 결정하고 챙기려다 보니 마음의 긴장이 쌓일 때가 많아요. 그래서 가까운 사람 앞에서는 내가 다 주도하지 않아도 마음 편히 쉴 수 있는 여유가 꼭 필요해요.`;
      partnerTraitMeetingIt = `${pEunNeun} 내 방식을 억지로 바꾸려 하지 않고, 내 기분과 상황을 다정하게 받아주는 넉넉한 마음이 있어요.`;
      howItFeelsInMarriage = `그래서 ${partner}님과 함께 있을 때는 잘해야 한다는 부담을 내려놓고 가장 나다운 모습으로 편하게 머물 수 있어요.`;
    } else if (family.includes("관성") || (seekerAxes.practicality ?? 50) >= 60) {
      semanticDimension = "DECISION_AND_STRUCTURE";
      innateNeedLabel = "명확한 기준과 판단력";
      whySeekerHasNeed = `${sEunNeun} 생각과 고민이 많아 중요한 순간에 선뜻 결정하기 어려울 때가 있어요. 그래서 불안할 때 딱 기준을 잡아주고 방향을 정해줄 사람을 필요로 해요.`;
      partnerTraitMeetingIt = `${pEunNeun} 고민이 길어질 때 흔들리지 않고 확실하게 방향을 정해주는 단단한 결단력이 있어요.`;
      howItFeelsInMarriage = `그래서 중요한 갈림길에 섰을 때 ${partner}님이 곁에 있으면 막연한 불안을 덜고 안심하며 함께 움직일 수 있어요.`;
    } else if (family.includes("식상") || (seekerAxes.energy_style ?? 50) >= 60) {
      semanticDimension = "EMOTIONAL_EXPRESSION";
      innateNeedLabel = "솔직한 감정 수용과 경청";
      whySeekerHasNeed = `${sEunNeun} 내면의 생각과 솔직한 감정을 자주 표현하는 편이라, 내 이야기를 말을 끊지 않고 끝까지 들어줄 따뜻한 경청을 원해요.`;
      partnerTraitMeetingIt = `${pEunNeun} 상대의 이야기를 귀 기울여 들어주고 마음을 품어주는 다정한 경청의 자세가 있어요.`;
      howItFeelsInMarriage = `그래서 답답하거나 속상한 일이 생겨도 ${partner}님에게 솔직하게 털어놓는 것만으로 마음이 풀리고 안정을 찾게 돼요.`;
    } else if (family.includes("인성") || (seekerAxes.empathy ?? 50) >= 60) {
      semanticDimension = "UNCONDITIONAL_RESIDENCY";
      innateNeedLabel = "무조건적인 내 편의 신뢰";
      whySeekerHasNeed = `${sEunNeun} 어떤 상황에서도 나를 믿어주고 감싸주는 든든한 내 편이 되어주길 바라는 마음이 커요.`;
      partnerTraitMeetingIt = `${pEunNeun} 주변 상황에 흔들리지 않고 항상 한결같은 태도로 곁을 지키는 묵직한 신뢰를 보여줘요.`;
      howItFeelsInMarriage = `그래서 밖에서 힘들고 지쳐도 ${partner}님이 지키고 있는 곁으로 돌아오는 것만으로 마음이 든든해져요.`;
    } else {
      semanticDimension = "PRACTICAL_PARTNERSHIP";
      innateNeedLabel = "실질적 실행 파트너십";
      whySeekerHasNeed = `${sEunNeun} 말로만 하는 위로보다는 실제로 생활의 짐을 함께 나누어 짊어질 든든한 실행 파트너를 필요로 해요.`;
      partnerTraitMeetingIt = `${pEunNeun} 필요할 때 묵묵히 곁에서 할 일을 해내고 의지가 되어주는 행동력이 있어요.`;
      howItFeelsInMarriage = `그래서 생활의 무게를 혼자 감당하지 않고 ${partner}님과 나누어 짊어짐으로써 깊은 안도감을 느껴요.`;
    }

    const whyPartnerIsNeeded = sanitizeCopy(
      `${whySeekerHasNeed} ${partnerTraitMeetingIt} ${howItFeelsInMarriage}`
    );

    return {
      innateNeedLabel: sanitizeCopy(innateNeedLabel),
      whySeekerHasNeed: sanitizeCopy(whySeekerHasNeed),
      partnerTraitMeetingIt: sanitizeCopy(partnerTraitMeetingIt),
      howItFeelsInMarriage: sanitizeCopy(howItFeelsInMarriage),
      whyPartnerIsNeeded,
      semanticDimension,
    };
  };

  const chainAtoB = buildDeepNeedChain(a, b, spousePalaceA, axesA, axesB);
  const chainBtoA = buildDeepNeedChain(b, a, spousePalaceB, axesB, axesA);

  const needAtoB: DirectionalNeed = {
    seekerName: a,
    partnerName: b,
    innateNeedLabel: chainAtoB.innateNeedLabel,
    partnerExpectationLabel: sanitizeCopy(spousePalaceA.partnerExpectation),
    whySeekerHasNeed: chainAtoB.whySeekerHasNeed,
    partnerTraitMeetingIt: chainAtoB.partnerTraitMeetingIt,
    howItFeelsInMarriage: chainAtoB.howItFeelsInMarriage,
    whyPartnerIsNeeded: chainAtoB.whyPartnerIsNeeded,
    deliveryStatusNarrative: (axesB.empathy ?? 50) >= 55
      ? isEn ? `${b}'s high empathy actively fulfills ${a}'s intimate expectation at home.` : `${bEunNeun} 다정한 응답력으로 ${a}님이 필요로 하는 내면의 안정감을 든든하게 채워주고 있습니다.`
      : isEn ? `${b} supports ${a} through practical consistency and stability.` : `${bEunNeun} 묵묵한 한결같음으로 ${a}님이 필요로 하는 안식을 받쳐주고 있습니다.`,
    semanticDimension: chainAtoB.semanticDimension,
    confidence: "HIGH",
  };

  const needBtoA: DirectionalNeed = {
    seekerName: b,
    partnerName: a,
    innateNeedLabel: chainBtoA.innateNeedLabel,
    partnerExpectationLabel: sanitizeCopy(spousePalaceB.partnerExpectation),
    whySeekerHasNeed: chainBtoA.whySeekerHasNeed,
    partnerTraitMeetingIt: chainBtoA.partnerTraitMeetingIt,
    howItFeelsInMarriage: chainBtoA.howItFeelsInMarriage,
    whyPartnerIsNeeded: chainBtoA.whyPartnerIsNeeded,
    deliveryStatusNarrative: (axesA.structure ?? 50) >= 55
      ? isEn ? `${a}'s firm direction offers ${b} clear grounding.` : `${aIGa} 보여주는 분명한 소신과 결단력이 ${b}님에게 든든한 가이드가 되어줍니다.`
      : isEn ? `${a} provides steady presence and practical consideration.` : `${aEunNeun} 세심한 배려와 든든한 태도로 ${b}님이 필요로 하는 안도감을 채워주고 있습니다.`,
    semanticDimension: chainBtoA.semanticDimension,
    confidence: "HIGH",
  };

  // --------------------------------------------------------------------------
  // 3. DIRECTIONAL PARTNER MEANING ( 나는 이 사람에게 어떤 존재일까 )
  //    Perspective: WHAT ROLE / INFLUENCE I OCCUPY IN YOUR LIFE
  //    Plain Korean titles & influence descriptions
  // --------------------------------------------------------------------------
  const excludedAtoB = chainBtoA.semanticDimension;
  const excludedBtoA = chainAtoB.semanticDimension;

  const resolveMeaningAtoB = (): DirectionalMeaning => {
    const familyA = spousePalaceA.tenGodFamily;

    // Option 1: DECISION & STRUCTURE (기준점)
    if (excludedAtoB !== "DECISION_AND_STRUCTURE" && (familyA.includes("관성") || (axesA.structure ?? 50) >= 55)) {
      return {
        giverName: a,
        receiverName: b,
        roleTitle: isEn ? "The Anchor Who Clarifies Direction When Confused" : "고민이 길어질 때 결정을 도와주는 사람",
        partnerOriginalState: "",
        giverStateChangeEffect: "",
        description: sanitizeCopy(
          `${a}님이 보여주는 단단한 소신과 결단력은 ${b}님이 이것저것 재느라 주저할 때 고민을 덜고 안심하며 앞으로 나아가도록 이끌어줍니다.`
        ),
        semanticDimension: "DECISION_AND_STRUCTURE",
        confidence: "HIGH",
      };
    }

    // Option 2: CATALYST (실행 동력)
    if (excludedAtoB !== "CATALYST" && (familyA.includes("비겁") || (axesA.practicality ?? 50) >= 55)) {
      return {
        giverName: a,
        receiverName: b,
        roleTitle: isEn ? "The Catalyst Who Turns Ideas Into Action" : "생각만 하던 걸 실제로 해보게 만드는 사람",
        partnerOriginalState: "",
        giverStateChangeEffect: "",
        description: sanitizeCopy(
          `${a}님이 가진 특유의 추진력은 ${b}님의 내면 구상이 머릿속에만 머물지 않고 실제로 실행되도록 만드는 기분 좋은 동력이 되어줍니다.`
        ),
        semanticDimension: "CATALYST",
        confidence: "HIGH",
      };
    }

    // Option 3: SANCTUARY (안식처)
    return {
      giverName: a,
      receiverName: b,
      roleTitle: isEn ? "The Safe Haven Where Heavy Tension Can Melt Away" : "내 방식대로 있어도 마음이 편한 사람",
      partnerOriginalState: "",
      giverStateChangeEffect: "",
      description: sanitizeCopy(
        `${a}님이 건네는 따뜻한 이해와 포용은 ${b}님이 밖에서의 긴장과 부담을 내려놓고 있는 그대로 숨 쉴 수 있는 편안한 안식처가 되어줍니다.`
      ),
      semanticDimension: "SANCTUARY",
      confidence: "HIGH",
    };
  };

  const resolveMeaningBtoA = (): DirectionalMeaning => {
    const familyB = spousePalaceB.tenGodFamily;

    // Option 1: AUTONOMY GUARD (자율성 수호자)
    if (excludedBtoA !== "AUTONOMY_AND_SANCTUARY" && (familyB.includes("인성") || (axesB.empathy ?? 50) >= 55)) {
      return {
        giverName: b,
        receiverName: a,
        roleTitle: isEn ? "The Respectful Partner Guarding My Personal Space" : "내 영역과 방식을 존중해주는 사람",
        partnerOriginalState: "",
        giverStateChangeEffect: "",
        description: sanitizeCopy(
          `${b}님이 보여주는 강요 없는 존중은 ${a}님이 매번 신경을 곤두세우지 않고도 내 방식대로 편안하게 머무를 수 있는 마음의 여유를 지켜줍니다.`
        ),
        semanticDimension: "AUTONOMY_GUARD",
        confidence: "HIGH",
      };
    }

    // Option 2: GROUNDED STABILITY (평정심의 닻)
    if (excludedBtoA !== "GROUNDED_STABILITY" && (familyB.includes("관성") || (axesB.structure ?? 50) >= 55)) {
      return {
        giverName: b,
        receiverName: a,
        roleTitle: isEn ? "The Steady Grounding Anchor in Fluctuating Times" : "마음이 복잡할 때 중심을 잡아주는 닻",
        partnerOriginalState: "",
        giverStateChangeEffect: "",
        description: sanitizeCopy(
          `${b}님이 유지하는 차분한 평정심은 ${a}님이 일상의 중압감으로 에너지가 과부하될 때 흔들리지 않고 다시 내면의 안정감을 되찾도록 돕습니다.`
        ),
        semanticDimension: "GROUNDED_STABILITY",
        confidence: "HIGH",
      };
    }

    // Option 3: CATALYST (스위치)
    return {
      giverName: b,
      receiverName: a,
      roleTitle: isEn ? "The Catalyst Who Unlocks Hidden Expressions" : "속마음을 편하게 털어놓게 만드는 스위치",
      partnerOriginalState: "",
      giverStateChangeEffect: "",
      description: sanitizeCopy(
        `${b}님 특유의 편안하고 솔직한 분위기는 ${a}님이 혼자 끌어안고 있던 감정과 진심을 자연스럽게 입 밖으로 내어 나누도록 도와줍니다.`
      ),
      semanticDimension: "CATALYST",
      confidence: "HIGH",
    };
  };

  const meaningAtoB = resolveMeaningAtoB();
  const meaningBtoA = resolveMeaningBtoA();

  // --------------------------------------------------------------------------
  // 4. MUTUAL TRANSFORMATION ( 이 사람과 함께하며 나는 어떻게 달라질까 )
  //    Behavior-bound trait baselines in Plain Korean
  // --------------------------------------------------------------------------
  const beforeA = (axesA.structure ?? 50) >= 60
    ? `${aEunNeun} 내가 다 챙기고 결정하느라 마음의 긴장을 잘 놓지 못하던 성향`
    : `${aEunNeun} 혼자서 문제를 해결하려 애쓰며 남에게 잘 기대지 않던 성향`;

  const influenceA = `${b}님이 보여주는 다정하고 여유 있게 받아주는 태도를 접하면서`;

  const emergingA = `혼자서 다 짊어지지 않아도 괜찮다는 안도감 속에, 필요할 때 기꺼이 상대에게 편하게 기대는 여유를 갖게 돼요.`;

  const primaryTransA = sanitizeCopy(`${beforeA}에서, ${influenceA} ${emergingA}`);

  const shadowA = (axesA.structure ?? 50) >= 65
    ? `${b}님의 유연함에 익숙해진 나머지, 중요한 의사결정에서 지시적인 톤이 되지 않도록 주의할 필요가 있어요.`
    : undefined;

  const beforeB = (axesB.practicality ?? 50) <= 50
    ? `${bEunNeun} 고민이 깊어 선뜻 결정하지 못하고 신중하게 살펴보기만 하던 성향`
    : `${bEunNeun} 자신의 서운함이나 욕구를 적극적으로 표현하지 않고 속으로 참던 성향`;

  const influenceB = `${a}님이 보여주는 확실한 방향 잡기와 빠른 실행 리듬을 곁에서 배우면서`;

  const emergingB = `고민만 하다가 시간을 보내지 않고, 생각한 바를 빠르게 행동으로 옮기는 추진력을 얻게 돼요.`;

  const primaryTransB = sanitizeCopy(`${beforeB}에서, ${influenceB} ${emergingB}`);

  const shadowB = (axesB.empathy ?? 50) >= 65
    ? `상대에게 맞춰주느라 서운함을 속으로 참지 말고, 원하는 바를 솔직하게 말하는 연습이 도움이 돼요.`
    : undefined;

  const transformationA: DirectionalTransformation = {
    targetName: a,
    partnerName: b,
    beforeState: beforeA,
    partnerInfluence: influenceA,
    emergingSelf: emergingA,
    primaryTransformation: primaryTransA,
    shadowTransformation: shadowA,
    confidence: "HIGH",
  };

  const transformationB: DirectionalTransformation = {
    targetName: b,
    partnerName: a,
    beforeState: beforeB,
    partnerInfluence: influenceB,
    emergingSelf: emergingB,
    primaryTransformation: primaryTransB,
    shadowTransformation: shadowB,
    confidence: "HIGH",
  };

  // --------------------------------------------------------------------------
  // 5. COUPLE IDENTITY SYNTHESIS ( 그래서 우리는 어떤 부부일까 )
  // --------------------------------------------------------------------------
  const dimA = chainAtoB.semanticDimension;
  const dimB = chainBtoA.semanticDimension;
  const primaryCat = finalDrivers[0]?.category ?? "comfortable_familiar";

  let identityTitle = "";

  if (dimA === "AUTONOMY_AND_SANCTUARY" && dimB === "DECISION_AND_STRUCTURE") {
    identityTitle = `한 사람은 길을 열고, 한 사람은 마음 놓을 자리를 만드는 부부`;
  } else if (dimA === "AUTONOMY_AND_SANCTUARY" && dimB === "AUTONOMY_AND_SANCTUARY") {
    identityTitle = `나란한 눈높이에서 서로의 독립된 자율성을 온전히 지켜주는 부부`;
  } else if (primaryCat === "tense_curious" || sig.hasDayBranchClash) {
    identityTitle = `서로의 다른 템포가 불꽃이 되어 일상을 깨우는 부부`;
  } else if (primaryCat === "peer_camaraderie" || chartA.dayStemCode === chartB.dayStemCode) {
    identityTitle = `대등한 동료로서 세상을 함께 개척해 나가는 부부`;
  } else if (dimA === "PRACTICAL_PARTNERSHIP" || dimB === "PRACTICAL_PARTNERSHIP") {
    identityTitle = `생각을 현실의 선택으로 옮기고 일상의 터전을 함께 다지는 부부`;
  } else {
    identityTitle = `닮은 눈높이로 편안하고, 서로 다른 장점으로 앞으로 나아가는 부부`;
  }

  const identityNarrative = sanitizeCopy(
    `${meaningAtoB.description} ${meaningBtoA.description}`
  );

  const coupleIdentity: CoupleIdentitySynthesis = {
    title: identityTitle,
    synthesisNarrative: identityNarrative,
    confidence: "HIGH",
  };

  // --------------------------------------------------------------------------
  // 6. HERO SYNTHESIS ( DERIVED LAST )
  // --------------------------------------------------------------------------
  const heroSynthesis = identityNarrative;

  const provenance: Chapter01Provenance = {
    sourceInsightIds,
    semanticDimensions: {
      needAtoB: chainAtoB.semanticDimension,
      needBtoA: chainBtoA.semanticDimension,
      meaningAtoB: meaningAtoB.semanticDimension,
      meaningBtoA: meaningBtoA.semanticDimension,
      coupleIdentity: dimA + "_" + dimB,
    },
    confidence: "HIGH",
    fallbackUsed: false,
  };

  return {
    heroSynthesis,
    provenance,
    attraction: {
      drivers: finalDrivers,
      pairSynthesis: pairAttractionSynthesis,
      confidence: "HIGH",
    },
    mutualNeed: {
      needAtoB,
      needBtoA,
      confidence: "HIGH",
    },
    directionalMeaning: {
      meaningAtoB,
      meaningBtoA,
      confidence: "HIGH",
    },
    mutualTransformation: {
      transformationA,
      transformationB,
      confidence: "HIGH",
    },
    coupleIdentity,
  };
}
