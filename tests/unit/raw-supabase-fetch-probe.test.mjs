/**
 * Unit tests for lib/security/rawSupabaseFetchProbe.ts — the raw fetch()
 * probe that bypasses supabase-js to recover the underlying network
 * error's cause (DNS/TCP/TLS/timeout) that supabase-js's own error
 * wrapper discards, plus the 8-way verdict classifier that compares it
 * against the supabase-js probe outcome.
 *
 * Mocks globalThis.fetch — no real network access, no real Supabase
 * URL/key ever appears in this file.
 *
 * Run: npx tsx tests/unit/raw-supabase-fetch-probe.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const {
  probeRawSupabaseFetch,
  formatRawFetchProbeResult,
  classifyConnectionVerdict,
  compareRawFetchAndSupabaseJs,
} = await import("../../lib/security/rawSupabaseFetchProbe.ts");

const originalFetch = globalThis.fetch;
function withMockFetch(impl, fn) {
  globalThis.fetch = impl;
  return fn().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

function fakeResponse(status, contentType, bodyText) {
  return {
    status,
    headers: { get: (h) => (h.toLowerCase() === "content-type" ? contentType : null) },
    text: async () => bodyText,
  };
}

function causedError(message, causeName, causeCode, causeErrno) {
  const err = new TypeError(message);
  err.cause = { name: causeName, code: causeCode, errno: causeErrno };
  return err;
}

// ---------------------------------------------------------------------------
section("1) Successful 2xx response -> fetchCompleted=true, bounded status/contentType/bodyLength, no headers/URL leaked");

await withMockFetch(
  async () => fakeResponse(200, "application/json; charset=utf-8", "[]"),
  async () => {
    const r1 = await probeRawSupabaseFetch(
      "https://gncjslondpvysjaytagd.supabase.co",
      "fake-service-role-key-not-real",
    );
    assert.equal(r1.fetchStarted, true);
    assert.equal(r1.fetchCompleted, true);
    assert.equal(r1.httpStatus, 200);
    assert.equal(r1.responseContentType, "application/json; charset=utf-8");
    assert.equal(r1.responseBodyLength, 2);
    assert.equal(r1.errorName, null);
    assert.equal(r1.timeout, false);
    const s1 = JSON.stringify(r1);
    assert.equal(s1.includes("gncjslondpvysjaytagd"), false);
    assert.equal(s1.includes("fake-service-role-key-not-real"), false);
    ok("2xx success reports bounded status/content-type/body-length; URL and key never appear in the result");
  },
);

// ---------------------------------------------------------------------------
section("2) DNS failure (ENOTFOUND cause) -> errorCauseCode captured, fetchCompleted=false");

await withMockFetch(
  async () => {
    throw causedError("fetch failed", "Error", "ENOTFOUND", -3008);
  },
  async () => {
    const r2 = await probeRawSupabaseFetch("https://x.supabase.co", "fake-key");
    assert.equal(r2.fetchCompleted, false);
    assert.equal(r2.errorName, "TypeError");
    assert.equal(r2.errorCauseCode, "ENOTFOUND");
    assert.equal(r2.errorCauseErrno, "-3008");
    ok("DNS failure surfaces errorCauseCode=ENOTFOUND and errno, never the raw message");

    const verdict = classifyConnectionVerdict(r2, false);
    assert.equal(verdict, "DNS_FAILURE");
    ok("classifyConnectionVerdict maps ENOTFOUND cause to DNS_FAILURE");
  },
);

// ---------------------------------------------------------------------------
section("3) Connection refused (ECONNREFUSED cause) -> CONNECTION_REFUSED verdict");

await withMockFetch(
  async () => {
    throw causedError("fetch failed", "Error", "ECONNREFUSED", -61);
  },
  async () => {
    const r3 = await probeRawSupabaseFetch("https://x.supabase.co", "fake-key");
    const verdict = classifyConnectionVerdict(r3, false);
    assert.equal(verdict, "CONNECTION_REFUSED");
    ok("ECONNREFUSED cause maps to CONNECTION_REFUSED verdict");
  },
);

// ---------------------------------------------------------------------------
section("4) TLS failure (cert cause) -> TLS_FAILURE verdict");

await withMockFetch(
  async () => {
    throw causedError("fetch failed", "Error", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", null);
  },
  async () => {
    const r4 = await probeRawSupabaseFetch("https://x.supabase.co", "fake-key");
    const verdict = classifyConnectionVerdict(r4, false);
    assert.equal(verdict, "TLS_FAILURE");
    ok("a certificate-verification cause code maps to TLS_FAILURE verdict");
  },
);

// ---------------------------------------------------------------------------
section("5) Timeout via AbortController -> timeout=true, TIMEOUT verdict");

await withMockFetch(
  async (_url, opts) =>
    new Promise((_resolve, reject) => {
      opts.signal.addEventListener("abort", () => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        reject(err);
      });
    }),
  async () => {
    const r5 = await probeRawSupabaseFetch("https://x.supabase.co", "fake-key", 20);
    assert.equal(r5.timeout, true);
    assert.equal(r5.fetchCompleted, false);
    const verdict = classifyConnectionVerdict(r5, false);
    assert.equal(verdict, "TIMEOUT");
    ok("an aborted fetch (timeout) is flagged timeout=true and classified TIMEOUT regardless of any cause code");
  },
);

// ---------------------------------------------------------------------------
section("6) HTTP 401 response -> HTTP_AUTH_REJECTION verdict");

await withMockFetch(
  async () => fakeResponse(401, "application/json", '{"message":"..."}'),
  async () => {
    const r6 = await probeRawSupabaseFetch("https://x.supabase.co", "fake-key");
    assert.equal(r6.fetchCompleted, true);
    assert.equal(r6.httpStatus, 401);
    const verdict = classifyConnectionVerdict(r6, false);
    assert.equal(verdict, "HTTP_AUTH_REJECTION");
    ok("a completed 401 response is classified HTTP_AUTH_REJECTION, distinct from a network-level failure");
  },
);

// ---------------------------------------------------------------------------
section("7) HTTP 500 response -> HTTP_OTHER_FAILURE verdict");

await withMockFetch(
  async () => fakeResponse(500, "application/json", "{}"),
  async () => {
    const r7 = await probeRawSupabaseFetch("https://x.supabase.co", "fake-key");
    const verdict = classifyConnectionVerdict(r7, false);
    assert.equal(verdict, "HTTP_OTHER_FAILURE");
    ok("a completed 500 response is classified HTTP_OTHER_FAILURE");
  },
);

// ---------------------------------------------------------------------------
section("8) Raw fetch OK (2xx) but supabase-js probe failed -> RAW_FETCH_OK_SUPABASE_JS_FAILS");

await withMockFetch(
  async () => fakeResponse(200, "application/json", "[]"),
  async () => {
    const supabaseJsProbe = {
      ok: false,
      diagnostic: {
        pgCode: "",
        category: "unknown_db_error",
        responseCode: "report_create_unknown_db_error",
        constraint: null,
        column: null,
      },
      fields: {
        codeTypeof: "string",
        codeIsNull: false,
        codeIsUndefined: false,
        codeStringLength: 0,
        codeSafe: null,
        messageTypeof: "string",
        messageStringLength: 23,
        messageCategories: [],
      },
    };
    const result = await compareRawFetchAndSupabaseJs(
      "https://x.supabase.co",
      "fake-key",
      supabaseJsProbe,
    );
    assert.equal(result.verdict, "RAW_FETCH_OK_SUPABASE_JS_FAILS");
    ok("raw fetch succeeding while supabase-js still fails is classified RAW_FETCH_OK_SUPABASE_JS_FAILS — exactly the shape that would prove a supabase-js-specific bug rather than a network problem");
  },
);

// ---------------------------------------------------------------------------
section("9) Both raw fetch and supabase-js probe succeed -> BOTH_OK");

await withMockFetch(
  async () => fakeResponse(200, "application/json", "[]"),
  async () => {
    const supabaseJsProbe = { ok: true, count: 42 };
    const result = await compareRawFetchAndSupabaseJs(
      "https://x.supabase.co",
      "fake-key",
      supabaseJsProbe,
    );
    assert.equal(result.verdict, "BOTH_OK");
    ok("both probes succeeding is classified BOTH_OK");
  },
);

// ---------------------------------------------------------------------------
section("10) formatRawFetchProbeResult emits a stable bounded line, never contains the raw error message");

await withMockFetch(
  async () => {
    throw causedError(
      "TypeError: fetch failed with some potentially sensitive detail",
      "Error",
      "ENOTFOUND",
      -3008,
    );
  },
  async () => {
    const r10 = await probeRawSupabaseFetch("https://x.supabase.co", "fake-key");
    const lines = formatRawFetchProbeResult(r10);
    assert.equal(Array.isArray(lines), true);
    assert.equal(lines.some((l) => l.startsWith("errorCauseCode=ENOTFOUND")), true);
    const joined = lines.join(" ");
    assert.equal(joined.includes("potentially sensitive detail"), false);
    ok("formatted probe line is bounded and never contains the raw error message text");
  },
);

console.log("\nOK: raw-supabase-fetch-probe tests passed");
