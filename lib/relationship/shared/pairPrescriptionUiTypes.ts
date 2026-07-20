/** 4대 도메인 처방전 UI 공통 계약 — meta.prescription_* 슬롯과 호환 */
import type { Locale } from "@/lib/i18n/locale";

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

/**
 * 2026-07-20 로케일 버그 수정 — 이전엔 라벨/각주가 한국어로 하드코딩돼 있어서,
 * en-US 리포트에서 "한국어 칩 라벨 + 영어 본문(headline/do_list 등, 이미
 * pick(locale,...)로 정상 분기됨)"이 섞여 나오는 문제가 있었다(사용자가
 * family 처방전에서 발견). cohabitation/work/friendship/family 4개 도메인이
 * 전부 이 파일을 공유하므로 en-US 번역만 새로 추가했고, 기존 한국어 문구·키
 * 구조·다른 로직은 전혀 안 건드렸다.
 */
export const PAIR_PRESCRIPTION_TOPIC_META: Record<
  Locale,
  Record<string, { label: string; emoji: string }>
> = {
  "ko-KR": {
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
  },
  "en-US": {
    // cohabitation
    secret_affinity: { label: "Nonverbal Intimacy", emoji: "💫" },
    cfo_power_struggle: { label: "Financial Power & House Rules", emoji: "💸" },
    day_palace_tension: { label: "Daily Rhythm Tension", emoji: "🏠" },
    home_baseline: { label: "Household Basics", emoji: "📋" },
    // work
    micromanaging_coordination: { label: "Micromanaging", emoji: "🎯" },
    leadership_conflict: { label: "Office Leadership", emoji: "👔" },
    office_baseline: { label: "Collaboration Basics", emoji: "📋" },
    // friendship
    energy_drain_prevention: { label: "Energy Drain Prevention", emoji: "🔋" },
    communication_climate: { label: "Communication Climate & Rhythm", emoji: "🌡️" },
    friendship_baseline: { label: "Friendship Basics", emoji: "📋" },
    // family
    umbilical_independence: { label: "Emotional Independence", emoji: "🪢" },
    nagging_karma_avoidance: { label: "Nagging & Karma", emoji: "🔔" },
    family_baseline: { label: "Family Relationship Basics", emoji: "📋" },
  },
};

export function resolveTopicMeta(
  topic: string,
  locale: Locale = "ko-KR",
): {
  label: string;
  emoji: string;
} {
  return (
    PAIR_PRESCRIPTION_TOPIC_META[locale]?.[topic] ?? {
      label: topic.replace(/_/g, " "),
      emoji: "💊",
    }
  );
}

export const PAIR_PRESCRIPTION_DOMAIN_FOOTNOTE: Record<
  Locale,
  Record<PairPrescriptionDomain, string>
> = {
  "ko-KR": {
    cohabitation:
      "위 분석은 기존 생활 서사와 별도입니다. 아래는 두 사람의 생활 패턴 신호에서 뽑은 실행 체크리스트예요.",
    work: "위 분석은 기존 오피스 서사와 별도입니다. 아래는 pair.work 교차 신호 기반 실천 체크리스트예요.",
    friendship:
      "위 분석은 기존 Social DNA 서사와 별도입니다. 아래는 pair.friendship 교차 신호 기반 실천 체크리스트예요.",
    family:
      "위 분석은 기존 Child DNA 서사와 별도입니다. 아래는 pair.family 교차 신호 기반 실천 체크리스트예요.",
  },
  "en-US": {
    cohabitation:
      "This analysis is separate from the existing daily-life narrative above. Below is an action checklist drawn from your daily rhythm signals as a pair.",
    work: "This analysis is separate from the existing office narrative above. Below is an action checklist drawn from your pair.work cross signals.",
    friendship:
      "This analysis is separate from the existing Social DNA narrative above. Below is an action checklist drawn from your pair.friendship cross signals.",
    family:
      "This analysis is separate from the existing Child DNA narrative above. Below is an action checklist drawn from your pair.family cross signals.",
  },
};
