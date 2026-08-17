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
    "growth_edge_real_life_pattern": "optional, 1-2 sentences: a concrete, specific next step to try differently, starting now — NOT a description of how the pattern currently shows up (that is Gap's job, never repeat it here)",
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
    "natural_self_and_deep_needs": { "title": "optional short label (1-3 words)", "narrative": "optional, 3-5 sentences: your most natural, unguarded self and what you deeply need", "evidence_refs": ["exact keys from [Natural Self & Deep Needs evidence] — omit the whole natural_self_and_deep_needs layer if the evidence is too thin"] },
    "synthesis": { "narrative": "REQUIRED whenever at least two of the four layers above are populated — this is the normal case for most responses, not a rare one; only skip this whole field when zero or exactly one layer above is populated. 3-6 sentences in Korean, or 1-2 short paragraphs in English. Not a sixth layer and not a recap of the four above — name what CHANGES between them: what shifts from first_impression to known_self/close_private_self, what only becomes visible with closeness, and — only when natural_self_and_deep_needs is one of the populated layers and the evidence genuinely supports it — the contrast between outward presentation and the deeper need underneath. Base this only on the layer narratives you just wrote and their evidence; never introduce a fact not already reflected in one of those layers.", "evidence_refs": ["optional — exact keys from ANY of the four layers' evidence lists above (never invented, never from Core Mode/Growth Edge/Strengths evidence)"] }
  }`;

// ── Batch 6: additive Strengths/Watchouts grounding ───────────────────────
// Same additive/grounded-only contract. Per-item evidence_refs, only shown
// on the first array item in the schema example (items 2/3 stay "..." like
// the existing title/body abbreviation) — the rule applies to every item.

const STRENGTHS_EVIDENCE_FIELD = `, "evidence_refs": ["optional — exact keys from [Strengths & Watchouts evidence] this item is grounded in, only from the bracketed list, never invented — omit if this item isn't well-grounded"]`;

// ── Part 02 Batch 1: additive Energy grounding ────────────────────────────
// Same additive/grounded-only contract. balance_pct stays in the schema for
// prompt clarity but is a pure SSOT derivation from bars[1] after coercion
// (see coerceDeepEssenceStructured.ts) — whatever the LLM writes there is
// overwritten, never trusted.

const ENERGY_EVIDENCE_FIELD = `,
    "evidence_refs": ["optional — exact keys from [Energy evidence] this block is grounded in, only from the bracketed list, never invented — omit if not well-grounded"]`;

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
    )
    .replace(
      `"optimal": ["fitting environment 1", "fitting environment 2"]`,
      `"optimal": ["fitting environment 1", "fitting environment 2"]${ENERGY_EVIDENCE_FIELD}`,
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
  energyText: string;
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

[Energy evidence]
${input.part01Evidence.energyText}

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
- growth_edge answers a genuinely different question than gap_deep_dive: not "what is the natural-vs-current difference" (that's Gap's job) but three specific things — growth_edge_why: why THIS is the highest-leverage thing to act on right now (not a description of the pattern itself); growth_edge_real_life_pattern: a concrete, specific NEXT STEP to try differently, starting now — an action, not a re-description of today's behavior (never repeat gap_deep_dive's current_pattern/natural_tendency content here, in any paraphrase — that has already been said); growth_edge_if_developed: what becomes possible once that next step is practiced. growth_edge MAY select the same axis as one of the gap_deep_dive entries — that's allowed, since the axis itself isn't the duplicate, restating its description is — but all three fields must add this genuinely new why-now/next-step/outcome angle, never the natural-vs-current description Gap already gave. Ground growth_edge in MULTIPLE signals from [Growth Edge evidence] — do not simply pick the widest current/innate gap, weigh it together with dimension confidence, mixed-state flags, and repeated friction/cost signals. List the exact bracketed keys you used in growth_edge_evidence_refs; never invent one. growth_edge_why/growth_edge_real_life_pattern/growth_edge_if_developed are optional — include only when genuinely grounded and non-repetitive.
- layered_identity answers ONLY its own relational-depth question per layer — first_impression (from [First Impression evidence] only): how you land on someone new; known_self (from [Known Self evidence] only): how you show up once someone knows you a bit; close_private_self (from [Close Private Self evidence] only): how you are with people closest to you; natural_self_and_deep_needs (from [Natural Self & Deep Needs evidence] only): your most natural self and deepest needs. Each layer's evidence_refs may ONLY reference keys from that layer's own bracketed list — never borrow a key from another layer's list or from Core Mode/Growth Edge evidence. There is no single fixed formula (e.g. month pillar = first impression) — weigh the whole bucket, including confidence and mixed-state flags, and let convergence across multiple signals decide. OMIT a layer entirely — do not force all 4 — if either its bucket has too little usable signal, OR if the honest answer to that layer's own question would just restate a conclusion already given in axis_interpretations or growth_edge. Never invent an evidence key.
- layered_identity.synthesis is REQUIRED whenever at least two of the four layers above are populated — do not treat it as optional or skip it by default; two or more layers is the normal case, and skipping synthesis in that case is a miss, not a safe default. Only omit the field when zero or exactly one layer above is populated (two data points are the minimum for a "change," one is not). It answers a DIFFERENT question than the four layers themselves: not "what is each layer" (already answered above) but "what changes as relational distance changes." Do not restate each layer in turn (that is the exact failure mode to avoid — a synthesis that just lists "at first X, then Y, then Z" without naming the shift between them has failed). Instead name: what shifts between first_impression and known_self/close_private_self; what only becomes visible once someone is close; and, only when natural_self_and_deep_needs is among the populated layers and the evidence genuinely supports it, the contrast between how this person outwardly presents and what they actually need underneath — moving from outward presentation toward the less-visible need, not treating it as a fourth equal impression. Ground every claim ONLY in the layer narratives you already wrote in this same response and their own evidence — never infer a new saju fact, and never invent biography, childhood, family, or work history to explain why the contrast exists. Use conditional language ("may", "can look like") when the contrast between layers is real but not strongly convergent. Keep it short — 3-6 sentences in Korean, or 1-2 short paragraphs in English — this is Part 02's closing insight, not a new chapter (a longer, fuller adaptation narrative belongs to a later, separate part of the report, not here). evidence_refs may reference exact keys from any of the four layers' evidence lists above; never invented, never from another section's evidence.
- natural_self_and_deep_needs specifically needs an extra check before you write it: look at exactly which axis/axes you already used in gap_deep_dive and alignment_highlight, and what natural_tendency (or why_it_feels_easy) you already said about them. If natural_self_and_deep_needs would land on that same underlying trait or conclusion — not just overlapping evidence, the same point restated — you MUST omit natural_self_and_deep_needs entirely, even though [Natural Self & Deep Needs evidence] is non-empty. The mere existence of anchor evidence (strength, favorable_elements, a relational dimension) is never a sufficient reason to include this layer — only a genuinely distinct need or insight that axis_interpretations hasn't already stated is.
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
- Never translate raw current/innate/delta numbers into prose — describe concrete, real-life behavior and situations instead. Never let a single five-element/ten-god/psych-axis signal alone decide any field — look for convergence, and use conditional language when confidence is low or evidence is mixed. current_evidence_refs may only reference that exact axis's own bracketed Current Self keys (never another axis's); innate_evidence_refs only the shared Innate Self pool's keys. Both optional; never invent a key.
- energy (headline/bars/summary/fuels/drains/optimal) must be grounded in [Energy evidence] via convergence across multiple signals — never let a single element/ten-god/dimension/axis decide a bar value or a fuels/drains/optimal item on its own, and use conditional language ("tends to", "often") when the evidence for a signal is mixed or low-confidence. Translate everything into an energy-cost/recovery/environment angle specifically — what costs you energy, what returns it, which environments or situations are cheaper or more expensive for you — never a generic personality description. You may reuse the same evidence already used elsewhere in this response (e.g. an axis gap, a strength/watchout), but you must not restate that section's conclusion here — say something new about energy cost or recovery, not a repeated trait description. evidence_refs is optional — only exact keys from [Energy evidence], never invented.
- energy MAY surface these additional angles inside the existing summary/fuels/drains/optimal fields, but ONLY when genuinely supported by converging evidence — never force any of them into every response:
  - Innate vs. current energy style: if the climate/elemental (innate) evidence and the energy_style/resilience (current) evidence point at a meaningfully different way of using energy, name that difference in plain, real-life terms. If they roughly agree, say nothing about a contrast — do not manufacture one.
  - Gap-driven energy cost: if a reused Current x Innate gap axis represents real adaptation or compensation, you may explain the energy cost of sustaining that adaptation. A gap is not a problem or flaw — frame it as effort/cost, exactly like gap_deep_dive's own gives_you/may_cost framing, never as something wrong with the person.
  - Strength overuse: an existing strength (from the CE strengths-group signals) may appear as a drains item ONLY when there is converging evidence that it's being used past a comfortable point (e.g. it recurs across strengths-group signals AND a caution/dimension signal) — never assert overuse from the strength's mere existence alone.
  - Pressure / conflict / emotional labor: use pressure_response and conflict_style together (plus any other converging Energy evidence) to name a specific draining situation involving pressure, disagreement, or managing others' emotions — grounded in at least one of these signals, not asserted generically.
  - Environment / rhythm / social density: make optimal more specific using only the evidence already in [Energy evidence] (solitude_autonomy, energy_style, climate, etc.) — do not invent a rhythm/pace signal that isn't there; if the evidence doesn't support a rhythm-specific claim, describe environment/social density instead.
  Each of these is independent and optional — include only what the evidence actually supports, keep total energy content the same length/shape as before (no new fields, no longer lists), and never let any of these restate a conclusion already stated in axis_interpretations, growth_edge, strengths, or watchouts — translate it into energy terms instead.
- Each fuels/drains/optimal item must name a concrete trigger or context, not a generic category label — and briefly imply why it costs or returns energy for this specific person, not just what the situation is. Prefer "a long meeting where you keep having to respond to people with little room to process alone" over "Large social gatherings"; prefer "carrying other people's schedules or moods while your own decisions keep getting pushed back" over "Too much responsibility". Ground each item's specificity in the convergence you already found in [Energy evidence] (e.g. solitude_autonomy + pressure_response together might point at a specific kind of low-privacy, high-responsiveness situation) — never invent a scenario unconnected to the evidence, and never let one signal alone dictate one item. The same underlying evidence may show up differently across fuels vs. drains vs. optimal — e.g. a low-stimulation environment might explain both a drains item (too much unstructured noise) and an optimal item (quiet, low-interruption settings) from two genuinely different angles; don't just restate one as the mirror of the other. Keep every item to one concise phrase or short sentence (still a scannable list item, not a paragraph). Never write a blanket claim like "you dislike people" or "you're an introvert" — describe the specific pattern or context instead. Keep fuels, drains, and optimal meaningfully distinct from each other — avoid two items across these three lists restating the same situation from interchangeable angles unless it's a genuinely separate, specific insight.`
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

