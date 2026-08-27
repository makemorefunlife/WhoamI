# Romantic Report — Interpretation Architecture Audit

Status: Audit only. No code changed. No engine redesigned. No section replaced.
Scope: `prototype/romantic-v2-visual` branch, DEV prototype (`/dev/romantic-v2-visual`) and the production Romantic experience pipeline it draws from.
Tagging convention used throughout: **[code]** = confirmed by reading source, cited `file:line`. **[doc]** = stated in a docs file, not verified against code. **[code+doc]** = doc claim cross-checked and matches code. **[inferred]** = my judgment/recommendation, not a fact claim.

---

## A. Audit of the current interpretation pipeline

**[code]** The pipeline has four layers, in order:

1. **Raw Saju calculation** — `lib/v2/saju/calculateSajuBundle.ts`, `lib/saju/analyzeRelations.ts`, `analyzeShinsal.ts`, `pairChartAnalysis.ts`, `strengthBalance.ts`, `chartContext.ts`. Computed once per chart/pair. Not meant to be read directly by report code.
2. **PersonCore (SSOT layer)** — `lib/personCore/` (comment at `index.ts:2`: *"PersonCore — 신규 SSOT 레이어 (깔고 → 연결하고 → 지운다)"*). Holds `SajuMasterJson`, `PsychMasterJson` (itself a cache — the true psych SSOT is `survey_responses.answers`, per `psychMaster.ts:34-35`), `UserMetaJson`. `extractRomanticSignals.ts` and the 6 `compare*Composite.ts` resolvers read from here.
3. **Resolvers → Canonical projections** — dozens of `resolve*` functions (naming convention, not a class hierarchy) produce `CanonicalJudgment<TValue,TMeta>` objects per the contract at `lib/relationship/contextEngine/canonicalJudgment.ts:1-31`. These get wrapped into ~20 `*Canonical.ts` files (`romanticBalanceOfPowerCanonical.ts`, `romanticComparisonTableCanonical.ts`, etc.), stored under `report.canonical_projections.*`. This is the frozen, LLM-immune, client-facing signal layer.
4. **Experience layer** — `buildRomanticExperienceViewModel.ts` runs 15 pure "projector" functions over `report`/`meta`, each reading either raw LLM prose sections (`section_1`…`section_6`) or typed `canonical_projections.*`, assembling a `RomanticExperienceViewModel`. On top of that sits a **new, uncommitted fifth sub-layer**, `buildRomanticPremiumNarrative.ts`, which reads the *already-built* view model (not raw report data) and produces 6 Q&A-style `PremiumNarrativeModule` cards.

**Key architectural finding:** the newest layer (`buildRomanticPremiumNarrative.ts` + `PremiumNarrativeCard.tsx`, both uncommitted) is not a redesign — it's additive, sitting on top of the projector layer. Its module shape (`question / answer / explanation / evidence / action`) is already structurally close to a compound-interpretation schema, built independently of this audit. **The implementation plan (G) should extend this layer, not invent a sixth one.**

---

## B. Canonical signal inventory (confirmed vs. partial vs. missing)

### 1. Foundation

| Signal | Status | Evidence |
|---|---|---|
| Five Elements distribution | **CONFIRMED** [code] | `lib/saju/elements.ts:53` `countElements()` — stem+branch count, no hidden-stem/seasonal weighting |
| Chart balance (신강/신약) | **CONFIRMED** [code] | `lib/saju/strengthBalance.ts:16` `estimateStrengthBalance()` — heuristic support-vs-drain score |
| Useful/supportive elements (용신/희신) | **PARTIAL** [code] | `strengthBalance.ts:50` `estimateYongsinGisin()` — naive weakest/strongest-element pick, `confidence: "low"`, explicitly commented "확정 금지" (never finalize). Not real 용신 method (no seasonal/조후, no 격국 method) |
| Structure (격국) | **MISSING** [code] | No file computes this anywhere in the repo |
| 조후 (climate) — bonus, not in original ask | **CONFIRMED** [code] | `lib/personCore/mappers/mapSajuMasterJson.ts:63` `buildJohuClimate()` |

### 2. Identity

