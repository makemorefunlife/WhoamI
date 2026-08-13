import type { Locale } from "@/lib/i18n/locale";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import { buildFriendReport } from "@/lib/relationship/friend/buildFriendReport";
import { buildFriendRuleContext } from "@/lib/relationship/friend/buildFriendRuleContext";
import { buildFriendPrescriptions } from "@/lib/relationship/friend/buildFriendPrescriptions";
import { buildFriendCanonicalEngine } from "@/lib/relationship/friend/canonical/buildFriendCanonicalEngine";
import { buildFriendStoryPlanEngine } from "@/lib/relationship/friend/storyPlan/buildFriendStoryPlanEngine";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PairFriendshipSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import type { FriendshipSajuSignals } from "@/lib/personCore/sajuSignals/types";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { buildFriendShineInsight } from "./friendShineInsight";
import {
  resolveTravelStyleSplit,
  refineTravelStyleSplit,
  resolveCounselingStyleForPerson,
  resolveJealousyGuardNote,
  resolveReconciliationScript,
  resolveFriendSignatureClause,
  type FriendGuardianCharacterKey,
  type FriendGuardianCharacter,
} from "@/lib/relationship/friend/friendPsychFit";
import { buildFriendAxisRealityInsights } from "./friendAxisRealityInsights";
import { buildFriendScoreCardAudit } from "./friendScoreCardAudit";
import {
  buildElementGeneratesGiftLine,
  buildGrowthDynamicLine,
  buildWhyTurnToFriendLine,
  buildUnlockedSelfLine,
  buildDistanceResilienceLine,
  buildJealousyTriggerSceneLine,
  buildDailyContactRhythmClause,
} from "./friendGiftAndBondInsights";
import {
  buildCapabilityBoundaryClause,
  buildExpectationResetLine,
  buildFriendshipStruggleLine,
} from "./friendExpectationAndStruggle";

/**
 * Derives dynamic directional gift (A→B or B→A) based on 10-god profile, element, and psych axes.
 * Answers Q2 & Q5: "What unique strength/gift does this person bring into the other's life?"
 */
function deriveDirectionalGift(
  giverName: string,
  receiverName: string,
  counts: TenGodCounts,
  dominantElement: string,
  psych: PsychMasterJson | null | undefined,
  locale: Locale,
): FriendGuardianCharacter {
  const isKo = locale !== "en-US";
  const p = profileTenGods(counts);
  const empathy = psych?.secondary_axes?.empathy ?? 50;
  const practicality = psych?.secondary_axes?.practicality ?? 50;
  const thinking = psych?.secondary_axes?.thinking_style ?? 50;
  const structure = psych?.secondary_axes?.structure ?? 50;

  // Evaluate candidate archetypes
  const scores: Array<{
    key: FriendGuardianCharacterKey;
    score: number;
    label: string;
    description: string;
  }> = [
    {
      key: "bamboo",
      score: (p.seal + p.food) * 10 + empathy + (dominantElement === "water" ? 15 : 0),
      label: isKo ? "영혼의 대나무숲 & 무조건적 공감" : "Empathy Sanctuary & Safe Harbor",
      description: isKo
        ? `${giverName}은(는) ${receiverName}에게 세상의 평가와 판단 없이 속마음을 털어놓을 수 있는 감정의 안전지대이자, 지친 마음을 온전히 쉬게 해주는 든든한 쉼터가 되어줍니다.`
        : `${giverName} provides a judgment-free emotional sanctuary for ${receiverName}, offering a steady harbor where they can vent and recover genuine inner peace.`,
    },
    {
      key: "business",
      score: (p.wealth + p.food) * 10 + practicality + (dominantElement === "fire" ? 15 : 0),
      label: isKo ? "실행 추진력 & 현실 에너자이저" : "Execution Momentum & Action Energizer",
      description: isKo
        ? `${giverName}은(는) ${receiverName}의 막연한 아이디어와 고민을 실제 행동으로 이끌어주는 추진 엔진이자, 새로운 기회와 활력을 불어넣는 든든한 페이스메이커입니다.`
        : `${giverName} acts as a catalyst for ${receiverName}, turning vague doubts into decisive action and injecting contagious forward momentum into their life.`,
    },
    {
      key: "brain",
      score: (p.officer + p.seal) * 10 + thinking + (dominantElement === "metal" ? 15 : 0),
      label: isKo ? "현실 나침반 & 명쾌한 전략 멘토" : "Strategic Compass & Reality Grounding",
      description: isKo
        ? `${giverName}은(는) ${receiverName}이(가) 복잡한 문제나 혼란에 빠졌을 때 감정에 휩쓸리지 않고 핵심을 짚어주는 명확한 현실 나침반이자 조언자가 되어줍니다.`
        : `${giverName} serves as a clear-eyed strategic anchor for ${receiverName}, cutting through emotional clutter to provide objective perspective when it matters most.`,
    },
  ];

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0]!;
  return {
    key: best.key,
    label: best.label,
    description: best.description,
  };
}

