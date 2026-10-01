import { buildCanonicalRelationshipStoryPlan } from "../lib/relationship/romantic/prototypeV4/buildCanonicalRelationshipStoryPlan";
import { composeCanonicalSectionNarratives } from "../lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";
import { buildPersonalRelationshipCe } from "../lib/relationship/romantic/prototypeV4/personalRelationshipCe";

const mockSajuA = {
  gender: "male",
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  pillars: {
    year: { stem: "경", branch: "오", branchTenGod: "정관" },
    month: { stem: "신", branch: "사", branchTenGod: "편관" },
    day: { stem: "갑", branch: "자", branchTenGod: "정인" },
    time: { stem: "신", branch: "미", branchTenGod: "정재" },
  },
  dominantElements: ["목", "화"],
  tenGodCounts: { 정인: 2, 편관: 1, 정재: 1, 비견: 1 },
  dayMasterStrength: "neutral",
  dayStem: "갑",
  dayBranch: "자",
};

const mockSajuB = {
  gender: "female",
  year: 1992,
  month: 8,
  day: 20,
  hour: 10,
  pillars: {
    year: { stem: "임", branch: "신", branchTenGod: "편인" },
    month: { stem: "무", branch: "신", branchTenGod: "편인" },
    day: { stem: "정", branch: "축", branchTenGod: "식신" },
    time: { stem: "을", branch: "사", branchTenGod: "겁재" },
  },
  dominantElements: ["금", "수"],
  tenGodCounts: { 식신: 2, 편인: 2, 편재: 1 },
  dayMasterStrength: "weak",
  dayStem: "정",
  dayBranch: "축",
};

const ceA = buildPersonalRelationshipCe(mockSajuA, "민수");
const ceB = buildPersonalRelationshipCe(mockSajuB, "지은");

const mockReport = {
  report: {
    section_1_summary: "서로 다른 기질이 만나 깊은 신뢰를 쌓아가는 관계",
    section_2_attraction: {},
    section_3_conversation_patterns: {},
    section_4_hidden_hearts: {},
    section_5_growth_plan: {},
    section_6_timeline: {},
  }
};

const plan = buildCanonicalRelationshipStoryPlan({
  report: mockReport,
  personalSajuA: mockSajuA,
  personalSajuB: mockSajuB,
  names: { a: "민수", b: "지은" },
  year: 2026,
  locale: "ko",
});

const sections = composeCanonicalSectionNarratives(plan);

console.log("=== CHAPTER 3: DYNAMICS ===");
const c3 = sections.find(s => s.chapterId === "c3_dynamics");
console.log(JSON.stringify(c3, null, 2));

console.log("\n=== CHAPTER 6: HIDDEN HEARTS ===");
const c6 = sections.find(s => s.chapterId === "c6_hidden_hearts");
console.log(JSON.stringify(c6, null, 2));

console.log("\n=== CHAPTER 8: STRENGTH & VULNERABILITY ===");
const c8 = sections.find(s => s.chapterId === "c8_strength_vulnerability");
console.log(JSON.stringify(c8, null, 2));
