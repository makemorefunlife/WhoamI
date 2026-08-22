/**
 * Phase 3 — Cross-Signal Intelligence V1.
 *
 * Deterministic only (no LLM — see decisions/Phase-4 note in the type file).
 * Each function here crosses 2+ already-computed, already-validated signals
 * from the story plan / Personal Relationship CE / axis results into a new
 * pair-level meaning that neither input signal states alone. Nothing here
 * recomputes Saju or psych facts — it only reads what buildCanonicalRelationshipStoryPlan.ts
 * already has in scope by the time it assembles `finalStoryPlan`.
 *
 * Six insight types (spec §3): innate_current, hidden_collision,
 * strength_shadow, paradox, difference_rescue, blind_spot — plus the §4
 * "Superpower" selector. Every builder abstains (returns nothing) rather than
 * rendering a low-confidence or unsupported claim — see each function's own
 * gate comment for exactly what's required to fire.
 */
import type {
  CanonicalRelationshipStoryPlan,
  RomanticCrossSignalInsight,
  RomanticHiddenCollisionInsight,
  RomanticInnateCurrentInsight,
} from "./canonicalStoryPlanTypes";
import type { PersonalRelationshipCe } from "./personalRelationshipCe";
import type { RomanticPsychMatchAxisResult } from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type { RomanticPairCeBondingValue } from "../romanticPairCeBondingCanonical";
import { psychMatchAxisLabel } from "../../psychMatch/axisLabels";
import { pick, type NarrativeLocale } from "./narrativeLocale";

export type RomanticCrossSignalInput = {
  storyPlan: Pick<
    CanonicalRelationshipStoryPlan,
    "attraction" | "misreads" | "bilateralChanges" | "sharedStrength" | "repair"
  >;
  relCeA: PersonalRelationshipCe | null | undefined;
  relCeB: PersonalRelationshipCe | null | undefined;
  axisResults: RomanticPsychMatchAxisResult[];
  bonding?: (RomanticPairCeBondingValue & { summary?: string }) | null;
  stemCombineHitCount?: number;
  sixCombineHitCount?: number;
  names: { a: string; b: string };
  locale: "ko-KR" | "en-US";
};

const L = (locale: NarrativeLocale, ko: string, en: string) => pick(locale, ko, en);

// ── §3.1 Innate × Current ───────────────────────────────────────────────────
// Reads PersonalRelationshipCe.personalCeAlignment (personalRelationshipCe.ts) —
// already computed from real relational_profile data at buildActualFourCeContract.ts:158-173,
// never previously consumed by any chapter. `agrees` is ONLY meaningful when
// `ceAuthoritative` is true: when the CE band is null, `agrees` trivially
// resolves to `legacyBand === legacyBand` (always true) — comparing against
// nothing. Gating on ceAuthoritative first is what makes this safe to use.

const STRESS_BAND_CURRENT_TEXT: Record<"hot" | "cold" | "neutral", { ko: string; en: string }> = {
  hot: { ko: "현재는 감정이 격해지면 곧바로 확인받고 싶어 하는 즉각 반응형으로 나타남", en: "currently shows up as wanting immediate confirmation the moment emotions spike" },
  cold: { ko: "현재는 감정이 격해지면 혼자 정리할 시간부터 필요로 하는 물러섬형으로 나타남", en: "currently shows up as needing to withdraw and process alone before re-engaging" },
  neutral: { ko: "현재는 감정을 가라앉히고 상황을 차분히 짚어가는 균형형으로 나타남", en: "currently shows up as calmly working through the situation once the initial reaction settles" },
};

const CARE_BAND_CURRENT_TEXT: Record<"emotional_care" | "action_gift", { ko: string; en: string }> = {
  emotional_care: { ko: "현재는 다정한 말과 정서적 공감으로 마음을 표현하는 쪽으로 나타남", en: "currently expresses care mainly through warm words and emotional attunement" },
  action_gift: { ko: "현재는 실질적인 행동과 구체적인 챙김으로 마음을 표현하는 쪽으로 나타남", en: "currently expresses care mainly through concrete, practical acts" },
};

