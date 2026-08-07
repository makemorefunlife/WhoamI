import { buildEnrichmentReviewPackage } from "../../lib/relationship/enrichment/buildEnrichmentReviewPackage";
import { CORPUS_CASES } from "../../lib/relationship/enrichment/corpusCases";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel";
import type { FriendReportBody } from "../../lib/relationship/friend/buildFriendReport";

console.log("=== Verifying Friend current_enriched: 11-axis reality notes + score card audit ===");

let passed = 0;
let failed = 0;

const COMPARE_ROWS_EXPECTED_NOTE = [
  "daily_share_tempo",
  "communication_rhythm",
  "hangout_planning",
  "battery_recharge",
  "upset_expression",
  "affection_language",
];

for (const caseDef of CORPUS_CASES) {
  for (const locale of ["ko-KR", "en-US"] as const) {
    const tag = `${caseDef.id} [${locale}]`;
    try {
      const pkg = buildEnrichmentReviewPackage({ domain: "friend", caseId: caseDef.id, locale });
      const report = pkg.current_enriched.report as FriendReportBody;

      // --- Task 2: score card audit ---
      const audit = report.friend?.section_snapshot?.score_card_audit;
      if (!audit) throw new Error("score_card_audit missing");
      for (const key of ["connection", "banter", "risk"] as const) {
        const item = audit[key];
        if (!item?.measures || !item?.why || !item?.level_meaning) {
          throw new Error(`score_card_audit.${key} incomplete: ${JSON.stringify(item)}`);
        }
      }
      const riskBlob = `${audit.risk.measures} ${audit.risk.level_meaning}`;
      const mentionsDirection =
        locale === "en-US" ? /lower is better/i.test(riskBlob) : /낮을수록 좋/.test(riskBlob);
      if (!mentionsDirection) throw new Error("risk card doesn't clarify lower-is-better direction");

      // --- Task 1: 11-axis reality notes distributed onto existing sections ---
      const rows = report.friend?.section_compare_table ?? [];
      const rowById = new Map(rows.map((r) => [r.id, r]));
      const hasPsych = rows.some((r) => typeof r.psych_note === "string" && r.psych_note.length > 0);

      for (const rowId of COMPARE_ROWS_EXPECTED_NOTE) {
        const row = rowById.get(rowId as (typeof COMPARE_ROWS_EXPECTED_NOTE)[number]);
        if (!row) throw new Error(`compare row ${rowId} missing`);
        if (hasPsych && !row.psych_note) {
          throw new Error(`compare row ${rowId} missing psych_note when psych present`);
        }
      }
      const hf = report.friend?.section_hidden_flow;
      const de = report.friend?.section_de_escalation;
      if (hasPsych && !hf?.counseling_gap_note) throw new Error("counseling_gap_note missing when psych present");
      if (hasPsych && !de?.recovery_pace_note) throw new Error("recovery_pace_note missing when psych present");

      if (caseDef.id === "sparse_psych" && (hf?.counseling_gap_note || de?.recovery_pace_note)) {
        throw new Error("sparse_psych should not have axis reality notes (psych incomplete)");
      }

      // --- viewModel wiring smoke test ---
      const vm = buildFriendReportViewModel(report, {
        viewerIsReportA: true,
        myName: report.meta.nickname_a,
        partnerName: report.meta.nickname_b,
        locale,
      });
      const snapshotSection = vm.sections.find((s) => s.type === "snapshot") as any;
      if (!snapshotSection?.scoreCardAudit) throw new Error("viewModel snapshot.scoreCardAudit missing");
      const hiddenFlowSection = vm.sections.find((s) => s.type === "hidden_flow") as any;
      if (hasPsych && hiddenFlowSection && !hiddenFlowSection.counselingGapNote) {
        throw new Error("viewModel hidden_flow.counselingGapNote missing");
      }
      const deEscSection = vm.sections.find((s) => s.type === "de_escalation") as any;
      if (hasPsych && deEscSection && !deEscSection.recoveryPaceNote) {
        throw new Error("viewModel de_escalation.recoveryPaceNote missing");
      }
      const compareSection = vm.sections.find((s) => s.type === "compare_table") as any;
      if (hasPsych && compareSection) {
        const missing = compareSection.rows.filter(
          (r: any) => COMPARE_ROWS_EXPECTED_NOTE.includes(r.id) && !r.psych_note,
        );
        if (missing.length) {
          throw new Error(`viewModel compare rows missing psych_note: ${missing.map((m: any) => m.id).join(",")}`);
        }
      }

      console.log(`ok   ${tag} — psych=${hasPsych ? "present" : "absent"}`);
      passed++;
    } catch (err) {
      console.error(`FAIL ${tag}:`, (err as Error).message);
      failed++;
    }
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
