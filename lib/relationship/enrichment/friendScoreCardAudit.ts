import type { Locale } from "@/lib/i18n/locale";
import type { FriendScoringSignals } from "@/lib/saju/friendAnalysis";
import type { FriendMasterScores } from "@/lib/relationship/friendEventScores";
import type {
  FriendScoreCardAudit,
  FriendScoreCardAuditItem,
} from "@/lib/relationship/friend/friendKillerSections";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/friend/friendCopy";

/**
 * current_enriched 전용 — 3대 스코어(🔥 우정 케미 · 🧩 티키타카 · ⚡ 소셜 리스크,
 * `computeFriendMasterScores` in friendEventScores.ts)를 실제 계산 코드까지
 * 추적해 감사하고, 각 카드에 "무엇을 측정하는지 / 이 커플이 왜 이 점수인지 /
 * 높음·중간·낮음 의미"를 붙인다.
 *
 * 계산 근거(friendEventScores.ts computeFriendMasterScores):
 * - connection(우정 케미) = 50 시작. +30 일지합(hasDayBranchCombine) · +20
 *   비겁 상호공명(hasBijiepMutualResonance) · −20 일지 충형(hasDayBranchChungHyung).
 *   → "본능적으로 편안하게 끌리는 정도". 높을수록 좋음.
 * - banter(티키타카) = 50 시작. +25 식상-인성 조화(hasFoodSealHarmony) · +25
 *   조후 보완(hasJohuComplement) · −20 식상 충돌(hasFoodClashFriction).
 *   → "대화·유머가 잘 맞는 정도". 높을수록 좋음.
 * - risk(소셜 리스크) = 10 시작. +35 일지 충형해파(hasDayBranchFullTension) ·
 *   +25 원진/귀문(hasWonjinOrGuimun) · +15 재관 충돌(hasWealthOfficerClash).
 *   → "마찰·갈등 가능성". 다른 두 점수와 반대로 **낮을수록 좋음**(방향 혼동 방지
 *   문구를 measures에 명시).
 *
 * 라벨(우정 케미/티키타카/소셜 리스크) 자체는 실제 계산과 잘 맞아 이름 변경은
 * 하지 않는다 — 설명만 보강한다.
 */

function connectionMeasures(locale: Locale): string {
  return pick(
    locale,
    "How instinctively comfortable and drawn to each other you are — calculated from the kind of 'click' that doesn't need an explanation.",
    "두 사람이 만났을 때 얼마나 본능적으로 편안하게 끌리는지를 보는 점수예요. '이유 없이 통하는' 사주 궁합 신호를 기준으로 계산해요.",
  );
}

function connectionLevelMeaning(locale: Locale): string {
  return pick(
    locale,
    "70+: a click so natural it barely needs effort · 40–69: comfortable and steady, nothing dramatic · under 40: might start a little reserved, but deepens with time invested.",
    "70% 이상: 눈빛만 봐도 통하는, 애쓰지 않아도 편안한 사이 · 40~69%: 무난하고 안정적으로 편안한 사이 · 40% 미만: 처음엔 살짝 서먹할 수 있지만 시간을 들이면 깊어지는 사이.",
  );
}

function connectionWhy(
  sig: FriendScoringSignals,
  nameA: string,
  nameB: string,
  score: number,
  locale: Locale,
): string {
  const parts: string[] = [];
  if (sig.hasDayBranchCombine) {
    parts.push(
      pick(
        locale,
        `${nameA} and ${nameB}'s charts line up in a way that pushed this score up — an instinctive, low-effort closeness.`,
        `${nameA}·${nameB}의 사주 궁합이 잘 맞아서 점수가 올라갔어요 — 애쓰지 않아도 본능적으로 편안하게 통하는 지점이에요.`,
      ),
    );
  }
  if (sig.hasBijiepMutualResonance) {
    parts.push(
      pick(
        locale,
        "Your core temperaments resonate with each other, adding to the sense of 'we're the same kind of person.'",
        "둘의 기본 기질이 서로 공명해서 '우리 결이 비슷하다'는 느낌을 더해줘요.",
      ),
    );
  }
  if (sig.hasDayBranchChungHyung) {
    parts.push(
      pick(
        locale,
        "There's also a clash signal between you, which pulled the score down a bit — a sharper edge you can bump into occasionally.",
        "다만 서로 부딪히는 신호도 있어서 점수를 깎아 먹었어요 — 가끔 뾰족하게 부딪힐 수 있는 지점이에요.",
      ),
    );
  }
  if (parts.length === 0) {
    parts.push(
      pick(
        locale,
        `No strong pull or clash signal fired for either of you, so this sits near the neutral baseline (${score}%) — comfortable, without a dramatic instant spark.`,
        `특별히 강하게 당기거나 부딪히는 신호가 없어서 중간 기본값(${score}%)에 머물러요 — 극적인 첫 스파크는 아니지만 무난하게 편안한 편이에요.`,
      ),
    );
  }
  return parts.join(" ");
}

function banterMeasures(locale: Locale): string {
  return pick(
    locale,
    "How well the back-and-forth banter and sense of humor click — calculated from how well your expression and reactions harmonize, and how well your temperaments complement each other.",
    "대화가 핑퐁처럼 잘 오가고 유머 코드가 맞아떨어지는 정도예요. 표현과 리액션의 조화, 그리고 성향의 온도차를 서로 상쇄하는지를 사주 신호로 계산해요.",
  );
}

