# 09. Product Owner Decision Package

> **Status:** Canonical Product Owner Decision Package for design-generation briefing.
> **Owns:** Product-owner decisions, rationale for those decisions, preserve/reinterpret/do-not-invent constraints, composition-model choices, evaluation rubric, and unresolved decisions that a brief must not silently guess.
> **Does not own:** Product philosophy or journey law (`05` / `05A`–`05E` / `05N`); brand tokens, report grammar, or visual rules (`06_Visual_Design_System.md`); as-built sitemap, IA, or code inventory (`08_Current_Product_Implementation_Design_Extraction.md`); cleanup sequencing (`10`).
> **This is not a rebrand.** The next design round is a UX/IA/composition exploration on the locked Stitch/Lovable identity.
> **Tags:** `[PRODUCT-OWNER DIRECTION]` binding · `[RESOLVED]` settled · `[UNRESOLVED]` open · `[CANONICAL]` locked in a governing doc · `[IMPLEMENTED]` shipping today (see `08`)

---

# 1. Executive Summary — Decisions That Bind This Round

1. **Brand is locked.** Preserve the shipping Stitch → Lovable → repository identity. Exact tokens: `06` §1.0 / §3.2. As-built inventory: `08` Appendix A. Rationale and conflict table: §2 below.
2. **Exploration scope is UX/IA/composition only** — not palette, mark, or mood (§2.5).
3. **Design away from known rule violations**, not toward shipping chrome that already contradicts product law. Spec vs. code gap inventory: `08` (esp. §5.11, §6–§12, §13.9). Representative defects (grades, traffic-light bars, metaphor headlines, forecast language, cutoff-bomb framing) remain defects — brand preservation does **not** protect them (§3).
4. **Five products, not four.** Romantic and Partnership/Marriage (`cohabitation`) are siblings. Their inheritance-vs-separation framing is still `[UNRESOLVED]` (§6.2).
5. **Brief against locked product rules + closest-to-canonical structure**, not against every current UI chrome. Romantic reference path still needs an explicit PO pick among legacy / Experience V2 / `05A` target (§6.15).

Governing product sentence (owned by `05` §27; cited, not restated):

> "Ahaitsme does not tell two people whether they are compatible. It reveals the relationship that only exists when they are together."

---

# 2. Brand & Visual-Identity Decisions

## 2.1 Product-Owner Brand Direction `[PRODUCT-OWNER DIRECTION]` `[RESOLVED]`

> Ahaitsme already has an established first-round visual identity that began in Google Stitch and was later refined through Lovable and repository implementation. The next design exploration is **not a rebrand**.

**Preserve by default:** Ai monogram · teal-led color family · restrained gold where governed · warm elegant intelligent mood · calm light backgrounds · modern non-astrology character · strongest recognizable Stitch/Lovable elements.

This direction settles **identity**. It does **not** settle scored/graded chrome, dashboard-first ordering, metaphorical headlines, or forecast language (§3).

## 2.2 Canonical values vs as-built fact

| Layer | Owner | Use for |
|-------|-------|---------|
| Exact tokens, forbidden tells, VA library, report grammar | `06` §1.0, §1.1, §3.2, §3A, §4 | Design rule |
| Which screens/files carry Stitch vs Space today | `08` Appendix A | Current reality |
| Why preserve this identity | this section | Decision rationale |

**Rationale (decision only):** The brief’s recalled hex values (`#0E5A63`, `#C9A66B`, etc.) do not appear verbatim in the repo. The *identity* they described does — cream ground, deep-ink + emerald “teal-led” pair, restrained gold CTA accent, Ai monogram, Lora/Manrope. A prior aspirational `06` palette (Person A/B teal/clay, Romantic peach `#E2C4A8`, blanket no-gold) was never implemented and is **retired** in `06`. Shipping Stitch wins.

## 2.3 Source Conflict Table — Revised Canonical Decisions

