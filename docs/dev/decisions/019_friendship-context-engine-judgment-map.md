# 019 — Friendship Context Engine judgment map (Gate 2)

**날짜:** 2026-07-24  
**상태:** 확정 — MUST 슬라이스 구현 착수  
**선행:** Gate 1 READY FOR JUDGMENT-MAP DESIGN  
**엔진:** Friendship deep = **rule-only** (LLM 분류 경로 도입 금지)

---

## 1. Scope classification

| Judgment ID | Class | Notes |
|-------------|-------|-------|
| `comparison_table` ×6 rows | **MUST_CANONICALIZE** | shortLabel must not be authority; typed bands → localize |
| `treasurer` | **MUST_CANONICALIZE** (complete CE lifecycle) | Resolver already exists; add client projection + typed UI meta |
| `travel_planner` | **MUST_CANONICALIZE** | Directional planner already has align/confidence |
| `dna_battery_mode` | SHOULD → **DEFER** this freeze | Person mode in DNA/CO; UI prose OK for now |
| `dna_tikitaka_mode` | SHOULD → **DEFER** | Independent of compare rhythm; defer chip |
| `counseling_style` | SHOULD → **DEFER** | Typed in CO; prose UI enough this freeze |
| `guardian_character` | KEEP_DETERMINISTIC_PROSE / DEFER | Optional psych; no badge required |
| `de_escalation` | KEEP_DETERMINISTIC_PROSE | Archetype+scripts; not enum CE this freeze |
| `pair_climate` / soulmate / grade | KEEP_DETERMINISTIC_PROSE / METADATA | Scores already numeric SSOT |
| `breakup_trigger` / `jealousy_guard` | KEEP_DETERMINISTIC_PROSE | Warnings, not reusable classifications |
| `optimal_hangout` | KEEP_DETERMINISTIC_PROSE | Narrative from DNA |
| `prescription_friendship` | KEEP_DETERMINISTIC_PROSE | Action list |

**First freeze scope = MUST only:** comparison_table + travel_planner + treasurer lifecycle completion.

---

## 2. Semantic Boundary Table (MUST + hard neighbors)

### comparison_table.daily_share_tempo

| Field | Value |
|-------|-------|
| User question | 일상 연락·공유 템포는 누가 어떤 편인가? |
| Subject | Person A / B (symmetric labels) |
| Inputs | day stem yang/yin (`chart.dayStemCode`) |
| Existing resolver | `resolveRhythmBand` in `friendSajuCompareTable.ts` |
| Output enum | `active` \| `steady` |
| Null/balanced | always resolvable from stem; no null |
| A/B reversal | swap band_a/band_b |
| Confidence | none |
| Canonical | `canonical_projections.comparison_table.daily_share_tempo` |
| UI | compare table typed chip → localized shortLabel |
| Explicitly NOT | Work collaboration rhythm meaning; DNA battery |
| Cross-domain | Same yang-stem **fact** as Work may exist; Friend question is contact tempo only |

### comparison_table.upset_expression

| Field | Value |
|-------|-------|
| User question | 서운함을 어떻게 드러내는가? |
| Subject | Person A / B |
| Inputs | ten-god dominant category |
| Existing | `resolveDominantCategory` |
| Output enum | `wealth` \| `officer` \| `food` \| `seal` \| `self` |
| Explicitly NOT | breakup_trigger; de_escalation strategy |
| Cross-domain | Not Romantic conflict lean |

### comparison_table.affection_language

| Field | Value |
|-------|-------|
| User question | 우정·의리를 어떻게 표현하는가? |
| Subject | Person A / B |
| Inputs | `dna.dominantElement` |
| Output enum | `wood` \| `fire` \| `earth` \| `metal` \| `water` |
| Explicitly NOT | Romantic affection_band / compare_affection |

### comparison_table.battery_recharge

| Field | Value |
|-------|-------|
| User question | 우정 에너지를 어떻게 충전하는가? (신강/약 표) |
| Subject | Person A / B |
| Inputs | chart elements — **Friend compare margin=1** |
| Output enum | `strong` \| `weak` \| `balanced` |
| Explicitly NOT | DNA `batteryMode` outdoor/homebody; Romantic recovery/residual |

### comparison_table.hangout_planning

| Field | Value |
|-------|-------|
| User question | 모임 준비·물류를 얼마나 주도하는가? |
| Subject | Person A / B |
| Inputs | wealthOfficer 0/1/2+ |
| Output enum | `none` \| `some` \| `strong` |
| Explicitly NOT | **treasurer**; travel_planner |

### comparison_table.communication_rhythm

| Field | Value |
|-------|-------|
| User question | 대화 텐션(식상 3밴드)은? |
| Subject | Person A / B |
| Inputs | food count 0/1/2+ |
| Output enum | `none` \| `some` \| `strong` |
| Explicitly NOT | DNA `tikitakaMode` popcorn/silent (different cut) |

### treasurer

| Field | Value |
|-------|-------|
| User question | 친구 사이 돈·정산 총무는 누구인가? |
| Subject | Directional pair |
| Inputs | treasurer saju score + practicality/structure refine |
| Existing | `pickFriendTreasurer` → `refineFriendTreasurer` |
| Output | `{ side: a\|b, align?, confidence? }` (+ nickname for display) |
| Null | no psych → side from base, omit align/confidence |
| A/B reverse | side flips with slot swap |
| Canonical | `canonical_projections.treasurer` + keep section_play_money fields |
| Explicitly NOT | hangout_planning; travel_planner; Marriage CFO |

### travel_planner

| Field | Value |
|-------|-------|
| User question | 여행 때 일정·동선 계획 역할은 누구인가? |
| Subject | Directional pair |
| Inputs | structure gap (+ battery/tikitaka/energy refine) |
| Existing | `resolveTravelStyleSplit` → `refineTravelStyleSplit` |
| Output | `{ planner_side: a\|b, align?, confidence? }` |
| Null | no psych or gap&lt;15 → no projection |
| Explicitly NOT | treasurer; Work leadership; hangout_planning |

---

## 3. Transport decision (narrow, reversible)

- Add Friend `report.canonical_projections` for MUST judgments (Romantic-style **client bag**).
- Keep existing section fields in sync from the **same** finalized typed values (single resolver; section prose derived).
- `stripFriendContextOutputForClient` continues to strip **only** `context_output`; projections survive.
- Legacy reports without projections: UI falls back to section shortLabel/prose; **does not invent** typed enums from strings.
- If section and projection disagree after legacy edits: **projection wins** when present and valid.

---

## 4. Deferred (freeze later)

DNA battery/tikitaka chips, counseling/guardian typed UI, de-escalation enum CE, dual strength-margin hygiene, dead `friendPsychCompareTable` deletion.

---

## 5. Non-sharing

Do not import Romantic compare composites, Work leadership, Marriage CFO, or Family axes. Share only `CanonicalJudgment` envelope + strip/cache patterns.
