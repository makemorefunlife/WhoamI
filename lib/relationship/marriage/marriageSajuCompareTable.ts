import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./marriageCopy";
import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import { profileTenGods, type TenGodCounts } from "./marriageTenGodAnalysis";
import { communicationArchetype } from "./marriageConflictCommunication";
import { resolveMannerArchetype } from "./bedroomProfile";
import type { EconomicDominanceBand } from "@/lib/personCore/sajuSignals/types";

/**
 * 부부/동거 "한눈에 비교" 표 — work·friend 표와 동일하게 **사주가 메인**이
 * 되도록 설계했다(제품 전반 통일). friend 도메인에서 겪은 두 가지 함정을
 * 처음부터 피해서 설계했다:
 *   1. 6행 모두 서로 다른 신호를 쓴다(같은 값 재사용 없음) — 이미 계산돼
 *      있는 person-level 신호(가사 스트레스=십신 카테고리, 부부싸움
 *      소통=explosive/stonewall 점수, 침실 리드=manner archetype, 원가족
 *      바운더리=needsStrongBoundary, 자산관리=economic dominance band,
 *      육아=parenting style)를 그대로 재사용해 6개 모두 독립적이다.
 *   2. 이진/삼진 분류는 전부 "두 점수를 서로 비교"하는 방식(상대적 비교)을
 *      쓰거나, 이미 프로덕션에서 검증된 기존 함수를 그대로 재사용해서
 *      friend 표에서 겪었던 "한쪽으로 80% 쏠리는 절대 컷오프" 함정을
 *      피했다. 다만 실측 검증은 아직 안 했으므로, 실사용 테스트에서 특정
 *      행이 자주 뭉치면 friend 표처럼 threshold를 조정할 수 있다.
 *
 * | 행 | 신호 | 근거 |
 * |---|---|---|
 * | 가사/루틴 스트레스 | 십신 우세 카테고리 | profileTenGods 기반, friend/work와 동일 원리 |
 * | 부부싸움 소통 | explosive vs stonewall 점수(자기 자신 내 비교) | marriageConflictCommunication.ts의 communicationArchetype 재사용 |
 * | 밤의 리드 스타일 | manner archetype(sweet_guide/power_leader) | bedroomProfile.ts의 resolveMannerArchetype 재사용 — 침실 카드와 동일 신호라 일관성 보장 |
 * | 원가족 바운더리 | needsStrongBoundary | marriageTenGodAnalysis.ts의 analyzeFamilyBoundary 재사용(ctx.tenGod.boundaryA/B) |
 * | 자산관리(CFO) 기질 | economic_dominance_band(SSOT 우선) 또는 재관 합산 로컬 밴드 | CohabitationSajuSignals.wealth_officer_power, 없으면 profileTenGods().wealthOfficer 폴백(friend 행⑤와 동일 패턴) |
 * | 육아/교육 가치관 | parenting style(empathy/structure) | marriageTenGodAnalysis.ts의 resolveParentingStyle 재사용(ctx.tenGod.parentingA/B) |
 */

export type MarriageCompareRowId =
  | "household_stress"
  | "marital_conflict"
  | "bedroom_lead"
  | "family_boundary"
  | "asset_management"
  | "parenting_style";

export type MarriageCompareRow = {
  id: MarriageCompareRowId;
  label: string;
  personA: { nickname: string; shortLabel: string };
  personB: { nickname: string; shortLabel: string };
  meaning: string;
};

type MarriageTenGodCategory = "wealth" | "officer" | "food" | "seal" | "self";

/** 격국과 같은 원리 — 5개 카테고리 중 가장 우세한 것을 고른다(동률이면 고정 우선순위). */
function resolveDominantCategory(counts: TenGodCounts): MarriageTenGodCategory {
  const p = profileTenGods(counts);
  const entries: Array<[MarriageTenGodCategory, number]> = [
    ["food", p.food],
    ["self", p.self],
    ["seal", p.seal],
    ["officer", p.officer],
    ["wealth", p.wealth],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]![0];
}

// ---- 행 1: 가사/루틴 스트레스 (십신 우세 카테고리) ---------------------------

