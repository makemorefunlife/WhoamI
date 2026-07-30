# Pair Context Engine — Design Batch (implementation-ready)

**Status:** Implemented — see `lib/personCore/pairSaju/` + `lib/personCore/pairContextEngine/`  
**Date:** 2026-07-30 (design) / 2026-07-30 (implementation)  
**Scope:** Shared Pair fact layer + Pair CE packet contract + domain lenses  
**Non-goals at design time:** code was deferred; implementation landed in a follow-up commit. 

**Frozen pipeline (extends Individual):**

```text
Individual SSOT (A) + Individual SSOT (B)
  → Pair Fact Layer (canonical cross-chart facts; NEW)
  → Reference Dictionary (context-neutral base meanings only)
  → Pair Context Engine (select/structure packets; NEW)
  → Domain Context Engines / lenses (Romantic | Friend | Family | Work)
  → LLM (narrative only; must not invent Pair facts)
```

**Relation to decisions 018 / 020 / 022 / 024 / 026:**  
Those freeze **domain judgment** Context Engines (`CanonicalJudgment`, projections). They explicitly allow sharing **facts** and **domain-agnostic signals**. Pair CE is that shared fact/context layer — **not** a shared domain-judgment engine. Domains must **consume** Pair packets; they must not recalculate Pair facts.

**Chat table (A–H columns):** additional interpretation source only — **not** automatic SSOT. Domain columns E–H never enter Pair packets.

---

## 1. Pair SSOT ownership map

### 1.1 Canonical ownership (target)

| Layer | Owns | Does not own |
|-------|------|----------------|
| **Individual SSOT** `lib/personCore/individualSaju/` | Per-person facts (pillars, ten-gods, johu, yongsin, gongmang, nobles, shinsal, …) | Cross-chart relations |
| **REF tables** `lib/hardcoded/sajuReferenceData.ts` | Relation pair tables (stem_combine, branch_*, …), shinsal names | Pair assembly / domain copy |
| **Pair Fact Layer** *(to create)* `lib/personCore/pairSaju/` (proposed) | Deterministic A×B facts + evidence + confidence + directionality | Domain narrative, psych axes, CanonicalJudgment values |
| **Reference Dictionary** `lib/personCore/referenceDictionary/` | Stable base meanings for codes/relation ids | Domain advice |
| **Pair CE** *(to create)* `lib/personCore/pairContextEngine/` | Selection, tiers, `selection_priority`, grouping, exclusions | UI, report IA, domain judgments |
| **Domain CE / resolvers** `lib/relationship/{romantic,friend,familyParent,workColleague,marriage}/` | Domain CanonicalJudgment + projections + copy | Recalculating Pair facts |
| **Psych / questionnaire** survey axes, composites | Soft confirm / primary when tagged | Saju Pair facts |

### 1.2 Existing modules (as-found)

