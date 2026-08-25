import type { PsychMatchAxisResult } from "@/lib/relationship/psychMatch";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import { scoreLean, type DomainAxisMeta } from "./shared";
import type { DomainNarrativeCopy } from "./types";
import type { Locale } from "@/lib/i18n/locale";

type LeanCopy = Record<"even" | "a_high" | "b_high", DomainNarrativeCopy>;
type AxisCopySet = {
  tension: DomainNarrativeCopy;
  similarity: DomainNarrativeCopy;
  complementary: LeanCopy;
};

function c(hook: string, narrative: string): DomainNarrativeCopy {
  return { hook, narrative };
}

function resolveFromSet(
  row: PsychMatchAxisResult,
  set: AxisCopySet | undefined,
  meta: DomainAxisMeta,
  lean: ReturnType<typeof scoreLean>,
): DomainNarrativeCopy {
  if (!set) {
    if (row.match_type === "tension") {
      return c(
        `한 지붕 아래서 ${meta.topic}만큼은 자주 엇갈릴 수 있어요.`,
        `이 축은 격차가 커서, 말하지 않으면 오해가 쌓이기 쉬워요. ${meta.section_hint}을 함께 보면 좋아요.`,
      );
    }
    if (row.match_type === "similarity") {
      return c(
        `${meta.topic}에서는 둘이 꽤 비슷한 편이에요.`,
        "큰 설명 없이도 맞춰가기 쉬운 영역이에요.",
      );
    }
    return c(
      `${meta.topic}, 둘의 방식이 꽤 다른 편이에요.`,
      `역할을 나누면 ${meta.topic}이 훨씬 수월해져요. ${meta.section_hint}을 참고하세요.`,
    );
  }
  if (row.match_type === "tension") return set.tension;
  if (row.match_type === "similarity") return set.similarity;
  return set.complementary[lean];
}

export const COHABITATION_AXIS_COPY: Partial<
  Record<SecondaryAxisKey, AxisCopySet>
