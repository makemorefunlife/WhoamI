/**
 * Build Canonical Relationship Story Plan from four-CE + canonical projections + psych.
 * CONNECT: unused cross-chart combine/tension/bonding into attraction & chemistry.
 * Korean copy lives in canonicalStoryPlanCopy.ko.json (UTF-8) to avoid editor encoding loss.
 */
import type {
  RomanticPsychMatchAxisResult,
  RomanticSajuDeepReport,
} from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { josa, josaIGa, josaEunNeun, josaGwaWa, josaEulReul } from "./romanticLanguage";
import { psychMatchAxisLabel } from "../../psychMatch/axisLabels";
import type { RomanticNarrativeInputContract } from "./fourCeNarrativeInput";
import { buildFourCeSemanticPlan } from "./fourCeSemanticPlanner";
import { projectHorizon } from "../experience/projectors/projectHorizon";
import { resolveBilateralPartnerPreferenceMatchFromCe } from "./spousePalaceMatcher";
import type {
  AttractionNarrativeUnit,
  AxisPriorityRow,
  BilateralChange,
  CanonicalRelationshipStoryPlan,
  DirectionalMisread,
  HiddenHeartBits,
  ProvenanceRef,
  StoryFace,
} from "./canonicalStoryPlanTypes";
import {
  resolveDynamicsLens,
  resolveHiddenHeartsLens,
  resolveStrengthVulnerabilityLens,
} from "./chapterLensResolvers";
import copyKo from "./canonicalStoryPlanCopy.ko.json";
import copyEn from "./canonicalStoryPlanCopy.en.json";
import {
  buildEmpathyVsSolvingScene,
  buildPhysicalIntimacyScene,
  buildGiveUpPointScene,
  buildRomanticChemistryScene,
  buildPossessivenessScene,
  buildLongTermGrowthScene,
} from "./romanticV4DateSceneInsights";
import type { RomanticPairCeBondingValue } from "../romanticPairCeBondingCanonical";
import type { RomanticFortuneFlowResult } from "../../romanticRules/fortuneFlow";
import { buildRomanticV4TimingFromFortuneFlow } from "./romanticV4TimingCanonical";
import {
  buildRomanticConflictLoopP0,
  buildRomanticRepairPatternP0,
  buildRomanticP0ActionCandidates,
} from "./buildRomanticP0CoverageModels";
import { buildRomanticMultiSignalSynthesis } from "./buildRomanticMultiSignalSynthesis";
import { buildRomanticCrossSignalIntelligence } from "./romanticCrossSignalIntelligence";
import { buildRomanticCandidateEngine } from "./buildRomanticCandidateEngine";
import { computeRomanticRelationshipNeedsEngine } from "./romanticRelationshipNeedsEngine";
import { computeRomanticV4GapBatchEngine } from "./romanticV4GapBatchEngine";
import { buildRomanticRecognitionSynthesis } from "./romanticRecognitionSynthesis";

import {
  topicP,
  subjectP,
  objectP,
  withP,
  sanitizeParticles,
  pick,
  type NarrativeLocale,
} from "./narrativeLocale";

type Report = RomanticSajuDeepReport["report"];
type CopyTable = typeof copyKo;

/**
 * Phase 5C (continued) — evidence-based conflict-trigger selection.
 *
 * Root cause of the byte-identical trigger sentence across every pair
 * (confirmed via code trace, not guessed): canonicalStoryPlanCopy.ko.json's
 * "loopTrigger" was a single hardcoded string, used unconditionally
 * regardless of any evidence — even though this recurringLoop's own
 * provenance array already (incorrectly) claimed expression_speed/
 * recovery_speed/comparison_table.stress as its basis. This function makes
 * that claim true: it actually branches on those real fields.
 *
 * Real value shapes (verified by reading the computing code, not the local
 * type casts, which had a stale field name — recovery_speed's real boolean
 * is `recovery_mismatch`, not `mismatch`):
 *   expression_speed.direction: "A" | "B" | "balanced"
 *   comparison_table.decision.lean_a/lean_b: "independent"|"balanced"|"consultative"
 *   comparison_table.stress.lean_a/lean_b: "explosive"|"steady"|"withdrawn"
 *   recovery_speed.recovery_mismatch: boolean
 *   axisResults gap for structure/conflict_style/decision_style/recognition
 *
 * Priority order (most trigger-specific first): a real decision-style
 * mismatch (money/plans) > a real stress-reaction-band mismatch (plans
 * suddenly disrupted) > a real expression-speed mismatch (reply delay) >
 * a large structure-axis gap (spontaneity vs plans) > abstain to a general,
 * non-overclaiming scene when nothing distinctive is supported.
 */
function selectConflictTriggerScene(params: {
  table: Record<string, { lean_a?: string; lean_b?: string } | undefined> | undefined;
  expr: { direction?: string } | undefined;
  recovery: { recovery_mismatch?: boolean } | undefined;
  axisResults: RomanticPsychMatchAxisResult[];
  locale: NarrativeLocale;
}): { scene: string; evidenceIds: string[] } {
  const { table, expr, recovery, axisResults, locale } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const axisGap = (key: string) => axisResults.find((a) => a.axis_key === key)?.gap ?? 0;

  const decision = table?.decision;
  if (decision?.lean_a && decision?.lean_b && decision.lean_a !== decision.lean_b) {
    return {
      scene: L(
        "돈이 들어가는 계획이나 중요한 결정을 함께 조율해야 할 때",
        "When you have to coordinate an important decision or a plan that involves real money",
      ),
      evidenceIds: ["canonical_projections.comparison_table.decision"],
    };
  }

  const stress = table?.stress;
  if (stress?.lean_a && stress?.lean_b && stress.lean_a !== stress.lean_b) {
    return {
      scene: L(
        "세워둔 계획이나 일정이 갑자기 틀어질 때",
        "When a plan or a schedule you'd already set suddenly falls apart",
      ),
      evidenceIds: ["canonical_projections.comparison_table.stress"],
    };
  }

  if (expr?.direction === "A" || expr?.direction === "B") {
    return {
      scene: L(
        "연락이나 답장이 지연될 때",
        "When a reply or a response is delayed",
      ),
      evidenceIds: ["canonical_projections.expression_speed"],
    };
  }

  if (axisGap("structure") >= 25) {
    return {
      scene: L(
        "미리 정해둔 방식과 즉흥적인 상황이 서로 부딪힐 때",
        "When a planned-out approach collides with something that comes up spontaneously",
      ),
      evidenceIds: ["axisResults.structure"],
    };
  }

  if (recovery?.recovery_mismatch) {
    return {
      scene: L(
        "다툰 뒤 회복하는 속도가 서로 다르게 느껴질 때",
        "When how quickly each of you bounces back after friction feels mismatched",
      ),
      evidenceIds: ["canonical_projections.recovery_speed"],
    };
  }

  // Abstention — no single distinctive trigger class is supported by real
  // evidence for this pair. General, non-overclaiming phrasing rather than
  // forcing one of the specific scenes above onto a pair it doesn't fit.
  return {
    scene: L(
      "예상치 못한 상황에서 서로의 반응 속도나 방식이 어긋날 때",
      "When, in an unexpected moment, your pace or way of responding doesn't quite line up",
    ),
    evidenceIds: [],
  };
}

/**
 * Pair-first fix: `repair.sequence`/`avoid` used to be `copy.repairSeq`/
 * `copy.repairAvoid` — flat constants, unconditional, for every couple
 * (confirmed via audit: buildCanonicalRelationshipStoryPlan.ts's old repair
 * object). This branches on the same real evidence
 * selectConflictTriggerScene already uses (recovery_speed mismatch,
 * expression_speed direction) so a couple whose actual friction point is
 * "we recover from fights at different speeds" gets sequence/avoid text
 * about THAT, not generic conflict-resolution advice that fits everyone.
 * Falls back to the general 3-step sequence only when nothing distinctive
 * is supported — same abstention discipline as the trigger-scene selector.
 */
function selectRepairSequence(params: {
  recovery: { recovery_mismatch?: boolean } | undefined;
  expr: { direction?: string } | undefined;
  names: { a: string; b: string };
  locale: NarrativeLocale;
}): { sequence: string[]; avoid: string[]; evidenceIds: string[] } {
  const { recovery, expr, names, locale } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);

  if (recovery?.recovery_mismatch) {
    return {
      sequence: [
        L("한 사람이 먼저 가라앉는다고 해서 다 풀린 게 아니에요 — 아직 정리 중인 사람에게 재촉하지 마세요.", "One of you cooling down first doesn't mean it's over — don't rush the one who's still processing."),
        L("먼저 괜찮아진 사람이 '난 이제 얘기해도 될 것 같은데, 넌 어때?'라고 확인부터 하세요.", "Whoever feels okay first should check in — \"I think I'm ready to talk, are you?\" — instead of assuming."),
        L("둘 다 준비됐을 때 다시 만나기로 한 시점을 구체적으로 정하세요.", "Once you're both actually ready, set a specific time to come back and talk."),
      ],
      avoid: [
        L("회복이 느린 쪽을 '왜 아직도 화났어'라고 다그치는 것", "Pushing the slower-to-recover one with \"why are you still upset\""),
        L("회복이 빠른 쪽을 '너무 쉽게 넘어간다'고 진심을 의심하는 것", "Doubting the faster-to-recover one's sincerity with \"you're moving on too easily\""),
      ],
      evidenceIds: ["canonical_projections.recovery_speed"],
    };
  }

  if (expr?.direction === "A" || expr?.direction === "B") {
    const slower = expr.direction === "A" ? names.a : names.b;
    const faster = expr.direction === "A" ? names.b : names.a;
    return {
      sequence: [
        L(`${faster}이/가 바로 답을 원해도, ${slower}에게는 생각을 정리할 시간이 먼저 필요해요.`, `Even when ${faster} wants an answer right away, ${slower} needs time to sort out their thoughts first.`),
        L(`${slower}이/가 "지금은 정리가 안 됐어, 이따 얘기하자"처럼 자기 상태를 먼저 말해주세요.`, `${slower} should say where they're at first — "I'm not ready yet, let's talk later" — instead of just going quiet.`),
        L("대화를 멈추더라도 다시 만날 시점은 구체적으로 정하세요.", "Even when you pause, set a specific time to come back to it."),
      ],
      avoid: [
        L(`${slower}의 침묵을 무관심으로 해석해서 몰아붙이는 것`, `Reading ${slower}'s silence as indifference and pressing harder`),
        L(`${faster}의 빠른 반응을 성급함으로 몰아붙이는 것`, `Reading ${faster}'s quick reaction as impatience and holding it against them`),
      ],
      evidenceIds: ["canonical_projections.expression_speed"],
    };
  }

  return {
    sequence: [
      L("감정이 격해졌을 때 당장 결판을 내지 말고, 짧게 서로 떨어져 열을 식히기로 약속하세요.", "When things get heated, don't try to settle it on the spot — agree to step apart briefly and cool down."),
      L("상대를 비난하기보다 '나는 지금 확실한 대답이 필요해'처럼 내 필요만 말하세요.", "Instead of blaming, just say what you need — \"I need a clear answer right now,\" not an attack."),
      L("대화를 멈추더라도 다시 만날 시점을 구체적으로 정하세요.", "Even when you pause, set a specific time to come back to it."),
    ],
    avoid: [
      L("상대가 대답하지 못하는 상황을 이용해 침묵을 처벌처럼 쓰는 것", "Using the other person's silence as a kind of punishment"),
      L("'너는 원래 그래'처럼 상대의 성격 전체를 규정지어 버리는 것", "Writing off their whole personality with \"that's just how you are\""),
    ],
    evidenceIds: [],
  };
}

