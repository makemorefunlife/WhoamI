import type { PairFamilySignals } from "@/lib/personCore/sajuSignals/pairTypes";
import {
  FAMILY_PRESCRIPTION_VERSION,
  type FamilyPrescriptionItem,
  type FamilyPrescriptionPack,
} from "./familyPrescriptionTypes";

function buildUmbilicalPrescription(
  pair: PairFamilySignals,
  parentNickname: string,
  childNickname: string,
): FamilyPrescriptionItem | null {
  if (pair.umbilical_band === "low" && pair.umbilical_separation_index < 40) {
    return null;
  }

  const summary =
    `탯줄 분리·정서적 독립 지수 ${pair.umbilical_separation_index}(${pair.umbilical_band}). ` +
    `${parentNickname}와 ${childNickname} 사이에 '너무 가깝거나 너무 멀다'는 양극 신호가 겹치면, ` +
    `사랑 표현이 간섭·방임으로 오해되기 쉽습니다.`;

  return {
    topic: "umbilical_independence",
    headline: "탯줄은 이어져도 공간은 필요 — 정서적 독립 루틴",
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
    do_list: [
      `${parentNickname}는 '조언' 전에 '들을게' 1분 — ${childNickname}가 말 끝까지 하게 두기.`,
      `${childNickname}는 중요한 결정을 먼저 공유할 때 '의견 구함 vs 통보'를 문장 첫머리에 밝히기.`,
      "주 1회 '연락 없는 2시간' 약속 — 각자 취미·친구·휴식. 단절이 아니라 호흡입니다.",
      "집안 규칙 3개만 적어 냉장고에 붙이기 — 나머지는 협상 대상으로 두기.",
      `${parentNickname}·${childNickname} 각각 '침범받기 싫은 1가지'를 카드에 적어 교환.`,
    ],
    dont_list: [
      `${parentNickname}가 ${childNickname} 방·휴대폰·SNS를 '걱정' 명목으로 무단 확인하기.`,
      `${childNickname}가 모든 불만을 '당연히 알아야지' 전제로 터뜨리기.`,
      "식사·명절 자리에서 제3자(친척) 앞에서 서로 교정하기.",
      "'네가 어떻게 자랐는데' 역사 재판 — 과거는 이유 설명용, 면죄부 아님.",
      "연락 두절을 벌·협박 카드로 쓰기.",
    ],
  };
}

function buildNaggingKarmaPrescription(
  pair: PairFamilySignals,
  parentNickname: string,
  childNickname: string,
): FamilyPrescriptionItem | null {
  if (
    pair.nagging_band === "low" &&
    pair.nagging_trigger_index < 40 &&
    pair.combined_karma_tension < 35
  ) {
    return null;
  }

  const summary =
    `잔소리 트리거 지수 ${pair.nagging_trigger_index}(${pair.nagging_band}), ` +
    `가족 카르마 결합 긴장 ${pair.combined_karma_tension}. ` +
    `인성(부모) 과잉·가정 내 형벌 신호가 겹치면, ${parentNickname}의 한마디가 ${childNickname}에게 '옛날 싸움 재생'처럼 들리기 쉽습니다.`;

  return {
    topic: "nagging_karma_avoidance",
    headline: "잔소리가 아니라 신호 — 카르마 갈등 회피 처방",
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
    do_list: [
      `${parentNickname}는 잔소리 대신 '사실 1개 + 요청 1개'만 — 예: '이번 주 2회 늦었어. 다음엔 11시 전에 연락해 줘.'`,
      `${childNickname}는 방어 전에 '맞는 부분 1가지' 인정 후 대안 제시.`,
      "같은 주제(성적·취업·연애·돈)는 주 1회·10분 타임박스 — 넘기면 다음 주로.",
      "큰 갈등 직후 24시간 '재청구 금지' — 감정 온도 내려간 뒤에만 재논의.",
      `가족 행사 전 '${parentNickname}·${childNickname} 각자 금기어 1개' 합의 — 예: '너 항상', '또 그 소리'.`,
    ],
    dont_list: [
      "비교 잔소리 — '○○는 잘하는데'는 가족 카르마를 즉시 점화합니다.",
      "돈·결혼·직업을 매 식사마다 반복하기.",
      `${childNickname} 실수를 친척·형제에게 먼저 말하기.`,
      `${parentNickname}의 걱정을 '통제'로, ${childNickname}의 거리두기를 '배신'으로 해석하기.`,
      "과거 사건(10년 전)을 매번 증거로 꺼내기.",
    ],
  };
}

