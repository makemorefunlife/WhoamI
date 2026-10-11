"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  addDecisionEntry,
  completeDecisionReview,
  countAllDecisionEntries,
  readDecisionJournal,
  readDecisionReportId,
} from "@/lib/decision/session";
import type { DecisionEntry } from "@/lib/decision/types";

/**
 * Decision Journal data for the Journal and History pages (2026-10-11).
 *
 *  - Signed in + server storage available: the account's entries (any
 *    device). This device's records are moved in first -- automatically for
 *    the signed-in person's own profile, after a confirmation for records
 *    with no provable owner -- with no duplicates (device ids are kept). The
 *    device copy is left as it was.
 *  - Signed out, or server storage not there yet: this device's records,
 *    exactly as before.
 */
const PREFIX = "ahaitsme_decisions_";
const MOVED_KEY = "ahaitsme_journal_moved_v1";
const DECLINED_KEY = "ahaitsme_journal_declined_v1";

type Marks = Record<string, Record<string, number>>;

function readMarks(key: string): Marks {
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? (JSON.parse(raw) as unknown) : null;
    return v && typeof v === "object" ? (v as Marks) : {};
  } catch {
    return {};
  }
}
function writeMarks(key: string, v: Marks) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable: the server dedupes anyway */
  }
}

function deviceGroups(): { key: string; reportId: string; entries: DecisionEntry[] }[] {
  const out: { key: string; reportId: string; entries: DecisionEntry[] }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const reportId = key.slice(PREFIX.length);
      const entries = readDecisionJournal(reportId);
      if (entries.length) out.push({ key, reportId, entries });
    }
  } catch {
    return out;
  }
  return out;
}

export type JournalAddResult = "created" | "cap_reached" | "error";

export function useDecisionJournal() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const [mode, setMode] = useState<"loading" | "server" | "device">("loading");
  const [entries, setEntries] = useState<DecisionEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [unlimited, setUnlimited] = useState(false);
  const [pendingDevice, setPendingDevice] = useState<{ key: string; count: number }[]>([]);
  const deviceReportId = useRef("");

  const loadDevice = useCallback(async (withAccess: boolean) => {
    const id = readDecisionReportId();
    deviceReportId.current = id;
    setEntries(readDecisionJournal(id));
    setTotal(countAllDecisionEntries());
    setMode("device");
    if (!withAccess) return setUnlimited(false);
    const body = await fetch("/api/account/entitlements")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null) as { journal?: { unlimited?: boolean } } | null;
    setUnlimited(body?.journal?.unlimited === true);
  }, []);

  const loadServer = useCallback(async (): Promise<boolean> => {
    const body = await fetch("/api/decision/journal", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null) as { available?: boolean; entries?: DecisionEntry[]; total?: number; unlimited?: boolean } | null;
    if (!body?.available || !Array.isArray(body.entries)) return false;
    setEntries(body.entries);
    setTotal(body.total ?? body.entries.length);
    setUnlimited(body.unlimited === true);
    setMode("server");
    return true;
  }, []);

  /** Sends this device's records that changed since the last move (server ignores duplicates). */
  const moveDevice = useCallback(
    async (uid: string, confirmKeys: string[]) => {
      const moved = readMarks(MOVED_KEY);
      const declined = readMarks(DECLINED_KEY);
      const groups = deviceGroups().filter(
        (g) =>
          confirmKeys.includes(g.key) ||
          (moved[uid]?.[g.key] !== g.entries.length && declined[uid]?.[g.key] === undefined),
      );
      if (!groups.length) return setPendingDevice([]);
      const res = await fetch("/api/decision/journal/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups, confirmKeys }),
      }).catch(() => null);
      if (!res?.ok) return;
      const out = (await res.json().catch(() => null)) as { movedKeys?: string[]; needsConfirm?: { key: string; count: number }[] } | null;
      const next = { ...moved, [uid]: { ...(moved[uid] ?? {}) } };
      for (const k of out?.movedKeys ?? []) next[uid][k] = groups.find((g) => g.key === k)?.entries.length ?? 0;
      writeMarks(MOVED_KEY, next);
      setPendingDevice(out?.needsConfirm ?? []);
    },
    [],
  );

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (!userId) return void loadDevice(false);
        // Server storage may be switched off: only then is anything moved.
        if (!(await loadServer())) return void loadDevice(true);
        if (cancelled) return;
        await moveDevice(userId, []);
        if (!cancelled) await loadServer();
      })();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isLoaded, userId, loadDevice, loadServer, moveDevice]);

  const add = useCallback(
    async (input: { category: DecisionEntry["category"]; situation: string; decision: string; feeling?: string; reviewDate?: string | null }): Promise<JournalAddResult> => {
      if (mode === "server") {
        const res = await fetch("/api/decision/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: crypto.randomUUID(), ...input }),
        }).catch(() => null);
        const body = (await res?.json().catch(() => null)) as { result?: string } | null;
        await loadServer();
        return body?.result === "created" || body?.result === "exists" ? "created" : body?.result === "cap_reached" ? "cap_reached" : "error";
      }
      if (!deviceReportId.current) return "error";
      setEntries(addDecisionEntry(deviceReportId.current, input));
      setTotal(countAllDecisionEntries());
      return "created";
    },
    [mode, loadServer],
  );

  const completeReview = useCallback(
    async (id: string, rating: number, note: string) => {
      if (mode === "server") {
        await fetch("/api/decision/journal", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, rating, note }),
        }).catch(() => null);
        await loadServer();
        return;
      }
      if (!deviceReportId.current) return;
      setEntries(completeDecisionReview(deviceReportId.current, id, rating, note));
    },
    [mode, loadServer],
  );

  /** "Move these records to my account" (records with no provable owner). */
  const confirmPendingDevice = useCallback(async () => {
    if (!userId || !pendingDevice.length) return;
    await moveDevice(userId, pendingDevice.map((p) => p.key));
    await loadServer();
  }, [userId, pendingDevice, moveDevice, loadServer]);

  /** "Not mine / not now": leave them on the device and stop asking on this device. */
  const dismissPendingDevice = useCallback(() => {
    if (!userId) return;
    const declined = readMarks(DECLINED_KEY);
    const next = { ...declined, [userId]: { ...(declined[userId] ?? {}) } };
    for (const p of pendingDevice) next[userId][p.key] = p.count;
    writeMarks(DECLINED_KEY, next);
    setPendingDevice([]);
  }, [userId, pendingDevice]);

  /** Re-read after a purchase (a pass may now unlock the Journal). */
  const refresh = useCallback(async () => {
    if (!userId) return;
    if (!(await loadServer())) await loadDevice(true);
  }, [userId, loadServer, loadDevice]);

  return {
    ready: mode !== "loading",
    refresh,
    mode,
    entries,
    total,
    unlimited,
    add,
    completeReview,
    pendingDeviceCount: pendingDevice.reduce((s, p) => s + p.count, 0),
    confirmPendingDevice,
    dismissPendingDevice,
  };
}
