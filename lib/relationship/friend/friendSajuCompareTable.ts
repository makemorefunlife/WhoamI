import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./friendCopy";
import { sanitizeFriendText } from "./friendLanguage";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import type { FriendDnaProfile } from "@/lib/saju/friendAnalysis";
import type { ChartContext } from "@/lib/saju/chartContext";
import { countElements } from "@/lib/saju/pairChartAnalysis";

/**
 * 친구 "한눈에 비교" 표 — work(동료) 표와 동일하게 **사주가 메인**이 되도록
 * 설계했다(사용자 확정 — 제품 전반에서 "한눈에 비교" 표는 사주 중심으로
 * 통일).
 *
 * v1(2026-07-19 초판)은 6행 중 4행이 전부 "십신 우세 카테고리" 하나에서만
 * 파생돼서 문제가 있었고, v2·v3(2026-07-20)에서 행1을 일간 양간/음간으로
 * 교체해 역마살·batteryMode와의 상관관계를 끊었다.
 *
 * v4(2026-07-20, 이번 수정)는 두 사람의 실제 생년월일시(880202 11:10 /
 * 871027 22:30)로 진단 스크립트를 돌려 실측한 결과를 근거로 한다:
 *   - 행②·⑤가 `resolveDominantCategory` 하나를 그대로 재사용하고 있었음
 *     (문구만 다르게 붙인 것) → 행⑤를 재성+관성 합산(wealthOfficer) 기반의
 *     독립 신호로 교체.
 *   - 행④(신강/신약/중화)는 공용 함수 `estimateStrengthBalance`의 margin=2가
 *     넓어서, 실측으로 확인된 것처럼 원점수(5:3 vs 3:4)가 다른데도 둘 다
 *     "중화"로 뭉쳤음 → 공용 함수(연인 등 다른 도메인에서도 쓰임)는 그대로
 *     두고, 이 표 전용으로 동일한 오행 생/극 원리를 로컬 재계산해 margin을
 *     2→1로 좁힘. 신강×신약×중화 9가지 조합에 맞는 관계-의미 문구 6종을
 *     새로 작성해 "중화=혼자/만나서" 식 단정을 없앴다.
 *   - 행⑥(티키타카)은 식상 카운트 "≥2" 컷오프라서 0과 1이 둘 다 "silent"로
 *     뭉쳤음 → 공용 함수(`resolveTikitaka`, Social DNA 카드와 공유)는 그대로
 *     두고, 이 표에서만 식상 원점수를 0/1/2+ 3단계로 세분화.
 *   - 행③의 "마음의 크기는 같아요" 문구는 계산 근거가 없어(표현 방식 차이만
 *     계산됨) 삭제.
 *
 * | 행 | 신호 | 근거 |
 * |---|---|---|
 * | 일상 공유 & 연락 템포 | 일간 양간/음간 | work 표(sajuCompareTable.ts) 행6과 동일 신호. 5:5 균형이라 조정 불필요 |
 * | 서운함 표출 방식 | 십신 우세 카테고리(최댓값) | resolveDominantCategory |
 * | 애정 언어 & 의리 스타일 | 오행(우세 원소) | FriendDnaProfile.dominantElement(이미 계산됨) |
 * | 우정 배터리 충전 | 일간 강약(신강/신약/중화, margin=1 로컬 재계산) | 오행 생/극(받치는 기운 vs 소모·압박 기운) — 공용 함수와 동일 원리, margin만 좁힘 |
 * | 모임 준비 스타일 | 재성+관성 합산(wealthOfficer), 0/1/2+ | 개인별 계획·물류 기질. Part3 총무(friendTreasurerScore)와는 다른 질문 — 역할 추천이 아님 |
 * | 티키타카 대화 리듬 | 식상(food) 원점수, 0/1/2+ | profileTenGods().food — 기존 ≥2 컷오프보다 세분화 |
 */

export type FriendCompareRowId =
  | "daily_share_tempo"
  | "upset_expression"
  | "affection_language"
  | "battery_recharge"
  | "hangout_planning"
  | "communication_rhythm";

