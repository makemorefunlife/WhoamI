/**
 * Batch 3 — formats Batch 2's Part01IdentityEvidencePacket into compact,
 * key-tagged text blocks for Core Mode / Growth Edge grounding, and tracks
 * the exact key universe shown so any evidence_refs the LLM returns can be
 * checked against real packet keys (never trust invented keys).
 *
 * Deliberately does NOT dump dimensions.allDimensions (12) wholesale — only
 * the purpose-specific buckets Batch 2's Lens already selected
 * (layeredIdentityCandidates.firstImpression/knownSelf, ceStrengthSignals,
 * growthCandidates.*) are used, matching "Lens selects, does not conclude"
 * and "prefer purpose-specific buckets over the full preservation set."
 *
 * Batch 4 — reuses the same candidate-bucket-to-text pattern for the 4
 * Layered Identity buckets (firstImpression/knownSelf/closePrivateSelf/
 * naturalSelfAndDeepNeeds), each formatted independently so a layer's
 * evidence_refs can only ever point at that layer's own bucket.
 *
 * Batch 6 — one shared Strengths/Watchouts evidence block (unlike the
 * Layered Identity layers, these two are deliberately NOT isolated: the
 * spec wants the LLM able to notice a single trait's positive/shadow
 * duality, so strengths and watchouts draw from — and are validated
 * against — the same known-key set).
 *
 * Batch 7 — Axis Interpretation (Current x Innate). Current Self evidence
 * is isolated PER AXIS (that axis's own
 * AxisComparison.current.secondaryEvidence — already scoped by the
 * existing Batch 1 PRIMARY_TO_SECONDARY_AXIS_KEYS map, no new mapping
 * added). Innate Self evidence is ONE shared pool (general identity facts
 * + CE strengths/growth/cautions groups, same source family as Batch 6,
 * shown once rather than repeated per axis for token compactness) — per
 * spec, Current and Innate evidence must never mix, so the shared pool
 * deliberately excludes axis/secondary-11 lines (unlike Batch 6's pool).
 *
 * Batch 8 — replaces "interpret all 6 axes equally" with a deterministic
 * subset: only the axes selectAxisHighlights() picks (top gap axes +
 * the single most-aligned axis) get evidence built/sent to the LLM at
 * all. The static per-axis "meaning" line is gone from here entirely —
 * that's now pure UI copy (deepEssenceUiStrings.ts glossary), never
 * generated or seen by the LLM.
 *
 * Part 02 Batch 1 — Energy evidence Lens. First section that isn't part of
 * Part 01. Compact, purpose-specific selection only: 3 of the 12 CE
 * dimensions (solitude_autonomy/pressure_response/criticism_sensitivity),
 * 2 of the 11 Secondary axes (energy_style/resilience) — never a dump of
 * either full set. Reuses climate (johu/seasonal_strength) + elemental
 * balance since those are literally about energetic temperament, the same
 * CE strengths/growth/cautions trio every other Lens already uses, and the
 * SAME gap/alignment axes selectAxisHighlights() already picked for
 * axis_interpretations (reused, not re-derived) so Energy can translate an
 * already-identified gap into an energy-cost angle.
 *
 * Part 02 Batch 3 — widens the Secondary-11 pick to include conflict_style
 * (already-computed Current CE output, no new mapping) so
 * pressure/conflict/emotional-labor drains have a real signal beyond
 * pressure_response alone. No other evidence source added — the remaining
 * Q4-Q8 gap closure is prompt-instruction-only (see the energy grounding
 * rule in deepEssenceStructured.ts).
 *
 * Part 03 Batch 1 — Relationship evidence Lens, grounding Part B's
 * relationships.pattern/fit/friction/compare for the first time (previously
 * fully ungrounded). Compact, purpose-specific selection: 9 of 12 CE
 * relational dimensions, 3 of 11 Secondary axes, and the already-selected
 * gap/alignment axes (reused from axis_interpretations/energy, not
 * re-derived). No new mapping/calculation.
 *
 * Part 04 Batch 1 — Practice evidence Lens, grounding playbook.rule/rows/
 * heated/reset for the first time (previously fully ungrounded, same gap
 * Part03 had pre-Batch-1). Compact selection: 4 of 12 CE dimensions
 * (conflict_decompression/pressure_response/criticism_sensitivity/
 * expression_style), 2 of 11 Secondary axes (decision_style/resilience).
 * Deliberately does NOT re-include the axis gap/alignment pair or a full
 * Relationship-evidence duplicate — those are already in the same Part B
 * prompt via [Relationship evidence] (Batch 1), referenced not repeated.
 * Growth Edge's action anchor (summary.growth_edge_real_life_pattern) isn't
 * packet evidence at all — it already flows into Part B via the existing
 * partAExcerpt plumbing, so no new wiring was needed for it.
 *
 * Part 05 Batch 1 — Future evidence Lens, grounding future.remember/leap for
 * the first time (closing stays untouched). Deliberately the smallest Lens
 * yet: just the already-selected best-aligned axis (reused from
 * selectAxisHighlights(), not re-derived — no new CE dims/secondary added).
 * Everything else this batch reuses (growth_edge_if_developed via
 * partAExcerpt's existing summary pass-through, energy.optimal via a small
 * partAExcerpt addition, relationships.fit/playbook.reset via same-completion
 * continuity) is prior output, not new packet evidence, so no Lens function
 * is needed for those — only prompt instructions to synthesize them.
 */
import type {
  Part01CandidateItem,
  Part01EvidenceRef,
  Part01IdentityEvidencePacket,
} from "@/lib/v1/slim/part01IdentityEvidence";
import { buildPersonalPart04StoryPlan } from "./buildPersonalPart04StoryPlan";
import { selectAxisHighlights, type AxisComparison } from "@/lib/v2/analysis/axisComparison";
import type { PrimaryAxisKey } from "@/lib/v2/survey/types";

function evidenceKey(ref: Part01EvidenceRef): string {
  return ref.fact_path;
}

function dimensionKey(dimension: string): string {
  return `dimension:${dimension}`;
}

function axisKey(axis: string): string {
  return `axis:${axis}`;
}

function secondaryKey(key: string): string {
  return `secondary:${key}`;
}

function isUsableDimensionConfidence(confidence: string): boolean {
  // "insufficient" means the CE found no real signal for this dimension —
  // surfacing it as grounding material would be noise, not evidence.
  return confidence !== "insufficient";
}

function formatEvidenceLine(ref: Part01EvidenceRef): string {
  const conf = ref.confidence ? ` conf=${ref.confidence}` : "";
  return `- [${evidenceKey(ref)}] codes=${ref.codes.join(",")}${conf}`;
}

function formatCandidateItemLine(item: Part01CandidateItem): string | null {
  if (item.kind === "evidence") return formatEvidenceLine(item);
  if (!isUsableDimensionConfidence(item.evaluation.confidence)) return null;
  const mixed = item.evaluation.is_mixed ? " mixed=true" : "";
  return `- [${dimensionKey(item.dimension)}] value=${item.evaluation.value} conf=${item.evaluation.confidence}${mixed}`;
}

/** Up to 2 widest-gap axes + the single most-aligned axis — not all 6 dumped as "notable". */
function selectNotableAxes(axisComparisons: AxisComparison[]): AxisComparison[] {
  const wide = axisComparisons
    .filter((a) => a.magnitude === "wide")
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2);
  const mostAligned = [...axisComparisons].sort(
    (a, b) => Math.abs(a.delta) - Math.abs(b.delta),
  )[0];
  const picked = [...wide];
  if (mostAligned && !picked.some((a) => a.axis === mostAligned.axis)) {
    picked.push(mostAligned);
  }
  return picked;
}

function formatAxisLine(a: AxisComparison): string {
  return `- [${axisKey(a.axis)}] current=${a.current.score} innate=${a.innate.score} delta=${a.delta} direction=${a.direction} magnitude=${a.magnitude}`;
}

/** Formats a single candidate bucket into text + its own known-key set (no cross-bucket mixing). */
function buildCandidateBucketEvidence(items: Part01CandidateItem[]): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];
  for (const item of items) {
    const key = item.kind === "evidence" ? evidenceKey(item) : dimensionKey(item.dimension);
    const line = formatCandidateItemLine(item);
    if (!line) continue; // abstained/insufficient dimension — not shown, key not claimed as known
    knownKeys.add(key);
    lines.push(line);
  }
  return { text: lines.join("\n"), knownKeys };
}

export type Part01LayerPromptEvidence = {
  text: string;
  knownKeys: Set<string>;
};

export type Part01LayeredIdentityPromptEvidence = {
  firstImpression: Part01LayerPromptEvidence;
  knownSelf: Part01LayerPromptEvidence;
  closePrivateSelf: Part01LayerPromptEvidence;
  naturalSelfAndDeepNeeds: Part01LayerPromptEvidence;
  /**
   * IA Batch 2 — union of all four layers' known keys. synthesis draws on
   * whichever layers the LLM actually wrote, not one isolated bucket, so its
   * evidence_refs are validated against this shared pool rather than any
   * single layer's own knownKeys (unlike the four layers above, which stay
   * mutually isolated).
   */
  synthesisKnownKeys: Set<string>;
};

export type EvidenceFamily =
  | "FAMILY_GAP"
  | "FAMILY_CURRENT_PSYCH"
  | "FAMILY_LAYER"
  | "FAMILY_SAJU"
  | "FAMILY_CE";

export type Part01PromptEvidence = {
  coreModeText: string;
  growthEdgeText: string;
  coreModeKnownKeys: Set<string>;
  growthEdgeKnownKeys: Set<string>;
  layeredIdentity: Part01LayeredIdentityPromptEvidence;
  strengthsWatchoutsText: string;
  strengthsWatchoutsKnownKeys: Set<string>;
  axisInterpretation: Part01AxisInterpretationPromptEvidence;
  energyText: string;
  energyKnownKeys: Set<string>;
  relationshipText: string;
  relationshipKnownKeys: Set<string>;
  practiceText: string;
  practiceKnownKeys: Set<string>;
  futureText: string;
  futureKnownKeys: Set<string>;
  /**
   * IA Batch 3 — union of the known keys already shown elsewhere in this
   * same Part A prompt (axis interpretation's innate pool + selected axes'
   * current pools, all four layered-identity buckets + synthesis, energy).
   * adaptation_story cites from what's already in context — it gets no
   * dedicated evidence-text block of its own.
   */
  adaptationStoryKnownKeys: Set<string>;
  /**
   * Batch 4 — deterministic mapping of each key in adaptationStoryKnownKeys
   * to its specific EvidenceFamily taxonomy. Used for strict provenance validation.
   */
  adaptationStoryKeyFamilies: Map<string, EvidenceFamily>;
  /**
   * IA Batch 3 — deterministic minimum-evidence gate (see
   * hasAdaptationStoryEvidence below). Controls whether the adaptation_story
   * schema field/instructions are offered to the LLM at all — never trust
   * the model to skip an ungrounded field on its own.
   */
  adaptationStoryEligible: boolean;
  /**
   * Batch 4B — Deterministic Personal Part 04 Story Plan constructed BEFORE LLM call.
   * Frame and evidence selection for adaptation_story expert synthesis.
   */
  storyPlan?: import("./buildPersonalPart04StoryPlan").PersonalPart04StoryPlan | null;
};

