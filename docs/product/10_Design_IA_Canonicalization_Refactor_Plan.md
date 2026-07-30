# 10. Design & IA Canonicalization / Cleanup Plan

**Status:** Planning and provenance audit for code/runtime cleanup; **the documentation-level cleanup this plan itself proposed (Phase 0–1) has now been executed** (2026-07-27) — see the update below. Everything else in this plan (visual-system, IA, copy, and code-path cleanup; the phased sequencing; regression protections) remains planning only — no application code has been touched.
**Date:** 2026-07-27 (created); revised 2026-07-27 (documentation-phase execution recorded)
**Scope discipline (per the canonicalization refactor):** this document keeps only the **cleanup roadmap, migration roadmap, regression protection, and archive plan**. Product philosophy lives in `05`; brand/visual/IA/navigation rules live in `06`; current-implementation fact lives in `08`; design intent, rationale, and open decisions live in `09`. Where this plan previously carried its own copy of an open-decisions list, that list has moved to `09` §6 (see §10.3 below).
**Inputs:** `08_Current_Product_Implementation_Design_Extraction.md` (incl. Appendix A), `09_Product_and_Design_Intent_Package.md`, `docs/product/README.md`, governing `05*`/`06*`/`07*` docs, live code under `app/`, `components/`, `lib/relationship/`
**Constraint:** Do not modify application code, delete files, refactor, commit, or push based on this document alone.

## 0.0 Documentation-phase execution record (added 2026-07-27)

This plan's own §1 (Documentation cleanup inventory) proposed a set of documentation moves. Those have now been carried out directly on the `docs/product/` tree, per an explicit instruction to improve the existing documents rather than create new ones:

| Proposed action (original §1) | Outcome |
|---|---|
| Rewrite README authority map to list `05N`, `08`–`10` | Done — see updated `README.md` |
| Archive `06A_Visual_Foundations.md` | Done — moved to `docs/product/archive/ARCHIVE_Visual_Foundations.md`; unique content merged into `06` |
| Archive `06D_Module_Evaluation.md` (naming-collision fix) | Done — moved to `docs/product/archive/ARCHIVE_Romantic_Module_Visual_Evaluation.md`; full ledger in `06` §6A |
| Archive `11_relationship_product_visual_blueprint_integrated.md` | Done — file reduced to a superseded-pointer stub; content already fully present in `05` |
| Fix `09`'s stale "`08` missing" passages | Done in an earlier revision of `09`, and further de-duplicated against `08`/`06` in this pass |
| Reconcile `05` visual-language sections against `06` | Done — `05` §14–§18 (visual language, pattern map, module/component blueprint, canonical signal presentation, progressive disclosure/motion/interaction-safety) consolidated into `06`, with `05` retaining only product-meaning content and short pointers |
| Expand `06` from "Visual Design System" to the full "Experience Design System" scope | Done — brand identity, IA/navigation principles, the full Romantic module ledger, the visualization vocabulary appendix, and future app-shell considerations added |
| Trim `08` to current-implementation-only | Done — `08`'s former "Must Preserve / May Reinterpret / Must Not Invent" and "Open Questions" sections, plus Appendix A's prescriptive preserve/may-change framing, moved to `09` |
| Single narrative SSOT (`05N` ↔ `docs/dev/05_NARRATIVE_STYLE_BIBLE.md`) | **Done** (2026-07-27) — merged into `05N` v2.0; `docs/dev/05_NARRATIVE_STYLE_BIBLE.md` reduced to a superseded pointer; all citing docs (`01`, `05B`, `05D`, `06B`, `07A`) updated |
| Rename `02` to match the README's filename, or vice versa | **Not done** — a small, low-risk fix still pending; noted again in §1.2 below |

Everything below this point (§1 onward) is the **original planning content**, retained for its still-relevant code/runtime cleanup roadmap, updated in place only where a documentation-level item it referenced has now changed status.

---

## 0. Purpose

Ahaitsme has iterated across product, IA, copy, and visual systems. Outdated directions were often left as traces rather than fully retired. Those remnants:

- cause AI agents (and humans) to pick **different sources of truth**
- make second-round UX/UI work inherit **already-forbidden** chrome (grades, traffic-light scores, bomb metaphors, dark Space marketing)
- blur **brand identity** (Stitch cream/emerald/rose) with legacy Space and prototype styling

This plan identifies what must later be **preserved, promoted, merged, migrated, renamed, archived, deleted, rewritten, or protected by tests** — without performing that cleanup yet.

**Brand posture (binding for sequencing):** Preserve the shipping Stitch/Lovable identity (Appendix A of `08`). Do not treat Space dark, teal/gold task-brief hexes, or retired mockups as the brand target. Visual exploration may change composition; cleanup must not accidentally rebrand.

---

## 1. Documentation cleanup inventory

### 1.1 Authority map (canonical set — documentation phase largely executed; see §0.0)