function buildInnateCurrentForPerson(
  subject: "a" | "b",
  relCe: PersonalRelationshipCe | null | undefined,
  locale: "ko-KR" | "en-US",
): RomanticInnateCurrentInsight[] {
  const alignment = relCe?.personalCeAlignment;
  if (!alignment || !relCe) return [];
  const results: RomanticInnateCurrentInsight[] = [];

  const stress = alignment.stressResponse;
  if (stress.ceAuthoritative && stress.ceBand) {
    const currentText = STRESS_BAND_CURRENT_TEXT[stress.ceBand];
    results.push({
      id: `xsig_innate_current_stress_${subject}`,
      insightType: "innate_current",
      subject,
      domain: "stress_response",
      innateSignal: relCe.stressResponse.text,
      currentSignal: L(locale, currentText.ko, currentText.en),
      category: stress.agrees ? "ALIGNED" : "CONTEXT_SHIFT",
      derivedMeaning: stress.agrees
        ? L(
            locale,
            "타고난 스트레스 대응 방식과 지금 실제로 하는 행동이 같은 방향으로 일치합니다 — 본래 성향이 그대로 현재 행동으로 이어지고 있습니다.",
            "Their innate stress response and their current actual behavior point the same direction — the native tendency is carrying straight through into how they act now.",
          )
        : L(
            locale,
            "타고난 스트레스 대응 방식과 지금 실제로 하는 행동이 서로 다른 방향입니다 — 본래 성향과 지금 쓰는 전략이 같지 않다는 뜻입니다.",
            "Their innate stress response and their current actual behavior point in different directions — the native tendency and the strategy they actually use now aren't the same thing.",
          ),
      evidenceRefs: [`personalRelationshipCe.${subject}.personalCeAlignment.stressResponse`],
      sourceSignals: ["saju.johu.temperature_band", "personalCE.relational_profile.pressure_response"],
      confidence: "high",
      claimBoundary: {
        supported: L(
          locale,
          "현재 행동이 타고난 성향과 일치하는지/다른지 그 자체.",
          "Whether current behavior matches or diverges from the innate tendency — nothing more.",
        ),
        notSupported: L(
          locale,
          "스트레스나 친밀감이 깊어질 때 어느 쪽(타고난 성향 vs 지금 전략)이 실제로 우세해질지는 이 데이터만으로 알 수 없습니다.",
          "Which of the two (innate tendency vs. current strategy) would actually win out under real stress or growing intimacy cannot be determined from this data alone.",
        ),
      },
      suggestedChapter: "c3_dynamics",
    });
  }

  const care = alignment.careExpression;
  if (care.ceAuthoritative && care.ceBand) {
    const currentText = CARE_BAND_CURRENT_TEXT[care.ceBand];
    results.push({
      id: `xsig_innate_current_care_${subject}`,
      insightType: "innate_current",
      subject,
      domain: "care_expression",
      innateSignal: relCe.careExpression.text,
      currentSignal: L(locale, currentText.ko, currentText.en),
      category: care.agrees ? "ALIGNED" : "CONTEXT_SHIFT",
      derivedMeaning: care.agrees
        ? L(
            locale,
            "타고난 애정 표현 방식과 지금 실제로 표현하는 방식이 일치합니다.",
            "Their innate way of expressing care and how they actually express it now line up.",
          )
        : L(
            locale,
            "타고난 애정 표현 방식과 지금 실제로 표현하는 방식이 서로 다릅니다 — 본래 결과 지금 쓰는 표현 언어가 같지 않습니다.",
            "Their innate way of expressing care and how they actually express it now differ — the native grain and the expression language they currently use aren't the same.",
          ),
      evidenceRefs: [`personalRelationshipCe.${subject}.personalCeAlignment.careExpression`],
      sourceSignals: ["saju.spousePalace.affection_band", "personalCE.relational_profile.support_giving_style"],
      confidence: "high",
      claimBoundary: {
        supported: L(
          locale,
          "현재 표현 방식이 타고난 결과 일치하는지/다른지 그 자체.",
          "Whether the current expression style matches or diverges from the innate grain — nothing more.",
        ),
        notSupported: L(
          locale,
          "표현이 다를 때 어느 쪽이 '진짜 마음'인지는 이 데이터로 판단할 수 없습니다.",
          "Which one is the 'real' feeling when they differ cannot be judged from this data.",
        ),
      },
      suggestedChapter: "c5_misunderstanding",
    });
  }

  return results;
}

