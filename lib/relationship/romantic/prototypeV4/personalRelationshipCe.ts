import type { IndividualSajuChart } from "../../../personCore/individualSaju/types";
import type { RomanticSajuSignals } from "../../../personCore/sajuSignals/types";
import type { PersonalRelationalProfile } from "../../../personCore/personalContextEngine/types";
import {
  type TenGodRomanticProfile,
  getTenGodRomanticProfile,
} from "../tenGodRomanticProfiles";
import {
  type SpousePalaceProfile,
  resolveSpousePalaceProfile,
} from "./spousePalaceMatcher";
import { objectP, sanitizeParticles, pick, type NarrativeLocale } from "./narrativeLocale";

export type ConfidenceLevel =
  | "deterministic"
  | "high"
  | "medium"
  | "low"
  | "heuristic";

export type EvidenceBackedMeaning = {
  text: string;
  evidenceId: string;
  source: string;
  sourcePath: string;
  confidence: ConfidenceLevel;
  elementOrTenGod?: string;
  behavioralContext?: string;
};

/**
 * Consolidation Batch B — tracks where Personal CE's evidence-graded
 * relational_profile agrees/disagrees with this file's own saju-derived
 * selectors, and surfaces the two categories (conflict_decompression,
 * criticism_sensitivity) that don't yet have an authoritative mapping onto
 * existing text variants. Not rendered by the UI; audit/diff metadata only.
 * See docs referenced in the Batch B commit message for the mapping tables.
 */
export type PersonalCeAlignment = {
  stressResponse: {
    /** The johu-temperature-band selector this file used before Batch B. */
    legacyBand: "hot" | "cold" | "neutral";
    /** Personal CE's pressure_response, mapped onto the same band vocabulary. */
    ceBand: "hot" | "cold" | "neutral" | null;
    /** Whether Personal CE was actually used to select the rendered text. */
    ceAuthoritative: boolean;
    agrees: boolean;
  };
  careExpression: {
    legacyBand: "emotional_care" | "action_gift" | "other";
    ceBand: "emotional_care" | "action_gift" | null;
    ceAuthoritative: boolean;
    agrees: boolean;
  };
  /** Not yet wired as authoritative — no existing text variant to map onto without new copy. */
  conflictDecompressionCeCategory: PersonalRelationalProfile["conflict_decompression"] | null;
  /** Not yet wired as authoritative — no existing text variant to map onto without new copy. */
  criticismSensitivityCeCategory: PersonalRelationalProfile["criticism_sensitivity"] | null;
};

export type PersonalRelationshipCe = {
  personId: string;
  name: string;
  dayMaster: {
    stemCode: string;
    stemElement: string;
    yinYang: string;
    dayBranchCode: string;
    dayBranchElement: string;
  };
  spousePalaceProfile?: SpousePalaceProfile;
  natalTenGodProfiles?: TenGodRomanticProfile[];
  /**
   * The single "dominant" Ten God across the natal chart (distinct from the
   * spouse-palace Ten God, which is always the day-branch position).
   * Rule: among the 7 characters excluding the day stem itself (year
   * stem/branch, month stem/branch, day branch, hour stem/branch), if any
   * Ten God code appears 3+ times, that's dominant; otherwise fall back to
   * whichever Ten God sits at the month branch (월지).
   */
  dominantTenGodProfile?: TenGodRomanticProfile;
  coreRelationshipNature: EvidenceBackedMeaning;
  fiveElementStructure: {
    dominantElement: string;
    weakestElement: string;
    dominantMeaning: EvidenceBackedMeaning;
    deficiencyMeaning: EvidenceBackedMeaning;
    behavioralTranslation: EvidenceBackedMeaning[];
    relationshipTranslation: EvidenceBackedMeaning[];
  };
  careExpression: EvidenceBackedMeaning;
  relationshipNeeds: EvidenceBackedMeaning[];
  partnerPreferences: EvidenceBackedMeaning[];
  familiarRelationshipRole: EvidenceBackedMeaning;
  decisionStyle: EvidenceBackedMeaning;
  stressResponse: EvidenceBackedMeaning;
  conflictResponse: EvidenceBackedMeaning;
  recoveryPattern: EvidenceBackedMeaning;
  hiddenVulnerability: EvidenceBackedMeaning;
  strengthsGivenToPartner: EvidenceBackedMeaning[];
  supportNeededFromPartner: EvidenceBackedMeaning[];
  depletionRisk: EvidenceBackedMeaning;
  confidence: ConfidenceLevel;
  /** Present only when a Personal CE relational_profile was passed in. */
  personalCeAlignment?: PersonalCeAlignment;
  /**
   * Locale-independent categorical read of stress style ("cold" = withdraws/
   * goes quiet, "hot" = pushes for immediate confirmation, "neutral" =
   * neither) — the same value used to select stressResponse.text above.
   * Consumers that need to classify stress style (e.g. chapterLensResolvers.ts)
   * must read this instead of pattern-matching Korean keywords in
   * stressResponse.text, which breaks the moment that text is in English.
   */
  stressTempBand: "hot" | "cold" | "neutral";
};

// Day Master Core Translations
export const DAY_STEM_TRANSLATIONS: Record<
  string,
  {
    nature: string;
    behavior: string;
    role: string;
    decision: string;
    stress: string;
    strength: string;
    need: string;
    depletionRisk: string;
  }
