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
  gap: { label: "존재감", description: "당당하고 반듯해서 믿고 따라가게 만드는 매력" },
  eul: { label: "은근함", description: "부드러운데 묘하게 사람을 끌어당기는 매력" },
  byeong: { label: "화려함", description: "가만히 있어도 시선이 먼저 가는 스타성" },
  jeong: { label: "분위기", description: "볼수록 빠져드는 따뜻하고 은근한 색기" },
  mu: { label: "안정감", description: "옆에 있으면 이상하게 믿음이 생기는 듬직함" },
  gi: { label: "편안함", description: "처음 만나도 오래 알던 사람처럼 만드는 친근함" },
  gyeong: { label: "카리스마", description: "차갑고 단단한 분위기에서 나오는 강한 끌림" },
  sin: { label: "세련미", description: "깔끔하고 고급스러운 분위기로 시선을 잡는 타입" },
  im: { label: "자유로움", description: "어디로 튈지 몰라 자꾸 궁금해지는 매력" },
  gye: { label: "신비로움", description: "속을 다 보여주지 않아 계속 알고 싶어지는 타입" },
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
  ja: { label: "동안·영리한 인상", description: "눈치가 빠르고 돈 굴리는 감각이 좋아요." },
  chuk: { label: "듬직한 체형", description: "과묵하고 성실하며, 안정적인 직업을 선호해요." },
  in: { label: "선 굵은 인상", description: "추진력이 강하고 자기 분야에서 자리를 잡는 타입이에요." },
  myo: { label: "깔끔한 외모", description: "섬세하고 다정하며, 센스와 인간관계가 좋아요." },
  jin: { label: "존재감 강한 외모", description: "야망이 있고 사회적 성취욕이 강해요." },
  sa: { label: "묘하게 끌리는 외모", description: "머리 회전이 빠르고 일머리가 좋아요." },
  o: { label: "화려하고 밝은 인상", description: "표현이 적극적이고 승부욕·추진력이 강해요." },
  mi: { label: "부드러운 인상", description: "배려심이 많고 가정과 현실을 둘 다 잘 챙겨요." },
  sin: { label: "세련되고 날렵한 인상", description: "영리하고, 전문성·능력으로 인정받는 타입이에요." },
  yu: { label: "이목구비 또렷", description: "깔끔하고 예민하며, 자기관리·경제관념이 철저해요." },
  sul: { label: "믿음직한 인상", description: "의리와 책임감이 강하고, 한 자리를 오래 지키는 타입이에요." },
  hae: { label: "순하고 편안한 인상", description: "감수성·공감력이 좋고, 사람 복이 따르는 타입이에요." },
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
  ja: { label: "은근 실세형", description: "겉으로 맞춰주는 척하면서 중요한 결정은 결국 원하는 방향으로 가요." },
  chuk: { label: "버티기 승리형", description: "말싸움은 안 해도 한번 정한 건 안 바꿔서, 결국 상대가 따라오게 돼요." },
  in: { label: "대장형", description: "집·돈·여행까지 먼저 결정하고 배우자를 끌고 가는 편이에요." },
  myo: { label: "부드러운 조종형", description: "강요는 안 하는데, 말과 분위기로 자연스럽게 상대를 움직여요." },
  jin: { label: "최종결정형", description: "평소엔 맡겨도 큰돈·집·가족 문제에서는 결정권을 잡아요." },
  sa: { label: "두뇌 실세형", description: "배우자 의견도 듣지만, 결국 계산 끝내고 답을 정해놓는 편이에요." },
  o: { label: "직진 주도형", description: "하고 싶은 게 분명해서 배우자가 따라오는 경우가 많아요." },
  mi: { label: "맞춰주는 실세형", description: "평소엔 져주지만, 생활·가정 문제에서는 은근 자기 방식대로 해요." },
  sin: { label: "협상형", description: "무조건 밀어붙이기보다 조건을 따져서 유리한 합의점을 만들어요." },
  yu: { label: "관리자형", description: "돈·생활·집안 규칙까지 기준이 확실해서 자연스럽게 주도권을 잡아요." },
  sul: { label: "책임자형", description: "결정한 만큼 책임도 지려 해서, 중요한 순간에 중심을 잡아요." },
  hae: { label: "자유방임형", description: "사소한 건 서로 알아서 하되, 내 자유를 건드리면 절대 물러나지 않아요." },
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
