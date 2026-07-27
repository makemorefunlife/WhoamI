# 06. Experience Design System
## Ahaitsme Relationship Experience — Expression, Brand, and Interaction SSOT

> **Status:** Canonical Experience Design System — expanded 2026-07-27 from the former "Visual Design System" to absorb brand identity, IA/navigation principles, and the full report-grammar/component-verdict ledger, per the canonicalization refactor (`10`).
> **Owns:** Brand identity (mark, color, type), typography, color, spacing, motion, accessibility, IA/navigation principles, report grammar (card/section/chart/loop/evidence/empty-state anatomy and per-module visual verdicts), component anatomy, chart selection, empty states, presentation rules, the **Shared Visual Asset Library** (stable VA-IDs and geometry contracts), and forward-looking extensibility ("future app considerations") for relationship experiences.
> **Does not own:** Product meaning, module content, evidence classification, confidence/severity assignment, narrative voice, product-specific axes/labels/thresholds/warnings/actions (those remain in `05_Relationship_Product_Bible.md`, domain `05*` blueprints, `05A`, and `02`). Does not own current-implementation status (→ `08`) or design-exploration rationale/product-owner decisions (→ `09`).
> **Inherits:** Product metaphor intent and §13D visualization/evidence contract from the Product Bible; Romantic module architecture and anti-dashboard laws from `05A`.
> **Absorbed in this expansion (superseded, archived under `docs/product/archive/`):** former Visual Foundations trail (`ARCHIVE_Visual_Foundations.md` — typography/color/motion reasoning and visualization-concept vocabulary; see §5A, §10A below), former Romantic module-evaluation trail (`ARCHIVE_Romantic_Module_Visual_Evaluation.md` — full per-module visual-verdict ledger; see §6A below), and the visual-language/pattern-map/signal-display/progressive-disclosure sections formerly duplicated in `05_Relationship_Product_Bible.md` §14–§18 (now pointers there; substance lives here).
> **Validated against:** Romantic’s locked ten-module architecture (`05A` §7); written to generalize across relationship products.
> **Brand-identity note:** §3.2’s color tokens were corrected 2026-07-27 to match the actual, product-owner-confirmed shipping brand (Stitch → Lovable-refined → repository-implemented), per `09_Product_and_Design_Intent_Package.md` §2. The previous version of this table specified a palette (muted teal/clay person colors, a peach Romantic accent, a blanket no-gold rule) that was never actually implemented anywhere in the codebase — an aspirational, undeployed alternative rather than the brand. That palette is retired below in favor of the real one.

---

# 0. Document Law

1. This document is the sole governing Experience Design System (visual + IA expression + report grammar) for relationship products.
2. If implementation conflicts with this document, implementation is wrong until product explicitly supersedes a rule here.
3. Product SSOTs (`05`, domain `05*`) win on meaning; this document wins on expression and shared asset geometry.
4. Absence beats filler. Insufficient evidence → render nothing, never a thin fake module.
5. No grade, rank, fate, dashboard-first entry, red/green moral coding, or decorative mysticism.
6. **Shared geometry ≠ shared meaning.** Products reference Visual Asset IDs (VA-xx). They must not redefine asset geometry, and shared assets must not force shared axes, labels, thresholds, warnings, or actions.
7. Binding UX sequence for major visuals (Product Bible §13D.5): **Visual First → Explanation → Story → Action**.

---

# 1. Brand and Visual Identity

Ahaitsme’s visual identity is:

> **calm authority · warmth · clarity · editorial quality · emotional intelligence · premium restraint**

## 1.0 Brand identity constants (locked, product-owner confirmed)

These are identity, not exploration surface — a redesign changes composition/IA/pacing (§7 onward), never these:

| Element | Value | Notes |
|---|---|---|
| Brand mark | "Ai" monogram, `public/brand/logo.png`, alt "Aha It’s me!" | The product’s identity anchor |
| Ground | Warm cream paper, `#faf7f0` | Not clinical white, not dark-ink-default |
| Primary ink | Deep green, `#1a3328` | Authority without coldness |
| Secondary / brand accent | Emerald, `#3a8f6e` — used platform-wide, including on Romantic surfaces | The product’s "teal-led" active color |
| Tertiary / atmosphere | Soft rose, `#c49a9c` | Secondary warmth note |
| Restrained gold accent | `#d6b46a` | Governed, sparing use — genuine emotional-beat/premium emphasis only; never a ground color; never paired with a dark "solemnity" treatment |
| Editorial serif | Lora | Hero lines, module titles, pull-quotes |
| Humanist sans | Manrope (Stitch surfaces) / Geist (base body) | Body, cards, UI, labels, buttons |
| Corner radius | Large, soft — ≈1.75rem | Warm, non-clinical geometry |

**Provenance:** this identity began in Google Stitch, was refined through Lovable, and is implemented today in `app/globals.css` / `app/stitch-theme.css` / `components/brand/Logo.tsx`. Current-implementation classification of exactly which routes/components carry this baseline today lives in `08_Current_Product_Implementation_Design_Extraction.md` Appendix A — this document owns the *values and rules*, `08` owns the *as-built inventory*. The product-owner rationale for preserving this identity as-is (rather than treating it as an open design question) lives in `09_Product_and_Design_Intent_Package.md` §2 — this document does not repeat that rationale, only the resulting tokens and rules.

## 1.1 Six forbidden tells

Any candidate that matches a tell is disqualified unless substantially reworked.

| Must not resemble | Concrete tell |
|---|---|
| Medical dashboard | Multiple gauges as primary focus; clinical red/yellow/green status; numeric readout as the card’s main focal element |
| Astrology chart generator | Mystical iconography; decorative wheels; dark ground + metallic gold; pseudo-precise cosmic solemnity |
| Enterprise analytics | Dense small-multiples grids; KPI phrasing applied to a relationship; sortable tables as the primary story |
| Game result screen | Confetti/celebration on thresholds; badges/achievements; partner leaderboard ranking |
| Compatibility quiz | “87% Compatible!” headline; virality-first share card; generic archetype disconnected from evidence |
| Personality-test meme | Emoji-as-primary labels; “which type are you” framing that collapses a person into a category |

## 1.2 Visual subject

The primary visual subject is **the relationship between two people**, not two competing profiles.

Symmetric dignity is mandatory: tension findings use the same register and craft as strength findings. Behavior ≠ identity visually.

---

# 2. Universal Design Principles

1. **One idea per screen fold.** If two elements compete for attention, one is wrong.
2. **Interpretation before evidence.** Visual intensity decreases as technical detail increases.
3. **No grade, rank, or fate.**
4. **No dashboard-first entry.** First content is a narrative scene, never a panel of gauges.
5. **Dignity is content-independent.** No alarm styling for hard content.
6. **Fewer, better decisions.** Prefer one existing library component over inventing a third visualization of the same comparison.
7. **Absence beats filler.**
8. **Motion reveals; it never performs.**
9. **Never color alone.** Pair every color distinction with text label and/or shape/position.
10. **Whitespace is part of the reading experience** at every breakpoint.

### Visual intensity hierarchy

```text
Interpretation
→ Key pattern
→ Meaningful measurement
→ Supporting evidence
→ Methodology
```

---

# 2A. IA and Navigation Principles

*(Absorbed 2026-07-27 from `05_Relationship_Product_Bible.md` §18, which owned this material as "Progressive Disclosure & Interaction Safety." The underlying product law — recognition before advice, meaning before measurement — remains owned by `05` §2.4/§13A; this section owns the structural/navigation expression of that law. `05` now points here rather than restating it.)*

