/**
 * Personal Deep Report entitlement is independent of internal generation
 * versions, and a credit is only consumed after the report is really saved.
 *
 *   A. saved v9 report while the current generation version is 10 -> served, no credit
 *   B. newly generated v10 report -> served on reopen, no credit
 *   C. nothing saved -> generation (credit) path
 *   D. generation fails before save -> no consume, released, nothing saved
 *   E. save fails after generation -> no consume, released, error
 *   F. en-US and ko-KR behave the same
 *
 * Run: npx tsx --test tests/unit/personal-deep-essence-entitlement.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideStoredDeepEssenceReuse } from "../../lib/report/personalDeepEssenceReuse.ts";
import { runPersonalDeepEssenceGeneration } from "../../lib/report/personalDeepEssenceGeneration.ts";
import { PERSONAL_V2_STRUCTURED_GENERATION_VERSION } from "../../lib/v1/slim/types.ts";

const validStructured = () => ({
  summary: { core_mode: "Reflective independence", energy_balance: "56 / 40", growth_edge: "Connection depth" },
  radar_potential: { autonomy: 60, connection: 55, stability: 50, growth: 65, structure: 45, adaptability: 55 },
  strengths: [1, 2, 3].map((n) => ({ title: `S${n}`, body: "A reasonably long descriptive body sentence." })),
  watchouts: [1, 2, 3].map((n) => ({ title: `W${n}`, body: "A reasonably long descriptive body sentence." })),
  energy: {
    headline: "Your energy flows best in balanced environments.",
    balance_pct: 40,
    bars: [
      { label: "Energy spent on people & relationships", value: 56, tone: "highlight" },
      { label: "Energy returning to you", value: 40, tone: "accent" },
      { label: "Solo recovery time", value: 70, tone: "ink" },
    ],
    summary: "A reasonably long energy summary paragraph.",
    fuels: ["a", "b", "c"],
    drains: ["a", "b", "c"],
    optimal: ["a", "b"],
  },
  relationships: {
    pattern: "A description of how this person connects with others.",
    fit: ["a", "b", "c"],
    friction: ["a", "b", "c"],
    compare: [1, 2, 3].map((n) => ({ wound: `w${n}`, steady: `s${n}` })),
  },
  playbook: {
    rule: "A concrete operating principle.",
    rows: [1, 2, 3].map((n) => ({ situation: `s${n}`, old: `o${n}`, better: `b${n}` })),
    heated: "Take a step back.",
    reset: "Each week, carve out time.",
  },
  future: { remember: ["a", "b", "c"], leap: "Choose to connect." },
  closing: "A warm, complete closing paragraph.",
  checklist: ["1", "2", "3", "4", "5", "6", "7", "8"],
});

const slim = (over = {}) => ({
  source: "v1/slim-integrated",
  prompt: "p",
  report: "A saved, completed report body.",
  llm_source: "llm",
  structured: validStructured(),
  structured_source: "llm",
  personal_v2_generation_version: PERSONAL_V2_STRUCTURED_GENERATION_VERSION,
  ...over,
});
const row = (locale, s) => JSON.stringify({ locale, slim_v1: s });

describe("saved report access does not depend on generation version", () => {
  it("current generation version is 10 (new reports keep stamping the current version)", () => {
    assert.equal(PERSONAL_V2_STRUCTURED_GENERATION_VERSION, 10);
  });

  for (const locale of ["en-US", "ko-KR"]) {
    it(`A) [${locale}] saved v9 report is served as-is (no regeneration, no credit)`, () => {
      const d = decideStoredDeepEssenceReuse(row(locale, slim({ personal_v2_generation_version: 9 })), locale);
      assert.equal(d.reuse, true);
      assert.equal(d.slim_v1.personal_v2_generation_version, 9, "must not be restamped or rewritten");
      assert.ok(d.slim_v1.structured, "valid structured payload is kept");
    });

    it(`A) [${locale}] saved report with NO version stamp (oldest rows) is served`, () => {
      const s = slim();
      delete s.personal_v2_generation_version;
      assert.equal(decideStoredDeepEssenceReuse(row(locale, s), locale).reuse, true);
    });

    it(`B) [${locale}] newly generated v10 report is served on reopen`, () => {
      const d = decideStoredDeepEssenceReuse(row(locale, slim()), locale);
      assert.equal(d.reuse, true);
      assert.equal(d.structuredDropped, false);
    });

    it(`C) [${locale}] nothing saved -> not reused (generation / credit path)`, () => {
      assert.deepEqual(decideStoredDeepEssenceReuse(null, locale), { reuse: false, reason: "none" });
    });
  }

  it("a saved report whose structured payload no longer matches the schema is served as prose, not regenerated", () => {
    const s = slim({ structured: { summary: null } });
    const d = decideStoredDeepEssenceReuse(row("en-US", s), "en-US");
    assert.equal(d.reuse, true);
    assert.equal(d.structuredDropped, true);
    assert.equal(d.slim_v1.structured, null);
    assert.equal(d.slim_v1.report, s.report);
  });

  it("a prose-only saved report (structured null) is served", () => {
    assert.equal(decideStoredDeepEssenceReuse(row("en-US", slim({ structured: null })), "en-US").reuse, true);
  });

  it("is NOT reused: placeholder fallback, empty report text, bad JSON, other locale (unchanged rules)", () => {
    assert.equal(decideStoredDeepEssenceReuse(row("en-US", slim({ llm_source: "fallback" })), "en-US").reason, "placeholder_fallback");
    assert.equal(decideStoredDeepEssenceReuse(row("en-US", slim({ report: "  " })), "en-US").reason, "no_report");
    assert.equal(decideStoredDeepEssenceReuse("{not json", "en-US").reason, "invalid_json");
    assert.equal(decideStoredDeepEssenceReuse(row("ko-KR", slim()), "en-US").reason, "locale_mismatch");
  });
});

function harness(over = {}) {
  const calls = { reserve: 0, generate: 0, persist: 0, consume: 0, release: 0, logs: [] };
  let saved = null;
  const deps = {
    reserveCredit: async () => {
      calls.reserve++;
      return { ok: true };
    },
    generate: async () => {
      calls.generate++;
      return slim();
    },
    stillOwnsLock: async () => true,
    persist: async (s) => {
      calls.persist++;
      saved = s;
      return true;
    },
    consumeCredit: async () => {
      calls.consume++;
    },
    releaseCredit: async () => {
      calls.release++;
    },
    log: (tag, e, code) => calls.logs.push(code),
    ...over,
  };
  return { deps, calls, saved: () => saved };
}

describe("credit is consumed only after the report is saved", () => {
  it("success: reserve -> generate -> persist -> consume, nothing released", async () => {
    const h = harness();
    const out = await runPersonalDeepEssenceGeneration(h.deps);
    assert.equal(out.kind, "ok");
    assert.deepEqual(
      { r: h.calls.reserve, p: h.calls.persist, c: h.calls.consume, rel: h.calls.release },
      { r: 1, p: 1, c: 1, rel: 0 },
    );
    assert.equal(h.saved().personal_v2_generation_version, PERSONAL_V2_STRUCTURED_GENERATION_VERSION);
  });

  it("C) insufficient balance -> insufficient_credit (402 path), nothing generated or saved", async () => {
    const h = harness({ reserveCredit: async () => ({ ok: false, reason: "insufficient_balance" }) });
    const out = await runPersonalDeepEssenceGeneration(h.deps);
    assert.equal(out.kind, "insufficient_credit");
    assert.deepEqual([h.calls.generate, h.calls.persist, h.calls.consume, h.calls.release], [0, 0, 0, 0]);
  });

  it("D) generation throws before save -> credit released, never consumed, nothing saved", async () => {
    const h = harness({ generate: async () => { throw new Error("LLM down"); } });
    const out = await runPersonalDeepEssenceGeneration(h.deps);
    assert.equal(out.kind, "failed");
    assert.deepEqual([h.calls.persist, h.calls.consume, h.calls.release], [0, 0, 1]);
    assert.equal(h.saved(), null);
  });

  it("D) placeholder fallback result is not saved and not charged", async () => {
    const h = harness({ generate: async () => slim({ llm_source: "fallback" }) });
    const out = await runPersonalDeepEssenceGeneration(h.deps);
    assert.deepEqual(out, { kind: "failed", status: 502, code: "llm_fallback" });
    assert.deepEqual([h.calls.persist, h.calls.consume, h.calls.release], [0, 0, 1]);
  });

  it("D) lost generation lock -> not saved, not charged", async () => {
    const h = harness({ stillOwnsLock: async () => false });
    const out = await runPersonalDeepEssenceGeneration(h.deps);
    assert.equal(out.kind, "failed");
    assert.deepEqual([h.calls.persist, h.calls.consume, h.calls.release], [0, 0, 1]);
  });

  it("E) save fails after generation -> error returned, credit released, never consumed", async () => {
    const h = harness({ persist: async () => false });
    const out = await runPersonalDeepEssenceGeneration(h.deps);
    assert.deepEqual(out, { kind: "failed", status: 500, code: "persist_failed" });
    assert.equal(h.calls.consume, 0);
    assert.equal(h.calls.release, 1);
    assert.ok(h.calls.logs.includes("persist_failed"));
  });

  it("E) save throws -> same: released, not consumed", async () => {
    const h = harness({ persist: async () => { throw new Error("db"); } });
    const out = await runPersonalDeepEssenceGeneration(h.deps);
    assert.equal(out.kind, "failed");
    assert.equal(h.calls.consume, 0);
    assert.equal(h.calls.release, 1);
  });

  it("a failing release does not mask the error outcome", async () => {
    const h = harness({
      persist: async () => false,
      releaseCredit: async () => { throw new Error("rpc"); },
    });
    const out = await runPersonalDeepEssenceGeneration(h.deps);
    assert.equal(out.kind, "failed");
  });

  it("no signed-in user: no credit is touched, report still saved", async () => {
    const h = harness({ reserveCredit: null });
    const out = await runPersonalDeepEssenceGeneration(h.deps);
    assert.equal(out.kind, "ok");
    assert.deepEqual([h.calls.reserve, h.calls.consume, h.calls.release], [0, 0, 0]);
  });
});

describe("B) a freshly generated report reopens without another charge (round trip)", () => {
  for (const locale of ["en-US", "ko-KR"]) {
    it(`[${locale}] generate+save once, then reopen: served from the saved row, zero extra credit work`, async () => {
      let savedText = null;
      const h = harness({
        persist: async (s) => {
          savedText = row(locale, s);
          return true;
        },
      });
      const first = await runPersonalDeepEssenceGeneration(h.deps);
      assert.equal(first.kind, "ok");
      assert.equal(h.calls.consume, 1);

      const reopen = decideStoredDeepEssenceReuse(savedText, locale);
      assert.equal(reopen.reuse, true, "reopen must be served from the saved report");
      // Reopen stops before reserve/generate/consume; the counters stay at the first generation's values.
      assert.deepEqual([h.calls.reserve, h.calls.generate, h.calls.consume], [1, 1, 1]);
    });
  }
});
