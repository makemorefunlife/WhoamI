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
    { "title": "natural capability in action (concrete behavior phrase, e.g. 말보다 먼저 분위기를 읽는 힘 — NEVER generic trait labels like 공감 능력/완벽주의)", "body": "5-7 sentences with concrete situations and grounds: what comes naturally -> how it appears in actual life -> why this is a strength" },
    { "title": "...", "body": "5-7 sentences" },
    { "title": "...", "body": "5-7 sentences" }
  ],
  "watchouts": [
    { "title": "strength/adaptation overuse pattern (concrete behavior phrase, e.g. 중요한 결정에서 다른 사람의 확신을 먼저 확인하는 방식 — NEVER single-word defect/diagnostic labels like 의존성/완벽주의/불안정함)", "body": "4-6 sentences: strength/adapted capability -> situation where overused -> resulting energy cost / fatigue. NEVER include self-care or wellness advice.", "cost_domain": "exactly one value from WATCHOUT_COST_DOMAINS below — pick it BEFORE writing body, then write body to actually match that domain" },
    { "title": "...", "body": "4-6 sentences", "cost_domain": "a DIFFERENT value from watchouts[0].cost_domain — see the sequential rule below" },
    { "title": "...", "body": "4-6 sentences", "cost_domain": "a THIRD different value when evidence supports it; otherwise see the 2-domain fallback rule below" }
  ],
  "energy": {
    "headline": "one sentence compressing the energy flow & cost",
    "balance_pct": 0,
    "bars": [
      { "label": "Energy spent on people & relationships", "value": 0, "tone": "highlight" },
      { "label": "Energy returning to you", "value": 0, "tone": "accent" },
      { "label": "Solo recovery time", "value": 0, "tone": "ink" }
    ],
    "summary": "6-10 sentences: what drains energy + why in that situation + what strength/adaptation operates. Never 'people make you tired'.",
    "fuels": ["concrete situational condition 1 (e.g. 내 의도를 길게 설명하지 않아도 통하는 대화 — NO generic wellness advice)", "condition 2", "condition 3"],
    "drains": ["concrete situational condition 1 (e.g. 여러 사람의 기대를 동시에 맞춰야 하는 상황 — NO generic wellness advice)", "condition 2", "condition 3"],
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

const LAYER_TITLE_FIELD_DESC = `optional short phrase (3-6 words) naming the OBSERVABLE PATTERN this layer shows, never a personality label for the whole person — describe HOW they show up at THIS relational distance, not WHO they are (e.g. 쉽게 신뢰를 주는 첫인상 / 가까워질수록 세심해지는 방식 / 안전한 관계에서 더 솔직해지는 면 / 혼자 결정할 수 있어야 편한 깊은 욕구). FORBIDDEN anywhere in layered_identity titles: personality-noun/virtue labels (자유로운 영혼, 배려 깊은 친구, 좋은 사람, 따뜻한 사람, 리더, 공감형, 독립적인 사람, free spirit, caring friend, good person, leader, empath) and ANY combination of 진짜/진정한/찐 with 나/모습/자아 (e.g. 진정한 나, 진짜 나, 진짜 모습, 진정한 모습, 본모습) or true/real/authentic with self (true self, real self, authentic self, who you really are) — this is a PHRASE FAMILY, not a fixed list, so a close variant not spelled out above is still forbidden if it claims one layer is more genuine than the others; no layer is more real than another, so no title or narrative sentence may claim one is`;

const LAYERED_IDENTITY_SCHEMA_FIELD = `,
  "layered_identity": {
    "first_impression": { "title": "${LAYER_TITLE_FIELD_DESC}", "narrative": "optional, 3-5 sentences: how you tend to land on people who just met you", "evidence_refs": ["exact keys from [First Impression evidence] you grounded this in — omit the whole first_impression layer if the evidence is too thin"] },
    "known_self": { "title": "${LAYER_TITLE_FIELD_DESC}", "narrative": "optional, 3-5 sentences: how you show up once someone has gotten to know you a bit", "evidence_refs": ["exact keys from [Known Self evidence] — omit the whole known_self layer if the evidence is too thin"] },
    "close_private_self": { "title": "${LAYER_TITLE_FIELD_DESC}", "narrative": "optional, 3-5 sentences: how you are with the people closest to you, in private", "evidence_refs": ["exact keys from [Close Private Self evidence] — omit the whole close_private_self layer if the evidence is too thin"] },
    "natural_self_and_deep_needs": { "title": "${LAYER_TITLE_FIELD_DESC}", "narrative": "optional, 3-5 sentences: your most natural, unguarded self and what you deeply need", "evidence_refs": ["exact keys from [Natural Self & Deep Needs evidence] — omit the whole natural_self_and_deep_needs layer if the evidence is too thin"] },
    "synthesis": { "narrative": "REQUIRED whenever at least two of the four layers above are populated — this is the normal case for most responses, not a rare one; only skip this whole field when zero or exactly one layer above is populated. 3-6 sentences in Korean, or 1-2 short paragraphs in English. Not a sixth layer and not a recap of the four above — you MUST explicitly answer at least ONE of: what changes between two specific layers (not all four re-listed in order); why something only becomes visible once someone is close; or the contrast between outward presentation and the deeper need underneath (only when natural_self_and_deep_needs is populated and genuinely supports it). A synthesis that just walks through the layers in order without naming a shift between them has failed, even if each sentence is individually true. Base this only on the layer narratives you just wrote and their evidence; never introduce a fact not already reflected in one of those layers.", "evidence_refs": ["optional — exact keys from ANY of the four layers' evidence lists above (never invented, never from Core Mode/Growth Edge/Strengths evidence)"] }
  }`;

// ── IA Batch 3: additive Adaptation Story (adaptation_story) ─────────────
// Only appended when the deterministic minimum-evidence gate
// (hasAdaptationStoryEvidence in formatPart01EvidenceForPrompt.ts) passed —
// see Part01EvidenceForPartAPrompt.adaptationStoryEligible. Placed as the
// LAST top-level key in the Part A schema, after layered_identity and
// axis_interpretations, so the model writes it only after it has already
// produced those — it synthesizes across what it just wrote, not a new
// evidence Lens of its own.

const ADAPTATION_STORY_SCHEMA_FIELD = `,
  "adaptation_story": { "narrative": "2-5 short paragraphs, each ONE-TO-THREE sentences, joined with a literal blank line (\\n\\n) between every paragraph — never one dense wall-of-text block. All 5 beats below must be covered in content; adjacent beats MAY share a paragraph when they flow naturally together, but never split one beat's content across two paragraphs, and never fold beat (5) — the closing/integration beat — into an earlier paragraph, since it needs to land as its own distinct final paragraph. Synthesizes everything you already wrote above in THIS SAME response (layered_identity, axis_interpretations, energy, growth_edge) into ONE integrated story — never restates a single axis by its name, and never re-explains what axis_interpretations or layered_identity already said in the same terms; translate them into plain, connected observations instead. One paragraph each, in this order (do not label them, just start each on a new paragraph): (1) the natural/innate direction that stands out most across the evidence; (2) what the person visibly relies on more today, in plain behavioral terms; (3) what that shift actually makes possible — a capability or functional gain (e.g. weighing more people/variables, handling change, sustaining relationships, carrying responsibility, managing uncertainty), never framed as a flaw. This beat is REQUIRED, not optional — the evidence gate for this field already confirmed a second, independent signal beyond the primary gap axis; use it to name the smallest genuine functional gain that combination actually supports, never omit this beat for being unsure; (4) what sustaining that shift may cost (energy, decision effort, over-adaptation, or relational strain) — only when the evidence for a cost genuinely converges, never invented as a given; (5) a closing paragraph holding both the natural direction and the current way of living together — never declare one 'the real self' and the other fake, lost, or suppressed, and never end with advice, a next step, or where the reader should go from here (that belongs to a different part of the report — this field stops at recognition, not direction). CONVERGENCE REQUIREMENT: at least one sentence in beats (2)-(4) must express something that is only visible because two or more of the independent signals behind this field (the gap axis, layered identity, energy) hold true TOGETHER — not something either signal would already say alone. Never invent a new fact to manufacture this; if the evidence only supports single-signal claims, write the strongest single-signal version instead of forcing a false combination.", "evidence_refs": ["optional — exact keys already shown above in this response's Axis Gap/Alignment, Layered Identity, or Energy evidence blocks — never invented, never from Core Mode/Growth Edge/Strengths evidence"] }`;

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
      `{ "title": "natural capability in action (concrete behavior phrase, e.g. 말보다 먼저 분위기를 읽는 힘 — NEVER generic trait labels like 공감 능력/완벽주의)", "body": "5-7 sentences with concrete situations and grounds: what comes naturally -> how it appears in actual life -> why this is a strength" }`,
      `{ "title": "natural capability in action (concrete behavior phrase, e.g. 말보다 먼저 분위기를 읽는 힘 — NEVER generic trait labels like 공감 능력/완벽주의)", "body": "5-7 sentences with concrete situations and grounds: what comes naturally -> how it appears in actual life -> why this is a strength"${STRENGTHS_EVIDENCE_FIELD} }`,
    )
    .replace(
      `{ "title": "strength/adaptation overuse pattern (concrete behavior phrase, e.g. 중요한 결정에서 다른 사람의 확신을 먼저 확인하는 방식 — NEVER single-word defect/diagnostic labels like 의존성/완벽주의/불안정함)", "body": "4-6 sentences: strength/adapted capability -> situation where overused -> resulting energy cost / fatigue. NEVER include self-care or wellness advice.", "cost_domain": "exactly one value from WATCHOUT_COST_DOMAINS below — pick it BEFORE writing body, then write body to actually match that domain" }`,
      `{ "title": "strength/adaptation overuse pattern (concrete behavior phrase, e.g. 중요한 결정에서 다른 사람의 확신을 먼저 확인하는 방식 — NEVER single-word defect/diagnostic labels like 의존성/완벽주의/불안정함)", "body": "4-6 sentences: strength/adapted capability -> situation where overused -> resulting energy cost / fatigue. NEVER include self-care or wellness advice.", "cost_domain": "exactly one value from WATCHOUT_COST_DOMAINS below — pick it BEFORE writing body, then write body to actually match that domain"${STRENGTHS_EVIDENCE_FIELD} }`,
    )
    .replace(
      `"optimal": ["fitting environment 1", "fitting environment 2"]`,
      `"optimal": ["fitting environment 1", "fitting environment 2"]${ENERGY_EVIDENCE_FIELD}`,
    );
  const axisField = buildAxisInterpretationSchemaField(
    part01Evidence.axisInterpretation.gaps,
    part01Evidence.axisInterpretation.alignment,
  );
  const adaptationField = part01Evidence.adaptationStoryEligible
    ? ADAPTATION_STORY_SCHEMA_FIELD
    : "";
  // Insert as new top-level keys right after the "energy" block closes,
  // before the schema object's own closing brace. adaptation_story is last
  // so the model writes it only after layered_identity/axis_interpretations
  // already exist in the same response.
  return withSummaryFields.replace(
    /\n(\}\s*)$/,
    `${LAYERED_IDENTITY_SCHEMA_FIELD}${axisField}${adaptationField}\n$1`,
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
  /** IA Batch 3 — see hasAdaptationStoryEvidence in formatPart01EvidenceForPrompt.ts. */
  adaptationStoryEligible: boolean;
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
- SHINSAL CONVERGENCE RULE: Any Shinsal or special signal (e.g. 'special_signals.*' or 'nobles') shown in evidence must NEVER be quoted by raw traditional name (e.g. forbidden: "도화살이 있어서", "현침살이라", "천을귀인이 있어") and must NEVER be used as the sole basis of a major claim. Treat it as supporting evidence for a human behavioral tendency, capability, or relational notice ONLY when supported by converging identity or psych signals. Every user-visible interpretation materially influenced by Shinsal must cite at least one independent non-Shinsal evidence family in its evidence_refs.
- BRANCH RELATIONS RULE: Branch relation signals ('relations_intra.*' e.g., 합/충/형/파/해) represent internal energetic reinforcement (합), internal directional tension (충), or repetitive internal friction (형). Translate them into human behavioral observations of how competing internal impulses or natural synergies play out in real life — never output traditional jargon words like "충이 있어" or "형살이다".
- axis_interpretations (gap_deep_dive / alignment_highlight) is the FIRST, PRIMARY owner of "how this axis's natural tendency differs from how it's used today, and what that trade-off costs/gives." Every other section below must build on top of that, not restate it.
- core_mode is a compressed whole-person metaphor ONLY (2-4 words) — it must never re-explain or summarize the detailed traits already covered in axis_interpretations, layered_identity, strengths, or watchouts. It compresses the whole picture into an image; it does not narrate. Ground it in MULTIPLE signals from [Core Mode evidence] — never a single axis, element, ten-god, or dimension alone. List the exact bracketed keys you used in core_mode_evidence_refs; never invent a key that isn't in the list.
- growth_edge answers a genuinely different question than gap_deep_dive: not "what is the natural-vs-current difference" (that's Gap's job) but three specific things — growth_edge_why: why THIS is the highest-leverage thing to act on right now (not a description of the pattern itself); growth_edge_real_life_pattern: a concrete, specific NEXT STEP to try differently, starting now — an action, not a re-description of today's behavior (never repeat gap_deep_dive's current_pattern/natural_tendency content here, in any paraphrase — that has already been said); growth_edge_if_developed: what becomes possible once that next step is practiced. growth_edge MAY select the same axis as one of the gap_deep_dive entries — that's allowed, since the axis itself isn't the duplicate, restating its description is — but all three fields must add this genuinely new why-now/next-step/outcome angle, never the natural-vs-current description Gap already gave. Ground growth_edge in MULTIPLE signals from [Growth Edge evidence] — do not simply pick the widest current/innate gap, weigh it together with dimension confidence, mixed-state flags, and repeated friction/cost signals. List the exact bracketed keys you used in growth_edge_evidence_refs; never invent one. growth_edge_why/growth_edge_real_life_pattern/growth_edge_if_developed are optional — include only when genuinely grounded and non-repetitive.
- layered_identity answers ONLY its own relational-distance question per layer — one person viewed across four relational distances:
  1. first_impression (from [First Impression evidence] only): "What social surface do people encounter before knowing you?" (pace, social temperature, perceived confidence, conversational style, approachability — NOT generic labels like "차분해 보여요"; describe HOW another person experiences it).
  2. known_self (from [Known Self evidence] only): "What recurring everyday operating style becomes visible once someone knows your actual habits?" (decision habits, responsibility handling, accommodation level, opinion expression, organizing life/work after initial politeness wears off).
  3. close_private_self (from [Close Private Self evidence] only): "What only becomes visible when emotional distance is very small?" (intimate emotional expression, defensiveness, closeness vs space, conflict reaction, directness, sensitivity, softness when safe — NEVER default to generic "사실은 따뜻한 사람이에요").
  4. natural_self_and_deep_needs (from [Natural Self & Deep Needs evidence] only): "When social performance, expectations, and adaptation are stripped away, what orientation feels most natural?" (inner motivational pull, natural energy direction, what feels internally coherent — NEVER use "진정한 나" or "진짜 나"; no layer is fake).
  Each layer's evidence_refs may ONLY reference keys from that layer's own bracketed list — never borrow a key from another layer's list or from Core Mode/Growth Edge evidence. OMIT a layer entirely if its evidence is too thin or if it would merely restate a conclusion given elsewhere.