const HOUSEHOLD_STRESS_LABEL: Record<Locale, Record<MarriageTenGodCategory, string>> = {
  "ko-KR": {
    self: "감정 그대로 티 내며 반응하는 타입",
    seal: "말없이 스트레스를 혼자 삭이는 타입",
    food: "그 자리에서 바로 지적하고 얘기하는 타입",
    officer: "규칙·기준부터 정리해서 얘기하는 타입",
    wealth: "실질적으로 정리만 되면 넘어가는 타입",
  },
  "en-US": {
    self: "Reacts openly, doesn't hide the irritation",
    seal: "Bottles up the stress quietly",
    food: "Says something right on the spot",
    officer: "Sorts out the rule/standard before speaking",
    wealth: "Lets it go once it's practically fixed",
  },
};

const HOUSEHOLD_STRESS_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "가사 스트레스를 표현하는 방식이 비슷해서 서로 눈치 볼 일이 적어요.",
    diff: "표현 방식이 서로 달라요 — 조용해지는 쪽이 있다면 먼저 '괜찮아?' 하고 물어봐 주는 게 도움이 돼요.",
  },
  "en-US": {
    same: "You express household stress the same way, so there's little guessing games.",
    diff: "You show it differently — if one of you tends to go quiet, the other checking in first goes a long way.",
  },
};

// ---- 행 2: 부부싸움 소통 (explosive vs stonewall, 자기 내 상대 비교) ---------

type ConflictBand = "explosive" | "stonewall" | "balanced";

function resolveConflictBand(counts: TenGodCounts): ConflictBand {
  const { explosive, stonewall } = communicationArchetype(counts);
  if (explosive >= stonewall + 2) return "explosive";
  if (stonewall >= explosive + 2) return "stonewall";
  return "balanced";
}

const CONFLICT_LABEL: Record<Locale, Record<ConflictBand, string>> = {
  "ko-KR": {
    explosive: "감정이 올라오면 바로 말로 쏟아내는 타입",
    stonewall: "감정이 커지면 입을 닫아버리는 타입",
    balanced: "극단적이지 않게 대화로 풀려는 타입",
  },
  "en-US": {
    explosive: "Vents in words the moment emotion rises",
    stonewall: "Shuts down and goes quiet when emotion builds",
    balanced: "Leans toward working it out through conversation",
  },
};

function conflictComboKey(a: ConflictBand, b: ConflictBand): string {
  return [a, b].sort().join("|");
}

const CONFLICT_COMBO_MEANING: Record<Locale, Record<string, string>> = {
  "ko-KR": {
    "explosive|explosive":
      "둘 다 감정을 바로 쏟아내는 타입이라 싸움이 빨리 붙지만 빨리 풀리기도 해요. 동시에 폭발하면 서로 말이 안 들리니, 한 명은 먼저 멈추는 연습이 필요해요.",
    "stonewall|stonewall":
      "둘 다 조용해지는 타입이라 겉으론 평화로워 보이지만 속으로 쌓일 수 있어요. 주기적으로 먼저 꺼내는 루틴이 필요해요.",
    "balanced|balanced":
      "둘 다 극단적이지 않아 대화로 풀 가능성이 높아요. '괜찮아'로 그냥 넘기지만 않으면 좋아요.",
    "explosive|stonewall":
      "한쪽은 즉시 쏟아내고, 다른 쪽은 입을 닫아요. 쫓을수록 더 닫히는 악순환이 생기기 쉬우니 타임아웃 후 '돌아올 시간'을 약속하는 게 중요해요.",
    "balanced|explosive":
      "한쪽은 감정을 바로 쏟아내는 편이고, 다른 쪽은 비교적 차분해요. 차분한 쪽이 먼저 들어주면 빨리 풀려요.",
    "balanced|stonewall":
      "한쪽은 조용해지는 편이고, 다른 쪽은 비교적 차분해요. 조용해진 쪽에게 먼저 다가가 시간을 주는 게 도움이 돼요.",
  },
  "en-US": {
    "explosive|explosive":
      "You're both the type to vent right away, so fights ignite fast but also resolve fast. If you both erupt at once neither hears the other — one of you needs to be the one who pauses first.",
    "stonewall|stonewall":
      "You both go quiet, so things look peaceful on the surface while feelings can pile up underneath. A regular routine of bringing things up first helps.",
    "balanced|balanced":
      "Neither of you leans extreme, so there's a good chance conflict gets worked out through conversation — just don't brush things off with 'it's fine.'",
    "explosive|stonewall":
      "One of you vents immediately, the other shuts down. The more one chases, the more the other closes off — a timeout plus a promised 'time to come back' matters here.",
    "balanced|explosive":
      "One of you vents right away, the other stays relatively calm. Things resolve faster when the calmer one listens first.",
    "balanced|stonewall":
      "One of you tends to go quiet, the other stays relatively calm. It helps when the calmer one reaches out first and gives space.",
  },
};

