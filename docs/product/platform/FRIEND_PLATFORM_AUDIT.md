# Friend Platform Capability Audit

**Document type:** Platform reverse-engineering audit (not Product/Technical blueprint)  
**Domain:** Friendship (`friendship`)  
**Runtime format:** `friend_social_deep_v1`  
**Quality benchmark:** Romantic platform audit methodology  
**Status:** Research knowledge base for Design Freeze + future 05/06/07  
**Scope rule:** Evidence and observations only — no redesign, no decisions

---

# Executive Summary

## Overall implementation maturity

Friend is a **mature CE + explain-overlay** product: deterministic Social DNA / scores / compare / travel / treasurer / prescriptions are production-grade; optional LLM Deep Read is freeze-aligned explain-only. Maturity is high on **engine → SSOT → UI** for core cards, medium on **canonical typed projections** (present for compare/travel/treasurer), low on **context_output utilization** (built, stripped, never user-facing).

## Major strengths

1. Clear CE SSOT body (`FriendReportBody`) with kill-switchable narrative overlay (`meta.friend_saju_deep`).
2. Ten boolean `FriendScoringSignals` drive grades, soulmate/one-liner branching, and CO `signals` — traceable heuristics.
3. Three client-safe canonical projections: `comparison_table`, `travel_planner`, `treasurer`.
4. Shared platform pieces already wired: TriScore (`FRIENDSHIP_CONFIG`), Deep Read, PairPrescriptions.
5. Psych overlays are optional and fail-soft (omit radar/notes when no `psychMaster`).

## Major weaknesses

1. **Context Output is a dead end for product** — rich typed categories never reach UI or ViewModel.
2. Dual UI paths (ViewModel vs legacy JSX) → same payload, different module sets.
3. Title-key collisions and score duplication (snapshot % vs meta % vs gauges).
4. LLM schema richer than UI (overlay `comparison_table`, `real_life_example` unused).
5. Several RuleContext fields (`strengthA/B`, metaphors) and PersonCore friendship signals beyond isolation band are barely consumed.

## Biggest missing chains

| Chain | Break |
|-------|--------|
| CO `dominant_categories` (guardian, tikitaka, battery, counseling, travel, treasurer*) | Built → stripped → **never projected to UI** |
| `FriendScoringSignals` as first-class UX | Exist in engine + CO → only indirect via scores/copy |
| LLM `section_2_nature.comparison_table` | Overlay → **not** Deep Read VM |
| Opening `gradeReason` / `summary_line` | SSOT → Opening stores / ignores → user sees grade badge + headline only |
| Timeline / horizon module | **Absent** (Romantic/Marriage have analogues) |

---

# Capability Map

Legend: **Full** = engine→UI complete · **Partial** = breaks mid-chain · **Hidden** = computed, not shown · **Narrative-only** = LLM/prose without typed UI · **Legacy** = alternate path