// ── §3.2 Hidden Collision ────────────────────────────────────────────────
// Only 3 axes get a collision-prone reading, chosen because their semantic
// meaning plausibly supports "sameness itself is the risk" — not because
// they're the only similarity matches available. Both scores must clear a
// real magnitude threshold (>=60 or <=40); a similarity match in the 41-59
// mid-band abstains (no meaningful shared lean either way).

type CollisionRule = {
  axisKey: string;
  test: (a: number, b: number) => boolean;
  mechanism: { ko: string; en: string };
  effect: { ko: string; en: string };
};

const COLLISION_RULES: CollisionRule[] = [
  {
    axisKey: "conflict_style",
    test: (a, b) => a <= 40 && b <= 40,
    mechanism: { ko: "둘 다 먼저 문제를 짚기보다 갈등을 미루는 쪽이라, 누구도 먼저 꺼내지 않는 침묵이 쌓입니다.", en: "Both delay naming a problem rather than confronting it, so silence accumulates because neither goes first." },
    effect: { ko: "작은 서운함이 해소될 타이밍을 놓치고 쌓였다가 예상 못한 순간에 한꺼번에 터질 수 있습니다.", en: "Small grievances miss their window to be resolved and can surface all at once, unexpectedly." },
  },
  {
    axisKey: "conflict_style",
    test: (a, b) => a >= 60 && b >= 60,
    mechanism: { ko: "둘 다 문제를 보이는 즉시 직면하는 쪽이라, 한쪽이 먼저 물러나 온도를 낮추는 역할이 비어 있습니다.", en: "Both confront a problem the moment it appears, so there's no one whose default is to step back and cool things down first." },
    effect: { ko: "사소한 의견 차이도 빠르게 격해질 수 있고, 먼저 브레이크를 거는 사람이 자연스럽게 정해지지 않습니다.", en: "Even small disagreements can escalate quickly, and no one naturally ends up being the one who applies the brakes." },
  },
  {
    axisKey: "recognition",
    test: (a, b) => a >= 60 && b >= 60,
    mechanism: { ko: "둘 다 인정받고 싶은 마음이 커서, 서로에게 먼저 확인해주는 역할을 상대에게 기대하게 됩니다.", en: "Both have a strong need to feel recognized, so each tends to wait for the other to offer reassurance first." },
    effect: { ko: "둘 다 인정을 주기보다 받기를 기다리다가, 정작 서로에게 필요한 확인이 늦게 옵니다.", en: "Both wait to receive recognition rather than give it first, so the reassurance each one needs arrives late." },
  },
  {
    axisKey: "structure",
    test: (a, b) => a >= 60 && b >= 60,
    mechanism: { ko: "둘 다 계획과 구조를 선호해서, 계획이 틀어졌을 때 누구도 유연하게 놓아주는 역할을 안 맡습니다.", en: "Both prefer plans and structure, so when a plan breaks, neither one naturally takes on the role of letting it go." },
    effect: { ko: "예상 밖 변수가 생기면 둘 다 원래 계획을 붙잡으려다 같이 경직될 수 있습니다.", en: "When something unplanned happens, both can end up gripping the original plan and stiffening together instead of adapting." },
  },
  {
    axisKey: "structure",
    test: (a, b) => a <= 40 && b <= 40,
    mechanism: { ko: "둘 다 구조보다 즉흥을 선호해서, 큰 결정에 필요한 최소한의 뼈대를 누구도 먼저 세우지 않습니다.", en: "Both lean toward improvising over structure, so neither one naturally sets even the minimal framework a big decision needs." },
    effect: { ko: "정말 중요한 계획(돈, 이사, 장기 결정)조차 구체적 기한 없이 미뤄질 수 있습니다.", en: "Even genuinely important plans (money, moving, long-term decisions) can drift without a concrete deadline." },
  },
];