export type Part01AxisHighlightPromptEvidence = {
  axis: PrimaryAxisKey;
  /** Deterministic score/delta/direction/magnitude + an explicit "which side is higher" fact — never LLM-decided. */
  subjectText: string;
  currentText: string;
  currentKnownKeys: Set<string>;
};

export type Part01AxisInterpretationPromptEvidence = {
  /** Shared across every selected axis — Personal CE / Saju general evidence only, never mixed with Current/secondary-11. */
  innateEvidenceText: string;
  innateEvidenceKnownKeys: Set<string>;
  /** Deterministically selected (selectAxisHighlights) — 0-3 widest-gap axes. */
  gaps: Part01AxisHighlightPromptEvidence[];
  /** Deterministically selected — the single closest-aligned axis, or null. */
  alignment: Part01AxisHighlightPromptEvidence | null;
};

/** Builds Core Mode grounding text + the exact key set shown for it. */
function buildCoreModeEvidence(packet: Part01IdentityEvidencePacket): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];

  const addEvidence = (refs: Part01EvidenceRef[]) => {
    for (const ref of refs) {
      knownKeys.add(evidenceKey(ref));
      lines.push(formatEvidenceLine(ref));
    }
  };
  const addCandidates = (items: Part01CandidateItem[]) => {
    for (const item of items) {
      const key = item.kind === "evidence" ? evidenceKey(item) : dimensionKey(item.dimension);
      const line = formatCandidateItemLine(item);
      if (!line) continue; // abstained/insufficient dimension — not shown, key not claimed as known
      knownKeys.add(key);
      lines.push(line);
    }
  };

  lines.push("General identity facts:");
  addEvidence(packet.innate.identityFacts);
  addEvidence(packet.innate.elementEvidence);

  const notableAxes = selectNotableAxes(packet.axisComparisons);
  if (notableAxes.length) {
    lines.push("Notable Current x Innate axis signals:");
    for (const a of notableAxes) {
      knownKeys.add(axisKey(a.axis));
      lines.push(formatAxisLine(a));
    }
  }

  lines.push("Outward-facing identity signal candidates:");
  addCandidates(packet.layeredIdentityCandidates.firstImpression);
  addCandidates(packet.layeredIdentityCandidates.knownSelf);

  lines.push("CE strengths-group signals:");
  addEvidence(packet.innate.ceStrengthSignals);
  lines.push("CE cautions-group signals:");
  addEvidence(packet.growthCandidates.cautionEvidence);

  return { text: lines.join("\n"), knownKeys };
}

/** Builds Growth Edge grounding text + the exact key set shown for it. */
function buildGrowthEdgeEvidence(packet: Part01IdentityEvidencePacket): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];

  lines.push("Growth-group signals:");
  for (const ref of packet.growthCandidates.growthEvidence) {
    knownKeys.add(evidenceKey(ref));
    lines.push(formatEvidenceLine(ref));
  }
  lines.push("Caution-group signals:");
  for (const ref of packet.growthCandidates.cautionEvidence) {
    knownKeys.add(evidenceKey(ref));
    lines.push(formatEvidenceLine(ref));
  }

  lines.push("Relevant CE dimensions:");
  for (const cand of packet.growthCandidates.relevantDimensions) {
    if (!isUsableDimensionConfidence(cand.evaluation.confidence)) continue;
    const key = dimensionKey(cand.dimension);
    knownKeys.add(key);
    const mixed = cand.evaluation.is_mixed ? " mixed=true" : "";
    lines.push(
      `- [${key}] value=${cand.evaluation.value} conf=${cand.evaluation.confidence}${mixed}`,
    );
  }

  lines.push("Current x Innate axis signals (all 6 — gap alone does not decide the edge):");
  for (const a of packet.growthCandidates.axisEvidence) {
    knownKeys.add(axisKey(a.axis));
    lines.push(formatAxisLine(a));
  }

  const secondary = packet.currentBehavior.secondaryAxes;
  lines.push(
    `Current Secondary-11 (context only): ${Object.entries(secondary)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`,
  );

  return { text: lines.join("\n"), knownKeys };
}

/**
 * Builds the shared Strengths/Watchouts grounding text + known-key set.
 * Sources per Batch 6 spec: general identity facts, CE strengths/growth/
 * cautions-group signals, all 6 Current x Innate axes (alignment AND gap
 * both matter here — unlike Growth Edge, this is not gap-only), and
 * Secondary-11 as context. Deliberately compact — no allDimensions dump,
 * no CE dimension_evaluations at all (those stay Growth Edge/Core Mode's).
 */
function buildStrengthsWatchoutsEvidence(packet: Part01IdentityEvidencePacket): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];

  const addEvidence = (refs: Part01EvidenceRef[]) => {
    for (const ref of refs) {
      knownKeys.add(evidenceKey(ref));
      lines.push(formatEvidenceLine(ref));
    }
  };

  lines.push("General identity facts:");
  addEvidence(packet.innate.identityFacts);
  addEvidence(packet.innate.elementEvidence);

  lines.push("CE strengths-group signals:");
  addEvidence(packet.innate.ceStrengthSignals);
  lines.push("CE growth-group signals:");
  addEvidence(packet.growthCandidates.growthEvidence);
  lines.push("CE cautions-group signals:");
  addEvidence(packet.growthCandidates.cautionEvidence);

  lines.push(
    "Current x Innate axis signals (all 6 — both alignment and gap can be evidence here):",
  );
  for (const a of packet.axisComparisons) {
    knownKeys.add(axisKey(a.axis));
    lines.push(formatAxisLine(a));
  }

  const secondary = packet.currentBehavior.secondaryAxes;
  lines.push(
    `Current Secondary-11 (context only): ${Object.entries(secondary)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`,
  );

  return { text: lines.join("\n"), knownKeys };
}

/**
 * Builds the shared Innate Self evidence pool for Axis Interpretation.
 * Deliberately narrower than Batch 6's Strengths/Watchouts pool — no axis
 * comparison lines, no Secondary-11 context — because this batch's spec
 * requires Current and Innate evidence to never mix, and axis/secondary
 * data is already Current-flavored.
 */
function buildAxisInnateEvidence(packet: Part01IdentityEvidencePacket): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];

  const addEvidence = (refs: Part01EvidenceRef[]) => {
    for (const ref of refs) {
      knownKeys.add(evidenceKey(ref));
      lines.push(formatEvidenceLine(ref));
    }
  };

  lines.push("General identity facts:");
  addEvidence(packet.innate.identityFacts);
  addEvidence(packet.innate.elementEvidence);
  lines.push("CE strengths-group signals:");
  addEvidence(packet.innate.ceStrengthSignals);
  lines.push("CE growth-group signals:");
  addEvidence(packet.growthCandidates.growthEvidence);
  lines.push("CE cautions-group signals:");
  addEvidence(packet.growthCandidates.cautionEvidence);

  lines.push("Pillar & hidden stem dynamics:");
  addEvidence(packet.innate.pillarEvidence.slice(0, 6));

  if (packet.innate.relationEvidence.length) {
    lines.push("Intra-chart branch relations (internal tension or synergy):");
    addEvidence(packet.innate.relationEvidence);
  }

  if (packet.innate.optionalSignals.length) {
    lines.push("Special signals & Shinsals (supporting evidence only — require convergence, never raw jargon):");
    addEvidence(packet.innate.optionalSignals);
  }

  return { text: lines.join("\n"), knownKeys };
}

/**
 * Builds one axis's subject line (deterministic score/delta/direction/
 * magnitude, never re-derived by the LLM — plus an explicit plain-language
 * "which side is higher" fact, since getting this backwards is exactly the
 * bug this batch exists to fix) and that axis's own isolated Current Self
 * evidence (its Secondary-11 subset, per the existing Batch 1
 * PRIMARY_TO_SECONDARY_AXIS_KEYS map — autonomy has no mapping there by
 * product decision, so its Current Self evidence is legitimately empty;
 * the LLM falls back to the general survey material).
 */
function buildAxisHighlightEvidence(a: AxisComparison): Part01AxisHighlightPromptEvidence {
  const currentKnownKeys = new Set<string>();
  const currentLines: string[] = [];
  if (a.current.secondaryEvidence.length === 0) {
    currentLines.push(
      "(no Secondary-11 evidence mapped to this axis — ground current_pattern in the general survey context only)",
    );
  } else {
    for (const e of a.current.secondaryEvidence) {
      currentKnownKeys.add(secondaryKey(e.axis));
      currentLines.push(`- [${secondaryKey(e.axis)}] score=${e.score}`);
    }
  }
  const directionFact =
    a.direction === "current_higher"
      ? "Current is HIGHER than Innate — the person's current behavior score exceeds their natural/innate tendency score on this axis."
      : a.direction === "innate_higher"
        ? "Innate is HIGHER than Current — the person's natural/innate tendency score exceeds their current behavior score on this axis."
        : "Current and Innate are essentially aligned (near-zero delta).";
  return {
    axis: a.axis,
    subjectText: `${formatAxisLine(a)}\nDirection fact (never contradict): ${directionFact}`,
    currentText: currentLines.join("\n"),
    currentKnownKeys,
  };
}

/**
 * Builds Axis Interpretation evidence for ONLY the deterministically
 * selected axes (selectAxisHighlights) — never all 6. This is the Batch 8
 * fix for "6 axes all explained at the same depth, burying the real gap."
 */
function buildAxisInterpretationEvidence(
  packet: Part01IdentityEvidencePacket,
): Part01AxisInterpretationPromptEvidence {
  const innate = buildAxisInnateEvidence(packet);
  const { gaps, alignment } = selectAxisHighlights(packet.axisComparisons);

  return {
    innateEvidenceText: innate.text,
    innateEvidenceKnownKeys: innate.knownKeys,
    gaps: gaps.map(buildAxisHighlightEvidence),
    alignment: alignment ? buildAxisHighlightEvidence(alignment) : null,
  };
}

export type EnergyMechanismKey =
  | "DECISION_LOAD"
  | "CONTROL_LOAD"
  | "STRUCTURE_MAINTENANCE"
  | "UNCERTAINTY_MONITORING"
  | "ADAPTATION_SWITCHING"
  | "SOCIAL_MONITORING"
  | "RECOVERY_ISOLATION_NEED"
  | "RELATIONAL_REPAIR_LOAD";

export type EnergyMechanismSpec = {
  key: EnergyMechanismKey;
  label: string;
  description: string;
  fuelExample: string;
  drainExample: string;
};

export type DeterministicEnergyPlan = {
  primary: EnergyMechanismSpec;
  secondary: EnergyMechanismSpec;
};

