# Relationship Incremental Enrichment — Phase 0–2 Audit

> **목적:** Friend / Work / Family / Partner(marriage·cohabitation) production 경로의 연결 상태·연구 질문 커버리지·Phase 2 gap 분류를 **증거 기반**으로 고정한다.  
> **범위:** `sprint/relationship-incremental-enrichment` worktree (`c:\dev\WhoamI-enrichment`)  
> **작성:** 2026-08-05  
> **상태:** Audit only — **코드 변경 없음**  
> **관련:** `docs/product/05B`–`05E`, `docs/product/05_Relationship_Product_Bible.md`, Domain Lenses / Narrative Composer 코드

---

## Executive Summary / 핵심 판정

| 주장 (Ideal) | 현실 (Production) |
|--------------|-------------------|
| SSOT → Personal CE → Pair CE → Domain Lens → Canonical → Story Planner → Narrative → UI | **미완성 연결.** Prod UI는 **V1 CE builders → ViewModel → SectionRenderer** |
| Personal CE가 4 domains에 증거로 살아 있음 | **Missing Evidence** (Friend/Work/Family/Partner prod) |
| Pair CE `pairLens`가 소비됨 | context에 **attach** (work/family/friend)되나 **never consumed** → Missing Evidence |
| Domain Lenses (34)가 화면의 주 소스 | **implemented + unit-tested**, prod UI **Not Rendered** |
| 7-scene Story Planners | **on main**, prod UI **Not Rendered** |
| Narrative Composers | branch에 **RESTORE** (`a6ebead`), prod UI **Not Rendered** |
| V1 Gold | **live** in production CE path |

**스프린트 함의:** 엔진 재설계 없이, **이미 렌더되는 V1 섹션에 증거를 보강**하는 incremental enrichment가 맞다. Full Domain Lens FE 교체는 **DEFER** (Product decision).

---

## 0. Classification Legend / 분류 범례

| Label | Meaning |
|-------|---------|
| **Fully Connected** | Typed path reaches SectionRenderer (or equivalent live UI) with meaningful content |
| **Partially Connected** | Built and rendered, but thin / indirect / under-uses available signals |
| **Legacy Asset** | V1 Gold (or older CE) still live and driving prod; not the ideal chain |
| **Not Rendered** | Exists (code/tests/main) but no production UI consumer |
| **Missing Evidence** | Attached/computed somewhere, or expected by ideal architecture, but no verified consumer in these 4 domains' prod path |

### Phase 2 Gap Actions (ONLY these)

| Action | Use when |
|--------|----------|
| `KEEP_CURRENT` | Already adequate / intentional; do not touch this sprint |
| `STRENGTHEN_LOGIC` | Section exists; deepen signal→copy without new IA |
| `ADD_TO_EXISTING_SECTION` | Fold missing question into a live section |
| `ADD_NEW_SECTION` | New card required (avoid unless unavoidable) |
| `RESTORE_V1_GOLD` | Bring back proven V1/narrative asset onto the branch/path |
| `DEFER` | Needs product/engine decision; out of sprint redesign scope |
| `DELETE_CANDIDATE` | Truly redundant dead weight (prefer KEEP if still used) |

---

## 1. Architecture Reality / 아키텍처 현실

```text
Ideal (설계 SSOT chain — NOT fully connected in prod):
  SSOT → Personal CE → Pair CE → Domain Lens → Canonical
       → Story Planner (7-scene) → Narrative Composer → UI

Production (Friend / Work / Family / Partner):
  V1 CE builders → ViewModel sections → SectionRenderer
  (+ V1 Gold assets remain live on this CE path)
```