| Signal | Status | Evidence |
|---|---|---|
| Day Master | **CONFIRMED** [code] | `chart.dayStemCode` (`chartContext.ts:59`) |
| Day Branch | **CONFIRMED** [code] | `chart.dayBranchCode` (`chartContext.ts:60`), described as "배우자궁" in `formatRomanticSajuInput.ts:162` |
| Ten Gods | **CONFIRMED** [code] | `calculateSajuBundle.ts:57-61`; counted via `countTenGodsForMarriage`/`profileTenGods`; activation layer (active/dormant/background) at `lib/saju/tenGodActivation.ts:18` |
| Hidden stems | **PARTIAL** [code] | `calculateSajuBundle.ts:50` — **day branch only**, not year/month/hour branches |

### 3. Cross-chart interaction

| Signal | Status | Evidence |
|---|---|---|
| Elemental interaction (chart-to-chart) | **PARTIAL** [code] | `elements.ts:43` `elementInteraction()` compares **day-stem vs day-stem only**, not full 8-pillar interaction |
| 합 (combinations), cross-chart | **PARTIAL** [code] | `pairChartAnalysis.ts:99` checks cross-chart **branch 육합 only**. Stem-combine (천간합) and 삼합/방합 exist only *intra-chart* (`analyzeRelations.ts:53,82`) — never applied A×B |
| 충/형/해/파 (clash/punishment/harm/break) | **CONFIRMED**, cross-chart, palace-weighted | `pairChartAnalysis.ts:29-35,99-135`; weights at `palaceWeight.ts:21` (일주1.0/월주0.75/시주0.45/년주0.4) |
| 원진/귀문 (bonus, not in original ask) | **CONFIRMED**, cross-chart | `workPairRiskSignals.ts:55,60`, romance-specific at `detectMarriageWonjinGuimun`, `:102` |
| Directionality (A→B vs B→A) | **CONFIRMED in select places, NOT universal** [code] | Directional: `resolveSajuFrameDirection` (`relationshipDynamics.ts:330-341`), `resolveSubLeads` (`:109-135`), `resolveReassuranceMatch` (`:258-263`, explicitly asymmetric). **NOT directional:** the core 합충형해 hit logic itself — hits are deduped by unordered `pairKey`, so a clash is "present," not "A's branch clashes into B's" |

### 4. Modifiers/auxiliary stars

**[code]** All 24 rows computed generically by `analyzeShinsal.ts:173` against `ref_shinsal.json`. Only 4 are elevated to typed `special_signals` booleans via `buildSpecialSignals` (`mapSajuMasterJson.ts:137-153`): 홍염살, 역마살, 원진, 귀문. The other 20 (including 학당귀인, 월덕귀인, 백호살, 화개살, etc.) surface only in the raw `shinsal_hits` array, never as named typed signals.

| Star | Status | Evidence |
|---|---|---|
| 천을귀인 (Heavenly Nobleman) | **CONFIRMED**, raw only | `ref_shinsal.json:4`, not in typed `special_signals` |
| 문창귀인 (Wenchang) | **CONFIRMED**, raw only | `ref_shinsal.json:24`, not in typed `special_signals` |
| 도화 (Peach Blossom) | **CONFIRMED but mislabeled/undercounted** [code] | Two distinct rows exist (홍염살 id 33, 함지살 id 34). The typed `dohwa` flag checks **only 홍염살** (`mapSajuMasterJson.ts:137-146`) — 함지살 hits are silently dropped from the typed signal, present only in the raw array |
| Naked/bare Peach Blossom | **MISSING** [code] | No sub-classification (exposed-on-stem vs hidden-in-branch) exists anywhere |
| 역마 (Traveling Horse) | **CONFIRMED**, correctly typed | `ref_shinsal.json:304` → `special_signals[].key: "yeokma"` |

**Critical finding for section E/G:** none of the 15 experience projectors, `composeRepairGuide`, or `buildRomanticPremiumNarrative` reference `shinsal_hits`, `special_signals`, or any individual star **at all**. The Saju layer computes modifiers correctly (mostly); **the report layer never reads them.** Priority-4 in your brief is fully unimplemented at the report layer today, not partially — this is a clean, bounded gap, not an entangled one.

---

## B2. The "11-axis framework," Resolver, SSOT, Persona — what's actually real