const ENERGY_MECHANISM_SPECS: Record<EnergyMechanismKey, EnergyMechanismSpec> = {
  DECISION_LOAD: {
    key: "DECISION_LOAD",
    label: "결정 피로 및 판단 적체 부하",
    description: "너무 많은 변수와 타인의 관점을 사전에 고려한 뒤 결정해야 하거나, 결정 책임을 홀로 짊어질 때 발생하는 판단 적체 및 결정 피로",
    fuelExample: "내가 범위와 우선순위를 직접 결정하고 외부 승인 없이 바로 실행할 수 있는 독립적 선택의 시간",
    drainExample: "책임은 내게 내재되어 있으나 결정 전에 끊임없이 타인과 의견을 조율하고 승인을 얻어야 하는 상황",
  },
  CONTROL_LOAD: {
    key: "CONTROL_LOAD",
    label: "통제권 유지 및 주도권 부담",
    description: "상황의 흐름과 책임 소재를 직접 쥐고 통제해야 마음이 놓이는 주도권 유지 부담",
    fuelExample: "외부 개입이나 돌발 변수 없이 내 통제권과 주도권 안에서 독립적으로 집중할 수 있는 환경",
    drainExample: "내 통제 범위를 벗어난 외압이나 타인의 비일관적인 행동으로 판과 책임이 흔들리는 상황",
  },
  STRUCTURE_MAINTENANCE: {
    key: "STRUCTURE_MAINTENANCE",
    label: "체계 및 구조 재정비 부하",
    description: "명확한 원칙·체계·질서를 세우고 이를 반복적으로 유지하거나 수정해야 하는 구조 유지 부담",
    fuelExample: "규칙과 역할 분담이 명확하여 매번 새로 판단하거나 판을 다시 짜지 않아도 되는 안정된 환경",
    drainExample: "기준과 원칙이 수시로 변경되어 이미 완결된 계획과 구조를 처음부터 다시 수정해야 하는 환경",
  },
  UNCERTAINTY_MONITORING: {
    key: "UNCERTAINTY_MONITORING",
    label: "불확실성 감시 및 리스크 경계 부하",
    description: "예측 불가능한 변수나 리스크를 사전에 감지하고 대처 방안을 계속 계산하는 리스크 경계 부담",
    fuelExample: "예측 가능한 일정과 투명한 정보가 확보되어 미래 변수를 계속 계산하지 않아도 되는 안정된 상태",
    drainExample: "모호한 상황이나 돌발 변수가 끊이지 않아 다음 단계 행동을 예측하기 어려운 환경",
  },
  ADAPTATION_SWITCHING: {
    key: "ADAPTATION_SWITCHING",
    label: "맥락 전환 및 유연 적응 가중",
    description: "수시로 바뀌는 상황과 환경에 맞춰 방식·역할·관점을 빠르게 바꾸며 대처해야 하는 맥락 전환 부하",
    fuelExample: "하나의 중요한 과제나 깊은 주제에 단절 없이 충분히 오랫동안 몰입할 수 있는 흐름",
    drainExample: "짧은 시간 안에 전혀 다른 맥락의 여러 요구와 업무 사이를 수시로 오가야 하는 산만한 환경",
  },
  SOCIAL_MONITORING: {
    key: "SOCIAL_MONITORING",
    label: "사회적 기류 및 감정 상태 조율 부하",
    description: "주변 사람들의 기류·감정 변화 및 반응을 지속적으로 살피고 내 행동을 맞추려는 사회적 관조 부하",
    fuelExample: "상대방의 눈치나 반응을 신경 쓸 필요 없이 내 의도가 있는 그대로 통하는 편안한 관계",
    drainExample: "여러 사람의 상충되는 반응과 기대를 동시에 살피며 지속적으로 눈치를 봐야 하는 모임이나 회의",
  },
  RECOVERY_ISOLATION_NEED: {
    key: "RECOVERY_ISOLATION_NEED",
    label: "자율적 고립 및 비접촉 회복 필요",
    description: "타인과의 상호작용 후 내면의 기준을 다시 세우기 위해 완전한 고립과 독립 정리가 필요한 상태",
    fuelExample: "아무런 응답 의무나 설명 부담 없이 완전한 혼자만의 공간에서 에너지를 재정비하는 시간",
    drainExample: "공적·사회적 접촉이 끊이지 않고 연속되어 혼자서 생각을 정리할 여유가 차단된 환경",
  },
  RELATIONAL_REPAIR_LOAD: {
    key: "RELATIONAL_REPAIR_LOAD",
    label: "관계 갈등 수습 및 감정 조율 부담",
    description: "갈등이나 감정적 불협화음 이후 분위기를 회복하고 관계를 수습하려는 내면적 긴장 부담",
    fuelExample: "갈등이나 오해 없이 감정적 안정감이 보장되어 관계 수습에 에너지를 쓸 필요가 없는 관계",
    drainExample: "상대와의 감정적 응어리나 미해결된 긴장 상태가 지속되어 계속 신경을 쏟아야 하는 상황",
  },
};

export function selectEnergyMechanisms(packet: Part01IdentityEvidencePacket): DeterministicEnergyPlan {
  const scores: Record<EnergyMechanismKey, number> = {
    DECISION_LOAD: 0,
    CONTROL_LOAD: 0,
    STRUCTURE_MAINTENANCE: 0,
    UNCERTAINTY_MONITORING: 0,
    ADAPTATION_SWITCHING: 0,
    SOCIAL_MONITORING: 0,
    RECOVERY_ISOLATION_NEED: 0,
    RELATIONAL_REPAIR_LOAD: 0,
  };

  const primary = packet.currentBehavior.primaryAxes;
  const secondary = packet.currentBehavior.secondaryAxes;
  const dimsMap = new Map(
    packet.dimensions.allDimensions.map((d) => [d.dimension, d.evaluation.value]),
  );

  // 1. DECISION_LOAD
  if (primary.autonomy >= 70) scores.DECISION_LOAD += (primary.autonomy - 50) * 1.2;
  if ((secondary.decision_style ?? 50) >= 70) scores.DECISION_LOAD += (secondary.decision_style - 50) * 1.0;
  if ((secondary.thinking_style ?? 50) >= 70) scores.DECISION_LOAD += (secondary.thinking_style - 50) * 0.8;
  if ((dimsMap.get("decision_pace") ?? 50) >= 65) scores.DECISION_LOAD += 20;

  // 2. CONTROL_LOAD
  if (primary.autonomy >= 75) scores.CONTROL_LOAD += (primary.autonomy - 50) * 1.1;
  if ((secondary.self_control ?? 50) >= 70) scores.CONTROL_LOAD += (secondary.self_control - 50) * 1.1;
  if ((dimsMap.get("boundary_defense_strength") ?? 50) >= 65) scores.CONTROL_LOAD += 20;

  // 3. STRUCTURE_MAINTENANCE
  if (primary.structure >= 70) scores.STRUCTURE_MAINTENANCE += (primary.structure - 50) * 1.5;
  if ((secondary.structure ?? 50) >= 70) scores.STRUCTURE_MAINTENANCE += (secondary.structure - 50) * 1.2;
  if ((secondary.practical_action ?? 50) >= 70) scores.STRUCTURE_MAINTENANCE += (secondary.practical_action - 50) * 0.8;
  if ((dimsMap.get("structure_spontaneity") ?? 50) >= 65) scores.STRUCTURE_MAINTENANCE += 20;

  // 4. UNCERTAINTY_MONITORING
  if (primary.stability >= 70) scores.UNCERTAINTY_MONITORING += (primary.stability - 50) * 1.2;
  if ((secondary.resilience ?? 50) >= 70) scores.UNCERTAINTY_MONITORING += (secondary.resilience - 50) * 1.0;
  if ((dimsMap.get("pressure_response") ?? 50) >= 65) scores.UNCERTAINTY_MONITORING += 20;

  // 5. ADAPTATION_SWITCHING
  if (primary.adaptability >= 75) scores.ADAPTATION_SWITCHING += (primary.adaptability - 50) * 1.4;
  if (primary.growth >= 75) scores.ADAPTATION_SWITCHING += (primary.growth - 50) * 1.1;
  if ((secondary.stimulation ?? 50) >= 70) scores.ADAPTATION_SWITCHING += (secondary.stimulation - 50) * 0.9;

  // 6. SOCIAL_MONITORING
  if (primary.connection >= 70) scores.SOCIAL_MONITORING += (primary.connection - 50) * 1.4;
  if ((secondary.empathy ?? 50) >= 70) scores.SOCIAL_MONITORING += (secondary.empathy - 50) * 1.1;
  if ((secondary.recognition ?? 50) >= 70) scores.SOCIAL_MONITORING += (secondary.recognition - 50) * 0.8;

  // 7. RECOVERY_ISOLATION_NEED
  if (primary.autonomy >= 65 && primary.connection <= 45) scores.RECOVERY_ISOLATION_NEED += 35;
  if ((dimsMap.get("solitude_autonomy") ?? 50) >= 65) scores.RECOVERY_ISOLATION_NEED += 25;
  if ((secondary.energy_style ?? 50) >= 70) scores.RECOVERY_ISOLATION_NEED += 15;

  // 8. RELATIONAL_REPAIR_LOAD
  if ((secondary.conflict_style ?? 50) >= 70) scores.RELATIONAL_REPAIR_LOAD += (secondary.conflict_style - 50) * 1.2;
  if ((dimsMap.get("conflict_decompression") ?? 50) >= 65) scores.RELATIONAL_REPAIR_LOAD += 20;
  if ((secondary.empathy ?? 50) >= 70) scores.RELATIONAL_REPAIR_LOAD += 15;

  const sortedKeys = (Object.keys(scores) as EnergyMechanismKey[]).sort(
    (a, b) => scores[b] - scores[a],
  );

  const primaryKey = sortedKeys[0] ?? "SOCIAL_MONITORING";
  let secondaryKey = sortedKeys[1] ?? "DECISION_LOAD";
  if (secondaryKey === primaryKey) {
    secondaryKey = sortedKeys[2] ?? "CONTROL_LOAD";
  }

  return {
    primary: ENERGY_MECHANISM_SPECS[primaryKey],
    secondary: ENERGY_MECHANISM_SPECS[secondaryKey],
  };
}

const ENERGY_RELEVANT_DIMENSION_KEYS: readonly string[] = [
  "solitude_autonomy",
  "pressure_response",
  "criticism_sensitivity",
  "conflict_decompression",
  "boundary_defense_strength",
  "decision_pace",
  "structure_spontaneity",
];
const ENERGY_RELEVANT_SECONDARY_KEYS = ["energy_style", "resilience", "conflict_style", "recognition"] as const;