| Layer | Status | Evidence class |
|-------|--------|----------------|
| V1 CE → ViewModel → SectionRenderer | **Live production UI** for 4 domains | Fully Connected (as the *actual* stack) / Legacy Asset relative to ideal |
| Personal CE (4 domains) | Expected by ideal; not evidenced in prod consumers | **Missing Evidence** |
| Pair CE `pairLens` | Attached on work / family / friend contexts | **Missing Evidence** (never consumed) |
| Domain Lenses ×34 | Implemented, unit-tested | **Not Rendered** |
| Story Planners (7-scene) | Present on main | **Not Rendered** |
| Narrative Composers | Restored on this branch (`a6ebead`) | **Not Rendered** (RESTORE done; wire still open) |
| V1 Gold assets | Live on production CE path | **Legacy Asset** (still the serving path) |

**Branch note:** `a6ebead` — `feat(domainLenses): restore KO/EN 7-scene narrative composers`  
→ `RESTORE_V1_GOLD` **done on branch** for composers; production UI still does not render them.

---

## 2. Domain Inventory — Sections & Lenses

### 2.1 Friend (05B)

**Production sections**

| Section | Classification | Notes |
|---------|----------------|-------|
| `snapshot` | Partially Connected | Live; candidate host for “when friendship best / shine” |
| `compare_table` | Fully Connected | Live comparison surface |
| `psych_radar` | Fully Connected | 11-axis psych surface |
| `social_dna` | Partially Connected | Live; taste / comfort enrichment candidate |
| `soulmate` | Partially Connected | Live mutual-value flavor |
| `play_money` | Partially Connected | Live lifestyle/spend play |
| `hidden_flow` | Partially Connected | Live; shine / when-best enrichment candidate |
| `deep_read` | Partially Connected | Live deep narrative (V1 Gold path) |
| `breakup_guide` | Partially Connected | Live friction/exit care |
| `de_escalation` | Fully Connected | Live repair scripts |
| `prescription` | Fully Connected | Live closing actions |

**Domain Lenses (Not Rendered in prod UI)**

| Lens | Classification |
|------|----------------|
| `friend_core_vibe` | Not Rendered |
| `friend_treasurer_split` | Not Rendered |
| `friend_travel_lead` | Not Rendered |
| `friend_emotional_vent` | Not Rendered |
| `friend_jealousy_guard` | Not Rendered |
| `friend_comfort_distance` | Not Rendered → Phase 2: fold into compare / DNA |
| `friend_taste_shared` | Not Rendered → Phase 2: fold into compare / DNA |
| `friend_repair_reconciliation` | Not Rendered |

**Cross-cutting Friend**

| Item | Classification |
|------|----------------|
| Personal CE | Missing Evidence |
| `pairLens` on friend context | Missing Evidence (attached, unused) |
| Friend narrative composer | Not Rendered (restored on branch) |
| Friend story planner | Not Rendered |

---

### 2.2 Work (05C)

**Production sections**

| Section | Classification | Notes |
|---------|----------------|-------|
| `snapshot` | Partially Connected | Live overview; overlaps thematically with loop |
| `psych_radar` | Fully Connected | Live |
| `compare_table` | Fully Connected | Live |
| `comparison` | Partially Connected | Live pair compare prose/table variant |
| `role_matrix` | Fully Connected | Role / leadership territory |
| `relationship_loop` | Partially Connected | Still built into ViewModel & typed; **KEEP_CURRENT** unless proven dead duplicate of snapshot |
| `deep_read` | Partially Connected | V1 Gold path |
| `warning` | Fully Connected | Pressure / awkwardness |
| `prescription` | Fully Connected | Closing actions |

**Domain Lenses (Not Rendered)**

| Lens | Classification |
|------|----------------|
| `work_leadership_split` | Not Rendered |
| `work_task_execution` | Not Rendered |
| `work_decision_style` | Not Rendered |
| `work_special_weapon` | Not Rendered (logic may already be partial elsewhere → STRENGTHEN if under-rendered in live sections) |
| `work_micromanage_guard` | Not Rendered |
| `work_stress_reaction` | Not Rendered |
| `work_feedback_cushion` | Not Rendered |
| `work_burnout_recovery` | Not Rendered |