- layered_identity TITLES (every layer): A title must be a HIGH-INFORMATION observation of a concrete behavioral or experiential pattern (preferably 8-24 Korean characters), written in natural, human phrasing.
  - FORBIDDEN titles in any layer, in any language: personality-noun/virtue/MBTI labels (자유로운 영혼, 배려 깊은 친구, 좋은 사람, 따뜻한 사람, 리더, 공감형, 독립적인 사람, free spirit, caring friend, good person, leader, empath) and the "true self" PHRASE FAMILY, not a fixed list — any combination of 진짜/진정한/찐 with 나/모습/자아 (including synthesis.narrative: e.g. 진정한 나, 진짜 나, 진짜 모습, 진정한 모습, 본모습, true self, real self, authentic self; any close variant not spelled out above is still forbidden) — no layer is more real than another, so nothing in this section may claim one is. Test before writing: if this title could describe a stranger's report unchanged, rewrite it as what specifically shows up at this distance for THIS evidence.
- layered_identity BODY & TONE CONTRACT:
  - 3-5 sentences per layer body.
  - Natural, human Korean tone: Write as a thoughtful person would naturally speak or describe themselves. AVOID stiff, academic, or report-like jargon (e.g. FORBIDDEN phrasing style: "엄격하게 구획하는 모습", "자율적 결실", "자연스러운 방어 방식", "타인의 개입을 자제시키는 편", "외부 표준에 따른 수행 압박"). Prefer warm, clear, direct human expressions (e.g. "가까울수록 오히려 내 공간이 더 분명해지는 사람", "남이 납득하는 것보다 내가 납득해야 움직이는 사람").
  - MOTIF DIVERSITY: Do not let all four layers collapse into a monotone loop of "careful + independent + self-directed". Check the evidence bucket for secondary signals (e.g. verbal precision, social visibility, warmth, humor, movement/change, helping/connecting, creativity/output, responsibility). If genuinely supported by converging evidence, allow a second distinct motif to surface so each layer feels humanly rich and distinct.
  - Structure each layer body with 3 movements: Movement A (what the other person or user experiences at that distance) -> Movement B (the less obvious reason or mechanism behind it, grounded in evidence) -> Movement C (a nuance, contrast, or unexpected side).
  - CONTRAST REQUIREMENT: At least TWO of the populated layers MUST contain a meaningful contrast when evidence supports one (e.g. "겉으로는 A처럼 보이지만 가까워지면 B", "잘 맞춰주는 것처럼 보여도 자기 기준 C가 분명함", "단단해 보이지만 안전한 관계에서는 D 표현이 커짐").
  - ANTI-REPETITION: Do not let one single concept (e.g. 타인 고려, 자율성, 안정감) dominate all four layers. A single concept may appear materially in at most TWO layers, using distinct analytical angles.
  - ZERO ADVICE BAN: NEVER include advice or instructions anywhere in layered_identity (FORBIDDEN: ~하세요, ~해보세요, ~하는 것이 중요해요, ~할 필요가 있어요, ~기억하세요, ~조심하세요). Part 02 is strictly for OBSERVATION & RECOGNITION.
  - NO INVENTED BIOGRAPHY: Generalized conditions only ("중요한 결정을 앞두고", "관계의 분위기를 읽어야 할 때" — NEVER invented life scenarios like "친구가 힘들어할 때", "새 직장에서").
  - NEUTRAL OBSERVATIONAL TONE: Avoid generic praise ("훌륭해요", "매력적이에요", "사랑받아요"). Specific neutral truth is more valuable than praise.
