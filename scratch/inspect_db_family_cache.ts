import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectReport() {
  const { data, error } = await supabase
    .from("relationship_reports")
    .select("*")
    .eq("id", "2e96c631-791b-4f89-bfd6-5a44f7b344cb")
    .single();

  if (error) {
    console.error("Error fetching report:", error);
    return;
  }

  const byKind = data.result_premium_by_kind || {};
  const famKoReport = byKind.family?.byLocale?.["ko-KR"]?.report;
  if (famKoReport) {
    console.log("famKoReport keys:", Object.keys(famKoReport));
    console.log("famKoReport.family keys:", famKoReport.family ? Object.keys(famKoReport.family) : "no family");
    if (famKoReport.family) {
      console.log("section_household_roles:", JSON.stringify(famKoReport.family.section_household_roles, null, 2));
    }
  }
}

inspectReport();
