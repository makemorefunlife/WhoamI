/**
 * Read-only Upstash REST probe — never prints secrets/full URLs/tokens/subjects.
 * Run: npx tsx tests/scripts/probe-upstash-rate-limit.mjs
 */
import fs from "node:fs";

function readEnvLocal() {
  const text = fs.readFileSync(".env.local", "utf8");
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map[line.slice(0, eq).trim()] = val;
  }
  return map;
}

function classifyUrl(url) {
  const u = (url || "").trim();
  if (!u) return { kind: "missing", hostHint: "none", isHttpsRest: false };
  let hostHint = "unparsed";
  try {
    if (/^rediss?:\/\//i.test(u)) {
      const h = u.replace(/^rediss?:\/\//i, "").split("@").pop()?.split("/")[0] ?? "";
      hostHint = h.replace(/:\d+$/, "").slice(-24);
      return { kind: "redis_tcp", hostHint, isHttpsRest: false };
    }
    const parsed = new URL(u);
    hostHint = parsed.hostname.slice(-40);
    const isHttps = parsed.protocol === "https:";
    const looksUpstash =
      parsed.hostname.includes("upstash.io") ||
      parsed.hostname.includes("kv.vercel-storage.com") ||
      parsed.hostname.includes("upstash");
    return {
      kind: isHttps ? (looksUpstash ? "https_rest_like" : "https_other") : "non_https",
      hostHint,
      isHttpsRest: isHttps,
      path: parsed.pathname || "/",
    };
  } catch {
    return { kind: "invalid_url", hostHint: "parse_fail", isHttpsRest: false };
  }
}

function classifyToken(token) {
  const t = (token || "").trim();
  if (!t) return { kind: "missing", len: 0 };
  // REST tokens are typically long; redis passwords can be shorter.
  if (t.startsWith("AYa") || t.length >= 40) return { kind: "rest_like", len: t.length };
  if (t.length < 20) return { kind: "short_unlikely_rest", len: t.length };
  return { kind: "unknown", len: t.length };
}

const env = readEnvLocal();
const url =
  env.UPSTASH_REDIS_REST_URL?.trim() ||
  env.KV_REST_API_URL?.trim() ||
  "";
const token =
  env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
  env.KV_REST_API_TOKEN?.trim() ||
  "";
const urlSource = env.UPSTASH_REDIS_REST_URL?.trim()
  ? "UPSTASH_REDIS_REST_URL"
  : env.KV_REST_API_URL?.trim()
    ? "KV_REST_API_URL"
    : "none";
const tokenSource = env.UPSTASH_REDIS_REST_TOKEN?.trim()
  ? "UPSTASH_REDIS_REST_TOKEN"
  : env.KV_REST_API_TOKEN?.trim()
    ? "KV_REST_API_TOKEN"
    : "none";

const urlInfo = classifyUrl(url);
const tokenInfo = classifyToken(token);

console.log("SOURCE=local_.env.local");
console.log("URL_ENV=" + urlSource);
console.log("TOKEN_ENV=" + tokenSource);
console.log("URL_KIND=" + urlInfo.kind);
console.log("URL_HOST_HINT=" + urlInfo.hostHint);
console.log("URL_IS_HTTPS_REST=" + urlInfo.isHttpsRest);
console.log("TOKEN_KIND=" + tokenInfo.kind);
console.log("TOKEN_LEN=" + tokenInfo.len);
console.log(
  "ALSO_HAS_TCP_UPSTASH_REDIS_URL=" +
    Boolean(env.UPSTASH_REDIS_URL?.trim() || env.REDIS_URL?.trim()),
);

if (!url || !token) {
  console.log("PROBE_SKIPPED=missing_url_or_token");
  process.exit(0);
}

if (!urlInfo.isHttpsRest) {
  console.log("PROBE_SKIPPED=url_not_https_rest");
  console.log("VERDICT=misconfigured_tcp_or_non_rest_url_would_503");
  process.exit(0);
}

const probeKey = "rl:probe:diag:" + Date.now();
const started = Date.now();
let httpStatus = 0;
let bodyShape = "none";
let resultType = "none";
let resultPreview = "none";
let errCode = "";

try {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["INCR", probeKey]),
  });
  httpStatus = res.status;
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    bodyShape = "non_json";
  }
  if (json && typeof json === "object") {
    if ("error" in json && json.error) bodyShape = "error_field";
    else if ("result" in json) {
      bodyShape = "result_field";
      resultType = typeof json.result;
      resultPreview =
        typeof json.result === "number"
          ? "number"
          : typeof json.result === "string"
            ? "string_len_" + String(json.result).length
            : Array.isArray(json.result)
              ? "array"
              : typeof json.result;
    } else bodyShape = "object_no_result";
  }
  // cleanup best-effort
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["DEL", probeKey]),
    });
  } catch {
    // ignore
  }
} catch (e) {
  errCode = e && typeof e === "object" && "code" in e ? String(e.code) : "fetch_throw";
}

console.log("INDEPENDENT_INCR_HTTP_STATUS=" + httpStatus);
console.log("INDEPENDENT_INCR_BODY_SHAPE=" + bodyShape);
console.log("INDEPENDENT_INCR_RESULT_TYPE=" + resultType);
console.log("INDEPENDENT_INCR_MS=" + (Date.now() - started));
if (errCode) console.log("INDEPENDENT_INCR_ERR=" + errCode);

if (httpStatus === 200 && bodyShape === "result_field") {
  console.log("VERDICT=rest_credentials_work_locally");
} else if (httpStatus === 401 || httpStatus === 403) {
  console.log("VERDICT=rest_auth_failed_bad_token_or_wrong_token_type");
} else if (httpStatus === 0) {
  console.log("VERDICT=network_or_dns_failure");
} else {
  console.log("VERDICT=rest_call_failed_status_" + httpStatus);
}
