import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { readJsonBodyLimited } from "@/lib/security/requestValidation";
import { logServerError } from "@/lib/security/safeLog";
import { importDeviceEntries, type DeviceGroup } from "@/lib/decision/serverJournal";

export const runtime = "nodejs";

/**
 * Moves this device's Journal records into the signed-in account, without
 * duplicates (device ids are kept) and without deleting the device copy.
 * Records of a profile owned by this account move automatically; records
 * with no provable owner move only when the person confirms (confirmKeys);
 * records of another account's profile never move.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();
  try {
    const parsed = await readJsonBodyLimited(req, 1_000_000);
    if (!parsed.ok) return parsed.response;
    const body = (parsed.body ?? {}) as { groups?: unknown; confirmKeys?: unknown };
    const groups = (Array.isArray(body.groups) ? body.groups : [])
      .filter((g): g is DeviceGroup => Boolean(g && typeof g === "object" && typeof (g as DeviceGroup).key === "string"))
      .slice(0, 50)
      .map((g) => ({ key: String(g.key).slice(0, 200), reportId: String(g.reportId ?? ""), entries: Array.isArray(g.entries) ? g.entries : [] }));
    const confirmKeys = Array.isArray(body.confirmKeys) ? body.confirmKeys.filter((k): k is string => typeof k === "string") : [];
    const out = await importDeviceEntries(supabase, userId, groups, confirmKeys);
    if (!out) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    return NextResponse.json(out);
  } catch (e) {
    logServerError("decision/journal/import", e, "internal_error");
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
