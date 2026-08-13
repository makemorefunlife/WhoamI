/**
 * Batch 2 — Part 01 Identity Lens.
 *
 * Selects (does not conclude) the evidence Part 01 needs from the full
 * Personal Context — Saju chart facts, the Personal Context Engine's 12
 * relational dimensions, and Batch 1's Current×Innate AxisComparisons.
 *
 * This module produces candidate evidence buckets only. It never assigns a
 * final label, narrative, Core Mode, Growth Edge, or Layered Identity
 * sentence — that remains the Expert LLM's job in a later batch. No new
 * saju calculation or psych scoring happens here; every value is read
 * straight off IndividualSajuChart / PersonalContextEngineOutput / the
 * Batch 1 AxisComparison layer, all of which already exist.
 *
 * Governing rule reminder: a single fact_path or dimension key landing in a
 * bucket is a *candidate for consideration*, not a semantic conclusion
 * (e.g. "month pillar evidence in firstImpression" does NOT mean "this
 * person's first impression IS X" — it only means this fact is relevant
 * material for that question).
 */
import type {
  IndividualSajuChart,
} from "@/lib/personCore";
import { buildIndividualSajuChart, runPersonalContextEngine } from "@/lib/personCore";
import type {
  PersonalContextEngineOutput,
  PersonalContextPacket,
  PersonalContextProvenance,
} from "@/lib/personCore/personalContextEngine";
import type {
  PersonalRelationalProfile,
  RelationalDimensionEvaluation,
} from "@/lib/personCore/personalContextEngine/types";
import type {
  Confidence,
  EvidenceRef,
  PillarSlot,
} from "@/lib/personCore/individualSaju/types";
import {
  buildAxisComparisons,
  type AxisComparison,
} from "@/lib/v2/analysis/axisComparison";
import type {
  PrimaryAxesScores,
  SecondaryAxesScores,
} from "@/lib/v2/survey/types";

// ── shared evidence shapes ──────────────────────────────────────────────

/** A single fact-level evidence candidate, read straight from the chart. */
export type Part01EvidenceRef = {
  /** dot-path into IndividualSajuChart, e.g. "day_master", "pillars.month.twelve_stage" */
  fact_path: string;
  /** short factual codes (stem/branch/element/type_id) — not interpreted meaning */
  codes: string[];
  /**
   * Only present when the underlying chart fact carries its own confidence
   * (five_elements/johu/strength/rootedness/seasonal_strength/
   * favorable_elements/gongmang). Facts with no native confidence
   * (day_master, pillars, relations_intra) are left undefined — never
   * fabricated here.
   */
  confidence?: Confidence;
  /** Raw evidence pointers already computed by the saju engine — carried through, not re-derived. */
  evidence: EvidenceRef[];
};

/** A dimension-level evidence candidate — the CE's own evaluation, untouched. */
export type Part01DimensionCandidate = {
  dimension: keyof PersonalRelationalProfile;
  evaluation: RelationalDimensionEvaluation;
};

export type Part01CandidateItem =
  | ({ kind: "evidence" } & Part01EvidenceRef)
  | ({ kind: "dimension" } & Part01DimensionCandidate);

export type Part01InnateEvidence = {
  identityFacts: Part01EvidenceRef[];
  elementEvidence: Part01EvidenceRef[];
  tenGodEvidence: Part01EvidenceRef[];
  strengthEvidence: Part01EvidenceRef[];
  climateEvidence: Part01EvidenceRef[];
  pillarEvidence: Part01EvidenceRef[];
  relationEvidence: Part01EvidenceRef[];
  optionalSignals: Part01EvidenceRef[];
  /**
   * Batch 3 addition: the CE's own group:"strengths" packet curation
   * (distinct from `strengthEvidence`, which is the day-master 신강/신약
   * strength fact). Needed for Core Mode grounding (Batch 3 spec §1).
   */
  ceStrengthSignals: Part01EvidenceRef[];
};

