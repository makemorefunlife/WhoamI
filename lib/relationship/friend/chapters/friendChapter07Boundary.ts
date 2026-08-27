/**
 * Friend Chapter 7 — "친해도 넘지 말아야 할 선"
 * Projects FriendResponseIntelligence.personA/B.boundary. No blaming
 * language — a lower capability is framed as a difference, not a flaw
 * (spec §11 CH7-C).
 */
import type { Locale } from "@/lib/i18n/locale";
import type { FriendResponseIntelligence } from "@/lib/relationship/friend/response/friendResponseIntelligenceTypes";
import {
  RELATIONSHIP_NEED_COPY,
  BOUNDARY_BEHAVIOR_COPY,
  BOUNDARY_WHY_COPY,
  SUPPORT_MODE_COPY,
  FREEDOM_NEED_COPY,
} from "./friendChapterCopyDictionary";

function pick(locale: Locale, en: string, ko: string): string {
  return locale === "en-US" ? en : ko;
}

export type FriendChapter07Boundary = {
  /** ◤ 내가 우정에서 중요하게 보는 것 (per person) */
  myNeeds: { name: string; needs: { label: string; importance: "PRIMARY" | "SECONDARY" }[] }[];
  /** ◤ 이건 나에게 선을 넘는 행동 (per person, each behavior with why it matters) */
  myBoundaries: { name: string; behaviors: { label: string; why: string }[] }[];
  /** ◤ 이 친구에게 기대하지 않는 게 좋은 것 (per person, only when a real gap exists) */
  expectationAdjustments: { name: string; headline: string; description: string }[];
  /** ◤ 서로에게 이 정도 자유는 주기 — ONE strongest pair-level insight */
  freedomToGive: { headline: string; description: string } | null;
};

export function buildFriendChapter07Boundary(params: {
  intel: FriendResponseIntelligence;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): FriendChapter07Boundary {
  const locale = params.locale ?? "ko-KR";
  const { intel, nameA, nameB } = params;

  const people = [
    { name: nameA, boundary: intel.personA.boundary },
    { name: nameB, boundary: intel.personB.boundary },
  ];

  const myNeeds = people.map(({ name, boundary }) => ({
    name,
    needs: boundary.needs.map((n) => ({ label: RELATIONSHIP_NEED_COPY[n.key](locale), importance: n.importance })),
  }));

  const myBoundaries = people.map(({ name, boundary }) => ({
    name,
    behaviors: boundary.boundaries.map((b) => ({
      label: BOUNDARY_BEHAVIOR_COPY[b.behavior](locale),
      why: BOUNDARY_WHY_COPY[b.fromNeed](locale),
    })),
  }));

  // Directionality must be explicit — WHO expects, FROM WHOM (spec: CH7-C).
  // expectationOwnerId/providerId come straight from FriendExpectationAdjustment,
  // never inferred from array position, so this can't silently point the wrong way.
  const nameById: Record<string, string> = { a: nameA, b: nameB };
  const expectationAdjustments = people
    .filter(({ boundary }) => boundary.expectationAdjustment !== null)
    .map(({ boundary }) => {
      const adj = boundary.expectationAdjustment!;
      const ownerName = nameById[adj.expectationOwnerId] ?? "";
      const providerName = nameById[adj.providerId] ?? "";
      const gapCopy = SUPPORT_MODE_COPY[adj.gapMode];
      const headline = pick(
        locale,
        `What ${ownerName} can adjust expecting from ${providerName}`,
        `${ownerName}이(가) ${providerName}에게 기대를 조정하면 좋은 것`,
      );
      const description =
        adj.resolution === "ACCEPT_DIFFERENT_EXPRESSION"
          ? pick(
              locale,
              `${providerName} may not lead with "${gapCopy.label(locale).toLowerCase()}" — but that doesn't mean ${providerName} cares less, just that it shows up differently. Worth ${ownerName} not reading the absence as a lack of care.`,
              `${providerName}은(는) "${gapCopy.label(locale)}" 방식이 먼저 나오는 타입은 아니지만, 그렇다고 마음이 덜한 게 아니라 표현 방식이 다른 것뿐이에요. ${ownerName}이(가) 이걸 무심함으로 읽지 않는 게 도움이 돼요.`,
            )
          : pick(
              locale,
              `If ${ownerName} needs "${gapCopy.label(locale).toLowerCase()}" specifically from ${providerName}, it's worth asking for it directly rather than expecting it to come naturally.`,
              `${ownerName}에게 "${gapCopy.label(locale)}"이(가) 꼭 필요할 땐, ${providerName}에게서 자연스럽게 나오길 기다리기보다 직접 말해서 요청하는 게 더 확실해요.`,
            );
      return { name: ownerName, headline, description };
    });

  // ONE strongest pair-level freedom insight — prefer whichever person has a
  // real (non-null) signal; if both do, prefer the one with richer evidence.
  const freedomCandidates = people.filter(({ boundary }) => boundary.freedomNeed !== null);
  let freedomToGive: FriendChapter07Boundary["freedomToGive"] = null;
  if (freedomCandidates.length > 0) {
    const strongest = freedomCandidates.sort((a, b) => b.boundary.evidence.length - a.boundary.evidence.length)[0];
    const key = strongest.boundary.freedomNeed!;
    const label = FREEDOM_NEED_COPY[key](locale);
    freedomToGive = {
      headline: pick(locale, `Give ${strongest.name} room for this`, `${strongest.name}에게는 이 부분에서 여유를 주기`),
      description: pick(
        locale,
        `${label} — not as distance, just as how ${strongest.name} stays comfortable in the friendship.`,
        `${label} — 이건 거리를 두는 게 아니라, ${strongest.name}이(가) 편하게 관계를 유지하는 방식이에요.`,
      ),
    };
  }

  return { myNeeds, myBoundaries, expectationAdjustments, freedomToGive };
}
