/** 4대 도메인 처방전 UI 공통 계약 — meta.prescription_* 슬롯과 호환 */
export type PairPrescriptionDomain =
  | "cohabitation"
  | "work"
  | "friendship"
  | "family";

export type PairPrescriptionEvidence = {
  source: string;
  signal_paths: string[];
  summary: string;
  snapshot: Record<string, unknown>;
};

export type PairPrescriptionItem = {
  topic: string;
  headline: string;
  evidence: PairPrescriptionEvidence;
  do_list: string[];
  dont_list: string[];
};

export type PairPrescriptionPack = {
  schema_version: string;
  intro_line: string;
  items: PairPrescriptionItem[];
};

export const PAIR_PRESCRIPTION_TOPIC_META: Record<
  string,
  { label: string; emoji: string }
> = {
  // cohabitation
  secret_affinity: { label: "비언어적 친밀", emoji: "💫" },
  cfo_power_struggle: { label: "경제권·집안 규칙", emoji: "💸" },
  day_palace_tension: { label: "생활 리듬 긴장", emoji: "🏠" },
  home_baseline: { label: "집안 운영 기본", emoji: "📋" },
  // work
  micromanaging_coordination: { label: "마이크로 매니징", emoji: "🎯" },
  leadership_conflict: { label: "오피스 주도권", emoji: "👔" },
  office_baseline: { label: "협업 운영 기본", emoji: "📋" },
  // friendship
  energy_drain_prevention: { label: "기 빨림 방지", emoji: "🔋" },
  communication_climate: { label: "대화 온도·리듬", emoji: "🌡️" },
  friendship_baseline: { label: "우정 유지 기본", emoji: "📋" },
  // family
  umbilical_independence: { label: "정서적 독립", emoji: "🪢" },
  nagging_karma_avoidance: { label: "잔소리·카르마", emoji: "🔔" },
  family_baseline: { label: "가족 관계 기본", emoji: "📋" },
};

export function resolveTopicMeta(topic: string): {
  label: string;
  emoji: string;
} {
  return (
    PAIR_PRESCRIPTION_TOPIC_META[topic] ?? {
      label: topic.replace(/_/g, " "),
      emoji: "💊",
    }
  );
}

export const PAIR_PRESCRIPTION_DOMAIN_FOOTNOTE: Record<
  PairPrescriptionDomain,
  string
> = {
  cohabitation:
    "위 분석은 기존 생활 서사와 별도입니다. 아래는 두 사람의 생활 패턴 신호에서 뽑은 실행 체크리스트예요.",
  work: "위 분석은 기존 오피스 서사와 별도입니다. 아래는 pair.work 교차 신호 기반 실천 체크리스트예요.",
  friendship:
    "위 분석은 기존 Social DNA 서사와 별도입니다. 아래는 pair.friendship 교차 신호 기반 실천 체크리스트예요.",
  family:
    "위 분석은 기존 Child DNA 서사와 별도입니다. 아래는 pair.family 교차 신호 기반 실천 체크리스트예요.",
};
