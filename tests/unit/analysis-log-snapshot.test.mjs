/**
 * Analysis log snapshot — deep kinds must store `.report` for replay.
 * Run: node --experimental-strip-types tests/unit/analysis-log-snapshot.test.mjs
 * Or: npx tsx tests/unit/analysis-log-snapshot.test.mjs
 */
import assert from "node:assert/strict";
import { buildAnalysisLogSnapshot } from "../../lib/relationship/analysisLog.ts";
import { parseAnalysisLogSnapshot } from "../../lib/relationship/detail/parseAnalysisLogSnapshot.ts";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/index.ts";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/workColleague/index.ts";
import { COHABITATION_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/cohabitation/index.ts";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/familyParentChild/index.ts";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/friendSocial/index.ts";

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}

const viewer = "11111111-1111-1111-1111-111111111111";

for (const [label, format, reportBody] of [
  [
    "romantic",
    ROMANTIC_SAJU_DEEP_FORMAT,
    {
      section_1_summary: { relationship_name: "연인" },
      section_2_nature: {
        a_nature: { description: "a" },
        b_nature: { description: "b" },
      },
    },
  ],
  [
    "work",
    WORK_COLLEAGUE_DEEP_FORMAT,
    { headline: "동료", snapshot_panel: { relationshipGauges: [1] } },
  ],
  [
    "cohabitation",
    COHABITATION_DEEP_FORMAT,
    { headline: "동거", snapshot_panel: { relationshipGauges: [1] } },
  ],
  [
    "friendship",
    FRIEND_SOCIAL_DEEP_FORMAT,
    {
      headline: "친구",
      friend: { section_social_dna_a: { social_title: "소셜" } },
    },
  ],
  [
    "family",
    FAMILY_PARENT_CHILD_DEEP_FORMAT,
    {
      headline: "가족",
      family: { section_child_dna: { genius_title: "재능" } },
    },
  ],
]) {
  const snap = buildAnalysisLogSnapshot({
    resultFormat: format,
    payload: { format, report: reportBody },
    viewerReportId: viewer,
  });
  assert.equal(snap.report, reportBody, `${label}: report extracted`);
  assert.equal(snap.perspective, undefined, `${label}: no perspectives fallthrough`);
  ok(`buildAnalysisLogSnapshot stores report for ${label}`);
}

// Legacy broken friendship/family logs stored `full` instead of `report`.
const legacyFriendLog = {
  id: "log-1",
  relationship_kind: "friendship",
  analysis_level: "premium",
  result_format: FRIEND_SOCIAL_DEEP_FORMAT,
  result_snapshot: {
    perspective: null,
    full: {
      format: FRIEND_SOCIAL_DEEP_FORMAT,
      report: {
        friend: { section_social_dna_a: { social_title: "소셜" } },
      },
    },
  },
};
const parsedLegacy = parseAnalysisLogSnapshot(legacyFriendLog, "romantic");
assert.equal(parsedLegacy.kind, "friendship");
assert.equal(
  parsedLegacy.snapshot.friendshipDeep?.friend?.section_social_dna_a?.social_title,
  "소셜",
);
ok("parseAnalysisLogSnapshot recovers friendship report from legacy full.report");

const legacyFamilyLog = {
  id: "log-2",
  relationship_kind: "family",
  analysis_level: "premium",
  result_format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
  result_snapshot: {
    perspective: null,
    full: {
      format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
      report: {
        family: { section_child_dna: { genius_title: "재능" } },
      },
    },
  },
};
const parsedFamily = parseAnalysisLogSnapshot(legacyFamilyLog, "romantic");
assert.equal(parsedFamily.kind, "family");
assert.equal(
  parsedFamily.snapshot.familyDeep?.family?.section_child_dna?.genius_title,
  "재능",
);
ok("parseAnalysisLogSnapshot recovers family report from legacy full.report");

console.log(`\n${passed} passed`);
