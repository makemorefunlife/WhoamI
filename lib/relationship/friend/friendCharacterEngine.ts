/**
 * FRIEND VNext — 10 Day-Master Friend Character & Directional Role Engine.
 *
 * 3-Layer Architecture:
 * - Layer 1: Individual Friend Character (Day Master 10 Family Anchor + Whole-Chart Expression Variant + Psych Validation)
 * - Layer 2: Directional Friend Value (Giver Capability × Receiver Need × Pair Activation)
 * - Layer 3: Pair Friendship Identity (Synergy Synthesis preserving A→B and B→A directionality)
 *
 * Closed 6-Capability Taxonomy:
 * - emotional_holding
 * - strategic_direction
 * - action_activation
 * - structure_boundaries
 * - social_harmony
 * - perspective_expansion
 */
import type { ChartContext } from "@/lib/saju/chartContext";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import { pick } from "@/lib/relationship/friend/friendCopy";
import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import type { FriendScoringSignals } from "@/lib/saju/friendAnalysis";

export type CanonicalFriendCapabilityKey =
  | "emotional_holding"
  | "strategic_direction"
  | "action_activation"
  | "structure_boundaries"
  | "social_harmony"
  | "perspective_expansion";

export type OrdinalCapabilityLevel = "STRONG" | "MODERATE" | "WEAK";

export type DayMasterStemCode =
  | "gap"
  | "eul"
  | "byeong"
  | "jeong"
  | "mu"
  | "gi"
  | "gyeong"
  | "sin"
  | "im"
  | "gye";

export type FriendBehaviorClaimFamily =
  | "SOCIAL_ENERGIZER"
  | "SOCIAL_MEDIATOR"
  | "SOCIAL_ANCHOR"
  | "PRIVATE_ANALYST"
  | "PRIVATE_LISTENER"
  | "PRIVATE_COMPANION"
  | "SUPPORT_PRACTICAL"
  | "SUPPORT_EMPATHIC"
  | "SUPPORT_STABLE"
  | "SUPPORT_ACTION"
  | "DIRECTIONAL_COMPASS"
  | "DIRECTIONAL_SANCTUARY"
  | "DIRECTIONAL_HARMONY"
  | "DIRECTIONAL_MOMENTUM";

export type FriendBehaviorSlot = {
  slot: "group" | "one_on_one" | "support" | "directional";
  label: string;
  description: string;
  claimFamily: FriendBehaviorClaimFamily;
  confidence: "HIGH" | "MEDIUM";
};

export type FourSlotFriendProfile = {
  groupSlot: FriendBehaviorSlot;
  oneOnOneSlot: FriendBehaviorSlot;
  supportSlot: FriendBehaviorSlot;
};

export type FriendSituationSnapshot = {
  capability: CanonicalFriendCapabilityKey;
  situationLabel: string;
  shortDescription: string;
  strength: "STRONG" | "MODERATE";
};

export type IndividualFriendCharacter = {
  dayMaster: DayMasterStemCode;
  characterFamily: string;
  expressionVariant: string;
  characterTitle: string;
  emoji: string;
  individualExplanation: string;
  primaryCapability: CanonicalFriendCapabilityKey;
  secondaryCapability: CanonicalFriendCapabilityKey;
  ordinalCapabilities: Record<CanonicalFriendCapabilityKey, OrdinalCapabilityLevel>;
  situationSnapshots: FriendSituationSnapshot[];
  fourSlotProfile: FourSlotFriendProfile;
  confidence: number;
  sajuEvidence: string[];
  psychEvidence: string[];
};

export type ReceiverNeedNeedProvenance = {
  key: string;
  description: string;
  sajuEvidence: string[];
  psychEvidence: string[];
  confidence: number;
};

export type DirectionalFriendValue = {
  giverName: string;
  receiverName: string;
  roleTitle: string;
  roleDescription: string;
  giverCapability: CanonicalFriendCapabilityKey;
  receiverNeed: ReceiverNeedNeedProvenance | null;
  pairActivationSignal: string | null;
  confidence: number;
};

export type PairFriendshipIdentity = {
  pairTitle: string;
  lineAtoB: string;
  lineBtoA: string;
  pairSynthesisDescription: string;
  confidence: number;
};

/* ------------------- 1. Closed Capability Ordinal Scorer ------------------- */

function evaluateCapabilities(
  chart: ChartContext,
  tenGods: TenGodCounts,
  psych: PsychMasterJson | null | undefined,
): Record<CanonicalFriendCapabilityKey, OrdinalCapabilityLevel> {
  const seal = (tenGods["정인"] ?? 0) + (tenGods["편인"] ?? 0);
  const food = tenGods["식신"] ?? 0;
  const hurt = tenGods["상관"] ?? 0;
  const officer = (tenGods["정관"] ?? 0) + (tenGods["편관"] ?? 0);
  const wealth = (tenGods["정재"] ?? 0) + (tenGods["편재"] ?? 0);
  const self = (tenGods["비견"] ?? 0) + (tenGods["겁재"] ?? 0);

  const empathy = psych?.secondary_axes?.empathy ?? 50;
  const thinking = psych?.secondary_axes?.thinking_style ?? 50;
  const practical = psych?.secondary_axes?.practicality ?? 50;
  const stimulation = psych?.secondary_axes?.stimulation ?? 50;
  const structure = psych?.secondary_axes?.structure ?? 50;

  const dm = chart.dayStemCode as DayMasterStemCode;

  // 1. emotional_holding
  const emotionalSaju = seal >= 2 || food >= 2 || dm === "jeong" || dm === "gye" || dm === "gi" || dm === "eul";
  const emotionalPsych = empathy >= 60;
  const emotional_holding: OrdinalCapabilityLevel =
    emotionalSaju && emotionalPsych ? "STRONG" : emotionalSaju || emotionalPsych ? "MODERATE" : "WEAK";

  // 2. strategic_direction
  const strategicSaju = officer >= 2 || seal >= 2 || dm === "sin" || dm === "gyeong" || dm === "jeong" || dm === "im";
  const strategicPsych = thinking >= 60;
  const strategic_direction: OrdinalCapabilityLevel =
    strategicSaju && strategicPsych ? "STRONG" : strategicSaju || strategicPsych ? "MODERATE" : "WEAK";

  // 3. action_activation
  const actionSaju = wealth >= 2 || hurt >= 2 || dm === "byeong" || dm === "gap" || dm === "gyeong";
  const actionPsych = practical >= 60 || stimulation >= 60;
  const action_activation: OrdinalCapabilityLevel =
    actionSaju && actionPsych ? "STRONG" : actionSaju || actionPsych ? "MODERATE" : "WEAK";

  // 4. structure_boundaries
  const structureSaju = self >= 2 || officer >= 2 || dm === "mu" || dm === "gyeong" || dm === "gap";
  const structurePsych = structure >= 60;
  const structure_boundaries: OrdinalCapabilityLevel =
    structureSaju && structurePsych ? "STRONG" : structureSaju || structurePsych ? "MODERATE" : "WEAK";

  // 5. social_harmony
  const harmonySaju = (food >= 1 && seal >= 1) || dm === "gi" || dm === "eul" || dm === "mu";
  const harmonyPsych = empathy >= 50 && thinking >= 40 && thinking <= 65;
  const social_harmony: OrdinalCapabilityLevel =
    harmonySaju && harmonyPsych ? "STRONG" : harmonySaju || harmonyPsych ? "MODERATE" : "WEAK";

  // 6. perspective_expansion
  const perspectiveSaju = dm === "im" || dm === "gye" || chart.stemCodes.has("im") || chart.stemCodes.has("gye");
  const perspectivePsych = thinking >= 60 && empathy >= 50;
  const perspective_expansion: OrdinalCapabilityLevel =
    perspectiveSaju && perspectivePsych ? "STRONG" : perspectiveSaju || perspectivePsych ? "MODERATE" : "WEAK";

  return {
    emotional_holding,
    strategic_direction,
    action_activation,
    structure_boundaries,
    social_harmony,
    perspective_expansion,
  };
}

