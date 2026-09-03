/**
 * Live proof for spec section 18: the partial unique index on
 * relationship_report_shares(relationship_report_id, kind) WHERE
 * status='active' actually fires as code 23505 on a race — the exact
 * condition app/api/relationship/share/create/route.ts now branches on to
 * reuse the winning row's token instead of surfacing a generic 500.
 *
 * Uses an existing disposable test fixture relationship_report_id (the
 * "자동화테스트친구" automation test connection already in this project's
 * test data, not a real user's relationship) and cleans up every row it
 * creates, leaving relationship_report_shares exactly as it found it.
 *
 * Run: node tests/scripts/verify-report-share-idempotency.mjs <relationshipReportId>
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const relationshipReportId = process.argv[2];
if (!relationshipReportId) {
  console.error("usage: node tests/scripts/verify-report-share-idempotency.mjs <relationshipReportId>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: rr, error: rrErr } = await supabase
  .from("relationship_reports")
  .select("id, report_id_a, report_id_b")
  .eq("id", relationshipReportId)
  .maybeSingle();
if (rrErr || !rr) {
  console.error("could not load relationship_reports row:", rrErr?.message ?? "not found");
  process.exit(1);
}

const kind = "friendship";
const rowA = {
  relationship_report_id: rr.id,
  kind,
  owner_report_id: rr.report_id_a,
  recipient_report_id: rr.report_id_b,
  share_token: "test-share-token-a-" + Date.now(),
  status: "active",
};
const rowB = { ...rowA, share_token: "test-share-token-b-" + Date.now() };

console.log("inserting first active share row...");
const first = await supabase.from("relationship_report_shares").insert(rowA);
if (first.error) {
  console.error("FAIL — first insert should have succeeded:", first.error.message);
  process.exit(1);
}
console.log("ok - first insert succeeded");

console.log("inserting a second active share row for the SAME (relationship_report_id, kind)...");
const second = await supabase.from("relationship_report_shares").insert(rowB);
if (!second.error) {
  console.log("FAIL — second insert should have been rejected by the partial unique index, but it succeeded");
} else if (second.error.code === "23505") {
  console.log(`ok - second insert rejected with code 23505 (unique_violation) — exactly what app/api/relationship/share/create/route.ts now checks for before reusing the existing token`);
} else {
  console.log(`FAIL — second insert rejected, but with unexpected code ${second.error.code}: ${second.error.message}`);
}

const { count } = await supabase
  .from("relationship_report_shares")
  .select("*", { count: "exact", head: true })
  .eq("relationship_report_id", rr.id)
  .eq("kind", kind)
  .eq("status", "active");
console.log(`active rows for this (relationship_report_id, kind) after the race: ${count} (must be exactly 1)`);

console.log("\ncleaning up test rows...");
await supabase.from("relationship_report_shares").delete().eq("relationship_report_id", rr.id).eq("kind", kind);
console.log("done — relationship_report_shares restored to its prior state for this relationship_report_id.");
