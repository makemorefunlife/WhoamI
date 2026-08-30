import type { PairFriendshipSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import {
  FRIEND_PRESCRIPTION_VERSION,
  type FriendPrescriptionItem,
  type FriendPrescriptionPack,
} from "./friendPrescriptionTypes";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./friendCopy";

const TEMP_LABEL: Record<
  Locale,
  Record<PairFriendshipSignals["johu_gap"]["band_a"], string>
> = {
  "en-US": {
    cold: "Cool",
    neutral: "Neutral",
    hot: "Warm",
  },
  "ko-KR": {
    cold: "차가움",
    neutral: "중립",
    hot: "열정",
  },
};

function buildEnergyDrainPrescription(
  pair: PairFriendshipSignals,
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): FriendPrescriptionItem | null {
  if (
    pair.energy_drain_band === "low" &&
    pair.energy_drain_index < 40
  ) {
    return null;
  }

  const { johu_gap } = pair;
  const tempLabel = TEMP_LABEL[locale];
  const summary = pick(
    locale,
    `A gap in your natural energy temperature makes it easy for one side to get tired first when you hang out. ` +
      `Heat gap ${johu_gap.heat_gap} · moisture gap ${johu_gap.moisture_gap} · ` +
      `energy-drain index ${pair.energy_drain_index} (${pair.energy_drain_band}). ` +
      `This is a ${nicknameA} (${tempLabel[johu_gap.band_a]}) ↔ ${nicknameB} (${tempLabel[johu_gap.band_b]}) pairing.`,
    `조후(한열조습) 격차로 만날 때 한쪽이 먼저 지치기 쉽습니다. ` +
      `열기 격차 ${johu_gap.heat_gap} · 습도 격차 ${johu_gap.moisture_gap} · ` +
      `기 빨림 지수 ${pair.energy_drain_index}(${pair.energy_drain_band}). ` +
      `${nicknameA}(${tempLabel[johu_gap.band_a]}) ↔ ${nicknameB}(${tempLabel[johu_gap.band_b]}) 조합입니다.`,
  );

  return {
    topic: "energy_drain_prevention",
    headline: pick(
      locale,
      "Why am I exhausted after hanging out? — an energy-drain prevention routine",
      "만나고 나면 왜 피곤하지? — 기 빨림 방지 루틴",
    ),
    evidence: {
      source: "pair_friendship_signals",
      signal_paths: [
        "energy_drain_index",
        "energy_drain_band",
        "johu_gap.heat_gap",
        "johu_gap.moisture_gap",
      ],
      summary,
      snapshot: {
        energy_drain_index: pair.energy_drain_index,
        energy_drain_band: pair.energy_drain_band,
        heat_gap: johu_gap.heat_gap,
        moisture_gap: johu_gap.moisture_gap,
        temperature_mismatch: johu_gap.temperature_mismatch,
        band_a: johu_gap.band_a,
        band_b: johu_gap.band_b,
      },
    },
    do_list: pick(
      locale,
      [
        "Before you meet up, share your 'energy budget for today' in 30 seconds — on tired days, keep it to a 30-minute coffee or a walk and call it there.",
        `For longer hangouts (2 hours+), take a 10-minute mid-way "phone/bathroom" break — a recovery window matters even if only one of ${nicknameA}/${nicknameB} did most of the talking.`,
        "Don't rush straight home after hanging out — spend 5 minutes texting one thing you enjoyed today. Parting without emotional closure is what leaves you drained.",
        "Once a month, set aside a 'light hangout only' day — just a meal together, no heavy venting sessions or drinking.",
      ],
      [
        "만남 전 '오늘 에너지 예산' 30분만 말하기 — 피곤한 날은 카페 30분·산책만으로 끝내기.",
        `긴 만남(2시간+)은 중간 10분 '각자 폰·화장실' 타임 — ${nicknameA}·${nicknameB} 중 한 명이 말을 많이 해도 회복 구간 필수.`,
        "만남 후 바로 집에 가지 말고 5분 '오늘 좋았던 1가지'만 문자로 교환 — 감정 정리 없이 헤어지면 기 빨림이 남습니다.",
        "월 1회 '가벼운 만남'만 하는 달 정하기 — 무거운 고민 상담·술자리 없이 밥만 먹는 날.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Don't push 'it's been a while, let's make it a long one today' on a tired day — the bigger the energy-temperature gap between you, the more poisonous a forced long hangout becomes.",
        "Don't unload a full life review — dating, work, family, all of it — in one sitting.",
        "Don't send long emotional texts after 11pm — it pre-drains the energy you'll need for your next hangout.",
        "Don't just stare at your phones the whole time and split — that's the classic pattern behind 'why am I more tired even though we hung out?'",
      ],
      [
        "피곤한 날 '오랜만인데 오늘은 길게 보자' 강요 — 조후 격차가 큰 페어일수록 억지 장시간 만남이 독입니다.",
        "만남 내내 상대 인생 전체 리뷰(연애·직장·가족) 한 번에 털기.",
        "카톡으로 밤 11시 이후 장문 감정 토로 — 다음 날 만남 에너지를 미리 깎습니다.",
        "만나서 휴대폰만 보다 헤어지기 — '같이 있었는데 왜 더 지치지?'의 전형적 패턴입니다.",
      ],
    ),
  };
}

function buildCommunicationPrescription(
  pair: PairFriendshipSignals,
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): FriendPrescriptionItem | null {
  const { johu_gap } = pair;
  if (!johu_gap.temperature_mismatch && johu_gap.heat_gap < 25) {
    return null;
  }

  const coldSide =
    johu_gap.band_a === "cold"
      ? nicknameA
      : johu_gap.band_b === "cold"
        ? nicknameB
        : null;
  const hotSide =
    johu_gap.band_a === "hot"
      ? nicknameA
      : johu_gap.band_b === "hot"
        ? nicknameB
        : null;

  const summary = johu_gap.temperature_mismatch
    ? pick(
        locale,
        `${coldSide ?? "One of you"} runs cool and ${hotSide ?? "the other"} runs warm in social energy, so contact frequency, conversation depth, and emotional pacing tend to drift out of sync.`,
        `${coldSide ?? "한쪽"}은 차갑고 ${hotSide ?? "한쪽"}은 열정적인 조후 밴드라, 연락 빈도·대화 깊이·감정 표현 속도가 어긋나기 쉽습니다.`,
      )
    : pick(
        locale,
        `A large heat gap (${johu_gap.heat_gap}) throws off your conversation tempo, which easily breeds the misread of "it feels like I'm the only one trying."`,
        `열기 격차(${johu_gap.heat_gap})가 커서 대화 템포가 맞지 않으면 '나만 노력하는 것 같다'는 오해가 생기기 쉽습니다.`,
      );

  return {
    topic: "communication_climate",
    headline: pick(
      locale,
      "Two different temperatures — custom communication ground rules",
      "온도 다른 두 사람 — 대화 소통 맞춤 규칙",
    ),
    evidence: {
      source: "pair_friendship_signals",
      signal_paths: [
        "johu_gap.temperature_mismatch",
        "johu_gap.heat_gap",
        "johu_gap.band_a",
        "johu_gap.band_b",
      ],
      summary,
      snapshot: {
        temperature_mismatch: johu_gap.temperature_mismatch,
        heat_gap: johu_gap.heat_gap,
        moisture_gap: johu_gap.moisture_gap,
        band_a: johu_gap.band_a,
        band_b: johu_gap.band_b,
      },
    },
    do_list: [
      pick(
        locale,
        "Agree on contact expectations with actual numbers — e.g., 'reply within 24 hours on weekdays, no pressure on weekends.'",
        "연락 기대치를 숫자로 합의 — 예: '평일 답장 24시간 이내, 주말은 자유'처럼.",
      ),
      coldSide
        ? pick(
            locale,
            `Tell ${coldSide} upfront, "it's fine to reply slowly unless it's urgent."`,
            `${coldSide}에게는 '급한 일 아니면 답장 천천해도 OK'라고 먼저 말해 주기.`,
          )
        : pick(
            locale,
            "Assume a slow reply is a difference in rhythm, not being ignored.",
            "답장이 느린 쪽에게 '무시'가 아니라 '리듬 차이'일 수 있음을 전제하기.",
          ),
      hotSide
        ? pick(
            locale,
            `${hotSide} should keep it light with a 1-minute voice note or a single photo instead of a long text wall — don't let enthusiasm turn into pressure.`,
            `${hotSide}는 긴 카톡 대신 음성 1분·사진 1장으로 가볍게 — 열정을 부담으로 바꾸지 않기.`,
          )
        : pick(
            locale,
            "Whoever expresses more emotion should check 'is now a serious-talk moment?' before diving into a deep conversation.",
            "감정 표현이 큰 쪽은 '지금 진지해?' 확인 한 번 후 깊은 이야기 시작.",
          ),
      pick(
        locale,
        "Once every three weeks, spend 5 minutes checking 'is how we're in touch still working?' — adjust before resentment builds.",
        "3주에 한 번 '우리 연락 방식 괜찮아?' 5분 체크 — 불만 쌓기 전에 조정.",
      ),
    ],
    dont_list: pick(
      locale,
      [
        "Don't run affection tests like 'don't you even like me?' — a difference in social temperature isn't the same as a lack of affection.",
        "Don't tease their reply speed in group chats or in front of others.",
        "Don't repeatedly hit the cool-side friend with sudden 'meet me right now' emergency summons.",
        "Don't just call the warm-side friend's messages 'too much' and cut them off with no alternative offered.",
      ],
      [
        "'너 나 안 좋아해?' 같은 애정 시험 — 조후 온도 차는 애정 부족과 다릅니다.",
        "단톡·모임에서 상대 답장 속도 놀리기.",
        "차가운 쪽에게 갑자기 '지금 당장 만나자' 긴급 소환 반복.",
        "열정적인 쪽의 연락을 '부담스럽다'만 말하고 대안 없이 끊기.",
      ],
    ),
  };
}

function buildFriendshipBaseline(
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): FriendPrescriptionItem {
  return {
    topic: "friendship_baseline",
    headline: pick(locale, "Baseline friendship-maintenance routine (for everyone)", "우정 유지 기본 루틴 (공통)"),
    evidence: {
      source: "pair_friendship_signals",
      signal_paths: ["friend_prescription.baseline"],
      summary: pick(
        locale,
        "Even when your pair signals don't spike sharply on any one topic, friendships still let small rhythm differences snowball into misunderstandings.",
        "pair 교차 신호가 특정 주제에서 강하게 치솟지 않아도, 우정은 작은 리듬 차이가 오해로 번지기 쉽습니다.",
      ),
      snapshot: {},
    },
    do_list: pick(
      locale,
      [
        `Lock in a "just-us light plan" once a quarter (a good meal, a walk) — take turns letting ${nicknameA} and ${nicknameB} lead it.`,
        "Say what's bothering you in one sentence within two weeks — don't let it pile up.",
        "When your friend's going through a hard time, lead with 'I'm here to listen' before jumping to advice.",
      ],
      [
        `분기 1회 '우리만의 가벼운 약속'(맛집·산책) 고정 — ${nicknameA}·${nicknameB} 번갈아 주도.`,
        "서운함은 2주 안에 한 문장으로 전달 — 쌓아 두지 않기.",
        "상대 힘든 시기엔 조언보다 '들을게' 한 마디 먼저.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Don't act close only on social media while never actually being in touch.",
        "Don't quiz or compare your friendship in front of mutual friends.",
        "Don't reach out after a long silence only to immediately ask for a favor.",
      ],
      [
        "SNS에서만 친한 척하고 실제 연락은 0.",
        "공통 지인 앞에서 우정 퀴즈·비교.",
        "오랜만에 연락 와서 바로 부탁만 하기.",
      ],
    ),
  };
}

/** Part5② 절친 싸움 해독제 & 우정 유지 체크리스트 — 신호 게이팅 없는 범용 안내(스펙 원문에 SSOT 소스 없음) */
function buildConflictTimeoutPrescription(
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): FriendPrescriptionItem {
  return {
    topic: "conflict_timeout_protocol",
    headline: pick(locale, "Fight antidote & friendship-maintenance checklist", "절친 싸움 해독제 & 우정 유지 체크리스트"),
    evidence: {
      source: "pair_friendship_signals",
      signal_paths: ["friend_prescription.conflict_timeout"],
      summary: pick(
        locale,
        "Right after a conflict is the worst time to hash it out — a short cooldown and a recurring check-in do more for the friendship long-term.",
        "갈등 직후는 감정을 다 쏟아내기 가장 나쁜 타이밍입니다 — 짧은 냉각기와 정기적인 체크인이 우정을 훨씬 오래 지켜줍니다.",
      ),
      snapshot: {},
    },
    do_list: pick(
      locale,
      [
        "Stop the argument the same day it happens and take a 24-hour timeout before revisiting it.",
        "After the timeout, each of you states your side in one sentence, then talk it through calmly.",
        `Lock in one recurring hangout per quarter for ${nicknameA} and ${nicknameB} — it resets the friendship before small frictions pile up.`,
      ],
      [
        "갈등이 생긴 당일엔 감정 싸움을 멈추고 24시간 타임아웃을 갖기.",
        "타임아웃 후 각자 입장을 한 문장으로 정리해서 차분하게 재대화하기.",
        `분기 1회 ${nicknameA}·${nicknameB}만의 고정 약속을 잡아 — 작은 마찰이 쌓이기 전에 관계를 리셋하기.`,
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Don't try to reach a conclusion while emotions are still running hot.",
        "Don't vent about the fight to a group chat or mutual friends during the timeout.",
        "Don't bring the same fight back up again once you've already made up.",
      ],
      [
        "감정이 격해진 상태에서 바로 결론 내리려 하지 않기.",
        "타임아웃 중에 단톡방이나 공통 지인에게 상황을 흘리지 않기.",
        "이미 화해한 싸움을 나중에 다시 소환해서 재점화하지 않기.",
      ],
    ),
  };
}

function resolveIntroLine(items: FriendPrescriptionItem[], locale: Locale): string {
  const topics = new Set(items.map((i) => i.topic));
  if (topics.has("energy_drain_prevention") && topics.has("communication_climate")) {
    return pick(
      locale,
      "This is a pairing where post-hangout fatigue and a mismatched conversation temperature can both kick in at once. Below is a practical prescription based on your pair.friendship cross-signals.",
      "만남 후 피로와 대화 온도 차가 동시에 작용하기 쉬운 조합입니다. 아래는 pair.friendship 교차 신호 기반 실천 처방입니다.",
    );
  }
  if (topics.has("energy_drain_prevention")) {
    return pick(
      locale,
      "There's a sign of energy drain when you hang out. Aligning your time and energy budget first will make this friendship last a lot longer.",
      "만남 시 기 빨림 신호가 있습니다. 시간·에너지 예산을 먼저 맞추면 우정이 훨씬 오래 갑니다.",
    );
  }
  if (topics.has("communication_climate")) {
    return pick(
      locale,
      "A gap in your natural hot/cold energy makes contact and emotional tempo easy to mismatch. Use the rules below to cut down on misunderstandings.",
      "조후(한열) 밴드 격차로 연락·감정 템포가 어긋나기 쉽습니다. 아래 규칙으로 오해를 줄이세요.",
    );
  }
  return pick(
    locale,
    "This is a practical prescription based on your friend-pair cross-signals — separate from, and meant to complement, the Social DNA narrative above.",
    "친구 pair 교차 신호 기반 실행 처방입니다. 기존 Social DNA 서사와 별도로 실천용입니다.",
  );
}

export function buildFriendPrescriptions(params: {
  pair: PairFriendshipSignals;
  nicknameA: string;
  nicknameB: string;
  locale?: Locale;
}): FriendPrescriptionPack {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const candidates = [
    buildEnergyDrainPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
      locale,
    ),
    buildCommunicationPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
      locale,
    ),
  ].filter((item): item is FriendPrescriptionItem => item != null);

  const items =
    candidates.length > 0
      ? candidates
      : [buildFriendshipBaseline(params.nicknameA, params.nicknameB, locale)];

  if (candidates.length > 0 && candidates.length < 2) {
    items.push(buildFriendshipBaseline(params.nicknameA, params.nicknameB, locale));
  }

  // Part5② 싸움 해독제 체크리스트 — 스펙 원문에 SSOT 소스가 없는 유일한 항목이라 항상 포함.
  items.push(buildConflictTimeoutPrescription(params.nicknameA, params.nicknameB, locale));

  const priority: Record<FriendPrescriptionItem["topic"], number> = {
    energy_drain_prevention: 100,
    communication_climate: 85,
    conflict_timeout_protocol: 60,
    friendship_baseline: 10,
  };
  items.sort((a, b) => priority[b.topic] - priority[a.topic]);

  return {
    schema_version: FRIEND_PRESCRIPTION_VERSION,
    intro_line: resolveIntroLine(items, locale),
    items,
  };
}
