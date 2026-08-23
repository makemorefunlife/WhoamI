import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: row } = await supabase
    .from("relationship_reports")
    .select("*")
    .eq("id", "2e96c631-791b-4f89-bfd6-5a44f7b344cb")
    .single();

  console.log("Relationship Report Row:", JSON.stringify(row, null, 2));
}

run();
