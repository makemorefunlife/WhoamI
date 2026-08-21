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
  "adaptation_story": { "narrative": "2-5 short paragraphs, each ONE-TO-THREE sentences, joined with a literal blank line (\\n\\n) between every paragraph — never one dense wall-of-text block. CROSS-QUESTION SYNTHESIS REQUIREMENT: Synthesizes evidence answering at least TWO DIFFERENT questions (e.g. Relational Distance from layered_identity + Current/Innate Gap from axis_interpretations, OR Lived Strategy + Saju/CE structural tendency). A Part 04 built around only one axis (such as autonomy alone) is INSUFFICIENT. DO NOT write a Fact A -> Fact B -> Strength C -> Cost D recap (that structure belongs to Part 03). Instead, derive an EMERGENT CLAIM answering: 'What common internal logic explains why these two different observations coexist?' CONCEPTUAL TEST: If you remove any one of the main evidence families, the claim MUST NOT be obvious. REQUIRED HIGHER-ORDER MOVE: At least one sentence MUST explicitly perform one of these functions (without adding label headers to text): RECONCILE AN APPARENT CONTRADICTION, EXPLAIN WHY TWO DIFFERENT SELVES COEXIST, IDENTIFY A COMPENSATION PATTERN, IDENTIFY A PROTECTIVE STRATEGY, IDENTIFY HOW ONE STRENGTH WAS BUILT TO SUPPORT ANOTHER NEED, or IDENTIFY WHY OUTSIDERS MAY MISREAD THE PERSON. Paragraph order: (1) natural/innate direction across evidence; (2) lived current behavioral strategy; (3) functional capability gained; (4) cost incurred; (5) person-specific recognition closing. BANNED GENERIC CLOSINGS: NEVER write generic closings such as '여러 모습이 모두 당신이에요', '서로 다른 모습이 아니라 연결되어 있어요', '이것도 당신의 한 부분이에요', '현재와 본래가 조화를 이룹니다', or '지금의 모습과 본래의 경향은 서로 다른 것이 아니라...'. The closing MUST refer to the ACTUAL specific pattern discovered (e.g., '사람을 중요하게 여기는 마음과 내 공간을 지키려는 태도는 서로 반대가 아니라, 관계 안에서 흔들리지 않기 위해 함께 커진 두 힘일 수 있어요'). Never declare one self fake or suppressed, and never end with advice or next steps.", "evidence_refs": ["REQUIRED — 2-4 exact keys already shown above in this response's Axis Gap/Alignment, Layered Identity, or Energy evidence blocks representing AT LEAST TWO distinct evidence families (e.g. one axis key like axis:autonomy AND one layered identity key like pillars.month.stem_ten_god or dimension:solitude_autonomy) — never omit evidence_refs"] }`;

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
  /** IA Batch 3 — see hasAdaptationStoryEvidence in formatPart01EvidenceForPrompt.ts. */
  adaptationStoryEligible: boolean;
  storyPlan?: import("../report/buildPersonalPart04StoryPlan").PersonalPart04StoryPlan | null;
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

${
  input.part01Evidence.storyPlan
    ? `[Part 04 Story Plan — PRE-SELECTED SYNTHESIS FRAMEWORK]