function banterLevelMeaning(locale: Locale): string {
  return pick(
    locale,
    "65+: banter that rarely runs dry, the kind that can go all night · 35–64: an easy, steady back-and-forth when it matters · under 35: conversation leans calm rather than high-energy.",
    "65% 이상: 티키타카가 잘 안 마르는, 밤새 떠들어도 안 지치는 사이 · 35~64%: 필요할 때 적당히 주고받는 무난한 대화 궁합 · 35% 미만: 대화가 강렬하기보단 잔잔하게 흘러가는 편.",
  );
}

function banterWhy(
  sig: FriendScoringSignals,
  score: number,
  locale: Locale,
): string {
  const parts: string[] = [];
  if (sig.hasFoodSealHarmony) {
    parts.push(
      pick(
        locale,
        "Your expression and reaction signals are in harmony, which is what keeps the conversational rhythm flowing.",
        "표현과 리액션 신호가 조화를 이뤄서 대화의 핑퐁 리듬을 만들어줘요.",
      ),
    );
  }
  if (sig.hasJohuComplement) {
    parts.push(
      pick(
        locale,
        "Your temperaments complement each other, smoothing out any energy mismatch when you're chatting.",
        "두 사람의 성향 온도가 서로 보완돼서, 대화할 때 텐션 차이가 자연스럽게 상쇄돼요.",
      ),
    );
  }
  if (sig.hasFoodClashFriction) {
    parts.push(
      pick(
        locale,
        "There's also a friction signal in how you each express yourselves, which pulled the score down — humor or communication timing can occasionally miss each other.",
        "다만 표현이 부딪히는 신호도 있어서 점수를 깎아 먹었어요 — 유머나 대화 타이밍이 가끔 어긋날 수 있어요.",
      ),
    );
  }
  if (parts.length === 0) {
    parts.push(
      pick(
        locale,
        `No strong harmony or clash signal fired, so this sits near the neutral baseline (${score}%) — a steady conversational fit without extremes.`,
        `특별히 강하게 맞거나 부딪히는 신호가 없어서 중간 기본값(${score}%)에 머물러요 — 극단적이진 않지만 무난하게 대화가 통하는 편이에요.`,
      ),
    );
  }
  return parts.join(" ");
}

function riskMeasures(locale: Locale): string {
  return pick(
    locale,
    "How likely friction or conflict is between you. Unlike the other two scores, LOWER is better here — it's calculated from clash-prone signals in your charts.",
    "친구 사이에 마찰·갈등이 생길 가능성을 보는 점수예요. 우정 케미·티키타카와 반대로 이 점수는 낮을수록 좋아요 — 부딪히기 쉬운 사주 신호를 기준으로 계산해요.",
  );
}

function riskLevelMeaning(locale: Locale): string {
  return pick(
    locale,
    "under 30: rarely clashes, low-maintenance · 30–59: occasional small friction worth knowing about ahead of time · 60+: clear friction points — worth keeping this report's de-escalation card handy.",
    "30% 미만: 웬만해선 안 부딪히는 무난한 편 · 30~59%: 가끔 사소하게 부딪힐 수 있어 미리 알아두면 좋은 정도 · 60% 이상: 갈등 포인트가 뚜렷해서 이 리포트의 '절친 싸움 해독제'를 참고해두면 좋은 편.",
  );
}

function riskWhy(
  sig: FriendScoringSignals,
  score: number,
  locale: Locale,
): string {
  const parts: string[] = [];
  if (sig.hasDayBranchFullTension) {
    parts.push(
      pick(
        locale,
        "There's a strong tension signal between your charts, which is the main driver pushing this score up.",
        "두 사람 사이에 강한 긴장 신호가 있어서, 이게 점수를 끌어올리는 주된 이유예요.",
      ),
    );
  }
  if (sig.hasWonjinOrGuimun) {
    parts.push(
      pick(
        locale,
        "There's also a signal for the kind of friction that flares up over things that are hard to explain logically.",
        "논리적으로 설명하기 어려운 지점에서 갑자기 예민해질 수 있는 신호도 있어요.",
      ),
    );
  }
  if (sig.hasWealthOfficerClash) {
    parts.push(
      pick(
        locale,
        "There's also a signal meaning money or fairness/rules disputes are a likely friction point.",
        "돈이나 공정함·규칙 문제로 부딪힐 가능성을 보이는 신호도 있어요.",
      ),
    );
  }
  if (parts.length === 0) {
    parts.push(
      pick(
        locale,
        `None of the clash-prone signals fired, so this sits at the low baseline (${score}%) — a low-friction pair by default.`,
        `부딪히기 쉬운 신호가 하나도 뜨지 않아서 낮은 기본값(${score}%)에 머물러요 — 기본적으로 마찰이 적은 조합이에요.`,
      ),
    );
  }
  return parts.join(" ");
}

function buildItem(
  measures: string,
  why: string,
  levelMeaning: string,
): FriendScoreCardAuditItem {
  return { measures, why, level_meaning: levelMeaning };
}

export function buildFriendScoreCardAudit(params: {
  sig: FriendScoringSignals;
  scores: FriendMasterScores;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): FriendScoreCardAudit {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const { sig, scores, nameA, nameB } = params;

  return {
    connection: buildItem(
      connectionMeasures(locale),
      connectionWhy(sig, nameA, nameB, scores.connection, locale),
      connectionLevelMeaning(locale),
    ),
    banter: buildItem(
      banterMeasures(locale),
      banterWhy(sig, scores.banter, locale),
      banterLevelMeaning(locale),
    ),
    risk: buildItem(
      riskMeasures(locale),
      riskWhy(sig, scores.risk, locale),
      riskLevelMeaning(locale),
    ),
  };
}