## 2A.1 Progressive disclosure (structural pattern)

Do not place the whole relational system on one screen.

- Reveal one question at a time.
- Use sticky visuals only when they improve understanding.
- Use pauses after emotionally dense material.
- Do not use aggressive scroll-jacking.
- Provide clear textual meaning independent of motion.

Standard depth chain: **Headline → Explanation → Evidence → Deep Read**, per `02`. Each surface in the chain adds a distinct function for the same insight — never duplicates the prior surface's job (§4.3 Component purpose hierarchy governs which component does which job).

Device-specific layout patterns and accessibility implementation are owned here; product law that **information hierarchy remains consistent** across mobile and desktop is owned by `05`. Desktop must not become a dense dashboard merely because space is available.

## 2A.2 Navigation patterns

- **Tabs** switch parallel, same-shape views (e.g., per-person actions). Never a multi-context gauge-dashboard switcher.
- **Sheets** hold overflow actions and setup flows (partner add, kind selection, perspective picker) — not primary report content.
- **Horizontal scroll** is reserved for genuine sequential/time data (a Horizon timeline). Never a density workaround elsewhere.
- **No persistent bottom tab bar** is required across relationship flows; mobile overflow is handled by sheets, not a fixed nav bar, unless a future app-shell decision changes this (§12).
- A viewer-perspective control (e.g., Family's Track A/B picker) belongs in participant-setup navigation, not buried as a report-body toggle — see `08` for its current implementation and `09` for cross-domain composition-model implications.

## 2A.3 Interaction safety

Avoid interactions that imply users can physically "fix" a relationship with one gesture. A hold-to-mend or similar single-gesture "repair" interaction is emotionally compelling but must remain a prototype, not a production requirement — repair must stay practical and relational, not magical.

## 2A.4 Localization & cultural adaptation (navigation-relevant excerpt)

Localization is not direct translation. Shared structure remains stable; examples and assumptions may adapt. Areas requiring cultural care include independence, family involvement, social obligations, gender expectations, household roles, marriage expectations, workplace hierarchy, emotional directness, public vs private affection, and financial coordination. Do not assume one cultural pattern is universally healthy. Distinguish difference, preference, cultural norm, coordination burden, and harmful behavior — without erasing genuine strain. (Full localization/cultural rules, including component-level bilingual layout tolerance, remain in §9 below; this entry exists so the navigation-and-disclosure material stays together as one unit.)

---

# 3. Universal Token System

These tokens are the expression SSOT. Current code that conflicts must migrate toward them; product meaning does not wait on migration.

## 3.1 Typography

Three registers map to Fact → Meaning → Experience (`02`):

| Register | Character | Use |
|---|---|---|
| **Editorial serif** | Warm humanist serif (KR: Noto Serif KR–class; Latin: Georgia/Tiempos-class) | Hero line, module titles, pull-quotes, relationship signature sentence |
| **Humanist sans** | Single bilingual-native family (Pretendard-class) for Hangul + Latin | Body, cards, UI, labels, buttons |
| **Data / mono** | Tabular figures or monospace | Axis labels, evidence tags, timestamps, deterministic numeric labels — never narrative |

### Scale (five jobs only)

1. Hero headline  
2. Section / module title  
3. Card headline  
4. Body  
5. Caption / data label  

Do not invent a sixth size without a new job.

### Rhythm

- Measure ≈ 45–75 characters for long-form narrative  
- Body line-height ≈ 1.6–1.7  
- Bold reserved for serif emphasis and rare true emphasis; body sans mostly regular/medium  
- Tabular figures wherever A/B numbers align vertically or side-by-side  

## 3.2 Color (corrected 2026-07-27 to the real brand — see §1.0)

### Ground
Warm cream paper, `#faf7f0`, as the default report ground. Not clinical white. Not dark-ink resting state. The legacy dark "Space" register (`--bg-1 #070b14` and related tokens) is a pre-Stitch register still reachable on marketing pages and some non-Romantic premium bodies — it is **not** the brand default and is a migration target, not a "deliberate register shift" to design toward.

### Forbidden
- Dark ground + gold "astrology solemnity" **as a combination** (a restrained gold accent on the brand's normal cream ground is compliant — see §1.0)
- Red/green traffic-light judgment as primary score encoding
- Gendered default blue/pink person coding

### Person differentiation
Two equal-weight, equal-warmth hues, distinct from the brand's own primary/secondary pair so a reader never confuses "which person" with "the brand accent":

| Role | Token intent |
|---|---|
| Person A | The brand emerald (`#3a8f6e`) or a close, equal-weight tint |
| Person B | The brand rose (`#c49a9c`) or a close, equal-weight tint |

Never encode good/bad via person color. Exact final token pairing is an implementation detail within this constraint, not a re-opened brand question.

### Confidence (opacity + label)
Same primary-ink family (`#1a3328`); opacity communicates support strength:

| Confidence | Opacity intent | Always pair with |
|---|---|---|
| High / Corroborated | ~100% | Text label (e.g. "여러 신호가 같은 방향") |
| Medium / Refined | ~70% | Text label |
| Low / Tentative | ~45% | Text label ("잠정") |

Confidence ≠ relationship quality ≠ severity.

### Tension vs strength (warm/cool — not moral)
Within the brand's own muted family:

| Meaning | Encoding |
|---|---|
| Strength / supportive | Cooler ink (deep green) tone + label |
| Friction / tension | Warmer rose tone + label |

**Never** green=good / red=bad as the primary story chrome.

### Score-bar / gauge encoding — locked replacement

Current `scoreBarAppearance` green / amber / coral tiers **fail** this system and must not define the visual language going forward.

Replacement contract for any remaining numeric evidence bars:

1. Prefer **banded qualitative labels** (range or category) over exact-looking precision.
2. Encode magnitude with **bar length + opacity**, not traffic-light hue.
3. Encode polarity (`higher_better` / `higher_worse`) in **copy and axis direction**, not by flipping to "warn red."
4. Always show: construct label, range/reference, short interpretation, access to methodology.
5. Rounded integers or bands only — no cosmetic decimals.

### Domain accents (quiet, non-moral — currently shipped values; open detail, not a re-litigated question)

| Domain | Current shipped accent |
|---|---|
| Romantic | `#3a8f6e` (brand emerald, on Stitch surfaces) / `#ffd6a5` (legacy peach, on the dark register) |
| Work | `#67b7ff` |
| Cohabitation / Marriage | `#d4a5e8` |
| Family | `#9ed4b8` |
| Friendship | `#7ec8ff` |

**Romantic accent (revised):** the brand emerald `#3a8f6e` is confirmed correct for Romantic — see §1.0 and `09` §2.3. A prior version of this document forbade using the brand green on Romantic specifically (to avoid colliding with a retired "success" green); that rule is retired in favor of product-owner direction to preserve the teal-led family everywhere, including Romantic. Whether each of the five domains should keep a small *distinguishing* secondary tint on top of the shared brand accent, or share the identical accent, remains an open, low-priority detail — tracked in `09` §6.13, not decided here.

## 3.3 Spacing

Mobile-first spacing scale (rem at 16px root):

| Token | Value | Use |
|---|---|---|
| `space-1` | 4px | Tight inline gaps |
| `space-2` | 8px | Chip / label gaps |
| `space-3` | 12px | Compact stacks |
| `space-4` | 16px | Default card internal rhythm |
| `space-5` | 24px | Section block gaps |
| `space-6` | 32px | Module breaks |
| `space-7` | 48px | Major journey pauses |
| `space-8` | 64px | Chapter / deep breath |

Report column: max readable width ≈ `max-w-lg` / `max-w-xl` class of container; do not stretch narrative to full desktop width.

Card padding: ≥ `space-4` mobile; `space-5` from `sm` up.

## 3.4 Motion

| Rule | Spec |
|---|---|
| Purpose | Reveal reading order, approach/distance, activation, escalation, recovery, blend, interrupt |
| Duration | 150–250ms; standard ease-out |
| Forbidden | Bounce, pulse, score count-up, confetti, sparkle, chime, scroll-jacking drama |
| Reduced motion | Default assumption; every motion meaning has a static equivalent (labels, arrows, sequential cards) |
| Interaction safety | Never imply the user can “fix” the relationship with one gesture; Kintsugi hold-to-mend remains prototype-only |

## 3.5 Accessibility

1. Contrast ≥ 4.5:1 body; ≥ 3:1 large text / UI components.  
2. Never color-only distinctions.  
3. Every chart ships a one-sentence plain-language restatement.  
4. Tap targets ≈ 44px minimum.  
5. No silent truncation across locales (KO often shorter than EN; layouts must tolerate both).  
6. Keyboard-accessible disclosures; charts usable without hover.  
7. Screen-reader descriptions for non-text visuals.

---

# 3A. Shared Visual Asset Library

Stable asset IDs for cross-product reuse. Products **reference** these IDs; they do not redefine geometry.

**Shared:** layout grammar, interaction patterns, density rules, empty states, accessibility obligations.  
**Product-owned:** axes/rows, labels, narrative meaning, thresholds, warning overlays, action consequences (Product Bible §13D.8).

| ID | Asset | Typical job | Geometry notes |
|---|---|---|---|
| **VA-01** | Radar | Holistic profile shape (evidence companion) | Density-capped; not default 11-axis duel; not headline |
| **VA-02** | Comparison Table | Fast A/B + between tendency scan | Columns: Aspect · A · B · Relationship effect |
| **VA-03** | Relationship Map | Two-axis / positional relationship pattern | Pattern identity, not grade quadrants |
| **VA-04** | Difference Map | Meet / miss / translation framing | Story before dense evidence; paired with selective bars or capped radar |
| **VA-05** | Timeline | Sequence, horizon, revisit waypoints | Time as story, not fake precision |
| **VA-06** | Loop | Recurring interaction cycle | Must show a break/repair affordance; avoid fatalism |
| **VA-07** | Dialogue | Translation / before–after speech | Pair-specific; evidence-linked |
| **VA-08** | Role Matrix | Roles, contribution, handoff | Type labels, not rank crowns |
| **VA-09** | Environment Matrix | Exploratory fit hypotheses (e.g. work settings) | Never profession/success verdict chrome |

### Asset usage rules

1. Cite the VA-ID in product/technical blueprints when specifying a visual.
2. One major visual answers **one** human question first (Visual First → Explanation → Story → Action).
3. Psych vs Saju source identity must remain readable when assets are adjacent (Product Bible §13D.2).
4. New geometry enters the library only after the visualization rubric (§10)—do not invent a parallel table/radar per domain.

---

# 4. Universal Component Anatomy

## 4.1 Section / module shell

```text
Module title (one human question)
→ Opening finding / scene (conclusion first)
→ Primary visual OR narrative body
→ Supporting evidence (expandable)
→ Optional Deep Read
→ Transition / next question hook
```

## 4.2 Card anatomy

A card delivers **one idea**.

Required:

- short label (optional)
- insight headline
- concise explanation (~40–90 words)
- confidence-aware tone
- optional directional cue
- optional deep-link into the owning module

Must not:

- use a score as the headline
- pack multiple unrelated insights
- expose internal enum names
- exist only to fill a third layout slot

If the idea needs multiple paragraphs → it is a module body, not a card.

## 4.3 Key-signal portfolio (digest / summary surfaces)

When a three-card portfolio is used:

```text
Defining dynamic · Stabilizing resource · Meaningful tension / growth edge
```

Never fabricate a third card for symmetry.

## 4.4 Comparison table anatomy (VA-02)

Preferred columns:

| Situation / Aspect | Person A | Person B | Relationship effect |

Rules:

- Scan-friendly cells; no paragraph dumps  
- Gap meaning explained in the effect column or adjacent copy  
- Difference is not automatically friction  
- No winner/loser or good/bad cell chrome  
- When Psych notes and Saju rows appear near each other, keep **source identity** visible (Product Bible §13D.2–13D.3)  
- Mobile: horizontal scroll only if necessary; prefer stacked paired rows when cells grow  
- Product Blueprints own row vocabulary; this section owns geometry only  

## 4.5 Chart selection (by question)

| User question | Preferred form | Asset ID |
|---|---|---|
| Where do we differ? | Paired bars or dot plot / VA-02 | VA-02 / paired bars |
| Holistic profile shape? | Density-capped radar (exception) or limited profile | VA-01 |
| Meet / miss / translation? | Difference Map framing | VA-04 |
| Strongest / weakest areas? | Ranked horizontal bars | — |
| Balance of an interaction? | Diverging / balance scale or Relationship Map | VA-03 |
| Pattern over time / cycle? | Sequence, loop, or waypoint timeline | VA-05 / VA-06 |
| Roles / contribution? | Role Matrix | VA-08 |
| Environmental fit hypotheses? | Environment Matrix | VA-09 |
| What supports a conclusion? | Signal stack / chip row + expandable evidence | — |
| How confident? | Opacity + text label (not a rainbow meter) | — |

### Radar policy (VA-01)
Radar is an **evidence companion**, never a headline or default 11-axis duel.

Use only when:

- axes are capped (3–5 in default view; full 11 only in opted-in detail),
- scales match,
- the set forms a meaningful profile,
- the job is holistic shape—not precise pairwise gaps.

Psych 11-axis data driving VA-01 remains **survey evidence**, never labeled as Saju-derived.

### Graph annotation (required — Product Bible §13D.4)
1. Plain-language title (the human question)  
2. One sentence: what to notice  
3. Clear labels and scale direction  
4. Why the pair appears in this pattern  
5. What to do next / how to open explanation  
6. Optional expandable interpretation  
7. Text equivalent takeaway  

Major visuals follow **Visual First → Explanation → Story → Action**.

### Type, not rank (expression)
Colors, quadrants, and shapes mark **pattern type**, not grade.  
Red / danger styling is reserved for an independently supported warning or risk overlay—not ordinary difference or style-tension magnitude (Product Bible §13D.7). Legacy traffic-light score tiers remain non-compliant (L4).
## 4.6 Canonical signal presentation

Canonical signals are **evidence-backed micro-insights**, not badges or rankings.

Recommended UI:

- phrase-based chip or contextual signal line  
- directional A→B / B→A only when supported  
- expandable “Why we see this” evidence  
- no score  
- no universal signal dashboard  

Null direction → omit the directional UI.

Residual emotion: prefer text-in-context over a standalone chip unless product later promotes it.

**Placement intent:** the current six canonical signals are Romantic-specific (decision `018`: "Romantic must not be used as a shared domain-judgment template" — a future domain owns its own signal set, not this list). Their per-module placement is recorded once, in full, in §6A.11 (Romantic Module Visual Evaluation Ledger, Cross-Cutting Appendix) rather than restated here — this subsection owns the universal *display rule* (chip/phrase-based, directional-when-supported, no score), §6A.11 owns *which module* each Romantic signal appears in.

## 4.7 Evidence & confidence display

Progressive evidence levels:

1. **Plain-language support** in the main narrative  
2. **Expandable signal summary**  
3. **Technical reference** (methodology / thresholds) — never in the default reading path  

Do not confuse:

| Dimension | Answers |
|---|---|
| Confidence | How strongly can we support this? |
| Severity | How consequential is it? |
| Score magnitude | How much of a measured construct? |

## 4.8 Empty / null / fallback states

| Condition | Presentation |
|---|---|
| Insufficient evidence | Omit the component entirely |
| Tentative only | Show with explicit tentative label; reduced opacity; no fake mid-score |
| Null direction | Omit A/B ownership chrome |
| Duplicate of higher-priority insight | Suppress; do not rephrase as a new card |
| Unsupported curiosity topic | Do not invent a scored module |
| LLM narrative missing | Deterministic headline/body fallback if product provides one; else omit that block |
| Chart would be decorative only | Prefer prose |

Unknown must remain visibly unknown—never convert missing evidence into an average-looking neutral score.

## 4.9 Relationship-flow visualization

For recurring interaction loops:

**Preferred:** mobile-adapted loop / sequence diagram (not a literal desktop-only circle that collapses poorly).

Required:

- trigger  
- A response  
- B interpretation / response  
- escalation  
- interrupt / repair entry point  

Always show **where the loop can be interrupted**. Fatalistic closed loops without an exit are forbidden.

Fallback: vertical sequence cards with the same structure.

## 4.10 Save / Share / Revisit presentation

In scope as a **product surface around the modules** (`05A` §7.2)—not an 11th narrative chapter and not a virality quiz card.

### Allowed
- Shareable **relationship signature sentence** (+ optional quiet abstract motif)  
- Saved insight cards that preserve nuance  
- Conversation prompts  
- Revisitable action plan  
- Partner-friendly summary **only if** product locks a distinct partner-facing scope  

### Forbidden
- Grade / percentage as the share headline  
- Weaponizable score or “who is worse” framing  
- Mockup dark-gold share square as the default treatment  
- Treating Fingerprint generative art as the Hero  

### Relationship Fingerprint (locked decision)
May be prototyped only as an **optional end-of-report share artifact**, never as the primary Hero. Prefer signature sentence + abstract motif unless a genuinely data-derived mark is product-approved and technically justified.

---

# 5. Organic Editorial Hybrid (metaphor vocabulary)

Product Bible locks a **coherent vocabulary**, not one global metaphor:

| Vocabulary | Use for |
|---|---|
| **Fluid Dynamics** | Emotional climate, mutual influence, blended states, chemistry |
| **Celestial / Binary Orbit** | Autonomy–connection, optimal distance, closeness rhythm |
| **Threads / Tension / Mending** | Friction loop, carrying load, repair, shared history |
| **Topography** | Becoming / horizon paths (sparingly) |

Implementation rule: choose the vocabulary that answers the module’s question. Do not skin every module as planets or every module as water.

Insight→pattern map: see §5A immediately below (absorbed here 2026-07-27 from the Product Bible, which now points here rather than restating it). This document implements those patterns with the component library below—without inventing a second Romantic module list. **Romantic module catalog remains `05A` §7.**

---

# 5A. Insight-to-Visual Pattern Map

*(Absorbed 2026-07-27 from `05_Relationship_Product_Bible.md` §15, which duplicated this table. The insight definitions themselves — user question, emotional value, evidence, narrative rules — remain owned by `05` §12 Relationship Insight Bible; this table owns only the visual-pattern and interaction assignment, and `05` now points here rather than restating it.)*

| Insight | Recommended Pattern | Interaction |
|---|---|---|
| Relationship Identity | Paired emblem / dynamic mark | subtle reveal |
| Emotional Climate | Gradient field | scroll blend / focus labels |
| Mutual Activation | Dual flow | directional tap |
| Social Energy | Three-zone ecology | toggle A / B / Together |
| Synergy & Drain | Resource trade-off | reveal same-root mechanism |
| Why This Person | Constellation cause chain | progressive disclosure |
| Optimal Distance | Binary orbit / optimal band | adjust closeness carefully |
| Role Formation | Dynamic role field | scenario toggle |
| Balance of Power | Situational influence map | context tabs |
| Friction Loop | Feedback loop | pause / interrupt point |
| Hidden Need | Outer/inner layer | tap to reveal meaning |
| Reassurance Signal | Signal pair | compare offered vs received |
| Recovery Speed | Dual curves | time progression |
| Residual Emotion | Emotional tail | fade duration |
| Repair Path | Mending sequence | slow guided reveal |
| Becoming | Topographic routes | current / possible toggle |
| Daily Life | Scenario system | situation cards |

Every row above is subject to the same rubric as any other visualization decision (§10) and the same Visual Asset Library discipline (§3A) — this table records product-intent pattern *assignment*, not a license to invent new geometry per row.

---

# 6. Romantic-Specific Application

Romantic inherits all universal rules. This section maps them onto the locked ten modules.

## 6.1 Journey chrome

- Opening is editorial Trailer / Opening Scene—**no grade badge**, no three-gauge dashboard as identity.  
- Optional Hero orientation triad (Connection / Stability / Sensitivity), if used, is **orientation only**—never letter grades or ranks.  
- Density rhythm: alternate rich text, quick visual, recognition example, actionable summary.

## 6.2 Module visual map

| Module | Primary visual | Notes |
|---|---|---|
| 1 Opening Scene | Narrative Scene Card + optional Abstract Relational Motif | Text-led; no score dial |
| 2 Difference Map | Comparison Table + Density-Capped Radar companion | Shared / complementary / translation-required framing |
| 3 Relationship Flow | Loop / sequence + Canonical-Signal Chip Row | Interrupt point required; roles as patterns not identity |
| 4 Hidden Heart | Emotional Layers Card (surface / underneath) | Deep Read optional depth |
| 5 Why Special | Arrow-Card Pair (A→B / B→A) + synthesis | Uniqueness ≠ destiny |
| 6 Conflict Translation | Progressive Reveal dialogue (said/meant → heard → better) | Speakable lines; no theatrical scripts |
| 7 Do / Don’t | `PairPrescriptionSection` pattern | Actions tied to prior insights |
| 8 Repair Guide | Numbered step sequence | Account for recovery-speed asymmetry |
| 9 Next Step | Per-person tabbed action list | **Default tab = viewing reader** |
| 10 Relationship Horizon | Horizontal-scroll waypoint timeline | Tendency language; no countdown fate |

Depth / surfaces:

| Surface | Visual |
|---|---|
| Deep Read | Shared `DeepReadCard` pattern — deepen, do not restart |
| Save / Share / Revisit | §4.10 |

## 6.3 Romantic component library (disposition)

| Component | Status | Use |
|---|---|---|
| Narrative Scene Card | Build | Opening |
| Abstract Relational Motif | Build | Quiet Hero signature |
| Comparison Table (consolidated) | Refine + unify | Difference Map / A–B rows |
| Density-Capped Radar | Rebuild from current radar | Difference Map companion only |
| Loop Diagram | Build | Flow (mobile-adapted) |
| Canonical-Signal Chip Row | Build | Flow evidence strip |
| Emotional Layers Card | Build | Hidden Heart |
| `DeepReadCard` | Keep + adopt in Romantic | Depth layer |
| Arrow-Card Pair | Build | Why Special |
| Progressive Reveal Table | Build | Conflict Translation |
| `PairPrescriptionSection` | Keep | Do / Don’t |
| Numbered Step Sequence | Keep | Repair |
| Per-Person Tabbed Actions | Keep | Next Step (viewer-default) |
| Horizontal Waypoint Timeline | Build | Horizon |
| Ring Gauge ScoreBoard | Rebuild / retire from identity role | Not Hero; not grade proxy |
| TriScore / Mini bars | Refine | Evidence-tier only; no emoji-as-primary; new color contract |
| Grade dial / gauge dashboard | Remove | Never build |

## 6.4 Next Step default tab (locked)

Default to the **viewing reader’s** action list first, then the partner’s. Matches second-person Romantic framing.

## 6.5 Romantic accent (revised — see §3.2)

Domain accent: brand emerald `#3a8f6e` on Stitch surfaces (confirmed correct per `09` §2.3), with legacy peach `#ffd6a5` still present on the unmigrated dark register. The prior lock on a separate desaturated peach/clay accent (`#E2C4A8`) is retired — it was never implemented and is superseded by product-owner direction to preserve the shared brand accent everywhere, including Romantic.

---

# 6A. Romantic Module Visual Evaluation Ledger

**Authority:** This is the sole KEEP / REFINE / REPOSITION / REBUILD / REMOVE ledger for Romantic module visuals. Product module definitions remain in `05A`; as-built status remains in `08`.

## 6A.0 How to use this ledger

Apply in `05A` journey order: Opening Scene → Difference Map → Relationship Flow → Hidden Heart → Why This Relationship Is Special → Conflict Translation → Do/Don't → Repair Guide → Next Step → Relationship Horizon.

Four early-brief names map to locked modules (do not invent extra modules): **Relationship Summary** → Opening Scene (§6A.1); **Recurring Patterns** → Relationship Flow (§6A.3); **Growth Journey** → Relationship Horizon (§6A.10); **Canonical Signals** → cross-cutting placement only (§6A.11).

For each module: run the §10 rubric (hierarchy tier, density budget, candidate checks), then record one verdict with the binding recommendation. Verdicts below are **locked design rules** for Romantic expression unless product law in `05A` changes.

## 6A.1 Opening Scene (Hero)

*05A Module 1 — "This is your relationship." Folds in "Relationship Summary."*

**Pre-check.** Locked law: must not imply a grade, rank, or score (`05A` §15/Law 5). Hierarchy tier: Interpretation — the single highest-intensity artifact in the report. Density budget: effectively zero — at most one number, only if genuinely load-bearing.

**User question:** "What kind of relationship is this, in one glance?" **Emotional goal:** Recognition. **Information priority:** Critical — must work standing completely alone.

**Candidates considered:** (A) a narrative scene card — a short, specific 2–4 sentence recognizable moment followed by the one-line relationship definition as a pull-quote; purely text-based, cheapest to implement well, but lives or dies on narrative-generation quality. (B) an abstract relational motif — a quiet, consistent abstract graphic (two intertwining forms, a shared horizon line) as a visual signature; risks becoming decorative filler if not tied to real data. (C) a Relationship Fingerprint as hero visual — a unique generative pattern derived from the couple's data; highly shareable but carries no legible information on its own, and only avoids the personality-quiz tell if genuinely data-derived. (D) a score-led dial (the retired mockup's A–F grade + numeric score) — included only to formally rule out; directly violates Law 5 and fails the negative-space test twice (medical-dashboard and astrology-wheel tells).

**Verdict: REBUILD** (relative to the current `RelationshipScoreBoard`-anchored, grade-adjacent approach). **Recommendation:** lead with the narrative scene card (A) as the module's entire content; use the abstract relational motif (B) as a persistent, quiet signature behind it, not a competing element. Do not use the Fingerprint (C) as the primary hero element — worth revisiting only as a closing share-card device (§6A.11 vocabulary appendix). The score-led dial (D) is excluded outright.

## 6A.2 Difference Map

*05A Module 2 — "This is where you meet and miss." Primary treatment of the 11-axis data.*

**Pre-check.** Locked law: radar and comparison tables remain evidence assets, never the primary story driver. Hierarchy tier: Evidence. Density budget: 3–7 axes for the headline treatment; the full 11 only inside an opt-in detail view, if at all.

**User question:** "Where do we naturally align, and where do we actually differ?" **Emotional goal:** Light, safe surprise, without threat. **Information priority:** Important — the first "proof" moment after the Hero.

**Candidates considered:** (A) paired bar/dot-plot comparison — precise, scannable, stacks naturally on mobile, but delivers less "overall shape" than a radar. (B) density-capped radar (3–5 axes, shape only) — gives an immediate "shape of this couple" impression, but of every candidate in this ledger sits closest to the astrology-wheel tell purely by being a circular polygon; only clears the negative-space test with deliberately restrained styling (light ground, thin neutral lines, muted person-colors, no gold, no dark background). (C) comparison table with gap-highlighting — highest information density per pixel without feeling like a dashboard, provided it stays short (5–7 rows); the least emotionally engaging candidate alone, needs narrative framing above it. (D) a Relationship Landscape (terrain/skyline metaphor) — sidesteps the radar's wheel-adjacent form entirely, but is an unfamiliar chart grammar requiring the reader to learn how to read it before it communicates anything; highest implementation risk for the least-proven payoff.

**Verdict: REPOSITION + REFINE.** **Recommendation:** keep the comparison table (C) as the module's evidentiary spine, refined with the color encoding in §3.2 and a hard row cap. Reposition the radar from a standalone, mid-report visual to a density-capped (B), tightly-styled companion sitting directly beside the table — never a competing headline element. Reject the Landscape (D) as unproven relative to its cost; retained in the vocabulary appendix (§6A.11) for a future domain whose content genuinely calls for it.

## 6A.3 Relationship Flow

*05A Module 3 — "This is the loop you keep entering." Folds in "Recurring Patterns." Primary surface for most canonical signals.*

**Pre-check.** Locked law: must reframe as pattern, never assign blame to either individual. Hierarchy tier: Key pattern. Density budget: 3–5 — this module concentrates several canonical signals; it must not show all of them with equal visual weight at once.

**User question:** "Why do we keep ending up in the same place, even when neither of us means to?" **Emotional goal:** Reframing — from blame ("you always...") to shared pattern-recognition ("we do this together"). **Information priority:** Important — structurally where canonical signals (`balance_of_power`, `recovery_speed`, `reassurance_signal`, `unconscious_role_play`, `expression_speed`) most concentrate (§6A.11.3).

**Candidates considered:** (A) a cycle/loop diagram — a small closed loop with labeled nodes (trigger → A's reaction → B's reaction → outcome, looping back); visualizes the literal underlying data shape rather than inventing a metaphor on top of it; arguably the single highest-leverage "aha" visual opportunity in the report, though a literal circle needs deliberately restrained styling to clear the astrology-wheel tell, and needs a genuine mobile-specific variant (e.g. a vertical S-curve) rather than a naive shrink. (B) a sequential row list with connector arrows — already implemented for Work Colleague's loop card; zero astrology-adjacency risk and trivial mobile behavior, but loses the "it comes back around" insight that is the actual point of this module. (C) a Relationship River (a single meandering line whose width/bend marks recurring points) — visually fresh, but an unfamiliar chart grammar requiring its own legend. (D) a canonical-signal chip row — a compact row of short labeled phrases, a lightweight complement (not a replacement) for A or B; reusable, low-density, phrase-based so it trivially satisfies False Precision, but does not show the dynamic on its own.

**Verdict: REBUILD** (relative to the row-list-only baseline used elsewhere in the app). **Recommendation:** build a mobile-adapted loop diagram (A) as the module's primary visual, with the canonical-signal chip row (D) as a compact evidence strip beneath it. Reject the River (C) as unproven relative to its cost. The sequential row list (B) remains the correct fallback wherever the loop diagram's mobile variant genuinely can't be made to work at acceptable quality.

## 6A.4 Hidden Heart

*05A Module 4 — "What each person is really trying to receive." Existing asset explicitly marked "keep and elevate."*

**Pre-check.** Locked law: no reduction of either partner to a fixed trait/identity (`05N` V9, "behavior ≠ identity"). Hierarchy tier: Key pattern, bordering on Interpretation. Density budget: 2 (one per person) — intentionally narrow and deep, not broad.

**User question:** "What is each of us actually trying to receive from the other, underneath what we show on the surface?" **Emotional goal:** Tenderness. **Information priority:** Important, bordering on Critical — one of the product's most differentiated assets.

**Candidates considered:** (A) an Emotional Layers card (surface vs. underneath) — a two-tier card per person, connected typographically rather than fully separated; matches the module's actual content structure exactly, but risks reading as a bare two-paragraph stack without real typographic craft. (B) voice-quote pairing — extending the existing `DeepReadCard` voice-block pattern; reuses a proven shared component at lowest cost, but separates "surface" from "underneath" less explicitly than A. (C) a two-column arrow card (A→B / B→A), the same structure used for Why This Relationship Is Special (§6A.5) — considered only to rule out: this module is about what each person needs to *receive*, not what each person *gives*, so an A→B arrow inverts the meaning; not a live candidate.

**Verdict: KEEP the module's direction (already called "keep and elevate"); REBUILD the visual container.** **Recommendation:** use the Emotional Layers card (A) as the primary structure, with the existing `DeepReadCard` voice-quote pattern (B) supplying the "surface" line inside it. Do not reuse the arrow-card pattern (C) here.

## 6A.5 Why This Relationship Is Special

*05A Module 5.*

**Pre-check.** Locked law: must remain specific and evidenced, not generic (`05N` specificity test). Hierarchy tier: Interpretation-adjacent. Density budget: 2 + 1 (one card per person, one synthesis line).

**User question:** "Out of everyone either of us could be with, what does this specific pairing actually give each of us?" **Emotional goal:** Validation and warmth. **Information priority:** Important.

**Candidates considered:** (A) an A→B / B→A arrow-card pair + synthesis line — states the content's inherent bidirectional asymmetry directly, purely text-based, gives the module a memorable quotable close, but three stacked text blocks risk reading as visually flat without deliberate typographic variation. (B) a single merged "what you make possible together" block, no A/B split — treats the relationship, not the two individuals, as the subject, but loses the specific bidirectional detail A provides and risks reading as generic. (C) a formula-style pull-quote (a persona-nickname-combination line) as a standalone closing beat — strong share-card material, but used *alone* risks reading as a personality-quiz tagline rather than an earned synthesis.

**Verdict: KEEP the underlying concept, REFINE execution.** **Recommendation:** arrow-card pair (A) as the primary structure, closing with a short synthesis line. The formula-style pull-quote (C) may appear only as an optional, evidence-earned closing accent — never as the module's main structure, never standing alone.

## 6A.6 Conflict Translation

*05A Module 6 — required structure: What is said / What is meant / What the other hears / Better version.*

**Pre-check.** Locked law: must present both partners' intent and impact without assigning fault (`05N` V5, no unsupported contrast). Hierarchy tier: Key pattern / Evidence hybrid — likely the highest-dwell-time module in the report. Density budget: as many script pairs as genuinely evidenced, each rendered with equal weight.

**User question:** "When we fight, what did I actually mean, and what did they actually hear?" **Emotional goal:** Recognition and relief. **Information priority:** Critical for practical, everyday value — plausibly the single most concretely useful module in the report.

**Candidates considered:** (A) a four-column translation table (said/meant/heard/better) — a near-direct visualization of the module's actual data contract, maximally clear and directly actionable, but four columns is genuinely tight on mobile, forcing either horizontal scroll or illegibly narrow columns. (B) before/after script pairs — a simpler, already-proven pattern (struck-through "bad" line, "good" line beneath), zero new mobile-layout work, but drops "what the other hears," arguably the single most valuable insight in the module. (C) a progressive two-step reveal — said/meant shown first, "what the other hears" revealed on tap, "better version" revealed after that; resolves A's mobile-density problem without cutting content the way B does, at the cost of requiring active engagement rather than passive scrolling.

**Verdict: REFINE**, converging on candidate C. **Recommendation:** build the progressive two-step reveal (C) — the only candidate that preserves the full required four-part content while genuinely solving the mobile-density problem, rather than solving it by quietly cutting content (B) or leaving it unsolved (A).

## 6A.7 Do/Don't

*05A Module 7 — "Protect the relationship here."*

**Pre-check.** Locked law: guidance framing, never scolding or grading. Hierarchy tier: Evidence/actionable. Density budget: as many items as evidenced, unweighted.

**User question:** "What should we specifically protect or avoid, given who we each are?" **Emotional goal:** Agency. **Information priority:** Important, actionable tier.

**Candidates considered:** (A) the existing shared `PairPrescriptionSection` (✓/✕ two-column checklist) — already built, proven across four domains, not yet adopted by Romantic; this module's content shape is exactly what this component already does. (B) an icon-card grid (a 2-column grid of small cards, one per item, each with a neutral icon) — marginally more scannable, but requires designing a consistent icon per do/don't item across every couple's unique content for marginal benefit over an already-proven component, and compresses awkwardly on narrow phones.

**Verdict: KEEP.** **Recommendation:** adopt `PairPrescriptionSection` as-is — the one module where the correct decision is explicitly to build nothing new.

## 6A.8 Repair Guide

*05A Module 8 — "What to do after the moment goes wrong," with an explicit 5-step example sequence.*

**Pre-check.** Locked law: must remain calm and usable in an emotionally activated moment — no drama, no gamification. Hierarchy tier: Evidence/actionable, deliberately understated relative to its emotional stakes. Density budget: the 5 steps `05A` specifies, no more.

**User question:** "We just hurt each other — what do we actually do right now?" **Emotional goal:** Relief and safety. **Information priority:** Critical/actionable.

**Candidates considered:** (A) a numbered step sequence — a plain vertically-stacked, numbered list, each step with a short instruction and, where useful, a speech-tip quote; extremely low cognitive load exactly when the reader is most emotionally activated; visually plain, but that plainness is a deliberate expression of "calm authority," not a shortfall. (B) a repair loop diagram (a smaller version of §6A.3's cycle diagram) — this module's content isn't a repeating pattern, it's a linear sequence taken once; reusing the loop metaphor would be a conceptual mismatch and blur two modules that should stay distinct. Not a live candidate.

**Verdict: KEEP direction, REFINE execution.** **Recommendation:** keep the numbered-sequence format, already close to correct in spirit; refine presentation details only (spacing, whether speech-tip quotes appear inline or on tap). Do not introduce the loop diagram (B).

## 6A.9 Next Step

*05A Module 9 — "Try this in real life."*

**Pre-check.** Locked law: action must be per-person and specific, not generic advice. Hierarchy tier: Evidence/actionable. Density budget: 2–3 actions per person.

**User question:** "Okay, I understand us now — what do I actually do differently starting today?" **Emotional goal:** Agency and hope. **Information priority:** Important, actionable tier.

**Candidates considered:** (A) a per-person tabbed action list — a person-switch tab, then 2–3 numbered action items each with a description and an italicized "try saying this" speech-tip; content is inherently per-person, so a person-switch is the correct affordance. (B) a single always-visible two-column layout, both people's actions side by side, no tab — on mobile either compresses into a cramped 2-column layout or stacks into one undifferentiated list, making it harder to find "my" actions specifically.

**Verdict: KEEP.** **Recommendation:** keep the existing per-person tabbed pattern; confirm the default-tab behavior (viewing reader's own actions first, per §6.4 of this document) as an implementation detail, not a visual redesign.

## 6A.10 Relationship Horizon

*05A Module 10 — future-facing synthesis and closing sentence. Folds in "Growth Journey" and the Timeline.*

**Pre-check.** Locked law: must stay in tendency language ("may/often/tends to"), never deterministic prediction — `05A`'s explicit fortune-telling warning applies specifically to this module. Hierarchy tier: Interpretation-adjacent closing synthesis. Density budget: a small number of discrete waypoints (roughly 3–4), not a continuous forecast.

**User question:** "Where is this relationship heading, and how should we think about the road ahead?" **Emotional goal:** Hope and possibility — future-facing without predicting fate. **Information priority:** Important — the report's closing synthesis module.

**Candidates considered:** (A) a horizontal-scroll timeline with staged waypoints (now / +3y / +5y / +10y, or similar) — this module is literally organized around a time axis, so horizontal scroll is the one place in the entire report where that pattern is the *correct* answer, not a density workaround; needs real editorial discipline to avoid drifting into fortune-telling framing, since this is the module most at risk of a narrative-layer violation dragging an otherwise-correct visual format down with it. (B) a Journey Map with one continuous labeled path instead of discrete cards — no clear functional advantage over A for this content; added complexity without a corresponding clarity gain. (C) a habit-streak-style continuity marker — explicitly not recommended: a streak/consistency visual implies a trackable, continuously-logged cadence this product doesn't have; each report is a point-in-time reading, not an ongoing habit log.

**Verdict: KEEP the timeline concept and its horizontal-scroll interaction; REFINE copy discipline and card design.** **Recommendation:** build the horizontal-scroll waypoint timeline (A), with strict enforcement of tendency-register copy at every waypoint and no exact-year overconfidence framing. Do not adopt the continuous Journey Map (B) or the continuity marker (C) for this module — both retained in the vocabulary appendix (§6A.11) in case a future domain's content calls for them specifically.

## 6A.11 Cross-Cutting Rules

**11-axis comparison** — primary visualization home is Difference Map (§6A.2) only. Elsewhere, cite axes in prose — never a second competing chart.

**Deep Read** — `DeepReadCard` is KEEP (§9). Attach as optional expand-in-place where additional evidence exists (especially Hidden Heart, Relationship Flow, Difference Map). Not a top-level numbered module. Romantic should migrate bespoke inline blocks to the shared component (`08` for current status).

**Canonical Signals are not a module.** Placement rules:

| Canonical signal | Visual home |
|---|---|
| `balance_of_power` | Relationship Flow (§6A.3) — loop nodes and/or signal chip row |
| `recovery_speed` | Relationship Flow chip row; also shapes Repair Guide tone in narrative (not a separate visual) |
| `reassurance_signal` | Relationship Flow chip row; related to Hidden Heart (§6A.4) |
| `unconscious_role_play` | Relationship Flow chip row |
| `expression_speed` | Relationship Flow chip row; informs Conflict Translation (§6A.6) |
| `residual` | Evidence-only — text support inside Relationship Flow; never a standalone badge |

## 6A.12 Verdict Summary Table

| Item | Verdict | One-line rationale |
|---|---|---|
| Opening Scene | REBUILD | Move from grade-adjacent to narrative-scene-led |
| Difference Map | REPOSITION + REFINE | Table stays primary; radar demoted to a density-capped companion |
| Relationship Flow | REBUILD | Row list → loop diagram + signal chip row |
| Hidden Heart | REBUILD (container only) | Direction already correct; container becomes an Emotional Layers card |
| Why This Relationship Is Special | REFINE | Keep bidirectional arrow-card structure; discipline the formula-quote to an accent only |
| Conflict Translation | REFINE | Four-column table → progressive two-step reveal |
| Do/Don't | KEEP | Adopt the existing shared `PairPrescriptionSection` as-is |
| Repair Guide | KEEP | Numbered sequence already correct; refine presentation only |
| Next Step | KEEP | Per-person tabs already correct; confirm default-tab behavior only |
| Relationship Horizon | REFINE | Keep horizontal-scroll waypoint timeline; discipline the copy register |
| 11-axis comparison | (see Difference Map) | One visualization home only; text-only elsewhere |
| Deep Read | KEEP + migrate | Existing shared component; Romantic should adopt it, replacing bespoke blocks |
| Canonical Signals | Not a module | Mapped to the visible modules that actually surface each slice |
| Score-led grade dial (retired mockup) | REMOVE | Violates the locked "no grade, rank, or fate" decision |
| Tabbed 3-gauge dashboard (retired mockup) | REMOVE | Violates the locked "no dashboard-first design" decision |
| Comparison tables (per-domain duplication) | Consolidate | Five near-identical implementations; unify into one shared primitive (`08`, `10`) |

---

# 7. Interaction Rules

1. Progressive disclosure: Headline → Explanation → Evidence → Deep Read.  
2. Tap-to-reveal for “why”; long-press/tap for metric definitions.  
3. Horizontal scroll only for genuine sequential/time data (Horizon). Never a density workaround elsewhere.  
4. Tabs switch parallel same-shape views (e.g. per-person). Never a multi-context gauge dashboard.  
5. Sticky visuals only when they improve understanding.  
6. Pause after emotionally dense material.  
7. No aggressive scroll-jacking.

---

# 8. Responsive Behavior

1. **Mobile is the reference:** single-column vertical stack; one insight at a time.  
2. **Desktop may pair** comparison + interpretation side-by-side but must not become denser.  
3. Components that change structure by breakpoint (loop diagram; progressive dialogue) must have an explicitly designed mobile variant—not naive shrink.  
4. Information hierarchy remains identical across breakpoints.

---

# 9. Localization & Cultural Presentation

Localization is not only translation.

Visual examples and assumptions may adapt for independence, family involvement, social obligations, emotional directness, and public/private affection—without imposing one cultural ideal as “healthy.”

Distinguish visually (and in copy): difference · preference · cultural norm · coordination burden · harmful behavior.

Do not use alarm chrome to moralize cultural difference.

---

# 10. Visualization Decision Rubric

Apply every time before building a new visual:

1. Hierarchy tier (caps intensity)  
2. Density budget (3–7 default; 11 only opt-in detail)  
3. Existing library check  
4. Only then generate candidates and run:

- Radar test (bars default)  
- False-precision test  
- Accessibility test  
- Card-anatomy test  
- Content-suppression test  
- Negative-space / six-tells test  

Verdict taxonomy: KEEP · REFINE · REPOSITION · REBUILD · REMOVE.

---

# 10A. Visualization Concept Vocabulary

Named concepts referenced by §6A and future evaluations. These are **candidates**, not approvals — a concept may be used only after it passes §10 for a specific module question. No verdicts are assigned here.

### Identity / motif concepts

- **Relationship DNA** — two intertwined abstract strands; Hero-level motif only if used; avoid literal genome aesthetic.
- **Relationship Fingerprint** — unique generative couple pattern; share/identity moment only; not a comparative chart (`06` L1; §6A.1).
- **Constellation** — connected points as a pattern diagram; avoid dark star-field astrology read.
- **Orbit / Galaxy** — centrality/attention metaphor; keep abstract (no cosmic gradient / star field).
- **Relationship Threads** — recurring cross-module glyph/line callback; not a standalone chart.
- **Dual Identity (split/flip view)** — same content, two voices via toggle; only when content truly differs by speaker.

### Comparison / shape concepts

- **Relationship Landscape** — terrain/shape metaphor; prefer proven table/radar companions first (§6A.2).
- **Relationship Heatmap** — low cell-count only; qualitative non-alarm color; high density = enterprise tell.
- **Network Graph** — generally poor fit for dyadic reports; defaults to technical/enterprise read.
- **Relationship River** — meandering flow/confluence line; distinct from Horizon timeline (§6A.3, §6A.10).

### Sequence / disclosure concepts

- **Story Scrollytelling / Interactive Narrative** — scroll-cued reveal; reinforces §2A progressive disclosure.
- **Layered Cards / Progressive Reveal** — headline outer, evidence on demand; default card pattern (§4.2, §7).
- **Emotional Layers** — surface behavior vs underlying need; maps to Hidden Heart (§6A.4).
- **Journey Maps** — horizontal waypoints with states; applicable to Horizon (§6A.10).

### Calibration references (not reuse templates)

Health apps (confidence without alarm) · finance dashboards (labeled bars — avoid widget grids) · fitness tracking (one hero number, not a stat grid) · mood trackers (qualitative bands) · trait-card reports (many small evidenced traits) · data journalism (one comparison + plain takeaway before shape reading).

---

# 11. Locked Decisions (resolved former open questions)

| # | Decision |
|---|---|
| **L1** | Relationship Fingerprint may exist only as an optional end-of-report share artifact—never Hero. Prefer signature sentence + abstract motif unless product approves a true data-derived mark. |
| **L2** | Next Step per-person tabs default to the **viewing reader**. |
| **L3** | Save/Share/Revisit is an in-scope product surface (`05A` §7.2) governed by §4.10; mockup share treatment is retired. |
| **L4** | Legacy green/amber/coral score tiers are **non-compliant**. Magnitude → length + opacity; polarity → copy/axis; always labeled; no traffic-light judgment chrome. |
| **L5** | *(Revised 2026-07-27)* Romantic domain accent is the brand emerald `#3a8f6e`, confirmed correct per product-owner direction (`09` §2.3). The prior lock (a separate desaturated peach/clay `#E2C4A8`, never implemented) is retired. |
| **L6** | Density-capped radar remains an optional Difference Map evidence companion; not a primary story driver; not a default 11-axis duel. |
| **L7** | Ring-gauge identity boards are retired from Hero/opening identity roles. |
| **L8** | Shared Visual Asset Library (VA-01…VA-09) is the cross-product geometry registry; products cite VA-IDs and own interpretation. |
| **L9** | Major visuals obey Visual First → Explanation → Story → Action (Product Bible §13D.5). |

Former §11 “Open Questions” are closed. Implementation may still migrate code toward these locks; the **design authority** is resolved.

---

# 12. Future Expansion and App-Level Considerations

## 12.1 Extending the visual system (new module or domain)

Before extending to a new module or domain:

1. Does §3A / §6.3 / §4 already serve the need?
2. Hierarchy tier + density budget decided first?
3. Full rubric passed (§10)?
4. New grammar truly required, or existing VA-ID with new product meaning?
5. Has the product/technical blueprint locked the meaning this visual would express?

New components enter the **Shared Visual Asset Library (§3A)** only after the same evaluation discipline used in §6A (the Romantic Module Visual Evaluation Ledger) — that ledger is the reference methodology for any future domain's own module-evaluation pass, not a Romantic-only artifact.

Marriage / Friend / Work / Family inherit universal rules (§1–5, §7–10). Domain accents and module maps are product-owned; this document does not invent Romantic-shaped chapters for non-Romantic products.

## 12.2 Future app-shell considerations

These are design-system-level principles for how the system should flex as the *app*, not just the report body, grows — they are not commitments to build any of the following, only rules for *if* they are built:

- **App chrome unification:** the product currently runs two visual registers (the Stitch/Lovable brand baseline and a legacy dark "Space" register — see `08` for current inventory). Any future app-shell work should treat cream/Stitch as the one chrome, not maintain two registers as a permanent feature.
- **Native/mobile-app parity:** if a native shell is ever built, the mobile-first single-column reference (§8) and the token set (§3) should port directly; do not redesign tokens per platform.
- **New relationship domains:** a sixth relationship product must pass §12.1's checklist before claiming any new visual grammar; it inherits brand identity (§1.0) unconditionally.
- **Dark mode:** there is currently no user-facing dark-mode toggle (the dark register is product-bound to non-Romantic premium bodies, not an OS-theme response — see `08`). If a true user-selectable dark mode is ever built, it must satisfy the same forbidden-tells (§1.1) and confidence/severity encoding rules (§3.2) as the light register — dark mode is not a license to reintroduce dark+gold "astrology solemnity" chrome.
- **Design-tool handoff:** when this system is used to brief an external design-generation tool, brief from §1.0 (brand identity), §3 (tokens), §6A (report grammar), and `09`'s composition models — never from a superseded document (§13 lists current owners).

---

# 13. Handoff

| Owner | Responsibility |
|---|---|
| Product Bible `05` | Product philosophy, scope, shared concepts, signal *families* and insight *definitions* (meaning, not display) |
| Romantic Blueprint `05A` | Module catalog, narrative laws, premium/free jobs |
| **This document `06`** | Brand identity, tokens, IA/navigation principles, report grammar (incl. the full Romantic module ledger, §6A), chart rules, empty states, a11y, future app-shell considerations |
| `08` | Current implementation reality only — which files/routes carry which register today |
| `09` | Design intent, brand rationale, product-owner decisions, open decisions, UX exploration composition models |
| `10` | Cleanup roadmap, migration roadmap, regression protection, archive plan |
| Technical blueprints (`06A`–`06E` *Technical*) | Field contracts, projection, migration from legacy chrome |
| Implementation | Migrate theme / score appearance / report chrome to match §3 and §11 |

Acceptance for a Romantic visual surface:

- Works without a grade  
- Story before charts  
- Evidence subordinate and expandable  
- Both people retain visual dignity  
- Loop/conflict shows an interrupt path  
- Empty states omit rather than fabricate  
- Reduced-motion still comprehensible  
- Share surfaces preserve dignity  

---

# 14. Closing

The Experience Design System succeeds when visuals make the relationship clearer—not prettier, not more scored, and not more mystical.

> Expression serves understanding. Understanding serves the next human move.
