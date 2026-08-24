import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { buildFamilyReportViewModel } from "@/lib/relationship/familyParent/viewModel/buildFamilyReportViewModel";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from("relationship_reports")
    .select("result_premium_by_kind")
    .eq("id", "2e96c631-791b-4f89-bfd6-5a44f7b344cb")
    .single();

  if (error || !data) {
    console.error("Report not found:", error);
    return;
  }

  const byKind = data.result_premium_by_kind || {};
  const report = (byKind.family?.byLocale?.["ko-KR"]?.report || byKind.byLocale?.["ko-KR"]?.report) as FamilyParentReportBody;
  console.log("Report meta:", {
    nickname_a: report.meta?.nickname_a,
    nickname_b: report.meta?.nickname_b,
    roles: report.family?.section_roles,
  });
  const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
  const ch5 = vm.editorialChapters.find((c) => c.id === "ch_conflict");

  console.log("=== CHAPTER 05 VIEW MODEL ===");
  console.log("Title:", ch5?.title);
  console.log("Subtitle:", ch5?.subtitle);
  console.log("Summary:", ch5?.summary);
  console.log("Legacy Sections Count:", ch5?.legacySections?.length);
  console.log("Actions Count:", ch5?.actions?.length);

  const bundle = vm.storyPlan?.conflictChapterBundle;
  console.log("\n=== CONFLICT CHAPTER BUNDLE ===");
  console.log(JSON.stringify(bundle, null, 2));

  const ch7 = vm.editorialChapters.find((c) => c.id === "ch_repair");
  console.log("\n=== CHAPTER 07 LEGACY SECTIONS (STAGED RECOVERY) ===");
  console.log(ch7?.legacySections.map((s) => s.id));
}

main().catch(console.error);
