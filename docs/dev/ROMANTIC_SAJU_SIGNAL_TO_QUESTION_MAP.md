# Romantic Report — Saju Signal → User Question Map

Status: Research only. No code changed. Companion doc to `ROMANTIC_INTERPRETATION_ARCHITECTURE_AUDIT.md` — read that first for the section/mode/schema context this map plugs into.

Columns: **User Question** (phrased as the reader would ask it) · **Section** (natural home, current or target) · **Category** (Foundation/Identity/Interaction/Modifier/Compound, per your taxonomy) · **Psych relationship** (Strengthens = independently corroborates a psych-axis read / Explains = gives the Saju "why" behind a behavior / Modifies = conditionally hedges or inflects a read / None = no psych counterpart exists) · **Confidence** (H/M/L, reflecting how solid the underlying computation is — not how interesting the signal is) · **Status** (Connected = live in the V2 shell today · Partial = reaches only the legacy free-text LLM digest, or reaches the shell but every consumer section is currently unrendered · Unused = dead-ends before any romantic-report consumer at all).

---

## Foundation

| Signal | User question | Section | Psych relationship | Confidence | Status |
|---|---|---|---|---|---|
| Five Elements distribution | "What's my elemental makeup, and where are we jointly strong/weak as a pair?" | Essence (no typed anchor today) | Explains temperament | M | Partial — raw counts unused; only downstream-derived bands (below) reach the shell |
| Chart balance (신강/신약) | "Do I lean on my own resources, or on context/others, to feel steady?" | Difference Map — decision row | Strengthens `decision_style` axis | H | Connected |
| 용신/희신 (useful/needed element) | "What does this person structurally need more of to feel balanced?" | none (would fit Essence) | None | L — data itself flagged "확정 금지, never finalize" | Unused (legacy digest only) |
| 조후 climate — temperature | "Does this person run hot/reactive or cold/withdrawn under pressure?" | Difference Map — stress row | Strengthens `resilience`/`self_control` | H | Connected |
| 조후 climate — moisture | "Rigid or flexible under pressure?" | — | — | — | Unused (computed, never read downstream) |
| 격국 (structure) | — | — | — | — | **Missing** — no computation exists |

## Identity

| Signal | User question | Section | Psych relationship | Confidence | Status |
|---|---|---|---|---|---|
| Day Master per-stem profile (image/essence/in-love trait) | "What's my core relational archetype — steady oak, quick flame, deep well?" | Opening/Essence hero line | Explains — would ground Opening's LLM prose in a typed anchor | M | Unused in V2 shell (legacy headline system only) |
| Day Branch "rootedness" (boolean) | *(feeds)* "Does my grounding-need get met the way my partner naturally gives it?" | Do/Don't, Snapshot*, Flow*, Daily Life† | Strengthens `empathy` axis (blended in `reassurance_signal`) | M | Connected (only the boolean; semantic hidden-stem meaning below is separate) |
| Hidden stems, semantic meaning | "What secondary, less-visible trait sits underneath my main personality?" | Hidden Heart (M5) | Explains — would ground M5's LLM-only content | M | Unused |
| Ten Gods, 5 domain sums (wealth/officer/food/seal/self) | "What do I want, give, and decide around money, authority, self-expression, and care?" | Difference Map (all 6 rows), Repair Guide, Do/Don't | **Strengthens** — every `comparison_table` row is an explicit Saju+psych blend with its own labeled confidence field | H | **Connected — richest, best-wired signal in the system** |
| Ten God activation (active/dormant/background) | "Is this trait always-on for me, or only under certain conditions?" | *(would hedge any Ten-God-derived row)* | Modifies confidence of #9 above | M | Unused — cheap confidence-modifier for the system's best signal |

*Snapshot (M2) and Flow (M4) are computed but currently unrendered in the live prototype. †Daily Life is orphaned — never called by the builder.

## Interaction

| Signal | User question | Section | Psych relationship | Confidence | Status |
|---|---|---|---|---|---|
| Elemental interaction (day-stem vs. day-stem) | "Do our core temperaments fuel each other, clash, or run parallel?" | Special Dynamics (M6) | Modifies — shares its check with `unconscious_role_play`'s Saju side | H | Connected (M6 only) |
| Cross-chart 육합 (combine) | "Where do our charts naturally lock together?" | *(no home yet — Special Dynamics or a new compatibility angle)* | Would strengthen affection/communication rows | H — palace-weighted, well-built | Unused (legacy digest only) |
| Cross-chart 충 (clash) | "Where do our charts actively grate against each other?" | Conflict Translation (M7) | Would strengthen/corroborate `conflict_style` axis + `expression_speed` direction | H | **Unused** — M7 currently has zero structural Saju-clash backing |
| Cross-chart 형/해/파 (punishment/harm/break) | "Where does one of us unintentionally undercut or strain the other?" | Conflict Translation / Repair Guide | Modifies severity of conflict reads | M–H | Unused |
| 원진/귀문, intra-chart | "Is there a subconscious-irritation or eerie-tension pairing between us?" | Conflict Translation (as a modifier line, not standalone) | Modifies | M | Partial (legacy digest only) |
| 원진/귀문, cross-chart (marriage-specific detector) | same, chart-pair-specific | same | Modifies | M | Unused — zero romantic consumer; would need adapting from the marriage-domain detector |
| 공망 cross-hit | "Does my partner's blind spot land exactly where I need support?" | *(niche fit — Hidden Heart or Conflict)* | Modifies | L — niche concept, real risk of feeling arbitrary to a reader | Unused |

## Modifier (auxiliary stars — enrich existing reads, never standalone; see prior audit's documented ban on "You have Peach Blossom"-style callouts)

