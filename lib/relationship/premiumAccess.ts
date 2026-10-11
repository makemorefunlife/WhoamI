import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import { logServerError } from "@/lib/security/safeLog";
import {
  getPremiumPayloadForKindLocale,
  mergePremiumKindLocale,
  type PremiumKindPayload,
  type ResultPremiumByKind,
} from "@/lib/relationship/premiumByKind";
import { RELATIONSHIP_KINDS, type RelationshipKind } from "@/lib/relationship/relationshipKind";

/**
 * ONE server-side access rule for relationship deep (premium) reports, used
 * by detail, analyze/premium, list, status, hub summary, map and the share
 * routes (2026-10-11).
 *
 *   mine    -- the viewer's own report: owner_report_id = viewer report
 *              (whose ownership the caller already verified) AND
 *              owner_clerk_user_id = the signed-in user.
 *   shared  -- the OTHER participant's report with an ACTIVE share row
 *              (relationship_report_shares.premium_report_id = report id,
 *              recipient_report_id = viewer report). Checked on every
 *              request, so a revoked share blocks every new read.
 *   legacy  -- relationship_reports.result_premium_by_kind, written before
 *              2026-10-11 with no creator record. Left exactly as it was
 *              (both participants) until the separate legacy decision
 *              (IA v2 §17). Never written to by new generations.
 *
 * Anything else is not returned at all -- no body, no summary.
 */

export type PremiumSource = "mine" | "shared" | "legacy";

export type OwnedPremiumRow = {
  id: string;
  relationship_report_id: string;
  owner_report_id: string;
  owner_clerk_user_id: string;
  kind: string;
  locale: string;
  payload?: PremiumKindPayload | null;
  updated_at?: string | null;
};

export type ShareLinkRow = {
  id: string;
  premium_report_id: string | null;
  recipient_report_id: string;
  status: string;
};

export type KindAccess = {
  mine: OwnedPremiumRow | null;
  shared: OwnedPremiumRow | null;
  legacy: PremiumKindPayload | null;
};

export type PremiumAccessMap = Record<RelationshipKind, KindAccess>;

/** Pure: decide what this viewer may read, per kind, in one language. */
export function resolvePremiumAccess(input: {
  viewerReportId: string;
  viewerClerkUserId: string | null;
  partnerReportId: string;
  locale: Locale | string;
  rows: OwnedPremiumRow[];
  shares: ShareLinkRow[];
  legacyByKind: ResultPremiumByKind | null | undefined;
}): PremiumAccessMap {
  const locale = normalizeLocale(input.locale);
  const activeShareFor = new Set(
    input.shares
      .filter(
        (s) =>
          s.status === "active" &&
          s.premium_report_id &&
          s.recipient_report_id === input.viewerReportId,
      )
      .map((s) => s.premium_report_id as string),
  );
  const out = {} as PremiumAccessMap;
  for (const kind of RELATIONSHIP_KINDS) {
    const forKind = input.rows.filter((r) => r.kind === kind && r.locale === locale);
    const mine =
      input.viewerClerkUserId != null
        ? forKind.find(
            (r) =>
              r.owner_report_id === input.viewerReportId &&
              r.owner_clerk_user_id === input.viewerClerkUserId,
          ) ?? null
        : null;
    const shared =
      forKind.find(
        (r) => r.owner_report_id === input.partnerReportId && activeShareFor.has(r.id),
      ) ?? null;
    const legacy = getPremiumPayloadForKindLocale(input.legacyByKind, kind, locale);
    out[kind] = { mine, shared, legacy };
  }
  return out;
}

export function accessibleSources(a: KindAccess): PremiumSource[] {
  const s: PremiumSource[] = [];
  if (a.mine) s.push("mine");
  if (a.shared) s.push("shared");
  if (a.legacy) s.push("legacy");
  return s;
}

/** Requested source if the viewer may read it; otherwise mine > shared > legacy. */
export function pickPremiumSource(a: KindAccess, requested?: string | null): PremiumSource | null {
  const available = accessibleSources(a);
  if (requested && (available as string[]).includes(requested)) return requested as PremiumSource;
  return available[0] ?? null;
}

