import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/marriage/marriageCopy";
import { subjectParticle } from "@/lib/relationship/koreanParticles";

/**
 * "우리를 위한 맞춤 제안" — Chapter 3(가사와 재정 분담) 전용 신규 섹션.
 * 사용자 지정 고정 문구, 이름만 변수 처리(CFO/상대 자동 판별, CFO 미판정
 * 시 nicknameA로 기본값). 매 리포트마다 항상 전부 노출된다 — 게이트 없음.
 */

export type ActionPlanItem = {
  title: string;
  body: string;
  quote: string;
};

export type CoupleActionPlanSection = {
  forMe: ActionPlanItem[];
  forPartner: ActionPlanItem[];
  together: ActionPlanItem[];
};

export function buildCoupleActionPlanSection(params: {
  /** cfoFinal.nickname — null/undefined if CFO couldn't be resolved (defaults to nicknameA). */
  cfoNickname: string | null | undefined;
  nicknameA: string;
  nicknameB: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): CoupleActionPlanSection {
  const { cfoNickname, nicknameA, nicknameB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  // 사용자 지정 — 이 섹션은 매 리포트마다 항상 전부 노출된다. CFO가
  // 확정되지 않았거나(dual/미판정) 이름만 채워서 그대로 보여준다.
  const cfoName =
    cfoNickname && (cfoNickname === nicknameA || cfoNickname === nicknameB) ? cfoNickname : nicknameA;
  const otherName = cfoName === nicknameA ? nicknameB : nicknameA;

  const forMe: ActionPlanItem[] = [
    {
      title: pick(locale, "State the operating rule instead of going quiet", "침묵 대신 운영 규칙 한 줄 말하기"),
      body: pick(
        locale,
        "Your conflict-response styles land differently, so in the moment, stating a simple operating rule instead of going silent helps.",
        "부부 갈등 반응 결이 다르게 잡히기 때문에, 갈등 상황에서 침묵 대신 운영 규칙을 간단히 말하는 것이 필요해요.",
      ),
      quote: pick(
        locale,
        '"Instead of solving it right now, I just want to decide who\'s handling what today."',
        '"지금은 해결보다, 오늘 누가 무엇을 맡을지만 먼저 정하고 싶어."',
      ),
    },
    {
      title: pick(locale, `Check in on ${otherName}'s stress`, `${otherName}의 스트레스 점검하기`),
      body: pick(
        locale,
        `The way household-routine stress shows up reads differently between you, so checking in on ${otherName}'s stress helps.`,
        `가사 루틴 스트레스 드러내는 방식이 다르게 잡히므로, ${otherName}의 스트레스를 점검해 주는 것이 좋아요.`,
      ),
      quote: pick(
        locale,
        `"${otherName}, what's been the hardest part of the housework this week? Let's talk it through together."`,
        `"${otherName}, 이번 주 집안일 중에서 힘든 부분이 뭐야? 같이 이야기해 보자."`,
      ),
    },
    {
      title: pick(locale, "Run a regular finance check-in", "정기적인 재정 점검하기"),
      body: pick(
        locale,
        `Since the day-to-day finance operator role lands on ${cfoName}, checking in on the finances on a regular basis helps.`,
        `일상 재정 운영 역할이 ${cfoName} 쪽으로 잡힘으로 인해, 정기적으로 재정 상황을 점검하는 것이 필요해요.`,
      ),
      quote: pick(
        locale,
        '"How about we check in on our finances together this week?"',
        '"이번 주에 우리 재정 상황을 한번 점검해보는 게 어때?"',
      ),
    },
  ];

  const forPartner: ActionPlanItem[] = [
    {
      title: pick(locale, `Respect ${cfoName}'s household rhythm`, `${cfoName}의 가사 리듬 존중하기`),
      body: pick(
        locale,
        `The way household-routine stress shows up reads differently between you, so noticing and respecting what ${cfoName} finds hard first helps.`,
        `가사 루틴 스트레스 드러내는 방식이 다르게 잡히므로, ${subjectParticle(cfoName)} 힘들어하는 가사 일을 먼저 파악하고 존중하는 것이 좋아요.`,
      ),
      quote: pick(
        locale,
        `"${cfoName}, what's the most draining chore for you this week? Let's match around that first."`,
        `"${cfoName}, 이번 주 집안일 중에서 네가 제일 지치는 게 뭐야? 그걸 먼저 맞춰 보자."`,
      ),
    },
    {
      title: pick(
        locale,
        "Line up finances & schedule before a conflict",
        "갈등 전 재정·일정부터 한 줄 정리하기",
      ),
      body: pick(
        locale,
        `Since the day-to-day finance operator role lands on ${cfoName}, briefly lining up finances and schedule together helps.`,
        `일상 재정 운영 역할이 ${cfoName} 쪽으로 잡힘으로 인해, 재정과 일정을 간단히 정리하는 것이 좋겠어요.`,
      ),
      quote: pick(
        locale,
        '"Let\'s lay out this week\'s finances and schedule simply — first let\'s check what matters most."',
        '"이번 주 재정과 일정을 간단하게 정리해보자. 어떤 부분이 가장 중요한지 먼저 확인해 보자."',
      ),
    },
    {
      title: pick(locale, `Hear ${cfoName} out first`, `${cfoName}의 의견을 먼저 듣기`),
      body: pick(
        locale,
        `Your conflict-response styles land differently, so hearing ${cfoName} out before things escalate matters.`,
        `부부 갈등 반응 결이 다르게 잡히기 때문에, 갈등이 발생하기 전에 ${cfoName}의 의견을 먼저 듣는 것이 중요해요.`,
      ),
      quote: pick(
        locale,
        `"${cfoName}, I want to hear your thoughts first on what we're about to discuss."`,
        `"${cfoName}, 이번에 우리가 논의할 주제에 대해 네 생각을 먼저 듣고 싶어."`,
      ),
    },
  ];

  const together: ActionPlanItem[] = [
    {
      title: pick(locale, "Something to try together", "우리 집에서는 함께 해볼 것"),
      body: pick(
        locale,
        "Your home has different styles around chores and finances. It would help to check in on each other's stress and go over your finances together, once a week.",
        "우리 집에서는 가사와 재정 운영에서 서로 다른 스타일이 있어요. 매주 서로의 스트레스를 점검하고, 재정 상황을 정리하는 시간을 가지면 좋겠어요.",
      ),
      quote: pick(
        locale,
        '"What do you think about chores and finances this week? Let\'s share our thoughts."',
        '"이번 주 가사와 재정에 대해 어떻게 생각해? 서로의 의견을 한 번 나눠보자."',
      ),
    },
  ];

  return { forMe, forPartner, together };
}