| Capability | User question (inferred from titles/comments) | Origin | Producer | Confidence character | Final consumption | State |
|------------|-----------------------------------------------|--------|----------|----------------------|-------------------|-------|
| Connection / Banter / Risk % | How strong is our friendship chemistry / banter / social risk? | Pair saju scoring | `analyzeFriendPairSaju` → grade/master scores → `section_snapshot` + meta `*_pct` | Deterministic heuristics | Layout chips + TriScore gauges | Full (duplicated surfaces) |
| TriScore snapshot panel | Same, with narrative topics | Event-score remap | `buildFriendSnapshotPanel` / `friendEventScores` | Deterministic remap of master scores | `TriScoreSnapshotPanel` | Full |
| Social DNA A/B | Who am I as a friend? | DNA profile + copy | `buildFriendKillerSections` / `FriendDnaProfile` | Template + signals | `social_dna` cards | Full |
| Guardian character | Psych-flavored friend persona | Psych | `resolveGuardianCharacterForPerson` | Needs psych | DNA card field | Partial (omit without psych) |
| Soulmate verdict | Are we “soulmate frequency” friends? | Boolean signals + thresholds | `buildSoulmateVerdict` | Editorial templates on heuristics | `soulmate` card | Full (editorial-heavy) |
| One-liner / headline | What is this friendship in one line? | Signals + psych clause | `resolveFriendshipOneLiner` + `resolveFriendSignatureClause` | Mixed | Opening | Full |
| Compare table 6 axes | How do we differ day-to-day? | Saju bands + meanings | `buildFriendSajuCompareTable` | Typed bands in CE | `compare_table` (+ canonical shortLabels) | Full |
| Psych note on communication_rhythm | Does survey confirm talk rhythm? | Psych | `resolveCommunicationRhythmNote` | Needs psych | Compare row footnote | Partial |
| Psych radar 11-axis | Where do our psych profiles align? | Psych masters | `buildFriendPsychMatchBundle` | Survey math | `psych_radar` | Partial |
| Play money / treasurer | Who holds the hangout wallet energy? | Ten gods + refine | Killer + `refineFriendTreasurer` + canonical | CE + confidence fields | Play money card (nickname/reason; confidence Hidden) | Partial |
| Travel planner / hidden flow | How do we travel / counsel each other? | Saju + psych split | `resolveTravelStyleSplit`, counseling resolvers + canonical | Mixed | `hidden_flow` | Partial |
| Breakup guide | What ends this friendship? | Ten gods / triggers | Killer section | Template | `breakup_guide` | Full (editorial) |
| De-escalation + cheat script | How do we cool a fight? | Upset-side heuristic + scripts | Killer + `friendDeEscalationPrescriptions` | Heuristic upset side | `de_escalation` | Full |
| Prescriptions | What should we do weekly? | `PairFriendshipSignals` | `buildFriendPrescriptions` | Needs both saju masters | `prescription` | Partial |
| Deep Read | What’s the story behind the numbers? | LLM overlay | `attachFriendSajuDeepOverlay` | Explain-only; fail-soft | `deep_read` / `DeepReadCard` | Partial (schema > UI) |
| Context Output pack | (internal) typed friendship categories | Re-pack of CE | `buildFriendContextOutput` | Typed | Digest/LLM only after strip | Hidden |
| Isolation band bonus | Bonded vs lone-wolf flavor | PersonCore `bijie_isolation` | Isolation bonus on DNA | Narrow band use | DNA copy append | Partial |
| Year/month palace, johu_profile | — | PersonCore friendship signals | Extracted upstream | — | **Not wired into Friend sections** | Unused |
| RuleContext strength/metaphor | — | Rule context | `buildFriendRuleContext` | — | **Not read by body/UI** | Unused |

### Compare row IDs (`FriendCompareRowId`)

`daily_share_tempo` · `upset_expression` · `affection_language` · `battery_recharge` · `hangout_planning` · `communication_rhythm`

### Scoring signals (`FriendScoringSignals`)

`hasDayBranchCombine`, `hasBijiepMutualResonance`, `hasDayBranchChungHyung`, `hasFoodSealHarmony`, `hasJohuComplement`, `hasFoodClashFriction`, `hasDayBranchFullTension`, `hasWonjinOrGuimun`, `hasWealthOfficerClash`, `hasDayStemMutualSupport`

### Supporting files (primary)

```
lib/saju/friendAnalysis.ts
lib/relationship/friend/buildFriendReport.ts
lib/relationship/friend/buildFriendRuleContext.ts
lib/relationship/friend/friendKillerSections.ts
lib/relationship/friend/friendSajuCompareTable.ts
lib/relationship/friend/friendPsychFit.ts
lib/relationship/friend/friendContextOutput.ts
lib/relationship/friend/friend*Canonical.ts
lib/relationship/friend/buildFriendSnapshotPanel.ts
lib/relationship/friend/buildFriendPrescriptions.ts
lib/relationship/friend/viewModel/*
lib/prompts/relationshipPremium/friendSocial/*
lib/prompts/relationshipPremium/friendSajuDeep/*
lib/relationship/friendSajuPromptDigest.ts
components/relationship/FriendReportView.tsx
components/relationship/friend/sections/SectionRenderer.tsx
components/relationship/shared/DeepReadCard.tsx
```

---

# Full Pipeline Audit

## Global pipeline