export type FriendCompareRow = {
  id: FriendCompareRowId;
  label: string;
  personA: { nickname: string; shortLabel: string };
  personB: { nickname: string; shortLabel: string };
  meaning: string;
  /** 11축 확인 문구 — 현재는 communication_rhythm 행에만 부착. psychMaster 없으면 null */
  psych_note?: string | null;
};

type FriendTenGodCategory = "wealth" | "officer" | "food" | "seal" | "self";

/** 격국과 같은 원리 — 5개 카테고리 중 가장 우세한 것을 고른다(동률이면 고정 우선순위). */
function resolveDominantCategory(counts: TenGodCounts): FriendTenGodCategory {
  const p = profileTenGods(counts);
  const entries: Array<[FriendTenGodCategory, number]> = [
    ["food", p.food],
    ["self", p.self],
    ["seal", p.seal],
    ["officer", p.officer],
    ["wealth", p.wealth],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]![0];
}

/** 0 / 1 / 2+ 3단계 공용 밴드 — 행⑤(재관 합산)·행⑥(식상)에서 재사용. */
type ThreeBand = "none" | "some" | "strong";

function resolveThreeBand(score: number): ThreeBand {
  if (score >= 2) return "strong";
  if (score >= 1) return "some";
  return "none";
}

// ---- 행 1: 일상 공유 & 연락 템포 (일간 양간/음간, work 표 행6과 동일 신호) ----

/** work의 sajuCompareTable.ts와 동일한 세트 — 정확히 5:5로 갈라지는 균형 신호. */
const YANG_STEMS = new Set(["gap", "byeong", "mu", "gyeong", "im"]);

function resolveRhythmBand(dayStemCode: string): "active" | "steady" {
  return YANG_STEMS.has(dayStemCode) ? "active" : "steady";
}

const DAILY_SHARE_LABEL: Record<Locale, Record<"active" | "steady", string>> = {
  "ko-KR": {
    active: "가만히 못 있고 시시콜콜 자주 연락하는 타입",
    steady: "차분하게, 필요할 때 깊게 연락하는 타입",
  },
  "en-US": {
    active: "Restless — likes to check in often, play-by-play",
    steady: "Steady — prefers checking in deeply when it counts",
  },
};

const DAILY_SHARE_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "연락·공유 템포가 비슷해서 '왜 답장이 없지' 같은 서운함이 잘 안 생겨요.",
    diff: "한쪽은 시시콜콜 공유하고 싶어하고, 다른 쪽은 필요할 때만 연락해도 괜찮은 편이에요. 연락 빈도를 서로의 기본값으로 오해하지 않는 게 중요해요.",
  },
  "en-US": {
    same: "Your contact tempo matches, so 'why haven't they texted back' rarely comes up.",
    diff: "One of you wants to share the play-by-play, the other is fine only checking in when it matters. Worth not mistaking the other's default pace for disinterest.",
  },
};

// ---- 행 2: 서운함 표출 방식 --------------------------------------------------

const UPSET_EXPRESSION_LABEL: Record<Locale, Record<FriendTenGodCategory, string>> = {
  "ko-KR": {
    self: "티 내며 알아주길 바라는 타입",
    seal: "혼자 삭이다 조용히 멀어지는 타입",
    food: "그 자리에서 바로 말하는 타입",
    officer: "이유부터 정리한 뒤 얘기하는 타입",
    wealth: "실리로 풀리면 넘어가는 타입",
  },
  "en-US": {
    self: "Wants you to notice",
    seal: "Processes alone, can quietly drift",
    food: "Says it right on the spot",
    officer: "Sorts out the reason before speaking",
    wealth: "Lets it go once it's practically resolved",
  },
};

