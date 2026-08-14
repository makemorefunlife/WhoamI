/**
 * 유료 심화 리포트 — Part 01~05 + 부록 구조화 출력 프롬프트
 *
 * 기존 integratedPremiumReport.ts와 같은 입력(설문·Essence 분석·출생 에너지 맥락)을
 * 그대로 쓰되, 산문 대신 로버블(Lovable) "Inner Compass" 디자인이 요구하는
 * JSON 스키마로 응답을 받는다. 원래 산문 프롬프트가 두 단계(Phase1: Part0~2,
 * Phase2: Part3~5+부록)로 나뉘어 있던 것과 동일하게 두 번 호출한다
 * (한 번에 다 요청하면 응답이 길어 잘릴 위험이 커서).
 *
 * integratedPremiumReport.ts와 동일한 방식으로 프롬프트 본문은 영어로 쓰고,
 * 끝에 buildLlmOutputLocaleInstruction(locale)을 붙여 실제 응답 언어만 바꾼다
 * (en-US / ko-KR 둘 다 지원).
 */
import { PRIMARY_AXIS_LLM_GUIDE } from "@/lib/v2/framework/primaryAxisDefinitions";
import type { PrimaryAxisKey } from "@/lib/v2/survey/types";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { buildLlmOutputLocaleInstruction } from "@/lib/i18n/llmLocale";

const TONE_RULES = `[Tone]
Warm, affectionate, cool casual — easy essay tone, in second person ("you").
Avoid judgment, hard labels, prophecy; offer observed patterns gently.

[Banned]
- Psychology test names (MBTI, DISC, etc.); Saju/astrology technical dumps (special stars, Ten Gods, elemental jargon) explained like a textbook, or source callouts like "according to Saju"
- Empty summaries like "You are the kind of person who…"
- Any text outside the JSON object (no explanations, no markdown code fences, no greetings)`;

const SYSTEM_RULES = `You are a paid deep-report writer. Integrate survey (current behavior), Essence analysis (inner nature), and birth-energy context (consciousness / emotion / surface tone) into one coherent picture, and respond with JSON only.

${PRIMARY_AXIS_LLM_GUIDE}

${TONE_RULES}`;

export function getDeepEssenceStructuredSystemPrompt(locale?: Locale | string): string {
  const outputLocale = normalizeLocale(locale);
  return `${SYSTEM_RULES}

${buildLlmOutputLocaleInstruction(outputLocale)}`;
}

// ── Part A: summary · radar · strengths · watchouts · energy (matches old prose Part 0~2) ──

export const DEEP_ESSENCE_PART_A_SCHEMA = `{
  "summary": {
    "core_mode": "a short phrase compressing the core mode (2-4 words, e.g. Deep water)",
    "energy_balance": "energy spent on relationships / energy returning to you (e.g. 56 / 40)",
    "growth_edge": "a short phrase for the growth edge (1-3 words, e.g. Decisiveness)"
  },
  "radar_potential": {
    "autonomy": 0, "connection": 0, "stability": 0,
    "growth": 0, "structure": 0, "adaptability": 0
  },
  "strengths": [
    { "title": "strength title (1-3 words)", "body": "5-7 sentences with concrete situations and grounds" },
    { "title": "...", "body": "5-7 sentences" },
    { "title": "...", "body": "5-7 sentences" }
  ],
  "watchouts": [
    { "title": "watch-out title (1-3 words)", "body": "4-6 gentle sentences" },
    { "title": "...", "body": "4-6 sentences" },
    { "title": "...", "body": "4-6 sentences" }
  ],
  "energy": {
    "headline": "one sentence compressing the energy flow",
    "balance_pct": 0,
    "bars": [
      { "label": "Energy spent on people & relationships", "value": 0, "tone": "highlight" },
      { "label": "Energy returning to you", "value": 0, "tone": "accent" },
      { "label": "Solo recovery time", "value": 0, "tone": "ink" }
    ],
    "summary": "6-10 sentences interpreting the gauge",
    "fuels": ["thing that energizes 1", "thing 2", "thing 3"],
    "drains": ["thing that drains 1", "thing 2", "thing 3"],
    "optimal": ["fitting environment 1", "fitting environment 2"]
  }
}`;