| Layer | Canonical file(s) | Notes |
|-------|-------------------|-------|
| Map | `docs/product/README.md` | **Done** — lists `05N`, `08`, `09`, `10` |
| Vision | `01_Product_Vision.md` | Keep |
| UX law | `02_Relationship-ux-bible.md` | Filename ≠ README’s `02_Relationship_UX_Bible.md` — rename still pending |
| Market | `03_Market_Research.md` | Supporting only |
| Shared product | `05_Relationship_Product_Bible.md` | Keep |
| Domain product | `05A`–`05E` | Keep; flag draft maturity on Work/Partnership |
| Narrative | `05N_Ahaitsme_Narrative_Style_Bible.md` (v2.0) | **Done** — single SSOT; `docs/dev/05_NARRATIVE_STYLE_BIBLE.md` archived as pointer (`09` §6.3) |
| Visual expression | `06_Visual_Design_System.md` (Experience Design System) | **Done for brand tokens** — aligned to shipping Stitch emerald; remaining drift = grades / traffic-lights / dual registers (`08`) |
| Domain technical | `06A`–`06E` *Technical* | Keep; supporting `06A`/`06D` collisions resolved via stubs |
| Checklists | `07A`–`07E` | Tracking only, not product authority |
| As-built extraction | `08_Current_Product_Implementation_Design_Extraction.md` | Canonical *implementation reality* reference |
| PO decisions | `09_Product_and_Design_Intent_Package.md` | Decision package (not a second product bible) |
| This plan | `10_Design_IA_Canonicalization_Refactor_Plan.md` | Cleanup / migration plan only |

### 1.2 Inventory table

| File | Current role | Conflict | Proposed action | Replacement/authority | Risk |
|------|--------------|----------|-----------------|----------------------|------|
| `docs/product/README.md` | Authority map | Omits/under-specifies `05N`, `08`–`10`; cites `02_Relationship_UX_Bible.md` while disk file is `02_Relationship-ux-bible.md` | **Rewrite** map section; **rename** or symlink naming | Itself after update | Low if careful |
| `01_Product_Vision.md` | Canonical vision | None — **fixed** | **Done** — cross-ref now points to `05N` | Remains canonical | Low |
| `02_Relationship-ux-bible.md` | Canonical UX | Misnamed vs README; may still cite old narrative path | **Rename** to stable name OR update README; fix narrative refs | Remains canonical | Medium (many inbound links) |
| `03_Market_Research.md` | Supporting | None | **Preserve** as supporting | README limitation clause | None |
| `05_Relationship_Product_Bible.md` | Shared product SSOT | Overlaps heavily with `11_*_integrated.md` | **Preserve**; ensure README marks `11` superseded | Canonical | Low |
| `05A`–`05E` Product Blueprints | Domain product SSOT | Target IA ≠ shipped IA (`08`); Partnership vs Romantic inheritance tension (`09` §6.2) | **Preserve**; **owner decision** on Partnership framing; mark “target vs as-built” | Product owner + `08` for as-built | High if treated as shipped UI |
| `05N_Ahaitsme_Narrative_Style_Bible.md` | Narrative SSOT (product tree), v2.0 | None — **resolved** | **Done** — merged register dials, address law, severity/evidence ceilings, and lexicon from the dev-tree doc | Sole narrative SSOT | Low (resolved) |
| `docs/dev/05_NARRATIVE_STYLE_BIBLE.md` | Superseded pointer (was: technical "Invariant Core") | None — content fully absorbed into `05N` | **Done** — reduced to a superseded pointer with a section-by-section mapping table | `05N` | Low (resolved) |
| `06_Visual_Design_System.md` | Expression SSOT | Brand tokens **reconciled** to shipping Stitch emerald (`06` L5); still forbids grades/traffic-lights that remain in code | **Preserve** as expression SSOT; link `08` for remaining code drift | `06` + `08` | Medium (code migration) |
| `06A_Romantic_Technical_Blueprint.md` | Romantic technical SSOT | Former foundations collision — **mitigated** (foundations archived) | Keep technical as `06A` | Technical remains `06A` Romantic | Low |
| `docs/product/archive/ARCHIVE_Visual_Foundations.md` | Archived visual trail (ex-`06A_Visual_Foundations`) | — | **Done** — archived; use `06` | `06` | None |
| `06B`–`06E` Technical | Domain technical | Some draft; Work `07C` draft | **Preserve**; label draft in README | Domain product + tech pair | Low |
| `06D_Family_Technical_Blueprint.md` | Family technical | Former collision with Module Evaluation — **mitigated** (eval archived under Romantic-clear name) | Keep Family technical as `06D` | Family technical stays `06D` | Low |
| `docs/product/archive/ARCHIVE_Romantic_Module_Visual_Evaluation.md` | Archived Romantic KEEP/REFINE trail (ex-`06D_Module_Evaluation`) | Former `06D` prefix misread as Family | **Done** — archived with Romantic-clear name; use `06` §6A | `06` §6A + `05A` | None |
| `07A`–`07E` | Implementation checklists | Agents treat as product law | **Preserve** as checklists only; README already limits — reinforce | Not product SSOT | Low |
| `07C_Work_Implementation_Checklist.md` | Draft checklist | Explicitly draft vs others “canonical” | Label **Draft** in header/README | `05C`/`06C` | Low |
| `08_…_Extraction.md` | As-built extraction | Newer than some claims in `09` first draft | **Promote** as canonical *reality* doc | Complements `05*` targets | Low |
| `09_…_Intent_Package.md` | PO decision package | Was oversized briefing + history | **Done for polish pass** — decisions/constraints/models/rubric/open calls; cites `05`/`06`/`08` | Briefing + decisions | Low if agents load old cached copy |
| `11_relationship_product_visual_blueprint_integrated.md` | Superseded integrated draft | Near-duplicate of early `05` | **Done** — superseded stub | `05` + `06` | Low |
| `docs/product/platform/*` | Reverse-engineering audits | Not SSOT; some stale (Deep Read etc.) | **Archive** as historical after date stamp; README already “not decisions” | `08` + prep + code | Medium if treated as current |
| `docs/product/prep/*` | Pre-05/06/07 inventories | As-built at freeze time; aging | **Archive** after confirming superseded by `08` | `08` | Low |
| `lib/relationship/romanticproject/*` | Pre-lock mockup + KO plan | Explicitly rejected as design reference (`06` §6A / L3) | **Archive** out of `lib/` after design freeze (code path unused by app) | `05A`/`06` | Low runtime; high agent confusion |
| `docs/dev/decisions/004`–`031` (relationship) | Frozen engineering decisions | Must not be “cleaned” away | **Preserve**; index from README | Decision records | High if deleted |
| `docs/dev/01_IA_AND_USER_JOURNEY.md`, `DEVELOPER_HANDBOOK_*` | Stitch-era process docs | May drift from `08` | **Merge** useful bits into `08`/README or mark supporting | `08` | Low |
| Duplicate Narrative Bibles | Two SSOT candidates | **Resolved** (2026-07-27) | **Done** — merged into `05N` v2.0; dev-tree doc archived as pointer | Single path under `docs/product/` | Low (resolved) |

