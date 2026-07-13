/**
 * 5축 스냅샷 PersonCore 바인딩 검증
 * 실행: npx tsx tests/scripts/snapshot-panel-psych-verify.ts
 */
import { PSYCH_MASTER_JSON_VERSION } from "@/lib/personCore/schemaVersion";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import {
  mapPsychMasterToSnapshotAxes,
  resolveSnapshotPersonAxesSource,
} from "@/lib/personCore/mappers/mapPsychMasterToSnapshotAxes";
import { buildWorkSnapshotPanel } from "@/lib/relationship/workColleague/buildWorkSnapshotPanel";
import { buildFriendSnapshotPanel } from "@/lib/relationship/friend/buildFriendSnapshotPanel";
import { buildFamilyParentSnapshotPanel } from "@/lib/relationship/familyParent/buildFamilySnapshotPanel";
import { buildMarriageSnapshotPanel } from "@/lib/relationship/marriage/buildMarriageSnapshotPanel";
import { buildMarriageRuleContext } from "@/lib/relationship/marriage/buildMarriageRuleContext";
import { buildWorkColleagueContext } from "@/lib/relationship/workColleague/buildWorkColleagueContext";
import { buildFriendRuleContext } from "@/lib/relationship/friend/buildFriendRuleContext";
import { buildFamilyRuleContext } from "@/lib/relationship/familyParent/buildFamilyRuleContext";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { SECONDARY_AXIS_KEYS } from "@/lib/v2/survey/types";

function sajuFromBirth(birthDate: string): SajuDataForIntegrated {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

function samplePsych(overrides: Partial<Record<string, number>>): PsychMasterJson {
  const secondary_axes = Object.fromEntries(
    SECONDARY_AXIS_KEYS.map((k, i) => [k, overrides[k] ?? 40 + i * 5]),
  ) as PsychMasterJson["secondary_axes"];
  return {
    schema_version: PSYCH_MASTER_JSON_VERSION,
    secondary_axes,
    survey_source: "v2_10q",
    survey_completed_at: "2026-07-13T00:00:00.000Z",
    survey_input_fingerprint: "test-fp",
    home_life_dna: {
      lifestyle_title: "테스트 홈 DNA",
      family_identity_category: "balanced",
      family_identity_line: "테스트",
      life_values_line: "테스트 가치",
      private_home_self_line: "테스트",
      energy_battery_line: "테스트",
    },
  };
}

function assertSurveySnapshot(
  label: string,
  panel: { personAxesSource: string; personA: { axes: unknown[] }; personB: { axes: unknown[] } },
  psychA: PsychMasterJson,
  psychB: PsychMasterJson,
) {
  if (panel.personAxesSource !== "survey") {
    throw new Error(`${label}: personAxesSource expected survey, got ${panel.personAxesSource}`);
  }
  if (panel.personA.axes.length !== 5 || panel.personB.axes.length !== 5) {
    throw new Error(
      `${label}: expected 5 axes each, got A=${panel.personA.axes.length} B=${panel.personB.axes.length}`,
    );
  }
  const expectedA = mapPsychMasterToSnapshotAxes(psychA);
  const expectedB = mapPsychMasterToSnapshotAxes(psychB);
  for (let i = 0; i < 5; i++) {
    const a = panel.personA.axes[i] as { value: number } | undefined;
    const b = panel.personB.axes[i] as { value: number } | undefined;
    if (a?.value !== expectedA[i]!.value || b?.value !== expectedB[i]!.value) {
      throw new Error(
        `${label}: axis ${i} mismatch A=${a?.value} expected=${expectedA[i]!.value}`,
      );
    }
  }
  console.log(`OK ${label} personAxesSource=survey axes=5`);
}

const sajuA = sajuFromBirth("1990-05-15");
const sajuB = sajuFromBirth("1992-08-20");
const psychA = samplePsych({ structure: 82, empathy: 71, stimulation: 65 });
const psychB = samplePsych({ structure: 44, empathy: 88, conflict_style: 72 });

const src = resolveSnapshotPersonAxesSource(psychA, psychB);
if (src !== "survey") throw new Error(`resolveSnapshotPersonAxesSource: ${src}`);
console.log("OK resolveSnapshotPersonAxesSource=survey");

const workCtx = buildWorkColleagueContext({
  nicknameA: "민수",
  nicknameB: "지영",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
});
const workPanel = buildWorkSnapshotPanel(
  workCtx,
  { gaugeLabel: "test", representativeLine: "test" },
  { psychA, psychB },
);
assertSurveySnapshot("work", workPanel, psychA, psychB);

const friendCtx = buildFriendRuleContext({
  nicknameA: "민수",
  nicknameB: "지영",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
});
const friendPanel = buildFriendSnapshotPanel(
  friendCtx,
  undefined,
  { psychA, psychB },
);
assertSurveySnapshot("friendship", friendPanel, psychA, psychB);

const familyCtx = buildFamilyRuleContext({
  nicknameA: "아이",
  nicknameB: "엄마",
  roles: { roleA: "child", roleB: "mother" },
  parentType: "mother",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
});
const familyPanel = buildFamilyParentSnapshotPanel(
  familyCtx,
  undefined,
  { psychA, psychB },
);
assertSurveySnapshot("family", familyPanel, psychA, psychB);

const marriageCtx = buildMarriageRuleContext({
  nicknameA: "민수",
  nicknameB: "지영",
  sajuJsonA: sajuA,
  sajuJsonB: sajuB,
});
const marriagePanel = buildMarriageSnapshotPanel(
  marriageCtx,
  { gaugeLabel: "test", representativeLine: "test" },
  { psychA, psychB },
);
assertSurveySnapshot("cohabitation", marriagePanel, psychA, psychB);

console.log("All snapshot-panel PersonCore checks passed.");