**Cross-cutting Work**

| Item | Classification |
|------|----------------|
| Personal CE | Missing Evidence |
| `pairLens` on work context | Missing Evidence |
| Work narrative composer | Not Rendered (restored) |
| Work story planner | Not Rendered |
| `context_output` client strip | Intentional hygiene → **KEEP_CURRENT** |

---

### 2.3 Family (05D)

**Production sections**

| Section | Classification | Notes |
|---------|----------------|-------|
| `snapshot` | Partially Connected | Live |
| `relationship_index` | Fully Connected | Live index/grades surface (blueprint tension — see §3) |
| `compare_table` | Fully Connected | Live |
| `household_roles` | Fully Connected | Live |
| `psych_radar` | Fully Connected | Live |
| `child_dna` | Partially Connected | Praise-trigger enrichment candidate |
| `talent` | Partially Connected | Live |
| `growth_tunnel` | Partially Connected | Growth / maturity |
| `family_role` | Fully Connected | Live |
| `filial_frequency` | Partially Connected | Praise / filial enrichment candidate |
| `deep_read` | Partially Connected | V1 Gold path |
| `destiny` | Partially Connected | Live long-arc |
| `filial_reward` | Partially Connected | Live |
| `sos_script` | Fully Connected | Crisis scripts |
| `de_escalation` | Fully Connected | Live |
| `prescription` | Fully Connected | Live |

**Domain Lenses (Not Rendered)**

| Lens | Classification |
|------|----------------|
| `family_core_dynamic` | Not Rendered |
| `family_emotional_distance` | Not Rendered |
| `family_hidden_needs` | Not Rendered |
| `family_praise_trigger` | Not Rendered → Phase 2: fold into child_dna / filial |
| `family_household_roles` | Not Rendered |
| `family_discipline_friction` | Not Rendered |
| `family_safe_boundary` | Not Rendered |
| `family_crisis_recovery` | Not Rendered |

**Cross-cutting Family**

| Item | Classification |
|------|----------------|
| Personal CE | Missing Evidence |
| `pairLens` on family context | Missing Evidence |
| Family narrative composer | Not Rendered (restored) |
| Family story planner | Not Rendered |

---

### 2.4 Partner — Marriage / Cohabitation (05E)

**Production sections**

| Section | Classification | Notes |
|---------|----------------|-------|
| `origin_story` | Partially Connected | Why we chose each other |
| `household_snapshot` | Partially Connected | Shared-life overview |
| `compare_table` | Fully Connected | Live |
| `psych_radar` | Fully Connected | Live |
| `money_chores` | Partially Connected | Money/chores live; mental-load enrichment candidate |
| `deep_read` | Partially Connected | V1 Gold path |
| `bedroom` | Fully Connected | Intimacy |
| `home_dna` | Partially Connected | Home climate; mental-load / invisible-work candidate |
| `parenting` | Fully Connected | Alignment |
| `family_boundary` | Fully Connected | In-law / extended boundary |
| `weather_forecast` | Partially Connected | Stress weather |
| `privacy` | Fully Connected | Sanctuary / private space |
| `upset` | Fully Connected | Conflict trigger |
| `warning` | Fully Connected | Live |
| `prescription` | Fully Connected | Live |

**Domain Lenses (Not Rendered)**

| Lens | Classification |
|------|----------------|
| `partner_core_bond` | Not Rendered |
| `partner_tempo_rhythm` | Not Rendered |
| `partner_operating_cfo` | Not Rendered |
| `partner_household_chores` | Not Rendered |
| `partner_private_sanctuary` | Not Rendered |
| `partner_bedroom_intimacy` | Not Rendered |
| `partner_conflict_trigger` | Not Rendered |
| `partner_crisis_protector` | Not Rendered |
| `partner_longterm_vision` | Not Rendered |
| `partner_parenting_alignment` | Not Rendered |