// ── Batch 3: additive Core Mode / Growth Edge grounding ──────────────────
// Only appended when Part01 Identity Evidence is provided. Absent/null
// input.part01Evidence must reproduce the exact pre-Batch-3 prompt string —
// this is how "existing prompt behavior when packet is null" is guaranteed,
// not just documented.

const GROUNDING_SUMMARY_FIELDS = `,
    "core_mode_evidence_refs": ["exact keys from [Core Mode evidence] you grounded core_mode in — 1-4 keys, only from the bracketed list, never invented — omit this field entirely if you cannot ground it"],
    "growth_edge_evidence_refs": ["exact keys from [Growth Edge evidence] you grounded growth_edge in — 1-4 keys, only from the bracketed list, never invented — omit this field entirely if you cannot ground it"],
    "growth_edge_why": "optional, 1-2 sentences: why this is the highest-leverage area right now, grounded in more than one evidence signal",
    "growth_edge_real_life_pattern": "optional, 1-2 sentences: how this shows up in daily situations",
    "growth_edge_if_developed": "optional, 1-2 sentences: what becomes possible if this is developed"`;

// ── Batch 4: additive Layered Identity grounding ──────────────────────────
// Same additive/grounded-only contract as Batch 3. Each of the 4 layers is
// independently optional in the schema — a layer with too-thin evidence
// must be omitted entirely, never padded.

const LAYERED_IDENTITY_SCHEMA_FIELD = `,
  "layered_identity": {
    "first_impression": { "title": "optional short label (1-3 words)", "narrative": "optional, 3-5 sentences: how you tend to land on people who just met you", "evidence_refs": ["exact keys from [First Impression evidence] you grounded this in — omit the whole first_impression layer if the evidence is too thin"] },
    "known_self": { "title": "optional short label (1-3 words)", "narrative": "optional, 3-5 sentences: how you show up once someone has gotten to know you a bit", "evidence_refs": ["exact keys from [Known Self evidence] — omit the whole known_self layer if the evidence is too thin"] },
    "close_private_self": { "title": "optional short label (1-3 words)", "narrative": "optional, 3-5 sentences: how you are with the people closest to you, in private", "evidence_refs": ["exact keys from [Close Private Self evidence] — omit the whole close_private_self layer if the evidence is too thin"] },
    "natural_self_and_deep_needs": { "title": "optional short label (1-3 words)", "narrative": "optional, 3-5 sentences: your most natural, unguarded self and what you deeply need", "evidence_refs": ["exact keys from [Natural Self & Deep Needs evidence] — omit the whole natural_self_and_deep_needs layer if the evidence is too thin"] }
  }`;

// ── Batch 6: additive Strengths/Watchouts grounding ───────────────────────
// Same additive/grounded-only contract. Per-item evidence_refs, only shown
// on the first array item in the schema example (items 2/3 stay "..." like
// the existing title/body abbreviation) — the rule applies to every item.

const STRENGTHS_EVIDENCE_FIELD = `, "evidence_refs": ["optional — exact keys from [Strengths & Watchouts evidence] this item is grounded in, only from the bracketed list, never invented — omit if this item isn't well-grounded"]`;

// ── Batch 8: replaces Batch 7's "all 6 axes, same depth" axis
// interpretation. Only the deterministically-selected gap axes (top 2-3
// widest, magnitude "wide") and the single best-aligned axis get a
// deep-dive at all — the schema fragment below is built dynamically since
// which axis keys appear varies per user. Static per-axis "meaning" is
// gone from the LLM schema entirely (that's pure UI glossary copy now).

type AxisHighlightForSchema = { axis: PrimaryAxisKey };