// ── Part 03 Batch 1: additive Relationship grounding ──────────────────────
// Same additive/grounded-only contract as Part A's batches. Only appended
// when Part01 Identity Evidence is provided. Absent/null input.part01Evidence
// must reproduce the exact pre-Batch-1 Part B prompt. Block-level
// evidence_refs (like Part 02 Batch 1's energy.evidence_refs) rather than
// per-item — fit/friction stay plain string[] so no UI/schema shape change
// is needed for those two fields.

const RELATIONSHIP_EVIDENCE_FIELD = `,
    "evidence_refs": ["optional — exact keys from [Relationship evidence] this section is grounded in, only from the bracketed list, never invented — omit if not well-grounded"]`;

// ── Part 04 Batch 1: additive Practice/Playbook grounding ─────────────────
// Same additive/grounded-only contract, same block-level evidence_refs shape
// as Part 03 Batch 1 (rows stays plain {situation,old,better}[] — no per-row
// evidence_refs, no UI/schema shape change to rows itself).

const PLAYBOOK_EVIDENCE_FIELD = `,
    "evidence_refs": ["optional — exact keys from [Practice evidence] this section is grounded in, only from the bracketed list, never invented — omit if not well-grounded"]`;

// ── Part 05 Batch 1: additive Future/Direction grounding ──────────────────
// Same additive/grounded-only contract, same block-level evidence_refs shape.
// closing is deliberately untouched — no schema/prompt change to it at all.

