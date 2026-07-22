import { ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA } from "./outputSchema";
import {
  DATA_COMBINATION_FORCE_RULES,
  buildPdfStyleReferenceGuide,
} from "./dataCombinationRules";
import { buildSectionQualityExamples } from "./sectionExamples";
import {
  buildEssenceJournalNameMappingBlock,
  buildEssenceJournalToneRules,
  buildHiddenHeartsRoleGuide,
  buildSectionRoleSeparationGuide,
} from "./essenceJournalWritingRules";
import {
  buildEssenceActionFewShotExample,
} from "./essenceActionWritingRules";
import {
  buildConflictSituationFewShotExample,
} from "./conflictSituationWritingRules";
import {
  buildSpecialBondFewShotExample,
} from "./specialBondWritingRules";
import type { RomanticSajuDeepLocale } from "./system";

const DATA_COMBINATION_RULES = `
# Most important rule: combine data signals

**Never interpret from a single signal.** Internally combine 2–3 signals.
In JSON body copy, do not use Saju technical terms or Hanja — write only the combined result in everyday language and imagery.

| ❌ Don't | ✅ Do |
|---|---|
| "sensitive" (day-master alone) | "delicate spark + deep feeling + finely tuned rhythm = candlelight on water" (3-signal combo) |
| "practical" (one element alone) | "steady mountain + decisiveness + slow breath = unshakable support" (2-signal combo) |
| "there is conflict" (one branch alone) | "tender feelings + need to fix + tempo gap = comfort-vs-solution clash pattern" (3-signal combo) |

**Do not copy examples**: the table shows the *method* only. Sentences, metaphors, and dialogue must be newly written from "Input data" below.
`.trim();

const RELATIONSHIP_INTERPRETATION_GUIDE = `
# Relationship data interpretation guide

(Do not print technical terms / Hanja in output — use everyday readings below)

## Combinations — mutual pull
| Kind | Relational reading |
|---|---|
| Day-master stem combination | Strong pull from first meeting; presence itself feels calming |
| Day-branch six-harmony | Practical life complement; less friction when living together |
| Month-branch six-harmony | Easy emotional sync without needing many words |

## Clashes — mutual stimulation
| Kind | Relational reading |
|---|---|
| Day-master clash | Useful friction; collision that grows them |
| Day-branch clash | Possible opinion gaps in lifestyle / money / habits |
| Month-branch clash | Closeness can heighten sensitivity |

## Distant-resentment patterns — surface vs undercurrent
| Kind | Relational reading |
|---|---|
| Day-branch pattern | Looks fine outwardly while unspoken hurt can accumulate |
| Year-branch pattern | Subtle gap in root values |

## Penalty / harm patterns
- Penalty-like: friction from small habits / phrasing
- Harm-like: outsider misunderstanding — keeping their own center matters
`.trim();

const ANALYSIS_LAYERS_GUIDE = `
# Analysis guide (10 layers — internal only)

## Layer 1: Individual base
Day-master + elements + Ten Gods + strength/weakness combo → personality image, emotion expression, conflict reaction

## Layer 2: Element / energy relation
Pair element generating/control + combined strengths → synergy / complement when together

## Layer 2-2: Useful vs overloaded energy
| Case | Reading |
|---|---|
| My needed energy = partner's strong element | "This person supplies what I need" |
| My overloaded energy = partner's strong element | "Together I may feel drained" |

## Layers 3-1~3-4: Day-master / day-branch / month-branch / hidden stems
Cross branch relations + each spouse palace / month-branch / hidden-stem combos

## Layer 4: Branch conflict (6-step transform)
Confirm data → life domain → psychological phenomenon → relational expression → resolution direction

## Layers 5–8: Relationship typing · psychology · dialogue · timeline

Write via **combination interpretation** only; never display Layer numbers in the body.
`.trim();

const UX_SECTION_GUIDE = `
# Output story order (JSON keys)

1. section_1_summary — **server-generated** (LLM must not create)
2. section_1_relationship_dynamics — balance_of_power + recovery_speed, grounded ONLY in dynamics_digest above (server already decided the band; you just phrase it)
3. section_2_nature
4. section_4_special_bond
5. section_4_relationship_frames — reassurance_signal + unconscious_role_play, grounded ONLY in dynamics_digest above
6. section_4_hidden_hearts
7. section_3_conversation_patterns — conflict **dialogue_table 2 rows only** (A·B one each, 50:50 mutual strain)
8. section_5_action — EssenceActionGuideline (action_title + saju_reason 3+ sentences + real_speech_tip). real_life_example always ""
9. section_6_timeline
`.trim();

