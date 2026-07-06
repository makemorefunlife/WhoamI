import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";

export const FRIEND_SOCIAL_DEEP_FORMAT = "friend_social_deep_v1" as const;

export type FriendSocialDeepReport = {
  format: typeof FRIEND_SOCIAL_DEEP_FORMAT;
  report: FriendReportBody;
};

export function isFriendSocialDeepReport(
  payload: unknown,
): payload is FriendSocialDeepReport {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as FriendSocialDeepReport;
  return (
    p.format === FRIEND_SOCIAL_DEEP_FORMAT &&
    Boolean(p.report?.friend?.section_social_dna_a?.social_title)
  );
}
