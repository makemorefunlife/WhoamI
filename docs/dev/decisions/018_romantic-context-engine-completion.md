# 018 — Romantic Context Engine completion

**날짜:** 2026-07-24  
**상태:** 확정 · 통합 검증 READY  
**구현 커밋:** `52f2913 Complete Romantic canonical authority wiring`  
**검증 판정:** READY

---

## 1. Final Romantic pipeline

```text
Facts / PersonCore signals / survey axes
  → domain resolvers & refineCompare*Pair (judgment SSOT)
  → romantic_context_input.dominant_categories
  → CanonicalJudgment wrap → client projection
  → finalize inject (server wins over any LLM projection)
  → persist (context retained server-side)
  → strip/omit romantic_context_input for client
  → UI typed badge/chip from canonical_projections
  → LLM prose fields remain explanation only
```

Prepare owns deterministic judgment. Finalize injects projections after the LLM
spread. The LLM never becomes the client-visible classification authority.

---

## 2. Server-owned canonical judgments

Persisted under `report.canonical_projections` (client-safe):

| Key | Authority |
|-----|-----------|
| `balance_of_power` | dynamics balance + subleads |
| `recovery_speed` | recovery bands / mismatch only |
| `residual` | residual bands (independent of recovery; Option B) |
| `reassurance_signal` | need / give / match |
| `unconscious_role_play` | primary_frame / saju_frame / agrees |
| `expression_speed` | direction (+ optional residual corroboration meta) |
| `comparison_table` | six independent rows: conflict, affection, stress, expression, decision, communication (`lean_a`/`lean_b`/`align`/`confidence`) |
| `saju_frame_direction` | existing `resolveSajuFrameDirection` + derived `anchor_is_a` |

Dialogue faster/slower speaker slots are bound to `expression_speed.direction`
on finalize (and re-applied safely in UI). LLM wording fills server-assigned slots only.

---

## 3. LLM responsibility boundary

- **May write:** natural-language headline/body, comparison cell prose, dialogue lines, special-bond explanatory prose.
- **Must not own:** typed classification, lean/align/confidence, expression-speed direction, saju-frame direction / anchor role, dialogue speaker identity when direction is A or B.
- Prompt copy may reinforce SSOT; typed authority does not depend on prompt compliance.

---

## 4. UI authority rule

- Typed chips/badges read **only** `canonical_projections.*` via `read*` helpers.
- Never derive classification by parsing LLM prose.
- Conflicting or malformed LLM text/projections cannot change the displayed typed judgment after server inject.

---

## 5. Cache and legacy fallback

- **Regenerated / new reports:** projections survive `stripRomanticContextInputForClient` / `omitRomanticContextInputFromReport`; context input is removed for clients, projections remain.
- **Legacy cache without new keys:** prose-only rendering; missing projection → no badge/chip invent; dialogue order preserved when direction is `balanced` or absent; special-bond prose still renders.
- **Malformed projection fragments:** invalid rows/keys dropped; valid sibling keys kept; null inject removes only its own key.

---

## 6. Integration cases that passed

Verified on prepare → finalize-equivalent inject → strip/omit → UI read path:

1. Real pair with directional `expression_speed` — six comparison rows, chips from canonical, dialogue A-first, prior dynamics/frames cards intact, grade/summary server-owned.
2. Full A/B reverse — compare leans swap; expression direction reverses; dialogue faster slot follows.
3. Balanced / null edges — balanced direction preserves dialogue order; missing `saju_frame_direction` / `expression_speed` → safe prose-only; legacy cache without projections still renders.
4. Directional `saju_frame_direction` pair + reverse — badge follows canonical; prose cannot flip typed direction.
5. ko-KR / en-US labels differ; enums identical.

---

## 7. Non-template rule (hard)

**Romantic must not be used as a shared domain-judgment template.**

Do not lift Romantic resolvers, refine composites, projection shapes, or UI chip
semantics into Friend, Work, Marriage, Family, or a generic “relationship Context Engine.”

Each future relationship domain must own its own Context Engine.

**May share only:**

- facts and PersonCore inputs
- reusable low-level signals (when truly domain-agnostic)
- canonical infrastructure (`CanonicalJudgment` envelope conventions)
- transport patterns (prepare → inject → persist → strip → UI typed read)

**Must not share:** domain judgment logic, thresholds, row semantics, or cross-domain “one resolver for all kinds.”

---

## Related

- Implementation: `52f2913`
- Modules: `lib/relationship/romantic/*Canonical.ts`, `romanticDialogueTableBinding.ts`
- Finalize: `lib/prompts/relationshipPremium/romanticSajuDeep/index.ts`
- UI: `components/relationship/RomanticSajuDeepReportView.tsx`
