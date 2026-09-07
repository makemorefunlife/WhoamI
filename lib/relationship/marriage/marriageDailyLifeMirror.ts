import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./marriageCopy";

/**
 * "일상 모습" (Daily Life Mirror) — Part 1.5, right after origin_story.
 *
 * Deterministic-only content (decision 033): 10 day-stem codes × charm,
 * 12 day-branch codes × spouse-palace trait, 12 day-branch codes × marital
 * authority style. No LLM — every sentence is a straight table lookup keyed
 * by each person's own day stem/day branch (`ChartContext.dayStemCode` /
 * `.dayBranchCode`), so there is nothing to hallucinate or invent.
 *
 * 배우자 특징(spouseTrait) is read via the traditional 배우자궁(day-branch =
 * spouse palace) convention: MY day branch describes what MY chart shows
 * about MY spouse, not a description of my own appearance. authority is the
 * opposite direction — it's a self-trait (my day branch → my own
 * decision-making style).
 *
 * "배우자 직업" table was scoped out (decision 033 — thematic mismatch).
 * The fusing of these 3 facts into one flowing "A가 B를 딸처럼 챙겨주고..."
 * style scene (as sketched in planning) is deferred — that requires an
 * interpretive combination layer (Part04 story-planner pattern), not a
 * table lookup. This first pass renders the 3 facts as clearly labeled,
 * grounded sub-paragraphs instead.
 */

export type DailyLifeMirrorFact = { label: string; description: string };

const DAY_STEM_CHARM_KO: Record<string, DailyLifeMirrorFact> = {
  gap: { label: "당당한 중심", description: "반듯한 태도와 당당함이 믿음을 주고 자연스럽게 사람을 이끌어요." },
  eul: { label: "잔잔한 끌림", description: "부드럽게 스며들어 어느새 마음을 끌어당기는 힘이 있어요." },
  byeong: { label: "빛나는 존재감", description: "애써 돋보이려 하지 않아도 자연스럽게 시선의 중심이 돼요." },
  jeong: { label: "은근한 설렘", description: "따뜻한 분위기에 은은한 관능미가 더해져 알아갈수록 더 끌려요." },
  mu: { label: "묵직한 신뢰", description: "곁에 있다는 것만으로도 마음이 놓이는 든든함이 있어요." },
  gi: { label: "익숙한 온기", description: "처음 마주한 사이에도 오래 알고 지낸 듯한 편안함을 건네요." },
  gyeong: { label: "서늘한 카리스마", description: "서늘하고 단단한 분위기에 시선이 붙들리는 강렬한 매력이 있어요." },
  sin: { label: "정돈된 세련미", description: "군더더기 없이 깔끔한 분위기에서 고급스러움이 느껴져 눈길이 가요." },
  im: { label: "자유로운 반전", description: "틀에 머물지 않는 자유로움이 있어 다음 모습이 자꾸 궁금해져요." },
  gye: { label: "신비로운 여백", description: "한 번에 다 읽히지 않는 분위기가 더 가까이 알고 싶게 만들어요." },
};

const DAY_STEM_CHARM_EN: Record<string, DailyLifeMirrorFact> = {
  gap: { label: "Presence", description: "Steady and upright — the kind of person others naturally trust and follow." },
  eul: { label: "Quiet Pull", description: "Soft on the surface, but there's a subtle magnetism that keeps drawing people in." },
  byeong: { label: "Radiance", description: "Eyes go to them even when they're doing nothing — natural star power." },
  jeong: { label: "Warm Glow", description: "A warm, quietly smoldering charm that grows on you the more you look." },
  mu: { label: "Steadiness", description: "An oddly reassuring solidity — being near them just feels safe." },
  gi: { label: "Ease", description: "Makes you feel like you've known them for years, even on the first meeting." },
  gyeong: { label: "Charisma", description: "A cool, unshakeable presence that pulls people in hard." },
  sin: { label: "Polish", description: "A clean, refined air that catches the eye without trying." },
  im: { label: "Freedom", description: "Unpredictable in a way that keeps you endlessly curious where they'll go next." },
  gye: { label: "Mystery", description: "Never shows everything at once — you keep wanting to know more." },
};

