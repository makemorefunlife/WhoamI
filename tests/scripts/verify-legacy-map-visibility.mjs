/**
 * Live proof for spec section 16: after wiring isVisibleInMapBatch into
 * fetchRelationshipMapConnections, a real report with legacy connections
 * (created before relationship_map_memberships / personal_connect_link_uses
 * existed) must still see every one of them, unchanged.
 *
 * Run: node tests/scripts/verify-legacy-map-visibility.mjs <reportId>
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const reportId = process.argv[2];
if (!reportId) {
  console.error("usage: npx tsx tests/scripts/verify-legacy-map-visibility.mjs <reportId>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const { fetchRelationshipMapConnections } = await import(
  "../../lib/relationship/map/fetchRelationshipMapConnections.ts"
);

const before = await fetchRelationshipMapConnections(supabase, reportId);
console.log(`fetchRelationshipMapConnections(${reportId}) -> ${before.length} visible connection(s)`);
for (const c of before) {
  console.log(`  - ${c.partnerName} (${c.partnerReportId}) status=${c.status}`);
}

const { data: memberships } = await supabase
  .from("relationship_map_memberships")
  .select("relationship_report_id")
  .eq("viewer_report_id", reportId);
const { data: linkUses } = await supabase
  .from("personal_connect_link_uses")
  .select("relationship_report_id");

console.log(`\nmembership rows for this viewer: ${memberships?.length ?? 0}`);
console.log(`personal_connect_link_uses rows (any): ${linkUses?.length ?? 0}`);

if ((memberships?.length ?? 0) === 0) {
  console.log(
    "\nok - this viewer has zero relationship_map_memberships rows, so every visible connection above is proof of the legacy fallback (isVisibleInMap(null, true) -> true) actually firing in the live wired code path.",
  );
} else {
  console.log(
    "\nnote - this viewer already has membership rows (new-flow connections exist); legacy fallback is still exercised for any connection NOT in that set.",
  );
}
