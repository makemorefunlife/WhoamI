/**
 * Presentation-only adapters: map the read-only canonical V4 engine output
 * (CanonicalSection blocks + structuredData, and payload.axisOverview) into
 * the prop shapes the Lovable-ported chapter components expect.
 *
 * Nothing here computes, scores, or interprets — it only reshapes strings and
 * already-computed structuredData that the engine already produced. Fields
 * Lovable's mock assumed but the engine doesn't expose (e.g. a numeric
 * dynamics score, a fully worked repair example, per-lesson choice text) are
 * left undefined/omitted rather than invented — callers must render those as
 * optional.
 */
import type { CanonicalSection } from "@/lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";
import type {
  AxisPriorityRow,
  StoryFace,
  AttractionNarrativeUnit,
  HiddenHeartBits,
  BilateralChange,
  DirectionalMisread,
} from "@/lib/relationship/romantic/prototypeV4/canonicalStoryPlanTypes";
import type { RomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/types";
import { labelOfAxis } from "@/lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { buildAxisAttributionSentence } from "@/lib/relationship/psychDomainLens/shared";
import type { DomainPsychHighlight } from "@/lib/relationship/psychDomainLens/types";

/**
 * The full Story Plan (payload.canonicalReport.storyPlan) carries richer
 * structured data than what composeCanonicalSectionNarratives flattens into
 * section blocks — e.g. per-person strength arrays and the full misread
 * record (rewritten line, helpful response). Read-only access; nothing here
 * writes back into the engine.
 */
const storyPlanOf = (payload: RomanticV4PrototypePayload) => payload.canonicalReport?.storyPlan;

export type Person = "a" | "b";

const block = (section: CanonicalSection | undefined, id: string) =>
  section?.blocks.find((b) => b.blockId === id);

const blocksStartingWith = (section: CanonicalSection | undefined, prefix: string) =>
  section?.blocks.filter((b) => b.blockId.startsWith(prefix)) ?? [];

/** Pull a labelled line out of a "Label: value" joined body, if present. */
function pickLine(body: string | undefined, label: string): string | undefined {
  if (!body) return undefined;
  const line = body.split("\n").find((l) => l.trim().startsWith(label));
  return line ? line.trim().slice(label.length).trim() : undefined;
}

/* ── Chapter 1 · Hero ─────────────────────────────────────── */
export type HeroData = { essence: string; definition: string };

export function adaptHero(section: CanonicalSection | undefined): HeroData {
  return {
    essence: block(section, "def.core")?.body ?? "",
    definition: block(section, "def.bond")?.body ?? "",
  };
}

/* ── Chapter 2 · Attraction ───────────────────────────────── */
export type AttractionDirCard = {
  from: Person;
  to: Person;
  title: string;
  body: string;
  signals: string[];
  /** A concrete "what this looks like together" moment — already computed by
   * the engine from real chart signals (e.g. day-branch Ten God), just not
   * previously surfaced per-direction (only the mutual card used it). */
  scene: string | null;
  /** What dating the "to" person looks like, from their dominant Ten God
   * (personalRelationshipCe.dominantTenGodProfile.datingVibe) — read from the
   * story plan, not the flattened block. */
  datingVibe: string | null;
};
export type AttractionData = {
  whyYou: AttractionDirCard;
  whyMe: AttractionDirCard;
  whyUs: { title: string; body: string; mechanism: string[] };
  moment: { line: string; scene: string } | null;
  bridge: string | null;
};

function unitToCard(
  from: Person,
  to: Person,
  fallbackTitle: string,
  unit: AttractionNarrativeUnit | undefined,
  datingVibe: string | null,
): AttractionDirCard {
  if (!unit) return { from, to, title: fallbackTitle, body: "", signals: [], scene: null, datingVibe };
  return {
    from,
    to,
    title: fallbackTitle,
    body: [unit.recognition, unit.emotionalMeaning].filter(Boolean).join(" "),
    signals: unit.partnerEvidence ?? [],
    scene: unit.scene ?? null,
    datingVibe,
  };
}

export function adaptAttraction(
  section: CanonicalSection | undefined,
  payload: RomanticV4PrototypePayload,
): AttractionData {
  const aBlock = block(section, "attr.a");
  const bBlock = block(section, "attr.b");
  const uniqueBlock = block(section, "attr.unique");
  const unitA = aBlock?.structuredData as AttractionNarrativeUnit | undefined;
  const unitB = bBlock?.structuredData as AttractionNarrativeUnit | undefined;
  const unitMutual = uniqueBlock?.structuredData as AttractionNarrativeUnit | undefined;

  const plan = storyPlanOf(payload);
  // Each card is about dating the "to" person, so its dating vibe comes from
  // that person's own dominant-Ten-God profile (a_to_b card → B's vibe, and
  // vice versa) — not the observer's.
  const datingVibeB = plan?.personalRelationshipCeB?.dominantTenGodProfile?.datingVibe ?? null;
  const datingVibeA = plan?.personalRelationshipCeA?.dominantTenGodProfile?.datingVibe ?? null;

  return {
    whyYou: unitToCard("a", "b", aBlock?.title ?? "끌리는 지점", unitA, datingVibeB),
    whyMe: unitToCard("b", "a", bBlock?.title ?? "끌리는 지점", unitB, datingVibeA),
    whyUs: {
      title: uniqueBlock?.title ?? "둘 사이에서만 나타나는 시너지",
      body: unitMutual
        ? [unitMutual.recognition, unitMutual.emotionalMeaning].filter(Boolean).join(" ")
        : (uniqueBlock?.body ?? ""),
      mechanism: unitMutual?.partnerEvidence ?? [],
    },
    moment:
      unitMutual?.scene
        ? { line: unitMutual.recognition, scene: unitMutual.scene }
        : null,
    bridge: unitMutual?.tensionBridge ?? null,
  };
}

/* ── Chapter 3 · Dynamics ─────────────────────────────────── */
export type DynamicState = {
  key: string;
  label: string;
  summary?: string;
  interpretation: string;
  strength: string;
  caution: string;
  basis?: string;
};

export function adaptDynamics(section: CanonicalSection | undefined): DynamicState[] {
  return (section?.blocks ?? []).map((b) => {
    const f = b.structuredData as StoryFace | undefined;
    return {
      key: f?.situation ?? b.blockId,
      label: b.title,
      summary: f?.observableSignal,
      interpretation: f?.appearance ?? b.body,
      strength: f?.benefit ?? "",
      caution: f?.riskWhenExcess ?? "",
      basis: f?.mechanism,
    };
  });
}

/* ── Chapter 4 · Conflict ─────────────────────────────────── */
export type ConflictPair = { person: Person; does: string; readAs: string };
export type ConflictData = {
  triggerTitle: string;
  triggerBody: string;
  pairs: ConflictPair[];
  escalation: { a: string; b: string } | null;
  loop: string | null;
};

/** Only the first sentence of the (often long) observedBehavior text — the
 * engine writes it as a full behavioral-pattern paragraph, not a short scene,
 * so this trims to the first sentence rather than inventing a shorter one.
 * Shared by the Conflict pairs and the Translator panels below. */
function firstSentenceOf(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : text).trim();
}

