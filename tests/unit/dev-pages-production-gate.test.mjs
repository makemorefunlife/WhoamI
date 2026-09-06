/**
 * app/dev/** exposure regression (legacy/dead-code audit, 2026-09-07):
 * three of six dev preview pages had NO runtime gate at all (reachable in
 * production if the URL was known/guessed), and a fourth's gate could be
 * bypassed because it also accepted an env flag that defaults ON in
 * production (isRomanticV4ReportEnabled). Fixed by making every app/dev/*
 * page require NODE_ENV==="development" by default.
 *
 * relationship-enrichment-review is the one deliberate exception: it keeps
 * its ALLOW_ENRICHMENT_DEV=1 override as an intentional staging/preview
 * escape hatch (content review on a deployed environment) — the cleanup
 * goal was blocking general production exposure, not removing a designed
 * opt-in. It must still default to blocked outside development; the
 * override only ANDs in an explicit opt-out, never an unconditional OR.
 *
 * This test guards against: any dev page losing its gate, the V4-flag
 * bypass recurring anywhere, the ALLOW_ENRICHMENT_DEV override leaking onto
 * a page other than the one it belongs to, and that override ever becoming
 * a standalone bypass instead of a conjunction with the NODE_ENV check.
 *
 * Run: npx tsx tests/unit/dev-pages-production-gate.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devDir = path.resolve(__dirname, "../../app/dev");

const pagePaths = readdirSync(devDir)
  .filter((name) => statSync(path.join(devDir, name)).isDirectory())
  .map((name) => path.join(devDir, name, "page.tsx"))
  .filter((p) => {
    try {
      statSync(p);
      return true;
    } catch {
      return false;
    }
  });

section("A. every app/dev/* subfolder has a page.tsx and at least one was found");
{
  assert.ok(pagePaths.length >= 6, `expected at least 6 dev pages, found ${pagePaths.length}`);
  ok(`found ${pagePaths.length} app/dev/*/page.tsx files`);
}

section("B. every dev page unconditionally gates on NODE_ENV !== \"development\"");
{
  for (const p of pagePaths) {
    const src = readFileSync(p, "utf8");
    const rel = path.relative(path.resolve(__dirname, "../.."), p);

    assert.match(
      src,
      /notFound\s*\(\s*\)/,
      `${rel} must call notFound() somewhere`,
    );
    assert.match(
      src,
      /process\.env\.NODE_ENV\s*!==\s*["']development["']/,
      `${rel} must gate on NODE_ENV !== "development"`,
    );
    ok(`${rel} calls notFound() behind a NODE_ENV !== "development" check`);
  }
}

section("C. the romantic V4 feature flag never gates any dev page's visibility");
{
  // It defaults ON in production (see romanticV4ReportFlag.ts), so OR'ing
  // it in — as romantic-v4-content-prototype used to — defeats the
  // NODE_ENV gate entirely for that page.
  for (const p of pagePaths) {
    const src = readFileSync(p, "utf8");
    const rel = path.relative(path.resolve(__dirname, "../.."), p);
    assert.doesNotMatch(
      src,
      /isRomanticV4ReportEnabled/,
      `${rel} must not use isRomanticV4ReportEnabled to gate visibility`,
    );
  }
  ok("no dev page uses the romantic V4 flag (which defaults ON in production) to gate visibility");
}

section("D. ALLOW_ENRICHMENT_DEV stays scoped to relationship-enrichment-review only, as a conjunction not a bypass");
{
  const enrichmentReviewPath = pagePaths.find((p) =>
    p.includes(path.join("relationship-enrichment-review", "page.tsx")),
  );
  assert.ok(enrichmentReviewPath, "relationship-enrichment-review/page.tsx must exist");

  for (const p of pagePaths) {
    if (p === enrichmentReviewPath) continue;
    const src = readFileSync(p, "utf8");
    const rel = path.relative(path.resolve(__dirname, "../.."), p);
    assert.doesNotMatch(
      src,
      /ALLOW_ENRICHMENT_DEV/,
      `${rel} must not carry the enrichment-review-only ALLOW_ENRICHMENT_DEV override`,
    );
  }
  ok("no other dev page carries the ALLOW_ENRICHMENT_DEV override");

  const enrichmentSrc = readFileSync(enrichmentReviewPath, "utf8");
  assert.match(
    enrichmentSrc,
    /NODE_ENV\s*!==\s*["']development["']\s*&&\s*process\.env\.ALLOW_ENRICHMENT_DEV\s*!==\s*["']1["']/,
    "relationship-enrichment-review must require BOTH NODE_ENV !== 'development' AND ALLOW_ENRICHMENT_DEV !== '1' to notFound() — blocked by default, opened only by an explicit override",
  );
  ok("relationship-enrichment-review is blocked by default outside development, and opens only via an explicit ALLOW_ENRICHMENT_DEV=1 override");
}

section("E. no dev page uses the weaker NODE_ENV==='production' check");
{
  // Gating only "in production" (rather than "not in development") leaves
  // any other non-development environment (an unset/'test' NODE_ENV on some
  // CI or preview setup) completely unguarded.
  for (const p of pagePaths) {
    const src = readFileSync(p, "utf8");
    const rel = path.relative(path.resolve(__dirname, "../.."), p);
    assert.doesNotMatch(
      src,
      /NODE_ENV\s*===\s*["']production["']/,
      `${rel} must gate on NODE_ENV !== "development", not NODE_ENV === "production"`,
    );
  }
  ok("no dev page uses the weaker NODE_ENV==='production' check");
}

console.log("\nAll app/dev/* production-gate regression checks passed.");
