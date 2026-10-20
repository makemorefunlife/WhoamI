import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locale";
import { viewerGroupReportIds } from "@/lib/account/profileGroup";
import { logServerError } from "@/lib/security/safeLog";
import {
  fetchRelationshipReportRowsForHub,
} from "@/lib/relationship/fetchReportsWhereParticipant";
import { isRelationshipPremiumComplete } from "@/lib/relationship/isRelationshipPremiumComplete";
import { fetchAccessiblePremiumKinds } from "@/lib/relationship/premiumAccess";
import { fetchFavoriteRelationshipIds } from "@/lib/relationship/analysisLog";
import { parseRelationshipKind } from "@/lib/relationship/relationshipKind";
import { inviteExpiryCutoffIso } from "@/lib/relationship/inviteExpiry";
import {
  partnerNameFromLogSnapshot,
} from "@/lib/relationship/resolvePartnerDisplayName";
import {
  relationshipFallbackNames,
  resolveOtherNameOrEmpty,
} from "@/lib/relationship/relationshipPersonNames";
import { resolveClerkProfilesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";
import {
  compareStringTieBreakDesc,
  isoTimestampMs,
  sortByIsoTimestampDesc,
} from "@/lib/relationship/sortByIsoTimestampDesc";


function isBasicComplete(resultBasic: unknown): boolean {
  const basic = resultBasic as { perspectives?: unknown } | null;
  return (
    basic != null &&
    typeof basic === "object" &&
    basic.perspectives != null &&
    typeof basic.perspectives === "object"
  );
}

export type HubRowKind =
  | "outbound_waiting"
  | "relationship_outbound"
  | "relationship_inbound"
  | "relationship_manual"
  | "relationship_other";

/** YYYY-MM-DD */
function dateOnly(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const s = String(iso).trim();
  if (s.length >= 10) return s.slice(0, 10);
  return null;
}

/**
 * The relationship hub list for one report (moved unchanged from
 * app/api/relationship/list/route.ts so it can be tested without a request;
 * the route still does auth + ownership first). A main report with grouped
 * reports (lib/account/profileGroup.ts) lists their relationships too.
 */
export async function buildRelationshipHubList(
  supabase: SupabaseClient,
  params: {
    reportId: string;
    locale: Locale;
    limit: number | undefined;
    formatSimple: boolean;
    scope: string;
    favoritesOnly: boolean;
    includeWaiting: boolean;
  },
): Promise<
  | { ok: true; body: { relationships: unknown[]; meta: { completed_total: number; waiting_total: number; favorites_total: number } } }
  | { ok: false; status: number; body: { error: string } }
> {
  const { reportId, locale, limit, formatSimple, scope, favoritesOnly, includeWaiting } = params;
  // Reading the list must never delete anything. (It used to call
  // cleanupStaleOpenInvites here, which removed every open invite of a
  // viewer who already had a relationship -- including the one just
  // created and shared.) Expired invites are only hidden here; removing
  // them is a separate, deliberate job.
  // The account's main report plus its grouped reports
  // (lib/account/profileGroup.ts). One id for every ungrouped account, so
  // everything below reads exactly what it read before.
  const viewerIds = await viewerGroupReportIds(supabase, reportId);
  const [favoriteSets, rowsByViewer, openInvitesResult] = await Promise.all([
    Promise.all(viewerIds.map((v) => fetchFavoriteRelationshipIds(supabase, v))),
    Promise.all(viewerIds.map((v) => fetchRelationshipReportRowsForHub(supabase, v))),
    supabase
      .from("invites")
      .select("id, invite_token, status, relationship_report_id, created_at")
      .in("from_report_id", viewerIds)
      .eq("status", "open")
      .gt("created_at", inviteExpiryCutoffIso())
      .order("created_at", { ascending: false }),
  ]);
  const favoriteIds = new Set<string>(favoriteSets.flatMap((f) => [...f]));
  // Which of the account's reports is the participant of each row (main first).
  const viewerOfRow = new Map<string, string>();
  const rows: (typeof rowsByViewer)[number] = [];
  rowsByViewer.forEach((list, i) => {
    for (const r of list) {
      if (viewerOfRow.has(r.id)) continue;
      // A relationship between two of the account's own grouped reports (the
      // person with themself) is kept as it is in the database but is not a
      // friend: never listed. Only possible when the account is grouped.
      if (viewerIds.length > 1 && viewerIds.includes(r.report_id_a) && viewerIds.includes(r.report_id_b)) continue;
      viewerOfRow.set(r.id, viewerIds[i]);
      rows.push(r);
    }
  });
  const viewerOf = (rrId: string) => viewerOfRow.get(rrId) ?? reportId;

  const { data: openInvites, error: invErr } = openInvitesResult;

  rows.sort((a, b) => b.id.localeCompare(a.id));

  const rrIds = rows.map((r) => r.id);
  const inviteByRrId = new Map<
    string,
    { from_report_id: string; accepted_report_id: string | null }
  >();

  if (rrIds.length > 0) {
    const { data: invRows, error: invBatchErr } = await supabase
      .from("invites")
      .select("relationship_report_id, from_report_id, accepted_report_id")
      .in("relationship_report_id", rrIds);

    if (!invBatchErr && invRows) {
      for (const ir of invRows) {
        const rid = ir.relationship_report_id as string | undefined;
        if (rid)
          inviteByRrId.set(rid, {
            from_report_id: ir.from_report_id as string,
            accepted_report_id: (ir.accepted_report_id as string) ?? null,
          });
      }
    }
  }

  if (invErr) {
    logServerError("relationship/list invites:", invErr, "internal_error");
    return { ok: false as const, status: 500, body: { error: invErr.message } };
  }

  const partnerIds = rows.map((r) =>
    r.report_id_a === viewerOf(r.id) ? r.report_id_b : r.report_id_a,
  );
  const uniquePartners = [...new Set(partnerIds)];

  const { data: names } =
    uniquePartners.length > 0
      ? await supabase
          .from("reports")
          .select("id, name, report_type, clerk_user_id")
          .in("id", uniquePartners)
      : {
          data: [] as {
            id: string;
            name: string | null;
            report_type: string | null;
            clerk_user_id: string | null;
          }[],
        };

  const nameById = Object.fromEntries(
    (names ?? []).map((n) => [n.id, n.name?.trim() ?? ""]),
  );
  const typeById = Object.fromEntries(
    (names ?? []).map((n) => [n.id, n.report_type ?? ""]),
  );
  // reports.name is only ever populated for partner_manual contacts (no
  // Clerk account); a real connected friend's canonical name (and photo)
  // live on their own Clerk account instead — see resolveClerkDisplayNames.ts.
  // BUT a partner_manual report's clerk_user_id is the OWNER's own Clerk id
  // (used for ownership checks, e.g. partner-name/route.ts), never the
  // manual contact's own identity — resolving a Clerk name/photo for it
  // would leak the owner's own display name/photo onto every manually-added
  // friend. Skip the lookup for those rows.
  const clerkProfileByClerkUserId = await resolveClerkProfilesByUserId(
    (names ?? [])
      .filter((n) => n.report_type !== "partner_manual")
      .map((n) => n.clerk_user_id),
  );
  const clerkNameByReportId = Object.fromEntries(
    (names ?? []).map((n) => [
      n.id,
      n.clerk_user_id && n.report_type !== "partner_manual"
        ? (clerkProfileByClerkUserId[n.clerk_user_id]?.displayName ?? "")
        : "",
    ]),
  );
  const avatarUrlByReportId = Object.fromEntries(
    (names ?? []).map((n) => [
      n.id,
      n.clerk_user_id && n.report_type !== "partner_manual"
        ? (clerkProfileByClerkUserId[n.clerk_user_id]?.avatarUrl ?? null)
        : null,
    ]),
  );

  const logNameByRrId = new Map<string, string>();
  if (rrIds.length > 0) {
    const { data: logRows } = await supabase
      .from("relationship_analysis_logs")
      .select("relationship_report_id, result_snapshot, created_at")
      .in("viewer_report_id", viewerIds)
      .in("relationship_report_id", rrIds)
      .order("created_at", { ascending: false });

    for (const log of logRows ?? []) {
      const rrId = log.relationship_report_id as string;
      if (logNameByRrId.has(rrId)) continue;
      const fromLog = partnerNameFromLogSnapshot(
        (log.result_snapshot ?? {}) as Record<string, unknown>,
      );
      if (fromLog) logNameByRrId.set(rrId, fromLog);
    }
  }

  const relationships: {
    list_key: string;
    row_kind: HubRowKind;
    pipeline_title: string;
    relationship_report_id: string | null;
    partner_name: string;
    partner_avatar_url: string | null;
    partner_report_id: string | null;
    analysis_type: "basic" | "premium" | null;
    status: "completed" | "pending";
    last_viewed: string | null;
    invite_token: string | null;
    outbound_invite_id: string | null;
    status_hint: string | null;
    is_favorite: boolean;
    relationship_kind: string;
    added_at: string | null;
    /** The account's report that is the participant (main or grouped). */
    viewer_report_id: string;
  }[] = [];

  if (includeWaiting) {
    for (const inv of openInvites ?? []) {
      if (inv.relationship_report_id) continue;
      relationships.push({
        list_key: `open-${inv.id}`,
        row_kind: "outbound_waiting",
        pipeline_title: "상대방 정보 요청 전송됨",
        relationship_report_id: null,
        partner_name: "상대방",
        partner_avatar_url: null,
        partner_report_id: null,
        analysis_type: null,
        status: "pending",
        last_viewed: dateOnly(inv.created_at),
        invite_token: inv.invite_token ?? null,
        outbound_invite_id: inv.id,
        status_hint: null,
        is_favorite: false,
        relationship_kind: "friendship",
        added_at: inv.created_at ?? null,
        viewer_report_id: reportId,
      });
    }
  }

  // Readiness by what THIS viewer can open (own + actively shared to them),
  // asked per participant report of the account.
  const accessibleByRr = new Map<string, Awaited<ReturnType<typeof fetchAccessiblePremiumKinds>> extends Map<string, infer V> ? V : never>();
  for (const v of viewerIds) {
    const ids = rows.filter((r) => viewerOf(r.id) === v).map((r) => r.id as string);
    if (ids.length === 0) continue;
    const part = await fetchAccessiblePremiumKinds(supabase, v, ids, locale);
    for (const [k, val] of part) accessibleByRr.set(k, val);
  }

  for (const r of rows) {
    const rowViewer = viewerOf(r.id);
    const partnerId =
      r.report_id_a === rowViewer ? r.report_id_b : r.report_id_a;
    // Canonical rule (lib/relationship/relationshipPersonNames.ts), same as
    // the report page; localized fallback instead of hard-coded Korean.
    // A name recorded in the latest analysis log is only a last resort
    // before the fallback (never over a live override/account nickname).
    const partnerName =
      resolveOtherNameOrEmpty({
        isManualPartner: typeById[partnerId] === "partner_manual",
        reportName: nameById[partnerId],
        accountDisplayName: clerkNameByReportId[partnerId],
        logName: logNameByRrId.get(r.id),
      }) || relationshipFallbackNames(locale).other;
    const at = r.analysis_type as string;
    const analysisType: "basic" | "premium" | null =
      at === "premium" || at === "basic" ? at : null;

    const basicDone = isBasicComplete(r.result_basic);
    const premiumDone = isRelationshipPremiumComplete(
      at,
      r.result_premium_by_kind,
      r.relationship_kind,
      locale,
      accessibleByRr.get(r.id as string),
    );
    const completed = basicDone && (at !== "premium" || premiumDone);

    const inv = inviteByRrId.get(r.id);

    let row_kind: HubRowKind = "relationship_other";
    let pipeline_title = "관계 분석";
    if (typeById[partnerId] === "partner_manual") {
      row_kind = "relationship_manual";
      pipeline_title = `${partnerName}님과의 관계 (직접 입력)`;
    } else if (inv) {
      if (inv.from_report_id === rowViewer) {
        row_kind = "relationship_outbound";
        pipeline_title = completed
          ? `보낸 초대 · ${partnerName}님과의 관계`
          : `보낸 초대 · ${partnerName}님 (분석 준비 중)`;
      } else if (inv.accepted_report_id === rowViewer) {
        row_kind = "relationship_inbound";
        pipeline_title = completed
          ? `받은 초대 · ${partnerName}님과의 관계`
          : `받은 초대 · ${partnerName}님 (분석 준비 중)`;
      }
    } else {
      pipeline_title = `${partnerName}님과의 관계`;
    }

    let status_hint: string | null = null;
    if (completed) {
      status_hint = "지금 입장에서 관계 요약을 볼 수 있어요.";
    } else if (basicDone && at === "premium" && !premiumDone) {
      status_hint =
        "기본 분석은 있어요. 관계 종류를 고른 뒤 심화 분석을 이어서 만들 수 있어요.";
    } else if (basicDone) {
      status_hint =
        "기본 분석까지 준비됐어요. 심화 분석은 관계 종류를 고르면 생성돼요.";
    } else {
      status_hint =
        "기본 관계 분석을 만드는 중이에요. 잠시 후 다시 열어보세요.";
    }

    relationships.push({
      list_key: `rr-${r.id}`,
      row_kind,
      pipeline_title,
      relationship_report_id: r.id,
      partner_name: partnerName,
      partner_avatar_url: avatarUrlByReportId[partnerId] ?? null,
      partner_report_id: partnerId,
      analysis_type: analysisType,
      status: completed ? "completed" : "pending",
      last_viewed: null,
      invite_token: null,
      outbound_invite_id: null,
      status_hint,
      is_favorite: favoriteIds.has(r.id),
      relationship_kind: parseRelationshipKind(r.relationship_kind),
      added_at: r.created_at ?? null,
      viewer_report_id: rowViewer,
    });
  }

  // 동일 상대(partner_report_id) 중복 행 — 분석 완료·즐겨찾기 우선 1건만
  const deduped: typeof relationships = [];
  const byPartner = new Map<string, (typeof relationships)[number]>();
  for (const rel of relationships) {
    if (rel.row_kind === "outbound_waiting" || !rel.partner_report_id) {
      deduped.push(rel);
      continue;
    }
    const pid = rel.partner_report_id;
    const prev = byPartner.get(pid);
    if (!prev) {
      byPartner.set(pid, rel);
      continue;
    }
    const score = (item: (typeof relationships)[number]) => {
      let s = 0;
      if (item.status === "completed") s += 4;
      if (item.is_favorite) s += 2;
      if (item.row_kind === "relationship_manual") s += 1;
      return s;
    };
    const sRel = score(rel);
    const sPrev = score(prev);
    if (sRel > sPrev) {
      byPartner.set(pid, rel);
    } else if (sRel === sPrev && rel.viewer_report_id !== prev.viewer_report_id) {
      // Same person on the main and a grouped report: the main report's row.
      if (rel.viewer_report_id === reportId) byPartner.set(pid, rel);
    } else if (sRel === sPrev) {
      if (isoTimestampMs(rel.added_at) > isoTimestampMs(prev.added_at)) {
        byPartner.set(pid, rel);
      }
    }
  }
  deduped.push(...byPartner.values());
  relationships.length = 0;
  relationships.push(
    ...sortByIsoTimestampDesc(
      deduped,
      (r) => r.added_at,
      (a, b) =>
        compareStringTieBreakDesc(a.list_key ?? "", b.list_key ?? ""),
    ),
  );

  if (favoritesOnly) {
    const favOnly = relationships.filter(
      (r) =>
        r.relationship_report_id != null &&
        favoriteIds.has(r.relationship_report_id),
    );
    relationships.length = 0;
    relationships.push(...favOnly);
  }

  const completedRows = relationships.filter(
    (r) => r.relationship_report_id != null && r.status === "completed",
  );
  const completed_total = completedRows.length;

  let out = relationships;
  if (scope === "completed") {
    out = completedRows;
  }
  if (limit != null) {
    out = out.slice(0, limit);
  }

  type SimpleRow = {
    list_key: string;
    partner_name: string;
    status: "completed" | "pending";
    relationship_report_id: string | null;
  };

  const relationshipsOut: typeof relationships | SimpleRow[] = formatSimple
    ? (out as typeof relationships).map((r) => ({
        list_key: r.list_key,
        partner_name: r.partner_name,
        status: r.status,
        relationship_report_id: r.relationship_report_id,
      }))
    : out;

  const waiting_total = includeWaiting
    ? relationships.filter((r) => r.row_kind === "outbound_waiting").length
    : (openInvites ?? []).filter((inv) => !inv.relationship_report_id).length;

  return {
    ok: true as const,
    body: {
      relationships: relationshipsOut,
      meta: {
        completed_total,
        waiting_total,
        favorites_total: favoriteIds.size,
      },
    },
  };
}