- layered_identity.synthesis is REQUIRED whenever at least two of the four layers above are populated. It is 1 strong paragraph (4-6 sentences) answering: "WHY can these different versions of me all be true?" It explains the progression across relational distance (Public surface -> Everyday operating self -> Private self -> Natural inner orientation) as different layers unfolding at different distances ("서로 다른 모습이 아니라, 거리에 따라 드러나는 순서가 다른 것이다"). You MUST explicitly answer at least ONE of the contrast questions. Do not simply list each layer in turn; name the shift between them in natural, conversational Korean. Ground every claim ONLY in the layer narratives written above and their evidence.
  FAILED synthesis example: "처음에는 차분하고, 친해지면 다정하고, 가까우면 자유로워요." WORKING synthesis example: "처음에는 감정을 크게 드러내지 않아 안정적인 사람으로 읽힐 수 있지만, 신뢰가 쌓이면 관계를 세심하게 읽고 반응하는 면이 더 분명해져요. 아주 가까운 관계에서 더 자유롭게 보이는 것은 처음의 모습이 가짜여서가 아니라, 안전하다고 느낄수록 스스로를 조절할 필요가 줄어들기 때문일 수 있습니다."
- natural_self_and_deep_needs specifically needs an extra check before you write it: look at exactly which axis/axes you already used in gap_deep_dive and alignment_highlight, and what natural_tendency (or why_it_feels_easy) you already said about them. If natural_self_and_deep_needs would land on that same underlying trait or conclusion — not just overlapping evidence, the same point restated — you MUST omit natural_self_and_deep_needs entirely, even though [Natural Self & Deep Needs evidence] is non-empty. The mere existence of anchor evidence (strength, favorable_elements, a relational dimension) is never a sufficient reason to include this layer — only a genuinely distinct need or insight that axis_interpretations hasn't already stated is.
- STRENGTHS & WATCHOUTS (Pattern, Not People & Strength Overuse):
  - FORBIDDEN NOUN & DEFECT LABELS: NEVER use single-word defect, diagnostic, or personality-type labels as titles or text anywhere in strengths, watchouts, or energy (e.g. forbidden: "의존성", "불안정함", "완벽주의", "통제욕", "권력욕", "회피형", "의존적이다", "불안정하다", "완벽주의자다", "독단적이다", "감정적이다", "Dependence", "Instability", "Perfectionism", "Control freak", "Avoidant", "Dependent", "Unstable", "Perfectionist"). Always frame titles as concrete ACTION or BEHAVIOR PATTERNS (e.g. "중요한 결정일수록 다른 사람의 확신을 먼저 확인하는 방식", "충분히 잘하고 있어도 기준을 쉽게 낮추지 않는 방식", "말보다 먼저 분위기를 읽는 힘"). Translate descriptions using contextual, non-fatalistic language ("~하는 상황에서", "~하는 경향이 나타날 수 있어요", "~할수록 더 많은 에너지를 쓸 수 있어요", "~를 먼저 확인하는 방식이 익숙할 수 있어요").
  - STRENGTHS ("내가 자연스럽게 잘 쓰는 힘"): Freely choose 3 strengths. Each title must describe a concrete capability or natural strength in action (not generic labels like "공감 능력"). The body (5-7 sentences) must connect: (1) what comes naturally -> (2) how it appears in actual life -> (3) why this is a genuine strength/power.
  - WATCHOUTS ("잘하지만 오래 쓰면 지치는 방식"): Watchouts are NOT a separate list of character flaws, defects, or weaknesses! Frame EVERY watchout as STRENGTH OVERUSE or ADAPTATION OVERUSE: (1) an existing strength or adapted capability that you rely on well -> (2) the specific situations where it gets overused or maintained too long -> (3) the energy cost, fatigue, or friction that results (e.g. "주변의 관점을 잘 고려하는 능력은 큰 장점이지만, 중요한 결정에서도 계속 모든 사람의 반응을 확인해야만 안심이 된다면 결정보다 확인 과정에 더 많은 에너지를 쓰게 됩니다"). NEVER include self-care or wellness advice inside watchouts (e.g. forbidden: "쉬세요", "자신을 돌보세요", "마음을 비우세요", "take a rest"). Watchouts are strictly for RECOGNITION AND UNDERSTANDING ("why I feel drained by a strength I use well"), not prescriptive advice.
  - WATCHOUT DIVERSITY (sequential domain commitment — do this BEFORE writing any watchout body, not as an after-the-fact check): WATCHOUT_COST_DOMAINS = [decision_load, emotional_labor, adaptation_load, boundary_maintenance, uncertainty_handling, relationship_calibration, self_suppression]. Pick watchouts[0].cost_domain first, from whichever domain the strongest-evidenced pattern actually lives in. Then pick watchouts[1].cost_domain — it MUST be a different value from watchouts[0].cost_domain. Then pick watchouts[2].cost_domain — it MUST be a different value from BOTH watchouts[0] and watchouts[1] whenever the evidence genuinely supports a third distinct domain. Only after each cost_domain is fixed, write that watchout's title/body so its actual content matches the domain you committed to — do not pick a domain label and then write body content that actually belongs to a different domain (e.g. do not label something decision_load while the body only ever describes an emotional reaction — that means you picked the wrong domain, not that the label is decoration).
    2-DOMAIN FALLBACK (evidence outranks forcing a third domain): if the evidence genuinely only supports 2 distinct domains, do NOT invent an unsupported third domain from nothing — reuse one of the first two domains for watchouts[2].cost_domain, but its body must take a clearly DIFFERENT COST ANGLE within that domain than the watchout that already used it (e.g. one names the decision-delay itself, the other names the specific relational cost of always deferring) — never a third phrasing of the identical cost.
    SELF-CHECK (this is the failure mode that has leaked live even under the rule above, so check for it explicitly): a watchout that names a BEHAVIOR (e.g. confirms with others before acting on a decision) followed by another watchout that names that same behavior's RESULT (e.g. the indecision that behavior produces) are ONE mechanism from two angles, not two — if this happens even with different cost_domain labels attached, the labels were assigned wrong; go back and re-derive the domain from what the body actually says, not from which label sounds distinct.
  - NO INVENTED BIOGRAPHY: strengths and watchouts bodies must never invent a specific life scenario, relationship, or role that isn't in the evidence — FORBIDDEN as illustrative situations: "친구가 힘들어할 때" (when a friend is struggling), "새로운 직장에 들어갔을 때" (starting a new job), "팀 프로젝트에서" (in a team project), "상사와 이야기할 때" (talking to a boss), "가족 문제에서" (in family issues), or any other invented person/relationship/workplace/family scenario — none of that history exists in this person's evidence. Use GENERALIZED conditions instead, the same shape already used elsewhere in this prompt: "중요한 결정을 앞두고", "여러 사람의 기대를 동시에 고려할 때", "관계의 분위기를 계속 읽어야 할 때", "예측하기 어려운 상황이 길어질 때". "How it appears in actual life" (in the strengths body instruction above) means naming the CONDITION under which the pattern shows up, never a specific remembered episode with invented people in it.
  - Prefer strengths/watchouts whose central trait is NOT already the main point of an axis_interpretations or growth_edge entry. Ground each item in [Strengths & Watchouts evidence] via evidence_refs when well-supported; never invent a key.
