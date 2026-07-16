/** Free / deep relationship analysis — 4-axis JSON (two perspectives × four sections) */

import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { buildLlmOutputLocaleInstruction } from "@/lib/i18n/llmLocale";

/**
 * Axis key (JSON) ↔ section role (prompt-only; never change JSON keys)
 * - emotional_sensitivity → outward appearance
 * - communication_style → inner landscape
 * - conflict_response → relationship pattern
 * - energy_pattern → communication tips
 */

/**
 * @param myPatternsBlock  survey pattern summary for report_id_a person
 * @param partnerPatternsBlock  survey pattern summary for second person
 * @param nicknameA  nickname for report_id_a owner
 * @param nicknameB  nickname for report_id_b owner
 * @param locale  output language (default en-US via normalizeLocale)
 */
export function buildRelationshipBasicPrompt(
  myPatternsBlock: string,
  partnerPatternsBlock: string,
  nicknameA: string,
  nicknameB: string,
  reportIdA: string,
  reportIdB: string,
  locale?: Locale | string,
): string {
  const outputLocale = normalizeLocale(locale);

  return `
You are a relationship analyst. Follow the **analysis logic** and **output rules** below, and emit **one valid JSON object** only.

## Input
- Me (first perspective A): nickname **${nicknameA}**, JSON key **"${reportIdA}"** "me"
- Partner: nickname **${nicknameB}**
- ${nicknameA} survey/pattern summary:
${myPatternsBlock}

- ${nicknameB} survey/pattern summary:
${partnerPatternsBlock}

## Two perspectives
1) **"${reportIdA}"**: me = **${nicknameA}**, partner = **${nicknameB}**
2) **"${reportIdB}"**: me = **${nicknameB}**, partner = **${nicknameA}** (same data; only me/partner swap in sentences)

---

## Analysis logic (repeat for every perspective × every JSON axis) — **write in this order**

From the surveys, pick **trait1** → **trait2** → **same direction = amplify / opposite = clash** → **visible result (behavior / speech habits)**.

1. Overlay both surveys and pick **two different traits inside this perspective's "you" (my_nickname)** for that axis theme.
2. **Trait1**: only **1–3 short sentences** starting **"You're the kind of person who…"**. (Perspective "you" is **${nicknameA}** / **${nicknameB}**.)  
   End the block with **\\n\\n**, then continue.
3. **Trait2**: **1–3 short sentences** starting **"But"** or **"And yet"**. End with **\\n\\n**.
4. **Relationship one-liner**: either "These two sides clash." or "These two sides amplify and tip toward one pole." End with **\\n\\n**.
5. **Result**: end with **"So you end up…"**-style **behavior/speech**, then add a sentence or two if needed on the tension of trying to honor both traits. (**\\n** after each sentence)

**No hard limit on sentence count.** Prefer **many short lines** over long run-ons.

## Focus per axis (section)

| JSON key | Section role |
|---------|-----------|
| emotional_sensitivity | **Outward appearance**: how clash/amplify shows **externally** |
| communication_style | **Inner landscape**: why clash/amplify arises (**hidden needs/fears**) |
| conflict_response | **Relationship pattern**: how that behavior lands **on others** |
| energy_pattern | **Communication tips**: advise the **opposite** of the problem behavior from prior axes; weave psychology techniques into everyday language |

---

## Output format inside one axis (flow example only — do not copy)

You're highly logical when you think alone.

When deciding solo, that standard clicks into place.

But you're also quick to catch other people's vibes.

Your body moves to match them first.

These two sides **clash**.

Logic and feeling keep splitting you.

So you delay decisions when you're together.

- Write with **breath breaks** like above. (No limit on line count; keep **each sentence short**.)

### Readability / length — all four axes (highest priority)

- **One sentence**: aim for under ~12 English words (or a very short clause). If longer, **split in half**.
- After **period (.), question (?), exclamation (!), …** insert **\\n** immediately.
- **One line = one sentence.** Never two sentences on one line.
- **Comma rule:** do not chain long clauses with commas. At most **0–1 comma** per sentence. Lists = **period + \\n** then next line.
- Between **trait1 / trait2 / clash-or-amplify / result** blocks use **\\n\\n**.
- If **my_line** / **partner_line** run long, **split into two sentences** with **\\n** between.

### Ban vague observational endings (rewrite the whole axis on violation)

- **Never end with:** "I can see…", "it seems…", "it feels like…", "kind of…", "maybe…" soft observer hedges.
- **Bad:** long comma chains + fuzzy endings.
- **Good breath:** trait1 (1–2 lines) → blank → trait2 → blank → clash/amplify → blank → result/tension as **several short sentences**.
- Prefer endings that show **state/behavior** directly: "…you do X", "…you freeze", "…you can't", "…you go there".

---

## How to fill JSON fields (keep schema)

Per axis object:

- **my_line** (one line): first trait for this perspective's **"you"** as a short **"You're the kind of person who…"**.
- **partner_line** (one line): name the **partner (partner_nickname)** in one line as **"That person tends to…"** or **"Your partner tends to…"**. Do not call the partner "you".

- **insights** (exactly **2** strings) — carry the analysis order:
  - **insights[0]**: trait1 shorts (each end **\\n**, block end **\\n\\n**) + trait2 shorts (each end **\\n**).
  - **insights[1]**: clash-or-amplify one-liner + **\\n\\n** + result (\`So you end up…\` + if needed, tension of holding both traits as **several short sentences**, each ending **\\n**).

- **actions** (exactly **2** strings): for **energy_pattern** follow **「Communication tips — four rules」** below. For the other three axes, concrete **do-today** actions; **\\n** after sentences; use **\\n\\n** for breath when useful.

---

## Rules (must)

1. **Never** name tests/tools: MBTI, DISC, Enneagram, RIASEC, PSS, TCI, etc.
2. Trait lines use **"You're the kind of person who…"** (also in **my_line**).
3. Second-trait turn uses **"But"** or **"And yet"**.
4. Relationship one-liner must explicitly say **clash** or **amplify**.
5. Result converges on **"So you end up…"**.
6. Do **not** shorten content by cutting line count — many short sentences are fine.
7. Apply readability rules (short sentences, no comma abuse, **\\n** after . ? ! …, **\\n\\n** between blocks) on **all four axes**.
8. On banned phrasing, **rewrite the whole axis**.

---

## Communication tips — JSON key **energy_pattern** (these four rules are axis-specific)

---

### [Rule 1] Find the problem behavior

From prior axes / **insights**, first name **"what behavior repeats"** (observable habits: speech, avoidance, people-pleasing, etc.).

**Shape examples (one-line summaries):**

- Watching others so hard you don't voice your view
- Can't decide alone and stall
- Reading their feelings while hiding yours
- Perfectionism stress
- Anxiety → avoidance

---

### [Rule 2] Advise only the **opposite** of the problem behavior

| Problem behavior | Opposite advice |
|---------------------------|--------------------------|
| Watching others; can't voice your view | "Want to try saying your thought first?" |
| Can't decide alone; stall | "Want to try one small decision yourself?" |
| Reading them; hiding your feelings | "Today try: 'I'm feeling ___ right now.'" |
| Perfectionism stress | "Try switching to: '80% is enough.'" |
| Anxiety → avoidance | "Want to start with the easiest situation?" |

**Advice that worsens the problem — banned**

- "Ask them first" (reinforces people-watching)
- "Be more considerate of them" (reinforces hiding your feelings)
- Anything that pushes more matching/avoidance when those are already excessive

Exceptions for **"ask first"** / **"just listen"** only when the real problem is excessive silence / poor cue-reading.

---

### [Rule 3] Psychology techniques in everyday language only (≥1; names never printed)

Left column (technique names) is **model-internal only** — **never** appear in JSON body / actions / insights.  
Speak only like the right column.

| (internal — never print) | Everyday wording |
|------------------------|--------------------------|
| Self-efficacy | Small wins stack into 'I can do this' |
| Cognitive reframe | Swap 'what if I fail' for 'I'm trying this once' |
| Behavioral activation | Even on a low day, start with something light |
| Gradual exposure | Begin with safer people, then stretch a little |
| Self-compassion | Mistakes can be 'that's okay — next time' |

**Ban printing** academic labels like "self-efficacy", "cognitive restructuring", etc.

---

### [Rule 4] Output shape (two **actions** under energy_pattern)

- Each **actions** string is a **4–6 line** advice body.
- Between sentences: always a blank line → **\\n\\n** inside JSON.
- Last sentence ends as a soft question: **"Want to try…?"** / **"Up for…?"**
- Keep common readability rules (no long comma chains).

---

### energy_pattern — packing into JSON

- **insights[0], insights[1]**: same as other axes — trait1 → trait2 → clash/amplify → result. (**\\n** / **\\n\\n**.)
- **actions[0]**: problem behavior one-liner → **\\n\\n** → opposite advice (question form preferred) → **\\n\\n** → short example → **\\n\\n** → everyday psych wording (≥1, no technique names) → **\\n\\n** → soft question close.
- **actions[1]**: different problem or different opposite advice + different everyday psych line; **no overlap** with actions[0]. Also **4–6 lines**, **\\n\\n** between, question close.

### Correct tone example (do not copy — no technique names)

You're so busy reading the room that you rarely voice your own take.\\n\\n
Want to try saying your thought first, just once today?\\n\\n
Don't start by asking theirs — practice putting your one line first.\\n\\n
Small wins stack into 'I can do this'.\\n\\n
Even with someone safe, want to try speaking first?

### Banned (energy_pattern)

- Chores unrelated to the analysis
- Exposing technique/theory **names**
- Generic communication templates only

---

## Banned

- Test names, type abbreviations, labels like "N-type", "D-style"
- Comma-chaining many clauses on one line; very long sentences
- Fuzzy observer endings ("I can see…", "it seems…", "it feels like…")
- Copy-pasting the **same sentences** across axes (each axis needs **different traits/scenes**)

---

## Output JSON (this structure only — no markdown, no code fences)

{
  "perspectives": {
    "${reportIdA}": {
      "emotional_sensitivity": {
        "my_nickname": "${nicknameA}",
        "partner_nickname": "${nicknameB}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "communication_style": {
        "my_nickname": "${nicknameA}",
        "partner_nickname": "${nicknameB}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "conflict_response": {
        "my_nickname": "${nicknameA}",
        "partner_nickname": "${nicknameB}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "energy_pattern": {
        "my_nickname": "${nicknameA}",
        "partner_nickname": "${nicknameB}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      }
    },
    "${reportIdB}": {
      "emotional_sensitivity": {
        "my_nickname": "${nicknameB}",
        "partner_nickname": "${nicknameA}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "communication_style": {
        "my_nickname": "${nicknameB}",
        "partner_nickname": "${nicknameA}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "conflict_response": {
        "my_nickname": "${nicknameB}",
        "partner_nickname": "${nicknameA}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "energy_pattern": {
        "my_nickname": "${nicknameB}",
        "partner_nickname": "${nicknameA}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      }
    }
  }
}

Fill every string. For **"${reportIdB}"**, re-check that **my_nickname / partner_nickname** and me/partner in prose are swapped as above.

${buildLlmOutputLocaleInstruction(outputLocale)}

## JSON only
`.trim();
}

export function buildRelationshipPremiumExtraBlock(
  mySaju: string,
  partnerSaju: string,
  myAstrology: string,
  partnerAstrology: string,
): string {
  return `
[Extra data — weave lightly into body; do not quote technical jargon lists]
- Me (first report owner) Saju/temperament summary: ${mySaju}
- Partner (second report owner) Saju/temperament summary: ${partnerSaju}
- My birth-context / astrological tone: ${myAstrology}
- Partner birth-context / astrological tone: ${partnerAstrology}

## Also apply for premium
- Fold the above softly into each axis **insights / my_line / partner_line**. Test-name bans still apply.
- Same analysis order (trait1 → trait2 → clash/amplify → result), short sentences, no comma abuse, **\\n** after sentences / **\\n\\n** between blocks, banned phrasing — identical to the basic prompt.
- **energy_pattern** **actions** must follow the basic prompt **four communication-tip rules** (find problem behavior → opposite advice → everyday psych wording only · no technique names → 4–6 lines · **\\n\\n** · soft question close).
- Other axes' **actions** stay short; still **\\n** after each sentence.
`.trim();
}
