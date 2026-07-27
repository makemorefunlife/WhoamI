# 08. Current Product Implementation & Design Extraction

**Purpose:** Second-round visual design exploration input — repository-backed description of Ahaitsme as it **currently exists**, not as aspirational specs describe it.  
**Scope:** Relationship products (Romantic, Family, Friend, Work/Coworker, Cohabitation/Marriage) plus prerequisite Blueprint/onboarding spine.  
**Method:** Read-only inspection of `docs/product/`, `app/`, `components/relationship/`, `lib/relationship/`, and supporting i18n/API routes. No code changes.  
**Date:** 2026-07-27  
**Scope discipline (added 2026-07-27, per the canonicalization refactor — see `10`):** this document owns **current implementation only**. It contains no product philosophy (→ `05`), no visual/brand rule authority (→ `06`), and no design intent, rationale, or open decisions (→ `09`). Where earlier drafts of this document carried "must preserve / may reinterpret / must not invent" framing or open design questions, those have moved to `09` §3 / §6 — this document keeps only the underlying facts they were based on.

---

## 1. Executive Summary

Ahaitsme is a Next.js application with two visual registers in production:

1. **Stitch (light/cream)** — landing, onboarding, Blueprint preview, relationship hub, and Romantic premium reports (`ReportSurfaceProvider surface="stitch"`).
2. **Space (dark/glass)** — non-Romantic premium relationship reports (`surface="dark"`), legacy space-themed globals elsewhere.

The **relationship user journey** is implemented end-to-end for signed-in users: Blueprint prerequisite → `/relationships` hub → partner add (manual or invite) → kind selection → `/relationship/[id]` → auto basic analysis → premium generation → kind-specific report view. Guest users can open pages but **all relationship APIs require Clerk auth** (`assertOwnedReportAccess`); guest merge is disabled.

All **five relationship kinds** have registered premium deep pipelines (`lib/relationship/relationshipAnalysisKinds.ts`, `relationshipKind.ts`): `romantic`, `work`, `cohabitation`, `friendship`, `family`. Marriage/cohabitation share one engine (`lib/relationship/marriage/`, kind key `cohabitation`).

**Implementation maturity varies:**

| Product | Premium pipeline | ViewModel + SectionRenderer | Doc alignment |
|---------|------------------|----------------------------|---------------|
| Friend | ✅ | ✅ | Moderate — legacy card names vs 9-module blueprint |
| Work | ✅ | ✅ | Low–moderate — 9 sections vs 15 documented modules; narrative pilot is experimental only |
| Family | ✅ | ✅ | Low — 16 sections, many legacy assets; doc modules (Translation Gap, Hero) missing |
| Cohabitation | ✅ | ✅ | Low — 15 legacy sections vs 8-chapter Partnership blueprint |
| Romantic | ✅ | ⚠️ Partial | Lowest UI parity — monolithic `RomanticSajuDeepReportView` (default); Experience V2 (`M1–M10`) flag-gated |

**Free vs premium:** Basic = LLM 4-axis perspectives (`POST /api/relationship/analyze/basic`). Premium = persisted deep report per kind (`POST /api/relationship/analyze/premium`). Paywall infrastructure exists but **MVP bypasses** when `PREMIUM_PAYWALL !== "true"` (`lib/product/premiumAccessPolicy.ts`).

**Design-system drift:** Documented Visual SSOT (`06_Visual_Design_System.md`) forbids grade dashboards and traffic-light score colors; Romantic brand accent is locked to Stitch emerald `#3a8f6e` (`06` §3.2 / L5). Production still shows **grade badges** and **traffic-light score bars** (`scoreBarAppearance.ts`). Romantic Stitch tabs already use emerald (`getStitchTabTheme`); remaining accent debt is **legacy dark-register peach** `#ffd6a5`, not a doc↔code green conflict.

This document is **ready to hand to Claude** for design exploration. Open product/design questions that code alone cannot resolve are tracked in `09_Product_and_Design_Intent_Package.md` §6, not in this document (this document is current-implementation fact only, per the canonicalization refactor — see `10`).

---

## 2. Authority and Source Map

### 2.1 Governing order

From `docs/product/README.md`:

```text
01_Product_Vision.md
→ 02_Relationship-ux-bible.md (also 02_Relationship_UX_Bible.md filename variant)
→ 05_Relationship_Product_Bible.md          (shared relationship experience SSOT)
→ 05A/B/C/D/E domain Product Blueprints     (domain product SSOT)
→ 06_Visual_Design_System.md                  (expression SSOT, VA-01…VA-09)
→ 06A/B/C/D/E Technical Blueprints
→ 07A/B/C/D/E Implementation Checklists
→ implementation code
```

`03_Market_Research.md` — supporting evidence, not above product principles.  
`05N_Ahaitsme_Narrative_Style_Bible.md` — narrative/tone SSOT; does not own classifications.

### 2.2 Authoritative documents (use for design exploration)

| Document | Owns | Path |
|----------|------|------|
| Product vision | Mission, boundaries | `docs/product/01_Product_Vision.md` |
| Relationship UX | Tone, narrative laws, confidence communication | `docs/product/02_Relationship-ux-bible.md` |
| Shared relationship IA | Journey, §13D visualization/evidence contract | `docs/product/05_Relationship_Product_Bible.md` |
| Romantic product | 10 modules, free/premium | `docs/product/05A_Romantic_Product_Blueprint.md` |
| Friend product | 9 modules, role/gift architecture | `docs/product/05B_Friend_Product_Blueprint.md` |
| Work product | 15 modules, collaboration map | `docs/product/05C_Work_Product_Blueprint.md` |
| Family product | 11 modules, parent/child perspective | `docs/product/05D_Family_Product_Blueprint.md` |
| Partnership (cohabitation) | 8 chapters, life-direction | `docs/product/05E_Partnership_Product_Blueprint.md` |
| Visual design | Tokens, VA library, component anatomy | `docs/product/06_Visual_Design_System.md` |
| Narrative style | Voice, evidence presentation | `docs/product/05N_Ahaitsme_Narrative_Style_Bible.md` |
| Technical contracts | Data ownership, strip rules, LLM boundaries | `06A`–`06E` under `docs/product/` |
| Implementation status | Checklists | `07A`–`07E` under `docs/product/` |

### 2.3 Supporting / non-governing (do not treat as SSOT)

| Document | Status | Path |
|----------|--------|------|
| Visual foundations (archived) | Historical only — use `06` | `docs/product/archive/ARCHIVE_Visual_Foundations.md` |
| Romantic module visual evaluation (archived) | Historical only — use `06` §6A | `docs/product/archive/ARCHIVE_Romantic_Module_Visual_Evaluation.md` |
| Integrated visual blueprint | **Superseded stub** — content in `05` | `docs/product/11_relationship_product_visual_blueprint_integrated.md` |
| Platform audits | Reverse-engineering, pre-freeze | `docs/product/platform/*.md` |
| Prep inventories | As-built before 05/06/07 | `docs/product/prep/*.md` |

### 2.4 Decision records (selected, relationship-relevant)

`docs/dev/decisions/` — CE completion, narrative freezes, compare-table design:

- `004_relationship-domain-parity.md`
- `005_compare-table-signal-layer-audit.md`
- `018_romantic-context-engine-completion.md`, `027_romantic-saju-deep-narrative-freeze.md`
- `019`–`020` friendship CE; `021`–`022` work CE; `030_business-saju-deep-narrative-freeze.md`
- `023`–`024`, `028` marriage/cohabitation CE
- `025`–`029`, `007`–`017` family CE and part boundaries

### 2.5 Code SSOT for runtime behavior

When docs and code conflict, **this extraction records code as "current"** and docs as "target" unless a decision record explicitly locks behavior.

| Concern | Code SSOT |
|---------|-----------|
| Relationship kinds | `lib/relationship/relationshipKind.ts` |
| Routes | `constants/routes.ts`, `lib/relationship/hubNavigation.ts` |
| Analysis surfaces (basic vs premium kind) | `lib/relationship/analysisSurface.ts` |
| Premium payloads by kind | `lib/relationship/premiumByKind.ts` |
| ViewModel section order | `lib/relationship/*/viewModel/build*ReportViewModel.ts` |
| Client-safe strip | `lib/relationship/*/strip*ContextOutputForClient.ts`, `stripRomanticContextInputForClient.ts` |

---

## 3. Repository-Backed Sitemap

Locale policy: `/` = en-US; `/kr/...` = ko-KR rewrite (`proxy.ts`, `lib/i18n/locale.ts`). API paths are never locale-prefixed.

### 3.1 Public / marketing

| Route | Page file | Role |
|-------|-----------|------|
| `/` | `app/page.tsx` → `app/homecontent.tsx` | Stitch landing, entry modal |
| `/about`, `/how-it-works`, `/pricing`, `/faq`, `/contact` | `app/*/page.tsx` | Marketing |
| `/terms`, `/privacy`, `/refund` | `app/*/page.tsx` | Legal (Stitch legal shell) |

### 3.2 Auth

| Route | Page | Provider |
|-------|------|----------|
| `/sign-in`, `/sign-up` | `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/...` | Clerk (`components/clerk/AppClerkProvider.tsx`) |

Middleware (`proxy.ts`): **`/account/*` only** is `auth.protect()`. Relationship routes are not middleware-protected; APIs enforce auth.

### 3.3 Self Blueprint (prerequisite for relationships)

| Route | Page | Key components |
|-------|------|----------------|
| `/survey-v2` | `app/survey-v2/page.tsx` | v2 10-question survey |
| `/survey-v2/complete` | `app/survey-v2/complete/page.tsx` | Birth input |
| `/onboarding/birth` | `app/onboarding/birth/page.tsx` | Legacy birth path |
| `/blueprint-preview` | `app/blueprint-preview/page.tsx` | Blueprint hub |
| `/blueprint-preview/[reportId]/current` | `app/blueprint-preview/[reportId]/current/page.tsx` | Current blueprint |
| `/blueprint-preview/[reportId]/essence` | `app/blueprint-preview/[reportId]/essence/page.tsx` | Essence |
| `/blueprint-preview/[reportId]/essence/deep` | `app/blueprint-preview/[reportId]/essence/deep/page.tsx` | Slim V1 deep |

APIs: `POST /api/report/create`, `POST /api/v2/survey`, `POST /api/report/birth`, `GET /api/home/resume`, `GET /api/v2/lite/*`, `POST /api/v2/deep/essence`.

### 3.4 Relationship hub & detail

