# Romantic Premium — Phase 1 (Engine Completion) Audit

Status: Audit only. No code changed.
Scope note: "Phase 1 (Engine Completion)" is not an existing documented phase name anywhere in `docs/` or in code comments (checked `docs/dev/`, `docs/product/`, `docs/dev/decisions/`, and the `Phase 6-2dN` markers already in `romanticSajuDeep/index.ts`, which number something else entirely). This audit treats it as: *is the deterministic Saju + psychology signal engine fully wired into the rendered Premium V2 report, end to end?* — the same question this conversation has been working through. IA/UX/visual design are out of scope per your instruction; every item below is classified purely on data-flow (does a typed value reach a render path), not on layout or ordering.

---

## Verdict

# Phase 1 NOT COMPLETE

The deterministic pipeline (Saju layer → PersonCore → resolvers → canonical projections → ViewModel → rendered section) has real gaps in all three non-"Connected" categories: several fully-built ViewModel sections are never rendered, most auxiliary-star and structural Saju computations never leave the legacy free-text layer, and a few genuinely required computations (격국 chief among them) don't exist anywhere in the codebase.

---

## 1. Connected

Reaches the rendered Premium V2 report through the deterministic/typed pipeline (not merely as LLM free prose).

| Signal / section | Path |
|---|---|
| Chart balance (신강/신약) | → decision band → `comparison_table.decision` → Difference Map / Repair / Do-Don't |
| 조후 temperature (hot/cold) | → stress band → `comparison_table.stress` → Difference Map / Repair / Do-Don't |
| Ten Gods (wealth/officer/food/seal/self) | → all 6 `comparison_table` rows → Difference Map (live), Repair Guide, Do/Don't |
| Day Branch rootedness (boolean) | → `reassurance_signal.need_*` → Do/Don't (live) |
| Elemental interaction (day-stem vs day-stem) | → `saju_frame_direction` → Special Dynamics (M6, live) |
| Cross-chart 충/형/파/해 (day-branch) | → `cross_chart_tension` → Conflict Translation evidence + confidence |
| `resolveReassuranceMatch`, `resolveSubLeads` (directional) | → `reassurance_signal`, `balance_of_power` sub-leads → Do/Don't, Flow |
| 11-axis survey scores | → Axis Comparison section (live) |
| 6 compare-composites (Saju+psych blend) | → `comparison_table` rows (only signal with a labeled confidence field in the data itself) |
| `recovery_speed` (psych) | → Do/Don't, Repair Guide, Flow (now live) |
| `expression_speed` (psych + Saju-corroborated) | → Conflict Translation, Do/Don't, Repair Guide, Flow |
| `unconscious_role_play` (psych vs Saju cross-check) | → Flow (now live) |
| `balance_of_power` (psych + Saju sub-leads) | → Flow (now live, fallback path) |
| `residual` (Saju-only) | → Repair Guide (sole consumer) |
| `comparison_table` (all 6 rows) | → Difference Map (primary owner), Repair Guide, Do/Don't |
| Essence, Opening/Hero, Special Dynamics, Repair Guide, Do/Don't, Conflict Translation | → their respective live sections |
| `how_we_experience`, `misunderstandings`, `actual_needs`, `final_conclusion` (PremiumNarrative) | → rendered cards |
| Save/Share (derivative of Opening) | → rendered |

---

## 2. Exists but NOT connected

Computed somewhere in the pipeline; no render path reaches it, or it reaches only the legacy free-text LLM digest (`romanticSajuPromptDigest.ts`) rather than the typed canonical/projector layer the V2 shell reads.

| Item | Where it stops |
|---|---|
| Snapshot (M2) | Computed (`balance_of_power`/`reassurance`/`recovery`); no direct card. Reaches the reader only indirectly, as Flow's lead paragraph and inside the `misunderstandings` narrative card. |
| Premium Overview's own signal-list rendering (`RomanticPremiumOverviewSection`) | Built, never imported; Hero renders only the numeric gauge subset inline instead. |
| Hidden Heart (M5) direct section | `RomanticHiddenHeartSection` built, never imported. Content reaches the reader only via the `actual_needs` narrative card. |
| Action Advice | `RomanticActionAdviceSection` built, never imported. Source data (`section_5_action`) has never even been exercised by a DEV fixture. |
| Horizon (M11) | `RomanticHorizonSection` built, never imported. Never exercised by a DEV fixture either. |
| Reflection (M12) | `RomanticReflectionSection` built, never imported. (Confirmed this pass — outside the batch connected earlier.) |
| Daily Life projector | Computed (`projectDailyLife.ts`), never called by the builder. Its own VM type comment marks this as an intentional, permanent suppression for Romantic (belongs to Marriage/Cohabitation) — borderline with category 4. |
| `good_match` / `drawn_to_each_other` (PremiumNarrative) | Built, typed sourcing now correct, deliberately not rendered (duplicated-ownership decision made this session). |
| `axis_notes.intimacy` / `axis_notes.conflict` | Computed on `RomanticContextInput`; no projector reads either field anywhere. |
| Ten God activation (active/dormant/background) | Computed in the Saju layer; never reaches `extractRomanticSignals`, any canonical file, or any projector. |
| Hidden stems, semantic meaning (`meaning_ko`) | Computed, dead-ends in PersonCore. Only the boolean "rooted" derivative reaches `reassurance_signal`. |
| Day Master per-stem profile (image/essence/in-love trait) | Fully written; reaches only the legacy headline system, not the V2 shell. |
| Cross-chart 육합 (combine/harmony) | Computed with the same palace weighting as the tension types just wired; the harmony hits themselves reach nothing in V2. |
| 원진/귀문 — intra-chart, and the marriage-specific cross-chart detector | Computed; reaches only the legacy free-text digest. |
| Five Elements raw distribution / combined-couple element notes | Computed; reaches only the legacy digest. V2 sees derived bands (strength/climate) only, never the raw distribution. |
| 조후 moisture band | Computed; unused anywhere (only `temperature_band` survives downstream). |
| 용신/희신 (useful/needed element) | Computed (explicitly low-confidence, "확정 금지" — never finalize); reaches only the legacy digest. |
| All ~24 auxiliary stars (신살), incl. 천을귀인/문창귀인/역마/도화 | Reach only `romanticSajuPromptDigest.ts` — i.e. uncontrolled LLM prose, never the typed canonical/projector layer. This session's fix corrected the *accuracy* of the `dohwa` flag; it did not connect that flag, or any star, to a projector. |
| 공망 cross-hit | The detection function exists and works generically (used by other domains); nothing in the romantic pipeline calls it. |

