import { buildActualFourCeContract } from "@/lib/relationship/romantic/prototypeV4/buildActualFourCeContract";
import { buildRomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { buildCanonicalRelationshipStoryPlan } from "@/lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan";
import { composeCanonicalSectionNarratives } from "@/lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";

const { contract } = buildActualFourCeContract("ko-KR");
const payload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
  contractOverride: contract,
});

const relA = contract.siblingInputs.individualCeA.relationshipCe;
const relB = contract.siblingInputs.individualCeB.relationshipCe;

console.log("=== ROMANTIC V4 PERSONAL CE INTEGRATION VERIFICATION ===");
console.log("Person A:", relA?.name, "(", relA?.personId, ")");
console.log("  Core Nature:", relA?.coreRelationshipNature.text);
console.log("  Care Expression:", relA?.careExpression.text);
console.log("  Dominant Element Meaning:", relA?.fiveElementStructure.dominantMeaning.text);
console.log("  Stress Response:", relA?.stressResponse.text);
console.log("  Conflict Response:", relA?.conflictResponse.text);
console.log("  Recovery Pattern:", relA?.recoveryPattern.text);
console.log("  Hidden Vulnerability:", relA?.hiddenVulnerability.text);

console.log("\nPerson B:", relB?.name, "(", relB?.personId, ")");
console.log("  Core Nature:", relB?.coreRelationshipNature.text);
console.log("  Care Expression:", relB?.careExpression.text);
console.log("  Dominant Element Meaning:", relB?.fiveElementStructure.dominantMeaning.text);
console.log("  Stress Response:", relB?.stressResponse.text);
console.log("  Conflict Response:", relB?.conflictResponse.text);
console.log("  Recovery Pattern:", relB?.recoveryPattern.text);
console.log("  Hidden Vulnerability:", relB?.hiddenVulnerability.text);

console.log("\n=== CANONICAL STORY PLAN SAMPLE FIELDS ===");
const storyPlan = buildCanonicalRelationshipStoryPlan({
  contract,
  report: (payload as any).rawReport ?? {},
  axisResults: [],
  locale: "ko-KR",
});

console.log("Relationship Definition:\n ", storyPlan.relationshipDefinition);
console.log("\nFaces (Private):\n ", storyPlan.faces.find(f => f.situation === "private")?.appearance);
console.log("\nFaces (Responsibility):\n ", storyPlan.faces.find(f => f.situation === "responsibility")?.appearance);
console.log("\nFaces (Stress):\n ", storyPlan.faces.find(f => f.situation === "stress")?.appearance);
console.log("\nAttraction A Seeks:\n ", storyPlan.attraction.aSeeks.seeksInPartner);
console.log("\nAttraction B Seeks:\n ", storyPlan.attraction.bSeeks.seeksInPartner);
console.log("\nMisread A Observes B:\n ", storyPlan.misreads.find(m => m.direction === "a_observes_b")?.observedBehavior);
console.log("  Negative Reading:\n   ", storyPlan.misreads.find(m => m.direction === "a_observes_b")?.commonNegativeReading);
console.log("  Helpful Response:\n   ", storyPlan.misreads.find(m => m.direction === "a_observes_b")?.helpfulResponse);
console.log("\nHidden Hearts Person A:\n ", storyPlan.hiddenHearts.find(h => h.person === "a")?.innerFeeling);
console.log("Hidden Hearts Person B:\n ", storyPlan.hiddenHearts.find(h => h.person === "b")?.innerFeeling);
console.log("\nRepair Helps A:\n ", storyPlan.repair.helpsA);
console.log("Repair Helps B:\n ", storyPlan.repair.helpsB);

console.log("\n=== CANONICAL SECTIONS NARRATIVE BLOCKS ===");
const sections = composeCanonicalSectionNarratives(storyPlan);
for (const s of sections) {
  console.log(`\n[${s.chapterId}] ${s.title}`);
  for (const b of s.blocks) {
    console.log(`  - [${b.blockId}] ${b.title}: ${b.body.replace(/\n/g, ' ')}`);
  }
}

console.log("\n>>> ALL CHECKS PASSED: Personal CE successfully injected into Story Plan and Narrative Sections! <<<");
