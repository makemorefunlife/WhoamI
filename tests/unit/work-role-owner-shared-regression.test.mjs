/**
 * Regression: canonicalRoles.*Owner can be "SHARED" (the two people's
 * scores are within 15 points — common, not an edge case). Several Work
 * chapter engines used to do `owner === "B" ? nameB : nameA`, silently
 * collapsing "SHARED" into nameA every time — a genuine tie always looked
 * like slot A solely owning the role, in workPlaybookChapterEngine.ts,
 * workCommunicationChapterEngine.ts, and workPressureChapterEngine.ts.
 *
 * Run: npx tsx tests/unit/work-role-owner-shared-regression.test.mjs
 */
import assert from "node:assert/strict";
import { resolveWorkRoleOwnerName } from "../../lib/relationship/workColleague/workCanonicalRoleModel.ts";
import { buildWorkPlaybookChapterBundle } from "../../lib/relationship/workColleague/workPlaybookChapterEngine.ts";
import { buildWorkCommunicationChapterBundle } from "../../lib/relationship/workColleague/workCommunicationChapterEngine.ts";
import { buildWorkPressureChapterBundle } from "../../lib/relationship/workColleague/workPressureChapterEngine.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

section("1. resolveWorkRoleOwnerName — direct unit checks");
{
  assert.equal(resolveWorkRoleOwnerName("A", "Sera", "동글", "두 사람"), "Sera");
  assert.equal(resolveWorkRoleOwnerName("B", "Sera", "동글", "두 사람"), "동글");
  assert.equal(resolveWorkRoleOwnerName("SHARED", "Sera", "동글", "두 사람"), "두 사람");
  ok("A/B resolve to the real name, SHARED resolves to the shared label — never silently to nameA");
}

// Two people with identical (or near-identical, <15pt gap) psych axes on
// every dimension the role model reads — every *Owner should be SHARED.
const tiedPsych = () => ({ secondary_axes: { decision_style: 50, structure: 50, empathy: 50, recognition: 50 } });

section("2. workPlaybookChapterEngine — tied inputs never silently favor nameA");
{
  const bundle = buildWorkPlaybookChapterBundle({
    nameA: "Sera",
    nameB: "동글",
    psychA: tiedPsych(),
    psychB: tiedPsych(),
  });
  const owners = bundle.emergencyPlaybook.map((i) => i.ownerName);
  assert.ok(
    owners.every((o) => o === "두 사람"),
    `tied inputs must produce the shared label for every emergency playbook owner, got: ${JSON.stringify(owners)}`,
  );
  for (const item of bundle.emergencyPlaybook) {
    assert.ok(item.responsibility.includes(item.ownerName), "responsibility text must still literally contain the resolved owner name");
  }
  ok("emergencyPlaybook owners resolve to the shared label (not nameA) when the underlying scores are tied");
}

section("3. workCommunicationChapterEngine — tied inputs never silently favor nameA");
{
  const bundle = buildWorkCommunicationChapterBundle({
    nameA: "Sera",
    nameB: "동글",
    psychA: tiedPsych(),
    psychB: tiedPsych(),
  });
  assert.equal(bundle.decisionFlowItems[0].primaryOwner, "두 사람", "execution owner must resolve to the shared label on a tie, not nameA");
  assert.equal(bundle.decisionFlowItems[1].primaryOwner, "두 사람", "qa/risk owner must resolve to the shared label on a tie, not nameA");
  assert.equal(bundle.decisionFlowItems[2].primaryOwner, "두 사람", "direction owner must resolve to the shared label on a tie, not nameA");
  ok("decisionFlowItems' primaryOwner resolves to the shared label (not nameA) when the underlying scores are tied");
}

section("4. workPressureChapterEngine — tied inputs never silently favor nameA");
{
  const bundle = buildWorkPressureChapterBundle({
    nameA: "Sera",
    nameB: "동글",
    psychA: tiedPsych(),
    psychB: tiedPsych(),
  });
  // With execLead === qualityLead (both "두 사람" on a tie), the engine's
  // own branch takes the genuinely-shared strengthSummary/bottleneckSummary
  // text, which must not name either person as if they alone were behind it.
  const { strengthSummary } = bundle.pairStressInteraction;
  assert.ok(!strengthSummary.includes("Sera"), "a tied pair's strength summary must not single out nameA");
  assert.ok(!strengthSummary.includes("동글"), "a tied pair's strength summary must not single out nameB");
  ok("pressure chapter's shared-tie branch does not name either person individually");
}

section("5. A real, clear gap still resolves decisively (this fix must not flatten everything to SHARED)");
{
  const decisivePsychA = { secondary_axes: { decision_style: 90, structure: 90, empathy: 50, recognition: 50 } };
  const decisivePsychB = { secondary_axes: { decision_style: 10, structure: 10, empathy: 50, recognition: 50 } };
  const bundle = buildWorkPlaybookChapterBundle({
    nameA: "Sera",
    nameB: "동글",
    psychA: decisivePsychA,
    psychB: decisivePsychB,
  });
  const owners = bundle.emergencyPlaybook.map((i) => i.ownerName);
  assert.ok(owners.every((o) => o === "Sera" || o === "동글"), `a real gap must resolve to a real name, not the shared label: ${JSON.stringify(owners)}`);
  ok("a genuinely decisive gap still resolves to a real person, not flattened to the shared label");
}

console.log("\n✔ All work-role-owner-shared regression checks passed.\n");
