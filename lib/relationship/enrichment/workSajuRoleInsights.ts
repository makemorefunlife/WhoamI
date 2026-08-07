import type { Locale } from "@/lib/i18n/locale";
import type { ChartContext } from "@/lib/saju/chartContext";
import { countElements } from "@/lib/saju/elements";
import type { WorkScoringSignals } from "@/lib/saju/workPairAnalysis";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/workColleague/workColleagueCopy";

/**
 * current_enriched 전용(Work) — 사주 Pair CE 신호만 사용하는 3개 항목.
 * 11축 psych는 이 파일에서 절대 읽지 않는다(사용자 지정 "엄격한 분리 원칙").
 * 새 카드를 만들지 않고 기존 office.section_* 문자열 필드에 덧붙인다.
 */

type Element = "wood" | "fire" | "earth" | "metal" | "water";

const ELEMENT_GENERATES: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

function dominantElement(chart: ChartContext): Element {
  const counts = countElements(chart);
  const sorted = (Object.entries(counts) as [Element, number][]).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "earth";
}

/**
 * 항목 1 — 상대 때문에 지치는 부분 (설기 hasElementMutualComplement + 충
 * hasStemClashOrOvercome/hasMonthDirectChung만 사용). 방향은 오행 생(生)
 * 관계로 판정 — 상대를 생(生)해주는 쪽이 기운을 내주는(설기당하는) 쪽.
 */
export function buildEnergyDrainLine(params: {
  sig: WorkScoringSignals;
  chartA: ChartContext;
  chartB: ChartContext;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { sig, chartA, chartB, nameA, nameB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  if (!sig.hasElementMutualComplement && !sig.hasStemClashOrOvercome && !sig.hasMonthDirectChung) {
    return null;
  }

  let core: string | null = null;
  if (sig.hasElementMutualComplement) {
    const elA = dominantElement(chartA);
    const elB = dominantElement(chartB);
    const aDrains = ELEMENT_GENERATES[elA] === elB;
    const bDrains = ELEMENT_GENERATES[elB] === elA;
    const drainedName = aDrains ? nameA : bDrains ? nameB : null;
    const otherName = aDrains ? nameB : bDrains ? nameA : null;
    if (drainedName && otherName) {
      core = pick(
        locale,
        `Working together tends to channel ${drainedName}'s energy toward ${otherName} — so after a stretch of collaboration, ${drainedName} is usually the one running on empty, even when it doesn't show on the outside.`,
        `같이 일하다 보면 ${drainedName}의 기운이 ${otherName} 쪽으로 흘러 들어가는 구조예요 — 협업이 끝나면 티는 안 나도 ${drainedName}이(가) 먼저 방전되는 편이에요.`,
      );
    }
  }

  const clashClause =
    sig.hasStemClashOrOvercome || sig.hasMonthDirectChung
      ? pick(
          locale,
          " On top of that, there's a bit of an underlying clash between you, so it's worth building in a short reset after any long stretch of working closely together.",
          " 게다가 미묘하게 부딪히는 지점도 있어서, 긴 협업 뒤에는 짧게라도 각자 정리할 시간을 의식적으로 넣어주는 게 좋아요.",
        )
      : "";

  if (!core && !clashClause) return null;
  if (!core) return clashClause.trimStart();
  return `${core}${clashClause}`;
}

export type DirectionExecutionSplit = {
  directionLeaderIsA: boolean;
  executionLeaderIsA: boolean;
};

/**
 * 항목 4의 판정만 분리 — synergy_one_liner 문장과 section_roles.person_a/b의
 * "무기(weapons)" 뱃지가 서로 다른 방향/실행 결론을 말하는 역할 충돌 버그를
 * 고치려면, 문장(buildDirectionExecutionLine)과 뱃지 라벨 둘 다 같은 승자
 * 판정을 공유해야 한다. 새 계산 없음 — buildDirectionExecutionLine이 원래
 * 내부에서 하던 판정을 그대로 꺼낸 것.
 */
export function resolveDirectionExecutionSplit(
  countsA: TenGodCounts,
  countsB: TenGodCounts,
): DirectionExecutionSplit | null {
  const pA = profileTenGods(countsA);
  const pB = profileTenGods(countsB);

  const officerGap = Math.abs(pA.officer - pB.officer);
  const foodGap = Math.abs(pA.food - pB.food);
  // 두 축 모두 뚜렷한 격차가 있어야 "방향 vs 실행" 분리가 근거 있게 성립한다.
  if (officerGap < 1 || foodGap < 1) return null;

  const directionLeaderIsA = pA.officer > pB.officer;
  const executionLeaderIsA = pA.food > pB.food;
  // 같은 사람이 방향·실행을 둘 다 쥐면 "역할 분리" 서사가 억지로 나온다 — 생략.
  if (directionLeaderIsA === executionLeaderIsA) return null;

  return { directionLeaderIsA, executionLeaderIsA };
}

/**
 * 항목 4 — 누가 방향을 잡고 누가 실행하는가 (십성 관성 vs 식상 크기 비교만
 * 사용). `profileTenGods`는 marriage/friend 도메인에서도 재사용하는
 * 도메인 무관 공용 함수 — 여기서 새로 계산하지 않고 그대로 재사용.
 */
export function buildDirectionExecutionLine(params: {
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { countsA, countsB, nameA, nameB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const split = resolveDirectionExecutionSplit(countsA, countsB);
  if (!split) return null;

  const directionName = split.directionLeaderIsA ? nameA : nameB;
  const executionName = split.executionLeaderIsA ? nameA : nameB;

  return pick(
    locale,
    `${directionName} is the one who naturally takes charge of the overall direction and the final call, while ${executionName} is quicker at turning an idea into something real. Splitting it that way — ${directionName} owning direction, ${executionName} owning execution — is what keeps this partnership moving instead of stalling on who's responsible for what.`,
    `전체 방향을 잡고 최종 결정을 내리는 힘은 ${directionName}이(가) 강하고, 아이디어를 빠르게 실제로 만들어내는 힘은 ${executionName}이(가) 앞서요. ${directionName}이(가) 방향을, ${executionName}이(가) 실행을 맡는 식으로 책임을 나눠야 "누가 책임질지" 흔들리지 않고 프로젝트가 굴러가요.`,
  );
}

/**
 * 항목 7 — 피해야 할 업무 조합 (friction 패킷: 원진/귀문/충/해파만 사용).
 */
export function buildAvoidCombinationLine(params: {
  sig: WorkScoringSignals;
  locale?: Locale;
}): string | null {
  const { sig } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  if (
    !sig.hasWonjinOrGuimun &&
    !sig.hasStemClashOrOvercome &&
    !sig.hasMonthDirectChung &&
    !sig.hasHaPaHae
  ) {
    return null;
  }

  return pick(
    locale,
    "There's a real friction current between you two that flares up for reasons that are hard to pin down. A co-lead setup where decision power is split exactly 50-50 is the riskiest structure you could choose — once authority overlaps, even small disagreements can spiral. Assign a clear primary and secondary owner from the start instead.",
    "이 둘 사이엔 이유 없이 자꾸 부딪히는 기류가 흐르는 편이에요. 의사결정권을 정확히 50대 50으로 나누는 공동 리드 체제는 가장 위험한 구조예요 — 권한이 겹치는 순간 사소한 의견 차이도 크게 번질 수 있어요. 처음부터 주 담당·부 담당을 명확히 나눠서 시작하세요.",
  );
}
