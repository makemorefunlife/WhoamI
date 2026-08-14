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
 */
import type {
  Part01CandidateItem,
  Part01EvidenceRef,
  Part01IdentityEvidencePacket,
} from "@/lib/v1/slim/part01IdentityEvidence";
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
};

export type Part01PromptEvidence = {
  coreModeText: string;
  growthEdgeText: string;
  coreModeKnownKeys: Set<string>;
  growthEdgeKnownKeys: Set<string>;
  layeredIdentity: Part01LayeredIdentityPromptEvidence;
  strengthsWatchoutsText: string;
  strengthsWatchoutsKnownKeys: Set<string>;
  axisInterpretation: Part01AxisInterpretationPromptEvidence;
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
  const { firstImpression, knownSelf, closePrivateSelf, naturalSelfAndDeepNeeds } =
    packet.layeredIdentityCandidates;
  return {
    coreModeText: coreMode.text,
    growthEdgeText: growthEdge.text,
    coreModeKnownKeys: coreMode.knownKeys,
    growthEdgeKnownKeys: growthEdge.knownKeys,
    layeredIdentity: {
      firstImpression: buildCandidateBucketEvidence(firstImpression),
      knownSelf: buildCandidateBucketEvidence(knownSelf),
      closePrivateSelf: buildCandidateBucketEvidence(closePrivateSelf),
      naturalSelfAndDeepNeeds: buildCandidateBucketEvidence(naturalSelfAndDeepNeeds),
    },
    strengthsWatchoutsText: strengthsWatchouts.text,
    strengthsWatchoutsKnownKeys: strengthsWatchouts.knownKeys,
    axisInterpretation,
  };
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