/**
 * Derives mutual friendship emergence / growth dimension (Q17).
 */
function derivePairEmergence(
  nameA: string,
  nameB: string,
  giftA: FriendGuardianCharacter,
  giftB: FriendGuardianCharacter,
  locale: Locale,
) {
  const isKo = locale !== "en-US";
  return isKo
    ? `[우정의 시너지 & 성장] ${nameA}의 '${giftA.label}'과(와) ${nameB}의 '${giftB.label}'이(가) 맞물려, 혼자일 때보다 더 멀리 내다보고 서로의 자존감을 지켜주며 건강하게 성장하는 상호보완적 우정입니다.`
    : `[Mutual Growth & Synergy] The interplay of ${nameA}'s ${giftA.label} and ${nameB}'s ${giftB.label} creates a safe foundation where both can grow authentically without competitive pressure.`;
}

/**
 * Derives Q19: Group vs 1:1 social energy dynamics and battery replenishment.
 */
function deriveGroupVs1on1Insight(
  nameA: string,
  nameB: string,
  modeA: "outdoor" | "homebody",
  modeB: "outdoor" | "homebody",
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale,
) {
  const isKo = locale !== "en-US";

  if (modeA === "homebody" && modeB === "homebody") {
    return isKo
      ? `단둘이 조용하고 아늑한 아지트나 카페에서 만날 때 에너지가 가장 깊게 충전됩니다. 다수가 모이는 시끄러운 모임에서는 둘 다 배터리가 빠르게 방전될 수 있으니, 둘만의 1:1 만남을 기본값으로 두는 것이 관계를 오래 편안하게 유지해 줍니다.`
      : `You recharge most deeply in cozy, low-stimulus one-on-one settings. Large group hangouts drain your social battery quickly, so keeping private 1:1 time as your default rhythm preserves effortless closeness.`;
  }

  if (modeA === "outdoor" && modeB === "outdoor") {
    return isKo
      ? `단둘이 있을 때도, 여러 친구들과 어울리는 모임에서도 둘 다 에너지를 내는 편이에요. 다만 텐션을 스스로 못 낮추는 편이라, 만나고 난 뒤에 오히려 한꺼번에 기 빨림이 올 수 있어요. 텐션이 오를 때일수록 의식적으로 쉬는 타이밍을 넣어주는 게 관계를 오래 편하게 만들어요.`
      : `High-energy both one-on-one and in large social circles. But since neither of you naturally dials it down, you can both crash hard right after hanging out. Building in quiet downtime while the energy is still high is what keeps this comfortable long-term.`;
  }

  // Asymmetric
  const outdoorName = modeA === "outdoor" ? nameA : nameB;
  const homebodyName = modeA === "outdoor" ? nameB : nameA;

  return isKo
    ? `단둘이 있을 때는 깊고 편안한 대화가 자연스럽게 흐르지만, 다수 모임에서는 ${outdoorName}이(가) 분위기를 주도하며 에너지를 발산하는 반면, ${homebodyName}은(는) 관찰자 모드로 전환되어 쉽게 피로해질 수 있습니다. 단체 모임 중간에 조용한 휴식 공간을 배려하거나 둘만의 1:1 시간을 적절히 섞어주는 것이 피로를 줄이는 핵심입니다.`
    : `One-on-one time creates deep emotional resonance, but in group settings ${outdoorName} naturally takes the floor while ${homebodyName} shifts into observation mode and burns battery faster. Blending 1:1 hangouts with group activities prevents social fatigue.`;
}

/**
 * `buildFriendPrescriptions` (production, `lib/relationship/friend/`) ships a
 * handful of specific numbers (30분/10분/24시간/분기 1회/2주 등) that were never
 * derived from a computed signal — they're flavor text. current_enriched strips
 * them down to non-numeric phrasing without touching the production file or
 * changing which cards fire. Exact-substring replacement (not regex) so this
 * can never accidentally mangle an interpolated name.
 */