| Route | Page | Key components |
|-------|------|----------------|
| `/relationships?myReportId=` | `app/relationships/page.tsx` → `RelationshipsDashboard.tsx` → `RelationHubDashboard.tsx` | Friend list, kind picker, sheets |
| `/relationship/[id]?viewer=&kind=&autostart=` | `app/relationship/[id]/page.tsx` → `RelationshipView.tsx` | Basic/premium tabs, report renderers |

### 3.5 Invite (partial)

| Route | Page | Status |
|-------|------|--------|
| `/invite?token=` | `app/invite/page.tsx` | Minimal stub — token display, home redirect |
| `/invite/accept` | `app/invite/accept/route.ts` | GET `"ok"` stub |
| — | `POST /api/invite/create`, `complete`, `cancel`, `status` | Create works; **complete not wired in UI** |

### 3.6 Account & decision journal

| Route | Page |
|-------|------|
| `/account`, `/account/profile`, `/account/billing` | `app/account/**` (profile/billing Clerk-protected) |
| `/decision`, `/decision/history` | Decision journal (outside relationship report IA) |

### 3.7 Dev-only (non-production UI)

| Route | Purpose |
|-------|---------|
| `/dev/work-report-viewmodel` | Work VM inspection |
| `/dev/cohabitation-prescription` | Cohabitation prescription dev |
| `/dev/psych-capture` | Psych capture dev |

### 3.8 Relationship API surface

All under `app/api/relationship/`:

| Method | Route | Role |
|--------|-------|------|
| POST | `/create` | Create relationship row |
| POST | `/manual` | Manual partner + proxy report |
| GET | `/list` | Hub friend list |
| GET | `/detail` | Detail + perspectives + deep reports (stripped) |
| POST | `/analyze/basic` | Free 4-axis LLM |
| POST | `/analyze/premium` | Premium deep generation |
| POST | `/upgrade` | Premium slot upgrade (secret-gated when paywall on) |
| GET | `/logs` | Analysis history |
| POST | `/favorite`, `/remove`, `/partner-name` | Hub actions |
| GET | `/status` | Lightweight status |
| POST | `/generate` | **Legacy** integrated text — not used by current hub flow |

---

## 4. End-to-End User Journey

For each step: **Route → Page → Components → API → State owner → Source files**.

### Step 1 — Landing / entry

| | |
|---|---|
| **Route** | `/` (or `/kr`) |
| **Page** | `app/page.tsx` → `HomeContent` (`app/homecontent.tsx`) |
| **Components** | `StitchLandingPage`, `StartChoiceModal`, `HomeAuthSignInPanel` (dynamic) |
| **API** | `GET /api/home/resume` via `loadReportSession()` |
| **State** | `HomeContent` local: `resume`, `relCounts`, modals; `localStorage.reportId` hint; `localStorage.inviteToken` from `?token=` |
| **Files** | `components/landing/stitch/StitchLandingPage.tsx`, `components/landing/stitch/StartChoiceModal.tsx`, `lib/home/reportSession.ts` |

### Step 2 — Product selection

| | |
|---|---|
| **Route** | `/` modal or Stitch side menu |
| **Components** | `StartChoiceModal` — paths to survey, sign-in, relationships hub |
| **State** | `resolveHubHrefForIntent("relationships")` (`lib/stitch/hubPaths.ts`) |
| **Note** | No separate `/products` route; relationship product entered via hub CTA after Blueprint |

### Step 3 — Relationship-type selection (premium kind)

| | |
|---|---|
| **Route** | `/relationships` overlay → navigates to detail |
| **Components** | `StitchKindPickerSheet` (`components/relationship/hub/StitchKindPickerSheet.tsx`) |
| **Kinds** | `romantic`, `work`, `cohabitation`, `friendship`, `family` (`relationshipKind.ts`) |
| **State** | `RelationHubDashboard` local `kindPickerTarget`; URL built by `buildRelationshipAnalyzeUrl()` (`lib/relationship/hubNavigation.ts`) |

### Step 4 — Participant input

| | |
|---|---|
| **Route** | `/relationships` sheets |
| **Components** | `AddFriendSheet` (invite / manual tabs), `ManualRelationshipForm`, `FriendStoryRow` |
| **API** | `POST /api/invite/create`, `POST /api/relationship/manual` |
| **State** | Hub dashboard; manual form local state |
| **Files** | `components/relationship/ManualRelationshipForm.tsx`, `components/relationship/hub/AddFriendSheet.tsx` |

**Invite path (partial):** Share URL `/invite?token=` → landing stores token → invitee completes own Blueprint. **`POST /api/invite/complete` not called from UI** — automatic relationship link incomplete.

### Step 5 — Birth-data input

| | |
|---|---|
| **Manual partner** | `ManualRelationshipForm` — `StitchBirthDateTimeFields`, 10-question survey or skip |
| **Self (prerequisite)** | `/survey-v2/complete` — birth date/time/place |
| **API** | `POST /api/relationship/manual`, `POST /api/report/birth` |
| **Rules** | `resolveBirthTimeForCharts` — unknown time → 12:00; astrology requires birth place (`AGENTS.md`, `resolveBirthChartInput`) |

### Step 6 — Validation

| | |
|---|---|
| **Client** | Form validation in `ManualRelationshipForm`, survey completion gates |
| **Server** | `assertOwnedReportAccess`, `assertOwnedViewerParticipantAccess` (`lib/report/assertOwnedReportAccess.ts`) |
| **Birth fallback notices** | Shown on detail when time/place unknown (`RelationshipView.tsx`) |

### Step 7 — Authentication / guest behavior

| | |
|---|---|
| **Provider** | Clerk — `AppClerkProvider`, `useUser`, `useAuth`, `useClerkReady` |
| **Guest** | Pages render; **APIs return 401** without Clerk session |
| **Disabled** | `mergeGuestAccountData()` throws; `POST /api/account/merge` → 403 |
| **Files** | `lib/home/mergeGuestAccount.ts`, `proxy.ts` |

### Step 8 — Analysis request

| | |
|---|---|
| **Route** | `/relationship/[id]?viewer={reportId}&kind={kind}&autostart=1` |
| **Hook** | `useRelationshipDetail` (`app/relationship/[id]/useRelationshipDetail.ts`) |
| **API** | `GET /api/relationship/detail`; auto `POST /api/relationship/analyze/basic` if empty; user/regen triggers `POST /api/relationship/analyze/premium` |
| **Overlay** | `RelationAnalyzeNavOverlay` during hub→detail transition |

### Step 9 — Loading / generation state

| | |
|---|---|
| **Components** | `RelationshipGeneratingPanel` (loading vs generating phases), `RelationAnalyzeNavOverlay` |
| **State** | `loading`, `busy`, `autostartActive` in `useRelationshipDetail` |
| **Files** | `components/relationship/detail/RelationshipGeneratingPanel.tsx` |

### Step 10 — Free result

| | |
|---|---|
| **Surface** | `analysisSurface === "basic"` |
| **Components** | `RelationshipKindTabs`, `RelationshipBasicCards` |
| **Data** | `perspective_basic` — 4 axes: `emotional_sensitivity`, `communication_style`, `conflict_response`, `energy_pattern` |
| **API** | `POST /api/relationship/analyze/basic` → `result_basic.perspectives[reportId]` |
| **Files** | `components/relationship/RelationshipBasicCards.tsx`, `lib/relationship/normalizeRelationshipPerspectives.ts` |

### Step 11 — Premium / deep result

| | |
|---|---|
| **Surface** | `analysisSurface` = premium kind |
| **Orchestrator** | `RelationshipPremiumSection` |
| **Views** | Kind-specific (see §6–9) |
| **API** | `POST /api/relationship/analyze/premium`; detail returns stripped deep bodies |
| **Regenerate** | `runPremium({ forceRegenerate: true })` |

### Step 12 — Locked states

| | |
|---|---|
| **Current** | **Mostly inactive** — `PREMIUM_PAYWALL !== "true"` auto-grants premium (`premiumAccessPolicy.ts`, `ensureRelationshipPremiumSlot`) |
| **When enabled** | Premium LLM 403; `GlowButton` generate CTA; `POST /api/relationship/upgrade` with `RELATIONSHIP_UPGRADE_SECRET` |
| **UI** | `RelationshipPremiumSection` empty state + generate button when `!premiumReady` |

### Step 13 — Sharing, saving, returning, re-analyze

| | |
|---|---|
| **Share invite** | `InviteShareButtons` — copy, WhatsApp, SMS, native share → `/invite?token=` |
| **Favorite** | `POST /api/relationship/favorite` — hub `FriendStoryRow`; detail hook has `toggleFavorite` |
| **History** | `RelationshipAnalysisHistory` + `GET /api/relationship/logs` — snapshot replay |
| **Rename (manual)** | `RenameFriendDialog` + `PATCH /api/relationship/partner-name` |
| **Return to hub** | `ROUTES.relationships` via shell nav |
| **Re-analyze** | Kind picker again → new premium run or regenerate |
| **Save report** | Persisted server-side in `relationship_reports` / `analysis_logs` — no explicit user "save" UI beyond favorites |

### Step 14 — Error, empty, fallback, unavailable

| State | Implementation |
|-------|----------------|
| Hub empty (no reportId) | `RelationHubActionButtons` `emptyHub` |
| Hub empty (no friends) | Same + add-friend CTA |
| Detail error | `useRelationshipDetail` `err`; retry via `retryAnalysis` |
| Premium generate fail | `RelationshipPremiumSection` `localError` |
| Premium empty | Kind-specific empty copy + generate CTA |
| Basic empty | `RelationshipBasicCards` empty state |
| ViewModel build fail | `*ReportView.tsx` falls back to legacy JSX + `console.error` |
| Module unavailable (Romantic V2) | `RomanticModuleBase.available === false` → omit (`romanticExperienceTypes.ts`) |
| Section missing in VM | Builder returns `null` → section omitted (fail-closed) |
| Birth unknown | Notice banners on detail |
| Narrative LLM fail | Server graceful fallback (per technical blueprints; preserved in pipelines) |

---

## 5. Global IA

### 5.1 Global navigation

| Surface | Nav pattern | Files |
|---------|-------------|-------|
| Stitch landing | `StitchFixedHeader`, `StitchSideMenu` | `components/layout/stitch/*` |
| Blueprint / survey | `StitchSurveyShell` | `components/survey/StitchSurveyShell.tsx` |
| Relationship hub | `RelationHubShell` header | `components/relationship/hub/RelationHubShell.tsx` |
| Relationship detail | `StitchSurveyShell` + in-page tabs | `RelationshipView.tsx` |
| Legacy space header | `Header`, `SideMenu` | `components/layout/Header.tsx` — less used on Stitch paths |