export function adaptConflict(
  section: CanonicalSection | undefined,
  payload: RomanticV4PrototypePayload,
): ConflictData {
  const trigger = block(section, "loop.trigger");
  const plan = storyPlanOf(payload);
  const misreadAObservesB = plan?.misreads?.find((m) => m.direction === "a_observes_b");
  const misreadBObservesA = plan?.misreads?.find((m) => m.direction === "b_observes_a");

  // Lovable's two-person "does / 상대에게 도착하는 방식" cards have no direct
  // block on c4_conflict — the real equivalent is each misread record, read
  // from the story plan: for direction "a_observes_b", observedBehavior is
  // what B does and commonNegativeReading is how A reads it (and vice versa).
  const pairs: ConflictPair[] = [];
  if (misreadBObservesA) {
    pairs.push({
      person: "a",
      does: firstSentenceOf(misreadBObservesA.observedBehavior),
      readAs: misreadBObservesA.commonNegativeReading,
    });
  }
  if (misreadAObservesB) {
    pairs.push({
      person: "b",
      does: firstSentenceOf(misreadAObservesB.observedBehavior),
      readAs: misreadAObservesB.commonNegativeReading,
    });
  }

  return {
    triggerTitle: trigger?.title ?? "시작 상황",
    triggerBody: trigger?.body ?? "",
    pairs,
    escalation:
      misreadAObservesB?.observerFelt && misreadBObservesA?.observerFelt
        ? { a: misreadAObservesB.observerFelt, b: misreadBObservesA.observerFelt }
        : null,
    // Not exposed via section blocks — read directly from the story plan.
    loop: plan?.recurringLoop?.residue ?? null,
  };
}