| Path | Role today | Target |
|------|------------|--------|
| `lib/saju/pairChartAnalysis.ts` | Cross branch pairs (육합/충/형/파/해), stem combines 4×4, trio/방합 union, `analyzePairSaju` digests | **Absorb into Pair Fact Layer** (keep as thin re-export during migration) |
| `lib/saju/sajuBlueprint.ts` | `buildPairSajuBlueprint` — dual person + one `analyzePairSaju`; `uncertainItems` / birth-time flags | Pair **assembly** entry today → call Pair Fact Layer once |
| `lib/saju/workPairRiskSignals.ts` | Wonjin/guimun sets, domain boolean wrappers, gongmang cross (branch-only xunkong), full 4×4 wonjin/guimun + gongmang hit builders | **Atomic predicates → Pair Fact**; retire duplicate xunkong |
| `lib/saju/palaceWeight.ts` | Palace weights for cross hits | Shared Pair utility |
| `lib/saju/elements.ts` | Element maps + `elementInteraction` | Shared Pair utility (directional energy) |
| `lib/saju/chartContext.ts` | Charts, `TRIO_BRANCH_GROUPS` | Shared input |
| `lib/saju/{friend,marriage,family,workPair}Analysis.ts` | Domain pair digests; local stem-combine day-only; work stem clash; johu heuristics | **Consume Pair facts**; delete local recalcs |
| `lib/personCore/sajuSignals/pair*.ts` | `pair_domain_signals_v1` (cohab/work/friend/family **indices**) | Keep as **domain-derived indices** OR rebuild from Pair facts later — **not** Pair CE packets |
| `lib/personCore/sajuSignals/extract*Signals.ts` | Per-person domain signal packs | Stay Individual/domain; Pair CE reads Individual + Pair facts |
| `lib/relationship/romantic/*Canonical.ts` + `romanticContextInput.ts` | Romantic typed projections over cross hits | Read Pair CE / Pair facts; stop calling raw analyzers directly long-term |
| `lib/relationship/romantic/experience/projectors/*` | V2 modules — today mainly consume **충형파해** tension (+ psych canonicals); six/stem/trio/wonjin/gongmang projections often unused by projectors | Domain UI; not Pair Fact |
| `lib/relationship/romanticRules/*` | Romantic rules + day-stem combine duplicate | Domain interpretation |
| `lib/relationship/contextEngine/canonicalJudgment.ts` | Shared **judgment envelope** only | Unchanged; not Pair CE |
| `lib/relationship/workColleague/tenGodComplement.ts` | Per-person ten-god **category strength** complement | Domain (Work) — not cross ten-god Pair fact |
| `lib/hardcoded/sajuReferenceData.ts` | `REF_RELATION_RULES` (8 relation_types; **no stem_clash**) | Fact table SSOT |

### 1.3 Duplicates / conflicts (normalization required)

| Issue | Detail | Minimal fix |
|-------|--------|-------------|
| **Gongmang method split** | Individual: `xunkong_by_day_pillar_v1` (stem+branch). `workPairRiskSignals`: `XUNKONG_BY_DAY_BRANCH` (day branch only) | Pair Fact **must** use Individual `voidBranchesForDayPillar` / `chart.gongmang` |
| **Stem combine day-only duplicates** | `hasHeavenlyStemCombine` in romanticRules + marriageAnalysis vs full `analyzeCrossChartStemCombines` | Canonical = full 4×4 hits; day×day is a **filter view**, not a second fact |
| **Stem clash orphan** | Only `workPairAnalysis.STEM_CLASH_PAIRS` — not in REF | Add Pair fact builder (+ optional REF rows later); single predicate module |
| **Wonjin wrappers vs 4×4** | Domain booleans (subset palaces) vs `analyzeCrossChartWonjinGuimun` (full 4×4) | Canonical = full hits; domain may filter by palace policy |
| **CrossChartHit.interpretation** | Embeds Korean narrative from REF/`meaning_ko` or hardcoded strings | Pair Fact stores **codes + reference_ids**; Dictionary owns meaning; strip narrative from fact payload over time |
| **Stale docs** | `ROMANTIC_CROSS_CHART_INTERACTION_ENGINE_AUDIT.md` predates stem/trio/wonjin/gongmang romantic wiring | Mark superseded by this design + re-audit after Pair Fact land |
| **`analyzePairSaju.allCrossHits`** | Branch pairs only; romantic merges stem/wonjin/gongmang ad hoc | Pair Fact Layer returns unified typed hit list |
| **Palace weight forks** | `palaceWeight.ts` vs `WORK_*` / `MARRIAGE_*` / `FRIEND_*` domain tables | Pair Fact stores raw hits + default weights; domain CE may re-rank — do not fork hit *existence* |
| **Ten-god count duplication** | `marriageTenGodAnalysis` vs `extractRomanticSignals` local counts | Single Individual/PersonCore count helper; not Pair Fact |
| **Unknown hour ingress** | Bundle/blueprint injects **12:00** hour + `birthTimeUnknown` flag; 4×4 still includes hour | Pair CE **must exclude** hour-slot packets (Personal CE parity) — do not treat 12:00 as real hour |
| **Family gongmang dead call** | `familyAnalysis` calls `detectGongmangCrossHit` then voids result | Fix when Family consumes Pair facts |
| **Romantic projector gap** | Stem/six/trio/wonjin/gongmang often injected as projections but V2 experience projectors mostly read tension + psych | Domain product debt — not Pair Fact blocker |

