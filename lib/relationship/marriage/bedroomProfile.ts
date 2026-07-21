import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { ChartContext } from "@/lib/saju/chartContext";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import { estimateStrengthBalance } from "@/lib/saju/romanticSajuDerivations";
import {
  calculateTwelveStage,
  getHiddenStemsData,
} from "@/lib/saju/repository";
import type { MarriageDayBranchAnalysis } from "@/lib/saju/marriageAnalysis";
import type { TenGodCounts } from "./marriageTenGodAnalysis";
import { hasGuimunOnDayHourPalaces } from "@/lib/saju/workPairRiskSignals";
import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import { LEGACY_FALLBACK_LOCALE, pick } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";

export type StaminaArchetype = "marathon" | "sprint";
export type FantasyArchetype = "fantasy_breaker" | "romantic_classic";
export type MannerArchetype = "sweet_guide" | "power_leader";

export type BedroomArchetypes = {
  stamina: StaminaArchetype;
  fantasy: FantasyArchetype;
  manner: MannerArchetype;
};

export type BedroomPersonProfile = {
  nickname: string;
  stamina: string;
  fantasy: string;
  manner: string;
  archetypes: BedroomArchetypes;
};

export type BedroomMatrixSection = {
  sexual_chemistry_summary: string;
  person_a: BedroomPersonProfile;
  person_b: BedroomPersonProfile;
  frequency_one_liner: string;
};

const NAKED_FIRE_BRANCHES = new Set(["ja", "o", "myo", "yu"]);

const STRONG_DAY_STAGES = new Set([
  "jangsaeng",
  "geollok",
  "jewang",
  "gwandae",
]);

const STAMINA_COPY: Record<Locale, Record<StaminaArchetype, string>> = {
  "en-US": {
    marathon: sanitizeHomeLifeText(
      "[🔥 Tireless Energizer, Marathon Type] — Blessed with natural stamina and endurance strong enough to keep the rhythm going all night without tiring.",
    ),
    sprint: sanitizeHomeLifeText(
      "[⚡ Short, Intense Sprint Director Type] — Instead of endurance, focuses on momentary immersion, flashy technique, and mental spark.",
    ),
  },
  "ko-KR": {
    marathon: sanitizeHomeLifeText(
      "[🔥 지치지 않는 에너자이저 마라톤형] — 타고난 기력과 지구력이 굳건하여 밤새 리듬이 지치지 않는 강인한 체력의 소유자입니다.",
    ),
    sprint: sanitizeHomeLifeText(
      "[⚡ 짧고 굵게 타오르는 단거리 연출가형] — 지구력보다는 순간적인 몰입도와 화려한 테크닉, 정신적 스파크에 집중하는 스타일입니다.",
    ),
  },
};

const FANTASY_COPY: Record<Locale, Record<FantasyArchetype, string>> = {
  "en-US": {
    fantasy_breaker: sanitizeHomeLifeText(
      "[🧬 Boundary-Breaking Fantasy Type] — Dislikes repetitive boredom, and comes alive when pursuing something different, daring, or a secret fantasy.",
    ),
    romantic_classic: sanitizeHomeLifeText(
      "[🕯️ Stability-Seeking Romantic Classic Type] — Prioritizes mutual trust, a traditional mood, and the security of a cozy environment above all.",
    ),
  },
  "ko-KR": {
    fantasy_breaker: sanitizeHomeLifeText(
      "[🧬 틀을 깨는 과감한 판타지파] — 반복되는 지루함을 싫어하며, 색다르고 과감한 시도나 은밀한 판타지를 추구할 때 에너지가 깨어나는 타입입니다.",
    ),
    romantic_classic: sanitizeHomeLifeText(
      "[🕯️ 안정감을 추구하는 로맨틱 클래식파] — 서로에 대한 신뢰와 정석적인 무드, 아늑한 환경에서 오는 안정감을 최우선으로 하는 타입입니다.",
    ),
  },
};

