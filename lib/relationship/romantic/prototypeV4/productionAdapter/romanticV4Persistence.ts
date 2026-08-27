/**
 * Romantic V4 — production persistence shape.
 *
 * Stored as an ADDITIVE sibling key inside the existing V1 payload object at
 * relationship_reports.result_premium_by_kind.romantic.byLocale[locale].v4 —
 * the same JSONB column V1 already writes to, no schema migration, no new
 * table. V1's own `format`/`report` keys in that same object are untouched;
 * old readers that only look at `.report` never see this key and are
 * unaffected. Self-contained (does not modify lib/relationship/premiumByKind.ts
 * or its shared PremiumKindPayload union, which is read by every relationship
 * domain) — reads/writes the raw JSONB shape directly with defensive runtime
 * checks instead.
 */
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import type { RomanticV4PrototypePayload } from "../types";
import type { BirthHourDisclosureCode } from "./romanticV4HourEvidence";
import { buildCanonicalRelationshipStoryPlan } from "../buildCanonicalRelationshipStoryPlan";

/**
 * Stores the full RomanticV4PrototypePayload, not just CanonicalRomanticV4Report —
 * CanonicalReportView (and the ChaptersA/B/adaptCanonicalSection tree beneath
 * it) reads payload.comparisonTable/axisOverview/pair/locale alongside
 * payload.canonicalReport itself, so the whole payload is what the renderer
 * actually needs. Same object buildRomanticV4PrototypePayload already
 * produces for the dev route — nothing new is computed to shape this.
 */
/**
 * Romantic report-schema SSOT (Phase 3A). Increment whenever the persisted
 * V4 report shape or required canonical content changes such that
 * previously generated V4 blocks must regenerate. isStaleRomanticV4Block
 * below is the read side of this contract.
 *
 * Not the same as the `schemaVersion` string field on
 * RomanticV4PersistedBlock — that identifies the *wrapper shape* of the
 * persisted block itself (payload/birthHourDisclosure/generatedAt), not
 * the report content's currentness; it stays for that purpose only.
 */
export const ROMANTIC_REPORT_SCHEMA_VERSION = 1;

export type RomanticV4PersistedBlock = {
  schemaVersion: "romantic_canonical_report_v1";
  /** Report-schema SSOT — see ROMANTIC_REPORT_SCHEMA_VERSION. */
  reportSchemaVersion: number;
  payload: RomanticV4PrototypePayload;
  birthHourDisclosure: BirthHourDisclosureCode;
  generatedAt: string;
};

type RawByKind = Record<string, unknown> | null | undefined;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/**
 * Read the persisted V4 block for a locale, if present. Defensive: any
 * unexpected shape (legacy row, mid-migration data, corrupt JSON) reads as
 * null rather than throwing — this must never break the V1 read path.
 */
export function readRomanticV4Block(
  byKind: RawByKind,
  locale: Locale | string,
): RomanticV4PersistedBlock | null {
  if (!isPlainObject(byKind)) return null;
  const romanticSlot = byKind.romantic;
  if (!isPlainObject(romanticSlot)) return null;
  const byLocale = romanticSlot.byLocale;
  if (!isPlainObject(byLocale)) return null;
  const resolved = normalizeLocale(locale);
  const payload = byLocale[resolved];
  if (!isPlainObject(payload)) return null;
  const v4 = payload.v4;
  if (!isPlainObject(v4)) return null;
  if (v4.schemaVersion !== "romantic_canonical_report_v1" && v4.schemaVersion !== "romantic_canonical_report_v2_gap_batch") return null;
  if (!isPlainObject(v4.payload)) return null;
  return v4 as unknown as RomanticV4PersistedBlock;
}

/**
 * Check if a persisted Romantic V4 block is stale. Version-first (Phase 3A):
 * a block whose reportSchemaVersion doesn't exactly match
 * ROMANTIC_REPORT_SCHEMA_VERSION is stale outright — including blocks
 * persisted before this field existed (reportSchemaVersion undefined),
 * which must not be silently treated as current just because they happen
 * to satisfy today's structural shape. Exact equality, not >=: a block
 * claiming a *newer* version than this running code understands is just as
 * unsafe to render as an older one (see ROMANTIC_REPORT_SCHEMA_VERSION doc).
 * The structural check below remains as a secondary layer — a same-version
 * block can still be stale if a partial write or corrupted payload left it
 * missing required content.
 */
export function isStaleRomanticV4Block(v4: RomanticV4PersistedBlock | null): boolean {
  if (!v4 || !v4.payload) return true;
  if (v4.reportSchemaVersion !== ROMANTIC_REPORT_SCHEMA_VERSION) return true;
  if (!v4.payload.storyPlan) return true;
  const plan = v4.payload.storyPlan as any;
  if (!plan.romanticGapBatch) return true;
  if (!plan.romanticGapBatch.physicalIntimacy) return true;
  if (!plan.romanticGapBatch.conflictTransitions) return true;
  return false;
}

