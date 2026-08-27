import assert from "node:assert";
import {
  isStaleWorkReportBlock,
  isStaleCohabitationReportBlock,
} from "@/lib/relationship/reportStalenessGuard";
// Report-schema SSOT constants (Phase 3A) — imported at the top since this
// file's tsx/CJS interop executes scattered mid-file imports in source
// order, not true ESM hoisting order; several fixtures below (Tests 2/4/6/8,
// predating Phase 3A) need these before their own textual position.
import { WORK_REPORT_SCHEMA_VERSION } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { MARRIAGE_REPORT_SCHEMA_VERSION } from "@/lib/relationship/marriage/buildMarriageReport";
import { FAMILY_REPORT_SCHEMA_VERSION } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import { FRIEND_REPORT_SCHEMA_VERSION } from "@/lib/relationship/friend/buildFriendReport";
import {
  ROMANTIC_REPORT_SCHEMA_VERSION,
  isStaleRomanticV4Block,
} from "@/lib/relationship/romantic/prototypeV4/productionAdapter/romanticV4Persistence";

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
    meta: { report_schema_version: WORK_REPORT_SCHEMA_VERSION },
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
    meta: { report_schema_version: MARRIAGE_REPORT_SCHEMA_VERSION },
    canonical_projections: {
      marriage_canonical_bundle: {
        chapter07Intelligence: { introNarrative: "Valid" },
        chapter08Intelligence: { introSentence: "Valid" },
      },
      marriage_canonical_story_plan: {
        chapters: [{ chapterId: "c1_who_we_are" }],
      },
    },
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
    meta: { report_schema_version: FAMILY_REPORT_SCHEMA_VERSION },
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

// Test 8: Friend Staleness Guard
import { isStaleFriendReportBlock } from "@/lib/relationship/reportStalenessGuard";

const legacyFriendPayload = {
  format: "friend_social_deep_v1",
  report: {
    friend: {
      summary_line: "Old Friend Report",
    },
  },
};
assert.strictEqual(isStaleFriendReportBlock(legacyFriendPayload), true);
console.log("✓ Reject legacy Friend report lacking canonical bundle / social DNA verified");

const modernFriendPayload = {
  format: "friend_social_deep_v1",
  report: {
    friend: {
      section_social_dna_a: { social_title: "온기 있는 촛불 조언자", guardian_character: { label: "Valid" }, pair_synthesis: { label: "Valid", description: "Valid synthesis" } },
      section_social_dna_b: { social_title: "대나무숲 수호목", guardian_character: { label: "Valid" } },
    },
    meta: {
      report_schema_version: FRIEND_REPORT_SCHEMA_VERSION,
      friend_engine_version: "friend_vnext_ch1_ch8_v3_canonical",
      canonical_bundle: { chapter01: {}, responseIntelligence: { personA: {}, personB: {} } },
    },
    canonical_projections: {
      treasurer: { nickname: "A" },
      comparison_table: { rows: [] },
    },
  },
};
assert.strictEqual(isStaleFriendReportBlock(modernFriendPayload), false);
console.log("✓ Accept modern VNext Friend report containing canonical bundle verified");

// Test 9: Missing pairFriendship Evidence-Safe Behavior (No Dummy Fallbacks)
import { buildFriendReportEnriched } from "@/lib/relationship/enrichment/buildFriendReportEnriched";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";

function sajuFromBirth(birthDate: string) {
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
  } as any;
}

const mockSajuA = sajuFromBirth("1990-05-15");
const mockSajuB = sajuFromBirth("1992-08-20");

const safeReportNoPairFriendship = buildFriendReportEnriched({
  nicknameA: "Alex",
  nicknameB: "Jordan",
  sajuJsonA: mockSajuA,
  sajuJsonB: mockSajuB,
  pairFriendship: null, // NO FAKE FALLBACK INJECTED
});

assert.strictEqual(
  safeReportNoPairFriendship.meta.prescription_friendship,
  undefined,
  "prescription_friendship must be undefined when pairFriendship evidence is missing"
);

const stringified = JSON.stringify(safeReportNoPairFriendship);
assert.strictEqual(stringified.includes("NaN"), false, "Report JSON must not contain NaN");
assert.strictEqual(stringified.includes("undefined"), false, "Report JSON must not contain 'undefined' strings");
console.log("✓ Missing pairFriendship degrades gracefully without fake dummy evidence or NaN/undefined");

