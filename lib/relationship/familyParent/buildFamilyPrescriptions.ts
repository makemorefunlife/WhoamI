import type { PairFamilySignals } from "@/lib/personCore/sajuSignals/pairTypes";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import type { Locale } from "@/lib/i18n/locale";
import {
  FAMILY_PRESCRIPTION_VERSION,
  type FamilyPrescriptionItem,
  type FamilyPrescriptionPack,
} from "./familyPrescriptionTypes";
import { applyGuidanceFitToneToPrescriptions } from "./familyGuidancePrescriptionTone";

function buildUmbilicalPrescription(
  pair: PairFamilySignals,
  parentNickname: string,
  childNickname: string,
  locale: Locale,
): FamilyPrescriptionItem | null {
  if (pair.umbilical_band === "low" && pair.umbilical_separation_index < 40) {
    return null;
  }

  const summary = pick(
    locale,
    `Closeness–boundary task index ${pair.umbilical_separation_index} (${pair.umbilical_band}). When "too close" and "too distant" signals overlap between ${parentNickname} and ${childNickname}, care can easily be read as interference — or distance as neglect.`,
    `가까움·경계 조율 과제 지수 ${pair.umbilical_separation_index}(${pair.umbilical_band}). ` +
      `${parentNickname}와 ${childNickname} 사이에 '너무 가깝거나 너무 멀다'는 양극 신호가 겹치면, ` +
      `돌봄이 간섭으로, 거리두기가 방임으로 오해되기 쉽습니다.`,
  );

  return {
    topic: "umbilical_independence",
    headline: pick(
      locale,
      "Stay Connected, Keep Space — A Boundary-Tuning Routine",
      "연결은 유지하되 공간은 지키기 — 경계 조율 루틴",
    ),
    evidence: {
      source: "pair_family_signals",
      signal_paths: [
        "umbilical_separation_index",
        "umbilical_band",
      ],
      summary,
      snapshot: {
        umbilical_separation_index: pair.umbilical_separation_index,
        umbilical_band: pair.umbilical_band,
      },
    },
    do_list: pick(
      locale,
      [
        `${parentNickname}, before giving advice, spend 1 minute "listening" — let ${childNickname} finish what they're saying.`,
        `When ${childNickname} is about to share an important decision, state upfront whether it's "asking for input" or "just letting you know."`,
        "Once a week, promise '2 hours with no contact' — hobbies, friends, rest, each on your own. It's breathing room, not a cutoff.",
        "Write down just 3 house rules and post them on the fridge — leave the rest open to negotiation.",
        `${parentNickname} and ${childNickname} each write down '1 thing I don't want intruded on' on a card and swap them.`,
      ],
      [
        `${parentNickname}는 '조언' 전에 '들을게' 1분 — ${childNickname}가 말 끝까지 하게 두기.`,
        `${childNickname}는 중요한 결정을 먼저 공유할 때 '의견 구함 vs 통보'를 문장 첫머리에 밝히기.`,
        "주 1회 '연락 없는 2시간' 약속 — 각자 취미·친구·휴식. 단절이 아니라 호흡입니다.",
        "집안 규칙 3개만 적어 냉장고에 붙이기 — 나머지는 협상 대상으로 두기.",
        `${parentNickname}·${childNickname} 각각 '침범받기 싫은 1가지'를 카드에 적어 교환.`,
      ],
    ),
    dont_list: pick(
      locale,
      [
        `${parentNickname} checking ${childNickname}'s room, phone, or social media without permission "out of worry."`,
        `${childNickname} venting every complaint on the assumption that "you should just know."`,
        "Correcting each other in front of relatives at meals or holidays.",
        "Putting the other 'on trial' with their upbringing — the past explains, it doesn't excuse.",
        "Using a communication blackout as punishment or a threat.",
      ],
      [
        `${parentNickname}가 ${childNickname} 방·휴대폰·SNS를 '걱정' 명목으로 무단 확인하기.`,
        `${childNickname}가 모든 불만을 '당연히 알아야지' 전제로 터뜨리기.`,
        "식사·명절 자리에서 제3자(친척) 앞에서 서로 교정하기.",
        "'네가 어떻게 자랐는데' 역사 재판 — 과거는 이유 설명용, 면죄부 아님.",
        "연락 두절을 벌·협박 카드로 쓰기.",
      ],
    ),
  };
}

