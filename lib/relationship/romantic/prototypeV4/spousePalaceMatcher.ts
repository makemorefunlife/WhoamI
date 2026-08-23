/**
 * Position-Sensitive Spouse Palace & Bilateral Partner Match Resolver.
 * Strictly distinguishes Day Branch (Spouse Palace) from other pillars and
 * computes bilateral cross-matching of partner expectations against real natal evidence.
 *
 * Guarantees zero Saju jargon in user-facing narrative text while preserving full provenance.
 */
import type { IndividualSajuChart } from "../../../personCore/individualSaju/types";
import {
  type TenGodCode,
  type TenGodRomanticProfile,
  getTenGodRomanticProfile,
} from "../tenGodRomanticProfiles";
import { topicP, subjectP, withP, sanitizeParticles, pick, type NarrativeLocale } from "./narrativeLocale";

/**
 * Semantic-leak fix: resolveBilateralPartnerPreferenceMatchFromCe's main
 * switch is keyed ONLY on the seeker's spouse-palace Ten God (10 possible
 * values) — confirmed via the 5-couple proof to produce byte-identical
 * attraction paragraphs for different real pairs sharing a Ten God. The
 * existing element-flow section below only covers a handful of specific
 * seeker/partner stem-element combinations, leaving gaps. This small,
 * bounded (5 entries — every real dominantElement value) flavor map is the
 * guaranteed fallback: combined with the partner's own real
 * familiarRelationshipRole/careExpression text in
 * synthesizePartnerSpecificReason below, it ensures every pair gets at
 * least one genuinely partner-specific sentence in the attraction
 * paragraph, regardless of which Ten God bucket the seeker falls into.
 */
const PARTNER_ELEMENT_FLAVOR_KO: Record<string, string> = {
  wood: "생기 있고 앞으로 나아가려는",
  fire: "표현이 확실하고 열정적인",
  earth: "묵직하고 믿음이 가는",
  metal: "원칙 있고 정돈된",
  water: "유연하고 사려 깊은",
};
const PARTNER_ELEMENT_FLAVOR_EN: Record<string, string> = {
  wood: "lively and forward-moving",
  fire: "expressive and passionate",
  earth: "grounded and dependable",
  metal: "principled and composed",
  water: "flexible and thoughtful",
};

function synthesizePartnerSpecificReason(params: {
  partnerName: string;
  partnerDominantElement: string;
  /** A full predicate sentence, e.g. careExpression.text ("행동과 배려로
   * 마음을 전합니다") — safe to continue mid-sentence after "실제로". */
  partnerTraitPredicate?: string;
  /** A bare noun-phrase identity label, e.g. familiarRelationshipRole.text
   * ("어떤 풍파에도 흔들리지 않는 든든한 대지이자 쉼터") — needs its own
   * copula ending, not a mid-sentence continuation. */
  partnerTraitLabel?: string;
  locale: NarrativeLocale;
}): { text: string; evidenceId: string; source: string; sourcePath: string; confidence: "high" } | null {
  const { partnerName, partnerDominantElement, partnerTraitPredicate, partnerTraitLabel, locale } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const flavor = locale === "en-US" ? PARTNER_ELEMENT_FLAVOR_EN[partnerDominantElement] : PARTNER_ELEMENT_FLAVOR_KO[partnerDominantElement];
  if (!flavor) return null;

  const text = partnerTraitPredicate
    ? L(
        `구체적으로는, ${flavor} ${partnerName}이/가 실제로 ${partnerTraitPredicate}`,
        `Specifically, ${partnerName} — ${flavor} — actually ${partnerTraitPredicate.charAt(0).toLowerCase()}${partnerTraitPredicate.slice(1)}`,
      )
    : partnerTraitLabel
      ? L(
          `구체적으로는, ${flavor} ${partnerName}은/는 실제로 ${partnerTraitLabel}에 가까운 사람이에요.`,
          `Specifically, ${partnerName} — ${flavor} — is, in practice, closer to being ${partnerTraitLabel}.`,
        )
      : L(
          `구체적으로는, ${flavor} ${partnerName}의 결이 여기서 특히 잘 느껴집니다.`,
          `Specifically, ${partnerName}'s ${flavor} nature comes through especially clearly here.`,
        );

  return {
    text,
    evidenceId: `chart.partner.five_elements.dominant.${partnerDominantElement}`,
    source: "personal_saju_chart",
    sourcePath: `five_elements.dominant.${partnerDominantElement}`,
    confidence: "high",
  };
}
import type {
  AttractionNarrativeUnit,
  CanonicalMeaningEvidence,
  CanonicalDomainLensInterpretation,
} from "./canonicalStoryPlanTypes";

export type EvidenceReference = {
  evidenceId: string;
  source: string;
  sourcePath: string;
  confidence: "deterministic" | "high" | "medium" | "low";
};

export type SpousePalaceProfile = {
  personId: "a" | "b";
  personName: string;
  dayBranchCode: string;
  dayBranchElement: string;
  tenGodCode: TenGodCode;
  tenGodName: string;
  tenGodFamily: string;
  profile: TenGodRomanticProfile;
  partnerExpectation: string;
  intimateNeed: string;
  distortionWhenStressed: string;
  provenance: EvidenceReference;
};

export type PartnerPreferenceMatch = {
  seekerId: "a" | "b";
  partnerId: "a" | "b";
  seekerName: string;
  partnerName: string;
  seekerSpousePalace: SpousePalaceProfile;
  preferenceSource: EvidenceReference[];
  preferenceMeaning: {
    text: string;
    evidenceId: string;
    source: string;
    sourcePath: string;
    confidence: "deterministic" | "high" | "medium";
  };
  matchedPartnerEvidence: EvidenceReference[];
  matchStrength: "strong" | "partial" | "weak" | "unavailable";
  supportingReasons: Array<{
    text: string;
    evidenceId: string;
    source: string;
    sourcePath: string;
    confidence: "deterministic" | "high" | "medium";
  }>;
  cautionReasons: Array<{
    text: string;
    evidenceId: string;
    source: string;
    sourcePath: string;
    confidence: "deterministic" | "high" | "medium";
  }>;
  allowedInference: string[];
  forbiddenInference: string[];
  confidence: "deterministic" | "high" | "medium";
  narrativeUnit: AttractionNarrativeUnit;
  synthesisNarrative: string;
  canonicalEvidences?: CanonicalMeaningEvidence[];
  lensInterpretations?: CanonicalDomainLensInterpretation[];
};

