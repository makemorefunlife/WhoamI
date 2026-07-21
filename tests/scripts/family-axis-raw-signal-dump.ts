/**
 * family-axis-distribution-diagnosis.ts의 후속 — bucket 이전 "원본 수치"를
 * 그대로 찍는다. origin_family_distance/gathering_temperature가 실측에서
 * 100% 한 bucket으로 몰린 이유(threshold 미스캘리브레이션 vs 실제로 드문 패턴)를
 * 가려내기 위한 진단용. 읽기 전용, DB에 아무것도 안 씀, 코드 수정 없음.
 *
 * 실행 (DB 접근 가능한 환경에서):
 *   npx tsx tests/scripts/family-axis-raw-signal-dump.ts [limit]
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createServerSupabaseClient } from "@/lib/supabase/serverClient";
import { loadPerson } from "@/lib/personCore/services/loadPerson";
import { rehydrateSajuDataForIntegrated } from "@/lib/personCore/adapters/rehydrateSajuFromPersonCore";
import { countTenGodsForMarriage } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { buildChartContext } from "@/lib/saju/chartContext";
import { resolveOriginFamilyTension } from "@/lib/personCore/sajuSignals/sharedPersonaSignals";

async function main() {
  const limit = Number(process.argv[2] ?? 300);

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    console.error("Supabase 설정을 찾을 수 없습니다.");
    process.exit(1);
  }

  const { data: pairs, error } = await supabase
    .from("relationship_reports")
    .select("id, report_id_a, report_id_b")
    .eq("relationship_kind", "family")
    .limit(limit);

  if (error) {
    console.error("조회 실패:", error.message);
    process.exit(1);
  }
  if (!pairs || pairs.length === 0) {
    console.log("family 관계 데이터 없음");
    return;
  }

  const reportIds = new Set<string>();
  for (const row of pairs) {
    reportIds.add(row.report_id_a as string);
    reportIds.add(row.report_id_b as string);
  }

  console.log(`대상 report_id: ${reportIds.size}명 (family 쌍 ${pairs.length}개에서 추출)\n`);
  console.log("=".repeat(100));
  console.log(
    "id".padEnd(10),
    "tensionIdx".padEnd(11),
    "needsDist".padEnd(10),
    "yearTension".padEnd(12),
    "hasHyoshin".padEnd(11),
    "sealExcess".padEnd(11),
    "heat".padEnd(6),
    "moist".padEnd(6),
    "tempBand",
  );
  console.log("=".repeat(100));

  let count = 0;
  const tensionIdxValues: number[] = [];
  const heatValues: number[] = [];
  const moistValues: number[] = [];
  let yearTensionTrueCount = 0;
  let needsDistTrueCount = 0;

  for (const reportId of reportIds) {
    const blueprint = await loadPerson(reportId);
    if (!blueprint) continue;

    const sajuJson = rehydrateSajuDataForIntegrated(blueprint.saju_master_json);
    const counts = countTenGodsForMarriage(sajuJson);
    const chart = buildChartContext(sajuJson.saju);
    const tension = resolveOriginFamilyTension(counts, chart);
    const johu = blueprint.saju_master_json.johu_climate;

    count++;
    tensionIdxValues.push(tension.tensionIndex);
    heatValues.push(johu.heat_score);
    moistValues.push(johu.moisture_score);
    if (tension.yearPalaceTension) yearTensionTrueCount++;
    if (tension.needsStrongBoundary) needsDistTrueCount++;

    console.log(
      reportId.slice(0, 8).padEnd(10),
      String(tension.tensionIndex).padEnd(11),
      String(tension.needsStrongBoundary).padEnd(10),
      String(tension.yearPalaceTension).padEnd(12),
      String(tension.hyoshinRisk).padEnd(11),
      String(tension.sealExcess).padEnd(11),
      String(johu.heat_score).padEnd(6),
      String(johu.moisture_score).padEnd(6),
      johu.temperature_band,
    );
  }

  console.log("\n" + "=".repeat(100));
  console.log(`총 ${count}명 분석\n`);

  const avg = (arr: number[]) => (arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : "N/A");
  const minMax = (arr: number[]) => (arr.length ? `${Math.min(...arr)}~${Math.max(...arr)}` : "N/A");

  console.log("[origin_family_distance 관련]");
  console.log(`  tensionIndex 평균: ${avg(tensionIdxValues)}, 범위: ${minMax(tensionIdxValues)} (threshold=55)`);
  console.log(`  yearPalaceTension=true인 사람: ${yearTensionTrueCount}/${count}`);
  console.log(`  needsStrongBoundary=true인 사람: ${needsDistTrueCount}/${count}`);
  console.log(
    count > 0 && needsDistTrueCount === 0
      ? "  → 전원 false. tensionIndex 범위와 yearPalaceTension 발생 빈도를 보고 threshold(55)가 너무 높은지, yearPalaceTension 탐지(형충 조건)가 너무 좁은지 판단 필요."
      : "",
  );

  console.log("\n[gathering_temperature 관련]");
  console.log(`  heat_score 평균: ${avg(heatValues)}, 범위: ${minMax(heatValues)}`);
  console.log(`  moisture_score 평균: ${avg(moistValues)}, 범위: ${minMax(moistValues)}`);
  console.log("  → heat_score 분포가 넓은데 temperature_band가 전부 'hot'이면 band 경계값이 낮게 잡힌 것.");
  console.log("     반대로 heat_score 자체가 좁은 범위에 몰려 있으면 johu 계산식 쪽 문제.");

  console.log("\n완료.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
