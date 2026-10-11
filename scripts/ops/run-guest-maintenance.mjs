#!/usr/bin/env node
/**
 * Runs the guest maintenance route ONCE (queued purchase emails + guest
 * Personal / invite / Relationship retention purges) -- for DEV / local
 * checks, or as the command an external scheduler runs.
 *
 *   BASE_URL=http://localhost:3000 CRON_SECRET=... node scripts/ops/run-guest-maintenance.mjs
 *
 * Prints only the counts the route returns; never prints the secret.
 * Refuses a production-looking BASE_URL unless ALLOW_PROD=1 is set on purpose.
 */
const base = (process.env.BASE_URL ?? "").replace(/\/+$/, "");
const secret = process.env.CRON_SECRET ?? "";
if (!base || secret.length < 16) {
  console.error("Set BASE_URL and CRON_SECRET (16+ chars, same value as the app's CRON_SECRET).");
  process.exit(2);
}
if (/ahaitsme\.com/i.test(base) && process.env.ALLOW_PROD !== "1") {
  console.error("Refusing to call a production URL. This script is for DEV/local; set ALLOW_PROD=1 only when you mean it.");
  process.exit(2);
}
const res = await fetch(`${base}/api/cron/guest-emails`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});
const body = await res.json().catch(() => ({}));
console.log(JSON.stringify({ status: res.status, ...body }, null, 2));
process.exit(res.ok ? 0 : 1);
