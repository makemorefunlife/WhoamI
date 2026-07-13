import type { PairCohabitationSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import {
  COHABITATION_PRESCRIPTION_VERSION,
  type CohabitationPrescriptionItem,
  type CohabitationPrescriptionPack,
} from "./cohabitationPrescriptionTypes";

const TENSION_BRANCH_TYPES = new Set(["충", "형", "해", "파"]);

function leaderLabel(
  side: PairCohabitationSignals["cfo_power_struggle"]["leader_side"],
  nicknameA: string,
  nicknameB: string,
): string {
  if (side === "a") return nicknameA;
  if (side === "b") return nicknameB;
  return "둘 다";
}

function buildSecretAffinityPrescription(
  pair: PairCohabitationSignals,
  nicknameA: string,
  nicknameB: string,
): CohabitationPrescriptionItem | null {
  const { secret_affinity } = pair;
  if (!secret_affinity.present && secret_affinity.affinity_index < 45) {
    return null;
  }

  const linkCount = secret_affinity.links.length;
  const summary =
    linkCount > 0
      ? `일지 지장간·일간 천간 교차에서 천간합(암합) ${linkCount}건이 감지됐습니다. 겉으로는 말하지 않아도 서로 끌리는 축이 있어, 갈등 때 '왜 이렇게까지 화가 나지?'처럼 감정이 과열되기 쉽습니다.`
      : `암합 링크는 약하지만 친밀 지수(${secret_affinity.affinity_index})가 높아, 말로 풀기 전에 몸과 분위기로 먼저 반응하는 패턴이 있습니다.`;

  return {
    topic: "secret_affinity",
    headline: "말하지 않아도 당기는 힘 — 암합을 관계 자산으로 쓰기",
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
    do_list: [
      `주 1회 '설명 없는 시간' 30분을 정해 ${nicknameA}와 ${nicknameB} 둘 다 폰을 거실에 두고 같은 공간에만 있기 — 대화 주제를 정하지 말고, 몸이 먼저 안정되는지 확인하세요.`,
      "싸운 직후에는 '누가 맞는지' 대신 '지금 우리 둘 다 예민한 상태'라고 한 문장만 말하고 20분 쿨다운 — 암합은 말로 풀리기보다 분위기가 풀릴 때 회복됩니다.",
      "침실·거실 중 한 곳을 '비판 금지 구역'으로 정하고, 그 안에서는 집안일 지적·돈 이야기·시댁·처가 이야기를 금지 — 친밀 축이 있는 커플일수록 일상 잔소리가 친밀감을 깎습니다.",
      "한 달에 한 번 '우리만 아는 루틴'(야식 메뉴, 산책 코스, 주말 기상 시간)을 새로 하나만 추가 — 반복 루틴이 암합 에너지를 긍정적으로 고정합니다.",
    ],
    dont_list: [
      `"너 나한테 숨기는 거 있지?"처럼 추궁하며 암합을 '비밀·불신' 프레임으로 몰아붙이기 — ${nicknameA}와 ${nicknameB} 중 누가 먼저 말하든, 추궁은 친밀 지수를 바로 깎습니다.`,
      "갈등 중 '그래서 네가 나 좋아하는 거 맞아?'처럼 애정을 시험 대상으로 쓰기 — 암합은 시험 통과용이 아니라 회복용입니다.",
      "SNS·친구 앞에서 커플 이미지를 과장해 보이려다 집에서 반동으로 냉전하기 — 겉과 속의 온도 차가 클수록 집안 폭발이 커집니다.",
      "암합이 있다는 이유로 '말 안 해도 알겠지'를 합리화하며 중요한 약속(돈·육아·이사)을 구두로만 넘기기.",
    ],
  };
}

function buildCfoPowerPrescription(
  pair: PairCohabitationSignals,
  nicknameA: string,
  nicknameB: string,
): CohabitationPrescriptionItem | null {
  const cfo = pair.cfo_power_struggle;
  if (cfo.struggle_band === "low" && !cfo.dual_cfo_war) {
    return null;
  }

  const leader = leaderLabel(cfo.leader_side, nicknameA, nicknameB);
  const warNote = cfo.dual_cfo_war
    ? "양쪽 모두 재성·관성 주도권이 강해 '둘 다 CFO' 상태입니다."
    : `권력 격차는 ${leader} 쪽이 다소 앞서 있으나, 상대도 경제·규칙 영역에서 반발할 여지가 있습니다.`;

  return {
    topic: "cfo_power_struggle",
    headline: cfo.dual_cfo_war
      ? "둘 다 사장님 모드 — 집안 CFO 역할 분리가 필수"
      : "돈·규칙 주도권 — 합의 없는 일방 결정을 막기",
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
      summary: `${warNote} 권력 쟁투 지수 ${cfo.struggle_score}(${cfo.struggle_band}). A CFO ${cfo.a_cfo_affinity} · B CFO ${cfo.b_cfo_affinity}.`,
      snapshot: {
        dual_cfo_war: cfo.dual_cfo_war,
        struggle_score: cfo.struggle_score,
        struggle_band: cfo.struggle_band,
        leader_side: cfo.leader_side,
      },
    },
    do_list: [
      "매월 첫 일요일 40분 '집안 재무 미팅' — 고정비·가계부·큰 지출(10만 원 이상)만 다루고, 감정 사과는 미팅 후로 미루기.",
      `지출 영역을 3칸으로 나누기: ① ${nicknameA} 단독 결정 ② ${nicknameB} 단독 결정 ③ 둘 다 동의해야 하는 공동 지출 — 한도 금액을 숫자로 적어 냉장고에 붙이기.`,
      cfo.dual_cfo_war
        ? "큰 결정은 '제안 → 24시간 숙려 → 확정' 규칙 — 당일 즉답을 요구하지 않기. 둘 다 주도권이 강할수록 즉답 압박이 폭발 트리거입니다."
        : `${leader}가 먼저 안건을 적되, 상대에게 '거부·수정 1회' 권한을 명시적으로 주기 — 일방 통보를 '협의'로 바꿉니다.`,
      "싸울 때 '너 돈 때문에 그러는 거지?' 같은 프레임 대신 '우리 규칙이 뭐였지?'로 화제 전환 — 규칙이 없으면 그 자리에서 규칙을 만드는 안건으로 전환.",
    ],
    dont_list: [
      "카드·계좌 내역을 갑자기 들이밀며 '이게 뭐야?' 식의 재판 시작하기 — 증거 제시 전에 '언제부터 불안했는지'를 먼저 묻지 않으면 CFO 전쟁으로 번집니다.",
      "작은 지출을 '네가 항상 그렇지'로 누적 폭탄 만들기 — 권력 쟁투 커플은 소액이 대형 신뢰 사건으로 비화하기 쉽습니다.",
      "부모님·형제에게 먼저 말하고 배우자에게는 나중에 통보하기 — 외부 연대는 내부 권력 균형을 깨는 가장 빠른 방법입니다.",
      "화가 난 날 밤 11시 이후 큰 돈·이사·계약 이야기 꺼내기 — 피로 + 주도권 = 최악의 합의 품질.",
    ],
  };
}

