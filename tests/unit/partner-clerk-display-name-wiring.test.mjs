/**
 * Connected-friend name not showing — root cause + fix.
 *
 * Since the Clerk publicMetadata.displayName migration
 * (app/api/account/display-name/route.ts), `reports.name` is permanently
 * null for any self-report (it's only ever written for `partner_manual`
 * manually-typed contacts, which have no Clerk account). Nothing read the
 * OTHER participant's Clerk displayName, so every real connected friend
 * (invite or connect flow, Google OAuth or any other sign-in method)
 * permanently rendered as the generic "탐사자"/"친구" placeholder in the
 * hub friend list, the relationship detail page, the relationship map, the
 * shared-analysis inbox, and (missed in the original pass, fixed after
 * live QA turned it up) the free relationship preview card — not a transient/caching issue, since nothing
 * ever populated the value being waited on.
 *
 * Fix: resolveClerkDisplayNamesByUserId batch-resolves the OTHER
 * participant's Clerk publicMetadata.displayName (public metadata is,
 * by Clerk's own design, readable across accounts — unlike
 * privateMetadata), and resolvePartnerDisplayName now checks it FIRST,
 * ahead of reports.name and the analysis-log fallback. Live-verified
 * against DEV: a real self-report's clerk_user_id correctly resolved a
 * real publicMetadata.displayName via the Clerk backend SDK (not
 * reproduced here since it needs a live Clerk secret key + Next's own env
 * loading — this suite covers the parts that don't).
 *
 * Run: npx tsx tests/unit/partner-clerk-display-name-wiring.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolvePartnerDisplayName } from "../../lib/relationship/resolvePartnerDisplayName.ts";
import {
  resolveClerkDisplayNamesByUserId,
  resolveClerkProfilesByUserId,
} from "../../lib/relationship/resolveClerkDisplayNames.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

section("A. Clerk displayName outranks reports.name and the log-derived name");
{
  assert.equal(
    resolvePartnerDisplayName("레거시이름", "동글", "무관한 로그 이름", "탐사자"),
    "동글",
    "clerk displayName wins even when reports.name and a log-derived name both exist",
  );
  assert.equal(
    resolvePartnerDisplayName(null, "동글", null, "탐사자"),
    "동글",
    "clerk displayName alone is sufficient — reports.name is null for every self-report",
  );
  ok("resolvePartnerDisplayName checks clerk displayName before reports.name/log");
}

section("B. a missing/generic clerk displayName falls through the existing chain unchanged");
{
  assert.equal(resolvePartnerDisplayName("Sera", undefined, null, "탐사자"), "Sera");
  assert.equal(resolvePartnerDisplayName(null, "탐사자", null, "친구"), "친구");
  assert.equal(resolvePartnerDisplayName(null, "", "동글", "친구"), "동글");
  ok("no clerk name (or a generic one) still falls back through reports.name -> log -> fallback exactly as before");
}

section("C. resolveClerkDisplayNamesByUserId — pure fast-path, no Clerk call needed");
{
  assert.deepEqual(await resolveClerkDisplayNamesByUserId([]), {});
  assert.deepEqual(await resolveClerkDisplayNamesByUserId([null, undefined]), {});
  ok("empty/all-nullish input short-circuits to {} without touching the Clerk API");
}

section("D. every affected aggregation point selects clerk_user_id and resolves it");
{
  const checks = [
    ["app/api/relationship/list/route.ts", "hub friend list"],
    ["app/api/relationship/detail/route.ts", "relationship detail page"],
    ["lib/relationship/map/fetchRelationshipMapConnections.ts", "relationship map"],
    ["app/api/relationship/share/inbox/route.ts", "shared-analysis inbox"],
    ["app/api/relationship/map/free-preview/route.ts", "free relationship preview"],
  ];
  for (const [file, label] of checks) {
    const src = readSrc(file);
    assert.ok(
      /clerk_user_id/.test(src) &&
        (src.includes("resolveClerkDisplayNamesByUserId") || src.includes("resolveClerkProfilesByUserId")),
      `${label} (${file}) must select clerk_user_id and call resolveClerkDisplayNamesByUserId or resolveClerkProfilesByUserId`,
    );
  }
  ok("all 5 name-resolution call sites (hub, detail, map, shared inbox, free preview) now resolve the partner's Clerk name");
}

section("E. buildSharedInboxItem accepts and prioritizes the owner's Clerk name");
{
  const src = readSrc("lib/relationship/reportShare/buildSharedInboxItem.ts");
  assert.ok(src.includes("ownerClerkDisplayName"));
  ok("buildSharedInboxItem threads ownerClerkDisplayName through to resolvePartnerDisplayName");
}

section("F. a partner_manual contact's clerk_user_id (the OWNER's own id, not the contact's) must never be resolved as a name");
{
  // Regression for: renaming yourself (Clerk publicMetadata.displayName)
  // made every manually-added friend's name change to YOUR new name too.
  // Root cause: app/api/relationship/manual/route.ts stores the creating
  // user's own clerk_user_id on a partner_manual report (needed for the
  // ownership check in partner-name/route.ts's PATCH), but every aggregation
  // point below was treating that same clerk_user_id as if it were the
  // manual contact's own identity and looking up ITS Clerk displayName —
  // which resolves to the owner's own name, since it's the owner's own id.
  const checks = [
    ["app/api/relationship/list/route.ts", "hub friend list"],
    ["app/api/relationship/detail/route.ts", "relationship detail page"],
    ["lib/relationship/map/fetchRelationshipMapConnections.ts", "relationship map"],
    ["app/api/relationship/map/free-preview/route.ts", "free relationship preview"],
  ];
  const guardPattern = /report_type\s*(!==|===)\s*"partner_manual"/;
  for (const [file, label] of checks) {
    const src = readSrc(file);
    assert.ok(
      guardPattern.test(src),
      `${label} (${file}) must guard the Clerk-name lookup/usage against partner_manual rows`,
    );
  }
  ok("hub list, detail page, map, and free preview all skip Clerk-name resolution for partner_manual contacts");
}

section("G. Friend avatars (Google/Clerk profile photo) reuse the same batched call as the name — no extra API round trip");
{
  assert.deepEqual(await resolveClerkProfilesByUserId([]), {});
  assert.deepEqual(await resolveClerkProfilesByUserId([null, undefined]), {});
  ok("resolveClerkProfilesByUserId has the same empty-input fast path as resolveClerkDisplayNamesByUserId");

  const listSrc = readSrc("app/api/relationship/list/route.ts");
  assert.ok(
    listSrc.includes("resolveClerkProfilesByUserId"),
    "hub friend list must fetch name + avatar together via resolveClerkProfilesByUserId, not a second separate Clerk call",
  );
  assert.ok(
    listSrc.includes("partner_avatar_url"),
    "hub friend list response must carry partner_avatar_url for the avatar circle to render",
  );

  const circleSrc = readSrc("components/relationship/hub/FriendAvatarCircle.tsx");
  assert.ok(circleSrc.includes("avatarUrl"), "FriendAvatarCircle must accept an avatarUrl prop");
  assert.ok(
    circleSrc.includes("friendInitials(name)"),
    "FriendAvatarCircle must still fall back to initials (no avatar, or the image failed to load)",
  );
  ok("hub list wires one combined Clerk call to partner_avatar_url, and the avatar circle falls back to initials");
}

console.log(`\n${passed} passed`);
