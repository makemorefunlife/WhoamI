import { getTriScoreKindConfig } from "@/lib/relationship/triScoreSnapshot/kinds";

const romantic = getTriScoreKindConfig("romantic");

/** 스냅샷 3점수 — UI 표기 (내부 필드명: activation / benefit / risk) */
export const RELATIONSHIP_TRI_SCORE_LABELS = romantic.labels;

export const RELATIONSHIP_TRI_SCORE_LEGEND_ITEMS = romantic.legendItems;
