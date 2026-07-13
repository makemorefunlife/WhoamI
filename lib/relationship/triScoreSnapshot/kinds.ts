/**
 * 🔥🧩⚡ 3점수 스냅샷 — 관계 유형별 표기·해석 설정
 *
 * 비개발자용 안내:
 * - romantic = 연인 관계 분석
 * - work     = 동료·비즈니스 파트너 관계 분석
 *
 * 계산: workPairEventScores (월지·천간 중심, 연인 pairEventScores 와 분리)
 */
export type TriScoreSnapshotKind =
  | "romantic"
  | "work"
  | "cohabitation"
  | "friendship"
  | "family";

export type TriScoreLabelConfig = {
  activation: { short: string };
  benefit: { short: string };
  risk: { short: string };
};

export type TriScoreLegendItem = {
  label: string;
  emoji: string;
  meaning: string;
};

export type TriScoreTopicConfig = {
  /** 내부 키 — pairEventScores 주제와 1:1 */
  topic: "intimacy" | "stability" | "conflict";
  /** 카드 제목 */
  cardTitle: string;
  /** 카드 부제 */
  cardSubtitle: string;
};

export type TriScoreKindConfig = {
  kind: TriScoreSnapshotKind;
  labels: TriScoreLabelConfig;
  legendItems: readonly TriScoreLegendItem[];
  topics: readonly TriScoreTopicConfig[];
};

const ROMANTIC_CONFIG: TriScoreKindConfig = {
  kind: "romantic",
  labels: {
    activation: { short: "🔥 호감" },
    benefit: { short: "🧩 케미" },
    risk: { short: "⚡ 예민" },
  },
  legendItems: [
    {
      label: "호감",
      emoji: "🔥",
      meaning:
        "마음이 가고, 만나고 싶고, 호감·매력이 느껴지는 정도",
    },
    {
      label: "케미",
      emoji: "🧩",
      meaning:
        "함께 있을 때 편하고, 잘 맞고, 서로에게 도움이 되는 정도 (에너지가 맞는 느낌에 가깝게 보시면 돼요)",
    },
    {
      label: "예민",
      emoji: "⚡",
      meaning: "예민해지고, 스트레스·마찰·부딪힘이 커지는 정도",
    },
  ],
  topics: [
    {
      topic: "intimacy",
      cardTitle: "① 친밀·끌림",
      cardSubtitle: "썸·데이트·둘만 있을 때",
    },
    {
      topic: "stability",
      cardTitle: "② 안정·균형",
      cardSubtitle: "일상·미래·생활 리듬을 맞출 때",
    },
    {
      topic: "conflict",
      cardTitle: "③ 갈등·긴장",
      cardSubtitle: "의견이 부딪히거나 싸울 때",
    },
  ],
};

const WORK_CONFIG: TriScoreKindConfig = {
  kind: "work",
  labels: {
    activation: { short: "🔥 업무적 핏" },
    benefit: { short: "🧩 협업 시너지" },
    risk: { short: "⚡ 오피스 리스크" },
  },
  legendItems: [
    {
      label: "업무적 핏",
      emoji: "🔥",
      meaning:
        "함께 일하고 싶고, 회의·소통 스타일이 맞아 보이는 정도",
    },
    {
      label: "협업 시너지",
      emoji: "🧩",
      meaning:
        "같은 프로젝트에서 편하고, 서로의 강점이 살아나며 결과가 나오는 정도",
    },
    {
      label: "오피스 리스크",
      emoji: "⚡",
      meaning:
        "의견 충돌·조직 리듬 차이·업무 스트레스가 커지는 정도 (누적형)",
    },
  ],
  topics: [
    {
      topic: "intimacy",
      cardTitle: "① 업무 핏·신뢰",
      cardSubtitle: "처음 맞닿거나 역할을 맡길 때",
    },
    {
      topic: "stability",
      cardTitle: "② 프로젝트 시너지",
      cardSubtitle: "장기 협업·일정·결과를 맞출 때",
    },
    {
      topic: "conflict",
      cardTitle: "③ 업무 마찰·갈등",
      cardSubtitle: "의견이 갈리거나 압박이 올 때",
    },
  ],
};