const MANNER_COPY: Record<Locale, Record<MannerArchetype, string>> = {
  "en-US": {
    sweet_guide: sanitizeHomeLifeText(
      "[🎁 Sweet Guide Who Satisfies the Partner First] — Feels greater thrill from taking care of the partner's climax, happiness, and emotional satisfaction over their own pleasure.",
    ),
    power_leader: sanitizeHomeLifeText(
      "[👑 Unstoppable Powerful Leader] — Holds bedroom leadership firmly, leading the partner straight-on and taking charge.",
    ),
  },
  "ko-KR": {
    sweet_guide: sanitizeHomeLifeText(
      "[🎁 상대를 먼저 만족시키는 스위트 가이드] — 내 쾌감보다 상대방의 절정과 행복, 정서적 만족을 챙겨줄 때 더 큰 희열을 느끼는 성향입니다.",
    ),
    power_leader: sanitizeHomeLifeText(
      "[👑 거침없이 이끄는 파워풀 리더] — 침실 주도권을 강하게 쥐고 직진형으로 상대를 리드하며 쟁취하는 타입입니다.",
    ),
  },
};

function hasNakedFireOnDayHour(chart: ChartContext): boolean {
  return [chart.dayBranchCode, chart.hourBranchCode].some((br) =>
    NAKED_FIRE_BRANCHES.has(br),
  );
}

function hasDayStemRootInDayBranch(chart: ChartContext): boolean {
  const hidden = getHiddenStemsData(chart.dayBranchCode);
  if (hidden.some((h) => h.stem_code === chart.dayStemCode)) return true;
  const stage = calculateTwelveStage(chart.dayStemCode, chart.dayBranchCode);
  return STRONG_DAY_STAGES.has(stage);
}

function resolveStaminaArchetype(
  sajuJson: SajuDataForIntegrated,
  chart: ChartContext,
): StaminaArchetype {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const strength = estimateStrengthBalance(pillars);
  const rooted = hasDayStemRootInDayBranch(chart);

  if (strength.label.includes("신약") && !rooted) {
    return "sprint";
  }
  if (strength.label.includes("신강") || rooted) {
    return "marathon";
  }
  return rooted ? "marathon" : "sprint";
}

function resolveFantasyArchetype(
  counts: TenGodCounts,
  chart: ChartContext,
): FantasyArchetype {
  const sanggwan = counts["상관"] ?? 0;
  const guimun = hasGuimunOnDayHourPalaces(chart);
  const nakedFire = hasNakedFireOnDayHour(chart);

  const isFantasyBreaker =
    sanggwan >= 2 ||
    (sanggwan >= 1 && (guimun || nakedFire)) ||
    guimun ||
    nakedFire;

  if (isFantasyBreaker) return "fantasy_breaker";

  const jungwan = counts["정관"] ?? 0;
  const jungin = counts["정인"] ?? 0;
  const classicStrong =
    jungwan >= 2 ||
    jungin >= 2 ||
    (jungwan >= 1 && jungin >= 1);

  if (classicStrong) return "romantic_classic";

  const boldScore = sanggwan * 2 + (guimun ? 2 : 0) + (nakedFire ? 1 : 0);
  const classicScore = jungwan * 2 + jungin * 2;
  return boldScore > classicScore ? "fantasy_breaker" : "romantic_classic";
}

// 침실 리드 스타일 판정에 쓰는 십신 배정. 비교 대상 십신 개수(일주 제외
// 년/월/시 3개 기둥)가 항상 정확히 3개로 고정돼 있어서, 두 그룹에 배정되는
// "개별 십신 종류 수"가 그대로 기저 확률이 된다 — 6:4로 배정하면 곧바로
// 60:40 근처로 쏠린다(검증: 합성 스윕 N=500에서 sweet_guide 56→63%로 확인).
// 그래서 5:5로 맞춘다. 정관(원칙적·온건한 권위)은 기존 코드가 sweet 쪽에
// 두던 것을 유지하고, 편관(강압적·전투적 권위=칠살)만 새로 power 쪽에
// 배정한다 — 기존 코드에서 편관은 아예 어느 쪽도 아니었다.
const POWER_LEADER_GODS = ["비견", "겁재", "정재", "편재", "편관"];
const SWEET_GUIDE_GODS = ["식신", "상관", "정인", "편인", "정관"];

