import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { TriScoreSnapshotPanel } from "@/lib/relationship/triScoreSnapshot/types";
import { buildFriendRuleContext } from "./buildFriendRuleContext";
import { buildFriendSnapshotPanel } from "./buildFriendSnapshotPanel";
import { buildFriendSocialReport } from "./friendReportTemplate";

export type FriendReportBody = {
  headline: string;
  summary_line: string;
  one_line_friendship: string;
  snapshot_panel: TriScoreSnapshotPanel;
  friend: ReturnType<typeof buildFriendSocialReport>;
  meta: {
    grade: string;
    grade_reason: string;
    uncertain_items: string[];
    connection_pct: number;
    banter_pct: number;
    risk_pct: number;
    nickname_a: string;
    nickname_b: string;
  };
};

export function buildFriendReport(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
}): FriendReportBody {
  const ctx = buildFriendRuleContext(params);
  const friend = buildFriendSocialReport(ctx);

  const snapshot_panel = buildFriendSnapshotPanel(ctx, {
    gaugeLabel: "Social DNA · 우정 스냅샷",
    representativeLine: friend.section_snapshot.one_line_friendship,
  });

  return {
    headline: friend.section_snapshot.one_line_friendship,
    summary_line: `🔥 ${ctx.masterScores.connection}% · 🧩 ${ctx.masterScores.banter}% · ⚡ ${ctx.masterScores.risk}%`,
    one_line_friendship: friend.section_snapshot.one_line_friendship,
    snapshot_panel,
    friend,
    meta: {
      grade: ctx.grade,
      grade_reason: ctx.gradeReason,
      uncertain_items: ctx.uncertainItems,
      connection_pct: ctx.masterScores.connection,
      banter_pct: ctx.masterScores.banter,
      risk_pct: ctx.masterScores.risk,
      nickname_a: ctx.nicknameA,
      nickname_b: ctx.nicknameB,
    },
  };
}