```text
PersonCore (sajuJson, sajuMaster, psychMaster)
  → buildPairDomainSignalsFromMasters().friendship
  → buildFriendReport
       → buildFriendRuleContext → analyzeFriendPairSaju / grade / DNA
       → buildFriendKillerSections
       → psych fit overlays
       → buildFriendSajuCompareTable
       → buildFriendSnapshotPanel
       → buildFriendPsychMatchBundle
       → buildFriendPrescriptions?
       → buildFriendContextOutput
       → inject canonical_projections {comparison_table, travel_planner, treasurer}
  → attachFriendSajuDeepOverlay → meta.friend_saju_deep
  → persist friend_social_deep_v1
  → stripFriendContextOutputForClient
  → FriendReportView
       → buildFriendReportViewModel → SectionRenderer
       OR legacy JSX if DNA missing / VM throws
```

## Stage-by-stage health

| Stage | Exists? | Notes |
|-------|---------|-------|
| Engine | Yes | `friendAnalysis` + killer + psych fit |
| SSOT body | Yes | `FriendReportBody` |
| Canonical | Yes | 3 projections |
| Context | Yes | Built then **stripped** |
| Meta | Yes | scores, psych, prescriptions, overlay |
| Projection (client) | Partial | Canonical survive; CO does not |
| ViewModel | Yes | Primary path |
| UI | Yes | Dual path risk |
| Narrative | Optional | Deep Read only |
| User | Sees Parts 1–5 when VM OK | |

## Capability chain examples

### A. Treasurer (play money) — Partial

```text
Engine: ten-god / DNA money heuristics + refineFriendTreasurer
  → SSOT: section_play_money (+ align/confidence)
  → Canonical: treasurer projection
  → Context: treasurer / treasurer_align / treasurer_confidence categories
  → Meta: (via body)
  → Projection: canonical label to VM
  → ViewModel: play_money
  → UI: nickname + reason + optional canonical label
  → Narrative: may mention in Deep Read if digest includes
  → User: sees who/why; DOES NOT see align/confidence badges
BREAK: confidence/align stop at SSOT/CO
```

### B. FriendScoringSignals — Hidden / indirect

```text
Engine: 10 booleans
  → SSOT: drive grade, soulmate, one-liner, risk paths
  → Canonical: not as signal board
  → Context: signals: { ...scoringSignals }
  → Meta: not as discrete UI
  → UI: no signal board
BREAK: user never sees the boolean evidence board; only prose/score consequences
```

### C. Deep Read — Partial

```text
Engine judgments (digest)
  → LLM overlay FriendSajuDeepReport
  → Meta friend_saju_deep
  → ViewModel buildDeepReadViewModel (nature, gap, advice, together)
  → UI DeepReadCard
BREAK: overlay comparison_table, real_life_example, target_user never mapped
```

### D. Travel planner — Dual authority (healthy-ish)

```text
SSOT prose split descriptions
  + Canonical travel_planner
  → VM prefers typed short labels when present
User: sees travel in hidden_flow; CO travel_* never shown
```

---

# Report Usage Audit

## What users actually see (VM path)

1. Opening: headline, grade badge, names, three score chips  
2. Snapshot TriScore panel + vibe notes (if psych)  
3. 6-row compare table  
4. Psych radar (if psych)  
5. Social DNA dual cards  
6. Soulmate paragraph  
7. Play money  
8. Hidden flow (travel + counseling)  
9. Deep Read (if overlay succeeded)  
10. Breakup guide  
11. De-escalation hashtag + cheat script  
12. Prescriptions (if pair friendship signals)

**Not shown:** free truncated Friend deep; timelines; CO categories; grade reason text; LLM examples.

## Calculated but never shown

- Full `context_output`  
- `summary_line` as standalone  
- `grade_reason` as text  
- `uncertain_items`  
- Treasurer/travel confidence & align as UX  
- Overlay comparison table & real_life_example  
- Unused PersonCore friendship fields (palace, johu)  
- RuleContext strength/metaphor  

## Narrative-only / narrative-heavy

- Deep Read voices, gap, advice, together  
- Soulmate / one-liner / breakup prose (deterministic templates, not LLM — still editorial)

## Cards: SSOT-driven vs editorial vs LLM

| Card | Character |
|------|-----------|
| Snapshot / compare / radar | SSOT / psych math |
| Social DNA | SSOT DNA + template copy |
| Soulmate / breakup / de-escalation | Deterministic **editorial** templates |
| Play money / travel | SSOT + refine + canonical |
| Prescriptions | Signal-driven templates |
| Deep Read | **LLM** explain |

## Backend-only