const UPSET_EXPRESSION_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "서운함을 표현하는 온도가 비슷해서 눈치싸움이 적어요.",
    diff: "표현 방식이 서로 달라요 — 조용해지는 쪽이 있다면, 먼저 '괜찮아?' 하고 물어봐 주는 게 관계를 오래 가게 해요.",
  },
  "en-US": {
    same: "You show hurt feelings at a similar temperature, so there's little guessing games.",
    diff: "You show it differently — if one of you tends to go quiet, the other checking in first with a simple 'you good?' goes a long way.",
  },
};

// ---- 행 3: 애정 언어 & 의리 스타일 (오행) ------------------------------------

const AFFECTION_LABEL: Record<
  Locale,
  Record<"wood" | "fire" | "earth" | "metal" | "water", string>
> = {
  "ko-KR": {
    wood: "관계를 넓히며 편을 들어주는 타입",
    fire: "화끈하게 티 내며 응원하는 타입",
    earth: "묵묵히 곁을 지키며 챙기는 타입",
    metal: "팩트와 원칙으로 확실하게 편들어주는 타입",
    water: "마음을 깊이 헤아리며 챙기는 타입",
  },
  "en-US": {
    wood: "Shows loyalty by bringing people together for you",
    fire: "Shows loyalty loud and proud",
    earth: "Shows loyalty by quietly sticking around",
    metal: "Shows loyalty with straight facts and backing you up",
    water: "Shows loyalty with deep emotional support",
  },
};

// 계산되는 건 "표현 방식(오행)의 차이"뿐이라, 문구도 그 범위 안에서만
// 서술한다. 감정의 크기·진심·의리의 깊이는 계산되지 않으므로 단정하지 않음
// (2026-07-20 사용자 지적으로 "마음의 크기는 같아요" 문구 삭제).
const AFFECTION_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "우정을 표현하는 방식이 비슷해서 서로의 의리를 알아채기 쉬워요.",
    diff: "표현 방식이 서로 달라요 — 서로 다른 언어로 의리를 보여준다는 걸 알아두면 오해가 줄어요.",
  },
  "en-US": {
    same: "You show friendship the same way, so it's easy to recognize each other's loyalty.",
    diff: "You each show loyalty in a different language — worth keeping in mind so it doesn't get misread.",
  },
};

// ---- 행 4: 우정 배터리 충전 (일간 강약: 신강/신약/중화, margin=1 로컬 재계산) --
//
// 공용 함수 estimateStrengthBalance(romanticSajuDerivations.ts, 연인 등
// 다른 도메인에서도 사용)는 건드리지 않는다. 이 표에서만 동일한 오행 생/극
// 원리(받치는 기운 = 비겁+인성 vs 소모·압박 기운 = 식상+관성*1.2)를 로컬로
// 재계산하되, margin을 2→1로 좁혔다. 2026-07-20 실측(880202 11:10 /
// 871027 22:30)에서 support:drain이 5:3, 3:4로 실제로는 다른데 margin=2
// 에서는 둘 다 "중화"로 뭉쳤고, margin=1로는 강/약으로 갈라지는 걸 확인했다.

type StrengthBand = "strong" | "weak" | "balanced";

const STEM_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  gap: "wood",
  eul: "wood",
  byeong: "fire",
  jeong: "fire",
  mu: "earth",
  gi: "earth",
  gyeong: "metal",
  sin: "metal",
  im: "water",
  gye: "water",
};

const ELEMENT_GENERATES: Record<string, string> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

const ELEMENT_OVERCOMES: Record<string, string> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

function resolveFriendStrengthBand(chart: ChartContext): StrengthBand {
  const dayEl = STEM_ELEMENT[chart.dayStemCode] ?? "earth";
  const counts = countElements(chart);
  const resourceEl = Object.entries(ELEMENT_GENERATES).find(([, v]) => v === dayEl)?.[0];
  const outputEl = ELEMENT_GENERATES[dayEl];
  const controlEl = Object.entries(ELEMENT_OVERCOMES).find(([, v]) => v === dayEl)?.[0];

  const support = (counts[dayEl] ?? 0) + (counts[resourceEl ?? ""] ?? 0);
  const drain = (counts[outputEl ?? ""] ?? 0) + (counts[controlEl ?? ""] ?? 0) * 1.2;

  if (support >= drain + 1) return "strong";
  if (drain >= support + 1) return "weak";
  return "balanced";
}

