# FRIEND — New Chapter Forensic Audit: "이 친구와 함께하면 내 세계는 어떻게 넓어질까"

Status: **READ-ONLY AUDIT — no code, UI, or data changed.** Date: 2026-08-27.

Scope: determine whether current Saju CE/SSOT, canonical facts, and Psych 11 data legitimately
support a new Friend chapter about resources/expertise, opportunity/network, practical help,
perspective expansion, and the shadow cost of that expansion — **before** any design or
implementation work.

---

## A. Executive verdict

**CH5_VIABLE_WITH_LIMITS**

The proposal as written (5 pillars: knowledge_expertise, practical_resource, opportunity_network,
action_momentum, perspective_expansion) is **not** viable as a single new chapter — 3 of its 5
pillars already exist almost verbatim elsewhere in the Friend domain (see §H). But a **much
smaller slice** of the proposal — practical resourcefulness, directionally assigned, with a
strength→shadow chain — is genuinely new, has real deterministic evidence behind it, and can be
built by reusing patterns already proven in this codebase (the treasurer/travel-planner
Saju+Psych composite-scoring pattern). See §P for the concrete recommendation.

---

## B. Current CE/SSOT evidence inventory

There are **two parallel canonical-fact stacks** in this codebase. This matters more than any
single fact: most of the "expansion-adjacent" data already exists, but in the stack that never
reaches a Friend report.

### B1. The thin, live Friend stack (what actually ships today)

Path: `lib/saju/pairChartAnalysis.ts` → `lib/relationship/friend/buildFriendRuleContext.ts` →
`lib/relationship/friend/canonical/*`.

| Fact | File / function | Field | Deterministic? |
|---|---|---|---|
| Day stem | `lib/saju/chartContext.ts` | `chart.dayStemCode` | Yes (no dedicated `DayMasterFact`) |
| Dominant/weakest element | `lib/saju/elements.ts:53-68` `countElements`, `pairChartAnalysis.ts:72-84` | `CanonicalPersonalSajuFacts.dominantElement/weakestElement/elementCounts` | Yes — **excludes hidden stems, no seasonal weighting** (documented in-code) |
| Day-master strength label | `pairChartAnalysis.ts:396-419` | `CanonicalPersonalSajuFacts.strength.label` (신강/신약) | Yes, heuristic-tier |
| Raw Ten God counts | `lib/saju/repository.ts:110-112` (`calculateTenGod`, table-driven) | `CanonicalPersonalSajuFacts.tenGods: Record<string, number>` (Korean keys, day pillar excluded) | Yes |
| Pair relation booleans | `pairChartAnalysis.ts:120-305,421-497` (`analyzeCrossChartRelations`, `extractCanonicalPairFacts`) | `CanonicalPairSajuFacts`: `hasWonjin/hasGuimun/hasChung/hasHyung/hasPa/hasHae/hasClash/hasDayBranchCombine/hasDayBranchChungHyung/hasYeokma/elementSupport{aToB,bToA}` | Yes, binary presence/absence only, no confidence field |
| Johu (climate) heuristic | `lib/saju/friendAnalysis.ts:129-149` | feeds `FriendScoringSignals.hasJohuComplement` (score input only, not a narrative fact) | Heuristic |
| `FriendshipSajuSignals.johu_profile` / `.year_month_palace` | `lib/personCore/sajuSignals/extractFriendshipSignals.ts:33,66-71` | Computed but **never read downstream** — dead field | N/A |

**Not present anywhere in this stack:** hidden stems, rootedness/통근, 12운성, gongmang, real
johu scores (only a 3-state heuristic band feeds scoring, not prose).

### B2. The rich, evidence-tagged stack (exists, not wired into Friend)

Path: `lib/personCore/individualSaju/*`, `lib/personCore/personalContextEngine/*`,
`lib/relationship/domainLenses/*`. Confirmed consumers: only the `/dev/relationship-enrichment-review`
dev tool and Romantic's `prototypeV4`/`v1/slim`. **Zero imports from any file under
`lib/relationship/friend/`.**

| Fact | Type / builder | Confidence tier | Friend-wired? |
|---|---|---|---|
| Five elements, hidden-stem-weighted | `FiveElementsFact` (`individualSaju/types.ts:112-120`), `buildFiveElements` | `"deterministic"` | No |
| Day master | `DayMasterFact` (`types.ts:102-108`) | deterministic | No |
| Rootedness (통근) | `RootednessFact` (`types.ts:145-159`), `buildRootedness` — `rootedness_index`, `strong_stage_slots` | `"high"` | No |
| Hidden stems | `HiddenStemFact[]` (`types.ts:78-86`), backed by `REF_HIDDEN_STEMS` reference table | deterministic | No |
| Johu climate scores | `JohuClimateSnapshot` (`sajuMaster.ts:27-45`), `JohuFact` | `"heuristic"` (explicitly downgraded) | No |
| Resourcefulness | `resource_governance` (`personalContextEngine/types.ts:90`, `selectPersonalInnate.ts:1107-1172`) — `"diligent_steward" \| "opportunity_investor" \| "flexible_distributor" \| "mixed_balanced_investor" \| "neutral_unspecified"`, from 정재/편재 presence, carries `confidence`, `evidence_summary`, `contributing_sources` | tagged, rigorous | **No — Romantic-only** |
| Ten-God × domain expression | `TEN_GOD_LENS_MATRIX` (`domainLenses/tenGodLensMatrix.ts`, 694 lines) — per-god `healthy_expression`/`tension_expression`/`counterpart_experience`/`corroborating_evidence_required`/`prohibited_standalone_claims`, per **domain** (`partner/family/friend/work/romantic`) | prose, no numeric confidence; `corroborating_evidence_required` is an unenforced label list | Dev-tool only |