> = {
  conflict_style: {
    tension: c(
      "싸운 뒤 밤, 먼저 말 걸 사람이 없으면 집 안 공기가 얼어붙나요?",
      "둘 다 갈등·화해에서 '내 방식'이 맞다고 느끼기 쉬워요. 작은 불씨도 키우지 말고, 아래 「갈등 & 화해」에서 화해 루틴을 미리 정해 두는 게 좋아요.",
    ),
    similarity: c(
      "불편한 얘기도 비교적 빨리 꺼내는 편인가요, 둘 다?",
      "갈등을 미루지 않는 편이라, 쌓인 서운함이 덜해요. 다만 둘 다 직설적이면 말투만 부드럽게 조절하는 게 포인트예요.",
    ),
    complementary: {
      even: c(
        "싸운 뒤, 한 명은 바로 말하고 다른 한 명은 숙성시키나요?",
        "갈등을 다루는 속도가 달라요. '오늘 말할까, 내일 말할까'만 합의해도 밤싸움이 줄어요. 아래 「갈등 & 화해」을 같이 보세요.",
      ),
      a_high: c(
        "불편한 얘기, 먼저 꺼내는 쪽이 한 명 있나요?",
        "한쪽이 불을 먼저 끄고, 다른 쪽이 나중에 솔직해지는 패턴이 될 수 있어요. 먼저 말하는 사람·정리하는 사람 역할을 나눠 보세요.",
      ),
      b_high: c(
        "불편한 얘기, 먼저 꺼내는 쪽이 한 명 있나요?",
        "한쪽이 불을 먼저 끄고, 다른 쪽이 나중에 솔직해지는 패턴이 될 수 있어요. 먼저 말하는 사람·정리하는 사람 역할을 나눠 보세요.",
      ),
    },
  },
  practicality: {
    tension: c(
      "통장·생활비 얘기만 나오면 분위기가 급격히 무거워지나요?",
      "돈과 실리를 보는 기준이 꽤 달라요. 숫자 싸움이 감정 싸움이 되지 않게, 「돈과 집안일」의 역할 분담을 참고해 보세요.",
    ),
    similarity: c(
      "영수증·통장, 둘 다 챙기는 편인가요?",
      "돈·실리 감각이 비슷해서 생활비·저축 얘기가 수월해요. 「돈과 집안일」에서 역할만 나누면 더 편해져요.",
    ),
    complementary: {
      even: c(
        "장보기·통장 확인, 손이 더 빨리 가는 쪽이 한 명인가요?",
        "한쪽은 숫자·실리부터 보고, 다른 쪽은 분위기·여유를 먼저 챙기는 식으로 갈릴 수 있어요. 「돈과 집안일」에서 CFO 역할만 정해도 편해져요.",
      ),
      a_high: c(
        "생활비·저축, 더 꼼꼼히 챙기는 쪽이 있나요?",
        "한쪽이 영수증·통장부터 확인하고, 다른 쪽은 '괜찮아' 파이프일 수 있어요. 돈 얘기는 숫자 담당·분위기 담당으로 나누면 덜 싸워요.",
      ),
      b_high: c(
        "생활비·저축, 더 꼼꼼히 챙기는 쪽이 있나요?",
        "한쪽이 영수증·통장부터 확인하고, 다른 쪽은 '괜찮아' 파이프일 수 있어요. 돈 얘기는 숫자 담당·분위기 담당으로 나누면 덜 싸워요.",
      ),
    },
  },
  structure: {
    tension: c(
      "집안일은 '대충 오늘 하자' vs '표부터 짜자'로 갈리나요?",
      "루틴과 계획에 대한 기대가 달라서, 사소한 집안일도 서운함으로 번지기 쉬워요. 「돈과 집안일」과 함께 보면 덜 헷갈려요.",
    ),
    similarity: c(
      "집안일도 '언제 할지'부터 맞추는 편인가요?",
      "루틴·계획 스타일이 비슷해, 같이 살며 규칙을 맞추기 쉬운 조합이에요.",
    ),
    complementary: {
      even: c(
        "집안일은 '오늘 하자' vs '일정부터 짜자'로 갈리나요?",
        "한쪽은 유연하게, 다른 쪽은 표·루틴부터 잡으려 할 수 있어요. 청소·장보기 담당을 번갈아 정하면 서운함이 줄어요.",
      ),
      a_high: c(
        "집안일 표·체크리스트, 더 좋아하는 쪽이 있나요?",
        "계획형과 즉흥형이 한 집에 살면 '느슨해 보인다' vs '빡빡하다' 오해가 생기기 쉬워요. 「돈과 집안일」의 분담 가이드를 참고하세요.",
      ),
      b_high: c(
        "집안일 표·체크리스트, 더 좋아하는 쪽이 있나요?",
        "계획형과 즉흥형이 한 집에 살면 '느슨해 보인다' vs '빡빡하다' 오해가 생기기 쉬워요. 「돈과 집안일」의 분담 가이드를 참고하세요.",
      ),
    },
  },
  self_control: {
    tension: c(
      "한 명은 일찍 자고, 다른 한 명은 밤늦게까지 깨어 있나요?",
      "수면·생활 리듬 격차가 커서, 피곤한 날 작은 말투에도 예민해질 수 있어요. 「침실 케미스트리」에서 맞춰볼 포인트가 나와요.",
    ),
    similarity: c(
      "둘 다 밤늦게까지 버티는 편, 아니면 일찍 쉬는 편?",
      "생활 리듬이 비슷하면 침실·쉬는 시간에서 마찰이 적어요. 「침실 케미스트리」도 읽기 편해요.",
    ),
    complementary: {
      even: c(
        "밤 12시가 넘어도 한 명은 깨어 있고, 다른 한 명은 이미 쳐져 있나요?",
        "수면·자기관리 리듬이 달라 피곤한 날 말투가 거칠어지기 쉬워요. 「침실 케미스트리」에서 수면 핏을 확인해 보세요.",
      ),
      a_high: c(
        "일찍 자고 일찍 일어나는 쪽, 한 명 있나요?",
        "생활 리듬이 다른 만큼, '조용히 해' vs '왜 일찍 자' 갈등이 생길 수 있어요. 침실·취침 시간만 맞춰도 홈 리스크가 줄어요.",
      ),
      b_high: c(
        "일찍 자고 일찍 일어나는 쪽, 한 명 있나요?",
        "생활 리듬이 다른 만큼, '조용히 해' vs '왜 일찍 자' 갈등이 생길 수 있어요. 침실·취침 시간만 맞춰도 홈 리스크가 줄어요.",
      ),
    },
  },
  energy_style: {
    tension: c(
      "주말에 '집콕' vs '밖에 나가자'가 자주 충돌하나요?",
      "에너지를 충전하는 방식이 달라, 쉬는 날에도 서로 지칠 수 있어요. 「홈 라이프 DNA」에서 각자 배터리 타입을 확인해 보세요.",
    ),
    similarity: c(
      "주말에 둘 다 '나가자' vs '집이 좋다' 쪽이 비슷한가요?",
      "에너지 사용 패턴이 맞아, 휴일 계획에서 덜 싸워요.",
    ),
    complementary: {
      even: c(
        "주말에 '집이 최고' vs '나가야 숨 쉰다'가 갈리나요?",
        "에너지를 채우는 방식이 달라, 휴일 계획에서 자주 엇갈릴 수 있어요. 번갈아 '집콕 주'·'외출 주'만 정해도 싸움이 줄어요.",
      ),
      a_high: c(
        "사람 만나고 돌아다니는 쪽, 한 명 있나요?",
        "외향·내향 배터리가 다르면 '왜 안 나가' vs '왜 또 나가'가 반복되기 쉬워요. 「홈 라이프 DNA」에서 각자 충전 방식을 확인하세요.",
      ),
      b_high: c(
        "사람 만나고 돌아다니는 쪽, 한 명 있나요?",
        "외향·내향 배터리가 다르면 '왜 안 나가' vs '왜 또 나가'가 반복되기 쉬워요. 「홈 라이프 DNA」에서 각자 충전 방식을 확인하세요.",
      ),
    },
  },
  empathy: {
    tension: c(
      "시댁·처가 이야기만 나와도 집 분위기가 바뀌나요?",
      "감정을 읽고 맞추는 속도가 달라, '왜 몰라줘' 싸움이 생기기 쉬워요. 「가족 경계」에서 경계선을 같이 짜 보세요.",
    ),
    similarity: c(
      "상대 기분부터 읽는 편, 둘 다 그런가요?",
      "시댁·처가 이슈에서도 감정 공감이 빨라, '왜 이해 못 해' 싸움이 적은 편이에요. 「가족 경계」에서 경계만 정하면 돼요.",
    ),
    complementary: {
      even: c(
        "시댁 문자 왔을 때, 먼저 표정 읽는 쪽이 한 명인가요?",
        "한쪽은 분위기·감정부터, 다른 쪽은 사실·해결부터 잡으려 할 수 있어요. 시댁·처가 이야기는 '감정 담당·정리 담당'만 나눠도 덜 지쳐요.",
      ),
      a_high: c(
        "상대 기분부터 살피는 쪽, 한 명 있나요?",
        "감정 공감 속도가 달라 '왜 몰라줘' vs '그냥 해결하면 되잖아'가 생기기 쉬워요. 「가족 경계」에서 경계선을 같이 짜 보세요.",
      ),
      b_high: c(
        "상대 기분부터 살피는 쪽, 한 명 있나요?",
        "감정 공감 속도가 달라 '왜 몰라줘' vs '그냥 해결하면 되잖아'가 생기기 쉬워요. 「가족 경계」에서 경계선을 같이 짜 보세요.",
      ),
    },
  },
  thinking_style: {
    tension: c(
      "생활비·이사처럼 큰 결정에서 '숫자로 비교' vs '일단 느낌이 좋아서'로 부딪히나요?",
      "생각하는 방식 자체가 달라 같은 결정도 다르게 접근하려고 해요. 「돈과 집안일」에서 결정 방식을 미리 맞춰 두면 좋아요.",
    ),
    similarity: c(
      "둘 다 근거부터 따지거나, 둘 다 느낌으로 빠르게 정하는 편인가요?",
      "생각의 결이 비슷해서 큰 결정도 설명 없이 빨리 합의돼요.",
    ),
    complementary: {
      even: c(
        "근거·비교표부터 보는 쪽과 일단 끌리는 대로 정하는 쪽이 갈리나요?",
        "분석형이 근거를 채우고 직관형이 방향을 짚으면 이사·목돈 결정이 훨씬 빨라져요.",
      ),
      a_high: c(
        "숫자·근거를 더 꼼꼼히 챙기는 쪽이 있나요?",
        "분석 담당·직감 담당으로 나누면 큰 결정 앞에서 다투는 시간이 줄어요.",
      ),
      b_high: c(
        "숫자·근거를 더 꼼꼼히 챙기는 쪽이 있나요?",
        "분석 담당·직감 담당으로 나누면 큰 결정 앞에서 다투는 시간이 줄어요.",
      ),
    },
  },
};