### 1.4 What is *not* Pair SSOT

- Domain `CanonicalJudgment` values / `canonical_projections`
- Survey axes and psych composites
- Chat table columns E–H (Romantic/Business/Family/Friend copy)
- Class S/A/B/C **percent labels** as user metrics
- `pair_domain_signals_*` intensity indices (optional consumers, not Pair CE core)

---

## 2. Existing interpretation-rule inventory

Classification key:

- **Canonical Pair fact** — objective A×B calculation  
- **Context-neutral interpretation** — dictionary / structural meaning, domain-agnostic  
- **Domain-specific interpretation** — Romantic/Friend/Family/Work only  
- **Questionnaire-only** — survey/psych  
- **Unsupported** — not calculated / docs-only  

| Rule family | Domains using | Classification | Primary path | Notes |
|-------------|---------------|----------------|--------------|-------|
| Branch 육합/충/형/파/해 cross | All (via pairChart / digests); Romantic tension typed | Canonical Pair fact | `analyzeCrossChartRelations` | First-match type per pillar pair |
| Stem 천간합 5 pairs cross | Romantic (canonical); Marriage day-only; Work stem pairs | Canonical Pair fact | `analyzeCrossChartStemCombines` | Day-only helpers = duplicate |
| Trio 삼합 / 방합 **cross union** | Romantic (`crossTrioHits`) | Canonical Pair fact | `analyzeCrossChartTrioCombines` | Excludes intra-complete charts |
| Intra 삼합/방합/천간합 | Digests / master relation_dynamics | Individual fact (not Pair) | `analyzeRelations` | Do not treat as Pair |
| Wonjin/귀문 cross 4×4 | Romantic canonical; M/F/Friend boolean wrappers | Canonical Pair fact | `analyzeCrossChartWonjinGuimun` | Wrappers subset palaces |
| Gongmang cross-hit | Romantic; Marriage/Work/Family boolean | Canonical Pair fact *(method conflict)* | `analyzeCrossChartGongmang` | Normalize to Individual xunkong |
| Day-stem element 생/극/동 | Romantic/Marriage/Friend digests | Canonical Pair fact (directional) | `elementInteraction` / `resolveHealingDirection` | |
| Stem clash 천간충 | **Work only** today | Canonical Pair fact *(needs lift)* | `workPairAnalysis` local set | Not in REF |
| Johu gap / temperature mismatch | Friend `pairFriendshipSignals`; Marriage bed johu heuristic | Partial Pair / domain index | `pairFriendshipSignals`, `dayBranchJohuComplement` | Needs unified Pair energy fact |
| Yongsin / favorable overlap | Prompt digests only loosely | Unsupported as Pair fact | Individual `favorable_elements` | Needs Pair composition rule |
| Strength 신강↔신약 complement | Romantic rules | Domain-specific + Individual facts | `strengthComplement` | |
| Ten-god count bands (officer/food/…) | All domains | Individual → domain | `extract*Signals`, tenGodAnalysis | Not A↔B ten-god role |
| Ten-god **category complement** (Work) | Work | Domain-specific | `tenGodComplement` | Per-person strong/lack |
| Balance of power / recovery / reassurance / role play | Romantic | Domain + Questionnaire | `relationshipDynamics` | |
| Expression / conflict / affection composites | Romantic | Domain + Questionnaire | `compare*Composite` | |
| Micromanaging / leadership indices | Work | Domain-specific | `pairWorkSignals` | |
| Umbilical / nagging / guidance_fit | Family | Domain-specific | `pairFamilySignals` | |
| Secret affinity / CFO struggle | Marriage/cohab | Domain-specific | `pairCohabitationSignals` | |
| Mutual 천을귀인 (A is B’s noble) | Copy mentions possession only | Unsupported | `has_cheoneul_guin` boolean | No cross noble-target calc |
| 격국 | Explicitly banned in prompts | Unsupported | — | Individual SSOT gap |
| Chat table domain copy (E–H) | Product intent | Domain-specific | *(chat only)* | Not SSOT |

