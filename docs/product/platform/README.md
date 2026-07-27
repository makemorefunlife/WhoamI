# Relationship Platform Capability Audits

**Purpose:** Platform knowledge base for Product Design Freeze and future domain 05 / 06 / 07 documents.  
**Method:** Reverse-engineering (engineering + product), Romantic-audit quality bar.  
**Not:** Implementation, redesign, locked Product/Technical blueprints, or preparation inventories alone.

| Domain | Document | Runtime kind | Notes |
|--------|----------|--------------|-------|
| Friend | [`FRIEND_PLATFORM_AUDIT.md`](./FRIEND_PLATFORM_AUDIT.md) | `friendship` | Social DNA / travel / treasurer |
| Work | [`WORK_PLATFORM_AUDIT.md`](./WORK_PLATFORM_AUDIT.md) | `work` | Office partnership; loop is derived remix |
| Family | [`FAMILY_PLATFORM_AUDIT.md`](./FAMILY_PLATFORM_AUDIT.md) | `family` | One schema + Track A/B perspectives |
| Cohabitation | [`COHABITATION_PLATFORM_AUDIT.md`](./COHABITATION_PLATFORM_AUDIT.md) | `cohabitation` | **Engineering primary** for household CE |
| Marriage | [`MARRIAGE_PLATFORM_AUDIT.md`](./MARRIAGE_PLATFORM_AUDIT.md) | `cohabitation` | **Same runtime**; product-lens document |

**Romantic:** Completed separately — use as quality reference only (not duplicated here).

---

## How to read each audit

Every domain file contains:

1. Executive Summary  
2. Capability Map  
3. Full Pipeline Audit (Engine → … → User)  
4. Report Usage Audit  
5. Hidden Opportunities  
6. Structural Problems  
7. Reuse Opportunities  
8. Important Findings (evidence for Product / UX / Visual / Architecture / 05–07 — **no decisions**)

---

## Platform-wide evidence themes

These recur across Friend, Work, Family, and Cohabitation/Marriage:

| Theme | Observation |
|-------|-------------|
| CE + explain overlay | Deterministic body SSOT; LLM Deep Read optional and freeze-scoped |
| Context Output | Built richly, **stripped for client**, rarely/never UI-consumed |
| Canonical projections | Client-safe typed labels (compare, leadership, CFO, travel, treasurer) |
| Dual renderers | ViewModel path vs legacy JSX — module parity risk |
| Shared spine | Deep Read, TriScore, Prescriptions, Psych radar, premium-by-kind |
| Naming debt | Kind keys ≠ type prefixes ≠ overlay names ≠ UI labels (worst: Marriage) |
| Hidden value | Confidence fields, killer questions, CO categories, unused overlay schema fields |

---

## Marriage vs Cohabitation

**Evidence:** One `DeepAnalysisKind` / `RelationshipKind`: `cohabitation`.  
`MARRIAGE_PLATFORM_AUDIT.md` and `COHABITATION_PLATFORM_AUDIT.md` describe the **same engine** from product vs engineering emphasis. Do not assume two pipelines.

---

## Related materials

- Preparation inventories (earlier stage): `docs/product/prep/`  
- Shared constitution: `docs/product/05_Relationship_Product_Bible.md`  
- Romantic locked drafts (reference): `docs/product/05A_*`, `06A_*`, `07A_*`

---

## Status

Research only. Not committed by requirement of the audit task; treat as working knowledge base until Product Design Freeze.
