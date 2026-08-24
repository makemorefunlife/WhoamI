import { buildFamilyGrowthChapterBundle } from "../lib/relationship/familyParent/familyGrowthChapterEngine";

// Test Fixture 1: High Stimulation, High Autonomy (Creative Exploration Child)
const child1 = {
  childNickname: "동글",
  parentNickname: "Sera",
  psychChild: {
    secondaryAxes: {
      stimulation: 85,
      autonomy: 80,
      recognition: 40,
      analytical_thinking: 45,
      external_energy: 75,
      practicality: 70,
      stability_orientation: 35,
      growth_orientation: 75,
      self_control: 40,
      resilience: 45,
      adaptability: 80,
      structure: 35,
    },
  },
  psychParent: {
    secondaryAxes: {
      structure: 75,
      stability_orientation: 80,
    },
  },
  countsChild: { food: 3, seal: 0, wealth: 1, officer: 0, self: 1 },
};

// Test Fixture 2: Low Stimulation, High Analytical, High Recognition (Quiet Specialist Child)
const child2 = {
  childNickname: "민우",
  parentNickname: "Sera",
  psychChild: {
    secondaryAxes: {
      stimulation: 30,
      autonomy: 40,
      recognition: 85,
      analytical_thinking: 85,
      external_energy: 35,
      practicality: 40,
      stability_orientation: 75,
      growth_orientation: 80,
      self_control: 75,
      resilience: 70,
      adaptability: 40,
      structure: 80,
    },
  },
  psychParent: {
    secondaryAxes: {
      structure: 75,
      stability_orientation: 80,
    },
  },
  countsChild: { food: 0, seal: 3, wealth: 0, officer: 2, self: 0 },
};

// Test Fixture 3: High Practicality, High Officer (Practical Career Leader Child)
const child3 = {
  childNickname: "지후",
  parentNickname: "Sera",
  psychChild: {
    secondaryAxes: {
      stimulation: 50,
      autonomy: 60,
      recognition: 70,
      analytical_thinking: 50,
      external_energy: 70,
      practicality: 85,
      stability_orientation: 60,
      growth_orientation: 70,
      self_control: 70,
      resilience: 65,
      adaptability: 50,
      structure: 70,
    },
  },
  psychParent: {
    secondaryAxes: {
      structure: 75,
      stability_orientation: 80,
    },
  },
  countsChild: { food: 0, seal: 0, wealth: 3, officer: 2, self: 0 },
};

console.log("=== CHILD 1: 동글 (Creative Exploration) ===");
const bundle1 = buildFamilyGrowthChapterBundle(child1);
console.log("Drive Title:", bundle1.motivation.driveTitle);
console.log("Study Type:", bundle1.learning.oneLineStudyType);
console.log("Focus Env:", bundle1.learning.focusEnvironment);
console.log("Praise Title:", bundle1.motivationAndExpectation.praiseGuidanceTitle);
console.log("Social Operating:", bundle1.socialOperating.socialOperatingTitle);
console.log("Recommended Activities:", bundle1.socialOperating.recommendedActivities);
console.log("Parenting Push:", bundle1.parentGuidance.pushForward);

console.log("\n=== CHILD 2: 민우 (Quiet Specialist) ===");
const bundle2 = buildFamilyGrowthChapterBundle(child2);
console.log("Drive Title:", bundle2.motivation.driveTitle);
console.log("Study Type:", bundle2.learning.oneLineStudyType);
console.log("Focus Env:", bundle2.learning.focusEnvironment);
console.log("Praise Title:", bundle2.motivationAndExpectation.praiseGuidanceTitle);
console.log("Social Operating:", bundle2.socialOperating.socialOperatingTitle);
console.log("Recommended Activities:", bundle2.socialOperating.recommendedActivities);
console.log("Parenting Push:", bundle2.parentGuidance.pushForward);

console.log("\n=== CHILD 3: 지후 (Practical Career Leader) ===");
const bundle3 = buildFamilyGrowthChapterBundle(child3);
console.log("Drive Title:", bundle3.motivation.driveTitle);
console.log("Study Type:", bundle3.learning.oneLineStudyType);
console.log("Focus Env:", bundle3.learning.focusEnvironment);
console.log("Praise Title:", bundle3.motivationAndExpectation.praiseGuidanceTitle);
console.log("Social Operating:", bundle3.socialOperating.socialOperatingTitle);
console.log("Recommended Activities:", bundle3.socialOperating.recommendedActivities);
console.log("Parenting Push:", bundle3.parentGuidance.pushForward);