export function payloadForSource(a: KindAccess, source: PremiumSource | null): PremiumKindPayload | null {
  if (source === "mine") return (a.mine?.payload as PremiumKindPayload) ?? null;
  if (source === "shared") return (a.shared?.payload as PremiumKindPayload) ?? null;
  if (source === "legacy") return a.legacy;
  return null;
}

/**
 * A byKind object holding ONLY what the viewer may read (chosen source per
 * kind, this language). Existing readers (getRomanticSajuDeepReport, V4
 * resolver, ...) take it unchanged.
 */
export function buildViewerByKind(
  access: PremiumAccessMap,
  locale: Locale | string,
  chosen: Partial<Record<RelationshipKind, PremiumSource | null>>,
  legacyByKind: ResultPremiumByKind | null | undefined,
): ResultPremiumByKind {
  let byKind: ResultPremiumByKind = {};
  for (const kind of RELATIONSHIP_KINDS) {
    const source = chosen[kind] ?? null;
    const payload = payloadForSource(access[kind], source);
    if (payload) byKind = mergePremiumKindLocale(byKind, kind, locale, payload);
  }
  // Legacy premium "perspectives" (pre-deep format) stay with the legacy row.
  for (const kind of RELATIONSHIP_KINDS) {
    const raw = legacyByKind?.[kind] as { perspectives?: unknown } | undefined;
    if (raw && typeof raw === "object" && raw.perspectives) {
      byKind[kind] = { ...(byKind[kind] as object), perspectives: raw.perspectives } as never;
    }
  }
  return byKind;
}

/**
 * analyze/premium decision (pure). Serve = no generation, no charge.
 *   own report                          -> serve mine
 *   else, unless create_own: shared, then legacy -> serve it
 *   force_regenerate / create_own / nothing readable -> generate the
 *   viewer's OWN report (charged; "user_regenerate" archives their old copy)
 * A partner report that is not actively shared is never served or reused.
 */
export function decidePremiumPost(
  a: KindAccess,
  opts: { forceRegenerate: boolean; createOwn: boolean },
):
  | { serve: PremiumSource; payload: unknown }
  | { generate: "first_generation" | "user_regenerate" } {
  if (!opts.forceRegenerate) {
    if (a.mine) return { serve: "mine", payload: a.mine.payload };
    if (!opts.createOwn) {
      if (a.shared) return { serve: "shared", payload: a.shared.payload };
      if (a.legacy) return { serve: "legacy", payload: a.legacy };
    }
  }
  return { generate: a.mine ? "user_regenerate" : "first_generation" };
}

const ROW_COLS = "id, relationship_report_id, owner_report_id, owner_clerk_user_id, kind, locale, updated_at";

/**
 * Loads the rows this viewer could possibly read for ONE relationship:
 * their own + the partner's (filtered to actively shared ones in
 * resolvePremiumAccess). Payload is loaded only when asked for.
 */
export async function loadPremiumAccess(
  supabase: SupabaseClient,
  params: {
    relationshipReportId: string;
    viewerReportId: string;
    partnerReportId: string;
    viewerClerkUserId: string | null;
    locale: Locale | string;
    legacyByKind: ResultPremiumByKind | null | undefined;
    withPayload: boolean;
  },
): Promise<{ access: PremiumAccessMap; ok: boolean }> {
  const locale = normalizeLocale(params.locale);
  const [rowsRes, sharesRes] = await Promise.all([
    supabase
      .from("relationship_premium_reports")
      .select(params.withPayload ? `${ROW_COLS}, payload` : ROW_COLS)
      .eq("relationship_report_id", params.relationshipReportId)
      .eq("locale", locale)
      .in("owner_report_id", [params.viewerReportId, params.partnerReportId]),
    supabase
      .from("relationship_report_shares")
      .select("id, premium_report_id, recipient_report_id, status")
      .eq("relationship_report_id", params.relationshipReportId)
      .eq("recipient_report_id", params.viewerReportId)
      .eq("status", "active")
      .not("premium_report_id", "is", null),
  ]);
  const ok = !rowsRes.error && !sharesRes.error;
  if (!ok) {
    logServerError("premiumAccess.load", rowsRes.error ?? sharesRes.error, "db_select_failed");
  }
  const access = resolvePremiumAccess({
    viewerReportId: params.viewerReportId,
    viewerClerkUserId: params.viewerClerkUserId,
    partnerReportId: params.partnerReportId,
    locale,
    // Fail closed: on a read error, no new-format report is readable.
    rows: ok ? ((rowsRes.data ?? []) as unknown as OwnedPremiumRow[]) : [],
    shares: ok ? ((sharesRes.data ?? []) as ShareLinkRow[]) : [],
    legacyByKind: params.legacyByKind,
  });
  return { access, ok };
}

