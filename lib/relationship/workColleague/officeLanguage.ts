import { REF_HEAVENLY_STEMS, REF_EARTHLY_BRANCHES } from "@/lib/hardcoded/sajuReferenceData";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { countElements } from "@/lib/saju/pairChartAnalysis";
import { buildChartContext, type ChartContext } from "@/lib/saju/chartContext";
import { sajuJsonToPillars } from "@/lib/saju/pairChartAnalysis";
import type { WorkStemCommunicationAnalysis } from "@/lib/saju/workPairAnalysis";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import type { TenGodCategory } from "./tenGodComplement";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";

/**
 * PersonCore SSOT 격국(월주 기준) → work 리포트가 쓰는 로컬 5범주 매핑.
 * 이전에는 "4개 기둥 전체에서 십신 갯수가 가장 많은 범주"(dominantCategory,
 * 아래)로 캐릭터 타입을 정했는데, 이는 명리학적으로 격국을 정하는 정식 방법이
 * 아니다. PersonCore(`extractWorkSignals.ts`)가 이미 월간 십신 기준 격국을
 * 계산해 두었으므로, sajuMaster가 있으면 이쪽을 SSOT로 우선 사용한다.
 * 없으면(레거시 캐시 등) 기존 raw-count 방식으로 안전하게 폴백한다.
 */
const GEOKGUK_TO_LOCAL_CATEGORY: Record<
  WorkSajuSignals["month_geokguk"]["month_stem_category"],
  TenGodCategory
> = {
  self: "비겁",
  food: "식상",
  wealth: "재성",
  officer: "관성",
  seal: "인성",
};

const SAJU_JARGON_RE =
  /일간|일지|월간|월지|년주|월주|연주|시주|지지|천간|십신|십성|오행|상생|상극|육합|삼합|방합|원진|귀문|공망|형벌|순환형|신강|신약|용신|기신|정재|편재|정관|편관|식신|상관|정인|편인|비견|겁재|천간합|천간충|목\(木\)|화\(火\)|토\(土\)|금\(金\)|수\(水\)|[一-鿿]{1,2}합|[一-鿿]충|[一-鿿]형|[一-鿿]파|[一-鿿]해|\([가-힣]{2}\)/g;

const STEM_OFFICE_PERSONA: Record<Locale, Record<string, string>> = {
  "en-US": {
    gap: "sets the big direction first and pulls the team the same way — a driver",
    eul: "smooths things between people and keeps work flowing gently — a collaborator",
    byeong: "decides fast, and once energy gathers, lifts everyone around them — an executor",
    jeong: "cares about how coworkers feel and builds trust while pushing steadily — a carer",
    mu: "holds the line even when things wobble, keeping the team's center — a stabilizer",
    gi: "strong on detail, proves it with visible results — a practitioner",
    gyeong: "values principle and efficiency, cuts straight to the point — an analyst",
    sin: "cares about polish, and fixes it fast when quality slips — a quality-focused type",
    im: "reads context and adapts flexibly, builds strategy once information gathers — a strategist",
    gye: "thinks deeply before moving, avoids rushing to conclusions — a careful type",
  },
  "ko-KR": {
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
  },
};

const CATEGORY_IDEAL_FIT: Record<
  Locale,
  Record<TenGodCategory, { roles: string[]; departments: string[] }>
> = {
  "en-US": {
    재성: {
      roles: ["Business development", "Finance & accounting", "Sales lead", "Operational efficiency"],
      departments: ["Business unit", "Finance team", "Sales team", "Management/operations"],
    },
    관성: {
      roles: ["Project manager", "Operations lead", "Quality & schedule management", "External partnerships"],
      departments: ["PMO", "Operations team", "Corporate support", "Legal & compliance"],
    },
    식상: {
      roles: ["Product/service planning", "Content planning", "Brand & marketing", "UX writing"],
      departments: ["Planning team", "Marketing", "Content/creative", "Product team"],
    },
    인성: {
      roles: ["Research & data analysis", "Documentation & training", "HR & onboarding", "Back-office support"],
      departments: ["Research", "HR & culture", "Learning & development", "Strategy support"],
    },
    비겁: {
      roles: ["Field execution", "Customer/CS lead", "Team leader", "Partner coordination"],
      departments: ["Field ops", "Customer support", "Team-based execution units", "Partnerships"],
    },
  },
  "ko-KR": {
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
  },
};

