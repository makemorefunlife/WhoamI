import type { Locale } from "@/lib/i18n/locale";
import { resolveClerkDisplayNamesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";
import {
  resolveMeDisplayName,
  resolveOtherDisplayName,
  slotDisplayNames,
} from "@/lib/relationship/relationshipPersonNames";

type ReportRowLike = {
  name?: string | null;
  report_type?: string | null;
  clerk_user_id?: string | null;
} | null | undefined;

type ClerkUserLike = {
  publicMetadata?: unknown;
  fullName?: string | null;
  firstName?: string | null;
} | null | undefined;

/**
 * Server-side: canonical names for both participants of a relationship
 * report, per report slot (labelA = report_id_a, labelB = report_id_b), for
 * generation prompts. Same rule as the report page
 * (lib/relationship/relationshipPersonNames.ts): the prompt receives exactly
 * the names the page shows, so newly generated prose uses them.
 */
export async function resolveRelationshipPairLabels(params: {
  viewerReportId: string;
  reportIdA: string;
  reportIdB: string;
  repA: ReportRowLike;
  repB: ReportRowLike;
  viewerClerkUser: ClerkUserLike;
  locale: Locale | string;
}): Promise<{ labelA: string; labelB: string; meDisplayName: string; otherDisplayName: string }> {
  const viewerIsReportA = params.viewerReportId === params.reportIdA;
  const viewerRep = viewerIsReportA ? params.repA : params.repB;
  const otherRep = viewerIsReportA ? params.repB : params.repA;
  const otherIsManual = otherRep?.report_type === "partner_manual";
  // A manual person's clerk_user_id is MY id (I created the row) -- never
  // look it up as their account name.
  const otherClerkNames =
    !otherIsManual && otherRep?.clerk_user_id
      ? await resolveClerkDisplayNamesByUserId([otherRep.clerk_user_id])
      : {};
  const meDisplayName = resolveMeDisplayName({
    accountDisplayName: (params.viewerClerkUser?.publicMetadata as Record<string, unknown> | undefined)
      ?.displayName,
    reportName: viewerRep?.name,
    clerkFullName: params.viewerClerkUser?.fullName,
    clerkFirstName: params.viewerClerkUser?.firstName,
    locale: params.locale,
  });
  const otherDisplayName = resolveOtherDisplayName({
    isManualPartner: otherIsManual,
    reportName: otherRep?.name,
    accountDisplayName: otherRep?.clerk_user_id ? otherClerkNames[otherRep.clerk_user_id] : undefined,
    locale: params.locale,
  });
  const slots = slotDisplayNames({ viewerIsReportA, meDisplayName, otherDisplayName });
  return { labelA: slots.a, labelB: slots.b, meDisplayName, otherDisplayName };
}