Primary Adaptation: ${input.part01Evidence.storyPlan.primaryAdaptation.axis} (${input.part01Evidence.storyPlan.primaryAdaptation.innateBaseline} -> ${input.part01Evidence.storyPlan.primaryAdaptation.currentMode})
Secondary Contrast: ${input.part01Evidence.storyPlan.secondaryContrast?.description || "None"}
Required Primary Refs (MUST include at least one in evidence_refs): ${JSON.stringify(input.part01Evidence.storyPlan.requiredEvidence.primaryRefs)}
Required Contrast Refs (MUST include at least one in evidence_refs): ${JSON.stringify(input.part01Evidence.storyPlan.requiredEvidence.contrastRefs)}
Current Mechanism: ${input.part01Evidence.storyPlan.currentMechanism?.label || "None"}
Supporting Structure: ${input.part01Evidence.storyPlan.supportingInnateStructure?.label || "None"}
Gained Capability: ${input.part01Evidence.storyPlan.gainedCapabilityFocus?.concept}
Hidden Cost: ${input.part01Evidence.storyPlan.hiddenCostFocus?.concept}
Target Tension: ${input.part01Evidence.storyPlan.synthesisFrame.targetTension}
SYNTHESIS QUESTION TO ANSWER: ${input.part01Evidence.storyPlan.synthesisFrame.question}
Allowed Evidence Refs for adaptation_story: ${JSON.stringify(input.part01Evidence.storyPlan.selectedEvidenceRefs)}`
    : ""
}
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
- CROSS-AXIS SEMANTIC BOUNDARIES (read before writing any gap_deep_dive entry):
  When multiple related axes are selected (e.g. Growth, Adaptability, Stability, Structure), do NOT differentiate them merely by using different words for the same "change vs safety" story. Each axis answers its OWN distinct behavioral mechanism:
  - GROWTH (성장지향성) = whether the person naturally seeks expansion, challenge, learning, and new possibility (Cost = suppressing curiosity / repeatedly choosing proven, risk-minimized territory).
  - ADAPTABILITY (적응성/유연성) = how readily the person changes methods AFTER conditions actually change (Cost = pivot lag / stance switching speed when circumstances suddenly shift — NOT risk checking).
  - STABILITY (안정지향성) = how much uncertainty, unpredictability, and risk the person naturally tolerates (Cost = uncertainty monitoring / threat scanning / hyper-vigilance toward disruption — NOT pivot lag).
  - STRUCTURE (체계성) = how much predefined organization, sequence, rules, or process the person needs to operate comfortably (Cost = rebuilding order / maintaining procedures / friction when working without explicit guidelines).
  - AUTONOMY (자율성) = how much personal judgment vs external input drives decisions (Cost = carrying sole decision responsibility weight / isolation in choice).
  - CONNECTION (관계지향성) = how much relational closeness and interpersonal consideration is naturally included in functioning (Cost = emotional scanning / managing relational distance).
  Their gained capability (gives_you) and hidden cost (may_cost) MUST answer these different behavioral mechanisms. If the evidence cannot support a genuinely distinct mechanism for a selected axis, keep its claim modest rather than inventing differentiation.
- For every gap_deep_dive entry, follow this exact 4-part semantic contract order and role for each field, and respect the axis's own "Direction fact" line exactly (never contradict it — if it says Current is higher, natural_tendency must describe something genuinely different from current_pattern, not a restatement of the same trait; likewise if Innate is higher):
  1. natural_tendency ("본래 더 편한 방식") — what was natural originally / the innate tendency, grounded ONLY in [Innate Self evidence].
  2. current_pattern ("현실에서 익숙해진 방식") — how the person actually operates on this axis today in real life, grounded ONLY in that axis's own "Current Self evidence" plus the general survey material — never Innate/Saju facts.
  3. gives_you ("그 과정에서 얻은 힘") — GAINED CAPABILITY: a concrete, behaviorally specific earned competence that adaptation created (e.g. "여러 관점을 함께 보고 조율하는 능력", "불확실한 상황에서도 구조를 세워내는 능력", "결정 후의 영향까지 사전에 계산하는 습관"). NEVER generic positive spin ("성장할 수 있었어요", "좋은 사람이 되었어요", "공감 능력이 좋아졌어요").
  4. may_cost ("대신 더 많이 쓰게 된 에너지") — HIDDEN COST / EFFORT: explain the specific cognitive/emotional processing mechanism that is expensive (e.g. "너무 많은 관점을 동시에 활성화해 두는 것", "결정 전에 반복해서 확인 과정을 거치는 것", "상대의 감정 반응을 계속 스캐닝하는 것"). NEVER generic friction ("스트레스를 받아요", "피곤해요", "에너지가 많이 들어요").
  may_work_better is optional — include only with a genuinely evidence-grounded, comfort-improving suggestion.
  Never frame the gap itself as a flaw, mistake, or failure — adaptation is NOT failure, lost self, or a damaged potential. current_pattern is a real, valid, earned capability this person operates with today, not a lesser or "fake" version of them.
- For alignment_highlight, answer:
  1. natural_tendency ("본래 더 편한 방식") — what comes naturally.
  2. current_pattern ("지금도 자연스럽게 쓰는 방식") — how the person still operates today without strain.
  3. why_it_feels_easy ("그래서 힘을 덜 들이고 잘 쓰는 부분") — why this takes low effort and does not require forcing or convincing oneself. Do NOT force an artificial cost or flaw onto an aligned axis.
- NATURAL KOREAN SELF-RECOGNITION TONE:
  Write so the reader feels "누가 나를 이해해서 설명해주는 것" (natural self-recognition), NOT "전문가가 제3자를 평가한 임상 기록".
  FORBIDDEN stiff report/clinical phrasing: "심리적 중압감을 지속적으로 받게 됩니다", "높은 방어력을 갖추게 되었습니다", "높은 중압감과 긴장감을 호소할 수 있습니다", "각종 변수로부터 차단합니다", "효율성을 극대화합니다", "정체감을 겪습니다", "과도한 신체적·정신적 긴장감을 유지합니다". Prefer natural, human phrasing (e.g. "결정마다 마음의 무게를 크게 느끼곤 합니다", "내 중심과 영역을 단단히 지키는 힘이 생겼습니다", "몸과 마음에 긴장을 자주 쥐고 있게 됩니다").
- STRICT BANS FOR PART 03:
  - ZERO ADVICE BAN: NEVER include advice, instructions, or prescriptions anywhere in axis_interpretations (FORBIDDEN: ~하세요, ~해보세요, ~하는 것이 중요해요, ~할 필요가 있어요, ~기억하세요, ~조심하세요). Part 03 is strictly for OBSERVATION & RECOGNITION.
  - NO TRADITIONAL SAJU JARGON LEAKAGE: Translate all traditional Saju/Shinsal/Branch relation evidence into plain human meaning. FORBIDDEN raw Saju terms in user-visible text (e.g. "편관이 있어서", "충이 있어서", "현침살 때문에", "도화살", "천을귀인", "합/충/형/파/해").
  - NO TRUE-SELF / FAKE-SELF LANGUAGE: In English, avoid "True Self", "real self", "fake self". In Korean, avoid "진짜 나", "가짜 나" — prefer 본래의 경향 / 자연스러운 성향 / 현실에서 익숙해진 방식 / 적응해온 방식.
  - NO INVENTED BIOGRAPHY & NO LIFE-STORY SYNTHESIS: Save cross-axis life story for Part 04. Do NOT say "당신은 평생...", "어린 시절부터...", "이 패턴이 인생 전체를...".
  - NO CROSS-AXIS MECHANISM REPETITION: Up to 3 selected gap axes must highlight distinct semantic mechanisms grounded in their specific secondary psych signals — do not let all three collapse into a monotone loop of "caring about others' opinions" or generic "change vs safety".
  - SELF-DROP CHECK: Compare selected gap axes before writing — if two entries would tell the same underlying story in different words, do NOT force two separate full narratives. Never solve this by inventing a new fact to manufacture a difference.
- Never translate raw current/innate/delta numbers into prose — describe concrete, real-life behavior and situations instead. Never let a single five-element/ten-god/psych-axis signal alone decide any field — look for convergence, and use conditional language when confidence is low or evidence is mixed. current_evidence_refs may only reference that exact axis's own bracketed Current Self keys (never another axis's); innate_evidence_refs only the shared Innate Self pool's keys. Both optional; never invent a key.
- ENERGY ECONOMICS & RECOVERY ARCHITECTURE (PART 05 — energy, strengths, watchouts):
  - SEMANTIC OWNERSHIP BOUNDARY: Part 05 answers: "When does my way of functioning consume energy, and what restores it?" Transform all evidence into an ENERGY QUESTION: activation condition, processing load, accumulated cost, depletion signs, restorative condition, and sustainable pattern.
  - CORE MODEL (ENERGY IS NOT GOOD VS BAD): Frame traits as NATURAL STRENGTH -> PROLONGED USE IN DEMANDING CONDITION -> PROCESSING COST -> DEPLETION -> RECOVERY CONDITION. Deliver the insight: "잘하는 일이기 때문에 더 오래 쓰고, 더 오래 쓰기 때문에 오히려 늦게 피로를 알아차릴 수 있다".
  - MANDATORY MECHANISM FIDELITY (PRIMARY MECHANISM IS THE SEMANTIC CENTER):
    - You MUST make the assigned [PRIMARY MECHANISM] in [Energy evidence] the semantic center of headline, summary, fuels, drains, strengths, and watchouts.
    - STRICTLY FORBIDDEN MOTIF REGRESSION: If SOCIAL_MONITORING is NOT the assigned Primary mechanism, you are STRICTLY FORBIDDEN from using generic social-monitoring motifs ("타인의 의견/확신을 지나치게 확인", "여러 사람의 기대를 맞춰야 함", "상대 반응 스캐닝", "관계에서의 불안감", "변화에 대한 저항감") as dominant drains or watchout titles!
    - PROFILE MECHANISM CENTERING:
      * For DECISION_LOAD / CONTROL_LOAD (e.g. P2): Semantic center = carrying final judgment, too many variables before commitment, responsibility without authority, repeated consensus negotiation, inability to close a decision. Fuels = autonomous execution without approval delay, clear boundary & direct control. Drains = carrying responsibility without authority, endless consensus negotiation, external disruption of plan.
      * For STRUCTURE_MAINTENANCE / UNCERTAINTY_MONITORING (e.g. P3): Semantic center = unclear rules, shifting criteria, rebuilding order, repeatedly checking risk because structure is unstable, maintaining predictability. Fuels = clear rules, stable procedures, predictable role assignment. Drains = shifting criteria, ambiguous expectations, having to tear down and rebuild established order.
      * For ADAPTATION_SWITCHING (e.g. P4): Semantic center = being capable of adapting quickly -> absorbing more contextual changes than others, switching pace/mode/role repeatedly, delayed recognition of personal exhaustion. (DO NOT frame adaptability as a weakness — use the logic: "Because you adapt well, you end up absorbing more change than you actually needed to carry").
  - ENERGY SYNTHESIS ("잘하고 있는데, 왜 피곤할 때가 있을까요"): energy.summary must connect: (1) assigned primary/secondary processing burden + (2) situation where overused + (3) what natural strength is operating.
  - FUELS & DRAINS MECHANISM CONTRACT:
    - At least 2 of 3 fuels MUST explicitly derive from the assigned PRIMARY or SECONDARY mechanism.
    - At least 2 of 3 drains MUST explicitly derive from the assigned PRIMARY or SECONDARY mechanism.
    - FORBIDDEN generic wellness advice: NEVER write "친구와의 깊은 대화", "자연 속에서의 시간", "명상", "운동", "충분한 휴식", "충분히 쉬세요".
  - STRENGTH OVERUSE IN WATCHOUTS (WATCHOUT CAUSAL CHAIN CONTRACT):
    - Every watchout title and body MUST follow the exact causal chain: (1) Genuine strength/capability being used -> (2) Specific context where it is overused -> (3) Resulting energy cost. Watchouts are strictly for RECOGNITION AND UNDERSTANDING.
    - REJECT GENERIC STOCK WATCHOUTS: Never output generic stock titles like "다른 사람의 의견을 지나치게 확인", "변화에 대한 저항감", "관계에서의 불안감". Instead, write mechanism-anchored overuse titles (e.g. for DECISION_LOAD: "판단 변수를 끝까지 보류하는 신중함" -> "책임 범위가 모호한 상황에서 변수를 닫지 못해 판단이 길어지는 비용"; for STRUCTURE_MAINTENANCE: "완결된 체계를 고수하는 원칙" -> "기준이 수시로 바뀌는 환경에서 계획을 처음부터 다시 세워야 하는 부하"; for ADAPTATION_SWITCHING: "상황에 맞춰 빠르게 방식을 바꾸는 유연성" -> "내 기준보다 환경 변화를 먼저 수용하여 맥락 전환 비용이 누적되는 패턴").
  - SAJU HUMAN TRANSLATION RULE: Traditional Saju/Shinsal/Element/TenGod/Relation facts in [Energy evidence] remain internal provenance only. Translate them into plain human operational terms. FORBIDDEN raw Saju terms in user-visible text ("비견이 강하고", "관성이 약해서", "조후상 화기가 부족해서", "귀문관살 때문에", "충이 있어서").
  - NO GENERIC ADVICE IN PART 05: Do NOT write generic self-care advice anywhere in energy, strengths, or watchouts ("충분히 쉬세요", "자신을 돌보세요", "명상하세요"). Part 05 is strictly for UNDERSTANDING.
- energy MAY surface these additional angles inside the existing summary/fuels/drains/optimal fields, but ONLY when genuinely supported by converging evidence — never force any of them into every response:
  - Innate vs. current energy style: if the climate/elemental (innate) evidence and the energy_style/resilience (current) evidence point at a meaningfully different way of using energy, name that difference in plain, real-life terms. If they roughly agree, say nothing about a contrast — do not manufacture one.
  - Gap-driven energy cost: if a reused Current x Innate gap axis represents real adaptation or compensation, you may explain the energy cost of sustaining that adaptation. A gap is not a problem or flaw — frame it as effort/cost, exactly like gap_deep_dive's own gives_you/may_cost framing, never as something wrong with the person.
  - Strength overuse: an existing strength (from the CE strengths-group signals) may appear as a drains item ONLY when there is converging evidence that it's being used past a comfortable point (e.g. it recurs across strengths-group signals AND a caution/dimension signal) — never assert overuse from the strength's mere existence alone.
  - Pressure / conflict / emotional labor: use pressure_response and conflict_style together (plus any other converging Energy evidence) to name a specific draining situation involving pressure, disagreement, or managing others' emotions — grounded in at least one of these signals, not asserted generically.
  - Environment / rhythm / social density (optimal): energy.optimal MUST directly express the OPERATING ENVIRONMENT conditions derived from assigned [PRIMARY FIT NEED] and [SECONDARY FIT NEED] in [Energy evidence]. Item #1 MUST express PRIMARY FIT NEED as an operating condition; Item #2 MUST express SECONDARY FIT NEED as an operating condition. FORBIDDEN as sole items: bare generic stock recovery phrases ("조용한 환경", "자유로운 환경", "안정적인 환경", "혼자 있을 수 있는 시간", "명확한 규칙이 있는 상황"). NEVER assign a rule-bound quiet environment dump to a GROWTH_VARIETY or STIMULATION profile.
  Each of these is independent and optional — include only what the evidence actually supports, keep total energy content the same length/shape as before (no new fields, no longer lists), and never let any of these restate a conclusion already stated in axis_interpretations, growth_edge, strengths, or watchouts — translate it into energy terms instead.
- Each fuels/drains/optimal item must name a concrete trigger or context, not a generic category label — and briefly imply why it costs or returns energy for this specific person, not just what the situation is. Prefer "a long meeting where you keep having to respond to people with little room to process alone" over "Large social gatherings"; prefer "carrying other people's schedules or moods while your own decisions keep getting pushed back" over "Too much responsibility". Ground each item's specificity in the convergence you already found in [Energy evidence] (e.g. solitude_autonomy + pressure_response together might point at a specific kind of low-privacy, high-responsiveness situation) — never invent a scenario unconnected to the evidence, and never let one signal alone dictate one item. The same underlying evidence may show up differently across fuels vs. drains vs. optimal — e.g. a low-stimulation environment might explain both a drains item (too much unstructured noise) and an optimal item (quiet, low-interruption settings) from two genuinely different angles; don't just restate one as the mirror of the other. Keep every item to one concise phrase or short sentence (still a scannable list item, not a paragraph). Never write a blanket claim like "you dislike people" or "you're an introvert" — describe the specific pattern or context instead. Keep fuels, drains, and optimal meaningfully distinct from each other — avoid two items across these three lists restating the same situation from interchangeable angles unless it's a genuinely separate, specific insight.${
      input.part01Evidence?.adaptationStoryEligible
        ? `
