/**
 * Regenerate-confirm UX + stale-cache-never-auto-regenerates fix.
 *
 * Root cause this closes: GET /api/relationship/detail hid a saved premium
 * block from the client whenever its staleness guard failed (version bump,
 * incomplete structure), which made `premium_ready` false even though a
 * result already existed. Combined with autostart=1 defaulting to true for
 * every premium kind (lib/relationship/hubNavigation.ts), this silently
 * called POST /analyze/premium — whose own cache gate ALSO treated
 * "stale" as "must regenerate" even without force_regenerate — burning an
 * LLM call and a credit reservation with zero user confirmation, and the
 * manual "다시 분석하기" button only ever asked via a native window.confirm()
 * (easy to blow past, not the agreed-on copy/flow).
 *
 * Fix: (1) both routes now treat "does a saved result exist" as the only
 * signal that matters — staleness is no longer consulted by the auto-hide
 * or auto-regenerate paths — and (2) the manual button now opens a real
 * confirm modal, and force_regenerate:true is sent ONLY from that modal's
 * explicit "새로 분석하기"/"Create new analysis" action.
 *
 * Run: npx tsx tests/unit/relationship-premium-regenerate-confirm.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  hasPremiumCacheForKindLocale,
  getPremiumPayloadForKindLocale,
} from "../../lib/relationship/premiumByKind.ts";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/workColleague/index.ts";

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

section("A. A genuinely stale (old-version) cached block still counts as 'has a saved result'");
{
  // A real, minimally-valid report (passes isWorkColleagueDeepReport's own
  // sanity check) but deliberately OLD by the staleness guard's rule: no
  // meta.report_schema_version, no office.section_roles/section_mix_fit/
  // section_respect. This is exactly the shape isStaleWorkReportBlock()
  // rejects as stale — but that guard is no longer consulted by either
  // route's auto-hide/auto-regenerate gate.
  const byKind = {
    work: {
      byLocale: {
        "ko-KR": {
          format: WORK_COLLEAGUE_DEEP_FORMAT,
          report: {
            snapshot_panel: { relationshipGauges: [{ label: "legacy" }] },
            office: { some_legacy_field: true },
          },
        },
      },
    },
  };
  assert.equal(
    hasPremiumCacheForKindLocale(byKind, "work", "ko-KR"),
    true,
    "existence check must be true regardless of schema/engine version",
  );
  const cached = getPremiumPayloadForKindLocale(byKind, "work", "ko-KR");
  assert.ok(cached, "the stale block itself must still be retrievable, not treated as absent");
  ok("hasPremiumCacheForKindLocale/getPremiumPayloadForKindLocale are staleness-blind (existence-only)");
}

section("B. POST /analyze/premium route no longer branches on staleness at all");
{
  const src = readSrc("app/api/relationship/analyze/premium/route.ts");
  assert.equal(
    /isStale/.test(src),
    false,
    "no isStale* identifier should remain anywhere in the premium route — it must never decide whether to call the LLM",
  );
  assert.ok(
    src.includes("!forceRegenerate && hasPremiumCacheForKindLocale(byKind, kind, locale)"),
    "the cache gate must be a single unconditional existence check",
  );
  assert.equal(
    src.includes("reportStalenessGuard"),
    false,
    "the route must not import the staleness guard module at all",
  );
  ok("premium route: cache-exists is the only gate; forceRegenerate is the only bypass");
}

section("C. GET /api/relationship/detail route no longer hides content because it's stale");
{
  const src = readSrc("app/api/relationship/detail/route.ts");
  assert.equal(
    src.includes("reportStalenessGuard"),
    false,
    "the detail route must not import the staleness guard module at all",
  );
  for (const [field, raw] of [
    ["workColleagueDeepReport", "workColleagueDeepRaw"],
    ["cohabitationDeepReport", "cohabitationDeepRaw"],
    ["familyDeepReport", "familyDeepRaw"],
    ["friendshipDeepReport", "friendshipDeepRaw"],
  ]) {
    const re = new RegExp(`const ${field} = ${raw}\\s*\\n?\\s*\\? `);
    assert.ok(
      re.test(src),
      `${field} must be populated from ${raw} by existence alone (found no match for ${re})`,
    );
  }
  ok("detail route: all 4 deep-report fields are existence-gated only, never staleness-gated");
}

section("D. Regenerate button opens a confirm modal — never calls the API directly");
{
  const src = readSrc("app/relationship/[id]/useRelationshipDetail.ts");
  assert.equal(
    src.includes("window.confirm"),
    false,
    "the native window.confirm() must be gone — replaced by a real modal",
  );
  assert.equal(src.includes("regenerateConfirm"), false, "the old i18n key must no longer be referenced");

  const openMatch = src.match(
    /const regeneratePremium = useCallback\(\(\) => \{([\s\S]*?)\}, \[\]\);/,
  );
  assert.ok(openMatch, "regeneratePremium callback must exist with an empty dep array");
  assert.equal(
    /runPremium|fetchJsonWithTimeout|force_regenerate/.test(openMatch[1]),
    false,
    "regeneratePremium (the button handler) must ONLY open the modal, never call the API itself",
  );
  assert.ok(
    openMatch[1].includes("setShowRegenerateConfirm(true)"),
    "regeneratePremium must open the confirm modal",
  );

  const confirmMatch = src.match(
    /const confirmRegeneratePremium = useCallback\(\(\) => \{([\s\S]*?)\}, \[premiumKind, runPremium\]\);/,
  );
  assert.ok(confirmMatch, "confirmRegeneratePremium callback must exist");
  assert.ok(
    confirmMatch[1].includes("forceRegenerate: true") &&
      confirmMatch[1].includes("runPremium(premiumKind"),
    "confirmRegeneratePremium ('새로 분석하기') must be the only path sending force_regenerate:true",
  );

  const cancelMatch = src.match(
    /const cancelRegeneratePremium = useCallback\(\(\) => \{([\s\S]*?)\}, \[\]\);/,
  );
  assert.ok(cancelMatch, "cancelRegeneratePremium callback must exist");
  assert.equal(
    /runPremium|fetch/.test(cancelMatch[1]),
    false,
    "cancelRegeneratePremium ('기존 분석 보기') must never touch the network — API/LLM/credit usage 0",
  );
  ok("regenerate flow: open-modal / view-saved(no-op) / create-new(force_regenerate) are cleanly separated");
}

section("E. Modal component + i18n copy wired correctly");
{
  const dialogSrc = readSrc("components/relationship/detail/RegenerateConfirmDialog.tsx");
  for (const key of [
    "regenerateModalTitle",
    "regenerateModalBody",
    "regenerateModalViewSaved",
    "regenerateModalCreateNew",
    "regenerateModalFooterNotice",
    "regenerateModalRefundLink",
  ]) {
    assert.ok(dialogSrc.includes(key), `dialog must render messages.report.${key}`);
  }
  assert.ok(dialogSrc.includes("onViewSaved"), "dialog must expose an onViewSaved (view-saved) action");
  assert.ok(dialogSrc.includes("onCreateNew"), "dialog must expose an onCreateNew (create-new) action");

  for (const [label, file] of [
    ["ko-KR", "lib/i18n/messages/ko-KR.ts"],
    ["en-US", "lib/i18n/messages/en-US.ts"],
  ]) {
    const msgSrc = readSrc(file);
    assert.equal(msgSrc.includes("regenerateConfirm:"), false, `${label}: old regenerateConfirm key must be removed`);
    for (const key of [
      "regenerateModalTitle",
      "regenerateModalBody",
      "regenerateModalViewSaved",
      "regenerateModalCreateNew",
      "regenerateModalFooterNotice",
      "regenerateModalRefundLink",
    ]) {
      assert.ok(msgSrc.includes(`${key}:`), `${label}: missing ${key}`);
    }
  }
  ok("modal + both locales carry the exact agreed-on copy keys, old key fully removed");
}

section("F. RelationshipView wires the modal to the hook's three new controls");
{
  const src = readSrc("app/relationship/[id]/RelationshipView.tsx");
  assert.ok(src.includes("RegenerateConfirmDialog"), "must render the new dialog");
  assert.ok(src.includes("open={showRegenerateConfirm}"));
  assert.ok(src.includes("onViewSaved={cancelRegeneratePremium}"));
  assert.ok(src.includes("onCreateNew={confirmRegeneratePremium}"));
  ok("RelationshipView renders RegenerateConfirmDialog wired to the hook's state/handlers");
}

console.log(`\n${passed} passed`);
