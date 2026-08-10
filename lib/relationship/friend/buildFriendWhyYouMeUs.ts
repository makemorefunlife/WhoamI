/**
 * Friend "Why You / Why Me / Why Us" — deterministic builder feeding the
 * shared components/relationship/shared/whyYouMeUs/WhyYouMeUsSection.tsx.
 *
 * Follows Romantic V4's *live* pattern (a hardcoded deterministic template
 * per direction, not the unwired LLM expert-synthesis contract) but uses
 * Friend's own evidence, not Romantic's saju attraction signals — friendship
 * doesn't have a spouse-palace-style directional preference system, so
 * "why you" is built from what already makes each person a compelling
 * friend (their own Social DNA profile), not a copy of romantic attraction.
 *
 * - whyYou (I'm drawn to you) <- the PARTNER's own Social DNA profile
 * - whyMe (you're drawn to me) <- the VIEWER's own Social DNA profile
 * - whyUs <- guardian_character synthesis ("우리가 만나면"), already computed
 *   for the Social DNA section's "when we're together" card; falls back to
 *   the soulmate verdict if that overlay is absent.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { SocialDnaPersonSection } from "@/lib/relationship/friend/friendKillerSections";
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import { pick } from "@/lib/relationship/friend/friendCopy";
import type { WhyYouMeUsData } from "@/lib/relationship/shared/whyYouMeUs/whyYouMeUsTypes";

function cardFrom(
  from: "a" | "b",
  to: "a" | "b",
  toName: string,
  person: SocialDnaPersonSection,
  locale: Locale,
): { from: "a" | "b"; to: "a" | "b"; title: string; body: string; signals: string[] } {
  const body = [person.friend_position, person.private_self].filter(Boolean).join(" ");
  return {
    from,
    to,
    title: pick(locale, `What draws you to ${toName}`, `${toName}에게 끌리는 이유`),
    body,
    signals: [person.tikitaka_description, person.battery_description].filter(
      (s): s is string => Boolean(s),
    ),
  };
}

export function buildFriendWhyYouMeUs(
  report: FriendReportBody,
  viewerIsReportA: boolean,
  names: [string, string],
  locale: Locale,
): WhyYouMeUsData | null {
  const f = report.friend;
  if (!f?.section_social_dna_a || !f?.section_social_dna_b) return null;
  const { me, partner } = pickViewerFirstPair(f.section_social_dna_a, f.section_social_dna_b, viewerIsReportA);
  const [nameMe, namePartner] = names;

  const guardian = me.guardian_character ?? partner.guardian_character;
  const whyUsBody = guardian?.description ?? f.section_soulmate?.soulmate_verdict ?? null;
  if (!whyUsBody) return null;

  return {
    whyYou: cardFrom("a", "b", namePartner, partner, locale),
    whyMe: cardFrom("b", "a", nameMe, me, locale),
    whyUs: {
      title: guardian?.label ?? pick(locale, "What only exists between you", "우리이기에 가능한 것"),
      body: whyUsBody,
      mechanism: [],
    },
    moment: null,
    bridge: null,
  };
}