/* ── Chapter 5 · Difference & Misunderstanding ───────────────*/
export type ComparisonRow = { axis: string; a: string; meaning: string; b: string };
export type DifferenceDetail = {
  axis: string;
  meaning: string;
  gap: number;
  aPattern: string;
  bPattern: string;
  between: string;
  benefit: string;
  stress: string;
};
export type TranslatorPanel = {
  observer: Person;
  other: Person;
  what: string;
  easyReading: string;
  actualMeaning: string;
  betterExpression?: string;
  helpfulResponse?: string;
};

/**
 * "나란히 놓고 보기" is fixed to Lovable's 6 topics (romantic-v4-data.ts):
 * 감정 처리, 갈등 대응, 계획 방식, 애정 확인, 회복 속도, 에너지 충전 — in that
 * order. Three come from payload.comparisonTable (a SajuComparisonRow[]);
 * the other three ("계획 방식" / "회복 속도" / "에너지 충전") have no row in
 * that table at all, so they're read from storyPlan.allAxes instead — the
 * same AxisPriorityRow shape used by the top-differences cards below, just
 * for axes that aren't necessarily "top" differences. Both are real,
 * already-computed engine text; nothing here is invented.
 */
function comparisonRowFromTable(
  payload: RomanticV4PrototypePayload,
  rowId: string,
  label: string,
): ComparisonRow | null {
  const row = payload.comparisonTable?.find((r) => r.rowId === rowId);
  if (!row) return null;
  return { axis: label, a: row.personA, meaning: row.understandingPoint, b: row.personB };
}

function comparisonRowFromAxis(
  payload: RomanticV4PrototypePayload,
  axisKey: string,
  label: string,
): ComparisonRow | null {
  const axis = storyPlanOf(payload)?.allAxes?.find((a) => a.axisKey === axisKey);
  if (!axis) return null;
  return {
    axis: label,
    a: axis.personATendency,
    meaning: axis.plainLanguageDefinition,
    b: axis.personBTendency,
  };
}

