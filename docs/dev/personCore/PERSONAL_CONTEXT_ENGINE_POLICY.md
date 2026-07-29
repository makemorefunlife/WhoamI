# Personal Context Engine — Selection & Interpretation Policy

**Status:** Canonical engine-policy SSOT for `personal_innate_v1`  
**Layer:** PersonCore (implementation / engine)  
**Code:** `lib/personCore/personalContextEngine/`  
**Upstream facts:** `IndividualSajuChart` (`individual_saju_chart_v1`)  
**Meanings:** Reference Dictionary (`reference_dictionary_v1`) only  

**Does not own:** Relationship product experience → `docs/product/05_Relationship_Product_Bible.md` and `05A–05E`. UX copy laws → `02`. Narrative style → `05N` / `docs/dev/05_NARRATIVE_STYLE_BIBLE.md`.  

**Companion (contract / sprint wiring):** `docs/dev/PERSONAL_CONTEXT_ENGINE_MVP.md`  

**Pipeline (frozen):**

```text
Individual SSOT (facts)
  → Reference Dictionary (stable base meanings)
  → Personal Context Engine (this policy)
  → LLM (natural language; must not invent Saju facts)
```

---

## Principles

1. **Facts vs meaning vs narrative stay separate.** Individual SSOT holds objective calculated facts. Reference Dictionary holds stable base meanings only. Personal CE selects/structures packets. LLM (or later copy layers) may generate narrative — CE must not.
2. **Tiers and `selection_priority` are ordering controls only.** They decide inclusion order and truncation. They are **not** numeric compatibility scores, personality scores, destiny ranks, confidence values, probabilities, percentages, or user-visible metrics.

```text
selection_priority controls deterministic candidate selection and ordering only.
It is not a personality score, trait intensity, confidence value,
compatibility score, probability, percentage, or user-visible metric.
```
3. **No Saju recalculation in CE.** Read stored Individual facts; do not rebuild pillars, ten-gods, or relations from hangul.
4. **일간 is the ten-god reference.** Only comparisons of *other* stems/branches/hidden stems against the day stem are interpretable ten-god signals. Day-stem self-comparison is excluded.
5. **Modifiers are not identity.** Nobles, shinsal, gongmang, and soft specials adjust context; they must not crowd out T1–T2 core signals.
6. **용신/희신 are directional guidance**, not fixed personality identity. Respect SSOT confidence; default-omit low-confidence heuristics.
7. **Unknown birth hour is explicit.** Exclude hour packets; never infer a true hour.
8. **Unsupported classical fields remain gaps.** Yin-yang balance, 격국, luck cycles are documented SSOT gaps — never fabricated.

---

## 0. Documentation audit (why this file)

| Doc | Role | Engine selection policy? |
|-----|------|---------------------------|
| `docs/product/05_Relationship_Product_Bible.md` | Relationship **product** experience SSOT | **No** — keep product-only; no packet/tier/`selection_priority` rules here |
| `docs/product/05A–05E` | Domain blueprints | **No** — relationship lenses only |
| `docs/dev/PERSONAL_CONTEXT_ENGINE_MVP.md` | Sprint 2 I/O contract + Slim insertion points | Partial — contract only; **defers policy to this file** |
| `docs/dev/REFERENCE_DICTIONARY_*.md` | Dictionary purity / migration | Adjacent; not selection policy |
| `docs/dev/decisions/033_individual-saju-ssot-batch0.md` | Individual fact-build constants | Fact methods, not CE selection |
| Relationship CE decisions (`018`, `021`–`026`, …) | Domain Context Engines | **Out of scope** — do not merge into personal policy |

**Conclusion:** No prior canonical **personal** engine-selection document existed. This file is created under PersonCore (`docs/dev/personCore/`) as that SSOT. `05` is intentionally not extended with implementation-level engine detail.

---

## 1. Status legend (every rule below)

| Tag | Meaning |
|-----|---------|
| **CONFIRMED** | Binding for the next CE selection fix / Slim prep. Classical + product audits agree. |
| **PRODUCT DECISION NEEDED** | Engine can implement either way; product must choose before freeze. |
| **FUTURE / SSOT GAP** | Desired signal; **not** supported (or not first-class) on current `IndividualSajuChart`. Do not fake in CE. |

---

## 2. Interpretation tiers & signal priority

### 2.1 Tiers (CONFIRMED)

