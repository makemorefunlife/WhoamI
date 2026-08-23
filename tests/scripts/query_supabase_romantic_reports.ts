import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join("=").trim();
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url!, serviceKey!);

async function check() {
  const reportIdA = "51e60cca-8596-4634-87e7-ca3b6468b14c";
  const reportIdB = "6228187e-40c0-454b-bbca-ede9ec8e7836";

  console.log("=== CHECKING BLUEPRINTS FOR REAL DB COUPLE ===");
  const { data: bpA } = await supabase.from("person_core_blueprints").select("*").eq("report_id", reportIdA).maybeSingle();
  const { data: bpB } = await supabase.from("person_core_blueprints").select("*").eq("report_id", reportIdB).maybeSingle();

  console.log(`Blueprint A (${reportIdA}):`, bpA ? "EXISTS" : "NOT FOUND");
  if (bpA) {
    console.log("  psych_master_json A:", JSON.stringify(bpA.psych_master_json, null, 2));
    console.log("  saju_master_json A present:", Boolean(bpA.saju_master_json));
  }

  console.log(`Blueprint B (${reportIdB}):`, bpB ? "EXISTS" : "NOT FOUND");
  if (bpB) {
    console.log("  psych_master_json B:", JSON.stringify(bpB.psych_master_json, null, 2));
    console.log("  saju_master_json B present:", Boolean(bpB.saju_master_json));
  }
}

check().catch(console.error);