// ==========================================
// Fallback Remediation Phase 1 regression tests
// ==========================================

// Test 10: Marriage staleness — bundle present but missing Chapter 07/08
// must be STALE. Before the Phase 1 fix, isStaleCohabitationReportBlock
// accepted any truthy marriage_canonical_bundle as sufficient on its own
// (the `hasCanonicalPlan` OR-branch), regardless of whether chapter07/08
// were inside it — this is the exact shape a report generated between
// 2026-08-13 and 2026-08-25 would have had.
const marriageBundlePresentButNoChapters = {
  format: "cohabitation_deep_v1",
  report: {
    // Phase 3A: report_schema_version included deliberately so this test
    // still isolates and proves the Phase 1 structural fix specifically,
    // rather than passing merely because a missing version already short-
    // circuits to stale for an unrelated reason.
    meta: { report_schema_version: MARRIAGE_REPORT_SCHEMA_VERSION },
    canonical_projections: {
      marriage_canonical_bundle: {
        // chapter07Intelligence / chapter08Intelligence intentionally absent
        someOtherField: true,
      },
      marriage_canonical_story_plan: {
        chapters: [{ chapterId: "c1_who_we_are" }],
      },
    },
    household: {
      section_dna: { person_a: {}, person_b: {} },
    },
  },
};
assert.strictEqual(
  isStaleCohabitationReportBlock(marriageBundlePresentButNoChapters),
  true,
  "A marriage report whose bundle exists but lacks chapter07/08 must be stale — this is the confirmed 2026-08-13→08-25 gap window",
);
console.log("✓ Marriage staleness gap window (bundle without ch07/08) now correctly rejected");

// Test 11: Marriage staleness — story_plan alone (no bundle at all) must also
// be stale now. Before the fix, story_plan presence alone satisfied
// hasCanonicalPlan too.
const marriageStoryPlanOnlyNoBundle = {
  format: "cohabitation_deep_v1",
  report: {
    meta: { report_schema_version: MARRIAGE_REPORT_SCHEMA_VERSION },
    canonical_projections: {
      marriage_canonical_story_plan: { chapters: [{ chapterId: "c1_who_we_are" }] },
    },
    household: { section_dna: { person_a: {}, person_b: {} } },
  },
};
assert.strictEqual(
  isStaleCohabitationReportBlock(marriageStoryPlanOnlyNoBundle),
  true,
  "story_plan alone (no bundle, no chapter07/08) must be stale",
);
console.log("✓ Marriage story-plan-only (no chapter intelligence) correctly rejected");

// Re-verify Test 4's fully-modern fixture is still accepted after tightening
// (regression guard — the fix must not make current-shaped reports stale).
assert.strictEqual(
  isStaleCohabitationReportBlock(modernMarriagePayload),
  false,
  "A fully modern Marriage payload (ch07+ch08+householdDna) must still pass after tightening",
);
console.log("✓ Fully modern Marriage payload still accepted (no regression)");

// Test 12 & 13: Romantic resolveRomanticV4ForResponse
import { resolveRomanticV4ForResponse } from "@/lib/relationship/romantic/prototypeV4/productionAdapter/romanticV4Persistence";

function buildStaleByKind(payload: any, opts: { includeVersion?: boolean } = {}) {
  // isStaleRomanticV4Block flags a block stale when storyPlan.romanticGapBatch
  // (or its physicalIntimacy/conflictTransitions sub-fields) is absent.
  // includeVersion defaults true — this fixture then represents a
  // same-version block that's only missing the gap-batch narrative (the
  // narrower case the in-place upgrade exists for). Pass includeVersion:
  // false to instead simulate a pre-Phase-3A block with no version field at
  // all, regardless of how complete its structure otherwise looks.
  const stalePayload = {
    ...payload,
    storyPlan: payload.storyPlan ? { ...payload.storyPlan, romanticGapBatch: undefined } : undefined,
  };
  return {
    romantic: {
      byLocale: {
        "ko-KR": {
          v4: {
            schemaVersion: "romantic_canonical_report_v1",
            ...(opts.includeVersion === false ? {} : { reportSchemaVersion: ROMANTIC_REPORT_SCHEMA_VERSION }),
            payload: stalePayload,
            birthHourDisclosure: "disclosed",
            generatedAt: new Date().toISOString(),
          },
        },
      },
    },
  };
}