/**
 * Batch, for hub/list/status/map readiness: kinds the viewer report can read
 * (own or actively shared to it), per relationship. locale omitted = any
 * language. Never returns content.
 */
export async function fetchAccessiblePremiumKinds(
  supabase: SupabaseClient,
  viewerReportId: string,
  relationshipReportIds: string[],
  locale?: Locale | string,
): Promise<Map<string, Set<string>>> {
  const out = new Map<string, Set<string>>();
  if (relationshipReportIds.length === 0) return out;
  const add = (rrId: string, kind: string) => {
    if (!out.has(rrId)) out.set(rrId, new Set());
    out.get(rrId)!.add(kind);
  };
  let mineQ = supabase
    .from("relationship_premium_reports")
    .select("relationship_report_id, kind")
    .eq("owner_report_id", viewerReportId)
    .in("relationship_report_id", relationshipReportIds);
  if (locale) mineQ = mineQ.eq("locale", normalizeLocale(locale));
  const [mineRes, sharesRes] = await Promise.all([
    mineQ,
    supabase
      .from("relationship_report_shares")
      .select("premium_report_id")
      .eq("recipient_report_id", viewerReportId)
      .eq("status", "active")
      .in("relationship_report_id", relationshipReportIds)
      .not("premium_report_id", "is", null),
  ]);
  if (mineRes.error || sharesRes.error) {
    logServerError("premiumAccess.batch", mineRes.error ?? sharesRes.error, "db_select_failed");
    return out;
  }
  for (const r of mineRes.data ?? []) add(r.relationship_report_id as string, r.kind as string);
  const sharedIds = (sharesRes.data ?? []).map((s) => s.premium_report_id as string);
  if (sharedIds.length > 0) {
    let sq = supabase
      .from("relationship_premium_reports")
      .select("relationship_report_id, kind")
      .in("id", sharedIds);
    if (locale) sq = sq.eq("locale", normalizeLocale(locale));
    const { data, error } = await sq;
    if (!error) for (const r of data ?? []) add(r.relationship_report_id as string, r.kind as string);
  }
  return out;
}

/** Saves the creator's own report (archives a previous one). Returns its id. */
export async function saveOwnedRelationshipPremium(
  supabase: SupabaseClient,
  params: {
    relationshipReportId: string;
    ownerReportId: string;
    ownerClerkUserId: string;
    kind: RelationshipKind;
    locale: Locale | string;
    payload: unknown;
    reason: "first_generation" | "user_regenerate" | "auto_upgrade";
    /** Fingerprint of the inputs used (lib/report/inputSnapshot.ts). */
    inputSnapshot?: unknown;
  },
): Promise<{ id: string | null; error: unknown }> {
  const { data, error } = await supabase.rpc("save_relationship_premium_report", {
    p_relationship_report_id: params.relationshipReportId,
    p_owner_report_id: params.ownerReportId,
    p_owner_clerk_user_id: params.ownerClerkUserId,
    p_kind: params.kind,
    p_locale: normalizeLocale(params.locale),
    p_payload: params.payload,
    p_reason: params.reason,
  });
  if (error) logServerError("premiumAccess.save", error, "db_save_failed");
  const id = (data as string | null) ?? null;
  if (!error && id && params.inputSnapshot) {
    // Best-effort (column added by 20261011120000); never fails the save.
    const { error: snapErr } = await supabase
      .from("relationship_premium_reports")
      .update({ input_snapshot: params.inputSnapshot })
      .eq("id", id);
    if (snapErr) logServerError("premiumAccess.snapshot", snapErr, "snapshot_not_saved");
  }
  return { id, error };
}