| Rule | Revised decision | Status |
|------|------------------|--------|
| **A! / Ai mark** | Shipping `Logo.tsx` Ai monogram **is** the brand mark. Preserve. | `[RESOLVED]` |
| **Teal-led family** | Canonical pair = `#1a3328` (deep ink) + `#3a8f6e` (emerald). Do not introduce brief hex as a missing asset. | `[RESOLVED]` |
| **Romantic accent** | Preserve `#3a8f6e` on Romantic Stitch surfaces. Prior `06` anti-green / peach-lock rule superseded. Secondary tint vs shared accent: still open (§6.13). | `[RESOLVED]` (core) |
| **Gold** | Preserve as restrained, governed CTA/premium emphasis — never dark-ground “astrology solemnity.” Exact occasions still open (§6.14). | `[RESOLVED]` (principle) |
| **Grade badges / letter grades** | Documented violations to design away from. Brand direction does not protect them. | Defect (not identity) |
| **Traffic-light score colors** | Non-compliant per `06` L4; replace magnitude via length/opacity, polarity via copy. | Defect |
| **Dashboard-first opening** | Target for composition models (§4) — orientation/narrative before metrics. | Defect |
| **Metaphorical headlines** | Confirmed defect (e.g. candle/mountain day-stem headlines). | Defect |
| **Prediction / forecast language** | Confirmed defect (e.g. Partnership 3-year weather). | Defect |
| **Romantic ↔ Partnership inheritance** | Outside brand scope; still open (§6.2). | `[UNRESOLVED]` |

Full as-built citations for each defect row: `08`. Full token tables: `06`. Do not restate either here.

## 2.4 Legacy registers (decision implication)

Two unmigrated registers exist beside the baseline (`08` App A): dark Space on marketing + most non-Romantic premium bodies; legacy gold CTA on `GlowButton`. **Decision:** treat both as migration targets toward `06`, not as brand references for new exploration. Schedule: `[UNRESOLVED]` (§6.26).

## 2.5 UX Exploration Boundary `[PRODUCT-OWNER DIRECTION]`

**In scope:** UX architecture · information hierarchy · page composition · report navigation · narrative pacing · progressive disclosure · comparison presentation · graph/table/prose allocation · mobile behavior · long-report readability · cross-product consistency · product-specific differentiation · free→premium transition · loading→result transition · sharing/return flows.

**Out of scope:** Ai mark · teal-led family (including Romantic emerald) · restrained governed gold · warm elegant mood · cream/light grounds · modern non-astrology character · Lora/Manrope-class type voice.

A briefed exploration should read as **the same Ahaitsme, composed differently**.

---

# 3. Preserve / Reinterpret / Do Not Invent

Philosophy, journey, and evidence contracts live in `05` / `05A`–`05E` / `05N`. Expression rules live in `06`. Current code facts live in `08`. This section states only the **design-exploration constraints** that follow from those owners.

## 3.1 Preserve

- Product philosophy and shared experience constitution — cite `05` (recognition before advice; difference ≠ defect; relationship-as-subject; confidence honesty; severity ≠ confidence).
- Five-domain family and distinct primary questions — do not merge Romantic and Partnership; do not treat Friend/Work/Family as noun-swapped Romantic (`05` §19.5).
- Data meaning: deterministic/LLM ownership; Psych vs Saju separation; severity ladder; evidence tiers (`05` §13D; decision records).
- Narrative arc logic (recognition → mechanism → evidence → strength/risk → practical translation) even if chapter names are reinterpreted.
- **Full established brand identity** per §2.
- Safety / dignity / jargon-sanitization patterns already proven in Family and Partnership (`08`).
- Accessibility and localization locks in `06` §3.5 / §9.
- Sound first-round patterns: shared `DeepReadCard` shell ordering; `PairPrescriptionSection`; VA-01…VA-09 as geometry registry concept (`06` §3A).

## 3.2 Reinterpret

- Page composition, navigation chrome, card dependence (monolithic views are not architectural law — `08` §18).
- Visual hierarchy and visualization density (current over-use of numeric bars/grade-like badges vs governing docs).
- Section transitions, progressive disclosure mechanics, editorial↔interactive balance, motion, whitespace — `06` locks tokens/meaning, not composition.
- Mobile patterns beyond the locked single-column-first rule (`06` §8).

## 3.3 Do Not Invent