**[code]** The "11-axis" is `SECONDARY_AXIS_KEYS` (`lib/v2/survey/types.ts:14-26`): `stimulation, self_control, practicality, structure, empathy, conflict_style, resilience, recognition, energy_style, thinking_style, decision_style` — **pure self-report survey axes**, confirmed by `psychMaster.ts:4` comment "11축 psych — 0~100 확정 점수 (설문 완료 시)". A separate 6-axis "primary axis" framework also exists (`autonomy, connection, stability, growth, structure, adaptability`, `primaryAxisDefinitions.ts:10-50`).

The 6 `compare*Composite.ts` files are **not** the 11-axis system — they implement exactly 6 comparison rows (`RomanticCompareRowKey`: conflict/affection/stress/expression/decision/communication), each computed as **Saju band (anchor) + one of the 11 survey axes (correction)**, blended via `resolveCompareCompositeLean` (`compareCompositeShared.ts:25-53`) — psych can flip the read only if not "locked" by a strong Saju margin. This is the **one confirmed place in the entire codebase where psychology and Saju are deterministically merged**, not just co-present in an LLM prompt. Everywhere else (e.g. Slim V1 personal reports, `runSlimIntegratedReport.ts`), Saju and psych stay as separate text blocks merged only at the LLM-prompt level [code].

- **Resolver** [code]: real, but it's a naming pattern + type contract (`canonicalJudgment.ts`), not one central module.
- **Canonical Data / SSOT** [code]: real — split across PersonCore (raw signal SSOT) and the `*Canonical.ts` files (frozen projection layer).
- **Persona** [code]: **not found as a system.** Grep hits are LLM tone-of-voice comments and one unrelated variable name (`officeLanguage.ts:696-705`). Treat "Persona" as doc-vocabulary/unconfirmed until a doc owner can point to a concrete artifact.
- **Psychology engine** [code]: no single file; closest is `lib/v2/survey/scorer.ts` (`scoreSurveyAnswers`). Its only deterministic fusion with Saju, anywhere in the codebase, is the 6 romantic compare-composites above.

---

## C. Audit of every current report section

Render order below is the **actual live order** in `RomanticExperienceView.tsx` [code], which differs from the documented canonical order (see F). "Mode" is my classification per your taxonomy — [inferred] in all cases, since no code or doc currently assigns this label.

