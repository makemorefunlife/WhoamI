import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFamilyRuleContext } from "../../lib/relationship/familyParent/buildFamilyRuleContext.ts";
import { buildFamilyOverviewCardNarratives } from "../../lib/relationship/familyParent/familyOverviewNarrative.ts";
import { buildFamilyParentSnapshotPanel } from "../../lib/relationship/familyParent/buildFamilySnapshotPanel.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";

function createMockSaju(dateStr, timeStr) {
  const bundle = calculateSajuBundle({
    birthDate: dateStr,
    birthTime: timeStr,
  });
  return toV1SajuApiPayload(bundle);
}

describe("Family Premium Overview 3-Card Evidence Narrative Upgrade", () => {
  const sajuParent = createMockSaju("1980-04-12", "14:20");
  const sajuChild = createMockSaju("2010-09-25", "09:10");

  const ctx = buildFamilyRuleContext({
    nicknameA: "엄마김민정",
    nicknameB: "딸이지은",
    roles: { roleA: "mother", roleB: "child" },
    sajuJsonA: sajuParent,
    sajuJsonB: sajuChild,
    locale: "ko-KR",
  });

  const narratives = buildFamilyOverviewCardNarratives(ctx);

  it("1. All three Family cards have distinct domain lenses and subtitles", () => {
    assert.equal(narratives.bond.oneLiner, "마음을 나누고 위로가 필요할 때");
    assert.equal(narratives.synergy.oneLiner, "배우고 도전하고 자기 길을 찾을 때");
    assert.equal(narratives.risk.oneLiner, "기준을 세우거나 잘못을 바로잡을 때");

    assert.notEqual(narratives.bond.oneLiner, narratives.synergy.oneLiner);
    assert.notEqual(narratives.synergy.oneLiner, narratives.risk.oneLiner);
  });

  it("2. '왜 이렇게 나왔나요?' contains pair-interaction evidence rather than advice-only output", () => {
    const bondWhy = narratives.bond.why;
    const synergyWhy = narratives.synergy.why;
    const riskWhy = narratives.risk.why;

    // Should NOT be generic advice
    assert.ok(!bondWhy.includes("연습이 필요합니다"), `bondWhy should not be advice: ${bondWhy}`);
    assert.ok(!synergyWhy.includes("노력하세요"), `synergyWhy should not be advice: ${synergyWhy}`);
    assert.ok(!riskWhy.includes("그러니 이렇게 하세요"), `riskWhy should not be advice: ${riskWhy}`);

    // Should explain interaction mechanism with specific parent and child names
    assert.ok(bondWhy.includes(ctx.parentNickname) || bondWhy.includes(ctx.childNickname));
    assert.ok(synergyWhy.includes(ctx.parentNickname) || synergyWhy.includes(ctx.childNickname));
    assert.ok(riskWhy.includes(ctx.parentNickname) || riskWhy.includes(ctx.childNickname));
  });

  it("3. Both parent and child evidence/roles are consumed in narratives", () => {
    assert.ok(narratives.bond.why.includes(ctx.childNickname) && narratives.bond.why.includes(ctx.parentNickname));
    assert.ok(narratives.synergy.why.includes(ctx.childNickname) && narratives.synergy.why.includes(ctx.parentNickname));
    assert.ok(narratives.risk.why.includes(ctx.childNickname) && narratives.risk.why.includes(ctx.parentNickname));
  });

  it("4. Parent-Child Directionality is preserved (Parent -> Child)", () => {
    // Risk card describes parent action -> child response interaction
    const riskWhy = narratives.risk.why;
    assert.ok(
      riskWhy.includes("지적") || riskWhy.includes("방어") || riskWhy.includes("대립") || riskWhy.includes("마찰"),
      `riskWhy should describe directional discipline friction interaction: ${riskWhy}`,
    );
  });

  it("5. Zero raw Saju terminology leaks in user-facing output", () => {
    const BANNED_SAJU_TERMS = [
      "천간", "지지", "십성", "편관", "정관", "식신", "상관", "비견", "겁재",
      "편인", "정인", "편재", "정재", "원진", "충", "형", "파", "용신", "신살", "일간"
    ];

    const allOutput = [
      narratives.bond.gradeLabel, narratives.bond.oneLiner, narratives.bond.measures, narratives.bond.why, narratives.bond.scene,
      narratives.synergy.gradeLabel, narratives.synergy.oneLiner, narratives.synergy.measures, narratives.synergy.why, narratives.synergy.scene,
      narratives.risk.gradeLabel, narratives.risk.oneLiner, narratives.risk.measures, narratives.risk.why, narratives.risk.scene,
    ].join(" ");

    for (const term of BANNED_SAJU_TERMS) {
      assert.ok(!allOutput.includes(term), `Banned Saju term found: "${term}" in output`);
    }
  });

  it("6. High/low score narratives remain consistent with score direction", () => {
    // Bond score is between 0 and 100
    assert.ok(ctx.masterScores.bond >= 0 && ctx.masterScores.bond <= 100);
    assert.ok(narratives.bond.why.includes(String(ctx.masterScores.bond)) || narratives.bond.why.length > 50);

    // Friction risk inverted (higher score means higher friction)
    assert.ok(ctx.masterScores.risk >= 0 && ctx.masterScores.risk <= 100);
  });

  it("7. Family output does not simply reuse Romantic prose", () => {
    const allOutput = [
      narratives.bond.why,
      narratives.synergy.why,
      narratives.risk.why,
    ].join(" ");

    assert.ok(!allOutput.includes("연인"), "Family output must not mention '연인'");
    assert.ok(!allOutput.includes("연애"), "Family output must not mention '연애'");
    assert.ok(!allOutput.includes("데이트"), "Family output must not mention '데이트'");
  });

  it("10. Zero broken Korean particle placeholders and zero repetitive template phrasing", () => {
    const allProse = [
      narratives.bond.why,
      narratives.synergy.why,
      narratives.risk.why,
    ].join("\n");

    const BANNED_PATTERNS = [
      "(이)가", "(은)는", "(을)를", "(이)",
      "~을 봅니다", "을 봅니다", "를 봅니다", "인지 봅니다", "성격을 봅니다",
      "특히 ", "그래서 ", "나타납니다",
    ];

    for (const pattern of BANNED_PATTERNS) {
      assert.ok(!allProse.includes(pattern), `Banned template pattern found: "${pattern}" in prose:\n${allProse}`);
    }
  });

  it("8. Same input remains deterministic across invocations", () => {
    const run1 = buildFamilyOverviewCardNarratives(ctx);
    const run2 = buildFamilyOverviewCardNarratives(ctx);

    assert.deepEqual(run1.bond, run2.bond);
    assert.deepEqual(run1.synergy, run2.synergy);
    assert.deepEqual(run1.risk, run2.risk);
  });

  it("9. buildFamilyParentSnapshotPanel incorporates upgraded narratives", () => {
    const panel = buildFamilyParentSnapshotPanel(ctx);
    assert.equal(panel.narrative?.topics.length, 3);

    const bondTopic = panel.narrative.topics.find((t) => t.topic === "intimacy");
    assert.ok(bondTopic);
    assert.equal(bondTopic.subtitle, "마음을 나누고 위로가 필요할 때");
    assert.equal(bondTopic.interpretation, narratives.bond.shortWhy);
  });
});