### 1.3 Documentation actions summary

| Action | Candidates |
|--------|------------|
| Preserve | `01`, `02`, `03`, `05`, `05A`–`05E`, `06`, `06A`–`06E` technical, `07*`, decisions, `08` |
| Promote to canonical | `08` (as-built), `05N` v2.0 (single narrative bible, merge complete), updated README map |
| Merge | ~~Two narrative bibles~~ **done**; useful handbook IA notes into `08`/README |
| Rename / misfile fix | `02` filename; Partnership naming in indexes (`06A`/`06D` supporting collisions resolved via archive) |
| Archive | `11_*`, `platform/*` (after stamp), `prep/*` (after stamp), romanticproject, visual foundations/module eval |
| Delete after confirmation | Only empty stubs / confirmed unused docs — **none recommended for immediate delete** |
| Rewrite | README authority; `09` stale “08 missing”; cross-refs from `01`/`05B`/`06B`/`07A` to narrative path |

---

## 2. Visual-system cleanup inventory

### 2.1 Competing systems (locations)

| System | Identity | Primary locations | Classification |
|--------|----------|-------------------|---------------|
| **Stitch cream/emerald/rose** | Shipping brand baseline | `app/stitch-theme.css`, `app/globals.css` `@theme` Stitch block, `StitchAppChrome`, `StitchSurveyShell`, landing/hub/detail shells | **Canonical** (brand) |
| **Space dark** | Pre-Stitch dark/glass | `globals.css` `:root` `--bg-1`…, `components/space/*`, `/about` `/pricing` `/faq` `/contact`, non-Romantic `ReportSurface="dark"` | **Legacy** / Needs migration |
| **Teal/gold (task-brief hex)** | `#0E5A63` / `#C9A66B` “A!” — not found as shipping tokens (`09` §2) | Absent as CSS SSOT | **Dead** as implementation; do not invent |
| **Legacy Romantic styling** | Dark-register peach `#ffd6a5` + grade/gauges (Stitch emerald already correct on tabs) | `reportLayout/theme.ts`, `RomanticSajuDeepReportView.tsx`, `ShareSummaryCard`, chemistry gauges | **Needs migration** — peach sequencing open (`09` §6.27); grades open (`09` §6.17) |
| **Glow components** | Dark gold CTA | `components/space/GlowButton.tsx` — used in premium CTA, manual form, RelationshipCard, pricing, EssenceDeepEntry | **Needs migration** → stitch CTAs |
| **Traffic-light score colors** | Green/amber/coral tiers | `lib/relationship/scoreBarAppearance.ts` → `TriScoreSnapshotPanel`, score boards | **Legacy** (forbidden by `06`) |
| **Grade badges** | A–D opening | All `OpeningBlock.grade` in ViewModels + Romantic opening | **Needs product-owner decision** then remove/hide |
| **Hard-coded colors** | Hex in components | High density in `theme.ts` (~27), `PsychMatchRadarChart`, `RelationshipCard`, `SurveyAnalyzingJourney`, Space comps, Conflict* tokens | **Needs migration** into tokens |
| **Product surface overrides** | `stitch` vs `dark` | `RelationshipPremiumSection.tsx` (`romantic`→stitch, else dark) | **Needs migration** toward one chrome |
| **Deprecated mock styling** | Dark-ink + gold dials | `lib/relationship/romanticproject/relationship_report_mockup.html` | **Experimental / dead** for product |

### 2.2 Pattern classification (selected)

