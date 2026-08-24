// Targeted verification of the Ch05 -> Ch07 conflictLoop wiring fix
// (Family engineering cleanup pass). Full end-to-end report generation
// (buildFamilyParentReport) currently throws on unrelated, pre-existing
// bugs from concurrent in-progress work (missing imports in
// familyPsychRoles.ts, familyRoleIntelligence.ts, etc. — confirmed present
// on a clean git-stash baseline too, so not caused by this cleanup pass).
// This script calls the two functions this fix actually touches directly,
// bypassing the broken orchestration layer, to prove the fix itself works.
import { buildFamilyConflictChapterBundle } from "@/lib/relationship/familyParent/familyConflictChapterEngine";
import { buildFamilyRepairChapterBundle } from "@/lib/relationship/familyParent/familyRepairChapterEngine";
import { buildFamilyRuleContext } from "@/lib/relationship/familyParent/buildFamilyRuleContext";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";

const sajuParent: SajuDataForIntegrated = { saju: { yearPillar: "갑자", monthPillar: "병자", dayPillar: "경자", hourPillar: "무자" } };
const sajuChild: SajuDataForIntegrated = { saju: { yearPillar: "을축", monthPillar: "정미", dayPillar: "신미", hourPillar: "기미" } };
const sajuParent2: SajuDataForIntegrated = { saju: { yearPillar: "무진", monthPillar: "갑인", dayPillar: "정묘", hourPillar: "임인" } };
const sajuChild2: SajuDataForIntegrated = { saju: { yearPillar: "계유", monthPillar: "을묘", dayPillar: "기해", hourPillar: "병인" } };

function mockPsych(overrides: Record<string, number>) {
  return {
    secondaryAxes: { conflict_style: 50, structure: 50, autonomy: 50, ...overrides },
    primaryAxes: {},
  };
}

const pairs = [
  {
    label: "Sera(parent) x 동글(child)",
    sajuA: sajuParent,
    sajuB: sajuChild,
    psychParent: mockPsych({ conflict_style: 80 }),
    psychChild: mockPsych({ conflict_style: 20 }),
  },
  {
    label: "materially different pair (autonomy-flavored)",
    sajuA: sajuParent2,
    sajuB: sajuChild2,
    psychParent: mockPsych({ conflict_style: 30, autonomy: 20 }),
    psychChild: mockPsych({ conflict_style: 75, autonomy: 85 }),
  },
];

for (const p of pairs) {
  console.log(`\n=== ${p.label} ===`);
  const ctx = buildFamilyRuleContext({
    nicknameA: "부모", nicknameB: "자녀",
    roles: { roleA: "mother", roleB: "child" },
    sajuJsonA: p.sajuA, sajuJsonB: p.sajuB,
    locale: "ko-KR",
  });

  const conflictBundle = buildFamilyConflictChapterBundle({
    ctx,
    report: { canonical_projections: {} } as any,
    psychParent: p.psychParent as any,
    psychChild: p.psychChild as any,
    psychProjections: [],
  });

  console.log("Ch05 conflictLoop.step1ParentTrigger:", conflictBundle.conflictLoop.step1ParentTrigger);
  console.log("Ch05 conflictLoop.step2ChildReaction:", conflictBundle.conflictLoop.step2ChildReaction);

  const repairBundle = buildFamilyRepairChapterBundle({
    childNickname: "자녀",
    parentNickname: "부모",
    locale: "ko-KR",
    psychChild: mockPsych({}) as any,
    psychParent: mockPsych({}) as any,
    conflictLoop: conflictBundle.conflictLoop,
  });

  console.log("Ch07 harmfulReason:", repairBundle.doAndDontRepair.harmfulReason);

  const quotesTrigger = repairBundle.doAndDontRepair.harmfulReason.includes(conflictBundle.conflictLoop.step1ParentTrigger);
  const quotesReaction = repairBundle.doAndDontRepair.harmfulReason.includes(conflictBundle.conflictLoop.step2ChildReaction);
  console.log("Ch07 quotes Ch05's real step1ParentTrigger:", quotesTrigger);
  console.log("Ch07 quotes Ch05's real step2ChildReaction:", quotesReaction);
  console.log("VERDICT:", quotesTrigger && quotesReaction ? "PASS" : "FAIL");
}