export function resolveMannerArchetype(counts: TenGodCounts): MannerArchetype {
  const powerScore = POWER_LEADER_GODS.reduce(
    (s, g) => s + (counts[g] ?? 0),
    0,
  );
  const sweetScore = SWEET_GUIDE_GODS.reduce(
    (s, g) => s + (counts[g] ?? 0),
    0,
  );

  return sweetScore >= powerScore ? "sweet_guide" : "power_leader";
}

function buildPersonArchetypes(
  sajuJson: SajuDataForIntegrated,
  counts: TenGodCounts,
  chart: ChartContext,
): BedroomArchetypes {
  return {
    stamina: resolveStaminaArchetype(sajuJson, chart),
    fantasy: resolveFantasyArchetype(counts, chart),
    manner: resolveMannerArchetype(counts),
  };
}

function buildFrequencyOneLiner(
  nicknameA: string,
  nicknameB: string,
  archA: BedroomArchetypes,
  archB: BedroomArchetypes,
  day: MarriageDayBranchAnalysis,
  locale: Locale,
): string {
  if (archA.stamina !== archB.stamina) {
    const marathonNick =
      archA.stamina === "marathon" ? nicknameA : nicknameB;
    const sprintNick = archA.stamina === "sprint" ? nicknameA : nicknameB;
    return sanitizeHomeLifeText(
      pick(
        locale,
        `${marathonNick} is the marathon type who carries the rhythm all the way through, while ${sprintNick} is the sprint type who burns bright in one intense burst. ` +
          `If the marathon type doesn't say "short tonight, long tomorrow" first, the sprint type burns out — and if the sprint type rushes, the marathon type gets bored. ` +
          `Decide the pace and length out loud every time — silence is the most dangerous part.`,
        `${marathonNick}는 끝까지 리듬을 끌고 가는 마라톤형, ${sprintNick}는 한 번에 몰입해 불태우는 단거리형입니다. ` +
          `마라톤형이 '오늘은 짧게, 내일은 길게'를 먼저 말하지 않으면 단거리형은 탈진하고, 단거리형이 서두르면 마라톤형은 지루함을 느낍니다. ` +
          `속도와 길이는 매번 입 밖으로 정하세요 — 침묵이 가장 위험합니다.`,
      ),
    );
  }

  if (archA.fantasy !== archB.fantasy) {
    const boldNick =
      archA.fantasy === "fantasy_breaker" ? nicknameA : nicknameB;
    const classicNick =
      archA.fantasy === "romantic_classic" ? nicknameA : nicknameB;
    return sanitizeHomeLifeText(
      pick(
        locale,
        `${boldNick} wants fantasy and experimentation, while ${classicNick} wants a familiar mood and stability. ` +
          `Pushing novelty makes the classic type anxious, and insisting on tradition only bores the fantasy type fast. ` +
          `Unless you pin down intensity, novelty, and off-limits topics in a weekly "bedroom meeting," the temperature gap widens every night.`,
        `${boldNick}는 판타지와 실험을 원하고, ${classicNick}는 익숙한 무드와 안정을 원합니다. ` +
          `새로움을 밀어붙이면 클래식파는 불안해지고, 정석만 고집하면 판타지파는 금방 싫증을 냅니다. ` +
          `수위·새로움·금기선을 주 1회 '침실 회의'로 박아 두지 않으면 밤마다 온도차가 벌어집니다.`,
      ),
    );
  }

  if (archA.manner !== archB.manner) {
    const sweetNick =
      archA.manner === "sweet_guide" ? nicknameA : nicknameB;
    const powerNick =
      archA.manner === "power_leader" ? nicknameA : nicknameB;
    return sanitizeHomeLifeText(
      pick(
        locale,
        `${powerNick} leads straight-on, while ${sweetNick} reads the partner's reaction first. ` +
          `If the leader only pushes for speed, the guide starts feeling like "am I just a tool?" — and if only the guide accommodates, the leader gets frustrated. ` +
          `Deciding who leads and who checks in tonight takes just 10 seconds before things start.`,
        `${powerNick}는 직진형 리드, ${sweetNick}는 상대 반응을 먼저 읽는 배려형입니다. ` +
          `리더가 속도만 밀면 가이드는 '나는 도구인가?' 싶어지고, 가이드만 맞추면 리더는 답답해집니다. ` +
          `오늘은 누가 리드하고 누가 체크인할지 — 밤 시작 전 10초면 충분합니다.`,
      ),
    );
  }

  if (
    archA.stamina === "marathon" &&
    archA.fantasy === "fantasy_breaker" &&
    archA.manner === "power_leader"
  ) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `You both overlap as marathon, fantasy, and lead type. The spark is strong, but the tendency toward a power struggle and pushing until exhausted is risky. ` +
          `Set alternating lead days, and agree in advance on a "that's enough for tonight" signal.`,
        `둘 다 마라톤·판타지·리드형으로 겹칩니다. 불꽃은 강하지만 주도권 싸움과 지칠 때까지 밀어붙이는 경향이 위험합니다. ` +
          `번갈아 리드하는 날을 정하고, '오늘은 여기까지' 신호를 미리 약속하세요.`,
      ),
    );
  }

  if (
    archA.stamina === "sprint" &&
    archA.fantasy === "romantic_classic" &&
    archA.manner === "sweet_guide"
  ) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `You both align as sprint, classic, and considerate type. The connection runs deep fast, but boredom can creep in from a repeating routine. ` +
          `Adding just one small variation a month (place, music, timing) is enough to reignite the spark.`,
        `둘 다 단거리·클래식·배려형으로 맞습니다. 깊은 연결은 빠르지만, 반복 루틴에 지루함이 오기 쉽습니다. ` +
          `월 1회 작은 변주(장소·음악·시간)만 넣어도 불씨가 다시 살아납니다.`,
      ),
    );
  }

  if (day.hasDayBranchChungHyung) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        "You're the same type on the surface, but a combination whose body/emotion rhythms can easily fall out of sync. Lower expectations on tired days, and unless you align 'tonight's intensity' first, you'll both end up disappointed.",
        "겉으로는 같은 유형이지만 신체·감정 리듬이 어긋나기 쉬운 조합입니다. 피곤한 날 기대치를 낮추고, '오늘의 수위'를 먼저 맞추지 않으면 둘 다 서운해집니다.",
      ),
    );
  }

  if (day.bedFitLevel === "excellent") {
    return sanitizeHomeLifeText(
      pick(
        locale,
        "Your stamina, fantasy, and manner types are all aligned in the same direction. But the most common mistake is 'we're so compatible we don't need to talk about it' — open an honest feedback night once a month.",
        "스태미나·판타지·매너 유형이 같은 방향으로 정렬되어 있습니다. 다만 '잘 맞으니까 말 안 해도 되겠지'가 가장 흔한 실수 — 한 달에 한 번은 솔직한 피드백 밤을 여세요.",
      ),
    );
  }

  return sanitizeHomeLifeText(
    pick(
      locale,
      "You mesh as the same type, but when fatigue and stress build up, you both get sensitive. Unless you talk through tonight's tempo, intensity, and lead, you may each be dreaming of a different kind of night.",
      "같은 유형끼리 맞물리지만, 피로·스트레스가 쌓이면 둘 다 예민해집니다. 밤의 템포·수위·주도권을 말로 확인하지 않으면 각자 다른 밤을 꿈꾸고 있을 수 있습니다.",
    ),
  );
}