---

## 3. Fact-mapping matrix (supplied table)

**Weight column (Class S/A/B/C %):** maps only to recommended **`selection_priority` bands** in Pair CE. Never a score, confidence, %, or user-visible metric.

| # | Category | Signal | Table weight → CE band | Map status | Existing fact / gap | Domain cols E–H |
|---|----------|--------|------------------------|------------|---------------------|-----------------|
| 1a | Energy | 상호 조후 일치/보완 | S → ~0.95 | **Requires Pair SSOT normalization** | Individual `johu`; Friend `johu_gap`; Marriage `dayBranchJohuComplement` (heuristic) | Domain-only |
| 1b | Energy | 상호 용신 일치 | S → ~0.95 | **Requires Pair SSOT normalization** | Individual `favorable_elements` only; no typed Pair overlap | Domain-only |
| 1c | Energy | 일방적 설기(洩氣) | B → ~0.55 | **Supported** (directional) after normalize | `ELEMENT_GENERATES` + `resolveHealingDirection` / day-stem interaction | Domain-only |
| 2a–e | Stem | 갑기/을경/병신/정임/무계합 | C → ~0.40 | **Supported** | `analyzeCrossChartStemCombines` + REF `stem_combine` | Domain-only |
| 2f | Stem | 천간 충 | C → ~0.40 | **Requires Pair SSOT normalization** | Work-local `STEM_CLASH_PAIRS` only | Domain-only |
| 3a | Branch | 육합 | A → ~0.80 | **Supported** | `analyzeCrossChartRelations` / `branch_six_combine` | Domain-only |
| 3b | Branch | 삼합 | A → ~0.80 | **Supported** (cross union) | `analyzeCrossChartTrioCombines` | Domain-only |
| 3c | Branch | 방합 | B → ~0.55 | **Supported** (cross union) | same | Domain-only |
| 3d | Branch | 지지 충 | A → ~0.80 | **Supported** | `branch_clash` | Domain-only |
| 3e | Branch | 원진/귀문 | C → ~0.40 | **Supported** | `analyzeCrossChartWonjinGuimun` | Domain-only |
| 3f | Branch | 형/파/해 | B → ~0.55 | **Supported** | punishment/break/harm | Domain-only |
| 4a | Ten-god | 관성 ↔ 비견 | B → ~0.55 | **Unsupported** as classical A↔B role pair | Only per-person counts / Work category complement / psych frames | Domain-only / questionnaire overlay |
| 4b | Ten-god | 식상 ↔ 인성 | B → ~0.55 | **Unsupported** as classical A↔B role pair | Same | Domain-only / questionnaire |
| 4c | Ten-god | 비견 ↔ 비견 | C → ~0.40 | **Requires normalization** (narrow) | Same-element day stems (`elementInteraction` 동기) ≠ true 비견↔비견 role | Domain-only |
| 5a | Special | 상호 천을귀인 | A → ~0.80 | **Unsupported** (no cross target) | Possession flags only | Domain-only if ever added |
| 5b | Special | 공망 공유 | C → ~0.40 | **Requires Pair SSOT normalization** | Cross-**hit** exists; **shared void set** intersection not typed; method conflict | Domain-only |

**Do not invent:** 격국, true mutual noble targeting without REF algorithm, classical ten-god-of-A-toward-B palace matrix unless product freezes method + SSOT storage.

---

## 4. Final Pair CE packet contract

