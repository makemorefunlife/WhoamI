/**
 * Part2③ 자산 관리 주도권(CFO) & 소비 스위치 — 사양서의 "정재/관성(미래 안정)
 * vs 편재/식상(현재 삶의 질)" 소비가치관 분리 + 11축[현실실리/자기통제] 확인문구.
 * Phase 5-2: refineHouseholdCfo가 base pick + psych/spending/chores 신호를 조합한다.
 * pickHouseholdCfo 자체는 재호출하지 않는다.
 */
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import type { CohabitationSajuSignals } from "@/lib/personCore/sajuSignals/types";
import { pick, LEGACY_FALLBACK_LOCALE } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";
import {
  buildHouseholdCfoReason,
  profileTenGods,
  resolveCfoAffinityScore,
  type TenGodCounts,
} from "./marriageTenGodAnalysis";

type WealthOfficerPower = CohabitationSajuSignals["wealth_officer_power"];

export type SpendingLean = "stability" | "experience" | "balanced";

export function resolveSpendingLean(counts: TenGodCounts): SpendingLean {
  const jeongJae = counts["정재"] ?? 0;
  const pyeonJae = counts["편재"] ?? 0;
  if (jeongJae === pyeonJae) return "balanced";
  return jeongJae > pyeonJae ? "stability" : "experience";
}

/** 정재(안정 지향) vs 편재(경험 지향) — 사주 전용, psych 불필요 */
export function resolveSpendingStyleNote(
  countsA: TenGodCounts,
  countsB: TenGodCounts,
  nicknameA: string,
  nicknameB: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  const leanA = resolveSpendingLean(countsA);
  const leanB = resolveSpendingLean(countsB);

  if (leanA === leanB) {
    if (leanA === "stability") {
      return pick(
        locale,
        `${nicknameA} & ${nicknameB} both lean toward saving and future security — agree on a shared savings target early so neither feels the other is "too tight."`,
        `${nicknameA} & ${nicknameB} 둘 다 적금·미래 대비 쪽으로 기우는 편이에요 — 공동 저축 목표를 미리 합의해 두면 서로 "너무 짠 거 아니야?" 하는 서운함이 안 생겨요.`,
      );
    }
    if (leanA === "experience") {
      return pick(
        locale,
        `${nicknameA} & ${nicknameB} both lean toward spending on experiences and quality of life — set a monthly "fun budget" cap together so enjoying life doesn't quietly drain savings.`,
        `${nicknameA} & ${nicknameB} 둘 다 경험·삶의 질에 지출하는 쪽으로 기우는 편이에요 — 매달 "즐거움 예산" 상한을 같이 정해 두면 즐기다가 저축이 조용히 줄어드는 일을 막을 수 있어요.`,
      );
    }
    return pick(
      locale,
      `${nicknameA} & ${nicknameB} are both fairly balanced between saving and spending — no strong tendency to correct, just keep checking in occasionally.`,
      `${nicknameA} & ${nicknameB} 둘 다 저축·소비 사이에서 비교적 균형 잡힌 편이에요 — 딱히 교정할 성향은 없고, 가끔 서로 확인만 하면 돼요.`,
    );
  }

  const [stableName, otherName, otherLean] =
    leanA === "stability"
      ? [nicknameA, nicknameB, leanB]
      : [nicknameB, nicknameA, leanA];

  if (otherLean === "experience") {
    return pick(
      locale,
      `${stableName} leans toward saving and future security, while ${otherName} leans toward spending on today's experiences — split the budget into a "future" pot and a "today" pot so neither side's values get overridden.`,
      `${stableName}은(는) 저축·미래 대비 쪽, ${otherName}은(는) 오늘의 경험·삶의 질 쪽으로 기울어요 — 예산을 "미래" 통장과 "오늘" 통장으로 나눠 두면 어느 한쪽 가치관이 눌리지 않아요.`,
    );
  }

  return pick(
    locale,
    `${stableName} leans toward saving, and ${otherName} is fairly balanced — ${stableName}'s instinct toward security can guide shared savings, with room for ${otherName}'s occasional splurges.`,
    `${stableName}은(는) 저축 쪽으로 기울고 ${otherName}은(는) 비교적 균형 잡힌 편이에요 — ${stableName}의 안정 감각을 공동 저축 기준으로 삼되, ${otherName}의 가끔의 지출은 여유를 둬도 좋아요.`,
  );
}

