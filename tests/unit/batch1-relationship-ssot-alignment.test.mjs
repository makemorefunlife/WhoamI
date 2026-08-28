import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Marriage Batch 1 SSOT alignment — container width and responsive breakpoints", () => {
  const heroFile = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/marriage/editorial/marriageEditorialAdapter.tsx"),
    "utf8"
  );
  assert.ok(
    heroFile.includes("max-w-[880px]"),
    "MarriageEditorialHero container width must be max-w-[880px]"
  );
  assert.ok(
    !heroFile.includes("max-w-[820px]"),
    "MarriageEditorialHero container width must not use legacy 820px"
  );

  const ch07File = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/marriage/sections/MarriageChapter07View.tsx"),
    "utf8"
  );
  assert.ok(
    ch07File.includes("md:grid-cols-2"),
    "Marriage Chapter 07 2-person comparison grids must use md:grid-cols-2 breakpoint"
  );

  const ch08File = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/marriage/sections/MarriageChapter08View.tsx"),
    "utf8"
  );
  assert.ok(
    ch08File.includes("md:grid-cols-2"),
    "Marriage Chapter 08 2-person comparison grids must use md:grid-cols-2 breakpoint"
  );
});

test("Friend Batch 1 SSOT alignment — container width and shared primitives", () => {
  const friendRendererFile = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/friend/sections/SectionRenderer.tsx"),
    "utf8"
  );
  assert.ok(
    friendRendererFile.includes("max-w-[880px]"),
    "Friend footer container width must be max-w-[880px]"
  );
  assert.ok(
    !friendRendererFile.includes("max-w-[820px]"),
    "Friend footer container width must not use legacy 820px"
  );

  const friendEditorialFile = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/friend/editorial/FriendEditorialSections.tsx"),
    "utf8"
  );
  assert.ok(
    friendEditorialFile.includes("ChapterSection"),
    "Friend editorial sections must import shared ChapterSection primitive"
  );
});