/* ------------------- 2. Expression Variant Selector ------------------- */

type CharacterVariantSpec = {
  key: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  emoji: string;
  primaryCap: CanonicalFriendCapabilityKey;
  secondaryCap: CanonicalFriendCapabilityKey;
};

const DAY_MASTER_VARIANTS: Record<DayMasterStemCode, CharacterVariantSpec[]> = {
  gap: [
    {
      key: "gap_shelter",
      titleKo: "든든한 그늘이 되어주는 대나무숲 수호목",
      titleEn: "Steadfast Oak Guardian",
      descKo: "친구의 감정과 자존감을 변함없이 받쳐주며 넓은 그늘이 되어주는 버팀목입니다.",
      descEn: "Provides an unwavering emotional shelter and steady support when friends need a grounding anchor.",
      emoji: "🌳",
      primaryCap: "emotional_holding",
      secondaryCap: "structure_boundaries",
    },
    {
      key: "gap_leader",
      titleKo: "방향을 바로잡고 이끄는 우정 캡틴",
      titleEn: "Decisive Friendship Captain",
      descKo: "어려운 상황에서 중심을 잡고 명확한 길을 제시하며 팀의 중심을 잡아줍니다.",
      descEn: "Takes charge in challenging moments, setting clear direction and empowering friends.",
      emoji: "🚩",
      primaryCap: "strategic_direction",
      secondaryCap: "action_activation",
    },
    {
      key: "gap_ally",
      titleKo: "어떤 시련도 함께 견디는 든든한 의리파 동반자",
      titleEn: "Unshakable Loyal Ally",
      descKo: "한번 맺은 인연을 깊이 아끼며 불의나 위험 앞에서도 친구 편을 지켜주는 의리파입니다.",
      descEn: "Stands firmly by friends through thick and thin with deep, uncompromising loyalty.",
      emoji: "🛡️",
      primaryCap: "structure_boundaries",
      secondaryCap: "social_harmony",
    },
  ],
  eul: [
    {
      key: "eul_mediator",
      titleKo: "모임을 부드럽게 잇는 힐링 유연자",
      titleEn: "Harmonious Gentle Mediator",
      descKo: "사람과 사람 사이의 긴장을 완화하고 누구와도 자연스럽게 어울리는 친화력을 지녔습니다.",
      descEn: "Softens group friction and weaves friends together with effortless, warm adaptability.",
      emoji: "🌿",
      primaryCap: "social_harmony",
      secondaryCap: "emotional_holding",
    },
    {
      key: "eul_healer",
      titleKo: "마음을 섬세하게 다독이는 공감 힐러",
      titleEn: "Intuitive Empathetic Healer",
      descKo: "상대의 작은 기분 변화도 섬세하게 감지하여 따뜻하게 감싸주는 마음의 휴식처입니다.",
      descEn: "Senses subtle emotional shifts and offers gentle, comforting listening without judgment.",
      emoji: "🌸",
      primaryCap: "emotional_holding",
      secondaryCap: "perspective_expansion",
    },
    {
      key: "eul_helper",
      titleKo: "실속 있게 챙겨주는 유연한 현실 조력자",
      titleEn: "Resourceful Practical Helper",
      descKo: "부담스럽지 않게 세심한 팁과 도움을 전하며 일상의 편안함을 돌봐줍니다.",
      descEn: "Offers practical help and subtle care in daily life without creating pressure.",
      emoji: "💡",
      primaryCap: "action_activation",
      secondaryCap: "social_harmony",
    },
  ],
  byeong: [
    {
      key: "byeong_spotlight",
      titleKo: "분위기를 사로잡는 열정 에너지 스포트라이트",
      titleEn: "High-Energy Social Spotlight",
      descKo: "모임 전체에 밝은 활력을 불어넣고 모두의 기분을 함께 끌어올리는 에너자이저입니다.",
      descEn: "Radiates contagious energy and brings warmth and excitement into any group setting.",
      emoji: "☀️",
      primaryCap: "action_activation",
      secondaryCap: "social_harmony",
    },
    {
      key: "byeong_mentor",
      titleKo: "긍정의 힘으로 동기를 부여하는 열정 멘토",
      titleEn: "Inspiring Motivational Mentor",
      descKo: "친구의 가능성을 믿고 머뭇거리는 순간에 확실한 자신감과 용기를 불어넣어 줍니다.",
      descEn: "Instills genuine confidence and encourages friends to step boldly toward their goals.",
      emoji: "🔥",
      primaryCap: "strategic_direction",
      secondaryCap: "action_activation",
    },
    {
      key: "byeong_ally",
      titleKo: "솔직하고 화끈하게 친구 편을 들어주는 의리파",
      titleEn: "Transparent Passionate Ally",
      descKo: "뒤끝 없이 투명하고 뒤에서 욕하지 않으며, 억울한 일에는 솔직하게 함께 분노해 주는 우군입니다.",
      descEn: "Transparent and generous, standing up openly for friends without hesitation.",
      emoji: "🛡️",
      primaryCap: "structure_boundaries",
      secondaryCap: "emotional_holding",
    },
  ],
  jeong: [
    {
      key: "jeong_counselor",
      titleKo: "차분하게 길을 밝혀주는 온기 있는 촛불 조언자",
      titleEn: "Warm Torch Strategic Counselor",
      descKo: "복잡하고 어두운 순간에 집중된 온기와 명확한 시각으로 조용히 길을 밝혀주는 상담가입니다.",
      descEn: "Provides focused warmth and clear-eyed strategic perspective when friends feel lost.",
      emoji: "💡",
      primaryCap: "strategic_direction",
      secondaryCap: "emotional_holding",
    },
    {
      key: "jeong_haven",
      titleKo: "온기 있는 1:1 감성 쉼터",
      titleEn: "Cozy 1-on-1 Emotional Confidant",
      descKo: "단둘이 만날 때 가장 깊은 진심이 통하며, 밤새 이야기를 나누어도 편안한 안식처입니다.",
      descEn: "Thrives in intimate 1-on-1 conversations, creating a judgment-free sanctuary.",
      emoji: "🕯️",
      primaryCap: "emotional_holding",
      secondaryCap: "perspective_expansion",
    },
    {
      key: "jeong_companion",
      titleKo: "재치와 위트로 마음을 녹이는 따뜻한 수다러",
      titleEn: "Witty Warm Emotional Companion",
      descKo: "적재적소의 드립과 리액션으로 상대의 긴장을 풀어주고 마음을 환하게 만들어 줍니다.",
      descEn: "Melt stress away with timely humor, warm reactions, and attentive conversation.",
      emoji: "💥",
      primaryCap: "action_activation",
      secondaryCap: "social_harmony",
    },
  ],
  mu: [
    {
      key: "mu_parsu",
      titleKo: "어떤 비밀도 든든하게 지켜주는 태산 파수꾼",
      titleEn: "Unshakable Mountain Secret Keeper",
      descKo: "무겁고 묵직한 신뢰감으로 어떤 속마음도 유출 없이 안심하고 털어놓을 수 있는 태산입니다.",
      descEn: "Offers rock-solid emotional stability and keeps trusted confidences with absolute integrity.",
      emoji: "⛰️",
      primaryCap: "structure_boundaries",
      secondaryCap: "emotional_holding",
    },
    {
      key: "mu_foundation",
      titleKo: "묵직하게 뒤를 받쳐주는 현실 주춧돌",
      titleEn: "Solid Grounding Foundation",
      descKo: "감정 기복 없이 꾸준한 자리에서 친구가 흔들릴 때 든든한 현실적 기반이 되어줍니다.",
      descEn: "Serves as a calm, low-drama anchor that stabilizes friends during chaotic moments.",
      emoji: "🏗️",
      primaryCap: "strategic_direction",
      secondaryCap: "structure_boundaries",
    },
    {
      key: "mu_peer",
      titleKo: "한결같은 거리감으로 편안함을 주는 동반자",
      titleEn: "Long-Term Peer Anchor",
      descKo: "오래 만나지 않아도 어제 만난 것처럼 편안하며, 서로의 영역을 완벽히 존중하는 관계입니다.",
      descEn: "Preserves high-trust, comfortable distance where silence is as easy as conversation.",
      emoji: "🛡️",
      primaryCap: "social_harmony",
      secondaryCap: "structure_boundaries",
    },
  ],
  gi: [
    {
      key: "gi_azit",
      titleKo: "소소한 감동을 챙기는 따뜻한 아지트 수호자",
      titleEn: "Attentive Nurturing Caretaker",
      descKo: "상대의 소소한 취향과 컨디션을 세심하게 기억하여 섬세한 감동을 주는 아늑한 쉼터입니다.",
      descEn: "Remembers small personal tastes and comforts friends with quiet, thoughtful hospitality.",
      emoji: "🌾",
      primaryCap: "social_harmony",
      secondaryCap: "emotional_holding",
    },
    {
      key: "gi_helper",
      titleKo: "섬세하게 일상을 보듬어주는 생활 속 조력자",
      titleEn: "Practical Home-Base Helper",
      descKo: "필요할 때 말없이 실용적인 도움을 챙겨주며 마음의 부담을 가볍게 덜어줍니다.",
      descEn: "Quietly handles practical details and provides grounded, caring support.",
      emoji: "🍱",
      primaryCap: "action_activation",
      secondaryCap: "social_harmony",
    },
    {
      key: "gi_haven",
      titleKo: "편안하고 단정한 조용한 쉼터",
      titleEn: "Quiet Comfort Sanctuary",
      descKo: "자극적이지 않은 온기로 묵묵히 들어주며 편안한 자리를 만들어 주는 친구입니다.",
      descEn: "Creates a low-stimulus, reassuring environment where friends can decompress.",
      emoji: "☕",
      primaryCap: "emotional_holding",
      secondaryCap: "perspective_expansion",
    },
  ],
  gyeong: [
    {
      key: "gyeong_shield",
      titleKo: "불의를 보면 못 참는 친구의 든든한 호위무사",
      titleEn: "Protective Shield Against Threats",
      descKo: "친구가 억울하거나 부당한 일을 당했을 때 앞장서서 울타리가 되어주는 강력한 방패입니다.",
      descEn: "Stands up fiercely for friends and guards them against unfair external pressure.",
      emoji: "⚔️",
      primaryCap: "structure_boundaries",
      secondaryCap: "action_activation",
    },
    {
      key: "gyeong_resolver",
      titleKo: "의리로 똘똘 뭉친 직설적인 현실 해결사",
      titleEn: "Tough No-Nonsense Problem Resolver",
      descKo: "복잡한 문제 앞에서 돌려 말하지 않고 명쾌한 해법을 도출해 내는 화끈한 문제 해결사입니다.",
      descEn: "Cuts through hesitation with direct honesty and takes decisive action to solve problems.",
      emoji: "🛡️",
      primaryCap: "strategic_direction",
      secondaryCap: "structure_boundaries",
    },
    {
      key: "gyeong_realist",
      titleKo: "객관적 시각으로 팩트를 짚어주는 리얼리스트",
      titleEn: "Objective Reality-Check Mentor",
      descKo: "감정에 휘둘려 잘못된 선택을 하지 않도록 냉철하지만 진심 어린 팩트를 짚어줍니다.",
      descEn: "Delivers clear, objective reality checks to prevent friends from making rash mistakes.",
      emoji: "⚖️",
      primaryCap: "perspective_expansion",
      secondaryCap: "strategic_direction",
    },
  ],
  sin: [
    {
      key: "sin_advisor",
      titleKo: "핵심을 꿰뚫어 보는 섬세한 팩트 조언자",
      titleEn: "Refined Precision Truth-Teller",
      descKo: "남들이 보지 못하는 문제의 핵심을 정교하게 짚어내며 고품격 해결책을 제안합니다.",
      descEn: "Pinpoints exact logical flaws and offers sophisticated, highly accurate advice.",
      emoji: "💎",
      primaryCap: "strategic_direction",
      secondaryCap: "perspective_expansion",
    },
    {
      key: "sin_curator",
      titleKo: "감각적인 취향과 감성을 공유하는 큐레이터",
      titleEn: "High-Taste Aesthetic Companion",
      descKo: "음악·공간·스타일 등 뛰어난 안목으로 친구의 감각적 유대를 풍요롭게 만들어 줍니다.",
      descEn: "Shares refined taste, culture, and high standards, enriching mutual experiences.",
      emoji: "✨",
      primaryCap: "perspective_expansion",
      secondaryCap: "social_harmony",
    },
    {
      key: "sin_confidant",
      titleKo: "깊이 있는 대화만 나누는 프리미엄 조언자",
      titleEn: "Selective Deep Confidant",
      descKo: "영혼 없는 가벼운 대화보다 가치관과 철학이 담긴 밀도 높은 대화를 선호하는 조언가입니다.",
      descEn: "Prefers high-depth, meaningful dialogue and respects mutual intellectual boundaries.",
      emoji: "🗝️",
      primaryCap: "structure_boundaries",
      secondaryCap: "emotional_holding",
    },
  ],
  im: [
    {
      key: "im_navigator",
      titleKo: "막힌 속을 시원하게 뚫어주는 대해양 길잡이",
      titleEn: "Big-Picture Macro Navigator",
      descKo: "답답한 고민을 거시적인 관점에서 시원하게 트여주고 새로운 판을 제시해 주는 전략가입니다.",
      descEn: "Expands horizons with macro perspective, helping friends see beyond immediate friction.",
      emoji: "🌊",
      primaryCap: "perspective_expansion",
      secondaryCap: "strategic_direction",
    },
    {
      key: "im_harbor",
      titleKo: "편견 없이 모든 이야기를 품어주는 포용가",
      titleEn: "Unconditional Non-Judgmental Harbor",
      descKo: "어떤 특별한 이야기나 실수도 선입견 없이 들어주며 마음에 거대한 공간을 비워줍니다.",
      descEn: "Accepts diverse views without prejudice, providing a broad emotional harbor.",
      emoji: "🌌",
      primaryCap: "emotional_holding",
      secondaryCap: "social_harmony",
    },
    {
      key: "im_explorer",
      titleKo: "거침없이 새로운 즐거움을 찾아 나서는 탐험가",
      titleEn: "Adventurous Freedom Companion",
      descKo: "틀에 갇히지 않고 새로운 도전과 힙한 경험으로 우정의 에너지를 환기시켜 줍니다.",
      descEn: "Brings unconstrained enthusiasm and adventure into the friendship dynamic.",
      emoji: "⛵",
      primaryCap: "action_activation",
      secondaryCap: "perspective_expansion",
    },
  ],
  gye: [
    {
      key: "gye_listener",
      titleKo: "말없이 마음을 다독이는 감성 샘물 리스너",
      titleEn: "Intuitive Gentle Soul Listener",
      descKo: "말하지 않아도 상대의 그늘을 직관적으로 감지하여 조용히 곁을 지켜주는 샘물입니다.",
      descEn: "Senses unspoken sadness intuitively and offers quiet, deep emotional healing.",
      emoji: "🌧️",
      primaryCap: "emotional_holding",
      secondaryCap: "social_harmony",
    },
    {
      key: "gye_observer",
      titleKo: "상대의 속마음을 조용히 읽어내는 혜안가",
      titleEn: "Quiet Psychological Observer",
      descKo: "요란하지 않게 상대의 상황과 니즈를 조용히 꿰뚫어 보고 꼭 필요한 타임에 도움을 줍니다.",
      descEn: "Reads subtle psychological cues quietly and provides perfectly timed support.",
      emoji: "🔮",
      primaryCap: "perspective_expansion",
      secondaryCap: "strategic_direction",
    },
    {
      key: "gye_soother",
      titleKo: "잔잔한 여운을 남기는 은은한 힐링 친구",
      titleEn: "Low-Key Soothing Companion",
      descKo: "부담 없는 연락과 잔잔한 템포로 오래도록 변함없는 안정감을 전해주는 조력자입니다.",
      descEn: "Provides low-pressure, long-term reassurance through a serene interaction pace.",
      emoji: "💧",
      primaryCap: "social_harmony",
      secondaryCap: "emotional_holding",
    },
  ],
};

