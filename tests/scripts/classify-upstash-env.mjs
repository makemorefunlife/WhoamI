/**
 * Classify Upstash-related env without printing secrets.
 * Run: npx tsx tests/scripts/classify-upstash-env.mjs
 */
import fs from "node:fs";

const text = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of text.split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  let v = line.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[line.slice(0, i).trim()] = v;
}

function urlKind(v) {
  if (!v) return "missing";
  if (/^rediss?:\/\//i.test(v)) return "tcp";
  if (/^https:\/\//i.test(v)) return "https";
  if (/^http:\/\//i.test(v)) return "http";
  return "other";
}

for (const k of [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "UPSTASH_REDIS_URL",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "VERCEL_TOKEN",
]) {
  const v = env[k]?.trim() ?? "";
  console.log(k + "_PRESENT=" + Boolean(v));
  if (v && k.includes("URL") && !k.includes("TOKEN")) {
    console.log(k + "_KIND=" + urlKind(v));
  }
  if (v && k.includes("TOKEN")) {
    console.log(k + "_LEN=" + v.length);
  }
}
