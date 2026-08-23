import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const reportIdA = "51e60cca-8596-4634-87e7-ca3b6468b14c";
  const reportIdB = "6228187e-40c0-454b-bbca-ede9ec8e7836";

  const { data: bpA } = await supabase.from("person_core_blueprints").select("*").eq("report_id", reportIdA).single();
  const { data: bpB } = await supabase.from("person_core_blueprints").select("*").eq("report_id", reportIdB).single();

  console.log("=== Person A (Sera) psych_master_json ===");
  console.log(JSON.stringify(bpA.psych_master_json, null, 2));

  console.log("\n=== Person B (동글) psych_master_json ===");
  console.log(JSON.stringify(bpB.psych_master_json, null, 2));
}

run();
