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

console.log("==========================================");
console.log("ALL STALENESS GUARD UNIT TESTS PASSED!");
console.log("==========================================");