export type Part01LayeredIdentityCandidates = {
  firstImpression: Part01CandidateItem[];
  knownSelf: Part01CandidateItem[];
  closePrivateSelf: Part01CandidateItem[];
  naturalSelfAndDeepNeeds: Part01CandidateItem[];
};

export type Part01GrowthCandidates = {
  growthEvidence: Part01EvidenceRef[];
  cautionEvidence: Part01EvidenceRef[];
  relevantDimensions: Part01DimensionCandidate[];
  /** Full 6-axis comparison, unfiltered — the Lens does not decide "gap = growth edge". */
  axisEvidence: AxisComparison[];
};

export type Part01IdentityEvidencePacket = {
  axisComparisons: AxisComparison[];
  currentBehavior: {
    primaryAxes: PrimaryAxesScores;
    secondaryAxes: SecondaryAxesScores;
  };
  innate: Part01InnateEvidence;
  dimensions: {
    /**
     * Canonical preservation of all 12 Personal CE dimensions. Not a
     * Part01 relevance selection; use purpose-specific Lens candidate
     * buckets for prompt evidence.
     */
    allDimensions: Part01DimensionCandidate[];
  };
  layeredIdentityCandidates: Part01LayeredIdentityCandidates;
  growthCandidates: Part01GrowthCandidates;
  provenance: PersonalContextProvenance;
};

// ── runtime companion of the PersonalRelationalProfile type ────────────
// Must stay in sync with lib/personCore/personalContextEngine/types.ts —
// no exported keys array exists there today, so this mirrors it (same
// pattern already used for PRIMARY_TO_SECONDARY_AXIS_KEYS in Batch 1: a
// single named list, not re-derived ad hoc at each call site).
const RELATIONAL_DIMENSION_KEYS: (keyof PersonalRelationalProfile)[] = [
  "expression_style",
  "recognition_need",
  "decision_pace",
  "resource_governance",
  "solitude_autonomy",
  "conflict_decompression",
  "pressure_response",
  "support_giving_style",
  "criticism_sensitivity",
  "intimacy_expression_style",
  "structure_spontaneity",
  "boundary_defense_strength",
];

// ── small builders ──────────────────────────────────────────────────────

function evidenceRef(
  fact_path: string,
  codes: string[],
  confidence?: Confidence,
  evidence: EvidenceRef[] = [],
): Part01EvidenceRef {
  return { fact_path, codes, confidence, evidence };
}

function asItem(ref: Part01EvidenceRef): Part01CandidateItem {
  return { kind: "evidence", ...ref };
}

function packetToEvidenceRef(packet: PersonalContextPacket): Part01EvidenceRef {
  return {
    fact_path: packet.fact_path,
    codes: packet.codes,
    confidence: packet.confidence,
    evidence: packet.evidence,
  };
}

function findPillar(chart: IndividualSajuChart, slot: PillarSlot) {
  return chart.pillars.find((p) => p.slot === slot) ?? null;
}

function dimensionCandidate(
  dims: Record<string, RelationalDimensionEvaluation> | undefined,
  key: keyof PersonalRelationalProfile,
): Part01DimensionCandidate | null {
  const evaluation = dims?.[key];
  if (!evaluation) return null;
  return { dimension: key, evaluation };
}

function dimensionItem(
  dims: Record<string, RelationalDimensionEvaluation> | undefined,
  key: keyof PersonalRelationalProfile,
): Part01CandidateItem | null {
  const c = dimensionCandidate(dims, key);
  return c ? { kind: "dimension", ...c } : null;
}

function nonNull<T>(v: T | null): v is T {
  return v !== null;
}

// ── General Part 01 identity evidence (section A) ──────────────────────
// Read directly from the full IndividualSajuChart — not capped by the CE's
// per-group admission limits (those exist for a different, still-unused
// consumer). This is how "Full Personal Context first" is honored: nothing
// here is pre-filtered down to a handful of pillars.