function buildHiddenCollisionInsights(
  axisResults: RomanticPsychMatchAxisResult[],
  locale: "ko-KR" | "en-US",
): RomanticHiddenCollisionInsight[] {
  const results: RomanticHiddenCollisionInsight[] = [];
  for (const row of axisResults) {
    if (row.match_type !== "similarity") continue;
    const rule = COLLISION_RULES.find((r) => r.axisKey === row.axis_key && r.test(row.score_a, row.score_b));
    if (!rule) continue;
    const axisLabel = psychMatchAxisLabel(row.axis_key, locale);
    results.push({
      id: `xsig_hidden_collision_${row.axis_key}_${Math.round(row.score_a)}_${Math.round(row.score_b)}`,
      insightType: "hidden_collision",
      axisKey: row.axis_key,
      axisLabel,
      similarityEvidence: L(
        locale,
        `${axisLabel} 축에서 두 사람 모두 비슷한 쪽(${Math.round(row.score_a)}/${Math.round(row.score_b)})으로 나타납니다.`,
        `Both score similarly on ${axisLabel} (${Math.round(row.score_a)}/${Math.round(row.score_b)}).`,
      ),
      collisionMechanism: L(locale, rule.mechanism.ko, rule.mechanism.en),
      likelyRelationshipEffect: L(locale, rule.effect.ko, rule.effect.en),
      derivedMeaning: L(
        locale,
        `비슷해서 편한 축이지만, ${axisLabel}에서는 그 비슷함 자체가 둘 다 같은 역할을 비워두게 만드는 위험이 됩니다.`,
        `An axis where being alike usually feels easy — but on ${axisLabel}, that very similarity leaves the same role unfilled for both of them.`,
      ),
      evidenceRefs: [`axisResults.${row.axis_key}`],
      sourceSignals: [`psych.${row.axis_key}.score_a`, `psych.${row.axis_key}.score_b`, `psych.${row.axis_key}.match_type`],
      confidence: "medium",
      claimBoundary: {
        supported: L(locale, "이 축에서 두 사람이 같은 쪽으로 몰려 있다는 것.", "That both people cluster on the same side of this axis."),
        notSupported: L(
          locale,
          "실제로 이 축 때문에 갈등이 일어난다는 것은 아직 확인된 사실이 아니라 가능성입니다.",
          "That this axis has actually caused a real conflict is a plausibility, not a confirmed fact.",
        ),
      },
      // User-facing Ch.04 "다름을 번역하는 법" = engine chapterId c5_misunderstanding
      // (NOT c4_conflict, which is user-facing Ch.03 — see spec's own numbering).
      suggestedChapter: "c5_misunderstanding",
    });
  }
  return results;
}

// ── §3.3 Strength → Shadow ───────────────────────────────────────────────
// Formalizes plan.bilateralChanges as-is — does not recompute the strength or
// the shadow. partnerEffect stays null (never invented) since BilateralChange
// has no separate field describing the effect on the partner.

function buildStrengthShadowInsights(
  bilateralChanges: CanonicalRelationshipStoryPlan["bilateralChanges"],
  locale: "ko-KR" | "en-US",
): RomanticCrossSignalInsight[] {
  return (bilateralChanges ?? []).map((bc, i) => ({
    id: `xsig_strength_shadow_${bc.from}_to_${bc.to}_${i}`,
    insightType: "strength_shadow" as const,
    from: bc.from,
    to: bc.to,
    strength: bc.change,
    overuseCondition: L(locale, "이 강점이 지속적으로/과도하게 쓰일 때", "When this strength is drawn on continuously or excessively"),
    shadow: bc.excessVulnerability,
    partnerEffect: null,
    derivedMeaning: L(
      locale,
      `${bc.from === "a" ? "A" : "B"}가 ${bc.to === "a" ? "A" : "B"}에게 주는 이 강점은, 같은 메커니즘이 과할 때 그대로 취약점으로 뒤집힙니다.`,
      `The strength ${bc.from === "a" ? "A" : "B"} brings to ${bc.to === "a" ? "A" : "B"} flips into a vulnerability through the exact same mechanism when it's overused.`,
    ),
    evidenceRefs: bc.provenance.map((p) => p.evidenceId),
    sourceSignals: [`bilateralChanges[${bc.from}_to_${bc.to}].change`, `bilateralChanges[${bc.from}_to_${bc.to}].excessVulnerability`],
    confidence: "high",
    claimBoundary: {
      supported: L(locale, "이 강점이 과할 때 나타나는 취약점 자체.", "The vulnerability that this specific strength produces when overused."),
      notSupported: L(locale, "상대방이 실제로 어떻게 영향받는지는 별도로 확인된 것이 아닙니다.", "How the partner is actually affected by it is not separately confirmed."),
    },
    suggestedChapter: "c8_strength_vulnerability",
  }));
}