| Token / pattern | Files (representative) | Usage note | Class |
|-----------------|------------------------|------------|-------|
| `.stitch-cta-primary/secondary` | `stitch-theme.css`, hub, landing, account | Brand CTAs | Canonical |
| `.stitch-hero-panel`, `.stitch-headline` | Many Stitch surfaces | Brand containers/type | Canonical |
| `--color-secondary #3a8f6e` | `globals.css` | Brand emerald | Canonical |
| `--btn-accent #d6b46a` | `globals.css` `:root` | Gold on dark buttons | Legacy |
| `GlowButton` | ≥8 consumer files (relationship + marketing + v2) | Mixed into Stitch flows | Needs migration |
| `SpaceBackground` | `about`, `pricing`, `faq`, `contact`, essence, onboarding/birth | Marketing + leftover routes | Needs migration / Legacy |
| `ReportSurface dark` | Premium non-Romantic | Inside Stitch page | Needs migration |
| `getStitchTabTheme(romantic) → #3a8f6e` | `theme.ts` | **Aligned** with `06` L5 (emerald). Remaining debt: dark-theme peach `#ffd6a5` | Sequencing (`09` §6.27) |
| `RELATIONSHIP_TAB_THEME` hex accents | `theme.ts` | Product accents | Needs migration into tokens |
| `resolveScoreBarAppearance` tiers | `scoreBarAppearance.ts` | Traffic-light | Legacy → replace |
| `OpeningBlock.grade` | All four ViewModels + Romantic | Grade chrome | Owner decision |
| Unused `Header.tsx` / `SideMenu.tsx` | `components/layout/` | No route imports found | Dead (verify then delete) |

### 2.3 Visual cleanup posture

- **Canonical to preserve:** Stitch tokens, logo, cream paper, emerald/rose, Lora headlines, soft large radius, stitch CTA pair (`08` Appendix A.5).
- **Migrate:** Space marketing pages → Stitch; GlowButton → stitch CTAs; dark premium bodies → stitch tone; hard-coded hex → CSS variables.
- **Do not promote:** Space dark as “premium = dark”; mockup gold dials; traffic-light score encoding; task-brief teal/gold as new brand.

---

## 3. IA and report-structure cleanup

Legend: **Target** = domain `05*` blueprint · **Rendered** = ViewModel / monolith order from `08` · **Decision** = product owner required before treating target as final.

### 3.1 Romantic

| Aspect | Detail |
|--------|--------|
| Target IA | `05A` 10 modules (+ Deep Read, share surfaces) |
| Rendered IA | Default: `RomanticSajuDeepReportView` (`section_1_*`…`section_6_*`, ScoreBoard, grades) |
| Future path | Flagged `RomanticExperienceView` M1–M10 stub — **not** finished UI |
| Legacy sections | Monolith parts; grade; chemistry gauges; ShareSummaryCard grade |
| Missing target | Full M1–M10 presentation; doc free tier slice |
| Duplicate / drift | Legacy parts vs Experience module IDs vs `05A` names |
| Obsolete-tied components | ScoreBoard-as-hero, grade badge, traffic-light bars |
| Migration dependency | Flag completion + projectors + stitch module shells; **before** deleting monolith |
| Owner decisions | Is Experience V2 the sole target UI? Hide grades before or with V2 ship? Dark-register peach phase-out timing? (`09` §6.15 / §6.17 / §6.27) |

### 3.2 Partnership / Cohabitation

| Aspect | Detail |
|--------|--------|
| Target IA | `05E` 8 chapters + operational cards; naming “Partnership” |
| Rendered IA | `buildMarriageReportViewModel`: origin_story → household_snapshot → compare → psych → money → deep_read → bedroom → home_dna → parenting → family_boundary → **weather_forecast** → privacy → upset → warning → prescription |
| Code naming | kind `cohabitation`, folder `marriage/`, meta `married_saju_deep` |
| Legacy | Weather 3-year forecast; household grade; “해독제” framing |
| Missing target | Mental load, reliability chapter, life direction, remember-this-person |
| Owner decisions | Confirm `05E` as final vs engine-first as-built; calendar forecast keep/reframe/remove; product display name |

### 3.3 Family

| Aspect | Detail |
|--------|--------|
| Target IA | `05D` 11 modules (Hero, Translation Gap, Loop, …) |
| Rendered IA | 16 sections: snapshot → relationship_index → compare → household_roles → psych → child_dna → talent → growth_tunnel → family_role → filial_frequency → deep_read → destiny → filial_reward → sos → de_escalation → prescription |
| Legacy | destiny / filial_reward / child_dna naming; grade; “운명적” titles |
| Missing | Dedicated Hero, Translation Gap, Loop modules |
| Owner decisions | Which legacy cards merge/retire (`07D`); free tier undefined |

### 3.4 Friend

| Aspect | Detail |
|--------|--------|
| Target IA | `05B` 9 modules |
| Rendered IA | snapshot → compare → psych → social_dna → soulmate → play_money → hidden_flow → deep_read → breakup_guide → de_escalation → prescription |
| Legacy / conflict | **breakup_guide** titled “손절 폭탄 해체” — violates `05B` anti-cutoff framing |
| Missing | Friendship Horizon; gift-direction narrative as modules |
| Owner decisions | Retire/rename breakup_guide; map social_dna→blueprint modules |

### 3.5 Work

| Aspect | Detail |
|--------|--------|
| Target IA | `05C` 15 modules (3 layers) — **draft maturity** |
| Rendered IA | 9 sections: snapshot → compare → psych → comparison → role_matrix → relationship_loop → deep_read → warning → prescription |
| Missing | Collaboration Map, Environment Fit, Work Manual, personal-layer-first order |
| Experimental | `tests/scripts/work-narrative-pilot/` — not production |
| Owner decisions | Is 15-module `05C` final before UI migration, or freeze a reduced P0 set? |

### 3.6 Cross-product IA notes