function buildInnateEvidence(
  chart: IndividualSajuChart,
  personalContext: PersonalContextEngineOutput,
): Part01InnateEvidence {
  const identityFacts: Part01EvidenceRef[] = [
    evidenceRef("day_master", [
      chart.day_master.stem.code,
      chart.day_master.day_branch.code,
      chart.day_master.element,
      chart.day_master.yin_yang,
    ]),
  ];

  const elementEvidence: Part01EvidenceRef[] = [
    evidenceRef(
      "five_elements",
      [chart.five_elements.dominant, chart.five_elements.weakest],
      chart.five_elements.confidence,
      chart.five_elements.evidence,
    ),
  ];

  const tenGodEvidence: Part01EvidenceRef[] = [
    ...chart.pillars.flatMap((p) => [
      evidenceRef(`pillars.${p.slot}.stem_ten_god`, [p.stem_ten_god.code]),
      evidenceRef(`pillars.${p.slot}.branch_ten_god`, [p.branch_ten_god.code]),
    ]),
  ];

  const strengthEvidence: Part01EvidenceRef[] = [
    evidenceRef(
      "strength",
      [chart.strength.label_token],
      chart.strength.confidence,
      chart.strength.evidence,
    ),
    evidenceRef(
      "rootedness",
      [String(chart.rootedness.rootedness_index)],
      chart.rootedness.confidence,
      chart.rootedness.evidence,
    ),
  ];

  const climateEvidence: Part01EvidenceRef[] = [
    evidenceRef(
      "johu",
      [chart.johu.temperature_band, chart.johu.moisture_band],
      chart.johu.confidence,
      chart.johu.evidence,
    ),
    evidenceRef(
      "seasonal_strength",
      [String(chart.seasonal_strength.in_season), String(chart.seasonal_strength.season_score)],
      chart.seasonal_strength.confidence,
      chart.seasonal_strength.evidence,
    ),
  ];

  const pillarEvidence: Part01EvidenceRef[] = chart.pillars.flatMap((p) => [
    evidenceRef(`pillars.${p.slot}.twelve_stage`, [p.twelve_stage.code]),
    ...(p.hidden_stems.length
      ? [evidenceRef(`pillars.${p.slot}.hidden_stems`, p.hidden_stems.map((hs) => hs.stem.code))]
      : []),
  ]);

  const relationEvidence: Part01EvidenceRef[] = chart.relations_intra.map((r) =>
    evidenceRef(`relations_intra.${r.type_id}`, [...r.codes, ...r.pillar_slots], undefined, r.evidence),
  );

  const optionalSignals: Part01EvidenceRef[] = [
    ...(chart.nobles.noble_hits.length
      ? [evidenceRef("nobles", [...chart.nobles.noble_hits])]
      : []),
    ...chart.special_signals
      .filter((s) => s.possessed)
      .map((s) => evidenceRef(`special_signals.${s.signal_id}`, [String(s.signal_id)], undefined, s.evidence)),
    ...(chart.gongmang.void_branch_codes.length
      ? [
          evidenceRef(
            "gongmang",
            [...chart.gongmang.void_branch_codes],
            chart.gongmang.confidence,
            chart.gongmang.evidence,
          ),
        ]
      : []),
    evidenceRef(
      "favorable_elements",
      [...chart.favorable_elements.yongsin, ...chart.favorable_elements.huisin, ...chart.favorable_elements.gisin],
      chart.favorable_elements.confidence,
      chart.favorable_elements.evidence,
    ),
  ];

  const ceStrengthSignals: Part01EvidenceRef[] = personalContext.groups.strengths.map(
    packetToEvidenceRef,
  );

  return {
    identityFacts,
    elementEvidence,
    tenGodEvidence,
    strengthEvidence,
    climateEvidence,
    pillarEvidence,
    relationEvidence,
    optionalSignals,
    ceStrengthSignals,
  };
}

