import type { TenGodCounts } from "./marriageTenGodAnalysis";
import { LEGACY_FALLBACK_LOCALE, pick } from "./marriageCopy";
import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import type { Locale } from "@/lib/i18n/locale";

export type HomeDeEscalationCard = {
  hashtag: string;
  color: "red" | "yellow" | "orange" | "blue" | "green";
  archetype_label: string;
  /** 화가 나는 쪽 */
  upset_nickname: string;
  /** 화 풀어줄 말·행동을 해야 하는 쪽 */
  partner_nickname: string;
  psych_state: string;
  avoid_actions: string;
  solution_script: string;
};

export type HomeDeEscalationPair = {
  person_a: HomeDeEscalationCard;
  person_b: HomeDeEscalationCard;
  /** 두 사람 1순위 화 풀림 유형이 같을 때 true */
  shared_trigger: boolean;
  shared_trigger_note: string | null;
};

type PrescriptionDef = {
  hashtag: (locale: Locale) => string;
  color: HomeDeEscalationCard["color"];
  archetype_label: (locale: Locale) => string;
  category: "self" | "food" | "seal" | "officer" | "wealth";
  psych_state: (upset: string, locale: Locale) => string;
  avoid_actions: (partner: string, upset: string, locale: Locale) => string;
  solution_script: (partner: string, upset: string, locale: Locale) => string;
};