### 4.1 Principles (aligned with Personal CE; not isomorphic)

1. Facts vs meaning vs domain narrative stay separate.  
2. `tier` / `selection_priority` = admission + deterministic ordering only — **never** Class % / compatibility score.  
3. No Saju recalculation inside Pair CE — read Pair Fact Layer + Individual charts.  
4. Unknown birth hour → exclude hour-involving packets; never invent hour.  
5. Directionality is first-class (설기, gongmang one-way, healing direction).  
6. Domain columns never stored on packets.  
7. Pair schema may differ from Personal CE; shared *concepts* only.

### 4.2 Types (canonical design)

```ts
// Proposed — lib/personCore/pairContextEngine/types.ts (not implemented)

type PairPartyId = "A" | "B";

type PairContextGroupId =
  | "bonding"      // 합 / mutual support structures
  | "friction"     // 충형파해 / wonjin / clash
  | "energy"       // johu / generation-drain / yongsin alignment
  | "structure"    // trio / shared voids / era overlap (optional)
  | "modifiers";   // nobles mutual (if ever), soft flags

type PairRoleInLens =
  | "bond_signal"
  | "friction_signal"
  | "energy_flow"
  | "energy_balance"
  | "modifier_signal"
  | "directional_guidance";

type PairDirectionality = {
  polarity: "symmetric" | "a_to_b" | "b_to_a" | "multipart";
  /** For a_to_b: A acts on B (e.g. A generates B = A drains toward B / 설기). */
  from?: PairPartyId;
  to?: PairPartyId;
};

type PairContextPacket = {
  packet_id: string;
  group: PairContextGroupId;
  role_in_lens: PairRoleInLens;
  tier: 1 | 2 | 3 | 4;
  /** Dot path into Pair Fact Layer, e.g. cross_hits.stem_combine[0] */
  fact_path: string;
  fact_kind:
    | "stem_combine"
    | "stem_clash"
    | "branch_pair"
    | "branch_trio"
    | "wonjin_guimun"
    | "gongmang_cross"
    | "gongmang_shared"
    | "element_flow"
    | "johu_relation"
    | "yongsin_alignment"
    | "other";
  codes: string[];
  parties: {
    a_report_id: string;
    b_report_id: string;
  };
  directionality: PairDirectionality;
  /** Palace participation when applicable */
  pillar_slots?: {
    a?: "year" | "month" | "day" | "hour";
    b?: "year" | "month" | "day" | "hour";
    contributions?: Array<{
      owner: PairPartyId;
      pillar_slot: "year" | "month" | "day" | "hour";
      code: string;
    }>;
  };
  reference_ids: string[];
  base_meanings: Array<{
    reference_id: string;
    text_ko: string;
    text_en?: string;
    resolved: true;
  }>;
  unresolved_reference_ids: string[];
  /**
   * Deterministic ordering only.
   * Not Class S/A/B/C %, personality, confidence, compatibility, or UI metric.
   */
  selection_priority: number;
  confidence: "deterministic" | "heuristic" | "low" | string;
  evidence: Array<{
    kind: string;
    codes?: string[];
    pillar_slot?: string;
    detail?: string;
    party?: PairPartyId;
  }>;
};

type PairContextEngineOutput = {
  schema_version: "pair_ce_v1";
  lens: "pair_shared_v1"; // context-neutral; domains apply their own lens later
  packets: PairContextPacket[];
  groups: Record<PairContextGroupId, PairContextPacket[]>; // view only
  aggregates: {
    birth_time_unknown_a: boolean;
    birth_time_unknown_b: boolean;
    hit_counts_by_kind: Record<string, number>;
    ssot_gaps: readonly string[];
  };
  exclusions: Array<{
    fact_path: string;
    reason:
      | "birth_time_unknown"
      | "low_priority_cap"
      | "empty_fact"
      | "deduped"
      | "low_confidence_omitted"
      | "method_unnormalized";
    detail?: string;
  }>;
  unresolved_references: Array<{
    reference_id: string;
    fact_path: string;
    reason: "dictionary_miss";
  }>;
  provenance: {
    ce_version: "pair_ce_v1";
    lens: "pair_shared_v1";
    dictionary_version: string;
    pair_fact_version: string;
    chart_a: { report_id: string; schema_version: string; fingerprints: string };
    chart_b: { report_id: string; schema_version: string; fingerprints: string };
    built_at: string;
    policy_id: "pair_context_engine_policy_v1";
  };
};
```