const AXIS_NOTE_GAP_HIGH = 20;
const AXIS_NOTE_GAP_LOW = 8;

/**
 * CFO로 뽑힌 사람의 현실실리(practicality)/자기통제(self_control) 평균이
 * 파트너보다 뚜렷이 높으면 확인, 오히려 낮으면 유보 문구. 격차가 작으면 null
 * (억지로 안 붙임). `pickHouseholdCfo`의 기존 판정 자체는 안 건드림.
 */
export function resolveCfoAxisNote(
  psychMatch: PsychMatchResult | null,
  cfoIsA: boolean,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psychMatch) return null;
  const practicality = psychMatch.axis_results.find(
    (r) => r.axis_key === "practicality",
  );
  const selfControl = psychMatch.axis_results.find(
    (r) => r.axis_key === "self_control",
  );
  if (!practicality || !selfControl) return null;

  const cfoScore =
    ((cfoIsA ? practicality.score_a : practicality.score_b) +
      (cfoIsA ? selfControl.score_a : selfControl.score_b)) /
    2;
  const partnerScore =
    ((cfoIsA ? practicality.score_b : practicality.score_a) +
      (cfoIsA ? selfControl.score_b : selfControl.score_a)) /
    2;
  const diff = cfoScore - partnerScore;

  if (diff >= AXIS_NOTE_GAP_HIGH) {
    return pick(
      locale,
      "The 11-axis survey backs this up too — this person's practicality and self-control scores run clearly higher, so the CFO role fits the psychological data as well.",
      "11축 설문에서도 확인돼요 — 이 사람의 현실실리·자기통제 점수가 뚜렷하게 높아서, CFO 역할이 심리 데이터로도 뒷받침돼요.",
    );
  }
  if (diff <= AXIS_NOTE_GAP_LOW * -1) {
    return pick(
      locale,
      "Survey scores actually lean the other way on practicality/self-control — the saju-based pick may need a second look together before locking it in.",
      "설문 점수는 오히려 반대로 나와요(현실실리·자기통제) — 사주 기반 CFO 지정을 그대로 확정하기 전에 둘이 한 번 더 확인해 보세요.",
    );
  }
  return null;
}

// ─── Phase 5-2 CFO composite ────────────────────────────────────────────────

/** pair cohabitation leader threshold와 동일 */
const SAJU_CFO_LOCK = 12;
const COMPOSITE_MARGIN = 12;
const PSYCH_FLIP_GAP = 20;

function psychCfoAvg(psych: PsychMasterJson): number {
  const { practicality, self_control } = psych.secondary_axes;
  return (practicality + self_control) / 2;
}

function spendingCfoBonus(lean: SpendingLean): number {
  if (lean === "stability") return 6;
  if (lean === "experience") return -4;
  return 0;
}

/** chores 신호 — masterScores는 이미 계산됨. risk 높으면 flip 억제. */
function choresFlipPenalty(
  benefit: number | undefined,
  risk: number | undefined,
): number {
  if (typeof risk === "number" && risk >= 55) return 8;
  if (
    typeof benefit === "number" &&
    benefit >= 65 &&
    typeof risk === "number" &&
    risk < 50
  ) {
    return -2;
  }
  return 0;
}

function softCfoReason(baseReason: string, locale: Locale): string {
  return `${baseReason} ${pick(
    locale,
    "Survey axes are mixed — keep the CFO split flexible and review big spends together.",
    "설문 축은 엇갈려 있어요 — CFO 역할을 너무 굳히지 말고 큰 지출은 함께 확인해 보세요.",
  )}`;
}

export type RefineHouseholdCfoParams = {
  baseNickname: string;
  baseReason: string;
  nicknameA: string;
  nicknameB: string;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  branchCodesA: Set<string>;
  branchCodesB: Set<string>;
  wealthOfficerPowerA?: WealthOfficerPower | null;
  wealthOfficerPowerB?: WealthOfficerPower | null;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  /** 이미 계산된 pair dual 신호 */
  dualCfoWar?: boolean | null;
  masterBenefit?: number;
  masterRisk?: number;
  locale?: Locale;
};

export type RefinedHouseholdCfo = {
  nickname: string;
  reason: string;
  confidence?: "high" | "low";
  align?: "confirms" | "caution";
  dual?: boolean;
};