| Tier | Name | Role | Cap / reservation |
|------|------|------|-------------------|
| **T1** | Canonical core | Day-master identity + primary energy/balance | Always emit; **reserved slots**; never displaced by T3–T4 |
| **T2** | Structural interpretation | Ten-gods vs 일간 (non-self), typed 합/충류, 공망, 통근 (signed) | Emit by type rules; medium cap |
| **T3** | Supporting | Hour (if known), year stage, johu bands, **few** nobles/shinsal | Only after T1–T2 filled |
| **T4** | Optional / decorative | Low-confidence 용희기신, soft flags (도화/역마), extra nobles | Strict cap; default-omit when confidence low |

### 2.2 `selection_priority` bands (CONFIRMED principle; numeric defaults CONFIRMED as starting grid)

| Tier | Typical `selection_priority` band |
|------|-----------------------------------|
| T1 | `0.85 – 1.00` |
| T2 | `0.55 – 0.80` |
| T3 | `0.35 – 0.55` |
| T4 | `≤ 0.35` |

`selection_priority` orders packets and drives truncation after tier admission. It must never be shown to users as a measured score.

### 2.3 Group semantics (CONFIRMED)

| Group | Holds |
|-------|--------|
| `identity` | Who the chart centers on (일간/일지 and close palace support) |
| `energy` | Climate, season, stages, harmony structure (합), dominant element |
| `strengths` | Supportive structure (신강약 class when meaningful, 통근 when rooted, limited nobles) |
| `cautions` | Clash/harm family, void, unrooted, deficiency tensions |
| `growth` | Development/background stage; gated 용희신; optional deficiency-as-growth (**see product decision**) |

---

## 2A. Packet contract (Individual CE)

Canonical list: `packets[]`. `groups` is a **view** of the same packets by `group` — not a second fact store.

| Concern | Packet fields | Must not mean |
|---------|---------------|---------------|
| Fact | `fact_path`, `codes` | UI section id |
| Meaning | `reference_ids` → `base_meanings` | Advice / narrative |
| Epistemic | `confidence` | Selection ordering |
| Evidence | `evidence` | Report layout |
| Grouping | `group`, `role_in_lens` | Final report module names |
| Admission | `tier` | Personality strength |
| Ordering | `selection_priority` | Score / % / compatibility |

Pair Context Engine may reuse these *concepts* without requiring an identical schema. Do not force Individual/Pair field isomorphism here.

**Audit (2026-07-29):** Pass — layers cleanly separated; no UI/report/narrative ownership fields on packets; `groups` documented as view; `report_id` clarified as chart/session provenance; Pair deferred without schema lock-in. No blocking defects.

---

### 3.1 Include only if (CONFIRMED)

1. Fact exists on `IndividualSajuChart` (no recalculation of pillars, ten-gods, relations).  
2. Packet is **semantically valid** for personal interpretation (not a calculation artifact).  
3. Dictionary `reference_id`s are attached; misses go to `unresolved_references` (never silently dropped).  
4. `birth_time_unknown` ⇒ hour-pillar packets **excluded** (`birth_time_unknown`), not emitted.  
5. Unpossessed specials: record as **exclusion** (`not_possessed`) when the policy tracks that flag family; do not invent possession.

### 3.2 Exclude / never emit (CONFIRMED)

| Rule | Reason |
|------|--------|
| `pillars.day.stem_ten_god` | 일간 is the **reference**; self-comparison is always 비견-class — not an “other” ten-god signal |
| Narrative, advice, relationship-domain copy | LLM / product layers only |
| Domain romantic/work/family/friend meanings | Out of personal lens |
| Invented 격국 / 음양균형 scores | Not in SSOT yet |

### 3.3 Unknown birth time (CONFIRMED)

- Exclude `pillars.hour.*` packets.  
- Omit hour from `aggregates.ten_god_stem_counts`.  
- Do not down-rank day/month/year merely because hour is unknown.

---

## 4. Ten-god policy (CONFIRMED)

**Reference point:** day stem (일간) only.

| Source | Emit? | Group (default) | Tier |
|--------|-------|-----------------|------|
| Day stem vs itself (`pillars.day.stem_ten_god`) | **Remove** | — | — |
| Year / month / hour stem ten-god vs 일간 | **Yes** (hour if time known) | identity_support or energy | T2 |
| Day branch main ten-god (`pillars.day.branch_ten_god`) | **Yes** | identity_support | T2 |
| Other pillars’ branch / hidden ten-gods | Optional later | identity/energy | T2–T3 |

**PRODUCT DECISION NEEDED:** Whether non-day stem ten-gods sit in `identity` vs `energy` (support role vs dynamic pattern). Default recommendation until decided: **identity_support** for stem ten-gods; keep day `branch_ten_god` in identity.

---

## 5. Strength & rootedness (CONFIRMED)

