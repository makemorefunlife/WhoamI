import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { error } = await sb.from("relationship_report_shares").select("id").limit(1);
if (error) {
  console.log("NOT APPLIED —", error.code, error.message);
} else {
  console.log("APPLIED — table exists and is queryable");
}
