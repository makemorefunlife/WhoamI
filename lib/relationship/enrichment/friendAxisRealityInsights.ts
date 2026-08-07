import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SecondaryAxisKey } from "@/lib/v2/survey/types";
import { buildPsychMatchFromMasters, psychHasSurvey } from "@/lib/relationship/psychDomainLens/shared";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";

/**
 * current_enriched 전용 — 11축(psychMaster.secondary_axes) 차이를 친구 관계의
 * 현실 장면으로 풀어내는 문장 생성기.
 *
 * 05B Gap Review가 요청한 8개 실생활 주제를 11축 중 가장 근접한 축에 매핑하고,
 * `축 차이 → 현실 상황/기대 차이 → 생길 오해·서운함 → 짧은 조정법` 구조의
 * 한 단락짜리 문장으로 조립한다. 고정 문구가 아니라 실제 두 사람의 psychMaster
 * 점수(score_a vs score_b, gap 기반 match_type)에 따라 매번 다르게 생성된다.
 *
 * 결과는 buildFriendReportEnriched.ts가 기존 섹션(compare_table 행의 psych_note,
 * hidden_flow, de_escalation)에 얹는다 — 새 섹션을 만들지 않는다. production
 * `current`(buildFriendReport.ts)는 이 파일을 import하지 않는다.
 */

export type FriendAxisRealityTopicId =
  | "contact_frequency"
  | "reply_speed"
  | "empathy_vs_solution"
  | "plan_vs_spontaneous"
  | "duo_vs_group"
  | "speak_up_vs_hold"
  | "reassurance_vs_trust"
  | "reconciliation_speed";

export type FriendAxisRealityInsights = Record<FriendAxisRealityTopicId, string>;

type TopicCopy = {
  id: FriendAxisRealityTopicId;
  axis: SecondaryAxisKey;
  diffKo: (nameHigh: string, nameLow: string) => string;
  diffEn: (nameHigh: string, nameLow: string) => string;
  sameKo: string;
  sameEn: string;
};