const GAP_DEEP_DIVE_FIELD = `{ "natural_tendency": "1-2 sentences (3 max) — what comes more naturally / the innate tendency on this axis, grounded ONLY in [Innate Self evidence]", "current_pattern": "1-2 sentences (3 max) — how the person actually operates on this axis today, grounded ONLY in that axis's own Current Self evidence + general survey material; MUST follow the axis's Direction fact exactly, never contradict it", "gives_you": "1 sentence — a plausible, evidence-consistent benefit this current pattern gives them (e.g. it may be an adaptation, a learned/developed strength, a response to role demands, or a protective pattern) — never asserted as the one confirmed cause; use conditional language if the evidence for it is thin", "may_cost": "1 sentence — a plausible energy cost, friction, or fatigue this pattern may carry — never framed as a flaw, mistake, or problem with the person, just a cost", "may_work_better": "optional, 1 sentence — only include if you have a genuinely evidence-grounded suggestion for using this pattern more comfortably; omit the field entirely otherwise", "current_evidence_refs": ["optional — exact keys from this axis's own Current Self evidence, never invented, never another axis's key"], "innate_evidence_refs": ["optional — exact keys from the shared Innate Self evidence, never invented"] }`;
const ALIGNMENT_HIGHLIGHT_FIELD = `{ "natural_tendency": "1-2 sentences — what comes more naturally on this axis, grounded ONLY in [Innate Self evidence]", "current_pattern": "1-2 sentences — how the person operates on this axis today, grounded ONLY in that axis's own Current Self evidence + general survey material", "why_it_feels_easy": "1-2 sentences — why current and innate line up here, and why this trait can be used with comparatively little energy; treat this as a genuine, positive insight, not a null result", "current_evidence_refs": ["optional — exact keys from this axis's own Current Self evidence, never invented"], "innate_evidence_refs": ["optional — exact keys from the shared Innate Self evidence, never invented"] }`;

function buildAxisInterpretationSchemaField(
  gaps: AxisHighlightForSchema[],
  alignment: AxisHighlightForSchema | null,
): string {
  if (gaps.length === 0 && !alignment) return "";
  const sections: string[] = [];
  if (gaps.length) {
    const entries = gaps.map((g) => `    "${g.axis}": ${GAP_DEEP_DIVE_FIELD}`).join(",\n");
    sections.push(`  "gap_deep_dive": {\n${entries}\n  }`);
  }
  if (alignment) {
    sections.push(
      `  "alignment_highlight": {\n    "${alignment.axis}": ${ALIGNMENT_HIGHLIGHT_FIELD}\n  }`,
    );
  }
  return `,\n  "axis_interpretations": {\n${sections.join(",\n")}\n  }`;
}

function buildPartASchema(part01Evidence: Part01EvidenceForPartAPrompt | null | undefined): string {
  if (!part01Evidence) return DEEP_ESSENCE_PART_A_SCHEMA;
  const withSummaryFields = DEEP_ESSENCE_PART_A_SCHEMA.replace(
    `"growth_edge": "a short phrase for the growth edge (1-3 words, e.g. Decisiveness)"`,
    `"growth_edge": "a short phrase for the growth edge (1-3 words, e.g. Decisiveness)"${GROUNDING_SUMMARY_FIELDS}`,
  )
    .replace(
      `{ "title": "strength title (1-3 words)", "body": "5-7 sentences with concrete situations and grounds" }`,
      `{ "title": "strength title (1-3 words)", "body": "5-7 sentences with concrete situations and grounds"${STRENGTHS_EVIDENCE_FIELD} }`,
    )
    .replace(
      `{ "title": "watch-out title (1-3 words)", "body": "4-6 gentle sentences" }`,
      `{ "title": "watch-out title (1-3 words)", "body": "4-6 gentle sentences"${STRENGTHS_EVIDENCE_FIELD} }`,
    );
  const axisField = buildAxisInterpretationSchemaField(
    part01Evidence.axisInterpretation.gaps,
    part01Evidence.axisInterpretation.alignment,
  );
  // Insert as new top-level keys right after the "energy" block closes,
  // before the schema object's own closing brace.
  return withSummaryFields.replace(
    /\n(\}\s*)$/,
    `${LAYERED_IDENTITY_SCHEMA_FIELD}${axisField}\n$1`,
  );
}

export type Part01EvidenceForPartAPrompt = {
  coreModeText: string;
  growthEdgeText: string;
  layeredIdentity: {
    firstImpressionText: string;
    knownSelfText: string;
    closePrivateSelfText: string;
    naturalSelfAndDeepNeedsText: string;
  };
  strengthsWatchoutsText: string;
  axisInterpretation: {
    innateEvidenceText: string;
    gaps: Array<{ axis: PrimaryAxisKey; subjectText: string; currentText: string }>;
    alignment: { axis: PrimaryAxisKey; subjectText: string; currentText: string } | null;
  };
};

