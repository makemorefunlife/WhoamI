import type { PairFriendshipSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import {
  FRIEND_PRESCRIPTION_VERSION,
  type FriendPrescriptionItem,
  type FriendPrescriptionPack,
} from "./friendPrescriptionTypes";

const TEMP_LABEL: Record<
  PairFriendshipSignals["johu_gap"]["band_a"],
  string
> = {
  cold: "차가움",
  neutral: "중립",
  hot: "열정",
};

function buildEnergyDrainPrescription(
  pair: PairFriendshipSignals,
  nicknameA: string,
  nicknameB: string,
): FriendPrescriptionItem | null {
  if (
    pair.energy_drain_band === "low" &&
    pair.energy_drain_index < 40
  ) {
    return null;
  }

  const { johu_gap } = pair;
  const summary =
    `조후(한열조습) 격차로 만날 때 한쪽이 먼저 지치기 쉽습니다. ` +
    `열기 격차 ${johu_gap.heat_gap} · 습도 격차 ${johu_gap.moisture_gap} · ` +
    `기 빨림 지수 ${pair.energy_drain_index}(${pair.energy_drain_band}). ` +
    `${nicknameA}(${TEMP_LABEL[johu_gap.band_a]}) ↔ ${nicknameB}(${TEMP_LABEL[johu_gap.band_b]}) 조합입니다.`;

  return {
    topic: "energy_drain_prevention",
    headline: "만나고 나면 왜 피곤하지? — 기 빨림 방지 루틴",
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
    do_list: [
      "만남 전 '오늘 에너지 예산' 30분만 말하기 — 피곤한 날은 카페 30분·산책만으로 끝내기.",
      `긴 만남(2시간+)은 중간 10분 '각자 폰·화장실' 타임 — ${nicknameA}·${nicknameB} 중 한 명이 말을 많이 해도 회복 구간 필수.`,
      "만남 후 바로 집에 가지 말고 5분 '오늘 좋았던 1가지'만 문자로 교환 — 감정 정리 없이 헤어지면 기 빨림이 남습니다.",
      "월 1회 '가벼운 만남'만 하는 달 정하기 — 무거운 고민 상담·술자리 없이 밥만 먹는 날.",
    ],
    dont_list: [
      "피곤한 날 '오랜만인데 오늘은 길게 보자' 강요 — 조후 격차가 큰 페어일수록 억지 장시간 만남이 독입니다.",
      "만남 내내 상대 인생 전체 리뷰(연애·직장·가족) 한 번에 털기.",
      "카톡으로 밤 11시 이후 장문 감정 토로 — 다음 날 만남 에너지를 미리 깎습니다.",
      "만나서 휴대폰만 보다 헤어지기 — '같이 있었는데 왜 더 지치지?'의 전형적 패턴입니다.",
    ],
  };
}

function buildCommunicationPrescription(
  pair: PairFriendshipSignals,
  nicknameA: string,
  nicknameB: string,
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
    ? `${coldSide ?? "한쪽"}은 차갑고 ${hotSide ?? "한쪽"}은 열정적인 조후 밴드라, 연락 빈도·대화 깊이·감정 표현 속도가 어긋나기 쉽습니다.`
    : `열기 격차(${johu_gap.heat_gap})가 커서 대화 템포가 맞지 않으면 '나만 노력하는 것 같다'는 오해가 생기기 쉽습니다.`;

  return {
    topic: "communication_climate",
    headline: "온도 다른 두 사람 — 대화 소통 맞춤 규칙",
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
      "연락 기대치를 숫자로 합의 — 예: '평일 답장 24시간 이내, 주말은 자유'처럼.",
      coldSide
        ? `${coldSide}에게는 '급한 일 아니면 답장 천천해도 OK'라고 먼저 말해 주기.`
        : "답장이 느린 쪽에게 '무시'가 아니라 '리듬 차이'일 수 있음을 전제하기.",
      hotSide
        ? `${hotSide}는 긴 카톡 대신 음성 1분·사진 1장으로 가볍게 — 열정을 부담으로 바꾸지 않기.`
        : "감정 표현이 큰 쪽은 '지금 진지해?' 확인 한 번 후 깊은 이야기 시작.",
      "3주에 한 번 '우리 연락 방식 괜찮아?' 5분 체크 — 불만 쌓기 전에 조정.",
    ],
    dont_list: [
      "'너 나 안 좋아해?' 같은 애정 시험 — 조후 온도 차는 애정 부족과 다릅니다.",
      "단톡·모임에서 상대 답장 속도 놀리기.",
      "차가운 쪽에게 갑자기 '지금 당장 만나자' 긴급 소환 반복.",
      "열정적인 쪽의 연락을 '부담스럽다'만 말하고 대안 없이 끊기.",
    ],
  };
}

