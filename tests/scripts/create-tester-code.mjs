/**
 * Create a tester/beta Personal redeem code.
 *
 * Server-side only (service-role key) -- intentionally not exposed through
 * any API route or public client, per the product requirement that tester
 * codes are issued out-of-band by an operator, never by an unauthenticated
 * visitor. Run from the repo root with node (top-level await, ESM):
 *
 *   node tests/scripts/create-tester-code.mjs [options]
 *
 * Options (all optional):
 *   --max-redemptions=<n>   Max number of distinct users who can redeem this
 *                           one code (default 1 -- single-use).
 *   --expires-in-days=<n>   Code itself becomes unusable after n days from
 *                           now (default: no expiry -- active/inactive is
 *                           the only lifecycle control).
 *   --note="<text>"         Free-text operator note (e.g. "TechCrunch launch
 *                           batch", "beta-tester-alice@example.com") stored
 *                           alongside the code for your own bookkeeping --
 *                           never shown to the redeemer.
 *   --code=<CODE>           Use this exact code instead of generating one.
 *                           Must be unique; the script reports a clear error
 *                           on collision rather than silently retrying with
 *                           a different value.
 *
 * Examples:
 *   node tests/scripts/create-tester-code.mjs
 *   node tests/scripts/create-tester-code.mjs --max-redemptions=25 --note="Beta wave 1"
 *   node tests/scripts/create-tester-code.mjs --expires-in-days=30 --max-redemptions=1
 *
 * Redeemed the same way an Annual gift code is (POST /api/redeem, or via
 * the /redeem page) -- this script only inserts the row; the existing
 * redeem_tester_personal_code() Postgres function (see
 * supabase/migrations/20260928000000_redeem_code_system.sql) does the
 * actual atomic, concurrency-safe redemption.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    if (!match) continue;
    const [, key, value] = match;
    out[key] = value === undefined ? true : value;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const maxRedemptions = args["max-redemptions"] !== undefined ? Number(args["max-redemptions"]) : 1;
if (!Number.isInteger(maxRedemptions) || maxRedemptions < 1) {
  console.error("--max-redemptions must be a positive integer");
  process.exit(1);
}

let expiresAt = null;
if (args["expires-in-days"] !== undefined) {
  const days = Number(args["expires-in-days"]);
  if (!Number.isFinite(days) || days <= 0) {
    console.error("--expires-in-days must be a positive number");
    process.exit(1);
  }
  expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

const note = typeof args.note === "string" ? args.note.slice(0, 500) : null;

/** Mirrors the existing GIFT- code shape (migration 20260922040200) so both
 *  code families look and behave the same to an operator eyeballing rows,
 *  just with a distinct, unambiguous prefix the API route dispatches on. */
function generateTesterCode() {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `TEST-${random}`;
}

const code = typeof args.code === "string" && args.code.trim() ? args.code.trim().toUpperCase() : generateTesterCode();

if (!code.startsWith("TEST-")) {
  console.error('A custom --code must start with "TEST-" so /api/redeem dispatches it correctly.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("tester_personal_codes")
  .insert({
    code,
    max_redemptions: maxRedemptions,
    expires_at: expiresAt,
    note,
  })
  .select("id, code, max_redemptions, expires_at, active, created_at")
  .single();

if (error) {
  if (error.code === "23505") {
    console.error(`Code "${code}" already exists. Pass a different --code or omit it to auto-generate.`);
  } else {
    console.error("Failed to create tester code:", error.message);
  }
  process.exit(1);
}

console.log("Created tester code:");
console.log(`  code:            ${data.code}`);
console.log(`  max_redemptions: ${data.max_redemptions}`);
console.log(`  expires_at:      ${data.expires_at ?? "(none)"}`);
console.log(`  active:          ${data.active}`);
console.log(`  created_at:      ${data.created_at}`);
console.log("");
console.log(`Share the code directly, or as a link: https://www.ahaitsme.com/redeem?code=${encodeURIComponent(data.code)}`);