export const COHABITATION_DOMAIN_AXES: Partial<
  Record<SecondaryAxisKey, DomainAxisMeta>
> = {
  conflict_style: {
    topic: "갈등·화해",
    section_hint: "아래 「갈등 & 화해」",
    section_key: "upset",
  },
  practicality: {
    topic: "돈·생활 실리",
    section_hint: "「돈과 집안일」",
    section_key: "money_chores",
  },
  structure: {
    topic: "집안 루틴",
    section_hint: "「돈과 집안일」",
    section_key: "money_chores",
  },
  self_control: {
    topic: "수면·생활 리듬",
    section_hint: "「침실 케미스트리」",
    section_key: "bedroom",
  },
  energy_style: {
    topic: "에너지·활동량",
    section_hint: "「홈 라이프 DNA」",
    section_key: "dna",
  },
  empathy: {
    topic: "시댁·경계",
    section_hint: "「가족 경계」",
    section_key: "family_boundary",
  },
  thinking_style: {
    topic: "사고방식",
    section_hint: "「돈과 집안일」",
    section_key: "money_chores",
  },
};

/**
 * English variant of COHABITATION_DOMAIN_AXES's `topic` field — the only
 * field of this table rendered on screen (RelationshipPsychMatchSection
 * shows `item.topic`; `section_hint`/`section_key` are not displayed, so
 * they're reused as-is from the Korean table).
 */