const CAPABILITY_SITUATION_MAP: Record<
  Locale,
  Record<CanonicalFriendCapabilityKey, { situationLabel: string; shortDescription: string }>
> = {
  "ko-KR": {
    strategic_direction: {
      situationLabel: "친구가 고민에 빠졌을 때",
      shortDescription: "감정에 휘둘리지 않고 문제의 핵심과 해결책을 찾아주는 사람",
    },
    action_activation: {
      situationLabel: "친구가 머뭇거릴 때",
      shortDescription: "막연한 생각과 망설임을 확신으로 바꿔 바로 실행하게 돕는 사람",
    },
    emotional_holding: {
      situationLabel: "친구가 힘들어할 때",
      shortDescription: "평가나 조언보다 먼저 마음을 온전히 들어주고 보듬어주는 사람",
    },
    structure_boundaries: {
      situationLabel: "친구가 흔들릴 때",
      shortDescription: "무너지지 않는 기준과 단단한 신뢰로 곁을 지켜주는 사람",
    },
    social_harmony: {
      situationLabel: "분위기가 어색해질 때",
      shortDescription: "모임의 긴장을 부드럽게 완화하고 관계의 온도를 맞추는 사람",
    },
    perspective_expansion: {
      situationLabel: "생각이 막혀 있을 때",
      shortDescription: "넓은 시야와 새로운 관점을 열어주어 막힌 속을 트여주는 사람",
    },
  },
  "en-US": {
    strategic_direction: {
      situationLabel: "When a friend feels lost",
      shortDescription: "Cuts through emotional clutter to provide clear logical direction",
    },
    action_activation: {
      situationLabel: "When a friend hesitates",
      shortDescription: "Turns doubts and hesitation into decisive momentum",
    },
    emotional_holding: {
      situationLabel: "When a friend is struggling",
      shortDescription: "Provides an unconditional, safe space to listen before judging",
    },
    structure_boundaries: {
      situationLabel: "When a friend feels unstable",
      shortDescription: "Guards mutual trust and boundaries with rock-solid consistency",
    },
    social_harmony: {
      situationLabel: "When group tension arises",
      shortDescription: "Softens awkwardness effortlessly and harmonizes relationship vibes",
    },
    perspective_expansion: {
      situationLabel: "When a friend gets stuck",
      shortDescription: "Expands macro perspective and opens up fresh possibilities",
    },
  },
};