- Documented IA is **target**, not automatically final when `05*` drafts conflict with each other or with `08` as-built — **flag owner decisions** before deleting rendered sections.
- Shared spine to keep: TriScore panel *data*, psych radar *data*, compare table *data*, Deep Read *explain-only*, prescriptions — **presentation** may change.
- Shared chrome that **falsely forces same IA:** `RelationshipReportLayout` scoreboard-first + identical PartHeading stacks across products.

---

## 4. Copy and interpretation cleanup

Governing rules (examples): `05` / `05A`–`05E` (no grade/rank/fate; no cutoff framing; no false precision); `05N` / `docs/dev/05_NARRATIVE_STYLE_BIBLE` (tendency not verdict; ban fortune-telling); `06` (no traffic-light moral encoding).

| Pattern | Example | File | Runtime path | Governing rule violated | Proposed action |
|---------|---------|------|--------------|-------------------------|-----------------|
| Letter / compatibility grade | `OpeningBlock.grade` A–D; “궁합 등급” | `build*ReportViewModel.ts`, Romantic opening, i18n | All premium openings | `05A`/`05D`/`05` no grade | **Rewrite** UI + stop surfacing; keep internal score if needed |
| Household grade | Same opening pattern on cohabitation | `buildMarriageReportViewModel.ts` | Cohabitation premium | Partnership / `05` no grade | Same |
| Traffic-light judgment | “좋은 편 / 보통 / 낮은 편” + green/amber/coral | `scoreBarAppearance.ts` | TriScore bars | `06` §3.2 | **Rewrite** appearance → length/opacity + labels |
| Prediction / forecast | “향후 3년 홈 리스크 기상도” | `ko-KR.ts` `weatherCardTitle`; `weather_forecast` section | Cohabitation SectionRenderer | No deterministic future timeline | **Owner decision**: reframe as risk pattern vs delete |
| Fatalistic / destiny | “우리의 운명적 스코어” | `ko-KR.ts` `destinyCardTitle` | Family destiny section | Fate vocabulary bans | **Rewrite** title/copy |
| Bomb / defusal | “손절 폭탄 해체 가이드” | `ko-KR.ts` `breakupGuideCardTitle` | Friend breakup_guide | `05B` anti-cutoff | **Rewrite** or retire section |
| Defusal / antidote metaphor | “싸움 해독제”, “부부싸움 해독제” | `ko-KR.ts` warning/deEscalation titles | Friend/Work/Marriage | Clinical/combat metaphor drift | **Rewrite** to care/repair language |
| Clinical / diagnostic | Therapist-register risk in LLM overlays | prompt + postValidate files | Deep Read paths | Narrative V1/V2 | Keep postValidate; expand regression |
| Unsupported precision | Exact 0–100 as hero | ScoreBoard / snapshot | Premium | False precision (`05`) | Banded labels in UI |
| Outdated section names | social_dna, soulmate, filial_reward | Section types + i18n | Friend/Family | Blueprint module names | **Rename** display strings first; types later |
| KO/EN voice drift | Hardcoded KO titles in Work VM `SECTION_TITLES` vs message catalogs elsewhere | `buildWorkReportViewModel.ts` | Work | Locale parity | **Migrate** Work titles fully into i18n |
| Metaphor headlines | Day-stem “촛불/산” style risks | Romantic headline path (`09` finding) | Romantic hero | `05A` forbidden metaphor example | Audit + **rewrite** generators |

---

## 5. Code-path and component cleanup

| Item | Location | Class | Proposed action |
|------|----------|-------|-----------------|
| `RomanticSajuDeepReportView` monolith | `components/relationship/RomanticSajuDeepReportView.tsx` | Legacy monolith | **Migrate consumers** to Experience (when ready), then delete |
| `RomanticExperienceView` stub | `romantic/experience/*` | Feature-flagged experiment | **Keep**; complete or do not default |
| Dual Romantic path | `RelationshipPremiumSection` + flag | Mixed | Owner decision on default |
| 4× `SectionRenderer.tsx` | friend/work/marriage/family | Duplicate renderers | **Refactor** shared primitives after design lock |
| Legacy JSX fallback in `*ReportView.tsx` | Friend/Work/Marriage/Family | Duplicate card systems | Migrate fully to VM view; then delete fallback |
| `officeCards.tsx` legacy | Work | Obsolete wrappers | Migrate consumers, then delete |
| `RelationshipPremiumCards` | Thin wrapper over basic | Keep / low priority | Keep until unused |
| `RomanticSnapshotPanel` | Alias of TriScore | Keep | Keep or inline |
| `GlowButton` | `components/space/GlowButton.tsx` | Mixed shell | Migrate consumers → stitch CTA; then delete or quarantine |
| `SpaceBackground` + Stars/Glass | `components/space/*` | Legacy | Migrate marketing; delete when unused |
| `Header.tsx` / `SideMenu.tsx` | `components/layout/` | Dead views (no imports) | Delete after verification |
| `BirthInputForm` (non-Stitch) | onboarding legacy | Mixed | Prefer Stitch forms; delete after route migration |
| `/onboarding/birth` Space route | `app/onboarding/birth` | Old route | Redirect to survey-v2 complete flow; then delete |
| `POST /api/relationship/generate` | Legacy integrated text | Old route | Verify Slim-only use; deprecate relationship hub usage (already unused by hub) |
| Invite incomplete | `/invite`, `invite/complete` unwired | Stub / partial | Product-owner decision; do not delete API until wired or replaced |
| `/dev/*` pages | work-report-viewmodel, etc. | Experimental | Keep in experimental area |
| Work narrative pilot | `tests/scripts/work-narrative-pilot/` | Experimental | Keep; never import from `app/` |
| `romanticproject` mockup under `lib/` | HTML + md | Experimental | Move to archive; out of `lib/` |
| `RelationshipReportLayout` scoreboard-first | Shared | Forces same IA | Refactor after design: shared primitives ≠ shared module order |
| Client strip helpers | `strip*ContextOutputForClient.ts` | Keep | **Protect** with tests; never “clean” away |

