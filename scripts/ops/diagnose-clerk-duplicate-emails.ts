/**
 * Account integration -- STEP 3: Clerk accounts sharing a VERIFIED email
 * (READ ONLY, counts only).
 *
 * The app treats one Clerk user as one account on both sites. This checks
 * whether any verified email address belongs to more than one Clerk user
 * (expected: 0 -- Clerk normally keeps email addresses unique). Unverified
 * addresses are counted separately and are never a reason to merge.
 *
 * Prints counts only: no emails, no user ids, no keys.
 *
 *   CLERK_SECRET_KEY=<production secret> npx tsx scripts/ops/diagnose-clerk-duplicate-emails.ts
 *
 * Without CLERK_SECRET_KEY in the environment it reads it from .env.local
 * (which may hold the DEVELOPMENT key -- the output says which kind ran).
 */
import { readFileSync, existsSync } from "node:fs";

function loadKey(): string | null {
  if (process.env.CLERK_SECRET_KEY?.trim()) return process.env.CLERK_SECRET_KEY.trim();
  if (!existsSync(".env.local")) return null;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = /^\s*CLERK_SECRET_KEY\s*=\s*(.*)\s*$/.exec(line);
    if (m && !line.trim().startsWith("#")) return m[1].replace(/^["']|["']$/g, "").trim() || null;
  }
  return null;
}

type ClerkEmail = { email_address?: string; verification?: { status?: string } | null };
type ClerkUser = { id: string; email_addresses?: ClerkEmail[] };

async function main() {
  const key = loadKey();
  if (!key) {
    console.log("CLERK_SECRET_KEY not found -- nothing checked.");
    process.exit(1);
  }
  const kind = key.startsWith("sk_live_") ? "production (sk_live)" : key.startsWith("sk_test_") ? "development (sk_test)" : "unknown key type";
  const verified = new Map<string, number>();
  const unverified = new Map<string, number>();
  let users = 0;
  let usersWithoutVerifiedEmail = 0;
  const limit = 500;
  for (let offset = 0; ; offset += limit) {
    const res = await fetch(`https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}&order_by=created_at`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      console.log(`Clerk API error: HTTP ${res.status} -- stopped.`);
      process.exit(1);
    }
    const page = (await res.json()) as ClerkUser[];
    for (const u of page) {
      users += 1;
      const seen = new Set<string>();
      let anyVerified = false;
      for (const e of u.email_addresses ?? []) {
        const addr = e.email_address?.trim().toLowerCase();
        if (!addr || seen.has(addr)) continue;
        seen.add(addr);
        if (e.verification?.status === "verified") {
          anyVerified = true;
          verified.set(addr, (verified.get(addr) ?? 0) + 1);
        } else {
          unverified.set(addr, (unverified.get(addr) ?? 0) + 1);
        }
      }
      if (!anyVerified) usersWithoutVerifiedEmail += 1;
    }
    if (page.length < limit) break;
  }
  const dupVerified = [...verified.values()].filter((n) => n > 1);
  const unverifiedMatchingVerified = [...unverified.keys()].filter((a) => verified.has(a)).length;
  console.log(`key: ${kind}`);
  console.log(`clerk_users: ${users}`);
  console.log(`users_without_verified_email: ${usersWithoutVerifiedEmail}`);
  console.log(`verified_emails_on_2plus_users: ${dupVerified.length}`);
  console.log(`users_involved_in_those: ${dupVerified.reduce((a, b) => a + b, 0)}`);
  console.log(`unverified_emails_matching_another_users_verified_email (never merged): ${unverifiedMatchingVerified}`);
}
main();
