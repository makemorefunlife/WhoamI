/**
 * Variant B / C prompts — Batch III synthesis + Batch IV package gates + Batch V voice.
 */
import type { WorkPilotContextPackage } from "./types";
import { WORK_NARRATIVE_SECTION_IDS } from "./types";
import {
  buildLocaleVoiceBlock,
  VOICE_POLICY_VERSION,
  type PilotNarrativeLocale,
} from "./voicePolicy";

const SECTION_OWNERSHIP_C = `
## Section ownership (one primary insight each)

1. pair_snapshot — ONE climate pattern. No leadership_split. Not a report summary.
2. individual_work_styles — Each person's work mode and motive. Correct nickname ownership. No leadership_split.
3. communication_and_reporting — Reporting / feedback / misread speech only. No role-split restatement.
4. decision_and_execution_dynamics — ONLY home for leadership_split (external present vs internal QA). Explain WHY the split fits; if confidence=low or align=caution, keep it provisional.
5. trust_recognition_and_hidden_tension — Trust conditions + quiet friction. Connect psych with saju or work_signals.
6. stress_loop — Distortion under pressure. Distinct from trust. No prescriptions.
7. practical_prescriptions — Pair-specific executable rules only. Do not restate prior insights.

Same core insight across sections: at most once in the whole report.
Ban repeating "direction first / detail later" (any wording) in more than one section.
`.trim();

function categoryHint(category: string): string {
  switch (category) {
    case "similar":
      return "similar: psych alike + saju tension — explain friction INSIDE similarity; never invent fast-vs-detail; leadership provisional if low/caution.";
    case "highly_different":
      return "highly_different: center structure/practicality/recognition gaps as real work collisions — not soft complementarity.";
    case "complementary":
      return "complementary: pair_snapshot = climate only (NO external/QA/leadership words). Leadership ONLY in decision_and_execution_dynamics. Explain why split works via psych/work_signals; never invert ten_god stronger_side. contrast_supported may be true for reporting FORMAT only — never 빠른vs꼼꼼.";
    case "conflict_heavy":
      return "conflict_heavy: same-mode clash (both-high recognition/conflict_style, low self_control). Forbid invented fast-vs-detail. Show why similarity fuels conflict.";
    default:
      return "";
  }
}

function jsonSchemaHint(): string {
  const sectionKeys = WORK_NARRATIVE_SECTION_IDS.map(
    (id) =>
      `    "${id}": { "title": "string", "body": "string (2-4 short paragraphs)", "new_insight": "string — one scene/misread/stress distortion not copied from reference_copy", "sources_used": ["family1","family2"] }`,
  ).join(",\n");
  return `{
  "sections": {
${sectionKeys}
  },
  "meta": {
    "pair_specificity_notes": "string",
    "excerpt_avoidance_notes": "string — confirm reference_copy was not used as narrative source",
    "source_families_used": ["string"],
    "conflicts_handled": ["string"]
  }
}`;
}