// ── §3.4 Relationship Paradox ────────────────────────────────────────────
// Requires the mutual attraction unit to carry a real tensionBridge AND a
// real pair-bonding count > 0 — both must be true, or abstain.

function buildParadoxInsight(
  attraction: CanonicalRelationshipStoryPlan["attraction"],
  bonding: (RomanticPairCeBondingValue & { summary?: string }) | null | undefined,
  locale: "ko-KR" | "en-US",
): RomanticCrossSignalInsight[] {
  const mutual = attraction?.units?.mutual;
  if (!mutual?.tensionBridge || !bonding || bonding.count <= 0) return [];
  return [
    {
      id: "xsig_paradox_mutual",
      insightType: "paradox",
      whyItWorks: [mutual.recognition, mutual.emotionalMeaning].filter(Boolean).join(" "),
      contextShift: L(
        locale,
        "그 끌림이 확인·거리에 대한 기대로 바뀌는 순간",
        "The moment that pull turns into an expectation about reassurance or distance",
      ),
      whyItBecomesFriction: mutual.tensionBridge,
      derivedMeaning: L(
        locale,
        "두 사람을 끌어당긴 바로 그 결합 방식이, 조건이 바뀌면 같은 메커니즘으로 마찰을 만듭니다 — 서로 다른 두 가지가 아니라 하나의 메커니즘의 두 얼굴입니다.",
        "The exact combination that pulled these two together produces friction through that same mechanism once the conditions shift — not two separate things, but one mechanism's two faces.",
      ),
      evidenceRefs: [...mutual.evidenceIds, "canonical_projections.pair_ce_bonding"],
      sourceSignals: ["attraction.units.mutual.tensionBridge", "canonical_projections.pair_ce_bonding.count"],
      confidence: "medium",
      claimBoundary: {
        supported: L(locale, "끌림과 마찰이 같은 메커니즘에서 나온다는 구조적 연결.", "The structural link that attraction and friction spring from the same mechanism."),
        notSupported: L(locale, "이 마찰이 실제로 언제, 얼마나 자주 일어나는지는 여기서 확정할 수 없습니다.", "When or how often this friction actually occurs cannot be pinned down from this alone."),
      },
      suggestedChapter: "c2_attraction",
    },
  ];
}

// ── §3.5 Difference → Rescue ─────────────────────────────────────────────
// Requires a genuine complementary/tension axis with gap>=25 on a
// decision-relevant axis, AND a real, non-empty repair sequence to serve as
// the "rescue context" evidence. Neither alone is sufficient.

const RESCUE_ELIGIBLE_AXES = new Set(["decision_style", "practicality", "thinking_style"]);

