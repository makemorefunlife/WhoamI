/**
 * Phase 0 검증 스크립트 — 조후 moisture_band, 신강/신약, 희용신 SSOT wiring 확인.
 * 읽기 전용, 코드 수정 없음. 실행: npx tsx tests/scripts/verify-phase0-strength-johu.mjs
 */
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { buildChartContext } from "../../lib/saju/chartContext.ts";
import { mapSajuBundleToMasterJson } from "../../lib/personCore/mappers/mapSajuMasterJson.ts";
import {
  estimateStrengthBalance as estimateFromChart,
  estimateYongsinGisin as estimateYongsinFromChart,
} from "../../lib/saju/strengthBalance.ts";
import {
  estimateStrengthBalance as estimateFromPillars,
  estimateYongsinGisin as estimateYongsinFromPillars,
} from "../../lib/saju/romanticSajuDerivations.ts";

const bundle = calculateSajuBundle({ birthDate: "1990-05-15", birthTime: "14:30" });
const master = mapSajuBundleToMasterJson({
  bundle,
  birthDate: "1990-05-15",
  birthTime: "14:30",
  birthTimeUnknown: false,
});

console.log("=== mapSajuMasterJson output fields ===");
console.log("johu_climate:", JSON.stringify(master.johu_climate));
console.log("strength_balance:", JSON.stringify(master.strength_balance));
console.log("yongsin_estimate:", JSON.stringify(master.yongsin_estimate));

console.log("\n=== SajuPillars-wrapper vs ChartContext-direct parity ===");
const pillars = bundle.saju;
const chart = buildChartContext(pillars);

const a1 = estimateFromPillars(pillars);
const a2 = estimateFromChart(chart);
console.log("estimateStrengthBalance equal:", JSON.stringify(a1) === JSON.stringify(a2), a1, a2);

const b1 = estimateYongsinFromPillars(pillars);
const b2 = estimateYongsinFromChart(chart);
console.log("estimateYongsinGisin equal:", JSON.stringify(b1) === JSON.stringify(b2), b1, b2);