/**
 * Resolve Spouse Palace Profile strictly from Day Pillar branch.
 * Validates that other pillars (Year, Month, Hour) do NOT overwrite the spouse palace.
 */
export function resolveSpousePalaceProfile(
  chart: IndividualSajuChart,
  personId: "a" | "b",
  personName: string,
  locale: NarrativeLocale = "ko-KR",
): SpousePalaceProfile {
  const dayPillar = chart.pillars.find((p) => p.slot === "day");
  if (!dayPillar) {
    throw new Error(`Chart for ${personName} (${personId}) lacks a day pillar.`);
  }

  const rawTenGodCode = dayPillar.branch_ten_god?.code ?? "bigyeon";
  const profile = getTenGodRomanticProfile(rawTenGodCode, locale);
  const dayBranchCode = dayPillar.branch.code;
  const dayBranchElement = dayPillar.branch.element;

  return {
    personId,
    personName,
    dayBranchCode,
    dayBranchElement,
    tenGodCode: profile.code,
    tenGodName: profile.korName,
    tenGodFamily: profile.familyKorName,
    profile,
    partnerExpectation: profile.partnerExpectation,
    intimateNeed: profile.intimateNeed,
    distortionWhenStressed: profile.excessRisk,
    provenance: {
      evidenceId: `chart.${personId}.pillars.day.branch_ten_god`,
      source: "personal_saju_chart",
      sourcePath: `pillars.day.branch_ten_god.${profile.code}`,
      confidence: "deterministic",
    },
  };
}

