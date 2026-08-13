import { buildMarriageReport } from "../../lib/relationship/marriage/buildMarriageReport";
import type { SajuDataForIntegrated } from "../../lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

function makePsych(overrides: Record<string, number>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return {
    survey_source: "v2_10q",
    secondary_axes: { ...base, ...overrides },
    home_life_dna: { lifestyle_title: "체계적인 정리자", life_values_line: "안정된 공간" },
  } as unknown as PsychMasterJson;
}

const sajuA: SajuDataForIntegrated = { saju: { yearPillar: "갑자", monthPillar: "병인", dayPillar: "을묘", hourPillar: "무신" } };
const sajuB: SajuDataForIntegrated = { saju: { yearPillar: "을축", monthPillar: "정묘", dayPillar: "경오", hourPillar: "기사" } };

console.log("==================================================");
console.log(" MARRIAGE V2 PHASE 3 STORYPLAN & OWNERSHIP AUDIT");
console.log("==================================================");

// Pair 1: Operating Complement (PM Heavy A vs Executor Heavy B)
const psychA1 = makePsych({ structure: 80, self_control: 75 });
const psychB1 = makePsych({ structure: 35, practicality: 70 });
const report1 = buildMarriageReport({
  nicknameA: "Sera", nicknameB: "동글",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA1, psychMasterB: psychB1,
  locale: "ko-KR",
});

// Pair 2: Dual Planner Control Tension
const psychA2 = makePsych({ structure: 80, self_control: 75, decision_style: 75 });
const psychB2 = makePsych({ structure: 75, self_control: 80, decision_style: 70 });
const report2 = buildMarriageReport({
  nicknameA: "민준", nicknameB: "서연",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA2, psychMasterB: psychB2,
  locale: "ko-KR",
});

// Pair 3: Career-Heavy / Home Overload Risk
const psychA3 = makePsych({ recognition: 85, empathy: 45 });
const psychB3 = makePsych({ recognition: 80, empathy: 45 });
const report3 = buildMarriageReport({
  nicknameA: "현우", nicknameB: "지은",
  sajuJsonA: sajuA, sajuJsonB: sajuB,
  psychMasterA: psychA3, psychMasterB: psychB3,
  locale: "ko-KR",
});

const sp1 = report1.canonical_projections?.marriage_canonical_story_plan;
const sp2 = report2.canonical_projections?.marriage_canonical_story_plan;
const sp3 = report3.canonical_projections?.marriage_canonical_story_plan;

console.log("\n--- [1. STORYPLAN CHAPTER STRUCTURE CHECK] ---");
console.log("Total Chapters Count:", sp1?.chapters.length);
sp1?.chapters.forEach((c) => {
  console.log(`[Ch ${c.chapterNumber}] ${c.title} | Owner: ${c.primaryOwnerMeanings.join(", ")}`);
});

console.log("\n--- [2. SAMPLE STORYPLAN QA (3 PAIR VARIATIONS)] ---");
console.log("Pair 1 (Operating Complement)  Ch3 Summary:", sp1?.chapters[2].summary);
console.log("Pair 2 (Dual Planner Tension)  Ch3 Summary:", sp2?.chapters[2].summary);
console.log("Pair 3 (Career Overload Risk)  Ch6 Summary:", sp3?.chapters[5].summary);

const ch3Distinct = sp1?.chapters[2].summary !== sp2?.chapters[2].summary;
console.log("Chapter Summaries Distinct across Pairs?   :", ch3Distinct ? "YES" : "NO");

console.log("\n--- [3. HOUSEHOLD OS OWNERSHIP MAPPING CHECK] ---");
const c3PMOwner = sp1?.chapters[2].primaryOwnerMeanings.includes("Household PM / Mental Load");
const c5CrisisOwner = sp1?.chapters[4].primaryOwnerMeanings.includes("Crisis Role");
const c6CareerOwner = sp1?.chapters[5].primaryOwnerMeanings.includes("Career x Home Balance");
const c7CompoundingOwner = sp1?.chapters[6].primaryOwnerMeanings.includes("Long-Term Compounding (Assets & Liabilities)");
const c8VerdictOwner = sp1?.chapters[7].primaryOwnerMeanings.includes("Life Partnership Verdict Scores & Narrative");

console.log("Ch 03 Household PM Owner Clean?    :", c3PMOwner ? "PASS" : "FAIL");
console.log("Ch 05 Crisis Role Owner Clean?     :", c5CrisisOwner ? "PASS" : "FAIL");
console.log("Ch 06 Career x Home Owner Clean?   :", c6CareerOwner ? "PASS" : "FAIL");
console.log("Ch 07 Compounding Owner Clean?     :", c7CompoundingOwner ? "PASS" : "FAIL");
console.log("Ch 08 Verdict Owner Clean?         :", c8VerdictOwner ? "PASS" : "FAIL");

const allOwnersClean = Boolean(c3PMOwner && c5CrisisOwner && c6CareerOwner && c7CompoundingOwner && c8VerdictOwner);

console.log("\n--- [4. LEGACY CONTENT PRESERVATION MAP CHECK] ---");
console.log("Legacy References Tracked Count    :", sp1?.legacyContentReferences.length);
const allLegacyRemapped = sp1?.legacyContentReferences.every((r) => r.status === "REMAP" || r.status === "KEEP");
console.log("All Legacy Sections Preserved/Remapped?:", allLegacyRemapped ? "PASS" : "FAIL");

console.log("\n--- [5. CONTRADICTION RESOLUTION & PLACEHOLDERS CHECK] ---");
console.log("Contradiction Resolutions Tracked  :", sp1?.contradictionResolutions.length);
console.log("Romantic Reference Placeholders    :", Object.keys(sp1?.placeholders || {}).length);

console.log("\n==================================================");
console.log(" FINAL PHASE 3 VERDICTS");
console.log("==================================================");
console.log("MARRIAGE STORYPLAN               :", (sp1 && sp2 && sp3) ? "READY" : "NOT READY");
console.log("LEGACY CONTENT PRESERVATION      :", allLegacyRemapped ? "PASS" : "FAIL");
console.log("CHAPTER OWNERSHIP                :", allOwnersClean ? "CLEAN" : "OVERLAPPING");
console.log("DUPLICATION CONTROL              :", ch3Distinct ? "READY" : "NOT READY");