- Unsupported metrics/scores where no deterministic construct exists (several computed-but-hidden fields exist — see `08` / §6.6; they are not approved user-facing metrics).
- Fake AI chat, fake social, unsupported live two-party collaboration, unsupported prediction (deterministic future timelines remain banned even where they currently ship).
- Clinical claims or personalization beyond Saju + 11-axis evidence.
- Backend capabilities absent today: N-person Family household (dyadic only); instant perspective toggle outside Family Track A/B regenerate; completed Friend/Work *target* engines that are unstarted (`08`).

## 3.4 Engine / entitlement checklist (from `08` audit — intent framing only)

**Must preserve (meaning):** five kinds + semantics; server-owned classifications; evidence/confidence meaning; Psych vs Saju separation; viewer-first display for symmetric pairs; parent/child fixed order for Family; client-strip rules; LLM explain-only boundary; Deep Read explain-only; free/premium entitlement split; en-US/ko-KR parity; birth-chart rules; narrative freezes 027–031; fail-closed rendering.

**May reinterpret (expression):** layout density; nav style if order preserved or explicitly re-approved; card anatomy; type scale within bilingual needs; color application toward `06` tokens; motion within reduced-motion rules; digest-vs-deep pacing with product approval; chart geometry within VA-IDs; hub presentation; Stitch↔Space unification as expression only.

**Must not invent:** `evidence_tier` field; 11-axis as Saju rows; per-product free module slices beyond basic 4-axis; guest analysis; Romantic Deep Read in Experience V2 VM; Collaboration Map / Environment Matrix UI without server sections; Family Translation Gap; Partnership Mental Load / Life Direction sections; Friendship Horizon timeline; real-time collab / incomplete invite; ranked friend leaderboard / compatibility-% headline; client-side CE recompute; production use of Work narrative-pilot variants.

Factual basis for every bullet: `08` §5–§14 and Appendix A. Do not treat this checklist as an as-built inventory.

---

# 4. Composition Models (same identity, three UX structures)

All three models share the identity in `06` §1.0 / §3.2. They differ only in architecture, hierarchy, composition, navigation, pacing, and graph/table/prose allocation (§2.5). None is a palette or brand option.

Work’s table-heavy content is the sharpest stress-test against “HR dashboard” / enterprise-analytics tells (`05C` / `06` §1.1).

### Model A — Editorial Report Flow

Long-form feature reading: fewer larger units; one well-chosen visual per chapter; mostly linear scroll; recognition-first opening; radar opt-in only. Lowest structural risk to existing ViewModel contracts. Risk: feels slow without strong writing.

### Model B — Relationship Exploration Flow

Persistent lightweight overview; modules as places; more of VA-01…VA-09 usable if density caps and “type not rank” hold. Highest structural impact (no in-report map shell today — `08`). Highest risk of analytics/quiz tells if node count creeps.

### Model C — Guided Discovery Flow

Step-by-step, one idea per screen-height; heavy progressive disclosure; mobile-native reference. Recognition must still precede action. Risk: quiz-like thinness; never use a score-like number as a step reward.

**Domain application notes** (detail owned by blueprints + `08`): Romantic ten-module arc as chapters/nodes/steps; Family Track A/B as editions or opening step; Work/Friend practical scripts and compare tables as exhibits — never dashboards. Closing-synthesis gap is cross-domain (`08`, §6.4).

---

# 5. Evaluation Rubric (100 points)

For comparing design-tool outputs briefed from this package. Automatic rejection gates scoring entirely.

### Automatic rejection (any one)

- Letter grade, star rating, or single compatibility % as headline/hero.
- Destiny/fate language, or a claimed specific future event.
- Dark ground + metallic gold “astrology solemnity,” zodiac iconography, or decorative wheel layouts. (Restrained gold CTA on cream/light ground is allowed — §2.3.)
- Villain/problem framing of either person, or asymmetric alarm styling on one side of a comparison.
- Friction/conflict loop with no visible interrupt/repair point.
- Fabricated metric, badge, or card with no evidence construct.
- All five domains as noun-swapped reskins of one module set.

### Weighted criteria

