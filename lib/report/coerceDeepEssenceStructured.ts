/**
 * Coerce messy LLM JSON into Deep Essence Part A/B shape before strict
 * validation. Length mismatches (2 strengths, 6 checklist items, wrong bar
 * tones) are the #1 reason Inner Compass silently falls back to prose.
 */
import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";
import {
  normalizeForComparison,
  similarityScore,
  WATCHOUT_SEMANTIC_OVERLAP_THRESHOLD,
} from "@/lib/report/deepEssenceChecklistDedup";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

function asScore(v: unknown, fallback = 50): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Batch 6 — passes through LLM-returned evidence_refs only if present; never fabricated. */
function asOptionalStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const filtered = v.filter((x): x is string => typeof x === "string");
  return filtered.length ? filtered : undefined;
}

/**
 * Final Narrative Stabilization — passes through LLM-returned cost_domain
 * only if present (watchouts[].cost_domain). Never validated against the
 * WATCHOUT_COST_DOMAINS enum here — a malformed or missing value must never
 * fail the report, it just can't participate in the exact-match collision
 * check below and the fuzzy prose signal remains the only detector for it.
 */
function asOptionalString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function takeStrings(v: unknown, min: number, max: number, pad: string): string[] {
  const raw = Array.isArray(v) ? v : [];
  const out = raw
    .map((item) => asString(item))
    .filter((s) => s.length > 0)
    .slice(0, max);
  while (out.length < min) {
    out.push(pad);
  }
  return out;
}

function takePairs(
  v: unknown,
  min: number,
  max: number,
  mapItem: (item: Record<string, unknown>, i: number) => Record<string, unknown>,
  pad: () => Record<string, unknown>,
): Record<string, unknown>[] {
  const raw = Array.isArray(v) ? v : [];
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < raw.length && out.length < max; i++) {
    const row = asRecord(raw[i]);
    if (!row) continue;
    out.push(mapItem(row, i));
  }
  while (out.length < min) out.push(pad());
  return out;
}

// Batch 4 — a layer with no narrative is omitted, never fabricated (thin
// evidence must read as conditional/absent, not padded like the fixed-length
// strengths/watchouts/energy arrays above).
const LAYERED_IDENTITY_KEYS = [
  "first_impression",
  "known_self",
  "close_private_self",
  "natural_self_and_deep_needs",
] as const;

function coerceLayeredIdentityLayer(
  raw: unknown,
): { title?: string; narrative: string; evidence_refs?: string[] } | null {
  const row = asRecord(raw);
  const narrative = row ? asString(row.narrative) : "";
  if (!narrative) return null;
  const title = row ? asString(row.title) : "";
  const evidenceRefs = row && Array.isArray(row.evidence_refs)
    ? row.evidence_refs.filter((v): v is string => typeof v === "string")
    : undefined;
  return {
    ...(title ? { title } : {}),
    narrative,
    ...(evidenceRefs?.length ? { evidence_refs: evidenceRefs } : {}),
  };
}

// IA Batch 2 — same shape/rule as coerceLayeredIdentityLayer, minus `title`
// (synthesis has no short label of its own). Whether it's actually kept
// depends on the caller enforcing the >= 2 populated layers rule below —
// this function only validates shape, never the minimum-evidence rule.
function coerceLayeredIdentitySynthesis(
  raw: unknown,
): { narrative: string; evidence_refs?: string[] } | null {
  const row = asRecord(raw);
  const narrative = row ? asString(row.narrative) : "";
  if (!narrative) return null;
  const evidenceRefs = row && Array.isArray(row.evidence_refs)
    ? row.evidence_refs.filter((v): v is string => typeof v === "string")
    : undefined;
  return {
    narrative,
    ...(evidenceRefs?.length ? { evidence_refs: evidenceRefs } : {}),
  };
}

