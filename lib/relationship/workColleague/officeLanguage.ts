import { REF_HEAVENLY_STEMS, REF_EARTHLY_BRANCHES } from "@/lib/hardcoded/sajuReferenceData";
import type { SajuDataForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";
import { countElements } from "@/lib/saju/pairChartAnalysis";
import { buildChartContext, type ChartContext } from "@/lib/saju/chartContext";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import type { WorkStemCommunicationAnalysis } from "@/lib/saju/workPairAnalysis";
import type { TenGodCategory } from "./tenGodComplement";

const SAJU_JARGON_RE =
  /일간|일지|월간|월지|년주|월주|연주|시주|지지|천간|십신|십성|오행|상생|상극|육합|삼합|방합|원진|귀문|공망|형벌|순환형|신강|신약|용신|기신|정재|편재|정관|편관|식신|상관|정인|편인|비견|겁재|천간합|천간충|목\(木\)|화\(火\)|토\(土\)|금\(金\)|수\(水\)|[\u4e00-\u9fff]{1,2}합|[\u4e00-\u9fff]충|[\u4e00-\u9fff]형|[\u4e00-\u9fff]파|[\u4e00-\u9fff]해|\([\uac00-\ud7a3]{2}\)/g;

const STEM_OFFICE_PERSONA: Record<string, string> = {
  gap: "큰 방향을 먼저 잡고, 팀을 한 방향으로 끌고 가는 추진형",
  eul: "사람 사이를 조율하며, 업무 흐름을 부드럽게 이어 주는 협업형",
  byeong: "빠르게 판단하고, 에너지가 모이면 주변을 끌어올리는 실행형",
  jeong: "동료 기분을 세심히 챙기고, 신뢰를 쌓으며 꾸준히 밀어붙이는 케어형",
  mu: "흔들리는 상황에서도 기준을 지키며, 팀의 중심을 잡는 안정형",
  gi: "디테일에 강하고, 눈에 보이는 결과로 증명하는 실무형",
  gyeong: "원칙과 효율을 중시하고, 핵심만 짚어 정리하는 분석형",
  sin: "완성도를 중시하고, 퀄리티가 떨어지면 바로잡으려는 품질형",
  im: "맥락을 읽고 유연하게 대응하며, 정보가 모이면 전략을 세우는 기획형",
  gye: "깊이 생각한 뒤 움직이고, 섣부른 결론을 피하는 신중형",
};

const CATEGORY_IDEAL_FIT: Record<
  TenGodCategory,
  { roles: string[]; departments: string[] }
> = {
  재성: {
    roles: ["사업개발", "재무·회계", "영업 리드", "운영 효율화"],
    departments: ["사업본부", "재무팀", "영업팀", "경영관리"],
  },
  관성: {
    roles: ["프로젝트 매니저", "운영 총괄", "품질·일정 관리", "대외 협력"],
    departments: ["PMO", "운영팀", "경영지원", "법무·컴플라이언스"],
  },
  식상: {
    roles: ["서비스·제품 기획", "콘텐츠 기획", "브랜드·마케팅", "UX 라이팅"],
    departments: ["기획팀", "마케팅", "콘텐츠·크리에이티브", "제품팀"],
  },
  인성: {
    roles: ["리서치·데이터 분석", "문서·교육", "HR·온보딩", "백오피스 지원"],
    departments: ["리서치", "인사·조직문화", "교육", "전략지원"],
  },
  비겁: {
    roles: ["현장 실행", "고객·CS 리드", "팀 리더", "파트너 조율"],
    departments: ["현장·필드", "고객지원", "팀 단위 실행 조직", "파트너십"],
  },
};

const UPSET_RESPONSE_BY_CATEGORY: Record<
  TenGodCategory,
  { signals: string; doList: string[]; avoidList: string[] }
> = {
  재성: {
    signals: "말수가 줄고, 성과·비용·손해 언급이 늘거나 표정이 차가워져요.",
    doList: [
      "구체적인 보완 계획을 먼저 제시하기",
      "'이렇게 맞춰 보겠다'는 실질 액션 약속하기",
      "커피·간식·식사 등 가벼운 보상으로 분위기 풀기",
    ],
    avoidList: [
      "감정만으로 넘어가려 하기",
      "공개 자리에서 손실·실수를 지적하기",
    ],
  },
  관성: {
    signals: "말이 짧아지고, 규칙·프로세스 언급이 늘거나 딱딱하게 굳어요.",
    doList: [
      "핵심을 정중하지만 직접적으로 말하기",
      "역할·책임 경계를 문서로 다시 정리해 주기",
      "결정권을 인정하는 한 마디 먼저 하기",
    ],
    avoidList: [
      "돌려 말하거나 애매하게 넘기기",
      "프로세스 없이 갑자기 방향만 바꾸기",
    ],
  },
  식상: {
    signals: "말이 많아지거나 반대로 입을 닫고, 표현·아이디어가 거부당했다고 느껴요.",
    doList: [
      "가벼운 식사·커피 자리에서 대화하기",
      "아이디어 일부를 인정하고 다음 스텝 제안하기",
      "유머나 가벼운 분위기로 긴장 풀기",
    ],
    avoidList: [
      "회의실에서 딱딱하게 결론만 강요하기",
      "'그건 안 돼'만 반복하기",
    ],
  },
  인성: {
    signals: "조용해지고 혼자 정리하려 하며, 답장·반응이 느려져요.",
    doList: [
      "'오늘은 여기까지, 내일 다시'처럼 시간 주기",
      "문서·메모로 정리해 공유해 주기",
      "압박 없이 '준비되면 말해줘'라고 여유 주기",
    ],
    avoidList: [
      "즉답·즉결을 강요하기",
      "공개 채팅에서 계속 멘션하기",
    ],
  },
  비겁: {
    signals: "예민해지고, 무시당했다고 느끼면 말투가 세지거나 거리를 둬요.",
    doList: [
      "'네 덕분에 됐다'는 인정을 먼저 하기",
      "1:1로 조용히 대화 자리 만들기",
      "팀 안에서 공개적으로 역할을 인정해 주기",
    ],
    avoidList: [
      "회의에서 공개적으로 깎아내리기",
      "속도만 강조하며 감정 무시하기",
    ],
  },
};

const BRANCH_UPSET_NUANCE: Record<string, string> = {
  ja: "갑자기 말이 빨라지거나, 혼자 먼저 결론을 내려 버릴 수 있어요.",
  chuk: "표정은 멀쩡한데 속으로 쌓이다가, 한계 오면 조용히 방향을 트는 편이에요.",
  in: "혼자 산책하거나 자리를 비우며 정리하려 해요.",
  myo: "눈치를 많이 보다가, 서운함이 쌓이면 말없이 거리를 둬요.",
  jin: "구조·역할을 다시 짜야 한다고 느끼며 딱딱해질 수 있어요.",
  sa: "답답함에 말이 거칠어지거나, 빨리 끝내고 싶어 해요.",
  o: "말이 많아지고 감정이 업무 말투에 섞일 수 있어요.",
  mi: "방어적으로 굳고, 혼자만의 시간이 필요해 보여요.",
  sin: "디테일 하나로 분위기가 싸해지거나, 날카롭게 지적할 수 있어요.",
  yu: "완벽주의가 올라가며, 작은 실수에도 예민해져요.",
  sul: "내 영역이 침범당했다고 느끼면 단호하게 선을 그어요.",
  hae: "회피하거나, 뒤늦게 한꺼번에 터뜨릴 수 있어요.",
};


const ELEMENT_OFFICE: Record<string, string> = {
  wood: "성장·개척",
  fire: "표현·속도",
  earth: "안정·실무",
  metal: "원칙·정밀",
  water: "분석·유연",
};

const CATEGORY_TITLE: Record<TenGodCategory, string[]> = {
  재성: ["실속 폭주 CFO", "냉철한 딜메이커", "숫자 감각 폭발형"],
  관성: ["프로세스 지킴이 PM", "냉정한 브레이커", "책임감 MAX 리더"],
  식상: ["아이디어 뱅크", "말 되는 기획자", "브레인스토밍 장인"],
  인성: ["리서치 요정", "문서화 마스터", "조용한 서포터"],
  비겁: ["현장형 팀플레이어", "자존심 강한 독립군", "동료애 넘치는 실행러"],
};

const STEM_WORK_STYLE: Record<string, string> = {
  gap: "큰 그림을 먼저 그리고, 방향이 맞으면 과감히 밀어붙여요.",
  eul: "섬세하게 조율하며, 사람의 리듬에 맞춰 일의 흐름을 다듬어요.",
  byeong: "빠르고 직관적으로 판단하고, 에너지가 모이면 팀을 끌어올려요.",
  jeong: "따뜻한 설득과 꾸준한 실행으로 신뢰를 쌓는 타입이에요.",
  mu: "중심을 잡고, 흔들리는 상황에서도 기준을 지키려 해요.",
  gi: "실무 디테일에 강하고, 눈에 보이는 결과로 증명하는 편이에요.",
  gyeong: "원칙과 효율을 중시하고, 날카롭게 핵심만 짚어요.",
  sin: "정밀함과 완성도를 추구하고, 퀄리티가 떨어지면 참기 어려워요.",
  im: "맥락을 읽고 유연하게 대응하며, 정보가 모이면 전략이 살아나요.",
  gye: "깊이 생각한 뒤 움직이고, 섣부른 결론은 피하려 해요.",
};

const BRANCH_CRISIS_STYLE: Record<string, string> = {
  ja: "위기 때 침묵하지 않고, 빠르게 판을 바꾸려 듭니다.",
  chuk: "버티는 힘으로 버티다가, 한계 오면 조용히 방향을 튼니다.",
  in: "새로운 길을 찾으며, 혼자 먼저 움직이는 편입니다.",
  myo: "예민하게 신호를 읽고, 분위기가 어색하면 먼저 거리를 둡니다.",
  jin: "큰 변화를 감당하며, 구조를 다시 짜려 합니다.",
  sa: "압박이 오면 속도를 올리고, 결론을 빨리 내고 싶어 합니다.",
  o: "체온이 올라가면 말이 많아지고, 감정이 업무에 섞일 수 있어요.",
  mi: "상처받으면 방어적으로 굳고, 혼자 정리할 시간이 필요해요.",
  sin: "날카롭게 반응하며, 기준이 무너지면 바로 지적합니다.",
  yu: "완벽주의가 올라와, 디테일 하나로 분위기가 싸해질 수 있어요.",
  sul: "책임감이 폭발하고, 내 영역이 침범당하면 단호해집니다.",
  hae: "감정이 깊어지면 회피하거나, 뒤늦게 한꺼번에 터뜨릴 수 있어요.",
};

export type OfficeDnaProfile = {
  character_title: string;
  work_style: string;
  inner_standard: string;
  overall_character: string;
};

export function sanitizeOfficeText(text: string): string {
  return text
    .replace(SAJU_JARGON_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\(\s*\)/g, "")
    .trim();
}

function dominantElement(chart: ChartContext): string {
  const counts = countElements(chart);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "earth";
}

function dominantCategory(
  counts: Record<string, number>,
): TenGodCategory {
  const cats: TenGodCategory[] = ["재성", "관성", "식상", "인성", "비겁"];
  const score = (cat: TenGodCategory) => {
    const map: Record<TenGodCategory, string[]> = {
      재성: ["정재", "편재"],
      관성: ["정관", "편관"],
      식상: ["식신", "상관"],
      인성: ["정인", "편인"],
      비겁: ["비견", "겁재"],
    };
    return map[cat].reduce((s, g) => s + (counts[g] ?? 0), 0);
  };
  return cats.sort((a, b) => score(b) - score(a))[0] ?? "비겁";
}

function hipTitle(category: TenGodCategory, element: string): string {
  const titles = CATEGORY_TITLE[category];
  const el = ELEMENT_OFFICE[element] ?? "";
  const pick = titles[Math.abs(element.length + category.length) % titles.length]!;
  return el ? `${pick} · ${el} DNA` : pick;
}

export function buildOfficeDnaProfile(
  sajuJson: SajuDataForIntegrated,
  tenGodCounts: Record<string, number>,
): OfficeDnaProfile {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const element = dominantElement(chart);
  const category = dominantCategory(tenGodCounts);

  const stemRef = REF_HEAVENLY_STEMS.find((r) => r.code === chart.dayStemCode);
  const branchRef = REF_EARTHLY_BRANCHES.find(
    (r) => r.code === chart.dayBranchCode,
  );

  const workStyle =
    STEM_WORK_STYLE[chart.dayStemCode] ??
    `${stemRef?.kor_name ?? "나"} 기질 — 방향이 맞을 때 집중력이 폭발하는 타입이에요.`;

  const innerStandard =
    BRANCH_CRISIS_STYLE[chart.dayBranchCode] ??
    `${branchRef?.kor_name ?? "내"} 리듬 — 위기 때 내가 지키려는 기준이 분명해집니다.`;

  const elLabel = ELEMENT_OFFICE[element] ?? "균형";
  const overall = sanitizeOfficeText(
    `오피스에서 ${elLabel} 에너지가 두드러져요. ` +
      `${category === "재성" ? "돈·자원·성과" : category === "관성" ? "책임·관리·추진" : category === "식상" ? "아이디어·표현·산출" : category === "인성" ? "학습·정리·지원" : "동료심·실행·현장"} 쪽 강점이 살아나며, ` +
      `팀에서 '${hipTitle(category, element).split(" · ")[0]}' 포지션이 잘 맞습니다.`,
  );

  return {
    character_title: hipTitle(category, element),
    work_style: sanitizeOfficeText(workStyle),
    inner_standard: sanitizeOfficeText(innerStandard),
    overall_character: overall,
  };
}

export type DeEscalationCard = {
  hashtag: string;
  color: "red" | "yellow" | "orange" | "blue" | "green";
  title: string;
  detail: string;
};

const DE_ESCALATION_CARDS: Array<
  DeEscalationCard & { categories: TenGodCategory[]; elements: string[] }
> = [
  {
    hashtag: "#우쭈쭈_자존심이생명",
    color: "red",
    title: "인정 한 마디가 스위치",
    detail:
      "무시당했다고 느끼면 바로 방어 모드예요. 공개적으로 깎아내리지 말고, '네 덕분에 됐다'는 인정을 먼저 주세요.",
    categories: ["비겁"],
    elements: ["wood"],
  },
  {
    hashtag: "#맛있는거주면풀린다",
    color: "yellow",
    title: "밥·커피·간식이 화해 비자",
    detail:
      "감정이 올라와도 분위기가 부드러우면 금방 풀려요. 딱딱한 회의실 대신 가볍게 먹으면서 이야기하세요.",
    categories: ["식상"],
    elements: ["fire"],
  },
  {
    hashtag: "#시간이지나면풀린다",
    color: "orange",
    title: "즉답 압박이 독",
    detail:
      "당장 결론을 강요하면 더 굳어요. '오늘은 여기까지, 내일 다시'가 최고의 갈등 해독제입니다.",
    categories: ["인성"],
    elements: ["earth"],
  },
  {
    hashtag: "#대놓고이야기해야풀린다",
    color: "blue",
    title: "돌려 말하면 오히려 폭발",
    detail:
      "눈치 보는 게 싫어요. 핵심을 정중하지만 직접적으로 말하고, 숨은 메시지는 피하세요.",
    categories: ["관성"],
    elements: ["metal"],
  },
  {
    hashtag: "#실속형사과가최고",
    color: "green",
    title: "말보다 결과·보상",
    detail:
      "감정 사과만으로는 부족해요. '이렇게 보완하겠다'는 실질 액션과 손해 보상이 있으면 금방 넘어갑니다.",
    categories: ["재성"],
    elements: ["water"],
  },
];

export function pickDeEscalationCard(
  tenGodsA: Record<string, number>,
  tenGodsB: Record<string, number>,
  chartA: ChartContext,
  chartB: ChartContext,
): DeEscalationCard {
  const catA = dominantCategory(tenGodsA);
  const catB = dominantCategory(tenGodsB);
  const elA = dominantElement(chartA);
  const elB = dominantElement(chartB);

  let best = DE_ESCALATION_CARDS[0]!;
  let bestScore = -1;

  for (const card of DE_ESCALATION_CARDS) {
    let score = 0;
    if (card.categories.includes(catA)) score += 3;
    if (card.categories.includes(catB)) score += 3;
    if (card.elements.includes(elA)) score += 2;
    if (card.elements.includes(elB)) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = card;
    }
  }

  const { hashtag, color, title, detail } = best;
  return { hashtag, color, title, detail };
}

