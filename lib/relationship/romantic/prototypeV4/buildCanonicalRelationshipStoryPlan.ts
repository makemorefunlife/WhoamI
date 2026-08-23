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
  RomanticCrossSignalInsight,
  RomanticGrowthTransition,
  StoryFace,
} from "./canonicalStoryPlanTypes";
import type { PersonalRelationshipCe } from "./personalRelationshipCe";
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
/** Same helper as chapterLensResolvers.ts's firstClause — first complete
 * clause/sentence of a longer EvidenceBackedMeaning.text, so a supporting
 * line can reference real evidence without re-quoting a multi-sentence
 * field in full. The source text is already in the build's own locale, so
 * one implementation covers both ko-KR and en-US call sites. */
function firstClause(text: string): string {
  const match = /^[\s\S]*?[.!?다요][)"'』」]*(?=\s|$)/.exec(text);
  return (match ? match[0] : text).trim();
}

/** Splits text into clauses and returns the SECOND one when there is one,
 * else the first. Some multi-branch fields (e.g. chapterLensResolvers.ts's
 * sharedStrength "default" bucket) lead with a generic connector sentence
 * before the actually-personalized content — grabbing clause 1 there would
 * silently pick the one sentence shared across every pair in that bucket.
 * Grabbing "second if present" reliably lands on real content across all
 * of that field's branches, since only the generic-first-sentence branch
 * has more than one clause to skip past. */
function secondClauseOrFirst(text: string): string {
  const clauseRe = /[\s\S]*?[.!?다요][)"'』」]*(?=\s|$)/g;
  const clauses = text.match(clauseRe)?.map((s) => s.trim()) ?? [text.trim()];
  return (clauses[1] ?? clauses[0] ?? text).trim();
}

export type ClosingFocusType = "growth" | "repair" | "strength" | "vulnerability_individual" | "vulnerability_shared" | "timing" | "none";

export type ClosingFocusCandidate = {
  type: ClosingFocusType;
  /** Sum of the 4 scored axes below — highest wins. */
  score: number;
  relevance: number;
  confidence: number;
  novelty: number;
  forwardLooking: number;
  /** Raw evidence text this candidate would render from, for inspection —
   * not itself the final sentence (each type owns its own structure,
   * built separately once the winner is picked). */
  evidenceText: string;
};

/**
 * Scores every real closing-evidence candidate for this pair on 4 axes and
 * returns them ranked, highest first. Exported (not just used internally)
 * so live verification can show which candidate won and why, per the
 * spec's requirement — never invented after the fact, this IS the real
 * selection logic.
 *
 * Novelty is scored low for individual/shared vulnerability because those
 * exact fields are already the primary evidence for earlier chapters
 * (hiddenVulnerability drives c6_hidden_hearts; sharedVulnerability drives
 * c8's own shared.vulnerability block) — reusing them again in the closing
 * without a real signal elsewhere would just be summarizing, which the
 * spec explicitly disallows. Timing's confidence is scored low not because
 * the underlying computation is wrong, but because live-testing (previous
 * pass) caught horizon.title colliding across multiple different real
 * pairs — an empirically low-differentiation source, discounted rather
 * than trusted at face value.
 */