// IA Batch 3 — same shape/rule as coerceLayeredIdentitySynthesis. The
// deterministic minimum-evidence gate (hasAdaptationStoryEvidence) and the
// defensive eligibility re-check both live upstream of coercion (the
// evidence packet isn't visible here) — this function only validates shape:
// no narrative, no field, same as every other omittable Batch 3+ field.
function coerceAdaptationStory(
  raw: unknown,
): { narrative: string; evidence_refs?: string[] } | null {
  const row = asRecord(raw);
  const narrative = row ? asString(row.narrative) : "";
  if (!narrative) return null;
  const evidenceRefs = row && Array.isArray(row.evidence_refs)
    ? row.evidence_refs.filter((v): v is string => typeof v === "string")
    : undefined;
  return {
    narrative,
    ...(evidenceRefs?.length ? { evidence_refs: evidenceRefs } : {}),
  };
}

// Batch 8 — an axis missing any required text field is dropped entirely,
// never padded (same "never fabricate" rule as Batch 4's layers). Gap
// deep-dives need 4 fields (may_work_better stays optional); alignment
// highlights need 3.
function coerceAxisGapDeepDive(
  raw: unknown,
): {
  natural_tendency: string;
  current_pattern: string;
  gives_you: string;
  may_cost: string;
  may_work_better?: string;
  current_evidence_refs?: string[];
  innate_evidence_refs?: string[];
} | null {
  const row = asRecord(raw);
  if (!row) return null;
  const natural_tendency = asString(row.natural_tendency);
  const current_pattern = asString(row.current_pattern);
  const gives_you = asString(row.gives_you);
  const may_cost = asString(row.may_cost);
  if (!natural_tendency || !current_pattern || !gives_you || !may_cost) return null;
  const mayWorkBetter = asString(row.may_work_better) || undefined;
  const currentRefs = asOptionalStringArray(row.current_evidence_refs);
  const innateRefs = asOptionalStringArray(row.innate_evidence_refs);
  return {
    natural_tendency,
    current_pattern,
    gives_you,
    may_cost,
    ...(mayWorkBetter ? { may_work_better: mayWorkBetter } : {}),
    ...(currentRefs ? { current_evidence_refs: currentRefs } : {}),
    ...(innateRefs ? { innate_evidence_refs: innateRefs } : {}),
  };
}

function coerceAxisAlignmentHighlight(
  raw: unknown,
): {
  natural_tendency: string;
  current_pattern: string;
  why_it_feels_easy: string;
  current_evidence_refs?: string[];
  innate_evidence_refs?: string[];
} | null {
  const row = asRecord(raw);
  if (!row) return null;
  const natural_tendency = asString(row.natural_tendency);
  const current_pattern = asString(row.current_pattern);
  const why_it_feels_easy = asString(row.why_it_feels_easy);
  if (!natural_tendency || !current_pattern || !why_it_feels_easy) return null;
  const currentRefs = asOptionalStringArray(row.current_evidence_refs);
  const innateRefs = asOptionalStringArray(row.innate_evidence_refs);
  return {
    natural_tendency,
    current_pattern,
    why_it_feels_easy,
    ...(currentRefs ? { current_evidence_refs: currentRefs } : {}),
    ...(innateRefs ? { innate_evidence_refs: innateRefs } : {}),
  };
}

const TONES = new Set(["highlight", "accent", "ink"]);

function coerceTone(v: unknown, fallback: "highlight" | "accent" | "ink") {
  return typeof v === "string" && TONES.has(v) ? v : fallback;
}

export type CoerceDeepEssenceDiagnostics = {
  part: "A" | "B" | "merged";
  ok: boolean;
  notes: string[];
};