/** 동료 맥락에서 이해 가능한 일터 페르소나 — 촛불·산 같은 은유 대신 */
export function resolveWorkColleagueStylePhrase(
  sajuJson: SajuDataForIntegrated,
  tenGodCounts: Record<string, number>,
): string {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const category = dominantCategory(tenGodCounts);
  const persona =
    STEM_OFFICE_PERSONA[chart.dayStemCode] ??
    "방향이 맞을 때 집중력이 올라가는 협업형";
  const deptHint = CATEGORY_IDEAL_FIT[category].roles[0] ?? "팀 실행";
  return sanitizeOfficeText(`${persona}. ${deptHint} 쪽 업무에서 강점이 잘 드러나요.`);
}

export function buildOfficeMeetingSummary(
  comm: WorkStemCommunicationAnalysis,
): string {
  const topTension = comm.stemPairs
    .filter((p) => p.type === "천간충" || p.type === "상극")
    .sort((a, b) => a.weightedScore - b.weightedScore)
    .slice(0, 2);
  const topPositive = comm.stemPairs
    .filter((p) => p.weightedScore > 0)
    .slice(0, 2);

  if (topTension.length > 0) {
    return sanitizeOfficeText(
      "회의에서 한쪽은 빠른 결론, 다른 쪽은 꼼꼼한 검토를 원해 부딪히기 쉬워요. 안건을 나누거나 '오늘은 방향만 / 내일은 디테일'처럼 순서를 정하면 편해요.",
    );
  }
  if (topPositive.some((p) => p.type === "천간합")) {
    return sanitizeOfficeText(
      "회의에서 방향이 자연스럽게 맞는 편이에요. 서로의 판단을 빠르게 신뢰할 수 있는 조합입니다.",
    );
  }
  if (topPositive.some((p) => p.type === "상생")) {
    return sanitizeOfficeText(
      "회의할 때 서로의 말이 업무 에너지를 살려 주는 편이에요. 아이디어가 오가면 시너지가 커집니다.",
    );
  }
  return sanitizeOfficeText(
    "회의 스타일 차이는 있지만, 안건·역할만 미리 정하면 충분히 맞출 수 있어요.",
  );
}

