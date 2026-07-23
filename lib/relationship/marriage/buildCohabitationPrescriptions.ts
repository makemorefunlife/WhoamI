import type { PairCohabitationSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import {
  COHABITATION_PRESCRIPTION_VERSION,
  type CohabitationPrescriptionItem,
  type CohabitationPrescriptionPack,
} from "./cohabitationPrescriptionTypes";
import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import { LEGACY_FALLBACK_LOCALE, pick } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";

const TENSION_BRANCH_TYPES = new Set(["충", "형", "해", "파"]);

function sanitizeItem(item: CohabitationPrescriptionItem): CohabitationPrescriptionItem {
  return {
    ...item,
    headline: sanitizeHomeLifeText(item.headline),
    evidence: {
      ...item.evidence,
      summary: sanitizeHomeLifeText(item.evidence.summary),
    },
    do_list: item.do_list.map((line) => sanitizeHomeLifeText(line)),
    dont_list: item.dont_list.map((line) => sanitizeHomeLifeText(line)),
  };
}

function leaderLabel(
  side: PairCohabitationSignals["cfo_power_struggle"]["leader_side"],
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): string {
  if (side === "a") return nicknameA;
  if (side === "b") return nicknameB;
  return pick(locale, "both of you", "둘 다");
}

function buildSecretAffinityPrescription(
  pair: PairCohabitationSignals,
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): CohabitationPrescriptionItem | null {
  const { secret_affinity } = pair;
  if (!secret_affinity.present && secret_affinity.affinity_index < 45) {
    return null;
  }

  const linkCount = secret_affinity.links.length;
  const summary = pick(
    locale,
    linkCount > 0
      ? `Signals of an attraction that's hard to put into words overlap in ${linkCount} places. Even unspoken, there's an axis where you're drawn to each other, so emotion can easily overheat during conflict — like "why am I this angry?"`
      : `The attraction signal is weak, but the intimacy index (${secret_affinity.affinity_index}) is high, so there's a pattern of reacting through body and mood before working things out in words.`,
    linkCount > 0
      ? `말로 설명하기 어려운 끌림 신호가 ${linkCount}곳에서 겹쳐요. 겉으로는 말하지 않아도 서로 끌리는 축이 있어, 갈등 때 '왜 이렇게까지 화가 나지?'처럼 감정이 과열되기 쉽습니다.`
      : `끌림 신호는 약하지만 친밀 지수(${secret_affinity.affinity_index})가 높아, 말로 풀기 전에 몸과 분위기로 먼저 반응하는 패턴이 있습니다.`,
  );

  return sanitizeItem({
    topic: "secret_affinity",
    headline: pick(
      locale,
      "A Pull That Doesn't Need Words — Turning Nonverbal Intimacy Into a Relationship Asset",
      "말하지 않아도 당기는 힘 — 비언어적 친밀을 관계 자산으로 쓰기",
    ),
    evidence: {
      source: "pair_cohabitation_signals",
      signal_paths: [
        "secret_affinity.present",
        "secret_affinity.links",
        "secret_affinity.affinity_index",
      ],
      summary,
      snapshot: {
        secret_affinity_present: secret_affinity.present,
        affinity_index: secret_affinity.affinity_index,
        affinity_link_count: linkCount,
      },
    },
    do_list: pick(
      locale,
      [
        `Set a weekly 30-minute "no explanation needed" time — ${nicknameA} and ${nicknameB} both leave phones in the living room and just share the same space. Don't set a conversation topic — just check whether your bodies settle first.`,
        "Right after a fight, skip 'who's right' and just say one line — 'we're both on edge right now' — then take a 20-minute cooldown. Recovery comes when the mood settles, more than from talking it out.",
        "Designate the bedroom or living room as a 'no criticism zone,' where chore nagging, money talk, and in-law talk are off-limits — for couples with an intimacy axis, everyday nagging cuts into closeness more.",
        "Once a month, add just one new 'thing only we know' routine (a late-night snack, a walk route, a weekend wake-up time) — a repeating routine locks in the attraction positively.",
      ],
      [
        `주 1회 '설명 없는 시간' 30분을 정해 ${nicknameA}와 ${nicknameB} 둘 다 폰을 거실에 두고 같은 공간에만 있기 — 대화 주제를 정하지 말고, 몸이 먼저 안정되는지 확인하세요.`,
        "싸운 직후에는 '누가 맞는지' 대신 '지금 우리 둘 다 예민한 상태'라고 한 문장만 말하고 20분 쿨다운 — 말로 풀리기보다 분위기가 풀릴 때 회복됩니다.",
        "침실·거실 중 한 곳을 '비판 금지 구역'으로 정하고, 그 안에서는 집안일 지적·돈 이야기·시댁·처가 이야기를 금지 — 친밀 축이 있는 커플일수록 일상 잔소리가 친밀감을 깎습니다.",
        "한 달에 한 번 '우리만 아는 루틴'(야식 메뉴, 산책 코스, 주말 기상 시간)을 새로 하나만 추가 — 반복 루틴이 끌림을 긍정적으로 고정합니다.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        `Interrogating like "you're hiding something from me, aren't you?" and forcing intimacy into a "secrecy and distrust" frame — no matter which of ${nicknameA} or ${nicknameB} says it first, interrogation cuts the intimacy index immediately.`,
        "Using affection as a test during conflict, like 'so do you even actually like me?' — intimacy is for recovery, not for passing a test.",
        "Overstating the couple image on social media or in front of friends, then having a cold war at home as backlash — the bigger the gap between the outside and inside temperature, the bigger the blow-up at home.",
        "Rationalizing 'we don't need to say it, we just get it' and leaving important agreements (money, childcare, moving) as verbal only.",
      ],
      [
        `"너 나한테 숨기는 거 있지?"처럼 추궁하며 친밀감을 '비밀·불신' 프레임으로 몰아붙이기 — ${nicknameA}와 ${nicknameB} 중 누가 먼저 말하든, 추궁은 친밀 지수를 바로 깎습니다.`,
        "갈등 중 '그래서 네가 나 좋아하는 거 맞아?'처럼 애정을 시험 대상으로 쓰기 — 친밀감은 시험 통과용이 아니라 회복용입니다.",
        "SNS·친구 앞에서 커플 이미지를 과장해 보이려다 집에서 반동으로 냉전하기 — 겉과 속의 온도 차가 클수록 집안 폭발이 커집니다.",
        "말 없이도 통한다는 이유로 '말 안 해도 알겠지'를 합리화하며 중요한 약속(돈·육아·이사)을 구두로만 넘기기.",
      ],
    ),
  });
}

/**
 * Money-control struggle prescription — PersonCore pair affinity only.
 * `leader_side` = who tends to intensify money-power tension (not operating CFO).
 * Do not map to `section_money_chores.cfo_nickname` or re-call refineHouseholdCfo.
 * 돈 주도권 갈등 처방전 — pair affinity만 사용.
 * leader_side = 갈등을 키우기 쉬운 쪽(운영 CFO 담당자와 별개).
 */
function buildCfoPowerPrescription(
  pair: PairCohabitationSignals,
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): CohabitationPrescriptionItem | null {
  const cfo = pair.cfo_power_struggle;
  if (cfo.struggle_band === "low" && !cfo.dual_cfo_war) {
    return null;
  }

  const leader = leaderLabel(cfo.leader_side, nicknameA, nicknameB, locale);
  const warNote = pick(
    locale,
    cfo.dual_cfo_war
      ? "Both of you have a strong drive for money/rules leadership, so you're both in 'household CEO' mode."
      : `The power gap leans slightly toward ${leader}, but the other side can still push back on economic/rule matters.`,
    cfo.dual_cfo_war
      ? "양쪽 모두 돈·규칙 주도권이 강해 '둘 다 집안 총괄' 상태입니다."
      : `권력 격차는 ${leader} 쪽이 다소 앞서 있으나, 상대도 경제·규칙 영역에서 반발할 여지가 있습니다.`,
  );

  return sanitizeItem({
    topic: "cfo_power_struggle",
    headline: pick(
      locale,
      cfo.dual_cfo_war
        ? "Both of You Are the Boss — Splitting Household Finance & Rule Roles Is Essential"
        : "Money & Rules Leadership — Preventing One-Sided Decisions Without Agreement",
      cfo.dual_cfo_war
        ? "둘 다 사장님 모드 — 집안 재무·규칙 역할 분리가 필수"
        : "돈·규칙 주도권 — 합의 없는 일방 결정을 막기",
    ),
    evidence: {
      source: "pair_cohabitation_signals",
      signal_paths: [
        "cfo_power_struggle.dual_cfo_war",
        "cfo_power_struggle.struggle_score",
        "cfo_power_struggle.struggle_band",
        "cfo_power_struggle.leader_side",
        "cfo_power_struggle.a_cfo_affinity",
        "cfo_power_struggle.b_cfo_affinity",
      ],
      summary: pick(
        locale,
        `${warNote} Power-struggle index ${cfo.struggle_score} (${cfo.struggle_band}). A CFO ${cfo.a_cfo_affinity} · B CFO ${cfo.b_cfo_affinity}.`,
        `${warNote} 권력 쟁투 지수 ${cfo.struggle_score}(${cfo.struggle_band}). A CFO ${cfo.a_cfo_affinity} · B CFO ${cfo.b_cfo_affinity}.`,
      ),
      snapshot: {
        dual_cfo_war: cfo.dual_cfo_war,
        struggle_score: cfo.struggle_score,
        struggle_band: cfo.struggle_band,
        leader_side: cfo.leader_side,
      },
    },
    do_list: pick(
      locale,
      [
        "A 40-minute 'household finance meeting' on the first Sunday of every month — cover only fixed costs, the budget, and big spending (over ~$100), and save emotional apologies for after the meeting.",
        `Split spending into 3 buckets: ① ${nicknameA}'s sole decision ② ${nicknameB}'s sole decision ③ joint spending that needs both to agree — write the limit as a number and post it on the fridge.`,
        cfo.dual_cfo_war
          ? "Big decisions follow a 'propose → 24-hour reflection → finalize' rule — don't demand a same-day answer. The stronger both sides' drive to lead, the more an instant-answer push becomes the blow-up trigger."
          : `${leader} writes the agenda first, but explicitly gives the other side a one-time 'veto or revise' right — turning a one-way announcement into a negotiation.`,
        "During a fight, switch from 'is this about money for you?' framing to 'what was our rule again?' — if there's no rule, turn it into an agenda item to make one on the spot.",
      ],
      [
        "매월 첫 일요일 40분 '집안 재무 미팅' — 고정비·가계부·큰 지출(10만 원 이상)만 다루고, 감정 사과는 미팅 후로 미루기.",
        `지출 영역을 3칸으로 나누기: ① ${nicknameA} 단독 결정 ② ${nicknameB} 단독 결정 ③ 둘 다 동의해야 하는 공동 지출 — 한도 금액을 숫자로 적어 냉장고에 붙이기.`,
        cfo.dual_cfo_war
          ? "큰 결정은 '제안 → 24시간 숙려 → 확정' 규칙 — 당일 즉답을 요구하지 않기. 둘 다 주도권이 강할수록 즉답 압박이 폭발 트리거입니다."
          : `${leader}가 먼저 안건을 적되, 상대에게 '거부·수정 1회' 권한을 명시적으로 주기 — 일방 통보를 '협의'로 바꿉니다.`,
        "싸울 때 '너 돈 때문에 그러는 거지?' 같은 프레임 대신 '우리 규칙이 뭐였지?'로 화제 전환 — 규칙이 없으면 그 자리에서 규칙을 만드는 안건으로 전환.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Suddenly shoving a card or account statement in their face and starting a 'what is this?' trial — unless you ask 'since when were you worried about this' before presenting evidence, it escalates into a financial conflict.",
        "Turning small spending into 'you're always like this' cumulative ammunition — for power-struggle couples, small amounts easily escalate into a major trust incident.",
        "Telling parents or siblings first and informing your partner later — outside alliances are the fastest way to break the internal power balance.",
        "Bringing up big money, moving, or contracts after 11pm on an angry night — fatigue plus a power struggle equals the worst-quality agreement.",
      ],
      [
        "카드·계좌 내역을 갑자기 들이밀며 '이게 뭐야?' 식의 재판 시작하기 — 증거 제시 전에 '언제부터 불안했는지'를 먼저 묻지 않으면 재무 갈등으로 번집니다.",
        "작은 지출을 '네가 항상 그렇지'로 누적 폭탄 만들기 — 권력 쟁투 커플은 소액이 대형 신뢰 사건으로 비화하기 쉽습니다.",
        "부모님·형제에게 먼저 말하고 배우자에게는 나중에 통보하기 — 외부 연대는 내부 권력 균형을 깨는 가장 빠른 방법입니다.",
        "화가 난 날 밤 11시 이후 큰 돈·이사·계약 이야기 꺼내기 — 피로 + 주도권 = 최악의 합의 품질.",
      ],
    ),
  });
}

function buildDayPalacePrescription(
  pair: PairCohabitationSignals,
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): CohabitationPrescriptionItem | null {
  const cross = pair.day_palace_cross;
  const isTension =
    cross.cross_relation_type != null &&
    TENSION_BRANCH_TYPES.has(cross.cross_relation_type);
  if (!isTension && cross.cross_tension_index < 35) {
    return null;
  }

  const relLabel = cross.cross_relation_type ?? pick(locale, "no notable relation", "특이 관계 없음");
  const summary = pick(
    locale,
    isTension
      ? `In your shared living rhythm, the ${cross.branch_a}↔${cross.branch_b} lifestyle-pattern combination is locked into a "${relLabel}" character. Small habit differences at home can quickly escalate into "that's just how you are."`
      : `Your lifestyle-rhythm tension index is high at ${cross.cross_tension_index}. The visible conflict label is weak, but the tighter your daily closeness, the more the friction accumulates.`,
    isTension
      ? `함께 사는 리듬에서 생활 패턴 ${cross.branch_a}↔${cross.branch_b} 조합이 '${relLabel}' 성격으로 맞물려 있어요. 집안에서 사소한 습관 차이가 빠르게 '너는 원래 그래'로 비화되기 쉽습니다.`
      : `생활 리듬 긴장 지수가 ${cross.cross_tension_index}로 높습니다. 겉으로 드러나는 갈등 라벨은 약하지만, 생활 밀착도가 높을수록 자극이 누적됩니다.`,
  );

  return sanitizeItem({
    topic: "day_palace_tension",
    headline: pick(
      locale,
      "Same Home, Different Rhythm — A Routine to Ease Lifestyle-Pattern Tension",
      "같은 집, 다른 리듬 — 생활 패턴 긴장 완화 루틴",
    ),
    evidence: {
      source: "pair_cohabitation_signals",
      signal_paths: [
        "day_palace_cross.branch_a",
        "day_palace_cross.branch_b",
        "day_palace_cross.cross_relation_type",
        "day_palace_cross.cross_tension_index",
      ],
      summary,
      snapshot: {
        branch_a: cross.branch_a,
        branch_b: cross.branch_b,
        cross_relation_type: cross.cross_relation_type,
        cross_tension_index: cross.cross_tension_index,
      },
    },
    do_list: pick(
      locale,
      [
        "Agree on a 'timeout' keyword for when a fight runs past 15 minutes — whoever calls it moves to another room, and after 30 minutes you only choose 'keep going or wait until tomorrow.'",
        `${nicknameA} and ${nicknameB} each write down 1 '15-minute stress-relief action' and swap — start by just doing that action for the other person when they're struggling (no advice or solutions).`,
        "A 5-minute timebox on 'just 1 household complaint' at least 3 evenings a week, at the same time — one complaint per person, and resolve only as the next day's agenda.",
        "No reopening the day's conflict once the bedroom door is closed — for couples with different lifestyle rhythms, reigniting things at night wrecks sleep and intimacy too.",
      ],
      [
        "싸움이 15분 넘어가면 '타임아웃' 키워드를 합의 — 말한 사람은 다른 방으로 이동하고, 30분 후 '계속할까/내일 할까'만 선택.",
        `${nicknameA}와 ${nicknameB} 각각 '스트레스 풀리는 15분 행동' 1개를 적어 교환 — 상대가 힘들 때 그 행동만 해 주는 것으로 시작 (조언·해결책 금지).`,
        "주 3회 이상 같은 저녁에 '집안 불만 1개만' 5분 타임박스 — 1인 1불만, 해결은 다음 날 안건으로만.",
        "침실 문 닫힌 뒤에는 당일 갈등 재개 금지 — 생활 리듬이 다른 커플일수록 밤 재점화가 수면·친밀감까지 망칩니다.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Following them to keep the conversation going right at the door — without securing physical distance, the friction from lifestyle-rhythm differences keeps amplifying.",
        "Pinning the other into one fixed type with 'that's just your personality' — describing temperament is for understanding, not an excuse.",
        "Pointing out your partner's habit in front of parents or children to recruit an ally — public embarrassment prolongs household tension.",
        "Pulling out a structural change like 'moving out, divorce, separate rooms' as a card immediately after conflict — save structural talk for after the emotional temperature cools.",
      ],
      [
        "문 앞에서 따라가며 대화 이어가기 — 물리적 거리 확보 없이는 생활 리듬 차이 자극이 계속 증폭됩니다.",
        "'너 성격이 원래 그렇다'며 상대를 한 가지 타입으로 고정하기 — 성향 설명은 이해용이지 면죅부가 아닙니다.",
        "부모님·자녀 앞에서 배우자 습관을 지적하며 연대 요청하기 — 공개 망신은 집안 긴장을 장기화합니다.",
        "갈등 직후 즉시 '이사·이혼·각방' 같은 구조 변경을 카드로 꺼내기 — 구조 이야기는 감정 온도가 내려간 뒤에만.",
      ],
    ),
  });
}

function buildBaselinePrescription(
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
): CohabitationPrescriptionItem {
  return sanitizeItem({
    topic: "home_baseline",
    headline: pick(
      locale,
      "15 Minutes a Week — Household Operations Check-In (Common to All Couples)",
      "매주 15분 — 집안 운영 점검 (모든 커플 공통)",
    ),
    evidence: {
      source: "pair_cohabitation_signals",
      signal_paths: ["cohabitation_prescription.baseline"],
      summary: pick(
        locale,
        "Even when conflict signals don't spike sharply on a specific topic, for cohabiting or married couples, daily routine quality IS relationship quality. Below is a preventive baseline prescription.",
        "특정 주제에서 갈등 신호가 강하게 치솟지 않아도, 동거·부부는 생활 루틴이 곧 관계 품질입니다. 아래는 예방용 기본 처방입니다.",
      ),
      snapshot: {},
    },
    do_list: pick(
      locale,
      [
        `A 15-minute 'household standup' on the same day every week — ${nicknameA} and ${nicknameB} each share just 1 thing they were grateful for this week and 1 thing that bothered them.`,
        "Redistribute just 'one thing' among chores, childcare, or money this week — don't try to fix everything at once.",
        "For big decisions (moving, a car, a pet), separate an 'information-gathering week' from a 'decision week' — no researching and deciding in the same week.",
      ],
      [
        `매주 같은 요일 15분 '집안 스탠드업' — ${nicknameA}·${nicknameB} 각각 이번 주 고마웠던 점 1개, 불편했던 점 1개만.`,
        "가사·육아·돈 중 이번 주 '한 가지만' 재분배 — 전부 한꺼번에 고치려 하지 않기.",
        "큰 결정(이사·차·반려동물)은 '정보 수집 주간'과 '결정 주간'을 분리 — 같은 주에 조사+결정 금지.",
      ],
    ),
    dont_list: pick(
      locale,
      [
        "Bringing up a huge topic like 'how's our relationship?' on a tired weeknight.",
        "Bottling up complaints and bursting all at once — for cohabiting couples, small complaints compound heavily.",
        "Suddenly forcing a conversation with 'we need to talk right now' on a day your partner is busy.",
      ],
      [
        "피곤한 평일 밤에 '우리 관계 어때?' 같은 거대 주제 꺼내기.",
        "불만을 쌓아 두었다가 한 번에 터뜨리기 — 동거는 소액 불만의 복리가 큽니다.",
        "상대가 바쁜 날 갑자기 '지금 얘기 좀' 하며 대화를 강제하기.",
      ],
    ),
  });
}

function resolveIntroLine(items: CohabitationPrescriptionItem[], locale: Locale): string {
  const topics = new Set(items.map((i) => i.topic));
  if (topics.has("cfo_power_struggle") && topics.has("day_palace_tension")) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        "This is a pairing where money/rules and lifestyle rhythm are both likely to be triggered at once. The Do/Don't below is pulled from your two lifestyle-pattern signals, and is meant for action, separate from the existing home report narrative.",
        "돈·규칙과 생활 리듬이 동시에 자극되기 쉬운 조합입니다. 아래 Do/Don't는 두 사람의 생활 패턴 신호에서 뽑았고, 기존 홈 리포트 서사와 별도로 실천용입니다.",
      ),
    );
  }
  if (topics.has("secret_affinity")) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        "An axis of unspoken attraction has been detected. Nonverbal intimacy can become either fuel for conflict or an asset for recovery — lock in the direction with the action list below.",
        "말하지 않아도 끌리는 축이 감지됐습니다. 비언어적 친밀은 갈등 때 불씨가 되기도, 회복 자산이 되기도 합니다 — 아래 행동 리스트로 방향을 고정하세요.",
      ),
    );
  }
  return sanitizeHomeLifeText(
    pick(
      locale,
      "A practical prescription based on your cohabiting/married lifestyle-pattern signals. Keep reading the existing 9 sections for the explanation — check here for 'so what do I actually do?'",
      "동거·부부 생활 패턴 신호를 바탕으로 한 실행 처방입니다. 설명은 기존 9개 섹션을 그대로 보시고, '그래서 뭐 하라고?'는 여기서 확인하세요.",
    ),
  );
}