| Criterion | Pts | Full marks |
|----------|-----|------------|
| Product fidelity | 12 | Distinguishes five domains; does not merge Romantic and Partnership |
| Information architecture | 10 | Result → Evidence → Meaning → Action; real progressive disclosure |
| Understanding / recognition | 10 | Opens with recognizable scene, not score panel |
| Narrative flow | 8 | Fact → Pattern → Meaning → Lived impact → Reflection/Action |
| Emotional recognition | 8 | Matches `05` journey intent; avoids genre bans (`05N`) |
| Data visualization discipline | 10 | Correct form per `06` grammar; no false precision; radar capped |
| Brand fidelity | 8 | Uses `06` §1.0/§3.2 identity correctly — same Ahaitsme, not a new palette |
| Category differentiation | 8 | Not mistakable for horoscope / compatibility calc / quiz / dating app |
| Trust / evidence transparency | 6 | Confidence and severity visually distinguishable |
| Safety and dignity | 6 | Symmetric dignity; no fault-assignment chrome |
| Mobile readability | 6 | Single-column reference; no silent truncation; ≥44px targets |
| Accessibility | 4 | Contrast; non-color-only distinctions; text equivalents |
| Cross-product scalability | 4 | Same system extends to ≥3 domains without identical module counts |

---

# 6. Unresolved Decisions

Items marked **RESOLVED** stay for the record. Implementation detail for each open item: cite `08` / domain `05*` / `06` as noted — do not expand into second inventories here.

1. ~~Brand-mark / teal-led / Romantic accent core / gold principle~~ — **RESOLVED**, §2.
2. **Romantic ↔ Partnership boundary** — `05E` “inherits emotional truth” vs `05` + decision `023` “infrastructure only.” Shipped “로맨틱 핏” chip is evidence of separation leak, not settled continuity. `[UNRESOLVED]`
3. **Two Narrative Style Bibles** — `docs/product/05N_…` vs `docs/dev/05_NARRATIVE_STYLE_BIBLE.md`. This package treats product-tree `05N` as primary for briefing until reconciled. `[UNRESOLVED]`
4. **Missing closing-synthesis chapter** — absent or under-built in all five domains (`08`). Highest-leverage consistent content gap. `[UNRESOLVED]`
5. **Friend / Work target architectures substantially unstarted** relative to their blueprints — brief from what ships (`08`), treat blueprint territories as future room. `[UNRESOLVED]` (scope for brief)
6. **Computed-but-hidden fields** — surface vs leave as future content (Family `reward_index`, Partnership killer-questions, Friend align/confidence badges, etc.). `[UNRESOLVED]`
7. ~~Former `06D_Module_Evaluation.md` misread as Family~~ — **RESOLVED** for authority: content lives in `06` §6A; file archived as `docs/product/archive/ARCHIVE_Romantic_Module_Visual_Evaluation.md`. Do not cite as Family.
8. **Family SSOT shape** — one blueprint with two perspectives vs two perspective blueprints. `[UNRESOLVED]`
9. **Legacy renderers as design constraint?** — Package recommendation: do not constrain new composition (`08` §18 dual paths). Not a settled PO lock. `[UNRESOLVED]`
10. **Grade-field population rate** — wiring live; live letter vs placeholder “—” not fully confirmed statically. `[UNRESOLVED]` (telemetry)
11. **Deep Read UI rollout status** — treat as mid-flight until committed; do not claim “shipped” per domain without checking `08` / git. `[UNRESOLVED]` (status)
12. **`TriScoreSnapshotKind` Romantic topic-enum leak** platform-wide. `[UNRESOLVED]` (tech/product cleanup)
13. **Domain accent tint vs identical shared accent** — minor; needs one answer for consistent application. `[UNRESOLVED]`
14. **Exact governed occasions for restrained gold.** `[UNRESOLVED]`
15. **Romantic design-reference path** — legacy monolith vs Experience V2 module set vs `05A` target registry. `[UNRESOLVED]`
16. **Register unification** — single Stitch/cream for all premium bodies vs keep Space dark for non-Romantic. Brand direction suggests former; not confirmed as UX decision. `[UNRESOLVED]`
17. **Grade-removal timing** — omit immediately in exploration vs wait for formal spec amendment. `[UNRESOLVED]`
18. **Free-tier / invite completion / paywall** in or out of this round. `[UNRESOLVED]`
19. **Partnership customer-facing naming** — UI “동거·결혼” vs docs “Partnership.” `[UNRESOLVED]`
20. **Family whole-household roadmap** — current schema dyadic only. `[UNRESOLVED]`
21. **Work narrative pilot** — inform copy direction or entirely out of scope (must never be quoted as shipped). `[UNRESOLVED]`
22. **Cohabitation 3-year weather forecast** — reframe as non-deterministic risk pattern vs remove. `[UNRESOLVED]`
23. **Friend cutoff-bomb / breakup_guide card** — rewrite to `05B` law vs retire. `[UNRESOLVED]`
24. **Work v1 module scope** — full `05C` 15-module target vs reduced P0 set. `[UNRESOLVED]`
25. **Family legacy-card survival** — `destiny` / `filial_reward` / `child_dna` keep, rename, or retire. `[UNRESOLVED]`
26. **Marketing-page migration schedule** (`/about`, `/pricing`, `/faq`, `/contact`) Space → Stitch. `[UNRESOLVED]`
27. **Romantic legacy peach `#ffd6a5` on dark register** — remove immediately vs phase during migration (core emerald lock is settled). `[UNRESOLVED]` (sequencing only)