function resolveConflictMeaning(locale: Locale, a: ConflictBand, b: ConflictBand): string {
  return CONFLICT_COMBO_MEANING[locale][conflictComboKey(a, b)]!;
}

// ---- 행 3: 밤의 리드 스타일 (manner archetype, 침실 카드와 동일 신호) --------

const BEDROOM_LEAD_LABEL: Record<Locale, Record<"sweet_guide" | "power_leader", string>> = {
  "ko-KR": {
    sweet_guide: "상대 만족을 먼저 챙기는 타입",
    power_leader: "침실 주도권을 확실히 쥐는 타입",
  },
  "en-US": {
    sweet_guide: "Puts the partner's satisfaction first",
    power_leader: "Firmly takes the lead",
  },
};

const BEDROOM_LEAD_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "침실에서 원하는 역할이 비슷해서 조율이 필요할 수 있어요 — 가끔은 먼저 리드를 양보해 보세요.",
    diff: "한쪽은 리드하고 싶어하고, 다른 쪽은 맞춰주는 걸 편하게 느껴요 — 이 조합이 자연스럽게 맞물리는 경우가 많아요.",
  },
  "en-US": {
    same: "You want a similar role in the bedroom, which can need some coordination — try trading the lead sometimes.",
    diff: "One of you wants to lead, the other is comfortable following — this combination tends to click naturally.",
  },
};

// ---- 행 4: 원가족 바운더리 (needsStrongBoundary) -----------------------------

function boundaryComboKey(a: boolean, b: boolean): string {
  return [a, b].sort().join("|");
}

const FAMILY_BOUNDARY_LABEL: Record<Locale, Record<"true" | "false", string>> = {
  "ko-KR": {
    true: "원가족과 확실히 거리를 둬야 편한 타입",
    false: "원가족과 적당히 가까워도 괜찮은 타입",
  },
  "en-US": {
    true: "Needs clear distance from family of origin to feel at ease",
    false: "Comfortable staying reasonably close with family of origin",
  },
};

const FAMILY_BOUNDARY_COMBO_MEANING: Record<Locale, Record<string, string>> = {
  "ko-KR": {
    "true|true":
      "둘 다 원가족과 거리 조절이 필요한 타입이라 서로의 바운더리 욕구를 잘 이해해 줄 수 있어요.",
    "false|false":
      "둘 다 원가족과 가깝게 지내도 괜찮은 타입이라 왕래에 대한 마찰이 적어요.",
    "false|true":
      "한쪽은 거리가 필요하고, 다른 쪽은 가까워도 괜찮아해요. 거리가 필요한 쪽의 기준을 먼저 존중해 주는 게 갈등을 줄여요.",
  },
  "en-US": {
    "true|true":
      "You both need some distance-management with family of origin, so you can understand each other's boundary needs well.",
    "false|false":
      "You're both comfortable staying close with family of origin, so there's little friction over visits.",
    "false|true":
      "One of you needs distance, the other is fine staying close. Respecting the distance-needing partner's line first reduces conflict.",
  },
};

function resolveFamilyBoundaryMeaning(locale: Locale, a: boolean, b: boolean): string {
  return FAMILY_BOUNDARY_COMBO_MEANING[locale][boundaryComboKey(a, b)]!;
}

// ---- 행 5: 자산관리(CFO) 기질 (economic dominance band, SSOT 우선) -----------

function resolveEconomicBand(
  counts: TenGodCounts,
  ssotBand?: EconomicDominanceBand,
): EconomicDominanceBand {
  if (ssotBand) return ssotBand;
  const wealthOfficer = profileTenGods(counts).wealthOfficer;
  if (wealthOfficer >= 2) return "high";
  if (wealthOfficer >= 1) return "medium";
  return "low";
}

const ASSET_LABEL: Record<Locale, Record<EconomicDominanceBand, string>> = {
  "ko-KR": {
    high: "재정을 확실히 주도하고 싶어하는 타입",
    medium: "필요할 때는 챙기는 균형형",
    low: "실리보다 감정·편안함을 더 중시하는 타입",
  },
  "en-US": {
    high: "Wants to firmly lead household finances",
    medium: "Balanced — steps up on money matters when it counts",
    low: "Prioritizes comfort/feeling over financial practicality",
  },
};

function assetComboKey(a: EconomicDominanceBand, b: EconomicDominanceBand): string {
  return [a, b].sort().join("|");
}

