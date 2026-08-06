/**
 * 심화 파이프라인 실패 케이스 → 사용자 표시 매핑 (QA 참고용, API 호출 없음)
 *
 * node scripts/verify-premium-failure-matrix.mjs
 */
import { readFileSync } from "fs";

const failureFile = readFileSync(
  new URL("../../lib/report/premiumPipelineFailure.ts", import.meta.url),
  "utf8",
);

const rows = [
  ["설문 일부 누락", "warnings: survey_incomplete", "통합 성공 시 상단 경고 배너", "차단 안 함"],
  ["관계 데이터 없음", "relationship_empty", "정상 진행 (관계 없이 통합)", "—"],
  ["astrology 실패", "warnings: astrology_*", "정상 진행 (사주+설문만)", "—"],
  ["saju timeout", "failure: saju_timeout", "PremiumReportErrorPanel + 다시 시도", "파이프라인 중단"],
  ["saju 500", "failure: saju_failed", "PremiumReportErrorPanel + 다시 시도", "파이프라인 중단"],
  ["integrated empty", "failure: integrated_empty", "에러 패널 + 다시 시도/재생성", "—"],
  ["integrated too short", "failure: integrated_too_short", "에러 패널", "< 600자"],
  ["DB 저장 실패", "failure: persist_failed", "본문 표시 + 저장 실패 경고", "sessionStorage 유지"],
  ["LLM HTTP 실패", "failure: integrated_llm_failed", "에러 패널", "—"],
  ["캐시 hit", "meta_cache_hit", "즉시 UnifiedReportMarkdown", "regenerate 없을 때"],
  ["재생성", "regenerateIntegrated=1", "DB 삭제 후 전체 파이프라인", "URL 플래그"],
];

console.log("\n=== Premium failure → UX matrix ===\n");
for (const [scenario, code, ux, note] of rows) {
  console.log(`• ${scenario}`);
  console.log(`  code: ${code}`);
  console.log(`  UX: ${ux}`);
  if (note !== "—") console.log(`  note: ${note}`);
  console.log("");
}

console.log("메시지 정의: lib/report/premiumPipelineFailure.ts");
console.log(`  (${failureFile.split("\n").filter((l) => l.includes("MESSAGES")).length} export)\n`);