---

# 7. Inputs Needed Before a Final Design Brief

1. ~~Brand baseline~~ — **RESOLVED** (`06` values; §2 rationale).
2. Romantic ↔ Partnership boundary (§6.2).
3. Which Romantic implementation is the design target (§6.15).
4. Whether draft Work docs `06C` / `07C` are stable brief inputs.
5. Closing-synthesis gap: design a new module now vs defer (§6.4).
6. At least one full real report sample per domain (both languages if possible) — skeleton/fallback strings in docs are not enough for prose-quality briefing.
7. Whether `05N` ↔ `docs/dev/05_NARRATIVE_STYLE_BIBLE.md` reconciliation affects voice guidance for this UX/IA round (likely “no,” needs explicit confirm).
8. Domain accent differentiation vs one shared accent (§6.13).
9. Exact governed gold occasions (§6.14).
10. Explicit answers or deferrals for §6.15–§6.21 (register, grades, free/invite/paywall, Partnership naming, Family roadmap, Work pilot).

---

# 8. Domain Decision Pointers (not second inventories)

Use these only as **decision hooks**. Full product locks: domain `05*`. Full shipping reality: `08` §§6–12. Expression: `06` §6A (Romantic ledger).

| Domain | Binding decision hooks for this round |
|--------|----------------------------------------|
| **Romantic** | Brief against `05A` laws (esp. Law 5 no grades, Law 12 no decorative day-stem metaphor). Prefer Experience V2 *structure* as closer-to-canonical than legacy Hero chrome — pending §6.15. Module visual verdicts: `06` §6A. |
| **Partnership / Marriage** | Treat as fifth product. Do not silently fold into Romantic. Inheritance vs separation = §6.2. Shipped intimacy/forecast/parenting-gate gaps are defects or open product calls (`08` §9 / §6.22), not patterns to extend. |
| **Family** | Dyadic only — do not invent whole-household viz. Track A/B is regenerate-edition, not live toggle. Grade badge is a documented defect. Softened role labels are a reusable dignity pattern (`08` §10). |
| **Friend** | Brief from shipping Social DNA, not unstarted Gift/Role/… engines. Cutoff-bomb card contradicts `05B` — §6.23. |
| **Work** | Draft blueprints ≠ frozen law except decisions `021`/`022`/`030`. Strong practical-guidance layer is a keep. “Your Work Manual” closing and most canonical judgments are unbuilt (`08` §12). |

Representative Korean copy examples, per-module catalogs, and file:line inventories are **not** duplicated here — pull from `05*` / `05N` / `08` as needed for a brief appendix.

---

# 9. Authority Quick Map

```text
01 / 02 / 05 / 05A–E / 05N  →  product meaning, journey, voice
06 (Experience Design System) →  brand tokens, IA expression, VA grammar, Romantic visual ledger
08                          →  what ships today
09 (this file)              →  PO decisions, exploration constraints, models, rubric, open calls
10                          →  cleanup / migration plan only
```

Conflict rule: PO direction in this file overrides older conflicting *document* claims on identity (§2). Product meaning conflicts between two canonical docs stay in §6 until decided. Code vs doc gaps are recorded in `08`; they do not rewrite `05`/`06` law by themselves.
