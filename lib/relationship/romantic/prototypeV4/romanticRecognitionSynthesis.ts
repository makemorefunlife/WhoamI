/**
 * Final Evidence-to-Voice pass, items 3 & 4 — a small deterministic
 * synthesis layer, following the same evidence-gated pattern already
 * established by Cross-Signal Intelligence V1 (romanticCrossSignalIntelligence.ts):
 * fire only when the required signals genuinely exist, carry evidenceRefs/
 * claimBoundary/suggestedChapter on every insight, never invent a scene.
 *
 * Computed-only in this pass, same as Cross-Signal V1 originally shipped —
 * attached to the story plan for testing/future consumption, not yet wired
 * into composeCanonicalSectionNarratives' render path (that consumption
 * step, if wanted, is out of scope for this "small, strict" pass).
 *
 * Two insight types:
 *   - shared_goal_different_strategy: fires only when both people are
 *     confirmed Harmony-Adapter (computeConflictStateTransitionPair) AND a
 *     real secondary-axis gap differentiated their response — i.e. exactly
 *     the "same underlying goal, different execution" case, never fabricated.
 *   - persona_hidden_need_contradiction: fires only when real chart-derived
 *     PersonalRelationshipCe data exists for a person — synthesizes their
 *     outer/familiar relational role with their hidden inner need into one
 *     insight, instead of the report stating both facts separately as if
 *     unrelated.
 */
import type { RomanticRecognitionInsight } from "./canonicalStoryPlanTypes";
import type { ConflictStateTransitionPair } from "./romanticV4GapBatchEngine";
import type { PersonalRelationshipCe } from "./personalRelationshipCe";
import { pick, topicP, type NarrativeLocale } from "./narrativeLocale";

export type { RomanticRecognitionInsight, RomanticRecognitionInsightType } from "./canonicalStoryPlanTypes";

function buildSharedGoalDifferentStrategyInsight(
  conflictTransitions: ConflictStateTransitionPair,
  locale: NarrativeLocale,
): RomanticRecognitionInsight | null {
  // Only the middle case: both confirmed Harmony-Adapter (shared underlying
  // goal) AND a real secondary gap differentiated tensionRising — NOT the
  // "truly identical, sharedBaseline set" case (no strategy difference to
  // report), and NOT the "different patterns from the start" case (not a
  // shared-goal story at all).
  if (!conflictTransitions.wasHarmonyDifferentiated) return null;

  const L = (ko: string, en: string) => pick(locale, ko, en);
  const { transitionA, transitionB } = conflictTransitions;

  return {
    id: "recognition.shared_goal_different_strategy",
    insightType: "shared_goal_different_strategy",
    subject: "pair",
    evidenceRefs: ["gap_batch.conflict_transitions.transition_a", "gap_batch.conflict_transitions.transition_b"],
    sourceSignals: ["conflictStateTransition.transitionA", "conflictStateTransition.transitionB"],
    derivedMeaning: L(
      `둘 다 관계의 평화를 지키고 싶어 하는 마음은 같습니다. 다만 ${topicP(transitionA.personName, locale)} ${transitionA.tensionRising}, ${topicP(transitionB.personName, locale)} ${transitionB.tensionRising} — 같은 목표를 서로 다른 방식으로 풀어가는 셈입니다.`,
      `You both genuinely want to protect the peace between you. But ${transitionA.personName} tends to ${transitionA.tensionRising.charAt(0).toLowerCase()}${transitionA.tensionRising.slice(1)}, while ${transitionB.personName} tends to ${transitionB.tensionRising.charAt(0).toLowerCase()}${transitionB.tensionRising.slice(1)} — the same goal, worked out two different ways.`,
    ),
    confidence: "medium",
    claimBoundary: {
      supported: L(
        "둘 다 관계의 평화·조화를 우선시하는 성향과, 갈등 초기 대응 방식의 실제 차이",
        "Both prioritizing relational harmony, and a real difference in how each responds early in conflict",
      ),
      notSupported: L(
        "실제 다툼에서 이 방식이 항상 그대로 나타난다는 보장, 구체적인 사건이나 대사",
        "A guarantee this always plays out exactly this way in a real fight, or any specific event",
      ),
    },
    suggestedChapter: "c4_conflict",
  };
}

function buildPersonaHiddenNeedInsight(
  subject: "a" | "b",
  name: string,
  relCe: PersonalRelationshipCe | null | undefined,
  locale: NarrativeLocale,
): RomanticRecognitionInsight | null {
  // Only fires when real chart-derived Personal CE data exists — no
  // fabrication when this is the dev-fixture / no-chart path.
  if (!relCe?.familiarRelationshipRole?.text || !relCe?.hiddenVulnerability) return null;

  const outer = relCe.familiarRelationshipRole.text;
  const inner = relCe.hiddenVulnerability.text;
  const L = (ko: string, en: string) => pick(locale, ko, en);

  return {
    id: `recognition.persona_hidden_need.${subject}`,
    insightType: "persona_hidden_need_contradiction",
    subject,
    evidenceRefs: [
      relCe.familiarRelationshipRole.evidenceId,
      relCe.hiddenVulnerability.evidenceId,
    ].filter(Boolean),
    sourceSignals: ["familiarRelationshipRole", "hiddenVulnerability"],
    derivedMeaning: L(
      `밖에서 보면 ${topicP(name, locale)} ${outer}인데, 정작 가까운 관계 안에서는 그 겉모습과는 다른 결의 마음을 품고 있어요. ${inner}`,
      `From the outside, ${name} looks like ${outer.charAt(0).toLowerCase()}${outer.slice(1)}. But underneath, closer in, they're carrying something that doesn't quite match that outer picture. ${inner}`,
    ),
    confidence: "medium",
    claimBoundary: {
      supported: L(
        "겉으로 드러나는 관계 내 역할과, 차트 근거로 뒷받침되는 내면의 숨은 필요 사이의 실제 대비",
        "The real contrast between the outward relational role and the chart-grounded inner need",
      ),
      notSupported: L(
        "이 대비가 스트레스 상황에서의 구체적 행동으로 항상 이어진다는 인과 관계",
        "That this contrast always causally produces specific behavior under stress",
      ),
    },
    suggestedChapter: "c6_hidden_hearts",
  };
}

export function buildRomanticRecognitionSynthesis(params: {
  names: { a: string; b: string };
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  conflictTransitions: ConflictStateTransitionPair;
  locale: NarrativeLocale;
}): RomanticRecognitionInsight[] {
  const { names, relCeA, relCeB, conflictTransitions, locale } = params;

  const insights: RomanticRecognitionInsight[] = [];

  const sharedGoal = buildSharedGoalDifferentStrategyInsight(conflictTransitions, locale);
  if (sharedGoal) insights.push(sharedGoal);

  const personaA = buildPersonaHiddenNeedInsight("a", names.a, relCeA, locale);
  if (personaA) insights.push(personaA);

  const personaB = buildPersonaHiddenNeedInsight("b", names.b, relCeB, locale);
  if (personaB) insights.push(personaB);

  return insights;
}