> = {
  gyeong: {
    nature: "명확한 기준과 우직한 책임감으로 관계의 중심을 잡는 성향",
    behavior: "신뢰와 원칙을 중시하며, 겉은 단단하고 담백해 보여도 마음을 연 상대에게는 흔들림 없는 든든한 버팀목이 되어줍니다.",
    role: "웬만해선 흔들리지 않고 확실하게 결정을 내려주는 사람",
    decision: "감정에 치우치지 않고 사실과 원칙, 장기적 안정성을 기준으로 명확하게 결단을 내립니다.",
    stress: "통제할 수 없는 혼란이나 불투명한 상황에서 내면의 긴장이 높아지며 더욱 단호하고 엄격해집니다.",
    strength: "위기 상황에서도 감정에 휩쓸리지 않고 명확한 방향을 제시하는 결단력과 묵직한 든든함",
    need: "자신의 헌신과 노력이 존중받고 인정받고 있다는 명확한 확신과 존중",
    depletionRisk: "혼자서 모든 책임의 무게를 짊어지려다 내면의 피로가 누적되어 마음의 문을 닫을 위험",
  },
  sin: {
    nature: "섬세한 감각과 정교한 배려로 완성도 높은 관계를 가꾸는 성향",
    behavior: "서로에 대한 예의와 품격을 소중히 여기며, 사소한 약속이나 디테일한 배려도 깊이 기억하고 챙깁니다.",
    role: "작은 디테일까지 챙기면서 균형을 맞춰주는 사람",
    decision: "사소한 디테일과 관계의 심미적·정서적 완성도를 신중하게 따져가며 세밀하게 결정합니다.",
    stress: "거칠거나 무신경한 태도에 깊은 상처를 입으며, 냉정하게 선을 긋고 침묵으로 거리를 둡니다.",
    strength: "상대의 작은 불편이나 감정선도 미리 알아채고 정돈해 주는 정교하고 섬세한 케어",
    need: "거칠거나 무신경한 태도로부터 보호받는 안전하고 정중하게 존중받는 대화 환경",
    depletionRisk: "완벽한 배려와 품격을 유지하려다 작은 흠집이나 거친 반응에 쉽게 에너지가 소진될 위험",
  },
  gap: {
    nature: "솔직하고 진취적으로 함께 성장하는 동반자적 관계를 지향하는 성향",
    behavior: "관계의 비전과 성장을 주도하며, 연인에게 힘이 되어주고 앞장서서 문제를 해결해 주고자 합니다.",
    role: "앞장서서 방향을 잡고 밀어붙여 주는 사람",
    decision: "큰 그림과 미래의 성장 가능성을 우선시하며, 주도적이고 시원시원하게 결정을 추진합니다.",
    stress: "자신의 방향성이 막히거나 지지받지 못한다고 느끼면 조급해지며 답답함을 강하게 토로합니다.",
    strength: "어려운 상황에서도 희망을 잃지 않고 앞장서서 길을 여는 씩씩한 추진력과 든든함",
    need: "자신의 리더십과 방향성을 신뢰하고 지지해 주는 파트너의 진심 어린 응원",
    depletionRisk: "언제나 강하고 든든한 버팀목이어야 한다는 강박에 갇혀 자신의 약한 소리를 삼키다 지칠 위험",
  },
  eul: {
    nature: "다정하고 유연하게 상대에게 스며들며 일상의 온기를 나누는 성향",
    behavior: "적응력이 뛰어나고 주변 분위기를 편안하게 만들며, 부드러운 공감과 친밀한 소통으로 유대감을 쌓습니다.",
    role: "분위기를 편하게 만들고 곁을 잘 맞춰주는 사람",
    decision: "상대의 기분과 상황을 배려하며 부드러운 타협과 조화를 통해 유연하게 결정을 조율합니다.",
    stress: "강한 압박이나 억압적인 환경에 직면하면 불안해하며 유연하게 비껴서거나 숨을 곳을 찾습니다.",
    strength: "상대의 감정에 부드럽게 맞추고 관계의 팽팽한 긴장을 사르르 녹여주는 놀라운 유연성",
    need: "갑작스러운 압박이나 통제 없이 자신의 속도대로 쉴 수 있는 부드러운 여유와 지지",
    depletionRisk: "상대에게 맞추고 분위기를 살피느라 자신의 본래 욕구를 억누르며 정서적으로 고갈될 위험",
  },
  byeong: {
    nature: "숨김없이 밝은 열정과 솔직함으로 사랑을 아낌없이 표현하는 성향",
    behavior: "감정을 투명하게 꺼내 보이며, 연인에게 기쁨과 긍정적인 활력을 전하는 즉각적인 감정 교류를 중시합니다.",
    role: "감정을 솔직하게 드러내서 관계에 생기를 불어넣는 사람",
    decision: "직관적이고 즉각적인 영감을 따르며, 긍정적인 에너지와 확신을 바탕으로 빠르게 결정합니다.",
    stress: "관계의 온도가 차갑게 식거나 상대의 반응이 냉담할 때 큰 불안과 답답함을 느끼며 즉각적인 확인을 요구합니다.",
    strength: "어떤 순간에도 가식 없이 솔직하게 마음을 열고 온기를 전하는 아낌없는 진정성",
    need: "자신의 열정과 애정 표현에 즉각적이고 따뜻하게 반응해 주는 다정한 피드백",
    depletionRisk: "언제나 밝고 따뜻한 에너지를 뿜어내느라 내면의 그늘과 외로움을 방치하며 방전될 위험",
  },
  jeong: {
    nature: "은은하고 섬세한 온기로 상대를 깊이 헤아리는 헌신적 성향",
    behavior: "겉으로는 차분하지만 내면에 깊은 온기를 품고 있으며, 상대의 미세한 심리 변화를 섬세하게 헤아립니다.",
    role: "말은 없어도 곁에서 마음을 알아채 주는 사람",
    decision: "상대방의 마음 상태와 감정적 여파를 깊이 헤아린 뒤 조용하고 신중하게 결정을 내립니다.",
    stress: "서운함이나 상처를 겉으로 크게 폭발시키지 못하고 가슴속에 은은히 삭이며 스스로를 태웁니다.",
    strength: "상대의 깊은 상처나 외로움을 묵묵히 보듬어주는 깊은 정서적 수용력과 헌신",
    need: "자신의 조용한 헌신을 당연하게 여기지 않고 알아주는 다정한 눈빛과 따뜻한 인정",
    depletionRisk: "상대를 위해 쉬지 않고 애쓰다가 정작 자신은 소리 없이 지쳐버릴 위험",
  },
  mu: {
    nature: "변함없는 묵묵함과 넓은 품으로 상대를 포용하는 안정적 성향",
    behavior: "감정의 기복에 쉽게 흔들리지 않고 듬직하게 자리를 지키며, 언제든 돌아와 쉴 수 있는 쉼터가 되어줍니다.",
    role: "웬만한 일엔 동요하지 않고 묵묵히 곁을 지켜주는 사람",
    decision: "조급하게 서두르지 않고 상황이 무르익기를 기다리며 가장 묵직하고 안정적인 길을 선택합니다.",
    stress: "감정이 복잡해지면 말문을 닫고 침묵 속으로 침잠하여 홀로 무게를 견디려 합니다.",
    strength: "갈등이나 위기 속에서도 조급해하지 않고 묵묵히 버텨주는 탁월한 인내심과 든든한 안정감",
    need: "자신의 침묵과 생각을 다그치지 않고 묵묵히 기다려주는 깊은 신뢰와 배려",
    depletionRisk: "속마음을 밖으로 표현하지 않고 홀로 모든 무게를 삼키다 감정이 굳어지고 무력해질 위험",
  },
  gi: {
    nature: "세심하고 다정하게 상대의 현실과 일상을 품어주는 성향",
    behavior: "상대의 사소한 일상과 실질적 필요를 미리 세심하게 챙겨주며, 현실적이면서도 편안한 안도감을 제공합니다.",
    role: "일상을 세심하게 챙겨주는 사람",
    decision: "현실적인 실행 가능성과 주변의 편안함을 꼼꼼히 살피며 실용적이고 조화로운 결정을 내립니다.",
    stress: "생각이 너무 많아지면 속으로 불안을 키우며 사소한 걱정에 얽매여 마음을 졸입니다.",
    strength: "현실적인 생활 감각과 상대를 편안하게 무장해제시키는 살뜰하고 따뜻한 포용력",
    need: "혼자서 모든 것을 챙기느라 지치지 않도록 먼저 손을 내밀고 품을 내어주는 배려",
    depletionRisk: "상대의 일상을 챙기고 뒤치다꺼리를 도맡느라 자신의 휴식과 필요를 뒷전으로 미룰 위험",
  },
  im: {
    nature: "넓은 시야와 유연한 포용력으로 깊은 정서적 교감을 나누는 성향",
    behavior: "틀에 얽매이지 않고 상대의 다름을 넓게 수용하며, 깊이 있는 대화와 자유로운 흐름 속에서 친밀해집니다.",
    role: "다름을 있는 그대로 받아들이고 넓게 이해해 주는 사람",
    decision: "고정관념에 갇히지 않고 전체적인 흐름과 본질을 꿰뚫어 보며 유연하고 거시적인 결정을 내립니다.",
    stress: "구속받거나 생각이 얽히면 감정을 수면 아래로 감추고 속을 알 수 없는 깊은 침묵으로 돌아섭니다.",
    strength: "어떤 상황에서도 유연하게 흐름을 타며 상대의 다양한 모습을 넓게 품어주는 지혜와 여유",
    need: "자신의 독립적인 사색과 감정의 흐름을 억압하거나 구속하지 않는 정서적 자유",
    depletionRisk: "생각이 너무 깊어지거나 모든 감정을 홀로 삼키다 현실 감각을 잃고 고립될 위험",
  },
  gye: {
    nature: "섬세한 감수성과 다정한 촉촉함으로 마음에 부드럽게 스며드는 성향",
    behavior: "상대의 작은 감정선까지 섬세하게 포착하여 맞춤형 배려를 전하며, 조용하지만 깊은 애착을 형성합니다.",
    role: "말하지 않은 마음까지 알아채고 다정하게 채워주는 사람",
    decision: "직관적인 육감과 상대의 감정선을 세심하게 헤아리며, 상대방의 마음이 다치지 않는 방향으로 조심스럽게 결정합니다.",
    stress: "주변의 부정적인 기운이나 차가운 분위기를 스펀지처럼 흡수하여 마음이 쉽게 불안해지고 위축됩니다.",
    strength: "상대의 말 못 할 고충을 직관적으로 알아채고 마음 깊이 공감해 주는 다정한 감수성",
    need: "자신의 연약한 감정선을 거칠게 대하지 않고 따뜻하고 안전하게 감싸주는 온기",
    depletionRisk: "상대의 불안과 상처를 고스란히 떠안으며 감정의 소용돌이에 휘말려 소진될 위험",
  },
};