- axis_interpretations covers ONLY the axis keys shown to you under [Axis Gap: <name>] / [Axis Alignment: <name>] below — never add an axis that wasn't given to you, never omit one that was.
- SELF-DROP CHECK (read before writing any gap_deep_dive entry): the axes shown to you were pre-selected for magnitude and thematic diversity, but real evidence can still make two of them resolve to the same real-life pattern anyway (e.g. two different axes whose gives_you would both just be "this helps you get along with others," or whose current_pattern would both just be "avoids acting on your own judgment"). Before finalizing, compare what you are about to write for each axis — if two entries would tell the same underlying story in different words, do NOT force two separate full narratives: keep the entry with the stronger, more specific evidence, and for the other axis either (a) sharply differentiate it by finding a genuinely distinct angle the evidence supports, or (b) write it briefly and explicitly note the connection to the other axis rather than re-deriving the same explanation from scratch. Never solve this by inventing a new fact to manufacture a difference — a genuine convergence in the evidence is real information, not a bug to paper over with variety for its own sake.
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
- ENERGY (headline/bars/summary/fuels/drains/optimal):
  - ENERGY SYNTHESIS ("잘하고 있는데, 왜 피곤할 때가 있을까요"): energy.summary must answer: "내가 어떤 능력을 많이 쓰고 있으며, 그 능력이 언제 힘이 되고 언제 비용이 되는가" — connecting (1) what causes energy drain + (2) why you spend so much energy in that situation + (3) what strength or adaptation is operating. NEVER simplify to "사람 = 피로" ("people make you tired, so stay alone"). Describe the situational dynamics instead (e.g. "사람들과 함께 있는 것 자체보다, 관계 속에서 상대의 반응을 계속 읽고 자신의 판단을 조정해야 하는 상황에서 더 많은 에너지를 쓰게 됩니다").
  - FUELS & DRAINS (Situational Triggers, NO Generic Wellness Advice):
    - FORBIDDEN generic wellness/lifestyle items: NEVER write generic advice items like "친구와의 깊은 대화", "자연 속에서의 시간", "스트레스", "불필요한 경쟁", "명상", "운동", "충분한 휴식" (or English equivalents).
    - Express each fuels/drains item as a CONCRETE SITUATIONAL CONDITION (e.g. "내 의도를 길게 설명하지 않아도 통하는 대화", "계속 반응하지 않아도 되는 조용한 시간", "여러 사람의 기대를 동시에 맞춰야 하는 상황", "결정 전에 너무 많은 관점을 계속 확인해야 하는 상황").
  - NO GENERIC ADVICE IN PART 05: Do NOT write generic self-care advice anywhere in energy, strengths, or watchouts (forbidden: "충분히 쉬세요", "자신을 돌보세요", "작은 성공을 축하하세요", "명상하세요", "긍정적으로 생각하세요", "쉬어가는 것이 중요합니다", "get rest", "take care of yourself", "meditate", "think positively"). Part 05 is for UNDERSTANDING ("why I feel drained"), not advice.
