import assert from "node:assert";
import {
  isStaleWorkReportBlock,
  isStaleCohabitationReportBlock,
} from "@/lib/relationship/reportStalenessGuard";

console.log("==========================================");
console.log("Report Cache Staleness Guard Unit Tests");
console.log("==========================================");

// Test 1
const legacyWorkPayload = {
  format: "work_colleague_deep_v1",
  report: {
    office: {
      my_work_style: { headline: "Old Style" },
    },
  },
};
assert.strictEqual(isStaleWorkReportBlock(legacyWorkPayload), true);
console.log("✓ Reject legacy Work report lacking canonical sections verified");

// Test 2
const modernWorkPayload = {
  format: "work_colleague_deep_v1",
  report: {
    office: {
      section_roles: { person_a: {}, person_b: {} },
      section_mix_fit: { fit_pct: 85 },
      section_respect: { headline: "Valid" },
    },
  },
};
assert.strictEqual(isStaleWorkReportBlock(modernWorkPayload), false);
console.log("✓ Accept modern VNext Work report containing canonical sections verified");

// Test 3
const legacyMarriagePayload = {
  format: "cohabitation_deep_v1",
  report: {
    household: {
      summary_line: "Old Summary",
    },
  },
};
assert.strictEqual(isStaleCohabitationReportBlock(legacyMarriagePayload), true);
console.log("✓ Reject legacy Cohabitation report lacking canonical plan/chapter intelligences verified");

// Test 4
const modernMarriagePayload = {
  format: "cohabitation_deep_v1",
  report: {
    canonicalStoryPlan: {
      chapters: [{ chapterId: "c1_who_we_are" }],
    },
    chapter07Intelligence: { introNarrative: "Valid" },
    chapter08Intelligence: { introSentence: "Valid" },
    household: {
      section_dna: { person_a: {}, person_b: {} },
    },
  },
};
assert.strictEqual(isStaleCohabitationReportBlock(modernMarriagePayload), false);
console.log("✓ Accept modern VNext Cohabitation report containing canonical plan verified");

// Test 5: Family Staleness Guard
import { isStaleFamilyReportBlock } from "@/lib/relationship/reportStalenessGuard";

const legacyFamilyPayload = {
  format: "family_parent_child_deep_v1",
  report: {
    family: {
      summary_line: "Old Family Report",
    },
  },
};
assert.strictEqual(isStaleFamilyReportBlock(legacyFamilyPayload), true);
console.log("✓ Reject legacy Family report lacking canonical story plan / household roles verified");

const modernFamilyPayload = {
  format: "family_parent_child_deep_v1",
  report: {
    family: {
      section_household_roles: { parent_roles: {}, child_roles: {} },
      section_snapshot: { one_line_family: "Modern Family" },
    },
    canonical_projections: {
      story_plan: { chapters: [] },
    },
  },
};
assert.strictEqual(isStaleFamilyReportBlock(modernFamilyPayload), false);
console.log("✓ Accept modern VNext Family report containing canonical story plan verified");

// Test 6: Romantic V4 Upgrade Contract Property Lookups
import { buildActualFourCeContract } from "@/lib/relationship/romantic/prototypeV4/buildActualFourCeContract";
import { buildRomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { buildCanonicalRelationshipStoryPlan } from "@/lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan";

const { contract: actualContract } = buildActualFourCeContract("ko-KR");
const realV4Payload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
  contractOverride: actualContract,
});

// Verify that extracting preNarrativeContract and canonicalReport allows buildCanonicalRelationshipStoryPlan to run cleanly
const extractedContract = realV4Payload.preNarrativeContract;
const extractedCanonicalReport = realV4Payload.canonicalReport;
assert.ok(extractedContract, "preNarrativeContract must exist on RomanticV4PrototypePayload");
assert.ok(extractedCanonicalReport, "canonicalReport must exist on RomanticV4PrototypePayload");

const freshPlan = buildCanonicalRelationshipStoryPlan({
  contract: extractedContract,
  report: extractedCanonicalReport as any,
  axisResults: realV4Payload.axisOverview,
  locale: "ko-KR",
  reportYear: 2026,
});
assert.ok(freshPlan && freshPlan.romanticGapBatch, "freshPlan.romanticGapBatch should be generated");
console.log("✓ Romantic V4 upgrade using preNarrativeContract & canonicalReport verified");

// Test 7: Family Role Intelligence Non-Zero & Differentiated Calculations
import { evaluateRoleDimensions } from "@/lib/relationship/familyParent/familyRoleIntelligence";

const mockContext: any = {
  locale: "ko-KR",
  tenGod: {
    countsParent: { "정관": 2, "정인": 1, "정재": 1 },
    countsChild: { "식신": 2, "비견": 1 },
  },
};

const mockPsychParent: any = {
  secondary_axes: {
    empathy: 75,
    structure: 80,
    resilience: 70,
    energy_style: 65,
  },
};

const mockPsychChild: any = {
  secondary_axes: {
    empathy: 40,
    structure: 30,
    resilience: 45,
    energy_style: 85,
  },
};

const parentDims = evaluateRoleDimensions("parent", mockContext, mockPsychParent);
const childDims = evaluateRoleDimensions("child", mockContext, mockPsychChild);

// Saju & Psych role inputs should not be zero/defaults
assert.ok(parentDims.stabilizing > 50, "Parent stabilizing score should be high due to 관성 count + structure score");
assert.ok(parentDims.careTaking > 40, "Parent careTaking score should reflect 인성 count + empathy score");
assert.ok(childDims.tensionReleasing > 50, "Child tensionReleasing score should reflect 식신 count + energy_style score");
assert.notDeepStrictEqual(parentDims, childDims, "Parent and Child role dimensions must be meaningfully different");
console.log("✓ Family role intelligence non-zero and profile-differentiated calculations verified");

console.log("==========================================");
console.log("ALL STALENESS GUARD AND P1 FIX UNIT TESTS PASSED!");
console.log("==========================================");

