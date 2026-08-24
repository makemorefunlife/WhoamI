import type { TenGodCounts } from "./familyParentTenGodAnalysis";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import type { Locale } from "@/lib/i18n/locale";
import type { FamilyParentRole } from "./types";
import { resolveCorrectionStyleBucket } from "./familySajuCompareTable";
import { josaEunNeun, josaIGa, josaEulReul, josaGwaWa } from "./familyParentLanguage";

export type ChildDeEscalationCategory =
  | "self"
  | "food"
  | "seal"
  | "officer"
  | "wealth";

export type ChildDeEscalationCard = {
  hashtag: string;
  color: "red" | "yellow" | "orange" | "blue" | "green";
  archetype_label: string;
  /** Part2 A child correction_style bucket — SSOT */
  category: ChildDeEscalationCategory;
  psych_state: string;
  avoid_actions: string;
  solution_script: string;
  /** Part4 — 연락 대기시간(스펙 고정값 3시간). Track A/B 둘 다 항상 채움. */
  contact_wait_note: string;
  /** Part4 Track B 전용 — 자녀→부모 거절/독립 스크립트. Track A(기본)면 null. */
  boundary_script: string | null;
};

type PrescriptionDef = {
  hashtag: (locale: Locale) => string;
  color: ChildDeEscalationCard["color"];
  archetype_label: (locale: Locale) => string;
  category: ChildDeEscalationCategory;
  psych_state: (child: string, parent: string, locale: Locale) => string;
  avoid_actions: (child: string, parent: string, locale: Locale) => string;
  solution_script: (child: string, parent: string, role: string, locale: Locale) => string;
};