**Classification key:** Keep · Refactor · Migrate consumers, then delete · Delete after verification · Product-owner decision

---

## 6. Canonical target architecture (proposal only)

```text
docs/product/README.md          ← one authority map
        │
        ├── 01 Vision
        ├── 02 UX Bible
        ├── 05 Shared Product Bible
        ├── 05A–E Domain Product
        ├── 05N Narrative (single)
        ├── 06 Visual Design System (expression intent)
        ├── 06A–E Technical
        ├── 07A–E Checklists (non-authority)
        ├── 08 As-built extraction (reality)
        ├── 09 Design intent package (brief)
        └── 10 Cleanup plan (this file)

app chrome (one)
  StitchAppChrome + Stitch tokens only
  Marketing/legal/account/relationship shells share cream register

report layer
  shared primitives: ReportCard, CompareTable, Radar, DeepRead, Prescription, Evidence chrome
  product compositions: Romantic | Partnership | Family | Friend | Work
  (shared ≠ same section order)

narrative/copy governance
  one bible + i18n catalogs + postValidate hooks + CI forbidden-pattern tests

experimental/
  flags, /dev routes, tests/scripts pilots, archived mockups

archive/
  superseded docs, retired HTML mockups, stamped platform/prep
```

### Shared vs product-specific

| May share | Must stay product-specific |
|-----------|----------------------------|
| App chrome, tokens, CTA, logo | Module order and human questions |
| Card shell, table/radar geometry (VA-IDs) | Axis labels, thresholds, warnings, actions |
| Deep Read card chrome | Domain CE judgments and row vocabularies |
| Strip/client-safe rules pattern | Parent/child vs viewer-first semantics |
| Forbidden-pattern test harness | Domain free/premium content maps (once defined) |

---

## 7. Safe sequencing

### Phase 0 — Freeze and provenance
- **Status:** **Done** for documentation pointers (README / `08` / `09` / `10`).
- **Goal:** Stop new ambiguity; point agents at `08`/`09`/`10`/`README`.
- **Files:** `docs/product/README.md` (map only), optionally banner on superseded docs.
- **Deps:** None.
- **Tests:** None.
- **Rollback:** Revert doc commits.
- **DoD:** README lists authority order + “as-built = `08`” + “cleanup plan = `10`”.
- **Vs design approval:** **Before** design generation preferred; does not block exploration if `08`/`09` already briefed.

### Phase 1 — Documentation authority
- **Status:** **Done** for map / stubs / `06` expansion / `09` decision polish / brand-token reconcile / narrative dual-SSOT merge (2026-07-27). **Still open:** `02` filename alias.
- **Goal:** ~~One narrative SSOT~~ done; fix numbering/misfiles; archive trails.
- **Files:** Narrative bibles (merged), `06A`/`06D` supporting renames, `11`, platform/prep archive moves, `09` stale fixes, cross-refs in `01`/`05B`/`05D`/`06B`/`07A` (updated).
- **Deps:** Partnership naming (narrative merge no longer a dependency).
- **Tests:** Link checker / doc path grep in CI (optional).
- **Rollback:** Restore paths via git.
- **DoD:** Single narrative path; README without ambiguous duplicates.
- **Vs design:** **Before** implementation; **can** run during visual exploration.

### Phase 2 — Design tokens and app chrome
- **Goal:** One Stitch token source; migrate Space marketing; replace GlowButton in product flows.
- **Files:** `globals.css`, `stitch-theme.css`, `about`/`pricing`/`faq`/`contact`, `GlowButton` consumers, `ReportSurface` default.
- **Deps:** Brand confirm (Appendix A); optional design approval for marketing pages.
- **Tests:** Visual smoke on landing/hub/detail; no dark body regression on romantic stitch path.
- **Rollback:** Feature flag or CSS dual-register temporary.
- **DoD:** Product journey + marketing share cream chrome; GlowButton gone from relationship.
- **Vs design:** Chrome migration **can** follow UX direction for report bodies; marketing→Stitch is **no-regret** earlier.

### Phase 3 — Copy and forbidden-pattern cleanup
- **Goal:** Remove/rewrite grades-in-UI, bomb/defusal titles, destiny/forecast wording per owner decisions.
- **Files:** `lib/i18n/messages/*`, opening renderers, `scoreBarAppearance.ts`, section titles, Romantic headline generators.
- **Deps:** Owner decisions (§9 of this doc).
- **Tests:** Forbidden string CI (§8).
- **Rollback:** Locale file revert.
- **DoD:** No user-visible forbidden patterns on critical paths; tests green.
- **Vs design:** **Before** implementation of new report UI; **partially before** design if exploration must not show grades.