const HOME_DE_ESCALATION_PRESCRIPTIONS: PrescriptionDef[] = [
  {
    hashtag: (locale) => pick(locale, "#YoureTheBest", "#우쭈쭈_당신이최고야"),
    color: "red",
    archetype_label: (locale) => pick(locale, "Presence & Pride Sensitive Type", "존재감·자존심 민감형"),
    category: "self",
    psych_state: (upset, locale) =>
      pick(
        locale,
        `${upset} can't have a rational conversation once they feel their sense of worth or pride was hurt. The moment fault gets assigned, they read it as "being looked down on" and raise their guard.`,
        `${upset}는 자신의 존재 가치나 자존심에 상처를 입었다고 느끼면 이성적인 대화가 불가능해집니다. 잘잘못을 따지는 순간 '날 무시한다'고 받아들여 방어벽을 높입니다.`,
      ),
    avoid_actions: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 Litigating "you did something wrong too," sighing or giving a disappointed look, or brushing off ${upset}'s effort.`,
        `【${partner} → ${upset}】 "네가 잘못한 부분도 있잖아"라며 시시비비 가리기, 한숨·한심한 눈빛, ${upset}의 노력을 가볍게 치부하기.`,
      ),
    solution_script: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 "${upset}, I know exactly how hard you work for this home. This place doesn't run without you. I'm really sorry if what I said earlier hurt you." — Affirm their worth first, and save the argument for tomorrow.`,
        `【${partner} → ${upset}】 "${upset}, 당신이 우리 집을 위해 얼마나 고생하는지 내가 다 알아. 당신 없으면 이 집이 안 돌아가. 아까 내 말이 상처였다면 정말 미안해." — 존재 가치를 먼저 인정한 뒤, 논쟁은 내일로 미루세요.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#FreshAirResetsMe", "#바람쐬고_기분전환"),
    color: "yellow",
    archetype_label: (locale) => pick(locale, "Instant-Vent, Quick-Reset Type", "즉각 표출·기분전환형"),
    category: "food",
    psych_state: (upset, locale) =>
      pick(
        locale,
        `${upset} vents anger right away. It doesn't linger long, but the longer a heavy, serious mood drags on, the more exhausted they get.`,
        `${upset}는 화가 올라오면 바로 표출하는 타입입니다. 뒤끝은 길지 않지만, 무겁고 심각한 분위기가 길어질수록 더 지쳐버립니다.`,
      ),
    avoid_actions: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 Days of treating them like they're invisible, sitting them down for an interrogation-style hearing, or pushing with "still mad?" the moment ${upset} tries to lighten up.`,
        `【${partner} → ${upset}】 며칠간 투명인간 취급·냉전, 정색하고 청문회처럼 앉아 조사하기, ${upset}가 기분 풀려 하면 "아직 화났어?"라며 무겁게 몰아붙이기.`,
      ),
    solution_script: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 "Want to take a quick drive, we're both feeling down?", "I ordered something good, let's eat and shake it off together." — Changing the mood comes before a serious apology. Make room for ${upset} to laugh first, then say the important part briefly.`,
        `【${partner} → ${upset}】 "우리 둘 다 꿀꿀한데 잠깐 드라이브 갈까?", "맛있는 거 시켰는데 같이 먹으면서 풀자." — 진지한 사과보다 분위기 전환이 먼저입니다. ${upset}가 웃을 틈을 만든 뒤 핵심을 짧게 말하세요.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#MyOwnCaveTime", "#혼자만의_동굴시간"),
    color: "orange",
    archetype_label: (locale) => pick(locale, "Silent Cave-Recovery Type", "침묵·동굴 회복형"),
    category: "seal",
    psych_state: (upset, locale) =>
      pick(
        locale,
        `${upset}'s brain overloads right after conflict. Demanding a conversation immediately can make them explode or shut the door completely. They need time alone to sort things out.`,
        `${upset}는 갈등 직후 뇌 과부하 상태가 됩니다. 즉시 대화를 요구하면 폭발하거나 완전히 문을 닫아버립니다. 혼자 정리할 시간이 필요합니다.`,
      ),
    avoid_actions: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 Chasing them with "how am I supposed to know if you don't talk? Talk to me right now!", knocking on the door, or reading ${upset}'s silence as being ignored or neglectful.`,
        `【${partner} → ${upset}】 "말 안 하면 어떻게 알아? 지금 당장 대화해!"라며 쫓아가기, 방문 두드리기, ${upset}의 침묵을 무시·방임으로 해석하기.`,
      ),
    solution_script: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 (a one-line text or note) "${upset}, I understand you're upset. I'll wait until your thoughts settle. Talk to me when you're ready." — After that, leave your presence known but don't chase for at least half a day.`,
        `【${partner} → ${upset}】 (문자·메모 한 줄) "${upset}, 화난 마음 이해해. 생각 정리될 때까지 기다릴게. 준비되면 말해 줘." — 그다음 최소 반나절은 존재감만 남기고 쫓지 마세요.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#GiveMeAConcretePlan", "#구체적인_대안제시"),
    color: "blue",
    archetype_label: (locale) => pick(locale, "Rules & Alternatives-Focused Type", "규칙·대안 중시형"),
    category: "officer",
    psych_state: (upset, locale) =>
      pick(
        locale,
        `${upset} finds a tearful plea or a plain "sorry" without substance insincere. Logic, facts, and a rule for future behavior are what open their heart.`,
        `${upset}는 눈물 섞인 호소나 "그냥 미안해" 같은 감정만 있는 사과를 진정성 없다고 느낍니다. 논리·사실·앞으로의 행동 규칙이 있어야 마음이 열립니다.`,
      ),
    avoid_actions: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 Pleading in tears, a conditional apology like "sorry if you were upset," or repeating emotion without the concrete solution ${upset} is asking for.`,
        `【${partner} → ${upset}】 울며 매달리기, "기분 나빴다면 미안" 같은 조건부 사과, ${upset}가 요구하는 구체 해법 없이 감정만 반복하기.`,
      ),
    solution_script: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 "${upset}, I was wrong about A. Here's how I'll change the chore split going forward, and I'll set an alarm to keep to it. How does that sound?" — Acknowledge the fact → offer an alternative → ask for confirmation, in that order.`,
        `【${partner} → ${upset}】 "${upset}, A는 내 잘못이 맞아. 앞으로는 가사 분담을 이렇게 바꾸고, 알람 맞춰 지킬게. 이 제안 어때?" — 사실 인정 → 대안 → 확인 질문 순서로 말하세요.`,
      ),
  },
  {
    hashtag: (locale) => pick(locale, "#RealActionOverApologies", "#금융치료와_현실보상"),
    color: "green",
    archetype_label: (locale) => pick(locale, "Practical-Reward, Results-Oriented Type", "현실 보상·실속형"),
    category: "wealth",
    psych_state: (upset, locale) =>
      pick(
        locale,
        `${upset} is disappointed by apologies that are just words. Real losses — time, money, labor — need to be made up for before their heart opens.`,
        `${upset}는 말로만 하는 사과에는 실망합니다. 시간·돈·노동 같은 실질적 손해가 메워져야 마음이 열립니다.`,
      ),
    avoid_actions: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 Repeating "sorry" in words only, brushing off the loss ${upset} took (time, money, childcare), or trying to smooth the mood without any compensation or concession.`,
        `【${partner} → ${upset}】 말로만 "미안해" 반복하기, ${upset}가 입은 손해(시간·돈·육아)를 가볍게 넘기기, 보상·양보 없이 분위기만 풀려 하기.`,
      ),
    solution_script: (partner, upset, locale) =>
      pick(
        locale,
        `【${partner} → ${upset}】 "I'll take care of all the childcare and chores this weekend. I booked the staycation you wanted to rest at." Or offer the real compensation ${upset} wanted, first. Action comes before words.`,
        `【${partner} → ${upset}】 "이번 주말 육아·살림은 내가 다 맡을게. 네가 쉬고 싶던 호캉스 예약해 뒀어." 또는 ${upset}가 원하던 실질적 보상을 먼저 제시하세요. 말보다 행동이 먼저입니다.`,
      ),
  },
];