// Test 12: stale block, but preNarrativeContract + canonicalReport ARE present
// (the block realV4Payload already has both, per Test 6 above) — the upgrade
// attempt should succeed and return a payload with romanticGapBatch populated.
const byKindUpgradeable = buildStaleByKind(realV4Payload);
const upgraded = resolveRomanticV4ForResponse(byKindUpgradeable as any, "ko-KR");
assert.ok(upgraded, "A stale-but-upgradeable V4 block must resolve to a non-null payload");
assert.ok(
  (upgraded as any)?.storyPlan?.romanticGapBatch,
  "A successfully upgraded payload must have romanticGapBatch populated",
);
console.log("✓ Romantic stale V4 + successful upgrade returns upgraded payload");

// Test 13: stale block where the upgrade CANNOT run at all — both
// preNarrativeContract and canonicalReport are stripped, so
// resolveRomanticV4ForResponse must return null rather than the stale
// payload. This is the confirmed unsafe behavior from the audit: the old
// inline code's catch block preserved and returned the stale payload as if
// it were current.
const unupgradeablePayload = {
  ...realV4Payload,
  preNarrativeContract: undefined,
  canonicalReport: undefined,
};
const byKindUnupgradeable = buildStaleByKind(unupgradeablePayload);
const failedUpgradeResult = resolveRomanticV4ForResponse(byKindUnupgradeable as any, "ko-KR");
assert.strictEqual(
  failedUpgradeResult,
  null,
  "A stale V4 block that cannot be safely upgraded must resolve to null, never the stale payload itself",
);
console.log("✓ Romantic stale V4 + failed upgrade returns null, NOT the stale payload — no more silent stale-serving");

// Test 14: Family — missing canonical fields must not fabricate saju/psych,
// and must not crash (the old buildFamilyRoleIntelligence call was never
// imported in buildFamilyReportViewModel.ts, which threw a ReferenceError
// whenever that branch was reached).
import { buildFamilyReportViewModel } from "@/lib/relationship/familyParent/viewModel/buildFamilyReportViewModel";

const familyFixtureMissingCanonicalFields: any = {
  headline: "Test family",
  summary_line: "test",
  one_line_family: "test",
  snapshot_panel: { gauges: [] },
  family: {
    section_snapshot: { one_line_family: "test" },
    section_household_roles: {
      self_name: "Kid",
      partner_name: "Mom",
      self_role_label: "helper",
      partner_role_label: "anchor",
      // parent_normal_label intentionally absent — this used to trigger the
      // fake-mock-pillar + unimported-function branch
    },
  },
  meta: {
    nickname_a: "Kid",
    nickname_b: "Mom",
    // psych_master_a / psych_master_b intentionally absent too
  },
};

let familyViewModel: ReturnType<typeof buildFamilyReportViewModel> | null = null;
let familyThrew: unknown = null;
try {
  familyViewModel = buildFamilyReportViewModel(familyFixtureMissingCanonicalFields, { locale: "ko-KR" });
} catch (err) {
  familyThrew = err;
}
assert.strictEqual(
  familyThrew,
  null,
  `buildFamilyReportViewModel must not throw when canonical fields are missing (was a live ReferenceError before the fix): ${familyThrew}`,
);
const familyJson = JSON.stringify(familyViewModel);
assert.strictEqual(
  familyJson.includes("2020-08-20") || familyJson.includes("1993-05-15"),
  false,
  "Family view model output must never contain the old hardcoded fake birth dates",
);
console.log("✓ Family view model handles missing canonical fields without crashing or fabricating fake saju data");

// Test 15: Friend — missing canonical/context chart sources must not fall
// back to the hardcoded dummy chart (갑자/갑자/정해/갑자 and 갑자/갑자/무진/갑자).
import { buildFriendReportViewModel } from "@/lib/relationship/friend/viewModel/buildFriendReportViewModel";

const friendFixtureLegacyDnaNoChart: any = {
  friend: {
    section_social_dna_a: {
      // Old-shaped: missing four_slot_profile/situation_snapshots/pair_synthesis,
      // and using a literal old title string — both trigger isLegacyA.
      social_title: "파티 히어로",
    },
    section_social_dna_b: {
      social_title: "아지트 수호자",
    },
  },
  meta: {
    nickname_a: "A",
    nickname_b: "B",
    // canonical_bundle absent, and no context_output below — no real chart
    // source is recoverable, so no fabricated chart must be used either.
  },
};

