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
 */
import type {
  Part01CandidateItem,
  Part01EvidenceRef,
  Part01IdentityEvidencePacket,
} from "@/lib/v1/slim/part01IdentityEvidence";
import type { AxisComparison } from "@/lib/v2/analysis/axisComparison";

function evidenceKey(ref: Part01EvidenceRef): string {
  return ref.fact_path;
}

function dimensionKey(dimension: string): string {
  return `dimension:${dimension}`;
}

function axisKey(axis: string): string {
  return `axis:${axis}`;
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
