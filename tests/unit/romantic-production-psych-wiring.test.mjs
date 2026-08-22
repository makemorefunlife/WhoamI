/**
 * Phase 5B Part 1 — regression test proving a production-shaped surveyInput
 * (profileA/profileB, the real CurrentSelfProfile shape app/api/relationship/
 * analyze/premium/route.ts actually constructs via getCurrentSelfProfileForReport)
 * populates axisOverview. Phase 5A's live testing found axisOverview.length===0,
 * but that traced to the manual live-test script using a legacy psychA/psychB
 * shape that was never real production's contract — production always used
 * profileA/profileB. This test is the regression guard for that finding: it
 * fails loudly if buildActualFourCeContract's profileA/profileB -> axisOverview
 * wiring ever breaks, independent of any test script.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report.ts";

function makeProfile(secondaryOverrides) {
  const secondaryBase = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  const primary = { autonomy: 50, connection: 50, stability: 50, growth: 50, structure: 50, adaptability: 50 };
  return {
    profile_type: "current_self",
    primary_axes: primary,
    secondary_axes: { ...secondaryBase, ...secondaryOverrides },
    personalization: { primary_concern: null },
    meta: { survey_version: "v2", completed_at: new Date().toISOString(), completion_time_seconds: null },
  };
}

describe("Production-shaped psych wiring (spec Phase 5B Part 1)", () => {
  it("surveyInput.profileA/profileB (the real production shape) populates axisOverview with all 11 secondary axes", () => {
    const report = buildCanonicalRomanticV4Report("ko-KR", 2026, {
      pairSajuInput: {
        mode: "real",
        birthA: { birthDate: "1985-10-10", birthTime: "22:00" },
        birthB: { birthDate: "1999-06-01", birthTime: "06:00" },
        nameA: "라온",
        nameB: "은서",
      },
      surveyInput: {
        mode: "real",
        profileA: makeProfile({ conflict_style: 90, self_control: 85 }),
        profileB: makeProfile({ conflict_style: 10, self_control: 20 }),
      },
    });
    assert.equal(report.axisOverview.length, 11);
    const conflictAxis = report.axisOverview.find((a) => a.axis_key === "conflict_style");
    assert.ok(conflictAxis);
    assert.equal(conflictAxis.score_a, 90);
    assert.equal(conflictAxis.score_b, 10);
    assert.equal(conflictAxis.gap, 80);
  });

  it("omitting profileA/profileB (dev-fixture/no-survey path) leaves axisOverview empty, not broken", () => {
    const report = buildCanonicalRomanticV4Report("ko-KR", 2026, {
      pairSajuInput: { mode: "real", birthA: { birthDate: "1985-10-10", birthTime: "22:00" }, birthB: { birthDate: "1999-06-01", birthTime: "06:00" }, nameA: "라온", nameB: "은서" },
      surveyInput: { mode: "real", profileA: null, profileB: null },
    });
    assert.equal(report.axisOverview.length, 0);
  });

  it("a legacy psychA/psychB-shaped surveyInput (the old, wrong test-fixture pattern) does NOT populate axisOverview — proves psychA/psychB was never a real input contract", () => {
    const report = buildCanonicalRomanticV4Report("ko-KR", 2026, {
      pairSajuInput: { mode: "real", birthA: { birthDate: "1985-10-10", birthTime: "22:00" }, birthB: { birthDate: "1999-06-01", birthTime: "06:00" }, nameA: "라온", nameB: "은서" },
      surveyInput: { mode: "real", profileA: null, profileB: null, psychA: makeProfile({ conflict_style: 90 }), psychB: makeProfile({ conflict_style: 10 }) },
    });
    assert.equal(report.axisOverview.length, 0);
  });
});
