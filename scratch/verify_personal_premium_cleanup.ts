import fs from "node:fs";

console.log("=== PERSONAL PREMIUM PART 01-03 CLEANUP VERIFICATION ===");

// 1. Verify DeepEssencePartHeader
const headerCode = fs.readFileSync("C:/dev/WhoamI/components/results/deep/DeepEssencePartHeader.tsx", "utf-8");
const hasOptionalLabel = headerCode.includes("label?: string");
const hasNoSubtitleRender = !headerCode.includes("{subtitle ?");
console.log("1. PartHeader simplified hierarchy:", hasOptionalLabel && hasNoSubtitleRender ? "PASSED" : "FAILED");

// 2. Verify summaryLabels in deepEssenceUiStrings
const stringsCode = fs.readFileSync("C:/dev/WhoamI/components/results/deep/deepEssenceUiStrings.ts", "utf-8");
const hasHumanCoreMode = stringsCode.includes("지금 나를 움직이는 방식");
const hasHumanEnergy = stringsCode.includes("관계 소모 / 자기 회복 비율");
const hasHumanGrowth = stringsCode.includes("지금 더 키워갈 힘");
const hasPart3Title = stringsCode.includes("살아오면서, 나는 어떻게 달라졌을까요?");
const hasGlossaryTitle = stringsCode.includes("여섯 가지 기준은 무엇을 의미하나요?");
console.log("2. Part 01 Summary & Part 03 Titles:", (hasHumanCoreMode && hasHumanEnergy && hasHumanGrowth && hasPart3Title && hasGlossaryTitle) ? "PASSED" : "FAILED");

// 3. Verify Radar Chart ViewBox
const radarCode = fs.readFileSync("C:/dev/WhoamI/components/results/deep/DeepEssenceRadarChart.tsx", "utf-8");
const hasViewBoxFix = radarCode.includes('viewBox="-38 -16 396 352"');
console.log("3. Radar Chart viewBox clipping fix:", hasViewBoxFix ? "PASSED" : "FAILED");

// 4. Verify Part 03 High-Gap intro & micro-label removal & toggle affordance
const axisCode = fs.readFileSync("C:/dev/WhoamI/components/results/deep/DeepEssenceAxisInterpretation.tsx", "utf-8");
const part1Code = fs.readFileSync("C:/dev/WhoamI/components/results/deep/DeepEssencePartOne.tsx", "utf-8");
const hasGapIntro = axisCode.includes("현재 살아가는 방식과 본래 성향의 차이가 가장 크게 드러난 영역이에요.");
const hasNoGapTag = !axisCode.includes("{t.gapSectionTag}");
const hasNoAlignmentTag = !axisCode.includes("{t.alignmentSectionTag}");
const hasNoGlossaryTag = !axisCode.includes("{t.glossaryTag}");
const hasToggleAffordance = part1Code.includes("열어보기 ↓") && part1Code.includes("접기 ↑");
console.log("4. Part 03 High-Gap clarity & micro-label removal:", (hasGapIntro && hasNoGapTag && hasNoAlignmentTag && hasNoGlossaryTag && hasToggleAffordance) ? "PASSED" : "FAILED");

// 5. Verify Saju Terminology Leak Prevention
const forbiddenSajuTerms = ["도화살", "현침살", "십성", "지지", "천간", "사주팔자"];
let forbiddenFound = 0;
for (const term of forbiddenSajuTerms) {
  if (stringsCode.includes(term) || axisCode.includes(term)) {
    console.error(`Forbidden Saju term found: ${term}`);
    forbiddenFound++;
  }
}
console.log("5. Forbidden Saju term leakage check:", forbiddenFound === 0 ? "PASSED (0 terms found)" : "FAILED");
