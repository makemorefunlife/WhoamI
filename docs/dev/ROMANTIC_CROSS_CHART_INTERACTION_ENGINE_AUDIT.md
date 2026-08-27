# Romantic — Cross-Chart Interaction Engine Audit

Status: Targeted audit only. No code changed. Traced fresh from source this pass — not derived from prior audit summaries in this repo.
Verdict scale per item: **SUPPORTED** (calculated cross-chart, all pillars, reaches typed Premium data, preserves detail) / **PARTIAL** (calculated but with a real limitation on one of the 5 dimensions) / **ABSENT** (the specific thing asked — a cross-chart A×B interaction reaching the reader — does not exist, even if a same-person or intra-chart relative sits nearby).

---

## 천간합 (stem combine), incl. 丁壬合

1. **Calculated?** Yes — but only **intra-chart** (within one person's own 4 pillars). A cross-chart pairing (Person A's 丁 combining with Person B's 壬) is never checked anywhere in the codebase.
2. **Pillars compared:** One person's own 4 stems against each other (all C(4,2)=6 same-person pairs). Never A's stems vs B's stems.
3. **Implementation:** `lib/saju/analyzeRelations.ts:53-80` (`analyzeStemCombines`), invoked from `analyzeRelations(chart)` at `analyzeRelations.ts:149-157`, called from `lib/v2/saju/calculateSajuBundle.ts:54`. Reference data: `lib/hardcoded/sajuReferenceData.ts`, `relation_type: "stem_combine"`, 5 rows (id 1-5) — confirmed 정임합 present verbatim (`code_a: "jeong"`, `code_b: "im"`, `description: "정임합목"`, ~line 4217).
4. **Reaches typed Premium data?** No. `analyzeRelations()`'s output becomes `SajuMasterJson.relation_dynamics` (per-person) via `mapRelationDynamics` (`mapSajuMasterJson.ts`), which reaches only the legacy free-text digest: `romanticSajuPromptDigest.ts:106-108` (`m.relation_dynamics.slice(0,5).map(r => \`${r.type}:${r.name}\`)`). Zero references in `extractDomainSajuSignals.ts` (grep-confirmed) — never reaches `extractRomanticSignals`, any `romantic*Canonical.ts` file, or any projector.
5. **Preserves exact pair/position/interpretation?** No, even at the typed per-person layer: `mapRelationDynamics` hardcodes `codes: []` for every entry — the actual stem codes involved are discarded; only a human-readable `name` string and `interpretation` sentence survive. And since it's intra-chart, there is no A-vs-B pair to preserve in the first place.

**Verdict: ABSENT** as a cross-chart interaction. What exists (intra-chart, incl. 정임합) doesn't reach typed data either.

---

## 지지 육합 (branch six-combine)

1. **Calculated?** Yes, cross-chart (A×B).
2. **Pillars compared:** All 8 combined pillars — full 4(A)×4(B)=16 pillar-pair cross product.
3. **Implementation:** `lib/saju/pairChartAnalysis.ts:99-135` (`analyzeCrossChartRelations`); `branch_six_combine` is the first entry in `PAIR_BRANCH_TYPES` (line 30... in the co-located copy at `workPairRiskSignals.ts:26`, same table shape).
4. **Reaches typed Premium data?** No. The romantic `cross_chart_tension` canonical added this session (`lib/relationship/romanticRules/relationshipDynamics.ts::resolveCrossChartTension`) explicitly filters to `TENSION_TYPES = {충, 형, 파, 해}` — 육합 hits are computed by the same function but excluded before reaching the typed layer. Only reaches the legacy digest (`crossHitsDigest` in `romanticSajuPromptDigest.ts`, via `allCrossHits`).
5. **Preserves exact pair/position/interpretation?** Yes, at the raw computation: each `CrossChartHit` carries `personA_pillar`/`personB_pillar` (e.g. `"일주(갑자)"`), `interpretation` (meaning_ko), `priority`, `palaceWeight`, `weightedPriority`. But this detail never reaches Premium data at all (see #4) — it's discarded once flattened into the digest string.

**Verdict: PARTIAL** — fully computed cross-chart across all pillars with full detail, but zero reach into typed Premium data.

---

## 삼합 (three-branch combine)

1. **Calculated?** Yes, but **intra-chart only**. `chartHasAllBranches(chart, fullGroup)` (`chartContext.ts:83-88`) takes a single `ChartContext` — it checks whether one person's own 4 branches (as a set) contain all 3 members of a trio group. No cross-chart version exists (e.g. 2 branches from A + 1 from B forming a trio is never checked).
2. **Pillars compared:** Presence-only within one person's own branch set — not pillar-position-specific at all.
3. **Implementation:** `lib/saju/analyzeRelations.ts:82-114` (`analyzeTrioCombines`, `relationType: "branch_three_combine"`), trio groups defined in `chartContext.ts:72-81` (`TRIO_BRANCH_GROUPS`, 4 real trios: 신자진/해묘미/인오술/사유축). Reference data: `relation_type: "branch_three_combine"`, 8 rows confirmed present.
4. **Reaches typed Premium data?** No — same path as 천간합 (`relation_dynamics` → legacy digest only).
5. **Preserves exact pair/position/interpretation?** No pillar-position by construction (branch-presence check, not a pillar-pair check); same `codes: []` truncation at the typed per-person layer.

**Verdict: ABSENT** as a cross-chart interaction.

---

## 방합 (directional/seasonal combine)

Structurally identical to 삼합 — same function (`analyzeTrioCombines`), `relationType: "branch_direction_combine"`, `chartContext.ts` groups for the 4 seasonal trios (인묘진/사오미/신유술/해자축). Reference data: `relation_type: "branch_direction_combine"`, 8 rows confirmed present. Same intra-chart-only limitation, same non-reach into typed data, same `codes: []` truncation.

**Verdict: ABSENT** as a cross-chart interaction, for the same reasons as 삼합.

---

## 충, 형, 파, 해 (clash, punishment, break, harm)

1. **Calculated?** Yes, cross-chart (A×B).
2. **Pillars compared:** All 8 combined pillars — same `analyzeCrossChartRelations` function as 육합, full 4×4=16.
3. **Implementation:** `lib/saju/pairChartAnalysis.ts:99-135`, same function as above; palace weighting at `lib/saju/palaceWeight.ts:1-33` (day-pillar 1.0 / month 0.75 / hour 0.45 / year 0.4 — explicitly commented "in romantic interpretation, day/month-pillar signals prioritized").
4. **Reaches typed Premium data?** **Yes** — via `resolveCrossChartTension` (`relationshipDynamics.ts`) → `RomanticDynamicsTypedSnapshot.crossChartTension` (`romanticContextInput.ts`) → `romanticCrossChartTensionCanonical.ts` → `canonical_projections.cross_chart_tension` → read by `projectConflictPattern.ts` as evidence + a confidence input for Conflict Translation. DEV-verified end to end this session.
5. **Preserves exact pair/position/interpretation?** **Partially.** The raw `CrossChartHit` (as computed) has full detail per #4 of the 육합 entry above. But the typed canonical this reaches collapses everything to `{ band: "high"|"moderate"|"none", dominant_type: "충"|"형"|"파"|"해"|null, hit_count: number }`. Exact pillar positions (which pillar of A vs which of B), the interpretation sentence, and the numeric priority/palaceWeight/confidence are all discarded at the point of typing — only an aggregate band, one "dominant" type label, and a raw count survive. Additionally, `analyzeCrossChartRelations` itself only records the *first* matching type per pillar-pair (`break` after first hit in `PAIR_BRANCH_TYPES` order) — if a single branch pair theoretically satisfied two of the five rule types, one would be silently dropped.

**Verdict: SUPPORTED** for calculation, pillar coverage, and typed reach. **PARTIAL** on exact-pair/position/interpretation preservation — it's a lossy aggregation, not a structured pass-through.

---

## 원진 (Wonjin) / 귀문 (Guimun)

1. **Calculated?** Two separate, non-overlapping implementations exist:
   - **Intra-chart** (per-person): `detectIntraChartPairSignal(chart, isWonjin/isGuimun)` in `lib/personCore/mappers/mapSajuMasterJson.ts:113-127` — checks one person's own 4 branches against each other, feeds `special_signals.wonjin/guimun`.
   - **Cross-chart** (A×B): real, reusable functions exist — `isWonjin`/`isGuimun` atomic pair checks plus `detectFriendWonjinGuimun` / `detectMarriageWonjinGuimun` / `detectFamilyWonjinGuimunBranches` / `detectMonthWonjinGuimun` wrappers, all in `lib/saju/workPairRiskSignals.ts:55-192`. **None of these cross-chart wrappers has a romantic call site.** Repo-wide grep confirms: `detectMarriageWonjinGuimun` → only `marriageAnalysis.ts:287`; `detectFriendWonjinGuimun` → only `friendAnalysis.ts:166`; `detectFamilyWonjinGuimunBranches` → only `familyAnalysis.ts:186`. No romantic file imports any of them.
2. **Pillars compared** (for the cross-chart functions, even though romantic never calls them): a curated subset, not all 8. E.g. `detectMarriageWonjinGuimun` checks day×day, hour×hour, day×hour, hour×day, plus month×month (`includeMonthCheck`) — year pillar is never checked by any wrapper.
3. **Implementation:** `lib/saju/workPairRiskSignals.ts:55-192` (cross-chart machinery, unused by romantic); `mapSajuMasterJson.ts:113-127` (intra-chart, romantic's only path).
4. **Reaches typed Premium data?** The intra-chart flags reach only the legacy digest (`romanticSajuPromptDigest.ts:102-105`, `m.special_signals`). The cross-chart A×B functions reach **nothing** in the romantic pipeline at all — not even the digest.
5. **Preserves exact pair/position/interpretation?** Intra-chart flags are boolean-only with a short evidence-string array (e.g. `"ja-myo"`, or `"shinsal:원진살"`) — no pillar-slot label, no interpretation sentence, no strength gradient; it's a flat true/false.

**Verdict: ABSENT** for romantic cross-chart use. The cross-chart machinery exists (built for Marriage/Friend/Family) but is never invoked for Romantic; only a same-person intra-chart variant reaches the romantic digest.

---

## Other meaningful cross-chart combinations

`lib/hardcoded/sajuReferenceData.ts` defines exactly 8 `relation_type` values, confirmed exhaustively (`grep -o` across the whole file): `branch_break`, `branch_clash`, `branch_direction_combine`, `branch_harm`, `branch_punishment`, `branch_six_combine`, `branch_three_combine`, `stem_combine`. There is no 9th category — no stem-clash table, no hidden-stem cross-combine, nothing else exists in the reference data. The six items above are the complete universe; nothing was skipped.

One more genuinely cross-chart function worth naming: **공망 (void) cross-hit** — `detectGongmangCrossHit(chartSelf, chartOther)` (`workPairRiskSignals.ts:154-180`) checks whether one person's void branches land on the other's month/day branch. It's real and cross-chart, but has zero romantic call site (only `familyAnalysis.ts`, `workPairAnalysis.ts`, `marriageAnalysis.ts` use it).

**Verdict: ABSENT** for romantic (the function exists for other domains only).

---

## 격국 (structure/pattern classification), per individual chart

1. **Calculated?** **No** — confirmed by direct grep for the literal string `"격국"` across all of `lib/`. Every hit is one of two things:
   - **Explicit bans**: every domain's LLM prompt-writing-rules file (`romanticSajuDeep/selfRefine.ts:43`, `essenceJournalWritingRules.ts:37`, `essenceActionWritingRules.ts` for romantic/married/business/family/friend, and the corresponding `system.ts`/`user.ts` files) explicitly forbids the word "격국" from ever appearing in output — confirming it's a known concept the product deliberately keeps out of user-facing text, not a hidden computed value.
   - **An informal, explicitly-disclaimed stand-in used in other domains, never Romantic**: `lib/relationship/workColleague/officeLanguage.ts:13-16` labels a Work-domain concept "격국(월주 기준)" but its own comment states: *"이는 명리학적으로 격국을 정하는 정식 방법이 아니다"* ("this is not the formal/proper method of determining 격국 in Mingli theory") — it's just the dominant Ten-God category of the month pillar, informally relabeled. `friendSajuCompareTable.ts:120` and `marriageSajuCompareTable.ts:95` similarly comment *"격국과 같은 원리"* ("same principle as 격국") for an analogous 5-category dominant-pick, again explicitly flagged as an analogy, not real 격국 methodology. **Romantic has no equivalent of even this informal stand-in** — `extractRomanticSignals.ts` contains no such logic.
   - No file anywhere computes 격국 by actual Mingli methodology (day-master strength + month-command + officer/wealth/output pattern rules, 종격 conditions, etc.).
2. **Reaches the Romantic pipeline?** N/A — there is nothing to reach, for any domain, in any form resembling real 격국.

**Verdict: ABSENT.** Not partially built, not informally approximated for Romantic (unlike Work/Friend/Marriage's disclaimed stand-ins) — genuinely does not exist for this domain.

---

## Summary table

| Interaction | Cross-chart calculated? | Pillars | Reaches typed Premium data | Preserves pair/position/confidence/interpretation | Verdict |
|---|---|---|---|---|---|
| 천간합 (incl. 丁壬合) | No — intra-chart only | Intra-chart, all 4 own pillars | No (legacy digest only) | No (`codes: []` always) | **ABSENT** |
| 지지 육합 | Yes | All 8 (4×4) | No (filtered out of the one typed connection that exists) | Yes at raw layer, N/A downstream | **PARTIAL** |
| 삼합 | No — intra-chart only | Intra-chart, branch-presence only | No | No | **ABSENT** |
| 방합 | No — intra-chart only | Intra-chart, branch-presence only | No | No | **ABSENT** |
| 충/형/파/해 | Yes | All 8 (4×4) | **Yes** (`cross_chart_tension` → Conflict Translation) | Partial — lossy aggregate only (band/type/count) | **SUPPORTED**, partial on #5 |
| 원진/귀문 | Machinery exists, not called by Romantic | N/A for romantic; curated subset (not year) where it *is* used elsewhere | No | No (boolean + short evidence strings) | **ABSENT** |
| 공망 cross-hit | Machinery exists, not called by Romantic | N/A for romantic | No | N/A | **ABSENT** |
| 격국 | Does not exist for any domain in real form; not even Romantic's informal stand-in | N/A | N/A | N/A | **ABSENT** |