const ASSET_COMBO_MEANING: Record<Locale, Record<string, string>> = {
  "ko-KR": {
    "high|high":
      "둘 다 재정 주도권을 쥐고 싶어하는 타입이라 자칫 '듀얼 CFO' 갈등이 생기기 쉬워요. 한 명에게 최종 결정권을 명확히 몰아주는 게 안전해요.",
    "low|low":
      "둘 다 실리보다 편안함을 우선하는 타입이라 재정 관리가 느슨해지기 쉬워요. 자동이체·고정 예산 같은 시스템을 미리 만들어두는 게 도움이 돼요.",
    "medium|medium":
      "둘 다 필요할 때는 챙기는 균형형이라 큰 마찰 없이 상황에 맞게 역할을 나눌 수 있어요.",
    "high|low":
      "한쪽이 자연스럽게 재정을 주도하고, 다른 쪽은 맡기는 게 편한 조합이에요. 맡기는 쪽도 가끔은 현황을 같이 확인해 주세요.",
    "high|medium":
      "한쪽이 확실한 리더형이고, 다른 쪽은 필요할 때 거드는 편이에요. 리더가 주도하되 정기적으로 상황을 공유해 주세요.",
    "low|medium":
      "한쪽은 실리보다 편안함을, 다른 쪽은 균형을 중시해요. 균형형 쪽이 큰 결정을 리드하면 무난해요.",
  },
  "en-US": {
    "high|high":
      "You're both the type to want financial leadership, which can turn into a 'dual CFO' clash. It's safer to clearly hand final decisions to just one of you.",
    "low|low":
      "You both prioritize comfort over practicality, so financial management can get loose. Setting up systems like autopay and a fixed budget ahead of time helps.",
    "medium|medium":
      "You're both the balanced type who steps up when it counts, so you can split roles situationally without much friction.",
    "high|low":
      "One of you naturally leads the finances, the other is comfortable leaving it to them — just check in on the numbers together sometimes.",
    "high|medium":
      "One of you is a clear leader type, the other pitches in when it counts. Let the leader drive, with regular check-ins.",
    "low|medium":
      "One of you prioritizes comfort, the other is balanced. Letting the balanced one lead big decisions tends to work well.",
  },
};

function resolveAssetMeaning(
  locale: Locale,
  a: EconomicDominanceBand,
  b: EconomicDominanceBand,
): string {
  return ASSET_COMBO_MEANING[locale][assetComboKey(a, b)]!;
}

// ---- 행 6: 육아/교육 가치관 (parenting style) --------------------------------

const PARENTING_LABEL: Record<Locale, Record<"empathy" | "structure", string>> = {
  "ko-KR": {
    empathy: "아이 감정을 먼저 읽어주는 공감형",
    structure: "규칙·기준을 먼저 세우는 원칙형",
  },
  "en-US": {
    empathy: "Reads the child's emotions first",
    structure: "Sets rules and standards first",
  },
};

function parentingComboKey(a: "empathy" | "structure", b: "empathy" | "structure"): string {
  return [a, b].sort().join("|");
}

const PARENTING_COMBO_MEANING: Record<Locale, Record<string, string>> = {
  "ko-KR": {
    "empathy|empathy":
      "둘 다 아이 감정을 먼저 살피는 타입이라 정서적으로는 안정적이지만, 규칙과 경계가 흐려지지 않게 신경 써야 해요.",
    "structure|structure":
      "둘 다 원칙과 기준을 중시하는 타입이라 일관성은 강하지만, 아이의 감정 표현을 놓치지 않게 의식적으로 챙겨야 해요.",
    "empathy|structure":
      "한쪽은 감정을, 다른 쪽은 원칙을 먼저 챙기는 조합이라 균형이 좋아요. 두 기준이 충돌할 때는 미리 합의해두면 아이 앞에서 의견이 갈리는 걸 막을 수 있어요.",
  },
  "en-US": {
    "empathy|empathy":
      "You both read the child's emotions first, which is emotionally stable — just watch that rules and boundaries don't get blurry.",
    "structure|structure":
      "You both prioritize rules and standards, giving strong consistency — just make a conscious effort not to miss the child's emotional cues.",
    "empathy|structure":
      "One of you leads with emotion, the other with principle — a good balance. Agreeing on this ahead of time prevents visibly disagreeing in front of the child.",
  },
};