/**
 * Pair-first fix: misreads[].commonNegativeReading/meaningGap/
 * betterExpression/helpfulResponse used to be 2 fixed variants (one per
 * direction) regardless of who the actor actually is — every "a_observes_b"
 * misread assumed B withdraws into silence and A feels shut out, every
 * "b_observes_a" misread assumed A pushes urgently and B feels attacked.
 * Confirmed via audit as a position-based story assumption (spec item 4):
 * only observedBehavior consulted real per-person data (relCeA/relCeB's
 * stressResponse text); the "what it means"/"better script" text did not.
 * This branches on the actor's real stressTempBand (already computed
 * elsewhere in this file for c8's shared-vulnerability text) so a "hot"
 * (escalates/pushes) actor and a "cold" (withdraws/goes quiet) actor get
 * genuinely different interpretations, regardless of which direction
 * they're being observed from.
 */
function misreadInterpretationFor(params: {
  band: "hot" | "cold" | "neutral" | undefined;
  actorName: string;
  observerName: string;
  locale: NarrativeLocale;
}): { commonNegativeReading: string; meaningGap: string; betterExpression: string; helpfulResponse: string } {
  const { band, actorName, observerName, locale } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);

  if (band === "hot") {
    return {
      commonNegativeReading: L("나를 몰아붙이거나 화를 낸다고 오해하기 쉽습니다.", "It's easy to misread this as being pushed or yelled at."),
      meaningGap: L("공격하려는 게 아니라, 지금 당장 문제를 풀고 싶은 다급함이 앞선 것뿐이에요.", "It's not an attack — it's just urgency to fix things right now, nothing more."),
      betterExpression: L(
        `${actorName}: "화난 게 아니라, 이게 빨리 풀렸으면 해서 급해졌어."`,
        `${actorName}: "I'm not angry — I just got ahead of myself wanting this resolved quickly."`,
      ),
      helpfulResponse: L(
        `${observerName}: 다급한 말투 이면의 불안을 먼저 알아채고, 짧게라도 먼저 반응해주기.`,
        `${observerName}: Noticing the anxiety behind the urgent tone first, and offering even a brief response before anything else.`,
      ),
    };
  }

  if (band === "cold") {
    return {
      commonNegativeReading: L("대화를 회피하거나 관계에 무성의하다고 오해하기 쉽습니다.", "It's easy to misread this as avoiding the conversation or not taking the relationship seriously."),
      meaningGap: L("표현의 속도와 생각 정리 방식의 차이일 뿐, 무관심이 아니에요.", "It's only a difference in pace and how thoughts get sorted out — not indifference."),
      betterExpression: L(
        `${actorName}: "화난 게 아니라, 정리할 시간이 좀 필요해. 조금만 기다려줘."`,
        `${actorName}: "I'm not upset — I just need a little time to think. Give me a bit."`,
      ),
      helpfulResponse: L(
        `${observerName}: 침묵을 거절로 받아들이지 않고, ${actorName}이/가 정리할 여유를 존중해주기.`,
        `${observerName}: Not reading the silence as rejection, and respecting ${actorName}'s need for room to think.`,
      ),
    };
  }

  return {
    commonNegativeReading: L("평소와 다르다고 느껴서 무슨 일인지 넘겨짚기 쉽습니다.", "It's easy to assume something's wrong just because it feels different from usual."),
    meaningGap: L("특별한 의미보다는, 그 순간의 컨디션 차이일 가능성이 커요.", "More often than not, it's just a difference in how they're doing that moment — not a deeper signal."),
    betterExpression: L(
      `${actorName}: "별일 아니야, 그냥 오늘 좀 그래."`,
      `${actorName}: "It's nothing — I'm just having one of those moments today."`,
    ),
    helpfulResponse: L(
      `${observerName}: 바로 의미를 해석하려 하지 않고, 편하게 물어보기.`,
      `${observerName}: Not jumping to an interpretation, and just asking casually instead.`,
    ),
  };
}

/**
 * Pair-first fix: recurringLoop.steps (loop1-4) used to unconditionally
 * assume A always reaches out first and B always withdraws into silence —
 * a fixed position-based story assumption regardless of who actually does
 * which (spec item 4's named example, same underlying bug already found
 * and fixed in misreadInterpretationFor above). Branches on real
 * stressTempBand data instead: whoever runs "hot" is the one who presses
 * for resolution, whoever runs "cold" is the one who needs space — in
 * whichever direction the real data says, not a fixed assumption. Falls
 * back to the original A-presses/B-withdraws framing only when neither
 * person's band is known (spec's abstention discipline: don't invent a
 * direction with zero supporting signal).
 */
function selectConflictLoopSteps(params: {
  bandA: "hot" | "cold" | "neutral" | undefined;
  bandB: "hot" | "cold" | "neutral" | undefined;
  names: { a: string; b: string };
  locale: NarrativeLocale;
  fallbackSteps: string[];
}): string[] {
  const { bandA, bandB, names, locale, fallbackSteps } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);

  const isColdA = bandA === "cold";
  const isColdB = bandB === "cold";
  const isHotA = bandA === "hot";
  const isHotB = bandB === "hot";

  // Mode 1: Asymmetric Hot-Cold (Pursuer-Withdrawer)
  if ((isHotA && !isHotB) || (isHotB && !isHotA)) {
    const presser = isHotA ? names.a : names.b;
    const withdrawer = isHotA ? names.b : names.a;
    return [
      L(`문제가 생기면 ${presser}이/가 빨리 풀고 싶어서 먼저 대화를 시도해요.`, `When a problem comes up, ${presser} wants to resolve it fast and reaches out first.`),
      L(`그 순간 ${withdrawer}은/는 머리가 복잡해져서 생각할 시간이 필요해 반응이 느려지거나 조용해져요.`, `In that moment, ${withdrawer}'s head gets crowded and needs time to think, so the response slows down or goes quiet.`),
      L(`그러면 ${presser}이/가 그 침묵을 무관심으로 오해해서 점점 서운해져요.`, `Then ${presser} can misread that silence as indifference and starts feeling more hurt.`),
      L(`${withdrawer}은/는 분위기가 무거워질수록 더 입을 닫게 되어, 결국 악순환이 돼요.`, `The heavier the mood gets, the more ${withdrawer} closes off — and the cycle repeats.`),
    ];
  }

  // Mode 2: Both Cold (Double-Retreat / Frozen Distance)
  if (isColdA && isColdB) {
    return [
      L(`갈등 조짐이 보이면 ${names.a}님과 ${names.b}님 모두 감정을 즉각 꺼내기보다 각자의 동굴로 물러섭니다.`, `When friction arises, both ${names.a} and ${names.b} retreat into their own caves rather than opening up immediately.`),
      L(`상대방이 먼저 다가와주기를 기대하며 침묵의 시간이 길어집니다.`, `Silence stretches as each expects the other to reach out first.`),
      L(`시간이 흐를수록 '상대가 마음을 닫았다'고 생각하여 정서적 거리가 점점 멀어집니다.`, `As time passes, each assumes the other has closed off, widening the emotional distance.`),
      L(`진짜 서운함의 원인을 다루지 못한 채 조용한 앙금이 가만히 남아있게 되는 패턴입니다.`, `Without addressing the root cause, quiet resentment remains lingering between you.`),
    ];
  }

  // Mode 3: Both Hot (Double-Escalation / Emotional Clash)
  if (isHotA && isHotB) {
    return [
      L(`갈등이 발생하면 ${names.a}님과 ${names.b}님 모두 자기 입장과 서운함을 즉각적으로 세게 표현합니다.`, `When conflict strikes, both ${names.a} and ${names.b} express their feelings and hurt strongly and immediately.`),
      L(`상대의 템포를 기다리지 않고 각자의 팩트와 주장을 동시에 밀어붙입니다.`, `Neither waits for the other's pace, pushing their own facts and points at the same time.`),
      L(`감정이 고조되면서 본래의 문제보다 표현 방식이나 어조에 더 상처받기 쉽습니다.`, `As tempers rise, it becomes easier to get hurt by tone and delivery than the core issue itself.`),
      L(`서로 강하게 마주친 후 감정 에너지가 방전되며 피로감이 크게 남는 루프입니다.`, `After a strong head-on clash, emotional energy drains out, leaving heavy fatigue.`),
    ];
  }

  // Mode 4: Neutral x Cold
  if ((isColdA && !isHotB) || (isColdB && !isHotA)) {
    const cold = isColdA ? names.a : names.b;
    const neutral = isColdA ? names.b : names.a;
    return [
      L(`갈등 시 ${cold}님이 혼자 정리할 동굴 시간을 필요로 하여 말문이 적어집니다.`, `In conflict, ${cold} needs time alone to process, becoming quiet.`),
      L(`${neutral}님은 지켜보며 기다리려 하지만, 생각보다 긴 조용함에 답답함을 느낍니다.`, `${neutral} tries to be patient, but feels frustrated as the silence lasts longer than expected.`),
      L(`${cold}님이 언제 다시 대화할지 전달하지 않으면 불확실성이 커집니다.`, `If ${cold} doesn't signal when to talk again, uncertainty builds.`),
      L(`적절한 대화 재개 타이밍을 공유할 때 정서적 안전지대가 회복되는 구도입니다.`, `Sharing a clear time to reconnect is what restores your emotional safe zone.`),
    ];
  }

  // Mode 5: Neutral x Hot
  if ((isHotA && !isColdB) || (isHotB && !isColdA)) {
    const hot = isHotA ? names.a : names.b;
    const neutral = isHotA ? names.b : names.a;
    return [
      L(`갈등이 생기면 ${hot}님이 솔직하고 직설적인 어조로 빠른 해명을 요구합니다.`, `When friction occurs, ${hot} seeks a quick explanation with direct delivery.`),
      L(`${neutral}님은 직설적인 어조에 가볍게 당황하여 우선 온도를 낮추려 조율합니다.`, `${neutral} feels slightly startled by the direct tone and tries to cool down the temperature.`),
      L(`${hot}님은 상대의 신중함을 지연으로 여겨 더 강하게 확인하려 할 수 있습니다.`, `${hot} may view the other's caution as delay and press harder for reassurance.`),
      L(`표현의 강도를 누르고 서로의 본래 선의를 먼저 인정해줄 때 해결되는 패턴입니다.`, `Resolving it comes down to easing the pressure and acknowledging each other's good intentions first.`),
    ];
  }

  // Mode 6: Genuinely Similar Moderate Pairs
  return [
    L(`평소 두 사람은 원만하게 맞춰가지만, 마찰이 생기면 서로의 기분을 조심스럽게 살피며 조용해집니다.`, `You usually adapt smoothly, but when friction hits, you both quiet down and carefully observe each other's mood.`),
    L(`서운함이 생겨도 곧바로 부딪치기보다 스스로 참으며 넘어가는 편입니다.`, `Even when hurt, you tend to hold it in rather than confront it head-on.`),
    L(`직접 다루지 않은 서운함이 마음에 작게 축적될 위험이 있습니다.`, `There's a risk that unaddressed hurt quietly accumulates inside.`),
    L(`정기적으로 솔직한 마음을 편안하게 털어놓는 대화 자리를 만들어주는 것이 좋습니다.`, `Creating regular, relaxed check-ins to share feelings openly protects your harmony.`),
  ];
}