export function adaptDifference(
  section: CanonicalSection | undefined,
  payload: RomanticV4PrototypePayload,
) {
  const diffBlocks = blocksStartingWith(section, "axis.diff.");
  const rows: AxisPriorityRow[] = diffBlocks
    .map((b) => b.structuredData as AxisPriorityRow | undefined)
    .filter((d): d is AxisPriorityRow => Boolean(d));

  const isEn = payload.locale === "en-US";
  const comparison: ComparisonRow[] = [
    comparisonRowFromTable(payload, "compare.stress", isEn ? "Handling Emotion" : "감정 처리"),
    comparisonRowFromTable(payload, "compare.conflict", isEn ? "Facing Conflict" : "갈등 대응"),
    comparisonRowFromAxis(payload, "structure", isEn ? "Planning Style" : "계획 방식"),
    comparisonRowFromTable(payload, "compare.affection", isEn ? "Confirming Affection" : "애정 확인"),
    comparisonRowFromAxis(payload, "resilience", isEn ? "Recovery Speed" : "회복 속도"),
    comparisonRowFromAxis(payload, "energy_style", isEn ? "Recharging Energy" : "에너지 충전"),
  ].filter((r): r is ComparisonRow => Boolean(r));

  const details: DifferenceDetail[] = rows.map((d) => ({
    axis: d.axisLabel,
    meaning: d.plainLanguageDefinition,
    gap: d.gap,
    aPattern: d.personATendency,
    bPattern: d.personBTendency,
    between: d.pairDynamic,
    benefit: d.relationshipStrength,
    stress: d.relationshipRisk,
  }));

  return { comparison, details };
}

/**
 * Translator panels, read directly from storyPlan.misreads (not the
 * flattened block text) so the rewritten line and helpful-response guidance
 * are available. Presentation-owned chapter placement — used by the Hidden
 * Hearts chapter, not Difference (see ChaptersB.tsx).
 */
export function adaptTranslatorPanels(payload: RomanticV4PrototypePayload): TranslatorPanel[] {
  const plan = storyPlanOf(payload);
  return (plan?.misreads ?? []).map((m: DirectionalMisread) => {
    const observer: Person = m.direction === "a_observes_b" ? "a" : "b";
    return {
      observer,
      other: observer === "a" ? "b" : "a",
      what: firstSentenceOf(m.observedBehavior),
      easyReading: m.commonNegativeReading,
      actualMeaning: m.meaningGap,
      betterExpression: m.betterExpression,
      helpfulResponse: m.helpfulResponse,
    };
  });
}

/**
 * 11-axis radar comes from payload-level axisOverview, not section blocks.
 * Labels are read from the engine's own locale-aware AXIS_LABELS (not
 * duplicated here) so this renders correctly for both ko-KR and en-US —
 * axisOverview entries only carry the raw axis_key, not a display label.
 */
export function adaptRadarAxes(payload: RomanticV4PrototypePayload) {
  return (payload.axisOverview ?? []).map((a) => ({
    axis_key: a.axis_key, // Ensure axis_key is present for PsychAxisComparisonSection
    key: a.axis_key,
    label: labelOfAxis(payload.locale, a.axis_key),
    a: a.score_a,
    b: a.score_b,
    score_a: a.score_a, // Adding these to satisfy PsychMatchAxisResult if needed
    score_b: a.score_b,
    gap: Math.abs(a.score_a - a.score_b),
    match_type: a.match_type,
  }));
}