### Phase 4 — Shared report primitives
- **Goal:** Extract one CompareTable/Radar/DeepRead/Prescription/PartHeading; stop IA coupling via ScoreBoard-first layout.
- **Files:** `reportLayout/*`, 4× SectionRenderer, `DeepReadCard`, `PairPrescriptionSection`.
- **Deps:** Phase 2 tokens; design direction for card anatomy helpful but not mandatory for extraction.
- **Tests:** Snapshot/VM section render tests per product.
- **Rollback:** Keep old renderers until parity.
- **DoD:** Shared primitives; products still product-specific compositions.
- **Vs design:** Prefer **after** UX direction for card anatomy; structural dedupe can start earlier carefully.

### Phase 5 — Romantic migration
- **Goal:** Ship Experience composition (or approved interim) without grade/dashboard-first; retire monolith.
- **Files:** `romantic/experience/*`, `RomanticSajuDeepReportView`, flag, projectors.
- **Deps:** Phases 1–4; `05A` confirmation; design comps for M1–M10.
- **Tests:** Flag matrix; module available/omit; no grade in DOM when policy says so.
- **Rollback:** `ROMANTIC_EXPERIENCE_LEGACY=1`.
- **DoD:** Default path = approved Romantic UI; monolith unused.
- **Vs design:** **After** UX design approval.

### Phase 6 — Family migration
- **Goal:** Align section set to approved `05D` (or owner-reduced P0); rewrite destiny/filial copy; stitch surface.
- **Files:** `familyParent/viewModel/*`, SectionRenderer, i18n, role panel.
- **Deps:** Owner module keep/retire list; Phase 4 primitives.
- **Tests:** Parent/child fixtures; no viewer-swap regressions.
- **Rollback:** VM builder order feature flag or cached payloads.
- **DoD:** Rendered IA matches approved Family map; dark surface gone.
- **Vs design:** After Family UX comps.

### Phase 7 — Remaining products (Friend, Work, Partnership)
- **Goal:** Same as Family: target IA (or P0), stitch surface, rename/retire legacy cards (breakup bomb, weather, etc.).
- **Files:** friend/work/marriage viewModels, renderers, i18n, work pilot isolation.
- **Deps:** Per-product owner decisions; Work 15 vs P0.
- **Tests:** Per-kind VM order; compare/psych separation; strip tests.
- **Rollback:** Per-kind flags.
- **DoD:** All five kinds on one chrome; IA approved.
- **Vs design:** After respective comps; can parallelize after Romantic/Family patterns proven.

### Phase 8 — Dead-code and archive deletion
- **Goal:** Remove unused Header/SideMenu, Space comps if unused, romanticproject from `lib/`, dead routes, legacy fallbacks.
- **Files:** listed in §5 as delete-after-verification.
- **Deps:** Phases 2–7 complete; import graph clean.
- **Tests:** Build + route smoke; grep for deleted symbols = 0.
- **Rollback:** git revert.
- **DoD:** No dead imports; archive folder documented.
- **Vs design:** After implementation stabilization — **does not block** exploration.

### Phase 9 — Regression protection
- **Goal:** Codify §8 checks in CI.
- **Files:** `tests/unit/*`, optional eslint restrictions, i18n grep scripts.
- **Deps:** Phases 3–7 policies frozen.
- **Tests:** The protections themselves.
- **Rollback:** Disable individual rules with issue links.
- **DoD:** CI fails on reintroduction of grades/bombs/dark premium default/forbidden imports.
- **Vs design:** Start scaffolding in Phase 0–3; harden after policies lock.

---

## 8. Regression protections (recommended)

| Check | Suggested mechanism | Prevents |
|-------|---------------------|----------|
| Forbidden grade language | Grep/CI on `messages/*.ts` + DOM tests for `grade` badge | Letter grades returning |
| Forbidden prediction wording | Lexicon list: 운명, 예보, 손절 폭탄, 해독제 (tune with owner) | Fate/forecast/bomb copy |
| Unauthorized visual tokens | Ban new raw hex in `components/relationship/**` except token file; fail on `#d6b46a` in product CTAs | Token drift |
| Dark-surface reintroduction | Assert `ReportSurfaceProvider` surface === `stitch` for all kinds (once migrated) | Space premium relapse |
| Deprecated component imports | ESLint `no-restricted-imports`: `GlowButton`, `SpaceBackground`, `Header`, `RomanticSajuDeepReportView` (after cutover) | Legacy chrome |
| IA section order | Snapshot tests on `build*ReportViewModel` builder arrays | Silent reorder |
| Locale leakage | Fail if Work (and others) hardcode KO-only section titles | en-US drift |
| Client-safe projection | Existing strip tests; extend assert no `context_output` / `romantic_context_input` keys in API fixtures | CE leak |
| Accessibility | axe on hub + one premium report; contrast on stitch tokens | A11y regressions |
| Feature flag default | Test `shouldRenderRomanticExperienceV2` default false until explicitly flipped; fail if default true without changelog | Accidental V2 default |

---

## 9. Design-work boundary

### Must clean before design generation
- Point tools at **`08` + Appendix A + `09` + this `10`** (not `11`, not romanticproject mockup, not Space marketing as brand).
- ~~Resolve narrative bible dual-SSOT~~ — **done**; `05N` v2.0 is the sole narrative SSOT.
- State explicitly: **preserve Stitch identity**; exploration = composition/IA/pacing.