// Day Master Core Translations — English mirror of DAY_STEM_TRANSLATIONS.
export const DAY_STEM_TRANSLATIONS_EN: typeof DAY_STEM_TRANSLATIONS = {
  gyeong: {
    nature: "A nature that holds the relationship's center with clear standards and steady responsibility",
    behavior: "Values trust and principle — may look firm and plain on the surface, but becomes an unshakeable pillar for anyone who's earned their trust.",
    role: "Someone who stays steady and decides clearly even when things get shaky",
    decision: "Makes clear decisions based on fact, principle, and long-term stability, without being swayed by emotion.",
    stress: "In uncontrollable chaos or an unclear situation, inner tension rises and they become more firm and strict.",
    strength: "A decisiveness and steady dependability that stays clear-headed and points the way even in a crisis",
    need: "Clear confidence and respect that their devotion and effort are recognized and valued",
    depletionRisk: "Risk of shutting down emotionally after trying to carry the full weight of every responsibility alone",
  },
  sin: {
    nature: "A nature that cultivates a polished, high-quality relationship through delicate sensitivity and precise care",
    behavior: "Values mutual courtesy and refinement, remembering and attending to even small promises or details.",
    role: "Someone who notices the small details and keeps things balanced",
    decision: "Decides carefully, weighing small details along with the relationship's aesthetic and emotional completeness.",
    stress: "Deeply hurt by a rough or careless attitude, draws a cool line and creates distance through silence.",
    strength: "A precise, delicate care that notices and smooths over even the other's smallest discomfort or emotional shift",
    need: "A safe, courteous conversation environment, protected from rough or careless treatment",
    depletionRisk: "Risk of quickly draining their energy over small flaws or rough reactions while trying to maintain perfect care and dignity",
  },
  gap: {
    nature: "A nature aimed at an honest, forward-driving, growth-oriented partnership",
    behavior: "Leads the relationship's vision and growth, wanting to be their partner's strength and step forward to solve problems.",
    role: "Someone who steps out front and pushes things in the right direction",
    decision: "Prioritizes the big picture and future growth potential, pushing decisions forward decisively and confidently.",
    stress: "Grows impatient and voices frustration strongly when they feel their direction is blocked or unsupported.",
    strength: "A spirited drive that doesn't lose hope and leads the way forward even in a hard situation",
    need: "Sincere encouragement from a partner who trusts and supports their leadership and direction",
    depletionRisk: "Risk of getting trapped in the compulsion to always be strong and dependable, swallowing their own weak moments until they burn out",
  },
  eul: {
    nature: "A warm, flexible nature that gently blends into the other and shares everyday warmth",
    behavior: "Highly adaptable and puts the mood at ease, building connection through gentle empathy and close communication.",
    role: "Someone who keeps the mood easy and adjusts to whoever they're with",
    decision: "Considers the other's mood and situation, coordinating decisions flexibly through gentle compromise and harmony.",
    stress: "Grows anxious in the face of strong pressure or a controlling environment, flexibly sidestepping or looking for somewhere to hide.",
    strength: "A remarkable flexibility that gently matches the other's emotions and melts away tension in the relationship",
    need: "Gentle room and support to rest at their own pace, without sudden pressure or control",
    depletionRisk: "Risk of emotional depletion from constantly reading the mood and suppressing their own real needs to accommodate the other",
  },
  byeong: {
    nature: "A nature that expresses love generously with unhidden, bright passion and honesty",
    behavior: "Shows feelings transparently, valuing immediate emotional exchange that brings joy and positive energy to their partner.",
    role: "Someone who says how they feel out loud and brings energy into the room",
    decision: "Follows intuitive, immediate inspiration, deciding quickly on positive energy and confidence.",
    stress: "Feels strong anxiety and frustration when the relationship's warmth cools or the other's response feels distant, and demands immediate reassurance.",
    strength: "An unreserved authenticity that opens their heart honestly and shares warmth without pretense in any moment",
    need: "Warm, immediate feedback in response to their passion and expressions of affection",
    depletionRisk: "Risk of running themselves down by always radiating bright, warm energy while neglecting their own inner shadows and loneliness",
  },
  jeong: {
    nature: "A devoted nature that reads the other deeply with a quiet, delicate warmth",
    behavior: "Calm on the surface but carries deep warmth within, sensitively noticing the other's subtle psychological shifts.",
    role: "Someone who doesn't say much but always notices how you're really doing",
    decision: "Deeply considers the other's emotional state and its ripple effects before deciding quietly and carefully.",
    stress: "Doesn't let hurt or disappointment erupt outwardly, and instead quietly smolders, burning it away inside.",
    strength: "A deep emotional capacity and devotion that quietly holds the other's deep hurt or loneliness",
    need: "A warm gaze and sincere recognition that doesn't take their quiet devotion for granted",
    depletionRisk: "Risk of quietly wearing themselves out from never letting up on caring for the other",
  },
  mu: {
    nature: "A steady nature that embraces the other with unwavering calm and a broad embrace",
    behavior: "Doesn't get easily shaken by emotional ups and downs, holding steady ground as a place to always come back and rest.",
    role: "Someone who doesn't rattle easily and just quietly stays put",
    decision: "Doesn't rush, waiting for the moment to ripen and choosing the steadiest, most stable path.",
    stress: "When feelings get complicated, shuts down and sinks into silence, trying to bear the weight alone.",
    strength: "An outstanding patience and steady reassurance that holds firm without rushing, even through conflict or crisis",
    need: "Deep trust and consideration that waits patiently instead of pressing their silence and thoughts",
    depletionRisk: "Risk of not expressing what's inside and carrying the full weight alone until their feelings harden and they lose energy",
  },
  gi: {
    nature: "A nature that warmly and attentively holds the other's everyday reality and life",
    behavior: "Attentively looks after the other's small daily needs in advance, offering a grounded, comfortable reassurance.",
    role: "Someone who handles the small, everyday stuff without being asked",
    decision: "Makes practical, harmonious decisions after carefully weighing real feasibility and everyone's comfort.",
    stress: "When overthinking builds up, quietly grows anxious and gets caught up worrying over small things.",
    strength: "A grounded, warm generosity that offers practical life sense and puts the other comfortably at ease",
    need: "Care that reaches out first so they don't wear themselves out managing everything alone",
    depletionRisk: "Risk of putting their own rest and needs last while taking on the other's daily errands and upkeep",
  },
  im: {
    nature: "A nature that shares deep emotional connection through a broad view and flexible acceptance",
    behavior: "Isn't bound by convention, broadly accepting the other's differences and growing close through deep conversation and free-flowing exchange.",
    role: "Someone who takes people's differences in stride instead of judging them",
    decision: "Sees through the overall flow and essence rather than getting stuck on fixed ideas, deciding flexibly and with a big-picture view.",
    stress: "When constrained or caught up in tangled thoughts, hides their feelings below the surface and turns to a deep, unreadable silence.",
    strength: "A wisdom and ease that flows flexibly with any situation and broadly embraces the other's many sides",
    need: "Emotional freedom that doesn't suppress or constrain their independent reflection and flow of feeling",
    depletionRisk: "Risk of getting lost in overly deep thought or swallowing every emotion alone until they lose touch with reality and become isolated",
  },
  gye: {
    nature: "A nature that seeps gently into the heart with delicate sensitivity and a warm, tender touch",
    behavior: "Delicately picks up on even the other's smallest emotional shifts and offers tailored care, forming a quiet but deep attachment.",
    role: "Someone who picks up on what you haven't said and quietly meets it",
    decision: "Values intuitive gut feeling and a close read of the other's emotions, deciding carefully in the direction that won't hurt the other's heart.",
    stress: "Absorbs negative energy or a cold mood around them like a sponge, easily growing anxious and withdrawn.",
    strength: "A warm sensitivity that intuitively notices the other's unspoken struggles and empathizes deeply",
    need: "Warmth that wraps their delicate feelings gently and safely, rather than treating them roughly",
    depletionRisk: "Risk of fully absorbing the other's anxiety and hurt and getting swept up in an emotional whirlpool until they're drained",
  },
};

