/**
 * Friendship CE → LLM prompt digest (explain-only).
 * Reads canonical_projections (+ optional context_output). Does not re-resolve.
 * Independent of romantic / marriage / family / business digests.
 */

import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import type { FriendComparisonTableValue } from "@/lib/relationship/friend/friendComparisonTableCanonical";
import type { FriendCompareRowId } from "@/lib/relationship/friend/friendSajuCompareTable";
import type { FriendTreasurerClientValue } from "@/lib/relationship/friend/friendTreasurerCanonical";
import type { FriendTravelPlannerValue } from "@/lib/relationship/friend/friendTravelPlannerCanonical";
import type { FriendContextOutput } from "@/lib/relationship/friend/friendContextOutput";

const ROW_LABEL_KO: Record<FriendCompareRowId, string> = {
  daily_share_tempo: "일상 공유·연락 템포",
  upset_expression: "서운함 표현",
  affection_language: "호감 표현 언어",
  battery_recharge: "배터리·회복",
  hangout_planning: "만남·약속 계획",
  communication_rhythm: "티키타카·소통 리듬",
};

const BAND_LABEL_KO: Record<string, string> = {
  active: "활발한 편",
  steady: "차분한 편",
  wealth: "재성 쪽",
  officer: "관성 쪽",
  food: "식상 쪽",
  seal: "인성 쪽",
  self: "비겁 쪽",
  wood: "목 채널",
  fire: "화 채널",
  earth: "토 채널",
  metal: "금 채널",
  water: "수 채널",
  strong: "강함",
  weak: "약함",
  balanced: "균형",
  none: "거의 없음",
  some: "어느 정도",
  a: "A 쪽",
  b: "B 쪽",
};

export type FriendDigestLeanRow = {
  band_a: string;
  band_b: string;
  confidence?: string | null;
  align?: string | null;
};

export type FriendDigestLeans = Partial<
  Record<FriendCompareRowId, FriendDigestLeanRow>
>;

function bandKo(band: string): string {
  return BAND_LABEL_KO[band] ?? band;
}

function rowMismatch(a: string, b: string): boolean {
  return Boolean(a && b && a !== b);
}

/** True when key friend compare bands disagree (or treasurer/travel caution). */
export function inferFriendMismatchRoles(params: {
  comparison?: FriendComparisonTableValue | null;
  treasurer?: FriendTreasurerClientValue | null;
  travelPlanner?: FriendTravelPlannerValue | null;
}): boolean {
  if (params.treasurer?.align === "caution") return true;
  if (params.travelPlanner?.align === "caution") return true;
  const t = params.comparison;
  if (!t) return false;
  return (
    rowMismatch(t.daily_share_tempo.band_a, t.daily_share_tempo.band_b) ||
    rowMismatch(t.upset_expression.band_a, t.upset_expression.band_b) ||
    rowMismatch(t.affection_language.band_a, t.affection_language.band_b) ||
    rowMismatch(t.battery_recharge.band_a, t.battery_recharge.band_b) ||
    rowMismatch(t.hangout_planning.band_a, t.hangout_planning.band_b) ||
    rowMismatch(
      t.communication_rhythm.band_a,
      t.communication_rhythm.band_b,
    )
  );
}

export function comparisonLeansFromFriendProjections(
  comparison?: FriendComparisonTableValue | null,
  _context?: FriendContextOutput | null,
): FriendDigestLeans {
  if (!comparison) return {};
  const out: FriendDigestLeans = {};
  const ids: FriendCompareRowId[] = [
    "daily_share_tempo",
    "upset_expression",
    "affection_language",
    "battery_recharge",
    "hangout_planning",
    "communication_rhythm",
  ];
  for (const id of ids) {
    const row = comparison[id];
    out[id] = {
      band_a: row.band_a,
      band_b: row.band_b,
      confidence: null,
      align: null,
    };
  }
  return out;
}

