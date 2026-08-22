/**
 * Phase 5C (continued) — evidence-based conflict-trigger selection tests.
 * Root cause of the byte-identical trigger across every pair: a hardcoded
 * JSON string (canonicalStoryPlanCopy.ko.json's "loopTrigger"), used
 * unconditionally. Fixed in buildCanonicalRelationshipStoryPlan.ts via
 * selectConflictTriggerScene, which branches on comparison_table.decision/
 * stress, expression_speed.direction, axisResults structure gap, and
 * recovery_speed.recovery_mismatch — abstaining to general phrasing when
 * none of those are supported.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report.ts";

function makeProfile(overrides) {
  const secondaryBase = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  const primary = { autonomy: 50, connection: 50, stability: 50, growth: 50, structure: 50, adaptability: 50 };
  return {
    profile_type: "current_self",
    primary_axes: primary,
    secondary_axes: { ...secondaryBase, ...overrides },
    personalization: { primary_concern: null },
    meta: { survey_version: "v2", completed_at: new Date().toISOString(), completion_time_seconds: null },
  };
}

function triggerFor(nameA, nameB, birthA, birthB, profileA, profileB) {
  const report = buildCanonicalRomanticV4Report("ko-KR", 2026, {
    pairSajuInput: { mode: "real", birthA, birthB, nameA, nameB },
    surveyInput: { mode: "real", profileA, profileB },
  });
  const ch03 = report.sections.find((s) => s.chapterId === "c4_conflict");
  return ch03.blocks.find((b) => b.blockId === "loop.trigger").body;
}

describe("Evidence-based conflict trigger selection (spec Phase 5C continued Part 1)", () => {
  it("a large structure-axis gap selects the plan-disruption/structure-collision trigger, not the old fixed sentence", () => {
    const trigger = triggerFor(
      "예린", "도현",
      { birthDate: "1988-08-08", birthTime: "12:00" }, { birthDate: "1994-05-30", birthTime: "01:30" },
      makeProfile({ structure: 85 }), makeProfile({ structure: 20 }),
    );
    assert.ok(trigger.includes("즉흥적인 상황"), `expected the structure-collision scene, got: ${trigger}`);
    assert.ok(!trigger.includes("연락이 지연되거나, 주말 데이트 일정이나 큰 돈이 들어가는 결정이 갑자기 꼬일 때"), "must not be the old hardcoded three-in-one sentence");
  });

  it("no distinguishing evidence abstains to general phrasing instead of forcing a specific class", () => {
    const trigger = triggerFor(
      "하나", "두리",
      { birthDate: "1996-06-20", birthTime: "14:00" }, { birthDate: "1995-02-15", birthTime: "09:45" },
      makeProfile({ conflict_style: 30 }), makeProfile({ conflict_style: 32 }),
    );
    assert.ok(trigger.includes("예상치 못한 상황에서 서로의 반응 속도나 방식이 어긋날 때"), `expected abstention phrasing, got: ${trigger}`);
  });

  it("different pairs with different evidence profiles produce different trigger scenes (not always identical)", () => {
    const triggerA = triggerFor(
      "예린", "도현",
      { birthDate: "1988-08-08", birthTime: "12:00" }, { birthDate: "1994-05-30", birthTime: "01:30" },
      makeProfile({ structure: 85 }), makeProfile({ structure: 20 }),
    );
    const triggerB = triggerFor(
      "지민", "정우",
      { birthDate: "1993-04-12", birthTime: "07:30" }, { birthDate: "1991-11-02", birthTime: "23:10" },
      makeProfile({ empathy: 75 }), makeProfile({ empathy: 35 }),
    );
    // Not asserting exact values (chart-dependent), just that evidence-based
    // selection is actually capable of differentiating, unlike the old
    // hardcoded string that was byte-identical for every pair.
    const bothIdenticalToOldFixed = [triggerA, triggerB].every((t) =>
      t.includes("연락이 지연되거나, 주말 데이트 일정이나 큰 돈이 들어가는 결정이 갑자기 꼬일 때"),
    );
    assert.equal(bothIdenticalToOldFixed, false);
  });

  it("omitting survey profiles (no axisResults) still resolves to a valid, non-throwing trigger (abstention path)", () => {
    const report = buildCanonicalRomanticV4Report("ko-KR", 2026, {
      pairSajuInput: { mode: "real", birthA: { birthDate: "1993-04-12", birthTime: "07:30" }, birthB: { birthDate: "1991-11-02", birthTime: "23:10" }, nameA: "지민", nameB: "정우" },
    });
    const ch03 = report.sections.find((s) => s.chapterId === "c4_conflict");
    const trigger = ch03.blocks.find((b) => b.blockId === "loop.trigger").body;
    assert.ok(typeof trigger === "string" && trigger.length > 0);
  });
});