const PRESCRIPTION_NUMBER_STRIP: Array<[string, string]> = [
  // ko-KR
  ["30분만 말하기", "짧게 말하기"],
  ["카페 30분·산책만으로", "가벼운 카페·산책만으로"],
  ["긴 만남(2시간+)은 중간 10분", "긴 만남에는 중간에"],
  ["5분 '오늘 좋았던 1가지'만", "'오늘 좋았던 1가지'만 짧게"],
  ["월 1회 '가벼운 만남'만 하는 달 정하기", "가끔 '가벼운 만남'만 하는 날 정하기"],
  ["밤 11시 이후", "늦은 밤"],
  [
    "연락 기대치를 숫자로 합의 — 예: '평일 답장 24시간 이내, 주말은 자유'처럼.",
    "연락 기대치를 서로 합의 — 예: '급한 거 아니면 천천히 답장해도 OK, 주말은 자유'처럼.",
  ],
  ["3주에 한 번 '우리 연락 방식 괜찮아?' 5분 체크", "가끔 '우리 연락 방식 괜찮아?' 짧게 체크"],
  ["분기 1회", "가끔"],
  ["2주 안에", "너무 늦기 전에"],
  ["24시간 타임아웃", "하루 정도 타임아웃"],
  // en-US
  ["in 30 seconds", ""],
  ["a 30-minute coffee", "a quick coffee"],
  ["(2 hours+), take a 10-minute mid-way", ", take a mid-way"],
  ["spend 5 minutes texting", "send a quick text about"],
  ["Once a month, set aside", "Every so often, set aside"],
  ["after 11pm", "late at night"],
  [
    "Agree on contact expectations with actual numbers — e.g., 'reply within 24 hours on weekdays, no pressure on weekends.'",
    "Agree on contact expectations in general terms — e.g., 'no rush unless it's urgent, weekends are free.'",
  ],
  ["Once every three weeks, spend 5 minutes checking", "Every so often, take a moment to check"],
  ["once a quarter", "every so often"],
  ["within two weeks", "before it piles up"],
  ["a 24-hour timeout", "a short timeout"],
  ["one recurring hangout per quarter for", "a recurring hangout every so often for"],
];