function buildDifferenceRescueInsight(
  axisResults: RomanticPsychMatchAxisResult[],
  repair: CanonicalRelationshipStoryPlan["repair"],
  locale: "ko-KR" | "en-US",
): RomanticCrossSignalInsight[] {
  const candidate = axisResults
    .filter((r) => RESCUE_ELIGIBLE_AXES.has(r.axis_key) && r.match_type !== "similarity" && r.gap >= 25)
    .sort((a, b) => b.gap - a.gap)[0];
  if (!candidate || !repair?.sequence?.length) return [];
  const axisLabel = psychMatchAxisLabel(candidate.axis_key, locale);
  return [
    {
      id: `xsig_difference_rescue_${candidate.axis_key}`,
      insightType: "difference_rescue",
      difference: L(
        locale,
        `${axisLabel} 축에서 두 사람의 접근 방식이 뚜렷하게 갈립니다 (격차 ${Math.round(candidate.gap)}점).`,
        `Approaches diverge clearly on ${axisLabel} (gap of ${Math.round(candidate.gap)} points).`,
      ),
      normalFriction: L(
        locale,
        "평소에는 이 속도·기준 차이 때문에 답답함이나 조급함으로 느껴지기 쉽습니다.",
        "In everyday moments, this gap in pace or standards tends to read as frustration or impatience.",
      ),
      rescueContext: L(locale, "큰 결정이나 위기 앞에서", "When a big decision or a real crisis hits"),
      whyItHelps: L(
        locale,
        "이미 검증된 회복 순서를 실제로 따라갈 때는, 이 차이가 한쪽은 정보를 모으고 한쪽은 매듭짓는 식으로 서로 다른 역할을 채워 대응력을 높입니다.",
        "When they actually follow their already-established repair sequence, this same gap fills two different roles — one gathering information, one closing the loop — which raises their capacity to respond.",
      ),
      derivedMeaning: L(
        locale,
        `${axisLabel} 차이는 일상에서는 마찰이지만, 이미 검증된 회복 절차 안에서는 자산으로 기능할 근거가 있습니다.`,
        `The ${axisLabel} gap reads as friction day-to-day, but there's real grounds for it to function as an asset inside their already-validated repair process.`,
      ),
      evidenceRefs: [`axisResults.${candidate.axis_key}`, ...repair.provenance.map((p) => p.evidenceId)],
      sourceSignals: [`psych.${candidate.axis_key}.gap`, "story_plan.repair.sequence"],
      confidence: "medium",
      claimBoundary: {
        supported: L(locale, "이 차이가 존재한다는 것과 회복 절차가 실제로 존재한다는 것.", "That this difference exists, and that a real repair sequence exists."),
        notSupported: L(
          locale,
          "이 차이가 실제 위기 상황에서 정말 그렇게 작동할지는 관찰로 확인된 것이 아니라 구조적 가능성입니다.",
          "Whether this difference actually plays out that way in a real crisis is a structural possibility, not an observed fact.",
        ),
      },
      // User-facing Ch.06 "관계를 위한 액션 플랜" = engine chapterId c7_repair.
      suggestedChapter: "c7_repair",
    },
  ];
}

// ── §3.6 Bidirectional Blind Spot ────────────────────────────────────────
// Requires BOTH misread directions to be present. Output must be a new
// synthesis, not a repeat of either paragraph.

function buildBlindSpotInsight(
  misreads: CanonicalRelationshipStoryPlan["misreads"],
  locale: "ko-KR" | "en-US",
): RomanticCrossSignalInsight[] {
  const aObservesB = misreads?.find((m) => m.direction === "a_observes_b");
  const bObservesA = misreads?.find((m) => m.direction === "b_observes_a");
  if (!aObservesB || !bObservesA) return [];
  return [
    {
      id: "xsig_blind_spot_mutual",
      insightType: "blind_spot",
      aDoes: bObservesA.observedBehavior,
      bReadsAsA: bObservesA.commonNegativeReading,
      bDoes: aObservesB.observedBehavior,
      aReadsAsB: aObservesB.commonNegativeReading,
      crossSignalResult: L(
        locale,
        "두 사람 다 자기 입장에서는 앞뒤가 맞는 행동을 하고 있는데, 그 행동이 공교롭게도 상대가 이미 가지고 있던 걱정을 확인시켜주는 모양으로 맞물립니다 — 그래서 둘 다 '이해받지 못하고 있다'는 확신만 점점 강해집니다.",
        "Both people are acting from motives that make complete sense from their own side — but each behavior happens to land exactly where it confirms the other's pre-existing fear, so both end up more convinced they aren't being understood, not less.",
      ),
      derivedMeaning: L(
        locale,
        "두 오해가 각자 따로 있을 때는 안 보이던, 서로를 강화하는 순환 구조가 있습니다.",
        "There's a mutually reinforcing loop that isn't visible when each misread is looked at on its own.",
      ),
      evidenceRefs: [...aObservesB.provenance.map((p) => p.evidenceId), ...bObservesA.provenance.map((p) => p.evidenceId)],
      sourceSignals: ["misreads.a_observes_b", "misreads.b_observes_a"],
      confidence: "high",
      claimBoundary: {
        supported: L(locale, "두 오해가 서로 맞물리는 구조가 존재한다는 것.", "That the two misreads structurally interlock."),
        notSupported: L(locale, "이 순환이 실제로 이 두 사람 사이에서 몇 번이나 일어났는지는 알 수 없습니다.", "How many times this loop has actually played out between them is unknown."),
      },
      // User-facing Ch.05 "오해 너머의 진심" = engine chapterId c6_hidden_hearts
      // (NOT c5_misunderstanding, which is user-facing Ch.04).
      suggestedChapter: "c6_hidden_hearts",
    },
  ];
}

