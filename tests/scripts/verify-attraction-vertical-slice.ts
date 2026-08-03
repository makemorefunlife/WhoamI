import { buildActualFourCeContract } from "@/lib/relationship/romantic/prototypeV4/buildActualFourCeContract";
import { buildRomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { buildCanonicalRelationshipStoryPlan } from "@/lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan";
import { composeCanonicalSectionNarratives } from "@/lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";

function run() {
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
  const attrSection = sections.find((s) => s.chapterId === "c2_attraction");
  if (!attrSection) throw new Error("c2_attraction section not found!");

  console.log("\n========================================================");
  console.log("   ROMANTIC V4 ATTRACTION VERTICAL SLICE PROOF");
  console.log("========================================================\n");

  console.log(`[CHAPTER] ${attrSection.title} (${attrSection.userQuestion})\n`);
  attrSection.blocks.forEach((b) => {
    console.log(`\n--- [BLOCK: ${b.blockId}] ${b.title} ---`);
    console.log(b.body);
    console.log(`\n[Evidence Traceability (${b.evidenceIds.length} refs)]:\n  ` + b.evidenceIds.join("\n  "));
  });

  // Verify story plan attraction contents
  const storyPlanAttr = storyPlan.attraction;
  console.log("\n--------------------------------------------------------");
  console.log("   STORY PLAN BILATERAL MATCH OBJECT VERIFICATION");
  console.log("--------------------------------------------------------\n");
  console.log("Bilateral A->B match strength:", storyPlanAttr.bilateralMatches?.aToB.matchStrength);
  console.log("Bilateral A->B spouse palace:", storyPlanAttr.bilateralMatches?.aToB.seekerSpousePalace.tenGodName);
  console.log("Bilateral B->A match strength:", storyPlanAttr.bilateralMatches?.bToA.matchStrength);
  console.log("Bilateral B->A spouse palace:", storyPlanAttr.bilateralMatches?.bToA.seekerSpousePalace.tenGodName);

  if (!storyPlanAttr.bilateralMatches) {
    throw new Error("FAIL: storyPlanAttr.bilateralMatches is undefined!");
  }
  if (!storyPlanAttr.aSeeks.supportingReasons?.length) {
    throw new Error("FAIL: aSeeks.supportingReasons is empty!");
  }
  if (!storyPlanAttr.bSeeks.supportingReasons?.length) {
    throw new Error("FAIL: bSeeks.supportingReasons is empty!");
  }

  console.log("\n>>> VERTICAL SLICE PASS: Ten Gods, Spouse Palace Bilateral Match & Narrative Survived Perfectly! <<<\n");
}

run();