export function buildVariantCSystemPrompt(locale: string): string {
  return [
    "You are a workplace partnership analyst. Output one valid JSON object only.",
    `Write all prose in locale ${locale}.`,
    "",
    "## Core mission",
    "Do NOT rewrite server prose. Connect ≥2 source families into a NEW workplace insight per section.",
    "Bad: restate an excerpt with synonyms. Bad: list scores/roles.",
    "Good: show a meeting/handoff/deadline scene where the combination creates a specific dynamic.",
    "",
    "## Package reading order (Batch IV)",
    "1) binding_truth  2) psych_context.pair_patterns + meaningful_gaps  3) evidence_relationships",
    "4) evidence_sources.structured_evidence / communication_signals / dna_signals / work_signals / ten_god",
    "5) saju_context  6) ambiguities",
    "reference_copy.allowed_as_narrative_source is false — fact-check only; never copy its sentence structure, contrasts, metaphors, or prescriptions.",
    "If communication_signals.contrast_supported is false, inventing any style contrast is a hard failure.",
    "stock_fast_vs_detail_allowed is ALWAYS false — never write 빠른 vs 꼼꼼 / 직관 vs 세부 / direction-first vs detail-later stock contrast, even when contrast_supported is true.",
    "When contrast_supported is true, interpret only communication_signals.contrast_means (reporting FORMAT labels).",
    "Nicknames: use narrative_routing.identity nicknames EXACTLY (Kim stays Kim — never 김/이 localization).",
    "Leadership words (external / QA / 외부 / 내부 품질) only in decision_and_execution_dynamics per narrative_routing.",
    "",
    "## New insight requirement",
    "Each section.body must include at least one interpretation that is not already written in reference_copy:",
    "how it shows up at work / why conflict repeats / stress distortion / complementarity mechanism / when strength becomes weakness / likely misread.",
    "Populate section.new_insight with that claim in one sentence.",
    "",
    "## Deterministic excerpts (strict)",
    "excerpts are secondary hints only. Forbidden: reuse their sentence skeleton, synonym rewrite, or spread the same excerpt idea across sections.",
    "If your sentence would still work after swapping nicknames to another pair, it is too generic — rewrite from this pair's loud evidence.",
    "Especially never echo: '한쪽은 빠른 결론, 다른 쪽은 꼼꼼한 검토' / '오늘은 방향만 / 내일은 디테일' — stock_fast_vs_detail_allowed=false.",
    "",
    "## Identity",
    "A = binding_truth.ab_identity.nickname_a; B = nickname_b. Spell them exactly.",
    "Attribute only using that side's psych score_*/dna_signals/work_signals_*/ten_gods_* / stronger_side.",
    "Never swap traits between nicknames.",
    "",
    "## Canonical boundary",
    "binding_truth bands and leadership_split are frozen. Do not reverse or reclassify.",
    "Canonical is a fence, not the topic of every section. Leadership belongs only in decision_and_execution_dynamics.",
    "If confidence=low or align=caution OR narrative_routing.leadership_split.provisional=true: provisional wording — ko: '현재 신호상 … 자연스럽다 / 상황에 따라 바뀔 수 있다'; en: 'current signals suggest … / this may shift' — never permanent title assignment.",
    "",
    "## Loud evidence",
    "Prefer pair_patterns with priority=high, evidence_relationships, large gaps, both_high/similar_high, both_low, clash flags, strong complements.",
    "Translate numbers into behavior — do not paste raw scores as the insight.",
    "Similar people colliding → same-drive clash (status, recognition, stubbornness), NOT invented opposite styles.",
    "If recognition appears as priority=high, both_high/similar_high, high_gap, or narrative_relevance=same_drive_clash / work_collision_gap: use it meaningfully in trust_recognition_and_hidden_tension and/or pair_snapshot or stress_loop. Do not force recognition into unrelated fixtures.",
    "",
    "## Soft invented contrast (hard ban)",
    "Only contrast what evidence explicitly supports (pair_patterns, communication_signals, ten_god stronger_side, work_signals).",
    "If evidence says A is structured, do NOT invent 'B dislikes structure' unless B's signals show that.",
    "If contrast_supported=false, do not create style opposites at all.",
    "Never upgrade leadership into speed-vs-detail (빠른/꼼꼼) storytelling.",
    "",
    "## Confidence-aware wording",
    "Match claim strength to confidence. low/caution/provisional → hedging required in THAT sentence.",
    "Forbidden when provisional: 'naturally leads', '항상 … 담당한다', permanent role titles.",
    "Required shape when provisional — ko: '현재 신호상 … 쪽에 가깝습니다 / 상황에 따라 바뀔 수 있습니다'; en: 'Current signals suggest … is somewhat more likely … / this may shift'.",
    "",
    "## Internal consistency",
    "pair_snapshot climate, later patterns, and practical_prescriptions must agree.",
    "Advice must not deny the snapshot conflict/friction; it may only manage it.",
    "",
    "## Complement direction",
    "ten_god_complement.stronger_side = giver. Do not invert giver/beneficiary.",
    "Unsupported labels (자원 관리, 기획과 표현, 번아웃, 정치 감각…) require ≥2 supporting sources or omit.",
    "",
    SECTION_OWNERSHIP_C,
  ].join("\n");
}