const UPSET_RESPONSE_BY_CATEGORY: Record<
  Locale,
  Record<TenGodCategory, { signals: string; doList: string[]; avoidList: string[] }>
> = {
  "en-US": {
    재성: {
      signals: "They go quiet, start mentioning results/costs/losses more, or their expression turns cold.",
      doList: [
        "Offer a concrete plan to make up for it first",
        "Promise a real, actionable fix — 'here's how I'll adjust'",
        "Ease the mood with a small treat — coffee, snacks, a meal",
      ],
      avoidList: [
        "Trying to get past it with emotion alone",
        "Pointing out the loss or mistake in front of others",
      ],
    },
    관성: {
      signals: "They get terser, bring up rules/process more, or stiffen up.",
      doList: [
        "State the core point politely but directly",
        "Re-document roles and responsibility boundaries",
        "Acknowledge their decision-making authority first",
      ],
      avoidList: [
        "Being vague or talking around it",
        "Suddenly changing direction without a process",
      ],
    },
    식상: {
      signals: "They either talk more or go quiet, feeling their ideas or expression were rejected.",
      doList: [
        "Talk it out over a casual meal or coffee",
        "Acknowledge part of the idea and propose the next step",
        "Lighten the mood with humor",
      ],
      avoidList: [
        "Forcing a stiff conclusion in the meeting room",
        "Repeating 'that won't work' without elaborating",
      ],
    },
    인성: {
      signals: "They go quiet, try to sort things out alone, and reply/react more slowly.",
      doList: [
        "Give them time — 'let's pick this up tomorrow'",
        "Share things in writing/notes",
        "Give space without pressure — 'tell me when you're ready'",
      ],
      avoidList: [
        "Demanding an instant answer or decision",
        "Repeatedly tagging them in public chat",
      ],
    },
    비겁: {
      signals: "They get sensitive, and if they feel ignored, their tone sharpens or they keep their distance.",
      doList: [
        "Acknowledge them first — 'we got this done thanks to you'",
        "Set up a quiet 1:1 conversation",
        "Recognize their role publicly within the team",
      ],
      avoidList: [
        "Putting them down publicly in a meeting",
        "Emphasizing speed alone while ignoring feelings",
      ],
    },
  },
  "ko-KR": {
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
  },
};

const BRANCH_UPSET_NUANCE: Record<Locale, Record<string, string>> = {
  "en-US": {
    ja: "They may suddenly start talking faster, or jump to a conclusion on their own first.",
    chuk: "They look fine on the surface but build it up inside, then quietly change direction once they hit a limit.",
    in: "They tend to go for a walk alone or step away to sort things out.",
    myo: "They read the room a lot, and once hurt feelings build up, they quietly keep their distance.",
    jin: "They may feel the structure/roles need to be redone and stiffen up.",
    sa: "Frustration can make their words rougher, or they just want to wrap things up fast.",
    o: "They may talk more, and emotion can bleed into their work tone.",
    mi: "They get defensive and closed off, and need alone time.",
    sin: "One small detail can sour the mood, or they point things out sharply.",
    yu: "Their perfectionism spikes, and they get sensitive to tiny mistakes.",
    sul: "If they feel their territory was crossed, they draw a firm line.",
    hae: "They may avoid it, or bottle it up and burst all at once later.",
  },
  "ko-KR": {
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
  },
};

export const ELEMENT_OFFICE: Record<Locale, Record<string, string>> = {
  "en-US": {
    wood: "growth & pioneering",
    fire: "expression & speed",
    earth: "stability & execution",
    metal: "principle & precision",
    water: "analysis & flexibility",
  },
  "ko-KR": {
    wood: "성장·개척",
    fire: "표현·속도",
    earth: "안정·실무",
    metal: "원칙·정밀",
    water: "분석·유연",
  },
};

/**
 * 월지 십성 × 조후(한조/난조) 매트릭스 — 마스터 사양서 Part2① 표 그대로.
 * neutral=기본 캐릭터, hot=난조(화·토 과다), cold=한조(수·금 과다).
 */
