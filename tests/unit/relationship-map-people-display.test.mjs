/**
 * "Who's in this role" display rules (gap-closure follow-up): favorited
 * people are always shown, the rest fill up to a 30-person cap by most
 * recently added, and the scattered star-field layout is deterministic.
 *
 * Run: npx tsx tests/unit/relationship-map-people-display.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { selectDisplayedPeople, MAX_DISPLAYED_PEOPLE_PER_ROLE } = await import(
  "../../lib/relationship/map/selectDisplayedPeople.ts"
);
const { scatterPositions } = await import("../../lib/relationship/map/scatterPositions.ts");

function person(key, isFavorite, addedAt) {
  return { key, isFavorite, addedAt };
}

section("cap defaults to 30");
assert.equal(MAX_DISPLAYED_PEOPLE_PER_ROLE, 30);
ok("MAX_DISPLAYED_PEOPLE_PER_ROLE is 30");

section("under the cap: everyone shows, no reordering surprises needed");
{
  const people = [person("a", false, "2026-01-01"), person("b", true, "2026-01-02")];
  const out = selectDisplayedPeople(people);
  assert.equal(out.length, 2);
  ok("2 people, cap 30 -> both shown");
}

section("over the cap: favorites always included, rest filled by most-recent");
{
  const favorites = Array.from({ length: 5 }, (_, i) =>
    person(`fav-${i}`, true, `2020-01-${String(i + 1).padStart(2, "0")}`),
  );
  const nonFavorites = Array.from({ length: 40 }, (_, i) =>
    person(`non-${i}`, false, `2026-02-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`),
  );
  // Make non-40 the newest deterministically.
  nonFavorites[39].addedAt = "2027-01-01T00:00:00Z";
  const all = [...favorites, ...nonFavorites];
  const out = selectDisplayedPeople(all, 30);
  assert.equal(out.length, 30, "total shown must respect the cap when favorites fit within it");
  const outKeys = new Set(out.map((p) => p.key));
  for (const f of favorites) {
    assert.ok(outKeys.has(f.key), `favorite ${f.key} must always be included`);
  }
  assert.ok(outKeys.has("non-39"), "the single newest non-favorite must be included");
  ok("5 favorites + 40 non-favorites -> 30 shown: all 5 favorites + the 25 most recent non-favorites");
}

section("favorites alone can exceed the cap — they are never trimmed");
{
  const favorites = Array.from({ length: 35 }, (_, i) => person(`fav-${i}`, true, null));
  const out = selectDisplayedPeople(favorites, 30);
  assert.equal(out.length, 35, "35 favorites must all be shown even though the cap is 30");
  ok("35 favorites, cap 30 -> all 35 favorites still shown (favorites are never dropped)");
}

section("scatter positions: deterministic across calls");
{
  const keys = ["p1", "p2", "p3", "p4", "p5"];
  const run1 = scatterPositions(keys);
  const run2 = scatterPositions(keys);
  assert.deepEqual(run1, run2, "same keys must always produce the same layout");
  ok("scatterPositions(keys) is deterministic — stable across re-renders");
}

section("scatter positions: stay within bounds and away from dead-center");
{
  const keys = Array.from({ length: 30 }, (_, i) => `person-${i}`);
  const points = scatterPositions(keys, { minRadiusPct: 20, maxRadiusPct: 46 });
  assert.equal(points.length, 30);
  for (const p of points) {
    const dist = Math.hypot(p.leftPct - 50, p.topPct - 50);
    assert.ok(dist >= 19.5, `point for ${p.key} is too close to center (dist=${dist})`);
    assert.ok(dist <= 46.5, `point for ${p.key} drifted outside the max radius (dist=${dist})`);
    assert.ok(p.leftPct >= 0 && p.leftPct <= 100, "leftPct must stay in [0,100]");
    assert.ok(p.topPct >= 0 && p.topPct <= 100, "topPct must stay in [0,100]");
  }
  ok("all 30 scattered points stay clear of the center Sun and within the map bounds");
}

section("scatter positions: different roles/keys never collide identically");
{
  const a = scatterPositions(["shared-key"]);
  const b = scatterPositions(["shared-key"]);
  assert.deepEqual(a, b, "the same single key always lands in the same spot");
  const c = scatterPositions(["different-key"]);
  assert.notDeepEqual(a, c, "a different key must not coincidentally land in the exact same spot");
  ok("distinct keys map to distinct deterministic positions");
}

console.log("\nAll relationship-map people-display tests passed.");