// ── §4 Superpower ("A × B → C", not "A does X, B does Y") ───────────────
// Requires >=2 independent pair-level (not per-person) evidence points:
// bonding.count>=2, plus at least one of stem-combine/six-combine hits, plus
// a non-empty sharedStrength (itself already a cross-person synthesis).
// Abstains and reports the gap otherwise — see the report's Known Limits.

function buildSuperpowerInsight(
  sharedStrength: string,
  bonding: (RomanticPairCeBondingValue & { summary?: string }) | null | undefined,
  stemCombineHitCount: number,
  sixCombineHitCount: number,
  locale: "ko-KR" | "en-US",
): RomanticCrossSignalInsight[] {
  const hasBonding = Boolean(bonding && bonding.count >= 2);
  const hasChartCombine = stemCombineHitCount > 0 || sixCombineHitCount > 0;
  const hasSharedStrength = Boolean(sharedStrength && sharedStrength.trim().length > 0);
  const supportingSignalCount = [hasBonding, hasChartCombine, hasSharedStrength].filter(Boolean).length;
  if (supportingSignalCount < 2) return [];

  return [
    {
      id: "xsig_superpower",
      insightType: "superpower",
      emergentCapability: sharedStrength,
      supportingSignalCount,
      derivedMeaning: L(
        locale,
        "이 능력은 두 사람이 각자 가진 것의 합이 아니라, 이 조합이기 때문에 새로 생기는 능력입니다.",
        "This capability isn't the sum of what each person already has individually — it's new, and it exists specifically because of this pairing.",
      ),
      evidenceRefs: [
        ...(hasBonding ? ["canonical_projections.pair_ce_bonding"] : []),
        ...(stemCombineHitCount > 0 ? ["canonical_projections.cross_chart_stem_combine"] : []),
        ...(sixCombineHitCount > 0 ? ["canonical_projections.cross_chart_six_combine"] : []),
      ],
      sourceSignals: ["pair_ce_bonding.count", "cross_chart_stem_combine.hitCount", "cross_chart_six_combine.hitCount", "story_plan.sharedStrength"],
      confidence: supportingSignalCount >= 3 ? "high" : "medium",
      claimBoundary: {
        supported: L(locale, "여러 독립적 페어 신호가 같은 방향을 가리킨다는 것.", "That multiple independent pair-level signals point the same direction."),
        notSupported: L(
          locale,
          "이 능력이 다른 상대와는 절대 안 생긴다는 뜻은 아닙니다 — 이 조합에서 특히 잘 뒷받침된다는 뜻입니다.",
          "This doesn't mean the capability is impossible with any other partner — only that it's especially well-supported in this specific pairing.",
        ),
      },
      suggestedChapter: "c2_attraction",
    },
  ];
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function buildRomanticCrossSignalIntelligence(
  input: RomanticCrossSignalInput,
): RomanticCrossSignalInsight[] {
  const { storyPlan, relCeA, relCeB, axisResults, bonding, locale } = input;
  const stemCombineHitCount = input.stemCombineHitCount ?? 0;
  const sixCombineHitCount = input.sixCombineHitCount ?? 0;

  return [
    ...buildInnateCurrentForPerson("a", relCeA, locale),
    ...buildInnateCurrentForPerson("b", relCeB, locale),
    ...buildHiddenCollisionInsights(axisResults, locale),
    ...buildStrengthShadowInsights(storyPlan.bilateralChanges, locale),
    ...buildParadoxInsight(storyPlan.attraction, bonding, locale),
    ...buildDifferenceRescueInsight(axisResults, storyPlan.repair, locale),
    ...buildBlindSpotInsight(storyPlan.misreads, locale),
    ...buildSuperpowerInsight(storyPlan.sharedStrength, bonding, stemCombineHitCount, sixCombineHitCount, locale),
  ];
}