type CategoryTitleByClimate = Record<
  TenGodCategory,
  { neutral: string; hot: string; cold: string }
>;

const CATEGORY_TITLE: Record<Locale, CategoryTitleByClimate> = {
  "en-US": {
    관성: {
      neutral: "Process-Guardian PM",
      hot: "Speed-First Risk Manager",
      cold: "The Careful Process Guardian",
    },
    재성: {
      neutral: "Results-Driven CFO",
      hot: "Energetic Target Crusher",
      cold: "The Data-Driven Realist",
    },
    식상: {
      neutral: "Problem Solver",
      hot: "Rapid-Fire Problem Solver",
      cold: "Deep-Dive Strategy Researcher",
    },
    인성: {
      neutral: "Strategic Planner",
      hot: "On-the-Ground Strategy Manager",
      cold: "The Meticulous Systems Researcher",
    },
    비겁: {
      neutral: "Independent Driver",
      hot: "Bold Frontline Charger",
      cold: "The Careful Solo Executor",
    },
  },
  "ko-KR": {
    관성: {
      neutral: "프로세스 지킴이 PM",
      hot: "스피드 중심의 리스크 관리자",
      cold: "신중한 프로세스 지킴이",
    },
    재성: {
      neutral: "성과 달성가 CFO",
      hot: "에너제틱한 타겟 달성가",
      cold: "데이터 기반의 실리주의자",
    },
    식상: {
      neutral: "문제 해결사",
      hot: "즉각적인 문제 해결사",
      cold: "심층 기획 및 전략 연구원",
    },
    인성: {
      neutral: "전략 기획자",
      hot: "현장형 전략 매니저",
      cold: "꼼꼼한 시스템 리서처",
    },
    비겁: {
      neutral: "독립적 추진가",
      hot: "과감한 돌격 대장",
      cold: "신중한 독자적 실행가",
    },
  },
};

const STEM_WORK_STYLE: Record<Locale, Record<string, string>> = {
  "en-US": {
    gap: "Draws the big picture first, then pushes boldly once the direction is right.",
    eul: "Coordinates delicately, tuning the flow of work to people's rhythm.",
    byeong: "Judges fast and intuitively, and lifts the team once energy builds.",
    jeong: "Builds trust through warm persuasion and steady follow-through.",
    mu: "Holds the center and keeps to their standard even when things wobble.",
    gi: "Strong on hands-on detail, proves it with visible results.",
    gyeong: "Values principle and efficiency, cuts sharply to the core point.",
    sin: "Chases precision and polish, finds it hard to tolerate dropped quality.",
    im: "Reads context and adapts flexibly, and strategy comes alive once information gathers.",
    gye: "Thinks deeply before moving, and avoids jumping to conclusions.",
  },
  "ko-KR": {
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
  },
};

