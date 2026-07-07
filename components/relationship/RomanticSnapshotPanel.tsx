"use client";

import type { RomanticSnapshotPanel } from "@/lib/relationship/romanticSnapshot/buildRomanticSnapshot";
import TriScoreSnapshotPanel from "./TriScoreSnapshotPanel";

/** 연인 관계 스냅샷 — TriScoreSnapshotPanel 래퍼 */
export default function RomanticSnapshotPanelView({
  panel,
}: {
  panel: RomanticSnapshotPanel;
}) {
  return <TriScoreSnapshotPanel panel={panel} kind="romantic" />;
}
