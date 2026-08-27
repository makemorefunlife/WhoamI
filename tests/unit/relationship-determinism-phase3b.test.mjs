/**
 * Phase 3B — Determinism & A/B Symmetry regression suite.
 *
 * Locks down the invariants from the Determinism & A↔B Symmetry Audit and
 * the Phase 3B remediation that followed it:
 *  - STATIC DETERMINISTIC: same canonical input -> identical headline
 *    scores/grade across repeated generation, A/B swap, and evaluation year.
 *  - DIRECTIONAL DETERMINISTIC: role-bearing fields swap predictably with
 *    A/B, never silently favor a slot on a tie.
 *  - TIME-DEPENDENT DETERMINISTIC: only explicitly time-dependent content
 *    (Marriage Ch08, Family growth tunnel) may vary with evaluation year.
 *  - Marriage Chapter 08 must consume real per-couple evidence, never the
 *    historical hardcoded fake birth data (M1).
 *  - Family role-bearing chapter content must follow role identity, not
 *    A/B slot, and fresh generation must equal reopened/persisted content
 *    (F1/F2).
 *
 * Run: npx tsx --test tests/unit/relationship-determinism-phase3b.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeRelationshipEventScores, triScoreToGrade } from "../../lib/relationship/pairEventScores.ts";
import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport.ts";
import { buildMarriageReportViewModel } from "../../lib/relationship/marriage/viewModel/buildMarriageReportViewModel.ts";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import { buildWorkColleagueReport } from "../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { buildFriendReportEnriched } from "../../lib/relationship/enrichment/buildFriendReportEnriched.ts";

function makePsych(overrides) {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "체계적인 정리자", life_values_line: "안정된 공간" },
  };
}

const sajuA = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
const sajuB = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };

// ==========================================================================
// Shared deterministic engine (pairEventScores.ts) — used directly by
// Romantic and indirectly (via triScoreToGrade) by Marriage/Work/Family/Friend.
// ==========================================================================

describe("Shared engine — computeRelationshipEventScores / triScoreToGrade", () => {
  const pair = {
    allCrossHits: [
      { personA_pillar: "일주", personB_pillar: "월주", type: "육합", interpretation: "", priority: 80, palaceWeight: 1, weightedPriority: 80 },
      { personA_pillar: "년주", personB_pillar: "일주", type: "충", interpretation: "", priority: 60, palaceWeight: 1, weightedPriority: 60 },
    ],
    dayStemInteraction: "상생",
    combinedElementNote: "안정적인 기운",
  };
  // Same two people, A/B slots swapped — the pillar labels swap sides too,
  // exactly what a real swapped-input pair analysis would produce.
  const pairSwapped = {
    allCrossHits: [
      { personA_pillar: "월주", personB_pillar: "일주", type: "육합", interpretation: "", priority: 80, palaceWeight: 1, weightedPriority: 80 },
      { personA_pillar: "일주", personB_pillar: "년주", type: "충", interpretation: "", priority: 60, palaceWeight: 1, weightedPriority: 60 },
    ],
    dayStemInteraction: "상생",
    combinedElementNote: "안정적인 기운",
  };

  it("Test Group A — same-input replay produces byte-identical scores across 3 runs", () => {
    const runs = [1, 2, 3].map(() => computeRelationshipEventScores(pair));
    assert.deepEqual(runs[0], runs[1]);
    assert.deepEqual(runs[1], runs[2]);
    const grades = runs.map((r) => triScoreToGrade(r.overall));
    assert.equal(grades[0], grades[1]);
    assert.equal(grades[1], grades[2]);
  });

  it("Test Group B — A/B swap produces identical scores/grade (symmetric by construction)", () => {
    const scores = computeRelationshipEventScores(pair);
    const scoresSwapped = computeRelationshipEventScores(pairSwapped);
    assert.deepEqual(scores, scoresSwapped);
    assert.equal(triScoreToGrade(scores.overall), triScoreToGrade(scoresSwapped.overall));
  });
});

// ==========================================================================
// Work
// ==========================================================================

describe("Work — same-input replay & A/B swap", () => {
  const psychA = makePsych({ structure: 70, self_control: 65 });
  const psychB = makePsych({ practicality: 75, recognition: 30 });

  function build(a, b, pA, pB) {
    return buildWorkColleagueReport({
      nicknameA: a,
      nicknameB: b,
      sajuJsonA: a === "Alex" ? sajuA : sajuB,
      sajuJsonB: b === "Jordan" ? sajuB : sajuA,
      psychMasterA: pA,
      psychMasterB: pB,
      locale: "ko-KR",
    });
  }

  it("Test Group A — same-input replay", () => {
    const r1 = build("Alex", "Jordan", psychA, psychB);
    const r2 = build("Alex", "Jordan", psychA, psychB);
    const r3 = build("Alex", "Jordan", psychA, psychB);
    for (const key of ["fit_pct", "synergy_pct", "risk_pct", "grade"]) {
      assert.equal(r1.meta[key], r2.meta[key]);
      assert.equal(r2.meta[key], r3.meta[key]);
    }
  });

  it("Test Group B — A/B swap keeps headline scores/grade identical", () => {
    const original = buildWorkColleagueReport({
      nicknameA: "Alex", nicknameB: "Jordan", sajuJsonA: sajuA, sajuJsonB: sajuB,
      psychMasterA: psychA, psychMasterB: psychB, locale: "ko-KR",
    });
    const swapped = buildWorkColleagueReport({
      nicknameA: "Jordan", nicknameB: "Alex", sajuJsonA: sajuB, sajuJsonB: sajuA,
      psychMasterA: psychB, psychMasterB: psychA, locale: "ko-KR",
    });
    assert.equal(original.meta.fit_pct, swapped.meta.fit_pct);
    assert.equal(original.meta.synergy_pct, swapped.meta.synergy_pct);
    assert.equal(original.meta.risk_pct, swapped.meta.risk_pct);
    assert.equal(original.meta.grade, swapped.meta.grade);
  });
});

// ==========================================================================
// Friend
// ==========================================================================

describe("Friend — same-input replay & A/B swap", () => {
  const psychA = makePsych({ empathy: 70 });
  const psychB = makePsych({ stimulation: 65, recognition: 40 });

  function build(a, b, sA, sB, pA, pB) {
    return buildFriendReportEnriched({
      nicknameA: a, nicknameB: b, sajuJsonA: sA, sajuJsonB: sB,
      psychMasterA: pA, psychMasterB: pB, pairFriendship: null, locale: "ko-KR",
    });
  }

  it("Test Group A — same-input replay", () => {
    const r1 = build("Alex", "Jordan", sajuA, sajuB, psychA, psychB);
    const r2 = build("Alex", "Jordan", sajuA, sajuB, psychA, psychB);
    const r3 = build("Alex", "Jordan", sajuA, sajuB, psychA, psychB);
    for (const key of ["connection_pct", "banter_pct", "risk_pct", "grade"]) {
      assert.equal(r1.meta[key], r2.meta[key]);
      assert.equal(r2.meta[key], r3.meta[key]);
    }
  });

  it("Test Group B — A/B swap keeps headline scores/grade identical", () => {
    const original = build("Alex", "Jordan", sajuA, sajuB, psychA, psychB);
    const swapped = build("Jordan", "Alex", sajuB, sajuA, psychB, psychA);
    assert.equal(original.meta.connection_pct, swapped.meta.connection_pct);
    assert.equal(original.meta.banter_pct, swapped.meta.banter_pct);
    assert.equal(original.meta.risk_pct, swapped.meta.risk_pct);
    assert.equal(original.meta.grade, swapped.meta.grade);
  });
});

// ==========================================================================
// Marriage
// ==========================================================================

describe("Marriage — determinism (M1-M5 regression lock)", () => {
  const psychA = makePsych({ practicality: 30, thinking_style: 30, self_control: 40, recognition: 70 });
  const psychB = makePsych({ practicality: 75, thinking_style: 70, self_control: 65, recognition: 35 });

  function build(params) {
    return buildMarriageReport({
      nicknameA: "Sera", nicknameB: "동글",
      sajuJsonA: sajuA, sajuJsonB: sajuB,
      psychMasterA: psychA, psychMasterB: psychB,
      birthDateA: "1990-05-15", birthDateB: "1992-08-20",
      birthTimeA: "14:30", birthTimeB: "09:00",
      locale: "ko-KR",
      ...params,
    });
  }

  it("Test Group A — same-input replay produces identical scores across 3 runs", () => {
    const r1 = build({ evaluationYear: 2026 });
    const r2 = build({ evaluationYear: 2026 });
    const r3 = build({ evaluationYear: 2026 });
    for (const key of ["romantic_fit_pct", "life_synergy_pct", "home_risk_pct", "grade"]) {
      assert.equal(r1.meta[key], r2.meta[key]);
      assert.equal(r2.meta[key], r3.meta[key]);
    }
  });

  it("Test Group B — A/B swap keeps headline scores identical; roles follow the person, not the slot", () => {
    const original = build({});
    const swapped = buildMarriageReport({
      nicknameA: "동글", nicknameB: "Sera",
      sajuJsonA: sajuB, sajuJsonB: sajuA,
      psychMasterA: psychB, psychMasterB: psychA,
      birthDateA: "1992-08-20", birthDateB: "1990-05-15",
      birthTimeA: "09:00", birthTimeB: "14:30",
      locale: "ko-KR",
    });
    assert.equal(original.meta.romantic_fit_pct, swapped.meta.romantic_fit_pct);
    assert.equal(original.meta.life_synergy_pct, swapped.meta.life_synergy_pct);
    assert.equal(original.meta.home_risk_pct, swapped.meta.home_risk_pct);
    assert.equal(original.meta.grade, swapped.meta.grade);

    // 동글 (practicality/thinking_style high -> PROBLEM_SOLVER) must remain
    // the practical lead regardless of which slot they occupy (M3 fix).
    const vmOriginal = buildMarriageReportViewModel(original, { viewerIsReportA: true, myName: "Sera", partnerName: "동글", locale: "ko-KR" });
    const vmSwapped = buildMarriageReportViewModel(swapped, { viewerIsReportA: true, myName: "동글", partnerName: "Sera", locale: "ko-KR" });
    const leadOriginal = vmOriginal.canonicalBundle.crisisRole.practicalLead === "a" ? vmOriginal.canonicalNames[0] : vmOriginal.canonicalNames[1];
    const leadSwapped = vmSwapped.canonicalBundle.crisisRole.practicalLead === "a" ? vmSwapped.canonicalNames[0] : vmSwapped.canonicalNames[1];
    assert.equal(leadOriginal, "동글");
    assert.equal(leadSwapped, "동글");
  });

  it("Test Group C — evaluation year does not change static headline scores/grade (M2 fix)", () => {
    const y2026 = build({ evaluationYear: 2026 });
    const y2027 = build({ evaluationYear: 2027 });
    assert.equal(y2026.meta.romantic_fit_pct, y2027.meta.romantic_fit_pct);
    assert.equal(y2026.meta.life_synergy_pct, y2027.meta.life_synergy_pct);
    assert.equal(y2026.meta.home_risk_pct, y2027.meta.home_risk_pct, "home_risk_pct must be year-invariant after M2 fix");
    assert.equal(y2026.meta.grade, y2027.meta.grade, "grade must be year-invariant after M2 fix");
  });

  it("Test Group D — Chapter 08 uses real per-couple evidence, not the historical fake defaults (M1 fix)", () => {
    const coupleOne = build({});
    const coupleTwo = buildMarriageReport({
      nicknameA: "Alex", nicknameB: "Jordan",
      sajuJsonA: sajuB, sajuJsonB: sajuA,
      psychMasterA: makePsych({ practicality: 60 }), psychMasterB: makePsych({ recognition: 80 }),
      birthDateA: "1988-11-02", birthDateB: "1995-01-19",
      birthTimeA: "03:15", birthTimeB: "21:40",
      locale: "ko-KR",
    });
    const ch08One = coupleOne.canonical_projections?.marriage_canonical_bundle?.chapter08Intelligence;
    const ch08Two = coupleTwo.canonical_projections?.marriage_canonical_bundle?.chapter08Intelligence;
    assert.ok(ch08One, "Chapter 08 must be present when real birth data is supplied");
    assert.ok(ch08Two, "Chapter 08 must be present when real birth data is supplied");
    // If Chapter 08 were still using the old hardcoded fake birth data for
    // every couple, these two structurally-different real couples would
    // produce byte-identical Chapter 08 content — assert they do not.
    assert.notDeepEqual(
      ch08One.provenance,
      ch08Two.provenance,
      "Two structurally different real couples must not produce identical Chapter 08 provenance (would indicate fake shared input)",
    );
  });

  it("Test Group D — Chapter 08 is omitted (fail closed), not fabricated, when real birth data is unavailable", () => {
    const noBirthData = buildMarriageReport({
      nicknameA: "Sera", nicknameB: "동글",
      sajuJsonA: sajuA, sajuJsonB: sajuB,
      psychMasterA: psychA, psychMasterB: psychB,
      locale: "ko-KR",
      // birthDateA/B intentionally omitted
    });
    const ch08 = noBirthData.canonical_projections?.marriage_canonical_bundle?.chapter08Intelligence;
    assert.equal(ch08, undefined, "Chapter 08 must be omitted, never fabricated, when real birth data is unavailable");
  });
});

// ==========================================================================
// Family
// ==========================================================================

describe("Family — determinism (F1-F4 regression lock)", () => {
  const parentSaju = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
  const childSaju = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };
  const parentPsych = makePsych({ structure: 80, self_control: 75 });
  const childPsych = makePsych({ stimulation: 80, autonomy: 70, recognition: 40 });

  it("Test Group A — same-input replay produces identical scores across 3 runs", () => {
    const build = () => buildFamilyParentReport({
      nicknameA: "Mom", nicknameB: "Kid",
      roles: { roleA: "mother", roleB: "child" },
      parentType: "mother",
      sajuJsonA: parentSaju, sajuJsonB: childSaju,
      psychMasterA: parentPsych, psychMasterB: childPsych,
      locale: "ko-KR", analysisYear: 2026,
    });
    const r1 = build(); const r2 = build(); const r3 = build();
    for (const key of ["bond_pct", "synergy_pct", "risk_pct", "grade"]) {
      assert.equal(r1.meta[key], r2.meta[key]);
      assert.equal(r2.meta[key], r3.meta[key]);
    }
  });

  it("Test Group B — A/B swap keeps pair scores identical and keeps psych/counts attached to the real role, not the slot (F1 fix)", () => {
    const parentIsA = buildFamilyParentReport({
      nicknameA: "Mom", nicknameB: "Kid",
      roles: { roleA: "mother", roleB: "child" },
      parentType: "mother",
      sajuJsonA: parentSaju, sajuJsonB: childSaju,
      psychMasterA: parentPsych, psychMasterB: childPsych,
      locale: "ko-KR", analysisYear: 2026,
    });
    const parentIsB = buildFamilyParentReport({
      nicknameA: "Kid", nicknameB: "Mom",
      roles: { roleA: "child", roleB: "mother" },
      parentType: "mother",
      sajuJsonA: childSaju, sajuJsonB: parentSaju,
      psychMasterA: childPsych, psychMasterB: parentPsych,
      locale: "ko-KR", analysisYear: 2026,
    });
    assert.equal(parentIsA.meta.bond_pct, parentIsB.meta.bond_pct);
    assert.equal(parentIsA.meta.synergy_pct, parentIsB.meta.synergy_pct);
    assert.equal(parentIsA.meta.risk_pct, parentIsB.meta.risk_pct);
    assert.equal(parentIsA.meta.grade, parentIsB.meta.grade);

    // The child's real growth-chapter content (driven by childPsych/child ten-god
    // counts) must be identical regardless of which slot (A or B) the child
    // occupies — this is the exact F1 bug (psych_master_a/b were treated as
    // fixed child/parent slots instead of resolved roles).
    const growthA = parentIsA.canonical_projections?.story_plan?.growthChapterBundle;
    const growthB = parentIsB.canonical_projections?.story_plan?.growthChapterBundle;
    assert.ok(growthA && growthB, "growthChapterBundle must be present in fresh generation");
    assert.equal(growthA.learning.oneLineStudyType, growthB.learning.oneLineStudyType);
    assert.equal(growthA.motivation.driveTitle.includes("Kid"), true);
    assert.equal(growthB.motivation.driveTitle.includes("Kid"), true);
  });

  it("Test Group C — analysis year does not change static headline scores/grade (F3 fix)", () => {
    const build = (analysisYear) => buildFamilyParentReport({
      nicknameA: "Mom", nicknameB: "Kid",
      roles: { roleA: "mother", roleB: "child" },
      parentType: "mother",
      sajuJsonA: parentSaju, sajuJsonB: childSaju,
      psychMasterA: parentPsych, psychMasterB: childPsych,
      locale: "ko-KR", analysisYear,
    });
    const y2026 = build(2026);
    const y2027 = build(2027);
    assert.equal(y2026.meta.bond_pct, y2027.meta.bond_pct);
    assert.equal(y2026.meta.synergy_pct, y2027.meta.synergy_pct);
    assert.equal(y2026.meta.risk_pct, y2027.meta.risk_pct);
    assert.equal(y2026.meta.grade, y2027.meta.grade);
    // Growth Tunnel (Part3, explicitly time-dependent by design/decision 015)
    // is allowed to mention the analysis year in its own copy.
    assert.ok(y2026.family.section_growth_tunnel.current_challenge.includes("2026"));
    assert.ok(y2027.family.section_growth_tunnel.current_challenge.includes("2027"));
  });

  it("Test Group E — fresh generation equals reopened (persisted + view-model) content, no degraded reconstruction (F2/F4 fix)", () => {
    const fresh = buildFamilyParentReport({
      nicknameA: "Mom", nicknameB: "Kid",
      roles: { roleA: "mother", roleB: "child" },
      parentType: "mother",
      sajuJsonA: parentSaju, sajuJsonB: childSaju,
      psychMasterA: parentPsych, psychMasterB: childPsych,
      locale: "ko-KR", analysisYear: 2026,
    });
    // Simulate persistence round-trip (JSONB write + read).
    const reopened = JSON.parse(JSON.stringify(fresh));

    const vmFresh = buildFamilyReportViewModel(fresh, { locale: "ko-KR" });
    const vmReopened = buildFamilyReportViewModel(reopened, { locale: "ko-KR" });

    assert.deepEqual(
      vmFresh.storyPlan?.growthChapterBundle,
      vmReopened.storyPlan?.growthChapterBundle,
      "growthChapterBundle must be read from the persisted bundle unchanged, not silently reconstructed with different/neutral data on reopen",
    );
    assert.deepEqual(vmFresh.storyPlan?.repairChapterBundle, vmReopened.storyPlan?.repairChapterBundle);
    assert.deepEqual(vmFresh.storyPlan?.actionChapterBundle, vmReopened.storyPlan?.actionChapterBundle);
    assert.equal(vmFresh.snapshot?.scores.bondPct, vmReopened.snapshot?.scores.bondPct);
  });
});
