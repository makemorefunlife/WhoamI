import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDecisionCategory } from "@/lib/decision/categories";
import type { DecisionEntry } from "@/lib/decision/types";
import { logServerError } from "@/lib/security/safeLog";

/**
 * Decision Journal on the server, per account (SERVER ONLY; migration
 * 20261011150000). The free allowance is 20 entries; unlimited while a
 * 30-day pass / membership is active (lib/entitlements/decisionJournalAccess).
 * Entries moved in from a device keep their device id (no duplicates) and
 * are always kept, even above the allowance.
 */
export const DECISION_JOURNAL_FREE_CAP = 20;

/**
 * Off until the privacy policy says the Journal is stored on our server
 * (it currently says the Journal stays on the device). Turn on per
 * environment with DECISION_JOURNAL_SERVER_STORAGE=on -- DEV first.
 */
export function journalServerStorageEnabled(): boolean {
  return process.env.DECISION_JOURNAL_SERVER_STORAGE?.trim() === "on";
}
const MAX_IMPORT = 500;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Row = {
  id: string;
  category: string;
  context: string;
  situation: string | null;
  decision: string | null;
  feeling: string | null;
  review_date: string | null;
  status: string;
  rating: number | null;
  note: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToEntry(r: Row): DecisionEntry {
  const reviewed = r.status === "reviewed" && r.rating != null;
  return {
    id: r.id,
    context: r.context,
    category: normalizeDecisionCategory(r.category),
    status: reviewed ? "reviewed" : "pending",
    note: r.note ?? "",
    rating: reviewed ? r.rating : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    reviewedAt: reviewed ? r.reviewed_at : null,
    situation: r.situation ?? undefined,
    decision: r.decision ?? undefined,
    feeling: r.feeling ?? undefined,
    reviewDate: r.review_date,
  };
}

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};
const iso = (v: unknown): string | null =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null;

/** Device entry -> DB shape. Invalid entries are skipped (never "fixed" into something else). */
export function sanitizeDeviceEntry(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const id = typeof e.id === "string" && UUID_RE.test(e.id) ? e.id : null;
  const context = text(e.context, 2000) ?? text(e.decision, 2000);
  if (!id || !context) return null;
  const rating = typeof e.rating === "number" && e.rating >= 1 && e.rating <= 5 ? Math.round(e.rating) : null;
  const legacyStatus = e.status === "reviewed" || e.status === "finalized" ? "reviewed" : "pending";
  const status = legacyStatus === "reviewed" && rating != null ? "reviewed" : "pending";
  return {
    id,
    category: normalizeDecisionCategory(String(e.category ?? "")),
    context,
    situation: text(e.situation, 4000),
    decision: text(e.decision, 2000),
    feeling: text(e.feeling, 2000),
    review_date: typeof e.reviewDate === "string" && DATE_RE.test(e.reviewDate) ? e.reviewDate : null,
    status,
    rating: status === "reviewed" ? rating : null,
    note: typeof e.note === "string" ? e.note.slice(0, 4000) : "",
    reviewed_at: status === "reviewed" ? iso(e.reviewedAt) ?? iso(e.updatedAt) : null,
    created_at: iso(e.createdAt),
    updated_at: iso(e.updatedAt) ?? iso(e.createdAt),
  };
}

export async function listJournalEntries(supabase: SupabaseClient, clerkUserId: string): Promise<DecisionEntry[] | null> {
  const { data, error } = await supabase
    .from("decision_journal_entries")
    .select("id, category, context, situation, decision, feeling, review_date, status, rating, note, reviewed_at, created_at, updated_at")
    .eq("clerk_user_id", clerkUserId)
    .order("updated_at", { ascending: false })
    .limit(2000);
  if (error) {
    logServerError("serverJournal", error, "list_failed");
    return null;
  }
  return ((data ?? []) as Row[]).map(rowToEntry);
}

export type NewEntryInput = {
  id?: unknown;
  category?: unknown;
  situation?: unknown;
  decision?: unknown;
  feeling?: unknown;
  reviewDate?: unknown;
};