export function buildDeepEssenceStructuredPartAUserPrompt(input: {
  surveyAnalysis: string;
  essenceAnalysisSummary: string;
  birthEnergyContext: string;
  currentAxisScores: Record<string, number>;
  locale?: Locale | string;
  /** Batch 3 — optional. Omit/null to reproduce the exact pre-Batch-3 prompt. */
  part01Evidence?: Part01EvidenceForPartAPrompt | null;
}): string {
  const outputLocale = normalizeLocale(input.locale);
  const grounded = Boolean(input.part01Evidence);

  const axisSections = input.part01Evidence
    ? [
        ...input.part01Evidence.axisInterpretation.gaps.map(
          (g) => `[Axis Gap: ${g.axis}]\n${g.subjectText}\nCurrent Self evidence:\n${g.currentText}`,
        ),
        ...(input.part01Evidence.axisInterpretation.alignment
          ? [
              (() => {
                const a = input.part01Evidence!.axisInterpretation.alignment!;
                return `[Axis Alignment: ${a.axis}]\n${a.subjectText}\nCurrent Self evidence:\n${a.currentText}`;
              })(),
            ]
          : []),
      ].join("\n\n")
    : "";

  const evidenceBlock = input.part01Evidence
    ? `
■ Part01 Identity Evidence — grounding material only (internal keys in brackets; never quote raw keys/codes to the reader). Use ONLY to decide core_mode / growth_edge / layered_identity / strengths / watchouts / axis_interpretations and to fill their optional evidence_refs.
[Core Mode evidence]
${input.part01Evidence.coreModeText}

[Growth Edge evidence]
${input.part01Evidence.growthEdgeText}

[Strengths & Watchouts evidence]
${input.part01Evidence.strengthsWatchoutsText}

[First Impression evidence]
${input.part01Evidence.layeredIdentity.firstImpressionText}

[Known Self evidence]
${input.part01Evidence.layeredIdentity.knownSelfText}

[Close Private Self evidence]
${input.part01Evidence.layeredIdentity.closePrivateSelfText}

[Natural Self & Deep Needs evidence]
${input.part01Evidence.layeredIdentity.naturalSelfAndDeepNeedsText}

[Innate Self evidence — shared across every axis_interpretations entry below, Personal CE / Saju only]
${input.part01Evidence.axisInterpretation.innateEvidenceText}

${axisSections}
`
    : "";

  const groundingRules = grounded
    ? `
- CROSS-SECTION RULE (read first, applies to every section below): reusing the same evidence in multiple sections is fine — the same fact can support different meanings in different places. What you must NOT do is restate the same conclusion/insight more than once under a different label. Before writing each section, check what the other sections in this same response already concluded, and make sure you are answering that section's own distinct question, not re-narrating something already said elsewhere.
- axis_interpretations (gap_deep_dive / alignment_highlight) is the FIRST, PRIMARY owner of "how this axis's natural tendency differs from how it's used today, and what that trade-off costs/gives." Every other section below must build on top of that, not restate it.
- core_mode is a compressed whole-person metaphor ONLY (2-4 words) — it must never re-explain or summarize the detailed traits already covered in axis_interpretations, layered_identity, strengths, or watchouts. It compresses the whole picture into an image; it does not narrate. Ground it in MULTIPLE signals from [Core Mode evidence] — never a single axis, element, ten-god, or dimension alone. List the exact bracketed keys you used in core_mode_evidence_refs; never invent a key that isn't in the list.
- growth_edge answers a genuinely different question than gap_deep_dive: not "what is the natural-vs-current difference" (that's Gap's job) but "which of everything you know about this person is the highest-leverage thing to act on right now, and what changes if they do." growth_edge MAY select the same axis as one of the gap_deep_dive entries — that's allowed — but if it does, growth_edge_why/growth_edge_real_life_pattern/growth_edge_if_developed must NOT repeat that axis's natural_tendency/current_pattern/gives_you/may_cost content; they must add a genuinely new angle (why now, what to do differently, what becomes possible) or be omitted. Ground growth_edge in MULTIPLE signals from [Growth Edge evidence] — do not simply pick the widest current/innate gap, weigh it together with dimension confidence, mixed-state flags, and repeated friction/cost signals. List the exact bracketed keys you used in growth_edge_evidence_refs; never invent one. growth_edge_why/growth_edge_real_life_pattern/growth_edge_if_developed are optional — include only when genuinely grounded and non-repetitive.
- layered_identity answers ONLY its own relational-depth question per layer — first_impression (from [First Impression evidence] only): how you land on someone new; known_self (from [Known Self evidence] only): how you show up once someone knows you a bit; close_private_self (from [Close Private Self evidence] only): how you are with people closest to you; natural_self_and_deep_needs (from [Natural Self & Deep Needs evidence] only): your most natural self and deepest needs. Each layer's evidence_refs may ONLY reference keys from that layer's own bracketed list — never borrow a key from another layer's list or from Core Mode/Growth Edge evidence. There is no single fixed formula (e.g. month pillar = first impression) — weigh the whole bucket, including confidence and mixed-state flags, and let convergence across multiple signals decide. OMIT a layer entirely — do not force all 4 — if either its bucket has too little usable signal, OR if the honest answer to that layer's own question would just restate a conclusion already given in axis_interpretations or growth_edge. Never invent an evidence key.
- You still freely choose the 3 strengths and 3 watchouts exactly as before (same title/body voice and structure) — [Strengths & Watchouts evidence] only informs which ones you pick and how you ground them, it does not replace your own judgment or restrict you to a fixed candidate list. Prefer a strength/watchout whose trait is NOT already the central point of an axis_interpretations or growth_edge entry — pick another well-evidenced candidate first when one exists. It's fine to circle back to a trait axis_interpretations/growth_edge already touched only if you have a genuinely distinct strength-vs-shadow angle to add (not a reworded restatement of the same point). Never decide a strength or watchout from a single five-element/ten-god/psych-axis signal alone — look for convergence across the evidence. Strengths and watchouts may be selected fully independently of each other, but if the same underlying trait clearly has both a positive and a shadow side, feel free to let a strength and a watchout each reference it (never force a 1:1 pairing when one doesn't genuinely exist). Each item's evidence_refs may only reference keys from the bracketed [Strengths & Watchouts evidence] list, and may be omitted per item when not well-grounded. Never invent a key.
- axis_interpretations covers ONLY the axis keys shown to you under [Axis Gap: <name>] / [Axis Alignment: <name>] below — never add an axis that wasn't given to you, never omit one that was.
- For every gap_deep_dive entry, follow this exact 4-part order and role for each field, and respect the axis's own "Direction fact" line exactly (never contradict it — if it says Current is higher, natural_tendency must describe something genuinely different from current_pattern, not a restatement of the same trait; likewise if Innate is higher):
  1. natural_tendency — what comes more naturally / the innate tendency, grounded ONLY in [Innate Self evidence].
  2. current_pattern — how the person actually operates on this axis today, grounded ONLY in that axis's own "Current Self evidence" plus the general survey material — never Innate/Saju facts.
  3. gives_you — a plausible, real-life benefit the current pattern provides (e.g. it may function as an adaptation, a learned/developed strength, a response to role demands, or a protective pattern) — never assert which cause it is without evidence; use conditional language ("may", "can look like") when you're not certain.
  4. may_cost — a plausible energy cost, friction, or fatigue this pattern may carry.
  may_work_better is optional — include only with a genuinely evidence-grounded, comfort-improving suggestion.
  Never frame the gap itself as a flaw, mistake, or something wrong with the person — it is one of adaptation / learned strength / role demand / protective pattern / energy cost, not a defect. current_pattern is a real, valid way this person operates today, not a lesser or "less true" version of them.
- For alignment_highlight, use the same natural_tendency/current_pattern framing, then why_it_feels_easy explaining why the two line up and this trait can be used with comparatively little energy — treat this as a genuine, positive insight, not a throwaway line.
- Never use fatalistic identity language. In English, avoid phrases like "True Self", "who you really are", "your real self" — prefer natural tendencies / what comes more naturally / how you operate today / where you've adapted / where the two align. In Korean, avoid "진짜 나" — prefer 본래의 경향 / 자연스러운 성향 / 지금 사용하는 방식 / 적응해온 방식.
- Never translate raw current/innate/delta numbers into prose — describe concrete, real-life behavior and situations instead. Never let a single five-element/ten-god/psych-axis signal alone decide any field — look for convergence, and use conditional language when confidence is low or evidence is mixed. current_evidence_refs may only reference that exact axis's own bracketed Current Self keys (never another axis's); innate_evidence_refs only the shared Innate Self pool's keys. Both optional; never invent a key.`
    : "";

  return `[Input data — use only this material]
■ Survey (current behavior patterns)
${input.surveyAnalysis}

■ Essence analysis (inner nature, incl. special stars; translate jargon to everyday language)
${input.essenceAnalysisSummary}

■ Birth-energy context (consciousness / emotion / surface tone — everyday language only)
${input.birthEnergyContext}

■ Survey-scored "current" axis scores (0-100). radar_potential must be >= these values (it represents innate potential, so it should read equal or higher).
${JSON.stringify(input.currentAxisScores)}
${evidenceBlock}
[Output rules]
- Respond with the exact same key structure as the schema below. Do not add extra keys.
- strengths, watchouts, and energy.bars must have exactly 3 items each. energy.fuels/drains need 3-5 items, optimal needs 2-4.
- energy.bars values are integers 0-100 (keep the order: relational spend, self return, solo time).
- energy.balance_pct must equal bars[1].value (energy returning to you).${groundingRules}

JSON schema:
${buildPartASchema(input.part01Evidence)}

Respond with exactly one JSON object matching the schema above.

${buildLlmOutputLocaleInstruction(outputLocale)}`;
}