**No persistent bottom tab bar** in relationship flows. Mobile uses sheets (`AddFriendSheet`, `StitchKindPickerSheet`, `AllAnalysisSheet`).

### 5.2 Landing-page hierarchy

```
Hero (StitchLandingPage)
→ Start CTA → StartChoiceModal
   ├─ New user → survey-v2 → birth → blueprint-preview
   ├─ Sign in → Clerk
   └─ Relationships hub (requires reportId)
→ Footer links (about, pricing, legal)
```

Source: `app/homecontent.tsx`, `components/landing/stitch/StitchLandingPage.tsx`.

### 5.3 Product-selection hierarchy

Relationships are **not** a top-level product picker. Hierarchy:

```
Blueprint (self) → Relationships Hub → Select friend → Select kind → Detail report
```

Kind labels: `RELATIONSHIP_KIND_LABELS` in `relationshipKind.ts`.

### 5.4 Input flow IA

```
Add friend
├─ Invite tab: email/link share, sent requests sheet
└─ Manual tab: name, birth, optional survey skip
```

### 5.5 Report-level navigation

On `/relationship/[id]`:

1. **Header** — partner name, back to hub (`StitchSurveyShell`)
2. **`RelationshipKindTabs`** — `basic` (free) + current premium kind badge
3. **Family-only** — `RelationshipFamilyRolePanel` (parent type, child-is-viewer)
4. **Content** — Basic cards OR `RelationshipPremiumSection`
5. **History** — `RelationshipAnalysisHistory` (collapsible list)

No in-report section sidebar or sticky section nav. Long reports scroll vertically.

### 5.6 Section navigation (within premium reports)

| Pattern | Products |
|---------|----------|
| Vertical stack of cards | Friend, Work, Family, Cohabitation (SectionRenderer) |
| Part dividers (`PartHeading`) | All SectionRenderers + Romantic legacy |
| Monolithic Parts 1–5 | Romantic legacy (`RomanticSajuDeepReportView`) |
| Module sequence M1–M10 | Romantic Experience V2 (flag-gated) |

### 5.7 Mobile navigation

- Hub: horizontal `FriendStoryRow` (story-style avatars)
- Sheets for overflow actions (full friend list, all analyses)
- `hubTouchBtn`, `hubPanelClass` touch targets (`relationHubStyles.ts`)
- Report: single column, `min-w-[520px]` compare tables scroll horizontally

### 5.8 Free vs premium boundaries

| Tier | Content | Persistence |
|------|---------|-------------|
| **Basic (free)** | 4-axis LLM perspectives per viewer | `result_basic` |
| **Premium** | Full deep report per kind | `result_premium_by_kind.{kind}` |
| **Cross-kind** | Same relationship row; kinds cached separately | `premium_kinds_ready` on detail |

Basic is **shared across kinds** (one basic analysis). Premium is **per kind**.

Doc-defined free tiers (e.g. `05A` §12A Romantic signature-only) are **not separately implemented** — only basic vs full premium split exists in code.

### 5.9 Shared vs product-specific IA

**Shared across premium kinds:**

- TriScore snapshot panel (`TriScoreSnapshotPanel`)
- 11-axis psych radar (`RelationshipPsychMatchSection`)
- Saju compare table (6 rows, product-specific row IDs)
- Deep Read card (`DeepReadCard`) — all except Romantic Experience path
- Pair prescriptions (`PairPrescriptionSection`)
- De-escalation / warning patterns

**Product-specific:**

- Romantic: chemistry gauges, conflict scripts, strength/weakness, timeline (legacy); M1–M10 (V2)
- Family: parent/child fixed order, household roles, child DNA, filial frequency
- Work: office DNA, role matrix, relationship loop
- Cohabitation: origin story, bedroom, weather forecast, parenting

### 5.10 CTA hierarchy

| Priority | CTA | Location |
|----------|-----|----------|
| 1 | Start / Resume Blueprint | Landing |
| 2 | Add friend / Analyze | Hub |
| 3 | Select kind | Kind picker sheet |
| 4 | Generate premium | Detail when `!premiumReady` |
| 5 | Regenerate | Detail when report exists |
| 6 | Share invite | Hub invite tab |

### 5.11 Documentation vs code vs visible design discrepancies

| Topic | Documentation | Code / UI |
|-------|---------------|-----------|
| Entry IA | Module-first, no dashboard (`05`, `06`) | TriScore + grade opening on all premium kinds |
| Romantic accent | Brand emerald `#3a8f6e` on Stitch surfaces (`06` §3.2 / L5); prior peach `#E2C4A8` lock retired | Stitch tabs already `#3a8f6e`; dark-register peach `#ffd6a5` still present |
| Grade display | Forbidden (`06` §1.1, `05A`) | `OpeningBlock.grade` rendered in all `*ReportView` |
| Score bar colors | Traffic-light tiers fail (`06` L4 / §3.2) | `scoreBarAppearance.ts` green/amber/coral |
| Free tier richness | Per-product free modules in 05A/B/C | Only generic 4-axis basic |
| Partnership naming | `05E` Partnership | Code kind `cohabitation`, folder `marriage/` |
| Guest access | — | UI allows entry; APIs auth-gated |
| Invite completion | Implied full loop | UI stub; `invite/complete` unwired |

---

## 6. Romantic IA

### 6.1 Documented structure (`05A`, `06A`)

**10 modules + depth layer:**

M1 Opening → M2 Hidden Heart → M3 Special → M4 Difference Map → M5 Flow → M6 Conflict Translation → M7 Daily Life → M8 Do/Don't → M9 Repair → M10 Horizon + Deep Read + Save/Share surfaces.

**Free vs premium (documented):** Free = signature, one strength, one difference, one interaction insight, preview. Premium = full modules.

### 6.2 Implemented structure

**Default path:** `RomanticSajuDeepReportView.tsx` — monolithic, ~1400+ lines.

Consumes `RomanticSajuDeepReport` schema sections:

- `section_1_summary`, `section_1_relationship_dynamics`
- `section_2_nature`
- `section_3_conversation_patterns`
- `section_4_special_bond`, `section_4_relationship_frames`, `section_4_hidden_hearts`
- `section_5_action`
- `section_6_timeline`

Plus shared widgets: `RomanticSnapshotPanel`, `ChemistryBreakdown`, `PsychMatchRadarChart`, `StrengthWeaknessCard`, compare table (6 canonical rows), `ConflictScriptTable`, `EssenceActionGuidelineList`, `ShareSummaryCard`.

**Flag-gated V2:** `ROMANTIC_EXPERIENCE_V2=1` → `RomanticExperienceView` (`components/relationship/romantic/experience/RomanticExperienceView.tsx`) with `ROMANTIC_MODULE_ORDER` M1–M10 (`romanticExperienceTypes.ts`). **No `*ReportSectionTypes` / SectionRenderer** for Romantic.

### 6.3 Canonical dimensions (implemented)

| Dimension | Source | Display |
|-----------|--------|---------|
| Tri-score (intimacy/conflict/stability) | `pairEventScores.ts` | Snapshot panel |
| 5 primary axes (snapshot subset) | `buildRomanticSnapshot.ts` | Axis bars |
| 11 secondary psych | `psychMatch` | Radar in legacy view |
| Compare 6 rows | `romanticComparisonTableCanonical.ts` | Table + lean chips |
| Expression speed direction | `romanticExpressionSpeedCanonical.ts` | Conflict badge |
| Saju frame direction | `romanticSajuFrameDirectionCanonical.ts` | M3 label |
| Balance / recovery / reassurance / role-play | Various `romantic*Canonical.ts` | Legacy cards |

### 6.4 Free vs premium (actual)

- **Free:** Same as global basic — 4-axis perspectives only
- **Premium:** Full `romantic_deep_report`; no partial free romantic modules in code

### 6.5 Implemented vs documented-only

| Documented | Status |
|------------|--------|
| 10-module registry with section renderer | **Not implemented** (V2 partial, flag-gated) |
| No grade dashboard | **Violated** — grade in legacy view |
| Deep Read in experience VM | **`deepRead: null` always** in V2 (`romanticExperienceTypes.ts` comment B3) |
| Save/Share/Revisit surfaces | Partial — `ShareSummaryCard`, `InviteShareButtons`; no dedicated revisit UX |
| Hero triad (Connection/Stability/Sensitivity) | Partial via snapshot topics, not as doc-specified hero |

---

## 7. Family IA

### 7.1 Documented structure (`05D`)

11 modules: Family Hero → Two People → Translation Gap → Loop → Love/Care → Roles → Environment Fit → Conflict/Repair → Growth → Playbook → Closing.

Parent/child **Track A/B** perspectives. Free/premium not explicitly defined in blueprint.

### 7.2 Implemented section order

From `buildFamilyReportViewModel.ts` builders array:

1. `snapshot` — bond/synergy/risk + TriScore panel  
2. `relationship_index` — friction index, safe distance  
3. `compare_table` — 6 Saju rows (parent/child)  
4. `household_roles` — complement/tension  
5. `psych_radar` — 11-axis  
6. `child_dna`  
7. `talent` — study_type, wealth_vessel  
8. `growth_tunnel`  
9. `family_role` — psych role  
10. `filial_frequency`  
11. `deep_read` — LLM overlay  
12. `destiny`  
13. `filial_reward`  
14. `sos_script`  
15. `de_escalation`  
16. `prescription`  

Types: `familyReportSectionTypes.ts`. Renderer: `familyParent/sections/SectionRenderer.tsx`.

### 7.3 Perspective / member views

- **Fixed parent/child order** — no viewer swap (`familyReportSectionTypes.ts` header comment)
- **URL params:** `childIsViewer`, `parentType` on detail URL (`useRelationshipDetail.ts`)
- **UI:** `RelationshipFamilyRolePanel` on detail page

### 7.4 Free vs premium

- Basic perspectives only for free
- Premium: full `family_deep_report`
- No documented free family module slice in code

### 7.5 Implemented vs documented-only

| Documented | Code |
|------------|------|
| Family Hero module | Opening block with grade/headline only |
| Translation Gap | **Missing** dedicated section |
| Relationship Loop | **Missing** |
| Environment Fit | Partial via household_roles |
| Legacy merge targets | `child_dna`, `talent`, `filial_reward`, `destiny` still present (`07D` notes) |