// ── Layered Identity candidate buckets (section B) ──────────────────────
// "Candidate" only — no fact_path here decides the final narrative. The
// pillar anchors below are the ones the product wants *checked first*
// (per Part01 Architecture Freeze), not a fixed formula.

function buildLayeredIdentityCandidates(
  chart: IndividualSajuChart,
  dims: Record<string, RelationalDimensionEvaluation> | undefined,
): Part01LayeredIdentityCandidates {
  const month = findPillar(chart, "month");
  const day = findPillar(chart, "day");

  const firstImpression: Part01CandidateItem[] = [
    ...(month
      ? [
          asItem(evidenceRef("pillars.month.stem_ten_god", [month.stem_ten_god.code])),
          asItem(evidenceRef("pillars.month.branch_ten_god", [month.branch_ten_god.code])),
          asItem(evidenceRef("pillars.month.twelve_stage", [month.twelve_stage.code])),
          ...(month.hidden_stems.length
            ? [asItem(evidenceRef("pillars.month.hidden_stems", month.hidden_stems.map((hs) => hs.stem.code)))]
            : []),
        ]
      : []),
    asItem(
      evidenceRef(
        "seasonal_strength",
        [String(chart.seasonal_strength.in_season), String(chart.seasonal_strength.season_score)],
        chart.seasonal_strength.confidence,
        chart.seasonal_strength.evidence,
      ),
    ),
    ...chart.relations_intra
      .filter((r) => r.pillar_slots.includes("month"))
      .map((r) => asItem(evidenceRef(`relations_intra.${r.type_id}`, [...r.codes], undefined, r.evidence))),
    dimensionItem(dims, "expression_style"),
  ].filter(nonNull);

  const knownSelf: Part01CandidateItem[] = [
    asItem(
      evidenceRef("day_master", [
        chart.day_master.stem.code,
        chart.day_master.element,
        chart.day_master.yin_yang,
      ]),
    ),
    dimensionItem(dims, "decision_pace"),
    dimensionItem(dims, "structure_spontaneity"),
    dimensionItem(dims, "resource_governance"),
  ].filter(nonNull);

  const closePrivateSelf: Part01CandidateItem[] = [
    ...(day
      ? [
          asItem(evidenceRef("pillars.day.branch", [day.branch.code])),
          ...(day.hidden_stems.length
            ? [asItem(evidenceRef("pillars.day.hidden_stems", day.hidden_stems.map((hs) => hs.stem.code)))]
            : []),
        ]
      : []),
    ...chart.relations_intra
      .filter((r) => r.pillar_slots.includes("day"))
      .map((r) => asItem(evidenceRef(`relations_intra.${r.type_id}`, [...r.codes], undefined, r.evidence))),
    dimensionItem(dims, "intimacy_expression_style"),
    dimensionItem(dims, "solitude_autonomy"),
    dimensionItem(dims, "support_giving_style"),
    dimensionItem(dims, "boundary_defense_strength"),
  ].filter(nonNull);

  const naturalSelfAndDeepNeeds: Part01CandidateItem[] = [
    dimensionItem(dims, "recognition_need"),
    dimensionItem(dims, "pressure_response"),
    dimensionItem(dims, "criticism_sensitivity"),
    asItem(
      evidenceRef(
        "strength",
        [chart.strength.label_token],
        chart.strength.confidence,
        chart.strength.evidence,
      ),
    ),
    asItem(
      evidenceRef(
        "favorable_elements",
        [...chart.favorable_elements.yongsin, ...chart.favorable_elements.huisin],
        chart.favorable_elements.confidence,
        chart.favorable_elements.evidence,
      ),
    ),
  ].filter(nonNull);

  return { firstImpression, knownSelf, closePrivateSelf, naturalSelfAndDeepNeeds };
}

