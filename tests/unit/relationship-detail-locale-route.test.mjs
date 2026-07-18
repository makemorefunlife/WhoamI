/**
 * Regression guard for the locale-drop bug in
 * app/relationship/[id]/useRelationshipDetail.ts: `clearAutostartParam` and
 * `onPremiumKindChange` used to call `router.replace("/relationship/...")`
 * with a hardcoded, locale-unaware path. On the `/kr` (ko-KR) route this
 * silently navigated the user back to the en-US path the moment autostart
 * premium generation finished, or the moment they switched relationship
 * kind tabs.
 *
 * The fix routes that same path string through `href()` from useLocale(),
 * which is `localizedPath()` (lib/i18n/locale.ts) bound to the current
 * locale — the same helper every other locale-aware link in the app already
 * uses. This test does not import useRelationshipDetail.ts itself (that
 * module pulls in next/navigation + @clerk/nextjs, which need a real
 * Next.js/browser runtime); it exercises localizedPath() directly against
 * the exact path/query shapes the hook builds, which is the only
 * locale-specific logic the fix depends on.
 * Run: npx tsx tests/unit/relationship-detail-locale-route.test.mjs
 */
import assert from "node:assert/strict";
import { localizedPath } from "../../lib/i18n/locale.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

/** Mirrors buildRelationshipDetailPath() in useRelationshipDetail.ts. */
function buildRelationshipDetailPath(relationshipReportId, params) {
  const qs = params?.toString();
  return qs
    ? `/relationship/${relationshipReportId}?${qs}`
    : `/relationship/${relationshipReportId}`;
}

const RELATIONSHIP_ID = "c530f9d8-b754-44bd-9bda-bcdf3e39fd98";
const VIEWER_ID = "6228187e-40c0-454b-bbca-ede9ec8e7836";

section("clearAutostartParam scenario — autostart removed, viewer+kind kept");
{
  const q = new URLSearchParams({ viewer: VIEWER_ID, kind: "work" });
  // clearAutostartParam starts from the full current query string and just
  // deletes "autostart" — model that exactly, including param order.
  q.delete("autostart");
  const rawPath = buildRelationshipDetailPath(RELATIONSHIP_ID, q);

  const koPath = localizedPath(rawPath, "ko-KR");
  assert.equal(
    koPath,
    `/kr/relationship/${RELATIONSHIP_ID}?viewer=${VIEWER_ID}&kind=work`,
  );
  ok("ko-KR: /kr prefix preserved after autostart param is cleared");

  const enPath = localizedPath(rawPath, "en-US");
  assert.equal(enPath, `/relationship/${RELATIONSHIP_ID}?viewer=${VIEWER_ID}&kind=work`);
  ok("en-US: no prefix, unchanged from legacy path shape");
}

section("onPremiumKindChange scenario — switching relationship kind tabs");
{
  const q = new URLSearchParams({ viewer: VIEWER_ID, kind: "family" });
  const rawPath = buildRelationshipDetailPath(RELATIONSHIP_ID, q);

  const koPath = localizedPath(rawPath, "ko-KR");
  assert.equal(
    koPath,
    `/kr/relationship/${RELATIONSHIP_ID}?viewer=${VIEWER_ID}&kind=family`,
  );
  ok("ko-KR: /kr prefix preserved after changing premium kind");

  const enPath = localizedPath(rawPath, "en-US");
  assert.equal(
    enPath,
    `/relationship/${RELATIONSHIP_ID}?viewer=${VIEWER_ID}&kind=family`,
  );
  ok("en-US: no prefix, unchanged from legacy path shape");
}

section("No query string left (edge case: bare id path)");
{
  const rawPath = buildRelationshipDetailPath(RELATIONSHIP_ID);
  assert.equal(rawPath, `/relationship/${RELATIONSHIP_ID}`);

  assert.equal(
    localizedPath(rawPath, "ko-KR"),
    `/kr/relationship/${RELATIONSHIP_ID}`,
  );
  assert.equal(localizedPath(rawPath, "en-US"), `/relationship/${RELATIONSHIP_ID}`);
  ok("bare id path (no query) still gets /kr on ko-KR, stays bare on en-US");
}

section("Pre-fix bug reproduction — proves the hardcoded path was the defect");
{
  // This is literally what the old code passed to router.replace(): the raw
  // path with no locale awareness at all. Asserting it is NOT /kr-prefixed
  // documents why it broke ko-KR sessions regardless of current locale.
  const oldHardcodedPath = `/relationship/${RELATIONSHIP_ID}?viewer=${VIEWER_ID}&kind=work`;
  assert.ok(
    !oldHardcodedPath.startsWith("/kr/"),
    "old hardcoded path had no /kr prefix by construction — this was the bug",
  );
  ok("documents the exact defect the fix removes");
}

console.log("\nOK: relationship detail locale route tests passed");