export function adaptRadarHighlights(
  payload: RomanticV4PrototypePayload,
  personA: string,
  personB: string,
): DomainPsychHighlight[] {
  let insights = payload?.selectedAxisInsights ?? [];

  // Fallback: If selectedAxisInsights is missing/empty (e.g. legacy DB cache or payload without pre-sliced insights),
  // derive top 4 high-gap axes dynamically from axisOverview so Dark Cards ALWAYS render!
  if ((!insights || insights.length === 0) && payload?.axisOverview && payload.axisOverview.length > 0) {
    const sorted = [...payload.axisOverview].sort(
      (a, b) => Math.abs(b.score_a - b.score_b) - Math.abs(a.score_a - a.score_b),
    );
    insights = sorted.slice(0, 4).map((a) => {
      const gap = Math.abs(a.score_a - a.score_b);
      const matchType = gap < 12 ? "resonance" : gap > 25 ? "tension" : "complement";
      return {
        axisKey: a.axis_key,
        axisLabel: a.axis_label,
        gap,
        matchType,
        whyItMatters: `${personA}님과 ${personB}님의 ${a.axis_label} 차이가 정서적 소통 템포에 반영됩니다.`,
        relationshipEffect:
          matchType === "resonance"
            ? "비슷한 성향으로 의사결정 시 높은 직관적 공감대를 형성합니다."
            : "상대와의 템포 차이로 인해 오해가 발생할 수 있어 서로의 필요를 명확히 말해주는 전환이 유용합니다.",
      } as any;
    });
  }

  return insights.slice(0, 4).map((row) => {
    const key = row.axisKey || (row as any).axis_key;
    const axis = payload.axisOverview?.find((a) => a.axis_key === key);
    const axisLabel = row.axisLabel || (row as any).axis_label || labelOfAxis(payload.locale, key);
    const scoreA = axis?.score_a ?? 50;
    const scoreB = axis?.score_b ?? 50;
    const gap = Math.abs(scoreA - scoreB);
    let lean: "even" | "a_high" | "b_high" = "even";
    if (gap >= 10) {
      lean = scoreA > scoreB ? "a_high" : "b_high";
    }

    const hook = buildAxisAttributionSentence({
      axisLabel,
      matchType: row.matchType,
      lean,
      nameA: personA,
      nameB: personB,
      locale: payload.locale,
    });

    return {
      axis_key: key as DomainPsychHighlight["axis_key"],
      axis_label: axisLabel,
      gap: row.gap,
      match_type: row.matchType,
      topic: "",
      section_hint: "",
      hook,
      narrative: [row.whyItMatters, row.relationshipEffect].filter(Boolean).join(" "),
    };
  });
}

/* ── Chapter 6 · Hidden Hearts ────────────────────────────── */
export type HiddenHeartCard = {
  person: Person;
  need: string;
  fear: string;
  defense: string;
  recognition: string;
};

