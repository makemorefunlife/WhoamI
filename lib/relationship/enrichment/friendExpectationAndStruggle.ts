import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { FriendScoringSignals } from "@/lib/saju/friendAnalysis";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";

/**
 * current_enriched 전용 — 05B 캐노니컬 질문 맵의 잔여 3개 질문(성장과 기대 Q2/Q3,
 * Relationship Low)을 기존 섹션(Hidden Flow, Prescription, Snapshot)에 채운다.
 * 새 카드는 만들지 않는다 — docs/product/05B_Friend_Product_Blueprint.md Law 6/9/10/14.
 */

/**
 * 성장과 기대 Q2 — "힘들 때 무엇까지 기대해도 되는가"
 * 05B Law 14(capability, not obligation) — 상담 스타일 설명 뒤에 한계 문구를 덧붙인다.
 * counselingA/B.type(F/T/balanced)을 재사용 — psych 재계산 없음.
 */
export function buildCapabilityBoundaryClause(
  type: "F" | "T" | "balanced",
  nameOther: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string {
  if (type === "F") {
    return pick(
      locale,
      `That said, ${nameOther} can offer this presence — it's not something they owe you every time. It's okay to also lean on someone else, or on yourself, sometimes.`,
      `다만 ${nameOther}이(가) 항상 이렇게 해줄 의무가 있는 건 아니에요 — 가끔은 다른 친구나 스스로에게도 기댈 곳을 마련해두는 게 이 우정에도 더 건강해요.`,
    );
  }
  if (type === "T") {
    return pick(
      locale,
      `That said, don't expect ${nameOther} to always have the perfect answer ready — it's fine to tell them plainly when what you actually need is just someone to listen.`,
      `다만 ${nameOther}에게 항상 완벽한 해결책을 기대하진 마세요 — 그냥 들어주는 게 필요할 땐 그렇다고 솔직히 말해도 괜찮아요.`,
    );
  }
  return pick(
    locale,
    `That said, ${nameOther} reading the room well doesn't mean they always will — it's still worth telling them directly what kind of support you need in the moment.`,
    `다만 ${nameOther}이(가) 상황을 잘 읽는 편이어도 매번 그런 건 아니에요 — 지금 필요한 지지가 뭔지 직접 말해주는 게 더 확실해요.`,
  );
}

/**
 * 성장과 기대 Q3 — "무엇을 기대하면 실망하기 쉬운가"
 * counseling_gap_note(Hidden Flow, empathy_vs_solution 축)와 같은 신호(공감 vs
 * 사고방식)를 재사용하되, "왜 어긋나는가"가 아니라 "무엇을 내려놓을지"로
 * 프레이밍만 바꾼다 — Law 9(recognition before advice)에 따라 별도 홈(Prescription
 * Don't List)에 배치.
 */
export function buildExpectationResetLine(
  psychOther: PsychMasterJson | null | undefined,
  nameOther: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): string | null {
  if (!psychOther) return null;
  const { thinking_style, empathy } = psychOther.secondary_axes;
  if (Math.abs(thinking_style - empathy) < 15) return null;

  if (thinking_style > empathy) {
    return pick(
      locale,
      `Expecting ${nameOther} to drop everything and give you a long, emotionally validating conversation every time — that's a setup for disappointment. Their care shows up as showing up with a plan, not a monologue of comfort.`,
      `${nameOther}에게 매번 길게 감정을 알아주는 위로 대화를 기대하면 실망하기 쉬워요 — 이 사람의 관심은 위로의 말보다 실질적인 대안으로 나타나는 편이에요.`,
    );
  }
  return pick(
    locale,
    `Expecting ${nameOther} to hand you a crisp, ready-made solution on the spot — that's a setup for disappointment. Their care shows up as sitting with you in the feeling, not solving it fast.`,
    `${nameOther}에게 매번 즉각적이고 깔끔한 해결책을 기대하면 실망하기 쉬워요 — 이 사람의 관심은 빠른 정답보다 함께 감정을 견뎌주는 쪽으로 나타나는 편이에요.`,
  );
}

/**
 * Relationship Low — "이 우정이 유독 힘들어지는 순간"
 * shine_when_best(언제 빛나는가)의 대칭 짝. score_card_audit.risk.why와 동일한
 * friction 신호(scoringSignals)를 재사용해 장면으로 재구성하고, 실전
 * 처방전/화해 카드로 짧게 넘긴다(05B Law 10 — 모든 어려운 인사이트는 실행
 * 경로가 있어야 함. 내용을 반복하지 않고 포인터만 둔다).
 */
export function buildFriendshipStruggleLine(params: {
  sig: FriendScoringSignals;
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string {
  const { sig, psychA, psychB, nameA, nameB } = params;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  let scene: string;
  if (sig.hasDayBranchFullTension) {
    scene = pick(
      locale,
      `This friendship gets hardest right after a clash — when neither of you backs down first, small friction can escalate fast.`,
      `이 우정은 부딪힌 직후에 가장 힘들어져요 — 둘 다 먼저 물러서지 않으면 작은 마찰이 빠르게 커질 수 있어요.`,
    );
  } else if (sig.hasWonjinOrGuimun) {
    scene = pick(
      locale,
      `This friendship gets hardest in moments that are hard to explain logically — a mood shift or a small comment lands harder than either of you expects.`,
      `이 우정은 논리적으로 설명하기 힘든 순간에 유독 힘들어져요 — 사소한 말투나 분위기 하나가 예상보다 크게 걸릴 수 있어요.`,
    );
  } else if (sig.hasWealthOfficerClash) {
    scene = pick(
      locale,
      `This friendship gets hardest around money, fairness, or "whose rules" — practical disagreements here cut deeper than they look.`,
      `이 우정은 돈이나 공정함, '누구 기준이 맞나' 문제에서 유독 힘들어져요 — 겉보기보다 현실적인 이견이 더 깊게 남을 수 있어요.`,
    );
  } else {
    scene = pick(
      locale,
      `This friendship gets hardest when one of you is running on empty and the other doesn't notice in time — the strain builds quietly before it's said out loud.`,
      `이 우정은 한쪽이 지쳐가는 걸 다른 쪽이 제때 못 알아챌 때 유독 힘들어져요 — 말로 꺼내기 전까지 피로가 조용히 쌓여요.`,
    );
  }

  const conflictGap =
    psychA && psychB
      ? Math.abs(psychA.secondary_axes.conflict_style - psychB.secondary_axes.conflict_style)
      : 0;
  const conflictClause =
    conflictGap >= 25
      ? pick(
          locale,
          ` ${nameA} and ${nameB} also handle conflict at very different speeds, which can make the same friction feel bigger to one of you than the other.`,
          ` ${nameA}·${nameB}이(가) 갈등을 다루는 속도도 많이 달라서, 같은 마찰이 한쪽에게는 더 크게 느껴질 수 있어요.`,
        )
      : "";

  const pointer = pick(
    locale,
    " See the prescription below for what to do when this happens.",
    " 이럴 때 어떻게 하면 좋을지는 아래 실전 처방전을 참고하세요.",
  );

  return `${scene}${conflictClause}${pointer}`;
}