export function resolveBilateralPartnerPreferenceMatchFromCe(params: {
  seekerCe: {
    personId: string;
    name: string;
    dayMaster: { stemCode: string; stemElement: string; dayBranchCode: string };
    fiveElementStructure: { dominantElement: string };
    spousePalaceProfile?: SpousePalaceProfile;
  };
  partnerCe: {
    personId: string;
    name: string;
    dayMaster: { stemCode: string; stemElement: string; dayBranchCode: string };
    fiveElementStructure: { dominantElement: string };
    spousePalaceProfile?: SpousePalaceProfile;
    /** Optional — when the caller has the full PersonalRelationshipCe (it
     * always does; buildCanonicalRelationshipStoryPlan.ts passes relCeA/
     * relCeB directly), these carry real partner-specific evidence used to
     * keep the attraction paragraph from being controlled entirely by the
     * seeker's Ten-God code (see synthesizePartnerSpecificReason below). */
    familiarRelationshipRole?: { text: string };
    careExpression?: { text: string };
  };
  seekerId: "a" | "b";
  partnerId: "a" | "b";
  seekerName: string;
  partnerName: string;
  locale?: NarrativeLocale;
}): PartnerPreferenceMatch {
  const { seekerCe, partnerCe, seekerId, partnerId, seekerName, partnerName } = params;
  const locale: NarrativeLocale = params.locale ?? "ko-KR";
  const isEn = locale === "en-US";
  const L = (ko: string, en: string) => pick(locale, ko, en);

  const seekerSpousePalace: SpousePalaceProfile =
    seekerCe.spousePalaceProfile ?? {
      personId: seekerId,
      personName: seekerName,
      dayBranchCode: seekerCe.dayMaster.dayBranchCode,
      dayBranchElement: "metal",
      tenGodCode: "bigyeon",
      tenGodName: "비견",
      tenGodFamily: "비겁 (주체·자율)",
      profile: getTenGodRomanticProfile("bigyeon", locale),
      partnerExpectation: L(
        "자신의 독립적인 영역을 온전히 존중해주면서도 대등한 눈높이에서 나란히 걸어갈 수 있는 자립적이고 든든한 파트너",
        "An independent, dependable partner who fully respects their independent space while still walking alongside them at eye level",
      ),
      intimateNeed: L(
        "구속 없는 자율성, 대등한 동반자적 존중, 건강한 개인 공간의 보장",
        "Freedom without constraint, respect as an equal companion, and healthy personal space guaranteed",
      ),
      distortionWhenStressed: L(
        "자존심을 굽히지 않고 팽팽하게 맞서며 작은 타협조차 양보나 굴복으로 여길 수 있음",
        "May hold firm without backing down on their pride, treating even small compromises as giving in or surrendering",
      ),
      provenance: {
        evidenceId: `chart.${seekerId}.pillars.day.branch_ten_god`,
        source: "personal_saju_chart",
        sourcePath: `pillars.day.branch_ten_god.bigyeon`,
        confidence: "deterministic",
      },
    };

  const partnerStem = partnerCe.dayMaster.stemCode;
  const partnerStemEl = partnerCe.dayMaster.stemElement;
  const partnerDominantElement = partnerCe.fiveElementStructure.dominantElement;
  const seekerStemEl = seekerCe.dayMaster.stemElement;
  const seekerDayBranch = seekerCe.dayMaster.dayBranchCode;
  const partnerDayBranch = partnerCe.dayMaster.dayBranchCode;

  const preferenceSource: EvidenceReference[] = [seekerSpousePalace.provenance];
  const matchedPartnerEvidence: EvidenceReference[] = [
    {
      evidenceId: `chart.${partnerId}.day_master`,
      source: "personal_saju_chart",
      sourcePath: `day_master.stem.${partnerStem}`,
      confidence: "deterministic",
    },
    {
      evidenceId: `chart.${partnerId}.five_elements.dominant`,
      source: "personal_saju_chart",
      sourcePath: `five_elements.dominant.${partnerDominantElement}`,
      confidence: "high",
    },
  ];

  const supportingReasons: PartnerPreferenceMatch["supportingReasons"] = [];
  const cautionReasons: PartnerPreferenceMatch["cautionReasons"] = [];
  let matchStrength: PartnerPreferenceMatch["matchStrength"] = "partial";

  const seekerTg = seekerSpousePalace.tenGodCode;

  let recognition = "";
  let emotionalMeaning = "";
  let scene = "";
  let pairSpecificEffect = "";
  let tensionBridge = "";

  // 1. Evaluate Ten God Match with rich, everyday relational meaning and scenes
  switch (seekerTg) {
    case "bigyeon": {
      recognition = L(
        `${topicP(seekerName, locale)} ${partnerName}의 흔들림 없는 중심과 담백한 태도에 자연스럽게 마음이 움직입니다.`,
        `${topicP(seekerName, locale)} naturally moves toward ${partnerName}'s unshaken center and straightforward manner.`,
      );
      emotionalMeaning = L(
        `일방적으로 의존하거나 상대에게 휘둘리지 않고, 서로의 고유한 영역을 온전히 존중하며 대등하게 걸어갈 수 있는 동반자를 바라기 때문입니다.`,
        `That's because they want a companion who neither depends one-sidedly nor gets swept up by the other — someone to walk beside as an equal, with each other's own territory fully respected.`,
      );
      scene = L(
        `서로 각자의 일과 목표에 몰입하다가도, 하루 끝에 마주 앉아 대등한 눈높이에서 서로의 선택을 담담하게 응원하는 순간`,
        `The moment when, even after being absorbed in your own work and goals all day, you sit down together at day's end and calmly cheer each other's choices on as equals`,
      );
      pairSpecificEffect = L(
        `서로에게 짐이 되지 않는 건강한 거리감과 자립적인 파트너십을 형성합니다.`,
        `Forms a healthy distance and an independent partnership where neither becomes a burden to the other.`,
      );
      tensionBridge = L(
        `두 사람 모두 자기만의 기준이 확고할 때, 사소한 의견 차이에서도 양보를 굴복으로 여겨 팽팽한 대치가 길어질 수 있습니다.`,
        `When you're both firmly set in your own standards, even a small disagreement can turn into a long standoff, since giving in can feel like surrender to either of you.`,
      );

      if (partnerStemEl === "earth" || partnerStemEl === "metal" || partnerDominantElement === "earth" || partnerDominantElement === "metal") {
        matchStrength = "strong";
        supportingReasons.push({
          text: L(
            `${partnerName}의 흔들림 없는 묵묵함과 자립적인 태도가 ${subjectP(seekerName, locale)} 바라는 대등하고 건강한 동반자 관계를 충족시킵니다.`,
            `${partnerName}'s unshaken steadiness and independent manner meets exactly the equal, healthy partnership ${seekerName} is looking for.`,
          ),
          evidenceId: `chart.${partnerId}.day_master.autonomy_fit`,
          source: "personal_saju_chart",
          sourcePath: `day_master.stem.${partnerStem}`,
          confidence: "high",
        });
      } else {
        supportingReasons.push({
          text: L(
            `${partnerName}의 배려 깊은 다정함이 ${seekerName}의 독립적인 영역을 침범하지 않고 편안한 거리를 지켜줍니다.`,
            `${partnerName}'s thoughtful warmth keeps a comfortable distance without ever crossing into ${seekerName}'s independent territory.`,
          ),
          evidenceId: `chart.${partnerId}.day_master.space_fit`,
          source: "personal_saju_chart",
          sourcePath: `day_master.stem.${partnerStem}`,
          confidence: "medium",
        });
      }
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.autonomy_friction`,
        source: "romantic_ce",
        sourcePath: "friction.stubbornness",
        confidence: "medium",
      });
      break;
    }

    case "geopjae": {
      recognition = L(
        `${topicP(seekerName, locale)} ${partnerName}의 확고한 존재감과 흔들림 없는 태도에서 강한 이끌림을 경험합니다.`,
        `${topicP(seekerName, locale)} feels a strong pull toward ${partnerName}'s solid presence and unshaken manner.`,
      );
      emotionalMeaning = L(
        `어떤 상황에서도 나만을 최우선으로 지지해 주는 세상에서 가장 확실한 '내 편'이라는 확신을 갈망하기 때문입니다.`,
        `They crave the certainty of having the one person in the world who'll back them first no matter what — their unmistakable 'ally.'`,
      );
      scene = L(
        `주변의 복잡한 시선이나 세상의 평가 속에서도, 흔들림 없이 내 선택을 믿어주고 전폭적으로 힘을 실어주는 순간`,
        `The moment when, even amid the complicated opinions and judgments of the outside world, someone believes in your choice without wavering and throws their full support behind you`,
      );
      pairSpecificEffect = L(
        `외부의 어떤 어려움 앞에서도 둘만의 깊고 단단한 결속력을 발휘합니다.`,
        `Shows a deep, firm bond between the two of you no matter what hardship comes from outside.`,
      );
      tensionBridge = L(
        `열정이 깊어질수록 상대의 사소한 시선 분산이나 반응 지연에 서운함이 커져 독점적 불안으로 이어질 수 있습니다.`,
        `The deeper the passion runs, the more a small distraction in the other's attention or a slow response can sting, growing into possessive anxiety.`,
      );

      matchStrength = "strong";
      supportingReasons.push({
        text: L(
          `${partnerName}의 일관된 신뢰와 확고한 태도가 ${seekerName}에게 세상 누구보다 든든한 '내 편'이라는 깊은 안도감을 선사합니다.`,
          `${partnerName}'s consistent trust and firm manner gives ${seekerName} a deep sense of reassurance — being someone's ally more than anyone else in the world.`,
        ),
        evidenceId: `chart.${partnerId}.day_master.loyalty_fit`,
        source: "personal_saju_chart",
        sourcePath: `day_master.stem.${partnerStem}`,
        confidence: "high",
      });
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.loyalty_caution`,
        source: "romantic_ce",
        sourcePath: "friction.possessiveness",
        confidence: "medium",
      });
      break;
    }

    case "jeongjae": {
      recognition = L(
        `${topicP(seekerName, locale)} ${partnerName}의 성실한 행동과 약속을 지키는 한결같은 태도에 깊은 신뢰를 느낍니다.`,
        `${topicP(seekerName, locale)} feels deep trust in ${partnerName}'s diligent behavior and their consistency in keeping promises.`,
      );
      emotionalMeaning = L(
        `말뿐인 다정함보다 일상의 현실을 정직하게 채워주는 예측 가능한 안정감에서 삶의 평온을 얻기 때문입니다.`,
        `They find life's real calm not in sweet talk, but in the predictable stability of someone honestly filling in the reality of everyday life.`,
      );
      scene = L(
        `함께 중요한 일정을 조율할 때, 서로의 시간을 존중하며 사소한 디테일까지 성실하게 챙겨주는 모습을 마주할 때`,
        `When coordinating an important plan together, seeing them respect each other's time and diligently look after even the small details`,
      );
      pairSpecificEffect = L(
        `일상의 모든 순간이 안정되고 투명하게 관리되는 단단한 생활 기반을 만듭니다.`,
        `Builds a solid foundation for daily life where every moment is managed with stability and transparency.`,
      );
      tensionBridge = L(
        `예상치 못한 일정 변동이나 상황의 변화 앞에서 규칙을 지나치게 고수하면, 상대에게 답답한 통제감으로 느껴질 수 있습니다.`,
        `Sticking too rigidly to the rules when plans unexpectedly change can feel to the other like frustrating control.`,
      );

      if (partnerStem === "gyeong" || partnerStem === "sin" || partnerDominantElement === "metal" || partnerDominantElement === "earth") {
        matchStrength = "strong";
        supportingReasons.push({
          text: L(
            `${subjectP(partnerName, locale)} 보여주는 분명한 원칙과 투명한 실행력이 ${subjectP(seekerName, locale)} 가장 필요로 하는 구체적인 일상의 안정감을 채워줍니다.`,
            `${subjectP(partnerName, locale)} shows a clear principle and transparent follow-through that fills exactly the concrete, everyday stability ${seekerName} needs most.`,
          ),
          evidenceId: `chart.${partnerId}.day_master.predictability_fit`,
          source: "personal_saju_chart",
          sourcePath: `day_master.stem.${partnerStem}`,
          confidence: "high",
        });
      } else {
        supportingReasons.push({
          text: L(
            `${partnerName}의 성실한 노력이 ${seekerName}에게 현실적인 신뢰의 토대가 되어줍니다.`,
            `${partnerName}'s diligent effort becomes a real, practical foundation of trust for ${seekerName}.`,
          ),
          evidenceId: `chart.${partnerId}.day_master.reality_fit`,
          source: "personal_saju_chart",
          sourcePath: `day_master.stem.${partnerStem}`,
          confidence: "medium",
        });
      }
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.predictability_friction`,
        source: "romantic_ce",
        sourcePath: "friction.sudden_change",
        confidence: "medium",
      });
      break;
    }

    case "pyeonjae": {
      recognition = L(
        `${topicP(seekerName, locale)} ${partnerName}의 넓은 시야와 유쾌한 활력, 주저 없이 세상을 대하는 에너지에 매료됩니다.`,
        `${topicP(seekerName, locale)} is drawn in by ${partnerName}'s broad view, cheerful energy, and the way they meet the world without hesitation.`,
      );
      emotionalMeaning = L(
        `단조로운 일상에 갇히지 않고 함께 다채로운 세상을 경험하며 넓은 공간을 공유하는 자유로움을 바라기 때문입니다.`,
        `They want a freedom that isn't boxed into monotonous routine — experiencing a varied world together and sharing wide-open space.`,
      );
      scene = L(
        `주말에 계획에 없던 새로운 장소나 경험을 함께 제안받고, 설레는 마음으로 일상의 경계를 넓혀가는 순간`,
        `The moment your partner suggests a new, unplanned place or experience for the weekend, and together you excitedly push the boundaries of everyday life`,
      );
      pairSpecificEffect = L(
        `관계가 늘 생동감 넘치고 지루함 없이 함께 새로운 세상을 탐색해 나갑니다.`,
        `Keeps the relationship always feeling alive, exploring a new world together without ever getting boring.`,
      );
      tensionBridge = L(
        `새로운 경험을 추구하는 속도가 다를 때, 한 사람의 경쾌함이 다른 사람에게는 산만함이나 피로감으로 느껴질 수 있습니다.`,
        `When your pace for seeking new experiences differs, one person's lightness can feel like distraction or exhaustion to the other.`,
      );

      matchStrength = "strong";
      supportingReasons.push({
        text: L(
          `${partnerName}의 추진력과 생동감이 ${seekerName}의 일상에 활력을 불어넣고 함께 즐거운 경험을 확장해 나갈 수 있게 돕습니다.`,
          `${partnerName}'s drive and vitality bring energy to ${seekerName}'s daily life and help you both keep expanding your shared, joyful experiences.`,
        ),
        evidenceId: `chart.${partnerId}.day_master.adventure_fit`,
        source: "personal_saju_chart",
        sourcePath: `day_master.stem.${partnerStem}`,
        confidence: "high",
      });
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.adventure_friction`,
        source: "romantic_ce",
        sourcePath: "friction.pacing_gap",
        confidence: "medium",
      });
      break;
    }

    case "jeonggwan": {
      recognition = L(
        `${topicP(seekerName, locale)} ${partnerName}의 정직하고 반듯한 태도, 매사에 중심을 지키는 품격에 마음을 엽니다.`,
        `${topicP(seekerName, locale)} opens up to ${partnerName}'s honest, upright manner and the dignity of staying centered in every matter.`,
      );
      emotionalMeaning = L(
        `서로에게 부끄럽지 않은 신의를 지키며, 어디서나 서로를 존중해 주는 품격 있는 관계의 도리를 소중히 여기기 때문입니다.`,
        `They value keeping a loyalty you'd never be ashamed of, and treasure the dignified duty of a relationship where you respect each other anywhere.`,
      );
      scene = L(
        `다른 사람들과 함께하는 자리에서도 서로를 깎아내리지 않고 든든하게 예의와 품격을 지켜주는 모습을 볼 때`,
        `Seeing your partner never put you down even in front of others, steadily upholding courtesy and dignity`,
      );
      pairSpecificEffect = L(
        `주변의 신뢰를 받는 견고하고 떳떳한 관계의 틀을 세워냅니다.`,
        `Builds a solid, proud relationship framework that earns trust from the people around you.`,
      );
      tensionBridge = L(
        `도리와 원칙을 지나치게 엄격하게 앞세우면, 솔직한 감정의 굴곡을 털어놓지 못하고 관계가 경직될 수 있습니다.`,
        `Putting duty and principle too strictly first can leave no room for honest emotional ups and downs, and the relationship can stiffen.`,
      );

      matchStrength = "strong";
      supportingReasons.push({
        text: L(
          `${partnerName}의 단정하고 책임감 있는 태도가 ${seekerName}에게 높은 품격과 확신을 갖춘 신뢰를 선사합니다.`,
          `${partnerName}'s neat, responsible manner gives ${seekerName} a trust that carries real dignity and certainty.`,
        ),
        evidenceId: `chart.${partnerId}.day_master.decorum_fit`,
        source: "personal_saju_chart",
        sourcePath: `day_master.stem.${partnerStem}`,
        confidence: "high",
      });
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.decorum_friction`,
        source: "romantic_ce",
        sourcePath: "friction.rigidity",
        confidence: "medium",
      });
      break;
    }

    case "pyeongwan": {
      recognition = L(
        `${topicP(seekerName, locale)} ${partnerName}의 결단력과 묵직한 무게감, 위기 앞에서도 물러서지 않는 태도에 깊은 안도감을 느낍니다.`,
        `${topicP(seekerName, locale)} feels deep reassurance in ${partnerName}'s decisiveness, weighty presence, and the way they don't back down even in a crisis.`,
      );
      emotionalMeaning = L(
        `힘든 현실에 혼자 맞서지 않아도 된다는 확신, 나를 지켜주고 함께 무게를 짊어져 줄 든든한 방패를 찾기 때문입니다.`,
        `They're looking for the certainty of not having to face a hard reality alone — a dependable shield who'll protect them and share the weight.`,
      );
      scene = L(
        `예상치 못한 곤란이나 위기가 닥쳤을 때, 피하지 않고 앞장서서 상황을 정돈하며 든든하게 어깨를 내어주는 순간`,
        `The moment an unexpected trouble or crisis hits, and they step up without flinching to sort out the situation and offer a dependable shoulder`,
      );
      pairSpecificEffect = L(
        `어떤 시련이 와도 둘이 함께라면 이겨낼 수 있다는 강력한 보호막을 형성합니다.`,
        `Forms a powerful shield of certainty that whatever hardship comes, the two of you can get through it together.`,
      );
      tensionBridge = L(
        `위기를 해결하려는 강한 책임감이 때로는 상대에게 무언의 압박이나 통제로 전해질 수 있습니다.`,
        `Their strong sense of responsibility for resolving a crisis can sometimes come across to the other as unspoken pressure or control.`,
      );

      matchStrength = "strong";
      supportingReasons.push({
        text: L(
          `${partnerName}의 든든한 결단력과 무게감이 ${subjectP(seekerName, locale)} 어떤 어려움 속에서도 안심하고 의지할 수 있는 방패가 되어줍니다.`,
          `${partnerName}'s dependable decisiveness and weight become a shield ${seekerName} can lean on with reassurance through any hardship.`,
        ),
        evidenceId: `chart.${partnerId}.day_master.protection_fit`,
        source: "personal_saju_chart",
        sourcePath: `day_master.stem.${partnerStem}`,
        confidence: "high",
      });
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.protection_friction`,
        source: "romantic_ce",
        sourcePath: "friction.pressure",
        confidence: "medium",
      });
      break;
    }

    case "jeongin": {
      recognition = L(
        `${topicP(seekerName, locale)} ${partnerName}의 다정한 시선과 모든 것을 편안하게 품어주는 온기에 마음이 무장해제됩니다.`,
        `${topicP(seekerName, locale)} finds their guard melting under ${partnerName}'s warm gaze and the ease with which they embrace everything.`,
      );
      emotionalMeaning = L(
        `약한 모습까지 그냥 받아주는 사람이라, 같이 있으면 마음이 제일 편해지기 때문이에요.`,
        `Because this is someone who accepts even their weaker moments as they are — being together is where they feel most at ease.`,
      );
      scene = L(
        `밖에서 지치고 혼란스러운 하루를 보내고 돌아왔을 때, 잘잘못을 묻지 않고 조용히 곁을 지켜주며 따뜻한 온기를 건네받는 순간`,
        `The moment they come home exhausted and rattled from a hard day, and without asking who's right or wrong, their partner quietly stays close and offers warmth`,
      );
      pairSpecificEffect = L(
        `마음의 모든 상처를 아물게 하는 깊은 정서적 치유와 쉼터를 공유합니다.`,
        `Shares a deep emotional healing and refuge that mends every wound of the heart.`,
      );
      tensionBridge = L(
        `상대의 무조건적인 수용에 지나치게 기대어 서운함을 속으로만 삭이다가 뒤늦게 토로할 위험이 있습니다.`,
        `There's a risk of leaning too heavily on the other's unconditional acceptance, swallowing hurt in silence until it finally comes out late.`,
      );

      matchStrength = "strong";
      supportingReasons.push({
        text: L(
          `${partnerName}의 따뜻한 시선과 포용력이 ${seekerName}의 지친 마음을 온전히 누그러뜨려 주는 편안한 안식처가 됩니다.`,
          `${partnerName}'s warm gaze and capacity to embrace becomes a comfortable refuge that fully soothes ${seekerName}'s tired heart.`,
        ),
        evidenceId: `chart.${partnerId}.day_master.acceptance_fit`,
        source: "personal_saju_chart",
        sourcePath: `day_master.stem.${partnerStem}`,
        confidence: "high",
      });
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.acceptance_friction`,
        source: "romantic_ce",
        sourcePath: "friction.passive_expectation",
        confidence: "medium",
      });
      break;
    }

    case "pyeonin": {
      recognition = L(
        `${topicP(seekerName, locale)} ${partnerName}의 깊은 통찰력과 침착함, 말없이도 상황을 헤아려 주는 섬세함에 자연스럽게 눈길이 머뭅니다.`,
        `${topicP(seekerName, locale)} naturally finds their attention drawn to ${partnerName}'s deep insight, composure, and the delicate way they read a situation without needing to be told.`,
      );
      emotionalMeaning = L(
        `자신의 복잡한 내면과 고독을 섣불리 재단하지 않고 묵묵히 품어주는 통찰력 있고 너그러운 여백을 바라기 때문입니다.`,
        `They want an insightful, generous space that doesn't hastily judge their complicated inner world and solitude, and instead quietly holds it.`,
      );
      scene = L(
        `수많은 생각과 감정이 뒤엉켜 말문이 막혔을 때, 다그치지 않고 차분한 눈빛으로 생각을 정리할 여백을 건네받는 순간`,
        `The moment when a tangle of thoughts and feelings leaves them at a loss for words, and instead of pushing, their partner offers a calm gaze and room to sort it out`,
      );
      pairSpecificEffect = L(
        `말하지 않아도 서로의 깊은 고독과 생각을 알아채는 특별한 정서적 교감을 이룹니다.`,
        `Builds a special emotional connection where you sense each other's deep solitude and thoughts without needing to say a word.`,
      );
      tensionBridge = L(
        `생각이 많아질 때 각자의 내면으로 숨어버리면 대화가 단절되어 서로의 의중을 오해하기 쉽습니다.`,
        `When your thoughts pile up and you both retreat into your own inner world, the conversation cuts off and it's easy to misread each other's intent.`,
      );

      matchStrength = "strong";
      supportingReasons.push({
        text: L(
          `${partnerName}의 사려 깊은 통찰과 경청이 ${seekerName}의 복잡한 내면을 말없이도 헤아려 주는 특별한 정서적 교감을 만듭니다.`,
          `${partnerName}'s thoughtful insight and listening create a special emotional connection that reads ${seekerName}'s complicated inner world without a word needing to be said.`,
        ),
        evidenceId: `chart.${partnerId}.day_master.insight_fit`,
        source: "personal_saju_chart",
        sourcePath: `day_master.stem.${partnerStem}`,
        confidence: "high",
      });
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.insight_friction`,
        source: "romantic_ce",
        sourcePath: "friction.withdrawal",
        confidence: "medium",
      });
      break;
    }

    case "siksin": {
      recognition = L(
        `${topicP(seekerName, locale)} ${withP(partnerName, locale)} 함께 있을 때 느껴지는 자연스럽고 부담 없는 편안함에 안도감을 느낍니다.`,
        `${topicP(seekerName, locale)} feels reassured by the natural, unpressured ease of being with ${partnerName}.`,
      );
      emotionalMeaning = L(
        `어떤 평가나 조급한 요구 없이 나만의 속도를 너그럽게 지켜봐 주는 다정한 여유를 갈망하기 때문입니다.`,
        `They long for a warm, generous ease that watches over their own pace without judgment or impatient demands.`,
      );
      scene = L(
        `일과를 마치고 복잡한 생각에 지쳤을 때, 거창한 해결책 대신 편안한 웃음과 따뜻한 여유를 함께 나눌 때`,
        `When, worn out by tangled thoughts after a long day, you share a comfortable laugh and warm ease together instead of any grand solution`,
      );
      pairSpecificEffect = L(
        `일상의 긴장을 자연스럽게 녹여내는 포근한 일상성을 선물합니다.`,
        `Gives the gift of a cozy everyday-ness that naturally melts away the day's tension.`,
      );
      tensionBridge = L(
        `서로 편안함에 안주하여 현실적인 결정이나 깊은 대화를 미루다 보면 작은 불만이 누적될 수 있습니다.`,
        `If you both settle too comfortably into ease and keep putting off real decisions or deeper conversation, small frustrations can build up.`,
      );

      matchStrength = "strong";
      supportingReasons.push({
        text: L(
          `${withP(partnerName, locale)} 함께 있을 때 느껴지는 자연스럽고 부담 없는 편안함이 ${seekerName}의 일상에 잔잔한 행복을 채워줍니다.`,
          `The natural, unpressured ease of being with ${partnerName} fills ${seekerName}'s everyday life with quiet happiness.`,
        ),
        evidenceId: `chart.${partnerId}.day_master.comfort_fit`,
        source: "personal_saju_chart",
        sourcePath: `day_master.stem.${partnerStem}`,
        confidence: "high",
      });
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.comfort_friction`,
        source: "romantic_ce",
        sourcePath: "friction.procrastination",
        confidence: "medium",
      });
      break;
    }

    case "sanggwan": {
      recognition = L(
        `${topicP(seekerName, locale)} ${partnerName}의 틀에 박히지 않은 센스와 기민한 위트, 번뜩이는 관점에 매료됩니다.`,
        `${topicP(seekerName, locale)} is captivated by ${partnerName}'s unconventional sense, sharp wit, and flashes of insight.`,
      );
      emotionalMeaning = L(
        `나의 솔직한 생각과 독특한 시선을 가식 없이 주고받을 수 있는 지적·감성적 교감을 갈망하기 때문입니다.`,
        `They crave an intellectual and emotional exchange where they can trade honest thoughts and a distinctive perspective without pretense.`,
      );
      scene = L(
        `예상치 못한 돌발 상황 앞에서도 유쾌한 대화와 번뜩이는 감각으로 긴장을 풀어내며 함께 웃음을 터뜨릴 때`,
        `Even faced with an unexpected turn of events, easing the tension with lively conversation and sharp wit, and bursting out laughing together`,
      );
      pairSpecificEffect = L(
        `지루할 틈 없는 신선한 자극과 역동적인 대화의 즐거움을 공유합니다.`,
        `Shares a fresh spark and the fun of dynamic conversation, leaving no room for boredom.`,
      );
      tensionBridge = L(
        `대화의 핑퐁이 과열되면 솔직한 피드백이 상대의 아픈 곳을 찌르는 날카로운 언어로 변할 수 있습니다.`,
        `When the back-and-forth heats up too much, honest feedback can turn into sharp language that hits the other where it hurts.`,
      );

      matchStrength = "strong";
      supportingReasons.push({
        text: L(
          `${partnerName}의 기민한 반응과 센스 있는 피드백이 ${seekerName}에게 지루할 틈 없는 신선한 자극과 매력을 선사합니다.`,
          `${partnerName}'s quick reactions and sharp feedback give ${seekerName} a fresh spark and appeal that never gets boring.`,
        ),
        evidenceId: `chart.${partnerId}.day_master.spark_fit`,
        source: "personal_saju_chart",
        sourcePath: `day_master.stem.${partnerStem}`,
        confidence: "high",
      });
      cautionReasons.push({
        text: tensionBridge,
        evidenceId: `chart.pair.spark_friction`,
        source: "romantic_ce",
        sourcePath: "friction.sharp_tongue",
        confidence: "medium",
      });
      break;
    }
  }

  // 2. Intra-Pair Elemental Energy Support (Without raw jargon)
  if (partnerStemEl === "earth" && seekerStemEl === "metal") {
    supportingReasons.push({
      text: L(
        `${partnerName}의 넓고 차분한 품이 ${seekerName}의 명확한 판단과 결단력을 따뜻하게 받쳐주는 든든한 안정감을 더합니다.`,
        `${partnerName}'s broad, calm presence adds a dependable warmth that supports ${seekerName}'s clear judgment and decisiveness.`,
      ),
      evidenceId: "chart.pair.element_flow.earth_to_metal",
      source: "pair_saju_facts",
      sourcePath: "flow.generation",
      confidence: "high",
    });
    matchedPartnerEvidence.push({
      evidenceId: "chart.pair.element_flow.earth_to_metal",
      source: "pair_saju_facts",
      sourcePath: "flow.generation",
      confidence: "high",
    });
  } else if (partnerStemEl === "metal" && seekerStemEl === "earth") {
    supportingReasons.push({
      text: L(
        `${partnerName}의 명료하고 깔끔한 기준이 ${seekerName}의 깊은 생각에 확실한 방향성을 잡아주는 역할을 합니다.`,
        `${partnerName}'s clear, clean standards help give ${seekerName}'s deep thinking a definite sense of direction.`,
      ),
      evidenceId: "chart.pair.element_flow.metal_to_earth",
      source: "pair_saju_facts",
      sourcePath: "flow.feedback",
      confidence: "high",
    });
    matchedPartnerEvidence.push({
      evidenceId: "chart.pair.element_flow.metal_to_earth",
      source: "pair_saju_facts",
      sourcePath: "flow.feedback",
      confidence: "high",
    });
  } else if (partnerStemEl === "water" && seekerStemEl === "wood") {
    supportingReasons.push({
      text: L(
        `${partnerName}의 깊은 통찰과 공감이 ${seekerName}의 새로운 시도와 도전에 부드러운 힘을 실어줍니다.`,
        `${partnerName}'s deep insight and empathy give a gentle boost to ${seekerName}'s new attempts and challenges.`,
      ),
      evidenceId: "chart.pair.element_flow.water_to_wood",
      source: "pair_saju_facts",
      sourcePath: "flow.generation",
      confidence: "high",
    });
  } else if (partnerStemEl === "wood" && seekerStemEl === "fire") {
    supportingReasons.push({
      text: L(
        `${partnerName}의 생동감 넘치는 호기심이 ${seekerName}의 따뜻한 열정을 한층 밝게 피워 올립니다.`,
        `${partnerName}'s lively curiosity fans ${seekerName}'s warm passion into something even brighter.`,
      ),
      evidenceId: "chart.pair.element_flow.wood_to_fire",
      source: "pair_saju_facts",
      sourcePath: "flow.generation",
      confidence: "high",
    });
  }

  // 3. Day Branch Harmony Support (Without raw jargon)
  if (
    (seekerDayBranch === "sin" && partnerDayBranch === "ja") ||
    (seekerDayBranch === "ja" && partnerDayBranch === "sin")
  ) {
    supportingReasons.push({
      text: L(
        `두 사람의 내면 리듬이 맞물리면서, 함께할 때 마음의 긴장이 풀리고 자연스러운 정서적 일체감을 느낍니다.`,
        `Your inner rhythms interlock, so being together eases inner tension and gives you a natural sense of emotional unity.`,
      ),
      evidenceId: "chart.pair.branch_trio.water_frame",
      source: "pair_saju_facts",
      sourcePath: "branch_trio.half_combine",
      confidence: "deterministic",
    });
    matchedPartnerEvidence.push({
      evidenceId: "chart.pair.branch_trio.water_frame",
      source: "pair_saju_facts",
      sourcePath: "branch_trio.half_combine",
      confidence: "deterministic",
    });
  }

  // Guaranteed partner-specific reason (see synthesizePartnerSpecificReason
  // above) — appended regardless of Ten God bucket or whether the
  // element-flow section above happened to fire for this specific
  // seeker/partner stem-element combo, so the attraction paragraph is
  // never controlled entirely by the seeker's Ten God alone.
  // Only the first clause of careExpression — that full field is already
  // quoted in full elsewhere (c3_dynamics face.private's primary line);
  // repeating all of it here would just create new cross-chapter overlap
  // while fixing the cross-couple one.
  const careFirstClause = partnerCe.careExpression?.text?.split(/(?<=[.!?다요])\s+/)[0];
  const partnerSpecificReason = synthesizePartnerSpecificReason({
    partnerName,
    partnerDominantElement,
    partnerTraitPredicate: careFirstClause,
    partnerTraitLabel: careFirstClause ? undefined : partnerCe.familiarRelationshipRole?.text,
    locale,
  });
  if (partnerSpecificReason) {
    supportingReasons.push(partnerSpecificReason);
    matchedPartnerEvidence.push({
      evidenceId: partnerSpecificReason.evidenceId,
      source: partnerSpecificReason.source,
      sourcePath: partnerSpecificReason.sourcePath,
      confidence: partnerSpecificReason.confidence,
    });
  }

  const primarySupport = supportingReasons[0]?.text ?? "";
  const primaryCaution = cautionReasons[0]?.text ?? "";

  const narrativeUnit: AttractionNarrativeUnit = {
    subject: seekerId === "a" ? "a_to_b" : "b_to_a",
    recognition: sanitizeParticles(recognition, [seekerName, partnerName], locale),
    emotionalMeaning: sanitizeParticles(emotionalMeaning, [seekerName, partnerName], locale),
    partnerEvidence: supportingReasons.map((r) => sanitizeParticles(r.text, [seekerName, partnerName], locale)),
    scene: sanitizeParticles(scene, [seekerName, partnerName], locale),
    pairSpecificEffect: sanitizeParticles(pairSpecificEffect, [seekerName, partnerName], locale),
    tensionBridge: sanitizeParticles(primaryCaution, [seekerName, partnerName], locale),
    evidenceIds: [
      ...preferenceSource.map((p) => p.evidenceId),
      ...matchedPartnerEvidence.map((m) => m.evidenceId),
      ...supportingReasons.map((s) => s.evidenceId),
      ...cautionReasons.map((c) => c.evidenceId),
    ],
    confidence: "high",
    usedClaims: [recognition, emotionalMeaning, ...supportingReasons.map((r) => r.text), primaryCaution],
  };

  const synthesisNarrative = sanitizeParticles(
    isEn
      ? `${recognition} ${emotionalMeaning}\n\n${supportingReasons.map((r) => r.text).join(" ")}\n\nA telling moment: ${scene}\n\nSomething to watch for: ${primaryCaution}`
      : `${recognition} ${emotionalMeaning}\n\n${supportingReasons.map((r) => r.text).join(" ")}\n\n대표적인 순간: ${scene}\n\n주의할 지점: ${primaryCaution}`,
    [seekerName, partnerName],
    locale,
  );

  return {
    seekerId,
    partnerId,
    seekerName,
    partnerName,
    seekerSpousePalace,
    preferenceSource,
    preferenceMeaning: {
      text: sanitizeParticles(seekerSpousePalace.partnerExpectation, [seekerName, partnerName], locale),
      evidenceId: seekerSpousePalace.provenance.evidenceId,
      source: seekerSpousePalace.provenance.source,
      sourcePath: seekerSpousePalace.provenance.sourcePath,
      confidence: "high",
    },
    matchedPartnerEvidence,
    matchStrength,
    supportingReasons: supportingReasons.map((r) => ({
      ...r,
      text: sanitizeParticles(r.text, [seekerName, partnerName], locale),
    })),
    cautionReasons: cautionReasons.map((r) => ({
      ...r,
      text: sanitizeParticles(r.text, [seekerName, partnerName], locale),
    })),
    allowedInference: seekerSpousePalace.profile.allowedInference,
    forbiddenInference: seekerSpousePalace.profile.forbiddenInference,
    canonicalEvidences: [
      {
        evidenceId: seekerSpousePalace.provenance.evidenceId,
        signalType: "spouse_palace_ten_god",
        signalFamily: "ten_gods",
        exactIdentity: seekerSpousePalace.tenGodCode,
        sourcePath: ["pillars", "day", "branch_ten_god", seekerSpousePalace.tenGodCode],
        owner: seekerId === "a" ? "person_a" : "person_b",
        position: "day",
        direction: seekerId === "a" ? "a_to_b" : "b_to_a",
        spousePalaceStatus: "spouse_palace",
        canonicalMeaning: {
          core: [seekerSpousePalace.partnerExpectation],
          relationalPotential: [seekerSpousePalace.intimateNeed],
          requiredContext: ["Day branch spouse palace preference"],
          cautions: [seekerSpousePalace.distortionWhenStressed],
          forbiddenExtensions: seekerSpousePalace.profile.forbiddenInference,
        },
        supportingEvidenceIds: supportingReasons.map((s) => s.evidenceId),
        contradictingEvidenceIds: [],
        confidence: "high",
        provenance: [
          {
            evidenceId: seekerSpousePalace.provenance.evidenceId,
            source: seekerSpousePalace.provenance.source,
            sourcePath: seekerSpousePalace.provenance.sourcePath,
            appliesTo: seekerId,
            confidence: "deterministic",
            claimBoundary: "direct_evidence",
            priority: "primary",
          },
        ],
      },
    ],
    lensInterpretations: [
      {
        evidenceId: `lens.${seekerId}_to_${partnerId}.attraction_match`,
        romanticMeaning: `${recognition} ${emotionalMeaning}`,
        direction: seekerId === "a" ? "a_to_b" : "b_to_a",
        chapterRelevance: "c2_attraction",
        editorialRole: "primary",
        allowedScenes: [scene],
        allowedInference: seekerSpousePalace.profile.allowedInference,
        forbiddenInference: seekerSpousePalace.profile.forbiddenInference,
        confidence: "high",
        evidenceIds: narrativeUnit.evidenceIds,
        tensionCounterpart: primaryCaution,
      },
    ],
    confidence: "high",
    narrativeUnit,
    synthesisNarrative,
  };
}
