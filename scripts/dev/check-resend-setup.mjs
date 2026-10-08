// Prints the Resend setup WITHOUT printing any key:
//   - which mail env vars are set (names only)
//   - Resend domains and their verification status
//   - whether MAIL_FROM's domain is a verified domain
// Usage (from the project folder): node scripts/dev/check-resend-setup.mjs
import { readFileSync } from "node:fs";

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* no file */
  }
}
loadEnv(".env.local");

const names = ["RESEND_API_KEY", "MAIL_FROM", "MAIL_REPLY_TO", "APP_BASE_URL", "GUEST_CLAIM_TOKEN_SECRET", "CRON_SECRET", "TOSS_TEST_ALLOWLIST"];
for (const n of names) console.log(`${n}: ${process.env[n] ? "set" : "MISSING"}`);

const from = process.env.MAIL_FROM ?? "";
const fromDomain = (/@([^>\s]+)/.exec(from)?.[1] ?? "").toLowerCase();
console.log(`MAIL_FROM domain: ${fromDomain || "(none)"}`);
console.log(`MAIL_FROM address: ${(/<([^>]+)>/.exec(from)?.[1] ?? from) || "(none)"}`);
console.log(`MAIL_REPLY_TO: ${process.env.MAIL_REPLY_TO || "(not set)"}`);
if (fromDomain === "resend.dev") {
  console.log("NOTE: onboarding@resend.dev is Resend's shared test sender -- it only delivers to the email address of your own Resend account.");
}

const key = process.env.RESEND_API_KEY;
if (!key) process.exit(0);
const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` } });
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.log(`Resend /domains -> HTTP ${res.status} ${body?.name ?? ""}`);
  if (body?.name === "restricted_api_key") console.log("This key is 'sending access' only: check domains in the Resend dashboard (Domains page).");
  process.exit(0);
}
const domains = Array.isArray(body?.data) ? body.data : [];
if (domains.length === 0) console.log("Resend domains: none added yet");
for (const d of domains) console.log(`domain: ${d.name}  status: ${d.status}  region: ${d.region ?? "-"}`);
if (fromDomain && fromDomain !== "resend.dev") {
  const match = domains.find((d) => String(d.name).toLowerCase() === fromDomain);
  console.log(`MAIL_FROM domain verified: ${match ? match.status === "verified" : false}`);
}