function buildNaggingKarmaPrescription(
  pair: PairFamilySignals,
  parentNickname: string,
  childNickname: string,
  locale: Locale,
): FamilyPrescriptionItem | null {
  if (
    pair.nagging_band === "low" &&
    pair.nagging_trigger_index < 40 &&
    pair.combined_karma_tension < 35
  ) {
    return null;
  }

  const summary = pick(
    locale,
    `Nagging-trigger index ${pair.nagging_trigger_index} (${pair.nagging_band}), repeated family-tension score ${pair.combined_karma_tension}. When an overactive "care/seal" signal overlaps with household friction, a single remark from ${parentNickname} can sound to ${childNickname} like "the same old fight starting again."`,
    `잔소리 트리거 지수 ${pair.nagging_trigger_index}(${pair.nagging_band}), ` +
      `반복되는 가족 긴장 점수 ${pair.combined_karma_tension}. ` +
      `돌봄·챙김 신호가 과하고 집안 마찰 신호와 겹치면, ${parentNickname}의 한마디가 ${childNickname}에게 '또 그 싸움이 시작됐다'처럼 들리기 쉽습니다.`,
  );

  return {
    topic: "nagging_karma_avoidance",
    headline: pick(
      locale,
      "It's Not Just Nagging — A Routine to Soften Repeating Conflict",
      "잔소리가 아니라 신호 — 반복 갈등을 줄이는 루틴",
    ),
    evidence: {
      source: "pair_family_signals",
      signal_paths: [
        "nagging_trigger_index",
        "nagging_band",
        "combined_karma_tension",
      ],
      summary,
      snapshot: {
        nagging_trigger_index: pair.nagging_trigger_index,
        nagging_band: pair.nagging_band,
        combined_karma_tension: pair.combined_karma_tension,
      },
    },
    do_list: pick(
      locale,
      [
        `${parentNickname}, skip the nagging — give just '1 fact + 1 request.' e.g. "You were late twice this week. Please text me before 11pm next time."`,
        `${childNickname}, before getting defensive, acknowledge '1 thing that's fair' first, then offer your alternative.`,
        "Repeated topics (grades, jobs, dating, money) get one 10-minute time box a week — if it runs over, it carries to next week.",
        "No 're-litigating' for 24 hours right after a big conflict — only revisit once emotions have cooled.",
        `Before family events, agree on '1 forbidden phrase each' for ${parentNickname} and ${childNickname} — e.g. "you always," "there you go again."`,
      ],
      [
        `${parentNickname}는 잔소리 대신 '사실 1개 + 요청 1개'만 — 예: '이번 주 2회 늦었어. 다음엔 11시 전에 연락해 줘.'`,
        `${childNickname}는 방어 전에 '맞는 부분 1가지' 인정 후 대안 제시.`,
        "같은 주제(성적·취업·연애·돈)는 주 1회·10분 타임박스 — 넘기면 다음 주로.",
        "큰 갈등 직후 24시간 '재청구 금지' — 감정 온도 내려간 뒤에만 재논의.",
        `가족 행사 전 '${parentNickname}·${childNickname} 각자 금기어 1개' 합의 — 예: '너 항상', '또 그 소리'.`,
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Comparative nagging — 'so-and-so is doing so well' lights up old friction instantly.",
        "Bringing up money, marriage, or career at every single meal.",
        `Telling relatives or siblings about ${childNickname}'s mistake first.`,
        `Reading ${parentNickname}'s worry as "control," and ${childNickname}'s distance as "betrayal."`,
        "Dragging up a 10-year-old incident as evidence every time.",
      ],
      [
        "비교 잔소리 — '○○는 잘하는데'는 익숙한 마찰을 바로 점화합니다.",
        "돈·결혼·직업을 매 식사마다 반복하기.",
        `${childNickname} 실수를 친척·형제에게 먼저 말하기.`,
        `${parentNickname}의 걱정을 '통제'로, ${childNickname}의 거리두기를 '배신'으로 해석하기.`,
        "과거 사건(10년 전)을 매번 증거로 꺼내기.",
      ],
    ),
  };
}

export function buildFamilyBaseline(
  parentNickname: string,
  childNickname: string,
  locale: Locale,
): FamilyPrescriptionItem {
  return {
    topic: "family_baseline",
    headline: pick(
      locale,
      "Baseline Routine for Sustaining the Family Relationship (Shared)",
      "가족 관계 유지 기본 루틴 (공통)",
    ),
    evidence: {
      source: "pair_family_signals",
      signal_paths: ["family_prescription.baseline"],
      summary: pick(
        locale,
        "Even when cross-signals don't spike on any one topic, parents and children can carry small differences in tone for a long time. These are shared habits that keep the relationship steady.",
        "특정 주제가 강하게 치솟지 않아도, 부모·자녀는 작은 말투 차이가 오래 갑니다. 관계를 안정적으로 유지하는 공통 습관입니다.",
      ),
      snapshot: {},
    },
    do_list: pick(
      locale,
      [
        `Once a month, '${parentNickname} & ${childNickname} 20-minute coffee' — no agenda, just catching up.`,
        "Show gratitude through one action — don't just repeat 'thanks' in words.",
        "Big decisions go through 3 steps: share information → reflect → decide.",
      ],
      [
        `월 1회 '${parentNickname}·${childNickname} 커피 20분' — 안건 없이 근황만.`,
        "고마움은 행동 1개로 — 말만 '고마워' 반복하지 않기.",
        "큰 결정은 '정보 주 → 숙려 → 결정' 3단계로.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Long, naggy texts after 11pm when everyone's tired.",
        "Lecturing or arguing in front of others.",
        "Papering over conflict with gifts or money alone.",
      ],
      [
        "피곤한 밤 11시 이후 장문 카톡 잔소리.",
        "제3자 앞에서 훈계·반박.",
        "선물·돈으로 갈등 덮기만 하기.",
      ],
    ),
  };
}