function resolveParentingMeaning(
  locale: Locale,
  a: "empathy" | "structure",
  b: "empathy" | "structure",
): string {
  return PARENTING_COMBO_MEANING[locale][parentingComboKey(a, b)]!;
}

// ---- 빌더 -------------------------------------------------------------------

export function buildMarriageSajuCompareTable(params: {
  nicknameA: string;
  nicknameB: string;
  tenGodsA: TenGodCounts;
  tenGodsB: TenGodCounts;
  needsStrongBoundaryA: boolean;
  needsStrongBoundaryB: boolean;
  parentingStyleA: "empathy" | "structure";
  parentingStyleB: "empathy" | "structure";
  economicDominanceBandA?: EconomicDominanceBand;
  economicDominanceBandB?: EconomicDominanceBand;
  locale?: Locale;
}): MarriageCompareRow[] {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const {
    nicknameA,
    nicknameB,
    tenGodsA,
    tenGodsB,
    needsStrongBoundaryA,
    needsStrongBoundaryB,
    parentingStyleA,
    parentingStyleB,
    economicDominanceBandA,
    economicDominanceBandB,
  } = params;

  const row = (
    id: MarriageCompareRowId,
    label: string,
    shortLabelA: string,
    shortLabelB: string,
    meaning: string,
  ): MarriageCompareRow => ({
    id,
    label,
    personA: { nickname: nicknameA, shortLabel: sanitizeHomeLifeText(shortLabelA) },
    personB: { nickname: nicknameB, shortLabel: sanitizeHomeLifeText(shortLabelB) },
    meaning: sanitizeHomeLifeText(meaning),
  });

  const categoryA = resolveDominantCategory(tenGodsA);
  const categoryB = resolveDominantCategory(tenGodsB);

  const conflictBandA = resolveConflictBand(tenGodsA);
  const conflictBandB = resolveConflictBand(tenGodsB);

  const mannerA = resolveMannerArchetype(tenGodsA);
  const mannerB = resolveMannerArchetype(tenGodsB);

  const economicBandA = resolveEconomicBand(tenGodsA, economicDominanceBandA);
  const economicBandB = resolveEconomicBand(tenGodsB, economicDominanceBandB);

  return [
    row(
      "household_stress",
      pick(locale, "Household Stress Reaction", "가사/루틴 스트레스"),
      HOUSEHOLD_STRESS_LABEL[locale][categoryA],
      HOUSEHOLD_STRESS_LABEL[locale][categoryB],
      categoryA === categoryB
        ? HOUSEHOLD_STRESS_MEANING[locale].same
        : HOUSEHOLD_STRESS_MEANING[locale].diff,
    ),
    row(
      "marital_conflict",
      pick(locale, "Conflict Communication Style", "부부싸움 소통"),
      CONFLICT_LABEL[locale][conflictBandA],
      CONFLICT_LABEL[locale][conflictBandB],
      resolveConflictMeaning(locale, conflictBandA, conflictBandB),
    ),
    row(
      "bedroom_lead",
      pick(locale, "Bedroom Leadership Style", "밤의 리드 스타일"),
      BEDROOM_LEAD_LABEL[locale][mannerA],
      BEDROOM_LEAD_LABEL[locale][mannerB],
      mannerA === mannerB
        ? BEDROOM_LEAD_MEANING[locale].same
        : BEDROOM_LEAD_MEANING[locale].diff,
    ),
    row(
      "family_boundary",
      pick(locale, "Family-of-Origin Boundary", "원가족 바운더리"),
      FAMILY_BOUNDARY_LABEL[locale][String(needsStrongBoundaryA) as "true" | "false"],
      FAMILY_BOUNDARY_LABEL[locale][String(needsStrongBoundaryB) as "true" | "false"],
      resolveFamilyBoundaryMeaning(locale, needsStrongBoundaryA, needsStrongBoundaryB),
    ),
    row(
      "asset_management",
      pick(locale, "Financial Leadership (CFO) Style", "자산관리(CFO) 기질"),
      ASSET_LABEL[locale][economicBandA],
      ASSET_LABEL[locale][economicBandB],
      resolveAssetMeaning(locale, economicBandA, economicBandB),
    ),
    row(
      "parenting_style",
      pick(locale, "Parenting & Education Values", "육아/교육 가치관"),
      PARENTING_LABEL[locale][parentingStyleA],
      PARENTING_LABEL[locale][parentingStyleB],
      resolveParentingMeaning(locale, parentingStyleA, parentingStyleB),
    ),
  ];
}
