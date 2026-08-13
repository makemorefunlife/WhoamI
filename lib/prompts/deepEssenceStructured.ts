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

function buildPartASchema(grounded: boolean): string {
  if (!grounded) return DEEP_ESSENCE_PART_A_SCHEMA;
  const withSummaryFields = DEEP_ESSENCE_PART_A_SCHEMA.replace(
    `"growth_edge": "a short phrase for the growth edge (1-3 words, e.g. Decisiveness)"`,
    `"growth_edge": "a short phrase for the growth edge (1-3 words, e.g. Decisiveness)"${GROUNDING_SUMMARY_FIELDS}`,
  );
  // Insert as a new top-level key right after the "energy" block closes,
  // before the schema object's own closing brace.
  return withSummaryFields.replace(
    /\n(\}\s*)$/,
    `${LAYERED_IDENTITY_SCHEMA_FIELD}\n$1`,
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

  const evidenceBlock = input.part01Evidence
    ? `
■ Part01 Identity Evidence — grounding material only (internal keys in brackets; never quote raw keys/codes to the reader). Use ONLY to decide core_mode / growth_edge / layered_identity and to fill their optional evidence_refs.
[Core Mode evidence]
${input.part01Evidence.coreModeText}

[Growth Edge evidence]
${input.part01Evidence.growthEdgeText}

[First Impression evidence]
${input.part01Evidence.layeredIdentity.firstImpressionText}

[Known Self evidence]
${input.part01Evidence.layeredIdentity.knownSelfText}

[Close Private Self evidence]
${input.part01Evidence.layeredIdentity.closePrivateSelfText}

[Natural Self & Deep Needs evidence]
${input.part01Evidence.layeredIdentity.naturalSelfAndDeepNeedsText}
`
    : "";

  const groundingRules = grounded
    ? `
- Ground core_mode in MULTIPLE signals from [Core Mode evidence] — never a single axis, element, ten-god, or dimension alone. List the exact bracketed keys you used in core_mode_evidence_refs; never invent a key that isn't in the list.
- Ground growth_edge in MULTIPLE signals from [Growth Edge evidence]. Do not simply pick the widest current/innate gap — weigh it together with dimension confidence, mixed-state flags, and repeated friction/cost signals to judge which area has the most real-life leverage if improved now. List the exact bracketed keys you used in growth_edge_evidence_refs; never invent one. growth_edge_why/growth_edge_real_life_pattern/growth_edge_if_developed are optional — include only when genuinely grounded.
- layered_identity is a 4-layer synthesis: first_impression (from [First Impression evidence] only), known_self (from [Known Self evidence] only), close_private_self (from [Close Private Self evidence] only), natural_self_and_deep_needs (from [Natural Self & Deep Needs evidence] only). Each layer's evidence_refs may ONLY reference keys from that layer's own bracketed list — never borrow a key from another layer's list or from Core Mode/Growth Edge evidence. There is no single fixed formula (e.g. month pillar = first impression) — weigh the whole bucket, including confidence and mixed-state flags, and let convergence across multiple signals decide. If a layer's bucket has too little usable signal, OMIT that entire layer key rather than forcing a narrative from thin/single evidence. Never invent an evidence key.`
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
${buildPartASchema(grounded)}

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