function buildDayPalacePrescription(
  pair: PairCohabitationSignals,
  nicknameA: string,
  nicknameB: string,
): CohabitationPrescriptionItem | null {
  const cross = pair.day_palace_cross;
  const isTension =
    cross.cross_relation_type != null &&
    TENSION_BRANCH_TYPES.has(cross.cross_relation_type);
  if (!isTension && cross.cross_tension_index < 35) {
    return null;
  }

  const relLabel = cross.cross_relation_type ?? "특이 관계 없음";
  const summary = isTension
    ? `일궁(배우자궁) 지지 ${cross.branch_a}↔${cross.branch_b}에서 '${relLabel}' 교차가 감지됐습니다. 집안에서 사소한 습관 차이가 빠르게 '너는 원래 그래'로 비화되기 쉽습니다.`
    : `일궁 교차 긴장 지수가 ${cross.cross_tension_index}로 높습니다. 합·충 라벨은 약하지만, 생활 밀착도가 높을수록 자극이 누적됩니다.`;

  return {
    topic: "day_palace_tension",
    headline: "같은 집, 다른 리듬 — 일궁 교차 긴장 완화 루틴",
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
    do_list: [
      "싸움이 15분 넘어가면 '타임아웃' 키워드를 합의 — 말한 사람은 다른 방으로 이동하고, 30분 후 '계속할까/내일 할까'만 선택.",
      `${nicknameA}와 ${nicknameB} 각각 '스트레스 풀리는 15분 행동' 1개를 적어 교환 — 상대가 힘들 때 그 행동만 해 주는 것으로 시작 (조언·해결책 금지).`,
      "주 3회 이상 같은 저녁에 '집안 불만 1개만' 5분 타임박스 — 1인 1불만, 해결은 다음 날 안건으로만.",
      "침실 문 닫힌 뒤에는 당일 갈등 재개 금지 — 일궁 교차 긴장이 있는 커플일수록 밤 재점화가 수면·성생활까지 망칩니다.",
    ],
    dont_list: [
      "문 앞에서 따라가며 대화 이어가기 — 물리적 거리 확보 없이는 일궁 교차 자극이 계속 증폭됩니다.",
      "'너 성격이 원래 그렇다'며 일주·타입으로 상대를 고정하기 — 사주는 이유 설명용이지 면죅부가 아닙니다.",
      "부모님·자녀 앞에서 배우자 습관을 지적하며 연대 요청하기 — 공개 망신은 집안 긴장을 장기화합니다.",
      "갈등 직후 즉시 '이사·이혼·각방' 같은 구조 변경을 카드로 꺼내기 — 구조 이야기는 감정 온도가 내려간 뒤에만.",
    ],
  };
}