function buildFriendshipBaseline(
  nicknameA: string,
  nicknameB: string,
): FriendPrescriptionItem {
  return {
    topic: "friendship_baseline",
    headline: "우정 유지 기본 루틴 (공통)",
    evidence: {
      source: "pair_friendship_signals",
      signal_paths: ["friend_prescription.baseline"],
      summary:
        "pair 교차 신호가 특정 주제에서 강하게 치솟지 않아도, 우정은 작은 리듬 차이가 오해로 번지기 쉽습니다.",
      snapshot: {},
    },
    do_list: [
      `분기 1회 '우리만의 가벼운 약속'(맛집·산책) 고정 — ${nicknameA}·${nicknameB} 번갈아 주도.`,
      "서운함은 2주 안에 한 문장으로 전달 — 쌓아 두지 않기.",
      "상대 힘든 시기엔 조언보다 '들을게' 한 마디 먼저.",
    ],
    dont_list: [
      "SNS에서만 친한 척하고 실제 연락은 0.",
      "공통 지인 앞에서 우정 퀴즈·비교.",
      "오랜만에 연락 와서 바로 부탁만 하기.",
    ],
  };
}

function resolveIntroLine(items: FriendPrescriptionItem[]): string {
  const topics = new Set(items.map((i) => i.topic));
  if (topics.has("energy_drain_prevention") && topics.has("communication_climate")) {
    return "만남 후 피로와 대화 온도 차가 동시에 작용하기 쉬운 조합입니다. 아래는 pair.friendship 교차 신호 기반 실천 처방입니다.";
  }
  if (topics.has("energy_drain_prevention")) {
    return "만남 시 기 빨림 신호가 있습니다. 시간·에너지 예산을 먼저 맞추면 우정이 훨씬 오래 갑니다.";
  }
  if (topics.has("communication_climate")) {
    return "조후(한열) 밴드 격차로 연락·감정 템포가 어긋나기 쉽습니다. 아래 규칙으로 오해를 줄이세요.";
  }
  return "친구 pair 교차 신호 기반 실행 처방입니다. 기존 Social DNA 서사와 별도로 실천용입니다.";
}

export function buildFriendPrescriptions(params: {
  pair: PairFriendshipSignals;
  nicknameA: string;
  nicknameB: string;
}): FriendPrescriptionPack {
  const candidates = [
    buildEnergyDrainPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
    ),
    buildCommunicationPrescription(
      params.pair,
      params.nicknameA,
      params.nicknameB,
    ),
  ].filter((item): item is FriendPrescriptionItem => item != null);

  const items =
    candidates.length > 0
      ? candidates
      : [buildFriendshipBaseline(params.nicknameA, params.nicknameB)];

  if (candidates.length > 0 && candidates.length < 2) {
    items.push(buildFriendshipBaseline(params.nicknameA, params.nicknameB));
  }

  const priority: Record<FriendPrescriptionItem["topic"], number> = {
    energy_drain_prevention: 100,
    communication_climate: 85,
    friendship_baseline: 10,
  };
  items.sort((a, b) => priority[b.topic] - priority[a.topic]);

  return {
    schema_version: FRIEND_PRESCRIPTION_VERSION,
    intro_line: resolveIntroLine(items),
    items,
  };
}