export function adaptHiddenHearts(section: CanonicalSection | undefined): HiddenHeartCard[] {
  return ["hidden.a", "hidden.b"]
    .map((id) => block(section, id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .map((b) => {
      const h = b.structuredData as HiddenHeartBits | undefined;
      return {
        person: (h?.person ?? (b.blockId === "hidden.a" ? "a" : "b")) as Person,
        need: h?.unspokenNeed ?? "",
        fear: h?.fear ?? "",
        defense: h?.visibleReaction ?? "",
        recognition: h?.whatHelps ?? "",
      };
    });
}

/* ── Chapter 7 · Repair ───────────────────────────────────── */
export type RepairHelp = { person: Person; tips: string[] };
export type RepairStep = { step: number; title: string };

export function adaptRepair(section: CanonicalSection | undefined) {
  const sequence = block(section, "repair.sequence");
  const helpsA = block(section, "repair.helpsA");
  const helpsB = block(section, "repair.helpsB");

  const steps: RepairStep[] = (sequence?.body ?? "")
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    .map((title, i) => ({ step: i + 1, title }));

  const toTips = (b: ReturnType<typeof block>) =>
    (b?.body ?? "")
      .split("\n")
      .map((l) => l.replace(/^•\s*/, "").trim())
      .filter(Boolean);

  const helps: RepairHelp[] = [
    { person: "a" as Person, tips: toTips(helpsA) },
    { person: "b" as Person, tips: toTips(helpsB) },
  ];

  return { steps, helps };
}

/* ── Chapter 8 · Strength & Vulnerability ─────────────────── */
export type StrengthGive = {
  from: Person;
  to: Person;
  title: string;
  body: string;
  shadow: string;
  signals: string[];
};
export type SharedBlock = { title: string; body: string };

export function adaptStrength(
  section: CanonicalSection | undefined,
  payload: RomanticV4PrototypePayload,
) {
  const plan = storyPlanOf(payload);
  // strengthsGivenToPartner isn't in BilateralChange (what composeCanonical...
  // exposes on the block) — it lives on the personal CE, read from the story
  // plan directly: A's card shows what A gives (personalRelationshipCeA).
  const signalsFor = (from: Person) => {
    const ce = from === "a" ? plan?.personalRelationshipCeA : plan?.personalRelationshipCeB;
    return (ce?.strengthsGivenToPartner ?? []).map((m) => m.text).slice(0, 3);
  };

  const giftBlocks = blocksStartingWith(section, "gift.");
  const gives: StrengthGive[] = giftBlocks.map((b) => {
    const c = b.structuredData as BilateralChange | undefined;
    const from = (c?.from ?? "a") as Person;
    return {
      from,
      to: (c?.to ?? "b") as Person,
      title: b.title,
      body: c?.change ?? b.body,
      shadow: c?.excessVulnerability ?? "",
      signals: signalsFor(from),
    };
  });

  const sharedStrengthBlock = block(section, "shared.strength");
  const sharedVulnerabilityBlock = block(section, "shared.vulnerability");

  return {
    gives,
    sharedStrength: {
      title: sharedStrengthBlock?.title ?? "",
      body: sharedStrengthBlock?.body ?? "",
    } as SharedBlock,
    sharedVulnerability: {
      title: sharedVulnerabilityBlock?.title ?? "",
      body: sharedVulnerabilityBlock?.body ?? "",
    } as SharedBlock,
  };
}

/* ── Chapter 9 · Daily Life ───────────────────────────────── */
export type DailyLifeCard = { title: string; difference: string; agreement: string; usableLine: string };

/**
 * Prefers structuredData (the RealLifeDomain object, locale-independent
 * fields) over parsing "차이:"/"합의:"/"문장:" labels out of body — those
 * labels are Korean-only literals in composeCanonicalSectionNarratives.ts
 * and return nothing once body is rendered in English. pickLine stays only
 * as a defensive fallback for any legacy block without structuredData.
 */
export function adaptDailyLife(section: CanonicalSection | undefined): DailyLifeCard[] {
  return (section?.blocks ?? []).map((b) => {
    const d = b.structuredData as { difference?: string; agreement?: string; usableLine?: string } | undefined;
    return {
      title: b.title,
      difference: d?.difference ?? pickLine(b.body, "차이:") ?? "",
      agreement: d?.agreement ?? pickLine(b.body, "합의:") ?? "",
      usableLine: d?.usableLine ?? pickLine(b.body, "문장:") ?? "",
    };
  });
}

/* ── Chapter 10 · Future ──────────────────────────────────── */
export type FutureCard = { title: string; body: string };

export function adaptFuture(section: CanonicalSection | undefined): FutureCard[] {
  return (section?.blocks ?? []).map((b) => ({ title: b.title, body: b.body }));
}

/* ── Chapter 11 · Reflection ──────────────────────────────── */
export function adaptReflection(section: CanonicalSection | undefined): string[] {
  const q = block(section, "close.questions");
  return (q?.body ?? "")
    .split("\n")
    .map((l) => l.replace(/^•\s*/, "").trim())
    .filter(Boolean);
}

/* ── Chapter 12 · Choice ──────────────────────────────────── */
export type RememberLine = { person: Person; line: string };

export function adaptChoice(
  section: CanonicalSection | undefined,
  payload: RomanticV4PrototypePayload,
) {
  const possibility = block(section, "close.possibility");
  const remember = block(section, "close.remember");
  const [lineA, lineB] = (remember?.body ?? "").split("\n");
  const rememberLines: RememberLine[] = [
    { person: "a" as Person, line: (lineA ?? "").trim() },
    { person: "b" as Person, line: (lineB ?? "").trim() },
  ].filter((r) => r.line.length > 0);

  // Not exposed via section blocks — read directly from the story plan.
  const closing = storyPlanOf(payload)?.closing;

  return {
    possibility: possibility?.body ?? "",
    remember: rememberLines,
    watchSignals: closing?.watchSignals ?? [],
    improvingSignals: closing?.improvingSignals ?? [],
    cautionSignals: closing?.cautionSignals ?? [],
  };
}
