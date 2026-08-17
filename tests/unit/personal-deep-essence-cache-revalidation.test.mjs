/**
 * Master Cleanup Batch 1 — Personal server-side cache shape revalidation.
 *
 * Root cause: app/api/v2/deep/essence/route.ts's read-before-generate path
 * only checked `parsed.locale === locale && parsed.slim_v1` (truthy check)
 * before trusting a stored report_analyses row and returning it as-is. It
 * never re-validated `parsed.slim_v1.structured` against the CURRENT Deep
 * Essence schema — that check only happened client-side
 * (StitchDeepEssenceView.tsx's isDeepEssenceStructuredReport gate). A
 * structurally stale/malformed server-persisted row would be returned to
 * the client, only "caught" by whichever client happened to re-check it.
 *
 * Fix: reuse the SAME canonical validator already used client-side
 * (isDeepEssenceStructuredReport, from lib/report/deepEssenceStructuredSchema.ts
 * — no second/new validation model invented) on the server read path too.
 * `structured === null` remains a legitimate trusted value (prose-only
 * fallback already occurred); anything else must pass the current schema
 * or the route falls through to its existing regenerate path.
 *
 * This test has two parts:
 *  1. Behavioral: proves the REUSED validator itself correctly distinguishes
 *     a valid current-shape report from structurally-stale/malformed ones
 *     (not just "does the field exist" — full required-field shape checks).
 *  2. Source-wiring: proves the actual route.ts file calls that validator
 *     as part of its cache-trust decision (matching the established
 *     source-pattern-verification convention already used for testing
 *     route.ts files in this repo, e.g.
 *     tests/unit/result-basic-locale-cache.test.mjs, since fully invoking a
 *     Next.js route handler here would require Clerk/Supabase
 *     infrastructure not otherwise mocked in this test suite).
 *
 * Run: npx tsx --test tests/unit/personal-deep-essence-cache-revalidation.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { isDeepEssenceStructuredReport } from "../../lib/report/deepEssenceStructuredSchema.ts";
import { PERSONAL_V2_STRUCTURED_GENERATION_VERSION } from "../../lib/v1/slim/types.ts";

function validStrengthOrWatchout(n) {
  return { title: `Item ${n}`, body: "A reasonably long descriptive body sentence." };
}

/** A) A fully valid, current-shape DeepEssenceStructuredReport. */
function validCurrentReport() {
  return {
    summary: {
      core_mode: "Reflective independence",
      energy_balance: "56 / 40",
      growth_edge: "Connection depth",
    },
    radar_potential: {
      autonomy: 60, connection: 55, stability: 50, growth: 65, structure: 45, adaptability: 55,
    },
    strengths: [validStrengthOrWatchout(1), validStrengthOrWatchout(2), validStrengthOrWatchout(3)],
    watchouts: [validStrengthOrWatchout(1), validStrengthOrWatchout(2), validStrengthOrWatchout(3)],
    energy: {
      headline: "Your energy flows best in balanced environments.",
      balance_pct: 40,
      bars: [
        { label: "Energy spent on people & relationships", value: 56, tone: "highlight" },
        { label: "Energy returning to you", value: 40, tone: "accent" },
        { label: "Solo recovery time", value: 70, tone: "ink" },
      ],
      summary: "A reasonably long energy summary paragraph.",
      fuels: ["Quiet reflection", "Deep conversation", "Creative projects"],
      drains: ["Large gatherings", "Overcommitting", "Chaotic environments"],
      optimal: ["Low-key gatherings", "Quiet spaces"],
    },
    relationships: {
      pattern: "A description of how this person connects with others.",
      fit: ["values independence", "appreciates empathy", "seeks meaning"],
      friction: ["overly rigid", "avoids vulnerability", "struggles with depth"],
      compare: [
        { wound: "feeling lonely despite company", steady: "one meaningful conversation at a time" },
        { wound: "pressure to connect too fast", steady: "building connection gradually" },
        { wound: "feeling misunderstood", steady: "expressing needs clearly" },
      ],
    },
    playbook: {
      rule: "A concrete operating principle for recurring situations.",
      rows: [
        { situation: "a friend reaches out", old: "general advice", better: "share a personal story" },
        { situation: "feeling overwhelmed", old: "withdraw completely", better: "find a quiet space" },
        { situation: "a conflict arises", old: "keep feelings inside", better: "express and schedule a time to talk" },
      ],
      heated: "Take a step back, breathe, and respond thoughtfully later.",
      reset: "Each week, carve out 30 minutes for quiet reflection.",
    },
    future: {
      remember: [
        "Lean into independent decision-making when it feels right.",
        "Stay aware of the tendency to withdraw from deeper connection.",
        "Prioritize environments that allow flexibility and autonomy.",
      ],
      leap: "Choose more opportunities to connect deeply while maintaining independence.",
    },
    closing: "A warm, complete closing paragraph that wraps up the whole report.",
    checklist: [
      "Reach out to a friend this week.",
      "Set aside 30 minutes for quiet reflection.",
      "Identify one instance to express your needs more clearly.",
      "Schedule a low-key gathering with a close friend.",
      "Notice how you feel in social settings this week.",
      "Try a new activity with a friend this week.",
      "Reflect on a recent interaction that felt significant.",
      "Pick one day this week and write down a memorable moment.",
    ],
  };
}