- adaptation_story MUST follow the pre-selected [Part 04 Story Plan] above. Your single task is to answer the SYNTHESIS QUESTION TO ANSWER in plain, warm, natural Korean, explaining how the Primary Adaptation coexists with the Secondary Contrast. Do NOT re-select facts or invent a new storyline — translate the pre-selected tension, capability gained, and cost incurred into 2-5 short paragraphs with blank lines (\\n\\n) between them. Restrict your evidence_refs strictly to keys present in Allowed Evidence Refs for adaptation_story. Never write generic closings (such as "여러 모습이 모두 당신이에요" or "현재와 본래가 조화를 이룹니다") — end with a person-specific recognition of the exact target tension. Zero advice, zero next steps. Never address the reader as 고객님/귀하/회원님.
- adaptation_story MUST be 2-5 short paragraphs with an actual blank line (\\n\\n) between every pair of them — a single dense wall-of-text block is a FAILED response even if the content itself is good. All five beats in the narrative instructions (natural direction / current reliance / what it enables / what it may cost / integrated closing) must be covered — adjacent beats may share one paragraph when they genuinely flow together, but the final beat (integrated closing) always gets its own last paragraph, never folded into an earlier one.
- adaptation_story has ZERO advice, ZERO next steps, and ZERO forward-looking capability-building language — this has been observed leaking in live output and is explicitly forbidden, including any close variant of: "~연습을 통해 ~을 높일 수 있어요" (practicing X can raise Y), "~하다면 더 많은 기회를 잡을 수 있어요" (if you do X you'll seize more opportunities), "더 나은 균형을 찾아가는 것이 중요해요" / "균형을 찾는 과정에서 ~ 회복할 수 있을 거예요" (finding/recovering better balance matters), "앞으로도 계속 성장해 나갈 수 있을 거예요" (you'll keep growing), "~하는 것이 중요하다는 점을 인식/기억해야 해요" (recognizing/remembering that X matters), "~은 당신의 삶을 더 풍요롭게 만들어줄 거예요" (X will enrich your life), or their English equivalents ("developing X could help", "finding balance is key", "you'll continue to grow", "it's important to remember/recognize that..."). None of these contain an imperative verb like "해보세요" but all of them are still advice — they tell the reader what to pursue, prioritize, or recognize, and promise an outcome if they do. If a sentence implies what should happen next or what a change would earn the reader — delete it or rewrite it as a plain observation of what already is, right now, with no forward pointer at all. ALSO STRICTLY FORBIDDEN anywhere in this field, as sentence endings (this is a category, not just the examples above — any ending with this shape is forbidden even if the exact words differ): "~해야 해요", "~할 필요가 있어요", "~하는 것이 중요해요", "~연습해보세요"/"~연습해 보세요", "~활용해보세요"/"~활용해 보세요", "~시도해보세요"/"~시도해 보세요", "~기억하세요". This is about the sentence's ENDING specifically — a sentence that merely describes a real, already-existing cost or effort using a different verb shape, such as "~할 필요가 생길 수 있어요" (a plain description that a need CAN arise, not an instruction to act on it), is not what this bans; the difference is whether the sentence tells the reader to do something (banned) versus describes what is already true (allowed).
  This applies MOST to the closing (5th) paragraph, where this leak has been observed repeatedly even after everything above — it is not immune just because it's "the wrap-up". FAILED PATTERN (observed live, do not reproduce even in paraphrase): a sentence that promises a future payoff for a future action — the shape "이런 균형을 찾는 과정에서 [자질]도 다시 회복할 수 있을 거예요" or "[행동]하면 삶이 더 풍요로워질 거예요" — both are advice wearing a summary's clothes, no matter which specific words fill the brackets. PERSON-SPECIFIC RECOGNITION CLOSING (5th paragraph): BANNED GENERIC PATTERNS: NEVER write generic closings such as "여러 모습이 모두 당신이에요", "서로 다른 모습이 아니라 연결되어 있어요", "이것도 당신의 한 부분이에요", "현재와 본래가 조화를 이룹니다", or "지금의 모습과 본래의 경향은 서로 다른 것이 아니라...". The closing MUST refer to the ACTUAL specific pattern discovered in THIS response (e.g. "사람을 중요하게 여기는 마음과 내 공간을 지키려는 태도는 서로 반대가 아니라, 관계 안에서 흔들리지 않기 위해 함께 커진 두 힘일 수 있어요").`
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
    "do_items": [
      { "title": "short action title executing DO direction 1 (PRIMARY FAMILY)", "body": "2-3 sentences: what this person should intentionally keep doing, strictly consuming DO direction 1" },
      { "title": "short action title executing DO direction 2 (SECONDARY FAMILY)", "body": "2-3 sentences: strictly consuming DO direction 2" },
      { "title": "short action title executing DO direction 3 (ENERGY RECOVERY)", "body": "2-3 sentences: strictly consuming DO direction 3" }
    ],
    "dont_items": [
      { "title": "short overuse warning title targeting DON'T direction 1 (PRIMARY FAMILY)", "body": "2-3 sentences: strength/adaptation overuse pattern to stop overusing, strictly consuming DON'T direction 1 (NEVER frame as a character flaw)" },
      { "title": "short overuse warning title targeting DON'T direction 2 (SECONDARY FAMILY)", "body": "2-3 sentences: strictly consuming DON'T direction 2" },
      { "title": "short overuse warning title targeting DON'T direction 3 (ENERGY OVERUSE)", "body": "2-3 sentences: strictly consuming DON'T direction 3" }
    ],
    "decision_rules": [
      "Decision Rule 1: concrete decision filter strictly consuming Decision Rule direction 1 (PRIMARY FAMILY)",
      "Decision Rule 2: concrete decision filter strictly consuming Decision Rule direction 2 (SECONDARY FAMILY)",
      "Decision Rule 3: concrete decision filter strictly consuming Decision Rule direction 3 (ENERGY SUSTAINABILITY)"
    ],
    "remember": [
      "Keep (what to keep without forcing change): 2-3 sentences",
      "Loosen (what to no longer constantly prove/perform): 2-3 sentences",
      "Recover (what to reclaim for yourself): 2-3 sentences"
    ],
    "leap": "Decision Compass for future choices: 2-3 sentences — one concrete decision criterion to verify before your next major choice"
  },
  "closing": "EXACTLY 2 sentences, no more — sentence 1 names the current way and the natural way both being real right now (RECOGNITION), sentence 2 names that their difference is now something the reader can see, not something to resolve, ending in a present-tense recognition shape like '~게 되었다는 점입니다.' (INTEGRATION). NO third sentence, NO advice, NO prediction, NO praise/evaluation of the insight, NO cheers/encouragement, NO customer service tone — see the closing rules below for exactly why a 3rd+ sentence is forbidden, not just discouraged.",
  "checklist": ["One Next Move: exactly 1 small, concrete, grounded experiment action you can try once this week (NO generic homework or task dumps) — return [] if no specific practice adds value beyond DO/DON'T"]
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
    `    "leap": "Decision Compass for future choices: 2-3 sentences — one concrete decision criterion to verify before your next major choice"
  },`,
    `    "leap": "Decision Compass for future choices: 2-3 sentences — one concrete decision criterion to verify before your next major choice"${FUTURE_EVIDENCE_FIELD}
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
- relationships MUST be anchored in the assigned [PRIMARY FIT NEED] and [SECONDARY FIT NEED] in [Relationship evidence]. Translate identity-trait evidence into its FIT & ENVIRONMENT MAP meaning — Part 06 answers: "WHERE and WITH WHOM does this person function best?" (Do NOT re-explain Part 05 energy depletion; explain under what conditions this person functions with less friction and more impact).
- pattern answers "how do I connect with people and environments" — a whole-relational-style read, grounded in convergence across the evidence.
- fit ("잘 맞는 사람들", 3-5 items) answers "what kind of person/condition genuinely fits me" — Use this TEMPLATE, never a ready-made sentence: MUST express: SPECIFIC OTHER PERSON BEHAVIOR + WHY IT FITS THIS USER (e.g. "내 결론을 대신 정해주기보다 독립적 판단 공간과 시간을 주는 사람 — 조율 압박 없이 내 내면의 기준을 차분하게 정리할 수 있음"). FORBIDDEN as a fit item: bare virtue adjectives without a behavioral mechanism ("좋은 사람", "이해심 많은 사람", "소통 잘하는 사람", "신뢰할 수 있는 사람", "kind person", "good communicator", "understanding person"). MIRROR-COPY IS FORBIDDEN: never simply restate one of this user's own strengths/titles as the trait the other person should have (e.g. if this user's own strength is empathy, "공감을 잘하는 사람이 잘 맞는다" is a forbidden mirror-copy) — fit describes what THE OTHER PERSON brings that complements or steadies this user's specific pattern, not a copy of this user's own strengths list.
- friction ("마찰이 생기는 지점", 3-5 items) answers "what interaction pattern creates friction for me" — a friction item is NEVER a trait-mismatch label on the other person; it MUST describe the INTERACTION MECHANISM that produces friction. Use this TEMPLATE, never a ready-made sentence: name what both people are doing or what one person needs, and name why that specific combination creates friction for THIS user. FORBIDDEN: character judgments or moralizing labels ("무책임한 방식", "가식적인 태도", "이기적인 사람", "우유부단한 사람", "감정적인 사람", "소통을 못하는 사람"). Replace character diagnosis with mechanism description: write "정보가 사전에 공유되지 않아 다음 수순을 예측하기 어려워지는 소통" (NOT "무책임한 방식"), write "말과 행동의 차이가 커서 상대의 진짜 의도를 계속 해석해야 하는 관계" (NOT "가식적인 태도").
- compare ("이렇게 말하면 더 잘 들려요", 3 pairs) answers "what kind of communication closes me down → what kind of delivery reaches me effectively":
  - wound column ("나를 닫게 만드는 방식"): MUST contain ONLY a literal spoken utterance a real person could actually SAY out loud (e.g. "왜 또 네 방식대로만 다 정하려고 해?", "그냥 시키는 대로 원래 수순 맞춰서 해"). FORBIDDEN: narrator meta-descriptions ("내가 원하는 방향으로 일이 안 될 때...", "상황이 자주 바뀌어 혼란스러움", "내 감정이 무시당하는 느낌") and trailing narrator commentary ("...라는 말을 들으면 힘들어요").
  - steady column ("나에게 더 잘 들어오는 방식"): MUST contain ONLY a literal spoken alternative sentence communicating the SAME real issue, request, or boundary in a delivery style this user receives better (e.g. "이 건은 같이 합의해야 해. 네가 먼저 생각한 범위를 말해주면 내가 필요한 부분만 이야기할게"). PRESERVE THE REAL ISSUE: The right side MUST NOT erase the speaker's position, surrender the request, or use AI-coaching/therapist phrasing ("어떤 배움을 얻을 수 있을지 기대돼", "네 유연한 접근법이 좋아", "다양한 가능성을 이야기해보자", "네 생각을 존중해", "성장을 응원해"). FORBIDDEN: trailing narrator commentary ("...라고 물어보는 것이 더 안정적이에요", "...라고 제안하는 것이 좋겠어요").
  - Ground wounds/steadies in the assigned PRIMARY & SECONDARY FIT NEEDS and friction mechanisms — never use generic polite vs rude contrasts.
