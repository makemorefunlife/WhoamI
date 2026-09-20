import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";
import { computeRelationshipMap } from "@/lib/relationship/map/computeRelationshipMap";
import { RELATIONSHIP_ROLES, isRelationshipRoleId, type RelationshipRoleId } from "@/lib/relationship/map/relationshipRoleSsot";
import { selectDisplayedPeople } from "@/lib/relationship/map/selectDisplayedPeople";
import { paginateRoleDirectory } from "@/lib/relationship/map/paginateRoleDirectory";
import { getOrBuildPersonCore } from "@/lib/personCore/services/getOrBuildPersonCore";
import { resolveDayMasterRelationshipRole } from "@/lib/relationship/map/resolveDayMasterRelationshipRole";

const DIRECTORY_PAGE_SIZE = 20;
const DIRECTORY_PAGE_SIZE_MAX = 50;

export const runtime = "nodejs";

/**
 * My Relationship Map — role-count summary, plus (only when `roleId` is
 * explicitly passed) one page of that role's people.
 *
 * Privacy: the base payload never includes people's names — only
 * role/tenGod/count. Names are included solely under `rolePeople`, and only
 * for the one role the caller explicitly asked for (the map-owner clicking a
 * planet). See relationship-map spec sections 2, 7, 22.
 */
export async function GET(req: Request) {
  const locale = resolveRequestLocale({
    bodyLanguage: null,
    headerLanguage: req.headers.get("x-aha-locale") ?? req.headers.get("accept-language"),
  });
  const messages = getMessages(locale);
  try {
    const sp = new URL(req.url).searchParams;
    const reportId = sp.get("reportId")?.trim();
    if (!reportId) {
      return NextResponse.json({ error: messages.errors.reportIdRequired }, { status: 400 });
    }

    const roleIdParam = sp.get("roleId")?.trim();
    // Relationship Discovery Flow V1: an explicit relationship_report_id
    // the caller already knows about (their own just-formed connection, or
    // one surfaced via GET /api/connect/discoveries) -- lets the client
    // jump straight to "here is that one person's role" without first
    // discovering which role planet they landed on. Not a general
    // person-lookup: only ever resolves an id the caller already holds,
    // same privacy posture as roleId's rolePeople (a name is only ever
    // returned for what was explicitly asked for).
    const focusRelationshipReportIdParam = sp.get("focusRelationshipReportId")?.trim();
    const directoryOffsetParam = sp.get("directoryOffset");
    const directoryOffset =
      directoryOffsetParam != null ? Math.max(0, Number.parseInt(directoryOffsetParam, 10) || 0) : null;
    const directoryLimit = Math.min(
      DIRECTORY_PAGE_SIZE_MAX,
      Math.max(1, Number.parseInt(sp.get("directoryLimit") ?? "", 10) || DIRECTORY_PAGE_SIZE),
    );

    const supabase = createRouteSupabaseClient();
    if (!supabase) return supabaseConfigErrorResponse();

    const { userId } = await auth();
    const access = await assertOwnedReportAccess(supabase, reportId, userId, locale);
    if (access.error) return access.error;

    const result = await computeRelationshipMap(supabase, reportId);

    const roles = RELATIONSHIP_ROLES.map((r) => ({
      roleId: r.roleId,
      tenGod: r.tenGod,
      count: result.roleCounts[r.roleId],
    }));

    type PersonPayload = {
      key: string;
      name: string;
      relationshipReportId: string;
      partnerReportId: string;
    };
    const toPayload = (p: { key: string; name: string; relationshipReportId: string; partnerReportId: string }): PersonPayload => ({
      key: p.key,
      name: p.name,
      relationshipReportId: p.relationshipReportId,
      partnerReportId: p.partnerReportId,
    });

    let rolePeople: { roleId: string; total: number; people: PersonPayload[] } | undefined;
    let roleDirectory:
      | { roleId: string; total: number; people: PersonPayload[]; nextOffset: number | null }
      | undefined;

    if (roleIdParam && isRelationshipRoleId(roleIdParam)) {
      const all = result.peopleByRole.get(roleIdParam) ?? [];

      // Scatter view: the ~30-cap, favorites-first selection (unchanged).
      const shown = selectDisplayedPeople(all);
      rolePeople = { roleId: roleIdParam, total: all.length, people: shown.map(toPayload) };

      // Directory view: the complete list, paginated, newest-first — only
      // computed when explicitly requested (a role-detail "Show more" click).
      if (directoryOffset != null) {
        const page = paginateRoleDirectory(all, directoryOffset, directoryLimit);
        roleDirectory = {
          roleId: roleIdParam,
          total: page.total,
          people: page.people.map(toPayload),
          nextOffset: page.nextOffset,
        };
      }
    }

    let focusPerson:
      | (PersonPayload & { roleId: string; reciprocalRoleId?: RelationshipRoleId })
      | undefined;
    if (focusRelationshipReportIdParam) {
      for (const [roleId, people] of result.peopleByRole) {
        const match = people.find(
          (p) => p.relationshipReportId === focusRelationshipReportIdParam,
        );
        if (match) {
          focusPerson = { roleId, ...toPayload(match) };
          break;
        }
      }
    }

    // Relationship Discovery Flow — 방향 표시 확장: the focused person's
    // reverse-direction role ("what am I, to them"), computed only for this
    // one pair -- never touches computeRelationshipMap's viewer-centered
    // roles/peopleByRole above, so the ordinary map summary and role-click
    // browsing are completely unaffected. Reuses the exact same SSOT
    // function (resolveDayMasterRelationshipRole) the forward direction
    // already used, just called once more with the two Day Masters
    // swapped -- no new role-calculation logic. Best-effort: if either
    // side's Day Master isn't available, focusPerson simply keeps only its
    // existing forward-direction roleId, same as before this change.
    if (focusPerson) {
      try {
        const [viewerCore, otherCore] = await Promise.all([
          getOrBuildPersonCore(reportId),
          getOrBuildPersonCore(focusPerson.partnerReportId),
        ]);
        const viewerDayMaster = viewerCore.saju_master_json.stem_focus.day_stem_code;
        const otherDayMaster = otherCore.saju_master_json.stem_focus.day_stem_code;
        if (viewerDayMaster && otherDayMaster) {
          const reciprocal = resolveDayMasterRelationshipRole({
            viewerDayMaster: otherDayMaster,
            otherDayMaster: viewerDayMaster,
          });
          focusPerson.reciprocalRoleId = reciprocal.roleId;
        }
      } catch (e) {
        logServerError("relationship/map.reciprocalRole", e, "person_core_build_failed");
      }
    }

    return NextResponse.json({
      totalPeople: result.totalPeople,
      roles,
      ...(rolePeople ? { rolePeople } : {}),
      ...(roleDirectory ? { roleDirectory } : {}),
      ...(focusPerson ? { focusPerson } : {}),
    });
  } catch (e) {
    logServerError("relationship/map:", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
