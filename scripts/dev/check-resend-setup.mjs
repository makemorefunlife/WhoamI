// Prints the Resend setup WITHOUT printing any key:
//   - which mail env vars are set (names only)
//   - Resend domains and their verification status (when the key may read them)
//   - whether MAIL_FROM's domain is a verified domain
// Usage (from the project folder): node scripts/dev/check-resend-setup.mjs
//
// No process.exit() anywhere: on Windows, exiting while fetch's sockets are
// still closing trips a libuv assertion
// ("!(handle->flags & UV_HANDLE_CLOSING)", src\win\async.c). The script just
// returns and lets Node finish on its own; exitCode carries the result.
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

async function main() {
  loadEnv(".env.local");

  const names = ["RESEND_API_KEY", "MAIL_FROM", "MAIL_REPLY_TO", "APP_BASE_URL", "GUEST_CLAIM_TOKEN_SECRET", "CRON_SECRET", "TOSS_TEST_ALLOWLIST"];
  for (const n of names) console.log(`${n}: ${process.env[n] ? "set" : "MISSING"}`);

  const from = process.env.MAIL_FROM ?? "";
  const fromDomain = (/@([^>\s]+)/.exec(from)?.[1] ?? "").toLowerCase();
  console.log(`MAIL_FROM address: ${(/<([^>]+)>/.exec(from)?.[1] ?? from) || "(none)"}`);
  console.log(`MAIL_REPLY_TO: ${process.env.MAIL_REPLY_TO || "(not set)"}`);
  if (fromDomain === "resend.dev") {
    console.log("NOTE: onboarding@resend.dev is Resend's shared test sender -- it only delivers to the email address of your own Resend account.");
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    process.exitCode = 1;
    return;
  }

  let res;
  let body = {};
  try {
    res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` } });
    body = await res.json().catch(() => ({}));
  } catch {
    console.log("Resend API could not be reached (network). Sending was not tested by this script.");
    process.exitCode = 1;
    return;
  }

  if (res.status === 401) {
    // A "Sending access" key may send mail but may not list domains
    // (Resend answers 401 restricted_api_key). That is expected and is NOT a
    // sending failure.
    console.log("Domain list: not available with this API key (sending-only permission). This is not a sending problem.");
    console.log(`Check the verification status of ${fromDomain || "your sending domain"} in the Resend dashboard (Domains page).`);
    console.log("To test sending: node scripts/dev/send-test-mail.mjs you@example.com");
    return;
  }
  if (!res.ok) {
    console.log(`Resend /domains -> HTTP ${res.status} ${body?.name ?? ""}`);
    process.exitCode = 1;
    return;
  }

  const domains = Array.isArray(body?.data) ? body.data : [];
  if (domains.length === 0) console.log("Resend domains: none added yet");
  for (const d of domains) console.log(`domain: ${d.name}  status: ${d.status}  region: ${d.region ?? "-"}`);
  if (fromDomain && fromDomain !== "resend.dev") {
    const match = domains.find((d) => String(d.name).toLowerCase() === fromDomain);
    console.log(`MAIL_FROM domain verified: ${match ? match.status === "verified" : false}`);
  }
}

await main();