function buildBaselinePrescription(
  nicknameA: string,
  nicknameB: string,
): CohabitationPrescriptionItem {
  return {
    topic: "home_baseline",
    headline: "매주 15분 — 집안 운영 점검 (모든 커플 공통)",
    evidence: {
      source: "pair_cohabitation_signals",
      signal_paths: ["cohabitation_prescription.baseline"],
      summary:
        "pair 교차 신호가 특정 주제에서 강하게 치솟지 않아도, 동거·부부는 생활 루틴이 곧 관계 품질입니다. 아래는 예방용 기본 처방입니다.",
      snapshot: {},
    },
    do_list: [
      `매주 같은 요일 15분 '집안 스탠드업' — ${nicknameA}·${nicknameB} 각각 이번 주 고마웠던 점 1개, 불편했던 점 1개만.`,
      "가사·육아·돈 중 이번 주 '한 가지만' 재분배 — 전부 한꺼번에 고치려 하지 않기.",
      "큰 결정(이사·차·반려동물)은 '정보 수집 주간'과 '결정 주간'을 분리 — 같은 주에 조사+결정 금지.",
    ],
    dont_list: [
      "피곤한 평일 밤에 '우리 관계 어때?' 같은 거대 주제 꺼내기.",
      "불만을 쌓아 두었다가 한 번에 터뜨리기 — 동거는 소액 불만의 복리가 큽니다.",
      "상대가 바쁜 날 갑자기 '지금 얘기 좀' 하며 대화를 강제하기.",
    ],
  };
}

function resolveIntroLine(items: CohabitationPrescriptionItem[]): string {
  const topics = new Set(items.map((i) => i.topic));
  if (topics.has("cfo_power_struggle") && topics.has("day_palace_tension")) {
    return "돈·규칙과 생활 리듬이 동시에 자극되기 쉬운 조합입니다. 아래 Do/Don't는 만세력 pair 교차 신호에서 뽑았고, 기존 홈 리포트 서사와 별도로 실천용입니다.";
  }
  if (topics.has("secret_affinity")) {
    return "말하지 않아도 끌리는 축이 감지됐습니다. 암합은 갈등 때 불씨가 되기도, 회복 자산이 되기도 합니다 — 아래 행동 리스트로 방향을 고정하세요.";
  }
  return "동거·부부 pair 교차 신호를 바탕으로 한 실행 처방입니다. 설명은 기존 9개 섹션을 그대로 보시고, '그래서 뭐 하라고?'는 여기서 확인하세요.";
}

/**
 * pair.cohabitation → 실행형 Do/Don't 처방전.
 * UI·homeReportTemplate 미연결 — meta.prescription_cohabitation 전용.
 */
export function buildCohabitationPrescriptions(params: {
  pair: PairCohabitationSignals;
  nicknameA: string;
  nicknameB: string;
}): CohabitationPrescriptionPack {
  const candidates = [
    buildSecretAffinityPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
    ),
    buildCfoPowerPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
    ),
    buildDayPalacePrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
    ),
  ].filter((item): item is CohabitationPrescriptionItem => item != null);

  const items =
    candidates.length > 0
      ? candidates
      : [
          buildBaselinePrescription(params.nicknameA, params.nicknameB),
        ];

  if (candidates.length > 0 && candidates.length < 3) {
    items.push(buildBaselinePrescription(params.nicknameA, params.nicknameB));
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
    intro_line: resolveIntroLine(items),
    items,
  };
}
