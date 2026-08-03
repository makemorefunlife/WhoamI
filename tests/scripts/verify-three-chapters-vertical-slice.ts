import { buildActualFourCeContract } from "@/lib/relationship/romantic/prototypeV4/buildActualFourCeContract";
import { buildRomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { buildCanonicalRelationshipStoryPlan } from "@/lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan";
import { composeCanonicalSectionNarratives } from "@/lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";

export function runThreeChaptersVerification() {
  const { contract } = buildActualFourCeContract("ko-KR");
  const payload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    contractOverride: contract,
  });

  const storyPlan = buildCanonicalRelationshipStoryPlan({
    contract,
    report: (payload as any).rawReport ?? {},
    axisResults: [],
    locale: "ko-KR",
  });

  const sections = composeCanonicalSectionNarratives(storyPlan);

  console.log("\n========================================================");
  console.log("   ROMANTIC V4 THREE-CHAPTER EXPANSION VERIFICATION");
  console.log("========================================================\n");

  // 1. Chapter 3: Dynamics
  const c3 = sections.find((s) => s.chapterId === "c3_dynamics");
  if (!c3) throw new Error("c3_dynamics section not found!");
  console.log(`[CHAPTER 3] ${c3.title} (${c3.userQuestion})\n`);
  c3.blocks.forEach((b) => {
    console.log(`--- [BLOCK: ${b.blockId}] ${b.title} ---`);
    console.log(b.body);
    console.log(`[Evidence (${b.evidenceIds.length} refs)]:\n  ` + b.evidenceIds.join("\n  ") + "\n");
  });

  // Verify Chapter 3 Story Plan faces
  if (storyPlan.faces.length < 3) {
    throw new Error(`FAIL: Chapter 3 expected at least 3 faces, got ${storyPlan.faces.length}`);
  }
  for (const face of storyPlan.faces) {
    if (!face.appearance || !face.mechanism || !face.benefit) {
      throw new Error(`FAIL: Face ${face.situation} missing required narrative fields!`);
    }
  }

  // 2. Chapter 6: Hidden Hearts
  const c6 = sections.find((s) => s.chapterId === "c6_hidden_hearts");
  if (!c6) throw new Error("c6_hidden_hearts section not found!");
  console.log(`\n[CHAPTER 6] ${c6.title} (${c6.userQuestion})\n`);
  c6.blocks.forEach((b) => {
    console.log(`--- [BLOCK: ${b.blockId}] ${b.title} ---`);
    console.log(b.body);
    console.log(`[Evidence (${b.evidenceIds.length} refs)]:\n  ` + b.evidenceIds.join("\n  ") + "\n");
  });

  // Verify Chapter 6 Story Plan hidden hearts
  if (storyPlan.hiddenHearts.length < 2) {
    throw new Error(`FAIL: Chapter 6 expected 2 hidden hearts, got ${storyPlan.hiddenHearts.length}`);
  }
  for (const heart of storyPlan.hiddenHearts) {
    if (!heart.visibleReaction || !heart.innerFeeling || !heart.fear || !heart.unspokenNeed || !heart.whatHelps) {
      throw new Error(`FAIL: Hidden heart for person ${heart.person} missing required fields!`);
    }
  }

  // 3. Chapter 8: Strength & Vulnerability
  const c8 = sections.find((s) => s.chapterId === "c8_strength_vulnerability");
  if (!c8) throw new Error("c8_strength_vulnerability section not found!");
  console.log(`\n[CHAPTER 8] ${c8.title} (${c8.userQuestion})\n`);
  c8.blocks.forEach((b) => {
    console.log(`--- [BLOCK: ${b.blockId}] ${b.title} ---`);
    console.log(b.body);
    console.log(`[Evidence (${b.evidenceIds.length} refs)]:\n  ` + b.evidenceIds.join("\n  ") + "\n");
  });

  // Verify Chapter 8 Story Plan bilateral changes & shared strength
  if (!storyPlan.bilateralChanges?.length || storyPlan.bilateralChanges.length < 2) {
    throw new Error(`FAIL: Chapter 8 expected 2 bilateral changes!`);
  }
  if (!storyPlan.sharedStrength) {
    throw new Error(`FAIL: Chapter 8 sharedStrength is missing!`);
  }
  if (!storyPlan.sharedVulnerability) {
    throw new Error(`FAIL: Chapter 8 sharedVulnerability is missing!`);
  }

  console.log("\n>>> THREE-CHAPTER EXPANSION PASS: Dynamics, Hidden Hearts, and Strength & Vulnerability all verified! <<<\n");
  return { storyPlan, sections };
}

if (require.main === module || (typeof process !== "undefined" && process.argv[1]?.includes("verify-three-chapters"))) {
  runThreeChaptersVerification();
}
