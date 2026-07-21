/**
 * Family 6축 비교표 — 실제 유저 데이터 기반 bucket 분포/충돌률 진단.
 *
 * 배경: "A/B 결과가 똑같이 나온다"는 문제 제보. 가설 4가지를 실측으로 검증한다.
 *   1) bucket이 성겨서(5-way/3-way/2-way argmax) 서로 다른 사람도 같은 칸에 몰린다
 *   2) ①④⑤ 축이 profileTenGods(십신 5범주) 같은 입력공간을 공유해서 동시에 무너진다
 *   3) (참고) marriage resolveMannerArchetype처럼 특정 bucket으로 쏠리는 구현 버그가 있는지
 *   4) mother/father Role Lens가 실제로 캐시된 리포트에 반영돼 있는지
 *
 * **읽기 전용** — DB에 아무것도 쓰지 않는다. 코드도 수정하지 않는다.
 *
 * 실행 (Supabase 접근 가능한 로컬/배포 환경에서, 이 샌드박스에서는 DNS가
 * 안 열려 실행 불가 — .env.local에 SUPABASE 서비스키가 있는 환경에서 돌릴 것):
 *
 *   npx tsx tests/scripts/family-axis-distribution-diagnosis.ts [limit]
 *
 * limit 생략 시 300쌍.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createServerSupabaseClient } from "@/lib/supabase/serverClient";
import { loadPerson } from "@/lib/personCore/services/loadPerson";
import { rehydrateSajuDataForIntegrated } from "@/lib/personCore/adapters/rehydrateSajuFromPersonCore";
import {
  countTenGodsForMarriage,
  type TenGodCounts,
} from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { buildChartContext, type ChartContext } from "@/lib/saju/chartContext";
import type { FriendshipSajuSignals } from "@/lib/personCore/sajuSignals/types";
import {
  resolveNaggingReactionBucket,
  resolveOriginFamilyDistanceBucket,
  resolveAffectionExpressionBucket,
  resolveCareBalanceBucket,
  resolveGatheringRecoveryBucket,
  resolveGatheringTemperatureBucket,
} from "@/lib/relationship/familyParent/familySajuCompareTable";

type AxisId =
  | "nagging_reaction"
  | "origin_family_distance"
  | "affection_expression"
  | "care_balance"
  | "gathering_recovery"
  | "gathering_temperature";

const AXIS_IDS: AxisId[] = [
  "nagging_reaction",
  "origin_family_distance",
  "affection_expression",
  "care_balance",
  "gathering_recovery",
  "gathering_temperature",
];

type PersonInputs = {
  counts: TenGodCounts;
  chart: ChartContext;
  friendshipSignals: FriendshipSajuSignals | undefined;
};

function bucketFor(axis: AxisId, p: PersonInputs): string {
  switch (axis) {
    case "nagging_reaction":
      return resolveNaggingReactionBucket(p.counts).bucket;
    case "origin_family_distance":
      return resolveOriginFamilyDistanceBucket(p.counts, p.chart).bucket;
    case "affection_expression":
      return resolveAffectionExpressionBucket(p.chart).bucket;
    case "care_balance":
      return resolveCareBalanceBucket(p.counts).bucket;
    case "gathering_recovery":
      return resolveGatheringRecoveryBucket(p.chart).bucket;
    case "gathering_temperature":
      return resolveGatheringTemperatureBucket(p.friendshipSignals).bucket;
  }
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function extractParentRole(slot: unknown): string | null {
  if (!slot || typeof slot !== "object") return null;
  const s = slot as Record<string, unknown>;
  // 신규 shape: byLocale["ko-KR"|"en-US"].report.meta.parent_role
  const byLocale = s.byLocale as Record<string, unknown> | undefined;
  if (byLocale) {
    for (const loc of ["ko-KR", "en-US"]) {
      const payload = byLocale[loc] as Record<string, unknown> | undefined;
      const role = (payload?.report as Record<string, unknown> | undefined)
        ?.meta as Record<string, unknown> | undefined;
      if (typeof role?.parent_role === "string") return role.parent_role;
    }
  }
  // 레거시 flat shape: report.meta.parent_role
  const report = s.report as Record<string, unknown> | undefined;
  const meta = report?.meta as Record<string, unknown> | undefined;
  if (typeof meta?.parent_role === "string") return meta.parent_role;
  return null;
}

async function main() {
  const limit = Number(process.argv[2] ?? 300);

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    console.error("Supabase 설정을 찾을 수 없습니다. .env.local의 SUPABASE 서비스키를 확인하세요.");
    process.exit(1);
  }

  const { data: pairs, error } = await supabase
    .from("relationship_reports")
    .select("id, report_id_a, report_id_b, result_premium_by_kind")
    .eq("relationship_kind", "family")
    .limit(limit);

  if (error) {
    console.error("relationship_reports 조회 실패:", error.message);
    process.exit(1);
  }
  if (!pairs || pairs.length === 0) {
    console.log("relationship_kind='family' 인 행이 없습니다.");
    return;
  }

  console.log(`조회된 family 관계 쌍: ${pairs.length}개 (limit=${limit})\n`);

  const personCache = new Map<string, PersonInputs | null>();
  async function getPersonInputs(reportId: string): Promise<PersonInputs | null> {
    if (personCache.has(reportId)) return personCache.get(reportId)!;
    const blueprint = await loadPerson(reportId);
    if (!blueprint) {
      personCache.set(reportId, null);
      return null;
    }
    const sajuJson = rehydrateSajuDataForIntegrated(blueprint.saju_master_json);
    const inputs: PersonInputs = {
      counts: countTenGodsForMarriage(sajuJson),
      chart: buildChartContext(sajuJson.saju),
      friendshipSignals: blueprint.saju_master_json.domain_signals.friendship_signals,
    };
    personCache.set(reportId, inputs);
    return inputs;
  }

  const bucketHistograms: Record<AxisId, Map<string, number>> = Object.fromEntries(
    AXIS_IDS.map((a) => [a, new Map<string, number>()]),
  ) as Record<AxisId, Map<string, number>>;
  const sameCounts: Record<AxisId, number> = Object.fromEntries(
    AXIS_IDS.map((a) => [a, 0]),
  ) as Record<AxisId, number>;

  let totalPairs = 0;
  let skippedPairs = 0;
  const sameCountDistribution = new Map<number, number>();
  const roleCounts = new Map<string, number>();
  let pairsWithKnownRole = 0;

  for (const row of pairs) {
    const [a, b] = await Promise.all([
      getPersonInputs(row.report_id_a as string),
      getPersonInputs(row.report_id_b as string),
    ]);
    if (!a || !b) {
      skippedPairs++;
      continue;
    }

    totalPairs++;
    let sameThisPair = 0;
    for (const axis of AXIS_IDS) {
      const bucketA = bucketFor(axis, a);
      const bucketB = bucketFor(axis, b);
      bump(bucketHistograms[axis], bucketA);
      bump(bucketHistograms[axis], bucketB);
      if (bucketA === bucketB) {
        sameCounts[axis]++;
        sameThisPair++;
      }
    }
    sameCountDistribution.set(sameThisPair, (sameCountDistribution.get(sameThisPair) ?? 0) + 1);

    const role = extractParentRole(row.result_premium_by_kind ? (row.result_premium_by_kind as Record<string, unknown>).family : undefined);
    if (role) {
      pairsWithKnownRole++;
      bump(roleCounts, role);
    }
  }

  if (totalPairs === 0) {
    console.log("유효한 PersonCore 블루프린트를 가진 쌍이 없습니다(스키마 버전 불일치 또는 미생성).");
    console.log(`스킵된 쌍: ${skippedPairs}`);
    return;
  }

  console.log(`분석 대상 쌍: ${totalPairs}개 (스킵: ${skippedPairs}개, PersonCore 블루프린트 없음/스키마 불일치)\n`);
  console.log("=".repeat(70));
  console.log("1) 축별 bucket 분포(개인 단위, N=" + totalPairs * 2 + ") + pair 기준 '같음' 비율");
  console.log("=".repeat(70));
  for (const axis of AXIS_IDS) {
    const hist = bucketHistograms[axis];
    const total = totalPairs * 2;
    const sorted = [...hist.entries()].sort((x, y) => y[1] - x[1]);
    console.log(`\n[${axis}]`);
    for (const [bucket, count] of sorted) {
      const pct = ((count / total) * 100).toFixed(1);
      console.log(`  ${bucket.padEnd(20)} ${count.toString().padStart(5)}명 (${pct}%)`);
    }
    const samePct = ((sameCounts[axis] / totalPairs) * 100).toFixed(1);
    console.log(`  → pair 기준 "같음": ${sameCounts[axis]}/${totalPairs}쌍 (${samePct}%)`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("2) 교차 축 동시성 — 한 쌍에서 6축 중 몇 개가 동시에 '같음'으로 나왔는가");
  console.log("=".repeat(70));
  console.log("(①④⑤가 같은 입력공간을 공유한다는 가설이 맞다면, 분포가 0~1개/4~6개 쪽으로");
  console.log(" 쏠리는 bimodal 형태를 보일 것이고, 무관하다면 매끄러운 종형에 가까울 것)\n");
  for (const [n, c] of [...sameCountDistribution.entries()].sort((x, y) => x[0] - y[0])) {
    const pct = ((c / totalPairs) * 100).toFixed(1);
    console.log(`  ${n}/6개 축 일치: ${c}쌍 (${pct}%)`);
  }
  const allSame = sameCountDistribution.get(6) ?? 0;
  console.log(`\n  → 6축 전부 "같음"으로 나온 쌍(제보하신 증상 그대로): ${allSame}/${totalPairs}쌍 (${((allSame / totalPairs) * 100).toFixed(1)}%)`);

  console.log("\n" + "=".repeat(70));
  console.log("3) Role Lens 반영 현황 (참고용 — ②④는 이미 mother/father 분기 구현됨)");
  console.log("=".repeat(70));
  console.log(`  parent_role을 알 수 있는 캐시된 리포트: ${pairsWithKnownRole}/${totalPairs}쌍`);
  for (const [role, count] of roleCounts.entries()) {
    console.log(`    ${role}: ${count}쌍`);
  }
  if (pairsWithKnownRole === 0) {
    console.log("  (family 프리미엄 리포트가 캐시된 쌍이 없거나 meta.parent_role을 못 읽음)");
  }
  console.log(
    "  주의: 이 값은 캐시에 저장된 '과거 계산 결과'의 role일 뿐, 이번 diagnosis가 재계산한",
  );
  console.log(
    "  bucket(1·2번 섹션)과는 무관합니다 — 캐시가 Role Lens 적용 이전 결과일 수 있습니다.",
  );

  console.log("\n완료.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