const buildFinalOutputRules = (nicknameA: string, nicknameB: string) => `
# Final instructions
1. **Must use input data** — ground writing only in calculated values under "Input data". Do not copy quality/exemplar sentences.
2. No technical jargon — no Saju terms / Hanja in JSON values
3. **Must combine data** — apply 3 steps (confirm → combine/image → relational reading). State steps 1–2 in data_combination_note.
4. **No length caps** — do not summarize/compress. Aim for 5–8+ sentences per rich field
5. First-person dialogue — raw "Actually, I…" phrasing
6. Dialogue — conflict uses **dialogue_table only** (ban bad_example · hidden_psychology · positive_situation)
7. Prefer direct, specific voice; avoid vague hedges
8. Balance A and B
9. Fill every Output Schema field (no empties where required)
10. **comparison_table**: emotion expression · conflict reaction · love language · stress pattern · decision-making · communication — **6 rows required**
    - \`a\` column = **${nicknameA}** only, \`b\` column = **${nicknameB}** only (do not swap)
    - Each cell: describe without names/subjects (names are in headers). Ban "OO is…", "OO does…"
    - Referring to the partner: use **"to the partner"** / **"the partner"** (report for the two of them)
    - e.g. "Often shows gratitude to the partner." / "Tries to show love through actions."
11. **section_5**: advice_for_a·b **3 each** — action_title + saju_reason (3+ sentences) + real_speech_tip required. real_life_example = **""**. together = Essence diary (3+ sentences), together_starter = conversation opener. Ban "in moments like this" scaffolding, nature metaphors, "just express feelings" clones
12. **section_3 conflict**: dialogue_table **exactly 2 rows** — faster expresser + slower processor each ❌/✅. 50:50 balance; no model answers. Ban hidden_psychology
13. **section_4_special_bond**: \`a_gives_b_headline\`+\`a_gives_b\`, \`b_gives_a_headline\`+\`b_gives_a\`, \`only_together_headline\`+\`only_together\` required. Follow few-shot structure. Ban nature metaphors and Mingli terms
14. **section_4_hidden_hearts**: both a_hidden and b_hidden required. Fully separate from special_bond
15. **section_1_summary**: do not generate (Headline Selector fills from Saju rules)
16. **section_1_relationship_dynamics / section_4_relationship_frames**: these 4 fields (balance_of_power, recovery_speed, reassurance_signal, unconscious_role_play) must be phrased **only** from \`dynamics_digest\` in Input data. Do not invent a different verdict than what the digest already decided — you are writing the narrative, not re-classifying. Never print the internal band/frame names (e.g. "leader", "savior_dependent") literally — translate them into natural language.
17. **Dedup audit**: on subject-swapped mirroring, banned fluff, Saju jargon, or bond nature metaphors — **fully rewrite** that field

Output language follows the system prompt locale instruction — do not hardcode a language here.
`.trim();

export function buildRomanticSajuDeepUserPrompt(params: {
  nicknameA: string;
  nicknameB: string;
  personBlockA: string;
  personBlockB: string;
  pairBlock: string;
  dynamicsBlock?: string;
  userCustomMyName?: string;
  userCustomTargetName?: string;
  locale?: RomanticSajuDeepLocale;
  anchorIsA?: boolean | null;
  expressionSpeedDirection?: "A" | "B" | "balanced" | null;
}): string {
  const {
    nicknameA,
    nicknameB,
    personBlockA,
    personBlockB,
    pairBlock,
    dynamicsBlock = "",
    userCustomMyName,
    userCustomTargetName,
    locale: _locale = "ko",
    anchorIsA,
    expressionSpeedDirection,
  } = params;
  void _locale;

  const myName = userCustomMyName?.trim() || nicknameA;
  const targetName = userCustomTargetName?.trim() || nicknameB;

  const qualityExamples = buildSectionQualityExamples(nicknameA, nicknameB);
  const pdfStyleGuide = buildPdfStyleReferenceGuide(nicknameA, nicknameB);
  const nameMapping = buildEssenceJournalNameMappingBlock({
    nicknameA,
    nicknameB,
    userCustomMyName: myName,
    userCustomTargetName: targetName,
  });
  const essenceTone = buildEssenceJournalToneRules();
  const sectionRoles = buildSectionRoleSeparationGuide(nicknameA, nicknameB, anchorIsA);
  const hiddenHeartsGuide = buildHiddenHeartsRoleGuide(nicknameA, nicknameB);
  const specialBondFewShot = buildSpecialBondFewShotExample(
    nicknameA,
    nicknameB,
  );
  const fasterName =
    expressionSpeedDirection === "A" ? myName : expressionSpeedDirection === "B" ? targetName : null;
  const essenceActionFewShot = buildEssenceActionFewShotExample({
    nicknameA,
    nicknameB,
    myName,
    targetName,
    fasterName,
  });
  const conflictFewShot = buildConflictSituationFewShotExample({
    nicknameA,
    nicknameB,
    myName,
    targetName,
    fasterName,
  });

  return `
# Analysis subjects
- A (JSON slot): ${nicknameA}
- B (JSON slot): ${nicknameB}
- Me (custom first): ${myName}
- Partner (custom first): ${targetName}
- Relationship type: romantic partners

---

${nameMapping}

---

${essenceTone}

---

${sectionRoles}

---

${hiddenHeartsGuide}

---

${specialBondFewShot}

---

${essenceActionFewShot}

---

${conflictFewShot}

---

# Input data (actual Saju calculations — analyze from this only)

## A (${nicknameA})
${personBlockA}

## B (${nicknameB})
${personBlockB}

---

${pairBlock}

---

${dynamicsBlock}

---

${DATA_COMBINATION_FORCE_RULES}

---

${DATA_COMBINATION_RULES}

---

${qualityExamples}

---

${pdfStyleGuide}

---

${RELATIONSHIP_INTERPRETATION_GUIDE}

---

${ANALYSIS_LAYERS_GUIDE}

---

${UX_SECTION_GUIDE}

---

# Output Schema
A = **${nicknameA}**, B = **${nicknameB}**. Use real names in all nicknames and dialogue.

${ROMANTIC_SAJU_DEEP_OUTPUT_SCHEMA}

---

${buildFinalOutputRules(nicknameA, nicknameB)}

Output JSON only.
`.trim();
}