const TOPICS: TopicCopy[] = [
  {
    id: "contact_frequency",
    axis: "energy_style",
    diffKo: (hi, lo) =>
      `약속은 "자주 만나자"는 ${hi}과(와) "가끔 깊게 만나자"는 ${lo}으로(로) 갈리는 편이에요. 만남·연락 빈도에 대한 기본 기대치가 달라서, ${lo}의 뜸한 연락을 ${hi}이(가) 애정이 식었다고 오해하기 쉬워요. 연락 빈도를 애정의 크기로 재지 말고 "생각날 때 편하게 답장해도 괜찮다"는 무언의 합의만 해두면 서운함이 줄어들어요.`,
    diffEn: (hi, lo) =>
      `Plans tend to split into "let's meet often" from ${hi} and "let's meet occasionally but go deep" from ${lo}. Your baseline expectation for contact frequency differs, so ${hi} can easily read ${lo}'s quieter stretches as fading interest. Instead of measuring affection by contact frequency, a quiet agreement that "reply whenever it's comfortable" keeps this from turning into hurt feelings.`,
    sameKo:
      "둘 다 연락·만남 텐션이 비슷한 편이라 '왜 답장이 없지' 같은 서운함이 잘 안 생겨요. 지금의 연락 리듬을 그대로 유지하면 충분해요.",
    sameEn:
      "Your contact and hangout rhythm matches, so 'why haven't they replied' rarely comes up. Keeping your current rhythm as-is is enough.",
  },
  {
    id: "reply_speed",
    axis: "decision_style",
    diffKo: (hi, lo) =>
      `메시지에 ${hi}은(는) 바로바로 답하는 편이고, ${lo}은(는) 생각을 정리한 뒤 천천히 답하는 편이에요. 답장 속도의 기본값이 달라서, ${hi}은(는) ${lo}의 늦은 답장을 무관심으로, ${lo}은(는) ${hi}의 빠른 재촉을 부담으로 느끼기 쉬워요. "읽씹 아니고 생각 중"이라는 신호만 미리 공유해두면 답장 속도 차이가 서운함으로 안 번져요.`,
    diffEn: (hi, lo) =>
      `${hi} tends to reply right away, while ${lo} takes time to think before answering. Your default reply speed differs, so ${hi} can read ${lo}'s slower replies as disinterest, while ${lo} can feel rushed by ${hi}'s quick follow-ups. Simply flagging "not ignoring you, just thinking" ahead of time keeps this gap from turning into hurt feelings.`,
    sameKo:
      "답장 속도가 비슷한 편이라 메시지 템포에서 오는 스트레스가 거의 없어요. 지금처럼 자연스럽게 주고받으면 돼요.",
    sameEn:
      "Your reply speed matches, so there's little stress from message tempo. Keep texting each other the way you already do.",
  },
  {
    id: "empathy_vs_solution",
    axis: "empathy",
    diffKo: (hi, lo) =>
      `힘든 얘기를 꺼낼 때 ${hi}은(는) "그랬구나, 힘들었겠다"며 감정부터 알아주길 바라는 편이고, ${lo}은(는) "그래서 어떻게 할 거야?" 하고 해결책부터 던지는 편이에요. 공감 방식이 달라서 ${hi}은(는) "내 말을 왜 못 알아들어" 서운함을, ${lo}은(는) "왜 해결책을 싫어하지" 답답함을 느끼기 쉬워요. 고민을 꺼낼 때 "위로가 필요해" 또는 "해결책이 필요해"를 먼저 말해주면 엇박자가 사라져요.`,
    diffEn: (hi, lo) =>
      `When something's hard, ${hi} wants their feelings acknowledged first — "that sounds so hard" — while ${lo} jumps straight to "so what's the plan?" A mismatch in comfort style means ${hi} can feel unheard, while ${lo} can feel frustrated that their solution isn't landing. Simply saying "I need comfort" or "I need a solution" up front clears up the mismatch.`,
    sameKo:
      "공감 방식이 비슷해서 위로가 필요한 순간을 서로 알아채기 쉬워요. 지금의 상담 호흡을 그대로 이어가면 돼요.",
    sameEn:
      "Your comfort style matches, so you're quick to sense when the other needs support. Keep leaning on the rhythm you already have.",
  },
  {
    id: "plan_vs_spontaneous",
    axis: "structure",
    diffKo: (hi, lo) =>
      `여행이나 약속은 분 단위로 동선을 짜야 마음이 편한 ${hi}과(와), 발길 닿는 대로 움직이는 게 편한 ${lo}으로(로) 갈려요. 계획에 대한 기본 기대치가 달라서, ${hi}은(는) ${lo}의 즉흥성을 무계획으로, ${lo}은(는) ${hi}의 계획을 답답함으로 느끼기 쉬워요. 큰 틀(시간·장소)만 ${hi}이(가) 잡고 세부 선택은 ${lo}에게 맡기면 둘 다 편해져요.`,
    diffEn: (hi, lo) =>
      `${hi} feels most at ease with a minute-by-minute itinerary, while ${lo} prefers to wander and decide as you go. Your baseline expectation around planning differs, so ${hi} can read ${lo}'s spontaneity as no plan at all, while ${lo} can find ${hi}'s planning stifling. Letting ${hi} set the broad frame (time, place) while ${lo} picks the details keeps it comfortable for both of you.`,
    sameKo:
      "계획 성향이 비슷해서 약속 잡을 때 실랑이가 적어요. 지금 방식 그대로 준비하면 충분해요.",
    sameEn:
      "Your planning style matches, so there's little back-and-forth when making plans. Keep doing it the way you already do.",
  },
  {
    id: "duo_vs_group",
    axis: "stimulation",
    diffKo: (hi, lo) =>
      `여러 명이 모여 왁자지껄한 자리에서 오히려 에너지가 오르는 ${hi}과(와), 단둘이 조용히 있을 때가 제일 편한 ${lo}으로(로) 갈려요. 자극에 대한 기본 욕구가 달라서, 단체 모임에서 ${lo}은(는) 빨리 지치고, 단둘이 만날 땐 ${hi}이(가) 심심함을 느끼기 쉬워요. 모임과 단둘 만남을 번갈아 섞어주면 둘 다 무리 없이 오래 만날 수 있어요.`,
    diffEn: (hi, lo) =>
      `${hi} actually gains energy in a lively group, while ${lo} feels most comfortable one-on-one in a quiet setting. Your baseline need for stimulation differs, so ${lo} tends to tire fast in group hangouts, while ${hi} can feel understimulated in 1:1 time. Alternating between group hangouts and one-on-one time keeps this sustainable for both of you.`,
    sameKo:
      "자극을 원하는 정도가 비슷해서 모임이든 단둘이든 편하게 맞춰가기 쉬워요. 지금 만나는 방식 그대로 이어가면 돼요.",
    sameEn:
      "Your appetite for stimulation matches, so group hangouts and one-on-one time both feel easy. Keep hanging out the way you already do.",
  },
  {
    id: "speak_up_vs_hold",
    axis: "conflict_style",
    diffKo: (hi, lo) =>
      `서운한 일이 생기면 ${hi}은(는) 그 자리에서 바로 말하는 편이고, ${lo}은(는) 며칠 묵혀뒀다 말하거나 아예 삭이는 편이에요. 갈등을 다루는 속도가 달라서, ${hi}의 직설이 ${lo}에게는 공격처럼, ${lo}의 침묵이 ${hi}에게는 무시처럼 느껴지기 쉬워요. "오늘 안에 풀지, 며칠 시간 두고 얘기할지"만 미리 합의해두면 멀어지는 속도가 줄어요.`,
    diffEn: (hi, lo) =>
      `When something stings, ${hi} tends to say it right away, while ${lo} lets it sit for a few days or holds it in entirely. Your pace for handling conflict differs, so ${hi}'s directness can feel like an attack to ${lo}, and ${lo}'s silence can feel like being ignored to ${hi}. Simply agreeing on "do we talk today or in a few days" up front slows down how fast you two drift apart.`,
    sameKo:
      "서운함을 표현하는 속도가 비슷해서 오해가 오래 가지 않아요. 지금처럼 솔직하게 주고받으면 돼요.",
    sameEn:
      "You handle hurt feelings at a similar pace, so misunderstandings don't linger. Keep being as upfront with each other as you already are.",
  },
  {
    id: "reassurance_vs_trust",
    axis: "recognition",
    diffKo: (hi, lo) =>
      `${hi}은(는) "고맙다", "역시 최고다" 같은 말과 확인을 자주 받아야 관계가 안정적이라고 느끼는 편이고, ${lo}은(는) 한동안 연락이 뜸해도 "우리 사이는 안 변한다"는 걸 당연하게 여기는 편이에요. 인정·확인에 대한 기본 욕구가 달라서, ${hi}은(는) ${lo}의 무덤덤함을 서운해하고, ${lo}은(는) ${hi}의 확인 요청을 부담스러워하기 쉬워요. 거창한 표현이 아니어도 가끔 "그래도 넌 내 편이지" 한마디만 건네주면 ${hi}의 서운함이 크게 줄어요.`,
    diffEn: (hi, lo) =>
      `${hi} feels most secure when they hear "thanks" or "you're the best" fairly often, while ${lo} just assumes the bond is solid even through quiet stretches. Your baseline need for recognition differs, so ${hi} can feel hurt by ${lo}'s low-key style, and ${lo} can feel pressured by ${hi}'s need for reassurance. A simple, occasional "you know I've got your back" from ${lo} goes a long way toward closing that gap.`,
    sameKo:
      "인정·확인에 대한 기대치가 비슷해서 서로 알아주는 타이밍이 잘 맞아요. 지금처럼 자연스럽게 챙기면 충분해요.",
    sameEn:
      "Your need for recognition matches, so you're in sync on when to acknowledge each other. Keep doing it the way you already do.",
  },
  {
    id: "reconciliation_speed",
    axis: "resilience",
    diffKo: (hi, lo) =>
      `한 번 부딪히고 나면 ${hi}은(는) 금방 털고 평소처럼 돌아오는 편이고, ${lo}은(는) 마음이 풀리기까지 시간이 더 걸리는 편이에요. 회복 속도가 달라서, ${hi}은(는) "왜 아직도 그 얘기야"라고 답답해하고, ${lo}은(는) "벌써 괜찮은 척한다"고 서운해하기 쉬워요. 화해 타이밍을 재촉하지 말고 ${lo}이(가) 먼저 신호를 줄 때까지 여유를 주면 회복이 더 빨라져요.`,
    diffEn: (hi, lo) =>
      `After a clash, ${hi} tends to shake it off and bounce back quickly, while ${lo} needs more time before things feel okay again. Your recovery speed differs, so ${hi} can get impatient — "are we still on this?" — while ${lo} can feel rushed into pretending it's fine. Not pushing the reconciliation timeline, and giving ${lo} room to signal when they're ready, actually speeds up recovery.`,
    sameKo:
      "갈등 후 회복하는 속도가 비슷해서 화해 타이밍을 맞추기 쉬워요. 지금 페이스 그대로 풀어가면 돼요.",
    sameEn:
      "You recover from conflict at a similar pace, so it's easy to land on the same reconciliation timing. Keep resolving things at the pace you already do.",
  },
];