export function deriveSituationSnapshots(
  ordinalCaps: Record<CanonicalFriendCapabilityKey, OrdinalCapabilityLevel>,
  locale: Locale,
): FriendSituationSnapshot[] {
  const map = CAPABILITY_SITUATION_MAP[locale] ?? CAPABILITY_SITUATION_MAP["ko-KR"];
  const list: FriendSituationSnapshot[] = [];

  const keys: CanonicalFriendCapabilityKey[] = [
    "strategic_direction",
    "action_activation",
    "emotional_holding",
    "structure_boundaries",
    "social_harmony",
    "perspective_expansion",
  ];

  // Pick STRONG first
  for (const k of keys) {
    if (ordinalCaps[k] === "STRONG") {
      list.push({
        capability: k,
        situationLabel: map[k].situationLabel,
        shortDescription: map[k].shortDescription,
        strength: "STRONG",
      });
    }
  }

  // Then MODERATE if count < 4
  if (list.length < 4) {
    for (const k of keys) {
      if (ordinalCaps[k] === "MODERATE" && !list.some((item) => item.capability === k)) {
        list.push({
          capability: k,
          situationLabel: map[k].situationLabel,
          shortDescription: map[k].shortDescription,
          strength: "MODERATE",
        });
        if (list.length >= 4) break;
      }
    }
  }

  return list.slice(0, 4);
}