const BRANCH_CRISIS_STYLE: Record<Locale, Record<string, string>> = {
  "en-US": {
    ja: "In a crisis they don't stay silent — they move fast to change the board.",
    chuk: "They endure on sheer stamina, then quietly change direction once they hit a limit.",
    in: "They look for a new path, tending to move first, alone.",
    myo: "They read signals sensitively, and are quick to distance themselves if the mood turns awkward.",
    jin: "They take on big change and try to rebuild the structure.",
    sa: "Under pressure they speed up and want to reach a conclusion fast.",
    o: "As they heat up they talk more, and emotion can bleed into work.",
    mi: "When hurt they get defensive, and need time alone to sort things out.",
    sin: "They react sharply, and call it out immediately if a standard slips.",
    yu: "Their perfectionism spikes, and one small detail can sour the mood.",
    sul: "Their sense of responsibility surges, and they draw a firm line if their territory is crossed.",
    hae: "As emotion deepens they may avoid it, or bottle it up and burst all at once later.",
  },
  "ko-KR": {
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
    sul: "책임감이 강하게 올라오고, 내 영역이 침범당하면 단호해집니다.",
    hae: "감정이 깊어지면 회피하거나, 뒤늦게 한꺼번에 터뜨릴 수 있어요.",
  },
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

export function dominantElement(chart: ChartContext): string {
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

/**
 * 캐릭터 타입 결정에 쓰는 대표 범주 — sajuMaster(PersonCore 격국)가 있으면
 * 그걸 SSOT로 쓰고, 없으면 레거시 raw-count 방식으로 폴백.
 */
export function resolveWorkCategory(
  counts: Record<string, number>,
  workSignals?: WorkSajuSignals,
): TenGodCategory {
  if (workSignals) {
    return GEOKGUK_TO_LOCAL_CATEGORY[workSignals.month_geokguk.month_stem_category];
  }
  return dominantCategory(counts);
}

function hipTitle(
  category: TenGodCategory,
  element: string,
  locale: Locale,
  temperatureBand: WorkSajuSignals["johu_profile"]["temperature_band"] = "neutral",
): string {
  const titles = CATEGORY_TITLE[locale][category];
  const el = ELEMENT_OFFICE[locale][element] ?? "";
  const pickedTitle = titles[temperatureBand];
  return el ? `${pickedTitle} · ${el} DNA` : pickedTitle;
}

export function buildOfficeDnaProfile(
  sajuJson: SajuDataForIntegrated,
  tenGodCounts: Record<string, number>,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
  workSignals?: WorkSajuSignals,
): OfficeDnaProfile {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const element = dominantElement(chart);
  const category = resolveWorkCategory(tenGodCounts, workSignals);
  const temperatureBand = workSignals?.johu_profile.temperature_band ?? "neutral";

  const stemRef = REF_HEAVENLY_STEMS.find((r) => r.code === chart.dayStemCode);
  const branchRef = REF_EARTHLY_BRANCHES.find(
    (r) => r.code === chart.dayBranchCode,
  );

  const workStyle =
    STEM_WORK_STYLE[locale][chart.dayStemCode] ??
    pick(
      locale,
      `${stemRef?.kor_name ?? "my"} temperament — focus surges once the direction is right.`,
      `${stemRef?.kor_name ?? "나"} 기질 — 방향이 맞을 때 집중력이 폭발하는 타입이에요.`,
    );

  const innerStandard =
    BRANCH_CRISIS_STYLE[locale][chart.dayBranchCode] ??
    pick(
      locale,
      `${branchRef?.kor_name ?? "my"} rhythm — in a crisis, the standard I hold to becomes clear.`,
      `${branchRef?.kor_name ?? "내"} 리듬 — 위기 때 내가 지키려는 기준이 분명해집니다.`,
    );

  const elLabel = ELEMENT_OFFICE[locale][element] ?? pick(locale, "balance", "균형");
  const categoryPhrase = pick(
    locale,
    category === "재성"
      ? "money, resources, and results"
      : category === "관성"
        ? "accountability, management, and drive"
        : category === "식상"
          ? "ideas, expression, and output"
          : category === "인성"
            ? "learning, organizing, and support"
            : "teamwork, execution, and being on the ground",
    category === "재성" ? "돈·자원·성과" : category === "관성" ? "책임·관리·추진" : category === "식상" ? "아이디어·표현·산출" : category === "인성" ? "학습·정리·지원" : "동료심·실행·현장",
  );
  const positionTitle = hipTitle(category, element, locale, temperatureBand).split(" · ")[0];
  const overall = sanitizeOfficeText(
    pick(
      locale,
      `${elLabel} energy stands out in the office. Strengths in ${categoryPhrase} come alive, and the '${positionTitle}' position fits well on a team.`,
      `오피스에서 ${elLabel} 에너지가 두드러져요. ${categoryPhrase} 쪽 강점이 살아나며, 팀에서 '${positionTitle}' 포지션이 잘 맞습니다.`,
    ),
  );

  return {
    character_title: hipTitle(category, element, locale, temperatureBand),
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

const DE_ESCALATION_CARDS: Record<
  Locale,
  Array<DeEscalationCard & { categories: TenGodCategory[]; elements: string[] }>
> = {
  "en-US": [
    {
      hashtag: "#OnePraiseFlipsTheSwitch",
      color: "red",
      title: "One Word of Recognition Is the Switch",
      detail:
        "They go into defense mode the moment they feel ignored. Don't put them down publicly — lead with 'we got this done thanks to you.'",
      categories: ["비겁"],
      elements: ["wood"],
    },
    {
      hashtag: "#FoodFixesEverything",
      color: "yellow",
      title: "A Meal, Coffee, or Snack Is the Peace Treaty",
      detail:
        "Even when emotions rise, a soft mood resolves things fast. Skip the stiff meeting room — talk it out over something to eat.",
      categories: ["식상"],
      elements: ["fire"],
    },
    {
      hashtag: "#GiveItTime",
      color: "orange",
      title: "Demanding an Instant Answer Is the Poison",
      detail:
        "Pushing for a conclusion right away only makes them more rigid. 'Let's pick this up tomorrow' is the best antidote.",
      categories: ["인성"],
      elements: ["earth"],
    },
    {
      hashtag: "#SayItDirectlyOrItBlowsUp",
      color: "blue",
      title: "Talking Around It Backfires",
      detail:
        "They hate having to guess. State the core point politely but directly, and skip the hidden messages.",
      categories: ["관성"],
      elements: ["metal"],
    },
    {
      hashtag: "#ActionsBeatApologies",
      color: "green",
      title: "Results and Repayment Beat Words",
      detail:
        "An emotional apology alone isn't enough. A real fix — 'here's how I'll make up for it' — plus covering the loss gets you past it fast.",
      categories: ["재성"],
      elements: ["water"],
    },
  ],
  "ko-KR": [
    {
      hashtag: "#인정받으면_풀려요",
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
  ],
};

export function pickDeEscalationCard(
  tenGodsA: Record<string, number>,
  tenGodsB: Record<string, number>,
  chartA: ChartContext,
  chartB: ChartContext,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
  workSignalsA?: WorkSajuSignals,
  workSignalsB?: WorkSajuSignals,
): DeEscalationCard {
  const catA = resolveWorkCategory(tenGodsA, workSignalsA);
  const catB = resolveWorkCategory(tenGodsB, workSignalsB);
  const elA = dominantElement(chartA);
  const elB = dominantElement(chartB);

  const cards = DE_ESCALATION_CARDS[locale];
  let best = cards[0]!;
  let bestScore = -1;

  for (const card of cards) {
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
  locale: Locale = LEGACY_FALLBACK_LOCALE,
  workSignals?: WorkSajuSignals,
): string {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const category = resolveWorkCategory(tenGodCounts, workSignals);
  const persona =
    STEM_OFFICE_PERSONA[locale][chart.dayStemCode] ??
    pick(locale, "a collaborator whose focus rises once the direction is right", "방향이 맞을 때 집중력이 올라가는 협업형");
  const deptHint =
    CATEGORY_IDEAL_FIT[locale][category].roles[0] ?? pick(locale, "team execution", "팀 실행");
  return sanitizeOfficeText(
    pick(
      locale,
      `${persona}. Their strengths show clearly in ${deptHint}-type work.`,
      `${persona}. ${deptHint} 쪽 업무에서 강점이 잘 드러나요.`,
    ),
  );
}

export function buildOfficeMeetingSummary(
  comm: WorkStemCommunicationAnalysis,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
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
      pick(
        locale,
        "In meetings, one side wants a fast conclusion while the other wants a careful review, which can clash easily. Splitting the agenda, or setting an order like 'direction today, details tomorrow,' makes it easier.",
        "회의에서 한쪽은 빠른 결론, 다른 쪽은 꼼꼼한 검토를 원해 부딪히기 쉬워요. 안건을 나누거나 '오늘은 방향만 / 내일은 디테일'처럼 순서를 정하면 편해요.",
      ),
    );
  }
  if (topPositive.some((p) => p.type === "천간합")) {
    return sanitizeOfficeText(
      pick(
        locale,
        "Your directions naturally align in meetings. This is a combination where you can quickly trust each other's judgment.",
        "회의에서 방향이 자연스럽게 맞는 편이에요. 서로의 판단을 빠르게 신뢰할 수 있는 조합입니다.",
      ),
    );
  }
  if (topPositive.some((p) => p.type === "상생")) {
    return sanitizeOfficeText(
      pick(
        locale,
        "In meetings, what each of you says tends to energize the other's work. When ideas flow back and forth, the synergy grows.",
        "회의할 때 서로의 말이 업무 에너지를 살려 주는 편이에요. 아이디어가 오가면 시너지가 커집니다.",
      ),
    );
  }
  return sanitizeOfficeText(
    pick(
      locale,
      "There are differences in meeting style, but agreeing on the agenda and roles ahead of time is enough to align well.",
      "회의 스타일 차이는 있지만, 안건·역할만 미리 정하면 충분히 맞출 수 있어요.",
    ),
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
  locale: Locale = LEGACY_FALLBACK_LOCALE,
  workSignals?: WorkSajuSignals,
): OfficeUpsetGuide {
  const pillars = sajuJsonToPillars(
    sajuJson.saju as Required<NonNullable<typeof sajuJson.saju>>,
  );
  const chart = buildChartContext(pillars);
  const category = resolveWorkCategory(tenGodCounts, workSignals);
  const base = UPSET_RESPONSE_BY_CATEGORY[locale][category];
  const branchNuance = BRANCH_UPSET_NUANCE[locale][chart.dayBranchCode] ?? "";

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

/**
 * 신살(귀인) 보강 문장 — PersonCore가 이미 계산해 둔 문창귀인/장성살/천을귀인 신호
 * (`WorkSajuSignals.literary_noble`, `lib/personCore/sajuSignals/extractWorkSignals.ts`)를
 * 이상적 역할 "why" 텍스트에 반영한다. 이전에는 이 신호가 계산만 되고 어디에도
 * 쓰이지 않았음(리포트 lineage 감사에서 발견).
 * 우선순위: 장성살(리더십) > 천을귀인(귀인의 도움) > 문창귀인(학문·기획) —
 * 여러 개가 동시에 있어도 자연스러운 한 문장만 고른다(조합하지 않음).
 */
const NOBLE_STAR_BONUS: Record<
  Locale,
  { jangseong: string; cheoneul: string; munchang: string }
> = {
  "en-US": {
    jangseong:
      "On top of that, they carry the '장성살(General Star)' — leadership and management roles bring out even more of their strength.",
    cheoneul:
      "On top of that, they carry '천을귀인(Heaven's Noble)' — the luckiest star in saju — so they tend to draw in people who help them along the way.",
    munchang:
      "On top of that, they carry a scholarly noble star — research, planning, and documentation work is where this really shines.",
  },
  "ko-KR": {
    jangseong:
      "게다가 '장성살'까지 있어서, 팀을 이끄는 관리·리더십 자리에서 강점이 한층 배가돼요.",
    cheoneul:
      "게다가 사주에서 가장 좋은 길신인 '천을귀인'까지 있어서, 주변에서 도와주는 사람이 잘 붙는 편이에요.",
    munchang:
      "게다가 학문·글재주를 뜻하는 귀인까지 있어서, 리서치·기획·문서 작업 쪽에서 유독 빛을 발해요.",
  },
};

function resolveNobleBonus(
  noble:
    | {
        has_munchang_guin: boolean;
        has_jangseong_sal: boolean;
        has_cheoneul_guin: boolean;
      }
    | undefined,
  locale: Locale,
): string | null {
  if (!noble) return null;
  const t = NOBLE_STAR_BONUS[locale];
  if (noble.has_jangseong_sal) return t.jangseong;
  if (noble.has_cheoneul_guin) return t.cheoneul;
  if (noble.has_munchang_guin) return t.munchang;
  return null;
}

export function buildIdealRoleFit(
  nickname: string,
  sajuJson: SajuDataForIntegrated,
  tenGodCounts: Record<string, number>,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
  workSignals?: WorkSajuSignals,
): OfficeIdealRoleFit {
  const category = resolveWorkCategory(tenGodCounts, workSignals);
  const fit = CATEGORY_IDEAL_FIT[locale][category];
  const dna = buildOfficeDnaProfile(sajuJson, tenGodCounts, locale, workSignals);
  const title = dna.character_title.split(" · ")[0] ?? pick(locale, "an executor", "실행형");
  const nobleBonus = resolveNobleBonus(workSignals?.literary_noble, locale);

  const baseWhy = pick(
    locale,
    `${nickname} has a ${title} temperament, so their strengths shine in roles like ${fit.departments[0]} · ${fit.roles[0]}.`,
    `${nickname}은(는) ${title} 기질이라 ${fit.departments[0]}·${fit.roles[0]} 같은 자리에서 역량이 잘 드러나요.`,
  );

  return {
    nickname,
    ideal_roles: fit.roles.slice(0, 4),
    ideal_departments: fit.departments.slice(0, 3),
    why: sanitizeOfficeText(nobleBonus ? `${baseWhy} ${nobleBonus}` : baseWhy),
  };
}

export function buildPairIdealRoleCombo(
  nicknameA: string,
  nicknameB: string,
  fitA: OfficeIdealRoleFit,
  fitB: OfficeIdealRoleFit,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  return sanitizeOfficeText(
    pick(
      locale,
      `When working together, the team runs best if ${nicknameA} takes ${fitA.ideal_roles[0]} and ${nicknameB} takes ${fitB.ideal_roles[0]}. The ${fitA.ideal_departments[0]} × ${fitB.ideal_departments[0]} combination fits especially well.`,
      `함께 일할 때는 ${nicknameA}가 ${fitA.ideal_roles[0]} 쪽, ${nicknameB}가 ${fitB.ideal_roles[0]} 쪽으로 역할을 나누면 팀이 가장 잘 돌아갑니다. ` +
        `${fitA.ideal_departments[0]} × ${fitB.ideal_departments[0]} 조합이 특히 잘 맞아요.`,
    ),
  );
}

export type LeadershipRoleSplit = {
  external_lead: "a" | "b" | "balanced";
  internal_qa_lead: "a" | "b" | "balanced";
  summary: string;
};

/**
 * 업무 주도권 및 공적 공로 배분 — 마스터 사양서 Part3②.
 * 사양서는 "천간 관성/비겁 투간(대외 발표 리더) vs 지지 인성/정재(실무 검수
 * 리더)"로 나누는데, 지지(지장간) 기준 집계는 아직 없어서 이번엔 이미 계산돼
 * 있는 스템 기준 십성 카운트만으로 간이 근사한다: (관성+비겁)이 상대적으로
 * 높은 쪽 = 대외 리더, (인성+재성)이 높은 쪽 = 실무 검수 리더. 2인 구도라
 * 한쪽을 정하면 나머지 역할은 자동으로 상대에게 배정한다(역할 안 겹치게).
 */
export function resolveLeadershipRoleSplit(
  workSignalsA: WorkSajuSignals | undefined,
  workSignalsB: WorkSajuSignals | undefined,
  nicknameA: string,
  nicknameB: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): LeadershipRoleSplit | null {
  if (!workSignalsA || !workSignalsB) return null;

  const externalScore = (s: WorkSajuSignals) =>
    s.drive_stubborn.officer_count + s.drive_stubborn.self_count;
  const extA = externalScore(workSignalsA);
  const extB = externalScore(workSignalsB);
  const diff = extA - extB;

  if (diff === 0) {
    return {
      external_lead: "balanced",
      internal_qa_lead: "balanced",
      summary: sanitizeOfficeText(
        pick(
          locale,
          `${nicknameA} and ${nicknameB} are evenly matched on presenting vs. reviewing — decide case by case rather than fixing roles.`,
          `${nicknameA}와 ${nicknameB}는 대외 발표·실무 검수 성향이 비슷해요. 역할을 고정하기보다 상황에 따라 나누는 게 좋아요.`,
        ),
      ),
    };
  }

  const externalLead = diff > 0 ? "a" : "b";
  const internalQaLead = diff > 0 ? "b" : "a";
  const externalName = diff > 0 ? nicknameA : nicknameB;
  const internalName = diff > 0 ? nicknameB : nicknameA;

  return {
    external_lead: externalLead,
    internal_qa_lead: internalQaLead,
    summary: sanitizeOfficeText(
      pick(
        locale,
        `${externalName} fits presenting and reporting externally, while ${internalName} is stronger at internal review and quality control — split it officially instead of both trying to do everything.`,
        `${externalName}는 대외 발표·리포팅 쪽이 잘 맞고, ${internalName}는 실무 검수·품질 관리 쪽이 강해요. 둘 다 다 하려 하지 말고 역할을 공식적으로 나눠보세요.`,
      ),
    ),
  };
}
