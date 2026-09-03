import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const tables = [
  "relationship_report_shares",
  "personal_connect_links",
  "personal_connect_link_uses",
  "relationship_map_memberships",
];

for (const table of tables) {
  const { error, count } = await sb.from(table).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`NOT REACHABLE — ${table}: ${error.code} ${error.message}`);
  } else {
    console.log(`ok - ${table} reachable (${count ?? 0} rows)`);
  }
}