export function deriveFourSlotFriendProfile(params: {
  chart: ChartContext;
  tenGods: TenGodCounts;
  psych: PsychMasterJson | null | undefined;
  ordinalCaps: Record<CanonicalFriendCapabilityKey, OrdinalCapabilityLevel>;
  locale: Locale;
}): FourSlotFriendProfile {
  const isKo = params.locale !== "en-US";
  const seal = (params.tenGods["정인"] ?? 0) + (params.tenGods["편인"] ?? 0);
  const officer = (params.tenGods["정관"] ?? 0) + (params.tenGods["편관"] ?? 0);
  const food = params.tenGods["식신"] ?? 0;
  const hurt = params.tenGods["상관"] ?? 0;
  const thinking = params.psych?.secondary_axes?.thinking_style ?? 50;
  const empathy = params.psych?.secondary_axes?.empathy ?? 50;

  const rawDm = params.chart.dayStemCode;
  const isFire = rawDm === "byeong" || rawDm === "jeong";
  const isWood = rawDm === "gap" || rawDm === "eul";
  const isEarth = rawDm === "mu" || rawDm === "gi";
  const isMetal = rawDm === "gyeong" || rawDm === "sin";
  const isWater = rawDm === "im" || rawDm === "gye";

  // 1. Slot 1: 친구들 사이에서는 (Group Social Expression)
  let groupSlot: FriendBehaviorSlot;
  if (params.ordinalCaps.action_activation === "STRONG" || food + hurt >= 2 || isFire) {
    groupSlot = {
      slot: "group",
      label: isKo ? "분위기를 살리고 사람을 움직이는 쪽" : "Brings energy & moves the group",
      description: isKo
        ? "편해지면 먼저 말을 꺼내고, 모임이 처질 때 다시 활기를 만드는 편이에요."
        : "Takes initiative in comfortable settings and lifts the mood when group energy drops.",
      claimFamily: "SOCIAL_ENERGIZER",
      confidence: "HIGH",
    };
  } else if (params.ordinalCaps.social_harmony === "STRONG" || empathy >= 60 || isWood) {
    groupSlot = {
      slot: "group",
      label: isKo ? "사람 사이를 편하게 이어주는 쪽" : "Eases tension & connects people",
      description: isKo
        ? "누가 겉돌거나 분위기가 어색해지면 자연스럽게 사이를 풀어주는 편이에요."
        : "Naturally smooths over awkwardness and makes sure no one feels left out.",
      claimFamily: "SOCIAL_MEDIATOR",
      confidence: "HIGH",
    };
  } else if (params.ordinalCaps.structure_boundaries === "STRONG" || officer >= 2 || isEarth || isMetal) {
    groupSlot = {
      slot: "group",
      label: isKo ? "모임에서 은근한 중심을 잡는 쪽" : "Steadily grounds group plans",
      description: isKo
        ? "도드라지게 나서지 않아도 약속과 흐름을 차분하게 챙기는 편이에요."
        : "Quietly holds group plans and boundaries together without needing the spotlight.",
      claimFamily: "SOCIAL_ANCHOR",
      confidence: "HIGH",
    };
  } else {
    groupSlot = {
      slot: "group",
      label: isKo ? "부담 없이 편안하게 어울리는 쪽" : "Comfortably blends into groups",
      description: isKo
        ? "모임의 조화를 중요하게 생각하며 상대의 페이스를 맞춰주는 편이에요."
        : "Adapts comfortably to group rhythms without imposing pressure.",
      claimFamily: "SOCIAL_MEDIATOR",
      confidence: "MEDIUM",
    };
  }

  // 2. Slot 2: 둘이 있을 때는 (One-on-One Private Relational Expression)
  let oneOnOneSlot: FriendBehaviorSlot;
  if (params.ordinalCaps.strategic_direction === "STRONG" || thinking >= 60 || isMetal) {
    oneOnOneSlot = {
      slot: "one_on_one",
      label: isKo ? "진지한 고민을 같이 정리해주는 친구" : "Helps untangle thoughts 1-on-1",
      description: isKo
        ? "단둘이 있을 때는 가벼운 분위기보다 속얘기를 듣고 생각을 같이 정리하는 모습이 강해져요."
        : "Shifts into a focused sounding board, helping sort through complex thoughts in private.",
      claimFamily: "PRIVATE_ANALYST",
      confidence: "HIGH",
    };
  } else if (params.ordinalCaps.emotional_holding === "STRONG" || empathy >= 60 || isWood) {
    oneOnOneSlot = {
      slot: "one_on_one",
      label: isKo ? "속마음을 편하게 꺼내게 하는 친구" : "Makes deep venting safe & easy",
      description: isKo
        ? "가까운 사람과 있을수록 결론부터 내리기보다 이야기를 편하게 꺼낼 수 있게 해줘요."
        : "Creates a safe, patient space for intimate sharing without rushing to judgment.",
      claimFamily: "PRIVATE_LISTENER",
      confidence: "HIGH",
    };
  } else if (isFire) {
    oneOnOneSlot = {
      slot: "one_on_one",
      label: isKo ? "솔직한 생각과 솔깃한 재미를 나누는 친구" : "Enjoys lively, candid 1-on-1 chats",
      description: isKo
        ? "단둘이 있을 때 가식 없이 솔직한 생각과 즐거운 화제를 시원하게 주고받아요."
        : "Brings candid, lively communication to 1-on-1 hangouts.",
      claimFamily: "PRIVATE_ANALYST",
      confidence: "MEDIUM",
    };
  } else if (isWater) {
    oneOnOneSlot = {
      slot: "one_on_one",
      label: isKo ? "깊이 있는 대화가 자연스럽게 통하는 친구" : "Enjoys deep & insightful 1-on-1 talks",
      description: isKo
        ? "겉치레 대화보다 깊은 속마음과 시야를 선입견 없이 편안하게 주고받아요."
        : "Connects comfortably through meaningful, non-superficial 1-on-1 dialogue.",
      claimFamily: "PRIVATE_LISTENER",
      confidence: "MEDIUM",
    };
  } else {
    // Earth (戊/己)
    oneOnOneSlot = {
      slot: "one_on_one",
      label: isKo ? "특별한 계획 없이도 편안하게 머무는 친구" : "Enjoys relaxed, low-pressure 1-on-1 time",
      description: isKo
        ? "침묵이나 소소한 일상 속에서도 억지로 분위기를 띄우지 않고 든든하게 안심을 줘요."
        : "Brings calm, grounded presence that feels effortless even without big plans.",
      claimFamily: "PRIVATE_COMPANION",
      confidence: "MEDIUM",
    };
  }

  // 3. Slot 3: 친구가 힘들 때는 (Support Mode) — Apply Semantic Deduplication Guard
  let supportSlot: FriendBehaviorSlot;
  if (
    params.ordinalCaps.emotional_holding === "STRONG" &&
    oneOnOneSlot.claimFamily !== "PRIVATE_LISTENER"
  ) {
    supportSlot = {
      slot: "support",
      label: isKo ? "일단 마음부터 받아주는 친구" : "Listens & accepts feelings first",
      description: isKo
        ? "해결책을 서두르기보다 먼저 속상한 마음을 충분히 들어주는 편이에요."
        : "Validates emotional distress before jumping into practical solutions.",
      claimFamily: "SUPPORT_EMPATHIC",
      confidence: "HIGH",
    };
  } else if (
    params.ordinalCaps.strategic_direction === "STRONG" ||
    (officer >= 2 && oneOnOneSlot.claimFamily !== "PRIVATE_ANALYST") ||
    isMetal
  ) {
    supportSlot = {
      slot: "support",
      label: isKo ? "마음을 듣고 나서 길을 같이 찾는 친구" : "Finds practical next steps together",
      description: isKo
        ? "충분히 들어준 뒤 무엇을 하면 좋을지 현실적으로 함께 정리해줘요."
        : "Listens carefully, then helps identify clear practical steps forward.",
      claimFamily: "SUPPORT_PRACTICAL",
      confidence: "HIGH",
    };
  } else if (params.ordinalCaps.action_activation === "STRONG" || isFire) {
    supportSlot = {
      slot: "support",
      label: isKo ? "생각을 바로 행동으로 밀어주는 친구" : "Spurs decisive action when stuck",
      description: isKo
        ? "망설이거나 주저앉아 있을 때 고민을 확신으로 바꿔 다시 움직이게 도와줘요."
        : "Encourages friends to turn doubts into concrete action when feeling stuck.",
      claimFamily: "SUPPORT_ACTION",
      confidence: "HIGH",
    };
  } else if (isWood) {
    supportSlot = {
      slot: "support",
      label: isKo ? "속상한 마음에 깊게 공감하는 친구" : "Offers deep emotional empathy",
      description: isKo
        ? "판단하거나 조급하게 해결하려 하지 않고 상대의 감정을 충분히 보듬어줘요."
        : "Offers deep emotional validation without rushing to judge or fix.",
      claimFamily: "SUPPORT_EMPATHIC",
      confidence: "HIGH",
    };
  } else if (isWater) {
    supportSlot = {
      slot: "support",
      label: isKo ? "시야를 넓혀 부담을 덜어주는 친구" : "Broadens perspective to relieve pressure",
      description: isKo
        ? "상황을 너무 무겁게 받아들이지 않도록 차분하게 시야를 넓혀주어 마음을 다잡게 도와줘요."
        : "Helps reframe difficult situations calmly to reduce emotional weight.",
      claimFamily: "SUPPORT_EMPATHIC",
      confidence: "MEDIUM",
    };
  } else {
    // Earth (戊/己)
    supportSlot = {
      slot: "support",
      label: isKo ? "말보다 든든하게 곁을 지키는 친구" : "Steadily stands by your side",
      description: isKo
        ? "화려하게 위로하기보다 쉽게 흔들리지 않고 옆에 있어주는 방식으로 단단한 힘이 돼요."
        : "Offers steady, unwavering presence rather than loud or dramatic words.",
      claimFamily: "SUPPORT_STABLE",
      confidence: "HIGH",
    };
  }

  // Deduplication safety check between Slot 2 & Slot 3:
  if (
    oneOnOneSlot.claimFamily === "PRIVATE_ANALYST" &&
    supportSlot.claimFamily === "SUPPORT_PRACTICAL"
  ) {
    supportSlot = {
      slot: "support",
      label: isKo ? "생각을 바로 행동으로 밀어주는 친구" : "Spurs decisive action when stuck",
      description: isKo
        ? "망설이거나 주저앉아 있을 때 고민을 확신으로 바꿔 다시 움직이게 도와줘요."
        : "Encourages friends to turn doubts into concrete action when feeling stuck.",
      claimFamily: "SUPPORT_ACTION",
      confidence: "HIGH",
    };
  } else if (
    oneOnOneSlot.claimFamily === "PRIVATE_LISTENER" &&
    supportSlot.claimFamily === "SUPPORT_EMPATHIC"
  ) {
    supportSlot = {
      slot: "support",
      label: isKo ? "말보다 꾸준히 곁을 지키는 친구" : "Steadily stands by your side",
      description: isKo
        ? "화려하게 위로하기보다 쉽게 흔들리지 않고 옆에 있어주는 방식으로 힘이 돼요."
        : "Offers steady, unwavering presence rather than loud or dramatic words.",
      claimFamily: "SUPPORT_STABLE",
      confidence: "HIGH",
    };
  }

  return {
    groupSlot,
    oneOnOneSlot,
    supportSlot,
  };
}