/** Builds Energy grounding text + the exact key set shown for it (Part 02 Batch 1 / Batch 5). */
function buildEnergyEvidence(packet: Part01IdentityEvidencePacket): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];

  const addEvidence = (refs: Part01EvidenceRef[]) => {
    for (const ref of refs) {
      knownKeys.add(evidenceKey(ref));
      lines.push(formatEvidenceLine(ref));
    }
  };

  const plan = selectEnergyMechanisms(packet);
  const fitPlan = selectFitPlan(packet);
  lines.push("DETERMINISTIC PRIMARY & SECONDARY ENERGY MECHANISMS FOR THIS PROFILE (MANDATORY ANCHORS):");
  lines.push(`- [PRIMARY MECHANISM]: ${plan.primary.key} (${plan.primary.label})`);
  lines.push(`  Burden Description: ${plan.primary.description}`);
  lines.push(`  Restorative Fuel Direction: ${plan.primary.fuelExample}`);
  lines.push(`  Depleting Drain Direction: ${plan.primary.drainExample}`);
  lines.push(`- [SECONDARY MECHANISM]: ${plan.secondary.key} (${plan.secondary.label})`);
  lines.push(`  Burden Description: ${plan.secondary.description}`);
  lines.push(`  Restorative Fuel Direction: ${plan.secondary.fuelExample}`);
  lines.push(`  Depleting Drain Direction: ${plan.secondary.drainExample}`);
  lines.push("DETERMINISTIC ENVIRONMENT FIT ANCHORS FOR OPTIMAL ENVIRONMENT:");
  lines.push(`- [PRIMARY FIT NEED]: ${fitPlan.primaryFit.key} (${fitPlan.primaryFit.label}) -> Operating Environment: ${fitPlan.primaryFit.environmentFitDirection}`);
  lines.push(`- [SECONDARY FIT NEED]: ${fitPlan.secondaryFit.key} (${fitPlan.secondaryFit.label}) -> Operating Environment: ${fitPlan.secondaryFit.environmentFitDirection}`);
  lines.push("");

  lines.push("Climate & elemental balance (innate energetic temperament):");
  addEvidence(packet.innate.elementEvidence);
  addEvidence(packet.innate.climateEvidence);

  lines.push("Day-Master strength & Ten-God distribution:");
  addEvidence(packet.innate.strengthEvidence);
  addEvidence(packet.innate.tenGodEvidence);

  lines.push("Intra-Pillar structural relations (합/충/형/파/해):");
  addEvidence(packet.innate.relationEvidence);

  lines.push("CE strengths-group signals:");
  addEvidence(packet.innate.ceStrengthSignals);
  lines.push("CE growth-group signals:");
  addEvidence(packet.growthCandidates.growthEvidence);
  lines.push("CE cautions-group signals:");
  addEvidence(packet.growthCandidates.cautionEvidence);

  lines.push("Relevant CE dimensions:");
  for (const cand of packet.dimensions.allDimensions) {
    if (!ENERGY_RELEVANT_DIMENSION_KEYS.includes(cand.dimension)) continue;
    if (!isUsableDimensionConfidence(cand.evaluation.confidence)) continue;
    const key = dimensionKey(cand.dimension);
    knownKeys.add(key);
    const mixed = cand.evaluation.is_mixed ? " mixed=true" : "";
    lines.push(`- [${key}] value=${cand.evaluation.value} conf=${cand.evaluation.confidence}${mixed}`);
  }

  lines.push("Current Secondary evidence (energy_style, resilience, conflict_style, recognition only):");
  const secondary = packet.currentBehavior.secondaryAxes;
  for (const key of ENERGY_RELEVANT_SECONDARY_KEYS) {
    const skey = secondaryKey(key);
    knownKeys.add(skey);
    lines.push(`- [${skey}] score=${secondary[key]}`);
  }

  lines.push(
    "This person's already-identified top Current x Innate gaps/alignment (reused from axis_interpretations — translate into an energy cost/recovery angle here, do not re-decide which axis matters):",
  );
  const { gaps, alignment } = selectAxisHighlights(packet.axisComparisons);
  for (const a of [...gaps, ...(alignment ? [alignment] : [])]) {
    knownKeys.add(axisKey(a.axis));
    lines.push(formatAxisLine(a));
  }

  return { text: lines.join("\n"), knownKeys };
}

/**
 * Part 03 Batch 1 — Relationship evidence Lens. Compact, purpose-specific
 * selection only: 9 of the 12 CE relational dimensions (excludes
 * decision_pace/resource_governance/structure_spontaneity — not relational-
 * fit/friction relevant), 3 of the 11 Secondary axes
 * (empathy/conflict_style/recognition), and the SAME gap/alignment axes
 * selectAxisHighlights() already picked (reused, not re-derived). No new
 * mapping/calculation — every source here is already computed elsewhere in
 * the packet.
 */
export type FitCategoryKey =
  | "AUTONOMY"
  | "STRUCTURE"
  | "PREDICTABILITY"
  | "STIMULATION"
  | "RELATIONAL_DEPTH"
  | "EMOTIONAL_EXPLICITNESS"
  | "DECISION_CLARITY"
  | "FEEDBACK_DIRECTNESS"
  | "PROCESSING_TIME"
  | "BOUNDARY_RESPECT"
  | "COLLABORATION"
  | "GROWTH_VARIETY";

export type FitCategorySpec = {
  key: FitCategoryKey;
  label: string;
  peopleFitDirection: string;
  frictionDirection: string;
  communicationTrigger: string;
  communicationBetter: string;
  environmentFitDirection: string;
};

export type DeterministicFitPlan = {
  primaryFit: FitCategorySpec;
  secondaryFit: FitCategorySpec;
};

const FIT_CATEGORY_SPECS: Record<FitCategoryKey, FitCategorySpec> = {
  AUTONOMY: {
    key: "AUTONOMY",
    label: "자율권 및 독립적 판단 공간 보장",
    peopleFitDirection: "내 결론을 대신 정해주거나 조율을 강요하기보다 스스로 판단하고 행동할 공간과 시간을 주는 사람",
    frictionDirection: "책임은 나에게 주면서 실행 방식과 세부 의사결정에서 사사건건 승인과 동의를 요구하는 방식",
    communicationTrigger: "왜 이것도 멋대로 정해? / 혼자서만 결정하려고 하지 마.",
    communicationBetter: "네가 맡은 부분의 우선순위와 판단 범위를 먼저 정해서 공유해줘.",
    environmentFitDirection: "역할과 목표는 분명하지만 실행 수단과 시간 배분에는 독립적인 자율권이 보장되는 환경",
  },
  STRUCTURE: {
    key: "STRUCTURE",
    label: "명확한 원칙 및 질서 유지",
    peopleFitDirection: "약속과 수순을 자주 바꾸지 않고, 규칙과 역할 분담을 명확하게 지키는 사람",
    frictionDirection: "기준을 합의해놓고 도중에 전제나 말을 번복하여 이미 세운 계획을 다시 짜게 만드는 대화",
    communicationTrigger: "그냥 규칙 신경 쓰지 말고 대충 상황 맞춰서 해.",
    communicationBetter: "수정된 원칙과 기준을 먼저 정리해서 공유하고 수순을 맞추자.",
    environmentFitDirection: "업무 절차와 책임 소재가 명확하여 매번 판을 다시 해석하지 않아도 되는 안정된 환경",
  },
  PREDICTABILITY: {
    key: "PREDICTABILITY",
    label: "예측 가능성 및 변수 최소화",
    peopleFitDirection: "감정 기복이나 행동 양식이 일관되어 다음 단계를 예측할 수 있는 안정된 태도의 사람",
    frictionDirection: "모호한 의도나 갑작스러운 변수로 사전 대처를 방해하고 불안정성을 높이는 무책임한 방식",
    communicationTrigger: "나중에 어떻게 될지 모르니까 일단 기다려봐.",
    communicationBetter: "확정된 정보와 예상 변수를 미리 공유해서 준비할 수 있게 해줄게.",
    environmentFitDirection: "갑작스러운 방향 전환이나 돌발 변수가 적어 계획대로 실행할 수 있는 안정적인 환경",
  },
  STIMULATION: {
    key: "STIMULATION",
    label: "감각적 역동성 및 새로운 시도",
    peopleFitDirection: "새로운 관점과 아이디어를 자극하고, 상호 간의 성장을 함께 즐기는 유연한 사람",
    frictionDirection: "기존 방식만을 고집하며 새로운 시도나 변화의 가능성을 원천 차단하는 경직된 관계",
    communicationTrigger: "원래 하던 대로만 해, 새로운 거 하지 마.",
    communicationBetter: "이번에는 어떤 새로운 시도나 아이디어를 실험해보고 싶은지 들려줘.",
    environmentFitDirection: "정형화된 루틴에 갇히지 않고 새로운 문제 해결과 자극이 계속 주어지는 역동적 환경",
  },
  RELATIONAL_DEPTH: {
    key: "RELATIONAL_DEPTH",
    label: "진정성 있는 관계적 깊이",
    peopleFitDirection: "겉치레나 사교적 형식보다 서로의 진심과 내면적 가치를 기꺼이 나누는 진솔한 사람",
    frictionDirection: "겉으로는 친한 척하지만 정작 중요한 순간에는 책임감 없이 거리를 두는 가식적인 소통",
    communicationTrigger: "좋은 게 좋은 거니까 대충 맞춰주고 넘어가자.",
    communicationBetter: "네가 진짜 중요하게 생각하는 내면의 기준과 솔직한 생각을 듣고 싶어.",
    environmentFitDirection: "수박 겉핥기식 사교 모임이 아니라 소수와 깊은 신뢰를 쌓을 수 있는 진정성 있는 관계",
  },
  EMOTIONAL_EXPLICITNESS: {
    key: "EMOTIONAL_EXPLICITNESS",
    label: "투명한 감정 표현 및 의도 명확성",
    peopleFitDirection: "자신의 기분과 요구 사항을 돌려 말하지 않고 명확하고 투명하게 표현해주는 사람",
    frictionDirection: "기분이 안 좋은 티를 내면서도 이유를 말하지 않고 상대가 눈치채주기만을 바라는 방식",
    communicationTrigger: "내가 왜 화났는지 진짜 몰라서 물어보는 거야?",
    communicationBetter: "내가 지금 어떤 부분에서 아쉬움을 느꼈는지 명확하게 말해줄게.",
    environmentFitDirection: "비언어적 눈치나 분위기 스캐닝을 강요하지 않고 직설적이고 투명하게 의사소통하는 팀",
  },
  DECISION_CLARITY: {
    key: "DECISION_CLARITY",
    label: "결정 주도권 및 판단 책임 명확성",
    peopleFitDirection: "결정의 범위와 책임을 분명히 하고, 필요한 순간에 든든하게 중심을 잡아주는 사람",
    frictionDirection: "결정권은 내주지 않으면서 발생한 문제와 책임만 전가하거나 결정을 무한히 지연시키는 방식",
    communicationTrigger: "네가 알아서 결정해, 단 책임은 네가 지는 거야.",
    communicationBetter: "이 결정은 네 판단에 맡길 테니, 나는 네 결정을 뒤에서 지지해줄게.",
    environmentFitDirection: "누가 최종 의사결정권자인지 명확하고 판단 적체 없이 효율적으로 안건을 닫는 환경",
  },
  FEEDBACK_DIRECTNESS: {
    key: "FEEDBACK_DIRECTNESS",
    label: "명확하고 담백한 피드백 전달",
    peopleFitDirection: "감정적 비난이나 칭찬을 배제하고 사실과 발전 방향을 군더더기 없이 담백하게 전달하는 사람",
    frictionDirection: "모호한 돌려말하기나 인신공격성 비유로 본질적 문제 해결을 흩트리는 소통 방식",
    communicationTrigger: "너 원래 일 처리를 그런 식으로 하니?",
    communicationBetter: "이번 결과물에서 구체적으로 어떤 부분이 보완되면 좋을지 사실 위주로 말할게.",
    environmentFitDirection: "개인적 감정 싸움 없이 객관적 데이터와 구체적 피드백으로 성장하는 조직 문화",
  },
  PROCESSING_TIME: {
    key: "PROCESSING_TIME",
    label: "내면 정리 및 수용 시간 존중",
    peopleFitDirection: "새로운 정보나 갈등 이후 즉각적인 대답을 재촉하지 않고 충분히 생각할 시간을 주는 사람",
    frictionDirection: "상황을 즉시 해결해야 한다며 답을 재촉하거나 생각할 겨를 없이 결론을 강요하는 소통",
    communicationTrigger: "지금 당장 대답해, 왜 말을 안 해?",
    communicationBetter: "충분히 정리할 시간이 필요할 테니 생각나면 나중에 천천히 이야기하자.",
    environmentFitDirection: "즉각적인 반응 압박 없이 독립적인 사고와 소화 시간을 보장해주는 업무 및 관계 공간",
  },
  BOUNDARY_RESPECT: {
    key: "BOUNDARY_RESPECT",
    label: "경계 존중 및 개인 공간 보장",
    peopleFitDirection: "친밀함이라는 이유로 상대의 사생활이나 영역을 침범하지 않고 적절한 거리를 지키는 사람",
    frictionDirection: "불필요한 참견이나 지나친 개입으로 개인의 경계를 무너뜨리고 일방적인 친밀함을 강요하는 방식",
    communicationTrigger: "너랑 나 사이에 무슨 비밀이 있어? 다 말해봐.",
    communicationBetter: "네가 나누고 싶은 만큼만 이야기해줘, 네 개인 공간을 항상 존중할게.",
    environmentFitDirection: "서로의 독립된 개인 영역과 시간을 철저히 존중하고 지나친 침범을 금하는 문화",
  },
  COLLABORATION: {
    key: "COLLABORATION",
    label: "상호 존중 기반의 집단 시너지",
    peopleFitDirection: "독단적으로 이끌기보다 서로의 강점을 인정하고 협력하여 더 큰 성과를 함께 만드는 사람",
    frictionDirection: "일방적인 명령이나 한 사람의 독주로 다른 구성원의 의견과 기여를 무시하는 지배적 관계",
    communicationTrigger: "내가 시키는 대로만 해, 토 달지 말고.",
    communicationBetter: "우리 각자의 장점을 살려서 이번 과제를 어떻게 같이 풀면 좋을까?",
    environmentFitDirection: "동등한 인격체로서 서로의 의견을 경청하고 시너지를 도모하는 협력적 팀 환경",
  },
  GROWTH_VARIETY: {
    key: "GROWTH_VARIETY",
    label: "성장 기회 및 다양성 수용",
    peopleFitDirection: "실수를 성장의 계기로 삼고, 다양한 관점과 정답을 인정해주는 지적 호기심이 풍부한 사람",
    frictionDirection: "단 하나의 정답만을 강요하며 다른 방식이나 도전을 실패로 규정짓는 답답한 태도",
    communicationTrigger: "너는 왜 남들 다 하는 정석대로 안 하고 딴소리해?",
    communicationBetter: "기존 방식에서 바꾸려는 이유와 예상되는 리스크를 먼저 설명해줘. 그 내용을 파악하고 어디까지 새로운 시도를 허용할지 정하자.",
    environmentFitDirection: "시행착오를 통한 학습을 장려하고 다양한 실험이 존중받는 도전적인 성장 환경",
  },
};