---

## 8. Friend Status and IA

### 8.1 Market research

- Category evidence: `docs/product/03_Market_Research.md` (general UX principles)
- Friend-specific research embedded in `05B_Friend_Product_Blueprint.md` (product constitution, not market study)
- Platform audit: `docs/product/platform/FRIEND_PLATFORM_AUDIT.md` (as-built, non-SSOT)

### 8.2 Product design status

- **Product SSOT:** `05B` — locked 9-module architecture
- **Technical SSOT:** `06B_Friend_Technical_Blueprint.md`
- **Checklist:** `07B_Friend_Implementation_Checklist.md`

### 8.3 Implemented section order

From `buildFriendReportViewModel.ts`:

1. `snapshot` (connection/banter/risk + vibe_axis_notes)  
2. `compare_table`  
3. `psych_radar`  
4. `social_dna`  
5. `soulmate`  
6. `play_money` (treasurer, hangout)  
7. `hidden_flow` (travel, counseling)  
8. `deep_read`  
9. `breakup_guide`  
10. `de_escalation`  
11. `prescription`  

### 8.4 Missing vs blueprint

| Blueprint module | Code mapping |
|------------------|--------------|
| Opening Scene | `opening` headline + snapshot (no scene narrative) |
| A→B / B→A gifts | Partial via social_dna, hidden_flow |
| Friendship Horizon | **Missing** timeline/horizon section |
| Friendship Care Guide | Partial via prescription + de_escalation |

### 8.5 Reusable shared contracts

- `TriScoreSnapshotPanel`, `DeepReadCard`, `PairPrescriptionSection`
- Compare table pattern (VA-02)
- Psych radar (VA-01 companion)
- CE canonical projections: treasurer, travel planner, compare table

---

## 9. Work / Coworker Status and IA

### 9.1 Documented structure (`05C`)

15 modules in 3 layers: personal operating manual (1–4) → collaboration (5–13) → environment + work manual (14–15).

### 9.2 Implemented section order

From `buildWorkReportViewModel.ts`:

1. `snapshot` (fit/synergy/risk)  
2. `compare_table` — **6 Saju collaboration axes** (`sajuCompareTable.ts`)  
3. `psych_radar` — **11 secondary axes**  
4. `comparison` — office DNA, work style, reporting/break boundary fit  
5. `role_matrix` — roles, leadership split, ideal fit  
6. `relationship_loop` — positive/friction loops (remixed from snapshot topics)  
7. `deep_read` — LLM (`meta.business_saju_deep`)  
8. `warning` — conflict trigger, de-escalation, upset, feedback cushion  
9. `prescription` — Do/Don't + weekly check-in extract  

Renderer: `workColleague/sections/SectionRenderer.tsx`. Legacy cards: `officeCards.tsx`.

### 9.3 Deterministic vs LLM sections

| Section | Deterministic | LLM |
|---------|---------------|-----|
| snapshot, compare, psych_radar, comparison, role_matrix, loop, warning, prescription | ✅ CE + templates | — |
| deep_read | Normalized adapter | ✅ explain-only overlay |

### 9.4 Pilot / experimental paths

**Non-production:** `tests/scripts/work-narrative-pilot/` — A/B/C narrative variants, bilingual contracts. Does **not** change production routing (`README.md` in that folder).

Dev page: `/dev/work-report-viewmodel`.

### 9.5 Missing production UI

| Documented module | Status |
|-------------------|--------|
| Collaboration Map (2-axis) | **No dedicated section** |
| Environment Fit Explorer | **Missing** |
| Your Work Manual | **Missing** |
| Work Signature / Work Shape (personal layer first) | Buried in comparison/role_matrix |

### 9.6 Product-specific requirements (from code contracts)

- Viewer-first swap on all pair sections (`viewerFirstDisplay.ts`)
- Saju compare ≠ psych radar (explicit comments in `workReportSectionTypes.ts`)
- Leadership/treasurer canonical labels from `canonical_projections`
- `07C_Work_Implementation_Checklist.md` marked **Draft v1.0**

---

## 10. Data and Content Inventory

**Rule:** Fields listed below exist in code. **`evidence_tier` does not exist** as a field name in `lib/relationship/`.

### 10.1 Primary axes (6)

| Name | Type | Source | Det/LLM | Client-safe | Products | Displayed |
|------|------|--------|---------|-------------|----------|-----------|
| `PRIMARY_AXIS_KEYS` | 6 keys: autonomy, connection, stability, growth, structure, adaptability | `lib/v2/survey/types.ts` | Deterministic (survey) | Yes | Romantic snapshot (5 of 6) | Romantic axis bars |
| `PrimaryAxesScores` | `Record<PrimaryAxisKey, number>` 0–100 | survey + saju fallback | Deterministic | Yes | Romantic | Snapshot |

### 10.2 Secondary axes (11)

| Name | Type | Source | Det/LLM | Client-safe | Products | Displayed |
|------|------|--------|---------|-------------|----------|-----------|
| `SECONDARY_AXIS_KEYS` | 11 psych keys | `lib/v2/survey/types.ts` | Deterministic | Yes | All premium | Psych radar |
| `PsychMatchAxisResult` | `{ axis_key, score_a, score_b, gap, match_type }` | `lib/relationship/psychMatch/index.ts` | Deterministic | Yes | All premium | Radar + highlights |
| `match_type` | similarity / complementary / tension | gap percentiles | Deterministic | Yes | All premium | Labels |
| `DomainPsychHighlight` | axis + topic + hook + narrative | `psychDomainLens/types.ts` | Deterministic | Yes | F/W/M/Fam | Radar card |

### 10.3 Basic relationship axes (4) — LLM

| Name | Type | Source | Det/LLM | Client-safe | Products | Displayed |
|------|------|--------|---------|-------------|----------|-----------|
| `RELATIONSHIP_AXIS_KEYS` | emotional_sensitivity, communication_style, conflict_response, energy_pattern | `normalizeRelationshipPerspectives.ts` | LLM | Yes | All kinds basic | Basic cards |

### 10.4 Tri-score

| Name | Type | Source | Det/LLM | Client-safe | Products | Displayed |
|------|------|--------|---------|-------------|----------|-----------|
| `TopicTriScore` | activation, benefit, risk (0–100) | `pairEventScores.ts` | Deterministic | Yes | All premium | Snapshot panel |
| `grade` | A–D | `triScoreToGrade()` | Deterministic | Yes | All premium | Opening + panel |
| `TriScoreSnapshotPanel` | grade, gauges, keywords, narrative, person axes | `triScoreSnapshot/types.ts` | Deterministic | Yes | All premium | `TriScoreSnapshotPanel.tsx` |
| Kind-specific % | connectionPct/banterPct/riskPct etc. | `*ReportSectionTypes.ts` | Deterministic | Yes | Per kind | Snapshot section |

### 10.5 Alignment / confidence / severity

| Name | Type | Source | Det/LLM | Client-safe | Products | Displayed |
|------|------|--------|---------|-------------|----------|-----------|
| `align` | confirms / caution | CE canonical | Deterministic | Projection only | Romantic compare, work leadership, etc. | Chips/notes |
| `confidence` | high / low (or numeric in CE) | CE | Deterministic | Projection only | Romantic, compare rows | Badges |
| `severity` / `HomeRiskWeatherLevel` | number / storm\|cloudy\|clear | `marriageHomeRiskForecast.ts` | Deterministic | Yes | Cohabitation | weather_forecast section |
| `ConfidenceLevel` | high/medium/low/tentative | `romanticExperienceTypes.ts` | Deterministic | Yes | Romantic V2 modules | Module headers |
| `KillerAlignment` | reinforced/tension/saju_only/psych_only | `cohabitationKillerTypes.ts` | Deterministic | **No** (context_output) | Cohabitation | Indirect |

### 10.6 Deep Read VM

| Name | Type | Source | Det/LLM | Client-safe | Products | Displayed |
|------|------|--------|---------|-------------|----------|-----------|
| `DeepReadViewModel` | meNature, partnerNature, gapSignal, advice*, together* | `shared/deepReadViewModel.ts` | LLM → normalized | Yes | F/W/M/Fam | `DeepReadCard` |
| Romantic `deepRead` | null in V2 | `romanticExperienceTypes.ts` | N/A | — | Romantic V2 | Not shown |

### 10.7 Prescriptions / scripts / guidance

| Name | Type | Source | Products | Displayed |
|------|------|--------|----------|-----------|
| `PairPrescriptionItem` | do/don't/checklist | `pairPrescriptionUiTypes.ts` | All premium | Prescription sections |
| `DeEscalationCard` / scripts | cheat_script, reconciliation | domain builders | F/Fam/M/W | De-escalation cards |
| `ConflictScriptTable` rows | dialogue before/after | romantic deep schema | Romantic | Legacy view |
| `FeedbackCushionScript` | office feedback | work CE | Work | warning section |
| `SosScriptSection` | trigger + line | family body | Family | sos_script |

### 10.8 Metadata / headlines

| Name | Source | Displayed |
|------|--------|-----------|
| `headline`, `subtitle`, `one_line_*` | report bodies | Opening blocks |
| `grade`, `grade_reason` | `meta` | Opening (all kinds) |
| `chartNote`, `introLine` | psych/prescription bundles | Section headers |

### 10.9 Client strip (not presentation-safe)

| Payload | Strip file | Never sent to client |
|---------|------------|---------------------|
| `context_output` | `strip*ContextOutputForClient.ts` | Full CE internals |
| `romantic_context_input` | `stripRomanticContextInputForClient.ts` | Romantic CE input |

### 10.10 Visualization suitability (from data shape)

| Data | Suitable forms (actual components) |
|------|-----------------------------------|
| 11-axis psych | SVG radar (`PsychMatchRadarChart`) |
| Tri-score topics | Mini bars, ring gauges (`RelationshipScoreBoard`, snapshot) |
| 6-row Saju compare | Horizontal scroll table (`CompareTableCard`) |
| Pair prescriptions | Checklist cards (`PairPrescriptionSection`) |
| Severity forecast | Weather metaphor section (cohabitation) |
| Romantic modules | Narrative cards + selective tables (V2) |

---

## 11. UI Component Inventory

Base path: `components/relationship/` (61 files). See also `components/landing/stitch/`, `components/space/`, `components/brand/`.

### 11.1 Page shells