/* ------------------- 3. Engine Entrypoints ------------------- */

export function deriveIndividualFriendCharacter(params: {
  chart: ChartContext;
  tenGods: TenGodCounts;
  psych: PsychMasterJson | null | undefined;
  locale: Locale;
}): IndividualFriendCharacter {
  const rawDm = params.chart.dayStemCode as DayMasterStemCode;
  const dm: DayMasterStemCode = DAY_MASTER_VARIANTS[rawDm] ? rawDm : "gap";
  const caps = evaluateCapabilities(params.chart, params.tenGods, params.psych);
  const situationSnapshots = deriveSituationSnapshots(caps, params.locale);
  const fourSlotProfile = deriveFourSlotFriendProfile({
    chart: params.chart,
    tenGods: params.tenGods,
    psych: params.psych,
    ordinalCaps: caps,
    locale: params.locale,
  });

  const seal = (params.tenGods["정인"] ?? 0) + (params.tenGods["편인"] ?? 0);
  const officer = (params.tenGods["정관"] ?? 0) + (params.tenGods["편관"] ?? 0);
  const food = params.tenGods["식신"] ?? 0;
  const hurt = params.tenGods["상관"] ?? 0;
  const thinking = params.psych?.secondary_axes?.thinking_style ?? 50;

  const variants = DAY_MASTER_VARIANTS[dm]!;
  let selectedVariant = variants[0]!;

  if (officer >= 2 || (seal >= 1 && thinking >= 60)) {
    const strat = variants.find((v) => v.primaryCap === "strategic_direction");
    if (strat) selectedVariant = strat;
  } else if (food >= 2 || hurt >= 2) {
    const act = variants.find((v) => v.primaryCap === "action_activation" || v.primaryCap === "social_harmony");
    if (act) selectedVariant = act;
  }

  const sajuEvidence: string[] = [
    `일간 ${params.chart.dayStemCode.toUpperCase()} (${REF_HEAVENLY_STEMS.find((r) => r.code === dm)?.kor_name ?? dm})`,
    `월지 ${params.chart.monthBranchCode.toUpperCase()}`,
    `십성 분포: 인성(${seal}), 관성(${officer}), 식상(${food + hurt})`,
  ];

  const psychEvidence: string[] = params.psych?.secondary_axes
    ? [
        `공감 ${params.psych.secondary_axes.empathy ?? 50}`,
        `사고 ${params.psych.secondary_axes.thinking_style ?? 50}`,
        `실용 ${params.psych.secondary_axes.practicality ?? 50}`,
      ]
    : ["설문 데이터 미완료 — 사주 기반 추론"];

  const confidence = params.psych?.secondary_axes ? 0.94 : 0.82;

  return {
    dayMaster: dm,
    characterFamily: `DayMaster_${dm.toUpperCase()}`,
    expressionVariant: selectedVariant.key,
    characterTitle: pick(params.locale, selectedVariant.titleEn, selectedVariant.titleKo),
    emoji: selectedVariant.emoji,
    individualExplanation: pick(params.locale, selectedVariant.descEn, selectedVariant.descKo),
    primaryCapability: selectedVariant.primaryCap,
    secondaryCapability: selectedVariant.secondaryCap,
    ordinalCapabilities: caps,
    situationSnapshots,
    fourSlotProfile,
    confidence,
    sajuEvidence,
    psychEvidence,
  };
}