export async function createJournalEntry(
  supabase: SupabaseClient,
  clerkUserId: string,
  input: NewEntryInput,
  unlimited: boolean,
): Promise<{ result: "created" | "cap_reached" | "exists" | "invalid" | "error"; id?: string }> {
  const decision = text(input.decision, 2000);
  const situation = text(input.situation, 4000);
  if (!decision || !situation) return { result: "invalid" };
  const id = typeof input.id === "string" && UUID_RE.test(input.id) ? input.id : crypto.randomUUID();
  const entry = {
    id,
    category: normalizeDecisionCategory(String(input.category ?? "")),
    context: decision,
    situation,
    decision,
    feeling: text(input.feeling, 2000),
    review_date: typeof input.reviewDate === "string" && DATE_RE.test(input.reviewDate) ? input.reviewDate : null,
  };
  const { data, error } = await supabase.rpc("create_decision_journal_entry", {
    p_clerk_user_id: clerkUserId,
    p_entry: entry,
    p_cap: DECISION_JOURNAL_FREE_CAP,
    p_unlimited: unlimited,
  });
  if (error) {
    logServerError("serverJournal", error, "create_failed");
    return { result: "error" };
  }
  const r = String(data);
  return { result: r === "created" || r === "cap_reached" || r === "exists" ? r : "error", id };
}

export async function completeJournalReview(
  supabase: SupabaseClient,
  clerkUserId: string,
  params: { id?: unknown; rating?: unknown; note?: unknown },
): Promise<boolean> {
  if (typeof params.id !== "string" || !UUID_RE.test(params.id)) return false;
  const rating = typeof params.rating === "number" ? Math.min(5, Math.max(1, Math.round(params.rating))) : null;
  if (rating == null) return false;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("decision_journal_entries")
    .update({
      status: "reviewed",
      rating,
      note: typeof params.note === "string" ? params.note.trim().slice(0, 4000) : "",
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", params.id)
    .eq("clerk_user_id", clerkUserId)
    .select("id");
  if (error) logServerError("serverJournal", error, "review_failed");
  return !error && Array.isArray(data) && data.length === 1;
}

export type DeviceGroup = { key: string; reportId: string; entries: unknown[] };
export type ImportOutcome = {
  imported: number;
  movedKeys: string[];
  /** Device records whose owner can't be proven: moved only after the person confirms. */
  needsConfirm: { key: string; count: number }[];
  /** Records of a profile that belongs to another account: never moved. */
  otherAccountKeys: string[];
};

/**
 * Moves device entries into the account. A group is moved automatically only
 * when its profile id belongs to this account; records with no profile (or a
 * profile we can't tie to anyone) need the person's confirmation; records of
 * another account's profile are never moved.
 */
export async function importDeviceEntries(
  supabase: SupabaseClient,
  clerkUserId: string,
  groups: DeviceGroup[],
  confirmedKeys: string[],
): Promise<ImportOutcome | null> {
  const out: ImportOutcome = { imported: 0, movedKeys: [], needsConfirm: [], otherAccountKeys: [] };
  const ids = [...new Set(groups.map((g) => g.reportId).filter((id) => UUID_RE.test(id)))];
  const owners = new Map<string, string>();
  if (ids.length) {
    const { data } = await supabase.from("reports").select("id, clerk_user_id").in("id", ids);
    for (const r of (data ?? []) as { id: string; clerk_user_id: string }[]) owners.set(r.id, r.clerk_user_id);
  }
  const toMove: Record<string, unknown>[] = [];
  for (const g of groups) {
    const entries = (Array.isArray(g.entries) ? g.entries : []).map(sanitizeDeviceEntry).filter(Boolean) as Record<string, unknown>[];
    if (!entries.length) continue;
    const owner = owners.get(g.reportId);
    if (owner === clerkUserId || confirmedKeys.includes(g.key)) {
      if (owner && owner !== clerkUserId && owner.startsWith("user_")) {
        out.otherAccountKeys.push(g.key);
        continue;
      }
      toMove.push(...entries);
      out.movedKeys.push(g.key);
    } else if (owner && owner.startsWith("user_")) {
      out.otherAccountKeys.push(g.key);
    } else {
      out.needsConfirm.push({ key: g.key, count: entries.length });
    }
  }
  if (toMove.length) {
    const { data, error } = await supabase.rpc("import_decision_journal_entries", {
      p_clerk_user_id: clerkUserId,
      p_entries: toMove.slice(0, MAX_IMPORT),
    });
    if (error) {
      logServerError("serverJournal", error, "import_failed");
      return null;
    }
    out.imported = Number(data ?? 0);
  }
  return out;
}
