# 027 — Romantic saju-deep narrative freeze (Style Bible Master Check)

**날짜:** 2026-07-24  
**상태:** 확정 · Style Bible Master Check PASS · **동결**  
**범위:** `lib/prompts/relationshipPremium/romanticSajuDeep/*` (LLM narrative + deterministic post-validate)  
**비범위:** Context Engine / digest schema / Style Bible / non-Romantic domains (이미 `018` 등으로 별도 동결)

---

## 1. What is frozen

Romantic premium **saju-deep narrative generation** after Rounds 1–4:

| Layer | Role |
|-------|------|
| Prompt (`system` / `user` / essence* / specialBond / conflict) | Digest-bound epistemics, mismatch preservation, evidence-bridge advice, naming |
| `postValidateNarrative.ts` | Deterministic narrow guards (no second LLM self-refine) |
| Finalize wiring in `index.ts` | postValidate before canonical projection inject |

**Self-refine second LLM pass remains OFF.**

---

## 2. Style Bible Master Check (Parts 1–7 · 11 gates)

Targets (fresh Round-4+ generations, `ko-KR` / `romantic`):

| Case | RR | Pair |
|------|-----|------|
| Same-report | `2e96c631-791b-4f89-bfd6-5a44f7b344cb` | 나 × 동글 |
| Independent | `0fe97964-d708-4e33-a55d-6fe894f45926` | 나 × 다시고고 |

| # | Gate | Same | Independent |
|---|------|------|-------------|
| 1 | Genre-clean (V2) | PASS | PASS† |
| 2 | Claims traceable (V4) | PASS | PASS |
| 3 | Contrast real (V5) | PASS | PASS |
| 4 | Recognition before advice (V6) | PASS | PASS |
| 5 | Tier within ceiling (E2) | PASS | PASS |
| 6 | New understanding (V12) | PASS | PASS |
| 7 | Same narrator dialed (R0) | PASS | PASS |
| 8 | Romantic band (R2) | PASS | PASS |
| 9 | Address fair (A0–A6) | PASS | PASS |
| 10 | Impact rung lawful (I0–I4) | PASS | PASS |
| 11 | Lexicon undrifted (L1–L4) | PASS | PASS |

† Pre-check found few-shot `together` bleed on independent → fixed by structural few-shot + fingerprint rewrite.  
‡ Freeze regen found `b_nature.description` B-self (`동글과의`) slip → postValidate now covers `description` as well as `first_person_voice` / `b_hidden.*`. Re-verified same-report.

### Product Round gates (still green)

- Blocking: no `나님`/`저님`, no B self-as-partner, audible mismatch, particle `동글가` absent
- Major: no reassurance soft-wash into present mutual comfort; advice evidence bridge **6/6**; low-conf expression/conflict/stress tentative
- Mingli terms / nature-metaphor tells in LLM sections: 0

### Minor (accepted, not freeze blockers)

- Occasional reassurance sentences name current felt presence while still closing with verify/repair language
- Low-conf hedge suffix can read slightly templated
- `section_1_summary` remains Headline Selector / server-owned (out of LLM saju-deep body)

---

## 3. Correction lineage (prompt module)

| Commit | Role |
|--------|------|
| `705378f` | Round 1 — digest epistemics + naming |
| `0e73380` | Round 2 — canonical / speaker adherence |
| `75aa23d` | Particle fix (`이/가`) |
| `951450e` | Round 3 — mismatch body + evidence-bound advice |
| `0e771ee` | Round 4 — advice bridge generalization |
| *(this)* | Master Check freeze + few-shot `together` bleed guard |

---

## 4. Amendment rule

Further change to frozen Romantic saju-deep prompts/validators requires:

1. Repeated real-report QA failure (Style Bible L5 spirit), or ship blocker
2. Minimal patch preferred (narrow postValidate / one prompt clause)
3. Do **not** reopen Style Bible Parts 1–7 or Context Engine without separate decision

---

## 5. Verdict

**FREEZE Romantic saju-deep relationship premium narrative module.**
