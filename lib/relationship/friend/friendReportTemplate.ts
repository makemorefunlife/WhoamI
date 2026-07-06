import type { FriendRuleContext } from "./buildFriendRuleContext";
import type { FriendKillerSections } from "./friendKillerSections";

export type FriendSocialReport = FriendKillerSections;

export function buildFriendSocialReport(ctx: FriendRuleContext): FriendSocialReport {
  return ctx.killerSections;
}
