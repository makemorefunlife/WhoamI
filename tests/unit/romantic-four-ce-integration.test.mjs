import assert from "node:assert/strict";
import { buildActualFourCeContract } from "../../lib/relationship/romantic/prototypeV3/buildActualFourCeContract.ts";
import { buildRomanticV3PrototypePayload } from "../../lib/relationship/romantic/prototypeV3/buildRomanticV3PrototypePayload.ts";

function getChapter(payload, chapterId) {
  return payload.chapters.find((c) => c.chapter === chapterId);
}

function getBlock(chapter, blockId) {
  return chapter?.blocks.find((b) => b.blockId === blockId);
}

const actual = buildActualFourCeContract("ko-KR");
const contract = actual.contract;

assert.equal(contract.siblingInputs.individualCeA.output.status, "available");
assert.equal(contract.siblingInputs.individualCeB.output.status, "available");
assert.equal(contract.siblingInputs.pairCeCommon.output.status, "available");
assert.equal(contract.siblingInputs.romanticCeSpecific.output.status, "available");

const a = contract.siblingInputs.individualCeA.output.value;
const b = contract.siblingInputs.individualCeB.output.value;
assert.equal(a.schema_version, "personal_ce_v1");
assert.ok(a.packets.length > 0);
assert.ok(a.groups.identity.length > 0);
assert.ok(a.packets.some((p) => p.fact_path === "day_master.stem"));
assert.ok(b.packets.some((p) => p.fact_path === "day_master.stem"));
assert.ok(b.groups.energy.length > 0);

const pair = contract.siblingInputs.pairCeCommon.output.value;
assert.equal(pair.pairCe.schema_version, "pair_ce_v1");
assert.ok(pair.pairCe.packets.length >= actual.pairCeBondingValue.count);
assert.ok(pair.romanticPairLens.packets.length > 0);

const romantic = contract.siblingInputs.romanticCeSpecific.output.value;
assert.ok(romantic.romanticContextInput.dominant_categories);
assert.ok(romantic.canonicalProjections?.comparison_table);
assert.ok(romantic.canonicalProjections?.recovery_speed);

const complete = buildRomanticV3PrototypePayload("complete", "ko-KR");
assert.ok(complete.preNarrativeContract);
assert.equal(
  complete.preNarrativeContract.siblingInputs.individualCeA.output.status,
  "available",
);

const ch3 = getChapter(complete, "ch3_why_this_works");
const whyA = getBlock(ch3, "why.a_to_b");
assert.ok(whyA?.evidenceIds.includes("ce.individual.a"));
assert.ok(whyA?.evidenceIds.includes("canonical_projections.pair_ce_bonding"));
assert.ok(whyA?.evidenceIds.includes("ce.romantic.specific"));

const majorFourCeBlocks = [
  getBlock(getChapter(complete, "ch4_relationship_flow"), "flow.summary"),
  getBlock(getChapter(complete, "ch5_when_we_miss_each_other"), "miss.pattern.one"),
  getBlock(getChapter(complete, "ch6_hidden_heart"), "hidden.a.inner-need"),
  getBlock(getChapter(complete, "ch7_repair_guide"), "repair.core-sequence"),
  getBlock(getChapter(complete, "ch8_love_in_real_life"), "real-life.after-conflict"),
].filter(Boolean);

assert.ok(majorFourCeBlocks.length >= 5);
for (const block of majorFourCeBlocks) {
  const evidence = block.evidenceIds.join(" ");
  assert.ok(
    evidence.includes("ce.individual.") ||
      evidence.includes("ce.pair.common") ||
      evidence.includes("ce.romantic.specific"),
    `missing CE provenance: ${block.blockId}`,
  );
}

const plan = complete.fourCeSemanticPlan;
assert.ok(plan);

function assertMeaningFromDeclaredSource(contractInput, source, selectedMeaning) {
  if (selectedMeaning == null) return;
  if (source.startsWith("individualCeA.")) {
    assert.ok(
      JSON.stringify(contractInput.siblingInputs.individualCeA.output).includes(selectedMeaning),
    );
    return;
  }
  if (source.startsWith("individualCeB.")) {
    assert.ok(
      JSON.stringify(contractInput.siblingInputs.individualCeB.output).includes(selectedMeaning),
    );
    return;
  }
  if (source.startsWith("pairCeCommon.")) {
    assert.ok(
      JSON.stringify(contractInput.siblingInputs.pairCeCommon.output).includes(selectedMeaning),
    );
    return;
  }
  if (source.startsWith("romanticCeSpecific.")) {
    assert.ok(
      JSON.stringify(contractInput.siblingInputs.romanticCeSpecific.output).includes(selectedMeaning),
    );
  }
}

for (const item of Object.values(plan)) {
  assertMeaningFromDeclaredSource(contract, item.source, item.selectedMeaning);
}

const fallbackContract = structuredClone(contract);
fallbackContract.siblingInputs.individualCeA.output = {
  status: "unavailable",
  reason: "test",
};
fallbackContract.siblingInputs.individualCeB.output = {
  status: "unavailable",
  reason: "test",
};
fallbackContract.siblingInputs.pairCeCommon.output = {
  status: "unavailable",
  reason: "test",
};
fallbackContract.siblingInputs.romanticCeSpecific.output = {
  status: "unavailable",
  reason: "test",
};
const fallbackPayload = buildRomanticV3PrototypePayload("complete", "ko-KR", {
  contractOverride: fallbackContract,
});
const fallbackWhyA = getBlock(
  getChapter(fallbackPayload, "ch3_why_this_works"),
  "why.a_to_b",
);
assert.notEqual(fallbackWhyA?.content, whyA?.content);
const fallbackPlan = fallbackPayload.fourCeSemanticPlan;
assert.equal(fallbackPlan.aRelationshipCharacter.selectedMeaning, null);
assert.equal(fallbackPlan.bRelationshipCharacter.selectedMeaning, null);
assert.equal(fallbackPlan.directionalAsymmetry.selectedMeaning, null);
assert.equal(fallbackPlan.pairSynthesis.selectedMeaning, null);
assert.equal(fallbackPlan.conflictRepairConsequence.selectedMeaning, null);

const fallbackProfileA = getBlock(
  getChapter(fallbackPayload, "ch2_you_and_me"),
  "profile.a",
);
assert.ok(!fallbackProfileA?.content.includes("내 안쪽 리듬을 가장 잘 설명하는 문장"));

const fallbackWhyTogether = getBlock(
  getChapter(fallbackPayload, "ch3_why_this_works"),
  "why.together",
);
assert.equal(fallbackWhyTogether, undefined);

for (const chapterId of [
  "ch4_relationship_flow",
  "ch5_when_we_miss_each_other",
  "ch6_hidden_heart",
  "ch7_repair_guide",
  "ch8_love_in_real_life",
]) {
  assert.ok((getChapter(complete, chapterId)?.blocks.length ?? 0) > 0);
}

const chapterText = complete.chapters
  .flatMap((c) => c.blocks.map((b) => b.content))
  .join("\n");
for (const leaked of [
  "personal_ce_v1",
  "pair_ce_v1",
  "individual_saju_json",
  "ce.individual.a",
  "ce.individual.b",
  "ce.pair.common",
  "ce.romantic.specific",
  "ch2_",
  "sourceKind",
]) {
  assert.equal(chapterText.includes(leaked), false, `leaked internal token: ${leaked}`);
}

console.log("romantic four-ce integration tests passed");