export function buildFriendHouseholdDigest(params: {
  nicknameA: string;
  nicknameB: string;
  report: Pick<
    FriendReportBody,
    "canonical_projections" | "context_output" | "meta"
  >;
}): string {
  const { nicknameA, nicknameB, report } = params;
  const table = report.canonical_projections?.comparison_table ?? null;
  const treasurer = report.canonical_projections?.treasurer ?? null;
  const travelPlanner = report.canonical_projections?.travel_planner ?? null;
  const mismatch = inferFriendMismatchRoles({
    comparison: table,
    treasurer,
    travelPlanner,
  });

  const lines: string[] = [
    `# friend_digest (canonical — explain only)`,
    `pair: A=${nicknameA} × B=${nicknameB}`,
    `domain: friend / social`,
    `mismatch_roles: ${mismatch}`,
    `grade: ${report.meta?.grade ?? "(n/a)"}`,
  ];

  lines.push(`comparison_table (band_a / band_b):`);
  if (!table) {
    lines.push(`  (canonical comparison_table 없음 — 추측 금지)`);
  } else {
    const ids: FriendCompareRowId[] = [
      "daily_share_tempo",
      "upset_expression",
      "affection_language",
      "battery_recharge",
      "hangout_planning",
      "communication_rhythm",
    ];
    for (const id of ids) {
      const row = table[id];
      const same = row.band_a === row.band_b;
      lines.push(
        `- ${id} (${ROW_LABEL_KO[id]}): ` +
          `a=${row.band_a}(${bandKo(row.band_a)}), ` +
          `b=${row.band_b}(${bandKo(row.band_b)})` +
          ` | ${same ? "same_lean" : "different"}`,
      );
    }
  }

  if (treasurer) {
    lines.push(
      `treasurer: side=${treasurer.side}` +
        (treasurer.confidence
          ? `, confidence=${treasurer.confidence}`
          : "") +
        (treasurer.align ? `, align=${treasurer.align}` : ""),
    );
  } else {
    lines.push(`treasurer: (없음 — 추측 금지)`);
  }

  if (travelPlanner) {
    lines.push(
      `travel_planner: planner_side=${travelPlanner.planner_side}` +
        (travelPlanner.confidence
          ? `, confidence=${travelPlanner.confidence}`
          : "") +
        (travelPlanner.align ? `, align=${travelPlanner.align}` : ""),
    );
  } else {
    lines.push(`travel_planner: (없음 — 추측 금지)`);
  }

  if (report.meta?.uncertain_items?.length) {
    lines.push(
      `uncertain_items: ${report.meta.uncertain_items.slice(0, 6).join(" | ")}`,
    );
  }

  const storyPlan = report.meta?.canonical_story_plan;
  if (storyPlan) {
    lines.push(`\n# CANONICAL STORYPLAN (SSOT MEANING OWNERSHIP)`);
    for (const ch of storyPlan.chapters) {
      lines.push(
        `[Chapter ${ch.chapterNumber}: ${ch.chapterKey}] ${ch.title}\n` +
        `  User Question: ${ch.userQuestion}\n` +
        `  Primary Meanings: ${ch.primaryMeanings.join(", ")}\n` +
        `  Prohibited Meanings: ${ch.prohibitedMeanings.join(", ")}\n` +
        `  Goal: ${ch.narrativeGoal}`
      );
    }
    if (storyPlan.llmHandoffPayload?.discrepancyNotes?.length) {
      lines.push(`\nContextual Tensions & Discrepancy Notes:\n  - ` + storyPlan.llmHandoffPayload.discrepancyNotes.join("\n  - "));
    }
  }

  lines.push(
    `RULES: Never print internal keys (daily_share_tempo, battery_recharge, …) in user-facing prose.`,
    `Translate to natural Korean evidence bridges.`,
    `Do not invent Romantic dating, Marriage CFO/chore, Family parenting, or Business P&L axes.`,
    `Do not contradict bands / mismatch_roles / treasurer / travel_planner.`,
    `Never shame either friend; humor never at either person's expense.`,
  );

  return lines.join("\n");
}

export function friendPostValidateParamsFromReport(params: {
  nicknameA: string;
  nicknameB: string;
  report: Pick<
    FriendReportBody,
    "canonical_projections" | "context_output"
  >;
}): {
  nicknameA: string;
  nicknameB: string;
  mismatchRoles: boolean;
  comparisonLeans: FriendDigestLeans;
} {
  const comparison =
    params.report.canonical_projections?.comparison_table ?? null;
  const treasurer = params.report.canonical_projections?.treasurer ?? null;
  const travelPlanner =
    params.report.canonical_projections?.travel_planner ?? null;
  return {
    nicknameA: params.nicknameA,
    nicknameB: params.nicknameB,
    mismatchRoles: inferFriendMismatchRoles({
      comparison,
      treasurer,
      travelPlanner,
    }),
    comparisonLeans: comparisonLeansFromFriendProjections(
      comparison,
      params.report.context_output ?? null,
    ),
  };
}