Everything under `context_output` after client strip; digest intermediates.

---

# Hidden Opportunities

| Opportunity | Evidence | Why valuable | Future UX candidate (observation only) |
|-------------|----------|--------------|----------------------------------------|
| Signal board from `FriendScoringSignals` | CO `signals` + engine | Explains *why* grade/soulmate fired without new calc | Badge row / “evidence chips” |
| Treasurer confidence/align | SSOT + CO categories | Separates “who pays vibe” from certainty | Confidence badge on play money |
| Travel confidence/align | Same | Same for travel planner | Badge / soft vs hard recommendation |
| Guardian / tikitaka / battery / counseling categories | CO dominant_categories | Already classified for digest — product-ready enums | DNA badges, filter chips |
| Isolation band | Only bonus text | Bonded vs lone-wolf is a strong friendship concept | Explicit badge |
| LLM real_life_example | Overlay schema | Concrete scene without new model call if generated | Deep Read example block |
| Overlay comparison_table | Schema | Second compare layer already prompted | Optional Deep Read table |
| grade_reason | Meta | Builds trust in grade | Subtitle under badge |
| Johu / palace signals | PersonCore unused | Deeper friendship saju already extracted | Future CE rows — **if** product wants them |

---

# Structural Problems

1. **Legacy dual renderer** — `FriendReportView` legacy path omits Deep Read / part chrome.  
2. **Title key reuse** — snapshot & social_dna share `dnaCardTitle`; de-escalation & prescription share `deEscalationCardTitle`.  
3. **Score triple storage** — section_snapshot % · meta % · gauge eventScores.  
4. **Deprecated stub** — `friendPsychCompareTable.ts` marked deprecated.  
5. **Registry debt** — `relationshipAnalysisKinds` sets `triScoreKind: "romantic"` for friendship while panel uses `kind="friendship"`.  
6. **Upset-side heuristic** — de-escalation side from chung/hyung/wonjin rules — opaque to user.  
7. **Weak SSOT for “soulmate”** — marketing-weight word on boolean thresholds.

---

# Reuse Opportunities

| Asset | Reuse across | Why |
|-------|--------------|-----|
| `buildDeepReadViewModel` + `DeepReadCard` | All domains | Same overlay shape |
| `PairPrescriptionSection` | All | Same pack UI |
| `TriScoreSnapshotPanel` + kinds | All | Shared gauge chrome |
| Compare-table pattern (6 rows + canonical inject) | Work/Marriage/Family already parallel | Platform table component candidate |
| CO schema pattern (`dominant_categories` + strip) | All | Platform internal typed pack — **currently unused in UI everywhere** |
| Canonical client projection pattern | Friend travel/treasurer; Work leadership; Marriage CFO | Shared “typed label survives strip” pattern |
| Psych match bundle + radar | All | Shared |
| Fail-soft overlay attach | All | Shared |

Friend-specific (poor candidates for blind reuse): soulmate frequency, travel/treasurer friendship semantics, breakup_guide — domain vocabulary.

---

# Important Findings

**For Product (future 05)**  
- Friend already answers social logistics (money/travel/counseling) that Romantic deliberately avoids — boundary with Marriage CFO / Work leadership must stay explicit.  
- Editorial “soulmate” language is product-risk heavy relative to evidence strength.  
- CO categories prove the engine already thinks in guardian/tikitaka/battery enums — product may be under-exposing classification clarity.

**For UX / Visual**  
- Dual renderer means QA must specify VM path.  
- Confidence fields exist but have no visual language.  
- No timeline — friendship “horizon” is not a current surface.

**For Component Library**  
- Compare table + Deep Read + TriScore + Prescriptions are the reusable spine.  
- Friend officeCards-equivalent is mostly SectionRenderer, not a separate design system pack.

**For Shared Architecture**  
- Context Output is a platform-wide **investment without product ROI** until something consumes it (LLM digest already does; UI does not).  
- Registry `triScoreKind` mismatch is a landmine if anything trusts registry over panel kind.

**For future 05 / 06 / 07**  
- 05 should decide which Hidden Opportunities become first-class questions vs stay digest-only.  
- 06 should document CO as server/LLM SSOT vs client SSOT explicitly.  
- 07 should gate legacy renderer deprecation and unused overlay field policy.

---

*End of Friend Platform Capability Audit*