let friendThrew: unknown = null;
let friendViewModel: ReturnType<typeof buildFriendReportViewModel> | null = null;
try {
  friendViewModel = buildFriendReportViewModel(friendFixtureLegacyDnaNoChart, {
    viewerIsReportA: true,
    myName: "A",
    partnerName: "B",
    locale: "ko-KR",
  });
} catch (err) {
  friendThrew = err;
}
assert.strictEqual(friendThrew, null, `buildFriendReportViewModel must not throw: ${friendThrew}`);
const friendJson = JSON.stringify(friendViewModel);
// The dummy chart's day-pillar stem/branch combos are distinctive enough
// (정해 / 무진 day pillars only ever appeared from the removed fallback) to
// use as a fabrication signal, but the real assertion that matters is that
// the old legacy title strings are left untouched rather than silently
// replaced by output derived from a fabricated chart.
assert.ok(
  friendJson.includes("파티 히어로") || !friendJson.includes("social_title"),
  "Without a real chart source, the legacy social_title must be left as-is, not regenerated from a fabricated chart",
);
console.log("✓ Friend view model does not fabricate a dummy chart when no real chart source is recoverable");

// ==========================================
// Phase 2 — current-version lock regression tests
// ==========================================

// Test 16: Romantic renderer-selection semantics (resolveRomanticRenderMode).
// This is the actual function RelationshipPremiumSection.tsx calls to decide
// what to render — not a parallel copy of the logic — so this test protects
// production behavior directly, not just an approximation of it.
import { resolveRomanticRenderMode } from "@/lib/relationship/romantic/prototypeV4/productionAdapter/romanticV4Persistence";

// 16a: valid V4 present -> always "v4", regardless of flag or legacy payload.
assert.strictEqual(
  resolveRomanticRenderMode({ hasV4: true, v4Enabled: true, hasLegacyPayload: true }),
  "v4",
  "A present V4 block must always render as v4",
);

// 16b: V4 unavailable but V4 IS this environment's current version -> "empty",
// never "legacy" — this is the core Phase 2 invariant: an unavailable current
// version must not silently fall through to an old renderer.
assert.strictEqual(
  resolveRomanticRenderMode({ hasV4: false, v4Enabled: true, hasLegacyPayload: true }),
  "empty",
  "V4 enabled but unavailable for this report must resolve to empty (explicit regenerate state), NOT legacy — even when an old V1 payload exists",
);

// 16c: V4 disabled for this environment (intentional rollback) + legacy
// payload present -> "legacy" remains correct, unchanged behavior.
assert.strictEqual(
  resolveRomanticRenderMode({ hasV4: false, v4Enabled: false, hasLegacyPayload: true }),
  "legacy",
  "V4 disabled at the environment level must still allow legacy rendering — this is an intentional rollback, not a per-report gap",
);

// 16d: V4 disabled + no legacy payload either -> "empty".
assert.strictEqual(
  resolveRomanticRenderMode({ hasV4: false, v4Enabled: false, hasLegacyPayload: false }),
  "empty",
  "No V4 and no legacy payload must resolve to empty regardless of the flag",
);
console.log("✓ Romantic current-version lock (resolveRomanticRenderMode) never silently selects legacy when V4 is the intended current version");

// ==========================================
// Phase 3A — Report Schema Version SSOT regression tests
// ==========================================
// (*_REPORT_SCHEMA_VERSION constants imported at the top of this file)

// ---- Work: A/B/C/D on isStaleWorkReportBlock ----
{
  const currentStructure = {
    office: {
      section_roles: { person_a: {}, person_b: {} },
      section_mix_fit: { fit_pct: 85 },
      section_respect: { headline: "Valid" },
    },
  };
  // A: current version + valid structure -> NOT stale
  assert.strictEqual(
    isStaleWorkReportBlock({ report: { meta: { report_schema_version: WORK_REPORT_SCHEMA_VERSION }, ...currentStructure } }),
    false,
    "Work: current version + valid structure must NOT be stale",
  );
  // B: missing version -> stale
  assert.strictEqual(
    isStaleWorkReportBlock({ report: { meta: {}, ...currentStructure } }),
    true,
    "Work: missing report_schema_version must be stale",
  );
  // C: older version -> stale
  assert.strictEqual(
    isStaleWorkReportBlock({ report: { meta: { report_schema_version: WORK_REPORT_SCHEMA_VERSION - 1 }, ...currentStructure } }),
    true,
    "Work: older report_schema_version must be stale",
  );
  // D: current version + missing mandatory structure -> stale
  assert.strictEqual(
    isStaleWorkReportBlock({ report: { meta: { report_schema_version: WORK_REPORT_SCHEMA_VERSION }, office: { section_roles: { person_a: {}, person_b: {} } } } }),
    true,
    "Work: current version but missing section_mix_fit/section_respect must still be stale",
  );
  console.log("✓ Work isStaleWorkReportBlock A/B/C/D (version-first, structure-second) verified");
}