/**
 * Resolve what the client should receive for Romantic V4 this request.
 *
 * Phase 3A: a block whose reportSchemaVersion doesn't match today's
 * ROMANTIC_REPORT_SCHEMA_VERSION (including pre-Phase-3A blocks that
 * predate the field entirely) is NEVER eligible for the in-place upgrade
 * below, no matter how complete its structure looks — see the "versionless
 * existing report" policy on isStaleRomanticV4Block. It resolves straight
 * to null (current-unavailable / regenerate), the same as a fully absent
 * block. The upgrade attempt exists only for the narrower, same-version
 * case: a current-schema block that's merely missing the newer gap-batch
 * narrative sub-field, re-derivable from that same block's own stored
 * contract/canonicalReport. If even that narrower attempt cannot run
 * (missing inputs) or throws, the block MUST be treated as unavailable —
 * returning the untouched stale payload here would let the caller serve it
 * to the client under the "current V4" field with no way for the client to
 * tell a successfully-patched block from an unpatched-stale one. This
 * function returns null in every failure case, so the caller's response
 * omits the field entirely and the client falls to its existing
 * current-unavailable/regenerate state (see resolveRomanticRenderMode) —
 * never silently to V2/legacy in normal production.
 */
export function resolveRomanticV4ForResponse(
  byKind: RawByKind,
  locale: Locale | string,
): RomanticV4PrototypePayload | null {
  const persistedV4Block = readRomanticV4Block(byKind, locale);
  if (!persistedV4Block) return null;
  if (!isStaleRomanticV4Block(persistedV4Block)) return persistedV4Block.payload;
  if (persistedV4Block.reportSchemaVersion !== ROMANTIC_REPORT_SCHEMA_VERSION) return null;

  try {
    const contract =
      persistedV4Block.payload.preNarrativeContract ??
      (persistedV4Block.payload as any).contract;
    const canonicalReport =
      persistedV4Block.payload.canonicalReport ??
      (persistedV4Block.payload as any).report;
    if (!contract || !canonicalReport) return null;

    const freshPlan = buildCanonicalRelationshipStoryPlan({
      contract,
      report: canonicalReport,
      axisResults: (persistedV4Block.payload as any).axisOverview || [],
      locale: locale as any,
      reportYear: new Date().getFullYear(),
      fortuneFlow: (persistedV4Block.payload as any).fortuneFlow,
    });
    if (!freshPlan || !freshPlan.romanticGapBatch) return null;

    return {
      ...persistedV4Block.payload,
      storyPlan: {
        ...persistedV4Block.payload.storyPlan,
        romanticGapBatch: freshPlan.romanticGapBatch,
      },
    };
  } catch {
    return null;
  }
}

export type RomanticRenderMode = "v4" | "legacy" | "empty";

/**
 * Phase 2 current-version lock — the single source of truth for which
 * Romantic renderer a report should show, given only the three signals the
 * client actually has: whether a current V4 block is present, whether V4 is
 * the intended current version for this environment, and whether an older
 * V1 payload exists.
 *
 * - V4 present -> always "v4", regardless of the flag (a persisted current
 *   block is always safe to show).
 * - V4 absent AND V4 enabled -> "empty", never "legacy". An absent V4 block
 *   while V4 is this environment's intended current version means this
 *   report needs a current-version (re)generate, not a silent drop to an
 *   older report shape.
 * - V4 absent AND V4 disabled (an intentional per-environment rollback) ->
 *   "legacy" when a V1 payload exists, else "empty". This is the only case
 *   where showing V2/legacy remains correct — the environment has
 *   explicitly opted out of V4 entirely, not "this one report's V4 failed".
 */
export function resolveRomanticRenderMode(params: {
  hasV4: boolean;
  v4Enabled: boolean;
  hasLegacyPayload: boolean;
}): RomanticRenderMode {
  if (params.hasV4) return "v4";
  if (params.v4Enabled) return "empty";
  return params.hasLegacyPayload ? "legacy" : "empty";
}

/**
 * Attach a V4 block onto an already-built V1 romantic payload object, in
 * place, right before it's persisted through the existing
 * persistRomanticPremiumResult(...) call — so there is exactly one write to
 * result_premium_by_kind per request, not a second read-merge-write race.
 */
export function attachRomanticV4Block<T extends { format: string; report: unknown }>(
  romanticPayload: T,
  block: RomanticV4PersistedBlock,
): T & { v4: RomanticV4PersistedBlock } {
  return Object.assign(romanticPayload, { v4: block });
}