// Five Elements Interpretations
const FIVE_ELEMENT_BALANCE_INTERPRETATIONS: Record<
  string,
  { dominant: string; deficiency: string; behavior: string; dynamic: string }
> = {
  metal_dominant: {
    dominant: "결단력과 기준이 분명하며, 신뢰와 원칙을 중요하게 생각합니다.",
    deficiency: "감정적인 여유와 부드러운 쿠션이 부족해 상대에게 단호하거나 완고하게 보일 수 있습니다.",
    behavior: "생각을 명확하게 정리한 뒤 핵심 위주로 대화하며, 말보다는 행동의 일관성으로 신뢰를 증명합니다.",
    dynamic: "관계의 틀을 든든하게 세우지만, 감정의 미묘한 온도를 나누는 대화에서 파트너의 온화한 이끎이 필요합니다.",
  },
  fire_dominant: {
    dominant: "애정 표현이 솔직하고 즉각적이며, 관계에 활력과 온기를 불어넣습니다.",
    deficiency: "감정이 빠르게 고조되어 즉각적인 해답을 원하므로, 차분한 숙성의 시간이 부족할 수 있습니다.",
    behavior: "마음이 동하면 즉시 표현하고 확인하려 하며, 분위기가 침체되는 것을 견디기 힘들어합니다.",
    dynamic: "관계의 온도를 빠르게 높이지만, 갈등 시 감정이 과열되지 않도록 파트너의 차분한 브레이크가 필요합니다.",
  },
  wood_dominant: {
    dominant: "새로운 시작과 성장에 대한 의욕이 넘치며, 솔직하고 순수한 열정으로 다가갑니다.",
    deficiency: "감정의 맺고 끊음이 서툴거나 마무리 단계에서 피로감을 느낄 수 있습니다.",
    behavior: "앞장서서 계획을 제안하고 관계를 확장하려 하며, 솔직담백하게 감정을 나눕니다.",
    dynamic: "새로운 자극과 성장을 주지만, 현실적인 정돈과 매듭짓기에서 파트너의 든든한 정리가 보완되어야 합니다.",
  },
  earth_dominant: {
    dominant: "묵묵하고 변함없는 신뢰감을 주며, 상대의 감정과 상황을 넓게 품어줍니다.",
    deficiency: "마음속 생각을 즉각 꺼내지 않고 삼키다 보니 감정의 표현이 늦거나 답답하게 느껴질 수 있습니다.",
    behavior: "쉽게 태도를 바꾸지 않고 듬직하게 기다려주며, 조용히 상대의 편의를 살핍니다.",
    dynamic: "최고의 안정감을 제공하지만, 속마음을 먼저 열 수 있도록 파트너의 다정한 노크가 필요합니다.",
  },
  water_dominant: {
    dominant: "깊은 직관과 유연한 공감 능력을 갖추고 있어 상대의 감정을 잘 헤아립니다.",
    deficiency: "생각이 깊어지면 혼자만의 생각에 갇히거나 명확한 현실적 결정을 미룰 수 있습니다.",
    behavior: "상대의 기류에 민감하게 맞추며, 겉으로 드러난 말 이면의 진심을 읽어냅니다.",
    dynamic: "깊은 정서적 교감을 가능하게 하지만, 관계의 명확한 경계와 현실적 기준을 세울 때 파트너의 지지가 필요합니다.",
  },
};