/** Batch V: synthesis + package gates + locale voice adapter. */
export function buildVariantCVoiceSystemPrompt(
  locale: PilotNarrativeLocale,
): string {
  return [
    buildVariantCSystemPrompt(locale),
    "",
    `## Narrative voice (${VOICE_POLICY_VERSION})`,
    buildLocaleVoiceBlock(locale),
  ].join("\n");
}

export function buildVariantBSystemPrompt(locale: string): string {
  return [
    "You are a workplace partnership analyst. Output one valid JSON object only.",
    `Write all prose in locale ${locale}.`,
    "Synthesize ≥2 source families into new workplace scenes. Do not use reference_copy as narrative source.",
    "Bind traits to the correct nickname. Do not invent contrasts when communication_signals.contrast_supported is false.",
    "Leadership talk only in decision_and_execution_dynamics if mentioned.",
    SECTION_OWNERSHIP_C,
  ].join("\n\n");
}

export function buildVariantUserPrompt(
  pkg: WorkPilotContextPackage,
  opts?: { outputLocale?: PilotNarrativeLocale },
): string {
  const lines = [
    `Pair: ${pkg.pair_id} (${pkg.category})`,
    `Variant: ${pkg.variant}`,
    `schema: ${pkg.schema_version}`,
  ];
  if (opts?.outputLocale) {
    lines.push(
      `output_locale: ${opts.outputLocale}`,
      `voice_policy_version: ${VOICE_POLICY_VERSION}`,
      "Use the SAME binding_truth and evidence as other locales — change delivery only.",
    );
  }
  lines.push("");

  if (pkg.variant === "C" && pkg.binding_truth) {
    const bt = pkg.binding_truth;
    const id = bt.ab_identity;
    const lead = bt.leadership_split;
    const patterns = pkg.psych_context.pair_patterns ?? [];
    const bothHigh = patterns
      .filter(
        (p) => p.pattern === "both_high" || p.pattern === "similar_high",
      )
      .slice(0, 6)
      .map((p) => `${p.axis_key}(${p.pattern})`);
    const bothLow = patterns
      .filter((p) => p.pattern === "both_low" || p.pattern === "similar_low")
      .slice(0, 6)
      .map((p) => `${p.axis_key}(${p.pattern})`);
    const highGaps = patterns
      .filter((p) => p.pattern === "high_gap")
      .slice(0, 6)
      .map((p) => `${p.axis_key}(Δ${p.gap})`);
    const recognitionLoud = patterns
      .filter(
        (p) =>
          p.axis_key === "recognition" &&
          (p.priority === "high" ||
            p.pattern === "both_high" ||
            p.pattern === "similar_high" ||
            p.pattern === "high_gap" ||
            p.narrative_relevance === "same_drive_clash" ||
            p.narrative_relevance === "work_collision_gap"),
      )
      .map(
        (p) =>
          `${p.pattern}${p.narrative_relevance ? `/${p.narrative_relevance}` : ""}`,
      );
    const comm = pkg.evidence_sources.communication_signals;
    const rel = (pkg.evidence_relationships ?? [])
      .slice(0, 4)
      .map((r) => `${r.relationship}:${r.interpretation_prompt}`)
      .join(" || ");
    const provisional =
      pkg.narrative_routing?.leadership_split?.provisional === true ||
      lead?.confidence === "low" ||
      lead?.align === "caution";

    lines.push(
      "## Preflight — obey before writing",
      `A=${id.nickname_a} | B=${id.nickname_b}`,
      categoryHint(pkg.category),
      lead
        ? `leadership_split: external=${lead.external_lead} internal_qa=${lead.internal_qa_lead} confidence=${lead.confidence ?? "n/a"} align=${lead.align ?? "n/a"}`
        : "leadership_split: null",
      provisional
        ? "CONFIDENCE: provisional=true — use hedging in decision_and_execution_dynamics; never permanent titles."
        : "CONFIDENCE: leadership may be stated firmly only if not provisional.",
      `communication contrast_supported=${comm?.contrast_supported ?? false} (a=${comm?.a.reporting_preference}, b=${comm?.b.reporting_preference})`,
      `stock_fast_vs_detail_allowed=${comm?.stock_fast_vs_detail_allowed ?? false}`,
      comm?.contrast_means
        ? `contrast_means: ${comm.contrast_means}`
        : "contrast_means: (none)",
      pkg.narrative_routing?.leadership_split
        ? `leadership home=${pkg.narrative_routing.leadership_split.home_section} provisional=${pkg.narrative_routing.leadership_split.provisional} — forbidden elsewhere`
        : "leadership routing: null",
      `exact nicknames: ${pkg.narrative_routing?.identity.nickname_a ?? id.nickname_a} / ${pkg.narrative_routing?.identity.nickname_b ?? id.nickname_b} (do not localize)`,
      `pair_patterns high-gap: ${highGaps.join(", ") || "(none)"}`,
      `pair_patterns both-high: ${bothHigh.join(", ") || "(none)"}`,
      `pair_patterns both-low: ${bothLow.join(", ") || "(none)"}`,
      recognitionLoud.length > 0
        ? `recognition LOUD — must use meaningfully: ${recognitionLoud.join(", ")}`
        : "recognition LOUD: (none) — do not force recognition.",
      `evidence_relationships: ${rel || "(none)"}`,
      `ambiguities: ${pkg.ambiguities.slice(0, 5).join(" | ") || "(none)"}`,
      "reference_copy.allowed_as_narrative_source=false — do not paraphrase those items.",
      "Forbidden stock contrast ALWAYS: fast-vs-detail / 빠른 결론 vs 꼼꼼 검토 (stock_fast_vs_detail_allowed=false).",
      "Do not invent opposite traits for the other person from one-sided evidence.",
      "practical_prescriptions must manage (not deny) the snapshot climate.",
      "",
    );
  }

  lines.push(
    "CONTEXT PACKAGE (JSON):",
    JSON.stringify(packageForLlmPrompt(pkg), null, 2),
    "",
    "Return JSON matching this shape:",
    jsonSchemaHint(),
  );
  return lines.join("\n");
}

