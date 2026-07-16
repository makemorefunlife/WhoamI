/**
 * Paid integrated report — 2-phase generation prompts
 * (output) no ###, no ┌─┐ boxes — see API route comments
 */
import { PRIMARY_AXIS_LLM_GUIDE } from "@/lib/v2/framework/primaryAxisDefinitions";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { buildLlmOutputLocaleInstruction } from "@/lib/i18n/llmLocale";

const INTEGRATED_SYSTEM_RULES = `You are a paid deep-report writer who integrates survey (current behavior), Essence analysis (inner nature), and birth-energy context (consciousness / emotion / age tone) into one coherent story.

${PRIMARY_AXIS_LLM_GUIDE}

Premium interpretation rules (whenever you mention a Primary Axis):
- Connect core tendency, strength, stress pattern, decision-making pattern, relationship pattern, and growth suggestion
- Keep axis names (Autonomy, Connection, Stability, Growth, Structure, Adaptability) in English; explain them in natural prose
- Example: "High Structure means you feel steadier with plans and rhythm. When expectations are vague or schedules flip suddenly, stress can rise."

[Tone]
Warm, affectionate, cool casual — easy essay tone.
Avoid judgment, hard labels, prophecy; offer observed patterns gently.

[Voice]
- Keep one consistent casual voice end-to-end
- Ban stiff report closures; ban flipping register mid-paragraph

[Banned — terms / source phrasing]
- Psychology test names (MBTI, DISC, etc.); Saju/astrology technical dumps (special stars, Ten Gods, elemental jargon) explained like a textbook
- Source callouts like "according to Saju", "astrologically because…", "because of the stars"
- Empty summaries like "You are the kind of person who…"
- Markdown heading syntax (#, ###) and ASCII boxes (┌ ┐ etc.)
- Hash-mark subheads (use **bold** or Part numbers instead)

[Preferred — when citing grounds]
- Soft phrases only: "Essence analysis suggests…", "from your inner nature…", "aligned with your current behavior patterns…"
- Special-star / temperament signals (e.g. getting help in crisis) must be translated into everyday behavior / relationship / decision scenes

[Allowed formats]
- Section breaks: plain "Part 0" lines or **Part 1**
- Tables: pipe (|) for situation / words / reactions
- Energy gauges: █ characters + % numbers
- Checklists: □ customized items
- Blank lines for breath; paragraphs can be long`;

/** English SSOT rules without locale. Prefer getIntegratedSystemPrompt. */
export const INTEGRATED_SYSTEM_PROMPT = INTEGRATED_SYSTEM_RULES;

export function getIntegratedSystemPrompt(locale?: Locale | string): string {
  const outputLocale = normalizeLocale(locale);
  return `${INTEGRATED_SYSTEM_RULES}

${buildLlmOutputLocaleInstruction(outputLocale)}`;
}

export function buildIntegratedPhase1UserPrompt(
  surveyAnalysis: string,
  essenceAnalysisSummary: string,
  birthEnergyContext: string,
  locale?: Locale | string,
): string {
  const outputLocale = normalizeLocale(locale);
  return `[Input data — use only this material]
■ Survey (current behavior patterns)
${surveyAnalysis}

■ Essence analysis (inner nature · special-star signals included; translate jargon to everyday language)
${essenceAnalysisSummary}

■ Birth-energy context (consciousness · emotion · surface tone — everyday language only)
${birthEnergyContext}

---

[This call: Part 0 ~ Part 2 only]
Keep the structure and length below. Every sub-item needs concrete behavior examples, dialogue scenes, or choice moments.
Strengths / watch-outs: at least 5–7 sentences each. Explicitly connect Essence bones (incl. special stars / combination-clash / day-master essence) and birth-energy context with survey "how you operate now" at least once or twice (never print tool/technical names).

Part 0 — Opening
- What this piece is and how to read it (4–8 sentences)
- Nuance: it need not be 100% accurate; take what resonates

Part 1 — Who I am
1-1 One-line metaphor: nature/light/object + 2–4 sentence reason
1-2 Outside vs inside: survey vs Essence/inner drive contrast (8–14 sentences)
1-3 Three given strengths: each = one-line title + 5–7 sentences (situational example · Essence · birth context · survey links; include ≥1 special-star strength if present)
1-4 Three gentle watch-outs: 4–6 sentences each (everyday language for special-star cautions if present)
1-5 Two–three "most me" moments: 4–6 sentences each

Part 2 — My energy and environment
2-1 What energizes me: 3–5 items (3–5 sentences each)
2-2 What drains me: 3–5 items (3–5 sentences each)
2-3 Fitting environments/rhythms: 2–4 items (3–5 sentences each)

Energy-ratio gauges (estimate from survey + Essence + birth context)
Use this exact format (adjust numbers from analysis):
Energy spent on people/relationships    ████████████████████ 00%
Energy that returns to me               ████ 00%
Solo recharge time                      ██ 00%

Add 6–10 sentences of interpretation under the gauges.

Stop after this. Parts 3+ continue in the next message.

${buildLlmOutputLocaleInstruction(outputLocale)}`;
}

export function buildIntegratedPhase2UserPrompt(
  surveyAnalysis: string,
  essenceAnalysisSummary: string,
  birthEnergyContext: string,
  part1Excerpt: string,
  locale?: Locale | string,
): string {
  const outputLocale = normalizeLocale(locale);
  return `[Input data — same material]
■ Survey
${surveyAnalysis}

■ Essence analysis (incl. special stars)
${essenceAnalysisSummary}

■ Birth-energy context
${birthEnergyContext}

[Already written earlier — match tone, terms, metaphors]
${part1Excerpt}

---

[This call: Part 3 ~ Part 5 + appendix]
Continue without contradicting prior Parts. If special-star signals show relationship / dependence / benefactor / crisis patterns, fold them naturally into Parts 3–4.

Part 3 — Relationships and me
3-1 Recurring relational patterns (10–16 sentences)
3-2 Traits of people who feel easy: 2–4 items (4–6 sentences each)
3-3 Traits of people who feel hard: 2–4 items (4–6 sentences each)
3-4 Words that wound vs words that fuel — table (3–5 rows from the analysis)
| Words that tend to wound | Words that fuel |
|---------------------|--------------|
| ... | ... |

Part 4 — Making relationships easier
4-1 Personal communication rules: 3–5 (3–5 sentences each)
4-2 Situation tips — table (situation · previous reaction · recommended reaction)
| Situation | Previous reaction | Recommended reaction |
|------|-----------|-----------|
| ... | ... | ... |
4-3 Rules for when emotions spike: 2–4 (3–5 sentences each)
4-4 What to check when distance / cleanup is needed: 2–4 (3–5 sentences each)

Part 5 — Who I'm becoming
5-1 Three things worth remembering (4–7 sentences each)
5-2 Directions for one more step: 2–4 (3–5 sentences each)
5-3 Closing: one warm paragraph (6–12 sentences)

Appendix — today's personal checklist
- 8–12 □ items from the patterns (one action per line)
- Use labels like over-adapting / avoidance / perfectionism only when data supports them

Finish with generous length.

${buildLlmOutputLocaleInstruction(outputLocale)}`;
}