/**
 * pair.cohabitation → 실행형 Do/Don't 처방전.
 * UI·homeReportTemplate 미연결 — meta.prescription_cohabitation 전용.
 */
export function buildCohabitationPrescriptions(params: {
  pair: PairCohabitationSignals;
  nicknameA: string;
  nicknameB: string;
  locale?: Locale;
}): CohabitationPrescriptionPack {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const candidates = [
    buildSecretAffinityPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
      locale,
    ),
    buildCfoPowerPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
      locale,
    ),
    buildDayPalacePrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
      locale,
    ),
  ].filter((item): item is CohabitationPrescriptionItem => item != null);

  const items =
    candidates.length > 0
      ? candidates
      : [
          buildBaselinePrescription(params.nicknameA, params.nicknameB, locale),
        ];

  if (candidates.length > 0 && candidates.length < 3) {
    items.push(buildBaselinePrescription(params.nicknameA, params.nicknameB, locale));
  }

  const priority: Record<CohabitationPrescriptionItem["topic"], number> = {
    cfo_power_struggle: 100,
    day_palace_tension: 80,
    secret_affinity: 70,
    home_baseline: 10,
  };
  items.sort((a, b) => priority[b.topic] - priority[a.topic]);

  return {
    schema_version: COHABITATION_PRESCRIPTION_VERSION,
    intro_line: resolveIntroLine(items, locale),
    items,
  };
}