/* ------------------- 4. Layer 2: Directional Role Derivation ------------------- */

function deriveReceiverNeed(
  receiverChart: ChartContext,
  receiverTenGods: TenGodCounts,
  receiverPsych: PsychMasterJson | null | undefined,
  receiverName: string,
  locale: Locale,
): ReceiverNeedNeedProvenance | null {
  const isKo = locale !== "en-US";
  const seal = (receiverTenGods["정인"] ?? 0) + (receiverTenGods["편인"] ?? 0);
  const officer = (receiverTenGods["정관"] ?? 0) + (receiverTenGods["편관"] ?? 0);
  const thinking = receiverPsych?.secondary_axes?.thinking_style;
  const empathy = receiverPsych?.secondary_axes?.empathy;

  if (thinking !== undefined && thinking < 50 && officer < 2) {
    return {
      key: "need_strategic_compass",
      description: isKo
        ? `${receiverName}은(는) 고민에 빠졌을 때 명확한 이성적 방향이 필요합니다.`
        : `${receiverName} seeks clear-eyed strategic perspective when overwhelmed by complex decisions.`,
      sajuEvidence: [`관성 수치(${officer})`],
      psychEvidence: [`사고유형(${thinking})`],
      confidence: 0.9,
    };
  }

  if (empathy !== undefined && empathy > 60) {
    return {
      key: "need_emotional_sanctuary",
      description: isKo
        ? `${receiverName}은(는) 마음을 온전히 털어놓을 수 있는 편안한 쉼터가 필요합니다.`
        : `${receiverName} thrives when given a safe, judgment-free emotional space to vent freely.`,
      sajuEvidence: [`인성 수치(${seal})`],
      psychEvidence: [`공감점수(${empathy})`],
      confidence: 0.9,
    };
  }

  return null;
}