export function selectFitPlan(packet: Part01IdentityEvidencePacket): DeterministicFitPlan {
  const scores: Record<FitCategoryKey, number> = {
    AUTONOMY: 0,
    STRUCTURE: 0,
    PREDICTABILITY: 0,
    STIMULATION: 0,
    RELATIONAL_DEPTH: 0,
    EMOTIONAL_EXPLICITNESS: 0,
    DECISION_CLARITY: 0,
    FEEDBACK_DIRECTNESS: 0,
    PROCESSING_TIME: 0,
    BOUNDARY_RESPECT: 0,
    COLLABORATION: 0,
    GROWTH_VARIETY: 0,
  };

  const primary = packet.currentBehavior.primaryAxes;
  const secondary = packet.currentBehavior.secondaryAxes;
  const dimsMap = new Map(
    packet.dimensions.allDimensions.map((d) => [d.dimension, d.evaluation.value]),
  );

  if (primary.autonomy >= 70) {
    scores.AUTONOMY += (primary.autonomy - 50) * 1.5;
    scores.BOUNDARY_RESPECT += (primary.autonomy - 50) * 1.0;
  }

  if (primary.structure >= 70) {
    scores.STRUCTURE += (primary.structure - 50) * 1.5;
    scores.PREDICTABILITY += (primary.structure - 50) * 1.0;
  }

  if (primary.stability >= 70) {
    scores.PREDICTABILITY += (primary.stability - 50) * 1.4;
    scores.STRUCTURE += (primary.stability - 50) * 0.8;
  }

  if (primary.growth >= 75 || primary.adaptability >= 75) {
    scores.GROWTH_VARIETY += (Math.max(primary.growth, primary.adaptability) - 50) * 1.4;
    scores.STIMULATION += (secondary.stimulation ?? 50) >= 70 ? 25 : 15;
  }

  if (primary.connection >= 70) {
    scores.RELATIONAL_DEPTH += (primary.connection - 50) * 1.2;
    scores.EMOTIONAL_EXPLICITNESS += (secondary.empathy ?? 50) >= 70 ? 20 : 10;
  }

  if ((secondary.decision_style ?? 50) >= 70) {
    scores.DECISION_CLARITY += (secondary.decision_style - 50) * 1.3;
  }

  if ((dimsMap.get("solitude_autonomy") ?? 50) >= 65) {
    scores.PROCESSING_TIME += 25;
    scores.BOUNDARY_RESPECT += 20;
  }

  if ((dimsMap.get("conflict_decompression") ?? 50) >= 65) {
    scores.PROCESSING_TIME += 20;
  }

  if ((dimsMap.get("expression_style") ?? 50) >= 65 || (secondary.conflict_style ?? 50) >= 70) {
    scores.FEEDBACK_DIRECTNESS += 20;
  }

  const sortedKeys = (Object.keys(scores) as FitCategoryKey[]).sort(
    (a, b) => scores[b] - scores[a],
  );

  const primaryKey = sortedKeys[0] ?? "AUTONOMY";
  let secondaryKey = sortedKeys[1] ?? "DECISION_CLARITY";
  if (secondaryKey === primaryKey) {
    secondaryKey = sortedKeys[2] ?? "STRUCTURE";
  }

  return {
    primaryFit: FIT_CATEGORY_SPECS[primaryKey],
    secondaryFit: FIT_CATEGORY_SPECS[secondaryKey],
  };
}

export type ActionCandidateFamily =
  | "DECISION"
  | "BOUNDARY"
  | "STRUCTURE"
  | "ADAPTABILITY"
  | "GROWTH"
  | "COMMUNICATION"
  | "RELATIONAL"
  | "ENERGY";

export type ActionClosingFrame = {
  primaryFamily: ActionCandidateFamily;
  strengthTruth: string;
  overuseTruth: string;
  distinctionTruth: string;
};

export type DeterministicActionPlan = {
  primaryFamily: ActionCandidateFamily;
  secondaryFamily: ActionCandidateFamily;
  familyScores: Record<ActionCandidateFamily, number>;
  doDirections: string[];
  dontDirections: string[];
  decisionRuleDirections: string[];
  closingFrame: ActionClosingFrame;
  practiceEligible: boolean;
  practiceReason: string;
  sajuBehavioralNote?: string;
  evidenceRefs: string[];
};