| Component | Path | Products | Data | Responsive | Reusable | Duplication | Locks visual direction? |
|-----------|------|----------|------|------------|----------|-------------|-------------------------|
| `RelationHubShell` | `hub/RelationHubShell.tsx` | Hub | — | Stitch mobile-first | Hub-only | — | **Yes** — cream Stitch shell |
| `StitchSurveyShell` | `components/survey/StitchSurveyShell.tsx` | Detail, survey | — | Yes | Cross-feature | — | **Yes** |
| `RelationshipReportLayout` | `reportLayout/RelationshipReportLayout.tsx` | All premium | opening + scores | Column | Shared | — | Moderate — headline + scoreboard pattern |

### 11.2 Headers / navigation

| Component | Path | Products | Notes |
|-----------|------|----------|-------|
| `StitchFixedHeader` | `layout/stitch/StitchFixedHeader.tsx` | Landing, hub | Logo, menu |
| `RelationshipKindTabs` | `RelationshipKindTabs.tsx` | Detail | basic + premium kind |
| `StitchKindPickerSheet` | `hub/StitchKindPickerSheet.tsx` | Hub | Kind selection |
| `RelationAnalyzeNavOverlay` | `hub/RelationAnalyzeNavOverlay.tsx` | Transition | Full-screen loading |

### 11.3 Cards and digests

| Component | Path | Products | Data dependency |
|-----------|------|----------|-----------------|
| `RelationshipReportCard` | `reportLayout/RelationshipReportCard.tsx` | All premium | Generic shell |
| `TriScoreSnapshotPanel` | `TriScoreSnapshotPanel.tsx` | All premium | `TriScoreSnapshotPanel` data |
| `DeepReadCard` | `shared/DeepReadCard.tsx` | F/W/M/Fam | `DeepReadViewModel` |
| `RelationshipBasicCards` | `RelationshipBasicCards.tsx` | Detail basic | 4-axis perspectives |
| `StrengthWeaknessCard` | `reportLayout/StrengthWeaknessCard.tsx` | Romantic | psych lists |
| `ShareSummaryCard` | `reportLayout/ShareSummaryCard.tsx` | Romantic | grade/keywords |

### 11.4 Badges

| Component | Path | Data |
|-----------|------|------|
| `RelationshipKindBadge` | `RelationshipKindBadge.tsx` | kind + analysis level |
| Kind tab badges | `RelationshipKindTabs.tsx` | `RELATIONSHIP_KIND_BADGE_STYLES` |

### 11.5 Tables / comparisons

| Component | Path | Products |
|-----------|------|----------|
| `CompareTableCard` | 4× `sections/SectionRenderer.tsx` | F/W/M/Fam |
| `WorkCompareTableCard` | `workColleague/officeCards.tsx` | Work legacy |
| `ConflictScriptTable` | `reportLayout/ConflictScriptTable.tsx` | Romantic |

### 11.6 Charts / scales

| Component | Path | Type |
|-----------|------|------|
| `PsychMatchRadarChart` | `reportLayout/PsychMatchRadarChart.tsx` | 11-axis SVG radar |
| `RelationshipScoreBoard` | `reportLayout/RelationshipScoreBoard.tsx` | Ring gauges |
| `ChemistryBreakdown` | `reportLayout/ChemistryBreakdown.tsx` | Bar gauges |
| Tri-score mini bars | `TriScoreSnapshotPanel.tsx` | Activation/benefit/risk bars |

### 11.7 Section renderers (product-specific)

| Component | Path |
|-----------|------|
| `FriendSectionRenderer` | `friend/sections/SectionRenderer.tsx` |
| `WorkSectionRenderer` | `workColleague/sections/SectionRenderer.tsx` |
| `MarriageSectionRenderer` | `marriage/sections/SectionRenderer.tsx` |
| `FamilySectionRenderer` | `familyParent/sections/SectionRenderer.tsx` |
| `RomanticExperienceView` | `romantic/experience/RomanticExperienceView.tsx` |
| `RomanticSajuDeepReportView` | `RomanticSajuDeepReportView.tsx` |

### 11.8 Loading / empty / error

| Component | Path | State |
|-----------|------|-------|
| `RelationshipGeneratingPanel` | `detail/RelationshipGeneratingPanel.tsx` | loading/generating |
| `HubAnalysisReportRowSkeleton` | `hub/HubAnalysisReportRow.tsx` | hub loading |
| Empty hub | `RelationHubActionButtons.tsx` | no friends |
| Premium empty | `RelationshipPremiumSection.tsx` | no report |
| `localError` banner | `RelationshipPremiumSection.tsx` | generate fail |

### 11.9 Share / CTA

| Component | Path |
|-----------|------|
| `InviteShareButtons` | `InviteShareButtons.tsx` |
| `GlowButton` | `components/space/GlowButton.tsx` |
| `RelationHubActionButtons` | `hub/RelationHubActionButtons.tsx` |

### 11.10 Duplication hotspots (see §18)

- `PartHeading` — 5 copies
- `CompareTableCard` — 4 SectionRenderers
- `PsychRadarCard` wrapper — 4 SectionRenderers
- `PrescriptionCard` / `DeEscalationCard` — repeated per domain

---

## 12. Visualization Inventory

Mapped to Visual Asset IDs from `06_Visual_Design_System.md` §3A.

| VA-ID | Documented role | Implemented as | Products | Notes |
|-------|-----------------|----------------|----------|-------|
| VA-01 Radar | Psych evidence companion | `PsychMatchRadarChart` | All premium | Often above fold — doc says not headline |
| VA-02 Comparison Table | Saju A/B scan | `CompareTableCard` | All premium | 6 rows, horizontal scroll |
| VA-03 Relationship Map | 2-axis pattern | **Not implemented** as dedicated component | — | Doc Work Module 6 |
| VA-04 Difference Map | Meet/miss framing | Partial — Romantic M4 / compare rows | Romantic | Not standalone asset |
| VA-05 Timeline | Horizon/sequence | `section_6_timeline` in Romantic legacy | Romantic | Friend/Work horizon missing |
| VA-06 Loop | Recurring cycle | `relationship_loop` section | Work | Derived from snapshot topics |
| VA-07 Dialogue | Speech translation | `ConflictScriptTable`, de-escalation scripts | Romantic, others | |
| VA-08 Role Matrix | Roles/contribution | `role_matrix`, `household_roles` | Work, Family | |
| VA-09 Environment Matrix | Fit hypotheses | **Not implemented** | — | Work Module 14 |

**Score visualization debt:** `scoreBarAppearance.ts` uses green/amber/coral tiers — explicitly marked for replacement in `06` §3.2.

---

## 13. Visual-System Implementation

### 13.1 Brand mark

| | Documented | Implemented |
|---|------------|-------------|
| Logo | — | `components/brand/Logo.tsx` — PNG `/brand/logo.png`, alt "Aha It's me!", comment "Ai 모노그램" |
| Usage | — | Landing, headers, loading panels, overlay |
| Variants | — | `onLightBackground` (mix-blend-multiply), `onDarkBackground` (mix-blend-screen) |

### 13.2 Color tokens

#### Documented (`06_Visual_Design_System.md` — current)

- Ground: warm cream paper (`#faf7f0` family); deep-ink primary `#1a3328`; brand emerald `#3a8f6e`
- Romantic accent: brand emerald `#3a8f6e` on Stitch surfaces (`06` L5); legacy dark-register peach `#ffd6a5` noted as migration debt
- Person colors: equal-weight tints within the brand family (aspirational Person A/B teal/clay hexes from an older draft are retired)
- Domain accents: shared emerald by default; optional distinguishing secondary tints still open (`09` §6.13)
- Forbidden: traffic-light score tiers, dark+gold astrology solemnity, grade/dashboard-first identity chrome (`06` §1.1, L4)

#### Implemented (`app/globals.css` `@theme inline` + `:root`)

**Stitch (light):**

| Token | Value |
|-------|-------|
| `--color-surface` | `#faf7f0` |
| `--color-on-surface` | `#1a3328` |
| `--color-primary` | `#1a3328` |
| `--color-secondary` | `#3a8f6e` |
| `--color-accent-emerald` | `#3a8f6e` |
| `--color-accent-rose` | `#c49a9c` |
| `--color-tertiary` | `#c49a9c` |

**Space (dark):**

| Token | Value |
|-------|-------|
| `--bg-1` | `#070b14` |
| `--blue` | `#67b7ff` |
| `--purple` | `#8b7cff` |
| `--btn-accent` | `#d6b46a` (gold) |

**Product tab accents (`reportLayout/theme.ts`):**

| Kind | `RELATIONSHIP_TAB_THEME.accent` |
|------|--------------------------------|
| romantic | `#ffd6a5` (dark) / `#3a8f6e` (stitch override) |
| work | `#67b7ff` |
| cohabitation | `#d4a5e8` |
| family | `#9ed4b8` |
| friendship | `#7ec8ff` |

### 13.3 Typography

| | Documented | Implemented |
|---|------------|-------------|
| Editorial serif | Noto Serif KR / Georgia class | `--font-stitch-serif` → Lora (`globals.css`) |
| Sans | Pretendard-class | Geist Sans default body; Manrope on Stitch |
| Scale | 5 jobs only | Stitch utilities: `stitch-headline`; ad hoc text sizes in components |
| Data/mono | Tabular figures | `--font-mono` Geist Mono |

### 13.4 Spacing / layout

| Token | Value | File |
|-------|-------|------|
| `--spacing-edge-margin-mobile` | 1.25rem | globals.css |
| `--spacing-section-gap` | 5rem | globals.css |
| `--radius-extra-large` | 1.75rem | globals.css |
| Doc `space-1`…`space-8` | 4px–64px | **Not implemented as CSS vars** — doc-only |

### 13.5 Motion

| | Documented | Implemented |
|---|------------|-------------|
| Duration 150–250ms ease-out | Yes | framer-motion in landing, generating panel, `stitch-reveal` |
| Reduced motion | Required static fallback | Partial — not systematically gated |
| Forbidden bounce/confetti | Yes | Not observed in relationship reports |

### 13.6 Responsive breakpoints

Tailwind v4 defaults via `@import "tailwindcss"` — **no `tailwind.config.*`**. Components use `sm:`, `md:` ad hoc. Compare tables use fixed `min-w-[520px]`.

### 13.7 Dark mode

**No user-facing dark mode toggle.** Dark "space" surface is **product-bound** (non-Romantic premium reports), not OS theme.

### 13.8 Accessibility

Documented rules in `06` §3.5. Implementation: partial — some aria on buttons; charts lack systematic plain-language restatements.

### 13.9 Drift summary