// ---- Marriage: A/B/C/D on isStaleCohabitationReportBlock ----
{
  const currentStructure = {
    canonical_projections: {
      marriage_canonical_bundle: {
        chapter07Intelligence: { introNarrative: "Valid" },
        chapter08Intelligence: { introSentence: "Valid" },
      },
    },
    household: { section_dna: { person_a: {}, person_b: {} } },
  };
  assert.strictEqual(
    isStaleCohabitationReportBlock({ report: { meta: { report_schema_version: MARRIAGE_REPORT_SCHEMA_VERSION }, ...currentStructure } }),
    false,
    "Marriage: current version + valid structure must NOT be stale",
  );
  assert.strictEqual(
    isStaleCohabitationReportBlock({ report: { meta: {}, ...currentStructure } }),
    true,
    "Marriage: missing report_schema_version must be stale",
  );
  assert.strictEqual(
    isStaleCohabitationReportBlock({ report: { meta: { report_schema_version: MARRIAGE_REPORT_SCHEMA_VERSION - 1 }, ...currentStructure } }),
    true,
    "Marriage: older report_schema_version must be stale",
  );
  assert.strictEqual(
    isStaleCohabitationReportBlock({
      report: {
        meta: { report_schema_version: MARRIAGE_REPORT_SCHEMA_VERSION },
        canonical_projections: { marriage_canonical_bundle: { chapter07Intelligence: { introNarrative: "Valid" } } },
        household: { section_dna: { person_a: {}, person_b: {} } },
      },
    }),
    true,
    "Marriage: current version but missing chapter08Intelligence must still be stale (Phase 1 regression guard, preserved)",
  );
  console.log("✓ Marriage isStaleCohabitationReportBlock A/B/C/D (version-first, structure-second) verified");
}

// ---- Family: A/B/C/D on isStaleFamilyReportBlock ----
{
  const currentStructure = { canonical_projections: { story_plan: { chapters: [] } } };
  assert.strictEqual(
    isStaleFamilyReportBlock({ report: { meta: { report_schema_version: FAMILY_REPORT_SCHEMA_VERSION }, ...currentStructure } }),
    false,
    "Family: current version + valid structure must NOT be stale",
  );
  assert.strictEqual(
    isStaleFamilyReportBlock({ report: { meta: {}, ...currentStructure } }),
    true,
    "Family: missing report_schema_version must be stale",
  );
  assert.strictEqual(
    isStaleFamilyReportBlock({ report: { meta: { report_schema_version: FAMILY_REPORT_SCHEMA_VERSION - 1 }, ...currentStructure } }),
    true,
    "Family: older report_schema_version must be stale",
  );
  assert.strictEqual(
    isStaleFamilyReportBlock({ report: { meta: { report_schema_version: FAMILY_REPORT_SCHEMA_VERSION }, family: {} } }),
    true,
    "Family: current version but no story_plan and no household_roles/snapshot must still be stale",
  );
  console.log("✓ Family isStaleFamilyReportBlock A/B/C/D (version-first, structure-second) verified");
}

// ---- Friend: A/B/C/D on isStaleFriendReportBlock ----
{
  const currentStructure = {
    friend: {
      section_social_dna_a: { social_title: "Valid" },
      section_social_dna_b: { social_title: "Valid" },
    },
  };
  const currentMeta = {
    report_schema_version: FRIEND_REPORT_SCHEMA_VERSION,
    friend_engine_version: "friend_vnext_ch1_ch8_v3_canonical",
    canonical_bundle: { responseIntelligence: { personA: {}, personB: {} } },
  };
  assert.strictEqual(
    isStaleFriendReportBlock({ report: { meta: currentMeta, ...currentStructure } }),
    false,
    "Friend: current version + valid structure must NOT be stale",
  );
  assert.strictEqual(
    isStaleFriendReportBlock({ report: { meta: { ...currentMeta, report_schema_version: undefined }, ...currentStructure } }),
    true,
    "Friend: missing report_schema_version must be stale even with a matching friend_engine_version",
  );
  assert.strictEqual(
    isStaleFriendReportBlock({ report: { meta: { ...currentMeta, report_schema_version: FRIEND_REPORT_SCHEMA_VERSION - 1 }, ...currentStructure } }),
    true,
    "Friend: older report_schema_version must be stale",
  );
  assert.strictEqual(
    isStaleFriendReportBlock({ report: { meta: currentMeta, friend: { section_social_dna_a: { social_title: "Valid" } } } }),
    true,
    "Friend: current version but missing section_social_dna_b must still be stale",
  );
  console.log("✓ Friend isStaleFriendReportBlock A/B/C/D (version-first, structure-second) verified");
}