// ── Growth candidate evidence ────────────────────────────────────────────
// Reuses the CE's own "growth"/"cautions" group curation directly — no new
// grouping logic. Does NOT pick a Growth Edge; that stays an LLM decision
// in a later batch, made from this cluster plus real-life leverage judgment.

function buildGrowthCandidates(
  personalContext: PersonalContextEngineOutput,
  dims: Record<string, RelationalDimensionEvaluation> | undefined,
  axisComparisons: AxisComparison[],
): Part01GrowthCandidates {
  const growthEvidence = personalContext.groups.growth.map(packetToEvidenceRef);
  const cautionEvidence = personalContext.groups.cautions.map(packetToEvidenceRef);

  const relevantDimensions = (
    [
      "pressure_response",
      "criticism_sensitivity",
      "decision_pace",
      "recognition_need",
    ] as (keyof PersonalRelationalProfile)[]
  )
    .map((key) => dimensionCandidate(dims, key))
    .filter(nonNull);

  return {
    growthEvidence,
    cautionEvidence,
    relevantDimensions,
    axisEvidence: axisComparisons,
  };
}

// ── entry point ──────────────────────────────────────────────────────────

export type BuildPart01IdentityEvidencePacketParams = {
  chart: IndividualSajuChart;
  personalContext: PersonalContextEngineOutput;
  currentPrimary: PrimaryAxesScores;
  currentSecondary: SecondaryAxesScores;
  innatePrimary: PrimaryAxesScores;
};

/**
 * Part 01 Identity Lens. Selects relevant evidence only — does not decide
 * Core Mode, Growth Edge, Strengths/Watchouts, or any Layered Identity
 * narrative. Those remain the Expert LLM's job in a later batch.
 */
export function buildPart01IdentityEvidencePacket(
  params: BuildPart01IdentityEvidencePacketParams,
): Part01IdentityEvidencePacket {
  const { chart, personalContext, currentPrimary, currentSecondary, innatePrimary } = params;

  const axisComparisons = buildAxisComparisons(currentPrimary, currentSecondary, innatePrimary);

  const dims = personalContext.aggregates.relational_profile
    ?.dimension_evaluations as Record<string, RelationalDimensionEvaluation> | undefined;

  const allDimensions = RELATIONAL_DIMENSION_KEYS
    .map((key) => dimensionCandidate(dims, key))
    .filter(nonNull);

  return {
    axisComparisons,
    currentBehavior: {
      primaryAxes: currentPrimary,
      secondaryAxes: currentSecondary,
    },
    innate: buildInnateEvidence(chart, personalContext),
    dimensions: { allDimensions },
    layeredIdentityCandidates: buildLayeredIdentityCandidates(chart, dims),
    growthCandidates: buildGrowthCandidates(personalContext, dims, axisComparisons),
    provenance: personalContext.provenance,
  };
}

/**
 * Convenience wrapper: builds the IndividualSajuChart + runs the Personal
 * Context Engine + assembles the Part01 packet in one call, reusing the
 * SajuBundle callers already compute (calculateSajuBundle) — no second
 * saju calculation.
 */
export function buildPart01IdentityEvidencePacketFromBundle(params: {
  reportId: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  bundle: Parameters<typeof buildIndividualSajuChart>[0]["bundle"];
  currentPrimary: PrimaryAxesScores;
  currentSecondary: SecondaryAxesScores;
  innatePrimary: PrimaryAxesScores;
}): Part01IdentityEvidencePacket {
  const chart = buildIndividualSajuChart({
    reportId: params.reportId,
    birthDate: params.birthDate,
    birthTime: params.birthTime,
    birthTimeUnknown: params.birthTimeUnknown,
    bundle: params.bundle,
  });
  const personalContext = runPersonalContextEngine({ chart });
  return buildPart01IdentityEvidencePacket({
    chart,
    personalContext,
    currentPrimary: params.currentPrimary,
    currentSecondary: params.currentSecondary,
    innatePrimary: params.innatePrimary,
  });
}