### 4.3 Selection policy sketch (CONFIRMED principles; numbers starting grid)

| Tier | Contents | Typical `selection_priority` |
|------|----------|------------------------------|
| T1 | Day×day bonding/friction; primary energy flow | 0.85–1.00 |
| T2 | Other palace pairs; trios; typed tensions | 0.55–0.80 |
| T3 | Hour (if known); soft modifiers | 0.35–0.55 |
| T4 | Low-confidence yongsin alignment; decorative | ≤0.35 |

Table Class → default band: S≈0.95, A≈0.80, B≈0.55, C≈0.40 — **ordering only**.

### 4.4 Unknown hour

- If A or B `birth_time_unknown`: exclude packets whose `pillar_slots` include that party’s `hour`.  
- Record `exclusions[]` with `birth_time_unknown`.  
- Do not drop non-hour packets.

---

## 5. Required normalization changes

| ID | Change | Blocking for Pair CE MVP? |
|----|--------|---------------------------|
| N1 | Unify gongmang void calc → Individual `xunkong_by_day_pillar_v1` | **Yes** (wrong voids) |
| N2 | Create `lib/personCore/pairSaju/` fact builder wrapping existing analyzers + stem_clash + johu/yongsin/shared-void compositions | **Yes** (ownership) |
| N3 | Stop embedding domain narrative in fact `interpretation`; attach Dictionary ids | Soft (can phase) |
| N4 | Dedupe day-only stem-combine helpers → views on Pair facts | Soft |
| N5 | Document Pair vs Domain CE boundary (extends 018 “share facts only”) | Doc |
| N6 | Defer unsupported rows (4a/4b, 5a, classical 격국) — list in `ssot_gaps` | No invent |
| N7 | Domain consumers switch to Pair packets (Romantic first opt-in) | After MVP |

---

## 6. Exact implementation plan

### Phase P0 — Docs & policy (no product code)

1. Add `PAIR_CONTEXT_ENGINE_POLICY.md` (selection rules; this design’s normative extract).  
2. Link from `docs/dev/personCore/README.md`, `CORE_MAP.md`.  
3. Decision note: Pair CE shares **facts/packets**; domain CEs remain judgment owners (018 compatible).

### Phase P1 — Pair Fact Layer MVP

1. `lib/personCore/pairSaju/`  
   - `buildPairSajuFacts(chartA, chartB)`  
   - Emit typed facts: branch pairs, stem combines, stem clashes, trios, wonjin/guimun, gongmang_cross (N1), gongmang_shared, element_flow (day + optional), johu_relation (from Individual johu), yongsin_alignment (overlap of favorable lists + confidence gate).  
2. Reuse calculators from `pairChartAnalysis` / `workPairRiskSignals` behind the façade; fix gongmang import.  
3. Unit tests: fixtures known/unknown hour; parity vs current romantic merged hit lists where applicable.  
4. **Do not** invent ten-god cross roles or mutual 천을.

### Phase P2 — Pair CE MVP

1. `lib/personCore/pairContextEngine/` mirroring Personal CE structure (`runPairContextEngine`, selector, purity, types, constants).  
2. Dictionary lookups for relation/element codes only.  
3. Caps + tier reservation; `selection_priority` ordering.  
4. Tests: determinism, hour exclusions, no `weight` field, no domain copy in packets.  
5. Adapter stubs per domain (document insertion points; `wired: false`).

### Phase P3 — Consumer migration (domain by domain)

