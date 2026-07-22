import { REF_EARTHLY_BRANCHES, REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { chartEnergyProfile } from "@/lib/saju/marriageAnalysis";
import { buildChartContext, type ChartContext } from "@/lib/saju/chartContext";
import { sajuJsonToPillars, countElements } from "@/lib/saju/pairChartAnalysis";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./marriageCopy";
import type { TenGodCounts } from "./marriageTenGodAnalysis";
import { profileTenGods } from "./marriageTenGodAnalysis";
import type { FamilyBoundaryProfile } from "./marriageTenGodAnalysis";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

const SAJU_JARGON_RE =
  /일간|일지|월간|월지|년주|월주|연주|시주|일궁|지지|천간|지장간|암합|천간합|십신|십성|오행|상생|상극|육합|삼합|방합|원진|귀문|공망|형벌|순환형|신강|신약|용신|기신|정재|편재|정관|편관|식신|상관|정인|편인|비견|겁재|효신|조후|역마|사주|만세력|배우자궁|재성|관성|목\(木\)|화\(火\)|토\(土\)|금\(金\)|수\(水\)|[一-鿿]{1,2}합|[一-鿿]충|[一-鿿]형|[一-鿿]파|[一-鿿]해|\([가-힣]{2}\)/g;

const STEM_LIFE_VALUES: Record<Locale, Record<string, string>> = {
  "en-US": {
    gap: "Pursues growth and freedom at once, and wants each other's dreams respected even inside the relationship.",
    eul: "Puts harmony and flexibility first — a peacemaker who resolves things through conversation rather than conflict.",
    byeong: "Wants a passionate, fast-paced life, and dreams of an energetic everyday together with a partner.",
    jeong: "Warm bonding and thoughtful care are the center of life — craving a relationship of loving and being loved.",
    mu: "Stability, trust, and responsibility come first — wants to build an unshakeable home and relationship.",
    gi: "Proves love through practical results and visible outcomes, and values running a household realistically.",
    gyeong: "Values principle, fairness, and efficiency, and wants clear standards and promises in the relationship too.",
    sin: "Pursues polish and quality, and feels at ease when daily life runs in an organized routine.",
    im: "A type who adapts the relationship to the situation, with deep understanding and flexible adaptability.",
    gye: "Values careful choices and deep reflection, needing conviction over hasty decisions.",
  },
  "ko-KR": {
    gap: "성장과 자유를 동시에 추구하며, 관계 안에서도 각자의 꿈을 존중받기를 원해요.",
    eul: "조화와 유연함을 최우선으로, 갈등보다 대화로 풀어가는 평화주의자예요.",
    byeong: "열정과 속도감 있는 삶을 원하며, 파트너와 함께 에너지 넘치는 일상을 꿈꿔요.",
    jeong: "따뜻한 유대와 섬세한 배려가 삶의 중심 — 사랑받고 사랑하는 관계를 갈망해요.",
    mu: "안정·신뢰·책임이 최우선 가치 — 흔들리지 않는 집과 관계를 만들고 싶어 해요.",
    gi: "실질적 성과와 보이는 결과로 사랑을 증명하며, 현실적인 가정 운영을 중시해요.",
    gyeong: "원칙·공정·효율을 중시하고, 관계에서도 명확한 기준과 약속을 원해요.",
    sin: "완성도와 품질을 추구하며, 집안 일상도 정돈된 루틴 속에서 편안함을 느껴요.",
    im: "깊은 이해와 유연한 적응력으로, 상황에 맞게 관계를 다듬어 가는 타입이에요.",
    gye: "신중한 선택과 깊은 성찰을 중시하며, 섣부른 결정보다 확신이 필요해요.",
  },
};

const BRANCH_PRIVATE_LIFE: Record<Locale, Record<string, string>> = {
  "en-US": {
    ja: "Behind closed doors their activity level rises, pouring energy into a solo project or hobby.",
    chuk: "They look unbothered on the surface but run deep inside, quietly enduring and tidying things up at home.",
    in: "They look for novelty even in private, and occasionally need a solo adventure.",
    myo: "At home they read the mood sensitively, drawn in by small details.",
    jin: "They tend to want to restructure roles at home, and move proactively when change comes.",
    sa: "Energy can explode or rush after getting home from work, so they need to pace themselves.",
    o: "At home they express emotion actively, confirming connection through conversation and touch.",
    mi: "Behind closed doors they go quiet on the defensive, and need their own cave time.",
    sin: "Their standards run high even in private space, and it stresses them out when tidiness or routine slips.",
    sul: "Home is their territory — if they feel it's being invaded, they draw a firm line.",
    hae: "Deep emotion builds up at home, and they need time to walk alone or quietly sort things out.",
  },
  "ko-KR": {
    ja: "문 닫으면 활동량이 올라가고, 혼자만의 프로젝트나 취미로 에너지를 쏟아요.",
    chuk: "겉은 무덤덤해도 속은 깊고, 집 안에서는 말없이 버티며 정리하는 편이에요.",
    in: "사적인 공간에서도 새로움을 찾으며, 가끔 혼자만의 모험이 필요해요.",
    myo: "집에서는 예민하게 분위기를 읽고, 작은 디테일에 마음이 쏠려요.",
    jin: "가정 내 구조·역할을 재정비하려 하며, 변화가 올 때 주도적으로 움직여요.",
    sa: "퇴근 후 에너지가 폭발하거나 급해지기 쉬워, 속도 조절이 필요해요.",
    o: "집 안에서 감정 표현이 활발하고, 대화와 스킨십으로 연결을 확인해요.",
    mi: "문 닫으면 방어적으로 조용해지며, 혼자만의 동굴 시간이 필수예요.",
    sin: "사적 공간에서도 기준이 높아, 정리·청결·루틴이 어긋나면 스트레스를 받아요.",
    sul: "집은 내 영역 — 침범당한다고 느끼면 단호하게 선을 그어요.",
    hae: "깊은 감정이 집 안에 쌓이며, 혼자 산책하거나 조용히 정리할 시간이 필요해요.",
  },
};

const CATEGORY_FAMILY_IDENTITY: Record<Locale, Record<string, string>> = {
  "en-US": {
    wealth: "Household & resource-centered — believes money and resource management are the backbone of the home.",
    officer: "Responsibility & order-centered — feels at ease when the household has leadership and rules.",
    food: "Expression & creativity-centered — believes household mood and conversation set the home's temperature.",
    seal: "Care & learning-centered — care and support for growth are the household's core value.",
    self: "Partnership & independence-centered — wants a partnership that protects each other's pride and space.",
    balanced: "A balanced family DNA — a collaborative type that shares chores, finances, and emotion evenly.",
  },
  "ko-KR": {
    wealth: "가계·실속 중심 — 돈과 자원 관리가 가정의 뼈대라고 믿어요.",
    officer: "책임·질서 중심 — 가정 운영에 리더십과 규칙이 있어야 편해요.",
    food: "표현·창의 중심 — 집안 분위기와 대화가 가정의 온도를 만든다고 봐요.",
    seal: "돌봄·학습 중심 — 배려와 성장 지원이 가정의 핵심 가치예요.",
    self: "동반·독립 중심 — 서로의 자존심과 공간을 지키는 동반자 관계를 원해요.",
    balanced: "균형 잡힌 패밀리 DNA — 가사·재정·감정을 고르게 나누는 협력형이에요.",
  },
};

const LIFESTYLE_TITLES: Record<string, string[]> = {
  wealth: ["Practical Nest Builder", "Home CFO Energy", "Steady Hearth Keeper"],
  officer: ["Structured Home Captain", "Calm Household Anchor", "Rule-of-Love Leader"],
  food: ["Creative Hearth Artist", "Warm Conversation Curator", "Joy-First Partner"],
  seal: ["Nurturing Sanctuary Guide", "Gentle Home Therapist", "Quiet Support Pillar"],
  self: ["Independent Duo Spirit", "Pride & Partnership Type", "Loyal Co-Captain"],
  balanced: ["Balanced Life Partner", "Harmony-First Homemaker", "Flexible Family Weaver"],
};

export function sanitizeHomeLifeText(text: string): string {
  return text
    .replace(SAJU_JARGON_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\(\s*\)/g, "")
    .trim();
}

function dominantFamilyCategory(counts: TenGodCounts): string {
  const p = profileTenGods(counts);
  const ranked = [
    { key: "wealth", score: p.wealthOfficer },
    { key: "food", score: p.food },
    { key: "seal", score: p.seal },
    { key: "self", score: p.self },
  ].sort((a, b) => b.score - a.score);
  const top = ranked[0]!;
  if (top.score <= 1) return "balanced";
  if (top.key === "wealth" && p.officer >= 2) return "officer";
  return top.key;
}

function lifestyleTitle(category: string, nickname: string): string {
  const pool = LIFESTYLE_TITLES[category] ?? LIFESTYLE_TITLES.balanced!;
  const pick = pool[Math.abs(nickname.length + category.length) % pool.length]!;
  return pick;
}

export type HomeLifeDnaProfile = {
  nickname: string;
  lifestyle_title: string;
  life_values: string;
  private_home_self: string;
  energy_battery: string;
  family_identity: string;
  /** psych(설문) 필요 — buildMarriageReport.ts에서 나중에 patch(section_money_chores와 동일 패턴) */
  energy_axis_note?: string | null;
};

export function buildHomeLifeDnaProfile(
  nickname: string,
  sajuJson: SajuDataForIntegrated,
  tenGodCounts: TenGodCounts,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): HomeLifeDnaProfile {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const energy = chartEnergyProfile(chart);
  const category = dominantFamilyCategory(tenGodCounts);
  const stemRef = REF_HEAVENLY_STEMS.find((r) => r.code === chart.dayStemCode);
  const branchRef = REF_EARTHLY_BRANCHES.find(
    (r) => r.code === chart.dayBranchCode,
  );

  const lifeValues =
    STEM_LIFE_VALUES[locale][chart.dayStemCode] ??
    pick(
      locale,
      `${stemRef?.kor_name ?? "my"} temperament — wants both respect and direction in the relationship.`,
      `${stemRef?.kor_name ?? "나"} 기질 — 관계에서 존중과 방향성을 동시에 원해요.`,
    );

  const privateHome =
    BRANCH_PRIVATE_LIFE[locale][chart.dayBranchCode] ??
    pick(
      locale,
      `${branchRef?.kor_name ?? "my"} rhythm — has a pattern that only shows behind closed doors.`,
      `${branchRef?.kor_name ?? "내"} 리듬 — 문 닫은 집 안에서만 드러나는 나만의 패턴이 있어요.`,
    );

  let energyBattery: string;
  if (energy.isHomebody && !energy.isOutdoorsy) {
    energyBattery = pick(
      locale,
      "Homebody type — recharges indoors. The couch, the bedroom, and a quiet routine fill the battery.",
      "집돌이형 — 집 안에서 충전해요. 소파·침실·조용한 루틴이 배터리를 채웁니다.",
    );
  } else if (energy.isOutdoorsy && !energy.isHomebody) {
    energyBattery = pick(
      locale,
      "Outdoorsy type — a walk, a cafe, going out is the battery. Tends to reset outside on weekends.",
      "밖순이형 — 산책·카페·외출이 배터리예요. 주말에 밖에서 리셋하는 편이에요.",
    );
  } else {
    energyBattery = pick(
      locale,
      "Hybrid type — recharges at home and resets outside too. Flexible depending on the situation.",
      "하이브리드형 — 집에서도 충전하고 밖에서도 리셋해요. 상황에 따라 유연하게.",
    );
  }

  const familyIdentity =
    CATEGORY_FAMILY_IDENTITY[locale][category] ?? CATEGORY_FAMILY_IDENTITY[locale].balanced!;

  return {
    nickname,
    lifestyle_title: lifestyleTitle(category, nickname),
    life_values: sanitizeHomeLifeText(lifeValues),
    private_home_self: sanitizeHomeLifeText(privateHome),
    energy_battery: sanitizeHomeLifeText(energyBattery),
    family_identity: sanitizeHomeLifeText(familyIdentity),
  };
}

const AXIS_NOTE_ENERGY_HIGH = 60;
const AXIS_NOTE_ENERGY_LOW = 40;

/**
 * Part2② 배터리 스위치 — 11축[외향에너지] 확인문구. `chartEnergyProfile`의
 * 밖순이/집돌이 판정(`energy_battery` 문구)은 완전히 안 건드리고, psych
 * 점수가 그 판정을 뒷받침하는지 확인/유보 문구만 별도로 얹는다(Batch 2·3과
 * 동일한 non-invasive 원칙). 하이브리드(챠트 판정이 뚜렷하지 않음)는 대상 아님.
 */
export function resolveEnergyStyleAxisNote(
  chart: ChartContext,
  psych: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  const score = psych?.secondary_axes?.energy_style;
  if (typeof score !== "number") return null;

  const energy = chartEnergyProfile(chart);

  if (energy.isOutdoorsy && !energy.isHomebody) {
    if (score >= AXIS_NOTE_ENERGY_HIGH) {
      return pick(
        locale,
        "The 11-axis survey backs this up too — the outgoing-energy score runs high, so the 'recharge outside' type fits the psychological data as well.",
        "11축 설문에서도 확인돼요 — 외향에너지 점수가 높게 나와서, '밖에서 충전하는 타입'이 심리 데이터로도 뒷받침돼요.",
      );
    }
    if (score <= AXIS_NOTE_ENERGY_LOW) {
      return pick(
        locale,
        "Survey scores actually lean the other way — the outgoing-energy score runs low, so this person may recharge at home more than the chart suggests.",
        "설문 점수는 오히려 반대로 나와요 — 외향에너지 점수가 낮게 나와서, 실제로는 집에서도 충전이 잘 되는 편일 수 있어요.",
      );
    }
    return null;
  }

  if (energy.isHomebody && !energy.isOutdoorsy) {
    if (score <= AXIS_NOTE_ENERGY_LOW) {
      return pick(
        locale,
        "The 11-axis survey backs this up too — the outgoing-energy score runs low, so the 'recharge at home' type fits the psychological data as well.",
        "11축 설문에서도 확인돼요 — 외향에너지 점수가 낮게 나와서, '집에서 충전하는 타입'이 심리 데이터로도 뒷받침돼요.",
      );
    }
    if (score >= AXIS_NOTE_ENERGY_HIGH) {
      return pick(
        locale,
        "Survey scores actually lean the other way — the outgoing-energy score runs high, so this person may need more outside time than the chart suggests.",
        "설문 점수는 오히려 반대로 나와요 — 외향에너지 점수가 높게 나와서, 실제로는 밖에서 에너지를 얻는 면도 있을 수 있어요.",
      );
    }
    return null;
  }

  return null;
}

const ATTACHMENT_LABELS: Record<Locale, Record<string, string>> = {
  "en-US": {
    secure:
      "Secure — doesn't feel suffocated getting close, and doesn't feel anxious keeping distance either. But repeating just 'I'm fine' can read to the other as neglect.",
    anxious:
      "Anxious — love comes alive when reassured. A message, a touch, one word can calm them or break them. Feeling ignored flips them straight into defense mode.",
    avoidant:
      "Avoidant — getting too close feels suffocating. Without alone time, being held onto makes them shut the door. 'Why won't you talk?' is the worst question to ask.",
  },
  "ko-KR": {
    secure:
      "안정형 — 가까워져도 숨 막히지 않고, 거리를 둬도 불안하지 않아요. 다만 '괜찮아'만 반복하면 상대는 방임으로 느낄 수 있어요.",
    anxious:
      "불안형 — 사랑은 확인받을 때 살아납니다. 연락·스킨십·말 한마디에 안심하거나 무너져요. 무시당했다고 느끼면 바로 방어 모드.",
    avoidant:
      "회피형 — 너무 가까워지면 숨이 막혀요. 혼자만의 시간 없이 붙잡히면 문을 닫습니다. '왜 말 안 해?'가 최악의 질문.",
  },
};

export function describeAttachmentStyle(
  lean: "secure" | "anxious" | "avoidant",
  nickname: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  return sanitizeHomeLifeText(
    `${nickname}: ${ATTACHMENT_LABELS[locale][lean] ?? ATTACHMENT_LABELS[locale].secure}`,
  );
}

export function buildAttachmentNarrative(ctx: {
  nicknameA: string;
  nicknameB: string;
  marriagePairAnalysis: {
    stemIntimacy: {
      attachmentLeanA: "secure" | "anxious" | "avoidant";
      attachmentLeanB: "secure" | "anxious" | "avoidant";
    };
  };
  locale?: Locale;
}): string {
  const locale = ctx.locale ?? LEGACY_FALLBACK_LOCALE;
  const leanA = ctx.marriagePairAnalysis.stemIntimacy.attachmentLeanA;
  const leanB = ctx.marriagePairAnalysis.stemIntimacy.attachmentLeanB;

  if (leanA === leanB) {
    if (leanA === "secure") {
      return sanitizeHomeLifeText(
        pick(
          locale,
          "You're both close to secure. Recovery after conflict tends to be quick, but skipping the emotional check-in can let 'pretending to be fine' build up.",
          "둘 다 안정형에 가깝습니다. 갈등 후 회복은 빠른 편이지만, 감정 확인을 건너뛰면 '괜찮은 척'만 하다가 쌓일 수 있어요.",
        ),
      );
    }
    if (leanA === "anxious") {
      return sanitizeHomeLifeText(
        pick(
          locale,
          "You're both anxious — without a routine of check-ins, contact, and touch, anxiety amplifies on both sides. Make 'are you okay right now?' a habit.",
          "둘 다 불안형 — 확인·연락·스킨십 루틴이 없으면 서로 불안이 증폭됩니다. '지금 괜찮아?'를 습관으로.",
        ),
      );
    }
    return sanitizeHomeLifeText(
      pick(
        locale,
        "You're both avoidant — each of you needs cave time. Instead of a chasing war, agree on 'until what time are we resting.'",
        "둘 다 회피형 — 각자 동굴 시간이 필수입니다. 붙잡기 전쟁 대신 '몇 시까지 쉴지' 합의하세요.",
      ),
    );
  }

  const lineA = describeAttachmentStyle(leanA, ctx.nicknameA, locale);
  const lineB = describeAttachmentStyle(leanB, ctx.nicknameB, locale);
  let dynamic = "";
  if (
    (leanA === "anxious" && leanB === "avoidant") ||
    (leanA === "avoidant" && leanB === "anxious")
  ) {
    dynamic = pick(
      locale,
      " This is a classic pursue-withdraw pattern. Pin down contact-check times and solo rest time like a written agreement.",
      " 전형적인 추격-회피 패턴입니다. 연락 약속 시간과 혼자 쉬는 시간을 문서처럼 박아 두세요.",
    );
  }
  return sanitizeHomeLifeText(`${lineA} ${lineB}${dynamic}`);
}

export function buildPrivateBoundary(
  nickname: string,
  chart: ChartContext,
  counts: TenGodCounts,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  const p = profileTenGods(counts);
  const lines = [
    pick(
      locale,
      `Don't publicly call out ${nickname} at home, or force a heavy conversation right after they get home from work.`,
      `${nickname}에게 집 안에서 공개적으로 지적하거나, 퇴근 직후 바로 무거운 대화를 강요하지 마세요.`,
    ),
  ];
  if (p.self >= 2) {
    lines.push(
      pick(
        locale,
        "If their authority or pride is touched, they switch straight into defense mode.",
        "결정권·자존심을 건드리면 바로 방어 모드로 전환됩니다.",
      ),
    );
  }
  if (p.seal >= 2) {
    lines.push(
      pick(
        locale,
        "If the conversation keeps going without any time alone to process, they get worn out.",
        "혼자 정리할 시간 없이 계속 말이 이어지면 지쳐요.",
      ),
    );
  }
  const energy = chartEnergyProfile(chart);
  if (energy.isHomebody) {
    lines.push(
      pick(
        locale,
        "Home is their charging space — noise, visitors, or sudden plans invading it is stressful.",
        "집은 충전 공간 — 소음·방문·갑작스런 일정이 침범되면 스트레스예요.",
      ),
    );
  }
  return sanitizeHomeLifeText(lines.join(" "));
}

export function buildPersonFamilyBoundaryNote(
  nickname: string,
  boundary: FamilyBoundaryProfile,
  counts: TenGodCounts,
  chart: ChartContext,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  const p = profileTenGods(counts);
  const parts: string[] = [];

  if (boundary.needsStrongBoundary) {
    parts.push(
      pick(
        locale,
        `${nickname} — when issues from the family of origin come up, this relationship shakes first. Drawing a line with in-laws and focusing on the nuclear family may look harsh, but it can be the right call.`,
        `${nickname} — 원가족 이슈가 올라오면 이 관계가 먼저 흔들립니다. 차라리 시댁·처가와 선을 긋고 핵가족만 챙기는 게 잔인해 보여도 맞는 선택일 수 있어요.`,
      ),
    );
  } else if (boundary.inlawStressIndex >= 45) {
    parts.push(
      pick(
        locale,
        `${nickname} is more comfortable with some distance from the family of origin. It's best to avoid sudden visits or phone calls that pull them in.`,
        `${nickname}은(는) 원가족과 적당한 거리가 있으면 편해요. 갑작스런 방문이나 전화 개입은 피하는 게 좋아요.`,
      ),
    );
  } else {
    parts.push(
      pick(
        locale,
        `${nickname}'s relationship with their family of origin is relatively stable. Just keep the boundary so family matters don't spill into your relationship when tired.`,
        `${nickname}은(는) 원가족 관계가 비교적 안정적이에요. 피로할 때 가족 일이 우리 관계로 번지지 않게 경계만 지키면 됩니다.`,
      ),
    );
  }

  if (p.hasHyoshin) {
    parts.push(
      pick(
        locale,
        "A strong sense of filial duty can mean 'I guess there's no choice' piles up their own feelings unspoken.",
        "효·의무 감정이 강해 '어쩔 수 없지' 하다가 본인 감정이 쌓일 수 있어요.",
      ),
    );
  }
  if (p.sealExcess) {
    parts.push(
      pick(
        locale,
        "They can wear themselves out carrying care and responsibility alone. Confirm the division of roles out loud.",
        "돌봄·책임을 혼자 끌어안다 지칠 수 있어요. 역할 분담을 말로 확인해 주세요.",
      ),
    );
  }
  if (boundary.yearPalaceTension) {
    parts.push(
      pick(
        locale,
        "They can get sensitive when facing in-laws directly. Give them time to buffer in between.",
        "시댁·처가와 직접 대면할 때 예민해지기 쉬워요. 중간에서 완충할 시간을 드세요.",
      ),
    );
  }

  const energy = chartEnergyProfile(chart);
  if (energy.isHomebody) {
    parts.push(
      pick(
        locale,
        "Home is sacred ground, so a long family visit takes days to recover from.",
        "집이 성역이라, 가족 방문이 길어지면 회복에 며칠이 걸려요.",
      ),
    );
  }

  return sanitizeHomeLifeText(parts.join(" "));
}

type HomeUpsetCategory =
  | "wealth"
  | "officer"
  | "food"
  | "seal"
  | "self"
  | "balanced";

const HOME_UPSET_BY_CATEGORY: Record<
  Locale,
  Record<HomeUpsetCategory, { signals: string; doList: string[]; avoidList: string[] }>
> = {
  "en-US": {
    wealth: {
      signals:
        "They go quiet, start mentioning money/spending/household budget more, or their expression turns cold. A 'not money again' mood rises.",
      doList: [
        "Show a concrete spending/saving plan first",
        "Promise a real, actionable fix — 'here's how I'll adjust'",
        "Ease the mood with something tasty or a small gift",
      ],
      avoidList: [
        "Trying to get past it with emotion alone",
        "Calling out spending or a mistake publicly at home",
      ],
    },
    officer: {
      signals: "They get terser, bring up rules/promises/roles more, or stiffen up.",
      doList: [
        "State the core point politely but directly",
        "Re-sort out chore/childcare/money roles",
        "Acknowledge their decision-making authority first",
      ],
      avoidList: [
        "Being vague or talking around it",
        "Suddenly changing the household routine without agreement",
      ],
    },
    food: {
      signals: "They either talk more or go quiet, feeling their emotional expression was rejected.",
      doList: [
        "Talk it out somewhere soft — a meal, a walk",
        "Acknowledge part of the emotion and propose the next step",
        "Lighten the mood with gentle humor",
      ],
      avoidList: [
        "Forcing a stiff conclusion right before bed",
        "Repeating 'that won't work' without elaborating",
      ],
    },
    seal: {
      signals: "They go quiet, try to sort things out alone, and reply/react more slowly.",
      doList: [
        "Give them time — 'let's pick this up tomorrow'",
        "Share things via note/chat",
        "Give space without pressure — 'tell me when you're ready'",
      ],
      avoidList: [
        "Demanding an instant answer or decision",
        "Chasing them around the house to keep talking",
      ],
    },
    self: {
      signals: "They get sensitive, and if they feel ignored, their tone sharpens or they keep their distance.",
      doList: [
        "Acknowledge them first — 'we got this done thanks to you'",
        "Set up a quiet 1:1 conversation",
        "Recognize their role and effort at home specifically",
      ],
      avoidList: [
        "Putting them down publicly in front of family or friends",
        "Emphasizing speed alone while ignoring feelings",
      ],
    },
    balanced: {
      signals: "They talk less than usual, or look like small household things have built into hurt feelings.",
      doList: [
        "Lead with one line checking in on their feelings",
        "Deal with just one topic today",
        "Change the air with a short walk or a cup of tea",
      ],
      avoidList: [
        "Bundling money, childcare, and chores into one conversation",
        "Repeating 'you're okay, right?' and moving on",
      ],
    },
  },
  "ko-KR": {
    wealth: {
      signals:
        "말수가 줄고, 돈·지출·가계 언급이 늘거나 표정이 차가워져요. '또 돈 얘기냐'는 분위기가 올라옵니다.",
      doList: [
        "구체적인 지출·절약 계획을 먼저 보여 주기",
        "'이렇게 맞춰 보겠다'는 실질 액션 약속하기",
        "맛있는 거·작은 선물로 분위기 풀기",
      ],
      avoidList: [
        "감정만으로 넘어가려 하기",
        "집안에서 공개적으로 지출·실수를 지적하기",
      ],
    },
    officer: {
      signals: "말이 짧아지고, 규칙·약속·역할 언급이 늘거나 딱딱하게 굳어요.",
      doList: [
        "핵심을 정중하지만 직접적으로 말하기",
        "가사·육아·돈 역할을 다시 정리해 주기",
        "결정권을 인정하는 한 마디 먼저 하기",
      ],
      avoidList: [
        "돌려 말하거나 애매하게 넘기기",
        "합의 없이 집안 루틴을 갑자기 바꾸기",
      ],
    },
    food: {
      signals: "말이 많아지거나 반대로 입을 닫고, 감정 표현이 거부당했다고 느껴요.",
      doList: [
        "부드러운 자리(식사·산책)에서 대화하기",
        "감정 일부를 인정하고 다음 스텝 제안하기",
        "가벼운 유머로 긴장 풀기",
      ],
      avoidList: [
        "잠들기 직전 딱딱하게 결론만 강요하기",
        "'그건 안 돼'만 반복하기",
      ],
    },
    seal: {
      signals: "조용해지고 혼자 정리하려 하며, 답장·반응이 느려져요.",
      doList: [
        "'오늘은 여기까지, 내일 다시'처럼 시간 주기",
        "메모·채팅으로 정리해 공유해 주기",
        "압박 없이 '준비되면 말해줘'라고 여유 주기",
      ],
      avoidList: [
        "즉답·즉결을 강요하기",
        "집안에서 계속 쫓아가며 말 걸기",
      ],
    },
    self: {
      signals: "예민해지고, 무시당했다고 느끼면 말투가 세지거나 거리를 둬요.",
      doList: [
        "'네 덕분에 됐다'는 인정을 먼저 하기",
        "1:1로 조용히 대화 자리 만들기",
        "집안에서 역할·노력을 구체적으로 인정해 주기",
      ],
      avoidList: [
        "가족·친구 앞에서 공개적으로 깎아내리기",
        "속도만 강조하며 감정 무시하기",
      ],
    },
    balanced: {
      signals: "평소보다 말이 줄거나, 사소한 집안 일로 서운함이 쌓인 표정이에요.",
      doList: [
        "먼저 감정을 확인하는 한 마디 하기",
        "오늘은 한 가지 주제만 다루기",
        "짧은 산책·차 한 잔으로 공기 바꾸기",
      ],
      avoidList: [
        "돈·육아·가사를 한꺼번에 묶어 말하기",
        "'괜찮지?'만 반복하고 넘어가기",
      ],
    },
  },
};

const HOME_BRANCH_UPSET_NUANCE: Record<Locale, Record<string, string>> = {
  "en-US": {
    ja: "They may suddenly start talking faster, or jump to a conclusion on their own first.",
    chuk: "They look fine on the surface but build it up inside, then quietly change direction once they hit a limit.",
    in: "They tend to go for a walk alone or step away to sort things out.",
    myo: "They read the room a lot, and once hurt feelings build up, they quietly keep their distance.",
    jin: "They may feel household roles/structure need to be redone and stiffen up.",
    sa: "Frustration can make their words rougher, or they just want to wrap things up fast.",
    o: "They may talk more, and emotion can bleed into their household tone.",
    mi: "They get defensive and closed off, and need alone time.",
    sin: "One detail about cleanliness can sour the mood, or they point things out sharply.",
    yu: "Their perfectionism spikes, and they get sensitive to tiny mistakes.",
    sul: "If they feel their territory was crossed, they draw a firm line.",
    hae: "They may avoid it, or bottle it up and burst all at once later.",
  },
  "ko-KR": {
    ja: "갑자기 말이 빨라지거나, 혼자 먼저 결론을 내려 버릴 수 있어요.",
    chuk: "표정은 멀쩡한데 속으로 쌓이다가, 한계 오면 조용히 방향을 트는 편이에요.",
    in: "혼자 산책하거나 자리를 비우며 정리하려 해요.",
    myo: "눈치를 많이 보다가, 서운함이 쌓이면 말없이 거리를 둬요.",
    jin: "집안 역할·구조를 다시 짜야 한다고 느끼며 딱딱해질 수 있어요.",
    sa: "답답함에 말이 거칠어지거나, 빨리 끝내고 싶어 해요.",
    o: "말이 많아지고 감정이 집안 말투에 섞일 수 있어요.",
    mi: "방어적으로 굳고, 혼자만의 시간이 필요해 보여요.",
    sin: "청결·디테일 하나로 분위기가 싸해지거나, 날카롭게 지적할 수 있어요.",
    yu: "완벽주의가 올라가며, 작은 실수에도 예민해져요.",
    sul: "내 영역이 침범당했다고 느끼면 단호하게 선을 그어요.",
    hae: "회피하거나, 뒤늦게 한꺼번에 터뜨릴 수 있어요.",
  },
};

export type HomeUpsetGuide = {
  nickname: string;
  upset_signals: string;
  do_list: string[];
  avoid_list: string[];
};

export function buildHomeUpsetResponseGuide(
  nickname: string,
  sajuJson: SajuDataForIntegrated,
  tenGodCounts: TenGodCounts,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): HomeUpsetGuide {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const category = dominantFamilyCategory(tenGodCounts) as HomeUpsetCategory;
  const base = HOME_UPSET_BY_CATEGORY[locale][category] ?? HOME_UPSET_BY_CATEGORY[locale].balanced;
  const branchNuance = HOME_BRANCH_UPSET_NUANCE[locale][chart.dayBranchCode] ?? "";

  return {
    nickname,
    upset_signals: sanitizeHomeLifeText(
      `${base.signals}${branchNuance ? ` ${branchNuance}` : ""}`,
    ),
    do_list: base.doList.map((item) => sanitizeHomeLifeText(item)),
    avoid_list: base.avoidList.map((item) => sanitizeHomeLifeText(item)),
  };
}