export function deriveDirectionalFriendValue(params: {
  giverName: string;
  receiverName: string;
  giverCharacter: IndividualFriendCharacter;
  receiverChart: ChartContext;
  receiverTenGods: TenGodCounts;
  receiverPsych: PsychMasterJson | null | undefined;
  signals?: FriendScoringSignals;
  locale: Locale;
}): DirectionalFriendValue {
  const isKo = params.locale !== "en-US";
  const need = deriveReceiverNeed(
    params.receiverChart,
    params.receiverTenGods,
    params.receiverPsych,
    params.receiverName,
    params.locale,
  );

  let roleTitle = isKo ? "마음의 휴식을 선물하는 친구" : "Comfortable Gentle Companion";
  let roleDescription = isKo
    ? `${params.giverName}은(는) ${params.receiverName}에게 부드러운 분위기와 부담 없는 조화로 편안한 휴식이 되어줘요.`
    : `${params.giverName} offers comfortable, low-pressure presence to ${params.receiverName}.`;

  if (
    params.giverCharacter.primaryCapability === "strategic_direction" ||
    need?.key === "need_strategic_compass"
  ) {
    roleTitle = isKo ? "현실적인 방향을 잡아주는 친구" : "Clear Reality Grounding Anchor";
    roleDescription = isKo
      ? `${params.giverName}은(는) ${params.receiverName}의 생각이 복잡해질 때 핵심을 정리하고 다음 선택을 찾는 데 힘이 돼요.`
      : `${params.giverName} helps ${params.receiverName} sort through complex thoughts and find objective clarity.`;
  } else if (
    params.giverCharacter.primaryCapability === "emotional_holding" ||
    need?.key === "need_emotional_sanctuary"
  ) {
    roleTitle = isKo ? "힘을 빼도 괜찮게 해주는 친구" : "Safe Space Where You Can Unwind";
    roleDescription = isKo
      ? `${params.giverName}은(는) ${params.receiverName}이(가) 계속 판단하고 방향을 잡지 않아도 편하게 머물 수 있는 안정감을 줘요.`
      : `${params.giverName} provides a relaxing sanctuary where ${params.receiverName} can let their guard down.`;
  } else if (params.giverCharacter.primaryCapability === "action_activation") {
    roleTitle = isKo ? "망설임을 확신으로 바꿔주는 친구" : "Decisive Catalyst for Momentum";
    roleDescription = isKo
      ? `${params.giverName}은(는) ${params.receiverName}의 생각과 계획을 망설임 없이 실제 행동으로 옮기게 이끌어줘요.`
      : `${params.giverName} turns ${params.receiverName}'s doubts and ideas into confident, decisive action.`;
  } else if (
    params.giverCharacter.primaryCapability === "structure_boundaries" ||
    params.giverCharacter.primaryCapability === "social_harmony" ||
    params.giverCharacter.primaryCapability === "perspective_expansion"
  ) {
    // Reuse the already-written per-capability copy (CAPABILITY_SITUATION_MAP) instead of
    // falling through to the generic default — these 3 capabilities previously had no branch here.
    const map = CAPABILITY_SITUATION_MAP[params.locale] ?? CAPABILITY_SITUATION_MAP["ko-KR"];
    const cap = map[params.giverCharacter.primaryCapability];
    roleTitle = isKo ? cap.shortDescription.replace(/사람$/, "친구") : cap.shortDescription;
    roleDescription = isKo
      ? `${params.giverName}은(는) ${params.receiverName}에게 ${cap.shortDescription}이에요.`
      : `${params.giverName} offers ${params.receiverName} exactly this: ${cap.shortDescription}.`;
  }

  const activationSignal = params.signals?.hasDayBranchCombine
    ? (isKo ? "일지 육합/삼합 끌림 반응" : "Day Branch Combine Resonance")
    : params.signals?.hasBijiepMutualResonance
    ? (isKo ? "비겁 공명 신호" : "Peer Resonance Signal")
    : null;

  return {
    giverName: params.giverName,
    receiverName: params.receiverName,
    roleTitle,
    roleDescription,
    giverCapability: params.giverCharacter.primaryCapability,
    receiverNeed: need,
    pairActivationSignal: activationSignal,
    confidence: need ? need.confidence : 0.75,
  };
}

/* ------------------- 5. Layer 3: Pair Friendship Identity ------------------- */

export function derivePairFriendshipIdentity(params: {
  nameA: string;
  nameB: string;
  valAtoB: DirectionalFriendValue;
  valBtoA: DirectionalFriendValue;
  locale: Locale;
}): PairFriendshipIdentity {
  const isKo = params.locale !== "en-US";
  const nameATopic = isKo ? (hasBatchim(params.nameA) ? `${params.nameA}이` : `${params.nameA}가`) : params.nameA;
  const nameBTopic = isKo ? (hasBatchim(params.nameB) ? `${params.nameB}은` : `${params.nameB}는`) : params.nameB;

  // Default: compose from the already-computed, per-direction roleTitles instead of a fixed
  // generic line — the branches below override this with a bespoke line only for a few specific
  // capability combinations; every other combination previously collapsed to the same literal here.
  let title = isKo
    ? `${params.valAtoB.roleTitle} × ${params.valBtoA.roleTitle}`
    : `${params.valAtoB.roleTitle} × ${params.valBtoA.roleTitle}`;

  let pairSynthesisDescription = isKo
    ? `${nameATopic} ${params.nameB}에게 ${params.valAtoB.roleTitle}이(가) 되어주고, ${nameBTopic} ${params.nameA}에게 ${params.valBtoA.roleTitle}이(가) 되어줘요.`
    : `${params.nameA} is ${params.valAtoB.roleTitle} for ${params.nameB}, while ${params.nameB} is ${params.valBtoA.roleTitle} for ${params.nameA}.`;

  if (
    params.valAtoB.giverCapability === "strategic_direction" &&
    params.valBtoA.giverCapability === "social_harmony"
  ) {
    title = isKo
      ? "한 사람은 방향을 잡고, 한 사람은 마음의 여유를 더하는 조합"
      : "Direction & Harmony Complementary Dynamic";
    pairSynthesisDescription = isKo
      ? `${nameATopic} 생각을 정리하고 앞으로 움직일 힘을 보탠다면, ${nameBTopic} 부담을 낮추고 편하게 머물 수 있는 분위기를 만들어줘요.`
      : `${params.nameA} brings clear direction and momentum, while ${params.nameB} relaxes the atmosphere and adds emotional ease.`;
  } else if (
    params.valAtoB.giverCapability === "action_activation" ||
    params.valBtoA.giverCapability === "action_activation"
  ) {
    title = isKo
      ? "서로의 에너지를 끌어올리고 바로 실행하게 만드는 조합"
      : "Mutual Action & High Energy Dynamic";
    pairSynthesisDescription = isKo
      ? `함께 있을 때 망설임이 줄어들고 새로운 재미와 계획을 빠르게 시도하는 시너지가 납니다.`
      : `Hanging out together reduces hesitation and turns vague ideas into exciting plans quickly.`;
  } else if (
    params.valAtoB.giverCapability === "emotional_holding" &&
    params.valBtoA.giverCapability === "emotional_holding"
  ) {
    title = isKo
      ? "어떤 이야기든 편안하게 털어놓을 수 있는 안식처 같은 조합"
      : "Deep Trust & Emotional Sanctuary Dynamic";
    pairSynthesisDescription = isKo
      ? `서로의 상황과 감정을 깊이 이해하며 판단 없이 든든한 쉼터가 되어주는 우정입니다.`
      : `A deeply trusting friendship where both can share anything openly without fear of judgment.`;
  }

  const lineAtoB = `${params.nameA} → ${params.nameB}: ${params.valAtoB.roleTitle}`;
  const lineBtoA = `${params.nameB} → ${params.nameA}: ${params.valBtoA.roleTitle}`;

  return {
    pairTitle: title,
    lineAtoB,
    lineBtoA,
    pairSynthesisDescription,
    confidence: Math.min(params.valAtoB.confidence, params.valBtoA.confidence),
  };
}

function hasBatchim(name: string): boolean {
  if (!name) return false;
  const lastChar = name.charCodeAt(name.length - 1);
  return (lastChar - 0xac00) % 28 > 0;
}
