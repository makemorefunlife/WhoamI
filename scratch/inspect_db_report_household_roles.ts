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

  console.log("Full DB data keys:", Object.keys(data));
  console.log("result_basic:", JSON.stringify(data.result_basic, null, 2));
  console.log("result_premium_by_kind:", JSON.stringify(data.result_premium_by_kind, null, 2));
}

inspectReport();