/**
 * psychMaster 쌍이 있으면 8개 주제 전부를 채워서 반환한다(설문 완료 여부만
 * 확인 — gap이 작으면 "same" 문구, 크면 "diff" 문구가 자동 선택됨).
 * psychMaster가 없거나 설문 미완료(v2_10q 아님)면 null(레거시 캐시 하위호환,
 * 가짜 데이터로 채우지 않음).
 */
export function buildFriendAxisRealityInsights(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nameA: string,
  nameB: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): FriendAxisRealityInsights | null {
  if (!psychA || !psychB) return null;
  if (!psychHasSurvey(psychA) || !psychHasSurvey(psychB)) return null;

  const psychMatch = buildPsychMatchFromMasters(psychA, psychB);
  const rowByAxis = new Map(psychMatch.axis_results.map((row) => [row.axis_key, row]));

  const out = {} as FriendAxisRealityInsights;
  for (const topic of TOPICS) {
    const row = rowByAxis.get(topic.axis);
    if (!row) continue;
    if (row.match_type === "similarity") {
      out[topic.id] = pick(locale, topic.sameEn, topic.sameKo);
      continue;
    }
    const aIsHigh = row.score_a >= row.score_b;
    const nameHigh = aIsHigh ? nameA : nameB;
    const nameLow = aIsHigh ? nameB : nameA;
    out[topic.id] = pick(locale, topic.diffEn(nameHigh, nameLow), topic.diffKo(nameHigh, nameLow));
  }
  return out;
}