const FIVE_ELEMENT_BALANCE_INTERPRETATIONS_EN: typeof FIVE_ELEMENT_BALANCE_INTERPRETATIONS = {
  metal_dominant: {
    dominant: "Has clear decisiveness and standards, and places real value on trust and principle.",
    deficiency: "May come across as firm or stubborn to the other, lacking emotional give and a soft cushion.",
    behavior: "Sorts out their thoughts clearly before speaking to the point, proving trust through consistency of action more than words.",
    dynamic: "Builds a solid frame for the relationship, but needs their partner's warm lead in conversations that touch subtle emotional shifts.",
  },
  fire_dominant: {
    dominant: "Expresses affection honestly and immediately, bringing energy and warmth to the relationship.",
    deficiency: "Feelings heat up quickly and they want an immediate answer, so there may be little room for things to settle calmly.",
    behavior: "Expresses and checks in the moment their heart moves, and finds it hard to sit with a flat, quiet mood.",
    dynamic: "Quickly raises the relationship's warmth, but needs their partner's calm hand on the brake so conflict doesn't overheat.",
  },
  wood_dominant: {
    dominant: "Full of motivation for new beginnings and growth, approaching things with honest, pure passion.",
    deficiency: "May be awkward at closing things out cleanly, or feel worn down at the finishing stage.",
    behavior: "Steps up to propose plans and expand the relationship, sharing feelings honestly and openly.",
    dynamic: "Brings new stimulation and growth, but needs their partner's steady follow-through to tie up loose ends in reality.",
  },
  earth_dominant: {
    dominant: "Gives a steady, unwavering sense of trust, broadly holding space for the other's feelings and situation.",
    deficiency: "Tends to swallow their inner thoughts rather than voice them right away, which can feel slow or frustrating to express.",
    behavior: "Doesn't easily shift their stance, waits steadily, and quietly looks out for the other's comfort.",
    dynamic: "Offers the deepest sense of stability, but needs their partner's warm nudge to open up what's really on their mind first.",
  },
  water_dominant: {
    dominant: "Has deep intuition and flexible empathy, and reads the other's feelings well.",
    deficiency: "When thoughts run deep, may get stuck in their own head or put off a clear, practical decision.",
    behavior: "Tunes in sensitively to the other's mood, and reads the sincerity behind what's said out loud.",
    dynamic: "Enables deep emotional connection, but needs their partner's support in setting clear relationship boundaries and practical standards.",
  },
};