| Fact | Policy |
|------|--------|
| `strength.label_token` | Emit as T1/T2 **chart balance class** in `strengths`; preserve SSOT `confidence` (often heuristic). Not a moral “strength.” |
| `rootedness` when rooted | `strengths` / strength_signal · T2 |
| `rootedness` when **not** rooted | `cautions` / caution_signal · T2 — **do not** leave in strengths |

---

## 6. Relations — separate handling (CONFIRMED)

Do **not** dump top-N relations into a single group.

| Family | `type_id` examples | Group | Tier |
|--------|--------------------|-------|------|
| **합 (combine)** | `stem_combine`, `branch_six_combine`, `branch_three_combine`, `branch_direction_combine` | `energy` (preferred) or `strengths` | T2 |
| **충** | `branch_clash`, `stem_clash` | `cautions` | T2 |
| **형** | `branch_punishment` | `cautions` | T2 |
| **파** | `branch_break` | `cautions` | T2 |
| **해** | `branch_harm` | `cautions` | T2 |
| **원진** | `wonjin` (relations and/or special) | `cautions` | T2 |
| **귀문** | `guimun` | `cautions` | T2 |

**Selection:** Prefer typed coverage (e.g. at least one combine + one tension when both exist) over blind global top-3 by priority.

**Dedup:** If both `relations_intra` and `special_signals` mark wonjin/guimun, emit **one** channel (prefer `relations_intra` when present).

**PRODUCT DECISION NEEDED:** Combine packets in `energy` vs `strengths` (recommendation: **energy**).

---

## 7. Five elements, seasonal, johu, twelve stages

| Fact | Tier | Group | Status |
|------|------|-------|--------|
| `five_elements.dominant` | T1 | energy | **CONFIRMED** |
| `five_elements.weakest` | T2 | cautions *or* growth | **PRODUCT DECISION NEEDED** (recommendation: cautions; dedupe vs yongsin) |
| `seasonal_strength` | T2 | energy | **CONFIRMED** (keep heuristic confidence) |
| `johu.temperature_band` / `moisture_band` | T3 | energy | **CONFIRMED** |
| `pillars.month.twelve_stage` | T1 | energy | **CONFIRMED** |
| `pillars.day.twelve_stage` | T1–T2 | identity or energy | **CONFIRMED** (emitted) |
| `pillars.year.twelve_stage` | T3 | growth or energy | **CONFIRMED** |
| `pillars.hour.twelve_stage` | T3 | energy | **CONFIRMED** if time known |

---

## 8. Modifier rules — nobles, shinsal, gongmang, yongsin

### 8.1 Gongmang (CONFIRMED)

- Emit when void branches exist → `cautions` · T2 · `selection_priority` mid (~0.60–0.70).  
- Attach `gongmang:void` + void `branch:*` dictionary ids.

### 8.2 Nobles (CONFIRMED as modifiers)

- **Secondary only** (T3–T4).  
- `selection_priority` ≤ `0.45`; **max 1–2** nobles per report unless product raises cap.  
- Must not fill `strengths` ahead of T1–T2.  
- Dictionary life-copy may be soft; CE still attaches base_meaning only — purification is Dictionary backlog.

### 8.3 Shinsal (non-noble) (CONFIRMED as modifiers)

- Cap count (recommended max 2).  
- `selection_priority` ≤ `0.40`.  
- Map roughly: misfortune-like → cautions; fortune/career-like → strengths sparingly.  
- **PRODUCT DECISION NEEDED:** Whether REF category `relationship` / `personality` shinsal are in-scope for **personal** innate (recommendation: cautions only for clear misfortune; else T4 or omit).

### 8.4 Special soft flags — dohwa / yeokma (CONFIRMED as T4)

- Emit only if `possessed`; otherwise exclusion `not_possessed` (parity with wonjin/guimun tracking).  
- Not identity core.

### 8.5 Yongsin / huisin / gisin (CONFIRMED confidence gate)

- SSOT method is **low-confidence heuristic** (`favorable_elements`).  
- **Default:** do **not** include when `confidence === "low"` unless `include_low_confidence: true`.  
- If included → T4, `selection_priority` ≤ `0.35`, preserve confidence on packet.  
- `gisin` optional T4 caution under same gate (**MISSING** as packet today).  
- Dedupe: if yongsin element === weakest element, prefer **one** packet (weakest **or** yongsin, not both at full selection priority).

---

## 9. Deduplication principles (CONFIRMED)

1. Same `reference_id` may appear in multiple packets only when **roles differ** (e.g. day element in identity vs dominant in energy) — prefer once per group when text would be identical.  
2. Weakest element ↔ yongsin: single deficiency/growth signal.  
3. Wonjin/guimun: single channel.  
4. Noble vs shinsal same star: prefer `nobles.*` path; skip duplicate `shinsal_hits` for 귀인 names (already intended).  
5. Truncation: drop T4 then T3 before T1–T2; never drop T1 for cap.

