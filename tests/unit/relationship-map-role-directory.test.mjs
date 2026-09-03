/**
 * Role directory pagination (spec sections 16-20): the lower panel must
 * expose the COMPLETE role membership (not the ~30-cap scatter selection),
 * paginated, newest-added first, with no duplicates across pages.
 *
 * Run: npx tsx tests/unit/relationship-map-role-directory.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { paginateRoleDirectory } = await import(
  "../../lib/relationship/map/paginateRoleDirectory.ts"
);
const { selectDisplayedPeople, MAX_DISPLAYED_PEOPLE_PER_ROLE } = await import(
  "../../lib/relationship/map/selectDisplayedPeople.ts"
);

function person(key, addedAt, isFavorite = false) {
  return { key, addedAt, isFavorite };
}

section("directory exposes everyone, scatter caps at 30 — same input, different sizes");
{
  const all = Array.from({ length: 45 }, (_, i) =>
    person(`p${i}`, `2026-01-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`),
  );
  const scatter = selectDisplayedPeople(all);
  const directoryFirstPage = paginateRoleDirectory(all, 0, 20);

  assert.equal(scatter.length, MAX_DISPLAYED_PEOPLE_PER_ROLE, "scatter still caps at 30");
  assert.equal(directoryFirstPage.total, 45, "directory total must be the FULL count, not the scatter cap");
  ok(`45 people: scatter shows ${scatter.length}, directory reports total=${directoryFirstPage.total}`);
}

section("pagination: no duplicates and no gaps across pages");
{
  const all = Array.from({ length: 37 }, (_, i) => person(`p${i}`, `2026-02-${String((i % 28) + 1).padStart(2, "0")}`));
  const seen = new Set();
  let offset = 0;
  let pages = 0;
  while (offset !== null) {
    const page = paginateRoleDirectory(all, offset, 12);
    for (const p of page.people) {
      assert.ok(!seen.has(p.key), `duplicate person ${p.key} across pages`);
      seen.add(p.key);
    }
    offset = page.nextOffset;
    pages += 1;
    assert.ok(pages < 10, "sanity bound — pagination should terminate");
  }
  assert.equal(seen.size, 37, "every person must appear exactly once across all pages");
  ok(`37 people paged 12-at-a-time across ${pages} pages — all 37 seen exactly once, no duplicates`);
}

section("newest-added-first ordering");
{
  const all = [
    person("old", "2020-01-01T00:00:00Z"),
    person("newest", "2027-01-01T00:00:00Z"),
    person("middle", "2024-06-01T00:00:00Z"),
  ];
  const page = paginateRoleDirectory(all, 0, 20);
  assert.deepEqual(page.people.map((p) => p.key), ["newest", "middle", "old"]);
  ok("directory orders newest-added first");
}

section("empty role: directory reports zero, no crash");
{
  const page = paginateRoleDirectory([], 0, 20);
  assert.equal(page.total, 0);
  assert.equal(page.people.length, 0);
  assert.equal(page.nextOffset, null);
  ok("zero-person role -> total 0, empty page, nextOffset null");
}

console.log("\nAll relationship-map role directory tests passed.");