/**
 * Consolidation Batch B — maps Personal CE's evidence-graded pressure_response
 * category onto the same hot/cold/neutral band vocabulary this file already
 * used (johu temperature_band), so Personal CE becomes the authoritative
 * selector without inventing new stress-response copy. "mixed_*" and
 * "neutral_unspecified" have no clear hot/cold lean, so they fall back to
 * the legacy johu-band selector rather than guessing.
 */
const PRESSURE_RESPONSE_TO_BAND: Partial<
  Record<PersonalRelationalProfile["pressure_response"], "hot" | "cold" | "neutral">
> = {
  resolute_crisis_fighter: "hot",
  stress_vulnerable_anchor_needed: "cold",
  adaptive_pacing: "neutral",
};

/**
 * Maps Personal CE's support_giving_style onto the existing
 * emotional_care/action_gift affection-band vocabulary this file already
 * branched on (previously sourced from romantic_saju_signals.affection_band).
 * "silent_standby"/"mixed_*"/"neutral_unspecified" have no clean match to
 * either existing branch, so they fall back to the legacy signal-band selector.
 */
const SUPPORT_GIVING_TO_AFFECTION_BAND: Partial<
  Record<PersonalRelationalProfile["support_giving_style"], "emotional_care" | "action_gift">
> = {
  nurturing_empath: "emotional_care",
  practical_troubleshooter: "action_gift",
};