// ── Part B: relationships · playbook · future · checklist (matches old prose Part 3~5 + appendix) ──

export const DEEP_ESSENCE_PART_B_SCHEMA = `{
  "relationships": {
    "pattern": "recurring relational pattern, 10-16 sentences",
    "fit": ["trait of people who feel easy 1", "trait 2", "trait 3"],
    "friction": ["trait of people who feel hard 1", "trait 2", "trait 3"],
    "compare": [
      { "wound": "a phrase that tends to wound", "steady": "a phrase that steadies instead" },
      { "wound": "...", "steady": "..." },
      { "wound": "...", "steady": "..." }
    ]
  },
  "playbook": {
    "rule": "core principle, one paragraph (3-6 sentences)",
    "rows": [
      { "situation": "situation", "old": "old response", "better": "recommended response" },
      { "situation": "...", "old": "...", "better": "..." },
      { "situation": "...", "old": "...", "better": "..." }
    ],
    "heated": "rule for when emotions spike, 3-5 sentences",
    "reset": "weekly reset routine, 3-5 sentences"
  },
  "future": {
    "remember": ["thing worth remembering 1 (4-7 sentences)", "2", "3"],
    "leap": "direction for the next step, 3-5 sentences"
  },
  "closing": "one warm closing paragraph (6-12 sentences)",
  "checklist": ["today's action checklist item 1", "item 2", "... (8-12 items, one action per line)"]
}`;

export function buildDeepEssenceStructuredPartBUserPrompt(input: {
  surveyAnalysis: string;
  essenceAnalysisSummary: string;
  birthEnergyContext: string;
  partAExcerpt: string;
  locale?: Locale | string;
}): string {
  const outputLocale = normalizeLocale(input.locale);
  return `[Input data — same material]
■ Survey
${input.surveyAnalysis}

■ Essence analysis (incl. special stars)
${input.essenceAnalysisSummary}

■ Birth-energy context
${input.birthEnergyContext}

[Already written earlier — keep the same tone and persona]
${input.partAExcerpt}

[Output rules]
- Respond with the exact same key structure as the schema below. Do not add extra keys.
- relationships.fit/friction need exactly 3 items each. relationships.compare, playbook.rows, and future.remember need exactly 3 items each.
- checklist needs 8-12 items.
- Continue without contradicting the earlier strengths/watchouts/energy content.

JSON schema:
${DEEP_ESSENCE_PART_B_SCHEMA}

Respond with exactly one JSON object matching the schema above.

${buildLlmOutputLocaleInstruction(outputLocale)}`;
}