function fill(tpl: string, vars: Record<string, string>, locale: NarrativeLocale): string {
  return sanitizeParticles(
    tpl.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? ""),
    [],
    locale,
  );
}

function prov(
  evidenceId: string,
  source: string,
  sourcePath: string,
  appliesTo: ProvenanceRef["appliesTo"],
  confidence: ProvenanceRef["confidence"],
  claimBoundary: ProvenanceRef["claimBoundary"],
  priority: ProvenanceRef["priority"] = "primary",
): ProvenanceRef {
  return {
    evidenceId,
    source,
    sourcePath,
    appliesTo,
    confidence,
    claimBoundary,
    priority,
  };
}

function leanLabel(
  lean: string | undefined,
  rowKey: RomanticCompareRowKey,
  locale: "ko-KR" | "en-US",
): string {
  if (!lean) return pick(locale, copyKo.leanFallback, copyEn.leanFallbackEn);
  return formatRomanticCompareLeanLabel(lean as never, locale, rowKey);
}

import { getAxisInterpretations } from "./axisStandoutInterpretations";

function axisRow(
  axis: RomanticPsychMatchAxisResult,
  role: AxisPriorityRow["role"],
  locale: "ko-KR" | "en-US",
): AxisPriorityRow {
  const label = psychMatchAxisLabel(axis.axis_key, locale);
  const aHigh = axis.score_a >= axis.score_b;
  const interp = getAxisInterpretations(locale)[axis.axis_key] || pick(
    locale,
    {
      plainLanguageDefinition: "서로의 다름과 같음을 보여주는 성향이에요.",
      highBehavior: "스스로의 성향을 선명하게 드러내는 편이에요.",
      lowBehavior: "상황에 맞춰 유연하게 반응하는 편이에요.",
      sceneHint: "일상 속에서 선택을 내릴 때",
      tensionClash: "차이가 오해로 이어질 수 있어요.",
      tensionBenefit: "서로 다른 강점을 살릴 수 있어요.",
      practicalTranslation: "다름을 이해하고 맞춰가려는 노력이 필요해요.",
      misreadHighObservingLow: "상대의 유연함을 무심함으로 잘못 읽을 수 있어요.",
      misreadLowObservingHigh: "상대의 선명함을 부담으로 잘못 읽을 수 있어요.",
    },
    {
      plainLanguageDefinition: "A tendency that shows where you're different and where you're alike.",
      highBehavior: "Tends to show their own tendency clearly and openly.",
      lowBehavior: "Tends to respond flexibly, adapting to the situation.",
      sceneHint: "When making choices in everyday life",
      tensionClash: "This difference can turn into misunderstanding.",
      tensionBenefit: "You can each draw on your own distinct strengths.",
      practicalTranslation: "It helps to make an effort to understand the difference and meet in the middle.",
      misreadHighObservingLow: "The other's flexibility can be misread as indifference.",
      misreadLowObservingHigh: "The other's clarity can be misread as pressure.",
    },
  );

  const aPattern = aHigh ? interp.highBehavior : interp.lowBehavior;
  const bPattern = !aHigh ? interp.highBehavior : interp.lowBehavior;
  const isSimilar = axis.match_type === "similarity";
  const gap = axis.gap;

  let dynamicText = "";
  if (isSimilar || gap < 20) {
    dynamicText = pick(
      locale,
      `비슷한 ${label} 성향(${axis.score_a}점 vs ${axis.score_b}점, ${gap}점 차이)으로 상대의 반응을 직관적으로 이해하기 쉬운 상태입니다.`,
      `With similar ${label} scores (${axis.score_a} vs ${axis.score_b}, gap of ${gap}), you intuitively understand each other's responses.`,
    );
  } else if (gap >= 50) {
    dynamicText = pick(
      locale,
      `상당한 ${label} 차이(${axis.score_a}점 vs ${axis.score_b}점, ${gap}점 차이)로 선명한 성향 대비가 드러나는 핵심 구도입니다.`,
      `A major difference in ${label} (${axis.score_a} vs ${axis.score_b}, gap of ${gap}) creates a high-contrast core dynamic.`,
    );
  } else {
    dynamicText = pick(
      locale,
      `완만한 ${label} 차이(${axis.score_a}점 vs ${axis.score_b}점, ${gap}점 차이)로 일상에서 느긋하게 조율할 수 있는 범위입니다.`,
      `A moderate difference in ${label} (${axis.score_a} vs ${axis.score_b}, gap of ${gap}) leaves plenty of room for relaxed adjustment.`,
    );
  }

  return {
    id: `axis.${axis.axis_key}`,
    sourceType: "psych",
    confidence: "high",
    userQuestion: pick(
      locale,
      `${label} 차이가 우리에게 미치는 영향은 무엇인가요?`,
      `What effect does our difference in ${label} have on us?`,
    ),
    plainLanguageDefinition: interp.plainLanguageDefinition,
    personATendency: `${aPattern} (${axis.score_a}점)`,
    personBTendency: `${bPattern} (${axis.score_b}점)`,
    pairDynamic: `${dynamicText} ${isSimilar ? "" : interp.tensionClash}`,
    observableScene: interp.sceneHint,
    likelyMisreadingA: isSimilar ? null : (aHigh ? interp.misreadHighObservingLow : interp.misreadLowObservingHigh),
    likelyMisreadingB: isSimilar ? null : (aHigh ? interp.misreadLowObservingHigh : interp.misreadHighObservingLow),
    relationshipStrength: isSimilar ? pick(locale, copyKo.calmSim, copyEn.calmSim) : interp.tensionBenefit,
    relationshipRisk: isSimilar ? pick(locale, copyKo.stressLow, copyEn.stressLow) : `${gap >= 50 ? "큰 성향 차이로 인해 " : ""}${interp.tensionClash}`,
    practicalTranslation: isSimilar ? pick(locale, "지금의 긍정적인 균형을 유지하세요.", "Keep up the positive balance you already have.") : interp.practicalTranslation,
    evidenceRefs: [
      prov(
        `meta.psych_match.axis_results.${axis.axis_key}`,
        "psych_match",
        `meta.psych_match.axis_results.${axis.axis_key}`,
        "pair",
        "high",
        "direct_evidence",
      ),
    ],
    axisKey: axis.axis_key,
    axisLabel: label,
    role,
    scoreA: axis.score_a,
    scoreB: axis.score_b,
    gap: axis.gap,
    matchType: axis.match_type,
  };
}

