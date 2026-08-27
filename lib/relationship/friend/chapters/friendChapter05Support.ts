/**
 * Friend Chapter 5 — "힘들 때 우리는 어떤 친구인가"
 * Projects FriendResponseIntelligence.personA/B.support + directional +
 * pair.supportMismatch. No new analysis — see spec §9.
 *
 * Both blocks A and B show BOTH people (or both directions) — this is a
 * comparison chapter, not a single-viewer narrative (spec §9 CH5-A/CH5-B).
 */
import type { Locale } from "@/lib/i18n/locale";
import type { FriendResponseIntelligence, FriendDirectionalSupport } from "@/lib/relationship/friend/response/friendResponseIntelligenceTypes";
import { SUPPORT_MODE_COPY, SUPPORT_ADAPTATION_COPY } from "./friendChapterCopyDictionary";

function pick(locale: Locale, en: string, ko: string): string {
  return locale === "en-US" ? en : ko;
}

export type FriendChapter05Support = {
  /** ◤ 힘들 때 나는 — BOTH people's general support style. */
  myStyle: {
    name: string;
    headline: string;
    description: string;
    confidence: FriendResponseIntelligence["personA"]["support"]["confidence"];
  }[];
  /** ◤ 이 친구가 힘들 때 내가 해주는 것 — BOTH directions (A→B, B→A), with genuine adaptation. */
  whatIGive: {
    giverName: string;
    receiverName: string;
    headline: string;
    description: string;
    fit: FriendDirectionalSupport["fit"];
    confidence: FriendDirectionalSupport["confidence"];
  }[];
  /** ◤ 위로가 엇갈리는 순간 */
  mismatch: {
    hasMeaningfulMismatch: boolean;
    headline: string;
    description: string;
  };
  /** ◤ 우리에게 잘 통하는 위로법 — pair synthesis only, reuses upstream fields */
  whatWorks: {
    headline: string;
    description: string;
  };
};

function directionalBlock(
  locale: Locale,
  giverName: string,
  receiverName: string,
  d: FriendDirectionalSupport,
): { giverName: string; receiverName: string; headline: string; description: string; fit: FriendDirectionalSupport["fit"]; confidence: FriendDirectionalSupport["confidence"] } {
  const givenModeCopy = SUPPORT_MODE_COPY[d.giverCapability];
  const adaptationCopy = SUPPORT_ADAPTATION_COPY[d.adaptation];

  let description: string;
  if (d.adaptation === "NO_ADAPTATION") {
    description = pick(
      locale,
      `${giverName}'s usual way of showing up — ${givenModeCopy.label(locale).toLowerCase()} — already fits what ${receiverName} needs, so nothing really shifts here.`,
      `${giverName}의 평소 방식("${givenModeCopy.label(locale)}")이 ${receiverName}에게 필요한 것과 이미 잘 맞아서, 특별히 다르게 하지 않아도 통하는 편이에요.`,
    );
  } else if (adaptationCopy) {
    description = adaptationCopy(locale, giverName, receiverName);
  } else {
    // LOW_EVIDENCE — conservative wording, no strong behavioral claim (spec §6).
    description = pick(
      locale,
      `There isn't enough signal yet to say how ${giverName} adapts specifically for ${receiverName}.`,
      `${giverName}이(가) ${receiverName}에게 특별히 다르게 맞추는 부분까지는 아직 뚜렷한 근거가 부족해요.`,
    );
  }

  return {
    giverName,
    receiverName,
    headline: givenModeCopy.label(locale),
    description,
    fit: d.fit,
    confidence: d.confidence,
  };
}

export function buildFriendChapter05Support(params: {
  intel: FriendResponseIntelligence;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): FriendChapter05Support {
  const locale = params.locale ?? "ko-KR";
  const { intel, nameA, nameB } = params;

  const myStyle = [
    { name: nameA, profile: intel.personA.support },
    { name: nameB, profile: intel.personB.support },
  ].map(({ name, profile }) => {
    const copy = SUPPORT_MODE_COPY[profile.primaryMode];
    return { name, headline: copy.label(locale), description: copy.asGiven(locale, name), confidence: profile.confidence };
  });

  const whatIGive = [
    directionalBlock(locale, nameA, nameB, intel.directional.aToB),
    directionalBlock(locale, nameB, nameA, intel.directional.bToA),
  ];

  // Derived directly from each person's OWN support label — never a
  // hardcoded literal disconnected from primaryMode (spec: CH5 contradiction
  // fix). "Same starting point" and "different starting point" both read the
  // actual labels, so the copy can never assert a shared direction that
  // contradicts what myStyle says two lines above.
  const mismatch = intel.pair.supportMismatch;
  const labelA = SUPPORT_MODE_COPY[intel.personA.support.primaryMode].label(locale).toLowerCase();
  const labelB = SUPPORT_MODE_COPY[intel.personB.support.primaryMode].label(locale).toLowerCase();
  const sameMode = intel.personA.support.primaryMode === intel.personB.support.primaryMode;

  const mismatchOut = sameMode
    ? {
        hasMeaningfulMismatch: false,
        headline: pick(locale, "You reach for comfort the same way", "위로를 찾는 방식이 비슷함"),
        description: pick(
          locale,
          `You both lead with the same thing — "${labelA}" — so support rarely gets lost in translation here.`,
          `둘 다 "${labelA}" 쪽으로 먼저 다가가는 편이라, 위로 방식이 크게 엇갈리지 않는 편이에요.`,
        ),
      }
    : {
        hasMeaningfulMismatch: mismatch.hasMeaningfulMismatch,
        headline: pick(locale, "You start from different places", "둘은 위로의 출발점이 달라요"),
        description: pick(
          locale,
          `${nameA} leans toward "${labelA}," while ${nameB} leans toward "${labelB}" — worth naming, not assuming.`,
          `${nameA}은(는) "${labelA}" 쪽에 가깝고, ${nameB}은(는) "${labelB}" 쪽에 가까워요 — 서로 다르다는 걸 아는 것만으로도 도움이 돼요.`,
        ),
      };

  const whatWorksHeadline = pick(
    locale,
    `Ask before assuming which mode is needed`,
    `필요한 게 뭔지 먼저 확인하고 다가가기`,
  );
  const whatWorksDescription = sameMode
    ? pick(
        locale,
        `Since you're both wired the same way here, you rarely need to ask — just don't drag out the fix-it part before the feeling's been named once.`,
        `둘 다 비슷한 쪽이라 따로 확인할 필요는 적지만, 해결책부터 꺼내기 전에 감정을 한 번은 짚어주는 게 도움이 돼요.`,
      )
    : pick(
        locale,
        `Before jumping to your default, a simple "do you want to talk it through or just sit with it?" closes most of the gap — and lets both your strengths actually land.`,
        `힘든 이야기를 꺼낼 때 지금 필요한 게 공감인지 해결책인지 먼저 확인하면, 두 사람의 장점이 모두 살아나요.`,
      );

  return {
    myStyle,
    whatIGive,
    mismatch: mismatchOut,
    whatWorks: { headline: whatWorksHeadline, description: whatWorksDescription },
  };
}