/**
 * Keep reference_copy keys for audit, but withhold finished deterministic prose
 * from the LLM payload (Batch IV: isolation must be effective, not schema-only).
 */
export function packageForLlmPrompt(
  pkg: WorkPilotContextPackage,
): WorkPilotContextPackage & {
  reference_copy: WorkPilotContextPackage["reference_copy"] & {
    items_withheld: true;
    note: string;
  };
} {
  return {
    ...pkg,
    reference_copy: {
      allowed_for_fact_check: pkg.reference_copy.allowed_for_fact_check,
      allowed_as_narrative_source: false,
      items: pkg.reference_copy.items.map((i) => ({
        key: i.key,
        text: "[withheld]",
      })),
      items_withheld: true,
      note: "Deterministic report prose withheld — do not invent contrasts from memory of typical office copy.",
    },
  };
}

export const PROMPT_CONTRACT_MARKERS = {
  newInsight: "NEW workplace insight",
  noRewriteExcerpts: "Do NOT rewrite server prose",
  referenceCopyBan: "reference_copy.allowed_as_narrative_source is false",
  contrastGate: "communication_signals.contrast_supported is false",
  forbidFastDetail: "stock_fast_vs_detail_allowed is ALWAYS false",
  identityBinding: "Never swap traits between nicknames",
  leadershipOnlyInDecision: "ONLY home for leadership_split",
  confidenceFlex: "상황에 따라 바뀔 수 있다",
  sameModeClash: "same-drive clash",
  complementDirection: "stronger_side = giver",
  softInventedBan: "Soft invented contrast (hard ban)",
  confidenceAware: "Confidence-aware wording",
  recognitionLoud: "If recognition appears as priority=high",
  internalConsistency: "practical_prescriptions must agree",
} as const;