describe("Personal Deep Essence cache revalidation — validator behavior (reused, not reinvented)", () => {
  it("A) accepts a fully valid, current-shape cached report", () => {
    assert.equal(isDeepEssenceStructuredReport(validCurrentReport()), true);
  });

  it("B) rejects a structurally stale cached report missing a required Part B field (e.g. pre-checklist-era row)", () => {
    const stale = validCurrentReport();
    delete stale.checklist;
    assert.equal(isDeepEssenceStructuredReport(stale), false);
  });

  it("B) rejects a structurally stale cached report with the wrong energy.bars length (pre-3-bar-schema row)", () => {
    const stale = validCurrentReport();
    stale.energy.bars = [stale.energy.bars[0]];
    assert.equal(isDeepEssenceStructuredReport(stale), false);
  });

  it("C) rejects a malformed/partial cached report (wrong type for a required field)", () => {
    const malformed = validCurrentReport();
    malformed.summary = null;
    assert.equal(isDeepEssenceStructuredReport(malformed), false);
  });

  it("C) rejects a malformed/partial cached report (truncated mid-object, only a few keys survive)", () => {
    const truncated = { summary: validCurrentReport().summary };
    assert.equal(isDeepEssenceStructuredReport(truncated), false);
  });

  it("null structured (legitimate prose-only fallback state) is a distinct, still-supported case — not schema-checked as an object", () => {
    // The route's fix treats `structured === null` as trustworthy on its own
    // (existing supported fallback behavior), never passing null itself
    // through isDeepEssenceStructuredReport as if it were a report object.
    assert.equal(isDeepEssenceStructuredReport(null), false);
  });
});