function buildSexualChemistrySummary(
  nicknameA: string,
  nicknameB: string,
  archA: BedroomArchetypes,
  archB: BedroomArchetypes,
  day: MarriageDayBranchAnalysis,
  locale: Locale,
): string {
  const clashCount =
    (archA.stamina !== archB.stamina ? 1 : 0) +
    (archA.fantasy !== archB.fantasy ? 1 : 0) +
    (archA.manner !== archB.manner ? 1 : 0);

  if (clashCount >= 2) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `${nicknameA} and ${nicknameB} — your bedroom DNA diverges on two or more axes. The attraction is there, but without coordination, a temperature gap shows up every night. Without conversation and rules, you'll both feel "why am I the only one adjusting?"`,
        `${nicknameA}와 ${nicknameB} — 침실 DNA가 두 축 이상 엇갈립니다. 끌림은 있어도 조율 없이는 밤마다 온도차가 납니다. 대화와 룰이 없으면 둘 다 '왜 나만 맞춰?'라고 느낍니다.`,
      ),
    );
  }

  if (day.bedFitLevel === "excellent" && clashCount === 0) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `${nicknameA} and ${nicknameB} — your physical rhythm and bedroom DNA point the same direction. A combination where attraction and pace tend to align naturally.`,
        `${nicknameA}와 ${nicknameB} — 신체 리듬과 침실 DNA가 한 방향을 가리킵니다. 끌림과 속도가 자연스럽게 맞기 쉬운 조합이에요.`,
      ),
    );
  }

  if (day.hasDayBranchChungHyung) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        "There are signs of a body/emotion rhythm mismatch. Without conversation to align pace, touch, and mood, nights can turn awkward or repeat a pattern where only one side is satisfied.",
        "신체·감정 리듬 불일치 신호가 있습니다. 속도·촉감·분위기를 맞추는 대화 없이는 밤이 어색해지거나 한쪽만 만족하는 패턴이 반복됩니다.",
      ),
    );
  }

  if (clashCount === 1) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        "Only one axis differs. The parts that align create synergy, but if friction repeats on the other axis, it can cool the whole bedroom down.",
        "한 축만 다른 조합입니다. 맞는 부분은 시너지가 나지만, 다른 축에서 반복 마찰이 쌓이면 침실 전체가 식습니다.",
      ),
    );
  }

  return sanitizeHomeLifeText(
    pick(
      locale,
      "Your bedroom DNA is on the same side. But settling into routine can weaken the spark — the more honest feedback builds up, the deeper it gets.",
      "침실 DNA는 같은 편입니다. 다만 루틴에 안주하면 불씨가 약해질 수 있어 — 솔직한 피드백이 쌓일수록 깊어집니다.",
    ),
  );
}