const COHABITATION_CONFIG: TriScoreKindConfig = {
  kind: "cohabitation",
  labels: {
    activation: { short: "🔥 로맨틱 핏" },
    benefit: { short: "🧩 라이프 시너지" },
    risk: { short: "⚡ 홈 리스크" },
  },
  legendItems: [
    {
      label: "로맨틱 핏",
      emoji: "🔥",
      meaning:
        "침실·애착·스킨십 리듬이 맞고, 가까워질수록 편안한 정도",
    },
    {
      label: "라이프 시너지",
      emoji: "🧩",
      meaning:
        "가사·재정·육아·일상 리듬이 맞물려 집이 잘 돌아가는 정도",
    },
    {
      label: "홈 리스크",
      emoji: "⚡",
      meaning:
        "집 안 스트레스·갈등·정서적 방임이 커지는 정도 (누적형)",
    },
  ],
  topics: [
    {
      topic: "intimacy",
      cardTitle: "① 로맨틱 핏·애착",
      cardSubtitle: "침실·스킨십·정서적 거리",
    },
    {
      topic: "stability",
      cardTitle: "② 라이프 시너지",
      cardSubtitle: "가사·재정·육아·일상 리듬",
    },
    {
      topic: "conflict",
      cardTitle: "③ 홈 리스크",
      cardSubtitle: "집 안 갈등·스트레스·회복",
    },
  ],
};

const FRIENDSHIP_CONFIG: TriScoreKindConfig = {
  kind: "friendship",
  labels: {
    activation: { short: "🔥 우정 케미" },
    benefit: { short: "🧩 티키타카" },
    risk: { short: "⚡ 소셜 리스크" },
  },
  legendItems: [
    {
      label: "우정 케미",
      emoji: "🔥",
      meaning: "친해지고 싶고, 같이 있을 때 편한 정도",
    },
    {
      label: "티키타카",
      emoji: "🧩",
      meaning: "대화·놀거리·유머가 잘 맞는 정도",
    },
    {
      label: "소셜 리스크",
      emoji: "⚡",
      meaning: "서운함·연락 빈도·갈등이 쌓이는 정도",
    },
  ],
  topics: [
    {
      topic: "intimacy",
      cardTitle: "① 우정 케미",
      cardSubtitle: "친밀감·끌림·만남",
    },
    {
      topic: "stability",
      cardTitle: "② 티키타카",
      cardSubtitle: "대화·놀거리·리듬",
    },
    {
      topic: "conflict",
      cardTitle: "③ 소셜 리스크",
      cardSubtitle: "서운함·멀어짐·갈등",
    },
  ],
};

const FAMILY_CONFIG: TriScoreKindConfig = {
  kind: "family",
  labels: {
    activation: { short: "🔥 정서적 유대" },
    benefit: { short: "🧩 성장 시너지" },
    risk: { short: "⚡ 훈육 마찰" },
  },
  legendItems: [
    {
      label: "정서적 유대",
      emoji: "🔥",
      meaning: "부모·자녀 사이 마음이 닿고 가까운 정도",
    },
    {
      label: "성장 시너지",
      emoji: "🧩",
      meaning: "서로의 성장을 돕고 방향이 맞는 정도",
    },
    {
      label: "훈육 마찰",
      emoji: "⚡",
      meaning: "훈육·규칙·갈등에서 스트레스가 커지는 정도",
    },
  ],
  topics: [
    {
      topic: "intimacy",
      cardTitle: "① 정서적 유대",
      cardSubtitle: "부모↔자녀 마음",
    },
    {
      topic: "stability",
      cardTitle: "② 성장 시너지",
      cardSubtitle: "성장·지지·방향",
    },
    {
      topic: "conflict",
      cardTitle: "③ 훈육 마찰",
      cardSubtitle: "규칙·갈등·스트레스",
    },
  ],
};

export const TRI_SCORE_KIND_CONFIG: Record<
  TriScoreSnapshotKind,
  TriScoreKindConfig
> = {
  romantic: ROMANTIC_CONFIG,
  work: WORK_CONFIG,
  cohabitation: COHABITATION_CONFIG,
  friendship: FRIENDSHIP_CONFIG,
  family: FAMILY_CONFIG,
};

export function getTriScoreKindConfig(
  kind: TriScoreSnapshotKind,
): TriScoreKindConfig {
  return TRI_SCORE_KIND_CONFIG[kind];
}