export const COHABITATION_DOMAIN_AXES_EN: Partial<
  Record<SecondaryAxisKey, DomainAxisMeta>
> = {
  conflict_style: { ...COHABITATION_DOMAIN_AXES.conflict_style!, topic: "Conflict & Making Up", section_hint: "the 「Conflict & Making Up」 section below" },
  practicality: { ...COHABITATION_DOMAIN_AXES.practicality!, topic: "Money & Practical Living", section_hint: "「Money & Chores」" },
  structure: { ...COHABITATION_DOMAIN_AXES.structure!, topic: "Household Routine", section_hint: "「Money & Chores」" },
  self_control: { ...COHABITATION_DOMAIN_AXES.self_control!, topic: "Sleep & Life Rhythm", section_hint: "「Bedroom Chemistry」" },
  energy_style: { ...COHABITATION_DOMAIN_AXES.energy_style!, topic: "Energy & Activity Level", section_hint: "「Home Life DNA」" },
  empathy: { ...COHABITATION_DOMAIN_AXES.empathy!, topic: "In-Laws & Boundaries", section_hint: "「Family Boundaries」" },
  thinking_style: { ...COHABITATION_DOMAIN_AXES.thinking_style!, topic: "Thinking Style", section_hint: "「Money & Chores」" },
};

export const COHABITATION_CHART_NOTE =
  "둘의 현재 모습을 11축으로 비교했어요.";

export const COHABITATION_CHART_NOTE_EN =
  "We laid out where you two are similar and where you differ right now, at a glance. (Same 11-axis survey standard as the romantic deep-dive.)";

export const COHABITATION_AXIS_COPY_EN: Partial<
  Record<SecondaryAxisKey, AxisCopySet>