export function buildBedroomMatrixSection(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  chartA: ChartContext;
  chartB: ChartContext;
  dayBranch: MarriageDayBranchAnalysis;
  locale?: Locale;
}): BedroomMatrixSection {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const archA = buildPersonArchetypes(
    params.sajuJsonA,
    params.countsA,
    params.chartA,
  );
  const archB = buildPersonArchetypes(
    params.sajuJsonB,
    params.countsB,
    params.chartB,
  );

  const profileA = {
    stamina: STAMINA_COPY[locale][archA.stamina],
    fantasy: FANTASY_COPY[locale][archA.fantasy],
    manner: MANNER_COPY[locale][archA.manner],
  };
  const profileB = {
    stamina: STAMINA_COPY[locale][archB.stamina],
    fantasy: FANTASY_COPY[locale][archB.fantasy],
    manner: MANNER_COPY[locale][archB.manner],
  };

  return {
    sexual_chemistry_summary: buildSexualChemistrySummary(
      params.nicknameA,
      params.nicknameB,
      archA,
      archB,
      params.dayBranch,
      locale,
    ),
    person_a: { nickname: params.nicknameA, ...profileA, archetypes: archA },
    person_b: { nickname: params.nicknameB, ...profileB, archetypes: archB },
    frequency_one_liner: buildFrequencyOneLiner(
      params.nicknameA,
      params.nicknameB,
      archA,
      archB,
      params.dayBranch,
      locale,
    ),
  };
}