---

## 10. Confidence & evidence preservation (CONFIRMED)

| Rule | Detail |
|------|--------|
| Confidence | Copy from SSOT fact when present; do not upgrade. Heuristic/low must remain visible on packet. |
| Evidence | Preserve `EvidenceRef` (`kind`, `codes`, `pillar_slot`, `detail`) through CE output. |
| Slim adapter | Must not strip evidence to `detail`-only before Slim migration is designed; if compressed, keep codes+kind. |
| Unresolved | Explicit `unresolved_references[]` + per-packet `unresolved_reference_ids`. |
| Provenance | CE version, lens, dictionary version, chart fingerprints, report_id. |
| No narrative in CE | Packets carry dictionary **base_meaning** text only; no CE-authored advice paragraphs. |

---

## 11. Group caps (CONFIRMED principle)

- Flat per-group max without tier reservation is **insufficient** (nobles crowded strengths in MVP).  
- **Required:** reserve minimum slots for T1–T2 per group (exact numbers **PRODUCT DECISION NEEDED**; recommendation: reserve 3–4 in `strengths`/`cautions`/`energy` before T3–T4).  
- Global decorative budget: nobles + non-noble shinsal + T4 ≤ small fixed N (recommendation N=3).

---

## 12. Future inputs not in current SSOT (FUTURE / SSOT GAP)

Do **not** synthesize these in CE until Individual SSOT (or an approved derived layer) stores them with method + confidence + evidence.

| Signal | Why it matters | Blocker |
|--------|----------------|---------|
| **음양 균형 (yin-yang balance)** | Classical chart climate alongside johu/elements | No first-class balance fact on `IndividualSajuChart` |
| **격국 (chart pattern / structure class)** | High-level pattern that should outrank many shinsal | Not computed/stored in current SSOT |
| Full **대운/세운** luck cycles | Timing lens | `luck_cycles.computed: false` stub |
| Richer **지장간** personal packets | Depth without narrative | Facts exist; selection policy optional T2–T3 not yet mandated |
| True solar / lunar completeness | Calendar provenance | Often null in calendar block |

When added to SSOT: place 격국 and yin-yang balance as **T1 candidates** (product confirm), luck cycles as a **separate lens** (not silent merge into `personal_innate_v1` without a decision).

---

## 13. Product decisions still needed (checklist)

1. Non-day stem ten-gods → `identity` vs `energy`.  
2. 합 packets → `energy` vs `strengths` (rec: energy).  
3. `five_elements.weakest` → `cautions` vs `growth` (rec: cautions + dedupe yongsin).  
4. Exact reserved T1–T2 slot counts per group.  
5. Noble/shinsal absolute caps and whether `relationship`-category shinsal are in personal scope.  
6. Whether Slim user-facing copy may mention traditional terms or must stay human-framework only (product/UX; not this engine file’s ownership — flag for `02` / Slim docs).

Until decided, implementers follow **recommendations** marked above; do not silently invent 격국/음양.

---

## 14. Implementation status vs this policy

| Policy item | Code status (post policy alignment sprint) |
|-------------|--------------------------------------------|
| Day self ten-god removed | **Done** |
| 합 → energy; 충/형/파/해/원진/귀문 → cautions | **Done** |
| Rootedness signed by rooted flag | **Done** |
| Nobles capped (max 2) / demoted selection_priority | **Done** |
| Yongsin low-conf default off; directional role | **Done** |
| Y/M/H stem ten-gods vs 일간 | **Done** (hour gated) |
| Day twelve_stage | **Done** |
| Tier-reserved caps | **Done** (`reserved_t1_t2_per_group`) |
| Evidence through Slim adapter | **Done** (full `EvidenceRef`) |
| SSOT gaps listed, not fabricated | **Done** (`aggregates.ssot_gaps`) |
| Principles (tiers ≠ personality scores) | **Documented** |

Remaining open: product decisions in §13 (group placement nuances, exact reserve counts as product freeze, Slim term exposure).

---

## 15. Related links

- Contract / Slim insertion: `docs/dev/PERSONAL_CONTEXT_ENGINE_MVP.md`  
- Dictionary: `docs/dev/REFERENCE_DICTIONARY_MIGRATION.md`, `REFERENCE_DICTIONARY_CLEANUP.md`  
- Individual fact methods: `docs/dev/decisions/033_individual-saju-ssot-batch0.md`  
- Code map: `docs/dev/CORE_MAP.md`  
- Relationship product (do not merge engine rules into): `docs/product/05_Relationship_Product_Bible.md`