export function selectActionPlan(
  packet: RawPart01EvidencePacket | null | undefined,
): DeterministicActionPlan {
  const fallbackScores: Record<ActionCandidateFamily, number> = {
    DECISION: 50,
    BOUNDARY: 30,
    STRUCTURE: 10,
    ADAPTABILITY: 10,
    GROWTH: 10,
    COMMUNICATION: 0,
    RELATIONAL: 0,
    ENERGY: 0,
  };

  if (!packet || typeof packet !== "object") {
    return {
      primaryFamily: "DECISION",
      secondaryFamily: "BOUNDARY",
      familyScores: fallbackScores,
      doDirections: [
        "중요한 결정을 앞두고 다른 사람의 반응을 살피기 전에 내 내면의 우선순위를 먼저 한 줄로 정하기",
        "자신이 선택한 방향을 일정 시간 실험해보고 결과를 데이터로 복기하는 루틴 유지하기",
        "서로의 자율권을 존중하고 독립적 판단 시간을 주는 관계에 우선순위 두기",
      ],
      dontDirections: [
        "모든 사람이 완전히 만족할 때까지 결정을 지연시키거나 재확인을 반복하지 않기",
        "상대의 기대에 맞춘다는 이유로 내 영역의 결정권까지 일방적으로 내주지 않기",
        "한 번 내린 결정을 작은 변수가 생길 때마다 다시 개방하여 판을 흔들지 않기",
      ],
      decisionRuleDirections: [
        "이 선택을 내가 진심으로 원하는가, 아니면 갈등을 피하기 위해 받아들이는가 구분하기",
        "지금 필요한 것이 더 많은 정보인가, 이미 충분한데 확신만 기다리는 것인가 구분하기",
        "이 방식을 오랫동안 유지해도 내 에너지가 고갈되지 않는가까지 보기",
      ],
      closingFrame: {
        primaryFamily: "DECISION",
        strengthTruth: "독립적 판단과 내면의 판단 기준을 세우는 힘",
        overuseTruth: "타인의 과도한 동의를 기다리거나 모든 결과를 혼자 짊어지려는 부담",
        distinctionTruth: "신중한 내면 판단과 만장일치 확인의 차이",
      },
      practiceEligible: false,
      practiceReason: "No packet evidence provided for practice evaluation.",
      evidenceRefs: [],
    };
  }

  const energyPlan = selectEnergyMechanisms(packet);
  const fitPlan = selectFitPlan(packet);
  const primary = packet.currentBehavior.primaryAxes;

  const familyScores: Record<ActionCandidateFamily, number> = {
    DECISION: 0,
    BOUNDARY: 0,
    STRUCTURE: 0,
    ADAPTABILITY: 0,
    GROWTH: 0,
    COMMUNICATION: 0,
    RELATIONAL: 0,
    ENERGY: 0,
  };

  familyScores.STRUCTURE += Math.max(0, (primary.structure - 45) * 2.5) + Math.max(0, (primary.stability - 45) * 1.5);
  familyScores.GROWTH += Math.max(0, (primary.growth - 45) * 2.5);
  familyScores.ADAPTABILITY += Math.max(0, (primary.adaptability - 45) * 2.5);
  familyScores.DECISION += Math.max(0, (primary.autonomy - 45) * 2.5);
  familyScores.BOUNDARY += Math.max(0, (primary.connection - 50) * 1.5);

  const maxPrimaryVal = Math.max(primary.structure, primary.growth, primary.adaptability, primary.autonomy);
  if (primary.structure === maxPrimaryVal && primary.structure > 50) {
    familyScores.STRUCTURE += 35;
  }
  if (primary.growth === maxPrimaryVal && primary.growth > 50) {
    familyScores.GROWTH += 35;
  }
  if (primary.adaptability === maxPrimaryVal && primary.adaptability > 50) {
    familyScores.ADAPTABILITY += 35;
  }
  if (primary.autonomy === maxPrimaryVal && primary.autonomy > 50) {
    familyScores.DECISION += 35;
  }

  if (energyPlan.primary.key === "DECISION_LOAD" || energyPlan.primary.key === "CONTROL_LOAD") {
    familyScores.DECISION += 20;
  }
  if (energyPlan.primary.key === "STRUCTURE_MAINTENANCE" || energyPlan.primary.key === "UNCERTAINTY_MONITORING") {
    familyScores.STRUCTURE += 20;
  }
  if (energyPlan.primary.key === "ADAPTATION_SWITCHING") {
    familyScores.ADAPTABILITY += 20;
  }
  if (energyPlan.primary.key === "SOCIAL_MONITORING") {
    familyScores.BOUNDARY += 20;
  }

  if (fitPlan.primaryFit.key === "AUTONOMY") {
    familyScores.DECISION += 25;
  }
  if (fitPlan.primaryFit.key === "BOUNDARY_RESPECT") {
    familyScores.BOUNDARY += 25;
  }
  if (fitPlan.primaryFit.key === "PREDICTABILITY" || fitPlan.primaryFit.key === "STRUCTURE") {
    familyScores.STRUCTURE += 25;
  }
  if (fitPlan.primaryFit.key === "GROWTH_VARIETY" || fitPlan.primaryFit.key === "STIMULATION") {
    familyScores.GROWTH += 25;
  }

  const sortedFamilies = (Object.keys(familyScores) as ActionCandidateFamily[]).sort(
    (a, b) => familyScores[b] - familyScores[a],
  );

  const primaryFamily = sortedFamilies[0] ?? "DECISION";
  let secondaryFamily = sortedFamilies[1] ?? "STRUCTURE";
  if (secondaryFamily === primaryFamily) {
    secondaryFamily = sortedFamilies[2] ?? "BOUNDARY";
  }

  const doDirections: string[] = [];
  const dontDirections: string[] = [];
  const decisionRuleDirections: string[] = [];

  if (primaryFamily === "DECISION") {
    doDirections.push("중요한 결정을 내릴 때 다른 사람의 입장을 듣기 전에 내 판단 기준을 먼저 한 문장으로 정리하기");
    dontDirections.push("상대의 반응이나 타인의 동의를 확인하기 전에는 결정을 내릴 수 없다고 생각하여 판단을 지연시키지 않기");
    decisionRuleDirections.push("이 선택이 내 기준과 내적인 주체성에 부합하는지, 타인의 기대에 부응하려는 것인지 구분하기");
  } else if (primaryFamily === "STRUCTURE") {
    doDirections.push("작업 수순과 핵심 규칙을 사전에 명확히 정리하여 구조적 예측 가능성을 우선 확보하기");
    dontDirections.push("모든 예외 변수와 상황을 사전에 완벽히 통제하려다 실행 타이밍을 놓치거나 완벽주의 늪에 빠지지 않기");
    decisionRuleDirections.push("지금 더 필요한 게 더 나은 절차/계획인가, 아니면 이미 충분한 계획을 완벽하게 다듬으려는 확신 지연인가 구분하기");
  } else if (primaryFamily === "GROWTH") {
    doDirections.push("새로운 시도와 배움의 기회가 있는 선택을 우선하고, 정기적인 작은 실험 루틴 유지하기");
    dontDirections.push("잘 적응할 수 있다는 이유로 본래 내 핵심 방향을 버리고 매번 남에게 맞추며 흔들리지 않기");
    decisionRuleDirections.push("이 변화가 나를 성장시키는 새로운 배움인지, 그저 주변 상황에 맞추느라 내 방향을 바꾸는 것인지 구분하기");
  } else if (primaryFamily === "ADAPTABILITY") {
    doDirections.push("다양한 변수에 유연하게 대응하되, 이번 변화에서 내가 끝까지 유지할 핵심 기준 하나를 먼저 정하기");
    dontDirections.push("상황에 잘 맞출 수 있다는 이유로 모든 변화의 부담과 전담 조율자 역할을 항상 내가 다 떠안지 않기");
    decisionRuleDirections.push("이 상황 수용이 내가 진심으로 원해서 받아들이는 것인가, 전담 맞춤 모드가 습관화되어 수긍하는 것인가 구분하기");
  } else {
    doDirections.push("독립적인 판단 공간과 자율권이 보장되는 경계를 명확히 유지하며 일하기");
    dontDirections.push("관계의 조화를 유지한다는 이유로 자신의 우선순위를 미루고 일방적으로 맞추는 모드가 장기화되지 않기");
    decisionRuleDirections.push("이 받아들임이 내가 진심으로 동의해서인가, 갈등과 마찰을 피하기 위해 수긍하는 것인가 구분하기");
  }

  if (secondaryFamily === "STRUCTURE" && primaryFamily !== "STRUCTURE") {
    doDirections.push("자주 반복되는 의사결정은 프레임을 템플릿화하여 에너지 소모 줄이기");
    dontDirections.push("완벽한 준비가 갖춰져야 시작할 수 있다고 믿으며 적정 수준(good enough)에서 멈추는 것을 두려워하지 않기");
    decisionRuleDirections.push("이 일을 완벽하게 처리해야 하는가, 적정선에서 완료하고 다음 단계로 넘어가는 것이 유리한가 보기");
  } else if (secondaryFamily === "GROWTH" && primaryFamily !== "GROWTH") {
    doDirections.push("기존 방식을 유지하면서도 정기적으로 작은 실험을 병행할 수 있는 시도 공간 확보하기");
    dontDirections.push("안정성을 지킨다는 이유로 배움과 호기심이 완전히 고갈된 루틴에 갇혀있지 않기");
    decisionRuleDirections.push("이 선택을 오래 유지했을 때 내 역량이 확장되는가, 아니면 방어적으로 쪼그라드는가 보기");
  } else if (secondaryFamily === "ADAPTABILITY" && primaryFamily !== "ADAPTABILITY") {
    doDirections.push("예상치 못한 변수가 생겼을 때 내 기준을 잃지 않고 유연한 대체안 마련하기");
    dontDirections.push("변화에 적응할 수 있다는 이유로 내 본래 계획을 아무 기준 없이 번복하지 않기");
    decisionRuleDirections.push("이 대안 선택이 내 목표에 기여하는가, 단지 상황을 빨리 마무리짓기 위한 타협인가 구분하기");
  } else if (secondaryFamily === "BOUNDARY" && primaryFamily !== "BOUNDARY") {
    doDirections.push("상대의 요청이나 공감과 별개로 내가 실제로 감당할 수 있는 자원의 한계를 분명히 선언하기");
    dontDirections.push("다른 사람의 감정이나 팀 전체의 분위기까지 내가 혼자 책임져야 한다는 부담을 지지 않기");
    decisionRuleDirections.push("내가 도울 수 있는 영역인가, 상대가 스스로 겪어내야 할 책임의 영역인가 구분하기");
  } else {
    doDirections.push("판단 결과를 행동으로 옮기기 전에 내 핵심 가치와 일치하는지 점검하는 시간 갖기");
    dontDirections.push("순간적인 조급함이나 외부 압박 때문에 이미 내려진 결정을 쉽게 번복하지 않기");
    decisionRuleDirections.push("이 결정이 내 장기 목표에 기여하는가, 단기적인 압박을 해소하려는 임시방편인가 구분하기");
  }

  if (primaryFamily === "STRUCTURE") {
    doDirections.push("예측 가능한 정기 휴식 수순을 루틴으로 보호하여 구조적 에너지를 회복하기");
    dontDirections.push("일정을 지키겠다는 이유로 휴식 시간까지 빡빡하게 계획으로 채우지 않기");
    decisionRuleDirections.push("이 방식을 오랫동안 유지해도 내 정신적·신체적 에너지가 고갈되지 않고 지속 가능한가까지 고려하기");
  } else if (primaryFamily === "GROWTH" || primaryFamily === "ADAPTABILITY") {
    doDirections.push("새로운 탐색과 시도 후 지친 에너지를 다듬고 정리하는 회복 루틴 확보하기");
    dontDirections.push("호기심과 유연성이 작동한다는 이유로 지칠 때까지 멈추지 않고 과도하게 가동하지 않기");
    decisionRuleDirections.push("이 변화와 시도가 내 장기적 성장에 도움이 되는지, 에너지 소진으로 이어지는지 구분하기");
  } else {
    doDirections.push("자율적인 내면 회복 공간을 확보하고 그 시간을 최우선으로 보호하기");
    dontDirections.push("독립성과 결정권을 지킨다는 이유로 스스로를 고립시키거나 마찰을 길게 가져가지 않기");
    decisionRuleDirections.push("이 결정을 오랫동안 유지해도 내 에너지가 고갈되지 않고 지속 가능한가까지 고려하기");
  }

  const practiceEligible = Boolean(
    packet.growthEdgeCandidates?.primaryGapAxis ||
    packet.axisComparisons?.some((a) => a.innate_higher && Math.abs(a.innate - a.current) >= 15)
  );
  const practiceReason = practiceEligible
    ? "Specific growth edge or innate-higher gap axis justified a 1-week operational experiment."
    : "No high-confidence operational experiment adds value beyond DO/DON'T items.";

  let sajuBehavioralNote: string | undefined;
  if (packet.astrology?.stars) {
    const starNames = packet.astrology.stars.map((s: { name_ko: string }) => s.name_ko);
    if (starNames.some((n: string) => n.includes("도화"))) {
      sajuBehavioralNote = "사람과의 연결과 분위기를 이끄는 강점은 적극 쓰되, 모든 관계의 온도와 타인의 반응까지 혼자 책임지려 하지 말기";
    } else if (starNames.some((n: string) => n.includes("현침"))) {
      sajuBehavioralNote = "본질과 핵심을 정확히 짚어내는 정교한 시각은 계속 유지하되, 맞는 말일수록 전달 시점과 소통 강도를 한 번 더 조율하기";
    } else if (starNames.some((n: string) => n.includes("천을귀인"))) {
      sajuBehavioralNote = "혼자 완벽히 처리하는 것만 독립성이라 생각하지 말고, 필요한 순간 주변 사람과 자원을 적극적으로 연결해 조력을 구하기";
    }
  }

  const FAMILY_CLOSING_FRAMES: Record<ActionCandidateFamily, ActionClosingFrame> = {
    DECISION: {
      primaryFamily: "DECISION",
      strengthTruth: "스스로 판단하고 내면의 기준을 바로 세우는 독립적인 선택의 힘",
      overuseTruth: "모든 사람의 확신을 확인하려 하거나 모든 결과를 혼자 짊어지려는 과도한 부담",
      distinctionTruth: "신중하게 스스로 판단하는 것과 모든 사람의 동의를 얻어야 결정할 수 있다고 믿는 것의 차이",
    },
    STRUCTURE: {
      primaryFamily: "STRUCTURE",
      strengthTruth: "복잡한 상황을 체계적으로 정리하고 예측 가능한 수순과 원칙을 세우는 힘",
      overuseTruth: "모든 예외 변수가 다 통제되어야만 비로소 움직일 수 있다고 생각하는 완벽주의 통제 모드",
      distinctionTruth: "안정감을 주는 유용한 체계를 갖추는 것과 완벽한 확실성이 갖춰질 때까지 실행을 지연시키는 것의 차이",
    },
    GROWTH: {
      primaryFamily: "GROWTH",
      strengthTruth: "새로운 가능성을 탐색하고 경험과 배움의 범위를 넓혀 나가는 시도의 힘",
      overuseTruth: "주변 상황이나 타인의 기대에 맞추느라 내 본래 방향을 잃고 적응에만 치우치는 경향",
      distinctionTruth: "나를 확장하는 성장의 변화와 내 주체성을 지우며 상황에 맞추는 맞춤형 적응의 차이",
    },
    ADAPTABILITY: {
      primaryFamily: "ADAPTABILITY",
      strengthTruth: "상황 변화에 유연하게 응대하고 다양한 변수를 조율하는 유연한 대응의 힘",
      overuseTruth: "내 중심 기준 없이 모든 요구와 변화를 혼자 다 수용하고 맞추려 하는 전담 조율 부담",
      distinctionTruth: "상황에 유연하게 대응하는 것과 내 본래 기준이 없어 매번 흔들리는 것의 차이",
    },
    BOUNDARY: {
      primaryFamily: "BOUNDARY",
      strengthTruth: "자신의 한계와 감당 범위를 알아차리고 명확한 경계를 지키는 힘",
      overuseTruth: "상대의 감정이나 팀 전체의 분위기까지 혼자 다 책임져야 한다는 과도한 연대 책임감",
      distinctionTruth: "상대를 배려하고 도우려는 마음과 상대가 감당해야 할 영역까지 내가 떠안는 것의 차이",
    },
    COMMUNICATION: {
      primaryFamily: "COMMUNICATION",
      strengthTruth: "의도와 감정을 명확히 표현하고 다리를 놓는 소통의 힘",
      overuseTruth: "모든 오해를 즉각 해명해야 한다는 조급함",
      distinctionTruth: "솔직한 의도 전달과 과도한 해명 지연의 차이",
    },
    RELATIONAL: {
      primaryFamily: "RELATIONAL",
      strengthTruth: "깊이 있는 신뢰 관계를 형성하고 내면을 나누는 힘",
      overuseTruth: "관계의 온도와 상대의 반응을 매번 점검하는 부담",
      distinctionTruth: "진정성 있는 연결과 상대의 감정을 전담하려는 것의 차이",
    },
    ENERGY: {
      primaryFamily: "ENERGY",
      strengthTruth: "내 에너지 흐름을 읽고 회복 루틴을 최우선 보호하는 힘",
      overuseTruth: "에너지가 잘 작동한다는 이유로 쉬지 않고 계속 가동하는 강점 오남용",
      distinctionTruth: "지속 가능한 원칙을 지키는 것과 에너지를 쥐어짜내는 것의 차이",
    },
  };

  const closingFrame = FAMILY_CLOSING_FRAMES[primaryFamily] || FAMILY_CLOSING_FRAMES.DECISION;

  return {
    primaryFamily,
    secondaryFamily,
    familyScores,
    doDirections,
    dontDirections,
    decisionRuleDirections,
    closingFrame,
    practiceEligible,
    practiceReason,
    ...(sajuBehavioralNote ? { sajuBehavioralNote } : {}),
    evidenceRefs: [
      `energy_mechanism:${energyPlan.primary.key}`,
      `fit_plan:${fitPlan.primaryFit.key}`,
    ],
  };
}