/** Normalize Part A object in place (returns new object). */
export function coerceDeepEssencePartA(
  raw: unknown,
  floor: PrimaryAxesScores,
  locale: string = "ko-KR",
): { value: Record<string, unknown>; notes: string[] } {
  const notes: string[] = [];
  const obj = asRecord(raw) ?? {};
  const summaryIn = asRecord(obj.summary) ?? {};
  // Batch 3 — optional provenance fields, passed through only if the LLM
  // actually returned them (never fabricated, never required).
  const coreModeRefs = Array.isArray(summaryIn.core_mode_evidence_refs)
    ? summaryIn.core_mode_evidence_refs.filter((v): v is string => typeof v === "string")
    : undefined;
  const growthEdgeRefs = Array.isArray(summaryIn.growth_edge_evidence_refs)
    ? summaryIn.growth_edge_evidence_refs.filter((v): v is string => typeof v === "string")
    : undefined;
  const growthEdgeWhy = asString(summaryIn.growth_edge_why) || undefined;
  const growthEdgeRealLifePattern = asString(summaryIn.growth_edge_real_life_pattern) || undefined;
  const growthEdgeIfDeveloped = asString(summaryIn.growth_edge_if_developed) || undefined;

  const summary = {
    core_mode: asString(summaryIn.core_mode, "Core mode"),
    energy_balance: asString(summaryIn.energy_balance, "50 / 50"),
    growth_edge: asString(summaryIn.growth_edge, "Growth"),
    ...(coreModeRefs?.length ? { core_mode_evidence_refs: coreModeRefs } : {}),
    ...(growthEdgeRefs?.length ? { growth_edge_evidence_refs: growthEdgeRefs } : {}),
    ...(growthEdgeWhy ? { growth_edge_why: growthEdgeWhy } : {}),
    ...(growthEdgeRealLifePattern ? { growth_edge_real_life_pattern: growthEdgeRealLifePattern } : {}),
    ...(growthEdgeIfDeveloped ? { growth_edge_if_developed: growthEdgeIfDeveloped } : {}),
  };
  if (!asString(summaryIn.core_mode)) notes.push("summary.core_mode_padded");

  const radarIn = asRecord(obj.radar_potential) ?? {};
  const radar_potential = {} as Record<string, number>;
  for (const key of PRIMARY_AXIS_KEYS) {
    radar_potential[key] = Math.max(
      floor[key] ?? 0,
      asScore(radarIn[key], floor[key] ?? 50),
    );
  }

  const strengths = takePairs(
    obj.strengths,
    3,
    3,
    (row, i) => {
      const evidenceRefs = asOptionalStringArray(row.evidence_refs);
      return {
        title: asString(row.title, `Strength ${i + 1}`),
        body: asString(row.body, "This strength shows up in everyday choices."),
        ...(evidenceRefs ? { evidence_refs: evidenceRefs } : {}),
      };
    },
    () => ({
      title: "Strength",
      body: "This strength shows up in everyday choices.",
    }),
  );
  if (!Array.isArray(obj.strengths) || obj.strengths.length !== 3) {
    notes.push(`strengths_len_${Array.isArray(obj.strengths) ? obj.strengths.length : 0}`);
  }

  const watchouts = takePairs(
    obj.watchouts,
    3,
    3,
    (row, i) => {
      const evidenceRefs = asOptionalStringArray(row.evidence_refs);
      const costDomain = asOptionalString(row.cost_domain);
      return {
        title: asString(row.title, `Watch-out ${i + 1}`),
        body: asString(row.body, "This pattern can drain energy when it runs hot."),
        ...(evidenceRefs ? { evidence_refs: evidenceRefs } : {}),
        ...(costDomain ? { cost_domain: costDomain } : {}),
      };
    },
    () => ({
      title: "Watch-out",
      body: "This pattern can drain energy when it runs hot.",
    }),
  );

  // Narrative Quality Final Stabilization — Batch B, then upgraded with an
  // exact cost_domain signal. Both remain observability-only — no
  // regeneration, no schema requirement, no new LLM call (correcting a
  // detected collision would need either, both out of scope here) — but
  // the exact-match check is a materially more reliable detector than the
  // fuzzy one: two watchouts sharing the identical cost_domain value is a
  // deterministic fact, not a similarity-threshold guess, so it should be
  // trusted first when both signals are available. The fuzzy prose check
  // stays as the fallback for whenever cost_domain is missing/malformed
  // (older cache, or the LLM skipped the field despite the prompt).
  const watchoutRows = watchouts as { body: string; cost_domain?: string }[];
  const watchoutBodies = watchoutRows.map((w) => normalizeForComparison(w.body, locale));
  for (let i = 0; i < watchoutRows.length; i++) {
    for (let j = i + 1; j < watchoutRows.length; j++) {
      const domainI = watchoutRows[i].cost_domain;
      const domainJ = watchoutRows[j].cost_domain;
      if (domainI && domainJ && domainI === domainJ) {
        notes.push(`watchouts_cost_domain_collision_${i}_${j}_${domainI}`);
      }
      const score = similarityScore(watchoutBodies[i], watchoutBodies[j], locale);
      if (score >= WATCHOUT_SEMANTIC_OVERLAP_THRESHOLD) {
        notes.push(`watchouts_semantic_overlap_${i}_${j}_score_${score.toFixed(2)}`);
      }
    }
  }

  const energyIn = asRecord(obj.energy) ?? {};
  const defaultBars = [
    { label: "Energy spent on people", value: 55, tone: "highlight" },
    { label: "Energy returning to you", value: 45, tone: "accent" },
    { label: "Solo recovery time", value: 60, tone: "ink" },
  ] as const;
  const barsRaw = Array.isArray(energyIn.bars) ? energyIn.bars : [];
  const bars = defaultBars.map((fallback, i) => {
    const row = asRecord(barsRaw[i]) ?? {};
    return {
      label: asString(row.label, fallback.label),
      value: asScore(row.value, fallback.value),
      tone: coerceTone(row.tone, fallback.tone),
    };
  });
  if (barsRaw.length !== 3) notes.push(`energy.bars_len_${barsRaw.length}`);

  // Part 02 Batch 1 — balance_pct SSOT: always derived from bars[1] ("energy
  // returning to you"), never trusted from the LLM's own number. bars is
  // always exactly 3 entries (defaultBars.map above), so bars[1] always exists.
  const energyEvidenceRefs = asOptionalStringArray(energyIn.evidence_refs);
  const energy = {
    headline: asString(energyIn.headline, "Your energy follows a clear pattern."),
    balance_pct: bars[1].value,
    bars,
    summary: asString(
      energyIn.summary,
      "Your energy rises with meaningful connection and needs quiet recovery.",
    ),
    fuels: takeStrings(energyIn.fuels, 3, 5, "Quiet time that restores you"),
    drains: takeStrings(energyIn.drains, 3, 5, "Sudden social pressure"),
    optimal: takeStrings(energyIn.optimal, 2, 4, "A steady daily rhythm"),
    ...(energyEvidenceRefs ? { evidence_refs: energyEvidenceRefs } : {}),
  };

  const layeredIdentityIn = asRecord(obj.layered_identity);
  const layeredIdentityOut: Record<string, unknown> = {};
  if (layeredIdentityIn) {
    for (const key of LAYERED_IDENTITY_KEYS) {
      const layer = coerceLayeredIdentityLayer(layeredIdentityIn[key]);
      if (layer) layeredIdentityOut[key] = layer;
    }
  }
  const hasAnyLayer = Object.keys(layeredIdentityOut).length > 0;
  // IA Batch 2 — server-enforced minimum-evidence rule: synthesis is a
  // statement about the CHANGE between layers, so it needs at least two
  // populated layers to mean anything. Enforced here regardless of whether
  // the LLM followed the prompt instruction to omit it — never trust the
  // model to police its own boundary (same principle as the evidence_refs
  // filtering in runDeepEssenceStructuredLlm.ts).
  const layeredIdentityCount = Object.keys(layeredIdentityOut).length;
  if (layeredIdentityIn && layeredIdentityCount >= 2) {
    const synthesis = coerceLayeredIdentitySynthesis(layeredIdentityIn.synthesis);
    if (synthesis) layeredIdentityOut.synthesis = synthesis;
  }

  const axisInterpretationsIn = asRecord(obj.axis_interpretations);
  const gapDeepDiveIn = asRecord(axisInterpretationsIn?.gap_deep_dive);
  const gapDeepDiveOut: Record<string, unknown> = {};
  if (gapDeepDiveIn) {
    for (const key of PRIMARY_AXIS_KEYS) {
      const dive = coerceAxisGapDeepDive(gapDeepDiveIn[key]);
      if (dive) gapDeepDiveOut[key] = dive;
    }
  }
  const alignmentHighlightIn = asRecord(axisInterpretationsIn?.alignment_highlight);
  const alignmentHighlightOut: Record<string, unknown> = {};
  if (alignmentHighlightIn) {
    for (const key of PRIMARY_AXIS_KEYS) {
      const highlight = coerceAxisAlignmentHighlight(alignmentHighlightIn[key]);
      if (highlight) alignmentHighlightOut[key] = highlight;
    }
  }
  const hasAnyGapDeepDive = Object.keys(gapDeepDiveOut).length > 0;
  const hasAnyAlignmentHighlight = Object.keys(alignmentHighlightOut).length > 0;
  const hasAnyAxisInterpretation = hasAnyGapDeepDive || hasAnyAlignmentHighlight;

  // IA Batch 3 — shape validation only here; the minimum-evidence gate and
  // the defensive re-check both happen in runDeepEssenceStructuredLlm.ts,
  // which has access to the evidence packet this function doesn't.
  const adaptationStory = coerceAdaptationStory(obj.adaptation_story);

  // Batch 4 — Part 02 / Part 03 anti-copy observability check
  if (adaptationStory) {
    const storyNorm = normalizeForComparison(adaptationStory.narrative, locale);
    const synthNorm = normalizeForComparison(
      (layeredIdentityOut.synthesis as { narrative?: string } | undefined)?.narrative ?? "",
      locale,
    );
    if (synthNorm && similarityScore(storyNorm, synthNorm, locale) >= 0.7) {
      notes.push("adaptation_story_semantic_overlap_layered_synthesis");
    }
    for (const [axisKey, diveRaw] of Object.entries(gapDeepDiveOut)) {
      const dive = diveRaw as { natural_tendency?: string; current_pattern?: string; gives_you?: string; may_cost?: string };
      const diveText = normalizeForComparison(
        [dive.natural_tendency, dive.current_pattern, dive.gives_you, dive.may_cost].filter(Boolean).join(" "),
        locale,
      );
      if (diveText && similarityScore(storyNorm, diveText, locale) >= 0.7) {
        notes.push(`adaptation_story_semantic_overlap_gap_${axisKey}`);
      }
    }
  }

  return {
    value: {
      summary,
      radar_potential,
      strengths,
      watchouts,
      energy,
      ...(hasAnyLayer ? { layered_identity: layeredIdentityOut } : {}),
      ...(adaptationStory ? { adaptation_story: adaptationStory } : {}),
      ...(hasAnyAxisInterpretation
        ? {
            axis_interpretations: {
              ...(hasAnyGapDeepDive ? { gap_deep_dive: gapDeepDiveOut } : {}),
              ...(hasAnyAlignmentHighlight ? { alignment_highlight: alignmentHighlightOut } : {}),
            },
          }
        : {}),
    },
    notes,
  };
}

