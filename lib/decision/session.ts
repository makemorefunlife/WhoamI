import {
  readJsonStorage,
  removeJsonStorage,
  writeJsonStorage,
} from "@/lib/v2/storage/localPersist";
import type { DecisionEntry } from "@/lib/decision/types";

const PREFIX = "ahaitsme_decisions_";

function storageKey(reportId: string) {
  return `${PREFIX}${reportId}`;
}

function normalizeEntry(raw: DecisionEntry): DecisionEntry {
  const legacyStatus = (raw as { status?: string }).status;
  const status =
    legacyStatus === "finalized" || legacyStatus === "reviewed"
      ? "reviewed"
      : "pending";
  const reviewedAt =
    raw.reviewedAt ??
    (status === "reviewed" ? raw.updatedAt : null);
  return {
    ...raw,
    status,
    rating:
      typeof raw.rating === "number" && raw.rating >= 1 && raw.rating <= 5
        ? raw.rating
        : status === "reviewed"
          ? null
          : null,
    reviewedAt,
    note: raw.note ?? "",
  };
}

export function readDecisionJournal(reportId: string): DecisionEntry[] {
  if (!reportId.trim()) return [];
  const parsed = readJsonStorage<DecisionEntry[]>(
    storageKey(reportId),
    storageKey(reportId),
  );
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((e) => e?.id && e?.context)
    .map(normalizeEntry)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export function writeDecisionJournal(
  reportId: string,
  entries: DecisionEntry[],
) {
  if (!reportId.trim()) return;
  writeJsonStorage(storageKey(reportId), entries);
}

export function clearDecisionJournal(reportId: string) {
  if (!reportId.trim()) return;
  removeJsonStorage(storageKey(reportId), storageKey(reportId));
}

export function addDecisionEntry(
  reportId: string,
  input: Pick<DecisionEntry, "context" | "category">,
): DecisionEntry[] {
  const now = new Date().toISOString();
  const entry: DecisionEntry = {
    id: crypto.randomUUID(),
    context: input.context.trim(),
    category: input.category,
    status: "pending",
    note: "",
    rating: null,
    createdAt: now,
    updatedAt: now,
    reviewedAt: null,
  };
  const next = [entry, ...readDecisionJournal(reportId)];
  writeDecisionJournal(reportId, next);
  return next;
}

export function completeDecisionReview(
  reportId: string,
  id: string,
  rating: number,
  note: string,
): DecisionEntry[] {
  const now = new Date().toISOString();
  return updateDecisionEntry(reportId, id, {
    status: "reviewed",
    rating: Math.min(5, Math.max(1, Math.round(rating))),
    note: note.trim(),
    reviewedAt: now,
  });
}

export function updateDecisionEntry(
  reportId: string,
  id: string,
  patch: Partial<
    Pick<
      DecisionEntry,
      "status" | "note" | "context" | "category" | "rating" | "reviewedAt"
    >
  >,
): DecisionEntry[] {
  const now = new Date().toISOString();
  const next = readDecisionJournal(reportId).map((e) =>
    e.id === id ? { ...e, ...patch, updatedAt: now } : e,
  );
  writeDecisionJournal(reportId, next);
  return next;
}