const CHILD_DE_ESCALATION: PrescriptionDef[] = [
  {
    hashtag: (locale) => pick(locale, "#PrideComesFirst", "#우쭈쭈_자존심이생명"),
    color: "red",
    archetype_label: (locale) =>
      pick(locale, "Pride & Self-Worth Sensitive Type", "자존심·존재감 민감형"),
    category: "self",
    psych_state: (child, _parent, locale) =>
      pick(
        locale,
        `${child} can't have a rational conversation once they feel "looked down on." The moment you start assigning blame, they raise their defenses.`,
        `${josaEunNeun(child)} "날 무시한다"는 느낌이 들면 이성적인 대화가 불가능해져요. 잘잘못을 따지는 순간 방어벽을 높입니다.`,
      ),
    avoid_actions: (child, parent, locale) =>
      pick(
        locale,
        `【${parent} → ${child}】 Blaming with "because of you...", comparing to siblings, or brushing off ${child}'s effort.`,
        `【${parent} → ${child}】 "너 때문에…"라며 책임 전가, 형제와 비교, ${josaEulReul(child)}의 노력을 가볍게 치부하기.`,
      ),
    solution_script: (child, parent, role, locale) =>
      pick(
        locale,
        `【${parent}(${role}) → ${child}】 "${child}, I know how precious you are. I'm really sorry if what I said earlier hurt you. I'll protect your pride." — Affirm their worth first, and save the rule-talk for tomorrow.`,
        `【${parent}(${role}) → ${child}】 "${child}, 네가 얼마나 소중한지 내가 다 알아. 아까 내 말이 상처였다면 정말 미안해. 네 자존심은 지켜줄게." — 존재 가치를 먼저 인정한 뒤, 규칙 이야기는 내일로 미루세요.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#FreshAirResetsMe", "#바람쐬고_기분전환"),
    color: "yellow",
    archetype_label: (locale) =>
      pick(locale, "Instant-Vent, Quick-Reset Type", "즉각 표출·기분전환형"),
    category: "food",
    psych_state: (child, _parent, locale) =>
      pick(
        locale,
        `${child} vents anger right away. It doesn't linger long, but the longer a heavy mood drags on, the more exhausted they get.`,
        `${josaEunNeun(child)} 화가 올라오면 바로 표출하는 타입이에요. 뒤끝은 길지 않지만, 무거운 분위기가 길어질수록 더 지쳐요.`,
      ),
    avoid_actions: (child, parent, locale) =>
      pick(
        locale,
        `【${parent} → ${child}】 Days of cold war, stern long lectures, or pushing with "still mad?" the moment ${child} tries to lighten up.`,
        `【${parent} → ${child}】 며칠간 냉전, 정색하고 긴 설교, ${josaIGa(child)} 기분 풀려 하면 "아직 화났어?"라며 몰아붙이기.`,
      ),
    solution_script: (child, parent, role, locale) =>
      pick(
        locale,
        `【${parent}(${role}) → ${child}】 "Want to take a short walk, we're both feeling down?", "Let's grab your favorite snack and shake it off." — Changing the mood comes before a serious apology.`,
        `【${parent}(${role}) → ${child}】 "우리 둘 다 꿀꿀한데 잠깐 산책 갈까?", "좋아하는 간식 먹으면서 풀자." — 진지한 사과보다 분위기 전환이 먼저예요.`,
        ),
  },
  {
    hashtag: (locale) => pick(locale, "#MyOwnCaveTime", "#혼자만의_동굴시간"),
    color: "orange",
    archetype_label: (locale) =>
      pick(locale, "Silent Cave-Recovery Type", "침묵·동굴 회복형"),
    category: "seal",
    psych_state: (child, _parent, locale) =>
      pick(
        locale,
        `${child}'s brain overloads right after conflict. Demanding a conversation immediately can make them explode or shut the door completely.`,
        `${josaEunNeun(child)} 갈등 직후 뇌 과부하 상태가 돼요. 즉시 대화를 요구하면 폭발하거나 완전히 문을 닫아버립니다.`,
      ),
    avoid_actions: (child, parent, locale) =>
      pick(
        locale,
        `【${parent} → ${child}】 Chasing them with "how am I supposed to know if you don't talk? Talk to me now!" or knocking on the door.`,
        `【${parent} → ${child}】 "말 안 하면 어떻게 알아? 지금 당장 대화해!"라며 쫓아가기, 방문 두드리기.`,
      ),
    solution_script: (child, parent, role, locale) =>
      pick(
        locale,
        `【${parent}(${role}) → ${child}】 (by text/note) "${child}, I understand you're upset. I'll wait until your thoughts settle. Talk to me when you're ready." — Give them at least 2–3 hours before checking in.`,
        `【${parent}(${role}) → ${child}】 (문자·메모) "${child}, 화난 마음 이해해. 생각 정리될 때까지 기다릴게. 준비되면 말해 줘." — 최소 2~3시간은 쫓지 마세요.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#TalkItOutDirectly", "#대놓고이야기해야풀린다"),
    color: "blue",
    archetype_label: (locale) =>
      pick(locale, "Clear-Rules, Direct-Talk Type", "규칙·명확한 대화형"),
    category: "officer",
    psych_state: (child, _parent, locale) =>
      pick(
        locale,
        `A simple "sorry" isn't enough for ${child}. They need to hear specifically what went wrong and what happens next before their heart opens.`,
        `${josaEunNeun(child)} "그냥 미안해"만으로는 풀리지 않아요. 무엇이 문제였는지, 앞으로 어떻게 할지 구체적으로 들어야 마음이 열립니다.`,
      ),
    avoid_actions: (child, parent, locale) =>
      pick(
        locale,
        `【${parent} → ${child}】 Pleading in tears, conditional apologies, or repeating emotion without the concrete solution ${child} needs.`,
        `【${parent} → ${child}】 울며 매달리기, 조건부 사과, ${josaIGa(child)} 원하는 구체 해법 없이 감정만 반복하기.`,
      ),
    solution_script: (child, parent, role, locale) =>
      pick(
        locale,
        `【${parent}(${role}) → ${child}】 "${child}, I was wrong about A. Here's what I'll change going forward: (specific action). Does that work?" — Acknowledge the fact → offer an alternative → ask for confirmation, in that order.`,
        `【${parent}(${role}) → ${child}】 "${child}, A는 내가 잘못했어. 앞으로는 이렇게 바꿀게: (구체 행동). 이게 괜찮을까?" — 사실 인정 → 대안 → 확인 질문 순서로.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#ActionsOverApologies", "#실속형사과가최고"),
    color: "green",
    archetype_label: (locale) =>
      pick(locale, "Practical-Reward, Results-Oriented Type", "현실 보상·실속형"),
    category: "wealth",
    psych_state: (child, _parent, locale) =>
      pick(
        locale,
        `${child} is disappointed by apologies that are just words. They need a "real repair" — a promise kept, time given, or a small reward — before their heart opens.`,
        `${josaEunNeun(child)} 말로만 하는 사과에는 실망해요. 약속·시간·작은 보상 같은 '실질적 회복'이 있어야 마음이 열립니다.`,
      ),
    avoid_actions: (child, parent, locale) =>
      pick(
        locale,
        `【${parent} → ${child}】 Repeating "sorry" in words only, or brushing off the loss ${child} took (a broken promise, wasted time).`,
        `【${parent} → ${child}】 말로만 "미안해" 반복, ${josaIGa(child)} 입은 손해(약속 깨짐·시간 낭비)를 가볍게 넘기기.`,
      ),
    solution_script: (child, parent, role, locale) =>
      pick(
        locale,
        `【${parent}(${role}) → ${child}】 "Let's do what you want to do first this weekend. I'll finally do the (specific promise) I kept putting off, together, today." — Action and reward come before words.`,
        `【${parent}(${role}) → ${child}】 "이번 주말 네가 하고 싶은 거 먼저 하자. 내가 미뤘던 (구체 약속) 오늘 같이 할게." — 말보다 행동·보상이 먼저입니다.`,
      ),
  },
];

/**
 * Part4 Track B — 자녀→부모 거절/독립 스크립트. 새 십성 분류를 만들지 않고
 * 기존 5카테고리(`ChildDeEscalationCategory`, correction_style bucket)를
 * 그대로 재사용 — marriage의 `RECONCILIATION_CUE_COPY`와 동일 컨벤션.
 */
const BOUNDARY_SCRIPT: Record<Locale, Record<ChildDeEscalationCategory, (child: string, parent: string) => string>> = {
  "en-US": {
    self: (_child, parent) =>
      `${parent}, this isn't about disrespecting you — I just want to do this my own way. If you can respect that, I'll open up more too.`,
    food: (_child, parent) =>
      `${parent}, can we just let this one go for now? I'll bring it up myself once I've cooled down.`,
    seal: (_child, parent) =>
      `${parent}, I need a little time alone to sort my thoughts out first. Please wait — I'll talk when I'm ready.`,
    officer: (_child, parent) =>
      `${parent}, I need to understand the "why" before I can accept it. If you tell me specifically what the issue was, I'll work on it too.`,
    wealth: (_child, parent) =>
      `${parent}, I'd rather see it than hear it. If you follow through on what you said, I'll feel better too.`,
  },
  "ko-KR": {
    self: (_child, parent) =>
      `${parent}, 무시하려는 게 아니라 그냥 내 방식대로 하고 싶은 것뿐이야. 존중해 주면 나도 더 잘 얘기할 수 있어.`,
    food: (_child, parent) =>
      `${parent}, 이번 건 그냥 넘어가 주면 안 될까? 기분 풀리면 내가 먼저 말할게.`,
    seal: (_child, parent) =>
      `${parent}, 나 지금 혼자 생각 정리할 시간이 필요해. 잠깐만 기다려 줘, 준비되면 얘기할게.`,
    officer: (_child, parent) =>
      `${parent}, 나도 이유를 알아야 받아들일 수 있어. 뭐가 문제였는지 구체적으로 말해주면 나도 노력할게.`,
    wealth: (_child, parent) =>
      `${parent}, 말보다 행동으로 보여줬으면 좋겠어. 약속 지켜주면 나도 마음이 풀려.`,
  },
};

function resolveSelfCount(counts: TenGodCounts): number {
  return (counts["비견"] ?? 0) + (counts["겁재"] ?? 0);
}

/**
 * Part4 — 연락 대기시간. 스펙 고정값 "3시간"(marriage의 24시간처럼
 * spec-literal)은 그대로 두고, 비겁(고집) 카운트 비교로 "누가 더 답장이
 * 늦는 편인지"만 개인화 — marriage `resolveColdWarProtocol`과 동일 패턴.
 */
function buildContactWaitNote(params: {
  childNickname: string;
  parentNickname: string;
  childSelf: number;
  parentSelf: number;
  childIsViewer: boolean;
  locale: Locale;
}): string {
  const { childNickname: child, parentNickname: parent, locale } = params;
  const childHoldsOutLonger = params.childSelf >= params.parentSelf;

  if (!params.childIsViewer) {
    return childHoldsOutLonger
      ? pick(
          locale,
          `${child} tends to take longer to reply once upset. Give them up to 3 hours after a text before checking in — pushing sooner tends to backfire.`,
          `${child}는 한번 삐지면 답장이 늦어지는 편이에요. 카톡 보내고 3시간까지는 다그치지 말고 기다려 주세요 — 그 이상 침묵하면 그때 다시 말 걸어도 늦지 않아요.`,
        )
      : pick(
          locale,
          `${child} doesn't tend to hold out long — 3 hours is usually enough for them to settle down and reach out first. No need to rush it.`,
          `${child}는 오래 버티는 편은 아니라, 3시간이면 충분히 마음을 추스르고 먼저 연락해 올 거예요. 조급해하지 않아도 돼요.`,
        );
  }

  return childHoldsOutLonger
    ? pick(
        locale,
        `You tend to need a bit of time when you're upset — that's okay. Just try to leave a short line within 3 hours, like "eating fine, working — I'll text tonight." That alone is enough for ${parent} to stop worrying.`,
        `화가 나면 시간이 좀 필요한 편이죠? 그래도 3시간 안에는 짧게라도 안부를 남겨보세요 — "잘 먹고 일하는 중! 저녁에 톡할게" 한 줄이면 ${parent}는 충분히 안심하실 거예요.`,
      )
    : pick(
        locale,
        `Even when you're usually quick to reply, on busy days just leaving one short line within 3 hours — "eating fine, working — I'll text tonight" — will put ${parent}'s mind at ease.`,
        `평소 답장이 빠른 편이라도, 바쁠 땐 3시간 안에 짧은 한 줄만 남겨보세요 — "잘 먹고 일하는 중! 저녁에 톡할게" 정도면 ${parent}는 걱정을 내려놓으실 거예요.`,
      );
}

/**
 * Part2 A child correction_style bucket → Part5 de-escalation prescription.
 * dominantArchetype / 별도 categoryScores 미사용 (017 SSOT).
 */
export function pickDeEscalationByCorrectionStyle(
  counts: TenGodCounts,
): PrescriptionDef {
  const { bucket } = resolveCorrectionStyleBucket(counts);
  return (
    CHILD_DE_ESCALATION.find((p) => p.category === bucket) ??
    CHILD_DE_ESCALATION.find((p) => p.category === "seal") ??
    CHILD_DE_ESCALATION[2]!
  );
}

export function buildChildDeEscalationCard(params: {
  childNickname: string;
  parentNickname: string;
  parentRole: FamilyParentRole;
  childCounts: TenGodCounts;
  parentCounts?: TenGodCounts;
  locale?: Locale;
  /** true면 시청자=자녀(Track B) — boundary_script 채움 + contact_wait_note 톤 분기. */
  childIsViewer?: boolean;
}): ChildDeEscalationCard {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const childIsViewer = params.childIsViewer === true;
  const roleLabel = pick(
    locale,
    params.parentRole === "mother" ? "Mom" : "Dad",
    params.parentRole === "mother" ? "엄마" : "아빠",
  );
  const def = pickDeEscalationByCorrectionStyle(params.childCounts);

  const contact_wait_note = buildContactWaitNote({
    childNickname: params.childNickname,
    parentNickname: params.parentNickname,
    childSelf: resolveSelfCount(params.childCounts),
    parentSelf: resolveSelfCount(params.parentCounts ?? {}),
    childIsViewer,
    locale,
  });

  const boundary_script = childIsViewer
    ? BOUNDARY_SCRIPT[locale][def.category](params.childNickname, params.parentNickname)
    : null;

  return {
    hashtag: def.hashtag(locale),
    color: def.color,
    archetype_label: def.archetype_label(locale),
    category: def.category,
    psych_state: def.psych_state(params.childNickname, params.parentNickname, locale),
    avoid_actions: def.avoid_actions(params.childNickname, params.parentNickname, locale),
    solution_script: def.solution_script(
      params.childNickname,
      params.parentNickname,
      roleLabel,
      locale,
    ),
    contact_wait_note,
    boundary_script,
  };
}
