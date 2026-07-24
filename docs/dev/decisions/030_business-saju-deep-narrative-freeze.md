# 030 — Business saju-deep narrative freeze (Style Bible Master Check)

**날짜:** 2026-07-24  
**상태:** 확정 · Style Bible Master Check PASS · **동결**  
**범위:**
- `lib/prompts/relationshipPremium/businessSajuDeep/*` (LLM explain overlay + postValidate)
- `lib/relationship/businessSajuPromptDigest.ts` (CE → digest adapter)
- `lib/prompts/relationshipPremium/workColleague/index.ts` overlay wire-in  
**비범위:** Work Context Engine rule-only SSOT (`021`/`022`), Style Bible Parts 1–7, Romantic (`027`), Married (`028`), Family (`029`), non-work domains

---

## 1. What is frozen

Business / Partnership premium **saju-deep explain overlay** after Rounds 1–2:

| Layer | Role |
|-------|------|
| CE (`buildWorkColleagueReport`) | Classifications SSOT — unchanged |
| `businessSajuPromptDigest` | Canonical projections → prompt digest (explain-only) |
| Prompt (`system` / `user` / essenceAction*) | Work/business register, evidence-bridge advice, business soft-wash ban |
| `postValidateNarrative.ts` | Naming / B-self / bridge fallback / low-conf / business soft-wash |
| Wire | `runWorkColleagueDeepAnalysis` → `meta.business_saju_deep` |

**Format remains** Work colleague deep (`WORK_COLLEAGUE_DEEP_FORMAT`).  
**Self-refine second LLM pass:** OFF.  
**Kill switch:** `RELATIONSHIP_BUSINESS_NARRATIVE=0` skips overlay (rule-only preserved).

---

## 2. Architecture (locked)

```text
Facts → Work CE resolvers → canonical_projections + context_output
  → buildBusinessHouseholdDigest (server-only)
  → businessSajuDeep LLM (explain-only JSON)
  → postValidateBusinessNarrative
  → report.meta.business_saju_deep
  → persist (same work format)
  → strip context_output only (projections + overlay meta survive)
```

LLM must **not** mutate `canonical_projections` / compare bands / `leadership_split`.

---

## 3. Style Bible Master Check (Parts 1–7 · 11 gates)

Targets (Round 2 fresh generations, `ko-KR`, overlay on work):

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
| 8 | Work/Business band (R2) | PASS | PASS |
| 9 | Address fair (A0–A6) | PASS | PASS |
| 10 | Impact rung lawful (I0–I4) | PASS | PASS |
| 11 | Lexicon undrifted (L1–L4) | PASS | PASS |

### Product Round gates

- Blocking: no `나님`/`저님`, no B-self, no romance/marriage/family bleed, Mingli jargon stack 0, no corporate fog (“시너지 창출이 요구됩니다”)
- Major: advice evidence bridge **6/6**; no business soft-wash into “서로 믿으면 된다”; role/risk/reporting gap remains audible
- Overlay attached; CE projections intact (compare ×6 + leadership_split)

### Minor (accepted, not freeze blockers)

- UI not yet rendering `meta.business_saju_deep` (attach-only Round 2)
- LLM may omit optional `section_2_nature` while shipping frames + action
- Rare CE band tokens (e.g. 관성/재성) may appear in prose; not treated as ship blocker this freeze — amend if repeated QA shows systemic Mingli bleed
- Occasional postValidate mismatch body guards (expected safety net)

---

## 4. Correction lineage

| Round | Role |
|-------|------|
| 1 | Module scaffold: prompts + postValidate + unit tests |
| 2 | CE digest adapter + `runWorkColleagueDeepAnalysis` LLM overlay + live QA |
| *(this)* | Style Bible Master Check + freeze |

---

## 5. Amendment rule

Further change to frozen business saju-deep prompts/validators/digest wire requires:

1. Repeated real-report QA failure (Style Bible L5 spirit), or ship blocker
2. Minimal patch preferred (narrow postValidate / one prompt clause)
3. Do **not** reopen Work CE (`021`/`022`), Style Bible Parts 1–7, Romantic (`027`), Married (`028`), or Family (`029`) without separate decision

---

## 6. Verdict

**FREEZE business saju-deep relationship premium narrative module** (explain overlay on work colleague deep).