const FUTURE_EVIDENCE_FIELD = `,
    "evidence_refs": ["optional — exact keys from [Future evidence] this section is grounded in, only from the bracketed list, never invented — omit if not well-grounded"]`;

function buildPartBSchema(part01Evidence: Part01EvidenceForPartBPrompt | null | undefined): string {
  if (!part01Evidence) return DEEP_ESSENCE_PART_B_SCHEMA;
  return DEEP_ESSENCE_PART_B_SCHEMA.replace(
    `    "compare": [
      { "wound": "a phrase that tends to wound", "steady": "a phrase that steadies instead" },
      { "wound": "...", "steady": "..." },
      { "wound": "...", "steady": "..." }
    ]
  },`,
    `    "compare": [
      { "wound": "a phrase that tends to wound", "steady": "a phrase that steadies instead" },
      { "wound": "...", "steady": "..." },
      { "wound": "...", "steady": "..." }
    ]${RELATIONSHIP_EVIDENCE_FIELD}
  },`,
  ).replace(
    `    "heated": "rule for when emotions spike, 3-5 sentences",
    "reset": "weekly reset routine, 3-5 sentences"
  },`,
    `    "heated": "rule for when emotions spike, 3-5 sentences",
    "reset": "weekly reset routine, 3-5 sentences"${PLAYBOOK_EVIDENCE_FIELD}
  },`,
  ).replace(
    `    "remember": ["thing worth remembering 1 (4-7 sentences)", "2", "3"],
    "leap": "direction for the next step, 3-5 sentences"
  },`,
    `    "remember": ["thing worth remembering 1 (4-7 sentences)", "2", "3"],
    "leap": "direction for the next step, 3-5 sentences"${FUTURE_EVIDENCE_FIELD}
  },`,
  );
}