- energy MAY surface these additional angles inside the existing summary/fuels/drains/optimal fields, but ONLY when genuinely supported by converging evidence — never force any of them into every response:
  - Innate vs. current energy style: if the climate/elemental (innate) evidence and the energy_style/resilience (current) evidence point at a meaningfully different way of using energy, name that difference in plain, real-life terms. If they roughly agree, say nothing about a contrast — do not manufacture one.
  - Gap-driven energy cost: if a reused Current x Innate gap axis represents real adaptation or compensation, you may explain the energy cost of sustaining that adaptation. A gap is not a problem or flaw — frame it as effort/cost, exactly like gap_deep_dive's own gives_you/may_cost framing, never as something wrong with the person.
  - Strength overuse: an existing strength (from the CE strengths-group signals) may appear as a drains item ONLY when there is converging evidence that it's being used past a comfortable point (e.g. it recurs across strengths-group signals AND a caution/dimension signal) — never assert overuse from the strength's mere existence alone.
  - Pressure / conflict / emotional labor: use pressure_response and conflict_style together (plus any other converging Energy evidence) to name a specific draining situation involving pressure, disagreement, or managing others' emotions — grounded in at least one of these signals, not asserted generically.
  - Environment / rhythm / social density: make optimal more specific using only the evidence already in [Energy evidence] (solitude_autonomy, energy_style, climate, etc.) — do not invent a rhythm/pace signal that isn't there; if the evidence doesn't support a rhythm-specific claim, describe environment/social density instead.
  Each of these is independent and optional — include only what the evidence actually supports, keep total energy content the same length/shape as before (no new fields, no longer lists), and never let any of these restate a conclusion already stated in axis_interpretations, growth_edge, strengths, or watchouts — translate it into energy terms instead.