**Cross-cutting Partner**

| Item | Classification |
|------|----------------|
| Personal CE | Missing Evidence |
| Pair CE / pairLens (partner path) | Missing Evidence relative to ideal chain (prod still V1 CE) |
| Partner narrative composer | Not Rendered (restored) |
| Partner story planner | Not Rendered |
| `context_output` client strip | **KEEP_CURRENT** |

---

## 3. Research Questions Coverage / 연구 질문 커버리지

Coverage labels: **already covered** | **partially covered** | **not covered**

### 3.1 Friend — six enduring questions (05B)

| # | Question | Coverage | Mapped live territory |
|---|----------|----------|------------------------|
| 1 | What does this friend bring into my life? | **partially covered** | soulmate / social_dna / snapshot / deep_read |
| 2 | What do I bring into this friend’s life? | **partially covered** | soulmate / compare / deep_read (asymmetric voice weak) |
| 3 | When does this friendship work at its best? | **not covered** | Shine territory — no dedicated “when best” beat |
| 4 | What becomes difficult between us, and why? | **partially covered** | breakup_guide / de_escalation / hidden_flow |
| 5 | How do we bring out the best in each other? | **partially covered** | prescription / de_escalation / deep_read |
| 6 | Who do we become when we are together? | **partially covered** | social_dna / soulmate / snapshot |

### 3.2 Work — five enduring questions (05C)

| Theme / question | Coverage | Notes |
|------------------|----------|-------|
| How do I naturally work? / role | **already covered** (partial→strong via role_matrix) | Leadership / role surfaces live |
| Feedback | **already covered** | warning / prescription / compare territory |
| Pressure / when work is awkward | **already covered** | warning / relationship_loop / deep_read |
| Collaboration map (“how we work together”) | **partially covered** (weak) | compare/comparison exist; map depth thin |
| Environment fit explorer | **not covered** | No dedicated environment-fit explorer in prod |
| Special weapon / where I create unique value | **partially covered** | May exist in CE/copy; lens `work_special_weapon` Not Rendered → STRENGTHEN if under-rendered |

### 3.3 Family — core human questions (05D, condensed)

| Theme | Coverage | Notes |
|-------|----------|-------|
| Identity / temperament (child·parent) | **partially covered** | child_dna / talent / deep_read |
| Communication / how to speak | **partially covered** | sos_script / de_escalation / prescription |
| Misunderstanding / conflict | **partially covered** | de_escalation / sos / deep_read |
| Expectations & roles | **already covered** (stronger) | family_role / household_roles |
| Growth & future | **partially covered** | growth_tunnel / destiny / talent |
| Environment fit (home pace, city/quiet, distance) | **partially covered** (weak) | No strong environment-fit explorer |
| Praise / what lands as love | **not covered** in UI | `family_praise_trigger` lens **Not Rendered** |
| Grades / relationship_index vs blueprint | **tension** | Index/grades live; blueprint prefers human questions over score-first — treat carefully (STRENGTHEN copy framing, not new score engine) |

### 3.4 Partner — five connected questions + shared-life gaps (05E)

| Theme | Coverage | Notes |
|-------|----------|-------|
| Why choose each other | **partially covered** | origin_story |
| Who we become building a life | **partially covered** | household_snapshot / home_dna / deep_read |
| How shared life runs (money / chores) | **already covered** | money_chores |
| Parenting alignment | **already covered** | parenting |
| Family / privacy boundary | **already covered** | family_boundary / privacy |
| Where love gets lost under stress | **partially covered** | weather / upset / warning |
| Mental load & invisible work | **not covered** | Blueprint § Mental Load — fold into money_chores or home_dna |
| Career sacrifice / support pattern | **not covered** | Blueprint sacrifice-vs-pattern territory |
| Leisure & shared enjoyment | **not covered** | Blueprint leisure module |

---

## 4. Phase 2 Gap Classification / Gap 분류표