const DAY_BRANCH_SPOUSE_TRAIT_KO: Record<string, DailyLifeMirrorFact> = {
  ja: { label: "앳되고 총명한 인상", description: "눈치 있게 상황을 읽고 움직여요. 돈을 다루고 불리는 감각도 있어요." },
  chuk: { label: "든든한 체격", description: "말수는 적어도 맡은 일은 성실하게 해내요. 직업에서도 안정성을 중요하게 봐요." },
  in: { label: "힘 있는 얼굴선", description: "결심한 일은 힘 있게 밀고 나가요. 자기 분야에서 입지를 다져가는 편이에요." },
  myo: { label: "단정한 생김새", description: "세심하고 다정하게 사람을 대해요. 센스가 있어 주변과도 잘 어울려요." },
  jin: { label: "시선을 잡는 외모", description: "이루고 싶은 목표가 커요. 사회적으로 성과를 내고 인정받으려는 마음도 강해요." },
  sa: { label: "자꾸 보게 되는 외모", description: "상황을 빠르게 이해하고 핵심을 짚어요. 일을 풀어가는 요령도 좋은 편이에요." },
  o: { label: "밝고 화사한 인상", description: "생각과 마음을 적극적으로 드러내요. 이기고 싶은 마음과 밀고 나가는 힘이 함께 있어요." },
  mi: { label: "온화한 인상", description: "다른 사람의 사정을 헤아리는 배려가 있어요. 가족과 현실적인 생활도 두루 챙겨요." },
  sin: { label: "날렵한 세련미", description: "영리한 감각으로 자기 능력을 보여줘요. 전문성과 실력을 바탕으로 인정받는 편이에요." },
  yu: { label: "선명한 이목구비", description: "깔끔함을 중시하고 작은 차이에도 민감해요. 자기관리와 돈 관리도 꼼꼼하게 해요." },
  sul: { label: "신뢰가 가는 인상", description: "인연을 소중히 여기고 맡은 일에 책임을 다해요. 쉽게 떠나기보다 오래 자리를 지켜요." },
  hae: { label: "순하고 편안한 얼굴", description: "사람의 마음을 섬세하게 느끼고 공감해요. 곁에 좋은 인연이 모여드는 편이에요." },
};

const DAY_BRANCH_SPOUSE_TRAIT_EN: Record<string, DailyLifeMirrorFact> = {
  ja: { label: "Youthful, sharp-eyed", description: "Quick to read a room, with a good sense for money." },
  chuk: { label: "Solidly built, steady", description: "Quiet and dependable, drawn to stable work." },
  in: { label: "Strong, defined features", description: "Driven, and already carving out their own turf." },
  myo: { label: "Neat, put-together", description: "Thoughtful and easy to be around, good with people." },
  jin: { label: "A striking presence", description: "Ambitious, with a real hunger for social achievement." },
  sa: { label: "Quietly magnetic", description: "Sharp-minded and genuinely good at getting things done." },
  o: { label: "Bright, vivid presence", description: "Expressive, competitive, and quick to take the lead." },
  mi: { label: "A gentle presence", description: "Caring, and good at holding both home and real life together." },
  sin: { label: "Polished, quick-moving", description: "Sharp, and recognized for real expertise." },
  yu: { label: "Clean, striking features", description: "Meticulous and careful with both self-care and money." },
  sul: { label: "A dependable presence", description: "Loyal and responsible — the type who sticks it out." },
  hae: { label: "Easygoing, gentle", description: "Empathetic, and the type people naturally gravitate to." },
};

const DAY_BRANCH_AUTHORITY_KO: Record<string, DailyLifeMirrorFact> = {
  ja: { label: "조용한 주도형", description: "겉으로는 상대에게 맞춰도 원하는 방향은 놓치지 않아요. 중요한 선택에는 은근히 내 뜻을 실어요." },
  chuk: { label: "묵묵한 버팀형", description: "말로 다투기보다 한번 정한 입장을 지켜요. 결국 상대가 그 뜻에 맞추는 경우가 많아요." },
  in: { label: "앞장서는 리더형", description: "집이나 돈 문제부터 여행 계획까지 먼저 방향을 정해요. 배우자가 그 흐름에 함께하도록 이끄는 편이에요." },
  myo: { label: "분위기 주도형", description: "강하게 요구하기보다 말과 분위기를 활용해요. 상대의 선택을 자연스럽게 내가 바라는 쪽으로 이끌어요." },
  jin: { label: "큰 선택 주도형", description: "평소에는 상대에게 맡겨두기도 해요. 큰돈이나 집 문제처럼 가족의 중요한 선택에서는 직접 결정권을 잡아요." },
  sa: { label: "계산하는 실세형", description: "배우자의 의견은 들어보되 머릿속에서는 이미 계산을 마친 편이에요. 내 나름의 답을 정해두고 이야기를 나눠요." },
  o: { label: "마음 따라 직진형", description: "하고 싶은 게 뚜렷해서 먼저 움직여요. 배우자가 그 방향을 따라오는 경우가 많아요." },
  mi: { label: "생활 속 실세형", description: "평소에는 양보해도 생활과 가정의 일은 은근히 내 방식대로 돌아가게 하는 편이에요." },
  sin: { label: "실속 있는 협상형", description: "무작정 내 뜻을 밀기보다 조건을 하나씩 따져봐요. 그 안에서 나에게 유리한 합의점을 찾아요." },
  yu: { label: "기준 세우는 관리형", description: "돈과 생활에 분명한 기준을 세워요. 집안의 규칙을 정하면서 자연스럽게 흐름을 주도해요." },
  sul: { label: "책임지는 중심형", description: "결정만 내리기보다 그 결과까지 책임지려 해요. 중요한 순간에 중심을 맡는 편이에요." },
  hae: { label: "자유 지키는 독립형", description: "사소한 일은 각자에게 맡겨요. 다만 내 자유를 제한하려 하면 그때는 단호하게 선을 그어요." },
};