export type Part01EvidenceForPartBPrompt = {
  relationshipText: string;
  practiceText: string;
  futureText: string;
};

export function buildDeepEssenceStructuredPartBUserPrompt(input: {
  surveyAnalysis: string;
  essenceAnalysisSummary: string;
  birthEnergyContext: string;
  partAExcerpt: string;
  locale?: Locale | string;
  /** Part 03 Batch 1 — optional. Omit/null to reproduce the exact pre-Batch-1 prompt. */
  part01Evidence?: Part01EvidenceForPartBPrompt | null;
}): string {
  const outputLocale = normalizeLocale(input.locale);
  const grounded = Boolean(input.part01Evidence);

  const evidenceBlock = input.part01Evidence
    ? `
■ Relationship Evidence — grounding material only (internal keys in brackets; never quote raw keys/codes to the reader). Use ONLY to decide relationships.pattern/fit/friction/compare and to fill its optional evidence_refs.
[Relationship evidence]
${input.part01Evidence.relationshipText}

■ Practice Evidence — grounding material only (internal keys in brackets; never quote raw keys/codes to the reader). Use ONLY to decide playbook.rule/rows/heated/reset and to fill its optional evidence_refs.
[Practice evidence]
${input.part01Evidence.practiceText}

■ Future Evidence — grounding material only (internal keys in brackets; never quote raw keys/codes to the reader). Use ONLY to decide future.remember/leap and to fill its optional evidence_refs. closing is NOT covered by this evidence and must stay exactly as it already was — a warm tonal sign-off, not an insight field.
[Future evidence]
${input.part01Evidence.futureText}
`
    : "";

  const groundingRules = grounded
    ? `
- relationships must be grounded in [Relationship evidence] via convergence across multiple signals — never let a single dimension/axis/secondary score decide pattern/fit/friction/compare alone, and use conditional language when a signal's confidence is low or mixed. Translate identity-trait evidence into its RELATIONAL meaning — never restate a trait the same way Part01/Part02 already described it; say something new about how it plays out specifically in relationships. You may reuse the same evidence already used elsewhere (e.g. an axis gap, a Part02 drains signal), but the conclusion here must be relationship-specific, not a repeated identity or energy conclusion.
- pattern answers "how do I connect with people" — a whole-relational-style read, grounded in convergence across the evidence, not any single signal.
- fit answers "what kind of person genuinely fits me" — ground it in real evidence-backed traits, not generic virtues ("kind", "honest") unless the evidence specifically converges on something more particular than that.
- friction answers "what interaction pattern creates friction for me" — specifically consider conflict_decompression (how this person cools down / processes after conflict) as a strong candidate signal here when its confidence is usable; never invent a friction pattern unconnected to the evidence.
- compare answers "a way this person tends to get hurt → a way to instead offer steadiness" (wound -> steady) — ground the wound side in real evidence (e.g. criticism_sensitivity, boundary_defense_strength, pressure_response), and make sure this is NOT a restated Part01 watchout — it must specifically be about how the person gets hurt or steadied in a relational moment, not a general character flaw.
- intimacy_expression_style, support_giving_style, and boundary_defense_strength are especially relevant to pattern/fit; conflict_decompression is especially relevant to friction/compare — use them when they genuinely fit, never force all of them into every field.
- evidence_refs is optional — only exact keys from [Relationship evidence], never invented.
- pattern MAY include a short thread on the functional role this person tends to occupy in relationships (e.g. mediator, caretaker, fixer, observer, lead) — grounded in support_giving_style/boundary_defense_strength/expression_style/recognition_need. Answer ONLY "what role do I tend to end up in," never re-describe the underlying trait itself (that's Part01's job) — name the function, not the personality. Omit this thread entirely if the evidence for it is thin; do not force a role onto every response.
- pattern MAY also include a short thread on how this person's natural relational tendency differs from how they currently behave in relationships, using the same already-provided gap/alignment axis — but ONLY when that difference actually shows up in a relational way, and ONLY as a brief translation of how it plays out in relationships (not a restatement of the axis's natural_tendency/current_pattern/gives_you/may_cost fields, which Part A already covered in full). Omit entirely when the axis doesn't meaningfully manifest in relationships or the evidence is thin.
- compare MAY include one wound that is specifically about loneliness despite being connected to people — but ONLY when solitude_autonomy/intimacy_expression_style/recognition_need/conflict_decompression genuinely converge on a specific unmet need (e.g. wanting to be understood at a depth that isn't being met, or needing acknowledgment that isn't arriving) — never a generic "you feel isolated" statement, and never simply because solitude_autonomy or a similar signal exists. Before writing a loneliness wound, check the semantic conclusion of each Part01 watchout above (not just its wording) — if a watchout already explains this person via social withdrawal, emotional distance, isolation, or avoidance, a loneliness wound that amounts to "so you feel lonely / distant" is the SAME conclusion in different words and is forbidden, even if no sentence is copied. A valid loneliness wound must describe a genuinely separate relational experience: not the behavior/trait itself (e.g. NOT "tends to want to be alone"), but the specific unmet need felt even while WITH people (e.g. "the quiet isolation of being surrounded by people but not having the emotional depth you need actually met"). If you cannot articulate a loneliness wound that adds this new angle beyond what a watchout already covers, omit it and choose a different wound theme (criticism_sensitivity, boundary_defense_strength, pressure_response, etc.) instead. This is optional — most responses may have zero loneliness-flavored wounds among the 3 compare rows, and normally at most one of the 3 rows should be loneliness-themed even when included.
- None of these three optional threads (role, relational gap, loneliness wound) should appear in every response — include each only when its own specific evidence genuinely supports it, and it's normal for a response to include zero, one, two, or all three.
- playbook translates analysis into ACTION — never re-explain personality, never restate what strengths/watchouts/relationships already concluded. Ground it in [Practice evidence] via convergence across multiple signals; never let a single dimension/secondary score decide any field alone, and use conditional language when a signal's confidence is low or mixed. Avoid generic self-help phrasing ("take a deep breath", "communicate openly", "practice self-care") unless it's the specific, evidence-grounded thing genuinely called for.
- rule / rows / heated / reset each answer a DIFFERENT kind of question — never let one collapse into a paraphrase of another:
  - growth_edge_real_life_pattern (from [Already written earlier], if present) is a single concrete NEXT STEP with high leverage right now — already decided, not yours to re-explain.
  - rule is a REPEATABLE OPERATING PRINCIPLE / decision rule this person can apply across many different future situations — not one specific action, and NOT a paraphrase of growth_edge_real_life_pattern in different words. Test: if you swapped in a completely different specific situation, would this rule still make sense as guidance? If rule only makes sense for the one situation growth_edge_real_life_pattern already named, it has collapsed into a paraphrase — rewrite it as a general principle, or ground it in [Practice evidence] on its own terms instead of anchoring it to growth_edge_real_life_pattern at all. Example: growth_edge_real_life_pattern = "reach out first after a conflict" -> rule should NOT be "text your friend more honestly" (same single action restated) -> rule SHOULD be something like "instead of trying to resolve the feeling immediately, first name that you need time, then name when you'll come back to talk" (a decision rule that applies across many future moments, not one instance). Never write a generic motivational sentence — this has been observed live and is explicitly forbidden, including any close variant of: "vulnerability strengthens relationships/bonds", "opening up/being vulnerable brings people closer", "communication strengthens relationships", "communication is key", or any other closing statement whose claim is simply that connecting/opening up/communicating is generally good for relationships. That claim is true of almost anyone and belongs to no one — if you can imagine the exact same sentence appearing in a different person's report unchanged, it has failed. rule must instead name a specific recurring TRIGGER/CONDITION for this person and the OPERATING PRINCIPLE they personally should apply when it happens — what THIS person should actually do under that recurring condition, never a general statement about why healthy relationships or communication are good. If [Practice evidence] doesn't support a genuinely specific trigger-to-principle rule, ground rule directly in decision_style/expression_style/criticism_sensitivity instead of forcing a growth-edge connection or falling back to generic encouragement.
  - rows: each row's situation must be a real, specific trigger (not a vague category); old is the automatic reaction this person tends to fall into; better is a concrete action or literal sentence they could say in that exact moment — specific enough to actually use, never generic advice. Ground old/better in [Practice evidence] (decision_style is especially relevant to how they'd naturally decide what to say/do) — do not invent a situation unconnected to the evidence.
  - heated answers "what do I actually do in the moment emotions spike" — ground it specifically in pressure_response and conflict_decompression from [Practice evidence] when their confidence is usable; this must be a concrete in-the-moment response, not a re-description of the friction/compare content already given in [Relationship evidence] above — translate the same underlying evidence into a literal action for the heated moment itself, never restate why it happens.
  - reset is a small, realistically repeatable WEEKLY practice/habit — ground it in resilience from [Practice evidence] (what recovery capacity actually looks like for this person) rather than inventing a routine. Do not restate Part02 Energy's fuels/optimal-environment content — if you reuse that same underlying evidence, translate it into a specific repeatable weekly action/habit, not another description of what restores them.
- evidence_refs (playbook) is optional — only exact keys from [Practice evidence], never invented.
- future.remember and future.leap are NOT another personality summary — closing already handles warm tone, and strengths/watchouts/core_mode already handle trait description. remember/leap must convert everything already established into decision facts for the future. Never restate core_mode, a strength/watchout title, or growth_edge's own wording.
- remember must be exactly 3 DECISION FACTS, and each of the 3 must play a genuinely different role — never let two of them make the same underlying point in different words:
  1. a natural strength/direction worth leaning into more — grounded in [Future evidence]'s best-aligned axis, or in a strength already established, but it must be written as a CRITERION OR ACTION for future choices, never as the trait's own name or title restated. Test: does this sentence name a strength/core_mode word directly (e.g. "your independent problem-solving", "your independence")? If so, rewrite it as what that strength lets you choose or prioritize instead. WRONG: "Lean into your independent problem-solving more." RIGHT: "Prioritize choices where you get to decide alone and own the outcome, rather than ones that need group consensus first." The strength is implied by the criterion, never named.
  2. a repeating pattern worth reducing or staying alert to (grounded in Practice/Relationship evidence already covered — a caution to carry forward, not a re-explanation of the watchout itself)
  3. a criterion to prioritize when choosing environments/relationships/actions going forward (synthesized from energy_optimal / relationships.fit / playbook.reset already produced — a decision criterion, e.g. "choose situations with X quality," not a listing of those items)
  Each of the 3 must be phrased as something to keep using as a future filter, not a fact about who this person is.
- leap must be an actual DECISION PRINCIPLE for future choices, structured around explicit choose-more/choose-less language — e.g. "choose more of ___", "choose less of ___ / avoid environments where ___", "prioritize ___ over ___". Never generic encouragement ("trust yourself", "you've got this", "believe in the journey").
  growth_edge_if_developed (from [Already written earlier], if present) states WHAT BECOMES POSSIBLE if a capability grows — that's already said, do not paraphrase it or reuse its wording. leap's job is different: given that possibility, WHICH FUTURE CHOICES actually grow it — what to do more of, what to do less of, what environment to avoid. Test: if leap and growth_edge_if_developed could be swapped and the response would read the same, leap has collapsed into a paraphrase — rewrite it strictly as choose-more/choose-less guidance instead.
  Synthesize (do not list) into that choose-more/choose-less principle: (a) the best-aligned axis in [Future evidence] — a direction that already fits with low friction, so it belongs on the "choose more of" side; (b) the long-term-fit signal already established this response via energy_optimal / relationships.fit / playbook.reset. If [Future evidence] has no aligned axis, ground leap in whatever convergent Practice/Relationship signal is available — but it must still be phrased as explicit choose-more/choose-less guidance, not an uplifting sentiment.
- Alignment axis consumption (required, in at least ONE of remember or leap — not necessarily both): the best-aligned axis in [Future evidence] means natural tendency and current behavior are already close on that axis, so it can be used with comparatively little friction. Turn this into one concrete "lean into this direction more" decision criterion somewhere in remember or leap. Never name the axis or its score, and never reproduce the natural_tendency/current_pattern/why_it_feels_easy wording Part A's axis_interpretations already used for it — describe the kind of choice/situation this low-friction direction shows up as instead.
- Never let remember or leap simply restate energy_optimal, relationships.fit, playbook.reset, or growth_edge_if_developed in the same words — translate them into what to choose or avoid going forward. Reusing the same underlying signal across sections is fine; repeating its conclusion is not.
- evidence_refs (future) is optional — only exact keys from [Future evidence], never invented.
- closing is unaffected by any of this — keep it exactly as it already was, a tonal sign-off, not an evidence-grounded field.`
    : "";

  return `[Input data — same material]
■ Survey
${input.surveyAnalysis}

■ Essence analysis (incl. special stars)
${input.essenceAnalysisSummary}

■ Birth-energy context
${input.birthEnergyContext}

[Already written earlier — keep the same tone and persona]
${input.partAExcerpt}
${evidenceBlock}
[Output rules]
- Respond with the exact same key structure as the schema below. Do not add extra keys.
- relationships.fit/friction need exactly 3 items each. relationships.compare, playbook.rows, and future.remember need exactly 3 items each.
- checklist needs 8-12 items.
- checklist has a DIFFERENT job than playbook and future, even though they cover related ground — never let it collapse into either:
  - playbook = what to DO when a specific situation happens (in-the-moment response)
  - future = what CRITERIA to use when choosing, going forward (durable principle)
  - checklist = "what is one concrete thing I can actually complete today or this week" — never an in-the-moment coping instruction, a repeated relationship script, a recovery recommendation, or a future decision principle; those roles already belong to playbook/future.
  Each checklist item must be a short imperative naming a real action, not a piece of advice, a trait description, or motivation. Prefer items that let the person TEST or NOTICE something about themselves (schedule one experiment, notice one reaction, write down one example, try one different response once, contact one person, remove one commitment, compare how you felt before/after, identify one environment that felt unusually comfortable) — these are structural guidance, not a fixed list to force in verbatim.
  In Korean specifically, every item should preferably contain BOTH a bounded execution unit (오늘 / 이번 주 / 이번 주말 / 한 번 / 10분·20분·30분 / 한 사람 / 한 상황 / 일정에 한 칸 / 한 문장 적기) AND a concrete observable action verb (예약한다 / 적는다 / 연락한다 / 선택한다 / 기록한다 / 정리한다 / 한 번 시도한다 / 일정에 넣는다) — avoid vague advice endings like ~해보세요 / ~하는 것이 좋아요 / ~하는 것이 중요해요 when the sentence has no bounded action behind them.
  SEMANTIC duplication guard — before finalizing each item, compare its ACTION (not its wording) against playbook.rows[].better, playbook.heated, playbook.reset, future.remember[], and future.leap. If doing the checklist item would effectively mean doing the same thing one of those fields already told the person to do, don't write it — change the action itself, not just the wording, tense, sentence order, or by prepending a time phrase. Adding "이번 주" to an already-existing action does NOT make it new. Example: heated says "감정이 격해질 때 깊게 숨을 쉬고 감정을 정리하세요" — a checklist item like "이번 주 감정이 격해질 때 깊게 숨을 쉬어보세요" is STILL a duplicate (same action, a time phrase bolted on); "이번 주 갈등이 있었던 한 상황을 골라, 그때 바로 말하지 못했던 내용을 한 문장으로 적어보세요" is a genuinely different, new action on a related theme. Likewise reset says "혼자 책을 읽으며 회복 시간을 가지세요" — "이번 주 혼자 책 읽는 시간을 정해보세요" is STILL essentially the same action; "이번 주 일정에서 가장 지치기 쉬운 날 하나를 골라 30분짜리 빈 시간을 미리 예약해두세요" is a genuinely new, distinct experiment on the same recovery theme.
  Diversity guard: the 8-12 items should not cluster around one dominant theme (e.g. never 4 relationship-expression items, or 3 different phrasings of "reach out to someone"). Where the evidence supports it, spread items across the different insights already established this response (energy/recovery, relationships, pressure/conflict, growth edge, the aligned/natural direction, boundaries, environment/rhythm, decision behavior) — but never invent an unsupported theme just to pad diversity.
  Do not pad the 8-12 count with near-duplicate actions that share the same underlying meaning — reusing an underlying theme across multiple items is fine only if each instance is a genuinely distinct, separately-checkable action.
- Continue without contradicting the earlier strengths/watchouts/energy content.${groundingRules}

JSON schema:
${buildPartBSchema(input.part01Evidence)}

Respond with exactly one JSON object matching the schema above.

${buildLlmOutputLocaleInstruction(outputLocale)}`;
}
