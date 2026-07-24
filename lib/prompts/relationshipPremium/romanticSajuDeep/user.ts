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
2. **Canonical priority** — \`dynamics_digest\` (and other server Input lines) are authoritative. Narrative may explain and soften wording; it must **never contradict** leans, bands, match flags, directions, align, or confidence. If prose conflicts with canonical values, rewrite the prose.
3. No technical jargon — no Saju terms / Hanja in JSON values
4. **Must combine data** — apply 3 steps (confirm → combine/image → relational reading). State steps 1–2 in data_combination_note.
5. **Rich fields without claim rehash** — aim for 5–8+ sentences when adding a new function; do not pad by restating another section's thesis
6. First-person dialogue — raw "Actually, I…" phrasing with correct speaker binding (see naming rules)
7. Dialogue — conflict uses **dialogue_table only** (ban bad_example · hidden_psychology · positive_situation)
8. **Epistemic voice** — when digest shows \`confidence=high\` and \`align=confirms\` (or confidence absent), prefer direct wording. When \`confidence=low\` or \`align=caution\`, use offer-to-verify language only (lean / may / worth checking against real life). Do not assert low-confidence rows as plain facts.
9. Balance A and B
10. Fill every Output Schema field (no empties where required)
11. **comparison_table**: emotion expression · conflict reaction · love language · stress pattern · decision-making · communication — **6 rows required**
    - \`a\` column = **${nicknameA}** only, \`b\` column = **${nicknameB}** only (do not swap)
    - Each cell: describe without names/subjects (names are in headers). Ban "OO is…", "OO does…"
    - Referring to the partner: use **"to the partner"** / **"the partner"** (report for the two of them)
    - e.g. "Often shows gratitude to the partner." / "Tries to show love through actions."
    - **Emotion expression (감정 표현) row only**: if \`dynamics_digest.compare_expression\` is present, phrase that server lean — do **not** re-classify expressive vs reserved, and do **not** conflate with balance_of_power / expression_speed.
    - **Conflict reaction row only**: if \`dynamics_digest.compare_conflict\` (or person digest \`서버 lean=\`) is present, phrase that server lean — do **not** re-classify who is direct vs principled.
    - **Love language (애정 언어) row only**: if \`dynamics_digest.compare_affection\` is present, phrase that server lean — do **not** re-classify action_gift vs emotional_care, and do **not** conflate with reassurance need/give.
    - **Stress pattern (스트레스 패턴) row only**: if \`dynamics_digest.compare_stress\` is present, phrase that server lean — do **not** re-classify explosive vs withdrawn, and do **not** conflate with recovery_speed / residual.
    - **Decision-making (의사결정) row only**: if \`dynamics_digest.compare_decision\` is present, phrase that server lean — do **not** re-classify independent vs consultative, and do **not** conflate with balance_of_power / sublead.
    - **Communication (소통 방식) row only**: if \`dynamics_digest.compare_communication\` is present, phrase that server lean — do **not** re-classify direct vs considerate.
    - All 6 compare rows with server lean: phrase only; do not re-classify.
    - **Same lean = similarity ONLY (Round 2)**: if lean_A === lean_B (same token, including \`balanced\`/\`balanced\` and \`emotional_care\`/\`emotional_care\`):
      - Both \`a\` and \`b\` cells must describe the **same category**.
      - Differences only in intensity/context **if** canonical data supplies them; otherwise narrate **shared tendency + shared blind spot**.
      - **Valid** emotional_care/emotional_care: both cells about emotional care (not action/gift).
      - **Valid** balanced/balanced: both cells about balanced/flexible decision (not 유연 vs 신중).
      - **Forbidden**: same lean → "A는 감정, B는 행동" / "A는 유연, B는 신중".
    - Honor that row's \`confidence\` / \`align\` (see epistemic voice above).
    - **Low-confidence polish (Round 3)**: for \`expression\` / \`conflict\` / \`stress\` rows with \`confidence=low\` or \`align=caution\`, each cell must include one tentative marker (e.g. "~하는 편으로 보일 수 있다", "~에 가까울 가능성이 있다", "실제 관계에서 확인해 볼 부분이다"). Do **not** over-hedge high-confidence / confirms rows.
12. **section_5**: advice_for_a·b **3 each** — action_title + saju_reason (3+ sentences) + real_speech_tip required. real_life_example = **""**. together = Essence diary (3+ sentences), together_starter = conversation opener. Ban "in moments like this" scaffolding, nature metaphors, "just express feelings" clones.
    - **Per-tip loop (Round 4 — anti context-drift)**: write tips in order tip1 → tip2 → tip3 for A, then tip1 → tip2 → tip3 for B. **Before every tip** (including tip2 and tip3), re-apply this gate:
      1. Pick **exactly one** unused digest fact for this tip.
      2. Write sentence 1 of \`saju_reason\` as an evidence bridge from that fact (natural Korean — digest signal translated; never print 오행/격국/십성/한자 or \`compare_*\` keys).
      3. Only then write action + benefit.
      - Tip3 is **not** exempt. If tip3 would start with soft openers ("어떤 상황에서도", "상대의 감정을", "갈등 상황에서 서로의…") without a digest fact, **discard and rewrite tip3**.
    - **Evidence bridge (Round 4 — hard, every tip)**: the **first sentence** of every \`saju_reason\` MUST be a user-facing evidence bridge. No soft opener before it. tip1·tip2·tip3 all identical rule.
      - Valid bridges: "두 사람 모두 결정에서 균형형으로 잡히기 때문에…", "안심을 원하는 방식과 건네는 방식이 어긋날 수 있어서…", "감정 표현 속도가 다르게 잡히므로…", "갈등 뒤 회복 속도 차이가 보이기 때문에…", "스트레스 반응 결이 다르게 잡히므로…", "애정 언어 결이 다르게 잡히기 때문에…", "갈등 반응 기울기가 다르게 보이기 때문에…", "소통 방식이 다르게 잡히므로…"
      - Invalid: starting with "어떤 상황에서도…", "상대의 감정을 이해하고…", "서로 존중하며…", "갈등 상황에서 서로의 감정을 확인…" without a digest fact first.
    - After the bridge: one concrete action + benefit specific to that evidence. Internally draft source/fact/action/effect; emit Korean only (strip tags; never print \`compare_*\` keys).
    - **Forbidden**: "서로 존중하며 소통하세요", "감정을 솔직히 표현하세요", "서로의 차이를 이해하세요", tips copyable unchanged to an unrelated couple, few-shot content reuse.
    - Final self-check before JSON: scan all 6 \`saju_reason\` openings; any tip missing a bridge → rewrite that tip only.
13. **section_3 conflict**: dialogue_table **exactly 2 rows** — faster expresser + slower processor each ❌/✅. 50:50 balance; no model answers. Ban hidden_psychology. If \`dynamics_digest.expression_speed\` is present, keep the server \`direction\` for faster slot — do **not** reassign faster/slower from residual (residual is corroboration only, not direct evidence of expression speed)
14. **section_4_special_bond**: \`a_gives_b_headline\`+\`a_gives_b\`, \`b_gives_a_headline\`+\`b_gives_a\`, \`only_together_headline\`+\`only_together\` required. Follow few-shot structure. Ban nature metaphors and Mingli terms
15. **section_4_hidden_hearts**: both a_hidden and b_hidden required. Fully separate from special_bond
16. **section_1_summary**: do not generate (Headline Selector fills from Saju rules)
17. **section_1_relationship_dynamics / section_4_relationship_frames**: these 4 fields (balance_of_power, recovery_speed, reassurance_signal, unconscious_role_play) must be phrased **only** from \`dynamics_digest\` in Input data. Do not invent a different verdict than what the digest already decided — you are writing the narrative, not re-classifying. Never print the internal band/frame names (e.g. "leader", "savior_dependent") literally — translate them into natural language. Keep \`recovery_speed\` residual phrasing separate from \`expression_speed\` (do not treat residual as who expresses faster).
    - **Hard mismatch preservation (Round 3)**: when any \`일치:\` is \`false\`:
      1. First sentence of \`a_body\` / \`b_body\` / \`match_note\` must **explicitly** state the need/give gap.
      2. **Entire body** must stay consistent with mismatch — later sentences may name needs, current give styles, and how to translate between them, but must **not** claim they already reassure each other well, that the relationship currently provides mutual comfort, or that the mismatch is already resolved.
      3. Repair language only conditional/future: "맞춰 갈 수 있다", "확인해 볼 필요가 있다", "번역해 주면 도움이 된다".
      4. \`match_note\` must contain an audible mismatch phrase (어긋/불일치/맞지 않/갭…).
      - **Forbidden**: "결국 서로에게 큰 안심이 된다" / "이미 서로의 위안이 되고 있다" / "서로의 부족한 안심을 채워 준다" / "서로에게 안정감을 주는 관계"
      - **Valid**: "필요한 안심과 건네는 방식이 다를 수 있다." / "상대가 안심으로 받아들이는 표현을 따로 확인해야 한다."
18. **Dedup audit**: on subject-swapped mirroring, banned fluff, Saju jargon, bond nature metaphors, or cross-section claim rehash (same "comfort/stability/support" thesis in special_bond + frames + mutual_gift + nature) — **fully rewrite** that field
19. **Names & B-speaker binding**: write display names **exactly** as given. Ban **나님**, **저님**, doubling 님/씨, and inventing \`님\` on bare names (e.g. **${nicknameB}님** when the display name is **${nicknameB}**). Ban awkward \`${nicknameB}이의\` — use \`${nicknameB}의\`.
    - \`a_*\` 1st-person: "나" = **${nicknameA}**; partner = **${nicknameB}** only.
    - \`b_*\` 1st-person (\`b_nature.first_person_voice\`, \`b_nature.description\`, \`b_hidden.*\`): speaker = **${nicknameB}**; "나" = **${nicknameB}** only; partner = **${nicknameA}** only.
    - If **${nicknameA}** is the literal string \`나\`, B may call A **"상대"** (or another supplied non-self label) — never invent a second self.
    - **Forbid** in any \`b_*\` 1st-person string: \`${nicknameB}와의 관계\`, \`나와 ${nicknameB}\`, or using **${nicknameB}** as the partner.
    - Final self-check: scan all \`b_*\` 1st-person fields; if B's own display name appears as partner, rewrite before output.

Output language follows the system prompt locale instruction — do not hardcode a language here.
`.trim();

export function buildRomanticSajuDeepUserPrompt(params: {
  nicknameA: string;
  nicknameB: string;
  personBlockA: string;
  personBlockB: string;
  pairBlock: string;
  dynamicsBlock?: string;
  timelineBlock?: string;
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
    timelineBlock = "",
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

${timelineBlock}

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
