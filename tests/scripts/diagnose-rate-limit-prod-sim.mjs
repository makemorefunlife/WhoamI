import fs from "node:fs";
const t = fs.readFileSync(".env.local", "utf8");
const e = {};
for (const line of t.split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  let v = line.slice(i + 1);
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  e[line.slice(0, i).trim()] = v;
}
for (const k of [
  "CLERK_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
]) {
  console.log(k + "_PRESENT=" + Boolean(e[k] && e[k].trim()));
}
const pk = e.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
console.log(
  "CLERK_PK_KIND=" +
    (pk.startsWith("pk_live")
      ? "live"
      : pk.startsWith("pk_test")
        ? "test"
        : pk
          ? "other"
          : "none"),
);

// Rate-limit simulation for production without remote
process.env.NODE_ENV = "production";
process.env.VERCEL_ENV = "production";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.RATE_LIMIT_ALLOW_MEMORY;
const { enforceRateLimit } = await import("../../lib/security/rateLimit.ts");
const r = await enforceRateLimit("report_create", "user_diag");
console.log(
  "PROD_RATELIMIT_WITHOUT_UPSTASH=" +
    JSON.stringify({ ok: r.ok, status: r.ok ? undefined : r.status, error: r.ok ? undefined : r.error }),
);
