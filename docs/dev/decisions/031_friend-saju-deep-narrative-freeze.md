# 031 — Friend saju-deep narrative freeze (Style Bible Master Check)

**날짜:** 2026-07-24  
**상태:** 확정 · Style Bible Master Check PASS · **동결**  
**범위:**
- `lib/prompts/relationshipPremium/friendSajuDeep/*` (LLM explain overlay + postValidate)
- `lib/relationship/friendSajuPromptDigest.ts` (CE → digest adapter)
- `lib/prompts/relationshipPremium/friendSocial/index.ts` overlay wire-in  
**비범위:** Friendship Context Engine rule-only SSOT (`019`/`020`), Style Bible Parts 1–7, Romantic (`027`), Married (`028`), Family (`029`), Business (`030`), non-friend domains

---

## 1. What is frozen

Friend / Social premium **saju-deep explain overlay** after Rounds 1–2:

| Layer | Role |
|-------|------|
| CE (`buildFriendReport`) | Classifications SSOT — unchanged |
| `friendSajuPromptDigest` | Canonical projections → prompt digest (explain-only) |
| Prompt (`system` / `user` / essenceAction*) | Friend register, evidence-bridge advice, friend soft-wash ban |
| `postValidateNarrative.ts` | Naming / B-self / bridge fallback / low-conf / friend soft-wash |
| Wire | `runFriendSocialDeepAnalysis` → `meta.friend_saju_deep` |

**Format remains** Friend social deep (`FRIEND_SOCIAL_DEEP_FORMAT`).  
**Self-refine second LLM pass:** OFF.  
**Kill switch:** `RELATIONSHIP_FRIEND_NARRATIVE=0` skips overlay (rule-only preserved).

---

## 2. Architecture (locked)

```text
Facts → Friendship CE resolvers → canonical_projections + context_output
  → buildFriendHouseholdDigest (server-only)
  → friendSajuDeep LLM (explain-only JSON)
  → postValidateFriendNarrative
  → report.meta.friend_saju_deep
  → persist (same friendship format)
  → strip context_output only (projections + overlay meta survive)
```

LLM must **not** mutate `canonical_projections` / compare bands / `treasurer` / `travel_planner`.

---

## 3. Style Bible Master Check (Parts 1–7 · 11 gates)

Targets (Round 2 fresh generations, `ko-KR`, overlay on friendship):

| Case | RR | Pair |
|------|-----|------|
| Same-report | `2e96c631-791b-4f89-bfd6-5a44f7b344cb` | 나 × 동글 |
| Independent | `0fe97964-d708-4e33-a55d-6fe894f45926` | 나 × 다시고고 |

| # | Gate | Same | Independent |
|---|------|------|-------------|
| 1 | Genre-clean (V2) | PASS | PASS |
| 2 | Claims traceable (V4) | PASS | PASS |
| 3 | Contrast real (V5) | PASS | PASS |
| 4 | Recognition before advice (V6) | PASS | PASS |
| 5 | Tier within ceiling (E2) | PASS | PASS |
| 6 | New understanding (V12) | PASS | PASS |
| 7 | Same narrator dialed (R0) | PASS | PASS |
| 8 | Friend band (R2) | PASS | PASS |
| 9 | Address fair (A0–A6) | PASS | PASS |
| 10 | Impact rung lawful (I0–I4) | PASS | PASS |
| 11 | Lexicon undrifted (L1–L4) | PASS | PASS |

### Product Round gates

- Blocking: no `나님`/`저님`, no B-self, no romance/marriage/family/business bleed, Mingli jargon stack 0, no punch-down humor / `절교각` fate framing
- Major: advice evidence bridge **6/6**; no friend soft-wash into “친구니까 무조건…”; rhythm/distance/upset gap remains audible
- Overlay attached; CE projections intact (compare ×6 + treasurer + travel_planner)

### Minor (accepted, not freeze blockers)

- UI not yet rendering `meta.friend_saju_deep` (attach-only Round 2)
- LLM may omit optional `section_2_nature` while shipping frames + action
- Rare everyday Korean that collides with ten-god syllables (e.g. 식상/비겁 as colloquial adjectives) — amend if repeated QA shows systemic Mingli bleed
- Occasional postValidate mismatch note guards (expected safety net)

---

## 4. Correction lineage

| Round | Role |
|-------|------|
| 1 | Module scaffold: prompts + postValidate + unit tests |
| 2 | CE digest adapter + `runFriendSocialDeepAnalysis` LLM overlay + live QA |
| *(this)* | Style Bible Master Check + freeze |

---

## 5. Amendment rule

Further change to frozen friend saju-deep prompts/validators/digest wire requires:

1. Repeated real-report QA failure (Style Bible L5 spirit), or ship blocker
2. Minimal patch preferred (narrow postValidate / one prompt clause)
3. Do **not** reopen Friendship CE (`019`/`020`), Style Bible Parts 1–7, or other domain freezes (`027`–`030`) without separate decision

---

## 6. Verdict

**FREEZE friend saju-deep relationship premium narrative module** (explain overlay on friendship social deep).

This closes the five-domain saju-deep narrative series (Romantic · Married · Family · Business · Friend).