const DAY_BRANCH_AUTHORITY_EN: Record<string, DailyLifeMirrorFact> = {
  ja: { label: "Quiet Power", description: "Seems to go along with things on the surface, but the big decisions end up going the way they wanted anyway." },
  chuk: { label: "Win by Outlasting", description: "Rarely argues, but once they've decided something it doesn't change — so the other person ends up following." },
  in: { label: "The Chief", description: "Takes the lead on housing, money, even trips — and pulls their spouse along." },
  myo: { label: "Soft Steering", description: "Never pushes outright, but somehow moves people through words and mood alone." },
  jin: { label: "Final Say", description: "Hands most things over day-to-day, but takes the wheel on big money, housing, and family calls." },
  sa: { label: "Quiet Strategist", description: "Listens to their spouse's opinion, but has usually already run the numbers and decided the answer." },
  o: { label: "Straight Ahead", description: "Knows exactly what they want, so their spouse tends to end up following their lead." },
  mi: { label: "Yields, but Runs It", description: "Lets most things go, but quietly does it their own way on everyday household matters." },
  sin: { label: "The Negotiator", description: "Rather than pushing outright, weighs the terms and steers toward an outcome that works in their favor." },
  yu: { label: "The Manager", description: "Has clear standards for money, routines, even house rules — and naturally ends up holding the reins." },
  sul: { label: "The One Who Owns It", description: "Takes responsibility for what they decide, and holds steady when it counts." },
  hae: { label: "Live and Let Live", description: "Happy to let the small stuff slide, but won't budge an inch if their freedom is on the line." },
};

function tableForLocale(
  locale: Locale,
  ko: Record<string, DailyLifeMirrorFact>,
  en: Record<string, DailyLifeMirrorFact>,
): Record<string, DailyLifeMirrorFact> {
  return locale === "en-US" ? en : ko;
}

export function resolveDayStemCharm(stemCode: string, locale: Locale): DailyLifeMirrorFact | null {
  return tableForLocale(locale, DAY_STEM_CHARM_KO, DAY_STEM_CHARM_EN)[stemCode] ?? null;
}

export function resolveDayBranchSpouseTrait(branchCode: string, locale: Locale): DailyLifeMirrorFact | null {
  return tableForLocale(locale, DAY_BRANCH_SPOUSE_TRAIT_KO, DAY_BRANCH_SPOUSE_TRAIT_EN)[branchCode] ?? null;
}

export function resolveDayBranchAuthority(branchCode: string, locale: Locale): DailyLifeMirrorFact | null {
  return tableForLocale(locale, DAY_BRANCH_AUTHORITY_KO, DAY_BRANCH_AUTHORITY_EN)[branchCode] ?? null;
}

export type DailyLifeMirrorPersonFacts = {
  nickname: string;
  charm: DailyLifeMirrorFact | null;
  spouseTrait: DailyLifeMirrorFact | null;
  authority: DailyLifeMirrorFact | null;
};

export type DailyLifeMirrorSection = {
  intro: string;
  personA: DailyLifeMirrorPersonFacts;
  personB: DailyLifeMirrorPersonFacts;
};

/**
 * Builds the "일상 모습" section from each person's own day stem/branch —
 * pure table lookup, no synthesis across facts (see file header).
 * Returns null only if BOTH people are missing all 3 facts (nothing to show).
 */
export function buildMarriageDailyLifeMirrorSection(params: {
  nicknameA: string;
  nicknameB: string;
  dayStemCodeA: string;
  dayStemCodeB: string;
  dayBranchCodeA: string;
  dayBranchCodeB: string;
  locale?: Locale;
}): DailyLifeMirrorSection | null {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const personA: DailyLifeMirrorPersonFacts = {
    nickname: params.nicknameA,
    charm: resolveDayStemCharm(params.dayStemCodeA, locale),
    spouseTrait: resolveDayBranchSpouseTrait(params.dayBranchCodeA, locale),
    authority: resolveDayBranchAuthority(params.dayBranchCodeA, locale),
  };
  const personB: DailyLifeMirrorPersonFacts = {
    nickname: params.nicknameB,
    charm: resolveDayStemCharm(params.dayStemCodeB, locale),
    spouseTrait: resolveDayBranchSpouseTrait(params.dayBranchCodeB, locale),
    authority: resolveDayBranchAuthority(params.dayBranchCodeB, locale),
  };

  const hasAnyA = personA.charm || personA.spouseTrait || personA.authority;
  const hasAnyB = personB.charm || personB.spouseTrait || personB.authority;
  if (!hasAnyA && !hasAnyB) return null;

  const intro = pick(
    locale,
    ` Before the scores and charts, here's a quick, grounded snapshot of what draws people to each of you — and how each of you tends to lead at home.`,
    ` 점수와 그래프로 들어가기 전에, 두 분이 서로에게 어떤 인상으로 다가가고 결혼 후 어떤 방식으로 관계를 이끄는지부터 가볍게 짚어볼게요.`,
  );

  return { intro, personA, personB };
}