function buildFamilyBaseline(
  parentNickname: string,
  childNickname: string,
): FamilyPrescriptionItem {
  return {
    topic: "family_baseline",
    headline: "가족 관계 유지 기본 루틴 (공통)",
    evidence: {
      source: "pair_family_signals",
      signal_paths: ["family_prescription.baseline"],
      summary:
        "pair 교차 신호가 특정 주제에서 강하게 치솟지 않아도, 부모·자녀는 작은 말투 차이가 오래 갑니다.",
      snapshot: {},
    },
    do_list: [
      `월 1회 '${parentNickname}·${childNickname} 커피 20분' — 안건 없이 근황만.`,
      "고마움은 행동 1개로 — 말만 '고마워' 반복하지 않기.",
      "큰 결정은 '정보 주 → 숙려 → 결정' 3단계로.",
    ],
    dont_list: [
      "피곤한 밤 11시 이후 장문 카톡 잔소리.",
      "제3자 앞에서 훈계·반박.",
      "선물·돈으로 갈등 덮기만 하기.",
    ],
  };
}

function resolveIntroLine(items: FamilyPrescriptionItem[]): string {
  const topics = new Set(items.map((i) => i.topic));
  if (
    topics.has("umbilical_independence") &&
    topics.has("nagging_karma_avoidance")
  ) {
    return "정서적 거리와 잔소리·카르마 긴장이 동시에 작용하기 쉬운 가족 조합입니다. 아래는 pair.family 교차 신호 기반 실천 처방입니다.";
  }
  if (topics.has("umbilical_independence")) {
    return "탯줄 분리·독립 신호가 있습니다. 사랑과 간섭의 경계를 행동으로 고정하세요.";
  }
  if (topics.has("nagging_karma_avoidance")) {
    return "잔소리·가족 카르마 트리거가 감지됐습니다. 말의 형식과 타이밍을 바꾸면 반응이 달라집니다.";
  }
  return "가족 pair 교차 신호 기반 실행 처방입니다. 기존 Child DNA 서사와 별도로 실천용입니다.";
}

export function buildFamilyPrescriptions(params: {
  pair: PairFamilySignals;
  parentNickname: string;
  childNickname: string;
}): FamilyPrescriptionPack {
  const candidates = [
    buildUmbilicalPrescription(
      params.pair,
      params.parentNickname,
      params.childNickname,
    ),
    buildNaggingKarmaPrescription(
      params.pair,
      params.parentNickname,
      params.childNickname,
    ),
  ].filter((item): item is FamilyPrescriptionItem => item != null);

  const items =
    candidates.length > 0
      ? candidates
      : [buildFamilyBaseline(params.parentNickname, params.childNickname)];

  if (candidates.length > 0 && candidates.length < 2) {
    items.push(
      buildFamilyBaseline(params.parentNickname, params.childNickname),
    );
  }

  const priority: Record<FamilyPrescriptionItem["topic"], number> = {
    nagging_karma_avoidance: 100,
    umbilical_independence: 90,
    family_baseline: 10,
  };
  items.sort((a, b) => priority[b.topic] - priority[a.topic]);

  return {
    schema_version: FAMILY_PRESCRIPTION_VERSION,
    intro_line: resolveIntroLine(items),
    items,
  };
}
