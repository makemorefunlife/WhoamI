/**
 * Romantic V4 — "이번 해 흐름" (c10_future_timing) from pure Saju calculation.
 *
 * Replaces the old dependency on report.section_6_timeline (a field V1's LLM
 * used to fill in, which V4's canonical-only report never populates — see
 * buildActualFourCeContract.ts's CanonicalOnlyReport comment). Source is
 * buildRomanticFortuneFlow() (lib/relationship/romanticRules/fortuneFlow.ts):
 * pure daewoon/sewoon math from birth date + Saju pillars, no LLM, no
 * dependency on birth time (unknown time already defaults to 12:00 upstream
 * in calculateSajuBundle) — so this chapter is available whenever a real
 * birth date is, not gated on optional legacy report content.
 *
 * No raw term (대운, 세운, 간지, 오행 등) is exposed in output text.
 */
import type { RomanticFortuneFlowResult } from "../../romanticRules/fortuneFlow";
import type { CanonicalRelationshipStoryPlan, ProvenanceRef } from "./canonicalStoryPlanTypes";
import { pick, type NarrativeLocale } from "./narrativeLocale";

type TimingPlan = CanonicalRelationshipStoryPlan["timing"];

function prov(evidenceId: string): ProvenanceRef {
  return {
    evidenceId,
    source: "romantic_fortune_flow",
    sourcePath: evidenceId,
    appliesTo: "relationship",
    confidence: "medium",
    claimBoundary: "combination_judgment",
    priority: "primary",
  };
}

const THEME_BY_INTERACTION: Record<NarrativeLocale, Record<"supportive" | "neutral" | "tension", string>> = {
  "ko-KR": {
    supportive: "지금 이 시기는 전반적으로 관계를 순하게 받쳐주는 흐름이에요 — 큰 결정을 함께 밀어붙이기에 나쁘지 않은 때입니다.",
    neutral: "지금 이 시기는 특별히 순풍도 역풍도 아닌, 두 사람이 만들어가는 만큼 흘러가는 흐름이에요.",
    tension: "지금 이 시기는 평소보다 크고 작은 마찰이 조금 더 잘 일어날 수 있는 흐름이에요 — 급한 결정보다는 서로 확인하며 가는 편이 안전해요.",
  },
  "en-US": {
    supportive: "Right now the overall current is gently on your side — not a bad stretch to push a big decision through together.",
    neutral: "Right now the current isn't pushing you either way in particular — it moves as much as the two of you put into it.",
    tension: "Right now the current runs a little rougher than usual — small and big frictions surface more easily, so checking in with each other beats rushing a decision.",
  },
};

function favorableLine(locale: NarrativeLocale, year: number, currentYear: number): string {
  const isDistant = year > currentYear + 1;
  const yearLabel = isDistant
    ? pick(locale, `${year}년(장기 전망)`, `${year} (Long-term outlook)`)
    : `${year}년`;
  return pick(
    locale,
    `${yearLabel}: 결이 잘 맞아떨어지는 시기예요 — 여행, 동거, 청혼처럼 큰 걸음을 함께 내딛기에 무난해요.`,
    `${yearLabel}: things tend to click into place — a solid window for a big step together, like a trip, moving in, or a proposal.`,
  );
}

function cautionLine(locale: NarrativeLocale, year: number, currentYear: number): string {
  const isDistant = year > currentYear + 1;
  const yearLabel = isDistant
    ? pick(locale, `${year}년(장기 전망)`, `${year} (Long-term outlook)`)
    : `${year}년`;
  return pick(
    locale,
    `${yearLabel}: 평소보다 마찰이 도드라질 수 있는 시기예요 — 큰 결정은 서두르지 말고 한 번 더 확인하고 가세요.`,
    `${yearLabel}: friction tends to surface a bit more than usual — for big decisions, slow down and double-check with each other first.`,
  );
}

/** Pure translation, no LLM. Returns the full `timing` field (theme/windows/signals), or an unavailable stub if fortuneFlow is null (malformed birth date only). */
export function buildRomanticV4TimingFromFortuneFlow(
  fortuneFlow: RomanticFortuneFlowResult | null | undefined,
  locale: NarrativeLocale,
): TimingPlan {
  if (!fortuneFlow) {
    return {
      available: false,
      year: new Date().getFullYear(),
      theme: null,
      favorableWindows: [],
      cautionWindows: [],
      observationSignals: [],
      hideReason: pick(
        locale,
        "생년월일 정보가 확인되지 않아 이번 해 흐름을 계산할 수 없습니다.",
        "This chapter is hidden because a valid birth date isn't available to calculate this year's flow.",
      ),
      provenance: [],
    };
  }

  const langKey = locale === "en-US" ? "en-US" : "ko-KR";
  const theme = THEME_BY_INTERACTION[langKey][fortuneFlow.daewoon.relationship_interaction] || THEME_BY_INTERACTION["ko-KR"].supportive;
  const currentYr = fortuneFlow.sewoon.current_year;
  const favorableWindows = fortuneFlow.sewoon.years
    .filter((y) => y.branch_relation === "combine")
    .map((y) => favorableLine(locale, y.year, currentYr));
  const cautionWindows = fortuneFlow.sewoon.years
    .filter((y) => y.branch_relation === "clash")
    .map((y) => cautionLine(locale, y.year, currentYr));

  return {
    available: true,
    year: fortuneFlow.sewoon.current_year,
    theme,
    favorableWindows,
    cautionWindows,
    observationSignals: [
      pick(
        locale,
        "이 흐름은 정해진 결과가 아니라 참고할 배경일 뿐이에요 — 실제 관계는 두 사람이 그 안에서 어떻게 움직이는지에 달려 있어요.",
        "This flow is background context, not a fixed outcome — what actually happens still comes down to how the two of you move within it.",
      ),
    ],
    hideReason: null,
    provenance: [prov("romantic_fortune_flow.daewoon"), prov("romantic_fortune_flow.sewoon")],
  };
}
