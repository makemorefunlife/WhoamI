import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";
import { buildPart01IdentityEvidencePacketFromBundle } from "@/lib/v1/slim/part01IdentityEvidence";
import { getDeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";

const bundleRaw = calculateSajuBundle({
  birthDate: "1994-05-18",
  birthTime: "08:30",
});

const sampleRadarCurrent: PrimaryAxesScores = {
  structure: 78,    // High Structure
  autonomy: 32,     // Low Autonomy (Relative)
  connection: 65,
  stability: 70,
  growth: 55,
  adaptability: 45,
};

const sampleRadarInnate: PrimaryAxesScores = {
  structure: 45,
  autonomy: 75,
  connection: 60,
  stability: 70,
  growth: 50,
  adaptability: 40,
};

const evidencePacket = buildPart01IdentityEvidencePacketFromBundle({
  reportId: "sample-report-id",
  birthDate: "1994-05-18",
  birthTime: "08:30",
  birthTimeUnknown: false,
  bundle: bundleRaw as any,
  currentPrimary: sampleRadarCurrent,
  currentSecondary: {} as any,
  innatePrimary: sampleRadarInnate,
});

const t = getDeepEssenceUiStrings("ko-KR");

console.log("1. [사주 및 축 계산 원천 데이터]");
console.log(`- 사주 일주: ${bundleRaw.saju.dayPillar}`);
console.log(`- 결정론적 돋보이는 축 (Highest): 체계성 (78점)`);
console.log(`- 결정론적 유연한 축 (Lowest): 자율성 (32점)`);
console.log(`- 선택된 Gap 축: 체계성, 자율성`);
console.log(`- 선택된 Alignment 축: 안정지향성\n`);

console.log("-----------------------------------------------------------------");
console.log("2. [PART 01: 지금의 당신 (그래프 & 극단 축 행동 번역)]");
console.log("-----------------------------------------------------------------");
console.log(`[Card 1] 체계성 | 배지: ${t.part1.highestTag}`);
console.log(`- 행동 번역: "${t.axisBehaviorSentences.structure.high}"`);
console.log(`- 정의: "${t.axisInterpretation.glossary.structure}"\n`);

console.log(`[Card 2] 자율성 | 배지: ${t.part1.lowestTag}`);
console.log(`- 행동 번역: "${t.axisBehaviorSentences.autonomy.low}"`);
console.log(`- 정의: "${t.axisInterpretation.glossary.autonomy}"\n`);

console.log("-----------------------------------------------------------------");
console.log("3. [PART 02: 살아오면서, 나는 어떻게 달라졌을까요? (차이 & 정렬)]");
console.log("-----------------------------------------------------------------");
console.log(`[헤더 1] ◤ ${t.axisInterpretation.gapSectionTitle} (Bold)`);
console.log(`- 부연: "현재 살아가는 방식과 본래 성향의 차이가 가장 크게 드러난 영역이에요."\n`);

console.log(`  ▶ ◤ 체계성 (Gap Axis 1)`);
console.log(`    ▫ 본래 더 편한 방식: 사주 오행상 계획과 절차가 정해져 있을 때 비로소 편안함을 느끼는 성향입니다.`);
console.log(`    ▫ 현실에서 익숙해진 방식: 실제 삶에서는 돌발 변수에 맞춰 유연하게 조정하는 방식을 훈련해왔습니다.`);
console.log(`    ▫ 살아오며 생긴 힘 (Acquired Capability): 불확실한 상황에서도 직접 기준과 순서를 세우고 체계적으로 일의 흐름을 정리하는 능력이 발달했습니다.`);
console.log(`    ▫ 그만큼 드는 에너지 (Sustained Adaptation Cost): 모든 상황이 완벽히 정리되어야 움직일 수 있다고 느낄 때 검토 과정에 필요 이상의 에너지를 지속적으로 쓰게 됩니다.\n`);

console.log(`[헤더 2] ◤ ${t.axisInterpretation.alignmentSectionTitle} (Bold)`);
console.log(`- 부연: "따로 애쓰지 않아도 본래 성향대로 자연스럽게 합이 맞는 영역이에요."\n`);

console.log(`  ▶ ◤ 안정지향성 (Alignment Axis)`);
console.log(`    ▫ 본래 더 편한 방식: 익숙하고 예측 가능한 환경에서 편안함을 느낍니다.`);
console.log(`    ▫ 지금도 자연스럽게 쓰는 방식: 일상에서 안정적인 루틴과 기반을 지키는 방식을 꾸준히 유지하고 있습니다.`);
console.log(`    ▫ 그래서 힘을 덜 들이고 잘 쓰는 부분: 특별히 애쓰지 않아도 자신만의 중심을 잃지 않고 차분함을 유지하는 힘이 잘 발휘됩니다.\n`);

console.log("-----------------------------------------------------------------");
console.log("4. [PART 04: 에너지를 채워주는 것 / 빼앗는 것 (디자인 반영)]");
console.log("-----------------------------------------------------------------");
console.log(`◤ ${t.part2.fuels}`);
console.log(`  ▫ 자율적으로 의견을 표현할 수 있는 대화`);
console.log(`  ▫ 명확한 목표가 있는 팀 프로젝트`);
console.log(`  ▫ 혼자만의 시간을 가지며 생각을 정리하는 것\n`);

console.log(`◤ ${t.part2.drains}`);
console.log(`  ▫ 여러 사람의 기대를 동시에 맞춰야 하는 상황`);
console.log(`  ▫ 불확실한 상황에서 결정을 내리기 어려운 경우`);
console.log(`  ▫ 타인의 반응을 계속 확인해야 할 때\n`);

console.log("-----------------------------------------------------------------");
console.log("5. [PART 06: 행동 가이드라인 (✓ DO / ✕ DON'T)]");
console.log("-----------------------------------------------------------------");
console.log(`[✓ DO] ${t.part5.doTitle}`);
console.log(`  01 명확한 규칙과 절차를 정리하기`);
console.log(`     작업 수순과 핵심 규칙을 사전에 명확히 정리하여 구조적 예측 가능성을 우선 확보하는 것이 중요해요.\n`);
console.log(`  02 내 핵심 가치 점검하기`);
console.log(`     판단 결과를 행동으로 옮기기 전에 내 핵심 가치와 일치하는지 점검하는 시간을 가져보세요.\n`);

console.log(`[✕ DON'T] ${t.part5.dontTitle}`);
console.log(`  01 완벽한 제어가 될 때까지 주저하기`);
console.log(`     모든 예외 변수가 통제되어야만 움직일 수 있는 것은 아닙니다.\n`);

console.log("-----------------------------------------------------------------");
console.log("6. [PART 06: 맺음말 (Closing Statement)]");
console.log("-----------------------------------------------------------------");
console.log(`"상황을 체계적으로 정리하는 원칙은 유용한 힘이 됩니다. 완벽한 기준을 기다리기보다 가볍게 첫발을 내딛어 보세요."\n`);
console.log("=================================================================");
