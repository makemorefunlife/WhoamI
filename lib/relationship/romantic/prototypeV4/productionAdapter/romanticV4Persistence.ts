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
export type RomanticV4PersistedBlock = {
  schemaVersion: "romantic_canonical_report_v1";
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
 * Check if a persisted Romantic V4 block is stale (e.g. missing new gap batch engine capabilities).
 */
export function isStaleRomanticV4Block(v4: RomanticV4PersistedBlock | null): boolean {
  if (!v4 || !v4.payload || !v4.payload.storyPlan) return true;
  const plan = v4.payload.storyPlan as any;
  if (!plan.romanticGapBatch) return true;
  if (!plan.romanticGapBatch.physicalIntimacy) return true;
  if (!plan.romanticGapBatch.conflictTransitions) return true;
  return false;
}

/**
 * Resolve what the client should receive for Romantic V4 this request.
 *
 * A stale persisted block (missing the newer gap-batch narrative — see
 * isStaleRomanticV4Block) gets exactly one best-effort in-place upgrade
 * attempt, re-deriving just the gap-batch narrative from the block's own
 * stored contract/canonicalReport. If that attempt cannot even run (missing
 * inputs) or throws, the block MUST be treated as unavailable — returning
 * the untouched stale payload here would let the caller serve it to the
 * client under the "current V4" field with no way for the client to tell a
 * successfully-patched block from an unpatched-stale one. Contrast with the
 * old inline version of this logic, which on catch preserved and returned
 * the stale payload as-is; this function returns null instead, so the
 * caller's response omits the field entirely and the client falls through
 * to its existing V2/legacy renderer — the same honest "unavailable" path
 * already used everywhere the block is simply absent.
 */
export function resolveRomanticV4ForResponse(
  byKind: RawByKind,
  locale: Locale | string,
): RomanticV4PrototypePayload | null {
  const persistedV4Block = readRomanticV4Block(byKind, locale);
  if (!persistedV4Block) return null;
  if (!isStaleRomanticV4Block(persistedV4Block)) return persistedV4Block.payload;

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