export function buildPersonalRelationshipCe(params: {
  personId: string;
  name: string;
  chart: IndividualSajuChart;
  signals?: RomanticSajuSignals | null;
  /** Personal CE's relational_profile (personalCe.aggregates.relational_profile). */
  relationalProfile?: PersonalRelationalProfile | null;
  /** Defaults to "ko-KR" so every pre-existing caller that never passed one keeps its current behavior. */
  locale?: NarrativeLocale;
}): PersonalRelationshipCe {
  const { personId, name, chart, signals, relationalProfile, locale = "ko-KR" } = params;
  const isEn = locale === "en-US";
  const dm = chart.day_master;
  const stemKey = dm.stem.code;
  const stemEl = dm.stem.element;
  const branchEl = dm.day_branch.element;
  const branchKey = dm.day_branch.code;

  const dayStemTable = isEn ? DAY_STEM_TRANSLATIONS_EN : DAY_STEM_TRANSLATIONS;
  const translation = dayStemTable[stemKey] ?? dayStemTable.gyeong;

  const domEl = chart.five_elements.dominant;
  const weakEl = chart.five_elements.weakest;
  const domKey = `${domEl}_dominant`;
  const fiveElementTable = isEn ? FIVE_ELEMENT_BALANCE_INTERPRETATIONS_EN : FIVE_ELEMENT_BALANCE_INTERPRETATIONS;
  const elInterp = fiveElementTable[domKey] ?? fiveElementTable.metal_dominant;

  // Day Branch Ten God (Spouse Palace) strictly resolved from Day Pillar
  const personRole: "a" | "b" = personId === "b" ? "b" : "a";
  const spousePalaceProfile = resolveSpousePalaceProfile(chart, personRole, name, locale);
  const partnerPreferenceText = spousePalaceProfile.partnerExpectation;
  const needText = spousePalaceProfile.intimateNeed;

  // Collect all distinct Ten Gods across the four pillars
  const natalTenGodProfiles: TenGodRomanticProfile[] = [];
  const seenTenGods = new Set<string>();
  for (const pillar of chart.pillars) {
    if (pillar.stem_ten_god?.code && !seenTenGods.has(pillar.stem_ten_god.code)) {
      seenTenGods.add(pillar.stem_ten_god.code);
      natalTenGodProfiles.push(getTenGodRomanticProfile(pillar.stem_ten_god.code, locale));
    }
    if (pillar.branch_ten_god?.code && !seenTenGods.has(pillar.branch_ten_god.code)) {
      seenTenGods.add(pillar.branch_ten_god.code);
      natalTenGodProfiles.push(getTenGodRomanticProfile(pillar.branch_ten_god.code, locale));
    }
  }

  // Dominant Ten God: count occurrences across the 7 characters excluding
  // the day stem itself (the day pillar's stem is the reference point and
  // has no Ten God relative to itself). If any code appears 3+ times, it's
  // dominant; otherwise fall back to the month branch (월지) Ten God.
  const tenGodCounts = new Map<string, number>();
  let monthBranchTenGodCode: string | undefined;
  for (const pillar of chart.pillars) {
    if (pillar.slot !== "day" && pillar.stem_ten_god?.code) {
      tenGodCounts.set(
        pillar.stem_ten_god.code,
        (tenGodCounts.get(pillar.stem_ten_god.code) ?? 0) + 1,
      );
    }
    if (pillar.branch_ten_god?.code) {
      tenGodCounts.set(
        pillar.branch_ten_god.code,
        (tenGodCounts.get(pillar.branch_ten_god.code) ?? 0) + 1,
      );
    }
    if (pillar.slot === "month") {
      monthBranchTenGodCode = pillar.branch_ten_god?.code;
    }
  }
  let dominantTenGodCode: string | undefined;
  for (const [code, count] of tenGodCounts) {
    if (count >= 3) {
      dominantTenGodCode = code;
      break;
    }
  }
  dominantTenGodCode ??= monthBranchTenGodCode;
  const dominantTenGodProfile = dominantTenGodCode
    ? getTenGodRomanticProfile(dominantTenGodCode, locale)
    : undefined;

  // Care Expression: dynamically composed from Day Master behavior, Spouse Palace Ten God expression style, and affection band.
  // Consolidation Batch B: Personal CE's support_giving_style is authoritative when it maps
  // cleanly onto an existing branch; otherwise falls back to the legacy signal-band selector.
  const legacyAffBand: "emotional_care" | "action_gift" | "other" =
    signals?.affection_language?.affection_band === "emotional_care"
      ? "emotional_care"
      : signals?.affection_language?.affection_band === "action_gift"
        ? "action_gift"
        : "other";
  const ceAffBand = relationalProfile
    ? (SUPPORT_GIVING_TO_AFFECTION_BAND[relationalProfile.support_giving_style] ?? null)
    : null;
  const affBand = ceAffBand ?? (legacyAffBand === "other" ? "action_gift" : legacyAffBand);
  const expStyle = spousePalaceProfile.profile.expressionStyle;
  const expPredicate = isEn
    ? `${expStyle}.`
    : expStyle.endsWith("소통") || expStyle.endsWith("제시") || expStyle.endsWith("전달") || expStyle.endsWith("표현") || expStyle.endsWith("형성") || expStyle.endsWith("설정") || expStyle.endsWith("과시")
      ? `${expStyle}합니다.`
      : expStyle.endsWith("피드백")
        ? `${expStyle}을 주고받습니다.`
        : `${expStyle}하며 신뢰를 쌓아갑니다.`;

  let careText = "";
  if (isEn) {
    if (affBand === "emotional_care") {
      careText = `${translation.behavior} Pays close attention to the other's emotional state, and ${expPredicate.charAt(0).toLowerCase()}${expPredicate.slice(1)}`;
    } else if (affBand === "action_gift") {
      careText = `${translation.behavior} Takes care of daily life through practical thoughtfulness and dependable action, and ${expPredicate.charAt(0).toLowerCase()}${expPredicate.slice(1)}`;
    } else {
      careText = `${translation.behavior} ${expPredicate}`;
    }
  } else if (affBand === "emotional_care") {
    careText = `${translation.behavior} 상대의 감정선을 세심하게 살피며, ${expPredicate}`;
  } else if (affBand === "action_gift") {
    careText = `${translation.behavior} 실질적인 배려와 든든한 행동으로 일상을 챙기며, ${expPredicate}`;
  } else {
    careText = `${translation.behavior} ${expPredicate}`;
  }

  // Stress Response: dynamically composed from Day Master stress, Johu climate, and Spouse Palace stress response.
  // Consolidation Batch B: Personal CE's pressure_response is authoritative when it maps
  // cleanly onto hot/cold/neutral; otherwise falls back to the legacy johu-band selector.
  const legacyTempBand = chart.johu.temperature_band;
  const ceTempBand = relationalProfile
    ? (PRESSURE_RESPONSE_TO_BAND[relationalProfile.pressure_response] ?? null)
    : null;
  const tempBand = ceTempBand ?? legacyTempBand;
  let stressText = "";
  if (isEn) {
    if (tempBand === "hot") {
      stressText = `${translation.stress} As stress builds, their emotions spike right away and they want to work it out through immediate conversation. ${spousePalaceProfile.profile.stressResponse}`;
    } else if (tempBand === "cold") {
      stressText = `${translation.stress} Under stress, they avoid direct emotional confrontation and need to withdraw to their own space to sort out their thoughts. ${spousePalaceProfile.profile.stressResponse}`;
    } else {
      stressText = `${translation.stress} They calmly settle their emotions before working through the heart of the situation. ${spousePalaceProfile.profile.stressResponse}`;
    }
  } else if (tempBand === "hot") {
    stressText = `${translation.stress} 스트레스가 차오르면 감정이 즉각 고조되며 대화로 즉시 풀고자 하고, ${spousePalaceProfile.profile.stressResponse}`;
  } else if (tempBand === "cold") {
    stressText = `${translation.stress} 스트레스 상황에서는 감정 충돌을 피해 혼자만의 공간(동굴)으로 물러나 생각을 정리할 시간이 필요하며, ${spousePalaceProfile.profile.stressResponse}`;
  } else {
    stressText = `${translation.stress} 감정적인 동요를 가라앉힌 뒤 상황의 본질을 차분히 짚어가며, ${spousePalaceProfile.profile.stressResponse}`;
  }

  const personalCeAlignment: PersonalCeAlignment | undefined = relationalProfile
    ? {
        stressResponse: {
          legacyBand: legacyTempBand,
          ceBand: ceTempBand,
          ceAuthoritative: ceTempBand != null,
          agrees: (ceTempBand ?? legacyTempBand) === legacyTempBand,
        },
        careExpression: {
          legacyBand: legacyAffBand,
          ceBand: ceAffBand,
          ceAuthoritative: ceAffBand != null,
          agrees: (ceAffBand ?? legacyAffBand) === legacyAffBand,
        },
        conflictDecompressionCeCategory: relationalProfile.conflict_decompression,
        criticismSensitivityCeCategory: relationalProfile.criticism_sensitivity,
      }
    : undefined;

  // Conflict Response: dynamically composed from Day Master decision and Spouse Palace repair need
  const conflictText = isEn
    ? `${translation.decision} When conflict arises, they aim for ${spousePalaceProfile.profile.repairNeed}, working through the problem step by step.`
    : `${translation.decision} 갈등이 발생했을 때는 ${spousePalaceProfile.profile.repairNeed}의 태도를 지향하며 차근차근 문제를 풀어가고자 합니다.`;

  // Hidden Vulnerability: dynamically composed from Spouse Palace need/excess
  // risk. Final Evidence-to-Voice pass, item 2 — this used to open with
  // "${translation.nature} 때문에" (Hero's identity label), the 5th
  // cross-chapter repeat of that phrase. Goes straight to the hidden-need
  // reveal instead, which is this chapter's own unique layer.
  const vulnText = isEn
    ? `${name} can look composed and unbothered on the surface, but deep inside is quietly longing for ${translation.need.charAt(0).toLowerCase()}${translation.need.slice(1)}. ${name} also carries a quiet tension, worried that when the relationship feels shaky, they ${spousePalaceProfile.profile.excessRisk.charAt(0).toLowerCase()}${spousePalaceProfile.profile.excessRisk.slice(1)}.`
    : sanitizeParticles(
        `겉으로는 의연하고 덤덤해 보이지만, 내면 깊은 곳에서는 ${objectP(translation.need, locale)} 간절히 바라고 있습니다. 또한 관계가 흔들릴 때 ${spousePalaceProfile.profile.excessRisk}에 대한 조심스러운 긴장을 품고 있습니다.`,
        [],
        locale,
      );

  return {
    personId,
    name,
    dayMaster: {
      stemCode: stemKey,
      stemElement: stemEl,
      yinYang: dm.yin_yang,
      dayBranchCode: branchKey,
      dayBranchElement: branchEl,
    },
    coreRelationshipNature: {
      text: translation.nature,
      evidenceId: `chart.${personId}.day_master.nature`,
      source: "personal_saju_chart",
      sourcePath: "day_master.stem",
      confidence: "deterministic",
      elementOrTenGod: stemEl,
      behavioralContext: translation.behavior,
    },
    fiveElementStructure: {
      dominantElement: domEl,
      weakestElement: weakEl,
      dominantMeaning: {
        text: elInterp.dominant,
        evidenceId: `chart.${personId}.five_elements.dominant`,
        source: "personal_saju_chart",
        sourcePath: "five_elements.dominant",
        confidence: "high",
        elementOrTenGod: domEl,
      },
      deficiencyMeaning: {
        text: elInterp.deficiency,
        evidenceId: `chart.${personId}.five_elements.weakest`,
        source: "personal_saju_chart",
        sourcePath: "five_elements.weakest",
        confidence: "high",
        elementOrTenGod: weakEl,
      },
      behavioralTranslation: [
        {
          text: elInterp.behavior,
          evidenceId: `chart.${personId}.five_elements.behavior`,
          source: "personal_saju_chart",
          sourcePath: "five_elements.weighting",
          confidence: "high",
        },
      ],
      relationshipTranslation: [
        {
          text: elInterp.dynamic,
          evidenceId: `chart.${personId}.five_elements.relationship_dynamic`,
          source: "personal_saju_chart",
          sourcePath: "five_elements.interaction",
          confidence: "high",
        },
      ],
    },
    careExpression: {
      text: careText,
      evidenceId: `signals.${personId}.affection_language`,
      source: "romantic_saju_signals",
      sourcePath: "affection_language.affection_band",
      confidence: "high",
    },
    relationshipNeeds: [
      {
        text: needText,
        evidenceId: `chart.${personId}.spouse_palace.need`,
        source: "personal_saju_chart",
        sourcePath: "pillars.day.branch_ten_god",
        confidence: "high",
      },
    ],
    partnerPreferences: [
      {
        text: partnerPreferenceText,
        evidenceId: `chart.${personId}.spouse_palace.preference`,
        source: "personal_saju_chart",
        sourcePath: "pillars.day.branch_ten_god",
        confidence: "high",
      },
    ],
    familiarRelationshipRole: {
      text: translation.role,
      evidenceId: `chart.${personId}.day_master.role`,
      source: "personal_saju_chart",
      sourcePath: "day_master.stem",
      confidence: "high",
    },
    decisionStyle: {
      text: translation.decision,
      evidenceId: `chart.${personId}.day_master.decision`,
      source: "personal_saju_chart",
      sourcePath: "day_master.stem",
      confidence: "high",
    },
    stressResponse: {
      text: stressText,
      evidenceId: `chart.${personId}.johu.stress`,
      source: "personal_saju_chart",
      sourcePath: "johu.temperature_band",
      confidence: "high",
    },
    conflictResponse: {
      text: conflictText,
      evidenceId: `signals.${personId}.conflict_response`,
      source: "romantic_saju_signals",
      sourcePath: "conflict_response.conflict_band",
      confidence: "high",
    },
    recoveryPattern: {
      text:
        (signals?.conflict_response?.conflict_band === "expressive" ||
          signals?.conflict_response?.conflict_band === "direct" ||
          relationalProfile?.conflict_decompression === "immediate_clarifier")
          ? pick(locale, "문제에 대한 명확한 사과나 확답이 오가며 뒤끝 없이 빠르게 평온을 되찾는 소통", "Reaching calm quickly and cleanly through a clear apology or clear answers about the issue")
          : (tempBand === "cold" ||
              signals?.conflict_response?.conflict_band === "withdrawing" ||
              relationalProfile?.conflict_decompression === "solitude_cooling_needed")
            ? pick(locale, "충분히 혼자만의 시간을 가지며 감정의 온도가 차분하게 내려가는 회복 과정", "A recovery process of taking real time alone, letting emotions settle and cool down")
            : pick(locale, "서로의 안부를 묻고 다정한 인정을 나누며 편안한 평온을 되찾는 소통", "Reaching calm through warm recognition and gentle conversation"),
      evidenceId: `chart.${personId}.recovery_pattern`,
      source: "personal_saju_chart",
      sourcePath: "johu.recovery",
      confidence: "high",
    },
    hiddenVulnerability: {
      text: vulnText,
      evidenceId: `chart.${personId}.hidden_vulnerability`,
      source: "personal_saju_chart",
      sourcePath: "day_master.vulnerability",
      confidence: "high",
    },
    strengthsGivenToPartner: [
      {
        text: translation.strength,
        evidenceId: `chart.${personId}.strength_given`,
        source: "personal_saju_chart",
        sourcePath: "day_master.strength",
        confidence: "high",
      },
    ],
    supportNeededFromPartner: [
      {
        text: translation.need,
        evidenceId: `chart.${personId}.support_needed`,
        source: "personal_saju_chart",
        sourcePath: "day_master.need",
        confidence: "high",
      },
    ],
    depletionRisk: {
      text: translation.depletionRisk,
      evidenceId: `chart.${personId}.depletion_risk`,
      source: "personal_saju_chart",
      sourcePath: "day_master.depletion",
      confidence: "high",
    },
    spousePalaceProfile,
    natalTenGodProfiles,
    dominantTenGodProfile,
    confidence: "high",
    personalCeAlignment,
    stressTempBand: tempBand,
  };
}