Prioritize **evidence-backed** gaps that enrich **without redesigning the engine**.

| ID | Gap | Domain | Evidence | Action | Target / note |
|----|-----|--------|----------|--------|---------------|
| G01 | Narrative composers restored but unused in prod UI | All 4 | `a6ebead` on branch; Not Rendered | **RESTORE_V1_GOLD** | Done on branch; wiring to UI is separate — do **not** treat as FE Lens replacement |
| G02 | Friend “when best / shine” | Friend | Q3 not covered | **ADD_TO_EXISTING_SECTION** | `snapshot` or `hidden_flow` |
| G03 | Friend comfort distance + taste shared | Friend | Lenses Not Rendered; Q1/Q6 partial | **ADD_TO_EXISTING_SECTION** | `compare_table` or `social_dna` |
| G04 | Partner mental load / invisible work | Partner | 05E not covered | **ADD_TO_EXISTING_SECTION** | `money_chores` or `home_dna` |
| G05 | Family praise trigger | Family | Lens Not Rendered; praise theme not covered | **ADD_TO_EXISTING_SECTION** | `child_dna` or filial (`filial_frequency` / `filial_reward`) |
| G06 | Work special weapon under-rendered | Work | Lens Not Rendered; value-creation only partial | **STRENGTHEN_LOGIC** | Enrich live role/compare/deep_read — no new section |
| G07 | Full Domain Lens FE replacement (34 lenses as primary UI) | All 4 | Lenses Not Rendered by design of this sprint | **DEFER** | Product decision — not this sprint’s redesign |
| G08 | Timeline / horizon modules | Cross | Not in current prod section lists as live products | **DEFER** | Out of incremental enrichment |
| G09 | `context_output` stripped on client | Work / Partner (pattern) | Intentional strip helpers | **KEEP_CURRENT** | Do not re-expose raw context_output to client |
| G10 | `relationship_loop` vs `snapshot` duplication suspicion | Work | Both still in ViewModel / types / builder | **KEEP_CURRENT** | Prefer KEEP while still used; **DELETE_CANDIDATE** only if proven truly redundant |
| G11 | Personal CE missing in 4-domain prod | All 4 | Missing Evidence | **DEFER** | Engine wiring; not incremental section enrich |
| G12 | `pairLens` attached but unused | Friend / Work / Family | Missing Evidence | **DEFER** (or later STRENGTHEN if a live section can read one field without Lens FE) | Do not invent consumers without evidence plan |
| G13 | Story Planners 7-scene Not Rendered | All 4 | on main, unused in prod UI | **DEFER** | Tied to narrative/Lens product path |
| G14 | Friend Q2 asymmetry (“what I bring”) thin | Friend | partial | **STRENGTHEN_LOGIC** | soulmate / compare / deep_read voice balance |
| G15 | Work collaboration map weak | Work | partial | **STRENGTHEN_LOGIC** | compare / comparison / role_matrix depth |
| G16 | Work environment fit explorer | Work | not covered | **DEFER** or **ADD_TO_EXISTING_SECTION** only if a thin beat fits `role_matrix`/`prescription` without new IA | Prefer DEFER if it needs a new explorer UX |
| G17 | Family environment fit weak | Family | partial/weak | **ADD_TO_EXISTING_SECTION** (light) or **DEFER** | Prefer light copy in growth/household; avoid new explorer |
| G18 | Family grades vs blueprint tension | Family | relationship_index live | **STRENGTHEN_LOGIC** | Reframe copy toward human questions; do not expand scoring |
| G19 | Partner career sacrifice | Partner | not covered | **DEFER** or **ADD_TO_EXISTING_SECTION** | Prefer later; if cheap, one beat in deep_read / weather — avoid ADD_NEW_SECTION |
| G20 | Partner leisure / shared enjoyment | Partner | not covered | **DEFER** or **ADD_TO_EXISTING_SECTION** | Candidate: home_dna / household_snapshot — only if evidence exists |
| G21 | V1 Gold remains live serving path | All 4 | Architecture reality | **KEEP_CURRENT** | This sprint enriches *on top of* V1 path, does not rip it out |