describe("app/api/v2/deep/essence/route.ts — server read path re-validates before trusting cache (source wiring)", () => {
  const src = fs.readFileSync("app/api/v2/deep/essence/route.ts", "utf8");

  it("imports the canonical, already-client-side-used validator (no second validation model invented)", () => {
    assert.match(
      src,
      /import\s*\{\s*isDeepEssenceStructuredReport\s*\}\s*from\s*"@\/lib\/report\/deepEssenceStructuredSchema"/,
      "route must import the existing canonical validator, not a new one",
    );
  });

  it("computes a structured-trustworthiness check before the cache-hit return", () => {
    assert.match(
      src,
      /structured\s*===\s*null\s*\|\|\s*isDeepEssenceStructuredReport\(structured\)/,
      "route must treat null as trustworthy and otherwise require schema validation",
    );
  });

  it("the cache-hit branch now gates on locale match, slim_v1 presence, structured trustworthiness, AND generation currency", () => {
    assert.match(
      src,
      /if \(\s*parsed\.locale === locale &&\s*parsed\.slim_v1 &&\s*structuredIsTrustworthy &&\s*generationIsCurrent\s*\) \{/,
      "cache-hit condition must include both the structured-shape gate and the Personal V2 generation-version gate",
    );
  });

  it("does NOT gate the cache-hit on locale+slim_v1 alone anymore (regression guard against reverting the fix)", () => {
    assert.doesNotMatch(
      src,
      /if \(parsed\.locale === locale && parsed\.slim_v1\) \{/,
      "the old, unguarded cache-hit condition must not reappear",
    );
  });

  it("does NOT gate the cache-hit on structuredIsTrustworthy alone anymore (regression guard against dropping the generation-version fix)", () => {
    assert.doesNotMatch(
      src,
      /if \(parsed\.locale === locale && parsed\.slim_v1 && structuredIsTrustworthy\) \{/,
      "the pre-generation-version-fix cache-hit condition must not reappear",
    );
  });

  it("regeneration path (runSlimIntegratedReport) remains the fallback for a failed cache-trust check — same code path used when no cache exists at all", () => {
    // The route has exactly one call to runSlimIntegratedReport, reached
    // whenever the `if (stored) { ... return ... }` block does not return —
    // i.e. both "no stored row" and "stored row failed revalidation" funnel
    // into the same, already-existing regeneration path (no new behavior
    // invented for the stale/invalid case).
    const generateCalls = src.match(/runSlimIntegratedReport\(/g) ?? [];
    assert.equal(generateCalls.length, 1, "there should be exactly one generation code path, reused for both no-cache and stale-cache");
  });
});

/**
 * Personal V2 Cache Guard Fix.
 *
 * Root cause (confirmed by re-reading the same files this test already
 * covers): isDeepEssenceStructuredReport only checks REQUIRED fields.
 * layered_identity / axis_interpretations (and every other Batch 3+
 * grounding field) are optional in the schema, so a report_analyses row
 * persisted before the Personal V2 grounding pipeline shipped still passes
 * structuredIsTrustworthy and was reused forever via the read-before-generate
 * path above — never regenerated, regardless of how out of date its content
 * actually was.
 *
 * Fix: stamp every generation with PERSONAL_V2_STRUCTURED_GENERATION_VERSION
 * (lib/v1/slim/types.ts) and require a stored row's stamp to be >= the
 * current constant before reusing it. A row with no stamp at all (every
 * pre-fix row) defaults to 0, which is always older than the current
 * version, so it always falls through to regeneration — exactly like the
 * "no stored row" case already does. `structured === null` (legitimate
 * prose-only fallback) is exempt, matching the existing rule directly above.
 *
 * This does not touch Personal CE / canonical saju logic, layered identity
 * interpretation, current x innate logic, prompts, or the UI — only the
 * reuse-vs-regenerate decision in route.ts, plus the wrapper type/stamp in
 * runSlimIntegratedReport.ts, plus the localStorage cache version in
 * slimIntegratedCache.ts.
 */
describe("Personal V2 Cache Guard Fix — generation-version gate", () => {
  // Mirrors the exact comparison route.ts performs, without needing to
  // invoke the full Next.js route handler (same rationale as the
  // source-wiring tests above: Clerk/Supabase aren't mocked in this suite).
  function generationIsCurrent(structured, personalV2GenerationVersion) {
    const storedGenerationVersion = personalV2GenerationVersion ?? 0;
    return (
      structured === null ||
      storedGenerationVersion >= PERSONAL_V2_STRUCTURED_GENERATION_VERSION
    );
  }

  it("a legacy row with no personal_v2_generation_version stamp at all is treated as stale", () => {
    assert.equal(generationIsCurrent(validCurrentReport(), undefined), false);
  });

  it("a row explicitly stamped with an older version number is treated as stale", () => {
    assert.equal(
      generationIsCurrent(validCurrentReport(), PERSONAL_V2_STRUCTURED_GENERATION_VERSION - 1),
      false,
    );
  });

  it("a row stamped with the current version is treated as current (reusable)", () => {
    assert.equal(
      generationIsCurrent(validCurrentReport(), PERSONAL_V2_STRUCTURED_GENERATION_VERSION),
      true,
    );
  });

  it("a stored prose-only fallback (structured: null) is exempt from the version check, regardless of stamp", () => {
    assert.equal(generationIsCurrent(null, undefined), true);
  });

  it("PERSONAL_V2_STRUCTURED_GENERATION_VERSION is a positive integer (sane constant)", () => {
    assert.equal(Number.isInteger(PERSONAL_V2_STRUCTURED_GENERATION_VERSION), true);
    assert.ok(PERSONAL_V2_STRUCTURED_GENERATION_VERSION >= 1);
  });
});

describe("Personal V2 Cache Guard Fix — source wiring", () => {
  const routeSrc = fs.readFileSync("app/api/v2/deep/essence/route.ts", "utf8");
  const typesSrc = fs.readFileSync("lib/v1/slim/types.ts", "utf8");
  const runnerSrc = fs.readFileSync("lib/v1/slim/runSlimIntegratedReport.ts", "utf8");
  const clientCacheSrc = fs.readFileSync("lib/v1/slim/slimIntegratedCache.ts", "utf8");

  it("route.ts imports PERSONAL_V2_STRUCTURED_GENERATION_VERSION from the wrapper types module (no second constant invented)", () => {
    assert.match(
      routeSrc,
      /PERSONAL_V2_STRUCTURED_GENERATION_VERSION[\s\S]*?from\s*"@\/lib\/v1\/slim\/types"/,
      "route.ts must import the single canonical version constant",
    );
  });

  it("route.ts defaults a missing stamp to 0 before comparing (so unstamped legacy rows are always stale)", () => {
    assert.match(
      routeSrc,
      /parsed\.slim_v1\?\.personal_v2_generation_version\s*\?\?\s*0/,
      "route.ts must default the stored stamp to 0 when absent",
    );
  });

  it("route.ts's generationIsCurrent computation exempts structured === null (legacy fallback untouched)", () => {
    assert.match(
      routeSrc,
      /generationIsCurrent\s*=\s*\n?\s*structured === null \|\|/,
      "the generation-currency check must short-circuit true when structured is the legitimate null fallback",
    );
  });

  it("lib/v1/slim/types.ts exports PERSONAL_V2_STRUCTURED_GENERATION_VERSION and the optional field it stamps", () => {
    assert.match(typesSrc, /export const PERSONAL_V2_STRUCTURED_GENERATION_VERSION = \d+;/);
    assert.match(typesSrc, /personal_v2_generation_version\?:\s*number;/);
  });

  it("runSlimIntegratedReport.ts stamps every generation with the current version constant", () => {
    assert.match(
      runnerSrc,
      /personal_v2_generation_version:\s*PERSONAL_V2_STRUCTURED_GENERATION_VERSION/,
    );
  });

  it("client localStorage cache version was bumped past 3 (forces refetch of any pre-fix cached entry)", () => {
    assert.match(clientCacheSrc, /export const SLIM_INTEGRATED_CACHE_VERSION = (\d+);/);
    const [, versionStr] = clientCacheSrc.match(/export const SLIM_INTEGRATED_CACHE_VERSION = (\d+);/);
    assert.ok(Number(versionStr) > 3, "SLIM_INTEGRATED_CACHE_VERSION must be bumped past its pre-fix value of 3");
  });

  it("client localStorage legacy-key cleanup now also removes the old v3 key (not just v1/v2)", () => {
    assert.match(clientCacheSrc, /\$\{PREFIX\}v3_\$\{locale\}_\$\{reportId\}/);
  });
});
