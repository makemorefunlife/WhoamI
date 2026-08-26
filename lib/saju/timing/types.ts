import type { Gender } from "@/lib/personCore/types/psychMaster";

export type TimingDirection = "FORWARD" | "REVERSE";

export type DaewoonRelationFact = {
  type: string; // e.g. "branch_clash", "branch_six_combine"
  label: string; // e.g. "충", "육합"
  targetPillar: "year" | "month" | "day" | "hour";
  targetBranchCode: string;
};

export type DaewoonPeriod = {
  sequence: number; // 1, 2, 3...
  pillar: string; // e.g. "정축"
  stemCode: string; // e.g. "jeong"
  branchCode: string; // e.g. "chuk"
  tenGodCode: string; // Ten God relative to Day Master (e.g. "jeong-gwan")
  tenGodKorName: string; // e.g. "정관"
  startAge: number; // e.g. 33
  endAge: number; // e.g. 42
  startYear: number; // e.g. 2023
  endYear: number; // e.g. 2032
  natalRelations: DaewoonRelationFact[];
};

export type DaewoonResult = {
  gender: Gender;
  direction: TimingDirection;
  startAge: number;
  daysToBoundary: number;
  periods: DaewoonPeriod[];
};

export type SeunRelationFact = {
  type: string; // e.g. "branch_clash", "branch_six_combine"
  label: string; // e.g. "충", "육합"
  targetPillar: "year" | "month" | "day" | "hour";
  targetBranchCode: string;
};

export type SeunYearFact = {
  year: number;
  pillar: string; // e.g. "병오"
  stemCode: string; // e.g. "byeong"
  branchCode: string; // e.g. "o"
  tenGodCode: string; // e.g. "pyeongwan"
  tenGodKorName: string; // e.g. "편관"
  // Daewoon Background Context active for this year
  currentDaewoonPillar: string; // e.g. "정축"
  currentDaewoonStemCode: string; // e.g. "jeong"
  currentDaewoonBranchCode: string; // e.g. "chuk"
  currentDaewoonTenGodCode: string; // e.g. "jeonggwan"
  currentDaewoonTenGodKorName: string; // e.g. "정관"
  // Cross-layer relations
  relations: SeunRelationFact[];
  dayBranchRelation: string | null; // e.g. "branch_clash" or null
  daewoonSeunRelation: { type: string; label: string } | null; // Daewoon Branch x Seun Branch relation
};

export type TimingFacts = {
  personId?: string;
  birthDate: string;
  birthYear: number;
  gender: Gender;
  dayMasterStemCode: string;
  dayBranchCode: string;
  daewoon: DaewoonResult;
  yearlySeun: SeunYearFact[];
};

export type CESignalStrength = "STRONG" | "MODERATE" | "WEAK";
export type CEConfidence = "HIGH" | "MEDIUM" | "LOW";

export type CESource = {
  layer: "DAEWOON" | "SEUN" | "CROSS_LAYER" | "NATAL";
  factType: "TEN_GOD" | "BRANCH_RELATION" | "SHIFT_PROXIMITY";
  value: string;
};

export type CanonicalTimingSignal = {
  key: string;
  strength: CESignalStrength;
  factConfidence: CEConfidence; // Fact calculation certainty (usually HIGH)
  interpretationConfidence: CEConfidence; // Semantic hypothesis certainty (usually MEDIUM)
  sources: CESource[];
  evidenceIds: string[];
  supportingFacts: string[];
};

export type CanonicalTimingEvidencePackage = {
  birthDate: string;
  targetYears: number[];
  signals: CanonicalTimingSignal[];
};