export function coerceDeepEssencePartB(raw: unknown): {
  value: Record<string, unknown>;
  notes: string[];
} {
  const notes: string[] = [];
  const obj = asRecord(raw) ?? {};
  const relIn = asRecord(obj.relationships) ?? {};
  // Part 03 Batch 1 — optional provenance, passed through only if the LLM
  // actually returned it (never fabricated, never required).
  const relationshipEvidenceRefs = asOptionalStringArray(relIn.evidence_refs);
  // Narrative Quality Singleton Batch 4 — this padding was previously
  // completely silent (no notes.push at all here, unlike strengths/watchouts
  // in Part A). The schema requires fit/friction to be exactly 3 items
  // (isFixedLenList), so true omission-on-shortfall isn't schema-safe
  // without a larger change; observability is the safe minimal fix here —
  // measure how often generic padding actually fires before considering a
  // schema change.
  if (!Array.isArray(relIn.fit) || relIn.fit.length !== 3) {
    notes.push(`relationships.fit_len_${Array.isArray(relIn.fit) ? relIn.fit.length : 0}`);
  }
  if (!Array.isArray(relIn.friction) || relIn.friction.length !== 3) {
    notes.push(`relationships.friction_len_${Array.isArray(relIn.friction) ? relIn.friction.length : 0}`);
  }
  const relationships = {
    pattern: asString(
      relIn.pattern,
      "You get closer carefully, then protect your pace.",
    ),
    fit: takeStrings(relIn.fit, 3, 3, "Someone who respects your pace"),
    friction: takeStrings(relIn.friction, 3, 3, "Rushing emotional closeness"),
    compare: takePairs(
      relIn.compare,
      3,
      3,
      (row) => ({
        wound: asString(row.wound, "When things feel uncertain"),
        steady: asString(row.steady, "Name the need in one sentence"),
      }),
      () => ({
        wound: "When things feel uncertain",
        steady: "Name the need in one sentence",
      }),
    ),
    ...(relationshipEvidenceRefs ? { evidence_refs: relationshipEvidenceRefs } : {}),
  };

  const pbIn = asRecord(obj.playbook) ?? {};
  // Part 04 Batch 1 — optional provenance, passed through only if the LLM
  // actually returned it (never fabricated, never required).
  const playbookEvidenceRefs = asOptionalStringArray(pbIn.evidence_refs);
  const playbook = {
    rule: asString(pbIn.rule, "Pause one beat, then speak."),
    rows: takePairs(
      pbIn.rows,
      3,
      3,
      (row) => ({
        situation: asString(row.situation, "When tension rises"),
        old: asString(row.old, "Push through or shut down"),
        better: asString(row.better, "Take ten minutes, then return"),
      }),
      () => ({
        situation: "When tension rises",
        old: "Push through or shut down",
        better: "Take ten minutes, then return",
      }),
    ),
    heated: asString(pbIn.heated, "If voices rise, call a short pause."),
    reset: asString(pbIn.reset, "Drink water, then restart with one clear ask."),
    ...(playbookEvidenceRefs ? { evidence_refs: playbookEvidenceRefs } : {}),
  };

  const futIn = asRecord(obj.future) ?? {};
  const futureEvidenceRefs = asOptionalStringArray(futIn.evidence_refs);

  const doItems = takePairs(
    futIn.do_items,
    3,
    3,
    (row, i) => ({
      title: asString(row.title, `DO ${i + 1}`),
      body: asString(row.body, "Keep doing what gives you energy."),
    }),
    () => ({ title: "DO", body: "Keep doing what gives you energy." }),
  );

  const dontItems = takePairs(
    futIn.dont_items,
    3,
    3,
    (row, i) => ({
      title: asString(row.title, `DON'T ${i + 1}`),
      body: asString(row.body, "Avoid overusing this pattern."),
    }),
    () => ({ title: "DON'T", body: "Avoid overusing this pattern." }),
  );

  const decisionRules = takeStrings(
    futIn.decision_rules,
    2,
    3,
    "Check your inner priority before deciding.",
  );

  const rememberFallbacks = [
    doItems[0]?.title ? `${doItems[0].title}: ${doItems[0].body}` : "Protect your recovery time",
    dontItems[0]?.title ? `${dontItems[0].title}: ${dontItems[0].body}` : "Loosen overused patterns",
    doItems[1]?.title ? `${doItems[1].title}: ${doItems[1].body}` : "Reclaim your inner compass",
  ];

  const remember = takeStrings(futIn.remember, 3, 3, rememberFallbacks[0]);
  if (!Array.isArray(futIn.remember) || futIn.remember.length !== 3) {
    for (let i = 0; i < 3; i++) {
      if (!remember[i] || remember[i].trim().length === 0) {
        remember[i] = rememberFallbacks[i] ?? "Protect your recovery time";
      }
    }
  }

  const leapFallback = decisionRules[0] ?? "Practice one small clear boundary this week.";
  const leap = asString(futIn.leap, leapFallback);

  const future = {
    remember,
    leap,
    do_items: doItems,
    dont_items: dontItems,
    decision_rules: decisionRules,
    ...(futureEvidenceRefs ? { evidence_refs: futureEvidenceRefs } : {}),
  };

  let checklist: string[] = [];
  if (Array.isArray(obj.checklist) && obj.checklist.length > 0) {
    const rawMove = asString(obj.checklist[0], "").trim();
    const isGenericJournaling =
      rawMove.includes("기억에 남는 순간") ||
      rawMove.includes("하루를 골라") ||
      rawMove.includes("일기를 작성") ||
      rawMove.includes("생각을 기록");

    const normPractice = rawMove.replace(/[\s.,!?]/g, "");
    const duplicatesDo = doItems.some((doItem) => {
      const normTitle = doItem.title.replace(/[\s.,!?]/g, "");
      return normPractice.includes(normTitle) || normTitle.includes(normPractice);
    });

    if (rawMove && !isGenericJournaling && !duplicatesDo) {
      checklist = [rawMove];
    }
  }

  return {
    value: {
      relationships,
      playbook,
      future,
      closing: asString(
        obj.closing,
        "You already have a workable compass — keep using it gently.",
      ),
      checklist,
    },
    notes,
  };
}
