import { REF_EARTHLY_BRANCHES, REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { chartEnergyProfile } from "@/lib/saju/marriageAnalysis";
import { buildChartContext, type ChartContext } from "@/lib/saju/chartContext";
import { sajuJsonToPillars, countElements } from "@/lib/saju/pairChartAnalysis";
import type { TenGodCounts } from "./marriageTenGodAnalysis";
import { profileTenGods } from "./marriageTenGodAnalysis";
import type { FamilyBoundaryProfile } from "./marriageTenGodAnalysis";

const SAJU_JARGON_RE =
  /일간|일지|월간|월지|년주|월주|연주|시주|지지|천간|십신|십성|오행|상생|상극|육합|삼합|방합|원진|귀문|공망|형벌|순환형|신강|신약|용신|기신|정재|편재|정관|편관|식신|상관|정인|편인|비견|겁재|효신|조후|역마|목\(木\)|화\(火\)|토\(土\)|금\(金\)|수\(水\)|[\u4e00-\u9fff]{1,2}합|[\u4e00-\u9fff]충|[\u4e00-\u9fff]형|[\u4e00-\u9fff]파|[\u4e00-\u9fff]해|\([\uac00-\ud7a3]{2}\)/g;

const STEM_LIFE_VALUES: Record<string, string> = {
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
};

const BRANCH_PRIVATE_LIFE: Record<string, string> = {
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
};

const CATEGORY_FAMILY_IDENTITY: Record<string, string> = {
  wealth: "가계·실속 중심 — 돈과 자원 관리가 가정의 뼈대라고 믿어요.",
  officer: "책임·질서 중심 — 가정 운영에 리더십과 규칙이 있어야 편해요.",
  food: "표현·창의 중심 — 집안 분위기와 대화가 가정의 온도를 만든다고 봐요.",
  seal: "돌봄·학습 중심 — 배려와 성장 지원이 가정의 핵심 가치예요.",
  self: "동반·독립 중심 — 서로의 자존심과 공간을 지키는 동반자 관계를 원해요.",
  balanced: "균형 잡힌 패밀리 DNA — 가사·재정·감정을 고르게 나누는 협력형이에요.",
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
};

export function buildHomeLifeDnaProfile(
  nickname: string,
  sajuJson: SajuDataForIntegrated,
  tenGodCounts: TenGodCounts,
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
    STEM_LIFE_VALUES[chart.dayStemCode] ??
    `${stemRef?.kor_name ?? "나"} 기질 — 관계에서 존중과 방향성을 동시에 원해요.`;

  const privateHome =
    BRANCH_PRIVATE_LIFE[chart.dayBranchCode] ??
    `${branchRef?.kor_name ?? "내"} 리듬 — 문 닫은 집 안에서만 드러나는 나만의 패턴이 있어요.`;

  let energyBattery: string;
  if (energy.isHomebody && !energy.isOutdoorsy) {
    energyBattery =
      "집돌이형 — 집 안에서 충전해요. 소파·침실·조용한 루틴이 배터리를 채웁니다.";
  } else if (energy.isOutdoorsy && !energy.isHomebody) {
    energyBattery =
      "밖순이형 — 산책·카페·외출이 배터리예요. 주말에 밖에서 리셋하는 편이에요.";
  } else {
    energyBattery =
      "하이브리드형 — 집에서도 충전하고 밖에서도 리셋해요. 상황에 따라 유연하게.";
  }

  const familyIdentity =
    CATEGORY_FAMILY_IDENTITY[category] ?? CATEGORY_FAMILY_IDENTITY.balanced!;

  return {
    nickname,
    lifestyle_title: lifestyleTitle(category, nickname),
    life_values: sanitizeHomeLifeText(lifeValues),
    private_home_self: sanitizeHomeLifeText(privateHome),
    energy_battery: sanitizeHomeLifeText(energyBattery),
    family_identity: sanitizeHomeLifeText(familyIdentity),
  };
}

const ATTACHMENT_LABELS: Record<string, string> = {
  secure:
    "안정형 — 가까워져도 숨 막히지 않고, 거리를 둬도 불안하지 않아요. 다만 '괜찮아'만 반복하면 상대는 방임으로 느낄 수 있어요.",
  anxious:
    "불안형 — 사랑은 확인받을 때 살아납니다. 연락·스킨십·말 한마디에 안심하거나 무너져요. 무시당했다고 느끼면 바로 방어 모드.",
  avoidant:
    "회피형 — 너무 가까워지면 숨이 막혀요. 혼자만의 시간 없이 붙잡히면 문을 닫습니다. '왜 말 안 해?'가 최악의 질문.",
};

export function describeAttachmentStyle(
  lean: "secure" | "anxious" | "avoidant",
  nickname: string,
): string {
  return sanitizeHomeLifeText(
    `${nickname}: ${ATTACHMENT_LABELS[lean] ?? ATTACHMENT_LABELS.secure}`,
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
}): string {
  const leanA = ctx.marriagePairAnalysis.stemIntimacy.attachmentLeanA;
  const leanB = ctx.marriagePairAnalysis.stemIntimacy.attachmentLeanB;

  if (leanA === leanB) {
    if (leanA === "secure") {
      return sanitizeHomeLifeText(
        "둘 다 안정형에 가깝습니다. 갈등 후 회복은 빠른 편이지만, 감정 확인을 건너뛰면 '괜찮은 척'만 하다가 쌓일 수 있어요.",
      );
    }
    if (leanA === "anxious") {
      return sanitizeHomeLifeText(
        "둘 다 불안형 — 확인·연락·스킨십 루틴이 없으면 서로 불안이 증폭됩니다. '지금 괜찮아?'를 습관으로.",
      );
    }
    return sanitizeHomeLifeText(
      "둘 다 회피형 — 각자 동굴 시간이 필수입니다. 붙잡기 전쟁 대신 '몇 시까지 쉴지' 합의하세요.",
    );
  }

  const lineA = describeAttachmentStyle(leanA, ctx.nicknameA);
  const lineB = describeAttachmentStyle(leanB, ctx.nicknameB);
  let dynamic = "";
  if (
    (leanA === "anxious" && leanB === "avoidant") ||
    (leanA === "avoidant" && leanB === "anxious")
  ) {
    dynamic =
      " 전형적인 추격-회피 패턴입니다. 연락 약속 시간과 혼자 쉬는 시간을 문서처럼 박아 두세요.";
  }
  return sanitizeHomeLifeText(`${lineA} ${lineB}${dynamic}`);
}

export function buildPrivateBoundary(
  nickname: string,
  chart: ChartContext,
  counts: TenGodCounts,
): string {
  const p = profileTenGods(counts);
  const lines = [
    `${nickname}에게 집 안에서 공개적으로 지적하거나, 퇴근 직후 바로 무거운 대화를 강요하지 마세요.`,
  ];
  if (p.self >= 2) {
    lines.push("결정권·자존심을 건드리면 바로 방어 모드로 전환됩니다.");
  }
  if (p.seal >= 2) {
    lines.push("혼자 정리할 시간 없이 계속 말이 이어지면 지쳐요.");
  }
  const energy = chartEnergyProfile(chart);
  if (energy.isHomebody) {
    lines.push("집은 충전 공간 — 소음·방문·갑작스런 일정이 침범되면 스트레스예요.");
  }
  return sanitizeHomeLifeText(lines.join(" "));
}

export function buildPersonFamilyBoundaryNote(
  nickname: string,
  boundary: FamilyBoundaryProfile,
  counts: TenGodCounts,
  chart: ChartContext,
): string {
  const p = profileTenGods(counts);
  const parts: string[] = [];

  if (boundary.needsStrongBoundary) {
    parts.push(
      `${nickname} — 원가족 이슈가 올라오면 이 관계가 먼저 흔들립니다. 차라리 시댁·처가와 선을 긋고 핵가족만 챙기는 게 잔인해 보여도 맞는 선택일 수 있어요.`,
    );
  } else if (boundary.inlawStressIndex >= 45) {
    parts.push(
      `${nickname}은(는) 원가족과 적당한 거리가 있으면 편해요. 갑작스런 방문이나 전화 개입은 피하는 게 좋아요.`,
    );
  } else {
    parts.push(
      `${nickname}은(는) 원가족 관계가 비교적 안정적이에요. 피로할 때 가족 일이 우리 관계로 번지지 않게 경계만 지키면 됩니다.`,
    );
  }

  if (p.hasHyoshin) {
    parts.push(
      "효·의무 감정이 강해 '어쩔 수 없지' 하다가 본인 감정이 쌓일 수 있어요.",
    );
  }
  if (p.sealExcess) {
    parts.push(
      "돌봄·책임을 혼자 끌어안다 지칠 수 있어요. 역할 분담을 말로 확인해 주세요.",
    );
  }
  if (boundary.yearPalaceTension) {
    parts.push(
      "시댁·처가와 직접 대면할 때 예민해지기 쉬워요. 중간에서 완충할 시간을 드세요.",
    );
  }

  const energy = chartEnergyProfile(chart);
  if (energy.isHomebody) {
    parts.push(
      "집이 성역이라, 가족 방문이 길어지면 회복에 며칠이 걸려요.",
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
  HomeUpsetCategory,
  { signals: string; doList: string[]; avoidList: string[] }
> = {
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
    signals:
      "말이 짧아지고, 규칙·약속·역할 언급이 늘거나 딱딱하게 굳어요.",
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
    signals:
      "말이 많아지거나 반대로 입을 닫고, 감정 표현이 거부당했다고 느껴요.",
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
    signals:
      "조용해지고 혼자 정리하려 하며, 답장·반응이 느려져요.",
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
    signals:
      "예민해지고, 무시당했다고 느끼면 말투가 세지거나 거리를 둬요.",
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
    signals:
      "평소보다 말이 줄거나, 사소한 집안 일로 서운함이 쌓인 표정이에요.",
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
};

const HOME_BRANCH_UPSET_NUANCE: Record<string, string> = {
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
): HomeUpsetGuide {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const category = dominantFamilyCategory(tenGodCounts) as HomeUpsetCategory;
  const base = HOME_UPSET_BY_CATEGORY[category] ?? HOME_UPSET_BY_CATEGORY.balanced;
  const branchNuance = HOME_BRANCH_UPSET_NUANCE[chart.dayBranchCode] ?? "";

  return {
    nickname,
    upset_signals: sanitizeHomeLifeText(
      `${base.signals}${branchNuance ? ` ${branchNuance}` : ""}`,
    ),
    do_list: base.doList.map((item) => sanitizeHomeLifeText(item)),
    avoid_list: base.avoidList.map((item) => sanitizeHomeLifeText(item)),
  };
}