| # | Section | Evidence today | Current depth | Mode (proposed) | Keep/Merge/Deepen/Shorten |
|---|---|---|---|---|---|
| 1 | Essence (additive) | 1 LLM narrative (`section_2_nature`) | Independent single | Compound Expandable (should anchor to Five Elements/Day Master once those are typed inputs, not just LLM prose) | Deepen |
| 2 | Opening/Hero (M1) + Premium Overview | LLM headline/body; `event_scores.overall` (lineage not traced — flag as open question) | Independent single | Compound Expandable | Deepen (ground in typed identity signal) |
| 3 | Axis Comparison (11-axis, additive) | 1 psych object, reordered only | Independent single, psychology-only | Supporting Single | Merge — connect to Difference Map (see D) rather than stand alone |
| 4 | Difference Map (M3) | `comparison_table` (6 rows, each **already** Saju+psych blended) + 1 optional narrative | Compound data, rendered as flat rows (violates the Style Bible's "synthesize, don't enumerate" law — [doc] 05N §3 V3/V13) | **Compound Required** — already compound, badly narrated | Deepen (top vertical-slice candidate — see D) |
| 5 | Conflict Translation (M7) | LLM dialogue table + `expression_speed` canonical | Compound, but with a **confirmed display bug**: `meant`/`heard` are intentionally always null [code — `projectConflictPattern.ts:90-91`], yet the UI renders a labeled "그 말 뒤에 있던 마음" block for it regardless [code — `RomanticExperienceModules.tsx`] | Compound Required | **Fix bug first**, then deepen with direction data (see D) |
| 6 | PremiumNarrativeCard — `how_we_experience` | Reads VM's `essence` field | Compound-shaped card, single underlying signal | Supporting Single today | Deepen once schema (E) lands |
| 7 | PremiumNarrativeCard — `misunderstandings` | Reads VM's `snapshot` field | Compound-shaped card | Compound Required | Keep, deepen with schema |
| 8 | PremiumNarrativeCard — `actual_needs` | Reads VM's `hiddenHeart` field | Compound-shaped card, single underlying signal | Supporting Single today | Deepen |
| 9 | Special Dynamics (M6), gated | 3 sources: special_bond narrative, relationship_frames narrative, `saju_frame_direction` canonical | Already compound | **Compound Required — well executed** | Keep as reference pattern |
| 10 | Repair Guide (M8) | 5 canonical projections (expression_speed, recovery_speed, reassurance_signal, residual, comparison_table) | Already compound, most heavily so in the codebase | **Compound Required — best-built example** | Keep as reference pattern |
| 11 | Do/Don't (M9) | 3 canonical projections, dedup'd against M7/M8 | Already compound | Compound Required | Keep |
| 12 | PremiumNarrativeCard — `final_conclusion` | Derived from earlier VM fields | Compound-shaped card | — | Deepen once schema lands |
| 13 | Save/Share | Purely derivative (reuses Opening's signature) | N/A — pacing device, not a signal | Not applicable | Keep as-is |

**Computed but not rendered anywhere in the live prototype** [code]: Relationship Snapshot (M2, standalone), Relationship Flow (M4 — 5 canonical projections, the deepest compound projector in the codebase), Hidden Heart (M5, direct — only reachable indirectly via `actual_needs`), Action Advice, Next Step (M10, derivative, fine to skip), Horizon (M11), Reflection (M12, derivative). **Never wired into the builder at all**: Daily Life (`projectDailyLife.ts` — orphaned, and its `id: "M7"` collides with Conflict Translation's `id: "M7"` type). **Built but never rendered**: PremiumNarrative's `good_match` and `drawn_to_each_other` modules — and these two are exactly the ones with the fragile "re-parse a formatted Korean label back into data via substring/split" logic [code — `buildRomanticPremiumNarrative.ts:62-73, 100-112`], which is real technical debt regardless of the editorial question.

Also confirmed dead: `vm.flow` destructured but never used in `buildRomanticPremiumNarrative.ts:18` [code].

**Dev fixture gap** [code]: the minimal fixture has no `canonical_projections` key at all, so most compound sections can't even render in that mode. The "complete" fixture never overrides `section_5_action`/`section_6_timeline`, so Action Advice and Horizon have literally never been exercised in the dev preview, live-code or not.

---

## D. Strongest 2–3 compound interpretation vertical slices

**1. Difference Map (M3) synthesis rewrite.**
Highest leverage, lowest new-computation cost. The data (`comparison_table`) is already Saju-anchored and psych-corrected per row — it just needs to stop being rendered as 6 flat rows and start being synthesized into a compound read ("where you actually differ, and why it matters together"), per the existing Narrative Style Bible law you're already violating. No new Saju/psych computation required — pure interpretation-layer work.

**2. Relationship Snapshot fusion (balance_of_power + reassurance_signal + recovery_speed).**
The clearest textbook "Compound Required" case in the system: three independently strong cross-chart signals about *how the relationship actually runs day to day*, currently either unrendered (Snapshot section itself) or parsed back out of display strings in the two dead PremiumNarrative modules. Fixing the fragile re-parsing (read canonical fields directly, the way every projector already does) and fusing the three into one directional read ("who anchors, who adapts, and why") is Cross-chart-interaction-tier work using data that already exists.

**3. Conflict Translation + Repair Guide, direction- and modifier-aware.**
Conflict Translation already blends LLM dialogue with `expression_speed`. The confirmed-but-unwired directional resolvers (`resolveSajuFrameDirection`, `resolveReassuranceMatch`, per-category directional leads) exist in the Saju layer and are already used in Special Dynamics (M6) — but not in M7/M8, which is exactly where "who tends to escalate first / who repairs faster" direction would matter most. This slice is also the natural, bounded place to pilot Priority-4 modifier integration (e.g., a Traveling Horse or Peach Blossom hit inflecting a reassurance read) rather than inventing a standalone "auxiliary stars" section — which the UX bible already explicitly forbids (see F).

---

## E. Minimum interpretation schema

**Do not add a new layer.** `PremiumNarrativeModule` (`buildRomanticPremiumNarrative.ts`) already exists, is wired into the live UI for 4 of 6 modules, and its shape (`question / answer / explanation / evidence / action`) already covers roughly two-thirds of your target schema. Extend it:

| Your target field | Existing field it maps to | Gap |
|---|---|---|
| interpretation mode | *(none)* | **New.** Add `mode: "independent_single" \| "supporting_single" \| "compound_required" \| "compound_expandable"` — needed so engineering knows which modules are allowed to render alone vs. require fusion, and so this classification stops being tribal knowledge |
| evidence | `evidence` (flat string today) | Split into `primaryEvidence: { signal, evidenceState }` using the Narrative Style Bible's own 4-state vocabulary (Corroborated/Refined/Tentative/Single-source, [doc] 05N §5.1) rather than free text |
| supporting evidence | *(none — `evidence` is singular)* | **New.** `supportingEvidence?: { signal, evidenceState }[]` |
| modifiers | *(none)* | **New.** `modifiers?: { star, effect }[]` — the field that finally gives Priority-4 auxiliary stars a place to live, without becoming a standalone section (matches the documented ban on standalone star callouts, [doc] `02_Relationship-ux-bible.md` §5) |
| direction | *(none)* | **New.** `direction?: "A_to_B" \| "B_to_A" \| "mutual"` — surfaces the directional resolvers that already exist in the Saju layer but currently reach only M6 |
| mechanism | `explanation` | Rename/repurpose — already close |
| lived impact | `answer` | Already close — this is where the psych-axis correction should visibly do its "translate/validate lived behavior" job |
| relationship scene | *(none)* | **New, prose-only field**, not computed — matches the documented "scene before label" copy rule ([doc] 05A §9-10) |
| constructive guidance | `action` | Already close |

This mapping means Phase 1 of implementation (G) is a mechanical schema extension of existing, shipping code — not new architecture.

---

## F. Scene-by-scene editorial blueprint (current report, current order)

**[code+doc] discrepancy flagged first:** the documented canonical order (05A §6A, matched by 06A §11 and 07A Part VI §13 — [doc], all three agree) is:
`Entry/Hero → Snapshot → Difference Map → Relationship Flow → Hidden Heart → Why Special → Conflict Translation → Repair Guide → Do/Don't → Next Step → Horizon → Reflection/Save/Share`

The **live rendered order** is: `Essence → Opening/Hero+PremiumOverview → Axis Comparison → Difference Map → Conflict Translation → [3× PremiumNarrativeCard] → Special Dynamics (gated) → Repair Guide → Do/Don't → PremiumNarrativeCard(final) → Save/Share`.

Missing from live render vs. canon: Snapshot, Relationship Flow, Hidden Heart (as its own beat), Next Step, Horizon, Reflection. Present in live render but not in canon: Essence, Axis Comparison, the 3 PremiumNarrativeCard insertions mid-flow. A separate doc, `docs/dev/14_Information_Design_Principles.md` §6, describes yet a third, simpler 4-beat structure that doesn't reference or reconcile with either — [doc] genuine unresolved discrepancy, also flagged independently in `10_Design_IA_Canonicalization_Refactor_Plan.md` §3.1 as `[UNRESOLVED]`.

**[inferred] Recommendation:** don't force conformance to 05A's order inside this dev prototype yet — it's explicitly your experimentation space. But the divergence should become an explicit, logged decision (project convention: `docs/dev/decisions/`) once the compound-interpretation pattern from D is validated here, rather than staying a silent, three-way disagreement between two blueprint docs and the code.

Editorial rhythm notes on the live order, beat by beat:
- **Essence → Opening**: both are Identity/Foundation-tier single narratives; currently redundant in register (both LLM prose, no typed anchor). Candidate to merge once Essence is deepened per C.
- **Axis Comparison, dropped in cold** right after Opening with no framing connecting it to anything before or after: this is exactly the "psychology floating disconnected from Saju" problem named in your brief. It should either move next to Difference Map (same territory, different evidence source) or be removed from the standalone flow and folded into Difference Map's synthesis as corroboration language.
- **Difference Map → Conflict Translation**: reasonable adjacency (differences into their sharpest expression), but Difference Map's row-listing style undercuts the pivot — deepening D.1 should also tighten this transition.
- **3 PremiumNarrativeCards mid-flow, between Conflict Translation and Special Dynamics**: currently the only place compound-shaped interpretation exists in the live UI, but two of its siblings are dead weight elsewhere in the pipeline (`good_match`, `drawn_to_each_other`) — worth deciding whether they belong in this slot too once fixed, per D.2.
- **Special Dynamics → Repair Guide → Do/Don't**: this stretch is the best-executed part of the report already (both C.9-11) — no rhythm changes needed.
- **Final PremiumNarrativeCard → Save/Share**: clean capstone, no change needed.

---

## G. Prioritized implementation plan

**Phase 0 — Hygiene (no editorial work, do first, low risk):**
1. Fix the Conflict Translation display bug: stop rendering a "그 말 뒤에 있던 마음" block for a field (`meant`) that is guaranteed null by design.
2. Resolve the `id: "M7"` type collision between `ConflictTranslationVM` and `DailyLifeVM`.
3. Make an explicit call on `projectDailyLife.ts` (wire it in or formally retire it) — currently silently orphaned.
4. Make an explicit call on `good_match`/`drawn_to_each_other` PremiumNarrative modules (fix the label-reparsing and ship, or delete) — currently silently dead with fragile sourcing.
5. Remove the dead `vm.flow` destructure.

**Phase 1 — Schema.** Extend `PremiumNarrativeModule` per E. Mechanically migrate the 4 currently-rendered modules into the new shape without changing their content yet — this is a type-safe refactor, not a rewrite.

**Phase 2 — Vertical slice 1: Difference Map synthesis** (D.1). No new signal computation. Highest leverage, fixes a confirmed Style Bible violation.

**Phase 3 — Vertical slice 2: Relationship Snapshot fusion** (D.2). Fix the fragile label-reparsing by reading `balance_of_power`/`reassurance_signal`/`recovery_speed` canonical fields directly; fuse into one directional compound read.

**Phase 4 — Vertical slice 3: Conflict + Repair, direction- and modifier-aware** (D.3). First place to wire directional resolvers into M7/M8, and first (bounded) pilot of Priority-4 modifier integration via the new `modifiers` field — not a standalone stars section.

**Phase 5 — Connective tissue.** Add explicit corroboration/tension marking between Axis Comparison (psych) and Difference Map (Saju+psych) where they cover the same 4 dimensions, operationalizing "psychology validates lived behavior" instead of two disconnected sections.

**Phase 6 — Fixture coverage.** Extend dev fixtures so Action Advice, Horizon, and full `canonical_projections` are actually exercised in the minimal fixture — currently unverifiable in `/dev/romantic-v2-visual` as shipped.

Each phase is independently shippable and reversible inside the DEV prototype before anything is promoted to the shared production report framework, per your instruction to treat this branch as the experimentation space.

---

## Direct answers to the prototype-specific questions

- **Sections that are currently only single-signal:** Essence, Opening, Action Advice, Horizon (see C for full table) — plus Axis Comparison, which is single-signal *and* disconnected from the Saju sections around it.
- **Sections that should become compound:** Difference Map (data already is, narration isn't), Relationship Snapshot (data already is, fusion isn't), Conflict Translation/Repair Guide (partially compound, missing direction + modifiers).
- **Where auxiliary signals should enrich vs. become standalone:** enrich only — confirmed by both the code (modifiers aren't read anywhere yet) and the docs (`02_Relationship-ux-bible.md` §5 explicitly bans "You have Peach Blossom"-style standalone callouts). The new `modifiers[]` schema field (E) plus D.3 is the correct integration point.
- **Is the current order/rhythm appropriate:** it diverges from the documented canon in three different, unreconciled ways (see F) — appropriate as an active experiment, not yet as a settled answer. Recommend logging a decision once D.1–D.3 are validated.
- **Top 2–3 vertical slices for this prototype:** D.1 (Difference Map), D.2 (Snapshot fusion), D.3 (Conflict/Repair direction + modifiers) — in that priority order, matching your Foundation→Identity→Cross-chart→Modifiers priority stack.