export type OfficeUpsetGuide = {
  nickname: string;
  upset_signals: string;
  do_list: string[];
  avoid_list: string[];
};

export function buildUpsetResponseGuide(
  nickname: string,
  sajuJson: SajuDataForIntegrated,
  tenGodCounts: Record<string, number>,
): OfficeUpsetGuide {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const category = dominantCategory(tenGodCounts);
  const base = UPSET_RESPONSE_BY_CATEGORY[category];
  const branchNuance = BRANCH_UPSET_NUANCE[chart.dayBranchCode] ?? "";

  return {
    nickname,
    upset_signals: sanitizeOfficeText(
      `${base.signals}${branchNuance ? ` ${branchNuance}` : ""}`,
    ),
    do_list: base.doList.map((item) => sanitizeOfficeText(item)),
    avoid_list: base.avoidList.map((item) => sanitizeOfficeText(item)),
  };
}

export type OfficeIdealRoleFit = {
  nickname: string;
  ideal_roles: string[];
  ideal_departments: string[];
  why: string;
};

export function buildIdealRoleFit(
  nickname: string,
  sajuJson: SajuDataForIntegrated,
  tenGodCounts: Record<string, number>,
): OfficeIdealRoleFit {
  const category = dominantCategory(tenGodCounts);
  const fit = CATEGORY_IDEAL_FIT[category];
  const dna = buildOfficeDnaProfile(sajuJson, tenGodCounts);
  const title = dna.character_title.split(" · ")[0] ?? "실행형";

  return {
    nickname,
    ideal_roles: fit.roles.slice(0, 4),
    ideal_departments: fit.departments.slice(0, 3),
    why: sanitizeOfficeText(
      `${nickname}은(는) ${title} 기질이라 ${fit.departments[0]}·${fit.roles[0]} 같은 자리에서 역량이 잘 드러나요.`,
    ),
  };
}

export function buildPairIdealRoleCombo(
  nicknameA: string,
  nicknameB: string,
  fitA: OfficeIdealRoleFit,
  fitB: OfficeIdealRoleFit,
): string {
  return sanitizeOfficeText(
    `함께 일할 때는 ${nicknameA}가 ${fitA.ideal_roles[0]} 쪽, ${nicknameB}가 ${fitB.ideal_roles[0]} 쪽으로 역할을 나누면 팀이 가장 잘 돌아갑니다. ` +
      `${fitA.ideal_departments[0]} × ${fitB.ideal_departments[0]} 조합이 특히 잘 맞아요.`,
  );
}