| Rule (doc) | Reality (code) |
|------------|----------------|
| No grade | Grade in all premium openings |
| No traffic-light score bars | `scoreBarAppearance.ts` |
| Romantic accent = brand emerald `#3a8f6e` (`06` L5) | Stitch tabs already emerald; dark-register peach `#ffd6a5` remains |
| Dashboard-not-first | TriScore snapshot first in all VM builders |
| Single bilingual native sans | Geist + Lora + Manrope mix |
| Gold only as restrained light-ground accent (`06` / `09` §2.3) | `--btn-accent: #d6b46a` still paired with dark Space CTAs |

---

## 14. Documentation versus Code Gaps

| Area | Gap severity | Summary |
|------|--------------|---------|
| Romantic IA | **High** | 10-module doc vs monolith + flag-gated V2 |
| Work IA | **High** | 15 modules vs 9 sections; Collaboration Map absent |
| Family IA | **High** | 11 modules vs 16 legacy sections; hero/translation gap missing |
| Partnership IA | **High** | 8 chapters vs 15 card types; mental load / life direction missing |
| Friend IA | **Medium** | 9 modules vs 11 section types; horizon missing |
| Free tier | **Medium** | Product-specific free slices documented, not coded |
| Visual system | **Medium** | `06` tokens not migrated; dual Stitch/Space registers |
| Guest mode | **Low** | UI implies accessibility; API fail-closed |
| Invite flow | **Medium** | Backend exists; frontend incomplete |
| Naming | **Medium** | marriage folder / cohabitation kind / Partnership doc |

**Reading rule for design exploration:** Treat `05*` blueprints as **target IA**; treat `build*ReportViewModel.ts` + `*ReportSectionTypes.ts` as **current IA**.

---

## 15. Design-Exploration Constraints (moved to `09`)

*(Moved 2026-07-27, per the canonicalization refactor (`10`): "Must Preserve," "May Reinterpret," and "Must Not Invent" are design-intent framing — not current-implementation facts. The checklists now live in `09_Product_and_Design_Intent_Package.md` §3. Factual basis remains §5–§14 of this document.)*

---

## 18. Refactoring Observations (no implementation)

1. **Five near-identical `SectionRenderer.tsx`** — friend/work/marriage/family; differ only by section union type
2. **`PartHeading`, `CompareTableCard`, `PsychRadarCard`** duplicated across renderers
3. **Dual render path** — ViewModel SectionRenderer vs legacy inline JSX in `*ReportView.tsx` (fallback on VM failure)
4. **Romantic architectural outlier** — no ViewModel section types; 1400-line monolith vs V2 flag
5. **Two visual registers** — Stitch hub/detail vs dark premium (Romantic exception)
6. **`scoreBarAppearance` vs `06`** — systemic visual debt
7. **Grade field** — persisted and rendered despite doc prohibition
8. **Context Output** — rich server payload stripped and unused — potential future evidence UI
9. **Naming debt** — `marriage/` + `cohabitation` kind + `05E Partnership` + `married_saju_deep` meta key
10. **Invite complete unwired** — broken end-to-end invite journey
11. **Missing regression tests** for ViewModel section ordering and strip contracts (some unit tests exist: `tests/unit/deep-read-*.test.mjs`)
12. **Work narrative pilot** — valuable for copy iteration but isolated from production
13. **`RelationshipPremiumCards`** — thin wrapper, low cost
14. **Gold dark CTAs** (`--btn-accent`) conflict with doc forbidden metallic gold
15. **Future redesign risk:** any global card refactor must touch 4 SectionRenderers + Romantic monolith + Experience V2

---

## 19. Files Claude Should Review

### Authority (read first)

- `docs/product/README.md`
- `docs/product/05_Relationship_Product_Bible.md` (§13A, §13D)
- `docs/product/06_Visual_Design_System.md`
- Domain blueprint for target product: `05A` / `05B` / `05C` / `05D` / `05E`
- `docs/product/05N_Ahaitsme_Narrative_Style_Bible.md`

### Current implementation (read second)

- Journey: `app/homecontent.tsx`, `components/relationship/hub/RelationHubDashboard.tsx`, `app/relationship/[id]/RelationshipView.tsx`, `app/relationship/[id]/useRelationshipDetail.ts`
- Kinds: `lib/relationship/relationshipKind.ts`, `lib/relationship/analysisSurface.ts`
- ViewModels: `lib/relationship/*/viewModel/build*ReportViewModel.ts`, `*ReportSectionTypes.ts`
- Romantic: `components/relationship/RomanticSajuDeepReportView.tsx`, `lib/relationship/romantic/experience/romanticExperienceTypes.ts`
- Shared UI: `components/relationship/reportLayout/*`, `components/relationship/TriScoreSnapshotPanel.tsx`, `components/relationship/shared/DeepReadCard.tsx`
- Tokens: `app/globals.css`, `app/stitch-theme.css`, `components/relationship/reportLayout/theme.ts`, `components/relationship/reportLayout/ReportSurface.tsx`
- Data: `lib/relationship/pairEventScores.ts`, `lib/relationship/psychMatch/`, `lib/relationship/shared/deepReadViewModel.ts`

### As-built audits (supporting)

- `docs/product/prep/*_Preparation_Inventory.md`
- `docs/product/platform/*_PLATFORM_AUDIT.md`

---

## 20. Open Questions (moved to `09`)

