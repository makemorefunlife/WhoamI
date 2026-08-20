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
  lines.push("DETERMINISTIC PRIMARY & SECONDARY ENERGY MECHANISMS FOR THIS PROFILE (MANDATORY ANCHORS):");
  lines.push(`- [PRIMARY MECHANISM]: ${plan.primary.key} (${plan.primary.label})`);
  lines.push(`  Burden Description: ${plan.primary.description}`);
  lines.push(`  Restorative Fuel Direction: ${plan.primary.fuelExample}`);
  lines.push(`  Depleting Drain Direction: ${plan.primary.drainExample}`);
  lines.push(`- [SECONDARY MECHANISM]: ${plan.secondary.key} (${plan.secondary.label})`);
  lines.push(`  Burden Description: ${plan.secondary.description}`);
  lines.push(`  Restorative Fuel Direction: ${plan.secondary.fuelExample}`);
  lines.push(`  Depleting Drain Direction: ${plan.secondary.drainExample}`);
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

/** Builds Relationship grounding text + the exact key set shown for it (Part 03 Batch 1). */
function buildRelationshipEvidence(packet: Part01IdentityEvidencePacket): {
  text: string;
  knownKeys: Set<string>;
} {
  const knownKeys = new Set<string>();
  const lines: string[] = [];

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