const BATTERY_LABEL: Record<Locale, Record<StrengthBand, string>> = {
  "ko-KR": {
    strong: "본인 페이스가 강해서, 친구를 만나 에너지를 발산해야 풀리는 타입",
    weak: "외부 자극에 예민해서, 혼자만의 시간이 있어야 회복되는 타입",
    balanced: "그때그때 컨디션 따라 발산과 휴식을 오가는 타입",
  },
  "en-US": {
    strong: "Strong-willed energy — recharges by getting out and letting off steam with friends",
    weak: "Sensitive to outside stimulation — recharges with time alone",
    balanced: "Recharges differently depending on the day — sometimes out, sometimes alone",
  },
};

/** 신강×신약×중화 조합별 문구. 순서 무관 — [a,b].sort().join("|")로 조회. */
function battteryComboKey(a: StrengthBand, b: StrengthBand): string {
  return [a, b].sort().join("|");
}

const BATTERY_COMBO_MEANING: Record<Locale, Record<string, string>> = {
  "ko-KR": {
    "strong|strong":
      "둘 다 발산하며 풀어야 회복되는 타입이라 같이 있으면 에너지가 배가 돼요. 다만 둘 다 먼저 못 쉬는 편이라, 가끔은 의식적으로 늘어지는 시간도 필요해요.",
    "weak|weak":
      "둘 다 혼자만의 시간이 있어야 회복되는 타입이에요. 서로의 '연락 뜸함'을 무관심으로 오해하지 않는 게 이 우정의 핵심이에요.",
    "balanced|balanced":
      "둘 다 그날그날 컨디션에 따라 발산과 휴식을 오가는 타입이라, 그때그때 서로에게 맞춰주기 편해요.",
    "strong|weak":
      "한쪽은 만나서 발산해야 풀리고, 다른 쪽은 혼자 있어야 회복돼요. 힘든 시기에 조용해지는 쪽이 있어도 무관심이 아니라 회복 방식이 다른 것뿐이에요.",
    "balanced|strong":
      "한쪽은 확실한 발산형이고, 다른 쪽은 그날그날 다른 편이에요. 발산형이 리드하되, 상대가 혼자 있고 싶어 하는 날도 있다는 걸 감안해 주세요.",
    "balanced|weak":
      "한쪽은 혼자 있는 시간이 꼭 필요하고, 다른 쪽은 그날그날 다른 편이에요. 무리해서 매번 만나기보다 혼자 있는 쪽의 리듬을 존중해 주는 게 오래 가요.",
  },
  "en-US": {
    "strong|strong":
      "You're both the type to recharge by getting out and letting off steam, so energy doubles when you're together. Just build in downtime on purpose sometimes, since neither of you naturally slows down first.",
    "weak|weak":
      "You both recharge with alone time. The key to this friendship is not mistaking each other's quiet stretches for disinterest.",
    "balanced|balanced":
      "You both shift between recharging outward and alone depending on the day, so it's easy to match each other's mood in the moment.",
    "strong|weak":
      "One of you needs to get out and let off steam, the other needs alone time to recover. If one goes quiet during a hard stretch, it's a different recovery style, not disinterest.",
    "balanced|strong":
      "One of you is clearly the outward-recharging type, the other shifts day to day. Let the outward type lead, but remember the other sometimes just needs space.",
    "balanced|weak":
      "One of you really needs alone time, the other shifts day to day. Respecting the alone-time person's rhythm instead of pushing to meet every time keeps this going.",
  },
};

function resolveBatteryMeaning(locale: Locale, a: StrengthBand, b: StrengthBand): string {
  return BATTERY_COMBO_MEANING[locale][battteryComboKey(a, b)]!;
}