*(Moved 2026-07-27: open product/design decisions belong in `09`. All items are carried in `09_Product_and_Design_Intent_Package.md` §6.15–§6.21, cross-referenced against this document's factual sections where needed.)*

---

## Appendix A — Current Stitch/Lovable Design Baseline

**Purpose:** Factual provenance of the first-round visual system (Google Stitch → Lovable refinements → repository implementation).  
**Scope:** Identify what constitutes the **current brand baseline** versus legacy/experimental surfaces, so a second design exploration can preserve identity while changing UX/UI composition.  
**Method:** Repository inspection only. No new visual style recommended.

### A.0 Status vocabulary (used below)

| Status | Meaning in this appendix |
|--------|--------------------------|
| **Current baseline** | Live production shell/tokens users encounter as “Ahaitsme today” (cream paper, emerald/rose, Lora headlines, stitch CTAs) |
| **Partially migrated** | Stitch chrome wrapping older report widgets, or dual tone (`stitch` + `dark`) on one journey |
| **Legacy** | Pre-Stitch space/dark presentation still reachable, or older relationship report chrome |
| **Experimental** | Dev-only pages, non-production pilots, retired mockups |
| **Feature-flagged** | Exists in code but off by default (`ROMANTIC_EXPERIENCE_V2`) |
| **Document-only** | Described in product/visual docs; not the shipping UI |

---

### A.1 Stitch / Lovable-derived routes, pages, and components

#### Global chrome (Current baseline)

| Piece | File | Notes |
|-------|------|-------|
| App chrome wrapper | `components/layout/ConditionalAppChrome.tsx` → `StitchAppChrome.tsx` | Always Stitch; no conditional legacy Header |
| Fixed header | `components/layout/stitch/StitchFixedHeader.tsx` | Logo, auth, menu |
| Side menu | `components/layout/stitch/StitchSideMenu.tsx` | |
| Bottom scroll dock | `components/layout/stitch/StitchScrollDock.tsx` | Hub shortcuts |
| Footer | `components/layout/stitch/StitchAppFooter.tsx` | |
| Theme CSS | `app/stitch-theme.css` (imported in `app/layout.tsx`) | `.stitch-landing`, `.stitch-hero-panel`, `.stitch-headline`, `.stitch-cta-*` |
| Token theme | `app/globals.css` `@theme inline` Stitch block | `--color-surface #faf7f0`, `--color-secondary #3a8f6e`, rose accents, Lora/Manrope |
| Brand mark | `components/brand/Logo.tsx`, `public/brand/logo.png` | Ai monogram |

#### Landing & entry (Current baseline)

| Route | Page / component | Status |
|-------|------------------|--------|
| `/` | `app/homecontent.tsx` → `StitchLandingPage`, `StartChoiceModal`, `StitchHomeCta` | Current baseline |
| Auth modal bridge | `lib/stitch/authBridge.ts` | Current baseline |

#### Onboarding / Blueprint (Current baseline + Lovable body)

| Route | Shell | Body | Status |
|-------|-------|------|--------|
| `/survey-v2`, `/survey-v2/complete` | Stitch survey patterns | Birth via `StitchBirthInputForm` / `StitchBirthDateTimeFields` | Current baseline |
| `/blueprint-preview` | `StitchSurveyShell` + `stitch-results` | `StitchResultsDashboard`, `StitchLiteResultPanel`, `StitchPremiumCard`, `StitchFreeSticker` | Current baseline |
| `/blueprint-preview/[reportId]/current` | `StitchSurveyShell` | Lite/current panels | Current baseline |
| `/blueprint-preview/[reportId]/essence/deep` | `StitchSurveyShell` | **`StitchDeepEssenceView` → `DeepEssenceReport`** | Current baseline; **Lovable “Inner Compass”** port (explicit comments) |
| `/blueprint-preview/[reportId]/essence` | Mixed | Still uses `SpaceBackground` in places | Partially migrated |

Lovable provenance comments (repository-backed):

- `components/results/StitchDeepEssenceView.tsx` — “로버블(Lovable) Inner Compass 디자인 이식 — Phase 3”
- `components/results/deep/DeepEssenceReport.tsx` — Inner Compass Part 01–05 assembly
- `components/results/deep/deepEssenceUiStrings.ts` — “Adapted from the Lovable Inner Compass design's own `ui` dictionary”
- `lib/prompts/deepEssenceStructured.ts` — structured schema for that design

#### Relationships hub & detail shell (Current baseline)

| Route | Component | Status |
|-------|-----------|--------|
| `/relationships` | `RelationHubShell` / `RelationHubDashboard` inside `StitchSurveyShell` (`stitch-survey stitch-results`) | Current baseline |
| Hub sheets | `StitchKindPickerSheet`, `AddFriendSheet`, `FriendsListSheet`, `AllAnalysisSheet`, `RenameFriendDialog` | Current baseline |
| Hub styles | `hub/relationHubStyles.ts` (`hubPanelClass`, stitch-hero-panel) | Current baseline |
| `/relationship/[id]` page chrome | `RelationshipView` → `StitchSurveyShell`, stitch headlines/CTAs, `RelationshipGeneratingPanel` | Current baseline |
| UI helpers | `components/ui/stitch/FadeInContent.tsx`, `StitchSkeleton.tsx` | Current baseline |

#### Legal / account (mostly Current baseline)

| Route | Pattern | Status |
|-------|---------|--------|
| `/terms`, `/privacy`, `/refund` | `stitch-legal` + `PolicyDocumentView` | Current baseline |
| `/account/*` | `stitch-hero-panel`, stitch CTAs (`AccountSurveySection`, `AccountBirthEditor`) | Current baseline |
| `/decision/*` | stitch panels / `stitchPillClass.ts` | Current baseline / Partially migrated |

#### Stitch utility / path helpers

- `lib/stitch/hubPaths.ts`, `lib/stitch/relationHubDockLock.ts`
- Dev docs acknowledging Stitch as current UI: `docs/dev/01_IA_AND_USER_JOURNEY.md`, `docs/dev/DEVELOPER_HANDBOOK_2026-07-08.md`

---

### A.2 Older / legacy presentation patterns still present

| Surface | Files / routes | Status |
|---------|----------------|--------|
| **Space (dark) marketing pages** | `/about`, `/pricing`, `/faq`, `/contact` wrap `SpaceBackground` | Legacy |
| **Space components** | `components/space/SpaceBackground.tsx`, `GlowButton.tsx`, `GlassCard.tsx`, `Stars.tsx`, `SpaceLoading.tsx`, `SurveyAnalyzingJourney.tsx` | Legacy widgets still imported |
| **Dark CSS register** | `app/globals.css` `:root` `--bg-1` `#070b14`, blue/purple accents, gold `--btn-accent` `#d6b46a` | Legacy global default under non-`.stitch-*` pages |
| **Legacy layout chrome (orphaned)** | `components/layout/Header.tsx`, `SideMenu.tsx` — **no current page imports found** | Legacy / unused by app routes |
| **Legacy birth path** | `/onboarding/birth` still `SpaceBackground` | Legacy |
| **Blueprint essence (non-deep)** | `/blueprint-preview/[reportId]/essence` uses `SpaceBackground` | Partially migrated |
| **Non-Romantic premium report body** | `ReportSurfaceProvider surface="dark"` for work/friend/cohabitation/family | Legacy report register inside Stitch page shell |
| **Romantic default deep report** | `RomanticSajuDeepReportView.tsx` — monolith, ScoreBoard, grade, chemistry gauges | Legacy relationship report (but often on `surface="stitch"`) |
| **GlowButton in Stitch flows** | Premium generate CTA (`RelationshipPremiumSection`), `ManualRelationshipForm`, `RelationshipCard`, pricing cards | Partially migrated — Stitch page + space CTA chrome |
| **Pre-lock Romantic mockup** | `lib/relationship/romanticproject/relationship_report_mockup.html` + `커플관계분석_통합설계_v2.md` | Experimental / retired (`06` §6A / L3 — mockup share and grade-dial treatments removed from authority) |

---

### A.3 Where current and legacy systems are mixed

```text
Stitch page shell (cream #faf7f0, StitchSurveyShell, StitchAppChrome)
    └─ Relationship detail / hub
         ├─ Stitch headlines, panels, kind tabs          ← Current baseline
         ├─ GlowButton (space gold/dark CTA)             ← Legacy widget
         └─ RelationshipPremiumSection
              ├─ romantic → ReportSurface "stitch"       ← Baseline tone
              │    └─ RomanticSajuDeepReportView         ← Legacy report IA/widgets
              │         or RomanticExperienceView        ← Feature-flagged stub
              └─ other kinds → ReportSurface "dark"      ← Legacy dark report body
                   └─ *ReportView + SectionRenderer      ← Partially migrated
                        (Stitch shell + dark cards)
```

Other mix points:

| Mix | Evidence |
|-----|----------|
| Global CSS dual register | Default `body` = dark space gradients; `.stitch-landing` / `.stitch-survey` / `.stitch-results` / `.stitch-legal` force cream |
| Romantic stitch tab theme | `getStitchTabTheme("romantic")` uses Stitch emerald `#3a8f6e` while dark tab theme uses peach `#ffd6a5` (`reportLayout/theme.ts`) |
| Blueprint | Hub uses Stitch; some essence routes still Space |
| Marketing vs product | Product journey mostly Stitch; about/pricing/faq/contact still Space |

---

### A.4 Files that establish the current visual shell

| Concern | Establishing files |
|---------|-------------------|
| **Header** | `StitchFixedHeader.tsx`, `Logo.tsx` |
| **Navigation** | `StitchSideMenu.tsx`, `StitchScrollDock.tsx`, hub sheets (`StitchKindPickerSheet`, etc.) |
| **Page background** | `StitchSurveyShell.tsx` (inline cream + emerald/rose radials); `stitch-theme.css` `.stitch-landing`; `globals.css` `html:has(.stitch-*)` overrides |
| **Typography** | `app/layout.tsx` fonts (Lora → `--font-stitch-serif`, Manrope, Geist); `.stitch-headline` in `stitch-theme.css` |
| **Color** | `globals.css` `@theme` Stitch tokens (`surface`, `secondary`/`accent-emerald` `#3a8f6e`, `accent-rose` `#c49a9c`, `on-surface` `#1a3328`); `stitch-theme.css` |
| **Spacing / width** | `--spacing-edge-margin-*`, `--spacing-section-gap`; detail/hub `max-w-lg` / `max-w-xl` containers in `RelationshipView`, hub dashboard |
| **Containers** | `.stitch-hero-panel`, `hubPanelClass()`, `rounded-extra-large` / `--radius-extra-large` |
| **Buttons** | `.stitch-cta-primary`, `.stitch-cta-secondary` (`stitch-theme.css`); residual `GlowButton` |
| **Cards** | `.stitch-hero-panel`; account/results panels; relationship `RelationshipReportCard` (tone from `ReportSurface`) |
| **Report framing** | `RelationshipReportLayout`, `RelationshipHeadlineBanner`, `RelationshipScoreBoard`, `ReportSurface.tsx` (`stitch` vs `dark` tone map) |

---

### A.5 Brand token inventory (factual — see `06` §1.0 for the canonical rule set, `09` §2 for preserve rationale)

The current shipping token values, recorded here as fact only (which values, in which files):

1. **Logo / Ai monogram** — `public/brand/logo.png`, alt "Aha It's me!"
2. **Ground** — `#faf7f0` / surface ladder (`surface`, `surface-container-*`)
3. **Primary ink** — `#1a3328`
4. **Secondary accent** — `#3a8f6e` (CTAs, accents, subtle radial washes)
5. **Tertiary** — `#c49a9c`
6. **Editorial serif** — Lora via `.stitch-headline`
7. **Humanist UI sans** — Manrope / Geist on body and controls
8. **Corner radius** — `rounded-extra-large` (~1.75rem)
9. **Hero panel** — cream card + outline-variant border + soft shadow (`.stitch-hero-panel`)
10. **CTA pair** — filled emerald primary vs outlined secondary (`.stitch-cta-*`)

Whether/why each of these should be preserved as identity going forward is a design-intent question, not a current-implementation fact — see `06` §1.0 (the canonical rule) and `09` §2 (the product-owner rationale).

---

### A.6 Layout and interaction structures currently in place (factual inventory)

Composition/hierarchy/pacing/navigation structures currently implemented, listed as fact only — whether any of these should change in a future design is a `09`/`06` question, not answered here:

- Hub IA: story-row vs list, sheet vs inline flows, analysis feed density
- Detail navigation: kind tabs, sticky controls, section jump vs linear scroll
- Report module order and progressive disclosure
- Digest vs deep split presentation
- Card stacking density and part dividers
- Compare table / radar / gauge placement (current, not a meaning judgment)
- Loading/generating choreography inside the same shell
- Mobile bottom dock contents and hub lock behavior
- Current mix of dark report bodies alongside Stitch tone (a factual description of the current dual-register state — see §5.11/§13.9 for the drift table)

---

### A.7 Romantic Experience V2 — intended future direction?

| Item | Fact |
|------|------|
| Entry | `shouldRenderRomanticExperienceV2` (`lib/relationship/romantic/experience/romanticExperienceFlag.ts`) |
| Default | **Legacy** `RomanticSajuDeepReportView` |
| Enable | `ROMANTIC_EXPERIENCE_V2=1` or `NEXT_PUBLIC_ROMANTIC_EXPERIENCE_V2`; rollback `ROMANTIC_EXPERIENCE_LEGACY=1` |
| UI component | `components/relationship/romantic/experience/RomanticExperienceView.tsx` |
| Contract | `romanticExperienceTypes.ts` — M1–M10 module order; **no ScoreBoard / grade / legacy `section_*` access** (file header) |
| Current render | **Stub composition** — lists module slots ready/omitted; placeholder card copy; not a finished visual report |
| Status | **Feature-flagged** + **Experimental** (B0 stub / B1 view-model consumer) |

V2 encodes the **product-intended module IA** (aligned with `05A`), not a finished second visual system. It reuses stitch-capable `RelationshipReportCard` primitives only.

---

### A.8 Do other products follow that same direction?

| Product | Follows Romantic V2 module composition? | Actual UI path |
|---------|----------------------------------------|----------------|
| Romantic | Only when flag on (stub) | Default: legacy monolith on stitch surface |
| Friend / Work / Cohabitation / Family | **No** — no Experience V2 equivalent | ViewModel + `SectionRenderer` on **`surface="dark"`** inside Stitch page shell |
| Blueprint deep essence | Separate Lovable “Inner Compass” composition | Stitch shell + structured Part 01–05 — closest **finished** long-form Stitch/Lovable report, but **self** product not relationship |

**Conclusion:** Other relationship products do **not** follow Romantic Experience V2. They share hub/detail **Stitch chrome**, but premium bodies remain dark-register SectionRenderer stacks. The only shipping long-form “designed report” clearly attributed to Lovable is Blueprint Inner Compass.

---

### A.9 Representative routes/screens, by current status

| Priority | Route / screen | Current status |
|----------|----------------|-----|
| 1 | `/` — `StitchLandingPage` | Current baseline — clearest brand/landing composition |
| 2 | `/blueprint-preview` — `StitchResultsDashboard` | Current baseline — Stitch results language |
| 3 | `/blueprint-preview/[reportId]/essence/deep` — Inner Compass | Current baseline — Lovable-refined long-form report on Stitch |
| 4 | `/relationships` — Relation Hub | Current baseline — product IA + stitch panels/sheets |
| 5 | `/relationship/[id]` chrome (basic + generating) | Current baseline — Stitch detail framing before premium body |
| 6 | Romantic premium with stitch surface (legacy view) | Partially migrated — current romantic report look users see by default |
| — | `/about`, `/pricing`, `/faq`, `/contact` | Legacy — Space dark marketing register |
| — | `romanticproject/relationship_report_mockup.html` | Experimental / retired |
| — | Romantic Experience V2 (flag on) | Feature-flagged / experimental — slot-list stub only |

Which of these a design tool should be briefed *from* is a `09`/`10` judgment (see `09` §2 / §4), not stated here — this table records only what each screen currently is.

---

### A.10 Screenshots, prototypes, exports, prompts, Stitch/Lovable artifacts in repo

| Artifact | Location | Classification |
|----------|----------|----------------|
| Romantic HTML mockup | `lib/relationship/romanticproject/relationship_report_mockup.html` | Experimental / retired |
| Korean planning companion | `lib/relationship/romanticproject/커플관계분석_통합설계_v2.md` | Document-only / retired ideation |
| Rejection of mockup as design reference | `06_Visual_Design_System.md` §6A / L3 | Document-only rule (canonical) |
| Lovable Inner Compass comments + UI strings | `StitchDeepEssenceView.tsx`, `DeepEssenceReport.tsx`, `deepEssenceUiStrings.ts`, `deepEssenceStructured.ts` | Current baseline (self deep) |
| Brand PNG assets | `public/brand/logo.png`, `logo-source.png`, favicons | Current baseline |
| Stitch theme stylesheet | `app/stitch-theme.css` | Current baseline |
| Dev handbook / IA notes citing “Stitch UI” | `docs/dev/DEVELOPER_HANDBOOK_2026-07-08.md`, `docs/dev/01_IA_AND_USER_JOURNEY.md` | Document-only process notes |
| Visual SSOT (expression) | `docs/product/06_Visual_Design_System.md` | Canonical expression SSOT — brand tokens aligned to shipping Stitch emerald; remaining drift = grades, traffic-light bars, dual Stitch/Space registers, incomplete VA adoption |
| Integrated / foundations trails | `11_…`, `docs/product/archive/ARCHIVE_Visual_Foundations.md`, `docs/product/archive/ARCHIVE_Romantic_Module_Visual_Evaluation.md` | **Archived** — do not cite as authority; use `06` |
| **Not found in repo** | External Stitch project links, Lovable.dev URLs, Figma exports, screenshot galleries, Stitch prompt dumps | — |

No dedicated `*lovable*` filename or Stitch export package was found. Lovable lineage is preserved as **code comments + Inner Compass UI port**, not as checked-in design tool projects.

---

### A.11 Screen / component classification index

| Screen / component | Status |
|--------------------|--------|
| `StitchAppChrome` + FixedHeader / Dock / Footer | Current baseline |
| `StitchLandingPage`, `StartChoiceModal` | Current baseline |
| `StitchSurveyShell`, hub, relationship detail chrome | Current baseline |
| `stitch-theme.css` + Stitch `@theme` tokens | Current baseline |
| Blueprint dashboard / lite / premium cards | Current baseline |
| `StitchDeepEssenceView` / Inner Compass parts | Current baseline (Lovable-derived) |
| Account / legal stitch panels | Current baseline |
| Romantic premium on `surface="stitch"` + legacy deep view | Partially migrated |
| Friend/Work/Family/Cohabitation premium `surface="dark"` | Partially migrated |
| `GlowButton` inside Stitch flows | Partially migrated |
| Blueprint essence (non-deep) `SpaceBackground` | Partially migrated |
| `/about`, `/pricing`, `/faq`, `/contact` Space pages | Legacy |
| `components/space/*`, dark `:root` space tokens | Legacy |
| `Header.tsx` / `SideMenu.tsx` (unused by routes) | Legacy |
| `/onboarding/birth` Space shell | Legacy |
| `RomanticSajuDeepReportView` structure (grade/gauges/dashboard-first) | Legacy (report IA) |
| `RomanticExperienceView` + flag | Feature-flagged / Experimental |
| `romanticproject/*` mockup | Experimental / retired |
| Work narrative pilot / `/dev/*` | Experimental |
| `06` Visual Design System (tokens + VA library) as fully shipping UI | Document-only in part — brand accent rule now matches Stitch emerald; grades/traffic-lights/VA adoption still drift |

---

### A.12 Concise summary table (factual — status and files only)

*(The former "Preserve visually?" and "UX/UI may change?" columns were design-intent judgments, not current-implementation facts; they have moved to `09_Product_and_Design_Intent_Package.md` §2–§3. This table now records only what currently exists and its status.)*

| Area | Current source | Status | Key files |
|------|----------------|--------|-----------|
| Global chrome | Stitch | Current baseline | `StitchAppChrome.tsx`, `StitchFixedHeader.tsx`, `StitchScrollDock.tsx` |
| Brand / tokens | Stitch `@theme` + `stitch-theme.css` | Current baseline | `app/globals.css`, `app/stitch-theme.css`, `Logo.tsx` |
| Landing | Stitch | Current baseline | `StitchLandingPage.tsx`, `homecontent.tsx` |
| Survey / birth | Stitch forms | Current baseline | `StitchBirthInputForm.tsx`, survey pages |
| Blueprint results | Stitch + Lovable Inner Compass (deep) | Current baseline | `StitchResultsDashboard.tsx`, `StitchDeepEssenceView.tsx` |
| Relation hub | Stitch | Current baseline | `RelationHubDashboard.tsx`, `relationHubStyles.ts` |
| Relation detail shell | Stitch | Current baseline | `RelationshipView.tsx`, `StitchSurveyShell.tsx` |
| Romantic premium body | Stitch surface + legacy deep view | Partially migrated | `RomanticSajuDeepReportView.tsx`, `ReportSurface.tsx` |
| Romantic Experience V2 | Flag stub | Feature-flagged / Experimental | `RomanticExperienceView.tsx`, `romanticExperienceFlag.ts` |
| Other premium bodies | Dark `ReportSurface` + SectionRenderer | Partially migrated | `*ReportView.tsx`, `sections/SectionRenderer.tsx` |
| Marketing about/pricing/faq | Space dark | Legacy | `SpaceBackground.tsx`, `app/about/page.tsx`, etc. |
| Space widgets | GlowButton / glass | Legacy / mixed | `components/space/GlowButton.tsx` |
| Pre-lock mockup | HTML prototype | Experimental / retired | `lib/relationship/romanticproject/*` |
| Visual SSOT | `06_Visual_Design_System.md` (Experience Design System) | Canonical — brand tokens corrected 2026-07-27 to match this table | `docs/product/06_*.md` |

For the design-intent reading of this table (what to preserve, what may change, and why) see `09_Product_and_Design_Intent_Package.md` §2–§3.

---

## Appendix B — Files Inspected

### Documentation

`docs/product/README.md`, `01_Product_Vision.md`, `02_Relationship-ux-bible.md`, `03_Market_Research.md`, `05_Relationship_Product_Bible.md`, `05A`–`05E` blueprints, `05N_Ahaitsme_Narrative_Style_Bible.md`, `06_Visual_Design_System.md`, `06A`–`06E` technical blueprints, `07A`–`07E` checklists, `docs/product/archive/ARCHIVE_Visual_Foundations.md`, `docs/product/archive/ARCHIVE_Romantic_Module_Visual_Evaluation.md`, `11_relationship_product_visual_blueprint_integrated.md`, `docs/product/platform/README.md`, `docs/product/prep/README.md`, prep inventories (WORK, FAMILY, MARRIAGE), `docs/dev/00_Status.md`, selected `docs/dev/decisions/*.md`, `docs/dev/01_IA_AND_USER_JOURNEY.md`, `docs/dev/DEVELOPER_HANDBOOK_2026-07-08.md`

### Application routes & API

`app/page.tsx`, `app/homecontent.tsx`, `app/relationships/page.tsx`, `app/relationship/[id]/*`, `app/api/relationship/**`, `proxy.ts`, `constants/routes.ts`, marketing Space pages (`about`, `pricing`, `faq`, `contact`), blueprint/essence routes

### Components

`components/relationship/**`, `components/landing/stitch/*`, `components/layout/stitch/*`, `components/results/*` (incl. Inner Compass), `components/space/*`, `components/brand/Logo.tsx`, `components/survey/StitchSurveyShell.tsx`, `app/globals.css`, `app/stitch-theme.css`, `lib/relationship/romanticproject/*`

### Library

`lib/relationship/**` (kinds, viewModels, triScoreSnapshot, psychMatch, romantic/*, shared/deepReadViewModel.ts), `lib/stitch/*`, `lib/product/premiumAccessPolicy.ts`, `lib/i18n/messages/en-US.ts`, `lib/v2/survey/types.ts`

### Tests (reference only)

`tests/scripts/work-narrative-pilot/README.md`, `tests/unit/deep-read-*.test.mjs`

---

## Appendix C — Extraction Handoff Report

| Item | Result |
|------|--------|
| **Authoritative documents found** | Governing stack per `docs/product/README.md`; expression SSOT `06_Visual_Design_System.md`; domain 05A–05E + 06A–06E + 07A–07E |
| **Deprecated / non-governing ignored as SSOT** | `docs/product/archive/*` (ex-foundations / Romantic module eval), `11_relationship_product_visual_blueprint_integrated.md`, `platform/*`, `prep/*` (used as as-built reference only); `romanticproject` mockup retired |
| **Major discrepancies** | Grade/dashboard-first vs doc; Romantic ViewModel gap; Work/Family/Partnership missing documented modules; dual Stitch/Space registers + dark-register peach debt; guest UI vs auth API; invite incomplete |
| **Missing information** | Exact Romantic legacy Part→screen mapping without full line-by-line read of 1400-line view; complete i18n key inventory; production analytics/telemetry; explicit free-tier product roadmap dates; no external Stitch/Lovable project URLs in repo |
| **Stitch/Lovable baseline appendix** | Added as Appendix A — shipping identity = Stitch cream/emerald/rose; Lovable Inner Compass on Blueprint deep; Romantic V2 flag stub only; other relationship premiums partially migrated (dark body) |
| **Ready for Claude design exploration?** | **Yes** — sufficient repository-backed sitemap, IA, data contracts, UI inventory, and brand baseline vs legacy split. Preserve/reinterpret boundaries and open questions now live in `09` §3 / §6 — resolve those with the product owner before locking visual direction. |

---

*Generated by repository inspection. No application code modified. Not committed.*