| Signal | User question | Section | Psych relationship | Confidence | Status |
|---|---|---|---|---|---|
| 천을귀인 (Heavenly Nobleman) | "Does this person carry a protective/lucky presence that specifically helps me?" | Special Dynamics / Repair Guide enrichment | Modifies — adds a "why this helps" layer | M | Partial (legacy digest only) |
| 문창귀인 (Wenchang) | "Does this person bring an articulate/intellectual gift to how we communicate?" | Difference Map — communication row enrichment | Modifies communication row | M | Partial (legacy digest only) |
| 도화 (Peach Blossom — 홍염+함지) | "Is there a magnetic/charismatic charge to how this person attracts or is attracted?" | Special Dynamics / Essence enrichment | Modifies affection row | **L — the typed flag itself is a known bug: it only checks 홍염살, silently drops 함지살 hits (see prior audit B.4)** | Partial — **fix the undercounting before using this one** |
| 역마 (Traveling Horse) | "Does a need for movement/restlessness show up in how this person handles routine and commitment?" | Daily Life (orphaned) / Relationship Flow | Modifies `energy_style` axis | M | Partial (typed correctly, legacy digest only) |
| Remaining ~20 auxiliary stars (학당귀인, 월덕귀인, 백호살, 화개살, 장성살, 재고귀인, etc.) | Varies per star — generally low individual narrative weight for a *pair* report (most are single-person luck/fortune stars, not relationship-shaped) | None fit without forcing | None/marginal | L | Unused — **do not prioritize individually**; revisit only if a specific editorial need surfaces |

## Compound (already-fused romantic canonical signals — the frozen `canonical_projections.*` layer)

| Signal | User question | Section | Psych relationship | Confidence | Status |
|---|---|---|---|---|---|
| `comparison_table` (6 rows: conflict/affection/stress/expression/decision/communication) | See Identity row above — one question per row | Difference Map (M3, live), Repair Guide, Do/Don't, Daily Life | **Strengthens** — explicit Saju+psych blend, only signal with a labeled confidence+align field in the data itself | H | **Connected — best-built signal in the system** |
| `balance_of_power` (leader/receiver + 3 sub-leads: idea/mood, decision, execution) | "Who tends to lead vs. adapt — and specifically whose idea/mood sets the tone, whose call is final, who follows through?" | Snapshot (M2), Flow (M4), Daily Life | Modifies (psych balance + Saju subleads, not cross-checked) | M — no explicit confidence field | **Connected in code, but every consumer is currently unrendered or orphaned** |
| `expression_speed` | "Who tends to voice feelings first in a conflict?" | Do/Don't (live), Flow, Repair Guide (live), Conflict Translation (live) | Modifies — Saju corroborates/cautions the psych direction | M–H — has an optional confidence field | Connected, live |
| `reassurance_signal` | "What reassurance does each of us need, and does the other's natural give-style match it?" | Do/Don't (live), Snapshot, Flow, Daily Life | Strengthens — empathy axis + Saju root-check blended | M — no confidence field | Connected via Do/Don't; other consumers dormant |
| `recovery_speed` | "After a fight, who bounces back fast and who needs time?" | Do/Don't (live), Snapshot, Flow, Repair Guide (live) | *Is* the psych signal (resilience+self_control) — no independent Saju counterpart | M | Connected, live |
| `residual` | "Even after we've 'moved on,' does the feeling actually linger or really clear?" | Repair Guide only (explicitly "no independent card") | Explains — grounds resilience-axis behavior in Saju structure, uncorroborated | M | Connected, narrow (single consumer) |
| `unconscious_role_play` | "Are we operating as peers, or has one of us slipped into a caretaker/mentor/dependent role?" | Relationship Flow (M4) | **Strengthens — the system's only true two-method (psych vs. Saju) agree/disagree cross-check** | H by design | **Built, zero live consumer — Flow is unrendered** |
| `saju_frame_direction` | "Who structurally plays the steadier anchor role vs. the warmer, more dependent one?" | Special Dynamics (M6, live) | Explains/modifies M6's other two sources | M–H | Connected |

---

## Highest-value connections to make first

Ranked by (signal already built + question is clear + section fit is obvious + wiring cost is low):

1. **`unconscious_role_play` → render Relationship Flow, or fold its output into an already-live section.** Fully built, cross-validated (psych and Saju independently agree/disagree — the strongest confidence signal in the whole system), and currently has *zero* live audience. Cheapest possible win.
2. **Cross-chart 충/형/해/파 → Conflict Translation (M7).** Palace-weighted, well-built, computed today — and Conflict Translation, the section that exists specifically to explain *why* you clash, currently has no structural Saju-clash signal behind it at all, only `expression_speed`. This is the biggest question/signal mismatch found.
3. **`balance_of_power` → render Snapshot/Flow, or absorb into Difference Map/Repair Guide.** Directional, three sub-axes (idea/decision/execution), fully computed — currently orphaned across the board.
4. **Ten God activation (active/dormant/background) → hedge the `comparison_table` rows.** Cheapest confidence upgrade available: it doesn't add a new question, it makes the system's richest existing signal ("what do I want/give/decide") honest about when a trait is core vs. situational.
5. **Day Master profile + Hidden-stem meaning → ground Essence/Opening and Hidden Heart in typed anchors.** Both are fully written, human-readable content sitting in the legacy headline system, unused by the V2 shell — free reuse, not new computation, directly fixes the "Compound Expandable" gap flagged for these two sections in the prior audit.
6. **Fix the `dohwa` (Peach Blossom) undercounting bug before using it anywhere.** Not a new connection — a data-correctness fix that should happen before this modifier is trusted for any enrichment use.