// ---- Romantic: A/B/C/D on isStaleRomanticV4Block ----
{
  const currentStoryPlan = {
    storyPlan: {
      romanticGapBatch: { physicalIntimacy: {}, conflictTransitions: {} },
    },
  };
  assert.strictEqual(
    isStaleRomanticV4Block({
      reportSchemaVersion: ROMANTIC_REPORT_SCHEMA_VERSION,
      payload: currentStoryPlan,
    } as any),
    false,
    "Romantic: current version + valid structure must NOT be stale",
  );
  assert.strictEqual(
    isStaleRomanticV4Block({ payload: currentStoryPlan } as any),
    true,
    "Romantic: missing reportSchemaVersion must be stale (pre-Phase-3A block)",
  );
  assert.strictEqual(
    isStaleRomanticV4Block({
      reportSchemaVersion: ROMANTIC_REPORT_SCHEMA_VERSION - 1,
      payload: currentStoryPlan,
    } as any),
    true,
    "Romantic: older reportSchemaVersion must be stale",
  );
  assert.strictEqual(
    isStaleRomanticV4Block({
      reportSchemaVersion: ROMANTIC_REPORT_SCHEMA_VERSION,
      payload: { storyPlan: { romanticGapBatch: null } },
    } as any),
    true,
    "Romantic: current version but missing romanticGapBatch must still be stale",
  );
  console.log("✓ Romantic isStaleRomanticV4Block A/B/C/D (version-first, structure-second) verified");
}

// ---- Version-mismatch must never trigger Romantic's in-place upgrade ----
// (a pre-Phase-3A block cannot be "grandfathered in" by the upgrade path
// just because its structure happens to look complete — see PHASE 3A.5)
{
  // realV4Payload already has preNarrativeContract + canonicalReport, so if
  // version weren't checked first, the upgrade path below would otherwise
  // succeed and silently "fix" a pre-Phase-3A block. includeVersion: false
  // simulates exactly that pre-Phase-3A block (no reportSchemaVersion field
  // at all), regardless of how complete its structure looks.
  const versionlessButStructurallyComplete = buildStaleByKind(realV4Payload, { includeVersion: false });
  const result = resolveRomanticV4ForResponse(versionlessButStructurallyComplete as any, "ko-KR");
  assert.strictEqual(
    result,
    null,
    "A versionless (pre-Phase-3A) V4 block must resolve to null even when its structure looks complete enough for the in-place upgrade to otherwise succeed",
  );
  console.log("✓ Romantic versionless block is never grandfathered in by the in-place upgrade path");
}

// ---- E + generation/read contract tests: real generator output stamps the
// current version AND is accepted by that vertical's own staleness guard ----
import { buildWorkColleagueReport } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { buildMarriageReport } from "@/lib/relationship/marriage/buildMarriageReport";
import { buildFamilyParentReport } from "@/lib/relationship/familyParent/buildFamilyParentReport";
// buildFriendReportEnriched, calculateSajuBundle, toV1SajuApiPayload already imported above (Test 9)

function sajuFromBirthForContractTests(birthDate: string) {
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
  } as any;
}
const contractSajuA = sajuFromBirthForContractTests("1990-05-15");
const contractSajuB = sajuFromBirthForContractTests("1992-08-20");

{
  const workReport = buildWorkColleagueReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: contractSajuA,
    sajuJsonB: contractSajuB,
    locale: "ko-KR",
  } as any);
  assert.strictEqual(
    (workReport as any).meta.report_schema_version,
    WORK_REPORT_SCHEMA_VERSION,
    "Work: fresh generation must stamp the current report_schema_version",
  );
  assert.strictEqual(
    isStaleWorkReportBlock({ report: workReport }),
    false,
    "Work: generation and read contracts must agree — fresh generator output must pass its own staleness guard",
  );
  console.log("✓ Work generation stamps current version AND passes isStaleWorkReportBlock (generation/read contract)");
}

