import type { SAJU_MASTER_JSON_VERSION } from "../schemaVersion";
import type { DomainSajuSignalsPack } from "../sajuSignals/types";

/** 사주 원국 4주 */
export type SajuPillarSlot = "year" | "month" | "day" | "hour";

export type SajuMasterPillar = {
  slot: SajuPillarSlot;
  label_ko: "년주" | "월주" | "일주" | "시주";
  pillar_hangul: string;
  stem_code: string;
  branch_code: string;
};

/** 일간·월간 글자 (명시 필드 — 소비처가 pillars를 파싱하지 않도록) */
export type SajuMasterStemFocus = {
  day_stem_code: string;
  day_stem_hangul: string;
  day_stem_kor_name: string | null;
  month_stem_code: string;
  month_stem_hangul: string;
  month_stem_kor_name: string | null;
  day_branch_code: string;
  day_branch_hangul: string;
};

/**
 * 조후(한열·조습) — 오행 분포에서 산출한 0~100 스냅샷.
 * (레거시 `chartTemperature` cold/hot/neutral 의 수치화 버전)
 */
export type JohuClimateSnapshot = {
  /** 0=한(寒) 100=열(熱) */
  heat_score: number;
  /** 0=조(燥) 100=습(濕) — 수·목 비중 대 토·금 비중 */
  moisture_score: number;
  temperature_band: "cold" | "neutral" | "hot";
  moisture_band: "dry" | "neutral" | "moist";
  element_counts: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
};

/** 신강/신약 간이 추정 — 확정 사주 이론이 아닌 오행 카운트 기반 근사치 */
export type StrengthBalanceSnapshot = {
  label: string;
  note: string;
};

/** 용신·기신 후보 간이 추정 — confidence: "low"|"medium", 확정 아님 */
export type YongsinEstimateSnapshot = {
  yongsin_candidates: string[];
  gisin_candidates: string[];
  confidence: "low" | "medium";
  note: string;
};

export type HiddenStemEntry = {
  stem_code: string;
  stem_hangul: string | null;
  meaning_ko: string | null;
  /** 일지 지장간 순서 (0=여기, 1=중기, 2=정기 등) */
  order: number;
};

/** 신살·특수 신호 보유 여부 (도화=홍염살, 역마, 원진, 귀문) */
export type SajuSpecialSignalKey =
  | "dohwa"
  | "yeokma"
  | "wonjin"
  | "guimun";

export type SajuSpecialSignalFlag = {
  key: SajuSpecialSignalKey;
  /** 표시명 (예: 홍염살, 역마살) */
  name_ko: string;
  possessed: boolean;
  /** 보유 시 근거 (주·지지 위치 등) */
  evidence: string[];
};

/** ref_shinsal 기반 전체 신살 히트 (확장용) */
export type SajuShinsalHit = {
  name_ko: string;
  name_hanja: string | null;
  category: string | null;
  possessed: true;
  meaning_ko: string | null;
};

/** 12운성 — 일간 기준 각 주 지지 */
export type TwelveStageEntry = {
  pillar_slot: SajuPillarSlot;
  branch_code: string;
  stage_code: string;
  stage_kor_name: string | null;
  meaning_ko: string | null;
};

export type RelationDynamicsType =
  | "천간합"
  | "육합"
  | "삼합"
  | "방합"
  | "충"
  | "형"
  | "파"
  | "해"
  | string;

/** 원국 내 형충해합·천간합 역학 */
export type RelationDynamicsEntry = {
  type: RelationDynamicsType;
  name: string;
  interpretation: string;
  priority: number;
  /** 관련 stem/branch codes (재현·디버그용) */
  codes: string[];
};

export type TenGodPillarEntry = {
  pillar_slot: SajuPillarSlot;
  god_code: string;
  god_kor_name: string | null;
};

/**
 * 만세력 1회 계산 스냅샷 — 관계·Blueprint 소비처가 재계산 없이 읽는 SSOT.
 * `calculateSajuBundle` + 십성·신살·합충 분석 결과의 직렬화 형태.
 */
export type SajuMasterJson = {
  schema_version: typeof SAJU_MASTER_JSON_VERSION;
  engine_version: string;

  birth: {
    birth_date: string;
    chart_time: string;
    birth_time_unknown: boolean;
  };

  pillars: SajuMasterPillar[];
  stem_focus: SajuMasterStemFocus;
  johu_climate: JohuClimateSnapshot;
  strength_balance: StrengthBalanceSnapshot;
  yongsin_estimate: YongsinEstimateSnapshot;

  hidden_stems: HiddenStemEntry[];

  special_signals: SajuSpecialSignalFlag[];
  shinsal_hits: SajuShinsalHit[];

  twelve_stages: TwelveStageEntry[];
  ten_gods: TenGodPillarEntry[];

  relation_dynamics: RelationDynamicsEntry[];

  /** 4대 관계 도메인 통합 명리 신호 — PersonCore bake-in (1회 계산) */
  domain_signals: DomainSajuSignalsPack;

  validation: {
    ok: boolean;
    notes: string[];
  };
};