/**
 * Phase 5-2 — pickHouseholdCfo base + psych/spending/chores 조합.
 * psych 누락 시 base 그대로. 강한 saju(|affinity|≥12) flip 금지.
 * pickHouseholdCfo 재호출 없음.
 */
export function refineHouseholdCfo(
  params: RefineHouseholdCfoParams,
): RefinedHouseholdCfo {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const {
    baseNickname,
    baseReason,
    nicknameA,
    nicknameB,
    psychA,
    psychB,
  } = params;

  if (!psychA || !psychB) {
    return { nickname: baseNickname, reason: baseReason };
  }

  const scoreA = resolveCfoAffinityScore(
    params.countsA,
    params.branchCodesA,
    params.wealthOfficerPowerA,
  );
  const scoreB = resolveCfoAffinityScore(
    params.countsB,
    params.branchCodesB,
    params.wealthOfficerPowerB,
  );
  const sajuDiff = scoreA - scoreB;
  const sajuLocked = Math.abs(sajuDiff) >= SAJU_CFO_LOCK;

  const psychAScore = psychCfoAvg(psychA);
  const psychBScore = psychCfoAvg(psychB);
  const psychDiff = psychAScore - psychBScore;

  const leanA = resolveSpendingLean(params.countsA);
  const leanB = resolveSpendingLean(params.countsB);
  const choresPenalty = choresFlipPenalty(
    params.masterBenefit,
    params.masterRisk,
  );

  const compositeA =
    scoreA + psychAScore * 0.35 + spendingCfoBonus(leanA) - choresPenalty / 2;
  const compositeB =
    scoreB + psychBScore * 0.35 + spendingCfoBonus(leanB) - choresPenalty / 2;
  const compositeDiff = compositeA - compositeB;

  const dualFromSignals =
    Boolean(params.wealthOfficerPowerA?.dual_power_risk) &&
    Boolean(params.wealthOfficerPowerB?.dual_power_risk);
  const dual =
    Boolean(params.dualCfoWar) ||
    dualFromSignals ||
    (params.wealthOfficerPowerA?.economic_dominance_band === "high" &&
      params.wealthOfficerPowerB?.economic_dominance_band === "high");

  const baseIsA = baseNickname === nicknameA;
  const compositeWinner: "a" | "b" | "balanced" =
    compositeDiff >= COMPOSITE_MARGIN
      ? "a"
      : compositeDiff <= -COMPOSITE_MARGIN
        ? "b"
        : "balanced";

  const clearFlip =
    compositeWinner !== "balanced" &&
    ((compositeWinner === "a" && !baseIsA) ||
      (compositeWinner === "b" && baseIsA)) &&
    Math.abs(psychDiff) >= PSYCH_FLIP_GAP;

  if (dual) {
    return {
      nickname: baseNickname,
      reason: softCfoReason(baseReason, locale),
      confidence: "low",
      align: "caution",
      dual: true,
    };
  }

  if (clearFlip && !sajuLocked) {
    const nickname = compositeWinner === "a" ? nicknameA : nicknameB;
    const loser = nickname === nicknameA ? nicknameB : nicknameA;
    const winnerPower =
      nickname === nicknameA
        ? params.wealthOfficerPowerA
        : params.wealthOfficerPowerB;
    const winnerCounts =
      nickname === nicknameA ? params.countsA : params.countsB;
    const high =
      winnerPower?.economic_dominance_band === "high" ||
      profileTenGods(winnerCounts).wealthOfficer >= 3;
    return {
      nickname,
      reason: softCfoReason(
        buildHouseholdCfoReason(nickname, loser, high, locale),
        locale,
      ),
      confidence: "high",
      align: "caution",
    };
  }

  if (clearFlip && sajuLocked) {
    return {
      nickname: baseNickname,
      reason: softCfoReason(baseReason, locale),
      confidence: "low",
      align: "caution",
    };
  }

  if (compositeWinner === "balanced") {
    return {
      nickname: baseNickname,
      reason: softCfoReason(baseReason, locale),
      confidence: "low",
      align: "caution",
    };
  }

  const matchesBase =
    (compositeWinner === "a" && baseIsA) ||
    (compositeWinner === "b" && !baseIsA);
  return {
    nickname: baseNickname,
    reason: matchesBase
      ? baseReason
      : softCfoReason(baseReason, locale),
    confidence: matchesBase ? "high" : "low",
    align: matchesBase ? "confirms" : "caution",
  };
}