function resolveIntroLine(
  items: FamilyPrescriptionItem[],
  locale: Locale,
  baselineOnly: boolean,
): string {
  if (baselineOnly) {
    return pick(
      locale,
      "Pair cross-signals weren't available for this report, so here's a shared baseline routine — practical habits, not a prediction.",
      "이번 리포트에는 관계 교차 신호가 없어, 공통 기본 루틴만 담았어요 — 확정 예언이 아니라 실천 습관입니다.",
    );
  }
  const topics = new Set(items.map((i) => i.topic));
  if (
    topics.has("umbilical_independence") &&
    topics.has("nagging_karma_avoidance")
  ) {
    return pick(
      locale,
      "This pairing often activates both closeness–boundary tension and repeating nagging friction. Below is a practical prescription from your family pair signals.",
      "가까움·경계 긴장과 잔소리처럼 반복되는 마찰이 동시에 오기 쉬운 조합입니다. 아래는 가족 관계 신호 기반 실천 처방입니다.",
    );
  }
  if (topics.has("umbilical_independence")) {
    return pick(
      locale,
      "A closeness–boundary task shows up in this pair. Fix the line between care and interference with concrete actions.",
      "이 조합에는 가까움과 경계의 조율 과제가 있어요. 돌봄과 간섭의 경계를 행동으로 고정하세요.",
    );
  }
  if (topics.has("nagging_karma_avoidance")) {
    return pick(
      locale,
      "Repeating nagging triggers have been detected. Changing the form and timing of your words changes the response.",
      "반복되는 잔소리 트리거가 감지됐습니다. 말의 형식과 타이밍을 바꾸면 반응이 달라집니다.",
    );
  }
  return pick(
    locale,
    "This is a practical prescription from family pair signals — for action, separate from the Child DNA narrative above.",
    "가족 관계 신호 기반 실행 처방입니다. 위의 Child DNA 서사와 별도로 실천용입니다.",
  );
}

/**
 * pair 있으면 signal-aware(+필요 시 baseline 보강).
 * pair 없으면 baseline-only (새 signal 추측 금지).
 */
export function buildFamilyPrescriptions(params: {
  pair?: PairFamilySignals | null;
  parentNickname: string;
  childNickname: string;
  locale?: Locale;
}): FamilyPrescriptionPack {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const pair = params.pair ?? null;

  if (!pair) {
    const items = [
      buildFamilyBaseline(params.parentNickname, params.childNickname, locale),
    ];
    return {
      schema_version: FAMILY_PRESCRIPTION_VERSION,
      intro_line: resolveIntroLine(items, locale, true),
      items,
    };
  }

  const candidates = [
    buildUmbilicalPrescription(
      pair,
      params.parentNickname,
      params.childNickname,
      locale,
    ),
    buildNaggingKarmaPrescription(
      pair,
      params.parentNickname,
      params.childNickname,
      locale,
    ),
  ].filter((item): item is FamilyPrescriptionItem => item != null);

  const items =
    candidates.length > 0
      ? candidates
      : [buildFamilyBaseline(params.parentNickname, params.childNickname, locale)];

  if (candidates.length > 0 && candidates.length < 2) {
    items.push(
      buildFamilyBaseline(params.parentNickname, params.childNickname, locale),
    );
  }

  const priority: Record<FamilyPrescriptionItem["topic"], number> = {
    nagging_karma_avoidance: 100,
    umbilical_independence: 90,
    family_baseline: 10,
  };
  items.sort((a, b) => priority[b.topic] - priority[a.topic]);

  const pack: FamilyPrescriptionPack = {
    schema_version: FAMILY_PRESCRIPTION_VERSION,
    intro_line: resolveIntroLine(items, locale, false),
    items,
  };

  // Part2 C guidance_fit — 전달 톤 보조만 (bucket/item 수/핵심 지침 불변)
  return applyGuidanceFitToneToPrescriptions(
    pack,
    pair.guidance_fit,
    locale,
  );
}