1. Romantic: `collectRomanticDynamicsTypedSnapshot` reads Pair facts instead of calling analyzers.  
2. Friend / Marriage / Work / Family: replace local recalcs gradually.  
3. Keep `CanonicalJudgment` domain-local.

### Phase P4 — Optional SSOT expansions (product-gated)

1. Mutual 천을 algorithm + REF.  
2. True A↔B ten-god role matrix method.  
3. REF rows for stem_clash.  
4. Re-audit chat table rows still Unsupported.

---

## 7. File list (implementation will touch)

### Create

- `lib/personCore/pairSaju/` (`types.ts`, `buildPairSajuFacts.ts`, `stemClash.ts`, `index.ts`, …)  
- `lib/personCore/pairContextEngine/` (`types.ts`, `constants.ts`, `selectPairShared.ts`, `runPairContextEngine.ts`, `purity.ts`, `adaptPairContextForDomains.ts`, `index.ts`)  
- `docs/dev/personCore/PAIR_CONTEXT_ENGINE_POLICY.md`  
- `docs/dev/PAIR_CONTEXT_ENGINE_MVP.md`  
- `tests/unit/pair-saju-facts.test.mjs`  
- `tests/unit/pair-context-engine.test.mjs`  
- `docs/dev/decisions/034_pair-context-engine-boundary.md` *(suggested)*

### Modify

- `lib/personCore/index.ts` — exports  
- `docs/dev/personCore/README.md`, `docs/dev/CORE_MAP.md`, `docs/dev/README.md`  
- `lib/saju/workPairRiskSignals.ts` — gongmang → Individual void helper  
- `lib/saju/pairChartAnalysis.ts` — re-export or thin wrap (optional during P1)  
- `lib/relationship/romantic/romanticContextInput.ts` — P3 consumer  
- Domain analysis files — P3 only (`friendAnalysis`, `marriageAnalysis`, `workPairAnalysis`, `familyAnalysis`)  
- Possibly `lib/personCore/referenceDictionary/` — relation id coverage gaps only  

### Do **not** modify in Pair CE MVP

- Domain CanonicalJudgment resolvers’ product semantics  
- Questionnaire / psych composites  
- LLM prompt ownership of typed classes  
- Product `05_*` bible as engine policy dump  

---

## 8. Remaining blockers (true blockers only)

1. **Gongmang method conflict (N1)** — must resolve before trusting gongmang Pair packets.  
2. **Product freeze (non-blocking for MVP skeleton, blocking for claiming table-complete):**  
   - Exact johu “일치” definition (band match vs heat/moisture thresholds vs Marriage heuristic).  
   - Yongsin “일치” (any overlap vs day-master-needed element vs confidence gate).  
   - Whether unsupported ten-god role rows stay Domain-only forever or get a method.  
   - Mutual 천을 algorithm approval.  
3. **No other hard engineering blockers** for P1–P2 skeleton — calculations for most table rows already exist.

---

## 9. Open questions (ask once at end of batch)

See chat closing questions — deferred during audit per request.

---

## 10. Repo-audit addendum (subagent cross-check)

Cross-checked against [Audit Pair SSOT code](e7a42b43-daa0-4fa3-9f44-32a0d61e1c42) and [Inventory relationship rules](4cee52fa-7613-434a-84d6-8eb0dc81b272).

**Confirmed (no design change):** Pair fact hub = `pairChartAnalysis` + `workPairRiskSignals`; no Pair CE yet; domain CEs own judgments; gongmang dual-method is the hard blocker; stale ROMANTIC cross-chart audit.

**Merged into §1.2–1.3:** `sajuBlueprint` assembly role; palace-weight forks; ten-god count duplication; unknown-hour **12:00 inject vs Pair CE hour exclusion**; Family gongmang dead call; Romantic V2 projector under-consumption of non-tension cross projections (domain debt, not Pair Fact blocker).

**Implementation readiness unchanged.**