- Each fuels/drains/optimal item must name a concrete trigger or context, not a generic category label — and briefly imply why it costs or returns energy for this specific person, not just what the situation is. Prefer "a long meeting where you keep having to respond to people with little room to process alone" over "Large social gatherings"; prefer "carrying other people's schedules or moods while your own decisions keep getting pushed back" over "Too much responsibility". Ground each item's specificity in the convergence you already found in [Energy evidence] (e.g. solitude_autonomy + pressure_response together might point at a specific kind of low-privacy, high-responsiveness situation) — never invent a scenario unconnected to the evidence, and never let one signal alone dictate one item. The same underlying evidence may show up differently across fuels vs. drains vs. optimal — e.g. a low-stimulation environment might explain both a drains item (too much unstructured noise) and an optimal item (quiet, low-interruption settings) from two genuinely different angles; don't just restate one as the mirror of the other. Keep every item to one concise phrase or short sentence (still a scannable list item, not a paragraph). Never write a blanket claim like "you dislike people" or "you're an introvert" — describe the specific pattern or context instead. Keep fuels, drains, and optimal meaningfully distinct from each other — avoid two items across these three lists restating the same situation from interchangeable angles unless it's a genuinely separate, specific insight.${
      input.part01Evidence?.adaptationStoryEligible
        ? `
- adaptation_story is the report's central synthesis, not a sixth axis card and not a recap — write it LAST, after everything else above, but do NOT simply reorganize or paraphrase what you already wrote there. Go back to the underlying evidence (this axis's Innate/Current Self facts, the layered_identity evidence, the energy evidence) and find what emerges when you hold two or more of those signals together — a genuine synthesis produces a claim none of the individual sections above already made in other words, not a summary of them. Concretely: simply stating "본래는 자기 판단이 중요한데, 현재는 관계 신호를 많이 확인한다" side by side is NOT yet the emergent claim — that's just signal A plus signal B stated separately. The emergent claim is the higher-order pattern their combination reveals — something like naming that the energy actually goes not into the decision itself but into confirming afterward that the choice won't disturb the relationship, so the cost shows up as a confirmation ritual layered on top of an otherwise-capable decision process. Only write a claim at that level when the evidence genuinely supports it; never invent the specific mechanism if the evidence only supports the two signals stated separately. It answers "how did these differences add up into the way this person actually lives" — never repeats an axis_interpretations entry or layered_identity layer in the same words, translates them into one connected story instead. Never invent a specific past event, relationship, job, or childhood circumstance to explain the pattern — ground every sentence only in the evidence already shown/written above in this response. Never address the reader as 고객님/귀하/회원님 or any other customer-service honorific — plain 해요체 second person, no repeated subject. Scale your confidence language to how strongly the evidence actually converges — do not write with more certainty than the evidence supports, and do not hedge everything into vagueness when the evidence is genuinely strong either.
- adaptation_story MUST be 2-5 short paragraphs with an actual blank line (\\n\\n) between every pair of them — a single dense wall-of-text block is a FAILED response even if the content itself is good. All five beats in the narrative instructions (natural direction / current reliance / what it enables / what it may cost / integrated closing) must be covered — adjacent beats may share one paragraph when they genuinely flow together, but the final beat (integrated closing) always gets its own last paragraph, never folded into an earlier one.
- adaptation_story has ZERO advice, ZERO next steps, and ZERO forward-looking capability-building language — this has been observed leaking in live output and is explicitly forbidden, including any close variant of: "~연습을 통해 ~을 높일 수 있어요" (practicing X can raise Y), "~하다면 더 많은 기회를 잡을 수 있어요" (if you do X you'll seize more opportunities), "더 나은 균형을 찾아가는 것이 중요해요" / "균형을 찾는 과정에서 ~ 회복할 수 있을 거예요" (finding/recovering better balance matters), "앞으로도 계속 성장해 나갈 수 있을 거예요" (you'll keep growing), "~하는 것이 중요하다는 점을 인식/기억해야 해요" (recognizing/remembering that X matters), "~은 당신의 삶을 더 풍요롭게 만들어줄 거예요" (X will enrich your life), or their English equivalents ("developing X could help", "finding balance is key", "you'll continue to grow", "it's important to remember/recognize that..."). None of these contain an imperative verb like "해보세요" but all of them are still advice — they tell the reader what to pursue, prioritize, or recognize, and promise an outcome if they do. If a sentence implies what should happen next or what a change would earn the reader — delete it or rewrite it as a plain observation of what already is, right now, with no forward pointer at all. ALSO STRICTLY FORBIDDEN anywhere in this field, as sentence endings (this is a category, not just the examples above — any ending with this shape is forbidden even if the exact words differ): "~해야 해요", "~할 필요가 있어요", "~하는 것이 중요해요", "~연습해보세요"/"~연습해 보세요", "~활용해보세요"/"~활용해 보세요", "~시도해보세요"/"~시도해 보세요", "~기억하세요". This is about the sentence's ENDING specifically — a sentence that merely describes a real, already-existing cost or effort using a different verb shape, such as "~할 필요가 생길 수 있어요" (a plain description that a need CAN arise, not an instruction to act on it), is not what this bans; the difference is whether the sentence tells the reader to do something (banned) versus describes what is already true (allowed).
  This applies MOST to the closing (5th) paragraph, where this leak has been observed repeatedly even after everything above — it is not immune just because it's "the wrap-up". FAILED PATTERN (observed live, do not reproduce even in paraphrase): a sentence that promises a future payoff for a future action — the shape "이런 균형을 찾는 과정에서 [자질]도 다시 회복할 수 있을 거예요" or "[행동]하면 삶이 더 풍요로워질 거예요" — both are advice wearing a summary's clothes, no matter which specific words fill the brackets. WORKING STRUCTURE for the 5th paragraph (do not copy a fixed sentence for this — build your own wording each time from the natural_tendency/current_pattern material you already wrote above in THIS response): a present-tense statement that (a) names the current way of living, in your own words from beat 2 above, (b) names the natural/original direction, in your own words from beat 1 above, (c) states plainly that both are part of this one person right now — coexist, not compete — without ranking one as more real or more true than the other, and (d) makes no claim about pursuing, recovering, building, or any future result. If two different responses could share the exact same 5th-paragraph sentence word-for-word, that sentence is too generic — it must be specific enough that it could only follow from what you personally wrote in beats 1-4 of THIS response.`
        : ""
    }`
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
    "fit": ["a trait/condition in the OTHER person + why it specifically eases THIS user's own pattern, one phrase grounded in this user's own evidence, never copied from any example shown elsewhere in this prompt — never a bare virtue noun, never a mirror-copy of this user's own strength", "item 2", "item 3"],
    "friction": ["an INTERACTION MECHANISM that creates friction, one phrase grounded in this user's own evidence, never copied from any example shown elsewhere in this prompt — never a bare trait-mismatch label on the other person", "item 2", "item 3"],
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
    "remember": [
      "Keep (what to keep without forcing change): 3-5 sentences — plain text directly, DO NOT include '01 Keep' or question labels in text",
      "Loosen (what to no longer constantly prove/perform): 3-5 sentences — plain text directly, DO NOT include '02 Loosen' or question labels in text (NEVER frame as a flaw)",
      "Recover (what to reclaim for yourself): 3-5 sentences — plain text directly, DO NOT include '03 Recover' or question labels in text"
    ],
    "leap": "Decision Compass for future choices: 3-5 sentences — one concrete decision criterion to verify before your next major choice, using explicit choose-more/choose-less language (NO predictive claims, NO generic advice)"
  },
  "closing": "EXACTLY 2 sentences, no more — sentence 1 names the current way and the natural way both being real right now (RECOGNITION), sentence 2 names that their difference is now something the reader can see, not something to resolve, ending in a present-tense recognition shape like '~게 되었다는 점입니다.' (INTEGRATION). NO third sentence, NO advice, NO prediction, NO praise/evaluation of the insight, NO cheers/encouragement, NO customer service tone — see the closing rules below for exactly why a 3rd+ sentence is forbidden, not just discouraged.",
  "checklist": ["One Next Move: exactly 1 small, concrete, grounded experiment action you can try once this week (NO generic homework or task dumps)"]
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
// closing is not grounded by this evidence block (no evidence_refs of its own),
// but Batch 5 did add real prompt/schema rules for it — see the closing
// (조용한 매듭 / Recognition Statement) block below and the closing description
// in DEEP_ESSENCE_PART_B_SCHEMA.

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

■ Future Evidence — grounding material only (internal keys in brackets; never quote raw keys/codes to the reader). Use ONLY to decide future.remember/leap and to fill its optional evidence_refs. closing draws no evidence_refs from this block, but it is NOT an untouched free-form sign-off either — see the closing (조용한 매듭 / Recognition Statement) rules below (present-tense recognition, no advice/cheers/wishing).
[Future evidence]
${input.part01Evidence.futureText}
`
    : "";

  const groundingRules = grounded
    ? `
- relationships must be grounded in [Relationship evidence] via convergence across multiple signals — never let a single dimension/axis/secondary score decide pattern/fit/friction/compare alone, and use conditional language when a signal's confidence is low or mixed. Translate identity-trait evidence into its RELATIONAL meaning — never restate a trait the same way Part01/Part02 already described it; say something new about how it plays out specifically in relationships. You may reuse the same evidence already used elsewhere (e.g. an axis gap, a Part02 drains signal), but the conclusion here must be relationship-specific, not a repeated identity or energy conclusion.
- pattern answers "how do I connect with people" — a whole-relational-style read, grounded in convergence across the evidence, not any single signal.
- fit answers "what kind of person/condition genuinely fits me" — but a fit item is NEVER just a trait label; it must express the OTHER person's trait or behavior together with why that specifically eases THIS user's own pattern. Use this TEMPLATE, never a ready-made sentence: name the specific thing the other person does or doesn't do, then name the specific effect that has on THIS user's own pattern (already established above in axis_interpretations/energy/strengths/watchouts) — filled in ONLY with this user's own evidence, never a stock phrase about patience, pacing, or waiting that could describe anyone's ideal partner. FORBIDDEN as a fit item on its own, without a mechanism attached: universal-virtue nouns ("좋은 사람", "이해심 많은 사람", "소통 잘하는 사람", "신뢰할 수 있는 사람", "kind person", "good communicator", "understanding person") — these may appear only as part of a longer phrase that also names the mechanism, never standing alone. MIRROR-COPY IS FORBIDDEN: never simply restate one of this user's own strengths/titles as the trait the other person should have (e.g. if this user's own strength is empathy, "공감을 잘하는 사람이 잘 맞는다" is a forbidden mirror-copy) — fit describes what THE OTHER PERSON brings that complements or steadies this user's specific pattern, not a copy of this user's own strengths list.
- friction answers "what interaction pattern creates friction for me" — a friction item is NEVER a trait-mismatch label on the other person; it must describe the INTERACTION MECHANISM that produces friction. Use this TEMPLATE, never a ready-made sentence: name what both people are doing (or what one person needs and doesn't get), then name why that specific combination creates friction for THIS user, grounded in this user's own watchouts/axis gaps/conflict_decompression evidence — never bare labels like "결정을 못하는 사람", "감정을 표현하지 않는 사람", "갈등을 피하는 사람". Specifically consider conflict_decompression (how this person cools down / processes after conflict) as a strong candidate signal here when its confidence is usable; never invent a friction pattern unconnected to the evidence.
- REUSE CHECK for fit/friction: the templates above describe SHAPE only and contain no complete sentence to copy — if your fit or friction item ever reads as a smooth, generic sentence about patience, waiting, space, or timing that could apply to anyone's ideal partner, that is a sign you defaulted to a stock phrase instead of filling the template from THIS user's own [Relationship evidence]. A fit/friction item that would read identically on a different user's report has failed the same test as a generic virtue label — go back to the evidence and name the specific pattern it creates ease/friction with.
- compare answers "a way this person tends to get hurt → a way to instead offer steadiness" (wound -> steady) — ground the wound side in real evidence (e.g. criticism_sensitivity, boundary_defense_strength, pressure_response), and make sure this is NOT a restated Part01 watchout — it must specifically be about how the person gets hurt or steadied in a relational moment, not a general character flaw.
- intimacy_expression_style, support_giving_style, and boundary_defense_strength are especially relevant to pattern/fit; conflict_decompression is especially relevant to friction/compare — use them when they genuinely fit, never force all of them into every field.
- evidence_refs is optional — only exact keys from [Relationship evidence], never invented.
- pattern MAY include a short thread on the functional role this person tends to occupy in relationships (e.g. mediator, caretaker, fixer, observer, lead) — grounded in support_giving_style/boundary_defense_strength/expression_style/recognition_need. Answer ONLY "what role do I tend to end up in," never re-describe the underlying trait itself (that's Part01's job) — name the function, not the personality. Omit this thread entirely if the evidence for it is thin; do not force a role onto every response.
- pattern MAY also include a short thread on how this person's natural relational tendency differs from how they currently behave in relationships, using primary_gap_axis / alignment_axis from the excerpt above (if present) — but ONLY when that difference actually shows up in a relational way, and ONLY as a brief translation of how it plays out in relationships (not a restatement of primary_gap_axis's own natural_tendency/current_pattern/cost fields, which Part A already covered in full). Omit entirely when neither is present, or the axis doesn't meaningfully manifest in relationships, or the evidence is thin.
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
- FUTURE & DECISION COMPASS (Going Forward with Agency):
  - FORBIDDEN PREDICTIVE FRAMING: NEVER use predictive, fortune-telling, or fortune-promising language anywhere in future, closing, or checklist (forbidden: "당신에게 다가올 것", "앞으로 이런 일이 생길 거예요", "당신의 미래에는", "다음 단계에서는 반드시", "성장할 것입니다", "미래에는 ~할 것입니다", "what lies ahead", "in your future", "you will grow", "will happen"). Frame everything as AGENCY — decision criteria for choices you control today and going forward.
  - FORBIDDEN SELF-HELP/CUSTOMER SERVICE CHEERS: NEVER use customer service or self-help filler anywhere in Part 07 (forbidden: "고객님", "회원님", "귀하", "응원합니다", "성공할 것입니다", "더 나은 사람이", "성장해야", "노력하세요", "반드시", "작은 성공을 축하하세요"). Write like a quiet, dignified advisor offering one clear decision compass.
  - remember must be EXACTLY 3 DECISION FACTS, each carrying a distinct role (write plain prose directly, DO NOT quote or echo the schema instruction or questions like '01 Keep' or '무엇을 굳이 바꾸지 않아도 되는가?' in the text):
    Each of the 3 roles below draws from a DIFFERENT evidence source — do not let them draw from the same pool interchangeably, and do not let two roles converge on the same underlying claim just phrased differently:
    1. remember[0] (계속 가져갈 것 / Keep): "무엇을 굳이 바꾸지 않아도 되는가?" — ground this in the best-aligned axis marked "ground remember[0] (Keep) here" in [Future evidence] below, or another strongly-supported current+innate alignment/strength already established above. A natural strength or direction that already fits well. Write as a criterion to keep trusting without forcing change.
    2. remember[1] (조금 덜 해도 되는 것 / Loosen): "무엇을 계속 증명하거나 수행하지 않아도 되는가?" — ground this in an adaptation-overuse or watchout pattern already established above (an adaptation or strength useful in the past but prone to overuse today), never the same axis you used for Keep or Recover. Write as what to loosen or no longer constantly perform (NEVER frame as a character flaw or bad habit).
    3. remember[2] (다시 회복해도 되는 것 / Recover): "내가 다시 내 쪽으로 가져와도 되는 것은 무엇인가?" — ground this in the axis marked "ground remember[2] (Recover) here" in [Future evidence] below when present (a natural tendency the person has genuine capacity for but currently uses less than their innate baseline); when no such axis is available, ground it in [Natural Self & Deep Needs] material instead of inventing an underused-tendency claim. Write as permission to return to one's own inner compass (e.g. "중요한 선택에서 다른 사람의 관점을 충분히 들은 뒤에도, 마지막 판단은 자신의 내면 신호로 돌아와도 괜찮다는 점을 기억하세요") — this must be a genuinely different claim from Keep, not the same alignment restated as "return to."
  - leap (선택할 때 기억할 단 하나의 기준 / Decision Compass):
    - A single, explicit decision criterion to filter future choices regarding work, relationships, people, and environments. Answer: "Before my next major choice, what criterion should I verify?"
    - Must be structured around explicit choose-more / choose-less language (e.g. "앞으로 중요한 선택을 앞두고, ___ 한 환경을 우선 선택하고, ___ 한 상황은 되도록 피하는 것을 하나의 판단 기준으로 삼을 수 있어요").
    - NEVER generic encouragement ("trust yourself", "believe in the journey") or prescriptive homework.
  - checklist (지금 당신에게 가장 중요한 한 가지 / One Next Move):
    - EXACTLY 1 ITEM (string array with 1 item).
    - MUST be explicitly connected to ONE of these already-established anchors — pick whichever is most central to this person's report, and the action must clearly trace back to it, not float free of everything else written above: the growth_edge (summary.growth_edge / growth_edge_real_life_pattern in the excerpt above), the primary/widest axis gap (primary_gap_axis in the excerpt above, if present), the adaptation tension (adaptation_recognition in the excerpt above, if present), a recurring decision pattern (playbook.rule or a rows[] entry from THIS response), or the Recover signal (future.remember[2] from THIS response). A reader who has just read the rest of the report should be able to see why THIS action, for THIS person, follows from what was already said — if it could be handed to any reader of any report unchanged, it has failed.
    - A single, concrete, testable experiment action expressed in the language of experiment (e.g. "다음 중요한 결정을 앞두고 다른 사람의 의견을 묻기 전에, 먼저 '나는 지금 무엇을 원하지?'를 한 문장으로 적어보세요").
    - FORBIDDEN: task dumps, 8-12 item homework checklists, generic self-care advice ("명상하세요", "자신감을 키우세요", "기록하세요", "친구에게 연락하세요"), and any action untethered to the anchors above (e.g. "이번 주 하루를 골라 기억에 남는 순간 하나를 적어보세요" is forbidden precisely because it connects to nothing else in the report).
  - closing (조용한 매듭 / Recognition Statement): closing is NOT a new insight — Decision Compass and One Next Move already gave the reader agency earlier in this same response. closing is EXACTLY 2 SENTENCES, NEVER MORE — this is a hard structural limit, not a style preference. Root cause of every leak observed in live QA so far: every single violation (a prediction, a praise/evaluation, an instruction to the reader, a cheer) showed up in a 3rd, 4th, 5th, or 6th sentence the model added beyond the required two — never in sentence 1 or 2. There is no legitimate 3rd sentence for this field: RECOGNITION and INTEGRATION are the whole job, both fit in two sentences, and a report that reaches for a 3rd sentence is, by definition, reaching for something this field doesn't need — write two sentences and STOP, do not round out the paragraph.
    - Sentence 1 (RECOGNITION): names that the current way and the natural way are both real, right now — built fresh from primary_gap_axis's natural_tendency/current_pattern in the excerpt above when present; otherwise build it from what you yourself already wrote in relationships/playbook/future earlier in THIS response. Either way, write your own sentence from that material — not a stock opening line, and not a copy of the excerpt's wording.
    - Sentence 2 (INTEGRATION): names that their difference is now something the reader can see, not something to resolve, and MUST end in a present-tense statement of recognition (the grammatical shape "~게 되었다는 점입니다." or "~게 되었습니다." is fine to reuse as a SENTENCE-ENDING PATTERN, but the sentence content before it must be built fresh, not copied). Nothing may follow this sentence.
    - A closing that could be pasted unchanged onto a different person's report, word-for-word, has failed this field regardless of how well-formed the sentences are.
    - Compact reference only (do not use these as a checklist to satisfy word-for-word — the two-sentence limit above is what actually prevents these, not recognizing the words): a 3rd+ sentence tends to drift into PREDICTION (promising what will happen next), EVALUATION (praising how meaningful/great the insight is), ADVICE (telling the reader what to do), or CHEERING (wishing them well) — all four are forbidden in any wording, but the real fix is that none of them have a sentence slot to occupy.
- evidence_refs (future) is optional — only exact keys from [Future evidence], never invented.`
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
- checklist (One Next Move) is EXACTLY 1 ITEM — a string array with exactly one entry. This is the SOLE checklist-length rule anywhere in this prompt.
- checklist has a DIFFERENT job than playbook and future, even though they cover related ground — never let it collapse into either:
  - playbook = what to DO when a specific situation happens (in-the-moment response)
  - future = what CRITERIA to use when choosing, going forward (durable principle)
  - checklist = the single most concrete, testable thing this person can actually try once this week, connected to the report's core insight — never an in-the-moment coping instruction, a repeated relationship script, a recovery recommendation, or a future decision principle; those roles already belong to playbook/future.
  The one item must be a short imperative naming a real, specific action, not a piece of advice, a trait description, or motivation. Prefer an action that lets the person TEST or NOTICE something about themselves (try one different response once, write down one specific example, compare how they felt before/after one choice) — structural guidance, not a fixed template to force in verbatim.
  In Korean specifically, the item should contain BOTH a bounded execution unit (오늘 / 이번 주 / 한 번 / 한 상황 / 일정에 한 칸 / 한 문장 적기) AND a concrete observable action verb (적는다 / 정리한다 / 한 번 시도한다 / 일정에 넣는다) — avoid vague advice endings like ~해보세요 / ~하는 것이 좋아요 / ~하는 것이 중요해요 when the sentence has no bounded action behind it.
  SEMANTIC duplication guard — before finalizing, compare the item's ACTION (not its wording) against playbook.rows[].better, playbook.heated, playbook.reset, future.remember[], and future.leap. If doing the checklist item would effectively mean doing the same thing one of those fields already told the person to do, don't write it — change the action itself, not just the wording, tense, sentence order, or by prepending a time phrase. Adding "이번 주" to an already-existing action does NOT make it new. Example: heated says "감정이 격해질 때 깊게 숨을 쉬고 감정을 정리하세요" — a checklist item like "이번 주 감정이 격해질 때 깊게 숨을 쉬어보세요" is STILL a duplicate (same action, a time phrase bolted on); "이번 주 갈등이 있었던 한 상황을 골라, 그때 바로 말하지 못했던 내용을 한 문장으로 적어보세요" is a genuinely different, new action on a related theme. This check is about the ACTION being literally the same instruction restated — it is NOT a reason to avoid touching the same underlying theme/evidence as playbook or future; a One Next Move that is clearly connected to the report's central tension is the goal, not a defect.
- Continue without contradicting the earlier strengths/watchouts/energy content.${groundingRules}

JSON schema:
${buildPartBSchema(input.part01Evidence)}

Respond with exactly one JSON object matching the schema above.

${buildLlmOutputLocaleInstruction(outputLocale)}`;
}