### Sprint priority (evidence-backed, no engine redesign)

1. **G02** Friend shine / when-best → `snapshot` | `hidden_flow`  
2. **G03** Friend comfort_distance + taste_shared → `compare_table` | `social_dna`  
3. **G04** Partner mental load → `money_chores` | `home_dna`  
4. **G05** Family praise trigger → `child_dna` | filial sections  
5. **G06** Work special weapon → STRENGTHEN existing  
6. **G01** Composers = RESTORE done; do not confuse with Lens FE  
7. Everything Lens-FE / Personal CE / pairLens / planners / horizon → **DEFER**

---

## 5. What This Sprint Is / Is Not

### Is (Incremental Enrichment)

- Keep production stack: **V1 CE → ViewModel → SectionRenderer**
- Add or strengthen **copy/signal beats inside existing sections**
- Use Domain Lens / Narrative outputs only as **optional evidence sources** if a thin, tested read is safe — not as UI replacement
- Respect `context_output` strip (**KEEP_CURRENT**)

### Is Not

- Replacing SectionRenderer with Domain Lens FE (**DEFER**)
- Completing ideal SSOT→…→UI chain for Personal CE / pairLens (**Missing Evidence → DEFER**)
- Shipping Story Planner / Narrative Composer as the primary prod shell this sprint (**Not Rendered**; restore ≠ render)
- New timeline/horizon product modules (**DEFER**)
- Deleting `relationship_loop` without proof of redundancy (**KEEP_CURRENT**)

---

## 6. Counts Snapshot / 수량 요약

| Bucket | Friend | Work | Family | Partner | Total notes |
|--------|--------|------|--------|---------|-------------|
| Prod sections listed | 11 | 9 | 16 | 15 | All reach SectionRenderer path (Fully or Partially) |
| Domain Lenses | 8 | 8 | 8 | 10 | **34** — all **Not Rendered** in prod UI |
| Personal CE | — | — | — | — | **Missing Evidence** ×4 domains |
| pairLens consumed | — | — | — | — | **Missing Evidence** (attach≠consume) |
| Narrative composers | restored | restored | restored | restored | **Not Rendered**; RESTORE_V1_GOLD on branch |
| Story planners | — | — | — | — | **Not Rendered** |

---

## 7. Open Product Decisions (out of Phase 2 code)

| Decision | Why it blocks |
|----------|----------------|
| Domain Lens as primary FE vs evidence-only | Full FE replacement = redesign |
| Whether Narrative Composer / 7-scene becomes the shell | Restored ≠ product-adopted |
| Personal CE / pairLens mandatory for these 4 domains | Currently Missing Evidence in prod |
| Family score/index prominence vs blueprint “questions first” | STRENGTHEN framing vs product kill of grades |
| Work environment-fit explorer as module vs copy beat | DEFER vs ADD_TO_EXISTING |

---

## 8. Sources / 근거

- Production UI pattern: `components/relationship/{friend,workColleague,familyParent,marriage}/sections/SectionRenderer.tsx`
- Domain Lenses root: `lib/relationship/domainLenses/` (34 lenses; narrative composers restored in `a6ebead`)
- pairLens attach examples: `buildFriendRuleContext.ts`, `buildFamilyRuleContext.ts`, `buildWorkColleagueContext.ts`
- Client strip: `stripWorkContextOutputForClient.ts`, `stripMarriageContextOutputForClient.ts`
- Blueprints: `docs/product/05B_Friend_Product_Blueprint.md`, `05C_Work_…`, `05D_Family_…`, `05E_Partnership_…`
- Branch: `sprint/relationship-incremental-enrichment`

---

*End of Phase 0–2 audit. No code changes in this document’s scope.*
