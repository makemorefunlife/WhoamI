import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Work Batch 2 SSOT alignment — container width, body rhythm, and responsive breakpoints", () => {
  const workAdapter = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/workColleague/editorial/workEditorialAdapter.tsx"),
    "utf8"
  );
  assert.ok(
    workAdapter.includes("max-w-[880px]"),
    "WorkEditorialHero container width must be max-w-[880px]"
  );
  assert.ok(
    !workAdapter.includes("max-w-[820px]"),
    "WorkEditorialHero container width must not use legacy 820px"
  );
  assert.ok(
    workAdapter.includes("leading-[1.85]"),
    "Work primary body copy must use leading-[1.85] body rhythm"
  );

  const workRenderer = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/workColleague/sections/SectionRenderer.tsx"),
    "utf8"
  );
  assert.ok(
    workRenderer.includes("max-w-[880px]"),
    "Work SectionRenderer overview container width must be max-w-[880px]"
  );
  assert.ok(
    workRenderer.includes("md:grid-cols-2"),
    "Work long-text 2-person comparison cards must use md:grid-cols-2 breakpoint"
  );
});

test("Family Batch 2 SSOT alignment — container width, body rhythm, and responsive breakpoints", () => {
  const familyAdapter = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/familyParent/editorial/familyEditorialAdapter.tsx"),
    "utf8"
  );
  assert.ok(
    familyAdapter.includes("max-w-[880px]"),
    "FamilyEditorialHero container width must be max-w-[880px]"
  );
  assert.ok(
    !familyAdapter.includes("max-w-[820px]"),
    "FamilyEditorialHero container width must not use legacy 820px"
  );
  assert.ok(
    familyAdapter.includes("leading-[1.85]"),
    "Family primary body copy must use leading-[1.85] body rhythm"
  );

  const familyRenderer = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/familyParent/sections/SectionRenderer.tsx"),
    "utf8"
  );
  assert.ok(
    familyRenderer.includes("md:grid-cols-2"),
    "Family long-text comparison cards must use md:grid-cols-2 breakpoint"
  );
});