---

## 3. Missing

Genuinely does not exist anywhere in the codebase, in any form.

| Item | Note |
|---|---|
| 격국 (structure/pattern classification) | No computation exists at all, in any file. This is one of your originally-specified Foundation-tier requirements. |
| Full 4-pillar hidden stems (지장간) | Only the day-branch hidden stems are computed; year/month/hour branch hidden stems are never extracted. |
| Cross-chart 천간합 (stem combine) and 삼합/방합 (trio/directional combine) between the two charts | These combine types exist only *intra-chart* (one person's own pillars); no A×B cross-chart version exists for anything beyond the 육합 branch check. |
| Full 8-pillar-to-8-pillar elemental interaction | Only day-stem-vs-day-stem is computed; no broader cross-chart elemental read exists. |
| Naked/bare Peach Blossom (노출도화) sub-classification | No distinct calculation exists anywhere. |

---

## 4. Dead / obsolete

| Item | Note |
|---|---|
| `ConflictTranslationRow` (component in `RomanticExperienceModules.tsx`) | Fully coded, toggle-based said/meant/better renderer with correct null-guards; never called. `RomanticConflictSection` duplicates this logic inline instead (the copy that was patched this session). Two parallel implementations, only one wired. |
| `section_2_nature.comparison_table` (array-shaped field in dev fixtures) | No projector reads this shape; superseded by `canonical_projections.comparison_table` (keyed object). Vestigial fixture schema. |
| `vm.flow` destructure in `buildRomanticPremiumNarrative.ts` | Still declared, still unused (pre-existing; untouched by this session's fix to the same file). |
| Legacy `estimateStrengthBalance` (`romanticSajuDerivations.ts`) | A second, separate implementation of chart-balance duplicating the one in `strengthBalance.ts` that the V2 typed bands actually use — reused across marriage/friend/work/romanticRules/romanticSnapshot, but not by the V2 pipeline. |

---

## Priority-ordered remaining work

Ranked by leverage (already-computed + already-designed sections first, cheapest; genuinely-missing Saju computation last, most expensive). Connection-only framing, no IA/ordering/visual judgment:

1. **Wire `axis_notes.intimacy`/`axis_notes.conflict` into a consumer.** Computed, typed, zero new logic needed — currently reaches nothing.
2. **Correct or retire the `dohwa`-only auxiliary-star pattern for the other ~23 stars.** All 24 are computed identically; only 4 get a typed `special_signals` flag, and none reach a projector. Decide which stars (if any) get a typed flag before any of them can be used as modifier evidence.
3. **Connect Ten God activation (active/dormant/background) as a confidence modifier** on the `comparison_table` rows that already consume raw Ten God counts — cheapest possible upgrade to the system's richest existing signal.
4. **Connect cross-chart 육합 (combine)** the same way 충/형/파/해 was connected this session — same function, same palace weighting, opposite valence (currently unused half of `analyzeCrossChartRelations`'s output).
5. **Connect 원진/귀문 (both intra-chart and cross-chart) to the typed layer** — currently legacy-digest-only.
6. **Decide the fate of Snapshot, Hidden Heart (direct), Action Advice, Horizon, and Reflection** — five fully-built ViewModel sections with zero or only-indirect render paths. This is a connection decision (wire vs. formally retire each), not a layout decision.
7. **Extract full 4-pillar hidden stems (지장간)** — currently day-branch only.
8. **Add cross-chart 천간합/삼합/방합** — currently intra-chart only, no A×B version exists.
9. **Build 격국 (structure) computation.** Does not exist in any form; the largest genuine gap against your original Foundation-tier requirement.
10. **Hygiene:** retire the dead `ConflictTranslationRow` component, the vestigial fixture `comparison_table` array field, and the unused `vm.flow` destructure; resolve `estimateStrengthBalance` duplication.
