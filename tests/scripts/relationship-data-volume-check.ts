/**
 * 지금 DB에 실제 데이터가 얼마나 있는지 확인하는 카운트 스크립트.
 * family 표본이 너무 적어서(3쌍) 이게 DB 전체인지 아니면 더 있는데
 * 걸러진 건지 확인하기 위한 용도. 읽기 전용, DB에 아무것도 안 씀.
 *
 * 실행:
 *   npx tsx tests/scripts/relationship-data-volume-check.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createServerSupabaseClient } from "@/lib/supabase/serverClient";

async function main() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    console.error("Supabase 설정을 찾을 수 없습니다.");
    process.exit(1);
  }

  console.log("=== relationship_reports: relationship_kind별 개수 ===");
  const { data: rows, error: e1 } = await supabase
    .from("relationship_reports")
    .select("relationship_kind");
  if (e1) {
    console.error("조회 실패:", e1.message);
  } else {
    const byKind = new Map<string, number>();
    for (const r of rows ?? []) {
      const k = (r as { relationship_kind: string }).relationship_kind ?? "(null)";
      byKind.set(k, (byKind.get(k) ?? 0) + 1);
    }
    for (const [k, c] of byKind.entries()) {
      console.log(`  ${k}: ${c}개`);
    }
    console.log(`  총 relationship_reports 행: ${rows?.length ?? 0}개`);
  }

  console.log("\n=== person_core_blueprints 총 개수 ===");
  const { count, error: e2 } = await supabase
    .from("person_core_blueprints")
    .select("*", { count: "exact", head: true });
  if (e2) {
    console.error("조회 실패:", e2.message);
  } else {
    console.log(`  person_core_blueprints: ${count ?? 0}개`);
  }

  console.log("\n=== reports(개인 리포트) 총 개수 ===");
  const { count: reportsCount, error: e3 } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true });
  if (e3) {
    console.error("조회 실패:", e3.message);
  } else {
    console.log(`  reports: ${reportsCount ?? 0}개`);
  }

  console.log("\n완료.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