- energy.optimal ("나에게 잘 맞는 환경", 2-4 items) MUST directly express the OPERATING ENVIRONMENT conditions derived from assigned [PRIMARY FIT NEED] and [SECONDARY FIT NEED]. Environment fit describes how a team, workplace, collaboration culture, or relationship dynamic operates so strengths are amplified without excessive energy cost — NOT merely a quiet recovery condition or solitude time (which belongs to Part 05 fuels).
  - Item #1 MUST clearly express PRIMARY FIT NEED as an operating condition (e.g. AUTONOMY: "역할과 목표는 분명하지만 맡은 영역의 판단과 실행에는 자율권이 보장되는 환경"; PREDICTABILITY: "우선순위와 기준이 명확하고 변경 시 이유와 다음 수순이 미리 공유되는 환경"; GROWTH_VARIETY: "새로운 문제와 아이디어를 계속 접할 수 있지만 모든 우선순위가 동시에 엎어지지는 않는 협업 문화").
  - Item #2 MUST clearly express SECONDARY FIT NEED as an operating condition (e.g. DECISION_CLARITY: "의사결정 주도권과 책임 범위가 명확하여 판단 지연이나 핑퐁 없이 효율적으로 마무리되는 환경"; STRUCTURE: "절차와 수순이 잘 정리되어 있어 판을 매번 다시 해석하지 않아도 되는 안정된 시스템"; STIMULATION: "지루한 루틴에 갇히지 않고 새로운 시도와 자극이 지속되는 환경").
  - FORBIDDEN as sole items: bare generic stock recovery phrases ("조용한 환경", "자유로운 환경", "안정적인 환경", "혼자 있을 수 있는 시간", "명확한 규칙이 있는 상황"). NEVER assign a rule-bound quiet environment dump to a GROWTH_VARIETY or STIMULATION profile.
