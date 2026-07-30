/**
 * Verifies the Romantic V2 signal-connection batch (dohwa fix,
 * unconscious_role_play + balance_of_power -> Flow, cross_chart_tension ->
 * Conflict Translation, null meant suppression, good_match/drawn_to_each_other
 * sourcing + render eligibility). Run with: npx tsx tests/scripts/verify-romantic-connection-batch.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { buildSpecialSignals } from "../../lib/personCore/mappers/mapSajuMasterJson";
import type { ChartContext } from "../../lib/saju/chartContext";
import { resolveCrossChartTension } from "../../lib/relationship/romanticRules/relationshipDynamics";
import {
  romanticExperienceCompleteFixture,
  romanticExperienceStructuralTensionFixture,
} from "../../lib/relationship/romantic/experience/romanticExperienceDevFixtures";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel";
import { buildRomanticPremiumNarrative } from "../../lib/relationship/romantic/experience/buildRomanticPremiumNarrative";

let failed = false;
function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`PASS: ${label}`);
  } else {
    console.error(`FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed = true;
  }
}

function baseVm(report: unknown) {
  return buildRomanticExperienceViewModel({
    report: report as any,
    viewerIsReportA: true,
    myName: "지민",
    partnerName: "정우",
    nameA: "지민",
    nameB: "정우",
  });
}

// ---- 1. dohwa fix: 함지살-only chart must still flag dohwa=true ----
const fakeChart = { branchCodes: new Set<string>() } as unknown as ChartContext;
const dohwaHong = buildSpecialSignals(fakeChart, [{ name_ko: "홍염살" } as any]).find(
  (s) => s.key === "dohwa",
)!;
const dohwaHam = buildSpecialSignals(fakeChart, [{ name_ko: "함지살" } as any]).find(
  (s) => s.key === "dohwa",
)!;
const dohwaNone = buildSpecialSignals(fakeChart, [{ name_ko: "천을귀인" } as any]).find(
  (s) => s.key === "dohwa",
)!;

check("dohwa possessed=true for 홍염살-only chart", dohwaHong.possessed === true);
check(
  "dohwa possessed=true for 함지살-only chart (previously silently dropped)",
  dohwaHam.possessed === true,
  JSON.stringify(dohwaHam),
);
check("dohwa evidence includes shinsal:함지살", dohwaHam.evidence.includes("shinsal:함지살"));
check("dohwa possessed=false with neither source", dohwaNone.possessed === false);

// ---- 2/4. Flow renders unconscious_role_play + balance_of_power fallback ----
const vmComplete = baseVm(romanticExperienceCompleteFixture);
check("Flow available with complete fixture", vmComplete.flow.available === true);
check(
  "Flow includes role_frame node (unconscious_role_play reaches the VM)",
  vmComplete.flow.nodes.some((n) => n.key === "role_frame"),
);

const balanceOnlyReport = {
  ...romanticExperienceCompleteFixture,
  canonical_projections: {
    ...romanticExperienceCompleteFixture.canonical_projections,
    unconscious_role_play: undefined,
  },
};
const vmBalanceOnly = baseVm(balanceOnlyReport);
check(
  "Flow falls back to the balance node when role_play is absent (balance_of_power reaches the VM)",
  vmBalanceOnly.flow.nodes.some((n) => n.key === "balance"),
);

// ---- 3. cross_chart_tension resolver + canonical wiring + confidence corroboration ----
function fakeHit(type: string, weightedPriority: number) {
  return {
    personA_pillar: "일주(갑자)",
    personB_pillar: "일주(경오)",
    type,
    interpretation: "test hit",
    priority: weightedPriority,
    palaceWeight: 1,
    weightedPriority,
  };
}

const tensionHigh = resolveCrossChartTension([
  fakeHit("충", 90),
  fakeHit("육합", 80),
  fakeHit("형", 70),
]);
check(
  "resolveCrossChartTension excludes 육합 and bands 'high' at 2 tension hits",
  tensionHigh.band === "high" &&
    tensionHigh.hitCount === 2 &&
    tensionHigh.dominantType === "충",
  JSON.stringify(tensionHigh),
);

const tensionNone = resolveCrossChartTension([fakeHit("육합", 80)]);
check(
  "resolveCrossChartTension returns band 'none' with only 육합 present",
  tensionNone.band === "none" && tensionNone.dominantType === null,
);

const completeNoTensionNoExpression = {
  ...romanticExperienceCompleteFixture,
  canonical_projections: {
    ...romanticExperienceCompleteFixture.canonical_projections,
    expression_speed: undefined,
    cross_chart_tension: undefined,
  },
};
const vmBaseline = baseVm(completeNoTensionNoExpression);
check(
  "Conflict confidence is 'low' without expression_speed or cross_chart_tension",
  vmBaseline.conflictTranslation.confidence === "low",
);

const vmTension = baseVm(romanticExperienceStructuralTensionFixture);
check(
  "Conflict confidence rises to 'medium' when cross_chart_tension (high) is the only structural evidence",
  vmTension.conflictTranslation.confidence === "medium",
  vmTension.conflictTranslation.confidence,
);
check(
  "Conflict evidence array includes canonical_projections.cross_chart_tension",
  vmTension.conflictTranslation.evidence.some(
    (e) => e.path === "canonical_projections.cross_chart_tension",
  ),
);

// ---- 5. meant is still always null at the data layer (UI suppression is the visible fix) ----
check(
  "projectConflictPattern still guarantees meant=null (no invention) for every row",
  vmComplete.conflictTranslation.rows.every((r) => r.meant === null),
);

// ---- 6. drawn_to_each_other reads typed balance_of_power; good_match/drawn_to_each_other unrendered ----
const narrative = buildRomanticPremiumNarrative(vmComplete, romanticExperienceCompleteFixture as any);
const drawn = narrative.find((m) => m.id === "drawn_to_each_other");
check("drawn_to_each_other module builds", Boolean(drawn));
check(
  "drawn_to_each_other answer names both people from typed balance_of_power (fixture: balance_a=leader=지민)",
  Boolean(drawn && drawn.answer.includes("지민") && drawn.answer.includes("정우")),
  drawn?.answer,
);

const viewSourcePath = path.resolve(
  process.cwd(),
  "components/relationship/romantic/experience/RomanticExperienceView.tsx",
);
const viewSource = fs.readFileSync(viewSourcePath, "utf8");
check(
  "good_match is not wired into the rendered view (duplicates Hero gauges)",
  !viewSource.includes('getModule("good_match")'),
);
check(
  "drawn_to_each_other is not wired into the rendered view (duplicates Flow)",
  !viewSource.includes('getModule("drawn_to_each_other")'),
);
check(
  "RomanticFlowSection is wired into the rendered view",
  viewSource.includes("<RomanticFlowSection"),
);

if (failed) {
  console.error("\nOne or more checks FAILED.");
  process.exit(1);
} else {
  console.log("\nAll checks PASSED.");
}