// ---- 행 5: 모임 준비 스타일 (재성+관성 합산, 0/1/2+) -------------------------
//
// 이전엔 행②(서운함 표출)와 같은 resolveDominantCategory(5개 중 최댓값)를
// 재사용해 두 행이 항상 같이 움직였다. profileTenGods().wealthOfficer(재성+
// 관성 합산)로 교체 — "최댓값 하나"가 아니라 "두 카테고리의 합"이라 ②와
// 수학적으로 다른 값이다.
// Phase 5-3: 이 행은 개인별 모임 준비·계획·물류 기질만 비교한다. Part3
// 총무(friendTreasurerScore → refineFriendTreasurer)와 산식·질문이 다르므로
// 카피에 "총무/treasurer"를 쓰지 않는다.

function resolveWealthOfficerBand(counts: TenGodCounts): ThreeBand {
  return resolveThreeBand(profileTenGods(counts).wealthOfficer);
}

const HANGOUT_LABEL: Record<Locale, Record<ThreeBand, string>> = {
  "ko-KR": {
    none: "\"아무거나 다 좋아\" 따라가는 편",
    some: "필요할 때는 계획도 짜는 균형형",
    strong: "약속·동선을 주도적으로 짜는 편",
  },
  "en-US": {
    none: "\"Anything's fine\" — happy to go along",
    some: "Plans when it matters, goes with the flow otherwise",
    strong: "Naturally takes charge of logistics",
  },
};

const HANGOUT_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "모임 준비 스타일이 비슷해서 약속 잡을 때 실랑이가 적어요.",
    diff: "모임 준비·계획 성향의 정도가 서로 달라요 — 준비를 더 즐기는 쪽에 자연스럽게 맡기되, 가끔은 반대쪽도 골라보면 좋아요.",
  },
  "en-US": {
    same: "Your planning style matches, so there's little back-and-forth when making plans.",
    diff: "You differ in how much you enjoy organizing plans — let the one who enjoys it more lead, but let the other pick sometimes too.",
  },
};

// ---- 행 6: 티키타카 대화 리듬 (식상 원점수, 0/1/2+) ---------------------------
//
// 공용 함수 resolveTikitaka(friendAnalysis.ts, Social DNA 카드와 공유)의
// "식상≥2" 컷오프는 그대로 두고, 이 표에서만 식상 원점수를 0/1/2+ 3단계로
// 세분화한다. 2026-07-20 실측에서 food 0과 1이 둘 다 옛 컷오프 미달로
// "silent"에 뭉쳤던 걸 확인했다.

function resolveFoodBand(counts: TenGodCounts): ThreeBand {
  return resolveThreeBand(profileTenGods(counts).food);
}

const RHYTHM_LABEL: Record<Locale, Record<ThreeBand, string>> = {
  "ko-KR": {
    none: "말 없이 있어도 편한 침묵 아지트파",
    some: "필요할 때 적당히 주고받는 잔잔한 대화파",
    strong: "밤새 털어대는 팝콘 토크파",
  },
  "en-US": {
    none: "Comfortable-silence home-base type",
    some: "Easygoing back-and-forth, chats when it counts",
    strong: "All-night popcorn-talk type",
  },
};

const RHYTHM_MEANING: Record<Locale, { same: string; diff: string }> = {
  "ko-KR": {
    same: "대화 리듬이 비슷해서 텐션이 잘 맞아요.",
    diff: "대화에서 원하는 텐션의 정도가 서로 달라요 — 매번 맞추려 하기보다, 오늘은 어느 쪽 모드인지 가볍게 물어봐 주세요.",
  },
  "en-US": {
    same: "Your conversation rhythm matches, so your energy levels sync up easily.",
    diff: "You want a different amount of back-and-forth energy — instead of forcing the same tempo every time, just ask which mode today calls for.",
  },
};

// ---- 빌더 ------------------------------------------------------------------