- REUSE CHECK for fit/friction/compare: If your fit or friction item reads as a generic stock sentence about patience, waiting, or space (a fit/friction item that would read identically on a different user's report has failed), ground it specifically in THIS user's assigned [PRIMARY FIT NEED] and [SECONDARY FIT NEED].
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
    - MUST be explicitly connected to ONE of these already-established anchors — pick whichever is most central to this person's report, and the action must clearly trace back to it, not float free of everything else written above: the growth_edge (summary.growth_edge / growth_edge_real_life_pattern in the excerpt above), the primary/widest axis gap (primary_gap_axis in the excerpt above, if present), the adaptation tension (adaptation_recognition in the excerpt above, if present), a recurring decision pattern (playbook.rule or a rows[] entry from THIS response), or the Recover signal (future.remember[2] from THIS response). A reader who has just read the rest of the report should be able to see why THIS action, for THIS person, follows from what was already said — if it could be handed to any reader of any report unchanged, it has failed.
    - A single, concrete, testable experiment action expressed in the language of experiment (e.g. "다음 중요한 결정을 앞두고 다른 사람의 의견을 묻기 전에, 먼저 '나는 지금 무엇을 원하지?'를 한 문장으로 적어보세요").
    - FORBIDDEN: task dumps, 8-12 item homework checklists, generic self-care advice ("명상하세요", "자신감을 키우세요", "기록하세요", "친구에게 연락하세요"), and any action untethered to the anchors above (e.g. "이번 주 하루를 골라 기억에 남는 순간 하나를 적어보세요" is forbidden precisely because it connects to nothing else in the report).
    - OPTIONAL: Return an empty array "checklist": [] or omit checklist if no high-confidence operational practice adds value beyond the DO/DON'T items.
  - BEHAVIORAL SAJU ACTION TRANSLATION: If [Future evidence] contains a BEHAVIORAL SAJU ACTION TRANSLATION line, incorporate that translated behavioral guidance into at least ONE DO item, ONE DON'T item, or ONE Decision Rule. FORBIDDEN: Raw technical Saju terms (도화살, 현침살, 천을귀인, 십신, 격국, 용신 등 사주 용어 일체 사용 금지 — 반드시 행동적 소통/선택 수순 표현으로만 녹일 것).
  - closing (조용한 매듭 / Recognition Statement): closing is NOT a new insight — Decision Compass and One Next Move already gave the reader agency earlier in this same response. closing is EXACTLY 2 SENTENCES, NEVER MORE — this is a hard structural limit, not a style preference. Root cause of every leak observed in live QA so far: every single violation (a prediction, a praise/evaluation, an instruction to the reader, a cheer) showed up in a 3rd, 4th, 5th, or 6th sentence the model added beyond the required two — never in sentence 1 or 2. There is no legitimate 3rd sentence for this field: RECOGNITION and INTEGRATION are the whole job, both fit in two sentences, and a report that reaches for a 3rd sentence is, by definition, reaching for something this field doesn't need — write two sentences and STOP, do not round out the paragraph.
    - Sentence 1 (RECOGNITION): names that the current way and the natural way are both real, right now — built fresh from primary_gap_axis's natural_tendency/current_pattern in the excerpt above when present; otherwise build it from what you yourself already wrote in relationships/playbook/future earlier in THIS response. MUST reflect [PRIMARY ACTION FAMILY] (e.g. for GROWTH: use motifs like 성장/변화/배움/시도/방향/경험; for STRUCTURE: use 수순/구조/계획/체계; for DECISION: use 판단/결정/기준/주체성). NEVER write an autonomy/decision closing for a GROWTH or STRUCTURE profile.
    - Sentence 2 (INTEGRATION): names that their difference is now something the reader can see, not something to resolve, and MUST end in a present-tense statement of recognition (the grammatical shape "~게 되었다는 점입니다." or "~게 되었습니다." is fine to reuse as a SENTENCE-ENDING PATTERN, but the sentence content before it must be built fresh, not copied). Nothing may follow this sentence.
    - A closing that could be pasted unchanged onto a different person's report, word-for-word, has failed this field regardless of how well-formed the sentences are.
    - Compact reference only (do not use these as a checklist to satisfy word-for-word — the two-sentence limit above is what actually prevents these, not recognizing the words): a 3rd+ sentence tends to drift into PREDICTION (promising what will happen next), EVALUATION (praising how meaningful/great the insight is), ADVICE (telling the reader what to do), or CHEERING (wishing them well) — all four are forbidden in any wording, but the real fix is that none of them have a sentence slot to occupy.
    - FORBIDDEN TEMPLATES: NEVER use stock phrases like "차이를 인식하게 되었다는 점입니다", "차이를 이해하게 되었다는 점입니다", "더욱 자신감 있게", "성장할 수 있어요", "도움이 될 거예요".
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

export function getPart04ExpertSynthesisSystemPrompt(locale: "ko-KR" | "en-US" = "ko-KR"): string {
  if (locale === "en-US") {
    return `You are a world-class Personal Insight Narrative Expert.
Your task is to write Part 04 ("Why Have I Lived This Way?") of a Personal Premium Identity Report.
You are given a pre-selected Story Plan (Primary Adaptation, Secondary Contrast, Required Evidence Keys, and Synthesis Question).
Your single job is to explain why these two selected observations coexist in the person's life.

Output MUST be a single valid JSON object matching this schema:
{
  "adaptation_story": {
    "narrative": "2-5 short paragraphs, joined with literal blank lines (\\n\\n) between paragraphs. Derived emergent claim explaining the internal logic connecting Primary Adaptation and Secondary Contrast.",
    "evidence_refs": ["REQUIRED — array of exact evidence keys cited, MUST include at least ONE from PRIMARY REQUIRED EVIDENCE REFS and at least ONE from CONTRAST REQUIRED EVIDENCE REFS"]
  }
}

Strict Rules:
- ZERO advice, ZERO next steps.
- NO raw traditional Saju terms (like 귀문, 현침). Translate all structure into grounded human psychological behavior.
- NO invented biography, childhood trauma, health/financial predictions, or external event guesses.
- Must fulfill the dual-side evidence consumption contract: evidence_refs MUST contain at least one ref from PRIMARY REQUIRED REFS and at least one ref from CONTRAST REQUIRED REFS.
- NEVER write generic closings like "여러 모습이 모두 당신이에요" or "현재와 본래가 조화를 이룹니다". End with a person-specific recognition of the exact target tension.`;
  }

  return `당신은 세계 최고 수준의 개인 성향 서사 분석 전문가입니다.
당신의 역할은 개인 프리미엄 보고서의 Part 04 ("그래서 나는 왜 이렇게 살아왔을까요?") 핵심 통합 서사를 작성하는 것입니다.
당신에게는 이미 검증된 [Part 04 Story Plan]이 전달됩니다 (본래 성향과 현실 적응의 주 축, 대외 관계/내면 욕구의 대조 축, 필수 근거 키 set).

당신의 유일한 임무는: "서로 달라 보이는 이 두 가지 관찰이 왜 한 사람의 삶 안에서 함께 공존하게 되었는지" 그 내면의 합리적 연결 논리(Emergent Claim)를 밝혀내는 것입니다.

출력은 반드시 다음 JSON 구조를 따라야 합니다:
{
  "adaptation_story": {
    "narrative": "2-5개의 짧은 문단 (각 문단 1~3문장). 문단 사이에는 반드시 실제 줄바꿈(\\n\\n)을 구분자로 사용합니다. 절대로 한 덩어리의 긴 글로 쓰지 마십시오. 단순 요약(Part 03 재탕)이 아니라 '왜 이 두 특징이 공존하는가'에 대한 깊이 있는 통합적 해석을 제공합니다.",
    "evidence_refs": ["필수 — 인용한 근거 키 배열. 반드시 [PRIMARY REQUIRED EVIDENCE REFS] 중 최소 1개 이상 AND [CONTRAST REQUIRED EVIDENCE REFS] 중 최소 1개 이상을 포함해야 합니다."]
  }
}

핵심 작성 규정:
1. 근거 역할 준수: evidence_refs는 반드시 PRIMARY REQUIRED ref 1개 이상과 CONTRAST REQUIRED ref 1개 이상을 동시에 포함해야 합니다.
2. 조언 및 제안 절대 금지: "~해보세요", "~할 필요가 있어요", "~하는 것이 중요해요", "~연습해 보세요" 등 어떠한 미래형 제안이나 조언도 포함하지 마십시오. 현재 작동 중인 내면 논리의 명확한 설명만 제공합니다.
3. 사주 전문 용어 노출 금지: '십신', '귀문', '현침', '원진' 등 명리 용어를 직접 노출하지 말고, 모두 인간의 가치관, 행동 습관, 관계 보호 기제로 번역하여 설명하십시오.
4. 신상/사생활 추측 금지: 가상의 어린 시절, 가정환경, 겪지 않은 특정 사건을 임의로 만들어내지 마십시오.
5. 상투적 마무리 금지: "여러 모습이 모두 당신이에요", "현재와 본래가 조화를 이룹니다", "이것도 당신의 한 부분입니다" 등 상투적인 위로 문구로 끝내지 마십시오. 실제 공존하는 두 힘의 구체적 역동으로 마무리하십시오.`;
}

export type PersonalPart04ExpertSynthesisInput = {
  storyPlan: import("@/lib/report/buildPersonalPart04StoryPlan").PersonalPart04StoryPlan;
  partAContext?: {
    layeredIdentitySynthesis?: string;
    primaryGapProse?: {
      naturalTendency?: string;
      currentPattern?: string;
      gainedStrength?: string;
      hiddenCost?: string;
    };
  } | null;
  locale: "ko-KR" | "en-US";
};

export function buildPart04ExpertSynthesisUserPrompt(
  input: PersonalPart04ExpertSynthesisInput,
): string {
  const plan = input.storyPlan;
  const lines: string[] = [];

  lines.push("=== [Part 04 Focused Expert Synthesis Input] ===");
  lines.push(`SYNTHESIS QUESTION TO ANSWER:\n${plan.synthesisFrame.question}`);
  lines.push(`TARGET TENSION:\n${plan.synthesisFrame.targetTension}\n`);

  lines.push("--- REQUIRED PRIMARY EVIDENCE ---");
  lines.push(`- Primary Adaptation Axis: ${plan.primaryAdaptation.axis}`);
  lines.push(`- Natural Baseline: ${plan.primaryAdaptation.innateBaseline}`);
  lines.push(`- Current Adaptation: ${plan.primaryAdaptation.currentMode}`);
  lines.push(`- PRIMARY REQUIRED EVIDENCE REFS (must cite >=1): ${JSON.stringify(plan.requiredEvidence.primaryRefs)}`);

  if (plan.secondaryContrast) {
    lines.push("\n--- REQUIRED CONTRAST EVIDENCE ---");
    lines.push(`- Contrast Type: ${plan.secondaryContrast.kind}`);
    lines.push(`- Contrast Description: ${plan.secondaryContrast.description}`);
    lines.push(`- CONTRAST REQUIRED EVIDENCE REFS (must cite >=1): ${JSON.stringify(plan.requiredEvidence.contrastRefs)}`);
  }

  if (plan.currentMechanism || plan.supportingInnateStructure) {
    lines.push("\n--- OPTIONAL SUPPORTING STRUCTURES ---");
    if (plan.currentMechanism) {
      lines.push(`- Mechanism: ${plan.currentMechanism.label} (Refs: ${JSON.stringify(plan.currentMechanism.evidenceRefs)})`);
    }
    if (plan.supportingInnateStructure) {
      lines.push(`- Saju Support: ${plan.supportingInnateStructure.label} (Refs: ${JSON.stringify(plan.supportingInnateStructure.evidenceRefs)})`);
    }
  }

  if (input.partAContext) {
    lines.push("\n--- PART 02/03 CONTEXTUAL PROSE (for semantic depth only, not evidence citations) ---");
    if (input.partAContext.layeredIdentitySynthesis) {
      lines.push(`- Layered Identity Shift: ${input.partAContext.layeredIdentitySynthesis}`);
    }
    if (input.partAContext.primaryGapProse) {
      const p = input.partAContext.primaryGapProse;
      if (p.naturalTendency) lines.push(`- Natural Tendency: ${p.naturalTendency}`);
      if (p.currentPattern) lines.push(`- Current Pattern: ${p.currentPattern}`);
      if (p.gainedStrength) lines.push(`- Gained Capability: ${p.gainedStrength}`);
      if (p.hiddenCost) lines.push(`- Hidden Cost: ${p.hiddenCost}`);
    }
  }

  lines.push("\nALLOWED EVIDENCE REFS FOR adaptation_story:");
  lines.push(JSON.stringify(plan.selectedEvidenceRefs));

  lines.push("\nWrite the JSON response containing 'adaptation_story' with 'narrative' and 'evidence_refs'.");
  return lines.join("\n");
}