function stripUnsupportedFixedNumbers(text: string): string {
  let out = text;
  for (const [find, replace] of PRESCRIPTION_NUMBER_STRIP) {
    out = out.split(find).join(replace);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

/**
 * Builds the enriched Friend report strictly conforming to the 05B Blueprint & Gap Review decisions:
 * - Preserves "우정의 숨겨진 흐름" (section_hidden_flow) and "노는 코드" (section_soulmate)
 * - Restores actionable prescriptions using standard PairPrescriptionSection format:
 *   1. 우정 유지 기본 루틴 (공통)
 *   2. 지금 당장 해볼 것 (Do List & Q21 연락/만남 주도권 불균형 해소)
 *   3. 절대 하지 말 것 (Don't List & Q23 서로에게 내려놓아야 할 기대)
 * - Removes user-facing "우정 주파수 매칭" (psych_match) and "돈 계산" (section_play_money)
 * - Integrates Q2, Q3, Q5, Q17, Q19, Q21, Q23, Q28 into existing sections cleanly
 */
export function buildFriendReportEnriched(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  };
  pairFriendship?: PairFriendshipSignals | null;
  friendSignalsA?: FriendshipSajuSignals;
  friendSignalsB?: FriendshipSajuSignals;
  locale?: Locale;
}): FriendReportBody {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const isKo = locale !== "en-US";
  const nameA = params.nicknameA || "Alex";
  const nameB = params.nicknameB || "Jordan";

  // 1. Build context & base Current report
  const ctx = buildFriendRuleContext({ ...params, locale });
  const base = buildFriendReport(params);

  // 2. Ensure pair friendship signals are present for prescription engine
  const pairFriendship: PairFriendshipSignals = params.pairFriendship ?? {
    johu_gap: {
      heat_gap: 15,
      moisture_gap: 10,
      temperature_mismatch: false,
      band_a: "neutral",
      band_b: "neutral",
    },
    energy_drain_index: 30,
    energy_drain_band: "low",
  };

  // 3. Directional Gifts (Q2, Q5) & Friendship Growth / Emergence (Q17)
  const giftA = deriveDirectionalGift(
    nameA,
    nameB,
    ctx.tenGodsA,
    ctx.friendPairAnalysis.dnaA.dominantElement,
    params.psychMasterA,
    locale,
  );
  const giftB = deriveDirectionalGift(
    nameB,
    nameA,
    ctx.tenGodsB,
    ctx.friendPairAnalysis.dnaB.dominantElement,
    params.psychMasterB,
    locale,
  );
  // Q2/Q5 enhancement — oheng 생(生) direction confirms the ten-god-based
  // directional gift when the two dominant elements line up that way.
  const giftLineExtraA = buildElementGeneratesGiftLine(
    ctx.friendPairAnalysis.dnaB.dominantElement,
    ctx.friendPairAnalysis.dnaA.dominantElement,
    nameB,
    locale,
  );
  const giftLineExtraB = buildElementGeneratesGiftLine(
    ctx.friendPairAnalysis.dnaA.dominantElement,
    ctx.friendPairAnalysis.dnaB.dominantElement,
    nameA,
    locale,
  );

  // Q4 (서로 성장시키는 부분) — 의사결정방식(신중형 vs 즉각형) × 자극추구 대각
  // 비교가 뚜렷하면 그 다이내믹으로, 아니면 기존 일반 emergence 문구로 폴백.
  const emergenceLine = buildGrowthDynamicLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    fallbackLine: derivePairEmergence(nameA, nameB, giftA, giftB, locale),
    locale,
  });

  // 4. Q19 Group vs 1:1 Social Energy Dynamics
  const groupVs1on1A = deriveGroupVs1on1Insight(
    nameA,
    nameB,
    ctx.friendPairAnalysis.dnaA.batteryMode,
    ctx.friendPairAnalysis.dnaB.batteryMode,
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );
  const groupVs1on1B = deriveGroupVs1on1Insight(
    nameB,
    nameA,
    ctx.friendPairAnalysis.dnaB.batteryMode,
    ctx.friendPairAnalysis.dnaA.batteryMode,
    params.psychMasterB,
    params.psychMasterA,
    locale,
  );

  // 5. Q3 Situational Anchor ("어떤 상황에서 이 친구를 찾게 되는가")
  const situationalShineBase = buildFriendShineInsight({
    connectionPct: ctx.masterScores.connection,
    banterPct: ctx.masterScores.banter,
    riskPct: ctx.masterScores.risk,
    hangoutHint: base.friend?.section_play_money?.optimal_hangout,
    locale,
  });
  // Item 3 (같이 있으면 어떤 모습이 살아나는가) — 오행 생(生) 방향 + 자극추구 격차.
  const unlockedSelfLine = buildUnlockedSelfLine({
    nameSelf: nameA,
    nameOther: nameB,
    dominantSelf: ctx.friendPairAnalysis.dnaA.dominantElement,
    dominantOther: ctx.friendPairAnalysis.dnaB.dominantElement,
    stimulationSelf: params.psychMasterA?.secondary_axes.stimulation,
    stimulationOther: params.psychMasterB?.secondary_axes.stimulation,
    locale,
  });
  const situationalShine = unlockedSelfLine
    ? `${situationalShineBase} ${unlockedSelfLine}`
    : situationalShineBase;

  // Relationship Low — shine_when_best의 대칭 짝 ("이 우정이 유독 힘들어지는 순간").
  const shineWhenLow = buildFriendshipStruggleLine({
    sig: ctx.friendPairAnalysis.scoringSignals,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });

  // 6. Signature Headline & Subtitle
  const signatureClause = resolveFriendSignatureClause(
    params.psychMasterA,
    params.psychMasterB,
    locale,
  );
  const enrichedHeadline = isKo
    ? `${nameA} & ${nameB} — 서로의 고유한 리듬을 지켜주는 든든한 동행${signatureClause ? `: ${signatureClause}` : ""}`
    : `${nameA} & ${nameB} — Grounded Companions Honoring Each Other's Rhythm${signatureClause ? `: ${signatureClause}` : ""}`;

  const enrichedSubtitle = isKo
    ? "서로의 다름을 편안하게 인정하며, 억지 노력 없이도 곁에 머물 수 있는 든든한 안식처입니다."
    : "An effortless bond that honors mutual individuality without forced expectations.";

  // 등급(A~D)과 위 3개 지표(케미/티키타카/리스크)가 서로 다른 인상을 줄 수
  // 있어(가중 합산이라 개별 점수가 다 괜찮아도 등급은 낮게 나올 수 있음),
  // 등급 하나만 보지 말고 3개 지표를 직접 참고하라고 명시한다.
  const enrichedGradeReason = isKo
    ? `우정 케미 ${ctx.masterScores.connection}% · 티키타카 ${ctx.masterScores.banter}% · 소셜 리스크 ${ctx.masterScores.risk}% — 등급은 이 세 지표를 가중 합산한 값이라, 등급 한 글자보다는 위 3개 지표를 그대로 참고하는 게 더 정확해요.`
    : `Friend chemistry ${ctx.masterScores.connection}% · Banter ${ctx.masterScores.banter}% · Social risk ${ctx.masterScores.risk}% — the letter grade is a weighted blend of these three, so read the three scores above directly rather than the single grade.`;

  // 7. Hidden Flow (Travel & Counseling) — PRESERVED & ENRICHED
  const travelBase = resolveTravelStyleSplit(
    params.psychMasterA,
    params.psychMasterB,
    nameA,
    nameB,
    locale,
  );
  const travelStyle =
    refineTravelStyleSplit({
      base: travelBase,
      psychA: params.psychMasterA,
      psychB: params.psychMasterB,
      batteryModeA: ctx.friendPairAnalysis.dnaA.batteryMode,
      batteryModeB: ctx.friendPairAnalysis.dnaB.batteryMode,
      tikitakaModeA: ctx.friendPairAnalysis.dnaA.tikitakaMode,
      tikitakaModeB: ctx.friendPairAnalysis.dnaB.tikitakaMode,
      nicknameA: nameA,
      nicknameB: nameB,
      locale,
    }) ?? base.friend?.section_hidden_flow?.travel_style ?? null;

  const counselingBaseA =
    resolveCounselingStyleForPerson(ctx.tenGodsA, params.psychMasterA, locale) ??
    base.friend?.section_hidden_flow?.counseling_style_a ??
    null;
  const counselingBaseB =
    resolveCounselingStyleForPerson(ctx.tenGodsB, params.psychMasterB, locale) ??
    base.friend?.section_hidden_flow?.counseling_style_b ??
    null;

  // Item 5 (힘들 때 왜 이 친구를 찾는가) — counselingBase.type(F/T/balanced)을
  // 그대로 재사용해, "감정 힐러" 라벨인데 "사이다 솔루션" 이유가 붙는 것 같은
  // 불일치를 막는다(라벨과 설명이 서로 다른 축 판정을 쓰면 어긋날 수 있음).
  const whyTurnToALine = counselingBaseA
    ? buildWhyTurnToFriendLine(counselingBaseA.type, params.psychMasterA, nameA, locale)
    : null;
  const whyTurnToBLine = counselingBaseB
    ? buildWhyTurnToFriendLine(counselingBaseB.type, params.psychMasterB, nameB, locale)
    : null;
  // 성장과 기대 Q2 (힘들 때 무엇까지 기대해도 되는가) — capability, not obligation.
  const capabilityBoundaryA = counselingBaseA
    ? buildCapabilityBoundaryClause(counselingBaseA.type, nameA, locale)
    : null;
  const capabilityBoundaryB = counselingBaseB
    ? buildCapabilityBoundaryClause(counselingBaseB.type, nameB, locale)
    : null;
  const counselingA = counselingBaseA
    ? {
        ...counselingBaseA,
        description: [counselingBaseA.description, whyTurnToALine, capabilityBoundaryA]
          .filter(Boolean)
          .join(" "),
      }
    : counselingBaseA;
  const counselingB = counselingBaseB
    ? {
        ...counselingBaseB,
        description: [counselingBaseB.description, whyTurnToBLine, capabilityBoundaryB]
          .filter(Boolean)
          .join(" "),
      }
    : counselingBaseB;

  // 8. Breakup Guide & De-escalation
  const jealousyGuardBaseA =
    resolveJealousyGuardNote(ctx.tenGodsA, params.psychMasterA, nameA, locale) ??
    (isKo
      ? `${nameA}은(는) 상대의 새로운 인간관계나 변화를 질투 없이 응원하는 건강한 자존감을 지니고 있습니다. 감정이 상했을 때는 차가운 팩트보다 감정의 온도를 먼저 맞춰주세요.`
      : `${nameA} maintains healthy boundaries that support individual independence. Validate feelings first before jumping to logical problem-solving.`);

  const jealousyGuardBaseB =
    resolveJealousyGuardNote(ctx.tenGodsB, params.psychMasterB, nameB, locale) ??
    (isKo
      ? `${nameB}은(는) 상대의 새로운 인간관계나 변화를 질투 없이 응원하는 건강한 자존감을 지니고 있습니다. 감정이 상했을 때는 차가운 팩트보다 감정의 온도를 먼저 맞춰주세요.`
      : `${nameB} maintains healthy boundaries that support individual independence. Validate feelings first before jumping to logical problem-solving.`);

  // Item 15 (질투·비교·소외) — 구체적 트리거 장면 한 줄 추가.
  const jealousySceneA = buildJealousyTriggerSceneLine(params.psychMasterA, nameA, nameB, locale);
  const jealousySceneB = buildJealousyTriggerSceneLine(params.psychMasterB, nameB, nameA, locale);
  const jealousyGuardA = jealousySceneA ? `${jealousyGuardBaseA} ${jealousySceneA}` : jealousyGuardBaseA;
  const jealousyGuardB = jealousySceneB ? `${jealousyGuardBaseB} ${jealousySceneB}` : jealousyGuardBaseB;

  const deEscUpsetIsA = base.friend?.section_de_escalation?.upset_nickname === nameA;
  const reconciliationScript =
    resolveReconciliationScript(
      deEscUpsetIsA ? params.psychMasterA : params.psychMasterB,
      deEscUpsetIsA ? nameA : nameB,
      locale,
    ) ??
    (isKo
      ? "서운함이 생겼을 때의 짧은 침묵은 단절이 아닌 배려의 냉각기입니다. 거창한 사과 대신 '내 느낌'을 담백하게 전하고 맛있는 식사나 소소한 기프티콘으로 쿨하게 대화의 물꼬를 트세요."
      : "A brief pause after friction is protective cooling time. Express feelings calmly and reopen dialogue with a casual meal or coffee.");

  // Item 18 (멀리 떨어져도 유지되는가) — 역마 기운 + 인정욕구/회복탄력성.
  const distanceResilienceLine = buildDistanceResilienceLine({
    yeomaA: ctx.friendPairAnalysis.dnaA.yeomaCount,
    yeomaB: ctx.friendPairAnalysis.dnaB.yeomaCount,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const soulmateVerdict = distanceResilienceLine
    ? `${base.friend?.section_soulmate?.soulmate_verdict ?? ""} ${distanceResilienceLine}`.trim()
    : (base.friend?.section_soulmate?.soulmate_verdict ?? "");

  // 9. Restore Actionable Prescriptions (PairPrescriptionSection format)
  // Generates 3 core topics:
  // 1) friendship_baseline (우정 유지 기본 루틴 (공통))
  // 2) communication_climate / energy_drain_prevention (지금 당장 해볼 것 - Do List & Q21 연락 주도권)
  // 3) conflict_timeout_protocol (절대 하지 말 것 - Don't List & Q23 내려놓아야 할 기대)
  const prescriptionPack = buildFriendPrescriptions({
    pair: pairFriendship,
    nicknameA: nameA,
    nicknameB: nameB,
    locale,
  });
  // 근거 없는 고정 숫자(30분/10분/24시간/분기 1회/2주 등) 제거 — production
  // 파일은 그대로 두고 current_enriched에서만 문구를 순화한다.
  prescriptionPack.items = prescriptionPack.items.map((item) => ({
    ...item,
    do_list: item.do_list.map(stripUnsupportedFixedNumbers),
    dont_list: item.dont_list.map(stripUnsupportedFixedNumbers),
  }));

  // 성장과 기대 Q3 (무엇을 기대하면 실망하기 쉬운가) — Prescription Don't List에 배치.
  // Hidden Flow counseling_gap_note와 같은 신호(사고방식 vs 관계공감)를 재사용하되
  // "왜 어긋나는가"가 아니라 "무엇을 내려놓을지"로 프레이밍만 바꾼다(Law 9).
  const expectationResetForA = counselingBaseA
    ? buildExpectationResetLine(counselingBaseA.type, nameA, locale)
    : null;
  const expectationResetForB = counselingBaseB
    ? buildExpectationResetLine(counselingBaseB.type, nameB, locale)
    : null;
  const expectationResetLines = [expectationResetForA, expectationResetForB].filter(
    (l): l is string => Boolean(l),
  );
  if (expectationResetLines.length > 0 && prescriptionPack.items.length > 0) {
    const targetIndex = prescriptionPack.items.findIndex(
      (item) => item.topic === "friendship_baseline",
    );
    const idx = targetIndex >= 0 ? targetIndex : 0;
    prescriptionPack.items[idx] = {
      ...prescriptionPack.items[idx]!,
      dont_list: [...prescriptionPack.items[idx]!.dont_list, ...expectationResetLines],
    };
  }

  // 10. 11-Axis Reality Insights — real-life scenes for contact/reply cadence,
  // empathy vs solutions, planning vs spontaneity, duo vs group energy,
  // conflict pace, reassurance needs, and reconciliation speed. Distributed
  // into existing sections only (compare_table rows, hidden_flow, de_escalation)
  // — no new UI section. null when psychMaster survey is incomplete.
  const axisInsights = buildFriendAxisRealityInsights(
    params.psychMasterA,
    params.psychMasterB,
    nameA,
    nameB,
    locale,
  );
  // Item 7 보강 — 연락 빈도 성향 대조 문장 뒤에 일상 리듬(하루 단위 톡 빈도) 추가.
  const contactFrequencyWithRhythm =
    axisInsights?.contact_frequency && params.psychMasterA && params.psychMasterB
      ? `${axisInsights.contact_frequency} ${buildDailyContactRhythmClause(
          (params.psychMasterA.secondary_axes.energy_style + params.psychMasterB.secondary_axes.energy_style) / 2,
          locale,
        )}`
      : axisInsights?.contact_frequency;

  // 관계 거리감 Q1 (둘만 있을 때 vs 모임) dedup — Social DNA battery_description이
  // primary(saju 기반, deriveGroupVs1on1Insight)이므로 이 행은 전체 문단을 다시
  // 쓰지 않고 짧은 corroboration pointer만 남긴다(05B: one primary home, others
  // reference only when necessary).
  const duoVsGroupPointer = axisInsights?.duo_vs_group
    ? pick(
        locale,
        "Your stimulation-seeking scores back this up too — see the Social DNA battery description above for the full picture.",
        "11축 자극추구 점수로도 이 차이가 뒷받침돼요 — 자세한 설명은 위 Social DNA 배터리 항목을 참고하세요.",
      )
    : undefined;

  const COMPARE_ROW_AXIS_NOTE: Record<string, string | undefined> = {
    daily_share_tempo: contactFrequencyWithRhythm,
    communication_rhythm: axisInsights?.reply_speed,
    hangout_planning: axisInsights?.plan_vs_spontaneous,
    battery_recharge: duoVsGroupPointer,
    upset_expression: axisInsights?.speak_up_vs_hold,
    affection_language: axisInsights?.reassurance_vs_trust,
  };
  const enrichedCompareTable = base.friend?.section_compare_table?.map((row) => {
    const note = COMPARE_ROW_AXIS_NOTE[row.id];
    return note ? { ...row, psych_note: note } : row;
  });

  // 11. Score card audit — what each of the 3 headline scores measures, why
  // this pair scored this way (actual computeFriendMasterScores signals), and
  // what high/mid/low means. current_enriched only.
  const scoreCardAudit = buildFriendScoreCardAudit({
    sig: ctx.friendPairAnalysis.scoringSignals,
    scores: ctx.masterScores,
    nameA,
    nameB,
    locale,
  });

  return {
    ...base,
    headline: enrichedHeadline,
    one_line_friendship: enrichedSubtitle,
    friend: {
      ...base.friend,
      // 1. Snapshot: Update with enriched subtitle and Q3 situational anchor
      section_snapshot: {
        ...base.friend?.section_snapshot,
        one_line_friendship: enrichedSubtitle,
        shine_when_best: situationalShine,
        shine_when_low: shineWhenLow,
        score_card_audit: scoreCardAudit,
      },
      // 2. Social DNA A & B: Update with Q2/Q5 Directional Gifts & Q19 Social Energy Battery
      section_social_dna_a: {
        ...base.friend?.section_social_dna_a,
        guardian_character: {
          key: giftA.key,
          label: giftA.label,
          // emergenceLine(성장/시너지, pair 단위 결론)은 A 카드에만 싣는다.
          description: [giftA.description, giftLineExtraA, emergenceLine].filter(Boolean).join(" "),
        },
        battery_description: groupVs1on1A,
      },
      section_social_dna_b: {
        ...base.friend?.section_social_dna_b,
        guardian_character: {
          key: giftB.key,
          label: giftB.label,
          // emergenceLine은 pair 단위 결론이라 A 카드에만 한 번 싣는다(양쪽에
          // 동일 문장을 반복하면 "중복된 mutual-growth 문단" 문제가 생김).
          description: [giftB.description, giftLineExtraB].filter(Boolean).join(" "),
        },
        battery_description: groupVs1on1B,
      },
      // 3. REMOVE user-facing Play Money / Treasurer
      section_play_money: undefined,
      // 4. PRESERVE Hidden Flow (Travel & Counseling)
      section_hidden_flow: {
        ...base.friend?.section_hidden_flow,
        travel_style: travelStyle,
        counseling_style_a: counselingA,
        counseling_style_b: counselingB,
        counseling_gap_note: axisInsights?.empathy_vs_solution ?? null,
      },
      // 5. Breakup Guide
      section_breakup_guide: {
        ...base.friend?.section_breakup_guide,
        jealousy_guard_a: jealousyGuardA,
        jealousy_guard_b: jealousyGuardB,
      },
      // 6. De-escalation
      section_de_escalation: {
        ...base.friend?.section_de_escalation,
        // 근거 없는 고정 숫자("24시간") 제거 — 실제 계산된 신호가 아님.
        hashtag: isKo ? "#쿨다운_후_맛집_리셋" : "#Cooling_Reset_Over_Food",
        archetype_label: isKo ? "냉각기 & 저자극 맛집 리셋형" : "Cooling & Low-Pressure Reset",
        cheat_script: isKo
          ? "아까는 나도 감정이 좀 격했는데, 우리 감정 가라앉히고 편하게 맛있는 거 먹으러 가자."
          : "I was a bit overwhelmed earlier; let's grab some good food together and chat comfortably whenever you're ready.",
        reconciliation_script: reconciliationScript,
        recovery_pace_note: axisInsights?.reconciliation_speed ?? null,
      },
      // 7. 11-axis reality notes distributed onto the existing compare table
      section_compare_table: enrichedCompareTable ?? base.friend?.section_compare_table,
      // 8. Item 18 (멀리 떨어져도 유지되는가) — yeokma + recognition/resilience note
      section_soulmate: {
        ...base.friend?.section_soulmate,
        soulmate_verdict: soulmateVerdict,
      },
    },
    // 3점수 스냅샷 패널의 topic 카드(①②③)를 비운다 — 이 카드들은 intimacy/
    // stability/conflict 세 하위지표를 "Friend Chemistry/Banter/Social Risk"라는
    // 동일한 라벨로 3번 반복 표시해, 상단 진짜 3대 지표(connection/banter/risk)와
    // 숫자가 달라 보이는 모순처럼 읽힌다. 범례(ScoreKeyStrip)·정의 패널은 유지하고
    // 중복되는 topic 카드만 제거 — 상단 점수판이 유일한 3대 지표 표시가 된다.
    snapshot_panel: {
      ...base.snapshot_panel,
      narrative: {
        ...base.snapshot_panel.narrative,
        topics: [],
      },
    },
    meta: {
      ...base.meta,
      grade_reason: enrichedGradeReason,
      // RESTORE actionable prescriptions conforming to PairPrescriptionSection
      prescription_friendship: prescriptionPack,
      canonical_bundle: buildFriendCanonicalEngine({
        ctx,
        psychMasterA: params.psychMasterA,
        psychMasterB: params.psychMasterB,
        locale,
      }),
      canonical_story_plan: buildFriendStoryPlanEngine({
        bundle: buildFriendCanonicalEngine({
          ctx,
          psychMasterA: params.psychMasterA,
          psychMasterB: params.psychMasterB,
          locale,
        }),
        locale,
      }),
    },
    // Underlying canonical projections preserved intact
    canonical_projections: base.canonical_projections,
    // context_output is already stripped before any real client response
    // (stripFriendContextOutputForClient), but it still carries treasurer/
    // money text internally (built from the pre-removal section_play_money).
    // Drop it here too so no raw dump of this report object leaks money copy.
    context_output: undefined,
  };
}