{
  const familyReport = buildFamilyParentReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    sajuJsonA: contractSajuA,
    sajuJsonB: contractSajuB,
    locale: "ko-KR",
  } as any);
  assert.strictEqual(
    (familyReport as any).meta.report_schema_version,
    FAMILY_REPORT_SCHEMA_VERSION,
    "Family: fresh generation must stamp the current report_schema_version",
  );
  assert.strictEqual(
    isStaleFamilyReportBlock({ report: familyReport }),
    false,
    "Family: generation and read contracts must agree",
  );
  console.log("✓ Family generation stamps current version AND passes isStaleFamilyReportBlock (generation/read contract)");
}

{
  const marriageReport = buildMarriageReport({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: contractSajuA,
    sajuJsonB: contractSajuB,
    psychMasterA: {
      survey_source: "v2_10q",
      secondary_axes: { stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50, conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50, thinking_style: 50, decision_style: 50 },
      home_life_dna: { lifestyle_title: "test", life_values_line: "test" },
    },
    psychMasterB: {
      survey_source: "v2_10q",
      secondary_axes: { stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50, conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50, thinking_style: 50, decision_style: 50 },
      home_life_dna: { lifestyle_title: "test", life_values_line: "test" },
    },
    locale: "ko-KR",
  } as any);
  assert.strictEqual(
    (marriageReport as any).meta.report_schema_version,
    MARRIAGE_REPORT_SCHEMA_VERSION,
    "Marriage: fresh generation must stamp the current report_schema_version",
  );
  assert.strictEqual(
    isStaleCohabitationReportBlock({ report: marriageReport }),
    false,
    "Marriage: generation and read contracts must agree — this is exactly the class of drift that caused the Phase 1 incident",
  );
  console.log("✓ Marriage generation stamps current version AND passes isStaleCohabitationReportBlock (generation/read contract)");
}

{
  const friendReport = buildFriendReportEnriched({
    nicknameA: "Alex",
    nicknameB: "Jordan",
    sajuJsonA: contractSajuA,
    sajuJsonB: contractSajuB,
    pairFriendship: null,
  } as any);
  assert.strictEqual(
    (friendReport as any).meta.report_schema_version,
    FRIEND_REPORT_SCHEMA_VERSION,
    "Friend: fresh generation must stamp the current report_schema_version",
  );
  assert.strictEqual(
    isStaleFriendReportBlock({ report: friendReport }),
    false,
    "Friend: generation and read contracts must agree",
  );
  console.log("✓ Friend generation stamps current version AND passes isStaleFriendReportBlock (generation/read contract)");
}

{
  // Romantic's contract test reuses `upgraded` from Test 12 above — the
  // real generator output (realV4Payload) AFTER buildCanonicalRelationshipStoryPlan
  // has populated storyPlan.romanticGapBatch, which is what a fresh
  // production generation actually persists (analyze/premium/route.ts
  // always runs that same builder before attaching the v4 block — the raw
  // realV4Payload alone has no romanticGapBatch, matching prod). This
  // proves the wrapper shape stamped at generation
  // (reportSchemaVersion: ROMANTIC_REPORT_SCHEMA_VERSION) is accepted by
  // isStaleRomanticV4Block when combined with real, complete generator output.
  const freshBlock = {
    schemaVersion: "romantic_canonical_report_v1" as const,
    reportSchemaVersion: ROMANTIC_REPORT_SCHEMA_VERSION,
    payload: upgraded,
    birthHourDisclosure: "disclosed" as any,
    generatedAt: new Date().toISOString(),
  };
  assert.strictEqual(
    isStaleRomanticV4Block(freshBlock as any),
    false,
    "Romantic: a block stamped with the current reportSchemaVersion, wrapping real generator output, must pass isStaleRomanticV4Block",
  );
  console.log("✓ Romantic generation-shaped block (current version + real payload) passes isStaleRomanticV4Block (generation/read contract)");
}

console.log("==========================================");
console.log("ALL STALENESS GUARD AND P1/P2/P3A FIX UNIT TESTS PASSED!");
console.log("==========================================");