export function buildFriendSajuCompareTable(params: {
  nicknameA: string;
  nicknameB: string;
  tenGodsA: TenGodCounts;
  tenGodsB: TenGodCounts;
  dnaA: FriendDnaProfile;
  dnaB: FriendDnaProfile;
  chartA: ChartContext;
  chartB: ChartContext;
  locale?: Locale;
}): FriendCompareRow[] {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const { nicknameA, nicknameB, tenGodsA, tenGodsB, dnaA, dnaB, chartA, chartB } = params;

  const row = (
    id: FriendCompareRowId,
    label: string,
    shortLabelA: string,
    shortLabelB: string,
    meaning: string,
  ): FriendCompareRow => ({
    id,
    label,
    personA: { nickname: nicknameA, shortLabel: sanitizeFriendText(shortLabelA) },
    personB: { nickname: nicknameB, shortLabel: sanitizeFriendText(shortLabelB) },
    meaning: sanitizeFriendText(meaning),
  });

  const categoryA = resolveDominantCategory(tenGodsA);
  const categoryB = resolveDominantCategory(tenGodsB);

  const rhythmBandA = resolveRhythmBand(chartA.dayStemCode);
  const rhythmBandB = resolveRhythmBand(chartB.dayStemCode);

  const strengthBandA = resolveFriendStrengthBand(chartA);
  const strengthBandB = resolveFriendStrengthBand(chartB);

  const wealthOfficerBandA = resolveWealthOfficerBand(tenGodsA);
  const wealthOfficerBandB = resolveWealthOfficerBand(tenGodsB);

  const foodBandA = resolveFoodBand(tenGodsA);
  const foodBandB = resolveFoodBand(tenGodsB);

  return [
    row(
      "daily_share_tempo",
      pick(locale, "Daily Sharing & Contact Tempo", "일상 공유 & 연락 템포"),
      DAILY_SHARE_LABEL[locale][rhythmBandA],
      DAILY_SHARE_LABEL[locale][rhythmBandB],
      rhythmBandA === rhythmBandB
        ? DAILY_SHARE_MEANING[locale].same
        : DAILY_SHARE_MEANING[locale].diff,
    ),
    row(
      "upset_expression",
      pick(locale, "How You Show You're Hurt", "서운함 표출 방식"),
      UPSET_EXPRESSION_LABEL[locale][categoryA],
      UPSET_EXPRESSION_LABEL[locale][categoryB],
      categoryA === categoryB
        ? UPSET_EXPRESSION_MEANING[locale].same
        : UPSET_EXPRESSION_MEANING[locale].diff,
    ),
    row(
      "affection_language",
      pick(locale, "How You Show Loyalty", "우정 표현 & 의리 스타일"),
      AFFECTION_LABEL[locale][dnaA.dominantElement],
      AFFECTION_LABEL[locale][dnaB.dominantElement],
      dnaA.dominantElement === dnaB.dominantElement
        ? AFFECTION_MEANING[locale].same
        : AFFECTION_MEANING[locale].diff,
    ),
    row(
      "battery_recharge",
      pick(locale, "How You Recharge", "우정 배터리 충전"),
      BATTERY_LABEL[locale][strengthBandA],
      BATTERY_LABEL[locale][strengthBandB],
      resolveBatteryMeaning(locale, strengthBandA, strengthBandB),
    ),
    row(
      "hangout_planning",
      pick(locale, "Planning Style", "모임 준비 스타일"),
      HANGOUT_LABEL[locale][wealthOfficerBandA],
      HANGOUT_LABEL[locale][wealthOfficerBandB],
      wealthOfficerBandA === wealthOfficerBandB
        ? HANGOUT_MEANING[locale].same
        : HANGOUT_MEANING[locale].diff,
    ),
    row(
      "communication_rhythm",
      pick(locale, "Back-and-Forth Conversation Style", "티키타카 대화 리듬"),
      RHYTHM_LABEL[locale][foodBandA],
      RHYTHM_LABEL[locale][foodBandB],
      foodBandA === foodBandB ? RHYTHM_MEANING[locale].same : RHYTHM_MEANING[locale].diff,
    ),
  ];
}