### Can clean after UX direction selection
- Shared primitive extraction shapes (card anatomy).
- Per-product module visual comps → then Phases 5–7.
- Dark→stitch premium body migration timed with comps.

### Must clean before implementation
- Owner decisions on grades, weather forecast, breakup_guide, Partnership naming, Work P0 module set, Romantic default path.
- Forbidden copy rewrite plan with i18n keys.
- Token single-source for Romantic core accent — **DONE** (`06` L5 = Stitch emerald). Remaining: dark-register peach phase-out sequencing (`09` §6.27).

### Should not block visual exploration
- Deleting dead `Header`/`SideMenu`.
- Archiving `platform`/`prep`/`11`.
- Completing invite/complete wiring.
- Work narrative pilot.
- Paywall UI.
- Full SectionRenderer dedupe.

---

## 10. Deliverable conclusion

### 10.1 Top 10 highest-risk remnants

1. ~~Dual Narrative Style Bibles~~ (`05N` vs `docs/dev/05_…`) — **resolved 2026-07-27**, merged into `05N` v2.0  
2. **Grade badges** still shipping on all premium openings — contradicts every domain bible  
3. **Traffic-light `scoreBarAppearance`** — contradicts Visual SSOT  
4. **Friend “손절 폭탄 해체”** — contradicts Friend product law  
5. **Cohabitation 3-year weather forecast** — prediction chrome  
6. **Dual visual registers** (Stitch shell + dark premium / Space marketing) — brand ambiguity  
7. **Romantic monolith default vs V2 stub** — unclear “future UI”  
8. **`06A` / `06D` supporting collisions** — mitigated by superseded stubs; still discoverable filenames (low risk if stubs are respected)  
9. **`11_*_integrated` + platform/prep** still discoverable as if current  
10. **`romanticproject` mockup under `lib/`** — retired art in engine tree  

### 10.2 Immediate no-regret cleanup items (docs/process only until approved)

- ~~Update `docs/product/README.md` authority map~~ — **Done**.  
- ~~Stamp/archive guidance on `11`, foundations, module eval~~ — **Done** (superseded stubs).  
- ~~Fix `09` leftover “08 missing” / decision-package polish~~ — **Done**.  
- ~~Narrative dual-SSOT owner resolution~~ — **done** (`09` §6.3). Still open: `02` filename alias.  
- Inventory-only: list GlowButton/SpaceBackground import sites (this plan §2–§5).  
- Add CI **documentation path** allowlist for agent prompts (optional).

### 10.3 Decisions required from the product owner (moved to `09`)

*(Moved: open product/design decisions live in `09_Product_and_Design_Intent_Package.md` §6. Romantic shipping accent is settled — Stitch emerald (`06` §1.0/§3.2, `09` §2); prior `06` peach lock retired. Remaining open items are listed only in `09` §6.)*

### 10.4 Recommended first refactor batch (when implementation is allowed)

**Batch 0 (docs only):** README + archive stamps + narrative owner resolution.  
**Batch 1 (low product risk):** Replace GlowButton in relationship hub/detail with stitch CTAs; migrate `/about|/pricing|/faq|/contact` to Stitch shells.  
**Batch 2:** i18n forbidden-title rewrites (bomb/destiny/해독제) + grade **hiding** behind display policy.  
**Batch 3:** `scoreBarAppearance` → non-traffic encoding.  
**Not in first batch:** Romantic monolith deletion, Family/Work IA reshapes, dead-code mass delete.

### 10.5 Files that should be committed together (when executing)

| Batch | Commit together |
|-------|-----------------|
| Docs authority | `README.md`, narrative merge/archive moves, `09` stale fixes, this `10` if revised |
| Chrome migration | Marketing pages + shared shell + removal of SpaceBackground imports |
| CTA migration | All `GlowButton` relationship consumers + stitch button utility |
| Copy cleanup | `ko-KR.ts` + `en-US.ts` + any title maps in ViewModels |
| Score encoding | `scoreBarAppearance.ts` + snapshot panel consumers + visual tests |
| Romantic cutover | Flag default change + Experience UI + PremiumSection + legacy import ban |

### 10.6 Ready for design implementation?

| Question | Answer |
|----------|--------|
| Ready for **visual exploration / second design generation**? | **Yes** — use `08` + Appendix A + `09` + this plan; preserve Stitch identity; do not treat grades/Space/mockups as brand. |
| Ready for **production UI implementation** of a new IA? | **Not yet** — resolve `09` §6 owner decisions; finish remaining Phase 1 items (`02` rename); preferably Phase 3 copy policy for forbidden patterns. |
| Ready for **dead-code deletion**? | **No** — only after migrated consumers and import-graph verification (Phase 8). |

---

## Appendix — Sources

- `docs/product/08_Current_Product_Implementation_Design_Extraction.md` (+ Appendix A Stitch/Lovable baseline)  
- `docs/product/09_Product_and_Design_Intent_Package.md`  
- `docs/product/README.md`, `05*`, `06*`, `07*`, `05N`, `docs/dev/05_NARRATIVE_STYLE_BIBLE.md`  
- Code: `RelationshipPremiumSection`, ViewModel builders, `scoreBarAppearance.ts`, `theme.ts`, `stitch-theme.css`, `globals.css`, i18n catalogs, `romantic/experience/*`, `components/space/*`

---

*Planning document only. No application cleanup performed. Not committed unless explicitly requested.*
