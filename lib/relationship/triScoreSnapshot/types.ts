import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";
import type { SnapshotNarrative } from "@/lib/relationship/romanticSnapshot/buildSnapshotNarrative";

export type SnapshotAxisBar = {
  key: PrimaryAxisKey;
  label: string;
  value: number;
};

export type PersonSnapshotGauges = {
  nickname: string;
  metaphor: string;
  axes: SnapshotAxisBar[];
};

export type RelationshipTopicGauge = {
  topic: "intimacy" | "stability" | "conflict";
  label: string;
  activation: number;
  benefit: number;
  risk: number;
};

/** 연인·동료 공통 스냅샷 패널 형태 */
export type TriScoreSnapshotPanel = {
  grade: string;
  gaugeLabel: string;
  representativeLine: string;
  keywords: string[];
  relationshipGauges: RelationshipTopicGauge[];
  personA: PersonSnapshotGauges;
  personB: PersonSnapshotGauges;
  personAxesSource: "survey" | "saju_estimate" | "hidden";
  narrative: SnapshotNarrative;
};

/** @deprecated romantic 전용 이름 — TriScoreSnapshotPanel 과 동일 */
export type RomanticSnapshotPanel = TriScoreSnapshotPanel;
