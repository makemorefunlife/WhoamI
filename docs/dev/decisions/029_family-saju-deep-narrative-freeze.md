# 029 — Family saju-deep narrative freeze (Style Bible Master Check)

**날짜:** 2026-07-24  
**상태:** 확정 · Style Bible Master Check PASS · **동결**  
**범위:**
- `lib/prompts/relationshipPremium/familySajuDeep/*` (LLM explain overlay + postValidate)
- `lib/relationship/familySajuPromptDigest.ts` (CE → digest adapter)
- `lib/prompts/relationshipPremium/familyParentChild/index.ts` overlay wire-in  
**비범위:** Family Context Engine rule-only SSOT (`025`/`026`), Style Bible Parts 1–7, Romantic (`027`), Married (`028`), non-family domains

---

## 1. What is frozen

Family Parent–Child premium **saju-deep explain overlay** after Rounds 1–2:

| Layer | Role |
|-------|------|
| CE (`buildFamilyParentReport`) | Classifications SSOT — unchanged |
| `familySajuPromptDigest` | Canonical projections → prompt digest (explain-only) |
| Prompt (`system` / `user` / essenceAction*) | Parent–child register, evidence-bridge advice, family soft-wash ban |
| `postValidateNarrative.ts` | Naming / parent·child self-as-other / bridge fallback / low-conf / family soft-wash |
| Wire | `runFamilyParentChildDeepAnalysis` → `meta.family_saju_deep` |

**Format remains** Family parent–child deep (`FAMILY_PARENT_CHILD_DEEP_FORMAT`).  
**Self-refine second LLM pass:** OFF.  
**Kill switch:** `RELATIONSHIP_FAMILY_NARRATIVE=0` skips overlay (rule-only preserved).

---

## 2. Architecture (locked)

```text
Facts → Family CE resolvers → canonical_projections + context_output
  → buildFamilyHouseholdDigest (server-only)
  → familySajuDeep LLM (explain-only JSON)
  → postValidateFamilyNarrative
  → report.meta.family_saju_deep
  → persist (same family format)
  → strip context_output only (projections + overlay meta survive)
```

LLM must **not** mutate `canonical_projections` / compare `band_parent`/`band_child`.

---

## 3. Style Bible Master Check (Parts 1–7 · 11 gates)

Targets (Round 2 fresh generations, `ko-KR`, overlay on family, parent-view mother):

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
| 8 | Family band (R2) | PASS | PASS |
| 9 | Address fair (A0–A6) | PASS | PASS |
| 10 | Impact rung lawful (I0–I4) | PASS | PASS |
| 11 | Lexicon undrifted (L1–L4) | PASS | PASS |

### Product Round gates

- Blocking: no `나님`/`저님`, no child/parent self-as-other slip, no romance/marriage CFO-chore bleed, Mingli 0, no `문제 자녀/문제 부모`
- Major: advice evidence bridge **6/6**; no family soft-wash into “무조건 사랑하는 가족이니까…”; generation gap remains audible
- Overlay attached; CE projections intact (compare ×6 family rows)

### Minor (accepted, not freeze blockers)

- UI not yet rendering `meta.family_saju_deep` (attach-only Round 2)
- LLM may omit optional `section_2_nature` while still shipping frames + action (schema permits; primary gates on §4/§5)
- Display name literally `나` can make child-voice `나와의` ambiguous — Style Bible already defers Family address edge cases; not a ship blocker for this freeze
- Occasional postValidate mismatch / naming guards (expected safety net)

---

## 4. Correction lineage

| Round | Role |
|-------|------|
| 1 | Module scaffold: prompts + postValidate + unit tests |
| 2 | CE digest adapter + `runFamilyParentChildDeepAnalysis` LLM overlay + live QA |
| *(this)* | Style Bible Master Check + freeze |

---

## 5. Amendment rule

Further change to frozen family saju-deep prompts/validators/digest wire requires:

1. Repeated real-report QA failure (Style Bible L5 spirit), or ship blocker
2. Minimal patch preferred (narrow postValidate / one prompt clause)
3. Do **not** reopen Family CE (`025`/`026`), Style Bible Parts 1–7, Romantic (`027`), or Married (`028`) without separate decision

---

## 6. Verdict

**FREEZE family saju-deep relationship premium narrative module** (explain overlay on family parent–child deep).