**Key finding:** `TEN_GOD_LENS_MATRIX` already models "expertise/resource/opportunity/network" as
Ten-God expressions — but scoped to the **`work`** domain (e.g. 식신.work = "탁월한 전문성과
장인정신", 편재.work = "시장 기회 포착·BD", 정인.work = "멘토링, 지식 자산화"). The **`friend`**
domain rows for the same gods are much thinner and not built for this purpose (정관.friend
mentions "사회적 네트워크" only as a side clause; 편재.friend is about spending scale; 편인.friend
is about "독특한 세계관" + a ghosting shadow). None of this is reachable from a live Friend report
regardless.

**Two independent copies of the same taxonomy** exist and could drift: `TenGodCategory` in
`lib/personCore/individualSaju/types.ts:24-29` vs. the wealth/officer/food/seal/self grouping in
`lib/relationship/marriage/marriageTenGodAnalysis.ts:51-83` (`profileTenGods`). Neither is Friend's
own — Friend currently has no domain-scoped five-family grouping at all; it works off raw Korean
ten-god-name counts directly (see the bug below).

**Bug found in passing (not part of this audit's scope, flagged for a separate fix):**
`buildFriendCanonicalEngine.ts:157` computes `tenGodsA.food + tenGodsA.bi_gyeon` —
`bi_gyeon` is not a valid key of the Korean-keyed `TenGodCounts` map (real keys are `"비견"`,
`"겁재"`, etc.), so this term is always `undefined`/0. Any future capability that reuses this
line's pattern must use the real Korean keys or route through a proper category-grouping helper
instead of ad hoc string concatenation.

---

## C. Traditional Myeongri evidence map

### C-A. Knowledge / expertise
Strongest chain available: raw seal-family (인성: 정인+편인) Ten-God count, already present in
Friend's raw `tenGods` map. No scored/confidence-tagged "knowledge contribution" fact exists for
the friend domain — `TEN_GOD_LENS_MATRIX`'s expertise language is `work`-scoped and unwired
regardless. **Verdict: PARTIALLY_SUPPORTED as evidence, but semantically near-identical to CH2's
existing `strategic_direction` capability** (see §H) — "판단과 방향을 정리해주는 사람" already
covers most of what "지식/전문적 관점을 제공한다" would say. Building this as a *new* pillar risks
DUPLICATE more than it risks lack of evidence.

### C-B. Practical resourcefulness
Strongest chain available, full stop: `resource_governance` (재성 정재/편재-based, confidence +
evidence + contributing_sources already attached) exists and is rigorous — it's simply not
plumbed into Friend. The underlying ingredient (wealth-family ten-god count) is already present
in Friend's raw `tenGods` map today; only the interpretation layer needs porting/rebuilding for
this domain. **Verdict: SUPPORTED, and the single best-evidenced candidate in the entire brief.**

### C-C. Opportunity / network
Weakest structured evidence of the five. No scored fact exists anywhere. The only textual
precedent (정관.friend "사회적 네트워크의 든든한 조력자", 편재.friend hosting/spending scale) lives
in the dead `TEN_GOD_LENS_MATRIX` branch. Raw ingredients that *do* live in the current Friend
pipeline and could theoretically be assembled into this someday: `hasYeokma` (역마, live pair
boolean) + `energy_style` (psych, live) + wealth-family count (live). But nobody has assembled
them into a dimension, and doing so is new-fact construction, not re-exposure.
**Verdict: UNSUPPORTED as a scored fact today; genuinely open territory, but expensive to build
properly and risks a "필요는 있는데 근거가 얇은" (needed but thin) chapter pillar if rushed.**

### C-D. Action momentum
This concept already exists **twice**: as CH2's `action_activation` capability
(`friendCharacterEngine.ts`, "머뭇거릴 때... 확신으로 바꿔 바로 실행하게 돕는 사람") and as
`FriendSupportMode.ACTION_ACTIVATION` / `problemResponse.ACTIVATE` in the **current, already-shipping
Chapter 5** (`friendChapter05Support.ts`, `buildFriendResponseDimensions.ts` — a weighted blend of
`decision_style`/`stimulation` psych axes + 식신 ten-god count). **Verdict: evidence is fine, but
this is DUPLICATE — do not build a third copy of the same concept under a new chapter number.**

### C-E. Perspective / experience expansion
Also already named identically: CH2's `perspective_expansion` capability ("생각이 막혀 있을 때...
넓은 시야와 새로운 관점을 열어주는 사람"), CH1's im/gye day-master attraction copy ("넓은 시야와
수용적인 매력"), and enrichment's `buildUnlockedSelfLine()` ("이 친구와 있으면 내가 어떻게
달라지는가" — the single closest existing analogue to "world expansion," already live).
**Verdict: DUPLICATE across three existing surfaces. This is the single most over-covered concept
in the whole proposal.**

---

## D. Psych 11 contribution map

Confirmed dimension list (exact match to the brief, same order):
`stimulation, self_control, practicality, structure, empathy, conflict_style, resilience,
recognition, energy_style, thinking_style, decision_style` — `lib/v2/survey/types.ts:14-28`.

An explicit, repeatedly-applied convention already governs how psych modifies Saju in Friend
(`friendPsychFit.ts`, documented at line 12-19 as shared with the Work domain's
`officePsychFit.ts`): **Saju sets the base claim and can "lock" it (a min-gap veto); Psych either
(a) confirms/cautions via prose without changing the claim, (b) flips it only past a defined gap
threshold when not locked, or (c) gates whether a psych-only claim is allowed to fire at all** (a
Saju precondition must be true first — e.g. the jealousy-guard note requires 겁재 count ≥ 2 before
`recognition`+`practicality` are even consulted).

The exact machinery for a directional resourcefulness pillar already exists and is proven —
`refineFriendTreasurer` (`friendPsychFit.ts:553-649`): `composite = sajuScore*10 + psychAvg`,
flip only if the psych gap ≥ `PSYCH_FLIP_GAP` (20) and Saju isn't `sajuLocked`
(`|sajuDiff| >= SAJU_TREASURER_LOCK` = 2). This is the *same computation shape* a directional
"who brings more practical resourcefulness" claim would need — just re-target it from
정재\*3+편재\*1-style bill-splitting scoring to a resourcefulness-specific score.

Defensible mappings for the (reduced) proposal:
- `practicality` + `structure` → resourcefulness expression (already precedented via treasurer fit)
- `self_control` / `resilience` → candidate shadow-layer modifiers (gate whether "emotional bypass" note fires)
- `energy_style` / `recognition` → would modify a future opportunity/network claim, once the underlying Saju fact exists — **not usable today**, only a placeholder for later
- `thinking_style` / `stimulation` / `decision_style` → already fully owned by the existing action-momentum and F/T counseling-style patterns; do not reuse for a new pillar

Existing thresholds to reuse rather than invent (per the "no arbitrary thresholds" rule): 60/40 as
the default "meaningfully high/low" single-axis band, ~20-25 as the default "meaningfully
different between two people" gap. Smaller thresholds (8-15) only ever appear layered on top of an
already-triggered base signal (e.g. `TRAVEL_CORRECTION_FLIP` = 12).

A ready-made evidence/confidence framework already exists specifically for Chapters 4-8:
`lib/relationship/friend/response/friendEvidenceTypes.ts` — `EvidenceSource` (includes `PSYCH_11`,
`TEN_GOD`, `CE_SSOT`, `PAIR_CANONICAL` as first-class families), `EvidencePolarity`
(`SUPPORTS/CONTRADICTS/MODIFIES`), `EvidenceStrength` (`PRIMARY/SECONDARY/SUPPORTING`),
`resolveConfidence()` → `HIGH/MEDIUM/LOW`, and `psychEvidence()` which returns `null` (not a
fabricated claim) when an axis is missing. **This should be reused as-is, not reinvented** — see §J.

---

## E. Individual vs. directional vs. emergent inference map

- **Resourcefulness as a PERSON FACT**: supported — this is exactly what `resource_governance`
  already models (an individual trait: "diligent_steward" etc.), just not wired to Friend.
- **Resourcefulness as a DIRECTIONAL PAIR FACT** ("A brings resourcefulness *to* B"): requires a
  receptivity/need signal on B's side. No generic "need for resourcefulness" fact exists in
  Friend, but the *treasurer/travel-planner* logic already solves an equivalent problem (comparing
  both people's Saju+psych scores and assigning the *relative* role via composite/lock/flip) — so
  this is **PARTIALLY_SUPPORTED via direct reuse of an existing, proven pattern**, not something
  that needs to be invented from scratch.
- **Opportunity/network as any tier**: not supported at any tier today — no PERSON, DIRECTIONAL,
  or EMERGENT fact exists; would be entirely new construction.
- **Knowledge/expertise as any tier**: PERSON-tier only, and weak (raw seal count, no scoring) —
  and largely redundant with CH2's `strategic_direction` regardless of tier.

---

## F. Network / "인복" forensic findings

Grep across the entire Friend domain for `network`, `resource` (as a field name),
`expertise`, `opportunity`, `connector`, `인복` returned **zero hits** for
`network`/`opportunity`/`connector`/`인복` as structured concepts. The three sub-concepts the
brief asked to be kept separate:

1. **Network breadth** ("사람을 넓게 연결하는가?") — UNSUPPORTED. No structured fact anywhere;
   only unwired prose (정관.friend, 편재.friend).
2. **Relationship depth/retention** ("관계를 오래 유지하는가?") — this is **already CH8's entire
   subject** (`friendChapter08Distance.ts`: baseline distance, silence interpretation, maintenance
   minimum, disengagement signals, "how it lasts") plus `buildDistanceResilienceLine()` (역마 +
   recognition/resilience psych). Building this under a new chapter would be DUPLICATE of CH8, not
   new territory.
3. **Support reciprocity** ("도움을 주고받는 관계가 형성되기 쉬운가?") — PARTIAL_OVERLAP with the
   *current* Chapter 5 (`friendChapter05Support.ts`'s `whatIGive[]` directional support +
   `mismatch`), which already models directional giving/receiving of support.

**None of the three 인복 sub-concepts is free of an existing owner.** Breadth is the only one with
no current chapter claim on it, but it also has the weakest evidence of the three by a wide
margin — it would need genuinely new fact construction (see §N), not a re-framing of something
that already exists.

---

## G. Strength → shadow evidence chains

Auditing each proposed shadow against the "must originate from the same evidence chain as the
strength" rule:

| Strength | Proposed shadow | Verdict | Why |
|---|---|---|---|
| Network expansion | Social fatigue/obligations | **LOW_EVIDENCE — omit** | The strength itself (network) has no evidence yet; a shadow can't be chained to a claim that doesn't exist |
| High action momentum | Acting before reflection | **WRONG_CHAPTER** | Action momentum is owned by CH2/current-CH5; this shadow, if built, belongs as an *addition* to CH2's existing (currently shadow-free) `action_activation` entry, not a new chapter |
| High practicality (resourcefulness) | Emotional needs skipped | **PARTIALLY_SUPPORTED — the strongest chain in the whole audit** | Wealth-family ten-god dominance (live raw count) + a **weak** day-master strength label (`CanonicalPersonalSajuFacts.strength.label`, already live in Friend today) together are the traditional 재다신약-style signature for "resource-forward but self/emotionally under-supported." Both halves of this chain are already deterministic, live facts in the current Friend pipeline — nothing needs to be ported for this one, only assembled. |
| High expertise/advice | Decision dependency | **LOW_EVIDENCE — omit** | Expertise pillar itself is unsupported as a scored fact (see §C-A) |
| High novelty/expansion (perspective) | Instability/overstimulation | **WRONG_CHAPTER** | Perspective expansion is owned by CH1 + CH2; belongs there, not a new chapter |
| High loyalty | Boundary difficulty | **WRONG_CHAPTER** | Loyalty/boundary is CH7's entire subject (plus CH2's `structure_boundaries`); not one of the five proposed pillars anyway |

**Only one shadow chain in the entire brief survives**: resourcefulness (wealth-family dominance)
→ weak day-master strength → emotional bypass. Everything else is either evidence-starved or
belongs to a chapter that already owns it.

---

## H. Existing chapter duplication matrix

Two numbering systems coexist and must not be confused: the **canonical story plan**
(`ch01_why_us` … `ch09_action_playbook`, defined in `friendStoryPlanTypes.ts`, actually rendered)
and the **"VNext" engine files** `friendChapterXX*.ts` numbered 04-08, which map 1:1 onto
`ch04`-`ch08`. **The file literally named "Chapter 5" (`friendChapter05Support.ts`) already
renders `ch05_communication_third_person`** — counseling style (F/T) and third-party/group
exclusion dynamics. Inserting a new "Chapter 5" without renumbering is a direct naming collision,
independent of any content-overlap question.

| Proposed CH5 concept | Existing owner | Classification |
|---|---|---|
| Knowledge / expertise | CH2 `strategic_direction` (`friendCharacterEngine.ts`) | PARTIAL_OVERLAP |
| Practical resourcefulness | *(none — `resource_governance` exists but is Romantic-only)* | **UNIQUE** |
| Opportunity / network | *(none, but also no real evidence — see §F, §C-C)* | UNIQUE but evidence-starved |
| Action momentum | CH2 `action_activation` **and** current-CH5 `ACTION_ACTIVATION`/`problemResponse.ACTIVATE` | **DUPLICATE (twice over)** |
| Perspective expansion | CH2 `perspective_expansion` (literal name match) **and** CH1 im/gye attraction copy **and** enrichment's `buildUnlockedSelfLine()` | **DUPLICATE (three times over)** |
| Network breadth (인복 split #1) | *(none)* | UNIQUE, weak evidence |
| Relationship depth/retention (인복 split #2) | CH8 (`friendChapter08Distance.ts`) | **DUPLICATE** |
| Support reciprocity (인복 split #3) | Current CH5 (`whatIGive[]`/`mismatch`) | PARTIAL_OVERLAP |

Also structurally relevant: `friendCharacterEngine.ts`'s `bamboo/business/brain` "guardian gift"
system (`friendGiftAndBondInsights.ts`/`friendPsychFit.ts`, rendered in CH2) already includes a
`business` archetype described almost word-for-word as the proposed "practical resourcefulness"
concept: *"Practical, resourceful, and always has a plan to make things happen — the friend who
turns ideas into results."* Any new resourcefulness pillar must be diffed against this copy
specifically to avoid restating it under a different label (rule 7/8's "no reusing CH2 copy" is
directly at stake here, not hypothetically).

---

## I. Proposed canonical taxonomy verdict

```
type FriendLifeExpansionCapability =
  | "knowledge_expertise"     // PARTIALLY_SUPPORTED evidence, but DUPLICATE of CH2 strategic_direction
  | "practical_resource"      // SUPPORTED — the one legitimate new pillar
  | "opportunity_network"     // UNSUPPORTED as a scored fact; real ingredients exist unassembled
  | "action_momentum"         // Evidence fine, but DUPLICATE (CH2 + current-CH5) — chapter-invalid
  | "perspective_expansion";  // Evidence fine, but DUPLICATE (CH1 + CH2 + enrichment) — chapter-invalid
```

```
type FriendNetworkPattern =
  | "broad_connector"        // UNSUPPORTED
  | "deep_retainer"          // Evidence exists but owned by CH8 — chapter-invalid here
  | "selective_network"      // UNSUPPORTED
  | "high_social_mobility"   // UNSUPPORTED (would need 역마+편재+energy_style assembled — not built)
  | "support_reciprocity"    // PARTIALLY_SUPPORTED but owned by current CH5 — overlap
  | "LOW_EVIDENCE";          // The realistic default for most pairs today
```
**Recommendation: do not build this second taxonomy layer yet.** Nearly every entry is either
unsupported or owned elsewhere; adding a whole enum tier that mostly resolves to `LOW_EVIDENCE` or
duplicate-ownership invites exactly the "generic positive fallback" failure mode the brief
prohibits. Fold the one real signal (support reciprocity) back into the existing CH5, don't
duplicate it.

```
type FriendExpansionShadow =
  | "social_overload"        // LOW_EVIDENCE (chained to unsupported network capability)
  | "decision_dependency"    // LOW_EVIDENCE (chained to unsupported expertise capability)
  | "overactivation"         // WRONG_CHAPTER — belongs on CH2's action_activation entry
  | "emotional_bypass"       // PARTIALLY_SUPPORTED — the one legitimate chain (see §G)
  | "instability"            // WRONG_CHAPTER — belongs on CH1/CH2 perspective content
  | "boundary_load"          // WRONG_CHAPTER — CH7's subject
  | "NONE" | "LOW_EVIDENCE"; // Correct default for the rest
```

**Better taxonomy, grounded in what's actually supported today:**
```
type FriendPracticalContributionCapability = "resourcefulness" | "LOW_EVIDENCE";
type FriendPracticalContributionShadow = "emotional_bypass" | "NONE" | "LOW_EVIDENCE";
```
This is smaller than the brief's proposal, but everything in it is real, live, and traceable —
which is the actual bar the brief sets.

---

## J. Evidence gating recommendation

Do not invent a new STRONG/MODERATE/WEAK/LOW_EVIDENCE ladder — `friendEvidenceTypes.ts` already
provides exactly this for Chapters 4-8 and should be reused verbatim:

- `resolveConfidence(evidence: EvidenceRef[])` → `HIGH` (2+ distinct evidence-family types agree,
  no contradiction) / `MEDIUM` (1 strong family, no contradiction) / `LOW` (contradiction,
  supporting-only evidence, or no evidence — `evidence.length === 0` is an immediate `LOW`).
- `psychEvidence()` already returns `null` rather than fabricating a claim when a psych axis is
  missing — the exact "no evidence → no claim" behavior the brief requires, already built.
- The existing precedent for the omission behavior itself is already in production copy:
  `friendChapter05Support.ts:66` has a literal `// LOW_EVIDENCE` comment gating a fallback to
  conservative wording instead of a fabricated behavioral claim.

Map: `STRONG≈HIGH`, `MODERATE≈MEDIUM`, `WEAK`/`LOW_EVIDENCE≈LOW`, and treat `LOW` as the
omit-trigger, consistent with existing behavior elsewhere in Chapters 4-8 — not a new rule
invented for this chapter.

---

## K. Recommended final IA

Given the findings, the IA in the brief (§10 of the task) should be **reduced**, not built as
proposed:

- **◤ 이 친구가 내 삶에 열어주는 것** — render **only** the directional resourcefulness claim
  (giver assigned via the treasurer-style composite/lock/flip pattern), confidence-gated via
  `resolveConfidence()`. Do not attempt knowledge/expertise or perspective-expansion content here
  — they belong to CH2 and would either duplicate it or need to visibly diverge from it, and no
  current evidence supports the divergence.
- **◤ 이 친구의 관계 세계** — **omit entirely for this release.** No network-breadth fact exists;
  rendering this section would force either a fabricated claim or near-universal `LOW_EVIDENCE`,
  neither acceptable per the brief's own rules.
- **◤ 함께할수록 생기는 확장의 그림자** — render **only** when the resourcefulness claim fired AND
  the giver's day-master strength label is weak (신약). This is the one shadow chain with a real
  evidence trail (§G). All other shadow candidates should be omitted, not softened into generic
  caution language.
- The chapter's **numbering must be resolved first** — either place this content as a new
  sub-section *inside* the existing CH2 (`ch02_who_we_are`, since it's a directional-role
  extension, not a new user question) rather than a new top-level chapter, or renumber the
  existing `ch05_communication_third_person` onward and insert this as a genuinely new `ch05`.
  Given how thin the surviving content is (one claim + one conditional shadow), the CH2-extension
  path is the more honest fit — a whole new chapter slot for one directional claim risks feeling
  padded.

---

## L. Sera × 동글 proof trace

Data pulled by actually running the production pipeline (`calculateSajuBundle` →
`buildFriendCanonicalEngine`/`buildFriendReportEnriched`), from `tests/unit/friend-ch1-ch2-architecture.test.ts`
(the authoritative fixture — several `scratch/*.mjs` scripts reuse these names for an unrelated
Family-domain scenario with different birth dates; verified not to confuse the two).

**Sera** (1993-05-15, 12:00 default time): Year 계유 / Month 정사 / Day **병신** / Hour 갑오 →
**Day Master 병 (Byeong) = Yang Fire**. Elements: fire 4 (dominant), earth 0 (weakest), wood 1,
metal 2, water 1. Non-self-pillar Ten Gods: 정관×1, 겁재×1, 편인×1. Strength: 신강 (strong).
**Wealth-family (재성) count: 0.**

**동글/Donggeul** (1994-12-15, 12:00 default): Year 갑술 / Month 병자 / Day **을해** / Hour 임오 →
**Day Master 을 (Eul) = Yin Wood**. Elements: water 3 (dominant), metal 0 (weakest), wood 2,
fire 2, earth 1. Non-self-pillar Ten Gods: 겁재×1, 상관×1, 정인×1. Strength: 신강 (strong).
**Wealth-family (재성) count: 0.**

⚠️ **Discrepancy vs. old memory note confirmed and precisely characterized.** The prior assumption
(Sera=丁火/Yin Fire, 동글=甲木/Yang Wood) disagrees with current production output on **Yin/Yang
polarity on both sides simultaneously** (丙↔丁, 甲↔乙 are each other's polarity-sibling stems) while
agreeing on the base element for each person. This is exactly the shape a stem-index/polarity
mapping bug would produce — consistent with, but not proof of, the previously-investigated
"생년월일 오염" incident. This audit cannot determine which value set is the "true" original; it
only confirms today's production code outputs the polarity-swapped version, not the old assumption.

**Pair facts** (`buildFriendCanonicalEngine.ts` output): `hasChung: true, hasHyung: true,
hasPa: true, hasHae: true, hasClash: true, hasDayBranchCombine: false,
hasDayBranchChungHyung: true, hasYeokma: false, elementSupport: {aToB: false, bToA: false}`. This
is a heavily clash-dense pair (Sera's day branch 신/Monkey vs. 동글's 해/Pig is a classic 육해
Six-Harms pairing) with **no mutual element generation in either direction**.

**Psych 11**: fixture supplies only 5/11 axes per person (Sera: thinking_style 68, practicality 62,
empathy 58, structure 60, stimulation 50; 동글: empathy 72, resilience 65, structure 58,
thinking_style 48, stimulation 45) — the other 6 are genuinely absent, not zero. This is a fixture
limitation (a real user completing the 10-question survey would have all 11); it should not be
read as evidence about typical real-user coverage, only as a valid stress-test of the omission
path.

### Claim-by-claim trace

| Claim | Person fact | Pair fact | Psych modifier | Confidence | Result |
|---|---|---|---|---|---|
| Resourcefulness (either direction) | Wealth-family count = 0 for **both** | — | `practicality`/`structure` present for both, but nothing to modify | evidence.length effectively 0 for the base claim | **LOW_EVIDENCE — OMIT** |
| Knowledge/expertise (seal-family) | 1 seal-family hit each (편인×1 / 정인×1) | — | `thinking_style` present for both | Single ambiguous signal = WEAK tier | **WEAK — omit or heavily hedge, not a headline claim** (and would duplicate CH2 regardless) |
| Opportunity/network | Sera has 정관×1 (unwired prose only); 동글 has none; `hasYeokma: false` | `hasYeokma: false` | `energy_style`/`recognition` **missing for both** | No scored fact exists; psych modifiers unavailable | **LOW_EVIDENCE — OMIT** |
| Emotional-bypass shadow (resourcefulness → shadow) | Both 신강 (strong), not weak; wealth count 0 for both | — | `self_control`/`resilience` — 동글 has resilience 65, Sera missing it | Precondition (wealth dominance + weak strength) not met | **LOW_EVIDENCE — OMIT** (the one otherwise-legitimate chain doesn't fire for this specific pair) |

**For this specific pair, every Chapter 5 candidate claim resolves to LOW_EVIDENCE — OMIT**, per
the brief's own definition of a successful outcome (§11: "That is a successful result"). This also
surfaces a broader, honest signal about this pair independent of the new chapter: heavy
clash-density with no element support is CH6 (Conflict) territory, not expansion territory — the
proof case argues against forcing an "expansion" narrative onto every pair, which is itself useful
validation that the gating design is doing its job rather than a defect in the audit.

**Bug found while running this trace (out of scope, reported not fixed):**
`buildFriendCanonicalEngine.ts:158-165` calls `resolveReconciliationScript(psychMasterA,
psychMasterB, nameA, nameB, ..., locale)` but `resolveReconciliationScript`
(`friendPsychFit.ts:672-676`) only accepts 3 params `(psych, nickname, locale)`. This positional
mismatch produces literal `"[object Object]에게는..."` output in the generated report for this
(and every) pair, and silently forces Korean regardless of requested locale. This is unrelated to
the CH5 evidence question and was not touched — flagging for a separate fix.

---

## M. Claims that MUST NOT be made

Per the brief's non-negotiable rules, reinforced by what this audit actually found:

1. No wealth inference from 재성 (a 0-count 재성 must render as "no resourcefulness signal," never
   softened into "돈은 없지만 마음은 부자" style filler).
2. No occupation inference from 관성/인성.
3. No intelligence ranking from 인성/식상 counts.
4. No "인복" score or label, in any of its three sub-senses (breadth/depth/reciprocity).
5. No "socially unlucky" framing for a clash-dense, low-element-support pair like Sera×동글 — that
   belongs to CH6 (Conflict), not a verdict rendered here.
6. No reuse of CH1's im/gye attraction copy, CH2's `strategic_direction`/`action_activation`/
   `perspective_expansion` copy, or the `business`/`brain`/`bamboo` guardian-gift copy under a new
   label.
7. No reuse of current-CH5's `ACTION_ACTIVATION` copy under a new chapter number.
8. No generic positive fallback when resourcefulness evidence is absent (as it is for this proof
   pair) — the correct behavior is omission, already validated above.
9. No claim built on `TEN_GOD_LENS_MATRIX`'s `friend`-domain prose as if it were a scored fact —
   it is hand-written narrative copy in a dev-only branch, not evidence.
10. No "well-connected"/"high-status"/"lucky friend"/"rich friend"/"professional-class"
    equivalents in any English rendering (see §N below on this specifically).

---

## N. Missing canonical facts

- **Network breadth** as a scored dimension — does not exist in any form; would need new
  construction (candidate ingredients: `hasYeokma` + `energy_style` + wealth/officer-family
  counts, none currently assembled together).
- **Receptivity/need facts** for directional pair inference beyond treasurer/travel-planner — no
  generalized "B needs X" signal exists; each new directional claim currently has to build its own
  composite-scoring instance rather than pull from a shared receptivity layer.
- **Rootedness (통근)** is not wired to Friend at all — would sharpen any future expertise/
  resourcefulness shadow chain beyond the simple strength-label check used in §G.
- **Hidden-stem-weighted element/ten-god counts** are not wired to Friend — the live stack's raw
  counts are surface-only per the in-code documentation.
- **도화/사회적 이동성 (social mobility/charm-star)** is not canonicalized anywhere in this codebase.

---

## O. Exact files/functions that would need modification (IF later implemented, reduced scope)

- `lib/relationship/friend/canonical/friendCanonicalTypes.ts` — add the reduced
  `FriendPracticalContributionCapability`/`...Shadow` types from §I.
- `lib/relationship/friend/canonical/buildFriendCanonicalEngine.ts` — wire a proper wealth-family
  ten-god grouping (do not reuse the broken `tenGodsA.bi_gyeon` line at 157) + read the existing
  `strength.label` field for the shadow gate.
- `lib/personCore/personalContextEngine/selectPersonalInnate.ts` — extract `resource_governance`'s
  scoring logic into a shared helper usable by both Romantic and Friend, rather than duplicating it.
- `lib/relationship/friend/friendPsychFit.ts` — reuse the `SAJU_*_LOCK`/`PSYCH_FLIP_GAP`/
  `COMPOSITE_MARGIN` pattern from `refineFriendTreasurer` for directional resourcefulness-giver
  assignment.
- `lib/relationship/friend/response/friendEvidenceTypes.ts` — import and reuse `resolveConfidence`/
  `psychEvidence` as-is; no changes needed.
- `lib/relationship/friend/storyPlan/friendStoryPlanTypes.ts` + `buildFriendStoryPlanEngine.ts` —
  resolve the chapter-slot collision (§H) before adding anything.
- `lib/relationship/friend/friendCharacterEngine.ts` — if the CH2-extension path (§K) is chosen
  instead of a new top-level chapter, this is where the directional resourcefulness claim would
  actually attach, alongside the existing `deriveDirectionalFriendValue()`.
- `lib/relationship/friend/chapters/friendChapterCopyDictionary.ts` — new copy entries, verified
  distinct from existing `ACTION_ACTIVATION`/guardian-gift copy.
- `lib/relationship/friend/viewModel/buildFriendReportViewModel.ts` +
  `friendReportSectionTypes.ts` / `friendChapterVNextBlocksAdapter.ts` — only if the new-chapter
  path is chosen over the CH2-extension path.
- **Separately, unrelated to this feature:** `friendPsychFit.ts:672-676` /
  `buildFriendCanonicalEngine.ts:158-165` — the `resolveReconciliationScript` argument-mismatch bug
  found during the proof trace (§L), affecting every Friend report today. Recommend a standalone
  fix ticket, not bundled into this work.

---

## P. Recommendation

**IMPLEMENT_REDUCED_VERSION**

Specifically:
- Build **only** the directional resourcefulness claim (재성-based, reusing the treasurer-style
  composite/lock/flip pattern) and its one legitimate shadow (emotional bypass, gated on weak
  day-master strength).
- Drop `knowledge_expertise`, `action_momentum`, and `perspective_expansion` entirely — all three
  are already owned by CH1/CH2/current-CH5 and would violate the brief's own anti-duplication
  rules if rebuilt here.
- Defer `opportunity_network` and all three "인복" sub-splits to a future phase pending real fact
  construction — do not ship a section that will render `LOW_EVIDENCE` for most pairs.
- Resolve the CH2-extension-vs-new-chapter-number question before writing any code; the CH2-
  extension path is the better fit given how little content survives evidence gating.
- Expect a meaningful share of real pairs (the Sera×동글 proof case included) to omit the
  resourcefulness claim entirely when neither person has a 재성 signal — this is correct behavior,
  not a bug to work around with softer fallback language.

---
---

# ADDENDUM — Refined Sera × 동글 Proof Case & GO/NO-GO (follow-up pass)

This addendum answers a follow-up request for a more granular, per-dimension directional trace
against the same production data used above (§L). No new files were read beyond what §B–§L
already covered; this is re-analysis of the same evidence at finer grain, plus the requested
proof-table/claim-safety/verdict formats. Still read-only — no code, UI, or data changed.

## A. Actual production facts used (unchanged from §L, restated for reference)

**Sera** (1993-05-15, 12:00 default): 년주 계유 / 월주 정사 / **일주 병신** / 시주 갑오.
Day Master **병(丙) — Yang Fire**. Elements: fire 4 (dominant), earth 0 (weakest), wood 1,
metal 2, water 1. Ten Gods, non-self pillars: 정관×1, 겁재×1, 편인×1. Strength: 신강.
Wealth-family (정재+편재) count: **0**. Psych axes present: thinking_style 68, practicality 62,
empathy 58, structure 60, stimulation 50. Missing: self_control, conflict_style, resilience,
recognition, energy_style, decision_style.

**동글** (1994-12-15, 12:00 default): 년주 갑술 / 월주 병자 / **일주 을해** / 시주 임오.
Day Master **을(乙) — Yin Wood**. Elements: water 3 (dominant), metal 0 (weakest), wood 2,
fire 2, earth 1. Ten Gods, non-self pillars: 겁재×1, 상관×1, 정인×1. Strength: 신강.
Wealth-family count: **0**. Psych axes present: empathy 72, resilience 65, structure 58,
thinking_style 48, stimulation 45. Missing: self_control, practicality, conflict_style,
recognition, energy_style, decision_style.

**Pair facts**: `hasChung: true, hasHyung: true, hasPa: true, hasHae: true, hasClash: true,
hasDayBranchCombine: false, hasDayBranchChungHyung: true, hasYeokma: false,
elementSupport: {aToB: false, bToA: false}`. Sera's day branch 신(Monkey) vs. 동글's 해(Pig) is a
classic 육해 Six-Harms pairing. No mutual element generation in either direction.

Reconfirmed: this contradicts the old memory note (Sera=丁火/동글=甲木) by a Yin/Yang-polarity swap
on both sides simultaneously (丙↔丁, 甲↔乙) while agreeing on base element — consistent with, not
proof of, the previously-flagged data-corruption incident. This trace uses today's actual
production output, not the old note.

## B. Candidate evidence audit — CANONICAL_EXISTING / DERIVABLE_FROM_EXISTING / NOT_SUPPORTED

| Dimension | Status | Basis |
|---|---|---|
| Knowledge/expertise | DERIVABLE_FROM_EXISTING | Raw seal-family (인성) ten-god count exists live; no scored dimension assembles it yet |
| Practical resourcefulness | DERIVABLE_FROM_EXISTING | `resource_governance` (재성-based, confidence+evidence) exists in the rich stack, unwired to Friend; raw wealth-family count is live in Friend today |
| Network/opportunity | NOT_SUPPORTED | No scored fact anywhere; only unwired prose in `TEN_GOD_LENS_MATRIX.friend` (정관/편재 rows) and the dev-only branch |
| Perspective expansion | CANONICAL_EXISTING (elsewhere) | Already implemented as CH2's `perspective_expansion` capability and enrichment's `buildUnlockedSelfLine()` (오행 상생-gated) — the fact exists, just not "for a new chapter" |
| Action/momentum | CANONICAL_EXISTING (elsewhere) | Already implemented as CH2's `action_activation` and current-CH5's `problemResponse.ACTIVATE` |

No new Myeongri rule was invented to produce this table — every row cites a specific existing
file/function traced in §B–§D above.

## C. Directional proof

**A. Knowledge/Expertise**
- Sera individual evidence: 편인×1 (seal-family, single instance) + thinking_style 68 (above the
  60 "meaningfully high" band).
- 동글 individual evidence: 정인×1 (seal-family, single instance) + thinking_style 48 (below band).
- **Sera → 동글**: Giver capability = weak-but-present analytical/insight signal (1 ten-god hit +
  above-band psych). Receiver receptivity = 동글's thinking_style (48) sits 20 points below
  Sera's — a gap at the standard "meaningfully different" threshold, suggesting room to receive
  this. Pair evidence: none specific. Psych modifier: thinking_style gap, present for both.
  **Confidence: MEDIUM.** (Mechanically, `resolveConfidence()` would call this HIGH — 2 distinct
  evidence families, TEN_GOD + PSYCH_11, both supporting, no contradiction — but a single-instance
  ten-god hit is exactly the "single ambiguous signal" the brief calls WEAK on its own; I am
  downgrading the mechanical HIGH to MEDIUM rather than take the framework's output uncritically.)
- **동글 → Sera**: Giver capability = single 정인 hit, thinking_style below-band (48) — weak giver
  signal. Receiver receptivity = Sera's thinking_style is already high (68), no gap in the needed
  direction. **Confidence: LOW_EVIDENCE — no positive claim.**

**B. Practical Resourcefulness**
- Sera individual evidence: wealth-family (정재+편재) count = **0**.
- 동글 individual evidence: wealth-family count = **0**.
- **Sera → 동글** and **동글 → Sera**: Giver capability = none (zero base signal on either side).
  Psych: Sera has `practicality` 62 (above-band) but per the established Saju-locks/psych-modifies
  convention used everywhere else in this codebase (`friendPsychFit.ts`), psych is meant to
  confirm/caution/flip a *base Saju claim* — it does not stand alone as the sole evidence for a
  concept the brief itself frames as 재성-derived. With zero 재성 for both people, there is no base
  claim for psych to modify. **Confidence: LOW_EVIDENCE both directions — no positive claim.**

**C. Network/Opportunity**
- Sera individual evidence: 정관×1 (officer-family, single instance; only prose-precedented in the
  unwired `TEN_GOD_LENS_MATRIX.정관.friend` row, not a scored fact).
- 동글 individual evidence: none (no officer-family ten-god).
- Pair evidence: `hasYeokma: false` — the one pair-level "movement/opportunity" signal is absent.
- Psych: `energy_style` (the axis this dimension would most depend on, per the psych-mapping in
  §D of the main audit) is **missing for both people** in this fixture — `psychEvidence()` would
  correctly return `null`, contributing nothing.
- **Sera → 동글** and **동글 → Sera**: **Confidence: LOW_EVIDENCE both directions.** Not merely
  weak-for-this-pair — the dimension has no scored canonical fact to begin with (§B above), so
  there is nothing to be confident about regardless of the specific pair.

**D. Perspective Expansion**
- Sera individual evidence: 편인×1 (same single hit already counted under Knowledge/Expertise —
  see flag below).
- 동글 individual evidence: 정인×1 (same single hit already counted under Knowledge/Expertise).
- Pair evidence: `elementSupport: {aToB: false, bToA: false}` — the exact mechanism enrichment's
  `buildUnlockedSelfLine()`/`buildElementGeneratesGiftLine()` already use for "what version of
  myself comes out around this friend" is **absent in both directions** for this pair.
- **Sera → 동글** and **동글 → Sera**: **Confidence: LOW_EVIDENCE both directions** (no
  element-generation support, single reused ten-god hit, day masters aren't the CH1
  im/gye archetype this concept is otherwise attached to).
- **Flag:** 편인 was just used as evidence for *Knowledge/Expertise* above and is now being reused
  for *Perspective Expansion* here. The same single ten-god hit cannot legitimately support two
  different headline claims — this is a concrete instance of the brief's own warning against
  "three superficially different claims from the same evidence." One of these two dimensions has
  to yield, and since Perspective Expansion is independently DUPLICATE of CH2 (§D below) while
  Knowledge/Expertise is "only" partially overlapping, Perspective Expansion is the one to drop.

**E. Action/Momentum**
- Sera individual evidence: 겁재×1 (self-family), stimulation 50 (mid-band), decision_style
  missing.
- 동글 individual evidence: 겁재×1 + 상관×1 (self+food family — 상관 is exactly the ingredient the
  existing `problemResponse.ACTIVATE` substyle already looks for), stimulation 45 (below the
  "high" 60 band), decision_style missing.
- **동글 → Sera**: Giver capability = 상관 presence (real, but this is literally the same input the
  *current* CH5 support engine already reads for this pair). Confidence in the existing engine's
  own terms would be MEDIUM at best (decision_style missing, stimulation sub-threshold).
- **Sera → 동글**: Giver capability = weaker (no 상관, only self-family 겁재). **LOW_EVIDENCE.**
- This dimension is excluded regardless of the above numbers — see §D, it is structurally
  DUPLICATE, not just weakly evidenced for this pair.

## D. Duplication matrix

| Candidate | CH2 overlap | CH4 overlap | Support/Conflict/Distance overlap | Classification |
|---|---|---|---|---|
| Knowledge/Expertise | `strategic_direction` — "판단과 방향을 정리해주는 사람" is functionally the same claim as "지식/전문적 관점 제공" | none | none | **PARTIAL_OVERLAP** |
| Practical Resourcefulness | `business` guardian-gift archetype ("Practical, resourceful... turns ideas into results") is close in *label* but scoped to a 3-way character typing, not a directional 재성-based claim | none | none | **PARTIAL_OVERLAP** (real, but least severe of the five — the underlying fact source is genuinely different, guardian-gift is ten-god-count-based character typing, not a directional wealth-family score) |
| Network/Opportunity | none | none | none | **NEW_INFORMATION** (but see §B — no scored fact exists to build it from yet) |
| Perspective Expansion | `perspective_expansion` — literal name match, same situational framing ("생각이 막혀 있을 때... 넓은 시야") | none | none | **DUPLICATE** |
| Action/Momentum | `action_activation` — literal name match | Chapter 4 covers planning/execution split, adjacent but not identical | Current CH5's `ACTION_ACTIVATION` support mode / `problemResponse.ACTIVATE` — same concept, same underlying psych+ten-god inputs | **DUPLICATE (twice over)** |

## E. Sera × 동글 proof table

| Candidate | Sera → 동글 | 동글 → Sera | Evidence Strength | Existing Chapter Overlap | Novelty | Keep in New CH5? |
|---|---|---|---|---|---|---|
| Knowledge / Expertise | Sera's analytical/insight lean (편인 + thinking_style 68) has room to land, since 동글's own analytical axis (48) sits meaningfully lower | 동글's single 정인 hit doesn't clear a giver bar, and Sera isn't in a receptive gap for it | MEDIUM (A→B) / LOW_EVIDENCE (B→A) | PARTIAL_OVERLAP with CH2 `strategic_direction` | Low | **No** — belongs on CH2 if anywhere |
| Practical Resourcefulness | No wealth-family signal on either side — nothing to give | No wealth-family signal on either side — nothing to give | LOW_EVIDENCE both directions | PARTIAL_OVERLAP with CH2 guardian-gift `business` archetype (mild) | Highest of the five in principle | **No for this pair** (architecture worth keeping for pairs where 재성 is actually present — see Recommendation) |
| Network / Opportunity | Sera's single 정관 hit is prose-precedented only, not a scored fact; no 역마 between them; energy_style unavailable for either | 동글 has no officer-family signal at all | LOW_EVIDENCE both directions | NEW_INFORMATION (no current owner) | Highest conceptual novelty, but zero engineering behind it | **No** — nothing to build on yet, not this cycle |
| Perspective Expansion | No element-generation from Sera to 동글; reuses the same 편인 hit already spent on Knowledge/Expertise | No element-generation from 동글 to Sera; reuses the same 정인 hit | LOW_EVIDENCE both directions | DUPLICATE of CH2 `perspective_expansion` + enrichment's `buildUnlockedSelfLine()` (which already runs this exact check and would also find nothing here) | None | **No** |
| Action / Momentum | 겁재-only, weak giver profile | 겁재+상관 present but this is literally current-CH5's own input; decision_style missing, stimulation sub-threshold | LOW_EVIDENCE (A→B) / MEDIUM-at-best in the *existing* engine's own terms (B→A) | DUPLICATE of CH2 `action_activation` + current-CH5 `ACTION_ACTIVATION` | None | **No** |

## F. Shadow/cost audit

Only dimensions that are both evidenced and non-duplicate are eligible for a shadow test.
**None of the five clears that bar for this specific pair** (Resourcefulness clears the
non-duplicate bar but not the evidence bar here; Knowledge/Expertise clears evidence in one
direction but not the duplicate bar). Testing each anyway, honestly:

- **Practical Resourcefulness → possible shadow ("practical help becomes over-management" or
  emotional needs skipped):** The general chain (wealth-family dominance + a *weak* day-master
  strength label) is architecturally traceable — both ingredients are already live facts in
  Friend's canonical output (§B1 of the main audit). But this pair's base capability doesn't fire
  (zero 재성 for both), so the shadow can't fire either. **NO_SUPPORTED_SHADOW for this pair**
  (the mechanism exists in principle for other pairs; recorded here so it isn't rediscovered as
  "new" later).
- **Network/Opportunity → possible shadow ("more opportunities create social load"):**
  **NO_SUPPORTED_SHADOW** — there is no base capability fact to hang a shadow on at all, for any
  pair, until the underlying dimension is actually built.
- **Knowledge/Expertise → possible shadow ("useful advice becomes unsolicited advice"):** Not
  tested — this dimension is excluded on duplication grounds (§D), independent of whether a shadow
  chain could be constructed for it.

No shadow was manufactured for symmetry; two of three came back `NO_SUPPORTED_SHADOW` because
their parent capability didn't fire, and the third wasn't eligible to test.

## G. Claim-safety translations

| Unsafe raw claim | Safe relationship translation | Supported here? |
|---|---|---|
| "전문직/똑똑한 친구" | "복잡한 문제를 정리해서 판단을 도와주는 친구" | Not for this pair (LOW/MEDIUM at best, and the concept is CH2's anyway) |
| "돈 많은 친구" / "부자 친구" | "현실적인 선택지와 자원을 잘 활용해 실질적인 도움을 주는 친구" | Not for this pair — zero 재성 signal on both sides, must omit entirely, not soften |
| "인맥/인복 좋은 친구" | "새로운 사람이나 경험으로 이어주는 친구" | Not supported anywhere in current architecture, for any pair, until a scored fact exists |
| "성공/기회를 주는 친구" | "실행 가능한 선택지를 넓혀주는 친구" | Not supported — no fact backs "opportunity" as distinct from the above |
| "사회적 지위가 높은 친구" | *(no safe translation attempted — this framing should not be pursued in any form)* | Never |

## H. Surviving unique insights

**None, for this specific pair, at chapter-worthy confidence.** Architecturally, exactly one
insight survives the duplication filter with a real (if currently unbuilt) evidence pathway:
**directional practical resourcefulness**, keyed off wealth-family (재성) ten-god dominance with a
composite-scoring pattern already proven elsewhere in this codebase (`refineFriendTreasurer`'s
Saju-lock/psych-flip logic in `friendPsychFit.ts`). It does not fire for Sera×동글 because neither
person has a 재성 signal — which is the evidence gate working correctly, not a gap in the analysis.

## I. Rejected dimensions and why

- **Knowledge/Expertise** — PARTIAL_OVERLAP with CH2's `strategic_direction`; also caught reusing
  the same single ten-god hit (편인/정인) that Perspective Expansion also wanted to claim (§C-D
  flag) — a sign the two "different" dimensions aren't actually independently evidenced.
- **Network/Opportunity** — No scored canonical fact exists anywhere in the codebase for this
  concept; would require entirely new fact construction, not re-exposure of existing data.
- **Perspective Expansion** — DUPLICATE of CH2's `perspective_expansion` capability and
  enrichment's `buildUnlockedSelfLine()`, both already live and both already checked (and correctly
  found nothing) for this exact pair via `elementSupport`.
- **Action/Momentum** — DUPLICATE of CH2's `action_activation` and current-CH5's
  `ACTION_ACTIVATION`/`problemResponse.ACTIVATE`; the evidence (상관 for 동글) is literally the same
  input the existing engine already consumes for a different, already-shipping purpose.

## J. Final GO/NO-GO verdict

**CH5_GO_WITH_LIMITS**

Of the five candidates, three are structurally duplicate (Knowledge/Expertise partially,
Perspective Expansion and Action/Momentum fully) regardless of which pair is tested — that's a
property of the existing IA, not of Sera×동글 specifically. Of the two that are genuinely
NEW_INFORMATION (Resourcefulness, Network/Opportunity), one has a real, already-precedented
evidence pathway just not wired up, and the other has no scored fact anywhere and would be net-new
construction. Nothing here justifies a full new chapter's worth of content — the answer to
"does this deserve A/B/C/D" is:

**C — integration into an existing chapter, not a new chapter or subsection.**

Specifically: fold the one surviving, evidenced concept — directional practical resourcefulness,
with its conditional emotional-bypass shadow — into **CH2** (`ch02_who_we_are`), as an addition to
`deriveDirectionalFriendValue()`'s existing output, rather than standing up a new `ch05`/renumbered
chapter for what amounts to a single conditional claim. Defer Network/Opportunity entirely —
building a scored fact for it is a separate, larger piece of work than this chapter proposal
implies, and shipping it now would mean shipping a section that renders `LOW_EVIDENCE` for most
real pairs.

## K. Minimal IA (if this were still going to be a standalone addition)

Not a new chapter — a single new card inside CH2's existing directional-value output, rendered
only when the resourcefulness claim actually fires (i.e., not for pairs like Sera×동글):

```
◤ 현실적인 도움을 주고받는 방식
[Giver]는 막막한 상황에서 실제로 쓸 수 있는 선택지를 찾아주는 편이에요.
[Receiver]에게는 이런 도움이 특히 힘이 되는 시점이 있어요.
```

Shown only when confidence ≥ MEDIUM; the shadow line renders only when the giver's day-master
strength is 신약 (weak) — never as a default addendum:

```
다만 이런 실질적인 도움이 always 편한 것만은 아니에요 —
가끔은 감정보다 해결책이 먼저 나오는 느낌을 줄 수 있어요.
```

For Sera×동글, both blocks would be omitted entirely — the correct, evidence-gated outcome for
this pair, not a placeholder-text failure.

## L. Files/functions inspected for this addendum

Same evidence base as the main audit (§B–§L above): `lib/saju/pairChartAnalysis.ts`,
`lib/saju/elements.ts`, `lib/saju/repository.ts`, `lib/relationship/marriage/marriageTenGodAnalysis.ts`,
`lib/relationship/friend/canonical/buildFriendCanonicalEngine.ts`,
`lib/relationship/friend/canonical/friendCanonicalTypes.ts`,
`lib/relationship/friend/friendCharacterEngine.ts`, `lib/relationship/friend/friendPsychFit.ts`,
`lib/relationship/friend/response/friendEvidenceTypes.ts`,
`lib/relationship/friend/response/buildFriendResponseDimensions.ts`,
`lib/relationship/friend/chapters/friendChapter05Support.ts`,
`lib/relationship/enrichment/friendGiftAndBondInsights.ts`,
`lib/relationship/domainLenses/tenGodLensMatrix.ts`,
`lib/personCore/personalContextEngine/selectPersonalInnate.ts`,
`lib/v2/survey/types.ts`, `tests/unit/friend-ch1-ch2-architecture.test.ts`. No files were modified;
this addendum only re-derives conclusions from data already extracted from those files/production
runs in the main audit pass. No commit, no push.