> = {
  conflict_style: {
    tension: c(
      "The night after a fight, if no one speaks first, does the whole house go cold?",
      "You each tend to feel your own way of handling conflict/making up is the right one. Don't let small sparks grow — set a reconciliation routine ahead of time in 「Conflict & Making Up」 below.",
    ),
    similarity: c(
      "Do you both bring up uncomfortable topics fairly quickly?",
      "You don't put off conflict, so hurt feelings don't pile up. If you're both blunt, though, softening your tone is the one thing to watch.",
    ),
    complementary: {
      even: c(
        "After a fight, does one of you speak up right away while the other needs to sit with it?",
        "You handle conflict at different speeds. Just agreeing on 'do we talk today or tomorrow?' cuts down on late-night fights. Check 「Conflict & Making Up」 together.",
      ),
      a_high: c(
        "Is there one of you who's usually first to bring up something uncomfortable?",
        "One of you may put out the fire first while the other gets honest later. Try splitting into a first-speaker and a follow-up-cleaner role.",
      ),
      b_high: c(
        "Is there one of you who's usually first to bring up something uncomfortable?",
        "One of you may put out the fire first while the other gets honest later. Try splitting into a first-speaker and a follow-up-cleaner role.",
      ),
    },
  },
  practicality: {
    tension: c(
      "Does the mood turn heavy fast the moment the bank account or living expenses come up?",
      "Your standards for money and practicality differ quite a bit. Don't let a numbers fight become an emotional one — check the role split in 「Money & Chores」.",
    ),
    similarity: c(
      "Do you both stay on top of receipts and the bank account?",
      "Your sense for money and practicality matches, so expense/savings conversations go smoothly. Splitting roles in 「Money & Chores」 makes it even easier.",
    ),
    complementary: {
      even: c(
        "Is one of you quicker to check groceries or the bank balance?",
        "One of you may lead with numbers/practicality while the other leads with mood/ease. Just assigning a CFO role in 「Money & Chores」 helps.",
      ),
      a_high: c(
        "Is there one of you who's more meticulous about living expenses and savings?",
        "One of you may check receipts and the account first, while the other's the 'it's fine' pipeline. Splitting into a numbers role and a mood role cuts down on fights.",
      ),
      b_high: c(
        "Is there one of you who's more meticulous about living expenses and savings?",
        "One of you may check receipts and the account first, while the other's the 'it's fine' pipeline. Splitting into a numbers role and a mood role cuts down on fights.",
      ),
    },
  },
  structure: {
    tension: c(
      "Does chores split into 'let's just do it today, roughly' vs. 'let's build a schedule first'?",
      "A difference in expectations around routine and planning can turn even small chores into hurt feelings. Cross-reference this with 「Money & Chores」 to avoid confusion.",
    ),
    similarity: c(
      "Do you both like to line up 'when' to do chores together?",
      "Your routine/planning styles match, making this an easy combination to set house rules with.",
    ),
    complementary: {
      even: c(
        "Does chores split into 'let's do it today' vs. 'let's build a schedule first'?",
        "One of you may stay flexible while the other wants a chart/routine first. Rotating who's on cleaning/grocery duty cuts down on hurt feelings.",
      ),
      a_high: c(
        "Is there one of you who likes a chore chart/checklist more?",
        "When a planner type and a spontaneous type live together, 'too loose' vs. 'too rigid' misunderstandings can crop up. Check the division-of-labor guide in 「Money & Chores」.",
      ),
      b_high: c(
        "Is there one of you who likes a chore chart/checklist more?",
        "When a planner type and a spontaneous type live together, 'too loose' vs. 'too rigid' misunderstandings can crop up. Check the division-of-labor guide in 「Money & Chores」.",
      ),
    },
  },
  self_control: {
    tension: c(
      "Does one of you go to bed early while the other stays up late?",
      "A big gap in sleep/life rhythm can make even a small tone of voice sting more on tired days. 「Bedroom Chemistry」 has points worth aligning on.",
    ),
    similarity: c(
      "Are you both the type to stay up late, or both the type to rest early?",
      "A matching life rhythm means less friction around the bedroom and rest time. 「Bedroom Chemistry」 is an easy read too.",
    ),
    complementary: {
      even: c(
        "Past midnight, is one of you still awake while the other's already out?",
        "A gap in sleep/self-care rhythm can make your tone sharper on tired days. Check your sleep fit in 「Bedroom Chemistry」.",
      ),
      a_high: c(
        "Is there one of you who's early to bed, early to rise?",
        "With different life rhythms, a 'be quiet' vs. 'why are you sleeping so early' conflict can arise. Just aligning bedtime cuts down on home risk.",
      ),
      b_high: c(
        "Is there one of you who's early to bed, early to rise?",
        "With different life rhythms, a 'be quiet' vs. 'why are you sleeping so early' conflict can arise. Just aligning bedtime cuts down on home risk.",
      ),
    },
  },
  energy_style: {
    tension: c(
      "Does 'let's stay in' vs. 'let's go out' clash often on weekends?",
      "A difference in how you recharge can leave you both tired even on days off. Check each of your battery types in 「Home Life DNA」.",
    ),
    similarity: c(
      "On weekends, are you both similarly 'let's go out' or 'home is best'?",
      "Your energy-use patterns match, so you fight less over weekend plans.",
    ),
    complementary: {
      even: c(
        "Does 'home is the best' vs. 'I need to get out to breathe' clash on weekends?",
        "A difference in how you recharge can lead to frequent mismatches in weekend plans. Just designating a 'stay-in week' and 'going-out week' in turn cuts down on fights.",
      ),
      a_high: c(
        "Is there one of you who's out meeting people more often?",
        "A gap between extroverted and introverted batteries can repeat a 'why aren't you going out' vs. 'why are you going out again' pattern. Check how each of you recharges in 「Home Life DNA」.",
      ),
      b_high: c(
        "Is there one of you who's out meeting people more often?",
        "A gap between extroverted and introverted batteries can repeat a 'why aren't you going out' vs. 'why are you going out again' pattern. Check how each of you recharges in 「Home Life DNA」.",
      ),
    },
  },
  empathy: {
    tension: c(
      "Does the mood at home shift the moment in-laws come up?",
      "A difference in how fast you read and match each other's feelings can turn into a 'why don't you get it' fight. Draw the boundary lines together in 「Family Boundaries」.",
    ),
    similarity: c(
      "Do you both tend to read the other's mood first?",
      "Even on in-law issues, your emotional empathy syncs up fast, so 'why don't you understand' fights stay rare. Just set the boundaries in 「Family Boundaries」.",
    ),
    complementary: {
      even: c(
        "When a text comes in from the in-laws, is one of you quicker to read the room?",
        "One of you may lead with mood/emotion while the other leads with facts/solutions. Just splitting in-law conversations into an 'emotion' role and a 'sort-it-out' role eases the load.",
      ),
      a_high: c(
        "Is there one of you who checks the other's mood first?",
        "A gap in emotional-empathy speed can cause a 'why don't you get it' vs. 'just solve it already' clash. Draw the boundary lines together in 「Family Boundaries」.",
      ),
      b_high: c(
        "Is there one of you who checks the other's mood first?",
        "A gap in emotional-empathy speed can cause a 'why don't you get it' vs. 'just solve it already' clash. Draw the boundary lines together in 「Family Boundaries」.",
      ),
    },
  },
  thinking_style: {
    tension: c(
      "For big decisions like rent or moving, does it split into 'compare the numbers' vs. 'it just feels right'?",
      "You approach the same decision differently because you think differently. Agreeing on a decision style ahead of time in 「Money & Chores」 helps.",
    ),
    similarity: c(
      "Do you both want the evidence first, or do you both decide fast by feel?",
      "Your way of thinking lines up, so even big decisions get agreed on quickly without much explanation.",
    ),
    complementary: {
      even: c(
        "Does it split into leading with evidence/comparison charts vs. just going with what feels right?",
        "Moving or big-purchase decisions go much faster when the analytical type fills in the evidence and the intuitive type calls the direction.",
      ),
      a_high: c(
        "Is there one of you who's more thorough about numbers and evidence?",
        "Splitting into an analysis lead and a gut-feel lead cuts down on fights before big decisions.",
      ),
      b_high: c(
        "Is there one of you who's more thorough about numbers and evidence?",
        "Splitting into an analysis lead and a gut-feel lead cuts down on fights before big decisions.",
      ),
    },
  },
};

/**
 * `locale` defaults to Korean so every pre-existing caller that doesn't pass
 * it keeps rendering exactly as before.
 */
export function resolveCohabitationCopy(
  row: PsychMatchAxisResult,
  meta: DomainAxisMeta,
  locale: Locale = "ko-KR",
): DomainNarrativeCopy {
  const table = locale === "en-US" ? COHABITATION_AXIS_COPY_EN : COHABITATION_AXIS_COPY;
  return resolveFromSet(
    row,
    table[row.axis_key],
    meta,
    scoreLean(row.score_a, row.score_b),
  );
}