const RELATIONSHIP_RELEVANT_DIMENSION_KEYS: readonly string[] = [
  "conflict_decompression",
  "support_giving_style",
  "intimacy_expression_style",
  "boundary_defense_strength",
  "recognition_need",
  "solitude_autonomy",
  "pressure_response",
  "criticism_sensitivity",
  "expression_style",
];
const RELATIONSHIP_RELEVANT_SECONDARY_KEYS = ["empathy", "conflict_style", "recognition"] as const;

/** Builds Relationship grounding text + the exact key set shown for it (Part 03 Batch 1 / Batch 6). */
function buildRelationshipEvidence(packet: Part01IdentityEvidencePacket): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];

  const fitPlan = selectFitPlan(packet);
  lines.push("DETERMINISTIC PRIMARY & SECONDARY FIT NEEDS FOR THIS PROFILE (MANDATORY ANCHORS):");
  lines.push(`- [PRIMARY FIT NEED]: ${fitPlan.primaryFit.key} (${fitPlan.primaryFit.label})`);
  lines.push(`  People Fit Direction: ${fitPlan.primaryFit.peopleFitDirection}`);
  lines.push(`  Friction Mechanism: ${fitPlan.primaryFit.frictionDirection}`);
  lines.push(`  Communication Reception (Wound -> Steady): "${fitPlan.primaryFit.communicationTrigger}" vs "${fitPlan.primaryFit.communicationBetter}"`);
  lines.push(`  Environment/Team Fit Direction: ${fitPlan.primaryFit.environmentFitDirection}`);
  lines.push(`- [SECONDARY FIT NEED]: ${fitPlan.secondaryFit.key} (${fitPlan.secondaryFit.label})`);
  lines.push(`  People Fit Direction: ${fitPlan.secondaryFit.peopleFitDirection}`);
  lines.push(`  Friction Mechanism: ${fitPlan.secondaryFit.frictionDirection}`);
  lines.push(`  Communication Reception (Wound -> Steady): "${fitPlan.secondaryFit.communicationTrigger}" vs "${fitPlan.secondaryFit.communicationBetter}"`);
  lines.push(`  Environment/Team Fit Direction: ${fitPlan.secondaryFit.environmentFitDirection}`);
  lines.push("");

  lines.push(
    "Relevant CE dimensions (conflict decompression / support giving / intimacy expression / boundary defense / recognition need / solitude autonomy / pressure response / criticism sensitivity / expression style only):",
  );
  for (const cand of packet.dimensions.allDimensions) {
    if (!RELATIONSHIP_RELEVANT_DIMENSION_KEYS.includes(cand.dimension)) continue;
    if (!isUsableDimensionConfidence(cand.evaluation.confidence)) continue;
    const key = dimensionKey(cand.dimension);
    knownKeys.add(key);
    const mixed = cand.evaluation.is_mixed ? " mixed=true" : "";
    lines.push(`- [${key}] value=${cand.evaluation.value} conf=${cand.evaluation.confidence}${mixed}`);
  }

  lines.push("Current Secondary evidence (empathy, conflict_style, recognition only):");
  const secondary = packet.currentBehavior.secondaryAxes;
  for (const key of RELATIONSHIP_RELEVANT_SECONDARY_KEYS) {
    const skey = secondaryKey(key);
    knownKeys.add(skey);
    lines.push(`- [${skey}] score=${secondary[key]}`);
  }

  lines.push(
    "This person's already-identified top Current x Innate gaps/alignment (reused from axis_interpretations/energy — translate into a relational meaning here, do not re-decide which axis matters):",
  );
  const { gaps, alignment } = selectAxisHighlights(packet.axisComparisons);
  for (const a of [...gaps, ...(alignment ? [alignment] : [])]) {
    knownKeys.add(axisKey(a.axis));
    lines.push(formatAxisLine(a));
  }

  return { text: lines.join("\n"), knownKeys };
}

/**
 * Part 04 Batch 1 — Practice evidence Lens. Compact, purpose-specific
 * selection only: 4 of 12 CE dimensions (conflict_decompression/
 * pressure_response/criticism_sensitivity/expression_style), 2 of 11
 * Secondary axes (decision_style/resilience). No new mapping/calculation —
 * every source here is already computed elsewhere in the packet.
 */
const PRACTICE_RELEVANT_DIMENSION_KEYS: readonly string[] = [
  "conflict_decompression",
  "pressure_response",
  "criticism_sensitivity",
  "expression_style",
];
const PRACTICE_RELEVANT_SECONDARY_KEYS = ["decision_style", "resilience", "structure"] as const;

/** Builds Practice grounding text + the exact key set shown for it (Part 04 Batch 1). */
function buildPracticeEvidence(packet: Part01IdentityEvidencePacket): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];

  lines.push(
    "Relevant CE dimensions (conflict decompression / pressure response / criticism sensitivity / expression style only):",
  );
  for (const cand of packet.dimensions.allDimensions) {
    if (!PRACTICE_RELEVANT_DIMENSION_KEYS.includes(cand.dimension)) continue;
    if (!isUsableDimensionConfidence(cand.evaluation.confidence)) continue;
    const key = dimensionKey(cand.dimension);
    knownKeys.add(key);
    const mixed = cand.evaluation.is_mixed ? " mixed=true" : "";
    lines.push(`- [${key}] value=${cand.evaluation.value} conf=${cand.evaluation.confidence}${mixed}`);
  }

  lines.push("Current Secondary evidence (decision_style, resilience only):");
  const secondary = packet.currentBehavior.secondaryAxes;
  for (const key of PRACTICE_RELEVANT_SECONDARY_KEYS) {
    const skey = secondaryKey(key);
    knownKeys.add(skey);
    lines.push(`- [${skey}] score=${secondary[key]}`);
  }

  return { text: lines.join("\n"), knownKeys };
}

/**
 * Part 05 Batch 1 — Future evidence Lens. Originally just the already-
 * selected best-aligned axis (same selectAxisHighlights() call every other
 * Lens uses — reused, not re-derived, no new CE dims added).
 *
 * Narrative Quality Singleton Batch 2 — added a second, distinct axis slot
 * for Recover (future.remember[2]). Recover's own definition is "a natural
 * tendency currently used LESS than its innate baseline" — i.e. an
 * innate_higher gap axis — but the alignment axis (current ≈ innate, no
 * gap at all) was structurally the wrong evidence type for that field: it
 * has nothing to "recover" from. Both slots are reused from
 * selectAxisHighlights(), never re-decided.
 */
