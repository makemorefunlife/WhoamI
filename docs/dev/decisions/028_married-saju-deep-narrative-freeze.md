# 028 — Married saju-deep narrative freeze (Style Bible Master Check)

**날짜:** 2026-07-24  
**상태:** 확정 · Style Bible Master Check PASS · **동결**  
**범위:**
- `lib/prompts/relationshipPremium/marriedSajuDeep/*` (LLM explain overlay + postValidate)
- `lib/relationship/marriageSajuPromptDigest.ts` (CE → digest adapter)
- `lib/prompts/relationshipPremium/cohabitation/index.ts` overlay wire-in  
**비범위:** Marriage Context Engine rule-only SSOT (`024`), Style Bible Parts 1–7, Romantic (`027`), non-marriage domains

---

## 1. What is frozen

Married / Cohabitation premium **saju-deep explain overlay** after Rounds 1–2:

| Layer | Role |
|-------|------|
| CE (`buildMarriageReport`) | Classifications SSOT — unchanged |
| `marriageSajuPromptDigest` | Canonical projections → prompt digest (explain-only) |
| Prompt (`system` / `user` / essenceAction*) | Household register, evidence-bridge advice, soft-wash ban |
| `postValidateNarrative.ts` | Naming / B-self / bridge fallback / low-conf / household soft-wash |
| Wire | `runCohabitationDeepAnalysis` → `meta.married_saju_deep` |

**Format remains** `cohabitation_household_deep_v1`.  
**Self-refine second LLM pass:** OFF.  
**Kill switch:** `RELATIONSHIP_MARRIED_NARRATIVE=0` skips overlay (rule-only preserved).

---

## 2. Architecture (locked)

```text
Facts → Marriage CE resolvers → canonical_projections + context_output
  → buildMarriedHouseholdDigest (server-only)
  → marriedSajuDeep LLM (explain-only JSON)
  → postValidateMarriedNarrative
  → report.meta.married_saju_deep
  → persist (same cohabitation format)
  → strip context_output only (projections + overlay meta survive)
```

LLM must **not** mutate `canonical_projections` / CFO side / compare bands.

---

## 3. Style Bible Master Check (Parts 1–7 · 11 gates)

Targets (Round 2 fresh generations, `ko-KR`, overlay on cohabitation):

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
| 8 | Marriage/Cohab band (R2) | PASS | PASS |
| 9 | Address fair (A0–A6) | PASS | PASS |
| 10 | Impact rung lawful (I0–I4) | PASS | PASS |
| 11 | Lexicon undrifted (L1–L4) | PASS | PASS |

### Product Round gates

- Blocking: no `나님`/`저님`, no B-self, no romance-bleed, Mingli 0
- Major: advice evidence bridge **6/6**; no household soft-wash into “이미 잘 맞춰 사는 부부”
- Overlay attached; CE projections intact (CFO + compare ×6)

### Minor (accepted, not freeze blockers)

- UI not yet rendering `meta.married_saju_deep` (attach-only Round 2)
- Occasional postValidate mismatch body rewrites (guards expected)

---

## 4. Correction lineage

| Round | Role |
|-------|------|
| 1 | Module scaffold: prompts + postValidate + unit tests |
| 2 | CE digest adapter + `runCohabitationDeepAnalysis` LLM overlay + live QA |
| *(this)* | Style Bible Master Check + freeze |

---

## 5. Amendment rule

Further change to frozen married saju-deep prompts/validators/digest wire requires:

1. Repeated real-report QA failure (Style Bible L5 spirit), or ship blocker
2. Minimal patch preferred (narrow postValidate / one prompt clause)
3. Do **not** reopen Marriage CE (`024`), Style Bible Parts 1–7, or Romantic (`027`) without separate decision

---

## 6. Verdict

**FREEZE married saju-deep relationship premium narrative module** (explain overlay on cohabitation deep).
