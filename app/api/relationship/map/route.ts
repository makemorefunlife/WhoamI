import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteSupabaseClient, supabaseConfigErrorResponse } from "@/lib/supabase/serverClient";
import { assertOwnedReportAccess } from "@/lib/report/assertOwnedReportAccess";
import { resolveRequestLocale } from "@/lib/i18n/llmLocale";
import { getMessages } from "@/lib/i18n/messages";
import { logServerError } from "@/lib/security/safeLog";
import { computeRelationshipMap } from "@/lib/relationship/map/computeRelationshipMap";
import { RELATIONSHIP_ROLES, isRelationshipRoleId } from "@/lib/relationship/map/relationshipRoleSsot";
import { selectDisplayedPeople } from "@/lib/relationship/map/selectDisplayedPeople";

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

    let rolePeople:
      | {
          roleId: string;
          total: number;
          people: { key: string; name: string; relationshipReportId: string; partnerReportId: string }[];
        }
      | undefined;

    if (roleIdParam && isRelationshipRoleId(roleIdParam)) {
      const all = result.peopleByRole.get(roleIdParam) ?? [];
      const shown = selectDisplayedPeople(all);
      rolePeople = {
        roleId: roleIdParam,
        total: all.length,
        people: shown.map((p) => ({
          key: p.key,
          name: p.name,
          relationshipReportId: p.relationshipReportId,
          partnerReportId: p.partnerReportId,
        })),
      };
    }

    return NextResponse.json({
      totalPeople: result.totalPeople,
      roles,
      ...(rolePeople ? { rolePeople } : {}),
    });
  } catch (e) {
    logServerError("relationship/map:", e, "internal_error");
    return NextResponse.json({ error: messages.errors.generic }, { status: 500 });
  }
}