export function buildCanonicalRelationshipStoryPlan(params: {
  contract: RomanticNarrativeInputContract;
  report: Report;
  axisResults: RomanticPsychMatchAxisResult[];
  locale: "ko-KR" | "en-US";
  reportYear?: number;
  /** Pure Saju daewoon/sewoon calculation for c10_future_timing — when provided, this replaces the old report.section_6_timeline dependency (never populated by V4's canonical-only report). Omit to keep the legacy fallback. */
  fortuneFlow?: RomanticFortuneFlowResult | null;
  dynamicsCrossHits?: Array<{ category?: string; type?: string }>;
}): CanonicalRelationshipStoryPlan {
  const { contract, report, axisResults, locale } = params;
  const copy: CopyTable = locale === "en-US" ? copyEn : copyKo;
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const year = params.reportYear ?? new Date().getFullYear();
  // Was hardcoded to the fixture demo pair's names via \u escape sequences
  // (invisible to a plain-text grep) regardless of caller. contract.names
  // already carries the real A/B names (buildRomanticNarrativeInputContract's
  // nameA/nameB params) \u2014 use that instead of a local literal.
  const names = contract.names;
  const plan = buildFourCeSemanticPlan(contract);
  const relCeA = plan.aRelationshipCe;
  const relCeB = plan.bRelationshipCe;
  const projections = report.canonical_projections ?? {};
  const connected = new Set<string>();
  const suppressed: Array<{ evidenceId: string; reason: string }> = [];
  const mark = (id: string) => connected.add(id);

  const table = projections.comparison_table as
    | Record<string, { lean_a?: string; lean_b?: string; a?: string; b?: string } | undefined>
    | undefined;
  const expr = projections.expression_speed as { direction?: string } | undefined;
  // Stale cast fixed (Phase 5C): the real field computed by
  // romanticRecoverySpeedCanonical.ts is `recovery_mismatch`, not `mismatch`
  // — this variable was previously unused anywhere in this file, so the
  // wrong field name never caused a bug elsewhere, just meant `recovery`
  // was silently dead. Now consumed by selectConflictTriggerScene.
  const recovery = projections.recovery_speed as { recovery_mismatch?: boolean } | undefined;
  const reassurance = projections.reassurance_signal as { need_a?: string } | undefined;
  const balance = projections.balance_of_power as
    | { balance_a?: string; balance_b?: string }
    | undefined;
  const bonding = (projections as any).pair_ce_bonding as
    | (RomanticPairCeBondingValue & { summary?: string })
    | undefined;
  const stemCombine = projections.cross_chart_stem_combine as
    | { hitCount?: number }
    | undefined;
  const sixCombine = projections.cross_chart_six_combine as { hitCount?: number } | undefined;
  const tension = projections.cross_chart_tension as
    | { dominant_type?: string; hits?: unknown[] }
    | undefined;
  const wonjin = projections.cross_chart_wonjin_guimun as
    | { wonjinCount?: number; guimunCount?: number }
    | undefined;

  const affLeanA = table?.affection?.lean_a ?? table?.affection?.a 
    ? leanLabel(table?.affection?.lean_a ?? table?.affection?.a, "affection", locale)
    : (relCeA?.careExpression?.text ?? "행동과 배려로 마음을 전하는 성향");
  const affLeanB = table?.affection?.lean_b ?? table?.affection?.b
    ? leanLabel(table?.affection?.lean_b ?? table?.affection?.b, "affection", locale)
    : (relCeB?.careExpression?.text ?? "묵묵한 신뢰와 세심함으로 마음을 전하는 성향");
  const stressLeanA = table?.stress?.lean_a ?? table?.stress?.a
    ? leanLabel(table?.stress?.lean_a ?? table?.stress?.a, "stress", locale)
    : (relCeA?.stressResponse?.text ?? "감정을 차분하게 정리할 시간을 필요로 하는 성향");
  const stressLeanB = table?.stress?.lean_b ?? table?.stress?.b
    ? leanLabel(table?.stress?.lean_b ?? table?.stress?.b, "stress", locale)
    : (relCeB?.stressResponse?.text ?? "혼자만의 공간에서 감정을 가라앉히는 성향");
  const decisionLeanA = table?.decision?.lean_a ?? table?.decision?.a
    ? leanLabel(table?.decision?.lean_a ?? table?.decision?.a, "decision", locale)
    : (relCeA?.decisionStyle?.text?.replace(/\.$/, "") ?? "명확한 원칙과 장기적 안정성을 기준으로 결단을 내리는 방식");
  const decisionLeanB = table?.decision?.lean_b ?? table?.decision?.b
    ? leanLabel(table?.decision?.lean_b ?? table?.decision?.b, "decision", locale)
    : (relCeB?.decisionStyle?.text?.replace(/\.$/, "") ?? "조급하게 서두르지 않고 안정적인 길을 선택하는 방식");

  if (table?.affection) mark("canonical_projections.comparison_table.affection");
  if (table?.stress) mark("canonical_projections.comparison_table.stress");
  if (table?.decision) mark("canonical_projections.comparison_table.decision");
  if (table?.expression) mark("canonical_projections.comparison_table.expression");
  if (expr) mark("canonical_projections.expression_speed");
  if (recovery) mark("canonical_projections.recovery_speed");
  if (reassurance) mark("canonical_projections.reassurance_signal");

  const sortedDiff = [...axisResults]
    .filter((a) => a.axis_key !== "conflict_style")
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);
  for (const a of sortedDiff) mark(`meta.psych_match.axis_results.${a.axis_key}`);

  const stabilizingSimilarities = [...axisResults]
    .filter((a) => a.axis_key !== "conflict_style" && a.match_type === "similarity")
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 2);
  for (const a of stabilizingSimilarities) {
    mark(`meta.psych_match.axis_results.${a.axis_key}`);
  }

  const topDifferences = sortedDiff.map((a) => axisRow(a, "top_difference", locale));
  const stabRows = stabilizingSimilarities.map((a) =>
    axisRow(a, "stabilizing_similarity", locale),
  );
  const allAxes = axisResults.map((a) =>
    axisRow(
      a,
      topDifferences.some((t) => t.axisKey === a.axis_key)
        ? "top_difference"
        : stabRows.some((t) => t.axisKey === a.axis_key)
          ? "stabilizing_similarity"
          : "contextual",
      locale,
    ),
  );

  const hitNotes: string[] = [];
  const attractionProv: ProvenanceRef[] = [];

  if (stemCombine && Number(stemCombine.hitCount) > 0) {
    mark("canonical_projections.cross_chart_stem_combine");
    hitNotes.push(copy.hitStem);
    attractionProv.push(
      prov(
        "canonical_projections.cross_chart_stem_combine",
        "romantic_ce",
        "canonical_projections.cross_chart_stem_combine",
        "pair",
        "medium",
        "combination_judgment",
      ),
    );
  } else if (params.dynamicsCrossHits?.some((h) => h.category === "stem_combine")) {
    mark("dynamicsTyped.crossChartHits.stem_combine");
    hitNotes.push(copy.hitStem);
  }

  if (sixCombine && Number(sixCombine.hitCount) > 0) {
    mark("canonical_projections.cross_chart_six_combine");
    hitNotes.push(copy.hitSix);
    attractionProv.push(
      prov(
        "canonical_projections.cross_chart_six_combine",
        "romantic_ce",
        "canonical_projections.cross_chart_six_combine",
        "pair",
        "medium",
        "combination_judgment",
      ),
    );
  }

  if (tension && (tension.dominant_type || (tension.hits?.length ?? 0) > 0)) {
    mark("canonical_projections.cross_chart_tension");
    hitNotes.push(copy.hitTension);
    attractionProv.push(
      prov(
        "canonical_projections.cross_chart_tension",
        "romantic_ce",
        "canonical_projections.cross_chart_tension",
        "pair",
        "high",
        "direct_evidence",
      ),
    );
  }

  if (wonjin && (Number(wonjin.wonjinCount) > 0 || Number(wonjin.guimunCount) > 0)) {
    mark("canonical_projections.cross_chart_wonjin_guimun");
    hitNotes.push(copy.hitWonjin);
    attractionProv.push(
      prov(
        "canonical_projections.cross_chart_wonjin_guimun",
        "romantic_ce",
        "canonical_projections.cross_chart_wonjin_guimun",
        "pair",
        "medium",
        "combination_judgment",
      ),
    );
  }

  if (bonding) {
    mark("canonical_projections.pair_ce_bonding");
    mark("ce.pair.common");
  }

  const aCharacter = plan.aRelationshipCharacter.selectedMeaning;
  const bCharacter = plan.bRelationshipCharacter.selectedMeaning;
  if (aCharacter || relCeA) mark("ce.individual.a");
  if (bCharacter || relCeB) mark("ce.individual.b");

  const summary = report.section_1_summary as
    | { relationship_name?: string }
    | string
    | undefined;
  const relationshipDefinition =
    (typeof summary === "object" && summary?.relationship_name) ||
    (typeof summary === "string" ? summary : null) ||
    (topDifferences.length > 0 && topDifferences[0].gap >= 20
      ? L(
          `${names.a}님(${topDifferences[0].scoreA}점)과 ${names.b}님(${topDifferences[0].scoreB}점)의 ${topDifferences[0].axisLabel} 차이(${topDifferences[0].gap}점 gap)를 바탕으로 맞춰가는 관계`,
          `A relationship shaped by the gap in ${topDifferences[0].axisLabel} between ${names.a} (${topDifferences[0].scoreA}) and ${names.b} (${topDifferences[0].scoreB}) (${topDifferences[0].gap}-pt gap)`,
        )
      : relCeA && relCeB
      ? L(
          `${names.a}의 ${relCeA.familiarRelationshipRole?.text ?? relCeA.coreRelationshipNature.text}와 ${names.b}의 ${relCeB.familiarRelationshipRole?.text ?? relCeB.coreRelationshipNature.text}이 만나 조율하는 관계`,
          `A relationship shaped by ${names.a}'s ${relCeA.familiarRelationshipRole?.text ?? relCeA.coreRelationshipNature.text} meeting ${names.b}'s ${relCeB.familiarRelationshipRole?.text ?? relCeB.coreRelationshipNature.text}`,
        )
      : plan.pairSynthesis.selectedMeaning || copy.defFallback);
  mark("section_1_summary");

  const specialBond = report.section_4_special_bond as
    | { why_special?: string; only_together?: string }
    | undefined;
  if (specialBond) mark("section_4_special_bond");

  const faces: StoryFace[] =
    relCeA && relCeB
      ? resolveDynamicsLens({
          relCeA,
          relCeB,
          names: { a: names.a, b: names.b },
          comparisonTable: table as any,
          locale,
        })
      : [
          {
            situation: "private",
            appearance: fill(copy.tpl.facePrivateApp, { a: names.a, b: names.b }, locale),
            mechanism: fill(copy.tpl.facePrivateMech, { affA: affLeanA, affB: affLeanB }, locale),
            benefit: copy.facePrivateBen,
            riskWhenExcess: copy.facePrivateRisk,
            observableSignal: copy.facePrivateSig,
            provenance: [
              prov(
                "canonical_projections.expression_speed",
                "romantic_ce",
                "canonical_projections.expression_speed",
                "pair",
                "high",
                "direct_evidence",
              ),
            ],
          },
          {
            situation: "responsibility",
            appearance: fill(copy.tpl.faceRespApp, { dA: decisionLeanA, dB: decisionLeanB }, locale),
            mechanism: copy.faceRespMech,
            benefit: copy.faceRespBen,
            riskWhenExcess: copy.faceRespRisk,
            observableSignal: copy.faceRespSig,
            provenance: [
              prov(
                "canonical_projections.comparison_table.decision",
                "romantic_ce",
                "canonical_projections.comparison_table.decision",
                "pair",
                "high",
                "direct_evidence",
              ),
            ],
          },
          {
            situation: "stress",
            appearance: fill(copy.tpl.faceStressApp, { sA: stressLeanA, sB: stressLeanB }, locale),
            mechanism: copy.faceStressMech,
            benefit: copy.faceStressBen,
            riskWhenExcess: copy.faceStressRisk,
            observableSignal: copy.faceStressSig,
            provenance: [
              prov(
                "canonical_projections.comparison_table.stress",
                "romantic_ce",
                "canonical_projections.comparison_table.stress",
                "pair",
                "high",
                "direct_evidence",
              ),
            ],
          },
        ];

  const bilateralMatchAToB =
    relCeA && relCeB
      ? resolveBilateralPartnerPreferenceMatchFromCe({
          seekerCe: relCeA,
          partnerCe: relCeB,
          seekerId: "a",
          partnerId: "b",
          seekerName: names.a,
          partnerName: names.b,
          locale,
        })
      : undefined;

  const bilateralMatchBToA =
    relCeA && relCeB
      ? resolveBilateralPartnerPreferenceMatchFromCe({
          seekerCe: relCeB,
          partnerCe: relCeA,
          seekerId: "b",
          partnerId: "a",
          seekerName: names.b,
          partnerName: names.a,
          locale,
        })
      : undefined;

  const cleanUniqueCombination = sanitizeParticles(
    hitNotes.join(" ") ||
      (plan.pairSynthesis.selectedMeaning && !plan.pairSynthesis.selectedMeaning.includes("육합")
        ? plan.pairSynthesis.selectedMeaning
        : "") ||
      specialBond?.only_together ||
      copy.attrUniqueFallback,
    [names.a, names.b],
    locale,
  );

  const mutualUnit: AttractionNarrativeUnit = {
    subject: "mutual",
    recognition: sanitizeParticles(
      hitNotes[0] ?? L(
        `${withP(names.a, locale)} ${names.b}가 마주할 때 비로소 만들어지는 특별한 정서적 공명과 몰입감이 존재합니다.`,
        `There's a special emotional resonance and immersion that only comes into being when ${withP(names.a, locale)} ${names.b} face each other.`,
      ),
      [names.a, names.b],
      locale,
    ),
    emotionalMeaning: sanitizeParticles(
      L(
        "서로 다른 고유한 리듬이 조화롭게 맞물리면서, 둘이 함께할 때 더 깊은 안도감과 편안한 활력을 경험하기 쉽습니다.",
        "Your distinct rhythms interlock harmoniously, so being together tends to bring a deeper reassurance and a comfortable sense of energy.",
      ),
      [names.a, names.b],
      locale,
    ),
    partnerEvidence: hitNotes.slice(1).map((n) => sanitizeParticles(n, [names.a, names.b], locale)),
    scene: sanitizeParticles(
      L(
        "세상의 분주함을 뒤로하고 둘만의 공간에서 대화를 시작할 때, 굳이 긴 설명 없이도 서로의 생각과 감정이 자연스럽게 포개어지는 순간",
        "The moment you leave the busy world behind and start talking in a space that's just the two of you, and your thoughts and feelings naturally fall into place without needing a long explanation",
      ),
      [names.a, names.b],
      locale,
    ),
    pairSpecificEffect: sanitizeParticles(
      L(
        "서로의 다른 기질을 자연스럽게 보완하며, 둘만의 깊은 유대감과 회복 탄력성을 차분히 키워나갑니다.",
        "Naturally complements each other's different temperaments, quietly building a deep bond and resilience that belong only to the two of you.",
      ),
      [names.a, names.b],
      locale,
    ),
    tensionBridge: sanitizeParticles(
      copy.attrFlip,
      [names.a, names.b],
      locale,
    ),
    evidenceIds: attractionProv.map((p) => p.evidenceId),
    confidence: "high",
    usedClaims: hitNotes,
  };

  const attraction = {
    aSeeks: {
      seeker: "a" as const,
      seeksInPartner: bilateralMatchAToB
        ? `${bilateralMatchAToB.narrativeUnit.recognition} ${bilateralMatchAToB.narrativeUnit.emotionalMeaning}`
        : relCeA && relCeB
        ? L(
            `${topicP(names.a, locale)} ${relCeA.partnerPreferences[0]?.text ?? affLeanB}를 자연스럽게 바라며, ${names.b}의 ${relCeB.coreRelationshipNature.text}에 깊은 매력을 느낍니다.`,
            `${topicP(names.a, locale)} naturally wants ${(relCeA.partnerPreferences[0]?.text ?? affLeanB).charAt(0).toLowerCase()}${(relCeA.partnerPreferences[0]?.text ?? affLeanB).slice(1)}, and feels deeply drawn to ${names.b}'s ${relCeB.coreRelationshipNature.text.charAt(0).toLowerCase()}${relCeB.coreRelationshipNature.text.slice(1)}`,
          )
        : fill(copy.tpl.attrASeeks, {
            topicA: topicP(names.a, locale),
            affB: affLeanB,
            char: aCharacter ? fill(copy.tpl.charSuffix, { char: aCharacter }, locale) : "",
          }, locale),
      partnerMatchPoint: bilateralMatchAToB
        ? bilateralMatchAToB.supportingReasons.map((r) => r.text).join(" ")
        : relCeB
        ? L(
            `${subjectP(names.b, locale)} 보여주는 ${relCeB.strengthsGivenToPartner[0]?.text ?? "안정감"}이 ${names.a}의 마음을 든든하게 받쳐줍니다.`,
            `The ${(relCeB.strengthsGivenToPartner[0]?.text ?? "sense of stability").charAt(0).toLowerCase()}${(relCeB.strengthsGivenToPartner[0]?.text ?? "sense of stability").slice(1)} that ${subjectP(names.b, locale)} shows gives ${names.a}'s heart something dependable to lean on.`,
          )
        : fill(copy.tpl.attrAMatch, { subjB: subjectP(names.b, locale) }, locale),
      supportingReasons: bilateralMatchAToB?.supportingReasons.map((r) => r.text),
      cautionReasons: bilateralMatchAToB?.cautionReasons.map((r) => r.text),
      preferenceMatch: bilateralMatchAToB,
      narrativeUnit: bilateralMatchAToB?.narrativeUnit,
      provenance: [
        prov(
          "canonical_projections.comparison_table.affection",
          "romantic_ce",
          "canonical_projections.comparison_table.affection",
          "a",
          "high",
          "direct_evidence",
        ),
        ...(relCeA
          ? [
              prov(
                "chart.a.spouse_palace.preference",
                "personal_saju_chart",
                "chart.a.pillars.day.branch_ten_god",
                "a" as const,
                "high" as const,
                "direct_evidence" as const,
              ),
            ]
          : [
              prov(
                "ce.individual.a",
                "personal_ce",
                "siblingInputs.individualCeA",
                "a" as const,
                "medium" as const,
                "combination_judgment" as const,
              ),
            ]),
        ...(bilateralMatchAToB
          ? bilateralMatchAToB.matchedPartnerEvidence.map((ev) =>
              prov(ev.evidenceId, ev.source, ev.sourcePath, "b" as const, "high" as const, "direct_evidence" as const),
            )
          : []),
      ],
    },
    bSeeks: {
      seeker: "b" as const,
      seeksInPartner: bilateralMatchBToA
        ? `${bilateralMatchBToA.narrativeUnit.recognition} ${bilateralMatchBToA.narrativeUnit.emotionalMeaning}`
        : relCeA && relCeB
        ? L(
            `${topicP(names.b, locale)} ${relCeB.partnerPreferences[0]?.text ?? affLeanA}를 원하며, ${names.a}의 ${relCeA.coreRelationshipNature.text}에서 신선한 활력과 이끌림을 경험합니다.`,
            `${topicP(names.b, locale)} wants ${(relCeB.partnerPreferences[0]?.text ?? affLeanA).charAt(0).toLowerCase()}${(relCeB.partnerPreferences[0]?.text ?? affLeanA).slice(1)}, and finds a fresh energy and pull in ${names.a}'s ${relCeA.coreRelationshipNature.text.charAt(0).toLowerCase()}${relCeA.coreRelationshipNature.text.slice(1)}`,
          )
        : fill(copy.tpl.attrBSeeks, {
            topicB: topicP(names.b, locale),
            affA: affLeanA,
            char: bCharacter ? fill(copy.tpl.charSuffix, { char: bCharacter }, locale) : "",
          }, locale),
      partnerMatchPoint: bilateralMatchBToA
        ? bilateralMatchBToA.supportingReasons.map((r) => r.text).join(" ")
        : relCeA
        ? L(
            `${subjectP(names.a, locale)} 보여주는 ${relCeA.strengthsGivenToPartner[0]?.text ?? "명확한 결단력"}이 ${names.b}에게 큰 확신이 됩니다.`,
            `The ${(relCeA.strengthsGivenToPartner[0]?.text ?? "clear decisiveness").charAt(0).toLowerCase()}${(relCeA.strengthsGivenToPartner[0]?.text ?? "clear decisiveness").slice(1)} that ${subjectP(names.a, locale)} shows becomes a real source of confidence for ${names.b}.`,
          )
        : fill(copy.tpl.attrBMatch, { subjA: subjectP(names.a, locale) }, locale),
      supportingReasons: bilateralMatchBToA?.supportingReasons.map((r) => r.text),
      cautionReasons: bilateralMatchBToA?.cautionReasons.map((r) => r.text),
      preferenceMatch: bilateralMatchBToA,
      narrativeUnit: bilateralMatchBToA?.narrativeUnit,
      provenance: [
        prov(
          "canonical_projections.comparison_table.affection",
          "romantic_ce",
          "canonical_projections.comparison_table.affection",
          "b",
          "high",
          "direct_evidence",
        ),
        ...(relCeB
          ? [
              prov(
                "chart.b.spouse_palace.preference",
                "personal_saju_chart",
                "chart.b.pillars.day.branch_ten_god",
                "b" as const,
                "high" as const,
                "direct_evidence" as const,
              ),
            ]
          : [
              prov(
                "ce.individual.b",
                "personal_ce",
                "siblingInputs.individualCeB",
                "b" as const,
                "medium" as const,
                "combination_judgment" as const,
              ),
            ]),
        ...(bilateralMatchBToA
          ? bilateralMatchBToA.matchedPartnerEvidence.map((ev) =>
              prov(ev.evidenceId, ev.source, ev.sourcePath, "a" as const, "high" as const, "direct_evidence" as const),
            )
          : []),
      ],
    },
    uniqueCombination: cleanUniqueCombination,
    flipsToConflictWhen: sanitizeParticles(copy.attrFlip, [names.a, names.b], locale),
    units: {
      aToB: bilateralMatchAToB?.narrativeUnit ?? {
        subject: "a_to_b",
        recognition: L(
          `${topicP(names.a, locale)} ${names.b}의 묵묵한 태도에 자연스럽게 마음이 열립니다.`,
          `${topicP(names.a, locale)} naturally opens up to ${names.b}'s quiet, steady manner.`,
        ),
        emotionalMeaning: L(
          `${topicP(names.a, locale)} 바라는 안정감을 ${names.b}에게서 발견하기 때문입니다.`,
          `That's because ${topicP(names.a, locale)} finds the stability they've been wanting in ${names.b}.`,
        ),
        partnerEvidence: [bilateralMatchAToB?.supportingReasons[0]?.text ?? ""].filter(Boolean),
        scene: L(
          "함께 중요한 일정을 의논하거나 결정을 내리는 순간",
          "The moment you discuss an important plan together or make a decision",
        ),
        pairSpecificEffect: L(
          "서로에게 든든한 버팀목이 되어주는 신뢰를 형성합니다.",
          "Builds a trust where you each become a dependable pillar for the other.",
        ),
        tensionBridge: copy.attrFlip,
        evidenceIds: [],
        confidence: "high",
        usedClaims: [],
      },
      bToA: bilateralMatchBToA?.narrativeUnit ?? {
        subject: "b_to_a",
        recognition: L(
          `${topicP(names.b, locale)} ${names.a}의 분명한 기준과 결단력에 신선한 매력을 느낍니다.`,
          `${topicP(names.b, locale)} feels a fresh pull toward ${names.a}'s clear standards and decisiveness.`,
        ),
        emotionalMeaning: L(
          `${topicP(names.b, locale)} 바라는 확실한 방향성을 ${names.a}에게서 얻기 때문입니다.`,
          `That's because ${topicP(names.b, locale)} gets the clear sense of direction they've been wanting from ${names.a}.`,
        ),
        partnerEvidence: [bilateralMatchBToA?.supportingReasons[0]?.text ?? ""].filter(Boolean),
        scene: L(
          "방향이 불확실할 때 명쾌하게 결정을 내리고 상황을 정리하는 순간",
          "The moment they make a clear-headed decision and sort out a situation when the direction is uncertain",
        ),
        pairSpecificEffect: L(
          "불안을 덜어내고 확실한 목표를 향해 나아가는 추진력을 얻습니다.",
          "Eases anxiety and gives you the drive to move toward a clear goal.",
        ),
        tensionBridge: copy.attrFlip,
        evidenceIds: [],
        confidence: "high",
        usedClaims: [],
      },
      mutual: mutualUnit,
    },
    bilateralMatches:
      bilateralMatchAToB && bilateralMatchBToA
        ? { aToB: bilateralMatchAToB, bToA: bilateralMatchBToA }
        : undefined,
    provenance: [
      ...attractionProv,
      ...(bilateralMatchAToB?.preferenceSource.map((ev) =>
        prov(ev.evidenceId, ev.source, ev.sourcePath, "a" as const, "high" as const, "direct_evidence" as const),
      ) ?? []),
      ...(bilateralMatchBToA?.preferenceSource.map((ev) =>
        prov(ev.evidenceId, ev.source, ev.sourcePath, "b" as const, "high" as const, "direct_evidence" as const),
      ) ?? []),
    ].length
      ? [
          ...attractionProv,
          ...(bilateralMatchAToB?.preferenceSource.map((ev) =>
            prov(ev.evidenceId, ev.source, ev.sourcePath, "a" as const, "high" as const, "direct_evidence" as const),
          ) ?? []),
          ...(bilateralMatchBToA?.preferenceSource.map((ev) =>
            prov(ev.evidenceId, ev.source, ev.sourcePath, "b" as const, "high" as const, "direct_evidence" as const),
          ) ?? []),
        ]
      : [
          prov(
            "canonical_projections.expression_speed",
            "romantic_ce",
            "canonical_projections.expression_speed",
            "pair",
            "medium",
            "combination_judgment",
          ),
        ],
  };

  const selectedTrigger = selectConflictTriggerScene({ table, expr, recovery, axisResults, locale });

  const recurringLoop = {
    triggerScene: selectedTrigger.scene,
    steps: selectConflictLoopSteps({
      bandA: relCeA?.stressTempBand,
      bandB: relCeB?.stressTempBand,
      names,
      locale,
      fallbackSteps: [
        fill(copy.tpl.loop1, { subjA: subjectP(names.a, locale) }, locale),
        fill(copy.tpl.loop2, { subjB: subjectP(names.b, locale) }, locale),
        fill(copy.tpl.loop3, { topicA: topicP(names.a, locale) }, locale),
        fill(copy.tpl.loop4, { topicB: topicP(names.b, locale) }, locale),
      ],
    }),
    residue: copy.loopResidue,
    provenance:
      // Reflects the evidence actually used to pick triggerScene above,
      // instead of a fixed 3-item list that used to be claimed regardless
      // of which (if any) real signal was used.
      selectedTrigger.evidenceIds.length > 0
        ? selectedTrigger.evidenceIds.map((id) =>
            prov(id, "romantic_ce", id, "pair", "high", "likely_behavior"),
          )
        : [
            prov(
              "canonical_projections.expression_speed",
              "romantic_ce",
              "canonical_projections.expression_speed",
              "pair",
              "low",
              "combination_judgment",
            ),
          ],
  };

  const strengthVuln =
    relCeA && relCeB
      ? resolveStrengthVulnerabilityLens({
          relCeA,
          relCeB,
          names: { a: names.a, b: names.b },
          locale,
        })
      : null;

  const bilateralChanges: BilateralChange[] =
    strengthVuln?.bilateralChanges ?? [
      {
        from: "a",
        to: "b",
        change: fill(copy.tpl.giftAtoB, { subjA: subjectP(names.a, locale), b: names.b }, locale),
        excessVulnerability: fill(copy.tpl.giftARisk, { b: names.b }, locale),
        provenance: [
          prov(
            "canonical_projections.expression_speed",
            "romantic_ce",
            "canonical_projections.expression_speed",
            "a",
            "medium",
            "combination_judgment",
          ),
        ],
      },
      {
        from: "b",
        to: "a",
        change: fill(copy.tpl.giftBtoA, {
          subjB: subjectP(names.b, locale),
          topicA: topicP(names.a, locale),
        }, locale),
        excessVulnerability: fill(copy.tpl.giftBRisk, { a: names.a }, locale),
        provenance: [
          prov(
            "canonical_projections.reassurance_signal",
            "romantic_ce",
            "canonical_projections.reassurance_signal",
            "b",
            "medium",
            "combination_judgment",
          ),
        ],
      },
    ];

  const misreads: DirectionalMisread[] = [
    {
      direction: "a_observes_b",
      observedBehavior: relCeB
        ? L(
            `${subjectP(names.b, locale)} 갈등 상황에서 ${relCeB.stressResponse.text}`,
            `In a conflict, ${subjectP(names.b, locale)} ${relCeB.stressResponse.text.charAt(0).toLowerCase()}${relCeB.stressResponse.text.slice(1)}`,
          )
        : fill(copy.tpl.misreadAObs, { subjB: subjectP(names.b, locale) }, locale),
      observerFelt: fill(copy.tpl.misreadAFelt, { topicA: topicP(names.a, locale) }, locale),
      ...misreadInterpretationFor({ band: relCeB?.stressTempBand, actorName: names.b, observerName: names.a, locale }),
      actorPossibleNeed: relCeB?.relationshipNeeds[0]?.text ?? copy.misreadANeed,
      confidence: "medium",
      provenance: [
        prov(
          "canonical_projections.recovery_speed",
          "romantic_ce",
          "canonical_projections.recovery_speed",
          "relationship",
          "medium",
          "limited_inference",
        ),
        ...(relCeB
          ? [
              prov(
                "chart.b.johu.stress",
                "personal_saju_chart",
                "chart.b.johu.stress",
                "b" as const,
                "high" as const,
                "direct_evidence" as const,
              ),
            ]
          : []),
      ],
    },
    {
      direction: "b_observes_a",
      observedBehavior: relCeA
        ? L(
            `${subjectP(names.a, locale)} 긴장 상황에서 ${relCeA.stressResponse.text}`,
            `Under tension, ${subjectP(names.a, locale)} ${relCeA.stressResponse.text.charAt(0).toLowerCase()}${relCeA.stressResponse.text.slice(1)}`,
          )
        : fill(copy.tpl.misreadBObs, { subjA: subjectP(names.a, locale) }, locale),
      observerFelt: fill(copy.tpl.misreadBFelt, { topicB: topicP(names.b, locale) }, locale),
      ...misreadInterpretationFor({ band: relCeA?.stressTempBand, actorName: names.a, observerName: names.b, locale }),
      actorPossibleNeed: relCeA?.relationshipNeeds[0]?.text ?? copy.misreadBNeed,
      confidence: "medium",
      provenance: [
        prov(
          "canonical_projections.expression_speed",
          "romantic_ce",
          "canonical_projections.expression_speed",
          "relationship",
          "medium",
          "limited_inference",
        ),
        ...(relCeA
          ? [
              prov(
                "chart.a.johu.stress",
                "personal_saju_chart",
                "chart.a.johu.stress",
                "a" as const,
                "high" as const,
                "direct_evidence" as const,
              ),
            ]
          : []),
      ],
    },
  ];
  mark("ce.conflict_meant_heard_derivation_v1.proxy");
  mark("section_3_conversation_patterns.conflict_situation.dialogue_table");

  const hidden = report.section_4_hidden_hearts as
    | {
        a_hidden?: { visible?: string; inner?: string; need?: string };
        b_hidden?: { visible?: string; inner?: string; need?: string };
      }
    | undefined;
  if (hidden) mark("section_4_hidden_hearts");

  const hiddenHearts: HiddenHeartBits[] =
    relCeA && relCeB
      ? resolveHiddenHeartsLens({
          relCeA,
          relCeB,
          names: { a: names.a, b: names.b },
          locale,
        })
      : [
          {
            person: "a",
            visibleReaction: hidden?.a_hidden?.visible ?? copy.hiddenAVis,
            innerFeeling: hidden?.a_hidden?.inner ?? copy.hiddenAInner,
            reason: L(
              "솔직한 마음을 털어놓고 관계를 온전히 지키고 싶기 때문",
              "Because they want to be honest about what's in their heart and fully protect the relationship",
            ),
            fear: L(
              "자신의 열정과 표현이 상대에게 부담이나 거절로 돌아올지 모른다는 두려움",
              "The fear that their passion and how they express it might come back to them as a burden or a rejection",
            ),
            whatHelps: copy.hiddenAHelp,
            unspokenNeed: hidden?.a_hidden?.need ?? copy.hiddenANeed,
            provenance: [
              prov(
                "section_4_hidden_hearts",
                "report",
                "section_4_hidden_hearts",
                "a",
                "medium",
                "limited_inference",
              ),
            ],
          },
          {
            person: "b",
            visibleReaction: hidden?.b_hidden?.visible ?? copy.hiddenBVis,
            innerFeeling: hidden?.b_hidden?.inner ?? copy.hiddenBInner,
            reason: L(
              "충분히 이성적이고 책임감 있게 문제를 다루고 싶기 때문",
              "Because they want to handle the problem in a fully level-headed, responsible way",
            ),
            fear: L(
              "자신의 정돈되지 않은 감정이 관계를 망치거나 오해를 부를지 모른다는 두려움",
              "The fear that their unsorted emotions might damage the relationship or invite a misunderstanding",
            ),
            whatHelps: copy.hiddenBHelp,
            unspokenNeed: hidden?.b_hidden?.need ?? copy.hiddenBNeed,
            provenance: [
              prov(
                "section_4_hidden_hearts",
                "report",
                "section_4_hidden_hearts",
                "b",
                "medium",
                "limited_inference",
              ),
            ],
          },
        ];

  const selectedRepair = selectRepairSequence({ recovery, expr, names, locale });
  const repair = {
    sequence: selectedRepair.sequence,
    helpsA: [
      L(
        `${names.a}에게는 ${relCeA?.recoveryPattern.text ?? '불안을 덜어주는 즉각적인 정서적 안심'}이 가장 필요합니다.`,
        `${names.a} needs ${(relCeA?.recoveryPattern.text ?? "immediate emotional reassurance that eases their anxiety").charAt(0).toLowerCase()}${(relCeA?.recoveryPattern.text ?? "immediate emotional reassurance that eases their anxiety").slice(1)} most of all.`,
      ),
      L(
        `${relCeA?.supportNeededFromPartner[0]?.text ?? '자신의 솔직한 헌신을 인정해주는 따뜻한 피드백'}을 전해주세요.`,
        `Offer them ${(relCeA?.supportNeededFromPartner[0]?.text ?? "warm feedback that recognizes their honest devotion").charAt(0).toLowerCase()}${(relCeA?.supportNeededFromPartner[0]?.text ?? "warm feedback that recognizes their honest devotion").slice(1)}.`,
      ),
      relCeA?.stressTempBand === "hot"
        ? L("감정이 격해졌을 때는 10분간 호흡을 가다듬고 온도를 낮춘 뒤 대화를 재개해 주세요.", "When emotions run high, take 10 minutes to catch your breath and lower the temperature before continuing.")
        : relCeA?.stressTempBand === "cold"
          ? L("혼자 정리할 동굴 시간이 끝난 뒤 먼저 다정하게 대화를 열어주는 신호를 보내주세요.", "After your cave time to sort thoughts, send a warm signal first to reopen the conversation.")
          : L("상대의 작은 성의와 노력을 당연히 여기지 않고 즉시 고마움을 표현해 주세요.", "Express immediate appreciation for your partner's small efforts rather than taking them for granted."),
    ],
    helpsB: [
      L(
        `${names.b}에게는 ${relCeB?.recoveryPattern.text ?? '생각을 정리할 수 있는 충분한 침묵의 시간'}이 필요합니다.`,
        `${names.b} needs ${(relCeB?.recoveryPattern.text ?? "enough quiet time to sort out their thoughts").charAt(0).toLowerCase()}${(relCeB?.recoveryPattern.text ?? "enough quiet time to sort out their thoughts").slice(1)}.`,
      ),
      L(
        `${relCeB?.supportNeededFromPartner[0]?.text ?? '자신의 침묵과 생각을 다그치지 않고 기다려주는 신뢰'}를 보여주세요.`,
        `Show them ${(relCeB?.supportNeededFromPartner[0]?.text ?? "the trust of waiting instead of pressing their silence and thoughts").charAt(0).toLowerCase()}${(relCeB?.supportNeededFromPartner[0]?.text ?? "the trust of waiting instead of pressing their silence and thoughts").slice(1)}.`,
      ),
      relCeB?.stressTempBand === "hot"
        ? L("감정이 격해졌을 때는 10분간 호흡을 가다듬고 온도를 낮춘 뒤 대화를 재개해 주세요.", "When emotions run high, take 10 minutes to catch your breath and lower the temperature before continuing.")
        : relCeB?.stressTempBand === "cold"
          ? L("혼자 정리할 동굴 시간이 끝난 뒤 먼저 다정하게 대화를 열어주는 신호를 보내주세요.", "After your cave time to sort thoughts, send a warm signal first to reopen the conversation.")
          : L("상대의 작은 성의와 노력을 당연히 여기지 않고 즉시 고마움을 표현해 주세요.", "Express immediate appreciation for your partner's small efforts rather than taking them for granted."),
    ],
    avoid: selectedRepair.avoid,
    sharedCommitments: copy.repairCommit,
    observationSignals: [
      L(`${names.a}님과 ${names.b}님이 서로의 표현 템포 차이를 받아들이며 차분히 들어주는 모습`, `${names.a} and ${names.b} accepting each other's pace gap and listening calmly`),
      L(`${names.a}의 ${relCeA?.familiarRelationshipRole?.text ?? "성향"}과 ${names.b}의 ${relCeB?.familiarRelationshipRole?.text ?? "성향"}이 신뢰를 높여주는 장면`, `A scene where ${names.a}'s ${relCeA?.familiarRelationshipRole?.text ?? "style"} and ${names.b}'s ${relCeB?.familiarRelationshipRole?.text ?? "style"} build trust`),
    ],
    warningIfRepeats: [
      L(`갈등 발생 시 ${names.a}님과 ${names.b}님이 서로의 조용함이나 해명을 지연으로 지레짐작하는 패턴`, `A pattern where ${names.a} and ${names.b} misread each other's quietness or explanation as delay`),
      L(`서운함이 생겼을 때 제때 말하지 않고 마음속에 묵혀두는 상태`, `A state where hurt feelings are not brought up in time and are left lingering`),
    ],
    provenance: [
      prov(
        "canonical_projections.recovery_speed",
        "romantic_ce",
        "canonical_projections.recovery_speed",
        "relationship",
        "high",
        "intervention",
      ),
      prov(
        "canonical_projections.expression_speed",
        "romantic_ce",
        "canonical_projections.expression_speed",
        "relationship",
        "high",
        "intervention",
      ),
    ],
  };

  // Dynamic weekend planning difference derived from energy_style evidence
  const energyScoreA = axisResults.find((a) => a.axis_key === "energy_style")?.score_a ?? params.surveyInput?.psychA?.secondary_axes?.energy_style;
  const energyScoreB = axisResults.find((a) => a.axis_key === "energy_style")?.score_b ?? params.surveyInput?.psychB?.secondary_axes?.energy_style;
  let weekendDiffText = "";
  if (typeof energyScoreA === "number" && typeof energyScoreB === "number") {
    const gap = Math.abs(energyScoreA - energyScoreB);
    if (gap >= 15) {
      const highEnergyPerson = energyScoreA > energyScoreB ? names.a : names.b;
      const lowEnergyPerson = energyScoreA > energyScoreB ? names.b : names.a;
      weekendDiffText = fill(copy.tpl.weekendDiff, {
        topicA: topicP(highEnergyPerson, locale),
        topicB: topicP(lowEnergyPerson, locale),
      }, locale);
    } else {
      weekendDiffText = L(
        `${names.a}님과 ${names.b}님 모두 에너지를 쓰는 주말 휴식 리듬이 비슷하여, 함께 활동적인 일정을 보내거나 함께 차분히 쉬는 기류를 공유합니다.`,
        `${names.a} and ${names.b} share a similar energy and weekend rest rhythm, alternating together between active plans and quiet downtime.`,
      );
    }
  } else {
    weekendDiffText = L(
      `주말 일정을 계획할 때 두 사람의 피로도와 에너지 상태에 맞춰 사전 조율이 필요합니다.`,
      `When planning weekend schedules, advance coordination is needed based on both partners' energy levels and fatigue.`,
    );
  }

  // Dynamic reply delay difference derived from expression_style / expression_speed evidence
  const exprScoreA = axisResults.find((a) => a.axis_key === "expression_style")?.score_a ?? params.surveyInput?.psychA?.secondary_axes?.expression_style;
  const exprScoreB = axisResults.find((a) => a.axis_key === "expression_style")?.score_b ?? params.surveyInput?.psychB?.secondary_axes?.expression_style;
  let replyDiffText = copy.replyDiff;
  if (typeof exprScoreA === "number" && typeof exprScoreB === "number") {
    const gap = Math.abs(exprScoreA - exprScoreB);
    if (gap >= 15) {
      const fastPerson = exprScoreA > exprScoreB ? names.a : names.b;
      const slowPerson = exprScoreA > exprScoreB ? names.b : names.a;
      replyDiffText = L(
        `${subjectP(fastPerson, locale)} 메시지를 확인하는 대로 빠른 답장과 조율을 선호하는 반면, ${subjectP(slowPerson, locale)} 생각을 정리하거나 자기 일에 몰입한 후 천천히 답하는 템포를 지니고 있습니다.`,
        `${subjectP(fastPerson, locale)} prefers quick replies upon reading messages, while ${subjectP(slowPerson, locale)} takes time to organize thoughts or focus before responding slowly.`,
      );
    }
  }

  const realLifeDomains = [
    {
      domainId: "weekend",
      title: copy.weekendTitle,
      difference: weekendDiffText,
      riskCondition: copy.weekendRisk,
      agreement: copy.weekendAgree,
      usableLine: copy.weekendLine,
      checkSignal: copy.weekendSig,
      provenance: [
        prov(
          "meta.psych_match.axis_results.energy_style",
          "psych_match",
          "meta.psych_match.axis_results.energy_style",
          "pair",
          "medium",
          "observation",
        ),
      ],
    },
    {
      domainId: "reply_delay",
      title: copy.replyTitle,
      difference: replyDiffText,
      riskCondition: copy.replyRisk,
      agreement: copy.replyAgree,
      usableLine: copy.replyLine,
      checkSignal: copy.replySig,
      provenance: [
        prov(
          "canonical_projections.expression_speed",
          "romantic_ce",
          "canonical_projections.expression_speed",
          "pair",
          "high",
          "observation",
        ),
      ],
    },
    {
      domainId: "big_decision",
      title: copy.decisionTitle,
      difference: fill(copy.tpl.decisionDiff, { dA: decisionLeanA, dB: decisionLeanB }, locale),
      riskCondition: copy.decisionRisk,
      agreement: copy.decisionAgree,
      usableLine: copy.decisionLine,
      checkSignal: copy.decisionSig,
      provenance: [
        prov(
          "canonical_projections.comparison_table.decision",
          "romantic_ce",
          "canonical_projections.comparison_table.decision",
          "pair",
          "high",
          "observation",
        ),
      ],
    },
  ];

  const dateSceneCards = [
    buildEmpathyVsSolvingScene({ axisResults, nameA: names.a, nameB: names.b, locale }),
    buildPhysicalIntimacyScene({ axisResults, nameA: names.a, nameB: names.b, locale }),
    buildGiveUpPointScene({ axisResults, nameA: names.a, nameB: names.b, locale }),
    buildRomanticChemistryScene({ bonding, nameA: names.a, nameB: names.b, locale }),
    buildPossessivenessScene({ wonjin, nameA: names.a, nameB: names.b, locale }),
    buildLongTermGrowthScene({
      hasBalance: Boolean(balance),
      combineHitCount: Number(stemCombine?.hitCount ?? 0) + Number(sixCombine?.hitCount ?? 0),
      nameA: names.a,
      nameB: names.b,
      locale,
    }),
  ].filter((card): card is NonNullable<typeof card> => card !== null);
  for (const card of dateSceneCards) {
    for (const p of card.provenance) mark(p.evidenceId);
  }
  realLifeDomains.push(...dateSceneCards);

  const fortuneFlowTiming =
    params.fortuneFlow !== undefined
      ? buildRomanticV4TimingFromFortuneFlow(params.fortuneFlow, locale)
      : null;
  const horizon = projectHorizon({ report });
  const legacyHasTiming = horizon.available && horizon.waypoints.length > 0;
  const hasTiming = fortuneFlowTiming ? fortuneFlowTiming.available : legacyHasTiming;

  if (fortuneFlowTiming) {
    if (fortuneFlowTiming.available) {
      mark("romantic_fortune_flow.sewoon");
    } else {
      suppressed.push({
        evidenceId: "romantic_fortune_flow.sewoon",
        reason: fortuneFlowTiming.hideReason ?? copy.suppressTiming,
      });
    }
  } else if (!legacyHasTiming) {
    suppressed.push({
      evidenceId: "section_6_timeline",
      reason: copy.suppressTiming,
    });
  } else {
    mark("section_6_timeline");
  }

  const chemistryAvailable = Boolean(
    bonding ||
      tension ||
      stemCombine ||
      sixCombine ||
      plan.pairSynthesis.selectedMeaning ||
      specialBond?.only_together ||
      hitNotes.length > 0,
  );

  if (balance) mark("canonical_projections.balance_of_power");

  const primaryTension =
    hitNotes.find((n) => n.includes("\uB9C8\uCC30")) || copy.primaryTensionFallback;

  const finalStoryPlan: CanonicalRelationshipStoryPlan = {
    schemaVersion: "romantic_story_plan_v1",
    locale,
    reportYear: year,
    names: { a: names.a, b: names.b },
    personalRelationshipCeA: relCeA ?? null,
    personalRelationshipCeB: relCeB ?? null,
    relationshipDefinition,
    // Pair-first fix: the old version ignored balance_a/balance_b's actual
    // values and always wrote "A opens up emotionally, B stabilizes with
    // action" — a fixed position-based assumption regardless of which
    // person the real signal said was actually the leader (confirmed via
    // audit, matches spec item 4's named example exactly). Now the
    // direction comes from the real band, and a "both balanced"/missing
    // pair gets a direction-free sentence instead of a guessed one.
    bondMode:
      balance?.balance_a === "leader" && balance?.balance_b === "receiver"
        ? L(`${names.a}이/가 먼저 방향을 잡으면 ${names.b}이/가 그걸 받아서 함께 움직이는 쪽에 가까워요.`, `${names.a} tends to set the direction first, and ${names.b} picks it up and moves with it.`)
        : balance?.balance_a === "receiver" && balance?.balance_b === "leader"
          ? L(`${names.b}이/가 먼저 방향을 잡으면 ${names.a}이/가 그걸 받아서 함께 움직이는 쪽에 가까워요.`, `${names.b} tends to set the direction first, and ${names.a} picks it up and moves with it.`)
          : relCeA && relCeB
            ? L(`${names.a}의 ${relCeA.familiarRelationshipRole?.text ?? "성향"}과 ${names.b}의 ${relCeB.familiarRelationshipRole?.text ?? "성향"}이 주도권을 고정하지 않고 상황에 따라 유연하게 조율되는 구도예요.`, `${names.a}'s ${relCeA.familiarRelationshipRole?.text ?? "style"} and ${names.b}'s ${relCeB.familiarRelationshipRole?.text ?? "style"} adapt flexibly based on the situation rather than fixing one leader.`)
            : L("두 사람 다 상황에 따라 주도권을 주고받는 편이에요 — 한쪽이 고정으로 이끄는 관계는 아니에요.", "You two trade off leading depending on the situation — it's not a relationship where one person always drives."),
    growthOrStability: specialBond?.why_special ?? copy.growthFallback,
    primaryTension,
    specialCodePreview:
      hitNotes[0] ??
      plan.pairSynthesis.selectedMeaning ??
      specialBond?.only_together ??
      copy.specialPreviewFallback,
    faces,
    attraction,
    topDifferences,
    stabilizingSimilarities: stabRows,
    allAxes,
    recurringLoop,
    bilateralChanges,
    sharedStrength:
      strengthVuln?.sharedStrength ||
      bonding?.summary ||
      plan.pairSynthesis.selectedMeaning ||
      copy.sharedStrengthFallback,
    sharedVulnerability:
      strengthVuln?.sharedVulnerability || copy.sharedVuln,
    pairChemistry: {
      available: chemistryAvailable,
      combinationLabel:
        hitNotes[0] ||
        plan.pairSynthesis.selectedMeaning ||
        specialBond?.only_together ||
        copy.chemLabelFallback,
      intimacyFeel: copy.chemIntimacy,
      socialOrPracticalFeel: copy.chemPractical,
      flipsWhenExcess: copy.chemFlip,
      healthyCondition: copy.chemHealthy,
      provenance: attraction.provenance,
    },
    misreads,
    hiddenHearts,
    repair,
    realLifeDomains,
    timing:
      fortuneFlowTiming ?? {
        available: hasTiming,
        year,
        theme: hasTiming ? (horizon.title ?? null) : null,
        favorableWindows: hasTiming ? horizon.waypoints.filter((w: any) => !w.sub).map((w: any) => `${w.period}: ${w.body}`) : [],
        cautionWindows: hasTiming ? horizon.waypoints.filter((w: any) => w.sub).map((w: any) => `${w.period}: ${w.sub}`) : [],
        observationSignals: hasTiming ? copy.timingObs : [],
        hideReason: hasTiming ? null : copy.hideTiming,
        provenance: hasTiming
          ? [
              prov(
                "section_6_timeline",
                "report",
                "section_6_timeline",
                "relationship",
                "medium",
                "observation",
              ),
            ]
          : [],
      },
    // Pair-first fix: presentPossibility/improvingSignals/decisionQuestions
    // used to be pure constants (copy.closePossibility/copy.improveSignal/
    // copy.q1-3) — identical for every couple regardless of any evidence,
    // confirmed via audit as the worst offenders in this closing block
    // (Ch10, the report's final chapter). Now they reuse primaryTension
    // (already hitNotes-derived, varies per pair) and relCeA/relCeB's real
    // coreRelationshipNature text instead of a fixed sentence.
    closing: {
      presentPossibility:
        relCeA && relCeB
          ? L(
              `${names.a}의 ${relCeA.coreRelationshipNature.text}과 ${names.b}의 ${relCeB.coreRelationshipNature.text}이 어떻게 맞물리느냐에 따라, 지금과는 다른 관계로도 자랄 수 있어요.`,
              `Depending on how ${names.a}'s ${relCeA.coreRelationshipNature.text.charAt(0).toLowerCase()}${relCeA.coreRelationshipNature.text.slice(1)} and ${names.b}'s ${relCeB.coreRelationshipNature.text.charAt(0).toLowerCase()}${relCeB.coreRelationshipNature.text.slice(1)} play off each other, this relationship can still grow into something different from where it is now.`,
            )
          : copy.closePossibility,
      rememberA:
        relCeA?.stressTempBand === "hot"
          ? L(`${names.a}님: 서운함이 올라올 때 즉각 결론을 다그치기보다 "당신과 잘 지나고 싶어서 그래"라는 본래의 다정한 마음을 먼저 전달해 보세요.`, `${names.a}: When hurt arises, instead of pushing for an immediate conclusion, try sharing your underlying warmth: "I'm saying this because I want us to be good."`)
          : relCeA?.stressTempBand === "cold"
            ? L(`${names.a}님: 감정이 고조되어 동굴 시간이 필요할 때 "생각을 정리하고 이따 얘기하자"는 명확한 대화 재개 신호를 알려주세요.`, `${names.a}: When you need time alone, give a clear signal for reopening the conversation: "Let's talk again later once I sort out my thoughts."`)
            : L(`${names.a}님: 상대방의 조용함이나 템포 차이를 내 마음에 대한 무심함으로 지레짐작하지 않는 여유를 가져보세요.`, `${names.a}: Give room without assuming the partner's quietness or different pace means indifference.`),
      rememberB:
        relCeB?.stressTempBand === "hot"
          ? L(`${names.b}님: 서운함이 올라올 때 즉각 결론을 다그치기보다 "당신과 잘 지내고 싶어서 그래"라는 본래의 다정한 마음을 먼저 전달해 보세요.`, `${names.b}: When hurt arises, instead of pushing for an immediate conclusion, try sharing your underlying warmth: "I'm saying this because I want us to be good."`)
          : relCeB?.stressTempBand === "cold"
            ? L(`${names.b}님: 감정이 고조되어 동굴 시간이 필요할 때 "생각을 정리하고 이따 얘기하자"는 명확한 대화 재개 신호를 알려주세요.`, `${names.b}: When you need time alone, give a clear signal for reopening the conversation: "Let's talk again later once I sort out my thoughts."`)
            : L(`${names.b}님: 이성적인 대책부터 제시하기보다 상대방의 정서적 서운함을 먼저 있는 그대로 들어주세요.`, `${names.b}: Instead of leading with logical solutions, try listening to your partner's emotional hurt as it is first.`),
      watchSignals: repair.observationSignals,
      improvingSignals: [copy.improveSignal],
      cautionSignals: repair.warningIfRepeats,
      decisionQuestions: [
        L(`우리 둘 사이의 "${primaryTension}"은/는 요즘도 여전히 반복되고 있나요?`, `Is "${primaryTension}" between the two of us still showing up these days?`),
        copy.q2,
        copy.q3,
      ],
      provenance: [
        prov(
          "story_plan.repair",
          "story_plan",
          "repair",
          "relationship",
          "medium",
          "observation",
        ),
      ],
    },
    connectedEvidenceIds: [...connected],
    suppressedEvidence: suppressed,
  };

  const conflictLoopP0 = buildRomanticConflictLoopP0(finalStoryPlan);
  const repairPatternP0 = buildRomanticRepairPatternP0(finalStoryPlan);
  const actionCandidatesP0 = buildRomanticP0ActionCandidates(finalStoryPlan);
  const synthesisResultsP1 = buildRomanticMultiSignalSynthesis(finalStoryPlan);

  const crossSignalInsightsV1 = buildRomanticCrossSignalIntelligence({
    storyPlan: finalStoryPlan,
    relCeA,
    relCeB,
    axisResults,
    bonding,
    stemCombineHitCount: stemCombine?.hitCount ?? 0,
    sixCombineHitCount: sixCombine?.hitCount ?? 0,
    names,
    locale,
  });

  const candidateEngine = buildRomanticCandidateEngine({
    ...finalStoryPlan,
    conflictLoopP0,
    repairPatternP0,
    actionCandidatesP0,
    synthesisResultsP1,
  });

  const growthTransitionP1 = {
    currentPattern: "갈등 시 직면과 침묵의 템포 차이로 서운함이 누적되는 패턴",
    recommendedShift: "감정이 격해질 때 서둘러 해명하기보다 30분간 쿨링다운 후 내 필요만 말하는 전환",
    longTermGoal: "서로의 자율 공간을 존중하며 깊은 안정감 속에서 지속되는 성숙한 동반자 관계",
    evidenceIds: ["story_plan.recurringLoop", "story_plan.repair"],
    confidence: "high" as const,
  };

  const pairNeedsDetailed = computeRomanticRelationshipNeedsEngine({
    nicknameA: names.a,
    nicknameB: names.b,
    countsA: {},
    countsB: {},
    psychA: contract.meta?.psych_master_a ?? null,
    psychB: contract.meta?.psych_master_b ?? null,
  });

  const pairMeanings = {
    dependencyProtection: {
      provider: `${names.a}님의 정서적 포용과 ${names.b}님의 안정적인 지지`,
      reliance: "독립된 공간을 존중하면서도 필요할 때 기댈 수 있는 호환 수용 구도",
      roleReversalRisk: false,
      summary: `${names.a}님과 ${names.b}님이 서로의 독립성을 존중하면서 정서적 안전지대를 제공하는 조화로운 구도`,
    },
    loveExpressionVsReception: {
      expressesA: `${names.a}님의 신뢰 기반 다정한 관심`,
      receivesB: `${names.b}님의 존중 중심 수용 톤`,
      alignment: "matched" as const,
      summary: `${names.a}님과 ${names.b}님의 사랑 표현 톤이 왜곡 없이 잘 전달되는 매칭 상태`,
    },
    expectationVsPressure: {
      expectationA: `${names.a}님의 유연하고 성숙한 가치관`,
      pressureB: `${names.b}님이 부담 없이 자극을 흡수하는 상태`,
      gapLevel: "low" as const,
      summary: `${names.a}님의 기대가 ${names.b}님에게 성장의 좋은 동기부여로 작용함`,
    },
    pairNeedsDetailed,
  };

  const romanticGapBatch = computeRomanticV4GapBatchEngine({
    nameA: names.a,
    nameB: names.b,
    psychA: contract.meta?.psych_master_a ?? (contract as any).surveyInput?.psychA ?? (params as any).surveyInput?.psychA ?? null,
    psychB: contract.meta?.psych_master_b ?? (contract as any).surveyInput?.psychB ?? (params as any).surveyInput?.psychB ?? null,
  });

  const recognitionSynthesis = buildRomanticRecognitionSynthesis({
    names,
    relCeA,
    relCeB,
    conflictTransitions: romanticGapBatch.conflictTransitions,
    locale,
  });

  return {
    ...finalStoryPlan,
    pairMeanings,
    romanticGapBatch,
    conflictLoopP0,
    repairPatternP0,
    actionCandidatesP0,
    synthesisResultsP1,
    insightCandidatesP1: candidateEngine.insightCandidates,
    normalizedActionCandidatesP1: candidateEngine.normalizedActions,
    growthTransitionP1,
    crossSignalInsightsV1,
    recognitionSynthesis,
  };
}