export function rankClosingFocusCandidates(params: {
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  growthTransitionP1: RomanticGrowthTransition;
  selectedRepairEvidenceIds: string[];
  sharedStrength?: string;
  sharedVulnerability?: string;
  timingTheme?: string | null;
}): ClosingFocusCandidate[] {
  const { relCeA, relCeB, growthTransitionP1, selectedRepairEvidenceIds, sharedStrength, sharedVulnerability, timingTheme } = params;
  const candidates: ClosingFocusCandidate[] = [];

  if (growthTransitionP1.recommendedShift) {
    candidates.push({
      type: "growth",
      relevance: 3, // the core active friction pattern for this pair
      confidence: growthTransitionP1.confidence === "high" ? 3 : 2,
      novelty: 3, // recommendedShift/longTermGoal are not stated anywhere else
      forwardLooking: 3, // literally a shift + a long-term goal
      score: 0,
      evidenceText: growthTransitionP1.recommendedShift,
    });
  }

  const repairSignalReal = selectedRepairEvidenceIds.length > 0;
  if (repairSignalReal) {
    candidates.push({
      type: "repair",
      relevance: 2,
      confidence: 3,
      novelty: 2, // the mechanism is shown in Ch06; a "progress indicator" framing is new
      forwardLooking: 3,
      score: 0,
      evidenceText: selectedRepairEvidenceIds.join(","),
    });
  }

  if (sharedStrength) {
    candidates.push({
      type: "strength",
      relevance: 2,
      confidence: 2,
      novelty: 1, // Ch08 already states this fairly directly
      forwardLooking: 3,
      score: 0,
      evidenceText: sharedStrength,
    });
  }

  const individualVuln = relCeA?.hiddenVulnerability?.text || relCeB?.hiddenVulnerability?.text;
  if (individualVuln) {
    candidates.push({
      type: "vulnerability_individual",
      relevance: 2,
      confidence: 3,
      novelty: 1, // Ch05/Ch06 already lean heavily on this exact field
      forwardLooking: 2,
      score: 0,
      evidenceText: individualVuln,
    });
  }

  if (sharedVulnerability) {
    candidates.push({
      type: "vulnerability_shared",
      relevance: 2,
      confidence: 2,
      novelty: 1, // Ch08's own shared.vulnerability block already states this
      forwardLooking: 2,
      score: 0,
      evidenceText: sharedVulnerability,
    });
  }

  if (timingTheme) {
    candidates.push({
      type: "timing",
      relevance: 2,
      confidence: 1, // discounted — confirmed low differentiation across pairs
      novelty: 2,
      forwardLooking: 3,
      score: 0,
      evidenceText: timingTheme,
    });
  }

  for (const c of candidates) c.score = c.relevance + c.confidence + c.novelty + c.forwardLooking;
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/** Exported alongside rankClosingFocusCandidates so live verification can
 * call the exact production selection+rendering logic directly with
 * crafted inputs, rather than needing a full report build to exercise a
 * specific branch. */
export function selectClosingFocus(params: {
  names: { a: string; b: string };
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  growthTransitionP1: RomanticGrowthTransition;
  selectedRepairEvidenceIds: string[];
  sharedStrength?: string;
  sharedVulnerability?: string;
  timingTheme?: string | null;
  locale: NarrativeLocale;
}): string {
  const { names, relCeA, relCeB, growthTransitionP1, selectedRepairEvidenceIds, sharedStrength, sharedVulnerability, timingTheme, locale } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const a = names.a;
  const b = names.b;

  const ranked = rankClosingFocusCandidates({ relCeA, relCeB, growthTransitionP1, selectedRepairEvidenceIds, sharedStrength, sharedVulnerability, timingTheme });
  const winner = ranked[0];

  // GROWTH structure: "이 관계는 ~로 바꿀 때 더 편해질 거예요." (spec example)
  if (winner?.type === "growth") {
    return L(
      `이 관계는 ${growthTransitionP1.recommendedShift}, 이런 식으로 바뀔 때 더 편해질 거예요.`,
      `This relationship gets easier when you shift toward this: ${growthTransitionP1.recommendedShift}`,
    );
  }

  // REPAIR structure: "관계가 나아지고 있다는 가장 분명한 신호는 ~예요." (spec example)
  if (winner?.type === "repair") {
    const isRecoverySignal = selectedRepairEvidenceIds.includes("canonical_projections.recovery_speed");
    return isRecoverySignal
      ? L(
          `관계가 나아지고 있다는 가장 분명한 신호는, 회복 속도가 다르다는 사실 자체가 더 이상 서운함으로 번지지 않는 거예요.`,
          `The clearest sign things are improving will be that the gap in how fast you each recover stops turning into hurt on its own.`,
        )
      : L(
          `관계가 나아지고 있다는 가장 분명한 신호는, 침묵의 시간이 불안이 아니라 익숙한 신호로 받아들여지는 거예요.`,
          `The clearest sign things are improving will be that the quiet stretches start reading as a familiar signal, not as anxiety.`,
        );
  }

  // STRENGTH structure: "이 둘의 다음 챕터는 ~이에요." (spec example)
  if (winner?.type === "strength") {
    return L(
      `이 둘의 다음 챕터는, 지금 가진 강점 — ${secondClauseOrFirst(sharedStrength ?? "")} — 을 더 자주 써먹는 쪽에 가까워요.`,
      `The next chapter for these two is about reaching for the strength you already have more often: ${secondClauseOrFirst(sharedStrength ?? "")}`,
    );
  }

  // VULNERABILITY structures: "지금 중요한 건 X가 아니라, Y예요." (spec example)
  if (winner?.type === "vulnerability_individual") {
    const owner = relCeA?.hiddenVulnerability?.text ? a : b;
    const text = relCeA?.hiddenVulnerability?.text ?? relCeB?.hiddenVulnerability?.text ?? "";
    return L(
      `지금 중요한 건 ${owner}이/가 겉으로 어떻게 보이느냐가 아니라, ${firstClause(text)}`,
      `What matters now is not how ${owner} looks from the outside, but this: ${firstClause(text)}`,
    );
  }
  if (winner?.type === "vulnerability_shared") {
    return L(
      `지금 중요한 건 누가 옳았느냐가 아니라, ${firstClause(sharedVulnerability ?? "")}`,
      `What matters now is not who was right, but this: ${firstClause(sharedVulnerability ?? "")}`,
    );
  }

  // TIMING structure: "이 시기는 ~에 쓰는 게 더 나아요." (spec example) — note
  // timingTheme is already a complete sentence, used as the "how" clause.
  if (winner?.type === "timing" && timingTheme) {
    return L(
      `이 시기는 서로를 다그치기보다 지켜보는 데 쓰는 게 더 나아요. ${timingTheme}`,
      `This period is better used watching and waiting than pushing. ${timingTheme}`,
    );
  }

  // No candidate had real evidence — deliberately short and non-predictive.
  return L(
    "지금 이대로도 관계는 계속 만들어지고 있어요.",
    "This relationship keeps taking shape, even just as it is right now.",
  );
}

function selectRepairSequence(params: {
  recovery: { recovery_mismatch?: boolean } | undefined;
  expr: { direction?: string } | undefined;
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  names: { a: string; b: string };
  locale: NarrativeLocale;
}): { sequence: string[]; avoid: string[]; evidenceIds: string[] } {
  const { recovery, expr, relCeA, relCeB, names, locale } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);

  const bandA = relCeA?.stressTempBand;
  const bandB = relCeB?.stressTempBand;

  if (bandA === "hot" && bandB === "cold") {
    return {
      sequence: [
        L(`${names.a}님은 즉각적인 확답을 원해도 ${names.b}님에게는 먼저 감정을 정리할 침묵의 여유가 필요합니다.`, `Even when ${names.a} wants immediate reassurance, ${names.b} needs time alone to sort out feelings first.`),
        L(`${names.b}님이 "지금은 생각이 정리 중이니 20분 뒤에 얘기하자"고 구체적인 대화 재개 시간을 약속하세요.`, `${names.b} should set a concrete time to reopen conversation — "I'm sorting my thoughts, let's talk in 20 minutes."`),
        L(`${names.a}님은 약속된 시간을 믿고 다그치지 않으며 기다려줄 때 감정의 평화가 회복됩니다.`, `${names.a} restores emotional peace by trusting the agreed time without pressing.`),
      ],
      avoid: [
        L(`${names.b}님의 동굴 시간을 '나에게 관심 없다'고 지레짐작하며 압박하는 것`, `Assuming ${names.b}'s cave time means lack of interest and pressing them`),
        L(`${names.b}님이 언제 다시 대화할지 말없이 무작정 방치하는 것`, `${names.b} leaving the conversation without giving a specific time to reconnect`),
      ],
      evidenceIds: ["chart.a.johu.stress", "chart.b.johu.stress"],
    };
  }

  if (bandA === "cold" && bandB === "hot") {
    return {
      sequence: [
        L(`${names.b}님이 빠른 안심을 원하더라도 ${names.a}님에게는 마음을 정리할 여유가 먼저 필요합니다.`, `Even when ${names.b} wants quick reassurance, ${names.a} needs space to sort thoughts first.`),
        L(`${names.a}님이 "지금 말하면 감정이 격해지니 잠시 후 얘기하자"고 명확히 전해주세요.`, `${names.a} should communicate clearly — "If I speak now it'll get heated, let me pause a moment."`),
        L(`${names.b}님이 대화의 톤을 낮추고 들어줄 수 있는 정서적 장을 열어주세요.`, `${names.b} opens an emotional space by lowering their tone and listening.`),
      ],
      avoid: [
        L(`${names.a}님의 침묵을 따지며 즉각적인 해명을 강요하는 것`, `Demanding immediate explanation while questioning ${names.a}'s silence`),
        L(`${names.a}님이 말을 닫고 마음을 감춰버리는 것`, `${names.a} closing off completely without saying anything`),
      ],
      evidenceIds: ["chart.a.johu.stress", "chart.b.johu.stress"],
    };
  }

  if (bandA === "cold" && bandB === "cold") {
    return {
      sequence: [
        L("두 사람 모두 침묵으로 가라앉기 쉬우므로, 서운함이 생겼을 때 반나절 이상 침묵을 길게 끌지 마세요.", "Since both retreat into silence, avoid letting hurt feelings linger past half a day."),
        L("먼저 감정이 가라앉은 쪽에서 다정한 어조로 '맛있는 거 먹으면서 얘기할까?'처럼 가볍게 물꼬를 트세요.", "Whoever cools down first should open the door lightly with a gentle invitation."),
        L("이야기를 꺼낼 때 과거의 일까지 끌어들이지 않고 지금의 기분만 솔직히 공유하세요.", "Focus on present feelings when opening up rather than digging up past issues."),
      ],
      avoid: [
        L("서로가 먼저 사과하거나 다가오기를 기다리며 침묵으로 겨루는 것", "Competing in silence while waiting for the other to apologize or reach out first"),
        L("감정이 상했을 때 아예 대화 자체를 장기간 닫아버리는 것", "Shutting down communication entirely for a long period when hurt"),
      ],
      evidenceIds: ["chart.a.johu.stress", "chart.b.johu.stress"],
    };
  }

  if (bandA === "hot" && bandB === "hot") {
    return {
      sequence: [
        L("감정이 고조됐을 때는 즉시 맞부딪히지 말고, 10분간 타임아웃을 선언하고 분리되세요.", "When tempers flare, don't clash on the spot — declare a 10-minute timeout and step apart."),
        L("대화를 다시 시작할 때는 팩트의 잘잘못을 가리기 전에 서로의 서운했던 기분을 먼저 읽어주세요.", "When resuming, validate each other's hurt feelings before arguing over facts."),
        L("말의 내용보다 어조의 세기를 가볍고 다정하게 낮추어 소통하세요.", "Keep your tone gentle and light rather than focusing on harsh phrasing."),
      ],
      avoid: [
        L("상대의 말 한마디에 즉각 더 강한 어조로 응수하며 맞불을 놓는 것", "Immediately firing back with harsher tones at every word"),
        L("갈등의 원인을 '너의 성격 탓'으로 돌려 규정지어 버리는 것", "Blaming the root cause on the partner's character"),
      ],
      evidenceIds: ["chart.a.johu.stress", "chart.b.johu.stress"],
    };
  }

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

  return {
    sequence: [
      L(`${names.a}님과 ${names.b}님이 서운함이 생겼을 때 가볍고 다정한 대화로 바로 오해를 터는 템포가 도움이 됩니다.`, `${names.a} and ${names.b} benefit from clearing misunderstandings right away with light, warm check-ins.`),
      L("상대를 비난하기보다 '나는 지금 다정한 안심이 필요해'처럼 내 필요만 솔직히 표현하세요.", "Instead of blaming, express your need honestly — \"I just need warm reassurance right now.\""),
      L("이야기가 길어질 때는 템포를 잠시 쉬어가며 서로의 이야기를 경청하세요.", "When conversations stretch long, take pauses and listen to each other."),
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
      commonNegativeReading: L(`${observerName}님은 ${actorName}님이 나를 몰아붙이거나 화를 낸다고 오해하기 쉽습니다.`, `${observerName} easily misreads ${actorName}'s tone as being pushed or yelled at.`),
      meaningGap: L(`${actorName}님은 공격하려는 게 아니라, 당장 이 서운함을 해소하고 싶은 마음이 앞선 것뿐이에요.`, `${actorName} is not attacking — it's just urgency to resolve this hurt right now.`),
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
    // Phase-0 consistency fix: this used to assert PURE silence ("침묵을
    // 대화 회피로 오해") regardless of what observerFelt (a few lines above
    // this function's call site) already said about the actor — for a
    // person whose real stress response is "gets firm/direct, then pulls
    // back" (not purely quiet), that created a within-block contradiction:
    // observerFelt would describe reacting to their directness, while this
    // field insisted the misread was about silence. Broadened to "pulls
    // back or goes quiet" so it holds whether the actor's real pattern is
    // pure withdrawal or a firm-then-withdraw combination.
    return {
      commonNegativeReading: L(`${observerName}님은 ${actorName}님이 말수를 줄이거나 한발 물러서는 걸 대화 회피나 무관심으로 오해하기 쉽습니다.`, `${observerName} can easily misread ${actorName} pulling back or going quieter as avoiding the conversation or not caring.`),
      meaningGap: L(`${actorName}에게 그건 거절이 아니라, 생각이 많아졌을 때 나오는 자기만의 방식이에요.`, `For ${actorName}, that's not rejection — it's just how they handle it when there's a lot going on in their head.`),
      betterExpression: L(
        `${actorName}: "화난 게 아니라, 정리할 시간이 좀 필요해. 조금만 기다려줘."`,
        `${actorName}: "I'm not upset — I just need a little time to think. Give me a bit."`,
      ),
      helpfulResponse: L(
        `${observerName}: 조용해진 걸 거절로 받아들이지 않고, ${actorName}이/가 정리할 여유를 존중해주기.`,
        `${observerName}: Not reading the quiet as rejection, and giving ${actorName} the room to think it through.`,
      ),
    };
  }

  return {
    commonNegativeReading: L(`${observerName}님은 ${actorName}님의 반응이 조용하거나 평소와 다를 때 무관심으로 넘겨짚기 쉽습니다.`, `${observerName} easily assumes indifference when ${actorName}'s response is quiet or different from usual.`),
    meaningGap: L(`${actorName}님에게 그것은 관계의 서운함이 아니라 그 순간의 일상 컨디션이나 템포 조율일 수 있습니다.`, `For ${actorName}, that's not relationship hurt, but just daily energy levels or adjusting their pace.`),
    betterExpression: L(
      `${actorName}: "별일 아니야, 그냥 오늘 좀 생각을 가라앉히는 중이야."`,
      `${actorName}: "It's nothing — I'm just settling my thoughts today."`,
    ),
    helpfulResponse: L(
      `${observerName}: 바로 마음의 오해로 해석하려 하지 않고, 편하게 물어보기.`,
      `${observerName}: Not jumping to a misunderstanding, and just asking casually instead.`,
    ),
  };
}

function selectConflictLoopSteps(params: {
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  names: { a: string; b: string };
  locale: NarrativeLocale;
  fallbackSteps: string[];
}): string[] {
  const { relCeA, relCeB, names, locale, fallbackSteps } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);

  const bandA = relCeA?.stressTempBand;
  const bandB = relCeB?.stressTempBand;
  const isColdA = bandA === "cold";
  const isColdB = bandB === "cold";
  const isHotA = bandA === "hot";
  const isHotB = bandB === "hot";

  const roleA = relCeA?.familiarRelationshipRole?.text ?? "성향";
  const roleB = relCeB?.familiarRelationshipRole?.text ?? "성향";

  // Mode 1: Asymmetric Hot-Cold (Pursuer-Withdrawer)
  if ((isHotA && !isHotB) || (isHotB && !isHotA)) {
    const presserName = isHotA ? names.a : names.b;
    const withdrawerName = isHotA ? names.b : names.a;
    const presserRole = isHotA ? roleA : roleB;
    const withdrawerRole = isHotA ? roleB : roleA;
    return [
      L(`문제가 생기면 ${subjectP(presserName, locale)} 답답해서 먼저 말을 걸어요.`, `When a problem comes up, ${presserName} gets restless and reaches out first.`),
      L(`그 순간 ${topicP(withdrawerName, locale)} 생각할 시간이 필요해서 조용해져요.`, `In that moment, ${withdrawerName} needs time to think, so they go quiet.`),
      L(`그러면 ${topicP(presserName, locale)} 그 침묵을 거절로 받아들여서 서운함과 조급함이 같이 커져요.`, `Then ${presserName} reads that silence as rejection, and both the hurt and the urgency grow.`),
      L(`${topicP(withdrawerName, locale)} 더 다그쳐질수록 오히려 입을 닫게 되고, 같은 패턴이 반복돼요.`, `The more ${withdrawerName} gets pressed, the more they close off — and the same pattern repeats.`),
    ];
  }

  // Mode 2: Both Cold (Double-Retreat / Frozen Distance)
  if (isColdA && isColdB) {
    return [
      L(`갈등 조짐이 보이면 ${names.a}님(${roleA})과 ${names.b}님(${roleB}) 모두 직설적 표현 대신 각자의 침묵으로 물러섭니다.`, `When friction arises, both ${names.a} (${roleA}) and ${names.b} (${roleB}) retreat into silence rather than opening up.`),
      L(`상대방이 먼저 다가와주기를 내심 기다리며 침묵의 시간이 길어집니다.`, `Silence stretches as each quietly expects the other to reach out first.`),
      L(`시간이 흐를수록 상대의 무반응에 서운함을 느끼며 정서적 거리가 조용히 벌어집니다.`, `As time passes, hurt from the non-response widens the emotional distance.`),
      L(`서운함의 진짜 원인을 꺼내놓지 못한 채 감정의 앙금이 마음에 가만히 누적되는 패턴입니다.`, `Without addressing the root cause, quiet resentment remains lingering between you.`),
    ];
  }

  // Mode 3: Both Hot (Double-Escalation / Emotional Clash)
  if (isHotA && isHotB) {
    return [
      L(`갈등이 생기면 ${names.a}과 ${names.b} 모두 참지 않고 바로 자기 입장을 세게 말해요.`, `When conflict comes up, both ${names.a} and ${names.b} say their piece right away, without holding back.`),
      L(`서로 지지 않으려다 보니 목소리가 점점 커지고 감정이 빠르게 격해져요.`, `Neither wants to back down, so voices rise and emotions escalate fast.`),
      L(`한쪽이 먼저 숨을 고르지 않으면 사소한 일도 금방 큰 싸움으로 번져요.`, `If neither of you pauses first, even something small can turn into a big fight quickly.`),
      L(`감정이 다 쏟아진 뒤에야 진정되지만, 그 사이 서로에게 상처가 남을 수 있어요.`, `Things calm down only after everything's been said — but by then, there can be real hurt left behind.`),
    ];
  }

  // Mode 5: Neutral x Hot
  if ((isHotA && !isColdB) || (isHotB && !isColdA)) {
    const hotName = isHotA ? names.a : names.b;
    const neutralName = isHotA ? names.b : names.a;
    const hotRole = isHotA ? roleA : roleB;
    const neutralRole = isHotA ? roleB : roleA;
    return [
      L(`갈등이 생기면 ${hotRole}인 ${hotName}님이 솔직하고 직설적인 어조로 빠른 해명을 요구합니다.`, `When friction occurs, ${hotName} (${hotRole}) seeks a quick explanation with direct delivery.`),
      L(`${neutralRole}인 ${neutralName}님은 강한 어조에 가볍게 당황하여 우선 온도를 낮추려 조율합니다.`, `${neutralName} (${neutralRole}) feels slightly startled by the direct tone and tries to cool down the temperature.`),
      L(`${hotName}님은 상대의 신중함을 지연으로 여겨 더 강하게 확인하려 할 수 있습니다.`, `${hotName} may view the other's caution as delay and press harder for reassurance.`),
      L(`표현의 강도를 누르고 서로의 본래 선의를 먼저 인정해줄 때 해결되는 패턴입니다.`, `Resolving it comes down to easing the pressure and acknowledging each other's good intentions first.`),
    ];
  }

  // Mode 6: Genuinely Similar Moderate Pairs
  return [
    L(`평소 두 사람은 원만하게 맞춰가지만, 마찰이 생기면 ${names.a}님(${roleA})과 ${names.b}님(${roleB}) 모두 서로의 기분을 살피며 조용해집니다.`, `You usually adapt smoothly, but when friction hits, both ${names.a} (${roleA}) and ${names.b} (${roleB}) quiet down and carefully observe each other's mood.`),
    L(`서운함이 생겨도 곧바로 부딪히기보다 마음속으로 가라앉히며 넘어가는 편입니다.`, `Even when hurt, you tend to hold it in rather than confront it head-on.`),
    L(`직접 다루지 않은 서운함이 마음에 작게 축적될 위험이 있습니다.`, `There's a risk that unaddressed hurt quietly accumulates inside.`),
    L(`정기적으로 솔직한 마음을 편안하게 털어놓는 대화 자리를 만들어주는 것이 유대감을 지켜줍니다.`, `Creating regular, relaxed check-ins to share feelings openly protects your harmony.`),
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
      `비슷한 ${label} 성향을 공유하여 상대의 행동 이유를 자연스럽게 이해하기 편안한 상태입니다.`,
      `Sharing a similar ${label} makes it comfortable to intuitively understand each other's reasons.`,
    );
  } else if (gap >= 50) {
    dynamicText = pick(
      locale,
      `선명한 ${label} 선호도 차이로 인해 상황을 바라보고 반응하는 방식에서 뚜렷한 대비가 드러납니다.`,
      `A clear difference in ${label} preference creates a distinct contrast in how you view and react to situations.`,
    );
  } else {
    dynamicText = pick(
      locale,
      `완만한 ${label} 차이가 존재하여 서로의 시각을 부담 없이 넓혀줄 수 있는 범위입니다.`,
      `A moderate difference in ${label} leaves room to expand each other's views without pressure.`,
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
    personATendency: aPattern,
    personBTendency: bPattern,
    pairDynamic: `${dynamicText} ${isSimilar ? "" : interp.tensionClash}`,
    observableScene: interp.sceneHint,
    likelyMisreadingA: isSimilar ? null : (aHigh ? interp.misreadHighObservingLow : interp.misreadLowObservingHigh),
    likelyMisreadingB: isSimilar ? null : (aHigh ? interp.misreadLowObservingHigh : interp.misreadHighObservingLow),
    relationshipStrength: isSimilar ? pick(locale, copyKo.calmSim, copyEn.calmSim) : interp.tensionBenefit,
    relationshipRisk: isSimilar
      ? pick(locale, copyKo.stressLow, copyEn.stressLow)
      : `${gap >= 50 ? pick(locale, "선명한 성향 차이로 인해 ", "") : ""}${interp.tensionClash}`,
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

function computeHeroPairThesis(params: {
  names: { a: string; b: string };
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  topDiff?: RomanticPsychMatchAxisResult;
  superpower?: RomanticCrossSignalInsight;
  paradox?: RomanticCrossSignalInsight;
  locale: NarrativeLocale;
}): string {
  const { names, relCeA, relCeB, topDiff, superpower, paradox, locale } = params;
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const a = names.a;
  const b = names.b;

  const bandA = relCeA?.stressTempBand;
  const bandB = relCeB?.stressTempBand;

  if (superpower?.derivedMeaning) {
    return superpower.derivedMeaning;
  }
  if (paradox?.derivedMeaning) {
    return paradox.derivedMeaning;
  }

  // Pattern 1: Asymmetric Hot-Cold (Pursuer-Withdrawer)
  if ((bandA === "hot" && bandB === "cold") || (bandB === "hot" && bandA === "cold")) {
    const hotPerson = bandA === "hot" ? a : b;
    const coldPerson = bandA === "hot" ? b : a;
    return L(
      `둘 다 관계를 쉽게 놓는 사람은 아니지만, ${hotPerson}님은 불편함을 바로 대화로 확인해야 안심하고 ${coldPerson}님은 혼자 정리할 시간이 있어야 다시 마음을 열어가는 관계.`,
      `Neither person gives up easily on the relationship, but ${hotPerson} needs to check in through conversation to feel safe, while ${coldPerson} needs time alone to process before opening back up.`,
    );
  }

  // Pattern 2: Both Cold (Double-Retreat / Frozen Distance)
  if (bandA === "cold" && bandB === "cold") {
    return L(
      `${a}과 ${b} 둘 다 무모하게 부딪히기보다 조용히 가라앉히는 편이지만, 서로 먼저 다가오기를 기다리다 보면 서운함의 거리가 조용히 벌어질 수 있는 관계.`,
      `Both ${a} and ${b} tend to go quiet rather than clash head-on, but if you each wait for the other to step forward first, emotional distance can quietly grow.`,
    );
  }

  // Pattern 3: Both Hot (Double-Escalation / Emotional Clash)
  if (bandA === "hot" && bandB === "hot") {
    return L(
      `${a}과 ${b} 둘 다 서운한 순간 바로 직설적으로 표현해서 풀어내는 편이지만, 감정이 동시에 고조될 때는 잠깐 쉬어가는 타이밍이 관계의 핵심이 되는 관계.`,
      `Both ${a} and ${b} tend to say what's bothering them right away and work it out directly, but when emotions run high at the same time, knowing when to pause becomes the key.`,
    );
  }

  // Pattern 4: Top Psych Gap Contrast (e.g. Structure vs Stimulation, Empathy, etc.)
  if (topDiff && topDiff.gap >= 30) {
    const label = psychMatchAxisLabel(topDiff.axis_key, locale);
    const highPerson = topDiff.score_a >= topDiff.score_b ? a : b;
    const lowPerson = topDiff.score_a >= topDiff.score_b ? b : a;
    if (topDiff.axis_key === "structure") {
      return L(
        `${highPerson}님은 예측 가능성과 뚜렷한 틀 안에서 안정감을 느끼고, ${lowPerson}님은 유연함과 즉흥 속에서 활력을 얻어 일상의 리듬을 다채롭게 채워가는 관계.`,
        `${highPerson} finds safety in predictability and structure, while ${lowPerson} draws energy from flexibility and spontaneity, filling your daily rhythm with variety.`,
      );
    }
    if (topDiff.axis_key === "stimulation") {
      return L(
        `${highPerson}님은 새로운 경험과 변화로 활력을 불어넣고, ${lowPerson}님은 익숙한 온기와 조용한 안정감을 다지며 서로의 세계를 넓혀주는 관계.`,
        `${highPerson} brings fresh experiences and change to spark energy, while ${lowPerson} builds familiar warmth and quiet stability, expanding each other's worlds.`,
      );
    }
    if (topDiff.axis_key === "empathy") {
      return L(
        `${highPerson}님은 정서적 공감과 체온 표현을 통해 마음을 확인하고, ${lowPerson}님은 침착한 이성과 명확한 행동으로 신뢰를 증명하는 관계.`,
        `${highPerson} confirms closeness through emotional empathy and warmth, while ${lowPerson} proves trust through calm reason and clear action.`,
      );
    }
    return L(
      `${highPerson}님은 ${label} 성향을 선명하게 표현하고 ${lowPerson}님은 유연하게 상대의 반응에 응답하며 균형을 찾아가는 관계.`,
      `${highPerson} clearly expresses ${label}, while ${lowPerson} flexibly responds to find balance.`,
    );
  }

  // Pattern 5: Moderate / Similar Pair
  return L(
    `${a}과 ${b}은 평소 서로의 기분을 조심스럽게 살피며 원만하게 지내는 편이지만, 서운한 점이 생겼을 때 혼자 삭이기보다 다정하게 털어놓는 대화가 둘 사이를 지켜주는 관계.`,
    `${a} and ${b} tend to naturally read each other's moods and get along smoothly, but when something stings, talking it through warmly rather than holding it in is what protects the bond between you.`,
  );
}

  const summary = report.section_1_summary as
    | { relationship_name?: string }
    | string
    | undefined;
  const relationshipDefinition =
    (typeof summary === "object" && summary?.relationship_name) ||
    (typeof summary === "string" ? summary : null) ||
    computeHeroPairThesis({
      names,
      relCeA,
      relCeB,
      topDiff: axisResults.filter((a) => a.axis_key !== "conflict_style").sort((a, b) => b.gap - a.gap)[0],
      // Cross-Signal V1 (crossSignalInsightsV1) is computed AFTER this
      // story plan is fully built (buildRomanticCrossSignalIntelligence
      // takes the finished plan as its own input, further down this
      // function) — it genuinely isn't available yet here, not a bug to
      // work around. computeHeroPairThesis already falls through to its
      // 5 real evidence-driven patterns (hot/cold, cold/cold, hot/hot,
      // top-axis-gap, moderate/similar) when superpower/paradox are
      // undefined, so this is correct, not a degraded path.
      superpower: undefined,
      paradox: undefined,
      locale,
    });
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
        `${withP(names.a, locale)} ${names.b}가 마주 앉으면 둘만 아는 편안함이 생겨요.`,
        `When ${withP(names.a, locale)} ${names.b} sit down together, there's an ease that belongs only to the two of them.`,
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
      relCeA,
      relCeB,
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
      observerFelt: relCeA?.stressTempBand === "hot"
        ? L(`${topicP(names.a, locale)} '왜 나 혼자만 이 관계를 붙잡고 애쓰고 있지?'라는 서운함과 조급함이 밀려오기 쉽습니다.`, `${topicP(names.a, locale)} easily feels a rush of hurt and urgency, thinking "Why am I the only one holding onto this relationship?"`)
        : relCeA?.stressTempBand === "cold"
          ? L(`${topicP(names.a, locale)} '상대도 대화를 피하니 나도 말을 아끼는 편이 낫겠다'며 무겁게 마음을 닫기 쉽습니다.`, `${topicP(names.a, locale)} easily shuts down heavily, thinking "Since they avoid talking, I'd better hold back too."`)
          : L(`${topicP(names.a, locale)} '상대의 조용한 태도가 관심이 없어서인가' 하며 서운함을 마음속으로 삭이기 쉽습니다.`, `${topicP(names.a, locale)} quietly holds back hurt, wondering "Is their quiet attitude due to lack of interest?"`),
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
      observerFelt: relCeB?.stressTempBand === "hot"
        ? L(`${topicP(names.b, locale)} '나 혼자만 관계의 온도를 채우려 애쓰나'라는 억울함에 즉각 어조가 세지기 쉽습니다.`, `${topicP(names.b, locale)} easily feels unfairness and raises their tone, thinking "Am I the only one trying to warm up this relationship?"`)
        : relCeB?.stressTempBand === "cold"
          ? L(`${topicP(names.b, locale)} '상대의 직설적인 태도가 나를 비난하려는 것인가' 하여 방어적으로 동굴로 물러서기 쉽습니다.`, `${topicP(names.b, locale)} easily steps back into a cave defensively, thinking "Is their direct attitude meant to criticize me?"`)
          : L(`${topicP(names.b, locale)} '상대의 빠른 확인 요구가 부담으로 다가온다'며 말수를 줄이기 쉽습니다.`, `${topicP(names.b, locale)} easily cuts back words, feeling "Their fast check-in request feels burdensome."`),
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

  const selectedRepair = selectRepairSequence({ recovery, expr, relCeA, relCeB, names, locale });
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

  // Ch10-closing fix: this was 100% hardcoded (3 fixed constants, zero
  // branching) \u2014 confirmed via audit. Now branches on the same real
  // recovery_mismatch/expression_speed signals that already drive
  // recurringLoop/repair, but reframed forward (a SHIFT and a GOAL, not a
  // restatement of the loop itself) so it's usable as genuinely novel
  // closing evidence rather than just repeating Ch03/Ch06. Declared here
  // (before finalStoryPlan) because closing.presentPossibility below needs
  // it during finalStoryPlan's own construction.
  const growthTransitionP1 = ((): RomanticGrowthTransition => {
    if (recovery?.recovery_mismatch) {
      return {
        currentPattern: L("\uC11C\uB85C \uD68C\uBCF5\uD558\uB294 \uC18D\uB3C4\uAC00 \uB2EC\uB77C\uC11C \uD55C\uCABD\uC740 \uC774\uBBF8 \uAD1C\uCC2E\uC740\uB370 \uB2E4\uB978 \uCABD\uC740 \uC544\uC9C1 \uC815\uB9AC \uC911\uC778 \uC0C1\uD0DC\uB85C \uC5B4\uAE0B\uB098\uB294 \uD328\uD134", "A pattern where you recover at different speeds \u2014 one of you is already fine while the other is still processing."),
        recommendedShift: L("\uD68C\uBCF5 \uC18D\uB3C4\uAC00 \uB2E4\uB974\uB2E4\uB294 \uAC83 \uC790\uCCB4\uB97C \uBB38\uC81C\uB85C \uBCF4\uC9C0 \uC54A\uACE0, \uC11C\uB85C\uC758 \uC18D\uB3C4\uB97C \uBBF8\uB9AC \uC54C\uB824\uC8FC\uB294 \uC2E0\uD638\uB85C \uBC14\uAFB8\uB294 \uC804\uD658", "Shifting from treating the pace gap itself as a problem to using it as a signal you each announce ahead of time."),
        longTermGoal: L("\uC11C\uB85C \uB2E4\uB978 \uC18D\uB3C4\uB97C \uC874\uC911\uD558\uBA74\uC11C\uB3C4 \uC815\uC11C\uC801\uC73C\uB85C \uACC4\uC18D \uC5F0\uACB0\uB418\uC5B4 \uC788\uB294 \uAD00\uACC4", "A relationship that stays emotionally connected even while moving at two different paces."),
        evidenceIds: ["canonical_projections.recovery_speed"],
        confidence: "high" as const,
      };
    }
    if (expr?.direction === "A" || expr?.direction === "B") {
      const slower = expr.direction === "A" ? names.a : names.b;
      return {
        currentPattern: L(`${slower}\uC774/\uAC00 \uB2F5\uC744 \uC815\uB9AC\uD558\uB294 \uB370 \uC2DC\uAC04\uC774 \uAC78\uB9AC\uB294 \uAC78 \uC0C1\uB300\uAC00 \uC870\uAE09\uD558\uAC8C \uBC1B\uC544\uB4E4\uC774\uB294 \uD328\uD134`, `A pattern where ${slower} needs time to form a response, and the other reads that as urgency.`),
        recommendedShift: L(`${slower}\uC758 \uCE68\uBB35\uC744 \uB2F5\uC774 \uC5C6\uB294 \uAC83\uC73C\uB85C \uB118\uACA8\uC9DA\uC9C0 \uC54A\uACE0, \uC815\uB9AC\uD560 \uC2DC\uAC04\uC774\uB77C\uB294 \uC2E0\uD638\uB85C \uBC1B\uC544\uB4E4\uC774\uB294 \uC804\uD658`, `Shifting from reading ${slower}'s silence as no answer, to reading it as a signal that they're still forming one.`),
        longTermGoal: L("\uAC01\uC790\uC758 \uC18D\uB3C4\uB97C \uC778\uC815\uD558\uBA74\uC11C\uB3C4 \uB300\uD654\uAC00 \uB04A\uAE30\uC9C0 \uC54A\uB294 \uAD00\uACC4", "A relationship where the conversation never fully breaks, even as each person keeps their own pace."),
        evidenceIds: ["canonical_projections.expression_speed"],
        confidence: "high" as const,
      };
    }
    return {
      currentPattern: "",
      recommendedShift: "",
      longTermGoal: "",
      evidenceIds: [],
      confidence: "medium" as const,
    };
  })();

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
      (relCeA && relCeB
        ? L(
            `이건 둘이 같이 있을 때만 생기는 힘이에요. 상황이 흔들릴 때 ${names.a}의 ${relCeA.strengthsGivenToPartner[0]?.text ?? "다정한 활력"}이 분위기를 다독이고 ${names.b}의 ${relCeB.strengthsGivenToPartner[0]?.text ?? "흔들림 없는 신중함"}이 중심을 잡아줘서, 불안한 순간에도 혼자 남겨진 느낌 없이 같이 답을 찾아가요.`,
            `This is something the two of you make happen together, not something either of you has alone. When things get shaky, ${names.a}'s ${relCeA.strengthsGivenToPartner[0]?.text ?? "warm vitality"} keeps the mood warm and ${names.b}'s ${relCeB.strengthsGivenToPartner[0]?.text ?? "steady prudence"} holds things steady, so even in an uncertain moment you're working it out together instead of feeling stuck alone.`,
          )
        : bonding?.summary || plan.pairSynthesis.selectedMeaning || copy.sharedStrengthFallback),
    sharedVulnerability:
      strengthVuln?.sharedVulnerability ||
      ((relCeA?.stressTempBand === "hot" && relCeB?.stressTempBand === "cold") || (relCeB?.stressTempBand === "hot" && relCeA?.stressTempBand === "cold")
        ? L(
            `이 조합의 약점은 여기서 나와요 — 평소엔 한쪽의 해결 의지와 다른 쪽의 신중함이 잘 맞물리는데, 예민한 얘기 앞에서는 '이번엔 진짜 잘 풀어야 해'라는 부담이 서로 커지면서 오히려 작은 대화도 무겁게 느껴질 수 있어요.`,
            `Here's where this combination gets tricky — normally one's drive to solve things and the other's carefulness work well together, but on a sensitive topic, that same pressure to "get it right this time" can make even a small conversation feel heavy.`,
          )
        : relCeA?.stressTempBand === "cold" && relCeB?.stressTempBand === "cold"
          ? L(
              `둘 다 상대를 워낙 배려하고 조심스러워서, 서운한 일이 생겨도 '내가 그냥 넘어가지'하며 참는 쪽을 택하기 쉬워요. 그러다 보면 정작 진짜 마음을 나눌 타이밍을 놓치게 돼요.`,
              `You're both so considerate of each other that when something stings, you tend to just let it go rather than say it. The catch is you can end up missing the moment to actually talk about it.`,
            )
          : relCeA?.stressTempBand === "hot" && relCeB?.stressTempBand === "hot"
            ? L(
                `둘 다 솔직하고 에너지가 넘쳐서 뭐든 빠르게 밀어붙이는 편인데, 그러다 보니 지칠 때도 같이 지치기 쉬워요. 서로 속도를 늦춰줄 사람이 없다 보니 둘 다 한꺼번에 방전될 수 있어요.`,
                `You're both direct and full of energy, so you tend to push things forward fast — but that also means you can burn out together, since neither of you is the one slowing things down.`,
              )
            : L(
                `서로 잘 맞춰주는 편이라 평소엔 부드럽게 넘어가는데, 그러다 보니 중요한 선이나 서운함을 제때 구체적으로 짚고 넘어가지 않는 편이에요. 그게 작은 앙금으로 쌓일 수 있어요.`,
                `You adapt to each other so easily that things usually go smoothly — but that can mean important boundaries or small hurts don't get named in the moment, and they quietly build up.`,
              )),
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
      // Semantic-leak fix, round 2: the first fix picked from real evidence
      // but always poured it into the SAME sentence frame ("[owner]가
      // 마음속에 품고 있는 건 X..."), which is still template-shaped
      // personalization once you strip the quoted content. This version
      // scores every candidate evidence source on 4 axes (relevance,
      // confidence, novelty vs. what earlier chapters already showed,
      // forward-looking usefulness) and gives the WINNING type its OWN
      // sentence structure — different evidence literally can't render
      // through the same frame anymore, because each type owns its own
      // template. See selectClosingFocus below for the scoring and the
      // per-type structures.
      presentPossibility: selectClosingFocus({
        names,
        relCeA,
        relCeB,
        growthTransitionP1,
        selectedRepairEvidenceIds: selectedRepair.evidenceIds,
        sharedStrength: strengthVuln?.sharedStrength,
        sharedVulnerability: strengthVuln?.sharedVulnerability,
        timingTheme: fortuneFlowTiming?.theme ?? (hasTiming ? horizon.title : null),
        locale,
      }),
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