function buildFutureEvidence(packet: Part01IdentityEvidencePacket): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];

  const { gaps, alignment } = selectAxisHighlights(packet.axisComparisons);

  if (alignment) {
    knownKeys.add(axisKey(alignment.axis));
    lines.push(
      "Best-aligned Current x Innate axis — ground remember[0] (Keep) here: natural fit, low cost to use (same axis selectAxisHighlights() already picked for axis_interpretations/relationships, reused not re-decided):",
    );
    lines.push(formatAxisLine(alignment));
  } else {
    lines.push("No axis is closely aligned enough to serve as a single best-fit signal this time — do not force one for remember[0] (Keep).");
  }

  const recoverCandidate = gaps.find((g) => g.direction === "innate_higher");
  if (recoverCandidate) {
    knownKeys.add(axisKey(recoverCandidate.axis));
    lines.push(
      "Innate-higher-than-current gap axis — ground remember[2] (Recover) here specifically: a natural tendency this person has genuine capacity for but currently uses LESS than their innate baseline (reused from axis_interpretations, not re-decided):",
    );
    lines.push(formatAxisLine(recoverCandidate));
  } else {
    lines.push(
      "No selected gap axis is innate-higher-than-current this time — do not invent an underused-tendency claim for remember[2] (Recover); ground it in [Natural Self & Deep Needs] material already used in layered_identity instead, or write a more general, still-evidence-based permission-to-return-to-self statement without naming a specific axis.",
    );
  }

  const actionPlan = selectActionPlan(packet);
  lines.push("");
  lines.push("DETERMINISTIC ACTION PLAN DIRECTIONS FOR PART 07 (PERSONAL OPERATING PLAYBOOK):");
  lines.push(`- [PRIMARY ACTION FAMILY]: ${actionPlan.primaryFamily}`);
  lines.push(`- [SECONDARY ACTION FAMILY]: ${actionPlan.secondaryFamily}`);
  lines.push(`- [PRACTICE ELIGIBILITY]: ${actionPlan.practiceEligible ? "YES — PROFILE-SPECIFIC PRACTICE REQUIRED" : "NO — DO NOT GENERATE A PRACTICE EXERCISE (RETURN checklist: [])"}`);
  lines.push(`- [PRACTICE REASON]: ${actionPlan.practiceReason}`);
  lines.push("DETERMINISTIC CLOSING FRAME FOR PART 07 CLOSING:");
  lines.push(`  - [PRIMARY FAMILY STRENGTH TRUTH]: "${actionPlan.closingFrame.strengthTruth}"`);
  lines.push(`  - [PRIMARY FAMILY OVERUSE TRUTH]: "${actionPlan.closingFrame.overuseTruth}"`);
  lines.push(`- [PRIMARY FAMILY DISTINCTION TRUTH]: "${actionPlan.closingFrame.distinctionTruth}"`);
  lines.push("  - CLOSING MANDATE: closing MUST express this EXACT semantic tension (Strength -> Overuse -> Distinction). It MUST be dominated by [PRIMARY ACTION FAMILY] (${actionPlan.primaryFamily}). NEVER replace the primary family with secondary family language or generic AI self-discovery conclusions.");
  lines.push("CRITICAL SLOT CONSUMPTION CONTRACT FOR PART 07:");
  lines.push("  - DO Item 1 MUST consume DO Direction 1 ([PRIMARY ACTION FAMILY]).");
  lines.push("  - DO Item 2 MUST consume DO Direction 2 ([SECONDARY ACTION FAMILY]).");
  lines.push("  - DO Item 3 MUST consume DO Direction 3 (Energy Recovery).");
  lines.push("  - DON'T Item 1 MUST consume DON'T Direction 1 ([PRIMARY ACTION FAMILY] overuse).");
  lines.push("  - DON'T Item 2 MUST consume DON'T Direction 2 ([SECONDARY ACTION FAMILY] overuse).");
  lines.push("  - DON'T Item 3 MUST consume DON'T Direction 3 (Energy overuse).");
  lines.push("  - DECISION RULE 1 MUST consume Decision Rule Direction 1 ([PRIMARY ACTION FAMILY] filter).");
  lines.push("  - DECISION RULE 2 MUST consume Decision Rule Direction 2 ([SECONDARY ACTION FAMILY] filter).");
  lines.push("SECTION A — DO DIRECTIONS (What this person should intentionally keep doing):");
  actionPlan.doDirections.forEach((d, i) => lines.push(`  ${i + 1}. ${d}`));
  lines.push("SECTION B — DON'T DIRECTIONS (Strengths/patterns to stop overusing / reduce):");
  actionPlan.dontDirections.forEach((d, i) => lines.push(`  ${i + 1}. ${d}`));
  lines.push("SECTION C — DECISION RULES DIRECTIONS (Concrete decision filters for future choices):");
  actionPlan.decisionRuleDirections.forEach((d, i) => lines.push(`  ${i + 1}. ${d}`));
  if (actionPlan.sajuBehavioralNote) {
    lines.push(`BEHAVIORAL SAJU ACTION TRANSLATION: "${actionPlan.sajuBehavioralNote}"`);
  }

  return { text: lines.join("\n"), knownKeys };
}

/**
 * Batch 4 — strengthened minimum-evidence gate for adaptation_story.
 *
 * Required anchor:
 *   Must include at least ONE Current/adaptation anchor: FAMILY_GAP (at least
 *   1 wide gap axis) or FAMILY_CURRENT_PSYCH (usable secondary psych variance).
 * PLUS at least ONE independent corroborating family:
 *   - Layered identity depth (>=2 populated candidate buckets)
 *   - Innate Saju signal
 *   - Energy/relational CE dimension signal
 *   - A second, genuinely wide gap axis.
 *
 * LAYER + SAJU by itself without an adaptation anchor is NOT ELIGIBLE.
 */
export function hasAdaptationStoryEvidence(
  packet: Part01IdentityEvidencePacket | null | undefined,
): boolean {
  if (!packet) return false;
  const { gaps } = selectAxisHighlights(packet.axisComparisons);

  const hasGapAnchor = gaps.length > 0;
  const secondaryVals = Object.values(packet.currentBehavior?.secondaryAxes ?? {});
  const hasCurrentPsychAnchor = secondaryVals.some((v) => v >= 65 || v <= 35);

  const hasAdaptationAnchor = hasGapAnchor || hasCurrentPsychAnchor;
  if (!hasAdaptationAnchor) return false;

  const hasEnergySignal = packet.dimensions.allDimensions.some(
    (d) =>
      ENERGY_RELEVANT_DIMENSION_KEYS.includes(d.dimension) &&
      isUsableDimensionConfidence(d.evaluation.confidence),
  );

  const populatedLayerBucketCount = [
    packet.layeredIdentityCandidates.firstImpression,
    packet.layeredIdentityCandidates.knownSelf,
    packet.layeredIdentityCandidates.closePrivateSelf,
    packet.layeredIdentityCandidates.naturalSelfAndDeepNeeds,
  ].filter((bucket) => buildCandidateBucketEvidence(bucket).text.length > 0).length;
  const hasLayeredIdentitySignal = populatedLayerBucketCount >= 2;

  const hasSajuSignal = packet.innate.identityFacts.length > 0 || packet.innate.tenGodEvidence.length > 0;
  const hasSecondGapSignal = gaps.length >= 2;

  const corroboratingCount =
    (hasLayeredIdentitySignal ? 1 : 0) +
    (hasSajuSignal ? 1 : 0) +
    (hasEnergySignal ? 1 : 0) +
    (hasSecondGapSignal ? 1 : 0);

  return corroboratingCount >= 1;
}

/**
 * Builds both grounding text blocks from a Part01IdentityEvidencePacket.
 * Returns null if packet is null/undefined — callers must fall back to the
 * existing ungrounded prompt behavior in that case (Batch 3 rule: a failure
 * or absence here must never change existing Deep Essence behavior).
 */
export function formatPart01EvidenceForPrompt(
  packet: Part01IdentityEvidencePacket | null | undefined,
): Part01PromptEvidence | null {
  if (!packet) return null;
  const coreMode = buildCoreModeEvidence(packet);
  const growthEdge = buildGrowthEdgeEvidence(packet);
  const strengthsWatchouts = buildStrengthsWatchoutsEvidence(packet);
  const axisInterpretation = buildAxisInterpretationEvidence(packet);
  const energy = buildEnergyEvidence(packet);
  const relationship = buildRelationshipEvidence(packet);
  const practice = buildPracticeEvidence(packet);
  const future = buildFutureEvidence(packet);
  const { firstImpression, knownSelf, closePrivateSelf, naturalSelfAndDeepNeeds } =
    packet.layeredIdentityCandidates;
  const layeredIdentityBuckets = {
    firstImpression: buildCandidateBucketEvidence(firstImpression),
    knownSelf: buildCandidateBucketEvidence(knownSelf),
    closePrivateSelf: buildCandidateBucketEvidence(closePrivateSelf),
    naturalSelfAndDeepNeeds: buildCandidateBucketEvidence(naturalSelfAndDeepNeeds),
  };
  const synthesisKnownKeys = new Set<string>([
    ...layeredIdentityBuckets.firstImpression.knownKeys,
    ...layeredIdentityBuckets.knownSelf.knownKeys,
    ...layeredIdentityBuckets.closePrivateSelf.knownKeys,
    ...layeredIdentityBuckets.naturalSelfAndDeepNeeds.knownKeys,
  ]);
  // IA Batch 3 — adaptation_story reuses whatever's already in context
  // (axis interpretation + layered identity + energy, all generated earlier
  // in this same Part A response) rather than getting its own evidence-text
  // block, so its known-key pool is the union of those three, not a new Lens.
  const adaptationStoryKnownKeys = new Set<string>([
    ...axisInterpretation.innateEvidenceKnownKeys,
    ...axisInterpretation.gaps.flatMap((g) => [...g.currentKnownKeys]),
    ...(axisInterpretation.alignment ? [...axisInterpretation.alignment.currentKnownKeys] : []),
    ...synthesisKnownKeys,
    ...energy.knownKeys,
  ]);

  const adaptationStoryKeyFamilies = new Map<string, EvidenceFamily>();
  for (const k of axisInterpretation.innateEvidenceKnownKeys) {
    adaptationStoryKeyFamilies.set(k, "FAMILY_SAJU");
  }
  for (const k of synthesisKnownKeys) {
    if (!adaptationStoryKeyFamilies.has(k)) {
      adaptationStoryKeyFamilies.set(k, "FAMILY_LAYER");
    }
  }
  for (const g of axisInterpretation.gaps) {
    adaptationStoryKeyFamilies.set(`axis:${g.axis}`, "FAMILY_GAP");
    for (const ck of g.currentKnownKeys) {
      if (!adaptationStoryKeyFamilies.has(ck)) {
        adaptationStoryKeyFamilies.set(ck, "FAMILY_CURRENT_PSYCH");
      }
    }
  }
  if (axisInterpretation.alignment) {
    adaptationStoryKeyFamilies.set(`axis:${axisInterpretation.alignment.axis}`, "FAMILY_CURRENT_PSYCH");
    for (const ck of axisInterpretation.alignment.currentKnownKeys) {
      if (!adaptationStoryKeyFamilies.has(ck)) {
        adaptationStoryKeyFamilies.set(ck, "FAMILY_CURRENT_PSYCH");
      }
    }
  }
  for (const k of energy.knownKeys) {
    if (!adaptationStoryKeyFamilies.has(k)) {
      if (k.startsWith("dimension:")) {
        adaptationStoryKeyFamilies.set(k, "FAMILY_CE");
      } else if (k.startsWith("secondary:")) {
        adaptationStoryKeyFamilies.set(k, "FAMILY_CURRENT_PSYCH");
      } else {
        adaptationStoryKeyFamilies.set(k, "FAMILY_SAJU");
      }
    }
  }

  const adaptationStoryEligible = hasAdaptationStoryEvidence(packet);

  const res: Part01PromptEvidence = {
    coreModeText: coreMode.text,
    growthEdgeText: growthEdge.text,
    coreModeKnownKeys: coreMode.knownKeys,
    growthEdgeKnownKeys: growthEdge.knownKeys,
    layeredIdentity: {
      ...layeredIdentityBuckets,
      synthesisKnownKeys,
    },
    strengthsWatchoutsText: strengthsWatchouts.text,
    strengthsWatchoutsKnownKeys: strengthsWatchouts.knownKeys,
    axisInterpretation,
    energyText: energy.text,
    energyKnownKeys: energy.knownKeys,
    relationshipText: relationship.text,
    relationshipKnownKeys: relationship.knownKeys,
    practiceText: practice.text,
    practiceKnownKeys: practice.knownKeys,
    futureText: future.text,
    futureKnownKeys: future.knownKeys,
    adaptationStoryKnownKeys,
    adaptationStoryKeyFamilies,
    adaptationStoryEligible,
  };

  res.storyPlan = buildPersonalPart04StoryPlan(packet, res);
  return res;
}

/** Coerces + filters LLM-returned evidence refs down to only real packet keys. */
export function filterKnownEvidenceRefs(
  raw: unknown,
  knownKeys: Set<string> | undefined,
): string[] | undefined {
  if (!Array.isArray(raw) || !knownKeys || knownKeys.size === 0) return undefined;
  const filtered = raw.filter((v): v is string => typeof v === "string" && knownKeys.has(v));
  return filtered.length ? filtered : undefined;
}
