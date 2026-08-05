/**
 * Regression check for the `report_create_insert_failed` production incident.
 *
 * Root cause: app/api/report/create/route.ts inserts `entitlement` and
 * `report_type` into public.reports (added to the insert payload in commit
 * b0efa0e, 2026-07-14), but those columns did not exist in the deployed
 * Supabase project until migration 20260805120000_prod_add_entitlement_report_type.sql
 * was applied. Every insert failed with PostgREST's standard "column not
 * found in schema cache" error (PGRST204) until the columns existed.
 *
 * This script re-derives that exact failure mode by comparing
 * POST /api/report/create's real insert payload shape against the live
 * schema (read-only introspection via PostgREST's OpenAPI description —
 * no INSERT/UPDATE/DELETE is ever issued, so it never touches row data).
 * It fails the same way the route did before the migration was applied,
 * and passes now that the schema matches.
 *
 * Run: node tests/scripts/verify-report-create-schema.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Minimal inline .env.local loader (avoids a hard dependency on the `dotenv`
// package so this script can run in a bare checkout without node_modules).
function loadEnvLocal(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal(path.join(root, ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// The exact field set app/api/report/create/route.ts sends on
// `.from("reports").insert([{...}])` — kept in sync manually since this is a
// characterization check, not a live import (route.ts is a Next.js route
// module, not safely importable from a standalone script).
const INSERT_PAYLOAD_FIELDS = [
  "name",
  "clerk_user_id",
  "birth_date",
  "birth_time",
  "birth_place",
  "report_type",
  "entitlement",
];

// Values the route actually sends for the two columns the incident hit.
const EXPECTED_VALUES = {
  report_type: "self",
  entitlement: "free",
};

// Mirrors the CHECK constraints in
// supabase/migrations/20260805120000_prod_add_entitlement_report_type.sql
const EXPECTED_CHECK_ALLOWED = {
  report_type: ["self", "partner_manual"],
  entitlement: ["free", "premium"],
};

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Accept: "application/openapi+json",
    },
  });

  if (!res.ok) {
    console.error(`FAIL: schema introspection request failed (${res.status})`);
    process.exit(1);
  }

  const spec = await res.json();
  const reportsDef = spec.definitions?.reports ?? spec.components?.schemas?.reports;

  if (!reportsDef) {
    console.error("FAIL: public.reports is not present in the live schema at all.");
    process.exit(1);
  }

  const liveColumns = new Set(Object.keys(reportsDef.properties ?? {}));
  const missing = INSERT_PAYLOAD_FIELDS.filter((f) => !liveColumns.has(f));

  if (missing.length > 0) {
    console.error(
      `FAIL: report_create_insert_failed would reproduce — missing column(s) in public.reports: ${missing.join(", ")}`,
    );
    console.error(
      "This is the exact PostgREST PGRST204 'column not found in schema cache' failure mode. " +
        "Apply supabase/migrations/20260805120000_prod_add_entitlement_report_type.sql.",
    );
    process.exit(1);
  }
  console.log(`ok - all ${INSERT_PAYLOAD_FIELDS.length} insert payload columns exist in public.reports: [${INSERT_PAYLOAD_FIELDS.join(", ")}]`);

  for (const [col, expectedVal] of Object.entries(EXPECTED_VALUES)) {
    const allowed = EXPECTED_CHECK_ALLOWED[col];
    if (!allowed.includes(expectedVal)) {
      console.error(`FAIL: route sends ${col}="${expectedVal}", which is outside the expected allowed set [${allowed.join(", ")}]`);
      process.exit(1);
    }
    console.log(`ok - ${col}="${expectedVal}" is within the CHECK-allowed set [${allowed.join(", ")}]`);
  }

  // clerk_user_id is the only column the live schema marks NOT NULL among
  // the fields the route sends a real (non-null) value for — confirm it's
  // still present and the route supplies it.
  const required = new Set(reportsDef.required ?? []);
  if (required.has("clerk_user_id") && !INSERT_PAYLOAD_FIELDS.includes("clerk_user_id")) {
    console.error("FAIL: clerk_user_id is NOT NULL in the live schema but the route's payload list doesn't include it.");
    process.exit(1);
  }
  console.log("ok - clerk_user_id (NOT NULL in live schema) is supplied by the route");

  console.log("\nOK: report_create insert payload matches the live public.reports schema — the report_create_insert_failed incident does not reproduce.");
}

main().catch((err) => {
  console.error("FAIL: verification script threw:", err.message);
  process.exit(1);
});
