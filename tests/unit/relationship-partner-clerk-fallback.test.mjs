/**
 * Relationship premium report — partner-name Clerk-fallback regression
 * coverage (follow-up to relationship-naming-localization.test.mjs).
 *
 * Observed bug: even after the previous naming fix (which taught
 * app/api/relationship/analyze/premium/route.ts to resolve the non-viewer
 * side via a batched resolveClerkDisplayNamesByUserId lookup instead of
 * leaving it undefined), newly generated/viewed premium reports still
 * showed the generic "Partner" fallback for the OTHER participant in
 * several sections/cards ("Sera -> Partner", "What draws you to Partner",
 * "Partner was attracted to ...") while the viewer's own name resolved
 * fine.
 *
 * Root cause #1 (the actual bug, shared by every caller of the batched
 * lookup): lib/relationship/resolveClerkDisplayNames.ts's
 * fetchClerkProfilesByUserId only ever read user.publicMetadata.displayName
 * -- an app-specific field that is only ever set via Google auto-seed, the
 * legacy-user backfill, or the email/password setup modal (see
 * lib/clerk/displayNameSync.ts). Any partner who hasn't hit one of those
 * flows yet has no publicMetadata.displayName at all, even though the very
 * same Clerk User object already carries their real fullName/firstName --
 * exactly what lib/clerk/displayName.ts's resolveClerkDisplayName already
 * falls back to for the CURRENT user's own display. The partner-facing
 * batched lookup had no such cascade, so it fell straight through to the
 * generic placeholder for the common case (a partner who never explicitly
 * set an in-app display name), asymmetrically from how the viewer's own
 * name resolves (resolveViewerDisplayName does read clerkFirstName/
 * clerkFullName from currentUser()).
 *
 * Root cause #2 (independent, found in the same audit): app/api/
 * relationship/detail/route.ts -- which supplies the top-level
 * viewerName/partnerName state that every premium report card/section
 * (FriendReportView, MarriageReportView, WorkColleagueReportView,
 * RomanticSajuDeepReportView, and the client-rendered WhyYouMeUs view
 * models built from their myName/partnerName props) ultimately reads --
 * called resolveViewerDisplayName with NO `fallback` option (defaulting to
 * the hardcoded Korean "나") and resolvePartnerDisplayName with the literal
 * "상대" instead of the locale-aware messages.report.*FallbackLabel, unlike
 * its sibling analyze/premium/route.ts. In an English-locale report this
 * would leak literal Korean text whenever neither a real name nor a Clerk
 * name resolved -- the previous naming ticket's fix and its regression
 * test only ever covered analyze/premium/route.ts, not this file.
 *
 * Data vs. rendering: fixing resolveClerkDisplayNames.ts's cascade fixes
 * BOTH (a) every render-time card/section that reads the live
 * viewerName/partnerName state (self-heals immediately, including for
 * relationships that were already generated, since these are recomputed
 * on every page load from live Clerk data) and (b) future premium
 * generations' baked LLM prose (analyze/premium/route.ts's labelA/labelB
 * feed the actual prompt). It does NOT retroactively rewrite prose already
 * baked into an existing generated report's stored JSON by a past
 * generation call that resolved to the generic placeholder at the time --
 * that prose can only be corrected by regenerating.
 *
 * Run: npx tsx tests/unit/relationship-partner-clerk-fallback.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;

// Normalized to LF regardless of a file's on-disk line-ending state -- some
// files in this repo carry incidental CRLF drift from other editors, which
// is unrelated dirty state this test must not depend on either way.
function readNormalized(p) {
  return fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
}

const { resolveViewerDisplayName } = await import("../../lib/relationship/viewerFirstDisplay.ts");
const { resolvePartnerDisplayName } = await import(
  "../../lib/relationship/resolvePartnerDisplayName.ts"
);
const { getMessages } = await import("../../lib/i18n/messages/index.ts");

const enMessages = getMessages("en-US");
const koMessages = getMessages("ko-KR");

const clerkResolveSrc = readNormalized("lib/relationship/resolveClerkDisplayNames.ts");
const detailRouteSrc = readNormalized("app/api/relationship/detail/route.ts");
const premiumRouteSrc = readNormalized("app/api/relationship/analyze/premium/route.ts");

// ---------------------------------------------------------------------------
section("A — the shared Clerk lookup now falls back to fullName/firstName, not just publicMetadata.displayName");
// ---------------------------------------------------------------------------
{
  assert.ok(
    /const explicitDisplayName = sanitizeDisplayNameInput\(/.test(clerkResolveSrc),
    "the explicit publicMetadata.displayName read must still happen first (highest priority)",
  );
  const cascade =
    /const displayName =\s*\n\s*explicitDisplayName \|\|\s*\n\s*user\.fullName\?\.trim\(\) \|\|\s*\n\s*user\.firstName\?\.trim\(\) \|\|\s*\n\s*null;/;
  assert.ok(
    cascade.test(clerkResolveSrc),
    "fetchClerkProfilesByUserId must fall back explicitDisplayName -> user.fullName -> user.firstName -> null, mirroring resolveClerkDisplayName's own cascade for the current user",
  );
  ok("the batched partner Clerk lookup now has the same name cascade as the viewer's own display resolution");

  // The old, narrower single-line assignment (no cascade at all) must be gone.
  assert.ok(
    !/const displayName = sanitizeDisplayNameInput\(\s*\n\s*\(user\.publicMetadata as Record<string, unknown> \| null\)\?\.displayName,\s*\n\s*\);\s*\n\s*\/\/ hasImage/.test(
      clerkResolveSrc,
    ),
    "the old displayName assignment with no fallback beyond publicMetadata must be gone",
  );
  ok("the old publicMetadata-only resolution (no fallback at all) no longer exists");
}

// ---------------------------------------------------------------------------
section("B — app/api/relationship/detail/route.ts no longer hardcodes Korean fallback literals");
// ---------------------------------------------------------------------------
{
  assert.ok(
    detailRouteSrc.includes('import { getMessages } from "@/lib/i18n/messages";'),
    "detail/route.ts must import getMessages to build a locale-aware fallback",
  );
  assert.ok(
    /fallback: fallbackMessages\.report\.meFallbackLabel,/.test(detailRouteSrc),
    "resolveViewerDisplayName must now receive an explicit locale-aware fallback (no more silent default to the hardcoded '나')",
  );
  assert.ok(
    /fallbackMessages\.report\.partnerFallbackLabel,\s*\n\s*\);/.test(detailRouteSrc),
    "resolvePartnerDisplayName's 4th argument must now be the locale-aware partnerFallbackLabel",
  );
  assert.ok(
    !/resolvePartnerDisplayName\(\s*\n\s*partner\?\.name,\s*\n\s*partner\?\.clerk_user_id[\s\S]{0,80}undefined,\s*\n\s*"상대",/.test(
      detailRouteSrc,
    ),
    "the literal Korean \"상대\" must no longer be passed as resolvePartnerDisplayName's fallback",
  );
  ok("viewer/partner name resolution in the detail route is now locale-aware, matching the premium generation route");
}

// ---------------------------------------------------------------------------
section("C — viewer name resolves correctly");
// ---------------------------------------------------------------------------
{
  assert.equal(
    resolveViewerDisplayName({
      reportName: null,
      clerkFirstName: "Sera",
      clerkFullName: "Sera Kim",
      fallback: enMessages.report.meFallbackLabel,
    }),
    "Sera",
    "the viewer's real Clerk first name must resolve",
  );
  ok("viewer name resolves correctly when a real Clerk name is available");
}

// ---------------------------------------------------------------------------
section("D — partner name resolves correctly (the actual bug being fixed)");
// ---------------------------------------------------------------------------
{
  // Simulates what fetchClerkProfilesByUserId now returns once it falls
  // through to user.fullName/user.firstName for a partner who never set an
  // explicit publicMetadata.displayName -- previously this case produced
  // undefined all the way down to resolvePartnerDisplayName, which is what
  // caused the generic "Partner" fallback to show for a real, nameable
  // partner.
  const partnerNameFromClerkFullNameFallback = "Minji";
  assert.equal(
    resolvePartnerDisplayName(
      null,
      partnerNameFromClerkFullNameFallback,
      undefined,
      enMessages.report.partnerFallbackLabel,
    ),
    "Minji",
    "a partner name resolved via the new fullName/firstName cascade must win over the generic fallback",
  );
  ok("partner name resolves correctly once the Clerk lookup's cascade supplies a real name");
}

// ---------------------------------------------------------------------------
section("E — no generic 'Partner' appears when a partner name is available");
// ---------------------------------------------------------------------------
{
  assert.notEqual(
    resolvePartnerDisplayName(null, "Jordan", undefined, enMessages.report.partnerFallbackLabel),
    enMessages.report.partnerFallbackLabel,
    "a resolvable partner name must never be shadowed by the generic 'Partner' label",
  );
  ok("resolvePartnerDisplayName never emits the generic fallback when a real name is resolvable");
}

// ---------------------------------------------------------------------------
section("F — no '나' / '상대' ever appears in English output");
// ---------------------------------------------------------------------------
{
  const enViewerFallback = resolveViewerDisplayName({
    reportName: null,
    clerkFirstName: undefined,
    clerkFullName: undefined,
    fallback: enMessages.report.meFallbackLabel,
  });
  const enPartnerFallback = resolvePartnerDisplayName(
    null,
    undefined,
    undefined,
    enMessages.report.partnerFallbackLabel,
  );
  assert.ok(!HANGUL_RE.test(enViewerFallback), `EN viewer fallback must not contain Hangul, got: ${enViewerFallback}`);
  assert.ok(!HANGUL_RE.test(enPartnerFallback), `EN partner fallback must not contain Hangul, got: ${enPartnerFallback}`);
  assert.equal(enViewerFallback, "Me");
  assert.equal(enPartnerFallback, "Partner");
  ok("EN-locale viewer/partner fallbacks are pure English ('Me'/'Partner'), never '나'/'상대'");

  // KR behavior must remain exactly as before this fix.
  assert.equal(
    resolveViewerDisplayName({ reportName: null, clerkFirstName: undefined, clerkFullName: undefined, fallback: koMessages.report.meFallbackLabel }),
    "나",
  );
  assert.equal(
    resolvePartnerDisplayName(null, undefined, undefined, koMessages.report.partnerFallbackLabel),
    "상대",
  );
  ok("KR-locale fallbacks are unchanged ('나'/'상대')");
}

// ---------------------------------------------------------------------------
section("G — all five relationship kinds share the same (now-fixed) name resolution");
// ---------------------------------------------------------------------------
{
  // The premium generation route feeds all 5 kinds from ONE shared
  // labelA/labelB computation (see relationship-naming-localization.test.mjs
  // Section E) which calls resolveClerkDisplayNamesByUserId -- the exact
  // function fixed in Section A above. Re-asserted here, self-contained,
  // so this file alone proves the fix reaches every kind.
  assert.ok(
    premiumRouteSrc.includes(
      'import { resolveClerkDisplayNamesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";',
    ),
    "the premium generation route must still import the (now-fixed) shared Clerk lookup",
  );
  const nicknameMatches = [
    ...premiumRouteSrc.matchAll(/nicknameA:\s*labelA,\s*\n\s*nicknameB:\s*labelB,/g),
  ];
  assert.equal(
    nicknameMatches.length,
    5,
    `expected all 5 kind dispatches (romantic/work/cohabitation/family/friendship) to feed nicknameA/nicknameB from the SAME labelA/labelB, found ${nicknameMatches.length}`,
  );
  ok("all 5 relationship kinds still consume the identical labelA/labelB, now backed by the fixed Clerk cascade");

  // The client-side render path (FriendReportView / MarriageReportView /
  // WorkColleagueReportView / RomanticSajuDeepReportView) all read from the
  // SAME top-level partnerName state, which app/relationship/[id]/
  // useRelationshipDetail.ts resolves straight from detail/route.ts's
  // (now-fixed) partner_name field.
  const useDetailSrc = readNormalized("app/relationship/[id]/useRelationshipDetail.ts");
  assert.ok(
    useDetailSrc.includes("data.partner_name ?? data.display_partner_name"),
    "useRelationshipDetail must still source partnerName from the detail route's resolved field for every kind",
  );
  ok("the client-side partnerName state every kind's report view reads from is sourced from the fixed detail route");
}

// ---------------------------------------------------------------------------
section("H — Personal report flow is untouched");
// ---------------------------------------------------------------------------
{
  const personalFiles = [
    ["Personal generation hook", "lib/v1/slim/useSlimV1Integrated.ts"],
    ["Personal essence/deep page", "app/blueprint-preview/[reportId]/essence/deep/page.tsx"],
  ];
  for (const [label, path] of personalFiles) {
    const src = readNormalized(path);
    assert.ok(
      !src.includes("resolveClerkDisplayNames") && !src.includes("fallbackMessages"),
      `${label} must not reference the Relationship-only Clerk-name-cascade fix`,
    );
  }
  ok("Personal's own generation/detail files contain none of this Relationship-only fix's signals");
}

console.log("\nAll relationship-partner-clerk-fallback assertions passed.\n");