function detailedCategoryScores(
  counts: TenGodCounts,
): Record<PrescriptionDef["category"], number> {
  return {
    self: (counts["비견"] ?? 0) * 2 + (counts["겁재"] ?? 0),
    food: (counts["상관"] ?? 0) * 2 + (counts["식신"] ?? 0),
    seal: (counts["정인"] ?? 0) * 2 + (counts["편인"] ?? 0),
    officer: (counts["정관"] ?? 0) * 2 + (counts["편관"] ?? 0),
    wealth: (counts["정재"] ?? 0) + (counts["편재"] ?? 0) * 2,
  };
}

function rankCategoriesForPerson(
  counts: TenGodCounts,
): PrescriptionDef["category"][] {
  const scores = detailedCategoryScores(counts);
  const max = Math.max(...Object.values(scores));
  const cats = (
    Object.entries(scores) as [PrescriptionDef["category"], number][]
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (max <= 0) {
    return ["self", "seal", "food", "officer", "wealth"];
  }
  return cats.map(([cat]) => cat);
}

function defByCategory(cat: PrescriptionDef["category"]): PrescriptionDef {
  return (
    HOME_DE_ESCALATION_PRESCRIPTIONS.find((d) => d.category === cat) ??
    HOME_DE_ESCALATION_PRESCRIPTIONS[0]!
  );
}

function buildCardFromDef(
  def: PrescriptionDef,
  upsetNickname: string,
  partnerNickname: string,
  locale: Locale,
): HomeDeEscalationCard {
  return {
    hashtag: def.hashtag(locale),
    color: def.color,
    archetype_label: def.archetype_label(locale),
    upset_nickname: upsetNickname,
    partner_nickname: partnerNickname,
    psych_state: def.psych_state(upsetNickname, locale),
    avoid_actions: def.avoid_actions(partnerNickname, upsetNickname, locale),
    solution_script: def.solution_script(partnerNickname, upsetNickname, locale),
  };
}

export function topCategory(counts: TenGodCounts): PrescriptionDef["category"] {
  return rankCategoriesForPerson(counts)[0]!;
}

/** 화난 사람 1명 기준 — 상대에게 명확히 역할을 분리한 처방 카드 */
export function buildHomeDeEscalationForPartner(params: {
  upsetNickname: string;
  partnerNickname: string;
  counts: TenGodCounts;
  locale?: Locale;
}): HomeDeEscalationCard {
  const cat = rankCategoriesForPerson(params.counts)[0]!;
  return buildCardFromDef(
    defByCategory(cat),
    params.upsetNickname,
    params.partnerNickname,
    params.locale ?? LEGACY_FALLBACK_LOCALE,
  );
}

/** 두 사람 각각 1순위 화 풀림 유형 — 같으면 shared_trigger 안내 */
export function buildHomeDeEscalationPair(params: {
  nicknameA: string;
  nicknameB: string;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  locale?: Locale;
}): HomeDeEscalationPair {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const catA = topCategory(params.countsA);
  const catB = topCategory(params.countsB);
  const defA = defByCategory(catA);
  const defB = defByCategory(catB);
  const shared_trigger = catA === catB;

  const shared_trigger_note = shared_trigger
    ? pick(
        locale,
        `${params.nicknameA} and ${params.nicknameB} share the same de-escalation type (${defA.archetype_label(locale)}). ` +
          `You're both prone to blowing up at similar points, so clashing "the same way" during a fight doubles the length of the argument. ` +
          `Have one of you declare a timeout first — "let's rest now and pick this up in 30 minutes" — and take turns using the prescription below.`,
        `${params.nicknameA}와 ${params.nicknameB}는 같은 화 풀림 유형(${defA.archetype_label(locale)})입니다. ` +
          `둘 다 비슷한 지점에서 터지기 쉬워, 싸울 때 '서로 같은 방식'으로 맞부딪히면 대화가 두 배로 길어집니다. ` +
          `한 명이 먼저 "지금은 쉬고 30분 뒤 다시"라고 타임아웃을 선언하고, 아래 처방을 번갈아 써 보세요.`,
      )
    : null;

  return {
    person_a: buildCardFromDef(
      defA,
      params.nicknameA,
      params.nicknameB,
      locale,
    ),
    person_b: buildCardFromDef(
      defB,
      params.nicknameB,
      params.nicknameA,
      locale,
    ),
    shared_trigger,
    shared_trigger_note,
  };
}

/** @deprecated 커플 합산 1장 — buildHomeDeEscalationPair 사용 */
export function pickHomeDeEscalationPrescription(params: {
  nicknameA: string;
  nicknameB: string;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
}): HomeDeEscalationCard {
  return buildHomeDeEscalationPair(params).person_a;
}

/** @deprecated buildHomeDeEscalationForPartner 사용 */
export function pickHomeDeEscalationForPerson(
  nickname: string,
  counts: TenGodCounts,
): HomeDeEscalationCard {
  return buildHomeDeEscalationForPartner({
    upsetNickname: nickname,
    partnerNickname: "상대",
    counts,
  });
}

export type ColdWarProtocol = {
  golden_time_note: string;
  reconciliation_cue_a: string;
  reconciliation_cue_b: string;
};

const RECONCILIATION_CUE_COPY: Record<
  Locale,
  Record<PrescriptionDef["category"], (nickname: string) => string>
> = {
  "en-US": {
    self: (n) => `Leave a short note or small gift acknowledging how much ${n} does — being seen and valued matters more than the words "I'm sorry."`,
    food: (n) => `Bring ${n} their favorite late-night snack without saying much — a shared bite does more than a long explanation.`,
    seal: (n) => `Give ${n} some alone time first, then quietly leave a favorite drink where they'll find it — presence without pressure.`,
    officer: (n) => `Suggest a concrete next plan to ${n} — "let's do X differently next time" — before any apology in words.`,
    wealth: (n) => `Offer ${n} something real — running an errand, covering a chore, a small treat — actions land better than words here.`,
  },
  "ko-KR": {
    self: (n) => `${n}에게 짧은 메모나 작은 선물로 그동안 고생을 알아준다는 걸 표현하세요 — "미안해"라는 말보다 존재를 인정받는 게 먼저예요.`,
    food: (n) => `${n}에게 좋아하는 야식을 말없이 사다 주세요 — 긴 설명보다 같이 먹는 한 입이 더 잘 통해요.`,
    seal: (n) => `${n}에게 먼저 혼자만의 시간을 주고, 좋아하는 음료를 조용히 거실에 두세요 — 압박 없이 곁에 있다는 신호면 충분해요.`,
    officer: (n) => `${n}에게 말로 사과하기 전에 "다음엔 이렇게 하자"는 구체적인 다음 계획을 먼저 제안하세요.`,
    wealth: (n) => `${n}에게 심부름·집안일 대신 해주기, 작은 선물처럼 실질적인 걸 챙겨주세요 — 여기선 말보다 행동이 더 잘 통해요.`,
  },
};

/**
 * Part5① 냉전 골든타임 & 화해 치트키 — 완전 신규 항목. 비겁(고집) 세기는
 * 이미 여러 곳에서 쓰는 카운트 패턴 그대로 재사용하고, 화해 치트키는 새
 * 십성 분류를 만들지 않고 기존 5카테고리(`topCategory`)를 그대로 확장한다.
 */
export function resolveColdWarProtocol(params: {
  nicknameA: string;
  nicknameB: string;
  countsA: TenGodCounts;
  countsB: TenGodCounts;
  locale?: Locale;
}): ColdWarProtocol {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const selfA = (params.countsA["비견"] ?? 0) + (params.countsA["겁재"] ?? 0);
  const selfB = (params.countsB["비견"] ?? 0) + (params.countsB["겁재"] ?? 0);

  const golden_time_note =
    selfA === selfB
      ? sanitizeHomeLifeText(
          pick(
            locale,
            `${params.nicknameA} and ${params.nicknameB} are evenly matched in stubbornness, so a cold war can drag on for either of you. Agree in advance: max 24 hours, or 2 days in separate rooms at the very most — no silent treatment beyond that.`,
            `${params.nicknameA}와 ${params.nicknameB} 둘 다 고집이 팽팽해서, 누구든 냉전이 길어질 수 있어요. 미리 정해두세요 — 최대 24시간, 길어도 각방 2일까지 — 그 이상 침묵은 안 됩니다.`,
          ),
        )
      : sanitizeHomeLifeText(
          pick(
            locale,
            `${selfA > selfB ? params.nicknameA : params.nicknameB} tends to hold their ground longer once upset, so a cold war can stretch out on their side. Agree in advance: max 24 hours, or 2 days in separate rooms at the very most — no silent treatment beyond that.`,
            `${selfA > selfB ? params.nicknameA : params.nicknameB} 쪽이 한번 삐치면 더 오래 버티는 편이라 냉전이 길어지기 쉬워요. 미리 정해두세요 — 최대 24시간, 길어도 각방 2일까지 — 그 이상 침묵은 안 됩니다.`,
          ),
        );

  const cueFor = (nickname: string, counts: TenGodCounts): string =>
    sanitizeHomeLifeText(RECONCILIATION_CUE_COPY[locale][topCategory(counts)](nickname));

  return {
    golden_time_note,
    reconciliation_cue_a: cueFor(params.nicknameA, params.countsA),
    reconciliation_cue_b: cueFor(params.nicknameB, params.countsB),
  };
}
